import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { studentsService } from '../services/students.service'
import { useAuth } from './useAuth'
import toast from 'react-hot-toast'

export function useStudents(opts?: { search?: string, classId?: string, gender?: string }) {
  const { user } = useAuth()
  const schoolId = user?.school_id ?? ''
  const limit = 50

  return useInfiniteQuery({
    queryKey: ['students', schoolId, opts],
    queryFn: async ({ pageParam = 0 }) => {
      const { data, count, error } = await studentsService.getAll(schoolId, {
        page: pageParam,
        limit,
        ...opts
      })
      if (error) throw error
      return {
        data: data ?? [],
        nextPage: (data?.length === limit) ? pageParam + 1 : undefined,
        total: count ?? 0
      }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!schoolId,
  })
}

export function useStudentsByClass(classId: string) {
  const { user } = useAuth()
  const schoolId = user?.school_id ?? ''

  return useQuery({
    queryKey: ['students', 'class', classId],
    queryFn: async () => {
      const { data, error } = await studentsService.getByClass(schoolId, classId)
      if (error) throw error
      return data ?? []
    },
    enabled: !!classId && !!schoolId,
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
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { data: res, error } = await studentsService.update(user?.school_id ?? '', id, data)
      if (error) throw error
      return res
    },
    // ── Optimistic update: patch the in-memory cache immediately ──────────
    onMutate: async ({ id, ...data }: any) => {
      // Cancel any in-flight refetches so they don't overwrite our optimistic data
      await qc.cancelQueries({ queryKey: ['students'] })
      // Snapshot the current value so we can roll back on failure
      const prev = qc.getQueriesData({ queryKey: ['students'] })
      // Optimistically update the student in all matching paginated caches
      qc.setQueriesData({ queryKey: ['students'] }, (old: any) => {
        if (!old?.pages) return old
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: page.data.map((s: any) => s.id === id ? { ...s, ...data } : s)
          }))
        }
      })
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      // Roll back to snapshot on failure
      ctx?.prev?.forEach(([key, val]: any) => qc.setQueryData(key, val))
      toast.error('Failed to update student')
    },
    onSuccess: () => {
      // Quietly refetch to sync with server truth
      qc.invalidateQueries({ queryKey: ['students'] })
      toast.success('Student updated successfully')
    },
  })
}

export function useDeleteStudent() {
  const qc = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await studentsService.delete(user?.school_id ?? '', id)
      if (error) throw error
      return data
    },
    // ── Optimistic removal: vanish from list instantly, roll back on error ──
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ['students'] })
      const prev = qc.getQueriesData({ queryKey: ['students'] })
      qc.setQueriesData({ queryKey: ['students'] }, (old: any) => {
        if (!old?.pages) return old
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: page.data.filter((s: any) => s.id !== id)
          }))
        }
      })
      return { prev }
    },
    onError: (_err, _id, ctx) => {
      ctx?.prev?.forEach(([key, val]: any) => qc.setQueryData(key, val))
      toast.error('Failed to remove student')
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] })
      toast.success('Student removed')
    },
  })
}