// src/pages/admin/PosterMakerPage.tsx
import { useState, useRef } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Image, Printer, Settings } from 'lucide-react'

export default function PosterMakerPage() {
  const { user } = useAuth()
  const school = user?.school as any
  const logoUrl = school?.logo_url || ''
  const schoolName = school?.name || 'World Uni-Learn Portal'

  const [form, setForm] = useState({
    title: '2025 PREFECTORIAL ELECTIONS',
    subtitle: 'VOTING CENTER',
    bodyText: 'Please have your student ID ready before proceeding to the voting booths. Ensure a peaceful and fair electoral process.',
    primaryColor: '#6d28d9',
    accentColor: '#f59e0b',
  })

  const posterRef = useRef<HTMLDivElement>(null)

  const printPoster = () => {
    if (!posterRef.current) return
    const html = `
      <html>
        <head>
          <title>Print Poster</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');
            body { 
              margin: 0; padding: 0; 
              background: #fff; 
              font-family: 'Inter', sans-serif;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            @page {
              size: A4 landscape;
              margin: 0mm;
            }
            .poster-container {
              width: 297mm;
              height: 210mm;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              background: linear-gradient(135deg, #f8fafc, #f1f5f9);
              border: 15mm solid ${form.primaryColor};
              box-sizing: border-box;
              position: relative;
              overflow: hidden;
            }
            .corner-accent {
              position: absolute;
              width: 150mm;
              height: 150mm;
              background: ${form.accentColor};
              border-radius: 50%;
              opacity: 0.1;
              top: -50mm;
              right: -50mm;
            }
            .corner-accent-2 {
              position: absolute;
              width: 200mm;
              height: 200mm;
              background: ${form.primaryColor};
              border-radius: 50%;
              opacity: 0.05;
              bottom: -80mm;
              left: -80mm;
            }
            .content {
              text-align: center;
              z-index: 10;
              padding: 0 40mm;
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            .logo {
              max-height: 35mm;
              margin-bottom: 8mm;
              object-fit: contain;
            }
            .school-name {
              font-size: 18pt;
              font-weight: 600;
              color: #475569;
              text-transform: uppercase;
              letter-spacing: 2px;
              margin-bottom: 15mm;
            }
            .title {
              font-size: 48pt;
              font-weight: 900;
              color: ${form.primaryColor};
              text-transform: uppercase;
              line-height: 1.1;
              margin: 0 0 5mm 0;
            }
            .subtitle {
              font-size: 28pt;
              font-weight: 800;
              color: #1e293b;
              text-transform: uppercase;
              background: ${form.accentColor};
              padding: 4mm 12mm;
              border-radius: 20mm;
              display: inline-block;
              margin-bottom: 15mm;
            }
            .body {
              font-size: 16pt;
              color: #334155;
              line-height: 1.5;
              max-width: 80%;
            }
          </style>
        </head>
        <body>
          <div class="poster-container">
            <div class="corner-accent"></div>
            <div class="corner-accent-2"></div>
            <div class="content">
              ${logoUrl ? `<img src="${logoUrl}" class="logo" />` : ''}
              <div class="school-name">${schoolName}</div>
              <h1 class="title">${form.title}</h1>
              <div class="subtitle">${form.subtitle}</div>
              <div class="body">${form.bodyText}</div>
            </div>
          </div>
        </body>
      </html>
    `
    const win = window.open('', '_blank')
    if (win) {
      win.document.write(html)
      win.document.close()
      // Wait for fonts to load before printing
      setTimeout(() => win.print(), 800)
    }
  }

  return (
    <div style={{ paddingBottom: 60, animation: '_fadeIn 0.4s ease' }}>
      <style>{`@keyframes _fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>Poster Maker</h1>
          <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>Design and print branded landscape posters for your school events.</p>
        </div>
        <button 
          onClick={printPoster}
          style={{ padding: '10px 24px', borderRadius: 12, background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#fff', border: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', boxShadow: '0 4px 12px rgba(109,40,217,0.2)' }}
        >
          <Printer size={18} /> Print / Save PDF
        </button>
      </div>

      <div style={{ display: 'flex', gap: 32, flexDirection: 'row', alignItems: 'flex-start' }}>
        
        {/* Controls Panel */}
        <div style={{ flex: '0 0 350px', background: '#fff', padding: 24, borderRadius: 16, border: '1px solid #f3f4f6', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, color: '#4b5563', fontWeight: 600 }}>
            <Settings size={18} /> Poster Settings
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Main Title</label>
            <input 
              value={form.title} onChange={e => setForm({...form, title: e.target.value})}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Subtitle / Center Name</label>
            <input 
              value={form.subtitle} onChange={e => setForm({...form, subtitle: e.target.value})}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Body Text</label>
            <textarea 
              rows={4}
              value={form.bodyText} onChange={e => setForm({...form, bodyText: e.target.value})}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', boxSizing: 'border-box', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Primary Color</label>
              <input 
                type="color"
                value={form.primaryColor} onChange={e => setForm({...form, primaryColor: e.target.value})}
                style={{ width: '100%', height: 40, padding: 0, borderRadius: 8, border: '1px solid #d1d5db', cursor: 'pointer' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Accent Color</label>
              <input 
                type="color"
                value={form.accentColor} onChange={e => setForm({...form, accentColor: e.target.value})}
                style={{ width: '100%', height: 40, padding: 0, borderRadius: 8, border: '1px solid #d1d5db', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>

        {/* Live Preview Panel */}
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, color: '#6b7280', fontSize: 14, fontWeight: 500 }}>
            <Image size={18} /> Live Preview (A4 Landscape)
          </div>
          
          {/* Scaled Preview Container */}
          <div style={{ width: '100%', aspectRatio: '1.414 / 1', background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', position: 'relative' }}>
            <div 
              ref={posterRef}
              style={{
                position: 'absolute',
                top: 0, left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                border: `20px solid ${form.primaryColor}`,
                boxSizing: 'border-box',
                overflow: 'hidden'
              }}
            >
              {/* Decorative corners */}
              <div style={{ position: 'absolute', width: '40%', paddingTop: '40%', background: form.accentColor, borderRadius: '50%', opacity: 0.1, top: '-10%', right: '-10%' }} />
              <div style={{ position: 'absolute', width: '50%', paddingTop: '50%', background: form.primaryColor, borderRadius: '50%', opacity: 0.05, bottom: '-20%', left: '-20%' }} />
              
              <div style={{ textAlign: 'center', zIndex: 10, padding: '0 10%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {logoUrl && <img src={logoUrl} style={{ maxHeight: 60, marginBottom: 12, objectFit: 'contain' }} alt="School Logo" />}
                <div style={{ fontSize: '1.5vw', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: 2, marginBottom: '2vw' }}>
                  {schoolName}
                </div>
                
                <h1 style={{ fontSize: '4.5vw', fontWeight: 900, color: form.primaryColor, textTransform: 'uppercase', lineHeight: 1.1, margin: '0 0 1vw 0' }}>
                  {form.title}
                </h1>
                
                {form.subtitle && (
                  <div style={{ fontSize: '2.5vw', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', background: form.accentColor, padding: '0.5vw 2vw', borderRadius: '5vw', display: 'inline-block', marginBottom: '2vw' }}>
                    {form.subtitle}
                  </div>
                )}
                
                <div style={{ fontSize: '1.4vw', color: '#334155', lineHeight: 1.5, maxWidth: '80%' }}>
                  {form.bodyText}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
