// src/pages/teacher/ScoreEntryPage.tsx
// GES SBA Style — students in rows, subjects in columns
import { useState, useEffect, useRef, useCallback, Fragment } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useCurrentTerm, useCurrentAcademicYear } from '../../hooks/useSettings'
import { TEACHER_REMARKS, getRandomRemark, GRADE_REMARKS } from '../../constants/remarks'
import toast from 'react-hot-toast'

// ── constants ─────────────────────────────────────────────
const GRADE_SCALE = [
  { grade: 'A', label: 'Excellent', min: 80, color: '#16a34a' },
  { grade: 'B', label: 'Very Good', min: 70, color: '#2563eb' },
  { grade: 'C', label: 'Good',      min: 60, color: '#7c3aed' },
  { grade: 'D', label: 'Credit',    min: 50, color: '#d97706' },
  { grade: 'E', label: 'Pass',      min: 40, color: '#ea580c' },
  { grade: 'F', label: 'Fail',      min: 0,  color: '#dc2626' },
]

function getGrade(total: number) {
  return GRADE_SCALE.find(g => total >= g.min) ?? GRADE_SCALE[5]
}

function ordinal(n: number) {
  const s = ['th','st','nd','rd'], v = n % 100
  return n + (s[(v-20)%10] || s[v] || s[0])
}

// ── types ─────────────────────────────────────────────────
interface Subject { id: string; name: string; code?: string }
interface Student { id: string; full_name: string; student_id?: string }
// scoreMap[studentId][subjectId] = { cs, es, remarks }
type ScoreMap = Record<string, Record<string, { cs: string; es: string; remarks: string; submitted: boolean }>>

// ── tiny input ────────────────────────────────────────────
function TinyInput({ value, max, onChange, disabled }: {
  value: string; max: number; onChange: (v: string) => void; disabled?: boolean
}) {
  const [f, setF] = useState(false)
  const n = parseFloat(value) || 0
  const over = n > max
  const ok = !over && value !== ''
  return (
    <input
      type="number" min={0} max={max} step={0.5}
      value={value}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setF(true)}
      onBlur={() => setF(false)}
      disabled={disabled}
      style={{
        width: 52, height: 32, textAlign: 'center', fontSize: 12, fontWeight: 700,
        borderRadius: 6, outline: 'none', transition: 'all .12s',
        fontFamily: '"DM Sans",sans-serif',
        border: `1.5px solid ${over ? '#f87171' : f ? '#7c3aed' : ok ? '#86efac' : '#e5e7eb'}`,
        background: over ? '#fef2f2' : f ? '#faf5ff' : ok ? '#f0fdf4' : '#fafafa',
        color: over ? '#dc2626' : '#111827',
        boxShadow: f ? '0 0 0 2px rgba(109,40,217,.15)' : 'none',
        cursor: disabled ? 'not-allowed' : 'text',
        opacity: disabled ? 0.45 : 1,
      }}
    />
  )
}

