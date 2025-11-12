import { Request, Response, NextFunction } from 'express';
import { logger } from '@utils/logger';

/**
 * Error Handler Middleware
 * Centralized error handling for Express
 */

export interface ApiError extends Error {
  status?: number;
  statusCode?: number;
  errors?: unknown[];
}

export function errorHandler(
  error: ApiError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const status = error.status || error.statusCode || 500;
  const message = error.message || 'Internal server error';

  // Log error
  if (status >= 500) {
    logger.error('Server error:', {
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
    });
  } else {
    logger.warn('Client error:', {
      error: error.message,
      path: req.path,
      method: req.method,
    });
  }

  // Send response
  res.status(status).json({
    success: false,
    message,
    ...(error.errors && { errors: error.errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
}

/**
 * Not found handler
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
}

/**
 * Async handler wrapper
 * Wraps async route handlers to catch errors
 */
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
