/**
 * Types for AbuseIPDB API responses
 * Based on: https://www.abuseipdb.com/api.html
 */

export interface AbuseIPDBResponse {
  data: {
    ipAddress: string
    isPublic: boolean
    ipVersion: number
    isWhitelisted: boolean
    abuseConfidenceScore: number // 0-100
    countryCode: string
    usageType: string | null
    isp: string
    domain: string
    hostnames: string[]
    totalReports: number
    numDistinctUsers: number
    lastReportedAt: string | null
  }
}

export interface AbuseIPDBError {
  errors: Array<{
    detail: string
    status: number
  }>
}

