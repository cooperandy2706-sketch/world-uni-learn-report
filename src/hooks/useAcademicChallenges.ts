import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import toast from 'react-hot-toast'

export function useAcademicChallenges(classId?: string, termId?: string) {
  const { user } = useAuth()
  const schoolId = user?.school_id ?? ''

  return useQuery({
    queryKey: ['academic_challenges', schoolId, classId, termId],
    queryFn: async () => {
      let query = supabase
        .from('academic_challenges')
        .select('*, student:students(id, full_name, student_id)')
        .eq('school_id', schoolId)

      if (classId) query = query.eq('class_id', classId)
      if (termId) query = query.eq('term_id', termId)

      query = query.order('created_at', { ascending: false })

      const { data, error } = await query
      if (error) throw error
      return data ?? []
    },
    enabled: !!schoolId,
  })
}

export function useCreateAcademicChallenge() {
  const qc = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (challenge: any) => {
      const { data, error } = await supabase
        .from('academic_challenges')
        .insert([{ ...challenge, school_id: user?.school_id, created_by: user?.id }])
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academic_challenges'] })
      toast.success('Challenge recorded successfully')
    },
    onError: (err: any) => {
      console.error('Error creating challenge:', err)
      toast.error('Failed to record challenge')
    },
  })
}
