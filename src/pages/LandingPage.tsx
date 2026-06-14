import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { SchoolSearchInput } from '../components/public/SchoolSearchInput';
import { usePublicSchools } from '../hooks/usePublicSchools';
import '../styles/school-directory.css';

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
    onboardingGHS: 'GH₵ 1,800',
    onboardingUSD: '$120',
    termGHS: 'GH₵ 800',
    termUSD: '$60',
    semesterGHS: 'GH₵ 1,200',
    semesterUSD: '$90',
    features: ['Up to 500 Students', 'Core Academic Management', 'Standard Report Cards', 'Fee Management', 'Email Support']
  },
  {
    name: 'Advanced',
    desc: 'Full-featured suite for growing institutions requiring robust communication and tracking.',
    onboardingGHS: 'GH₵ 2,700',
    onboardingUSD: '$190',
    termGHS: 'GH₵ 1,200',
    termUSD: '$90',
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
  
  .container { width: 100%; max-width: 1240px; margin: 0 auto; padding: 0 1.25rem; }
  @media (min-width: 768px) { .container { padding: 0 2rem; } }

  /* ── UTILS ── */
  .text-gradient { background: linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .accent-gradient { background: linear-gradient(135deg, var(--accent) 0%, #fbbf24 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

  /* ── ANIMATIONS ── */
  .reveal { opacity: 0; transform: translateY(20px); transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1); }
  .reveal.in { opacity: 1; transform: translateY(0); }

  @keyframes float1 {
    0% { transform: translateY(0) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(5deg); }
    100% { transform: translateY(0) rotate(0deg); }
  }
  @keyframes float2 {
    0% { transform: translateY(0) translateX(0) scale(1); }
    50% { transform: translateY(-15px) translateX(15px) scale(1.05); }
    100% { transform: translateY(0) translateX(0) scale(1); }
  }
  @keyframes colorFade {
    0% { background: linear-gradient(135deg, var(--primary) 0%, #170238 100%); }
    50% { background: linear-gradient(135deg, #170238 0%, var(--primary-light) 100%); }
    100% { background: linear-gradient(135deg, var(--primary) 0%, #170238 100%); }
  }
  @keyframes drawArt { to { stroke-dashoffset: 0; } }

  .hero-art { display: none; } /* Hidden on mobile to reduce clutter */
  @media (min-width: 1024px) {
    .hero-art { display: block; position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0.4; pointer-events: none; z-index: 1; filter: drop-shadow(0 0 12px rgba(251, 191, 36, 0.5)); }
    .hero-art path, .hero-art circle, .hero-art rect { stroke: #fbbf24; stroke-width: 2.5; fill: none; stroke-dasharray: 2000; stroke-dashoffset: 2000; animation: drawArt 20s cubic-bezier(0.4, 0, 0.2, 1) forwards infinite alternate; }
  }

  .logo-text-desktop { display: none; }
  .logo-text-mobile { display: inline; }
  @media (min-width: 1024px) {
    .logo-text-desktop { display: inline; }
    .logo-text-mobile { display: none; }
  }

  /* ── NAV ── */
  .nav { position: fixed; top: 0; left: 0; right: 0; z-index: 1000; transition: all 0.3s ease; padding: 1rem 0; }
  @media (min-width: 768px) { .nav { padding: 1.25rem 0; } }
  .nav.scrolled { background: var(--glass); backdrop-filter: blur(16px); border-bottom: 1px solid var(--glass-border); padding: 0.75rem 0; box-shadow: var(--shadow); }
  
  .nav-inner { display: flex; align-items: center; justify-content: space-between; }
  .logo { display: flex; align-items: center; gap: 0.75rem; font-weight: 800; font-size: 1.15rem; color: var(--primary); text-decoration: none; }
  @media (min-width: 768px) { .logo { font-size: 1.25rem; } }
  .nav.hero-top .logo { color: white; }
  .nav.scrolled .logo { color: var(--primary); }
  
  .logo-icon { width: 36px; height: 36px; background: var(--accent); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-family: var(--serif); font-size: 1.3rem; }
  @media (min-width: 768px) { .logo-icon { width: 40px; height: 40px; border-radius: 12px; font-size: 1.5rem; } }
  
  .nav-links { display: none; gap: 2.5rem; }
  @media (min-width: 860px) { .nav-links { display: flex; } }
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
    background: var(--accent); color: white; padding: 0.85rem 1.5rem; border-radius: 10px; font-weight: 700; font-size: 0.95rem; text-decoration: none;
    transition: all 0.3s; box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3); text-align: center;
  }
  .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(124, 58, 237, 0.4); }

  .mobile-toggle { display: flex; align-items: center; justify-content: center; background: none; border: none; cursor: pointer; color: var(--primary); width: 44px; height: 44px; margin-right: -8px; }
  .nav.hero-top .mobile-toggle { color: white; }
  .nav.scrolled .mobile-toggle { color: var(--primary); }
  @media (min-width: 860px) { .mobile-toggle { display: none; } }

  /* ── HERO SLIDER ── */
  .hero { 
    position: relative; min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: var(--primary); overflow: hidden;
    padding: 7rem 0 4rem;
  }
  @media (min-width: 768px) { .hero { padding: 8rem 0 4rem; } }

  .hero-slide {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
    opacity: 0; transition: opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1), transform 1.2s cubic-bezier(0.4, 0, 0.2, 1);
    transform: scale(1.05); pointer-events: none;
  }
  .hero-slide.active { opacity: 1; transform: scale(1); pointer-events: auto; z-index: 2; }
  
  .hero-slide-bg {
    position: absolute; inset: 0; background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
  }
  .hero-slide.active .hero-slide-bg {
    animation: colorFade 15s infinite alternate ease-in-out;
  }
  .slide-indicators {
    position: absolute; bottom: 2rem; left: 50%; transform: translateX(-50%);
    display: flex; gap: 0.75rem; z-index: 20;
  }
  .slide-indicator {
    width: 12px; height: 12px; border-radius: 50%; background: rgba(255,255,255,0.2);
    cursor: pointer; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); border: none; padding: 0;
  }
  .slide-indicator.active { background: var(--accent); transform: scale(1.5); box-shadow: 0 0 10px rgba(251, 191, 36, 0.5); }

  .hero-shapes { position: absolute; inset: 0; pointer-events: none; z-index: 1; overflow: hidden; opacity: 0.3; }
  @media (min-width: 768px) { .hero-shapes { opacity: 0.4; } }
  .shape { position: absolute; background: rgba(255,255,255,0.03); backdrop-filter: blur(5px); border: 1px solid rgba(255,255,255,0.05); }
  .shape-circle-1 { width: 300px; height: 300px; border-radius: 50%; top: -50px; right: -50px; animation: float1 12s infinite ease-in-out; background: radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%); }
  .shape-circle-2 { width: 200px; height: 200px; border-radius: 50%; bottom: 0; left: -50px; animation: float2 15s infinite reverse ease-in-out; background: radial-gradient(circle, rgba(59,11,134,0.3) 0%, transparent 70%); }
  @media (min-width: 768px) {
    .shape-circle-1 { width: 400px; height: 400px; top: -100px; right: -50px; }
    .shape-circle-2 { width: 300px; height: 300px; bottom: -50px; left: -100px; }
  }
  .shape-rect { width: 150px; height: 150px; border-radius: 8px; top: 20%; right: 5%; animation: float1 18s infinite ease-in-out; transform: rotate(15deg); }
  .shape-polygon { width: 100px; height: 100px; top: 15%; left: 5%; clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); animation: float2 14s infinite ease-in-out; background: rgba(124,58,237,0.05); }
  @media (min-width: 768px) {
    .shape-rect { width: 250px; height: 250px; border-radius: 40px; top: 30%; right: 15%; }
    .shape-polygon { width: 180px; height: 180px; top: 20%; left: 10%; }
  }

  .hero .container { position: relative; z-index: 10; width: 100%; display: flex; justify-content: center; }
  .hero-content { max-width: 750px; text-align: center; overflow: visible; opacity: 0; transform: translateY(30px); transition: opacity 0.8s ease 0.4s, transform 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.4s; }
  .hero-slide.active .hero-content { opacity: 1; transform: translateY(0); }
  
  .hero-badge {
    display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0.8rem;
    background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 100px; color: #fbbf24; font-size: 0.7rem; font-weight: 800;
    text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1.5rem;
    backdrop-filter: blur(10px);
  }
  @media (min-width: 768px) { .hero-badge { padding: 0.5rem 1rem; font-size: 0.75rem; } }
  
  .hero-title { 
    font-family: var(--sans); font-size: clamp(2.5rem, 9vw, 4.5rem); line-height: 1.15; font-weight: 900; letter-spacing: -0.02em;
    margin-bottom: 1.25rem; color: white;
  }
  .hero-subtitle { font-size: 1.05rem; color: rgba(255,255,255,0.8); margin-bottom: 2rem; line-height: 1.6; max-width: 650px; margin-inline: auto; font-weight: 500; padding: 0 0.5rem; }
  @media (min-width: 768px) { .hero-subtitle { font-size: 1.25rem; margin-bottom: 2.5rem; } }
  
  .hero-search {
    display: block; width: 100%; max-width: 420px; margin: 0 auto 1.5rem; padding: 0 1rem;
  }
  @media (min-width: 768px) { .hero-search { display: none; } }
  .mobile-search-wrap { width: 100%; max-width: 340px; margin: 0 0 0.5rem; }

  .hero-btns { display: flex; flex-direction: column; gap: 1rem; justify-content: center; width: 100%; padding: 0 1rem; }
  .hero-btns .btn-primary, .hero-btns .btn-login { width: 100%; }
  @media (min-width: 640px) { 
    .hero-btns { flex-direction: row; align-items: center; width: auto; padding: 0; } 
    .hero-btns .btn-primary, .hero-btns .btn-login { width: auto; }
  }
  
  /* ── MARQUEE ── */
  .marquee { background: rgba(0,0,0,0.2); backdrop-filter: blur(10px); color: white; padding: 1rem 0; overflow: hidden; white-space: nowrap; border-top: 1px solid rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.05); }
  @media (min-width: 768px) { .marquee { padding: 1.5rem 0; } }
  .marquee-content { display: inline-block; animation: marquee 25s linear infinite; }
  .marquee-item { display: inline-flex; align-items: center; gap: 0.75rem; padding: 0 1.5rem; font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.7); }
  @media (min-width: 768px) { .marquee-item { font-size: 0.85rem; padding: 0 2rem; gap: 1rem; } }
  .marquee-dot { width: 6px; height: 6px; background: var(--accent); border-radius: 50%; }
  @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }

  /* ── SECTIONS ── */
  .section { padding: 4rem 0; }
  @media (min-width: 768px) { .section { padding: 7rem 0; } }
  
  .section-header { text-align: center; max-width: 700px; margin: 0 auto 3rem; }
  @media (min-width: 768px) { .section-header { margin: 0 auto 4rem; } }
  .section-header.left { text-align: left; margin: 0 0 2.5rem 0; }
  @media (min-width: 768px) { .section-header.left { margin: 0 0 3rem 0; } }
  
  .section-eyebrow { font-weight: 800; font-size: 0.75rem; color: var(--accent); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.75rem; }
  @media (min-width: 768px) { .section-eyebrow { font-size: 0.85rem; margin-bottom: 1rem; } }
  
  .section-title { font-family: var(--sans); font-size: clamp(2rem, 7vw, 3.5rem); font-weight: 800; letter-spacing: -0.02em; color: var(--primary); line-height: 1.15; }
  
  .features-grid { display: grid; gap: 1.5rem; }
  @media (min-width: 640px) { .features-grid { grid-template-columns: repeat(2, 1fr); gap: 2rem; } }
  @media (min-width: 1024px) { .features-grid { grid-template-columns: repeat(3, 1fr); } }
  
  .feature-card {
    background: white; padding: 1.75rem; border-radius: 8px; border: 1px solid rgba(0,0,0,0.04);
    transition: all 0.4s ease; box-shadow: var(--shadow); position: relative; overflow: hidden;
  }
  @media (min-width: 768px) { .feature-card { padding: 2.5rem; border-radius: 12px; } }
  .feature-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); border-color: var(--accent); }
  @media (min-width: 768px) { .feature-card:hover { transform: translateY(-8px); } }
  
  .feature-num { font-family: var(--serif); font-size: 3rem; color: rgba(30, 6, 70, 0.03); font-weight: 900; margin-bottom: -1.5rem; line-height: 1; pointer-events: none; }
  @media (min-width: 768px) { .feature-num { font-size: 4rem; margin-bottom: -2rem; } }
  
  .feature-title { font-size: 1.25rem; font-weight: 800; color: var(--primary); margin-bottom: 0.75rem; }
  @media (min-width: 768px) { .feature-title { font-size: 1.35rem; margin-bottom: 1rem; } }
  
  .feature-desc { color: var(--text-light); font-size: 0.9rem; line-height: 1.6; font-weight: 600; }
  @media (min-width: 768px) { .feature-desc { font-size: 0.95rem; line-height: 1.7; } }

  /* ── PILLARS ── */
  .pillars { background: var(--primary); color: white; position: relative; }
  .pillars::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('https://www.transparenttextures.com/patterns/cubes.png'); opacity: 0.05; pointer-events: none; }
  .pillars .section-title { color: white; }
  .pillars .feature-card { background: rgba(255, 255, 255, 0.03); border-color: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); }
  .pillars .feature-card:hover { background: rgba(255, 255, 255, 0.08); border-color: rgba(255, 255, 255, 0.15); }
  .pillars .feature-title { color: white; }
  .pillars .feature-desc { color: rgba(255, 255, 255, 0.7); }

  /* ── VERTICAL SCROLLING PRICING ── */
  .pricing-section { background: var(--bg); position: relative; overflow: hidden; padding: 4rem 0; }
  @media (min-width: 768px) { .pricing-section { padding: 7rem 0; } }
  .pricing-header-container { text-align: center; margin-bottom: 3rem; }
  @media (min-width: 768px) { .pricing-header-container { margin-bottom: 4rem; } }
  
  .pricing-toggle-wrapper {
    display: inline-flex; align-items: center; gap: 0.75rem;
    background: white; padding: 0.4rem 0.75rem; border-radius: 100px;
    box-shadow: var(--shadow); border: 1px solid rgba(0,0,0,0.05); margin: 0 auto;
  }
  @media (min-width: 768px) { .pricing-toggle-wrapper { gap: 1rem; padding: 0.5rem 1rem; } }
  .pricing-toggle-wrapper span { font-size: 0.85rem; font-weight: 700; color: var(--text-light); transition: color 0.3s; }
  @media (min-width: 768px) { .pricing-toggle-wrapper span { font-size: 0.9rem; } }
  .pricing-toggle-wrapper span.active { color: var(--primary); }
  
  .pricing-toggle-btn { width: 50px; height: 28px; background: var(--accent); border-radius: 30px; border: none; position: relative; cursor: pointer; transition: background 0.3s; outline: none; }
  @media (min-width: 768px) { .pricing-toggle-btn { width: 60px; height: 32px; } }
  .pricing-toggle-circle { width: 20px; height: 20px; background: white; border-radius: 50%; position: absolute; top: 4px; left: 4px; transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
  @media (min-width: 768px) { .pricing-toggle-circle { width: 24px; height: 24px; } }
  .pricing-toggle-btn.toggled .pricing-toggle-circle { transform: translateX(22px); }
  @media (min-width: 768px) { .pricing-toggle-btn.toggled .pricing-toggle-circle { transform: translateX(28px); } }

  .pricing-cards-container {
    display: flex; flex-direction: column; gap: 1.5rem;
    padding: 0.5rem 0 2rem;
  }
  @media (min-width: 1024px) { .pricing-cards-container { flex-direction: row; justify-content: center; gap: 2rem; padding: 1rem 0 3rem; } }

  .pricing-card {
    background: white; border-radius: 8px; padding: 2rem 1.5rem;
    box-shadow: 0 10px 30px rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.06);
    flex: 1; max-width: 100%; width: 100%; margin: 0 auto;
    transition: all 0.4s ease; display: flex; flex-direction: column;
  }
  @media (min-width: 768px) { .pricing-card { padding: 3rem 2.5rem; border-radius: 12px; max-width: 400px; box-shadow: 0 10px 40px rgba(0,0,0,0.04); } }
  @media (min-width: 1024px) { .pricing-card.featured { transform: scale(1.05); z-index: 10; border-color: var(--accent); box-shadow: 0 20px 50px rgba(124,58,237,0.1); } }
  
  .pricing-card:hover { transform: translateY(-3px); box-shadow: 0 15px 30px rgba(0,0,0,0.06); }
  @media (min-width: 768px) { .pricing-card:hover { transform: translateY(-5px); box-shadow: 0 20px 40px rgba(0,0,0,0.08); } }
  @media (min-width: 1024px) { .pricing-card.featured:hover { transform: scale(1.05) translateY(-5px); } }
  
  .pricing-tier { font-size: 1.5rem; font-weight: 900; color: var(--primary); margin-bottom: 0.5rem; letter-spacing: -0.02em; }
  @media (min-width: 768px) { .pricing-tier { font-size: 1.8rem; } }
  .pricing-desc { font-size: 0.9rem; color: var(--text-light); margin-bottom: 1.5rem; line-height: 1.5; }
  @media (min-width: 768px) { .pricing-desc { font-size: 0.95rem; margin-bottom: 2rem; } }
  
  .pricing-cost-group { margin-bottom: 2rem; padding-bottom: 2rem; border-bottom: 1px dashed #e2e8f0; }
  @media (min-width: 768px) { .pricing-cost-group { margin-bottom: 2.5rem; padding-bottom: 2.5rem; } }
  .pricing-label { font-size: 0.75rem; font-weight: 800; color: var(--accent); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; }
  @media (min-width: 768px) { .pricing-label { font-size: 0.8rem; } }
  
  .pricing-amount { display: flex; align-items: baseline; gap: 0.5rem; }
  .pricing-ghs { font-family: var(--sans); font-size: 2rem; font-weight: 900; color: var(--primary); line-height: 1; letter-spacing: -0.03em; }
  @media (min-width: 768px) { .pricing-ghs { font-size: 2.5rem; } }
  .pricing-usd { font-size: 0.9rem; font-weight: 700; color: var(--text-light); }
  @media (min-width: 768px) { .pricing-usd { font-size: 1rem; } }
  
  .pricing-features { list-style: none; display: flex; flex-direction: column; gap: 0.85rem; margin-bottom: 2rem; }
  @media (min-width: 768px) { .pricing-features { gap: 1rem; margin-bottom: 3rem; } }
  .pricing-feature { display: flex; align-items: flex-start; gap: 0.75rem; font-weight: 600; font-size: 0.9rem; color: var(--text); }
  @media (min-width: 768px) { .pricing-feature { font-size: 0.95rem; } }
  .pricing-check { width: 18px; height: 18px; border-radius: 50%; background: #f5f3ff; color: var(--accent); display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 800; flex-shrink: 0; margin-top: 2px; }
  @media (min-width: 768px) { .pricing-check { width: 20px; height: 20px; font-size: 0.75rem; } }

  /* ── WORKFLOW ── */
  .workflow-list { display: flex; flex-direction: column; gap: 1rem; }
  @media (min-width: 768px) { .workflow-list { display: grid; gap: 1.5rem; } }
  
  .workflow-item {
    display: flex; flex-direction: column; align-items: center; text-align: center; gap: 1rem;
    padding: 1.75rem; background: white; border-radius: 8px; border: 1px solid rgba(0,0,0,0.04);
    transition: all 0.3s; box-shadow: var(--shadow);
  }
  @media (min-width: 768px) {
    .workflow-item { display: grid; grid-template-columns: 70px 1fr; gap: 1.5rem; align-items: start; text-align: left; padding: 2.5rem; border-radius: 12px; }
    .workflow-item:hover { border-color: var(--accent); box-shadow: var(--shadow-lg); transform: translateX(10px); }
  }
  
  .workflow-num { 
    width: 60px; height: 60px; background: #f5f3ff; color: var(--accent);
    display: flex; align-items: center; justify-content: center;
    border-radius: 14px; font-weight: 900; font-family: var(--serif); font-size: 1.25rem; margin: 0 auto;
  }
  @media (min-width: 768px) { .workflow-num { width: 70px; height: 70px; border-radius: 8px; font-size: 1.5rem; margin: 0; } }
  
  .workflow-content h4 { font-size: 1.15rem; font-weight: 800; margin-bottom: 0.5rem; color: var(--primary); }
  @media (min-width: 768px) { .workflow-content h4 { font-size: 1.25rem; } }
  .workflow-content p { font-size: 0.95rem; color: var(--text-light); font-weight: 600; }
  @media (min-width: 768px) { .workflow-content p { font-size: 1rem; } }
  .workflow-tag { 
    display: inline-block; margin-top: 1rem; font-size: 0.7rem; font-weight: 800;
    color: white; text-transform: uppercase; letter-spacing: 0.05em;
    padding: 0.3rem 0.75rem; background: var(--primary); border-radius: 6px;
  }
  @media (min-width: 768px) { .workflow-tag { font-size: 0.75rem; padding: 0.35rem 0.85rem; border-radius: 8px; } }

  /* ── STATS ── */
  .stats { background: white; border-top: 1px solid rgba(0,0,0,0.05); border-bottom: 1px solid rgba(0,0,0,0.05); padding: 3rem 0; }
  @media (min-width: 768px) { .stats { padding: 4rem 0; } }
  .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; text-align: center; }
  @media (min-width: 1024px) { .stats-grid { grid-template-columns: repeat(4, 1fr); gap: 2rem; } }
  .stat-item h3 { font-family: var(--serif); font-size: 2.5rem; font-weight: 700; color: var(--primary); margin-bottom: 0.25rem; line-height: 1; }
  @media (min-width: 768px) { .stat-item h3 { font-size: 3.5rem; margin-bottom: 0.5rem; } }
  @media (min-width: 1024px) { .stat-item h3 { font-size: 4rem; } }
  .stat-item p { font-size: 0.75rem; font-weight: 800; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.1em; }
  @media (min-width: 768px) { .stat-item p { font-size: 0.85rem; } }

  /* ── DOWNLOAD ── */
  .download-section { background: var(--bg); text-align: center; position: relative; overflow: hidden; padding: 4rem 0; }
  @media (min-width: 768px) { .download-section { padding: 7rem 0; } }
  .download-section::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at center, rgba(124,58,237,0.05) 0%, transparent 70%); pointer-events: none; }
  .download-cards { display: flex; flex-direction: column; gap: 1rem; justify-content: center; margin-top: 2rem; padding: 0 1rem; }
  @media (min-width: 640px) { .download-cards { flex-direction: row; gap: 1.5rem; margin-top: 3rem; padding: 0; } }
  
  .download-card {
    display: flex; align-items: center; gap: 1rem;
    background: white; border: 1px solid rgba(0,0,0,0.07); border-radius: 8px;
    padding: 1.25rem 1.5rem; text-decoration: none; color: var(--primary);
    box-shadow: var(--shadow); transition: all 0.3s; width: 100%; justify-content: center;
  }
  @media (min-width: 640px) { .download-card { padding: 1.5rem 2.5rem; border-radius: 8px; width: auto; min-width: 240px; } }
  .download-card:hover { transform: translateY(-4px); box-shadow: 0 15px 30px rgba(0,0,0,0.08); border-color: var(--accent); }
  @media (min-width: 768px) { .download-card:hover { transform: translateY(-6px); box-shadow: 0 20px 40px rgba(0,0,0,0.1); } }
  
  .download-card-icon { width: 36px; height: 36px; flex-shrink: 0; }
  @media (min-width: 768px) { .download-card-icon { width: 48px; height: 48px; } }
  .download-card-text { text-align: left; }
  .download-card-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-light); }
  @media (min-width: 768px) { .download-card-label { font-size: 0.75rem; } }
  .download-card-name { font-size: 1.1rem; font-weight: 900; color: var(--primary); }
  @media (min-width: 768px) { .download-card-name { font-size: 1.2rem; } }
  .download-note { margin-top: 1.5rem; font-size: 0.75rem; color: var(--text-light); font-weight: 600; padding: 0 1rem; }
  @media (min-width: 768px) { .download-note { margin-top: 1.75rem; font-size: 0.85rem; padding: 0; } }

  /* ── CTA ── */
  .cta { background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%); color: white; text-align: center; position: relative; overflow: hidden; padding: 4rem 1rem; }
  @media (min-width: 768px) { .cta { padding: 7rem 0; } }
  .cta::before { content: ''; position: absolute; width: 300px; height: 300px; background: var(--accent); filter: blur(80px); border-radius: 50%; top: -150px; left: -150px; opacity: 0.3; }
  @media (min-width: 768px) { .cta::before { width: 400px; height: 400px; filter: blur(100px); top: -200px; left: -200px; } }
  .cta-title { color: white; margin-bottom: 1rem; position: relative; z-index: 10; font-size: clamp(2rem, 7vw, 3rem); }
  @media (min-width: 768px) { .cta-title { margin-bottom: 1.5rem; } }
  .cta-subtitle { color: rgba(255, 255, 255, 0.8); max-width: 600px; margin: 0 auto 2rem; font-size: 1rem; position: relative; z-index: 10; }
  @media (min-width: 768px) { .cta-subtitle { margin: 0 auto 3rem; font-size: 1.1rem; } }
  
  .cta .btn-primary { width: 100%; display: block; padding: 1.25rem 1rem !important; }
  @media (min-width: 640px) { .cta .btn-primary { width: auto; display: inline-block; padding: 1.25rem 3rem !important; } }

  /* ── FOOTER ── */
  .footer { background: #080808; color: white; padding: 4rem 0 2rem; text-align: center; }
  @media (min-width: 768px) { .footer { padding: 5rem 0 2.5rem; text-align: left; } }
  .footer-grid { display: flex; flex-direction: column; gap: 3rem; align-items: center; }
  @media (min-width: 768px) { .footer-grid { display: grid; grid-template-columns: 1.5fr 1fr 1fr; gap: 4rem; align-items: start; } }
  .footer-logo { margin-bottom: 1rem; justify-content: center; }
  @media (min-width: 768px) { .footer-logo { margin-bottom: 1.5rem; justify-content: flex-start; } }
  .footer-desc { color: rgba(255, 255, 255, 0.5); font-size: 0.9rem; line-height: 1.7; max-width: 300px; margin: 0 auto; }
  @media (min-width: 768px) { .footer-desc { font-size: 0.95rem; line-height: 1.8; max-width: 320px; margin: 0; } }
  .footer-col h5 { font-size: 0.8rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: var(--accent); margin-bottom: 1rem; }
  @media (min-width: 768px) { .footer-col h5 { font-size: 0.85rem; margin-bottom: 1.5rem; } }
  .footer-links { list-style: none; display: flex; flex-direction: column; gap: 0.75rem; }
  @media (min-width: 768px) { .footer-links { display: grid; gap: 0.85rem; } }
  .footer-link { color: rgba(255, 255, 255, 0.6); font-size: 0.95rem; text-decoration: none; transition: color 0.2s; font-weight: 600; display: block; padding: 0.25rem 0; }
  .footer-link:hover { color: white; }
  .footer-bottom { border-top: 1px solid rgba(255, 255, 255, 0.1); margin-top: 3rem; padding-top: 2rem; display: flex; flex-direction: column; gap: 1rem; align-items: center; text-align: center; font-size: 0.8rem; color: rgba(255, 255, 255, 0.4); }
  @media (min-width: 768px) { .footer-bottom { margin-top: 4rem; flex-direction: row; justify-content: space-between; text-align: left; font-size: 0.85rem; } }

  /* ── MOBILE MENU ── */
  .mobile-menu {
    position: fixed; inset: 0; background: var(--primary); z-index: 2000;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 1.5rem; transform: translateX(100%); transition: transform 0.4s ease;
    padding: 2rem;
  }
  .mobile-menu.open { transform: translateX(0); }
  .mobile-link { font-size: 1.8rem; font-family: var(--serif); font-weight: 600; color: white; text-decoration: none; padding: 0.5rem; }
  @media (min-width: 400px) { .mobile-link { font-size: 2rem; } }
  .mobile-close { position: absolute; top: 1rem; right: 1rem; color: white; background: rgba(255,255,255,0.1); border: none; font-size: 1.2rem; cursor: pointer; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
`;

// ─── SUBCOMPONENTS ─────────────────────────────────────────────────────────

function LandingSchoolSearch({
  variant,
  placeholder = 'Search schools by name or city…',
  onNavigate,
}: {
  variant: 'hero' | 'menu'
  placeholder?: string
  onNavigate?: () => void
}) {
  const { data: schools = [] } = usePublicSchools()
  const [query, setQuery] = useState('')

  return (
    <div className={variant === 'hero' ? 'hero-search' : 'mobile-search-wrap'}>
      <SchoolSearchInput
        schools={schools}
        value={query}
        onChange={setQuery}
        variant="hero"
        placeholder={placeholder}
        onSubmit={onNavigate}
      />
    </div>
  )
}

function Navbar({ scrolled, setMenuOpen }: { scrolled: boolean, setMenuOpen: (v: boolean) => void }) {
  // If not scrolled, we are at the top of the hero (which is dark purple)
  const navClass = scrolled ? 'nav scrolled' : 'nav hero-top';

  return (
    <nav className={navClass}>
      <div className="container">
        <div className="nav-inner">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="logo" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: 0 }}>
            <img loading="lazy" src="/icon-512.png" alt="Acadera Logo" className="logo-icon" style={{ background: 'transparent' }} />
            <span>ASOS</span>
          </button>

          <div className="nav-links">
            {['Features', 'Pillars', 'Workflow', 'Pricing', 'Download'].map(item => (
              <button
                key={item}
                className="nav-link"
                aria-label={`Navigate to ${item}`}
                style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
                onClick={() => {
                  document.getElementById(item.toLowerCase())?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
              >{item}</button>
            ))}
          </div>

          <div className="nav-actions">
            <Link to="/schools" className="btn-login">Explore Schools</Link>
            <Link to="/login" className="btn-login">Sign In</Link>
            <Link to="/register-school" className="btn-primary">Register School</Link>
          </div>

          <button className="mobile-toggle" onClick={() => setMenuOpen(true)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
        </div>
      </div>
    </nav>
  );
}

const HERO_SLIDES = [
  {
    badge: 'Welcome to ASOS',
    title: <>Education <br/><span className="accent-gradient">Reimagined.</span></>,
    subtitle: 'Empower students, equip educators, and automate administrative GES reporting from a single unified OS built specifically for modern schools.',
  },
  {
    badge: 'Total Control',
    title: <>Seamless <br/><span className="accent-gradient">Management.</span></>,
    subtitle: 'Manage fees, attendance, fleet tracking, and complex academic records through the intuitive Acadera School Operating System (ASOS).',
  },
  {
    badge: 'Engage & Inspire',
    title: <>Next-Gen <br/><span className="accent-gradient">Learning.</span></>,
    subtitle: 'Provide an exceptional digital experience for students and parents with instant updates, digital libraries, and smart reporting.',
  }
];

function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="hero">
      <svg className="hero-art" viewBox="0 0 1000 1000" preserveAspectRatio="none">
        <path d="M-200,800 C100,600 300,1000 500,800 C700,600 900,900 1200,700" />
        <path d="M-100,200 C200,400 400,100 600,300 C800,500 1000,200 1200,400" />
        <path d="M 200,-100 Q 400,400 800,-100" />
        <circle cx="850" cy="850" r="100" />
        <rect x="150" y="700" width="100" height="100" transform="rotate(45 200 750)" />
      </svg>
      <div className="hero-shapes">
        <div className="shape shape-circle-1" />
        <div className="shape shape-circle-2" />
        <div className="shape shape-rect" />
        <div className="shape shape-polygon" />
      </div>

      {HERO_SLIDES.map((slide, index) => (
        <div key={index} className={`hero-slide ${index === currentSlide ? 'active' : ''}`}>
          <div className="hero-slide-bg" />
          <div className="container">
            <div className="hero-content">
              <div className="hero-badge">
                <span className="marquee-dot" style={{ background: '#fbbf24' }} />
                <span>{slide.badge}</span>
              </div>
              <h1 className="hero-title">
                {slide.title}
              </h1>
              <p className="hero-subtitle">
                {slide.subtitle}
              </p>
              {index === 0 && <LandingSchoolSearch variant="hero" placeholder="Find a school…" />}
              <div className="hero-btns">
                <a href="/register-school" className="btn-primary" style={{ padding: '1.2rem 2.5rem', fontSize: '1.05rem', borderRadius: '14px' }}>Get Started Free</a>
                <a href="/login" className="btn-login" style={{ fontSize: '1.05rem', padding: '1.2rem 2.5rem', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', transition: 'all 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>Sign In to ASOS</a>
              </div>
            </div>
          </div>
        </div>
      ))}

      <div className="slide-indicators">
        {HERO_SLIDES.map((_, idx) => (
          <button 
            key={idx} 
            className={`slide-indicator ${idx === currentSlide ? 'active' : ''}`}
            onClick={() => setCurrentSlide(idx)}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
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
  const [billingCycle, setBillingCycle] = useState<'term' | 'semester'>('term');

  return (
    <section className="section pricing-section" id="pricing">
      <div className="container pricing-header-container">
        <SectionHeader
          eyebrow="Transparent Pricing"
          title="Simple pricing for schools of all sizes."
        />
        <p style={{ color: 'var(--text-light)', fontSize: '1.1rem', maxWidth: 600, margin: '0 auto', marginBottom: '2.5rem' }}>
          Our pricing scales with your institution. Choose between Termly or Semester-based billing options.
        </p>

        <div className="pricing-toggle-wrapper">
          <span className={billingCycle === 'term' ? 'active' : ''}>Termly Billing</span>
          <button
            className={`pricing-toggle-btn ${billingCycle === 'semester' ? 'toggled' : ''}`}
            onClick={() => setBillingCycle(prev => prev === 'term' ? 'semester' : 'term')}
            aria-label="Toggle billing cycle"
          >
            <div className="pricing-toggle-circle"></div>
          </button>
          <span className={billingCycle === 'semester' ? 'active' : ''}>Semester Billing</span>
        </div>
      </div>

      <div className="container">
        <div className="pricing-cards-container">
          {PRICING_TIERS.map((tier, i) => {
            const currentGHS = billingCycle === 'term' ? tier.termGHS : tier.semesterGHS;
            const currentUSD = billingCycle === 'term' ? tier.termUSD : tier.semesterUSD;

            return (
              <div className={`pricing-card ${i === 1 ? 'featured' : ''}`} key={i}>
                <h3 className="pricing-tier">{tier.name}</h3>
                <p className="pricing-desc">{tier.desc}</p>

                <div className="pricing-cost-group">
                  <div className="pricing-amount">
                    <span className="pricing-ghs">{currentGHS}</span>
                    <span className="pricing-usd">{currentUSD}</span>
                  </div>
                  <div className="pricing-label">per {billingCycle}</div>

                  <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px dashed #e2e8f0' }}>
                    <div className="pricing-label">One-Time Onboarding</div>
                    <div className="pricing-amount">
                      <span className="pricing-ghs" style={{ fontSize: '1.25rem' }}>{tier.onboardingGHS}</span>
                      <span className="pricing-usd" style={{ fontSize: '0.85rem' }}>{tier.onboardingUSD}</span>
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

                <a href="/register-school" className="btn-primary" style={{ display: 'block', textAlign: 'center', background: i === 1 ? 'var(--primary)' : 'var(--accent)', marginTop: 'auto', padding: '1rem' }}>
                  {i === 2 ? 'Contact Sales' : 'Select ' + tier.name}
                </a>
              </div>
            )
          })}
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
        <LandingSchoolSearch
          variant="menu"
          onNavigate={() => setMenuOpen(false)}
        />
        {['Features', 'Pillars', 'Workflow', 'Pricing', 'Download'].map(item => (
          <button
            key={item}
            className="mobile-link"
            style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', width: '100%', textAlign: 'left' }}
            onClick={() => {
              setMenuOpen(false)
              setTimeout(() => {
                document.getElementById(item.toLowerCase())?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }, 300)
            }}
          >{item}</button>
        ))}
        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', padding: '0 2rem' }}>
          <Link to="/login" className="btn-primary" style={{ background: 'white', color: 'var(--primary)', textAlign: 'center' }} onClick={() => setMenuOpen(false)}>Sign In</Link>
          <Link to="/register-school" className="btn-primary" style={{ background: 'var(--accent)', textAlign: 'center' }} onClick={() => setMenuOpen(false)}>Get Started</Link>
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

      {/* Download Section */}
      <section className="section download-section" id="download">
        <div className="container">
          <Reveal>
            <SectionHeader eyebrow="Desktop App" title="Take ASOS with you, everywhere." />
            <p style={{ color: 'var(--text-light)', fontSize: '1.1rem', maxWidth: 560, margin: '0 auto' }}>
              Download the native desktop app for a faster, always-available experience — even with limited internet.
            </p>
            <div className="download-cards">
              <a
                href="https://github.com/cooperandy2706-sketch/world-uni-learn-report/releases/latest"
                target="_blank"
                rel="noreferrer"
                className="download-card"
              >
                {/* Apple icon */}
                <svg className="download-card-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.14-2.18 1.27-2.16 3.79.03 2.97 2.6 3.96 2.63 3.97-.03.07-.41 1.4-1.32 2.76zM13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <div className="download-card-text">
                  <div className="download-card-label">Download for</div>
                  <div className="download-card-name">macOS</div>
                </div>
              </a>
              <a
                href="https://github.com/cooperandy2706-sketch/world-uni-learn-report/releases/latest"
                target="_blank"
                rel="noreferrer"
                className="download-card"
              >
                {/* Windows icon */}
                <svg className="download-card-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/>
                </svg>
                <div className="download-card-text">
                  <div className="download-card-label">Download for</div>
                  <div className="download-card-name">Windows</div>
                </div>
              </a>
            </div>
            <p className="download-note">✦ Free download &nbsp;·&nbsp; Auto-updates via GitHub Releases &nbsp;·&nbsp; v0.0.0</p>
          </Reveal>
        </div>
      </section>

      <section className="section cta">
        <div className="container">
          <Reveal>
            <h2 className="section-title cta-title">Ready to Transform Your School?</h2>
            <p className="cta-subtitle">Join the schools already ahead of the curve. Streamline operations, automate reporting, and elevate the academic experience.</p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Link to="/register-school" className="btn-primary" style={{ background: 'white', color: 'var(--primary)', padding: '1.25rem 3rem' }}>Register School for Free</Link>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-col">
              <div className="logo footer-logo">
                <img loading="lazy" src="/icon-512.png" alt="Logo" className="logo-icon" style={{ background: 'none' }} />
                <span style={{ color: 'white' }}>Acadera</span>
              </div>
              <p className="footer-desc">The all-in-one School Management System built for Ghanaian schools. Empowering administrators, teachers, bursars, and students.</p>
            </div>
            <div className="footer-col">
              <h5>Platform</h5>
              <ul className="footer-links">
                {['Features', 'How It Works', 'Pricing'].map(l => (
                  <li key={l}><button className="footer-link" style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', padding: 0 }} onClick={() => {
                    const sectionId = l === 'How It Works' ? 'workflow' : l.toLowerCase()
                    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}>{l}</button></li>
                ))}
                <li><Link to="/register-school" className="footer-link">Register School</Link></li>
              </ul>
            </div>
            <div className="footer-col">
              <h5>Contact</h5>
              <ul className="footer-links">
                <li><a href="mailto:hello@acadera.com" className="footer-link">hello@acadera.com</a></li>
                <li><a href="tel:+233537996934" className="footer-link">+233 537 996 934</a></li>
                <li><a href="https://novaratech.com" className="footer-link" target="_blank" rel="noreferrer">acadera.com</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} Acadera School Operating System (ASOS). Built by NovaraTech for Africa.</p>
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