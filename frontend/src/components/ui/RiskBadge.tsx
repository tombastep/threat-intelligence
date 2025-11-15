import type { RiskLevel } from '@/types/ui'
import {
  getRiskBgColor,
  getRiskBorderColor,
  getRiskBadgeTextColor,
  getRiskBadgeDotColor,
  getRiskLabel,
} from '@utils/riskHelpers'

interface RiskBadgeProps {
  riskLevel: RiskLevel
}

export function RiskBadge({ riskLevel }: RiskBadgeProps) {
  const bgColor = getRiskBgColor(riskLevel)
  const borderColor = getRiskBorderColor(riskLevel)
  const textColor = getRiskBadgeTextColor(riskLevel)
  const dotColor = getRiskBadgeDotColor(riskLevel)
  const label = getRiskLabel(riskLevel)

  return (
    <span
      className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${bgColor} ${textColor} ${borderColor} border-2 ${
        riskLevel === 'high' ? 'animate-pulse' : ''
      }`}
    >
      <span
        className={`inline-block w-2 h-2 rounded-full mr-2 ${dotColor}`}
      ></span>
      {label}
    </span>
  )
}
