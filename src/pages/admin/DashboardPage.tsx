import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { useAuth } from '../../hooks/useAuth'
import { useCurrentTerm, useCurrentAcademicYear } from '../../hooks/useSettings'
import { getGradeInfo } from '../../utils/grading'
import { formatDate, ordinal } from '../../lib/utils'
import { ROUTES } from '../../constants/routes'
import { feeStructuresService, feePaymentsService } from '../../services/bursar.service'
import FlaskLoader from '../../components/ui/FlaskLoader'

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
        style={{ 
          background: '#fff', borderRadius: 20, padding: '20px', 
          border: '1px solid #e5e7eb', 
          boxShadow: hov ? `0 12px 24px -8px ${color}30` : '0 4px 6px -1px rgba(0,0,0,0.05)', 
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
          transform: hov ? 'translateY(-4px)' : 'none', 
          cursor: 'pointer', position: 'relative', overflow: 'hidden' 
        }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, transition: 'transform 0.3s', transform: hov ? 'scale(1.1) rotate(-5deg)' : 'none', position: 'relative' }}>
            {icon}
            {pulse && <span style={{ position: 'absolute', top: -4, right: -4, width: 12, height: 12, borderRadius: '50%', background: color, border: '2px solid #fff', animation: '_pulse 1.5s infinite' }} />}
          </div>
          <span style={{ fontSize: 16, color: '#d1d5db', fontWeight: 600, transition: 'all 0.3s', transform: hov ? 'translateX(4px)' : 'none' }}>→</span>
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#111827', lineHeight: 1, letterSpacing: '-0.03em' }}><AnimNum to={value} /></div>
        <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 600, marginTop: 6 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: color, fontWeight: 700, marginTop: 4 }}>{sub}</div>}
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
  const userSchool = user?.school as any
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
  const [financeData, setFinanceData] = useState<{ month: string, amount: number }[]>([])
  const [activeMsg, setActiveMsg] = useState<Message | null>(null)

  useEffect(() => { setTimeout(() => setMounted(true), 60) }, [])

  useEffect(() => {
    if (!user?.school_id) {
      setFirstLoadComplete(true)
      return
    }
    loadAll()

    // Real-time listeners
    const channel = supabase.channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `school_id=eq.${user.school_id}` }, () => loadMessages())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fee_payments', filter: `school_id=eq.${user.school_id}` }, () => {
        loadStats()
        loadFinancePerformance()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'report_cards', filter: `school_id=eq.${user.school_id}` }, () => {
        loadStats()
        loadTopStudents()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scores', filter: `school_id=eq.${user.school_id}` }, () => {
        loadTopStudents()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students', filter: `school_id=eq.${user.school_id}` }, () => {
        loadStats()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user?.school_id, term?.id])

  async function loadAll() {
    try {
      await Promise.all([
        loadStats(), 
        loadTopStudents(), 
        loadMessages(), 
        loadClassStats(), 
        loadRecentActivity(), 
        loadAnnouncements(),
        loadFinancePerformance()
      ])
    } finally {
      setLoading(false)
      setFirstLoadComplete(true)
    }
  }

  async function loadFinancePerformance() {
    if (!user?.school_id) return
    const sid = user.school_id
    
    // Fetch payments from the last 6 months
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    
    const { data: payments } = await supabase
      .from('fee_payments')
      .select('amount_paid, payment_date')
      .eq('school_id', sid)
      .gte('payment_date', sixMonthsAgo.toISOString())

    if (!payments) return

    // Group by month
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
    const last6Months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      last6Months.push({ 
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: months[d.getMonth()]
      })
    }

    const aggregated = last6Months.map(m => {
      const total = payments
        .filter(p => p.payment_date.startsWith(m.key))
        .reduce((sum, p) => sum + Number(p.amount_paid), 0)
      return { month: m.label, amount: total }
    })

    setFinanceData(aggregated)
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
      const [{ count: r }, { count: p }, { count: pa }] = await Promise.all([
        supabase.from('report_cards').select('*', { count: 'exact', head: true }).eq('term_id', term.id),
        supabase.from('scores').select('*', { count: 'exact', head: true }).eq('term_id', term.id).eq('is_submitted', false),
        supabase.from('report_cards').select('*', { count: 'exact', head: true }).eq('term_id', term.id).eq('is_approved', false),
      ])
      reports = r ?? 0; pendingScores = p ?? 0; pendingApproval = pa ?? 0

      // Calculate True Outstanding Debt (Tuition + Daily + Arrears)
      const [
        { data: studentsForDebt },
        { data: structures },
        { data: payments },
        { data: dailyConfigData },
        { data: dailyCollections },
        { data: attendance },
      ] = await Promise.all([
        supabase.from('students').select('id, scholarship_percentage, fees_arrears, daily_fee_mode, class_id').eq('school_id', sid).eq('is_active', true),
        feeStructuresService.getAll(sid, term.id),
        feePaymentsService.getAll(sid, term.id),
        supabase.from('daily_fee_class_rates').select('*').eq('school_id', sid).eq('term_id', term.id),
        supabase.from('daily_fees_collected').select('student_id, amount, fee_type').eq('school_id', sid).eq('term_id', term.id),
        supabase.from('attendance').select('student_id, days_present').eq('term_id', term.id),
      ])

      const structuresByClass: Record<string, number> = {}
      for (const s of structures || []) structuresByClass[s.class_id] = (structuresByClass[s.class_id] || 0) + (s.amount || 0)

      const paidByStudent: Record<string, number> = {}
      for (const p of payments || []) paidByStudent[p.student_id] = (paidByStudent[p.student_id] || 0) + (p.amount_paid || 0)

      const dailyPaidByStudent: Record<string, { f: number; s: number }> = {}
      for (const c of dailyCollections || []) {
        if (!dailyPaidByStudent[c.student_id]) dailyPaidByStudent[c.student_id] = { f: 0, s: 0 }
        if (c.fee_type === 'feeding') dailyPaidByStudent[c.student_id].f += Number(c.amount)
        else if (c.fee_type === 'studies') dailyPaidByStudent[c.student_id].s += Number(c.amount)
      }

      const attendanceMap: Record<string, number> = {}
      for (const a of attendance || []) attendanceMap[a.student_id] = a.days_present || 0

      const dailyRatesMap: Record<string, { f: number, s: number }> = {}
      for (const r of dailyConfigData || []) dailyRatesMap[r.class_id] = { f: Number(r.expected_feeding_fee || 0), s: Number(r.expected_studies_fee || 0) }

      for (const s of studentsForDebt || []) {
        const classFee = structuresByClass[s.class_id] || 0
        const netTuition = classFee - (classFee * ((s.scholarship_percentage || 0) / 100))
        const tuitionOwed = Math.max(0, netTuition - (paidByStudent[s.id] || 0))

        const daysPresent = attendanceMap[s.id] || 0
        const classRates = dailyRatesMap[s.class_id] || { f: 0, s: 0 }
        const feeMode = s.daily_fee_mode || 'all'
        
        const expectedFeeding = feeMode === 'none' ? 0 : classRates.f * daysPresent
        const expectedStudies = (feeMode === 'none' || feeMode === 'feeding') ? 0 : classRates.s * daysPresent

        const daily = dailyPaidByStudent[s.id] || { f: 0, s: 0 }
        const dailyOwed = Math.max(0, expectedFeeding - daily.f) + Math.max(0, expectedStudies - daily.s)

        totalDebt += (Number(s.fees_arrears || 0) + tuitionOwed + dailyOwed)
      }
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
    
    // Fetch all scores for the current term to calculate live rankings
    const { data: scores, error } = await supabase
      .from('scores')
      .select('student_id, total_score, student:students(full_name, class:classes(name))')
      .eq('term_id', term.id)
    
    if (error || !scores) return

    // Group by student and calculate averages
    const studentMap: Record<string, { full_name: string, class_name: string, total: number, count: number }> = {}
    
    scores.forEach(s => {
      if (!s.student_id) return
      if (!studentMap[s.student_id]) {
        studentMap[s.student_id] = {
          full_name: s.student?.full_name ?? 'Unknown',
          class_name: s.student?.class?.name ?? 'Unknown',
          total: 0,
          count: 0
        }
      }
      studentMap[s.student_id].total += (s.total_score || 0)
      studentMap[s.student_id].count += 1
    })

    const ranked = Object.entries(studentMap)
      .map(([id, data]) => ({
        student_id: id,
        full_name: data.full_name,
        class_name: data.class_name,
        average_score: data.total / data.count
      }))
      .sort((a, b) => b.average_score - a.average_score)
      .slice(0, 5)

    setTopStudents(ranked as any)
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

  if (loading) return <FlaskLoader fullScreen={false} label="Loading dashboard…" />

  const reportsRemaining = (stats?.totalStudentsForReports ?? 0) - (stats?.reportsGenerated ?? 0)
  const reportPct = stats?.totalStudentsForReports ? Math.round((stats.reportsGenerated / stats.totalStudentsForReports) * 100) : 0
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        .dashboard-container {
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          opacity: ${mounted ? 1 : 0};
          transition: opacity 0.5s ease-out;
          max-width: 1440px;
          margin: 0 auto;
          color: #0f172a;
          padding-bottom: 60px;
        }

        /* Animations */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        
        .anim-fade-up { animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.2s; }
        .delay-3 { animation-delay: 0.3s; }
        .delay-4 { animation-delay: 0.4s; }

        /* Premium Cards */
        .glass-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.6);
          border-radius: 24px;
          box-shadow: 0 10px 40px -10px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,1);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .glass-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px -10px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,1);
        }

        /* Action Buttons */
        .btn-primary {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 14px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3);
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(124, 58, 237, 0.4);
        }
        .btn-secondary {
          background: white;
          color: #334155;
          border: 1px solid #e2e8f0;
          padding: 12px 24px;
          border-radius: 14px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
        }
        .btn-secondary:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .op-card {
           display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px;
           padding: 24px 12px; border-radius: 20px; background: #f8fafc; text-decoration: none;
           transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); border: 1px solid transparent;
        }
        .op-card:hover {
           background: #fff; border-color: #e2e8f0; transform: translateY(-4px) scale(1.02); 
           box-shadow: 0 12px 24px -8px rgba(0,0,0,0.08);
        }
        
        .chart-bar-wrap:hover .chart-bar {
          filter: brightness(1.1);
        }
      `}</style>

      <div className="dashboard-container">
        
        {/* ── HEADER SECTION ── */}
        <div className="anim-fade-up" style={{ marginBottom: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <h1 style={{ fontSize: 36, fontWeight: 800, color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.03em' }}>
              {greeting}, <span style={{ background: 'linear-gradient(135deg, #4f46e5, #9333ea)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user?.full_name?.split(' ')[0]}</span> 👋
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, fontWeight: 600, color: '#64748b' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', padding: '4px 10px', borderRadius: 8 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6' }} />
                {year?.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f0fdf4', color: '#16a34a', padding: '4px 10px', borderRadius: 8 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }} />
                {term?.name ?? 'No active term'}
              </div>
              <span>{new Date().toLocaleDateString('en-GH', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
              <span style={{ color: '#8b5cf6', background: '#f5f3ff', padding: '4px 10px', borderRadius: 8 }}><DashboardClock /></span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link to={ROUTES.ADMIN_ANNOUNCEMENTS} className="btn-secondary">
              <span style={{ fontSize: 16 }}>📢</span> Announce
            </Link>
            <Link to={ROUTES.ADMIN_REPORTS} className="btn-primary">
              <span style={{ fontSize: 16 }}>📄</span> Reports
            </Link>
          </div>
        </div>

        {/* ── TOP HERO METRICS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1.5fr) minmax(300px, 1fr)', gap: 24, marginBottom: 24 }}>
          
          {/* Main Hero Card */}
          <div className="glass-card anim-fade-up delay-1" style={{ 
            background: 'linear-gradient(135deg, #1e1b4b 0%, #311860 100%)',
            color: '#fff', padding: 40, border: 'none', minHeight: 340,
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
          }}>
            <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '60%', background: 'radial-gradient(circle at top right, rgba(139,92,246,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
            
            {userSchool?.logo_url ? (
              <img src={userSchool.logo_url} alt="" style={{ position: 'absolute', right: -40, top: '50%', transform: 'translateY(-50%)', width: 300, height: 300, objectFit: 'contain', opacity: 0.1, pointerEvents: 'none' }} />
            ) : (
              <div style={{ position: 'absolute', right: -20, top: '50%', transform: 'translateY(-50%)', fontSize: 200, opacity: 0.05, pointerEvents: 'none' }}>🏫</div>
            )}

            <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 12px' }}>Total Population</p>
                <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.04em', display: 'flex', alignItems: 'baseline', gap: 12 }}>
                  <AnimNum to={(stats?.students ?? 0) + (stats?.teachers ?? 0)} />
                  <span style={{ fontSize: 20, fontWeight: 600, color: '#818cf8', letterSpacing: '0' }}>members</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {userSchool?.logo_url && <img src={userSchool.logo_url} alt="School Logo" style={{ width: 64, height: 64, objectFit: 'contain', background: 'rgba(255,255,255,0.1)', padding: 8, borderRadius: 16 }} />}
              </div>
            </div>

            <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 24, marginTop: 40 }}>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', padding: '20px 24px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: 13, color: '#c7d2fe', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Students Enrolled</div>
                <div style={{ fontSize: 32, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: '#38bdf8' }}>👨‍🎓</span> <AnimNum to={stats?.students ?? 0} />
                </div>
              </div>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', padding: '20px 24px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: 13, color: '#c7d2fe', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Teaching Staff</div>
                <div style={{ fontSize: 32, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: '#a78bfa' }}>👩‍🏫</span> <AnimNum to={stats?.teachers ?? 0} />
                </div>
              </div>
            </div>
          </div>

          {/* Reports Progress Card */}
          <div className="glass-card anim-fade-up delay-2" style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #fff 100%)', padding: 40, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#9a3412', margin: 0 }}>Reports Progress</h3>
              <div style={{ background: '#ffedd5', color: '#ea580c', padding: '6px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>Term {term?.name?.match(/\d+/)?.[0] || '1'}</div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginBottom: 30 }}>
              <div style={{ position: 'relative', width: 100, height: 100, borderRadius: '50%', background: `conic-gradient(#f97316 ${reportPct}%, #fed7aa 0)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(249,115,22,0.15)' }}>
                <div style={{ width: 80, height: 80, background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 24, fontWeight: 800, color: '#111827' }}>{reportPct}%</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 36, fontWeight: 800, color: '#111827', lineHeight: 1 }}>{reportsRemaining}</div>
                <div style={{ fontSize: 14, color: '#7c2d12', fontWeight: 600, marginTop: 6 }}>reports left to generate</div>
              </div>
            </div>

            <p style={{ fontSize: 15, color: '#7c2d12', lineHeight: 1.6, margin: '0 0 24px', fontWeight: 500 }}>
              {reportsRemaining > 0 
                ? 'Keep teachers moving forward to complete the academic grading cycle successfully.'
                : 'All reports have been successfully generated for this term. Great job!'}
            </p>
            
            <Link to={ROUTES.ADMIN_REPORTS} style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', padding: '16px 24px', borderRadius: 16, textDecoration: 'none', color: '#9a3412', fontWeight: 700, border: '1px solid #ffedd5', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
              Manage Reports
              <span style={{ background: '#ffedd5', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c' }}>→</span>
            </Link>
          </div>

        </div>

        {/* ── METRICS GRID ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          
          {/* Finance Performance */}
          <div className="glass-card anim-fade-up delay-3" style={{ padding: 32, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>Financial Overview</h3>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: '#f0fdfa', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0d9488', fontSize: 20 }}>💰</div>
            </div>
            
            <div style={{ marginBottom: 40 }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>
                GH₵<AnimNum to={stats?.totalDebt ?? 0} />
              </div>
              <div style={{ fontSize: 14, color: '#64748b', fontWeight: 500, marginTop: 4 }}>Total outstanding fees/arrears</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 140, gap: 12, marginTop: 'auto', padding: '20px 0 0' }}>
              {financeData.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13, fontWeight: 500 }}>No payment data yet</div>
              ) : (
                financeData.map((d, i) => {
                  const maxVal = Math.max(...financeData.map(m => m.amount), 1000)
                  const h = Math.max(10, (d.amount / maxVal) * 100)
                  const isLast = i === financeData.length - 1
                  return (
                    <div key={i} className="chart-bar-wrap" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, cursor: 'pointer', group: 'true' }}>
                      <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                        <div className="chart-bar" style={{ width: 12, height: `${h}%`, background: isLast ? 'linear-gradient(to top, #0ea5e9, #38bdf8)' : '#e0f2fe', borderRadius: 99, transition: 'all 0.3s' }} />
                      </div>
                      <span style={{ fontSize: 11, color: isLast ? '#0ea5e9' : '#94a3b8', fontWeight: 700 }}>{d.month}</span>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Top Performers */}
          <div className="glass-card anim-fade-up delay-3" style={{ padding: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>Top Performers</h3>
              <div style={{ background: '#fef3c7', color: '#d97706', padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>Live Rank</div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {topStudents.length === 0 ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748b', fontSize: 14, fontWeight: 500 }}>No scores entered yet this term</div>
              ) : topStudents.slice(0, 5).map((s, i) => {
                const g = getGradeInfo(s.average_score)
                return (
                  <div key={s.student_id} className="hover-row" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', margin: '0 -16px', borderBottom: i < 4 ? '1px solid #f1f5f9' : 'none' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: i === 0 ? '#fef3c7' : i === 1 ? '#f1f5f9' : i === 2 ? '#ffedd5' : '#f8fafc', color: i === 0 ? '#d97706' : i === 1 ? '#64748b' : i === 2 ? '#c2410c' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800 }}>
                      #{i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.full_name}</p>
                      <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0', fontWeight: 500 }}>{s.class_name}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: g.color }}>{(s.average_score / 20).toFixed(1)}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>GPA</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quick Operations Grid */}
          <div className="glass-card anim-fade-up delay-4" style={{ padding: 32 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 24px' }}>Quick Operations</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {[
                { icon: '👥', label: 'Students', to: ROUTES.ADMIN_STUDENTS, color: '#3b82f6' },
                { icon: '👩‍🏫', label: 'Teachers', to: ROUTES.ADMIN_TEACHERS, color: '#8b5cf6' },
                { icon: '🏫', label: 'Classes', to: ROUTES.ADMIN_CLASSES, color: '#10b981' },
                { icon: '📚', label: 'Subjects', to: ROUTES.ADMIN_SUBJECTS, color: '#f59e0b' },
                { icon: '📅', label: 'Calendar', to: ROUTES.ADMIN_CALENDAR, color: '#ef4444' },
                { icon: '📊', label: 'Analytics', to: ROUTES.ADMIN_ANALYTICS, color: '#06b6d4' },
                { icon: '📱', label: 'SMS', to: ROUTES.ADMIN_SMS, color: '#14b8a6' },
                { icon: '⚙️', label: 'Settings', to: ROUTES.ADMIN_SETTINGS, color: '#64748b' },
              ].map(({ icon, label, to, color }) => (
                <Link key={label} to={to} className="op-card">
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: color }}>
                    {icon}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>{label}</span>
                </Link>
              ))}
            </div>
          </div>

        </div>

        {/* Message Modal */}
        {activeMsg && (
          <div onClick={() => setActiveMsg(null)} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 520, boxShadow: '0 24px 64px rgba(0,0,0,0.2)', overflow: 'hidden', animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
              <div style={{ padding: '24px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', background: '#f8fafc' }}>
                <div>
                  <p style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>{activeMsg.subject}</p>
                  <p style={{ fontSize: 14, color: '#64748b', margin: '6px 0 0', fontWeight: 500 }}>From: {activeMsg.from_user?.full_name ?? 'Teacher'} • {timeAgo(activeMsg.created_at)}</p>
                </div>
                <button onClick={() => setActiveMsg(null)} style={{ width: 36, height: 36, borderRadius: 12, border: 'none', background: '#e2e8f0', cursor: 'pointer', fontSize: 16, color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#cbd5e1'} onMouseLeave={e => e.currentTarget.style.background = '#e2e8f0'}>✕</button>
              </div>
              <div style={{ padding: '32px' }}>
                <p style={{ fontSize: 16, color: '#334155', lineHeight: 1.6, margin: 0 }}>{activeMsg.body}</p>
              </div>
              <div style={{ padding: '20px 32px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', background: '#f8fafc' }}>
                <button onClick={() => setActiveMsg(null)} className="btn-primary">Done</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}