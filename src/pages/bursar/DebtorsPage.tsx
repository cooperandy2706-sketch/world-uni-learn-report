// src/pages/bursar/DebtorsPage.tsx
import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useClasses } from '../../hooks/useClasses'
import { useCurrentTerm, useCurrentAcademicYear } from '../../hooks/useSettings'
import { supabase } from '../../lib/supabase'
import { feeStructuresService, feePaymentsService, scholarshipService } from '../../services/bursar.service'
import { Printer, AlertCircle, CheckCircle2, Filter, FileText, GraduationCap, Search, Award } from 'lucide-react'
import { ROUTES } from '../../constants/routes'
import Modal from '../../components/ui/Modal'
import toast from 'react-hot-toast'

const GHS = (n: number) => `GH₵ ${Number(n).toLocaleString('en-GH', { minimumFractionDigits: 2 })}`

export default function DebtorsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const schoolId = user?.school_id ?? ''
  const { data: term } = useCurrentTerm()
  const { data: year } = useCurrentAcademicYear()
  const { data: classes = [] } = useClasses()
  const [selectedClass, setSelectedClass] = useState('')
  const [filter, setFilter] = useState<'all' | 'debtors' | 'paid' | 'scholarship'>('all')
  const [searchQ, setSearchQ] = useState('')



  // staleTime: 0 — always refetch when navigating back from a different term
  // so that fees_arrears is never served from stale cache.
  const { data: students = [] } = useQuery({
    queryKey: ['students-class-debt', selectedClass, schoolId],
    queryFn: async () => {
      let q = supabase.from('students').select('id, full_name, student_id, scholarship_type, scholarship_percentage, fees_arrears, daily_fee_mode, class:classes(id,name)').eq('school_id', schoolId).eq('is_active', true).order('full_name')
      if (selectedClass) q = q.eq('class_id', selectedClass)
      const { data } = await q
      return data ?? []
    },
    enabled: !!schoolId,
    staleTime: 0,
  })

  const { data: structures = [] } = useQuery({
    queryKey: ['fee-structures', schoolId, term?.id],
    queryFn: async () => { const { data } = await feeStructuresService.getAll(schoolId, term?.id); return data ?? [] },
    enabled: !!schoolId,
  })

  const { data: payments = [] } = useQuery({
    queryKey: ['fee-payments', schoolId, term?.id],
    queryFn: async () => { const { data } = await feePaymentsService.getAll(schoolId, term?.id); return data ?? [] },
    enabled: !!schoolId,
  })

  // Daily fee data
  const { data: dailyConfigData = [] } = useQuery({
    queryKey: ['daily-fee-class-rates-debt', schoolId, term?.id],
    queryFn: async () => { const { data } = await supabase.from('daily_fee_class_rates').select('*').eq('school_id', schoolId).eq('term_id', term!.id); return data ?? [] },
    enabled: !!schoolId && !!term?.id,
  })

  const { data: dailyCollections = [] } = useQuery({
    queryKey: ['daily-collections-all', schoolId, term?.id],
    queryFn: async () => { const { data } = await supabase.from('daily_fees_collected').select('student_id, amount, fee_type').eq('school_id', schoolId).eq('term_id', term!.id); return data ?? [] },
    enabled: !!schoolId && !!term?.id,
  })

  // Attendance for dynamic billing
  const { data: attendance = [] } = useQuery({
    queryKey: ['attendance-debt', schoolId, term?.id],
    queryFn: async () => { const { data } = await supabase.from('attendance').select('student_id, days_present').eq('school_id', schoolId).eq('term_id', term!.id); return data ?? [] },
    enabled: !!schoolId && !!term?.id,
  })

  // Compute fee structures by class
  const structuresByClass = useMemo(() => {
    const map: Record<string, number> = {}
    for (const s of structures as any[]) {
      map[s.class_id] = (map[s.class_id] || 0) + (s.amount || 0)
    }
    return map
  }, [structures])

  // Map student id -> total paid
  const paidByStudent = useMemo(() => {
    const map: Record<string, number> = {}
    for (const p of (payments as any[])) {
      map[p.student_id] = (map[p.student_id] || 0) + (p.amount_paid || 0)
    }
    return map
  }, [payments])

  // Daily fees paid per student
  const dailyPaidByStudent = useMemo(() => {
    const map: Record<string, { feeding: number; studies: number }> = {}
    for (const c of dailyCollections as any[]) {
      if (!map[c.student_id]) map[c.student_id] = { feeding: 0, studies: 0 }
      if (c.fee_type === 'feeding') map[c.student_id].feeding += Number(c.amount)
      else if (c.fee_type === 'studies') map[c.student_id].studies += Number(c.amount)
    }
    return map
  }, [dailyCollections])

  const attendanceMap = useMemo(() => {
    const map: Record<string, number> = {}
    for (const a of attendance as any[]) {
      map[a.student_id] = a.days_present || 0
    }
    return map
  }, [attendance])

  const dailyRatesMap = useMemo(() => {
    const map: Record<string, { f: number, s: number }> = {}
    for (const r of dailyConfigData as any[]) map[r.class_id] = { f: Number(r.expected_feeding_fee || 0), s: Number(r.expected_studies_fee || 0) }
    return map
  }, [dailyConfigData])

  const rows = useMemo(() => (students as any[]).map((s: any) => {
    const classId = s.class?.id || ''
    const classFee = structuresByClass[classId] || 0
    const scholarshipPct = s.scholarship_percentage || 0
    const scholarshipDiscount = classFee * (scholarshipPct / 100)
    const netTuition = classFee - scholarshipDiscount

    const tuitionPaid = paidByStudent[s.id] || 0
    const tuitionOwed = Math.max(0, netTuition - tuitionPaid)

    const daysPresent = attendanceMap[s.id] || 0
    const classRates = dailyRatesMap[classId] || { f: 0, s: 0 }
    const feeMode = s.daily_fee_mode || 'all'
    
    const expectedFeeding = feeMode === 'none' ? 0 : classRates.f * daysPresent
    const expectedStudies = (feeMode === 'none' || feeMode === 'feeding') ? 0 : classRates.s * daysPresent

    const daily = dailyPaidByStudent[s.id] || { feeding: 0, studies: 0 }
    const feedingOwed = Math.max(0, expectedFeeding - daily.feeding)
    const studiesOwed = Math.max(0, expectedStudies - daily.studies)
    const dailyOwed = feedingOwed + studiesOwed

    const feesArrears = Number(s.fees_arrears || 0)
    const totalOwed = feesArrears + tuitionOwed + dailyOwed
    const totalPaid = tuitionPaid + daily.feeding + daily.studies
    const status = totalOwed === 0 ? 'paid' : totalPaid === 0 && feesArrears === 0 ? 'unpaid' : 'partial'

    return { ...s, tuitionPaid, tuitionOwed, netTuition, scholarshipPct, dailyOwed, feedingOwed, studiesOwed, totalPaid, totalOwed, feesArrears, status }
  }), [students, structuresByClass, paidByStudent, dailyPaidByStudent, dailyRatesMap, attendanceMap])

  const searched = useMemo(() => {
    if (!searchQ) return rows
    const q = searchQ.toLowerCase()
    return rows.filter(r => r.full_name.toLowerCase().includes(q) || (r.student_id && r.student_id.toLowerCase().includes(q)))
  }, [rows, searchQ])

  const filtered = searched.filter(r =>
    filter === 'all' ? true :
    filter === 'debtors' ? r.status !== 'paid' :
    filter === 'scholarship' ? r.scholarship_type && r.scholarship_type !== 'none' :
    r.status === 'paid'
  )

  const totalOwed = rows.filter(r => r.status !== 'paid').reduce((s, r) => s + r.totalOwed, 0)
  const totalCollected = rows.reduce((s, r) => s + r.totalPaid, 0)
  const debtorCount = rows.filter(r => r.status !== 'paid').length
  const paidCount = rows.filter(r => r.status === 'paid').length
  const scholarshipCount = rows.filter(r => r.scholarship_type && r.scholarship_type !== 'none').length

  function printDebtors() {
    const cls = (classes as any[]).find((c: any) => c.id === selectedClass)
    const win = window.open('', '_blank', 'width=800,height=700')
    if (!win) return
    const tbody = filtered.map(r => {
      const schBadge = r.scholarship_type && r.scholarship_type !== 'none'
        ? ' <span style="background:#f0fdf4;color:#16a34a;padding:1px 6px;border-radius:99px;font-size:9px;font-weight:700">' + (r.scholarship_type === 'full' ? 'FULL' : r.scholarshipPct + '%') + '</span>' : ''
      return '<tr><td>' + r.full_name + schBadge + '</td><td>' + (r.student_id ?? '\u2014') + '</td><td>' + ((r.class as any)?.name ?? '\u2014') + '</td><td style="color:' + (r.feesArrears > 0 ? '#dc2626' : '#374151') + '">' + GHS(r.feesArrears) + '</td><td>' + GHS(r.totalPaid) + '</td><td>' + GHS(r.tuitionOwed) + '</td><td>' + GHS(r.dailyOwed) + '</td><td style="font-weight:800;color:' + (r.totalOwed > 0 ? '#dc2626' : '#16a34a') + '">' + GHS(r.totalOwed) + '</td><td><span style="background:' + (r.status === 'paid' ? '#f0fdf4' : r.status === 'partial' ? '#fef3c7' : '#fef2f2') + ';color:' + (r.status === 'paid' ? '#16a34a' : r.status === 'partial' ? '#92400e' : '#dc2626') + ';padding:2px 8px;border-radius:99px;font-weight:700;font-size:11px">' + r.status.toUpperCase() + '</span></td></tr>'
    }).join('')
    const html = [
      '<!DOCTYPE html><html><head><title>Debtors List</title>',
      '<style>body{font-family:system-ui,sans-serif;padding:24px}h1{font-size:20px;margin-bottom:4px}',
      'table{width:100%;border-collapse:collapse;margin-top:16px}th{background:#f8fafc;padding:9px 12px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#374151;border-bottom:2px solid #e2e8f0}',
      'td{padding:9px 12px;font-size:12px;border-bottom:1px solid #f1f5f9}tr:nth-child(even){background:#fafafa}',
      '.summary{display:flex;gap:16px;margin-bottom:16px;flex-wrap:wrap}.sum-card{background:#f8fafc;border-radius:8px;padding:12px;flex:1;min-width:120px}',
      '.sum-val{font-size:20px;font-weight:800;color:#dc2626}.sum-label{font-size:11px;color:#6b7280}</style></head>',
      '<body onload="window.print()">',
      '<h1>Debtors List' + (cls ? ' \u2014 ' + cls.name : '') + '</h1>',
      '<p style="color:#6b7280;font-size:12px">' + (term?.name ?? '') + ' \u00B7 Printed ' + new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) + '</p>',
      '<div class="summary">',
      '<div class="sum-card"><div class="sum-val">' + debtorCount + '</div><div class="sum-label">Total Debtors</div></div>',
      '<div class="sum-card"><div class="sum-val" style="color:#dc2626">' + GHS(totalOwed) + '</div><div class="sum-label">Total Outstanding</div></div>',
      '<div class="sum-card"><div class="sum-val" style="color:#16a34a">' + GHS(totalCollected) + '</div><div class="sum-label">Total Collected</div></div>',
      '</div>',
      '<table><thead><tr><th>Student</th><th>ID</th><th>Class</th><th>Arrears</th><th>Paid</th><th>Tuition Owed</th><th>Daily Owed</th><th>Total Debt</th><th>Status</th></tr></thead><tbody>' + tbody + '</tbody></table>',
      '</body></html>',
    ].join('\n')
    win.document.write(html)
    win.document.close()
  }

  const statusInfo: Record<string, { label: string; color: string; bg: string }> = {
    paid:    { label: 'Paid',    color: '#16a34a', bg: '#f0fdf4' },
    partial: { label: 'Partial', color: '#d97706', bg: '#fffbeb' },
    unpaid:  { label: 'Unpaid',  color: '#dc2626', bg: '#fef2f2' },
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');
        @keyframes _dbt_fi { from{opacity:0} to{opacity:1} }
        .dbt-row { transition: background .12s; }
        .dbt-row:hover { background: #faf5ff !important; }
      `}</style>

      <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif', animation: '_dbt_fi .4s ease' }}>
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>Debtors & Fee Status</h1>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 3 }}>Consolidated debt tracking — tuition + daily fees · {term?.name ?? 'No active term'}</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => navigate(ROUTES.BURSAR_STUDENTS)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 9, border: 'none', background: '#f5f3ff', color: '#6d28d9', fontSize: 13, fontWeight: 700, cursor: 'pointer', borderBottom: '2px solid #ddd6fe' }}>
              <Award size={16} /> Manage Student Financials
            </button>
            <button onClick={printDebtors} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 9, border: 'none', background: '#1e0646', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Printer size={14} /> Print Debtors List
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 22 }}>
          {[
            { label: 'Total Students', value: rows.length, color: '#7c3aed', icon: '👥' },
            { label: 'Fully Paid', value: paidCount, color: '#16a34a', icon: '✅' },
            { label: 'Debtors', value: debtorCount, color: '#dc2626', icon: '⚠️' },
            { label: 'Scholarship', value: scholarshipCount, color: '#059669', icon: '🎓' },
            { label: 'Total Collected', value: GHS(totalCollected), color: '#16a34a', icon: '💰' },
            { label: 'Outstanding Debt', value: GHS(totalOwed), color: '#dc2626', icon: '📉' },
          ].map(c => (
            <div key={c.label} style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', border: '1.5px solid #f0eefe', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{c.icon}</div>
              <div style={{ fontSize: 19, fontWeight: 800, color: c.color, fontFamily: '"Playfair Display",serif' }}>{c.value}</div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 3, fontWeight: 600 }}>{c.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '14px 18px', border: '1.5px solid #f0eefe', marginBottom: 18, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b7280', fontSize: 13 }}><Filter size={14} /> Filters:</div>
          <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', fontFamily: '"DM Sans",sans-serif' }}>
            <option value="">All Classes</option>
            {(classes as any[]).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div style={{ display: 'flex', background: '#f5f3ff', borderRadius: 9, padding: 3, gap: 2 }}>
            {(['all', 'debtors', 'paid', 'scholarship'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 12px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: filter === f ? '#6d28d9' : 'transparent', color: filter === f ? '#fff' : '#6b7280', fontFamily: '"DM Sans",sans-serif' }}>
                {f === 'all' ? 'All' : f === 'debtors' ? 'Debtors' : f === 'scholarship' ? '🎓 Scholarship' : 'Paid'}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fafafa', marginLeft: 'auto' }}>
            <Search size={12} color="#9ca3af" />
            <input placeholder="Search student..." value={searchQ} onChange={e => setSearchQ(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: 12, background: 'transparent', fontFamily: '"DM Sans",sans-serif', width: 120 }} />
          </div>
        </div>

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: 18, border: '1.5px solid #f0eefe', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
              {rows.length === 0 ? 'Select a class or add students to see fee status' : 'No students match this filter'}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg,#faf5ff,#f5f3ff)' }}>
                    {['Student', 'ID', 'Class', 'Arrears', 'Total Paid', 'Tuition Owed', 'Daily Owed', 'Total Debt', 'Status', ''].map(h => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const si = statusInfo[r.status]
                    return (
                      <tr key={r.id} className="dbt-row" style={{ borderBottom: '1px solid #faf5ff' }}>
                        <td style={{ padding: '11px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {r.status === 'paid'
                              ? <CheckCircle2 size={15} color="#16a34a" />
                              : <AlertCircle size={15} color={r.status === 'partial' ? '#d97706' : '#dc2626'} />}
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 5 }}>
                                {r.full_name}
                                {r.scholarship_type && r.scholarship_type !== 'none' && (
                                  <span style={{ fontSize: 9, fontWeight: 800, background: '#f0fdf4', color: '#16a34a', padding: '1px 5px', borderRadius: 99, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                                    <GraduationCap size={9} /> {r.scholarship_type === 'full' ? 'Full' : r.scholarshipPct + '%'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '11px 14px' }}><span style={{ fontSize: 11, fontFamily: 'monospace', background: '#f5f3ff', color: '#6d28d9', padding: '2px 7px', borderRadius: 5 }}>{r.student_id ?? '—'}</span></td>
                        <td style={{ padding: '11px 14px' }}><span style={{ fontSize: 11, background: '#ede9fe', color: '#5b21b6', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>{(r.class as any)?.name ?? '—'}</span></td>
                        <td style={{ padding: '11px 14px', fontSize: 12, fontWeight: 700, color: r.feesArrears > 0 ? '#dc2626' : '#9ca3af' }}>{GHS(r.feesArrears)}</td>
                        <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 700, color: '#16a34a' }}>{GHS(r.totalPaid)}</td>
                        <td style={{ padding: '11px 14px', fontSize: 12, fontWeight: 700, color: r.tuitionOwed > 0 ? '#dc2626' : '#9ca3af' }}>{GHS(r.tuitionOwed)}</td>
                        <td style={{ padding: '11px 14px', fontSize: 12, fontWeight: 700, color: r.dailyOwed > 0 ? '#d97706' : '#9ca3af' }}>{GHS(r.dailyOwed)}</td>
                        <td style={{ padding: '11px 14px', fontSize: 14, fontWeight: 900, color: r.totalOwed > 0 ? '#dc2626' : '#16a34a' }}>{GHS(r.totalOwed)}</td>
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, background: si.bg, color: si.color, padding: '3px 10px', borderRadius: 99 }}>{si.label}</span>
                        </td>
                        <td style={{ padding: '11px 14px' }}>
                          <button onClick={() => navigate(ROUTES.BURSAR_BILL_SHEET)} title="View Bill Sheet" style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: '#f5f3ff', color: '#6d28d9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}>
                            <FileText size={13} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#faf5ff', borderTop: '2px solid #ede9fe' }}>
                    <td colSpan={3} style={{ padding: '12px 14px', fontSize: 12, fontWeight: 800, color: '#6d28d9' }}>TOTALS ({filtered.length} students)</td>
                    <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 800, color: '#dc2626' }}>{GHS(filtered.reduce((s, r) => s + r.feesArrears, 0))}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 900, color: '#16a34a' }}>{GHS(filtered.reduce((s, r) => s + r.totalPaid, 0))}</td>
                    <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 800, color: '#dc2626' }}>{GHS(filtered.reduce((s, r) => s + r.tuitionOwed, 0))}</td>
                    <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 800, color: '#d97706' }}>{GHS(filtered.reduce((s, r) => s + r.dailyOwed, 0))}</td>
                    <td style={{ padding: '12px 14px', fontSize: 14, fontWeight: 900, color: '#dc2626' }}>{GHS(filtered.reduce((s, r) => s + r.totalOwed, 0))}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>

    </>
  )
}
