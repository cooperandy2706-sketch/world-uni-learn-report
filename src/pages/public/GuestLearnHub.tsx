import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

export default function GuestLearnHub() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'quizzes' | 'resources'>('quizzes')
  const [selectedResource, setSelectedResource] = useState<any | null>(null)

  // Fetch public global quizzes
  const { data: quizzes, isLoading: loadingQuizzes } = useQuery({
    queryKey: ['public-global-quizzes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('global_quizzes')
        .select(`
          id, title, description, duration_minutes,
          subjects ( name, code )
        `)
        .is('school_id', null)
        .eq('is_published', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    }
  })

  // Fetch public global resources
  const { data: resources, isLoading: loadingResources } = useQuery({
    queryKey: ['public-global-resources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('global_resources')
        .select(`
          id, title, description, content_type, content, cover_image_url, topic,
          subjects ( name, code )
        `)
        .is('school_id', null)
        .eq('is_published', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    }
  })

  const renderResourceContent = (resource: any) => {
    if (!resource || !resource.content) return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No content available.</div>
    
    if (resource.content_type === 'video') {
      // Assuming content is a URL
      const isYouTube = resource.content.includes('youtube.com') || resource.content.includes('youtu.be')
      if (isYouTube) {
        const videoId = resource.content.split('v=')[1]?.split('&')[0] || resource.content.split('youtu.be/')[1]?.split('?')[0]
        return (
          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 12 }}>
            <iframe 
              src={`https://www.youtube.com/embed/${videoId}`} 
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }} 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            />
          </div>
        )
      }
      return (
        <video controls style={{ width: '100%', borderRadius: 12, outline: 'none' }}>
          <source src={resource.content} />
          Your browser does not support the video tag.
        </video>
      )
    }

    if (resource.content_type === 'pdf') {
      return (
        <div style={{ height: '70vh', width: '100%', borderRadius: 12, overflow: 'hidden' }}>
          <iframe src={resource.content} style={{ width: '100%', height: '100%', border: 'none' }} title={resource.title} />
        </div>
      )
    }

    // Default to rendering as HTML/text
    return (
      <div 
        style={{ lineHeight: 1.8, color: '#334155', background: '#f8fafc', padding: '2rem', borderRadius: 12, border: '1px solid #e2e8f0' }}
        dangerouslySetInnerHTML={{ __html: resource.content }} 
      />
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)', fontFamily: '"DM Sans", system-ui, sans-serif' }}>
      {/* ── HEADER ── */}
      <header style={{ background: '#1e0646', color: 'white', padding: '1rem 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ←
            </button>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>ASOS Learning Hub</h1>
          </div>
          <Link to="/login" style={{ color: 'white', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', background: 'rgba(255,255,255,0.15)', padding: '0.5rem 1rem', borderRadius: 8 }}>
            Sign In
          </Link>
        </div>
      </header>

      {/* ── HERO ── */}
      <section style={{ background: 'linear-gradient(135deg, #1e0646 0%, #3b0764 100%)', padding: '4rem 1.5rem', color: 'white', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1rem', fontFamily: '"Playfair Display", serif' }}>
          Free Educational Resources
        </h2>
        <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.8)', maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
          Access high-quality quizzes and study materials curated by experts. Practice your skills and learn something new, completely free.
        </p>
      </section>

      {/* ── TABS ── */}
      <div style={{ maxWidth: 1200, margin: '-24px auto 2rem', padding: '0 1.5rem', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', background: 'white', padding: '0.5rem', borderRadius: 12, boxShadow: '0 4px 15px rgba(0,0,0,0.05)', maxWidth: 400, margin: '0 auto' }}>
          <button
            onClick={() => setActiveTab('quizzes')}
            style={{ flex: 1, padding: '0.75rem', border: 'none', background: activeTab === 'quizzes' ? '#f5f3ff' : 'transparent', color: activeTab === 'quizzes' ? '#7c3aed' : '#64748b', fontWeight: 700, borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s' }}
          >
            📝 Practice Quizzes
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            style={{ flex: 1, padding: '0.75rem', border: 'none', background: activeTab === 'resources' ? '#f5f3ff' : 'transparent', color: activeTab === 'resources' ? '#7c3aed' : '#64748b', fontWeight: 700, borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s' }}
          >
            📚 Study Materials
          </button>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem 6rem' }}>
        {activeTab === 'quizzes' && (
          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e0646', marginBottom: '1.5rem' }}>Available Quizzes</h3>
            {loadingQuizzes ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>Loading quizzes...</div>
            ) : quizzes?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', background: 'white', borderRadius: 12, border: '1px dashed #cbd5e1' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                <h4 style={{ fontSize: '1.2rem', color: '#1e0646', marginBottom: '0.5rem' }}>No quizzes available</h4>
                <p style={{ color: '#64748b' }}>Check back later for new practice materials.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {quizzes?.map((quiz) => (
                  <div key={quiz.id} style={{ background: 'white', borderRadius: 12, padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <span style={{ background: '#f5f3ff', color: '#7c3aed', padding: '0.25rem 0.75rem', borderRadius: 100, fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>
                        {(quiz.subjects as any)?.name || 'General'}
                      </span>
                      {quiz.duration_minutes > 0 && (
                        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                          ⏱️ {quiz.duration_minutes} min
                        </span>
                      )}
                    </div>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e0646', marginBottom: '0.5rem', lineHeight: 1.3 }}>{quiz.title}</h4>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.5rem', flex: 1 }}>{quiz.description}</p>
                    <button onClick={() => navigate(`/learn/quiz/${quiz.id}`)} style={{ width: '100%', background: '#1e0646', color: 'white', border: 'none', padding: '0.875rem', borderRadius: 8, fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s' }}>
                      Take Quiz
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'resources' && (
          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e0646', marginBottom: '1.5rem' }}>Study Materials</h3>
            {loadingResources ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>Loading materials...</div>
            ) : resources?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', background: 'white', borderRadius: 12, border: '1px dashed #cbd5e1' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                <h4 style={{ fontSize: '1.2rem', color: '#1e0646', marginBottom: '0.5rem' }}>No materials available</h4>
                <p style={{ color: '#64748b' }}>Check back later for new study guides.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {resources?.map((res) => (
                  <div key={res.id} style={{ background: 'white', borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
                    {res.cover_image_url ? (
                      <div style={{ height: 160, background: `url(${res.cover_image_url}) center/cover` }} />
                    ) : (
                      <div style={{ height: 160, background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
                        {res.content_type === 'video' ? '▶️' : res.content_type === 'pdf' ? '📄' : '📚'}
                      </div>
                    )}
                    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                        <span style={{ background: '#f5f3ff', color: '#7c3aed', padding: '0.25rem 0.75rem', borderRadius: 100, fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>
                          {(res.subjects as any)?.name || 'General'}
                        </span>
                        <span style={{ background: '#f8fafc', color: '#475569', padding: '0.25rem 0.75rem', borderRadius: 100, fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', border: '1px solid #e2e8f0' }}>
                          {res.content_type}
                        </span>
                      </div>
                      <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e0646', marginBottom: '0.5rem', lineHeight: 1.3 }}>{res.title}</h4>
                      <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.5rem', flex: 1 }}>{res.description}</p>
                      
                      <button onClick={() => setSelectedResource(res)} style={{ width: '100%', background: '#f8fafc', color: '#1e0646', border: '1px solid #e2e8f0', padding: '0.875rem', borderRadius: 8, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9' }} onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc' }}>
                        View Resource
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── RESOURCE MODAL ── */}
      {selectedResource && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'white', width: '100%', maxWidth: 900, maxHeight: '90vh', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e0646', margin: 0 }}>{selectedResource.title}</h3>
                <p style={{ fontSize: '0.9rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>{selectedResource.content_type.toUpperCase()} • {(selectedResource.subjects as any)?.name || 'General'}</p>
              </div>
              <button 
                onClick={() => setSelectedResource(null)}
                style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: '#e2e8f0', color: '#475569', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#cbd5e1'; e.currentTarget.style.color = '#1e293b' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#475569' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '2rem', overflowY: 'auto', flex: 1 }}>
              {selectedResource.description && (
                <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f5f3ff', borderRadius: 12, border: '1px solid #ede9fe' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#7c3aed', margin: '0 0 0.5rem 0' }}>Description</h4>
                  <p style={{ margin: 0, color: '#4c1d95', lineHeight: 1.6 }}>{selectedResource.description}</p>
                </div>
              )}
              
              {renderResourceContent(selectedResource)}
            </div>
            
          </div>
        </div>
      )}
    </div>
  )
}
