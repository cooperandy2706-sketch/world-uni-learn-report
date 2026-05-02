import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { 
  ArrowRight, 
  Command, 
  Calculator, 
  Smartphone, 
  GraduationCap, 
  LayoutDashboard, 
  Gamepad2, 
  Menu, 
  X, 
  ShieldCheck,
  CheckCircle2,
  Building2,
  ChevronRight
} from 'lucide-react';

// --- Utility Hooks ---
function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        // Keep observing if we want it to trigger again, or unobserve for once-only
        // obs.unobserve(el); 
      }
    }, { threshold, rootMargin: "0px 0px -50px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function AnimatedCounter({ end, suffix = '' }: { end: number, suffix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView(0.5);

  useEffect(() => {
    if (!inView) return;
    let startTimestamp: number | null = null;
    const duration = 2000;
    
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(easeProgress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [inView, end]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// --- Data ---
const FEATURES = [
  { icon: Command, color: '#6366f1', title: 'Command Palette (⌘K)', desc: 'Navigate instantly with natural language search. Jump anywhere in a keystroke.' },
  { icon: Calculator, color: '#10b981', title: 'Dynamic Billing Engine', desc: 'Seamlessly manage term fees, arrears, and daily collections with automated precision.' },
  { icon: Smartphone, color: '#f59e0b', title: 'Smart SMS Hub', desc: 'Blast automated report cards and fee reminders directly to parents’ phones.' },
  { icon: GraduationCap, color: '#8b5cf6', title: 'Automated BECE Grading', desc: 'Instant CA calculations, grade tallying, and GES-compliant report generation.' },
  { icon: LayoutDashboard, color: '#ec4899', title: 'Isolated Role Portals', desc: 'Tailored, secure dashboards for every role: Admins, Teachers, Bursars, and Students.' },
  { icon: Gamepad2, color: '#0ea5e9', title: 'Interactive Hub', desc: 'Keep students engaged with built-in educational games and live election voting.' },
];

const PILLARS = [
  { num: '01', title: 'Administration', desc: 'Deploy academic years, assign staff, and oversee the entire institution securely.' },
  { num: '02', title: 'Teaching', desc: 'Log in daily to track lessons, attendance, and continuous assessment effortlessly.' },
  { num: '03', title: 'Learning', desc: 'Students access digital vaults, complete assignments, and track their own progress.' },
  { num: '04', title: 'Reporting', desc: 'Generate flawless, automated report cards at the end of every term instantly.' },
];

const STATS = [
  { value: 99, suffix: '%', label: 'Uptime Reliability' },
  { value: 5000, suffix: '+', label: 'Active Students' },
  { value: 100, suffix: '%', label: 'GES Compliant' },
  { value: 24, suffix: '/7', label: 'System Access' },
];

// --- Components ---

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      background: scrolled ? 'rgba(255, 255, 255, 0.95)' : 'transparent',
      backdropFilter: scrolled ? 'blur(16px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(0,0,0,0.05)' : '1px solid transparent',
      padding: scrolled ? '12px 0' : '24px 0',
      boxShadow: scrolled ? '0 4px 30px rgba(0,0,0,0.03)' : 'none'
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }} className="nav-logo-group">
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(79, 70, 229, 0.15)',
            transition: 'transform 0.3s ease',
            padding: 4
          }} className="nav-logo-icon">
            <img src="/wula.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', color: scrolled ? '#4f46e5' : '#a5b4fc', textTransform: 'uppercase', lineHeight: 1, marginBottom: 4 }}>World</div>
            <div style={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, fontSize: 18, color: scrolled ? '#0f172a' : '#fff', lineHeight: 1 }}>Uni-Learn</div>
          </div>
        </Link>

        {/* Desktop Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 40 }} className="nav-desktop">
          {['Features', 'Pillars', 'Stats'].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`} style={{
              fontSize: 14, fontWeight: 600, textDecoration: 'none',
              color: scrolled ? '#475569' : 'rgba(255,255,255,0.8)',
              transition: 'color 0.2s'
            }} className="nav-link">{item}</a>
          ))}
        </div>

        {/* Desktop Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }} className="nav-desktop">
          <Link to={ROUTES.LOGIN} style={{
            fontSize: 14, fontWeight: 700, textDecoration: 'none',
            color: scrolled ? '#0f172a' : '#fff', transition: 'opacity 0.2s'
          }} className="nav-signin">Sign In</Link>
          
          <Link to="/register-school" style={{
            padding: '12px 28px', borderRadius: 99, fontSize: 14, fontWeight: 700, textDecoration: 'none',
            background: '#4f46e5', color: '#fff',
            boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)',
            transition: 'all 0.2s ease'
          }} className="nav-cta">Get Started</Link>
        </div>

        {/* Mobile Toggle */}
        <button 
          onClick={() => setMenuOpen(!menuOpen)} 
          style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer' }} 
          className="nav-mobile-btn"
        >
          {menuOpen ? <X color={scrolled ? '#0f172a' : '#fff'} /> : <Menu color={scrolled ? '#0f172a' : '#fff'} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: '#fff', borderBottom: '1px solid #e2e8f0',
          padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16,
          boxShadow: '0 10px 20px rgba(0,0,0,0.05)'
        }}>
          {['Features', 'Pillars', 'Stats'].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMenuOpen(false)} style={{
              fontSize: 15, fontWeight: 600, color: '#334155', textDecoration: 'none',
              padding: '10px 0', borderBottom: '1px solid #f1f5f9'
            }}>{item}</a>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
            <Link to={ROUTES.LOGIN} onClick={() => setMenuOpen(false)} style={{
              padding: '12px', textAlign: 'center', fontSize: 15, fontWeight: 700, color: '#334155', textDecoration: 'none', background: '#f8fafc', borderRadius: 12
            }}>Sign In</Link>
            <Link to="/register-school" onClick={() => setMenuOpen(false)} style={{
              padding: '12px', textAlign: 'center', fontSize: 15, fontWeight: 700, color: '#fff', textDecoration: 'none', background: '#4f46e5', borderRadius: 12
            }}>Get Started</Link>
          </div>
        </div>
      )}
    </nav>
  );
}

