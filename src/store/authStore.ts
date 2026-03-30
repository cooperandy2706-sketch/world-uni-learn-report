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

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  session: null,
  loading: true,
  initialized: false,

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),

  initialize: async () => {
    const { data } = await supabase.auth.getSession()
    const session = data.session

    if (session?.user) {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      set({
        user: profile ?? null,
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

    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        set({
          user: profile ?? null,
          session,
        })
      } else {
        set({
          user: null,
          session: null,
        })
      }
    })
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