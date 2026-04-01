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
import SettingsPage from './pages/admin/SettingsPage'
import TimetablePage from './pages/admin/TimetablePage'
import AnnouncementsPage from './pages/admin/AnnouncementsPage'
import SyllabusPage from './pages/admin/SyllabusPage'
import WeeklyGoalsPage from './pages/admin/WeeklyGoalsPage'
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
import StudentAssignmentsPage from './pages/student/StudentAssignmentsPage'
import TakeAssignmentPage from './pages/student/TakeAssignmentPage'
import AdminAttendancePage from './pages/admin/AttendancePage'
import SchoolRegistrationPage from './pages/auth/SchoolRegistrationPage'
import SuperAdminDashboard from './pages/admin/SuperAdminDashboard'
import StudentDashboard from './pages/student/StudentDashboard'
import ComingSoonPage from './pages/admin/ComingSoonPage'

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
          { path: 'classes', element: <ClassesPage /> },
          { path: 'subjects', element: <SubjectsPage /> },
          { path: 'departments', element: <DepartmentsPage /> },
          { path: 'academic-years', element: <AcademicYearsPage /> },
          { path: 'terms', element: <TermsPage /> },
          { path: 'reports', element: <AdminReportsPage /> },
          { path: 'analytics', element: <AnalyticsPage /> },
          { path: 'settings', element: <SettingsPage /> },
          { path: 'timetable', element: <TimetablePage /> },
          { path: 'announcements', element: <AnnouncementsPage /> },
          { path: 'syllabus', element: <SyllabusPage /> },
          { path: 'weekly-goals', element: <WeeklyGoalsPage /> },
          { path: 'attendance', element: <AdminAttendancePage /> },
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
          { path: 'attendance', element: <TeacherAttendancePage /> },
        ],
      },

      {
        path: 'super-admin',
        element: <AppLayout requiredRole="super_admin" />,
        children: [
          { index: true, element: <Navigate to="/super-admin/dashboard" replace /> },
          { path: 'dashboard', element: <SuperAdminDashboard /> },
          { path: 'schools', element: <SuperAdminDashboard /> },
          {
            path: 'quizzes',
            element: (
              <ComingSoonPage
                title="Monthly Global Quizzes"
                description="A centralized system to create and push standardized monthly assessments to all registered schools on the platform."
                icon="📝"
              />
            ),
          },
          {
            path: 'messaging',
            element: (
              <ComingSoonPage
                title="Global Platform Messaging"
                description="Broadcast emergency alerts, system updates, or platform-wide announcements to all school administrators and Teachers."
                icon="💬"
              />
            ),
          },
          {
            path: 'analytics',
            element: (
              <ComingSoonPage
                title="Leaderboards & Analytics"
                description="Deep insights into school performance, student growth metrics, and platform-wide engagement benchmarks."
                icon="🏅"
              />
            ),
          },
          {
            path: 'resources',
            element: (
              <ComingSoonPage
                title="Global Resource Library"
                description="Coordinate and share digital textbooks, teaching guides, and premium learning materials across all schools."
                icon="📚"
              />
            ),
          },
        ],
      },
      {
        path: 'student',
        element: <AppLayout requiredRole="student" />,
        children: [
          { index: true, element: <Navigate to="/student/dashboard" replace /> },
          { path: 'dashboard', element: <StudentDashboard /> },
          { 
            path: 'results', 
            element: <ComingSoonPage 
              title="My Academic Results" 
              description="View your performance across all subjects, download termly report cards, and track your progress over time." 
              icon="📊" 
            /> 
          },
          { path: 'assignments', element: <StudentAssignmentsPage /> },
          { path: 'assignments/:id', element: <TakeAssignmentPage /> },
          { 
            path: 'schedule', 
            element: <ComingSoonPage 
              title="My Class Schedule" 
              description="Stay on top of your daily classes, exams, and extracurricular activities with your personalized timetable." 
              icon="📅" 
            /> 
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])