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
  Megaphone, PencilLine, Calendar, Timer, BookOpen, 
  ShieldCheck, ClipboardList, MessageSquare, Home, BarChart3, UserCheck, Book, School,
  CreditCard, Wallet, Gamepad2, Library, Bell
} from 'lucide-react'
import NotificationsModal from '../ui/NotificationsModal'

const adminLinks = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/admin/students', icon: Users, label: 'Students' },
  { to: '/admin/attendance', icon: ClipboardCheck, label: 'Register' },
  { to: '/admin/announcements', icon: Megaphone, label: 'Posts' },
  { to: '/admin/messages', icon: MessageSquare, label: 'Messages', notify: true },
  { to: '/admin/billing', icon: CreditCard, label: 'Billing' },
  { to: '/admin/reports', icon: FileSpreadsheet, label: 'Reports' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/admin/settings', icon: ShieldCheck, label: 'Settings' },
]

const teacherLinks = [
  { to: '/teacher/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/teacher/score-entry', icon: PencilLine, label: 'Scores' },
  { to: '/teacher/attendance', icon: ClipboardCheck, label: 'Register' },
  { to: '/teacher/daily-fees', icon: CreditCard, label: 'Fees' },
  { to: '/teacher/messages', icon: MessageSquare, label: 'Messages', notify: true },
  { to: '/teacher/assignments', icon: ClipboardList, label: 'Tasks' },
  { to: '/teacher/behavior', icon: ShieldCheck, label: 'Behavior' },
  { to: '/teacher/syllabus', icon: BookOpen, label: 'Syllabus' },
  { to: '/teacher/timetable', icon: Calendar, label: 'Schedule' },
  { to: '/teacher/reports', icon: FileSpreadsheet, label: 'Reports' },
  { to: '/teacher/self-service', icon: UserCheck, label: 'Service' },
  { to: '/teacher/typing-game', icon: Gamepad2, label: 'Nitro' },
]

const superAdminLinks = [
  { to: '/super-admin/dashboard', icon: ShieldCheck, label: 'Hub' },
  { to: '/super-admin/schools', icon: School, label: 'Schools' },
  { to: '/super-admin/quizzes', icon: ClipboardList, label: 'Quizzes' },
  { to: '/super-admin/messaging', icon: MessageSquare, label: 'News' },
]

const studentLinks = [
  { to: '/student/dashboard', icon: Home, label: 'Portal' },
  { to: '/student/assignments', icon: ClipboardList, label: 'Tasks' },
  { to: '/student/library', icon: Library, label: 'Library' },
  { to: '/student/results', icon: BarChart3, label: 'Results' },
  { to: '/student/schedule', icon: Calendar, label: 'Schedule' },
  { to: '/student/billing', icon: CreditCard, label: 'Billing' },
  { to: '/student/profile', icon: Users, label: 'Profile' },
  { to: '/student/announcements', icon: Megaphone, label: 'Notices' },
  { to: '/student/typing-game', icon: Gamepad2, label: 'Nitro' },
]

const bursarLinks = [
  { to: '/bursar/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/bursar/fees', icon: CreditCard, label: 'Fees' },
  { to: '/bursar/daily-fees', icon: Wallet, label: 'Daily' },
  { to: '/bursar/debtors', icon: School, label: 'Classes' },
  { to: '/bursar/payroll', icon: Wallet, label: 'Payroll' },
  { to: '/bursar/inventory', icon: Library, label: 'Inventory' },
  { to: '/bursar/analytics', icon: BarChart3, label: 'Stats' },
  { to: '/bursar/reports', icon: FileSpreadsheet, label: 'Reports' },
  { to: '/bursar/sms', icon: MessageSquare, label: 'SMS' },
]

const parentLinks = [
  { to: '/parent/dashboard', icon: Home, label: 'Wards' },
  { to: '/parent/academics', icon: FileSpreadsheet, label: 'Results' },
  { to: '/parent/billing', icon: Wallet, label: 'Billing' },
  { to: '/parent/messages', icon: MessageSquare, label: 'Messages', notify: true },
  { to: '/parent/calendar', icon: Calendar, label: 'Calendar' },
]

