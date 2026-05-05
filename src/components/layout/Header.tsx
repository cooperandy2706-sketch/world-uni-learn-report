// src/components/layout/Header.tsx
import { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useCurrentTerm, useCurrentAcademicYear } from '../../hooks/useSettings'
import { useSchoolInvoices } from '../../hooks/useBilling'
import { supabase } from '../../lib/supabase'
import NotificationBell from './NotificationBell'
import {
  Search, Settings, ChevronDown, ChevronLeft, ChevronRight,
  LogOut, User, Shield, Calendar, AlertTriangle, CreditCard,
  FileText, BarChart3, MessageSquare, Command, BookOpen, Users,
  GraduationCap, LayoutDashboard, Zap, Tv
} from 'lucide-react'
import { ROUTES } from '../../constants/routes'
import { resolveIntents, extractClassHint, extractPersonIntent, intentToPath } from '../../lib/commandSearch'

// ─── Navigation groups per role ───────────────────────────────────────────────
const ADMIN_NAV = [
  {
    label: 'Dashboard', to: ROUTES.ADMIN_DASHBOARD, single: true,
  },
  {
    label: 'Academics', items: [
      { label: 'Departments', to: ROUTES.ADMIN_DEPARTMENTS },
      { label: 'Classes', to: ROUTES.ADMIN_CLASSES },
      { label: 'Subjects', to: ROUTES.ADMIN_SUBJECTS },
      { label: 'Attendance', to: ROUTES.ADMIN_ATTENDANCE },
      { label: 'Timetable', to: ROUTES.ADMIN_TIMETABLE },
      { label: 'Syllabus', to: ROUTES.ADMIN_SYLLABUS },
      { label: 'Weekly Goals', to: ROUTES.ADMIN_WEEKLY_GOALS },
      { label: 'Report Cards', to: ROUTES.ADMIN_REPORTS },
      { label: 'Score Entry', to: '/admin/score-entry' },
      { label: 'Batch Promotion', to: '/admin/batch-promotion' },
      { label: 'BECE CA Processor', to: '/admin/bece-processor' },
      { label: 'Lesson Plans', to: '/admin/lesson-plans' },
    ]
  },
  {
    label: 'People', items: [
      { label: 'Students', to: ROUTES.ADMIN_STUDENTS },
      { label: 'Student Vault', to: '/admin/student-vault' },
      { label: 'Staff', to: ROUTES.ADMIN_TEACHERS },
      { label: 'Parent Logins', to: '/admin/parents' },
      { label: 'Admissions', to: '/admin/admissions' },
      { label: 'SMS Messaging', to: ROUTES.ADMIN_SMS },
    ]
  },
  {
    label: 'Operations', items: [
      { label: 'Admin Tasks', to: '/admin/tasks' },
      { label: 'Calendar', to: ROUTES.ADMIN_CALENDAR },
      { label: 'Messages', to: ROUTES.ADMIN_MESSAGES },
      { label: 'Staff Requests', to: '/admin/staff-requests' },
      { label: 'Asset Register', to: '/admin/assets' },
      { label: 'Billing', to: '/admin/billing' },
      { label: 'Bursar Staff', to: '/admin/bursars' },
      { label: 'Poster Maker', to: '/admin/poster-maker' },
      { label: 'Elections (PEC)', to: '/admin/elections' },
      { label: 'Alumni', to: ROUTES.ADMIN_ALUMNI },
    ]
  },
  {
    label: 'Insights', items: [
      { label: 'Analytics', to: ROUTES.ADMIN_ANALYTICS },
      { label: 'Academic Years', to: ROUTES.ADMIN_ACADEMIC_YEARS },
      { label: 'Terms', to: ROUTES.ADMIN_TERMS },
      { label: 'Settings', to: ROUTES.ADMIN_SETTINGS },
    ]
  },
]

