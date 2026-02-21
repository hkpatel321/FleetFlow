const prisma = require('../config/db');

// ─── EXISTING BASIC ANALYTICS ────────────────────────────

/**
 * Fleet summary — vehicle counts by status
 */
const getFleetSummary = async () => {
  const [vehicles, statusCounts, typeCounts] = await Promise.all([
    prisma.vehicle.count(),
    prisma.vehicle.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
    prisma.vehicle.groupBy({
      by: ['vehicle_type'],
      _count: { id: true },
    }),
  ]);

  return {
    total_vehicles: vehicles,
    by_status: statusCounts.reduce((acc, s) => ({ ...acc, [s.status]: s._count.id }), {}),
    by_type: typeCounts.reduce((acc, t) => ({ ...acc, [t.vehicle_type]: t._count.id }), {}),
  };
};

/**
 * Trip statistics — counts, revenue, distance
 */
const getTripStats = async () => {
  const [total, statusCounts, revenueAgg] = await Promise.all([
    prisma.trip.count(),
    prisma.trip.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
    prisma.trip.aggregate({
      where: { status: 'Completed' },
      _sum: { revenue: true, distance_km: true },
      _avg: { revenue: true },
      _count: { id: true },
    }),
  ]);

  return {
    total_trips: total,
    by_status: statusCounts.reduce((acc, s) => ({ ...acc, [s.status]: s._count.id }), {}),
    completed: {
      count: revenueAgg._count.id,
      total_revenue: revenueAgg._sum.revenue || 0,
      avg_revenue: revenueAgg._avg.revenue || 0,
      total_distance_km: revenueAgg._sum.distance_km || 0,
    },
  };
};

/**
 * Fuel cost analytics — total spend, by vehicle
 */
const getFuelCosts = async () => {
  const [totalAgg, byVehicle] = await Promise.all([
    prisma.fuelLog.aggregate({
      _sum: { total_cost: true, liters: true },
      _count: { id: true },
    }),
    prisma.fuelLog.groupBy({
      by: ['vehicle_id'],
      _sum: { total_cost: true, liters: true },
      _count: { id: true },
    }),
  ]);

  const vehicleIds = byVehicle.map((v) => v.vehicle_id);
  const vehicles = await prisma.vehicle.findMany({
    where: { id: { in: vehicleIds } },
    select: { id: true, name: true, license_plate: true },
  });
  const vehicleMap = vehicles.reduce((m, v) => ({ ...m, [v.id]: v }), {});

  return {
    total_fuel_cost: totalAgg._sum.total_cost || 0,
    total_liters: totalAgg._sum.liters || 0,
    total_entries: totalAgg._count.id,
    by_vehicle: byVehicle.map((v) => ({
      vehicle: vehicleMap[v.vehicle_id] || { id: v.vehicle_id },
      total_cost: v._sum.total_cost || 0,
      total_liters: v._sum.liters || 0,
      entries: v._count.id,
    })),
  };
};

/**
 * Maintenance cost analytics
 */
const getMaintenanceCosts = async () => {
  const [totalAgg, byVehicle] = await Promise.all([
    prisma.maintenanceLog.aggregate({
      _sum: { cost: true },
      _count: { id: true },
    }),
    prisma.maintenanceLog.groupBy({
      by: ['vehicle_id'],
      _sum: { cost: true },
      _count: { id: true },
    }),
  ]);

  const vehicleIds = byVehicle.map((v) => v.vehicle_id);
  const vehicles = await prisma.vehicle.findMany({
    where: { id: { in: vehicleIds } },
    select: { id: true, name: true, license_plate: true },
  });
  const vehicleMap = vehicles.reduce((m, v) => ({ ...m, [v.id]: v }), {});

  return {
    total_maintenance_cost: totalAgg._sum.cost || 0,
    total_entries: totalAgg._count.id,
    by_vehicle: byVehicle.map((v) => ({
      vehicle: vehicleMap[v.vehicle_id] || { id: v.vehicle_id },
      total_cost: v._sum.cost || 0,
      entries: v._count.id,
    })),
  };
};

/**
 * Driver performance summary
 */
