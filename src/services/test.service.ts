// src/services/test.service.ts
import { supabase } from '../lib/supabase'
import { ClassTest, ClassTestScore } from '../types/database.types'

export const testService = {
  async getTests(classId: string, subjectId: string, termId: string) {
    const { data, error } = await supabase
      .from('class_tests')
      .select('*')
      .eq('class_id', classId)
      .eq('subject_id', subjectId)
      .eq('term_id', termId)
      .order('test_date', { ascending: false })
    if (error) throw error
    return data as ClassTest[]
  },

  async createTest(test: Omit<ClassTest, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('class_tests')
      .insert(test)
      .select()
      .single()
    if (error) throw error
    return data as ClassTest
  },

  async updateTest(id: string, updates: Partial<ClassTest>) {
    const { data, error } = await supabase
      .from('class_tests')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as ClassTest
  },

  async deleteTest(id: string) {
    const { error } = await supabase
      .from('class_tests')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  async getTestScores(testId: string) {
    const { data, error } = await supabase
      .from('class_test_scores')
      .select('*')
      .eq('test_id', testId)
    if (error) throw error
    return data as ClassTestScore[]
  },

  async saveScores(testId: string, scores: { student_id: string; score_attained: number }[]) {
    const { error } = await supabase
      .from('class_test_scores')
      .upsert(
        scores.map(s => ({ test_id: testId, student_id: s.student_id, score_attained: s.score_attained })),
        { onConflict: 'test_id,student_id' }
      )
    if (error) throw error
  },

  /**
   * "Add and Strike" Logic:
   * Aggregates all class tests for a student/subject/term and updates the main 'scores' table 'class_score' field.
   */
  async syncToReport(classId: string, subjectId: string, termId: string, classWeight: number = 50) {
    // 1. Get all tests for this context
    const tests = await this.getTests(classId, subjectId, termId)
    if (tests.length === 0) return

    const testIds = tests.map(t => t.id)
    const totalMax = tests.reduce((sum, t) => sum + (Number(t.max_score) || 0), 0)

    if (totalMax === 0) return

    // 2. Get all scores for these tests
    const { data: allScores, error: scoreError } = await supabase
      .from('class_test_scores')
      .select('student_id, score_attained')
      .in('test_id', testIds)
    
    if (scoreError) throw scoreError

    // 3. Aggregate scores per student
    const studentAggregates: Record<string, number> = {}
    allScores?.forEach(s => {
      studentAggregates[s.student_id] = (studentAggregates[s.student_id] || 0) + (Number(s.score_attained) || 0)
    })

    // 4. Update the main 'scores' table
    // We need academic_year_id and school_id for the upsert if record doesn't exist?
    // Actually, normally 'scores' records are created during the final stage, but we can update existing ones.
    const updates = await Promise.all(Object.entries(studentAggregates).map(async ([studentId, totalAttained]) => {
      const struckScore = (totalAttained / totalMax) * classWeight
      
      // Update existing score record
      return {
        student_id: studentId,
        subject_id: subjectId,
        class_id: classId,
        term_id: termId,
        class_score: Number(struckScore.toFixed(2)),
      }
    }))

    // We use upsert with onConflict on student_id,subject_id,term_id
    // But we need school_id and academic_year_id if we want to create new records.
    // For now, let's assume we're updating.
    // If the record doesn't exist, we might need more info.
    // Let's grab the metadata from the first test.
    const fullUpserts = updates.map(u => ({
      ...u,
      academic_year_id,
      teacher_id,
      // exam_score defaults to 0 or null if we don't have it
    }))

    const { error: upsertError } = await supabase
      .from('scores')
      .upsert(fullUpserts, { onConflict: 'student_id,subject_id,term_id' })

    if (upsertError) throw upsertError
  }
}
