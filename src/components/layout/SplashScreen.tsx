// src/components/layout/SplashScreen.tsx
import { useState, useEffect, useRef } from 'react'

export default function SplashScreen() {
  const [progress, setProgress] = useState(0)
  const [statusIdx, setStatusIdx] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const statuses = [
    'Initializing Secure Core...',
    'Syncing Classroom Database...',
    'Loading Educator Tools...',
    'Optimizing Report Visuals...',
    'Preparing Your Dashboard...',
    'Almost Ready...'
  ]

  // ── Particle canvas ──
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let particles: { x: number; y: number; r: number; vx: number; vy: number; a: number; da: number }[] = []

    function resize() {
      canvas!.width = window.innerWidth
      canvas!.height = window.innerHeight
      initParticles()
    }

    function initParticles() {
      particles = Array.from({ length: 60 }, () => ({
        x: Math.random() * canvas!.width,
        y: Math.random() * canvas!.height,
        r: Math.random() * 2 + 0.5,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -Math.random() * 0.4 - 0.1,
        a: Math.random() * 0.5 + 0.1,
        da: (Math.random() - 0.5) * 0.005,
      }))
    }

    function draw() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        p.a = Math.max(0.05, Math.min(0.6, p.a + p.da))
        if (p.a <= 0.05 || p.a >= 0.6) p.da *= -1
        if (p.y < -10) { p.y = canvas!.height + 10; p.x = Math.random() * canvas!.width }
        if (p.x < -10) p.x = canvas!.width + 10
        if (p.x > canvas!.width + 10) p.x = -10
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(167, 139, 250, ${p.a})`
        ctx!.fill()
      })
      animId = requestAnimationFrame(draw)
    }

    resize()
    draw()
    window.addEventListener('resize', resize)
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animId)
    }
  }, [])

  // ── Progress & status ──
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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@600;700;800&display=swap');

        @keyframes _nx_rise {
          from { opacity: 0; transform: translateY(40px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes _nx_float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-14px) rotate(1deg); }
        }
        @keyframes _nx_glow_pulse {
          0%, 100% { box-shadow: 0 0 30px rgba(124,58,237,0.3), 0 0 60px rgba(124,58,237,0.1); }
          50% { box-shadow: 0 0 50px rgba(124,58,237,0.5), 0 0 100px rgba(124,58,237,0.2); }
        }
        @keyframes _nx_orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes _nx_shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes _nx_fadeStatus {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes _nx_bar_glow {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.3); }
        }
        @keyframes _nx_ring_pulse {
          0% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.15); opacity: 0.1; }
          100% { transform: scale(1.3); opacity: 0; }
        }
        @keyframes _nx_letter_in {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="sp-container" style={{
        background: 'radial-gradient(ellipse at 30% 20%, #1a0533 0%, #0c0118 50%, #050010 100%)',
        flexDirection: 'column',
        gap: 0,
      }}>
        {/* Particle canvas */}
        <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />

        {/* Gradient orbs */}
        <div style={{
          position: 'fixed', width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)',
          top: '-10%', left: '-10%', filter: 'blur(40px)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'fixed', width: 350, height: 350, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)',
          bottom: '-5%', right: '-5%', filter: 'blur(50px)', pointerEvents: 'none',
        }} />

        {/* Main content card */}
        <div style={{
          position: 'relative', zIndex: 10, width: '100%', maxWidth: 420,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          animation: '_nx_rise 0.8s cubic-bezier(0.16, 1, 0.3, 1) both',
          padding: '0 20px',
        }}>

          {/* Logo with orbital rings */}
          <div style={{
            position: 'relative', width: 140, height: 140,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 36, animation: '_nx_float 4s ease-in-out infinite',
          }}>
            {/* Pulsing ring */}
            <div style={{
              position: 'absolute', inset: -12, borderRadius: '50%',
              border: '1.5px solid rgba(124,58,237,0.2)',
              animation: '_nx_ring_pulse 3s ease-in-out infinite',
            }} />
            {/* Orbit ring */}
            <div style={{
              position: 'absolute', inset: -20, borderRadius: '50%',
              border: '1px dashed rgba(167,139,250,0.12)',
              animation: '_nx_orbit 20s linear infinite',
            }}>
              <div style={{
                position: 'absolute', top: -3, left: '50%', marginLeft: -3,
                width: 6, height: 6, borderRadius: '50%',
                background: '#f59e0b', boxShadow: '0 0 10px rgba(245,158,11,0.6)',
              }} />
            </div>

            {/* Logo container */}
            <div style={{
              width: 110, height: 110, borderRadius: 28,
              background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))',
              padding: 12,
              boxShadow: '0 20px 60px rgba(124,58,237,0.3), 0 0 1px rgba(255,255,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: '_nx_glow_pulse 3s ease-in-out infinite',
              backdropFilter: 'blur(20px)',
            }}>
              <img
                src="/nexora-logo.png"
                alt="Nexora"
                style={{
                  width: '100%', height: '100%',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 2px 8px rgba(124,58,237,0.2))',
                }}
              />
            </div>
          </div>

          {/* Brand name with letter animation */}
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.3em',
              color: 'rgba(167,139,250,0.5)', textTransform: 'uppercase',
              marginBottom: 10, fontFamily: '"Outfit", sans-serif',
            }}>
              Next-Gen School Platform
            </div>
            <div style={{
              fontFamily: '"Playfair Display", serif',
              fontSize: 48, fontWeight: 800, lineHeight: 1,
              background: 'linear-gradient(135deg, #e9e0ff 0%, #a78bfa 30%, #7c3aed 60%, #f59e0b 100%)',
              backgroundClip: 'text', WebkitBackgroundClip: 'text',
              color: 'transparent',
              letterSpacing: '-0.02em',
              filter: 'drop-shadow(0 2px 10px rgba(124,58,237,0.3))',
            }}>
              {'Nexora'.split('').map((ch, i) => (
                <span key={i} style={{
                  display: 'inline-block',
                  animation: `_nx_letter_in 0.5s ${0.1 + i * 0.06}s cubic-bezier(0.16, 1, 0.3, 1) both`,
                }}>{ch}</span>
              ))}
            </div>
          </div>

          {/* Tagline */}
          <p style={{
            fontSize: 14, fontWeight: 400, color: 'rgba(203,213,225,0.5)',
            fontFamily: '"Outfit", sans-serif', letterSpacing: '0.02em',
            marginBottom: 48, marginTop: 8,
          }}>
            Empowering schools. Elevating futures.
          </p>

          {/* Progress bar */}
          <div style={{ width: '100%', maxWidth: 280 }}>
            <div style={{
              height: 4, width: '100%',
              background: 'rgba(124,58,237,0.12)',
              borderRadius: 99, overflow: 'hidden',
              marginBottom: 14,
            }}>
              <div style={{
                height: '100%', width: `${Math.min(progress, 100)}%`,
                background: 'linear-gradient(90deg, #7c3aed, #a78bfa, #f59e0b)',
                borderRadius: 99,
                transition: 'width 0.4s ease',
                animation: '_nx_bar_glow 2s ease-in-out infinite',
                backgroundSize: '200% 100%',
              }} />
            </div>

            {/* Status text */}
            <div key={statusIdx} style={{
              fontSize: 12, fontWeight: 500,
              color: 'rgba(148,163,184,0.6)',
              fontFamily: '"Outfit", sans-serif',
              textAlign: 'center',
              letterSpacing: '0.03em',
              animation: '_nx_fadeStatus 0.4s ease both',
            }}>
              {statuses[statusIdx]}
            </div>
          </div>

          {/* Feature pills */}
          <div style={{
            display: 'flex', gap: 20, marginTop: 56,
            justifyContent: 'center', flexWrap: 'wrap',
          }}>
            {[
              { icon: '📊', label: 'Analytics' },
              { icon: '🎓', label: 'Reports' },
              { icon: '🛡️', label: 'Secure' },
            ].map((item, i) => (
              <div key={item.label} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                animation: `_nx_rise 0.6s ${0.6 + i * 0.1}s cubic-bezier(0.16, 1, 0.3, 1) both`,
              }}>
                <span style={{ fontSize: 12 }}>{item.icon}</span>
                <span style={{
                  fontSize: 10, fontWeight: 600,
                  color: 'rgba(167,139,250,0.35)',
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  fontFamily: '"Outfit", sans-serif',
                }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom branding */}
        <div style={{
          position: 'absolute', bottom: 28,
          fontSize: 10, fontWeight: 500, color: 'rgba(148,163,184,0.25)',
          letterSpacing: '0.15em', fontFamily: '"Outfit", sans-serif',
          textTransform: 'uppercase', zIndex: 10,
        }}>
          COOPER ANDY MAWUNYO
        </div>
      </div>
    </>
  )
}
