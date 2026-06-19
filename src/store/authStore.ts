// src/store/authStore.ts
import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { queryClient } from '../lib/queryClient'
import type { AuthState } from '../types'
import type { User } from '../types/database.types'

interface AuthStore extends AuthState {
  setUser: (user: User | null) => void
  setSession: (session: any) => void
  setLoading: (loading: boolean) => void
  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  firstLoadComplete: boolean
  setFirstLoadComplete: (val: boolean) => void
}

// Module-level handle — ensures we never register the listener more than once
let _authUnsubscribe: (() => void) | null = null

// ── Helper: fetch profile + school for a given user ──────────────────────────
async function fetchProfile(userId: string): Promise<User | null> {
  const { data: profile, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error || !profile) return null

  if (profile.school_id) {
    const { data: school } = await supabase
      .from('schools')
      .select('*')
      .eq('id', profile.school_id)
      .maybeSingle()
    if (school) profile.school = school
  }

  return profile as User
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  session: null,
  loading: true,
  initialized: false,
  firstLoadComplete: false,

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),
  setFirstLoadComplete: (firstLoadComplete) => set({ firstLoadComplete }),

  initialize: async () => {
    // Tear down any existing listener before registering a fresh one
    _authUnsubscribe?.()
    _authUnsubscribe = null

    // ── 1. Bootstrap: load existing session from localStorage ────────
    // Race the session fetch against a timeout so a slow network or
    // Supabase cold-start can never leave the user on a blank splash
    // screen forever. If the timeout wins, we surface the login page.
    const sessionResult = await Promise.race([
      supabase.auth.getSession(),
      new Promise<{ data: { session: null } }>((resolve) =>
        setTimeout(() => {
          console.warn('[Acadera Auth] getSession() timed out after 2 min — proceeding to login')
          resolve({ data: { session: null } })
        }, 120_000)  // 2 minutes — generous for slow school networks
      ),
    ])
    const session = sessionResult.data.session

    if (session?.user) {
      const profile = await fetchProfile(session.user.id)
      set({ user: profile, session, loading: false, initialized: true })
    } else {
      set({ user: null, session: null, loading: false, initialized: true })
    }

    // ── 2. Listen for ALL auth state changes going forward ───────────
    //
    // CRITICAL events and what they mean:
    //  INITIAL_SESSION    - Session loaded from storage on startup
    //  SIGNED_IN          - User signed in (including token refresh sign-in)
    //  SIGNED_OUT         - Token expired with no refresh possible, or manual sign-out
    //  TOKEN_REFRESHED    - JWT was successfully refreshed — re-fetch profile so
    //                       new session data propagates to all queries
    //  USER_UPDATED       - Profile changed (email/password update)
    //  PASSWORD_RECOVERY  - Magic link / reset flow
    //
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.debug('[Acadera Auth]', event, session?.user?.id ?? 'no-user')

      if (event === 'SIGNED_OUT' || !session?.user) {
        // Clear all cached data so the next user gets a clean slate
        queryClient.clear()
        set({ user: null, session: null })

        // Nuclear fallback ONLY for genuine mid-session sign-outs.
        // INITIAL_SESSION with no user just means no one is logged in —
        // React's <Navigate> handles that cleanly without a hard reload.
        // We also debounce so React has 600ms to handle it first.
        if (event === 'SIGNED_OUT') {
          setTimeout(() => {
            const isOnProtectedRoute = !window.location.pathname.startsWith('/login') &&
              !window.location.pathname.startsWith('/register') &&
              !window.location.pathname.startsWith('/forgot') &&
              window.location.pathname !== '/' &&
              !window.location.pathname.startsWith('/schools') &&
              !window.location.pathname.startsWith('/privacy') &&
              !window.location.pathname.startsWith('/terms')

            if (isOnProtectedRoute) {
              window.location.replace('/login')
            }
          }, 600)  // give React 600ms to handle it via <Navigate> first
        }
        return
      }

      if (
        event === 'SIGNED_IN' ||
        event === 'TOKEN_REFRESHED' ||
        event === 'USER_UPDATED' ||
        event === 'INITIAL_SESSION'
      ) {
        const profile = await fetchProfile(session.user.id)
        set({ user: profile, session })

        // When the token is refreshed, invalidate ALL queries so they
        // re-run with the fresh Authorization header automatically.
        if (event === 'TOKEN_REFRESHED') {
          queryClient.invalidateQueries()
        }
      }
    })

    _authUnsubscribe = () => subscription.unsubscribe()
  },

  signIn: async (email, password) => {
    set({ loading: true })
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    set({ loading: false })
    return { error: error?.message ?? null }
  },

  signOut: async () => {
    queryClient.clear()
    await supabase.auth.signOut()
    set({ user: null, session: null })
  },
}))