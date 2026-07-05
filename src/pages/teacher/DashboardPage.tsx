import { useStuckLoadingReload } from '../../hooks/useStuckLoadingReload'
// src/pages/teacher/DashboardPage.tsx
// Full platform hub: timetable, attendance status, quiz submissions, all features
import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { useAuth } from '../../hooks/useAuth'
import { useCurrentTerm, useCurrentAcademicYear } from '../../hooks/useSettings'
import { getGradeInfo, calculateAverage, calculatePassRate } from '../../utils/grading'
import { formatDate, getEngagingGreeting } from '../../lib/utils'
import { ROUTES } from '../../constants/routes'
import FlaskLoader from '../../components/ui/FlaskLoader'
import { Button } from '../../components/ui/Button'
import { School, BookOpen, Calendar, CheckCircle, Clock, ClipboardCheck, Users, Book, Bell, Gamepad2, FileSpreadsheet, PencilLine, MessageSquare, X } from 'lucide-react'
import { useAutoRefresh } from "../../hooks/useAutoRefresh";

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
    useAutoRefresh(loadDashboard);
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
  useStuckLoadingReload(loading)
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
      const { data: teacher } = await supabase.from('teachers').select('*').eq('user_id', user!.id).maybeSingle()
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

      // Find if this teacher is a substitute for anyone today
      const { data: activeLeaves } = await supabase
        .from('leave_requests')
        .select('user_id')
        .eq('substitute_id', user!.id)
        .eq('status', 'approved')
        .lte('start_date', today)
        .gte('end_date', today)
      
      const absentUserIds = activeLeaves?.map((l: any) => l.user_id) || []
      
      let absentTeacherIds: string[] = []
      if (absentUserIds.length > 0) {
        const { data: absentTeachers } = await supabase
          .from('teachers')
          .select('id')
          .in('user_id', absentUserIds)
        absentTeacherIds = absentTeachers?.map((t: any) => t.id) || []
      }

      const allTeacherIdsForSlots = [teacher.id, ...absentTeacherIds]

      // Load timetable for today
      if (term?.id) {
        const { data: slots } = await supabase
          .from('timetable_slots')
          .select('*, subject:subjects(name), class:classes(name), period:timetable_periods(name,start_time,end_time,is_break,sort_order)')
          .in('teacher_id', allTeacherIdsForSlots)
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
          const studentCount = (Array.isArray(students) ? students : []).length ?? 0
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

    } catch (e: any) {
      console.error(e)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
      setFirstLoadComplete(true)
    }
  }

  async function sendMessage() {
    if (!msgSubject.trim() || !msgBody.trim()) return
    setSendingMsg(true)
    try {
      const schoolId = user!.school_id
      const groupKey = `staff_inbox_${schoolId}`

      // Find or create the school staff-inbox conversation
      let convId: string
      const { data: existing } = await supabase
        .from('chat_conversations')
        .select('id')
        .eq('group_key', groupKey)
        .maybeSingle()

      if (existing?.id) {
        convId = existing.id
      } else {
        const { data: created, error: convErr } = await supabase
          .from('chat_conversations')
          .insert({
            group_key: groupKey,
            school_id: schoolId,
            name: 'Staff Inbox',
            type: 'group',
          })
          .select('id')
          .single()
        if (convErr || !created) throw convErr ?? new Error('Could not create conversation')
        convId = created.id
      }

      // Ensure the sender is a member
      await supabase.from('chat_members').upsert(
        { conversation_id: convId, user_id: user!.id },
        { onConflict: 'conversation_id,user_id', ignoreDuplicates: true }
      )

      // Insert the message (priority + subject encoded in body for visibility)
      const priorityTag = msgPriority !== 'normal' ? `[${msgPriority.toUpperCase()}] ` : ''
      await supabase.from('chat_messages').insert({
        conversation_id: convId,
        sender_id: user!.id,
        body: `${priorityTag}${msgSubject}\n\n${msgBody}`,
        school_id: schoolId,
      })

      setMsgOpen(false); setMsgSubject(''); setMsgBody(''); setMsgPriority('normal')
    } catch { }
    finally { setSendingMsg(false) }
  }


  const uniqueClasses = [...new Map(assignments.map((a: any) => [a.class?.id, a.class])).values()].filter(Boolean)
  const uniqueSubjects = [...new Map(assignments.map((a: any) => [a.subject?.id, a.subject])).values()].filter(Boolean)
  const isClassTeacher = assignments.some((a: any) => a.is_class_teacher)
  const classesWithoutAttendance = uniqueClasses.filter((c: any) => !attendanceStatus[c.id])
  const { timeGreeting, roleMessage } = getEngagingGreeting(user?.role)
  const hour = now.getHours()

  // Determine current/next lesson
  const currentMins = hour * 60 + now.getMinutes()
  function timeToMins(t: string) {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return (isNaN(h) ? 0 : h * 60) + (isNaN(m) ? 0 : m);
  }
  const activeLesson = todayLessons.find((l: any) => {
    const start = l.period?.start_time?.slice(0, 5);
    const end = l.period?.end_time?.slice(0, 5);
    if (!start || !end) return false;
    const s = timeToMins(start);
    const e = timeToMins(end);
    return currentMins >= s && currentMins < e
  })
  const nextLesson = todayLessons.find((l: any) => {
    const start = l.period?.start_time?.slice(0, 5);
    return start && timeToMins(start) > currentMins;
  })

  if (loading) return <FlaskLoader fullScreen={false} label="Loading your dashboard…" />

  const userName = user?.full_name?.split(' ')[0] || 'Teacher'
  const todayName = DAYS[now.getDay()]

  // Quick action links
  const quickActions = [
    { label: 'Take Attendance', icon: ClipboardCheck, color: '#16A34A', to: ROUTES.TEACHER_ATTENDANCE },
    { label: 'Score Entry', icon: PencilLine, color: '#2563EB', to: ROUTES.TEACHER_SCORE_ENTRY },
    { label: 'My Classes', icon: School, color: '#7C3AED', to: ROUTES.TEACHER_MY_CLASSES },
    { label: 'Students', icon: Users, color: '#0891B2', to: ROUTES.TEACHER_STUDENTS },
    { label: 'Reports', icon: FileSpreadsheet, color: '#F59E0B', to: ROUTES.TEACHER_REPORTS },
    { label: 'Assignments', icon: Book, color: '#EC4899', to: ROUTES.TEACHER_ASSIGNMENTS },
    { label: 'Timetable', icon: Calendar, color: '#6366F1', to: ROUTES.TEACHER_TIMETABLE },
    { label: 'Messages', icon: MessageSquare, color: '#10B981', to: ROUTES.TEACHER_MESSAGES },
    { label: 'Typing Nitro', icon: Gamepad2, color: '#F97316', to: ROUTES.TEACHER_TYPING_GAME },
    { label: 'Notifications', icon: Bell, color: '#64748B', to: ROUTES.TEACHER_NOTIFICATIONS },
  ]

  return (
    <>
      {/* ── MESSAGE MODAL ── */}
      <div className={`overlay2${msgOpen ? ' open' : ''}`} onClick={e => { if (e.target === e.currentTarget) setMsgOpen(false) }}>
        <div style={{ background: 'var(--bg-card)', borderRadius: 18, padding: 0, width: '100%', maxWidth: 500, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>✉️ Message to Admin</div>
            <button onClick={() => setMsgOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: 6 }}><X size={18} /></button>
          </div>
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <input value={msgSubject} onChange={e => setMsgSubject(e.target.value)} placeholder="Subject" style={{ background: 'var(--bg-input, #F8FAFC)', border: '1.5px solid var(--border-color)', borderRadius: 10, padding: '11px 14px', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', outline: 'none', fontFamily: 'Inter, sans-serif' }} />
            <textarea value={msgBody} onChange={e => setMsgBody(e.target.value)} placeholder="Message…" rows={4} style={{ background: 'var(--bg-input, #F8FAFC)', border: '1.5px solid var(--border-color)', borderRadius: 10, padding: '11px 14px', fontSize: 14, color: 'var(--text-primary)', outline: 'none', resize: 'vertical', fontFamily: 'Inter, sans-serif' }} />
            <select value={msgPriority} onChange={e => setMsgPriority(e.target.value)} style={{ background: 'var(--bg-input, #F8FAFC)', border: '1.5px solid var(--border-color)', borderRadius: 10, padding: '11px 14px', fontSize: 14, color: 'var(--text-primary)', cursor: 'pointer', outline: 'none' }}>
              <option value="normal">Normal Priority</option>
              <option value="urgent">Urgent</option>
              <option value="low">Low Priority</option>
            </select>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setMsgOpen(false)} style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1.5px solid var(--border-color)', background: 'none', cursor: 'pointer', fontWeight: 700, color: 'var(--text-muted)', fontSize: 14 }}>Cancel</button>
              <button onClick={sendMessage} disabled={sendingMsg} style={{ flex: 2, padding: '12px', borderRadius: 10, border: 'none', background: '#2563EB', cursor: 'pointer', fontWeight: 800, color: '#fff', fontSize: 14 }}>
                {sendingMsg ? 'Sending…' : '✉️ Send Message'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .tch-dash {
          font-family: 'Inter', system-ui, sans-serif;
          color: var(--text-primary, #0F172A);
          padding: 28px 32px 80px;
          max-width: 1600px;
          margin: 0 auto;
        }
        @media (max-width: 1024px) { .tch-dash { padding: 20px 20px 80px; } }
        @media (max-width: 600px)  { .tch-dash { padding: 14px 14px 80px; } }

        .tch-kpi-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 14px;
          margin-bottom: 22px;
        }
        @media (max-width: 1024px) { .tch-kpi-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 600px)  { .tch-kpi-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; } }

        .tch-kpi {
          background: var(--bg-card, #fff);
          border: 1px solid var(--border-color, #E5E7EB);
          border-radius: 14px;
          padding: 18px;
          transition: all 0.2s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
          display: flex; flex-direction: column; gap: 10px;
          text-decoration: none; color: inherit;
        }
        .tch-kpi:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.08); }

        .tch-section {
          background: var(--bg-card, #fff);
          border: 1px solid var(--border-color, #E5E7EB);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
          margin-bottom: 18px;
        }
        .tch-section-head {
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-color, #E5E7EB);
          display: flex; align-items: center; justify-content: space-between; gap: 10px;
        }
        .tch-section-title {
          font-size: 14px; font-weight: 800;
          color: var(--text-primary, #0F172A);
          letter-spacing: -0.01em;
          font-family: 'Outfit', 'Inter', sans-serif;
        }
        .tch-section-body { padding: 18px 20px; }

        .tch-body-grid {
          display: grid;
          grid-template-columns: 3fr 2fr;
          gap: 18px;
          margin-bottom: 18px;
        }
        @media (max-width: 1100px) { .tch-body-grid { grid-template-columns: 1fr; } }

        .tch-qa-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 10px;
        }
        @media (max-width: 900px)  { .tch-qa-grid { grid-template-columns: repeat(4, 1fr); } }
        @media (max-width: 600px)  { .tch-qa-grid { grid-template-columns: repeat(3, 1fr); gap: 8px; } }

        .tch-qa-item {
          display: flex; flex-direction: column; align-items: center;
          gap: 7px; padding: 12px 6px;
          background: var(--bg-hover, #F1F5F9);
          border-radius: 12px;
          text-decoration: none; color: inherit;
          border: 1px solid transparent;
          transition: all 0.2s; cursor: pointer;
        }
        .tch-qa-item:hover { background: var(--bg-card); border-color: var(--border-color); transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.08); }

        .tch-lesson-row {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid var(--border-color, #E5E7EB);
        }
        .tch-lesson-row:last-child { border-bottom: none; }

        .tch-score-row {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid var(--border-color);
        }
        .tch-score-row:last-child { border-bottom: none; }

        .tch-class-card {
          background: var(--bg-hover, #F8FAFC);
          border: 1px solid var(--border-color);
          border-radius: 14px;
          padding: 16px;
          transition: all 0.2s;
        }
        .tch-class-card:hover { border-color: #7C3AED; box-shadow: 0 4px 12px rgba(124,58,237,0.08); }

        .overlay2 { display:none; position:fixed; inset:0; z-index:300; background:rgba(17,24,39,.55); backdrop-filter:blur(6px); align-items:center; justify-content:center; padding:16px; }
        .overlay2.open { display:flex; animation: tch-fi 0.15s ease; }

        @keyframes tch-fade-up { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        @keyframes tch-fi { from { opacity:0 } to { opacity:1 } }
        .tch-anim { animation: tch-fade-up 0.4s cubic-bezier(0.2,0.8,0.2,1) both; }
      `}</style>

      <div className="tch-dash">

        {/* ── HERO ── */}
        <div style={{
          borderRadius: 20,
          padding: '28px 32px',
          marginBottom: 20,
          background: 'linear-gradient(135deg, #14532D 0%, #166534 45%, #065F46 100%)',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }} className="tch-anim">
          <div style={{ position: 'absolute', top: -80, right: -60, width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -60, right: 200, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, position: 'relative', zIndex: 1 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.55, marginBottom: 6 }}>TEACHER WORKSTATION</div>
              <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(20px, 3vw, 30px)', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 6, lineHeight: 1.1 }}>
                {timeGreeting}, {userName} 🍎
              </h1>
              <p style={{ fontSize: 13, opacity: 0.72, fontWeight: 500, marginBottom: 18 }}>
                {todayName} · {term?.name ?? 'No active term'} · {year?.name ?? ''}
              </p>

              {/* Context pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {activeLesson ? (
                  <span style={{ background: 'rgba(34,197,94,0.25)', color: '#86EFAC', fontSize: 12, fontWeight: 800, padding: '5px 12px', borderRadius: 99, border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80', display: 'inline-block', boxShadow: '0 0 6px #4ADE80' }} />
                    NOW: {activeLesson.subject?.name} · {activeLesson.class?.name}
                  </span>
                ) : nextLesson ? (
                  <span style={{ background: 'rgba(253,186,116,0.2)', color: '#FDE68A', fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 99, border: '1px solid rgba(253,186,116,0.25)' }}>
                    ⏩ Next: {nextLesson.subject?.name} at {nextLesson.period?.start_time?.slice(0, 5)}
                  </span>
                ) : null}
                {classesWithoutAttendance.length > 0 && (
                  <span style={{ background: 'rgba(239,68,68,0.2)', color: '#FCA5A5', fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 99, border: '1px solid rgba(239,68,68,0.25)' }}>
                    ⚠️ {classesWithoutAttendance.length} class{classesWithoutAttendance.length > 1 ? 'es' : ''} need attendance
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link to={ROUTES.TEACHER_ATTENDANCE} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, background: '#16A34A', color: '#fff', fontWeight: 800, fontSize: 14, padding: '11px 20px', borderRadius: 12, boxShadow: '0 4px 12px rgba(22,163,74,0.4)' }}>
                <ClipboardCheck size={16} /> Take Attendance
              </Link>
              <button onClick={() => setMsgOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: 700, fontSize: 13, padding: '10px 18px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
                <MessageSquare size={14} /> Message Admin
              </button>
            </div>
          </div>
        </div>

        {/* ── KPI ROW ── */}
        <div className="tch-kpi-grid tch-anim" style={{ animationDelay: '0.06s' }}>
          {[
            { label: 'Classes', value: uniqueClasses.length, icon: School, color: '#7C3AED', to: ROUTES.TEACHER_MY_CLASSES, sub: isClassTeacher ? 'Class Teacher ⭐' : 'Teaching' },
            { label: 'Subjects', value: uniqueSubjects.length, icon: BookOpen, color: '#2563EB', to: ROUTES.TEACHER_SUBJECTS, sub: 'This term' },
            { label: 'Pending Scores', value: pendingCount, icon: Clock, color: pendingCount > 0 ? '#DC2626' : '#16A34A', to: ROUTES.TEACHER_SCORE_ENTRY, sub: pendingCount > 0 ? 'Need entry' : 'All done ✓' },
            { label: 'Submitted', value: submittedCount, icon: CheckCircle, color: '#16A34A', to: ROUTES.TEACHER_SCORE_ENTRY, sub: 'Score records' },
            { label: 'Quiz Subs', value: myQuizSubs, icon: Book, color: '#F59E0B', to: ROUTES.TEACHER_ASSIGNMENTS, sub: `${myQuizCount} quizzes` },
          ].map(({ label, value, icon: Icon, color, to, sub }) => (
            <Link key={label} to={to} className="tch-kpi">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} color={color} strokeWidth={2} />
                </div>
              </div>
              <div>
                <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 26, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-primary)', lineHeight: 1 }}>
                  <AnimNum to={value} />
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 2, fontWeight: 500 }}>{sub}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* ── ATTENDANCE ALERT ── */}
        {classesWithoutAttendance.length > 0 && (
          <div className="tch-anim" style={{ animationDelay: '0.1s', background: 'linear-gradient(90deg, rgba(220,38,38,0.08), rgba(239,68,68,0.04))', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 14, padding: '14px 20px', marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>⚠️</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14, color: '#DC2626' }}>Attendance not taken today</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
                  {classesWithoutAttendance.map((c: any) => c.name).join(', ')}
                </div>
              </div>
            </div>
            <Link to={ROUTES.TEACHER_ATTENDANCE} style={{ textDecoration: 'none', background: '#DC2626', color: '#fff', fontWeight: 800, fontSize: 13, padding: '9px 18px', borderRadius: 10 }}>
              Take Now →
            </Link>
          </div>
        )}

        {/* ── QUICK ACTIONS ── */}
        <div className="tch-section tch-anim" style={{ animationDelay: '0.14s' }}>
          <div className="tch-section-head">
            <span className="tch-section-title">⚡ Quick Actions</span>
          </div>
          <div style={{ padding: '14px 18px' }}>
            <div className="tch-qa-grid">
              {quickActions.map(({ label, icon: Icon, color, to }) => (
                <Link key={label} to={to} className="tch-qa-item">
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${color}22` }}>
                    <Icon size={18} color={color} strokeWidth={2} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary, #374151)', textAlign: 'center', lineHeight: 1.3 }}>{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="tch-body-grid tch-anim" style={{ animationDelay: '0.2s' }}>

          {/* LEFT: Timetable + Scores */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Today's Timetable */}
            <div className="tch-section">
              <div className="tch-section-head">
                <span className="tch-section-title">📅 Today — {todayName}</span>
                <Link to={ROUTES.TEACHER_TIMETABLE} style={{ fontSize: 12, fontWeight: 700, color: '#2563EB', textDecoration: 'none' }}>Full Schedule →</Link>
              </div>
              <div style={{ padding: '4px 20px 8px', maxHeight: 280, overflowY: 'auto' }}>
                {todayLessons.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                    {now.getDay() === 0 || now.getDay() === 6 ? 'Weekend — no lessons' : 'No lessons found for today'}
                  </div>
                ) : todayLessons.map((lesson: any, i: number) => {
                  const start = lesson.period?.start_time?.slice(0, 5)
                  const end = lesson.period?.end_time?.slice(0, 5)
                  const isNow = start && end && timeToMins(start) <= currentMins && currentMins < timeToMins(end)
                  return (
                    <div key={lesson.id ?? i} className="tch-lesson-row">
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: isNow ? '#16A34A' : 'var(--border-color)', flexShrink: 0, ...(isNow ? { boxShadow: '0 0 6px #16A34A' } : {}) }} />
                      <div style={{ width: 88, flexShrink: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: isNow ? '#16A34A' : 'var(--text-muted)' }}>
                          {start} – {end}
                        </div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {lesson.subject?.name ?? '—'}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                          {lesson.class?.name ?? '—'} · Period {lesson.period?.name ?? i + 1}
                        </div>
                      </div>
                      {isNow && <span style={{ fontSize: 10, fontWeight: 800, background: 'rgba(22,163,74,0.12)', color: '#16A34A', padding: '3px 8px', borderRadius: 6, flexShrink: 0 }}>NOW</span>}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Recent Scores */}
            <div className="tch-section">
              <div className="tch-section-head">
                <span className="tch-section-title">📝 Recent Scores Entered</span>
                <Link to={ROUTES.TEACHER_SCORE_ENTRY} style={{ fontSize: 12, fontWeight: 700, color: '#2563EB', textDecoration: 'none' }}>Enter Scores →</Link>
              </div>
              <div style={{ padding: '4px 20px 8px' }}>
                {recentScores.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text-muted)', fontSize: 13 }}>No scores entered yet</div>
                ) : recentScores.map((s: any) => {
                  const gi = getGradeInfo(s.total_score ?? 0)
                  return (
                    <div key={s.id} className="tch-score-row">
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: `${gi.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <PencilLine size={16} color={gi.color} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.student?.full_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{s.subject?.name} · {s.class?.name}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 900, color: gi.color, fontFamily: "'Outfit', sans-serif" }}>{s.total_score?.toFixed(1)}%</div>
                        <div style={{ fontSize: 10, color: 'var(--text-subtle)', fontWeight: 500 }}>{timeAgo(s.updated_at)}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* RIGHT: Class Cards + Announcements */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Class Performance */}
            <div className="tch-section">
              <div className="tch-section-head">
                <span className="tch-section-title">🏫 My Classes</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>{uniqueClasses.length} class{uniqueClasses.length !== 1 ? 'es' : ''}</span>
              </div>
              <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {classStats.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>No class assignments this term</div>
                ) : classStats.map((cs: any) => {
                  const gi = getGradeInfo(cs.avg ?? 0)
                  const attDone = attendanceStatus[cs.classId]
                  return (
                    <div key={cs.classId} className="tch-class-card">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>{cs.className}</div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, background: attDone ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)', color: attDone ? '#16A34A' : '#DC2626', padding: '3px 8px', borderRadius: 6, border: `1px solid ${attDone ? 'rgba(22,163,74,0.2)' : 'rgba(220,38,38,0.2)'}` }}>
                            {attDone ? '✅ Att.' : '⚠️ Att.'}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                        {[
                          { label: 'Students', value: cs.studentCount, color: '#2563EB' },
                          { label: 'Avg Score', value: `${cs.avg}%`, color: gi.color },
                          { label: 'Pass Rate', value: `${cs.passRate}%`, color: cs.passRate >= 50 ? '#16A34A' : '#DC2626' },
                        ].map(m => (
                          <div key={m.label} style={{ background: 'var(--bg-card)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 900, color: m.color }}>{m.value}</div>
                            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.label}</div>
                          </div>
                        ))}
                      </div>
                      {cs.pendingEntries > 0 && (
                        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '7px 10px' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#D97706' }}>⏳ {cs.pendingEntries} pending score entries</span>
                          <Link to={ROUTES.TEACHER_SCORE_ENTRY} style={{ textDecoration: 'none', fontSize: 11, fontWeight: 800, color: '#2563EB' }}>Enter →</Link>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Announcements */}
            <div className="tch-section">
              <div className="tch-section-head">
                <span className="tch-section-title">📣 Announcements</span>
              </div>
              <div style={{ padding: '4px 0 8px' }}>
                {announcements.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>No announcements</div>
                ) : announcements.map((a: any, i: number) => (
                  <div key={a.id} style={{ display: 'flex', gap: 12, padding: '12px 20px', borderBottom: i < announcements.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#7C3AED', marginTop: 6, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{a.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{timeAgo(a.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Quiz Submissions */}
            {recentQuizSubs.length > 0 && (
              <div className="tch-section">
                <div className="tch-section-head">
                  <span className="tch-section-title">📚 Quiz Submissions</span>
                  <Link to={ROUTES.TEACHER_ASSIGNMENTS} style={{ fontSize: 12, fontWeight: 700, color: '#2563EB', textDecoration: 'none' }}>View All →</Link>
                </div>
                <div style={{ padding: '4px 20px 8px' }}>
                  {recentQuizSubs.slice(0, 4).map((sub: any, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < Math.min(recentQuizSubs.length, 4) - 1 ? '1px solid var(--border-color)' : 'none' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Book size={15} color="#F59E0B" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub.student?.full_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub.assignments?.title}</div>
                      </div>
                      {sub.score != null && (
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#F59E0B', fontFamily: "'Outfit', sans-serif" }}>
                          {sub.score}/{sub.total_possible}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
