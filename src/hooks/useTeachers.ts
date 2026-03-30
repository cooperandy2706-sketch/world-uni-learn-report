// src/hooks/useTeachers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import toast from 'react-hot-toast'

// Full teacher with all related data
export function useTeachers() {
  const { user } = useAuth()
  const schoolId = user?.school_id ?? ''

  return useQuery({
    queryKey: ['teachers', schoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teachers')
        .select(`
          id,
          staff_id,
          qualification,
          user_id,
          school_id,
          user:users (
            id,
            full_name,
            email,
            phone,
            avatar_url,
            role,
            is_active,
            created_at
          )
        `)
        .eq('school_id', schoolId)
        .order('user(full_name)')
      if (error) throw error
      return data ?? []
    },
    enabled: !!schoolId,
  })
}

// Single teacher with full assignments, syllabus, goals
export function useTeacherDetail(teacherId: string) {
  const { data: term } = { data: null } as any // will be passed in

  return useQuery({
    queryKey: ['teacher-detail', teacherId],
    queryFn: async () => {
      const [
        { data: teacher },
        { data: assignments },
        { data: goals },
      ] = await Promise.all([
        supabase.from('teachers')
          .select('*, user:users(*)')
          .eq('id', teacherId)
          .single(),
        supabase.from('teacher_assignments')
          .select('*, class:classes(id,name), subject:subjects(id,name), term:terms(id,name)')
          .eq('teacher_id', teacherId)
          .order('class(name)'),
        supabase.from('weekly_goals')
          .select('*, class:classes(name), subject:subjects(name)')
          .eq('teacher_id', teacherId)
          .order('week_number', { ascending: false })
          .limit(10),
      ])
      return { teacher, assignments: assignments ?? [], goals: goals ?? [] }
    },
    enabled: !!teacherId,
  })
}

export function useUpdateTeacher() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ teacherId, userId, teacherData, userData }: any) => {
      const [t, u] = await Promise.all([
        supabase.from('teachers').update(teacherData).eq('id', teacherId).select().single(),
        supabase.from('users').update(userData).eq('id', userId).select().single(),
      ])
      if (t.error) throw t.error
      if (u.error) throw u.error
      return t.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teachers'] })
      toast.success('Teacher updated')
    },
    onError: (e: any) => toast.error(e.message),
  })
}

export function useDeleteTeacher() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ teacherId, userId }: { teacherId: string; userId: string }) => {
      await supabase.from('teacher_assignments').delete().eq('teacher_id', teacherId)
      await supabase.from('weekly_goals').delete().eq('teacher_id', teacherId)
      await supabase.from('teachers').delete().eq('id', teacherId)
      await supabase.from('users').delete().eq('id', userId)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teachers'] })
      toast.success('Teacher removed')
    },
    onError: (e: any) => toast.error(e.message ?? 'Failed to delete'),
  })
}