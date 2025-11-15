import type { ThreatIntelResponse } from '@threat-intel/shared'
import { abuseipdbService } from './abuseipdb.service'
import { ipqualityscoreService } from './ipqualityscore.service'
import { ipapiService } from './ipapi.service'
import { virustotalService } from './virustotal.service'
import { calculateOverallRisk, mapCountryCode } from '../utils/riskCalculator'

export class ThreatIntelService {
  /**
   * Look up threat intelligence for an IP address
   * Aggregates data from AbuseIPDB, IPQualityScore, IPAPI, and VirusTotal
   * Returns partial data if some services fail
   * Throws error if all services fail
   */
  async lookup(ip: string): Promise<ThreatIntelResponse> {
    const [abuseData, qualityData, ipapiData, vtData] = await Promise.all([
      abuseipdbService.checkIP(ip),
      ipqualityscoreService.checkIP(ip),
      ipapiService.lookup(ip),
      virustotalService.lookup(ip),
    ])

    if (!abuseData && !qualityData && !ipapiData && !vtData) {
      throw new Error(
        'All external threat intelligence services are unavailable'
      )
    }

    // Aggregate data with priority: IPAPI > AbuseIPDB > IPQualityScore
    const response: ThreatIntelResponse = {
      // IP address (from any source)
      ip: abuseData?.data.ipAddress || ip,

      // Hostname: Priority - IPAPI > AbuseIPDB > IPQualityScore
      hostname:
        ipapiData?.hostname ||
        abuseData?.data.domain ||
        qualityData?.host ||
        null,

      // ISP: Priority - IPAPI > AbuseIPDB > IPQS
      isp:
        ipapiData?.isp || abuseData?.data.isp || qualityData?.ISP || 'Unknown',

      // Country: Priority - IPAPI > AbuseIPDB > IPQS (map codes to names)
      country: ipapiData?.country
        ? ipapiData.country
        : abuseData
          ? mapCountryCode(abuseData.data.countryCode)
          : qualityData
            ? mapCountryCode(qualityData.country_code)
            : 'Unknown',

      // Abuse-specific metrics (only from AbuseIPDB)
      abuseScore: abuseData?.data.abuseConfidenceScore ?? 0,
      recentReports: abuseData?.data.totalReports ?? 0,

      // VPN/Proxy detection (only from IPQualityScore)
      // Combine vpn, proxy, and tor flags
      isVpnOrProxy: qualityData
        ? qualityData.vpn || qualityData.proxy || qualityData.tor
        : false,

      // Fraud score (only from IPQualityScore)
      threatScore: qualityData?.fraud_score ?? 0,

      sources: {
        abuseipdb: abuseData !== null,
        ipqualityscore: qualityData !== null,
        ipapi: ipapiData !== null,
        virustotal: vtData !== null,
      },
    }

    response.overallRisk = calculateOverallRisk(
      response.abuseScore,
      response.threatScore,
      response.isVpnOrProxy,
      vtData?.vtScore ?? 0
    )

    return response
  }
}

// Export singleton instance
export const threatIntelService = new ThreatIntelService()
