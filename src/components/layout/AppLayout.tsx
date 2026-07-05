// src/components/layout/AppLayout.tsx
import { useState, useEffect, useRef } from 'react'
import { Navigate, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useSchoolInvoices } from '../../hooks/useBilling'
import Header from './Header'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import EnablePushButton from '../ui/EnablePushButton'
import WhatsNewModal from '../ui/WhatsNewModal'
import AnnouncementPopup from '../ui/AnnouncementPopup'
import { DailyInsightNotification } from '../ui/DailyInsightNotification'
import { NewsTicker } from '../ui/NewsTicker'
import FloatingClock from '../shared/FloatingClock'
import FlaskLoader from '../ui/FlaskLoader'
import NetworkStatusHUD from '../ui/NetworkStatusHUD'
import GlobalAdOverlay from '../ui/GlobalAdOverlay'
import AppUpdaterBanner from '../ui/AppUpdaterBanner'
import { ROUTES } from '../../constants/routes'

interface AppLayoutProps {
  requiredRole?: 'super_admin' | 'admin' | 'proprietor' | 'teacher' | 'student'
    | 'bursar' | 'staff' | 'parent' | 'security' | 'driver' | 'nurse' | 'librarian'
}

/* Roles that get the full sidebar+header shell */
const SIDEBAR_ROLES = new Set([
  'admin', 'teacher', 'bursar', 'student', 'staff',
  'parent', 'security', 'driver', 'nurse', 'librarian',
  'proprietor', 'super_admin',
])

