import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

export default function GlobalAlarm() {
  const { user } = useAuth()
  const [activeAlarms, setActiveAlarms] = useState<any[]>([])

  useEffect(() => {
    if (!user?.school_id) return

    // 1. Load active alarms immediately
    loadAlarms()

    // 2. Poll every 30 seconds to check if any alarms have triggered
    const interval = setInterval(loadAlarms, 30000)

    return () => clearInterval(interval)
  }, [user?.school_id, user?.role])

  async function loadAlarms() {
    if (!user) return
    const now = new Date().toISOString()
    
    // Fetch announcements that are alarms, trigger_at is in the past, and expires_at is not met yet
    const { data } = await supabase.from('announcements')
      .select('*')
      .eq('school_id', user.school_id)
      .eq('is_alarm', true)
      .lte('trigger_at', now)
      .or(`expires_at.is.null,expires_at.gte.${now}`)

    if (!data) return

    // Filter by role (target_role matches user.role OR 'all')
    const relevantAlarms = data.filter(a => a.target_role === 'all' || a.target_role === user.role)

    // Filter out dismissed alarms from local storage
    const dismissedIds = JSON.parse(localStorage.getItem(`dismissed_alarms_${user.id}`) || '[]')
    const pendingAlarms = relevantAlarms.filter(a => !dismissedIds.includes(a.id))

    setActiveAlarms(pendingAlarms)
  }

  function dismissAlarm(id: string) {
    if (!user) return
    const dismissedIds = JSON.parse(localStorage.getItem(`dismissed_alarms_${user.id}`) || '[]')
    dismissedIds.push(id)
    localStorage.setItem(`dismissed_alarms_${user.id}`, JSON.stringify(dismissedIds))
    setActiveAlarms(prev => prev.filter(a => a.id !== id))
  }

  if (activeAlarms.length === 0) return null

  const alarm = activeAlarms[0] // Show the first one

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999999, 
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      animation: '_alarm_pulse 2s infinite alternate'
    }}>
      <style>{`
        @keyframes _alarm_pulse {
          from { background: rgba(0,0,0,0.85); }
          to { background: rgba(185, 28, 28, 0.4); }
        }
        @keyframes _alarm_shake {
          0% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          50% { transform: translateX(5px); }
          75% { transform: translateX(-5px); }
          100% { transform: translateX(0); }
        }
      `}</style>

      {/* Audio element for sound */}
      <audio src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" autoPlay loop />

      <div style={{
        background: 'var(--bg-card)', borderRadius: 24, padding: 40, maxWidth: 600, width: '100%',
        textAlign: 'center', boxShadow: '0 24px 64px rgba(220, 38, 38, 0.4)',
        animation: '_alarm_shake 0.5s ease-in-out'
      }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>⏰</div>
        <h1 style={{ margin: '0 0 16px', fontSize: 32, fontWeight: 900, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {alarm.title}
        </h1>
        <p style={{ fontSize: 20, color: 'var(--text-main)', margin: '0 0 32px', lineHeight: 1.5, fontWeight: 600 }}>
          {alarm.body}
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button 
            onClick={() => dismissAlarm(alarm.id)}
            style={{
              padding: '16px 48px', borderRadius: 100, background: '#111827', color: '#fff',
              fontSize: 18, fontWeight: 800, border: 'none', cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
            }}
          >
            Acknowledge & Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}
