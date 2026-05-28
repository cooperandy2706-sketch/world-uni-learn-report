// src/components/ui/NetworkStatusHUD.tsx
import { useState, useEffect } from 'react'

export default function NetworkStatusHUD() {
  const [online, setOnline] = useState(navigator.onLine)
  const [connectionSpeed, setConnectionSpeed] = useState<string | null>(null)
  const [latency, setLatency] = useState<number | null>(null)
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // 1. Connection Event Listeners
    const handleOnline = () => {
      setOnline(true)
      setVisible(true)
      // Auto-hide online confirmation after 3.5 seconds
      const t = setTimeout(() => setVisible(false), 3500)
      return () => clearTimeout(t)
    }

    const handleOffline = () => {
      setOnline(false)
      setDismissed(false)
      setVisible(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // 2. Advanced Connection Diagnostics (Network Information API)
    const conn = (navigator as any).connection
    const checkSpeed = () => {
      if (!conn) return
      const speed = conn.effectiveType || ''
      const rtt = conn.rtt || 0
      setConnectionSpeed(speed)
      setLatency(rtt)

      // Auto-show alert if connection falls to 2G speeds or RTT exceeds 3000ms
      const isSlow = speed === 'slow-2g' || speed === '2g' || rtt > 3000
      if (isSlow && navigator.onLine) {
        setDismissed(false)
        setVisible(true)
      } else if (!isSlow && navigator.onLine) {
        setVisible(false)
      }
    }

    if (conn) {
      checkSpeed()
      conn.addEventListener('change', checkSpeed)
    }

    // Run initial trigger check
    if (!navigator.onLine) {
      handleOffline()
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      if (conn) conn.removeEventListener('change', checkSpeed)
    }
  }, [])

  if (!visible || dismissed) return null

  const isOffline = !online
  const isSlow = online && (connectionSpeed === 'slow-2g' || connectionSpeed === '2g' || (latency && latency > 3000))

  let bannerBg = 'rgba(254, 242, 242, 0.95)' // Offline red
  let borderColor = '#fca5a5'
  let textColor = '#991b1b'
  let icon = '⚠️'
  let message = 'Working Offline — Data caches active'
  let subtitle = 'Changes will automatically sync when network returns.'

  if (isSlow) {
    bannerBg = 'rgba(255, 251, 235, 0.95)' // Amber slow
    borderColor = '#fcd34d'
    textColor = '#92400e'
    icon = '⚡'
    message = 'Poor Connection Detected'
    subtitle = `Running at slow ${connectionSpeed?.toUpperCase() || '3G'} speed (${latency}ms latency). Caches active.`
  } else if (online && !isOffline && !isSlow) {
    bannerBg = 'rgba(240, 253, 244, 0.95)' // Connected green
    borderColor = '#86efac'
    textColor = '#166534'
    icon = '✅'
    message = 'Connection Restored'
    subtitle = 'Data synced successfully with cloud server.'
  }

  return (
    <>
      <style>{`
        @keyframes hudSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .hud-container {
          position: fixed;
          bottom: 90px;
          right: 20px;
          max-width: 360px;
          width: calc(100% - 40px);
          z-index: 99999;
          border-radius: 8px;
          padding: 14px 16px;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.05);
          backdrop-filter: blur(8px);
          animation: hudSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
          display: flex;
          gap: 12px;
          align-items: flex-start;
          transition: all 0.2s ease;
        }
        @media (max-width: 640px) {
          .hud-container {
            bottom: 80px;
            right: 20px;
            left: 20px;
            max-width: none;
            width: auto;
          }
        }
      `}</style>

      <div 
        className="hud-container" 
        style={{ 
          background: bannerBg, 
          border: `1.5px solid ${borderColor}`,
          color: textColor,
          fontFamily: '"DM Sans",system-ui,sans-serif'
        }}
      >
        <div style={{ fontSize: 22, flexShrink: 0 }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{ margin: '0 0 3px', fontSize: 13, fontWeight: 700 }}>{message}</h4>
          <p style={{ margin: 0, fontSize: 11, opacity: 0.85, lineHeight: 1.4 }}>{subtitle}</p>
        </div>
        <button 
          onClick={() => setDismissed(true)} 
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'inherit', 
            fontSize: 16, 
            fontWeight: 700, 
            cursor: 'pointer', 
            padding: '2px 4px', 
            opacity: 0.6,
            lineHeight: 1
          }}
        >
          ×
        </button>
      </div>
    </>
  )
}
