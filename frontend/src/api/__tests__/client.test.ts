import { describe, it, expect, beforeEach } from 'vitest'
import { apiClient } from '../client'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'
import type { ErrorResponse } from '@threat-intel/shared'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

describe('apiClient', () => {
  beforeEach(() => {
    server.resetHandlers()
  })

  it('should make successful API call', async () => {
    server.use(
      http.post(`${API_BASE_URL}/api/test`, async () => {
        return HttpResponse.json({ success: true, data: 'test' })
      })
    )

    const result = await apiClient<{ success: boolean; data: string }>(
      '/api/test',
      {
        method: 'POST',
        body: JSON.stringify({ test: 'data' }),
      }
    )

    expect(result).toEqual({ success: true, data: 'test' })
  })

  it('should include Content-Type header', async () => {
    let requestHeaders: HeadersInit | undefined

    server.use(
      http.post(`${API_BASE_URL}/api/test`, async ({ request }) => {
        requestHeaders = Object.fromEntries(request.headers.entries())
        return HttpResponse.json({ success: true })
      })
    )

    await apiClient('/api/test', {
      method: 'POST',
      body: JSON.stringify({ test: 'data' }),
    })

    expect(requestHeaders?.['content-type']).toBe('application/json')
  })

  it('should handle 400 error', async () => {
    const errorResponse: ErrorResponse = {
      error: 'Validation Error',
      message: 'Invalid request data',
      details: [
        {
          field: 'ip',
          issue: 'Invalid IP address format',
        },
      ],
    }

    server.use(
      http.post(`${API_BASE_URL}/api/test`, async () => {
        return HttpResponse.json(errorResponse, { status: 400 })
      })
    )

    try {
      await apiClient('/api/test', {
        method: 'POST',
        body: JSON.stringify({}),
      })
      expect.fail('Should have thrown an error')
    } catch (error: any) {
      expect(error.status).toBe(400)
      expect(error.data).toEqual(errorResponse)
    }
  })

  it('should handle 500 error', async () => {
    const errorResponse: ErrorResponse = {
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
    }

    server.use(
      http.post(`${API_BASE_URL}/api/test`, async () => {
        return HttpResponse.json(errorResponse, { status: 500 })
      })
    )

    try {
      await apiClient('/api/test', {
        method: 'POST',
        body: JSON.stringify({}),
      })
      expect.fail('Should have thrown an error')
    } catch (error: any) {
      expect(error.status).toBe(500)
      expect(error.data).toEqual(errorResponse)
    }
  })

  it('should handle 503 error with retryAfter', async () => {
    const errorResponse: ErrorResponse = {
      error: 'Service Unavailable',
      message: 'Service temporarily unavailable',
      retryAfter: 60,
    }

    server.use(
      http.post(`${API_BASE_URL}/api/test`, async () => {
        return HttpResponse.json(errorResponse, { status: 503 })
      })
    )

    try {
      await apiClient('/api/test', {
        method: 'POST',
        body: JSON.stringify({}),
      })
      expect.fail('Should have thrown an error')
    } catch (error: any) {
      expect(error.status).toBe(503)
      expect(error.data).toEqual(errorResponse)
      expect(error.data.retryAfter).toBe(60)
    }
  })

  it('should handle network errors', async () => {
    server.use(
      http.post(`${API_BASE_URL}/api/test`, async () => {
        return HttpResponse.error()
      })
    )

    try {
      await apiClient('/api/test', {
        method: 'POST',
        body: JSON.stringify({}),
      })
      expect.fail('Should have thrown an error')
    } catch (error: any) {
      expect(error).toBeDefined()
    }
  })

  it('should use correct API base URL', async () => {
    let requestUrl: string | undefined

    server.use(
      http.post(`${API_BASE_URL}/api/test`, async ({ request }) => {
        requestUrl = request.url
        return HttpResponse.json({ success: true })
      })
    )

    await apiClient('/api/test', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    expect(requestUrl).toContain(API_BASE_URL)
    expect(requestUrl).toContain('/api/test')
  })

  it('should merge custom headers', async () => {
    let requestHeaders: HeadersInit | undefined

    server.use(
      http.post(`${API_BASE_URL}/api/test`, async ({ request }) => {
        requestHeaders = Object.fromEntries(request.headers.entries())
        return HttpResponse.json({ success: true })
      })
    )

    await apiClient('/api/test', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer token123',
      },
      body: JSON.stringify({}),
    })

    // MSW/fetch may normalize headers differently
    // Check that authorization header is present
    expect(requestHeaders?.['authorization']).toBe('Bearer token123')
    // Content-type should be set (may be normalized)
    expect(requestHeaders?.['content-type']).toBeTruthy()
  })
})

