// src/hooks/useClasses.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { classesService } from '../services/index'
import { useAuth } from './useAuth'
import toast from 'react-hot-toast'

export function useClasses() {
  const { user } = useAuth()
  const schoolId = user?.school_id ?? ''

  return useQuery({
    queryKey: ['classes', schoolId],
    queryFn: async () => {
      const { data, error } = await classesService.getAll(schoolId)
      if (error) throw error
      return data ?? []
    },
    enabled: !!schoolId,
  })
}

export function useCreateClass() {
  const qc = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: (data: any) =>
      classesService.create({ ...data, school_id: user?.school_id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classes'] })
      toast.success('Class created')
    },
    onError: () => toast.error('Failed to create class'),
  })
}

export function useUpdateClass() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...data }: any) => classesService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classes'] })
      toast.success('Class updated')
    },
    onError: () => toast.error('Failed to update class'),
  })
}

export function useDeleteClass() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => classesService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classes'] })
      toast.success('Class deleted')
    },
    onError: () => toast.error('Failed to delete class'),
  })
}