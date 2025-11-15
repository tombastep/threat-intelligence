import { QueryClient } from '@tanstack/react-query'

/**
 * React Query client configuration
 *
 * - Caching: Queries stay fresh for 30 seconds
 * - Stale-while-revalidate: Show cached data while refetching
 * - Retry: 1 retry on failure (not aggressive for demo)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false, // Don't refetch when user tabs back
    },
    mutations: {
      retry: 0, // Don't retry mutations automatically
    },
  },
})

