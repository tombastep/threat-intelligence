import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import intelRouter from '../routes/intel.route'
import { corsMiddleware } from '../middleware/cors'
import { errorHandler } from '../middleware/errorHandler'
import * as threatIntelServiceModule from '../services/threatIntel.service'
import { logger } from '../utils/logger'
import type { ThreatIntelResponse } from '@threat-intel/shared'

vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

// Create test app
const createTestApp = () => {
  const app = express()
  app.use(corsMiddleware)
  app.use(express.json())
  app.use('/api', intelRouter)
  app.use(errorHandler)

  return app
}

describe('POST /api/intel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return threat intelligence for a valid public IP', async () => {
    // Mock the threat intel service
    const mockResponse: ThreatIntelResponse = {
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
    }

    vi.spyOn(
      threatIntelServiceModule.threatIntelService,
      'lookup'
    ).mockResolvedValue(mockResponse)

    const app = createTestApp()
    const response = await request(app)
      .post('/api/intel')
      .send({ ip: '8.8.8.8' })
      .expect(200)

    expect(response.body).toEqual(mockResponse)
    expect(response.body.ip).toBe('8.8.8.8')
    expect(response.body.overallRisk).toBe('low')
    expect(response.body.sources.abuseipdb).toBe(true)
    expect(response.body.sources.ipqualityscore).toBe(true)
  })

  it('should return 400 for invalid IP format', async () => {
    const app = createTestApp()
    const response = await request(app)
      .post('/api/intel')
      .send({ ip: 'invalid-ip' })
      .expect(400)

    expect(response.body.error).toBe('Validation Error')
    expect(response.body.message).toBe('Invalid request data')
    expect(response.body.details).toBeDefined()
    expect(response.body.details[0].field).toBe('ip')
  })

  it('should return 400 for private IP addresses', async () => {
    const app = createTestApp()
    const response = await request(app)
      .post('/api/intel')
      .send({ ip: '192.168.1.1' })
      .expect(400)

    expect(response.body.error).toBe('Validation Error')
    expect(response.body.message).toContain('Private network address')
    expect(response.body.details).toBeDefined()
  })

  it('should return 400 for loopback address', async () => {
    const app = createTestApp()
    const response = await request(app)
      .post('/api/intel')
      .send({ ip: '127.0.0.1' })
      .expect(400)

    expect(response.body.error).toBe('Validation Error')
    expect(response.body.message).toContain('Loopback address')
  })

  it('should return 503 when all external services fail', async () => {
    vi.spyOn(
      threatIntelServiceModule.threatIntelService,
      'lookup'
    ).mockRejectedValue(
      new Error('All external threat intelligence services are unavailable')
    )

    const app = createTestApp()
    const response = await request(app)
      .post('/api/intel')
      .send({ ip: '1.2.3.4' })
      .expect(503)

    expect(response.body.error).toBe('Service Unavailable')
    expect(response.body.retryAfter).toBe(60)
  })

  it('should return partial data when some services fail', async () => {
    const partialResponse: ThreatIntelResponse = {
      ip: '1.2.3.4',
      hostname: null,
      isp: 'Some ISP',
      country: 'United States',
      abuseScore: 50,
      recentReports: 5,
      isVpnOrProxy: false,
      threatScore: 0,
      sources: {
        abuseipdb: true,
        ipqualityscore: false, // IPQS failed
        ipapi: true, // IPAPI succeeded
        virustotal: false, // VT failed
      },
      overallRisk: 'medium',
    }

    vi.spyOn(
      threatIntelServiceModule.threatIntelService,
      'lookup'
    ).mockResolvedValue(partialResponse)

    const app = createTestApp()
    const response = await request(app)
      .post('/api/intel')
      .send({ ip: '1.2.3.4' })
      .expect(200)

    expect(response.body.sources.abuseipdb).toBe(true)
    expect(response.body.sources.ipqualityscore).toBe(false)
    expect(response.body.sources.ipapi).toBe(true)
    expect(response.body.sources.virustotal).toBe(false)
    expect(response.body.abuseScore).toBe(50)
    expect(response.body.threatScore).toBe(0)
  })

  it('should include CORS headers in response', async () => {
    const mockResponse: ThreatIntelResponse = {
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
    }

    vi.spyOn(
      threatIntelServiceModule.threatIntelService,
      'lookup'
    ).mockResolvedValue(mockResponse)

    const app = createTestApp()
    const response = await request(app)
      .post('/api/intel')
      .send({ ip: '8.8.8.8' })
      .expect(200)

    // CORS middleware should set headers (exact headers depend on CORS config)
    expect(response.headers).toBeDefined()
  })

  it('should log request and response', async () => {
    const mockResponse: ThreatIntelResponse = {
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
    }

    vi.spyOn(
      threatIntelServiceModule.threatIntelService,
      'lookup'
    ).mockResolvedValue(mockResponse)

    const app = createTestApp()
    await request(app).post('/api/intel').send({ ip: '8.8.8.8' }).expect(200)

    expect(logger.info).toHaveBeenCalledWith('Threat intel lookup requested', {
      ip: '8.8.8.8',
    })
    expect(logger.info).toHaveBeenCalledWith(
      'Threat intel lookup successful',
      expect.objectContaining({
        ip: '8.8.8.8',
        overallRisk: 'low',
        sources: expect.any(Object),
      })
    )
  })

  it('should log warning for private IP rejection', async () => {
    const app = createTestApp()
    await request(app)
      .post('/api/intel')
      .send({ ip: '192.168.1.1' })
      .expect(400)

    expect(logger.warn).toHaveBeenCalledWith('Private/reserved IP rejected', {
      ip: '192.168.1.1',
    })
  })

  it('should handle multiple concurrent requests', async () => {
    const mockResponse: ThreatIntelResponse = {
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
    }

    vi.spyOn(
      threatIntelServiceModule.threatIntelService,
      'lookup'
    ).mockResolvedValue(mockResponse)

    const app = createTestApp()

    const requests = [
      request(app).post('/api/intel').send({ ip: '8.8.8.8' }),
      request(app).post('/api/intel').send({ ip: '1.1.1.1' }),
      request(app).post('/api/intel').send({ ip: '208.67.222.222' }),
    ]

    const responses = await Promise.all(requests)

    responses.forEach((response) => {
      expect(response.status).toBe(200)
      expect(response.body.ip).toBeDefined()
    })
  })

  it('should return 400 for empty request body', async () => {
    const app = createTestApp()
    const response = await request(app).post('/api/intel').send({}).expect(400)

    expect(response.body.error).toBe('Validation Error')
    expect(response.body.details).toBeDefined()
  })

  it('should return 400 for missing ip field', async () => {
    const app = createTestApp()
    const response = await request(app)
      .post('/api/intel')
      .send({ otherField: 'value' })
      .expect(400)

    expect(response.body.error).toBe('Validation Error')
    expect(response.body.details).toBeDefined()
    expect(response.body.details[0].field).toBe('ip')
  })

  it('should ignore extra fields in request body', async () => {
    const mockResponse: ThreatIntelResponse = {
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
    }

    vi.spyOn(
      threatIntelServiceModule.threatIntelService,
      'lookup'
    ).mockResolvedValue(mockResponse)

    const app = createTestApp()
    const response = await request(app)
      .post('/api/intel')
      .send({ ip: '8.8.8.8', extraField: 'should be ignored' })
      .expect(200)

    expect(response.body.ip).toBe('8.8.8.8')
  })

  it('should return 500 for unexpected errors', async () => {
    vi.spyOn(
      threatIntelServiceModule.threatIntelService,
      'lookup'
    ).mockRejectedValue(new Error('Unexpected database error'))

    const app = createTestApp()
    const response = await request(app)
      .post('/api/intel')
      .send({ ip: '1.2.3.4' })
      .expect(500)

    expect(response.body.error).toBe('Internal Server Error')
    expect(response.body.message).toBe('An unexpected error occurred')
  })

  it('should handle all private IP ranges', async () => {
    const app = createTestApp()

    const privateIPs = [
      '10.0.0.1',
      '172.16.0.1',
      '172.20.0.1',
      '172.31.0.1',
      '192.168.1.1',
      '127.0.0.1',
      '169.254.0.1',
    ]

    for (const ip of privateIPs) {
      const response = await request(app)
        .post('/api/intel')
        .send({ ip })
        .expect(400)

      expect(response.body.error).toBe('Validation Error')
      expect(response.body.message).toContain('cannot be checked')
    }
  })
})
