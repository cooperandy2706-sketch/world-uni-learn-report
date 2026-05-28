import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { Megaphone } from 'lucide-react'

export default function AdminAnnouncementHeaderPill() {
  const { user, isAdmin } = useAuth()
  const [announcement, setAnnouncement] = useState<any>(null)

  useEffect(() => {
    if (!isAdmin || !user?.school_id) return
    loadLatest()
    
    // Subscribe to changes to keep header updated
    const channel = supabase.channel('header-announcements')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'announcements', 
        filter: `school_id=eq.${user.school_id}` 
      }, () => loadLatest())
      .subscribe()
      
    return () => { supabase.removeChannel(channel) }
  }, [isAdmin, user?.school_id])

  async function loadLatest() {
    const { data } = await supabase.from('announcements')
      .select('*')
      .eq('school_id', user!.school_id)
      .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      
    setAnnouncement(data)
  }

  if (!isAdmin || !announcement) return <div style={{ flex: 1 }} /> // maintain spacing

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px',
      background: 'linear-gradient(90deg, #fef2f2, #fff)', border: '1px solid #fecaca', borderRadius: 99,
      flex: 1, margin: '0 16px', maxWidth: 500, overflow: 'hidden', boxShadow: '0 2px 4px rgba(220, 38, 38, 0.05)'
    }}>
      <Megaphone size={14} color="#dc2626" style={{ flexShrink: 0, animation: 'pulse 2s infinite' }} />
      <span style={{ fontSize: 12, fontWeight: 800, color: '#b91c1c', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {announcement.is_pinned ? '📌 Pinned' : '📢 Latest'}
      </span>
      <span style={{ fontSize: 13, color: '#7f1d1d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600 }}>
        {announcement.title} {announcement.body ? `— ${announcement.body}` : ''}
      </span>
    </div>
  )
}
