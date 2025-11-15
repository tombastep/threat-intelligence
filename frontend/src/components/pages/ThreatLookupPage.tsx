import { useEffect } from 'react'
import { useThreatLookup } from '@/hooks/useThreatLookup'
import { useSearchHistory, type HistoryEntry } from '@/hooks/useSearchHistory'
import { useUrlState } from '@/hooks/useUrlState'
import { ThreatLookupSearchbar } from '@/components/ThreatLookupSearchbar'
import { ThreatResults } from '@/components/ThreatResults'
import { HistoryList } from '@/components/HistoryList'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'

export function ThreatLookupPage() {
  const { mutate, data, isPending, error, reset } = useThreatLookup()
  const { history, addEntry, clearHistory } = useSearchHistory()
  const { ips, ip, compareIp, addIp, removeIpAtIndex, clearAll } = useUrlState()

  const {
    mutate: mutateCompare,
    data: compareData,
    isPending: isComparePending,
    reset: resetCompare,
  } = useThreatLookup()

  useEffect(() => {
    if (ip) {
      mutate(ip)
    }

    if (compareIp) {
      mutateCompare(compareIp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (data && data.overallRisk) {
      addEntry(data.ip, data.overallRisk, data)
    }
  }, [data, addEntry])

  useEffect(() => {
    if (compareData && compareData.overallRisk) {
      addEntry(compareData.ip, compareData.overallRisk, compareData)
    }
  }, [compareData, addEntry])

  const handleLookup = (lookupIp: string) => {
    addIp(lookupIp)
    mutate(lookupIp)
  }

  const handleCompare = (comparisonIp: string) => {
    if (ip && ip !== comparisonIp) {
      addIp(comparisonIp)
      mutateCompare(comparisonIp)
    }
  }

  const handleRetry = () => {
    reset()
  }

  const handleHistorySelect = (selectedIp: string) => {
    handleLookup(selectedIp)
  }

  const handleCompareHistory = (entry: HistoryEntry) => {
    if (entry.data && ip && entry.ip !== ip) {
      addIp(entry.ip)
      mutateCompare(entry.ip)
    }
  }

  const handleCloseMainIp = () => {
    if (compareIp) {
      removeIpAtIndex(0)
      mutate(compareIp)
      resetCompare()
    } else {
      clearAll()
      reset()
    }
  }

  const handleCloseCompareIp = () => {
    removeIpAtIndex(1)
    resetCompare()
  }

  const showResults = data && !isPending && !error
  const showEmptyState = !data && !isPending && !error

  useEffect(() => {
    const ipList = [ip, compareIp].filter(Boolean).join(', ')
    const titleSuffix = ipList ? ` - ${ipList}` : ''
    document.title = `Threat Intelligence Dashboard${titleSuffix}`
  }, [ip, compareIp])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <img
                src="/threat-intel-logo.svg"
                alt="Threat Intelligence"
                className="w-7 h-7 md:w-8 md:h-8"
              />
              Threat Intelligence Dashboard
            </h1>
            {(ip || compareIp) && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-400 whitespace-nowrap">
                  Analyzing:
                </span>
                {ip && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-lg">
                    <code className="text-sm font-semibold text-gray-700">
                      {ip}
                    </code>
                    <button
                      onClick={handleCloseMainIp}
                      className="text-gray-600 hover:text-red-600 transition-colors flex-shrink-0"
                      aria-label="Clear main IP"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                )}
                {compareIp && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-lg">
                    <code className="text-sm font-semibold text-gray-700">
                      {compareIp}
                    </code>
                    <button
                      onClick={handleCloseCompareIp}
                      className="text-gray-600 hover:text-red-600 transition-colors flex-shrink-0"
                      aria-label="Clear comparison IP"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <ThreatLookupSearchbar
              onLookup={handleLookup}
              onCompare={handleCompare}
              isLoading={isPending || isComparePending}
              history={history}
              onClearHistory={clearHistory}
              onCompareHistory={handleCompareHistory}
              hasCurrentResult={!!data}
              currentIp={ip}
            />
          </div>
        </div>
      </header>

      <main className="pt-44 px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-4xl mx-auto">
          {showEmptyState && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <HistoryList history={history} onSelect={handleHistorySelect} />
            </div>
          )}

          {isPending && <LoadingSpinner />}

          {error && !isPending && (
            <ErrorMessage error={error} onRetry={handleRetry} />
          )}

          {showResults &&
            (() => {
              const resultsInUrlOrder: (typeof data)[] = []

              ips.forEach((urlIp) => {
                if (urlIp === ip && data) {
                  resultsInUrlOrder.push(data)
                } else if (
                  urlIp === compareIp &&
                  compareData &&
                  !isComparePending
                ) {
                  resultsInUrlOrder.push(compareData)
                }
              })

              return resultsInUrlOrder.length > 0 ? (
                <ThreatResults results={resultsInUrlOrder} />
              ) : null
            })()}
        </div>
      </main>
    </div>
  )
}
