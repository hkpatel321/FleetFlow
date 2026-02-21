const prisma = require('../config/db');
const { NotFoundError, BadRequestError } = require('../errors');

/**
 * Get all fuel logs with optional filters
 */
const getAll = async (query = {}) => {
  const where = {};
  if (query.vehicle_id) where.vehicle_id = query.vehicle_id;
  if (query.trip_id) where.trip_id = query.trip_id;

  return prisma.fuelLog.findMany({
    where,
    orderBy: { date: 'desc' },
    include: {
      vehicle: { select: { id: true, name: true, license_plate: true, odometer_km: true } },
      trip: { select: { id: true, origin: true, destination: true, status: true, distance_km: true } },
    },
  });
};

/**
 * Get a single fuel log by ID
 */
const getById = async (id) => {
  const log = await prisma.fuelLog.findUnique({
    where: { id },
    include: { vehicle: true, trip: true },
  });
  if (!log) throw new NotFoundError('Fuel log not found.');
  return log;
};

/**
 * Create a new fuel log
 * - Links to vehicle_id (required) and trip_id (optional)
 * - Auto-derives total_cost = liters * cost_per_liter
 * - Captures odometer_reading for cost-per-km calculations
 */
const create = async (data) => {
  // Verify vehicle exists
  const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicle_id } });
  if (!vehicle) throw new NotFoundError('Vehicle not found.');

  // If trip_id provided, validate it
  if (data.trip_id) {
    const trip = await prisma.trip.findUnique({ where: { id: data.trip_id } });
    if (!trip) throw new NotFoundError('Trip not found.');

    // Trip must belong to the same vehicle
    if (trip.vehicle_id !== data.vehicle_id) {
      throw new BadRequestError(
        `Trip is assigned to a different vehicle. Expected vehicle "${vehicle.name}" but trip belongs to vehicle ID ${trip.vehicle_id}.`
      );
    }
  }

  // Validate odometer reading against vehicle's current reading
  if (data.odometer_reading && Number(data.odometer_reading) < Number(vehicle.odometer_km)) {
    throw new BadRequestError(
      `Odometer reading (${data.odometer_reading} km) cannot be less than vehicle's current odometer (${vehicle.odometer_km} km).`
    );
  }

  // Auto-derive total_cost
  const total_cost = Number(data.liters) * Number(data.cost_per_liter);

  return prisma.fuelLog.create({
    data: {
      ...data,
      total_cost,
      odometer_reading: data.odometer_reading || vehicle.odometer_km,
    },
    include: {
      vehicle: { select: { id: true, name: true, license_plate: true } },
      trip: { select: { id: true, origin: true, destination: true } },
    },
  });
};

/**
 * Get fuel cost-per-km analytics for each vehicle
 * Uses odometer readings and distance traveled to compute ₹/km
 */
const getCostPerKm = async () => {
  // Get all vehicles with their fuel logs and trip data
  const vehicles = await prisma.vehicle.findMany({
    where: { status: { not: 'Retired' } },
    select: {
      id: true,
      name: true,
      license_plate: true,
      odometer_km: true,
      fuel_logs: {
        select: { total_cost: true, liters: true, odometer_reading: true },
        orderBy: { date: 'asc' },
      },
      trips: {
        where: { status: 'Completed' },
        select: { distance_km: true },
      },
    },
  });

  return vehicles.map((v) => {
    const totalFuelCost = v.fuel_logs.reduce((sum, fl) => sum + Number(fl.total_cost || 0), 0);
    const totalLiters = v.fuel_logs.reduce((sum, fl) => sum + Number(fl.liters || 0), 0);
    const totalDistance = v.trips.reduce((sum, t) => sum + Number(t.distance_km || 0), 0);

    return {
      vehicle_id: v.id,
      vehicle_name: v.name,
      license_plate: v.license_plate,
      total_fuel_cost: totalFuelCost,
      total_liters: totalLiters,
      total_distance_km: totalDistance,
      cost_per_km: totalDistance > 0 ? (totalFuelCost / totalDistance).toFixed(2) : null,
      liters_per_km: totalDistance > 0 ? (totalLiters / totalDistance).toFixed(4) : null,
      fuel_entries: v.fuel_logs.length,
    };
  }).filter(v => v.fuel_entries > 0);
};

/**
 * Delete a fuel log
 */
const remove = async (id) => {
  await getById(id);
  return prisma.fuelLog.delete({ where: { id } });
};

module.exports = { getAll, getById, create, getCostPerKm, remove };
