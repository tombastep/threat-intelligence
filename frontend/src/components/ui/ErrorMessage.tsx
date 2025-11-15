import type { ErrorResponse } from '@threat-intel/shared'
import { Button } from '@/components/ui/Button'

interface ErrorMessageProps {
  error: {
    status: number
    data: ErrorResponse
  }
  onRetry?: () => void
}

export function ErrorMessage({ error, onRetry }: ErrorMessageProps) {
  const { status, data } = error

  // Determine error styling based on status
  const isValidationError = status === 400
  const isServiceError = status === 503

  return (
    <div
      className="rounded-lg bg-red-50 border border-red-200 p-6"
      role="alert"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-6 w-6 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">{data.error}</h3>
          <p className="mt-2 text-sm text-red-700">{data.message}</p>

          {/* Validation errors with details */}
          {isValidationError && data.details && data.details.length > 0 && (
            <div className="mt-3">
              <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                {data.details.map((detail, index) => (
                  <li key={index}>
                    <span className="font-medium">{detail.field}:</span>{' '}
                    {detail.issue}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Service unavailable with retry */}
          {isServiceError && onRetry && (
            <div className="mt-4">
              <Button
                variant="danger"
                size="md"
                onClick={onRetry}
              >
                Retry
              </Button>
              {data.retryAfter && (
                <p className="mt-2 text-xs text-red-600">
                  Suggested retry after {data.retryAfter} seconds
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
