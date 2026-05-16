// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 2 minutes. After that it will
      // be re-fetched in the background the next time it's needed.
      staleTime: 1000 * 60 * 2,

      // Keep unused data in the cache for 15 minutes so navigating
      // back to a page feels instant while a background refetch runs.
      gcTime: 1000 * 60 * 15,

      // Retry failed requests up to 3 times with exponential back-off
      // (1 s, 2 s, 4 s) — essential for flaky mobile/Ghanaian networks.
      retry: 3,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),

      // ── THE KEY FIXES ──────────────────────────────────────────────
      // Re-fetch when the browser tab regains focus (catches stale data
      // after the user switches tabs or wakes the screen).
      refetchOnWindowFocus: true,

      // Re-fetch when the device comes back online after being offline.
      refetchOnReconnect: true,

      // Re-fetch when the component remounts (catches navigation-related
      // data loss when moving between pages).
      refetchOnMount: true,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
})