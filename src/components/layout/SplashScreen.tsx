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
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

        .splash-wrapper {
          position: fixed;
          inset: 0;
          z-index: 99999;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #09090b;
          font-family: 'Plus Jakarta Sans', sans-serif;
          overflow: hidden;
        }

        .splash-glow {
          position: absolute;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(124, 58, 237, 0.08) 0%, rgba(124, 58, 237, 0) 70%);
          filter: blur(60px);
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
          max-width: 320px;
          width: 100%;
          padding: 20px;
        }

        .logo-box {
          position: relative;
          width: 80px;
          height: 80px;
          background: #ffffff;
          border-radius: 8px;
          padding: 14px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          animation: logoEntrance 1s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .logo-box::after {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: 8px;
          background: linear-gradient(135deg, rgba(255,255,255,0.4), rgba(255,255,255,0.05));
          pointer-events: none;
        }

        .brand-title {
          font-size: 32px;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: #ffffff;
          margin: 0 0 6px 0;
          background: linear-gradient(135deg, #ffffff 30%, #a78bfa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: textEntrance 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both;
        }

        .brand-subtitle {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.25em;
          color: #a1a1aa;
          margin-bottom: 40px;
          animation: textEntrance 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both;
        }

        .progress-container {
          width: 180px;
          margin-bottom: 12px;
          animation: textEntrance 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both;
        }

        .progress-track {
          height: 2px;
          width: 100%;
          background: #27272a;
          border-radius: 1px;
          overflow: hidden;
        }

        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #7c3aed, #a78bfa);
          border-radius: 1px;
          transition: width 0.3s ease;
        }

        .status-text {
          font-size: 11px;
          font-weight: 600;
          color: #71717a;
          letter-spacing: 0.02em;
          animation: textEntrance 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both;
          height: 16px;
        }

        .credits {
          position: absolute;
          bottom: 32px;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.2em;
          color: #3f3f46;
          text-transform: uppercase;
          z-index: 2;
          animation: textEntrance 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.6s both;
        }

        @keyframes logoEntrance {
          0% { opacity: 0; transform: scale(0.8) translateY(20px); filter: blur(5px); }
          100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
        }

        @keyframes textEntrance {
          0% { opacity: 0; transform: translateY(10px); filter: blur(3px); }
          100% { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
      `}</style>

      <div className="splash-wrapper">
        <div className="splash-glow" />

        <div className="splash-content">
          <div className="logo-box">
            <img
              src="/icon-192.png"
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
