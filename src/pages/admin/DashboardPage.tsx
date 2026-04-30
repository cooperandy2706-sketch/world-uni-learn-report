import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { useAuth } from '../../hooks/useAuth'
import { useCurrentTerm, useCurrentAcademicYear } from '../../hooks/useSettings'
import { getGradeInfo } from '../../utils/grading'
import { formatDate, ordinal } from '../../lib/utils'
import { ROUTES } from '../../constants/routes'

interface Stats {
  students: number; teachers: number; classes: number; subjects: number
  departments: number; reportsGenerated: number; totalStudentsForReports: number
  pendingScores: number; unreadMessages: number; totalAssignments: number
  totalSubmissions: number; totalAnnouncements: number
  presentToday: number; absentToday: number; attendanceClasses: number
  totalDebt: number; pendingApproval: number
}
interface TopStudent { student_id: string; full_name: string; class_name: string; average_score: number; overall_position: number; total_students: number }
interface Message { id: string; subject: string; body: string; priority: string; created_at: string; is_read: boolean; from_user?: { full_name: string } }
interface ClassStat { id: string; name: string; student_count: number; avg_score: number | null; reports_done: number }
interface RecentActivity { type: string; label: string; sub: string; time: string; icon: string; color: string }

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'; if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`
}

const priorityStyle: Record<string, { bg: string; color: string; label: string }> = {
  urgent: { bg: '#fef2f2', color: '#dc2626', label: 'URGENT' },
  high:   { bg: '#fff7ed', color: '#ea580c', label: 'HIGH' },
  normal: { bg: '#f5f3ff', color: '#6d28d9', label: 'MSG' },
  low:    { bg: '#f0fdf4', color: '#16a34a', label: 'INFO' },
}

function AnimNum({ to, duration = 900 }: { to: number; duration?: number }) {
  const [val, setVal] = useState(0); const ref = useRef(false)
  useEffect(() => {
    if (ref.current) return; ref.current = true
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1); const ease = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(ease * to)); if (p < 1) requestAnimationFrame(tick)
    }; requestAnimationFrame(tick)
  }, [to, duration])
  return <>{val.toLocaleString()}</>
}

function StatCard({ icon, label, value, color, bg, link, pulse, sub }: {
  icon: string; label: string; value: number; color: string; bg: string; link: string; pulse?: boolean; sub?: string
}) {
  const [hov, setHov] = useState(false)
  return (
    <Link to={link} style={{ textDecoration: 'none', display: 'block' }}>
      <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{ background: '#fff', borderRadius: 16, padding: '16px 18px', border: `1.5px solid ${hov ? color + '40' : '#f0eefe'}`, boxShadow: hov ? `0 8px 24px ${color}18` : '0 1px 4px rgba(109,40,217,0.07)', transition: 'all 0.25s', transform: hov ? 'translateY(-3px)' : 'none', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, transition: 'transform 0.25s', transform: hov ? 'scale(1.12) rotate(-4deg)' : 'none', position: 'relative' }}>
            {icon}
            {pulse && <span style={{ position: 'absolute', top: -3, right: -3, width: 10, height: 10, borderRadius: '50%', background: color, border: '2px solid #fff', animation: '_pulse 1.5s infinite' }} />}
          </div>
          <span style={{ fontSize: 10, color: '#c4b5fd', fontWeight: 600 }}>→</span>
        </div>
        <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#111827', lineHeight: 1 }}><AnimNum to={value} /></div>
        <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 500, marginTop: 3 }}>{label}</div>
        {sub && <div style={{ fontSize: 10, color: color, fontWeight: 700, marginTop: 2 }}>{sub}</div>}
      </div>
    </Link>
  )
}

function DashboardClock() {
  const [t, setT] = useState(new Date())
  useEffect(() => { const i = setInterval(() => setT(new Date()), 1000); return () => clearInterval(i) }, [])
  return <>{t.toLocaleTimeString('en-GH', { hour12: false })}</>
}

