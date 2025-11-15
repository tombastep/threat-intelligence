import type { ThreatIntelResponse } from '@threat-intel/shared'
import { ResultItem } from './ResultItem'

interface ThreatResultsProps {
  results: ThreatIntelResponse[]
}

export function ThreatResults({ results }: ThreatResultsProps) {
  // Check if any result has partial data
  const hasPartialData = results.some(
    (data) =>
      !data.sources.abuseipdb ||
      !data.sources.ipqualityscore ||
      !data.sources.ipapi ||
      !data.sources.virustotal
  )

  const isSingleView = results.length === 1

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Partial data warning */}
      {hasPartialData && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
          <div className="flex items-start">
            <svg
              className="h-5 w-5 text-yellow-600 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Partial Data
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                {results.map((data) => (
                  <span key={data.ip}>
                    {!data.sources.abuseipdb && 'AbuseIPDB data unavailable. '}
                    {!data.sources.ipqualityscore &&
                      'IPQualityScore data unavailable. '}
                    {!data.sources.ipapi && 'IPAPI data unavailable. '}
                    {!data.sources.virustotal &&
                      'VirusTotal data unavailable. '}
                  </span>
                ))}
                Showing available information.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic grid: 1 column for single result, 2 columns for comparison */}
      <div
        className={`grid gap-4 md:gap-6 ${
          isSingleView ? 'grid-cols-1' : 'grid-cols-2'
        }`}
      >
        {results.map((data) => (
          <ResultItem key={data.ip} data={data} isSingleView={isSingleView} />
        ))}
      </div>
    </div>
  )
}
