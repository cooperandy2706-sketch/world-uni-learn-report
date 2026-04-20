import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { useCurrentTerm, useCurrentAcademicYear } from '../../hooks/useSettings'
import { getGradeInfo } from '../../utils/grading'
import { ROUTES } from '../../constants/routes'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function timeToMins(t: string) { const [h, m] = (t ?? '00:00').split(':').map(Number); return h * 60 + m }

export default function StudentDashboard() {
  const { setFirstLoadComplete } = useAuthStore()
  const { user } = useAuth()
  const { data: term } = useCurrentTerm()
  const { data: year } = useCurrentAcademicYear()

  const [studentData, setStudentData] = useState<any>(null)
  const [reportCard, setReportCard] = useState<any>(null)
  const [subjectScores, setSubjectScores] = useState<any[]>([])
  const [pendingAssignments, setPendingAssignments] = useState<any[]>([])
  const [todayLessons, setTodayLessons] = useState<any[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [attendanceSummary, setAttendanceSummary] = useState({ total: 0, present: 0 })
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [now] = useState(new Date())

  useEffect(() => { setTimeout(() => setMounted(true), 60); loadAll() }, [user?.id])

  async function loadAll() {
    if (!user?.id) return
    setLoading(true)
    try {
      // 1. Student record
      const { data: student } = await supabase
        .from('students')
        .select('*, class:classes(id,name), school:schools(name)')
        .eq('user_id', user.id)
        .single()
      if (!student) { 
        setLoading(false)
        setFirstLoadComplete(true)
        return 
      }
      setStudentData(student)

      // Load all data in parallel
      const today = now.toISOString().slice(0, 10)
      const todayDay = now.getDay()

      const [
        reportRes,
        scoresRes,
        assignRes,
        timetableRes,
        announceRes,
        attRes,
      ] = await Promise.all([
        // Latest report card
        term?.id ? supabase.from('report_cards').select('*, scores:scores(total_score,grade,subject:subjects(name))').eq('student_id', student.id).eq('term_id', term.id).maybeSingle() : Promise.resolve({ data: null }),
        // Subject scores this term
        term?.id ? supabase.from('scores').select('total_score,grade,subject:subjects(name)').eq('student_id', student.id).eq('term_id', term.id) : Promise.resolve({ data: [] }),
        // Pending assignments
        supabase.from('assignments')
          .select('id,title,due_date,subject:subjects(name)')
          .eq('class_id', student.class_id)
          .eq('school_id', student.school_id)
          .eq('is_published', true)
          .order('due_date', { ascending: true })
          .limit(5),
        // Today's timetable
        term?.id ? supabase.from('timetable_slots')
          .select('*, subject:subjects(name), period:timetable_periods(name,start_time,end_time,is_break,sort_order), teacher:teachers(user:users(full_name))')
          .eq('class_id', student.class_id)
          .eq('day_of_week', todayDay)
          .eq('term_id', term.id)
          .order('timetable_periods(sort_order)') : Promise.resolve({ data: [] }),
        // School announcements
        supabase.from('announcements').select('*').eq('school_id', student.school_id).order('created_at', { ascending: false }).limit(4),
        // Attendance
        term?.id ? supabase.from('attendance_records').select('status').eq('student_id', student.id).eq('term_id', term.id) : Promise.resolve({ data: [] }),
      ])

      setReportCard(reportRes.data)
      setSubjectScores((scoresRes.data ?? []).sort((a: any, b: any) => (b.total_score ?? 0) - (a.total_score ?? 0)))
      setAnnouncements(announceRes.data ?? [])

      // Filter assignments not yet submitted
      if (assignRes.data) {
        const assignIds = assignRes.data.map((a: any) => a.id)
        const { data: subs } = await supabase
          .from('assignment_submissions')
          .select('assignment_id')
          .eq('student_id', student.id)
          .in('assignment_id', assignIds)
        const submittedIds = new Set((subs ?? []).map((s: any) => s.assignment_id))
        setPendingAssignments(assignRes.data.filter((a: any) => !submittedIds.has(a.id)))
      }

      // Timetable
      const lessons = (timetableRes.data ?? []).filter((s: any) => !s.period?.is_break)
        .sort((a: any, b: any) => (a.period?.start_time ?? '').localeCompare(b.period?.start_time ?? ''))
      setTodayLessons(lessons)

      // Attendance
      const recs = attRes.data ?? []
      const present = recs.filter((r: any) => r.status === 'present' || r.status === 'late').length
      setAttendanceSummary({ total: recs.length, present })

    } catch (e) { 
      console.error(e) 
    } finally { 
      setLoading(false)
      setFirstLoadComplete(true)
    }
  }

  const currentMins = now.getHours() * 60 + now.getMinutes()
  const activeLesson = todayLessons.find((l: any) => {
    const s = timeToMins(l.period?.start_time?.slice(0, 5)); const e = timeToMins(l.period?.end_time?.slice(0, 5))
    return currentMins >= s && currentMins < e
  })
  const nextLesson = todayLessons.find((l: any) => timeToMins(l.period?.start_time?.slice(0, 5)) > currentMins)

  const attPct = attendanceSummary.total > 0 ? Math.round((attendanceSummary.present / attendanceSummary.total) * 100) : 0
  const avgScore = reportCard?.average_score ?? (subjectScores.length ? subjectScores.reduce((s: number, x: any) => s + (x.total_score ?? 0), 0) / subjectScores.length : null)
  const gradeInfo = avgScore != null ? getGradeInfo(avgScore) : null
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '70vh', flexDirection: 'column', gap: 16 }}>
      <style>{`@keyframes _ssp{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #ede9fe', borderTopColor: '#6d28d9', animation: '_ssp .8s linear infinite' }} />
      <p style={{ fontSize: 13, color: '#6b7280', fontFamily: '"DM Sans",sans-serif' }}>Loading your portal…</p>
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _ssp{to{transform:rotate(360deg)}}
        @keyframes _sfu{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes _sfi{from{opacity:0}to{opacity:1}}
        @keyframes _spulse{0%,100%{box-shadow:0 0 0 0 rgba(109,40,217,.2)}50%{box-shadow:0 0 0 8px rgba(109,40,217,0)}}
        @keyframes _sglive{0%,100%{box-shadow:0 0 0 0 rgba(22,163,74,.25)}50%{box-shadow:0 0 0 6px rgba(22,163,74,0)}}
        .sd-card:hover{box-shadow:0 8px 28px rgba(109,40,217,.1)!important;transform:translateY(-2px)!important}
        .sd-card{transition:all .2s}
        .sd-link:hover{background:#ede9fe!important;transform:translateX(2px)}
        .sd-link{transition:all .15s}
        .sd-row:hover{background:#faf5ff!important}
        @media (max-width: 768px) {
          .sd-main-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
          .sd-kpi-grid { grid-template-columns: 1fr 1fr !important; }
          .sd-header { flex-direction: column !important; align-items: stretch !important; }
          .resp-flex-stack { flex-direction: column !important; align-items: stretch !important; gap: 12px; }
        }
      `}</style>

      <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif', opacity: mounted ? 1 : 0, transition: 'opacity .4s ease', animation: '_sfi .4s ease' }}>

        {/* ── Active lesson banner ── */}
        {activeLesson && (
          <div style={{ background: 'linear-gradient(135deg,#14532d,#16a34a)', borderRadius: 16, padding: '16px 20px', marginBottom: 18, color: '#fff', animation: '_sglive 3s ease infinite', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -18, right: -18, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,.06)' }} />
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', opacity: .8, marginBottom: 4 }}>🟢 CLASS IN PROGRESS</div>
            <h2 style={{ fontFamily: '"Playfair Display",serif', fontSize: 20, fontWeight: 700, margin: '0 0 2px' }}>{activeLesson.subject?.name}</h2>
            <p style={{ fontSize: 12, opacity: .85, margin: 0 }}>{activeLesson.period?.name} · {activeLesson.period?.start_time?.slice(0, 5)}–{activeLesson.period?.end_time?.slice(0, 5)} · {activeLesson.teacher?.user?.full_name ?? 'Teacher'}</p>
          </div>
        )}

        {/* ── Header ── */}
        <div className="sd-header" style={{ marginBottom: 22, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, animation: '_sfu .5s ease both' }}>
          <div>
            <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>
              {greeting}, {user?.full_name?.split(' ')[0]} 👋
            </h1>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
              {studentData?.class?.name ?? 'No class assigned'} · {(year as any)?.name} · {(term as any)?.name ?? 'No active term'} · {DAYS[now.getDay()]}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link to={ROUTES.STUDENT_ASSIGNMENTS} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: '#fff', color: '#374151', textDecoration: 'none', border: '1.5px solid #e5e7eb' }}>📝 Assignments</Link>
            <Link to={ROUTES.STUDENT_RESULTS} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', textDecoration: 'none', boxShadow: '0 2px 8px rgba(109,40,217,.25)' }}>📊 My Results</Link>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="sd-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(145px,1fr))', gap: 13, marginBottom: 22, animation: '_sfu .5s ease .1s both' }}>
          {[
            { icon: '📊', label: 'Term Average', value: avgScore != null ? `${avgScore.toFixed(1)}%` : '—', sub: gradeInfo ? `Grade ${gradeInfo.grade}` : 'No results yet', color: gradeInfo?.color ?? '#6d28d9', bg: '#f5f3ff' },
            { icon: '📅', label: 'Attendance', value: attPct > 0 ? `${attPct}%` : '—', sub: `${attendanceSummary.present} / ${attendanceSummary.total} days`, color: attPct >= 80 ? '#16a34a' : '#dc2626', bg: attPct >= 80 ? '#f0fdf4' : '#fef2f2' },
            { icon: '📝', label: 'Pending Quizzes', value: String(pendingAssignments.length), sub: 'due soon', color: pendingAssignments.length > 0 ? '#d97706' : '#16a34a', bg: pendingAssignments.length > 0 ? '#fffbeb' : '#f0fdf4' },
            { icon: '📚', label: 'Subjects', value: String(subjectScores.length), sub: 'this term', color: '#0891b2', bg: '#ecfeff' },
          ].map((s, i) => (
            <div key={i} className="sd-card" style={{ background: '#fff', borderRadius: 14, padding: '16px', border: '1.5px solid #f0eefe', boxShadow: '0 1px 4px rgba(109,40,217,.06)', animation: `_sfu .4s ease ${.15 + i * .06}s both` }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, marginBottom: 10 }}>{s.icon}</div>
              <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 24, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#374151', fontWeight: 600, marginTop: 3 }}>{s.label}</div>
              <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>{s.sub}</div>
            </div>
          ))}
        </div>
        
        {/* ── Typing Game Teaser ── */}
        <div className="resp-flex-stack" style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
          borderRadius: 18, padding: '20px 24px', marginBottom: 22, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 10px 25px rgba(49, 46, 129, 0.2)', position: 'relative', overflow: 'hidden',
          animation: '_sfu .5s ease .15s both'
        }}>
          <div style={{ position: 'absolute', right: -30, top: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(0, 243, 255, 0.05)' }} />
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{
              width: 50, height: 50, borderRadius: 14, background: 'linear-gradient(135deg, #00f3ff, #ff00ff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
              boxShadow: '0 0 20px rgba(0, 243, 255, 0.4)'
            }}>🏎️</div>
            <div>
              <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>Turbo Typing Challenge</h3>
              <p style={{ fontSize: 13, opacity: 0.8, margin: 0 }}>Can you divert the cars before they clash? Level up your speed!</p>
            </div>
          </div>
          <Link to={ROUTES.STUDENT_TYPING_GAME} style={{
            position: 'relative', zIndex: 1, padding: '10px 20px', borderRadius: 12,
            background: '#fff', color: '#312e81', fontSize: 13, fontWeight: 800,
            textDecoration: 'none', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>PLAY NITRO →</Link>
        </div>

        {/* ── Global Library Teaser ── */}
        <div className="resp-flex-stack" style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)',
          borderRadius: 18, padding: '20px 24px', marginBottom: 22, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 10px 25px rgba(6, 78, 59, 0.2)', position: 'relative', overflow: 'hidden',
          animation: '_sfu .5s ease .2s both'
        }}>
          <div style={{ position: 'absolute', right: -30, top: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{
              width: 50, height: 50, borderRadius: 14, background: 'linear-gradient(135deg, #6ee7b7, #34d399)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
              boxShadow: '0 0 20px rgba(52, 211, 153, 0.4)'
            }}>📚</div>
            <div>
              <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>Global Learning Library</h3>
              <p style={{ fontSize: 13, opacity: 0.8, margin: 0 }}>Read passages, watch videos & explore study materials published for you.</p>
            </div>
          </div>
          <Link to={ROUTES.STUDENT_LIBRARY} style={{
            position: 'relative', zIndex: 1, padding: '10px 20px', borderRadius: 12,
            background: '#fff', color: '#064e3b', fontSize: 13, fontWeight: 800,
            textDecoration: 'none', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            whiteSpace: 'nowrap',
          }}>OPEN →</Link>
        </div>

        {/* ── Main Grid ── */}
        <div className="sd-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>

          {/* ── LEFT ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Today's Schedule */}
            <div className="sd-card" style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', overflow: 'hidden', boxShadow: '0 1px 4px rgba(109,40,217,.06)', animation: '_sfu .5s ease .2s both' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>📅</span>
                  <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Today's Schedule</h3>
                  <span style={{ fontSize: 11, fontWeight: 700, background: '#f5f3ff', color: '#6d28d9', padding: '2px 8px', borderRadius: 99 }}>{DAYS[now.getDay()]}</span>
                </div>
                <Link to={ROUTES.STUDENT_SCHEDULE} style={{ fontSize: 12, fontWeight: 600, color: '#6d28d9', textDecoration: 'none' }}>Full schedule →</Link>
              </div>
              {todayLessons.length === 0 ? (
                <div style={{ padding: '28px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 6 }}>☀️</div>
                  <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>No classes scheduled today</p>
                </div>
              ) : (
                <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {todayLessons.map((l: any, i: number) => {
                    const sTime = l.period?.start_time?.slice(0, 5) ?? ''
                    const eTime = l.period?.end_time?.slice(0, 5) ?? ''
                    const sMins = timeToMins(sTime); const eMins = timeToMins(eTime)
                    const isNow = currentMins >= sMins && currentMins < eMins
                    const isDone = currentMins >= eMins
                    const color = isNow ? '#16a34a' : isDone ? '#9ca3af' : '#6d28d9'
                    const bg = isNow ? '#f0fdf4' : isDone ? '#f9fafb' : '#faf5ff'
                    return (
                      <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: bg, border: `1px solid ${color}22`, animation: `_sfu .3s ease ${i * .04}s both` }}>
                        <div style={{ textAlign: 'center', flexShrink: 0, width: 48 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color }}>{sTime}</div>
                          <div style={{ fontSize: 10, color: '#9ca3af' }}>{eTime}</div>
                        </div>
                        <div style={{ width: 2, height: 36, background: color + '40', borderRadius: 99, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{l.subject?.name}</div>
                          <div style={{ fontSize: 11, color: '#6b7280' }}>{l.period?.name}{l.teacher?.user?.full_name ? ` · ${l.teacher.user.full_name}` : ''}</div>
                        </div>
                        {isNow && <span style={{ fontSize: 10, fontWeight: 800, background: '#16a34a', color: '#fff', padding: '2px 8px', borderRadius: 99 }}>LIVE</span>}
                        {isDone && <span style={{ fontSize: 14, color: '#d1d5db' }}>✓</span>}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Subject Scores */}
            {subjectScores.length > 0 && (
              <div className="sd-card" style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', overflow: 'hidden', boxShadow: '0 1px 4px rgba(109,40,217,.06)', animation: '_sfu .5s ease .28s both' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>📚</span>
                    <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Subject Performance</h3>
                    {term && <span style={{ fontSize: 11, fontWeight: 700, background: '#f5f3ff', color: '#6d28d9', padding: '2px 8px', borderRadius: 99 }}>{(term as any).name}</span>}
                  </div>
                  <Link to={ROUTES.STUDENT_RESULTS} style={{ fontSize: 12, fontWeight: 600, color: '#6d28d9', textDecoration: 'none' }}>Full report →</Link>
                </div>
                <div style={{ padding: '8px 0' }}>
                  {subjectScores.map((s: any, i: number) => {
                    const g = getGradeInfo(s.total_score ?? 0)
                    return (
                      <div key={i} className="sd-row"
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px', borderBottom: i < subjectScores.length - 1 ? '1px solid #faf5ff' : 'none', transition: 'background .12s' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 9, background: g.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: g.color, flexShrink: 0 }}>{g.grade}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 4 }}>{s.subject?.name}</div>
                          <div style={{ height: 4, background: '#f0eefe', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${s.total_score ?? 0}%`, background: g.color, borderRadius: 99, transition: 'width 1s ease' }} />
                          </div>
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 800, color: g.color, flexShrink: 0 }}>{(s.total_score ?? 0).toFixed(1)}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {subjectScores.length === 0 && (
              <div style={{ background: 'linear-gradient(135deg,#2e1065,#4c1d95,#5b21b6)', borderRadius: 18, padding: '32px 28px', color: '#fff', position: 'relative', overflow: 'hidden', animation: '_sfu .5s ease .28s both' }}>
                <div style={{ position: 'absolute', right: -20, bottom: -20, fontSize: 120, opacity: .08, transform: 'rotate(-10deg)' }}>🎓</div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', opacity: .7, marginBottom: 8 }}>📊 YOUR RESULTS</div>
                  <h2 style={{ fontFamily: '"Playfair Display",serif', fontSize: 22, fontWeight: 700, margin: '0 0 10px' }}>Results are being finalized</h2>
                  <p style={{ fontSize: 13, opacity: .8, lineHeight: 1.6, maxWidth: 380 }}>Your teachers are currently entering scores for this term. Check back soon to see your full performance report.</p>
                  <Link to={ROUTES.STUDENT_RESULTS} style={{ display: 'inline-flex', marginTop: 18, padding: '10px 20px', borderRadius: 10, background: 'rgba(255,255,255,.15)', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none', backdropFilter: 'blur(10px)' }}>View Results Page →</Link>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Profile card */}
            <div style={{ background: 'linear-gradient(145deg,#2e1065,#4c1d95,#5b21b6)', borderRadius: 18, padding: '20px', color: '#fff', position: 'relative', overflow: 'hidden', animation: '_sfu .5s ease .22s both' }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,.05)' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#f59e0b,#fbbf24)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#fff', flexShrink: 0, boxShadow: '0 4px 12px rgba(245,158,11,.35)' }}>
                    {user?.full_name?.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.full_name}</p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,.55)', margin: 0 }}>{studentData?.class?.name ?? 'No class'}</p>
                    <span style={{ fontSize: 10, fontWeight: 800, background: 'rgba(255,255,255,.15)', color: '#fff', padding: '2px 8px', borderRadius: 99, marginTop: 3, display: 'inline-block' }}>🎓 Student</span>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { label: 'Student ID', value: studentData?.student_id ?? '—' },
                    { label: 'School', value: studentData?.school?.name ?? '—' },
                  ].map(s => (
                    <div key={s.label} style={{ background: 'rgba(255,255,255,.08)', borderRadius: 9, padding: '8px 10px' }}>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>{s.label}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#fff', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.value}</div>
                    </div>
                  ))}
                </div>
                {reportCard && (
                  <div style={{ marginTop: 12, background: 'rgba(255,255,255,.1)', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', fontWeight: 700 }}>TERM RANK</div>
                      <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 20, fontWeight: 700, color: '#fbbf24' }}>
                        {reportCard.overall_position ?? '—'}{reportCard.overall_position ? <span style={{ fontSize: 11 }}> / {reportCard.total_students}</span> : ''}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', fontWeight: 700 }}>AVERAGE</div>
                      <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 20, fontWeight: 700, color: '#fff' }}>{(reportCard.average_score ?? 0).toFixed(1)}%</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Pending Assignments */}
            <div className="sd-card" style={{ background: '#fff', borderRadius: 16, border: `1.5px solid ${pendingAssignments.length > 0 ? '#fde68a' : '#f0eefe'}`, padding: '16px', boxShadow: '0 1px 4px rgba(109,40,217,.06)', animation: '_sfu .5s ease .28s both' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>📝</span>
                  <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>Pending Quizzes</h3>
                </div>
                {pendingAssignments.length > 0 && <span style={{ fontSize: 11, fontWeight: 800, background: '#fde68a', color: '#92400e', padding: '2px 8px', borderRadius: 99 }}>{pendingAssignments.length}</span>}
              </div>
              {pendingAssignments.length === 0 ? (
                <div style={{ padding: '12px 0', textAlign: 'center' }}>
                  <div style={{ fontSize: 28, marginBottom: 4 }}>✅</div>
                  <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>All caught up!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {pendingAssignments.map((a: any) => {
                    const due = a.due_date ? new Date(a.due_date) : null
                    const isOverdue = due && due < now
                    return (
                      <Link key={a.id} to={`${ROUTES.STUDENT_ASSIGNMENTS}/${a.id}`}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: isOverdue ? '#fef2f2' : '#faf5ff', textDecoration: 'none', border: `1px solid ${isOverdue ? '#fecaca' : '#ede9fe'}` }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: isOverdue ? '#fef2f2' : '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>📝</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</div>
                          <div style={{ fontSize: 10, color: isOverdue ? '#dc2626' : '#6b7280' }}>
                            {a.subject?.name}{due ? ` · Due ${due.toLocaleDateString('en-GH', { day: 'numeric', month: 'short' })}` : ''}
                            {isOverdue ? ' · OVERDUE' : ''}
                          </div>
                        </div>
                        <span style={{ fontSize: 11, color: '#a78bfa' }}>→</span>
                      </Link>
                    )
                  })}
                  <Link to={ROUTES.STUDENT_ASSIGNMENTS} style={{ display: 'block', textAlign: 'center', padding: '8px', borderRadius: 9, background: '#f5f3ff', color: '#6d28d9', fontSize: 12, fontWeight: 600, textDecoration: 'none', marginTop: 4 }}>View all assignments →</Link>
                </div>
              )}
            </div>

            {/* Announcements */}
            {announcements.length > 0 && (
              <div className="sd-card" style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', padding: '16px', boxShadow: '0 1px 4px rgba(109,40,217,.06)', animation: '_sfu .5s ease .34s both' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span>📢</span>
                  <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>Announcements</h3>
                </div>
                {announcements.map((a: any, i: number) => (
                  <div key={a.id} style={{ paddingBottom: i < announcements.length - 1 ? 11 : 0, marginBottom: i < announcements.length - 1 ? 11 : 0, borderBottom: i < announcements.length - 1 ? '1px solid #f5f3ff' : 'none' }}>
                    <div style={{ display: 'flex', gap: 5, alignItems: 'flex-start', marginBottom: 2 }}>
                      {a.is_pinned && <span style={{ fontSize: 10, flexShrink: 0, marginTop: 2 }}>📌</span>}
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{a.title}</span>
                    </div>
                    <p style={{ fontSize: 11, color: '#6b7280', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as any}>{a.body}</p>
                    <span style={{ fontSize: 10, color: '#9ca3af' }}>{new Date(a.created_at).toLocaleDateString('en-GH', { day: 'numeric', month: 'short' })}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Quick links */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', padding: '16px', boxShadow: '0 1px 4px rgba(109,40,217,.06)', animation: '_sfu .5s ease .4s both' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 11 }}>
                <span>⚡</span>
                <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>Quick Links</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {[
                   { icon: '📚', label: 'Global Library', to: ROUTES.STUDENT_LIBRARY },
                   { icon: '📊', label: 'My Results', to: ROUTES.STUDENT_RESULTS },
                   { icon: '📅', label: 'Class Schedule', to: ROUTES.STUDENT_SCHEDULE },
                   { icon: '📝', label: 'Assignments & Quizzes', to: ROUTES.STUDENT_ASSIGNMENTS },
                ].map(({ icon, label, to }) => (
                  <Link key={label} to={to} className="sd-link"
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, background: '#faf5ff', textDecoration: 'none' }}>
                    <span style={{ fontSize: 15 }}>{icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#374151', flex: 1 }}>{label}</span>
                    <span style={{ fontSize: 13, color: '#a78bfa' }}>→</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
