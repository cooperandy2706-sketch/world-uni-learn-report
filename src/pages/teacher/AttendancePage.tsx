// src/pages/teacher/AttendancePage.tsx
// Morning register — class teacher marks daily attendance
// Uses the existing `attendance` table (term totals: total_days, days_present, days_absent)
// Each morning submission increments the running term totals automatically.

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useCurrentTerm } from '../../hooks/useSettings'
import toast from 'react-hot-toast'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const TODAY_KEY = (userId: string) => `wula_att_submitted_${userId}_${new Date().toISOString().slice(0, 10)}`

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
  const { user } = useAuth()
  const { data: term } = useCurrentTerm()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [myClass, setMyClass] = useState<any>(null)          // teacher's home class
  const [students, setStudents] = useState<Student[]>([])
  const [marks, setMarks] = useState<Record<string, Mark>>({})
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
    const { data: t } = await supabase.from('teachers').select('id').eq('user_id', user.id).single()
    if (!t) { setLoading(false); return }

    // 2. Find the class where this teacher is the class teacher
    //    (class_teacher_id column — added by migration or already existing)
    const { data: cls } = await supabase
      .from('classes')
      .select('id, name')
      .eq('class_teacher_id', t.id)
      .maybeSingle()

    if (!cls) {
      // Fallback: try teacher_assignments to find a class they primarily teach
      const { data: asgn } = await supabase
        .from('teacher_assignments')
        .select('class:classes(id,name)')
        .eq('teacher_id', t.id)
        .eq('term_id', (term as any).id)
        .limit(1)
        .maybeSingle()

      const fallback = (asgn as any)?.class
      setMyClass(fallback ?? null)
      if (!fallback) { setLoading(false); return }
      await loadStudents(fallback.id, (term as any).id)
      setLoading(false)
      return
    }

    setMyClass(cls)
    await loadStudents(cls.id, (term as any).id)
    setLoading(false)
  }, [user, term])

  useEffect(() => { load() }, [load])

  // Check if already submitted today
  useEffect(() => {
    if (user) {
      const done = !!localStorage.getItem(TODAY_KEY(user.id))
      setSubmittedToday(done)
    }
  }, [user])

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

    // Default all to present
    const defaultMarks: Record<string, Mark> = {}
    for (const s of studs) defaultMarks[s.id] = 'present'
    setMarks(defaultMarks)
  }

  function setMark(studentId: string, mark: Mark) {
    setMarks(m => ({ ...m, [studentId]: mark }))
  }

  function markAll(mark: Mark) {
    const m: Record<string, Mark> = {}
    students.forEach(s => { m[s.id] = mark })
    setMarks(m)
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function submit() {
    if (!term || !myClass || students.length === 0) return
    setSaving(true)

    try {
      for (const student of students) {
        const mark = marks[student.id] ?? 'present'
        const isPresent = mark === 'present' || mark === 'late'

        // Check if attendance record exists for this student+term
        const { data: existing } = await supabase
          .from('attendance')
          .select('id, total_days, days_present, days_absent')
          .eq('student_id', student.id)
          .eq('term_id', (term as any).id)
          .maybeSingle()

        if (existing) {
          // Increment running totals
          await supabase.from('attendance').update({
            total_days: (existing.total_days ?? 0) + 1,
            days_present: (existing.days_present ?? 0) + (isPresent ? 1 : 0),
            days_absent: (existing.days_absent ?? 0) + (isPresent ? 0 : 1),
          }).eq('id', existing.id)
        } else {
          // Create new record
          await supabase.from('attendance').insert({
            student_id: student.id,
            term_id: (term as any).id,
            school_id: user!.school_id,
            total_days: 1,
            days_present: isPresent ? 1 : 0,
            days_absent: isPresent ? 0 : 1,
          })
        }

        // ── RECORD DAILY LOG ──
        await supabase.from('attendance_records').insert({
          student_id: student.id,
          class_id: myClass.id,
          teacher_id: (await supabase.from('teachers').select('id').eq('user_id', user!.id).single()).data?.id,
          term_id: (term as any).id,
          school_id: user!.school_id, // Added school_id
          date: todayDate,
          status: mark,
        })
      }

      // Mark as submitted today
      localStorage.setItem(TODAY_KEY(user!.id), '1')
      setSubmittedToday(true)

      // Refresh term totals
      await loadStudents(myClass.id, (term as any).id)

      const presentCount = Object.values(marks).filter(m => m === 'present' || m === 'late').length
      const absentCount = Object.values(marks).filter(m => m === 'absent').length
      toast.success(`✅ Register submitted! ${presentCount} present, ${absentCount} absent.`, { duration: 6000 })
    } catch (err: any) {
      toast.error('Failed to save: ' + (err.message ?? 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  const presentCount = Object.values(marks).filter(m => m === 'present' || m === 'late').length
  const absentCount = Object.values(marks).filter(m => m === 'absent').length
  const lateCount = Object.values(marks).filter(m => m === 'late').length

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _att_fi { from{opacity:0} to{opacity:1} }
        @keyframes _att_up { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
        @keyframes _att_spin { to{transform:rotate(360deg)} }
        .att-row:hover { background: #faf5ff !important; }
        .att-btn { transition: all .15s; cursor: pointer; border: none; font-family: "DM Sans",sans-serif; font-weight: 700; border-radius: 8px; }
        .att-btn:hover { filter: brightness(1.08); transform: scale(1.04); }
        .att-btn:active { transform: scale(0.96); }

        @media (max-width: 640px) {
          .att-grid-header { display: none !important; }
          .att-row { flex-direction: column !important; align-items: stretch !important; gap: 14px !important; padding: 18px !important; }
          .att-row-mark { width: 100% !important; justify-content: space-between !important; }
          .att-row-stats { width: 100% !important; justify-content: flex-start !important; border-top: 1px solid #f3f4f6; padding-top: 10px; margin-top: 4px; }
          .att-header-right { width: 100%; justify-content: center; }
          .att-submit-bar { flex-direction: column; align-items: stretch !important; gap: 14px; }
        }
      `}</style>

      <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif', animation: '_att_fi .4s ease' }}>

        {/* Header */}
        <div style={{ marginBottom: 22 }}>
          <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>
            Morning Register
          </h1>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 3 }}>
            {DAYS[todayDay]} · {new Date().toLocaleDateString('en-GH', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #ede9fe', borderTopColor: '#6d28d9', animation: '_att_spin .8s linear infinite' }} />
          </div>
        )}

        {/* No home class assigned */}
        {!loading && !myClass && (
          <div style={{ background: '#fff', borderRadius: 16, padding: '60px 20px', textAlign: 'center', border: '1.5px solid #f0eefe' }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🏫</div>
            <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
              No class assigned
            </h3>
            <p style={{ fontSize: 13, color: '#9ca3af', maxWidth: 360, margin: '0 auto' }}>
              You haven't been assigned as a class teacher yet. Ask the admin to set your home class in the Classes section.
            </p>
          </div>
        )}

        {/* Weekend */}
        {!loading && myClass && isWeekend && (
          <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 14, padding: '20px 24px', marginBottom: 20, display: 'flex', gap: 14, alignItems: 'center' }}>
            <span style={{ fontSize: 32 }}>🎉</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#15803d', marginBottom: 4 }}>Enjoy your weekend!</div>
              <div style={{ fontSize: 13, color: '#16a34a' }}>Morning register is only required Monday to Friday. See you on Monday!</div>
            </div>
          </div>
        )}

        {/* Main content */}
        {!loading && myClass && !isWeekend && (
          <>
            {/* Class info banner */}
            <div style={{ background: 'linear-gradient(135deg,#2e1065,#4c1d95,#6d28d9)', borderRadius: 16, padding: '18px 22px', marginBottom: 18, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', opacity: .7, marginBottom: 4 }}>YOUR HOME CLASS</div>
                <h2 style={{ fontFamily: '"Playfair Display",serif', fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>{myClass.name}</h2>
                <p style={{ fontSize: 13, opacity: .8, margin: 0 }}>{students.length} students enrolled</p>
              </div>
              {submittedToday ? (
                <div className="att-header-right" style={{ background: 'rgba(255,255,255,.15)', borderRadius: 12, padding: '10px 18px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: 22 }}>✅</div>
                  <div style={{ fontSize: 12, fontWeight: 700, marginTop: 4 }}>Submitted today</div>
                </div>
              ) : (
                <div className="att-header-right" style={{ background: 'rgba(255,255,255,.12)', borderRadius: 12, padding: '10px 18px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: 22 }}>📋</div>
                  <div style={{ fontSize: 12, fontWeight: 700, marginTop: 4 }}>Not submitted yet</div>
                </div>
              )}
            </div>

            {/* Already submitted today banner */}
            {submittedToday && (
              <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 12, padding: '12px 18px', marginBottom: 18, fontSize: 13, color: '#15803d', fontWeight: 600, display: 'flex', gap: 10, alignItems: 'center' }}>
                <span>✅</span>
                <span>You've already submitted the morning register for today. The term totals below are up to date.</span>
              </div>
            )}

            {/* Reminder: autofill note */}
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '10px 16px', marginBottom: 18, fontSize: 12, color: '#1e40af', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span>💡</span>
              <span>
                <strong>Term totals auto-fill from the system.</strong> Each morning submission adds 1 day to each student's running total. The admin's Reports page will always show up-to-date figures.
              </span>
            </div>

            {/* Quick-mark buttons */}
            {!submittedToday && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: '#6b7280', alignSelf: 'center', fontWeight: 600 }}>Mark all as:</span>
                {(['present', 'absent', 'late'] as Mark[]).map(m => (
                  <button
                    key={m}
                    className="att-btn"
                    onClick={() => markAll(m)}
                    style={{
                      padding: '6px 16px',
                      fontSize: 12,
                      background: m === 'present' ? '#f0fdf4' : m === 'absent' ? '#fef2f2' : '#fffbeb',
                      color: m === 'present' ? '#16a34a' : m === 'absent' ? '#dc2626' : '#d97706',
                      border: `1.5px solid ${m === 'present' ? '#bbf7d0' : m === 'absent' ? '#fca5a5' : '#fde68a'}`,
                    }}
                  >
                    {m === 'present' ? '✓ All Present' : m === 'absent' ? '✗ All Absent' : '⏳ All Late'}
                  </button>
                ))}
                {/* Live stats */}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Present', count: presentCount, color: '#16a34a', bg: '#f0fdf4' },
                    { label: 'Absent', count: absentCount, color: '#dc2626', bg: '#fef2f2' },
                    { label: 'Late', count: lateCount, color: '#d97706', bg: '#fffbeb' },
                  ].map(s => (
                    <div key={s.label} style={{ background: s.bg, borderRadius: 99, padding: '4px 12px', fontSize: 12, color: s.color, fontWeight: 700 }}>
                      {s.count} {s.label}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Students list */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', overflow: 'hidden', boxShadow: '0 1px 6px rgba(109,40,217,.06)' }}>
              {/* Table header */}
              <div className="att-grid-header" style={{ background: 'linear-gradient(135deg,#faf5ff,#f5f3ff)', borderBottom: '1.5px solid #ede9fe', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '.08em', flex: 1 }}>Student</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '.08em', width: 60, textAlign: 'center' }}>Term %</span>
                {!submittedToday && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '.08em', width: 220, textAlign: 'center' }}>Today's Mark</span>
                )}
                {submittedToday && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '.08em', width: 140, textAlign: 'center' }}>Term Total</span>
                )}
              </div>

              <div>
                {students.map((s, i) => {
                  const mark = marks[s.id] ?? 'present'
                  const totals = termTotals[s.id]
                  const pct = totals && totals.total > 0 ? Math.round((totals.present / totals.total) * 100) : null

                  return (
                    <div key={s.id} className="att-row"
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: i < students.length - 1 ? '1px solid #fafafa' : 'none', background: '#fff', transition: 'background .12s', animation: `_att_up .3s ease ${i * .03}s both` }}>

                      {/* Avatar + name */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                          background: mark === 'present' ? 'linear-gradient(135deg,#16a34a,#22c55e)' : mark === 'absent' ? 'linear-gradient(135deg,#dc2626,#ef4444)' : 'linear-gradient(135deg,#d97706,#f59e0b)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff',
                        }}>
                          {s.full_name.charAt(0)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.full_name}</div>
                          <div style={{ fontSize: 11, color: '#9ca3af' }}>{s.student_id ?? (s.gender ? (s.gender === 'male' ? '♂' : '♀') : '')}</div>
                        </div>
                      </div>

                      {/* Term attendance % */}
                      <div className="att-row-stats" style={{ width: 60, textAlign: 'center', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', fontWeight: 700, minWidth: 60 }} className="show-on-mobile">Attendance:</div>
                        {pct !== null ? (
                          <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: 14, fontWeight: 800, color: pct >= 75 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626' }}>{pct}%</div>
                            <div style={{ fontSize: 9, color: '#9ca3af' }}>{totals!.present}/{totals!.total} days</div>
                          </div>
                        ) : (
                          <span style={{ fontSize: 11, color: '#d1d5db' }}>No records yet</span>
                        )}
                      </div>

                      {/* Mark buttons (only if not submitted today) */}
                      {!submittedToday && (
                        <div className="att-row-mark" style={{ display: 'flex', gap: 6, width: 220, justifyContent: 'center' }}>
                          {([
                            { m: 'present' as Mark, label: '✓ Present', active: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
                            { m: 'absent' as Mark, label: '✗ Absent', active: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
                            { m: 'late' as Mark, label: '⏳ Late', active: '#d97706', bg: '#fffbeb', border: '#fde68a' },
                          ]).map(opt => (
                            <button
                              key={opt.m}
                              className="att-btn"
                              onClick={() => setMark(s.id, opt.m)}
                              style={{
                                padding: '5px 10px',
                                fontSize: 11,
                                background: mark === opt.m ? opt.active : opt.bg,
                                color: mark === opt.m ? '#fff' : opt.active,
                                border: `1.5px solid ${opt.border}`,
                                boxShadow: mark === opt.m ? `0 2px 6px ${opt.active}30` : 'none',
                              }}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Already submitted: show today mark as badge */}
                      {submittedToday && (
                        <div style={{ width: 140, textAlign: 'center' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: '#f5f3ff', color: '#6d28d9' }}>
                            {totals ? `${totals.present} present / ${totals.total} days` : '—'}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Submit button */}
            {!submittedToday && students.length > 0 && (
              <div className="att-submit-bar" style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 13, color: '#6b7280', alignSelf: 'center', fontWeight: 600 }}>
                  Today: {presentCount} Present · {absentCount} Absent
                </div>
                <button
                  onClick={submit}
                  disabled={saving}
                  style={{
                    padding: '12px 28px', borderRadius: 12, border: 'none',
                    background: saving ? '#a78bfa' : 'linear-gradient(135deg,#7c3aed,#4f46e5)',
                    color: '#fff', fontSize: 14, fontWeight: 700, cursor: saving ? 'default' : 'pointer',
                    fontFamily: '"DM Sans",sans-serif', display: 'flex', alignItems: 'center', gap: 8,
                    boxShadow: '0 4px 14px rgba(109,40,217,.35)', transition: 'all .2s',
                  }}
                >
                  {saving ? (
                    <>
                      <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', animation: '_att_spin .8s linear infinite' }} />
                      Saving…
                    </>
                  ) : '📋 Submit Morning Register'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
