// src/pages/staff/DashboardPage.tsx
import { Briefcase, Clock, Construction, LayoutDashboard, LogOut, Settings } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export default function StaffDashboard() {
  const { user, signOut } = useAuth()

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@700&display=swap');
        
        .staff-hero {
          background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
          border-radius: 24px;
          padding: 48px;
          color: white;
          position: relative;
          overflow: hidden;
          margin-bottom: 32px;
          box-shadow: 0 20px 40px rgba(30, 27, 75, 0.2);
        }
        
        .staff-hero::after {
          content: "";
          position: absolute;
          top: -100px;
          right: -100px;
          width: 300px;
          height: 300px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 50%;
        }

        .coming-soon-card {
          background: white;
          border-radius: 20px;
          padding: 32px;
          border: 1px solid #e2e8f0;
          text-align: center;
          max-width: 500px;
          margin: 40px auto;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
          margin-top: 40px;
        }

        .feature-item {
          background: #f8fafc;
          padding: 24px;
          border-radius: 16px;
          border: 1px solid #f1f5f9;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          color: #475569;
        }
      `}</style>

      <div style={{ padding: '24px', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 28, color: '#0f172a', margin: 0 }}>
              Staff Portal
            </h1>
            <p style={{ color: '#64748b', fontSize: 14 }}>Welcome back, {user?.full_name}</p>
          </div>
          <button 
            onClick={() => signOut()}
            style={{ 
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', 
              borderRadius: 12, background: '#fee2e2', color: '#b91c1c', border: 'none', 
              fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>

        {/* Hero */}
        <div className="staff-hero">
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: 20, display: 'inline-block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', marginBottom: 16 }}>
              Under Construction
            </div>
            <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 12 }}>Coming Soon</h2>
            <p style={{ fontSize: 18, opacity: 0.9, maxWidth: 500 }}>
              We're building a dedicated workspace for our essential staff. Your personal dashboard is almost ready!
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="coming-soon-card">
          <Construction size={48} color="#6366f1" style={{ marginBottom: 20 }} />
          <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', marginBottom: 12 }}>Your Dashboard is Being Prepared</h3>
          <p style={{ color: '#64748b', lineHeight: 1.6, fontSize: 14 }}>
            Soon, you'll be able to track your payroll history, manage your attendance, and access school-wide announcements all in one place.
          </p>
          
          <div className="feature-grid">
            <div className="feature-item">
              <LogOut size={24} color="#6366f1" />
              <span style={{ fontWeight: 600, fontSize: 13 }}>Payroll History</span>
            </div>
            <div className="feature-item">
              <Clock size={24} color="#6366f1" />
              <span style={{ fontWeight: 600, fontSize: 13 }}>Attendance Tracker</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
