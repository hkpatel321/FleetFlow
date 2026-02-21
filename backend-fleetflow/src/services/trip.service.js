const prisma = require('../config/db');
const { NotFoundError, BadRequestError } = require('../errors');
const { validateTransition, VehicleStatus, DriverStatus, TripStatus } = require('../enums');

/**
 * Get all trips with optional filters
 */
const getAll = async (query = {}) => {
  const where = {};
  if (query.status) where.status = query.status;
  if (query.vehicle_id) where.vehicle_id = query.vehicle_id;
  if (query.driver_id) where.driver_id = query.driver_id;

  return prisma.trip.findMany({
    where,
    orderBy: { created_at: 'desc' },
    include: {
      vehicle: { select: { id: true, name: true, license_plate: true } },
      driver: { select: { id: true, full_name: true } },
      creator: { select: { id: true, email: true } },
    },
  });
};

/**
 * Get a single trip by ID
 */
const getById = async (id) => {
  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      vehicle: true,
      driver: true,
      creator: { select: { id: true, email: true } },
      fuel_logs: true,
    },
  });

  if (!trip) throw new NotFoundError('Trip not found.');
  return trip;
};

/**
 * Create a new trip (Draft status)
 */
const create = async (data, userId) => {
  return prisma.trip.create({
    data: {
      ...data,
      status: TripStatus.DRAFT,
      created_by: userId,
    },
    include: {
      vehicle: { select: { id: true, name: true, license_plate: true } },
      driver: { select: { id: true, full_name: true } },
    },
  });
};

/**
 * Dispatch a trip — enforces all business rules
 */
const dispatch = async (tripId) => {
  const trip = await getById(tripId);
  validateTransition('trip', trip.status, TripStatus.DISPATCHED);

  if (!trip.vehicle_id || !trip.driver_id) {
    throw new BadRequestError('Trip must have a vehicle and driver assigned before dispatch.');
  }

  // Validate vehicle
  const vehicle = await prisma.vehicle.findUnique({ where: { id: trip.vehicle_id } });
  if (!vehicle) throw new NotFoundError('Assigned vehicle not found.');
  if (vehicle.status !== VehicleStatus.AVAILABLE) {
    throw new BadRequestError(`Vehicle "${vehicle.name}" is not available (current: ${vehicle.status}).`);
  }
  if (Number(trip.cargo_weight_kg) > Number(vehicle.max_capacity_kg)) {
    throw new BadRequestError(
      `Cargo weight (${trip.cargo_weight_kg}kg) exceeds vehicle capacity (${vehicle.max_capacity_kg}kg).`
    );
  }

  // Validate driver
  const driver = await prisma.driver.findUnique({ where: { id: trip.driver_id } });
  if (!driver) throw new NotFoundError('Assigned driver not found.');
  if (driver.status !== DriverStatus.ON_DUTY) {
    throw new BadRequestError(`Driver "${driver.full_name}" is not on duty (current: ${driver.status}).`);
  }
  if (new Date(driver.license_expiry_date) < new Date()) {
    // Auto-suspend the driver with expired license
    await prisma.driver.update({
      where: { id: trip.driver_id },
      data: { status: DriverStatus.SUSPENDED },
    });
    throw new BadRequestError(
      `Driver "${driver.full_name}" has an expired license (expired: ${new Date(driver.license_expiry_date).toLocaleDateString()}). Driver has been auto-suspended.`
    );
  }

  // Validate license category matches vehicle type
  const driverService = require('./driver.service');
  if (!driverService.canDriveVehicleType(driver.license_category, vehicle.vehicle_type)) {
    throw new BadRequestError(
      `Driver "${driver.full_name}" (categories: ${driver.license_category.join(', ')}) ` +
      `is not licensed to drive a ${vehicle.vehicle_type}. ` +
      `Required: ${Object.entries(driverService.CATEGORY_TO_VEHICLE_TYPE)
        .filter(([, types]) => types.includes(vehicle.vehicle_type))
        .map(([cat]) => cat)
        .join(' or ')}`
    );
  }

  // Perform transactional update
  return prisma.$transaction(async (tx) => {
    // Update vehicle status
    await tx.vehicle.update({
      where: { id: trip.vehicle_id },
      data: { status: VehicleStatus.ON_TRIP },
    });

    // Update driver status
    await tx.driver.update({
      where: { id: trip.driver_id },
      data: { status: DriverStatus.ON_TRIP },
    });

    // Update trip
    const updated = await tx.trip.update({
      where: { id: tripId },
      data: {
        status: TripStatus.DISPATCHED,
        dispatched_at: new Date(),
        start_odometer: vehicle.odometer_km,
      },
      include: {
        vehicle: { select: { id: true, name: true, license_plate: true, status: true } },
        driver: { select: { id: true, full_name: true, status: true } },
      },
    });

    // Increment driver total_trips
    await tx.driver.update({
      where: { id: trip.driver_id },
      data: { total_trips: { increment: 1 } },
    });

    return updated;
  });
};

