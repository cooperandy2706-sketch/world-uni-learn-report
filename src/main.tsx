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
let deferredPrompt: any
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferredPrompt = e
  setTimeout(() => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      deferredPrompt.userChoice.then(() => { deferredPrompt = null })
    }
  }, 4000)
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