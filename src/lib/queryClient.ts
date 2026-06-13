// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query'
import { hydrateQueryClient, persistQueryCache } from './networkCache'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 2 minutes. Navigating back to a page
      // shows cached data instantly while a background refetch runs.
      staleTime: 1000 * 60 * 2,

      // Keep unused data in the cache for 10 minutes so navigating
      // back to a page feels instant while a background refetch runs.
      gcTime: 1000 * 60 * 10,

      // Retry failed queries up to 2 times with exponential back-off
      // (1 s, 2 s) — essential for flaky mobile networks.
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),

      // Refetch when user returns to the tab or reconnects — keeps data
      // fresh without polling. No blanket timer to avoid hammering Supabase.
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,

      // ⛔ NO refetchInterval — per-query polling is set only where needed
      // (e.g. live fleet tracking). A global 60s poll causes hundreds of
      // unnecessary Supabase calls/min across all logged-in users.
    },
    mutations: {
      // ⛔ NEVER retry mutations — a failed payment/attendance write
      // retried 3x would create 3 duplicate database records.
      retry: false,
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