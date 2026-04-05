import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { Send, Search, Plus, Users, MessageSquare, X, ArrowLeft, User } from 'lucide-react'
import toast from 'react-hot-toast'

// ─── Types ────────────────────────────────────────────────────────────────────
interface DBConv {
  id: string; name: string | null; type: 'group' | 'direct'
  group_key: string | null; last_message_at: string | null
  last_message_preview: string | null; created_at: string
}
interface Conversation extends DBConv {
  unread: number; dm_partner_name?: string; dm_partner_role?: string; dm_partner_id?: string
}
interface Message {
  id: string; conversation_id: string; sender_id: string | null
  body: string; created_at: string
  sender?: { full_name: string; role: string }
}
interface EligibleUser { id: string; full_name: string; role: string; school_id: string | null }

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(d: string | null) {
  if (!d) return ''
  const ms = Date.now() - new Date(d).getTime()
  const m = Math.floor(ms / 60000)
  if (m < 1) return 'now'; if (m < 60) return `${m}m`
  const h = Math.floor(m / 60); if (h < 24) return `${h}h`
  const dy = Math.floor(h / 24); if (dy < 7) return `${dy}d`
  return new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric' })
}
function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: true })
}
function dateSep(d: string) {
  const date = new Date(d); const now = new Date()
  const yest = new Date(now); yest.setDate(yest.getDate() - 1)
  if (date.toDateString() === now.toDateString()) return 'Today'
  if (date.toDateString() === yest.toDateString()) return 'Yesterday'
  return date.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })
}
function roleLabel(r: string) {
  return r === 'super_admin' ? 'Super Admin' : r === 'admin' ? 'Admin' : r === 'teacher' ? 'Teacher' : r
}
function roleColor(r: string) {
  return r === 'super_admin' ? '#10b981' : r === 'admin' ? '#fbbf24' : r === 'teacher' ? '#a78bfa' : '#94a3b8'
}
function avatarLetter(name?: string | null) { return (name ?? '?').charAt(0).toUpperCase() }
function convDisplayName(conv: Conversation) {
  return conv.type === 'direct' ? (conv.dm_partner_name ?? 'Direct Message') : (conv.name ?? 'Group')
}

// ─── Group provisioning ───────────────────────────────────────────────────────
async function upsertGroup(key: string, name: string | null, memberIds: string[], type: 'group' | 'direct' = 'group'): Promise<string | null> {
  const { data: ex } = await supabase.from('chat_conversations').select('id').eq('group_key', key).maybeSingle()
  let convId = ex?.id ?? null
  if (!convId) {
    const newId = crypto.randomUUID()
    const { error } = await supabase.from('chat_conversations')
      .insert({ id: newId, name, type, group_key: key })
    
    if (error) {
      // Possible race condition
      const { data: retry } = await supabase.from('chat_conversations').select('id').eq('group_key', key).maybeSingle()
      convId = retry?.id ?? null
    } else {
      convId = newId
    }
  }
  if (convId && memberIds.length) {
    // Bulk upsert with ignoreDuplicates silently ignores existing records without throwing 409 Conflict
    await supabase.from('chat_members').upsert(
      memberIds.map(uid => ({ conversation_id: convId, user_id: uid })),
      { onConflict: 'conversation_id,user_id', ignoreDuplicates: true }
    )
  }
  return convId
}

