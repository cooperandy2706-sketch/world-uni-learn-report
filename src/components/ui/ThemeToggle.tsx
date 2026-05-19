import { Moon, Sun, Laptop } from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'

export default function ThemeToggle() {
  const { theme, setTheme } = useThemeStore()

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4,
      background: 'var(--bg-input)', padding: 4, borderRadius: 12,
      border: '1px solid var(--border-color)'
    }}>
      {(['light', 'system', 'dark'] as const).map((t) => {
        const isActive = theme === t
        const Icon = t === 'light' ? Sun : t === 'dark' ? Moon : Laptop
        return (
          <button
            key={t}
            onClick={() => setTheme(t)}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isActive ? 'var(--bg-card)' : 'transparent',
              color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
              boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s',
            }}
            title={`Set theme to ${t}`}
          >
            <Icon size={16} />
          </button>
        )
      })}
    </div>
  )
}