const getDriverPerformance = async () => {
  const drivers = await prisma.driver.findMany({
    select: {
      id: true,
      full_name: true,
      status: true,
      safety_score: true,
      total_trips: true,
      completed_trips: true,
      license_expiry_date: true,
    },
    orderBy: { safety_score: 'desc' },
  });

  const now = new Date();
  return drivers.map((d) => ({
    ...d,
    completion_rate: d.total_trips > 0
      ? ((d.completed_trips / d.total_trips) * 100).toFixed(1)
      : '0.0',
    license_expired: new Date(d.license_expiry_date) < now,
  }));
};

// ─── NEW ADVANCED ANALYTICS ──────────────────────────────

/**
 * FUEL EFFICIENCY per vehicle
 * Formula: distance_km (from completed trips) / liters (from fuel_logs)
 *
 * Equivalent SQL:
 *   SELECT v.id, v.name, v.license_plate,
 *     COALESCE(SUM(t.distance_km), 0) AS total_distance,
 *     COALESCE(SUM(fl.liters), 0) AS total_liters,
 *     CASE WHEN SUM(fl.liters) > 0
 *       THEN SUM(t.distance_km) / SUM(fl.liters)
 *       ELSE NULL
 *     END AS fuel_efficiency_km_per_liter
 *   FROM vehicles v
 *   LEFT JOIN trips t ON t.vehicle_id = v.id AND t.status = 'Completed'
 *   LEFT JOIN fuel_logs fl ON fl.vehicle_id = v.id
 *   GROUP BY v.id
 *   ORDER BY fuel_efficiency_km_per_liter DESC NULLS LAST;
 */
const getFuelEfficiency = async () => {
  const vehicles = await prisma.vehicle.findMany({
    select: {
      id: true,
      name: true,
      license_plate: true,
      vehicle_type: true,
      trips: {
        where: { status: 'Completed' },
        select: { distance_km: true },
      },
      fuel_logs: {
        select: { liters: true, total_cost: true },
      },
    },
  });

  const result = vehicles.map((v) => {
    const totalDistance = v.trips.reduce((sum, t) => sum + Number(t.distance_km || 0), 0);
    const totalLiters = v.fuel_logs.reduce((sum, f) => sum + Number(f.liters || 0), 0);
    const totalFuelCost = v.fuel_logs.reduce((sum, f) => sum + Number(f.total_cost || 0), 0);

    return {
      vehicle_id: v.id,
      vehicle_name: v.name,
      license_plate: v.license_plate,
      vehicle_type: v.vehicle_type,
      total_distance_km: totalDistance,
      total_liters: totalLiters,
      total_fuel_cost: totalFuelCost,
      fuel_efficiency_km_per_liter: totalLiters > 0 ? (totalDistance / totalLiters).toFixed(2) : null,
      cost_per_km: totalDistance > 0 ? (totalFuelCost / totalDistance).toFixed(2) : null,
    };
  })
    .filter((v) => v.total_liters > 0 || v.total_distance_km > 0)
    .sort((a, b) => (Number(b.fuel_efficiency_km_per_liter) || 0) - (Number(a.fuel_efficiency_km_per_liter) || 0));

  // Fleet-wide averages
  const totalDistance = result.reduce((s, v) => s + v.total_distance_km, 0);
  const totalLiters = result.reduce((s, v) => s + v.total_liters, 0);

  return {
    fleet_average_km_per_liter: totalLiters > 0 ? (totalDistance / totalLiters).toFixed(2) : null,
    vehicles: result,
  };
};

/**
 * VEHICLE ROI per vehicle
 * Formula: (SUM(trips.revenue) - SUM(fuel_logs.total_cost + maintenance_logs.cost)) / vehicles.acquisition_cost
 *
 * Equivalent SQL:
 *   SELECT v.id, v.name, v.license_plate, v.acquisition_cost,
 *     COALESCE(trip_revenue.total, 0) AS total_revenue,
 *     COALESCE(fuel_cost.total, 0) AS total_fuel_cost,
 *     COALESCE(maint_cost.total, 0) AS total_maintenance_cost,
 *     (COALESCE(trip_revenue.total, 0) - COALESCE(fuel_cost.total, 0) - COALESCE(maint_cost.total, 0))
 *       AS net_profit,
 *     CASE WHEN v.acquisition_cost > 0
 *       THEN (COALESCE(trip_revenue.total, 0) - COALESCE(fuel_cost.total, 0) - COALESCE(maint_cost.total, 0))
 *            / v.acquisition_cost * 100
 *       ELSE NULL
 *     END AS roi_percentage
 *   FROM vehicles v
 *   LEFT JOIN (SELECT vehicle_id, SUM(revenue) AS total FROM trips WHERE status='Completed' GROUP BY vehicle_id) trip_revenue ON trip_revenue.vehicle_id = v.id
 *   LEFT JOIN (SELECT vehicle_id, SUM(total_cost) AS total FROM fuel_logs GROUP BY vehicle_id) fuel_cost ON fuel_cost.vehicle_id = v.id
 *   LEFT JOIN (SELECT vehicle_id, SUM(cost) AS total FROM maintenance_logs GROUP BY vehicle_id) maint_cost ON maint_cost.vehicle_id = v.id
 *   ORDER BY roi_percentage DESC NULLS LAST;
 */