// ═══════════════════════════════════════════════════════════
export default function ScoreEntryPage() {
  const { user } = useAuth()
  const { data: term } = useCurrentTerm()
  const { data: year } = useCurrentAcademicYear()
  const [params] = useSearchParams()

  const [teacherRecord, setTeacherRecord]   = useState<any>(null)
  const [assignments, setAssignments]       = useState<any[]>([])
  const [selectedClass, setSelectedClass]   = useState(params.get('class') ?? '')
  const [students, setStudents]             = useState<Student[]>([])
  const [subjects, setSubjects]             = useState<Subject[]>([])
  const [scoreMap, setScoreMap]             = useState<ScoreMap>({})
  const [classWeight, setClassWeight]       = useState(50)
  const [examWeight, setExamWeight]         = useState(50)
  const [saving, setSaving]                 = useState(false)
  const [submitting, setSubmitting]         = useState(false)
  const [dirty, setDirty]                   = useState(false)
  const [activeCell, setActiveCell]         = useState<{sid:string;subId:string;field:'cs'|'es'}|null>(null)
  const [remarksOpen, setRemarksOpen]       = useState<{sid:string;subId:string}|null>(null)
  const [loading, setLoading]               = useState(true)
  const autoSaveRef = useRef<any>(null)

  const isLocked = (term as any)?.is_locked
  const classOptions = [...new Map(assignments.map((a:any) => [a.class?.id, a.class])).values()].filter(Boolean)

  // ── init ──────────────────────────────────────────────
  useEffect(() => {
    if (user?.id) initTeacher()
  }, [user?.id, term?.id])

  useEffect(() => {
    if (selectedClass && teacherRecord) loadClassData()
  }, [selectedClass, teacherRecord, term?.id])

  async function initTeacher() {
    const { data: t } = await supabase.from('teachers').select('*').eq('user_id', user!.id).single()
    if (!t) { setLoading(false); return }
    setTeacherRecord(t)
    if (!term?.id) { setLoading(false); return }
    const { data: a } = await supabase
      .from('teacher_assignments')
      .select('*, class:classes(id,name), subject:subjects(id,name,code)')
      .eq('teacher_id', t.id).eq('term_id', term.id)
    setAssignments(a ?? [])
    setLoading(false)
  }

  async function loadClassData() {
    if (!selectedClass || !teacherRecord?.id || !term?.id) return
    setLoading(true)

    const isClassTeacher = assignments.some((a:any) => a.class?.id === selectedClass && a.is_class_teacher)
    let assignedSubjects: Subject[] = assignments
      .filter((a:any) => a.class?.id === selectedClass)
      .map((a:any) => a.subject)
      .filter(Boolean) as Subject[]

    if (isClassTeacher) {
      const { data: allAssignments } = await supabase
        .from('teacher_assignments')
        .select('subject:subjects(id,name,code)')
        .eq('class_id', selectedClass)
        .eq('term_id', term!.id)
      
      const distinctSubjects = new Map()
      allAssignments?.forEach((a:any) => {
        if (a.subject) distinctSubjects.set(a.subject.id, a.subject)
      })
      // Ensure the subjects they were directly assigned are also included just in case
      assignedSubjects.forEach(s => distinctSubjects.set(s.id, s))
      assignedSubjects = Array.from(distinctSubjects.values()) as Subject[]
    }

    // Students in the class
    const { data: stds } = await supabase
      .from('students')
      .select('id,full_name,student_id')
      .eq('class_id', selectedClass)
      .eq('is_active', true)
      .order('full_name')

    // All scores for this class/term (regardless of who entered them, so class teachers see everything)
    const { data: existingScores } = await supabase
      .from('scores')
      .select('student_id,subject_id,class_score,exam_score,teacher_remarks,is_submitted,teacher_id')
      .eq('class_id', selectedClass)
      .eq('term_id', term!.id)

    // Build score map
    const map: ScoreMap = {}
    ;(stds ?? []).forEach(s => {
      map[s.id] = {}
      assignedSubjects.forEach(sub => {
        const ex = existingScores?.find((sc:any) => sc.student_id === s.id && sc.subject_id === sub.id)
        map[s.id][sub.id] = {
          cs: ex ? String(ex.class_score ?? '') : '',
          es: ex ? String(ex.exam_score ?? '') : '',
          remarks: ex?.teacher_remarks ?? '',
          submitted: ex?.is_submitted ?? false,
        }
      })
    })

    setStudents(stds ?? [])
    setSubjects(assignedSubjects)
    setScoreMap(map)
    setDirty(false)
    setLoading(false)
  }

  // ── score update ──────────────────────────────────────
  const updateScore = useCallback((sid: string, subId: string, field: 'cs'|'es'|'remarks', val: string) => {
    setScoreMap(prev => {
      const current = prev[sid]?.[subId] ?? { cs: '', es: '', remarks: '', submitted: false }
      const updated = { ...current, [field]: val }

      // Auto-populate remark if both scores are present and remark is empty
      if ((field === 'cs' || field === 'es') && updated.remarks === '') {
        const csVal = field === 'cs' ? val : updated.cs
        const esVal = field === 'es' ? val : updated.es
        
        if (csVal !== '' && esVal !== '') {
          const total = (parseFloat(csVal)||0) + (parseFloat(esVal)||0)
          const grade = getGrade(total).grade
          updated.remarks = getRandomRemark(grade)
        }
      }

      return {
        ...prev,
        [sid]: { ...prev[sid], [subId]: updated }
      }
    })
    setDirty(true)
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
    autoSaveRef.current = setTimeout(() => handleSave(false), 2500)
  }, [])

  const autoFillRemarks = () => {
    // Refresh ALL entries that have both scores — including already-filled ones.
    // Count is computed synchronously from current scoreMap (before the lazy setter runs).
    let eligible = 0
    Object.keys(scoreMap).forEach(sid => {
      Object.keys(scoreMap[sid] ?? {}).forEach(subId => {
        const sc = scoreMap[sid][subId]
        if (sc && sc.cs !== '' && sc.es !== '') eligible++
      })
    })

    if (eligible === 0) {
      toast('No scores entered yet — enter Class Score and Exam Score first')
      return
    }

    setScoreMap(prev => {
      const next: ScoreMap = {}
      Object.keys(prev).forEach(sid => {
        next[sid] = {}
        Object.keys(prev[sid]).forEach(subId => {
          const sc = prev[sid][subId]
          // Refresh remark for ANY entry with both scores (overwrite existing)
          if (sc && sc.cs !== '' && sc.es !== '') {
            const total = (parseFloat(sc.cs) || 0) + (parseFloat(sc.es) || 0)
            const grade = getGrade(total).grade
            next[sid][subId] = { ...sc, remarks: getRandomRemark(grade) }
          } else {
            next[sid][subId] = { ...sc }
          }
        })
      })
      return next
    })
    setDirty(true)
    toast.success(`${eligible} remark${eligible > 1 ? 's' : ''} refreshed ✨`)
  }

  // ── calculations ──────────────────────────────────────
  function getTotal(sid: string, subId: string): number {
    const s = scoreMap[sid]?.[subId]
    if (!s) return 0
    return parseFloat(((parseFloat(s.cs)||0) + (parseFloat(s.es)||0)).toFixed(2))
  }

  function getStudentAvg(sid: string): number {
    const totals = subjects.map(sub => getTotal(sid, sub.id)).filter(t => t > 0)
    return totals.length ? totals.reduce((a,b) => a+b, 0) / totals.length : 0
  }

  function getSubjectAvg(subId: string): number {
    const totals = students.map(s => getTotal(s.id, subId)).filter(t => t > 0)
    return totals.length ? totals.reduce((a,b) => a+b, 0) / totals.length : 0
  }

  // Positions per subject
  function getPositions(subId: string): Record<string,number> {
    const sorted = [...students]
      .map(s => ({ id: s.id, total: getTotal(s.id, subId) }))
      .filter(s => s.total > 0)
      .sort((a,b) => b.total - a.total)
    const pos: Record<string,number> = {}
    sorted.forEach((s,i) => { pos[s.id] = i+1 })
    return pos
  }

  // Overall student ranking by average
  function getOverallPositions(): Record<string,number> {
    const sorted = [...students]
      .map(s => ({ id: s.id, avg: getStudentAvg(s.id) }))
      .filter(s => s.avg > 0)
      .sort((a,b) => b.avg - a.avg)
    const pos: Record<string,number> = {}
    sorted.forEach((s,i) => { pos[s.id] = i+1 })
    return pos
  }

  // ── save ──────────────────────────────────────────────
  async function handleSave(showToast = true) {
    if (!selectedClass || !term?.id || !year?.id || !teacherRecord?.id) return
    setSaving(true)
    try {
      const upserts: any[] = []
      students.forEach(s => {
        subjects.forEach(sub => {
          const sc = scoreMap[s.id]?.[sub.id]
          if (!sc || (sc.cs === '' && sc.es === '')) return
          const csVal = parseFloat(sc.cs) || 0
          const esVal = parseFloat(sc.es) || 0
          upserts.push({
            student_id: s.id,
            subject_id: sub.id,
            class_id: selectedClass,
            term_id: term!.id,
            academic_year_id: year!.id,
            teacher_id: teacherRecord.id,
            class_score: csVal,
            exam_score: esVal,
            // total_score is a GENERATED column — DB computes it from class_score + exam_score
            teacher_remarks: sc.remarks || null,
            is_submitted: sc.submitted ?? false,
          })
        })
      })
      if (upserts.length === 0) { if (showToast) toast('No scores to save'); return }
      const { error } = await supabase.from('scores')
        .upsert(upserts, { onConflict: 'student_id,subject_id,term_id' })
      if (error) throw error
      setDirty(false)
      if (showToast) toast.success(`${upserts.length} scores saved ✓`)
    } catch (e: any) {
      if (showToast) toast.error(e.message ?? 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmit() {
    const entered = students.filter(s => subjects.some(sub => scoreMap[s.id]?.[sub.id]?.cs !== '')).length
    if (!entered) { toast.error('No scores entered yet'); return }
    if (!confirm(`Submit all scores for this class to admin?\n\nThis marks them as final. You can still edit until the term is locked.`)) return
    await handleSave(false)
    setSubmitting(true)
    try {
      const { error } = await supabase.from('scores')
        .update({ is_submitted: true })
        .eq('class_id', selectedClass)
        .eq('term_id', term!.id)
        .eq('teacher_id', teacherRecord.id)
      if (error) throw error
      toast.success('All scores submitted to admin ✅', { duration: 5000 })
      await loadClassData()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const overallPos = getOverallPositions()
  const enteredCount = students.filter(s => subjects.some(sub => scoreMap[s.id]?.[sub.id]?.cs !== '')).length

  // Column widths
  const COL_STUDENT = 180
  const COL_SUBJECT = 130 // per subject: cs + es + total + grade

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _spin{to{transform:rotate(360deg)}}
        @keyframes _fi{from{opacity:0}to{opacity:1}}
        input[type=number]::-webkit-inner-spin-button{opacity:0}
        input[type=number]:focus::-webkit-inner-spin-button{opacity:1}
        .sba-table{border-collapse:collapse;font-family:"DM Sans",sans-serif}
        .sba-table th{background:linear-gradient(135deg,#faf5ff,#f5f3ff);font-size:10px;font-weight:700;color:#6d28d9;text-transform:uppercase;letter-spacing:.06em;padding:8px 6px;border:1px solid #ede9fe;white-space:nowrap;text-align:center}
        .sba-table td{border:1px solid #f0eefe;padding:4px 6px;vertical-align:middle}
        .sba-row:hover td{background:#faf5ff !important}
        .sba-row:hover .sticky-std{background:#f5f3ff !important}
        .sticky-std{position:sticky;left:0;background:#fff;z-index:4;border-right:2px solid #ddd6fe !important}
        .sub-header{background:linear-gradient(135deg,#ede9fe,#ddd6fe) !important;color:#5b21b6 !important}
        .total-col{background:#f0fdf4 !important;font-weight:800}
        .grade-badge{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:7px;font-size:11px;font-weight:800}
        .footer-row td{background:linear-gradient(135deg,#faf5ff,#f5f3ff) !important;font-weight:700;font-size:11px}
      `}</style>

      <div style={{ fontFamily:'"DM Sans",system-ui,sans-serif', animation:'_fi .4s ease' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom:20, display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div>
            <h1 style={{ fontFamily:'"Playfair Display",serif', fontSize:24, fontWeight:700, color:'#111827', margin:0 }}>
              GES Score Entry
            </h1>
            <p style={{ fontSize:13, color:'#6b7280', marginTop:3 }}>
              {(term as any)?.name ?? '—'} · {(year as any)?.name ?? '—'}
              {isLocked && <span style={{ marginLeft:8, fontSize:11, fontWeight:700, background:'#fef2f2', color:'#dc2626', padding:'2px 8px', borderRadius:99 }}>🔒 LOCKED</span>}
              {dirty && !saving && <span style={{ marginLeft:8, fontSize:11, color:'#d97706' }}>● Unsaved changes</span>}
              {saving && <span style={{ marginLeft:8, fontSize:11, color:'#6d28d9' }}>Saving…</span>}
            </p>
          </div>
          {selectedClass && students.length > 0 && !isLocked && (
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => handleSave(true)} disabled={saving || !dirty}
                style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'8px 16px', borderRadius:9, fontSize:13, fontWeight:600, background:'#fff', color:'#374151', border:'1.5px solid #e5e7eb', cursor: dirty ? 'pointer' : 'not-allowed', opacity: dirty ? 1 : 0.5, transition:'all .15s' }}>
                {saving ? <span style={{ width:12,height:12,borderRadius:'50%',border:'2px solid #e5e7eb',borderTopColor:'#6d28d9',animation:'_spin .7s linear infinite' }} /> : '💾'}
                Save
              </button>
              <button onClick={handleSubmit} disabled={submitting || enteredCount === 0}
                style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'8px 16px', borderRadius:9, fontSize:13, fontWeight:600, background:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'#fff', border:'none', cursor:'pointer', boxShadow:'0 2px 8px rgba(109,40,217,.28)', opacity: enteredCount === 0 ? 0.5 : 1 }}>
                {submitting ? <span style={{ width:12,height:12,borderRadius:'50%',border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',animation:'_spin .7s linear infinite' }} /> : '📤'}
                Submit to Admin
              </button>
            </div>
          )}
        </div>

        {/* ── Controls ── */}
        <div style={{ background:'#fff', borderRadius:14, padding:'16px 20px', border:'1.5px solid #f0eefe', marginBottom:18, display:'flex', flexWrap:'wrap', gap:16, alignItems:'flex-end' }}>

          {/* Class selector */}
          <div style={{ flex:'1 1 200px' }}>
            <label style={{ display:'block', fontSize:11, fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase', color:'#6b7280', marginBottom:5 }}>Class</label>
            <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
              style={{ width:'100%', padding:'9px 12px', borderRadius:9, fontSize:13, border:'1.5px solid #e5e7eb', outline:'none', background:'#faf5ff', color:'#111827', fontFamily:'"DM Sans",sans-serif', cursor:'pointer' }}>
              <option value="">Select class…</option>
              {(classOptions as any[]).map((c:any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Weights */}
          <div>
            <label style={{ display:'block', fontSize:11, fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase', color:'#6b7280', marginBottom:5 }}>
              Score Weights &nbsp;
              <span style={{ fontSize:10, fontWeight:600, color: classWeight + examWeight === 100 ? '#16a34a' : '#dc2626' }}>
                ({classWeight}% + {examWeight}% = {classWeight+examWeight}%)
              </span>
            </label>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:5, background:'#f5f3ff', borderRadius:8, padding:'5px 10px' }}>
                <span style={{ fontSize:11, fontWeight:700, color:'#6d28d9' }}>Class</span>
                <input type="number" min={0} max={100} value={classWeight}
                  onChange={e => { const v = Math.min(100, parseInt(e.target.value)||0); setClassWeight(v); setExamWeight(100-v) }}
                  style={{ width:44, padding:'3px 5px', borderRadius:6, border:'1.5px solid #ddd6fe', fontSize:12, fontWeight:700, color:'#6d28d9', textAlign:'center', outline:'none', fontFamily:'"DM Sans",sans-serif' }} />
                <span style={{ fontSize:11, color:'#9ca3af' }}>%</span>
              </div>
              <span style={{ color:'#9ca3af', fontSize:14 }}>+</span>
              <div style={{ display:'flex', alignItems:'center', gap:5, background:'#ecfeff', borderRadius:8, padding:'5px 10px' }}>
                <span style={{ fontSize:11, fontWeight:700, color:'#0891b2' }}>Exam</span>
                <input type="number" min={0} max={100} value={examWeight}
                  onChange={e => { const v = Math.min(100, parseInt(e.target.value)||0); setExamWeight(v); setClassWeight(100-v) }}
                  style={{ width:44, padding:'3px 5px', borderRadius:6, border:'1.5px solid #a5f3fc', fontSize:12, fontWeight:700, color:'#0891b2', textAlign:'center', outline:'none', fontFamily:'"DM Sans",sans-serif' }} />
                <span style={{ fontSize:11, color:'#9ca3af' }}>%</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          {students.length > 0 && subjects.length > 0 && (
            <div style={{ display:'flex', gap:20, marginLeft:'auto', flexWrap:'wrap' }}>
              {[
                { l:'Students', v: students.length },
                { l:'Entered',  v: enteredCount, color:'#16a34a' },
                { l:'Subjects', v: subjects.length },
              ].map(s => (
                <div key={s.l} style={{ textAlign:'center' }}>
                  <div style={{ fontSize:10, color:'#9ca3af', fontWeight:700, textTransform:'uppercase' }}>{s.l}</div>
                  <div style={{ fontSize:18, fontWeight:800, color:(s as any).color ?? '#111827' }}>{s.v}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── No selection ── */}
        {!selectedClass && (
          <div style={{ background:'#fff', borderRadius:16, padding:'60px 20px', textAlign:'center', border:'1.5px solid #f0eefe' }}>
            <div style={{ fontSize:52, marginBottom:12 }}>📋</div>
            <h3 style={{ fontFamily:'"Playfair Display",serif', fontSize:18, fontWeight:700, color:'#111827', marginBottom:6 }}>Select a class to begin</h3>
            <p style={{ fontSize:13, color:'#9ca3af' }}>All your assigned subjects for that class will appear as columns.</p>
          </div>
        )}

        {/* ── Loading ── */}
        {loading && selectedClass && (
          <div style={{ display:'flex', justifyContent:'center', padding:'60px 0', flexDirection:'column', alignItems:'center', gap:12 }}>
            <div style={{ width:36,height:36,borderRadius:'50%',border:'3px solid #ede9fe',borderTopColor:'#6d28d9',animation:'_spin .8s linear infinite' }} />
            <p style={{ fontSize:13, color:'#9ca3af' }}>Loading class data…</p>
          </div>
        )}

        {/* ── No students ── */}
        {!loading && selectedClass && students.length === 0 && (
          <div style={{ background:'#fff', borderRadius:16, padding:'50px 20px', textAlign:'center', border:'1.5px solid #f0eefe' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>👥</div>
            <p style={{ fontSize:14, fontWeight:700, color:'#111827' }}>No students in this class</p>
            <p style={{ fontSize:13, color:'#9ca3af' }}>Ask the admin to add students.</p>
          </div>
        )}

        {/* ── THE GES SBA TABLE ── */}
        {!loading && selectedClass && students.length > 0 && subjects.length > 0 && (
          <div style={{ background:'#fff', borderRadius:16, border:'1.5px solid #f0eefe', overflow:'hidden', boxShadow:'0 1px 4px rgba(109,40,217,.07)' }}>

            {/* Legend */}
            <div style={{ padding:'10px 16px', borderBottom:'1px solid #faf5ff', display:'flex', gap:16, flexWrap:'wrap', alignItems:'center' }}>
              <span style={{ fontSize:11, fontWeight:700, color:'#6d28d9' }}>📊 GES SBA Score Sheet</span>
              {[
                { label:`CS = Class Score (/${classWeight})`, color:'#6d28d9', bg:'#f5f3ff' },
                { label:`ES = Exam Score (/${examWeight})`, color:'#0891b2', bg:'#ecfeff' },
                { label:'Total = CS + ES', color:'#16a34a', bg:'#f0fdf4' },
              ].map(l => (
                <span key={l.label} style={{ fontSize:10, fontWeight:600, color:l.color, background:l.bg, padding:'2px 8px', borderRadius:99 }}>{l.label}</span>
              ))}
              <span style={{ fontSize:10, color:'#9ca3af', marginLeft:'auto' }}>Click any cell to edit · Tab to move right · Enter to move down</span>
            </div>

            <div style={{ overflowX:'auto', overflowY:'auto', maxHeight:'70vh' }}>
              <table className="sba-table" style={{ minWidth: COL_STUDENT + subjects.length * COL_SUBJECT + 160 }}>

                {/* ── THEAD ── */}
                <thead style={{ position:'sticky', top:0, zIndex:10 }}>
                  {/* Row 1: Subject names spanning CS+ES+Total+Grade */}
                  <tr>
                    <th className="sticky-std" rowSpan={2}
                      style={{ minWidth:COL_STUDENT, textAlign:'left', paddingLeft:12, fontSize:11, zIndex:12, background:'linear-gradient(135deg,#faf5ff,#f5f3ff)' }}>
                      # &nbsp; Student
                    </th>
                    {subjects.map(sub => (
                      <th key={sub.id} colSpan={4} className="sub-header"
                        style={{ fontSize:11, fontWeight:800, color:'#4c1d95', borderLeft:'2px solid #c4b5fd', textAlign:'center', padding:'8px 4px' }}>
                        {sub.name}{sub.code ? ` (${sub.code})` : ''}
                      </th>
                    ))}
                    <th colSpan={3} style={{ background:'linear-gradient(135deg,#fef3c7,#fde68a)', color:'#78350f', fontSize:11, fontWeight:800, textAlign:'center' }}>
                      Overall
                    </th>
                  </tr>
                  {/* Row 2: CS / ES / Total / Grade per subject */}
                  <tr>
                    {subjects.map(sub => (
                      <>
                        <th key={sub.id+'cs'} style={{ fontSize:10, color:'#6d28d9', background:'#f5f3ff', borderLeft:'2px solid #c4b5fd', minWidth:56 }}>CS</th>
                        <th key={sub.id+'es'} style={{ fontSize:10, color:'#0891b2', background:'#ecfeff', minWidth:56 }}>ES</th>
                        <th key={sub.id+'tot'} style={{ fontSize:10, color:'#16a34a', background:'#f0fdf4', minWidth:52 }}>Tot</th>
                        <th key={sub.id+'gr'} style={{ fontSize:10, color:'#6b7280', minWidth:38 }}>Grd</th>
                      </>
                    ))}
                    <th style={{ fontSize:10, color:'#92400e', background:'#fffbeb', minWidth:52 }}>Avg</th>
                    <th style={{ fontSize:10, color:'#92400e', background:'#fffbeb', minWidth:38 }}>Grd</th>
                    <th style={{ fontSize:10, color:'#92400e', background:'#fffbeb', minWidth:42 }}>Pos</th>
                  </tr>
                </thead>

                {/* ── TBODY ── */}
                <tbody>
                  {students.map((stu, rowIdx) => {
                    const avg = getStudentAvg(stu.id)
                    const overallGrade = avg > 0 ? getGrade(avg) : null
                    const pos = overallPos[stu.id]
                    const isSubmittedRow = subjects.every(sub => scoreMap[stu.id]?.[sub.id]?.submitted)

                    return (
                      <tr key={stu.id} className="sba-row">
                        {/* Student name — sticky */}
                        <td className="sticky-std" style={{ padding:'6px 12px', background: rowIdx % 2 === 0 ? '#fff' : '#fafafa' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <span style={{ fontSize:11, color:'#9ca3af', width:18, textAlign:'right', flexShrink:0 }}>{rowIdx+1}</span>
                            <div style={{ width:26,height:26,borderRadius:'50%',background:'linear-gradient(135deg,#7c3aed,#6d28d9)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800,color:'#fff',flexShrink:0 }}>
                              {stu.full_name.charAt(0)}
                            </div>
                            <div style={{ minWidth:0 }}>
                              <div style={{ fontSize:12, fontWeight:700, color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:110 }}>{stu.full_name}</div>
                              {stu.student_id && <div style={{ fontSize:9, color:'#9ca3af', fontFamily:'monospace' }}>{stu.student_id}</div>}
                            </div>
                            {isSubmittedRow && <span style={{ fontSize:9, color:'#16a34a', flexShrink:0 }}>✓</span>}
                          </div>
                        </td>

                        {/* Per-subject scores */}
                        {subjects.map((sub, colIdx) => {
                          const sc = scoreMap[stu.id]?.[sub.id] ?? { cs:'', es:'', remarks:'', submitted:false }
                          const total = getTotal(stu.id, sub.id)
                          const g = total > 0 ? getGrade(total) : null
                          const csOver = (parseFloat(sc.cs)||0) > classWeight
                          const esOver = (parseFloat(sc.es)||0) > examWeight
                          const isActive = activeCell?.sid === stu.id && activeCell?.subId === sub.id
                          const bgBase = rowIdx % 2 === 0 ? '#fff' : '#fafafa'

                          return (
                            <Fragment key={stu.id + sub.id}>
                              {/* CS */}
                              <td style={{ background: isActive ? '#faf5ff' : bgBase, borderLeft:'2px solid #ede9fe', textAlign:'center', padding:'4px' }}
                                onClick={() => setActiveCell({ sid:stu.id, subId:sub.id, field:'cs' })}>
                                <TinyInput value={sc.cs} max={classWeight} disabled={isLocked}
                                  onChange={v => updateScore(stu.id, sub.id, 'cs', v)} />
                                {csOver && <div style={{ fontSize:8, color:'#dc2626' }}>max {classWeight}</div>}
                              </td>
                              {/* ES */}
                              <td style={{ background: isActive ? '#faf5ff' : bgBase, textAlign:'center', padding:'4px' }}
                                onClick={() => setActiveCell({ sid:stu.id, subId:sub.id, field:'es' })}>
                                <TinyInput value={sc.es} max={examWeight} disabled={isLocked}
                                  onChange={v => updateScore(stu.id, sub.id, 'es', v)} />
                                {esOver && <div style={{ fontSize:8, color:'#dc2626' }}>max {examWeight}</div>}
                              </td>
                              {/* Total */}
                              <td className="total-col" style={{ textAlign:'center', padding:'4px 6px' }}>
                                {total > 0
                                  ? <span style={{ fontSize:13, fontWeight:800, color: total >= 50 ? '#16a34a' : '#dc2626' }}>{total.toFixed(1)}</span>
                                  : <span style={{ color:'#d1d5db', fontSize:11 }}>—</span>}
                              </td>
                              {/* Grade */}
                              <td style={{ textAlign:'center', padding:'4px 3px', background: rowIdx % 2 === 0 ? '#fff' : '#fafafa' }}>
                                {g
                                  ? <span className="grade-badge" style={{ background:g.color+'18', color:g.color }}>{g.grade}</span>
                                  : <span style={{ color:'#d1d5db', fontSize:11 }}>—</span>}
                              </td>
                            </Fragment>
                          )
                        })}

                        {/* Overall */}
                        <td style={{ textAlign:'center', background:'#fffbeb', padding:'4px 6px' }}>
                          {avg > 0
                            ? <span style={{ fontSize:13, fontWeight:800, color:overallGrade!.color }}>{avg.toFixed(1)}</span>
                            : <span style={{ color:'#d1d5db', fontSize:11 }}>—</span>}
                        </td>
                        <td style={{ textAlign:'center', background:'#fffbeb', padding:'4px 3px' }}>
                          {overallGrade
                            ? <span className="grade-badge" style={{ background:overallGrade.color+'18', color:overallGrade.color }}>{overallGrade.grade}</span>
                            : <span style={{ color:'#d1d5db', fontSize:11 }}>—</span>}
                        </td>
                        <td style={{ textAlign:'center', background:'#fffbeb', padding:'4px 6px' }}>
                          {pos
                            ? <span style={{ fontSize:12, fontWeight:800, color:'#92400e', background:'#fde68a', padding:'2px 6px', borderRadius:99 }}>#{pos}</span>
                            : <span style={{ color:'#d1d5db', fontSize:11 }}>—</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>

                {/* ── FOOTER: Subject averages ── */}
                <tfoot style={{ position:'sticky', bottom:0, zIndex:8 }}>
                  <tr className="footer-row">
                    <td className="sticky-std" style={{ padding:'8px 12px', fontSize:11, fontWeight:800, color:'#6d28d9', background:'linear-gradient(135deg,#faf5ff,#f5f3ff)' }}>
                      Subject Averages
                    </td>
                    {subjects.map(sub => {
                      const avg = getSubjectAvg(sub.id)
                      const g = avg > 0 ? getGrade(avg) : null
                      const csAvg = students.reduce((s,st) => s + (parseFloat(scoreMap[st.id]?.[sub.id]?.cs)||0), 0) / Math.max(1, students.filter(st => scoreMap[st.id]?.[sub.id]?.cs !== '').length)
                      const esAvg = students.reduce((s,st) => s + (parseFloat(scoreMap[st.id]?.[sub.id]?.es)||0), 0) / Math.max(1, students.filter(st => scoreMap[st.id]?.[sub.id]?.es !== '').length)
                      return (
                        <Fragment key={sub.id}>
                          <td style={{ textAlign:'center', borderLeft:'2px solid #ede9fe', fontSize:11, color:'#6d28d9' }}>{isNaN(csAvg) ? '—' : csAvg.toFixed(1)}</td>
                          <td style={{ textAlign:'center', fontSize:11, color:'#0891b2' }}>{isNaN(esAvg) ? '—' : esAvg.toFixed(1)}</td>
                          <td style={{ textAlign:'center', fontSize:12, fontWeight:800, color: avg >= 50 ? '#16a34a' : avg > 0 ? '#dc2626' : '#d1d5db' }}>
                            {avg > 0 ? avg.toFixed(1) : '—'}
                          </td>
                          <td style={{ textAlign:'center' }}>
                            {g ? <span className="grade-badge" style={{ background:g.color+'18', color:g.color }}>{g.grade}</span> : '—'}
                          </td>
                        </Fragment>
                      )
                    })}
                    <td colSpan={3} style={{ textAlign:'center', background:'#fffbeb', fontSize:11, color:'#92400e' }}>
                      {enteredCount}/{students.length} students entered
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Remarks row below table */}
            {students.length > 0 && subjects.length > 0 && !isLocked && (
              <div style={{ padding:'14px 20px', borderTop:'1px solid #faf5ff', background:'#fafafa' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                  <p style={{ fontSize:11, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'.06em', margin:0 }}>
                    📝 Remarks (per student per subject)
                  </p>
                  <button onClick={autoFillRemarks}
                    title="Generates a fresh grade-appropriate remark for every student/subject with scores entered — overwrites existing remarks"
                    style={{ fontSize:10, fontWeight:700, color:'#6d28d9', background:'#f5f3ff', border:'1px solid #ddd6fe', padding:'4px 10px', borderRadius:6, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
                    🔄 Refresh All Remarks
                  </button>
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
                  {students.map(stu => (
                    subjects.map(sub => {
                      const sc = scoreMap[stu.id]?.[sub.id]
                      if (!sc || sc.cs === '') return null
                      return (
                        <div key={stu.id+sub.id} style={{ display:'flex', alignItems:'center', gap:6, background:'#fff', border:'1px solid #e5e7eb', borderRadius:9, padding:'5px 10px', minWidth:0 }}>
                          <span style={{ fontSize:10, fontWeight:700, color:'#6d28d9', flexShrink:0 }}>{stu.full_name.split(' ')[0]} · {sub.code ?? sub.name.slice(0,4)}</span>
                          <select value={sc.remarks} onChange={e => updateScore(stu.id, sub.id, 'remarks', e.target.value)}
                            style={{ fontSize:11, border:'none', outline:'none', background:'transparent', color:'#374151', cursor:'pointer', maxWidth:180, fontFamily:'"DM Sans",sans-serif' }}>
                            <option value="">No remark…</option>
                            {(GRADE_REMARKS[getGrade(getTotal(stu.id, sub.id)).grade] || TEACHER_REMARKS).map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </div>
                      )
                    })
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}