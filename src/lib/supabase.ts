// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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