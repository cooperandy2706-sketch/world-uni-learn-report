import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import Modal from '../../components/ui/Modal'
import ReactMarkdown from 'react-markdown'

export default function TeacherSubjectDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [subject, setSubject] = useState<any>(null)
  const [resources, setResources] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Reading Modal for Text Passages
  const [activePassage, setActivePassage] = useState<any>(null)

  useEffect(() => {
    if (id && user) loadDetails()
  }, [id, user?.id])

  async function loadDetails() {
    setIsLoading(true)
    try {
      // Load subject name
      const { data: sub } = await supabase
        .from('subjects')
        .select('*')
        .eq('id', id)
        .is('school_id', null)
        .single()
      setSubject(sub)

      // Load resources for this subject
      const { data, error } = await supabase
        .from('global_resources')
        .select('*')
        .is('school_id', null)
        .eq('subject_id', id)
        .eq('is_published', true)
        .order('created_at', { ascending: false })

      if (error && error.code !== '42P01') throw error
      setResources(data ?? [])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  // --- Helpers for formatting embedded logic ---
  const extractEmbedUrl = (url: string) => {
    if (url.includes('youtube.com/watch?v=')) return url.replace('watch?v=', 'embed/')
    if (url.includes('youtu.be/')) return url.replace('youtu.be/', 'youtube.com/embed/')
    if (url.includes('docs.google.com')) return url.replace(/\/edit.*$/, '/preview')
    return url
  }

  const groupedResources = useMemo(() => {
    const groups: Record<string, any[]> = {}
    resources.forEach(res => {
      const t = res.topic || 'General Topics'
      if (!groups[t]) groups[t] = []
      groups[t].push(res)
    })
    return groups
  }, [resources])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _spin { to{transform:rotate(360deg)} }
        @keyframes _fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .res-card { background: #fff; border-radius: 20px; border: 1.5px solid #f0eefe; transition: all 0.3s; overflow: hidden; display: flex; flexDirection: column; }
        .res-card:hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(109,40,217,0.12); border-color: #ddd6fe; }
        
        /* Markdown Styles */
        .markdown-content h1, .markdown-content h2 { color: #1e293b; margin-top: 1.5em; margin-bottom: 0.5em; font-family: '"Playfair Display", serif'; }
        .markdown-content p { margin-bottom: 1.2em; }
        .markdown-content blockquote { border-left: 4px solid #7c3aed; padding-left: 20px; margin: 20px 0; font-style: italic; color: #4b5563; background: #f5f3ff; padding: 16px 20px; border-radius: 0 12px 12px 0; }
        .markdown-content ul, .markdown-content ol { margin-bottom: 1.2em; padding-left: 20px; }
        .markdown-content li { margin-bottom: 0.5em; }
        .markdown-content hr { border: none; border-top: 1.5px solid #e2e8f0; margin: 32px 0; }
      `}</style>

      <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif', maxWidth: 1200, margin: '0 auto' }}>
        
        <button onClick={() => navigate('/teacher/subjects')} style={{ background: 'transparent', border: 'none', color: '#6b7280', fontWeight: 700, cursor: 'pointer', marginBottom: 20, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 99, transition: 'background 0.2s' }} onMouseOver={e=>e.currentTarget.style.background='#f3f4f6'} onMouseOut={e=>e.currentTarget.style.background='transparent'}>
          ← Back to Library
        </button>

        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Curriculum Resources</div>
          <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 36, fontWeight: 700, color: '#111827', margin: 0 }}>
            {subject ? subject.name : 'Loading Subject...'}
          </h1>
          {subject?.code && <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: '#6d28d9', background: '#f5f3ff', padding: '4px 10px', borderRadius: 6, display: 'inline-block', marginTop: 12 }}>{subject.code}</span>}
        </div>

        {/* ── Content Area ── */}
        {isLoading ? (
          <div style={{ padding: '80px', textAlign: 'center' }}>
            <div style={{ width: 40, height: 40, margin: '0 auto 16px', borderRadius: '50%', border: '4px solid #ede9fe', borderTopColor: '#7c3aed', animation: '_spin 1s linear infinite' }} />
            <div style={{ color: '#9ca3af', fontSize: 14, fontWeight: 600 }}>Syncing Library...</div>
          </div>
        ) : resources.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 16, padding: '80px 20px', textAlign: 'center', border: '1.5px solid #f0eefe' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📂</div>
            <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 6 }}>No Resources Available</h3>
            <p style={{ fontSize: 13, color: '#9ca3af' }}>There are currently no published study materials for this subject.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
            {Object.entries(groupedResources).map(([topic, items]) => (
              <div key={topic}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                    <h2 style={{ fontSize: 14, fontWeight: 800, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>{topic}</h2>
                    <div style={{ height: 1.5, flex: 1, background: 'linear-gradient(90deg, #ddd6fe, transparent)' }} />
                 </div>

                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
                    {items.map((res, i) => (
                      <div key={res.id} className="res-card" style={{ animation: `_fadeUp 0.4s ease ${i * 0.05}s both` }}>
                        
                        {/* Visual Header based on Content Type or Cover Image */}
                        <div style={{ 
                          height: 180, width: '100%', position: 'relative', overflow: 'hidden',
                          background: res.cover_image_url ? '#000' : (
                                      res.content_type === 'video' ? '#0f172a' : 
                                      res.content_type === 'google_doc' ? '#ffffff' :
                                      res.content_type === 'passage' ? 'linear-gradient(135deg, #fef3c7, #fde68a)' : 
                                      'linear-gradient(135deg, #e0e7ff, #c7d2fe)' )
                        }}>
                           {res.cover_image_url ? (
                               <img src={res.cover_image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                           ) : res.content_type === 'video' ? (
                              res.content.includes('youtube') || res.content.includes('youtu.be') ? (
                                 <iframe 
                                   src={extractEmbedUrl(res.content)} 
                                   title={res.title} 
                                   allowFullScreen
                                   style={{ width: '100%', height: '100%', border: 'none' }}
                                 />
                              ) : (
                                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>▶️</div>
                              )
                           ) : res.content_type === 'google_doc' ? (
                               <iframe 
                                 src={extractEmbedUrl(res.content)} 
                                 title={res.title} 
                                 allowFullScreen
                                 style={{ width: '100%', height: '100%', border: 'none', background: '#f8fafc' }}
                               />
                           ) : res.content_type === 'passage' ? (
                              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 50 }}>📄</div>
                           ) : (
                              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 50 }}>🔗</div>
                           )}
                           
                           {/* Type Badge Floating */}
                           <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '4px 10px', borderRadius: 99, color: '#fff', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                             {res.content_type === 'video' ? '📺 Video' : res.content_type === 'google_doc' ? '📄 Doc' : res.content_type === 'passage' ? '📝 Reading' : '🔗 Link'}
                           </div>
                        </div>

                        <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <h3 style={{ fontSize: 19, fontWeight: 700, color: '#1e293b', margin: '0 0 8px 0', lineHeight: 1.3 }}>{res.title}</h3>
                          <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 24px 0', flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{res.description}</p>
                          
                          {/* Actions */}
                          {res.content_type === 'google_doc' && (
                            <a href={res.content} target="_blank" rel="noreferrer" style={{ display: 'block', textAlign: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', padding: '12px', borderRadius: 12, textDecoration: 'none', fontWeight: 700, fontSize: 13, transition: 'all 0.2s' }} onMouseOver={e=>e.currentTarget.style.background='#f1f5f9'} onMouseOut={e=>e.currentTarget.style.background='#f8fafc'}>
                              View Study Resource 📄
                            </a>
                          )}
                          {res.content_type === 'link' && (
                            <a href={res.content} target="_blank" rel="noreferrer" style={{ display: 'block', textAlign: 'center', background: '#eff6ff', color: '#2563eb', padding: '12px', borderRadius: 12, textDecoration: 'none', fontWeight: 700, fontSize: 13, transition: 'all 0.2s' }} onMouseOver={e=>e.currentTarget.style.background='#dbeafe'} onMouseOut={e=>e.currentTarget.style.background='#eff6ff'}>
                              Open Link ↗
                            </a>
                          )}
                          {(res.content_type === 'passage' || res.content_type === 'video') && (
                            <button onClick={() => setActivePassage(res)} style={{ width: '100%', background: '#1e293b', color: '#fff', padding: '12px', borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s', border: 'none' }} onMouseOver={e=>e.currentTarget.style.background='#334155'} onMouseOut={e=>e.currentTarget.style.background='#1e293b'}>
                              {res.content_type === 'video' ? 'Preview Video 📺' : 'Open Reader 📖'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
            ))}
          </div>
        )}

        {/* ── PASSAGE READING MODAL ── */}
        <Modal open={!!activePassage} onClose={() => setActivePassage(null)} title={activePassage?.title} size="lg">
          {activePassage && (
            <div style={{ background: '#f8fafc', padding: '24px 32px', borderRadius: 16, border: '1px solid #e2e8f0', minHeight: '300px', maxHeight: '65vh', overflowY: 'auto' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 12 }}>Curriculum Preview (Markdown)</div>
              
              <div className="markdown-content" style={{ fontFamily: 'Georgia, serif', fontSize: 17, lineHeight: 1.8, color: '#334155' }}>
                <ReactMarkdown>{activePassage.content}</ReactMarkdown>
              </div>
              
              <div style={{ marginTop: 40, borderTop: '1px solid #e2e8f0', paddingTop: 20, textAlign: 'center' }}>
                <button onClick={() => setActivePassage(null)} style={{ background: '#111827', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>Close Reader</button>
              </div>
            </div>
          )}
        </Modal>

      </div>
    </>
  )
}
