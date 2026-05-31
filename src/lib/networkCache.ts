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
 * Only hydrates data that is less than 2 minutes old to prevent serving stale data.
 */
export function hydrateQueryClient(queryClient: QueryClient) {
  try {
    const saved = localStorage.getItem(CACHE_KEY)
    if (!saved) return

    const cachedQueries: CachedQuery[] = JSON.parse(saved)
    if (!Array.isArray(cachedQueries)) return

    const now = Date.now()
    const maxAge = 1000 * 60 * 2 // 2 minutes
    let hydratedCount = 0

    cachedQueries.forEach((q) => {
      // Validate key structure and data existence
      if (q && Array.isArray(q.queryKey) && q.data !== undefined) {
        // Only hydrate if data is less than 2 minutes old
        const age = now - (q.updatedAt || 0)
        if (age < maxAge) {
          queryClient.setQueryData(q.queryKey, q.data)
          
          // Set the update timestamp to now so data is considered fresh
          const query = queryClient.getQueryCache().find({ queryKey: q.queryKey })
          if (query) {
            query.state.dataUpdatedAt = now
          }
          hydratedCount++
        }
      }
    })

    console.log(`[NetworkCache] Hydrated ${hydratedCount}/${cachedQueries.length} fresh query cache entries...`)
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
      // Academic structure
      'settings',
      'term-current',
      'academic-year-current',
      'academic-years',
      'terms',
      'classes',
      'subjects',
      'departments',
      'syllabus',
      // People
      'teachers',
      'teacher-assignments',
      'students',
      'parents',
      'staff',
      // Assessments & scores
      'assignments',
      'scores',
      'reports',
      'assessments',
      // Finance
      'fees',
      'invoices',
      'payroll',
      // Operations
      'attendance',
      'timetable',
      'announcements',
      'news',
      'school',
      'user-profile',
      'notifications',
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
