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
import SchoolOnboardingWizard from '../../components/ui/SchoolOnboardingWizard'
import { useSettings } from '../../hooks/useSettings'
import { useBranches } from '../../hooks/useBranches'
import { AreaChart, Area, BarChart, Bar, Cell, Legend, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, MessageSquare, MapPin, Activity, BookOpen, AlertCircle, ArrowUpRight, CheckCircle2, Navigation, Calendar, UserCheck, Clock, Award, ShieldAlert, CheckSquare, Users, FolderLock, Settings, Bed, HeartHandshake, ClipboardCheck, PencilLine, Banknote } from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'

import { useAutoRefresh } from "../../hooks/useAutoRefresh";

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
interface RecentActivity { type: string; label: string; sub: string; time: string; icon: React.ReactNode; color: string }

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
    useAutoRefresh(loadAll);
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
  const { data: settings } = useSettings()
  const { data: branches = [] } = useBranches()

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
  const [showOnboardingWizard, setShowOnboardingWizard] = useState(false)
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
    // Show onboarding for admins on every visit until they explicitly click done
    if (user?.role === 'admin') {
      const seenWizard = localStorage.getItem(`onboarding_wizard_complete_${user?.id}`)
      if (seenWizard !== 'true') {
        setShowOnboardingWizard(true)
      }
    }
  }, [user?.role, user?.id])

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
      if (s.person_type === 'student') name = stuNames.find((x: any) => x.id === s.person_db_id)?.full_name || 'Student'
      if (s.person_type === 'staff') name = staffNames.find((x: any) => x.id === s.person_db_id)?.user?.full_name || 'Staff'
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

    const mapped = (absentData || []).map((a: any) => ({
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

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
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
      // chat_messages has no school_id — count via conversations this school belongs to
      (async () => {
        const { data: convIds } = await supabase.from('chat_conversations').select('id').eq('school_id', sid)
        if (!convIds?.length) return { count: 0 }
        return supabase.from('chat_messages').select('*', { count: 'exact', head: true })
          .in('conversation_id', convIds.map((c: any) => c.id))
          .gt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      })(),
      supabase.from('assignments').select('*', { count: 'exact', head: true }).eq('school_id', sid),
      supabase.from('assignment_submissions').select('*, assignment:assignments!inner(*)', { count: 'exact', head: true }).eq('assignments.school_id', sid),
      supabase.from('announcements').select('*', { count: 'exact', head: true }).eq('school_id', sid),
    ])

    const totalForReports = students ?? 0
    let reports = 0, pendingScores = 0, totalDebt = 0, pendingApproval = 0
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
    recentSubs?.forEach((s: any) => activities.push({ type: 'quiz', label: `${s.student?.full_name} submitted "${s.assignment?.title}"`, sub: 'Quiz submission', time: s.submitted_at, icon: <ClipboardCheck size={16} />, color: '#6d28d9' }))
    recentScores?.slice(0, 3).forEach((s: any) => activities.push({ type: 'score', label: `Score entered for ${s.student?.full_name} — ${s.subject?.name}`, sub: `${s.total_score?.toFixed(1)}%`, time: s.updated_at, icon: <PencilLine size={16} />, color: '#0891b2' }))
    recentStudents?.forEach((s: any) => activities.push({ type: 'student', label: `New student: ${s.full_name}`, sub: 'Enrolled', time: s.created_at, icon: <UserCheck size={16} />, color: '#16a34a' }))
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
    const results: ClassStat[] = await Promise.all((Array.isArray(classes) ? classes : []).map(async (cls) => {
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
    try {
      const [leavesRes, exeatsRes] = await Promise.all([
        supabase.from('leave_requests').select('id', { count: 'exact', head: true }).eq('school_id', user.school_id).eq('status', 'pending'),
        supabase.from('exeat_requests').select('id', { count: 'exact', head: true }).eq('school_id', user.school_id).eq('status', 'pending')
      ])
      setPendingLeavesCount(leavesRes.count ?? 0)
      setPendingExeatsCount(exeatsRes.count ?? 0)
    } catch {
      // Tables may not exist yet — fail silently
    }
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

  const now = new Date()
  const todayStr = now.toLocaleDateString('en-GH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const userName = user?.full_name?.split(' ')?.slice(0, 2).join(' ') || 'Admin'
  const { timeGreeting: greeting } = getEngagingGreeting(user?.role)

  // KPI definitions
  const kpis = [
    { label: 'Students', value: stats?.students ?? 0, icon: '🎒', color: '#2563EB', bg: 'rgba(37,99,235,0.08)', to: '/admin/student-hub', trend: '+3 this week' },
    { label: 'Teachers', value: stats?.teachers ?? 0, icon: '👨‍🏫', color: '#7C3AED', bg: 'rgba(124,58,237,0.08)', to: '/admin/staff-hub', trend: 'Active staff' },
    { label: 'Classes', value: stats?.classes ?? 0, icon: '🏫', color: '#0891B2', bg: 'rgba(8,145,178,0.08)', to: '/admin/academic-hub', trend: `${coverageStats.activeClasses} active now` },
    { label: 'Present Today', value: stats?.presentToday ?? 0, icon: '✅', color: '#16A34A', bg: 'rgba(22,163,74,0.08)', to: ROUTES.ADMIN_ATTENDANCE, trend: `${stats?.absentToday ?? 0} absent` },
    { label: 'Total Debt', value: stats?.totalDebt ?? 0, icon: '⚠️', color: '#DC2626', bg: 'rgba(220,38,38,0.08)', to: '/admin/billing', isCurrency: true, trend: 'Outstanding fees' },
    { label: 'Messages', value: stats?.unreadMessages ?? 0, icon: '💬', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', to: '/admin/communications-hub', trend: '7-day window' },
  ]

  // Quick actions
  const quickActions = [
    { label: 'Take Attendance', icon: ClipboardCheck, color: '#2563EB', to: ROUTES.ADMIN_ATTENDANCE },
    { label: 'Score Entry', icon: PencilLine, color: '#7C3AED', to: '/admin/assessment-hub' },
    { label: 'Add Student', icon: Users, color: '#16A34A', to: '/admin/student-hub' },
    { label: 'Add Staff', icon: UserCheck, color: '#0891B2', to: '/admin/staff-hub' },
    { label: 'Announcement', icon: MessageSquare, color: '#F59E0B', to: '/admin/communications-hub' },
    { label: 'Timetable', icon: Calendar, color: '#EC4899', to: ROUTES.ADMIN_TIMETABLE },
    { label: 'Weekly Goals', icon: Award, color: '#10B981', to: ROUTES.ADMIN_WEEKLY_GOALS },
    { label: 'Analytics', icon: Activity, color: '#6366F1', to: ROUTES.ADMIN_ANALYTICS },
    { label: 'Billing', icon: Banknote, color: '#F97316', to: '/admin/billing' },
    { label: 'Settings', icon: Settings, color: '#64748B', to: '/admin/settings-hub' },
  ]

  return (
    <>
      {showOnboardingWizard && <SchoolOnboardingWizard onClose={() => setShowOnboardingWizard(false)} />}

      <style>{`
        .adm-dash {
          font-family: 'Inter', system-ui, sans-serif;
          color: var(--text-primary, #0F172A);
          padding: 28px 32px 80px;
          max-width: 1600px;
          margin: 0 auto;
        }
        @media (max-width: 1024px) { .adm-dash { padding: 20px 20px 80px; } }
        @media (max-width: 600px)  { .adm-dash { padding: 16px 14px 80px; } }

        .adm-kpi-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 16px;
          margin-bottom: 28px;
        }
        @media (max-width: 1200px) { .adm-kpi-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 640px)  { .adm-kpi-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; } }

        .adm-kpi {
          background: var(--bg-card, #fff);
          border: 1px solid var(--border-color, #E5E7EB);
          border-radius: 14px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
          text-decoration: none;
          color: inherit;
          display: flex;
          flex-direction: column;
          gap: 12px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .adm-kpi::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: var(--adm-kpi-c, #2563EB);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .adm-kpi:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.08); border-color: var(--adm-kpi-c, #2563EB); }
        .adm-kpi:hover::after { opacity: 1; }

        .adm-section {
          background: var(--bg-card, #fff);
          border: 1px solid var(--border-color, #E5E7EB);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .adm-section-head {
          padding: 18px 22px;
          border-bottom: 1px solid var(--border-color, #E5E7EB);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .adm-section-title {
          font-size: 15px; font-weight: 800;
          color: var(--text-primary, #0F172A);
          letter-spacing: -0.01em;
          font-family: 'Outfit', 'Inter', sans-serif;
        }
        .adm-section-body { padding: 20px 22px; }

        .adm-body-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        @media (max-width: 1100px) { .adm-body-grid { grid-template-columns: 1fr; } }

        .adm-3col {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        @media (max-width: 1200px) { .adm-3col { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 768px) { .adm-3col { grid-template-columns: 1fr; } }

        .adm-qa-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 10px;
        }
        @media (max-width: 900px)  { .adm-qa-grid { grid-template-columns: repeat(4, 1fr); } }
        @media (max-width: 640px)  { .adm-qa-grid { grid-template-columns: repeat(3, 1fr); gap: 8px; } }
        @media (max-width: 400px)  { .adm-qa-grid { grid-template-columns: repeat(2, 1fr); } }

        .adm-qa-item {
          display: flex; flex-direction: column; align-items: center;
          gap: 8px; padding: 14px 8px;
          background: var(--bg-hover, #F1F5F9);
          border-radius: 14px;
          text-decoration: none; color: inherit;
          border: 1px solid transparent;
          transition: all 0.2s;
          cursor: pointer;
        }
        .adm-qa-item:hover {
          background: var(--bg-card, #fff);
          border-color: var(--border-color, #E5E7EB);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.08);
        }

        .adm-table { width: 100%; border-collapse: collapse; white-space: nowrap; }
        .adm-table th { padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 800; color: var(--text-muted,#6B7280); text-transform: uppercase; letter-spacing: 0.06em; background: var(--bg-hover,#F1F5F9); border-bottom: 1px solid var(--border-color,#E5E7EB); }
        .adm-table td { padding: 12px 14px; font-size: 13px; font-weight: 500; color: var(--text-primary,#0F172A); border-bottom: 1px solid var(--border-color,#E5E7EB); }
        .adm-table tr:last-child td { border-bottom: none; }
        .adm-table tbody tr { transition: background 0.15s; }
        .adm-table tbody tr:hover { background: var(--bg-hover,#F1F5F9); }

        .adm-activity-item {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid var(--border-color, #E5E7EB);
        }
        .adm-activity-item:last-child { border-bottom: none; }

        .adm-lesson-row {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid var(--border-color, #E5E7EB);
        }
        .adm-lesson-row:last-child { border-bottom: none; }

        .adm-absent-row {
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; padding: 10px 0;
          border-bottom: 1px solid var(--border-color, #E5E7EB);
        }
        .adm-absent-row:last-child { border-bottom: none; }

        .adm-tab-bar {
          display: flex; gap: 4px;
          background: var(--bg-hover, #F1F5F9);
          padding: 4px;
          border-radius: 10px;
          width: fit-content;
        }
        .adm-tab {
          padding: 7px 16px; border-radius: 8px;
          font-size: 12px; font-weight: 700;
          color: var(--text-muted, #6B7280);
          cursor: pointer; transition: all 0.15s;
          border: none; background: none;
        }
        .adm-tab.active {
          background: var(--bg-card, #fff);
          color: var(--text-primary, #0F172A);
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
        }

        @keyframes adm-fade-up { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        .adm-anim { animation: adm-fade-up 0.4s cubic-bezier(0.2,0.8,0.2,1) both; }
      `}</style>

      <motion.div
        className="adm-dash"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >

        {/* ── HERO ────────────────────────────────────────────────────────── */}
        <div style={{
          borderRadius: 20,
          padding: '32px 36px',
          marginBottom: 24,
          background: 'linear-gradient(135deg, #1E1B4B 0%, #2563EB 60%, #7C3AED 100%)',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }} className="adm-anim">
          {/* Decorative circles */}
          <div style={{ position: 'absolute', top: -60, right: -40, width: 260, height: 260, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -80, right: 120, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, position: 'relative', zIndex: 1 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.65, marginBottom: 6 }}>
                ACADERA COMMAND CENTER
              </div>
              <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(22px, 3.5vw, 34px)', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 8, lineHeight: 1.1 }}>
                {greeting}, {userName} 👋
              </h1>
              <p style={{ fontSize: 14, opacity: 0.78, fontWeight: 500, marginBottom: 20, maxWidth: 520 }}>
                {term ? `${year?.name ?? ''} · ${term.name}` : 'No active academic period'} · {todayStr}
              </p>
              {/* Stat pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {[
                  { label: `${stats?.students ?? 0} Students`, bg: 'rgba(255,255,255,0.15)' },
                  { label: `${stats?.classes ?? 0} Classes`, bg: 'rgba(255,255,255,0.12)' },
                  { label: `${stats?.presentToday ?? 0} Present`, bg: 'rgba(34,197,94,0.25)' },
                  { label: `${coverageStats.activeClasses} Active Now`, bg: 'rgba(255,200,0,0.2)' },
                ].map(p => (
                  <span key={p.label} style={{ background: p.bg, color: '#fff', fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 99, backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.15)' }}>
                    {p.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Clock + pending alerts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end', minWidth: 180 }}>
              <div style={{ fontFamily: "'Outfit', monospace", fontSize: 42, fontWeight: 900, letterSpacing: -2, opacity: 0.95, lineHeight: 1 }}>
                <DashboardClock />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {pendingLeavesCount > 0 && (
                  <span onClick={() => navigate('/admin/staff-hub')} style={{ cursor: 'pointer', background: 'rgba(245,158,11,0.25)', color: '#fde68a', fontSize: 11, fontWeight: 800, padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(245,158,11,0.4)' }}>
                    ⏳ {pendingLeavesCount} Leave{pendingLeavesCount !== 1 ? 's' : ''}
                  </span>
                )}
                {pendingExeatsCount > 0 && (
                  <span onClick={() => navigate('/admin/campus-hub')} style={{ cursor: 'pointer', background: 'rgba(99,102,241,0.25)', color: '#c7d2fe', fontSize: 11, fontWeight: 800, padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(99,102,241,0.4)' }}>
                    🚪 {pendingExeatsCount} Exeat{pendingExeatsCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <Link to="/admin/tasks" style={{ textDecoration: 'none' }}>
                <div style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 12, fontWeight: 700, padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6, backdropFilter: 'blur(4px)' }}>
                  <CheckSquare size={14} /> Admin Tasks
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* ── KPI ROW ──────────────────────────────────────────────────────── */}
        <div className="adm-kpi-grid adm-anim" style={{ animationDelay: '0.06s' }}>
          {kpis.map((k, i) => (
            <Link key={k.label} to={k.to} className="adm-kpi" style={{ '--adm-kpi-c': k.color } as any}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  {k.icon}
                </div>
                <ArrowUpRight size={14} color="var(--text-subtle, #9CA3AF)" />
              </div>
              <div>
                <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-primary, #0F172A)', lineHeight: 1 }}>
                  {k.isCurrency ? `₵${(k.value / 1000).toFixed(0)}K` : <AnimNum to={k.value} duration={800 + i * 80} />}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted, #6B7280)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{k.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-subtle, #9CA3AF)', marginTop: 3, fontWeight: 500 }}>{k.trend}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* ── QUICK ACTIONS ────────────────────────────────────────────────── */}
        <div className="adm-section adm-anim" style={{ marginBottom: 20, animationDelay: '0.12s' }}>
          <div className="adm-section-head">
            <span className="adm-section-title">⚡ Quick Actions</span>
          </div>
          <div style={{ padding: '16px 20px' }}>
            <div className="adm-qa-grid">
              {quickActions.map(({ label, icon: Icon, color, to }) => (
                <div key={label} className="adm-qa-item" onClick={() => navigate(to)} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && navigate(to)}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${color}25` }}>
                    <Icon size={20} color={color} strokeWidth={2} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary, #374151)', textAlign: 'center', lineHeight: 1.3 }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── ANALYTICS TABS ───────────────────────────────────────────────── */}
        <div className="adm-section adm-anim" style={{ marginBottom: 20, animationDelay: '0.18s' }}>
          <div className="adm-section-head">
            <span className="adm-section-title">📊 Analytics</span>
            <div className="adm-tab-bar">
              {(['financials', 'academics', 'goals'] as const).map(tab => (
                <button key={tab} className={`adm-tab${activeAnalyticsTab === tab ? ' active' : ''}`} onClick={() => setActiveAnalyticsTab(tab)}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="adm-section-body">

            {activeAnalyticsTab === 'financials' && (
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 14 }}>Fee Collections — Last 6 Months</div>
                {financeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={financeData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="adm-fee-grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #E5E7EB)" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted, #6B7280)', fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted, #6B7280)' }} axisLine={false} tickLine={false} tickFormatter={v => `₵${(v / 1000).toFixed(0)}K`} />
                      <Tooltip formatter={(v: any) => [`₵${Number(v).toLocaleString()}`, 'Collected']} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 10, fontSize: 12, fontFamily: 'Inter' }} />
                      <Area type="monotone" dataKey="amount" stroke="#2563EB" strokeWidth={2.5} fill="url(#adm-fee-grad)" dot={{ fill: '#2563EB', r: 3 }} activeDot={{ r: 5 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                    No payment data yet
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 16 }}>
                  {[
                    { label: 'Total Debt', value: `₵${((stats?.totalDebt ?? 0) / 1000).toFixed(1)}K`, color: '#DC2626' },
                    { label: 'Subjects', value: stats?.subjects ?? 0, color: '#7C3AED' },
                    { label: 'Announcements', value: stats?.totalAnnouncements ?? 0, color: '#F59E0B' },
                  ].map(m => (
                    <div key={m.label} style={{ background: 'var(--bg-hover)', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 22, fontWeight: 800, color: m.color }}>{m.value}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeAnalyticsTab === 'academics' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Top Students */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Top Students</div>
                  {topStudents.length > 0 ? topStudents.map((s, i) => (
                    <div key={s.student_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < topStudents.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                      <div style={{ width: 24, height: 24, borderRadius: 8, background: i === 0 ? '#FEF3C7' : i === 1 ? '#F1F5F9' : 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: i === 0 ? '#D97706' : i === 1 ? '#64748B' : 'var(--text-muted)', flexShrink: 0 }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.full_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{s.class_name}</div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: getGradeInfo(s.average_score).color, background: `${getGradeInfo(s.average_score).color}15`, padding: '2px 8px', borderRadius: 6 }}>
                        {s.average_score.toFixed(1)}%
                      </div>
                    </div>
                  )) : <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '24px 0', textAlign: 'center' }}>No scores recorded yet</div>}
                </div>
                {/* Top Subjects */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Top Subjects</div>
                  {topSubjects.length > 0 ? (
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={topSubjects} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-primary)', fontWeight: 600 }} axisLine={false} tickLine={false} width={80} />
                        <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 10, fontSize: 12 }} formatter={(v: any) => [`${Number(v).toFixed(1)}%`, 'Avg Score']} />
                        <Bar dataKey="average" radius={[0, 6, 6, 0]}>
                          {topSubjects.map((_, i) => (
                            <Cell key={i} fill={['#2563EB', '#7C3AED', '#0891B2', '#16A34A', '#F59E0B'][i % 5]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '24px 0', textAlign: 'center' }}>No scores recorded yet</div>}
                </div>
              </div>
            )}

            {activeAnalyticsTab === 'goals' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Goals ring */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
                    <svg viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border-color)" strokeWidth="10" />
                      <circle cx="60" cy="60" r="50" fill="none" stroke="#2563EB" strokeWidth="10"
                        strokeDasharray={`${2 * Math.PI * 50 * weeklyGoalsStats.percentage / 100} ${2 * Math.PI * 50}`}
                        strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s ease' }} />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                      <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 24, fontWeight: 900, color: '#2563EB' }}>{weeklyGoalsStats.percentage}%</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
                      {weeklyGoalsStats.completed} / {weeklyGoalsStats.total} Goals
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 14 }}>Weekly term goals completed</div>
                    <Link to={ROUTES.ADMIN_WEEKLY_GOALS} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, background: '#2563EB', color: '#fff', fontWeight: 700, fontSize: 13, padding: '9px 18px', borderRadius: 10, transition: 'all 0.2s' }}>
                      Manage Goals →
                    </Link>
                  </div>
                </div>
                {/* Reports progress */}
                <div style={{ background: 'var(--bg-hover)', borderRadius: 12, padding: '16px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    <span>Report Cards Generated</span>
                    <span style={{ color: '#2563EB' }}>{reportPct}%</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 99, background: 'var(--border-color)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${reportPct}%`, borderRadius: 99, background: 'linear-gradient(90deg, #2563EB, #7C3AED)', transition: 'width 1s ease' }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, fontWeight: 500 }}>
                    {stats?.reportsGenerated ?? 0} of {stats?.totalStudentsForReports ?? 0} students
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── BODY: Timetable + Activity | Right Panel ─────────────────────── */}
        <div className="adm-body-grid adm-anim" style={{ animationDelay: '0.24s' }}>

          {/* LEFT: Today's Timetable + Recent Activity */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Today's Timetable */}
            <div className="adm-section">
              <div className="adm-section-head">
                <span className="adm-section-title">📅 Today's Timetable</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {coverageStats.totalClasses > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(22,163,74,0.1)', color: '#16A34A', padding: '4px 10px', borderRadius: 99, border: '1px solid rgba(22,163,74,0.2)' }}>
                      🟢 {coverageStats.activeClasses}/{coverageStats.totalClasses} Active
                    </span>
                  )}
                  <Link to={ROUTES.ADMIN_TIMETABLE} style={{ textDecoration: 'none', fontSize: 12, fontWeight: 700, color: '#2563EB' }}>View All →</Link>
                </div>
              </div>
              <div style={{ padding: '0 22px 4px', maxHeight: 260, overflowY: 'auto' }}>
                {todayLessons.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                    No lessons scheduled today
                  </div>
                ) : todayLessons.slice(0, 8).map((lesson, i) => (
                  <div key={lesson.id} className="adm-lesson-row">
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: lesson.isNow ? '#16A34A' : 'var(--border-color)', flexShrink: 0, ...(lesson.isNow ? { boxShadow: '0 0 6px #16A34A', animation: 'pulse 1.5s ease infinite' } : {}) }} />
                    <div style={{ width: 88, flexShrink: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: lesson.isNow ? '#16A34A' : 'var(--text-muted)' }}>
                        {lesson.period?.start_time?.slice(0, 5)} – {lesson.period?.end_time?.slice(0, 5)}
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {(lesson.subject as any)?.name ?? '—'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                        {(lesson.class as any)?.name ?? '—'} · {(lesson.teacher as any)?.user?.full_name ?? 'Unassigned'}
                      </div>
                    </div>
                    {lesson.isNow && (
                      <span style={{ fontSize: 10, fontWeight: 800, background: 'rgba(22,163,74,0.12)', color: '#16A34A', padding: '3px 8px', borderRadius: 6, flexShrink: 0 }}>NOW</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="adm-section">
              <div className="adm-section-head">
                <span className="adm-section-title">🕐 Recent Activity</span>
              </div>
              <div style={{ padding: '0 22px 8px', maxHeight: 260, overflowY: 'auto' }}>
                {recentActivities.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 13 }}>No recent activity</div>
                ) : recentActivities.map((a, i) => (
                  <div key={i} className="adm-activity-item">
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${a.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: a.color }}>
                      {a.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{a.sub}</div>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-subtle)', fontWeight: 500, flexShrink: 0 }}>{timeAgo(a.time)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Announcements + Absent Students + Gate Activity */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Announcements */}
            <div className="adm-section">
              <div className="adm-section-head">
                <span className="adm-section-title">📣 Announcements</span>
                <Link to="/admin/communications-hub" style={{ textDecoration: 'none', fontSize: 12, fontWeight: 700, color: '#2563EB' }}>+ New</Link>
              </div>
              <div style={{ padding: '4px 0 8px' }}>
                {announcements.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>No announcements yet</div>
                ) : announcements.map((a, i) => (
                  <div key={a.id} style={{ display: 'flex', gap: 12, padding: '12px 20px', borderBottom: i < announcements.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#7C3AED', marginTop: 6, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>{a.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{timeAgo(a.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Absent Students */}
            <div className="adm-section">
              <div className="adm-section-head">
                <span className="adm-section-title">🔴 Absent Today</span>
                <span style={{ fontSize: 11, fontWeight: 800, background: 'rgba(220,38,38,0.1)', color: '#DC2626', padding: '3px 10px', borderRadius: 99 }}>
                  {absentStudents.length}
                </span>
              </div>
              <div style={{ padding: '4px 22px 8px', maxHeight: 200, overflowY: 'auto' }}>
                {absentStudents.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                    <span style={{ fontSize: 24 }}>✅</span><br />No absences recorded yet
                  </div>
                ) : absentStudents.slice(0, 6).map(s => (
                  <div key={s.student_id} className="adm-absent-row">
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{s.full_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{s.class_name}</div>
                    </div>
                    {s.guardian_phone && (
                      <a href={`tel:${s.guardian_phone}`} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#16A34A', fontWeight: 700, textDecoration: 'none', background: 'rgba(22,163,74,0.08)', padding: '4px 8px', borderRadius: 8 }}>
                        <Phone size={11} /> Call
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Out of Campus */}
            {outOfCampus.length > 0 && (
              <div className="adm-section">
                <div className="adm-section-head">
                  <span className="adm-section-title">🚪 Out of Campus</span>
                  <span style={{ fontSize: 11, fontWeight: 800, background: 'rgba(245,158,11,0.1)', color: '#F59E0B', padding: '3px 10px', borderRadius: 99 }}>
                    {outOfCampus.length}
                  </span>
                </div>
                <div style={{ padding: '4px 22px 8px', maxHeight: 160, overflowY: 'auto' }}>
                  {outOfCampus.slice(0, 5).map(g => (
                    <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                      <Navigation size={14} color="#F59E0B" />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{g.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{g.type} · {g.time?.slice(0, 5)}</div>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(245,158,11,0.1)', color: '#F59E0B', padding: '2px 8px', borderRadius: 6 }}>OUT</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── CLASS PERFORMANCE TABLE ─────────────────────────────────────── */}
        {classStats.length > 0 && (
          <div className="adm-section adm-anim" style={{ marginBottom: 20, animationDelay: '0.3s' }}>
            <div className="adm-section-head">
              <span className="adm-section-title">🏆 Class Performance</span>
              <Link to="/admin/academic-hub" style={{ textDecoration: 'none', fontSize: 12, fontWeight: 700, color: '#2563EB' }}>View All →</Link>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Class</th>
                    <th>Students</th>
                    <th>Avg Score</th>
                    <th>Reports Done</th>
                    <th>Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {classStats.slice(0, 8).map(cls => {
                    const gi = getGradeInfo(cls.avg_score ?? 0)
                    const pct = cls.student_count > 0 ? Math.round(cls.reports_done / cls.student_count * 100) : 0
                    return (
                      <tr key={cls.id}>
                        <td style={{ fontWeight: 700 }}>{cls.name}</td>
                        <td>{cls.student_count}</td>
                        <td>
                          {cls.avg_score != null ? (
                            <span style={{ fontWeight: 800, color: gi.color, background: `${gi.color}15`, padding: '2px 8px', borderRadius: 6 }}>
                              {cls.avg_score.toFixed(1)}%
                            </span>
                          ) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                        </td>
                        <td>{cls.reports_done} / {cls.student_count}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 120 }}>
                            <div style={{ flex: 1, height: 6, borderRadius: 99, background: 'var(--bg-hover)', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: pct >= 80 ? '#16A34A' : pct >= 50 ? '#F59E0B' : '#DC2626', transition: 'width 0.8s ease' }} />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', minWidth: 32 }}>{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </motion.div>
    </>
  )
}
