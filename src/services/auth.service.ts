// src/services/auth.service.ts
import { supabase } from '../lib/supabase'
import type { User } from '../types'

export const authService = {
  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
    return data
  },

  async resetPassword(email: string) {
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
  },

  async updatePassword(newPassword: string) {
    return supabase.auth.updateUser({ password: newPassword })
  },
}