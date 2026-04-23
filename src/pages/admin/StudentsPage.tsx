// src/pages/admin/StudentsPage.tsx
import { useState, useRef, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import * as XLSX from 'xlsx'
import {
  useStudents, useCreateStudent, useUpdateStudent, useDeleteStudent,
} from '../../hooks/useStudents'
import { useClasses } from '../../hooks/useClasses'
import { useAuth } from '../../hooks/useAuth'
import { useSettings } from '../../hooks/useSettings'
import { studentsService } from '../../services/students.service'
import Modal from '../../components/ui/Modal'
import { formatDate } from '../../lib/utils'
import toast from 'react-hot-toast'

const schema = z.object({
  full_name:      z.string().min(2, 'Name is required'),
  student_id:     z.string().optional().or(z.literal('')),
  class_id:       z.string().optional().or(z.literal('')),
  gender:         z.enum(['male', 'female']).optional().or(z.literal('')),
  date_of_birth:  z.string().optional().or(z.literal('')),
  house:          z.string().optional().or(z.literal('')),
  guardian_name:  z.string().optional().or(z.literal('')),
  guardian_phone: z.string().optional().or(z.literal('')),
  guardian_email: z.string().optional().or(z.literal('')),
  address:        z.string().optional().or(z.literal('')),
})
type FormData = z.infer<typeof schema>

// ── Student Letter Types ────────────────────────────────
const STUDENT_LETTER_TYPES = [
  { id: 'admission', label: 'Admission Letter', icon: '📝' },
  { id: 'exeat', label: 'Exeat (Leave-out) Form', icon: '🚪' },
  { id: 'disciplinary', label: 'Disciplinary Warning', icon: '⚠️' },
  { id: 'testimonial', label: 'Testimonial / Recommendation', icon: '📜' },
  { id: 'scholarship', label: 'Scholarship Award', icon: '🏆' },
  { id: 'suspension', label: 'Suspension Letter', icon: '🚨' },
  { id: 'medical', label: 'Medical Exemption', icon: '🏥' },
  { id: 'studentId', label: 'Student ID Card (Printable)', icon: '🪪' },
  { id: 'transfer', label: 'Transfer Certificate', icon: '✈️' },
  { id: 'clearance', label: 'Fee Clearance Cert.', icon: '💰' },
  { id: 'enrollment', label: 'Proof of Enrollment', icon: '🏫' },
  { id: 'withdrawal', label: 'Withdrawal Acknowl.', icon: '👋' },
  { id: 'bestBoy', label: 'Best Boy Award', icon: '👦' },
  { id: 'bestGirl', label: 'Best Girl Award', icon: '👧' },
  { id: 'attendance', label: 'Perfect Attendance', icon: '⏰' },
  { id: 'improved', label: 'Most Improved Student', icon: '📈' },
  { id: 'subject', label: 'Subject Excellence', icon: '📚' },
  { id: 'parentPermit', label: 'Parental Permission (Extra Time)', icon: '👪' },
  { id: 'parentInvite', label: 'Parent Meeting Invitation', icon: '📅' },
  { id: 'parentInfo', label: 'General Information Letter', icon: 'ℹ️' },
] as const
type StudentLetterTypeId = typeof STUDENT_LETTER_TYPES[number]['id']

const STUDENT_LETTER_FIELDS: Record<StudentLetterTypeId, { key: string; label: string; type?: string; placeholder?: string }[]> = {
  admission: [{ key: 'admissionDate', label: 'Admission Date', type: 'date' }, { key: 'term', label: 'Admitted Term', placeholder: 'e.g. First Term' }, { key: 'fees', label: 'Registration Fees (GHS)', placeholder: 'e.g. 500' }, { key: 'letterDate', label: 'Letter Date', type: 'date' }],
  exeat: [{ key: 'reason', label: 'Reason for Exeat', placeholder: 'e.g. Family Emergency' }, { key: 'exitDate', label: 'Exit Date', type: 'date' }, { key: 'returnDate', label: 'Expected Return', type: 'date' }, { key: 'guardianContact', label: 'Guardian Contact', placeholder: 'e.g. 024XXXXXXX' }, { key: 'letterDate', label: 'Date Issued', type: 'date' }],
  disciplinary: [{ key: 'incident', label: 'Incident Description', placeholder: 'Describe the incident…' }, { key: 'warningLevel', label: 'Warning Level', placeholder: 'e.g. First Warning, Final Warning' }, { key: 'meetingDate', label: 'Parent Meeting Date (Optional)', type: 'date' }, { key: 'letterDate', label: 'Letter Date', type: 'date' }],
  testimonial: [{ key: 'startYear', label: 'Enrollment Year', placeholder: 'e.g. 2019' }, { key: 'endYear', label: 'Graduation/Leaving Year', placeholder: 'e.g. 2023' }, { key: 'conduct', label: 'General Conduct', placeholder: 'e.g. Excellent' }, { key: 'strengths', label: 'Key Strengths/Activities', placeholder: 'e.g. Debate Club President' }, { key: 'letterDate', label: 'Letter Date', type: 'date' }],
  scholarship: [{ key: 'awardName', label: 'Scholarship Name', placeholder: 'e.g. Academic Excellence Award' }, { key: 'amount', label: 'Amount / Percentage', placeholder: 'e.g. 50% of Tuition' }, { key: 'validUntil', label: 'Valid Until', placeholder: 'e.g. Graduation' }, { key: 'letterDate', label: 'Letter Date', type: 'date' }],
  suspension: [{ key: 'reason', label: 'Reason for Suspension', placeholder: 'Describe the offense…' }, { key: 'fromDate', label: 'Suspension Start', type: 'date' }, { key: 'toDate', label: 'Suspension End', type: 'date' }, { key: 'letterDate', label: 'Letter Date', type: 'date' }],
  medical: [{ key: 'condition', label: 'Condition/Exempted Activity', placeholder: 'e.g. Exempted from P.E.' }, { key: 'noteDate', label: 'Doctor Note Date', type: 'date' }, { key: 'expiryDate', label: 'Exemption Expiry (Optional)', type: 'date' }, { key: 'letterDate', label: 'Letter Date', type: 'date' }],
  studentId: [{ key: 'issueDate', label: 'Issue Date', type: 'date' }, { key: 'expiryDate', label: 'Expiry Date', type: 'date' }, { key: 'bloodGroup', label: 'Blood Group (Optional)', placeholder: 'e.g. O+' }],
  transfer: [{ key: 'lastClass', label: 'Last Class Attended', placeholder: 'e.g. JHS 3' }, { key: 'transferDate', label: 'Date of Transfer', type: 'date' }, { key: 'destinationSchool', label: 'Destination School', placeholder: 'e.g. Achimota School' }, { key: 'reason', label: 'Reason for Transfer', placeholder: 'e.g. Family Relocation' }, { key: 'letterDate', label: 'Letter Date', type: 'date' }],
  clearance: [{ key: 'academicYear', label: 'Academic Year', placeholder: 'e.g. 2023/2024' }, { key: 'term', label: 'Term/Semester', placeholder: 'e.g. Term 2' }, { key: 'totalPaid', label: 'Total Amount Paid', placeholder: 'e.g. 2,500.00' }, { key: 'clearanceDate', label: 'Clearance Date', type: 'date' }, { key: 'letterDate', label: 'Letter Date', type: 'date' }],
  enrollment: [{ key: 'academicYear', label: 'Current Academic Year', placeholder: 'e.g. 2023/2024' }, { key: 'currentLevel', label: 'Current Level/Grade', placeholder: 'e.g. Grade 10' }, { key: 'enrollmentDate', label: 'Original Enrollment Date', type: 'date' }, { key: 'letterDate', label: 'Letter Date', type: 'date' }],
  withdrawal: [{ key: 'withdrawalDate', label: 'Withdrawal Date', type: 'date' }, { key: 'effectiveDate', label: 'Effective From', type: 'date' }, { key: 'reason', label: 'Reason for Withdrawal', placeholder: 'e.g. Voluntary Withdrawal' }, { key: 'letterDate', label: 'Letter Date', type: 'date' }],
  bestBoy: [{ key: 'academicYear', label: 'Academic Year', placeholder: 'e.g. 2023/2024' }, { key: 'term', label: 'Term', placeholder: 'e.g. Third Term' }, { key: 'awardDate', label: 'Award Date', type: 'date' }, { key: 'citation', label: 'Citation (Optional)', placeholder: 'In recognition of exceptional leadership…' }],
  bestGirl: [{ key: 'academicYear', label: 'Academic Year', placeholder: 'e.g. 2023/2024' }, { key: 'term', label: 'Term', placeholder: 'e.g. Third Term' }, { key: 'awardDate', label: 'Award Date', type: 'date' }, { key: 'citation', label: 'Citation (Optional)', placeholder: 'In recognition of exceptional leadership…' }],
  attendance: [{ key: 'academicYear', label: 'Academic Year', placeholder: 'e.g. 2023/2024' }, { key: 'term', label: 'Term', placeholder: 'e.g. Full Year' }, { key: 'awardDate', label: 'Award Date', type: 'date' }, { key: 'citation', label: 'Citation (Optional)', placeholder: 'For achieving 100% attendance…' }],
  improved: [{ key: 'academicYear', label: 'Academic Year', placeholder: 'e.g. 2023/2024' }, { key: 'term', label: 'Term', placeholder: 'e.g. Term 2' }, { key: 'awardDate', label: 'Award Date', type: 'date' }, { key: 'citation', label: 'Citation (Optional)', placeholder: 'For remarkable academic growth…' }],
  subject: [{ key: 'subject', label: 'Subject Name', placeholder: 'e.g. Mathematics' }, { key: 'academicYear', label: 'Academic Year', placeholder: 'e.g. 2023/2024' }, { key: 'term', label: 'Term', placeholder: 'e.g. Term 1' }, { key: 'awardDate', label: 'Award Date', type: 'date' }],
  parentPermit: [
    { key: 'eventName', label: 'Activity / Event Name', placeholder: 'e.g. Extra Mock Exam Prep' },
    { key: 'eventDate', label: 'Event Date', type: 'date' },
    { key: 'endTime', label: 'New Closing Time', placeholder: 'e.g. 4:30 PM' },
    { key: 'reason', label: 'Reason for Extension', placeholder: 'e.g. To cover outstanding syllabus items...' },
    { key: 'letterDate', label: 'Letter Date', type: 'date' }
  ],
  parentInvite: [
    { key: 'purpose', label: 'Meeting Purpose', placeholder: 'e.g. Discussion of Academic Progress' },
    { key: 'meetingDate', label: 'Meeting Date', type: 'date' },
    { key: 'meetingTime', label: 'Meeting Time', placeholder: 'e.g. 10:00 AM' },
    { key: 'venue', label: 'Meeting Venue', placeholder: 'e.g. Principal\'s Office' },
    { key: 'letterDate', label: 'Letter Date', type: 'date' }
  ],
  parentInfo: [
    { key: 'subject', label: 'Letter Subject', placeholder: 'e.g. End of Term Arrangements' },
    { key: 'content', label: 'Message Content', placeholder: 'Type your message to parents here...' },
    { key: 'letterDate', label: 'Letter Date', type: 'date' }
  ],
}

function formatLetterDate(d: string) {
  if (!d) return '___________'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function letterRef(type: string) {
  const map: Record<string, string> = {
    admission: 'ADM', exeat: 'EXT', disciplinary: 'DIS', testimonial: 'TST',
    scholarship: 'SCH', suspension: 'SUS', medical: 'MED', studentId: 'SID',
    parentPermit: 'PER', parentInvite: 'INV', parentInfo: 'INF',
  }
  const code = map[type] ?? 'STD'
  const year = new Date().getFullYear()
  const num = String(Math.floor(Math.random() * 900) + 100)
  return `STU/${code}/${year}/${num}`
}

const CREST_SVG = `
  <svg width="56" height="56" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
    <circle cx="28" cy="28" r="26" fill="none" stroke="#2563eb" stroke-width="1.5"/>
    <polygon points="28,9 32.5,21.5 46,21.5 35,29 39,42 28,34 17,42 21,29 10,21.5 23.5,21.5"
      fill="none" stroke="#2563eb" stroke-width="1.3" stroke-linejoin="round"/>
    <circle cx="28" cy="28" r="4.5" fill="#2563eb" opacity="0.75"/>
  </svg>
`

function docHeader(school: any, student: any, letterDate: string, letterType = '') {
  const ref = letterRef(letterType)
  const sName = school?.name || 'School Name'
  const sAddr = school?.address || 'P.O. Box 000'
  const sEmail = school?.email || ''
  const sPhone = school?.phone || ''
  const sMotto = school?.motto || 'Excellence and Integrity'

  const contactParts = [sAddr, sPhone, sEmail].filter(Boolean)

  return `
    <!-- ═══ BASE HEADER ═══ -->
    <div class="lh-top">
      <div class="lh-logo-row">
        <div class="lh-crest">${school?.logo_url ? `<img src="${school.logo_url}" alt="Logo" style="width: 56px; height: 56px; object-fit: contain; border-radius: 50%; background: #ffffff; padding: 4px;" />` : CREST_SVG}</div>
        <div class="lh-school-block">
          <div class="lh-school-name">${sName}</div>
          <div class="lh-motto">${sMotto}</div>
        </div>
      </div>
      <div class="lh-contact-bar">
        ${contactParts.map(c => `<span class="lh-contact-item">${c}</span>`).join('')}
      </div>
    </div>
    <div class="lh-gold-bar"></div>
    <div class="lh-meta-row">
      <div class="lh-ref">Ref: <strong>${ref}</strong></div>
      <div class="lh-date">${formatLetterDate(letterDate)}</div>
    </div>
    <div class="lh-recipient">
      <strong>To:</strong>&nbsp; ${student?.guardian_name ? student.guardian_name : `The Parent/Guardian of ${student?.full_name || '___________'}`}<br/>
      <strong>Student Name:</strong>&nbsp; ${student?.full_name || '___________'}<br/>
      <strong>Student ID:</strong>&nbsp; ${student?.student_id || '___________'}<br/>
      <strong>Class:</strong>&nbsp; ${(student as any)?.class?.name || '___________'}
    </div>
  `
}

function docFooter(school: any) {
  const sName = school?.name || 'School Name'
  const sHead = school?.headteacher_name || 'Headteacher / Principal'
  return `
    <div class="lh-sig-block">
      <p class="lh-salutation">Yours faithfully,</p>
      <div class="lh-sig-line"></div>
      <p class="lh-sig-name">${sHead}</p>
      <p class="lh-sig-title">Headteacher &middot; ${sName}</p>
    </div>
    <div class="lh-footer">
      <span class="lh-footer-left">${sName.toUpperCase()} &middot; OFFICIAL STUDENT RECORD</span>
      <span class="lh-footer-right">Page 1 of 1</span>
    </div>
  `
}

const DOC_CSS = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Source+Sans+3:wght@400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Source Sans 3', 'Georgia', sans-serif; font-size: 13.5px; color: #1a1a1a; line-height: 1.78; background: #fff; max-width: 760px; margin: 0 auto; padding: 0; }
    .lh-top { background: #1e3a8a; padding: 26px 44px 0; }
    .lh-logo-row { display: flex; align-items: center; gap: 16px; }
    .lh-school-name { font-family: 'Cormorant Garamond', 'Georgia', serif; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: 0.02em; line-height: 1.15; }
    .lh-motto { font-size: 11px; color: #bfdbfe; font-style: italic; letter-spacing: 0.07em; margin-top: 3px; }
    .lh-contact-bar { display: flex; flex-wrap: wrap; margin-top: 18px; border-top: 0.5px solid rgba(191,219,254,0.3); }
    .lh-contact-item { font-size: 10.5px; color: #bfdbfe; padding: 5px 14px; border-left: 0.5px solid rgba(191,219,254,0.25); }
    .lh-contact-item:first-child { padding-left: 0; border-left: none; }
    .lh-gold-bar { height: 5px; background: linear-gradient(90deg, #b8832a 0%, #e6b84a 45%, #b8832a 100%); }
    .lh-body { padding: 28px 44px 36px; }
    .lh-meta-row { display: flex; justify-content: space-between; align-items: baseline; padding: 22px 44px 0; font-size: 12.5px; color: #555; }
    .lh-recipient { padding: 16px 44px 0; font-size: 13px; color: #222; line-height: 1.7; }
    h2.subject { font-family: 'Cormorant Garamond', serif; font-size: 17px; font-weight: 700; color: #1e3a8a; text-transform: uppercase; letter-spacing: 0.06em; margin: 24px 0 18px; padding-bottom: 9px; border-bottom: 2px solid #1e3a8a; }
    p { margin: 0 0 14px; font-size: 13.5px; line-height: 1.78; }
    .incident-box { background: #fff8e1; border-left: 3.5px solid #e6a817; padding: 10px 16px; border-radius: 0 4px 4px 0; margin: 12px 0 18px; font-size: 13px; color: #3d2c00; }
    .incident-box.danger { background: #fff1f2; border-left-color: #dc2626; color: #450000; }
    .incident-box.success { background: #f0fdf4; border-left-color: #16a34a; color: #052e16; }
    .lh-sig-block { margin: 48px 44px 0; }
    .lh-salutation { font-size: 13.5px; color: #222; margin-bottom: 38px; }
    .lh-sig-line { width: 200px; border-top: 1px solid #333; margin-bottom: 8px; }
    .lh-sig-name { font-size: 14px; font-weight: 600; color: #1e3a8a; margin-bottom: 2px; }
    .lh-footer { display: flex; justify-content: space-between; align-items: center; background: #f4f2ec; border-top: 0.5px solid #ddd8cc; padding: 9px 44px; margin-top: 40px; font-size: 9.5px; color: #888; }
    .id-card-page { display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    .id-card { width: 340px; border: 2.5px solid #1e3a8a; border-radius: 14px; overflow: hidden; font-family: 'Source Sans 3', sans-serif; text-align: center; }
    .id-card-header { background: #1e3a8a; padding: 16px 20px 12px; display: flex; align-items: center; gap: 12px; }
    .id-card-school { font-family: 'Cormorant Garamond', serif; font-size: 15px; font-weight: 700; color: #fff; line-height: 1.2; }
    .id-card-gold { height: 4px; background: linear-gradient(90deg,#b8832a,#e6b84a,#b8832a); }
    .id-card-body { background: #fff; padding: 24px 20px 20px; }
    .id-card-avatar { width: 84px; height: 84px; border-radius: 50%; background: #eff6ff; border: 3px solid #1e3a8a; margin: 0 auto 14px; display: flex; align-items: center; justify-content: center; font-size: 34px; font-weight: 700; color: #1e3a8a; }
    .id-card-name { font-size: 18px; font-weight: 600; color: #1e3a8a; }
    .id-card-role { font-size: 13px; color: #555; margin: 3px 0 12px; }
    .id-card-badge { display: inline-block; font-size: 13px; font-weight: 600; color: #1e3a8a; background: #eff6ff; border: 1px solid #bfdbfe; padding: 4px 18px; border-radius: 99px; }
    .id-card-footer { border-top: 0.5px solid #e5e7eb; padding: 8px 20px; font-size: 10.5px; color: #999; }
    .cert-container { padding: 50px 40px; border: 12px double #1e3a8a; background: #fff; text-align: center; position: relative; min-height: 600px; display: flex; flex-direction: column; justify-content: center; }
    .cert-header { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 700; color: #1e3a8a; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 10px; }
    .cert-title { font-family: 'Playfair Display', serif; font-size: 46px; font-weight: 700; color: #b8832a; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; }
    .cert-subtitle { font-size: 18px; color: #555; margin-bottom: 44px; font-style: italic; }
    .cert-award-to { font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; color: #888; margin-bottom: 10px; }
    .cert-name { font-family: 'Playfair Display', serif; font-size: 44px; font-weight: 700; color: #1e3a8a; margin: 10px 0 30px; border-bottom: 2px solid #b8832a; display: inline-block; padding: 0 50px 5px; }
    .cert-citation { font-size: 16px; color: #444; max-width: 640px; margin: 0 auto 40px; line-height: 1.6; font-style: italic; }
    .cert-footer { display: flex; justify-content: space-around; align-items: flex-end; margin-top: 50px; }
    .cert-sig-box { width: 200px; text-align: center; }
    .cert-sig-line { border-top: 1px solid #333; margin-bottom: 8px; }
    .cert-sig-name { font-size: 14px; font-weight: 600; color: #1e3a8a; }
    .cert-date { font-size: 13px; color: #777; margin-top: 40px; }
    @page { margin: 15mm 18mm; size: A4; }
    @media print { body { max-width: 100%; } .lh-top, .lh-gold-bar, .lh-footer, .id-card-header, .id-card-gold, .incident-box, .cert-container { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
`

function generateStudentDocHTML(type: StudentLetterTypeId, student: any, fields: Record<string, string>, school: any): string {
  const s = student
  const f = fields
  const fn = s?.full_name || '___________'

  const wrapHTML = (bodyContent: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${STUDENT_LETTER_TYPES.find(l => l.id === type)?.label || 'Document'} — ${fn}</title>
  ${DOC_CSS}
</head>
<body>${bodyContent}</body>
</html>`

  const body = (subject: string, content: string) => `
    ${docHeader(school, s, f.letterDate, type)}
    <div class="lh-body">
      <h2 class="subject">${subject}</h2>
      ${content}
      ${docFooter(school)}
    </div>
  `

  switch (type) {
    case 'admission': return wrapHTML(body('Letter of Admission', `
      <p>Dear ${s?.guardian_name || 'Parent/Guardian'},</p>
      <p>We are pleased to offer <strong>${fn}</strong> admission into <strong>${(s as any)?.class?.name || '___________'}</strong> at ${school?.name || 'our school'}, effective <strong>${formatLetterDate(f.admissionDate)}</strong> for the <strong>${f.term || '___________'}</strong> term.</p>
      <p>Please note that the registration fee of <strong>GHS ${f.fees || '___________'}</strong> is due before the commencement of the term.</p>
      <p>We look forward to welcoming your ward into our community of learners.</p>
    `))
    case 'exeat': return wrapHTML(body('Exeat / Leave-out Form', `
      <p>This is to confirm that <strong>${fn}</strong> has been granted permission to leave the school premises.</p>
      <div class="incident-box">
        <strong>Reason:</strong> ${f.reason || '___________'}<br/>
        <strong>Exit Date:</strong> ${formatLetterDate(f.exitDate)}<br/>
        <strong>Expected Return:</strong> ${formatLetterDate(f.returnDate)}
      </div>
      <p>Guardian Contact verified: <strong>${f.guardianContact || '___________'}</strong>.</p>
      <p>The student is expected to sign back in at the security gate upon return.</p>
    `))
    case 'disciplinary': return wrapHTML(body('Disciplinary Notice', `
      <p>Dear ${s?.guardian_name || 'Parent/Guardian'},</p>
      <p>This letter serves as a <strong>${f.warningLevel || 'formal warning'}</strong> regarding the conduct of your ward, <strong>${fn}</strong>.</p>
      <div class="incident-box danger">${f.incident || '___________'}</div>
      ${f.meetingDate ? `<p>You are hereby invited to a meeting at the school on <strong>${formatLetterDate(f.meetingDate)}</strong> to discuss this matter.</p>` : ''}
      <p>We require your cooperation to ensure this behavior is rectified immediately.</p>
    `))
    case 'testimonial': return wrapHTML(body('Letter of Testimonial', `
      <p>To Whom It May Concern,</p>
      <p>This is to certify that <strong>${fn}</strong> was a student at ${school?.name || 'our school'} from <strong>${f.startYear || '___________'}</strong> to <strong>${f.endYear || '___________'}</strong>.</p>
      <p>During their time here, their general conduct was <strong>${f.conduct || '___________'}</strong>. They actively demonstrated strengths in: <strong>${f.strengths || '___________'}</strong>.</p>
      <p>We highly recommend them for any future academic pursuit or endeavor.</p>
    `))
    case 'scholarship': return wrapHTML(body('Scholarship Award Confirmation', `
      <p>Dear ${s?.guardian_name || 'Parent/Guardian'},</p>
      <p>We are delighted to inform you that <strong>${fn}</strong> has been awarded the <strong>${f.awardName || '___________'}</strong>.</p>
      <p>The award covers: <strong>${f.amount || '___________'}</strong> and is valid until <strong>${f.validUntil || '___________'}</strong>, subject to maintaining satisfactory academic performance.</p>
      <p>Congratulations to you and your ward on this fantastic achievement!</p>
    `))
    case 'suspension': return wrapHTML(body('Suspension Notice', `
      <p>Dear ${s?.guardian_name || 'Parent/Guardian'},</p>
      <p>We regret to inform you that <strong>${fn}</strong> has been suspended from school due to the following infraction:</p>
      <div class="incident-box danger">${f.reason || '___________'}</div>
      <p>The suspension takes effect from <strong>${formatLetterDate(f.fromDate)}</strong> to <strong>${formatLetterDate(f.toDate)}</strong>.</p>
      <p>Please ensure your ward completes any assigned restorative tasks during this period.</p>
    `))
    case 'medical': return wrapHTML(body('Medical Exemption Record', `
      <p>This official memo serves to record a medical exemption for <strong>${fn}</strong> based on a doctor's note provided on <strong>${formatLetterDate(f.noteDate)}</strong>.</p>
      <div class="incident-box success">
        <strong>Condition / Exemption:</strong> ${f.condition || '___________'}
      </div>
      ${f.expiryDate ? `<p>This exemption is valid until <strong>${formatLetterDate(f.expiryDate)}</strong>.</p>` : '<p>This is a permanent exemption pending further medical review.</p>'}
    `))
    case 'studentId': return wrapHTML(`
      <div class="id-card-page">
        <div class="id-card">
          <div class="id-card-header">
            ${school?.logo_url ? `<img src="${school.logo_url}" alt="Logo" style="width: 42px; height: 42px; object-fit: contain; border-radius: 50%; background: #ffffff; padding: 3px;" />` : CREST_SVG.replace('width="56" height="56"', 'width="42" height="42" stroke="#ffffff"').replace(/stroke="#2563eb"/g, 'stroke="#ffffff"').replace(/fill="#2563eb"/g, 'fill="#ffffff"')}
            <div class="id-card-school">${school?.name || 'School Name'}</div>
          </div>
          <div class="id-card-gold"></div>
          <div class="id-card-body">
            <div class="id-card-avatar">${(fn).charAt(0).toUpperCase()}</div>
            <div class="id-card-name">${fn}</div>
            <div class="id-card-role">${(s as any)?.class?.name || '___________'} &middot; ${f.bloodGroup ? `Blood: ${f.bloodGroup}` : 'Student'}</div>
            <div class="id-card-badge">${s?.student_id || 'ID: ___________'}</div>
          </div>
          <div class="id-card-footer">Issued: ${formatLetterDate(f.issueDate)} &middot; Expiry: ${formatLetterDate(f.expiryDate)}</div>
        </div>
      </div>
    `)
    case 'transfer': return wrapHTML(body('Transfer Certificate', `
      <p>This is to certify that <strong>${fn}</strong> was a student of ${school?.name || 'this school'} and is now transferring to another institution.</p>
      <div class="incident-box">
        <strong>Last Class Attended:</strong> ${f.lastClass || '___________'}<br/>
        <strong>Date of Transfer:</strong> ${formatLetterDate(f.transferDate)}<br/>
        <strong>Destination:</strong> ${f.destinationSchool || '___________'}
      </div>
      <p>Reason for transfer: <strong>${f.reason || '___________'}</strong>.</p>
      <p>All academic records and behavioral files have been processed for transfer.</p>
    `))
    case 'clearance': return wrapHTML(body('Fee Clearance Certificate', `
      <p>To Whom It May Concern,</p>
      <p>This document serves as formal confirmation that <strong>${fn}</strong> has fully settled all financial obligations to ${school?.name || 'our school'} for the following period:</p>
      <div class="incident-box success">
        <strong>Academic Year:</strong> ${f.academicYear || '___________'}<br/>
        <strong>Term:</strong> ${f.term || '___________'}<br/>
        <strong>Total Amount Cleared:</strong> GHS ${f.totalPaid || '___________'}
      </div>
      <p>Clearance Issued on: <strong>${formatLetterDate(f.clearanceDate)}</strong>.</p>
      <p>The student is in good financial standing with the institution.</p>
    `))
    case 'enrollment': return wrapHTML(body('Proof of Enrollment', `
      <p>To Whom It May Concern,</p>
      <p>This is to certify that <strong>${fn}</strong> is a duly enrolled student at ${school?.name || 'our school'} for the <strong>${f.academicYear || '___________'}</strong> academic year.</p>
      <p>Currently, the student is at the <strong>${f.currentLevel || '___________'}</strong> level of their education.</p>
      <p>Original Date of Enrollment: <strong>${formatLetterDate(f.enrollmentDate)}</strong>.</p>
      <p>This letter is issued upon request for official verification purposes.</p>
    `))
    case 'withdrawal': return wrapHTML(body('Withdrawal Acknowledgment', `
      <p>Dear ${s?.guardian_name || 'Parent/Guardian'},</p>
      <p>This letter acknowledges the formal withdrawal of <strong>${fn}</strong> from ${school?.name || 'our school'}.</p>
      <div class="incident-box">
        <strong>Withdrawal Date:</strong> ${formatLetterDate(f.withdrawalDate)}<br/>
        <strong>Effective From:</strong> ${formatLetterDate(f.effectiveDate)}<br/>
        <strong>Reason:</strong> ${f.reason || '___________'}
      </div>
      <p>We thank you for the time your ward spent with us and wish them the very best in their future endeavors.</p>
    `))
    case 'parentPermit': return wrapHTML(body('Permission for Extended School Hours', `
      <p>Dear Parents and Guardians,</p>
      <p>We wish to inform you that the school has scheduled <strong>${f.eventName || 'an important academic session'}</strong> for students in <strong>${(s as any)?.class?.name || 'their class'}</strong> on <strong>${formatLetterDate(f.eventDate)}</strong>.</p>
      <p>In view of this, students will be required to stay in school until <strong>${f.endTime || '___________'}</strong>. This extension is necessary to <strong>${f.reason || 'ensure all students are well-prepared for their upcoming assessments'}</strong>.</p>
      <p>We understand the importance of student safety and transportation. Please make the necessary arrangements to pick up your ward at the new closing time. For those using the school bus, drop-off times will be adjusted accordingly.</p>
      <p>We thank you for your continued support in providing the best educational experience for our students.</p>
    `))
    case 'parentInvite': return wrapHTML(body('Invitation to Parent-School Meeting', `
      <p>Dear ${s?.guardian_name || 'Parent/Guardian'},</p>
      <p>The management of ${school?.name || 'our school'} cordially invites you to a meeting to discuss <strong>${f.purpose || 'matters concerning your ward\'s academic progress'}</strong>.</p>
      <div class="incident-box">
        📅 Date: <strong>${formatLetterDate(f.meetingDate)}</strong><br/>
        ⏰ Time: <strong>${f.meetingTime || '___________'}</strong><br/>
        📍 Venue: <strong>${f.venue || '___________'}</strong>
      </div>
      <p>Your presence and input are highly valued as we work together to support <strong>${fn}</strong>'s growth and success. Please make every effort to attend punctually.</p>
      <p>We look forward to meeting with you.</p>
    `))
    case 'parentInfo': return wrapHTML(body(f.subject || 'Information for Parents', `
      <p>Dear Parents and Guardians,</p>
      <div style="white-space: pre-wrap; margin-top: 15px; line-height: 1.8;">${f.content || '...'}</div>
      <p>Thank you for your continued cooperation.</p>
    `))
    case 'bestBoy':
    case 'bestGirl':
    case 'attendance':
    case 'improved':
    case 'subject': {
      const awardTitle = type === 'bestBoy' ? 'Best Boy Award' : 
                         type === 'bestGirl' ? 'Best Girl Award' :
                         type === 'attendance' ? 'Perfect Attendance' :
                         type === 'improved' ? 'Most Improved Student' :
                         `Academic Excellence In ${f.subject || 'Subject'}`
      
      const awardSubtitle = type === 'subject' ? `Academic Year ${f.academicYear || '____'}` : `For the ${f.term || '____'} Term &middot; ${f.academicYear || '____'}`
      const citation = f.citation || (
        type === 'bestBoy' || type === 'bestGirl' ? 'In recognition of exceptional leadership, exemplary conduct, and positive influence within the school community.' :
        type === 'attendance' ? 'For demonstrating outstanding commitment and consistency by achieving 100% attendance.' :
        type === 'improved' ? 'For showing remarkable determination, hard work, and significant progress in academic performance and character.' :
        `For achieving highest honors and demonstrating exceptional mastery in the study of ${f.subject || 'this subject'}.`
      )

      return wrapHTML(`
        <div class="cert-container">
          <div class="cert-header">${school?.name || 'SCHOOL NAME'}</div>
          <div class="cert-title">${awardTitle}</div>
          <div class="cert-subtitle">${awardSubtitle}</div>
          
          <div class="cert-award-to">This Certificate is Proudly Awarded To</div>
          <div class="cert-name">${fn}</div>
          
          <div class="cert-citation">${citation}</div>
          
          <div class="cert-footer">
            <div class="cert-sig-box">
              <div class="cert-sig-line"></div>
              <div class="cert-sig-name">${school?.headteacher_name || 'Headteacher'}</div>
            </div>
            <div class="cert-sig-box">
              <div class="cert-sig-line"></div>
              <div class="cert-sig-name">Date: ${formatLetterDate(f.awardDate || f.letterDate)}</div>
            </div>
          </div>
        </div>
      `)
    }
    default: return wrapHTML('<p style="padding:40px">Letter type not found.</p>')
  }
}

// ── helpers ───────────────────────────────────────────────
function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const colors = ['#6d28d9','#0891b2','#16a34a','#d97706','#dc2626','#7c3aed','#0284c7']
  const color = colors[name.charCodeAt(0) % colors.length]
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(135deg, ${color}, ${color}cc)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 800, color: '#fff',
      boxShadow: `0 2px 8px ${color}40`,
    }}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 5 }}>{children}</label>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      {children}
    </div>
  )
}

function StyledInput({ error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <input
        {...props}
        onFocus={e => { setFocused(true); props.onFocus?.(e) }}
        onBlur={e => { setFocused(false); props.onBlur?.(e) }}
        style={{
          width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 13,
          border: `1.5px solid ${error ? '#f87171' : focused ? '#7c3aed' : '#e5e7eb'}`,
          boxShadow: focused ? '0 0 0 3px rgba(109,40,217,0.1)' : 'none',
          outline: 'none', background: '#fff', color: '#111827',
          fontFamily: '"DM Sans",sans-serif', transition: 'all 0.15s',
          boxSizing: 'border-box',
        }}
      />
      {error && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>⚠ {error}</p>}
    </div>
  )
}

function StyledSelect({ error, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { error?: string }) {
  const [focused, setFocused] = useState(false)
  const { onBlur: propOnBlur, onFocus: propOnFocus, onChange: propOnChange, ...rest } = props
  return (
    <select
      {...rest}
      onChange={e => { propOnChange?.(e) }}
      onFocus={e => { setFocused(true); propOnFocus?.(e) }}
      onBlur={e => { setFocused(false); propOnBlur?.(e) }}
      style={{
        width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 13,
        border: `1.5px solid ${focused ? '#7c3aed' : '#e5e7eb'}`,
        boxShadow: focused ? '0 0 0 3px rgba(109,40,217,0.1)' : 'none',
        outline: 'none', background: '#fff', color: '#111827',
        fontFamily: '"DM Sans",sans-serif', cursor: 'pointer',
        boxSizing: 'border-box',
      }}
    >
      {children}
    </select>
  )
}

function Btn({ children, onClick, variant = 'primary', type = 'button', disabled, loading, style }: any) {
  const [hov, setHov] = useState(false)
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '9px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600,
    border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s', opacity: disabled ? 0.6 : 1,
    fontFamily: '"DM Sans",sans-serif',
    ...style,
  }
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: hov ? '#5b21b6' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', boxShadow: '0 2px 8px rgba(109,40,217,0.28)' },
    secondary: { background: hov ? '#f5f3ff' : '#fff', color: '#374151', border: '1.5px solid #e5e7eb' },
    danger: { background: hov ? '#b91c1c' : '#dc2626', color: '#fff', boxShadow: '0 2px 6px rgba(220,38,38,0.22)' },
    ghost: { background: hov ? '#f5f3ff' : 'transparent', color: '#6b7280' },
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ ...base, ...variants[variant] }}>
      {loading && <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: '_spin 0.7s linear infinite', flexShrink: 0 }} />}
      {children}
    </button>
  )
}

function Input({ error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <input
        {...props}
        onFocus={e => { setFocused(true); props.onFocus?.(e) }}
        onBlur={e => { setFocused(false); props.onBlur?.(e) }}
        style={{
          width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 13,
          border: `1.5px solid ${error ? '#f87171' : focused ? '#7c3aed' : '#e5e7eb'}`,
          boxShadow: focused ? '0 0 0 3px rgba(109,40,217,0.1)' : 'none',
          outline: 'none', background: '#fff', color: '#111827',
          fontFamily: '"DM Sans",sans-serif', transition: 'all 0.15s',
          boxSizing: 'border-box',
          ...props.style
        }}
      />
      {error && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>⚠ {error}</p>}
    </div>
  )
}

function Textarea({ error, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <textarea
        {...props}
        onFocus={e => { setFocused(true); props.onFocus?.(e) }}
        onBlur={e => { setFocused(false); props.onBlur?.(e) }}
        style={{
          width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 13,
          border: `1.5px solid ${error ? '#f87171' : focused ? '#7c3aed' : '#e5e7eb'}`,
          boxShadow: focused ? '0 0 0 3px rgba(109,40,217,0.1)' : 'none',
          outline: 'none', background: '#fff', color: '#111827',
          fontFamily: '"DM Sans",sans-serif', transition: 'all 0.15s',
          boxSizing: 'border-box', resize: 'vertical', minHeight: 80,
          ...props.style
        }}
      />
      {error && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>⚠ {error}</p>}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
export default function StudentsPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const { data: students = [], isLoading } = useStudents()
  const { data: classes = [] } = useClasses()
  const createStudent = useCreateStudent()
  const updateStudent = useUpdateStudent()
  const deleteStudent = useDeleteStudent()

  const [modalOpen, setModalOpen] = useState(false)
  const [viewModal, setViewModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState<any>(null)
  const [viewingStudent, setViewingStudent] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [filterGender, setFilterGender] = useState('')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [importLoading, setImportLoading] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  
  // New: Account Creation State
  const [accountModalOpen, setAccountModalOpen] = useState(false)
  const [accountStudent, setAccountStudent] = useState<any>(null)
  const [accountLoading, setAccountLoading] = useState(false)
  const [accountData, setAccountData] = useState({ email: '', password: '' })

  // New: Document Centre State
  const [activeTab, setActiveTab] = useState<'directory' | 'documents'>('directory')
  const [hrStudent, setHrStudent] = useState<any>(null)
  const [hrLetterType, setHrLetterType] = useState<StudentLetterTypeId | null>(null)
  const [hrFields, setHrFields] = useState<Record<string, string>>({})
  const { data: settings } = useSettings()

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const filtered = useMemo(() => students.filter(s => {
    const q = search.toLowerCase()
    const matchSearch = !q || s.full_name.toLowerCase().includes(q) || s.student_id?.toLowerCase().includes(q)
    const matchClass = !filterClass || s.class_id === filterClass
    const matchGender = !filterGender || s.gender === filterGender
    return matchSearch && matchClass && matchGender
  }), [students, search, filterClass, filterGender])

  function openCreate() { setEditingStudent(null); reset({}); setModalOpen(true) }
  function openEdit(s: any) {
    setEditingStudent(s)
    reset({ full_name: s.full_name, student_id: s.student_id ?? '', class_id: s.class_id ?? '', gender: s.gender ?? undefined, date_of_birth: s.date_of_birth ?? '', house: s.house ?? '', guardian_name: s.guardian_name ?? '', guardian_phone: s.guardian_phone ?? '', guardian_email: s.guardian_email ?? '', address: s.address ?? '' })
    setModalOpen(true)
  }

  const TAB_STYLE = (active: boolean): React.CSSProperties => ({
    padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', border: 'none', transition: 'all .15s', fontFamily: '"DM Sans",sans-serif',
    background: active ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : 'transparent',
    color: active ? '#fff' : '#6b7280',
    boxShadow: active ? '0 2px 8px rgba(109,40,217,.25)' : 'none',
  })

  async function onSubmit(data: FormData) {
    try {
      // Convert empty strings to null so Supabase accepts them
      const clean: any = {}
      Object.entries(data).forEach(([k, v]) => {
        clean[k] = (v === '' || v === undefined) ? null : v
      })
      const payload = { ...clean, school_id: user!.school_id, is_active: true }

      if (editingStudent) {
        const result = await supabase
          .from('students')
          .update(payload)
          .eq('id', editingStudent.id)
          .select()
          .single()
        if (result.error) throw result.error
        toast.success('Student updated')
        qc.invalidateQueries({ queryKey: ['students'] })
      } else {
        await createStudent.mutateAsync(payload)
      }
      setModalOpen(false)
      reset({})

    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to save student')
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remove "${name}"? This cannot be undone.`)) return
    await deleteStudent.mutateAsync(id)
  }

  function handlePrintDoc() {
    if (!hrStudent || !hrLetterType) {
      toast.error('Choose a student and document type first')
      return
    }
    const html = generateStudentDocHTML(hrLetterType, hrStudent, hrFields, settings?.school)
    const win = window.open('', '_blank', 'width=800,height=900')
    if (win) {
      win.document.write(html)
      win.document.close()
      setTimeout(() => win.print(), 500)
    }
  }

  async function handleCreateAccount() {
    if (!accountData.email || !accountData.password) {
      toast.error('Please enter both email and password')
      return
    }
    
    setAccountLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('admin-ops', {
        body: {
          action: 'create-user',
          payload: {
            email: accountData.email,
            password: accountData.password,
            full_name: accountStudent.full_name,
            role: 'student',
            target_school_id: user!.school_id,
            metadata: { link_id: accountStudent.id }
          }
        }
      })

      if (error) throw error
      if (data?.error) throw new Error(String(data.error))

      toast.success('Student account created successfully!')
      setAccountModalOpen(false)
      setAccountData({ email: '', password: '' })
      qc.invalidateQueries({ queryKey: ['students'] })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? (err.message || 'Failed to create student account') : 'Failed to create student account')
    } finally {
      setAccountLoading(false)
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setImportLoading(true)
    try {
      const wb = XLSX.read(await file.arrayBuffer())
      const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]])

      if (rows.length === 0) { toast.error('File is empty or has no data rows'); return }

      const data = rows
        .filter(r => {
          const name = (r['Full Name'] ?? r['full_name'] ?? '').toString().trim()
          return name.length > 1
        })
        .map(r => {
          const gender = (r['Gender'] ?? r['gender'] ?? '').toString().toLowerCase().trim()
          return {
            full_name:      (r['Full Name']      ?? r['full_name']      ?? '').toString().trim(),
            student_id:     (r['Student ID']     ?? r['student_id']     ?? '').toString().trim() || null,
            gender:         ['male','female'].includes(gender) ? gender : null,
            house:          (r['House']          ?? r['house']          ?? '').toString().trim() || null,
            guardian_name:  (r['Guardian Name']  ?? r['guardian_name']  ?? '').toString().trim() || null,
            guardian_phone: (r['Guardian Phone'] ?? r['guardian_phone'] ?? '').toString().trim() || null,
            guardian_email: (r['Guardian Email'] ?? r['guardian_email'] ?? '').toString().trim() || null,
            school_id: user!.school_id,
            is_active: true,
          }
        })

      if (data.length === 0) { toast.error('No valid students found in file'); return }

      // Insert in batches of 200
      const BATCH = 200
      let imported = 0
      for (let i = 0; i < data.length; i += BATCH) {
        const batch = data.slice(i, i + BATCH)
        const { error } = await studentsService.bulkUpsert(batch)
        if (error) throw new Error(`Batch ${Math.floor(i/BATCH)+1} failed: ${error.message}`)
        imported += batch.length
      }
      toast.success(`${imported} students imported successfully`)
    } catch (err: any) {
      toast.error(err?.message ?? 'Import failed')
    }
    finally { setImportLoading(false); if (fileRef.current) fileRef.current.value = '' }
  }

  const totalMale = students.filter(s => s.gender === 'male').length
  const totalFemale = students.filter(s => s.gender === 'female').length

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _spin { to{transform:rotate(360deg)} }
        @keyframes _fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes _fadeIn { from{opacity:0} to{opacity:1} }
        .std-row:hover { background:#faf5ff !important; }
        .std-card:hover { box-shadow:0 8px 28px rgba(109,40,217,0.13) !important; transform:translateY(-2px) !important; }
        .action-btn:hover { background:#f5f3ff !important; color:#6d28d9 !important; }
        .del-btn:hover { background:#fef2f2 !important; color:#dc2626 !important; }
      `}</style>

      <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif', animation: '_fadeIn 0.4s ease' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>Students</h1>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 3 }}>{students.length} enrolled students across {classes.length} classes</p>
          </div>
          {activeTab === 'directory' && (
            <div style={{ display: 'flex', gap: 10 }}>
              <input ref={fileRef} type="file" accept=".xlsx,.csv" style={{ display: 'none' }} onChange={handleImport} />
              <Btn variant="secondary" onClick={() => fileRef.current?.click()} loading={importLoading}>
                📥 Import Excel
              </Btn>
              <Btn onClick={openCreate}>➕ Add Student</Btn>
            </div>
          )}
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', gap: 4, background: '#f8f7ff', borderRadius: 13, padding: 5, marginBottom: 22, width: 'fit-content' }}>
          <button style={TAB_STYLE(activeTab === 'directory')} onClick={() => setActiveTab('directory')}>📋 Student Directory</button>
          <button style={TAB_STYLE(activeTab === 'documents')} onClick={() => setActiveTab('documents')}>📄 Student Documents</button>
        </div>

        {activeTab === 'directory' && (
          <>
            {/* ── Summary cards ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 22 }}>
              {[
                { label: 'Total Students', value: students.length, icon: '👥', color: '#6d28d9', bg: '#f5f3ff' },
                { label: 'Male Students', value: totalMale, icon: '👦', color: '#0891b2', bg: '#ecfeff' },
                { label: 'Female Students', value: totalFemale, icon: '👧', color: '#db2777', bg: '#fdf2f8' },
                { label: 'Classes', value: classes.length, icon: '🏫', color: '#16a34a', bg: '#f0fdf4' },
              ].map((s, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', border: '1.5px solid #f0eefe', boxShadow: '0 1px 4px rgba(109,40,217,0.06)', animation: `_fadeUp 0.4s ease ${i * 0.07}s both` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{s.icon}</div>
                  </div>
                  <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#111827', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* ── Filters bar ── */}
            <div style={{ background: '#fff', borderRadius: 14, padding: '14px 18px', border: '1.5px solid #f0eefe', marginBottom: 18, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
              {/* Search */}
              <div style={{ position: 'relative', flex: '1 1 220px' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 15, pointerEvents: 'none' }}>🔍</span>
                <input
                  placeholder="Search by name or ID…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  style={{
                    width: '100%', padding: '9px 12px 9px 36px', borderRadius: 9, fontSize: 13,
                    border: `1.5px solid ${searchFocused ? '#7c3aed' : '#e5e7eb'}`,
                    boxShadow: searchFocused ? '0 0 0 3px rgba(109,40,217,0.1)' : 'none',
                    outline: 'none', background: '#faf5ff', color: '#111827',
                    fontFamily: '"DM Sans",sans-serif', transition: 'all 0.15s',
                  }}
                />
              </div>

              {/* Class filter */}
              <StyledSelect value={filterClass} onChange={e => setFilterClass(e.target.value)} style={{ flex: '1 1 160px', maxWidth: 200 }}>
                <option value="">All Classes</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </StyledSelect>

              {/* Gender filter */}
              <StyledSelect value={filterGender} onChange={e => setFilterGender(e.target.value)} style={{ flex: '1 1 130px', maxWidth: 160 }}>
                <option value="">All Genders</option>
                <option value="male">♂ Male</option>
                <option value="female">♀ Female</option>
              </StyledSelect>

              {/* View toggle */}
              <div style={{ display: 'flex', background: '#f5f3ff', borderRadius: 9, padding: 3, gap: 2 }}>
                {(['table', 'grid'] as const).map(m => (
                  <button key={m} onClick={() => setViewMode(m)}
                    style={{ padding: '6px 12px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s', background: viewMode === m ? '#6d28d9' : 'transparent', color: viewMode === m ? '#fff' : '#6b7280' }}>
                    {m === 'table' ? '☰ Table' : '⊞ Grid'}
                  </button>
                ))}
              </div>

              {/* Results count */}
              <span style={{ fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap' }}>
                {filtered.length} result{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* ── Loading ── */}
            {isLoading && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #ede9fe', borderTopColor: '#6d28d9', animation: '_spin 0.8s linear infinite' }} />
                <p style={{ fontSize: 13, color: '#9ca3af' }}>Loading students…</p>
              </div>
            )}

            {/* ── Empty state ── */}
            {!isLoading && filtered.length === 0 && (
              <div style={{ background: '#fff', borderRadius: 16, padding: '60px 20px', textAlign: 'center', border: '1.5px solid #f0eefe' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎓</div>
                <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 6 }}>
                  {search || filterClass || filterGender ? 'No students found' : 'No students yet'}
                </h3>
                <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 18 }}>
                  {search || filterClass || filterGender ? 'Try adjusting your filters.' : 'Start by adding your first student.'}
                </p>
                {!search && !filterClass && !filterGender && <Btn onClick={openCreate}>➕ Add First Student</Btn>}
              </div>
            )}

            {/* ── TABLE VIEW ── */}
            {!isLoading && filtered.length > 0 && viewMode === 'table' && (
              <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', overflow: 'hidden', boxShadow: '0 1px 4px rgba(109,40,217,0.06)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'linear-gradient(135deg,#faf5ff,#f5f3ff)', borderBottom: '1.5px solid #ede9fe' }}>
                      {['Student', 'ID', 'Class', 'Gender', 'House', 'Guardian', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((s, i) => (
                      <tr key={s.id} className="std-row"
                        style={{ borderBottom: i < filtered.length - 1 ? '1px solid #faf5ff' : 'none', transition: 'background 0.12s', animation: `_fadeUp 0.3s ease ${i * 0.03}s both` }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Avatar name={s.full_name} size={34} />
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{s.full_name}</div>
                              {s.date_of_birth && <div style={{ fontSize: 11, color: '#9ca3af' }}>{formatDate(s.date_of_birth)}</div>}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: 12, fontFamily: 'monospace', background: '#f5f3ff', color: '#6d28d9', padding: '2px 7px', borderRadius: 5 }}>{s.student_id ?? '—'}</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: 12, fontWeight: 600, background: '#ede9fe', color: '#5b21b6', padding: '3px 9px', borderRadius: 99 }}>{(s as any).class?.name ?? 'Unassigned'}</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: 12, fontWeight: 600, background: s.gender === 'male' ? '#eff6ff' : s.gender === 'female' ? '#fdf2f8' : '#f3f4f6', color: s.gender === 'male' ? '#2563eb' : s.gender === 'female' ? '#db2777' : '#6b7280', padding: '3px 9px', borderRadius: 99 }}>
                            {s.gender === 'male' ? '♂ Male' : s.gender === 'female' ? '♀ Female' : '—'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280' }}>{s.house ?? '—'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{s.guardian_name ?? '—'}</div>
                          {s.guardian_phone && <div style={{ fontSize: 11, color: '#9ca3af' }}>{s.guardian_phone}</div>}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="action-btn" onClick={() => { setViewingStudent(s); setViewModal(true) }}
                              style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: '#f5f3ff', color: '#6d28d9', cursor: 'pointer', fontSize: 14, transition: 'all 0.15s' }} title="View Profile">👁️</button>
                            
                            {!s.user_id && (
                              <button className="action-btn" onClick={() => { setAccountStudent(s); setAccountData(prev => ({ ...prev, email: s.guardian_email || '' })); setAccountModalOpen(true) }}
                                style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: '#ecfdf5', color: '#059669', cursor: 'pointer', fontSize: 13, transition: 'all 0.15s' }} title="Create Portal Login">🔑</button>
                            )}
                            {s.user_id && (
                              <div style={{ width: 30, height: 30, borderRadius: 8, background: '#f0fdf4', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }} title="Account Linked">✅</div>
                            )}

                            <button className="action-btn" onClick={() => openEdit(s)}
                              style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: '#f5f3ff', color: '#6d28d9', cursor: 'pointer', fontSize: 14, transition: 'all 0.15s' }} title="Edit Details">✏️</button>
                            <button className="del-btn" onClick={() => handleDelete(s.id, s.full_name)}
                              style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: 14, transition: 'all 0.15s' }} title="Remove Student">🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── GRID VIEW ── */}
            {!isLoading && filtered.length > 0 && viewMode === 'grid' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16 }}>
                {filtered.map((s, i) => (
                  <div key={s.id} className="std-card"
                    style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', padding: '20px', boxShadow: '0 1px 4px rgba(109,40,217,0.07)', transition: 'all 0.2s', animation: `_fadeUp 0.35s ease ${i * 0.04}s both` }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                      <Avatar name={s.full_name} size={44} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.full_name}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{s.student_id ?? 'No ID'}</div>
                        <div style={{ marginTop: 5, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, background: '#ede9fe', color: '#5b21b6', padding: '2px 7px', borderRadius: 99 }}>{(s as any).class?.name ?? 'No class'}</span>
                          {s.gender && <span style={{ fontSize: 10, fontWeight: 700, background: s.gender === 'male' ? '#eff6ff' : '#fdf2f8', color: s.gender === 'male' ? '#2563eb' : '#db2777', padding: '2px 7px', borderRadius: 99 }}>{s.gender === 'male' ? '♂' : '♀'}</span>}
                        </div>
                      </div>
                    </div>
                    {s.guardian_name && <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 5 }}><span>👨‍👩‍👦</span>{s.guardian_name}</div>}
                    <div style={{ display: 'flex', gap: 6, borderTop: '1px solid #faf5ff', paddingTop: 12 }}>
                      <button onClick={() => { setViewingStudent(s); setViewModal(true) }}
                        style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', background: '#f5f3ff', color: '#6d28d9', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>View</button>
                      <button onClick={() => openEdit(s)}
                        style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', background: '#f5f3ff', color: '#6d28d9', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => handleDelete(s.id, s.full_name)}
                        style={{ width: 32, padding: '7px 0', borderRadius: 8, border: 'none', background: '#fef2f2', color: '#dc2626', fontSize: 13, cursor: 'pointer' }}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── DOCUMENTS CENTRE ── */}
        {activeTab === 'documents' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start', animation: '_tp_fu .4s ease' }}>
            {/* Left — Student & Letter picker */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', padding: '24px', boxShadow: '0 1px 3px rgba(109,40,217,0.05)' }}>
                <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#111827', margin: '0 0 10px' }}>📄 Student Documents Centre</h3>
                <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 20px', lineHeight: 1.6 }}>Select a student and a document type to generate official records.</p>
                
                <Field label="Search / Select Student">
                  <select 
                    value={hrStudent?.id ?? ''} 
                    onChange={e => {
                      const s = students.find(x => x.id === e.target.value)
                      setHrStudent(s ?? null)
                      setHrFields({ letterDate: new Date().toISOString().split('T')[0] })
                    }}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: 13, fontFamily: '"DM Sans",sans-serif', cursor: 'pointer', color: '#111827', background: '#fff' }}
                  >
                    <option value="">— Choose a student —</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.full_name} {s.student_id ? `(${s.student_id})` : ''}</option>)}
                  </select>
                </Field>

                {hrStudent && (
                  <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12, background: 'linear-gradient(135deg,#f5f3ff,#faf5ff)', borderRadius: 12, padding: '12px 16px', border: '1.5px solid #ede9fe' }}>
                    <Avatar name={hrStudent.full_name} size={42} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{hrStudent.full_name}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>
                        {(hrStudent as any).class?.name || 'No Class'} {hrStudent.student_id ? `· ${hrStudent.student_id}` : ''}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', padding: '24px', boxShadow: '0 1px 3px rgba(109,40,217,0.05)' }}>
                <h4 style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 16 }}>Choose Document Type</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 10 }}>
                  {STUDENT_LETTER_TYPES.map(lt => (
                    <div 
                      key={lt.id} 
                      onClick={() => {
                        setHrLetterType(lt.id)
                        setHrFields(prev => ({ ...prev, letterDate: prev.letterDate || new Date().toISOString().split('T')[0] }))
                      }}
                      style={{ 
                        border: '1.5px solid',
                        borderColor: hrLetterType === lt.id ? '#7c3aed' : '#f3f4f6',
                        borderRadius: 12, padding: '14px', cursor: 'pointer',
                        background: hrLetterType === lt.id ? '#f5f3ff' : '#fafafa',
                        transition: 'all 0.2s',
                        boxShadow: hrLetterType === lt.id ? '0 4px 12px rgba(109,40,217,0.1)' : 'none',
                        transform: hrLetterType === lt.id ? 'translateY(-2px)' : 'none',
                      }}
                    >
                      <div style={{ fontSize: 24, marginBottom: 8 }}>{lt.icon}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: hrLetterType === lt.id ? '#6d28d9' : '#111827' }}>{lt.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right — Form & Print */}
            <div style={{ position: 'sticky', top: 20 }}>
              <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', padding: '24px', boxShadow: '0 2px 10px rgba(109,40,217,0.08)' }}>
                {!hrLetterType ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
                    <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>✍️</div>
                    <p style={{ fontSize: 14, fontWeight: 500 }}>Select a document type<br/>to fill in the details</p>
                  </div>
                ) : (
                  <>
                    <h4 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#111827', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>{STUDENT_LETTER_TYPES.find(l => l.id === hrLetterType)?.icon}</span>
                      {STUDENT_LETTER_TYPES.find(l => l.id === hrLetterType)?.label}
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                      {STUDENT_LETTER_FIELDS[hrLetterType].map(f => (
                        <Field key={f.key} label={f.label}>
                          {f.type === 'date' ? (
                            <Input 
                              type="date" 
                              value={hrFields[f.key] ?? ''} 
                              onChange={e => setHrFields(prev => ({ ...prev, [f.key]: e.target.value }))}
                            />
                          ) : (f.key === 'incident' || f.key === 'reason' || f.key === 'strengths') ? (
                            <Textarea 
                              placeholder={f.placeholder}
                              value={hrFields[f.key] ?? ''}
                              onChange={(e: any) => setHrFields(prev => ({ ...prev, [f.key]: e.target.value }))}
                            />
                          ) : (
                            <Input 
                              placeholder={f.placeholder}
                              value={hrFields[f.key] ?? ''}
                              onChange={(e: any) => setHrFields(prev => ({ ...prev, [f.key]: e.target.value }))}
                            />
                          )}
                        </Field>
                      ))}
                    </div>
                    <Btn 
                      style={{ width: '100%', padding: '14px', borderRadius: 12, justifyContent: 'center', fontSize: 14 }}
                      onClick={handlePrintDoc}
                      disabled={!hrStudent}
                    >
                      🖨️ Print / Preview Document
                    </Btn>
                  </>
                )}
              </div>
            </div>
          </div>
        )}


        {/* ── ADD / EDIT MODAL ── */}
        <Modal open={modalOpen} onClose={() => setModalOpen(false)}
          title={editingStudent ? 'Edit Student' : 'Add New Student'}
          subtitle={editingStudent ? `Editing ${editingStudent.full_name}` : 'Fill in the student details below'}
          size="lg"
          footer={<>
            <Btn variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Btn>
            <Btn onClick={handleSubmit(onSubmit)} loading={isSubmitting}>{editingStudent ? 'Save Changes' : 'Add Student'}</Btn>
          </>}
        >
          <form id="student-form" onSubmit={handleSubmit(onSubmit)}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <Field label="Full Name *">
                  <StyledInput {...register('full_name')} placeholder="e.g. Kofi Mensah" error={errors.full_name?.message} />
                </Field>
              </div>
              <Field label="Student ID"><StyledInput {...register('student_id')} placeholder="e.g. STU-001" /></Field>
              <Field label="Class">
                <StyledSelect {...register('class_id')}>
                  <option value="">Select class…</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </StyledSelect>
              </Field>
              <Field label="Gender">
                <StyledSelect {...register('gender')}>
                  <option value="">Select gender…</option>
                  <option value="male">♂ Male</option>
                  <option value="female">♀ Female</option>
                </StyledSelect>
              </Field>
              <Field label="Date of Birth"><StyledInput {...register('date_of_birth')} type="date" /></Field>
              <Field label="House"><StyledInput {...register('house')} placeholder="e.g. Blue House" /></Field>
            </div>

            <div style={{ margin: '18px 0 14px', height: 1, background: '#f5f3ff' }} />
            <p style={{ fontSize: 12, fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>👨‍👩‍👦 Guardian Information</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Guardian Name"><StyledInput {...register('guardian_name')} placeholder="e.g. Mr. Kwame Mensah" /></Field>
              <Field label="Phone"><StyledInput {...register('guardian_phone')} placeholder="024 000 0000" /></Field>
              <div style={{ gridColumn: '1 / -1' }}>
                <Field label="Guardian Email"><StyledInput {...register('guardian_email')} type="email" placeholder="guardian@email.com" error={errors.guardian_email?.message} /></Field>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <Field label="Address"><StyledInput {...register('address')} placeholder="Student's home address" /></Field>
              </div>
            </div>
          </form>
        </Modal>

        {/* ── VIEW MODAL ── */}
        <Modal open={viewModal} onClose={() => setViewModal(false)} title="Student Profile" size="md">
          {viewingStudent && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', background: 'linear-gradient(135deg,#faf5ff,#f5f3ff)', borderRadius: 12, marginBottom: 18 }}>
                <Avatar name={viewingStudent.full_name} size={52} />
                <div>
                  <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>{viewingStudent.full_name}</h3>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{(viewingStudent as any).class?.name ?? 'No class assigned'}</div>
                  <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                    {viewingStudent.student_id && <span style={{ fontSize: 11, fontWeight: 700, background: '#ede9fe', color: '#5b21b6', padding: '2px 8px', borderRadius: 99 }}>{viewingStudent.student_id}</span>}
                    {viewingStudent.gender && <span style={{ fontSize: 11, fontWeight: 700, background: viewingStudent.gender === 'male' ? '#eff6ff' : '#fdf2f8', color: viewingStudent.gender === 'male' ? '#2563eb' : '#db2777', padding: '2px 8px', borderRadius: 99 }}>{viewingStudent.gender === 'male' ? '♂ Male' : '♀ Female'}</span>}
                    {viewingStudent.house && <span style={{ fontSize: 11, fontWeight: 700, background: '#f0fdf4', color: '#16a34a', padding: '2px 8px', borderRadius: 99 }}>🏠 {viewingStudent.house}</span>}
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Date of Birth', value: formatDate(viewingStudent.date_of_birth) },
                  { label: 'Enrolled', value: formatDate(viewingStudent.created_at) },
                  { label: 'Guardian', value: viewingStudent.guardian_name },
                  { label: 'Guardian Phone', value: viewingStudent.guardian_phone },
                  { label: 'Guardian Email', value: viewingStudent.guardian_email },
                  { label: 'Address', value: viewingStudent.address },
                ].map(({ label, value }) => value && (
                  <div key={label} style={{ background: '#faf5ff', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{value}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
                <Btn variant="secondary" style={{ flex: 1 }} onClick={() => { setViewModal(false); openEdit(viewingStudent) }}>✏️ Edit Student</Btn>
                <Btn variant="danger" onClick={() => { setViewModal(false); handleDelete(viewingStudent.id, viewingStudent.full_name) }}>🗑️ Remove</Btn>
              </div>
            </div>
          )}
        </Modal>

        {/* ── CREATE ACCOUNT MODAL ── */}
        <Modal open={accountModalOpen} onClose={() => setAccountModalOpen(false)} 
          title="Create Student Portal Login" 
          subtitle={`Set up a secure login for ${accountStudent?.full_name}`}
          footer={<>
            <Btn variant="secondary" onClick={() => setAccountModalOpen(false)}>Cancel</Btn>
            <Btn onClick={handleCreateAccount} loading={accountLoading}>Create Account</Btn>
          </>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: '12px 16px', background: '#fef3c7', borderRadius: 10, border: '1px solid #fde68a', color: '#92400e', fontSize: 13 }}>
              <strong>Note:</strong> This will create a permanent login for the student to access their grades and dashboard.
            </div>
            
            <Field label="Login Email">
              <StyledInput 
                type="email" 
                placeholder="student@school.com" 
                value={accountData.email}
                onChange={e => setAccountData(prev => ({ ...prev, email: e.target.value }))}
              />
            </Field>
            
            <Field label="Set Password">
              <div style={{ position: 'relative' }}>
                <StyledInput 
                  type="text" 
                  placeholder="Choose a password" 
                  value={accountData.password}
                  onChange={e => setAccountData(prev => ({ ...prev, password: e.target.value }))}
                />
                <button 
                  type="button"
                  onClick={() => setAccountData(prev => ({ ...prev, password: Math.random().toString(36).slice(-8) }))}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: '#ede9fe', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 700, color: '#6d28d9', cursor: 'pointer' }}
                >Generate</button>
              </div>
            </Field>
          </div>
        </Modal>
      </div>
    </>
  )
}