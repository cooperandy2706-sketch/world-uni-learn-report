import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
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
  Package, ShoppingCart, RefreshCcw, Gamepad2, Library
} from 'lucide-react'

const adminLinks = [
  { to: ROUTES.ADMIN_DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
  { to: ROUTES.ADMIN_STUDENTS, label: 'Students', icon: Users },
  { to: ROUTES.ADMIN_TEACHERS, label: 'Teachers', icon: UserCheck },
  { to: ROUTES.ADMIN_OTHER_STAFF, label: 'Other Staff', icon: Users },
  { to: '/admin/bursars', label: 'Bursar Staff', icon: Wallet },
  { to: ROUTES.ADMIN_CLASSES, label: 'Classes', icon: School },
  { to: ROUTES.ADMIN_SUBJECTS, label: 'Subjects', icon: BookOpen },
  { to: ROUTES.ADMIN_DEPARTMENTS, label: 'Departments', icon: Building2 },
  { to: ROUTES.ADMIN_ACADEMIC_YEARS, label: 'Academic Years', icon: Calendar },
  { to: ROUTES.ADMIN_TERMS, label: 'Terms', icon: Calendar },
  { to: ROUTES.ADMIN_REPORTS, label: 'Reports', icon: FileSpreadsheet },
  { to: ROUTES.ADMIN_ANALYTICS, label: 'Analytics', icon: BarChart3 },
  { to: ROUTES.ADMIN_SETTINGS, label: 'Settings', icon: Settings },
  { to: ROUTES.ADMIN_TIMETABLE, label: 'Timetable', icon: Calendar },
  { to: ROUTES.ADMIN_ANNOUNCEMENTS, label: 'Announcements', icon: Megaphone },
  { to: ROUTES.ADMIN_SYLLABUS, label: 'Syllabus', icon: Book },
  { to: ROUTES.ADMIN_WEEKLY_GOALS, label: 'Weekly Goals', icon: Target },
  { to: ROUTES.ADMIN_ATTENDANCE, label: 'Attendance', icon: ClipboardCheck },
  { to: ROUTES.ADMIN_MESSAGES, label: 'Messages', icon: MessageSquare },
  { to: '/admin/agenda', label: 'Term Agenda', icon: ClipboardList },
]

const teacherLinks = [
  { to: ROUTES.TEACHER_DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
  { to: ROUTES.TEACHER_MY_CLASSES, label: 'My Classes', icon: School },
  { to: ROUTES.TEACHER_STUDENTS, label: 'Students', icon: Users },
  { to: ROUTES.TEACHER_SCORE_ENTRY, label: 'Score Entry', icon: PencilLine },
  { to: ROUTES.TEACHER_REPORTS, label: 'Reports', icon: FileSpreadsheet },
  { to: ROUTES.TEACHER_TIMETABLE, label: 'Timetable', icon: Calendar },
  { to: ROUTES.TEACHER_NOTIFICATIONS, label: 'Notifications', icon: Bell },
  { to: ROUTES.TEACHER_SYLLABUS, label: 'Syllabus', icon: Book },
  { to: ROUTES.TEACHER_LESSON_TRACKER, label: 'Lesson Tracker', icon: Timer },
  { to: ROUTES.TEACHER_ASSIGNMENTS, label: 'Assignments', icon: ClipboardList },
  { to: ROUTES.TEACHER_SUBJECTS, label: 'Library', icon: BookOpen },
  { to: ROUTES.TEACHER_ATTENDANCE, label: 'Attendance', icon: ClipboardCheck },
  { to: '/teacher/daily-fees', label: 'Daily Collections', icon: CreditCard },
  { to: ROUTES.TEACHER_MESSAGES, label: 'Messages', icon: MessageSquare },
  { to: '/teacher/agenda', label: 'Term Agenda', icon: ClipboardList },
  { to: ROUTES.TEACHER_TYPING_GAME, label: 'Typing Nitro', icon: Gamepad2 },
]

const superAdminLinks = [
  { to: ROUTES.SUPER_ADMIN_DASHBOARD, label: 'Platform Hub', icon: ShieldCheck },
  { to: ROUTES.SUPER_ADMIN_SCHOOLS, label: 'School Registry', icon: School },
  { to: ROUTES.SUPER_ADMIN_QUIZZES, label: 'Monthly Quizzes', icon: ClipboardList },
  { to: ROUTES.SUPER_ADMIN_MESSAGING, label: 'Global Messaging', icon: MessageSquare },
  { to: ROUTES.SUPER_ADMIN_ANALYTICS, label: 'Leaderboards', icon: Trophy },
  { to: ROUTES.SUPER_ADMIN_SUBJECTS, label: 'Platform Subjects', icon: BookOpen },
  { to: ROUTES.SUPER_ADMIN_RESOURCES, label: 'Learning Materials', icon: Book },
]

const studentLinks = [
  { to: ROUTES.STUDENT_DASHBOARD, label: 'My Portal', icon: LayoutDashboard },
  { to: ROUTES.STUDENT_ASSIGNMENTS, label: 'Assignments', icon: ClipboardList },
  { to: ROUTES.STUDENT_LIBRARY, label: 'Global Library', icon: Library },
  { to: ROUTES.STUDENT_RESULTS, label: 'Academic Results', icon: BarChart3 },
  { to: ROUTES.STUDENT_SCHEDULE, label: 'My Schedule', icon: Calendar },
  { to: ROUTES.STUDENT_TYPING_GAME, label: 'Typing Nitro', icon: Gamepad2 },
]

const bursarLinks = [
  { to: ROUTES.BURSAR_DASHBOARD,  label: 'Dashboard',   icon: LayoutDashboard },
  { to: ROUTES.BURSAR_STUDENTS,   label: 'Students',    icon: Users },
  { to: ROUTES.BURSAR_FEES,       label: 'School Fees',  icon: CreditCard },
  { to: '/bursar/daily-fees',     label: 'Daily Fees',   icon: Wallet },
  { to: ROUTES.BURSAR_INVENTORY,  label: 'School Store', icon: ShoppingBag },
  { to: ROUTES.BURSAR_DEBTORS,    label: 'Debtors List', icon: AlertCircle },
  { to: ROUTES.BURSAR_BILL_SHEET, label: 'Bill Sheet',   icon: FileText },
  { to: ROUTES.BURSAR_PAYROLL,    label: 'Payroll',      icon: Wallet },
  { to: ROUTES.BURSAR_INCOME,     label: 'Income',       icon: TrendingUp },
  { to: ROUTES.BURSAR_EXPENSES,   label: 'Expenses',     icon: TrendingDown },
  { to: ROUTES.BURSAR_REPORTS,    label: 'Financial Reports', icon: FileSpreadsheet },
  { to: ROUTES.BURSAR_ANALYTICS,  label: 'Analytics',    icon: BarChart3 },
]

// ── Logo Mark ────────────────────────────
function LogoMark() {
  return (
    <div style={{
      width: 40, height: 40, borderRadius: 12, flexShrink: 0,
      background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
      boxShadow: '0 4px 14px rgba(245,158,11,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white" opacity="0.95" />
        <path d="M2 17c0 0 3.5 3 10 3s10-3 10-3" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
        <path d="M2 7v10" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />
        <path d="M12 12v8" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />
      </svg>
    </div>
  )
}

export default function Sidebar() {
  const { user, signOut, isAdmin, isSuperAdmin, isStudent, isBursar, isTeacher } = useAuth()
  
  // Check if teacher is allowed to collect daily fees
  const { data: collectorAuth, isLoading: loadingAuth } = useQuery({
    queryKey: ['daily-fee-auth', user?.id],
    queryFn: async () => {
      const res = await dailyFeesService.isTeacherCollector(user?.id!)
      return res?.data || null
    },
    enabled: isTeacher && !!user?.id
  })

  // Live unread message count for the Messages badge
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

  let links = isSuperAdmin ? superAdminLinks : isStudent ? studentLinks : isAdmin ? adminLinks : isBursar ? bursarLinks : teacherLinks
  
  // Hide daily collections from unauthorized teachers
  if (isTeacher && !loadingAuth && !collectorAuth) {
    links = links.filter(l => l.label !== 'Daily Collections')
  }

  const [hovered, setHovered] = useState<string | null>(null)

  // ── Collapsed State (Persistent) ────────────────────────────
  const [collapsed, setCollapsed] = useState(() => {
    const s = localStorage.getItem('sidebar_collapsed')
    return s === 'true'
  })

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', String(collapsed))
  }, [collapsed])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _sideIn { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
        .sidebar-link { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; }
        .sidebar-link:hover { background: rgba(255,255,255,0.08) !important; transform: translateX( ${collapsed ? '0' : '4px'} ); }
        .sidebar-signout:hover { background: rgba(239,68,68,0.12) !important; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }
        .collapse-btn { 
          position: absolute; right: -16px; top: 40px; z-index: 200;
          background: #fbbf24; color: #1e0646; border: 2px solid #3b0764; 
          width: 32px; height: 32px; border-radius: 50%; cursor: pointer; 
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3); transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .collapse-btn:hover { transform: scale(1.15); background: #f59e0b; box-shadow: 0 0 15px rgba(245,158,11,0.5); }
      `}</style>

      <aside style={{
        width: collapsed ? 80 : 260, minWidth: collapsed ? 80 : 260, height: '100vh',
        display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(175deg, #1e0646 0%, #3b0764 30%, #4c1d95 70%, #5b21b6 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        fontFamily: '"DM Sans", system-ui, sans-serif',
        userSelect: 'none', position: 'relative', overflow: 'visible',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 150,
      }}>

        {/* Toggle Button */}
        <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ChevronLeft size={14} strokeWidth={3} />}
        </button>

        <div style={{ position: 'absolute', top: -60, right: -60, width: 180, height: 180, borderRadius: '50%', background: 'rgba(245,158,11,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 80, left: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />

        {/* ── Logo ── */}
        <div style={{ padding: collapsed ? '24px 20px 18px' : '24px 20px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: collapsed ? 'center' : 'flex-start' }}>
            <LogoMark />
            <div style={{ minWidth: 0, opacity: collapsed ? 0 : 1, width: collapsed ? 0 : 'auto', transition: 'all 0.2s', overflow: 'hidden' }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>World</div>
              <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 15, fontWeight: 700, color: '#fff', lineHeight: 1.2, marginTop: 2 }}>
                Uni-Learn<br />
                <span style={{ fontSize: 11, fontWeight: 400, color: 'rgba(255,255,255,0.6)', fontFamily: '"DM Sans",sans-serif' }}>Platform</span>
              </div>
            </div>
          </div>

          <div style={{
            marginTop: 14, display: collapsed ? 'none' : 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 99, padding: '4px 12px',
            opacity: collapsed ? 0 : 1, transition: 'all 0.2s'
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: isSuperAdmin ? '#10b981' : isStudent ? '#a78bfa' : '#fbbf24' }} />
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
              {isSuperAdmin ? 'Master Portal' : isStudent ? 'Student Access' : isAdmin ? 'Admin Console' : 'Teacher View'}
            </span>
          </div>
        </div>

        {/* ── Nav links ── */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: collapsed ? '16px 12px' : '16px 14px', position: 'relative', zIndex: 1 }}>
          {links.map(({ to, label, icon: Icon }, i) => (
            <NavLink key={to} to={to} style={{ textDecoration: 'none', display: 'block', marginBottom: 6 }} aria-label={label}>
              {({ isActive }) => (
                <div
                  className="sidebar-link"
                  onMouseEnter={() => setHovered(to)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 12,
                    padding: '10px 14px', borderRadius: 14,
                    background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                    borderLeft: !collapsed && isActive ? '4px solid #fbbf24' : '4px solid transparent',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    animation: `_sideIn 0.4s ease ${i * 0.05}s both`,
                    boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
                    height: 44,
                  }}>
                  {/* Icon with optional unread dot */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <Icon
                      size={20}
                      strokeWidth={isActive ? 2.5 : 2}
                      color={isActive ? '#fbbf24' : hovered === to ? '#fff' : 'rgba(255,255,255,0.5)'}
                      style={{ transition: 'all 0.2s', display: 'block' }}
                    />
                    {label === 'Messages' && unreadMsgs > 0 && collapsed && (
                      <span style={{
                        position: 'absolute', top: -5, right: -6,
                        background: '#ef4444', color: '#fff',
                        fontSize: 9, fontWeight: 800, borderRadius: 99,
                        padding: '0 3px', minWidth: 14, textAlign: 'center', lineHeight: '14px',
                        border: '1.5px solid #1e0646',
                      }}>{unreadMsgs > 99 ? '99+' : unreadMsgs}</span>
                    )}
                  </div>
                  {!collapsed && (
                    <span style={{
                      fontSize: 13.5,
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? '#fff' : hovered === to ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.6)',
                      transition: 'all 0.22s',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      flex: 1,
                    }}>
                      {label}
                    </span>
                  )}
                  {/* Expanded unread pill */}
                  {!collapsed && label === 'Messages' && unreadMsgs > 0 && (
                    <span style={{
                      background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 800,
                      borderRadius: 99, padding: '1px 6px', marginLeft: 'auto', flexShrink: 0,
                    }}>{unreadMsgs > 99 ? '99+' : unreadMsgs}</span>
                  )}
                  {!collapsed && isActive && label !== 'Messages' && (
                    <div style={{ marginLeft: 'auto', width: 4, height: 4, borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 8px #fbbf24' }} />
                  )}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* ── User footer ── */}
        <div style={{ padding: '16px 14px', borderTop: '1px solid rgba(255,255,255,0.07)', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 14px', borderRadius: 16,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            marginBottom: 10,
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 12, flexShrink: 0,
              background: (user?.school as any)?.logo_url ? '#fff' : 'linear-gradient(135deg, #fbbf24, #f59e0b)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, fontWeight: 900, color: '#fff',
              boxShadow: (user?.school as any)?.logo_url ? '0 1px 4px rgba(0,0,0,0.1)' : '0 4px 12px rgba(245,158,11,0.3)',
              overflow: 'hidden',
              border: (user?.school as any)?.logo_url ? '1px solid rgba(255,255,255,0.1)' : 'none',
            }}>
              {(user?.school as any)?.logo_url ? (
                <img src={(user.school as any).logo_url} alt="School" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                user?.full_name?.charAt(0).toUpperCase()
              )}
            </div>
            {!collapsed && (
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.full_name}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.email}
                </div>
              </div>
            )}
          </div>

          <button
            className="sidebar-signout"
            onClick={signOut}
            aria-label="Sign out"
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 12,
              border: 'none', background: 'transparent',
              cursor: 'pointer', transition: 'all 0.2s',
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}>
            <LogOut size={18} color="rgba(252,165,165,0.7)" />
            {!collapsed && <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(252,165,165,0.7)' }}>End Session</span>}
          </button>
        </div>
      </aside>
    </>
  )
}