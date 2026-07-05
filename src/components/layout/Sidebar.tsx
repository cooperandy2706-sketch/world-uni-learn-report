// src/components/layout/Sidebar.tsx
import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import { useSchoolStorage } from '../../hooks/useSchoolStorage'
import { useSettings } from '../../hooks/useSettings'
import { dailyFeesService } from '../../services/bursar.service'
import { supabase } from '../../lib/supabase'
import { ROUTES } from '../../constants/routes'
import {
  LayoutDashboard, Users, UserCheck, School, BookOpen, Building2,
  Calendar, FileSpreadsheet, BarChart3, Settings, Megaphone,
  Target, ClipboardCheck, PencilLine, Bell, Timer, ClipboardList,
  MessageSquare, Trophy, ShieldCheck, LogOut, Book,
  ChevronLeft, ChevronRight, Wallet, Banknote, Receipt, TrendingDown,
  TrendingUp, AlertCircle, CreditCard, FileText, ShoppingBag,
  Package, Gamepad2, Library, Vote, Image, Plus, Monitor,
  ScanLine, Printer, AlertTriangle, MapPin, Pill, History,
  Search, MonitorPlay, ChevronDown, Globe, Box, Tv
} from 'lucide-react'

/* ── Nav definitions (unchanged from original) ── */
const adminLinks: any[] = [
  { header: 'General' },
  { to: ROUTES.ADMIN_DASHBOARD,        label: 'Dashboard',          icon: LayoutDashboard },
  { to: '/admin/tasks',                label: 'Admin Tasks',         icon: ClipboardCheck },
  { to: ROUTES.ADMIN_CALENDAR,         label: 'School Calendar',     icon: Calendar },
  { to: '/admin/communications-hub',   label: 'Communications',      icon: MessageSquare },
  { header: 'Academics' },
  { to: '/admin/academic-hub',         label: 'Academic Hub',        icon: Box },
  { to: '/admin/assessment-hub',       label: 'Assessment Hub',      icon: FileSpreadsheet },
  { to: ROUTES.ADMIN_ATTENDANCE,       label: 'Attendance',          icon: ClipboardCheck },
  { to: ROUTES.ADMIN_TIMETABLE,        label: 'Timetable',           icon: Timer },
  { to: ROUTES.ADMIN_WEEKLY_GOALS,     label: 'Weekly Goals',        icon: Target },
  { header: 'People' },
  { to: '/admin/student-hub',          label: 'Student Hub',         icon: Users },
  { to: '/admin/staff-hub',            label: 'Staff Hub',           icon: UserCheck },
  { header: 'HR & Operations' },
  { to: '/admin/campus-hub',           label: 'Campus & Logistics',  icon: Building2 },
  { to: '/admin/billing',              label: 'Billing',             icon: CreditCard },
  { to: '/admin/poster-maker',         label: 'Poster Maker',        icon: Image },
  { to: '/admin/elections',            label: 'Elections (PEC)',      icon: Vote },
  { header: 'Insights & Setup' },
  { to: ROUTES.ADMIN_ANALYTICS,        label: 'School Analytics',    icon: BarChart3 },
  { to: ROUTES.ADMIN_PERFORMANCE,      label: 'Performance Tracker', icon: BarChart3 },
  { to: '/admin/reports',              label: 'Reports',             icon: FileText },
  { to: '/admin/settings-hub',         label: 'System Settings',     icon: Settings },
]

