const Joi = require('joi');

const createDriver = Joi.object({
  full_name: Joi.string().required(),
  phone: Joi.string().allow('', null),
  license_number: Joi.string().required(),
  license_category: Joi.array().items(Joi.string()).min(1).required()
    .messages({ 'array.min': 'At least one license category is required' }),
  license_expiry_date: Joi.date().iso().greater('now').required()
    .messages({ 'date.greater': 'License expiry date must be in the future' }),
  safety_score: Joi.number().min(0).max(100).default(100),
});

const updateDriver = Joi.object({
  full_name: Joi.string(),
  phone: Joi.string().allow('', null),
  license_number: Joi.string(),
  license_category: Joi.array().items(Joi.string()).min(1),
  license_expiry_date: Joi.date().iso().greater('now')
    .messages({ 'date.greater': 'License expiry date must be in the future' }),
  safety_score: Joi.number().min(0).max(100),
}).min(1);

const changeStatus = Joi.object({
  status: Joi.string().valid('On_Duty', 'Off_Duty', 'Suspended', 'On_Trip').required(),
});

module.exports = { createDriver, updateDriver, changeStatus };
