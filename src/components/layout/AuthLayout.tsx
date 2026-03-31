// src/components/layout/AuthLayout.tsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { ROUTES } from '../../constants/routes'

export default function AuthLayout() {
  const { user, initialized } = useAuth()

  if (!initialized) return null

  if (user) {
    const redirect = user.role === 'admin' ? ROUTES.ADMIN_DASHBOARD : ROUTES.TEACHER_DASHBOARD
    return <Navigate to={redirect} replace />
  }

  return (
    <>
      <style>{`
        @keyframes orbDrift1 {
          0%   { transform: translate(0, 0) scale(1); }
          50%  { transform: translate(30px, -20px) scale(1.08); }
          100% { transform: translate(-10px, 15px) scale(0.96); }
        }
        @keyframes orbDrift2 {
          0%   { transform: translate(0, 0) scale(1); }
          50%  { transform: translate(-25px, 20px) scale(1.05); }
          100% { transform: translate(15px, -10px) scale(0.98); }
        }
        @keyframes orbDrift3 {
          0%   { transform: translate(0, 0) scale(1); }
          50%  { transform: translate(20px, 25px) scale(1.1); }
          100% { transform: translate(-15px, -5px) scale(0.95); }
        }
        @keyframes gridShimmer {
          0%   { opacity: 0.03; }
          50%  { opacity: 0.055; }
          100% { opacity: 0.03; }
        }
        .auth-bg-orb-1 {
          position: absolute;
          width: 560px; height: 560px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(245, 158, 11, 0.15), transparent 70%); /* amber glow */
          top: -180px; right: -100px;
          animation: orbDrift1 14s ease-in-out infinite alternate;
          pointer-events: none;
        }
        .auth-bg-orb-2 {
          position: absolute;
          width: 480px; height: 480px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.15), transparent 70%); /* purple glow */
          bottom: -160px; left: -100px;
          animation: orbDrift2 18s ease-in-out infinite alternate;
          pointer-events: none;
        }
        .auth-bg-orb-3 {
          position: absolute;
          width: 320px; height: 320px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,255,255,0.04), transparent 70%);
          top: 45%; left: 20%;
          animation: orbDrift3 10s ease-in-out infinite alternate;
          pointer-events: none;
        }
        .auth-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
          background-size: 56px 56px;
          animation: gridShimmer 8s ease-in-out infinite;
          pointer-events: none;
        }
        .auth-diagonal {
          position: absolute;
          top: -30%; right: -15%;
          width: 65%; height: 130%;
          background: linear-gradient(135deg, transparent 35%, rgba(245,158,11,0.04) 100%);
          transform: skewX(-10deg);
          pointer-events: none;
        }
      `}</style>
      
      {/* Remove previous layout container as AuthPage handles full screen styling now. 
          AuthPage brings its own 100vh layout, so we just outlet here. */}
      <Outlet />
    </>
  )
}