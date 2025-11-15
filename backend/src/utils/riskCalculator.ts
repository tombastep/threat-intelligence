/**
 * Clamp a number to a specified range
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Calculate overall risk level based on threat indicators
 *
 * Formula: (abuseScore * 0.5) + (threatScore * 0.3) + (vtScore * 0.2) + (isVPN ? 15 : 0)
 *
 * Thresholds:
 * - 0-29: Low
 * - 30-59: Medium
 * - 60-100: High
 *
 * Weights:
 * - Abuse score 50%: direct evidence of malicious activity
 * - Threat score 30%: broader fraud indicators
 * - VirusTotal score 20%: security vendor consensus
 * - VPN/proxy adds +15 points: suspicious but not conclusive
 */
export function calculateOverallRisk(
  abuseScore: number,
  threatScore: number,
  isVpnOrProxy: boolean,
  vtScore: number = 0
): 'low' | 'medium' | 'high' {
  const clampedAbuseScore = clamp(abuseScore, 0, 100)
  const clampedThreatScore = clamp(threatScore, 0, 100)
  const clampedVtScore = clamp(vtScore, 0, 100)

  const baseScore =
    clampedAbuseScore * 0.5 + clampedThreatScore * 0.3 + clampedVtScore * 0.2
  const finalScore = isVpnOrProxy ? baseScore + 15 : baseScore

  if (finalScore >= 60) {
    return 'high'
  }

  if (finalScore >= 30) {
    return 'medium'
  }

  return 'low'
}

/**
 * Map country code to country name
 */
export function mapCountryCode(code: string): string {
  const countryMap: Record<string, string> = {
    US: 'United States',
    GB: 'United Kingdom',
    CA: 'Canada',
    AU: 'Australia',
    DE: 'Germany',
    FR: 'France',
    JP: 'Japan',
    CN: 'China',
    IN: 'India',
    BR: 'Brazil',
  }

  return countryMap[code] || code
}
