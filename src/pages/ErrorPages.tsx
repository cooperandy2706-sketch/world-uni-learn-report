// src/pages/ErrorPages.tsx
import { useNavigate, useRouteError } from 'react-router-dom'

const BASE = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-16px)}}
@keyframes floatR{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-12px) rotate(3deg)}}
@keyframes blink{0%,100%{transform:scaleY(1)}48%{transform:scaleY(1)}50%{transform:scaleY(0.1)}52%{transform:scaleY(1)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes spinR{to{transform:rotate(-360deg)}}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.95)}}
@keyframes fadein{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes wave{0%,100%{transform:rotate(0deg)}25%{transform:rotate(15deg)}75%{transform:rotate(-10deg)}}
@keyframes scanline{0%{top:0%}100%{top:100%}}
@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}
@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes signal{0%,100%{opacity:.2}50%{opacity:1}}
.ep{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;font-family:'Nunito',sans-serif;position:relative;overflow:hidden;text-align:center}
.ep-card{background:rgba(255,255,255,0.08);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.15);border-radius:32px;padding:40px 32px;max-width:420px;width:100%;animation:fadein .6s ease both;box-shadow:0 30px 80px rgba(0,0,0,0.3)}
.ep-title{font-size:26px;font-weight:900;margin:16px 0 8px;line-height:1.2}
.ep-sub{font-size:15px;font-weight:700;opacity:.7;line-height:1.6;margin-bottom:28px}
.ep-btn{display:inline-flex;align-items:center;gap:8px;padding:14px 28px;border-radius:16px;font-family:'Nunito',sans-serif;font-size:15px;font-weight:800;cursor:pointer;border:none;transition:all .2s;text-decoration:none}
.ep-btn:hover{transform:translateY(-3px);filter:brightness(1.1)}
.ep-btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
.blob{position:absolute;border-radius:50%;filter:blur(60px);pointer-events:none}
`

function Btn({ children, onClick, primary }: { children: any, onClick: () => void, primary?: boolean }) {
  return (
    <button className="ep-btn" onClick={onClick} style={{
      background: primary ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.12)',
      color: primary ? '#1e1b4b' : '#fff',
      border: primary ? 'none' : '1px solid rgba(255,255,255,0.2)',
    }}>{children}</button>
  )
}

// ── OFFLINE ──────────────────────────────────────────────────────
export function OfflinePage() {
  return (
    <>
      <style>{BASE}</style>
      <div className="ep" style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%)', color: '#fff' }}>
        <div className="blob" style={{ width: 300, height: 300, background: '#1e40af', opacity: .25, top: '-10%', left: '-10%' }} />
        <div className="blob" style={{ width: 250, height: 250, background: '#0ea5e9', opacity: .15, bottom: '-5%', right: '-5%' }} />
        <div className="ep-card">
          {/* Cartoon cloud with broken wifi */}
          <svg width="160" height="130" viewBox="0 0 160 130" style={{ animation: 'float 3s ease-in-out infinite', display: 'block', margin: '0 auto 8px' }}>
            {/* Cloud body */}
            <ellipse cx="80" cy="80" rx="55" ry="35" fill="#334155" />
            <circle cx="55" cy="72" r="22" fill="#334155" />
            <circle cx="80" cy="62" r="28" fill="#475569" />
            <circle cx="105" cy="70" r="20" fill="#334155" />
            {/* Rain drops */}
            <line x1="55" y1="108" x2="50" y2="122" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round" style={{ animation: 'signal 1s ease .0s infinite' }} />
            <line x1="75" y1="112" x2="70" y2="126" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round" style={{ animation: 'signal 1s ease .2s infinite' }} />
            <line x1="95" y1="108" x2="90" y2="122" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round" style={{ animation: 'signal 1s ease .4s infinite' }} />
            {/* X mark on cloud */}
            <line x1="68" y1="62" x2="82" y2="76" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
            <line x1="82" y1="62" x2="68" y2="76" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
            {/* Sad face */}
            <circle cx="73" cy="71" r="2.5" fill="#94a3b8" />
            <circle cx="87" cy="71" r="2.5" fill="#94a3b8" />
            <path d="M74 78 Q80 74 86 78" stroke="#94a3b8" strokeWidth="2" fill="none" strokeLinecap="round" />
          </svg>
          <div className="ep-title" style={{ color: '#e2e8f0' }}>No Connection</div>
          <p className="ep-sub" style={{ color: '#94a3b8' }}>WULA can't reach the internet right now. Check your WiFi or mobile data.</p>
          <div className="ep-btns">
            <Btn onClick={() => window.location.reload()} primary>🔄 Try Again</Btn>
            <Btn onClick={() => window.history.back()}>← Go Back</Btn>
          </div>
          <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }} />
            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 800, letterSpacing: '.08em' }}>OFFLINE</span>
          </div>
        </div>
      </div>
    </>
  )
}

// ── 404 ───────────────────────────────────────────────────────────
export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <>
      <style>{BASE}</style>
      <div className="ep" style={{ background: 'linear-gradient(135deg,#f5f3ff 0%,#ede9fe 100%)', color: '#1e1b4b' }}>
        <div className="blob" style={{ width: 350, height: 350, background: '#a78bfa', opacity: .2, top: '-15%', right: '-10%' }} />
        <div className="blob" style={{ width: 250, height: 250, background: '#7c3aed', opacity: .12, bottom: '-10%', left: '-5%' }} />
        <div className="ep-card" style={{ background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(124,58,237,0.15)' }}>
          {/* Cartoon astronaut lost in space */}
          <svg width="160" height="160" viewBox="0 0 160 160" style={{ display: 'block', margin: '0 auto' }}>
            {/* Stars */}
            {[[20,20],[140,30],[15,120],[145,110],[80,10]].map(([x,y],i) => (
              <circle key={i} cx={x} cy={y} r="2" fill="#7c3aed" style={{ animation: `pulse 1.5s ease ${i*.3}s infinite` }} />
            ))}
            {/* Planet */}
            <circle cx="130" cy="120" r="22" fill="#ddd6fe" />
            <ellipse cx="130" cy="120" rx="30" ry="8" fill="none" stroke="#a78bfa" strokeWidth="2.5" />
            {/* Astronaut body */}
            <g style={{ animation: 'floatR 4s ease-in-out infinite', transformOrigin: '80px 80px' }}>
              <ellipse cx="80" cy="95" rx="22" ry="26" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="2" />
              {/* Helmet */}
              <circle cx="80" cy="65" r="22" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
              <circle cx="80" cy="65" r="16" fill="#c4b5fd" opacity=".7" />
              {/* Visor shine */}
              <ellipse cx="74" cy="60" rx="5" ry="7" fill="white" opacity=".5" />
              {/* Eyes */}
              <circle cx="74" cy="64" r="3" fill="#1e1b4b" style={{ animation: 'blink 4s ease infinite' }} />
              <circle cx="86" cy="64" r="3" fill="#1e1b4b" style={{ animation: 'blink 4s ease infinite' }} />
              {/* Arms */}
              <ellipse cx="55" cy="90" rx="9" ry="16" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="2" transform="rotate(-20 55 90)" style={{ animation: 'wave 3s ease-in-out infinite' }} />
              <ellipse cx="105" cy="90" rx="9" ry="16" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="2" transform="rotate(20 105 90)" />
              {/* Legs */}
              <rect x="65" y="116" width="12" height="18" rx="6" fill="#cbd5e1" />
              <rect x="83" y="116" width="12" height="18" rx="6" fill="#cbd5e1" />
            </g>
            {/* Question mark bubble */}
            <g style={{ animation: 'bounce 2s ease infinite' }}>
              <circle cx="112" cy="45" r="16" fill="#7c3aed" />
              <text x="112" y="51" textAnchor="middle" fill="white" fontSize="18" fontWeight="900">?</text>
            </g>
          </svg>
          <div style={{ fontSize: 64, fontWeight: 900, color: '#7c3aed', lineHeight: 1, fontFamily: 'Nunito, sans-serif' }}>404</div>
          <div className="ep-title">Lost in Space!</div>
          <p className="ep-sub" style={{ color: '#6b7280' }}>This page drifted off into the void. Let's bring you back to Earth.</p>
          <div className="ep-btns">
            <Btn onClick={() => navigate('/')} primary>🏠 Go Home</Btn>
            <Btn onClick={() => navigate(-1)}>← Go Back</Btn>
          </div>
        </div>
      </div>
    </>
  )
}

// ── 403 ACCESS DENIED ─────────────────────────────────────────────
export function UnauthorizedPage() {
  const navigate = useNavigate()
  return (
    <>
      <style>{BASE}</style>
      <div className="ep" style={{ background: 'linear-gradient(135deg,#0f172a 0%,#3b0764 100%)', color: '#fff' }}>
        <div className="blob" style={{ width: 300, height: 300, background: '#dc2626', opacity: .18, top: '-10%', right: '0' }} />
        <div className="blob" style={{ width: 280, height: 280, background: '#7c3aed', opacity: .15, bottom: '0', left: '-5%' }} />
        <div className="ep-card">
          {/* Guard robot cartoon */}
          <svg width="140" height="160" viewBox="0 0 140 160" style={{ display: 'block', margin: '0 auto', animation: 'float 3.5s ease-in-out infinite' }}>
            {/* Robot head */}
            <rect x="35" y="20" width="70" height="60" rx="12" fill="#334155" stroke="#475569" strokeWidth="2" />
            {/* Antenna */}
            <line x1="70" y1="20" x2="70" y2="8" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
            <circle cx="70" cy="6" r="5" fill="#ef4444" style={{ animation: 'pulse 1s ease infinite' }} />
            {/* Eyes - angry */}
            <rect x="44" y="36" width="18" height="12" rx="4" fill="#ef4444" />
            <rect x="78" y="36" width="18" height="12" rx="4" fill="#ef4444" />
            <rect x="48" y="38" width="10" height="8" rx="2" fill="#991b1b" />
            <rect x="82" y="38" width="10" height="8" rx="2" fill="#991b1b" />
            {/* Mouth - stern line */}
            <rect x="52" y="64" width="36" height="6" rx="3" fill="#64748b" />
            {/* Body */}
            <rect x="30" y="85" width="80" height="55" rx="10" fill="#1e293b" stroke="#334155" strokeWidth="2" />
            {/* Chest badge */}
            <rect x="50" y="97" width="40" height="24" rx="6" fill="#7c3aed" opacity=".8" />
            <text x="70" y="114" textAnchor="middle" fill="white" fontSize="10" fontWeight="900">NO ACCESS</text>
            {/* Arms */}
            <rect x="10" y="88" width="18" height="40" rx="9" fill="#334155" style={{ animation: 'wave 2s ease-in-out infinite' }} />
            <rect x="112" y="88" width="18" height="40" rx="9" fill="#334155" />
            {/* Legs */}
            <rect x="42" y="140" width="18" height="18" rx="6" fill="#1e293b" />
            <rect x="80" y="140" width="18" height="18" rx="6" fill="#1e293b" />
          </svg>
          <div style={{ fontSize: 56, fontWeight: 900, color: '#ef4444', lineHeight: 1, fontFamily: 'Nunito,sans-serif', textShadow: '0 0 30px rgba(239,68,68,.4)' }}>403</div>
          <div className="ep-title">Access Denied!</div>
          <p className="ep-sub" style={{ color: '#94a3b8' }}>Our guard robot says you can't enter here. This area is restricted.</p>
          <div className="ep-btns">
            <Btn onClick={() => navigate('/')} primary>🏠 Go Home</Btn>
            <Btn onClick={() => navigate(-1)}>← Go Back</Btn>
          </div>
        </div>
      </div>
    </>
  )
}

// ── 500 SERVER ERROR ──────────────────────────────────────────────
export function ServerErrorPage() {
  const navigate = useNavigate()
  return (
    <>
      <style>{BASE}</style>
      <div className="ep" style={{ background: 'linear-gradient(135deg,#0c0a09 0%,#1c0a00 100%)', color: '#fff' }}>
        <div className="blob" style={{ width: 350, height: 350, background: '#f97316', opacity: .12, top: '-15%', left: '-10%' }} />
        <div className="blob" style={{ width: 250, height: 250, background: '#dc2626', opacity: .1, bottom: '0', right: '0' }} />
        <div className="ep-card">
          {/* Broken computer cartoon */}
          <svg width="160" height="140" viewBox="0 0 160 140" style={{ display: 'block', margin: '0 auto', animation: 'shake 3s ease-in-out infinite' }}>
            {/* Monitor */}
            <rect x="20" y="10" width="120" height="85" rx="10" fill="#1e293b" stroke="#334155" strokeWidth="2" />
            <rect x="28" y="18" width="104" height="68" rx="6" fill="#0f172a" />
            {/* Cracked screen lines */}
            <line x1="70" y1="18" x2="95" y2="86" stroke="#ef4444" strokeWidth="2" opacity=".6" />
            <line x1="95" y1="30" x2="75" y2="55" stroke="#ef4444" strokeWidth="1.5" opacity=".4" />
            <line x1="40" y1="50" x2="70" y2="86" stroke="#f97316" strokeWidth="1.5" opacity=".4" />
            {/* Error text on screen */}
            <text x="80" y="48" textAnchor="middle" fill="#ef4444" fontSize="11" fontWeight="900">ERROR!</text>
            <text x="80" y="65" textAnchor="middle" fill="#f97316" fontSize="8">500</text>
            {/* Smoke */}
            <g style={{ animation: 'float 2s ease-in-out infinite' }}>
              <ellipse cx="60" cy="6" rx="8" ry="5" fill="#475569" opacity=".6" />
              <ellipse cx="72" cy="2" rx="6" ry="4" fill="#334155" opacity=".5" />
              <ellipse cx="50" cy="2" rx="5" ry="3" fill="#475569" opacity=".4" />
            </g>
            {/* Gear spinning */}
            <g style={{ animation: 'spin 4s linear infinite', transformOrigin: '118px 55px' }}>
              <circle cx="118" cy="55" r="14" fill="#f97316" opacity=".8" />
              <circle cx="118" cy="55" r="8" fill="#1e293b" />
              {[0,45,90,135].map(a => (
                <rect key={a} x="116" y="38" width="4" height="8" rx="2" fill="#f97316"
                  transform={`rotate(${a} 118 55)`} />
              ))}
            </g>
            {/* Stand */}
            <rect x="68" y="95" width="24" height="10" rx="4" fill="#334155" />
            <rect x="50" y="105" width="60" height="8" rx="4" fill="#475569" />
          </svg>
          <div style={{ fontSize: 56, fontWeight: 900, color: '#f97316', lineHeight: 1, fontFamily: 'Nunito,sans-serif' }}>500</div>
          <div className="ep-title">Server Meltdown!</div>
          <p className="ep-sub" style={{ color: '#a8a29e' }}>Something blew up on our end. Our team is fixing it. Try refreshing!</p>
          <div className="ep-btns">
            <Btn onClick={() => window.location.reload()} primary>🔄 Refresh</Btn>
            <Btn onClick={() => navigate('/')}>🏠 Go Home</Btn>
          </div>
        </div>
      </div>
    </>
  )
}

// ── ROUTE ERROR (catches all) ─────────────────────────────────────
export function RouteErrorPage() {
  const error: any = useRouteError()
  const navigate = useNavigate()
  const status = error?.status ?? error?.statusCode ?? 500
  if (status === 404) return <NotFoundPage />
  if (status === 403) return <UnauthorizedPage />
  return <ServerErrorPage />
}

// ── LOADING / SUSPENSE ────────────────────────────────────────────
export function LoadingPage() {
  return (
    <>
      <style>{BASE}</style>
      <div className="ep" style={{ background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)', color: '#1e1b4b' }}>
        <div className="ep-card" style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(124,58,237,.2)' }}>
          <svg width="100" height="100" viewBox="0 0 100 100" style={{ display: 'block', margin: '0 auto 16px' }}>
            <circle cx="50" cy="50" r="38" fill="none" stroke="#ede9fe" strokeWidth="6" />
            <circle cx="50" cy="50" r="38" fill="none" stroke="#7c3aed" strokeWidth="6"
              strokeDasharray="60 180" strokeLinecap="round" style={{ animation: 'spin 1s linear infinite', transformOrigin: '50px 50px' }} />
            <text x="50" y="56" textAnchor="middle" fontSize="28">🎓</text>
          </svg>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#1e1b4b', marginBottom: 8 }}>WULA Reports</div>
          <p style={{ fontSize: 14, color: '#6b7280', fontWeight: 700 }}>Loading your workspace…</p>
        </div>
      </div>
    </>
  )
}