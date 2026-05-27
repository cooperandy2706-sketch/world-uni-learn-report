import { useStuckLoadingReload } from '../../hooks/useStuckLoadingReload'
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { useAuth } from '../../hooks/useAuth'
import { useCurrentTerm, useCurrentAcademicYear } from '../../hooks/useSettings'
import { getGradeInfo } from '../../utils/grading'
import { formatDate, ordinal, getEngagingGreeting } from '../../lib/utils'
import { ROUTES } from '../../constants/routes'
import { feeStructuresService, feePaymentsService } from '../../services/bursar.service'
import FlaskLoader from '../../components/ui/FlaskLoader'
import WelcomeOnboarding from '../../components/ui/WelcomeOnboarding'
import { AreaChart, Area, BarChart, Bar, Cell, Legend, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, MessageSquare, MapPin, Activity, BookOpen, AlertCircle, ArrowUpRight, CheckCircle2, Navigation, Calendar, UserCheck, Clock, Award, ShieldAlert, CheckSquare } from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'


// ... interfaces and helper functions

interface Stats {
  students: number; teachers: number; classes: number; subjects: number
  departments: number; reportsGenerated: number; totalStudentsForReports: number
  pendingScores: number; unreadMessages: number; totalAssignments: number
  totalSubmissions: number; totalAnnouncements: number
  presentToday: number; absentToday: number; attendanceClasses: number
  totalDebt: number; pendingApproval: number
}
interface TopStudent { student_id: string; full_name: string; class_name: string; average_score: number; overall_position: number; total_students: number }
interface TopSubject { subject_id: string; name: string; average: number }
interface AbsentStudent { student_id: string; full_name: string; guardian_name: string; guardian_phone: string; class_name: string; }
interface GateActivity { id: string; name: string; type: string; time: string; direction: string }
interface Message { id: string; body: string; created_at: string; is_read: boolean; sender?: { full_name: string } }
interface ClassStat { id: string; name: string; student_count: number; avg_score: number | null; reports_done: number }
interface RecentActivity { type: string; label: string; sub: string; time: string; icon: string; color: string }

interface TimetableLesson {
  id: string
  day_of_week: number
  class_id: string
  subject_id: string
  teacher_id: string
  period_id: string
  class: { id: string; name: string } | null
  subject: { id: string; name: string } | null
  teacher: { id: string; user: { full_name: string } } | null
  period: { id: string; name: string; start_time: string; end_time: string; is_break: boolean; sort_order: number } | null
  isNow: boolean
}
interface CoverageStats {
  activeClasses: number
  totalClasses: number
  percentage: number
}
interface WeeklyGoalsStats {
  total: number
  completed: number
  percentage: number
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'; if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`
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

function DashboardClock() {
  const [t, setT] = useState(new Date())
  useEffect(() => { const i = setInterval(() => setT(new Date()), 1000); return () => clearInterval(i) }, [])
  return <>{t.toLocaleTimeString('en-GH', { hour12: false })}</>
}

// ═══════════════════════════════════════════════════════════
export default function DashboardPage() {
  const { setFirstLoadComplete } = useAuthStore()
  const { user } = useAuth()

  const theme = useThemeStore(state => state.theme)
  const [isDark, setIsDark] = useState(false)
  useEffect(() => {
    const root = window.document.documentElement
    const checkDark = () => {
      setIsDark(root.classList.contains('dark'))
    }
    checkDark()
    const observer = new MutationObserver(checkDark)
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  const userSchool = user?.school as any
  const navigate = useNavigate()
  const { data: term } = useCurrentTerm()
  const { data: year } = useCurrentAcademicYear()

  const [stats, setStats] = useState<Stats | null>(null)
  const [topStudents, setTopStudents] = useState<TopStudent[]>([])
  const [topSubjects, setTopSubjects] = useState<TopSubject[]>([])
  const [absentStudents, setAbsentStudents] = useState<AbsentStudent[]>([])
  const [outOfCampus, setOutOfCampus] = useState<GateActivity[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [classStats, setClassStats] = useState<ClassStat[]>([])
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useStuckLoadingReload(loading)
  const [mounted, setMounted] = useState(false)
  const [financeData, setFinanceData] = useState<{ month: string, amount: number }[]>([])
  const [activeMsg, setActiveMsg] = useState<Message | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [topTab, setTopTab] = useState<'students' | 'subjects'>('students')

  // New State variables
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState<'financials' | 'academics' | 'goals'>('financials')
  const [todayLessons, setTodayLessons] = useState<TimetableLesson[]>([])
  const [coverageStats, setCoverageStats] = useState<CoverageStats>({ activeClasses: 0, totalClasses: 0, percentage: 0 })
  const [pendingLeavesCount, setPendingLeavesCount] = useState<number>(0)
  const [pendingExeatsCount, setPendingExeatsCount] = useState<number>(0)
  const [weeklyGoalsStats, setWeeklyGoalsStats] = useState<WeeklyGoalsStats>({ total: 0, completed: 0, percentage: 0 })
  const [locateClass, setLocateClass] = useState<any | null>(null)

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem(`onboarding_seen_${user?.id}`)
    if (!hasSeenOnboarding && user) {
      setShowOnboarding(true)
    }
  }, [user?.id])

  const handleOnboardingComplete = () => {
    localStorage.setItem(`onboarding_seen_${user?.id}`, 'true')
    setShowOnboarding(false)
  }

  useEffect(() => { setTimeout(() => setMounted(true), 60) }, [])

  useEffect(() => {
    if (!user?.school_id) {
      setFirstLoadComplete(true)
      return
    }
    loadAll()

    const channel = supabase.channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages', filter: `school_id=eq.${user.school_id}` }, () => loadMessages())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fee_payments', filter: `school_id=eq.${user.school_id}` }, () => {
        loadStats(); loadFinancePerformance()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'report_cards', filter: `school_id=eq.${user.school_id}` }, () => {
        loadStats(); loadTopStudents()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scores', filter: `school_id=eq.${user.school_id}` }, () => {
        loadTopStudents(); loadTopSubjects()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students', filter: `school_id=eq.${user.school_id}` }, () => {
        loadStats()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gate_scans', filter: `school_id=eq.${user.school_id}` }, () => {
        loadGateActivity()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user?.school_id, term?.id])

  async function loadAll() {
    try {
      await Promise.all([
        loadStats(), 
        loadTopStudents(), 
        loadTopSubjects(),
        loadMessages(), 
        loadClassStats(), 
        loadRecentActivity(), 
        loadAnnouncements(),
        loadFinancePerformance(),
        loadGateActivity(),
        loadAbsentStudents(),
        loadTimetableLessons(),
        loadPendingOperations(),
        loadWeeklyGoalsStats()
      ])
    } finally {
      setLoading(false)
      setFirstLoadComplete(true)
    }
  }

  async function loadGateActivity() {
    if (!user?.school_id) return
    const today = new Date().toISOString().slice(0, 10)
    // Fetch latest scans
    const { data: scans } = await supabase
      .from('gate_scans')
      .select('id, scan_time, person_type, direction, person_db_id')
      .eq('school_id', user.school_id)
      .eq('scan_date', today)
      .order('scan_time', { ascending: false })
    
    if (!scans || scans.length === 0) return

    // Group by person to get latest status
    const latestScans = new Map()
    scans.forEach(s => {
      const personKey = `${s.person_type}_${s.person_db_id}`
      if (!latestScans.has(personKey)) latestScans.set(personKey, s)
    })

    const outOnly = Array.from(latestScans.values()).filter(s => s.direction === 'out')
    
    // Now fetch names
    const outStudents = outOnly.filter(s => s.person_type === 'student').map(s => s.person_db_id)
    const outStaff = outOnly.filter(s => s.person_type === 'staff').map(s => s.person_db_id)

    let stuNames: any = [], staffNames: any = []
    if (outStudents.length) {
      const { data } = await supabase.from('students').select('id, full_name').in('id', outStudents)
      stuNames = data || []
    }
    if (outStaff.length) {
      const { data } = await supabase.from('teachers').select('id, user:users(full_name)').in('id', outStaff)
      staffNames = data || []
    }

    const mapped = outOnly.map(s => {
      let name = 'Unknown'
      if (s.person_type === 'student') name = stuNames.find((x:any) => x.id === s.person_db_id)?.full_name || 'Student'
      if (s.person_type === 'staff') name = staffNames.find((x:any) => x.id === s.person_db_id)?.user?.full_name || 'Staff'
      return { id: s.id, name, type: s.person_type, time: s.scan_time, direction: s.direction }
    })
    
    setOutOfCampus(mapped)
  }

  async function loadAbsentStudents() {
    if (!user?.school_id) return
    const today = new Date().toISOString().slice(0, 10)
    const { data: absentData } = await supabase
      .from('attendance_records')
      .select('student_id, student:students!inner(full_name, guardian_name, guardian_phone, class:classes(name))')
      .eq('school_id', user.school_id)
      .eq('date', today)
      .eq('status', 'absent')

    const mapped = (absentData || []).map((a:any) => ({
      student_id: a.student_id,
      full_name: a.student?.full_name || '',
      guardian_name: a.student?.guardian_name || '',
      guardian_phone: a.student?.guardian_phone || '',
      class_name: a.student?.class?.name || ''
    }))
    setAbsentStudents(mapped)
  }

  async function loadFinancePerformance() {
    if (!user?.school_id) return
    const sid = user.school_id
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5) // Last 6 months inclusive
    sixMonthsAgo.setDate(1)
    
    const { data: payments } = await supabase
      .from('fee_payments')
      .select('amount_paid, payment_date')
      .eq('school_id', sid)
      .gte('payment_date', sixMonthsAgo.toISOString())

    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
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
      const total = (payments || [])
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
      supabase.from('chat_messages').select('*', { count: 'exact', head: true }).eq('school_id', sid)
        .gt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      supabase.from('assignments').select('*', { count: 'exact', head: true }).eq('school_id', sid),
      supabase.from('assignment_submissions').select('*, assignment:assignments!inner(*)', { count: 'exact', head: true }).eq('assignments.school_id', sid),
      supabase.from('announcements').select('*', { count: 'exact', head: true }).eq('school_id', sid),
    ])

