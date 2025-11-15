import { describe, it, expect, vi, beforeEach } from 'vitest'
import { threatIntelService } from '../threatIntel.service'
import * as abuseipdbServiceModule from '../abuseipdb.service'
import * as ipqualityscoreServiceModule from '../ipqualityscore.service'
import * as ipapiServiceModule from '../ipapi.service'
import * as virustotalServiceModule from '../virustotal.service'
import type { AbuseIPDBResponse } from '../../types/abuseipdb.types'
import type { IPQualityScoreResponse } from '../../types/ipqualityscore.types'
import type { IpapiResult } from '../ipapi.service'
import type { VirusTotalResult } from '../virustotal.service'

describe('ThreatIntelService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('lookup', () => {
    it('should return threat intelligence when all 4 services return data', async () => {
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

      const result = await threatIntelService.lookup('8.8.8.8')

      expect(result).toEqual({
        ip: '8.8.8.8',
        hostname: 'dns.google', // IPAPI priority
        isp: 'Google LLC', // IPAPI priority
        country: 'United States', // IPAPI priority
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
        overallRisk: 'low',
      })
    })

    it('should return partial data when some services fail', async () => {
      const mockAbuseData: AbuseIPDBResponse = {
        data: {
          ipAddress: '1.2.3.4',
          isPublic: true,
          ipVersion: 4,
          isWhitelisted: false,
          abuseConfidenceScore: 50,
          countryCode: 'US',
          usageType: null,
          isp: 'Some ISP',
          domain: '',
          hostnames: [],
          totalReports: 10,
          numDistinctUsers: 5,
          lastReportedAt: null,
        },
      }

      vi.spyOn(abuseipdbServiceModule.abuseipdbService, 'checkIP').mockResolvedValue(
        mockAbuseData
      )
      vi.spyOn(
        ipqualityscoreServiceModule.ipqualityscoreService,
        'checkIP'
      ).mockResolvedValue(null)
      vi.spyOn(ipapiServiceModule.ipapiService, 'lookup').mockResolvedValue(null)
      vi.spyOn(virustotalServiceModule.virustotalService, 'lookup').mockResolvedValue(
        null
      )

      const result = await threatIntelService.lookup('1.2.3.4')

      expect(result.sources).toEqual({
        abuseipdb: true,
        ipqualityscore: false,
        ipapi: false,
        virustotal: false,
      })
      expect(result.abuseScore).toBe(50)
      expect(result.threatScore).toBe(0)
      expect(result.isVpnOrProxy).toBe(false)
    })

    it('should throw error when all services fail', async () => {
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

      await expect(threatIntelService.lookup('1.2.3.4')).rejects.toThrow(
        'All external threat intelligence services are unavailable'
      )
    })

    it('should prioritize IPAPI > AbuseIPDB > IPQS for hostname', async () => {
      const mockAbuseData: AbuseIPDBResponse = {
        data: {
          ipAddress: '1.2.3.4',
          isPublic: true,
          ipVersion: 4,
          isWhitelisted: false,
          abuseConfidenceScore: 0,
          countryCode: 'US',
          usageType: null,
          isp: 'AbuseISP',
          domain: 'abuse.example.com',
          hostnames: [],
          totalReports: 0,
          numDistinctUsers: 0,
          lastReportedAt: null,
        },
      }

      const mockQualityData: IPQualityScoreResponse = {
        success: true,
        fraud_score: 0,
        country_code: 'US',
        region: '',
        city: '',
        ISP: 'QualityISP',
        ASN: 0,
        organization: '',
        is_crawler: false,
        timezone: '',
        mobile: false,
        host: 'quality.example.com',
        proxy: false,
        vpn: false,
        tor: false,
        active_vpn: false,
        active_tor: false,
        recent_abuse: false,
        bot_status: false,
        connection_type: '',
        abuse_velocity: '',
        zip_code: '',
        latitude: 0,
        longitude: 0,
      }

      const mockIpapiData: IpapiResult = {
        country: 'United States',
        isp: 'IpapiISP',
        hostname: 'ipapi.example.com',
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
        null
      )

      const result = await threatIntelService.lookup('1.2.3.4')

      expect(result.hostname).toBe('ipapi.example.com') // IPAPI priority
    })

    it('should fallback to AbuseIPDB hostname when IPAPI fails', async () => {
      const mockAbuseData: AbuseIPDBResponse = {
        data: {
          ipAddress: '1.2.3.4',
          isPublic: true,
          ipVersion: 4,
          isWhitelisted: false,
          abuseConfidenceScore: 0,
          countryCode: 'US',
          usageType: null,
          isp: 'AbuseISP',
          domain: 'abuse.example.com',
          hostnames: [],
          totalReports: 0,
          numDistinctUsers: 0,
          lastReportedAt: null,
        },
      }

      const mockQualityData: IPQualityScoreResponse = {
        success: true,
        fraud_score: 0,
        country_code: 'US',
        region: '',
        city: '',
        ISP: 'QualityISP',
        ASN: 0,
        organization: '',
        is_crawler: false,
        timezone: '',
        mobile: false,
        host: 'quality.example.com',
        proxy: false,
        vpn: false,
        tor: false,
        active_vpn: false,
        active_tor: false,
        recent_abuse: false,
        bot_status: false,
        connection_type: '',
        abuse_velocity: '',
        zip_code: '',
        latitude: 0,
        longitude: 0,
      }

      vi.spyOn(abuseipdbServiceModule.abuseipdbService, 'checkIP').mockResolvedValue(
        mockAbuseData
      )
      vi.spyOn(
        ipqualityscoreServiceModule.ipqualityscoreService,
        'checkIP'
      ).mockResolvedValue(mockQualityData)
      vi.spyOn(ipapiServiceModule.ipapiService, 'lookup').mockResolvedValue(null)
      vi.spyOn(virustotalServiceModule.virustotalService, 'lookup').mockResolvedValue(
        null
      )

      const result = await threatIntelService.lookup('1.2.3.4')

      expect(result.hostname).toBe('abuse.example.com') // AbuseIPDB fallback
    })

    it('should calculate high risk correctly', async () => {
      const mockAbuseData: AbuseIPDBResponse = {
        data: {
          ipAddress: '1.2.3.4',
          isPublic: true,
          ipVersion: 4,
          isWhitelisted: false,
          abuseConfidenceScore: 80, // High abuse score
          countryCode: 'US',
          usageType: null,
          isp: 'ISP',
          domain: '',
          hostnames: [],
          totalReports: 100,
          numDistinctUsers: 50,
          lastReportedAt: null,
        },
      }

      const mockQualityData: IPQualityScoreResponse = {
        success: true,
        fraud_score: 70, // High threat score
        country_code: 'US',
        region: '',
        city: '',
        ISP: 'ISP',
        ASN: 0,
        organization: '',
        is_crawler: false,
        timezone: '',
        mobile: false,
        host: '',
        proxy: true, // VPN/Proxy
        vpn: true,
        tor: false,
        active_vpn: false,
        active_tor: false,
        recent_abuse: false,
        bot_status: false,
        connection_type: '',
        abuse_velocity: '',
        zip_code: '',
        latitude: 0,
        longitude: 0,
      }

      const mockVtData: VirusTotalResult = {
        vtScore: 60,
        vtMaliciousVotes: 5,
        vtSuspiciousVotes: 2,
      }

      vi.spyOn(abuseipdbServiceModule.abuseipdbService, 'checkIP').mockResolvedValue(
        mockAbuseData
      )
      vi.spyOn(
        ipqualityscoreServiceModule.ipqualityscoreService,
        'checkIP'
      ).mockResolvedValue(mockQualityData)
      vi.spyOn(ipapiServiceModule.ipapiService, 'lookup').mockResolvedValue(null)
      vi.spyOn(virustotalServiceModule.virustotalService, 'lookup').mockResolvedValue(
        mockVtData
      )

      const result = await threatIntelService.lookup('1.2.3.4')

      expect(result.overallRisk).toBe('high')
    })

    it('should calculate medium risk correctly', async () => {
      const mockAbuseData: AbuseIPDBResponse = {
        data: {
          ipAddress: '1.2.3.4',
          isPublic: true,
          ipVersion: 4,
          isWhitelisted: false,
          // 60*0.5 + 30*0.3 = 30 + 9 = 39 (medium)
          abuseConfidenceScore: 60,
          countryCode: 'US',
          usageType: null,
          isp: 'ISP',
          domain: '',
          hostnames: [],
          totalReports: 10,
          numDistinctUsers: 5,
          lastReportedAt: null,
        },
      }

      const mockQualityData: IPQualityScoreResponse = {
        success: true,
        fraud_score: 30,
        country_code: 'US',
        region: '',
        city: '',
        ISP: 'ISP',
        ASN: 0,
        organization: '',
        is_crawler: false,
        timezone: '',
        mobile: false,
        host: '',
        proxy: false,
        vpn: false,
        tor: false,
        active_vpn: false,
        active_tor: false,
        recent_abuse: false,
        bot_status: false,
        connection_type: '',
        abuse_velocity: '',
        zip_code: '',
        latitude: 0,
        longitude: 0,
      }

      vi.spyOn(abuseipdbServiceModule.abuseipdbService, 'checkIP').mockResolvedValue(
        mockAbuseData
      )
      vi.spyOn(
        ipqualityscoreServiceModule.ipqualityscoreService,
        'checkIP'
      ).mockResolvedValue(mockQualityData)
      vi.spyOn(ipapiServiceModule.ipapiService, 'lookup').mockResolvedValue(null)
      vi.spyOn(virustotalServiceModule.virustotalService, 'lookup').mockResolvedValue(
        null
      )

      const result = await threatIntelService.lookup('1.2.3.4')

      expect(result.overallRisk).toBe('medium')
    })

    it('should handle null values gracefully', async () => {
      const mockAbuseData: AbuseIPDBResponse = {
        data: {
          ipAddress: '1.2.3.4',
          isPublic: true,
          ipVersion: 4,
          isWhitelisted: false,
          abuseConfidenceScore: 0,
          countryCode: 'US',
          usageType: null,
          isp: 'ISP',
          domain: null as any,
          hostnames: [],
          totalReports: 0,
          numDistinctUsers: 0,
          lastReportedAt: null,
        },
      }

      vi.spyOn(abuseipdbServiceModule.abuseipdbService, 'checkIP').mockResolvedValue(
        mockAbuseData
      )
      vi.spyOn(
        ipqualityscoreServiceModule.ipqualityscoreService,
        'checkIP'
      ).mockResolvedValue(null)
      vi.spyOn(ipapiServiceModule.ipapiService, 'lookup').mockResolvedValue(null)
      vi.spyOn(virustotalServiceModule.virustotalService, 'lookup').mockResolvedValue(
        null
      )

      const result = await threatIntelService.lookup('1.2.3.4')

      expect(result.hostname).toBeNull()
      expect(result.isp).toBe('ISP')
      expect(result.country).toBe('United States') // From AbuseIPDB countryCode
    })

    it('should call all services in parallel', async () => {
      const checkOrder: string[] = []

      vi.spyOn(abuseipdbServiceModule.abuseipdbService, 'checkIP').mockImplementation(
        async () => {
          checkOrder.push('abuseipdb')
          await new Promise((resolve) => setTimeout(resolve, 10))
          return null
        }
      )

      vi.spyOn(
        ipqualityscoreServiceModule.ipqualityscoreService,
        'checkIP'
      ).mockImplementation(async () => {
        checkOrder.push('ipqualityscore')
        await new Promise((resolve) => setTimeout(resolve, 10))
        return null
      })

      vi.spyOn(ipapiServiceModule.ipapiService, 'lookup').mockImplementation(
        async () => {
          checkOrder.push('ipapi')
          await new Promise((resolve) => setTimeout(resolve, 10))
          return null
        }
      )

      vi.spyOn(virustotalServiceModule.virustotalService, 'lookup').mockImplementation(
        async () => {
          checkOrder.push('virustotal')
          await new Promise((resolve) => setTimeout(resolve, 10))
          return null
        }
      )

      try {
        await threatIntelService.lookup('1.2.3.4')
      } catch {
        // Expected to throw
      }

      // All should be called (order may vary due to parallel execution)
      expect(checkOrder).toHaveLength(4)
      expect(checkOrder).toContain('abuseipdb')
      expect(checkOrder).toContain('ipqualityscore')
      expect(checkOrder).toContain('ipapi')
      expect(checkOrder).toContain('virustotal')
    })
  })
})