export default function BottomNav() {
  const { user, isAdmin, isSuperAdmin, isStudent, isBursar, isTeacher } = useAuth()
  const location = useLocation()
  const [unread, setUnread] = useState(0)
  const [visible, setVisible] = useState(false)
  const [isGameFullScreen, setIsGameFullScreen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  // Check if teacher is allowed to collect daily fees
  const { data: collectorAuth, isLoading: loadingAuth } = useQuery({
    queryKey: ['daily-fee-auth', user?.id],
    queryFn: async () => {
      const res = await dailyFeesService.isTeacherCollector(user?.id!)
      return res?.data || null
    },
    enabled: isTeacher && !!user?.id
  })

  const isParent = user?.role === 'parent'
  let links = isSuperAdmin ? superAdminLinks : isParent ? parentLinks : isStudent ? studentLinks : isAdmin ? adminLinks : isBursar ? bursarLinks : teacherLinks

  // Hide daily collections from unauthorized teachers
  if (isTeacher && !loadingAuth && !collectorAuth) {
    links = links.filter(l => l.label !== 'Fees')
  }

  useEffect(() => {
    function check() { setVisible(window.innerWidth < 768) }
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

  if (isGameFullScreen) {
    return (
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10000,
        background: 'linear-gradient(90deg, #0a0a1f, #1a1a4b)',
        borderTop: '1px solid #00f3ff',
        padding: '16px',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 -10px 40px rgba(0, 243, 255, 0.3)',
        fontFamily: '"DM Sans", sans-serif',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'center', gap: 12 }}
        >
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00f3ff', boxShadow: '0 0 10px #00f3ff' }} />
          <span style={{ 
            color: '#00f3ff', fontWeight: 900, fontSize: 13, 
            letterSpacing: '0.2em', textTransform: 'uppercase',
            textShadow: '0 0 10px rgba(0, 243, 255, 0.5)'
          }}>
            WELL GAME FULL SCREEN
          </span>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00f3ff', boxShadow: '0 0 10px #00f3ff' }} />
        </motion.div>
      </nav>
    )
  }


  return (
    <>
      <style>{`
        @keyframes _bn_in { from{opacity:0;transform:translateY(100%)} to{opacity:1;transform:translateY(0)} }
        @keyframes _bn_pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
        .bn-item { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); flex-shrink: 0; min-width: 76px; }
        .bn-item:active { transform: scale(0.95); }
        .bn-active .bn-icon-box { background: rgba(124, 58, 237, 0.1) !important; transform: translateY(-2px); }
        .bn-active .bn-label { color: #6d28d9; font-weight: 700; transform: translateY(-1px); }
        .bn-fab { animation: _bn_pulse 2s ease-in-out infinite; }
        .bn-fab:hover { transform: scale(1.1) !important; animation: none; }
        .bn-fab:active { transform: scale(0.9) !important; }
      `}</style>

      {/* Floating Notification Trigger */}
      <div style={{
        position: 'fixed',
        bottom: 'calc(max(12px, env(safe-area-inset-bottom)) + 74px)',
        right: 18,
        zIndex: 1001,
        display: (visible && !isGameFullScreen) ? 'block' : 'none'
      }}>
        <button 
          onClick={() => setModalOpen(true)}
          className="bn-fab"
          style={{
            width: 54, height: 54, borderRadius: '50%',
            background: unread > 0 ? 'linear-gradient(135deg, #7c3aed, #4c1d95)' : '#fff',
            color: unread > 0 ? '#fff' : '#4c1d95',
            border: unread > 0 ? 'none' : '2px solid #ede9fe',
            boxShadow: '0 8px 24px rgba(109,40,217,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.2s', position: 'relative'
          }}
        >
          <Bell size={24} strokeWidth={2.5} />
          {unread > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              style={{
                position: 'absolute', top: -2, right: -2,
                minWidth: 20, height: 20, borderRadius: 10,
                background: '#ef4444', color: '#fff',
                fontSize: 11, fontWeight: 900,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid #fff', boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
              }}
            >
              {unread > 99 ? '!' : unread}
            </motion.span>
          )}
        </button>
      </div>

      <NotificationsModal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onRead={loadUnread}
      />

      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
        background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(109,40,217,0.08)',
        boxShadow: '0 -8px 30px rgba(0,0,0,0.04)',
        display: 'flex', alignItems: 'center',
        padding: '8px 12px',
        gap: 4,
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        animation: '_bn_in 0.5s ease',
        fontFamily: '"DM Sans", sans-serif',
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }}>
        <style>{`nav::-webkit-scrollbar { display: none; }`}</style>
        {links.map(({ to, icon: Icon, label, notify }: any) => {
          const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))

          return (
            <NavLink key={to} to={to}
              className={isActive ? 'bn-item bn-active' : 'bn-item'}
              style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 4, textDecoration: 'none',
              }}>
              
              <div className="bn-icon-box" style={{
                width: 52, height: 32, borderRadius: 16,
                background: 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
              }}>
                <Icon 
                  size={22} 
                  strokeWidth={isActive ? 2.5 : 2} 
                  color={isActive ? '#6d28d9' : '#64748b'} 
                />
                
                {notify && unread > 0 && (
                  <span style={{
                    position: 'absolute', top: -2, right: 10,
                    minWidth: 16, height: 16, borderRadius: 99,
                    background: '#ef4444', color: '#fff',
                    fontSize: 10, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid #fff', padding: '0 4px',
                    boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)',
                  }}>
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </div>

              <span className="bn-label" style={{
                fontSize: 11, fontWeight: 500,
                color: isActive ? '#6d28d9' : '#64748b',
                transition: 'all 0.2s',
                letterSpacing: '-0.01em',
              }}>
                {label}
              </span>
            </NavLink>
          )
        })}
      </nav>
    </>
  )
}