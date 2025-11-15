import { ReactNode } from 'react'
import type { ScoreVariant } from '@/types/ui'

const VARIANT_STYLES: Record<ScoreVariant, string> = {
  default: 'border-gray-200 bg-white',
  success: 'border-green-200 bg-green-50',
  warning: 'border-yellow-200 bg-yellow-50',
  danger: 'border-red-200 bg-red-50',
}

const TEXT_STYLES: Record<ScoreVariant, string> = {
  default: 'text-gray-900',
  success: 'text-green-900',
  warning: 'text-yellow-900',
  danger: 'text-red-900',
}

interface MetricCardProps {
  label: string
  value: string | number
  icon?: ReactNode
  variant?: ScoreVariant
  unavailable?: boolean
  className?: string
}

export function MetricCard({
  label,
  value,
  icon,
  variant = 'default',
  unavailable = false,
  className = '',
}: MetricCardProps) {
  return (
    <div
      className={`rounded-lg border-2 p-4 ${VARIANT_STYLES[variant]} ${
        unavailable ? 'opacity-50' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
          {label}
        </p>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
      <p className={`mt-2 text-3xl font-bold ${TEXT_STYLES[variant]}`}>
        {unavailable ? 'N/A' : value}
      </p>
      {unavailable && (
        <p className="mt-1 text-xs text-gray-500">Data unavailable</p>
      )}
    </div>
  )
}
