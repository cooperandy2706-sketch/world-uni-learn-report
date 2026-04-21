// src/pages/admin/TeachersPage.tsx
import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '../../lib/supabase'
import { useTeachers } from '../../hooks/useTeachers'
import { useClasses } from '../../hooks/useClasses'
import { useSubjects } from '../../hooks/useSubjects'
import { useCurrentTerm, useSettings } from '../../hooks/useSettings'
import { useAuth } from '../../hooks/useAuth'
import { teachersService } from '../../services/index'
import Modal from '../../components/ui/Modal'
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'

// ── Zod schema ────────────────────────────────────────────
const schema = z.object({
  full_name: z.string().min(2, 'Name required'),
  email: z.string().email('Valid email required'),
  password: z.string().min(6).optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  staff_id: z.string().optional().or(z.literal('')),
  qualification: z.string().optional().or(z.literal('')),
})
type TForm = z.infer<typeof schema>

// ── Letter types ──────────────────────────────────────────
const LETTER_TYPES = [
  { id: 'appointment', label: 'Appointment Letter', icon: '📋' },
  { id: 'confirmation', label: 'Confirmation of Appointment', icon: '✅' },
  { id: 'promotion', label: 'Promotion Letter', icon: '🚀' },
  { id: 'transfer', label: 'Transfer Letter', icon: '🔄' },
  { id: 'warning1', label: 'Warning Letter (1st)', icon: '⚠️' },
  { id: 'warningFinal', label: 'Warning Letter (Final)', icon: '🚨' },
  { id: 'dismissal', label: 'Dismissal Letter', icon: '🗑️' },
  { id: 'suspension', label: 'Suspension Letter', icon: '⏸️' },
  { id: 'reference', label: 'Reference Letter', icon: '📜' },
  { id: 'leaveApproval', label: 'Leave Approval Letter', icon: '🏖️' },
  { id: 'salaryIncrement', label: 'Salary Increment Notice', icon: '💰' },
  { id: 'returnFromLeave', label: 'Return from Leave Notice', icon: '🔙' },
  { id: 'commendation', label: 'Commendation Letter', icon: '🏆' },
  { id: 'termWithoutPay', label: 'Termination (No Pay)', icon: '🛑' },
  { id: 'resignApproval', label: 'Resignation Approval', icon: '👋' },
  { id: 'query', label: 'Query Letter', icon: '❓' },
  { id: 'discHearing', label: 'Disciplinary Invitation', icon: '⚖️' },
  { id: 'contractEnd', label: 'End of Contract', icon: '⌛' },
  { id: 'maternityLeave', label: 'Maternity Leave', icon: '🤰' },
  { id: 'recommendation', label: 'Recommendation', icon: '✨' },
  { id: 'bonusNotice', label: 'Bonus / Incentive', icon: '💸' },
  { id: 'salaryReview', label: 'Salary Review', icon: '📊' },
  { id: 'otherDoc', label: 'Other Document', icon: '📄' },
  { id: 'staffId', label: 'Staff ID Card (Printable)', icon: '🪪' },
] as const
type LetterTypeId = typeof LETTER_TYPES[number]['id']

// ── HR form fields per letter type ───────────────────────
const LETTER_FIELDS: Record<LetterTypeId, { key: string; label: string; type?: string; placeholder?: string }[]> = {
  appointment: [{ key: 'position', label: 'Position/Role', placeholder: 'e.g. Class Teacher' }, { key: 'salary', label: 'Monthly Salary (GHS)', placeholder: 'e.g. 2,500' }, { key: 'probation', label: 'Probation Period', placeholder: 'e.g. 3 months' }, { key: 'startDate', label: 'Start Date', type: 'date' }, { key: 'letterDate', label: 'Letter Date', type: 'date' }],
  confirmation: [{ key: 'position', label: 'Position/Role', placeholder: 'e.g. Class Teacher' }, { key: 'department', label: 'Department', placeholder: 'e.g. Junior High' }, { key: 'confirmedDate', label: 'Confirmation Date', type: 'date' }, { key: 'letterDate', label: 'Letter Date', type: 'date' }],
  promotion: [{ key: 'oldPosition', label: 'Previous Position', placeholder: 'e.g. Class Teacher' }, { key: 'newPosition', label: 'New Position', placeholder: 'e.g. Senior Teacher' }, { key: 'newSalary', label: 'New Salary (GHS)', placeholder: 'e.g. 3,200' }, { key: 'effectiveDate', label: 'Effective Date', type: 'date' }, { key: 'letterDate', label: 'Letter Date', type: 'date' }],
  transfer: [{ key: 'fromDept', label: 'From Department/School', placeholder: 'e.g. Primary School' }, { key: 'toDept', label: 'To Department/School', placeholder: 'e.g. JHS Block' }, { key: 'effectiveDate', label: 'Effective Date', type: 'date' }, { key: 'letterDate', label: 'Letter Date', type: 'date' }],
  warning1: [{ key: 'incident', label: 'Incident Description', placeholder: 'Describe the misconduct…' }, { key: 'deadline', label: 'Response Deadline', type: 'date' }, { key: 'letterDate', label: 'Letter Date', type: 'date' }],
  warningFinal: [{ key: 'incident', label: 'Incident Description', placeholder: 'Describe the misconduct…' }, { key: 'priorWarnings', label: 'Prior Warnings', placeholder: 'e.g. 1st Warning issued on …' }, { key: 'noticePeriod', label: 'Termination Notice Period', placeholder: 'e.g. 2 weeks' }, { key: 'letterDate', label: 'Letter Date', type: 'date' }],
  dismissal: [{ key: 'grounds', label: 'Grounds for Termination', placeholder: 'List the grounds…' }, { key: 'lastDay', label: 'Last Working Day', type: 'date' }, { key: 'letterDate', label: 'Letter Date', type: 'date' }],
  suspension: [{ key: 'reason', label: 'Reason for Suspension', placeholder: 'Describe the reason…' }, { key: 'fromDate', label: 'Suspension From', type: 'date' }, { key: 'toDate', label: 'Suspension To', type: 'date' }, { key: 'paid', label: 'Paid or Unpaid?', placeholder: 'e.g. Unpaid' }, { key: 'letterDate', label: 'Letter Date', type: 'date' }],
  reference: [{ key: 'institution', label: 'Requesting Institution', placeholder: 'e.g. University of Ghana' }, { key: 'duration', label: 'Duration of Service', placeholder: 'e.g. Jan 2019 – Dec 2023' }, { key: 'roles', label: 'Roles Held', placeholder: 'e.g. Class Teacher, HOD Science' }, { key: 'letterDate', label: 'Letter Date', type: 'date' }],
  leaveApproval: [{ key: 'leaveType', label: 'Leave Type', placeholder: 'e.g. Annual Leave' }, { key: 'fromDate', label: 'Leave From', type: 'date' }, { key: 'toDate', label: 'Leave To', type: 'date' }, { key: 'returnDate', label: 'Return Date', type: 'date' }, { key: 'letterDate', label: 'Letter Date', type: 'date' }],
  salaryIncrement: [{ key: 'oldSalary', label: 'Previous Salary (GHS)', placeholder: 'e.g. 2,500' }, { key: 'newSalary', label: 'New Salary (GHS)', placeholder: 'e.g. 2,800' }, { key: 'effectiveDate', label: 'Effective Date', type: 'date' }, { key: 'letterDate', label: 'Letter Date', type: 'date' }],
  returnFromLeave: [{ key: 'returnDate', label: 'Return Date', type: 'date' }, { key: 'leaveBalance', label: 'Remaining Leave Balance', placeholder: 'e.g. 5 days' }, { key: 'letterDate', label: 'Letter Date', type: 'date' }],
  commendation: [{ key: 'achievement', label: 'Achievement / Reason', placeholder: 'Describe the achievement…' }, { key: 'award', label: 'Award or Bonus (if any)', placeholder: 'e.g. GHS 500 bonus' }, { key: 'letterDate', label: 'Letter Date', type: 'date' }],
  termWithoutPay: [{ key: 'grounds', label: 'Grounds/Reason', placeholder: 'Gross misconduct, etc…' }, { key: 'incidentDate', label: 'Date of Incident', type: 'date' }, { key: 'lastDay', label: 'Last Working Day', type: 'date' }, { key: 'letterDate', label: 'Letter Date', type: 'date' }],
  resignApproval: [{ key: 'receivedDate', label: 'Resignation Received', type: 'date' }, { key: 'effectiveDate', label: 'Effective Date', type: 'date' }, { key: 'lastDay', label: 'Last Working Day', type: 'date' }, { key: 'handover', label: 'Handover Status', placeholder: 'e.g. Pending handover of keys' }, { key: 'letterDate', label: 'Letter Date', type: 'date' }],
  query: [{ key: 'incident', label: 'Incident Description', placeholder: 'State the misconduct clearly…' }, { key: 'incidentDate', label: 'Incident Date', type: 'date' }, { key: 'deadline', label: 'Response Deadline', type: 'date' }, { key: 'letterDate', label: 'Letter Date', type: 'date' }],
  discHearing: [{ key: 'charge', label: 'Nature of Charge', placeholder: 'e.g. Continuous absenteeism' }, { key: 'hearingDate', label: 'Hearing Date', type: 'date' }, { key: 'hearingTime', label: 'Hearing Time', placeholder: 'e.g. 10:00 AM' }, { key: 'venue', label: 'Venue', placeholder: 'e.g. Principal Office' }, { key: 'letterDate', label: 'Letter Date', type: 'date' }],
  contractEnd: [{ key: 'contractEndDate', label: 'Contract End Date', type: 'date' }, { key: 'handoverReqs', label: 'Handover Requirements', placeholder: 'e.g. Return books & keys' }, { key: 'letterDate', label: 'Letter Date', type: 'date' }],
  maternityLeave: [{ key: 'fromDate', label: 'Start Date', type: 'date' }, { key: 'toDate', label: 'Return Date', type: 'date' }, { key: 'terms', label: 'Salary Terms', placeholder: 'e.g. Full pay for 3 months' }, { key: 'letterDate', label: 'Letter Date', type: 'date' }],
  recommendation: [{ key: 'duration', label: 'Employment Period', placeholder: 'e.g. 2018–2023' }, { key: 'role', label: 'Last Position held', placeholder: 'e.g. Head of Science' }, { key: 'merits', label: 'Key Merits', placeholder: 'e.g. High exam pass rate…' }, { key: 'letterDate', label: 'Letter Date', type: 'date' }],
  bonusNotice: [{ key: 'reason', label: 'Reason for Award', placeholder: 'e.g. 100% attendance' }, { key: 'amount', label: 'Award Amount (GHS)', placeholder: 'e.g. 500' }, { key: 'effectiveDate', label: 'Payment Month', placeholder: 'e.g. May 2024' }, { key: 'letterDate', label: 'Letter Date', type: 'date' }],
  salaryReview: [{ key: 'oldSalary', label: 'Previous Basic', placeholder: 'e.g. 2,000' }, { key: 'newSalary', label: 'New Basic', placeholder: 'e.g. 2,400' }, { key: 'effectiveDate', label: 'Effective Date', type: 'date' }, { key: 'letterDate', label: 'Letter Date', type: 'date' }],
  otherDoc: [{ key: 'subject', label: 'Document Subject', placeholder: 'e.g. Internal Memo' }, { key: 'content', label: 'Main Body Text', placeholder: 'Type your message here…' }, { key: 'letterDate', label: 'Letter Date', type: 'date' }],
  staffId: [{ key: 'position', label: 'Position/Role', placeholder: 'e.g. Class Teacher' }, { key: 'department', label: 'Department', placeholder: 'e.g. Junior High' }, { key: 'idIssueDate', label: 'Issue Date', type: 'date' }],
}

