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

  // Don't show if already subscribed or unsupported
  if (status === 'loading' || status === 'subscribed' || status === 'unsupported') return null

  async function enable() {
    if (!VAPID_PUBLIC_KEY) {
      toast.error('Push not configured — VITE_VAPID_PUBLIC_KEY missing in Vercel env vars')
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
    <div style={{ background:'linear-gradient(135deg,#fef3c7,#fde68a)', border:'1.5px solid #f59e0b', borderRadius:14, padding:'14px 16px', marginBottom:16, display:'flex', alignItems:'center', gap:12, fontFamily:'"DM Sans",sans-serif' }}>
      <div style={{ width:44, height:44, borderRadius:12, background:'#f59e0b', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
        🔔
      </div>
      <div style={{ flex:1 }}>
        <p style={{ fontSize:13, fontWeight:700, color:'#92400e', margin:'0 0 2px' }}>Enable Push Notifications</p>
        <p style={{ fontSize:11, color:'#78350f', margin:0, lineHeight:1.4 }}>
          Get instant alerts for announcements, timetable changes and meetings — even when the app is closed
        </p>
      </div>
      <button onClick={enable} disabled={working}
        style={{ padding:'9px 16px', borderRadius:9, border:'none', background:'#d97706', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'"DM Sans",sans-serif', flexShrink:0, opacity:working?0.7:1, whiteSpace:'nowrap' }}>
        {working ? 'Enabling…' : 'Enable'}
      </button>
    </div>
  )
}