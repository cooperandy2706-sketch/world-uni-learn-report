import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => {
        set({ theme })
        updateDocumentClass(theme)
      },
    }),
    {
      name: 'nexora-theme',
      onRehydrateStorage: () => (state) => {
        if (state) {
          updateDocumentClass(state.theme)
        }
      },
    }
  )
)

export function updateDocumentClass(theme: Theme) {
  const root = window.document.documentElement
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  if (isDark) {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

// Optional helper to listen for system theme changes if set to 'system'
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const { theme } = useThemeStore.getState()
    if (theme === 'system') {
      updateDocumentClass('system')
    }
  })
}
