// src/components/ui/Modal.tsx
import { useEffect, type ReactNode } from 'react'

interface ModalProps {
  open: boolean; onClose: () => void; title?: string; subtitle?: string
  children: ReactNode; size?: 'sm'|'md'|'lg'|'xl'; footer?: ReactNode
}

const sizeW = { sm:460, md:560, lg:720, xl:960 }

export default function Modal({ open, onClose, title, subtitle, children, size='md', footer }: ModalProps) {
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; return () => { document.body.style.overflow = '' } }, [open])
  useEffect(() => { const h = (e: KeyboardEvent) => { if(e.key==='Escape') onClose() }; window.addEventListener('keydown',h); return () => window.removeEventListener('keydown',h) }, [onClose])

  if (!open) return null

  return (
    <>
      <style>{`
        @keyframes _mfi { from{opacity:0} to{opacity:1} }
        @keyframes _msu { from{opacity:0;transform:translateY(14px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
      `}</style>
      <div
        onClick={e => { if(e.target===e.currentTarget) onClose() }}
        style={{
          position:'fixed', inset:0, zIndex:999,
          display:'flex', alignItems:'center', justifyContent:'center', padding:16,
          background:'rgba(17,24,39,0.55)', backdropFilter:'blur(4px)',
          animation:'_mfi 0.15s ease', fontFamily:'"DM Sans",sans-serif',
        }}
      >
        <div style={{
          width:'100%', maxWidth:sizeW[size], maxHeight:'90vh',
          background:'#fff', borderRadius:16, display:'flex', flexDirection:'column',
          boxShadow:'0 24px 64px rgba(0,0,0,0.18)', animation:'_msu 0.2s ease',
          border:'1px solid #f0eefe', overflow:'hidden',
        }}>
          {title && (
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', padding:'20px 24px 16px', borderBottom:'1px solid #f5f3ff', flexShrink:0 }}>
              <div>
                <h2 style={{ fontFamily:'"Playfair Display",serif', fontSize:19, fontWeight:700, color:'#111827', margin:0 }}>{title}</h2>
                {subtitle && <p style={{ fontSize:12, color:'#6b7280', marginTop:3 }}>{subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                style={{ width:30, height:30, borderRadius:8, border:'none', background:'#f9fafb', cursor:'pointer', fontSize:16, color:'#6b7280', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginLeft:12 }}
                onMouseEnter={e => { e.currentTarget.style.background='#f5f3ff'; e.currentTarget.style.color='#6d28d9' }}
                onMouseLeave={e => { e.currentTarget.style.background='#f9fafb'; e.currentTarget.style.color='#6b7280' }}
              >✕</button>
            </div>
          )}
          <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>{children}</div>
          {footer && (
            <div style={{ flexShrink:0, borderTop:'1px solid #f5f3ff', padding:'14px 24px', display:'flex', alignItems:'center', justifyContent:'flex-end', gap:10, background:'#fafafa' }}>
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  )
}