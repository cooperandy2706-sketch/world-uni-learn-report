// src/pages/parent/ParentWardPage.tsx
// Dedicated detail page for a single ward – mounted at /parent/ward/:id
import { useParams, useNavigate } from 'react-router-dom'
import { useParentWards } from '../../hooks/useParents'
import FlaskLoader from '../../components/ui/FlaskLoader'

export default function ParentWardPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: wards = [], isLoading } = useParentWards()

  if (isLoading) return <FlaskLoader fullScreen={false} label="Loading…" />

  const ward = wards.find(w => w.id === id)

  if (!ward) {
    return (
      <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif', textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)' }}>Ward not found</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>This child may no longer be linked to your account.</p>
        <button onClick={() => navigate('/parent/dashboard')}
          style={{ marginTop: 16, padding: '10px 22px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
          ← Back to Dashboard
        </button>
      </div>
    )
  }

  const colors = ['#6d28d9','#0891b2','#16a34a','#d97706','#dc2626','#7c3aed','#0284c7']
  const color = colors[ward.full_name.charCodeAt(0) % colors.length]

  const actions = [
    { icon: '📊', label: 'Results', sub: 'Report cards', path: '/parent/academics', bg: 'linear-gradient(135deg,#eff6ff,#dbeafe)', border: '#bfdbfe', textC: '#1e40af' },
    { icon: '💳', label: 'Pay Fees', sub: 'Outstanding balance', path: '/parent/billing', bg: 'linear-gradient(135deg,#fdf4ff,#fae8ff)', border: '#f5d0fe', textC: '#86198f' },
    { icon: '💬', label: 'Messages', sub: 'Contact teachers', path: '/parent/messages', bg: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '#bbf7d0', textC: '#166534' },
    { icon: '📅', label: 'Calendar', sub: 'School events', path: '/parent/calendar', bg: 'linear-gradient(135deg,#fff7ed,#ffedd5)', border: '#fed7aa', textC: '#9a3412' },
    { icon: '📋', label: 'Attendance', sub: 'Track daily presence', path: '/parent/attendance', bg: 'linear-gradient(135deg,#f0f9ff,#e0f2fe)', border: '#bae6fd', textC: '#0369a1' },
    { icon: '🚪', label: 'Exeats', sub: 'Request leave', path: '/parent/exeats', bg: 'linear-gradient(135deg,#fef2f2,#fee2e2)', border: '#fecaca', textC: '#b91c1c' },
  ]

  return (
    <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif', maxWidth: 600, margin: '0 auto', paddingBottom: 40, animation: '_fadeIn .4s ease' }}>
      <style>{`
        @keyframes _fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .action-card:active { transform: scale(0.96); }
      `}</style>

      {/* Back */}
      <button onClick={() => navigate('/parent/dashboard')}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer', marginBottom: 24, padding: 0 }}>
        ← All Children
      </button>

      {/* Profile card */}
      <div style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, borderRadius: 8, padding: 28, color: '#fff', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20, boxShadow: `0 8px 24px ${color}40` }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, flexShrink: 0, border: '3px solid rgba(255,255,255,0.4)' }}>
          {ward.full_name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 24, fontWeight: 700, margin: '0 0 4px' }}>{ward.full_name}</h1>
          <div style={{ fontSize: 14, opacity: 0.85 }}>{ward.class?.name || 'No Class Assigned'}</div>
          {ward.student_id && <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>ID: {ward.student_id}</div>}
        </div>
      </div>

      {/* Info row */}
      {(ward.gender || ward.class?.name) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          {ward.gender && (
            <div style={{ background: 'var(--bg-card)', border: '1.5px solid #f0eefe', borderRadius: 14, padding: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-subtle)', marginBottom: 4 }}>Gender</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)', textTransform: 'capitalize' }}>{ward.gender}</div>
            </div>
          )}
          {ward.class?.name && (
            <div style={{ background: 'var(--bg-card)', border: '1.5px solid #f0eefe', borderRadius: 14, padding: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-subtle)', marginBottom: 4 }}>Class</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>{ward.class.name}</div>
            </div>
          )}
        </div>
      )}

      {/* Quick actions */}
      <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Quick Actions</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {actions.map(a => (
          <div key={a.label} className="action-card" onClick={() => navigate(a.path)}
            style={{ background: a.bg, borderRadius: 8, padding: 20, cursor: 'pointer', transition: 'all 0.15s', border: `1.5px solid ${a.border}` }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>{a.icon}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: a.textC }}>{a.label}</div>
            <div style={{ fontSize: 12, color: a.textC, marginTop: 2, opacity: 0.8 }}>{a.sub}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
