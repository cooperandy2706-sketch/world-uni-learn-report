// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
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
window.addEventListener('offline', () => {
  document.getElementById('root')!.innerHTML = ''
  import('./pages/ErrorPages').then(({ OfflinePage }) => {
    createRoot(document.getElementById('root')!).render(<OfflinePage />)
  })
})