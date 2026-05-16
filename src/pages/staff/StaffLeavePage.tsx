// src/pages/staff/StaffLeavePage.tsx
// Staff Leave — reuses the same TeacherLeavePage component since
// both roles share the same leave_requests table and LeaveService.
import TeacherLeavePage from '../teacher/TeacherLeavePage'

export default function StaffLeavePage() {
  return <TeacherLeavePage />
}