const TEACHER_NAV = [
  { label: 'Dashboard', to: ROUTES.TEACHER_DASHBOARD, single: true },
  {
    label: 'Instruction', items: [
      { label: 'My Classes', to: ROUTES.TEACHER_MY_CLASSES },
      { label: 'Students', to: ROUTES.TEACHER_STUDENTS },
      { label: 'Score Entry', to: ROUTES.TEACHER_SCORE_ENTRY },
      { label: 'Attendance', to: ROUTES.TEACHER_ATTENDANCE },
      { label: 'Class Tests', to: '/teacher/class-tests' },
      { label: 'Reports', to: ROUTES.TEACHER_REPORTS },
      { label: 'Timetable', to: ROUTES.TEACHER_TIMETABLE },
      { label: 'Assignments', to: ROUTES.TEACHER_ASSIGNMENTS },
      { label: 'Library', to: ROUTES.TEACHER_SUBJECTS },
    ]
  },
  {
    label: 'More', items: [
      { label: 'Behavior Log', to: '/teacher/behavior' },
      { label: 'Lesson Tracker', to: ROUTES.TEACHER_LESSON_TRACKER },
      { label: 'Syllabus', to: ROUTES.TEACHER_SYLLABUS },
      { label: 'Self Service', to: '/teacher/self-service' },
      { label: 'Messages', to: ROUTES.TEACHER_MESSAGES },
      { label: 'Notifications', to: ROUTES.TEACHER_NOTIFICATIONS },
      { label: 'Daily Collections', to: '/teacher/daily-fees' },
      { label: 'Term Agenda', to: '/teacher/agenda' },
      { label: 'Elections (PEC)', to: '/teacher/elections-hub' },
      { label: 'Typing Nitro', to: ROUTES.TEACHER_TYPING_GAME },
    ]
  },
]

const STUDENT_NAV = [
  { label: 'Portal', to: ROUTES.STUDENT_DASHBOARD, single: true },
  {
    label: 'Academics', items: [
      { label: 'Results', to: ROUTES.STUDENT_RESULTS },
      { label: 'Assignments', to: ROUTES.STUDENT_ASSIGNMENTS },
      { label: 'Attendance', to: ROUTES.STUDENT_ATTENDANCE },
      { label: 'Timetable', to: ROUTES.STUDENT_SCHEDULE },
    ]
  },
  {
    label: 'Explore', items: [
      { label: 'Global Library', to: ROUTES.STUDENT_LIBRARY },
      { label: 'Resources', to: ROUTES.STUDENT_RESOURCES },
      { label: 'Typing Nitro', to: ROUTES.STUDENT_TYPING_GAME },
      { label: 'PEC Elections', to: ROUTES.STUDENT_ELECTIONS },
      { label: 'Notice Board', to: ROUTES.STUDENT_ANNOUNCEMENTS },
      { label: 'Calendar', to: ROUTES.STUDENT_CALENDAR },
    ]
  },
  {
    label: 'Account', items: [
      { label: 'Fees & Billing', to: ROUTES.STUDENT_BILLING },
      { label: 'My Profile', to: ROUTES.STUDENT_PROFILE },
    ]
  }
]

const BURSAR_NAV = [
  { label: 'Dashboard', to: ROUTES.BURSAR_DASHBOARD, single: true },
  {
    label: 'Financials', items: [
      { label: 'School Fees', to: ROUTES.BURSAR_FEES },
      { label: 'Daily Fees', to: '/bursar/daily-fees' },
      { label: 'Debtors', to: ROUTES.BURSAR_DEBTORS },
      { label: 'Bill Sheet', to: ROUTES.BURSAR_BILL_SHEET },
      { label: 'Payroll', to: ROUTES.BURSAR_PAYROLL },
      { label: 'Income', to: ROUTES.BURSAR_INCOME },
      { label: 'Expenses', to: ROUTES.BURSAR_EXPENSES },
    ]
  },
  {
    label: 'Tools', items: [
      { label: 'Students', to: ROUTES.BURSAR_STUDENTS },
      { label: 'School Store', to: ROUTES.BURSAR_INVENTORY },
      { label: 'Analytics', to: ROUTES.BURSAR_ANALYTICS },
      { label: 'SMS Reminders', to: ROUTES.BURSAR_SMS },
      { label: 'Reports', to: ROUTES.BURSAR_REPORTS },
    ]
  },
]

const SUPER_ADMIN_NAV = [
  { label: 'Platform Hub', to: ROUTES.SUPER_ADMIN_DASHBOARD, single: true },
  { label: 'Schools', to: ROUTES.SUPER_ADMIN_SCHOOLS, single: true },
  { label: 'Quizzes', to: ROUTES.SUPER_ADMIN_QUIZZES, single: true },
  { label: 'Messaging', to: ROUTES.SUPER_ADMIN_MESSAGING, single: true },
  { label: 'Leaderboards', to: ROUTES.SUPER_ADMIN_ANALYTICS, single: true },
  { label: 'Subjects', to: ROUTES.SUPER_ADMIN_SUBJECTS, single: true },
  { label: 'Resources', to: ROUTES.SUPER_ADMIN_RESOURCES, single: true },
]

const PARENT_NAV = [
  { label: 'Wards', to: '/parent/dashboard', single: true },
  { label: 'Academics', to: '/parent/academics', single: true },
  { label: 'Billing', to: '/parent/billing', single: true },
  { label: 'Messaging', to: '/parent/messages', single: true },
  { label: 'Calendar', to: '/parent/calendar', single: true },
]

