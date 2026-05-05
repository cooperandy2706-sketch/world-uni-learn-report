// src/services/reports.service.ts
import { supabase } from '../lib/supabase'

export const reportsService = {
  async generateForClass(classId: string, termId: string, academicYearId: string) {
    // Fetch all students in the class
    const { data: students } = await supabase
      .from('students')
      .select('id, school_id')
      .eq('class_id', classId)
      .eq('is_active', true)

    if (!students?.length) return { data: null, error: 'No students found' }

    // Fetch all scores for the class/term to calculate subject positions
    const { data: allScores } = await supabase
      .from('scores')
      .select('*')
      .eq('class_id', classId)
      .eq('term_id', termId)

    if (allScores && allScores.length > 0) {
      // Group by subject
      const subjectGroups: Record<string, any[]> = {}
      allScores.forEach(s => {
        if (!subjectGroups[s.subject_id]) subjectGroups[s.subject_id] = []
        subjectGroups[s.subject_id].push(s)
      })

      // Calculate positions for each subject using Competition Ranking (handles ties)
      const scoreUpdates: any[] = []
      Object.keys(subjectGroups).forEach(subId => {
        const sorted = [...subjectGroups[subId]].sort((a, b) => (b.total_score ?? 0) - (a.total_score ?? 0))
        
        let currentRank = 0
        let lastScore = null
        
        sorted.forEach((s, index) => {
          const score = s.total_score ?? 0
          if (score !== lastScore) {
            currentRank = index + 1
            lastScore = score
          }
          scoreUpdates.push({
            id: s.id,
            position: currentRank
          })
        })
      })

      // Batch update scores with positions
      if (scoreUpdates.length > 0) {
        await supabase.from('scores').upsert(scoreUpdates, { onConflict: 'id' })
      }
    }

    // Refresh scores after position update
    const { data: scores } = await supabase
      .from('scores')
      .select('*')
      .eq('class_id', classId)
      .eq('term_id', termId)

    // Calculate report for each student
    const reports = students.map((student) => {
      const studentScores = scores?.filter((s) => s.student_id === student.id) ?? []
      const totalMarks = studentScores.reduce((sum, s) => sum + (s.total_score ?? 0), 0)
      const averageScore = studentScores.length
        ? Number((totalMarks / studentScores.length).toFixed(2))
        : 0

      return {
        student_id: student.id,
        school_id: student.school_id,
        class_id: classId,
        term_id: termId,
        academic_year_id: academicYearId,
        total_marks: totalMarks,
        average_score: averageScore,
        total_students: students.length,
      }
    })

    // Sort by average and calculate overall positions using Competition Ranking
    const sorted = [...reports].sort((a, b) => (b.average_score ?? 0) - (a.average_score ?? 0))
    
    let currentOverallRank = 0
    let lastAvg = null
    
    const withPositions = sorted.map((r, i) => {
      const avg = r.average_score ?? 0
      if (avg !== lastAvg) {
        currentOverallRank = i + 1
        lastAvg = avg
      }
      return { ...r, overall_position: currentOverallRank }
    })

    // Upsert all reports
    return supabase
      .from('report_cards')
      .upsert(withPositions, { onConflict: 'student_id,term_id' })
      .select()
  },

  async getByClassAndTerm(classId: string, termId: string) {
    return supabase
      .from('report_cards')
      .select('*, student:students(*, class:classes(id, name, department_id))')
      .eq('class_id', classId)
      .eq('term_id', termId)
      .order('overall_position')
  },

  async getStudentReport(studentId: string, termId: string) {
    return supabase
      .from('report_cards')
      .select('*, student:students(*), class:classes(*), term:terms(*)')
      .eq('student_id', studentId)
      .eq('term_id', termId)
      .single()
  },

  async updateRemarks(
    reportId: string,
    remarks: { class_teacher_remarks?: string; headteacher_remarks?: string }
  ) {
    return supabase
      .from('report_cards')
      .update({ ...remarks, updated_at: new Date().toISOString() })
      .eq('id', reportId)
      .select()
      .single()
  },

  async approve(reportId: string, approvedBy: string) {
    return supabase
      .from('report_cards')
      .update({
        is_approved: true,
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
      })
      .eq('id', reportId)
      .select()
      .single()
  },
}