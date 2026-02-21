const prisma = require('../src/config/db');
const { hashPassword } = require('../src/utils/password');

async function seed() {
  console.log('🗑️  Clearing all existing data...\n');

  // Delete in reverse dependency order
  await prisma.fuelLog.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Database cleared\n');
  console.log('🌱 Seeding with comprehensive data...\n');

  const password = await hashPassword('password123');

  // ════════════════════════════════════════════════════════
  // 1. USERS — all 4 roles
  // ════════════════════════════════════════════════════════
  const [admin, dispatcher, safety, finance] = await Promise.all([
    prisma.user.create({ data: { email: 'admin@fleetflow.com', password_hash: password, role: 'fleet_manager' } }),
    prisma.user.create({ data: { email: 'dispatcher@fleetflow.com', password_hash: password, role: 'dispatcher' } }),
    prisma.user.create({ data: { email: 'safety@fleetflow.com', password_hash: password, role: 'safety_officer' } }),
    prisma.user.create({ data: { email: 'finance@fleetflow.com', password_hash: password, role: 'financial_analyst' } }),
  ]);
  console.log('✅ 4 users created');

  // ════════════════════════════════════════════════════════
  // 2. VEHICLES — 8 vehicles (various statuses and types)
  // ════════════════════════════════════════════════════════
  const [v1, v2, v3, v4, v5, v6, v7, v8] = await Promise.all([
    prisma.vehicle.create({ data: {
      name: 'Tata Prima', model: '4928.S', license_plate: 'MH-12-AB-1234',
      vehicle_type: 'Truck', max_capacity_kg: 28000, odometer_km: 78500,
      acquisition_cost: 2500000, status: 'Available', region: 'West',
    }}),
    prisma.vehicle.create({ data: {
      name: 'Ashok Leyland 3520', model: '3520-8x2', license_plate: 'MH-14-CD-5678',
      vehicle_type: 'Truck', max_capacity_kg: 35000, odometer_km: 124300,
      acquisition_cost: 3200000, status: 'Available', region: 'West',
    }}),
    prisma.vehicle.create({ data: {
      name: 'Mahindra Supro', model: 'MaxiTruck T2', license_plate: 'DL-01-EF-9012',
      vehicle_type: 'Van', max_capacity_kg: 1000, odometer_km: 34200,
      acquisition_cost: 650000, status: 'Available', region: 'North',
    }}),
    prisma.vehicle.create({ data: {
      name: 'Tata Ace Gold', model: 'Diesel Plus', license_plate: 'DL-05-GH-3456',
      vehicle_type: 'Van', max_capacity_kg: 750, odometer_km: 52100,
      acquisition_cost: 450000, status: 'Available', region: 'North',
    }}),
    prisma.vehicle.create({ data: {
      name: 'Bajaj RE Cargo', model: 'Maxima Z', license_plate: 'KA-05-IJ-7890',
      vehicle_type: 'Bike', max_capacity_kg: 500, odometer_km: 21400,
      acquisition_cost: 280000, status: 'Available', region: 'South',
    }}),
    prisma.vehicle.create({ data: {
      name: 'Eicher Pro 3019', model: 'Pro 3019', license_plate: 'TN-09-KL-2345',
      vehicle_type: 'Truck', max_capacity_kg: 19000, odometer_km: 98700,
      acquisition_cost: 1800000, status: 'Available', region: 'South',
    }}),
    // One In_Shop vehicle
    prisma.vehicle.create({ data: {
      name: 'Tata 407 Gold', model: 'SFC', license_plate: 'GJ-06-MN-6789',
      vehicle_type: 'Truck', max_capacity_kg: 3500, odometer_km: 67800,
      acquisition_cost: 950000, status: 'In_Shop', region: 'West',
    }}),
    // One Retired vehicle
    prisma.vehicle.create({ data: {
      name: 'Force Traveller', model: '26 Seater', license_plate: 'RJ-14-OP-1230',
      vehicle_type: 'Van', max_capacity_kg: 1500, odometer_km: 210000,
      acquisition_cost: 1200000, status: 'Retired', region: 'North',
    }}),
  ]);
  console.log('✅ 8 vehicles created');

  // ════════════════════════════════════════════════════════
  // 3. DRIVERS — 7 drivers (various statuses, one expired)
  // ════════════════════════════════════════════════════════
  const [d1, d2, d3, d4, d5, d6, d7] = await Promise.all([
    prisma.driver.create({ data: {
      full_name: 'Rajesh Kumar', phone: '+91-9876543210',
      license_number: 'DL-0420110012345', license_category: ['HMV', 'LMV'],
      license_expiry_date: new Date('2027-06-15'), safety_score: 95,
      status: 'On_Duty', total_trips: 45, completed_trips: 42,
    }}),
    prisma.driver.create({ data: {
      full_name: 'Priya Sharma', phone: '+91-9123456780',
      license_number: 'MH-1220150067890', license_category: ['LMV'],
      license_expiry_date: new Date('2026-12-31'), safety_score: 88,
      status: 'On_Duty', total_trips: 32, completed_trips: 30,
    }}),
    prisma.driver.create({ data: {
      full_name: 'Vikram Singh', phone: '+91-9988776655',
      license_number: 'KA-0520180034567', license_category: ['HMV', 'LMV', 'MCWG'],
      license_expiry_date: new Date('2028-03-20'), safety_score: 92,
      status: 'On_Duty', total_trips: 58, completed_trips: 55,
    }}),
    prisma.driver.create({ data: {
      full_name: 'Roshan Tandel', phone: '+91-8877665544',
      license_number: 'GJ-0620170045678', license_category: ['HMV', 'LMV'],
      license_expiry_date: new Date('2027-09-10'), safety_score: 100,
      status: 'On_Duty', total_trips: 67, completed_trips: 65,
    }}),
    prisma.driver.create({ data: {
      full_name: 'Amit Patel', phone: '+91-7766554433',
      license_number: 'DL-0120160078901', license_category: ['LMV', 'MCWG'],
      license_expiry_date: new Date('2026-08-15'), safety_score: 78,
      status: 'Off_Duty', total_trips: 22, completed_trips: 18,
    }}),
    // Suspended driver
    prisma.driver.create({ data: {
      full_name: 'Suresh Verma', phone: '+91-6655443322',
      license_number: 'MH-0320190023456', license_category: ['HMV'],
      license_expiry_date: new Date('2026-04-30'), safety_score: 65,
      status: 'Suspended', total_trips: 15, completed_trips: 10,
    }}),
    // Driver with EXPIRED license (for auto-suspend testing)
    prisma.driver.create({ data: {
      full_name: 'Manoj Yadav', phone: '+91-5544332211',
      license_number: 'RJ-1420170089012', license_category: ['LMV'],
      license_expiry_date: new Date('2025-06-30'), safety_score: 72,
      status: 'Off_Duty', total_trips: 8, completed_trips: 6,
    }}),
  ]);
  console.log('✅ 7 drivers created');

  // ════════════════════════════════════════════════════════
  // 4. TRIPS — 15 trips (mix of Completed, Dispatched, Draft, Cancelled)
  // ════════════════════════════════════════════════════════
  const now = new Date();
  const daysAgo = (d) => new Date(now - d * 24 * 60 * 60 * 1000);

  // 8 Completed trips (with revenue, distance, odometers)
  const trips = [];

  trips.push(await prisma.trip.create({ data: {
    vehicle_id: v1.id, driver_id: d1.id, created_by: admin.id,
    origin: 'Mumbai', destination: 'Pune', cargo_weight_kg: 18000,
    cargo_description: 'Steel pipes and fittings',
    status: 'Completed', start_odometer: 75000, end_odometer: 75150,
    distance_km: 150, revenue: 45000,
    dispatched_at: daysAgo(30), completed_at: daysAgo(29),
  }}));

  trips.push(await prisma.trip.create({ data: {
    vehicle_id: v1.id, driver_id: d3.id, created_by: admin.id,
    origin: 'Pune', destination: 'Nashik', cargo_weight_kg: 22000,
    cargo_description: 'Agricultural produce',
    status: 'Completed', start_odometer: 75150, end_odometer: 75370,
    distance_km: 220, revenue: 62000,
    dispatched_at: daysAgo(25), completed_at: daysAgo(24),
  }}));

  trips.push(await prisma.trip.create({ data: {
    vehicle_id: v2.id, driver_id: d4.id, created_by: admin.id,
    origin: 'Mumbai', destination: 'Ahmedabad', cargo_weight_kg: 30000,
    cargo_description: 'Cement bags',
    status: 'Completed', start_odometer: 123000, end_odometer: 123530,
    distance_km: 530, revenue: 125000,
    dispatched_at: daysAgo(20), completed_at: daysAgo(18),
  }}));

  trips.push(await prisma.trip.create({ data: {
    vehicle_id: v3.id, driver_id: d2.id, created_by: dispatcher.id,
    origin: 'Delhi', destination: 'Jaipur', cargo_weight_kg: 800,
    cargo_description: 'Electronics packages',
    status: 'Completed', start_odometer: 33000, end_odometer: 33280,
    distance_km: 280, revenue: 18000,
    dispatched_at: daysAgo(18), completed_at: daysAgo(17),
  }}));

  trips.push(await prisma.trip.create({ data: {
    vehicle_id: v4.id, driver_id: d2.id, created_by: dispatcher.id,
    origin: 'Delhi', destination: 'Agra', cargo_weight_kg: 600,
    cargo_description: 'FMCG goods',
    status: 'Completed', start_odometer: 51000, end_odometer: 51230,
    distance_km: 230, revenue: 12000,
    dispatched_at: daysAgo(15), completed_at: daysAgo(14),
  }}));

  trips.push(await prisma.trip.create({ data: {
    vehicle_id: v5.id, driver_id: d5.id, created_by: admin.id,
    origin: 'Bangalore', destination: 'Mysore', cargo_weight_kg: 350,
    cargo_description: 'Pharmaceutical supplies',
    status: 'Completed', start_odometer: 20000, end_odometer: 20150,
    distance_km: 150, revenue: 8500,
    dispatched_at: daysAgo(12), completed_at: daysAgo(11),
  }}));

  trips.push(await prisma.trip.create({ data: {
    vehicle_id: v6.id, driver_id: d3.id, created_by: admin.id,
    origin: 'Chennai', destination: 'Coimbatore', cargo_weight_kg: 15000,
    cargo_description: 'Textile bales',
    status: 'Completed', start_odometer: 97000, end_odometer: 97500,
    distance_km: 500, revenue: 85000,
    dispatched_at: daysAgo(10), completed_at: daysAgo(8),
  }}));

  trips.push(await prisma.trip.create({ data: {
    vehicle_id: v1.id, driver_id: d1.id, created_by: admin.id,
    origin: 'Mumbai', destination: 'Goa', cargo_weight_kg: 20000,
    cargo_description: 'Construction materials',
    status: 'Completed', start_odometer: 76000, end_odometer: 76590,
    distance_km: 590, revenue: 95000,
    dispatched_at: daysAgo(7), completed_at: daysAgo(5),
  }}));

  // 2 Dispatched (currently active) trips
  trips.push(await prisma.trip.create({ data: {
    vehicle_id: v2.id, driver_id: d4.id, created_by: admin.id,
    origin: 'Ahmedabad', destination: 'Udaipur', cargo_weight_kg: 25000,
    cargo_description: 'Marble slabs',
    status: 'Dispatched', start_odometer: 124000,
    revenue: 78000,
    dispatched_at: daysAgo(1),
  }}));
  // Set vehicle and driver to On_Trip for active dispatched
  await prisma.vehicle.update({ where: { id: v2.id }, data: { status: 'On_Trip' } });
  await prisma.driver.update({ where: { id: d4.id }, data: { status: 'On_Trip' } });

  trips.push(await prisma.trip.create({ data: {
    vehicle_id: v6.id, driver_id: d3.id, created_by: dispatcher.id,
    origin: 'Chennai', destination: 'Hyderabad', cargo_weight_kg: 14000,
    cargo_description: 'Auto parts',
    status: 'Dispatched', start_odometer: 98000,
    revenue: 72000,
    dispatched_at: daysAgo(0),
  }}));
  await prisma.vehicle.update({ where: { id: v6.id }, data: { status: 'On_Trip' } });
  await prisma.driver.update({ where: { id: d3.id }, data: { status: 'On_Trip' } });

  // 3 Draft trips (not yet dispatched)
  trips.push(await prisma.trip.create({ data: {
    vehicle_id: v3.id, driver_id: d2.id, created_by: admin.id,
    origin: 'Delhi', destination: 'Lucknow', cargo_weight_kg: 700,
    cargo_description: 'E-commerce parcels', status: 'Draft', revenue: 15000,
  }}));

  trips.push(await prisma.trip.create({ data: {
    vehicle_id: v1.id, driver_id: d1.id, created_by: dispatcher.id,
    origin: 'Pune', destination: 'Nagpur', cargo_weight_kg: 24000,
    cargo_description: 'Machinery parts', status: 'Draft', revenue: 110000,
  }}));

  // 2 Cancelled trips
  trips.push(await prisma.trip.create({ data: {
    vehicle_id: v4.id, driver_id: d5.id, created_by: admin.id,
    origin: 'Delhi', destination: 'Chandigarh', cargo_weight_kg: 500,
    cargo_description: 'Cancelled order',
    status: 'Cancelled', revenue: 0,
  }}));

  trips.push(await prisma.trip.create({ data: {
    vehicle_id: v5.id, driver_id: d5.id, created_by: admin.id,
    origin: 'Bangalore', destination: 'Chennai', cargo_weight_kg: 400,
    cargo_description: 'Client postponed delivery',
    status: 'Cancelled', revenue: 0,
  }}));

  console.log(`✅ ${trips.length} trips created (8 completed, 2 dispatched, 2 draft, 2 cancelled)`);

  // ════════════════════════════════════════════════════════
  // 5. MAINTENANCE LOGS — 8 entries across vehicles
  // ════════════════════════════════════════════════════════
  const maintenanceLogs = await Promise.all([
    prisma.maintenanceLog.create({ data: {
      vehicle_id: v1.id, service_type: 'Engine Oil Change', cost: 8500,
      service_date: daysAgo(60), odometer_at_service: 72000, notes: 'Synthetic 15W-40',
      created_by: admin.id,
    }}),
    prisma.maintenanceLog.create({ data: {
      vehicle_id: v1.id, service_type: 'Brake Pad Replacement', cost: 15000,
      service_date: daysAgo(30), odometer_at_service: 75000, notes: 'Front and rear',
      created_by: admin.id,
    }}),
    prisma.maintenanceLog.create({ data: {
      vehicle_id: v2.id, service_type: 'Tyre Replacement', cost: 48000,
      service_date: daysAgo(45), odometer_at_service: 120000, notes: '4 new tyres + alignment',
      created_by: admin.id,
    }}),
    prisma.maintenanceLog.create({ data: {
      vehicle_id: v3.id, service_type: 'Full Service', cost: 6500,
      service_date: daysAgo(20), odometer_at_service: 33500, notes: 'Oil, filter, plugs',
      created_by: admin.id,
    }}),
    prisma.maintenanceLog.create({ data: {
      vehicle_id: v5.id, service_type: 'Battery Replacement', cost: 4500,
      service_date: daysAgo(15), odometer_at_service: 20500, notes: 'Exide 12V',
      created_by: admin.id,
    }}),
    prisma.maintenanceLog.create({ data: {
      vehicle_id: v6.id, service_type: 'Clutch Plate', cost: 22000,
      service_date: daysAgo(35), odometer_at_service: 95000, notes: 'Complete clutch overhaul',
      created_by: admin.id,
    }}),
    // In_Shop vehicle maintenance (active)
    prisma.maintenanceLog.create({ data: {
      vehicle_id: v7.id, service_type: 'Engine Overhaul', cost: 85000,
      service_date: daysAgo(3), odometer_at_service: 67800, notes: 'Major engine rebuild — in progress',
      created_by: admin.id,
    }}),
    prisma.maintenanceLog.create({ data: {
      vehicle_id: v4.id, service_type: 'AC Repair', cost: 12000,
      service_date: daysAgo(8), odometer_at_service: 52000, notes: 'Compressor + gas refill',
      created_by: admin.id,
    }}),
  ]);
  console.log(`✅ ${maintenanceLogs.length} maintenance logs created`);

  // ════════════════════════════════════════════════════════
  // 6. FUEL LOGS — 16 entries (linked to vehicles and trips)
  // ════════════════════════════════════════════════════════
  const fuelLogs = await Promise.all([
    // Tata Prima fuel logs (3 entries, linked to trips)
    prisma.fuelLog.create({ data: {
      vehicle_id: v1.id, trip_id: trips[0].id,
      liters: 45, cost_per_liter: 89.50, total_cost: 45 * 89.50,
      date: daysAgo(30), odometer_reading: 75060,
    }}),
    prisma.fuelLog.create({ data: {
      vehicle_id: v1.id, trip_id: trips[1].id,
      liters: 62, cost_per_liter: 90.20, total_cost: 62 * 90.20,
      date: daysAgo(25), odometer_reading: 75250,
    }}),
    prisma.fuelLog.create({ data: {
      vehicle_id: v1.id, trip_id: trips[7].id,
      liters: 85, cost_per_liter: 91.00, total_cost: 85 * 91.00,
      date: daysAgo(6), odometer_reading: 76300,
    }}),

    // Ashok Leyland fuel logs (2 entries)
    prisma.fuelLog.create({ data: {
      vehicle_id: v2.id, trip_id: trips[2].id,
      liters: 120, cost_per_liter: 89.80, total_cost: 120 * 89.80,
      date: daysAgo(19), odometer_reading: 123250,
    }}),
    prisma.fuelLog.create({ data: {
      vehicle_id: v2.id, trip_id: trips[8].id,
      liters: 80, cost_per_liter: 90.50, total_cost: 80 * 90.50,
      date: daysAgo(1), odometer_reading: 124100,
    }}),

    // Mahindra Supro fuel logs (2 entries)
    prisma.fuelLog.create({ data: {
      vehicle_id: v3.id, trip_id: trips[3].id,
      liters: 28, cost_per_liter: 89.90, total_cost: 28 * 89.90,
      date: daysAgo(18), odometer_reading: 33140,
    }}),
    prisma.fuelLog.create({ data: {
      vehicle_id: v3.id,
      liters: 15, cost_per_liter: 90.00, total_cost: 15 * 90.00,
      date: daysAgo(5), odometer_reading: 34100,
    }}),

    // Tata Ace Gold fuel logs (2 entries)
    prisma.fuelLog.create({ data: {
      vehicle_id: v4.id, trip_id: trips[4].id,
      liters: 25, cost_per_liter: 89.70, total_cost: 25 * 89.70,
      date: daysAgo(15), odometer_reading: 51120,
    }}),
    prisma.fuelLog.create({ data: {
      vehicle_id: v4.id,
      liters: 20, cost_per_liter: 90.10, total_cost: 20 * 90.10,
      date: daysAgo(4), odometer_reading: 52050,
    }}),

    // Bajaj RE Cargo fuel logs (2 entries)
    prisma.fuelLog.create({ data: {
      vehicle_id: v5.id, trip_id: trips[5].id,
      liters: 8, cost_per_liter: 89.60, total_cost: 8 * 89.60,
      date: daysAgo(12), odometer_reading: 20080,
    }}),
    prisma.fuelLog.create({ data: {
      vehicle_id: v5.id,
      liters: 6, cost_per_liter: 90.20, total_cost: 6 * 90.20,
      date: daysAgo(2), odometer_reading: 21300,
    }}),

    // Eicher Pro fuel logs (3 entries)
    prisma.fuelLog.create({ data: {
      vehicle_id: v6.id, trip_id: trips[6].id,
      liters: 95, cost_per_liter: 89.90, total_cost: 95 * 89.90,
      date: daysAgo(9), odometer_reading: 97250,
    }}),
    prisma.fuelLog.create({ data: {
      vehicle_id: v6.id, trip_id: trips[9].id,
      liters: 70, cost_per_liter: 91.20, total_cost: 70 * 91.20,
      date: daysAgo(0), odometer_reading: 98200,
    }}),

    // Tata 407 Gold (In Shop — still has fuel logs)
    prisma.fuelLog.create({ data: {
      vehicle_id: v7.id,
      liters: 35, cost_per_liter: 89.50, total_cost: 35 * 89.50,
      date: daysAgo(10), odometer_reading: 67500,
    }}),

    // General unlinked fuel log
    prisma.fuelLog.create({ data: {
      vehicle_id: v1.id,
      liters: 50, cost_per_liter: 91.50, total_cost: 50 * 91.50,
      date: daysAgo(2), odometer_reading: 78400,
    }}),
    prisma.fuelLog.create({ data: {
      vehicle_id: v2.id,
      liters: 40, cost_per_liter: 90.80, total_cost: 40 * 90.80,
      date: daysAgo(3), odometer_reading: 123800,
    }}),
  ]);
  console.log(`✅ ${fuelLogs.length} fuel logs created`);

  // ════════════════════════════════════════════════════════
  // SUMMARY
  // ════════════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(50));
  console.log('🎉 ULTIMATE SEED COMPLETE!\n');
  console.log('📊 Data Summary:');
  console.log('   Users:            4 (all roles)');
  console.log('   Vehicles:         8 (5 Available, 2 On_Trip, 1 In_Shop, 1 Retired)');
  console.log('   Drivers:          7 (3 On_Duty, 2 On_Trip, 1 Off_Duty, 1 Suspended, 1 expired license)');
  console.log('   Trips:           15 (8 Completed, 2 Dispatched, 2 Draft, 2 Cancelled, 1 unfinished)');
  console.log('   Maintenance:      8 entries across 6 vehicles');
  console.log('   Fuel Logs:       16 entries (12 trip-linked + 4 general)');
  console.log('');
  console.log('🔑 Login Credentials:');
  console.log('   Fleet Manager  : admin@fleetflow.com / password123');
  console.log('   Dispatcher     : dispatcher@fleetflow.com / password123');
  console.log('   Safety Officer : safety@fleetflow.com / password123');
  console.log('   Fin. Analyst   : finance@fleetflow.com / password123');
  console.log('═'.repeat(50));
}

seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