const teacherLinks: any[] = [
  { header: 'Overview' },
  { to: ROUTES.TEACHER_DASHBOARD,      label: 'Dashboard',           icon: LayoutDashboard },
  { to: '/teacher/self-service',       label: 'Self Service',        icon: UserCheck },
  { to: '/teacher/leave',              label: 'My Leave',            icon: Calendar },
  { to: '/teacher/payslips',           label: 'Payslips',            icon: FileText },
  { to: ROUTES.TEACHER_MESSAGES,       label: 'Messages',            icon: MessageSquare },
  { to: ROUTES.TEACHER_NOTIFICATIONS,  label: 'Notifications',       icon: Bell },
  { header: 'Instructional' },
  { to: ROUTES.TEACHER_MY_CLASSES,     label: 'My Classes',          icon: School },
  { to: ROUTES.TEACHER_STUDENTS,       label: 'Students',            icon: Users },
  { to: '/teacher/behavior',           label: 'Behavior Log',        icon: ShieldCheck },
  { to: '/teacher/class-tests',        label: 'Class Tests',         icon: ClipboardList },
  { to: ROUTES.TEACHER_SCORE_ENTRY,    label: 'Score Entry',         icon: PencilLine },
  { to: ROUTES.TEACHER_REPORTS,        label: 'Reports',             icon: FileSpreadsheet },
  { to: ROUTES.TEACHER_TIMETABLE,      label: 'Timetable',           icon: Calendar },
  { to: ROUTES.TEACHER_ATTENDANCE,     label: 'Attendance',          icon: ClipboardCheck },
  { to: ROUTES.TEACHER_SYLLABUS,       label: 'Syllabus',            icon: Book },
  { to: ROUTES.TEACHER_LESSON_TRACKER, label: 'Lesson Tracker',      icon: Timer },
  { to: ROUTES.TEACHER_ASSIGNMENTS,    label: 'Assignments',         icon: ClipboardList },
  { to: '/teacher/video-assignments',  label: 'Video Assignments',   icon: MonitorPlay },
  { to: ROUTES.TEACHER_SUBJECTS,       label: 'Library',             icon: BookOpen },
  { to: '/teacher/daily-fees',         label: 'Daily Collections',   icon: CreditCard },
  { header: 'Extras' },
  { to: '/teacher/requisition',        label: 'My Requisitions',     icon: ClipboardList },
  { to: '/teacher/agenda',             label: 'Term Agenda',         icon: ClipboardList },
  { to: '/teacher/pastoral',           label: 'Pastoral Care',       icon: ShieldCheck },
  { to: '/teacher/elections-hub',      label: 'Elections (PEC)',      icon: Vote },
  { to: ROUTES.TEACHER_TYPING_GAME,    label: 'Typing Nitro',        icon: Gamepad2 },
]

const superAdminLinks: any[] = [
  { to: ROUTES.SUPER_ADMIN_DASHBOARD, label: 'Platform Hub',         icon: ShieldCheck },
  { to: ROUTES.SUPER_ADMIN_SCHOOLS,   label: 'School Registry',      icon: School },
  { to: ROUTES.SUPER_ADMIN_QUIZZES,   label: 'Monthly Quizzes',      icon: ClipboardList },
  { to: ROUTES.SUPER_ADMIN_MESSAGING, label: 'Global Messaging',     icon: MessageSquare },
  { to: ROUTES.SUPER_ADMIN_ANALYTICS, label: 'Leaderboards',         icon: Trophy },
  { to: ROUTES.SUPER_ADMIN_SUBJECTS,  label: 'Platform Subjects',    icon: BookOpen },
  { to: ROUTES.SUPER_ADMIN_RESOURCES, label: 'Learning Materials',   icon: Book },
]

const studentLinks: any[] = [
  { header: 'General' },
  { to: ROUTES.STUDENT_DASHBOARD,     label: 'My Portal',            icon: LayoutDashboard },
  { to: ROUTES.STUDENT_PROFILE,       label: 'My Profile',           icon: UserCheck },
  { to: '/student/messages',          label: 'Messages',             icon: MessageSquare },
  { to: ROUTES.STUDENT_ANNOUNCEMENTS, label: 'Notice Board',         icon: Megaphone },
  { to: ROUTES.STUDENT_CALENDAR,      label: 'School Calendar',      icon: Calendar },
  { header: 'Academic Hub' },
  { to: ROUTES.STUDENT_RESULTS,       label: 'Academic Results',     icon: BarChart3 },
  { to: ROUTES.STUDENT_ASSIGNMENTS,   label: 'Assignments & Quizzes',icon: ClipboardList },
  { to: ROUTES.STUDENT_ATTENDANCE,    label: 'Attendance History',   icon: UserCheck },
  { to: ROUTES.STUDENT_SCHEDULE,      label: 'My Timetable',         icon: Timer },
  { header: 'Resources & Billing' },
  { to: '/student/acadera-tv',        label: 'Acadera TV',           icon: Tv },
  { to: ROUTES.STUDENT_RESOURCES,     label: 'Resources Hub',        icon: BookOpen },
  { to: ROUTES.STUDENT_LIBRARY,       label: 'Global Library',       icon: Library },
  { to: ROUTES.STUDENT_BILLING,       label: 'Fees & Billing',       icon: Wallet },
  { to: '/student/exeats',            label: 'My Exeats',            icon: MapPin },
  { to: ROUTES.STUDENT_ELECTIONS,     label: 'PEC Elections',        icon: Vote },
  { to: ROUTES.STUDENT_TYPING_GAME,   label: 'Typing Nitro',         icon: Gamepad2 },
  { to: '/student/notifications',     label: 'Notifications',        icon: Bell },
]

