// src/lib/networkCache.ts
import { QueryClient } from '@tanstack/react-query'

const CACHE_KEY = 'wula-query-cache-v2'

interface CachedQuery {
  queryKey: any[]
  data: any
  updatedAt: number
}

/**
 * Hydrates the query client with cached data from localStorage.
 * Enables 0ms load times on slow networks or when offline.
 */
export function hydrateQueryClient(queryClient: QueryClient) {
  try {
    const saved = localStorage.getItem(CACHE_KEY)
    if (!saved) return

    const cachedQueries: CachedQuery[] = JSON.parse(saved)
    if (!Array.isArray(cachedQueries)) return

    console.log(`[NetworkCache] Hydrating ${cachedQueries.length} query cache entries...`)
    
    cachedQueries.forEach((q) => {
      // Validate key structure and data existence
      if (q && Array.isArray(q.queryKey) && q.data !== undefined) {
        queryClient.setQueryData(q.queryKey, q.data)
        
        // Match the original update timestamp so React Query knows its stale state
        const query = queryClient.getQueryCache().find({ queryKey: q.queryKey })
        if (query) {
          query.state.dataUpdatedAt = q.updatedAt || Date.now()
        }
      }
    })
  } catch (err) {
    console.warn('[NetworkCache] Failed to hydrate query client cache:', err)
  }
}

/**
 * Synchronizes key query cache entries to localStorage.
 * Filters out large or transient states to keep the cache light and reliable.
 */
export function persistQueryCache(queryClient: QueryClient) {
  try {
    const allQueries = queryClient.getQueryCache().getAll()
    const allowedPrefixes = [
      'settings',
      'term-current',
      'academic-year-current',
      'academic-years',
      'terms',
      'classes',
      'teachers',
      'teacher-assignments',
      'syllabus',
      'assignments'
    ]

    const serializable = allQueries
      .filter((q) => {
        // Only persist successful queries with data
        if (q.state.status !== 'success' || q.state.data === undefined) return false

        // Check if query key prefix is on the optimization list
        const keyPrefix = q.queryKey[0]
        if (typeof keyPrefix !== 'string') return false
        return allowedPrefixes.includes(keyPrefix)
      })
      .map((q) => ({
        queryKey: q.queryKey,
        data: q.state.data,
        updatedAt: q.state.dataUpdatedAt
      }))

    localStorage.setItem(CACHE_KEY, JSON.stringify(serializable))
  } catch (err) {
    console.warn('[NetworkCache] Failed to persist query client cache:', err)
  }
}
