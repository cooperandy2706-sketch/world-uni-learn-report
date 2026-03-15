// src/hooks/useSubjects.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { subjectsService } from '../services/index'
import { useAuth } from './useAuth'
import toast from 'react-hot-toast'

export function useSubjects() {
  const { user } = useAuth()
  const schoolId = user?.school_id ?? ''

  return useQuery({
    queryKey: ['subjects', schoolId],
    queryFn: async () => {
      const { data, error } = await subjectsService.getAll(schoolId)
      if (error) throw error
      return data ?? []
    },
    enabled: !!schoolId,
  })
}

export function useCreateSubject() {
  const qc = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: (data: any) =>
      subjectsService.create({ ...data, school_id: user?.school_id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subjects'] })
      toast.success('Subject created')
    },
    onError: () => toast.error('Failed to create subject'),
  })
}

export function useUpdateSubject() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...data }: any) => subjectsService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subjects'] })
      toast.success('Subject updated')
    },
    onError: () => toast.error('Failed to update subject'),
  })
}

export function useDeleteSubject() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => subjectsService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subjects'] })
      toast.success('Subject deleted')
    },
    onError: () => toast.error('Failed to delete subject'),
  })
}