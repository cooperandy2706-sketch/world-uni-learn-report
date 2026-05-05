// src/components/ui/AnnouncementPopup.tsx
// Shows unread platform announcements as a popup to targeted users
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { X, Megaphone, AlertTriangle, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

interface PlatformMessage {
  id: string
  title: string
  body: string
  type: 'alert' | 'update' | 'event'
  target_audience: 'all' | 'admins' | 'teachers' | 'students'
  created_at: string
  urgency?: 'normal' | 'high'
}

const DISMISSED_KEY = 'wula_dismissed_announcements'

function getDismissed(): string[] {
  try { return JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? '[]') } catch { return [] }
}
function addDismissed(id: string) {
  const d = getDismissed()
  if (!d.includes(id)) {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...d, id]))
  }
}

function typeConfig(type: string) {
  if (type === 'alert') return {
    icon: '🚨', label: 'URGENT ALERT',
    gradient: 'linear-gradient(135deg,#7f1d1d,#dc2626)',
    accent: '#ef4444', badge: '#dc2626',
  }
  if (type === 'event') return {
    icon: '📅', label: 'UPCOMING EVENT',
    gradient: 'linear-gradient(135deg,#78350f,#f59e0b)',
    accent: '#fbbf24', badge: '#f59e0b',
  }
  return {
    icon: '📢', label: 'PLATFORM UPDATE',
    gradient: 'linear-gradient(135deg,#1e0646,#4c1d95)',
    accent: '#a78bfa', badge: '#7c3aed',
  }
}

