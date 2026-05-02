// src/pages/bursar/BillSheetPage.tsx
// Professional printable bill / fee statement for parents
import { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import { useCurrentTerm, useCurrentAcademicYear } from '../../hooks/useSettings'
import { supabase } from '../../lib/supabase'
import { billSheetService, scholarshipService } from '../../services/bursar.service'
import { Printer, FileText, Search, GraduationCap, AlertCircle, CheckCircle2, ChevronRight, Trash2, Plus } from 'lucide-react'

const GHS = (n: number) => `GH₵ ${Number(n).toLocaleString('en-GH', { minimumFractionDigits: 2 })}`

const CREST_SVG = `
  <svg width="56" height="56" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
    <circle cx="28" cy="28" r="26" fill="none" stroke="#4c1d95" stroke-width="1.5"/>
    <polygon points="28,9 32.5,21.5 46,21.5 35,29 39,42 28,34 17,42 21,29 10,21.5 23.5,21.5"
      fill="none" stroke="#4c1d95" stroke-width="1.3" stroke-linejoin="round"/>
    <circle cx="28" cy="28" r="4.5" fill="#4c1d95" opacity="0.75"/>
  </svg>`

export default function BillSheetPage() {
  const { user } = useAuth()
  const schoolId = user?.school_id ?? ''
  const { data: term } = useCurrentTerm()
  const { data: year } = useCurrentAcademicYear()
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [studentSearch, setStudentSearch] = useState('')

  // Load school info
  const { data: school } = useQuery({
    queryKey: ['school-info', schoolId],
    queryFn: async () => { const { data } = await supabase.from('schools').select('*').eq('id', schoolId).single(); return data },
    enabled: !!schoolId,
  })

  // Load all students
  const { data: students = [] } = useQuery({
    queryKey: ['students-all-bill', schoolId],
    queryFn: async () => {
      const { data } = await supabase
        .from('students')
        .select('id, full_name, student_id, scholarship_type, scholarship_percentage, guardian_name, guardian_phone, guardian_email, fees_arrears, class:classes(id,name)')
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .order('full_name')
      return data ?? []
    },
    enabled: !!schoolId,
  })

  const filteredStudents = useMemo(() =>
    (students as any[]).filter(s =>
      s.full_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.student_id && s.student_id.toLowerCase().includes(studentSearch.toLowerCase()))
    ), [students, studentSearch])

  // Load bill data for selected student.
  // staleTime: 0 ensures we always fetch fresh data when the user returns from
  // viewing a different term — prevents stale fees_arrears from poisoning the bill.
  const { data: billData, isLoading: loadingBill } = useQuery({
    queryKey: ['bill-sheet', selectedStudentId, term?.id],
    queryFn: () => billSheetService.getStudentBillData(selectedStudentId, term?.id!, schoolId),
    enabled: !!selectedStudentId && !!term?.id && !!schoolId,
    staleTime: 0,
  })

  const selectedStudent = (students as any[]).find((s: any) => s.id === selectedStudentId)

  // Custom adjustments state
  const [customItems, setCustomItems] = useState<{ id: string, name: string, amount: number }[]>([])
  const [newItemName, setNewItemName] = useState('')
  const [newItemAmount, setNewItemAmount] = useState('')

  useEffect(() => {
    setCustomItems([])
    setNewItemName('')
    setNewItemAmount('')
  }, [selectedStudentId, term?.id])

  const customTotal = customItems.reduce((s, i) => s + i.amount, 0)
  const grandTotalCharges = (billData?.summary.totalCharges ?? 0) + customTotal
  const grandBalance = (billData?.summary.balance ?? 0) + customTotal

  function printBillSheet() {
    if (!billData || !selectedStudent) return
    const d = billData
    const stu = selectedStudent
    const win = window.open('', '_blank', 'width=800,height=1000')
    if (!win) return

    const statusColors: Record<string, { bg: string; color: string; label: string }> = {
      paid: { bg: '#f0fdf4', color: '#16a34a', label: 'PAID IN FULL' },
      partial: { bg: '#fffbeb', color: '#d97706', label: 'PARTIALLY PAID' },
      unpaid: { bg: '#fef2f2', color: '#dc2626', label: 'OUTSTANDING' },
    }
    const grandStatus = grandBalance < 0 ? 'paid' : (grandBalance === 0 ? 'paid' : (d.summary.totalPaid > 0 ? 'partial' : 'unpaid'))
    const st = statusColors[grandStatus] || statusColors.unpaid
    const isCredit = grandBalance < 0

    const scholarshipRow = d.scholarship.type !== 'none'
      ? '<tr style="color:#16a34a"><td style="padding:10px 14px;font-size:13px">\u{1F393} Scholarship Discount (' + d.scholarship.percentage + '%)</td><td style="padding:10px 14px;text-align:right;font-weight:700;font-size:13px">\u2212 ' + GHS(d.scholarship.discount) + '</td></tr>' : ''

    const arrearsRow = d.arrears > 0
      ? '<tr><td style="padding:10px 14px;font-size:13px;border-bottom:1px solid #f1f5f9;color:#dc2626;font-weight:700">Previous Arrears (Brought Forward)</td><td style="padding:10px 14px;text-align:right;font-weight:800;font-size:13px;border-bottom:1px solid #f1f5f9;color:#dc2626">' + GHS(d.arrears) + '</td></tr>' : ''

    const feeRows = d.structures.map((f: any) =>
      '<tr><td style="padding:10px 14px;font-size:13px;border-bottom:1px solid #f1f5f9">' + f.fee_name + '</td><td style="padding:10px 14px;text-align:right;font-weight:700;font-size:13px;border-bottom:1px solid #f1f5f9">' + GHS(f.amount) + '</td></tr>'
    ).join('')

    const customRows = customItems.map(c =>
      '<tr><td style="padding:10px 14px;font-size:13px;border-bottom:1px solid #f1f5f9;color:' + (c.amount > 0 ? '#374151' : '#16a34a') + '">' + c.name + (c.amount < 0 ? ' (Discount)' : '') + '</td><td style="padding:10px 14px;text-align:right;font-weight:700;font-size:13px;border-bottom:1px solid #f1f5f9;color:' + (c.amount > 0 ? '#374151' : '#16a34a') + '">' + (c.amount > 0 ? '' : '\u2212 ') + GHS(Math.abs(c.amount)) + '</td></tr>'
    ).join('')

    const paymentRows = d.payments.length > 0 ? d.payments.map((p: any) =>
      '<tr><td style="padding:8px 14px;font-size:12px;border-bottom:1px solid #f1f5f9">' + new Date(p.payment_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + '</td>' +
      '<td style="padding:8px 14px;font-size:12px;border-bottom:1px solid #f1f5f9">' + (p.fee_structure?.fee_name ?? 'General') + '</td>' +
      '<td style="padding:8px 14px;font-size:12px;text-transform:capitalize;border-bottom:1px solid #f1f5f9">' + p.payment_method + '</td>' +
      '<td style="padding:8px 14px;font-size:12px;font-weight:700;color:#16a34a;text-align:right;border-bottom:1px solid #f1f5f9">' + GHS(p.amount_paid) + '</td></tr>'
    ).join('') : '<tr><td colspan="4" style="padding:16px;text-align:center;color:#9ca3af;font-size:12px">No payments recorded this term</td></tr>'

    // Build the daily fees section
    let dailySection = ''
    if (d.dailyFees.feeding.expected > 0 || d.dailyFees.studies.expected > 0) {
      let dailyRows = ''
      if (d.dailyFees.feeding.expected > 0) {
        dailyRows += '<tr>' +
          '<td style="padding:10px 14px;font-size:13px;border-bottom:1px solid #f1f5f9">Feeding Fee</td>' +
          '<td style="padding:10px 14px;font-size:13px;text-align:right;border-bottom:1px solid #f1f5f9">' + GHS(d.dailyFees.feeding.rate) + '/day</td>' +
          '<td style="padding:10px 14px;font-size:13px;text-align:right;border-bottom:1px solid #f1f5f9">' + GHS(d.dailyFees.feeding.expected) + '</td>' +
          '<td style="padding:10px 14px;font-size:13px;text-align:right;color:#16a34a;font-weight:700;border-bottom:1px solid #f1f5f9">' + GHS(d.dailyFees.feeding.paid) + '</td>' +
          '<td style="padding:10px 14px;font-size:13px;text-align:right;color:' + (d.dailyFees.feeding.owed > 0 ? '#dc2626' : '#16a34a') + ';font-weight:700;border-bottom:1px solid #f1f5f9">' + GHS(d.dailyFees.feeding.owed) + '</td></tr>'
      }
      if (d.dailyFees.studies.expected > 0) {
        dailyRows += '<tr>' +
          '<td style="padding:10px 14px;font-size:13px;border-bottom:1px solid #f1f5f9">Studies Fee</td>' +
          '<td style="padding:10px 14px;font-size:13px;text-align:right;border-bottom:1px solid #f1f5f9">' + GHS(d.dailyFees.studies.rate) + '/day</td>' +
          '<td style="padding:10px 14px;font-size:13px;text-align:right;border-bottom:1px solid #f1f5f9">' + GHS(d.dailyFees.studies.expected) + '</td>' +
          '<td style="padding:10px 14px;font-size:13px;text-align:right;color:#16a34a;font-weight:700;border-bottom:1px solid #f1f5f9">' + GHS(d.dailyFees.studies.paid) + '</td>' +
          '<td style="padding:10px 14px;font-size:13px;text-align:right;color:' + (d.dailyFees.studies.owed > 0 ? '#dc2626' : '#16a34a') + ';font-weight:700;border-bottom:1px solid #f1f5f9">' + GHS(d.dailyFees.studies.owed) + '</td></tr>'
      }
      dailySection = '<div class="section"><div class="section-title">Daily Fees (' + d.dailyFees.feeding.days + ' school days elapsed)</div>' +
        '<table class="fee-table"><thead><tr><th>Fee Type</th><th style="text-align:right">Daily Rate</th><th style="text-align:right">Expected</th><th style="text-align:right">Paid</th><th style="text-align:right">Owing</th></tr></thead>' +
        '<tbody>' + dailyRows + '</tbody></table></div>'
    }

    const logoHtml = school?.logo_url
      ? `<img src="${school.logo_url}" alt="School Logo" style="width: 72px; height: 72px; border-radius: 12px; object-fit: contain; border: 1.5px solid #ede9fe; padding: 4px; background: #fff;" />`
      : `<div style="width:72px;height:72px;border-radius:12px;background:#f5f3ff;display:flex;align-items:center;justify-content:center;border:1.5px solid #ede9fe;">${CREST_SVG}</div>`

    const scholarshipBadge = d.scholarship.type !== 'none'
      ? ' <span class="scholarship-badge">\u{1F393} ' + (d.scholarship.type === 'full' ? 'Full' : d.scholarship.percentage + '%') + ' Scholarship</span>'
      : ''

    const paymentsFooter = d.payments.length > 0
      ? '<tfoot><tr class="subtotal"><td colspan="3">Total Payments</td><td style="text-align:right;font-size:14px">' + GHS(d.summary.totalPaid) + '</td></tr></tfoot>'
      : ''

    const tuitionSubtotal = d.tuition.total > 0
      ? '<tr class="subtotal"><td>Tuition Subtotal</td><td style="text-align:right">' + GHS(d.tuition.total) + '</td></tr>'
      : ''

    const html = [
      '<!DOCTYPE html><html><head><title>Fee Statement \u2014 ' + stu.full_name + '</title>',
      '<link rel="preconnect" href="https://fonts.googleapis.com">',
      '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
      '<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;900&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet">',
      '<style>',
      '* { margin:0; padding:0; box-sizing:border-box; }',
      'body { font-family: "DM Sans", sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #111827; background: #f8fafc; }',
      '.container { background: #fff; border-radius: 16px; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); position: relative; overflow: hidden; }',
      '.watermark { position: absolute; top: 15%; left: 50%; transform: translate(-50%, -15%) rotate(-15deg); font-size: 100px; font-weight: 900; color: rgba(76, 29, 149, 0.02); pointer-events: none; z-index: 0; text-transform: uppercase; white-space: nowrap; }',
      '.content { position: relative; z-index: 1; }',
      '.header { display: flex; align-items: center; gap: 24px; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #4c1d95; }',
      '.school-info { flex: 1; }',
      '.school-name { font-family: "Playfair Display", serif; font-size: 24px; font-weight: 900; color: #1e0646; margin-bottom: 4px; }',
      '.school-sub { font-size: 11px; color: #6b7280; font-weight: 500; }',
      '.doc-title { text-align: center; font-size: 12px; font-weight: 900; color: #4c1d95; text-transform: uppercase; letter-spacing: .2em; margin-bottom: 32px; background: #f5f3ff; padding: 8px; border-radius: 8px; }',
      '.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px; }',
      '.info-box { background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 12px; padding: 16px; }',
      '.info-label { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: .1em; color: #6b7280; margin-bottom: 6px; }',
      '.info-val { font-size: 15px; font-weight: 700; color: #111827; }',
      '.info-val-sm { font-size: 11px; color: #6b7280; margin-top: 2px; }',
      '.section { margin-bottom: 28px; }',
      '.section-title { font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: .15em; color: #4c1d95; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #ede9fe; }',
      'table { width: 100%; border-collapse: collapse; }',
      '.fee-table th { padding:12px 16px; text-align:left; font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:.1em; color:#fff; background:#4c1d95; }',
      '.fee-table th:first-child { border-radius: 8px 0 0 0; }',
      '.fee-table th:last-child { border-radius: 0 8px 0 0; text-align:right; }',
      '.fee-table td { padding:12px 16px; font-size:13px; border-bottom:1px solid #f1f5f9; }',
      '.subtotal { background:#f8fafc; font-weight:700; }',
      '.grand-total-box { background: linear-gradient(135deg, #4c1d95, #2e1065); border-radius: 12px; padding: 24px; color: #fff; margin-bottom: 32px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 12px rgba(76, 29, 149, 0.15); }',
      '.grand-label { font-size: 11px; font-weight: 700; opacity: 0.8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }',
      '.grand-val { font-size: 28px; font-weight: 900; }',
      '.status-badge { display:inline-block; padding:8px 24px; border-radius:99px; font-size:12px; font-weight:900; letter-spacing:.1em; text-transform: uppercase; }',
      '.footer { margin-top:40px; padding-top:24px; border-top:1px dashed #cbd5e1; text-align:center; font-size:10px; color:#9ca3af; line-height: 1.6; }',
      '.signature-row { display:grid; grid-template-columns: 1fr 1fr; gap:60px; margin-top:48px; }',
      '.sig-line { border-top: 1.5px solid #111827; padding-top: 8px; font-size: 11px; font-weight: 700; color: #111827; text-align:center; }',
      '@media print { body { padding: 0; background: #fff; } .container { box-shadow: none; padding: 20px; } }',
      '</style></head><body>',
      '<div class="container">',
      '<div class="watermark">' + (school?.name?.split(' ')[0] || 'STATEMENT') + '</div>',
      '<div class="content">',
      '<div class="header">' + logoHtml + '<div class="school-info">',
      '<div class="school-name">' + (school?.name || 'School') + '</div>',
      '<div class="school-sub">📍 ' + (school?.address || '') + '</div>',
      '<div class="school-sub">📞 ' + (school?.phone || '') + (school?.email ? ' &middot; ✉️ ' + school.email : '') + '</div>',
      '</div></div>',
      '<div class="doc-title">Official Student Fee Statement</div>',
      '<div class="info-grid">',
      '<div class="info-box"><div class="info-label">Student Information</div><div class="info-val">' + stu.full_name + scholarshipBadge + '</div><div class="info-val-sm">ID: ' + (stu.student_id || stu.id?.slice(0, 8).toUpperCase()) + ' | Class: ' + ((stu.class as any)?.name || 'N/A') + '</div></div>',
      '<div class="info-box"><div class="info-label">Billing Period</div><div class="info-val">' + (term?.name || 'Academic Term') + '</div><div class="info-val-sm">' + ((year as any)?.name || '') + ' | Statements Ref: #' + (stu.student_id || stu.id?.slice(0, 6).toUpperCase()) + '</div></div>',
      '</div>',
      '<div class="section"><div class="section-title">Tuition & Term Charges</div>',
      '<table class="fee-table"><thead><tr><th>Description</th><th style="text-align:right">Amount</th></tr></thead>',
      '<tbody>' + arrearsRow + (feeRows || '<tr><td colspan="2" style="padding:16px;text-align:center;color:#9ca3af;font-size:12px">No specific fee structures recorded</td></tr>') + customRows + scholarshipRow + '</tbody>',
      '<tfoot><tr class="subtotal"><td>Subtotal Charges</td><td style="text-align:right">' + GHS(grandTotalCharges) + '</td></tr></tfoot></table></div>',
      dailySection,
      '<div class="section"><div class="section-title">Payments & Credits</div>',
      '<table class="fee-table"><thead><tr><th>Date</th><th>Item</th><th>Method</th><th style="text-align:right">Paid</th></tr></thead>',
      '<tbody>' + paymentRows + '</tbody>' + paymentsFooter + '</table></div>',
      '<div class="grand-total-box" style="background: ' + (isCredit ? 'linear-gradient(135deg, #059669, #065f46)' : 'linear-gradient(135deg, #4c1d95, #2e1065)') + '"><div><div class="grand-label">' + (isCredit ? 'Credit Balance (Prepaid)' : 'Current Balance Outstanding') + '</div><div class="grand-val">' + GHS(Math.abs(grandBalance)) + '</div></div>',
      '<div><div class="status-badge" style="background:' + (isCredit ? '#ecfdf5' : st.bg) + ';color:' + (isCredit ? '#059669' : st.color) + '">' + (isCredit ? 'CREDIT / PREPAID' : st.label) + '</div></div></div>',
      '<div class="signature-row"><div><div style="height:40px"></div><div class="sig-line">Bursar\'s Approval / Stamp</div></div><div><div style="height:40px"></div><div class="sig-line">Parent / Guardian Signature</div></div></div>',
      '<div class="footer"><p>This is an electronically generated official document. <br/> For clarifications, please visit the bursary office or call ' + (school?.phone || 'the school') + '.</p>',
      '<p style="margin-top:8px">&copy; ' + new Date().getFullYear() + ' ' + (school?.name || 'School System') + '. All Rights Reserved.</p></div>',
      '</div></div>',
      '<script>setTimeout(() => window.print(), 500)<\/script>',
      '</body></html>',
    ].join('\n')

    win.document.write(html)
    win.document.close()
  }

  const statusInfo: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    paid: { label: 'Paid in Full', color: '#16a34a', bg: '#f0fdf4', icon: CheckCircle2 },
    partial: { label: 'Partially Paid', color: '#d97706', bg: '#fffbeb', icon: AlertCircle },
    unpaid: { label: 'Outstanding', color: '#dc2626', bg: '#fef2f2', icon: AlertCircle },
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');
        @keyframes _bs_fi { from{opacity:0} to{opacity:1} }
        @keyframes _bs_fu { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .bs-card { transition: all .2s; }
        .bs-card:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,0,0,0.1) !important; }
        .bs-stu-row { transition: background .12s; cursor: pointer; }
        .bs-stu-row:hover { background: #faf5ff !important; }
      `}</style>

      <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif', animation: '_bs_fi .4s ease' }}>

        {/* Header */}
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>Student Bill Sheet</h1>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 3 }}>Generate professional fee statements for parents · {term?.name ?? 'No active term'}</p>
          </div>
          {selectedStudentId && billData && (
            <button onClick={printBillSheet}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#1e0646,#3730a3)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(30,6,70,.25)', transition: 'all .2s' }}>
              <Printer size={16} /> Print Bill for Parent
            </button>
          )}
        </div>

        {/* Two-column layout: student list + bill preview */}
        <div style={{ display: 'grid', gridTemplateColumns: selectedStudentId ? '320px 1fr' : '1fr', gap: 20 }}>

          {/* Student selector panel */}
          <div style={{ background: '#fff', borderRadius: 18, border: '1.5px solid #f0eefe', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ padding: '16px 18px', borderBottom: '1px solid #f5f3ff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fafafa' }}>
                <Search size={14} color="#9ca3af" />
                <input
                  placeholder="Search by name or ID..."
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  style={{ border: 'none', outline: 'none', width: '100%', fontSize: 13, background: 'transparent', fontFamily: '"DM Sans",sans-serif' }}
                />
              </div>
            </div>
            <div style={{ maxHeight: selectedStudentId ? 520 : 600, overflowY: 'auto' }}>
              {filteredStudents.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No students found</div>
              ) : filteredStudents.map((s: any) => (
                <div
                  key={s.id}
                  className="bs-stu-row"
                  onClick={() => setSelectedStudentId(s.id)}
                  style={{ padding: '12px 18px', borderBottom: '1px solid #faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: selectedStudentId === s.id ? '#f5f3ff' : '#fff' }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {s.full_name}
                      {s.scholarship_type && s.scholarship_type !== 'none' && (
                        <span style={{ fontSize: 9, fontWeight: 800, background: '#f0fdf4', color: '#16a34a', padding: '2px 6px', borderRadius: 99 }}>
                          🎓 {s.scholarship_type === 'full' ? 'Full' : `${s.scholarship_percentage}%`}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2, display: 'flex', justifyContent: 'space-between' }}>
                      <span>{(s.class as any)?.name ?? 'No class'} {s.student_id ? `· ${s.student_id}` : ''}</span>
                      {Number(s.fees_arrears) > 0 && <span style={{ color: '#dc2626', fontWeight: 800 }}>{GHS(Number(s.fees_arrears))}</span>}
                    </div>
                  </div>
                  <ChevronRight size={14} color={selectedStudentId === s.id ? '#6d28d9' : '#d1d5db'} />
                </div>
              ))}
            </div>
          </div>

          {/* Bill preview panel */}
          {selectedStudentId && (
            <div style={{ animation: '_bs_fu .35s ease' }}>
              {loadingBill ? (
                <div style={{ background: '#fff', borderRadius: 18, padding: '80px 20px', textAlign: 'center', border: '1.5px solid #f0eefe' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #ede9fe', borderTopColor: '#6d28d9', animation: '_bs_fi .8s linear infinite', margin: '0 auto 12px' }} />
                  <p style={{ fontSize: 13, color: '#9ca3af' }}>Loading bill data…</p>
                </div>
              ) : !billData ? (
                <div style={{ background: '#fff', borderRadius: 18, padding: '80px 20px', textAlign: 'center', border: '1.5px solid #f0eefe' }}>
                  <p style={{ fontSize: 13, color: '#9ca3af' }}>Could not load bill data</p>
                </div>
              ) : (
                <>
                  {/* Student info + status header */}
                  <div className="bs-card" style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', border: '1.5px solid #f0eefe', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: '#111827', fontFamily: '"Playfair Display",serif', display: 'flex', alignItems: 'center', gap: 10 }}>
                          {selectedStudent?.full_name}
                          {billData.scholarship.type !== 'none' && (
                            <span style={{ fontSize: 11, fontWeight: 700, background: '#f0fdf4', color: '#16a34a', padding: '4px 10px', borderRadius: 99, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <GraduationCap size={12} /> {billData.scholarship.type === 'full' ? 'Full Scholarship' : `${billData.scholarship.percentage}% Scholarship`}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                          {(selectedStudent?.class as any)?.name ?? '—'} · ID: {selectedStudent?.student_id ?? '—'} · Guardian: {selectedStudent?.guardian_name ?? '—'}
                        </div>
                      </div>
                      {(() => {
                        const bStat = grandBalance < 0 ? 'paid' : (grandBalance === 0 ? 'paid' : (billData.summary.totalPaid > 0 ? 'partial' : 'unpaid'))
                        const si = statusInfo[bStat]
                        const isCredit = grandBalance < 0
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 99, background: isCredit ? '#ecfdf5' : si.bg }}>
                            <si.icon size={14} color={isCredit ? '#059669' : si.color} />
                            <span style={{ fontSize: 12, fontWeight: 800, color: isCredit ? '#059669' : si.color, letterSpacing: '.04em' }}>{isCredit ? 'Credit / Prepaid' : si.label}</span>
                          </div>
                        )
                      })()}
                    </div>
                  </div>

                  {/* Summary cards row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
                    {[
                      { label: 'Total Charges', value: GHS(grandTotalCharges), color: '#374151', bg: '#f8fafc' },
                      { label: 'Scholarship Discount', value: billData.scholarship.discount > 0 ? `− ${GHS(billData.scholarship.discount)}` : '—', color: '#16a34a', bg: '#f0fdf4' },
                      { label: 'Total Paid', value: GHS(billData.summary.totalPaid), color: '#16a34a', bg: '#f0fdf4' },
                      { label: grandBalance < 0 ? 'Credit Balance' : 'Balance Due', value: GHS(Math.abs(grandBalance)), color: grandBalance > 0 ? '#dc2626' : '#16a34a', bg: grandBalance > 0 ? '#fef2f2' : '#f0fdf4' },
                    ].map((c, i) => (
                      <div key={c.label} className="bs-card" style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', border: '1.5px solid #f0eefe', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', animation: `_bs_fu .3s ease ${i * 0.05}s both` }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color: c.color, fontFamily: '"Playfair Display",serif' }}>{c.value}</div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', marginTop: 3, textTransform: 'uppercase', letterSpacing: '.06em' }}>{c.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Tuition breakdown */}
                  <div className="bs-card" style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', overflow: 'hidden', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid #faf5ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FileText size={14} color="#6d28d9" /> Term Fee Charges
                      </h3>
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#6d28d9' }}>Net: {GHS(billData.tuition.net)}</span>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#faf5ff' }}>
                          <th style={{ padding: '10px 20px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '.06em' }}>Fee Item</th>
                          <th style={{ padding: '10px 20px', textAlign: 'right', fontSize: 10, fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '.06em' }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {billData.arrears !== 0 && (
                          <tr style={{ background: billData.arrears > 0 ? '#fef2f2' : '#f0fdf4', borderBottom: '1px solid #faf5ff' }}>
                            <td style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, color: billData.arrears > 0 ? '#dc2626' : '#16a34a' }}>
                              {billData.arrears > 0 ? 'Previous Arrears (Brought Forward)' : 'Credit / Prepayment (Brought Forward)'}
                            </td>
                            <td style={{ padding: '10px 20px', fontSize: 13, fontWeight: 800, color: billData.arrears > 0 ? '#dc2626' : '#16a34a', textAlign: 'right' }}>
                              {billData.arrears > 0 ? GHS(billData.arrears) : `− ${GHS(Math.abs(billData.arrears))}`}
                            </td>
                          </tr>
                        )}
                        {billData.structures.length === 0 ? (
                          <tr><td colSpan={2} style={{ padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No fee structures for this class/term</td></tr>
                        ) : billData.structures.map((f: any) => (
                          <tr key={f.id} style={{ borderBottom: '1px solid #faf5ff' }}>
                            <td style={{ padding: '10px 20px', fontSize: 13, color: '#374151' }}>
                              {f.fee_name}
                              {f.is_discountable === false && <span style={{ fontSize: 10, color: '#dc2626', fontWeight: 800, marginLeft: 8 }}>[EXEMPT FROM DISCOUNT]</span>}
                            </td>
                            <td style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, color: '#374151', textAlign: 'right' }}>{GHS(f.amount)}</td>
                          </tr>
                        ))}
                        {billData.scholarship.discount > 0 && (
                          <tr style={{ background: '#f0fdf4' }}>
                            <td style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <GraduationCap size={13} /> Scholarship Discount ({billData.scholarship.percentage}%)
                            </td>
                            <td style={{ padding: '10px 20px', fontSize: 13, fontWeight: 800, color: '#16a34a', textAlign: 'right' }}>− {GHS(billData.scholarship.discount)}</td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: '#faf5ff', borderTop: '2px solid #ede9fe' }}>
                          <td style={{ padding: '10px 20px', fontSize: 13, fontWeight: 800, color: '#111827' }}>Tuition — Paid / Owed</td>
                          <td style={{ padding: '10px 20px', textAlign: 'right' }}>
                            <span style={{ color: '#16a34a', fontWeight: 700, fontSize: 12 }}>{GHS(billData.tuition.paid)}</span>
                            <span style={{ color: '#9ca3af', margin: '0 4px' }}>/</span>
                            <span style={{ color: billData.tuition.owed > 0 ? '#dc2626' : '#16a34a', fontWeight: 800, fontSize: 13 }}>{GHS(billData.tuition.owed)}</span>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Daily fees section */}
                  {(billData.dailyFees.feeding.expected > 0 || billData.dailyFees.studies.expected > 0) && (
                    <div className="bs-card" style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', overflow: 'hidden', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                      <div style={{ padding: '14px 20px', borderBottom: '1px solid #faf5ff' }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>
                          Daily Fees ({billData.dailyFees.feeding.days} school days elapsed)
                        </h3>
                      </div>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: '#faf5ff' }}>
                            {['Fee Type', 'Rate/Day', 'Expected', 'Paid', 'Owing'].map(h => (
                              <th key={h} style={{ padding: '10px 16px', textAlign: h === 'Fee Type' ? 'left' : 'right', fontSize: 10, fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {billData.dailyFees.feeding.expected > 0 && (
                            <tr style={{ borderBottom: '1px solid #faf5ff' }}>
                              <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: '#374151' }}>Feeding Fee</td>
                              <td style={{ padding: '10px 16px', fontSize: 12, color: '#6b7280', textAlign: 'right' }}>{GHS(billData.dailyFees.feeding.rate)}/day</td>
                              <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 700, textAlign: 'right' }}>{GHS(billData.dailyFees.feeding.expected)}</td>
                              <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 700, color: '#16a34a', textAlign: 'right' }}>{GHS(billData.dailyFees.feeding.paid)}</td>
                              <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 800, color: billData.dailyFees.feeding.owed > 0 ? '#dc2626' : '#16a34a', textAlign: 'right' }}>{GHS(billData.dailyFees.feeding.owed)}</td>
                            </tr>
                          )}
                          {billData.dailyFees.studies.expected > 0 && (
                            <tr style={{ borderBottom: '1px solid #faf5ff' }}>
                              <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: '#374151' }}>Studies Fee</td>
                              <td style={{ padding: '10px 16px', fontSize: 12, color: '#6b7280', textAlign: 'right' }}>{GHS(billData.dailyFees.studies.rate)}/day</td>
                              <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 700, textAlign: 'right' }}>{GHS(billData.dailyFees.studies.expected)}</td>
                              <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 700, color: '#16a34a', textAlign: 'right' }}>{GHS(billData.dailyFees.studies.paid)}</td>
                              <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 800, color: billData.dailyFees.studies.owed > 0 ? '#dc2626' : '#16a34a', textAlign: 'right' }}>{GHS(billData.dailyFees.studies.owed)}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Recent payments list */}
                  <div className="bs-card" style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid #faf5ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>Payments Received This Term</h3>
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#16a34a' }}>{GHS(billData.summary.totalPaid)}</span>
                    </div>
                    {billData.payments.length === 0 ? (
                      <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No payments recorded this term</div>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: '#faf5ff' }}>
                            {['Date', 'Fee Type', 'Method', 'Reference', 'Amount'].map(h => (
                              <th key={h} style={{ padding: '10px 16px', textAlign: h === 'Amount' ? 'right' : 'left', fontSize: 10, fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {billData.payments.map((p: any) => (
                            <tr key={p.id} style={{ borderBottom: '1px solid #faf5ff' }}>
                              <td style={{ padding: '10px 16px', fontSize: 12, color: '#6b7280' }}>{new Date(p.payment_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                              <td style={{ padding: '10px 16px', fontSize: 12, color: '#374151' }}>{p.fee_structure?.fee_name ?? 'General'}</td>
                              <td style={{ padding: '10px 16px' }}><span style={{ fontSize: 10, fontWeight: 600, background: '#f0fdf4', color: '#16a34a', padding: '2px 8px', borderRadius: 99, textTransform: 'capitalize' }}>{p.payment_method}</span></td>
                              <td style={{ padding: '10px 16px', fontSize: 11, color: '#9ca3af', fontFamily: 'monospace' }}>{p.reference_number ?? '—'}</td>
                              <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 800, color: '#16a34a', textAlign: 'right' }}>{GHS(p.amount_paid)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                  {/* Custom adjustments */}
                  <div className="bs-card" style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', overflow: 'hidden', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid #faf5ff' }}>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>Custom Adjustments (Add / Remove)</h3>
                      <p style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Add extra charges (positive) or discounts (negative) to this bill</p>
                    </div>
                    <div style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', gap: 10, marginBottom: customItems.length > 0 ? 16 : 0, flexWrap: 'wrap' }}>
                        <input placeholder="Item Description (e.g., Uniform, Waiver)" value={newItemName} onChange={e => setNewItemName(e.target.value)} style={{ flex: 1, minWidth: 200, padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none' }} />
                        <input placeholder="Amount (GH₵)" type="number" step="0.01" value={newItemAmount} onChange={e => setNewItemAmount(e.target.value)} style={{ width: 140, padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none' }} />
                        <button onClick={() => { 
                          if(!newItemName || !newItemAmount) return; 
                          setCustomItems(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), name: newItemName, amount: parseFloat(newItemAmount) }]); 
                          setNewItemName(''); 
                          setNewItemAmount(''); 
                        }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px', height: 40, borderRadius: 8, border: 'none', background: '#16a34a', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          <Plus size={14} /> Add
                        </button>
                      </div>
                      
                      {customItems.length > 0 && (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <tbody>
                            {customItems.map(item => (
                              <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '10px 0', fontSize: 13, color: '#374151' }}>{item.name}</td>
                                <td style={{ padding: '10px 0', fontSize: 13, fontWeight: 700, color: item.amount > 0 ? '#dc2626' : '#16a34a', textAlign: 'right' }}>
                                  {item.amount > 0 ? '+' : ''}{GHS(item.amount)}
                                </td>
                                <td style={{ padding: '10px 0', width: 40, textAlign: 'right' }}>
                                  <button onClick={() => setCustomItems(prev => prev.filter(i => i.id !== item.id))} style={{ background: '#fef2f2', border: 'none', color: '#dc2626', cursor: 'pointer', width: 28, height: 28, borderRadius: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Trash2 size={13} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>

                </>
              )}
            </div>
          )}

          {/* Empty state when no student selected */}
          {!selectedStudentId && (
            <div style={{ display: 'none' }} /> // Single column mode — student list fills the space
          )}
        </div>
      </div>
    </>
  )
}
