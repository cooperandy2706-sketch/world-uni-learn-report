// src/pages/student/StudentDashboard.tsx
import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'

export default function StudentDashboard() {
  const { user } = useAuth()
  const [studentData, setStudentData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchStudentProfile()
  }, [])

  async function fetchStudentProfile() {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*, class:classes(name)')
        .eq('user_id', user?.id)
        .single()

      if (error) throw error
      setStudentData(data)
    } catch (err) {
      console.error('Error fetching student profile:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #f3f4f6', borderTopColor: '#6d28d9', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ 
      opacity: mounted ? 1 : 0, 
      transition: 'opacity 0.6s ease', 
      padding: '32px', 
      maxWidth: 1200, 
      margin: '0 auto',
      fontFamily: '"Plus Jakarta Sans", sans-serif'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-up { animation: fadeUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both; }
      `}</style>

      {/* Header Section */}
      <header className="animate-up" style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <span style={{ padding: '6px 12px', borderRadius: 99, background: '#f5f3ff', color: '#7c3aed', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Student Portal
          </span>
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: '#1e0646', letterSpacing: '-0.03em' }}>
          Welcome back, {user?.full_name?.split(' ')[0] || 'Student'}! 👋
        </h1>
        <p style={{ color: '#64748b', fontSize: 16, marginTop: 8 }}>
          Here's a quick look at your academic profile and upcoming activities.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32 }}>
        
        {/* Main Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          
          {/* Quick Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[
              { label: 'Attendance', value: '98%', icon: '📅', color: '#10b981', bg: '#ecfdf5' },
              { label: 'Avg Grade', value: 'B+', icon: '📊', color: '#6d28d9', bg: '#f5f3ff' },
              { label: 'Assignments', value: '4 Pending', icon: '📝', color: '#f59e0b', bg: '#fffbeb' },
            ].map((stat, i) => (
              <div key={i} className="animate-up" style={{ 
                background: '#fff', padding: '24px', borderRadius: 24, border: '1px solid #f1f5f9',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)', animationDelay: `${0.1 + i * 0.1}s`
              }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 16 }}>
                  {stat.icon}
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#1e0646' }}>{stat.value}</div>
                <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Academic News / Placeholder */}
          <div className="animate-up" style={{ 
            background: 'linear-gradient(135deg, #1e0646, #5b21b6)', padding: '40px', borderRadius: 32, 
            color: '#fff', position: 'relative', overflow: 'hidden', animationDelay: '0.4s'
          }}>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Academic Results are Coming!</h2>
              <p style={{ opacity: 0.8, fontSize: 15, maxWidth: 400, lineHeight: 1.6 }}>
                The school is currently finalizing the end-of-term reports. Check back soon to view your performance dashboard.
              </p>
              <button style={{ 
                marginTop: 24, padding: '12px 24px', borderRadius: 14, border: 'none', background: '#fff',
                color: '#1e0646', fontWeight: 700, fontSize: 14, cursor: 'pointer'
              }}>
                View Full Calendar
              </button>
            </div>
            <div style={{ position: 'absolute', right: -20, bottom: -20, fontSize: 160, opacity: 0.1, transform: 'rotate(-15deg)' }}>
              🎓
            </div>
          </div>

        </div>

        {/* Sidebar / Profile Card */}
        <div className="animate-up" style={{ animationDelay: '0.2s' }}>
          <div style={{ 
            background: '#fff', borderRadius: 28, border: '1px solid #f1f5f9', 
            padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.02)', position: 'sticky', top: 32
          }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ 
                width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 32, fontWeight: 800, color: '#fff', boxShadow: '0 8px 16px rgba(109,40,217,0.2)'
              }}>
                {user?.full_name?.charAt(0)}
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1e0646' }}>{studentData?.full_name || user?.full_name}</h3>
              <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                {studentData?.class?.name || 'Class Unassigned'}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ padding: '16px', background: '#f8fafc', borderRadius: 16 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student ID</span>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1e0646', marginTop: 4 }}>{studentData?.student_id || 'Not Assigned'}</div>
              </div>
              <div style={{ padding: '16px', background: '#f8fafc', borderRadius: 16 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</span>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1e0646', marginTop: 4 }}>{user?.email}</div>
              </div>
            </div>

            <button style={{ 
              width: '100%', marginTop: 32, padding: '14px', borderRadius: 16, 
              border: '1.5px solid #e2e8f0', background: '#fff', color: '#1e0646', 
              fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' 
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#7c3aed'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
            >
              Update Profile
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
