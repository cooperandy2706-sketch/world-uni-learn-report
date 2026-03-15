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
    icon: '📊',
    title: 'Smart Score Entry',
    desc: 'Teachers enter class and exam scores with instant grade calculation. No manual arithmetic — ever.',
    color: '#0f4c81',
  },
  {
    icon: '📄',
    title: 'GES-Standard Reports',
    desc: 'Generate print-ready report cards that meet Ghana Education Service standards, in one click.',
    color: '#f59e0b',
  },
  {
    icon: '🏫',
    title: 'Multi-Class Management',
    desc: 'Manage unlimited classes, departments, subjects, and teachers from a single admin dashboard.',
    color: '#16a34a',
  },
  {
    icon: '📈',
    title: 'Performance Analytics',
    desc: 'Visual insights into class averages, grade distributions, and individual student progress over time.',
    color: '#7c3aed',
  },
  {
    icon: '🔒',
    title: 'Role-Based Access',
    desc: 'Admins configure. Teachers submit. Reports are locked and approved. Full audit trail built in.',
    color: '#dc2626',
  },
  {
    icon: '📥',
    title: 'Bulk Import & Export',
    desc: 'Upload students via Excel or CSV. Export report cards as PDF for printing or digital sharing.',
    color: '#0891b2',
  },
]

const steps = [
  { n: '01', title: 'Admin Setup', desc: 'Configure school, classes, subjects, teachers, and academic year.' },
  { n: '02', title: 'Score Entry', desc: 'Teachers log in and enter class scores (50%) and exam scores (50%).' },
  { n: '03', title: 'Auto Calculate', desc: 'System calculates totals, grades (A–F), and class positions instantly.' },
  { n: '04', title: 'Generate Reports', desc: 'Admin approves and generates printable GES report cards for the whole class.' },
]

const stats = [
  { value: 500, suffix: '+', label: 'Schools Ready' },
  { value: 50000, suffix: '+', label: 'Students Managed' },
  { value: 99, suffix: '%', label: 'Accuracy Rate' },
  { value: 3, suffix: 'sec', label: 'Report Generation' },
]

