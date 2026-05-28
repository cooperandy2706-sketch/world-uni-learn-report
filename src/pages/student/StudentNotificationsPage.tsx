import { useStuckLoadingReload } from '../../hooks/useStuckLoadingReload'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { Bell, CheckCircle2, Circle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

export default function StudentNotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useStuckLoadingReload(loading)

  useEffect(() => {
    if (user?.id) loadNotifications()
  }, [user?.id])

  async function loadNotifications() {
    setLoading(true)
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      toast.error('Failed to load notifications')
    } else {
      setNotifications(data || [])
    }
    setLoading(false)
  }

  async function markAsRead(id: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)

    if (!error) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    }
  }

  async function markAllAsRead() {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user!.id)
      .eq('is_read', false)

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      toast.success('All marked as read')
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', animation: 'fadeIn 0.4s ease' }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
        .notif-card { transition: all 0.2s ease; border: 1.5px solid transparent; }
        .notif-card:hover { border-color: #e5e7eb; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
        .notif-unread { background: #f5f3ff; border-color: #ede9fe; }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Notifications</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>You have {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}</p>
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead}
            style={{ padding: '8px 16px', background: 'white', border: '1.5px solid var(--border-color)', borderRadius: '12px', fontSize: 13, fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <CheckCircle2 size={16} /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="animate-spin" style={{ width: 32, height: 32, border: '3px solid #f3f3f3', borderTop: '3px solid #7c3aed', borderRadius: '50%' }} />
        </div>
      ) : notifications.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '20px', padding: '60px 20px', textAlign: 'center', border: '1.5px dashed var(--border-color)' }}>
          <div style={{ width: 64, height: 64, background: 'var(--bg-input)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Bell size={28} color="#9ca3af" />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)', marginBottom: 8 }}>All caught up!</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>You have no notifications at the moment.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {notifications.map(n => (
            <div 
              key={n.id} 
              className={`notif-card ${!n.is_read ? 'notif-unread' : ''}`}
              style={{ padding: '20px', background: !n.is_read ? '#f5f3ff' : 'white', borderRadius: '16px', display: 'flex', gap: 16, cursor: 'pointer' }}
              onClick={() => { if (!n.is_read) markAsRead(n.id) }}
            >
              <div style={{ marginTop: 2 }}>
                {!n.is_read ? <Circle size={12} fill="#7c3aed" color="#7c3aed" /> : <Circle size={12} color="#d1d5db" />}
              </div>
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: !n.is_read ? 700 : 600, color: 'var(--text-main)' }}>{n.title}</h4>
                <p style={{ margin: '0 0 8px', fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 }}>{n.body}</p>
                <div style={{ fontSize: 12, color: 'var(--text-subtle)', fontWeight: 600 }}>
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
