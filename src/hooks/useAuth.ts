// src/hooks/useAuth.ts
import { useEffect } from 'react'
import { useAuthStore } from '../store/authStore'

export function useAuth() {
  const { user, session, loading, initialized, initialize, signIn, signOut } = useAuthStore()

  useEffect(() => {
    if (!initialized) initialize()
  }, [initialized, initialize])

  return {
    user,
    session,
    loading,
    initialized,
    isAdmin: user?.role === 'admin',
    isTeacher: user?.role === 'teacher',
    isSuperAdmin: user?.role === 'super_admin',
    isStudent: user?.role === 'student',
    isAuthenticated: !!user,
    signIn,
    signOut,
  }
}