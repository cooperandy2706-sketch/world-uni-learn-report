import React, { useEffect, useRef, useState } from 'react';

// ─── HOOKS ────────────────────────────────────────────────────────────────────

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
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

function AnimatedCounter({ end, suffix = '' }: { end: number, suffix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView(0.5);
  useEffect(() => {
    if (!inView) return;
    let start: number | null = null;
    const duration = 2000;
    const step = (ts: number) => {
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
  // ── Admin & Core Infrastructure ──
  { num: '01', title: 'Command Palette', label: '⌘K Navigation', desc: 'Navigate the entire platform with natural language search. Jump to any student, class, or report in milliseconds.', color: '#7c3aed' },
  { num: '02', title: 'Data Isolation', label: 'Multi-Tenant Security', desc: 'Enterprise-grade Row Level Security ensures school data is completely isolated. Absolute privacy guaranteed.', color: '#0f172a' },
  { num: '03', title: 'Batch Promotions', label: 'Academic Transitions', desc: 'Move hundreds of students to the next academic year instantly with smart graduation and promotion algorithms.', color: '#db2777' },
  { num: '04', title: 'Asset & Facilities', label: 'Infrastructure', desc: 'Track school buses, lab equipment, and dormitory capacity from a centralized administrative dashboard.', color: '#475569' },
  
  // ── Finance & Bursary ──
  { num: '05', title: 'Dynamic Billing Engine', label: 'Smart Fees', desc: 'Automate term fees, daily collections, and arrears. Parents get real-time receipts, bursars get zero paperwork.', color: '#059669' },
  { num: '06', title: 'Scholarships', label: 'Financial Aid', desc: 'Assign full or partial percentage-based scholarships directly to student profiles to automatically adjust their billing.', color: '#10b981' },
  { num: '07', title: 'Admissions & Enquiries', label: 'Lead Tracking', desc: 'Digital admission pipelines. Convert prospect enquiries into enrolled students with just one click.', color: '#0ea5e9' },
  
  // ── Teachers & Academics ──
  { num: '08', title: 'Automated BECE Grading', label: 'GES Compliant', desc: 'Instant CA calculations, grade tallying, and GES-compliant report generation. Termly stress eliminated.', color: '#7c3aed' },
  { num: '09', title: 'Syllabus Tracker', label: 'Curriculum', desc: 'Teachers log daily lesson plans and track syllabus coverage percentages against term objectives.', color: '#f59e0b' },
  { num: '10', title: 'Staff Substitution', label: 'Operations', desc: 'When a teacher is absent, instantly aggregate their timetable onto a substitute teacher\'s dashboard.', color: '#8b5cf6' },
  
  // ── Students & Interactive Learning ──
  { num: '11', title: 'Digital Student Vault', label: 'Records', desc: 'Students can securely access their past report cards, health records, and academic history anytime.', color: '#0284c7' },
  { num: '12', title: 'School Elections', label: 'Digital Democracy', desc: 'Host secure SRC/Prefect elections. Students vote securely from their mobile portal with live administrative tallying.', color: '#14b8a6' },
  { num: '13', title: 'Global Resources', label: 'Digital Library', desc: 'Grant students access to PDFs, rich multimedia files, and textbook chapters for offline reading.', color: '#6366f1' },
  
  // ── Parents & Communication ──
  { num: '14', title: 'Smart SMS Hub', label: 'Instant Alerts', desc: 'Blast automated report cards, attendance alerts, and fee reminders directly to parents\' phones.', color: '#d97706' },
  { num: '15', title: 'Parent Portal', label: 'Transparency', desc: 'Parents log in to view their child\'s timetable, behavioral records, and pay tuition fees digitally.', color: '#ec4899' },
  { num: '16', title: 'Pastoral Care', label: 'Discipline', desc: 'Log disciplinary infractions, counseling sessions, and exeats, instantly alerting the linked parent.', color: '#eab308' },
  
  // ── Operations (Transport, Security, Health) ──
  { num: '17', title: 'Fleet Routing & GPS', label: 'Transport', desc: 'Turn-by-turn navigation for drivers with active student manifests and live GPS tracking for the administration.', color: '#ef4444' },
  { num: '18', title: 'Gate Scanners', label: 'Security', desc: 'Offline-first QR ID scanning. If Wi-Fi drops, attendance logs locally and syncs automatically when reconnected.', color: '#10b981' },
  { num: '19', title: 'Live Gate Dashboard', label: 'Real-time', desc: 'Security personnel monitor live statistics of late arrivals, total present students, and authorized exits via WebSockets.', color: '#3b82f6' },
  { num: '20', title: 'Driver SOS', label: 'Emergency', desc: 'One-tap SOS button for school buses that instantly broadcasts GPS coordinates and alerts all admins.', color: '#dc2626' },
  { num: '21', title: 'Clinic & Medical', label: 'Health', desc: 'Track student allergies, nurse visits, and medical emergencies securely tied to the student profile.', color: '#f43f5e' },
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
  'Academic Management Ghana', 'Smart Timetabling Accra', 'Digital Report Cards Kumasi',
  'Fee Automation Africa', 'SMS Alerts Parents', 'BECE Grading GES', 'Student Portals Ghana',
  'Teacher Tools West Africa', 'Bursar Suite ERP', 'School Elections Online', 'Digital Library Vault',
  'Ghanaian School Software', 'Education ERP Africa', 'Smart Schools Ghana',
];

const WORKFLOW_STEPS = [
  { step: '01', title: 'School Onboarding', desc: 'Register your school and configure your full academic structure — years, terms, classes, and departments — in minutes.', tag: 'Admin' },
  { step: '02', title: 'Staff & Student Enrollment', desc: 'Import student records and assign staff roles with role-specific access control and parent/guardian linking.', tag: 'Admin + Bursar' },
  { step: '03', title: 'Daily Teaching Operations', desc: 'Teachers log attendance, track syllabus coverage, and manage continuous assessment every single day.', tag: 'Teachers' },
  { step: '04', title: 'Fee Management & Collections', desc: 'Bursars manage fee structures, record daily collections, and issue digital invoices automatically.', tag: 'Bursar' },
  { step: '05', title: 'Student Engagement & Assessment', desc: 'Students access assignments, library resources, Typing Nitro, and school election voting through their portal.', tag: 'Students' },
  { step: '06', title: 'Term Closure & Reports', desc: 'Generate GES-compliant report cards, financial summaries, and send SMS notifications to parents — all in one click.', tag: 'All Roles' },
];

const PRICING_TIERS = [
  {
    name: 'Standard',
    desc: 'Perfect for small to medium schools beginning their digital transformation.',
    onboardingGHS: 'GH₵ 2,500',
    onboardingUSD: '$180',
    termGHS: 'GH₵ 800',
    termUSD: '$60',
    semesterGHS: 'GH₵ 1,200',
    semesterUSD: '$90',
    features: ['Up to 500 Students', 'Core Academic Management', 'Standard Report Cards', 'Fee Management', 'Email Support']
  },
  {
    name: 'Advanced',
    desc: 'Full-featured suite for growing institutions requiring robust communication and tracking.',
    onboardingGHS: 'GH₵ 5,000',
    onboardingUSD: '$350',
    termGHS: 'GH₵ 1,500',
    termUSD: '$110',
    semesterGHS: 'GH₵ 2,250',
    semesterUSD: '$165',
    features: ['Up to 2,000 Students', 'Automated SMS Alerts', 'Library & Fleet Management', 'Custom Grading Scales', 'Priority 24/7 Support']
  },
  {
    name: 'Custom',
    desc: 'Enterprise-grade architecture for large school groups and university networks.',
    onboardingGHS: 'Customized',
    onboardingUSD: 'Customized',
    termGHS: 'Tailored',
    termUSD: 'Tailored',
    semesterGHS: 'Tailored',
    semesterUSD: 'Tailored',
    features: ['Unlimited Students', 'Custom Feature Development', 'Dedicated Account Manager', 'On-Premise Backup Option', 'White-labeled App Setup']
  }
];

// ─── STYLES ───────────────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap');

  :root {
    --primary: #1e0646;
    --primary-light: #3b0b86;
    --accent: #7c3aed;
    --accent-light: #a78bfa;
    --text: #334155;
    --text-light: #64748b;
    --bg: #f8fafc;
    --white: #ffffff;
    --glass: rgba(255, 255, 255, 0.85);
    --glass-border: rgba(255, 255, 255, 0.3);
    --sans: 'Outfit', sans-serif;
    --serif: 'Playfair Display', serif;
    --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  }

  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

  html { scroll-behavior: smooth; font-size: 16px; }
  body { font-family: var(--sans); background: var(--bg); color: var(--text); overflow-x: hidden; line-height: 1.6; }
  
  .container { width: 100%; max-width: 1240px; margin: 0 auto; padding: 0 1.5rem; }

  /* ── UTILS ── */
  .text-gradient { background: linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .accent-gradient { background: linear-gradient(135deg, var(--accent) 0%, #fbbf24 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

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
    backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--glass-border);
    padding: 0.75rem 0;
    box-shadow: var(--shadow);
  }
  .nav-inner { display: flex; align-items: center; justify-content: space-between; }
  .logo { display: flex; align-items: center; gap: 0.75rem; font-weight: 800; font-size: 1.25rem; color: var(--primary); text-decoration: none; }
  .nav.hero-top .logo { color: white; }
  .nav.scrolled .logo { color: var(--primary); }
  
  .logo-icon { width: 40px; height: 40px; background: var(--accent); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-family: var(--serif); font-size: 1.5rem; }
  
  .nav-links { display: none; gap: 2.5rem; }
  @media (min-width: 768px) { .nav-links { display: flex; } }
  .nav-link { font-size: 0.95rem; font-weight: 600; color: var(--primary); text-decoration: none; transition: color 0.2s; position: relative; }
  .nav.hero-top .nav-link { color: rgba(255,255,255,0.8); }
  .nav.hero-top .nav-link:hover { color: white; }
  .nav.scrolled .nav-link { color: var(--text); }
  .nav.scrolled .nav-link:hover { color: var(--accent); }
  
  .nav-actions { display: none; gap: 1rem; align-items: center; }
  @media (min-width: 1024px) { .nav-actions { display: flex; } }
  .btn-login { font-size: 0.95rem; font-weight: 700; color: var(--primary); text-decoration: none; }
  .nav.hero-top .btn-login { color: white; }
  .nav.scrolled .btn-login { color: var(--primary); }
  
  .btn-primary { 
    background: var(--accent); color: white; padding: 0.75rem 1.75rem; border-radius: 10px; font-weight: 700; font-size: 0.95rem; text-decoration: none;
    transition: all 0.3s; box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3);
  }
  .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(124, 58, 237, 0.4); }

  .mobile-toggle { display: block; background: none; border: none; cursor: pointer; color: var(--primary); }
  .nav.hero-top .mobile-toggle { color: white; }
  .nav.scrolled .mobile-toggle { color: var(--primary); }
  @media (min-width: 768px) { .mobile-toggle { display: none; } }

  /* ── HERO REDESIGN ── */
  .hero { 
    position: relative;
    min-height: 100vh;
    display: flex; align-items: center;
    background: var(--primary);
    overflow: hidden;
    padding: 8rem 0 4rem;
  }
  
  /* The Background Image */
  .hero-bg {
    position: absolute;
    top: 0; right: 0; bottom: 0; left: 20%;
    background-image: url('/kids2.JPG');
    background-size: cover;
    background-position: center 30%;
    z-index: 1;
    opacity: 0.9;
  }
  @media (max-width: 1024px) {
    .hero-bg { left: 0; opacity: 0.4; }
  }

  /* The Color Fade Overlay */
  .hero-fade {
    position: absolute;
    top: 0; right: 0; bottom: 0; left: 0;
    /* Fades from solid primary to transparent to blend the image */
    background: linear-gradient(90deg, var(--primary) 0%, var(--primary) 45%, rgba(30, 6, 70, 0.8) 60%, transparent 100%);
    z-index: 2;
  }
  @media (max-width: 1024px) {
    .hero-fade { background: linear-gradient(0deg, var(--primary) 0%, rgba(30, 6, 70, 0.9) 100%); }
  }

  .hero .container { position: relative; z-index: 10; }
  
  .hero-content { max-width: 650px; }
  
  .hero-badge {
    display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem;
    background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 100px; color: #fbbf24; font-size: 0.75rem; font-weight: 800;
    text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1.5rem;
    backdrop-filter: blur(4px);
  }
  .hero-title { 
    font-family: var(--serif); font-size: clamp(3rem, 8vw, 5rem); line-height: 1.1; font-weight: 700;
    margin-bottom: 1.5rem; color: white;
  }
  .hero-subtitle { font-size: 1.2rem; color: rgba(255,255,255,0.8); margin-bottom: 2.5rem; line-height: 1.7; }
  
  .hero-btns { display: flex; flex-direction: column; gap: 1rem; }
  @media (min-width: 640px) { .hero-btns { flex-direction: row; align-items: center; } }
  
  /* ── MARQUEE ── */
  .marquee { background: var(--primary-light); color: white; padding: 1.5rem 0; overflow: hidden; white-space: nowrap; border-top: 1px solid rgba(255,255,255,0.1); border-bottom: 1px solid rgba(255,255,255,0.1); }
  .marquee-content { display: inline-block; animation: marquee 30s linear infinite; }
  .marquee-item { display: inline-flex; align-items: center; gap: 1rem; padding: 0 2rem; font-weight: 700; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.1em; }
  .marquee-dot { width: 6px; height: 6px; background: var(--accent); border-radius: 50%; }
  @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }

  /* ── SECTIONS ── */
  .section { padding: 7rem 0; }
  .section-header { text-align: center; max-width: 700px; margin: 0 auto 4rem; }
  .section-header.left { text-align: left; margin: 0 0 3rem 0; }
  .section-eyebrow { font-weight: 800; font-size: 0.85rem; color: var(--accent); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 1rem; }
  .section-title { font-family: var(--serif); font-size: clamp(2.5rem, 5vw, 3.5rem); font-weight: 700; color: var(--primary); line-height: 1.1; }
  
  .features-grid { display: grid; gap: 2rem; }
  @media (min-width: 640px) { .features-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (min-width: 1024px) { .features-grid { grid-template-columns: repeat(3, 1fr); } }
  
  .feature-card {
    background: white; padding: 2.5rem; border-radius: 24px; border: 1px solid rgba(0,0,0,0.04);
    transition: all 0.4s ease; box-shadow: var(--shadow); position: relative; overflow: hidden;
  }
  .feature-card:hover { transform: translateY(-8px); box-shadow: var(--shadow-lg); border-color: var(--accent); }
  .feature-num { font-family: var(--serif); font-size: 4rem; color: rgba(30, 6, 70, 0.03); font-weight: 900; margin-bottom: -2rem; line-height: 1; pointer-events: none; }
  .feature-title { font-size: 1.35rem; font-weight: 800; color: var(--primary); margin-bottom: 1rem; }
  .feature-desc { color: var(--text-light); font-size: 0.95rem; line-height: 1.7; font-weight: 500; }

  /* ── PILLARS ── */
  .pillars { background: var(--primary); color: white; position: relative; }
  .pillars::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('https://www.transparenttextures.com/patterns/cubes.png'); opacity: 0.05; pointer-events: none; }
  .pillars .section-title { color: white; }
  .pillars .feature-card { background: rgba(255, 255, 255, 0.03); border-color: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); }
  .pillars .feature-card:hover { background: rgba(255, 255, 255, 0.08); border-color: rgba(255, 255, 255, 0.15); }
  .pillars .feature-title { color: white; }
  .pillars .feature-desc { color: rgba(255, 255, 255, 0.6); }

  /* ── HORIZONTAL SCROLLING PRICING ── */
  .pricing-section { background: var(--bg); position: relative; overflow: hidden; }
  .pricing-header-container { text-align: center; margin-bottom: 3rem; }
  
  .pricing-marquee-wrapper {
    display: flex;
    overflow: hidden;
    user-select: none;
    gap: 2rem;
    padding: 2rem 0 4rem;
  }
  
  .pricing-marquee-content {
    display: flex;
    flex-shrink: 0;
    justify-content: space-around;
    min-width: 100%;
    gap: 2rem;
    animation: scrollX 35s linear infinite;
  }
  
  .pricing-marquee-wrapper:hover .pricing-marquee-content {
    animation-play-state: paused;
  }
  
  @keyframes scrollX {
    from { transform: translateX(0); }
    to { transform: translateX(calc(-100% - 2rem)); }
  }

  .pricing-card {
    background: white; border-radius: 32px; padding: 2.5rem;
    box-shadow: 0 10px 30px rgba(0,0,0,0.04); border: 1px solid rgba(0,0,0,0.06);
    width: 380px; flex-shrink: 0;
    transition: all 0.3s ease;
  }
  .pricing-card:hover {
    transform: translateY(-10px);
    box-shadow: 0 20px 40px rgba(0,0,0,0.08);
    border-color: var(--accent);
  }
  
  .pricing-tier { font-size: 1.6rem; font-weight: 800; color: var(--primary); margin-bottom: 0.5rem; }
  .pricing-desc { font-size: 0.95rem; color: var(--text-light); margin-bottom: 2rem; line-height: 1.5; }
  
  .pricing-cost-group { display: grid; gap: 1rem; margin-bottom: 2rem; padding-bottom: 2rem; border-bottom: 1px dashed #e2e8f0; }
  .pricing-label { font-size: 0.8rem; font-weight: 800; color: var(--accent); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem; }
  
  .pricing-amount { display: flex; align-items: baseline; gap: 0.5rem; }
  .pricing-ghs { font-family: var(--serif); font-size: 1.8rem; font-weight: 700; color: var(--primary); line-height: 1; }
  .pricing-usd { font-size: 0.9rem; font-weight: 700; color: var(--text-light); }
  
  .pricing-features { list-style: none; display: flex; flex-direction: column; gap: 0.85rem; margin-bottom: 2.5rem; }
  .pricing-feature { display: flex; align-items: center; gap: 0.75rem; font-weight: 600; font-size: 0.9rem; color: var(--text); }
  .pricing-check { width: 22px; height: 22px; border-radius: 50%; background: #f0fdf4; color: #16a34a; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800; flex-shrink: 0; }

  /* ── WORKFLOW ── */
  .workflow-list { display: grid; gap: 1.5rem; }
  .workflow-item {
    display: grid; grid-template-columns: 70px 1fr; gap: 1.5rem; align-items: start;
    padding: 2.5rem; background: white; border-radius: 24px; border: 1px solid rgba(0,0,0,0.04);
    transition: all 0.3s; box-shadow: var(--shadow);
  }
  .workflow-item:hover { border-color: var(--accent); box-shadow: var(--shadow-lg); transform: translateX(10px); }
  .workflow-num { 
    width: 70px; height: 70px; background: #f5f3ff; color: var(--accent);
    display: flex; align-items: center; justify-content: center;
    border-radius: 16px; font-weight: 900; font-family: var(--serif); font-size: 1.5rem;
  }
  .workflow-content h4 { font-size: 1.25rem; font-weight: 800; margin-bottom: 0.5rem; color: var(--primary); }
  .workflow-content p { font-size: 1rem; color: var(--text-light); font-weight: 500; }
  .workflow-tag { 
    display: inline-block; margin-top: 1rem; font-size: 0.75rem; font-weight: 800;
    color: white; text-transform: uppercase; letter-spacing: 0.05em;
    padding: 0.35rem 0.85rem; background: var(--primary); border-radius: 8px;
  }

  /* ── STATS ── */
  .stats { background: white; border-top: 1px solid rgba(0,0,0,0.05); border-bottom: 1px solid rgba(0,0,0,0.05); }
  .stats-grid { display: grid; gap: 2rem; text-align: center; }
  @media (min-width: 640px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (min-width: 1024px) { .stats-grid { grid-template-columns: repeat(4, 1fr); } }
  .stat-item h3 { font-family: var(--serif); font-size: 4rem; font-weight: 700; color: var(--primary); margin-bottom: 0.5rem; line-height: 1; }
  .stat-item p { font-size: 0.85rem; font-weight: 800; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.1em; }

  /* ── CTA ── */
  .cta { background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%); color: white; text-align: center; position: relative; overflow: hidden; }
  .cta::before { content: ''; position: absolute; width: 400px; height: 400px; background: var(--accent); filter: blur(100px); border-radius: 50%; top: -200px; left: -200px; opacity: 0.3; }
  .cta-title { color: white; margin-bottom: 1.5rem; position: relative; z-index: 10; }
  .cta-subtitle { color: rgba(255, 255, 255, 0.8); max-width: 600px; margin: 0 auto 3rem; font-size: 1.1rem; position: relative; z-index: 10; }
  
  /* ── FOOTER ── */
  .footer { background: #080808; color: white; padding: 5rem 0 2.5rem; }
  .footer-grid { display: grid; gap: 4rem; }
  @media (min-width: 768px) { .footer-grid { grid-template-columns: 1.5fr 1fr 1fr; } }
  .footer-logo { margin-bottom: 1.5rem; }
  .footer-desc { color: rgba(255, 255, 255, 0.5); font-size: 0.95rem; line-height: 1.8; max-width: 320px; }
  .footer-col h5 { font-size: 0.85rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: var(--accent); margin-bottom: 1.5rem; }
  .footer-links { list-style: none; display: grid; gap: 0.85rem; }
  .footer-link { color: rgba(255, 255, 255, 0.6); font-size: 0.95rem; text-decoration: none; transition: color 0.2s; font-weight: 500; }
  .footer-link:hover { color: white; }
  .footer-bottom { border-top: 1px solid rgba(255, 255, 255, 0.1); margin-top: 4rem; padding-top: 2rem; display: flex; flex-direction: column; gap: 1rem; align-items: center; text-align: center; font-size: 0.85rem; color: rgba(255, 255, 255, 0.4); }
  @media (min-width: 768px) { .footer-bottom { flex-direction: row; justify-content: space-between; text-align: left; } }

  /* ── MOBILE MENU ── */
  .mobile-menu {
    position: fixed; inset: 0; background: var(--primary); z-index: 2000;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 2rem; transform: translateX(100%); transition: transform 0.4s ease;
  }
  .mobile-menu.open { transform: translateX(0); }
  .mobile-link { font-size: 2rem; font-family: var(--serif); font-weight: 600; color: white; text-decoration: none; }
  .mobile-close { position: absolute; top: 1.5rem; right: 1.5rem; color: white; background: none; border: none; font-size: 1.5rem; cursor: pointer; }
`;

// ─── SUBCOMPONENTS ─────────────────────────────────────────────────────────

function Navbar({ scrolled, setMenuOpen }: { scrolled: boolean, setMenuOpen: (v: boolean) => void }) {
  // If not scrolled, we are at the top of the hero (which is dark purple)
  const navClass = scrolled ? 'nav scrolled' : 'nav hero-top';
  
  return (
    <nav className={navClass}>
      <div className="container">
        <div className="nav-inner">
          <a href="#" className="logo">
            <div className="logo-icon">W</div>
            <span>World Uni-Learn</span>
          </a>
          
          <div className="nav-links">
            {['Features', 'Pillars', 'Workflow', 'Pricing'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="nav-link" aria-label={`Navigate to ${item}`}>{item}</a>
            ))}
          </div>
          
          <div className="nav-actions">
            <a href="/login" className="btn-login">Sign In</a>
            <a href="/register-school" className="btn-primary">Register School</a>
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
      {/* Background Image & Color Fade */}
      <div className="hero-bg" />
      <div className="hero-fade" />
      
      <div className="container">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="marquee-dot" style={{ background: '#fbbf24' }} />
            <span>Next-Gen School Ecosystem</span>
          </div>
          <h1 className="hero-title">
            Education <br />
            <span className="accent-gradient">Reimagined.</span>
          </h1>
          <p className="hero-subtitle">
            Empower students, equip educators, and automate administrative GES reporting
            from a single unified platform built specifically for Ghanaian and West African schools.
            The ultimate School Management System.
          </p>
          <div className="hero-btns">
            <a href="/register-school" className="btn-primary" style={{ padding: '1.1rem 2.5rem', fontSize: '1.05rem' }}>Register Your School</a>
            <a href="/login" className="btn-login" style={{ fontSize: '1.05rem', borderBottom: '2px solid rgba(255,255,255,0.3)', marginLeft: '1rem', paddingBottom: '2px', transition: 'border-color 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'white'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'}>Sign In to Portal</a>
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

function SectionHeader({ eyebrow, title, light = false, align = 'center' }: { eyebrow: string, title: string, light?: boolean, align?: 'center' | 'left' }) {
  return (
    <div className={`section-header ${align === 'left' ? 'left' : ''}`}>
      <p className="section-eyebrow">{eyebrow}</p>
      <h2 className="section-title" style={{ color: light ? 'white' : 'var(--primary)' }}>{title}</h2>
    </div>
  );
}

function Reveal({ children }: { children: React.ReactNode }) {
  const { ref, inView } = useInView();
  return (
    <div ref={ref} className={`reveal ${inView ? 'in' : ''}`}>
      {children}
    </div>
  );
}

function PricingSection() {
  const renderCards = () => PRICING_TIERS.map((tier, i) => (
    <div className="pricing-card" key={i}>
      <h3 className="pricing-tier">{tier.name}</h3>
      <p className="pricing-desc">{tier.desc}</p>
      
      <div className="pricing-cost-group">
        <div>
          <div className="pricing-label">One-Time Onboarding</div>
          <div className="pricing-amount">
            <span className="pricing-ghs">{tier.onboardingGHS}</span>
            <span className="pricing-usd">{tier.onboardingUSD}</span>
          </div>
        </div>
        <div>
          <div className="pricing-label">Termly Fee (Lower)</div>
          <div className="pricing-amount">
            <span className="pricing-ghs">{tier.termGHS}</span>
            <span className="pricing-usd">{tier.termUSD}</span>
          </div>
        </div>
        <div>
          <div className="pricing-label">Semester Fee (Higher)</div>
          <div className="pricing-amount">
            <span className="pricing-ghs">{tier.semesterGHS}</span>
            <span className="pricing-usd">{tier.semesterUSD}</span>
          </div>
        </div>
      </div>

      <ul className="pricing-features">
        {tier.features.map((feature, j) => (
          <li className="pricing-feature" key={j}>
            <span className="pricing-check">✓</span>
            {feature}
          </li>
        ))}
      </ul>
      
      <a href="/register-school" className="btn-primary" style={{ display: 'block', textAlign: 'center', background: i === 1 ? 'var(--primary)' : 'var(--accent)', marginTop: 'auto' }}>
        {i === 2 ? 'Contact Sales' : 'Select ' + tier.name}
      </a>
    </div>
  ));

  return (
    <section className="section pricing-section" id="pricing">
      <div className="container pricing-header-container">
        <SectionHeader 
          eyebrow="Transparent Pricing" 
          title="Simple pricing for schools of all sizes." 
        />
        <p style={{ color: 'var(--text-light)', fontSize: '1.1rem', maxWidth: 600, margin: '0 auto' }}>
          Our pricing scales with your institution. Choose between Termly or Semester-based billing options.
        </p>
      </div>
      
      <div className="pricing-marquee-wrapper">
        <div className="pricing-marquee-content">
          {renderCards()}
        </div>
        {/* Duplicate content for seamless infinite scrolling */}
        <div className="pricing-marquee-content" aria-hidden="true">
          {renderCards()}
        </div>
      </div>
    </section>
  )
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
        {['Features', 'Pillars', 'Workflow', 'Pricing', 'Stats'].map(item => (
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

      <PricingSection />

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
                <li><a href="https://worldunilearn.com" className="footer-link" target="_blank" rel="noreferrer">worldunilearn.com</a></li>
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