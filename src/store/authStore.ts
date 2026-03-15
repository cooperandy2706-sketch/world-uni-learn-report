// src/store/authStore.ts
import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { AuthState } from '../types'
import type { User } from '../types/database.types'

interface AuthStore extends AuthState {
  setUser: (user: User | null) => void
  setSession: (session: any) => void
  setLoading: (loading: boolean) => void
  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

// Helper: fetch with a hard timeout so a dropped connection never freezes the app
async function fetchWithTimeout<T>(promise: Promise<T>, ms = 6000): Promise<T | null> {
  try {
    return await Promise.race([
      promise,
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), ms)
      ),
    ]) as T
  } catch {
    return null
  }
}

export const useAuthStore = create<AuthStore>((set, _get) => ({
  user: null,
  session: null,
  loading: true,
  initialized: false,

  setUser:    (user)    => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),

  initialize: async () => {
    try {
      const sessionResult = await fetchWithTimeout(supabase.auth.getSession(), 6000)
      const session = sessionResult?.data?.session ?? null

      if (session?.user) {
        const profileResult = await fetchWithTimeout(
          supabase.from('users').select('*').eq('id', session.user.id).single(),
          6000
        )
        const profile = (profileResult as any)?.data ?? null
        set({ user: profile, session, loading: false, initialized: true })
      } else {
        set({ user: null, session: null, loading: false, initialized: true })
      }
    } catch {
      // Never hang — always resolve so the app renders
      set({ user: null, session: null, loading: false, initialized: true })
    }

    // Listen for future auth state changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const result = await fetchWithTimeout(
          supabase.from('users').select('*').eq('id', session.user.id).single(),
          6000
        )
        const profile = (result as any)?.data ?? null
        set({ user: profile, session })
      } else if (event === 'SIGNED_OUT') {
        set({ user: null, session: null })
      }
    })
  },

  signIn: async (email, password) => {
    set({ loading: true })
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      set({ loading: false })
      return { error: error?.message ?? null }
    } catch {
      set({ loading: false })
      return { error: 'Network error. Check your connection.' }
    }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null })
  },
}))