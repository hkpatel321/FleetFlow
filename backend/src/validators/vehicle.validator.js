const Joi = require('joi');

const createVehicle = Joi.object({
  name: Joi.string().required(),
  model: Joi.string().allow('', null),
  license_plate: Joi.string().required(),
  vehicle_type: Joi.string().valid('Truck', 'Van', 'Bike').required(),
  max_capacity_kg: Joi.number().positive().required(),
  odometer_km: Joi.number().min(0).default(0),
  acquisition_cost: Joi.number().min(0).allow(null),
  region: Joi.string().allow('', null),
});

const updateVehicle = Joi.object({
  name: Joi.string(),
  model: Joi.string().allow('', null),
  license_plate: Joi.string(),
  vehicle_type: Joi.string().valid('Truck', 'Van', 'Bike'),
  max_capacity_kg: Joi.number().positive(),
  odometer_km: Joi.number().min(0),
  acquisition_cost: Joi.number().min(0).allow(null),
  region: Joi.string().allow('', null),
}).min(1);

const changeStatus = Joi.object({
  status: Joi.string().valid('Available', 'On_Trip', 'In_Shop', 'Retired').required(),
});

module.exports = { createVehicle, updateVehicle, changeStatus };
