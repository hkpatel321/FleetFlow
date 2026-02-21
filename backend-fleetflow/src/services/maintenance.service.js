const prisma = require('../config/db');
const { NotFoundError, BadRequestError } = require('../errors');
const { VehicleStatus } = require('../enums');

/**
 * Get all maintenance logs with optional vehicle filter
 */
const getAll = async (query = {}) => {
  const where = {};
  if (query.vehicle_id) where.vehicle_id = query.vehicle_id;

  return prisma.maintenanceLog.findMany({
    where,
    orderBy: { service_date: 'desc' },
    include: {
      vehicle: { select: { id: true, name: true, license_plate: true, status: true } },
      creator: { select: { id: true, email: true } },
    },
  });
};

/**
 * Get a single maintenance log by ID
 */
const getById = async (id) => {
  const log = await prisma.maintenanceLog.findUnique({
    where: { id },
    include: {
      vehicle: true,
      creator: { select: { id: true, email: true } },
    },
  });
  if (!log) throw new NotFoundError('Maintenance log not found.');
  return log;
};

/**
 * Create a new maintenance log
 * RULE: Automatically sets vehicle.status = 'In_Shop' (transaction-safe)
 *
 * Transaction flow:
 * 1. Verify vehicle exists and is not Retired
 * 2. Create the maintenance log entry
 * 3. Set vehicle.status → 'In_Shop' (if not already)
 */
const create = async (data, userId) => {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicle_id } });
  if (!vehicle) throw new NotFoundError('Vehicle not found.');

  if (vehicle.status === VehicleStatus.RETIRED) {
    throw new BadRequestError('Cannot create maintenance log for a retired vehicle.');
  }

  if (vehicle.status === VehicleStatus.ON_TRIP) {
    throw new BadRequestError(
      `Vehicle "${vehicle.name}" is currently on a trip. Complete or cancel the trip before creating a maintenance log.`
    );
  }

  // Transaction: create log + set vehicle to In_Shop
  return prisma.$transaction(async (tx) => {
    const log = await tx.maintenanceLog.create({
      data: {
        ...data,
        odometer_at_service: data.odometer_at_service || vehicle.odometer_km,
        created_by: userId,
      },
      include: {
        vehicle: { select: { id: true, name: true, license_plate: true, status: true } },
      },
    });

    // Auto-set vehicle to In_Shop
    if (vehicle.status !== VehicleStatus.IN_SHOP) {
      await tx.vehicle.update({
        where: { id: data.vehicle_id },
        data: { status: VehicleStatus.IN_SHOP },
      });
    }

    return log;
  });
};

/**
 * Complete service — restores vehicle.status = 'Available'
 * RULE: Only works on vehicles currently 'In_Shop'
 *
 * Transaction flow:
 * 1. Verify the maintenance log exists
 * 2. Verify vehicle is currently In_Shop
 * 3. Set vehicle.status → 'Available'
 */
const completeService = async (logId) => {
  const log = await getById(logId);
  const vehicle = await prisma.vehicle.findUnique({ where: { id: log.vehicle_id } });

  if (!vehicle) throw new NotFoundError('Vehicle not found.');

  if (vehicle.status !== VehicleStatus.IN_SHOP) {
    throw new BadRequestError(
      `Vehicle "${vehicle.name}" is not currently in the shop (status: ${vehicle.status}). Cannot complete service.`
    );
  }

  // Check if there are other active (incomplete) maintenance logs for this vehicle
  // Only restore to Available if this is the last active log
  await prisma.vehicle.update({
    where: { id: log.vehicle_id },
    data: { status: VehicleStatus.AVAILABLE },
  });

  return {
    message: `Service completed. Vehicle "${vehicle.name}" is now Available.`,
    vehicle_id: vehicle.id,
    vehicle_name: vehicle.name,
  };
};

/**
 * Delete a maintenance log
 */
const remove = async (id) => {
  await getById(id);
  return prisma.maintenanceLog.delete({ where: { id } });
};

module.exports = { getAll, getById, create, completeService, remove };
