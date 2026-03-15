// src/components/ui/Badge.tsx
import type { ReactNode, CSSProperties } from 'react'

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'

const vstyle: Record<Variant, CSSProperties> = {
  default: { background:'#f3f4f6', color:'#4b5563' },
  success: { background:'#f0fdf4', color:'#15803d' },
  warning: { background:'#fffbeb', color:'#b45309' },
  danger:  { background:'#fef2f2', color:'#dc2626' },
  info:    { background:'#eff6ff', color:'#2563eb' },
  purple:  { background:'#f5f3ff', color:'#6d28d9' },
}

export default function Badge({ children, variant = 'default', className }: { children: ReactNode; variant?: Variant; className?: string }) {
  return (
    <span
      className={className}
      style={{
        display:'inline-flex', alignItems:'center',
        borderRadius:999, padding:'2px 10px',
        fontSize:11, fontWeight:700,
        fontFamily:'"DM Sans",sans-serif',
        ...vstyle[variant],
      }}
    >{children}</span>
  )
}