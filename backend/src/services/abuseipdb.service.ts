import axios, { AxiosError } from 'axios'
import { config } from '../config/env'
import type { AbuseIPDBResponse } from '../types/abuseipdb.types'

const ABUSEIPDB_API_URL = 'https://api.abuseipdb.com/api/v2/check'
const REQUEST_TIMEOUT = 5000 // 5 seconds
const MAX_AGE_IN_DAYS = 90

export class AbuseIPDBService {
  async checkIP(ip: string): Promise<AbuseIPDBResponse | null> {
    try {
      const response = await axios.get<AbuseIPDBResponse>(ABUSEIPDB_API_URL, {
        params: {
          ipAddress: ip,
          maxAgeInDays: MAX_AGE_IN_DAYS,
          verbose: true,
        },
        headers: {
          Key: config.abuseipdbApiKey,
          Accept: 'application/json',
        },
        timeout: REQUEST_TIMEOUT,
      })

      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError
        console.error('AbuseIPDB API error:', {
          status: axiosError.response?.status,
          message: axiosError.message,
          ip,
        })

        // Return null on error - let aggregation handle partial data
        return null
      }

      console.error('Unexpected error calling AbuseIPDB:', error)

      return null
    }
  }
}

// Export singleton instance
export const abuseipdbService = new AbuseIPDBService()

