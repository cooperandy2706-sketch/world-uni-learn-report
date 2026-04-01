// src/pages/admin/ComingSoonPage.tsx
import { useState, useEffect } from 'react'

interface ComingSoonPageProps {
  title: string
  description: string
  icon: string
}

export default function ComingSoonPage({ title, description, icon }: ComingSoonPageProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div style={{
      opacity: mounted ? 1 : 0,
      transition: 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
      transform: mounted ? 'translateY(0)' : 'translateY(10px)',
      padding: '80px 32px',
      maxWidth: 800,
      margin: '0 auto',
      textAlign: 'center',
      fontFamily: '"Plus Jakarta Sans", sans-serif'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes _float {
          0%, 100% { transform: translateY(0) rotate(0); }
          50% { transform: translateY(-15px) rotate(3deg); }
        }
        @keyframes _pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(109, 40, 217, 0.2); }
          50% { box-shadow: 0 0 40px 10px rgba(109, 40, 217, 0.1); }
        }
      `}</style>

      <div style={{
        width: 120, height: 120, borderRadius: 32,
        background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 56, margin: '0 auto 32px',
        animation: '_float 4s ease-in-out infinite, _pulseGlow 3s ease-in-out infinite',
        border: '1px solid rgba(109, 40, 217, 0.1)'
      }}>
        {icon}
      </div>

      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '6px 16px', borderRadius: 99,
        background: '#f5f3ff', color: '#6d28d9',
        fontSize: 12, fontWeight: 800, letterSpacing: '0.05em',
        textTransform: 'uppercase', marginBottom: 20
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6d28d9' }} />
        Incoming Innovation
      </div>

      <h1 style={{
        fontSize: 42, fontWeight: 800, color: '#1e0646',
        letterSpacing: '-0.03em', marginBottom: 16,
        lineHeight: 1.1
      }}>
        {title}
      </h1>

      <p style={{
        fontSize: 18, color: '#64748b', lineHeight: 1.6,
        marginBottom: 40, maxWidth: 560, margin: '0 auto 40px'
      }}>
        {description}
      </p>

      <div style={{
        display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap'
      }}>
        <div style={{
          padding: '20px 32px', borderRadius: 20,
          background: '#fff', border: '1px solid #f1f5f9',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
          textAlign: 'left'
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Status</p>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#1e0646' }}>🛠️ Under Construction</p>
        </div>
        <div style={{
          padding: '20px 32px', borderRadius: 20,
          background: '#fff', border: '1px solid #f1f5f9',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
          textAlign: 'left'
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Estimated Release</p>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#1e0646' }}>📅 Phase 2 Deployment</p>
        </div>
      </div>

      <div style={{ marginTop: 64, borderTop: '1px solid #f1f5f9', paddingTop: 32 }}>
        <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>Want to prioritize this feature?</p>
        <button style={{
          padding: '12px 24px', borderRadius: 12, border: 'none',
          background: 'linear-gradient(135deg, #1e0646 0%, #3b0764 100%)',
          color: '#fff', fontWeight: 700, fontSize: 14,
          cursor: 'pointer', transition: 'transform 0.2s',
          boxShadow: '0 4px 20px rgba(30, 6, 70, 0.2)'
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          Vote for Priority Development
        </button>
      </div>
    </div>
  )
}
