// src/types/database.types.ts
export type Role = 'super_admin' | 'admin' | 'teacher' | 'student'
export type Gender = 'male' | 'female'
export type TermName = 'Term 1' | 'Term 2' | 'Term 3'
export type RemarkType = 'teacher' | 'headteacher'

export interface School {
  id: string
  name: string
  motto?: string
  address?: string
  phone?: string
  email?: string
  logo_url?: string
  headteacher_name?: string
  headteacher_signature_url?: string
  created_at: string
}

export interface SchoolSettings {
  id: string
  school_id: string
  next_term_date?: string
  school_fees_info?: string
  school_news?: string
  academic_year_id?: string
  current_term_id?: string
  created_at: string
  updated_at: string
}

export interface AcademicYear {
  id: string
  school_id: string
  name: string
  start_date?: string
  end_date?: string
  is_current: boolean
  created_at: string
}

export interface Term {
  id: string
  academic_year_id: string
  school_id: string
  name: TermName | string
  start_date?: string
  end_date?: string
  is_current: boolean
  is_locked: boolean
  created_at: string
}

export interface Department {
  id: string
  school_id: string
  name: string
  created_at: string
}

export interface Class {
  id: string
  school_id: string
  department_id?: string
  name: string
  level?: string
  capacity?: number
  created_at: string
}

export interface Subject {
  id: string
  school_id: string
  department_id?: string
  name: string
  code?: string
  created_at: string
}

export interface User {
  id: string
  school_id: string
  full_name: string
  email: string
  role: Role
  phone?: string
  avatar_url?: string
  is_active: boolean
  created_at: string
  school?: School
}

export interface Teacher {
  id: string
  user_id: string
  school_id: string
  staff_id?: string
  department_id?: string
  qualification?: string
  created_at: string
  // joined
  user?: User
  department?: Department
}

export interface TeacherAssignment {
  id: string
  teacher_id: string
  class_id: string
  subject_id: string
  term_id: string
  academic_year_id: string
  is_class_teacher: boolean
  created_at: string
  // joined
  teacher?: Teacher
  class?: Class
  subject?: Subject
  term?: Term
}

export interface Student {
  id: string
  school_id: string
  class_id?: string
  student_id?: string
  full_name: string
  date_of_birth?: string
  gender?: Gender
  house?: string
  guardian_name?: string
  guardian_phone?: string
  guardian_email?: string
  address?: string
  photo_url?: string
  is_active: boolean
  user_id?: string
  created_at: string
  // joined
  class?: Class
}

export interface Attendance {
  id: string
  student_id: string
  term_id: string
  total_days: number
  days_present: number
  days_absent: number
  created_at: string
  updated_at: string
}

export interface Score {
  id: string
  student_id: string
  subject_id: string
  class_id: string
  term_id: string
  academic_year_id: string
  teacher_id?: string
  class_score: number
  exam_score: number
  total_score: number
  grade?: string
  position?: number
  teacher_remarks?: string
  is_submitted: boolean
  created_at: string
  updated_at: string
  // joined
  student?: Student
  subject?: Subject
  teacher?: Teacher
}

export interface ReportCard {
  id: string
  student_id: string
  class_id: string
  term_id: string
  academic_year_id: string
  total_marks?: number
  average_score?: number
  overall_position?: number
  total_students?: number
  class_teacher_remarks?: string
  headteacher_remarks?: string
  is_approved: boolean
  approved_by?: string
  approved_at?: string
  generated_at: string
  updated_at: string
  // joined
  student?: Student
  class?: Class
  term?: Term
  scores?: Score[]
  attendance?: Attendance
}

export interface Remark {
  id: string
  school_id?: string
  type: RemarkType
  text: string
  created_at: string
}