// ═══════════════════════════════════════════════════════════
export default function DashboardPage() {
  const { setFirstLoadComplete } = useAuthStore()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: term } = useCurrentTerm()
  const { data: year } = useCurrentAcademicYear()

  const [stats, setStats] = useState<Stats | null>(null)
  const [topStudents, setTopStudents] = useState<TopStudent[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [classStats, setClassStats] = useState<ClassStat[]>([])
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [activeMsg, setActiveMsg] = useState<Message | null>(null)

  useEffect(() => { setTimeout(() => setMounted(true), 60) }, [])

  useEffect(() => {
    if (!user?.school_id) {
      setFirstLoadComplete(true)
      return
    }
    loadAll()
    const channel = supabase.channel('dashboard-msgs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `school_id=eq.${user.school_id}` }, () => loadMessages())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user?.school_id, term?.id])

  async function loadAll() {
    try {
      await Promise.all([loadStats(), loadTopStudents(), loadMessages(), loadClassStats(), loadRecentActivity(), loadAnnouncements()])
    } finally {
      setLoading(false)
      setFirstLoadComplete(true)
    }
  }

  async function loadStats() {
    const sid = user!.school_id
    const [
      { count: students }, { count: teachers }, { count: classes },
      { count: subjects }, { count: departments }, { count: msgs },
      { count: assigns }, { count: subs }, { count: announceCount }
    ] = await Promise.all([
      supabase.from('students').select('*', { count: 'exact', head: true }).eq('school_id', sid).eq('is_active', true),
      supabase.from('teachers').select('*', { count: 'exact', head: true }).eq('school_id', sid),
      supabase.from('classes').select('*', { count: 'exact', head: true }).eq('school_id', sid),
      supabase.from('subjects').select('*', { count: 'exact', head: true }).eq('school_id', sid),
      supabase.from('departments').select('*', { count: 'exact', head: true }).eq('school_id', sid),
      supabase.from('messages').select('*', { count: 'exact', head: true }).eq('school_id', sid).eq('is_read', false),
      supabase.from('assignments').select('*', { count: 'exact', head: true }).eq('school_id', sid),
      supabase.from('assignment_submissions').select('*, assignment:assignments!inner(*)', { count: 'exact', head: true }).eq('assignments.school_id', sid),
      supabase.from('announcements').select('*', { count: 'exact', head: true }).eq('school_id', sid),
    ])

    let reports = 0, totalForReports = students ?? 0, pendingScores = 0, totalDebt = 0, pendingApproval = 0
    if (term?.id) {
      const [{ count: r }, { count: p }, { data: arrearsData }, { count: pa }] = await Promise.all([
        supabase.from('report_cards').select('*', { count: 'exact', head: true }).eq('term_id', term.id),
        supabase.from('scores').select('*', { count: 'exact', head: true }).eq('term_id', term.id).eq('is_submitted', false),
        supabase.from('students').select('fees_arrears').eq('school_id', sid).eq('is_active', true),
        supabase.from('report_cards').select('*', { count: 'exact', head: true }).eq('term_id', term.id).eq('status', 'pending_approval'),
      ])
      reports = r ?? 0; pendingScores = p ?? 0; pendingApproval = pa ?? 0
      totalDebt = arrearsData?.reduce((acc, s) => acc + (s.fees_arrears || 0), 0) || 0
    }

    // Today's attendance
    const today = new Date().toISOString().slice(0, 10)
    const { data: attToday } = await supabase.from('attendance_records').select('status, student_id').eq('school_id', sid).eq('date', today)
    const presentToday = attToday?.filter((a: any) => a.status === 'present' || a.status === 'late').length ?? 0
    const absentToday = attToday?.filter((a: any) => a.status === 'absent').length ?? 0

    // How many classes took attendance today
    const { data: attClasses } = await supabase.from('attendance_records').select('class_id').eq('school_id', sid).eq('date', today)
    const attendanceClasses = new Set(attClasses?.map((a: any) => a.class_id)).size

    setStats({ 
      students: students ?? 0, 
      teachers: teachers ?? 0, 
      classes: classes ?? 0, 
      subjects: subjects ?? 0, 
      departments: departments ?? 0, 
      reportsGenerated: reports, 
      totalStudentsForReports: totalForReports, 
      pendingScores, 
      unreadMessages: msgs ?? 0, 
      totalAssignments: assigns ?? 0, 
      totalSubmissions: subs ?? 0, 
      totalAnnouncements: announceCount ?? 0, 
      presentToday, 
      absentToday, 
      attendanceClasses,
      totalDebt,
      pendingApproval
    })
  }

  async function loadRecentActivity() {
    const sid = user!.school_id
    const today = new Date().toISOString().slice(0, 10)
    const [{ data: recentSubs }, { data: recentScores }, { data: recentStudents }] = await Promise.all([
      supabase.from('assignment_submissions').select('submitted_at, student:students(full_name), assignment:assignments!inner(title)').eq('assignments.school_id', sid).order('submitted_at', { ascending: false }).limit(4),
      supabase.from('scores').select('updated_at, total_score, student:students(full_name), subject:subjects(name)').eq('school_id', sid).order('updated_at', { ascending: false }).limit(4),
      supabase.from('students').select('created_at, full_name').eq('school_id', sid).order('created_at', { ascending: false }).limit(3),
    ])

    const activities: RecentActivity[] = []
    recentSubs?.forEach((s: any) => activities.push({ type: 'quiz', label: `${s.student?.full_name} submitted "${s.assignment?.title}"`, sub: 'Quiz submission', time: s.submitted_at, icon: '📝', color: '#6d28d9' }))
    recentScores?.slice(0, 3).forEach((s: any) => activities.push({ type: 'score', label: `Score entered for ${s.student?.full_name} — ${s.subject?.name}`, sub: `${s.total_score?.toFixed(1)}%`, time: s.updated_at, icon: '✏️', color: '#0891b2' }))
    recentStudents?.forEach((s: any) => activities.push({ type: 'student', label: `New student: ${s.full_name}`, sub: 'Enrolled', time: s.created_at, icon: '👤', color: '#16a34a' }))
    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    setRecentActivities(activities.slice(0, 8))
  }

  async function loadTopStudents() {
    if (!term?.id) return
    const { data } = await supabase.from('report_cards')
      .select('student_id, average_score, overall_position, total_students, student:students(full_name, class:classes(name))')
      .eq('term_id', term.id).order('average_score', { ascending: false }).limit(5)
    if (data) setTopStudents(data.map((r: any) => ({ student_id: r.student_id, full_name: r.student?.full_name ?? '—', class_name: r.student?.class?.name ?? '—', average_score: r.average_score ?? 0, overall_position: r.overall_position ?? 0, total_students: r.total_students ?? 0 })))
  }

  async function loadMessages() {
    const { data } = await supabase.from('messages').select('*, from_user:users(full_name)').eq('school_id', user!.school_id).order('created_at', { ascending: false }).limit(6)
    setMessages(data ?? [])
  }

  async function loadClassStats() {
    const { data: classes } = await supabase.from('classes').select('id, name').eq('school_id', user!.school_id)
    if (!classes) return
    const results: ClassStat[] = await Promise.all(classes.map(async (cls) => {
      const { count: sc } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('class_id', cls.id).eq('is_active', true)
      let avg = null, done = 0
      if (term?.id) {
        const { data: rpts } = await supabase.from('report_cards').select('average_score').eq('class_id', cls.id).eq('term_id', term.id)
        if (rpts?.length) { avg = rpts.reduce((s, r) => s + (r.average_score ?? 0), 0) / rpts.length; done = rpts.length }
      }
      return { id: cls.id, name: cls.name, student_count: sc ?? 0, avg_score: avg, reports_done: done }
    }))
    setClassStats(results)
  }

  async function loadAnnouncements() {
    const { data } = await supabase.from('announcements').select('*').eq('school_id', user!.school_id).order('created_at', { ascending: false }).limit(3)
    setAnnouncements(data ?? [])
  }

  async function markRead(id: string) {
    await supabase.from('messages').update({ is_read: true }).eq('id', id)
    setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m))
    setStats(prev => prev ? { ...prev, unreadMessages: Math.max(0, prev.unreadMessages - 1) } : prev)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
      <style>{`@keyframes _spin { to{transform:rotate(360deg)} }`}</style>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #ede9fe', borderTopColor: '#6d28d9', animation: '_spin 0.8s linear infinite' }} />
      <p style={{ fontSize: 13, color: '#6b7280', fontFamily: '"DM Sans",sans-serif' }}>Loading dashboard…</p>
    </div>
  )

  const reportsRemaining = (stats?.totalStudentsForReports ?? 0) - (stats?.reportsGenerated ?? 0)
  const reportPct = stats?.totalStudentsForReports ? Math.round((stats.reportsGenerated / stats.totalStudentsForReports) * 100) : 0
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.85)} }
        @keyframes _fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes _slideIn { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
        @keyframes _glow { 0%,100%{box-shadow:0 0 0 0 rgba(109,40,217,0.2)} 50%{box-shadow:0 0 0 6px rgba(109,40,217,0)} }
        .da {animation:_fadeUp 0.5s cubic-bezier(.4,0,.2,1) both}
        .msg-item:hover{background:#faf5ff !important}
        .qb:hover{background:#ede9fe !important;transform:translateX(3px)}
        .act-row:hover{background:#faf5ff !important}
      `}</style>

      <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif', opacity: mounted ? 1 : 0, transition: 'opacity 0.4s ease' }}>

        {/* ── Header ── */}
        <div className="da" style={{ animationDelay: '0s', marginBottom: 22, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 28, fontWeight: 700, color: '#111827', margin: 0 }}>
              {greeting}, {user?.full_name?.split(' ')[0]} 👋
            </h1>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{year?.name}</span> · 
              <span>{term?.name ?? 'No active term'}</span> · 
              <span>{new Date().toLocaleDateString('en-GH', { weekday: 'long', day: 'numeric', month: 'long' })}</span> ·
              <span style={{ fontWeight: 700, color: '#7c3aed', fontFamily: 'monospace' }}><DashboardClock /></span>
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link to={ROUTES.ADMIN_ANNOUNCEMENTS} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: '#fff', color: '#374151', textDecoration: 'none', border: '1.5px solid #e5e7eb' }}>📢 Announce</Link>
            <Link to={ROUTES.ADMIN_REPORTS} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', textDecoration: 'none', boxShadow: '0 2px 10px rgba(109,40,217,0.3)' }}>📄 Reports</Link>
          </div>
        </div>

        {/* ── Term locked ── */}
        {(term as any)?.is_locked && (
          <div className="da" style={{ animationDelay: '.05s', marginBottom: 18, background: 'linear-gradient(135deg,#fef2f2,#fff5f5)', border: '1.5px solid #fecaca', borderRadius: 14, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20 }}>🔒</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#dc2626', margin: 0 }}>{(term as any).name} is LOCKED — teachers cannot submit scores</p>
            </div>
            <Link to={ROUTES.ADMIN_TERMS} style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', textDecoration: 'none', background: '#fee2e2', padding: '5px 12px', borderRadius: 99 }}>Unlock →</Link>
          </div>
        )}

        {/* ── Priority Feed ── */}
        {stats && (
          <div className="da" style={{ animationDelay: '.08s', marginBottom: 28 }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: '#1e1b4b', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
              Priority Action Feed
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
              {/* Attendance Alert */}
              {stats.classes > stats.attendanceClasses && (
                <Link to={ROUTES.ADMIN_ATTENDANCE} style={{ textDecoration: 'none' }}>
                  <div className="qb" style={{ background: '#fef2f2', border: '1.5px solid #fee2e2', borderRadius: 16, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.2s', cursor: 'pointer' }}>
                    <div style={{ fontSize: 22, width: 44, height: 44, borderRadius: 12, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📋</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#991b1b' }}>{stats.classes - stats.attendanceClasses} Classes missing attendance</div>
                      <div style={{ fontSize: 11, color: '#b91c1c', opacity: 0.8 }}>Required for today's records. Tap to view.</div>
                    </div>
                  </div>
                </Link>
              )}

              {/* Debt Alert */}
              {stats.totalDebt > 0 && (
                <Link to="/bursar/debtors" style={{ textDecoration: 'none' }}>
                  <div className="qb" style={{ background: '#fff7ed', border: '1.5px solid #ffedd5', borderRadius: 16, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.2s', cursor: 'pointer' }}>
                    <div style={{ fontSize: 22, width: 44, height: 44, borderRadius: 12, background: '#ffedd5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>💰</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#9a3412' }}>Debt Arrears: GH₵ {stats.totalDebt.toLocaleString()}</div>
                      <div style={{ fontSize: 11, color: '#c2410c', opacity: 0.8 }}>Action required on outstanding fees.</div>
                    </div>
                  </div>
                </Link>
              )}

              {/* Reports Alert */}
              {stats.pendingApproval > 0 && (
                <Link to={ROUTES.ADMIN_REPORTS} style={{ textDecoration: 'none' }}>
                  <div className="qb" style={{ background: '#f5f3ff', border: '1.5px solid #ede9fe', borderRadius: 16, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.2s', cursor: 'pointer' }}>
                    <div style={{ fontSize: 22, width: 44, height: 44, borderRadius: 12, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✍️</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#5b21b6' }}>{stats.pendingApproval} Reports awaiting signature</div>
                      <div style={{ fontSize: 11, color: '#6d28d9', opacity: 0.8 }}>Term completion depends on these approvals.</div>
                    </div>
                  </div>
                </Link>
              )}

              {stats.classes === stats.attendanceClasses && stats.totalDebt === 0 && stats.pendingApproval === 0 && (
                <div style={{ background: '#f0fdf4', border: '1.5px solid #dcfce7', borderRadius: 16, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: 22, width: 44, height: 44, borderRadius: 12, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✅</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#166534' }}>All systems healthy</div>
                    <div style={{ fontSize: 11, color: '#15803d', opacity: 0.8 }}>No priority actions required at this moment.</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {(stats?.unreadMessages ?? 0) > 0 && (
            <div className="da" style={{ animationDelay: '.08s', background: 'linear-gradient(135deg,#fdf4ff,#f5f3ff)', border: '1.5px solid #ddd6fe', borderRadius: 12, padding: '11px 18px', display: 'flex', alignItems: 'center', gap: 12, animation: '_glow 2.5s infinite' }}>
              <span style={{ fontSize: 20 }}>💬</span>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#6d28d9', margin: 0, flex: 1 }}>{stats!.unreadMessages} unread message{stats!.unreadMessages > 1 ? 's' : ''} from teachers</p>
              <span style={{ background: '#6d28d9', color: '#fff', borderRadius: 99, padding: '2px 10px', fontSize: 12, fontWeight: 800, animation: '_pulse 1.5s infinite' }}>{stats!.unreadMessages}</span>
            </div>
          )}
          {reportsRemaining > 0 && term?.id && (
            <div className="da" style={{ animationDelay: '.12s', background: 'linear-gradient(135deg,#fffbeb,#fef3c7)', border: '1.5px solid #fde68a', borderRadius: 12, padding: '11px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20 }}>📋</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#92400e', margin: '0 0 5px' }}>{reportsRemaining} report{reportsRemaining > 1 ? 's' : ''} not yet generated</p>
                <div style={{ height: 5, background: '#fde68a', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${reportPct}%`, background: 'linear-gradient(90deg,#f59e0b,#fbbf24)', borderRadius: 99 }} />
                </div>
              </div>
              <Link to={ROUTES.ADMIN_REPORTS} style={{ fontSize: 12, fontWeight: 700, color: '#92400e', textDecoration: 'none', background: '#fde68a', padding: '5px 12px', borderRadius: 99, flexShrink: 0 }}>Generate →</Link>
            </div>
          )}
        </div>

        {/* ── TODAY AT A GLANCE ── */}
        <div className="da" style={{ animationDelay: '.15s', marginBottom: 22 }}>
          <h2 style={{ fontFamily: '"Playfair Display",serif', fontSize: 15, fontWeight: 700, color: '#374151', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>📅</span> Today at a Glance
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
            {[
              { icon: '✅', label: 'Present Today', value: stats?.presentToday ?? 0, color: '#16a34a', bg: '#f0fdf4', sub: `from ${stats?.attendanceClasses ?? 0} class registers` },
              { icon: '❌', label: 'Absent Today', value: stats?.absentToday ?? 0, color: '#dc2626', bg: '#fef2f2', sub: 'marked absent' },
              { icon: '📝', label: 'Quiz Submissions', value: stats?.totalSubmissions ?? 0, color: '#6d28d9', bg: '#f5f3ff', sub: 'total all-time' },
              { icon: '📢', label: 'Announcements', value: stats?.totalAnnouncements ?? 0, color: '#0891b2', bg: '#ecfeff', sub: 'total posted' },
            ].map((s, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', border: '1.5px solid #f0eefe', boxShadow: '0 1px 4px rgba(109,40,217,0.06)' }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#374151', fontWeight: 600, marginTop: 2 }}>{s.label}</div>
                <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Main stat cards ── */}
        <div className="da" style={{ animationDelay: '.2s', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(145px,1fr))', gap: 14, marginBottom: 24 }}>
          <StatCard icon="👥" label="Students" value={stats?.students ?? 0} color="#6d28d9" bg="#f5f3ff" link={ROUTES.ADMIN_STUDENTS} />
          <StatCard icon="👨‍🏫" label="Teachers" value={stats?.teachers ?? 0} color="#0891b2" bg="#ecfeff" link={ROUTES.ADMIN_TEACHERS} />
          <StatCard icon="🏫" label="Classes" value={stats?.classes ?? 0} color="#16a34a" bg="#f0fdf4" link={ROUTES.ADMIN_CLASSES} />
          <StatCard icon="📚" label="Subjects" value={stats?.subjects ?? 0} color="#d97706" bg="#fffbeb" link={ROUTES.ADMIN_SUBJECTS} />
          <StatCard icon="🏛️" label="Departments" value={stats?.departments ?? 0} color="#7c3aed" bg="#f5f3ff" link={ROUTES.ADMIN_DEPARTMENTS} />
          <StatCard icon="📄" label="Reports Done" value={stats?.reportsGenerated ?? 0} color="#7c3aed" bg="#f5f3ff" link={ROUTES.ADMIN_REPORTS} sub={reportsRemaining > 0 ? `${reportsRemaining} pending` : 'All done ✓'} />
          <StatCard icon="⏳" label="Pending Scores" value={stats?.pendingScores ?? 0} color="#dc2626" bg="#fef2f2" link={ROUTES.ADMIN_REPORTS} pulse={(stats?.pendingScores ?? 0) > 0} />
          <StatCard icon="📝" label="Quizzes" value={stats?.totalAssignments ?? 0} color="#10b981" bg="#ecfdf5" link={ROUTES.ADMIN_ANALYTICS} />
        </div>

        {/* ── Two-column layout ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 22 }}>

          {/* ── LEFT ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Top Students */}
            <div className="da" style={{ animationDelay: '.3s', background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', boxShadow: '0 1px 4px rgba(109,40,217,0.07)', overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>🏆</span>
                  <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Top Performers</h3>
                  {term && <span style={{ fontSize: 11, fontWeight: 700, background: '#f5f3ff', color: '#6d28d9', padding: '2px 8px', borderRadius: 99 }}>{(term as any).name}</span>}
                </div>
                <Link to={ROUTES.ADMIN_REPORTS} style={{ fontSize: 12, fontWeight: 600, color: '#6d28d9', textDecoration: 'none' }}>View all →</Link>
              </div>
              {topStudents.length === 0 ? (
                <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 6 }}>📊</div>
                  <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 12 }}>No reports generated yet for this term.</p>
                  <Link to={ROUTES.ADMIN_REPORTS} style={{ display: 'inline-flex', padding: '8px 18px', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', borderRadius: 9, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>Generate Reports</Link>
                </div>
              ) : (
                <div>
                  {topStudents.map((s, i) => {
                    const g = getGradeInfo(s.average_score)
                    const medals = ['🥇', '🥈', '🥉']
                    return (
                      <div key={s.student_id}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: i < topStudents.length - 1 ? '1px solid #faf5ff' : 'none', transition: 'background .15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#faf5ff')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: i < 3 ? 17 : 11, fontWeight: 800, background: i < 3 ? 'transparent' : '#f5f3ff', color: '#6d28d9', flexShrink: 0 }}>{i < 3 ? medals[i] : `#${i + 1}`}</div>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{s.full_name.charAt(0)}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.full_name}</p>
                          <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>{s.class_name} · {ordinal(s.overall_position)} / {s.total_students}</p>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <span style={{ fontSize: 14, fontWeight: 800, color: g.color }}>{s.average_score.toFixed(1)}%</span>
                          <div style={{ fontSize: 10, fontWeight: 800, background: g.color + '18', color: g.color, padding: '1px 6px', borderRadius: 99, display: 'inline-block', marginLeft: 4 }}>{g.grade}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Class Overview */}
            {classStats.length > 0 && (
              <div className="da" style={{ animationDelay: '.38s', background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', boxShadow: '0 1px 4px rgba(109,40,217,0.07)', overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>🏫</span>
                    <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Class Overview</h3>
                  </div>
                  <Link to={ROUTES.ADMIN_CLASSES} style={{ fontSize: 12, fontWeight: 600, color: '#6d28d9', textDecoration: 'none' }}>Manage →</Link>
                </div>
                <div style={{ padding: '4px 0' }}>
                  {classStats.map((cls, i) => {
                    const g = cls.avg_score != null ? getGradeInfo(cls.avg_score) : null
                    const pct = cls.student_count > 0 ? Math.round((cls.reports_done / cls.student_count) * 100) : 0
                    return (
                      <div key={cls.id}
                        style={{ padding: '11px 20px', borderBottom: i < classStats.length - 1 ? '1px solid #faf5ff' : 'none', display: 'flex', alignItems: 'center', gap: 12, transition: 'background .15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#faf5ff')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <div style={{ width: 34, height: 34, borderRadius: 9, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>🏫</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{cls.name}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 11, color: '#9ca3af' }}>{cls.student_count} students</span>
                              {g && <span style={{ fontSize: 11, fontWeight: 800, color: g.color, background: g.color + '15', padding: '1px 7px', borderRadius: 99 }}>{cls.avg_score!.toFixed(1)}% · {g.grade}</span>}
                            </div>
                          </div>
                          <div style={{ height: 4, background: '#f0eefe', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? 'linear-gradient(90deg,#16a34a,#22c55e)' : 'linear-gradient(90deg,#7c3aed,#a78bfa)', borderRadius: 99, transition: 'width 1.2s ease' }} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                            <span style={{ fontSize: 10, color: '#9ca3af' }}>Reports: {cls.reports_done}/{cls.student_count}</span>
                            <span style={{ fontSize: 10, fontWeight: 700, color: pct === 100 ? '#16a34a' : '#6d28d9' }}>{pct}%</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Recent Activity */}
            {recentActivities.length > 0 && (
              <div className="da" style={{ animationDelay: '.44s', background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', boxShadow: '0 1px 4px rgba(109,40,217,0.07)', overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #faf5ff', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>⚡</span>
                  <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Recent Activity</h3>
                </div>
                <div>
                  {recentActivities.map((a, i) => (
                    <div key={i} className="act-row"
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px', borderBottom: i < recentActivities.length - 1 ? '1px solid #faf5ff' : 'none', transition: 'background .12s' }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: a.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>{a.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.label}</p>
                        <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>{a.sub} · {timeAgo(a.time)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Teacher Messages */}
            <div id="messages" className="da" style={{ animationDelay: '.5s', background: '#fff', borderRadius: 16, border: `1.5px solid ${stats?.unreadMessages ? '#ddd6fe' : '#f0eefe'}`, boxShadow: stats?.unreadMessages ? '0 0 0 3px rgba(109,40,217,0.07)' : '0 1px 4px rgba(109,40,217,0.07)', overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>💬</span>
                  <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Teacher Messages</h3>
                  {(stats?.unreadMessages ?? 0) > 0 && <span style={{ background: '#6d28d9', color: '#fff', borderRadius: 99, padding: '1px 8px', fontSize: 11, fontWeight: 800, animation: '_pulse 1.5s infinite' }}>{stats!.unreadMessages} new</span>}
                </div>
              </div>
              {messages.length === 0 ? (
                <div style={{ padding: '28px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>📭</div>
                  <p style={{ fontSize: 12, color: '#9ca3af' }}>No messages yet.</p>
                </div>
              ) : (
                <div>
                  {messages.map((msg, i) => {
                    const ps = priorityStyle[msg.priority] ?? priorityStyle.normal
                    return (
                      <div key={msg.id} className="msg-item"
                        onClick={() => { setActiveMsg(msg); if (!msg.is_read) markRead(msg.id) }}
                        style={{ padding: '12px 20px', borderBottom: i < messages.length - 1 ? '1px solid #faf5ff' : 'none', cursor: 'pointer', transition: 'background .15s', background: msg.is_read ? 'transparent' : '#faf5ff', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        {!msg.is_read && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#6d28d9', marginTop: 5, flexShrink: 0, animation: '_pulse 1.5s infinite' }} />}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                            <span style={{ fontSize: 12, fontWeight: msg.is_read ? 500 : 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.subject}</span>
                            <span style={{ fontSize: 10, fontWeight: 800, padding: '1px 7px', borderRadius: 99, background: ps.bg, color: ps.color, flexShrink: 0 }}>{ps.label}</span>
                          </div>
                          <p style={{ fontSize: 11, color: '#6b7280', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.body}</p>
                          <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0' }}>{msg.from_user?.full_name ?? 'Teacher'} · {timeAgo(msg.created_at)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Term card */}
            <div className="da" style={{ animationDelay: '.28s', background: 'linear-gradient(145deg,#2e1065,#4c1d95,#5b21b6)', borderRadius: 18, padding: '20px', color: '#fff', overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 15 }}>📆</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Current Term</span>
                </div>
                {term && year ? (
                  <>
                    <p style={{ fontFamily: '"Playfair Display",serif', fontSize: 20, fontWeight: 700, margin: '0 0 12px' }}>{(term as any).name}</p>
                    {[
                      { label: 'Academic Year', value: year.name },
                      { label: 'Started', value: (term as any).start_date ? formatDate((term as any).start_date) : '—' },
                      { label: 'Ends', value: (term as any).end_date ? formatDate((term as any).end_date) : '—' },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{label}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{value}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: 12, padding: '5px 12px', background: (term as any).is_locked ? 'rgba(220,38,38,0.25)' : 'rgba(22,163,74,0.25)', borderRadius: 99, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11 }}>{(term as any).is_locked ? '🔒' : '🟢'}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: (term as any).is_locked ? '#fca5a5' : '#86efac' }}>{(term as any).is_locked ? 'Locked' : 'Open for scores'}</span>
                    </div>
                  </>
                ) : <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>No active term set.</p>}
                <Link to={ROUTES.ADMIN_TERMS} style={{ display: 'block', marginTop: 14, textAlign: 'center', padding: '8px', borderRadius: 10, background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>Manage Terms →</Link>
              </div>
            </div>

            {/* Recent Announcements */}
            <div className="da" style={{ animationDelay: '.33s', background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', padding: '18px', boxShadow: '0 1px 4px rgba(109,40,217,0.07)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>📢</span>
                  <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>Announcements</h3>
                </div>
                <Link to={ROUTES.ADMIN_ANNOUNCEMENTS} style={{ fontSize: 11, fontWeight: 600, color: '#6d28d9', textDecoration: 'none' }}>New +</Link>
              </div>
              {announcements.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <p style={{ fontSize: 12, color: '#9ca3af' }}>No announcements yet.</p>
                  <Link to={ROUTES.ADMIN_ANNOUNCEMENTS} style={{ fontSize: 12, color: '#6d28d9', fontWeight: 600, textDecoration: 'none' }}>Post your first →</Link>
                </div>
              ) : announcements.map((a: any, i: number) => (
                <div key={a.id} style={{ paddingBottom: i < announcements.length - 1 ? 12 : 0, marginBottom: i < announcements.length - 1 ? 12 : 0, borderBottom: i < announcements.length - 1 ? '1px solid #f5f3ff' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    {a.is_pinned && <span style={{ fontSize: 10 }}>📌</span>}
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{a.title}</span>
                  </div>
                  <p style={{ fontSize: 11, color: '#6b7280', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.body}</p>
                  <span style={{ fontSize: 10, color: '#9ca3af' }}>{timeAgo(a.created_at)}</span>
                </div>
              ))}
            </div>

            {/* Reports Progress */}
            <div className="da" style={{ animationDelay: '.38s', background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', padding: '18px', boxShadow: '0 1px 4px rgba(109,40,217,0.07)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span>📊</span>
                <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>Reports Progress</h3>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: '#6b7280' }}>Generated</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#6d28d9' }}>{stats?.reportsGenerated ?? 0} / {stats?.totalStudentsForReports ?? 0}</span>
              </div>
              <div style={{ height: 8, background: '#f0eefe', borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
                <div style={{ height: '100%', width: `${reportPct}%`, background: reportPct === 100 ? 'linear-gradient(90deg,#16a34a,#22c55e)' : 'linear-gradient(90deg,#7c3aed,#a78bfa)', borderRadius: 99, transition: 'width 1.2s ease' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: '#9ca3af' }}>{reportsRemaining > 0 ? `${reportsRemaining} remaining` : 'All reports done! ✓'}</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: reportPct === 100 ? '#16a34a' : '#6d28d9' }}>{reportPct}%</span>
              </div>
            </div>

            {/* Quick Actions — ALL features */}
            <div className="da" style={{ animationDelay: '.43s', background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', padding: '18px', boxShadow: '0 1px 4px rgba(109,40,217,0.07)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 13 }}>
                <span>⚡</span>
                <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>Quick Actions</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {[
                  { icon: '👤', label: 'Add Student', to: ROUTES.ADMIN_STUDENTS },
                  { icon: '👨‍🏫', label: 'Add Teacher', to: ROUTES.ADMIN_TEACHERS },
                  { icon: '🏫', label: 'Classes', to: ROUTES.ADMIN_CLASSES },
                  { icon: '📚', label: 'Subjects', to: ROUTES.ADMIN_SUBJECTS },
                  { icon: '🏛️', label: 'Departments', to: ROUTES.ADMIN_DEPARTMENTS },
                  { icon: '📢', label: 'Announce', to: ROUTES.ADMIN_ANNOUNCEMENTS },
                  { icon: '📅', label: 'Timetable', to: ROUTES.ADMIN_TIMETABLE },
                  { icon: '🗓️', label: 'Attendance', to: ROUTES.ADMIN_ATTENDANCE },
                  { icon: '📖', label: 'Syllabus', to: ROUTES.ADMIN_SYLLABUS },
                  { icon: '🎯', label: 'Weekly Goals', to: ROUTES.ADMIN_WEEKLY_GOALS },
                  { icon: '📊', label: 'Analytics', to: ROUTES.ADMIN_ANALYTICS },
                  { icon: '⚙️', label: 'Settings', to: ROUTES.ADMIN_SETTINGS },
                ].map(({ icon, label, to }) => (
                  <Link key={label} to={to} className="qb"
                    style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 10px', borderRadius: 9, background: '#faf5ff', textDecoration: 'none', transition: 'all .15s' }}>
                    <span style={{ fontSize: 14 }}>{icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>{label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Message modal */}
        {activeMsg && (
          <div onClick={() => setActiveMsg(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(17,24,39,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 500, boxShadow: '0 24px 64px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg,#faf5ff,#f5f3ff)' }}>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0, fontFamily: '"Playfair Display",serif' }}>{activeMsg.subject}</p>
                  <p style={{ fontSize: 12, color: '#6b7280', margin: '3px 0 0' }}>From: {activeMsg.from_user?.full_name ?? 'Teacher'} · {timeAgo(activeMsg.created_at)}</p>
                </div>
                <button onClick={() => setActiveMsg(null)} style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: '#ede9fe', cursor: 'pointer', fontSize: 13, color: '#6d28d9', fontWeight: 700 }}>✕</button>
              </div>
              <div style={{ padding: '18px 20px' }}>
                <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, margin: 0 }}>{activeMsg.body}</p>
              </div>
              <div style={{ padding: '12px 20px', borderTop: '1px solid #f5f3ff', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setActiveMsg(null)} style={{ padding: '8px 18px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}