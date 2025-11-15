import axios, { AxiosError } from 'axios'
import { config } from '../config/env'
import type { IPQualityScoreResponse } from '../types/ipqualityscore.types'

const IPQUALITYSCORE_API_URL = 'https://ipqualityscore.com/api/json/ip'
const REQUEST_TIMEOUT = 5000 // 5 seconds

export class IPQualityScoreService {
  async checkIP(ip: string): Promise<IPQualityScoreResponse | null> {
    try {
      const url = `${IPQUALITYSCORE_API_URL}/${config.ipqualityscoreApiKey}/${ip}`

      const response = await axios.get<IPQualityScoreResponse>(url, {
        params: {
          strictness: 0, // 0-3, 0 is least strict
          allow_public_access_points: true,
        },
        timeout: REQUEST_TIMEOUT,
      })

      // Check if request was successful
      if (!response.data.success) {
        console.error(
          'IPQualityScore API returned success=false:',
          response.data
        )

        return null
      }

      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError
        console.error('IPQualityScore API error:', {
          status: axiosError.response?.status,
          message: axiosError.message,
          ip,
        })

        // Return null on error - let aggregation handle partial data
        return null
      }

      console.error('Unexpected error calling IPQualityScore:', error)

      return null
    }
  }
}

// Export singleton instance
export const ipqualityscoreService = new IPQualityScoreService()

