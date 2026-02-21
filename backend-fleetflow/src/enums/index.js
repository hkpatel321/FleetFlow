const { BadRequestError } = require('../errors');

// ─── VEHICLE STATUS ──────────────────────────────────────

const VehicleStatus = {
  AVAILABLE: 'Available',
  ON_TRIP: 'On_Trip',
  IN_SHOP: 'In_Shop',
  RETIRED: 'Retired',
};

const VEHICLE_TRANSITIONS = {
  [VehicleStatus.AVAILABLE]: [VehicleStatus.ON_TRIP, VehicleStatus.IN_SHOP, VehicleStatus.RETIRED],
  [VehicleStatus.ON_TRIP]: [VehicleStatus.AVAILABLE, VehicleStatus.IN_SHOP],
  [VehicleStatus.IN_SHOP]: [VehicleStatus.AVAILABLE, VehicleStatus.RETIRED],
  [VehicleStatus.RETIRED]: [], // terminal state
};

// ─── DRIVER STATUS ───────────────────────────────────────

const DriverStatus = {
  ON_DUTY: 'On_Duty',
  OFF_DUTY: 'Off_Duty',
  SUSPENDED: 'Suspended',
  ON_TRIP: 'On_Trip',
};

const DRIVER_TRANSITIONS = {
  [DriverStatus.OFF_DUTY]: [DriverStatus.ON_DUTY, DriverStatus.SUSPENDED],
  [DriverStatus.ON_DUTY]: [DriverStatus.OFF_DUTY, DriverStatus.ON_TRIP, DriverStatus.SUSPENDED],
  [DriverStatus.ON_TRIP]: [DriverStatus.ON_DUTY, DriverStatus.OFF_DUTY],
  [DriverStatus.SUSPENDED]: [DriverStatus.OFF_DUTY],
};

// ─── TRIP STATUS ─────────────────────────────────────────

const TripStatus = {
  DRAFT: 'Draft',
  DISPATCHED: 'Dispatched',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const TRIP_TRANSITIONS = {
  [TripStatus.DRAFT]: [TripStatus.DISPATCHED, TripStatus.CANCELLED],
  [TripStatus.DISPATCHED]: [TripStatus.COMPLETED, TripStatus.CANCELLED],
  [TripStatus.COMPLETED]: [], // terminal state
  [TripStatus.CANCELLED]: [], // terminal state
};

// ─── USER ROLES ──────────────────────────────────────────

const UserRole = {
  FLEET_MANAGER: 'fleet_manager',
  DISPATCHER: 'dispatcher',
  SAFETY_OFFICER: 'safety_officer',
  FINANCIAL_ANALYST: 'financial_analyst',
};

// ─── TRANSITION VALIDATOR ────────────────────────────────

const TRANSITION_MAP = {
  vehicle: VEHICLE_TRANSITIONS,
  driver: DRIVER_TRANSITIONS,
  trip: TRIP_TRANSITIONS,
};

/**
 * Validates a status transition for a given entity type.
 * Throws BadRequestError if the transition is not allowed.
 */
function validateTransition(entity, fromStatus, toStatus) {
  const transitions = TRANSITION_MAP[entity];
  if (!transitions) {
    throw new BadRequestError(`Unknown entity type: ${entity}`);
  }

  const allowed = transitions[fromStatus];
  if (!allowed) {
    throw new BadRequestError(`Unknown status "${fromStatus}" for ${entity}`);
  }

  if (!allowed.includes(toStatus)) {
    throw new BadRequestError(
      `Invalid ${entity} status transition: "${fromStatus}" → "${toStatus}". Allowed: [${allowed.join(', ')}]`
    );
  }

  return true;
}

module.exports = {
  VehicleStatus,
  DriverStatus,
  TripStatus,
  UserRole,
  VEHICLE_TRANSITIONS,
  DRIVER_TRANSITIONS,
  TRIP_TRANSITIONS,
  validateTransition,
};
