import type { HistoryEntry } from '@/hooks/useSearchHistory'
import { getRiskColor, getRiskLabel } from '@utils/riskHelpers'
import { formatTimestamp } from '@utils/timeHelpers'

interface HistoryListProps {
  history: HistoryEntry[]
  onSelect: (ip: string) => void
}

export function HistoryList({ history, onSelect }: HistoryListProps) {
  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          No recent lookups
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Your lookup history will appear here
        </p>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        📋 Recent Lookups
      </h3>
      <div className="space-y-2">
        {history.map((entry) => (
          <button
            key={`${entry.ip}-${entry.timestamp}`}
            type="button"
            onClick={() => onSelect(entry.ip)}
            className="w-full flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-sm transition-all text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <span className="font-mono text-base font-medium text-gray-900">
              {entry.ip}
            </span>
            <span
              className={`text-xs font-medium px-2 py-1 rounded border ${getRiskColor(
                entry.overallRisk
              )}`}
            >
              {getRiskLabel(entry.overallRisk)}
            </span>
            <span className="ml-auto text-xs text-gray-500">
              {formatTimestamp(entry.timestamp)}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
