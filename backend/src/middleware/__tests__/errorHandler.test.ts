import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Request, Response } from 'express'
import { errorHandler } from '../errorHandler'
import { logger } from '../../utils/logger'

vi.mock('../../utils/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}))

describe('errorHandler', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>

  beforeEach(() => {
    mockRequest = {}
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    }
    vi.clearAllMocks()
  })

  it('should handle generic errors with 500 status', () => {
    const error = new Error('Something went wrong')

    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      vi.fn()
    )

    expect(mockResponse.status).toHaveBeenCalledWith(500)
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
    })
    expect(logger.error).toHaveBeenCalledWith(
      'Request error:',
      error,
      expect.objectContaining({
        message: 'Something went wrong',
        stack: expect.any(String),
      })
    )
  })

  it('should handle service unavailable errors with 503 status', () => {
    const error = new Error(
      'All external threat intelligence services are unavailable'
    )

    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      vi.fn()
    )

    expect(mockResponse.status).toHaveBeenCalledWith(503)
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Service Unavailable',
      message:
        'All external threat intelligence services are currently unavailable. Please try again later.',
      retryAfter: 60,
    })
  })

  it('should include retryAfter for 503 errors', () => {
    const error = new Error('unavailable')

    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      vi.fn()
    )

    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        retryAfter: 60,
      })
    )
  })

  it('should not include retryAfter for non-503 errors', () => {
    const error = new Error('Generic error')

    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      vi.fn()
    )

    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.not.objectContaining({
        retryAfter: expect.anything(),
      })
    )
  })

  it('should log error details', () => {
    const error = new Error('Test error')
    error.stack = 'Error stack trace'

    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      vi.fn()
    )

    expect(logger.error).toHaveBeenCalledWith(
      'Request error:',
      error,
      expect.objectContaining({
        message: 'Test error',
        stack: 'Error stack trace',
      })
    )
  })

  it('should handle errors without stack trace', () => {
    const error = new Error('Error without stack')
    delete (error as any).stack

    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      vi.fn()
    )

    expect(logger.error).toHaveBeenCalled()
    expect(mockResponse.status).toHaveBeenCalledWith(500)
  })

  it('should handle non-Error objects', () => {
    const error = { message: 'String error' } as any

    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      vi.fn()
    )

    expect(mockResponse.status).toHaveBeenCalledWith(500)
    expect(logger.error).toHaveBeenCalled()
  })
})

