// src/components/ui/NotificationsModal.tsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { X, Bell, Megaphone, Calendar, CheckCircle2, ChevronRight, Inbox } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'

interface Notification {
  id: string
  title: string
  body: string
  type: string
  created_at: string
  is_read: boolean
  school_id: string
}

interface NotificationsModalProps {
  open: boolean
  onClose: () => void
  onRead?: () => void
}

export default function NotificationsModal({ open, onClose, onRead }: NotificationsModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [activeTab, setActiveTab] = useState<'unread' | 'all'>('unread')

  useEffect(() => {
    if (open && user?.id) {
      loadNotifications()
    }
  }, [open, user?.id, activeTab])

  async function loadNotifications() {
    setLoading(true)
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(30)

      if (activeTab === 'unread') {
        query = query.eq('is_read', false)
      }

      const { data } = await query
      setNotifications(data ?? [])
    } finally {
      setLoading(false)
    }
  }

  async function markAsRead(id: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
    
    if (!error) {
      setNotifications(prev => prev.filter(n => n.id !== id))
      onRead?.()
    }
  }

  async function markAllRead() {
    if (notifications.length === 0) return
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user!.id)
      .eq('is_read', false)
    
    if (!error) {
      setNotifications([])
      onRead?.()
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 10001,
              background: 'rgba(10,5,30,0.65)', backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'fixed', bottom: 20, left: 20, right: 20,
              zIndex: 10002, margin: '0 auto', maxWidth: 480,
              background: '#fff', borderRadius: 24, overflow: 'hidden',
              boxShadow: '0 40px 100px rgba(0,0,0,0.4)',
              fontFamily: '"DM Sans", sans-serif',
              display: 'flex', flexDirection: 'column',
              maxHeight: '80vh',
            }}
          >
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #1e0646, #4c1d95)',
              padding: '24px 20px', position: 'relative',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 14,
                    background: 'rgba(255,255,255,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Bell color="#fff" size={24} />
                  </div>
                  <div>
                    <h2 style={{ 
                      fontFamily: '"Playfair Display", serif', fontSize: 20, 
                      fontWeight: 700, color: '#fff', margin: 0 
                    }}>Notifications</h2>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                      Latest updates from admin
                    </p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: 'rgba(255,255,255,0.12)', border: 'none',
                    color: '#fff', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Tabs */}
              <div style={{ 
                display: 'flex', gap: 8, marginTop: 20,
                background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 4
              }}>
                <button 
                  onClick={() => setActiveTab('unread')}
                  style={{
                    flex: 1, padding: '8px', borderRadius: 8, border: 'none',
                    fontSize: 12, fontWeight: activeTab === 'unread' ? 700 : 500,
                    background: activeTab === 'unread' ? '#fff' : 'transparent',
                    color: activeTab === 'unread' ? '#4c1d95' : 'rgba(255,255,255,0.7)',
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  Unread
                </button>
                <button 
                  onClick={() => setActiveTab('all')}
                  style={{
                    flex: 1, padding: '8px', borderRadius: 8, border: 'none',
                    fontSize: 12, fontWeight: activeTab === 'all' ? 700 : 500,
                    background: activeTab === 'all' ? '#fff' : 'transparent',
                    color: activeTab === 'all' ? '#4c1d95' : 'rgba(255,255,255,0.7)',
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  History
                </button>
              </div>
            </div>

            {/* List */}
            <div style={{ 
              flex: 1, overflowY: 'auto', padding: '16px',
              display: 'flex', flexDirection: 'column', gap: 12,
              background: '#f8f7ff'
            }}>
              {loading ? (
                <div style={{ py: 40, textAlign: 'center' }}>
                  <div style={{ 
                    width: 24, height: 24, borderRadius: '50%', 
                    border: '2px solid #ede9fe', borderTopColor: '#6d28d9',
                    margin: '0 auto 12px', animation: 'spin 0.8s linear infinite'
                  }} />
                  <p style={{ fontSize: 13, color: '#94a38b' }}>Refreshing...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                  <div style={{ 
                    width: 64, height: 64, borderRadius: '50%', background: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px', boxShadow: '0 8px 30px rgba(0,0,0,0.05)'
                  }}>
                    <Inbox color="#cbd5e1" size={32} />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
                    All caught up!
                  </h3>
                  <p style={{ fontSize: 13, color: '#64748b' }}>
                    {activeTab === 'unread' ? "You've read all your notifications." : "No notification history yet."}
                  </p>
                </div>
              ) : (
                notifications.map((n, i) => (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    style={{
                      background: '#fff', borderRadius: 16, padding: '16px',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                      border: '1px solid #f1f0fb',
                      display: 'flex', gap: 14, position: 'relative'
                    }}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: 12,
                      background: n.type === 'alert' ? '#fef2f2' : n.type === 'meeting' ? '#eff6ff' : '#f5f3ff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {n.type === 'alert' ? '🚨' : n.type === 'meeting' ? '📅' : '💬'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h4 style={{ 
                          fontSize: 14, fontWeight: 700, color: '#1e293b', 
                          margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>{n.title}</h4>
                        {!n.is_read && (
                          <div style={{ 
                            width: 8, height: 8, borderRadius: '50%', background: '#6d28d9',
                            boxShadow: '0 0 8px #6d28d9', flexShrink: 0, marginTop: 4
                          }} />
                        )}
                      </div>
                      <p style={{ 
                        fontSize: 13, color: '#475569', margin: '0 0 10px',
                        lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden'
                      }}>{n.body}</p>
                      
                      <div style={{ 
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#94a3b8', fontSize: 11 }}>
                          <Calendar size={11} /> {formatDistanceToNow(new Date(n.created_at))} ago
                        </div>
                        {!n.is_read && (
                          <button 
                            onClick={() => markAsRead(n.id)}
                            style={{
                              fontSize: 11, fontWeight: 700, color: '#6d28d9',
                              background: 'none', border: 'none', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: 4
                            }}
                          >
                            Mark Read <ChevronRight size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {activeTab === 'unread' && notifications.length > 0 && (
              <div style={{ 
                padding: '16px 20px', borderTop: '1px solid #f1f0fb',
                background: '#fff'
              }}>
                <button
                  onClick={markAllRead}
                  style={{
                    width: '100%', padding: '12px', borderRadius: 12,
                    background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                    color: '#fff', border: 'none', fontSize: 13, fontWeight: 700,
                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: 8, boxShadow: '0 4px 12px rgba(109,40,217,0.2)'
                  }}
                >
                  <CheckCircle2 size={16} /> Mark All as Read
                </button>
              </div>
            )}
            
            <style>{`
              @keyframes spin { to { transform: rotate(360deg) } }
            `}</style>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
