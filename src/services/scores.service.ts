// src/services/scores.service.ts
import { supabase } from '../lib/supabase'
import type { Score } from '../types'

export const scoresService = {
  async getByClassAndTerm(classId: string, termId: string) {
    return supabase
      .from('scores')
      .select('*, student:students(id, full_name, student_id), subject:subjects(id, name, code)')
      .eq('class_id', classId)
      .eq('term_id', termId)
      .order('student_id')
  },

  async getBySubjectClassTerm(subjectId: string, classId: string, termId: string) {
    return supabase
      .from('scores')
      .select('*, student:students(id, full_name, student_id)')
      .eq('subject_id', subjectId)
      .eq('class_id', classId)
      .eq('term_id', termId)
      .order('total_score', { ascending: false })
  },

  async getStudentScores(studentId: string, termId: string) {
    return supabase
      .from('scores')
      .select('*, subject:subjects(id, name, code)')
      .eq('student_id', studentId)
      .eq('term_id', termId)
      .order('subject_id')
  },

  async upsertScore(score: Partial<Score> & {
    student_id: string
    subject_id: string
    class_id: string
    term_id: string
    academic_year_id: string
  }) {
    return supabase
      .from('scores')
      .upsert(score, { onConflict: 'student_id,subject_id,term_id' })
      .select()
      .single()
  },

  async bulkUpsert(scores: Partial<Score>[]) {
    return supabase
      .from('scores')
      .upsert(scores, { onConflict: 'student_id,subject_id,term_id' })
      .select()
  },

  async submitScores(classId: string, subjectId: string, termId: string) {
    return supabase
      .from('scores')
      .update({ is_submitted: true })
      .eq('class_id', classId)
      .eq('subject_id', subjectId)
      .eq('term_id', termId)
  },

  async updatePositions(scores: { id: string; position: number }[]) {
    // Single bulk upsert instead of N individual UPDATE queries (O(1) vs O(n))
    return supabase
      .from('scores')
      .upsert(scores, { onConflict: 'id' })
      .select('id, position')
  },
}