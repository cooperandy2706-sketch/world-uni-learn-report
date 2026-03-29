// src/components/ui/EnablePushButton.tsx
// Drop this anywhere in the teacher layout — shows "Enable Notifications" button
import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { subscribeToPush, isPushSubscribed } from '../../utils/pushNotifications'
import toast from 'react-hot-toast'

export default function EnablePushButton() {
  const { user } = useAuth()
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    isPushSubscribed().then(s => { setSubscribed(s); setChecked(true) })
  }, [])

  if (!checked || subscribed) return null

  async function enable() {
    setLoading(true)
    const ok = await subscribeToPush(user!.id)
    setLoading(false)
    if (ok) {
      setSubscribed(true)
      toast.success('Push notifications enabled! You\'ll get alerts like WhatsApp 🔔')
    } else {
      toast.error('Could not enable notifications. Check browser settings.')
    }
  }

  return (
    <div style={{ background:'linear-gradient(135deg,#fef3c7,#fde68a)', border:'1.5px solid #f59e0b', borderRadius:12, padding:'12px 16px', marginBottom:16, display:'flex', alignItems:'center', gap:12, fontFamily:'"DM Sans",sans-serif' }}>
      <span style={{ fontSize:24, flexShrink:0 }}>🔔</span>
      <div style={{ flex:1 }}>
        <p style={{ fontSize:13, fontWeight:700, color:'#92400e', margin:'0 0 2px' }}>Enable Push Notifications</p>
        <p style={{ fontSize:11, color:'#78350f', margin:0 }}>Get notified about classes, announcements and meetings — even when the app is closed</p>
      </div>
      <button onClick={enable} disabled={loading}
        style={{ padding:'8px 16px', borderRadius:9, border:'none', background:'#f59e0b', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'"DM Sans",sans-serif', flexShrink:0, opacity:loading?0.7:1 }}>
        {loading ? 'Enabling…' : 'Enable'}
      </button>
    </div>
  )
}