// src/components/ui/Button.tsx
import { forwardRef, type ButtonHTMLAttributes, type CSSProperties } from 'react'
import Spinner from './Spinner'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const vs: Record<string, CSSProperties> = {
  primary:   { background:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'#fff', border:'none', boxShadow:'0 2px 8px rgba(109,40,217,0.3)' },
  secondary: { background:'#fff', color:'#374151', border:'1px solid #e5e7eb', boxShadow:'0 1px 3px rgba(0,0,0,0.07)' },
  danger:    { background:'#dc2626', color:'#fff', border:'none', boxShadow:'0 2px 6px rgba(220,38,38,0.25)' },
  ghost:     { background:'transparent', color:'#6b7280', border:'none', boxShadow:'none' },
}

const ss: Record<string, CSSProperties> = {
  sm: { height:32, padding:'0 12px', fontSize:12 },
  md: { height:38, padding:'0 16px', fontSize:13 },
  lg: { height:44, padding:'0 24px', fontSize:15 },
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant='primary', size='md', loading, children, disabled, style, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      style={{
        display:'inline-flex', alignItems:'center', justifyContent:'center', gap:7,
        borderRadius:9, fontWeight:600, cursor:'pointer',
        fontFamily:'"DM Sans",system-ui,sans-serif', transition:'all 0.15s',
        opacity: disabled || loading ? 0.55 : 1,
        ...vs[variant], ...ss[size], ...style,
      }}
      onMouseEnter={e => { if (!disabled && !loading) (e.currentTarget as HTMLElement).style.filter='brightness(1.08)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter='' }}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  )
)
Button.displayName = 'Button'
export default Button