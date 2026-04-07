import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import ReactMarkdown from 'react-markdown'

type ContentType = 'video' | 'link' | 'passage' | 'google_doc'

interface Resource {
  id: string
  title: string
  description: string
  subject_id: string | null
  content_type: ContentType
  content: string
  topic: string
  cover_image_url: string
  is_published: boolean
  created_at: string
  subject?: { name: string }
}

function extractYouTubeId(url: string) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/)
  return match ? match[1] : null
}

function TypeBadge({ type }: { type: ContentType }) {
  const map: Record<ContentType, { label: string; bg: string; color: string; icon: string }> = {
    video: { label: 'Video', bg: '#fef2f2', color: '#dc2626', icon: '▶' },
    link: { label: 'Link', bg: '#eff6ff', color: '#2563eb', icon: '🔗' },
    passage: { label: 'Reading', bg: '#f0fdf4', color: '#16a34a', icon: '📖' },
    google_doc: { label: 'Document', bg: '#fff7ed', color: '#ea580c', icon: '📄' },
  }
  const m = map[type]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 99,
      background: m.bg, color: m.color, textTransform: 'uppercase', letterSpacing: '0.06em'
    }}>
      {m.icon} {m.label}
    </span>
  )
}

function ResourceReader({ resource, onClose }: { resource: Resource; onClose: () => void }) {
  const ytId = resource.content_type === 'video' ? extractYouTubeId(resource.content) : null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '24px 16px', overflowY: 'auto',
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        background: '#fff', borderRadius: 24, width: '100%', maxWidth: 820,
        boxShadow: '0 40px 80px rgba(0,0,0,0.3)', overflow: 'hidden',
        animation: '_libIn 0.3s cubic-bezier(0.16,1,0.3,1)',
        marginBottom: 40,
      }}>
        {/* Hero */}
        <div style={{ position: 'relative', minHeight: resource.cover_image_url ? 240 : 120, background: 'linear-gradient(135deg,#1e0646,#4c1d95)' }}>
          {resource.cover_image_url && (
            <img src={resource.cover_image_url} alt=""
              style={{ width: '100%', height: 240, objectFit: 'cover', display: 'block', opacity: 0.6 }} />
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(17,7,46,0.9) 0%, transparent 60%)' }} />
          <button onClick={onClose} style={{
            position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: 18, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
          }}>×</button>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
              <TypeBadge type={resource.content_type} />
              {resource.subject?.name && (
                <span style={{ fontSize: 10, fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {resource.subject.name}
                </span>
              )}
              {resource.topic && (
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>• {resource.topic}</span>
              )}
            </div>
            <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1.3 }}>
              {resource.title}
            </h1>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '28px 32px' }}>
          {resource.description && (
            <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7, marginBottom: 24, borderBottom: '1px solid #f5f3ff', paddingBottom: 20 }}>
              {resource.description}
            </p>
          )}

          {/* Video */}
          {resource.content_type === 'video' && (
            <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
              {ytId ? (
                <iframe
                  width="100%" height="400"
                  src={`https://www.youtube.com/embed/${ytId}?autoplay=0&rel=0`}
                  frameBorder="0" allowFullScreen
                  style={{ display: 'block' }}
                  title={resource.title}
                />
              ) : (
                <a href={resource.content} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px', background: '#fff7ed', borderRadius: 16, textDecoration: 'none', color: '#ea580c', fontWeight: 700, fontSize: 14, border: '1.5px solid #fed7aa' }}>
                  ▶ Open Video →
                </a>
              )}
            </div>
          )}

          {/* Google Doc */}
          {resource.content_type === 'google_doc' && (
            <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
              <iframe
                src={resource.content.replace('/edit', '/preview')}
                width="100%" height="540"
                frameBorder="0" allowFullScreen
                style={{ display: 'block' }}
                title={resource.title}
              />
            </div>
          )}

          {/* External Link */}
          {resource.content_type === 'link' && (
            <a href={resource.content} target="_blank" rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '20px 24px',
                background: 'linear-gradient(135deg,#eff6ff,#dbeafe)', borderRadius: 16,
                textDecoration: 'none', border: '1.5px solid #bfdbfe',
                transition: 'transform 0.15s',
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ width: 48, height: 48, borderRadius: 14, background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🔗</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1e40af', marginBottom: 3 }}>Open External Resource</div>
                <div style={{ fontSize: 12, color: '#3b82f6', wordBreak: 'break-all' }}>{resource.content}</div>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: 20, color: '#2563eb', flexShrink: 0 }}>→</div>
            </a>
          )}

          {/* Reading Passage */}
          {resource.content_type === 'passage' && (
            <div style={{
              background: '#fafaf9', borderRadius: 16, padding: '32px',
              border: '1.5px solid #f0eefe', lineHeight: 1.9,
              fontFamily: 'Georgia, "Times New Roman", serif',
            }}>
              <div className="lib-markdown" style={{ fontSize: 16, color: '#1f2937' }}>
                <ReactMarkdown>{resource.content || '*No content available.*'}</ReactMarkdown>
              </div>
            </div>
          )}

          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{
              padding: '12px 28px', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
              color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(109,40,217,0.3)',
            }}>← Back to Library</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function StudentLibraryPage() {
  const navigate = useNavigate()
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterSubject, setFilterSubject] = useState<string>('all')
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setTimeout(() => setMounted(true), 60)
    loadResources()
  }, [])

  async function loadResources() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('global_resources')
        .select('*, subject:subjects(name)')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
      if (error && error.code !== '42P01') throw error
      setResources(data ?? [])
    } catch (err: any) {
      console.error('Library load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const subjects = Array.from(new Set(resources.map(r => r.subject?.name).filter(Boolean))) as string[]

  const filtered = resources.filter(r => {
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.topic?.toLowerCase().includes(search.toLowerCase()) || r.subject?.name?.toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === 'all' || r.content_type === filterType
    const matchSubject = filterSubject === 'all' || r.subject?.name === filterSubject
    return matchSearch && matchType && matchSubject
  })

  const typeIcons: Record<string, string> = { video: '▶', link: '🔗', passage: '📖', google_doc: '📄' }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _libFu{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes _libIn{from{opacity:0;transform:scale(0.96)translateY(12px)}to{opacity:1;transform:scale(1)translateY(0)}}
        .lib-card{transition:all 0.2s cubic-bezier(0.4,0,0.2,1);cursor:pointer;}
        .lib-card:hover{transform:translateY(-5px)!important;box-shadow:0 20px 40px rgba(109,40,217,0.13)!important;}
        .lib-filter-btn{transition:all 0.15s;border:1.5px solid #e5e7eb;border-radius:99px;padding:6px 16px;font-size:12px;font-weight:600;cursor:pointer;background:#fff;color:#374151;font-family:"DM Sans",sans-serif;}
        .lib-filter-btn:hover{border-color:#7c3aed;color:#6d28d9;background:#faf5ff;}
        .lib-filter-btn.active{background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;border-color:#7c3aed;box-shadow:0 4px 12px rgba(109,40,217,0.25);}
        .lib-markdown h1,.lib-markdown h2,.lib-markdown h3{font-family:"Playfair Display",serif;color:#111827;margin:1.5em 0 0.5em;}
        .lib-markdown h1{font-size:1.6em;} .lib-markdown h2{font-size:1.35em;} .lib-markdown h3{font-size:1.1em;}
        .lib-markdown p{margin:0 0 1em;} .lib-markdown ul,.lib-markdown ol{padding-left:1.5em;margin-bottom:1em;}
        .lib-markdown li{margin-bottom:0.3em;}
        .lib-markdown blockquote{border-left:4px solid #7c3aed;margin:0 0 1em;padding:8px 20px;background:#faf5ff;border-radius:0 12px 12px 0;font-style:italic;}
        .lib-markdown strong{color:#111827;font-weight:700;}
        .lib-markdown hr{border:none;border-top:2px solid #f0eefe;margin:1.5em 0;}
        .lib-markdown code{background:#f3f4f6;border-radius:6px;padding:2px 6px;font-size:0.9em;}
        @media(max-width:768px){.lib-grid{grid-template-columns:1fr 1fr!important;}.lib-controls{flex-direction:column!important;}}
        @media(max-width:480px){.lib-grid{grid-template-columns:1fr!important;}}
      `}</style>

      {selectedResource && (
        <ResourceReader resource={selectedResource} onClose={() => setSelectedResource(null)} />
      )}

      <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif', opacity: mounted ? 1 : 0, transition: 'opacity .4s', paddingBottom: 80 }}>

        {/* ── Hero Header ── */}
        <div style={{
          background: 'linear-gradient(135deg, #1e0646 0%, #3b0764 40%, #5b21b6 100%)',
          borderRadius: 20, padding: '36px 32px', marginBottom: 28, position: 'relative', overflow: 'hidden',
          animation: '_libFu 0.5s ease both',
        }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
          <div style={{ position: 'absolute', bottom: -20, left: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(251,191,36,0.07)' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', color: '#a78bfa', textTransform: 'uppercase', marginBottom: 10 }}>
              📚 Global Learning Library
            </div>
            <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 30, fontWeight: 700, color: '#fff', margin: '0 0 10px' }}>
              Your Study Hub
            </h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', margin: 0, maxWidth: 480, lineHeight: 1.6 }}>
              Access videos, reading passages, and documents published by your institution. Tap any card to read or watch.
            </p>
            <div style={{ display: 'flex', gap: 20, marginTop: 20, flexWrap: 'wrap' }}>
              {[
                { icon: '📖', label: `${resources.filter(r=>r.content_type==='passage').length} Passages` },
                { icon: '▶', label: `${resources.filter(r=>r.content_type==='video').length} Videos` },
                { icon: '📄', label: `${resources.filter(r=>r.content_type==='google_doc').length} Documents` },
                { icon: '🔗', label: `${resources.filter(r=>r.content_type==='link').length} Links` },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14 }}>{s.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Controls ── */}
        <div className="lib-controls" style={{ display: 'flex', gap: 12, marginBottom: 22, flexWrap: 'wrap', animation: '_libFu .5s ease .1s both' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: '#9ca3af' }}>🔍</span>
            <input
              type="text"
              placeholder="Search materials, topics, subjects…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px 10px 38px', borderRadius: 12,
                border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none',
                fontFamily: '"DM Sans",sans-serif', background: '#fff', color: '#111827',
                boxSizing: 'border-box', transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = '#7c3aed'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* Type filter */}
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            style={{ padding: '10px 14px', borderRadius: 12, border: '1.5px solid #e5e7eb', fontSize: 13, fontFamily: '"DM Sans",sans-serif', background: '#fff', color: '#374151', cursor: 'pointer', outline: 'none' }}
          >
            <option value="all">All Types</option>
            <option value="passage">📖 Reading</option>
            <option value="video">▶ Video</option>
            <option value="google_doc">📄 Document</option>
            <option value="link">🔗 Link</option>
          </select>

          {/* Subject filter */}
          {subjects.length > 0 && (
            <select
              value={filterSubject}
              onChange={e => setFilterSubject(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: 12, border: '1.5px solid #e5e7eb', fontSize: 13, fontFamily: '"DM Sans",sans-serif', background: '#fff', color: '#374151', cursor: 'pointer', outline: 'none' }}
            >
              <option value="all">All Subjects</option>
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
        </div>

        {/* ── Results count ── */}
        {!loading && (
          <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600, marginBottom: 16 }}>
            {filtered.length} material{filtered.length !== 1 ? 's' : ''} found
            {search && <> for "<strong style={{ color: '#6d28d9' }}>{search}</strong>"</>}
          </div>
        )}

        {/* ── Grid ── */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #ede9fe', borderTopColor: '#7c3aed', animation: '_libFu 0s, _spin 0.8s linear infinite' }} />
            <p style={{ fontSize: 13, color: '#9ca3af', animation: '_libFu 0.5s ease .2s both' }}>Loading your library…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: '#fff', borderRadius: 20, border: '1.5px solid #f0eefe', animation: '_libFu .5s ease both' }}>
            <div style={{ fontSize: 56, marginBottom: 14 }}>📭</div>
            <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
              {search || filterType !== 'all' || filterSubject !== 'all' ? 'No matching materials' : 'Library is empty'}
            </h3>
            <p style={{ fontSize: 13, color: '#9ca3af', maxWidth: 360, margin: '0 auto' }}>
              {search || filterType !== 'all' || filterSubject !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'Your teachers haven\'t published any learning materials yet. Check back soon!'}
            </p>
            {(search || filterType !== 'all' || filterSubject !== 'all') && (
              <button onClick={() => { setSearch(''); setFilterType('all'); setFilterSubject('all') }}
                style={{ marginTop: 18, padding: '10px 24px', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="lib-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
            {filtered.map((res, i) => (
              <div
                key={res.id}
                className="lib-card"
                onClick={() => setSelectedResource(res)}
                style={{
                  background: '#fff', borderRadius: 18, border: '1.5px solid #f0eefe',
                  overflow: 'hidden', boxShadow: '0 2px 8px rgba(109,40,217,0.06)',
                  display: 'flex', flexDirection: 'column',
                  animation: `_libFu 0.4s ease ${i * 0.05}s both`,
                }}
              >
                {/* Cover */}
                <div style={{ height: 150, background: 'linear-gradient(135deg,#1e0646,#4c1d95)', position: 'relative', overflow: 'hidden' }}>
                  {res.cover_image_url ? (
                    <img src={res.cover_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44 }}>
                      {typeIcons[res.content_type] ?? '📚'}
                    </div>
                  )}
                  {/* Play button overlay for videos */}
                  {res.content_type === 'video' && (
                    <div style={{
                      position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(0,0,0,0.3)',
                    }}>
                      <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, paddingLeft: 3 }}>▶</div>
                    </div>
                  )}
                  <div style={{ position: 'absolute', top: 12, left: 12 }}>
                    <TypeBadge type={res.content_type} />
                  </div>
                </div>

                {/* Info */}
                <div style={{ padding: '18px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                    {res.subject?.name && (
                      <span style={{ fontSize: 10, fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {res.subject.name}
                      </span>
                    )}
                    {res.topic && (
                      <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>• {res.topic}</span>
                    )}
                  </div>
                  <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 8px', lineHeight: 1.3 }}>
                    {res.title}
                  </h3>
                  {res.description && (
                    <p style={{
                      fontSize: 12, color: '#6b7280', flex: 1, lineHeight: 1.6, margin: '0 0 16px',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    } as any}>
                      {res.description}
                    </p>
                  )}
                  <div style={{ borderTop: '1px solid #f5f3ff', paddingTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>
                      {new Date(res.created_at).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#7c3aed' }}>
                      {res.content_type === 'passage' ? 'Read →' : res.content_type === 'video' ? 'Watch →' : 'Open →'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`@keyframes _spin{to{transform:rotate(360deg)}}`}</style>
    </>
  )
}
