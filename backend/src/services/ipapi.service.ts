import axios from 'axios'
import { config } from '../config/env'
import { logger } from '../utils/logger'

export interface IpapiResult {
  country?: string
  isp?: string
  hostname?: string | null
}

class IpapiService {
  private baseUrl: string
  private apiKey?: string
  private isEnabled: boolean

  constructor() {
    this.baseUrl = config.ipapiBaseUrl || 'http://ip-api.com/json'
    this.apiKey = config.ipapiApiKey
    this.isEnabled = !!config.ipapiBaseUrl || !!config.ipapiApiKey

    if (!this.isEnabled) {
      logger.warn('IPAPI service disabled: no API configuration found')
    }
  }

  async lookup(ip: string): Promise<IpapiResult | null> {
    if (!this.isEnabled) {
      return null
    }

    try {
      const url = `${this.baseUrl}/${ip}`
      const params: Record<string, string> = {
        fields: 'status,message,country,countryCode,isp,org,reverse,query',
      }

      // Add API key if provided (for pro tier)
      if (this.apiKey) {
        params.key = this.apiKey
      }

      const response = await axios.get(url, {
        params,
        timeout: 5000,
      })

      // ip-api.com returns status: 'fail' on error
      if (response.data.status === 'fail') {
        logger.warn('IPAPI lookup failed', {
          ip,
          message: response.data.message,
        })

        return null
      }

      return {
        country: response.data.country || response.data.countryCode,
        isp: response.data.isp || response.data.org,
        hostname: response.data.reverse || null,
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error('IPAPI API error', {
          ip,
          status: error.response?.status,
          message: error.message,
        })
      } else {
        logger.error('IPAPI unexpected error', { ip, error })
      }

      return null
    }
  }
}

export const ipapiService = new IpapiService()

