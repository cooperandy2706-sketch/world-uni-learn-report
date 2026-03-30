// src/components/layout/Header.tsx
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useCurrentTerm, useCurrentAcademicYear } from '../../hooks/useSettings'
import NotificationBell from './NotificationBell'

export default function Header() {
  const { user, signOut, isAdmin } = useAuth()
  const { data: term }  = useCurrentTerm()
  const { data: year }  = useCurrentAcademicYear()
  const navigate        = useNavigate()
  const [open, setOpen] = useState(false)
  const [signing, setSigning] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function handleSignOut() {
    setSigning(true)
    await signOut()
    navigate('/login')
  }

  const adminMenu = [
    { icon: '⊞',  label: 'Dashboard',    path: '/admin/dashboard' },
    { icon: '⚙️', label: 'Settings',      path: '/admin/settings' },
    { icon: '📊', label: 'Analytics',     path: '/admin/analytics' },
    { icon: '📢', label: 'Announcements', path: '/admin/announcements' },
    { divider: true },
    { icon: '🔒', label: 'Sign Out', action: handleSignOut, danger: true },
  ]

  const teacherMenu = [
    { icon: '⊞',  label: 'Dashboard',     path: '/teacher/dashboard' },
    { icon: '🔔', label: 'Notifications',  path: '/teacher/notifications' },
    { icon: '📅', label: 'My Timetable',   path: '/teacher/timetable' },
    { icon: '📚', label: 'My Classes',     path: '/teacher/my-classes' },
    { divider: true },
    { icon: '🔒', label: 'Sign Out', action: handleSignOut, danger: true },
  ]

  const menu = isAdmin ? adminMenu : teacherMenu

  return (
    <>
      <style>{`
        @keyframes _hdr_pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes _hdr_in { from{opacity:0;transform:translateY(-8px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        .hdr-menu-item:hover { background: #f5f3ff !important; }
        .hdr-menu-item { transition: background .12s; }
        .hdr-avatar:hover { transform: scale(1.06); box-shadow: 0 0 0 3px rgba(124,58,237,.25) !important; }
        .hdr-avatar { transition: all .2s; cursor: pointer; }
      `}</style>

      <header className="app-header" style={{
        height: 64, display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'0 32px', background:'#fff', flexShrink:0,
        borderBottom:'1px solid #f0eefe',
        boxShadow:'0 1px 8px rgba(109,40,217,.06)',
        fontFamily:'"DM Sans",system-ui,sans-serif',
        position:'relative', zIndex:100,
      }}>

        {/* ── Left: term badge ── */}
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          {year && term ? (
            <div style={{
              display:'inline-flex', alignItems:'center', gap:7,
              background:'linear-gradient(135deg,#f5f3ff,#ede9fe)',
              border:'1px solid #ddd6fe', borderRadius:99, padding:'6px 14px',
            }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:'#f59e0b', animation:'_hdr_pulse 2s infinite' }}/>
              <span style={{ fontSize:12, fontWeight:600, color:'#5b21b6' }}>
                {(year as any).name} &nbsp;·&nbsp; {(term as any).name}
              </span>
              {(term as any).is_locked && (
                <span style={{ fontSize:10, fontWeight:700, color:'#dc2626', background:'#fef2f2', borderRadius:99, padding:'1px 7px' }}>LOCKED</span>
              )}
            </div>
          ) : (
            <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:99, padding:'5px 14px', fontSize:12, fontWeight:600, color:'#92400e' }}>
              ⚠ No active term
            </div>
          )}
        </div>

        {/* ── Right: bell + avatar ── */}
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>

          {/* Notification bell — teachers only */}
          {!isAdmin && <NotificationBell />}

          <div style={{ width:1, height:24, background:'#f0eefe' }}/>

          {/* Avatar dropdown trigger */}
          <div ref={ref} style={{ position:'relative' }}>
            <div className="hdr-avatar"
              onClick={() => setOpen(o => !o)}
              style={{
                display:'flex', alignItems:'center', gap:10,
                padding:'5px 10px 5px 5px',
                borderRadius:99, border:`1.5px solid ${open?'#ddd6fe':'transparent'}`,
                background: open ? '#f5f3ff' : 'transparent',
              }}>
              {/* Avatar circle */}
              <div style={{
                width:34, height:34, borderRadius:'50%', flexShrink:0,
                background:'linear-gradient(135deg,#7c3aed,#6d28d9)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:13, fontWeight:800, color:'#fff',
                boxShadow:'0 2px 8px rgba(109,40,217,.3)',
              }}>
                {user?.full_name?.charAt(0).toUpperCase()}
              </div>
              {/* Name — hidden on mobile */}
              <div style={{ display:'flex', flexDirection:'column' }}
                className="hdr-name">
                <style>{`@media(max-width:767px){.hdr-name{display:none!important}}`}</style>
                <span style={{ fontSize:13, fontWeight:600, color:'#111827', lineHeight:1.2, whiteSpace:'nowrap' }}>{user?.full_name}</span>
                <span style={{ fontSize:10, color:'#a78bfa', textTransform:'capitalize' }}>{user?.role}</span>
              </div>
              {/* Chevron */}
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                style={{ transition:'transform .2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink:0 }}>
                <path d="M2 4l4 4 4-4" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            {/* Dropdown menu */}
            {open && (
              <div style={{
                position:'absolute', top:50, right:0,
                width:230, background:'#fff',
                borderRadius:16, border:'1.5px solid #f0eefe',
                boxShadow:'0 8px 40px rgba(109,40,217,.14)',
                overflow:'hidden', zIndex:999,
                animation:'_hdr_in .18s ease',
                fontFamily:'"DM Sans",sans-serif',
              }}>
                {/* User info header */}
                <div style={{ padding:'14px 16px', borderBottom:'1px solid #f5f3ff', display:'flex', gap:10, alignItems:'center' }}>
                  <div style={{
                    width:40, height:40, borderRadius:'50%', flexShrink:0,
                    background:'linear-gradient(135deg,#7c3aed,#6d28d9)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:16, fontWeight:800, color:'#fff',
                  }}>
                    {user?.full_name?.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.full_name}</div>
                    <div style={{ fontSize:11, color:'#6b7280', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.email}</div>
                    <span style={{ fontSize:10, fontWeight:700, padding:'1px 7px', borderRadius:99, background:'#f5f3ff', color:'#6d28d9', textTransform:'capitalize', display:'inline-block', marginTop:2 }}>
                      {user?.role}
                    </span>
                  </div>
                </div>

                {/* Menu items */}
                <div style={{ padding:'6px 0' }}>
                  {menu.map((item: any, i) => {
                    if (item.divider) return (
                      <div key={i} style={{ height:1, background:'#f5f3ff', margin:'4px 0' }}/>
                    )
                    return (
                      <button key={i} className="hdr-menu-item"
                        onClick={() => {
                          setOpen(false)
                          if (item.action) item.action()
                          else if (item.path) navigate(item.path)
                        }}
                        style={{
                          width:'100%', display:'flex', alignItems:'center', gap:10,
                          padding:'10px 16px', border:'none', background:'transparent',
                          cursor:'pointer', textAlign:'left', fontFamily:'"DM Sans",sans-serif',
                        }}>
                        <span style={{
                          width:32, height:32, borderRadius:9, flexShrink:0,
                          background: item.danger ? '#fef2f2' : '#f5f3ff',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:15,
                        }}>
                          {item.icon}
                        </span>
                        <span style={{
                          fontSize:13, fontWeight:500,
                          color: item.danger ? '#dc2626' : '#374151',
                        }}>
                          {item.label}
                          {item.label === 'Sign Out' && signing && '…'}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Footer */}
                <div style={{ padding:'8px 16px 12px', borderTop:'1px solid #f5f3ff' }}>
                  <p style={{ fontSize:10, color:'#9ca3af', margin:0, textAlign:'center' }}>
                    WULA Reports · World Uni-Learn Academy
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  )
}