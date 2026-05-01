import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { ROUTES } from '../../constants/routes'
import { Link } from 'react-router-dom'
import { Megaphone, Calendar, Clock, Search, Filter, Pin, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

const TYPE_CONFIG: any = {
  announcement: { icon: '📢', color: '#6d28d9', bg: '#f5f3ff', label: 'Announcement' },
  meeting: { icon: '📅', color: '#0369a1', bg: '#eff6ff', label: 'Meeting' },
  reminder: { icon: '⏰', color: '#d97706', bg: '#fffbeb', label: 'Reminder' },
  exam: { icon: '📝', color: '#dc2626', bg: '#fef2f2', label: 'Exam Notice' },
  holiday: { icon: '🎉', color: '#16a34a', bg: '#f0fdf4', label: 'Holiday' },
}

export default function StudentAnnouncementsPage() {
  const { user } = useAuth()
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    setTimeout(() => setMounted(true), 50)
    if (user?.id) loadAnnouncements()
  }, [user?.id])

  async function loadAnnouncements() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*, from_user:users(full_name)')
        .eq('school_id', user!.school_id)
        .or(`target_role.eq.all,target_role.eq.student`)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setAnnouncements(data || [])
    } catch (err: any) {
      toast.error(err.message || 'Failed to load announcements')
    } finally {
      setLoading(false)
    }
  }

  const filtered = announcements.filter(a => {
    const matchesFilter = filter === 'all' || a.type === filter
    const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase()) || a.body.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '70vh', flexDirection: 'column', gap: 16 }}>
      <style>{`@keyframes _ssp{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #ede9fe', borderTopColor: '#6d28d9', animation: '_ssp .8s linear infinite' }} />
      <p style={{ fontSize: 13, color: '#6b7280', fontFamily: '"DM Sans",sans-serif' }}>Fetching announcements…</p>
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _sfu{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .ann-card{background:#fff; border-radius:24px; border:1.5px solid #f0eefe; padding:24px; box-shadow:0 1px 4px rgba(109,40,217,.06); transition:all .3s ease; cursor:pointer}
        .ann-card:hover{box-shadow:0 12px 32px rgba(109,40,217,0.08); transform:translateY(-2px); border-color:#ddd6fe}
        .filter-btn{padding:8px 16px; borderRadius:12px; border:1.5px solid #e5e7eb; background:#fff; color:#64748b; font-size:13px; font-weight:600; cursor:pointer; transition:all .2s; white-space:nowrap}
        .filter-btn.active{background:#f5f3ff; color:#6d28d9; border-color:#6d28d9}
        @media (max-width: 768px) {
          .header-row { flex-direction: column !important; align-items: stretch !important; gap: 16px !important; }
          .ann-card { padding: 20px !important; }
          .ann-meta { flex-direction: column !important; align-items: flex-start !important; gap: 4px !important; }
        }
      `}</style>

      <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif', opacity: mounted ? 1 : 0, transition: 'opacity .4s ease', maxWidth: 900, margin: '0 auto' }}>
        
        {/* Header */}
        <div className="header-row" style={{ marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', animation: '_sfu .5s ease both' }}>
          <div>
            <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 28, fontWeight: 700, color: '#111827', margin: 0 }}>Notice Board</h1>
            <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>Stay updated with the latest school news and events</p>
          </div>
          <Link to={ROUTES.STUDENT_DASHBOARD} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600, background: '#fff', color: '#374151', textDecoration: 'none', border: '1.5px solid #e5e7eb', justifyContent: 'center' }}>← Dashboard</Link>
        </div>

        {/* Filters & Search */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 32, animation: '_sfu .5s ease .1s both', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 300 }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search announcements..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: 16, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {['all', 'announcement', 'meeting', 'exam', 'holiday'].map(t => (
              <button 
                key={t} 
                className={`filter-btn ${filter === t ? 'active' : ''}`}
                onClick={() => setFilter(t)}
              >
                {t === 'all' ? 'All Posts' : TYPE_CONFIG[t]?.label || t}
              </button>
            ))}
          </div>
        </div>

        {/* Announcements List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: '_sfu .5s ease .15s both' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', background: '#fff', borderRadius: 24, border: '1.5px solid #f0eefe' }}>
              <Megaphone size={48} color="#ddd6fe" style={{ marginBottom: 16 }} />
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>No notices found</h3>
              <p style={{ fontSize: 14, color: '#64748b' }}>Try adjusting your search or filters to find what you're looking for.</p>
            </div>
          ) : (
            filtered.map((a, i) => {
              const tc = TYPE_CONFIG[a.type] || TYPE_CONFIG.announcement
              return (
                <div key={a.id} className="ann-card" style={{ animation: `_sfu .4s ease ${.2 + i * .05}s both`, borderLeft: a.is_pinned ? '6px solid #fbbf24' : undefined }}>
                  <div style={{ display: 'flex', gap: 20 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 18, background: tc.bg, color: tc.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                      {tc.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="ann-meta" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: tc.color, background: tc.bg, padding: '4px 10px', borderRadius: 99 }}>{tc.label}</span>
                          {a.is_pinned && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#d97706', background: '#fffbeb', padding: '4px 10px', borderRadius: 99 }}><Pin size={12} /> Pinned</span>}
                        </div>
                        <div style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                          <Clock size={14} /> {new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                      <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', margin: '0 0 8px' }}>{a.title}</h3>
                      <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, margin: '0 0 16px', whiteSpace: 'pre-wrap' }}>{a.body}</p>
                      
                      {a.meeting_date && (
                        <div style={{ background: '#eff6ff', borderRadius: 16, padding: '16px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 12, background: '#fff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Calendar size={20} /></div>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase' }}>Meeting Schedule</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#1e3a8a' }}>{new Date(a.meeting_date).toLocaleString('en-GB', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</div>
                          </div>
                          {a.meeting_link && (
                            <a href={a.meeting_link} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 'auto', padding: '8px 16px', borderRadius: 10, background: '#2563eb', color: '#fff', textDecoration: 'none', fontSize: 12, fontWeight: 700 }}>Join Meeting</a>
                          )}
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#6d28d9', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800 }}>{a.from_user?.full_name?.charAt(0)}</div>
                          <span style={{ fontSize: 12, color: '#64748b' }}>By {a.from_user?.full_name || 'School Administration'}</span>
                        </div>
                        <button style={{ background: 'none', border: 'none', color: '#6d28d9', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                          Mark as Read <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

      </div>
    </>
  )
}