// ── Nav ───────────────────────────────────────────────────
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
        boxShadow: scrolled ? '0 1px 24px rgba(15,76,129,0.08)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(226,232,240,0.8)' : '1px solid transparent',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #0f4c81, #1a6bb5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, boxShadow: '0 4px 12px rgba(15,76,129,0.3)',
          }}>📘</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#64748b', textTransform: 'uppercase', lineHeight: 1 }}>World</div>
            <div style={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, fontSize: 15, color: '#0f172a', lineHeight: 1.1 }}>Uni-Learn Report</div>
          </div>
        </div>

        {/* Desktop links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="nav-desktop">
          {['Features', 'About', 'How It Works'].map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(/ /g, '-')}`}
              style={{ fontSize: 14, fontWeight: 500, color: scrolled ? '#334155' : '#fff', textDecoration: 'none', transition: 'color 0.2s', opacity: 0.9 }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '0.9')}
            >{l}</a>
          ))}
          <Link to={ROUTES.LOGIN} style={{
            padding: '8px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600,
            background: 'linear-gradient(135deg, #0f4c81, #1a6bb5)',
            color: '#fff', textDecoration: 'none',
            boxShadow: '0 2px 8px rgba(15,76,129,0.25)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(15,76,129,0.35)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 8px rgba(15,76,129,0.25)' }}
          >Sign In →</Link>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMenuOpen(!menuOpen)} style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: scrolled ? '#0f172a' : '#fff' }} className="nav-mobile-btn">☰</button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ background: '#fff', borderTop: '1px solid #e2e8f0', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {['Features', 'About', 'How It Works'].map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(/ /g, '-')}`}
              onClick={() => setMenuOpen(false)}
              style={{ fontSize: 15, fontWeight: 500, color: '#334155', textDecoration: 'none' }}
            >{l}</a>
          ))}
          <Link to={ROUTES.LOGIN} onClick={() => setMenuOpen(false)}
            style={{ padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, background: '#0f4c81', color: '#fff', textDecoration: 'none', textAlign: 'center' }}
          >Sign In →</Link>
        </div>
      )}
    </nav>
  )
}

// ── Hero ──────────────────────────────────────────────────
function Hero() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setTimeout(() => setMounted(true), 80) }, [])

  return (
    <section style={{
      minHeight: '100vh', position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(145deg, #071e38 0%, #0f4c81 45%, #1a6bb5 75%, #093660 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Animated background orbs */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        {/* Grid lines */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
        {/* Diagonal accent */}
        <div style={{
          position: 'absolute', top: '-20%', right: '-10%',
          width: '60%', height: '120%',
          background: 'linear-gradient(135deg, transparent 40%, rgba(245,158,11,0.06) 100%)',
          transform: 'skewX(-12deg)',
        }} />
      </div>

      {/* Floating report card mockup */}
      <div className="float-card" style={{
        position: 'absolute', right: '5%', top: '50%', transform: 'translateY(-50%)',
        opacity: mounted ? 1 : 0, transition: 'opacity 1s ease 0.6s',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <div className="mock-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#0f4c81,#1a6bb5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>📘</div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>World Uni-Learn</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>Student Report Card</div>
            </div>
          </div>
          <div style={{ fontSize: 10, color: '#64748b', marginBottom: 8 }}>Kofi Mensah · Class 6A · Term 1 · 2024/2025</div>
          {[
            { s: 'Mathematics', cs: 44, es: 42, g: 'A' },
            { s: 'English Language', cs: 40, es: 38, g: 'B' },
            { s: 'Science', cs: 42, es: 41, g: 'A' },
            { s: 'Social Studies', cs: 38, es: 35, g: 'B' },
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ flex: 1, fontSize: 10, color: '#334155', fontWeight: 500 }}>{r.s}</div>
              <div style={{ fontSize: 10, color: '#64748b', width: 20, textAlign: 'center' }}>{r.cs}</div>
              <div style={{ fontSize: 10, color: '#64748b', width: 20, textAlign: 'center' }}>{r.es}</div>
              <div style={{ fontSize: 10, color: '#64748b', width: 24, textAlign: 'center' }}>{r.cs + r.es}</div>
              <div style={{
                fontSize: 9, fontWeight: 700, width: 20, textAlign: 'center',
                color: r.g === 'A' ? '#16a34a' : '#2563eb',
                background: r.g === 'A' ? '#f0fdf4' : '#eff6ff',
                borderRadius: 4, padding: '1px 4px',
              }}>{r.g}</div>
            </div>
          ))}
          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
            <span style={{ color: '#64748b' }}>Average: <strong style={{ color: '#0f4c81' }}>86.25</strong></span>
            <span style={{ color: '#64748b' }}>Position: <strong style={{ color: '#f59e0b' }}>2nd</strong></span>
          </div>
        </div>
        {/* Second card peek */}
        <div className="mock-card-2" />
      </div>

      {/* Hero content */}
      <div style={{ position: 'relative', zIndex: 10, maxWidth: 680, padding: '0 24px', textAlign: 'center', marginTop: -20 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 999, padding: '6px 16px', marginBottom: 28,
          opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(12px)',
          transition: 'all 0.7s cubic-bezier(.4,0,.2,1) 0.1s',
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} className="pulse-dot" />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#fbbf24', letterSpacing: '0.05em' }}>GES-Standard · Ghana Education Service</span>
        </div>

        <h1 style={{
          fontFamily: '"Playfair Display", serif',
          fontSize: 'clamp(2.4rem, 6vw, 4rem)',
          fontWeight: 700, color: '#fff', lineHeight: 1.15, marginBottom: 20,
          opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.8s cubic-bezier(.4,0,.2,1) 0.25s',
        }}>
          Academic Reports,{' '}
          <span style={{
            background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Reimagined</span>{' '}
          for Ghana's Schools
        </h1>

        <p style={{
          fontSize: 'clamp(1rem, 2vw, 1.15rem)', color: 'rgba(255,255,255,0.72)',
          lineHeight: 1.75, marginBottom: 40, maxWidth: 560, margin: '0 auto 40px',
          opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.8s cubic-bezier(.4,0,.2,1) 0.4s',
        }}>
          The modern report card management system built specifically for Ghanaian schools.
          Automate scoring, generate GES-compliant reports, and track every student's progress — all in one place.
        </p>

        <div style={{
          display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap',
          opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.8s cubic-bezier(.4,0,.2,1) 0.55s',
        }}>
          <Link to={ROUTES.LOGIN} className="btn-hero-primary">
            Get Started Free
            <span style={{ marginLeft: 6, fontSize: 16 }}>→</span>
          </Link>
          <a href="#how-it-works" className="btn-hero-secondary">
            See How It Works
          </a>
        </div>

        {/* Trust badges */}
        <div style={{
          display: 'flex', gap: 24, justifyContent: 'center', marginTop: 48, flexWrap: 'wrap',
          opacity: mounted ? 1 : 0, transition: 'opacity 0.8s ease 0.8s',
        }}>
          {['✓ GES Compliant', '✓ Secure & Private', '✓ No Setup Fees'].map(b => (
            <span key={b} style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>{b}</span>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div style={{
        position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        opacity: mounted ? 0.6 : 0, transition: 'opacity 1s ease 1.2s',
      }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Scroll</span>
        <div className="scroll-chevron" />
      </div>
    </section>
  )
}

// ── Stats ─────────────────────────────────────────────────
function Stats() {
  const { ref, inView } = useInView()
  return (
    <section ref={ref} style={{ background: '#0f4c81', padding: '64px 24px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 40, textAlign: 'center' }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(24px)',
            transition: `all 0.7s cubic-bezier(.4,0,.2,1) ${i * 0.1}s`,
          }}>
            <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 700, color: '#fff', lineHeight: 1 }}>
              {inView ? <Counter to={s.value} suffix={s.suffix} /> : `0${s.suffix}`}
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 6, fontWeight: 500 }}>{s.label}</div>
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
    <section id="features" ref={ref} style={{ padding: '100px 24px', background: '#f8fafc' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{
          textAlign: 'center', marginBottom: 64,
          opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(24px)',
          transition: 'all 0.7s cubic-bezier(.4,0,.2,1)',
        }}>
          <div style={{ display: 'inline-block', background: '#e0f0ff', borderRadius: 999, padding: '5px 16px', fontSize: 12, fontWeight: 700, color: '#0f4c81', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Features</div>
          <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
            Everything your school needs,<br />nothing you don't
          </h2>
          <p style={{ fontSize: 16, color: '#64748b', marginTop: 14, maxWidth: 520, margin: '14px auto 0' }}>
            Purpose-built for Ghanaian schools, designed to make academic reporting fast, accurate, and effortless.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {features.map((f, i) => (
            <FeatureCard key={i} feature={f} index={i} parentInView={inView} />
          ))}
        </div>
      </div>
    </section>
  )
}

function FeatureCard({ feature, index, parentInView }: { feature: typeof features[0]; index: number; parentInView: boolean }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff', borderRadius: 16, padding: '28px 28px 24px',
        border: '1px solid', borderColor: hovered ? feature.color + '40' : '#e2e8f0',
        boxShadow: hovered ? `0 12px 40px ${feature.color}18` : '0 1px 4px rgba(0,0,0,0.05)',
        transition: 'all 0.3s cubic-bezier(.4,0,.2,1)',
        transform: parentInView ? (hovered ? 'translateY(-4px)' : 'translateY(0)') : 'translateY(28px)',
        opacity: parentInView ? 1 : 0,
        transitionDelay: `${index * 0.08}s`,
        cursor: 'default',
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 12, fontSize: 22,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: feature.color + '12', marginBottom: 16,
        transition: 'transform 0.3s',
        transform: hovered ? 'scale(1.1) rotate(-4deg)' : 'scale(1)',
      }}>{feature.icon}</div>
      <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{feature.title}</h3>
      <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.65 }}>{feature.desc}</p>
      <div style={{
        marginTop: 16, display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 13, fontWeight: 600, color: feature.color,
        opacity: hovered ? 1 : 0, transform: hovered ? 'translateX(0)' : 'translateX(-8px)',
        transition: 'all 0.25s ease',
      }}>Learn more <span>→</span></div>
    </div>
  )
}

