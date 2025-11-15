import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import intelRouter from '../../routes/intel.route'
import { corsMiddleware } from '../../middleware/cors'
import { errorHandler } from '../../middleware/errorHandler'
import * as abuseipdbServiceModule from '../../services/abuseipdb.service'
import * as ipqualityscoreServiceModule from '../../services/ipqualityscore.service'
import * as ipapiServiceModule from '../../services/ipapi.service'
import * as virustotalServiceModule from '../../services/virustotal.service'
import type { AbuseIPDBResponse } from '../../types/abuseipdb.types'
import type { IPQualityScoreResponse } from '../../types/ipqualityscore.types'
import type { IpapiResult } from '../../services/ipapi.service'
import type { VirusTotalResult } from '../../services/virustotal.service'

// Create test app with full middleware chain
const createTestApp = () => {
  const app = express()
  app.use(corsMiddleware)
  app.use(express.json())
  app.use('/api', intelRouter)
  app.use(errorHandler)

  return app
}

describe('Integration: POST /api/intel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should handle full request flow with mocked external services', async () => {
    const mockAbuseData: AbuseIPDBResponse = {
      data: {
        ipAddress: '8.8.8.8',
        isPublic: true,
        ipVersion: 4,
        isWhitelisted: false,
        abuseConfidenceScore: 10,
        countryCode: 'US',
        usageType: 'Data Center',
        isp: 'Google LLC',
        domain: 'google.com',
        hostnames: ['dns.google'],
        totalReports: 5,
        numDistinctUsers: 3,
        lastReportedAt: '2024-01-01T00:00:00Z',
      },
    }

    const mockQualityData: IPQualityScoreResponse = {
      success: true,
      fraud_score: 20,
      country_code: 'US',
      region: 'California',
      city: 'Mountain View',
      ISP: 'Google LLC',
      ASN: 15169,
      organization: 'Google',
      is_crawler: false,
      timezone: 'America/Los_Angeles',
      mobile: false,
      host: 'dns.google',
      proxy: false,
      vpn: false,
      tor: false,
      active_vpn: false,
      active_tor: false,
      recent_abuse: false,
      bot_status: false,
      connection_type: 'Corporate',
      abuse_velocity: 'low',
      zip_code: '94043',
      latitude: 37.4056,
      longitude: -122.0775,
    }

    const mockIpapiData: IpapiResult = {
      country: 'United States',
      isp: 'Google LLC',
      hostname: 'dns.google',
    }

    const mockVtData: VirusTotalResult = {
      vtScore: 5,
      vtMaliciousVotes: 0,
      vtSuspiciousVotes: 1,
    }

    vi.spyOn(abuseipdbServiceModule.abuseipdbService, 'checkIP').mockResolvedValue(
      mockAbuseData
    )
    vi.spyOn(
      ipqualityscoreServiceModule.ipqualityscoreService,
      'checkIP'
    ).mockResolvedValue(mockQualityData)
    vi.spyOn(ipapiServiceModule.ipapiService, 'lookup').mockResolvedValue(
      mockIpapiData
    )
    vi.spyOn(virustotalServiceModule.virustotalService, 'lookup').mockResolvedValue(
      mockVtData
    )

    const app = createTestApp()
    const response = await request(app)
      .post('/api/intel')
      .send({ ip: '8.8.8.8' })
      .expect(200)

    expect(response.body).toMatchObject({
      ip: '8.8.8.8',
      hostname: 'dns.google',
      isp: 'Google LLC',
      country: 'United States',
      overallRisk: expect.any(String),
      sources: {
        abuseipdb: true,
        ipqualityscore: true,
        ipapi: true,
        virustotal: true,
      },
    })
  })

  it('should propagate errors through middleware chain', async () => {
    vi.spyOn(abuseipdbServiceModule.abuseipdbService, 'checkIP').mockResolvedValue(
      null
    )
    vi.spyOn(
      ipqualityscoreServiceModule.ipqualityscoreService,
      'checkIP'
    ).mockResolvedValue(null)
    vi.spyOn(ipapiServiceModule.ipapiService, 'lookup').mockResolvedValue(null)
    vi.spyOn(virustotalServiceModule.virustotalService, 'lookup').mockResolvedValue(
      null
    )

    const app = createTestApp()
    const response = await request(app)
      .post('/api/intel')
      .send({ ip: '1.2.3.4' })
      .expect(503)

    expect(response.body.error).toBe('Service Unavailable')
    expect(response.body.retryAfter).toBe(60)
  })

  it('should validate request through validation middleware', async () => {
    const app = createTestApp()
    const response = await request(app)
      .post('/api/intel')
      .send({ ip: 'invalid-ip' })
      .expect(400)

    expect(response.body.error).toBe('Validation Error')
    expect(response.body.details).toBeDefined()
  })

  it('should handle private IP through route handler', async () => {
    const app = createTestApp()
    const response = await request(app)
      .post('/api/intel')
      .send({ ip: '192.168.1.1' })
      .expect(400)

    expect(response.body.error).toBe('Validation Error')
    expect(response.body.message).toContain('Private network address')
  })
})

