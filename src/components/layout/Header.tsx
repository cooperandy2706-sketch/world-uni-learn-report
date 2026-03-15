// src/components/layout/Header.tsx
import { useAuth } from '../../hooks/useAuth'
import { useCurrentTerm, useCurrentAcademicYear } from '../../hooks/useSettings'

export default function Header() {
  const { user } = useAuth()
  const { data: term } = useCurrentTerm()
  const { data: year } = useCurrentAcademicYear()

  return (
    <header style={{
      height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 32px', background: '#fff', flexShrink: 0,
      borderBottom: '1px solid #f0eefe',
      boxShadow: '0 1px 8px rgba(109,40,217,0.06)',
      fontFamily: '"DM Sans", system-ui, sans-serif',
    }}>
      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {year && term ? (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
            border: '1px solid #ddd6fe', borderRadius: 99,
            padding: '6px 14px',
          }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#f59e0b', animation: 'pulse 2s infinite' }} />
            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#5b21b6' }}>
              {year.name} &nbsp;·&nbsp; {term.name}
            </span>
            {(term as any).is_locked && (
              <span style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', background: '#fef2f2', borderRadius: 99, padding: '1px 7px' }}>LOCKED</span>
            )}
          </div>
        ) : (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 99, padding: '5px 14px', fontSize: 12, fontWeight: 600, color: '#92400e' }}>
            ⚠ No active term
          </div>
        )}
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 1, height: 24, background: '#f0eefe', margin: '0 4px' }} />
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0,
        }}>
          {user?.full_name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', lineHeight: 1.2 }}>{user?.full_name}</div>
          <div style={{ fontSize: 11, color: '#a78bfa', textTransform: 'capitalize' }}>{user?.role}</div>
        </div>
      </div>
    </header>
  )
}