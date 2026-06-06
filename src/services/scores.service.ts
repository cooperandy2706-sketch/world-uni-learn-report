// src/services/scores.service.ts
import { supabase } from '../lib/supabase'
import type { Score } from '../types'

export const scoresService = {
  async getByClassAndTerm(schoolId: string, classId: string, termId: string) {
    return supabase
      .from('scores')
      .select('*, student:students(id, full_name, student_id), subject:subjects(id, name, code)')
      .eq('school_id', schoolId)
      .eq('class_id', classId)
      .eq('term_id', termId)
      .order('student_id')
  },

  async getBySubjectClassTerm(schoolId: string, subjectId: string, classId: string, termId: string) {
    return supabase
      .from('scores')
      .select('*, student:students(id, full_name, student_id)')
      .eq('school_id', schoolId)
      .eq('subject_id', subjectId)
      .eq('class_id', classId)
      .eq('term_id', termId)
      .order('total_score', { ascending: false })
  },

  async getStudentScores(schoolId: string, studentId: string, termId: string) {
    return supabase
      .from('scores')
      .select('*, subject:subjects(id, name, code)')
      .eq('school_id', schoolId)
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
    // Check if score already exists
    const { data: existing } = await supabase
      .from('scores')
      .select('id')
      .eq('student_id', score.student_id)
      .eq('subject_id', score.subject_id)
      .eq('term_id', score.term_id)
      .maybeSingle()

    if (existing) {
      return supabase.from('scores').update(score).eq('id', existing.id).select().single()
    } else {
      return supabase.from('scores').insert(score).select().single()
    }
  },

  async bulkUpsert(scores: Partial<Score>[]) {
    if (!scores.length) return { data: [] }
    
    // Grab all existing IDs for the affected students/subjects/term
    // We assume the batch shares the same term for efficiency
    const termId = scores[0].term_id
    const studentIds = [...new Set(scores.map(s => s.student_id).filter(Boolean))] as string[]
    
    const { data: existing } = await supabase
      .from('scores')
      .select('id, student_id, subject_id, term_id')
      .in('student_id', studentIds)
      .eq('term_id', termId!)

    const existingMap = new Map((existing || []).map(r => [`${r.student_id}_${r.subject_id}_${r.term_id}`, r.id]))

    const toUpdate: any[] = []
    const toInsert: any[] = []

    scores.forEach(s => {
      const existingId = existingMap.get(`${s.student_id}_${s.subject_id}_${s.term_id}`)
      if (existingId) {
        toUpdate.push({ ...s, id: existingId })
      } else {
        toInsert.push(s)
      }
    })

    let results: any[] = []
    if (toUpdate.length > 0) {
      const { data: updData, error: updErr } = await supabase.from('scores').upsert(toUpdate, { onConflict: 'id' }).select()
      if (updErr) throw updErr
      results = results.concat(updData || [])
    }
    if (toInsert.length > 0) {
      const { data: insData, error: insErr } = await supabase.from('scores').insert(toInsert).select()
      if (insErr) throw insErr
      results = results.concat(insData || [])
    }

    return { data: results }
  },

  async submitScores(schoolId: string, classId: string, subjectId: string, termId: string) {
    return supabase
      .from('scores')
      .update({ is_submitted: true })
      .eq('school_id', schoolId)
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