import { useEffect } from 'react'

export function useAutoRefresh(callback: () => void | Promise<void>, intervalMs = 60000) {
  useEffect(() => {
    const timer = setInterval(() => {
      // Only fetch if the tab is actively visible to save battery/bandwidth
      if (!document.hidden) {
        try {
          const result = callback()
          // Handle async callbacks
          if (result instanceof Promise) {
            result.catch(err => {
              console.error('[useAutoRefresh] Error in async callback:', err)
            })
          }
        } catch (err) {
          console.error('[useAutoRefresh] Error in callback:', err)
        }
      }
    }, intervalMs)
    return () => clearInterval(timer)
  }, [callback, intervalMs])
}
