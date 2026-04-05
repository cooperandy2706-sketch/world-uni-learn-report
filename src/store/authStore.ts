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
  firstLoadComplete: boolean
  setFirstLoadComplete: (val: boolean) => void
}

// Module-level handle — ensures we never register the listener more than once
let _authUnsubscribe: (() => void) | null = null

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

    const { data } = await supabase.auth.getSession()
    const session = data.session

    if (session?.user) {
      // Fetch profile first
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profile) {
        // Fetch school separately to avoid 406 errors if relationship is missing
        if (profile.school_id) {
          const { data: school } = await supabase
            .from('schools')
            .select('*')
            .eq('id', profile.school_id)
            .single()
          if (school) profile.school = school
        }
      }

      set({
        user: profile as User ?? null,
        session,
        loading: false,
        initialized: true,
      })
    } else {
      set({
        user: null,
        session: null,
        loading: false,
        initialized: true,
      })
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profile) {
          if (profile.school_id) {
            const { data: school } = await supabase
              .from('schools')
              .select('*')
              .eq('id', profile.school_id)
              .single()
            if (school) profile.school = school
          }
        }

        set({
          user: profile as User ?? null,
          session,
        })
      } else {
        set({
          user: null,
          session: null,
        })
      }
    })

    _authUnsubscribe = () => subscription.unsubscribe()
  },

  signIn: async (email, password) => {
    set({ loading: true })

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    set({ loading: false })
    return { error: error?.message ?? null }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null })
  },
}))