// src/hooks/useStudents.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { studentsService } from '../services/students.service'
import { useAuth } from './useAuth'
import toast from 'react-hot-toast'

export function useStudents() {
  const { user } = useAuth()
  const schoolId = user?.school_id ?? ''

  return useQuery({
    queryKey: ['students', schoolId],
    queryFn: async () => {
      const { data, error } = await studentsService.getAll(schoolId)
      if (error) throw error
      return data ?? []
    },
    enabled: !!schoolId,
  })
}

export function useStudentsByClass(classId: string) {
  return useQuery({
    queryKey: ['students', 'class', classId],
    queryFn: async () => {
      const { data, error } = await studentsService.getByClass(classId)
      if (error) throw error
      return data ?? []
    },
    enabled: !!classId,
  })
}

export function useCreateStudent() {
  const qc = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: (student: any) =>
      studentsService.create({ ...student, school_id: user?.school_id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] })
      toast.success('Student added successfully')
    },
    onError: () => toast.error('Failed to add student'),
  })
}

export function useUpdateStudent() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...data }: any) => studentsService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] })
      toast.success('Student updated successfully')
    },
    onError: () => toast.error('Failed to update student'),
  })
}

export function useDeleteStudent() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => studentsService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] })
      toast.success('Student removed')
    },
    onError: () => toast.error('Failed to remove student'),
  })
}