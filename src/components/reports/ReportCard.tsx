// src/components/reports/ReportCard.tsx — A4 optimised, font-12, attendance editable
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { getGradeInfo } from '../../utils/grading'
import { ordinal, formatDate } from '../../lib/utils'
import { TEACHER_REMARKS, HEADTEACHER_REMARKS } from '../../constants/remarks'
import { GRADE_SCALE } from '../../constants/grading'
import toast from 'react-hot-toast'

interface ReportCardProps {
  report: any
  school: any
  term: any
  year: any
  settings: any
  readonly?: boolean
  isBW?: boolean
  setIsBW?: (val: boolean) => void
  showOverallPosition?: boolean
  onToggleOverallPosition?: (val: boolean) => void
  hideSettings?: boolean
  onRemarksUpdate?: (remarks: { class_teacher_remarks?: string; headteacher_remarks?: string }) => void
  // Pre-loaded data — when provided the component uses these directly instead of fetching
  scores?: any[]
  attendance?: any
  categories?: any[]
}

export default function ReportCard({
  report, school, term, year, settings, readonly,
  isBW: isBWProp, setIsBW: setIsBWProp,
  showOverallPosition = true, onToggleOverallPosition,
  hideSettings = false,
  onRemarksUpdate,
  scores: scoresProp,
  attendance: attendanceProp,
  categories,
}: ReportCardProps) {
  // Use pre-loaded props as initial state when provided (e.g. from ReportsPage)
  const [scores, setScores] = useState<any[]>(scoresProp ?? [])
  const [attendance, setAttendance] = useState<any>(attendanceProp ?? null)
  const [teacherRemark, setTeacherRemark] = useState(report?.class_teacher_remarks ?? '')
  const [htRemark, setHtRemark] = useState(report?.headteacher_remarks ?? '')
  const [attEdit, setAttEdit] = useState({ total_days: '', days_present: '', days_absent: '' })
  const [savingAtt, setSavingAtt] = useState(false)
  const [studentFees, setStudentFees] = useState<any>(null)
  const [isBWInternal, setIsBWInternal] = useState(false)
  const isBW = isBWProp ?? isBWInternal
  const setIsBW = setIsBWProp ?? setIsBWInternal

  // Sync scores/attendance when the parent passes new data (e.g. navigating students)
  useEffect(() => {
    if (scoresProp) setScores(scoresProp)
  }, [scoresProp])

  useEffect(() => {
    if (attendanceProp !== undefined) {
      setAttendance(attendanceProp)
      if (attendanceProp) {
        setAttEdit({
          total_days: attendanceProp.total_days ?? '',
          days_present: attendanceProp.days_present ?? '',
          days_absent: attendanceProp.days_absent ?? '',
        })
      }
    }
  }, [attendanceProp])

  useEffect(() => {
    setTeacherRemark(report?.class_teacher_remarks ?? '')
    setHtRemark(report?.headteacher_remarks ?? '')
  }, [report?.id])

  useEffect(() => {
    // Only fetch from DB if no scores were passed as props
    if (report?.student_id && report?.term_id && !scoresProp) load()
    // Always fetch student fees (not passed as a prop)
    if (report?.student_id) loadFees()
  }, [report?.student_id, report?.term_id])

  async function load() {
    const [{ data: sc }, { data: att }] = await Promise.all([
      supabase.from('scores').select('*, subject:subjects(id,name,code)')
        .eq('student_id', report.student_id).eq('term_id', report.term_id).order('subject(name)'),
      supabase.from('attendance').select('*')
        .eq('student_id', report.student_id).eq('term_id', report.term_id).maybeSingle(),
    ])
    setScores(sc ?? [])
    setAttendance(att)
    if (att) {
      setAttEdit({ total_days: att.total_days ?? '', days_present: att.days_present ?? '', days_absent: att.days_absent ?? '' })
    }
  }

  async function loadFees() {
    const { data: sf } = await supabase
      .from('students').select('fees_amount,fees_paid,fees_arrears,other_fees')
      .eq('id', report.student_id).maybeSingle()
    setStudentFees(sf)
  }

  async function saveAttendance() {
    if (!attEdit.total_days || !attEdit.days_present) { toast.error('Enter total days and days present'); return }
    setSavingAtt(true)
    const absent = Number(attEdit.total_days) - Number(attEdit.days_present)
    const payload = {
      student_id: report.student_id,
      term_id: report.term_id,
      total_days: Number(attEdit.total_days),
      days_present: Number(attEdit.days_present),
      days_absent: absent,
    }
    const { error } = attendance
      ? await supabase.from('attendance').update(payload).eq('id', attendance.id)
      : await supabase.from('attendance').insert(payload)
    setSavingAtt(false)
    if (error) { toast.error(error.message); return }
    toast.success('Attendance saved')
    await load()
  }

  function fireRemarks() {
    onRemarksUpdate?.({ class_teacher_remarks: teacherRemark, headteacher_remarks: htRemark })
  }

  const student = report?.student
  const classInfo = student?.class
  const validScores = scores.filter(r => (r.total_score ?? 0) > 0 || r.class_score != null)
  const totalMarks = scores.reduce((s, r) => s + (r.total_score ?? 0), 0)
  // Compute avg from live scores — fall back to report?.average_score if scores not yet loaded
  const avg = validScores.length > 0
    ? parseFloat((validScores.reduce((s, r) => s + (r.total_score ?? 0), 0) / validScores.length).toFixed(2))
    : (report?.average_score ?? 0)
  const overallGrade = getGradeInfo(avg)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        .rc-wrap { font-family:'DM Sans',sans-serif; font-size:13.5px; color:#000; background:#fff; max-width:800px; margin:0 auto; padding:12px 16px; box-sizing:border-box; line-height:1.4; }
        .rc-table { width:100%; border-collapse:collapse; border: ${isBW ? '1px solid #000' : 'none'}; }
        .rc-table th { background: ${isBW ? '#f1f5f9' : '#1e3a8a'}; color: ${isBW ? '#000' : '#fff'}; padding:6px 8px; text-align:left; font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; white-space:nowrap; border: ${isBW ? '1px solid #000' : 'none'}; }
        .rc-table td { padding:5px 8px; border-bottom: ${isBW ? '1px solid #000' : '.5px solid #e2e8f0'}; font-size:12px; color:#000; border-right: ${isBW ? '1px solid #000' : 'none'}; }
        .rc-table td:last-child { border-right:none; }
        .rc-table tr:nth-child(even) td { background: ${isBW ? 'none' : '#f8fafc'}; }
        .rc-select { border:1px solid #e2e8f0; border-radius:5px; padding:3px 6px; font-size:12px; font-family:'DM Sans',sans-serif; width:100%; background:#fff; color:#000; }
        .rc-att-input { border:1.5px solid #7c3aed; border-radius:6px; padding:4px 8px; font-size:12px; font-family:'DM Sans',sans-serif; width:70px; text-align:center; outline:none; }
        .rc-bw-toggle { display:inline-flex; align-items:center; gap:8px; background:#f8fafc; border:1px solid #e2e8f0; padding:6px 14px; borderRadius:8px; cursor:pointer; font-size:12px; font-weight:600; transition:all .2s; }
        .rc-bw-toggle:hover { background: #f1f5f9; }
        @media print {
          @page { size:A4 portrait; margin:8mm 8mm 8mm 8mm; }
          html,body { margin:0 !important; padding:0 !important; -webkit-print-color-adjust: exact; }
          .rc-wrap { width:194mm !important; max-width:194mm !important; padding:0 !important; margin:0 !important; font-size:11.5px !important; ${isBW ? 'filter: grayscale(100%) !important;' : ''} }
          .rc-section-gap { margin-bottom:6px !important; }
          .rc-table td,.rc-table th { padding:4px 6px !important; }
          .rc-table td { font-size:10.5px !important; }
          .rc-table th { font-size:9px !important; }
          .no-print { display:none !important; }
          .rc-att-input { border:none !important; background:transparent !important; font-size:11px !important; }
          .rc-summary-tile { padding:6px 10px !important; }
          .rc-big { font-size:14px !important; }
        }
      `}</style>

      <div className="rc-wrap">

        {/* ── PRINT SETTINGS ── */}
        {!hideSettings && (
          <div className="no-print" data-html2canvas-ignore="true" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e3a8a' }}>🖨️ Print Settings</div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <label className="rc-bw-toggle">
                <input type="checkbox" checked={showOverallPosition} onChange={e => onToggleOverallPosition?.(e.target.checked)} />
                <span>Show Rank / Position</span>
              </label>
              <label className="rc-bw-toggle">
                <input type="checkbox" checked={isBW} onChange={e => setIsBW(e.target.checked)} />
                <span>Black & White Mode</span>
              </label>
            </div>
          </div>
        )}

        {/* ── HEADER ── */}
        <div className="rc-section-gap" style={{ textAlign: 'center', borderBottom: isBW ? '3px solid #000' : '2.5px solid #1e3a8a', paddingBottom: 10, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            {school?.logo_url
              ? <img src={school.logo_url} alt="logo" style={{ height: 52, width: 52, objectFit: 'contain', flexShrink: 0, filter: isBW ? 'grayscale(100%)' : 'none' }} />
              : <div style={{ width: 48, height: 48, borderRadius: '50%', background: isBW ? '#f1f5f9' : '#eff6ff', border: isBW ? '1px solid #000' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🏫</div>
            }
            <div>
              <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 20, fontWeight: 700, color: isBW ? '#000' : '#1e3a8a', lineHeight: 1.2 }}>
                {school?.name ?? 'School Name'}
              </div>
              {school?.motto && <div style={{ fontSize: 11, color: isBW ? '#000' : '#64748b', fontStyle: 'italic', marginTop: 1 }}>{school.motto}</div>}
              {school?.address && <div style={{ fontSize: 10.5, color: isBW ? '#000' : '#64748b' }}>{school.address}</div>}
              {school?.phone && <div style={{ fontSize: 10.5, color: isBW ? '#000' : '#64748b' }}>Tel: {school.phone}</div>}
            </div>
          </div>
          <div style={{ marginTop: 10, background: isBW ? '#000' : '#1e3a8a', color: '#fff', padding: '5px 0', borderRadius: 3, fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>
            Student Report Card — {(term as any)?.name} &nbsp;·&nbsp; {(year as any)?.name}
          </div>
        </div>

        {/* ── STUDENT INFO ── */}
        <div className="rc-section-gap" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px 16px', marginBottom: 10, padding: '8px 12px', background: isBW ? 'none' : '#f8fafc', borderRadius: 6, border: isBW ? '1px solid #000' : '.5px solid #e2e8f0' }}>
          {[
            { label: 'Student Name', value: student?.full_name ?? '—' },
            { label: 'Student ID', value: student?.student_id ?? '—' },
            { label: 'Class', value: classInfo?.name ?? '—' },
            { label: 'Gender', value: student?.gender ?? '—' },
            { label: 'House', value: student?.house ?? '—' },
            { label: 'Date of Birth', value: formatDate(student?.date_of_birth) ?? '—' },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', gap: 4, alignItems: 'baseline' }}>
              <span style={{ fontSize: 11, color: isBW ? '#000' : '#64748b', fontWeight: 700, flexShrink: 0, minWidth: 82 }}>{label}:</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#000' }}>{value}</span>
            </div>
          ))}
        </div>

        {/* ── ATTENDANCE ── */}
        <div className="rc-section-gap" style={{ marginBottom: 10, padding: '7px 12px', background: isBW ? 'none' : '#eff6ff', borderRadius: 6, border: isBW ? '1px solid #000' : '.5px solid #dbeafe' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: isBW ? '#000' : '#1e40af', textTransform: 'uppercase', letterSpacing: '.05em' }}>Attendance</span>
            {attendance ? (
              <div style={{ display: 'flex', gap: 16, fontSize: 12, fontWeight: 700 }}>
                <span>Total Days: <strong>{attendance.total_days}</strong></span>
                <span>Present: <strong style={{ color: isBW ? '#000' : '#16a34a' }}>{attendance.days_present}</strong></span>
                <span>Absent: <strong style={{ color: isBW ? '#000' : '#dc2626' }}>{attendance.days_absent}</strong></span>
              </div>
            ) : (
              <span style={{ fontSize: 11, color: '#94a3b8' }}>Not recorded</span>
            )}
            {!readonly && (
              <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <input className="rc-att-input" type="number" placeholder="Total days"
                  value={attEdit.total_days}
                  onChange={e => setAttEdit(a => ({ ...a, total_days: e.target.value, days_absent: String(Number(e.target.value) - Number(a.days_present)) }))} />
                <input className="rc-att-input" type="number" placeholder="Days present"
                  value={attEdit.days_present}
                  onChange={e => setAttEdit(a => ({ ...a, days_present: e.target.value, days_absent: String(Number(a.total_days) - Number(e.target.value)) }))} />
                <span style={{ fontSize: 11, color: '#1e40af' }}>Absent: <strong>{attEdit.days_absent || 0}</strong></span>
                <button onClick={saveAttendance} disabled={savingAtt}
                  style={{ padding: '3px 10px', borderRadius: 6, border: 'none', background: '#1e3a8a', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  {savingAtt ? '…' : 'Save'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── SCORES TABLE ── */}
        <div className="rc-section-gap" style={{ marginBottom: 8 }}>
          <table className="rc-table">
            <thead>
              <tr>
                <th>Subject</th>
                {(categories && categories.length > 0 ? categories : [
                  { id: 'cs', name: 'Class Score', weight_percentage: 30, max_score: 30 },
                  { id: 'es', name: 'Exam Score', weight_percentage: 70, max_score: 70 }
                ]).map((c: any) => (
                  <th key={c.id} style={{ textAlign: 'center', width: 70 }}>
                    {c.name}<br /><span style={{ fontSize: 9, opacity: .9 }}>({c.weight_percentage}%)</span>
                  </th>
                ))}
                <th style={{ textAlign: 'center', width: 60 }}>Total</th>
                <th style={{ textAlign: 'center', width: 50 }}>Grade</th>
                {showOverallPosition && <th style={{ textAlign: 'center', width: 65 }}>Position</th>}
                <th>Teacher's Remarks</th>
              </tr>
            </thead>
            <tbody>
              {scores.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: '#94a3b8', padding: 14 }}>No scores entered yet</td></tr>
              ) : scores.map(s => {
                const g = getGradeInfo(s.total_score ?? 0)
                return (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 700 }}>{s.subject?.name}</td>
                    {(categories && categories.length > 0 ? categories : [
                      { id: 'cs', name: 'Class Score' },
                      { id: 'es', name: 'Exam Score' }
                    ]).map((c: any) => {
                      let val = '—'
                      if (s.category_scores && s.category_scores[c.id] !== undefined && s.category_scores[c.id] !== '') {
                        val = s.category_scores[c.id]
                      } else {
                        if (c.id === 'cs') val = s.class_score ?? '—'
                        if (c.id === 'es') val = s.exam_score ?? '—'
                      }
                      return (
                        <td key={c.id} style={{ textAlign: 'center' }}>{val}</td>
                      )
                    })}
                    <td style={{ textAlign: 'center', fontWeight: 800, color: (isBW) ? '#000' : ((s.total_score ?? 0) >= 50 ? '#15803d' : '#dc2626') }}>
                      {s.total_score?.toFixed(1) ?? '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ fontWeight: 800, color: isBW ? '#000' : g.color, background: isBW ? '#f1f5f9' : g.color + '18', padding: '2px 6px', borderRadius: 4, fontSize: 12, border: isBW ? '1px solid #000' : 'none' }}>{g.grade}</span>
                    </td>
                    {showOverallPosition && <td style={{ textAlign: 'center', fontSize: 11, fontWeight: 700 }}>{s.position ? ordinal(s.position) : '—'}</td>}
                    <td style={{ fontSize: 11, color: isBW ? '#000' : '#475569' }}>{s.teacher_remarks ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* ── SUMMARY TILES ── */}
        <div className="rc-section-gap" style={{ display: 'grid', gridTemplateColumns: `repeat(${showOverallPosition ? 4 : 3}, 1fr)`, gap: 8, marginBottom: 8 }}>
          {[
            { label: 'Total Marks', value: totalMarks.toFixed(1) },
            { label: 'Average Score', value: `${avg.toFixed(1)}%` },
            ...(showOverallPosition ? [{ label: 'Overall Position', value: report?.overall_position ? `${ordinal(report.overall_position)} / ${report.total_students}` : '—' }] : []),
            { label: 'Overall Grade', value: `${overallGrade.grade} — ${overallGrade.label}` },
          ].map(({ label, value }) => (
            <div key={label} className="rc-summary-tile" style={{ background: isBW ? 'none' : '#f8fafc', border: isBW ? '1px solid #000' : '.5px solid #e2e8f0', borderRadius: 6, padding: '8px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: isBW ? '#000' : '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 2 }}>{label}</div>
              <div className="rc-big" style={{ fontFamily: '"Playfair Display",serif', fontSize: 17, fontWeight: 800, color: isBW ? '#000' : '#1e3a8a' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* ── GRADING KEY ── */}
        <div className="rc-section-gap" style={{ marginBottom: 8, padding: '5px 10px', background: '#f8fafc', borderRadius: 5, border: '.5px solid #e2e8f0' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: isBW ? '#000' : '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Grading Scale</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {GRADE_SCALE.map(g => (
              <span key={g.grade} style={{ fontSize: 11.5, color: '#000' }}>
                <strong style={{ color: isBW ? '#000' : g.color }}>{g.grade}</strong>: {g.min}–{g.max} ({g.label})
              </span>
            ))}
          </div>
        </div>

        {/* ── REMARKS ── */}
        <div className="rc-section-gap" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
          <div style={{ border: isBW ? '1px solid #000' : '.5px solid #e2e8f0', borderRadius: 6, padding: '10px 12px' }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: isBW ? '#000' : '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Class Teacher's Remarks</div>
            {readonly
              ? <p style={{ fontSize: 12.5, fontWeight: 700, color: '#000', minHeight: 20, margin: 0 }}>{teacherRemark || '—'}</p>
              : <select className="rc-select no-print" value={teacherRemark}
                onChange={e => setTeacherRemark(e.target.value)}
                onBlur={fireRemarks}>
                <option value="">Select remark…</option>
                {TEACHER_REMARKS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            }
            <div style={{ marginTop: 14, borderTop: '.5px solid #e2e8f0', paddingTop: 5, fontSize: 10, color: '#94a3b8' }}>
              Signature: &nbsp;___________________________ &nbsp;&nbsp; Date: ___________
            </div>
          </div>
          <div style={{ border: isBW ? '1px solid #000' : '.5px solid #e2e8f0', borderRadius: 6, padding: '10px 12px' }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: isBW ? '#000' : '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Headteacher's Remarks</div>
            {readonly
              ? <p style={{ fontSize: 12.5, fontWeight: 700, color: '#000', minHeight: 20, margin: 0 }}>{htRemark || '—'}</p>
              : <select className="rc-select no-print" value={htRemark}
                onChange={e => setHtRemark(e.target.value)}
                onBlur={fireRemarks}>
                <option value="">Select remark…</option>
                {HEADTEACHER_REMARKS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            }
            <div style={{ marginTop: 14, borderTop: isBW ? '1px solid #000' : '.5px solid #e2e8f0', paddingTop: 5, fontSize: 11, color: isBW ? '#000' : '#94a3b8', fontWeight: 600 }}>
              {school?.headteacher_name ?? 'Headteacher'}: &nbsp;___________________________ &nbsp;&nbsp; Date: ___________
            </div>
          </div>
        </div>

        {/* ── FEES & ARREARS ── only shows if there is a balance */}
        {studentFees && ((studentFees.fees_arrears > 0) || (studentFees.other_fees?.length > 0)) && (
          <div className="rc-section-gap" style={{ marginBottom: 8, border: isBW ? '1.5px solid #000' : '1.5px solid #fca5a5', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{ background: isBW ? '#000' : '#dc2626', padding: '5px 10px' }}>
              <span style={{ fontSize: 9.5, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '.06em' }}>⚠ Outstanding Fees</span>
            </div>
            <div style={{ padding: '8px 10px' }}>
              {studentFees.fees_arrears > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: isBW ? '1px solid #000' : '.5px solid #fee2e2', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: '#000', fontWeight: 600 }}>School Fees Arrears</span>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: isBW ? '#000' : '#dc2626' }}>GH₵ {Number(studentFees.fees_arrears).toFixed(2)}</span>
                  </div>
                </div>
              )}
              {(studentFees.other_fees ?? []).filter((f: any) => (f.amount - (f.paid ?? 0)) > 0).map((f: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0', borderBottom: isBW ? '1px solid #000' : '.5px solid #fee2e2' }}>
                  <span style={{ fontSize: 11, color: '#000' }}>{f.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: isBW ? '#000' : '#dc2626' }}>GH₵ {(Number(f.amount) - Number(f.paid ?? 0)).toFixed(2)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, paddingTop: 5, borderTop: isBW ? '2px solid #000' : '1px solid #fca5a5' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: isBW ? '#000' : '#dc2626' }}>Total Outstanding</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: isBW ? '#000' : '#dc2626' }}>
                  GH₵ {(
                    Number(studentFees.fees_arrears ?? 0) +
                    (studentFees.other_fees ?? []).reduce((s: number, f: any) => s + Math.max(0, Number(f.amount) - Number(f.paid ?? 0)), 0)
                  ).toFixed(2)}
                </span>
              </div>
              <p style={{ fontSize: 9.5, color: isBW ? '#000' : '#b91c1c', marginTop: 4, fontStyle: 'italic' }}>
                Please settle all outstanding fees at the school accounts office before collecting the original report card.
              </p>
            </div>
          </div>
        )}

        {/* ── FOOTER ── */}
        <div style={{ borderTop: isBW ? '3px solid #000' : '2px solid #1e3a8a', paddingTop: 7 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            <div>
              {(settings as any)?.next_term_date && (
                <p style={{ fontSize: 10.5, fontWeight: 700, color: isBW ? '#000' : '#1e3a8a', margin: '0 0 3px' }}>
                  📅 Next Term Begins: {formatDate((settings as any).next_term_date)}
                </p>
              )}
              {(settings as any)?.school_fees_info && (
                <p style={{ fontSize: 10, color: '#000', margin: '0 0 2px' }}>
                  💰 <strong>Fees:</strong> {(settings as any).school_fees_info}
                </p>
              )}
            </div>
            {(settings as any)?.school_news && (
              <p style={{ fontSize: 10, color: '#000', margin: 0 }}>
                📢 <strong>News:</strong> {(settings as any).school_news}
              </p>
            )}
          </div>
          <p style={{ fontSize: 9, color: isBW ? '#000' : '#94a3b8', marginTop: 5, textAlign: 'center', borderTop: isBW ? '1px solid #000' : '.5px solid #f1f5f9', paddingTop: 4 }}>
            Generated by World Uni-Learn Report &nbsp;·&nbsp; {school?.name} &nbsp;·&nbsp; {(term as any)?.name} {(year as any)?.name}
          </p>
        </div>

      </div>
    </>
  )
}