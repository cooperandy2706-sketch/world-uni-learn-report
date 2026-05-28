// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

const MISSING_VARS = !supabaseUrl || !supabaseAnonKey

if (MISSING_VARS) {
  // In production Electron builds, if the env vars weren't injected at build
  // time, we surface a visible error page instead of crashing silently.
  console.error(
    '[Nexora] FATAL: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.\n' +
    'Ensure these are set as GitHub Actions secrets and listed in build.yml env: block.'
  )
  // Inject a user-visible error page directly into #root so it's never just blank.
  const injectError = () => {
    const root = document.getElementById('root')
    if (root) {
      root.innerHTML = `
        <div style="font-family:system-ui,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0f172a;padding:32px;box-sizing:border-box">
          <div style="background:#1e293b;border:1px solid #dc2626;border-radius: 8px;padding:40px;max-width:480px;width:100%;text-align:center">
            <div style="font-size:48px;margin-bottom:16px">⚙️</div>
            <h2 style="color:#f87171;font-size:22px;font-weight:800;margin:0 0 12px">Configuration Error</h2>
            <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 20px">
              This build is missing its database credentials.<br/>
              Please re-download the latest version of <strong style="color:#e2e8f0">Nexora</strong> from the releases page.
            </p>
            <p style="color:#475569;font-size:12px;margin:0;font-family:monospace">Error: VITE_SUPABASE_URL not set</p>
          </div>
        </div>`
    }
  }
  // Run immediately if DOM is ready, otherwise wait for it
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectError)
  } else {
    injectError()
  }
}

// Safe export: if env vars are missing, export a null placeholder so imports
// don't break at module evaluation time. Pages will fail gracefully since
// the error screen above will already be showing.
export const supabase = MISSING_VARS
  ? (null as any)
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        // Always persist the session in localStorage so page refreshes keep the user logged in
        persistSession: true,
        // Automatically refresh the JWT before it expires (prevents silent 401s)
        autoRefreshToken: true,
        // Detect magic-link / OAuth tokens in the URL on load
        detectSessionInUrl: true,
        // Unique storage key so multiple Nexora tabs don't clobber each other's sessions
        storageKey: 'wula-auth-token',
        // Use localStorage (default) – works in PWA/offline scenarios better than cookies
        storage: window.localStorage,
      },
      realtime: {
        // How many ms to wait before reconnecting a dropped WebSocket
        reconnectAfterMs: (tries: number) => Math.min(tries * 1000, 10_000),
        // Keep the WebSocket alive with heartbeat pings every 30s
        heartbeatIntervalMs: 30_000,
        // Increase timeout from default 10s → 30s for slow connections
        timeout: 30_000,
        params: {
          eventsPerSecond: 10,
        },
      },
      global: {
        // Set a reasonable fetch timeout to avoid hanging requests
        fetch: (url, options) => {
          const controller = new AbortController()
          const id = setTimeout(() => controller.abort(), 30_000)
          return fetch(url, { ...options, signal: controller.signal }).finally(() =>
            clearTimeout(id)
          )
        },
      },
    })