// src/hooks/useSettings.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsService, teachersService, yearsService, termsService } from '../services/index'
import { useAuth } from './useAuth'
import toast from 'react-hot-toast'

// ── Settings ──────────────────────────────────────────────
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
  })
}

export function useUpdateSettings() {
  const qc = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: (data: any) => settingsService.upsert(user!.school_id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] })
      toast.success('Settings saved')
    },
    onError: () => toast.error('Failed to save settings'),
  })
}

// ── Teachers ──────────────────────────────────────────────
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

// ── Academic Years ────────────────────────────────────────
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

// ── Terms ─────────────────────────────────────────────────
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