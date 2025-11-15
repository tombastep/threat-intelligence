import { http, HttpResponse } from 'msw'
import type { ThreatIntelResponse, ErrorResponse } from '@threat-intel/shared'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Store for test control
let shouldReturnError: '400' | '503' | '500' | null = null
let customResponse: ThreatIntelResponse | null = null

export const setMockError = (error: '400' | '503' | '500' | null) => {
  shouldReturnError = error
}

export const setMockResponse = (response: ThreatIntelResponse | null) => {
  customResponse = response
}

export const resetMocks = () => {
  shouldReturnError = null
  customResponse = null
}

export const handlers = [
  http.post(`${API_BASE_URL}/api/intel`, async ({ request }) => {
    // Check for error scenarios first
    if (shouldReturnError === '400') {
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
      return HttpResponse.json(errorResponse, { status: 400 })
    }

    if (shouldReturnError === '503') {
      const errorResponse: ErrorResponse = {
        error: 'Service Unavailable',
        message: 'All external threat intelligence services are currently unavailable. Please try again later.',
        retryAfter: 60,
      }
      return HttpResponse.json(errorResponse, { status: 503 })
    }

    if (shouldReturnError === '500') {
      const errorResponse: ErrorResponse = {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      }
      return HttpResponse.json(errorResponse, { status: 500 })
    }

    // Return custom response if set
    if (customResponse) {
      return HttpResponse.json(customResponse)
    }

    // Default successful response
    const body = (await request.json()) as { ip: string }
    const { ip } = body

    const mockResponse: ThreatIntelResponse = {
      ip,
      hostname: ip === '8.8.8.8' ? 'dns.google' : null,
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
    }

    return HttpResponse.json(mockResponse)
  }),
]

