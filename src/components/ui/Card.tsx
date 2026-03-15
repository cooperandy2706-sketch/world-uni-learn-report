// src/components/ui/Card.tsx
import type { ReactNode, CSSProperties } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
  style?: CSSProperties
  onClick?: () => void
}

const padMap = { none: 0, sm: 16, md: 20, lg: 24 }

export default function Card({ children, padding = 'md', hover, style, onClick, className }: CardProps) {
  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        background: '#fff',
        borderRadius: 14,
        border: '1px solid #f0eefe',
        boxShadow: '0 1px 4px rgba(109,40,217,0.07)',
        padding: padMap[padding],
        transition: hover ? 'box-shadow 0.2s, transform 0.2s' : undefined,
        cursor: hover || onClick ? 'pointer' : undefined,
        fontFamily: '"DM Sans", system-ui, sans-serif',
        ...style,
      }}
      onMouseEnter={hover ? e => {
        const el = e.currentTarget as HTMLElement
        el.style.boxShadow = '0 6px 24px rgba(109,40,217,0.13)'
        el.style.transform = 'translateY(-2px)'
      } : undefined}
      onMouseLeave={hover ? e => {
        const el = e.currentTarget as HTMLElement
        el.style.boxShadow = '0 1px 4px rgba(109,40,217,0.07)'
        el.style.transform = ''
      } : undefined}
    >
      {children}
    </div>
  )
}