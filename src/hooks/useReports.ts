// src/hooks/useReports.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reportsService } from '../services/reports.service'
import { useAuth } from './useAuth'
import toast from 'react-hot-toast'

export function useReportsByClassTerm(classId: string, termId: string) {
  return useQuery({
    queryKey: ['reports', classId, termId],
    queryFn: async () => {
      const { data, error } = await reportsService.getByClassAndTerm(classId, termId)
      if (error) throw error
      return data ?? []
    },
    enabled: !!classId && !!termId,
  })
}

export function useStudentReport(studentId: string, termId: string) {
  return useQuery({
    queryKey: ['report', studentId, termId],
    queryFn: async () => {
      const { data, error } = await reportsService.getStudentReport(studentId, termId)
      if (error) throw error
      return data
    },
    enabled: !!studentId && !!termId,
  })
}

export function useGenerateReports() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ classId, termId, academicYearId }: {
      classId: string
      termId: string
      academicYearId: string
    }) => reportsService.generateForClass(classId, termId, academicYearId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reports'] })
      toast.success('Reports generated successfully')
    },
    onError: () => toast.error('Failed to generate reports'),
  })
}

export function useUpdateReportRemarks() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ reportId, remarks }: { reportId: string; remarks: any }) =>
      reportsService.updateRemarks(reportId, remarks),
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
    mutationFn: (reportId: string) => reportsService.approve(reportId, user!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reports'] })
      toast.success('Report approved')
    },
    onError: () => toast.error('Failed to approve report'),
  })
}