function Hero() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 100); }, []);

  return (
    <section style={{
      minHeight: '100vh', position: 'relative', display: 'flex', alignItems: 'center',
      background: '#020617', overflow: 'hidden', paddingTop: 80
    }}>
      {/* Background Setup */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <img src="/kids2.JPG" alt="Background" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.25 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom right, rgba(2,6,23,0.95), rgba(15,23,42,0.8), rgba(30,27,75,0.95))' }} />
      </div>

      {/* Abstract Blobs */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div className="hero-blob" style={{ position: 'absolute', top: '20%', left: '10%', width: 500, height: 500, background: 'rgba(99, 102, 241, 0.15)', borderRadius: '50%', filter: 'blur(80px)' }} />
        <div className="hero-blob delayed" style={{ position: 'absolute', top: '40%', right: '10%', width: 400, height: 400, background: 'rgba(168, 85, 247, 0.15)', borderRadius: '50%', filter: 'blur(80px)' }} />
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 10, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 60, width: '100%' }}>
        
        {/* Left Copy */}
        <div style={{
          flex: '1 1 500px',
          opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(40px)',
          transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 20px', borderRadius: 99,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
            marginBottom: 32
          }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 8, height: 8 }}>
              <span style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', background: '#34d399', animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
              <span style={{ position: 'relative', width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#cbd5e1' }}>Next-Gen School Ecosystem</span>
          </div>

          <h1 style={{
            fontFamily: '"Playfair Display", serif', fontSize: 'clamp(3rem, 5vw, 4.5rem)', fontWeight: 700, color: '#fff', lineHeight: 1.1, marginBottom: 24, letterSpacing: '-0.02em'
          }}>
            Education <br/>
            <span style={{ background: 'linear-gradient(to right, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Reimagined.</span>
          </h1>

          <p style={{ fontSize: 'clamp(1.1rem, 2vw, 1.25rem)', color: '#94a3b8', lineHeight: 1.7, marginBottom: 48, maxWidth: 540 }}>
            Empower students, equip educators, and automate administrative reporting seamlessly from a single, unified platform tailored for Ghana.
          </p>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Link to="/register-school" style={{
              display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 36px', borderRadius: 99,
              background: '#fff', color: '#0f172a', fontSize: 16, fontWeight: 700, textDecoration: 'none',
              boxShadow: '0 0 40px rgba(255,255,255,0.15)', transition: 'all 0.3s ease'
            }} className="hero-btn-primary">
              Register School <ArrowRight size={20} />
            </Link>
            <Link to={ROUTES.LOGIN} style={{
              display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 36px', borderRadius: 99,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 16, fontWeight: 700, textDecoration: 'none',
              backdropFilter: 'blur(8px)', transition: 'all 0.3s ease'
            }} className="hero-btn-secondary">
              Sign In to Portal
            </Link>
          </div>
        </div>

        {/* Right UI Graphic */}
        <div style={{
          flex: '1 1 400px', position: 'relative', height: 600,
          opacity: mounted ? 1 : 0, transform: mounted ? 'translateX(0)' : 'translateX(40px)',
          transition: 'all 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} className="hero-graphic">
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.2))', borderRadius: 32, filter: 'blur(60px)', transform: 'rotate(5deg)' }} />
          
          <div style={{
            position: 'relative', width: '100%', maxWidth: 480, background: '#0f172a', borderRadius: 24, border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', overflow: 'hidden', transform: 'rotate(-2deg)', transition: 'transform 0.5s ease'
          }} className="hero-mockup">
            {/* Header */}
            <div style={{ height: 48, background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 8 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981' }} />
            </div>
            {/* Content */}
            <div style={{ padding: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
                <div>
                  <div style={{ width: 120, height: 16, background: 'rgba(255,255,255,0.1)', borderRadius: 4, marginBottom: 12 }} />
                  <div style={{ width: 200, height: 32, background: 'rgba(255,255,255,0.2)', borderRadius: 6 }} />
                </div>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(99,102,241,0.3)' }}>
                  <LayoutDashboard color="#818cf8" size={28} />
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[1,2,3].map(i => (
                  <div key={i} style={{ height: 72, background: 'rgba(255,255,255,0.03)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', padding: '0 20px', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.1)' }} />
                      <div>
                        <div style={{ width: 100, height: 12, background: 'rgba(255,255,255,0.2)', borderRadius: 4, marginBottom: 8 }} />
                        <div style={{ width: 60, height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4 }} />
                      </div>
                    </div>
                    <div style={{ width: 80, height: 24, background: 'rgba(99,102,241,0.2)', borderRadius: 99 }} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{
            position: 'absolute', top: '25%', left: '-30px', background: '#fff', padding: 20, borderRadius: 20,
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)', transform: 'rotate(3deg)', display: 'flex', flexDirection: 'column', gap: 12
          }} className="hero-floating-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 color="#16a34a" size={24} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Payment Received</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>Term 2 Fees • Just now</div>
              </div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#0f172a' }}>GH₵ 1,450.00</div>
          </div>
        </div>

      </div>
    </section>
  );
}

function Features() {
  const { ref, inView } = useInView();

  return (
    <section id="features" style={{ padding: '120px 24px', background: '#fff', position: 'relative' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div ref={ref} style={{
          textAlign: 'center', maxWidth: 700, margin: '0 auto 80px auto',
          opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 16 }}>Everything you need</div>
          <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, color: '#0f172a', lineHeight: 1.15, marginBottom: 20 }}>A powerful ecosystem for modern education</h2>
          <p style={{ fontSize: 18, color: '#64748b', lineHeight: 1.6 }}>Built from the ground up to handle the unique workflows of Ghanaian schools, providing clarity, automation, and scale.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32 }}>
          {FEATURES.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div key={idx} style={{
                background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 32, padding: 40,
                opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(40px)',
                transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 0.1}s`,
                position: 'relative'
              }} className="feature-card">
                <div style={{
                  width: 64, height: 64, borderRadius: 20, background: `${feature.color}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28,
                  transition: 'transform 0.4s ease'
                }} className="feature-icon-wrapper">
                  <Icon color={feature.color} size={32} />
                </div>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 12, letterSpacing: '-0.02em' }}>{feature.title}</h3>
                <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.7 }}>{feature.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Pillars() {
  const { ref, inView } = useInView();

  return (
    <section id="pillars" style={{ padding: '120px 24px', background: '#0f172a', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 800, height: 800, background: 'rgba(79, 70, 229, 0.1)', borderRadius: '50%', filter: 'blur(120px)', transform: 'translate(30%, -30%)', pointerEvents: 'none' }} />
      
      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <div ref={ref} style={{
          marginBottom: 80, maxWidth: 600,
          opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 16 }}>Workflow</div>
          <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, color: '#fff', lineHeight: 1.15, marginBottom: 20 }}>Four pillars of academic excellence</h2>
          <p style={{ fontSize: 18, color: '#94a3b8', lineHeight: 1.6 }}>A clear, logical flow that connects administrators, teachers, and students perfectly.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 40, position: 'relative' }}>
          {/* Connecting Line */}
          <div style={{ position: 'absolute', top: 40, left: '10%', right: '10%', height: 2, background: 'linear-gradient(90deg, rgba(79,70,229,0.1), rgba(79,70,229,0.5), rgba(79,70,229,0.1))', zIndex: 0 }} className="pillar-line" />

          {PILLARS.map((pillar, idx) => (
            <div key={idx} style={{
              position: 'relative', zIndex: 10,
              opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(40px)',
              transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 0.15}s`
            }}>
              <div style={{
                width: 80, height: 80, borderRadius: 24, background: '#1e293b', border: '1px solid #334155',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24,
                fontSize: 28, fontFamily: '"Playfair Display", serif', fontWeight: 800, color: '#818cf8',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)', transition: 'transform 0.3s ease'
              }} className="pillar-icon">
                {pillar.num}
              </div>
              <h4 style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 12 }}>{pillar.title}</h4>
              <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.7 }}>{pillar.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatsSection() {
  const { ref, inView } = useInView();

  return (
    <section id="stats" style={{ padding: '80px 24px', background: '#4f46e5', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
      
      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <div ref={ref} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, textAlign: 'center' }}>
          {STATS.map((stat, idx) => (
            <div key={idx} style={{
              opacity: inView ? 1 : 0, transform: inView ? 'scale(1)' : 'scale(0.9)',
              transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 0.1}s`
            }}>
              <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 700, color: '#fff', marginBottom: 8, lineHeight: 1 }}>
                {inView ? <AnimatedCounter end={stat.value} suffix={stat.suffix} /> : '0'}
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#a5b4fc', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section style={{ padding: '120px 24px', background: '#fff', textAlign: 'center' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
          <ShieldCheck color="#4f46e5" size={40} />
        </div>
        <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(2.5rem, 4vw, 3.5rem)', fontWeight: 700, color: '#0f172a', marginBottom: 24, lineHeight: 1.15 }}>
          Ready to digitize your institution?
        </h2>
        <p style={{ fontSize: 18, color: '#64748b', marginBottom: 48, lineHeight: 1.6, maxWidth: 600, margin: '0 auto 48px' }}>
          Join the schools already using World Uni-Learn to streamline operations, boost fee collection, and elevate academic standards.
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Link to="/register-school" style={{
            padding: '16px 40px', borderRadius: 99, background: '#4f46e5', color: '#fff', fontSize: 16, fontWeight: 700, textDecoration: 'none',
            boxShadow: '0 10px 25px rgba(79,70,229,0.3)', transition: 'all 0.3s ease'
          }} className="cta-btn-primary">
            Register School for Free
          </Link>
          <Link to={ROUTES.LOGIN} style={{
            padding: '16px 40px', borderRadius: 99, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155', fontSize: 16, fontWeight: 700, textDecoration: 'none',
            transition: 'all 0.3s ease'
          }} className="cta-btn-secondary">
            Sign In to Portal
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{ background: '#020617', padding: '60px 24px', borderTop: '1px solid #1e293b' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 32 }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, background: '#fff', borderRadius: 8, padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/wula.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <span style={{ fontFamily: '"Playfair Display", serif', fontSize: 20, fontWeight: 700, color: '#fff' }}>World Uni-Learn</span>
        </div>
        
        <div style={{ fontSize: 14, color: '#64748b' }}>
          &copy; {new Date().getFullYear()} World Uni-Learn Platform. Built for Ghana.
        </div>
        
        <div style={{ display: 'flex', gap: 24, fontSize: 14, fontWeight: 600, color: '#94a3b8' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><CheckCircle2 color="#10b981" size={16} /> GES Compliant</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><ShieldCheck color="#6366f1" size={16} /> Secure</span>
        </div>

      </div>
    </footer>
  );
}

// --- Main Page Export ---

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', fontFamily: '"DM Sans", system-ui, sans-serif', background: '#f8fafc', color: '#0f172a' }}>
      <style>{`
        /* Global Reset for Landing */
        html { scroll-behavior: smooth; }
        
        /* Animations */
        @keyframes floatBlob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        
        @keyframes floatElement {
          0%, 100% { transform: translateY(0) rotate(3deg); }
          50% { transform: translateY(-15px) rotate(1deg); }
        }

        .hero-blob { animation: floatBlob 10s ease-in-out infinite alternate; }
        .hero-blob.delayed { animation-delay: 2s; }
        .hero-floating-card { animation: floatElement 6s ease-in-out infinite; }

        /* Hover States via CSS for performance & clean JSX */
        .nav-logo-group:hover .nav-logo-icon { transform: scale(1.05); }
        .nav-link:hover { color: #4f46e5 !important; }
        .nav-signin:hover { opacity: 0.7; }
        .nav-cta:hover { background: #4338ca !important; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4) !important; }

        .hero-btn-primary:hover { background: #f8fafc !important; transform: scale(1.02); }
        .hero-btn-secondary:hover { background: rgba(255,255,255,0.1) !important; }
        .hero-mockup:hover { transform: rotate(0deg) !important; }

        .feature-card:hover { border-color: transparent !important; box-shadow: 0 20px 40px rgba(0,0,0,0.06); transform: translateY(-4px) !important; z-index: 10; }
        .feature-card:hover .feature-icon-wrapper { transform: scale(1.1) rotate(-3deg); }

        .pillar-icon:hover { transform: scale(1.1) rotate(5deg) !important; background: #312e81 !important; border-color: #4f46e5 !important; }

        .cta-btn-primary:hover { transform: translateY(-2px); background: #4338ca !important; box-shadow: 0 15px 30px rgba(79,70,229,0.4) !important; }
        .cta-btn-secondary:hover { background: #f1f5f9 !important; color: #0f172a !important; }

        /* Responsive Breakpoints */
        @media (max-width: 900px) {
          .nav-desktop { display: none !important; }
          .nav-mobile-btn { display: block !important; }
          .hero-graphic { display: none !important; }
          .pillar-line { display: none !important; }
        }
      `}</style>
      
      <Navbar />
      <Hero />
      <Features />
      <Pillars />
      <StatsSection />
      <CTA />
      <Footer />
    </div>
  );
}