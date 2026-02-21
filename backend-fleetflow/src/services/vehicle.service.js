const prisma = require('../config/db');
const { NotFoundError, BadRequestError, ConflictError } = require('../errors');
const { validateTransition, VehicleStatus } = require('../enums');

/**
 * Get all vehicles with optional filters
 */
const getAll = async (query = {}) => {
  const where = {};
  if (query.status) where.status = query.status;
  if (query.vehicle_type) where.vehicle_type = query.vehicle_type;
  if (query.region) where.region = { contains: query.region, mode: 'insensitive' };

  return prisma.vehicle.findMany({
    where,
    orderBy: { created_at: 'desc' },
    include: { _count: { select: { trips: true } } },
  });
};

/**
 * Get all vehicles with Available status (for trip assignment dropdowns)
 */
const getAvailable = async () => {
  return prisma.vehicle.findMany({
    where: { status: VehicleStatus.AVAILABLE },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, license_plate: true, vehicle_type: true, max_capacity_kg: true },
  });
};

/**
 * Get a single vehicle by ID
 */
const getById = async (id) => {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      trips: { take: 5, orderBy: { created_at: 'desc' } },
      maintenance_logs: { take: 5, orderBy: { service_date: 'desc' } },
      fuel_logs: { take: 5, orderBy: { date: 'desc' } },
    },
  });

  if (!vehicle) throw new NotFoundError('Vehicle not found.');
  return vehicle;
};

/**
 * Create a new vehicle — checks for duplicate license_plate explicitly
 */
const create = async (data) => {
  // Explicit duplicate license plate check with clear error message
  const existing = await prisma.vehicle.findUnique({
    where: { license_plate: data.license_plate },
  });
  if (existing) {
    throw new ConflictError(`A vehicle with license plate "${data.license_plate}" already exists.`);
  }

  // Validate capacity is positive
  if (data.max_capacity_kg <= 0) {
    throw new BadRequestError('max_capacity_kg must be a positive number.');
  }

  return prisma.vehicle.create({ data });
};

/**
 * Update a vehicle — prevents updating Retired vehicles and duplicate plates
 */
const update = async (id, data) => {
  const vehicle = await getById(id);

  // Prevent updates to Retired vehicles
  if (vehicle.status === VehicleStatus.RETIRED) {
    throw new BadRequestError('Cannot update a retired vehicle.');
  }

  // If license_plate is being changed, check for duplicates
  if (data.license_plate && data.license_plate !== vehicle.license_plate) {
    const duplicate = await prisma.vehicle.findUnique({
      where: { license_plate: data.license_plate },
    });
    if (duplicate) {
      throw new ConflictError(`A vehicle with license plate "${data.license_plate}" already exists.`);
    }
  }

  // Validate capacity if provided
  if (data.max_capacity_kg !== undefined && data.max_capacity_kg <= 0) {
    throw new BadRequestError('max_capacity_kg must be a positive number.');
  }

  return prisma.vehicle.update({ where: { id }, data });
};

/**
 * Change vehicle status with transition validation
 */
const changeStatus = async (id, newStatus) => {
  const vehicle = await getById(id);
  validateTransition('vehicle', vehicle.status, newStatus);

  return prisma.vehicle.update({
    where: { id },
    data: { status: newStatus },
  });
};

/**
 * Delete a vehicle
 * - Only vehicles with status 'Available' can be deleted
 * - Retired vehicles must NEVER be deleted
 */
const remove = async (id) => {
  const vehicle = await getById(id);

  if (vehicle.status === VehicleStatus.RETIRED) {
    throw new BadRequestError('Retired vehicles cannot be deleted. They are kept for historical records.');
  }

  if (vehicle.status !== VehicleStatus.AVAILABLE) {
    throw new BadRequestError(
      `Cannot delete vehicle with status "${vehicle.status.replace('_', ' ')}". Only "Available" vehicles can be deleted.`
    );
  }

  // Check for active trips before deleting
  const activeTrips = await prisma.trip.count({
    where: {
      vehicle_id: id,
      status: { in: ['Draft', 'Dispatched'] },
    },
  });
  if (activeTrips > 0) {
    throw new BadRequestError(`Cannot delete vehicle with ${activeTrips} active trip(s). Cancel or complete them first.`);
  }

  // Manually delete related records to simulate cascade delete
  await prisma.maintenanceLog.deleteMany({ where: { vehicle_id: id } });
  await prisma.fuelLog.deleteMany({ where: { vehicle_id: id } });

  // Detach any completed/cancelled trips from this vehicle (or you can decide to delete them)
  // We will detach them to keep historical trip data
  await prisma.trip.updateMany({
    where: { vehicle_id: id },
    data: { vehicle_id: null },
  });

  return prisma.vehicle.delete({ where: { id } });
};

module.exports = { getAll, getAvailable, getById, create, update, changeStatus, remove };
