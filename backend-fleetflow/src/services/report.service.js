const prisma = require('../config/db');

/**
 * Generate CSV string from an array of objects
 */
function toCSV(rows, columns) {
  const header = columns.map(c => c.label).join(',');
  const body = rows.map(row =>
    columns.map(c => {
      let val = typeof c.accessor === 'function' ? c.accessor(row) : row[c.key];
      if (val === null || val === undefined) val = '';
      // Escape commas and quotes
      val = String(val).replace(/"/g, '""');
      if (val.includes(',') || val.includes('"') || val.includes('\n')) val = `"${val}"`;
      return val;
    }).join(',')
  ).join('\n');
  return `${header}\n${body}`;
}

/**
 * Fleet Health Report — Vehicle status, maintenance, odometer, utilization
 */
const getFleetHealthReport = async () => {
  const now = new Date();

  const vehicles = await prisma.vehicle.findMany({
    include: {
      trips: {
        where: { status: 'Completed' },
        select: { distance_km: true, revenue: true, dispatched_at: true, completed_at: true },
      },
      maintenance_logs: {
        select: { cost: true, service_type: true, service_date: true },
        orderBy: { service_date: 'desc' },
      },
      fuel_logs: {
        select: { total_cost: true, liters: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  const rows = vehicles.map(v => {
    const totalRevenue = v.trips.reduce((s, t) => s + Number(t.revenue || 0), 0);
    const totalDistance = v.trips.reduce((s, t) => s + Number(t.distance_km || 0), 0);
    const totalFuelCost = v.fuel_logs.reduce((s, f) => s + Number(f.total_cost || 0), 0);
    const totalLiters = v.fuel_logs.reduce((s, f) => s + Number(f.liters || 0), 0);
    const totalMaintCost = v.maintenance_logs.reduce((s, m) => s + Number(m.cost || 0), 0);
    const acqCost = Number(v.acquisition_cost || 0);
    const netProfit = totalRevenue - totalFuelCost - totalMaintCost;

    // Utilization
    const totalDays = Math.max(1, (now - new Date(v.created_at)) / (1000 * 60 * 60 * 24));
    const activeDays = v.trips.reduce((sum, t) => {
      if (!t.dispatched_at) return sum;
      const end = t.completed_at ? new Date(t.completed_at) : now;
      return sum + Math.max(0, (end - new Date(t.dispatched_at)) / (1000 * 60 * 60 * 24));
    }, 0);

    return {
      name: v.name,
      license_plate: v.license_plate,
      vehicle_type: v.vehicle_type,
      status: v.status,
      odometer_km: Number(v.odometer_km),
      total_trips: v.trips.length,
      total_distance_km: totalDistance,
      total_revenue: totalRevenue,
      total_fuel_cost: totalFuelCost,
      total_liters: totalLiters,
      fuel_efficiency_km_per_l: totalLiters > 0 ? (totalDistance / totalLiters).toFixed(2) : '',
      total_maintenance_cost: totalMaintCost,
      maintenance_entries: v.maintenance_logs.length,
      last_service: v.maintenance_logs[0]?.service_date
        ? new Date(v.maintenance_logs[0].service_date).toISOString().split('T')[0]
        : '',
      acquisition_cost: acqCost,
      net_profit: netProfit,
      roi_percentage: acqCost > 0 ? ((netProfit / acqCost) * 100).toFixed(2) : '',
      utilization_rate: (Math.min(100, (activeDays / totalDays) * 100)).toFixed(1),
    };
  });

  const columns = [
    { label: 'Vehicle Name', key: 'name' },
    { label: 'License Plate', key: 'license_plate' },
    { label: 'Type', key: 'vehicle_type' },
    { label: 'Status', key: 'status' },
    { label: 'Odometer (km)', key: 'odometer_km' },
    { label: 'Total Trips', key: 'total_trips' },
    { label: 'Distance (km)', key: 'total_distance_km' },
    { label: 'Revenue (₹)', key: 'total_revenue' },
    { label: 'Fuel Cost (₹)', key: 'total_fuel_cost' },
    { label: 'Fuel (L)', key: 'total_liters' },
    { label: 'Fuel Efficiency (km/L)', key: 'fuel_efficiency_km_per_l' },
    { label: 'Maintenance Cost (₹)', key: 'total_maintenance_cost' },
    { label: 'Maintenance Entries', key: 'maintenance_entries' },
    { label: 'Last Service Date', key: 'last_service' },
    { label: 'Acquisition Cost (₹)', key: 'acquisition_cost' },
    { label: 'Net Profit (₹)', key: 'net_profit' },
    { label: 'ROI (%)', key: 'roi_percentage' },
    { label: 'Utilization (%)', key: 'utilization_rate' },
  ];

  return { rows, columns, csv: toCSV(rows, columns.map(c => ({ label: c.label, accessor: r => r[c.key] }))) };
};

/**
 * Driver Payroll / Performance Report
 */
const getDriverReport = async () => {
  const now = new Date();

  const drivers = await prisma.driver.findMany({
    include: {
      trips: {
        where: { status: 'Completed' },
        select: { revenue: true, distance_km: true },
      },
    },
    orderBy: { full_name: 'asc' },
  });

  const rows = drivers.map(d => ({
    full_name: d.full_name,
    phone: d.phone || '',
    license_number: d.license_number,
    license_category: (d.license_category || []).join(', '),
    license_expiry: new Date(d.license_expiry_date).toISOString().split('T')[0],
    license_expired: new Date(d.license_expiry_date) < now ? 'YES' : 'No',
    status: d.status,
    safety_score: Number(d.safety_score),
    total_trips: d.total_trips,
    completed_trips: d.completed_trips,
    completion_rate: d.total_trips > 0 ? ((d.completed_trips / d.total_trips) * 100).toFixed(1) : '0.0',
    total_revenue_generated: d.trips.reduce((s, t) => s + Number(t.revenue || 0), 0),
    total_distance_km: d.trips.reduce((s, t) => s + Number(t.distance_km || 0), 0),
  }));

  const columns = [
    { label: 'Driver Name', key: 'full_name' },
    { label: 'Phone', key: 'phone' },
    { label: 'License Number', key: 'license_number' },
    { label: 'License Categories', key: 'license_category' },
    { label: 'License Expiry', key: 'license_expiry' },
    { label: 'License Expired?', key: 'license_expired' },
    { label: 'Status', key: 'status' },
    { label: 'Safety Score', key: 'safety_score' },
    { label: 'Total Trips', key: 'total_trips' },
    { label: 'Completed Trips', key: 'completed_trips' },
    { label: 'Completion Rate (%)', key: 'completion_rate' },
    { label: 'Revenue Generated (₹)', key: 'total_revenue_generated' },
    { label: 'Distance Covered (km)', key: 'total_distance_km' },
  ];

  return { rows, columns, csv: toCSV(rows, columns.map(c => ({ label: c.label, accessor: r => r[c.key] }))) };
};

/**
 * Trip Revenue Report
 */
const getTripReport = async () => {
  const trips = await prisma.trip.findMany({
    where: { status: 'Completed' },
    include: {
      vehicle: { select: { name: true, license_plate: true } },
      driver: { select: { full_name: true } },
    },
    orderBy: { completed_at: 'desc' },
  });

  const rows = trips.map(t => ({
    origin: t.origin,
    destination: t.destination,
    vehicle: t.vehicle?.name || '',
    license_plate: t.vehicle?.license_plate || '',
    driver: t.driver?.full_name || '',
    cargo_weight_kg: Number(t.cargo_weight_kg),
    distance_km: Number(t.distance_km || 0),
    revenue: Number(t.revenue || 0),
    dispatched_at: t.dispatched_at ? new Date(t.dispatched_at).toISOString().split('T')[0] : '',
    completed_at: t.completed_at ? new Date(t.completed_at).toISOString().split('T')[0] : '',
  }));

  const columns = [
    { label: 'Origin', key: 'origin' },
    { label: 'Destination', key: 'destination' },
    { label: 'Vehicle', key: 'vehicle' },
    { label: 'License Plate', key: 'license_plate' },
    { label: 'Driver', key: 'driver' },
    { label: 'Cargo (kg)', key: 'cargo_weight_kg' },
    { label: 'Distance (km)', key: 'distance_km' },
    { label: 'Revenue (₹)', key: 'revenue' },
    { label: 'Dispatched', key: 'dispatched_at' },
    { label: 'Completed', key: 'completed_at' },
  ];

  return { rows, columns, csv: toCSV(rows, columns.map(c => ({ label: c.label, accessor: r => r[c.key] }))) };
};

/**
 * Monthly Financial Summary
 */
const getFinancialSummary = async () => {
  const [totalRevenue, totalFuel, totalMaint] = await Promise.all([
    prisma.trip.aggregate({ where: { status: 'Completed' }, _sum: { revenue: true } }),
    prisma.fuelLog.aggregate({ _sum: { total_cost: true } }),
    prisma.maintenanceLog.aggregate({ _sum: { cost: true } }),
  ]);

  const revenue = Number(totalRevenue._sum.revenue || 0);
  const fuelCost = Number(totalFuel._sum.total_cost || 0);
  const maintCost = Number(totalMaint._sum.cost || 0);

  return {
    total_revenue: revenue,
    total_fuel_cost: fuelCost,
    total_maintenance_cost: maintCost,
    total_operating_costs: fuelCost + maintCost,
    net_profit: revenue - fuelCost - maintCost,
    profit_margin: revenue > 0 ? (((revenue - fuelCost - maintCost) / revenue) * 100).toFixed(1) : '0.0',
  };
};

module.exports = { getFleetHealthReport, getDriverReport, getTripReport, getFinancialSummary };
