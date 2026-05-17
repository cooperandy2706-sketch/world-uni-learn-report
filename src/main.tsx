// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/teacher-mobile.css'
import App from './App'

// Register service worker for push notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      console.log('SW registered:', reg.scope)
    } catch (e) {
      console.error('SW registration failed:', e)
    }
  })
}

// PWA install prompt
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault()
  // Stash the event so it can be triggered later via a user gesture UI button.
  ;(window as any).deferredPrompt = e
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)

// ── CRITICAL: DO NOT destroy the React root when offline ──────────────────────
// The previous code called `createRoot` a second time on 'offline', which
// permanently destroyed the React tree including all Zustand auth state,
// React Query cache, and all Supabase Realtime subscriptions.
// They could NEVER recover automatically — only a manual page refresh helped.
//
// Fix: dispatch a custom event that the App can listen to in order to show
// a gentle "You are offline" banner WITHOUT unmounting the app.
window.addEventListener('offline', () => {
  window.dispatchEvent(new CustomEvent('wula:offline'))
})
window.addEventListener('online', () => {
  window.dispatchEvent(new CustomEvent('wula:online'))
})