const bursarLinks: any[] = [
  { header: 'Overview' },
  { to: ROUTES.BURSAR_DASHBOARD,      label: 'Dashboard',            icon: LayoutDashboard },
  { to: ROUTES.BURSAR_ANALYTICS,      label: 'Analytics',            icon: BarChart3 },
  { header: 'Operations' },
  { to: ROUTES.BURSAR_STUDENTS,       label: 'Students',             icon: Users },
  { to: ROUTES.BURSAR_FEES,           label: 'School Fees',          icon: CreditCard },
  { to: '/bursar/daily-fees',         label: 'Daily Fees',           icon: Wallet },
  { to: ROUTES.BURSAR_INVENTORY,      label: 'School Store',         icon: ShoppingBag },
  { header: 'Financials' },
  { to: ROUTES.BURSAR_DEBTORS,        label: 'Debtors List',         icon: AlertCircle },
  { to: ROUTES.BURSAR_BILL_SHEET,     label: 'Bill Sheet',           icon: FileText },
  { to: ROUTES.BURSAR_PAYROLL,        label: 'Payroll',              icon: Wallet },
  { to: ROUTES.BURSAR_INCOME,         label: 'Income',               icon: TrendingUp },
  { to: ROUTES.BURSAR_EXPENSES,       label: 'Expenses',             icon: TrendingDown },
  { to: ROUTES.BURSAR_REPORTS,        label: 'Financial Reports',    icon: FileSpreadsheet },
  { header: 'Tools' },
  { to: ROUTES.BURSAR_SMS,            label: 'SMS Reminders',        icon: Bell },
  { to: ROUTES.BURSAR_VENDORS,        label: 'Vendors',              icon: Package },
  { to: ROUTES.BURSAR_REQUISITIONS,   label: 'Requisitions',         icon: ClipboardList },
]

const staffLinks: any[] = [
  { header: 'Staff Portal' },
  { to: '/staff/dashboard',           label: 'Dashboard',            icon: LayoutDashboard },
  { to: '/staff/self-service',        label: 'Self Service',         icon: UserCheck },
  { to: '/staff/leave',               label: 'My Leave',             icon: Calendar },
  { to: '/staff/payslips',            label: 'Payslips',             icon: FileText },
  { to: '/staff/messages',            label: 'Messages',             icon: MessageSquare },
  { to: '/staff/elections',           label: 'Elections (PEC)',       icon: Vote },
]

const securityLinks: any[] = [
  { header: 'Security Portal' },
  { to: '/security/dashboard',          label: 'Dashboard',          icon: LayoutDashboard },
  { to: '/security/scanner',            label: 'Gate Scanner',       icon: ScanLine },
  { to: '/security/gate-attendance',    label: 'Gate Log',           icon: ClipboardCheck },
  { to: '/security/visitors',           label: 'Visitor Log',        icon: Users },
  { to: '/security/visitor-badges',     label: 'Visitor Badges',     icon: Printer },
  { to: '/security/incidents',          label: 'Incidents',          icon: AlertTriangle },
]

const driverLinks: any[] = [
  { header: 'Transport' },
  { to: '/driver/dashboard',           label: 'Dashboard',           icon: LayoutDashboard },
  { to: '/driver/routes',              label: 'Bus Routes',          icon: MapPin },
  { to: '/driver/logs',                label: 'Trip Logs',           icon: ClipboardList },
]

const parentLinks: any[] = [
  { header: 'Overview' },
  { to: '/parent/dashboard',           label: 'My Wards',            icon: Users },
  { to: '/parent/calendar',            label: 'Calendar',            icon: Calendar },
  { header: 'Academics & Billing' },
  { to: '/parent/academics',           label: 'Academics',           icon: FileSpreadsheet },
  { to: '/parent/attendance',          label: 'Attendance',          icon: ClipboardCheck },
  { to: '/parent/billing',             label: 'Billing & Fees',      icon: Wallet },
  { header: 'Communication' },
  { to: '/parent/messages',            label: 'Messages',            icon: MessageSquare },
  { to: '/parent/exeats',              label: 'Exeat Requests',      icon: MapPin },
]

