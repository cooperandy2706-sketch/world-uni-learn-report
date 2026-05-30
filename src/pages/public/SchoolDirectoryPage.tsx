// src/pages/public/SchoolDirectoryPage.tsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { Search, MapPin, Building2, GraduationCap, ExternalLink, Heart, Users, Eye, School } from 'lucide-react'

interface School {
  id: string
  name: string
  slug: string | null
  address: string | null
  logo_url: string | null
  motto: string | null
  description: string | null
  profile_views: number
  profile_likes: number
  profile_followers: number
  school_settings: { school_type: string | null; has_branches: boolean | null }[]
}

const TYPE_LABELS: Record<string, string> = {
  basic: 'Basic School',
  shs: 'Senior High',
  remedial: 'Remedial',
  mixed: 'Mixed Level',
}

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  basic:    { bg: '#dbeafe', text: '#1d4ed8' },
  shs:      { bg: '#fce7f3', text: '#9d174d' },
  remedial: { bg: '#d1fae5', text: '#065f46' },
  mixed:    { bg: '#ede9fe', text: '#5b21b6' },
}

const FILTERS = ['All', 'Basic School', 'Senior High', 'Remedial', 'Mixed Level']

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}
const cardVariants = {
  hidden: { opacity: 0, y: 32, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 22 } },
}

const DIR_PHOTOS = [
  'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2000',
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2000',
  'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2000'
]

