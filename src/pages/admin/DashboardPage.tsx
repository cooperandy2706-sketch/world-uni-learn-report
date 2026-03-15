// src/pages/admin/DashboardPage.tsx
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useCurrentTerm, useCurrentAcademicYear } from '../../hooks/useSettings'
import { getGradeInfo } from '../../utils/grading'
import { formatDate, ordinal } from '../../lib/utils'
import { ROUTES } from '../../constants/routes'

// ─── types ────────────────────────────────────────────────
interface Stats {
  students: number; teachers: number; classes: number
  subjects: number; reportsGenerated: number; totalStudentsForReports: number
  pendingScores: number; unreadMessages: number
}
interface TopStudent {
  student_id: string; full_name: string; class_name: string
  average_score: number; overall_position: number; total_students: number
}
interface Message {
  id: string; subject: string; body: string
  priority: string; created_at: string; is_read: boolean
  from_user?: { full_name: string }
}
interface ClassStat {
  id: string; name: string; student_count: number
  avg_score: number | null; reports_done: number
}

// ─── helpers ──────────────────────────────────────────────
function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const priorityStyle: Record<string, { bg: string; color: string; label: string }> = {
  urgent: { bg: '#fef2f2', color: '#dc2626', label: 'URGENT' },
  high:   { bg: '#fff7ed', color: '#ea580c', label: 'HIGH' },
  normal: { bg: '#f5f3ff', color: '#6d28d9', label: 'MSG' },
  low:    { bg: '#f0fdf4', color: '#16a34a', label: 'INFO' },
}

// ─── animated counter ─────────────────────────────────────
function AnimNum({ to, duration = 900 }: { to: number; duration?: number }) {
  const [val, setVal] = useState(0)
  const ref = useRef(false)
  useEffect(() => {
    if (ref.current) return
    ref.current = true
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(ease * to))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [to, duration])
  return <>{val.toLocaleString()}</>
}

// ─── stat card ────────────────────────────────────────────
function StatCard({ icon, label, value, color, bg, link, pulse }: {
  icon: string; label: string; value: number
  color: string; bg: string; link: string; pulse?: boolean
}) {
  const [hov, setHov] = useState(false)
  return (
    <Link to={link} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          background: '#fff', borderRadius: 16, padding: '18px 20px',
          border: `1.5px solid ${hov ? color + '40' : '#f0eefe'}`,
          boxShadow: hov ? `0 8px 28px ${color}18` : '0 1px 4px rgba(109,40,217,0.07)',
          transition: 'all 0.25s cubic-bezier(.4,0,.2,1)',
          transform: hov ? 'translateY(-3px)' : 'translateY(0)',
          cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, background: bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, transition: 'transform 0.25s',
            transform: hov ? 'scale(1.12) rotate(-4deg)' : 'scale(1)',
            position: 'relative',
          }}>
            {icon}
            {pulse && (
              <span style={{
                position: 'absolute', top: -3, right: -3,
                width: 10, height: 10, borderRadius: '50%',
                background: color, border: '2px solid #fff',
                animation: '_pulse 1.5s infinite',
              }} />
            )}
          </div>
          <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>→</span>
        </div>
        <div>
          <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 28, fontWeight: 700, color: '#111827', lineHeight: 1 }}>
            <AnimNum to={value} />
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 500, marginTop: 3 }}>{label}</div>
        </div>
      </div>
    </Link>
  )
}

