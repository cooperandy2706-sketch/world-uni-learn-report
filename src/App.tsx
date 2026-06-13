import { useState, useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider, onlineManager } from '@tanstack/react-query'
import { Toaster, resolveValue, type Toast } from 'react-hot-toast'
import { router } from './router'
import { queryClient } from './lib/queryClient'
import { supabase } from './lib/supabase'
import SplashScreen from './components/layout/SplashScreen'
import GlobalAlarm from './components/ui/GlobalAlarm'
import { useAuthStore } from './store/authStore'
import { ErrorBoundary } from './components/ui/ErrorBoundary'

// ── WhatsApp-style toast renderer ─────────────────────────────────────────────
const TOAST_STYLES = `
  @keyframes toastSlideUp {
    from { opacity: 0; transform: translateY(20px) scale(0.95); }
    to   { opacity: 1; transform: translateY(0)    scale(1);    }
  }
  @keyframes toastFadeOut {
    from { opacity: 1; transform: translateY(0) scale(1); }
    to   { opacity: 0; transform: translateY(8px) scale(0.96); }
  }
  .wa-toast {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 11px 18px 11px 14px;
    border-radius: 999px;
    font-family: 'DM Sans', system-ui, sans-serif;
    font-size: 13.5px;
    font-weight: 600;
    line-height: 1.35;
    letter-spacing: -0.01em;
    max-width: min(420px, calc(100vw - 32px));
    box-shadow: 0 4px 24px rgba(0,0,0,0.22), 0 1px 4px rgba(0,0,0,0.12);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    cursor: default;
    pointer-events: all;
    word-break: break-word;
  }
  .wa-toast--success {
    background: linear-gradient(135deg, rgba(22,163,74,0.97), rgba(16,185,129,0.97));
    color: #fff;
    border: 1px solid rgba(255,255,255,0.15);
  }
  .wa-toast--error {
    background: linear-gradient(135deg, rgba(220,38,38,0.97), rgba(239,68,68,0.97));
    color: #fff;
    border: 1px solid rgba(255,255,255,0.15);
  }
  .wa-toast--loading {
    background: rgba(15,23,42,0.94);
    color: #e2e8f0;
    border: 1px solid rgba(255,255,255,0.08);
  }
  .wa-toast--blank {
    background: rgba(15,23,42,0.94);
    color: #e2e8f0;
    border: 1px solid rgba(255,255,255,0.08);
  }
  .wa-toast-icon {
    font-size: 16px;
    line-height: 1;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .wa-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    flex-shrink: 0;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`

function WhatsAppToast({ t }: { t: Toast }) {
  const typeClass =
    t.type === 'success' ? 'wa-toast--success' :
    t.type === 'error'   ? 'wa-toast--error'   :
    t.type === 'loading' ? 'wa-toast--loading'  :
    'wa-toast--blank'

  const icon =
    t.type === 'success' ? '✓' :
    t.type === 'error'   ? '✕' :
    null

  return (
    <div
      className={`wa-toast ${typeClass}`}
      style={{
        animation: t.visible
          ? 'toastSlideUp 0.35s cubic-bezier(0.34,1.56,0.64,1) both'
          : 'toastFadeOut 0.25s ease forwards',
      }}
    >
      {t.type === 'loading' ? (
        <div className="wa-spinner" />
      ) : icon ? (
        <span className="wa-toast-icon">{icon}</span>
      ) : null}
      <span>{resolveValue(t.message, t)}</span>
    </div>
  )
}

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

          <ErrorBoundary>
            <RouterProvider router={router} />
          </ErrorBoundary>
          <GlobalAlarm />

          {/* ── WhatsApp-style toast styles ─────────────────────────── */}
          <style>{TOAST_STYLES}</style>

          <Toaster
            position="bottom-center"
            gutter={10}
            containerStyle={{
              bottom: 72, // clear the bottom nav
            }}
            toastOptions={{
              duration: 3500,
              // Strip all default styles — our custom render handles everything
              style: { background: 'transparent', boxShadow: 'none', padding: 0, margin: 0, maxWidth: 'none' },
            }}
          >
            {(t) => <WhatsAppToast t={t} />}
          </Toaster>
        </>
      )}
    </QueryClientProvider>
  )
}