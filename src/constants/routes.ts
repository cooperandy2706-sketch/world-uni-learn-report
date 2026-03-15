// src/constants/routes.ts
export const ROUTES = {
  // Auth
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',

  // Admin
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_STUDENTS: '/admin/students',
  ADMIN_TEACHERS: '/admin/teachers',
  ADMIN_CLASSES: '/admin/classes',
  ADMIN_SUBJECTS: '/admin/subjects',
  ADMIN_DEPARTMENTS: '/admin/departments',
  ADMIN_ACADEMIC_YEARS: '/admin/academic-years',
  ADMIN_TERMS: '/admin/terms',
  ADMIN_REPORTS: '/admin/reports',
  ADMIN_ANALYTICS: '/admin/analytics',
  ADMIN_SETTINGS: '/admin/settings',

  // Teacher
  TEACHER_DASHBOARD: '/teacher/dashboard',
  TEACHER_MY_CLASSES: '/teacher/my-classes',
  TEACHER_SCORE_ENTRY: '/teacher/score-entry',
  TEACHER_REPORTS: '/teacher/reports',
} as const