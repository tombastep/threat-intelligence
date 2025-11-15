import axios from 'axios'
import { config } from '../config/env'
import { logger } from '../utils/logger'

export interface VirusTotalResult {
  vtScore: number // 0-100, derived from malicious/suspicious counts
  vtMaliciousVotes: number
  vtSuspiciousVotes: number
}

class VirusTotalService {
  private apiKey?: string
  private baseUrl = 'https://www.virustotal.com/api/v3'
  private isEnabled: boolean

  constructor() {
    this.apiKey = config.virustotalApiKey
    this.isEnabled = !!this.apiKey

    if (!this.isEnabled) {
      logger.warn('VirusTotal service disabled: no API key configured')
    }
  }

  async lookup(ip: string): Promise<VirusTotalResult | null> {
    if (!this.isEnabled || !this.apiKey) {
      return null
    }

    try {
      const url = `${this.baseUrl}/ip_addresses/${ip}`

      const response = await axios.get(url, {
        headers: {
          'x-apikey': this.apiKey,
        },
        timeout: 5000,
      })

      const data = response.data?.data?.attributes

      if (!data) {
        logger.warn('VirusTotal: No data in response', { ip })

        return null
      }

      // Extract vote counts
      const malicious = data.last_analysis_stats?.malicious || 0
      const suspicious = data.last_analysis_stats?.suspicious || 0
      const totalEngines = Object.keys(data.last_analysis_results || {}).length

      // Calculate a score: malicious counts heavily, suspicious counts less
      // Normalize to 0-100 scale
      let vtScore = 0
      if (totalEngines > 0) {
        const maliciousRatio = malicious / totalEngines
        const suspiciousRatio = suspicious / totalEngines
        // Weight: malicious = 100%, suspicious = 50%
        vtScore = Math.min(100, maliciousRatio * 100 + suspiciousRatio * 50)
      }

      return {
        vtScore: Math.round(vtScore),
        vtMaliciousVotes: malicious,
        vtSuspiciousVotes: suspicious,
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // 404 is common for IPs not in VT database - not an error
        if (error.response?.status === 404) {
          logger.info('VirusTotal: IP not found in database', { ip })

          return {
            vtScore: 0,
            vtMaliciousVotes: 0,
            vtSuspiciousVotes: 0,
          }
        }

        logger.error('VirusTotal API error', {
          ip,
          status: error.response?.status,
          message: error.message,
        })
      } else {
        logger.error('VirusTotal unexpected error', { ip, error })
      }

      return null
    }
  }
}

export const virustotalService = new VirusTotalService()

