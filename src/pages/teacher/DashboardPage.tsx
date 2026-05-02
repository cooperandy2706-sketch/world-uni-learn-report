// src/pages/teacher/DashboardPage.tsx
// Full platform hub: timetable, attendance status, quiz submissions, all features
import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { useAuth } from '../../hooks/useAuth'
import { useCurrentTerm, useCurrentAcademicYear } from '../../hooks/useSettings'
import { getGradeInfo, calculateAverage, calculatePassRate } from '../../utils/grading'
import { formatDate } from '../../lib/utils'
import { ROUTES } from '../../constants/routes'
import FlaskLoader from '../../components/ui/FlaskLoader'

function AnimNum({ to }: { to: number }) {
  const [val, setVal] = useState(0); const ref = useRef(false)
  useEffect(() => {
    if (ref.current) return; ref.current = true
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / 900, 1); setVal(Math.round((1 - Math.pow(1 - p, 3)) * to))
      if (p < 1) requestAnimationFrame(tick)
    }; requestAnimationFrame(tick)
  }, [to])
  return <>{val}</>
}

function timeAgo(ts: string) {
  const m = Math.floor((Date.now() - new Date(ts).getTime()) / 60000)
  if (m < 1) return 'just now'; if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60); return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function TeacherDashboardPage() {
  const { setFirstLoadComplete } = useAuthStore()
  const { user } = useAuth()
  const { data: term } = useCurrentTerm()
  const { data: year } = useCurrentAcademicYear()

  const [mounted, setMounted] = useState(false)
  const [teacherRecord, setTeacherRecord] = useState<any>(null)
  const [assignments, setAssignments] = useState<any[]>([])
  const [classStats, setClassStats] = useState<any[]>([])
  const [recentScores, setRecentScores] = useState<any[]>([])
  const [todayLessons, setTodayLessons] = useState<any[]>([])
  const [recentQuizSubs, setRecentQuizSubs] = useState<any[]>([])
  const [attendanceStatus, setAttendanceStatus] = useState<Record<string, boolean>>({}) // classId → submitted today
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [submittedCount, setSubmittedCount] = useState(0)
  const [myQuizCount, setMyQuizCount] = useState(0)
  const [myQuizSubs, setMyQuizSubs] = useState(0)
  const [loading, setLoading] = useState(true)
  const [msgOpen, setMsgOpen] = useState(false)
  const [msgSubject, setMsgSubject] = useState('')
  const [msgBody, setMsgBody] = useState('')
  const [msgPriority, setMsgPriority] = useState('normal')
  const [sendingMsg, setSendingMsg] = useState(false)
  const [now, setNow] = useState(new Date())

  useEffect(() => { setTimeout(() => setMounted(true), 60) }, [])
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t) }, [])
  useEffect(() => { if (user?.id) loadDashboard() }, [user?.id, term?.id])

  async function loadDashboard() {
    setLoading(true)
    try {
      const { data: teacher } = await supabase.from('teachers').select('*').eq('user_id', user!.id).single()
      if (!teacher) { 
        setLoading(false)
        setFirstLoadComplete(true)
        return 
      }
      setTeacherRecord(teacher)

      // Load all in parallel
      const today = now.toISOString().slice(0, 10)
      const todayDay = now.getDay()

      const [
        assignsRes,
        recentScoresRes,
        quizRes,
        quizSubsRes,
        announcementsRes,
      ] = await Promise.all([
        term?.id ? supabase.from('teacher_assignments').select('*, class:classes(id,name), subject:subjects(id,name,code)').eq('teacher_id', teacher.id).eq('term_id', term.id) : { data: [] },
        supabase.from('scores').select('id,updated_at,total_score,grade,student:students(full_name),subject:subjects(name),class:classes(name)').eq('teacher_id', teacher.id).order('updated_at', { ascending: false }).limit(5),
        supabase.from('assignments').select('*', { count: 'exact', head: true }).eq('teacher_id', teacher.id).eq('school_id', user!.school_id),
        supabase.from('assignment_submissions').select('submitted_at,score,total_possible,student:students(full_name),assignments!inner(title,teacher_id)').eq('assignments.teacher_id', teacher.id).order('submitted_at', { ascending: false }).limit(6),
        supabase.from('announcements').select('*').eq('school_id', user!.school_id).order('created_at', { ascending: false }).limit(3),
      ])

      const assigns = assignsRes.data ?? []
      setAssignments(assigns)
      setRecentScores(recentScoresRes.data ?? [])
      setMyQuizCount((quizRes as any).count ?? 0)
      setRecentQuizSubs(quizSubsRes.data ?? [])
      setMyQuizSubs(quizSubsRes.data?.length ?? 0)
      setAnnouncements(announcementsRes.data ?? [])

      // Load timetable for today
      if (term?.id) {
        const { data: slots } = await supabase
          .from('timetable_slots')
          .select('*, subject:subjects(name), class:classes(name), period:timetable_periods(name,start_time,end_time,is_break,sort_order)')
          .eq('teacher_id', teacher.id)
          .eq('term_id', term.id)
          .eq('day_of_week', todayDay)
          // Sort happens on client after fetch because Supabase can struggle to order by related columns depending on schema
        const lessons = (slots ?? []).filter((s: any) => !s.period?.is_break)
          .sort((a: any, b: any) => {
            const aSort = a.period?.sort_order ?? 999;
            const bSort = b.period?.sort_order ?? 999;
            if (aSort !== bSort) return aSort - bSort;
            return (a.period?.start_time ?? '').localeCompare(b.period?.start_time ?? '')
          })
        setTodayLessons(lessons)
      }

      // Check attendance submission status per class today
      const uniqueClasses = [...new Map(assigns.map((a: any) => [a.class?.id, a.class])).values()].filter(Boolean)

      const [classStatsData, attStatus] = await Promise.all([
        term?.id ? Promise.all(uniqueClasses.map(async (cls: any) => {
          const { data: students } = await supabase.from('students').select('id').eq('class_id', cls.id).eq('is_active', true)
          const { data: scores } = await supabase.from('scores').select('total_score,is_submitted').eq('class_id', cls.id).eq('term_id', term!.id).eq('teacher_id', teacher.id)
          const subjectIds = [...new Set(assigns.filter((a: any) => a.class?.id === cls.id).map((a: any) => a.subject?.id))]
          const studentCount = students?.length ?? 0
          const submitted = scores?.filter((s: any) => s.is_submitted).length ?? 0
          const totals = scores?.map((s: any) => s.total_score ?? 0) ?? []
          const avg = calculateAverage(totals)
          const totalExpected = subjectIds.length * studentCount
          return { classId: cls.id, className: cls.name, studentCount, subjectCount: subjectIds.length, submitted, pendingEntries: Math.max(0, totalExpected - (scores?.length ?? 0)), avg: avg.toFixed(1), passRate: calculatePassRate(totals), gradeInfo: getGradeInfo(avg) }
        })) : Promise.resolve([]),
        Promise.all(uniqueClasses.map(async (cls: any) => {
          const { count } = await supabase.from('attendance_records').select('*', { count: 'exact', head: true }).eq('class_id', cls.id).eq('date', today)
          return { classId: cls.id, submitted: (count ?? 0) > 0 }
        }))
      ])

      setClassStats(classStatsData)
      const attMap: Record<string, boolean> = {}
      attStatus.forEach((a: any) => { attMap[a.classId] = a.submitted })
      setAttendanceStatus(attMap)
      setPendingCount(classStatsData.reduce((s: number, c: any) => s + c.pendingEntries, 0))
      setSubmittedCount(classStatsData.reduce((s: number, c: any) => s + c.submitted, 0))

    } catch (e) { 
      console.error(e) 
    } finally { 
      setLoading(false)
      setFirstLoadComplete(true)
    }
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
  const classesWithoutAttendance = uniqueClasses.filter((c: any) => !attendanceStatus[c.id])
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  // Determine current/next lesson
  const currentMins = hour * 60 + now.getMinutes()
  function timeToMins(t: string) { const [h, m] = (t ?? '00:00').split(':').map(Number); return h * 60 + m }
  const activeLesson = todayLessons.find((l: any) => { const s = timeToMins(l.period?.start_time?.slice(0, 5)); const e = timeToMins(l.period?.end_time?.slice(0, 5)); return currentMins >= s && currentMins < e })
  const nextLesson = todayLessons.find((l: any) => timeToMins(l.period?.start_time?.slice(0, 5)) > currentMins)

  if (loading) return <FlaskLoader fullScreen={false} label="Loading your dashboard…" />

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _sp{to{transform:rotate(360deg)}}
        @keyframes _fu{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes _fi{from{opacity:0}to{opacity:1}}
        @keyframes _pu{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.8)}}
        @keyframes _pulse2{0%,100%{box-shadow:0 0 0 0 rgba(22,163,74,.3)}50%{box-shadow:0 0 0 6px rgba(22,163,74,0)}}
        .td-row:hover{background:#faf5ff !important}
        .ql:hover{background:#ede9fe !important;transform:translateX(2px)}
        .overlay2{display:none;position:fixed;inset:0;z-index:300;background:rgba(17,24,39,.55);backdrop-filter:blur(4px);align-items:center;justify-content:center;padding:16px}
        .overlay2.open{display:flex;animation:_fi .15s ease}
        .att-pill{transition:all .15s}
        .att-pill:hover{transform:translateY(-1px)}
        @media (max-width: 768px) {
          .resp-main-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
          .resp-kpi-grid { grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)) !important; gap: 10px !important; }
          .resp-header { flex-direction: column !important; align-items: stretch !important; gap: 16px !important; }
          .resp-prof-grid { grid-template-columns: 1fr 1fr 1fr !important; gap: 6px !important; }
          .resp-btn-group { flex-direction: column !important; align-items: stretch !important; width: 100%; }
        }
        @media (max-width: 480px) {
          .resp-kpi-grid { grid-template-columns: 1fr 1fr !important; }
          .resp-prof-grid { grid-template-columns: 1fr !important; gap: 8px !important; }
          .td-header-title { fontSize: 22px !important; }
        }
      `}</style>

      <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif', opacity: mounted ? 1 : 0, transition: 'opacity .4s ease' }}>

        {/* ── Header ── */}
        <div className="resp-header" style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, animation: '_fu .5s ease both' }}>
          <div>
            <h1 className="td-header-title" style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>
              {greeting}, {user?.full_name?.split(' ')[0]} 👋
            </h1>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
              {DAYS[now.getDay()]} · {now.toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' })} · {(year as any)?.name} · {(term as any)?.name ?? 'No active term'}
            </p>
          </div>
          <div className="resp-btn-group" style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setMsgOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 14px', borderRadius: 9, fontSize: 13, fontWeight: 600, background: '#fff', color: '#374151', border: '1.5px solid #e5e7eb', cursor: 'pointer', transition: 'all .15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f5f3ff'; e.currentTarget.style.borderColor = '#ddd6fe' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e5e7eb' }}>
              💬 Message Admin
            </button>
            <Link to={ROUTES.TEACHER_SCORE_ENTRY} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 14px', borderRadius: 9, fontSize: 13, fontWeight: 600, background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', textDecoration: 'none', boxShadow: '0 2px 8px rgba(109,40,217,.3)' }}>
              ✏️ Enter Scores
            </Link>
          </div>
        </div>

        {/* ── Term locked ── */}
        {(term as any)?.is_locked && (
          <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 12, padding: '11px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, animation: '_fu .4s ease .05s both' }}>
            <span>🔒</span>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#dc2626', margin: 0 }}>Term is Locked — Score entry is disabled. Contact admin.</p>
          </div>
        )}

        {/* ── Active lesson banner ── */}
        {activeLesson && (
          <div style={{ background: 'linear-gradient(135deg,#14532d,#16a34a)', borderRadius: 16, padding: '16px 20px', marginBottom: 16, color: '#fff', animation: '_pulse2 3s ease infinite', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,.06)' }} />
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', opacity: .8, marginBottom: 4 }}>🟢 CLASS IN PROGRESS</div>
            <h2 style={{ fontFamily: '"Playfair Display",serif', fontSize: 20, fontWeight: 700, margin: '0 0 2px' }}>{activeLesson.subject?.name}</h2>
            <p style={{ fontSize: 13, opacity: .85, margin: '0 0 10px' }}>{activeLesson.class?.name} · {activeLesson.period?.name} · {activeLesson.period?.start_time?.slice(0,5)}–{activeLesson.period?.end_time?.slice(0,5)}</p>
            <div className="resp-btn-group" style={{ display: 'flex', gap: 8 }}>
              <Link to={ROUTES.TEACHER_ATTENDANCE} style={{ flex: 1, textAlign: 'center', padding: '6px 14px', borderRadius: 8, background: 'rgba(255,255,255,.2)', color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>📋 Mark Attendance</Link>
              <Link to={ROUTES.TEACHER_LESSON_TRACKER} style={{ flex: 1, textAlign: 'center', padding: '6px 14px', borderRadius: 8, background: 'rgba(255,255,255,.15)', color: '#fff', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>📖 Lesson Tracker</Link>
            </div>
          </div>
        )}

        {/* ── Attendance alert ── */}
        {classesWithoutAttendance.length > 0 && !activeLesson && (
          <div style={{ background: 'linear-gradient(135deg,#fffbeb,#fef3c7)', border: '1.5px solid #fde68a', borderRadius: 12, padding: '11px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, animation: '_fu .35s ease .1s both' }}>
            <span style={{ fontSize: 20 }}>📋</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#92400e', margin: 0 }}>Attendance not yet submitted for {classesWithoutAttendance.length} class{classesWithoutAttendance.length > 1 ? 'es' : ''}</p>
              <p style={{ fontSize: 11, color: '#b45309', margin: 0 }}>{classesWithoutAttendance.map((c: any) => c.name).join(', ')}</p>
            </div>
            <Link to={ROUTES.TEACHER_ATTENDANCE} style={{ padding: '6px 14px', borderRadius: 99, background: '#fde68a', color: '#92400e', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>Mark →</Link>
          </div>
        )}

        {assignments.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 16, padding: '56px 20px', textAlign: 'center', border: '1.5px solid #f0eefe', animation: '_fu .5s ease both' }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>📋</div>
            <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 6 }}>No class assignments yet</h3>
            <p style={{ fontSize: 13, color: '#9ca3af' }}>Ask your admin to assign classes and subjects for this term.</p>
          </div>
        ) : (
          <>
            {/* ── KPIs ── */}
            <div className="resp-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 13, marginBottom: 20, animation: '_fu .5s ease .1s both' }}>
              {[
                { label: 'My Classes', value: uniqueClasses.length, icon: '🏫', color: '#6d28d9', bg: '#f5f3ff' },
                { label: 'My Subjects', value: uniqueSubjects.length, icon: '📚', color: '#0891b2', bg: '#ecfeff' },
                { label: "Today's Lessons", value: todayLessons.length, icon: '📅', color: '#16a34a', bg: '#f0fdf4' },
                { label: 'Scores Entered', value: submittedCount, icon: '✅', color: '#16a34a', bg: '#f0fdf4' },
                { label: 'Pending Entry', value: pendingCount, icon: '⏳', color: pendingCount > 0 ? '#d97706' : '#16a34a', bg: pendingCount > 0 ? '#fffbeb' : '#f0fdf4', pulse: pendingCount > 0 },
                { label: 'My Quizzes', value: myQuizCount, icon: '📝', color: '#7c3aed', bg: '#f5f3ff' },
                { label: 'Nitro Typer', value: 'Play', icon: '🏎️', color: '#00f3ff', bg: '#0a0a1f', isLink: true, to: ROUTES.TEACHER_TYPING_GAME },
              ].map((s, i) => {
                const CardInner = (
                  <div style={{
                    background: (s as any).isLink ? '#0a0a2f' : '#fff', borderRadius: 13, padding: '14px 15px',
                    border: '1.5px solid #f0eefe', boxShadow: '0 1px 4px rgba(109,40,217,.06)',
                    position: 'relative', overflow: 'hidden', animation: `_fu .4s ease ${.15 + i * .05}s both`, height: '100%'
                  }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, marginBottom: 7 }}>{s.icon}</div>
                    {(s as any).pulse && <span style={{ position: 'absolute', top: 9, right: 9, width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', animation: '_pu 1.5s infinite' }} />}
                    <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 24, fontWeight: 700, color: s.color, lineHeight: 1 }}>{typeof (s.value) === 'number' ? <AnimNum to={s.value} /> : s.value}</div>
                    <div style={{ fontSize: 11, color: (s as any).isLink ? 'rgba(255,255,255,0.6)' : '#6b7280', marginTop: 3 }}>{s.label}</div>
                    {(s as any).isLink && <div style={{ position: 'absolute', right: -10, bottom: -10, fontSize: 40, opacity: 0.1, transform: 'rotate(-20deg)' }}>🏁</div>}
                  </div>
                )

                if ((s as any).isLink) {
                  return <Link key={i} to={(s as any).to} style={{ textDecoration: 'none' }}>{CardInner}</Link>
                }
                return <div key={i}>{CardInner}</div>
              })}
            </div>

            {/* ── Main grid ── */}
            <div className="resp-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, animation: '_fu .5s ease .2s both' }}>

              {/* ── LEFT ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                {/* Today's Timetable */}
                <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', overflow: 'hidden', boxShadow: '0 1px 4px rgba(109,40,217,.06)' }}>
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid #faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>📅</span>
                      <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Today's Schedule</h3>
                      <span style={{ fontSize: 11, background: '#f5f3ff', color: '#6d28d9', padding: '2px 8px', borderRadius: 99, fontWeight: 700 }}>{DAYS[now.getDay()]}</span>
                    </div>
                    <Link to={ROUTES.TEACHER_TIMETABLE} style={{ fontSize: 12, fontWeight: 600, color: '#6d28d9', textDecoration: 'none' }}>Full timetable →</Link>
                  </div>
                  {todayLessons.length === 0 ? (
                    <div style={{ padding: '28px 20px', textAlign: 'center' }}>
                      <div style={{ fontSize: 32, marginBottom: 6 }}>☀️</div>
                      <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>No timetable entries for today</p>
                    </div>
                  ) : (
                    <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {todayLessons.map((l: any) => {
                        const sTime = l.period?.start_time?.slice(0, 5) ?? ''
                        const eTime = l.period?.end_time?.slice(0, 5) ?? ''
                        const sMins = timeToMins(sTime); const eMins = timeToMins(eTime)
                        const isNow = currentMins >= sMins && currentMins < eMins
                        const isDone = currentMins >= eMins
                        const color = isNow ? '#16a34a' : isDone ? '#9ca3af' : '#6d28d9'
                        const bg = isNow ? '#f0fdf4' : isDone ? '#f9fafb' : '#f5f3ff'
                        return (
                          <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: bg, border: `1px solid ${color}22` }}>
                            <div style={{ textAlign: 'center', flexShrink: 0, width: 50 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color }}>{sTime}</div>
                              <div style={{ fontSize: 10, color: '#9ca3af' }}>{eTime}</div>
                            </div>
                            <div style={{ width: 2, height: 36, background: color + '40', borderRadius: 99, flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{l.subject?.name}</div>
                              <div style={{ fontSize: 11, color: '#6b7280' }}>{l.class?.name} · {l.period?.name}</div>
                            </div>
                            {isNow && <span style={{ fontSize: 10, fontWeight: 800, background: '#16a34a', color: '#fff', padding: '2px 8px', borderRadius: 99 }}>LIVE</span>}
                            {isDone && <span style={{ fontSize: 13, color: '#d1d5db' }}>✓</span>}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Class Performance */}
                <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', overflow: 'hidden', boxShadow: '0 1px 4px rgba(109,40,217,.06)' }}>
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid #faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>🏫</span>
                      <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>My Classes</h3>
                    </div>
                    <Link to={ROUTES.TEACHER_MY_CLASSES} style={{ fontSize: 12, fontWeight: 600, color: '#6d28d9', textDecoration: 'none' }}>View all →</Link>
                  </div>
                  {classStats.map((cls: any, i: number) => {
                    const cPct = cls.studentCount > 0 ? Math.min(100, Math.round((cls.submitted / Math.max(1, cls.subjectCount * cls.studentCount)) * 100)) : 0
                    const attSubmitted = attendanceStatus[cls.classId]
                    return (
                      <div key={cls.classId} style={{ padding: '13px 20px', borderBottom: i < classStats.length - 1 ? '1px solid #faf5ff' : 'none', display: 'flex', alignItems: 'center', gap: 13 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 11, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>🏫</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{cls.className}</span>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              <span style={{ fontSize: 10, color: '#9ca3af' }}>{cls.studentCount} students</span>
                              <span
                                className="att-pill"
                                style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: attSubmitted ? '#f0fdf4' : '#fffbeb', color: attSubmitted ? '#16a34a' : '#d97706', border: `1px solid ${attSubmitted ? '#bbf7d0' : '#fde68a'}` }}>
                                {attSubmitted ? '✓ Attendance' : '⚠ Attendance'}
                              </span>
                            </div>
                          </div>
                          <div style={{ height: 5, background: '#f0eefe', borderRadius: 99, overflow: 'hidden', marginBottom: 3 }}>
                            <div style={{ height: '100%', width: cPct + '%', background: cPct === 100 ? 'linear-gradient(90deg,#16a34a,#22c55e)' : 'linear-gradient(90deg,#7c3aed,#a78bfa)', borderRadius: 99, transition: 'width 1s ease' }} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#9ca3af' }}>
                            <span>{cls.submitted} scores submitted · pass rate {cls.passRate}%</span>
                            <span style={{ fontWeight: 700, color: cPct === 100 ? '#16a34a' : '#6d28d9' }}>{cPct}%</span>
                          </div>
                        </div>
                        <Link to={`${ROUTES.TEACHER_SCORE_ENTRY}?class=${cls.classId}`}
                          style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 8, background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', fontSize: 11, fontWeight: 600, textDecoration: 'none' }}>
                          ✏️ Scores
                        </Link>
                      </div>
                    )
                  })}
                </div>

                {/* Recent Quiz Submissions */}
                {recentQuizSubs.length > 0 && (
                  <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', overflow: 'hidden', boxShadow: '0 1px 4px rgba(109,40,217,.06)' }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid #faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>📝</span>
                        <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Quiz Submissions</h3>
                      </div>
                      <Link to={ROUTES.TEACHER_ASSIGNMENTS} style={{ fontSize: 12, fontWeight: 600, color: '#6d28d9', textDecoration: 'none' }}>Manage quizzes →</Link>
                    </div>
                    {recentQuizSubs.map((s: any, i: number) => {
                      const pct = s.total_possible > 0 ? (s.score / s.total_possible) * 100 : 0
                      const g = getGradeInfo(pct)
                      return (
                        <div key={i} className="td-row"
                          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px', borderBottom: i < recentQuizSubs.length - 1 ? '1px solid #faf5ff' : 'none', transition: 'background .12s' }}>
                          <div style={{ width: 30, height: 30, borderRadius: 8, background: g.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: g.color, flexShrink: 0 }}>{g.grade}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.student?.full_name} — {s.assignments?.title}</p>
                            <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>{timeAgo(s.submitted_at)}</p>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 800, color: g.color, flexShrink: 0 }}>{pct.toFixed(0)}%</span>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Recent Score Entries */}
                {recentScores.length > 0 && (
                  <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', overflow: 'hidden', boxShadow: '0 1px 4px rgba(109,40,217,.06)' }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid #faf5ff', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>⚡</span>
                      <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Recent Score Entries</h3>
                    </div>
                    {recentScores.map((a: any, i: number) => {
                      const g = getGradeInfo(a.total_score ?? 0)
                      return (
                        <div key={a.id} className="td-row"
                          style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 20px', borderBottom: i < recentScores.length - 1 ? '1px solid #faf5ff' : 'none', transition: 'background .12s' }}>
                          <div style={{ width: 30, height: 30, borderRadius: 8, background: g.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: g.color, flexShrink: 0 }}>{g.grade}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.student?.full_name} — {a.subject?.name}</p>
                            <p style={{ fontSize: 10, color: '#9ca3af', margin: 0 }}>{a.class?.name} · {timeAgo(a.updated_at)}</p>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 800, color: g.color, flexShrink: 0 }}>{a.total_score?.toFixed(1)}%</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* ── RIGHT ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Profile card */}
                <div style={{ background: 'linear-gradient(145deg,#2e1065,#4c1d95,#5b21b6)', borderRadius: 16, padding: '18px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: -18, right: -18, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,.05)' }} />
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 14 }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#f59e0b,#fbbf24)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                        {user?.full_name?.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.full_name}</p>
                        {isClassTeacher && <span style={{ fontSize: 10, fontWeight: 800, background: 'rgba(245,158,11,.2)', color: '#fbbf24', padding: '2px 7px', borderRadius: 99, marginTop: 3, display: 'inline-block' }}>👨‍🏫 Class Teacher</span>}
                      </div>
                    </div>
                    {teacherRecord?.qualification && (
                      <div style={{ background: 'rgba(255,255,255,.08)', borderRadius: 8, padding: '6px 11px', marginBottom: 11, fontSize: 11, color: 'rgba(255,255,255,.7)' }}>🎓 {teacherRecord.qualification}</div>
                    )}
                    <div className="resp-prof-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                      {[{ label: 'Classes', value: uniqueClasses.length }, { label: 'Subjects', value: uniqueSubjects.length }, { label: 'Quizzes', value: myQuizCount }].map(s => (
                        <div key={s.label} style={{ background: 'rgba(255,255,255,.08)', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
                          <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#fff' }}>{s.value}</div>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,.5)' }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Announcements */}
                {announcements.length > 0 && (
                  <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', padding: '16px', boxShadow: '0 1px 4px rgba(109,40,217,.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <span>📢</span>
                      <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>Announcements</h3>
                    </div>
                    {announcements.map((a: any, i: number) => (
                      <div key={a.id} style={{ paddingBottom: i < announcements.length - 1 ? 11 : 0, marginBottom: i < announcements.length - 1 ? 11 : 0, borderBottom: i < announcements.length - 1 ? '1px solid #f5f3ff' : 'none' }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 2 }}>
                          {a.is_pinned && <span style={{ fontSize: 10, flexShrink: 0, marginTop: 2 }}>📌</span>}
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{a.title}</span>
                        </div>
                        <p style={{ fontSize: 11, color: '#6b7280', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as any}>{a.body}</p>
                        <span style={{ fontSize: 10, color: '#9ca3af' }}>{timeAgo(a.created_at)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Term info */}
                <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', padding: '16px', boxShadow: '0 1px 4px rgba(109,40,217,.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <span>📆</span>
                    <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>Term Info</h3>
                  </div>
                  {term && year ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      {[
                        { l: 'Year', v: (year as any).name },
                        { l: 'Term', v: (term as any).name },
                        { l: 'Start', v: (term as any).start_date ? formatDate((term as any).start_date) : 'Not set' },
                        { l: 'End', v: (term as any).end_date ? formatDate((term as any).end_date) : 'Not set' },
                      ].map(({ l, v }) => (
                        <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                          <span style={{ color: '#6b7280' }}>{l}</span>
                          <span style={{ fontWeight: 600, color: '#111827' }}>{v}</span>
                        </div>
                      ))}
                      <div style={{ marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 5, background: (term as any).is_locked ? '#fef2f2' : '#f0fdf4', border: `1px solid ${(term as any).is_locked ? '#fca5a5' : '#bbf7d0'}`, borderRadius: 99, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: (term as any).is_locked ? '#dc2626' : '#16a34a' }}>
                        {(term as any).is_locked ? '🔒 Locked' : '🟢 Open for entry'}
                      </div>
                    </div>
                  ) : <p style={{ fontSize: 12, color: '#9ca3af' }}>No active term.</p>}
                </div>

                {/* Quick Actions — ALL teacher features */}
                <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', padding: '16px', boxShadow: '0 1px 4px rgba(109,40,217,.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <span>⚡</span>
                    <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>Quick Actions</h3>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                    {[
                      { icon: '✏️', label: 'Enter Scores', to: ROUTES.TEACHER_SCORE_ENTRY },
                      { icon: '📋', label: 'Attendance', to: ROUTES.TEACHER_ATTENDANCE },
                      { icon: '🏫', label: 'My Classes', to: ROUTES.TEACHER_MY_CLASSES },
                      { icon: '📄', label: 'Reports', to: ROUTES.TEACHER_REPORTS },
                      { icon: '📅', label: 'Timetable', to: ROUTES.TEACHER_TIMETABLE },
                      { icon: '📖', label: 'Lesson Plan', to: ROUTES.TEACHER_LESSON_TRACKER },
                      { icon: '📝', label: 'Quizzes', to: ROUTES.TEACHER_ASSIGNMENTS },
                      { icon: '👥', label: 'Students', to: ROUTES.TEACHER_STUDENTS },
                      { icon: '📚', label: 'Syllabus', to: ROUTES.TEACHER_SYLLABUS },
                      { icon: '🔔', label: 'Notifications', to: ROUTES.TEACHER_NOTIFICATIONS },
                    ].map(({ icon, label, to }) => (
                      <Link key={label} to={to} className="ql"
                        style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 10px', borderRadius: 9, background: '#faf5ff', textDecoration: 'none', transition: 'all .15s' }}>
                        <span style={{ fontSize: 13 }}>{icon}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>{label}</span>
                      </Link>
                    ))}
                    <button onClick={() => setMsgOpen(true)} className="ql"
                      style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 10px', borderRadius: 9, background: '#faf5ff', border: 'none', cursor: 'pointer', transition: 'all .15s', gridColumn: 'span 2' }}>
                      <span style={{ fontSize: 13 }}>💬</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>Message Admin</span>
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
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f5f3ff', background: 'linear-gradient(135deg,#faf5ff,#f5f3ff)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>Message Admin</h3>
              <p style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Send a message directly to the school administrator</p>
            </div>
            <button onClick={() => setMsgOpen(false)} style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: '#ede9fe', cursor: 'pointer', fontSize: 14, color: '#6d28d9', fontWeight: 700 }}>✕</button>
          </div>
          <div style={{ padding: '18px 20px' }}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 5 }}>Priority</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {[{ v: 'low', label: '🔵 Low', color: '#0891b2' }, { v: 'normal', label: '🟣 Normal', color: '#6d28d9' }, { v: 'high', label: '🟠 High', color: '#ea580c' }, { v: 'urgent', label: '🔴 Urgent', color: '#dc2626' }].map(p => (
                  <button key={p.v} onClick={() => setMsgPriority(p.v)}
                    style={{ flex: 1, padding: '5px 0', borderRadius: 7, border: `1.5px solid ${msgPriority === p.v ? p.color : '#e5e7eb'}`, background: msgPriority === p.v ? p.color + '15' : '#fff', fontSize: 10, fontWeight: 700, color: msgPriority === p.v ? p.color : '#6b7280', cursor: 'pointer' }}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 5 }}>Subject *</label>
              <input value={msgSubject} onChange={e => setMsgSubject(e.target.value)} placeholder="e.g. Score entry issue in Class 6A"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 13, border: '1.5px solid #e5e7eb', outline: 'none', fontFamily: '"DM Sans",sans-serif', boxSizing: 'border-box' as const }}
                onFocus={e => { e.currentTarget.style.borderColor = '#7c3aed' }}
                onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb' }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 5 }}>Message *</label>
              <textarea value={msgBody} onChange={e => setMsgBody(e.target.value)} placeholder="Describe the issue or message…" rows={4}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 13, border: '1.5px solid #e5e7eb', outline: 'none', fontFamily: '"DM Sans",sans-serif', resize: 'vertical', boxSizing: 'border-box' as const }}
                onFocus={e => { e.currentTarget.style.borderColor = '#7c3aed' }}
                onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb' }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setMsgOpen(false)} style={{ flex: 1, padding: '9px', borderRadius: 9, border: '1.5px solid #e5e7eb', background: '#fff', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>Cancel</button>
              <button onClick={sendMessage} disabled={sendingMsg || !msgSubject.trim() || !msgBody.trim()}
                style={{ flex: 2, padding: '9px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: sendingMsg || !msgSubject.trim() || !msgBody.trim() ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                {sendingMsg && <span style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', animation: '_sp .7s linear infinite' }} />}
                💬 Send to Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}