// ── Letter HTML generators ────────────────────────────────
function formatDate(d: string) {
  if (!d) return '___________'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

// Generates a sequential reference number string
function letterRef(type: string) {
  const map: Record<string, string> = {
    appointment: 'APP', confirmation: 'CON', promotion: 'PRO', transfer: 'TRF',
    warning1: 'WRN', warningFinal: 'WRF', dismissal: 'DIS', suspension: 'SUS',
    reference: 'REF', leaveApproval: 'LEV', salaryIncrement: 'SAL',
    returnFromLeave: 'RTL', commendation: 'CMD', termWithoutPay: 'TWP',
    resignApproval: 'RSN', query: 'QRY', discHearing: 'DCH', contractEnd: 'END',
    maternityLeave: 'MAT', recommendation: 'REC', bonusNotice: 'BNS',
    salaryReview: 'SRV', otherDoc: 'OTH', staffId: 'SID',
  }
  const code = map[type] ?? 'HR'
  const year = new Date().getFullYear()
  const num = String(Math.floor(Math.random() * 900) + 100)
  return `HR/${code}/${year}/${num}`
}

// Crest SVG embedded inline for print (no external font needed for SVG shapes)
const CREST_SVG = `
  <svg width="56" height="56" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
    <circle cx="28" cy="28" r="26" fill="none" stroke="#c9983a" stroke-width="1.5"/>
    <polygon points="28,9 32.5,21.5 46,21.5 35,29 39,42 28,34 17,42 21,29 10,21.5 23.5,21.5"
      fill="none" stroke="#c9983a" stroke-width="1.3" stroke-linejoin="round"/>
    <circle cx="28" cy="28" r="4.5" fill="#c9983a" opacity="0.75"/>
  </svg>`

function letterHeader(school: any, teacher: any, letterDate: string, letterType = '') {
  const ref = letterRef(letterType)
  const sName = school?.name || 'School Name'
  const sAddr = school?.address || 'P.O. Box 000, Ghana'
  const sEmail = school?.email || ''
  const sPhone = school?.phone || ''
  const sMotto = school?.motto || 'Knowledge · Integrity · Excellence'

  const contactParts = [sAddr, sPhone, sEmail].filter(Boolean)

  return `
    <!-- ═══ LETTERHEAD ═══ -->
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

    <!-- ═══ META ROW ═══ -->
    <div class="lh-meta-row">
      <div class="lh-ref">Ref: <strong>${ref}</strong></div>
      <div class="lh-date">${formatDate(letterDate)}</div>
    </div>

    <!-- ═══ RECIPIENT ═══ -->
    <div class="lh-recipient">
      <strong>To:</strong>&nbsp; ${teacher?.user?.full_name || '___________'}<br/>
      <strong>Staff ID:</strong>&nbsp; ${teacher?.staff_id || '___________'}<br/>
      <strong>Email:</strong>&nbsp; ${teacher?.user?.email || '___________'}
    </div>
  `
}

function letterFooter(school: any) {
  const sName = school?.name || 'School Name'
  const sHead = school?.headteacher || 'Headteacher'
  return `
    <div class="lh-sig-block">
      <p class="lh-salutation">Yours faithfully,</p>
      <div class="lh-sig-line"></div>
      <p class="lh-sig-name">${sHead}</p>
      <p class="lh-sig-title">Headteacher / Principal &middot; ${sName}</p>
    </div>

    <div class="lh-footer">
      <span class="lh-footer-left">${sName.toUpperCase()} &middot; CONFIDENTIAL HR DOCUMENT</span>
      <span class="lh-footer-right">Page 1 of 1</span>
    </div>
  `
}

const LETTER_CSS = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Source+Sans+3:wght@400;500;600&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Source Sans 3', 'Georgia', sans-serif;
      font-size: 13.5px;
      color: #1a1a1a;
      line-height: 1.78;
      background: #fff;
      max-width: 760px;
      margin: 0 auto;
      padding: 0;
    }

    /* ── LETTERHEAD TOP BAND ── */
    .lh-top {
      background: #4c1d95;
      padding: 26px 44px 0;
    }
    .lh-logo-row {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .lh-crest {
      flex-shrink: 0;
      width: 56px;
      height: 56px;
    }
    .lh-school-name {
      font-family: 'Cormorant Garamond', 'Georgia', serif;
      font-size: 24px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: 0.02em;
      line-height: 1.15;
    }
    .lh-motto {
      font-size: 11px;
      color: #9dbfd8;
      font-style: italic;
      letter-spacing: 0.07em;
      margin-top: 3px;
    }
    .lh-contact-bar {
      display: flex;
      flex-wrap: wrap;
      margin-top: 18px;
      border-top: 0.5px solid rgba(157,191,216,0.3);
    }
    .lh-contact-item {
      font-size: 10.5px;
      color: #9dbfd8;
      padding: 5px 14px;
    }
    .lh-contact-item + .lh-contact-item {
      border-left: 0.5px solid rgba(157,191,216,0.25);
    }
    .lh-contact-item:first-child { padding-left: 0; }

    /* ── GOLD ACCENT BAR ── */
    .lh-gold-bar {
      height: 5px;
      background: linear-gradient(90deg, #b8832a 0%, #e6b84a 45%, #b8832a 100%);
    }

    /* ── LETTER BODY WRAPPER ── */
    .lh-body {
      padding: 28px 44px 36px;
    }

    /* ── META (ref + date) ── */
    .lh-meta-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 22px 44px 0;
      font-size: 12.5px;
      color: #555;
    }
    .lh-meta-row strong { color: #222; }
    .lh-date { font-weight: 500; color: #222; }

    /* ── RECIPIENT BLOCK ── */
    .lh-recipient {
      padding: 16px 44px 0;
      font-size: 13px;
      color: #222;
      line-height: 1.7;
    }

    /* ── SUBJECT LINE ── */
    h2.subject {
      font-family: 'Cormorant Garamond', 'Georgia', serif;
      font-size: 17px;
      font-weight: 700;
      color: #4c1d95;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin: 24px 0 18px;
      padding-bottom: 9px;
      border-bottom: 2px solid #4c1d95;
    }

    /* ── BODY COPY ── */
    p {
      margin: 0 0 14px;
      font-size: 13.5px;
      line-height: 1.78;
    }

    table.salary-table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 13px;
    }
    table.salary-table th {
      background: #f5f3ff;
      color: #4c1d95;
      padding: 9px 14px;
      text-align: left;
      border: 1px solid #ddd6fe;
      font-weight: 600;
    }
    table.salary-table td {
      padding: 9px 14px;
      border: 1px solid #e5e7eb;
    }
    table.salary-table td.highlight {
      font-weight: 600;
      color: #15803d;
    }

    /* ── INCIDENT / HIGHLIGHT BOXES ── */
    .incident-box {
      background: #fff8e1;
      border-left: 3.5px solid #e6a817;
      padding: 10px 16px;
      border-radius: 0 4px 4px 0;
      margin: 12px 0 18px;
      font-size: 13px;
      color: #3d2c00;
    }
    .incident-box.danger {
      background: #fff1f2;
      border-left-color: #dc2626;
      color: #450000;
    }
    .incident-box.success {
      background: #f0fdf4;
      border-left-color: #16a34a;
      color: #052e16;
    }

    /* ── SIGNATURE ── */
    .lh-sig-block {
      margin: 48px 44px 0;
    }
    .lh-salutation {
      font-size: 13.5px;
      color: #222;
      margin-bottom: 38px;
    }
    .lh-sig-line {
      width: 200px;
      border-top: 1px solid #333;
      margin-bottom: 8px;
    }
    .lh-sig-name {
      font-size: 14px;
      font-weight: 600;
      color: #4c1d95;
      margin-bottom: 2px;
    }
    .lh-sig-title {
      font-size: 12px;
      color: #666;
      margin-bottom: 0;
    }

    /* ── FOOTER BAND ── */
    .lh-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f4f2ec;
      border-top: 0.5px solid #ddd8cc;
      padding: 9px 44px;
      margin-top: 40px;
    }
    .lh-footer-left {
      font-size: 9.5px;
      color: #888;
      letter-spacing: 0.05em;
    }
    .lh-footer-right {
      font-size: 10px;
      color: #bbb;
    }

    /* ── ID CARD ── */
    .id-card-page {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .id-card {
      width: 340px;
      border: 2.5px solid #4c1d95;
      border-radius: 14px;
      overflow: hidden;
      font-family: 'Source Sans 3', sans-serif;
    }
    .id-card-header {
      background: #4c1d95;
      padding: 16px 20px 12px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .id-card-school {
      font-family: 'Cormorant Garamond', serif;
      font-size: 15px;
      font-weight: 700;
      color: #fff;
      line-height: 1.2;
    }
    .id-card-gold { height: 4px; background: linear-gradient(90deg,#b8832a,#e6b84a,#b8832a); }
    .id-card-body {
      background: #fff;
      padding: 24px 20px 20px;
      text-align: center;
    }
    .id-card-avatar {
      width: 84px;
      height: 84px;
      border-radius: 50%;
      background: #ede9fe;
      border: 3px solid #4c1d95;
      margin: 0 auto 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 34px;
      font-weight: 700;
      color: #4c1d95;
    }
    .id-card-name { font-size: 18px; font-weight: 600; color: #4c1d95; }
    .id-card-role { font-size: 13px; color: #555; margin: 3px 0 12px; }
    .id-card-badge {
      display: inline-block;
      font-size: 13px;
      font-weight: 600;
      color: #4c1d95;
      background: #f5f3ff;
      border: 1px solid #ddd6fe;
      padding: 4px 18px;
      border-radius: 99px;
      letter-spacing: 0.04em;
    }
    .id-card-footer {
      border-top: 0.5px solid #e5e7eb;
      padding: 8px 20px;
      text-align: center;
      font-size: 10.5px;
      color: #999;
    }

    /* ── PRINT OVERRIDES ── */
    @page {
      margin: 15mm 18mm;
      size: A4;
    }
    @media print {
      body { max-width: 100%; }
      .lh-top { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .lh-gold-bar { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .lh-footer { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .id-card-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .id-card-gold { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .incident-box { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      table.salary-table th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
`

function generateLetterHTML(type: LetterTypeId, teacher: any, fields: Record<string, string>, school: any): string {
  const t = teacher
  const f = fields
  const fn = t?.user?.full_name || '___________'
  const sName = school?.name || 'the school'

  const wrapHTML = (bodyContent: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${LETTER_TYPES.find(l => l.id === type)?.label || 'HR Letter'} — ${fn}</title>
  ${LETTER_CSS}
</head>
<body>
  ${bodyContent}
</body>
</html>`

  // Shared body wrapper — all letters except staffId use this
  const body = (subject: string, content: string) => `
    ${letterHeader(school, t, f.letterDate, type)}
    <div class="lh-body">
      <h2 class="subject">${subject}</h2>
      ${content}
      ${letterFooter(school)}
    </div>
  `

  switch (type) {
    case 'appointment': return wrapHTML(body('Letter of Appointment', `
      <p>Dear ${fn},</p>
      <p>We are pleased to appoint you to the position of <strong>${f.position || '___________'}</strong> at ${sName}, effective <strong>${formatDate(f.startDate)}</strong>.</p>
      <p>Your monthly salary will be <strong>GHS ${f.salary || '___________'}</strong>. You will be on probation for a period of <strong>${f.probation || '___________'}</strong>, after which your appointment will be confirmed subject to satisfactory performance.</p>
      <p>You are required to adhere to all school policies, rules, and regulations. We look forward to your contributions to our school community.</p>
      <p>Please sign and return a copy of this letter to confirm your acceptance of these terms.</p>
    `))

    case 'confirmation': return wrapHTML(body('Confirmation of Appointment', `
      <p>Dear ${fn},</p>
      <p>We are pleased to inform you that following a satisfactory review of your probationary period, your appointment as <strong>${f.position || '___________'}</strong> in the <strong>${f.department || '___________'}</strong> department has been confirmed effective <strong>${formatDate(f.confirmedDate)}</strong>.</p>
      <p>This confirmation is subject to continued satisfactory performance and adherence to the school's policies and code of conduct.</p>
      <p>We congratulate you on this milestone and look forward to your continued contribution to ${sName}.</p>
    `))

    case 'promotion': return wrapHTML(body('Letter of Promotion', `
      <p>Dear ${fn},</p>
      <p>We are delighted to inform you of your promotion from <strong>${f.oldPosition || '___________'}</strong> to <strong>${f.newPosition || '___________'}</strong>, effective <strong>${formatDate(f.effectiveDate)}</strong>.</p>
      <p>Your new monthly salary will be <strong>GHS ${f.newSalary || '___________'}</strong>. This promotion is in recognition of your dedication, hard work, and outstanding performance.</p>
      <p>We trust that you will continue to demonstrate the same level of commitment in your new role and inspire those around you.</p>
    `))

    case 'transfer': return wrapHTML(body('Transfer Letter', `
      <p>Dear ${fn},</p>
      <p>This is to inform you that management has decided to transfer you from <strong>${f.fromDept || '___________'}</strong> to <strong>${f.toDept || '___________'}</strong>, effective <strong>${formatDate(f.effectiveDate)}</strong>.</p>
      <p>You are required to hand over all responsibilities, records, and materials in your care before the transfer date and report to your new station promptly.</p>
      <p>We appreciate your understanding and cooperation in this matter.</p>
    `))

    case 'warning1': return wrapHTML(body('First Warning Letter', `
      <p>Dear ${fn},</p>
      <p>This letter serves as a <strong>formal first warning</strong> regarding the following matter:</p>
      <div class="incident-box">${f.incident || '___________'}</div>
      <p>Your behaviour/conduct is in breach of the school's code of conduct and is considered unacceptable. You are required to provide a written response to this warning by <strong>${formatDate(f.deadline)}</strong>.</p>
      <p>Please note that failure to improve may result in further disciplinary action, up to and including termination of employment. We trust this matter will be taken seriously.</p>
    `))

    case 'warningFinal': return wrapHTML(body('Final Warning Letter', `
      <p>Dear ${fn},</p>
      <p>This letter constitutes a <strong>final warning</strong>. Despite previous warnings — ${f.priorWarnings || '___________'} — the following conduct has recurred:</p>
      <div class="incident-box danger">${f.incident || '___________'}</div>
      <p>You are hereby advised that any further breach will result in the <strong>termination of your employment</strong> with a notice period of <strong>${f.noticePeriod || '___________'}</strong>.</p>
      <p>This letter is being placed in your personnel file for the record.</p>
    `))

    case 'dismissal': return wrapHTML(body('Letter of Dismissal', `
      <p>Dear ${fn},</p>
      <p>It is with regret that we inform you that your employment with ${sName} is hereby <strong>terminated</strong> on the grounds of:</p>
      <div class="incident-box danger">${f.grounds || '___________'}</div>
      <p>Your last working day will be <strong>${formatDate(f.lastDay)}</strong>. You are required to return all school property — including keys, documents, and equipment — on or before this date.</p>
      <p>Please note that you are entitled to receive your outstanding salary and benefits as per your contract and applicable labour law.</p>
    `))

    case 'suspension': return wrapHTML(body('Suspension Letter', `
      <p>Dear ${fn},</p>
      <p>This is to inform you that you are hereby <strong>suspended</strong> from your duties for the following reason:</p>
      <div class="incident-box">${f.reason || '___________'}</div>
      <p>Your suspension will be effective from <strong>${formatDate(f.fromDate)}</strong> to <strong>${formatDate(f.toDate)}</strong>. This suspension is <strong>${f.paid || '___________'}</strong>.</p>
      <p>During this period you are required to remain available for further investigation. You will be notified of the outcome and next steps in writing.</p>
    `))

    case 'reference': return wrapHTML(body('Reference Letter', `
      <p>To Whom It May Concern,</p>
      <p>This is to confirm that <strong>${fn}</strong> (Staff ID: ${t?.staff_id || '—'}) was employed at ${sName} from <strong>${f.duration || '___________'}</strong>.</p>
      <p>During this period, ${fn.split(' ')[0]} served in the following roles: <strong>${f.roles || '___________'}</strong>.</p>
      <p>We found ${fn.split(' ')[0]} to be a dedicated, professional, and hardworking member of staff who demonstrated strong interpersonal skills and maintained excellent relationships with students, parents, and colleagues.</p>
      <p>We recommend ${fn.split(' ')[0]} without hesitation to ${f.institution || '___________'} and wish them every success in their future endeavours.</p>
    `))

    case 'leaveApproval': return wrapHTML(body('Leave Approval Letter', `
      <p>Dear ${fn},</p>
      <p>Your application for <strong>${f.leaveType || '___________'}</strong> has been reviewed and <strong>approved</strong>.</p>
      <div class="incident-box success">
        Leave period: <strong>${formatDate(f.fromDate)}</strong> to <strong>${formatDate(f.toDate)}</strong><br/>
        Expected return date: <strong>${formatDate(f.returnDate)}</strong>
      </div>
      <p>You are required to ensure that your duties are properly delegated before the commencement of your leave. Please report to work promptly on your return date.</p>
    `))

    case 'salaryIncrement': return wrapHTML(body('Salary Increment Notice', `
      <p>Dear ${fn},</p>
      <p>We are pleased to inform you that management has approved a salary increment effective <strong>${formatDate(f.effectiveDate)}</strong>.</p>
      <table class="salary-table">
        <tr><th>Previous Monthly Salary</th><th>New Monthly Salary</th></tr>
        <tr><td>GHS ${f.oldSalary || '___________'}</td><td class="highlight">GHS ${f.newSalary || '___________'}</td></tr>
      </table>
      <p>This increment is a reflection of your continued dedication and hard work. We encourage you to maintain the same high standard of performance.</p>
    `))

    case 'returnFromLeave': return wrapHTML(body('Return from Leave Notice', `
      <p>Dear ${fn},</p>
      <p>This is to remind you that your approved leave period is coming to an end. You are expected to resume duties on <strong>${formatDate(f.returnDate)}</strong>.</p>
      <p>Your remaining leave balance after this period will be <strong>${f.leaveBalance || '___________'}</strong>.</p>
      <p>Please ensure you report to your supervisor upon resumption. We look forward to welcoming you back.</p>
    `))

    case 'commendation': return wrapHTML(body('Commendation Letter', `
      <p>Dear ${fn},</p>
      <p>On behalf of the management and entire staff of ${sName}, we write to express our sincere appreciation and commendation for the following:</p>
      <div class="incident-box success">${f.achievement || '___________'}</div>
      ${f.award ? `<p>In recognition of this achievement, you are hereby awarded: <strong>${f.award}</strong>.</p>` : ''}
      <p>Your dedication and excellence set a fine example for all staff and students. We encourage you to continue upholding the highest standards of professionalism.</p>
    `))

    case 'termWithoutPay': return wrapHTML(body('Termination of Employment (Without Pay)', `
      <p>Dear ${fn},</p>
      <p>We regret to inform you that your employment with ${sName} is hereby <strong>terminated</strong> effective <strong>${formatDate(f.lastDay)}</strong> on the grounds of:</p>
      <div class="incident-box danger">${f.grounds || '___________'}</div>
      <p>Specifically, our records show that on <strong>${formatDate(f.incidentDate)}</strong>, you engaged in a major breach of contract/conduct that warrants immediate dismissal without notice pay.</p>
      <p>You are required to hand over all school property in your possession immediately. Any outstanding benefits accrued prior to this incident will be processed according to the relevant labor laws.</p>
    `))

    case 'resignApproval': return wrapHTML(body('Approval of Resignation', `
      <p>Dear ${fn},</p>
      <p>We acknowledge receipt of your resignation letter dated <strong>${formatDate(f.receivedDate)}</strong>. We write to formally <strong>accept and approve</strong> your resignation as <strong>${t?.position || 'staff member'}</strong>.</p>
      <p>Your effective date of departure will be <strong>${formatDate(f.effectiveDate)}</strong>, with your last working day being <strong>${formatDate(f.lastDay)}</strong>.</p>
      <p>Regarding your handover status: <strong>${f.handover || 'In progress'}</strong>. We appreciate your years of service and dedication to the students of ${sName} and wish you the very best in your future endeavors.</p>
    `))

    case 'query': return wrapHTML(body('Formal Query', `
      <p>Dear ${fn},</p>
      <p>It has been brought to the attention of management that the following incident occurred on <strong>${formatDate(f.incidentDate)}</strong>:</p>
      <div class="incident-box">${f.incident || '___________'}</div>
      <p>This behavior is considered a breach of the school's professional standards. You are hereby requested to provide a written explanation (query response) as to why disciplinary action should not be taken against you.</p>
      <p>Your response must reach the office by <strong>${formatDate(f.deadline)}</strong>. Failure to respond within this timeframe will be interpreted as an admission of fault.</p>
    `))

    case 'discHearing': return wrapHTML(body('Notice of Disciplinary Hearing', `
      <p>Dear ${fn},</p>
      <p>Following your recent response to the query issued on the matter of <strong>${f.charge || 'conduct'}</strong>, management has decided to constitute a disciplinary committee to look into the matter.</p>
      <p>You are therefore invited to attend a disciplinary hearing scheduled as follows:</p>
      <div class="incident-box">
        📅 Date: <strong>${formatDate(f.hearingDate)}</strong><br/>
        ⏰ Time: <strong>${f.hearingTime || '___________'}</strong><br/>
        📍 Venue: <strong>${f.venue || '___________'}</strong>
      </div>
      <p>You are entitled to bring a witness or representative to this hearing. Please be punctual.</p>
    `))

    case 'contractEnd': return wrapHTML(body('Notice of End of Contract', `
      <p>Dear ${fn},</p>
      <p>We write to remind you that your current fixed-term contract with ${sName} is scheduled to expire on <strong>${formatDate(f.contractEndDate)}</strong>.</p>
      <p>Management has decided not to renew the contract at this time. Consequently, your employment will conclude on the aforementioned date.</p>
      <p>You are requested to fulfill the following handover requirements: <strong>${f.handoverReqs || 'Return all property'}</strong>. We thank you for your service to the school.</p>
    `))

    case 'maternityLeave': return wrapHTML(body('Approval of Maternity Leave', `
      <p>Dear ${fn},</p>
      <p>We are pleased to approve your request for maternity leave. Your leave period is scheduled as follows:</p>
      <div class="incident-box success">
        📅 Commencement: <strong>${formatDate(f.fromDate)}</strong><br/>
        🔙 Resumption: <strong>${formatDate(f.toDate)}</strong>
      </div>
      <p>The terms of your leave will be: <strong>${f.terms || 'As per policy'}</strong>. We wish you a safe delivery and a restful time with your newborn. Please keep the school informed of any changes to your expected return date.</p>
    `))

    case 'recommendation': return wrapHTML(body('Letter of Recommendation', `
      <p>To Whom It May Concern,</p>
      <p>It is my pleasure to recommend <strong>${fn}</strong>, who served at ${sName} from <strong>${f.duration || '___________'}</strong> as <strong>${f.role || 'a teacher'}</strong>.</p>
      <p>${fn.split(' ')[0]} is an exceptional professional who made significant contributions to our school, particularly in the areas of: <strong>${f.merits || 'teaching and student development'}</strong>.</p>
      <p>I have consistently been impressed by ${fn.split(' ')[0]}'s dedication, classroom management, and ability to inspire students to achieve their full potential. Any institution will be fortunate to have ${fn.split(' ')[0]} as part of their team.</p>
    `))

    case 'bonusNotice': return wrapHTML(body('Notice of Performance Bonus', `
      <p>Dear ${fn},</p>
      <p>We are pleased to award you a performance bonus in recognition of your exceptional work regarding: <strong>${f.reason || '___________'}</strong>.</p>
      <p>You will receive a one-time award of <strong>GHS ${f.amount || '0.00'}</strong>, which will be included in your <strong>${f.effectiveDate || 'next'}</strong> salary payment.</p>
      <p>We appreciate your hard work and commitment to excellence at ${sName}. Keep up the great work!</p>
    `))

    case 'salaryReview': return wrapHTML(body('Salary Review Notification', `
      <p>Dear ${fn},</p>
      <p>Following a recent performance review/management decision, we are pleased to inform you that your basic salary has been adjusted effective <strong>${formatDate(f.effectiveDate)}</strong>.</p>
      <table class="salary-table">
        <tr><th>Current Basic</th><th>New Basic</th></tr>
        <tr><td>GHS ${f.oldSalary || '___________'}</td><td class="highlight">GHS ${f.newSalary || '___________'}</td></tr>
      </table>
      <p>All other terms of your employment remain unchanged. We hope this adjustment motivates you to continue delivering high-quality service.</p>
    `))

    case 'otherDoc': return wrapHTML(body(f.subject || 'Internal Document', `
      <p>Dear ${fn},</p>
      <div style="white-space: pre-wrap; margin-top: 15px; line-height: 1.8;">${f.content || '...'}</div>
    `))

    case 'staffId': return wrapHTML(`
      <div class="id-card-page">
        <div class="id-card">
          <div class="id-card-header">
            ${school?.logo_url ? `<img src="${school.logo_url}" alt="Logo" style="width: 42px; height: 42px; object-fit: contain; border-radius: 50%; background: #ffffff; padding: 3px;" />` : CREST_SVG.replace('width="56" height="56"', 'width="42" height="42"')}
            <div class="id-card-school">${sName}</div>
          </div>
          <div class="id-card-gold"></div>
          <div class="id-card-body">
            <div class="id-card-avatar">${(fn).charAt(0).toUpperCase()}</div>
            <div class="id-card-name">${fn}</div>
            <div class="id-card-role">${f.position || '___________'} &middot; ${f.department || '___________'}</div>
            <div class="id-card-badge">${t?.staff_id || 'ID: ___________'}</div>
          </div>
          <div class="id-card-footer">Issued: ${formatDate(f.idIssueDate)}</div>
        </div>
      </div>
    `)

    default: return wrapHTML('<p style="padding:40px">Letter type not found.</p>')
  }
}

// ── CSV helpers ───────────────────────────────────────────
function downloadCSV(filename: string, rows: string[][]) {
  const content = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([content], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

// ── Sub-components ────────────────────────────────────────
function Avatar({ name, size = 48 }: { name: string; size?: number }) {
  const colors = ['#6d28d9', '#0891b2', '#16a34a', '#d97706', '#dc2626', '#0f766e']
  const c = colors[(name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % colors.length]
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(135deg,${c},${c}99)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * .38, fontWeight: 900, color: '#fff', boxShadow: `0 3px 10px ${c}40`
    }}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

function Btn({ children, onClick, variant = 'primary', disabled, loading, style }: any) {
  const [hov, setHov] = useState(false)
  const v: any = {
    primary: { background: hov ? '#5b21b6' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', border: 'none', boxShadow: '0 2px 8px rgba(109,40,217,.28)' },
    secondary: { background: hov ? '#f5f3ff' : '#fff', color: '#374151', border: '1.5px solid #e5e7eb' },
    danger: { background: hov ? '#b91c1c' : '#dc2626', color: '#fff', border: 'none' },
    success: { background: hov ? '#15803d' : '#16a34a', color: '#fff', border: 'none' },
    ghost: { background: hov ? '#f5f3ff' : 'transparent', color: '#6b7280', border: 'none' },
    outline: { background: 'transparent', color: '#6d28d9', border: '1.5px solid #c4b5fd' },
  }
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all .15s', opacity: disabled ? 0.6 : 1, fontFamily: '"DM Sans",sans-serif', ...v[variant], ...style }}>
      {loading && <span style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', animation: '_tp_spin .7s linear infinite', flexShrink: 0 }} />}
      {children}
    </button>
  )
}

function Field({ label, children }: any) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  )
}

function Input({ error, ...props }: any) {
  const [f, setF] = useState(false)
  return (
    <div>
      <input {...props} onFocus={e => { setF(true); props.onFocus?.(e) }} onBlur={e => { setF(false); props.onBlur?.(e) }}
        style={{ width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 13, border: `1.5px solid ${error ? '#f87171' : f ? '#7c3aed' : '#e5e7eb'}`, outline: 'none', background: '#fff', color: '#111827', fontFamily: '"DM Sans",sans-serif', boxSizing: 'border-box' }} />
      {error && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>⚠ {error}</p>}
    </div>
  )
}

function Textarea({ value, onChange, placeholder, rows = 4 }: any) {
  return (
    <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      style={{ width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 13, border: '1.5px solid #e5e7eb', outline: 'none', background: '#fff', color: '#111827', fontFamily: '"DM Sans",sans-serif', boxSizing: 'border-box', resize: 'vertical' }} />
  )
}

// ══════════════════════════════════════════════════════════
//  MAIN PAGE
// ══════════════════════════════════════════════════════════
export default function TeachersPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const { data: teachers = [], isLoading } = useTeachers()
  const { data: classes = [] } = useClasses()
  const { data: subjects = [] } = useSubjects()
  const { data: term } = useCurrentTerm()
  const { data: settings } = useSettings?.() ?? { data: null }

  // ── School info for letters ──
  const school = {
    name: settings?.school?.name || user?.school?.name || 'School Name',
    address: settings?.school?.address || user?.school?.address || '',
    email: settings?.school?.email || user?.school?.email || '',
    phone: settings?.school?.phone || user?.school?.phone || '',
    motto: settings?.school?.motto || user?.school?.motto || 'Knowledge · Integrity · Excellence',
    headteacher: settings?.school?.headteacher_name || 'Headteacher',
    logo_url: (settings as any)?.school?.logo_url || (user?.school as any)?.logo_url || '',
  }

  const [loadMap, setLoadMap] = useState<Record<string, { classes: number; subjects: number }>>({})
  useEffect(() => {
    if (!teachers || teachers.length === 0) return
    
    const teacherIds = teachers.map((t: any) => t.id)
    supabase.from('teacher_assignments')
      .select('teacher_id,class_id,subject_id')
      .in('teacher_id', teacherIds)
      .then(({ data }) => {
        if (!data) return
        const m: Record<string, { classes: Set<string>; subjects: Set<string> }> = {}
        for (const a of data) {
          if (!m[a.teacher_id]) m[a.teacher_id] = { classes: new Set(), subjects: new Set() }
          m[a.teacher_id].classes.add(a.class_id)
          m[a.teacher_id].subjects.add(a.subject_id)
        }
        const out: Record<string, { classes: number; subjects: number }> = {}
        for (const [k, v] of Object.entries(m)) out[k] = { classes: v.classes.size, subjects: v.subjects.size }
        setLoadMap(out)
      })
  }, [teachers])

  // ── Tabs ──
  const [activeTab, setActiveTab] = useState<'directory' | 'hr' | 'bulk'>('directory')

  // ── Directory state ──
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [unassignedOnly, setUnassignedOnly] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'joined' | 'classes'>('name')

  // ── HR Documents state ──
  const [hrTeacher, setHrTeacher] = useState<any>(null)
  const [hrLetterType, setHrLetterType] = useState<LetterTypeId | ''>('')
  const [hrFields, setHrFields] = useState<Record<string, string>>({})

  const { data: lettersHistory, isLoading: loadingLetters } = useQuery({
    queryKey: ['lettersHistory', hrTeacher?.id],
    queryFn: async () => {
      if (!hrTeacher) return []
      const { data, error } = await teachersService.getLetters(hrTeacher.id)
      if (error) throw error
      return data
    },
    enabled: !!hrTeacher,
  })

  const saveLetterMut = useMutation({
    mutationFn: async (html: string) => {
      if (!hrTeacher || !hrLetterType) throw new Error('Missing teacher or type')
      return teachersService.saveLetter({
        school_id: user?.school_id,
        teacher_id: hrTeacher.id,
        type: hrLetterType,
        html_content: html,
        created_by: user?.id,
      })
    },
    onSuccess: () => {
      toast.success('Letter saved to history!')
      qc.invalidateQueries({ queryKey: ['lettersHistory', hrTeacher?.id] })
    },
    onError: (err: any) => {
      toast.error('Failed to save letter: ' + err.message)
    }
  })

  // ── SMS sheet state ──
  const [smsTarget, setSmsTarget] = useState<any>(null)
  const [smsText, setSmsText] = useState('')
  const [sendingSms, setSendingSms] = useState(false)

  // ── Bulk SMS state ──
  const [bulkSmsText, setBulkSmsText] = useState('')
  const [sendingBulk, setSendingBulk] = useState(false)

  // ── Modals / panels ──
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<any>(null)
  const [viewingTeacher, setViewingTeacher] = useState<any>(null)
  const [viewModal, setViewModal] = useState(false)
  const [assignModal, setAssignModal] = useState(false)
  const [assigningTeacher, setAssigningTeacher] = useState<any>(null)
  const [assignments, setAssignments] = useState<any[]>([])
  const [newClassIds, setNewClassIds] = useState<string[]>([])
  const [newSubjectIds, setNewSubjectIds] = useState<string[]>([])
  const [classTeacherClassIds, setClassTeacherClassIds] = useState<string[]>([])
  const [resetModal, setResetModal] = useState(false)
  const [resetTeacher, setResetTeacher] = useState<any>(null)
  const [newPassword, setNewPassword] = useState('')
  const [resetting, setResetting] = useState(false)
  const [removeModal, setRemoveModal] = useState(false)
  const [removingTeacher, setRemovingTeacher] = useState<any>(null)
  const [removingAssignments, setRemovingAssignments] = useState<any[]>([])
  const [replacementTeacherId, setReplacementTeacherId] = useState('')
  const [removing, setRemoving] = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<TForm>({ resolver: zodResolver(schema) as any })

  // ── Computed stats ──
  const totalStaff = (teachers as any[]).length
  const activeCount = (teachers as any[]).filter((t: any) => t.user?.is_active !== false).length
  const unassignedCount = (teachers as any[]).filter((t: any) => !loadMap[t.id] || loadMap[t.id].classes === 0).length
  const classTeacherCount = (teachers as any[]).filter((t: any) => (loadMap[t.id]?.classes ?? 0) > 0).length
  const subjectsCovered = new Set((teachers as any[]).flatMap((t: any) => [])).size  // placeholder — actual needs join

  // ── Filter & sort ──
  const filtered = (teachers as any[])
    .filter(t => {
      if (statusFilter === 'active' && t.user?.is_active === false) return false
      if (statusFilter === 'inactive' && t.user?.is_active !== false) return false
      if (unassignedOnly && (loadMap[t.id]?.classes ?? 0) > 0) return false
      if (search) {
        const q = search.toLowerCase()
        return t.user?.full_name?.toLowerCase().includes(q) ||
          t.user?.email?.toLowerCase().includes(q) ||
          t.staff_id?.toLowerCase().includes(q)
      }
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'name') return (a.user?.full_name ?? '').localeCompare(b.user?.full_name ?? '')
      if (sortBy === 'joined') return new Date(b.user?.created_at ?? 0).getTime() - new Date(a.user?.created_at ?? 0).getTime()
      if (sortBy === 'classes') return (loadMap[b.id]?.classes ?? 0) - (loadMap[a.id]?.classes ?? 0)
      return 0
    })

  // ── Form handlers ──
  function openCreate() { setEditingTeacher(null); reset({}); setModalOpen(true) }
  function openEdit(t: any) {
    setEditingTeacher(t)
    reset({ full_name: t.user?.full_name ?? '', email: t.user?.email ?? '', phone: t.user?.phone ?? '', staff_id: t.staff_id ?? '', qualification: t.qualification ?? '', password: '' })
    setModalOpen(true)
  }

  async function onSubmit(data: TForm) {
    try {
      if (editingTeacher) {
        await supabase.from('users').update({ full_name: data.full_name, phone: data.phone || null }).eq('id', editingTeacher.user_id)
        await supabase.from('teachers').update({ staff_id: data.staff_id || null, qualification: data.qualification || null }).eq('id', editingTeacher.id)
        toast.success('Teacher updated')
        qc.invalidateQueries({ queryKey: ['teachers'] })
      } else {
        const pw = data.password || 'teacher123'
        const { data: res, error } = await supabase.functions.invoke('admin-ops', {
          body: { action: 'create-user', payload: { email: data.email, password: pw, full_name: data.full_name, role: 'teacher', target_school_id: user!.school_id, phone: data.phone || null, metadata: { staff_id: data.staff_id || null, qualification: data.qualification || null } } }
        })
        if (error) throw new Error(error.message || 'Server error occurred')
        if (res?.error) throw new Error(res.error)
        toast.success(`✅ Created · ${data.email} · Password: ${pw}`, { duration: 8000 })
        qc.invalidateQueries({ queryKey: ['teachers'] })
      }
      setModalOpen(false); reset({})
    } catch (e: any) { toast.error(e.message ?? 'Failed') }
  }

  // ── SMS ──
  async function sendSMS(phone: string, message: string) {
    try {
      const { error } = await supabase.functions.invoke('send-sms', { body: { recipient: phone, message } })
      if (error) throw error
      toast.success('SMS sent!')
    } catch {
      toast.error('SMS service unavailable — message not sent')
    }
  }

  async function handleSendSms() {
    if (!smsText.trim()) { toast.error('Message is empty'); return }
    setSendingSms(true)
    await sendSMS(smsTarget?.user?.phone || '', smsText)
    setSendingSms(false)
    setSmsText(''); setSmsTarget(null)
  }

  async function handleBulkSms() {
    if (!bulkSmsText.trim()) { toast.error('Message is empty'); return }
    setSendingBulk(true)
    const active = (teachers as any[]).filter(t => t.user?.is_active !== false && t.user?.phone)
    for (const t of active) {
      await sendSMS(t.user.phone, bulkSmsText)
    }
    setSendingBulk(false)
    toast.success(`SMS sent to ${active.length} teachers`)
    setBulkSmsText('')
  }

  // ── Remove / reactivate ──
  async function openRemoveModal(t: any) {
    setRemovingTeacher(t); setReplacementTeacherId('')
    const { data } = await supabase.from('teacher_assignments').select('*, class:classes(id,name), subject:subjects(id,name), term:terms(id,name)').eq('teacher_id', t.id)
    setRemovingAssignments(data ?? [])
    setRemoveModal(true)
  }

  async function handleReassignAndDeactivate() {
    if (!removingTeacher) return
    const hasAssignments = removingAssignments.length > 0
    if (hasAssignments && !replacementTeacherId) { toast.error('Please select a replacement teacher'); return }
    setRemoving(true)
    try {
      if (hasAssignments && replacementTeacherId) {
        await supabase.from('teacher_assignments').update({ teacher_id: replacementTeacherId }).eq('teacher_id', removingTeacher.id)
        await supabase.from('classes').update({ class_teacher_id: replacementTeacherId }).eq('class_teacher_id', removingTeacher.id)
      }
      await supabase.from('users').update({ is_active: false }).eq('id', removingTeacher.user_id)
      qc.invalidateQueries({ queryKey: ['teachers'] })
      toast.success(`${removingTeacher.user?.full_name} deactivated${hasAssignments ? ' and classes reassigned' : ''}`)
      setRemoveModal(false); setRemovingTeacher(null)
    } catch (e: any) { toast.error(e.message ?? 'Failed') }
    setRemoving(false)
  }

  async function handleReactivate(t: any) {
    await supabase.from('users').update({ is_active: true }).eq('id', t.user_id)
    qc.invalidateQueries({ queryKey: ['teachers'] })
    toast.success(`${t.user?.full_name} reactivated`)
  }

  // ── Assign ──
  async function openAssign(t: any) {
    setAssigningTeacher(t)
    const { data } = await supabase.from('teacher_assignments').select('*, class:classes(id,name), subject:subjects(id,name), term:terms(id,name)').eq('teacher_id', t.id).order('class(name)')
    setAssignments(data ?? [])
    setAssignModal(true)
  }

  async function addAssignment() {
    if (newClassIds.length === 0 || newSubjectIds.length === 0 || !term?.id) { toast.error('Select at least one class and subject'); return }
    const inserts: any[] = []
    newClassIds.forEach(cId => newSubjectIds.forEach(subId => inserts.push({ 
      teacher_id: assigningTeacher.id, 
      class_id: cId, 
      subject_id: subId, 
      term_id: (term as any).id, 
      academic_year_id: (term as any).academic_year_id, 
      is_class_teacher: classTeacherClassIds.includes(cId)
    })))
    // Sync logic: When assigning as Class Teacher, clear any previous markers for these classes in this term
    if (classTeacherClassIds.length > 0) {
      await supabase.from('teacher_assignments')
        .update({ is_class_teacher: false })
        .in('class_id', classTeacherClassIds)
        .eq('term_id', term.id)
    }

    const { error } = await supabase.from('teacher_assignments').insert(inserts)
    if (error) {
      if (error.message.includes('unique constraint') || error.code === '23505') toast.error('One or more subjects already assigned!')
      else toast.error(error.message)
      return
    }

    // Update classes table
    if (classTeacherClassIds.length > 0) {
      const { error: clsErr } = await supabase.from('classes')
        .update({ class_teacher_id: assigningTeacher.id })
        .in('id', classTeacherClassIds)
      if (clsErr) console.error('Failed to update class_teacher_id:', clsErr)
    }

    toast.success(`${inserts.length} assignment(s) added`)
    setNewClassIds([]); setNewSubjectIds([]); setClassTeacherClassIds([])
    const { data } = await supabase.from('teacher_assignments').select('*, class:classes(id,name), subject:subjects(id,name), term:terms(id,name)').eq('teacher_id', assigningTeacher.id).order('class(name)')
    setAssignments(data ?? [])
  }

  async function removeAssignment(id: string) {
    const toRemove = assignments.find(a => a.id === id)
    await supabase.from('teacher_assignments').delete().eq('id', id)
    
    if (toRemove?.is_class_teacher) {
      // Check if any other assignments for this class still mark this teacher as CT
      const remainingCT = assignments.filter(a => a.class_id === toRemove.class_id && a.is_class_teacher && a.id !== id)
      if (remainingCT.length === 0) {
        await supabase.from('classes').update({ class_teacher_id: null }).eq('id', toRemove.class_id).eq('class_teacher_id', assigningTeacher.id)
      }
    }

    setAssignments(prev => prev.filter(a => a.id !== id))
    toast.success('Removed')
  }

  async function toggleCT(a: any) {
    const newStatus = !a.is_class_teacher
    try {
      if (newStatus) {
        // Clearing any other teacher as CT for this class
        await supabase.from('teacher_assignments')
          .update({ is_class_teacher: false })
          .eq('class_id', a.class_id)
          .eq('term_id', a.term_id)
        
        // Setting THIS teacher's records for this class as CT
        await supabase.from('teacher_assignments')
          .update({ is_class_teacher: true })
          .eq('teacher_id', a.teacher_id)
          .eq('class_id', a.class_id)
          .eq('term_id', a.term_id)

        await supabase.from('classes').update({ class_teacher_id: a.teacher_id }).eq('id', a.class_id)
      } else {
        await supabase.from('teacher_assignments')
          .update({ is_class_teacher: false })
          .eq('teacher_id', a.teacher_id)
          .eq('class_id', a.class_id)
          .eq('term_id', a.term_id)
        
        await supabase.from('classes').update({ class_teacher_id: null }).eq('id', a.class_id).eq('class_teacher_id', a.teacher_id)
      }
      
      const { data } = await supabase.from('teacher_assignments').select('*, class:classes(id,name), subject:subjects(id,name), term:terms(id,name)').eq('teacher_id', assigningTeacher.id).order('class(name)')
      setAssignments(data ?? [])
      toast.success(newStatus ? 'Assigned as Class Teacher' : 'Removed Class Teacher status')
    } catch (e: any) {
      toast.error(e.message || 'Update failed')
    }
  }

  // ── View ──
  async function openView(t: any) {
    setViewingTeacher(t); setViewModal(true)
    const [{ data: assign }, { data: goals }] = await Promise.all([
      supabase.from('teacher_assignments').select('*, class:classes(id,name), subject:subjects(id,name), term:terms(id,name)').eq('teacher_id', t.id).order('class(name)'),
      supabase.from('weekly_goals').select('*, class:classes(name), subject:subjects(name)').eq('teacher_id', t.id).order('week_number', { ascending: false }).limit(8),
    ])
    setViewingTeacher((prev: any) => ({ ...prev, _assignments: assign ?? [], _goals: goals ?? [] }))
  }

  function handlePrint() {
    if (!hrLetterType) return
    const html = getLetterHTML(hrLetterType)
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
    }
  }

  function handleSaveLetter() {
    if (!hrLetterType) return
    const html = generateLetterHTML(hrLetterType, hrTeacher, hrFields, school)
    saveLetterMut.mutate(html)
  }

  function openHistoricalLetter(l: any) {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(l.html_content)
      printWindow.document.close()
    }
  }

  // ── Reset password ──
  async function handleResetPassword() {
    if (!newPassword || newPassword.length < 6) { toast.error('Min 6 characters'); return }
    setResetting(true)
    const { data, error } = await supabase.functions.invoke('admin-ops', { body: { action: 'reset-password', payload: { target_user_id: resetTeacher.user_id, password: newPassword } } })
    setResetting(false)
    if (error) { toast.error(error.message); return }
    if (data?.error) { toast.error(data.error); return }
    toast.success(`Password reset for ${resetTeacher.user?.full_name}`)
    setResetModal(false); setNewPassword('')
  }

  // ── HR print ──
  function handlePrint() {
    if (!hrTeacher) { toast.error('Select a teacher'); return }
    if (!hrLetterType) { toast.error('Select a letter type'); return }
    const html = generateLetterHTML(hrLetterType, hrTeacher, hrFields, school)
    const w = window.open('', '_blank')
    if (!w) { toast.error('Popup blocked — allow popups and try again'); return }
    w.document.write(html)
    w.document.close()
    setTimeout(() => w.print(), 500)
  }

  // ── Export helpers ──
  function exportStaffCSV() {
    const rows = [['Name', 'Email', 'Phone', 'Staff ID', 'Qualification', 'Status', 'Classes', 'Subjects', 'Joined']]
      ; (teachers as any[]).forEach(t => rows.push([
        t.user?.full_name ?? '', t.user?.email ?? '', t.user?.phone ?? '', t.staff_id ?? '', t.qualification ?? '',
        t.user?.is_active !== false ? 'Active' : 'Inactive',
        String(loadMap[t.id]?.classes ?? 0), String(loadMap[t.id]?.subjects ?? 0),
        t.user?.created_at ? new Date(t.user.created_at).toLocaleDateString('en-GB') : ''
      ]))
    downloadCSV('staff-list.csv', rows)
  }

  // ── Group by class ──
  function groupByClass(asgs: any[]) {
    const map: Record<string, any> = {}
    for (const a of asgs) {
      const k = a.class?.id
      if (!map[k]) map[k] = { class: a.class, subjects: [], term: a.term }
      map[k].subjects.push(a.subject?.name)
    }
    return Object.values(map)
  }

  // ─────────────────────────────────────────────────────────
  const TAB_STYLE = (active: boolean): React.CSSProperties => ({
    padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', border: 'none', transition: 'all .15s', fontFamily: '"DM Sans",sans-serif',
    background: active ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : 'transparent',
    color: active ? '#fff' : '#6b7280',
    boxShadow: active ? '0 2px 8px rgba(109,40,217,.25)' : 'none',
  })

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _tp_spin{to{transform:rotate(360deg)}}
        @keyframes _tp_fi{from{opacity:0}to{opacity:1}}
        @keyframes _tp_fu{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .tp-card:hover{box-shadow:0 8px 28px rgba(109,40,217,.13) !important;transform:translateY(-2px)}
        .tp-card{transition:all .2s}
        .tp-act:hover{background:#ede9fe !important}
        .tp-act{transition:background .12s}
        .lt-card:hover{border-color:#7c3aed !important;background:#faf5ff !important}
        .lt-card{transition:all .15s;cursor:pointer}
        .lt-card.selected{border-color:#7c3aed !important;background:#f5f3ff !important;box-shadow:0 0 0 3px rgba(109,40,217,.12)}
        @media print{.no-print{display:none!important}}
      `}</style>

      <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif', animation: '_tp_fi .4s ease' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>Teachers</h1>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 3 }}>{totalStaff} staff members · {activeCount} active</p>
          </div>
          <Btn onClick={openCreate}>➕ Add Teacher</Btn>
        </div>

        {/* ── Stats ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 12, marginBottom: 20 }}>
          {[
            { icon: '👨‍🏫', label: 'Total Staff', value: totalStaff, color: '#6d28d9', bg: '#f5f3ff' },
            { icon: '✅', label: 'Active', value: activeCount, color: '#16a34a', bg: '#f0fdf4' },
            { icon: '⚠️', label: 'Unassigned', value: unassignedCount, color: '#d97706', bg: '#fffbeb' },
            { icon: '🏫', label: 'Class Teachers', value: classTeacherCount, color: '#0891b2', bg: '#eff6ff' },
            { icon: '📗', label: 'Subjects', value: Object.values(loadMap).reduce((s, v) => s + v.subjects, 0) || '—', color: '#6d28d9', bg: '#faf5ff' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', border: '1.5px solid #f0eefe', boxShadow: '0 1px 4px rgba(109,40,217,.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{s.icon}</div>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.06em', lineHeight: 1.2 }}>{s.label}</span>
              </div>
              <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', gap: 4, background: '#f8f7ff', borderRadius: 13, padding: 5, marginBottom: 20, width: 'fit-content' }}>
          <button style={TAB_STYLE(activeTab === 'directory')} onClick={() => setActiveTab('directory')}>📋 Staff Directory</button>
          <button style={TAB_STYLE(activeTab === 'hr')} onClick={() => setActiveTab('hr')}>📄 HR Documents</button>
          <button style={TAB_STYLE(activeTab === 'bulk')} onClick={() => setActiveTab('bulk')}>⚡ Bulk Actions</button>
        </div>

        {/* ══════════════════════════════════════════════════════
            TAB 1 — STAFF DIRECTORY
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'directory' && (
          <>
            {/* Filter bar */}
            <div style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', border: '1.5px solid #f0eefe', marginBottom: 18, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Search */}
              <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14 }}>🔍</span>
                <input placeholder="Search name, email or staff ID…" value={search} onChange={e => setSearch(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: 9, fontSize: 13, border: '1.5px solid #e5e7eb', outline: 'none', background: '#faf5ff', fontFamily: '"DM Sans",sans-serif', boxSizing: 'border-box' }} />
              </div>

              {/* Status toggle */}
              <div style={{ display: 'flex', gap: 4, background: '#f3f4f6', borderRadius: 8, padding: 3 }}>
                {(['all', 'active', 'inactive'] as const).map(s => (
                  <button key={s} onClick={() => setStatusFilter(s)}
                    style={{ padding: '5px 12px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .12s', fontFamily: '"DM Sans",sans-serif', background: statusFilter === s ? '#7c3aed' : 'transparent', color: statusFilter === s ? '#fff' : '#6b7280' }}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>

              {/* Unassigned toggle */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', userSelect: 'none' }}>
                <input type="checkbox" checked={unassignedOnly} onChange={e => setUnassignedOnly(e.target.checked)} />
                Unassigned only
              </label>

              {/* Sort */}
              <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
                style={{ padding: '7px 10px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 12, fontFamily: '"DM Sans",sans-serif', cursor: 'pointer', color: '#374151', background: '#fff' }}>
                <option value="name">Sort: Name A–Z</option>
                <option value="joined">Sort: Date Joined</option>
                <option value="classes">Sort: # Classes</option>
              </select>

              {/* Export */}
              <Btn variant="outline" onClick={exportStaffCSV} style={{ padding: '7px 12px', fontSize: 12 }}>⬇️ Export CSV</Btn>
            </div>

            {isLoading && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #ede9fe', borderTopColor: '#6d28d9', animation: '_tp_spin .8s linear infinite' }} />
              </div>
            )}

            {!isLoading && filtered.length === 0 && (
              <div style={{ background: '#fff', borderRadius: 16, padding: '60px 20px', textAlign: 'center', border: '1.5px solid #f0eefe' }}>
                <div style={{ fontSize: 52, marginBottom: 12 }}>👨‍🏫</div>
                <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 6 }}>
                  {search || statusFilter !== 'all' || unassignedOnly ? 'No teachers match your filters' : 'No teachers yet'}
                </h3>
                {!search && statusFilter === 'all' && !unassignedOnly && <Btn onClick={openCreate} style={{ marginTop: 10 }}>➕ Add First Teacher</Btn>}
              </div>
            )}

            {!isLoading && filtered.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
                {(filtered as any[]).map((t, i) => {
                  const load = loadMap[t.id]
                  return (
                    <div key={t.id} className="tp-card"
                      style={{ background: '#fff', borderRadius: 18, border: '1.5px solid #f0eefe', padding: '20px', boxShadow: '0 1px 4px rgba(109,40,217,.07)', position: 'relative', overflow: 'hidden', animation: `_tp_fu .35s ease ${i * .04}s both` }}>

                      <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)', pointerEvents: 'none' }} />

                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 12, position: 'relative' }}>
                        <Avatar name={t.user?.full_name ?? '?'} size={52} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.user?.full_name}</div>
                          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.user?.email}</div>
                          <div style={{ marginTop: 5, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {t.staff_id && <span style={{ fontSize: 10, fontWeight: 700, background: '#f5f3ff', color: '#6d28d9', padding: '2px 7px', borderRadius: 99, border: '1px solid #ede9fe' }}>{t.staff_id}</span>}
                            {t.qualification && <span style={{ fontSize: 10, fontWeight: 600, background: '#f0fdf4', color: '#16a34a', padding: '2px 7px', borderRadius: 99 }}>🎓 {t.qualification}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Teaching load badge */}
                      {load && (
                        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                          <span style={{ fontSize: 11, background: '#eff6ff', color: '#1d4ed8', padding: '3px 9px', borderRadius: 99, fontWeight: 600 }}>🏫 {load.classes} {load.classes === 1 ? 'class' : 'classes'}</span>
                          <span style={{ fontSize: 11, background: '#f5f3ff', color: '#6d28d9', padding: '3px 9px', borderRadius: 99, fontWeight: 600 }}>📗 {load.subjects} {load.subjects === 1 ? 'subject' : 'subjects'}</span>
                        </div>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
                        {t.user?.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#faf5ff', borderRadius: 8, fontSize: 12, color: '#374151' }}>
                            <span>📱</span>{t.user.phone}
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#faf5ff', borderRadius: 8, fontSize: 12, color: '#374151' }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.user?.is_active !== false ? '#16a34a' : '#9ca3af', flexShrink: 0, display: 'block' }} />
                          {t.user?.is_active !== false ? 'Active' : 'Inactive'}
                          {t.user?.created_at && <span style={{ color: '#9ca3af', marginLeft: 'auto', fontSize: 11 }}>Since {new Date(t.user.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span>}
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, borderTop: '1px solid #faf5ff', paddingTop: 12 }}>
                        <button className="tp-act" onClick={() => openView(t)} style={{ padding: '8px 0', borderRadius: 8, border: 'none', background: '#f5f3ff', color: '#6d28d9', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>👁️ View</button>
                        <button className="tp-act" onClick={() => openAssign(t)} style={{ padding: '8px 0', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>📚 Assign</button>
                        <button className="tp-act" onClick={() => openEdit(t)} style={{ padding: '8px 0', borderRadius: 8, border: 'none', background: '#f5f3ff', color: '#6d28d9', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>✏️ Edit</button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginTop: 6 }}>
                        <button onClick={() => { setResetTeacher(t); setResetModal(true); setNewPassword('') }}
                          style={{ padding: '7px 0', borderRadius: 8, border: '1px solid #ddd6fe', background: 'transparent', color: '#6d28d9', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: '"DM Sans",sans-serif' }}>🔑 Password</button>
                        {/* SMS button */}
                        <button onClick={() => { setSmsTarget(t); setSmsText('') }}
                          style={{ padding: '7px 0', borderRadius: 8, border: '1px solid #a7f3d0', background: 'transparent', color: '#059669', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: '"DM Sans",sans-serif' }}>📱 SMS</button>
                        {t.user?.is_active !== false
                          ? <button onClick={() => openRemoveModal(t)} style={{ padding: '7px 0', borderRadius: 8, border: '1px solid #fecaca', background: 'transparent', color: '#ef4444', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: '"DM Sans",sans-serif' }}>🗑️ Remove</button>
                          : <button onClick={() => handleReactivate(t)} style={{ padding: '7px 0', borderRadius: 8, border: '1px solid #bbf7d0', background: 'transparent', color: '#16a34a', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: '"DM Sans",sans-serif' }}>✅ Restore</button>
                        }
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB 2 — HR DOCUMENTS CENTRE
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'hr' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>

            {/* Left — Letter picker */}
            <div>
              <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', padding: '20px', marginBottom: 16 }}>
                <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#111827', margin: '0 0 14px' }}>📄 HR Documents Centre</h3>
                <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 18px', lineHeight: 1.6 }}>Select a teacher and a letter type, fill in the details, then click <strong>Print / Preview</strong> to generate a clean printable document — no downloads, no backends.</p>

                {/* Teacher select */}
                <Field label="Select Teacher">
                  <select value={hrTeacher?.id ?? ''} onChange={e => { const t = (teachers as any[]).find(x => x.id === e.target.value); setHrTeacher(t ?? null); setHrFields({}) }}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: 13, fontFamily: '"DM Sans",sans-serif', cursor: 'pointer', color: '#111827', background: '#fff' }}>
                    <option value="">— Choose a staff member —</option>
                    {(teachers as any[]).map(t => <option key={t.id} value={t.id}>{t.user?.full_name} {t.staff_id ? `(${t.staff_id})` : ''}</option>)}
                  </select>
                </Field>

                {hrTeacher && (
                  <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10, background: '#f5f3ff', borderRadius: 10, padding: '10px 14px' }}>
                    <Avatar name={hrTeacher.user?.full_name ?? '?'} size={38} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{hrTeacher.user?.full_name}</div>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>{hrTeacher.user?.email} {hrTeacher.staff_id ? `· ${hrTeacher.staff_id}` : ''}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Letter type grid */}
              <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', padding: '20px' }}>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14 }}>Choose Letter Type</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: 8 }}>
                  {LETTER_TYPES.map(lt => (
                    <div key={lt.id} className={`lt-card ${hrLetterType === lt.id ? 'selected' : ''}`}
                      onClick={() => { setHrLetterType(lt.id as LetterTypeId); setHrFields({}) }}
                      style={{ border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '12px', background: '#fafafa' }}>
                      <div style={{ fontSize: 20, marginBottom: 6 }}>{lt.icon}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', lineHeight: 1.3 }}>{lt.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right — Form + Print */}
            <div style={{ position: 'sticky', top: 20 }}>
              <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', padding: '20px' }}>
                {!hrLetterType
                  ? <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>📝</div>
                    <p style={{ fontSize: 13 }}>Select a letter type to continue</p>
                  </div>
                  : <>
                    <h4 style={{ fontFamily: '"Playfair Display",serif', fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>
                      {LETTER_TYPES.find(l => l.id === hrLetterType)?.icon} {LETTER_TYPES.find(l => l.id === hrLetterType)?.label}
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                      {LETTER_FIELDS[hrLetterType].map(field => (
                        <Field key={field.key} label={field.label}>
                          {field.type === 'date'
                            ? <input type="date" value={hrFields[field.key] ?? ''} onChange={e => setHrFields(p => ({ ...p, [field.key]: e.target.value }))}
                              style={{ width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 13, border: '1.5px solid #e5e7eb', outline: 'none', fontFamily: '"DM Sans",sans-serif', color: '#111827', boxSizing: 'border-box' }} />
                            : field.key === 'incident' || field.key === 'grounds' || field.key === 'reason' || field.key === 'achievement'
                              ? <Textarea value={hrFields[field.key] ?? ''} onChange={(e: any) => setHrFields(p => ({ ...p, [field.key]: e.target.value }))} placeholder={field.placeholder} rows={3} />
                              : <Input value={hrFields[field.key] ?? ''} onChange={(e: any) => setHrFields(p => ({ ...p, [field.key]: e.target.value }))} placeholder={field.placeholder} />
                          }
                        </Field>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <Btn onClick={handlePrint} style={{ flex: 1, justifyContent: 'center' }}>🖨️ Print / Preview</Btn>
                      <Btn variant="secondary" onClick={handleSaveLetter} disabled={saveLetterMut.isPending} loading={saveLetterMut.isPending} style={{ flex: 1, justifyContent: 'center' }}>💾 Save to History</Btn>
                    </div>
                    <p style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', marginTop: 8 }}>Opens a print-ready preview in a new tab. Save to History for tracking.</p>
                  </>
                }
              </div>

              {hrTeacher && (
                <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', padding: '20px', marginTop: 16 }}>
                  <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 14px' }}>📜 Letter History</h3>
                  {loadingLetters ? <p style={{ fontSize: 13, color: '#9ca3af' }}>Loading history...</p> :
                   (!lettersHistory || lettersHistory.length === 0) ? <p style={{ fontSize: 13, color: '#9ca3af' }}>No saved letters found.</p> :
                   <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                     {lettersHistory.map(l => (
                       <div key={l.id} style={{ padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafafa' }}>
                         <div>
                           <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{LETTER_TYPES.find(x => x.id === l.type)?.label || l.type}</div>
                           <div style={{ fontSize: 11, color: '#6b7280' }}>
                             {new Date(l.created_at).toLocaleDateString()} · By {l.author?.full_name || 'System'}
                           </div>
                         </div>
                         <Btn variant="outline" onClick={() => openHistoricalLetter(l)} style={{ padding: '6px 12px', fontSize: 11 }}>View</Btn>
                       </div>
                     ))}
                   </div>
                  }
                </div>
              )}

              {/* School info reminder */}
              <div style={{ marginTop: 12, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '12px 14px', fontSize: 12, color: '#92400e' }}>
                📌 Letters use school name, headteacher name, and address from your <strong>Settings</strong>. Keep those up to date for accurate letterheads.
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB 3 — BULK ACTIONS
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'bulk' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 18 }}>

            {/* Bulk SMS */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', padding: '20px' }}>
              <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 17, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>📱 Send SMS to All Active Teachers</h3>
              <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 14px' }}>
                {(teachers as any[]).filter(t => t.user?.is_active !== false && t.user?.phone).length} teachers with phone numbers will receive this message.
              </p>
              <Textarea value={bulkSmsText} onChange={(e: any) => setBulkSmsText(e.target.value)} placeholder="Type your message here…" rows={5} />
              <div style={{ marginTop: 12 }}>
                <Btn variant="success" onClick={handleBulkSms} loading={sendingBulk} disabled={!bulkSmsText.trim() || sendingBulk}>
                  📤 Send to All Active Teachers
                </Btn>
              </div>
            </div>

            {/* Export staff list */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', padding: '20px' }}>
              <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 17, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>📊 Export Staff Reports</h3>
              <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 18px' }}>Download staff data as CSV files for records or reporting.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', borderRadius: 10, padding: '12px 14px', border: '.5px solid #e2e8f0' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Active Staff List</div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Name, email, phone, staff ID, status</div>
                  </div>
                  <Btn variant="outline" onClick={exportStaffCSV} style={{ padding: '7px 14px', fontSize: 12 }}>⬇️ CSV</Btn>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', borderRadius: 10, padding: '12px 14px', border: '.5px solid #e2e8f0' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Teaching Load Report</div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Teacher → classes → subjects count</div>
                  </div>
                  <Btn variant="outline" onClick={() => {
                    const rows = [['Name', 'Staff ID', 'Email', 'Classes', 'Subjects', 'Status']]
                      ; (teachers as any[]).forEach(t => rows.push([
                        t.user?.full_name ?? '', t.staff_id ?? '', t.user?.email ?? '',
                        String(loadMap[t.id]?.classes ?? 0), String(loadMap[t.id]?.subjects ?? 0),
                        t.user?.is_active !== false ? 'Active' : 'Inactive'
                      ]))
                    downloadCSV('teaching-load-report.csv', rows)
                  }} style={{ padding: '7px 14px', fontSize: 12 }}>⬇️ CSV</Btn>
                </div>
              </div>
            </div>

            {/* Quick HR */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', padding: '20px' }}>
              <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 17, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>📄 Quick HR Letters</h3>
              <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 14px' }}>Jump directly to the HR Documents Centre for common letters.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(['appointment', 'promotion', 'warning1', 'commendation', 'reference'] as LetterTypeId[]).map(id => {
                  const lt = LETTER_TYPES.find(l => l.id === id)!
                  return (
                    <button key={id} onClick={() => { setHrLetterType(id); setHrFields({}); setActiveTab('hr') }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fafafa', cursor: 'pointer', textAlign: 'left', fontFamily: '"DM Sans",sans-serif', fontSize: 13, color: '#111827', fontWeight: 500, transition: 'all .12s' }}
                      onMouseEnter={e => { (e.currentTarget as any).style.background = '#f5f3ff'; (e.currentTarget as any).style.borderColor = '#c4b5fd' }}
                      onMouseLeave={e => { (e.currentTarget as any).style.background = '#fafafa'; (e.currentTarget as any).style.borderColor = '#e5e7eb' }}>
                      <span style={{ fontSize: 18 }}>{lt.icon}</span>
                      {lt.label}
                      <span style={{ marginLeft: 'auto', color: '#c4b5fd' }}>→</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ════════════════════════════
          SMS SHEET (inline)
      ════════════════════════════ */}
      {smsTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setSmsTarget(null) }}>
          <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', padding: '24px 24px 32px', width: '100%', maxWidth: 480, animation: '_tp_fu .25s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <Avatar name={smsTarget.user?.full_name ?? '?'} size={40} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{smsTarget.user?.full_name}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{smsTarget.user?.phone || 'No phone on file'}</div>
              </div>
              <button onClick={() => setSmsTarget(null)} style={{ marginLeft: 'auto', border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: '#9ca3af' }}>✕</button>
            </div>
            <Textarea value={smsText} onChange={(e: any) => setSmsText(e.target.value)} placeholder="Type your message…" rows={4} />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <Btn variant="secondary" onClick={() => setSmsTarget(null)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</Btn>
              <Btn onClick={handleSendSms} loading={sendingSms} disabled={!smsTarget.user?.phone || !smsText.trim()} style={{ flex: 1, justifyContent: 'center' }}>
                📤 Send SMS
              </Btn>
            </div>
            {!smsTarget.user?.phone && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 8, textAlign: 'center' }}>⚠ No phone number on record — add one in the teacher's profile first.</p>}
          </div>
        </div>
      )}

      {/* ════════════════════════════
          VIEW DETAIL MODAL
      ════════════════════════════ */}
      <Modal open={viewModal} onClose={() => { setViewModal(false); setViewingTeacher(null) }}
        title="Staff Profile" subtitle={viewingTeacher?.user?.full_name} size="lg"
        footer={
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="secondary" onClick={() => setViewModal(false)}>Close</Btn>
            <Btn onClick={() => { setViewModal(false); openEdit(viewingTeacher) }}>✏️ Edit</Btn>
            <Btn variant="primary" onClick={() => { setViewModal(false); openAssign(viewingTeacher) }}>📚 Manage Assignments</Btn>
          </div>
        }>
        {viewingTeacher && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ background: 'linear-gradient(135deg,#2e1065,#4c1d95,#5b21b6)', borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, color: '#fff', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,.06)' }} />
              <Avatar name={viewingTeacher.user?.full_name ?? '?'} size={64} />
              <div>
                <h2 style={{ fontFamily: '"Playfair Display",serif', fontSize: 22, fontWeight: 700, color: '#fff', margin: 0 }}>{viewingTeacher.user?.full_name}</h2>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', margin: '3px 0' }}>{viewingTeacher.user?.email}</p>
                <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                  {viewingTeacher.staff_id && <span style={{ fontSize: 11, background: 'rgba(255,255,255,.15)', padding: '3px 10px', borderRadius: 99, color: '#fff', fontWeight: 600 }}>{viewingTeacher.staff_id}</span>}
                  {viewingTeacher.qualification && <span style={{ fontSize: 11, background: 'rgba(255,255,255,.15)', padding: '3px 10px', borderRadius: 99, color: '#fff' }}>🎓 {viewingTeacher.qualification}</span>}
                  {loadMap[viewingTeacher.id] && <span style={{ fontSize: 11, background: 'rgba(255,255,255,.15)', padding: '3px 10px', borderRadius: 99, color: '#fff' }}>🏫 {loadMap[viewingTeacher.id].classes} classes · {loadMap[viewingTeacher.id].subjects} subjects</span>}
                </div>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Contact Information</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { icon: '✉️', label: 'Email', value: viewingTeacher.user?.email },
                  { icon: '📱', label: 'Phone', value: viewingTeacher.user?.phone || 'Not set' },
                  { icon: '🪪', label: 'Staff ID', value: viewingTeacher.staff_id || 'Not set' },
                  { icon: '📅', label: 'Joined', value: viewingTeacher.user?.created_at ? new Date(viewingTeacher.user.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
                  { icon: '✅', label: 'Status', value: viewingTeacher.user?.is_active !== false ? 'Active' : 'Inactive' },
                  { icon: '🎓', label: 'Qualification', value: viewingTeacher.qualification || 'Not set' },
                ].map(({ icon, label, value }) => (
                  <div key={label} style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 12px', border: '.5px solid #e2e8f0' }}>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 3 }}>{icon} {label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>
                Class Assignments {viewingTeacher._assignments?.length > 0 && <span style={{ fontWeight: 400, textTransform: 'none', color: '#9ca3af' }}>— {viewingTeacher._assignments?.length} subject{viewingTeacher._assignments?.length !== 1 ? 's' : ''}</span>}
              </h4>
              {!viewingTeacher._assignments ? (
                <div style={{ textAlign: 'center', padding: '12px 0', color: '#9ca3af', fontSize: 12 }}>Loading…</div>
              ) : viewingTeacher._assignments.length === 0 ? (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 14px', fontSize: 12, color: '#92400e' }}>No assignments yet</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {groupByClass(viewingTeacher._assignments).map((g: any, i: number) => (
                    <div key={i} style={{ background: '#f5f3ff', borderRadius: 10, padding: '10px 14px', border: '1px solid #ede9fe' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#5b21b6' }}>🏫 {g.class?.name}</span>
                        <span style={{ fontSize: 10, color: '#9ca3af' }}>· {g.term?.name}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {g.subjects.map((s: string, j: number) => <span key={j} style={{ fontSize: 11, background: '#fff', color: '#6d28d9', padding: '2px 8px', borderRadius: 99, border: '1px solid #ddd6fe' }}>{s}</span>)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {viewingTeacher._goals?.length > 0 && (
              <div>
                <h4 style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Recent Weekly Goals</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {viewingTeacher._goals.slice(0, 4).map((g: any) => (
                    <div key={g.id} style={{ background: g.is_completed ? '#f0fdf4' : '#fffbeb', borderRadius: 10, padding: '10px 12px', border: `1px solid ${g.is_completed ? '#bbf7d0' : '#fde68a'}`, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 14, flexShrink: 0 }}>{g.is_completed ? '✅' : '⏳'}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 2 }}>Week {g.week_number} · {g.class?.name} · {g.subject?.name}</div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>{g.goal}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ════════════════════════════
          ADD / EDIT MODAL
      ════════════════════════════ */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
        subtitle={editingTeacher ? `Editing ${editingTeacher.user?.full_name}` : 'Creates a login account for the teacher'}
        size="md"
        footer={
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Btn>
            <Btn onClick={handleSubmit(onSubmit)} loading={isSubmitting}>{editingTeacher ? 'Save Changes' : 'Create Account'}</Btn>
          </div>
        }>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Full Name *"><Input {...register('full_name')} placeholder="e.g. Mad. Akua Mensah" error={errors.full_name?.message} /></Field>
            <Field label="Email Address *"><Input {...register('email')} type="email" placeholder="teacher@school.com" error={errors.email?.message} disabled={!!editingTeacher} /></Field>
            {!editingTeacher && (
              <Field label="Password">
                <Input {...register('password')} type="password" placeholder="Default: teacher123" />
                <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>Leave blank to use "teacher123"</p>
              </Field>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Phone"><Input {...register('phone')} placeholder="024 000 0000" /></Field>
              <Field label="Staff ID"><Input {...register('staff_id')} placeholder="TCH-001" /></Field>
            </div>
            <Field label="Qualification"><Input {...register('qualification')} placeholder="e.g. B.Ed Mathematics" /></Field>
          </div>
        </form>
      </Modal>

      {/* ════════════════════════════
          ASSIGN MODAL
      ════════════════════════════ */}
      <Modal open={assignModal} onClose={() => setAssignModal(false)}
        title="Class & Subject Assignments" subtitle={assigningTeacher?.user?.full_name} size="lg"
        footer={<Btn variant="secondary" onClick={() => setAssignModal(false)}>Done</Btn>}>
        {assigningTeacher && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: '14px 16px', border: '.5px solid #e2e8f0' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Add Assignment</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span>Classes</span>
                    <button onClick={() => { if (newClassIds.length === (classes as any[]).length) setNewClassIds([]); else setNewClassIds((classes as any[]).map((c: any) => c.id)) }} style={{ fontSize: 10, color: '#6d28d9', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontWeight: 700 }}>
                      {newClassIds.length === (classes as any[]).length ? 'Select None' : 'Select All'}
                    </button>
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 6, maxHeight: 110, overflowY: 'auto', background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: 8 }}>
                    {(classes as any[]).map((c: any) => (
                      <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                        <input type="checkbox" checked={newClassIds.includes(c.id)} onChange={e => { if (e.target.checked) setNewClassIds(p => [...p, c.id]); else setNewClassIds(p => p.filter(id => id !== c.id)) }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div style={{ gridColumn: 'span 2', marginTop: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span>Subjects</span>
                    <button onClick={() => { if (newSubjectIds.length === (subjects as any[]).length) setNewSubjectIds([]); else setNewSubjectIds((subjects as any[]).map((s: any) => s.id)) }} style={{ fontSize: 10, color: '#6d28d9', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontWeight: 700 }}>
                      {newSubjectIds.length === (subjects as any[]).length ? 'Select None' : 'Select All'}
                    </button>
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 6, maxHeight: 110, overflowY: 'auto', background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: 8 }}>
                    {(subjects as any[]).map((s: any) => (
                      <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                        <input type="checkbox" checked={newSubjectIds.includes(s.id)} onChange={e => { if (e.target.checked) setNewSubjectIds(p => [...p, s.id]); else setNewSubjectIds(p => p.filter(id => id !== s.id)) }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                  <label style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>Assign as Class Teacher for:</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {(classes as any[]).filter((c: any) => newClassIds.includes(c.id)).map((c: any) => (
                      <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', background: classTeacherClassIds.includes(c.id) ? '#dcfce7' : '#fff', padding: '4px 10px', borderRadius: 8, border: `1.5px solid ${classTeacherClassIds.includes(c.id) ? '#16a34a' : '#e5e7eb'}`, transition: 'all .15s' }}>
                        <input type="checkbox" checked={classTeacherClassIds.includes(c.id)} onChange={e => { if (e.target.checked) setClassTeacherClassIds(p => [...p, c.id]); else setClassTeacherClassIds(p => p.filter(id => id !== c.id)) }} style={{ display: 'none' }} />
                        <span style={{ fontWeight: classTeacherClassIds.includes(c.id) ? 700 : 400, color: classTeacherClassIds.includes(c.id) ? '#15803d' : '#374151' }}>
                          {classTeacherClassIds.includes(c.id) ? '✅ ' : ''}{c.name}
                        </span>
                      </label>
                    ))}
                    {newClassIds.length === 0 && <span style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>Select classes above first</span>}
                  </div>
                </div>
                <Btn onClick={addAssignment} style={{ padding: '7px 14px', fontSize: 12 }}>➕ Add</Btn>
              </div>
            </div>

            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Current Assignments ({assignments.length})</p>
              {assignments.length === 0
                ? <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', padding: '16px 0' }}>No assignments yet</p>
                : <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto' }}>
                  {assignments.map(a => (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: '#f5f3ff', borderRadius: 9, border: '1px solid #ede9fe' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#5b21b6', flex: 1 }}>🏫 {a.class?.name}</span>
                      <span style={{ fontSize: 12, color: '#6d28d9', flex: 1 }}>📗 {a.subject?.name}</span>
                      <span style={{ fontSize: 10, color: '#9ca3af' }}>{a.term?.name}</span>
                      <button 
                        onClick={() => toggleCT(a)} 
                        style={{ 
                          fontSize: 10, 
                          background: a.is_class_teacher ? '#dcfce7' : '#fff', 
                          color: a.is_class_teacher ? '#16a34a' : '#6b7280', 
                          padding: '2px 8px', 
                          borderRadius: 99, 
                          fontWeight: 700, 
                          border: `1px solid ${a.is_class_teacher ? '#16a34a' : '#e5e7eb'}`,
                          cursor: 'pointer',
                          transition: 'all .15s'
                        }}
                        onMouseEnter={e => { if (!a.is_class_teacher) e.currentTarget.style.borderColor = '#16a34a' }}
                        onMouseLeave={e => { if (!a.is_class_teacher) e.currentTarget.style.borderColor = '#e5e7eb' }}
                      >
                        {a.is_class_teacher ? 'Class Teacher ✓' : 'Set as CT'}
                      </button>
                      <button onClick={() => removeAssignment(a.id)} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: 12, flexShrink: 0 }}>×</button>
                    </div>
                  ))}
                </div>
              }
            </div>
          </div>
        )}
      </Modal>

      {/* ════════════════════════════
          RESET PASSWORD
      ════════════════════════════ */}
      <Modal open={resetModal} onClose={() => setResetModal(false)} title="Reset Password" subtitle={resetTeacher?.user?.full_name} size="sm"
        footer={
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="secondary" onClick={() => setResetModal(false)}>Cancel</Btn>
            <Btn variant="danger" onClick={handleResetPassword} loading={resetting}>🔑 Reset</Btn>
          </div>
        }>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 9, padding: '10px 14px', fontSize: 12, color: '#dc2626' }}>
            This will immediately change {resetTeacher?.user?.full_name}'s login password.
          </div>
          <Field label="New Password">
            <Input type="password" value={newPassword} onChange={(e: any) => setNewPassword(e.target.value)} placeholder="Min 6 characters" />
          </Field>
        </div>
      </Modal>

      {/* ════════════════════════════
          REASSIGN & REMOVE
      ════════════════════════════ */}
      <Modal open={removeModal} onClose={() => setRemoveModal(false)} title="Remove Staff Member" subtitle={removingTeacher?.user?.full_name} size="md"
        footer={
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="secondary" onClick={() => setRemoveModal(false)}>Cancel</Btn>
            <Btn variant="danger" onClick={handleReassignAndDeactivate} loading={removing}>
              {removingAssignments.length > 0 ? '🔄 Reassign & Deactivate' : '🗑️ Deactivate'}
            </Btn>
          </div>
        }>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '12px 16px', fontSize: 12, color: '#92400e', lineHeight: 1.6 }}>
            ⚠️ This will <b>deactivate</b> {removingTeacher?.user?.full_name}'s account. Their <b>historical records</b> (scores, reports, lesson logs) will be <b>preserved</b>. They will no longer be able to log in.
          </div>
          {removingAssignments.length > 0 ? (
            <>
              <div>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 10 }}>📚 Active Assignments ({removingAssignments.length})</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
                  {removingAssignments.map((a: any) => (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#fef2f2', borderRadius: 10, border: '1px solid #fecaca' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', flex: 1 }}>🏫 {a.class?.name}</span>
                      <span style={{ fontSize: 12, color: '#b91c1c' }}>📗 {a.subject?.name}</span>
                      <span style={{ fontSize: 10, color: '#9ca3af' }}>{a.term?.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>🔄 Transfer Classes To</h4>
                <select value={replacementTeacherId} onChange={e => setReplacementTeacherId(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 13, fontFamily: '"DM Sans",sans-serif', cursor: 'pointer' }}>
                  <option value="">— Select replacement teacher —</option>
                  {(teachers as any[]).filter(t => t.id !== removingTeacher?.id && t.user?.is_active !== false).map(t => <option key={t.id} value={t.id}>{t.user?.full_name} {t.staff_id ? `(${t.staff_id})` : ''}</option>)}
                </select>
                <p style={{ fontSize: 11, color: '#6b7280', marginTop: 6 }}>All {removingAssignments.length} assignment(s) and class teacher roles will be transferred.</p>
              </div>
            </>
          ) : (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '12px 16px', fontSize: 12, color: '#166534' }}>
              ✅ This teacher has <b>no active class assignments</b>. You can safely deactivate them.
            </div>
          )}
        </div>
      </Modal>
    </>
  )

  function groupByClass(asgs: any[]) {
    const map: Record<string, any> = {}
    for (const a of asgs) {
      const k = a.class?.id
      if (!map[k]) map[k] = { class: a.class, subjects: [], term: a.term }
      map[k].subjects.push(a.subject?.name)
    }
    return Object.values(map)
  }
}