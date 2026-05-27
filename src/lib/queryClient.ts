// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query'
import { hydrateQueryClient, persistQueryCache } from './networkCache'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes. After that it will
      // be re-fetched in the background the next time it's needed.
      staleTime: 1000 * 60 * 5,

      // Keep unused data in the cache for 30 minutes so navigating
      // back to a page feels instant while a background refetch runs.
      gcTime: 1000 * 60 * 30,

      // Retry failed requests up to 3 times with exponential back-off
      // (1 s, 2 s, 4 s) — essential for flaky mobile networks.
      retry: 3,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),

      // App.tsx owns window-focus refetching via a session-validity check
      // (prevents 401 race with an expired JWT). Disable the built-in one
      // so we don't double-refetch on every tab switch.
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true,
    },
    mutations: {
      // Retry failed mutations up to 3 times with exponential backoff
      retry: 3,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    },
  },
})

// ── CACHE HYDRATION & DEBOUNCED PERSISTENCE ─────────────────────────────────

// Hydrate cached data stored in localStorage immediately on startup
hydrateQueryClient(queryClient)

// Track debounce timers to avoid excessive writing to disk
let saveTimeoutId: any = null

// Subscribe to QueryCache updates to automatically sync changes
queryClient.getQueryCache().subscribe((event) => {
  // Only persist when queries succeed or are updated
  if (
    event?.type === 'updated' &&
    event.query?.state?.status === 'success'
  ) {
    if (saveTimeoutId) clearTimeout(saveTimeoutId)
    saveTimeoutId = setTimeout(() => {
      persistQueryCache(queryClient)
    }, 1500) // Debounce by 1.5 seconds
  }
})