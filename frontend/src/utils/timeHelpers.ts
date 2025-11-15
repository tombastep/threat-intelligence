/**
 * Formats an ISO timestamp into a human-readable relative time string
 * @param timestamp - ISO 8601 formatted timestamp string
 * @returns Formatted string like "Just now", "5m ago", "2h ago", "3d ago"
 */
export const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) {
    return 'Just now'
  }

  if (diffMins < 60) {
    return `${diffMins}m ago`
  }

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) {
    return `${diffHours}h ago`
  }

  const diffDays = Math.floor(diffHours / 24)

  return `${diffDays}d ago`
}

