// src/hooks/useStuckLoadingReload.ts
// Automatically reloads the current page (preserving URL + search params)
// if the page stays in a loading state longer than `timeoutMs`.

import { useEffect, useRef, useState } from 'react'

interface Options {
  /** How long (ms) to wait before triggering a reload. Default: 8000 */
  timeoutMs?: number
  /** How many auto-reload attempts before giving up & showing manual button. Default: 2 */
  maxRetries?: number
}

export function useStuckLoadingReload(isLoading: boolean, options: Options = {}) {
  const { timeoutMs = 8000, maxRetries = 2 } = options

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const retryCountRef = useRef(0)
  const [showManualRetry, setShowManualRetry] = useState(false)

  useEffect(() => {
    // Loading just resolved – clear the timer
    if (!isLoading) {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      return
    }

    // Loading started – set a timeout
    timerRef.current = setTimeout(() => {
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current += 1
        // Reload in place (keeps URL + query string intact)
        window.location.reload()
      } else {
        // Exceeded retries – surface the manual button instead of looping
        setShowManualRetry(true)
      }
    }, timeoutMs)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [isLoading, timeoutMs, maxRetries])

  const manualReload = () => window.location.reload()

  return { showManualRetry, manualReload }
}
