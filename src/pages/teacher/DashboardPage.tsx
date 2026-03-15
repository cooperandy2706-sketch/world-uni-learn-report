// src/pages/teacher/DashboardPage.tsx
import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useCurrentTerm, useCurrentAcademicYear } from '../../hooks/useSettings'
import { getGradeInfo, calculateAverage, calculatePassRate } from '../../utils/grading'
import { formatDate } from '../../lib/utils'
import { ROUTES } from '../../constants/routes'

function AnimNum({ to }: { to: number }) {
  const [val, setVal] = useState(0)
  const ref = useRef(false)
  useEffect(() => {
    if (ref.current) return; ref.current = true
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / 900, 1)
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * to))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [to])
  return <>{val}</>
}

function timeAgo(ts: string) {
  const m = Math.floor((Date.now() - new Date(ts).getTime()) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`
}

export default function TeacherDashboardPage() {
  const { user } = useAuth()
  const { data: term } = useCurrentTerm()
  const { data: year } = useCurrentAcademicYear()

  const [mounted, setMounted] = useState(false)
  const [teacherRecord, setTeacherRecord] = useState<any>(null)
  const [assignments, setAssignments] = useState<any[]>([])
  const [classStats, setClassStats] = useState<any[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [submittedCount, setSubmittedCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [msgOpen, setMsgOpen] = useState(false)
  const [msgSubject, setMsgSubject] = useState('')
  const [msgBody, setMsgBody] = useState('')
  const [msgPriority, setMsgPriority] = useState('normal')
  const [sendingMsg, setSendingMsg] = useState(false)

  useEffect(() => { setTimeout(() => setMounted(true), 60) }, [])

  useEffect(() => {
    if (user?.id) loadDashboard()
  }, [user?.id, term?.id])

  async function loadDashboard() {
    setLoading(true)
    try {
      const { data: teacher } = await supabase.from('teachers').select('*').eq('user_id', user!.id).single()
      if (!teacher) { setLoading(false); return }
      setTeacherRecord(teacher)
      if (!term?.id) { setLoading(false); return }

      const { data: assigns } = await supabase
        .from('teacher_assignments')
        .select('*, class:classes(id,name), subject:subjects(id,name,code)')
        .eq('teacher_id', teacher.id).eq('term_id', term.id)
      setAssignments(assigns ?? [])

      const uniqueClasses = [...new Map((assigns ?? []).map((a: any) => [a.class?.id, a.class])).values()].filter(Boolean)
      const stats = await Promise.all(uniqueClasses.map(async (cls: any) => {
        const { data: students } = await supabase.from('students').select('id').eq('class_id', cls.id).eq('is_active', true)
        const { data: scores } = await supabase.from('scores').select('total_score,is_submitted').eq('class_id', cls.id).eq('term_id', term.id).eq('teacher_id', teacher.id)
        const subjectIds = [...new Set((assigns ?? []).filter((a: any) => a.class?.id === cls.id).map((a: any) => a.subject?.id))]
        const studentCount = students?.length ?? 0
        const submitted = scores?.filter((s: any) => s.is_submitted).length ?? 0
        const totals = scores?.map((s: any) => s.total_score ?? 0) ?? []
        const avg = calculateAverage(totals)
        const totalExpected = subjectIds.length * studentCount
        return { classId: cls.id, className: cls.name, studentCount, subjectCount: subjectIds.length, submitted, pendingEntries: Math.max(0, totalExpected - (scores?.length ?? 0)), avg: avg.toFixed(1), passRate: calculatePassRate(totals), gradeInfo: getGradeInfo(avg) }
      }))
      setClassStats(stats)
      setPendingCount(stats.reduce((s, c) => s + c.pendingEntries, 0))
      setSubmittedCount(stats.reduce((s, c) => s + c.submitted, 0))

      const { data: recent } = await supabase.from('scores')
        .select('id,updated_at,total_score,grade,student:students(full_name),subject:subjects(name),class:classes(name)')
        .eq('teacher_id', teacher.id).eq('term_id', term.id)
        .order('updated_at', { ascending: false }).limit(5)
      setRecentActivity(recent ?? [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  async function sendMessage() {
    if (!msgSubject.trim() || !msgBody.trim()) return
    setSendingMsg(true)
    try {
      await supabase.from('messages').insert({ school_id: user!.school_id, from_user_id: user!.id, subject: msgSubject, body: msgBody, priority: msgPriority })
      setMsgOpen(false); setMsgSubject(''); setMsgBody(''); setMsgPriority('normal')
    } catch { }
    finally { setSendingMsg(false) }
  }

  const uniqueClasses = [...new Map(assignments.map((a: any) => [a.class?.id, a.class])).values()].filter(Boolean)
  const uniqueSubjects = [...new Map(assignments.map((a: any) => [a.subject?.id, a.subject])).values()].filter(Boolean)
  const isClassTeacher = assignments.some((a: any) => a.is_class_teacher)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16, fontFamily: '"DM Sans",sans-serif' }}>
      <style>{`@keyframes _sp{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '4px solid #ede9fe', borderTopColor: '#6d28d9', animation: '_sp .8s linear infinite' }} />
      <p style={{ fontSize: 13, color: '#6b7280' }}>Loading your dashboard…</p>
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _sp{to{transform:rotate(360deg)}}
        @keyframes _fu{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes _fi{from{opacity:0}to{opacity:1}}
        @keyframes _pu{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.8)}}
        .td-row:hover{background:#faf5ff !important}
        .ql:hover{background:#ede9fe !important;transform:translateX(3px)}
        .overlay2{display:none;position:fixed;inset:0;z-index:300;background:rgba(17,24,39,.55);backdrop-filter:blur(4px);align-items:center;justify-content:center;padding:16px}
        .overlay2.open{display:flex;animation:_fi .15s ease}
      `}</style>

      <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif', opacity: mounted ? 1 : 0, transition: 'opacity .4s ease' }}>

        {/* Header */}
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, animation: '_fu .5s ease both' }}>
          <div>
            <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.full_name?.split(' ')[0]} 👋
            </h1>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
              {(year as any)?.name} · {(term as any)?.name ?? 'No active term'} · {new Date().toLocaleDateString('en-GH', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setMsgOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600, background: '#fff', color: '#374151', border: '1.5px solid #e5e7eb', cursor: 'pointer', transition: 'all .15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f5f3ff'; e.currentTarget.style.borderColor = '#ddd6fe' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e5e7eb' }}>
              💬 Message Admin
            </button>
            <Link to={ROUTES.TEACHER_SCORE_ENTRY} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600, background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', textDecoration: 'none', boxShadow: '0 2px 8px rgba(109,40,217,.3)' }}>
              ✏️ Enter Scores
            </Link>
          </div>
        </div>

        {/* Term locked */}
        {(term as any)?.is_locked && (
          <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 14, padding: '12px 20px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12, animation: '_fu .4s ease .05s both' }}>
            <span style={{ fontSize: 20 }}>🔒</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#dc2626', margin: 0 }}>Term is Locked — Score entry disabled</p>
              <p style={{ fontSize: 12, color: '#ef4444', margin: 0 }}>Contact your admin to unlock the term.</p>
            </div>
          </div>
        )}

        {/* No assignments */}
        {assignments.length === 0 && (
          <div style={{ background: '#fff', borderRadius: 16, padding: '56px 20px', textAlign: 'center', border: '1.5px solid #f0eefe', animation: '_fu .5s ease both' }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>📋</div>
            <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 6 }}>No assignments yet</h3>
            <p style={{ fontSize: 13, color: '#9ca3af' }}>Ask your admin to assign classes and subjects to you for this term.</p>
          </div>
        )}

        {assignments.length > 0 && (
          <>
            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 14, marginBottom: 22, animation: '_fu .5s ease .1s both' }}>
              {[
                { label: 'My Classes', value: uniqueClasses.length, icon: '🏫', color: '#6d28d9', bg: '#f5f3ff' },
                { label: 'My Subjects', value: uniqueSubjects.length, icon: '📚', color: '#0891b2', bg: '#ecfeff' },
                { label: 'Scores Entered', value: submittedCount, icon: '✅', color: '#16a34a', bg: '#f0fdf4' },
                { label: 'Pending Entry', value: pendingCount, icon: '⏳', color: pendingCount > 0 ? '#d97706' : '#16a34a', bg: pendingCount > 0 ? '#fffbeb' : '#f0fdf4', pulse: pendingCount > 0 },
                { label: 'Total Assignments', value: assignments.length, icon: '📌', color: '#7c3aed', bg: '#f5f3ff' },
              ].map((s, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', border: '1.5px solid #f0eefe', boxShadow: '0 1px 4px rgba(109,40,217,.06)', position: 'relative', overflow: 'hidden', animation: `_fu .4s ease ${.15 + i * .06}s both` }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, marginBottom: 8 }}>{s.icon}</div>
                  {(s as any).pulse && <span style={{ position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', animation: '_pu 1.5s infinite' }} />}
                  <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: s.color, lineHeight: 1 }}><AnimNum to={s.value} /></div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Main grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, animation: '_fu .5s ease .2s both' }}>

              {/* LEFT */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Class performance */}
                <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', overflow: 'hidden', boxShadow: '0 1px 4px rgba(109,40,217,.06)' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid #faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 18 }}>🏫</span>
                      <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>My Classes This Term</h3>
                    </div>
                    <Link to={ROUTES.TEACHER_MY_CLASSES} style={{ fontSize: 12, fontWeight: 600, color: '#6d28d9', textDecoration: 'none' }}>View all →</Link>
                  </div>
                  {classStats.map((cls, i) => {
                    const cPct = cls.studentCount > 0 ? Math.min(100, Math.round((cls.submitted / Math.max(1, cls.subjectCount * cls.studentCount)) * 100)) : 0
                    return (
                      <div key={cls.classId} style={{ padding: '14px 20px', borderBottom: i < classStats.length - 1 ? '1px solid #faf5ff' : 'none', display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 12, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🏫</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{cls.className}</span>
                            <span style={{ fontSize: 12, color: '#6b7280' }}>{cls.studentCount} students · {cls.subjectCount} subjects</span>
                          </div>
                          <div style={{ height: 6, background: '#f0eefe', borderRadius: 99, overflow: 'hidden', marginBottom: 4 }}>
                            <div style={{ height: '100%', width: cPct + '%', background: cPct === 100 ? 'linear-gradient(90deg,#16a34a,#22c55e)' : 'linear-gradient(90deg,#7c3aed,#a78bfa)', borderRadius: 99, transition: 'width 1s ease' }} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9ca3af' }}>
                            <span>{cls.submitted} scores submitted</span>
                            <span style={{ fontWeight: 700, color: cPct === 100 ? '#16a34a' : '#6d28d9' }}>{cPct}% complete</span>
                          </div>
                        </div>
                        <Link to={`${ROUTES.TEACHER_SCORE_ENTRY}?class=${cls.classId}`}
                          style={{ flexShrink: 0, padding: '7px 14px', borderRadius: 8, background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                          ✏️ Enter
                        </Link>
                      </div>
                    )
                  })}
                </div>

                {/* Assignment matrix */}
                <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', overflow: 'hidden', boxShadow: '0 1px 4px rgba(109,40,217,.06)' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid #faf5ff', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>📌</span>
                    <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>Assignment Matrix</h3>
                    <span style={{ fontSize: 11, fontWeight: 700, background: '#f5f3ff', color: '#6d28d9', padding: '2px 8px', borderRadius: 99 }}>{(term as any)?.name}</span>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'linear-gradient(135deg,#faf5ff,#f5f3ff)' }}>
                          {['Class', 'Subject', 'Code', 'Role', 'Action'].map(h => (
                            <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1.5px solid #ede9fe' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {assignments.map((a: any) => (
                          <tr key={a.id} className="td-row" style={{ borderBottom: '1px solid #faf5ff', transition: 'background .12s' }}>
                            <td style={{ padding: '11px 16px', fontSize: 13, fontWeight: 700, color: '#111827' }}>{a.class?.name}</td>
                            <td style={{ padding: '11px 16px', fontSize: 13, color: '#374151' }}>{a.subject?.name}</td>
                            <td style={{ padding: '11px 16px' }}>
                              {a.subject?.code ? <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace', background: '#f5f3ff', color: '#6d28d9', padding: '2px 7px', borderRadius: 5 }}>{a.subject.code}</span> : '—'}
                            </td>
                            <td style={{ padding: '11px 16px' }}>
                              {a.is_class_teacher
                                ? <span style={{ fontSize: 11, fontWeight: 700, background: '#f0fdf4', color: '#16a34a', padding: '2px 9px', borderRadius: 99 }}>👨‍🏫 Class Teacher</span>
                                : <span style={{ fontSize: 11, color: '#6b7280' }}>Subject Teacher</span>}
                            </td>
                            <td style={{ padding: '11px 16px' }}>
                              <Link to={`${ROUTES.TEACHER_SCORE_ENTRY}?class=${a.class?.id}&subject=${a.subject?.id}`}
                                style={{ fontSize: 12, fontWeight: 600, color: '#6d28d9', textDecoration: 'none', background: '#f5f3ff', padding: '4px 10px', borderRadius: 7 }}>
                                ✏️ Enter
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recent activity */}
                {recentActivity.length > 0 && (
                  <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', overflow: 'hidden', boxShadow: '0 1px 4px rgba(109,40,217,.06)' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #faf5ff', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 18 }}>⚡</span>
                      <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>Recent Entries</h3>
                    </div>
                    {recentActivity.map((a: any, i: number) => {
                      const g = getGradeInfo(a.total_score ?? 0)
                      return (
                        <div key={a.id} className="td-row" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px', borderBottom: i < recentActivity.length - 1 ? '1px solid #faf5ff' : 'none', transition: 'background .12s' }}>
                          <div style={{ width: 32, height: 32, borderRadius: 9, background: g.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: g.color, flexShrink: 0 }}>{g.grade}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.student?.full_name} — {a.subject?.name}</p>
                            <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>{a.class?.name} · {timeAgo(a.updated_at)}</p>
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 800, color: g.color, flexShrink: 0 }}>{a.total_score?.toFixed(1)}%</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* RIGHT */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                {/* Profile card */}
                <div style={{ background: 'linear-gradient(145deg,#2e1065,#4c1d95,#5b21b6)', borderRadius: 16, padding: '20px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,.05)' }} />
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                      <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'linear-gradient(135deg,#f59e0b,#fbbf24)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                        {user?.full_name?.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.full_name}</p>
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', margin: 0 }}>{user?.email}</p>
                        {isClassTeacher && <span style={{ fontSize: 10, fontWeight: 800, background: 'rgba(245,158,11,.2)', color: '#fbbf24', padding: '2px 7px', borderRadius: 99, marginTop: 3, display: 'inline-block' }}>👨‍🏫 Class Teacher</span>}
                      </div>
                    </div>
                    {teacherRecord?.qualification && (
                      <div style={{ background: 'rgba(255,255,255,.08)', borderRadius: 9, padding: '7px 12px', marginBottom: 12, fontSize: 12, color: 'rgba(255,255,255,.7)' }}>🎓 {teacherRecord.qualification}</div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {[{ label: 'Classes', value: uniqueClasses.length }, { label: 'Subjects', value: uniqueSubjects.length }].map(s => (
                        <div key={s.label} style={{ background: 'rgba(255,255,255,.08)', borderRadius: 9, padding: '9px', textAlign: 'center' }}>
                          <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 20, fontWeight: 700, color: '#fff' }}>{s.value}</div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)' }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Term info */}
                <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', padding: '18px', boxShadow: '0 1px 4px rgba(109,40,217,.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <span style={{ fontSize: 16 }}>📆</span>
                    <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Current Term</h3>
                  </div>
                  {term && year ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[
                        { l: 'Year', v: (year as any).name },
                        { l: 'Term', v: (term as any).name },
                        { l: 'Start', v: (term as any).start_date ? formatDate((term as any).start_date) : 'Not set' },
                        { l: 'End', v: (term as any).end_date ? formatDate((term as any).end_date) : 'Not set' },
                      ].map(({ l, v }) => (
                        <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                          <span style={{ color: '#6b7280' }}>{l}</span>
                          <span style={{ fontWeight: 600, color: '#111827' }}>{v}</span>
                        </div>
                      ))}
                      <div style={{ marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 6, background: (term as any).is_locked ? '#fef2f2' : '#f0fdf4', border: `1px solid ${(term as any).is_locked ? '#fca5a5' : '#bbf7d0'}`, borderRadius: 99, padding: '5px 12px', fontSize: 12, fontWeight: 700, color: (term as any).is_locked ? '#dc2626' : '#16a34a' }}>
                        {(term as any).is_locked ? '🔒 Locked' : '🟢 Open for entry'}
                      </div>
                    </div>
                  ) : <p style={{ fontSize: 13, color: '#9ca3af' }}>No active term.</p>}
                </div>

                {/* Quick actions */}
                <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', padding: '18px', boxShadow: '0 1px 4px rgba(109,40,217,.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <span style={{ fontSize: 16 }}>⚡</span>
                    <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Quick Actions</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[
                      { icon: '✏️', label: 'Enter Scores', to: ROUTES.TEACHER_SCORE_ENTRY },
                      { icon: '🏫', label: 'My Classes', to: ROUTES.TEACHER_MY_CLASSES },
                      { icon: '📄', label: 'View Reports', to: ROUTES.TEACHER_REPORTS },
                    ].map(({ icon, label, to }) => (
                      <Link key={label} to={to} className="ql"
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, background: '#faf5ff', textDecoration: 'none', transition: 'all .15s' }}>
                        <span style={{ fontSize: 15 }}>{icon}</span>
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#374151', flex: 1 }}>{label}</span>
                        <span style={{ fontSize: 14, color: '#a78bfa' }}>→</span>
                      </Link>
                    ))}
                    <button onClick={() => setMsgOpen(true)} className="ql"
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, background: '#faf5ff', border: 'none', cursor: 'pointer', transition: 'all .15s', width: '100%' }}>
                      <span style={{ fontSize: 15 }}>💬</span>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#374151', flex: 1, textAlign: 'left' }}>Message Admin</span>
                      <span style={{ fontSize: 14, color: '#a78bfa' }}>→</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Message modal */}
      <div className={`overlay2 ${msgOpen ? 'open' : ''}`} onClick={e => { if (e.target === e.currentTarget) setMsgOpen(false) }}>
        <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 500, boxShadow: '0 24px 64px rgba(0,0,0,.18)', overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid #f5f3ff', background: 'linear-gradient(135deg,#faf5ff,#f5f3ff)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 17, fontWeight: 700, color: '#111827', margin: 0 }}>Message Admin</h3>
              <p style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Report a problem or send a message to the administrator</p>
            </div>
            <button onClick={() => setMsgOpen(false)} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: '#ede9fe', cursor: 'pointer', fontSize: 15, color: '#6d28d9', fontWeight: 700 }}>✕</button>
          </div>
          <div style={{ padding: '20px 22px' }}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 5 }}>Priority</label>
              <div style={{ display: 'flex', gap: 7 }}>
                {[
                  { v: 'low', label: '🔵 Low', color: '#0891b2', bg: '#ecfeff' },
                  { v: 'normal', label: '🟣 Normal', color: '#6d28d9', bg: '#f5f3ff' },
                  { v: 'high', label: '🟠 High', color: '#ea580c', bg: '#fff7ed' },
                  { v: 'urgent', label: '🔴 Urgent', color: '#dc2626', bg: '#fef2f2' },
                ].map(p => (
                  <button key={p.v} onClick={() => setMsgPriority(p.v)}
                    style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: `1.5px solid ${msgPriority === p.v ? p.color : '#e5e7eb'}`, background: msgPriority === p.v ? p.bg : '#fff', fontSize: 11, fontWeight: 700, color: msgPriority === p.v ? p.color : '#6b7280', cursor: 'pointer', transition: 'all .15s' }}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 5 }}>Subject *</label>
              <input value={msgSubject} onChange={e => setMsgSubject(e.target.value)} placeholder="e.g. Score entry issue in Class 6A"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 13, border: '1.5px solid #e5e7eb', outline: 'none', fontFamily: '"DM Sans",sans-serif', boxSizing: 'border-box' as const }}
                onFocus={e => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(109,40,217,.1)' }}
                onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none' }} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 5 }}>Message *</label>
              <textarea value={msgBody} onChange={e => setMsgBody(e.target.value)} placeholder="Describe the issue or message in detail…" rows={4}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 13, border: '1.5px solid #e5e7eb', outline: 'none', fontFamily: '"DM Sans",sans-serif', resize: 'vertical', boxSizing: 'border-box' as const }}
                onFocus={e => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(109,40,217,.1)' }}
                onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setMsgOpen(false)} style={{ flex: 1, padding: '10px', borderRadius: 9, border: '1.5px solid #e5e7eb', background: '#fff', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>Cancel</button>
              <button onClick={sendMessage} disabled={sendingMsg || !msgSubject.trim() || !msgBody.trim()}
                style={{ flex: 2, padding: '10px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: sendingMsg || !msgSubject.trim() || !msgBody.trim() ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                {sendingMsg && <span style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', animation: '_sp .7s linear infinite' }} />}
                💬 Send to Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}