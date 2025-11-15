import type { ScoreVariant } from '@/types/ui'

/**
 * Determines the variant for an abuse score metric
 */
export const getAbuseScoreVariant = (
  score: number
): Exclude<ScoreVariant, 'default'> => {
  if (score >= 60) {
    return 'danger'
  }

  if (score >= 30) {
    return 'warning'
  }

  return 'success'
}

/**
 * Determines the variant for a threat score metric
 */
export const getThreatScoreVariant = (
  score: number
): Exclude<ScoreVariant, 'default'> => {
  if (score >= 60) {
    return 'danger'
  }

  if (score >= 30) {
    return 'warning'
  }

  return 'success'
}

