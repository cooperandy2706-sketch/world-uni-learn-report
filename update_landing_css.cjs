const fs = require('fs');

const cssStartMarker = 'const CSS = `';
const cssEndMarker = '`;';

const newCss = `
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
  
  .global-contact-float {
    position: fixed; bottom: 1rem; right: 1rem; left: 1rem;
    background: rgba(30, 6, 70, 0.95); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.15);
    padding: 1rem; border-radius: 16px; display: flex; flex-direction: column; gap: 0.75rem; z-index: 9999;
    color: white; font-size: 0.85rem; font-weight: 600; text-align: center; align-items: center;
    box-shadow: 0 10px 30px rgba(0,0,0,0.4);
    transition: transform 0.3s;
  }
  @media (min-width: 768px) {
    .global-contact-float {
      bottom: 2rem; right: 2rem; left: auto; border-radius: 20px; align-items: flex-start; text-align: left;
      padding: 1.25rem 1.5rem; font-size: 0.95rem; white-space: nowrap;
    }
    .global-contact-float:hover { transform: translateY(-5px); }
  }
  .global-contact-item { display: flex; align-items: center; gap: 0.5rem; text-decoration: none; color: rgba(255,255,255,0.9); transition: color 0.3s; justify-content: center; width: 100%; }
  @media (min-width: 768px) { .global-contact-item { justify-content: flex-start; } }
  .global-contact-item:hover { color: #fbbf24; }
  .global-contact-header { font-size: 0.75rem; color: #fbbf24; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 800; margin-bottom: -0.25rem; }

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

  /* ── HERO ── */
  .hero { 
    position: relative; min-height: 100vh; display: flex; align-items: center;
    background: var(--primary); overflow: hidden;
    padding: 6rem 0 3rem; /* Tighter on mobile */
    animation: colorFade 15s infinite alternate ease-in-out;
  }
  @media (min-width: 768px) { .hero { padding: 8rem 0 4rem; } }
  
  .hero-shapes { position: absolute; inset: 0; pointer-events: none; z-index: 1; overflow: hidden; opacity: 0.3; }
  @media (min-width: 768px) { .hero-shapes { opacity: 0.4; } }
  .shape { position: absolute; background: rgba(255,255,255,0.03); backdrop-filter: blur(5px); border: 1px solid rgba(255,255,255,0.05); }
  .shape-circle-1 { width: 300px; height: 300px; border-radius: 50%; top: -50px; right: -50px; animation: float1 12s infinite ease-in-out; background: radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%); }
  .shape-circle-2 { width: 200px; height: 200px; border-radius: 50%; bottom: 0; left: -50px; animation: float2 15s infinite reverse ease-in-out; background: radial-gradient(circle, rgba(59,11,134,0.3) 0%, transparent 70%); }
  @media (min-width: 768px) {
    .shape-circle-1 { width: 400px; height: 400px; top: -100px; right: -50px; }
    .shape-circle-2 { width: 300px; height: 300px; bottom: -50px; left: -100px; }
  }
  .shape-rect { width: 150px; height: 150px; border-radius: 20px; top: 20%; right: 5%; animation: float1 18s infinite ease-in-out; transform: rotate(15deg); }
  .shape-polygon { width: 100px; height: 100px; top: 15%; left: 5%; clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); animation: float2 14s infinite ease-in-out; background: rgba(124,58,237,0.05); }
  @media (min-width: 768px) {
    .shape-rect { width: 250px; height: 250px; border-radius: 40px; top: 30%; right: 15%; }
    .shape-polygon { width: 180px; height: 180px; top: 20%; left: 10%; }
  }

  .hero .container { position: relative; z-index: 10; }
  .hero-content { max-width: 700px; margin: 0 auto; text-align: center; }
  
  .hero-badge {
    display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0.8rem;
    background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 100px; color: #fbbf24; font-size: 0.7rem; font-weight: 800;
    text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1.5rem;
    backdrop-filter: blur(10px);
  }
  @media (min-width: 768px) { .hero-badge { padding: 0.5rem 1rem; font-size: 0.75rem; } }
  
  .hero-title { 
    font-family: var(--sans); font-size: clamp(2.5rem, 10vw, 4.5rem); line-height: 1.15; font-weight: 900; letter-spacing: -0.02em;
    margin-bottom: 1.25rem; color: white;
  }
  .hero-subtitle { font-size: 1.05rem; color: rgba(255,255,255,0.7); margin-bottom: 2rem; line-height: 1.6; max-width: 600px; margin-inline: auto; font-weight: 400; padding: 0 0.5rem; }
  @media (min-width: 768px) { .hero-subtitle { font-size: 1.2rem; margin-bottom: 2.5rem; } }
  
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
    background: white; padding: 1.75rem; border-radius: 20px; border: 1px solid rgba(0,0,0,0.04);
    transition: all 0.4s ease; box-shadow: var(--shadow); position: relative; overflow: hidden;
  }
  @media (min-width: 768px) { .feature-card { padding: 2.5rem; border-radius: 24px; } }
  .feature-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); border-color: var(--accent); }
  @media (min-width: 768px) { .feature-card:hover { transform: translateY(-8px); } }
  
  .feature-num { font-family: var(--serif); font-size: 3rem; color: rgba(30, 6, 70, 0.03); font-weight: 900; margin-bottom: -1.5rem; line-height: 1; pointer-events: none; }
  @media (min-width: 768px) { .feature-num { font-size: 4rem; margin-bottom: -2rem; } }
  
  .feature-title { font-size: 1.25rem; font-weight: 800; color: var(--primary); margin-bottom: 0.75rem; }
  @media (min-width: 768px) { .feature-title { font-size: 1.35rem; margin-bottom: 1rem; } }
  
  .feature-desc { color: var(--text-light); font-size: 0.9rem; line-height: 1.6; font-weight: 500; }
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
    background: white; border-radius: 20px; padding: 2rem 1.5rem;
    box-shadow: 0 10px 30px rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.06);
    flex: 1; max-width: 100%; width: 100%; margin: 0 auto;
    transition: all 0.4s ease; display: flex; flex-direction: column;
  }
  @media (min-width: 768px) { .pricing-card { padding: 3rem 2.5rem; border-radius: 24px; max-width: 400px; box-shadow: 0 10px 40px rgba(0,0,0,0.04); } }
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
    padding: 1.75rem; background: white; border-radius: 20px; border: 1px solid rgba(0,0,0,0.04);
    transition: all 0.3s; box-shadow: var(--shadow);
  }
  @media (min-width: 768px) {
    .workflow-item { display: grid; grid-template-columns: 70px 1fr; gap: 1.5rem; align-items: start; text-align: left; padding: 2.5rem; border-radius: 24px; }
    .workflow-item:hover { border-color: var(--accent); box-shadow: var(--shadow-lg); transform: translateX(10px); }
  }
  
  .workflow-num { 
    width: 60px; height: 60px; background: #f5f3ff; color: var(--accent);
    display: flex; align-items: center; justify-content: center;
    border-radius: 14px; font-weight: 900; font-family: var(--serif); font-size: 1.25rem; margin: 0 auto;
  }
  @media (min-width: 768px) { .workflow-num { width: 70px; height: 70px; border-radius: 16px; font-size: 1.5rem; margin: 0; } }
  
  .workflow-content h4 { font-size: 1.15rem; font-weight: 800; margin-bottom: 0.5rem; color: var(--primary); }
  @media (min-width: 768px) { .workflow-content h4 { font-size: 1.25rem; } }
  .workflow-content p { font-size: 0.95rem; color: var(--text-light); font-weight: 500; }
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
    background: white; border: 1px solid rgba(0,0,0,0.07); border-radius: 16px;
    padding: 1.25rem 1.5rem; text-decoration: none; color: var(--primary);
    box-shadow: var(--shadow); transition: all 0.3s; width: 100%; justify-content: center;
  }
  @media (min-width: 640px) { .download-card { padding: 1.5rem 2.5rem; border-radius: 20px; width: auto; min-width: 240px; } }
  .download-card:hover { transform: translateY(-4px); box-shadow: 0 15px 30px rgba(0,0,0,0.08); border-color: var(--accent); }
  @media (min-width: 768px) { .download-card:hover { transform: translateY(-6px); box-shadow: 0 20px 40px rgba(0,0,0,0.1); } }
  
  .download-card-icon { width: 36px; height: 36px; flex-shrink: 0; }
  @media (min-width: 768px) { .download-card-icon { width: 48px; height: 48px; } }
  .download-card-text { text-align: left; }
  .download-card-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-light); }
  @media (min-width: 768px) { .download-card-label { font-size: 0.75rem; } }
  .download-card-name { font-size: 1.1rem; font-weight: 900; color: var(--primary); }
  @media (min-width: 768px) { .download-card-name { font-size: 1.2rem; } }
  .download-note { margin-top: 1.5rem; font-size: 0.75rem; color: var(--text-light); font-weight: 500; padding: 0 1rem; }
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
  .footer-link { color: rgba(255, 255, 255, 0.6); font-size: 0.95rem; text-decoration: none; transition: color 0.2s; font-weight: 500; display: block; padding: 0.25rem 0; }
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

const filePath = 'src/pages/LandingPage.tsx';
const currentFile = fs.readFileSync(filePath, 'utf8');

const startIndex = currentFile.indexOf(cssStartMarker);
const endIndex = currentFile.indexOf(cssEndMarker, startIndex + cssStartMarker.length);

if (startIndex !== -1 && endIndex !== -1) {
  const finalFile = currentFile.slice(0, startIndex) + cssStartMarker + newCss + currentFile.slice(endIndex + cssEndMarker.length - 2);
  fs.writeFileSync(filePath, finalFile);
  console.log('Successfully applied mobile-first CSS to LandingPage.tsx');
} else {
  console.error('Could not find CSS block in LandingPage.tsx');
}
