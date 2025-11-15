import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios, { AxiosError } from 'axios'
import { abuseipdbService } from '../abuseipdb.service'
import { config } from '../../config/env'
import type { AbuseIPDBResponse } from '../../types/abuseipdb.types'

vi.mock('axios')
vi.mock('../../config/env', () => ({
  config: {
    abuseipdbApiKey: 'test-api-key',
  },
}))

describe('AbuseIPDBService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('checkIP', () => {
    it('should return data on successful API call', async () => {
      const mockResponse: AbuseIPDBResponse = {
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

      vi.mocked(axios.get).mockResolvedValue({ data: mockResponse })

      const result = await abuseipdbService.checkIP('8.8.8.8')

      expect(result).toEqual(mockResponse)
      expect(axios.get).toHaveBeenCalledWith(
        'https://api.abuseipdb.com/api/v2/check',
        {
          params: {
            ipAddress: '8.8.8.8',
            maxAgeInDays: 90,
            verbose: true,
          },
          headers: {
            Key: 'test-api-key',
            Accept: 'application/json',
          },
          timeout: 5000,
        }
      )
    })

    it('should return null on network error', async () => {
      const networkError = new Error('Network Error')
      vi.mocked(axios.get).mockRejectedValue(networkError)

      const result = await abuseipdbService.checkIP('8.8.8.8')

      expect(result).toBeNull()
    })

    it('should return null on API error (4xx)', async () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 400,
        },
        message: 'Bad Request',
      } as AxiosError

      vi.mocked(axios.isAxiosError).mockReturnValue(true)
      vi.mocked(axios.get).mockRejectedValue(axiosError)

      const result = await abuseipdbService.checkIP('8.8.8.8')

      expect(result).toBeNull()
    })

    it('should return null on API error (5xx)', async () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 500,
        },
        message: 'Internal Server Error',
      } as AxiosError

      vi.mocked(axios.isAxiosError).mockReturnValue(true)
      vi.mocked(axios.get).mockRejectedValue(axiosError)

      const result = await abuseipdbService.checkIP('8.8.8.8')

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

      const result = await abuseipdbService.checkIP('8.8.8.8')

      expect(result).toBeNull()
    })

    it('should return null on unexpected error', async () => {
      const unexpectedError = new Error('Unexpected error')
      vi.mocked(axios.get).mockRejectedValue(unexpectedError)
      vi.mocked(axios.isAxiosError).mockReturnValue(false)

      const result = await abuseipdbService.checkIP('8.8.8.8')

      expect(result).toBeNull()
    })
  })
})

