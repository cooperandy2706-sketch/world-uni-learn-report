import re

with open('src/pages/LandingPage.tsx', 'r') as f:
    content = f.read()

# Add CSS classes
css_append = """  .logo-text-desktop { display: none; }
  .logo-text-mobile { display: inline; }
  @media (min-width: 1024px) {
    .logo-text-desktop { display: inline; }
    .logo-text-mobile { display: none; }
  }
"""
content = content.replace("  /* ── NAV ── */", css_append + "\n  /* ── NAV ── */")

# Fix Navbar Logo
nav_logo_old = "<span>ASOS</span>"
nav_logo_new = """<span className="logo-text-desktop">Acadera School Operating System</span>
            <span className="logo-text-mobile">ASOS</span>"""
# only replace the first occurrence (Navbar)
content = content.replace(nav_logo_old, nav_logo_new, 1)

# Fix Footer Logo
footer_logo_old = "<span style={{ color: 'white' }}>ASOS</span>"
footer_logo_new = """<span className="logo-text-desktop" style={{ color: 'white' }}>Acadera School Operating System</span>
                <span className="logo-text-mobile" style={{ color: 'white' }}>ASOS</span>"""
content = content.replace(footer_logo_old, footer_logo_new)

# Fix Hero Section Layout
hero_css_old = """  /* ── HERO SLIDER ── */
  .hero { 
    position: relative; min-height: 100vh; display: flex; align-items: center;
    background: var(--primary); overflow: hidden;
    padding: 6rem 0 3rem;
  }
  @media (min-width: 768px) { .hero { padding: 8rem 0 4rem; } }"""

hero_css_new = """  /* ── HERO SLIDER ── */
  .hero { 
    position: relative; min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: var(--primary); overflow: hidden;
    padding: 7rem 0 4rem;
  }
  @media (min-width: 768px) { .hero { padding: 8rem 0 4rem; } }"""
content = content.replace(hero_css_old, hero_css_new)

# Write back
with open('src/pages/LandingPage.tsx', 'w') as f:
    f.write(content)

print("Patch applied")
