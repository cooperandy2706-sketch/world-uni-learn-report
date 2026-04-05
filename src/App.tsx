import { useState, useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { router } from './router'
import { queryClient } from './lib/queryClient'
import SplashScreen from './components/layout/SplashScreen'
import { useAuthStore } from './store/authStore'

export default function App() {
  const [minTimeElapsed, setMinTimeElapsed] = useState(false)
  const { initialized, initialize, user, firstLoadComplete, setFirstLoadComplete } = useAuthStore()
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    if (!initialized) initialize()
  }, [initialized, initialize])

  useEffect(() => {
    // Show splash for minimum 2s on every fresh load/refresh
    const timer = setTimeout(() => setMinTimeElapsed(true), 2000)
    
    // Safety fallback: if firstLoadComplete doesn't trigger, let them through anyway
    // 6 seconds is long enough for slow connections but prevents being "stuck"
    const safetyTimer = setTimeout(() => setTimedOut(true), 6000)

    return () => {
      clearTimeout(timer)
      clearTimeout(safetyTimer)
    }
  }, [])

  // Exit condition: 
  // 1. Min time (2s) must pass.
  // 2. Auth must be initialized.
  // 3. If logged in, the first page must be ready (data fetched).
  // 4. Fallback to timedOut (6s) if data is really slow or a bug occurs.
  const isReady = minTimeElapsed && initialized && (!user || firstLoadComplete || timedOut)

  if (!isReady) {
    return <SplashScreen />
  }

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            borderRadius: '10px',
            fontSize: '14px',
            fontFamily: 'DM Sans, sans-serif',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </QueryClientProvider>
  )
}