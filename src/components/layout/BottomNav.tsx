// src/components/layout/BottomNav.tsx
// Mobile bottom navigation bar — shows only on screens < 768px
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const adminLinks = [
  { to: '/admin/dashboard', icon: '⊞', label: 'Home' },
  { to: '/admin/students', icon: '👥', label: 'Students' },
  { to: '/admin/reports', icon: '📄', label: 'Reports' },
  { to: '/admin/attendance', icon: '📋', label: 'Register' },
  { to: '/admin/announcements', icon: '📢', label: 'Posts' },
]

const teacherLinks = [
  { to: '/teacher/dashboard', icon: '⊞', label: 'Home' },
  { to: '/teacher/score-entry', icon: '✏️', label: 'Scores' },
  { to: '/teacher/timetable', icon: '📅', label: 'Timetable' },
  { to: '/teacher/lesson-tracker', icon: '⏱️', label: 'Tracker' },
  { to: '/teacher/attendance', icon: '📋', label: 'Register' },
]

export default function BottomNav() {
  const { user, isAdmin } = useAuth()
  const location = useLocation()
  const [unread, setUnread] = useState(0)
  const [visible, setVisible] = useState(false)

  // Only show on mobile
  useEffect(() => {
    function check() { setVisible(window.innerWidth < 768) }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Load unread count for teachers
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

  const links = isAdmin ? adminLinks : teacherLinks

  return (
    <>
      <style>{`
        @keyframes _bn_in { from{opacity:0;transform:translateY(100%)} to{opacity:1;transform:translateY(0)} }
        .bn-item { transition: all 0.15s; }
        .bn-item:active { transform: scale(0.92); }
        .bn-active .bn-icon { background: linear-gradient(135deg,#7c3aed,#6d28d9); }
        .bn-active .bn-label { color: #6d28d9; font-weight: 700; }
        .bn-active .bn-icon span { filter: none; }
      `}</style>

      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
        background: 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid #f0eefe',
        boxShadow: '0 -4px 24px rgba(109,40,217,0.1)',
        display: 'flex', alignItems: 'center',
        padding: '0 4px 4px',
        paddingBottom: 'max(4px, env(safe-area-inset-bottom))',
        animation: '_bn_in 0.4s ease',
        fontFamily: '"DM Sans", sans-serif',
      }}>
        {links.map(link => {
          const isActive = location.pathname === link.to ||
            (link.to !== '/admin/dashboard' && link.to !== '/teacher/dashboard' &&
              location.pathname.startsWith(link.to))

          return (
            <NavLink key={link.to} to={link.to}
              className={isActive ? 'bn-item bn-active' : 'bn-item'}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 3, padding: '8px 4px',
                textDecoration: 'none',
              }}>
              {/* Icon pill */}
              <div className="bn-icon" style={{
                width: 44, height: 28, borderRadius: 99,
                background: isActive
                  ? 'linear-gradient(135deg,#7c3aed,#6d28d9)'
                  : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, transition: 'all 0.2s',
                position: 'relative',
              }}>
                <span style={{ fontSize: 16, lineHeight: 1 }}>{link.icon}</span>
                {/* Notification badge */}
                {(link as any).notify && unread > 0 && (
                  <span style={{
                    position: 'absolute', top: -4, right: -2,
                    minWidth: 16, height: 16, borderRadius: 99,
                    background: '#dc2626', color: '#fff',
                    fontSize: 9, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1.5px solid #fff', padding: '0 3px',
                  }}>
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </div>

              {/* Label */}
              <span className="bn-label" style={{
                fontSize: 10, fontWeight: 500,
                color: isActive ? '#6d28d9' : '#6b7280',
                transition: 'all 0.15s',
                letterSpacing: isActive ? '0' : '-0.01em',
              }}>
                {link.label}
              </span>
            </NavLink>
          )
        })}
      </nav>
    </>
  )
}