const Joi = require('joi');

const createMaintenance = Joi.object({
  vehicle_id: Joi.string().uuid().required(),
  service_type: Joi.string().required(),
  cost: Joi.number().positive().required(),
  service_date: Joi.date().iso().required(),
  odometer_at_service: Joi.number().min(0).allow(null),
  notes: Joi.string().allow('', null),
});

const createFuelLog = Joi.object({
  vehicle_id: Joi.string().uuid().required(),
  trip_id: Joi.string().uuid().allow(null),
  liters: Joi.number().positive().required(),
  cost_per_liter: Joi.number().positive().required(),
  date: Joi.date().iso().required(),
  odometer_reading: Joi.number().min(0).allow(null),
});

module.exports = { createMaintenance, createFuelLog };
