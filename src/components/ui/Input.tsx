// src/components/ui/Input.tsx
import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string; error?: string; hint?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, hint, id, className, style, ...props }, ref) => {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g,'-')
  return (
    <div style={{ width:'100%', fontFamily:'"DM Sans",sans-serif' }}>
      {label && <label htmlFor={inputId} style={{ display:'block', fontSize:11, fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase', color:'#6b7280', marginBottom:5 }}>{label}</label>}
      <input
        ref={ref} id={inputId}
        className={className}
        style={{
          width:'100%', borderRadius:9, border: error ? '1.5px solid #f87171' : '1.5px solid #e5e7eb',
          background:'#fff', padding:'9px 12px', fontSize:13, color:'#111827',
          outline:'none', transition:'border-color 0.15s, box-shadow 0.15s',
          fontFamily:'"DM Sans",sans-serif', boxSizing:'border-box', ...style,
        }}
        onFocus={e => { e.currentTarget.style.borderColor='#7c3aed'; e.currentTarget.style.boxShadow='0 0 0 3px rgba(109,40,217,0.1)' }}
        onBlur={e => { e.currentTarget.style.borderColor= error ? '#f87171' : '#e5e7eb'; e.currentTarget.style.boxShadow='none' }}
        {...props}
      />
      {error && <p style={{ fontSize:11, color:'#ef4444', marginTop:4 }}>⚠ {error}</p>}
      {hint && !error && <p style={{ fontSize:11, color:'#9ca3af', marginTop:4 }}>{hint}</p>}
    </div>
  )
})
Input.displayName = 'Input'
export default Input