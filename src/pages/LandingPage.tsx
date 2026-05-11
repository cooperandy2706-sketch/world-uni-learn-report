import React, { useEffect, useRef, useState } from 'react';

// ─── HOOKS ────────────────────────────────────────────────────────────────────

function useInView(threshold = 0.12) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold, rootMargin: '0px 0px -40px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function useScrolled(offset = 24) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > offset);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, [offset]);
  return scrolled;
}

function AnimatedCounter({ end, suffix = '' }) {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView(0.5);
  useEffect(() => {
    if (!inView) return;
    let start = null;
    const duration = 2000;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      setCount(Math.floor(ease * end));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, end]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ─── DATA ─────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    num: '01',
    title: 'Command Palette',
    label: '⌘K Navigation',
    desc: 'Navigate the entire platform with natural language search. Jump to any student, class, or report in milliseconds.',
    color: '#6366f1',
  },
  {
    num: '02',
    title: 'Dynamic Billing Engine',
    label: 'Smart Fees',
    desc: 'Automate term fees, daily collections, and arrears. Parents get real-time receipts, bursars get zero paperwork.',
    color: '#059669',
  },
  {
    num: '03',
    title: 'Smart SMS Hub',
    label: 'Instant Alerts',
    desc: 'Blast automated report cards and fee reminders to parents\' phones. Communication at the speed of a click.',
    color: '#d97706',
  },
  {
    num: '04',
    title: 'Automated BECE Grading',
    label: 'GES Compliant',
    desc: 'Instant CA calculations, grade tallying, and GES-compliant report generation. Termly stress eliminated.',
    color: '#7c3aed',
  },
  {
    num: '05',
    title: 'Isolated Role Portals',
    label: 'Secure Access',
    desc: 'Tailored dashboards for every role — Admins, Teachers, Bursars, and Students — each with zero data overlap.',
    color: '#db2777',
  },
  {
    num: '06',
    title: 'Interactive Hub',
    label: 'Engagement',
    desc: 'Built-in educational games, school elections, and digital library vaults keep students motivated and engaged.',
    color: '#0284c7',
  },
];

const PILLARS = [
  { num: '01', title: 'Administration', desc: 'Deploy academic years, assign staff roles, and oversee the entire institution through one secure command center.' },
  { num: '02', title: 'Teaching', desc: 'Log in daily to track syllabi, attendance, and continuous assessment — all in under two minutes.' },
  { num: '03', title: 'Learning', desc: 'Students access digital vaults, complete assignments online, and track their own academic progress in real time.' },
  { num: '04', title: 'Reporting', desc: 'Generate flawless, GES-compliant report cards automatically at the end of every term. No manual entry.' },
];

const STATS = [
  { value: 99, suffix: '%', label: 'Uptime Reliability' },
  { value: 5000, suffix: '+', label: 'Active Students' },
  { value: 100, suffix: '%', label: 'GES Compliant' },
  { value: 24, suffix: '/7', label: 'System Access' },
];

const MARQUEE_ITEMS = [
  'Academic Management', 'Smart Timetabling', 'Digital Report Cards',
  'Fee Automation', 'SMS Alerts', 'BECE Grading', 'Student Portals',
  'Teacher Tools', 'Bursar Suite', 'School Elections', 'Digital Library',
];

const WORKFLOW_STEPS = [
  { step: '01', title: 'School Onboarding', desc: 'Register your school and configure your full academic structure — years, terms, classes, and departments — in minutes.', tag: 'Admin' },
  { step: '02', title: 'Staff & Student Enrollment', desc: 'Import student records and assign staff roles with role-specific access control and parent/guardian linking.', tag: 'Admin + Bursar' },
  { step: '03', title: 'Daily Teaching Operations', desc: 'Teachers log attendance, track syllabus coverage, and manage continuous assessment every single day.', tag: 'Teachers' },
  { step: '04', title: 'Fee Management & Collections', desc: 'Bursars manage fee structures, record daily collections, and issue digital invoices automatically.', tag: 'Bursar' },
  { step: '05', title: 'Student Engagement & Assessment', desc: 'Students access assignments, library resources, Typing Nitro, and school election voting through their portal.', tag: 'Students' },
  { step: '06', title: 'Term Closure & Reports', desc: 'Generate GES-compliant report cards, financial summaries, and send SMS notifications to parents — all in one click.', tag: 'All Roles' },
];