const nurseLinks: any[] = [
  { header: 'Clinic Portal' },
  { to: '/nurse/dashboard',            label: 'Dashboard',           icon: LayoutDashboard },
  { to: '/nurse/visits',               label: 'Clinic Visits Log',   icon: ClipboardList },
  { to: '/nurse/medication',           label: 'Medication Tracker',  icon: Pill },
  { to: '/nurse/records',              label: 'Health Records',      icon: UserCheck },
]

const librarianLinks: any[] = [
  { header: 'Library Portal' },
  { to: '/librarian/dashboard',        label: 'Dashboard',           icon: LayoutDashboard },
  { to: '/librarian/fines',            label: 'Overdue & Fines',     icon: AlertCircle },
  { to: '/librarian/history',          label: 'Checkout History',    icon: History },
  { to: '/librarian/inventory',        label: 'QR Inventory',        icon: Package },
]

const proprietorLinks: any[] = [
  { header: 'Executive Overview' },
  { to: '/proprietor/dashboard',       label: 'Executive Dashboard', icon: LayoutDashboard },
  { to: '/proprietor/analytics',       label: 'Academic Performance',icon: BarChart3 },
  { to: '/proprietor/finances',        label: 'Financial Health',    icon: TrendingUp },
  { header: 'Demographics' },
  { to: '/proprietor/students',        label: 'Student Demographics',icon: Users },
  { to: '/proprietor/staff',           label: 'Staff & Payroll',     icon: UserCheck },
]

/* ── Sidebar gradient per role ── */
const ROLE_GRADIENT: Record<string, string> = {
  admin:      'linear-gradient(180deg, #1E1B4B 0%, #1a56db 100%)',
  teacher:    'linear-gradient(180deg, #1E1B4B 0%, #4C1D95 100%)',
  bursar:     'linear-gradient(180deg, #1E1B4B 0%, #1a56db 100%)',
  student:    'linear-gradient(180deg, #0F172A 0%, #1e3a5f 100%)',
  staff:      'linear-gradient(180deg, #1E1B4B 0%, #374151 100%)',
  security:   'linear-gradient(180deg, #0F172A 0%, #1F2937 100%)',
  parent:     'linear-gradient(180deg, #0F172A 0%, #14532D 100%)',
  proprietor: 'linear-gradient(180deg, #1E1B4B 0%, #7C3AED 100%)',
  super_admin:'linear-gradient(180deg, #0F172A 0%, #DC2626 100%)',
}

/* ── Primary CTA per role ── */
const ROLE_CTA: Record<string, { label: string; to: string }> = {
  admin:   { label: '+ New Task',      to: '/admin/tasks' },
  teacher: { label: '+ Log Behavior',  to: '/teacher/behavior' },
  bursar:  { label: '+ Record Fee',    to: ROUTES.BURSAR_FEES },
}

