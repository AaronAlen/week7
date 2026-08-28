import { logger } from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  logger.error(`[Express Error] ${err.message}`, err.stack);

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      error: 'Conflict error',
      message: err.errors.map(e => e.message).join(', ')
    });
  }

  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      message: err.errors.map(e => e.message).join(', ')
    });
  }

  res.status(err.status || 500).json({
    error: err.message || 'InternalServerError',
    message: err.message || 'An unexpected error occurred on the server.'
  });
};
