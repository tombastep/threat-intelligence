import { useEffect, useRef, useState } from 'react'
import type { HistoryEntry } from '@/hooks/useSearchHistory'
import {
  getRiskDotColor,
  getRiskTextColor,
  getRiskLabel,
} from '@utils/riskHelpers'
import { formatTimestamp } from '@utils/timeHelpers'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'

interface HistoryDropdownProps {
  history: HistoryEntry[]
  filter: string
  onSelect: (ip: string) => void
  onCompare: (entry: HistoryEntry) => void
  onClear: () => void
  isOpen: boolean
  onClose: () => void
  hasCurrentResult: boolean
  currentIp?: string | null
  compareIp?: string | null
}

export function HistoryDropdown({
  history,
  filter,
  onSelect,
  onCompare,
  onClear,
  isOpen,
  onClose,
  hasCurrentResult,
  currentIp,
  compareIp,
}: HistoryDropdownProps) {
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Show all entries unless user has typed >= 2 characters
  const filteredHistory =
    filter.length >= 2
      ? history.filter((entry) =>
          entry.ip.toLowerCase().includes(filter.toLowerCase())
        )
      : history

  // Filter out disabled entries for keyboard navigation
  const enabledHistory = filteredHistory.filter(
    (entry) => entry.ip !== currentIp && entry.ip !== compareIp
  )

  // Close on click outside
  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setHighlightedIndex((prev) =>
          prev < enabledHistory.length - 1 ? prev + 1 : prev
        )
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1))
      } else if (event.key === 'Enter' && highlightedIndex >= 0) {
        event.preventDefault()
        const selectedEntry = enabledHistory[highlightedIndex]
        if (selectedEntry && selectedEntry.ip !== currentIp) {
          onSelect(selectedEntry.ip)
          onClose()
        }
      } else if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, highlightedIndex, enabledHistory, currentIp, onSelect, onClose])

  if (!isOpen || filteredHistory.length === 0) {
    return null
  }

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-[60] flex flex-col max-h-96"
    >
      <div className="overflow-y-auto flex-1">
        <div className="py-1">
          {filteredHistory.map((entry, index) => {
            const isCurrent = entry.ip === currentIp
            const isCompared = entry.ip === compareIp
            const isDisabled = isCurrent || isCompared
            const enabledIndex = enabledHistory.findIndex(
              (e) => e.ip === entry.ip && e.timestamp === entry.timestamp
            )
            const isHighlighted = enabledIndex === highlightedIndex

            return (
              <div
                key={`${entry.ip}-${entry.timestamp}`}
                className={`flex items-center gap-3 px-3 py-2 transition-colors ${
                  isDisabled
                    ? 'opacity-50 cursor-not-allowed'
                    : isHighlighted
                      ? 'bg-gray-50'
                      : 'hover:bg-gray-50'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (!isDisabled) {
                      onSelect(entry.ip)
                      onClose()
                    }
                  }}
                  disabled={isDisabled}
                  className={`flex items-center gap-3 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-1 py-1 ${
                    isDisabled
                      ? 'cursor-not-allowed'
                      : 'hover:text-blue-600'
                  }`}
                  aria-disabled={isDisabled}
                >
                <span className="font-mono text-sm text-gray-900 min-w-[120px]">
                  {entry.ip}
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${getRiskDotColor(
                      entry.overallRisk
                    )}`}
                  ></span>
                  <span
                    className={`text-xs font-medium ${getRiskTextColor(
                      entry.overallRisk
                    )}`}
                  >
                    {getRiskLabel(entry.overallRisk)}
                  </span>
                </div>
              </button>

              <div className="ml-auto flex items-center gap-2">
                {entry.data &&
                  hasCurrentResult &&
                  entry.ip !== currentIp &&
                  entry.ip !== compareIp && (
                    <Button
                      variant="ghost"
                      size="sm"
                      startIcon="compare"
                      onClick={(e) => {
                        e.stopPropagation()
                        onCompare(entry)
                        onClose()
                      }}
                      className="whitespace-nowrap hover:bg-gray-100"
                      aria-label="Compare"
                    >
                      <span className="hidden sm:inline">Compare</span>
                    </Button>
                  )}
                {(isCurrent || isCompared) && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Icon name="check" className="w-3 h-3" />
                    Analyzed
                  </span>
                )}
                <span className="text-xs text-gray-500">
                  {formatTimestamp(entry.timestamp)}
                </span>
              </div>
            </div>
          )})}
        </div>
      </div>

      <div className="border-t border-gray-200 px-4 py-2 bg-white rounded-b-lg flex-shrink-0 flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onClear()
            onClose()
          }}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center gap-2"
        >
          <Icon name="trash" className="w-4 h-4" />
          Clear history
        </Button>
      </div>
    </div>
  )
}
