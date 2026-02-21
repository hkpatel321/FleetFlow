const Joi = require('joi');

const createTrip = Joi.object({
  vehicle_id: Joi.string().uuid().allow(null),
  driver_id: Joi.string().uuid().allow(null),
  origin: Joi.string().required(),
  destination: Joi.string().required(),
  cargo_weight_kg: Joi.number().positive().required(),
  cargo_description: Joi.string().allow('', null),
  revenue: Joi.number().min(0).default(0),
  scheduled_at: Joi.date().iso().allow(null),
  start_odometer: Joi.number().min(0).allow(null),
});

const completeTrip = Joi.object({
  end_odometer: Joi.number().positive().required(),
  revenue: Joi.number().min(0),
});

module.exports = { createTrip, completeTrip };
