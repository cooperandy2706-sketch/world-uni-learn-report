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
  'Academic Management', 'Smart Timetabling', 'Digital Report Cards',
  'Fee Automation', 'SMS Alerts', 'BECE Grading', 'Student Portals',
  'Teacher Tools', 'Bursar Suite', 'School Elections', 'Digital Library',
];

// ─── STYLES ───────────────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Outfit:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --ink: #0d0d0d;
    --ink-2: #1c1c1c;
    --ink-3: #2e2e2e;
    --muted: #6b6b6b;
    --muted-2: #9a9a9a;
    --cream: #f9f6f1;
    --cream-2: #f3ede4;
    --cream-3: #ece4d8;
    --white: #ffffff;
    --gold: #b8924a;
    --gold-light: #d4aa6a;
    --rule: rgba(13,13,13,0.10);
    --serif: 'Cormorant Garamond', Georgia, serif;
    --sans: 'Outfit', system-ui, sans-serif;
  }

  html { scroll-behavior: smooth; font-size: 16px; }
  body { font-family: var(--sans); background: var(--cream); color: var(--ink); overflow-x: hidden; line-height: 1.65; }
  a { color: inherit; text-decoration: none; }

  /* ── REVEAL ── */
  .rv { opacity: 0; transform: translateY(30px); transition: opacity 0.85s cubic-bezier(.16,1,.3,1), transform 0.85s cubic-bezier(.16,1,.3,1); }
  .rv.in { opacity: 1; transform: none; }
  .rv-l { opacity: 0; transform: translateX(-30px); transition: opacity 0.9s cubic-bezier(.16,1,.3,1), transform 0.9s cubic-bezier(.16,1,.3,1); }
  .rv-l.in { opacity: 1; transform: none; }
  .rv-r { opacity: 0; transform: translateX(30px); transition: opacity 0.9s cubic-bezier(.16,1,.3,1), transform 0.9s cubic-bezier(.16,1,.3,1); }
  .rv-r.in { opacity: 1; transform: none; }
  .d1{transition-delay:.06s}.d2{transition-delay:.13s}.d3{transition-delay:.20s}
  .d4{transition-delay:.27s}.d5{transition-delay:.34s}.d6{transition-delay:.41s}

  /* ── LAYOUT ── */
  .container { max-width: 1160px; margin: 0 auto; padding: 0 40px; }

  /* ── NAV ── */
  .nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 200;
    padding: 22px 0;
    transition: all 0.4s cubic-bezier(.16,1,.3,1);
  }
  .nav.scrolled {
    background: rgba(249,246,241,0.96);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--rule);
    padding: 14px 0;
    box-shadow: 0 2px 40px rgba(0,0,0,0.05);
  }
  .nav-inner {
    max-width: 1160px; margin: 0 auto; padding: 0 40px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .nav-logo { display: flex; align-items: center; gap: 13px; }
  .nav-logo-mark {
    width: 42px; height: 42px; border-radius: 10px;
    background: var(--ink);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    transition: transform 0.3s ease;
  }
  .nav-logo:hover .nav-logo-mark { transform: rotate(-4deg) scale(1.05); }
  .nav-logo-mark-inner { font-family: var(--serif); font-size: 22px; font-weight: 700; color: #fff; line-height: 1; }
  .nav-logo-texts { display: flex; flex-direction: column; gap: 1px; }
  .nav-logo-world { font-size: 9px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; color: var(--muted); }
  .nav-logo-name { font-family: var(--serif); font-size: 19px; font-weight: 600; color: var(--ink); line-height: 1; }
  .nav-scrolled-name { color: var(--ink); }
  .nav-links { display: flex; align-items: center; gap: 38px; }
  .nav-link {
    font-size: 13px; font-weight: 500; letter-spacing: 0.02em;
    color: rgba(255,255,255,0.65);
    transition: color 0.2s; position: relative; padding-bottom: 2px;
  }
  .nav.scrolled .nav-link { color: var(--muted); }
  .nav-link::after { content: ''; position: absolute; bottom: 0; left: 0; width: 0; height: 1px; background: var(--ink); transition: width 0.3s; }
  .nav-link:hover { color: var(--white) !important; }
  .nav.scrolled .nav-link:hover { color: var(--ink) !important; }
  .nav.scrolled .nav-link:hover::after { width: 100%; }
  .nav-actions { display: flex; align-items: center; gap: 20px; }
  .nav-signin {
    font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.8);
    transition: opacity 0.2s;
  }
  .nav.scrolled .nav-signin { color: var(--ink); }
  .nav-signin:hover { opacity: 0.6; }
  .nav-cta {
    font-size: 13px; font-weight: 600;
    padding: 11px 26px; border-radius: 6px;
    background: var(--white); color: var(--ink);
    transition: all 0.25s ease;
    border: 1px solid rgba(255,255,255,0.2);
  }
  .nav.scrolled .nav-cta { background: var(--ink); color: var(--white); border-color: var(--ink); }
  .nav-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.15); }
  .nav-mobile-toggle { display: none; background: none; border: none; cursor: pointer; padding: 4px; }

  /* ── MOBILE NAV ── */
  .mobile-menu {
    position: absolute; top: 100%; left: 0; right: 0;
    background: var(--white);
    border-bottom: 1px solid var(--rule);
    padding: 24px 40px 32px;
    display: flex; flex-direction: column; gap: 20px;
    box-shadow: 0 12px 40px rgba(0,0,0,0.08);
  }
  .mobile-link { font-size: 16px; font-weight: 500; color: var(--ink); padding: 10px 0; border-bottom: 1px solid var(--rule); }
  .mobile-actions { display: flex; flex-direction: column; gap: 12px; margin-top: 8px; }
  .mobile-btn { font-size: 15px; font-weight: 600; padding: 14px; border-radius: 8px; text-align: center; transition: all 0.2s; }

  /* ── HERO ── */
  .hero {
    min-height: 100vh;
    display: grid;
    grid-template-columns: 1fr 1fr;
    background: var(--ink-2);
    position: relative;
    overflow: hidden;
  }
  .hero-left {
    display: flex; flex-direction: column; justify-content: flex-end;
    padding: 140px 64px 100px 64px;
    position: relative; z-index: 10;
  }
  .hero-right { position: relative; overflow: hidden; }
  .hero-right-img {
    width: 100%; height: 100%; object-fit: cover;
    opacity: 0.5;
    transform: scale(1.06);
    animation: heroZoom 14s ease-out forwards;
  }
  @keyframes heroZoom { to { transform: scale(1); } }
  .hero-right-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to right, var(--ink-2) 0%, transparent 65%);
  }
  .hero-badge {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 8px 18px; border-radius: 4px;
    border: 1px solid rgba(255,255,255,0.1);
    margin-bottom: 44px; width: fit-content;
    animation: fadeUp 1s 0.2s cubic-bezier(.16,1,.3,1) both;
  }
  .hero-badge-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #4ade80; flex-shrink: 0;
    box-shadow: 0 0 8px rgba(74,222,128,0.5);
    animation: pulse-dot 2.5s ease-in-out infinite;
  }
  @keyframes pulse-dot {
    0%, 100% { box-shadow: 0 0 8px rgba(74,222,128,0.5); }
    50% { box-shadow: 0 0 16px rgba(74,222,128,0.9); }
  }
  .hero-badge-text { font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255,255,255,0.55); }
  .hero-title {
    font-family: var(--serif);
    font-size: clamp(3.8rem, 5.5vw, 5.6rem);
    font-weight: 600; color: #fff;
    line-height: 1.04; letter-spacing: -0.02em;
    margin-bottom: 28px;
    animation: fadeUp 1s 0.4s cubic-bezier(.16,1,.3,1) both;
  }
  .hero-title-accent { font-style: italic; color: var(--gold-light); }
  .hero-subtitle {
    font-size: 17px; font-weight: 300;
    color: rgba(255,255,255,0.5);
    line-height: 1.8; max-width: 500px;
    margin-bottom: 56px;
    animation: fadeUp 1s 0.6s cubic-bezier(.16,1,.3,1) both;
  }
  .hero-actions {
    display: flex; align-items: center; gap: 20px; flex-wrap: wrap;
    animation: fadeUp 1s 0.8s cubic-bezier(.16,1,.3,1) both;
  }
  .hero-btn-main {
    display: inline-flex; align-items: center; gap: 10px;
    font-family: var(--sans); font-size: 14px; font-weight: 600;
    padding: 16px 36px; border-radius: 6px;
    background: var(--white); color: var(--ink);
    letter-spacing: 0.01em;
    transition: all 0.3s ease;
  }
  .hero-btn-main:hover { background: var(--cream); transform: translateY(-2px); box-shadow: 0 12px 32px rgba(255,255,255,0.12); }
  .hero-btn-main .arrow { transition: transform 0.3s ease; display: inline-block; }
  .hero-btn-main:hover .arrow { transform: translateX(4px); }
  .hero-btn-outline {
    display: inline-flex; align-items: center; gap: 10px;
    font-family: var(--sans); font-size: 14px; font-weight: 500;
    padding: 16px 28px; border-radius: 6px;
    border: 1px solid rgba(255,255,255,0.18);
    color: rgba(255,255,255,0.7);
    transition: all 0.3s ease;
  }
  .hero-btn-outline:hover { border-color: rgba(255,255,255,0.5); color: #fff; background: rgba(255,255,255,0.04); }
  .hero-bottom {
    position: absolute; bottom: 0; left: 0; right: 0;
    display: grid; grid-template-columns: repeat(4,1fr);
    border-top: 1px solid rgba(255,255,255,0.07);
    z-index: 10;
    animation: fadeUp 1s 1.0s cubic-bezier(.16,1,.3,1) both;
  }
  .hero-stat {
    padding: 28px 32px;
    border-right: 1px solid rgba(255,255,255,0.07);
  }
  .hero-stat:last-child { border-right: none; }
  .hero-stat-val { font-family: var(--serif); font-size: 30px; font-weight: 700; color: #fff; line-height: 1; margin-bottom: 5px; }
  .hero-stat-lbl { font-size: 10px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.35); }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: none; } }

  /* ── MARQUEE ── */
  .marquee-band { background: var(--gold); padding: 18px 0; overflow: hidden; }
  .marquee-track { display: flex; gap: 0; white-space: nowrap; animation: marqueeAnim 28s linear infinite; }
  .marquee-item {
    display: inline-flex; align-items: center; gap: 16px;
    font-size: 11px; font-weight: 700; letter-spacing: 0.16em;
    text-transform: uppercase; color: var(--ink); flex-shrink: 0;
    padding: 0 32px;
  }
  .marquee-dot { width: 4px; height: 4px; border-radius: 50%; background: rgba(13,13,13,0.35); }
  @keyframes marqueeAnim { from { transform: translateX(0); } to { transform: translateX(-50%); } }

  /* ── FEATURES ── */
  .features-section { padding: 120px 0; background: var(--cream); }
  .features-header {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 80px; align-items: end; margin-bottom: 72px;
  }
  .features-eyebrow { font-size: 11px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: var(--gold); margin-bottom: 18px; }
  .features-title { font-family: var(--serif); font-size: clamp(2.6rem, 4vw, 3.6rem); font-weight: 600; line-height: 1.08; color: var(--ink); }
  .features-intro { font-size: 16px; color: var(--muted); line-height: 1.8; font-weight: 300; padding-top: 20px; }
  .features-grid {
    display: grid; grid-template-columns: repeat(3,1fr);
    gap: 1px; background: var(--rule);
    border: 1px solid var(--rule); border-radius: 12px; overflow: hidden;
  }
  .feature-card {
    background: var(--cream); padding: 44px 38px;
    transition: background 0.3s ease;
    position: relative; cursor: default;
  }
  .feature-card:hover { background: var(--white); }
  .feature-card:hover .feature-num { color: var(--gold); }
  .feature-card:hover .feature-icon-line { transform: scaleX(1); }
  .feature-num { font-family: var(--serif); font-size: 13px; color: var(--muted-2); margin-bottom: 28px; display: block; transition: color 0.3s; }
  .feature-icon-line {
    width: 32px; height: 2px; background: var(--gold);
    margin-bottom: 24px;
    transform: scaleX(0); transform-origin: left;
    transition: transform 0.4s cubic-bezier(.16,1,.3,1);
  }
  .feature-label {
    font-size: 10px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase;
    color: var(--muted-2); margin-bottom: 12px; display: block;
  }
  .feature-title { font-family: var(--serif); font-size: 22px; font-weight: 600; color: var(--ink); margin-bottom: 14px; line-height: 1.2; }
  .feature-desc { font-size: 14px; color: var(--muted); line-height: 1.75; font-weight: 400; }

  /* ── PILLARS ── */
  .pillars-section { padding: 120px 0; background: var(--ink); position: relative; overflow: hidden; }
  .pillars-glow {
    position: absolute; top: -100px; right: -100px;
    width: 700px; height: 700px;
    background: radial-gradient(circle, rgba(184,146,74,0.08) 0%, transparent 70%);
    pointer-events: none;
  }
  .pillars-header { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: end; margin-bottom: 80px; }
  .pillars-eyebrow { font-size: 11px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: var(--gold); margin-bottom: 18px; }
  .pillars-title { font-family: var(--serif); font-size: clamp(2.6rem, 4vw, 3.6rem); font-weight: 600; line-height: 1.08; color: var(--white); }
  .pillars-intro { font-size: 16px; color: rgba(255,255,255,0.4); line-height: 1.8; font-weight: 300; padding-top: 20px; }
  .pillars-grid {
    display: grid; grid-template-columns: repeat(4,1fr);
    gap: 1px; background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; overflow: hidden;
  }
  .pillar-card {
    background: rgba(255,255,255,0.02);
    padding: 48px 36px;
    transition: background 0.3s ease;
    position: relative;
  }
  .pillar-card:hover { background: rgba(255,255,255,0.05); }
  .pillar-card:hover .pillar-num { color: var(--gold-light); }
  .pillar-card:hover .pillar-rule { transform: scaleX(1); }
  .pillar-num {
    font-family: var(--serif); font-size: 42px; font-weight: 700;
    color: rgba(255,255,255,0.08); line-height: 1;
    margin-bottom: 24px; transition: color 0.4s ease;
  }
  .pillar-rule {
    width: 32px; height: 2px; background: var(--gold);
    margin-bottom: 20px;
    transform: scaleX(0); transform-origin: left;
    transition: transform 0.4s cubic-bezier(.16,1,.3,1);
  }
  .pillar-title { font-family: var(--serif); font-size: 20px; font-weight: 600; color: var(--white); margin-bottom: 14px; }
  .pillar-desc { font-size: 14px; color: rgba(255,255,255,0.45); line-height: 1.75; }

  /* ── STATS ── */
  .stats-section { padding: 0; background: var(--cream-2); border-top: 1px solid var(--rule); border-bottom: 1px solid var(--rule); }
  .stats-grid { display: grid; grid-template-columns: repeat(4,1fr); }
  .stat-card {
    padding: 72px 40px;
    border-right: 1px solid var(--rule);
    text-align: center;
    transition: background 0.3s ease;
  }
  .stat-card:last-child { border-right: none; }
  .stat-card:hover { background: var(--cream-3); }
  .stat-val {
    font-family: var(--serif);
    font-size: clamp(3rem, 5vw, 4.2rem);
    font-weight: 700; color: var(--ink); line-height: 1;
    margin-bottom: 10px;
  }
  .stat-label { font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); }

  /* ── WORKFLOW ── */
  .workflow-section { padding: 120px 0; background: var(--white); }
  .workflow-header { text-align: center; max-width: 640px; margin: 0 auto 80px; }
  .workflow-eyebrow { font-size: 11px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: var(--gold); margin-bottom: 18px; }
  .workflow-title { font-family: var(--serif); font-size: clamp(2.4rem, 4vw, 3.4rem); font-weight: 600; line-height: 1.08; color: var(--ink); }
  .workflow-steps { display: flex; flex-direction: column; gap: 0; border: 1px solid var(--rule); border-radius: 12px; overflow: hidden; }
  .workflow-step {
    display: grid; grid-template-columns: 80px 1fr;
    border-bottom: 1px solid var(--rule);
    transition: background 0.3s ease;
  }
  .workflow-step:last-child { border-bottom: none; }
  .workflow-step:hover { background: var(--cream); }
  .workflow-step-num {
    display: flex; align-items: center; justify-content: center;
    border-right: 1px solid var(--rule);
    padding: 36px 0;
    font-family: var(--serif); font-size: 20px; font-weight: 700; color: var(--muted-2);
  }
  .workflow-step:hover .workflow-step-num { color: var(--gold); }
  .workflow-step-content { padding: 32px 48px; display: flex; align-items: center; justify-content: space-between; gap: 40px; }
  .workflow-step-title { font-family: var(--serif); font-size: 20px; font-weight: 600; color: var(--ink); margin-bottom: 6px; }
  .workflow-step-desc { font-size: 14px; color: var(--muted); line-height: 1.7; max-width: 600px; }
  .workflow-step-tag {
    flex-shrink: 0; font-size: 11px; font-weight: 600; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--gold);
    padding: 6px 14px; border: 1px solid rgba(184,146,74,0.3); border-radius: 4px;
    white-space: nowrap;
  }

  /* ── CTA ── */
  .cta-section {
    padding: 140px 0;
    background: var(--ink);
    position: relative; overflow: hidden;
    text-align: center;
  }
  .cta-glow {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
    width: 900px; height: 500px;
    background: radial-gradient(ellipse, rgba(184,146,74,0.07) 0%, transparent 70%);
    pointer-events: none;
  }
  .cta-inner { position: relative; z-index: 10; max-width: 720px; margin: 0 auto; }
  .cta-eyebrow { font-size: 11px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: var(--gold); margin-bottom: 28px; }
  .cta-title { font-family: var(--serif); font-size: clamp(3rem, 5vw, 4.6rem); font-weight: 600; color: var(--white); line-height: 1.06; letter-spacing: -0.02em; margin-bottom: 28px; }
  .cta-title em { font-style: italic; color: var(--gold-light); }
  .cta-subtitle { font-size: 17px; font-weight: 300; color: rgba(255,255,255,0.45); line-height: 1.8; margin-bottom: 56px; }
  .cta-actions { display: flex; justify-content: center; align-items: center; gap: 20px; flex-wrap: wrap; }
  .cta-btn-main {
    display: inline-flex; align-items: center; gap: 10px;
    font-family: var(--sans); font-size: 15px; font-weight: 600;
    padding: 18px 44px; border-radius: 6px;
    background: var(--white); color: var(--ink);
    transition: all 0.3s ease; letter-spacing: 0.01em;
  }
  .cta-btn-main:hover { background: var(--cream); transform: translateY(-2px); box-shadow: 0 12px 32px rgba(255,255,255,0.1); }
  .cta-btn-outline {
    display: inline-flex; align-items: center; gap: 10px;
    font-family: var(--sans); font-size: 15px; font-weight: 500;
    padding: 18px 36px; border-radius: 6px;
    border: 1px solid rgba(255,255,255,0.18);
    color: rgba(255,255,255,0.65);
    transition: all 0.3s ease;
  }
  .cta-btn-outline:hover { border-color: rgba(255,255,255,0.45); color: #fff; }
  .cta-rule { width: 60px; height: 1px; background: rgba(255,255,255,0.12); margin: 60px auto 0; }
  .cta-trust { display: flex; justify-content: center; align-items: center; gap: 32px; margin-top: 40px; flex-wrap: wrap; }
  .cta-trust-item { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.4); }
  .cta-trust-dot { width: 5px; height: 5px; border-radius: 50%; background: #4ade80; }

  /* ── FOOTER ── */
  footer { background: #080808; border-top: 1px solid rgba(255,255,255,0.05); padding: 64px 0 40px; }
  .footer-top {
    display: grid; grid-template-columns: 2fr 1fr 1fr 1fr;
    gap: 60px; margin-bottom: 60px;
  }
  .footer-brand-name { font-family: var(--serif); font-size: 22px; font-weight: 600; color: var(--white); margin-bottom: 16px; }
  .footer-brand-desc { font-size: 14px; color: rgba(255,255,255,0.35); line-height: 1.75; max-width: 280px; }
  .footer-col-title { font-size: 10px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(255,255,255,0.25); margin-bottom: 20px; }
  .footer-links { display: flex; flex-direction: column; gap: 12px; }
  .footer-link { font-size: 14px; color: rgba(255,255,255,0.4); transition: color 0.2s; }
  .footer-link:hover { color: rgba(255,255,255,0.8); }
  .footer-bottom {
    border-top: 1px solid rgba(255,255,255,0.06);
    padding-top: 32px;
    display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;
  }
  .footer-copy { font-size: 13px; color: rgba(255,255,255,0.25); }
  .footer-badges { display: flex; align-items: center; gap: 20px; }
  .footer-badge { font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.25); padding: 6px 14px; border: 1px solid rgba(255,255,255,0.08); border-radius: 4px; }

  /* ── RESPONSIVE ── */
  @media (max-width: 1024px) {
    .hero { grid-template-columns: 1fr; }
    .hero-right { display: none; }
    .hero-left { padding: 130px 40px 80px; }
    .hero-bottom { grid-template-columns: repeat(4,1fr); }
    .features-header { grid-template-columns: 1fr; gap: 20px; }
    .pillars-header { grid-template-columns: 1fr; gap: 20px; }
    .pillars-grid { grid-template-columns: repeat(2,1fr); }
    .footer-top { grid-template-columns: 1fr 1fr; gap: 40px; }
  }
  @media (max-width: 768px) {
    .container { padding: 0 24px; }
    .nav-inner { padding: 0 24px; }
    .nav-links, .nav-actions { display: none; }
    .nav-mobile-toggle { display: block; }
    .features-grid { grid-template-columns: 1fr; }
    .stats-grid { grid-template-columns: repeat(2,1fr); }
    .stat-card:nth-child(2) { border-right: none; }
    .stat-card:nth-child(3), .stat-card:nth-child(4) { border-top: 1px solid var(--rule); }
    .hero-bottom { grid-template-columns: repeat(2,1fr); }
    .hero-stat:nth-child(2) { border-right: none; }
    .hero-stat:nth-child(3), .hero-stat:nth-child(4) { border-top: 1px solid rgba(255,255,255,0.07); }
    .workflow-step-content { flex-direction: column; align-items: flex-start; gap: 16px; padding: 28px 28px; }
    .footer-top { grid-template-columns: 1fr; }
    .pillar-card { padding: 36px 28px; }
    .hero-left { padding: 120px 24px 80px; }
    .features-section, .pillars-section, .workflow-section { padding: 80px 0; }
  }
`;

// ─── SUBCOMPONENTS ─────────────────────────────────────────────────────────

function Navbar({ scrolled, menuOpen, setMenuOpen }) {
  return (
    <nav className={`nav${scrolled ? ' scrolled' : ''}`}>
      <div className="nav-inner">
        <a href="#" className="nav-logo">
          <div className="nav-logo-mark">
            <span className="nav-logo-mark-inner">W</span>
          </div>
          <div className="nav-logo-texts">
            <span className="nav-logo-world">World</span>
            <span className="nav-logo-name">Uni-Learn</span>
          </div>
        </a>

        <div className="nav-links">
          {['Features', 'Pillars', 'Stats', 'Workflow'].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`} className="nav-link">{item}</a>
          ))}
        </div>

        <div className="nav-actions">
          <a href="/login" className="nav-signin">Sign In</a>
          <a href="/register-school" className="nav-cta">Get Started</a>
        </div>

        <button className="nav-mobile-toggle" onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            {menuOpen
              ? <><line x1="4" y1="4" x2="18" y2="18" stroke={scrolled ? '#0d0d0d' : '#fff'} strokeWidth="1.8" strokeLinecap="round" />
                <line x1="18" y1="4" x2="4" y2="18" stroke={scrolled ? '#0d0d0d' : '#fff'} strokeWidth="1.8" strokeLinecap="round" /></>
              : <><line x1="3" y1="7" x2="19" y2="7" stroke={scrolled ? '#0d0d0d' : '#fff'} strokeWidth="1.8" strokeLinecap="round" />
                <line x1="3" y1="13" x2="19" y2="13" stroke={scrolled ? '#0d0d0d' : '#fff'} strokeWidth="1.8" strokeLinecap="round" /></>
            }
          </svg>
        </button>
      </div>
      {menuOpen && (
        <div className="mobile-menu">
          {['Features', 'Pillars', 'Stats', 'Workflow'].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`} className="mobile-link" onClick={() => setMenuOpen(false)}>{item}</a>
          ))}
          <div className="mobile-actions">
            <a href="/login" className="mobile-btn" style={{ background: '#f3ede4', color: '#0d0d0d' }}>Sign In</a>
            <a href="/register-school" className="mobile-btn" style={{ background: '#0d0d0d', color: '#fff' }}>Get Started</a>
          </div>
        </div>
      )}
    </nav>
  );
}

function Hero() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);

  return (
    <section className="hero">
      {/* Left Content */}
      <div className="hero-left">
        <div className="hero-badge">
          <span className="hero-badge-dot" />
          <span className="hero-badge-text">Next-Gen School Ecosystem</span>
        </div>

        <h1 className="hero-title">
          Education<br />
          <em className="hero-title-accent">Reimagined.</em>
        </h1>

        <p className="hero-subtitle">
          Empower students, equip educators, and automate administrative reporting
          from a single unified platform built for Ghanaian schools.
        </p>

        <div className="hero-actions">
          <a href="/register-school" className="hero-btn-main">
            Register School <span className="arrow">→</span>
          </a>
          <a href="/login" className="hero-btn-outline">
            Sign In to Portal
          </a>
        </div>
      </div>

      {/* Right Image */}
      <div className="hero-right">
        <img src="/kids2.JPG" alt="Students learning" className="hero-right-img" />
        <div className="hero-right-overlay" />
      </div>

      {/* Bottom Stats */}
      <div className="hero-bottom">
        {STATS.map((s, i) => (
          <div className="hero-stat" key={i}>
            <div className="hero-stat-val">{s.value}{s.suffix}</div>
            <div className="hero-stat-lbl">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MarqueeBand() {
  return (
    <div className="marquee-band">
      <div className="marquee-track">
        {MARQUEE_ITEMS.map((item, i) => (
          <span className="marquee-item" key={i}>
            {item}
            <span className="marquee-dot" />
          </span>
        ))}
      </div>
    </div>
  );
}

function Reveal({ children, className = '', delay = 0, direction = 'up', style = {} }) {
  const { ref, inView } = useInView();
  const cls = direction === 'left' ? 'rv-l' : direction === 'right' ? 'rv-r' : 'rv';
  return (
    <div
      ref={ref}
      className={`${cls}${inView ? ' in' : ''} ${className}`}
      style={{ transitionDelay: `${delay}s`, ...style }}
    >
      {children}
    </div>
  );
}

function Features() {
  return (
    <section className="features-section" id="features">
      <div className="container">
        <div className="features-header">
          <Reveal direction="left">
            <div className="features-eyebrow">Everything You Need</div>
            <h2 className="features-title">A powerful ecosystem for modern education</h2>
          </Reveal>
          <Reveal direction="right" delay={0.1}>
            <p className="features-intro">
              Built from the ground up to handle the unique workflows of Ghanaian schools,
              providing clarity, automation, and scale from day one.
            </p>
          </Reveal>
        </div>

        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <Reveal key={i} delay={i * 0.07} style={{ display: 'contents' }}>
              <div className="feature-card">
                <span className="feature-num">{f.num}</span>
                <div className="feature-icon-line" />
                <span className="feature-label">{f.label}</span>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pillars() {
  return (
    <section className="pillars-section" id="pillars">
      <div className="pillars-glow" />
      <div className="container">
        <div className="pillars-header">
          <Reveal direction="left">
            <div className="pillars-eyebrow">Workflow</div>
            <h2 className="pillars-title">Four pillars of academic excellence</h2>
          </Reveal>
          <Reveal direction="right" delay={0.1}>
            <p className="pillars-intro">
              A clear, logical flow that connects administrators, teachers, and
              students into one seamless experience.
            </p>
          </Reveal>
        </div>

        <div className="pillars-grid">
          {PILLARS.map((p, i) => (
            <Reveal key={i} delay={i * 0.1} style={{ display: 'contents' }}>
              <div className="pillar-card">
                <div className="pillar-num">{p.num}</div>
                <div className="pillar-rule" />
                <h4 className="pillar-title">{p.title}</h4>
                <p className="pillar-desc">{p.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatsSection() {
  return (
    <section className="stats-section" id="stats">
      <div className="stats-grid">
        {STATS.map((s, i) => (
          <Reveal key={i} delay={i * 0.1} style={{ display: 'contents' }}>
            <div className="stat-card">
              <div className="stat-val">
                <AnimatedCounter end={s.value} suffix={s.suffix} />
              </div>
              <div className="stat-label">{s.label}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

const WORKFLOW_STEPS = [
  { step: '01', title: 'School Onboarding', desc: 'Register your school and configure your full academic structure — years, terms, classes, and departments — in minutes.', tag: 'Admin' },
  { step: '02', title: 'Staff & Student Enrollment', desc: 'Import student records and assign staff roles with role-specific access control and parent/guardian linking.', tag: 'Admin + Bursar' },
  { step: '03', title: 'Daily Teaching Operations', desc: 'Teachers log attendance, track syllabus coverage, and manage continuous assessment every single day.', tag: 'Teachers' },
  { step: '04', title: 'Fee Management & Collections', desc: 'Bursars manage fee structures, record daily collections, and issue digital invoices automatically.', tag: 'Bursar' },
  { step: '05', title: 'Student Engagement & Assessment', desc: 'Students access assignments, library resources, Typing Nitro, and school election voting through their portal.', tag: 'Students' },
  { step: '06', title: 'Term Closure & Reports', desc: 'Generate GES-compliant report cards, financial summaries, and send SMS notifications to parents — all in one click.', tag: 'All Roles' },
];

function Workflow() {
  return (
    <section className="workflow-section" id="workflow">
      <div className="container">
        <Reveal>
          <div className="workflow-header">
            <div className="workflow-eyebrow">How It Works</div>
            <h2 className="workflow-title">The complete school cycle, automated</h2>
          </div>
        </Reveal>

        <div className="workflow-steps">
          {WORKFLOW_STEPS.map((s, i) => (
            <Reveal key={i} delay={i * 0.07}>
              <div className="workflow-step">
                <div className="workflow-step-num">{s.step}</div>
                <div className="workflow-step-content">
                  <div>
                    <div className="workflow-step-title">{s.title}</div>
                    <div className="workflow-step-desc">{s.desc}</div>
                  </div>
                  <span className="workflow-step-tag">{s.tag}</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="cta-section">
      <div className="cta-glow" />
      <div className="container">
        <Reveal>
          <div className="cta-inner">
            <div className="cta-eyebrow">Ready to Transform Your School?</div>
            <h2 className="cta-title">
              Join the schools already<br />
              <em>ahead of the curve</em>
            </h2>
            <p className="cta-subtitle">
              Streamline operations, automate reporting, and elevate the academic
              experience for every student and educator.
            </p>
            <div className="cta-actions">
              <a href="/register-school" className="cta-btn-main">
                Register School for Free →
              </a>
              <a href="/login" className="cta-btn-outline">
                Sign In to Portal
              </a>
            </div>
            <div className="cta-rule" />
            <div className="cta-trust">
              <span className="cta-trust-item"><span className="cta-trust-dot" /> GES Compliant</span>
              <span className="cta-trust-item"><span className="cta-trust-dot" /> Cloud Secure</span>
              <span className="cta-trust-item"><span className="cta-trust-dot" /> 99% Uptime</span>
              <span className="cta-trust-item"><span className="cta-trust-dot" /> Built for Ghana</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer>
      <div className="container">
        <div className="footer-top">
          <div>
            <div className="footer-brand-name">World Uni-Learn</div>
            <p className="footer-brand-desc">
              The all-in-one School Management System built for Ghanaian schools.
              Empowering administrators, teachers, bursars, and students.
            </p>
          </div>

          <div>
            <div className="footer-col-title">Platform</div>
            <div className="footer-links">
              {['Features', 'How It Works', 'Pricing', 'Register School'].map(l => (
                <a key={l} href="#" className="footer-link">{l}</a>
              ))}
            </div>
          </div>

          <div>
            <div className="footer-col-title">Portals</div>
            <div className="footer-links">
              {['Admin Console', 'Teacher Portal', 'Bursar Portal', 'Student Portal'].map(l => (
                <a key={l} href="#" className="footer-link">{l}</a>
              ))}
            </div>
          </div>

          <div>
            <div className="footer-col-title">Contact</div>
            <div className="footer-links">
              <a href="mailto:hello@worldunilearn.com" className="footer-link">hello@worldunilearn.com</a>
              <a href="tel:+233537996934" className="footer-link">+233 537 996 934</a>
              <a href="https://reportgem.vercel.app" className="footer-link" target="_blank" rel="noreferrer">reportgem.vercel.app</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-copy">© {new Date().getFullYear()} World Uni-Learn Platform. Built for Ghana.</div>
          <div className="footer-badges">
            <span className="footer-badge">GES Compliant</span>
            <span className="footer-badge">Secure</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────

export default function LandingPage() {
  const scrolled = useScrolled(24);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', fontFamily: "'Outfit', system-ui, sans-serif", background: '#f9f6f1', color: '#0d0d0d' }}>
      <style>{CSS}</style>

      <Navbar scrolled={scrolled} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <Hero />
      <MarqueeBand />
      <Features />
      <Pillars />
      <StatsSection />
      <Workflow />
      <CTA />
      <Footer />
    </div>
  );
}