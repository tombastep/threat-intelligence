import { useCallback, useEffect, useState } from 'react'
import { z } from 'zod'

interface UrlState {
  ips: Array<string> // Max 2 IPs
}

// Helper to validate IP address
const isValidIp = (ip: string): boolean => {
  try {
    z.string().ip({ version: 'v4' }).parse(ip.trim())

    return true
  } catch {
    return false
  }
}

// Helper to filter and validate IPs from URL
const sanitizeIps = (ips: string[]): string[] => {
  return ips.filter((ip) => isValidIp(ip)).slice(0, 2)
}

/**
 * Custom hook to manage URL query parameters for shareable state
 * Syncs application state with URL query params bidirectionally
 * Supports up to 2 IPs for comparison
 */
export function useUrlState() {
  const [urlState, setUrlState] = useState<UrlState>(() => {
    // Initialize from URL on mount
    const params = new URLSearchParams(window.location.search)
    const ips = sanitizeIps(params.getAll('ip')) // Validate and filter IPs

    return { ips }
  })

  // Sanitize URL on mount if it contains invalid IPs
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlIps = params.getAll('ip')
    const sanitized = sanitizeIps(urlIps)

    // If URLs don't match, update URL to remove invalid IPs
    if (
      urlIps.length !== sanitized.length ||
      urlIps.some((ip, i) => ip !== sanitized[i])
    ) {
      const newParams = new URLSearchParams()
      sanitized.forEach((ip) => {
        newParams.append('ip', ip)
      })

      const newUrl = newParams.toString()
        ? `${window.location.pathname}?${newParams.toString()}`
        : window.location.pathname

      window.history.replaceState({}, '', newUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount

  // Update URL when state changes
  useEffect(() => {
    const params = new URLSearchParams()

    urlState.ips.forEach((ip) => {
      params.append('ip', ip)
    })

    const newUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname

    // Update URL without reloading page
    window.history.replaceState({}, '', newUrl)
  }, [urlState])

  // Listen for browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search)
      const ips = sanitizeIps(params.getAll('ip')) // Validate and filter IPs
      setUrlState({ ips })
    }

    window.addEventListener('popstate', handlePopState)

    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const addIp = useCallback((ip: string) => {
    // Validate IP before adding
    if (!isValidIp(ip)) {
      return
    }

    setUrlState((prev) => {
      const newIps = [...prev.ips]

      // Remove if already exists
      const existingIndex = newIps.indexOf(ip)
      if (existingIndex !== -1) {
        newIps.splice(existingIndex, 1)
      }

      // Add to end, limit to 2
      newIps.push(ip)

      return { ips: newIps.slice(0, 2) }
    })
  }, [])

  const removeIp = useCallback((ip: string) => {
    setUrlState((prev) => ({
      ips: prev.ips.filter((i) => i !== ip),
    }))
  }, [])

  const removeIpAtIndex = useCallback((index: number) => {
    setUrlState((prev) => ({
      ips: prev.ips.filter((_, i) => i !== index),
    }))
  }, [])

  const clearAll = useCallback(() => {
    setUrlState({ ips: [] })
  }, [])

  return {
    ips: urlState.ips,
    ip: urlState.ips[0] || null, // Primary IP
    compareIp: urlState.ips[1] || null, // Comparison IP
    addIp,
    removeIp,
    removeIpAtIndex,
    clearAll,
  }
}
