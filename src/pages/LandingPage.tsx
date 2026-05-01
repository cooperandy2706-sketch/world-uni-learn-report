// src/pages/LandingPage.tsx
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../constants/routes'

// ── Intersection Observer hook ────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

// ── Animated counter ──────────────────────────────────────
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0)
  const { ref, inView } = useInView(0.5)
  useEffect(() => {
    if (!inView) return
    let start = 0
    const step = Math.ceil(to / 60)
    const t = setInterval(() => {
      start += step
      if (start >= to) { setVal(to); clearInterval(t) }
      else setVal(start)
    }, 16)
    return () => clearInterval(t)
  }, [inView, to])
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>
}

// ── Feature card data ─────────────────────────────────────
const features = [
  {
    icon: '⌨️',
    title: 'Command Palette (⌘K)',
    desc: 'Navigate at lightning speed with our intent-based natural language search. Just type "pay fees for Desmond" to jump straight into action.',
  },
  {
    icon: '💰',
    title: 'Dynamic Billing Engine',
    desc: 'A robust Bursar portal that seamlessly manages term fees, calculates automated scholarship discounts, and tracks daily feeding collections in real-time.',
  },
  {
    icon: '📱',
    title: 'Smart SMS Hub',
    desc: 'Blast automated SMS report cards, fee payment reminders, and urgent announcements directly to parents’ phones instantly.',
  },
  {
    icon: '⚡',
    title: 'Automated Grading & BECE',
    desc: 'Breeze through the academic term with instant grade calculations, automated batch promotions, and a dedicated BECE CA Processor.',
  },
  {
    icon: '🛡️',
    title: 'Isolated Role Portals',
    desc: 'Dedicated, secure dashboards crafted specifically for Super Admins, School Heads, Teachers, Bursars, and Students.',
  },
  {
    icon: '🎮',
    title: 'Interactive Student Hub',
    desc: 'Keep students engaged with built-in Typing Nitro games, a global digital library, and a live PEC student election voting system.',
  },
]

const steps = [
  { n: '01', title: 'Administration', desc: 'Securely set up academic years, configure classes, and assign specific subjects to your staff.' },
  { n: '02', title: 'Teaching', desc: 'Teachers log in to view their daily schedule, conduct lessons, and enter student continuous assessment scores.' },
  { n: '03', title: 'Learning', desc: 'Students access digital resources, complete their assigned work, and track their own academic progress.' },
  { n: '04', title: 'Reporting', desc: 'Automate complex grade arithmetic and instantly generate compliant report cards at the end of every term.' },
]

const stats = [
  { value: 99, suffix: '%', label: 'Uptime Reliability' },
  { value: 5000, suffix: '+', label: 'Students Learning' },
  { value: 100, suffix: '%', label: 'GES Compliant' },
  { value: 24, suffix: '/7', label: 'Access to Resources' },
]

