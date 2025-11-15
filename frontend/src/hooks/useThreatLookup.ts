import { useMutation } from '@tanstack/react-query'
import { checkThreatIntel, type ApiError } from '@api/threatIntel'
import type { ThreatIntelResponse } from '@threat-intel/shared'

/**
 * React Query hook for threat intelligence lookup
 *
 * Uses mutation because it's a user-initiated POST request
 */
export function useThreatLookup() {
  return useMutation<ThreatIntelResponse, ApiError, string>({
    mutationFn: checkThreatIntel,
  })
}