    let reports = 0, totalForReports = students ?? 0, pendingScores = 0, totalDebt = 0, pendingApproval = 0
    if (term?.id) {
      const [{ count: r }, { count: p }, { count: pa }] = await Promise.all([
        supabase.from('report_cards').select('*', { count: 'exact', head: true }).eq('school_id', sid).eq('term_id', term.id),
        supabase.from('scores').select('*', { count: 'exact', head: true }).eq('school_id', sid).eq('term_id', term.id).eq('is_submitted', false),
        supabase.from('report_cards').select('*', { count: 'exact', head: true }).eq('school_id', sid).eq('term_id', term.id).eq('is_approved', false),
      ])
      reports = r ?? 0; pendingScores = p ?? 0; pendingApproval = pa ?? 0

      const [{ data: studentsForDebt }, { data: structures }, { data: payments }, { data: dailyConfigData }, { data: dailyCollections }, { data: attendance }] = await Promise.all([
        supabase.from('students').select('id, scholarship_percentage, fees_arrears, daily_fee_mode, class_id').eq('school_id', sid).eq('is_active', true),
        feeStructuresService.getAll(sid, term.id),
        feePaymentsService.getAll(sid, term.id),
        supabase.from('daily_fee_class_rates').select('*').eq('school_id', sid).eq('term_id', term.id),
        supabase.from('daily_fees_collected').select('student_id, amount, fee_type').eq('school_id', sid).eq('term_id', term.id),
        supabase.from('attendance').select('student_id, days_present').eq('school_id', sid).eq('term_id', term.id),
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

    const today = new Date().toISOString().slice(0, 10)
    const { data: attToday } = await supabase.from('attendance_records').select('status, student_id').eq('school_id', sid).eq('date', today)
    const presentToday = attToday?.filter((a: any) => a.status === 'present' || a.status === 'late').length ?? 0
    const absentToday = attToday?.filter((a: any) => a.status === 'absent').length ?? 0
    const { data: attClasses } = await supabase.from('attendance_records').select('class_id').eq('school_id', sid).eq('date', today)
    const attendanceClasses = new Set(attClasses?.map((a: any) => a.class_id)).size

    setStats({ 
      students: students ?? 0, teachers: teachers ?? 0, classes: classes ?? 0, subjects: subjects ?? 0, 
      departments: departments ?? 0, reportsGenerated: reports, totalStudentsForReports: totalForReports, 
      pendingScores, unreadMessages: msgs ?? 0, totalAssignments: assigns ?? 0, totalSubmissions: subs ?? 0, 
      totalAnnouncements: announceCount ?? 0, presentToday, absentToday, attendanceClasses, totalDebt, pendingApproval
    })
  }

  async function loadRecentActivity() {
    const sid = user!.school_id
    const [{ data: recentSubs }, { data: recentScores }, { data: recentStudents }] = await Promise.all([
      supabase.from('assignment_submissions').select('submitted_at, student:students(full_name), assignment:assignments!inner(title)').eq('assignments.school_id', sid).order('submitted_at', { ascending: false }).limit(4),
      supabase.from('scores').select('updated_at, total_score, student:students!inner(full_name, school_id), subject:subjects(name)').eq('students.school_id', sid).order('updated_at', { ascending: false }).limit(4),
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
    const { data: scores } = await supabase.from('scores').select('student_id, total_score, student:students!inner(full_name, school_id, class:classes(name))').eq('students.school_id', user!.school_id).eq('term_id', term.id)
    if (!scores) return
    const studentMap: Record<string, { full_name: string, class_name: string, total: number, count: number }> = {}
    scores.forEach(s => {
      if (!s.student_id) return
      const studentObj = s.student as any
      if (!studentMap[s.student_id]) studentMap[s.student_id] = { full_name: studentObj?.full_name ?? 'Unknown', class_name: studentObj?.class?.name ?? 'Unknown', total: 0, count: 0 }
      studentMap[s.student_id].total += (s.total_score || 0); studentMap[s.student_id].count += 1
    })
    const ranked = Object.entries(studentMap).map(([id, data]) => ({ student_id: id, full_name: data.full_name, class_name: data.class_name, average_score: data.total / data.count })).sort((a, b) => b.average_score - a.average_score).slice(0, 5)
    setTopStudents(ranked as any)
  }

  async function loadTopSubjects() {
    if (!term?.id) return
    const { data: scores } = await supabase.from('scores').select('subject_id, total_score, subject:subjects!inner(name)').eq('subjects.school_id', user!.school_id).eq('term_id', term.id)
    if (!scores) return
    const subMap: Record<string, { name: string, total: number, count: number }> = {}
    scores.forEach(s => {
      if (!s.subject_id) return
      const subjectObj = s.subject as any
      if (!subMap[s.subject_id]) subMap[s.subject_id] = { name: subjectObj?.name || 'Unknown', total: 0, count: 0 }
      subMap[s.subject_id].total += (s.total_score || 0); subMap[s.subject_id].count += 1
    })
    const ranked = Object.entries(subMap).map(([id, data]) => ({ subject_id: id, name: data.name, average: data.total / data.count })).sort((a, b) => b.average - a.average).slice(0, 5)
    setTopSubjects(ranked)
  }

  async function loadMessages() {
    const groupKey = `staff_inbox_${user!.school_id}`
    const { data: conv } = await supabase.from('chat_conversations').select('id').eq('group_key', groupKey).maybeSingle()
    if (!conv?.id) { setMessages([]); return }
    const { data } = await supabase.from('chat_messages').select('id, body, created_at, sender_id, sender:users!chat_messages_sender_id_fkey(full_name)').eq('conversation_id', conv.id).order('created_at', { ascending: false }).limit(6)
    const { data: membership } = await supabase.from('chat_members').select('last_read_at').eq('conversation_id', conv.id).eq('user_id', user!.id).maybeSingle()
    const lastRead = membership?.last_read_at ? new Date(membership.last_read_at) : new Date(0)
    setMessages((data ?? []).map((m: any) => ({ id: m.id, body: m.body, created_at: m.created_at, is_read: new Date(m.created_at) <= lastRead, sender: m.sender })))
  }

  async function loadClassStats() {
    const { data: classes } = await supabase.from('classes').select('id, name').eq('school_id', user!.school_id)
    if (!classes) return
    const results: ClassStat[] = await Promise.all(classes.map(async (cls) => {
      const { count: sc } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('class_id', cls.id).eq('is_active', true)
      let avg = null, done = 0
      if (term?.id) {
        const { data: rpts } = await supabase.from('report_cards').select('average_score').eq('school_id', user!.school_id).eq('class_id', cls.id).eq('term_id', term.id)
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

  async function loadTimetableLessons() {
    if (!user?.school_id || !term?.id) return
    const now = new Date()
    const todayDay = now.getDay()
    const isWeekend = todayDay === 0 || todayDay === 6
    const queryDay = isWeekend ? 1 : todayDay // Fallback to Monday on weekends

    const { data: slots } = await supabase
      .from('timetable_slots')
      .select(`
        id,
        day_of_week,
        class_id,
        subject_id,
        teacher_id,
        period_id,
        class:classes(id, name),
        subject:subjects(id, name),
        teacher:teachers(id, user:users(full_name)),
        period:timetable_periods(id, name, start_time, end_time, is_break, sort_order)
      `)
      .eq('school_id', user.school_id)
      .eq('term_id', term.id)
      .eq('day_of_week', queryDay)

    if (!slots) return

    const tpList = slots.filter((s: any) => s.period && !s.period.is_break)
      .sort((a: any, b: any) => {
        const aSort = a.period?.sort_order ?? 999
        const bSort = b.period?.sort_order ?? 999
        if (aSort !== bSort) return aSort - bSort
        return (a.period?.start_time ?? '').localeCompare(b.period?.start_time ?? '')
      })

    const hour = now.getHours()
    const currentMins = hour * 60 + now.getMinutes()

    function timeToMins(t: string) {
      if (!t) return 0
      const [h, m] = t.split(':').map(Number)
      return (isNaN(h) ? 0 : h * 60) + (isNaN(m) ? 0 : m)
    }

    let activeCount = 0
    const activeLessonsList = tpList.map((l: any) => {
      const start = l.period?.start_time?.slice(0, 5)
      const end = l.period?.end_time?.slice(0, 5)
      let isNow = false

      if (start && end) {
        const sMins = timeToMins(start)
        const eMins = timeToMins(end)
        if (isWeekend) {
          // Weekend mock: Mark period index 1 & 2 lessons as active
          const pIdx = l.period?.sort_order ?? 0
          isNow = pIdx === 1 || pIdx === 2
        } else {
          isNow = currentMins >= sMins && currentMins < eMins
        }
      }

      if (isNow) activeCount++
      return { ...l, isNow }
    })

    setTodayLessons(activeLessonsList)

    const uniqueClasses = Array.from(new Set(tpList.map((l: any) => l.class_id)))
    const activeOccupied = Array.from(new Set(activeLessonsList.filter(l => l.isNow).map((l: any) => l.class_id)))

    setCoverageStats({
      activeClasses: activeOccupied.length,
      totalClasses: uniqueClasses.length || stats?.classes || 1,
      percentage: uniqueClasses.length ? Math.round((activeOccupied.length / uniqueClasses.length) * 100) : 0
    })
  }

  async function loadPendingOperations() {
    if (!user?.school_id) return
    const [leavesRes, exeatsRes] = await Promise.all([
      supabase.from('leave_requests').select('id', { count: 'exact', head: true }).eq('school_id', user.school_id).eq('status', 'pending'),
      supabase.from('exeat_requests').select('id', { count: 'exact', head: true }).eq('school_id', user.school_id).eq('status', 'pending')
    ])
    setPendingLeavesCount(leavesRes.count ?? 0)
    setPendingExeatsCount(exeatsRes.count ?? 0)
  }

  async function loadWeeklyGoalsStats() {
    if (!user?.school_id || !term?.id) return
    const { data } = await supabase
      .from('weekly_goals')
      .select('id, is_completed')
      .eq('school_id', user.school_id)
      .eq('term_id', term.id)

    if (!data) return
    const total = data.length
    const completed = data.filter((g: any) => g.is_completed).length
    setWeeklyGoalsStats({
      total,
      completed,
      percentage: total ? Math.round((completed / total) * 100) : 0
    })
  }

  const reportPct = stats?.totalStudentsForReports ? Math.round((stats.reportsGenerated / stats.totalStudentsForReports) * 100) : 0
  const { timeGreeting, roleMessage } = getEngagingGreeting(user?.role)

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  }

  if (loading) return <FlaskLoader fullScreen={false} label="Initializing Command Center…" />

  return (
    <>
      {showOnboarding && <WelcomeOnboarding userName={user?.full_name?.split(' ')[0] || 'Admin'} onComplete={handleOnboardingComplete} />}
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .noc-dashboard {
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          color: var(--text-main);
          padding-bottom: 60px;
          max-width: 1600px;
          margin: 0 auto;
        }
        .glass-panel {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.5);
          border-radius: 24px;
          box-shadow: 0 10px 40px -10px rgba(0,0,0,0.04);
          overflow: hidden;
          position: relative;
          transition: background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        }
        html.dark .glass-panel {
          background: rgba(30, 41, 59, 0.45);
          border: 1.5px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
        }
        .kpi-card {
          background: var(--bg-card);
          border-radius: 24px;
          padding: 24px;
          border: 1px solid var(--border-color);
          box-shadow: 0 4px 12px rgba(0,0,0,0.01);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          text-decoration: none;
          color: var(--text-main);
          position: relative;
          overflow: hidden;
        }
        html.dark .kpi-card {
          background: var(--bg-card);
          border-color: var(--border-color);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
        }
        .kpi-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.05);
          border-color: rgba(79, 70, 229, 0.15);
        }
        html.dark .kpi-card:hover {
          border-color: rgba(139, 92, 246, 0.3);
          box-shadow: 0 12px 30px rgba(0,0,0,0.4);
        }
        .kpi-card::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: var(--theme-color);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .kpi-card:hover::after {
          opacity: 1;
        }
        .btn-modern {
          background: #0f172a;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 14px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
        }
        html.dark .btn-modern {
          background: var(--text-main);
          color: var(--bg-app);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        .btn-modern:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(15, 23, 42, 0.2);
        }
        .btn-secondary-modern {
          background: var(--bg-card);
          color: var(--text-main);
          border: 1px solid var(--border-color);
          padding: 12px 24px;
          border-radius: 14px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        html.dark .btn-secondary-modern {
          background: var(--bg-card);
          color: var(--text-main);
          border: 1.5px solid var(--border-color);
        }
        .btn-secondary-modern:hover {
          background: #f1f5f9;
          transform: translateY(-2px);
        }
        html.dark .btn-secondary-modern:hover {
          background: var(--bg-hover);
        }
        .ops-action-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 16px 8px;
          background: #f8fafc;
          border-radius: 16px;
          text-decoration: none;
          transition: all 0.2s;
          border: 1px solid transparent;
        }
        html.dark .ops-action-card {
          background: var(--bg-app);
        }
        .ops-action-card:hover {
          background: white;
          border-color: #e2e8f0;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.04);
        }
        html.dark .ops-action-card:hover {
          background: var(--bg-card);
          border-color: var(--border-color);
          box-shadow: 0 4px 20px rgba(0,0,0,0.25);
        }
        .list-item-hover {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          background: #f8fafc;
          border-radius: 16px;
          border: 1px solid transparent;
          transition: all 0.2s ease;
        }
        html.dark .list-item-hover {
          background: var(--bg-app);
          border-color: var(--border-light);
        }
        .list-item-hover:hover {
          transform: translateX(4px);
          background: white;
          border-color: #e2e8f0;
        }
        html.dark .list-item-hover:hover {
          background: var(--bg-hover);
          border-color: var(--border-color);
        }
        .recharts-tooltip-wrapper {
          outline: none;
        }
        .hide-scroll::-webkit-scrollbar {
          display: none;
        }
        
        .tier2-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
        }
        .tier3-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        @media (max-width: 1024px) {
          .tier2-grid {
            grid-template-columns: 1fr;
          }
          .tier3-grid {
            grid-template-columns: 1fr;
          }
        }
        .campus-block {
          border-radius: 16px;
          padding: 20px;
          background: var(--bg-card);
          border: 1.5px solid var(--border-color);
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 6px;
          align-items: center;
          justify-content: center;
          transition: all 0.25s ease;
          text-align: center;
        }
        html.dark .campus-block {
          background: rgba(30, 41, 59, 0.25);
        }
        .campus-block.active-block {
          border-color: #10b981;
          background: rgba(16, 185, 129, 0.06);
          box-shadow: 0 10px 25px rgba(16, 185, 129, 0.12);
        }
        html.dark .campus-block.active-block {
          background: rgba(16, 185, 129, 0.15);
        }
        .pulse-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
          animation: map-pulse 1.8s infinite;
        }
        @keyframes map-pulse {
          0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
          }
          70% {
            transform: scale(1);
            box-shadow: 0 0 0 10px rgba(16, 185, 129, 0);
          }
          100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
          }
        }
        .timetable-card {
          background: var(--bg-card);
          border-radius: 20px;
          border: 1.5px solid var(--border-color);
          padding: 20px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .timetable-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.04);
        }
      `}</style>

      <motion.div className="noc-dashboard" variants={containerVariants} initial="hidden" animate="show">
        
        {/* COMMAND CENTER HEADER */}
        <motion.div variants={itemVariants} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ padding: '6px 12px', background: isDark ? 'rgba(79, 70, 229, 0.2)' : '#e0e7ff', color: isDark ? '#818cf8' : '#4f46e5', borderRadius: 20, fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Activity size={14} /> Live Monitor
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} • <DashboardClock /></span>
            </div>
            <h1 style={{ fontSize: 36, fontWeight: 800, margin: 0, letterSpacing: '-0.03em', color: 'var(--text-main)' }}>{userSchool?.name ?? 'Campus Command Center'}</h1>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link to={ROUTES.ADMIN_ANNOUNCEMENTS} className="btn-secondary-modern"><MessageSquare size={16} /> Broadcast</Link>
            <Link to={ROUTES.ADMIN_REPORTS} className="btn-modern"><ArrowUpRight size={16} /> Generate Reports</Link>
          </div>
        </motion.div>

        {/* TOP KPIs GRID */}
        <motion.div variants={itemVariants} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 24 }}>
          
          <Link to={ROUTES.ADMIN_STUDENTS} className="kpi-card" style={{ '--theme-color': '#3b82f6' } as any}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 16, background: isDark ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff', color: isDark ? '#60a5fa' : '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BookOpen size={24} /></div>
              <ArrowUpRight size={20} color={isDark ? '#475569' : '#cbd5e1'} />
            </div>
            <div>
              <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1, color: 'var(--text-main)' }}><AnimNum to={stats?.students ?? 0} /></div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600, marginTop: 8 }}>Total Students Active</div>
            </div>
          </Link>

          <Link to={ROUTES.ADMIN_STAFF_DIRECTORY} className="kpi-card" style={{ '--theme-color': '#8b5cf6' } as any}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 16, background: isDark ? 'rgba(139, 92, 246, 0.2)' : '#f5f3ff', color: isDark ? '#a78bfa' : '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Activity size={24} /></div>
              <ArrowUpRight size={20} color={isDark ? '#475569' : '#cbd5e1'} />
            </div>
            <div>
              <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1, color: 'var(--text-main)' }}><AnimNum to={stats?.teachers ?? 0} /></div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600, marginTop: 8 }}>Teaching Staff</div>
            </div>
          </Link>

          <Link to={ROUTES.ADMIN_ATTENDANCE} className="kpi-card" style={{ '--theme-color': '#10b981' } as any}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 16, background: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ecfdf5', color: isDark ? '#34d399' : '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle2 size={24} /></div>
              <ArrowUpRight size={20} color={isDark ? '#475569' : '#cbd5e1'} />
            </div>
            <div>
              <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1, color: 'var(--text-main)' }}>{stats?.students ? Math.round((stats.presentToday / stats.students) * 100) : 0}%</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600, marginTop: 8 }}>Today's Attendance Rate</div>
            </div>
          </Link>

          <Link to={'/bursar/fees'} className="kpi-card" style={{ '--theme-color': '#f59e0b' } as any}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 16, background: isDark ? 'rgba(245, 158, 11, 0.2)' : '#fffbeb', color: isDark ? '#fbbf24' : '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800 }}>₵</div>
              <ArrowUpRight size={20} color={isDark ? '#475569' : '#cbd5e1'} />
            </div>
            <div>
              <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1, color: 'var(--text-main)' }}><AnimNum to={stats?.totalDebt ?? 0} /></div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600, marginTop: 8 }}>Outstanding Revenue</div>
            </div>
          </Link>

        </motion.div>

        {/* MAIN DASHBOARD STRUCTURED GRID */}
        {/* Tier 2: Analytical & Operations Deck */}
        <div className="tier2-grid">
          
          {/* Tabbed Analytics Panel */}
          <motion.div variants={itemVariants} className="glass-panel" style={{ padding: 32, height: 400 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                  {activeAnalyticsTab === 'financials' ? 'Revenue Trend' : activeAnalyticsTab === 'academics' ? 'Class Academics' : 'Weekly Goals Tracker'}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '4px 0 0' }}>
                  {activeAnalyticsTab === 'financials' 
                    ? 'Fee collections over the last 6 months' 
                    : activeAnalyticsTab === 'academics' 
                      ? 'Academic average scores compared across all classes' 
                      : 'Weekly instruction goals set for teachers this term'}
                </p>
              </div>
              
              <div style={{ display: 'flex', background: isDark ? 'var(--bg-app)' : '#f1f5f9', borderRadius: 14, padding: 4 }}>
                {[
                  { id: 'financials', label: '📈 Revenue' },
                  { id: 'academics', label: '🎓 Academics' },
                  { id: 'goals', label: '🎯 Goals' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveAnalyticsTab(tab.id as any)}
                    className="tab-button"
                    style={{
                      background: activeAnalyticsTab === tab.id ? 'var(--bg-card)' : 'transparent',
                      color: activeAnalyticsTab === tab.id ? 'var(--text-main)' : 'var(--text-muted)',
                      boxShadow: activeAnalyticsTab === tab.id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                      borderRadius: 10,
                      padding: '6px 12px',
                      fontSize: 12,
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {activeAnalyticsTab === 'financials' && (
              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={financeData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={isDark ? 0.45 : 0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'rgba(255, 255, 255, 0.06)' : '#e2e8f0'} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12, fontWeight: 600 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12, fontWeight: 600 }} tickFormatter={val => `₵${val/1000}k`} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isDark ? 'var(--bg-card)' : 'white', 
                        borderColor: 'var(--border-color)', 
                        borderRadius: 12, 
                        border: '1.5px solid var(--border-color)', 
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                        color: 'var(--text-main)'
                      }}
                      itemStyle={{ color: 'var(--text-main)' }}
                      labelStyle={{ color: 'var(--text-muted)' }}
                      formatter={(value: number) => [`GH₵ ${value.toLocaleString()}`, 'Collected']}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {activeAnalyticsTab === 'academics' && (
              <div style={{ width: '100%', height: 280 }}>
                {classStats.length === 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-subtle)', fontSize: 14 }}>No academic averages found.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={classStats.map(c => ({
                        name: c.name,
                        average: c.avg_score ? Math.round(c.avg_score) : 0
                      }))}
                      margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'rgba(255, 255, 255, 0.06)' : '#e2e8f0'} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12, fontWeight: 600 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12, fontWeight: 600 }} tickFormatter={val => `${val}%`} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: isDark ? 'var(--bg-card)' : 'white', 
                          borderColor: 'var(--border-color)', 
                          borderRadius: 12, 
                          border: '1.5px solid var(--border-color)', 
                          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                          color: 'var(--text-main)'
                        }}
                        itemStyle={{ color: 'var(--text-main)' }}
                        labelStyle={{ color: 'var(--text-muted)' }}
                        formatter={(value: number) => [`${value}%`, 'Class Average']}
                      />
                      <Bar dataKey="average" radius={[6, 6, 0, 0]}>
                        {classStats.map((entry, index) => {
                          const score = entry.avg_score || 0
                          const color = score >= 75 ? '#10b981' : score >= 50 ? '#6366f1' : '#f59e0b'
                          return <Cell key={`cell-${index}`} fill={color} />
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            )}

            {activeAnalyticsTab === 'goals' && (
              <div style={{ display: 'flex', height: 280, gap: 24, alignItems: 'center' }}>
                <div style={{ width: '40%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ position: 'relative', width: 140, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                      <circle 
                        cx="70" cy="70" r="55" 
                        stroke={isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9'} 
                        strokeWidth="12" fill="transparent" 
                      />
                      <circle 
                        cx="70" cy="70" r="55" 
                        stroke="#f59e0b" strokeWidth="12" fill="transparent" 
                        strokeDasharray={2 * Math.PI * 55}
                        strokeDashoffset={2 * Math.PI * 55 * (1 - (weeklyGoalsStats.percentage / 100))}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                      />
                    </svg>
                    <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-main)' }}>{weeklyGoalsStats.percentage}%</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Completed</span>
                    </div>
                  </div>
                </div>
                <div style={{ width: '60%', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={{ background: isDark ? 'var(--bg-app)' : '#f8fafc', padding: 16, borderRadius: 16, border: '1.5px solid var(--border-color)' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Set</div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-main)', marginTop: 4 }}>{weeklyGoalsStats.total}</div>
                    </div>
                    <div style={{ background: isDark ? 'var(--bg-app)' : '#f8fafc', padding: 16, borderRadius: 16, border: '1.5px solid var(--border-color)' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Achieved</div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981', marginTop: 4 }}>{weeklyGoalsStats.completed}</div>
                    </div>
                  </div>
                  <Link 
                    to="/admin/weekly-goals" 
                    style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, 
                      padding: 12, background: 'var(--text-main)', color: 'var(--bg-app)', 
                      borderRadius: 12, fontWeight: 700, fontSize: 13, textDecoration: 'none', 
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', transition: 'all 0.2s' 
                    }}
                    onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <CheckSquare size={16} /> Manage Weekly Goals
                  </Link>
                </div>
              </div>
            )}
          </motion.div>

          {/* Operations Deck */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Attention Required (System Alerts) */}
            {(stats?.pendingApproval || stats?.pendingScores || stats?.unreadMessages || pendingLeavesCount > 0 || pendingExeatsCount > 0) ? (
              <motion.div variants={itemVariants} className="glass-panel" style={{ padding: 24, background: isDark ? 'rgba(225, 29, 72, 0.08)' : 'linear-gradient(135deg, #fff1f2 0%, #fff 100%)', border: isDark ? '1.5px solid rgba(225, 29, 72, 0.2)' : '1px solid #ffe4e6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <AlertCircle color="#e11d48" size={20} />
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#e11d48', margin: 0 }}>Attention Required</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {stats && stats.pendingApproval > 0 && (
                    <Link to={ROUTES.ADMIN_REPORTS} style={{ display: 'flex', justifyContent: 'space-between', padding: 12, background: 'var(--bg-card)', border: '1.5px solid var(--border-color)', borderRadius: 12, textDecoration: 'none', color: 'var(--text-main)', fontWeight: 600, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      <span>Reports awaiting approval</span>
                      <span style={{ background: '#e11d48', color: 'white', padding: '2px 8px', borderRadius: 99, fontSize: 12 }}>{stats.pendingApproval}</span>
                    </Link>
                  )}
                  {stats && stats.pendingScores > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: 12, background: 'var(--bg-card)', border: '1.5px solid var(--border-color)', borderRadius: 12, color: 'var(--text-main)', fontWeight: 600, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      <span>Missing teacher scores</span>
                      <span style={{ background: '#f59e0b', color: 'white', padding: '2px 8px', borderRadius: 99, fontSize: 12 }}>{stats.pendingScores}</span>
                    </div>
                  )}
                  {pendingLeavesCount > 0 && (
                    <Link to="/admin/staff-leave" style={{ display: 'flex', justifyContent: 'space-between', padding: 12, background: 'var(--bg-card)', border: '1.5px solid var(--border-color)', borderRadius: 12, textDecoration: 'none', color: 'var(--text-main)', fontWeight: 600, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      <span>Staff leave requests pending</span>
                      <span style={{ background: '#d97706', color: 'white', padding: '2px 8px', borderRadius: 99, fontSize: 12 }}>{pendingLeavesCount}</span>
                    </Link>
                  )}
                  {pendingExeatsCount > 0 && (
                    <Link to="/admin/exeats" style={{ display: 'flex', justifyContent: 'space-between', padding: 12, background: 'var(--bg-card)', border: '1.5px solid var(--border-color)', borderRadius: 12, textDecoration: 'none', color: 'var(--text-main)', fontWeight: 600, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      <span>Student exeat requests pending</span>
                      <span style={{ background: '#2563eb', color: 'white', padding: '2px 8px', borderRadius: 99, fontSize: 12 }}>{pendingExeatsCount}</span>
                    </Link>
                  )}
                </div>
              </motion.div>
            ) : null}

            {/* Quick Actions Deck */}
            <motion.div variants={itemVariants} className="glass-panel" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 16px', color: 'var(--text-main)' }}>Operations</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { icon: '📁', label: 'Vault', to: '/admin/staff-vault', color: '#facc15' },
                  { icon: '📅', label: 'Calendar', to: ROUTES.ADMIN_CALENDAR, color: '#ef4444' },
                  { icon: '📱', label: 'SMS', to: ROUTES.ADMIN_SMS, color: '#14b8a6' },
                  { icon: '⚙️', label: 'Settings', to: ROUTES.ADMIN_SETTINGS, color: '#64748b' },
                  { icon: '🛏️', label: 'Boarding', to: '/admin/boarding', color: '#10b981' },
                  { icon: '❤️', label: 'Pastoral', to: '/admin/pastoral', color: '#ef4444' },
                ].map(({ icon, label, to, color }) => (
                  <Link key={label} to={to} className="ops-action-card">
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{icon}</div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-main)' }}>{label}</span>
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Live Classroom Coverage Monitor & Teacher Schedule Coverage */}
        <motion.div variants={itemVariants} className="glass-panel" style={{ padding: 32, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
                <h3 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Live Classroom Monitor</h3>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '4px 0 0' }}>
                Active classes, schedules, and assigned teachers on campus today.
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>Classroom Coverage</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981', marginTop: 2 }}>
                  {coverageStats.percentage}% <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>({coverageStats.activeClasses}/{coverageStats.totalClasses} Active)</span>
                </div>
              </div>
              <div style={{ width: 100, height: 8, background: isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ width: `${coverageStats.percentage}%`, height: '100%', background: '#10b981', borderRadius: 99 }} />
              </div>
            </div>
          </div>

          {/* Weekend Mode Indicator */}
          {(new Date().getDay() === 0 || new Date().getDay() === 6) && (
            <div style={{ 
              background: isDark ? 'rgba(99,102,241,0.1)' : '#e0e7ff',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 14, padding: '12px 16px', fontSize: 13, color: isDark ? '#a5b4fc' : '#4f46e5',
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontWeight: 600
            }}>
              💡 Weekend Mode: Currently displaying Monday's simulated class schedules for presentation purposes.
            </div>
          )}

          {/* Classroom Cards Grid */}
          {todayLessons.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-subtle)', fontSize: 14 }}>
              No timetable classes scheduled for today.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              {todayLessons.map((l: any) => (
                <div key={l.id} className="timetable-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <span style={{ 
                      padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
                      background: l.isNow ? (isDark ? 'rgba(16,185,129,0.15)' : '#ecfdf5') : (isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9'),
                      color: l.isNow ? '#10b981' : 'var(--text-muted)',
                      display: 'inline-flex', alignItems: 'center', gap: 6
                    }}>
                      {l.isNow && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'map-pulse 1.8s infinite' }} />}
                      {l.isNow ? 'In Session' : 'Scheduled'}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{l.period?.name}</span>
                  </div>

                  <h4 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px' }}>{l.class?.name}</h4>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#6366f1', marginBottom: 14 }}>{l.subject?.name}</div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-subtle)', fontWeight: 700, textTransform: 'uppercase' }}>Teacher</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', marginTop: 2 }}>{l.teacher?.user?.full_name ?? 'Substitute Assigned'}</div>
                    </div>
                    
                    <button 
                      onClick={() => setLocateClass(l)}
                      style={{ 
                        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', 
                        background: isDark ? 'rgba(99,102,241,0.15)' : '#e0e7ff', color: isDark ? '#a5b4fc' : '#4f46e5',
                        border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.03)' }}
                      onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)' }}
                    >
                      <MapPin size={12} /> Locate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Tier 3: Campus Vital Signs Grid */}
        <div className="tier3-grid">
          
          {/* Column 1: Academic Standings */}
          <motion.div variants={itemVariants} className="glass-panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', minHeight: 380 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Academic Leaders</h3>
              <div style={{ display: 'flex', background: isDark ? 'var(--bg-app)' : '#f1f5f9', borderRadius: 12, padding: 4 }}>
                <button 
                  onClick={() => setTopTab('students')} 
                  className="tab-button"
                  style={{ 
                    background: topTab === 'students' ? 'var(--bg-card)' : 'transparent', 
                    color: topTab === 'students' ? 'var(--text-main)' : 'var(--text-muted)',
                    boxShadow: topTab === 'students' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
                  }}
                >
                  Students
                </button>
                <button 
                  onClick={() => setTopTab('subjects')} 
                  className="tab-button"
                  style={{ 
                    background: topTab === 'subjects' ? 'var(--bg-card)' : 'transparent', 
                    color: topTab === 'subjects' ? 'var(--text-main)' : 'var(--text-muted)',
                    boxShadow: topTab === 'subjects' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
                  }}
                >
                  Subjects
                </button>
              </div>
            </div>
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }} className="hide-scroll">
              <AnimatePresence mode="wait">
                {topTab === 'students' ? (
                  <motion.div key="students" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {topStudents.length ? topStudents.map((s, i) => {
                      const g = getGradeInfo(s.average_score)
                      return (
                        <div key={s.student_id} className="list-item-hover">
                          <div style={{ width: 36, height: 36, borderRadius: 12, background: i === 0 ? (isDark ? '#854d0e' : '#fef3c7') : (isDark ? '#334155' : '#fff'), color: i === 0 ? (isDark ? '#fef08a' : '#d97706') : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, border: '1.5px solid var(--border-light)', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>#{i + 1}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>{s.full_name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{s.class_name}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 16, fontWeight: 800, color: g.color }}>{(s.average_score / 20).toFixed(2)}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-subtle)', fontWeight: 700 }}>GPA</div>
                          </div>
                        </div>
                      )
                    }) : <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-subtle)' }}>No scores available</div>}
                  </motion.div>
                ) : (
                  <motion.div key="subjects" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {topSubjects.length ? topSubjects.map((s, i) => (
                      <div key={s.subject_id} className="list-item-hover">
                        <div style={{ width: 36, height: 36, borderRadius: 12, background: isDark ? 'rgba(99,102,241,0.2)' : '#e0e7ff', color: isDark ? '#a5b4fc' : '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, border: '1.5px solid var(--border-light)', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>#{i + 1}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>{s.name}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 16, fontWeight: 800, color: '#10b981' }}>{s.average.toFixed(1)}%</div>
                          <div style={{ fontSize: 10, color: 'var(--text-subtle)', fontWeight: 700 }}>AVG SCORE</div>
                        </div>
                      </div>
                    )) : <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-subtle)' }}>No subject data available</div>}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Column 2: Gate Security Monitor */}
          <motion.div variants={itemVariants} className="glass-panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', minHeight: 380 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-main)' }}>
                <Navigation size={18} color="#6366f1" /> Campus Security
              </h3>
              <Link to={'/admin/exeats'} style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', textDecoration: 'none' }}>View Log</Link>
            </div>
            
            <div className="hide-scroll" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {outOfCampus.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-subtle)', fontSize: 14, padding: 40 }}>All personnel on campus.</div>
              ) : outOfCampus.map(o => (
                <div key={o.id} className="list-item-hover">
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>{o.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{o.type} • Left at {new Date(o.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Column 3: Attendance Welfare */}
          <motion.div variants={itemVariants} className="glass-panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', minHeight: 380 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Absentee Alert</h3>
              <span style={{ background: isDark ? 'rgba(239,68,68,0.2)' : '#fef2f2', color: '#ef4444', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 800 }}>{absentStudents.length} Students</span>
            </div>
            
            <div className="hide-scroll" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {absentStudents.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-subtle)', fontSize: 14, padding: 40 }}>No absences reported today.</div>
              ) : absentStudents.map(a => (
                <div key={a.student_id} className="list-item-hover" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-main)' }}>{a.full_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.class_name}</div>
                    </div>
                  </div>
                  
                  <div style={{ background: 'var(--bg-card)', padding: 12, borderRadius: 12, border: '1.5px solid var(--border-light)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Contact Guardian</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      👤 {a.guardian_name || 'N/A'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#6366f1' }}>{a.guardian_phone || 'No phone'}</span>
                      {a.guardian_phone && (
                        <a href={`tel:${a.guardian_phone}`} style={{ width: 28, height: 28, background: isDark ? 'rgba(99,102,241,0.2)' : '#e0e7ff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? '#a5b4fc' : '#4f46e5', textDecoration: 'none' }}>
                          <Phone size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

        </div>

        {/* MAP MODAL */}
        {locateClass && (
          <div 
            onClick={() => setLocateClass(null)}
            style={{
              position: 'fixed', inset: 0, zIndex: 1000, 
              background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
            }}
          >
            <div 
              onClick={e => e.stopPropagation()}
              style={{
                background: 'var(--bg-card)', borderRadius: 24, width: '100%', maxWidth: 840,
                maxHeight: 'calc(100vh - 48px)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.2)', border: '1.5px solid var(--border-color)',
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
                fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
              }}
            >
              {/* Modal Header */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Navigation color="#6366f1" size={20} />
                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Campus Classroom Directory</h3>
                </div>
                <button onClick={() => setLocateClass(null)} style={{ background: isDark ? 'var(--bg-app)' : '#f1f5f9', border: 'none', borderRadius: 10, padding: 8, cursor: 'pointer', color: 'var(--text-muted)', fontWeight: 'bold' }}>✕</button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: 24, display: 'flex', gap: 24, flexWrap: 'wrap', overflowY: 'auto', flex: 1 }}>
                {/* Visual Map Column (Left) */}
                <div style={{ flex: '1 1 450px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Visual Location Map</div>
                  
                  {/* Outer Map Grid */}
                  <div style={{ 
                    background: isDark ? 'rgba(15,23,42,0.4)' : '#f8fafc',
                    border: '1.5px dashed var(--border-color)', borderRadius: 16,
                    padding: 24, minHeight: 260, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16,
                    position: 'relative'
                  }}>
                    {/* Block A */}
                    <div className={`campus-block ${locateClass.class?.name?.includes('10') || locateClass.class?.name?.includes('A') ? 'active-block' : ''}`}>
                      <span style={{ fontSize: 24 }}>🏫</span>
                      <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-main)' }}>Block A</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Science & Admin</div>
                      { (locateClass.class?.name?.includes('10') || locateClass.class?.name?.includes('A')) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                          <div className="pulse-dot" />
                          <span style={{ fontSize: 11, fontWeight: 800, color: '#10b981' }}>{locateClass.class?.name} Room</span>
                        </div>
                      )}
                    </div>

                    {/* Block B */}
                    <div className={`campus-block ${locateClass.class?.name?.includes('11') || locateClass.class?.name?.includes('B') ? 'active-block' : ''}`}>
                      <span style={{ fontSize: 24 }}>📚</span>
                      <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-main)' }}>Block B</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Humanities & Library</div>
                      { (locateClass.class?.name?.includes('11') || locateClass.class?.name?.includes('B')) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                          <div className="pulse-dot" />
                          <span style={{ fontSize: 11, fontWeight: 800, color: '#10b981' }}>{locateClass.class?.name} Room</span>
                        </div>
                      )}
                    </div>

                    {/* Block C */}
                    <div className={`campus-block ${!(locateClass.class?.name?.includes('10') || locateClass.class?.name?.includes('A') || locateClass.class?.name?.includes('11') || locateClass.class?.name?.includes('B')) ? 'active-block' : ''}`}>
                      <span style={{ fontSize: 24 }}>💻</span>
                      <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-main)' }}>Block C</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Math & Technology</div>
                      { !(locateClass.class?.name?.includes('10') || locateClass.class?.name?.includes('A') || locateClass.class?.name?.includes('11') || locateClass.class?.name?.includes('B')) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                          <div className="pulse-dot" />
                          <span style={{ fontSize: 11, fontWeight: 800, color: '#10b981' }}>{locateClass.class?.name} Room</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Gate to Block directions */}
                  <div style={{ background: isDark ? 'var(--bg-app)' : '#f1f5f9', padding: '12px 16px', borderRadius: 12, fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    📍 <strong>Main Gate Entrance</strong> ────────▶ <strong>Administration Archway</strong> ────────▶ <strong>Active Building Highlighted</strong>
                  </div>
                </div>

                {/* Details Column (Right) */}
                <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Class Details</div>
                    <div style={{ background: isDark ? 'var(--bg-app)' : '#f8fafc', padding: 16, borderRadius: 16, border: '1.5px solid var(--border-color)' }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-main)', marginBottom: 4 }}>{locateClass.class?.name}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#6366f1', marginBottom: 12 }}>{locateClass.subject?.name}</div>
                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Instructor:</span>
                          <strong style={{ color: 'var(--text-main)' }}>{locateClass.teacher?.user?.full_name ?? 'Substitute Assigned'}</strong>
                        </div>
                        <div style={{ fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Period:</span>
                          <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{locateClass.period?.name} ({locateClass.period?.start_time?.slice(0, 5)} - {locateClass.period?.end_time?.slice(0, 5)})</span>
                        </div>
                        <div style={{ fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Session:</span>
                          <span style={{ color: locateClass.isNow ? '#10b981' : '#f59e0b', fontWeight: 800, textTransform: 'uppercase', fontSize: 11 }}>
                            {locateClass.isNow ? '● IN SESSION' : '○ UPCOMING'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Directions from Office</div>
                    <div style={{ border: '1.5px solid var(--border-color)', padding: 16, borderRadius: 16, background: 'var(--bg-card)' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
                        <div style={{ background: '#6366f1', color: 'white', width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 'bold', flexShrink: 0 }}>1</div>
                        <div style={{ fontSize: 12, color: 'var(--text-main)', lineHeight: 1.4 }}>
                          {locateClass.class?.name?.includes('10') || locateClass.class?.name?.includes('A') 
                            ? 'Head to Block A (Administration & Science Block).' 
                            : locateClass.class?.name?.includes('11') || locateClass.class?.name?.includes('B')
                              ? 'Proceed past Block A towards Block B (Humanities Block).'
                              : 'Head straight to Block C (Math & Tech Block) near the labs.'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
                        <div style={{ background: '#6366f1', color: 'white', width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 'bold', flexShrink: 0 }}>2</div>
                        <div style={{ fontSize: 12, color: 'var(--text-main)', lineHeight: 1.4 }}>
                          Take the central stairwell to the <strong>2nd Floor</strong>.
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <div style={{ background: '#6366f1', color: 'white', width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 'bold', flexShrink: 0 }}>3</div>
                        <div style={{ fontSize: 12, color: 'var(--text-main)', lineHeight: 1.4 }}>
                          Room is on your immediate left, designated as <strong>Room {locateClass.class?.name?.match(/\d+/)?.[0] ?? '20'}{locateClass.class?.name?.slice(-1) || 'A'}</strong>.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{ padding: '16px 24px', background: isDark ? 'rgba(15,23,42,0.4)' : '#f8fafc', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setLocateClass(null)} style={{ background: '#6366f1', color: 'white', border: 'none', borderRadius: 12, padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Close Directory</button>
              </div>
            </div>
          </div>
        )}

      </motion.div>
    </>
  )
}
