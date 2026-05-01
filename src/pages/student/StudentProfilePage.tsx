import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { ROUTES } from '../../constants/routes'
import { Link } from 'react-router-dom'
import { User, Shield, Phone, Mail, MapPin, Calendar, Briefcase, GraduationCap } from 'lucide-react'
import toast from 'react-hot-toast'

export default function StudentProfilePage() {
  const { user } = useAuth()
  const [studentData, setStudentData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setTimeout(() => setMounted(true), 50)
    if (user?.id) loadProfile()
  }, [user?.id])

  async function loadProfile() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*, class:classes(name), school:schools(name)')
        .eq('user_id', user!.id)
        .single()
      
      if (error) throw error
      setStudentData(data)
    } catch (err: any) {
      toast.error(err.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '70vh', flexDirection: 'column', gap: 16 }}>
      <style>{`@keyframes _ssp{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #ede9fe', borderTopColor: '#6d28d9', animation: '_ssp .8s linear infinite' }} />
      <p style={{ fontSize: 13, color: '#6b7280', fontFamily: '"DM Sans",sans-serif' }}>Loading profile…</p>
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _sfu{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .profile-card{background:#fff; border-radius:24px; border:1.5px solid #f0eefe; padding:32px; box-shadow:0 1px 4px rgba(109,40,217,.06); transition:all .3s ease}
        .profile-card:hover{box-shadow:0 8px 30px rgba(109,40,217,.08); transform:translateY(-2px)}
        .info-row{display:flex; align-items:center; gap:16px; padding:16px 0; border-bottom:1px solid #f8fafc}
        .info-row:last-child{border-bottom:none}
        .info-label{font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:.05em; margin-bottom:4px}
        .info-value{font-size:14px; font-weight:600; color:#1e293b}
        @media (max-width: 850px) {
          .profile-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
          .info-grid { grid-template-columns: 1fr !important; gap: 0 !important; }
          .profile-card { padding: 24px !important; }
          .header-row { flex-direction: column !important; align-items: stretch !important; gap: 16px !important; }
        }
      `}</style>

      <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif', opacity: mounted ? 1 : 0, transition: 'opacity .4s ease', maxWidth: 1000, margin: '0 auto' }}>
        
        {/* Header */}
        <div className="header-row" style={{ marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', animation: '_sfu .5s ease both' }}>
          <div>
            <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 32, fontWeight: 700, color: '#111827', margin: 0 }}>My Profile</h1>
            <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>Manage your personal information and account settings</p>
          </div>
          <Link to={ROUTES.STUDENT_DASHBOARD} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600, background: '#fff', color: '#374151', textDecoration: 'none', border: '1.5px solid #e5e7eb', justifyContent: 'center' }}>← Dashboard</Link>
        </div>

        <div className="profile-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 32 }}>
          
          {/* Left Column: Avatar & Basic Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32, animation: '_sfu .5s ease .1s both' }}>
            <div className="profile-card" style={{ textAlign: 'center' }}>
              <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto 24px' }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, fontWeight: 800, color: '#fff', boxShadow: '0 12px 24px rgba(109,40,217,0.2)' }}>
                  {user?.full_name?.charAt(0).toUpperCase()}
                </div>
                <div style={{ position: 'absolute', bottom: 4, right: 4, width: 36, height: 36, borderRadius: '50%', background: '#fff', border: '1.5px solid #f0eefe', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6d28d9', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  📸
                </div>
              </div>
              <h2 style={{ fontFamily: '"Playfair Display",serif', fontSize: 24, fontWeight: 700, color: '#1e293b', margin: '0 0 4px' }}>{user?.full_name}</h2>
              <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 20px' }}>{studentData?.student_id || 'ID Pending'}</p>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, background: '#f5f3ff', color: '#6d28d9', padding: '6px 14px', borderRadius: 99, border: '1px solid #ddd6fe' }}>🎓 Student</span>
                {studentData?.class?.name && <span style={{ fontSize: 11, fontWeight: 700, background: '#f0fdf4', color: '#16a34a', padding: '6px 14px', borderRadius: 99, border: '1px solid #bbf7d0' }}>{studentData.class.name}</span>}
              </div>
            </div>

            <div className="profile-card">
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Shield size={20} color="#6d28d9" /> Account Security
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ background: '#f8fafc', padding: 16, borderRadius: 16, border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Email Address</div>
                  <div style={{ fontSize: 14, color: '#1e293b' }}>{user?.email}</div>
                </div>
                <button style={{ width: '100%', padding: '12px', borderRadius: 12, background: '#fff', color: '#6d28d9', fontSize: 13, fontWeight: 700, border: '1.5px solid #6d28d9', cursor: 'pointer', transition: 'all 0.2s' }}>
                  Change Password
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Detailed Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32, animation: '_sfu .5s ease .2s both' }}>
            <div className="profile-card">
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', margin: '0 0 24px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <User size={22} color="#6d28d9" /> Personal Details
              </h3>
              <div className="info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
                <div className="info-row">
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: '#f0fdfa', color: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Calendar size={20} /></div>
                  <div>
                    <div className="info-label">Date of Birth</div>
                    <div className="info-value">{studentData?.date_of_birth || 'Not Set'}</div>
                  </div>
                </div>
                <div className="info-row">
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: '#fdf4ff', color: '#c026d3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><GraduationCap size={20} /></div>
                  <div>
                    <div className="info-label">Gender</div>
                    <div className="info-value" style={{ textTransform: 'capitalize' }}>{studentData?.gender || 'Not Set'}</div>
                  </div>
                </div>
                <div className="info-row">
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Briefcase size={20} /></div>
                  <div>
                    <div className="info-label">House</div>
                    <div className="info-value">{studentData?.house || 'None'}</div>
                  </div>
                </div>
                <div className="info-row">
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MapPin size={20} /></div>
                  <div>
                    <div className="info-label">Address</div>
                    <div className="info-value">{studentData?.address || 'Not Provided'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="profile-card">
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', margin: '0 0 24px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Phone size={22} color="#6d28d9" /> Guardian Information
              </h3>
              <div className="info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
                <div className="info-row">
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={20} /></div>
                  <div>
                    <div className="info-label">Guardian Name</div>
                    <div className="info-value">{studentData?.guardian_name || 'Not Set'}</div>
                  </div>
                </div>
                <div className="info-row">
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: '#fff1f2', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Phone size={20} /></div>
                  <div>
                    <div className="info-label">Guardian Phone</div>
                    <div className="info-value">{studentData?.guardian_phone || 'Not Set'}</div>
                  </div>
                </div>
                <div className="info-row">
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: '#ecfeff', color: '#0891b2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Mail size={20} /></div>
                  <div>
                    <div className="info-label">Guardian Email</div>
                    <div className="info-value">{studentData?.guardian_email || 'Not Provided'}</div>
                  </div>
                </div>
                <div className="info-row">
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: '#fef2f2', color: '#991b1b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Shield size={20} /></div>
                  <div>
                    <div className="info-label">Scholarship</div>
                    <div className="info-value" style={{ textTransform: 'capitalize' }}>{studentData?.scholarship_type || 'None'} {studentData?.scholarship_percentage ? `(${studentData.scholarship_percentage}%)` : ''}</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ background: '#6d28d9', borderRadius: 24, padding: 24, color: '#fff', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: -20, bottom: -20, fontSize: 100, opacity: 0.1 }}>📞</div>
              <h4 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px' }}>Need to update your details?</h4>
              <p style={{ fontSize: 13, opacity: 0.8, margin: '0 0 16px', maxWidth: 400 }}>If any of your information is incorrect or has changed, please contact the school administration office to request an update.</p>
              <button style={{ padding: '10px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
                Contact Support
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
