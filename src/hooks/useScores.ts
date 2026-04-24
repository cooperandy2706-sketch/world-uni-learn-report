// src/hooks/useScores.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { scoresService } from '../services/scores.service'
import { calculateClassPositions } from '../utils/grading'
import toast from 'react-hot-toast'

export function useScoresByClassTerm(classId: string, termId: string) {
  return useQuery({
    queryKey: ['scores', 'class', classId, termId],
    queryFn: async () => {
      const { data, error } = await scoresService.getByClassAndTerm(classId, termId)
      if (error) throw error
      return data ?? []
    },
    enabled: !!classId && !!termId,
  })
}

export function useScoresBySubject(subjectId: string, classId: string, termId: string) {
  return useQuery({
    queryKey: ['scores', 'subject', subjectId, classId, termId],
    queryFn: async () => {
      const { data, error } = await scoresService.getBySubjectClassTerm(subjectId, classId, termId)
      if (error) throw error
      return data ?? []
    },
    enabled: !!subjectId && !!classId && !!termId,
  })
}

export function useStudentScores(studentId: string, termId: string) {
  return useQuery({
    queryKey: ['scores', 'student', studentId, termId],
    queryFn: async () => {
      const { data, error } = await scoresService.getStudentScores(studentId, termId)
      if (error) throw error
      return data ?? []
    },
    enabled: !!studentId && !!termId,
  })
}

export function useUpsertScore() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (score: any) => scoresService.upsertScore(score),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['scores', 'class', variables.class_id] })
      qc.invalidateQueries({ queryKey: ['scores', 'subject', variables.subject_id] })
    },
    onError: () => toast.error('Failed to save score'),
  })
}

export function useBulkUpsertScores() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (scores: any[]) => {
      if (scores.length === 0) return { data: [] }
      
      // Group by subject to calculate positions correctly per subject
      const subjectGroups: Record<string, any[]> = {}
      scores.forEach(s => {
        if (!subjectGroups[s.subject_id]) subjectGroups[s.subject_id] = []
        subjectGroups[s.subject_id].push(s)
      })

      const withPositions = Object.values(subjectGroups).flatMap(group => 
        calculateClassPositions(group.map(s => ({ ...s, total_score: (s.class_score || 0) + (s.exam_score || 0) })))
      )

      // Remove total_score from the final objects as it is a generated column in DB
      const dbPayload = withPositions.map(({ total_score, ...s }) => s)

      const { data, error } = await scoresService.bulkUpsert(dbPayload)
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scores'] })
    },
    onError: (error: any) => {
      console.error('Bulk Save Error:', error)
      toast.error(`Failed to save: ${error.message || 'Unknown error'}`)
    },
  })
}

export function useSubmitScores() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ classId, subjectId, termId }: { classId: string; subjectId: string; termId: string }) =>
      scoresService.submitScores(classId, subjectId, termId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scores'] })
      toast.success('Scores submitted successfully')
    },
    onError: () => toast.error('Failed to submit scores'),
  })
}