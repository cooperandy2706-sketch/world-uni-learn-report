// src/components/layout/SplashScreen.tsx
import { useState, useEffect } from 'react'

export default function SplashScreen() {
  const [progress, setProgress] = useState(0)
  const [statusIdx, setStatusIdx] = useState(0)

  const statuses = [
    'Initializing Secure Core...',
    'Syncing Classroom Database...',
    'Loading Educator Tools...',
    'Optimizing Report Visuals...',
    'Preparing Your Dashboard...',
    'Almost Ready...'
  ]

  useEffect(() => {
    const pTimer = setInterval(() => {
      setProgress(old => {
        if (old >= 95) return old
        return old + (Math.random() * 15)
      })
    }, 400)

    const sTimer = setInterval(() => {
      setStatusIdx(old => (old + 1) % statuses.length)
    }, 1200)

    return () => {
      clearInterval(pTimer)
      clearInterval(sTimer)
    }
  }, [])

  return (
    <div className="sp-container">
      
      <div className="sp-card">
        <div className="sp-shimmer" />

        {/* ── Icon Section ── */}
        <div style={{
          width: 80, height: 80, borderRadius: 24, margin: '0 auto 28px',
          background: '#fff', padding: 8,
          boxShadow: '0 12px 28px rgba(0,0,0,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: '_sp_icon_float 3s ease-in-out infinite',
        }}>
          <img src="/wula.png" alt="WULA" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>

        {/* ── Branding ── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            fontSize: 12, fontWeight: 800, letterSpacing: '0.24em',
            color: '#a78bfa', textTransform: 'uppercase', marginBottom: 6
          }}>
            World Uni-Learn
          </div>
          <div style={{
            fontFamily: '"Playfair Display", serif', fontSize: 32,
            fontWeight: 700, color: '#1e1b4b', lineHeight: 1.1
          }}>
            Academy Portal
          </div>
        </div>

        {/* ── Progress Section ── */}
        <div style={{ marginTop: 40 }}>
          <div style={{
            height: 6, width: '100%', background: '#f3f4f6',
            borderRadius: 99, overflow: 'hidden', marginBottom: 12
          }}>
            <div style={{
              height: '100%', width: `${progress}%`,
              background: 'linear-gradient(90deg, #7c3aed, #fbbf24)',
              borderRadius: 99, transition: 'width 0.4s ease',
            }} />
          </div>

          <div key={statusIdx} style={{
            fontSize: 13, fontWeight: 500, color: '#64748b',
            animation: '_sp_in 0.4s ease'
          }}>
            {statuses[statusIdx]}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="sp-footer" style={{
          marginTop: 48, paddingTop: 24, borderTop: '1px solid #f1f5f9',
          display: 'flex', justifyContent: 'center', gap: 24
        }}>
          {['Analytics', 'Dashboard', 'Reports'].map((use) => (
            <div key={use} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#fbbf24' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {use}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Branding tag ── */}
      <div className="sp-branding" style={{
        position: 'absolute', bottom: 32,
        fontSize: 11, fontWeight: 600, color: '#94a3b8',
        letterSpacing: '0.1em'
      }}>
        COOPER ANDY MAWUNYO
      </div>
    </div>
  )
}
