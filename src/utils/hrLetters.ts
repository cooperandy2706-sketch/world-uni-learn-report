// src/utils/hrLetters.ts

export const LETTER_TYPES = [
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
  { id: 'parentPermission', label: 'Parental Permission (Extra Time)', icon: '👪' },
  { id: 'parentInvite', label: 'Parent Meeting Invitation', icon: '📅' },
  { id: 'parentInfo', label: 'General Information Letter', icon: 'ℹ️' },
  { id: 'staffId', label: 'Staff ID Card (Printable)', icon: '🪪' },
] as const

export type LetterTypeId = typeof LETTER_TYPES[number]['id']

export const LETTER_FIELDS: Record<LetterTypeId, { key: string; label: string; type?: string; placeholder?: string }[]> = {
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
  parentPermission: [
    { key: 'eventName', label: 'Event / Activity Name', placeholder: 'e.g. Extra Mock Exam Prep' },
    { key: 'eventDate', label: 'Event Date', type: 'date' },
    { key: 'endTime', label: 'Closing Time', placeholder: 'e.g. 4:30 PM' },
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
  staffId: [{ key: 'position', label: 'Position/Role', placeholder: 'e.g. Class Teacher' }, { key: 'department', label: 'Department', placeholder: 'e.g. Junior High' }, { key: 'idIssueDate', label: 'Issue Date', type: 'date' }],
}

export function formatDate(d: string) {
  if (!d) return '___________'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function letterRef(type: string) {
  const map: Record<string, string> = {
    appointment: 'APP', confirmation: 'CON', promotion: 'PRO', transfer: 'TRF',
    warning1: 'WRN', warningFinal: 'WRF', dismissal: 'DIS', suspension: 'SUS',
    reference: 'REF', leaveApproval: 'LEV', salaryIncrement: 'SAL',
    returnFromLeave: 'RTL', commendation: 'CMD', termWithoutPay: 'TWP',
    resignApproval: 'RSN', query: 'QRY', discHearing: 'DCH', contractEnd: 'END',
    maternityLeave: 'MAT', recommendation: 'REC', bonusNotice: 'BNS',
    salaryReview: 'SRV', otherDoc: 'OTH', parentPermission: 'PER', parentInvite: 'INV', parentInfo: 'INF', staffId: 'SID',
  }
  const code = map[type] ?? 'HR'
  const year = new Date().getFullYear()
  const num = String(Math.floor(Math.random() * 900) + 100)
  return `HR/${code}/${year}/${num}`
}

export const CREST_SVG = `
  <svg width="56" height="56" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
    <circle cx="28" cy="28" r="26" fill="none" stroke="#c9983a" stroke-width="1.5"/>
    <polygon points="28,9 32.5,21.5 46,21.5 35,29 39,42 28,34 17,42 21,29 10,21.5 23.5,21.5"
      fill="none" stroke="#c9983a" stroke-width="1.3" stroke-linejoin="round"/>
    <circle cx="28" cy="28" r="4.5" fill="#c9983a" opacity="0.75"/>
  </svg>`

export function letterHeader(school: any, staff: any, letterDate: string, letterType = '') {
  const ref = letterRef(letterType)
  const sName = school?.name || 'School Name'
  const sAddr = school?.address || 'P.O. Box 000, Ghana'
  const sEmail = school?.email || ''
  const sPhone = school?.phone || ''
  const sMotto = school?.motto || 'Knowledge · Integrity · Excellence'

  const contactParts = [sAddr, sPhone, sEmail].filter(Boolean)

  // staff can either be {user: {full_name, email}, staff_id} OR directly {full_name, email, staff_id}
  const fullName = staff?.user?.full_name || staff?.full_name || '___________'
  const email = staff?.user?.email || staff?.email || '___________'
  const staffId = staff?.staff_id || '___________'

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
      ${(letterType === 'parentPermission' || letterType === 'parentInvite' || letterType === 'parentInfo') ? `
        <strong>To:</strong>&nbsp; All Parents / Guardians<br/>
        <strong>Ref:</strong>&nbsp; Student Welfare / Official Communication
      ` : `
        <strong>To:</strong>&nbsp; ${fullName}<br/>
        <strong>Staff ID:</strong>&nbsp; ${staffId}<br/>
        <strong>Email:</strong>&nbsp; ${email}
      `}
    </div>
  `
}

export function letterFooter(school: any) {
  const sName = school?.name || 'School Name'
  const sHead = school?.headteacher_name || 'Headteacher'
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

export const LETTER_CSS = `
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
    .lh-date { font-weight: 600; color: #222; }

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

export function generateLetterHTML(type: LetterTypeId, staff: any, fields: Record<string, string>, school: any): string {
  const t = staff
  const f = fields
  const fn = t?.user?.full_name || t?.full_name || '___________'
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
      <p>We acknowledge receipt of your resignation letter dated <strong>${formatDate(f.receivedDate)}</strong>. We write to formally <strong>accept and approve</strong> your resignation as <strong>${t?.position || t?.designation || 'staff member'}</strong>.</p>
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
      <p>It is my pleasure to recommend <strong>${fn}</strong>, who served at ${sName} from <strong>${f.duration || '___________'}</strong> as <strong>${f.role || t?.designation || 'a staff member'}</strong>.</p>
      <p>${fn.split(' ')[0]} is an exceptional professional who made significant contributions to our school, particularly in the areas of: <strong>${f.merits || 'excellence and development'}</strong>.</p>
      <p>I have consistently been impressed by ${fn.split(' ')[0]}'s dedication and ability to achieve their full potential. Any institution will be fortunate to have ${fn.split(' ')[0]} as part of their team.</p>
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

    case 'parentPermission': return wrapHTML(body('Permission for Extended School Hours', `
      <p>Dear Parents and Guardians,</p>
      <p>We wish to inform you that the school has scheduled <strong>${f.eventName || 'an important academic session'}</strong> on <strong>${formatDate(f.eventDate)}</strong>.</p>
      <p>In view of this, students will be required to stay in school until <strong>${f.endTime || '___________'}</strong>. This extension is necessary to <strong>${f.reason || 'ensure all students are well-prepared for their upcoming assessments'}</strong>.</p>
      <p>We understand the importance of student safety and transportation. Please make the necessary arrangements to pick up your ward(s) at the new closing time. For those using the school bus, drop-off times will be adjusted accordingly.</p>
      <p>We thank you for your continued support in providing the best educational experience for our students.</p>
    `))

    case 'parentInvite': return wrapHTML(body('Invitation to Parent-School Meeting', `
      <p>Dear Parents and Guardians,</p>
      <p>The management of ${sName} cordially invites you to a meeting to discuss <strong>${f.purpose || 'matters concerning student academic progress'}</strong>.</p>
      <div class="incident-box">
        📅 Date: <strong>${formatDate(f.meetingDate)}</strong><br/>
        ⏰ Time: <strong>${f.meetingTime || '___________'}</strong><br/>
        📍 Venue: <strong>${f.venue || '___________'}</strong>
      </div>
      <p>Your presence and input are highly valued as we work together to support our students' growth and success. Please make every effort to attend punctually.</p>
      <p>We look forward to meeting with you.</p>
    `))

    case 'parentInfo': return wrapHTML(body(f.subject || 'Information for Parents', `
      <p>Dear Parents and Guardians,</p>
      <div style="white-space: pre-wrap; margin-top: 15px; line-height: 1.8;">${f.content || '...'}</div>
      <p>Thank you for your continued cooperation.</p>
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
            <div class="id-card-role">${f.position || t?.designation || '___________'} &middot; ${f.department || '___________'}</div>
            <div class="id-card-badge">${t?.staff_id || 'ID: ___________'}</div>
          </div>
          <div class="id-card-footer">Issued: ${formatDate(f.idIssueDate)}</div>
        </div>
      </div>
    `)

    default: return wrapHTML('<p style="padding:40px">Letter type not found.</p>')
  }
}
