// src/pages/staff/StaffSelfServicePage.tsx
// Staff Self-Service — reuses TeacherSelfServicePage since both roles share
// the same salary_records, leave_requests, and staff_documents tables.
import TeacherSelfServicePage from '../teacher/TeacherSelfServicePage'

export default function StaffSelfServicePage() {
  return <TeacherSelfServicePage />
}
