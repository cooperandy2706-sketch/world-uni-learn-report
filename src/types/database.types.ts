// src/types/database.types.ts
export type Role = 'super_admin' | 'admin' | 'teacher' | 'student' | 'bursar' | 'staff'
export type PaymentMethod = 'cash' | 'momo' | 'bank' | 'cheque'

export interface FeeStructure {
  id: string
  school_id: string
  class_id: string
  term_id: string
  academic_year_id: string
  fee_name: string
  amount: number
  description?: string
  created_at: string
  // joined
  class?: { id: string; name: string }
  term?: { id: string; name: string }
}

export interface FeePayment {
  id: string
  school_id: string
  student_id: string
  fee_structure_id?: string
  term_id: string
  academic_year_id: string
  amount_paid: number
  payment_date: string
  payment_method: PaymentMethod
  reference_number?: string
  notes?: string
  recorded_by?: string
  created_at: string
  // joined
  student?: { id: string; full_name: string; student_id?: string; class?: { name: string } }
  fee_structure?: FeeStructure
}

export interface StaffPayroll {
  id: string
  school_id: string
  user_id: string
  month: string
  basic_salary: number
  allowances: number
  deductions: number
  net_salary: number
  is_paid: boolean
  paid_date?: string
  notes?: string
  created_at: string
  // joined
  user?: { id: string; full_name: string; email: string; role: Role }
}

export interface IncomeRecord {
  id: string
  school_id: string
  category: string
  description?: string
  amount: number
  date: string
  reference?: string
  recorded_by?: string
  created_at: string
}

export interface ExpenseRecord {
  id: string
  school_id: string
  category: string
  description: string
  amount: number
  date: string
  vendor?: string
  approved_by?: string
  recorded_by?: string
  created_at: string
}
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
  designation?: string
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
  scholarship_type?: 'none' | 'full' | 'partial'
  scholarship_percentage?: number
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

export interface ClassTest {
  id: string
  school_id: string
  class_id: string
  subject_id: string
  term_id: string
  academic_year_id: string
  teacher_id: string
  title: string
  max_score: number
  test_date: string
  created_at: string
}

export interface ClassTestScore {
  id: string
  test_id: string
  student_id: string
  score_attained: number
  created_at: string
}

export interface Election {
  id: string
  school_id: string
  title: string
  academic_year_id?: string
  nomination_open: boolean
  voting_open: boolean
  is_archived: boolean
  created_by?: string
  created_at: string
}

export interface ElectionPosition {
  id: string
  election_id: string
  school_id: string
  title: string
  max_winners: number
  created_at: string
}

export interface ElectionCandidate {
  id: string
  election_id: string
  position_id: string
  student_id?: string
  teacher_id?: string
  school_id: string
  manifesto?: string
  photo_url?: string
  status: 'pending' | 'approved' | 'rejected'
  vet_score?: number
  vet_notes?: string
  vetted_by?: string
  vetted_at?: string
  created_at: string
  // joined
  student?: Student
  teacher?: User
  position?: ElectionPosition
  vetted_by_user?: User
}

export interface ElectionVote {
  id: string
  election_id: string
  position_id: string
  candidate_id: string
  voter_student_id?: string
  voter_teacher_id?: string
  school_id: string
  created_at: string
}