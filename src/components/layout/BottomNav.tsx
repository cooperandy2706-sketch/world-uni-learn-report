// src/components/layout/BottomNav.tsx
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { 
  LayoutDashboard, Users, FileSpreadsheet, ClipboardCheck, 
  Megaphone, PencilLine, Calendar, Timer, BookOpen, 
  ShieldCheck, ClipboardList, MessageSquare, Home, BarChart3, UserCheck, Book, School
} from 'lucide-react'

const adminLinks = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/admin/students', icon: Users, label: 'Students' },
  { to: '/admin/reports', icon: FileSpreadsheet, label: 'Reports' },
  { to: '/admin/attendance', icon: ClipboardCheck, label: 'Register' },
  { to: '/admin/announcements', icon: Megaphone, label: 'Posts' },
]

const teacherLinks = [
  { to: '/teacher/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/teacher/score-entry', icon: PencilLine, label: 'Scores' },
  { to: '/teacher/timetable', icon: Calendar, label: 'Schedule' },
  { to: '/teacher/lesson-tracker', icon: Timer, label: 'Tracker' },
  { to: '/teacher/attendance', icon: ClipboardCheck, label: 'Register' },
  { to: '/teacher/subjects', icon: BookOpen, label: 'Library' },
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
  { to: '/student/subjects', icon: BookOpen, label: 'Library' },
  { to: '/student/results', icon: BarChart3, label: 'Results' },
  { to: '/student/schedule', icon: Calendar, label: 'Schedule' },
]

export default function BottomNav() {
  const { user, isAdmin, isSuperAdmin, isStudent } = useAuth()
  const location = useLocation()
  const [unread, setUnread] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function check() { setVisible(window.innerWidth < 768) }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
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

  if (!visible) return null

  const links = isSuperAdmin ? superAdminLinks : isStudent ? studentLinks : isAdmin ? adminLinks : teacherLinks

  return (
    <>
      <style>{`
        @keyframes _bn_in { from{opacity:0;transform:translateY(100%)} to{opacity:1;transform:translateY(0)} }
        .bn-item { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); flex: 1; }
        .bn-item:active { transform: scale(0.95); }
        .bn-active .bn-icon-box { background: rgba(124, 58, 237, 0.1) !important; transform: translateY(-2px); }
        .bn-active .bn-label { color: #6d28d9; font-weight: 700; transform: translateY(-1px); }
      `}</style>

      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
        background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(109,40,217,0.08)',
        boxShadow: '0 -8px 30px rgba(0,0,0,0.04)',
        display: 'flex', alignItems: 'center',
        padding: '8px 12px',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        animation: '_bn_in 0.5s ease',
        fontFamily: '"DM Sans", sans-serif',
      }}>
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