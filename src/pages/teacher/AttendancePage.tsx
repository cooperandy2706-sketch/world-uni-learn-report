import { useStuckLoadingReload } from '../../hooks/useStuckLoadingReload'
// src/pages/teacher/AttendancePage.tsx
// Morning register — class teacher marks daily attendance
// Uses the existing `attendance` table (term totals: total_days, days_present, days_absent)
// Each morning submission increments the running term totals automatically.

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useCurrentTerm } from '../../hooks/useSettings'
import toast from 'react-hot-toast'
import { useAutoRefresh } from "../../hooks/useAutoRefresh";

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const TODAY_KEY = (userId: string, classId: string) => `wula_att_submitted_${userId}_${classId}_${new Date().toISOString().slice(0, 10)}`

type Mark = 'present' | 'absent' | 'late'

interface Student {
  id: string
  full_name: string
  student_id: string | null
  gender: string | null
}

interface AttendanceRow {
  studentId: string
  mark: Mark
}

// ══════════════════════════════════════════════════════════════════════════════
export default function TeacherAttendancePage() {
    useAutoRefresh(loadStudents);
  const { user } = useAuth()
  const { data: term } = useCurrentTerm()

  const [loading, setLoading] = useState(true)
  useStuckLoadingReload(loading)
  const [saving, setSaving] = useState(false)
  const [myClasses, setMyClasses] = useState<any[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)
  
  const myClass = useMemo(() => myClasses.find(c => c.id === selectedClassId), [myClasses, selectedClassId])
  
  const [students, setStudents] = useState<Student[]>([])
  const [marks, setMarks] = useState<Record<string, Mark>>({})
  const [dbMarks, setDbMarks] = useState<Record<string, Mark>>({})
  const [submittedToday, setSubmittedToday] = useState(false)
  const [termTotals, setTermTotals] = useState<Record<string, { total: number; present: number }>>({})
  const todayDate = new Date().toISOString().slice(0, 10)
  const todayDay = new Date().getDay()
  const isWeekend = todayDay === 0 || todayDay === 6

  // ── Load ─────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!user || !term) return
    setLoading(true)

    // 1. Get teacher record
    const { data: t } = await supabase.from('teachers').select('id').eq('user_id', user.id).maybeSingle()
    if (!t) { setLoading(false); return }

    // 2. Find all classes where this teacher is the class teacher
    const { data: cls } = await supabase
      .from('classes')
      .select('id, name')
      .eq('class_teacher_id', t.id)

    let fetchedClasses = cls || []

    if (fetchedClasses.length === 0) {
      // Fallback: try teacher_assignments to find classes they teach
      const { data: asgn } = await supabase
        .from('teacher_assignments')
        .select('class:classes(id,name)')
        .eq('teacher_id', t.id)
        .eq('term_id', (term as any).id)

      if (asgn && asgn.length > 0) {
        const unique = new Map()
        asgn.forEach(a => {
           const c = a.class as any
           if (c && !unique.has(c.id)) unique.set(c.id, c)
        })
        fetchedClasses = Array.from(unique.values())
      }
    }

    setMyClasses(fetchedClasses)
    if (fetchedClasses.length > 0) {
      setSelectedClassId(fetchedClasses[0].id)
      await loadStudents(fetchedClasses[0].id, (term as any).id)
    }
    setLoading(false)
  }, [user, term])

  useEffect(() => { load() }, [load])

  // Check if already submitted today
  useEffect(() => {
    if (user && selectedClassId) {
      const done = !!localStorage.getItem(TODAY_KEY(user.id, selectedClassId))
      setSubmittedToday(done)
      checkDbSubmitted(selectedClassId)
    }
  }, [user, selectedClassId])

  async function checkDbSubmitted(classId: string) {
    if (!term) return
    // Count today's attendance_records for this class (from both QR gate scan and manual entry)
    const { count: recordCount } = await supabase
        .from('attendance_records')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', classId)
        .eq('date', todayDate)

    // BUG FIX: was `data: studentCount` (always null). Correct destructuring is `count: studentCount`
    const { count: studentCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', classId)
        .eq('is_active', true)

    if (recordCount !== null && studentCount !== null && recordCount >= studentCount && studentCount > 0) {
      localStorage.setItem(TODAY_KEY(user!.id, classId), '1')
      setSubmittedToday(true)
    } else {
      localStorage.removeItem(TODAY_KEY(user!.id, classId))
      setSubmittedToday(false)
    }
  }

  async function handleClassChange(classId: string) {
    if (classId === selectedClassId) return
    setSelectedClassId(classId)
    setStudents([])
    setMarks({})
    setLoading(true)
    await loadStudents(classId, (term as any).id)
    setLoading(false)
  }

  async function loadStudents(classId: string, termId: string) {
    const { data: studs } = await supabase
      .from('students')
      .select('id, full_name, student_id, gender')
      .eq('class_id', classId)
      .eq('is_active', true)
      .order('full_name')

    if (!studs) return
    setStudents(studs)

    // Load existing term totals for each student
    const { data: attRows } = await supabase
      .from('attendance')
      .select('student_id, total_days, days_present')
      .in('student_id', studs.map(s => s.id))
      .eq('term_id', termId)

    const totals: Record<string, { total: number; present: number }> = {}
    for (const r of attRows ?? []) {
      totals[r.student_id] = { total: r.total_days ?? 0, present: r.days_present ?? 0 }
    }
    setTermTotals(totals)

    // 3. Load today's marks (e.g. from QR scanner)
    const { data: todayRecs } = await supabase
      .from('attendance_records')
      .select('student_id, status')
      .eq('class_id', classId)
      .eq('date', todayDate)

    const dbM: Record<string, Mark> = {}
    for (const r of todayRecs ?? []) {
      dbM[r.student_id] = r.status as Mark
    }
    setDbMarks(dbM)

    // Default all to present, but use DB marks if they exist
    const defaultMarks: Record<string, Mark> = {}
    for (const s of studs) {
      defaultMarks[s.id] = dbM[s.id] || 'present'
    }
    setMarks(defaultMarks)
  }

  function setMark(studentId: string, mark: Mark) {
    setMarks(m => ({ ...m, [studentId]: mark }))
  }

  function markAll(mark: Mark) {
    const m: Record<string, Mark> = {}
    (Array.isArray(students) ? students : []).forEach(s => { m[s.id] = mark })
    setMarks(m)
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function submit() {
    if (!term || !myClass || (Array.isArray(students) ? students : []).length === 0) return
    setSaving(true)

    try {
      // 0. Fetch teacher ID ONCE — not inside the loop (perf fix)
      const { data: tRecord } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user!.id)
        .maybeSingle()

      // 1. Get existing records for this class today (from both gate scanner and previous submit)
      const { data: existingRecs } = await supabase
        .from('attendance_records')
        .select('student_id')
        .eq('class_id', myClass.id)
        .eq('date', todayDate)

      const alreadyMarkedIds = new Set((existingRecs || []).map(r => r.student_id))

      // Students who still need manual marking
      const pendingStudents = (Array.isArray(students) ? students : []).filter(s => !alreadyMarkedIds.has(s.id))

      if (pendingStudents.length === 0) {
        toast.success('✅ All students are already marked for today (via Gate Scanner or previous submit)!')
        localStorage.setItem(TODAY_KEY(user!.id, myClass.id), '1')
        setSubmittedToday(true)
        setSaving(false)
        return
      }

      // 2. Batch-build the attendance_records rows to insert
      const recordsToInsert = pendingStudents
        .filter(student => tRecord?.id) // only if teacher record exists
        .map(student => ({
          student_id: student.id,
          class_id: myClass.id,
          teacher_id: tRecord!.id,
          term_id: (term as any).id,
          school_id: user!.school_id,
          date: todayDate,
          status: marks[student.id] ?? 'present',
        }))

      // 3. Batch insert all pending records at once (replaces the per-student loop)
      if (recordsToInsert.length > 0) {
        const { error: insertErr } = await supabase
          .from('attendance_records')
          .insert(recordsToInsert)
        if (insertErr) throw insertErr
      }

      // 4. Update attendance term totals for each pending student
      //    (still per-student since each has different values, but now runs in parallel)
      const termId = (term as any).id
      const { data: existingTotals } = await supabase
        .from('attendance')
        .select('id, student_id, total_days, days_present, days_absent')
        .in('student_id', pendingStudents.map(s => s.id))
        .eq('term_id', termId)

      const totalsMap = new Map((existingTotals ?? []).map(r => [r.student_id, r]))

      // Build parallel update/insert promises
      const totalUpdates = pendingStudents.map(student => {
        const mark = marks[student.id] ?? 'present'
        const isPresent = mark === 'present' || mark === 'late'
        const existing = totalsMap.get(student.id)

        if (existing) {
          return supabase.from('attendance').update({
            total_days: (existing.total_days ?? 0) + 1,
            days_present: (existing.days_present ?? 0) + (isPresent ? 1 : 0),
            days_absent: (existing.days_absent ?? 0) + (isPresent ? 0 : 1),
          }).eq('id', existing.id)
        } else {
          return supabase.from('attendance').insert({
            student_id: student.id,
            term_id: termId,
            total_days: 1,
            days_present: isPresent ? 1 : 0,
            days_absent: isPresent ? 0 : 1,
          })
        }
      })

      // Run all updates in parallel
      await Promise.all(totalUpdates)

      // Mark as submitted today
      localStorage.setItem(TODAY_KEY(user!.id, myClass.id), '1')
      setSubmittedToday(true)

      // Refresh term totals display
      await loadStudents(myClass.id, termId)

      const presentCount = pendingStudents.filter(s => (marks[s.id] ?? 'present') !== 'absent').length
      const absentCount = pendingStudents.filter(s => marks[s.id] === 'absent').length
      const qrCount = alreadyMarkedIds.size
      toast.success(
        `✅ Register submitted! ${presentCount} present, ${absentCount} absent.${
          qrCount > 0 ? ` (${qrCount} already auto-marked via Gate Scanner)` : ''
        }`,
        { duration: 6000 }
      )
    } catch (err: any) {
      console.error('Attendance submit error:', err)
      toast.error('Failed to save: ' + (err?.message || 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  const presentCount = Object.values(marks).filter(m => m === 'present' || m === 'late').length
  const absentCount = Object.values(marks).filter(m => m === 'absent').length
  const lateCount = Object.values(marks).filter(m => m === 'late').length

  // ── Render ────────────────────────────────────────────────────────────────
  const todayLabel = `${DAYS[todayDay]}, ${new Date().toLocaleDateString('en-GH', { day: 'numeric', month: 'long', year: 'numeric' })}`

  return (
    <div className="tp-page">
      <link rel="stylesheet" href="/src/styles/teacher-portal.css" />

      {/* ── HERO ── */}
      <div className="tp-hero" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div className="tp-hero-label">Morning Register</div>
            <h1 className="tp-hero-title">📋 Attendance</h1>
            <p className="tp-hero-sub">{todayLabel}</p>
          </div>
          {myClass && !loading && !isWeekend && (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[
                { label: 'Present', count: presentCount, color: '#34D399' },
                { label: 'Absent',  count: absentCount,  color: '#FCA5A5' },
                { label: 'Late',    count: lateCount,    color: '#FDE68A' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 24, fontWeight: 900, color: s.color }}>{s.count}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── CLASS TAB STRIP ── */}
      {!loading && myClasses.length > 1 && !isWeekend && (
        <div className="tp-tab-bar">
          {myClasses.map(c => (
            <button
              key={c.id}
              className={`tp-tab${selectedClassId === c.id ? ' active' : ''}`}
              onClick={() => handleClassChange(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* ── LOADING ── */}
      {loading && (
        <div className="tp-loading">
          <div className="tp-spinner" />
          Loading students…
        </div>
      )}

      {/* ── NO CLASS ── */}
      {!loading && !myClass && (
        <div className="tp-card">
          <div className="tp-empty">
            <div className="tp-empty-icon">🏫</div>
            <div className="tp-empty-title">No class assigned</div>
            <p className="tp-empty-sub">You haven't been assigned as a class teacher yet. Ask the admin to assign your home class.</p>
          </div>
        </div>
      )}

      {/* ── WEEKEND ── */}
      {!loading && myClass && isWeekend && (
        <div className="tp-alert tp-alert-success">
          <span style={{ fontSize: 24 }}>🎉</span>
          <div>
            <div style={{ fontWeight: 800, marginBottom: 2 }}>Enjoy your weekend!</div>
            <div>Morning register is only required Monday–Friday. See you on Monday!</div>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      {!loading && myClass && !isWeekend && (
        <>
          {/* Class banner */}
          <div className="tp-card" style={{ margin: '0 0 14px', overflow: 'hidden' }}>
            <div style={{
              background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
              padding: '16px 18px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12
            }}>
              <div style={{ color: '#fff' }}>
                <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Home Class</div>
                <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 22, fontWeight: 900 }}>{myClass.name}</div>
                <div style={{ fontSize: 13, opacity: 0.75, marginTop: 2 }}>{(Array.isArray(students) ? students : []).length} students enrolled</div>
              </div>
              <div style={{
                background: submittedToday ? 'rgba(52,211,153,0.2)' : 'rgba(253,224,71,0.2)',
                border: `1px solid ${submittedToday ? 'rgba(52,211,153,0.4)' : 'rgba(253,224,71,0.3)'}`,
                borderRadius: 12, padding: '10px 16px', textAlign: 'center'
              }}>
                <div style={{ fontSize: 22 }}>{submittedToday ? '✅' : '📋'}</div>
                <div style={{ fontSize: 11, fontWeight: 800, color: submittedToday ? '#34D399' : '#FDE68A', marginTop: 4, whiteSpace: 'nowrap' }}>
                  {submittedToday ? 'Submitted' : 'Pending'}
                </div>
              </div>
            </div>
          </div>

          {/* Submitted banner */}
          {submittedToday && (
            <div className="tp-alert tp-alert-success" style={{ marginBottom: 14 }}>
              <span style={{ fontSize: 20 }}>✅</span>
              <div>
                <div style={{ fontWeight: 800, marginBottom: 2 }}>Register complete for today</div>
                <div style={{ fontSize: 12 }}>
                  {Object.keys(dbMarks).length > 0
                    ? `${Object.keys(dbMarks).length} of ${(Array.isArray(students) ? students : []).length} students were auto-marked via Gate Scanner.`
                    : 'The morning register has been submitted. Term totals are up to date.'
                  }
                </div>
              </div>
            </div>
          )}

          {/* QR tip */}
          <div className="tp-alert tp-alert-info" style={{ marginBottom: 14 }}>
            <span>🔍</span>
            <span style={{ fontSize: 12 }}>
              <strong>Gate Scanner:</strong> Students who scanned at the gate are auto-marked (shown with a <strong>QR</strong> badge) and locked from editing.
            </span>
          </div>

          {/* Mark-all row */}
          {!submittedToday && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>Mark all:</span>
              {(['present', 'absent', 'late'] as Mark[]).map(m => (
                <button
                  key={m}
                  className={`tp-att-btn ${m}`}
                  style={{ flex: 1, minWidth: 80, padding: '8px 6px' }}
                  onClick={() => markAll(m)}
                >
                  <span style={{ fontSize: 16 }}>
                    {m === 'present' ? '✓' : m === 'absent' ? '✗' : '⏳'}
                  </span>
                  <span style={{ fontSize: 11, textTransform: 'capitalize' }}>{m}</span>
                </button>
              ))}
            </div>
          )}

          {/* Student cards */}
          <div className="tp-card" style={{ overflow: 'visible' }}>
            <div className="tp-card-head">
              <span className="tp-card-title">👥 Students</span>
              <span className="tp-badge tp-badge-purple">{(Array.isArray(students) ? students : []).length} total</span>
            </div>
            <div>
              {(Array.isArray(students) ? students : []).map((s, i) => {
                const mark = marks[s.id] ?? 'present'
                const totals = termTotals[s.id]
                const pct = totals && totals.total > 0 ? Math.round((totals.present / totals.total) * 100) : null
                const isQr = !!dbMarks[s.id]
                const avatarColors: Record<string, string> = {
                  present: '#16A34A', absent: '#DC2626', late: '#D97706'
                }

                return (
                  <div key={s.id} className="tp-student-row" style={{
                    flexWrap: 'wrap',
                    gap: 10,
                    padding: '14px 18px',
                    animation: `tp-fade-up 0.35s ease ${i * 0.025}s both`
                  }}>
                    {/* Avatar */}
                    <div className="tp-avatar" style={{ background: `${avatarColors[mark]}CC` }}>
                      {s.full_name.charAt(0)}
                    </div>

                    {/* Name + meta */}
                    <div style={{ flex: 1, minWidth: 120 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        {s.full_name}
                        {isQr && <span className="tp-badge tp-badge-green" style={{ fontSize: 10 }}>QR Scan</span>}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, display: 'flex', gap: 8 }}>
                        <span>{s.student_id ?? (s.gender === 'male' ? '♂' : s.gender === 'female' ? '♀' : '')}</span>
                        {pct !== null && (
                          <span style={{
                            fontWeight: 700,
                            color: pct >= 75 ? '#16A34A' : pct >= 50 ? '#D97706' : '#DC2626'
                          }}>
                            Term: {pct}% ({totals!.present}/{totals!.total}d)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Mark buttons */}
                    {!submittedToday && (
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        {(['present', 'absent', 'late'] as Mark[]).map(opt => (
                          <button
                            key={opt}
                            className={`tp-att-btn ${opt}${mark === opt ? ' active' : ''}`}
                            disabled={isQr}
                            onClick={() => setMark(s.id, opt)}
                            style={{ minWidth: 64, padding: '8px 4px' }}
                          >
                            <span style={{ fontSize: 18 }}>
                              {opt === 'present' ? '✓' : opt === 'absent' ? '✗' : '⏳'}
                            </span>
                            <span style={{ fontSize: 10, textTransform: 'capitalize' }}>{opt}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Submitted state: show mark as badge */}
                    {submittedToday && (
                      <span className={`tp-badge ${mark === 'present' ? 'tp-badge-green' : mark === 'absent' ? 'tp-badge-red' : 'tp-badge-amber'}`}>
                        {mark === 'present' ? '✓ Present' : mark === 'absent' ? '✗ Absent' : '⏳ Late'}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── STICKY BOTTOM BAR ── */}
          {!submittedToday && (Array.isArray(students) ? students : []).length > 0 && (
            <div className="tp-bottom-bar">
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', flexShrink: 0, display: 'flex', gap: 10 }}>
                <span style={{ color: '#16A34A' }}>✓ {presentCount}</span>
                <span style={{ color: '#DC2626' }}>✗ {absentCount}</span>
                {lateCount > 0 && <span style={{ color: '#D97706' }}>⏳ {lateCount}</span>}
              </div>
              <button
                onClick={submit}
                disabled={saving}
                className="tp-btn tp-btn-primary"
                style={{ flex: 1 }}
              >
                {saving ? (
                  <><div className="tp-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Saving…</>
                ) : '📋 Submit Register'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