export default function SchoolDirectoryPage() {
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [bgIdx, setBgIdx] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setBgIdx(i => (i + 1) % DIR_PHOTOS.length), 6000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data, error } = await supabase
        .from('schools')
        .select(`
          id, name, slug, address, logo_url, motto, description,
          profile_views, profile_likes, profile_followers
        `)
        .order('name')
      
      if (error) {
        console.error('Failed to load schools directory:', error)
      }

      setSchools((data ?? []) as any)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = schools.filter(s => {
    const matchesFilter = activeFilter === 'All' // type filter disabled until schema is updated
    const q = search.toLowerCase()
    const matchesSearch = !q || (s.name || '').toLowerCase().includes(q) || (s.address || '').toLowerCase().includes(q)
    return matchesFilter && matchesSearch
  })

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: '"DM Sans", sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .dir-card { cursor: pointer; }
        .dir-card:hover { box-shadow: 0 20px 40px rgba(0,0,0,0.12) !important; border-color: #c7d2fe !important; transform: translateY(-4px); }
        .filter-pill { transition: all 0.18s; border: none; cursor: pointer; font-family: inherit; font-weight: 700; font-size: 13px; border-radius: 99px; padding: 8px 18px; }
        .filter-pill:hover { background: #e0e7ff; color: #4338ca; }
        .search-wrap input:focus { outline: none; box-shadow: 0 0 0 3px rgba(99,102,241,0.25); }
      `}</style>

      {/* ── HERO ── */}
      <div style={{ background: '#1e1b4b', padding: '100px 20px 80px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Background Slideshow */}
        <AnimatePresence mode="popLayout">
          <motion.img
            key={bgIdx}
            src={DIR_PHOTOS[bgIdx]}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 0.35, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
          />
        </AnimatePresence>
        
        {/* Gradient Overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(30,27,75,0.85) 0%, rgba(49,46,129,0.75) 50%, rgba(30,10,78,0.9) 100%)', zIndex: 0 }} />

        {/* Blurred blobs */}
        <div style={{ position: 'absolute', top: -100, left: '10%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(139,92,246,0.3)', filter: 'blur(100px)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: -80, right: '15%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(99,102,241,0.25)', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ position: 'relative', zIndex: 1, maxWidth: 780, margin: '0 auto' }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 99, color: '#c4b5fd', fontSize: 13, fontWeight: 700, marginBottom: 24 }}>
            <School size={16} /> Nexora School Directory
          </div>

          <h1 style={{ fontSize: 52, fontWeight: 800, color: 'white', margin: '0 0 18px', letterSpacing: '-0.03em', lineHeight: 1.15 }}>
            Find Schools on{' '}
            <span style={{ background: 'linear-gradient(90deg, #a78bfa, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Nexora</span>
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.65)', margin: '0 0 44px', lineHeight: 1.7 }}>
            Browse and discover primary, secondary and remedial schools powered by our platform.
          </p>

          {/* Search */}
          <div className="search-wrap" style={{ display: 'flex', gap: 10, background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 18, padding: 10, maxWidth: 680, margin: '0 auto' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={18} color="rgba(255,255,255,0.5)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search by name or location…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '14px 14px 14px 44px', fontSize: 15, border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', borderRadius: 12, boxSizing: 'border-box', fontFamily: 'inherit', transition: 'box-shadow 0.2s' }}
              />
            </div>
            <select
              value={activeFilter}
              onChange={e => setActiveFilter(e.target.value)}
              style={{ padding: '0 20px', fontSize: 14, fontWeight: 700, border: 'none', background: 'rgba(255,255,255,0.15)', color: 'white', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {FILTERS.map(f => <option key={f} value={f} style={{ color: '#0f172a', background: 'white' }}>{f}</option>)}
            </select>
          </div>
        </motion.div>
      </div>

      {/* ── RESULTS ── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 20px 80px' }}>

        {/* Filter Chips + Count */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 36 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {FILTERS.map(f => (
              <button
                key={f}
                className="filter-pill"
                onClick={() => setActiveFilter(f)}
                style={{
                  background: activeFilter === f ? '#6366f1' : 'white',
                  color: activeFilter === f ? 'white' : '#475569',
                  boxShadow: activeFilter === f ? '0 4px 14px rgba(99,102,241,0.4)' : '0 1px 3px rgba(0,0,0,0.08)',
                }}
              >{f}</button>
            ))}
          </div>
          {!loading && (
            <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>
              {filtered.length} school{filtered.length !== 1 ? 's' : ''} found
            </span>
          )}
        </div>

        {/* Cards */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 120 }}>
            <div style={{ width: 44, height: 44, border: '4px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.9s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ color: '#94a3b8', fontWeight: 600 }}>Loading schools…</p>
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: 80, background: 'white', borderRadius: 24, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <Search size={52} color="#cbd5e1" />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>No schools found</h3>
            <p style={{ color: '#64748b' }}>Try adjusting your search or filter.</p>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}
          >
            <AnimatePresence>
              {filtered.map((school, i) => {
                const sType = school.school_settings?.[0]?.school_type || 'basic'
                const hasBranches = school.school_settings?.[0]?.has_branches || false
                const typeColor = TYPE_COLORS[sType] || TYPE_COLORS.basic
                const typeLabel = TYPE_LABELS[sType] || 'Basic School'
                const hasProfile = !!school.slug
                const accent = `hsl(${(i * 53 + 200) % 360}, 65%, 55%)`

                const card = (
                  <motion.div
                    key={school.id}
                    variants={cardVariants}
                    layout
                    className={hasProfile ? 'dir-card' : ''}
                    style={{
                      background: 'white', borderRadius: 20, overflow: 'hidden',
                      border: '1px solid #e8edf4', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                      display: 'flex', flexDirection: 'column', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                    }}
                  >
                    {/* Gradient top bar */}
                    <div style={{ height: 6, background: `linear-gradient(90deg, ${accent}, ${accent}80)` }} />

                    <div style={{ padding: 22, flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {/* Header */}
                      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                        <div style={{ width: 56, height: 56, borderRadius: 14, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                          {school.logo_url
                            ? <img src={school.logo_url} alt={school.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            : <GraduationCap size={26} color="#cbd5e1" />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 5px', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {school.name}
                          </h2>
                          <span style={{ fontSize: 11, fontWeight: 700, color: typeColor.text, background: typeColor.bg, padding: '2px 10px', borderRadius: 6, display: 'inline-block' }}>
                            {typeLabel}
                          </span>
                        </div>
                      </div>

                      {/* Motto / description */}
                      <p style={{ margin: 0, fontSize: 13, color: '#64748b', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden', fontStyle: school.motto ? 'italic' : 'normal' }}>
                        {school.description || (school.motto ? `"${school.motto}"` : 'No description added yet.')}
                      </p>

                      {/* Tags row */}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {hasBranches && (
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#059669', background: '#d1fae5', padding: '3px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Building2 size={10} /> Multi-Campus
                          </span>
                        )}
                        {school.address && (
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', background: '#f1f5f9', padding: '3px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <MapPin size={10} /> {school.address.split(',')[0]}
                          </span>
                        )}
                      </div>

                      {/* Divider */}
                      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 14, marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        {/* Stats */}
                        <div style={{ display: 'flex', gap: 14 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
                            <Eye size={13} /> {(school.profile_views || 0).toLocaleString()}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
                            <Heart size={13} /> {(school.profile_likes || 0).toLocaleString()}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
                            <Users size={13} /> {(school.profile_followers || 0).toLocaleString()}
                          </span>
                        </div>

                        {hasProfile
                          ? <span style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', display: 'flex', alignItems: 'center', gap: 4 }}><ExternalLink size={12} /> View Profile</span>
                          : <span style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 600 }}>Profile not set up</span>
                        }
                      </div>
                    </div>
                  </motion.div>
                )

                return hasProfile
                  ? <Link key={school.id} to={`/@${school.slug}`} style={{ textDecoration: 'none', display: 'contents' }}>{card}</Link>
                  : card
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  )
}
