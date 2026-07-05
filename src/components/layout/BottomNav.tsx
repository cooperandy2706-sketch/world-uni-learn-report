// src/components/layout/BottomNav.tsx
import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { dailyFeesService } from '../../services/bursar.service'
import {
  LayoutDashboard, Users, FileSpreadsheet, ClipboardCheck,
  Megaphone, PencilLine, Calendar, BookOpen,
  ShieldCheck, ClipboardList, MessageSquare, Home, BarChart3, UserCheck, Book, School,
  CreditCard, Wallet, Gamepad2, Library, Bell, Tv, ScanLine, AlertTriangle, MapPin,
  Printer, Package, FolderLock, MoreHorizontal, X
} from 'lucide-react'
import NotificationsModal from '../ui/NotificationsModal'

/* ─── Nav sets (unchanged data, same as original) ───────────────────────────── */
const adminLinks = [
  { to: '/admin/dashboard',          icon: LayoutDashboard, label: 'Home' },
  { to: '/admin/academic-hub',       icon: BookOpen,        label: 'Academics' },
  { to: '/admin/student-hub',        icon: Users,           label: 'Students' },
  { to: '/admin/assessment-hub',     icon: FileSpreadsheet, label: 'Grades' },
  { to: '/admin/attendance',         icon: ClipboardCheck,  label: 'Register' },
  { to: '/admin/communications-hub', icon: MessageSquare,   label: 'Messages', notify: true },
  { to: '/admin/staff-hub',          icon: UserCheck,       label: 'Staff' },
  { to: '/admin/campus-hub',         icon: MapPin,          label: 'Campus' },
  { to: '/admin/billing',            icon: CreditCard,      label: 'Billing' },
  { to: '/admin/analytics',          icon: BarChart3,       label: 'Analytics' },
  { to: '/admin/settings-hub',       icon: ShieldCheck,     label: 'Settings' },
]

const teacherLinks = [
  { to: '/teacher/dashboard',         icon: LayoutDashboard, label: 'Home' },
  { to: '/teacher/score-entry',       icon: PencilLine,      label: 'Scores' },
  { to: '/teacher/attendance',        icon: ClipboardCheck,  label: 'Register' },
  { to: '/teacher/daily-fees',        icon: CreditCard,      label: 'Fees' },
  { to: '/teacher/messages',          icon: MessageSquare,   label: 'Messages', notify: true },
  { to: '/teacher/assignments',       icon: ClipboardList,   label: 'Tasks' },
  { to: '/teacher/video-assignments', icon: Tv,              label: 'Videos' },
  { to: '/teacher/behavior',          icon: ShieldCheck,     label: 'Behavior' },
  { to: '/teacher/syllabus',          icon: BookOpen,        label: 'Syllabus' },
  { to: '/teacher/timetable',         icon: Calendar,        label: 'Schedule' },
  { to: '/teacher/reports',           icon: FileSpreadsheet, label: 'Reports' },
  { to: '/teacher/my-vault',          icon: FolderLock,      label: 'My Vault' },
  { to: '/teacher/self-service',      icon: UserCheck,       label: 'Service' },
  { to: '/teacher/pastoral',          icon: ClipboardList,   label: 'Pastoral' },
  { to: '/teacher/typing-game',       icon: Gamepad2,        label: 'Nitro' },
]

const superAdminLinks = [
  { to: '/super-admin/dashboard', icon: ShieldCheck,  label: 'Hub' },
  { to: '/super-admin/schools',   icon: School,       label: 'Schools' },
  { to: '/super-admin/quizzes',   icon: ClipboardList,label: 'Quizzes' },
  { to: '/super-admin/messaging', icon: MessageSquare,label: 'Messaging' },
]

const studentLinks = [
  { to: '/student/dashboard',     icon: Home,         label: 'Portal' },
  { to: '/student/assignments',   icon: ClipboardList,label: 'Tasks' },
  { to: '/student/acadera-tv',    icon: Tv,           label: 'Acadera TV' },
  { to: '/student/library',       icon: Library,      label: 'Library' },
  { to: '/student/results',       icon: BarChart3,    label: 'Results' },
  { to: '/student/schedule',      icon: Calendar,     label: 'Schedule' },
  { to: '/student/billing',       icon: CreditCard,   label: 'Billing' },
  { to: '/student/profile',       icon: Users,        label: 'Profile' },
  { to: '/student/announcements', icon: Megaphone,    label: 'Notices' },
  { to: '/student/exeats',        icon: MapPin,       label: 'Exeats' },
  { to: '/student/typing-game',   icon: Gamepad2,     label: 'Nitro' },
]