// ── Top Nav ───────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <nav
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        transition: 'all 0.4s cubic-bezier(.4,0,.2,1)',
        background: scrolled ? 'rgba(255,255,255,0.97)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,0.06)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(0,0,0,0.05)' : '1px solid transparent',
        padding: scrolled ? '12px 0' : '20px 0',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(245,158,11,0.3)',
          }}>
             <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white" opacity="0.95"/>
              <path d="M2 17c0 0 3.5 3 10 3s10-3 10-3" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.7"/>
              <path d="M2 7v10" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.6"/>
              <path d="M12 12v8" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.8"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: scrolled ? '#5b21b6' : '#fcd34d', textTransform: 'uppercase', lineHeight: 1 }}>World</div>
            <div style={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, fontSize: 16, color: scrolled ? '#1e0646' : '#fff', lineHeight: 1.1 }}>Uni-Learn Platform</div>
          </div>
        </div>

        {/* Desktop links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="nav-desktop">
          {['Features', 'About', 'Pillars'].map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(/ /g, '-')}`}
              style={{ fontSize: 14, fontWeight: 500, color: scrolled ? '#1e0646' : '#fff', textDecoration: 'none', transition: 'color 0.2s', opacity: 0.9 }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f59e0b')}
              onMouseLeave={e => (e.currentTarget.style.color = scrolled ? '#1e0646' : '#fff')}
            >{l}</a>
          ))}
          <Link to={ROUTES.LOGIN} style={{
            padding: '10px 24px', borderRadius: 999, fontSize: 14, fontWeight: 700,
            background: '#f59e0b', color: '#1e0646', textDecoration: 'none',
            boxShadow: '0 4px 14px rgba(245,158,11,0.3)',
            transition: 'transform 0.15s, box-shadow 0.15s, background 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(245,158,11,0.4)'; e.currentTarget.style.background = '#fbbf24' }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 14px rgba(245,158,11,0.3)'; e.currentTarget.style.background = '#f59e0b' }}
          >Sign In</Link>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMenuOpen(!menuOpen)} style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', fontSize: 24, color: scrolled ? '#1e0646' : '#fff' }} className="nav-mobile-btn">☰</button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ background: '#fff', borderTop: '1px solid #e2e8f0', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {['Features', 'About', 'Pillars'].map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(/ /g, '-')}`}
              onClick={() => setMenuOpen(false)}
              style={{ fontSize: 15, fontWeight: 500, color: '#1e0646', textDecoration: 'none' }}
            >{l}</a>
          ))}
          <Link to={ROUTES.LOGIN} onClick={() => setMenuOpen(false)}
            style={{ padding: '12px 20px', borderRadius: 8, fontSize: 14, fontWeight: 700, background: '#5b21b6', color: '#fff', textDecoration: 'none', textAlign: 'center' }}
          >Sign In</Link>
        </div>
      )}
    </nav>
  )
}

// ── Hero ──────────────────────────────────────────────────
function Hero() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setTimeout(() => setMounted(true), 100) }, [])

  return (
    <section style={{
      minHeight: '100vh', position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(135deg, rgba(30, 6, 70, 0.7) 0%, rgba(59, 7, 100, 0.75) 40%, rgba(91, 33, 182, 0.8) 100%), url("/kids2.JPG")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Background Decor */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px', opacity: 0.5,
        }} />
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: '40px', width: '100%', zIndex: 10 }}>
        
        {/* Left Copy */}
        <div style={{ flex: 1, opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(30px)', transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)', marginTop: 40 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 999, padding: '6px 16px', marginBottom: 28,
            backdropFilter: 'blur(4px)',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} className="pulse-dot" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#fde68a', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Complete School Ecosystem</span>
          </div>

          <h1 style={{
            fontFamily: '"Playfair Display", serif',
            fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
            fontWeight: 700, color: '#fff', lineHeight: 1.15, marginBottom: 24,
            textShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}>
            School Learning & Management,{' '}
            <span style={{
              background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Reimagined</span>.
          </h1>

          <p style={{
            fontSize: 'clamp(1.05rem, 1.8vw, 1.2rem)', color: 'rgba(237, 233, 254, 0.85)',
            lineHeight: 1.75, marginBottom: 40, maxWidth: 520,
          }}>
            Empower students to learn online, equip staff to track daily lessons seamlessly, 
            and automate all administrative reporting instantly from one place.
          </p>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Link to={ROUTES.LOGIN} style={{
              padding: '16px 36px', borderRadius: 12, fontSize: 16, fontWeight: 700,
              background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
              color: '#1e0646', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8,
              boxShadow: '0 4px 24px rgba(245,158,11,0.4)',
              transition: 'transform 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
            >
              Get Started Now <span style={{ fontSize: 18 }}>→</span>
            </Link>

            <Link to="/register-school" style={{
              padding: '16px 36px', borderRadius: 12, fontSize: 16, fontWeight: 700,
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8,
              backdropFilter: 'blur(10px)',
              transition: 'transform 0.2s, background 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.background = 'rgba(255,255,255,0.2)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
            >
              Register School for Free
            </Link>
          </div>
        </div>

        {/* Right UI Representation */}
        <div className="hero-ui-right" style={{ flex: 1, position: 'relative', height: 500, opacity: mounted ? 1 : 0, transition: 'opacity 1s ease 0.4s' }}>
          
          {/* Main Card (Dashboard/Timetable Demo) */}
          <div style={{ position: 'absolute', top: '10%', right: '5%', width: 380, background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 24px 60px rgba(0,0,0,0.4)', transform: 'rotate(-2.5deg)', zIndex: 2 }} className="animate-float">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#5b21b6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🎓</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1e0646' }}>Kofi Mensah</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Student Portal • Online</div>
                </div>
              </div>
              <div style={{ background: '#fef3c7', color: '#d97706', padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>Active</div>
            </div>

            <h4 style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Today's Live Timetable</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { s: 'Mathematics', time: '08:30 AM', status: 'Live Now', color: '#16a34a', bg: '#f0fdf4' },
                { s: 'English Language', time: '10:15 AM', status: 'Up Next', color: '#f59e0b', bg: '#fffbeb' },
                { s: 'Science Assignment', time: 'Due 1:00 PM', status: 'Pending', color: '#64748b', bg: '#f1f5f9' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 12, border: '1px solid #f1f5f9' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>{item.s}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{item.time}</div>
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: item.color, background: item.bg, padding: '4px 10px', borderRadius: 999 }}>
                    {item.status}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ position: 'absolute', top: '20%', right: '-2%', width: 380, height: 380, background: 'linear-gradient(135deg, rgba(30,6,70,0.9), rgba(91,33,182,0.9))', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, boxShadow: '0 20px 40px rgba(0,0,0,0.2)', transform: 'rotate(5deg)', backdropFilter: 'blur(10px)' }} className="animate-float-delayed" />
        </div>
      </div>

      {/* Scroll indicator */}
      <div style={{
        position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        opacity: mounted ? 0.7 : 0, transition: 'opacity 1s ease 1.2s',
      }} className="animate-bounce">
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Scroll</span>
        <div style={{ width: 14, height: 14, borderRight: '2px solid #f59e0b', borderBottom: '2px solid #f59e0b', transform: 'rotate(45deg)' }} />
      </div>
    </section>
  )
}

// ── Stats ─────────────────────────────────────────────────
function Stats() {
  const { ref, inView } = useInView()
  return (
    <section ref={ref} style={{ background: '#f8f7ff', padding: '64px 24px', marginTop: -40, position: 'relative', zIndex: 20 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, textAlign: 'center' }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            background: '#fff', borderRadius: 20, padding: 32, boxShadow: '0 12px 30px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.03)',
            opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(30px)',
            transition: `all 0.7s cubic-bezier(.4,0,.2,1) ${i * 0.1}s`,
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, background: 'rgba(245,158,11,0.05)', borderRadius: '50%' }} />
            <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, color: '#1e0646', lineHeight: 1, marginBottom: 8, position: 'relative' }}>
              {inView ? <Counter to={s.value} suffix={s.suffix} /> : `0${s.suffix}`}
            </div>
            <div style={{ fontSize: 14, color: '#64748b', fontWeight: 600, position: 'relative' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── Features ──────────────────────────────────────────────
function Features() {
  const { ref, inView } = useInView()
  return (
    <section id="features" ref={ref} style={{ padding: '100px 24px', background: '#f8f7ff' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{
          textAlign: 'center', marginBottom: 64, maxWidth: 660, margin: '0 auto 64px auto',
          opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(24px)',
          transition: 'all 0.7s cubic-bezier(.4,0,.2,1)',
        }}>
          <div style={{ color: '#f59e0b', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Core Features</div>
          <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 700, color: '#1e0646', lineHeight: 1.2, marginBottom: 16 }}>
            The ultimate ecosystem for learners and educators
          </h2>
          <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.6 }}>
             From interactive lesson tracking and real-time student learning, down to instant, automated GES-standard reporting.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32 }}>
          {features.map((f, i) => (
            <FeatureCard key={i} feature={f} index={i} parentInView={inView} />
          ))}
        </div>
      </div>
    </section>
  )
}

function FeatureCard({ feature, index, parentInView }: any) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff', borderRadius: 24, padding: '36px',
        border: '1px solid', borderColor: hovered ? 'rgba(91,33,182,0.1)' : '#f1f5f9',
        boxShadow: hovered ? '0 24px 48px rgba(91,33,182,0.08)' : '0 4px 12px rgba(0,0,0,0.02)',
        transition: 'all 0.5s cubic-bezier(.4,0,.2,1)',
        transform: parentInView ? (hovered ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)') : 'translateY(40px)',
        opacity: parentInView ? 1 : 0,
        transitionDelay: `${index * 0.1}s`,
        position: 'relative', overflow: 'hidden'
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 4, background: hovered ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'transparent', transition: 'background 0.3s' }} />
      <div style={{
        width: 64, height: 64, borderRadius: 20, fontSize: 32,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: hovered ? 'linear-gradient(135deg, #f59e0b, #fbbf24)' : '#f8fafc',
        color: hovered ? '#fff' : '#1e0646',
        marginBottom: 24, transition: 'all 0.5s cubic-bezier(.4,0,.2,1)',
        transform: hovered ? 'rotate(-10deg) scale(1.1)' : 'rotate(0deg) scale(1)',
        boxShadow: hovered ? '0 12px 24px rgba(245,158,11,0.3)' : 'inset 0 2px 4px rgba(0,0,0,0.02)'
      }}>{feature.icon}</div>
      <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1e0646', marginBottom: 14, letterSpacing: '-0.02em' }}>{feature.title}</h3>
      <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.7 }}>{feature.desc}</p>
    </div>
  )
}

