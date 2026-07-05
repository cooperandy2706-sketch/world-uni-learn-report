// src/pages/teacher/ReportsPage.tsx
// ─── FIXES vs old version ────────────────────────────────────────────────────
//  1. printReportCard was called with 0 / 1 arg — HTML body was never passed → blank
//     Fixed: calls buildReportHTML(...) then passes result to printReportCard()
//  2. Added "⬇ Download PDF" button that renders #tr-report-print → PDF via html2canvas+jsPDF
//  3. Imports consolidated: printReportCard + downloadReportPDF + buildReportHTML all from lib/pdf
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react'
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
import { useAutoRefresh } from "../../hooks/useAutoRefresh";

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
    secondary:{ background: hov ? '#f5f3ff' : '#fff', color: 'var(--text-main)', border: '1.5px solid var(--border-color)' },
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
    useAutoRefresh(loadStudents);
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
  const [gradingCategories, setGradingCategories] = useState<any[]>([])

  // school lives nested inside settings
  const school       = (settings as any)?.school
  const classOptions = [...new Map(assignments.map((a: any) => [a.class?.id, a.class])).values()].filter(Boolean)

  // ── init / data loading ───────────────────────────────────────────────────
  useEffect(() => { if (user?.id) init() }, [user?.id, term?.id])
  useEffect(() => { if (selectedClass) { loadStudents(); loadCategories(); } }, [selectedClass])
  useEffect(() => { if (selectedStudent) loadReport() }, [selectedStudent?.id])

  async function init() {
    setInitLoading(true)
    const { data: t } = await supabase.from('teachers').select('id').eq('user_id', user!.id).maybeSingle()
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

  async function loadCategories() {
    const cls = classOptions.find((c: any) => c.id === selectedClass)
    if (cls?.department_id) {
      const { data } = await supabase.from('department_grading_categories').select('*').eq('department_id', cls.department_id).order('created_at')
      if (data && data.length > 0) {
        setGradingCategories(data)
        return
      }
    }
    setGradingCategories([])
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
      }).eq('id', reportCard.id).eq('school_id', user!.school_id)
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
      }).eq('id', reportCard.id).eq('school_id', user!.school_id)

      // Send notification via chat (unified messaging system)
      const schoolId = user!.school_id
      const groupKey = `staff_inbox_${schoolId}`
      let convId: string
      const { data: existing } = await supabase
        .from('chat_conversations')
        .select('id')
        .eq('group_key', groupKey)
        .maybeSingle()

      if (existing?.id) {
        convId = existing.id
      } else {
        const { data: created } = await supabase
          .from('chat_conversations')
          .insert({ group_key: groupKey, school_id: schoolId, name: 'Staff Inbox', type: 'group' })
          .select('id')
          .single()
        convId = created?.id
      }

      if (convId) {
        await supabase.from('chat_members').upsert(
          { conversation_id: convId, user_id: user!.id },
          { onConflict: 'conversation_id,user_id', ignoreDuplicates: true }
        )
        await supabase.from('chat_messages').insert({
          conversation_id: convId,
          sender_id: user!.id,
          school_id: schoolId,
          body: `[REPORT READY] ${selectedStudent?.full_name} — ${selectedClassName}\n\nRemarks completed. Class Teacher: ${teacherRemark || 'Not set'}\nHeadteacher: ${htRemark || 'Not set'}\n\nPlease review and approve from the Reports section.`,
        })
      }

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
      categories: gradingCategories,
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
    <div className="tp-page">
      <link rel="stylesheet" href="/src/styles/teacher-portal.css" />

      <div style={{ animation: 'tp-fade-in 0.4s ease' }}>

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="tp-hero" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div className="tp-hero-label">Academics</div>
              <h1 className="tp-hero-title">📄 Report Cards</h1>
              <p className="tp-hero-sub">
                {(term as any)?.name ?? '—'} · {(year as any)?.name ?? '—'}
              </p>
            </div>

            {fakeReport && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {remarksDirty && (
                  <button className="tp-btn tp-btn-primary" onClick={saveRemarks} disabled={savingRemarks}>
                    {savingRemarks ? 'Saving...' : '💾 Save'}
                  </button>
                )}
                <button className="tp-btn tp-btn-ghost" onClick={() => setPreviewOpen(true)} style={{ border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
                  👁️ Preview
                </button>
                <button className="tp-btn tp-btn-primary" onClick={handlePrint}>
                  🖨️ Print
                </button>
                <button className="tp-btn tp-btn-ghost" onClick={handleDownloadPDF} disabled={downloadingPDF} style={{ border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
                  ⬇ PDF
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Admin notice ─────────────────────────────────────────────── */}
        <div className="tp-alert tp-alert-warning" style={{ marginBottom: 20 }}>
          The admin portal is restricted to administrators only. Use <strong>Save & Notify Admin</strong> to send your completed remarks to the admin for approval.
        </div>

        {/* ── Selectors ────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginBottom: 20 }}>
          {/* Class */}
          <div className="tp-card">
            <div className="tp-label">Step 1 — Select Class</div>
            <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="tp-select">
              <option value="">Choose class…</option>
              {(classOptions as any[]).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {selectedClass && <div style={{ fontSize: 13, color: 'var(--primary-color)', marginTop: 8, fontWeight: 700 }}>✓ {(Array.isArray(students) ? students : []).length} students</div>}
          </div>

          {/* Student */}
          <div className="tp-card" style={{ opacity: selectedClass ? 1 : 0.6 }}>
            <div className="tp-label">Step 2 — Select Student <span style={{ color: 'var(--text-subtle)', fontWeight: 600, textTransform: 'none' }}>— details auto-fill</span></div>
            <select value={selectedStudent?.id ?? ''} onChange={e => setSelectedStudent((Array.isArray(students) ? students : []).find(s => s.id === e.target.value) ?? null)}
              disabled={!selectedClass || (Array.isArray(students) ? students : []).length === 0}
              className="tp-select"
            >
              <option value="">Choose student…</option>
              {(Array.isArray(students) ? students : []).map(s => <option key={s.id} value={s.id}>{s.full_name}{s.student_id ? ` — ${s.student_id}` : ''}</option>)}
            </select>
            {selectedStudent && !loadingReport && scores.length > 0 && (
              <div style={{ fontSize: 13, color: 'var(--primary-color)', marginTop: 8, fontWeight: 700 }}>✓ {scores.length} subjects loaded</div>
            )}
          </div>
        </div>

        {/* ── Quick-select pills ───────────────────────────────────────── */}
        {selectedClass && (Array.isArray(students) ? students : []).length > 0 && !selectedStudent && (
          <div className="tp-card" style={{ marginBottom: 20, animation: 'tp-fade-in 0.3s ease' }}>
            <div className="tp-label">Quick select — {selectedClassName}</div>
            <div style={{ display: 'flex', flexWrap: 'nowrap', overflowX: 'auto', gap: 12, paddingBottom: 8, WebkitOverflowScrolling: 'touch' }}>
              {(Array.isArray(students) ? students : []).map((s, i) => (
                <button key={s.id} onClick={() => setSelectedStudent(s)} 
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 99, border: '1px solid var(--border-color)', background: 'var(--bg-hover)', cursor: 'pointer', flexShrink: 0 }}
                >
                  <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-color), var(--primary-color-dark))', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff' }}>{i + 1}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{s.full_name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Empty state ──────────────────────────────────────────────── */}
        {!selectedClass && (
          <div className="tp-card">
            <div className="tp-empty">
              <div className="tp-empty-icon">📄</div>
              <div className="tp-empty-title">Select a class to begin</div>
              <div className="tp-empty-sub">Choose a class, then a student — their scores and report details fill in automatically.</div>
            </div>
          </div>
        )}

        {/* ── Loading ──────────────────────────────────────────────────── */}
        {loadingReport && (
          <div className="tp-loading">
            <div className="tp-spinner" />
            Loading {selectedStudent?.full_name}'s report…
          </div>
        )}

        {/* ── Main report panel ────────────────────────────────────────── */}
        {!loadingReport && selectedStudent && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, '@media (minWidth: 1024px)': { flexDirection: 'row' } } as any}>

            {/* ── LEFT ──────────────────────────────────────────────── */}
            <div style={{ flex: '1 1 60%', display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Student banner */}
              <div style={{ background: 'linear-gradient(135deg, var(--primary-color), var(--primary-color-dark))', borderRadius: 16, padding: '24px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div className="tp-avatar tp-avatar-lg" style={{ background: 'linear-gradient(135deg, #F59E0B, #FBBF24)', color: '#fff' }}>
                    {selectedStudent.full_name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>{selectedStudent.full_name}</h2>
                    <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap', fontSize: 13, opacity: 0.9 }}>
                      {selectedStudent.student_id && <span>ID: {selectedStudent.student_id}</span>}
                      {selectedStudent.gender && <span>{selectedStudent.gender === 'male' ? '♂ Male' : '♀ Female'}</span>}
                      {selectedStudent.house && <span>🏠 {selectedStudent.house}</span>}
                      <span>🏫 {selectedClassName}</span>
                    </div>
                  </div>
                  {/* Prev / Next */}
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    {(Array.isArray(students) ? students : []).findIndex(s => s.id === selectedStudent.id) > 0 && (
                      <button onClick={() => setSelectedStudent(students[(Array.isArray(students) ? students : []).findIndex(s => s.id === selectedStudent.id) - 1])}
                        style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                      >
                        ←
                      </button>
                    )}
                    {(Array.isArray(students) ? students : []).findIndex(s => s.id === selectedStudent.id) < (Array.isArray(students) ? students : []).length - 1 && (
                      <button onClick={() => setSelectedStudent(students[(Array.isArray(students) ? students : []).findIndex(s => s.id === selectedStudent.id) + 1])}
                        style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                      >
                        →
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* No scores notice */}
              {scores.length === 0 && (
                <div className="tp-alert tp-alert-warning">
                  <strong>No scores entered yet.</strong> Go to Score Entry and fill in this student's marks first.
                </div>
              )}

              {/* Scores table */}
              {scores.length > 0 && (
                <div className="tp-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 20 }}>📊</span>
                      <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Subject Scores</h3>
                    </div>
                    <span className="tp-badge tp-badge-primary">{scores.length} subjects</span>
                  </div>
                  
                  <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', margin: '0 -20px' }}>
                    <table style={{ width: '100%', minWidth: 600, borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-hover)' }}>
                          <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subject</th>
                          {(gradingCategories.length > 0
                            ? gradingCategories
                            : [
                                { id: 'cs', name: 'Class Score', max_score: 30 },
                                { id: 'es', name: 'Exam Score', max_score: 70 },
                              ]
                          ).map((cat: any) => (
                            <th key={cat.id} style={{ padding: '12px', textAlign: 'center', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              {cat.name} <span style={{ opacity: 0.6 }}>(/{cat.max_score})</span>
                            </th>
                          ))}
                          {['Total', 'Grade', 'Position', 'Remark'].map(h => (
                            <th key={h} style={{ padding: '12px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {scores.map((sc, i) => {
                          const g = getGrade(sc.total_score ?? 0)
                          return (
                            <tr key={sc.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '12px 20px', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{sc.subject?.name}</td>
                              {(gradingCategories.length > 0
                                ? gradingCategories
                                : [{ id: 'cs', name: 'Class Score', max_score: 30 }, { id: 'es', name: 'Exam Score', max_score: 70 }]
                              ).map((cat: any) => {
                                let val = '—'
                                if (sc.category_scores?.[cat.id] !== undefined && sc.category_scores[cat.id] !== '') {
                                  val = `${sc.category_scores[cat.id]}/${cat.max_score}`
                                } else if (cat.id === 'cs' && sc.class_score != null) {
                                  val = sc.class_score.toFixed(1)
                                } else if (cat.id === 'es' && sc.exam_score != null) {
                                  val = sc.exam_score.toFixed(1)
                                }
                                return (
                                  <td key={cat.id} style={{ padding: '12px', fontSize: 14, fontWeight: 700, color: 'var(--primary-color)', textAlign: 'center' }}>{val}</td>
                                )
                              })}
                              <td style={{ padding: '12px', textAlign: 'center' }}>
                                <span style={{ fontSize: 15, fontWeight: 800, color: (sc.total_score ?? 0) >= 50 ? 'var(--success-color)' : 'var(--danger-color)' }}>{sc.total_score?.toFixed(1) ?? '—'}</span>
                              </td>
                              <td style={{ padding: '12px', textAlign: 'center' }}>
                                <span style={{ width: 32, height: 32, borderRadius: 10, background: g.color + '1A', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: g.color }}>{g.grade}</span>
                              </td>
                              <td style={{ padding: '12px', textAlign: 'center', fontSize: 13, color: 'var(--text-primary)', fontWeight: 700 }}>{sc.position ? ordinalFn(sc.position) : '—'}</td>
                              <td style={{ padding: '12px', fontSize: 12, color: 'var(--text-muted)' }}>{sc.teacher_remarks ?? '—'}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: 'var(--bg-hover)' }}>
                          <td style={{ padding: '12px 20px', fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>Summary</td>
                          <td colSpan={2} style={{ padding: '12px', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{scores.length} subjects · {passCount} passed</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span style={{ fontSize: 15, fontWeight: 800, color: avg >= 50 ? 'var(--success-color)' : 'var(--danger-color)' }}>{avg.toFixed(1)}%</span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            {overallGrade && <span style={{ width: 32, height: 32, borderRadius: 10, background: overallGrade.color + '1A', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: overallGrade.color }}>{overallGrade.grade}</span>}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            {reportCard?.overall_position && (
                              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--primary-color)', background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '4px 10px', borderRadius: 99 }}>
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
              <div className="tp-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 20 }}>💬</span>
                    <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Remarks</h3>
                    {remarksDirty && <span style={{ fontSize: 12, color: 'var(--warning-color)', fontWeight: 700 }}>● Unsaved changes</span>}
                    {!remarksDirty && (teacherRemark || htRemark) && <span style={{ fontSize: 12, color: 'var(--success-color)', fontWeight: 700 }}>✓ Saved</span>}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 20 }}>
                  <div>
                    <div className="tp-label">Class Teacher's Remarks</div>
                    <select value={teacherRemark} onChange={e => { setTeacherRemark(e.target.value); setRemarksDirty(true) }} className="tp-select">
                      <option value="">Select remark…</option>
                      {TEACHER_REMARKS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    {teacherRemark && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8, fontStyle: 'italic' }}>"{teacherRemark}"</div>}
                  </div>

                  <div>
                    <div className="tp-label">Headteacher's Remarks</div>
                    <select value={htRemark} onChange={e => { setHtRemark(e.target.value); setRemarksDirty(true) }} className="tp-select">
                      <option value="">Select remark…</option>
                      {HEADTEACHER_REMARKS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    {htRemark && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8, fontStyle: 'italic' }}>"{htRemark}"</div>}
                  </div>
                </div>

                {/* Action bar */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', borderTop: '1px solid var(--border-color)', paddingTop: 20 }}>
                  <button className="tp-btn tp-btn-primary" onClick={saveRemarks} disabled={savingRemarks || !reportCard?.id}>
                    💾 Save Remarks
                  </button>
                  <button className="tp-btn tp-btn-ghost" onClick={() => setPreviewOpen(true)} disabled={!reportCard} style={{ border: '1px solid var(--border-color)' }}>
                    👁️ Preview
                  </button>
                  <button className="tp-btn tp-btn-ghost" onClick={handleDownloadPDF} disabled={downloadingPDF || !reportCard} style={{ border: '1px solid var(--border-color)' }}>
                    ⬇ PDF
                  </button>
                  <button className="tp-btn tp-btn-primary" onClick={saveAndNotifyAdmin} disabled={savingRemarks || !reportCard?.id} style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
                    📨 Save & Notify Admin
                  </button>
                </div>

                {!reportCard && (
                  <div className="tp-alert tp-alert-error" style={{ marginTop: 16 }}>
                    No report card found for this student. Ask the admin to generate reports first.
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT sidebar ─────────────────────────────────────────── */}
            <div style={{ flex: '1 1 35%', display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Report status */}
              <div className="tp-card">
                <div className="tp-label">Report Status</div>
                {reportCard ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { l: 'Average',   v: `${avg.toFixed(1)}%`, color: overallGrade?.color },
                      { l: 'Grade',     v: overallGrade ? `${overallGrade.grade} — ${overallGrade.label}` : '—' },
                      { l: 'Position',  v: reportCard.overall_position ? `${ordinalFn(reportCard.overall_position)} of ${reportCard.total_students}` : 'Not set' },
                      { l: 'Pass/Fail', v: `${passCount}/${scores.length} passed`, color: passCount === scores.length ? 'var(--success-color)' : 'var(--warning-color)' },
                    ].map(({ l, v, color }) => (
                      <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                        <span style={{ color: 'var(--text-muted)' }}>{l}</span>
                        <span style={{ fontWeight: 800, color: color ?? 'var(--text-primary)' }}>{v}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: 8 }}>
                      <span className={`tp-badge ${reportCard.is_approved ? 'tp-badge-success' : 'tp-badge-warning'}`}>
                        {reportCard.is_approved ? '✓ Approved by admin' : '⏳ Pending admin approval'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="tp-empty" style={{ padding: '20px 0', minHeight: 'auto' }}>
                    <div className="tp-empty-title" style={{ fontSize: 15 }}>Report not generated yet</div>
                    <div className="tp-empty-sub">Ask admin to generate from Reports page</div>
                  </div>
                )}
              </div>

              {/* Attendance */}
              <div className="tp-card">
                <div className="tp-label">Attendance</div>
                {attendance ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    {[
                      { l: 'Total',   v: attendance.total_days,   color: 'var(--primary-color)', bg: 'var(--bg-hover)' },
                      { l: 'Present', v: attendance.days_present, color: 'var(--success-color)', bg: '#F0FDF4' },
                      { l: 'Absent',  v: attendance.days_absent,  color: 'var(--danger-color)', bg: '#FEF2F2' },
                    ].map(s => (
                      <div key={s.l} style={{ background: s.bg, borderRadius: 12, padding: '12px', textAlign: 'center' }}>
                        <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 24, fontWeight: 800, color: s.color }}>{s.v}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontWeight: 700 }}>{s.l}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="tp-empty" style={{ padding: '20px 0', minHeight: 'auto' }}>
                    <div className="tp-empty-sub">No attendance recorded</div>
                  </div>
                )}
              </div>

              {/* Guardian */}
              {(selectedStudent.guardian_name || selectedStudent.guardian_phone) && (
                <div className="tp-card">
                  <div className="tp-label">Guardian</div>
                  {selectedStudent.guardian_name && <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>{selectedStudent.guardian_name}</div>}
                  {selectedStudent.guardian_phone && <div style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 }}>📱 {selectedStudent.guardian_phone}</div>}
                </div>
              )}

              {/* Student list */}
              <div className="tp-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="tp-label" style={{ padding: '20px 20px 12px' }}>All Students</div>
                <div style={{ maxHeight: 300, overflowY: 'auto', padding: '0 12px 12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {(Array.isArray(students) ? students : []).map((s, i) => (
                      <button key={s.id} onClick={() => setSelectedStudent(s)}
                        style={{ 
                          display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, border: 'none', 
                          background: selectedStudent?.id === s.id ? 'linear-gradient(135deg, var(--primary-color), var(--primary-color-dark))' : 'transparent',
                          cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left' 
                        }}
                      >
                        <span style={{ fontSize: 12, color: selectedStudent?.id === s.id ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)', width: 20, textAlign: 'right', flexShrink: 0, fontWeight: 700 }}>{i + 1}</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: selectedStudent?.id === s.id ? '#fff' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.full_name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* ── Hidden print/PDF target  ──────────────────────────────────────── */}
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
              categories={gradingCategories}
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
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="tp-btn tp-btn-ghost" onClick={() => setPreviewOpen(false)}>Close</button>
            <button className="tp-btn tp-btn-primary" onClick={() => { setPreviewOpen(false); handlePrint() }}>
              🖨️ Print
            </button>
            <button className="tp-btn tp-btn-ghost" style={{ border: '1px solid var(--border-color)' }} onClick={() => { setPreviewOpen(false); handleDownloadPDF() }} disabled={downloadingPDF}>
              ⬇ Download PDF
            </button>
            <button className="tp-btn tp-btn-primary" style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }} onClick={() => { setPreviewOpen(false); saveAndNotifyAdmin() }} disabled={savingRemarks}>
              📨 Save & Notify Admin
            </button>
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
    </div>
  )
}