// ─── STYLES ───────────────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap');

  :root {
    --primary: #0f172a;
    --primary-light: #1e293b;
    --accent: #f59e0b;
    --accent-light: #fbbf24;
    --text: #334155;
    --text-light: #64748b;
    --bg: #fdfcfb;
    --white: #ffffff;
    --glass: rgba(255, 255, 255, 0.7);
    --glass-border: rgba(255, 255, 255, 0.3);
    --sans: 'Outfit', sans-serif;
    --serif: 'Playfair Display', serif;
    --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  }

  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

  html { scroll-behavior: smooth; font-size: 16px; }
  body { font-family: var(--sans); background: var(--bg); color: var(--primary); overflow-x: hidden; line-height: 1.6; }
  
  .container { width: 100%; max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; }

  /* ── UTILS ── */
  .text-gradient { background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .accent-gradient { background: linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

  /* ── ANIMATIONS ── */
  .reveal { opacity: 0; transform: translateY(20px); transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1); }
  .reveal.in { opacity: 1; transform: translateY(0); }

  /* ── NAV ── */
  .nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
    transition: all 0.3s ease;
    padding: 1.25rem 0;
  }
  .nav.scrolled {
    background: var(--glass);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--glass-border);
    padding: 0.75rem 0;
    box-shadow: var(--shadow);
  }
  .nav-inner { display: flex; align-items: center; justify-content: space-between; }
  .logo { display: flex; align-items: center; gap: 0.75rem; font-weight: 700; font-size: 1.25rem; color: var(--primary); }
  .logo-icon { width: 40px; height: 40px; background: var(--primary); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-family: var(--serif); font-size: 1.5rem; }
  .nav-links { display: none; gap: 2rem; }
  @media (min-width: 768px) { .nav-links { display: flex; } }
  .nav-link { font-size: 0.9rem; font-weight: 500; color: var(--text); transition: color 0.2s; position: relative; }
  .nav-link:hover { color: var(--accent); }
  .nav-link::after { content: ''; position: absolute; bottom: -4px; left: 0; width: 0; height: 2px; background: var(--accent); transition: width 0.3s; }
  .nav-link:hover::after { width: 100%; }
  
  .nav-actions { display: none; gap: 1rem; align-items: center; }
  @media (min-width: 1024px) { .nav-actions { display: flex; } }
  .btn-login { font-size: 0.9rem; font-weight: 600; color: var(--primary); }
  .btn-primary { 
    background: var(--primary); color: white; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; font-size: 0.9rem;
    transition: all 0.3s; box-shadow: var(--shadow);
  }
  .btn-primary:hover { background: var(--primary-light); transform: translateY(-2px); box-shadow: var(--shadow-lg); }

  .mobile-toggle { display: block; background: none; border: none; cursor: pointer; color: var(--primary); }
  @media (min-width: 768px) { .mobile-toggle { display: none; } }

  /* ── HERO ── */
  .hero { 
    padding: 8rem 0 4rem; min-height: 100vh; display: flex; align-items: center;
    background: linear-gradient(180deg, #fefaf6 0%, #fdfcfb 100%);
    position: relative; overflow: hidden;
  }
  .hero::before {
    content: ''; position: absolute; top: -10%; right: -10%; width: 50%; height: 50%;
    background: radial-gradient(circle, rgba(245, 158, 11, 0.08) 0%, transparent 70%);
    filter: blur(60px); pointer-events: none;
  }
  .hero::after {
    content: ''; position: absolute; bottom: -10%; left: -10%; width: 50%; height: 50%;
    background: radial-gradient(circle, rgba(15, 23, 42, 0.04) 0%, transparent 70%);
    filter: blur(60px); pointer-events: none;
  }
  .hero-grid { display: grid; gap: 3rem; align-items: center; }
  @media (min-width: 1024px) { .hero-grid { grid-template-columns: 1.2fr 0.8fr; } }
  
  .hero-content { text-align: center; }
  @media (min-width: 1024px) { .hero-content { text-align: left; } }
  
  .hero-badge {
    display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem;
    background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2);
    border-radius: 100px; color: var(--accent); font-size: 0.75rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1.5rem;
  }
  .hero-title { 
    font-family: var(--serif); font-size: clamp(2.5rem, 8vw, 4.5rem); line-height: 1.1; font-weight: 700;
    margin-bottom: 1.5rem; color: var(--primary);
  }
  .hero-subtitle { font-size: 1.125rem; color: var(--text-light); max-width: 600px; margin: 0 auto 2.5rem; }
  @media (min-width: 1024px) { .hero-subtitle { margin-left: 0; } }
  
  .hero-btns { display: flex; flex-direction: column; gap: 1rem; align-items: center; }
  @media (min-width: 640px) { .hero-btns { flex-direction: row; justify-content: center; } }
  @media (min-width: 1024px) { .hero-btns { justify-content: flex-start; } }
  
  .hero-img-container { position: relative; width: 100%; max-width: 500px; margin: 0 auto; }
  .hero-img { 
    width: 100%; height: auto; border-radius: 24px; box-shadow: var(--shadow-lg);
    border: 8px solid white; transform: rotate(-2deg); transition: transform 0.5s ease;
  }
  .hero-img:hover { transform: rotate(0deg) scale(1.02); }
  .hero-img-blob {
    position: absolute; z-index: -1; top: -20px; right: -20px; width: 100px; height: 100px;
    background: var(--accent); border-radius: 50%; filter: blur(40px); opacity: 0.2;
  }

  /* ── MARQUEE ── */
  .marquee { background: var(--primary); color: white; padding: 1.5rem 0; overflow: hidden; white-space: nowrap; }
  .marquee-content { display: inline-block; animation: marquee 30s linear infinite; }
  .marquee-item { display: inline-flex; align-items: center; gap: 1rem; padding: 0 2rem; font-weight: 600; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.1em; }
  .marquee-dot { width: 6px; height: 6px; background: var(--accent); border-radius: 50%; }
  @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }

  /* ── FEATURES ── */
  .section { padding: 6rem 0; }
  .section-header { text-align: center; max-width: 700px; margin: 0 auto 4rem; }
  .section-eyebrow { font-weight: 700; font-size: 0.875rem; color: var(--accent); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 1rem; }
  .section-title { font-family: var(--serif); font-size: clamp(2rem, 5vw, 3rem); font-weight: 700; color: var(--primary); line-height: 1.2; }
  
  .features-grid { display: grid; gap: 2rem; }
  @media (min-width: 640px) { .features-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (min-width: 1024px) { .features-grid { grid-template-columns: repeat(3, 1fr); } }
  
  .feature-card {
    background: white; padding: 2.5rem; border-radius: 20px; border: 1px solid var(--bg);
    transition: all 0.3s ease; box-shadow: var(--shadow);
  }
  .feature-card:hover { transform: translateY(-10px); box-shadow: var(--shadow-lg); border-color: var(--accent); }
  .feature-num { font-family: var(--serif); font-size: 3rem; color: rgba(15, 23, 42, 0.05); font-weight: 900; margin-bottom: -1.5rem; line-height: 1; }
  .feature-title { font-size: 1.25rem; font-weight: 700; color: var(--primary); margin-bottom: 1rem; }
  .feature-desc { color: var(--text-light); font-size: 0.9375rem; line-height: 1.7; }

  /* ── PILLARS ── */
  .pillars { background: var(--primary); color: white; }
  .pillars .section-title { color: white; }
  .pillars .feature-card { background: rgba(255, 255, 255, 0.05); border-color: rgba(255, 255, 255, 0.1); }
  .pillars .feature-card:hover { background: rgba(255, 255, 255, 0.08); }
  .pillars .feature-title { color: white; }
  .pillars .feature-desc { color: rgba(255, 255, 255, 0.6); }

  /* ── WORKFLOW ── */
  .workflow-list { display: grid; gap: 1.5rem; }
  .workflow-item {
    display: grid; grid-template-columns: 60px 1fr; gap: 1.5rem; align-items: start;
    padding: 2rem; background: white; border-radius: 16px; border: 1px solid var(--bg);
    transition: all 0.3s;
  }
  .workflow-item:hover { border-color: var(--accent); box-shadow: var(--shadow); }
  .workflow-num { 
    width: 60px; height: 60px; background: var(--primary); color: white;
    display: flex; align-items: center; justify-content: center;
    border-radius: 12px; font-weight: 700; font-size: 1.25rem;
  }
  .workflow-content h4 { font-size: 1.125rem; font-weight: 700; margin-bottom: 0.5rem; }
  .workflow-content p { font-size: 0.9375rem; color: var(--text-light); }
  .workflow-tag { 
    display: inline-block; margin-top: 1rem; font-size: 0.75rem; font-weight: 700;
    color: var(--accent); text-transform: uppercase; letter-spacing: 0.05em;
    padding: 0.25rem 0.75rem; background: rgba(245, 158, 11, 0.1); border-radius: 4px;
  }

  /* ── STATS ── */
  .stats { background: var(--bg); border-top: 1px solid var(--glass-border); border-bottom: 1px solid var(--glass-border); }
  .stats-grid { display: grid; gap: 2rem; text-align: center; }
  @media (min-width: 640px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (min-width: 1024px) { .stats-grid { grid-template-columns: repeat(4, 1fr); } }
  .stat-item h3 { font-family: var(--serif); font-size: 3.5rem; font-weight: 700; color: var(--primary); margin-bottom: 0.5rem; }
  .stat-item p { font-size: 0.875rem; font-weight: 700; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.1em; }

  /* ── CTA ── */
  .cta { background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%); color: white; text-align: center; }
  .cta-title { color: white; margin-bottom: 2rem; }
  .cta-subtitle { color: rgba(255, 255, 255, 0.7); max-width: 600px; margin: 0 auto 3rem; }
  
  /* ── FOOTER ── */
  .footer { background: #080808; color: white; padding: 5rem 0 2.5rem; }
  .footer-grid { display: grid; gap: 4rem; }
  @media (min-width: 768px) { .footer-grid { grid-template-columns: 1.5fr 1fr 1fr; } }
  .footer-logo { margin-bottom: 1.5rem; }
  .footer-desc { color: rgba(255, 255, 255, 0.4); font-size: 0.9375rem; line-height: 1.8; max-width: 300px; }
  .footer-col h5 { font-size: 0.875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--accent); margin-bottom: 1.5rem; }
  .footer-links { list-style: none; display: grid; gap: 0.75rem; }
  .footer-link { color: rgba(255, 255, 255, 0.5); font-size: 0.9375rem; transition: color 0.2s; }
  .footer-link:hover { color: white; }
  .footer-bottom { border-top: 1px solid rgba(255, 255, 255, 0.1); margin-top: 4rem; padding-top: 2rem; display: flex; flex-direction: column; gap: 1rem; align-items: center; text-align: center; font-size: 0.875rem; color: rgba(255, 255, 255, 0.3); }
  @media (min-width: 768px) { .footer-bottom { flex-direction: row; justify-content: space-between; text-align: left; } }

  /* ── MOBILE MENU ── */
  .mobile-menu {
    position: fixed; inset: 0; background: var(--primary); z-index: 2000;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 2rem; transform: translateX(100%); transition: transform 0.4s ease;
  }
  .mobile-menu.open { transform: translateX(0); }
  .mobile-link { font-size: 2rem; font-family: var(--serif); font-weight: 600; color: white; }
  .mobile-close { position: absolute; top: 1.5rem; right: 1.5rem; color: white; background: none; border: none; font-size: 1.5rem; }
`;

// ─── SUBCOMPONENTS ─────────────────────────────────────────────────────────

function Navbar({ scrolled, setMenuOpen }) {
  return (
    <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <div className="nav-inner">
          <a href="#" className="logo">
            <div className="logo-icon">W</div>
            <span>World Uni-Learn</span>
          </a>
          
          <div className="nav-links">
            {['Features', 'Pillars', 'Workflow', 'Stats'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="nav-link">{item}</a>
            ))}
          </div>
          
          <div className="nav-actions">
            <a href="/login" className="btn-login">Sign In</a>
            <a href="/register-school" className="btn-primary">Get Started</a>
          </div>
          
          <button className="mobile-toggle" onClick={() => setMenuOpen(true)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="hero">
      <div className="container">
        <div className="hero-grid">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="marquee-dot" />
              <span>Next-Gen School Ecosystem</span>
            </div>
            <h1 className="hero-title">
              Education <br />
              <span className="accent-gradient">Reimagined.</span>
            </h1>
            <p className="hero-subtitle">
              Empower students, equip educators, and automate administrative reporting
              from a single unified platform built for Ghanaian schools.
            </p>
            <div className="hero-btns">
              <a href="/register-school" className="btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1rem' }}>Register School</a>
              <a href="/login" className="btn-login" style={{ fontSize: '1rem', borderBottom: '2px solid var(--accent)', marginLeft: '1rem' }}>Sign In to Portal</a>
            </div>
          </div>
          <div className="hero-img-container">
            <div className="hero-img-blob" />
            <img src="/kids2.JPG" alt="Students learning" className="hero-img" />
          </div>
        </div>
      </div>
    </section>
  );
}

function MarqueeBand() {
  return (
    <div className="marquee">
      <div className="marquee-content">
        {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
          <span className="marquee-item" key={i}>
            <span className="marquee-dot" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function SectionHeader({ eyebrow, title, light = false }) {
  return (
    <div className="section-header">
      <p className="section-eyebrow">{eyebrow}</p>
      <h2 className="section-title" style={{ color: light ? 'white' : 'var(--primary)' }}>{title}</h2>
    </div>
  );
}

function Reveal({ children }) {
  const { ref, inView } = useInView();
  return (
    <div ref={ref} className={`reveal ${inView ? 'in' : ''}`}>
      {children}
    </div>
  );
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────

export default function LandingPage() {
  const scrolled = useScrolled(50);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <style>{CSS}</style>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        <button className="mobile-close" onClick={() => setMenuOpen(false)}>✕</button>
        {['Features', 'Pillars', 'Workflow', 'Stats'].map(item => (
          <a key={item} href={`#${item.toLowerCase()}`} className="mobile-link" onClick={() => setMenuOpen(false)}>{item}</a>
        ))}
        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', padding: '0 2rem' }}>
          <a href="/login" className="btn-primary" style={{ background: 'white', color: 'var(--primary)', textAlign: 'center' }}>Sign In</a>
          <a href="/register-school" className="btn-primary" style={{ background: 'var(--accent)', textAlign: 'center' }}>Get Started</a>
        </div>
      </div>

      <Navbar scrolled={scrolled} setMenuOpen={setMenuOpen} />
      
      <Hero />
      
      <MarqueeBand />

      <section className="section" id="features">
        <div className="container">
          <SectionHeader eyebrow="Everything You Need" title="A powerful ecosystem for modern education" />
          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <Reveal key={i}>
                <div className="feature-card">
                  <div className="feature-num">{f.num}</div>
                  <h3 className="feature-title">{f.title}</h3>
                  <p className="feature-desc">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section pillars" id="pillars">
        <div className="container">
          <SectionHeader eyebrow="Workflow" title="Four pillars of academic excellence" light />
          <div className="features-grid">
            {PILLARS.map((p, i) => (
              <Reveal key={i}>
                <div className="feature-card">
                  <div className="feature-num">{p.num}</div>
                  <h3 className="feature-title">{p.title}</h3>
                  <p className="feature-desc">{p.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="workflow">
        <div className="container">
          <SectionHeader eyebrow="How It Works" title="The complete school cycle, automated" />
          <div className="workflow-list">
            {WORKFLOW_STEPS.map((s, i) => (
              <Reveal key={i}>
                <div className="workflow-item">
                  <div className="workflow-num">{s.step}</div>
                  <div className="workflow-content">
                    <h4>{s.title}</h4>
                    <p>{s.desc}</p>
                    <span className="workflow-tag">{s.tag}</span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section stats" id="stats">
        <div className="container">
          <div className="stats-grid">
            {STATS.map((s, i) => (
              <div className="stat-item" key={i}>
                <h3><AnimatedCounter end={s.value} suffix={s.suffix} /></h3>
                <p>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section cta">
        <div className="container">
          <Reveal>
            <h2 className="section-title cta-title">Ready to Transform Your School?</h2>
            <p className="cta-subtitle">Join the schools already ahead of the curve. Streamline operations, automate reporting, and elevate the academic experience.</p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <a href="/register-school" className="btn-primary" style={{ background: 'white', color: 'var(--primary)', padding: '1.25rem 3rem' }}>Register School for Free</a>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-col">
              <div className="logo footer-logo">
                <div className="logo-icon" style={{ background: 'var(--accent)' }}>W</div>
                <span style={{ color: 'white' }}>World Uni-Learn</span>
              </div>
              <p className="footer-desc">The all-in-one School Management System built for Ghanaian schools. Empowering administrators, teachers, bursars, and students.</p>
            </div>
            <div className="footer-col">
              <h5>Platform</h5>
              <ul className="footer-links">
                {['Features', 'How It Works', 'Pricing', 'Register School'].map(l => (
                  <li key={l}><a href="#" className="footer-link">{l}</a></li>
                ))}
              </ul>
            </div>
            <div className="footer-col">
              <h5>Contact</h5>
              <ul className="footer-links">
                <li><a href="mailto:hello@worldunilearn.com" className="footer-link">hello@worldunilearn.com</a></li>
                <li><a href="tel:+233537996934" className="footer-link">+233 537 996 934</a></li>
                <li><a href="https://reportgem.vercel.app" className="footer-link" target="_blank" rel="noreferrer">reportgem.vercel.app</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} World Uni-Learn Platform. Built for Ghana.</p>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <span>GES Compliant</span>
              <span>Secure Cloud Storage</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}