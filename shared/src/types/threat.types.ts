/**
 * Shared types for threat intelligence dashboard
 * Used by both frontend and backend for type safety
 */

/**
 * Main response type for threat intelligence lookup
 */
export interface ThreatIntelResponse {
  ip: string
  hostname: string | null
  isp: string
  country: string
  abuseScore: number // 0-100 from AbuseIPDB
  recentReports: number
  isVpnOrProxy: boolean
  threatScore: number // 0-100 from IPQualityScore
  sources: {
    abuseipdb: boolean
    ipqualityscore: boolean
    ipapi: boolean
    virustotal: boolean
  }
  overallRisk?: 'low' | 'medium' | 'high'
}

/**
 * Request type for IP lookup
 */
export interface ThreatIntelRequest {
  ip: string
}

/**
 * Error response type
 */
export interface ErrorResponse {
  error: string
  message: string
  details?: Array<{
    field: string
    issue: string
  }>
  retryAfter?: number
}