const STAFF_NAV = [
  { label: 'Dashboard', to: '/staff/dashboard', single: true },
  { label: 'Elections (PEC)', to: '/staff/elections', single: true },
]

// ─── NavItem component ─────────────────────────────────────────────────────────
function NavItem({ group }: { group: any }) {
  const [open, setOpen] = useState(false)
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 })
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function openDropdown() {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      setDropPos({ top: rect.bottom + 6, left: rect.left })
    }
    setOpen(o => !o)
  }

  if (group.single) {
    return (
      <NavLink
        to={group.to}
        style={({ isActive }) => ({
          padding: '7px 14px', borderRadius: 99, fontSize: 13, fontWeight: 600,
          textDecoration: 'none', whiteSpace: 'nowrap', transition: 'all 0.15s',
          background: isActive ? '#1a56db' : 'transparent',
          color: isActive ? '#fff' : '#374151',
        })}
      >
        {group.label}
      </NavLink>
    )
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={openDropdown}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '7px 14px', borderRadius: 99, fontSize: 13, fontWeight: 600,
          border: 'none', background: open ? '#eff6ff' : 'transparent',
          color: open ? '#1a56db' : '#374151', cursor: 'pointer', transition: 'all 0.15s',
          whiteSpace: 'nowrap',
        }}
      >
        {group.label}
        <ChevronDown size={13} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {open && (
        <div style={{
          position: 'fixed', top: dropPos.top, left: dropPos.left,
          minWidth: 200,
          background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb',
          boxShadow: '0 10px 25px rgba(0,0,0,0.12)', zIndex: 9999,
          padding: '6px', animation: 'fadeDown 0.15s ease',
        }}>
          {group.items.map((item: any) => (
            <div
              key={item.to}
              onClick={() => { navigate(item.to); setOpen(false) }}
              style={{
                padding: '9px 14px', borderRadius: 10, fontSize: 13, fontWeight: 500,
                color: '#374151', cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#1a56db' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#374151' }}
            >
              {item.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Header ───────────────────────────────────────────────────────────────
export default function Header() {
  const { user, signOut, isAdmin, isSuperAdmin, isStudent, isBursar, isTeacher } = useAuth()
  const isStaff = user?.role === 'staff'
  const { data: term } = useCurrentTerm()
  const { data: year } = useCurrentAcademicYear()
  const navigate = useNavigate()
  const [profileOpen, setProfileOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [signing, setSigning] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState<{ label: string, subtitle: string, type: string, name: string } | null>(null)
  const [highlightedIdx, setHighlightedIdx] = useState(-1)
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('wul_recent_searches') || '[]') } catch { return [] }
  })

  const profileRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const userSchool = user?.school as any
  const { data: invoices = [] } = useSchoolInvoices(userSchool?.id)

  const now = new Date()
  let daysLeft = 0
  if (userSchool?.status === 'pending') {
    const trialEnd = new Date(new Date(userSchool.created_at).getTime() + 30 * 24 * 60 * 60 * 1000)
    daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  const navGroups = isSuperAdmin ? SUPER_ADMIN_NAV
    : isAdmin ? ADMIN_NAV
    : isTeacher ? TEACHER_NAV
    : isBursar ? BURSAR_NAV
    : isStaff ? STAFF_NAV
    : user?.role === 'parent' ? PARENT_NAV
    : STUDENT_NAV

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowResults(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const allResults = searchResults
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        const input = searchRef.current?.querySelector('input') as HTMLInputElement | null
        input?.focus()
        setShowResults(true)
      }
      if (e.key === 'Escape') {
        setShowResults(false)
        setSelectedPerson(null)
        setHighlightedIdx(-1)
        const input = searchRef.current?.querySelector('input') as HTMLInputElement | null
        input?.blur()
      }
      if (!showResults) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlightedIdx(i => Math.min(i + 1, allResults.length - 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightedIdx(i => Math.max(i - 1, -1))
      }
      if (e.key === 'Enter' && highlightedIdx >= 0 && allResults[highlightedIdx]) {
        e.preventDefault()
        const r = allResults[highlightedIdx]
        if (r.resultKind === 'person') {
          setSelectedPerson({ label: r.label, subtitle: r.subtitle, type: r.type, name: r.label })
        } else {
          saveRecent(searchQuery)
          navigate(r.path)
          setShowResults(false)
          setSearchQuery('')
          setHighlightedIdx(-1)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [searchQuery, showResults, highlightedIdx, searchResults])

  function saveRecent(q: string) {
    const trimmed = q.trim()
    if (!trimmed || trimmed.length < 2) return
    setRecentSearches(prev => {
      const next = [trimmed, ...prev.filter(r => r !== trimmed)].slice(0, 6)
      try { localStorage.setItem('wul_recent_searches', JSON.stringify(next)) } catch {}
      return next
    })
  }

  async function handleSignOut() {
    setSigning(true)
    await signOut()
    navigate('/login')
  }

  useEffect(() => {
    const timer = setTimeout(async () => {
      const q = searchQuery.trim()
      if (q.length < 2) { setSearchResults([]); setShowResults(false); setSelectedPerson(null); return }
      setSearching(true)
      try {
        const results: any[] = []
        const sid = user?.school_id

        // 1. Keyword intent navigation (instant)
        const intents = resolveIntents(q, { isAdmin, isTeacher, isBursar, isStudent })
        intents.forEach(r => results.push({ ...r, resultKind: 'intent' }))

        // 2. Person-context intent: "desmond's results", "sir andy timetable", etc.
        const personIntent = extractPersonIntent(q)
        if (personIntent && (isAdmin || isTeacher || isBursar)) {
          const { name, rawName, intent } = personIntent

          // Decide: is this likely a teacher query?
          const teacherIntents = ['timetable', 'classes', 'schedule']
          const hasTitle = /^(sir|mr|mrs|ms|dr|prof)/i.test(name)
          const isTeacherIntent = teacherIntents.includes(intent) || hasTitle

          if (isTeacherIntent) {
            // Query teachers/staff
            const { data: teachers } = await supabase
              .from('users')
              .select('id, full_name, role')
              .eq('school_id', sid)
              .in('role', ['teacher', 'bursar', 'staff'])
              .ilike('full_name', `%${rawName}%`)
              .limit(4)

            teachers?.forEach(t => {
              const dest = intentToPath(intent, 'teacher', isAdmin, isBursar, isTeacher)
              results.unshift({
                resultKind: 'intent',
                label: `${dest.verb} — ${t.full_name}`,
                subtitle: `Staff · ${t.role}`,
                icon: dest.icon,
                color: dest.color,
                path: `${dest.path}?teacher=${encodeURIComponent(t.full_name)}`,
              })
            })
          } else {
            // Query students
            const { data: students } = await supabase
              .from('students')
              .select('id, full_name, fees_arrears, class:classes(name)')
              .eq('school_id', sid)
              .eq('is_active', true)
              .ilike('full_name', `%${rawName}%`)
              .limit(4)

            students?.forEach(s => {
              const dest = intentToPath(intent, 'student', isAdmin, isBursar, isTeacher)
              const cls = (s as any).class?.name ?? 'No Class'
              const arrears = intent === 'fees' ? ` · GH₵${Number((s as any).fees_arrears || 0).toLocaleString()} arrears` : ''
              results.unshift({
                resultKind: 'intent',
                label: `${dest.verb} — ${s.full_name}`,
                subtitle: `${cls}${arrears}`,
                icon: dest.icon,
                color: dest.color,
                path: `${dest.path}?student=${encodeURIComponent(s.full_name)}`,
              })
            })
          }
        }

        // 3. Plain student name lookup (fallback when no intent matched)
        if (!personIntent && (isAdmin || isTeacher || isBursar)) {
          const { data: st } = await supabase
            .from('students')
            .select('id, full_name, class:classes(name)')
            .eq('school_id', sid)
            .ilike('full_name', `%${q}%`)
            .limit(4)
          st?.forEach(s => results.push({
            resultKind: 'person', type: 'Student',
            label: s.full_name,
            subtitle: `Student · ${(s as any).class?.name ?? 'No Class'}`,
            icon: '👨‍🎓', color: '#1a56db',
            path: isAdmin ? `/admin/students` : `/teacher/students`,
          }))
        }

        // 4. Plain staff name lookup (fallback)
        if (!personIntent && isAdmin) {
          const { data: tr } = await supabase
            .from('users')
            .select('id, full_name, role')
            .eq('school_id', sid)
            .in('role', ['teacher', 'bursar', 'staff'])
            .ilike('full_name', `%${q}%`)
            .limit(3)
          tr?.forEach(t => results.push({
            resultKind: 'person', type: 'Staff',
            label: t.full_name,
            subtitle: `Staff · ${t.role}`,
            icon: '👩‍🏫', color: '#7c3aed',
            path: `/admin/teachers`,
          }))
        }

        setSearchResults(results)
        setShowResults(results.length > 0)
      } catch { } finally { setSearching(false) }
    }, 280)
    return () => clearTimeout(timer)
  }, [searchQuery, isAdmin, isBursar, isTeacher, isStudent])

  const rolePath = isSuperAdmin ? 'super-admin' : isStudent ? 'student' : isAdmin ? 'admin' : isBursar ? 'bursar' : 'teacher'

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes fadeDown { from { opacity: 0; transform: translateY(-6px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideInRight { from { transform: translateX(100%) } to { transform: translateX(0) } }
        @keyframes spin { to { transform: rotate(360deg) } }
        .top-nav-pill { display: flex; align-items: center; gap: 2px; overflow-x: auto; scrollbar-width: none; flex-shrink: 1; min-width: 0; }
        .top-nav-pill::-webkit-scrollbar { display: none; }
        .mobile-menu-btn { display: none; }
        @media (max-width: 1024px) {
          .top-nav-pill { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
          .header-pill-container { padding: 6px !important; }
          .school-branding-text { display: none !important; }
        }
        @media (max-width: 600px) {
          .search-input-pill { width: 40px !important; padding: 0 !important; display: flex; justify-content: center; }
          .search-input-pill input { display: none; }
          .search-input-pill svg { position: static !important; }
        }
      `}</style>

      <header style={{
        height: 76, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 28px', background: '#f8f7ff', flexShrink: 0,
        borderBottom: '1px solid #e8e8f0',
        fontFamily: '"DM Sans", system-ui, sans-serif',
        position: 'sticky', top: 0, zIndex: 200,
        gap: 16,
      }}>

        {/* ── LEFT: Standalone School Branding ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <button 
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(true)}
            style={{ border: 'none', background: '#fff', width: 42, height: 42, borderRadius: 12, display: 'none', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer', color: '#1a56db' }}
          >
            <Command size={20} />
          </button>

          {userSchool?.logo_url ? (
            <img
              src={userSchool.logo_url} alt="School"
              style={{ width: 42, height: 42, borderRadius: 12, objectFit: 'contain', background: '#fff', padding: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
            />
          ) : (
            <div style={{ width: 42, height: 42, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <GraduationCap size={22} color="#1a56db" />
            </div>
          )}
          <div className="school-branding-text" style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#111827', whiteSpace: 'nowrap', maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.01em' }}>
              {userSchool?.name || 'World Uni-Learn'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {year && term ? (
                <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>
                  {year.name} · {term.name}
                </span>
              ) : (
                <span style={{ fontSize: 11, fontWeight: 600, color: '#ef4444' }}>No Active Term</span>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT PILL: Nav + Bell + Profile ── */}
        <div className="header-pill-container" style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#fff',
          borderRadius: 99,
          border: '1px solid #e5e7eb',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          padding: '6px 6px 6px 16px',
          flex: 1,
          justifyContent: 'flex-end',
          maxWidth: 'fit-content'
        }}>

          {/* Nav Groups */}
          <nav className="top-nav-pill">
            {navGroups.map((group: any, i: number) => (
              <NavItem key={i} group={group} />
            ))}
          </nav>

          {/* Separator */}
          <div style={{ width: 1, height: 24, background: '#e5e7eb', flexShrink: 0, margin: '0 4px' }} />

          {/* Search */}
          <div ref={searchRef} className="search-input-pill" style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={14} color="#9ca3af" style={{ position: 'absolute', left: 10, zIndex: 1, pointerEvents: 'none' }} />
              <input
                id="header-search"
                type="text"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setHighlightedIdx(-1) }}
                onFocus={() => setShowResults(true)}
                placeholder="Search or type a command…"
                style={{
                  width: 160, background: '#f3f4f6', border: '1.5px solid transparent',
                  borderRadius: 99, padding: '7px 36px 7px 30px', fontSize: 13, color: '#111827',
                  outline: 'none', transition: 'all 0.25s',
                }}
                onFocusCapture={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#1a56db'; e.currentTarget.style.width = '240px' }}
                onBlurCapture={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.width = '160px' }}
              />
              {/* ⌘K badge */}
              {!searching && !searchQuery && (
                <kbd style={{ position: 'absolute', right: 8, fontSize: 10, background: '#e5e7eb', color: '#9ca3af', padding: '2px 5px', borderRadius: 4, border: '1px solid #d1d5db', pointerEvents: 'none', whiteSpace: 'nowrap' }}>⌘K</kbd>
              )}
            </div>

            {showResults && (
              <div style={{
                position: 'absolute', top: 48, right: 0, width: 340, background: '#fff',
                borderRadius: 20, border: '1px solid #e5e7eb',
                boxShadow: '0 20px 40px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.06)',
                padding: '8px', zIndex: 9999, animation: 'fadeDown 0.15s ease',
                overflow: 'hidden',
              }}>

                {/* Recent searches — shown when query is empty */}
                {!searchQuery && !selectedPerson && recentSearches.length > 0 && (
                  <div style={{ marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 12px 6px' }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Recent</span>
                      <button onClick={() => { setRecentSearches([]); localStorage.removeItem('wul_recent_searches') }} style={{ border: 'none', background: 'none', fontSize: 10, color: '#d1d5db', cursor: 'pointer', padding: 0 }}>Clear</button>
                    </div>
                    {recentSearches.map((r, i) => (
                      <div key={i} onClick={() => { setSearchQuery(r); setHighlightedIdx(-1) }}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, cursor: 'pointer', transition: 'background 0.12s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f8f9ff' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                      >
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>🕐</div>
                        <span style={{ fontSize: 13, color: '#374151', fontWeight: 500, flex: 1 }}>{r}</span>
                        <span style={{ fontSize: 11, color: '#d1d5db' }}>↵</span>
                      </div>
                    ))}
                    <div style={{ height: 1, background: '#f3f4f6', margin: '6px 0' }} />
                  </div>
                )}

                {/* Empty state: only when actively searching */}
                {searchQuery && searchResults.length === 0 && !searching && (
                  <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>🔍</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>No results found</div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>Try: "pay fees", "attendance", "grade 5"</div>
                  </div>
                )}

                {/* Class context hint */}
                {extractClassHint(searchQuery) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', marginBottom: 4, background: '#eff6ff', borderRadius: 12 }}>
                    <Zap size={13} color="#1a56db" />
                    <span style={{ fontSize: 12, color: '#1a56db', fontWeight: 700 }}>
                      Context: <strong>{extractClassHint(searchQuery)}</strong> detected — filtering to that class
                    </span>
                  </div>
                )}

                {/* Navigation / Action results */}
                {searchResults.filter((r: any) => r.resultKind === 'intent').length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '6px 12px 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Zap size={10} /> Quick Actions
                    </div>
                    {searchResults.filter((r: any) => r.resultKind === 'intent').map((r: any, i: number) => (
                      <div
                        key={`intent-${i}`}
                        onClick={() => { saveRecent(searchQuery); navigate(r.path); setShowResults(false); setSearchQuery(''); setHighlightedIdx(-1) }}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, cursor: 'pointer', transition: 'background 0.12s', background: highlightedIdx === i ? '#f0f4ff' : 'transparent' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f8f9ff' }}
                        onMouseLeave={e => { e.currentTarget.style.background = highlightedIdx === i ? '#f0f4ff' : 'transparent' }}
                      >
                        <div style={{
                          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                          background: `${r.color}15`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 18, border: `1px solid ${r.color}25`
                        }}>
                          {r.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{r.label}</div>
                          <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>{r.subtitle}</div>
                        </div>
                        <div style={{ fontSize: 11, color: r.color, fontWeight: 700, background: `${r.color}12`, padding: '2px 8px', borderRadius: 99, whiteSpace: 'nowrap' }}>Go →</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* People results — click to show actions sub-panel */}
                {!selectedPerson && searchResults.filter((r: any) => r.resultKind === 'person').length > 0 && (
                  <div style={{ marginTop: searchResults.some((r: any) => r.resultKind === 'intent') ? 8 : 0 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '6px 12px 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <User size={10} /> People
                    </div>
                    {searchResults.filter((r: any) => r.resultKind === 'person').map((r: any, i: number) => (
                      <div
                        key={`person-${i}`}
                        onClick={() => setSelectedPerson({ label: r.label, subtitle: r.subtitle, type: r.type, name: r.label })}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: 12, cursor: 'pointer', transition: 'background 0.12s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f8f9ff' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                      >
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: `${r.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                          {r.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.label}</div>
                          <div style={{ fontSize: 11, color: '#9ca3af' }}>{r.subtitle}</div>
                        </div>
                        <div style={{ fontSize: 11, color: '#6b7280', background: '#f3f4f6', padding: '3px 10px', borderRadius: 99, display: 'flex', alignItems: 'center', gap: 4 }}>
                          {r.type} <ChevronRight size={10} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Person Action Sub-Panel ── */}
                {selectedPerson && (() => {
                  const enc = encodeURIComponent(selectedPerson.label)
                  const isStud = selectedPerson.type === 'Student'

                  const adminStudentActions = [
                    { icon: '👤', label: 'View Profile', subtitle: 'Student directory', color: '#1a56db', path: `/admin/students?student=${enc}` },
                    { icon: '📊', label: 'View Results / Scores', subtitle: 'Score entry', color: '#0891b2', path: `/admin/score-entry?student=${enc}` },
                    { icon: '✅', label: 'Attendance Record', subtitle: 'Attendance page', color: '#16a34a', path: `/admin/attendance?student=${enc}` },
                    { icon: '📄', label: 'Report Card', subtitle: 'Report cards', color: '#7c3aed', path: `/admin/reports?student=${enc}` },
                    { icon: '💳', label: 'Pay Fees', subtitle: 'Fees & billing', color: '#16a34a', path: `/bursar/fees?student=${enc}` },
                    { icon: '📋', label: 'Bill Sheet', subtitle: 'Full bill breakdown', color: '#b45309', path: `/bursar/bill-sheet?student=${enc}` },
                  ]
                  const bursarStudentActions = [
                    { icon: '💳', label: 'Pay Fees', subtitle: 'Record a payment', color: '#16a34a', path: `/bursar/fees?student=${enc}` },
                    { icon: '📋', label: 'Get Bill Sheet', subtitle: 'Full fee breakdown', color: '#b45309', path: `/bursar/bill-sheet?student=${enc}` },
                    { icon: '📊', label: 'Check Balance', subtitle: 'Debtors overview', color: '#ef4444', path: `/bursar/debtors?student=${enc}` },
                    { icon: '🧾', label: 'Payment History', subtitle: 'Past payments', color: '#6d28d9', path: `/bursar/fees?student=${enc}&tab=history` },
                  ]
                  const teacherStudentActions = [
                    { icon: '📊', label: 'View Scores', subtitle: 'Score entry', color: '#0891b2', path: `/teacher/score-entry?student=${enc}` },
                    { icon: '✅', label: 'Attendance', subtitle: 'Attendance record', color: '#16a34a', path: `/teacher/attendance?student=${enc}` },
                    { icon: '👤', label: 'Student Profile', subtitle: 'Student info', color: '#1a56db', path: `/teacher/students?student=${enc}` },
                  ]
                  const adminStaffActions = [
                    { icon: '👤', label: 'View Profile', subtitle: 'Staff directory', color: '#7c3aed', path: `/admin/teachers?teacher=${enc}` },
                    { icon: '🕐', label: 'View Timetable', subtitle: 'Timetable', color: '#6d28d9', path: `/admin/timetable?teacher=${enc}` },
                    { icon: '💼', label: 'Payroll Record', subtitle: 'Staff payroll', color: '#0891b2', path: `/bursar/payroll?teacher=${enc}` },
                    { icon: '📱', label: 'Send SMS', subtitle: 'Message staff', color: '#16a34a', path: `/admin/sms?to=${enc}` },
                  ]

                  const actions = isStud
                    ? (isBursar ? bursarStudentActions : isTeacher ? teacherStudentActions : adminStudentActions)
                    : adminStaffActions

                  return (
                    <div style={{ animation: 'fadeDown 0.15s ease' }}>
                      {/* Header */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px 12px', borderBottom: '1px solid #f3f4f6' }}>
                        <button
                          onClick={() => setSelectedPerson(null)}
                          style={{ border: 'none', background: '#f3f4f6', width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                        >
                          <ChevronLeft size={14} color="#6b7280" />
                        </button>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedPerson.label}</div>
                          <div style={{ fontSize: 11, color: '#9ca3af' }}>{selectedPerson.subtitle}</div>
                        </div>
                      </div>
                      <div style={{ padding: '6px 4px 4px', fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', paddingLeft: 12, paddingTop: 10 }}>
                        What do you want to do?
                      </div>
                      {/* Action list */}
                      {actions.map((a, i) => (
                        <div
                          key={i}
                          onClick={() => { navigate(a.path); setShowResults(false); setSearchQuery(''); setSelectedPerson(null) }}
                          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, cursor: 'pointer', transition: 'background 0.12s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#f8f9ff' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                        >
                          <div style={{ width: 34, height: 34, borderRadius: 10, background: `${a.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                            {a.icon}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{a.label}</div>
                            <div style={{ fontSize: 11, color: '#9ca3af' }}>{a.subtitle}</div>
                          </div>
                          <ChevronRight size={13} color="#d1d5db" />
                        </div>
                      ))}
                    </div>
                  )
                })()}

                {/* Footer hint */}
                <div style={{ marginTop: 8, padding: '8px 12px', borderTop: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: '#d1d5db' }}>Try: "pay fees" • "top students" • "grade 5 attendance"</span>
                  <kbd style={{ fontSize: 10, background: '#f3f4f6', color: '#9ca3af', padding: '2px 6px', borderRadius: 4, border: '1px solid #e5e7eb' }}>Esc</kbd>
                </div>
              </div>
            )}
          </div>

          {/* Notifications */}
          <div style={{ flexShrink: 0 }}>
            <NotificationBell />
          </div>

          {/* Profile Avatar */}
          <div ref={profileRef} style={{ position: 'relative', flexShrink: 0 }}>
            <div
              onClick={() => setProfileOpen(!profileOpen)}
              style={{
                width: 36, height: 36, borderRadius: '50%', background: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                fontSize: 14, fontWeight: 700, color: '#1a56db', cursor: 'pointer',
                border: '2px solid #e5e7eb', transition: 'box-shadow 0.2s',
                boxShadow: profileOpen ? '0 0 0 3px #bfdbfe' : 'none',
              }}
            >
              {user?.avatar_url
                ? <img src={user.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#fff' }} />
                : userSchool?.logo_url
                  ? <img src={userSchool.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#fff' }} />
                  : (user?.full_name?.charAt(0).toUpperCase() || <Shield size={16} />)
              }
            </div>

            {profileOpen && (
              <div style={{
                position: 'fixed',
                top: 82, right: 24,
                width: 260, background: '#fff',
                borderRadius: 18, border: '1px solid #e5e7eb',
                boxShadow: '0 12px 28px rgba(0,0,0,0.12)',
                padding: 16, zIndex: 9999, animation: 'fadeDown 0.15s ease',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontSize: 18, fontWeight: 700, color: '#1a56db', flexShrink: 0, border: '1px solid #e5e7eb' }}>
                    {user?.avatar_url
                      ? <img src={user.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#fff' }} />
                      : userSchool?.logo_url
                        ? <img src={userSchool.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#fff' }} />
                        : (user?.full_name?.charAt(0).toUpperCase() || <Shield size={20} />)
                    }
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.full_name || 'System Admin'}</div>
                    <div style={{ fontSize: 11, color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#1a56db', textTransform: 'uppercase', marginTop: 2 }}>{user?.role}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <button
                    onClick={() => { 
                      if (user?.role) {
                        navigate(`/${user.role.replace('_', '-')}/account`)
                      }
                      setProfileOpen(false) 
                    }}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: 'none', background: '#f3f4f6', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer', transition: 'background 0.15s', textAlign: 'left' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#e5e7eb'}
                    onMouseLeave={e => e.currentTarget.style.background = '#f3f4f6'}
                  >
                    <Settings size={15} /> Manage Account
                  </button>
                  <button
                    onClick={handleSignOut}
                    disabled={signing}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: 'none', background: '#fff5f5', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 700, color: '#ef4444', cursor: 'pointer', transition: 'background 0.15s', textAlign: 'left' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff5f5'}
                  >
                    <LogOut size={15} /> {signing ? 'Signing out...' : 'Sign Out'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── MOBILE MENU OVERLAY ── */}
      {mobileMenuOpen && (
        <>
          <div 
            onClick={() => setMobileMenuOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', zIndex: 1000, animation: 'fadeIn 0.3s ease' }} 
          />
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: '85%', maxWidth: 360,
            background: '#fff', zIndex: 1001, boxShadow: '-10px 0 30px rgba(0,0,0,0.1)',
            padding: '24px', display: 'flex', flexDirection: 'column', gap: 24,
            animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, background: '#eff6ff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Command size={18} color="#1a56db" />
                </div>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>Navigation</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} style={{ border: 'none', background: '#f3f4f6', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <ChevronRight size={18} />
              </button>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', paddingRight: 4 }}>
              {navGroups.map((group: any, i: number) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 12px 4px' }}>
                    {group.label}
                  </div>
                  {group.single ? (
                    <NavLink
                      to={group.to}
                      onClick={() => setMobileMenuOpen(false)}
                      style={({ isActive }) => ({
                        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12,
                        textDecoration: 'none', fontSize: 14, fontWeight: 600, transition: 'all 0.2s',
                        background: isActive ? '#eff6ff' : 'transparent',
                        color: isActive ? '#1a56db' : '#374151',
                      })}
                    >
                      <LayoutDashboard size={16} /> {group.label}
                    </NavLink>
                  ) : (
                    group.items.map((item: any) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileMenuOpen(false)}
                        style={({ isActive }) => ({
                          display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12,
                          textDecoration: 'none', fontSize: 14, fontWeight: 600, transition: 'all 0.2s',
                          background: isActive ? '#eff6ff' : 'transparent',
                          color: isActive ? '#1a56db' : '#374151',
                        })}
                      >
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', opacity: 0.4 }} />
                        {item.label}
                      </NavLink>
                    ))
                  )}
                </div>
              ))}
            </nav>

            <div style={{ marginTop: 'auto', paddingTop: 20, borderTop: '1px solid #f3f4f6' }}>
              <button 
                onClick={handleSignOut}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px', borderRadius: 14, background: '#fff5f5', border: 'none', color: '#ef4444', fontWeight: 700, cursor: 'pointer' }}
              >
                <LogOut size={18} /> Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
