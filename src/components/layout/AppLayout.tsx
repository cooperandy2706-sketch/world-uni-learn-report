// src/components/layout/AppLayout.tsx
import { useState, useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useSchoolInvoices } from '../../hooks/useBilling'
import Header from './Header'
import BottomNav from './BottomNav'
import EnablePushButton from '../ui/EnablePushButton'
import WhatsNewModal from '../ui/WhatsNewModal'
import AnnouncementPopup from '../ui/AnnouncementPopup'
import { DailyInsightNotification } from '../ui/DailyInsightNotification'
import { NewsTicker } from '../ui/NewsTicker'
import FloatingClock from '../shared/FloatingClock'
import FlaskLoader from '../ui/FlaskLoader'
import { ROUTES } from '../../constants/routes'

interface AppLayoutProps { requiredRole?: 'super_admin' | 'admin' | 'teacher' | 'student' | 'bursar' | 'staff' | 'parent' }

export default function AppLayout({ requiredRole }: AppLayoutProps) {
  const { user, loading, initialized } = useAuth()
  const userSchool = user?.school as any
  const { data: invoices = [], isLoading: invoicesLoading } = useSchoolInvoices(userSchool?.id)

  if (!initialized || loading) {
    return <FlaskLoader label="Authenticating..." />
  }

  if (!user) return <Navigate to={ROUTES.LOGIN} replace />
  
  if (requiredRole && user.role !== requiredRole) {
    if (user.role === 'super_admin') return <Navigate to="/super-admin/dashboard" replace />
    if (user.role === 'student')    return <Navigate to="/student/dashboard" replace />
    if (user.role === 'bursar')     return <Navigate to={ROUTES.BURSAR_DASHBOARD} replace />
    if (user.role === 'staff')      return <Navigate to={ROUTES.STAFF_DASHBOARD}  replace />
    if (user.role === 'parent')     return <Navigate to="/parent/dashboard" replace />
    return <Navigate to={user.role === 'admin' ? ROUTES.ADMIN_DASHBOARD : ROUTES.TEACHER_DASHBOARD} replace />
  }

  // Pending School Guard & Billing Guard (Non-super-admins)
  // Only enforce billing guard when invoice data has loaded (don't block on loading)
  if (user.role !== 'super_admin' && userSchool && !invoicesLoading) {
    const createdAt = new Date(userSchool.created_at)
    const trialEnd = new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000)
    const now = new Date()
    
    // 1. Check if trial expired for unapproved schools
    const isTrialExpired = userSchool.status === 'pending' && now > trialEnd

    // 2. Check for overdue invoices
    const overdueInvoice = invoices.find(inv => 
      (inv.status === 'pending' || inv.status === 'requested_approval') && new Date(inv.due_date) < now
    )

    if (isTrialExpired || overdueInvoice) {
      return (
        <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', background: '#f8f7ff', flexDirection: 'column' }}>
          <div style={{ fontSize: 60, marginBottom: 24 }}>💳</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1e0646', marginBottom: 12 }}>
            {isTrialExpired ? 'Free Trial Expired' : 'Payment Overdue'}
          </h2>
          <p style={{ maxWidth: 460, color: '#64748b', lineHeight: 1.6, marginBottom: 32 }}>
            {isTrialExpired 
              ? 'Your 30-day free trial has expired. To continue using the platform and unlock full access, please make your subscription payment.'
              : 'You have an unpaid invoice that is past its due date. Please settle the outstanding balance to restore access to your dashboard.'
            }
          </p>
          <div style={{ background: '#fff', padding: 24, borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: 24, width: '100%', maxWidth: 400 }}>
            <div style={{ fontSize: 13, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: 8 }}>Payment Instructions</div>
            <div style={{ fontSize: 16, color: '#1e0646', fontWeight: 600, marginBottom: 4 }}>Pay via Mobile Money to:</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#f59e0b', letterSpacing: '0.05em', marginBottom: 16 }}>0532416607</div>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
              Once you have sent the payment, please contact the administrator or request approval from your Billing page to restore access.
            </p>
          </div>
          {user.role === 'admin' ? (
             <button onClick={() => window.location.href = '/admin/billing'} style={{ padding: '14px 28px', borderRadius: 12, background: '#1e0646', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 15, transition: 'all 0.2s' }}>
               Go to Billing Page
             </button>
          ) : (
            <button onClick={() => window.location.reload()} style={{ padding: '12px 24px', borderRadius: 10, background: '#f59e0b', color: '#1e0646', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
              Check Status Again
            </button>
          )}
        </div>
      )
    }
  }

  return (
    <>
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#f8f7ff', fontFamily: '"DM Sans",system-ui,sans-serif' }}>
        
        {/* Subtle Watermark Background */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          backgroundImage: 'url(/wula-logo.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.03
        }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <NewsTicker />
          <Header />
          <style>{`
            .app-main { padding: 28px 32px 80px; }
            @media (max-width: 600px) { .app-main { padding: 20px 16px 100px; } }
          `}</style>
          <main className="app-main" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            <EnablePushButton />
            <Outlet />
          </main>
        </div>
      </div>
      <BottomNav />
      <WhatsNewModal />
      <AnnouncementPopup />
      <DailyInsightNotification />
      <FloatingClock />
    </>
  )
}