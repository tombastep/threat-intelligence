import type { ThreatIntelResponse, ErrorResponse } from '@threat-intel/shared'
import { apiClient } from './client'

/**
 * API error type with status code and error data
 */
export interface ApiError {
  status: number
  data: ErrorResponse
}

/**
 * Check threat intelligence for an IP address
 * POST /api/intel
 */
export async function checkThreatIntel(
  ip: string
): Promise<ThreatIntelResponse> {
  return apiClient<ThreatIntelResponse>('/api/intel', {
    method: 'POST',
    body: JSON.stringify({ ip }),
  })
}

