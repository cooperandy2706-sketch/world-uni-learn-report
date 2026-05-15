// src/types/database.types.ts
export type Role = 'super_admin' | 'admin' | 'proprietor' | 'teacher' | 'student' | 'bursar' | 'staff' | 'security' | 'parent' | 'driver' | 'nurse' | 'librarian'
export type PaymentMethod = 'cash' | 'momo' | 'bank' | 'cheque'

export interface FeeStructure {
  id: string
  school_id: string
  class_id: string
  term_id: string
  academic_year_id: string
  fee_name: string
  amount: number
  currency_code?: string
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
  currency_code?: string
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
  currency_code?: string
  created_at: string
  // Storage allocation
  storage_limit_gb: number     // Quota in GB (default: 5)
  storage_used_bytes: number   // Real-time total footprint in bytes
}

export interface SchoolSettings {
  id: string
  school_id: string
  next_term_date?: string
  school_fees_info?: string
  school_news?: string
  academic_year_id?: string
  current_term_id?: string
  // Branding & Theme
  primary_color?: string
  report_theme?: 'modern' | 'classic' | 'professional'
  report_watermark_url?: string
  // Security / Scanner
  late_arrival_time?: string
  scan_cooldown_seconds?: number
  created_at: string
  updated_at: string
}

export interface SchoolInvoice {
  id: string
  school_id: string
  term_id?: string
  amount: number
  status: 'pending' | 'requested_approval' | 'paid'
  due_date: string
  created_at: string
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
  school_id: string
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

export interface LeaveRequest {
  id: string
  user_id: string
  school_id: string
  leave_type: 'sick' | 'personal' | 'vacation' | 'maternity' | 'paternity' | 'other'
  start_date: string
  end_date: string
  reason?: string
  status: 'pending' | 'approved' | 'rejected'
  approved_by?: string
  admin_notes?: string
  substitute_id?: string
  created_at: string
  updated_at: string
  // joined
  user?: User
  substitute?: User
  approved_by_user?: User
}

export interface TransportRoute {
  id: string
  school_id: string
  name: string
  description?: string
  fee_amount: number
  created_at: string
}

export interface TransportVehicle {
  id: string
  school_id: string
  plate_number: string
  capacity: number
  make_model?: string
  driver_id?: string
  created_at: string
  // joined
  driver?: User
}

export interface TransportBoardingLog {
  id: string
  school_id: string
  student_id: string
  vehicle_id: string
  direction: 'pickup' | 'dropoff'
  location_name?: string
  time_scanned: string
  created_at: string
  // joined
  student?: Student
  vehicle?: TransportVehicle
}

export interface TransportLiveLocation {
  id: string
  school_id: string
  vehicle_id: string
  driver_id: string
  latitude: number
  longitude: number
  speed?: number
  heading?: number
  is_active: boolean
  last_updated: string
  created_at: string
}

export interface MedicalRecord {
  id: string
  student_id: string
  school_id: string
  blood_type?: string
  allergies?: string
  chronic_conditions?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  notes?: string
  created_at: string
  updated_at: string
  // joined
  student?: Student
}

export interface ClinicVisit {
  id: string
  school_id: string
  student_id: string
  nurse_id: string
  visit_date: string
  symptoms: string
  treatment?: string
  medication_given?: string
  time_in: string
  time_out?: string
  parent_notified: boolean
  notes?: string
  created_at: string
  // joined
  student?: Student
  nurse?: User
}

export interface LibraryBook {
  id: string
  school_id: string
  title: string
  author?: string
  isbn?: string
  barcode: string
  dewey_decimal?: string
  category?: string
  copies_total: number
  copies_available: number
  location?: string
  created_at: string
}

export interface LibraryCheckout {
  id: string
  school_id: string
  book_id: string
  student_id?: string
  teacher_id?: string
  checkout_date: string
  due_date: string
  return_date?: string
  fine_amount: number
  fine_paid: boolean
  status: 'active' | 'returned' | 'lost'
  created_at: string
  // joined
  book?: LibraryBook
  student?: Student
  teacher?: User
}

export interface Dormitory {
  id: string
  school_id: string
  name: string
  capacity: number
  gender_restriction?: 'male' | 'female' | 'mixed'
  house_parent_id?: string
  created_at: string
  updated_at: string
  // joined
  house_parent?: User
}

export interface DormRoom {
  id: string
  dormitory_id: string
  room_number: string
  capacity: number
  created_at: string
}

export interface DormAssignment {
  id: string
  school_id: string
  student_id: string
  room_id: string
  start_date: string
  end_date?: string
  created_at: string
  // joined
  student?: Student
  room?: DormRoom
}

export interface DormLog {
  id: string
  dormitory_id: string
  recorded_by: string
  date: string
  incident_type: 'routine' | 'behavioral' | 'maintenance' | 'medical' | 'other'
  notes: string
  created_at: string
  // joined
  recorder?: User
}

export interface ExeatRequest {
  id: string
  school_id: string
  student_id: string
  requested_by?: string
  reason: string
  destination: string
  departure_time: string
  expected_return_time: string
  actual_return_time?: string
  status: 'pending' | 'approved' | 'rejected' | 'departed' | 'returned'
  approved_by?: string
  parent_notified: boolean
  security_notified: boolean
  notes?: string
  created_at: string
  updated_at: string
  // joined
  student?: Student
  requester?: User
  approver?: User
}

export interface PastoralLog {
  id: string
  school_id: string
  student_id: string
  counselor_id: string
  date: string
  category: 'academic' | 'behavioral' | 'emotional' | 'family' | 'peer' | 'other'
  notes: string
  follow_up_date?: string
  is_private: boolean
  created_at: string
  // joined
  student?: Student
  counselor?: User
}

export interface AuditLog {
  id: string
  school_id: string
  user_id?: string
  table_name: string
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  record_id: string
  old_data?: any
  new_data?: any
  created_at: string
  // joined
  user?: User
}

export interface PrivacyConsent {
  id: string
  school_id: string
  user_id: string
  data_processing_consent: boolean
  marketing_consent: boolean
  photo_media_consent: boolean
  deletion_requested: boolean
  deletion_requested_at?: string
  created_at: string
  updated_at: string
}