with open('src/pages/LandingPage.tsx', 'r') as f:
    content = f.read()

target = """<span className="logo-text-desktop">Acadera School Operating System</span>
            <span className="logo-text-mobile">ASOS</span>"""

# Replace only the first occurrence which is in the Navbar
content = content.replace(target, "<span>ASOS</span>", 1)

with open('src/pages/LandingPage.tsx', 'w') as f:
    f.write(content)

print("Navbar updated")
