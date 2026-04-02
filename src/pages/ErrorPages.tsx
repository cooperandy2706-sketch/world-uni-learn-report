// src/pages/ErrorPages.tsx
// All error pages: Offline, 404, 403, 500, Unauthorized
import { useNavigate, useRouteError } from 'react-router-dom'

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  @keyframes _ep_float {
    0%,100% { transform: translateY(0px) rotate(-2deg); }
    50%      { transform: translateY(-18px) rotate(2deg); }
  }
  @keyframes _ep_pulse {
    0%,100% { opacity:1; transform:scale(1); }
    50%      { opacity:0.5; transform:scale(0.95); }
  }
  @keyframes _ep_in {
    from { opacity:0; transform:translateY(24px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes _ep_spin {
    to { transform: rotate(360deg); }
  }
  @keyframes _ep_blob {
    0%,100% { border-radius:60% 40% 30% 70% / 60% 30% 70% 40%; }
    50%      { border-radius:30% 60% 70% 40% / 50% 60% 30% 60%; }
  }
  @keyframes _ep_scan {
    0% { top:0; }
    100% { top:100%; }
  }
  @keyframes _ep_blink {
    0%,100% { opacity:1; }
    50% { opacity:0; }
  }
  @keyframes _ep_dash {
    to { stroke-dashoffset: 0; }
  }
  @keyframes _ep_shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  .ep-wrap {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'DM Sans', sans-serif;
    position: relative;
    overflow: hidden;
    padding: 20px;
  }

  .ep-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    border-radius: 12px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
    text-decoration: none;
  }
  .ep-btn:hover { transform: translateY(-2px); }

  .ep-content {
    position: relative;
    z-index: 10;
    text-align: center;
    max-width: 480px;
    animation: _ep_in 0.6s ease both;
  }

  .ep-code {
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.04em;
  }

  .ep-title {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
  }

  .ep-sub {
    font-size: 15px;
    line-height: 1.6;
    opacity: 0.75;
    font-weight: 400;
  }
`

// ── Shared blob background ─────────────────────────────────
function BlobBg({ color1, color2 }: { color1: string; color2: string }) {
  return (
    <>
      <div style={{
        position:'absolute', top:'-20%', left:'-15%',
        width:'55%', height:'55%',
        background:`radial-gradient(circle, ${color1} 0%, transparent 70%)`,
        opacity:0.35, animation:'_ep_blob 8s ease-in-out infinite',
        filter:'blur(40px)',
      }}/>
      <div style={{
        position:'absolute', bottom:'-20%', right:'-15%',
        width:'55%', height:'55%',
        background:`radial-gradient(circle, ${color2} 0%, transparent 70%)`,
        opacity:0.3, animation:'_ep_blob 10s ease-in-out infinite reverse',
        filter:'blur(40px)',
      }}/>
    </>
  )
}

// ══════════════════════════════════════════════════════════════
// 1. OFFLINE PAGE
// ══════════════════════════════════════════════════════════════
export function OfflinePage() {
  return (
    <>
      <style>{styles}</style>
      <div className="ep-wrap" style={{ background:'#0a0a0f', color:'#fff' }}>
        <BlobBg color1="#1e3a8a" color2="#1e40af" />

        {/* Signal towers */}
        <div style={{ position:'absolute', top:'15%', right:'12%', opacity:0.12 }}>
          {[60,45,30].map((h,i) => (
            <div key={i} style={{ width:3, height:h, background:'#60a5fa', borderRadius:99, marginBottom:4, animation:`_ep_pulse 1.5s ease ${i*0.3}s infinite` }}/>
          ))}
        </div>
        <div style={{ position:'absolute', bottom:'20%', left:'10%', opacity:0.08 }}>
          {[40,28,16].map((h,i) => (
            <div key={i} style={{ width:2, height:h, background:'#93c5fd', borderRadius:99, marginBottom:3, animation:`_ep_pulse 2s ease ${i*0.4}s infinite` }}/>
          ))}
        </div>

        <div className="ep-content">
          {/* Animated wifi icon */}
          <div style={{ position:'relative', width:100, height:100, margin:'0 auto 28px', animation:'_ep_float 4s ease-in-out infinite' }}>
            <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
              {/* Wifi arcs — strikethrough means offline */}
              <path d="M20 42 Q50 18 80 42" stroke="#60a5fa" strokeWidth="5" strokeLinecap="round" fill="none" strokeDasharray="100" strokeDashoffset="30" opacity="0.3"/>
              <path d="M30 55 Q50 38 70 55" stroke="#60a5fa" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.4"/>
              <path d="M38 67 Q50 56 62 67" stroke="#60a5fa" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.6"/>
              <circle cx="50" cy="78" r="5" fill="#3b82f6"/>
              {/* Strikethrough line */}
              <line x1="15" y1="15" x2="85" y2="85" stroke="#ef4444" strokeWidth="4" strokeLinecap="round"/>
            </svg>
          </div>

          <div className="ep-code" style={{ fontSize:80, color:'#1d4ed8', marginBottom:8 }}>
            No Signal
          </div>
          <h2 className="ep-title" style={{ fontSize:24, marginBottom:12, color:'#fff' }}>You're offline</h2>
          <p className="ep-sub" style={{ color:'#94a3b8', marginBottom:32 }}>
            WULA Reports can't connect to the internet right now. Check your WiFi or mobile data and try again.
          </p>

          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <button className="ep-btn" onClick={() => window.location.reload()}
              style={{ background:'#1d4ed8', color:'#fff', boxShadow:'0 4px 20px rgba(29,78,216,0.4)' }}>
              🔄 Try Again
            </button>
            <button className="ep-btn"
              onClick={() => window.history.back()}
              style={{ background:'rgba(255,255,255,0.08)', color:'#cbd5e1', border:'1px solid rgba(255,255,255,0.12)' }}>
              ← Go Back
            </button>
          </div>

          {/* Status indicator */}
          <div style={{ marginTop:40, display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity:0.5 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:'#ef4444', animation:'_ep_pulse 1s ease infinite' }}/>
            <span style={{ fontSize:12, color:'#94a3b8', letterSpacing:'.05em' }}>CONNECTION LOST</span>
          </div>
        </div>
      </div>
    </>
  )
}

// ══════════════════════════════════════════════════════════════
// 2. 404 NOT FOUND
// ══════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════
// 2. 404 NOT FOUND (PREMIUM REDESIGN)
// ══════════════════════════════════════════════════════════════
export function NotFoundPage() {
  const navigate = useNavigate()
  
  return (
    <>
      <style>{`
        ${styles}
        @keyframes _mesh {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes _float_ring {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50%      { transform: translateY(-20px) scale(1.1); opacity: 0.6; }
        }
        .mesh-bg {
          background: linear-gradient(-45deg, #f5f3ff, #ede9fe, #ddd6fe, #c4b5fd);
          background-size: 400% 400%;
          animation: _mesh 15s ease infinite;
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.4);
          box-shadow: 0 40px 100px rgba(109, 40, 217, 0.12);
          border-radius: 40px;
        }
      `}</style>

      <div className="ep-wrap mesh-bg">
        {/* Dynamic Blobs */}
        <div style={{ position: 'absolute', top: '10%', right: '10%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)', filter: 'blur(60px)', animation: '_ep_blob 12s infinite' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 70%)', filter: 'blur(80px)', animation: '_ep_blob 18s infinite reverse' }} />

        <div className="ep-content glass-card" style={{ padding: '60px 40px', maxWidth: 560 }}>
          
          {/* Lost 3D Bookshelf Concept */}
          <div style={{ position: 'relative', width: 220, height: 160, margin: '0 auto 40px' }}>
             <div style={{ fontSize: 90, animation: '_ep_float 4s ease-in-out infinite' }}>📚</div>
             {/* Orbital Rings */}
             <div style={{ position: 'absolute', inset: -20, border: '2px dashed rgba(124,58,237,0.2)', borderRadius: '50%', animation: '_ep_spin 10s linear infinite' }} />
             <div style={{ position: 'absolute', inset: -40, border: '1px solid rgba(124,58,237,0.1)', borderRadius: '50%', animation: '_ep_spin 15s linear infinite reverse' }} />
             <div style={{ position: 'absolute', top: -10, right: 0, fontSize: 32, animation: '_ep_float 3s ease-in-out 1s infinite' }}>❓</div>
          </div>

          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 12 }}>
            <div className="ep-code" style={{ 
              fontSize: 110, color: 'transparent',
              backgroundImage: 'linear-gradient(135deg, #6d28d9, #7c3aed, #a78bfa)',
              WebkitBackgroundClip: 'text', backgroundClip: 'text',
              filter: 'drop-shadow(0 4px 12px rgba(109,40,217,0.2))'
            }}>404</div>
            <div style={{ position: 'absolute', bottom: 12, right: -20, background: '#7c3aed', color: '#fff', padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 800, transform: 'rotate(12deg)' }}>LOST</div>
          </div>

          <h2 className="ep-title" style={{ fontSize: 32, color: '#1e1b4b', marginBottom: 14, letterSpacing: '-0.02em' }}>
            Lost in the Library?
          </h2>
          <p className="ep-sub" style={{ color: '#4b5563', marginBottom: 40, fontSize: 16, maxWidth: 400, margin: '0 auto 40px' }}>
            The resource you're hunting for has vanished from the shelves. Let's get you back to the main halls.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <button className="ep-btn" onClick={() => navigate('/')} style={{ 
              background: '#1e1b4b', color: '#fff', justifyContent: 'center', height: 54, 
              boxShadow: '0 10px 30px rgba(30,27,75,0.2)', borderRadius: 18
            }}>
              🏠 Back to Dashboard
            </button>
            <button className="ep-btn" onClick={() => navigate(-1)} style={{ 
              background: '#fff', color: '#1e1b4b', border: '2px solid #f1f5f9', justifyContent: 'center', height: 54,
              borderRadius: 18, boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
            }}>
              ← Go Back Previous
            </button>
          </div>

          {/* Quick Support Links */}
          <div style={{ marginTop: 48, display: 'flex', gap: 24, justifyContent: 'center', opacity: 0.6 }}>
             <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', fontSize: 11, fontWeight: 700, color: '#7c3aed', cursor: 'pointer', textTransform: 'uppercase' }}>Login Portal</button>
             <button onClick={() => location.reload()} style={{ background: 'none', border: 'none', fontSize: 11, fontWeight: 700, color: '#7c3aed', cursor: 'pointer', textTransform: 'uppercase' }}>Re-Sync Session</button>
          </div>
        </div>
      </div>
    </>
  )
}

// ══════════════════════════════════════════════════════════════
// 3. 403 UNAUTHORIZED / ACCESS DENIED
// ══════════════════════════════════════════════════════════════
export function UnauthorizedPage() {
  const navigate = useNavigate()
  return (
    <>
      <style>{styles}</style>
      <div className="ep-wrap" style={{ background:'#0f172a', color:'#fff' }}>
        <BlobBg color1="#dc2626" color2="#7f1d1d" />

        {/* Scanner line */}
        <div style={{
          position:'absolute', left:0, right:0, height:2,
          background:'linear-gradient(90deg,transparent,#ef4444,transparent)',
          animation:'_ep_scan 3s linear infinite', opacity:0.3,
          top:0,
        }}/>

        {/* Grid pattern */}
        <div style={{
          position:'absolute', inset:0, opacity:0.04,
          backgroundImage:'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
          backgroundSize:'40px 40px',
        }}/>

        <div className="ep-content">
          {/* Lock icon */}
          <div style={{ position:'relative', width:90, height:90, margin:'0 auto 24px', animation:'_ep_float 4s ease-in-out infinite' }}>
            <div style={{
              width:90, height:90, borderRadius:20,
              background:'linear-gradient(135deg,rgba(220,38,38,0.2),rgba(127,29,29,0.3))',
              border:'1.5px solid rgba(239,68,68,0.3)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:40,
              boxShadow:'0 0 40px rgba(220,38,38,0.2)',
            }}>
              🔒
            </div>
            {/* Pulsing ring */}
            <div style={{
              position:'absolute', inset:-8,
              borderRadius:28,
              border:'1px solid rgba(239,68,68,0.3)',
              animation:'_ep_pulse 2s ease infinite',
            }}/>
          </div>

          <div className="ep-code" style={{ fontSize:90, color:'#ef4444', marginBottom:4,
            textShadow:'0 0 60px rgba(239,68,68,0.4)' }}>
            403
          </div>
          <h2 className="ep-title" style={{ fontSize:26, marginBottom:10, color:'#fff' }}>Access Denied</h2>
          <p className="ep-sub" style={{ color:'#94a3b8', marginBottom:32 }}>
            You don't have permission to view this page. This area is restricted to authorized users only.
          </p>

          {/* Terminal-style detail */}
          <div style={{
            background:'rgba(0,0,0,0.4)', border:'1px solid rgba(239,68,68,0.2)',
            borderRadius:10, padding:'12px 16px', marginBottom:28, textAlign:'left',
            fontFamily:'monospace', fontSize:12, color:'#94a3b8',
          }}>
            <span style={{ color:'#ef4444' }}>ERROR</span> &nbsp;Access control policy violation<br/>
            <span style={{ color:'#94a3b8' }}>STATUS</span> &nbsp;403 Forbidden<br/>
            <span style={{ color:'#fbbf24', animation:'_ep_blink 1s ease infinite' }}>█</span>
          </div>

          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <button className="ep-btn" onClick={() => navigate('/')}
              style={{ background:'#dc2626', color:'#fff', boxShadow:'0 4px 20px rgba(220,38,38,0.4)' }}>
              🏠 Go Home
            </button>
            <button className="ep-btn" onClick={() => navigate(-1)}
              style={{ background:'rgba(255,255,255,0.06)', color:'#cbd5e1', border:'1px solid rgba(255,255,255,0.1)' }}>
              ← Go Back
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ══════════════════════════════════════════════════════════════
// 4. 500 SERVER ERROR
// ══════════════════════════════════════════════════════════════
export function ServerErrorPage() {
  const navigate = useNavigate()
  return (
    <>
      <style>{styles}</style>
      <div className="ep-wrap" style={{ background:'#0c0a09', color:'#fff' }}>
        <BlobBg color1="#f97316" color2="#b45309" />

        {/* Noise texture */}
        <div style={{
          position:'absolute', inset:0, opacity:0.03,
          backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}/>

        <div className="ep-content">
          {/* Broken gear */}
          <div style={{ fontSize:64, marginBottom:16, display:'block', animation:'_ep_spin 8s linear infinite', transformOrigin:'center', filter:'drop-shadow(0 0 20px rgba(249,115,22,0.5))' }}>
            ⚙️
          </div>

          <div className="ep-code" style={{
            fontSize:100, color:'transparent',
            backgroundImage:'linear-gradient(135deg,#f97316,#fb923c,#fed7aa)',
            WebkitBackgroundClip:'text', backgroundClip:'text',
            textShadow:'none', filter:'drop-shadow(0 0 30px rgba(249,115,22,0.4))',
            marginBottom:8,
          }}>
            500
          </div>
          <h2 className="ep-title" style={{ fontSize:26, color:'#fff', marginBottom:10 }}>Server Error</h2>
          <p className="ep-sub" style={{ color:'#a8a29e', marginBottom:32 }}>
            Something broke on our end. Our team has been notified. Try refreshing — it usually fixes itself in a moment.
          </p>

          {/* Error detail box */}
          <div style={{
            background:'rgba(249,115,22,0.08)', border:'1px solid rgba(249,115,22,0.2)',
            borderRadius:10, padding:'12px 16px', marginBottom:28,
            fontFamily:'monospace', fontSize:11, color:'#a8a29e', textAlign:'left',
          }}>
            <span style={{ color:'#fb923c' }}>INTERNAL_SERVER_ERROR</span><br/>
            An unexpected condition was encountered.<br/>
            <span style={{ color:'#6b7280' }}>Please try again in a few seconds.</span>
          </div>

          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <button className="ep-btn" onClick={() => window.location.reload()}
              style={{ background:'linear-gradient(135deg,#f97316,#ea580c)', color:'#fff', boxShadow:'0 4px 20px rgba(249,115,22,0.4)' }}>
              🔄 Refresh Page
            </button>
            <button className="ep-btn" onClick={() => navigate('/')}
              style={{ background:'rgba(255,255,255,0.06)', color:'#d6d3d1', border:'1px solid rgba(255,255,255,0.1)' }}>
              🏠 Go Home
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ══════════════════════════════════════════════════════════════
// 5. GENERIC ROUTE ERROR (catches all router errors)
// ══════════════════════════════════════════════════════════════
export function RouteErrorPage() {
  const error: any = useRouteError()
  const navigate = useNavigate()

  const status = error?.status ?? error?.statusCode ?? 500
  const isNotFound = status === 404
  const isForbidden = status === 403

  if (isNotFound) return <NotFoundPage />
  if (isForbidden) return <UnauthorizedPage />

  return (
    <>
      <style>{styles}</style>
      <div className="ep-wrap" style={{ background:'#0c0a09', color:'#fff' }}>
        <BlobBg color1="#f97316" color2="#b45309" />
        <div className="ep-content">
          <div style={{ fontSize:60, marginBottom:16, animation:'_ep_float 3s ease-in-out infinite' }}>💥</div>
          <div className="ep-code" style={{ fontSize:90, color:'#f97316', marginBottom:8 }}>{status}</div>
          <h2 className="ep-title" style={{ fontSize:26, color:'#fff', marginBottom:10 }}>Something went wrong</h2>
          <p className="ep-sub" style={{ color:'#a8a29e', marginBottom:24 }}>
            {error?.message ?? error?.statusText ?? 'An unexpected error occurred'}
          </p>
          {error?.message && (
            <div style={{ background:'rgba(0,0,0,0.4)', border:'1px solid rgba(249,115,22,0.2)', borderRadius:10, padding:'10px 14px', marginBottom:24, fontFamily:'monospace', fontSize:11, color:'#a8a29e', textAlign:'left', wordBreak:'break-all' }}>
              {error.message}
            </div>
          )}
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <button className="ep-btn" onClick={() => window.location.reload()}
              style={{ background:'#f97316', color:'#fff', boxShadow:'0 4px 20px rgba(249,115,22,0.4)' }}>
              🔄 Try Again
            </button>
            <button className="ep-btn" onClick={() => navigate('/')}
              style={{ background:'rgba(255,255,255,0.06)', color:'#d6d3d1', border:'1px solid rgba(255,255,255,0.1)' }}>
              🏠 Go Home
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ══════════════════════════════════════════════════════════════
// 6. LOADING / SUSPENSE FALLBACK
// ══════════════════════════════════════════════════════════════
export function LoadingPage() {
  return (
    <>
      <style>{styles}</style>
      <div className="ep-wrap" style={{ background:'#f8f7ff' }}>
        <BlobBg color1="#7c3aed" color2="#a78bfa" />
        <div className="ep-content">
          {/* Animated logo */}
          <div style={{ position:'relative', width:80, height:80, margin:'0 auto 28px' }}>
            <div style={{
              width:80, height:80, borderRadius:22,
              background:'linear-gradient(135deg,#7c3aed,#6d28d9)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:36,
              boxShadow:'0 8px 32px rgba(109,40,217,0.35)',
            }}>
              🎓
            </div>
            {/* Spinning ring */}
            <div style={{
              position:'absolute', inset:-6,
              borderRadius:28,
              border:'3px solid transparent',
              borderTopColor:'#7c3aed',
              borderRightColor:'#a78bfa',
              animation:'_ep_spin 1s linear infinite',
            }}/>
          </div>

          <div style={{
            fontFamily:'Syne, sans-serif', fontSize:24, fontWeight:700,
            color:'#1e1b4b', marginBottom:8, letterSpacing:'-0.02em',
          }}>
            WULA Reports
          </div>
          <p style={{ fontSize:14, color:'#6b7280', marginBottom:32 }}>Loading your workspace…</p>

          {/* Progress dots */}
          <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
            {[0,1,2].map(i => (
              <div key={i} style={{
                width:8, height:8, borderRadius:'50%',
                background:'#7c3aed',
                animation:`_ep_pulse 1.2s ease ${i*0.2}s infinite`,
              }}/>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}