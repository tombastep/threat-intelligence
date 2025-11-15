import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios, { AxiosError } from 'axios'
import { ipqualityscoreService } from '../ipqualityscore.service'
import { config } from '../../config/env'
import type { IPQualityScoreResponse } from '../../types/ipqualityscore.types'

vi.mock('axios')
vi.mock('../../config/env', () => ({
  config: {
    ipqualityscoreApiKey: 'test-api-key',
  },
}))

describe('IPQualityScoreService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('checkIP', () => {
    it('should return data on successful API call', async () => {
      const mockResponse: IPQualityScoreResponse = {
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

      vi.mocked(axios.get).mockResolvedValue({ data: mockResponse })

      const result = await ipqualityscoreService.checkIP('8.8.8.8')

      expect(result).toEqual(mockResponse)
      expect(axios.get).toHaveBeenCalledWith(
        'https://ipqualityscore.com/api/json/ip/test-api-key/8.8.8.8',
        {
          params: {
            strictness: 0,
            allow_public_access_points: true,
          },
          timeout: 5000,
        }
      )
    })

    it('should return null when success is false', async () => {
      const mockResponse = {
        success: false,
        message: 'Invalid API key',
      }

      vi.mocked(axios.get).mockResolvedValue({ data: mockResponse })

      const result = await ipqualityscoreService.checkIP('8.8.8.8')

      expect(result).toBeNull()
    })

    it('should return null on network error', async () => {
      const networkError = new Error('Network Error')
      vi.mocked(axios.get).mockRejectedValue(networkError)

      const result = await ipqualityscoreService.checkIP('8.8.8.8')

      expect(result).toBeNull()
    })

    it('should return null on API error', async () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 401,
        },
        message: 'Unauthorized',
      } as AxiosError

      vi.mocked(axios.isAxiosError).mockReturnValue(true)
      vi.mocked(axios.get).mockRejectedValue(axiosError)

      const result = await ipqualityscoreService.checkIP('8.8.8.8')

      expect(result).toBeNull()
    })

    it('should return null on timeout', async () => {
      const timeoutError = {
        isAxiosError: true,
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded',
      } as AxiosError

      vi.mocked(axios.isAxiosError).mockReturnValue(true)
      vi.mocked(axios.get).mockRejectedValue(timeoutError)

      const result = await ipqualityscoreService.checkIP('8.8.8.8')

      expect(result).toBeNull()
    })

    it('should handle VPN/proxy/TOR detection', async () => {
      const mockResponse: IPQualityScoreResponse = {
        success: true,
        fraud_score: 50,
        country_code: 'US',
        region: '',
        city: '',
        ISP: 'VPN Provider',
        ASN: 0,
        organization: '',
        is_crawler: false,
        timezone: '',
        mobile: false,
        host: '',
        proxy: true,
        vpn: true,
        tor: false,
        active_vpn: true,
        active_tor: false,
        recent_abuse: false,
        bot_status: false,
        connection_type: '',
        abuse_velocity: '',
        zip_code: '',
        latitude: 0,
        longitude: 0,
      }

      vi.mocked(axios.get).mockResolvedValue({ data: mockResponse })

      const result = await ipqualityscoreService.checkIP('1.2.3.4')

      expect(result).toEqual(mockResponse)
      expect(result?.vpn).toBe(true)
      expect(result?.proxy).toBe(true)
    })
  })
})

