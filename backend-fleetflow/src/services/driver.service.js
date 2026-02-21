const prisma = require('../config/db');
const { NotFoundError, BadRequestError, ConflictError } = require('../errors');
const { validateTransition, DriverStatus } = require('../enums');

// ─── License Category → Vehicle Type Mapping ─────────────
// Defines which license categories can drive which vehicle types
const CATEGORY_TO_VEHICLE_TYPE = {
  HMV: ['Truck'],
  LMV: ['Van', 'Truck'],
  MCWG: ['Bike'],
  MCWOG: ['Bike'],
};

/**
 * Check if a driver's license categories allow them to drive a vehicle type
 */
const canDriveVehicleType = (licenseCategories, vehicleType) => {
  if (!licenseCategories || licenseCategories.length === 0) return false;
  return licenseCategories.some((cat) => {
    const allowed = CATEGORY_TO_VEHICLE_TYPE[cat.toUpperCase()];
    return allowed && allowed.includes(vehicleType);
  });
};

/**
 * Get all drivers with optional filters
 */
const getAll = async (query = {}) => {
  const where = {};
  if (query.status) where.status = query.status;
  if (query.search) {
    where.OR = [
      { full_name: { contains: query.search, mode: 'insensitive' } },
      { license_number: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const drivers = await prisma.driver.findMany({
    where,
    orderBy: { created_at: 'desc' },
    include: { _count: { select: { trips: true } } },
  });

  // Flag expired licenses in the response
  const now = new Date();
  return drivers.map((d) => ({
    ...d,
    license_expired: new Date(d.license_expiry_date) < now,
  }));
};

/**
 * Get a single driver by ID
 */
const getById = async (id) => {
  const driver = await prisma.driver.findUnique({
    where: { id },
    include: {
      trips: { take: 10, orderBy: { created_at: 'desc' } },
    },
  });

  if (!driver) throw new NotFoundError('Driver not found.');
  return driver;
};

/**
 * Create a new driver — validates unique license_number and future expiry
 */
const create = async (data) => {
  // Explicit unique license_number check
  const existing = await prisma.driver.findUnique({
    where: { license_number: data.license_number },
  });
  if (existing) {
    throw new ConflictError(`A driver with license number "${data.license_number}" already exists.`);
  }

  // Ensure expiry date is in the future (double-check beyond validator)
  if (new Date(data.license_expiry_date) < new Date()) {
    throw new BadRequestError('License expiry date must be in the future.');
  }

  return prisma.driver.create({ data });
};

/**
 * Update a driver — validates unique license_number on change
 */
const update = async (id, data) => {
  const driver = await getById(id);

  // If license_number is being changed, check for duplicates
  if (data.license_number && data.license_number !== driver.license_number) {
    const duplicate = await prisma.driver.findUnique({
      where: { license_number: data.license_number },
    });
    if (duplicate) {
      throw new ConflictError(`A driver with license number "${data.license_number}" already exists.`);
    }
  }

  // If expiry date is being changed, must be in the future
  if (data.license_expiry_date && new Date(data.license_expiry_date) < new Date()) {
    throw new BadRequestError('License expiry date must be in the future.');
  }

  return prisma.driver.update({ where: { id }, data });
};

/**
 * Change driver status with transition validation
 */
const changeStatus = async (id, newStatus) => {
  const driver = await getById(id);
  validateTransition('driver', driver.status, newStatus);

  // Prevent setting to On_Duty if license is expired — must stay Suspended
  if (newStatus === DriverStatus.ON_DUTY) {
    if (new Date(driver.license_expiry_date) < new Date()) {
      throw new BadRequestError(
        `Cannot set driver "${driver.full_name}" to On Duty — license expired on ${new Date(driver.license_expiry_date).toLocaleDateString()}. Renew license first.`
      );
    }
  }

  return prisma.driver.update({
    where: { id },
    data: { status: newStatus },
  });
};

/**
 * Auto-suspend all drivers with expired licenses
 * Called periodically or on-demand to enforce rule #4
 */
const autoSuspendExpired = async () => {
  const now = new Date();

  // Find all non-suspended drivers with expired licenses
  const expiredDrivers = await prisma.driver.findMany({
    where: {
      license_expiry_date: { lt: now },
      status: { notIn: ['Suspended', 'On_Trip'] }, // don't suspend mid-trip
    },
  });

  if (expiredDrivers.length === 0) return { suspended: 0, drivers: [] };

  // Suspend them all
  const results = await Promise.all(
    expiredDrivers.map((d) =>
      prisma.driver.update({
        where: { id: d.id },
        data: { status: DriverStatus.SUSPENDED },
        select: { id: true, full_name: true, license_expiry_date: true },
      })
    )
  );

  return { suspended: results.length, drivers: results };
};

/**
 * Validate driver-vehicle compatibility for trip assignment
 * Checks license_category against vehicle.vehicle_type
 */
const validateDriverVehicleMatch = async (driverId, vehicleId) => {
  const [driver, vehicle] = await Promise.all([
    prisma.driver.findUnique({ where: { id: driverId } }),
    prisma.vehicle.findUnique({ where: { id: vehicleId } }),
  ]);

  if (!driver) throw new NotFoundError('Driver not found.');
  if (!vehicle) throw new NotFoundError('Vehicle not found.');

  if (!canDriveVehicleType(driver.license_category, vehicle.vehicle_type)) {
    throw new BadRequestError(
      `Driver "${driver.full_name}" (categories: ${driver.license_category.join(', ')}) ` +
      `is not licensed to drive a ${vehicle.vehicle_type}. ` +
      `Required: ${Object.entries(CATEGORY_TO_VEHICLE_TYPE)
        .filter(([, types]) => types.includes(vehicle.vehicle_type))
        .map(([cat]) => cat)
        .join(' or ')}`
    );
  }

  return true;
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  changeStatus,
  autoSuspendExpired,
  validateDriverVehicleMatch,
  canDriveVehicleType,
  CATEGORY_TO_VEHICLE_TYPE,
};