function audienceLabel(a: string) {
  if (a === 'admins') return '🛡️ Administrators'
  if (a === 'teachers') return '📚 Teachers'
  if (a === 'students') return '🎓 Students'
  return '🌍 Everyone'
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AnnouncementPopup() {
  const { user, isAdmin, isTeacher, isStudent, isSuperAdmin } = useAuth()
  const [pending, setPending] = useState<PlatformMessage[]>([])
  const [idx, setIdx] = useState(0)
  const [open, setOpen] = useState(false)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    if (!user) return
    loadAnnouncements()

    // Refresh announcements every 30 minutes to check for new updates
    const interval = setInterval(loadAnnouncements, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [user?.id])

  async function loadAnnouncements() {
    // Determine which audiences apply to this user
    const audiences: string[] = ['all']
    if (isAdmin || isSuperAdmin) audiences.push('admins')
    if (isTeacher) audiences.push('teachers')
    if (isStudent) audiences.push('students')

    const { data } = await supabase
      .from('platform_messages')
      .select('*')
      .in('target_audience', audiences)
      .order('created_at', { ascending: false })
      .limit(20)

    if (!data?.length) return

    const dismissed = getDismissed()
    const unread = data.filter(m => !dismissed.includes(m.id))
    if (unread.length > 0) {
      setPending(unread)
      setIdx(0)
      setOpen(true)
    }
  }

  function dismiss(id: string) {
    addDismissed(id)
    const remaining = pending.filter(m => m.id !== id)
    if (remaining.length === 0) {
      closeAll()
    } else {
      setPending(remaining)
      setIdx(i => Math.min(i, remaining.length - 1))
    }
  }

  function dismissAll() {
    pending.forEach(m => addDismissed(m.id))
    closeAll()
  }

  function closeAll() {
    setExiting(true)
    setTimeout(() => { setOpen(false); setExiting(false) }, 280)
  }

  if (!open || pending.length === 0) return null
  const msg = pending[idx]
  const cfg = typeConfig(msg.type)
  const isLast = idx === pending.length - 1
  const isFirst = idx === 0

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(10,5,30,0.65)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      animation: exiting ? 'ann_out 0.28s ease forwards' : 'ann_bg_in 0.3s ease',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');
        @keyframes ann_bg_in { from{opacity:0} to{opacity:1} }
        @keyframes ann_out { to{opacity:0} }
        @keyframes ann_card_in { from{opacity:0;transform:translateY(28px) scale(.95)} to{opacity:1;transform:none} }
        @keyframes ann_card_slide { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:none} }
        .ann-btn { transition:all 0.2s; cursor:pointer; border:none; }
        .ann-btn:hover { filter:brightness(1.1); transform:scale(1.02); }
        .ann-btn:active { transform:scale(0.98); }
        .ann-close:hover { background:rgba(255,255,255,0.2)!important; }
      `}</style>

      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 500,
          background: '#fff', borderRadius: 24, overflow: 'hidden',
          boxShadow: '0 40px 100px rgba(0,0,0,0.4)',
          fontFamily: '"DM Sans", sans-serif',
          animation: 'ann_card_in 0.35s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* ── Header gradient ── */}
        <div style={{
          background: cfg.gradient, padding: '26px 24px 22px',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Decorative blobs */}
          <div style={{ position:'absolute', top:-40, right:-40, width:140, height:140,
            borderRadius:'50%', background:'rgba(255,255,255,0.06)', pointerEvents:'none' }}/>
          <div style={{ position:'absolute', bottom:-30, left:-30, width:100, height:100,
            borderRadius:'50%', background:'rgba(255,255,255,0.04)', pointerEvents:'none' }}/>

          <div style={{ position:'relative', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              {/* Icon */}
              <div style={{
                width:52, height:52, borderRadius:16, flexShrink:0,
                background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.2)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:24,
                boxShadow:'0 4px 16px rgba(0,0,0,0.2)',
              }}>{cfg.icon}</div>
              <div>
                <div style={{ fontSize:10, fontWeight:800, letterSpacing:'0.15em',
                  color:'rgba(255,255,255,0.6)', marginBottom:4 }}>
                  {cfg.label}
                </div>
                <h2 style={{
                  fontFamily:'"Playfair Display",serif', fontSize:20, fontWeight:700,
                  color:'#fff', margin:0, lineHeight:1.25,
                }}>{msg.title}</h2>
              </div>
            </div>
            {/* Close */}
            <button className="ann-btn ann-close" onClick={() => dismiss(msg.id)}
              aria-label="Dismiss"
              style={{
                width:32, height:32, borderRadius:10, flexShrink:0,
                background:'rgba(255,255,255,0.12)',
                color:'#fff', fontSize:18,
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>×</button>
          </div>

          {/* Pagination dots */}
          {pending.length > 1 && (
            <div style={{ display:'flex', gap:5, marginTop:16, position:'relative' }}>
              {pending.map((_, i) => (
                <button key={i} className="ann-btn"
                  onClick={() => setIdx(i)}
                  style={{
                    height:5, width:i===idx?22:5, borderRadius:99,
                    background: i===idx ? '#fff' : 'rgba(255,255,255,0.3)',
                    transition:'all 0.25s', padding:0,
                  }}/>
              ))}
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div style={{ padding:'22px 24px 16px' }} key={msg.id}>
          <div style={{ animation:'ann_card_slide 0.3s ease' }}>
            {/* Meta tags */}
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
              <span style={{
                display:'inline-flex', alignItems:'center', gap:5,
                fontSize:11, fontWeight:700, color: cfg.badge,
                background: `${cfg.badge}18`, borderRadius:99, padding:'3px 10px',
                border:`1px solid ${cfg.badge}30`,
              }}>
                {msg.type === 'alert' && <AlertTriangle size={10}/>}
                {msg.type === 'event' && <Calendar size={10}/>}
                {msg.type === 'update' && <Megaphone size={10}/>}
                {msg.type === 'alert' ? 'Urgent' : msg.type === 'event' ? 'Event' : 'Update'}
              </span>
              <span style={{
                fontSize:11, fontWeight:600, color:'#64748b',
                background:'#f1f5f9', borderRadius:99, padding:'3px 10px',
              }}>
                {audienceLabel(msg.target_audience)}
              </span>
            </div>

            {/* Message body */}
            <p style={{
              fontSize:14, lineHeight:1.7, color:'#374151', margin:0,
              whiteSpace:'pre-wrap',
            }}>{msg.body}</p>

            {/* Date */}
            <div style={{
              marginTop:16, paddingTop:14, borderTop:'1px solid #f1f5f9',
              fontSize:11, color:'#94a3b8', display:'flex', alignItems:'center', gap:5,
            }}>
              <Calendar size={11}/> {fmtDate(msg.created_at)}
              {pending.length > 1 && (
                <span style={{ marginLeft:'auto', fontWeight:600 }}>
                  {idx+1} / {pending.length} announcement{pending.length>1?'s':''}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Footer actions ── */}
        <div style={{ padding:'0 24px 24px', display:'flex', gap:10 }}>
          {/* Prev/Next when multiple */}
          {pending.length > 1 && (
            <>
              <button className="ann-btn" onClick={() => setIdx(i => i-1)}
                disabled={isFirst}
                style={{
                  width:40, height:40, borderRadius:12, flexShrink:0,
                  background: isFirst ? '#f8fafc' : '#f1f5f9',
                  color: isFirst ? '#cbd5e1' : '#475569',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  opacity: isFirst ? 0.5 : 1,
                }}>
                <ChevronLeft size={16}/>
              </button>
              <button className="ann-btn" onClick={() => setIdx(i => i+1)}
                disabled={isLast}
                style={{
                  width:40, height:40, borderRadius:12, flexShrink:0,
                  background: isLast ? '#f8fafc' : '#f1f5f9',
                  color: isLast ? '#cbd5e1' : '#475569',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  opacity: isLast ? 0.5 : 1,
                }}>
                <ChevronRight size={16}/>
              </button>
            </>
          )}

          {/* Dismiss current */}
          <button className="ann-btn" onClick={() => dismiss(msg.id)}
            style={{
              flex:1, padding:'11px 0', borderRadius:12,
              border:'1.5px solid #e2e8f0', background:'#fff',
              fontSize:13, fontWeight:600, color:'#64748b',
              fontFamily:'"DM Sans",sans-serif',
            }}>
            Got it
          </button>

          {/* Dismiss all if multiple */}
          {pending.length > 1 ? (
            <button className="ann-btn" onClick={dismissAll}
              style={{
                flex:2, padding:'11px 0', borderRadius:12, border:'none',
                background: cfg.gradient,
                fontSize:13, fontWeight:700, color:'#fff',
                fontFamily:'"DM Sans",sans-serif',
              }}>
              Mark All Read ({pending.length})
            </button>
          ) : (
            <button className="ann-btn" onClick={() => dismiss(msg.id)}
              style={{
                flex:2, padding:'11px 0', borderRadius:12, border:'none',
                background: cfg.gradient,
                fontSize:13, fontWeight:700, color:'#fff',
                fontFamily:'"DM Sans",sans-serif',
              }}>
              {msg.type === 'alert' ? '✓ Acknowledged' : '✓ Understood'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
