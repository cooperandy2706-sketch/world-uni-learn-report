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

    // Fetch all scores for the class/term
    const { data: scores } = await supabase
      .from('scores')
      .select('*')
      .eq('class_id', classId)
      .eq('term_id', termId)

    // Fetch all attendance totals for the term
    const { data: attRows } = await supabase
      .from('attendance')
      .select('student_id, total_days, days_present')
      .eq('term_id', termId)

    // Calculate report for each student
    const reports = students.map((student) => {
      const studentScores = scores?.filter((s) => s.student_id === student.id) ?? []
      const totalMarks = studentScores.reduce((sum, s) => sum + (s.total_score ?? 0), 0)
      const averageScore = studentScores.length
        ? Number((totalMarks / studentScores.length).toFixed(2))
        : 0

      const att = attRows?.find(a => a.student_id === student.id)
      const attendancePercent = att && att.total_days > 0 
        ? Math.round((att.days_present / att.total_days) * 100) 
        : null

      return {
        student_id: student.id,
        school_id: student.school_id,
        class_id: classId,
        term_id: termId,
        academic_year_id: academicYearId,
        total_marks: totalMarks,
        average_score: averageScore,
        total_students: students.length,
        attendance_percent: attendancePercent,
      }
    })

    // Sort by average to get positions
    const sorted = [...reports].sort((a, b) => (b.average_score ?? 0) - (a.average_score ?? 0))
    const withPositions = sorted.map((r, i) => ({ ...r, overall_position: i + 1 }))

    // Upsert all reports
    return supabase
      .from('report_cards')
      .upsert(withPositions, { onConflict: 'student_id,term_id' })
      .select()
  },

  async getByClassAndTerm(classId: string, termId: string) {
    return supabase
      .from('report_cards')
      .select('*, student:students(*, class:classes(id, name))')
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