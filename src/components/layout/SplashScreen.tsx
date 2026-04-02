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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&family=Playfair+Display:wght@700&display=swap');
        
        @keyframes _sp_in { from{opacity:0;transform:scale(0.96) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes _sp_shimmer { 0%{background-position:-100%} 100%{background-position:200%} }
        @keyframes _sp_icon_float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        
        .sp-container {
          position: fixed; inset: 0; z-index: 9999;
          display: flex; align-items: center; justify-content: center;
          font-family: "DM Sans", system-ui, sans-serif;
          padding: 20px;
          background: transparent !important;
          transition: background 0.5s ease;
        }

        /* Force body transparency during splash */
        body { background: transparent !important; }

        /* Desktop View: Card Only Focus */
        @media (min-width: 1024px) {
          .sp-card {
            box-shadow: 0 40px 120px rgba(0,0,0,0.2) !important;
            border: 1px solid #f1f5f9;
          }
          .sp-branding, .sp-footer {
            opacity: 0.4;
          }
        }

        /* PWA Standalone Mode: Maximum Minimalism */
        @media (display-mode: standalone) {
          .sp-container {
            background: #ffffff !important;
          }
          .sp-card {
            box-shadow: none !important;
            border: none;
          }
          .sp-branding, .sp-footer {
            display: none !important;
          }
        }

        .sp-card {
          width: 100%; max-width: 440px;
          background: #fff;
          border-radius: 28px;
          padding: 48px 40px;
          box-shadow: 0 25px 60px -12px rgba(109, 40, 217, 0.15), 0 0 1px rgba(109, 40, 217, 0.2);
          text-align: center;
          animation: _sp_in 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both;
          border: 1px solid rgba(109, 40, 217, 0.05);
          position: relative;
          overflow: hidden;
        }

        .sp-shimmer {
          background: linear-gradient(90deg, transparent, rgba(124, 58, 237, 0.03), transparent);
          background-size: 200% 100%;
          animation: _sp_shimmer 2s infinite linear;
          position: absolute; inset: 0; pointer-events: none;
        }
      `}</style>

      <div className="sp-card">
        <div className="sp-shimmer" />

        {/* ── Icon Section ── */}
        <div style={{
          width: 80, height: 80, borderRadius: 24, margin: '0 auto 28px',
          background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
          boxShadow: '0 12px 28px rgba(245,158,11,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: '_sp_icon_float 3s ease-in-out infinite',
        }}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white" opacity="0.95" />
            <path d="M2 17c0 0 3.5 3 10 3s10-3 10-3" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
            <path d="M2 7v10" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />
            <path d="M12 12v8" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />
          </svg>
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