// ─── useIsMobile ─────────────────────────────────────────────────────────────
function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return mobile
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MessagingPage() {
  const { user, isSuperAdmin, isAdmin, isTeacher } = useAuth()
  const isMobile = useIsMobile()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConv, setActiveConv]   = useState<Conversation | null>(null)
  const [messages, setMessages]       = useState<Message[]>([])
  const [inputText, setInputText]     = useState('')
  const [search, setSearch]           = useState('')
  const [showNewDM, setShowNewDM]     = useState(false)
  const [eligibleUsers, setEligibleUsers] = useState<EligibleUser[]>([])
  const [dmSearch, setDmSearch]       = useState('')
  const [loading, setLoading]         = useState(true)
  const [msgLoading, setMsgLoading]   = useState(false)
  const [sending, setSending]         = useState(false)
  const [memberCount, setMemberCount] = useState(0)
  // Mobile: 'list' | 'chat'
  const [mobileView, setMobileView]   = useState<'list' | 'chat'>('list')

  const bottomRef  = useRef<HTMLDivElement>(null)
  const channelRef = useRef<any>(null)
  const inputRef   = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    if (!user) return
    init()
    return () => { channelRef.current?.unsubscribe() }
  }, [user?.id])

  // ── Init ──────────────────────────────────────────────────────────────────
  async function init() {
    setLoading(true)
    try { await provisionGroups(); await loadConversations() }
    catch (e) { console.error('Messaging init', e) }
    setLoading(false)
  }

  async function provisionGroups() {
    if (!user) return
    if (isSuperAdmin) {
      const [{ data: admins }, { data: teachers }, { data: schools }] = await Promise.all([
        supabase.from('users').select('id').eq('role', 'admin'),
        supabase.from('users').select('id').eq('role', 'teacher'),
        supabase.from('schools').select('id, name'),
      ])
      await upsertGroup('global_admins', '📢 Global Admins',
        [user.id, ...(admins?.map(a => a.id) ?? [])])
      await upsertGroup('global_teachers', '🌍 All Teachers',
        [user.id, ...(teachers?.map(t => t.id) ?? [])])
      for (const school of schools ?? []) {
        const { data: st } = await supabase.from('users').select('id').eq('role', 'teacher').eq('school_id', school.id)
        if (st?.length) await upsertGroup(`school_${school.id}_teachers`, `🏫 ${school.name} Teachers`, [...new Set([user.id, ...st.map(t => t.id)])])
      }
      // Auto-provision 1-on-1 DM threads immediately for everyone
      const allUsers = [...(admins ?? []), ...(teachers ?? [])]
      const promises = allUsers.map(u => {
        const sorted = [user.id, u.id].sort().join('_')
        return upsertGroup(`dm_${sorted}`, null, [user.id, u.id], 'direct')
      })
      await Promise.all(promises)
    } else if (isAdmin) {
      const [{ data: sa }, { data: al }] = await Promise.all([
        supabase.from('users').select('id').eq('role', 'super_admin'),
        supabase.from('users').select('id').eq('role', 'admin'),
      ])
      await upsertGroup('global_admins', '📢 Global Admins',
        [...new Set([user.id, ...(sa?.map(s => s.id) ?? []), ...(al?.map(a => a.id) ?? [])])])
      
      // Admin DM auto-provisioning
      const allUsers = [...(sa ?? []), ...(al ?? [])]
      const promises = allUsers.map(u => {
        const sorted = [user.id, u.id].sort().join('_')
        return upsertGroup(`dm_${sorted}`, null, [user.id, u.id], 'direct')
      })
      await Promise.all(promises)
    } else if (isTeacher) {
      const [{ data: sa }, { data: at }] = await Promise.all([
        supabase.from('users').select('id').eq('role', 'super_admin'),
        supabase.from('users').select('id').eq('role', 'teacher'),
      ])
      await upsertGroup('global_teachers', '🌍 All Teachers',
        [...new Set([user.id, ...(sa?.map(s => s.id) ?? []), ...(at?.map(t => t.id) ?? [])])])
      if (user.school_id) {
        const { data: st } = await supabase.from('users').select('id').eq('role', 'teacher').eq('school_id', user.school_id)
        const schoolName = (user as any).school?.name ?? 'My School'
        await upsertGroup(`school_${user.school_id}_teachers`, `🏫 ${schoolName} Teachers`,
          [...new Set([user.id, ...(st?.map(t => t.id) ?? [])])])
      }
      
      // Teacher DM auto-provisioning
      const allUsers = [...(sa ?? []), ...(at ?? [])]
      const promises = allUsers.map(u => {
        if (u.id === user.id) return Promise.resolve(null)
        const sorted = [user.id, u.id].sort().join('_')
        return upsertGroup(`dm_${sorted}`, null, [user.id, u.id], 'direct')
      })
      await Promise.all(promises)
    }
  }

  async function loadConversations() {
    if (!user) return
    const { data: memberRows } = await supabase
      .from('chat_members').select('conversation_id, last_read_at').eq('user_id', user.id)
    if (!memberRows?.length) { setConversations([]); return }

    const convIds = memberRows.map(m => m.conversation_id)
    const lastReadMap: Record<string, string> = {}
    memberRows.forEach(m => { lastReadMap[m.conversation_id] = m.last_read_at })

    const { data: convRows } = await supabase
      .from('chat_conversations').select('*').in('id', convIds)
      .order('last_message_at', { ascending: false, nullsFirst: false })
    if (!convRows) { setConversations([]); return }

    const unreadCounts: Record<string, number> = {}
    await Promise.all(convIds.map(async cid => {
      const { count } = await supabase.from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', cid)
        .gt('created_at', lastReadMap[cid] ?? '1970-01-01')
        .neq('sender_id', user.id)
      unreadCounts[cid] = count ?? 0
    }))

    const enriched: Conversation[] = await Promise.all(convRows.map(async conv => {
      let dm_partner_name: string | undefined, dm_partner_role: string | undefined, dm_partner_id: string | undefined
      if (conv.type === 'direct') {
        const { data: p } = await supabase.from('chat_members')
          .select('user_id, users!inner(full_name, role)')
          .eq('conversation_id', conv.id).neq('user_id', user.id).limit(1).single()
        dm_partner_id = (p as any)?.user_id
        dm_partner_name = (p as any)?.users?.full_name
        dm_partner_role = (p as any)?.users?.role
      }
      return { ...conv, unread: unreadCounts[conv.id] ?? 0, dm_partner_name, dm_partner_role, dm_partner_id }
    }))

    const finalConvs: Conversation[] = []
    const seenPartners = new Set<string>()
    for (const c of enriched) {
      if (c.type === 'direct' && c.dm_partner_id) {
        if (seenPartners.has(c.dm_partner_id)) continue
        seenPartners.add(c.dm_partner_id)
      }
      finalConvs.push(c)
    }
    setConversations(finalConvs)
  }

  async function selectConv(conv: Conversation) {
    channelRef.current?.unsubscribe()
    setActiveConv(conv); setMsgLoading(true); setMessages([])
    if (isMobile) setMobileView('chat')

    const { data: msgs } = await supabase.from('chat_messages')
      .select('id, conversation_id, sender_id, body, created_at, sender:users!sender_id(full_name, role)')
      .eq('conversation_id', conv.id).order('created_at').limit(150)
    setMessages((msgs as unknown as Message[]) ?? [])
    setMsgLoading(false)

    await supabase.from('chat_members')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conv.id).eq('user_id', user!.id)
    setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unread: 0 } : c))

    const { count } = await supabase.from('chat_members')
      .select('*', { count: 'exact', head: true }).eq('conversation_id', conv.id)
    setMemberCount(count ?? 0)

    channelRef.current = supabase.channel(`msgs:${conv.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages',
        filter: `conversation_id=eq.${conv.id}` }, async payload => {
        const nm = payload.new as Message
        if (nm.sender_id) {
          const { data: s } = await supabase.from('users').select('full_name, role').eq('id', nm.sender_id).single()
          nm.sender = s || undefined
        }
        setMessages(prev => prev.some(m => m.id === nm.id) ? prev : [...prev, nm])
        setConversations(prev => prev.map(c =>
          c.id === conv.id ? { ...c, last_message_preview: nm.body, last_message_at: nm.created_at } : c
        ))
        await supabase.from('chat_members').update({ last_read_at: new Date().toISOString() })
          .eq('conversation_id', conv.id).eq('user_id', user!.id)
      }).subscribe()

    setTimeout(() => inputRef.current?.focus(), 200)
  }

  async function sendMessage() {
    const body = inputText.trim()
    if (!body || !activeConv || !user || sending) return
    setInputText(''); setSending(true)
    const { error } = await supabase.from('chat_messages')
      .insert({ conversation_id: activeConv.id, sender_id: user.id, body })
    if (error) { toast.error('Failed to send'); setInputText(body) }
    else {
      await supabase.from('chat_conversations').update({
        last_message_at: new Date().toISOString(),
        last_message_preview: body.length > 60 ? body.slice(0, 57) + '…' : body,
      }).eq('id', activeConv.id)
    }
    setSending(false)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  async function openNewDM() {
    setShowNewDM(true); setDmSearch('')
    if (!eligibleUsers.length) {
      const { data } = await supabase.from('users')
        .select('id, full_name, role, school_id')
        .in('role', ['super_admin', 'admin', 'teacher']).neq('id', user!.id).order('full_name')
      setEligibleUsers(data ?? [])
    }
  }

  async function startDM(target: EligibleUser) {
    if (!user) return
    const { data: myConvIds } = await supabase.from('chat_members')
      .select('conversation_id').eq('user_id', user.id)
    const ids = myConvIds?.map(m => m.conversation_id) ?? []
    if (ids.length) {
      const { data: shared } = await supabase.from('chat_members')
        .select('conversation_id').eq('user_id', target.id).in('conversation_id', ids)
      for (const s of shared ?? []) {
        const { data: c } = await supabase.from('chat_conversations').select('*')
          .eq('id', s.conversation_id).eq('type', 'direct').maybeSingle()
        if (c) { setShowNewDM(false); selectConv({ ...c, unread: 0, dm_partner_name: target.full_name, dm_partner_role: target.role }); return }
      }
    }
    const newId = crypto.randomUUID()
    const { error } = await supabase.from('chat_conversations').insert({ id: newId, type: 'direct' })
    if (!error) {
      await supabase.from('chat_members').insert([
        { conversation_id: newId, user_id: user.id },
        { conversation_id: newId, user_id: target.id },
      ])
      setShowNewDM(false)
      await loadConversations()
      selectConv({ 
        id: newId, type: 'direct', name: null, group_key: null,
        created_at: new Date().toISOString(), last_message_at: null, last_message_preview: null,
        unread: 0, dm_partner_name: target.full_name, dm_partner_role: target.role 
      })
    }
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const filteredConvs = conversations.filter(c =>
    convDisplayName(c).toLowerCase().includes(search.toLowerCase())
  )
  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0)

  // Date-separated messages
  type Item = { kind: 'sep'; label: string; key: string } | { kind: 'msg'; msg: Message }
  const items: Item[] = []
  let lastDate = ''
  for (const msg of messages) {
    const ds = new Date(msg.created_at).toDateString()
    if (ds !== lastDate) { items.push({ kind: 'sep', label: dateSep(msg.created_at), key: ds }); lastDate = ds }
    items.push({ kind: 'msg', msg })
  }

  const convName = activeConv ? convDisplayName(activeConv) : ''

  // ─── Sub-components ───────────────────────────────────────────────────────

  // Conversation list (shared on both mobile/desktop)
  function ConvList() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <div style={{
          padding: isMobile ? '16px 16px 10px' : '20px 16px 12px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          background: 'linear-gradient(175deg,#1e0646 0%,#2d0a6e 55%,#3b0764 100%)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <MessageSquare size={20} color="#fbbf24"/>
              <span style={{ fontSize: isMobile ? 18 : 17, fontWeight: 700, color: '#fff' }}>Messages</span>
              {totalUnread > 0 && (
                <span style={{ background: '#ef4444', color: '#fff', fontSize: 11, fontWeight: 800,
                  borderRadius: 99, padding: '1px 7px' }}>{totalUnread}</span>
              )}
            </div>
            <button onClick={openNewDM} style={{
              background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)',
              borderRadius: 10, padding: isMobile ? '8px 12px' : '6px 10px',
              cursor: 'pointer', color: '#fbbf24',
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 12, fontWeight: 600,
            }}>
              <Plus size={14}/> New DM
            </button>
          </div>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={13} color="rgba(255,255,255,0.3)"
              style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }}/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations…"
              style={{
                width: '100%', padding: '10px 10px 10px 32px', borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.09)', background: 'rgba(255,255,255,0.06)',
                color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box',
              }}/>
          </div>
        </div>

        {/* List */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '6px 8px',
          background: 'linear-gradient(175deg,#1e0646 0%,#2d0a6e 55%,#3b0764 100%)',
        }}>
          {loading ? (
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', paddingTop: 40 }}>Loading…</div>
          ) : filteredConvs.length === 0 ? (
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center', paddingTop: 48 }}>
              <MessageSquare size={36} color="rgba(255,255,255,0.15)" style={{ marginBottom: 10 }}/>
              <div>No conversations yet</div>
              <div style={{ fontSize: 11, marginTop: 4 }}>Tap + New DM to start one</div>
            </div>
          ) : filteredConvs.map(conv => {
            const isGroup = conv.type === 'group'
            const name = convDisplayName(conv)
            const isAct = activeConv?.id === conv.id && !isMobile

            return (
              <div key={conv.id}
                onClick={() => selectConv(conv)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: isMobile ? '13px 10px' : '10px 10px',
                  borderRadius: 14, marginBottom: 2, cursor: 'pointer',
                  background: isAct ? 'rgba(255,255,255,0.13)' : 'transparent',
                  borderLeft: isAct ? '3px solid #fbbf24' : '3px solid transparent',
                  transition: 'all 0.15s',
                  WebkitTapHighlightColor: 'transparent',
                }}>
                {/* Avatar */}
                <div style={{
                  width: isMobile ? 52 : 46, height: isMobile ? 52 : 46, flexShrink: 0,
                  borderRadius: isGroup ? 14 : 50,
                  background: isGroup
                    ? 'linear-gradient(135deg,#7c3aed,#a855f7)'
                    : 'linear-gradient(135deg,#f59e0b,#fbbf24)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: isGroup ? 18 : 17, fontWeight: 700,
                  boxShadow: '0 3px 10px rgba(0,0,0,0.25)', position: 'relative',
                }}>
                  {isGroup
                    ? (['📢','🌍','🏫'].includes(name.charAt(0)) ? name.charAt(0) : <Users size={20}/>)
                    : avatarLetter(conv.dm_partner_name)}
                  {conv.unread > 0 && (
                    <span style={{
                      position: 'absolute', top: -5, right: -5,
                      background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 800,
                      borderRadius: 99, padding: '1px 5px', minWidth: 18, textAlign: 'center',
                      border: '2px solid #1e0646',
                    }}>{conv.unread > 99 ? '99+' : conv.unread}</span>
                  )}
                </div>
                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
                    <span style={{
                      fontSize: isMobile ? 15 : 13.5, fontWeight: conv.unread ? 700 : 600,
                      color: conv.unread ? '#fff' : 'rgba(255,255,255,0.8)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                    }}>{name}</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', flexShrink: 0, marginLeft: 6 }}>
                      {timeAgo(conv.last_message_at)}
                    </span>
                  </div>
                  <span style={{
                    fontSize: isMobile ? 13 : 12,
                    color: conv.unread ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.4)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block',
                    fontWeight: conv.unread ? 500 : 400,
                  }}>
                    {conv.last_message_preview ?? 'No messages yet'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Chat panel (shared on both mobile/desktop)
  function ChatPanel() {
    if (!activeConv) return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 16, color: '#94a3b8',
        background: '#f6f7fb',
      }}>
        <div style={{ width: 72, height: 72, borderRadius: 50, background: 'rgba(124,58,237,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <MessageSquare size={34} color="#7c3aed" strokeWidth={1.5}/>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>Select a conversation</div>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>Choose from the left or start a new DM</div>
        </div>
      </div>
    )

    const isGroup = activeConv.type === 'group'

    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f6f7fb', minHeight: 0 }}>
        {/* Chat Header */}
        <div style={{
          padding: isMobile ? '12px 14px' : '14px 20px',
          background: '#fff', borderBottom: '1px solid #e8eaf0',
          display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 1px 6px rgba(0,0,0,0.05)', flexShrink: 0,
        }}>
          {/* Mobile back button */}
          {isMobile && (
            <button onClick={() => { setMobileView('list') }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 4px 4px 0',
                display: 'flex', alignItems: 'center', WebkitTapHighlightColor: 'transparent' }}>
              <ArrowLeft size={22} color="#7c3aed"/>
            </button>
          )}
          <div style={{
            width: 40, height: 40, borderRadius: isGroup ? 13 : 50, flexShrink: 0,
            background: isGroup ? 'linear-gradient(135deg,#7c3aed,#a855f7)' : 'linear-gradient(135deg,#f59e0b,#fbbf24)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: isGroup ? 20 : 17, color: '#fff', fontWeight: 700,
          }}>
            {isGroup
              ? (['📢','🌍','🏫'].includes(convName.charAt(0)) ? convName.charAt(0) : <Users size={18}/>)
              : avatarLetter(convName)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: isMobile ? 16 : 15, fontWeight: 700, color: '#1e293b',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{convName}</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>
              {isGroup ? `${memberCount} members` : roleLabel(activeConv.dm_partner_role ?? '')}
            </div>
          </div>
          {isGroup && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5,
              background: 'rgba(124,58,237,0.08)', borderRadius: 99, padding: '5px 12px', flexShrink: 0 }}>
              <Users size={13} color="#7c3aed"/>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#7c3aed' }}>{memberCount}</span>
            </div>
          )}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '14px 12px' : '20px',
          display: 'flex', flexDirection: 'column', gap: 2 }}>
          {msgLoading ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: 40 }}>Loading…</div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: 60, fontSize: 14 }}>
              No messages yet. Say hello 👋
            </div>
          ) : items.map((item) => {
            if (item.kind === 'sep') return (
              <div key={item.key} style={{ textAlign: 'center', margin: '10px 0' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8',
                  background: '#e8eaf0', borderRadius: 99, padding: '3px 12px' }}>
                  {item.label}
                </span>
              </div>
            )
            const { msg } = item
            const isMine = msg.sender_id === user?.id
            return (
              <div key={msg.id} style={{
                display: 'flex', flexDirection: 'column',
                alignItems: isMine ? 'flex-end' : 'flex-start', marginBottom: 3,
              }}>
                {isGroup && !isMine && (
                  <div style={{ fontSize: 11, fontWeight: 600, color: roleColor(msg.sender?.role ?? ''),
                    marginBottom: 3, marginLeft: 2 }}>
                    {msg.sender?.full_name ?? 'Unknown'} · {roleLabel(msg.sender?.role ?? '')}
                  </div>
                )}
                <div style={{
                  maxWidth: isMobile ? '82%' : '72%',
                  padding: isMobile ? '11px 14px' : '10px 14px',
                  borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: isMine ? 'linear-gradient(135deg,#7c3aed,#9333ea)' : '#fff',
                  color: isMine ? '#fff' : '#1e293b',
                  fontSize: isMobile ? 15 : 14, lineHeight: 1.5,
                  boxShadow: isMine ? '0 4px 14px rgba(124,58,237,0.25)' : '0 2px 8px rgba(0,0,0,0.06)',
                  wordBreak: 'break-word',
                }}>
                  {msg.body}
                </div>
                <span style={{ fontSize: 11, color: '#94a3b8', marginTop: 3,
                  marginLeft: isMine ? 0 : 2, marginRight: isMine ? 2 : 0 }}>
                  {fmtTime(msg.created_at)}
                </span>
              </div>
            )
          })}
          <div ref={bottomRef}/>
        </div>

        {/* Input */}
        <div style={{
          padding: isMobile ? '10px 12px' : '12px 16px',
          background: '#fff', borderTop: '1px solid #e8eaf0',
          display: 'flex', alignItems: 'flex-end', gap: 10, flexShrink: 0,
          // On mobile: give extra padding so it sits above system UI
          paddingBottom: isMobile ? 'max(10px, env(safe-area-inset-bottom))' : '12px',
        }}>
          <textarea ref={inputRef} value={inputText}
            onChange={e => setInputText(e.target.value)} onKeyDown={handleKey}
            placeholder="Type a message…"
            rows={1}
            style={{
              flex: 1, padding: '12px 14px', borderRadius: 22,
              border: '1.5px solid #e2e8f0', background: '#f8fafc',
              fontSize: isMobile ? 16 : 14, fontFamily: '"DM Sans",sans-serif',
              resize: 'none', outline: 'none', lineHeight: 1.5,
              maxHeight: 120, overflowY: 'auto', transition: 'border 0.2s',
            }}
            onFocus={e => e.currentTarget.style.borderColor = '#7c3aed'}
            onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
          />
          <button onClick={sendMessage} disabled={!inputText.trim() || sending}
            style={{
              width: isMobile ? 50 : 46, height: isMobile ? 50 : 46, borderRadius: '50%',
              border: 'none', cursor: inputText.trim() ? 'pointer' : 'default', flexShrink: 0,
              background: inputText.trim()
                ? 'linear-gradient(135deg,#7c3aed,#9333ea)' : '#e2e8f0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s', WebkitTapHighlightColor: 'transparent',
              boxShadow: inputText.trim() ? '0 4px 14px rgba(124,58,237,0.35)' : 'none',
            }}>
            <Send size={isMobile ? 20 : 18} color={inputText.trim() ? '#fff' : '#94a3b8'}/>
          </button>
        </div>
      </div>
    )
  }

  // ── New DM modal ──────────────────────────────────────────────────────────
  function NewDMModal() {
    if (!showNewDM) return null
    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end',
        justifyContent: 'center', zIndex: 9999,
        // On mobile: modal slides up from bottom
        ...(isMobile ? { alignItems: 'flex-end' } : { alignItems: 'center' }),
      }} onClick={() => setShowNewDM(false)}>
        <div onClick={e => e.stopPropagation()} style={{
          width: '100%', maxWidth: isMobile ? '100%' : 420,
          background: '#fff', overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
          borderRadius: isMobile ? '20px 20px 0 0' : 20,
          maxHeight: isMobile ? '85vh' : '70vh',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Drag handle on mobile */}
          {isMobile && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: '#e2e8f0' }}/>
            </div>
          )}
          {/* Header */}
          <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid #f1f5f9',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <User size={18} color="#7c3aed"/>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>New Direct Message</span>
            </div>
            <button onClick={() => setShowNewDM(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}>
              <X size={18} color="#94a3b8"/>
            </button>
          </div>
          {/* Search */}
          <div style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} color="#94a3b8"
                style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }}/>
              <input value={dmSearch} onChange={e => setDmSearch(e.target.value)}
                placeholder="Search by name…" autoFocus
                style={{
                  width: '100%', padding: '11px 12px 11px 33px', borderRadius: 12,
                  border: '1.5px solid #e2e8f0', fontSize: isMobile ? 16 : 13,
                  outline: 'none', boxSizing: 'border-box',
                }}
                onFocus={e => e.currentTarget.style.borderColor = '#7c3aed'}
                onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
              />
            </div>
          </div>
          {/* Users */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '6px 10px 10px' }}>
            {eligibleUsers
              .filter(u => u.full_name.toLowerCase().includes(dmSearch.toLowerCase()))
              .map(u => (
                <div key={u.id} onClick={() => startDM(u)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: isMobile ? '13px 10px' : '10px 10px',
                    borderRadius: 12, cursor: 'pointer', transition: 'background 0.15s',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{
                    width: isMobile ? 44 : 38, height: isMobile ? 44 : 38,
                    borderRadius: 50, flexShrink: 0,
                    background: 'linear-gradient(135deg,#f59e0b,#fbbf24)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 700, color: '#fff',
                  }}>
                    {avatarLetter(u.full_name)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: isMobile ? 15 : 13.5, fontWeight: 600, color: '#1e293b' }}>{u.full_name}</div>
                    <div style={{ fontSize: 11.5, color: roleColor(u.role), fontWeight: 600, marginTop: 1 }}>
                      {roleLabel(u.role)}
                    </div>
                  </div>
                </div>
              ))
            }
            {eligibleUsers.length === 0 && (
              <div style={{ textAlign: 'center', padding: 30, color: '#94a3b8', fontSize: 13 }}>Loading…</div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes pop{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        .mbbl{animation:pop 0.18s ease}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:99px}
      `}</style>

      {isMobile ? (
        /* ── MOBILE: single-column, slide between list/chat ── */
        <div style={{
          display: 'flex', height: 'calc(100dvh - 150px)', fontFamily: '"DM Sans",sans-serif',
          borderRadius: 20, overflow: 'hidden', flexDirection: 'column', background: '#f6f7fb',
          border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
        }}>
          {mobileView === 'list' ? ConvList() : ChatPanel()}
        </div>
      ) : (
        /* ── DESKTOP: side-by-side ── */
        <div style={{
          display: 'flex', height: 'calc(100vh - 68px)', fontFamily: '"DM Sans",sans-serif',
          borderRadius: 20, overflow: 'hidden',
          border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 16px 50px rgba(0,0,0,0.1)',
        }}>
          {/* Left */}
          <div style={{ width: 320, minWidth: 320, display: 'flex', flexDirection: 'column' }}>
            {ConvList()}
          </div>
          {/* Right */}
          {ChatPanel()}
        </div>
      )}

      {NewDMModal()}
    </>
  )
}
