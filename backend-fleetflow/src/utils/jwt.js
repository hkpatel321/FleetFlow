const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Generate a JWT token for a user
 * @param {object} user - User object with id, email, role
 * @returns {string} JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

/**
 * Verify a JWT token
 * @param {string} token
 * @returns {object} decoded payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, config.jwt.secret);
};

module.exports = { generateToken, verifyToken };
