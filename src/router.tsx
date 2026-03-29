// src/router.tsx
import { createBrowserRouter, Navigate } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import AuthLayout from './components/layout/AuthLayout'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/auth/LoginPage'
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
import TimetablePage      from './pages/admin/TimetablePage'
import AnnouncementsPage  from './pages/admin/AnnouncementsPage'
import SyllabusPage       from './pages/admin/SyllabusPage'
import WeeklyGoalsPage    from './pages/admin/WeeklyGoalsPage'
import TeacherDashboard from './pages/teacher/DashboardPage'
import MyClassesPage from './pages/teacher/MyClassesPage'
import ScoreEntryPage from './pages/teacher/ScoreEntryPage'
import TeacherReportsPage from './pages/teacher/ReportsPage'
import TeacherTimetablePage     from './pages/teacher/TimetablePage'
import TeacherNotificationsPage from './pages/teacher/NotificationsPage'


export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
    ],
  },
  {
    path: '/admin',
    element: <AppLayout requiredRole="admin" />,
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: 'dashboard',      element: <AdminDashboard /> },
      { path: 'students',       element: <StudentsPage /> },
      { path: 'teachers',       element: <TeachersPage /> },
      { path: 'classes',        element: <ClassesPage /> },
      { path: 'subjects',       element: <SubjectsPage /> },
      { path: 'departments',    element: <DepartmentsPage /> },
      { path: 'academic-years', element: <AcademicYearsPage /> },
      { path: 'terms',          element: <TermsPage /> },
      { path: 'reports',        element: <AdminReportsPage /> },
      { path: 'analytics',      element: <AnalyticsPage /> },
      { path: 'settings',       element: <SettingsPage /> },
      { path: 'timetable',    element: <TimetablePage /> },
{ path: 'announcements',element: <AnnouncementsPage /> },
{ path: 'syllabus',     element: <SyllabusPage /> },
{ path: 'weekly-goals', element: <WeeklyGoalsPage /> },
    ],
  },
  {
    path: '/teacher',
    element: <AppLayout requiredRole="teacher" />,
    children: [
      { index: true, element: <Navigate to="/teacher/dashboard" replace /> },
      { path: 'dashboard',   element: <TeacherDashboard /> },
      { path: 'my-classes',  element: <MyClassesPage /> },
      { path: 'score-entry', element: <ScoreEntryPage /> },
      { path: 'reports',     element: <TeacherReportsPage /> },
      { path: 'timetable',     element: <TeacherTimetablePage /> },
{ path: 'notifications', element: <TeacherNotificationsPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])