// ── How It Works (Platform Pillars) ──────────────────────────────────────────
function Workflow() {
  const { ref, inView } = useInView()
  return (
    <section id="pillars" ref={ref} style={{ padding: '120px 24px', background: '#fff', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 800, height: 800, background: '#f5f3ff', borderRadius: '50%', filter: 'blur(80px)', opacity: 0.6, transform: 'translate(30%, -30%)' }} />
      
      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <div style={{
          textAlign: 'center', marginBottom: 80,
          opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(24px)',
          transition: 'all 0.7s cubic-bezier(.4,0,.2,1)',
        }}>
          <div style={{ color: '#f59e0b', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Platform Pillars</div>
          <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 700, color: '#1e0646', lineHeight: 1.2 }}>
            Four pillars of academic excellence
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 32, position: 'relative' }}>
          <div className="workflow-line" style={{
            position: 'absolute', top: 40, left: '10%', right: '10%', height: 2,
            background: 'linear-gradient(90deg, #ede9fe, #f59e0b, #ede9fe)',
            opacity: inView ? 0.3 : 0, transition: 'opacity 1s ease 0.5s',
          }} />

          {steps.map((s, i) => (
            <div key={i} style={{
              textAlign: 'center', position: 'relative',
              opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(32px)',
              transition: `all 0.7s cubic-bezier(.4,0,.2,1) ${i * 0.15}s`,
            }}>
              <div style={{
                width: 80, height: 80, borderRadius: 24, margin: '0 auto 24px',
                background: 'linear-gradient(135deg, #3b0764, #5b21b6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26, fontFamily: '"Playfair Display",serif', fontWeight: 700, color: '#fff',
                boxShadow: '0 12px 30px rgba(91,33,182,0.2)', position: 'relative', zIndex: 2,
                transition: 'transform 0.3s', cursor: 'default'
              }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1) rotate(5deg)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {s.n}
              </div>
              <h4 style={{ fontSize: 18, fontWeight: 700, color: '#1e0646', marginBottom: 12 }}>{s.title}</h4>
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.65 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── CTA ───────────────────────────────────────────────────
function CTA() {
  const { ref, inView } = useInView()
  return (
    <section ref={ref} style={{ 
      padding: '120px 24px', 
      background: 'linear-gradient(rgba(30, 6, 70, 0.65), rgba(30, 6, 70, 0.85)), url("/kids2.JPG")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      position: 'relative', 
      overflow: 'hidden' 
    }}>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 600, height: 600, background: '#f59e0b', borderRadius: '50%', filter: 'blur(150px)', opacity: 0.15, pointerEvents: 'none' }} className="pulse-dot" />
      
      <div style={{
        maxWidth: 700, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 10,
        opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(32px)',
        transition: 'all 0.9s cubic-bezier(.4,0,.2,1)',
      }}>
        <div style={{ fontSize: 60, marginBottom: 24 }}>🚀</div>
        <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 700, color: '#fff', lineHeight: 1.15, marginBottom: 24 }}>
          Ready to digitalize your entire school?
        </h2>
        <p style={{ fontSize: 17, color: 'rgba(237, 233, 254, 0.8)', lineHeight: 1.75, marginBottom: 40 }}>
          Bring your students, teachers, and administration onto one seamless, powerful learning and management platform today.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to={ROUTES.LOGIN} style={{
            padding: '18px 48px', borderRadius: 999, fontSize: 18, fontWeight: 700,
            background: '#f59e0b', color: '#1e0646', textDecoration: 'none', display: 'inline-block',
            boxShadow: '0 4px 30px rgba(245,158,11,0.3)', transition: 'transform 0.2s, background 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.background = '#fbbf24' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = '#f59e0b' }}
          >Sign In to Portal</Link>

          <Link to="/register-school" style={{
            padding: '18px 48px', borderRadius: 999, fontSize: 18, fontWeight: 700,
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)',
            color: '#fff', textDecoration: 'none', display: 'inline-block',
            backdropFilter: 'blur(10px)',
            transition: 'transform 0.2s, background 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.background = 'rgba(255,255,255,0.2)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
          >Register School for Free</Link>
        </div>
      </div>
    </section>
  )
}

// ── Footer ────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ background: '#0a0118', paddingTop: 100, paddingBottom: 40, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '48px 32px', marginBottom: 80 }}>
          
          {/* Brand Column */}
          <div style={{ gridColumn: '1 / -1', maxWidth: 340, marginBottom: 20, '@media(minWidth: 1024px)': { gridColumn: 'span 2' } } as any}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fff', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                <img src="/wula.png" alt="WULA" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <div>
                 <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: '#fcd34d', textTransform: 'uppercase', lineHeight: 1, marginBottom: 4 }}>World</div>
                 <div style={{ fontFamily: '"Playfair Display",serif', fontWeight: 700, fontSize: 20, color: '#fff', lineHeight: 1 }}>Uni-Learn</div>
              </div>
            </div>
            <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.8, marginBottom: 32 }}>
              The enterprise-grade school management and digital learning ecosystem tailored specifically for modern Ghanaian education.
            </p>
            {/* Social Icons Placeholder */}
            <div style={{ display: 'flex', gap: 16 }}>
               {[1,2,3,4].map(i => (
                 <a key={i} href="#" style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', transition: 'all 0.2s', border: '1px solid rgba(255,255,255,0.1)' }}
                   onMouseEnter={e => { e.currentTarget.style.background = '#f59e0b'; e.currentTarget.style.color = '#1e0646'; e.currentTarget.style.borderColor = '#f59e0b' }}
                   onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
                 >
                   <div style={{ width: 14, height: 14, background: 'currentColor', borderRadius: 2 }} /> {/* Placeholder for SVGs */}
                 </a>
               ))}
            </div>
          </div>
          
          {/* Product Column */}
          <div>
            <h4 style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 28, letterSpacing: '0.02em' }}>Platform Features</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {['Dynamic Billing Engine', 'Automated Grade Processing', 'Smart SMS Notifications', 'Intelligent Command Center', 'Interactive Student Portal', 'Real-time Analytics'].map((l) => (
                <a key={l} href="#features" style={{ fontSize: 14, color: '#94a3b8', textDecoration: 'none', transition: 'all 0.2s', fontWeight: 500 }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#f59e0b'; e.currentTarget.style.transform = 'translateX(4px)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.transform = 'translateX(0)' }}
                >{l}</a>
              ))}
            </div>
          </div>
          
          {/* Solutions Column */}
          <div>
            <h4 style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 28, letterSpacing: '0.02em' }}>Target Roles</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
               {['For School Administrators', 'For Bursars & Finance', 'For Educators', 'For Students & Parents', 'Super Admin Network'].map(l => (
                <a key={l} href="#" style={{ fontSize: 14, color: '#94a3b8', textDecoration: 'none', transition: 'all 0.2s', fontWeight: 500 }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#f59e0b'; e.currentTarget.style.transform = 'translateX(4px)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.transform = 'translateX(0)' }}
                >{l}</a>
              ))}
            </div>
          </div>

          {/* Company Column */}
          <div>
            <h4 style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 28, letterSpacing: '0.02em' }}>Company</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
               {['About WULA', 'Register Your School', 'Contact Support', 'Privacy Policy', 'Terms of Service'].map(l => (
                <a key={l} href={l === 'Register Your School' ? '/register-school' : '#'} style={{ fontSize: 14, color: '#94a3b8', textDecoration: 'none', transition: 'all 0.2s', fontWeight: 500 }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#f59e0b'; e.currentTarget.style.transform = 'translateX(4px)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.transform = 'translateX(0)' }}
                >{l}</a>
              ))}
            </div>
          </div>

        </div>
        
        {/* Bottom Bar */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
             {/* System Status Indicator */}
             <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'background 0.2s' }}
               onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
               onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
             >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 12px #10b981', animation: 'pulse-slow 2s infinite' }} />
                <span style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 600 }}>All systems operational</span>
             </div>
          </div>

          <p style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>
            © {new Date().getFullYear()} World Uni-Learn Platform. <span style={{ color: '#94a3b8' }}>Built for Ghana.</span>
          </p>

          <div style={{ display: 'flex', gap: 24, fontSize: 13, color: '#64748b', fontWeight: 600 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ color: '#10b981' }}>✓</span> GES Compliant</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ color: '#3b82f6' }}>🔒</span> 256-bit Secure</span>
          </div>
        </div>

      </div>
    </footer>
  )
}

