// src/types/report.types.ts
import type { ReportCard, Student, Attendance, School, Term, AcademicYear, Class } from './database.types'

export interface ReportCardData {
  report: ReportCard
  student: Student
  scores: ScoreRow[]
  attendance: Attendance | null
  school: School
  term: Term
  academicYear: AcademicYear
  class: Class
  totalStudents: number
}

export interface ScoreRow {
  subject: string
  subjectCode?: string
  classScore: number
  examScore: number
  total: number
  grade: string
  position: number
  totalStudentsInSubject: number
  remarks?: string
}

export interface GradeInfo {
  grade: string
  label: string
  min: number
  max: number
  color: string
}

export interface ClassPerformanceSummary {
  classId: string
  className: string
  termId: string
  totalStudents: number
  averageScore: number
  highestScore: number
  lowestScore: number
  passRate: number
  gradeDistribution: Record<string, number>
}