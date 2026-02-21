const { BadRequestError } = require('../errors');

/**
 * Creates an Express middleware that validates req.body against a Joi schema.
 * @param {import('joi').ObjectSchema} schema - Joi validation schema
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((detail) => detail.message).join('; ');
      return next(new BadRequestError(messages));
    }

    req.body = value; // use sanitized value
    next();
  };
};

module.exports = validate;
