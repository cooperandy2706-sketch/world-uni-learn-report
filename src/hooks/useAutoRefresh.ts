import { useEffect } from 'react'

export function useAutoRefresh(callback: () => void, intervalMs = 60000) {
  useEffect(() => {
    const timer = setInterval(() => {
      // Only fetch if the tab is actively visible to save battery/bandwidth
      if (!document.hidden) {
        callback()
      }
    }, intervalMs)
    return () => clearInterval(timer)
  }, [callback, intervalMs])
}
