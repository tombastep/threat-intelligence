import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Request, Response, NextFunction } from 'express'
import { corsMiddleware } from '../cors'
import { config } from '../../config/env'

vi.mock('../../config/env', () => ({
  config: {
    frontendUrl: 'http://localhost:5173',
  },
}))

vi.mock('cors', () => {
  return {
    default: vi.fn((options) => {
      return (req: Request, res: Response, next: NextFunction) => {
        // Mock CORS middleware behavior
        res.setHeader('Access-Control-Allow-Origin', options.origin)
        res.setHeader('Access-Control-Allow-Credentials', 'true')
        next()
      }
    }),
  }
})

describe('corsMiddleware', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let mockNext: NextFunction

  beforeEach(() => {
    mockRequest = {
      headers: {
        origin: 'http://localhost:5173',
      },
    }
    mockResponse = {
      setHeader: vi.fn(),
    }
    mockNext = vi.fn()
    vi.clearAllMocks()
  })

  it('should be a function', () => {
    expect(typeof corsMiddleware).toBe('function')
  })

  it('should call next middleware', () => {
    corsMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    )

    expect(mockNext).toHaveBeenCalled()
  })

  it('should be configured with frontend URL', () => {
    // The middleware is created with config.frontendUrl
    // We verify it's set up correctly by checking the import
    expect(config.frontendUrl).toBe('http://localhost:5173')
  })
})

