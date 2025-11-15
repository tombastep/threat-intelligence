import type { RiskLevel } from '@/types/ui'

/**
 * Returns Tailwind CSS classes for risk level styling (background, text, border)
 * Used in HistoryList for card badges
 */
export const getRiskColor = (riskLevel: RiskLevel): string => {
  switch (riskLevel) {
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200'
  }
}

/**
 * Returns background color class for risk level dot indicators
 * Used in HistoryDropdown for status dots
 */
export const getRiskDotColor = (riskLevel: RiskLevel): string => {
  switch (riskLevel) {
    case 'low':
      return 'bg-green-500'
    case 'medium':
      return 'bg-yellow-500'
    case 'high':
      return 'bg-red-500'
  }
}

/**
 * Returns text color class for risk level labels
 * Used in HistoryDropdown for risk text
 */
export const getRiskTextColor = (riskLevel: RiskLevel): string => {
  switch (riskLevel) {
    case 'low':
      return 'text-green-700'
    case 'medium':
      return 'text-yellow-700'
    case 'high':
      return 'text-red-700'
  }
}

/**
 * Returns formatted uppercase label for risk level
 */
export const getRiskLabel = (riskLevel: RiskLevel): string => {
  return riskLevel.toUpperCase()
}

/**
 * Returns background color class for RiskBadge background
 */
export const getRiskBgColor = (riskLevel: RiskLevel): string => {
  switch (riskLevel) {
    case 'low':
      return 'bg-green-100'
    case 'medium':
      return 'bg-yellow-100'
    case 'high':
      return 'bg-red-100'
  }
}

/**
 * Returns border color class for RiskBadge border
 */
export const getRiskBorderColor = (riskLevel: RiskLevel): string => {
  switch (riskLevel) {
    case 'low':
      return 'border-green-200'
    case 'medium':
      return 'border-yellow-200'
    case 'high':
      return 'border-red-200'
  }
}

/**
 * Returns text color class for RiskBadge text
 */
export const getRiskBadgeTextColor = (riskLevel: RiskLevel): string => {
  switch (riskLevel) {
    case 'low':
      return 'text-green-800'
    case 'medium':
      return 'text-yellow-800'
    case 'high':
      return 'text-red-800'
  }
}

/**
 * Returns dot indicator color for RiskBadge
 */
export const getRiskBadgeDotColor = (riskLevel: RiskLevel): string => {
  switch (riskLevel) {
    case 'low':
      return 'bg-green-600'
    case 'medium':
      return 'bg-yellow-600'
    case 'high':
      return 'bg-red-600'
  }
}
