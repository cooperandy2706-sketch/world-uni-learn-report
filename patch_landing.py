import re

with open('src/pages/LandingPage.tsx', 'r') as f:
    content = f.read()

# 1. CSS Updates
css_hero_old = """  /* ── HERO ── */
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
  .shape-rect { width: 150px; height: 150px; border-radius: 8px; top: 20%; right: 5%; animation: float1 18s infinite ease-in-out; transform: rotate(15deg); }
  .shape-polygon { width: 100px; height: 100px; top: 15%; left: 5%; clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); animation: float2 14s infinite ease-in-out; background: rgba(124,58,237,0.05); }
  @media (min-width: 768px) {
    .shape-rect { width: 250px; height: 250px; border-radius: 40px; top: 30%; right: 15%; }
    .shape-polygon { width: 180px; height: 180px; top: 20%; left: 10%; }
  }

  .hero .container { position: relative; z-index: 10; }
  .hero-content { max-width: 700px; margin: 0 auto; text-align: center; overflow: visible; }
  
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
  .hero-subtitle { font-size: 1.05rem; color: rgba(255,255,255,0.7); margin-bottom: 2rem; line-height: 1.6; max-width: 600px; margin-inline: auto; font-weight: 600; padding: 0 0.5rem; }
  @media (min-width: 768px) { .hero-subtitle { font-size: 1.2rem; margin-bottom: 2.5rem; } }
  
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
  }"""

css_hero_new = """  /* ── HERO SLIDER ── */
  .hero { 
    position: relative; min-height: 100vh; display: flex; align-items: center;
    background: var(--primary); overflow: hidden;
    padding: 6rem 0 3rem;
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
  }"""

react_hero_old = """function Hero() {
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
          </p>
          <LandingSchoolSearch variant="hero" placeholder="Find a school…" />
          <div className="hero-btns">
            <a href="/register-school" className="btn-primary" style={{ padding: '1.2rem 2.5rem', fontSize: '1.05rem', borderRadius: '14px' }}>Get Started Free</a>
            <a href="/login" className="btn-login" style={{ fontSize: '1.05rem', padding: '1.2rem 2.5rem', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', transition: 'all 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>Sign In to Portal</a>
          </div>
        </div>
      </div>

    </section>
  );
}"""

react_hero_new = """const HERO_SLIDES = [
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
}"""

content = content.replace(css_hero_old, css_hero_new)
content = content.replace(react_hero_old, react_hero_new)
content = content.replace("<span>Acadera</span>", "<span>ASOS</span>")
content = content.replace("Take Acadera with you", "Take ASOS with you")
content = content.replace("Acadera Platform.", "Acadera School Operating System (ASOS).")

with open('src/pages/LandingPage.tsx', 'w') as f:
    f.write(content)
print("done")
