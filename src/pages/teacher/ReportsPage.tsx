// src/pages/teacher/ReportsPage.tsx
// ─── FIXES vs old version ────────────────────────────────────────────────────
//  1. printReportCard was called with 0 / 1 arg — HTML body was never passed → blank
//     Fixed: calls buildReportHTML(...) then passes result to printReportCard()
//  2. Added "⬇ Download PDF" button that renders #tr-report-print → PDF via html2canvas+jsPDF
//  3. Imports consolidated: printReportCard + downloadReportPDF + buildReportHTML all from lib/pdf
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useCurrentTerm, useCurrentAcademicYear, useSettings } from '../../hooks/useSettings'
import { getGradeInfo } from '../../utils/grading'
import { ordinal as ordinalUtil } from '../../lib/utils'
import { TEACHER_REMARKS, HEADTEACHER_REMARKS } from '../../constants/remarks'
import Modal from '../../components/ui/Modal'
import ReportCard from '../../components/reports/ReportCard'
import { printReportCard, downloadReportPDF, buildReportHTML } from '../../lib/pdf'
import toast from 'react-hot-toast'

// ── Grade helpers ──────────────────────────────────────────────────────────
const GRADE_SCALE = [
  { grade: 'A', label: 'Excellent', min: 80, color: '#16a34a' },
  { grade: 'B', label: 'Very Good', min: 70, color: '#2563eb' },
  { grade: 'C', label: 'Good',      min: 60, color: '#7c3aed' },
  { grade: 'D', label: 'Credit',    min: 50, color: '#d97706' },
  { grade: 'E', label: 'Pass',      min: 40, color: '#ea580c' },
  { grade: 'F', label: 'Fail',      min: 0,  color: '#dc2626' },
]
function getGrade(n: number) { return GRADE_SCALE.find(g => n >= g.min) ?? GRADE_SCALE[5] }
function ordinalFn(n: number) {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

// ── Btn ────────────────────────────────────────────────────────────────────
function Btn({ children, onClick, variant = 'primary', disabled, loading, style }: any) {
  const [hov, setHov] = useState(false)
  const v: Record<string, React.CSSProperties> = {
    primary:  { background: hov ? '#5b21b6' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', border: 'none', boxShadow: '0 2px 8px rgba(109,40,217,.25)' },
    secondary:{ background: hov ? '#f5f3ff' : '#fff', color: '#374151', border: '1.5px solid #e5e7eb' },
    success:  { background: hov ? '#15803d' : '#16a34a', color: '#fff', border: 'none' },
    info:     { background: hov ? '#0369a1' : 'linear-gradient(135deg,#0891b2,#0369a1)', color: '#fff', border: 'none' },
    orange:   { background: hov ? '#c2410c' : 'linear-gradient(135deg,#f97316,#ea580c)', color: '#fff', border: 'none' },
    teal:     { background: hov ? '#0f766e' : 'linear-gradient(135deg,#14b8a6,#0f766e)', color: '#fff', border: 'none' },
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: '9px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all .15s',
        opacity: disabled ? 0.55 : 1, fontFamily: '"DM Sans",sans-serif',
        ...v[variant], ...style,
      }}
    >
      {loading && (
        <span style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', animation: '_rp_spin .7s linear infinite', flexShrink: 0 }} />
      )}
      {children}
    </button>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
export default function TeacherReportsPage() {
  const { user }           = useAuth()
  const { data: term }     = useCurrentTerm()
  const { data: year }     = useCurrentAcademicYear()
  const { data: settings } = useSettings()

  const [assignments, setAssignments]         = useState<any[]>([])
  const [selectedClass, setSelectedClass]     = useState('')
  const [students, setStudents]               = useState<any[]>([])
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [scores, setScores]                   = useState<any[]>([])
  const [attendance, setAttendance]           = useState<any>(null)
  const [reportCard, setReportCard]           = useState<any>(null)
  const [teacherRemark, setTeacherRemark]     = useState('')
  const [htRemark, setHtRemark]               = useState('')
  const [savingRemarks, setSavingRemarks]     = useState(false)
  const [downloadingPDF, setDownloadingPDF]   = useState(false)
  const [remarksDirty, setRemarksDirty]       = useState(false)
  const [initLoading, setInitLoading]         = useState(true)
  const [loadingReport, setLoadingReport]     = useState(false)
  const [previewOpen, setPreviewOpen]         = useState(false)
  const [classFocused, setClassFocused]       = useState(false)
  const [studentFocused, setStudentFocused]   = useState(false)

  // school lives nested inside settings
  const school       = (settings as any)?.school
  const classOptions = [...new Map(assignments.map((a: any) => [a.class?.id, a.class])).values()].filter(Boolean)

  // ── init / data loading ───────────────────────────────────────────────────
  useEffect(() => { if (user?.id) init() }, [user?.id, term?.id])
  useEffect(() => { if (selectedClass) loadStudents() }, [selectedClass])
  useEffect(() => { if (selectedStudent) loadReport() }, [selectedStudent?.id])

  async function init() {
    setInitLoading(true)
    const { data: t } = await supabase.from('teachers').select('id').eq('user_id', user!.id).single()
    if (!t) { setInitLoading(false); return }
    if (!term?.id) { setInitLoading(false); return }
    const { data: a } = await supabase
      .from('teacher_assignments')
      .select('*, class:classes(id,name), subject:subjects(id,name,code)')
      .eq('teacher_id', t.id).eq('term_id', term.id)
    setAssignments(a ?? [])
    if (a?.length === 1) setSelectedClass((a[0] as any).class?.id ?? '')
    setInitLoading(false)
  }

  async function loadStudents() {
    const { data } = await supabase
      .from('students')
      .select('id,full_name,student_id,gender,date_of_birth,house,guardian_name,guardian_phone')
      .eq('class_id', selectedClass).eq('is_active', true).order('full_name')
    setStudents(data ?? [])
    setSelectedStudent(null)
    setScores([]); setAttendance(null); setReportCard(null)
    setTeacherRemark(''); setHtRemark('')
  }

  async function loadReport() {
    if (!selectedStudent || !term?.id) return
    setLoadingReport(true)
    try {
      const [{ data: sc }, { data: att }, { data: rc }] = await Promise.all([
        supabase.from('scores')
          .select('*, subject:subjects(id,name,code)')
          .eq('student_id', selectedStudent.id).eq('term_id', term.id)
          .order('subject(name)'),
        supabase.from('attendance')
          .select('*').eq('student_id', selectedStudent.id).eq('term_id', term.id)
          .maybeSingle(),
        supabase.from('report_cards')
          .select('*').eq('student_id', selectedStudent.id).eq('term_id', term.id)
          .maybeSingle(),
      ])
      setScores(sc ?? [])
      setAttendance(att)
      setReportCard(rc)
      setTeacherRemark(rc?.class_teacher_remarks ?? '')
      setHtRemark(rc?.headteacher_remarks ?? '')
      setRemarksDirty(false)
    } finally {
      setLoadingReport(false)
    }
  }

  // ── save remarks ──────────────────────────────────────────────────────────
  async function saveRemarks() {
    if (!reportCard?.id) {
      toast.error('Report card not generated yet. Ask admin to generate reports first.')
      return
    }
    setSavingRemarks(true)
    try {
      const { error } = await supabase.from('report_cards').update({
        class_teacher_remarks: teacherRemark,
        headteacher_remarks: htRemark,
        updated_at: new Date().toISOString(),
      }).eq('id', reportCard.id)
      if (error) throw error
      setRemarksDirty(false)
      toast.success('Remarks saved ✓')
      await loadReport()
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to save remarks')
    } finally {
      setSavingRemarks(false)
    }
  }

  async function saveAndNotifyAdmin() {
    if (!reportCard?.id) {
      toast.error('No report card found. Ask admin to generate reports first.')
      return
    }
    setSavingRemarks(true)
    try {
      await supabase.from('report_cards').update({
        class_teacher_remarks: teacherRemark,
        headteacher_remarks: htRemark,
        updated_at: new Date().toISOString(),
      }).eq('id', reportCard.id)

      await supabase.from('messages').insert({
        school_id: user!.school_id,
        from_user_id: user!.id,
        subject: `Report ready: ${selectedStudent?.full_name} — ${selectedClassName}`,
        body: `Remarks completed for ${selectedStudent?.full_name}.\n\nClass Teacher: ${teacherRemark || 'Not set'}\nHeadteacher: ${htRemark || 'Not set'}\n\nPlease review and approve from the Reports section.`,
        priority: 'normal',
      })
      setRemarksDirty(false)
      toast.success('Remarks saved & admin notified ✓', { duration: 5000 })
      await loadReport()
    } catch (e: any) {
      toast.error(e.message ?? 'Failed')
    } finally {
      setSavingRemarks(false)
    }
  }

  // ── print  ────────────────────────────────────────────────────────────────
  // FIX: old code called printReport(name) with no html arg → blank window
  // Now: build HTML first, then pass it to printReportCard(name, html)
  function handlePrint() {
    if (!selectedStudent) { toast.error('No student selected'); return }
    const html = buildReportHTML({
      student: selectedStudent,
      scores,
      attendance,
      reportCard,
      school,        // settings?.school
      term,
      year,
      settings,      // settings.next_term_date / school_fees_info / school_news
      teacherRemark,
      htRemark,
      className: selectedClassName,
    })
    printReportCard(selectedStudent.full_name, html)
  }

  // ── PDF download ──────────────────────────────────────────────────────────
  async function handleDownloadPDF() {
    if (!selectedStudent) { toast.error('No student selected'); return }
    setDownloadingPDF(true)
    const toastId = toast.loading('Preparing PDF…')
    try {
      const fileName = `${selectedStudent.full_name} — ${selectedClassName} — ${(term as any)?.name ?? ''}`
      await downloadReportPDF('tr-report-print', fileName, msg => toast.loading(msg, { id: toastId }))
      toast.success('PDF downloaded ✓', { id: toastId })
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to generate PDF', { id: toastId })
    } finally {
      setDownloadingPDF(false)
    }
  }

  // ── derived ───────────────────────────────────────────────────────────────
  const scoredSubjects = scores.filter(sc => (sc.total_score ?? 0) > 0)
  const avg = scoredSubjects.length > 0
    ? parseFloat((scoredSubjects.reduce((s, sc) => s + (sc.total_score ?? 0), 0) / scoredSubjects.length).toFixed(2))
    : 0
  const overallGrade   = avg > 0 ? getGrade(avg) : null
  const passCount      = scores.filter(sc => (sc.total_score ?? 0) >= 50).length
  const selectedClassName = (classOptions as any[]).find(c => c.id === selectedClass)?.name ?? ''

  // fakeReport: ensure student_id and term_id are always present so ReportCard can load fees
  const fakeReport = reportCard
    ? {
        ...reportCard,
        student_id: selectedStudent?.id ?? reportCard.student_id,
        term_id: term?.id ?? reportCard.term_id,
        student: { ...selectedStudent, class: { id: selectedClass, name: selectedClassName } },
        class_teacher_remarks: teacherRemark,
        headteacher_remarks: htRemark,
        average_score: avg, // pass live avg so ReportCard summary tile is always accurate
      }
    : null

  // ── loading spinner ───────────────────────────────────────────────────────
  if (initLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16, fontFamily: '"DM Sans",sans-serif' }}>
      <style>{`@keyframes _rp_spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #ede9fe', borderTopColor: '#6d28d9', animation: '_rp_spin .8s linear infinite' }} />
    </div>
  )

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _rp_spin{to{transform:rotate(360deg)}}
        @keyframes _rp_fi{from{opacity:0}to{opacity:1}}
        @keyframes _rp_fu{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .rp-row:hover{background:#faf5ff !important}
        .rp-std:hover{background:#ede9fe !important}
        @media (max-width: 768px) {
          .resp-grid-stack { grid-template-columns: 1fr !important; }
          .resp-main-grid { grid-template-columns: 1fr !important; }
          .resp-table-wrap { overflow-x: auto !important; padding-bottom: 12px; }
          .resp-table-min { min-width: 700px; display: table; width: 100%; }
        }
      `}</style>

      <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif', animation: '_rp_fi .4s ease' }}>

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 22, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>Report Cards</h1>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 3 }}>
              {(term as any)?.name ?? '—'} · {(year as any)?.name ?? '—'}
            </p>
          </div>

          {fakeReport && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {remarksDirty && (
                <Btn variant="success" onClick={saveRemarks} loading={savingRemarks}>
                  💾 Save Remarks
                </Btn>
              )}
              <Btn variant="secondary" onClick={() => setPreviewOpen(true)}>
                👁️ Preview
              </Btn>
              {/* FIX: was printReport(name) — now calls handlePrint() which passes html */}
              <Btn variant="info" onClick={handlePrint}>
                🖨️ Print A4
              </Btn>
              {/* NEW: PDF download button */}
              <Btn variant="teal" onClick={handleDownloadPDF} loading={downloadingPDF}>
                ⬇ Download PDF
              </Btn>
              <Btn variant="orange" onClick={saveAndNotifyAdmin} loading={savingRemarks}>
                📨 Save & Notify Admin
              </Btn>
            </div>
          )}
        </div>

        {/* ── Admin notice ─────────────────────────────────────────────── */}
        <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 12, padding: '10px 16px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>🔒</span>
          <p style={{ margin: 0, color: '#dc2626', fontWeight: 500 }}>
            The admin portal is restricted to administrators only. Use <strong>Save & Notify Admin</strong> to send your completed remarks to the admin for approval.
          </p>
        </div>

        {/* ── Selectors ────────────────────────────────────────────────── */}
        <div className="resp-grid-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
          {/* Class */}
          <div style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', border: '1.5px solid #f0eefe', boxShadow: '0 1px 4px rgba(109,40,217,.05)' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 6 }}>
              Step 1 — Select Class
            </label>
            <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
              onFocus={() => setClassFocused(true)} onBlur={() => setClassFocused(false)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 9, fontSize: 14, fontWeight: 600, border: `1.5px solid ${classFocused ? '#7c3aed' : '#e5e7eb'}`, boxShadow: classFocused ? '0 0 0 3px rgba(109,40,217,.1)' : 'none', outline: 'none', background: '#faf5ff', color: '#111827', fontFamily: '"DM Sans",sans-serif', cursor: 'pointer' }}>
              <option value="">Choose class…</option>
              {(classOptions as any[]).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {selectedClass && <p style={{ fontSize: 11, color: '#16a34a', marginTop: 5, fontWeight: 600 }}>✓ {students.length} students</p>}
          </div>

          {/* Student */}
          <div style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', border: '1.5px solid #f0eefe', boxShadow: '0 1px 4px rgba(109,40,217,.05)' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 6 }}>
              Step 2 — Select Student <span style={{ fontWeight: 400, textTransform: 'none', color: '#9ca3af' }}>— scores & details auto-fill</span>
            </label>
            <select value={selectedStudent?.id ?? ''} onChange={e => setSelectedStudent(students.find(s => s.id === e.target.value) ?? null)}
              disabled={!selectedClass || students.length === 0}
              onFocus={() => setStudentFocused(true)} onBlur={() => setStudentFocused(false)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 9, fontSize: 14, fontWeight: 600, border: `1.5px solid ${studentFocused ? '#7c3aed' : '#e5e7eb'}`, boxShadow: studentFocused ? '0 0 0 3px rgba(109,40,217,.1)' : 'none', outline: 'none', background: selectedClass ? '#faf5ff' : '#f9fafb', color: '#111827', fontFamily: '"DM Sans",sans-serif', cursor: selectedClass ? 'pointer' : 'not-allowed', opacity: selectedClass ? 1 : 0.6 }}>
              <option value="">Choose student…</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.full_name}{s.student_id ? ` — ${s.student_id}` : ''}</option>)}
            </select>
            {selectedStudent && !loadingReport && scores.length > 0 && (
              <p style={{ fontSize: 11, color: '#16a34a', marginTop: 5, fontWeight: 600 }}>✓ {scores.length} subjects loaded</p>
            )}
          </div>
        </div>

        {/* ── Quick-select pills ───────────────────────────────────────── */}
        {selectedClass && students.length > 0 && !selectedStudent && (
          <div style={{ background: '#fff', borderRadius: 14, padding: '14px 18px', border: '1.5px solid #f0eefe', marginBottom: 18, animation: '_rp_fu .35s ease' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>
              Quick select — {selectedClassName}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {useMemo(() => students.map((s, i) => (
                <button key={s.id} onClick={() => setSelectedStudent(s)} className="rp-std"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 13px', borderRadius: 99, border: '1.5px solid #ddd6fe', background: '#f5f3ff', cursor: 'pointer', transition: 'all .15s' }}>
                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#5b21b6' }}>{s.full_name}</span>
                </button>
              )), [students])}
            </div>
          </div>
        )}

        {/* ── Empty state ──────────────────────────────────────────────── */}
        {!selectedClass && (
          <div style={{ background: '#fff', borderRadius: 16, padding: '60px 20px', textAlign: 'center', border: '1.5px solid #f0eefe' }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>📄</div>
            <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 6 }}>Select a class to begin</h3>
            <p style={{ fontSize: 13, color: '#9ca3af' }}>Choose a class, then a student — their scores and report details fill in automatically.</p>
          </div>
        )}

        {/* ── Loading ──────────────────────────────────────────────────── */}
        {loadingReport && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '50px 0', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #ede9fe', borderTopColor: '#6d28d9', animation: '_rp_spin .8s linear infinite' }} />
            <p style={{ fontSize: 13, color: '#9ca3af' }}>Loading {selectedStudent?.full_name}'s report…</p>
          </div>
        )}

        {/* ── Main report panel ────────────────────────────────────────── */}
        {!loadingReport && selectedStudent && (
          <div className="resp-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, animation: '_rp_fu .4s ease' }}>

            {/* ── LEFT ──────────────────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Student banner */}
              <div style={{ background: 'linear-gradient(135deg,#2e1065,#4c1d95,#5b21b6)', borderRadius: 16, padding: '18px 20px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -16, right: -16, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,.05)' }} />
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#f59e0b,#fbbf24)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                    {selectedStudent.full_name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2 style={{ fontFamily: '"Playfair Display",serif', fontSize: 19, fontWeight: 700, color: '#fff', margin: 0 }}>{selectedStudent.full_name}</h2>
                    <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap', fontSize: 11 }}>
                      {selectedStudent.student_id && <span style={{ color: 'rgba(255,255,255,.6)' }}>ID: {selectedStudent.student_id}</span>}
                      {selectedStudent.gender && <span style={{ color: 'rgba(255,255,255,.6)' }}>{selectedStudent.gender === 'male' ? '♂ Male' : '♀ Female'}</span>}
                      {selectedStudent.house && <span style={{ color: 'rgba(255,255,255,.6)' }}>🏠 {selectedStudent.house}</span>}
                      <span style={{ color: 'rgba(255,255,255,.6)' }}>🏫 {selectedClassName}</span>
                    </div>
                  </div>
                  {/* Prev / Next */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {students.findIndex(s => s.id === selectedStudent.id) > 0 && (
                      <button onClick={() => setSelectedStudent(students[students.findIndex(s => s.id === selectedStudent.id) - 1])}
                        style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,.2)', background: 'rgba(255,255,255,.1)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.1)'}>
                        ← Prev
                      </button>
                    )}
                    {students.findIndex(s => s.id === selectedStudent.id) < students.length - 1 && (
                      <button onClick={() => setSelectedStudent(students[students.findIndex(s => s.id === selectedStudent.id) + 1])}
                        style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,.2)', background: 'rgba(255,255,255,.1)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.1)'}>
                        Next →
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* No scores notice */}
              {scores.length === 0 && (
                <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: 12, padding: '14px 18px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#92400e', margin: '0 0 2px' }}>No scores entered yet</p>
                    <p style={{ fontSize: 12, color: '#78350f', margin: 0 }}>Go to Score Entry and fill in this student's marks first.</p>
                  </div>
                </div>
              )}

              {/* Scores table */}
              {scores.length > 0 && (
                <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', overflow: 'hidden', boxShadow: '0 1px 4px rgba(109,40,217,.06)' }}>
                  <div style={{ padding: '13px 18px', borderBottom: '1px solid #faf5ff', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>📊</span>
                    <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Subject Scores</h3>
                    <span style={{ fontSize: 11, fontWeight: 700, background: '#f5f3ff', color: '#6d28d9', padding: '2px 8px', borderRadius: 99 }}>{scores.length} subjects</span>
                  </div>
                  <div className="resp-table-wrap">
                  <table className="resp-table-min" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'linear-gradient(135deg,#faf5ff,#f5f3ff)' }}>
                        {['Subject', 'Class Score', 'Exam Score', 'Total', 'Grade', 'Position', 'Remark'].map(h => (
                          <th key={h} style={{ padding: '9px 13px', textAlign: 'left', fontSize: 10.5, fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: '1.5px solid #ede9fe' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {scores.map((sc, i) => {
                        const g = getGrade(sc.total_score ?? 0)
                        return (
                          <tr key={sc.id} className="rp-row" style={{ borderBottom: i < scores.length - 1 ? '1px solid #faf5ff' : 'none', transition: 'background .12s' }}>
                            <td style={{ padding: '9px 13px', fontSize: 13, fontWeight: 600, color: '#111827' }}>{sc.subject?.name}</td>
                            <td style={{ padding: '9px 13px', fontSize: 13, fontWeight: 600, color: '#6d28d9', textAlign: 'center' }}>{sc.class_score ?? '—'}</td>
                            <td style={{ padding: '9px 13px', fontSize: 13, fontWeight: 600, color: '#0891b2', textAlign: 'center' }}>{sc.exam_score ?? '—'}</td>
                            <td style={{ padding: '9px 13px', textAlign: 'center' }}>
                              <span style={{ fontSize: 14, fontWeight: 800, color: (sc.total_score ?? 0) >= 50 ? '#16a34a' : '#dc2626' }}>{sc.total_score?.toFixed(1) ?? '—'}</span>
                            </td>
                            <td style={{ padding: '9px 13px', textAlign: 'center' }}>
                              <span style={{ width: 28, height: 28, borderRadius: 8, background: g.color + '18', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: g.color }}>{g.grade}</span>
                            </td>
                            <td style={{ padding: '9px 13px', textAlign: 'center', fontSize: 12, color: '#374151', fontWeight: 500 }}>{sc.position ? ordinalFn(sc.position) : '—'}</td>
                            <td style={{ padding: '9px 13px', fontSize: 11, color: '#6b7280' }}>{sc.teacher_remarks ?? '—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: 'linear-gradient(135deg,#faf5ff,#f5f3ff)', borderTop: '2px solid #ede9fe' }}>
                        <td style={{ padding: '9px 13px', fontSize: 12, fontWeight: 800, color: '#6d28d9' }}>Summary</td>
                        <td colSpan={2} style={{ padding: '9px 13px', fontSize: 11, color: '#6b7280' }}>{scores.length} subjects · {passCount} passed</td>
                        <td style={{ padding: '9px 13px', textAlign: 'center' }}>
                          <span style={{ fontSize: 14, fontWeight: 800, color: avg >= 50 ? '#16a34a' : '#dc2626' }}>{avg.toFixed(1)}%</span>
                        </td>
                        <td style={{ padding: '9px 13px', textAlign: 'center' }}>
                          {overallGrade && <span style={{ width: 28, height: 28, borderRadius: 8, background: overallGrade.color + '18', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: overallGrade.color }}>{overallGrade.grade}</span>}
                        </td>
                        <td style={{ padding: '9px 13px', textAlign: 'center' }}>
                          {reportCard?.overall_position && (
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#6d28d9', background: '#f5f3ff', padding: '3px 9px', borderRadius: 99 }}>
                              {ordinalFn(reportCard.overall_position)} / {reportCard.total_students}
                            </span>
                          )}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                  </div>
                </div>
              )}

              {/* ── Remarks editor ─────────────────────────────────────── */}
              <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', overflow: 'hidden', boxShadow: '0 1px 4px rgba(109,40,217,.06)' }}>
                <div style={{ padding: '13px 18px', borderBottom: '1px solid #faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>💬</span>
                    <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Remarks</h3>
                    {remarksDirty && <span style={{ fontSize: 11, color: '#d97706', fontWeight: 600 }}>● Unsaved changes</span>}
                    {!remarksDirty && (teacherRemark || htRemark) && <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>✓ Saved</span>}
                  </div>
                  {remarksDirty && (
                    <Btn variant="success" onClick={saveRemarks} loading={savingRemarks} style={{ padding: '6px 12px', fontSize: 12 }}>
                      💾 Save
                    </Btn>
                  )}
                </div>

                <div className="resp-grid-stack" style={{ padding: '16px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 5 }}>
                      Class Teacher's Remarks
                    </label>
                    <select value={teacherRemark} onChange={e => { setTeacherRemark(e.target.value); setRemarksDirty(true) }}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 12, border: '1.5px solid #e5e7eb', outline: 'none', background: '#faf5ff', color: '#374151', fontFamily: '"DM Sans",sans-serif', cursor: 'pointer' }}>
                      <option value="">Select remark…</option>
                      {TEACHER_REMARKS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    {teacherRemark && <p style={{ fontSize: 11, color: '#6b7280', marginTop: 5, fontStyle: 'italic', lineHeight: 1.4 }}>"{teacherRemark}"</p>}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 5 }}>
                      Headteacher's Remarks
                    </label>
                    <select value={htRemark} onChange={e => { setHtRemark(e.target.value); setRemarksDirty(true) }}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 12, border: '1.5px solid #e5e7eb', outline: 'none', background: '#faf5ff', color: '#374151', fontFamily: '"DM Sans",sans-serif', cursor: 'pointer' }}>
                      <option value="">Select remark…</option>
                      {HEADTEACHER_REMARKS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    {htRemark && <p style={{ fontSize: 11, color: '#6b7280', marginTop: 5, fontStyle: 'italic', lineHeight: 1.4 }}>"{htRemark}"</p>}
                  </div>
                </div>

                {/* Action bar */}
                <div style={{ padding: '0 18px 16px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Btn variant="success" onClick={saveRemarks} loading={savingRemarks} disabled={!reportCard?.id} style={{ flex: 1, justifyContent: 'center' }}>
                    💾 Save Remarks
                  </Btn>
                  <Btn variant="info" onClick={() => setPreviewOpen(true)} disabled={!reportCard} style={{ flex: 1, justifyContent: 'center' }}>
                    👁️ Preview
                  </Btn>
                  <Btn variant="teal" onClick={handleDownloadPDF} loading={downloadingPDF} disabled={!reportCard} style={{ flex: 1, justifyContent: 'center' }}>
                    ⬇ PDF
                  </Btn>
                  <Btn variant="orange" onClick={saveAndNotifyAdmin} loading={savingRemarks} disabled={!reportCard?.id} style={{ flex: 2, justifyContent: 'center' }}>
                    📨 Save & Notify Admin
                  </Btn>
                </div>

                {!reportCard && (
                  <div style={{ margin: '0 18px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 9, padding: '8px 12px', fontSize: 12, color: '#dc2626' }}>
                    ⚠ No report card found for this student. Ask the admin to generate reports first.
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT sidebar ─────────────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Report status */}
              <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #f0eefe', padding: '16px', boxShadow: '0 1px 4px rgba(109,40,217,.06)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>Report Status</p>
                {reportCard ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { l: 'Average',   v: `${avg.toFixed(1)}%`, color: overallGrade?.color },
                      { l: 'Grade',     v: overallGrade ? `${overallGrade.grade} — ${overallGrade.label}` : '—' },
                      { l: 'Position',  v: reportCard.overall_position ? `${ordinalFn(reportCard.overall_position)} of ${reportCard.total_students}` : 'Not set' },
                      { l: 'Pass/Fail', v: `${passCount}/${scores.length} passed`, color: passCount === scores.length ? '#16a34a' : '#d97706' },
                    ].map(({ l, v, color }) => (
                      <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: '#6b7280' }}>{l}</span>
                        <span style={{ fontWeight: 700, color: color ?? '#111827' }}>{v}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 99, background: reportCard.is_approved ? '#f0fdf4' : '#fffbeb', color: reportCard.is_approved ? '#16a34a' : '#d97706', border: `1px solid ${reportCard.is_approved ? '#bbf7d0' : '#fde68a'}` }}>
                        {reportCard.is_approved ? '✓ Approved by admin' : '⏳ Pending admin approval'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '12px 0' }}>
                    <p style={{ fontSize: 12, color: '#9ca3af' }}>Report not generated yet</p>
                    <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>Ask admin to generate from Reports page</p>
                  </div>
                )}
              </div>

              {/* Attendance */}
              <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #f0eefe', padding: '16px', boxShadow: '0 1px 4px rgba(109,40,217,.06)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Attendance</p>
                {attendance ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                    {[
                      { l: 'Total',   v: attendance.total_days,   color: '#6d28d9', bg: '#f5f3ff' },
                      { l: 'Present', v: attendance.days_present, color: '#16a34a', bg: '#f0fdf4' },
                      { l: 'Absent',  v: attendance.days_absent,  color: '#dc2626', bg: '#fef2f2' },
                    ].map(s => (
                      <div key={s.l} style={{ background: s.bg, borderRadius: 9, padding: '9px', textAlign: 'center' }}>
                        <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: s.color }}>{s.v}</div>
                        <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>{s.l}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', padding: '6px 0' }}>No attendance recorded</p>
                )}
              </div>

              {/* Guardian */}
              {(selectedStudent.guardian_name || selectedStudent.guardian_phone) && (
                <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #f0eefe', padding: '16px', boxShadow: '0 1px 4px rgba(109,40,217,.06)' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Guardian</p>
                  {selectedStudent.guardian_name && <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 3 }}>{selectedStudent.guardian_name}</p>}
                  {selectedStudent.guardian_phone && <p style={{ fontSize: 12, color: '#6b7280' }}>📱 {selectedStudent.guardian_phone}</p>}
                </div>
              )}

              {/* Student list */}
              <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #f0eefe', padding: '14px', boxShadow: '0 1px 4px rgba(109,40,217,.06)', maxHeight: 260, overflowY: 'auto' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>All Students</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {useMemo(() => students.map((s, i) => (
                    <button key={s.id} onClick={() => setSelectedStudent(s)}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 9, border: 'none', background: selectedStudent?.id === s.id ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : '#faf5ff', cursor: 'pointer', transition: 'all .15s', textAlign: 'left' }}
                      onMouseEnter={e => { if (selectedStudent?.id !== s.id) e.currentTarget.style.background = '#ede9fe' }}
                      onMouseLeave={e => { if (selectedStudent?.id !== s.id) e.currentTarget.style.background = '#faf5ff' }}>
                      <span style={{ fontSize: 10, color: selectedStudent?.id === s.id ? 'rgba(255,255,255,.5)' : '#9ca3af', width: 16, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: selectedStudent?.id === s.id ? '#fff' : '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.full_name}</span>
                    </button>
                  )), [students, selectedStudent?.id])}
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* ── Hidden print/PDF target  ────────────────────────────────────────
           IMPORTANT: display:none hides it from view but html2canvas still
           renders it by temporarily setting display:block in downloadReportPDF.
           The ReportCard here receives scores + attendance as top-level props
           so it doesn't need them nested on fakeReport.
      ── */}
      <div id="tr-report-print-wrap" style={{ display: 'none' }}>
        <div id="tr-report-print">
          {fakeReport && (
            <ReportCard
              report={fakeReport}
              school={school}
              term={term}
              year={year}
              settings={settings}
              scores={scores}
              attendance={attendance}
              readonly
            />
          )}
        </div>
      </div>

      {/* ── Preview modal ───────────────────────────────────────────────────── */}
      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={`Report Card — ${selectedStudent?.full_name ?? ''}`}
        subtitle={`${selectedClassName} · ${(term as any)?.name ?? ''}`}
        size="xl"
        footer={
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="secondary" onClick={() => setPreviewOpen(false)}>Close</Btn>
            <Btn variant="info" onClick={() => { setPreviewOpen(false); handlePrint() }}>
              🖨️ Print A4
            </Btn>
            <Btn variant="teal" onClick={() => { setPreviewOpen(false); handleDownloadPDF() }} loading={downloadingPDF}>
              ⬇ Download PDF
            </Btn>
            <Btn variant="orange" onClick={() => { setPreviewOpen(false); saveAndNotifyAdmin() }} loading={savingRemarks}>
              📨 Save & Notify Admin
            </Btn>
          </div>
        }
      >
        {fakeReport && (
          <ReportCard
            report={fakeReport}
            school={school}
            term={term}
            year={year}
            settings={settings}
            scores={scores}
            attendance={attendance}
            readonly
          />
        )}
      </Modal>
    </>
  )
}