import { useState, useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider, onlineManager } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { router } from './router'
import { queryClient } from './lib/queryClient'
import { supabase } from './lib/supabase'
import SplashScreen from './components/layout/SplashScreen'
import GlobalAlarm from './components/ui/GlobalAlarm'
import { useAuthStore } from './store/authStore'

export default function App() {
  const [minTimeElapsed, setMinTimeElapsed] = useState(false)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const { initialized, initialize } = useAuthStore()

  useEffect(() => {
    if (!initialized) initialize()
  }, [initialized, initialize])

  useEffect(() => {
    // Show splash for minimum 1.5s for branding, then let the app through
    const timer = setTimeout(() => setMinTimeElapsed(true), 1500)
    return () => clearTimeout(timer)
  }, [])

  // ── Network awareness ─────────────────────────────────────────────────────
  // Listen to the custom events dispatched by main.tsx (which no longer
  // destroys the React root). When we come back online, tell React Query to
  // refetch all stale queries so data is instantly up to date.
  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true)
      onlineManager.setOnline(false)
    }
    const handleOnline = () => {
      setIsOffline(false)
      onlineManager.setOnline(true)
      // Refetch everything that went stale while we were offline
      queryClient.invalidateQueries()
    }

    window.addEventListener('wula:offline', handleOffline)
    window.addEventListener('wula:online', handleOnline)
    // Also catch the native browser events for redundancy
    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('wula:offline', handleOffline)
      window.removeEventListener('wula:online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])


  // Exit splash once auth is initialized and minimum branding time has elapsed.
  const isReady = minTimeElapsed && initialized

  // ── QueryClientProvider wraps everything — including SplashScreen ──────────
  // This guarantees the cache is always available from the very first render,
  // even before auth initialises. Previously it only mounted AFTER isReady,
  // which meant any component that called useQuery during the splash had no
  // provider and would throw or silently hang.
  return (
    <QueryClientProvider client={queryClient}>
      {!isReady ? (
        <SplashScreen />
      ) : (
        <>
          {/* ── Offline Banner ────────────────────────────────────────── */}
          {isOffline && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, zIndex: 99999,
              background: '#dc2626', color: '#fff', textAlign: 'center',
              padding: '0.6rem 1rem', fontSize: '0.85rem', fontWeight: 700,
              fontFamily: 'DM Sans, sans-serif', letterSpacing: '0.02em',
              boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
            }}>
              📡 You are offline — changes may not save until you reconnect.
            </div>
          )}

          <RouterProvider router={router} />
          <GlobalAlarm />
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
        </>
      )}
    </QueryClientProvider>
  )
}