// ═══════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════
export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: term } = useCurrentTerm()
  const { data: year } = useCurrentAcademicYear()

  const [stats, setStats] = useState<Stats | null>(null)
  const [topStudents, setTopStudents] = useState<TopStudent[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [classStats, setClassStats] = useState<ClassStat[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [activeMsg, setActiveMsg] = useState<Message | null>(null)

  useEffect(() => {
    setTimeout(() => setMounted(true), 60)
  }, [])

  useEffect(() => {
    if (!user?.school_id) return
    loadAll()

    // Realtime subscription for new messages
    const channel = supabase
      .channel('dashboard-messages')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `school_id=eq.${user.school_id}`,
      }, () => loadMessages())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user?.school_id, term?.id])

  async function loadAll() {
    setLoading(true)
    await Promise.all([loadStats(), loadTopStudents(), loadMessages(), loadClassStats()])
    setLoading(false)
  }

  async function loadStats() {
    const sid = user!.school_id
    const [
      { count: students }, { count: teachers }, { count: classes },
      { count: subjects }, { count: msgs },
    ] = await Promise.all([
      supabase.from('students').select('*', { count: 'exact', head: true }).eq('school_id', sid).eq('is_active', true),
      supabase.from('teachers').select('*', { count: 'exact', head: true }).eq('school_id', sid),
      supabase.from('classes').select('*', { count: 'exact', head: true }).eq('school_id', sid),
      supabase.from('subjects').select('*', { count: 'exact', head: true }).eq('school_id', sid),
      supabase.from('messages').select('*', { count: 'exact', head: true }).eq('school_id', sid).eq('is_read', false),
    ])

    let reports = 0, totalForReports = students ?? 0, pendingScores = 0
    if (term?.id) {
      const [{ count: r }, { count: p }] = await Promise.all([
        supabase.from('report_cards').select('*', { count: 'exact', head: true }).eq('term_id', term.id),
        supabase.from('scores').select('*', { count: 'exact', head: true }).eq('term_id', term.id).eq('is_submitted', false),
      ])
      reports = r ?? 0
      pendingScores = p ?? 0
    }

    setStats({
      students: students ?? 0, teachers: teachers ?? 0, classes: classes ?? 0,
      subjects: subjects ?? 0, reportsGenerated: reports,
      totalStudentsForReports: totalForReports,
      pendingScores, unreadMessages: msgs ?? 0,
    })
  }

  async function loadTopStudents() {
    if (!term?.id) return
    const { data } = await supabase
      .from('report_cards')
      .select('student_id, average_score, overall_position, total_students, student:students(full_name, class:classes(name))')
      .eq('term_id', term.id)
      .order('average_score', { ascending: false })
      .limit(6)
    if (data) {
      setTopStudents(data.map((r: any) => ({
        student_id: r.student_id,
        full_name: r.student?.full_name ?? '—',
        class_name: r.student?.class?.name ?? '—',
        average_score: r.average_score ?? 0,
        overall_position: r.overall_position ?? 0,
        total_students: r.total_students ?? 0,
      })))
    }
  }

  async function loadMessages() {
    const { data } = await supabase
      .from('messages')
      .select('*, from_user:users(full_name)')
      .eq('school_id', user!.school_id)
      .order('created_at', { ascending: false })
      .limit(8)
    setMessages(data ?? [])
  }

  async function loadClassStats() {
    const { data: classes } = await supabase
      .from('classes').select('id, name').eq('school_id', user!.school_id)
    if (!classes) return

    const results: ClassStat[] = await Promise.all(
      classes.map(async (cls) => {
        const { count: sc } = await supabase
          .from('students').select('*', { count: 'exact', head: true })
          .eq('class_id', cls.id).eq('is_active', true)
        let avg = null, done = 0
        if (term?.id) {
          const { data: rpts } = await supabase
            .from('report_cards')
            .select('average_score')
            .eq('class_id', cls.id).eq('term_id', term.id)
          if (rpts?.length) {
            avg = rpts.reduce((s, r) => s + (r.average_score ?? 0), 0) / rpts.length
            done = rpts.length
          }
        }
        return { id: cls.id, name: cls.name, student_count: sc ?? 0, avg_score: avg, reports_done: done }
      })
    )
    setClassStats(results)
  }

  async function markRead(id: string) {
    await supabase.from('messages').update({ is_read: true }).eq('id', id)
    setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m))
    setStats(prev => prev ? { ...prev, unreadMessages: Math.max(0, prev.unreadMessages - 1) } : prev)
  }

  // ── loading ──────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
      <style>{`@keyframes _spin { to{transform:rotate(360deg)} }`}</style>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #ede9fe', borderTopColor: '#6d28d9', animation: '_spin 0.8s linear infinite' }} />
      <p style={{ fontSize: 13, color: '#6b7280', fontFamily: '"DM Sans",sans-serif' }}>Loading dashboard…</p>
    </div>
  )

  const reportsRemaining = (stats?.totalStudentsForReports ?? 0) - (stats?.reportsGenerated ?? 0)
  const reportPct = stats?.totalStudentsForReports
    ? Math.round((stats.reportsGenerated / stats.totalStudentsForReports) * 100)
    : 0

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.85)} }
        @keyframes _fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes _slideIn { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
        @keyframes _glow { 0%,100%{box-shadow:0 0 0 0 rgba(109,40,217,0.25)} 50%{box-shadow:0 0 0 6px rgba(109,40,217,0)} }
        .dash-row { display:grid; gap:20px; }
        .dash-animate { animation: _fadeUp 0.5s cubic-bezier(.4,0,.2,1) both; }
        .msg-item:hover { background:#faf5ff !important; }
        .quick-btn:hover { background:#f5f3ff !important; transform:translateX(3px); }
      `}</style>

      <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif', opacity: mounted ? 1 : 0, transition: 'opacity 0.4s ease' }}>

        {/* ── Page header ── */}
        <div className="dash-animate" style={{ animationDelay: '0s', marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 28, fontWeight: 700, color: '#111827', margin: 0 }}>
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.full_name?.split(' ')[0]} 👋
            </h1>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
              {year?.name} · {term?.name ?? 'No active term'} · {new Date().toLocaleDateString('en-GH', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link to={ROUTES.ADMIN_REPORTS} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
              background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
              color: '#fff', textDecoration: 'none',
              boxShadow: '0 2px 10px rgba(109,40,217,0.3)',
            }}>📄 Generate Reports</Link>
            <Link to={ROUTES.ADMIN_ANALYTICS} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
              background: '#fff', color: '#374151', textDecoration: 'none',
              border: '1.5px solid #e5e7eb',
            }}>📊 Analytics</Link>
          </div>
        </div>

        {/* ── Term locked banner ── */}
        {(term as any)?.is_locked && (
          <div className="dash-animate" style={{
            animationDelay: '0.05s', marginBottom: 20,
            background: 'linear-gradient(135deg,#fef2f2,#fff5f5)',
            border: '1.5px solid #fecaca', borderRadius: 14,
            padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 20 }}>🔒</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#dc2626' }}>{(term as any).name} is LOCKED</p>
              <p style={{ fontSize: 12, color: '#ef4444' }}>Teachers cannot submit scores. Unlock in Terms settings.</p>
            </div>
            <Link to={ROUTES.ADMIN_TERMS} style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', textDecoration: 'none', background: '#fee2e2', padding: '5px 12px', borderRadius: 99 }}>
              Manage →
            </Link>
          </div>
        )}

        {/* ── Alert banners ── */}
        {stats && stats.unreadMessages > 0 && (
          <div className="dash-animate" style={{
            animationDelay: '0.1s', marginBottom: 12,
            background: 'linear-gradient(135deg,#fdf4ff,#f5f3ff)',
            border: '1.5px solid #ddd6fe', borderRadius: 14,
            padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12,
            animation: '_glow 2s infinite',
          }}>
            <span style={{ fontSize: 22 }}>💬</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#6d28d9' }}>
                {stats.unreadMessages} unread message{stats.unreadMessages > 1 ? 's' : ''} from teachers
              </p>
              <p style={{ fontSize: 12, color: '#7c3aed' }}>Click to view messages below ↓</p>
            </div>
            <span style={{
              background: '#6d28d9', color: '#fff', borderRadius: 99,
              padding: '3px 10px', fontSize: 12, fontWeight: 800,
              animation: '_pulse 1.5s infinite',
            }}>{stats.unreadMessages}</span>
          </div>
        )}

        {stats && reportsRemaining > 0 && term?.id && (
          <div className="dash-animate" style={{
            animationDelay: '0.15s', marginBottom: 20,
            background: 'linear-gradient(135deg,#fffbeb,#fef3c7)',
            border: '1.5px solid #fde68a', borderRadius: 14,
            padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 22 }}>📋</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>
                {reportsRemaining} report{reportsRemaining > 1 ? 's' : ''} remaining — {stats.reportsGenerated} of {stats.totalStudentsForReports} generated
              </p>
              <div style={{ marginTop: 6, height: 6, background: '#fde68a', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${reportPct}%`, background: 'linear-gradient(90deg,#f59e0b,#fbbf24)', borderRadius: 99, transition: 'width 1s ease' }} />
              </div>
            </div>
            <Link to={ROUTES.ADMIN_REPORTS} style={{ fontSize: 12, fontWeight: 700, color: '#92400e', textDecoration: 'none', background: '#fde68a', padding: '5px 12px', borderRadius: 99 }}>
              Generate →
            </Link>
          </div>
        )}

        {/* ── Stat cards ── */}
        <div className="dash-animate" style={{
          animationDelay: '0.2s',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 16, marginBottom: 24,
        }}>
          <StatCard icon="👥" label="Total Students" value={stats?.students ?? 0} color="#6d28d9" bg="#f5f3ff" link={ROUTES.ADMIN_STUDENTS} />
          <StatCard icon="👨‍🏫" label="Teachers" value={stats?.teachers ?? 0} color="#0891b2" bg="#ecfeff" link={ROUTES.ADMIN_TEACHERS} />
          <StatCard icon="🏫" label="Classes" value={stats?.classes ?? 0} color="#16a34a" bg="#f0fdf4" link={ROUTES.ADMIN_CLASSES} />
          <StatCard icon="📚" label="Subjects" value={stats?.subjects ?? 0} color="#d97706" bg="#fffbeb" link={ROUTES.ADMIN_SUBJECTS} />
          <StatCard icon="📄" label="Reports Done" value={stats?.reportsGenerated ?? 0} color="#7c3aed" bg="#f5f3ff" link={ROUTES.ADMIN_REPORTS} />
          <StatCard icon="⏳" label="Pending Scores" value={stats?.pendingScores ?? 0} color="#dc2626" bg="#fef2f2" link={ROUTES.ADMIN_REPORTS} pulse={(stats?.pendingScores ?? 0) > 0} />
          <StatCard icon="💬" label="Unread Messages" value={stats?.unreadMessages ?? 0} color="#6d28d9" bg="#f5f3ff" link="#messages" pulse={(stats?.unreadMessages ?? 0) > 0} />
        </div>

        {/* ── Main grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>

          {/* ── LEFT COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Top Students */}
            <div className="dash-animate" style={{ animationDelay: '0.3s', background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', boxShadow: '0 1px 4px rgba(109,40,217,0.07)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>🏆</span>
                  <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>Top Students</h3>
                  {term && <span style={{ fontSize: 11, fontWeight: 700, background: '#f5f3ff', color: '#6d28d9', padding: '2px 8px', borderRadius: 99 }}>{(term as any).name}</span>}
                </div>
                <Link to={ROUTES.ADMIN_REPORTS} style={{ fontSize: 12, fontWeight: 600, color: '#6d28d9', textDecoration: 'none' }}>View all →</Link>
              </div>
              {topStudents.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>📊</div>
                  <p style={{ fontSize: 13, color: '#9ca3af' }}>No reports generated yet for this term.</p>
                  <Link to={ROUTES.ADMIN_REPORTS} style={{ display: 'inline-flex', marginTop: 12, padding: '8px 18px', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', borderRadius: 9, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>Generate Reports</Link>
                </div>
              ) : (
                <div>
                  {topStudents.map((s, i) => {
                    const g = getGradeInfo(s.average_score)
                    const medals = ['🥇', '🥈', '🥉']
                    return (
                      <div key={s.student_id} style={{
                        display: 'flex', alignItems: 'center', gap: 14, padding: '13px 20px',
                        borderBottom: i < topStudents.length - 1 ? '1px solid #faf5ff' : 'none',
                        transition: 'background 0.15s', cursor: 'default',
                        animation: `_slideIn 0.4s cubic-bezier(.4,0,.2,1) ${0.35 + i * 0.07}s both`,
                      }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#faf5ff')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: i < 3 ? 18 : 12, fontWeight: 800, background: i < 3 ? 'transparent' : '#f5f3ff', color: '#6d28d9', flexShrink: 0 }}>
                          {i < 3 ? medals[i] : `#${i + 1}`}
                        </div>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                          {s.full_name.charAt(0)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{s.full_name}</p>
                          <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>{s.class_name}</p>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <p style={{ fontSize: 15, fontWeight: 800, color: g.color, margin: 0 }}>{s.average_score.toFixed(1)}%</p>
                          <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>{ordinal(s.overall_position)} / {s.total_students}</p>
                        </div>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: g.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: g.color, flexShrink: 0 }}>
                          {g.grade}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Class Overview */}
            {classStats.length > 0 && (
              <div className="dash-animate" style={{ animationDelay: '0.4s', background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', boxShadow: '0 1px 4px rgba(109,40,217,0.07)', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #faf5ff', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>🏫</span>
                  <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>Class Overview</h3>
                </div>
                <div style={{ padding: '4px 0' }}>
                  {classStats.map((cls, i) => {
                    const g = cls.avg_score != null ? getGradeInfo(cls.avg_score) : null
                    const pct = cls.student_count > 0 ? Math.round((cls.reports_done / cls.student_count) * 100) : 0
                    return (
                      <div key={cls.id}
                        style={{ padding: '12px 20px', borderBottom: i < classStats.length - 1 ? '1px solid #faf5ff' : 'none', display: 'flex', alignItems: 'center', gap: 14, transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#faf5ff')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🏫</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{cls.name}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 11, color: '#9ca3af' }}>{cls.student_count} students</span>
                              {g && <span style={{ fontSize: 11, fontWeight: 800, color: g.color, background: g.color + '15', padding: '1px 7px', borderRadius: 99 }}>{cls.avg_score!.toFixed(1)}% · {g.grade}</span>}
                            </div>
                          </div>
                          <div style={{ height: 5, background: '#f0eefe', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#7c3aed,#a78bfa)', borderRadius: 99, transition: 'width 1.2s cubic-bezier(.4,0,.2,1)' }} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
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

            {/* Messages from Teachers */}
            <div id="messages" className="dash-animate" style={{ animationDelay: '0.5s', background: '#fff', borderRadius: 16, border: `1.5px solid ${stats?.unreadMessages ? '#ddd6fe' : '#f0eefe'}`, boxShadow: stats?.unreadMessages ? '0 0 0 3px rgba(109,40,217,0.08)' : '0 1px 4px rgba(109,40,217,0.07)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>💬</span>
                  <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>Teacher Messages</h3>
                  {(stats?.unreadMessages ?? 0) > 0 && (
                    <span style={{ background: '#6d28d9', color: '#fff', borderRadius: 99, padding: '1px 8px', fontSize: 11, fontWeight: 800, animation: '_pulse 1.5s infinite' }}>
                      {stats!.unreadMessages} new
                    </span>
                  )}
                </div>
              </div>
              {messages.length === 0 ? (
                <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 6 }}>📭</div>
                  <p style={{ fontSize: 13, color: '#9ca3af' }}>No messages yet.</p>
                </div>
              ) : (
                <div>
                  {messages.map((msg, i) => {
                    const ps = priorityStyle[msg.priority] ?? priorityStyle.normal
                    return (
                      <div
                        key={msg.id}
                        className="msg-item"
                        onClick={() => { setActiveMsg(msg); if (!msg.is_read) markRead(msg.id) }}
                        style={{
                          padding: '13px 20px', borderBottom: i < messages.length - 1 ? '1px solid #faf5ff' : 'none',
                          cursor: 'pointer', transition: 'background 0.15s',
                          background: msg.is_read ? 'transparent' : '#faf5ff',
                          display: 'flex', alignItems: 'flex-start', gap: 12,
                          animation: `_fadeUp 0.4s cubic-bezier(.4,0,.2,1) ${0.5 + i * 0.06}s both`,
                        }}
                      >
                        {!msg.is_read && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#6d28d9', marginTop: 6, flexShrink: 0, animation: '_pulse 1.5s infinite' }} />}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                            <span style={{ fontSize: 13, fontWeight: msg.is_read ? 500 : 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.subject}</span>
                            <span style={{ fontSize: 10, fontWeight: 800, padding: '1px 7px', borderRadius: 99, background: ps.bg, color: ps.color, flexShrink: 0 }}>{ps.label}</span>
                          </div>
                          <p style={{ fontSize: 12, color: '#6b7280', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.body}</p>
                          <p style={{ fontSize: 11, color: '#9ca3af', margin: '3px 0 0' }}>{msg.from_user?.full_name ?? 'Teacher'} · {timeAgo(msg.created_at)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Current Term */}
            <div className="dash-animate" style={{ animationDelay: '0.3s', background: 'linear-gradient(145deg,#2e1065,#4c1d95,#5b21b6)', borderRadius: 16, padding: '20px', color: '#fff', overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
              <div style={{ position: 'absolute', bottom: -30, left: -10, width: 120, height: 120, borderRadius: '50%', background: 'rgba(245,158,11,0.08)' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <span style={{ fontSize: 16 }}>📆</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Current Term</span>
                </div>
                {term && year ? (
                  <>
                    <p style={{ fontFamily: '"Playfair Display",serif', fontSize: 22, fontWeight: 700, margin: '0 0 14px' }}>{(term as any).name}</p>
                    {[
                      { label: 'Academic Year', value: year.name },
                      { label: 'Started', value: (term as any).start_date ? formatDate((term as any).start_date) : '—' },
                      { label: 'Ends', value: (term as any).end_date ? formatDate((term as any).end_date) : '—' },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{label}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{value}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: 14, padding: '6px 12px', background: (term as any).is_locked ? 'rgba(220,38,38,0.2)' : 'rgba(22,163,74,0.2)', borderRadius: 99, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12 }}>{(term as any).is_locked ? '🔒' : '🟢'}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: (term as any).is_locked ? '#fca5a5' : '#86efac' }}>{(term as any).is_locked ? 'Locked' : 'Open for scores'}</span>
                    </div>
                  </>
                ) : (
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>No active term set.</p>
                )}
                <Link to={ROUTES.ADMIN_TERMS} style={{ display: 'block', marginTop: 16, textAlign: 'center', padding: '9px', borderRadius: 10, background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: 12, fontWeight: 600, textDecoration: 'none', transition: 'background 0.2s' }}>
                  Manage Terms →
                </Link>
              </div>
            </div>

            {/* Reports Progress */}
            <div className="dash-animate" style={{ animationDelay: '0.35s', background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', padding: '18px', boxShadow: '0 1px 4px rgba(109,40,217,0.07)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 16 }}>📊</span>
                <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Reports Progress</h3>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: '#6b7280' }}>Generated</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#6d28d9' }}>{stats?.reportsGenerated ?? 0} / {stats?.totalStudentsForReports ?? 0}</span>
              </div>
              <div style={{ height: 10, background: '#f0eefe', borderRadius: 99, overflow: 'hidden', marginBottom: 8 }}>
                <div style={{ height: '100%', width: `${reportPct}%`, background: 'linear-gradient(90deg,#7c3aed,#a78bfa)', borderRadius: 99, transition: 'width 1.2s cubic-bezier(.4,0,.2,1)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: '#9ca3af' }}>{reportsRemaining > 0 ? `${reportsRemaining} remaining` : 'All reports generated ✓'}</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: reportPct === 100 ? '#16a34a' : '#6d28d9' }}>{reportPct}%</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="dash-animate" style={{ animationDelay: '0.4s', background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', padding: '18px', boxShadow: '0 1px 4px rgba(109,40,217,0.07)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 16 }}>⚡</span>
                <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Quick Actions</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { icon: '👤', label: 'Add Student',       to: ROUTES.ADMIN_STUDENTS },
                  { icon: '👨‍🏫', label: 'Add Teacher',       to: ROUTES.ADMIN_TEACHERS },
                  { icon: '🏫', label: 'Add Class',         to: ROUTES.ADMIN_CLASSES },
                  { icon: '📚', label: 'Add Subject',       to: ROUTES.ADMIN_SUBJECTS },
                  { icon: '📄', label: 'Generate Reports',  to: ROUTES.ADMIN_REPORTS },
                  { icon: '⚙️', label: 'School Settings',   to: ROUTES.ADMIN_SETTINGS },
                ].map(({ icon, label, to }) => (
                  <Link key={label} to={to}
                    className="quick-btn"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 12px', borderRadius: 10,
                      background: '#faf5ff', textDecoration: 'none',
                      transition: 'all 0.15s', cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: 15 }}>{icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#374151', flex: 1 }}>{label}</span>
                    <span style={{ fontSize: 14, color: '#a78bfa' }}>→</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Message modal ── */}
        {activeMsg && (
          <div
            onClick={() => setActiveMsg(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(17,24,39,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, animation: '_fadeUp 0.15s ease' }}
          >
            <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 520, boxShadow: '0 24px 64px rgba(0,0,0,0.18)', overflow: 'hidden', animation: '_fadeUp 0.2s ease' }}>
              <div style={{ padding: '18px 22px', borderBottom: '1px solid #f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg,#faf5ff,#f5f3ff)' }}>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0, fontFamily: '"Playfair Display",serif' }}>{activeMsg.subject}</p>
                  <p style={{ fontSize: 12, color: '#6b7280', margin: '3px 0 0' }}>From: {activeMsg.from_user?.full_name ?? 'Teacher'} · {timeAgo(activeMsg.created_at)}</p>
                </div>
                <button onClick={() => setActiveMsg(null)} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: '#ede9fe', cursor: 'pointer', fontSize: 14, color: '#6d28d9', fontWeight: 700 }}>✕</button>
              </div>
              <div style={{ padding: '20px 22px' }}>
                <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, margin: 0 }}>{activeMsg.body}</p>
              </div>
              <div style={{ padding: '12px 22px', borderTop: '1px solid #f5f3ff', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setActiveMsg(null)} style={{ padding: '8px 20px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}