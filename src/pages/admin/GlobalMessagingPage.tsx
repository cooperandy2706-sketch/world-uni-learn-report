import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'
import {
  Megaphone, AlertTriangle, Calendar, Users, Send,
  Trash2, Plus, X, Globe, ShieldCheck, BookOpen, GraduationCap
} from 'lucide-react'

interface PlatformMessage {
  id: string; title: string; body: string
  type: 'alert' | 'update' | 'event'
  target_audience: 'all' | 'admins' | 'teachers' | 'students'
  created_at: string
}

// ─── Audience options ──────────────────────────────────────────────────────
const AUDIENCES = [
  { value: 'all',      label: 'Everyone',      sub: 'All admins, teachers & students', Icon: Globe,        color: '#7c3aed', bg: '#f5f3ff' },
  { value: 'admins',   label: 'Admins Only',   sub: 'School administrators',           Icon: ShieldCheck,  color: '#0891b2', bg: '#e0f2fe' },
  { value: 'teachers', label: 'Teachers Only', sub: 'All teaching staff',              Icon: BookOpen,     color: '#059669', bg: '#d1fae5' },
  { value: 'students', label: 'Students Only', sub: 'All enrolled students',           Icon: GraduationCap,color: '#d97706', bg: '#fef3c7' },
] as const

const TYPES = [
  { value: 'update', label: 'Platform Update', emoji: '📢', color: '#7c3aed', bg: '#f5f3ff' },
  { value: 'alert',  label: 'Urgent Alert',    emoji: '🚨', color: '#dc2626', bg: '#fee2e2' },
  { value: 'event',  label: 'Upcoming Event',  emoji: '📅', color: '#d97706', bg: '#fef3c7' },
] as const

function fmtDate(d: string) {
  const date = new Date(d)
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 60000)
  if (diff < 1) return 'Just now'
  if (diff < 60) return `${diff} min ago`
  if (diff < 1440) return `${Math.floor(diff / 60)} hr ago`
  return date.toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })
}

function audienceBadge(a: string) {
  const cfg = AUDIENCES.find(x => x.value === a) ?? AUDIENCES[0]
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, borderRadius: 99,
      padding: '2px 9px', color: cfg.color, background: cfg.bg,
      display: 'inline-flex', alignItems: 'center', gap: 4,
    }}>
      <cfg.Icon size={9} /> {cfg.label}
    </span>
  )
}

function typeBadge(t: string) {
  const cfg = TYPES.find(x => x.value === t) ?? TYPES[0]
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, borderRadius: 99,
      padding: '2px 9px', color: cfg.color, background: cfg.bg,
    }}>
      {cfg.emoji} {cfg.label}
    </span>
  )
}

