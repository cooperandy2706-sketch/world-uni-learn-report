// src/hooks/useSettings.ts
// ─────────────────────────────────────────────────────────────────────────────
// FIXES vs old version:
//  1. useUpdateSettings.onSuccess invalidates ['settings', schoolId] with the
//     FULL key (not just ['settings']) so the exact cached entry is replaced.
//  2. Removed the toast from onSuccess — SettingsPage.onSubmit already shows
//     its own toast, so we were getting two "Settings saved" toasts.
//  3. useUpdateSettings now accepts schoolId so the invalidation key matches
//     what useSettings registers — ['settings', schoolId].
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsService, teachersService, yearsService, termsService } from '../services/index'
import { useAuth } from './useAuth'
import toast from 'react-hot-toast'

// ── Settings ──────────────────────────────────────────────────────────────────
export function useSettings() {
  const { user } = useAuth()
  const schoolId = user?.school_id ?? ''

  return useQuery({
    queryKey: ['settings', schoolId],
    queryFn: async () => {
      const { data, error } = await settingsService.get(schoolId)
      if (error) throw error
      return data
    },
    enabled: !!schoolId,
    // Keep previous data while refetching so the form doesn't flash empty
    placeholderData: (prev: any) => prev,
  })
}

export function useUpdateSettings() {
  const qc = useQueryClient()
  const { user } = useAuth()
  const schoolId = user?.school_id ?? ''

  return useMutation({
    mutationFn: (data: any) => settingsService.upsert(schoolId, data),

    onSuccess: () => {
      // Invalidate the EXACT key so the refetch brings back the joined school row
      qc.invalidateQueries({ queryKey: ['settings', schoolId] })
      // No toast here — SettingsPage.onSubmit handles user feedback
    },

    onError: (e: any) => {
      console.error('[useUpdateSettings] error:', e)
      toast.error('Failed to save report card settings')
    },
  })
}

// ── Teachers ──────────────────────────────────────────────────────────────────
export function useTeachers() {
  const { user } = useAuth()
  const schoolId = user?.school_id ?? ''

  return useQuery({
    queryKey: ['teachers', schoolId],
    queryFn: async () => {
      const { data, error } = await teachersService.getAll(schoolId)
      if (error) throw error
      return data ?? []
    },
    enabled: !!schoolId,
  })
}

export function useTeacherAssignments(teacherId: string, termId: string) {
  return useQuery({
    queryKey: ['teacher-assignments', teacherId, termId],
    queryFn: async () => {
      const { data, error } = await teachersService.getAssignments(teacherId, termId)
      if (error) throw error
      return data ?? []
    },
    enabled: !!teacherId && !!termId,
  })
}

// ── Academic Years ────────────────────────────────────────────────────────────
export function useAcademicYears() {
  const { user } = useAuth()
  const schoolId = user?.school_id ?? ''

  return useQuery({
    queryKey: ['academic-years', schoolId],
    queryFn: async () => {
      const { data, error } = await yearsService.getAll(schoolId)
      if (error) throw error
      return data ?? []
    },
    enabled: !!schoolId,
  })
}

export function useCurrentAcademicYear() {
  const { user } = useAuth()
  const schoolId = user?.school_id ?? ''

  return useQuery({
    queryKey: ['academic-year-current', schoolId],
    queryFn: async () => {
      const { data, error } = await yearsService.getCurrent(schoolId)
      if (error) return null
      return data
    },
    enabled: !!schoolId,
  })
}

// ── Terms ─────────────────────────────────────────────────────────────────────
export function useTerms(academicYearId: string) {
  return useQuery({
    queryKey: ['terms', academicYearId],
    queryFn: async () => {
      const { data, error } = await termsService.getAll(academicYearId)
      if (error) throw error
      return data ?? []
    },
    enabled: !!academicYearId,
  })
}

export function useCurrentTerm() {
  const { user } = useAuth()
  const schoolId = user?.school_id ?? ''

  return useQuery({
    queryKey: ['term-current', schoolId],
    queryFn: async () => {
      const { data, error } = await termsService.getCurrent(schoolId)
      if (error) return null
      return data
    },
    enabled: !!schoolId,
  })
}