// ── Main Export ───────────────────────────────────────────
export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', fontFamily: '"DM Sans", sans-serif', background: '#f8f7ff', overflowX: 'hidden' }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        
        /* Background Animations */
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(-2.5deg); }
          50% { transform: translateY(-16px) rotate(1deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(5deg); }
          50% { transform: translateY(12px) rotate(2deg); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.25; transform: scale(1.05); }
        }
        @keyframes drift {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(30px, 20px) scale(1.1); }
        }
        
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 7s ease-in-out infinite; }
        .pulse-dot { animation: pulse-slow 3s ease-in-out infinite; }
        
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          animation: drift 10s ease-in-out infinite alternate;
        }
        .orb-1 { width: 500px; height: 500px; background: rgba(245,158,11,0.08); top: -100px; right: 10%; }
        .orb-2 { width: 400px; height: 400px; background: rgba(139,92,246,0.15); bottom: 10%; left: 5%; animation-delay: -3s; }

        @media (max-width: 900px) {
          .hero-ui-right { display: none !important; }
        }
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-mobile-btn { display: block !important; }
          .workflow-line { display: none !important; }
        }
      `}</style>
      
      <Navbar />
      <Hero />
      <Stats />
      <Features />
      <Workflow />
      <CTA />
      <Footer />
    </div>
  )
}