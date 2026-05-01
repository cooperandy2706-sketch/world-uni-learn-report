import { ROUTES } from './routes'
import {
  LayoutDashboard, Users, UserCheck, School, BookOpen, Building2,
  Calendar, FileSpreadsheet, BarChart3, Settings, Megaphone,
  Target, ClipboardCheck, PencilLine, Bell, Timer, ClipboardList,
  MessageSquare, Trophy, ShieldCheck, LogOut, Book,
  ChevronLeft, ChevronRight, Wallet, Banknote, Receipt, TrendingDown,
  TrendingUp, AlertCircle, CreditCard, FileText, ShoppingBag, ChevronDown,
  Package, ShoppingCart, RefreshCcw, Gamepad2, Library, GraduationCap,
  Smartphone, Calculator, Grid, Vote, Image, UserPlus, Heart, Search, ArrowUpRight,
  Plus, Monitor, Truck, Armchair, Box
} from 'lucide-react'

export const adminLinks = [
  { header: 'General' },
  { to: ROUTES.ADMIN_DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/tasks', label: 'Admin Tasks', icon: ClipboardCheck },
  { to: ROUTES.ADMIN_CALENDAR, label: 'School Calendar', icon: Calendar },
  { to: ROUTES.ADMIN_MESSAGES, label: 'Messages', icon: MessageSquare },

  { header: 'Academics' },
  { to: ROUTES.ADMIN_CLASSES, label: 'Classes', icon: School },
  { to: ROUTES.ADMIN_SUBJECTS, label: 'Subjects', icon: BookOpen },
  { to: ROUTES.ADMIN_ATTENDANCE, label: 'Attendance', icon: ClipboardCheck },
  { to: ROUTES.ADMIN_TIMETABLE, label: 'Timetable', icon: Timer },
  { to: ROUTES.ADMIN_SYLLABUS, label: 'Syllabus', icon: Book },
  { to: ROUTES.ADMIN_WEEKLY_GOALS, label: 'Weekly Goals', icon: Target },
  { to: ROUTES.ADMIN_REPORTS, label: 'Report Cards', icon: FileSpreadsheet },
  { to: '/admin/batch-promotion', label: 'Batch Promotion', icon: ArrowUpRight },
  { to: '/admin/bece-processor', label: 'BECE CA Processor', icon: Calculator },

  { header: 'People' },
  { to: ROUTES.ADMIN_STUDENTS, label: 'Student Directory', icon: Users },
  { to: '/admin/student-vault', label: 'Student Vault', icon: ShieldCheck },
  { to: ROUTES.ADMIN_TEACHERS, label: 'Staff Directory', icon: UserCheck },
  { to: '/admin/admissions', label: 'Admissions', icon: GraduationCap },
  { to: ROUTES.ADMIN_SMS, label: 'SMS Messaging', icon: Smartphone },

  { header: 'HR & Operations' },
  { to: '/admin/staff-requests', label: 'Staff Requests', icon: MessageSquare },
  { to: '/admin/assets', label: 'Asset Register', icon: Package },
  { to: '/admin/billing', label: 'Billing & Subscription', icon: CreditCard },
  { to: '/admin/bursars', label: 'Bursar Staff', icon: Wallet },
  { to: '/admin/poster-maker', label: 'Poster Maker', icon: Image },
  { to: '/admin/elections', label: 'Elections (PEC)', icon: Vote },
  { to: ROUTES.ADMIN_ALUMNI, label: 'Alumni & Fundraising', icon: Heart },

  { header: 'Insights & Setup' },
  { to: ROUTES.ADMIN_ANALYTICS, label: 'School Analytics', icon: BarChart3 },
  { to: ROUTES.ADMIN_ACADEMIC_YEARS, label: 'Academic Years', icon: Calendar },
  { to: ROUTES.ADMIN_TERMS, label: 'Terms Management', icon: Calendar },
  { to: ROUTES.ADMIN_SETTINGS, label: 'System Settings', icon: Settings },
]

export const teacherLinks = [
  { header: 'General' },
  { to: ROUTES.TEACHER_DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
  { to: '/teacher/self-service', label: 'Self Service', icon: UserCheck },
  { to: ROUTES.TEACHER_MESSAGES, label: 'Messages', icon: MessageSquare },
  { to: ROUTES.TEACHER_NOTIFICATIONS, label: 'Notifications', icon: Bell },

  { header: 'Instructional' },
  { to: ROUTES.TEACHER_MY_CLASSES, label: 'My Classes', icon: School },
  { to: ROUTES.TEACHER_STUDENTS, label: 'Students', icon: Users },
  { to: '/teacher/behavior', label: 'Behavior Log', icon: ShieldCheck },
  { to: '/teacher/class-tests', label: 'Class Tests', icon: ClipboardList },
  { to: ROUTES.TEACHER_SCORE_ENTRY, label: 'Score Entry', icon: PencilLine },
  { to: ROUTES.TEACHER_REPORTS, label: 'Reports', icon: FileSpreadsheet },
  { to: ROUTES.TEACHER_TIMETABLE, label: 'Timetable', icon: Calendar },
  { to: ROUTES.TEACHER_ATTENDANCE, label: 'Attendance', icon: ClipboardCheck },
  { to: ROUTES.TEACHER_SYLLABUS, label: 'Syllabus', icon: Book },
  { to: ROUTES.TEACHER_LESSON_TRACKER, label: 'Lesson Tracker', icon: Timer },
  { to: ROUTES.TEACHER_ASSIGNMENTS, label: 'Assignments', icon: ClipboardList },
  { to: ROUTES.TEACHER_SUBJECTS, label: 'Library', icon: BookOpen },
  { to: '/teacher/daily-fees', label: 'Daily Collections', icon: CreditCard },

  { header: 'Extras' },
  { to: '/teacher/agenda', label: 'Term Agenda', icon: ClipboardList },
  { to: '/teacher/elections-hub', label: 'Elections (PEC)', icon: Vote },
  { to: ROUTES.TEACHER_TYPING_GAME, label: 'Typing Nitro', icon: Gamepad2 },
]

export const superAdminLinks = [
  { to: ROUTES.SUPER_ADMIN_DASHBOARD, label: 'Platform Hub', icon: ShieldCheck },
  { to: ROUTES.SUPER_ADMIN_SCHOOLS, label: 'School Registry', icon: School },
  { to: ROUTES.SUPER_ADMIN_QUIZZES, label: 'Monthly Quizzes', icon: ClipboardList },
  { to: ROUTES.SUPER_ADMIN_MESSAGING, label: 'Global Messaging', icon: MessageSquare },
  { to: ROUTES.SUPER_ADMIN_ANALYTICS, label: 'Leaderboards', icon: Trophy },
  { to: ROUTES.SUPER_ADMIN_SUBJECTS, label: 'Platform Subjects', icon: BookOpen },
  { to: ROUTES.SUPER_ADMIN_RESOURCES, label: 'Learning Materials', icon: Book },
]

export const studentLinks = [
  { header: 'General' },
  { to: ROUTES.STUDENT_DASHBOARD, label: 'My Portal', icon: LayoutDashboard },
  { to: ROUTES.STUDENT_PROFILE, label: 'My Profile', icon: UserCheck },
  { to: ROUTES.STUDENT_ANNOUNCEMENTS, label: 'Notice Board', icon: Megaphone },
  { to: ROUTES.STUDENT_CALENDAR, label: 'School Calendar', icon: Calendar },

  { header: 'Academic Hub' },
  { to: ROUTES.STUDENT_RESULTS, label: 'Academic Results', icon: BarChart3 },
  { to: ROUTES.STUDENT_ASSIGNMENTS, label: 'Assignments & Quizzes', icon: ClipboardList },
  { to: ROUTES.STUDENT_ATTENDANCE, label: 'Attendance History', icon: UserCheck },
  { to: ROUTES.STUDENT_SCHEDULE, label: 'My Timetable', icon: Timer },

  { header: 'Resources & Billing' },
  { to: ROUTES.STUDENT_RESOURCES, label: 'Resources Hub', icon: BookOpen },
  { to: ROUTES.STUDENT_LIBRARY, label: 'Global Library', icon: Library },
  { to: ROUTES.STUDENT_BILLING, label: 'Fees & Billing', icon: Wallet },
  { to: ROUTES.STUDENT_ELECTIONS, label: 'PEC Elections', icon: Vote },
  { to: ROUTES.STUDENT_TYPING_GAME, label: 'Typing Nitro', icon: Gamepad2 },
]

export const bursarLinks = [
  { header: 'Overview' },
  { to: ROUTES.BURSAR_DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
  { to: ROUTES.BURSAR_ANALYTICS, label: 'Analytics', icon: BarChart3 },

  { header: 'Operations' },
  { to: ROUTES.BURSAR_STUDENTS, label: 'Students', icon: Users },
  { to: ROUTES.BURSAR_FEES, label: 'School Fees', icon: CreditCard },
  { to: '/bursar/daily-fees', label: 'Daily Fees', icon: Wallet },
  { to: ROUTES.BURSAR_INVENTORY, label: 'School Store', icon: ShoppingBag },

  { header: 'Financials' },
  { to: ROUTES.BURSAR_DEBTORS, label: 'Debtors List', icon: AlertCircle },
  { to: ROUTES.BURSAR_BILL_SHEET, label: 'Bill Sheet', icon: FileText },
  { to: ROUTES.BURSAR_PAYROLL, label: 'Payroll', icon: Wallet },
  { to: ROUTES.BURSAR_INCOME, label: 'Income', icon: TrendingUp },
  { to: ROUTES.BURSAR_EXPENSES, label: 'Expenses', icon: TrendingDown },
  { to: ROUTES.BURSAR_REPORTS, label: 'Financial Reports', icon: FileSpreadsheet },

  { header: 'Tools' },
  { to: ROUTES.BURSAR_SMS, label: 'SMS Reminders', icon: Smartphone },
]

export const staffLinks = [
  { to: '/staff/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/staff/elections', label: 'Elections (PEC)', icon: Vote },
]
