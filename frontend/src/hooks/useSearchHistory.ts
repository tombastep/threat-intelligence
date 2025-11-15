import { useState } from 'react'
import { z } from 'zod'
import type { ThreatIntelResponse } from '@threat-intel/shared'
import { threatIntelResponseSchema } from '@threat-intel/shared'

export interface HistoryEntry {
  ip: string
  overallRisk: 'low' | 'medium' | 'high'
  timestamp: string
  data?: ThreatIntelResponse
}

// Zod schema for runtime validation
const historyEntrySchema = z.object({
  ip: z.string().ip({ version: 'v4' }),
  overallRisk: z.enum(['low', 'medium', 'high']),
  timestamp: z.string().datetime(),
  data: threatIntelResponseSchema.optional(),
})

// Schema for array of history entries
const historyEntryArraySchema = z.array(historyEntrySchema)

// Schema that safely parses JSON string and validates it
const localStorageHistorySchema = z.string().transform((str, ctx) => {
  try {
    const parsed = JSON.parse(str)

    return historyEntryArraySchema.parse(parsed)
  } catch {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Invalid JSON or does not match schema',
    })

    return z.NEVER
  }
})

export function isHistoryEntry(value: unknown): value is HistoryEntry {
  return historyEntrySchema.safeParse(value).success
}

const STORAGE_KEY = 'threat-intel-history'
const MAX_ENTRIES = 10

export function useSearchHistory() {
  // Lazy initialization: function runs only once during initial render
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return []
    }

    // Safely parse JSON and validate with Zod
    const result = localStorageHistorySchema.safeParse(stored)

    if (result.success) {
      return result.data
    }

    console.error('Failed to load search history:', result.error)

    return []
  })

  const addEntry = (
    ip: string,
    overallRisk: 'low' | 'medium' | 'high',
    data?: ThreatIntelResponse
  ) => {
    const newEntry: HistoryEntry = {
      ip,
      overallRisk,
      timestamp: new Date().toISOString(),
      data,
    }

    setHistory((prev) => {
      // Remove duplicate IPs (keep most recent)
      const filtered = prev.filter((entry) => entry.ip !== ip)

      // Add new entry at the beginning
      const updated = [newEntry, ...filtered]

      // Keep only last MAX_ENTRIES
      const trimmed = updated.slice(0, MAX_ENTRIES)

      // Persist to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
      } catch (error) {
        console.error('Failed to save search history:', error)
      }

      return trimmed
    })
  }

  const clearHistory = () => {
    setHistory([])
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Failed to clear search history:', error)
    }
  }

  return {
    history,
    addEntry,
    clearHistory,
  }
}