// ── About ─────────────────────────────────────────────────
function About() {
  const { ref, inView } = useInView()
  return (
    <section id="about" ref={ref} style={{ padding: '100px 24px', background: '#fff', overflow: 'hidden' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 72, alignItems: 'center' }}>

        {/* Left: visual */}
        <div style={{
          opacity: inView ? 1 : 0, transform: inView ? 'translateX(0)' : 'translateX(-40px)',
          transition: 'all 0.9s cubic-bezier(.4,0,.2,1)',
          position: 'relative',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #0f4c81, #1a6bb5)',
            borderRadius: 24, padding: 32, position: 'relative', overflow: 'hidden',
          }}>
            {/* Background pattern */}
            <div style={{
              position: 'absolute', inset: 0, opacity: 0.07,
              backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 4, fontWeight: 500 }}>Academic Year 2024/2025 · Term 1</div>
              <div style={{ fontSize: 18, fontFamily: '"Playfair Display",serif', color: '#fff', fontWeight: 700, marginBottom: 20 }}>Class 6A Performance Summary</div>
              {[
                { label: 'Mathematics', pct: 88, grade: 'A' },
                { label: 'English Language', pct: 74, grade: 'B' },
                { label: 'Science', pct: 82, grade: 'A' },
                { label: 'Social Studies', pct: 67, grade: 'C' },
                { label: 'ICT', pct: 91, grade: 'A' },
              ].map((item, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{item.label}</span>
                    <span style={{ fontSize: 12, color: '#fbbf24', fontWeight: 700 }}>{item.grade} · {item.pct}%</span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 999,
                      background: item.pct >= 80 ? '#22c55e' : item.pct >= 70 ? '#3b82f6' : '#f59e0b',
                      width: inView ? `${item.pct}%` : '0%',
                      transition: `width 1s cubic-bezier(.4,0,.2,1) ${0.4 + i * 0.1}s`,
                    }} />
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 20, display: 'flex', gap: 16 }}>
                {[{ v: '30', l: 'Students' }, { v: '80.4%', l: 'Class Avg' }, { v: '93%', l: 'Pass Rate' }].map((s, i) => (
                  <div key={i} style={{ flex: 1, background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{s.v}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Floating badge */}
          <div style={{
            position: 'absolute', bottom: -16, right: -16,
            background: '#fff', borderRadius: 14, padding: '12px 16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>✅</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Reports Approved</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>30 of 30 students</div>
            </div>
          </div>
        </div>

        {/* Right: text */}
        <div style={{
          opacity: inView ? 1 : 0, transform: inView ? 'translateX(0)' : 'translateX(40px)',
          transition: 'all 0.9s cubic-bezier(.4,0,.2,1) 0.15s',
        }}>
          <div style={{ display: 'inline-block', background: '#e0f0ff', borderRadius: 999, padding: '5px 16px', fontSize: 12, fontWeight: 700, color: '#0f4c81', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>About</div>
          <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 700, color: '#0f172a', lineHeight: 1.2, marginBottom: 16 }}>
            Built for the Ghanaian classroom
          </h2>
          <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.8, marginBottom: 16 }}>
            World Uni-Learn Report was designed from the ground up to match the <strong style={{ color: '#0f4c81' }}>Ghana Education Service (GES)</strong> grading system and report card standards — not adapted from a foreign platform.
          </p>
          <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.8, marginBottom: 28 }}>
            We understand the reality of Ghanaian schools: teachers manage large classes, term pressure is real, and accuracy is non-negotiable. Our system removes the manual work so educators can focus on what matters — teaching.
          </p>
          {[
            'Class Score (50%) + Exam Score (50%) auto-calculated',
            'Grades A–F with GES interpretation labels',
            'Class position, subject ranking, and averages',
            'Headteacher & teacher remarks built in',
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10,
              opacity: inView ? 1 : 0, transform: inView ? 'translateX(0)' : 'translateX(16px)',
              transition: `all 0.6s ease ${0.4 + i * 0.1}s`,
            }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#0f4c81', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', flexShrink: 0, marginTop: 2 }}>✓</div>
              <span style={{ fontSize: 14, color: '#334155', lineHeight: 1.5 }}>{item}</span>
            </div>
          ))}
          <Link to={ROUTES.LOGIN} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 28,
            padding: '12px 28px', borderRadius: 10, fontSize: 15, fontWeight: 600,
            background: 'linear-gradient(135deg, #0f4c81, #1a6bb5)',
            color: '#fff', textDecoration: 'none',
            boxShadow: '0 4px 16px rgba(15,76,129,0.25)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(15,76,129,0.35)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 16px rgba(15,76,129,0.25)' }}
          >Start Using Free →</Link>
        </div>
      </div>
    </section>
  )
}

