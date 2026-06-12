// src/components/layout/SplashScreen.tsx
import { useState, useEffect } from 'react'

export default function SplashScreen() {
  const [progress, setProgress] = useState(0)
  const [statusIdx, setStatusIdx] = useState(0)

  const statuses = [
    'Securing connection...',
    'Loading academic modules...',
    'Syncing local databases...',
    'Optimizing workspace performance...',
    'Readying dashboard...'
  ]

  useEffect(() => {
    const pTimer = setInterval(() => {
      setProgress(old => {
        if (old >= 100) return 100
        const step = Math.random() * 20
        return Math.min(old + step, 98) // stay at 98 until auth lets it through
      })
    }, 250)

    const sTimer = setInterval(() => {
      setStatusIdx(old => (old + 1) % statuses.length)
    }, 1000)

    return () => {
      clearInterval(pTimer)
      clearInterval(sTimer)
    }
  }, [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

        .splash-wrapper {
          position: fixed;
          inset: 0;
          z-index: 99999;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #020617;
          font-family: 'Outfit', system-ui, sans-serif;
          overflow: hidden;
        }

        .splash-glow {
          position: absolute;
          top: -10%;
          left: -10%;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(56, 189, 248, 0.08) 0%, rgba(56, 189, 248, 0) 60%);
          filter: blur(80px);
          pointer-events: none;
          z-index: 1;
        }

        .splash-glow-2 {
          position: absolute;
          bottom: -20%;
          right: -10%;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(124, 58, 237, 0.08) 0%, rgba(124, 58, 237, 0) 60%);
          filter: blur(80px);
          pointer-events: none;
          z-index: 1;
        }

        .splash-content {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          max-width: 380px;
          width: 100%;
          padding: 32px;
        }

        .logo-box {
          position: relative;
          width: 96px;
          height: 96px;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 28px;
          padding: 22px;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 32px;
          animation: scaleUp 1.2s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .brand-title {
          font-size: 42px;
          font-weight: 800;
          letter-spacing: -0.04em;
          color: #ffffff;
          margin: 0 0 8px 0;
          background: linear-gradient(135deg, #ffffff 30%, #94a3b8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;
        }

        .brand-subtitle {
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.3em;
          color: #64748b;
          margin-bottom: 48px;
          animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both;
        }

        .progress-container {
          width: 220px;
          margin-bottom: 16px;
          animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both;
        }

        .progress-track {
          height: 4px;
          width: 100%;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 4px;
          overflow: hidden;
          position: relative;
        }

        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #38bdf8, #818cf8);
          border-radius: 4px;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 0 12px rgba(56, 189, 248, 0.4);
        }

        .status-text {
          font-size: 13px;
          font-weight: 500;
          color: #94a3b8;
          letter-spacing: 0.01em;
          animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both;
          height: 20px;
        }

        .credits {
          position: absolute;
          bottom: 40px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.25em;
          color: #334155;
          text-transform: uppercase;
          z-index: 2;
          animation: fadeUp 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.6s both;
        }

        @keyframes scaleUp {
          0% { opacity: 0; transform: scale(0.85) translateY(20px); filter: blur(12px); }
          100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
        }

        @keyframes fadeUp {
          0% { opacity: 0; transform: translateY(15px); filter: blur(6px); }
          100% { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
      `}</style>

      <div className="splash-wrapper">
        <div className="splash-glow" />
        <div className="splash-glow-2" />

        <div className="splash-content">
          <div className="logo-box">
            <img
              src="/icon-512.png"
              alt="Acadera Logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
            />
          </div>

          <h1 className="brand-title">Acadera</h1>
          <p className="brand-subtitle">School Platform</p>

          <div className="progress-container">
            <div className="progress-track">
              <div className="progress-bar" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="status-text">{statuses[statusIdx]}</div>
        </div>

        <div className="credits">Cooper Andy Mawunyo</div>
      </div>
    </>
  )
}
