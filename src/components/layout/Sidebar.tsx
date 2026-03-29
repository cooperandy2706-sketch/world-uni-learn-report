// src/components/layout/Sidebar.tsx
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { ROUTES } from '../../constants/routes'

const adminLinks = [
  { to: ROUTES.ADMIN_DASHBOARD,      label: 'Dashboard',      icon: '⊞',  emoji: true },
  { to: ROUTES.ADMIN_STUDENTS,       label: 'Students',       icon: '👥',  emoji: true },
  { to: ROUTES.ADMIN_TEACHERS,       label: 'Teachers',       icon: '👨‍🏫', emoji: true },
  { to: ROUTES.ADMIN_CLASSES,        label: 'Classes',        icon: '🏫',  emoji: true },
  { to: ROUTES.ADMIN_SUBJECTS,       label: 'Subjects',       icon: '📚',  emoji: true },
  { to: ROUTES.ADMIN_DEPARTMENTS,    label: 'Departments',    icon: '🏛️',  emoji: true },
  { to: ROUTES.ADMIN_ACADEMIC_YEARS, label: 'Academic Years', icon: '📅',  emoji: true },
  { to: ROUTES.ADMIN_TERMS,          label: 'Terms',          icon: '📆',  emoji: true },
  { to: ROUTES.ADMIN_REPORTS,        label: 'Reports',        icon: '📄',  emoji: true },
  { to: ROUTES.ADMIN_ANALYTICS,      label: 'Analytics',      icon: '📊',  emoji: true },
  { to: ROUTES.ADMIN_SETTINGS,       label: 'Settings',       icon: '⚙️',  emoji: true },
  { to: ROUTES.ADMIN_TIMETABLE,     label: 'Timetable',       icon: '📅', emoji: true },
{ to: ROUTES.ADMIN_ANNOUNCEMENTS, label: 'Announcements',    icon: '📢', emoji: true },
{ to: ROUTES.ADMIN_SYLLABUS,      label: 'Syllabus',         icon: '📚', emoji: true },
{ to: ROUTES.ADMIN_WEEKLY_GOALS,  label: 'Weekly Goals',     icon: '🎯', emoji: true },
]

const teacherLinks = [
  { to: ROUTES.TEACHER_DASHBOARD,   label: 'Dashboard',   icon: '⊞',  emoji: true },
  { to: ROUTES.TEACHER_MY_CLASSES,  label: 'My Classes',  icon: '🏫',  emoji: true },
  { to: ROUTES.TEACHER_SCORE_ENTRY, label: 'Score Entry', icon: '✏️',  emoji: true },
  { to: ROUTES.TEACHER_REPORTS,     label: 'Reports',     icon: '📄',  emoji: true },
  { to: ROUTES.TEACHER_TIMETABLE,     label: 'Timetable',      icon: '📅', emoji: true },
{ to: ROUTES.TEACHER_NOTIFICATIONS, label: 'Notifications',  icon: '🔔', emoji: true },
]

// ── The GES-inspired logo mark ────────────────────────────
function LogoMark() {
  return (
    <div style={{
      width: 40, height: 40, borderRadius: 12, flexShrink: 0,
      background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
      boxShadow: '0 4px 14px rgba(245,158,11,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Graduation cap SVG */}
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white" opacity="0.95"/>
        <path d="M2 17c0 0 3.5 3 10 3s10-3 10-3" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.7"/>
        <path d="M2 7v10" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.6"/>
        <path d="M12 12v8" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.8"/>
      </svg>
    </div>
  )
}

export default function Sidebar() {
  const { user, signOut, isAdmin } = useAuth()
  const links = isAdmin ? adminLinks : teacherLinks
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _sideIn { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
        .sidebar-link { transition: all 0.15s ease !important; }
        .sidebar-link:hover { background: rgba(255,255,255,0.09) !important; }
        .sidebar-signout:hover { background: rgba(239,68,68,0.12) !important; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }
      `}</style>

      <aside style={{
        width: 248, minWidth: 248, height: '100vh',
        display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(175deg, #1e0646 0%, #3b0764 30%, #4c1d95 70%, #5b21b6 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        fontFamily: '"DM Sans", system-ui, sans-serif',
        userSelect: 'none', position: 'relative', overflow: 'hidden',
      }}>

        {/* Background decoration */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 180, height: 180, borderRadius: '50%', background: 'rgba(245,158,11,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 80, left: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />

        {/* ── Logo ── */}
        <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <LogoMark />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', lineHeight: 1 }}>World</div>
              <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.2, marginTop: 2 }}>
                Uni-Learn<br/>
                <span style={{ fontSize: 11, fontWeight: 400, color: 'rgba(255,255,255,0.6)', fontFamily: '"DM Sans",sans-serif' }}>Report System</span>
              </div>
            </div>
          </div>

          {/* Role badge */}
          <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 99, padding: '4px 10px' }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#f59e0b', animation: 'none' }} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
              {isAdmin ? 'Admin Console' : 'Teacher Portal'}
            </span>
          </div>
        </div>

        {/* ── Nav links ── */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 10px', position: 'relative', zIndex: 1 }}>
          {links.map(({ to, label, icon }, i) => (
            <NavLink key={to} to={to} style={{ textDecoration: 'none', display: 'block', marginBottom: 1 }}>
              {({ isActive }) => (
                <div
                  className="sidebar-link"
                  onMouseEnter={() => setHovered(to)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 12px', borderRadius: 10,
                    background: isActive
                      ? 'rgba(255,255,255,0.14)'
                      : 'transparent',
                    borderLeft: isActive ? '3px solid #f59e0b' : '3px solid transparent',
                    animation: `_sideIn 0.3s cubic-bezier(.4,0,.2,1) ${i * 0.04}s both`,
                  }}>
                  <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0, transition: 'transform 0.2s', transform: hovered === to && !isActive ? 'scale(1.1)' : 'scale(1)' }}>
                    {icon}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? '#fff' : 'rgba(255,255,255,0.58)', transition: 'color 0.15s' }}>
                    {label}
                  </span>
                  {isActive && <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#f59e0b' }} />}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* ── User footer ── */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.07)', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 12,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            marginBottom: 8,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 900, color: '#fff',
              boxShadow: '0 2px 8px rgba(245,158,11,0.4)',
            }}>
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
                {user?.full_name}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'capitalize', marginTop: 1 }}>
                {user?.email}
              </div>
            </div>
          </div>

          <button
            className="sidebar-signout"
            onClick={signOut}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 9,
              padding: '9px 12px', borderRadius: 10,
              border: 'none', background: 'transparent',
              cursor: 'pointer', transition: 'background 0.15s',
            }}>
            <span style={{ fontSize: 15 }}>🚪</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(252,165,165,0.75)' }}>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  )
}