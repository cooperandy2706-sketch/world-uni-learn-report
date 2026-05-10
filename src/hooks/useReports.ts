// src/hooks/useReports.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reportsService } from '../services/reports.service'
import { useAuth } from './useAuth'
import toast from 'react-hot-toast'

export function useReportsByClassTerm(classId: string, termId: string) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['reports', classId, termId],
    queryFn: async () => {
      const { data, error } = await reportsService.getByClassAndTerm(user?.school_id ?? '', classId, termId)
      if (error) throw error
      return data ?? []
    },
    enabled: !!classId && !!termId && !!user?.school_id,
  })
}

export function useStudentReport(studentId: string, termId: string) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['report', studentId, termId],
    queryFn: async () => {
      const { data, error } = await reportsService.getStudentReport(user?.school_id ?? '', studentId, termId)
      if (error) throw error
      return data
    },
    enabled: !!studentId && !!termId && !!user?.school_id,
  })
}

export function useGenerateReports() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ classId, termId, academicYearId }: {
      classId: string
      termId: string
      academicYearId: string
    }) => {
      const res = await reportsService.generateForClass(classId, termId, academicYearId)
      if (res.error) throw new Error(res.error.message || res.error)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reports'] })
      toast.success('Reports generated successfully')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to generate reports'),
  })
}

export function useUpdateReportRemarks() {
  const qc = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: ({ reportId, remarks }: { reportId: string; remarks: any }) =>
      reportsService.updateRemarks(user?.school_id ?? '', reportId, remarks),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reports'] })
      toast.success('Remarks updated')
    },
    onError: () => toast.error('Failed to update remarks'),
  })
}

export function useApproveReport() {
  const qc = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: (reportId: string) => reportsService.approve(user?.school_id ?? '', reportId, user!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reports'] })
      toast.success('Report approved')
    },
    onError: () => toast.error('Failed to approve report'),
  })
}