/**
 * Complete a trip — requires end_odometer, updates vehicle/driver
 */
const complete = async (tripId, data) => {
  const trip = await getById(tripId);
  validateTransition('trip', trip.status, TripStatus.COMPLETED);

  if (!data.end_odometer) {
    throw new BadRequestError('end_odometer is required to complete a trip.');
  }

  const startOdo = Number(trip.start_odometer || 0);
  if (Number(data.end_odometer) <= startOdo) {
    throw new BadRequestError('end_odometer must be greater than start_odometer.');
  }

  // Auto-calculate distance
  const distance_km = Number(data.end_odometer) - startOdo;

  return prisma.$transaction(async (tx) => {
    // Update vehicle: set odometer, set back to Available
    if (trip.vehicle_id) {
      await tx.vehicle.update({
        where: { id: trip.vehicle_id },
        data: {
          status: VehicleStatus.AVAILABLE,
          odometer_km: data.end_odometer,
        },
      });
    }

    // Update driver: set back to On Duty, increment completed_trips
    if (trip.driver_id) {
      await tx.driver.update({
        where: { id: trip.driver_id },
        data: {
          status: DriverStatus.ON_DUTY,
          completed_trips: { increment: 1 },
        },
      });
    }

    // Update trip with distance_km auto-calculated
    return tx.trip.update({
      where: { id: tripId },
      data: {
        status: TripStatus.COMPLETED,
        end_odometer: data.end_odometer,
        distance_km,
        revenue: data.revenue || trip.revenue,
        completed_at: new Date(),
      },
      include: {
        vehicle: { select: { id: true, name: true, license_plate: true, status: true } },
        driver: { select: { id: true, full_name: true, status: true } },
      },
    });
  });
};

/**
 * Cancel a trip — releases vehicle/driver if dispatched
 */
const cancel = async (tripId) => {
  const trip = await getById(tripId);
  validateTransition('trip', trip.status, TripStatus.CANCELLED);

  return prisma.$transaction(async (tx) => {
    // If trip was dispatched, release vehicle and driver
    if (trip.status === TripStatus.DISPATCHED) {
      if (trip.vehicle_id) {
        await tx.vehicle.update({
          where: { id: trip.vehicle_id },
          data: { status: VehicleStatus.AVAILABLE },
        });
      }
      if (trip.driver_id) {
        await tx.driver.update({
          where: { id: trip.driver_id },
          data: { status: DriverStatus.ON_DUTY },
        });
      }
    }

    return tx.trip.update({
      where: { id: tripId },
      data: { status: TripStatus.CANCELLED },
      include: {
        vehicle: { select: { id: true, name: true, license_plate: true } },
        driver: { select: { id: true, full_name: true } },
      },
    });
  });
};

module.exports = { getAll, getById, create, dispatch, complete, cancel };
