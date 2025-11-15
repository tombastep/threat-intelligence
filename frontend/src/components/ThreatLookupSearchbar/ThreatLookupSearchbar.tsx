import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ipInputSchema } from '@threat-intel/shared'
import type { z } from 'zod'
import { HistoryDropdown } from './HistoryDropdown'
import type { HistoryEntry } from '@/hooks/useSearchHistory'
import { Button } from '@/components/ui/Button'

type IPInputForm = z.infer<typeof ipInputSchema>

interface ThreatLookupSearchbarProps {
  onLookup: (ip: string) => void
  onCompare: (ip: string) => void
  isLoading: boolean
  history: HistoryEntry[]
  onClearHistory: () => void
  onCompareHistory: (entry: HistoryEntry) => void // For history dropdown
  hasCurrentResult: boolean // Show compare button when true
  currentIp?: string | null // Current IP being viewed
  compareIp?: string | null // Comparison IP being viewed
}

export function ThreatLookupSearchbar({
  onLookup,
  onCompare,
  isLoading,
  history,
  onClearHistory,
  onCompareHistory,
  hasCurrentResult,
  currentIp,
  compareIp,
}: ThreatLookupSearchbarProps) {
  const {
    register,
    handleSubmit,
    setValue,
    control,
    clearErrors,
    formState: { errors },
  } = useForm<IPInputForm>({
    resolver: zodResolver(ipInputSchema),
  })

  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const currentValue = useWatch({ control, name: 'ip' }) || ''

  const handleLookupSubmit = (data: IPInputForm) => {
    setIsDropdownOpen(false)
    onLookup(data.ip)
    setValue('ip', '') // Clear input after submission
  }

  const handleCompareSubmit = (data: IPInputForm) => {
    setIsDropdownOpen(false)
    onCompare(data.ip)
    setValue('ip', '') // Clear input after submission
  }

  const handleHistorySelect = (ip: string) => {
    setValue('ip', ip)
    clearErrors('ip') // Clear any validation errors
    setIsDropdownOpen(false)
    // Automatically lookup after selecting from history
    onLookup(ip)
    setValue('ip', '') // Clear input after submission
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentValue.trim()) {
      e.preventDefault()
      handleSubmit(handleLookupSubmit)()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.currentTarget.blur()
      setIsDropdownOpen(false)
    }
  }

  return (
    <div>
      <div className="relative">
        <input
          {...register('ip')}
          type="text"
          id="ip"
          placeholder="8.8.8.8"
          disabled={isLoading}
          aria-label="IP address to check for threat intelligence"
          autoComplete="off"
          onFocus={() => {
            if (history.length > 0) {
              setIsDropdownOpen(true)
            }
          }}
          onKeyDown={handleKeyDown}
          className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-lg ${
            hasCurrentResult
              ? 'pr-[120px] md:pr-[200px]'
              : 'pr-[60px] md:pr-[110px]'
          }`}
        />

        {/* Inline Action Buttons */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
          {hasCurrentResult && (
            <Button
              variant="ghost"
              size="md"
              startIcon="compare"
              onClick={handleSubmit(handleCompareSubmit)}
              disabled={isLoading || !currentValue.trim()}
              className="hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="sr-only md:not-sr-only">Compare</span>
            </Button>
          )}
          <Button
            variant="primary"
            size="md"
            startIcon="search"
            onClick={handleSubmit(handleLookupSubmit)}
            disabled={isLoading || !currentValue.trim()}
            isLoading={isLoading}
            className="shadow-sm rounded-full bg-gray-800 hover:bg-gray-900 text-white"
          >
            <span className="sr-only md:not-sr-only">Lookup</span>
          </Button>
        </div>

        <HistoryDropdown
          key={currentValue}
          history={history}
          filter={currentValue}
          onSelect={handleHistorySelect}
          onCompare={onCompareHistory}
          onClear={onClearHistory}
          isOpen={isDropdownOpen}
          onClose={() => setIsDropdownOpen(false)}
          hasCurrentResult={hasCurrentResult}
          currentIp={currentIp}
          compareIp={compareIp}
        />
      </div>
      {errors.ip && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {errors.ip.message}
        </p>
      )}
    </div>
  )
}

