/**
 * Types for IPQualityScore API responses
 * Based on: https://www.ipqualityscore.com/documentation/ip-reputation-api/overview
 */

export interface IPQualityScoreResponse {
  success: boolean
  message?: string
  fraud_score: number // 0-100
  country_code: string
  region: string
  city: string
  ISP: string
  ASN: number
  organization: string
  is_crawler: boolean
  timezone: string
  mobile: boolean
  host: string
  proxy: boolean
  vpn: boolean
  tor: boolean
  active_vpn: boolean
  active_tor: boolean
  recent_abuse: boolean
  bot_status: boolean
  connection_type: string
  abuse_velocity: string
  zip_code: string
  latitude: number
  longitude: number
}

export interface IPQualityScoreError {
  success: false
  message: string
}