const bursarLinks = [
  { to: '/bursar/dashboard',   icon: LayoutDashboard, label: 'Home' },
  { to: '/bursar/fees',        icon: CreditCard,      label: 'Fees' },
  { to: '/bursar/daily-fees',  icon: Wallet,          label: 'Daily' },
  { to: '/bursar/debtors',     icon: AlertTriangle,   label: 'Debtors' },
  { to: '/bursar/payroll',     icon: Wallet,          label: 'Payroll' },
  { to: '/bursar/inventory',   icon: Library,         label: 'Inventory' },
  { to: '/bursar/analytics',   icon: BarChart3,       label: 'Stats' },
  { to: '/bursar/reports',     icon: FileSpreadsheet, label: 'Reports' },
  { to: '/bursar/sms',         icon: MessageSquare,   label: 'SMS' },
]

const parentLinks = [
  { to: '/parent/dashboard',   icon: Home,           label: 'Wards' },
  { to: '/parent/academics',   icon: FileSpreadsheet,label: 'Results' },
  { to: '/parent/attendance',  icon: ClipboardCheck, label: 'Attendance' },
  { to: '/parent/billing',     icon: Wallet,         label: 'Billing' },
  { to: '/parent/messages',    icon: MessageSquare,  label: 'Messages', notify: true },
  { to: '/parent/calendar',    icon: Calendar,       label: 'Calendar' },
  { to: '/parent/exeats',      icon: MapPin,         label: 'Exeats' },
]

const securityLinks = [
  { to: '/security/dashboard',       icon: ShieldCheck,   label: 'Home' },
  { to: '/security/scanner',         icon: ScanLine,      label: 'Scanner' },
  { to: '/security/gate-attendance', icon: ClipboardCheck,label: 'Log' },
  { to: '/security/visitors',        icon: Users,         label: 'Visitors' },
  { to: '/security/visitor-badges',  icon: Printer,       label: 'Badges' },
  { to: '/security/incidents',       icon: AlertTriangle, label: 'Incidents' },
]

const driverLinks = [
  { to: '/driver/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/driver/routes',    icon: MapPin,          label: 'Routes' },
  { to: '/driver/logs',      icon: ClipboardList,   label: 'Logs' },
]

const nurseLinks = [
  { to: '/nurse/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/nurse/visits',    icon: ClipboardList,   label: 'Visits' },
  { to: '/nurse/medication',icon: BookOpen,         label: 'Meds' },
]

const librarianLinks = [
  { to: '/librarian/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/librarian/fines',     icon: AlertTriangle,   label: 'Fines' },
  { to: '/librarian/history',   icon: Book,            label: 'History' },
  { to: '/librarian/inventory', icon: Package,         label: 'Inventory' },
]

const proprietorLinks = [
  { to: '/proprietor/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/proprietor/analytics', icon: BarChart3,       label: 'Stats' },
  { to: '/proprietor/finances',  icon: Wallet,          label: 'Finances' },
  { to: '/proprietor/students',  icon: Users,           label: 'Students' },
  { to: '/proprietor/staff',     icon: UserCheck,       label: 'Staff' },
]

const staffLinks = [
  { to: '/staff/dashboard',   icon: LayoutDashboard, label: 'Home' },
  { to: '/staff/elections',   icon: ClipboardList,   label: 'Elections' },
]

/* ─── PRIMARY (first 5 shown) + "More" overflow ─────────────────────────────── */
const MAX_PRIMARY = 5

