// src/components/layout/AppLayout.tsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import Sidebar from './Sidebar'
import Header from './Header'
import { ROUTES } from '../../constants/routes'

interface AppLayoutProps { requiredRole?: 'admin' | 'teacher' }

export default function AppLayout({ requiredRole }: AppLayoutProps) {
  const { user, loading, initialized } = useAuth()

  if (!initialized || loading) {
    return (
      <div style={{ display:'flex', height:'100vh', alignItems:'center', justifyContent:'center', background:'#f8f7ff', flexDirection:'column', gap:16, fontFamily:'system-ui,sans-serif' }}>
        <style>{`@keyframes _spin { to { transform:rotate(360deg) } }`}</style>
        <div style={{ width:44, height:44, borderRadius:'50%', border:'4px solid #ede9fe', borderTopColor:'#6d28d9', animation:'_spin 0.8s linear infinite' }} />
        <p style={{ fontSize:14, color:'#6b7280' }}>Loading World Uni-Learn…</p>
      </div>
    )
  }

  if (!user) return <Navigate to={ROUTES.LOGIN} replace />
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'admin' ? ROUTES.ADMIN_DASHBOARD : ROUTES.TEACHER_DASHBOARD} replace />
  }

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'#f8f7ff', fontFamily:'"DM Sans",system-ui,sans-serif' }}>
      <Sidebar />
      <div style={{ display:'flex', flex:1, flexDirection:'column', overflow:'hidden', minWidth:0 }}>
        <Header />
        <main style={{ flex:1, overflowY:'auto', padding:'28px 32px 48px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}