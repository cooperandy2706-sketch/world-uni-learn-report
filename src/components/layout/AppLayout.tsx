// src/components/layout/AppLayout.tsx
import { useState, useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import Sidebar from './Sidebar'
import Header from './Header'
import BottomNav from './BottomNav'
import SplashScreen from './SplashScreen'
import EnablePushButton from '../ui/EnablePushButton'
import WhatsNewModal from '../ui/WhatsNewModal'
import { ROUTES } from '../../constants/routes'

interface AppLayoutProps { requiredRole?: 'super_admin' | 'admin' | 'teacher' | 'student' }

export default function AppLayout({ requiredRole }: AppLayoutProps) {
  const { user, loading, initialized } = useAuth()
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    // Keep splash for at least 2s to allow animations to play and app to settle
    const timer = setTimeout(() => {
      if (initialized && !loading) {
        setShowSplash(false)
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [initialized, loading])

  // Also check if we should hide it once auth completes (if it took > 2s)
  useEffect(() => {
    if (initialized && !loading) {
      const t = setTimeout(() => setShowSplash(false), 200) // Small grace period
      return () => clearTimeout(t)
    }
  }, [initialized, loading])

  if (showSplash) {
    return <SplashScreen />
  }

  if (!user) return <Navigate to={ROUTES.LOGIN} replace />
  
  if (requiredRole && user.role !== requiredRole) {
    if (user.role === 'super_admin') return <Navigate to="/super-admin/dashboard" replace />
    if (user.role === 'student') return <Navigate to="/student/dashboard" replace />
    return <Navigate to={user.role === 'admin' ? ROUTES.ADMIN_DASHBOARD : ROUTES.TEACHER_DASHBOARD} replace />
  }

  // Pending School Guard (Non-super-admins)
  const userSchool = user.school as any
  if (user.role !== 'super_admin' && userSchool?.status === 'pending') {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', background: '#f8f7ff', flexDirection: 'column' }}>
        <div style={{ fontSize: 60, marginBottom: 24 }}>⏳</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1e0646', marginBottom: 12 }}>Awaiting Approval</h2>
        <p style={{ maxWidth: 460, color: '#64748b', lineHeight: 1.6, marginBottom: 32 }}>
          Your school registration is being reviewed by the platform administrators. 
          You will have access to your dashboard once your school is confirmed (usually within 24 hours).
        </p>
        <button onClick={() => window.location.reload()} style={{ padding: '12px 24px', borderRadius: 10, background: '#f59e0b', color: '#1e0646', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
          Check Status
        </button>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @media (max-width: 767px) {
          .app-sidebar { display: none !important; }
          .app-main { padding: 16px 14px 80px !important; }
          .app-header { padding: 0 14px !important; }
        }
      `}</style>
      <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'#f8f7ff', fontFamily:'"DM Sans",system-ui,sans-serif' }}>
        <div className="app-sidebar">
          <Sidebar />
        </div>
        <div style={{ display:'flex', flex:1, flexDirection:'column', overflow:'hidden', minWidth:0 }}>
          <Header />
          <main className="app-main" style={{ flex:1, overflowY:'auto', padding:'28px 32px 48px' }}>
            <EnablePushButton />
            <Outlet />
          </main>
        </div>
      </div>
      <BottomNav />
      <WhatsNewModal />
    </>
  )
}