export default function AppLayout({ requiredRole }: AppLayoutProps) {
  const navigate = useNavigate()
  const { user, loading, initialized } = useAuth()
  const userSchool = user?.school as any
  const { data: invoices = [], isLoading: invoicesLoading } = useSchoolInvoices(userSchool?.id)

  const [refreshKey, setRefreshKey] = useState(Date.now())
  const lastHiddenTime = useRef(Date.now())

  // ── Remount on return from long absence ──────────────────────────────────────
  useEffect(() => {
    const handleVis = () => {
      if (document.visibilityState === 'hidden') {
        lastHiddenTime.current = Date.now()
      } else {
        const awayTime = Date.now() - lastHiddenTime.current
        if (awayTime > 3 * 60 * 1000) {
          setRefreshKey(Date.now())
        }
      }
    }
    document.addEventListener('visibilitychange', handleVis)
    return () => document.removeEventListener('visibilitychange', handleVis)
  }, [])

  // ── Mid-session sign-out redirect ────────────────────────────────────────────
  const prevUserRef = useRef<typeof user>(null)
  useEffect(() => {
    const prevUser = prevUserRef.current
    prevUserRef.current = user
    if (initialized && !loading && prevUser !== null && user === null) {
      console.info('[Acadera] Session ended — redirecting to login')
      navigate(ROUTES.LOGIN, { replace: true })
    }
  }, [user, initialized, loading, navigate])

  // ── Safety watchdog: redirect if auth stuck for 2 min ───────────────────────
  useEffect(() => {
    if (initialized && !loading) return
    const timer = setTimeout(() => {
      console.warn('[Acadera] Auth initialization stuck — redirecting to login')
      navigate(ROUTES.LOGIN, { replace: true })
    }, 120_000)
    return () => clearTimeout(timer)
  }, [initialized, loading, navigate])

  if (!initialized || loading) {
    return <FlaskLoader label="Authenticating..." />
  }

  if (!user) return <Navigate to={ROUTES.LOGIN} replace />

  if (requiredRole && user.role !== requiredRole) {
    if (user.role === 'super_admin')  return <Navigate to="/super-admin/dashboard" replace />
    if (user.role === 'proprietor')   return <Navigate to="/proprietor/dashboard" replace />
    if (user.role === 'student')      return <Navigate to="/student/dashboard" replace />
    if (user.role === 'bursar')       return <Navigate to={ROUTES.BURSAR_DASHBOARD} replace />
    if (user.role === 'staff')        return <Navigate to={ROUTES.STAFF_DASHBOARD} replace />
    if (user.role === 'security')     return <Navigate to={ROUTES.SECURITY_DASHBOARD} replace />
    if (user.role === 'parent')       return <Navigate to="/parent/dashboard" replace />
    if (user.role === 'driver')       return <Navigate to="/driver/dashboard" replace />
    if (user.role === 'nurse')        return <Navigate to="/nurse/dashboard" replace />
    if (user.role === 'librarian')    return <Navigate to="/librarian/dashboard" replace />
    return <Navigate to={user.role === 'admin' ? ROUTES.ADMIN_DASHBOARD : ROUTES.TEACHER_DASHBOARD} replace />
  }

  // ── Billing guard ────────────────────────────────────────────────────────────
  if (user.role !== 'super_admin' && userSchool && !invoicesLoading) {
    const createdAt  = new Date(userSchool.created_at)
    const trialEnd   = new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000)
    const now        = new Date()
    const isTrialExpired  = userSchool.status === 'pending' && now > trialEnd
    const overdueInvoice  = invoices.find(inv =>
      (inv.status === 'pending' || inv.status === 'requested_approval') && new Date(inv.due_date) < now
    )

    if (isTrialExpired || overdueInvoice) {
      return (
        <div style={{ display: 'flex', minHeight: '100dvh', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', background: 'var(--bg-app)', flexDirection: 'column' }}>
          <div style={{ fontSize: 64, marginBottom: 24 }}>💳</div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary, #0F172A)', marginBottom: 12, fontFamily: 'Outfit, sans-serif' }}>
            {isTrialExpired ? 'Free Trial Expired' : 'Payment Overdue'}
          </h2>
          <p style={{ maxWidth: 460, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 32, fontSize: 15 }}>
            {isTrialExpired
              ? 'Your 30-day free trial has expired. Please make your subscription payment to continue.'
              : 'You have an unpaid invoice past its due date. Please settle the outstanding balance to restore access.'}
          </p>
          <div style={{ background: 'var(--bg-card)', padding: 28, borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', marginBottom: 24, width: '100%', maxWidth: 420 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 8 }}>Payment Instructions</div>
            <div style={{ fontSize: 15, color: 'var(--text-primary, #0F172A)', fontWeight: 600, marginBottom: 8 }}>Pay via Mobile Money to:</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: '#F59E0B', letterSpacing: '0.04em', marginBottom: 16, fontFamily: 'Outfit, sans-serif' }}>0532416607</div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
              After payment, contact the administrator or request approval from your Billing page.
            </p>
          </div>
          {user.role === 'admin' ? (
            <button onClick={() => navigate('/admin/billing')} style={{ padding: '14px 32px', borderRadius: 14, background: 'var(--color-primary, #2563EB)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 15, transition: 'all 0.2s', fontFamily: 'Inter, sans-serif' }}>
              Go to Billing Page
            </button>
          ) : (
            <button onClick={() => window.location.reload()} style={{ padding: '12px 24px', borderRadius: 12, background: '#F59E0B', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
              Check Status Again
            </button>
          )}
        </div>
      )
    }
  }

  const hasSidebar = SIDEBAR_ROLES.has(user.role || '')

  return (
    <>
      {/* ── App shell ─────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        height: '100dvh',
        overflow: 'hidden',
        background: 'var(--bg-app)',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}>
        {/* Sidebar — desktop only */}
        {hasSidebar && (
          <div className="ds-sidebar-desktop-only" style={{ display: 'flex', flexShrink: 0, position: 'relative', zIndex: 400 }}>
            <style>{`
              @media (max-width: 1023px) { .ds-sidebar-desktop-only { display: none !important; } }
            `}</style>
            <Sidebar />
          </div>
        )}

        {/* Main column */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <NewsTicker />
          <Header />
          <main
            className={`app-main${requiredRole === 'teacher' ? ' t-portal' : ''}${requiredRole === 'proprietor' ? ' p-portal' : ''}${requiredRole === 'parent' ? ' parent-portal' : ''}`}
            style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}
          >
            <EnablePushButton />
            <Outlet key={refreshKey} />
          </main>
        </div>
      </div>

      {/* ── Floating overlays ─────────────────────────────────────────────── */}
      <BottomNav />
      <WhatsNewModal />
      <AnnouncementPopup />
      <DailyInsightNotification />
      <FloatingClock />
      <NetworkStatusHUD />
      <GlobalAdOverlay />
      <AppUpdaterBanner />
    </>
  )
}