export default function BottomNav() {
  const { user, isAdmin, isSuperAdmin, isStudent, isBursar, isTeacher,
          isSecurity, isDriver, isNurse, isLibrarian, isProprietor, isStaff } = useAuth()
  const location     = useLocation()
  const isParent     = user?.role === 'parent'
  const [unread, setUnread]             = useState(0)
  const [visible, setVisible]           = useState(false)
  const [isGameFullScreen, setIsGameFullScreen] = useState(false)
  const [modalOpen, setModalOpen]       = useState(false)
  const [moreOpen, setMoreOpen]         = useState(false)

  const { data: collectorAuth, isLoading: loadingAuth } = useQuery({
    queryKey: ['daily-fee-auth', user?.id],
    queryFn:  async () => {
      const res = await dailyFeesService.isTeacherCollector(user?.id!)
      return res?.data || null
    },
    enabled: isTeacher && !!user?.id,
  })

  let allLinks: any[] = isSuperAdmin   ? superAdminLinks
    : isSecurity  ? securityLinks
    : isParent    ? parentLinks
    : isStudent   ? studentLinks
    : isAdmin     ? adminLinks
    : isBursar    ? bursarLinks
    : isDriver    ? driverLinks
    : isNurse     ? nurseLinks
    : isLibrarian ? librarianLinks
    : isProprietor? proprietorLinks
    : isStaff     ? staffLinks
    : teacherLinks

  if (isTeacher && !loadingAuth && !collectorAuth) {
    allLinks = allLinks.filter(l => l.label !== 'Fees')
  }

  const primaryLinks  = allLinks.slice(0, MAX_PRIMARY)
  const overflowLinks = allLinks.slice(MAX_PRIMARY)

  // Check if current path is in overflow
  const overflowActive = overflowLinks.some(l =>
    location.pathname === l.to || location.pathname.startsWith(l.to + '/')
  )

  useEffect(() => {
    function check() { setVisible(window.innerWidth < 1024) }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const handler = (e: any) => setIsGameFullScreen(e.detail)
    window.addEventListener('game-fullscreen-toggle', handler)
    return () => window.removeEventListener('game-fullscreen-toggle', handler)
  }, [])

  useEffect(() => {
    if (!isAdmin && user) {
      loadUnread()
      const t = setInterval(loadUnread, 30000)
      return () => clearInterval(t)
    }
  }, [user, isAdmin])

  async function loadUnread() {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id)
      .eq('is_read', false)
    setUnread(count ?? 0)
  }

  if (!visible && !isGameFullScreen) return null

  /* ── Fullscreen game bar ── */
  if (isGameFullScreen) {
    return (
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10000,
        background: 'linear-gradient(90deg, #0a0a1f, #1a1a4b)',
        borderTop: '1px solid #00f3ff',
        padding: '16px', paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 -10px 40px rgba(0,243,255,0.3)',
      }}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00f3ff', boxShadow: '0 0 10px #00f3ff' }} />
          <span style={{ color: '#00f3ff', fontWeight: 900, fontSize: 13, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            GAME FULL SCREEN
          </span>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00f3ff', boxShadow: '0 0 10px #00f3ff' }} />
        </motion.div>
      </nav>
    )
  }

  return (
    <>
      {/* Notification FAB */}
      <div style={{
        position: 'fixed',
        bottom: `calc(max(10px, env(safe-area-inset-bottom)) + 76px)`,
        right: 16, zIndex: 1001,
        display: visible ? 'block' : 'none',
      }}>
        <button
          onClick={() => setModalOpen(true)}
          aria-label="Notifications"
          style={{
            width: 48, height: 48, borderRadius: '50%',
            background: unread > 0
              ? 'linear-gradient(135deg, #7c3aed, #4c1d95)'
              : 'var(--bg-card)',
            color: unread > 0 ? '#fff' : '#6d28d9',
            border: unread > 0 ? 'none' : '1.5px solid var(--border-color)',
            boxShadow: unread > 0
              ? '0 6px 20px rgba(124,58,237,0.4)'
              : '0 4px 12px rgba(0,0,0,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.2s', position: 'relative',
          }}
        >
          <Bell size={20} strokeWidth={2.5} />
          {unread > 0 && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
              style={{
                position: 'absolute', top: -3, right: -3,
                minWidth: 18, height: 18, borderRadius: 9,
                background: '#ef4444', color: '#fff',
                fontSize: 10, fontWeight: 900,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid var(--bg-card)', padding: '0 3px',
              }}>
              {unread > 99 ? '!' : unread}
            </motion.span>
          )}
        </button>
      </div>

      <NotificationsModal open={modalOpen} onClose={() => setModalOpen(false)} onRead={loadUnread} />

      {/* More drawer (overflow links) */}
      {moreOpen && (
        <>
          <div
            onClick={() => setMoreOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 998, backdropFilter: 'blur(4px)' }}
          />
          <div style={{
            position: 'fixed', bottom: 76, left: 8, right: 8,
            background: 'var(--bg-card)',
            borderRadius: '20px 20px 0 0',
            padding: '20px 16px 16px',
            zIndex: 999,
            border: '1px solid var(--border-color)',
            boxShadow: '0 -8px 32px rgba(0,0,0,0.15)',
            animation: 'slideUp 0.25s cubic-bezier(0.4,0,0.2,1)',
            maxHeight: '60dvh',
            overflowY: 'auto',
          }}>
            {/* Handle */}
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-color)', margin: '0 auto 16px' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {overflowLinks.map(({ to, icon: Icon, label }: any) => {
                const isActive = location.pathname === to || location.pathname.startsWith(to + '/')
                return (
                  <NavLink key={to} to={to} onClick={() => setMoreOpen(false)}
                    style={{ textDecoration: 'none' }}>
                    <div style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      padding: '12px 8px', borderRadius: 12,
                      background: isActive ? 'var(--color-primary-50, #EFF6FF)' : 'var(--bg-hover)',
                      border: isActive ? '1px solid var(--color-primary-100, #DBEAFE)' : '1px solid transparent',
                      transition: 'all 0.15s',
                    }}>
                      <Icon size={20} color={isActive ? '#2563EB' : 'var(--text-muted)'} strokeWidth={2} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: isActive ? '#2563EB' : 'var(--text-muted)', textAlign: 'center' }}>
                        {label}
                      </span>
                    </div>
                  </NavLink>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* ── Main bottom nav bar ── */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
        background: 'var(--bg-card)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border-color)',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
        display: 'flex', alignItems: 'center',
        padding: '0 8px',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        height: 68,
        fontFamily: 'Inter, sans-serif',
      }}>
        {primaryLinks.map(({ to, icon: Icon, label, notify }: any) => {
          const isActive = location.pathname === to || location.pathname.startsWith(to + '/')
          return (
            <NavLink key={to} to={to}
              style={{ flex: 1, textDecoration: 'none', display: 'flex', justifyContent: 'center' }}>
              <div style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 3, padding: '8px 4px',
                minWidth: 52, position: 'relative',
              }}>
                {/* Active top bar */}
                {isActive && (
                  <motion.div layoutId="bn-pill"
                    style={{
                      position: 'absolute', top: -1, width: 20, height: 3,
                      borderRadius: 99,
                      background: 'linear-gradient(90deg, #2563EB, #7c3aed)',
                    }}
                  />
                )}

                {/* Icon container */}
                <div style={{
                  width: 40, height: 28, borderRadius: 9,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isActive ? 'rgba(37,99,235,0.08)' : 'transparent',
                  transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                  position: 'relative',
                  transform: isActive ? 'translateY(-1px)' : 'none',
                }}>
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.5 : 2}
                    color={isActive ? '#2563EB' : 'var(--text-subtle, #9CA3AF)'}
                  />
                  {/* Notify badge */}
                  {notify && unread > 0 && (
                    <span style={{
                      position: 'absolute', top: -3, right: -1,
                      minWidth: 16, height: 16, borderRadius: 8,
                      background: '#ef4444', color: '#fff',
                      fontSize: 9, fontWeight: 900,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '2px solid var(--bg-card)', padding: '0 3px',
                    }}>
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </div>

                {/* Label */}
                <span style={{
                  fontSize: 10, fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#2563EB' : 'var(--text-subtle, #9CA3AF)',
                  letterSpacing: '-0.01em',
                  transition: 'all 0.2s',
                }}>
                  {label}
                </span>
              </div>
            </NavLink>
          )
        })}

        {/* More button */}
        {overflowLinks.length > 0 && (
          <button
            onClick={() => setMoreOpen(o => !o)}
            style={{
              flex: 1, border: 'none', background: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 3, padding: '8px 4px', minWidth: 52,
            }}
          >
            <div style={{
              width: 40, height: 28, borderRadius: 9,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: (moreOpen || overflowActive) ? 'rgba(37,99,235,0.08)' : 'transparent',
              transition: 'all 0.2s',
            }}>
              {moreOpen
                ? <X size={22} color="#2563EB" strokeWidth={2.5} />
                : <MoreHorizontal size={22} color={(moreOpen || overflowActive) ? '#2563EB' : 'var(--text-subtle, #9CA3AF)'} strokeWidth={2} />
              }
              {overflowActive && !moreOpen && (
                <span style={{ position: 'absolute', top: 3, right: 5, width: 6, height: 6, borderRadius: '50%', background: '#2563EB' }} />
              )}
            </div>
            <span style={{
              fontSize: 10, fontWeight: (moreOpen || overflowActive) ? 700 : 500,
              color: (moreOpen || overflowActive) ? '#2563EB' : 'var(--text-subtle, #9CA3AF)',
              letterSpacing: '-0.01em',
            }}>
              More
            </span>
          </button>
        )}
      </nav>
    </>
  )
}