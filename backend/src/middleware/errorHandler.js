const { AppError } = require('../errors');
const { Prisma } = require('@prisma/client');

/**
 * Global error handler middleware
 * Catches all errors and returns structured JSON responses
 */
const errorHandler = (err, req, res, next) => {
  // Default values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let status = err.status || 'error';

  // ─── Prisma Error Mapping ───────────────────────────────

  // Unique constraint violation
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      statusCode = 409;
      status = 'fail';
      const field = err.meta?.target?.join(', ') || 'field';
      message = `A record with this ${field} already exists.`;
    }
    // Record not found
    else if (err.code === 'P2025') {
      statusCode = 404;
      status = 'fail';
      message = 'Record not found.';
    }
    // Foreign key constraint failure
    else if (err.code === 'P2003') {
      statusCode = 400;
      status = 'fail';
      message = 'Related record not found. Please check referenced IDs.';
    }
  }

  // Prisma validation error
  if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    status = 'fail';
    message = 'Invalid data provided.';
  }

  // ─── JWT Errors ─────────────────────────────────────────

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    status = 'fail';
    message = 'Invalid token.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    status = 'fail';
    message = 'Token has expired.';
  }

  // ─── Response ───────────────────────────────────────────

  const response = {
    status,
    message,
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    if (!(err instanceof AppError)) {
      console.error('💥 ERROR:', err);
    }
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
