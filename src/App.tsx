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
  const { initialized, initialize } = useAuthStore()

  useEffect(() => {
    if (!initialized) initialize()
  }, [initialized, initialize])

  useEffect(() => {
    // Show splash for minimum 1.5s for branding, then let the app through
    const timer = setTimeout(() => setMinTimeElapsed(true), 1500)
    return () => clearTimeout(timer)
  }, [])

  // Exit splash once auth is initialized and minimum branding time has elapsed.
  // Individual pages handle their own data-loading spinners.
  const isReady = minTimeElapsed && initialized

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