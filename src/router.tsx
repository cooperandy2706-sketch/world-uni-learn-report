// src/router.tsx
import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'

// Only eagerly import layout shells and the landing page (critical path)
import AppLayout from './components/layout/AppLayout'
import AuthLayout from './components/layout/AuthLayout'
import LandingPage from './pages/LandingPage'
import FlaskLoader from './components/ui/FlaskLoader'
import { RouteErrorPage, NotFoundPage } from './pages/ErrorPages'

// ── Lazy wrapper: wraps every lazy import in a Suspense with a minimal spinner ──
function lazyPage(importFn: () => Promise<{ default: React.ComponentType }>) {
  const LazyComponent = lazy(importFn)
  return (
    <Suspense fallback={<FlaskLoader fullScreen={false} />}>
      <LazyComponent />
    </Suspense>
  )
}

export const router = createBrowserRouter([
  {
    path: '/',
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <LandingPage /> },

      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: lazyPage(() => import('./pages/auth/AuthPage')) },
          { path: '/register-school', element: lazyPage(() => import('./pages/auth/SchoolRegistrationPage')) },
          { path: 'forgot-password', element: lazyPage(() => import('./pages/auth/ForgotPasswordPage')) },
        ],
      },
      {
        path: 'admin',
        element: <AppLayout requiredRole="admin" />,
        children: [
          { index: true, element: <Navigate to="/admin/dashboard" replace /> },
          { path: 'dashboard', element: lazyPage(() => import('./pages/admin/DashboardPage')) },
          { path: 'billing', element: lazyPage(() => import('./pages/admin/BillingPage')) },
          { path: 'students', element: lazyPage(() => import('./pages/admin/StudentsPage')) },
          { path: 'parents', element: lazyPage(() => import('./pages/admin/ParentsPage')) },
          { path: 'teachers', element: lazyPage(() => import('./pages/admin/TeachersPage')) },
          { path: 'other-staff', element: lazyPage(() => import('./pages/admin/OtherStaffPage')) },
          { path: 'classes', element: lazyPage(() => import('./pages/admin/ClassesPage')) },
          { path: 'subjects', element: lazyPage(() => import('./pages/admin/SubjectsPage')) },
          { path: 'departments', element: lazyPage(() => import('./pages/admin/DepartmentsPage')) },
          { path: 'academic-years', element: lazyPage(() => import('./pages/admin/AcademicYearsPage')) },
          { path: 'terms', element: lazyPage(() => import('./pages/admin/TermsPage')) },
          { path: 'reports', element: lazyPage(() => import('./pages/admin/ReportsPage')) },
          { path: 'analytics', element: lazyPage(() => import('./pages/admin/AnalyticsPage')) },
          { path: 'performance', element: lazyPage(() => import('./pages/admin/PerformanceTrackingPage')) },
          { path: 'settings', element: lazyPage(() => import('./pages/admin/SettingsPage')) },
          { path: 'timetable', element: lazyPage(() => import('./pages/admin/TimetablePage')) },
          { path: 'announcements', element: lazyPage(() => import('./pages/admin/AnnouncementsPage')) },
          { path: 'syllabus', element: lazyPage(() => import('./pages/admin/SyllabusPage')) },
          { path: 'lesson-plans', element: lazyPage(() => import('./pages/admin/LessonPlansPage')) },
          { path: 'weekly-goals', element: lazyPage(() => import('./pages/admin/WeeklyGoalsPage')) },
          { path: 'attendance', element: lazyPage(() => import('./pages/admin/AttendancePage')) },
          { path: 'bursars', element: lazyPage(() => import('./pages/admin/BursarStaffPage')) },
          { path: 'messages', element: lazyPage(() => import('./pages/messaging/MessagingPage')) },
          { path: 'agenda', element: lazyPage(() => import('./pages/admin/AgendaPage')) },
          { path: 'score-entry', element: lazyPage(() => import('./pages/teacher/ScoreEntryPage')) },
          { path: 'admissions', element: lazyPage(() => import('./pages/admin/AdminAdmissions')) },
          { path: 'sms', element: lazyPage(() => import('./pages/shared/SMSPage')) },
          { path: 'test-analytics', element: lazyPage(() => import('./pages/admin/AdminTestAnalytics')) },
          { path: 'assessments', element: lazyPage(() => import('./pages/admin/AssessmentsPage')) },
          { path: 'bece-processor', element: lazyPage(() => import('./pages/admin/BECEProcessorPage')) },
          { path: 'bece-master', element: lazyPage(() => import('./pages/admin/BECEMasterPage')) },
          { path: 'elections', element: lazyPage(() => import('./pages/admin/ElectionsPage')) },
          { path: 'poster-maker', element: lazyPage(() => import('./pages/admin/PosterMakerPage')) },
          { path: 'visitors', element: lazyPage(() => import('./pages/admin/VisitorsPage')) },
          { path: 'alumni', element: lazyPage(() => import('./pages/admin/AlumniPage')) },
          { path: 'promotion', element: lazyPage(() => import('./pages/admin/PromotionPage')) },
          { path: 'calendar', element: lazyPage(() => import('./pages/admin/CalendarPage')) },
          { path: 'staff-requests', element: lazyPage(() => import('./pages/admin/StaffRequestsPage')) },
          { path: 'tasks', element: lazyPage(() => import('./pages/admin/AdminTasksPage')) },
          { path: 'assets', element: lazyPage(() => import('./pages/admin/AssetManagerPage')) },
          { path: 'student-vault', element: lazyPage(() => import('./pages/admin/StudentVaultPage')) },
          { path: 'batch-promotion', element: lazyPage(() => import('./pages/admin/BatchPromotionPage')) },
          { path: 'fees', element: lazyPage(() => import('./pages/bursar/FeesPage')) },
        ],
      },
      {
        path: 'bursar',
        element: <AppLayout requiredRole="bursar" />,
        children: [
          { index: true, element: <Navigate to="/bursar/dashboard" replace /> },
          { path: 'dashboard', element: lazyPage(() => import('./pages/bursar/DashboardPage')) },
          { path: 'fees', element: lazyPage(() => import('./pages/bursar/FeesPage')) },
          { path: 'daily-fees', element: lazyPage(() => import('./pages/bursar/DailyFeesPage')) },
          { path: 'debtors', element: lazyPage(() => import('./pages/bursar/DebtorsPage')) },
          { path: 'payroll', element: lazyPage(() => import('./pages/bursar/PayrollPage')) },
          { path: 'income', element: lazyPage(() => import('./pages/bursar/IncomePage')) },
          { path: 'expenses', element: lazyPage(() => import('./pages/bursar/ExpensesPage')) },
          { path: 'analytics', element: lazyPage(() => import('./pages/bursar/AnalyticsPage')) },
          { path: 'bill-sheet', element: lazyPage(() => import('./pages/bursar/BillSheetPage')) },
          { path: 'reports', element: lazyPage(() => import('./pages/bursar/ReportsPage')) },
          { path: 'inventory', element: lazyPage(() => import('./pages/bursar/InventoryPage')) },
          { path: 'students', element: lazyPage(() => import('./pages/bursar/StudentsPage')) },
          { path: 'staff-requests', element: lazyPage(() => import('./pages/admin/StaffRequestsPage')) },
          { path: 'sms', element: lazyPage(() => import('./pages/shared/SMSPage')) },
          { path: 'account', element: lazyPage(() => import('./pages/shared/ManageAccountPage')) },
        ],
      },
      {
        path: 'teacher',
        element: <AppLayout requiredRole="teacher" />,
        children: [
          { index: true, element: <Navigate to="/teacher/dashboard" replace /> },
          { path: 'dashboard', element: lazyPage(() => import('./pages/teacher/DashboardPage')) },
          { path: 'my-classes', element: lazyPage(() => import('./pages/teacher/MyClassesPage')) },
          { path: 'score-entry', element: lazyPage(() => import('./pages/teacher/ScoreEntryPage')) },
          { path: 'reports', element: lazyPage(() => import('./pages/teacher/ReportsPage')) },
          { path: 'timetable', element: lazyPage(() => import('./pages/teacher/TimetablePage')) },
          { path: 'notifications', element: lazyPage(() => import('./pages/teacher/NotificationsPage')) },
          { path: 'syllabus', element: lazyPage(() => import('./pages/teacher/SyllabusPage')) },
          { path: 'lesson-tracker', element: lazyPage(() => import('./pages/teacher/LessonTrackerPage')) },
          { path: 'students', element: lazyPage(() => import('./pages/teacher/TeacherStudentsPage')) },
          { path: 'assignments', element: lazyPage(() => import('./pages/teacher/AssignmentsPage')) },
          { path: 'assignments/:id', element: lazyPage(() => import('./pages/teacher/TeacherAssignmentDetailsPage')) },
          { path: 'global-quizzes/:id', element: lazyPage(() => import('./pages/teacher/TeacherGlobalQuizDetailsPage')) },
          { path: 'global-quizzes/:id/take', element: lazyPage(() => import('./pages/teacher/TeacherTakeGlobalQuizPage')) },
          { path: 'attendance', element: lazyPage(() => import('./pages/teacher/AttendancePage')) },
          { path: 'daily-fees', element: lazyPage(() => import('./pages/teacher/TeacherDailyFeesPage')) },
          { path: 'subjects', element: lazyPage(() => import('./pages/teacher/TeacherSubjectsPage')) },
          { path: 'subjects/:id', element: lazyPage(() => import('./pages/teacher/TeacherSubjectDetailsPage')) },
          { path: 'messages', element: lazyPage(() => import('./pages/messaging/MessagingPage')) },
          { path: 'agenda', element: lazyPage(() => import('./pages/teacher/AgendaPage')) },
          { path: 'typing-game', element: lazyPage(() => import('./pages/shared/TypingGamePage')) },
          { path: 'class-tests', element: lazyPage(() => import('./pages/teacher/ClassTestsPage')) },
          { path: 'elections-hub', element: lazyPage(() => import('./pages/teacher/TeacherElectionsHub')) },
          { path: 'self-service', element: lazyPage(() => import('./pages/teacher/TeacherSelfServicePage')) },
          { path: 'behavior', element: lazyPage(() => import('./pages/teacher/BehaviorTrackingPage')) },
          { path: 'account', element: lazyPage(() => import('./pages/shared/ManageAccountPage')) },
        ],
      },

      {
        path: 'super-admin',
        element: <AppLayout requiredRole="super_admin" />,
        children: [
          { index: true, element: <Navigate to="/super-admin/dashboard" replace /> },
          { path: 'dashboard', element: lazyPage(() => import('./pages/admin/SuperAdminDashboard')) },
          { path: 'schools', element: lazyPage(() => import('./pages/admin/SuperAdminDashboard')) },
          { path: 'quizzes', element: lazyPage(() => import('./pages/admin/GlobalQuizzesPage')) },
          { path: 'messaging', element: lazyPage(() => import('./pages/messaging/MessagingPage')) },
          { path: 'analytics', element: lazyPage(() => import('./pages/admin/GlobalAnalyticsPage')) },
          { path: 'resources', element: lazyPage(() => import('./pages/admin/GlobalResourcesPage')) },
          { path: 'subjects', element: lazyPage(() => import('./pages/admin/PlatformSubjectsPage')) },
          { path: 'account', element: lazyPage(() => import('./pages/shared/ManageAccountPage')) },
        ],
      },
      {
        path: 'student',
        element: <AppLayout requiredRole="student" />,
        children: [
          { index: true, element: <Navigate to="/student/dashboard" replace /> },
          { path: 'dashboard', element: lazyPage(() => import('./pages/student/StudentDashboard')) },
          { path: 'results', element: lazyPage(() => import('./pages/student/ResultsPage')) },
          { path: 'assignments', element: lazyPage(() => import('./pages/student/StudentAssignmentsPage')) },
          { path: 'assignments/:id', element: lazyPage(() => import('./pages/student/TakeAssignmentPage')) },
          { path: 'global-quizzes/:id', element: lazyPage(() => import('./pages/student/TakeGlobalQuizPage')) },
          { path: 'schedule', element: lazyPage(() => import('./pages/student/SchedulePage')) },
          { path: 'subjects', element: lazyPage(() => import('./pages/student/StudentSubjectsPage')) },
          { path: 'subjects/:id', element: lazyPage(() => import('./pages/student/StudentSubjectDetailsPage')) },
          { path: 'typing-game', element: lazyPage(() => import('./pages/shared/TypingGamePage')) },
          { path: 'library', element: lazyPage(() => import('./pages/student/StudentLibraryPage')) },
          { path: 'billing', element: lazyPage(() => import('./pages/student/StudentBilling')) },
          { path: 'resources', element: lazyPage(() => import('./pages/student/StudentResources')) },
          { path: 'elections', element: lazyPage(() => import('./pages/student/ElectionsPage')) },
          { path: 'profile', element: lazyPage(() => import('./pages/student/StudentProfilePage')) },
          { path: 'attendance', element: lazyPage(() => import('./pages/student/StudentAttendancePage')) },
          { path: 'announcements', element: lazyPage(() => import('./pages/student/StudentAnnouncementsPage')) },
          { path: 'calendar', element: lazyPage(() => import('./pages/student/StudentCalendarPage')) },
          { path: 'account', element: lazyPage(() => import('./pages/shared/ManageAccountPage')) },
        ],
      },
      {
        path: 'staff',
        element: <AppLayout requiredRole="staff" />,
        children: [
          { index: true, element: <Navigate to="/staff/dashboard" replace /> },
          { path: 'dashboard', element: lazyPage(() => import('./pages/staff/DashboardPage')) },
          { path: 'elections', element: lazyPage(() => import('./pages/staff/ElectionsPage')) },
          { path: 'account', element: lazyPage(() => import('./pages/shared/ManageAccountPage')) },
        ],
      },
      {
        path: 'parent',
        element: <AppLayout requiredRole="parent" />,
        children: [
          { index: true, element: <Navigate to="/parent/dashboard" replace /> },
          { path: 'dashboard', element: lazyPage(() => import('./pages/parent/ParentDashboard')) },
          { path: 'billing', element: lazyPage(() => import('./pages/parent/ParentBillingPage')) },
          { path: 'academics', element: lazyPage(() => import('./pages/parent/ParentAcademicsPage')) },
          { path: 'messages', element: lazyPage(() => import('./pages/parent/ParentMessagingPage')) },
          { path: 'calendar', element: lazyPage(() => import('./pages/parent/ParentCalendarPage')) },
          { path: 'ward/:id', element: lazyPage(() => import('./pages/parent/ParentDashboard')) },
          { path: 'account', element: lazyPage(() => import('./pages/shared/ManageAccountPage')) },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])