export default function Sidebar() {
  const {
    user, signOut,
    isAdmin, isSuperAdmin, isStudent, isBursar, isTeacher,
    isNurse, isLibrarian, isProprietor, isSecurity, isDriver
  } = useAuth()
  const navigate = useNavigate()
  const isStaff  = user?.role === 'staff'
  const isParent = user?.role === 'parent'
  const school   = user?.school as any

  // Storage widget — admin only
  const schoolId = isAdmin ? (user?.school_id ?? undefined) : undefined
  const storage  = useSchoolStorage(schoolId)
  const { data: settings } = useSettings()

  // Daily fee auth for teachers
  const { data: collectorAuth, isLoading: loadingAuth } = useQuery({
    queryKey: ['daily-fee-auth', user?.id],
    queryFn:  async () => {
      const res = await dailyFeesService.isTeacherCollector(user?.id!)
      return res?.data || null
    },
    enabled: isTeacher && !!user?.id,
  })

  // Unread message count
  const [unreadMsgs, setUnreadMsgs] = useState(0)
  useEffect(() => {
    if (!user?.id || isStudent || isBursar) return
    async function fetchUnread() {
      const { data: memberRows } = await supabase
        .from('chat_members')
        .select('conversation_id, last_read_at')
        .eq('user_id', user!.id)
      if (!memberRows?.length) return
      let total = 0
      for (const m of memberRows) {
        const { count } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', m.conversation_id)
          .gt('created_at', m.last_read_at ?? '1970-01-01')
          .neq('sender_id', user!.id)
        total += count ?? 0
      }
      setUnreadMsgs(total)
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 30000)
    return () => clearInterval(interval)
  }, [user?.id, isStudent, isBursar])

  // Select link set
  let links: any[] = isSuperAdmin ? superAdminLinks
    : isProprietor ? proprietorLinks
    : isParent     ? parentLinks
    : isStudent    ? studentLinks
    : isAdmin      ? adminLinks
    : isBursar     ? bursarLinks
    : isNurse      ? nurseLinks
    : isLibrarian  ? librarianLinks
    : isSecurity   ? securityLinks
    : isDriver     ? driverLinks
    : isStaff      ? staffLinks
    : teacherLinks

  // Filter daily collections for unauthorized teachers
  if (isTeacher && !loadingAuth && !collectorAuth) {
    links = links.filter(l => !('label' in l) || (l as any).label !== 'Daily Collections')
  }
  // Filter branches-dependent items
  links = links.filter(l => {
    if ((l as any).requiresBranches && !settings?.has_branches) return false
    return true
  })

  // Collapsed state (persistent)
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('sidebar_collapsed') === 'true' } catch { return false }
  })
  useEffect(() => {
    try { localStorage.setItem('sidebar_collapsed', String(collapsed)) } catch {}
  }, [collapsed])

  // Search
  const [searchQuery, setSearchQuery] = useState('')
  const filteredLinks = links.filter(l => {
    if ('header' in l) return true
    const label = (l as any).label || ''
    return label.toLowerCase().includes(searchQuery.toLowerCase())
  })

  // Hovered tooltip for collapsed mode
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  const role      = user?.role || 'admin'
  const gradient  = ROLE_GRADIENT[role] || ROLE_GRADIENT.admin
  const cta       = ROLE_CTA[role]

  return (
    <>
      <style>{`
        @keyframes _sideIn { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
        @keyframes _tooltipIn { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:translateX(0)} }

        .sb-link {
          display: flex; align-items: center;
          gap: ${collapsed ? 0 : 10}px;
          padding: 9px ${collapsed ? 0 : 12}px;
          border-radius: 10px;
          color: rgba(255,255,255,0.72);
          font-size: 13px; font-weight: 600;
          text-decoration: none;
          transition: all 0.15s cubic-bezier(0.4,0,0.2,1);
          cursor: pointer; white-space: nowrap;
          justify-content: ${collapsed ? 'center' : 'flex-start'};
          position: relative;
          border: 1px solid transparent;
          min-height: 40px;
        }
        .sb-link:hover {
          background: rgba(255,255,255,0.12);
          color: #fff;
          border-color: rgba(255,255,255,0.08);
        }
        .sb-link.active {
          background: rgba(255,255,255,0.18);
          color: #fff;
          font-weight: 700;
          border-color: rgba(255,255,255,0.12);
        }
        .sb-link.active::before {
          content: '';
          position: absolute;
          left: 0; top: 25%; bottom: 25%;
          width: 3px;
          background: rgba(255,255,255,0.9);
          border-radius: 0 3px 3px 0;
        }
        .sb-tooltip {
          position: absolute;
          left: calc(100% + 12px);
          top: 50%; transform: translateY(-50%);
          background: #1e293b;
          color: #fff;
          font-size: 12px; font-weight: 700;
          padding: 6px 10px;
          border-radius: 8px;
          white-space: nowrap;
          pointer-events: none;
          z-index: 9999;
          animation: _tooltipIn 0.15s ease;
          box-shadow: 0 4px 16px rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.1);
        }
        .sb-collapse-btn {
          position: absolute;
          right: -16px; top: 72px;
          width: 32px; height: 32px;
          border-radius: 50%;
          background: var(--bg-card, #ffffff);
          border: 2px solid var(--border-color, #E5E7EB);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          z-index: 300;
          transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
          box-shadow: 0 2px 12px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.1);
          color: var(--text-secondary, #374151);
          opacity: 1;
        }
        .sb-collapse-btn:hover {
          background: #2563EB;
          color: #fff;
          border-color: #2563EB;
          transform: scale(1.12);
          box-shadow: 0 4px 16px rgba(37,99,235,0.4);
        }
        .sb-storage-bar { height: 5px; background: rgba(255,255,255,0.12); border-radius: 99px; overflow: hidden; margin: 6px 0 4px; }
        .sb-storage-fill { height: 100%; border-radius: 99px; transition: width 1.2s cubic-bezier(0.4,0,0.2,1); }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 99px; }
      `}</style>

      <div
        style={{
          width:     collapsed ? 72 : 260,
          minWidth:  collapsed ? 72 : 260,
          position: 'relative',
          transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1), min-width 0.3s cubic-bezier(0.4,0,0.2,1)',
          zIndex: 150,
          flexShrink: 0,
        }}
      >
        <aside
          style={{
            width: '100%',
            height: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            background: gradient,
            borderRight: '1px solid rgba(255,255,255,0.06)',
            fontFamily: 'Inter, system-ui, sans-serif',
            userSelect: 'none',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 100, left: -80, width: 250, height: 250, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />

        {/* School logo watermark */}
        {school?.logo_url && (
          <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${school.logo_url})`, backgroundPosition: 'center', backgroundSize: '70%', backgroundRepeat: 'no-repeat', opacity: 0.04, zIndex: 0, pointerEvents: 'none' }} />
        )}

        {/* ── Header ── */}
        <div style={{ padding: collapsed ? '24px 10px 16px' : '28px 18px 20px', position: 'relative', zIndex: 1 }}>
          {/* Logo + Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: collapsed ? 'center' : 'flex-start', marginBottom: collapsed ? 0 : 18 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, overflow: 'hidden', flexShrink: 0,
              background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            }}>
              {school?.logo_url
                ? <img loading="lazy" src={school.logo_url} alt="School" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 2 }} />
                : <img loading="lazy" src="/icon-512.png" alt="Acadera" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} />
              }
            </div>
            {!collapsed && (
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 170 }}>
                  {school?.name || 'Acadera'}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: 2 }}>
                  {role.replace('_', ' ')}
                </div>
              </div>
            )}
          </div>

          {/* CTA button */}
          {!collapsed && cta && (
            <button
              onClick={() => navigate(cta.to)}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.14)',
                color: '#fff', fontWeight: 700, fontSize: 13,
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 7,
                transition: 'all 0.2s',
                backdropFilter: 'blur(8px)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)' }}
            >
              <Plus size={15} strokeWidth={3} /> {cta.label}
            </button>
          )}
        </div>

        {/* ── Search ── */}
        {!collapsed && (
          <div style={{ padding: '0 14px 14px', position: 'relative', zIndex: 1 }}>
            <div style={{ position: 'relative' }}>
              <Search size={13} color="rgba(255,255,255,0.5)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search menu…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 9, padding: '8px 12px 8px 30px',
                  fontSize: 12, color: '#fff', outline: 'none',
                  transition: 'all 0.2s', fontFamily: 'inherit',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'; e.currentTarget.style.background = 'rgba(255,255,255,0.16)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
              />
            </div>
          </div>
        )}

        {/* ── Nav links ── */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: collapsed ? '8px 10px' : '0 10px 16px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {filteredLinks.map((item: any, i: number) => {
              if (item.header) {
                if (collapsed || searchQuery) return null
                return (
                  <div key={`h-${item.header}`} style={{
                    padding: '18px 12px 6px',
                    fontSize: 10, fontWeight: 800,
                    color: 'rgba(255,255,255,0.35)',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                  }}>
                    {item.header}
                  </div>
                )
              }

              const { to, label, icon: Icon } = item
              return (
                <NavLink key={to} to={to} style={{ textDecoration: 'none', display: 'block' }} aria-label={label}>
                  {({ isActive }) => (
                    <div
                      className={`sb-link ${isActive ? 'active' : ''}`}
                      onMouseEnter={() => { if (collapsed) setHoveredItem(to) }}
                      onMouseLeave={() => setHoveredItem(null)}
                      style={{ animation: searchQuery ? 'none' : `_sideIn 0.25s ease ${i * 0.015}s both` }}
                    >
                      {/* Icon */}
                      <div style={{ position: 'relative', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20 }}>
                        <Icon size={18} style={{ display: 'block', opacity: isActive ? 1 : 0.8 }} />
                        {/* Message unread badge */}
                        {(label === 'Messages' || label === 'Communications') && unreadMsgs > 0 && (
                          <span style={{
                            position: 'absolute', top: -5, right: -6,
                            background: '#ef4444', color: '#fff',
                            fontSize: 9, fontWeight: 800,
                            borderRadius: 99, padding: '0 3px',
                            minWidth: 14, textAlign: 'center', lineHeight: '14px',
                            border: '1.5px solid rgba(255,255,255,0.2)',
                          }}>{unreadMsgs > 99 ? '99+' : unreadMsgs}</span>
                        )}
                      </div>

                      {/* Label */}
                      {!collapsed && (
                        <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {label}
                        </span>
                      )}

                      {/* Unread badge on label row */}
                      {!collapsed && (label === 'Messages' || label === 'Communications') && unreadMsgs > 0 && (
                        <span style={{ marginLeft: 'auto', background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: 99, padding: '2px 6px', flexShrink: 0 }}>
                          {unreadMsgs > 99 ? '99+' : unreadMsgs}
                        </span>
                      )}

                      {/* Collapsed tooltip */}
                      {collapsed && hoveredItem === to && (
                        <span className="sb-tooltip">{label}</span>
                      )}
                    </div>
                  )}
                </NavLink>
              )
            })}
          </div>
        </nav>

        {/* ── Storage widget (Admin only) ── */}
        {!collapsed && isAdmin && (
          <div style={{ padding: '16px 14px', borderTop: '1px solid rgba(255,255,255,0.08)', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Monitor size={13} color="rgba(255,255,255,0.6)" />
              <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Storage</span>
              {storage.loading && <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginLeft: 'auto' }}>Calculating…</span>}
            </div>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px' }}>
              <div className="sb-storage-bar">
                <div className="sb-storage-fill" style={{
                  width: `${storage.percentUsed}%`,
                  background: storage.percentUsed >= 90 ? '#ef4444' : storage.percentUsed >= 75 ? '#f59e0b' : 'rgba(255,255,255,0.7)',
                }} />
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginBottom: 2 }}>
                {storage.totalBytes < 1024 ** 3
                  ? `${(storage.totalBytes / 1024 ** 2).toFixed(1)} MB`
                  : `${(storage.totalBytes / 1024 ** 3).toFixed(2)} GB`
                }{' '}
                <span style={{ fontWeight: 500, color: 'rgba(255,255,255,0.5)' }}>of {storage.limitGB} GB</span>
              </div>
              <button onClick={() => navigate('/admin/billing')} style={{
                marginTop: 8, width: '100%', padding: '7px', borderRadius: 7,
                border: 'none', background: 'rgba(255,255,255,0.15)',
                color: '#fff', fontSize: 11, fontWeight: 700,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)' }}
              >
                Upgrade Storage
              </button>
            </div>

            {/* Sign out */}
            <div
              onClick={signOut}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && signOut()}
              style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', padding: '8px 10px', borderRadius: 9, transition: 'background 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.15)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LogOut size={13} color="#fca5a5" />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fca5a5' }}>Sign Out</span>
            </div>
          </div>
        )}

        {/* Sign out (non-admin, non-collapsed) */}
        {!collapsed && !isAdmin && (
          <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.08)', position: 'relative', zIndex: 1 }}>
            <div
              onClick={signOut}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && signOut()}
              style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', padding: '8px 10px', borderRadius: 9, transition: 'background 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.15)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LogOut size={13} color="#fca5a5" />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fca5a5' }}>Sign Out</span>
            </div>
          </div>
        )}

        {/* Collapsed sign out icon */}
        {collapsed && (
          <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.08)', position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center' }}>
            <button onClick={signOut} title="Sign Out" style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(239,68,68,0.15)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.3)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)' }}
            >
              <LogOut size={16} color="#fca5a5" />
            </button>
          </div>
        )}
        </aside>

        {/* Collapse toggle (moved outside aside to prevent overflow clipping) */}
        <button
          className="sb-collapse-btn"
          onClick={() => setCollapsed(c => !c)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed
            ? <ChevronRight size={15} strokeWidth={2.5} />
            : <ChevronLeft size={15} strokeWidth={2.5} />}
        </button>
      </div>
    </>
  )
}