// ─── Compose drawer ─────────────────────────────────────────────────────────
function ComposePanel({ onClose, onSent }: { onClose: () => void; onSent: () => void }) {
  const [title, setTitle]     = useState('')
  const [body, setBody]       = useState('')
  const [type, setType]       = useState<'update' | 'alert' | 'event'>('update')
  const [audience, setAudience] = useState<'all' | 'admins' | 'teachers' | 'students'>('all')
  const [sending, setSending] = useState(false)

  async function handleSend() {
    if (!title.trim() || !body.trim()) {
      toast.error('Title and message body are required')
      return
    }
    setSending(true)
    const { error } = await supabase.from('platform_messages').insert({
      title: title.trim(), body: body.trim(), type, target_audience: audience,
    })
    if (error) {
      if (error.code === '42P01') toast.error('Run the global_platform_migration.sql first!')
      else toast.error('Failed to send: ' + error.message)
    } else {
      toast.success('✅ Announcement sent!')
      onSent()
      onClose()
    }
    setSending(false)
  }

  const selAudience = AUDIENCES.find(a => a.value === audience)!
  const selType = TYPES.find(t2 => t2.value === type)!

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(10,5,30,0.6)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onClose}>
      <style>{`
        @keyframes cp_in{from{opacity:0;transform:translateY(24px) scale(.96)}to{opacity:1;transform:none}}
        .cp-input:focus{outline:none;border-color:#7c3aed!important}
        .cp-type:hover{border-color:#7c3aed!important;background:#faf5ff!important}
        .cp-aud:hover{border-color:currentColor!important}
        .cp-btn{transition:all 0.2s;cursor:pointer;border:none}
        .cp-btn:hover{filter:brightness(1.08);transform:scale(1.02)}
      `}</style>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 560, background: '#fff', borderRadius: 24, overflow: 'hidden',
        boxShadow: '0 40px 100px rgba(0,0,0,0.3)',
        fontFamily: '"DM Sans",sans-serif',
        animation: 'cp_in 0.35s cubic-bezier(0.16,1,0.3,1)',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg,#1e0646,#4c1d95)',
          padding: '22px 24px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 13,
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Megaphone size={20} color="#fff"/>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>New Announcement</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
                Broadcast to targeted roles — appears as a popup
              </div>
            </div>
          </div>
          <button onClick={onClose} className="cp-btn" style={{
            width: 32, height: 32, borderRadius: 9,
            background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><X size={16}/></button>
        </div>

        {/* Form body */}
        <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Message type */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
              Message Type
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              {TYPES.map(t2 => (
                <button key={t2.value} className="cp-btn cp-type"
                  onClick={() => setType(t2.value as any)}
                  style={{
                    padding: '10px 6px', borderRadius: 12,
                    border: `2px solid ${type === t2.value ? t2.color : '#e2e8f0'}`,
                    background: type === t2.value ? t2.bg : '#fafafa',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    fontFamily: '"DM Sans",sans-serif',
                  }}>
                  <span style={{ fontSize: 20 }}>{t2.emoji}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: type === t2.value ? t2.color : '#64748b' }}>
                    {t2.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Target audience */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
              Target Audience
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {AUDIENCES.map(a => (
                <button key={a.value} className="cp-btn cp-aud"
                  onClick={() => setAudience(a.value as any)}
                  style={{
                    padding: '10px 12px', borderRadius: 12, textAlign: 'left',
                    border: `2px solid ${audience === a.value ? a.color : '#e2e8f0'}`,
                    background: audience === a.value ? a.bg : '#fafafa',
                    display: 'flex', alignItems: 'center', gap: 10,
                    fontFamily: '"DM Sans",sans-serif', color: 'currentColor',
                  }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                    background: audience === a.value ? a.color : '#e2e8f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <a.Icon size={15} color={audience === a.value ? '#fff' : '#94a3b8'}/>
                  </div>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: audience === a.value ? a.color : '#374151' }}>
                      {a.label}
                    </div>
                    <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 1 }}>{a.sub}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
              Title
            </label>
            <input
              value={title} onChange={e => setTitle(e.target.value)}
              placeholder={`e.g. "${selType.emoji} Important Notice for ${selAudience.label}"`}
              className="cp-input"
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 12,
                border: '1.5px solid #e2e8f0', fontSize: 14,
                fontFamily: '"DM Sans",sans-serif', boxSizing: 'border-box',
                transition: 'border 0.2s',
              }}
            />
          </div>

          {/* Body */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
              Message Body
            </label>
            <textarea
              value={body} onChange={e => setBody(e.target.value)}
              placeholder="Write your announcement here. Be clear and concise — this will appear as a popup to all targeted users..."
              rows={4} className="cp-input"
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 12,
                border: '1.5px solid #e2e8f0', fontSize: 14, lineHeight: 1.6,
                fontFamily: '"DM Sans",sans-serif', resize: 'vertical',
                boxSizing: 'border-box', transition: 'border 0.2s',
              }}
            />
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, textAlign: 'right' }}>
              {body.length} characters
            </div>
          </div>

          {/* Preview chip */}
          {(title || body) && (
            <div style={{
              background: selType.bg, border: `1.5px solid ${selType.color}30`,
              borderRadius: 12, padding: '12px 14px',
              display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{selType.emoji}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: selType.color, marginBottom: 3 }}>
                  {title || 'Your title here…'}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
                  {body ? (body.length > 100 ? body.slice(0,97)+'…' : body) : 'Your message body…'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '0 24px 24px', display: 'flex', gap: 10 }}>
          <button onClick={onClose} className="cp-btn"
            style={{
              flex: 1, padding: '12px 0', borderRadius: 12,
              border: '1.5px solid #e2e8f0', background: '#fff',
              fontSize: 13, fontWeight: 600, color: '#64748b',
              fontFamily: '"DM Sans",sans-serif',
            }}>
            Cancel
          </button>
          <button onClick={handleSend} disabled={sending || !title.trim() || !body.trim()}
            className="cp-btn"
            style={{
              flex: 2, padding: '12px 0', borderRadius: 12, border: 'none',
              background: (!title.trim() || !body.trim())
                ? '#e2e8f0'
                : 'linear-gradient(135deg,#7c3aed,#4f46e5)',
              fontSize: 13, fontWeight: 700,
              color: (!title.trim() || !body.trim()) ? '#94a3b8' : '#fff',
              fontFamily: '"DM Sans",sans-serif',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
            {sending ? (
              <>
                <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', animation:'spin 0.8s linear infinite', display:'inline-block'}}/>
                Sending…
              </>
            ) : (
              <><Send size={14}/> Send Announcement</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function GlobalMessagingPage() {
  const [messages, setMessages] = useState<PlatformMessage[]>([])
  const [loading, setLoading]   = useState(true)
  const [showCompose, setShowCompose] = useState(false)
  const [filter, setFilter]     = useState<'all' | PlatformMessage['type']>('all')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('platform_messages').select('*').order('created_at', { ascending: false })
    if (error && error.code !== '42P01') toast.error('Failed to load announcements')
    setMessages(data ?? [])
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this announcement? Users who haven\'t seen it yet will no longer receive it.')) return
    const { error } = await supabase.from('platform_messages').delete().eq('id', id)
    if (error) toast.error('Delete failed')
    else { toast.success('Deleted'); setMessages(prev => prev.filter(m => m.id !== id)) }
  }

  const filtered = filter === 'all' ? messages : messages.filter(m => m.type === filter)
  const counts = {
    all: messages.length,
    update: messages.filter(m => m.type === 'update').length,
    alert: messages.filter(m => m.type === 'alert').length,
    event: messages.filter(m => m.type === 'event').length,
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes row_in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        .msg-row { animation: row_in 0.25s ease both; transition: box-shadow 0.2s; }
        .msg-row:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.08)!important; }
        .del-btn { opacity: 0; transition: opacity 0.2s; }
        .msg-row:hover .del-btn { opacity: 1; }
        .flt-btn { transition: all 0.2s; cursor: pointer; }
        .flt-btn:hover { background: #f1f5f9!important; }
      `}</style>

      <div style={{ fontFamily: '"DM Sans",sans-serif', maxWidth: 860, margin: '0 auto' }}>

        {/* ── Page header ── */}
        <div style={{
          background: 'linear-gradient(135deg,#1e0646,#4c1d95)',
          borderRadius: 20, padding: '28px 28px', marginBottom: 28,
          display: 'flex', alignItems: 'center', gap: 20,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position:'absolute', top:-40, right:-40, width:180, height:180,
            borderRadius:'50%', background:'rgba(255,255,255,0.04)', pointerEvents:'none'}}/>
          <div style={{
            width: 56, height: 56, borderRadius: 16, flexShrink: 0,
            background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Megaphone size={26} color="#fbbf24"/>
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontFamily: '"Playfair Display",serif', fontSize: 24, fontWeight: 700,
              color: '#fff', margin: 0, lineHeight: 1.2,
            }}>Platform Announcements</h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: '5px 0 0' }}>
              Send targeted announcements to specific roles — they appear as a popup to every affected user.
            </p>
          </div>
          <button onClick={() => setShowCompose(true)} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px',
            borderRadius: 12, border: '1px solid rgba(251,191,36,0.4)',
            background: 'rgba(251,191,36,0.15)', color: '#fbbf24',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            fontFamily: '"DM Sans",sans-serif', flexShrink: 0, transition: 'all 0.2s',
          }}>
            <Plus size={16}/> New Announcement
          </button>
        </div>

        {/* ── Stats + filters ── */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {([
            { key: 'all', label: 'All', emoji: '📋' },
            { key: 'update', label: 'Updates', emoji: '📢' },
            { key: 'alert', label: 'Alerts', emoji: '🚨' },
            { key: 'event', label: 'Events', emoji: '📅' },
          ] as const).map(f => (
            <button key={f.key} className="flt-btn"
              onClick={() => setFilter(f.key)}
              style={{
                padding: '8px 16px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                border: filter === f.key ? '2px solid #7c3aed' : '2px solid #e2e8f0',
                background: filter === f.key ? '#f5f3ff' : '#fff',
                color: filter === f.key ? '#7c3aed' : '#64748b',
                fontFamily: '"DM Sans",sans-serif',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
              {f.emoji} {f.label}
              <span style={{
                background: filter === f.key ? '#7c3aed' : '#e2e8f0',
                color: filter === f.key ? '#fff' : '#64748b',
                fontSize: 10, fontWeight: 800, borderRadius: 99, padding: '1px 7px',
              }}>{counts[f.key]}</span>
            </button>
          ))}
        </div>

        {/* ── Message list ── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
            <div style={{ width:28, height:28, borderRadius:'50%', border:'3px solid #ede9fe',
              borderTopColor:'#7c3aed', animation:'spin 0.8s linear infinite', margin:'0 auto 12px'}}/>
            Loading announcements…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: 60, background: '#fff', borderRadius: 20,
            border: '1px solid #e2e8f0',
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
              No announcements yet
            </div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>
              Create your first announcement — it will popup for all targeted users.
            </div>
            <button onClick={() => setShowCompose(true)} style={{
              padding: '10px 20px', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
              color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              fontFamily: '"DM Sans",sans-serif', display: 'inline-flex', alignItems: 'center', gap: 8,
            }}>
              <Plus size={14}/> Create Announcement
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((msg, i) => {
              const tCfg = TYPES.find(t => t.value === msg.type)!
              return (
                <div key={msg.id} className="msg-row" style={{
                  background: '#fff', borderRadius: 16, padding: '18px 20px',
                  border: '1px solid #e2e8f0', display: 'flex', gap: 16,
                  animationDelay: `${i * 0.04}s`,
                }}>
                  {/* Type icon */}
                  <div style={{
                    width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                    background: tCfg.bg, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 22,
                  }}>{tCfg.emoji}</div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>{msg.title}</span>
                      {typeBadge(msg.type)}
                      {audienceBadge(msg.target_audience)}
                    </div>
                    <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
                      {msg.body}
                    </p>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Calendar size={11}/> {fmtDate(msg.created_at)}
                      &nbsp;·&nbsp;
                      <Users size={11}/> {AUDIENCES.find(a => a.value === msg.target_audience)?.sub}
                    </div>
                  </div>

                  {/* Delete */}
                  <button className="del-btn" onClick={() => handleDelete(msg.id)} style={{
                    width: 36, height: 36, borderRadius: 10, border: 'none',
                    background: '#fee2e2', color: '#dc2626', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    transition: 'all 0.2s',
                  }}>
                    <Trash2 size={15}/>
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Compose panel */}
      {showCompose && <ComposePanel onClose={() => setShowCompose(false)} onSent={load} />}
    </>
  )
}
