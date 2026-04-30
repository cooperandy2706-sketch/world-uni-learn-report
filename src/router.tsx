// src/router.tsx
import { createBrowserRouter, Navigate } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import AuthLayout from './components/layout/AuthLayout'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/auth/AuthPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import AdminDashboard from './pages/admin/DashboardPage'
import StudentsPage from './pages/admin/StudentsPage'
import TeachersPage from './pages/admin/TeachersPage'
import ClassesPage from './pages/admin/ClassesPage'
import SubjectsPage from './pages/admin/SubjectsPage'
import DepartmentsPage from './pages/admin/DepartmentsPage'
import AcademicYearsPage from './pages/admin/AcademicYearsPage'
import TermsPage from './pages/admin/TermsPage'
import AdminReportsPage from './pages/admin/ReportsPage'
import AnalyticsPage from './pages/admin/AnalyticsPage'
import PerformanceTrackingPage from './pages/admin/PerformanceTrackingPage'
import SettingsPage from './pages/admin/SettingsPage'
import TimetablePage from './pages/admin/TimetablePage'
import AnnouncementsPage from './pages/admin/AnnouncementsPage'
import SyllabusPage from './pages/admin/SyllabusPage'
import WeeklyGoalsPage from './pages/admin/WeeklyGoalsPage'
import AdminPosterMakerPage from './pages/admin/PosterMakerPage'
import TeacherDashboard from './pages/teacher/DashboardPage'
import MyClassesPage from './pages/teacher/MyClassesPage'
import ScoreEntryPage from './pages/teacher/ScoreEntryPage'
import TeacherReportsPage from './pages/teacher/ReportsPage'
import TeacherTimetablePage from './pages/teacher/TimetablePage'
import TeacherNotificationsPage from './pages/teacher/NotificationsPage'
import TeacherSyllabusPage from './pages/teacher/SyllabusPage'
import LessonTrackerPage from './pages/teacher/LessonTrackerPage'
import TeacherAttendancePage from './pages/teacher/AttendancePage'
import TeacherStudentsPage from './pages/teacher/TeacherStudentsPage'
import TeacherAssignmentsPage from './pages/teacher/AssignmentsPage'
import TeacherAssignmentDetailsPage from './pages/teacher/TeacherAssignmentDetailsPage'
import StudentAssignmentsPage from './pages/student/StudentAssignmentsPage'
import TakeAssignmentPage from './pages/student/TakeAssignmentPage'
import StudentResultsPage from './pages/student/ResultsPage'
import StudentSchedulePage from './pages/student/SchedulePage'
import AdminAttendancePage from './pages/admin/AttendancePage'
import SchoolRegistrationPage from './pages/auth/SchoolRegistrationPage'
import SuperAdminDashboard from './pages/admin/SuperAdminDashboard'
import GlobalQuizzesPage from './pages/admin/GlobalQuizzesPage'
import GlobalResourcesPage from './pages/admin/GlobalResourcesPage'
import StudentDashboard from './pages/student/StudentDashboard'
import TakeGlobalQuizPage from './pages/student/TakeGlobalQuizPage'
import StudentSubjectsPage from './pages/student/StudentSubjectsPage'
import StudentSubjectDetailsPage from './pages/student/StudentSubjectDetailsPage'
import StudentLibraryPage from './pages/student/StudentLibraryPage'
import TeacherSubjectsPage from './pages/teacher/TeacherSubjectsPage'
import TeacherSubjectDetailsPage from './pages/teacher/TeacherSubjectDetailsPage'
import TeacherDailyFeesPage from './pages/teacher/TeacherDailyFeesPage'
import PlatformSubjectsPage from './pages/admin/PlatformSubjectsPage'
import ComingSoonPage from './pages/admin/ComingSoonPage'
import BursarStaffPage from './pages/admin/BursarStaffPage'
import GlobalMessagingPage from './pages/admin/GlobalMessagingPage'
import GlobalAnalyticsPage from './pages/admin/GlobalAnalyticsPage'
import MessagingPage from './pages/messaging/MessagingPage'
import TeacherGlobalQuizDetailsPage from './pages/teacher/TeacherGlobalQuizDetailsPage'
import TeacherTakeGlobalQuizPage from './pages/teacher/TeacherTakeGlobalQuizPage'
import AdminAgendaPage from './pages/admin/AgendaPage'
import TeacherAgendaPage from './pages/teacher/AgendaPage'
import OtherStaffPage from './pages/admin/OtherStaffPage'
import StaffDashboard from './pages/staff/DashboardPage'
import TypingGamePage from './pages/shared/TypingGamePage'
import AdminAdmissions from './pages/admin/AdminAdmissions'
import SMSPage from './pages/shared/SMSPage'
import ClassTestsPage from './pages/teacher/ClassTestsPage'
import AdminTestAnalytics from './pages/admin/AdminTestAnalytics'
import AssessmentsPage from './pages/admin/AssessmentsPage'
import BECEProcessorPage from './pages/admin/BECEProcessorPage'
import BECEMasterPage from './pages/admin/BECEMasterPage'
import TeacherElectionsHubPage from './pages/teacher/TeacherElectionsHub'
import VisitorsPage from './pages/admin/VisitorsPage'

