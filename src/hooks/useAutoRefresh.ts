import { useEffect, useRef } from 'react'

/**
 * Runs `callback` on a timer (default 60 s), but only when the tab is visible.
 *
 * IMPORTANT: The callback is captured in a ref so the interval is NEVER
 * torn down and re-created just because the parent component re-renders with
 * a new inline function reference. Previously the `callback` in the deps array
 * caused the interval to reset every render, making it effectively useless
 * on components that re-render frequently.
 */
export function useAutoRefresh(callback: () => void | Promise<void>, intervalMs = 60_000) {
  // Stable ref so we never need the interval to restart
  const callbackRef = useRef(callback)
  useEffect(() => {
    callbackRef.current = callback
  }) // no deps — update on every render so the ref is always fresh

  useEffect(() => {
    const timer = setInterval(() => {
      // Only fetch if the tab is actively visible to save battery/bandwidth
      if (document.hidden) return
      try {
        const result = callbackRef.current()
        if (result instanceof Promise) {
          result.catch((err) => console.error('[useAutoRefresh] async error:', err))
        }
      } catch (err) {
        console.error('[useAutoRefresh] error:', err)
      }
    }, intervalMs)

    return () => clearInterval(timer)
  }, [intervalMs]) // only restart if the interval duration itself changes
}
