import type { ThreatIntelResponse } from '@threat-intel/shared'
import { RiskBadge } from '@/components/ui/RiskBadge'
import { MetricCard } from '@/components/ui/MetricCard'
import {
  getAbuseScoreVariant,
  getThreatScoreVariant,
} from '@utils/scoreHelpers'

// Sub-component for each result item
interface ResultItemProps {
  data: ThreatIntelResponse
  isSingleView?: boolean
}

export function ResultItem({ data, isSingleView = false }: ResultItemProps) {
  const containerClasses =
    'border border-gray-300 shadow-lg rounded-lg p-3 md:p-4 space-y-4'

  const headerClasses = isSingleView
    ? 'flex flex-wrap items-center gap-3'
    : 'flex flex-col md:flex-row items-center gap-3 w-full'

  const titleClasses = isSingleView
    ? 'text-lg md:text-2xl font-bold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis'
    : 'text-base md:text-xl font-bold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis'

  const metricCardPadding = isSingleView ? '' : 'p-3 md:p-4'

  return (
    <div className={containerClasses}>
      {/* Header */}
      <div className={headerClasses}>
        <div
          className={`flex-1 min-w-${isSingleView ? 'fit' : '0'} ${isSingleView ? '' : 'flex flex-col gap-1'}`}
        >
          <h2 className={titleClasses}>{data.ip}</h2>
          {data.hostname && (
            <p className="text-xs md:text-sm text-gray-600 mt-1 whitespace-nowrap overflow-hidden text-ellipsis">
              {data.hostname}
            </p>
          )}
        </div>
        <div className={`flex-shrink-0 ${isSingleView ? '' : 'ms-auto'}`}>
          {data.overallRisk && <RiskBadge riskLevel={data.overallRisk} />}
        </div>
      </div>

      {!isSingleView && <hr className="w-full border-t border-gray-200 my-3" />}

      {/* Metrics grid */}
      <div
        className={
          isSingleView ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4'
        }
      >
        <MetricCard
          label="Abuse Score"
          value={data.abuseScore}
          variant={getAbuseScoreVariant(data.abuseScore)}
          unavailable={!data.sources.abuseipdb}
          className={metricCardPadding}
        />
        <MetricCard
          label="Threat Score"
          value={data.threatScore}
          variant={getThreatScoreVariant(data.threatScore)}
          unavailable={!data.sources.ipqualityscore}
          className={metricCardPadding}
        />
        <MetricCard
          label="Recent Reports"
          value={data.recentReports}
          unavailable={!data.sources.abuseipdb}
          className={metricCardPadding}
        />
        <MetricCard
          label="VPN/Proxy"
          value={data.isVpnOrProxy ? 'Yes' : 'No'}
          variant={data.isVpnOrProxy ? 'warning' : 'success'}
          unavailable={!data.sources.ipqualityscore}
          className={metricCardPadding}
        />
      </div>

      {/* Network Information */}
      <div
        className={`bg-transparent rounded-lg border border-gray-200 ${isSingleView ? 'p-4' : 'p-3 md:p-4'}`}
      >
        <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-3 md:mb-4">
          Network Information
        </h3>
        <dl
          className={`grid grid-cols-1 gap-3 md:gap-4 ${isSingleView ? 'sm:grid-cols-2' : ''}`}
        >
          <div>
            <dt
              className={`${isSingleView ? 'text-sm' : 'text-xs'} font-medium text-gray-500`}
            >
              ISP
            </dt>
            <dd
              className={`mt-1 ${isSingleView ? 'text-sm' : 'text-xs md:text-sm'} text-gray-900 ${!isSingleView && 'truncate'}`}
            >
              {data.isp}
            </dd>
          </div>
          <div>
            <dt
              className={`${isSingleView ? 'text-sm' : 'text-xs'} font-medium text-gray-500`}
            >
              Country
            </dt>
            <dd
              className={`mt-1 ${isSingleView ? 'text-sm' : 'text-xs md:text-sm'} text-gray-900`}
            >
              {data.country}
            </dd>
          </div>
          {data.hostname && (
            <div>
              <dt
                className={`${isSingleView ? 'text-sm' : 'text-xs'} font-medium text-gray-500`}
              >
                Hostname
              </dt>
              <dd
                className={`mt-1 ${isSingleView ? 'text-sm' : 'text-xs md:text-sm'} text-gray-900 ${!isSingleView && 'truncate'}`}
              >
                {data.hostname}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Data Sources */}
      <div
        className={`bg-transparent rounded-lg border border-gray-200 ${isSingleView ? 'p-4' : 'p-3 md:p-4'}`}
      >
        <h4 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">
          Data Sources
        </h4>
        <div
          className={`grid grid-cols-2 gap-${isSingleView ? '3' : '2'} ${isSingleView ? 'text-sm' : 'text-xs md:text-sm'}`}
        >
          <div className="flex items-center">
            <span
              className={`inline-block w-2 h-2 rounded-full mr-2 ${
                data.sources.abuseipdb ? 'bg-green-500' : 'bg-gray-300'
              }`}
            ></span>
            <span
              className={
                data.sources.abuseipdb ? 'text-gray-900' : 'text-gray-500'
              }
            >
              AbuseIPDB
            </span>
          </div>
          <div className="flex items-center">
            <span
              className={`inline-block w-2 h-2 rounded-full mr-2 ${
                data.sources.ipqualityscore ? 'bg-green-500' : 'bg-gray-300'
              }`}
            ></span>
            <span
              className={
                data.sources.ipqualityscore ? 'text-gray-900' : 'text-gray-500'
              }
            >
              IPQualityScore
            </span>
          </div>
          <div className="flex items-center">
            <span
              className={`inline-block w-2 h-2 rounded-full mr-2 ${
                data.sources.ipapi ? 'bg-green-500' : 'bg-gray-300'
              }`}
            ></span>
            <span
              className={data.sources.ipapi ? 'text-gray-900' : 'text-gray-500'}
            >
              IPAPI
            </span>
          </div>
          <div className="flex items-center">
            <span
              className={`inline-block w-2 h-2 rounded-full mr-2 ${
                data.sources.virustotal ? 'bg-green-500' : 'bg-gray-300'
              }`}
            ></span>
            <span
              className={
                data.sources.virustotal ? 'text-gray-900' : 'text-gray-500'
              }
            >
              VirusTotal
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