const getVehicleROI = async () => {
  const vehicles = await prisma.vehicle.findMany({
    select: {
      id: true,
      name: true,
      license_plate: true,
      vehicle_type: true,
      acquisition_cost: true,
      created_at: true,
      trips: {
        where: { status: 'Completed' },
        select: { revenue: true },
      },
      fuel_logs: {
        select: { total_cost: true },
      },
      maintenance_logs: {
        select: { cost: true },
      },
    },
  });

  const result = vehicles.map((v) => {
    const totalRevenue = v.trips.reduce((sum, t) => sum + Number(t.revenue || 0), 0);
    const totalFuelCost = v.fuel_logs.reduce((sum, f) => sum + Number(f.total_cost || 0), 0);
    const totalMaintCost = v.maintenance_logs.reduce((sum, m) => sum + Number(m.cost || 0), 0);
    const totalCosts = totalFuelCost + totalMaintCost;
    const netProfit = totalRevenue - totalCosts;
    const acqCost = Number(v.acquisition_cost || 0);

    return {
      vehicle_id: v.id,
      vehicle_name: v.name,
      license_plate: v.license_plate,
      vehicle_type: v.vehicle_type,
      acquisition_cost: acqCost,
      total_revenue: totalRevenue,
      total_fuel_cost: totalFuelCost,
      total_maintenance_cost: totalMaintCost,
      total_costs: totalCosts,
      net_profit: netProfit,
      roi_percentage: acqCost > 0 ? ((netProfit / acqCost) * 100).toFixed(2) : null,
      profitable: netProfit > 0,
    };
  }).sort((a, b) => (Number(b.roi_percentage) || -Infinity) - (Number(a.roi_percentage) || -Infinity));

  // Fleet totals
  const fleetRevenue = result.reduce((s, v) => s + v.total_revenue, 0);
  const fleetCosts = result.reduce((s, v) => s + v.total_costs, 0);

  return {
    fleet_total_revenue: fleetRevenue,
    fleet_total_costs: fleetCosts,
    fleet_net_profit: fleetRevenue - fleetCosts,
    vehicles: result,
  };
};

/**
 * UTILIZATION RATE per vehicle
 * Formula: (days_on_trip / total_days_since_creation) * 100
 * Uses trip dispatched_at → completed_at timestamps
 *
 * Equivalent SQL:
 *   SELECT v.id, v.name,
 *     EXTRACT(EPOCH FROM (NOW() - v.created_at)) / 86400 AS total_days,
 *     COALESCE(SUM(
 *       EXTRACT(EPOCH FROM (COALESCE(t.completed_at, NOW()) - t.dispatched_at)) / 86400
 *     ), 0) AS active_days,
 *     COALESCE(SUM(...) / NULLIF(EXTRACT(EPOCH FROM (NOW() - v.created_at)) / 86400, 0) * 100, 0)
 *       AS utilization_rate
 *   FROM vehicles v
 *   LEFT JOIN trips t ON t.vehicle_id = v.id AND t.status IN ('Dispatched', 'Completed')
 *   GROUP BY v.id
 *   ORDER BY utilization_rate DESC;
 */
