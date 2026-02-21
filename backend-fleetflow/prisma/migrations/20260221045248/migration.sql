-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('Truck', 'Van', 'Bike');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('Available', 'On Trip', 'In Shop', 'Retired');

-- CreateEnum
CREATE TYPE "DriverStatus" AS ENUM ('On Duty', 'Off Duty', 'Suspended', 'On Trip');

-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('Draft', 'Dispatched', 'Completed', 'Cancelled');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "model" TEXT,
    "license_plate" TEXT NOT NULL,
    "vehicle_type" "VehicleType" NOT NULL,
    "max_capacity_kg" DECIMAL(65,30) NOT NULL,
    "odometer_km" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "acquisition_cost" DECIMAL(65,30),
    "status" "VehicleStatus" NOT NULL DEFAULT 'Available',
    "region" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drivers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "license_number" TEXT NOT NULL,
    "license_category" TEXT[],
    "license_expiry_date" DATE NOT NULL,
    "safety_score" DECIMAL(65,30) NOT NULL DEFAULT 100,
    "total_trips" INTEGER NOT NULL DEFAULT 0,
    "completed_trips" INTEGER NOT NULL DEFAULT 0,
    "status" "DriverStatus" NOT NULL DEFAULT 'Off Duty',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trips" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vehicle_id" UUID,
    "driver_id" UUID,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "cargo_weight_kg" DECIMAL(65,30) NOT NULL,
    "cargo_description" TEXT,
    "status" "TripStatus" NOT NULL DEFAULT 'Draft',
    "start_odometer" DECIMAL(65,30),
    "end_odometer" DECIMAL(65,30),
    "distance_km" DECIMAL(65,30),
    "revenue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "scheduled_at" TIMESTAMP(3),
    "dispatched_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vehicle_id" UUID NOT NULL,
    "service_type" TEXT NOT NULL,
    "cost" DECIMAL(65,30) NOT NULL,
    "service_date" DATE NOT NULL,
    "odometer_at_service" DECIMAL(65,30),
    "notes" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fuel_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vehicle_id" UUID NOT NULL,
    "trip_id" UUID,
    "liters" DECIMAL(65,30) NOT NULL,
    "cost_per_liter" DECIMAL(65,30) NOT NULL,
    "total_cost" DECIMAL(65,30),
    "date" DATE NOT NULL,
    "odometer_reading" DECIMAL(65,30),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fuel_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_license_plate_key" ON "vehicles"("license_plate");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_license_number_key" ON "drivers"("license_number");

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuel_logs" ADD CONSTRAINT "fuel_logs_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuel_logs" ADD CONSTRAINT "fuel_logs_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;
