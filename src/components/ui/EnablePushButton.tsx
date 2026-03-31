// src/components/ui/EnablePushButton.tsx
import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { requestAndSubscribe, isPushSubscribed, VAPID_PUBLIC_KEY } from '../../utils/pushNotifications'
import toast from 'react-hot-toast'

export default function EnablePushButton({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth()
  const [status, setStatus]   = useState<'loading'|'subscribed'|'unsubscribed'|'unsupported'>('loading')
  const [working, setWorking] = useState(false)

  useEffect(() => {
    // Check if push is supported and already subscribed
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setStatus('unsupported')
      return
    }
    isPushSubscribed().then(s => setStatus(s ? 'subscribed' : 'unsubscribed'))
  }, [])

  const [dismissed, setDismissed] = useState(false)

  // Don't show if already subscribed, unsupported, or dismissed
  if (status === 'loading' || status === 'subscribed' || status === 'unsupported' || dismissed) return null

  async function enable() {
    if (!VAPID_PUBLIC_KEY) {
      toast.error('Push not configured — VITE_VAPID_PUBLIC_KEY missing in Environment variables')
      return
    }
    setWorking(true)
    const result = await requestAndSubscribe(user!.id)
    setWorking(false)

    if (result === 'granted') {
      setStatus('subscribed')
      toast.success('🔔 Notifications enabled! You\'ll get alerts on this device')
    } else if (result === 'denied') {
      toast.error('Notifications blocked — go to browser Settings → Notifications → Allow for this site')
    } else if (result === 'error') {
      toast.error('Failed to enable — check console for details')
    }
  }

  if (compact) {
    return (
      <button onClick={enable} disabled={working}
        style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:9, border:'none', background:'linear-gradient(135deg,#f59e0b,#d97706)', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'"DM Sans",sans-serif', opacity:working?0.7:1 }}>
        {working ? '⏳ Enabling…' : '🔔 Enable Notifications'}
      </button>
    )
  }

  return (
    <>
      <style>{`
        @keyframes _pb_fade { from { opacity: 0; backdrop-filter: blur(0px); } to { opacity: 1; backdrop-filter: blur(8px); } }
        @keyframes _pb_slideUp { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
      <div style={{ 
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(17, 24, 39, 0.65)', WebkitBackdropFilter: 'blur(8px)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        fontFamily: '"DM Sans", sans-serif', animation: '_pb_fade 0.3s ease forwards'
      }}>
        <div style={{
          background: '#ffffff', borderRadius: 24, padding: '32px 24px', width: '100%', maxWidth: 380,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', position: 'relative', textAlign: 'center',
          animation: '_pb_slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}>
          
          <button onClick={() => setDismissed(true)} style={{
            position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: '50%',
            background: '#f3f4f6', border: 'none', color: '#6b7280', fontSize: 16, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s'
          }} onMouseEnter={e=>e.currentTarget.style.background='#e5e7eb'} onMouseLeave={e=>e.currentTarget.style.background='#f3f4f6'}>
            ✕
          </button>
          
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 20px', boxShadow: '0 0 0 8px #fffbeb' }}>
            🔔
          </div>
          
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', marginBottom: 10, letterSpacing: '-0.02em' }}>
            Turn on Notifications?
          </h2>
          
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 28, lineHeight: 1.5, padding: '0 10px' }}>
            Get instant WhatsApp-style alerts for announcements and urgent meetings — even when the app is completely closed.
          </p>

          <button onClick={enable} disabled={working}
            style={{ 
              width: '100%', padding: '14px', borderRadius: 12, border: 'none', 
              background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#fff', 
              fontSize: 15, fontWeight: 700, cursor: working ? 'wait' : 'pointer', 
              boxShadow: '0 4px 14px rgba(109,40,217,0.3)', opacity: working ? 0.8 : 1, 
              transition: 'all 0.2s', marginBottom: 12 
            }}>
            {working ? 'Authorizing...' : 'Yes, Enable Notifications'}
          </button>
          
          <button onClick={() => setDismissed(true)} 
            style={{ 
              width: '100%', padding: '12px', borderRadius: 12, border: 'none', 
              background: 'transparent', color: '#6b7280', fontSize: 14, fontWeight: 600, cursor: 'pointer' 
            }}>
            Maybe later
          </button>
          
        </div>
      </div>
    </>
  )
}