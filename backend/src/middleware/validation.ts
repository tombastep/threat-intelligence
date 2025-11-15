import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'
import type { ErrorResponse } from '@threat-intel/shared'

/**
 * Middleware factory for validating request body with Zod schemas
 * Returns 400 Bad Request with detailed error messages on validation failure
 * Conforms to ErrorResponse type for consistency
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body)
      req.body = validated
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((err) => ({
          field: err.path.join('.'),
          issue: err.message,
        }))

        const response: ErrorResponse = {
          error: 'Validation Error',
          message: 'Invalid request data',
          details,
        }

        return res.status(400).json(response)
      }

      next(error)
    }
  }
}