const getUtilizationRate = async () => {
  const now = new Date();

  const vehicles = await prisma.vehicle.findMany({
    select: {
      id: true,
      name: true,
      license_plate: true,
      vehicle_type: true,
      status: true,
      created_at: true,
      trips: {
        where: {
          status: { in: ['Dispatched', 'Completed'] },
          dispatched_at: { not: null },
        },
        select: {
          dispatched_at: true,
          completed_at: true,
          status: true,
        },
      },
    },
  });

  const result = vehicles.map((v) => {
    const totalDays = Math.max(1, (now - new Date(v.created_at)) / (1000 * 60 * 60 * 24));

    // Sum up active trip days
    const activeDays = v.trips.reduce((sum, t) => {
      const start = new Date(t.dispatched_at);
      const end = t.completed_at ? new Date(t.completed_at) : now;
      const days = Math.max(0, (end - start) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);

    const utilizationRate = Math.min(100, (activeDays / totalDays) * 100);

    return {
      vehicle_id: v.id,
      vehicle_name: v.name,
      license_plate: v.license_plate,
      vehicle_type: v.vehicle_type,
      current_status: v.status,
      total_days: Math.round(totalDays),
      active_days: Number(activeDays.toFixed(1)),
      idle_days: Number((totalDays - activeDays).toFixed(1)),
      trip_count: v.trips.length,
      utilization_rate: Number(utilizationRate.toFixed(1)),
    };
  }).sort((a, b) => b.utilization_rate - a.utilization_rate);

  const avgUtilization = result.length > 0
    ? (result.reduce((s, v) => s + v.utilization_rate, 0) / result.length).toFixed(1)
    : '0.0';

  return {
    fleet_avg_utilization: Number(avgUtilization),
    vehicles: result,
  };
};

/**
 * DEAD STOCK VEHICLES — idle for more than X days (default 30)
 * A vehicle is "dead stock" if it hasn't been dispatched on any trip in the last X days
 *
 * Equivalent SQL:
 *   SELECT v.id, v.name, v.license_plate, v.status,
 *     MAX(t.dispatched_at) AS last_trip_date,
 *     EXTRACT(EPOCH FROM (NOW() - COALESCE(MAX(t.dispatched_at), v.created_at))) / 86400 AS idle_days
 *   FROM vehicles v
 *   LEFT JOIN trips t ON t.vehicle_id = v.id AND t.status IN ('Dispatched', 'Completed')
 *   WHERE v.status != 'Retired'
 *   GROUP BY v.id
 *   HAVING MAX(t.dispatched_at) IS NULL
 *      OR EXTRACT(EPOCH FROM (NOW() - MAX(t.dispatched_at))) / 86400 > :threshold
 *   ORDER BY idle_days DESC;
 */
const getDeadStock = async (thresholdDays = 30) => {
  const now = new Date();

  const vehicles = await prisma.vehicle.findMany({
    where: { status: { not: 'Retired' } },
    select: {
      id: true,
      name: true,
      license_plate: true,
      vehicle_type: true,
      status: true,
      created_at: true,
      acquisition_cost: true,
      trips: {
        where: {
          status: { in: ['Dispatched', 'Completed'] },
          dispatched_at: { not: null },
        },
        select: { dispatched_at: true },
        orderBy: { dispatched_at: 'desc' },
        take: 1, // only the most recent trip
      },
    },
  });

  const deadStock = vehicles
    .map((v) => {
      const lastTripDate = v.trips.length > 0
        ? new Date(v.trips[0].dispatched_at)
        : null;
      const referenceDate = lastTripDate || new Date(v.created_at);
      const idleDays = Math.floor((now - referenceDate) / (1000 * 60 * 60 * 24));

      return {
        vehicle_id: v.id,
        vehicle_name: v.name,
        license_plate: v.license_plate,
        vehicle_type: v.vehicle_type,
        current_status: v.status,
        acquisition_cost: Number(v.acquisition_cost || 0),
        last_trip_date: lastTripDate ? lastTripDate.toISOString().split('T')[0] : null,
        idle_days: idleDays,
        never_used: !lastTripDate,
      };
    })
    .filter((v) => v.idle_days >= thresholdDays)
    .sort((a, b) => b.idle_days - a.idle_days);

  const totalCapitalTied = deadStock.reduce((s, v) => s + v.acquisition_cost, 0);

  return {
    threshold_days: thresholdDays,
    dead_stock_count: deadStock.length,
    total_capital_tied_up: totalCapitalTied,
    vehicles: deadStock,
  };
};

module.exports = {
  getFleetSummary,
  getTripStats,
  getFuelCosts,
  getMaintenanceCosts,
  getDriverPerformance,
  getFuelEfficiency,
  getVehicleROI,
  getUtilizationRate,
  getDeadStock,
};