// ── How It Works ──────────────────────────────────────────
function HowItWorks() {
  const { ref, inView } = useInView()
  return (
    <section id="how-it-works" ref={ref} style={{ padding: '100px 24px', background: '#f8fafc' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{
          textAlign: 'center', marginBottom: 64,
          opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(24px)',
          transition: 'all 0.7s cubic-bezier(.4,0,.2,1)',
        }}>
          <div style={{ display: 'inline-block', background: '#fef3c7', borderRadius: 999, padding: '5px 16px', fontSize: 12, fontWeight: 700, color: '#92400e', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Workflow</div>
          <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
            From setup to report card in 4 steps
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 0, position: 'relative' }}>
          {/* Connector line */}
          <div style={{
            position: 'absolute', top: 40, left: '12%', right: '12%', height: 2,
            background: 'linear-gradient(90deg, #0f4c81, #f59e0b)',
            opacity: inView ? 0.2 : 0, transition: 'opacity 1s ease 0.5s',
          }} className="connector-hide-mobile" />

          {steps.map((s, i) => (
            <div key={i} style={{
              textAlign: 'center', padding: '0 16px',
              opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(32px)',
              transition: `all 0.7s cubic-bezier(.4,0,.2,1) ${i * 0.15}s`,
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%', margin: '0 auto 20px',
                background: i % 2 === 0
                  ? 'linear-gradient(135deg, #0f4c81, #1a6bb5)'
                  : 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, fontFamily: '"Playfair Display",serif', fontWeight: 700, color: '#fff',
                boxShadow: i % 2 === 0 ? '0 8px 24px rgba(15,76,129,0.3)' : '0 8px 24px rgba(245,158,11,0.3)',
                position: 'relative', zIndex: 1,
              }}>{s.n}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{s.title}</h3>
              <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.65 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Grading Table ─────────────────────────────────────────
function GradingTable() {
  const { ref, inView } = useInView()
  const rows = [
    { range: '80 – 100', grade: 'A', label: 'Excellent', color: '#16a34a', bg: '#f0fdf4' },
    { range: '70 – 79',  grade: 'B', label: 'Very Good', color: '#2563eb', bg: '#eff6ff' },
    { range: '60 – 69',  grade: 'C', label: 'Good',      color: '#7c3aed', bg: '#f5f3ff' },
    { range: '50 – 59',  grade: 'D', label: 'Credit',    color: '#d97706', bg: '#fffbeb' },
    { range: '40 – 49',  grade: 'E', label: 'Pass',      color: '#ea580c', bg: '#fff7ed' },
    { range: '0 – 39',   grade: 'F', label: 'Fail',      color: '#dc2626', bg: '#fef2f2' },
  ]
  return (
    <section ref={ref} style={{ padding: '80px 24px', background: '#fff' }}>
      <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
        <div style={{
          opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(24px)',
          transition: 'all 0.7s ease',
        }}>
          <div style={{ display: 'inline-block', background: '#e0f0ff', borderRadius: 999, padding: '5px 16px', fontSize: 12, fontWeight: 700, color: '#0f4c81', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>GES Grading Scale</div>
          <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 700, color: '#0f172a', marginBottom: 32 }}>
            Automatic grade calculation, built-in
          </h2>
        </div>
        <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr', background: '#0f4c81', padding: '12px 24px' }}>
            {['Score Range', 'Grade', 'Interpretation'].map(h => (
              <div key={h} style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>
            ))}
          </div>
          {rows.map((r, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1fr 80px 1fr',
              padding: '14px 24px', background: i % 2 === 0 ? '#fff' : '#f8fafc',
              borderTop: '1px solid #f1f5f9',
              opacity: inView ? 1 : 0, transform: inView ? 'translateX(0)' : 'translateX(-16px)',
              transition: `all 0.5s ease ${0.2 + i * 0.07}s`,
            }}>
              <span style={{ fontSize: 14, color: '#334155', fontWeight: 500 }}>{r.range}</span>
              <span style={{
                fontSize: 15, fontWeight: 800, color: r.color,
                background: r.bg, borderRadius: 6, padding: '2px 8px',
                display: 'inline-block', textAlign: 'center', width: 'fit-content',
              }}>{r.grade}</span>
              <span style={{ fontSize: 14, color: '#64748b' }}>{r.label}</span>
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
    <section ref={ref} style={{ padding: '100px 24px', background: '#071e38', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '20%', left: '10%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(245,158,11,0.06)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(15,76,129,0.2)', filter: 'blur(80px)' }} />
      </div>
      <div style={{
        maxWidth: 680, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1,
        opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(32px)',
        transition: 'all 0.9s cubic-bezier(.4,0,.2,1)',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📘</div>
        <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, color: '#fff', lineHeight: 1.2, marginBottom: 16 }}>
          Ready to modernise your school's reporting?
        </h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', lineHeight: 1.75, marginBottom: 40 }}>
          Join hundreds of Ghanaian schools already using World Uni-Learn Report to save time, reduce errors, and deliver professional report cards every term.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to={ROUTES.LOGIN} style={{
            padding: '14px 36px', borderRadius: 10, fontSize: 16, fontWeight: 700,
            background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
            color: '#0f172a', textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(245,158,11,0.35)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(245,158,11,0.45)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 20px rgba(245,158,11,0.35)' }}
          >Get Started Free →</Link>
          <a href="#features" style={{
            padding: '14px 36px', borderRadius: 10, fontSize: 16, fontWeight: 600,
            background: 'rgba(255,255,255,0.08)', color: '#fff', textDecoration: 'none',
            border: '1px solid rgba(255,255,255,0.15)',
            transition: 'background 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
          >Explore Features</a>
        </div>
      </div>
    </section>
  )
}

// ── Footer ────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ background: '#040d18', padding: '48px 24px 32px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 32, marginBottom: 40 }}>
          <div style={{ maxWidth: 280 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#0f4c81,#1a6bb5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📘</div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#475569', textTransform: 'uppercase' }}>World</div>
                <div style={{ fontFamily: '"Playfair Display",serif', fontWeight: 700, fontSize: 14, color: '#fff' }}>Uni-Learn Report</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.7 }}>
              GES-standard academic report card management for Ghanaian schools. Modern, accurate, and effortless.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 64, flexWrap: 'wrap' }}>
            {[
              { title: 'Product', links: ['Features', 'How It Works', 'GES Standards', 'Pricing'] },
              { title: 'Support', links: ['Documentation', 'Contact Us', 'FAQs', 'Training'] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>{col.title}</div>
                {col.links.map(l => (
                  <div key={l} style={{ marginBottom: 8 }}>
                    <a href="#" style={{ fontSize: 13, color: '#475569', textDecoration: 'none', transition: 'color 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
                    >{l}</a>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 12, color: '#334155' }}>© 2025 World Uni-Learn Report. Built for Ghana's schools.</p>
          <p style={{ fontSize: 12, color: '#334155' }}>GES Compliant · Secure · Privacy First</p>
        </div>
      </div>
    </footer>
  )
}

// ── Main Export ───────────────────────────────────────────
export default function LandingPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { font-family: 'DM Sans', sans-serif; }

        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          animation: drift 12s ease-in-out infinite alternate;
        }
        .orb-1 { width: 500px; height: 500px; background: rgba(245,158,11,0.07); top: -100px; right: 10%; animation-delay: 0s; }
        .orb-2 { width: 400px; height: 400px; background: rgba(26,107,181,0.12); bottom: 10%; left: 5%; animation-delay: -4s; }
        .orb-3 { width: 300px; height: 300px; background: rgba(255,255,255,0.04); top: 40%; left: 30%; animation-delay: -8s; }
        @keyframes drift {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(40px, 30px) scale(1.1); }
        }

        .mock-card {
          background: #fff;
          border-radius: 14px;
          padding: 20px;
          width: 300px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.2);
          border: 1px solid rgba(255,255,255,0.9);
          animation: floatCard 5s ease-in-out infinite;
        }
        .mock-card-2 {
          background: rgba(255,255,255,0.15);
          border-radius: 14px;
          height: 12px;
          width: 275px;
          margin: 0 auto;
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255,255,255,0.2);
          animation: floatCard 5s ease-in-out infinite;
          animation-delay: 0.15s;
        }
        @keyframes floatCard {
          0%, 100% { transform: translateY(0px) rotate(-1deg); }
          50%       { transform: translateY(-12px) rotate(0.5deg); }
        }

        .float-card { animation: none; }
        @media (max-width: 900px) { .float-card { display: none !important; } }
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-mobile-btn { display: flex !important; }
          section > div[style*='grid-template-columns: 1fr 1fr'] {
            grid-template-columns: 1fr !important;
          }
          .connector-hide-mobile { display: none; }
        }

        .pulse-dot {
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.8); }
        }

        .btn-hero-primary {
          display: inline-flex;
          align-items: center;
          padding: 14px 32px;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          background: linear-gradient(135deg, #f59e0b, #fbbf24);
          color: #0f172a;
          text-decoration: none;
          box-shadow: 0 4px 20px rgba(245,158,11,0.4);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn-hero-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(245,158,11,0.5);
        }
        .btn-hero-secondary {
          display: inline-flex;
          align-items: center;
          padding: 14px 32px;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          background: rgba(255,255,255,0.1);
          color: #fff;
          text-decoration: none;
          border: 1px solid rgba(255,255,255,0.2);
          backdrop-filter: blur(8px);
          transition: background 0.2s, transform 0.2s;
        }
        .btn-hero-secondary:hover {
          background: rgba(255,255,255,0.18);
          transform: translateY(-2px);
        }

        .scroll-chevron {
          width: 18px; height: 18px;
          border-right: 2px solid rgba(255,255,255,0.4);
          border-bottom: 2px solid rgba(255,255,255,0.4);
          transform: rotate(45deg);
          animation: bounceDown 1.5s ease-in-out infinite;
        }
        @keyframes bounceDown {
          0%, 100% { transform: rotate(45deg) translateY(0); }
          50%       { transform: rotate(45deg) translateY(5px); }
        }
      `}</style>
      <Navbar />
      <Hero />
      <Stats />
      <Features />
      <About />
      <HowItWorks />
      <GradingTable />
      <CTA />
      <Footer />
    </>
  )
}