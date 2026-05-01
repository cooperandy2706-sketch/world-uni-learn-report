// src/components/layout/Sidebar.tsx
import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import { useSchoolStorage } from '../../hooks/useSchoolStorage'
import { dailyFeesService } from '../../services/bursar.service'
import { supabase } from '../../lib/supabase'
import { ROUTES } from '../../constants/routes'
import {
  LayoutDashboard, Users, UserCheck, School, BookOpen, Building2,
  Calendar, FileSpreadsheet, BarChart3, Settings, Megaphone,
  Target, ClipboardCheck, PencilLine, Bell, Timer, ClipboardList,
  MessageSquare, Trophy, ShieldCheck, LogOut, Book,
  ChevronLeft, ChevronRight, Wallet, Banknote, Receipt, TrendingDown,
  TrendingUp, AlertCircle, CreditCard, FileText, ShoppingBag, ChevronDown,
  Package, ShoppingCart, RefreshCcw, Gamepad2, Library, GraduationCap,
  Smartphone, Calculator, Grid, Vote, Image, UserPlus, Heart, Search, ArrowUpRight,
  Plus, Monitor, Truck, Armchair, Box
} from 'lucide-react'

const adminLinks = [
  { header: 'General' },
  { to: ROUTES.ADMIN_DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/tasks', label: 'Admin Tasks', icon: ClipboardCheck },
  { to: ROUTES.ADMIN_CALENDAR, label: 'School Calendar', icon: Calendar },
  { to: ROUTES.ADMIN_MESSAGES, label: 'Messages', icon: MessageSquare },

  { header: 'Academics' },
  { to: ROUTES.ADMIN_CLASSES, label: 'Classes', icon: School },
  { to: ROUTES.ADMIN_SUBJECTS, label: 'Subjects', icon: BookOpen },
  { to: ROUTES.ADMIN_ATTENDANCE, label: 'Attendance', icon: ClipboardCheck },
  { to: ROUTES.ADMIN_TIMETABLE, label: 'Timetable', icon: Timer },
  { to: ROUTES.ADMIN_SYLLABUS, label: 'Syllabus', icon: Book },
  { to: ROUTES.ADMIN_WEEKLY_GOALS, label: 'Weekly Goals', icon: Target },
  { to: ROUTES.ADMIN_REPORTS, label: 'Report Cards', icon: FileSpreadsheet },
  { to: '/admin/batch-promotion', label: 'Batch Promotion', icon: ArrowUpRight },
  { to: '/admin/bece-processor', label: 'BECE CA Processor', icon: Calculator },
  { to: '/admin/lesson-plans', label: 'Lesson Plans', icon: BookOpen },

  { header: 'People' },
  { to: ROUTES.ADMIN_STUDENTS, label: 'Student Directory', icon: Users },
  { to: '/admin/student-vault', label: 'Student Vault', icon: ShieldCheck },
  { to: ROUTES.ADMIN_TEACHERS, label: 'Staff Directory', icon: UserCheck },
  { to: '/admin/parents', label: 'Parent Logins', icon: UserPlus },
  { to: '/admin/admissions', label: 'Admissions', icon: GraduationCap },
  { to: ROUTES.ADMIN_SMS, label: 'SMS Messaging', icon: Smartphone },

  { header: 'HR & Operations' },
  { to: '/admin/staff-requests', label: 'Staff Requests', icon: MessageSquare },
  { to: '/admin/assets', label: 'Asset Register', icon: Package },
  { to: '/admin/billing', label: 'Billing & Subscription', icon: CreditCard },
  { to: '/admin/bursars', label: 'Bursar Staff', icon: Wallet },
  { to: '/admin/poster-maker', label: 'Poster Maker', icon: Image },
  { to: '/admin/elections', label: 'Elections (PEC)', icon: Vote },
  { to: ROUTES.ADMIN_ALUMNI, label: 'Alumni & Fundraising', icon: Heart },

  { header: 'Insights & Setup' },
  { to: ROUTES.ADMIN_ANALYTICS, label: 'School Analytics', icon: BarChart3 },
  { to: ROUTES.ADMIN_ACADEMIC_YEARS, label: 'Academic Years', icon: Calendar },
  { to: ROUTES.ADMIN_TERMS, label: 'Terms Management', icon: Calendar },
  { to: ROUTES.ADMIN_SETTINGS, label: 'System Settings', icon: Settings },
]

const teacherLinks = [
  { header: 'General' },
  { to: ROUTES.TEACHER_DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
  { to: '/teacher/self-service', label: 'Self Service', icon: UserCheck },
  { to: ROUTES.TEACHER_MESSAGES, label: 'Messages', icon: MessageSquare },
  { to: ROUTES.TEACHER_NOTIFICATIONS, label: 'Notifications', icon: Bell },

  { header: 'Instructional' },
  { to: ROUTES.TEACHER_MY_CLASSES, label: 'My Classes', icon: School },
  { to: ROUTES.TEACHER_STUDENTS, label: 'Students', icon: Users },
  { to: '/teacher/behavior', label: 'Behavior Log', icon: ShieldCheck },
  { to: '/teacher/class-tests', label: 'Class Tests', icon: ClipboardList },
  { to: ROUTES.TEACHER_SCORE_ENTRY, label: 'Score Entry', icon: PencilLine },
  { to: ROUTES.TEACHER_REPORTS, label: 'Reports', icon: FileSpreadsheet },
  { to: ROUTES.TEACHER_TIMETABLE, label: 'Timetable', icon: Calendar },
  { to: ROUTES.TEACHER_ATTENDANCE, label: 'Attendance', icon: ClipboardCheck },
  { to: ROUTES.TEACHER_SYLLABUS, label: 'Syllabus', icon: Book },
  { to: ROUTES.TEACHER_LESSON_TRACKER, label: 'Lesson Tracker', icon: Timer },
  { to: ROUTES.TEACHER_ASSIGNMENTS, label: 'Assignments', icon: ClipboardList },
  { to: ROUTES.TEACHER_SUBJECTS, label: 'Library', icon: BookOpen },
  { to: '/teacher/daily-fees', label: 'Daily Collections', icon: CreditCard },

  { header: 'Extras' },
  { to: '/teacher/agenda', label: 'Term Agenda', icon: ClipboardList },
  { to: '/teacher/elections-hub', label: 'Elections (PEC)', icon: Vote },
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
  { header: 'General' },
  { to: ROUTES.STUDENT_DASHBOARD, label: 'My Portal', icon: LayoutDashboard },
  { to: ROUTES.STUDENT_PROFILE, label: 'My Profile', icon: UserCheck },
  { to: ROUTES.STUDENT_ANNOUNCEMENTS, label: 'Notice Board', icon: Megaphone },
  { to: ROUTES.STUDENT_CALENDAR, label: 'School Calendar', icon: Calendar },

  { header: 'Academic Hub' },
  { to: ROUTES.STUDENT_RESULTS, label: 'Academic Results', icon: BarChart3 },
  { to: ROUTES.STUDENT_ASSIGNMENTS, label: 'Assignments & Quizzes', icon: ClipboardList },
  { to: ROUTES.STUDENT_ATTENDANCE, label: 'Attendance History', icon: UserCheck },
  { to: ROUTES.STUDENT_SCHEDULE, label: 'My Timetable', icon: Timer },

  { header: 'Resources & Billing' },
  { to: ROUTES.STUDENT_RESOURCES, label: 'Resources Hub', icon: BookOpen },
  { to: ROUTES.STUDENT_LIBRARY, label: 'Global Library', icon: Library },
  { to: ROUTES.STUDENT_BILLING, label: 'Fees & Billing', icon: Wallet },
  { to: ROUTES.STUDENT_ELECTIONS, label: 'PEC Elections', icon: Vote },
  { to: ROUTES.STUDENT_TYPING_GAME, label: 'Typing Nitro', icon: Gamepad2 },
]

const bursarLinks = [
  { header: 'Overview' },
  { to: ROUTES.BURSAR_DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
  { to: ROUTES.BURSAR_ANALYTICS, label: 'Analytics', icon: BarChart3 },

  { header: 'Operations' },
  { to: ROUTES.BURSAR_STUDENTS, label: 'Students', icon: Users },
  { to: ROUTES.BURSAR_FEES, label: 'School Fees', icon: CreditCard },
  { to: '/bursar/daily-fees', label: 'Daily Fees', icon: Wallet },
  { to: ROUTES.BURSAR_INVENTORY, label: 'School Store', icon: ShoppingBag },

  { header: 'Financials' },
  { to: ROUTES.BURSAR_DEBTORS, label: 'Debtors List', icon: AlertCircle },
  { to: ROUTES.BURSAR_BILL_SHEET, label: 'Bill Sheet', icon: FileText },
  { to: ROUTES.BURSAR_PAYROLL, label: 'Payroll', icon: Wallet },
  { to: ROUTES.BURSAR_INCOME, label: 'Income', icon: TrendingUp },
  { to: ROUTES.BURSAR_EXPENSES, label: 'Expenses', icon: TrendingDown },
  { to: ROUTES.BURSAR_REPORTS, label: 'Financial Reports', icon: FileSpreadsheet },

  { header: 'Tools' },
  { to: ROUTES.BURSAR_SMS, label: 'SMS Reminders', icon: Smartphone },
]

const staffLinks = [
  { to: '/staff/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/staff/elections', label: 'Elections (PEC)', icon: Vote },
]

const parentLinks = [
  { header: 'Overview' },
  { to: '/parent/dashboard', label: 'My Wards', icon: Users },
  { to: '/parent/calendar', label: 'Calendar', icon: Calendar },
  
  { header: 'Academics & Billing' },
  { to: '/parent/academics', label: 'Academics', icon: FileSpreadsheet },
  { to: '/parent/billing', label: 'Billing & Fees', icon: Wallet },
  
  { header: 'Communication' },
  { to: '/parent/messages', label: 'Messages', icon: MessageSquare },
]

export default function Sidebar() {
  const { user, signOut, isAdmin, isSuperAdmin, isStudent, isBursar, isTeacher } = useAuth()
  const navigate = useNavigate()
  const isStaff = user?.role === 'staff'
  const school = user?.school as any

  // Only calculate storage for Admins — avoids unnecessary DB queries for other roles
  const schoolId = isAdmin ? (user?.school_id ?? undefined) : undefined
  const storage  = useSchoolStorage(schoolId)

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

  const isParent = user?.role === 'parent'
  let links = isSuperAdmin ? superAdminLinks : isParent ? parentLinks : isStudent ? studentLinks : isAdmin ? adminLinks : isBursar ? bursarLinks : isStaff ? staffLinks : teacherLinks

  // Hide daily collections from unauthorized teachers
  if (isTeacher && !loadingAuth && !collectorAuth) {
    links = links.filter(l => !('label' in l) || (l as any).label !== 'Daily Collections')
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

  const [searchQuery, setSearchQuery] = useState('')

  const filteredLinks = links.filter(l => {
    if ('header' in l) return true // Keep headers
    const label = (l as any).label || ''
    return label.toLowerCase().includes(searchQuery.toLowerCase())
  })

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes _sideIn { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
        .sidebar-link { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; color: rgba(255,255,255,0.7); }
        .sidebar-link:hover { background: rgba(255,255,255,0.15) !important; color: #fff; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 99px; }
        .collapse-btn { 
          position: absolute; right: -14px; top: 32px; z-index: 200;
          background: rgba(255,255,255,0.15); color: #fff; border: 1px solid rgba(255,255,255,0.2); 
          width: 28px; height: 28px; border-radius: 50%; cursor: pointer; backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .collapse-btn:hover { background: rgba(255,255,255,0.25); transform: scale(1.05); }
        .active-link { background: rgba(255,255,255,0.2) !important; color: #fff !important; border-left: 3px solid #fff; box-shadow: inset 0 0 20px rgba(255,255,255,0.05); }
      `}</style>

      <aside style={{
        width: collapsed ? 80 : 260, minWidth: collapsed ? 80 : 260, height: '100vh',
        display: 'flex', flexDirection: 'column',
        background: '#1a56db', // Vibrant Royal Blue
        borderRight: '1px solid rgba(255,255,255,0.05)',
        fontFamily: '"DM Sans", system-ui, sans-serif',
        userSelect: 'none', position: 'relative', overflow: 'hidden',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 150,
        boxShadow: '10px 0 30px rgba(0,0,0,0.15)',
      }}>

        {/* Background Watermark */}
        {school?.logo_url && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundImage: `url(${school.logo_url})`,
            backgroundPosition: 'center', backgroundSize: '80%', backgroundRepeat: 'no-repeat',
            opacity: 0.05, zIndex: 0, pointerEvents: 'none'
          }} />
        )}

        {/* Toggle Button */}
        <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ChevronLeft size={14} strokeWidth={3} />}
        </button>

        {/* ── Header Area ── */}
        <div style={{ padding: '32px 20px 24px', position: 'relative', zIndex: 1, overflow: 'visible' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: collapsed ? 'center' : 'flex-start', marginBottom: collapsed ? 0 : 24 }}>
             {school?.logo_url ? (
                <img src={school.logo_url} alt="School" style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'contain', background: '#fff', padding: 2, flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }} />
             ) : (
                <img src="/wula.png" alt="WULA" style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'contain', background: '#fff', padding: 2, flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }} />
             )}
            {!collapsed && (
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {school?.name || 'World Uni-Learn'}
              </div>
            )}
          </div>

          {!collapsed && (
            <button 
                onClick={() => isAdmin ? navigate('/admin/tasks') : navigate('/teacher/behavior')}
                style={{ 
                    width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', 
                    background: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 700, fontSize: 13,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'all 0.2s', backdropFilter: 'blur(10px)'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
            >
                <Plus size={16} strokeWidth={3} /> {isAdmin ? 'Add New Task' : 'Log Behavior'}
            </button>
          )}
        </div>

        {/* ── Search Bar ── */}
        {!collapsed && (
          <div style={{ padding: '0 20px 16px', position: 'relative', zIndex: 1 }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} color="rgba(255,255,255,0.6)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Search menu..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ 
                  width: '100%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', 
                  borderRadius: 10, padding: '10px 12px 10px 34px', fontSize: 13, color: '#fff', outline: 'none',
                  transition: 'all 0.2s', boxSizing: 'border-box', backdropFilter: 'blur(5px)'
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
              />
            </div>
          </div>
        )}

        {/* ── Nav links ── */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: collapsed ? '16px 12px' : '0 14px 16px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gap: 2 }}>
            {(() => {
              return filteredLinks.map((item: any, i) => {
                if (item.header) {
                  if (collapsed || searchQuery) return null
                  return (
                    <div 
                      key={`header-${item.header}`} 
                      style={{ 
                        padding: '24px 12px 8px', fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.5)', 
                        textTransform: 'uppercase', letterSpacing: '0.05em'
                      }}
                    >
                      {item.header}
                    </div>
                  )
                }

                const { to, label, icon: Icon } = item
                return (
                  <NavLink key={to} to={to} style={{ textDecoration: 'none', display: 'block' }} aria-label={label}>
                    {({ isActive }) => (
                      <div
                        className={`sidebar-link ${isActive ? 'active-link' : ''}`}
                        onMouseEnter={() => setHovered(to)}
                        onMouseLeave={() => setHovered(null)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 12,
                          padding: '10px 14px', borderRadius: 12,
                          justifyContent: collapsed ? 'center' : 'flex-start',
                          animation: searchQuery ? 'none' : `_sideIn 0.3s ease ${i * 0.02}s both`,
                          height: 40,
                        }}>
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <Icon
                            size={20}
                            color={isActive ? '#fff' : 'rgba(255,255,255,0.7)'}
                            style={{ transition: 'all 0.2s', display: 'block' }}
                          />
                          {label === 'Messages' && unreadMsgs > 0 && (
                            <span style={{
                              position: 'absolute', top: -5, right: -6,
                              background: '#ef4444', color: '#fff',
                              fontSize: 9, fontWeight: 800, borderRadius: 99,
                              padding: '0 3px', minWidth: 14, textAlign: 'center', lineHeight: '14px',
                              border: '2px solid rgba(255,255,255,0.2)',
                            }}>{unreadMsgs > 99 ? '99+' : unreadMsgs}</span>
                          )}
                        </div>
                        {!collapsed && (
                          <span style={{
                            fontSize: 13,
                            fontWeight: isActive ? 700 : 600,
                            color: isActive ? '#fff' : 'rgba(255,255,255,0.85)',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.2s'
                          }}>
                            {label}
                          </span>
                        )}
                      </div>
                    )}
                  </NavLink>
                )
              })
            })()}
          </div>
        </nav>

        {/* ── Storage Widget — Admin Only ── */}
        {!collapsed && isAdmin && (
            <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.15)', position: 'relative', zIndex: 1 }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Monitor size={15} color="rgba(255,255,255,0.7)" />
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Storage Usage</span>
                    {storage.loading && <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>Calculating…</span>}
                </div>

                <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: 14, padding: '14px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>

                    {/* Progress bar */}
                    <div style={{ height: 6, background: 'rgba(0,0,0,0.2)', borderRadius: 3, marginBottom: 8, overflow: 'hidden' }}>
                        <div style={{
                            width: `${storage.percentUsed}%`,
                            height: '100%',
                            borderRadius: 3,
                            background: storage.percentUsed >= 90 ? '#ef4444'
                                      : storage.percentUsed >= 75 ? '#f59e0b'
                                      : '#fff',
                            transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)'
                        }} />
                    </div>

                    {/* Primary label */}
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
                        {storage.totalBytes < 1024 ** 3
                            ? `${(storage.totalBytes / 1024 ** 2).toFixed(1)} MB`
                            : `${(storage.totalBytes / 1024 ** 3).toFixed(2)} GB`
                        }
                        <span style={{ fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}> of {storage.limitGB} GB used</span>
                    </div>

                    {/* Breakdown rows */}
                    {[
                        { label: 'Student Vault', bytes: storage.vaultBytes },
                        { label: 'Assets & Media', bytes: storage.assetBytes },
                        { label: 'Logos & Branding', bytes: storage.logoBytes },
                        { label: 'Database Records', bytes: storage.dbFootprintBytes },
                    ].map(({ label, bytes }) => bytes > 0 && (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
                            <span>{label}</span>
                            <span style={{ fontWeight: 600 }}>{bytes < 1024 ** 2 ? `${(bytes / 1024).toFixed(0)} KB` : bytes < 1024 ** 3 ? `${(bytes / 1024 ** 2).toFixed(1)} MB` : `${(bytes / 1024 ** 3).toFixed(2)} GB`}</span>
                        </div>
                    ))}

                    {/* CTA */}
                    <button
                        onClick={() => navigate('/admin/billing')}
                        style={{
                            marginTop: 14, width: '100%', padding: '8px', borderRadius: 8, border: 'none',
                            background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 11, fontWeight: 700,
                            cursor: 'pointer', transition: 'all 0.2s', backdropFilter: 'blur(4px)'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
                    >
                        Get more storage
                    </button>
                </div>

                <div onClick={signOut} style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '8px 12px', borderRadius: 10, transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ width: 28, height: 28, borderRadius: '8px', background: 'rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <LogOut size={14} color="#fca5a5" />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#fca5a5' }}>Sign Out</span>
                </div>
            </div>
        )}

      </aside>
    </>
  )
}