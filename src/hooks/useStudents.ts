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
    mutationFn: async (student: any) => {
      const { data, error } = await studentsService.create({ ...student, school_id: user?.school_id })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] })
      toast.success('Student added successfully')
    },
    onError: (err: any) => {
      if (err.code === '23505' && err.message?.includes('students_student_id_key')) {
        toast.error('This Student ID is already in use. Try a format like: ' + 
          (user?.school?.name?.substring(0, 3).toUpperCase() || 'STU') + '-' + 
          Math.floor(1000 + Math.random() * 9000));
      } else {
        toast.error(err.message || 'Failed to add student');
      }
    },
  })
}

export function useUpdateStudent() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { data: res, error } = await studentsService.update(id, data)
      if (error) throw error
      return res
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] })
      toast.success('Student updated successfully')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update student'),
  })
}

export function useDeleteStudent() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await studentsService.delete(id)
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] })
      toast.success('Student removed')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to remove student'),
  })
}