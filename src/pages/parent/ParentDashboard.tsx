// src/pages/parent/ParentDashboard.tsx
import { useAuth } from '../../hooks/useAuth'
import { useParentWards } from '../../hooks/useParents'
import { useNavigate } from 'react-router-dom'
import { useMemo } from 'react'
import FlaskLoader from '../../components/ui/FlaskLoader'

function Avatar({ name, size = 48 }: { name: string; size?: number }) {
  const colors = ['#6d28d9','#0891b2','#16a34a','#d97706','#dc2626','#7c3aed','#0284c7']
  const color = colors[name.charCodeAt(0) % colors.length]
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(135deg, ${color}, ${color}cc)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.4, fontWeight: 800, color: '#fff',
      boxShadow: `0 2px 8px ${color}40`,
    }}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

export default function ParentDashboard() {
  const { user } = useAuth()
  const { data: wards = [], isLoading } = useParentWards()
  const navigate = useNavigate()

  const firstName = user?.full_name?.split(' ')[0] || 'Parent'

  if (isLoading) return <FlaskLoader fullScreen={false} label="Loading children…" />

  return (
    <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif', paddingBottom: 40, animation: '_fadeIn .4s ease', maxWidth: 600, margin: '0 auto' }}>
      <style>{`
        @keyframes _fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .ward-card:active { transform: scale(0.98); }
        .action-card:active { transform: scale(0.96); }
      `}</style>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 28, fontWeight: 700, color: '#111827', margin: 0 }}>
          Welcome back, {firstName} 👋
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
          Track your children's academic progress and fees.
        </p>
      </div>

      <div style={{ marginBottom: 30 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
          Your Children
        </h2>
        
        {wards.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 16, padding: 30, textAlign: 'center', border: '1.5px solid #f0eefe' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👨‍👩‍👦</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 6 }}>No children linked yet</h3>
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
              Please contact the school administration to link your children to this account.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {wards.map((ward) => (
              <div key={ward.id} className="ward-card" onClick={() => navigate(`/parent/ward/${ward.id}`)}
                style={{ background: '#fff', borderRadius: 18, border: '1.5px solid #f0eefe', padding: 18, display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 2px 8px rgba(109,40,217,0.04)', cursor: 'pointer', transition: 'all 0.15s' }}>
                <Avatar name={ward.full_name} size={54} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ward.full_name}</div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{ward.class?.name || 'No Class'} {ward.student_id ? `· ${ward.student_id}` : ''}</div>
                </div>
                <div style={{ color: '#d1d5db', fontSize: 20 }}>›</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginBottom: 30 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
          Quick Actions
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div className="action-card" onClick={() => navigate('/parent/billing')}
            style={{ background: 'linear-gradient(135deg,#fdf4ff,#fae8ff)', borderRadius: 16, padding: 20, cursor: 'pointer', transition: 'all 0.15s', border: '1.5px solid #f5d0fe' }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>💳</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#86198f' }}>Pay Fees</div>
            <div style={{ fontSize: 12, color: '#a21caf', marginTop: 2 }}>View outstanding</div>
          </div>
          
          <div className="action-card" onClick={() => navigate('/parent/academics')}
            style={{ background: 'linear-gradient(135deg,#eff6ff,#dbeafe)', borderRadius: 16, padding: 20, cursor: 'pointer', transition: 'all 0.15s', border: '1.5px solid #bfdbfe' }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>📊</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1e40af' }}>Results</div>
            <div style={{ fontSize: 12, color: '#1d4ed8', marginTop: 2 }}>Report cards</div>
          </div>

          <div className="action-card" onClick={() => navigate('/parent/messages')}
            style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', borderRadius: 16, padding: 20, cursor: 'pointer', transition: 'all 0.15s', border: '1.5px solid #bbf7d0' }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>💬</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#166534' }}>Messages</div>
            <div style={{ fontSize: 12, color: '#15803d', marginTop: 2 }}>Contact teachers</div>
          </div>
          
          <div className="action-card" onClick={() => navigate('/parent/calendar')}
            style={{ background: 'linear-gradient(135deg,#fff7ed,#ffedd5)', borderRadius: 16, padding: 20, cursor: 'pointer', transition: 'all 0.15s', border: '1.5px solid #fed7aa' }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>📅</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#9a3412' }}>Calendar</div>
            <div style={{ fontSize: 12, color: '#c2410c', marginTop: 2 }}>School events</div>
          </div>
        </div>
      </div>

    </div>
  )
}
