import { describe, it, expect } from 'vitest'
import { checkThreatIntel } from '../threatIntel'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'
import type { ThreatIntelResponse, ErrorResponse } from '@threat-intel/shared'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

describe('checkThreatIntel', () => {
  it('should call correct endpoint with POST method', async () => {
    let requestMethod: string | undefined
    let requestBody: any

    server.use(
      http.post(`${API_BASE_URL}/api/intel`, async ({ request }) => {
        requestMethod = request.method
        requestBody = await request.json()
        return HttpResponse.json({
          ip: '8.8.8.8',
          hostname: 'dns.google',
          isp: 'Google LLC',
          country: 'United States',
          abuseScore: 0,
          recentReports: 0,
          isVpnOrProxy: false,
          threatScore: 0,
          sources: {
            abuseipdb: true,
            ipqualityscore: true,
            ipapi: true,
            virustotal: true,
          },
          overallRisk: 'low',
        } as ThreatIntelResponse)
      })
    )

    await checkThreatIntel('8.8.8.8')

    expect(requestMethod).toBe('POST')
    expect(requestBody).toEqual({ ip: '8.8.8.8' })
  })

  it('should return typed ThreatIntelResponse', async () => {
    const mockResponse: ThreatIntelResponse = {
      ip: '8.8.8.8',
      hostname: 'dns.google',
      isp: 'Google LLC',
      country: 'United States',
      abuseScore: 10,
      recentReports: 5,
      isVpnOrProxy: false,
      threatScore: 20,
      sources: {
        abuseipdb: true,
        ipqualityscore: true,
        ipapi: true,
        virustotal: true,
      },
      overallRisk: 'medium',
    }

    server.use(
      http.post(`${API_BASE_URL}/api/intel`, async () => {
        return HttpResponse.json(mockResponse)
      })
    )

    const result = await checkThreatIntel('8.8.8.8')

    expect(result).toEqual(mockResponse)
    expect(result.ip).toBe('8.8.8.8')
    expect(result.overallRisk).toBe('medium')
    expect(result.sources.abuseipdb).toBe(true)
  })

  it('should handle error responses', async () => {
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
      http.post(`${API_BASE_URL}/api/intel`, async () => {
        return HttpResponse.json(errorResponse, { status: 400 })
      })
    )

    try {
      await checkThreatIntel('invalid-ip')
      expect.fail('Should have thrown an error')
    } catch (error: any) {
      expect(error.status).toBe(400)
      expect(error.data).toEqual(errorResponse)
    }
  })

  it('should handle 503 service unavailable', async () => {
    const errorResponse: ErrorResponse = {
      error: 'Service Unavailable',
      message: 'All external threat intelligence services are currently unavailable. Please try again later.',
      retryAfter: 60,
    }

    server.use(
      http.post(`${API_BASE_URL}/api/intel`, async () => {
        return HttpResponse.json(errorResponse, { status: 503 })
      })
    )

    try {
      await checkThreatIntel('8.8.8.8')
      expect.fail('Should have thrown an error')
    } catch (error: any) {
      expect(error.status).toBe(503)
      expect(error.data.retryAfter).toBe(60)
    }
  })

  it('should send IP in request body', async () => {
    let requestBody: any

    server.use(
      http.post(`${API_BASE_URL}/api/intel`, async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json({
          ip: '1.2.3.4',
          hostname: null,
          isp: 'Test ISP',
          country: 'United States',
          abuseScore: 0,
          recentReports: 0,
          isVpnOrProxy: false,
          threatScore: 0,
          sources: {
            abuseipdb: true,
            ipqualityscore: true,
            ipapi: true,
            virustotal: true,
          },
          overallRisk: 'low',
        } as ThreatIntelResponse)
      })
    )

    await checkThreatIntel('1.2.3.4')

    expect(requestBody).toEqual({ ip: '1.2.3.4' })
  })
})

