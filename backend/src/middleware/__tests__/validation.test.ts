import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Request, Response, NextFunction } from 'express'
import { ZodError, ZodString } from 'zod'
import { validateBody } from '../validation'
import { ipInputSchema } from '@threat-intel/shared'

describe('validateBody', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let mockNext: NextFunction

  beforeEach(() => {
    mockRequest = {
      body: {},
    }
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    }
    mockNext = vi.fn()
  })

  it('should pass through valid request body', () => {
    mockRequest.body = { ip: '8.8.8.8' }
    const middleware = validateBody(ipInputSchema)

    middleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    )

    expect(mockNext).toHaveBeenCalled()
    expect(mockResponse.status).not.toHaveBeenCalled()
    expect(mockRequest.body).toEqual({ ip: '8.8.8.8' })
  })

  it('should return 400 for invalid request body', () => {
    mockRequest.body = { ip: 'invalid-ip' }
    const middleware = validateBody(ipInputSchema)

    middleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    )

    expect(mockResponse.status).toHaveBeenCalledWith(400)
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Validation Error',
      message: 'Invalid request data',
      details: expect.arrayContaining([
        expect.objectContaining({
          field: 'ip',
          issue: expect.any(String),
        }),
      ]),
    })
    expect(mockNext).not.toHaveBeenCalled()
  })

  it('should return 400 for missing required field', () => {
    mockRequest.body = {}
    const middleware = validateBody(ipInputSchema)

    middleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    )

    expect(mockResponse.status).toHaveBeenCalledWith(400)
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Validation Error',
      message: 'Invalid request data',
      details: expect.arrayContaining([
        expect.objectContaining({
          field: 'ip',
        }),
      ]),
    })
  })

  it('should handle nested field validation errors', () => {
    const nestedSchema = {
      parse: vi.fn().mockImplementation(() => {
        const error = new ZodError([
          {
            code: 'invalid_type',
            expected: 'string',
            received: 'number',
            path: ['user', 'name'],
            message: 'Expected string, received number',
          },
        ])
        throw error
      }),
    } as unknown as ZodString

    const middleware = validateBody(nestedSchema)

    middleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    )

    expect(mockResponse.status).toHaveBeenCalledWith(400)
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Validation Error',
      message: 'Invalid request data',
      details: [
        {
          field: 'user.name',
          issue: 'Expected string, received number',
        },
      ],
    })
  })

  it('should pass unexpected errors to next middleware', () => {
    const schema = {
      parse: vi.fn().mockImplementation(() => {
        throw new Error('Unexpected error')
      }),
    } as unknown as ZodString

    const middleware = validateBody(schema)

    middleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    )

    expect(mockNext).toHaveBeenCalledWith(expect.any(Error))
    expect(mockResponse.status).not.toHaveBeenCalled()
  })

  it('should transform request body with validated data', () => {
    mockRequest.body = { ip: '8.8.8.8', extraField: 'should be removed' }
    const middleware = validateBody(ipInputSchema)

    middleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    )

    // Zod schema should only keep validated fields
    expect(mockRequest.body).toEqual({ ip: '8.8.8.8' })
    expect(mockNext).toHaveBeenCalled()
  })
})