// Election Pages
import AdminElectionsPage from './pages/admin/ElectionsPage'
import StudentElectionsPage from './pages/student/ElectionsPage'
import StaffElectionsPage from './pages/staff/ElectionsPage'

// Bursar pages
import BursarDashboard from './pages/bursar/DashboardPage'
import BursarFeesPage from './pages/bursar/FeesPage'
import BursarDailyFeesPage from './pages/bursar/DailyFeesPage'
import BursarDebtorsPage from './pages/bursar/DebtorsPage'
import BursarPayrollPage from './pages/bursar/PayrollPage'
import BursarIncomePage from './pages/bursar/IncomePage'
import BursarExpensesPage from './pages/bursar/ExpensesPage'
import BursarAnalyticsPage from './pages/bursar/AnalyticsPage'
import BursarBillSheetPage from './pages/bursar/BillSheetPage'
import BursarReportsPage from './pages/bursar/ReportsPage'
import BursarInventoryPage from './pages/bursar/InventoryPage'
import BursarStudentsPage from './pages/bursar/StudentsPage'

import {
  RouteErrorPage,
  NotFoundPage,
  UnauthorizedPage,
  ServerErrorPage,
  OfflinePage,
  LoadingPage,
} from './pages/ErrorPages'

export const router = createBrowserRouter([
  {
    path: '/',
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <LandingPage /> },

      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: <AuthPage /> },
          { path: '/register-school', element: <SchoolRegistrationPage /> },
          { path: 'forgot-password', element: <ForgotPasswordPage /> },
        ],
      },
      {
        path: 'admin',
        element: <AppLayout requiredRole="admin" />,
        children: [
          { index: true, element: <Navigate to="/admin/dashboard" replace /> },
          { path: 'dashboard', element: <AdminDashboard /> },
          { path: 'students', element: <StudentsPage /> },
          { path: 'teachers', element: <TeachersPage /> },
          { path: 'other-staff', element: <OtherStaffPage /> },
          { path: 'classes', element: <ClassesPage /> },
          { path: 'subjects', element: <SubjectsPage /> },
          { path: 'departments', element: <DepartmentsPage /> },
          { path: 'academic-years', element: <AcademicYearsPage /> },
          { path: 'terms', element: <TermsPage /> },
          { path: 'reports', element: <AdminReportsPage /> },
          { path: 'analytics', element: <AnalyticsPage /> },
          { path: 'performance', element: <PerformanceTrackingPage /> },
          { path: 'settings', element: <SettingsPage /> },
          { path: 'timetable', element: <TimetablePage /> },
          { path: 'announcements', element: <AnnouncementsPage /> },
          { path: 'syllabus', element: <SyllabusPage /> },
          { path: 'weekly-goals', element: <WeeklyGoalsPage /> },
          { path: 'attendance', element: <AdminAttendancePage /> },
          { path: 'bursars', element: <BursarStaffPage /> },
          { path: 'messages', element: <MessagingPage /> },
          { path: 'agenda', element: <AdminAgendaPage /> },
          { path: 'admissions', element: <AdminAdmissions /> },
          { path: 'sms', element: <SMSPage /> },
          { path: 'test-analytics', element: <AdminTestAnalytics /> },
          { path: 'assessments', element: <AssessmentsPage /> },
          { path: 'bece-processor', element: <BECEProcessorPage /> },
          { path: 'bece-master', element: <BECEMasterPage /> },
          { path: 'elections', element: <AdminElectionsPage /> },
          { path: 'poster-maker', element: <AdminPosterMakerPage /> },
          { path: 'visitors', element: <VisitorsPage /> },
        ],
      },
      {
        path: 'bursar',
        element: <AppLayout requiredRole="bursar" />,
        children: [
          { index: true, element: <Navigate to="/bursar/dashboard" replace /> },
          { path: 'dashboard', element: <BursarDashboard /> },
          { path: 'fees', element: <BursarFeesPage /> },
          { path: 'daily-fees', element: <BursarDailyFeesPage /> },
          { path: 'debtors', element: <BursarDebtorsPage /> },
          { path: 'payroll', element: <BursarPayrollPage /> },
          { path: 'income', element: <BursarIncomePage /> },
          { path: 'expenses', element: <BursarExpensesPage /> },
          { path: 'analytics', element: <BursarAnalyticsPage /> },
          { path: 'bill-sheet', element: <BursarBillSheetPage /> },
          { path: 'reports', element: <BursarReportsPage /> },
          { path: 'inventory', element: <BursarInventoryPage /> },
          { path: 'students', element: <BursarStudentsPage /> },
          { path: 'sms', element: <SMSPage /> },
        ],
      },
      {
        path: 'teacher',
        element: <AppLayout requiredRole="teacher" />,
        children: [
          { index: true, element: <Navigate to="/teacher/dashboard" replace /> },
          { path: 'dashboard', element: <TeacherDashboard /> },
          { path: 'my-classes', element: <MyClassesPage /> },
          { path: 'score-entry', element: <ScoreEntryPage /> },
          { path: 'reports', element: <TeacherReportsPage /> },
          { path: 'timetable', element: <TeacherTimetablePage /> },
          { path: 'notifications', element: <TeacherNotificationsPage /> },
          { path: 'syllabus', element: <TeacherSyllabusPage /> },
          { path: 'lesson-tracker', element: <LessonTrackerPage /> },
          { path: 'students', element: <TeacherStudentsPage /> },
          { path: 'assignments', element: <TeacherAssignmentsPage /> },
          { path: 'assignments/:id', element: <TeacherAssignmentDetailsPage /> },
          { path: 'global-quizzes/:id', element: <TeacherGlobalQuizDetailsPage /> },
          { path: 'global-quizzes/:id/take', element: <TeacherTakeGlobalQuizPage /> },
          { path: 'attendance', element: <TeacherAttendancePage /> },
          { path: 'daily-fees', element: <TeacherDailyFeesPage /> },
          { path: 'subjects', element: <TeacherSubjectsPage /> },
          { path: 'subjects/:id', element: <TeacherSubjectDetailsPage /> },
          { path: 'messages', element: <MessagingPage /> },
          { path: 'agenda', element: <TeacherAgendaPage /> },
          { path: 'typing-game', element: <TypingGamePage /> },
          { path: 'class-tests', element: <ClassTestsPage /> },
          { path: 'elections-hub', element: <TeacherElectionsHubPage /> },
        ],
      },

      {
        path: 'super-admin',
        element: <AppLayout requiredRole="super_admin" />,
        children: [
          { index: true, element: <Navigate to="/super-admin/dashboard" replace /> },
          { path: 'dashboard', element: <SuperAdminDashboard /> },
          { path: 'schools', element: <SuperAdminDashboard /> },
          { path: 'quizzes', element: <GlobalQuizzesPage /> },
          { path: 'messaging', element: <MessagingPage /> },
          { path: 'analytics', element: <GlobalAnalyticsPage /> },
          { path: 'resources', element: <GlobalResourcesPage /> },
          { path: 'subjects', element: <PlatformSubjectsPage /> },
        ],
      },
      {
        path: 'student',
        element: <AppLayout requiredRole="student" />,
        children: [
          { index: true, element: <Navigate to="/student/dashboard" replace /> },
          { path: 'dashboard', element: <StudentDashboard /> },
          { path: 'results', element: <StudentResultsPage /> },
          { path: 'assignments', element: <StudentAssignmentsPage /> },
          { path: 'assignments/:id', element: <TakeAssignmentPage /> },
          { path: 'global-quizzes/:id', element: <TakeGlobalQuizPage /> },
          { path: 'schedule', element: <StudentSchedulePage /> },
          { path: 'subjects', element: <StudentSubjectsPage /> },
          { path: 'subjects/:id', element: <StudentSubjectDetailsPage /> },
          { path: 'typing-game', element: <TypingGamePage /> },
          { path: 'library', element: <StudentLibraryPage /> },
          { path: 'elections', element: <StudentElectionsPage /> },
        ],
      },
      {
        path: 'staff',
        element: <AppLayout requiredRole="staff" />,
        children: [
          { index: true, element: <Navigate to="/staff/dashboard" replace /> },
          { path: 'dashboard', element: <StaffDashboard /> },
          { path: 'elections', element: <StaffElectionsPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])