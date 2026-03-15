// src/components/layout/PageHeader.tsx
import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
}

export default function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, marginBottom:28 }}>
      <div>
        <h1 style={{ fontFamily:'"Playfair Display",serif', fontSize:26, fontWeight:700, color:'#111827', lineHeight:1.2, margin:0 }}>{title}</h1>
        {subtitle && <p style={{ fontSize:13, color:'#6b7280', marginTop:4, fontFamily:'"DM Sans",sans-serif' }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>{actions}</div>}
    </div>
  )
}