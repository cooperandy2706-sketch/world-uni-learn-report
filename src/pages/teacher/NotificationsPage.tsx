import { useStuckLoadingReload } from '../../hooks/useStuckLoadingReload'
// src/pages/teacher/NotificationsPage.tsx
import { useState, useEffect } from 'react'
import {
  Bell,
  Megaphone,
  Info,
  Calendar,
  FileText,
  ClipboardList,
  Clock,
  PartyPopper,
  CheckCheck,
  Inbox,
  Pin,
  ExternalLink,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import EnablePushButton from '../../components/ui/EnablePushButton'
import { Button } from '../../components/ui/Button'

const TYPE_ICON: Record<string, typeof Bell> = {
  info: Info,
  class_reminder: Bell,
  announcement: Megaphone,
  meeting: Calendar,
  test: FileText,
  exam: ClipboardList,
  reminder: Clock,
  holiday: PartyPopper,
}

export default function TeacherNotificationsPage() {
  const { user } = useAuth()
  const [notifs, setNotifs] = useState<any[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useStuckLoadingReload(loading)
  const [tab, setTab] = useState<'notifications' | 'announcements'>('notifications')

  useEffect(() => {
    if (user) load()
  }, [user])

  async function load() {
    setLoading(true)
    const [{ data: n }, { data: a }] = await Promise.all([
      supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('announcements')
        .select('*,from_user:users(full_name),reads:announcement_reads(id)')
        .eq('school_id', user!.school_id)
        .in('target_role', ['all', 'teacher'])
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false }),
    ])
    setNotifs(n ?? [])
    setAnnouncements(a ?? [])
    setLoading(false)
  }

  async function markAllRead() {
    const unread = notifs.filter((n) => !n.is_read).map((n) => n.id)
    if (unread.length === 0) return
    await supabase.from('notifications').update({ is_read: true }).in('id', unread)
    load()
  }

  async function markRead(id: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
  }

  async function markAnnouncementRead(annId: string) {
    await supabase
      .from('announcement_reads')
      .insert({ announcement_id: annId, user_id: user!.id })
      .onConflict('announcement_id,user_id' as any)
      .ignore()
    load()
  }

  const unreadCount = notifs.filter((n) => !n.is_read).length

  return (
    <div className="t-page">
      <header className="t-header">
        <div>
          <h1 className="t-title">
            Notifications
            {unreadCount > 0 && (
              <span className="t-badge t-badge--danger" style={{ marginLeft: 10, verticalAlign: 'middle' }}>
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="t-subtitle">Your notifications and announcements from admin</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllRead}>
            <CheckCheck size={16} /> Mark all read
          </Button>
        )}
      </header>

      <EnablePushButton />

      <div className="t-tabs">
        {[
          {
            k: 'notifications' as const,
            label: `Notifications${unreadCount > 0 ? ` (${unreadCount})` : ''}`,
          },
          { k: 'announcements' as const, label: `Announcements (${announcements.length})` },
        ].map((t) => (
          <button
            key={t.k}
            type="button"
            className={`t-tab${tab === t.k ? ' is-active' : ''}`}
            onClick={() => setTab(t.k)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="t-empty">
          <div className="t-spinner" />
        </div>
      ) : tab === 'notifications' ? (
        notifs.length === 0 ? (
          <div className="t-empty">
            <Bell size={44} strokeWidth={1.5} className="t-empty-icon" />
            <h3 className="t-empty-title">No notifications yet</h3>
            <p className="t-empty-desc">You&apos;re all caught up.</p>
          </div>
        ) : (
          <div className="t-card">
            {notifs.map((n) => {
              const Icon = TYPE_ICON[n.type] ?? Bell
              return (
                <button
                  key={n.id}
                  type="button"
                  className={`t-list-item t-list-item--btn${n.is_read ? '' : ' is-unread'}`}
                  onClick={() => markRead(n.id)}
                >
                  <span className={`t-list-icon${n.is_read ? '' : ' is-vivid'}`}>
                    <Icon size={18} strokeWidth={2.25} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                    <span className="t-list-title-row">
                      <span className="t-list-title">{n.title}</span>
                      {!n.is_read && <span className="t-dot" aria-hidden />}
                    </span>
                    {n.body && <p className="t-list-body">{n.body}</p>}
                    <span className="t-list-meta">{new Date(n.created_at).toLocaleString()}</span>
                  </span>
                </button>
              )
            })}
          </div>
        )
      ) : announcements.length === 0 ? (
        <div className="t-empty">
          <Inbox size={44} strokeWidth={1.5} className="t-empty-icon" />
          <h3 className="t-empty-title">No announcements yet</h3>
          <p className="t-empty-desc">School-wide updates will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {announcements.map((a: any) => {
            const isRead = (a.reads ?? []).some((r: any) => r.user_id === user!.id)
            const Icon = TYPE_ICON[a.type] ?? Megaphone
            return (
              <button
                key={a.id}
                type="button"
                className={`t-card t-announce${isRead ? '' : ' is-unread'}${a.is_pinned ? ' is-pinned' : ''}`}
                onClick={() => markAnnouncementRead(a.id)}
                style={{ textAlign: 'left', cursor: 'pointer', width: '100%' }}
              >
                <div className="t-card-body" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span className={`t-list-icon${isRead ? '' : ' is-vivid'}`}>
                    <Icon size={18} strokeWidth={2.25} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span className="t-list-title-row">
                      <span className="t-list-title">{a.title}</span>
                      {a.is_pinned && (
                        <span className="t-badge t-badge--warning">
                          <Pin size={10} /> Pinned
                        </span>
                      )}
                      {!isRead && <span className="t-badge">New</span>}
                    </span>
                    <p className="t-list-body">{a.body}</p>
                    {a.meeting_date && (
                      <p className="t-list-meta" style={{ color: 'var(--t-info)', fontWeight: 700 }}>
                        <Calendar size={12} style={{ display: 'inline', verticalAlign: -2, marginRight: 4 }} />
                        {new Date(a.meeting_date).toLocaleString()}
                        {a.meeting_link && (
                          <a
                            href={a.meeting_link}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{ marginLeft: 8, color: 'var(--t-accent)' }}
                          >
                            Join <ExternalLink size={11} style={{ display: 'inline', verticalAlign: -1 }} />
                          </a>
                        )}
                      </p>
                    )}
                    <span className="t-list-meta">
                      From {a.from_user?.full_name ?? 'Admin'} ·{' '}
                      {new Date(a.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
