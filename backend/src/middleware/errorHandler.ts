import { Request, Response, NextFunction } from 'express'
import type { ErrorResponse } from '@threat-intel/shared'
import { logger } from '../utils/logger'

/**
 * Centralized error handling middleware
 * Should be registered last in the middleware chain
 *
 * Status codes:
 * - 400: Validation errors (handled by validation middleware)
 * - 503: External services unavailable
 * - 500: Unexpected server errors
 */
export function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  logger.error('Request error:', error, {
    message: error.message,
    stack: error.stack,
  })

  let statusCode = 500
  let errorType = 'Internal Server Error'
  let errorMessage = 'An unexpected error occurred'

  if (error.message.includes('unavailable')) {
    statusCode = 503
    errorType = 'Service Unavailable'
    errorMessage =
      'All external threat intelligence services are currently unavailable. Please try again later.'
  }

  const response: ErrorResponse = {
    error: errorType,
    message: errorMessage,
  }

  if (statusCode === 503) {
    response.retryAfter = 60
  }

  res.status(statusCode).json(response)
}
