// src/pages/public/SchoolProfilePage.tsx
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { CURRICULUMS, SHS_PROGRAMMES } from '../../constants/curriculumData'
import {
  MapPin, Phone, Mail, Globe, Heart, Users, Eye,
  Play, X, ChevronLeft, ChevronRight, Building2, GraduationCap, Search, Info, ImageIcon, Video, BookOpen, Zap
} from 'lucide-react'

export default function SchoolProfilePage() {
  const { slug } = useParams<{ slug: string }>()
  const [school, setSchool] = useState<any>(null)
  const [settings, setSettings] = useState<any>(null)
  const [media, setMedia] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [followed, setFollowed] = useState(false)
  const [lightbox, setLightbox] = useState<{ items: any[]; idx: number } | null>(null)
  const [previewVideo, setPreviewVideo] = useState<any | null>(null)

  const [stats, setStats] = useState({ views: 0, likes: 0, followers: 0 })
  const [bgIdx, setBgIdx] = useState(0)

  const cleanSlug = slug?.replace(/^@/, '')

  useEffect(() => {
    const photoCount = media.filter(m => m.media_type === 'photo').length
    if (photoCount === 0) return
    const timer = setInterval(() => setBgIdx(i => (i + 1) % photoCount), 6000)
    return () => clearInterval(timer)
  }, [media])

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      const { data: s } = await supabase.from('schools').select('*').eq('slug', cleanSlug).single()
      if (!s) { setLoading(false); setSchool(null); return }
      setSchool(s)
      setStats({ views: s.profile_views || 0, likes: s.profile_likes || 0, followers: s.profile_followers || 0 })

      // Increment views
      await supabase.from('schools').update({ profile_views: (s.profile_views || 0) + 1 }).eq('id', s.id)

      const { data: st } = await supabase.from('school_settings').select('*').eq('school_id', s.id).single()
      setSettings(st || {})

      const { data: m } = await supabase.from('school_profile_media').select('*').eq('school_id', s.id).order('sort_order')
      setMedia(m || [])

      // Check if current user liked / followed
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: likeRow } = await supabase.from('school_likes').select('id').eq('school_id', s.id).eq('user_id', user.id).single()
        setLiked(!!likeRow)
        const { data: followRow } = await supabase.from('school_follows').select('id').eq('school_id', s.id).eq('follower_id', user.id).single()
        setFollowed(!!followRow)
      }
      setLoading(false)
    }
    fetch()
  }, [cleanSlug])

  const toggleLike = async () => {
    if (!school) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    if (liked) {
      await supabase.from('school_likes').delete().eq('school_id', school.id).eq('user_id', user.id)
      await supabase.from('schools').update({ profile_likes: Math.max(0, stats.likes - 1) }).eq('id', school.id)
      setStats(s => ({ ...s, likes: Math.max(0, s.likes - 1) }))
    } else {
      await supabase.from('school_likes').insert({ school_id: school.id, user_id: user.id })
      await supabase.from('schools').update({ profile_likes: stats.likes + 1 }).eq('id', school.id)
      setStats(s => ({ ...s, likes: s.likes + 1 }))
    }
    setLiked(l => !l)
  }

  const toggleFollow = async () => {
    if (!school) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    if (followed) {
      await supabase.from('school_follows').delete().eq('school_id', school.id).eq('follower_id', user.id)
      await supabase.from('schools').update({ profile_followers: Math.max(0, stats.followers - 1) }).eq('id', school.id)
      setStats(s => ({ ...s, followers: Math.max(0, s.followers - 1) }))
    } else {
      await supabase.from('school_follows').insert({ school_id: school.id, follower_id: user.id })
      await supabase.from('schools').update({ profile_followers: stats.followers + 1 }).eq('id', school.id)
      setStats(s => ({ ...s, followers: s.followers + 1 }))
    }
    setFollowed(f => !f)
  }

  const photos = media.filter(m => m.media_type === 'photo')
  const videos = media.filter(m => m.media_type === 'video')

  const curriculums = settings?.curriculums?.map((id: string) => CURRICULUMS.find(c => c.id === id))?.filter(Boolean) || []
  const programmes = settings?.shs_programmes?.map((id: string) => SHS_PROGRAMMES.find(p => p.id === id))?.filter(Boolean) || []

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc' }}>
      <div style={{ width: 44, height: 44, border: '4px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (!school) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc', fontFamily: '"DM Sans", sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
        <Search size={64} color="#cbd5e1" />
      </div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '16px 0 8px' }}>School Not Found</h1>
      <p style={{ color: '#64748b', margin: '0 0 24px' }}>No school found at /@{cleanSlug}</p>
      <Link to="/schools" style={{ padding: '12px 28px', background: '#6366f1', color: 'white', textDecoration: 'none', borderRadius: 12, fontWeight: 700 }}>Browse Directory</Link>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: '"DM Sans", sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>

      {/* ── HERO BANNER ── */}
      <div style={{ height: 260, background: '#1e1b4b', position: 'relative', overflow: 'hidden' }}>
        {/* Slideshow */}
        {photos.length > 0 && (
          <AnimatePresence mode="popLayout">
            <motion.img
              key={bgIdx}
              src={photos[bgIdx]?.url}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 0.35, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
            />
          </AnimatePresence>
        )}

        {/* Gradient Overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(30,27,75,0.85) 0%, rgba(67,56,202,0.7) 50%, rgba(99,102,241,0.8) 100%)', zIndex: 0 }} />

        <div style={{ position: 'absolute', top: -80, right: -80, width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: -60, left: -40, width: 300, height: 300, borderRadius: '50%', background: 'rgba(139,92,246,0.2)', zIndex: 0 }} />
        {/* Navigation back */}
        <div style={{ padding: '20px 24px', position: 'relative', zIndex: 1 }}>
          <Link to="/schools" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
            <ChevronLeft size={16} /> Back to Directory
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: 1024, margin: '0 auto', padding: '0 20px' }}>

        {/* ── PROFILE HEADER CARD ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ marginTop: -80, background: 'white', borderRadius: 24, padding: 28, boxShadow: '0 8px 30px rgba(0,0,0,0.1)', border: '1px solid #e8edf4', marginBottom: 24, position: 'relative', zIndex: 1 }}>

          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Logo */}
            <div style={{ width: 88, height: 88, borderRadius: 20, background: '#f8fafc', border: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
              {school.logo_url
                ? <img src={school.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 6 }} />
                : <GraduationCap size={40} color="#94a3b8" />}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 220 }}>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: '0 0 6px', lineHeight: 1.2 }}>{school.name}</h1>
              {school.motto && <p style={{ fontSize: 15, color: '#64748b', fontStyle: 'italic', margin: '0 0 10px' }}>"{school.motto}"</p>}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {settings?.school_type && <span style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', background: '#e0e7ff', padding: '3px 10px', borderRadius: 6 }}>{settings.school_type === 'shs' ? 'Senior High' : settings.school_type === 'basic' ? 'Basic School' : 'School'}</span>}
                {school.is_branch && <span style={{ fontSize: 12, fontWeight: 700, color: '#059669', background: '#d1fae5', padding: '3px 10px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}><Building2 size={10} /> Branch Campus</span>}
              </div>
            </div>

            {/* Stats + Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{stats.views.toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}><Eye size={10} /> Views</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{stats.likes.toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}><Heart size={10} /> Likes</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{stats.followers.toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}><Users size={10} /> Followers</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={toggleLike}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, border: `1.5px solid ${liked ? '#fecaca' : '#e2e8f0'}`, background: liked ? '#fef2f2' : 'white', color: liked ? '#ef4444' : '#475569', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit' }}>
                  <Heart size={14} fill={liked ? '#ef4444' : 'none'} /> {liked ? 'Liked' : 'Like'}
                </button>
                <button onClick={toggleFollow}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, border: 'none', background: followed ? '#f1f5f9' : '#6366f1', color: followed ? '#475569' : 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit' }}>
                  <Users size={14} /> {followed ? 'Following' : 'Follow'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── MAIN GRID ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, paddingBottom: 60 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Description */}
            {school.description && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                style={{ padding: 28, borderRadius: 20, background: 'white', border: '1px solid #e8edf4', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}><Info size={18} color="#6366f1" /> About</h2>
                <p style={{ color: '#475569', lineHeight: 1.8, fontSize: 15, margin: 0 }}>{school.description}</p>
              </motion.div>
            )}

            {/* Photo Gallery */}
            {photos.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                style={{ padding: 28, borderRadius: 20, background: 'white', border: '1px solid #e8edf4', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 6 }}><ImageIcon size={18} color="#6366f1" /> Gallery</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
                  {photos.map((p, i) => (
                    <div key={p.id} onClick={() => setLightbox({ items: photos, idx: i })}
                      style={{ borderRadius: 12, overflow: 'hidden', paddingBottom: '75%', position: 'relative', cursor: 'pointer', background: '#f1f5f9' }}>
                      <img src={p.url} alt={p.caption || ''} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Videos */}
            {videos.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                style={{ padding: 28, borderRadius: 20, background: 'white', border: '1px solid #e8edf4', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 6 }}><Video size={18} color="#6366f1" /> Videos</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                  {videos.map(v => (
                    <div key={v.id} onClick={() => setPreviewVideo(v)} style={{ borderRadius: 14, overflow: 'hidden', background: '#1e1b4b', cursor: 'pointer', position: 'relative' }}>
                      <div style={{ paddingBottom: '56.25%', position: 'relative' }}>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1e1b4b, #4338ca)', gap: 8 }}>
                          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.3)' }}>
                            <Play size={22} color="white" fill="white" style={{ marginLeft: 4 }} />
                          </div>
                          {v.caption && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{v.caption}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Curriculums */}
            {curriculums.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                style={{ padding: 28, borderRadius: 20, background: 'white', border: '1px solid #e8edf4', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 6 }}><BookOpen size={18} color="#6366f1" /> Curriculums</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {curriculums.map((c: any) => (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 14, fontWeight: 600, color: '#334155' }}>
                      <span style={{ fontSize: 20 }}>{c.icon}</span> {c.label}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* SHS Programmes */}
            {programmes.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                style={{ padding: 28, borderRadius: 20, background: 'white', border: '1px solid #e8edf4', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 6 }}><GraduationCap size={18} color="#6366f1" /> Academic Programmes</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {programmes.map((p: any) => (
                    <span key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 20, background: p.bg, color: p.color, border: `1px solid ${p.color}30`, fontWeight: 700, fontSize: 14 }}>
                      <span>{p.icon}</span> {p.label}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Map */}
            {school.location_lat && school.location_lng && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                style={{ padding: 28, borderRadius: 20, background: 'white', border: '1px solid #e8edf4', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MapPin size={16} /> Location
                </h2>
                {school.location_label && <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px' }}>{school.location_label}</p>}
                <div style={{ borderRadius: 16, overflow: 'hidden', height: 250 }}>
                  <iframe
                    title="Map"
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${school.location_lng - 0.01},${school.location_lat - 0.01},${school.location_lng + 0.01},${school.location_lat + 0.01}&layer=mapnik&marker=${school.location_lat},${school.location_lng}`}
                  />
                </div>
              </motion.div>
            )}
          </div>

          {/* ── SIDEBAR ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Contact */}
            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              style={{ padding: 22, borderRadius: 20, background: 'white', border: '1px solid #e8edf4', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: '0 0 16px' }}>Contact Info</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {school.address && <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: '#475569', fontWeight: 500 }}><MapPin size={15} style={{ flexShrink: 0, marginTop: 1 }} />{school.address}</div>}
                {school.phone && <a href={`tel:${school.phone}`} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13, color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}><Phone size={14} />{school.phone}</a>}
                {school.email && <a href={`mailto:${school.email}`} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13, color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}><Mail size={14} />{school.email}</a>}
              </div>
            </motion.div>

            {/* Tags */}
            {school.tags?.length > 0 && (
              <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
                style={{ padding: 22, borderRadius: 20, background: 'white', border: '1px solid #e8edf4', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: '0 0 12px' }}>Tags</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {school.tags.map((tag: string) => (
                    <span key={tag} style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', background: '#ede9fe', padding: '4px 10px', borderRadius: 8 }}>#{tag}</span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Powered by Nexora */}
            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
              style={{ padding: 22, borderRadius: 20, background: 'linear-gradient(135deg, #1e1b4b, #4338ca)', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}><Zap size={28} color="#f59e0b" fill="#f59e0b" /></div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'white', marginBottom: 6 }}>Powered by Nexora</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 16, lineHeight: 1.5 }}>This school manages academics, fees and more with Nexora.</div>
              <Link to="/" style={{ display: 'inline-block', padding: '9px 18px', borderRadius: 10, background: 'rgba(255,255,255,0.15)', color: 'white', textDecoration: 'none', fontSize: 13, fontWeight: 700, border: '1px solid rgba(255,255,255,0.2)' }}>
                Learn more →
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── LIGHTBOX ── */}
      <AnimatePresence>
        {lightbox && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setLightbox(null)}>
            <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: 20, right: 20, border: 'none', background: 'rgba(255,255,255,0.15)', color: 'white', width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}><X size={18} /></button>
            <button onClick={e => { e.stopPropagation(); setLightbox(l => l && l.idx > 0 ? { ...l, idx: l.idx - 1 } : l) }} style={{ position: 'absolute', left: 20, border: 'none', background: 'rgba(255,255,255,0.15)', color: 'white', width: 44, height: 44, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronLeft size={20} /></button>
            <motion.img
              key={lightbox.idx}
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              src={lightbox.items[lightbox.idx].url}
              alt=""
              style={{ maxWidth: '85vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: 12 }}
              onClick={e => e.stopPropagation()}
            />
            <button onClick={e => { e.stopPropagation(); setLightbox(l => l && l.idx < l.items.length - 1 ? { ...l, idx: l.idx + 1 } : l) }} style={{ position: 'absolute', right: 20, border: 'none', background: 'rgba(255,255,255,0.15)', color: 'white', width: 44, height: 44, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronRight size={20} /></button>
            <div style={{ position: 'absolute', bottom: 20, color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{lightbox.idx + 1} / {lightbox.items.length}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── VIDEO MODAL ── */}
      <AnimatePresence>
        {previewVideo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setPreviewVideo(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              style={{ width: '100%', maxWidth: 840, borderRadius: 16, overflow: 'hidden', background: '#000', position: 'relative' }}>
              <button onClick={() => setPreviewVideo(null)} style={{ position: 'absolute', top: 12, right: 12, zIndex: 1, border: 'none', background: 'rgba(255,255,255,0.15)', color: 'white', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
              <div style={{ paddingBottom: '56.25%', position: 'relative' }}>
                <iframe src={previewVideo.url} title="Video" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }} allowFullScreen />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
