// src/pages/public/SchoolProfilePage.tsx
import { useEffect, useState, useCallback, type ReactNode } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { CURRICULUMS, SHS_PROGRAMMES } from '../../constants/curriculumData'
import { NotFoundPage } from '../ErrorPages'
import {
  MapPin,
  Phone,
  Mail,
  Heart,
  Users,
  Eye,
  Play,
  X,
  ChevronLeft,
  ChevronRight,
  Building2,
  GraduationCap,
  Search,
  Info,
  ImageIcon,
  Video,
  BookOpen,
  Zap,
  Share2,
  Sparkles,
  ExternalLink,
} from 'lucide-react'
import '../../styles/school-profile.css'

const SCHOOL_TYPE_LABEL: Record<string, string> = {
  basic: 'Basic School',
  shs: 'Senior High',
  remedial: 'Remedial',
  mixed: 'Mixed Level',
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Info
  title: string
  children: ReactNode
}) {
  return (
    <motion.section
      className="sp-section"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35 }}
    >
      <div className="sp-section-head">
        <div className="sp-section-icon">
          <Icon size={18} strokeWidth={2.25} />
        </div>
        <h2 className="sp-section-title">{title}</h2>
      </div>
      {children}
    </motion.section>
  )
}

export default function SchoolProfilePage() {
  const { handle } = useParams<{ handle: string }>()
  const cleanSlug = handle?.startsWith('@') ? handle.replace(/^@/, '') : null

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
  const [topScrolled, setTopScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setTopScrolled(window.scrollY > 48)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const photoCount = media.filter((m) => m.media_type === 'photo').length
    if (photoCount === 0) return
    const timer = setInterval(() => setBgIdx((i) => (i + 1) % photoCount), 6000)
    return () => clearInterval(timer)
  }, [media])

  useEffect(() => {
    if (!cleanSlug) {
      setLoading(false)
      setSchool(null)
      return
    }

    const fetchSchool = async () => {
      setLoading(true)
      const { data: s, error } = await supabase
        .from('schools')
        .select('*')
        .eq('slug', cleanSlug)
        .maybeSingle()

      if (error || !s) {
        setSchool(null)
        setLoading(false)
        return
      }

      setSchool(s)
      setStats({
        views: s.profile_views || 0,
        likes: s.profile_likes || 0,
        followers: s.profile_followers || 0,
      })

      await supabase
        .from('schools')
        .update({ profile_views: (s.profile_views || 0) + 1 })
        .eq('id', s.id)

      const { data: st } = await supabase
        .from('school_settings')
        .select('*')
        .eq('school_id', s.id)
        .maybeSingle()
      setSettings(st || {})

      const { data: m } = await supabase
        .from('school_profile_media')
        .select('*')
        .eq('school_id', s.id)
        .order('sort_order')
      setMedia(m || [])

      document.title = `${s.name} — Acadera`
      let metaDesc = document.querySelector('meta[name="description"]')
      if (!metaDesc) {
        metaDesc = document.createElement('meta')
        metaDesc.setAttribute('name', 'description')
        document.head.appendChild(metaDesc)
      }
      metaDesc.setAttribute(
        'content',
        s.description || `Official profile for ${s.name} on Acadera.`,
      )

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: likeRow } = await supabase
          .from('school_likes')
          .select('id')
          .eq('school_id', s.id)
          .eq('user_id', user.id)
          .maybeSingle()
        setLiked(!!likeRow)
        const { data: followRow } = await supabase
          .from('school_follows')
          .select('id')
          .eq('school_id', s.id)
          .eq('follower_id', user.id)
          .maybeSingle()
        setFollowed(!!followRow)
      }
      setLoading(false)
    }

    fetchSchool()
  }, [cleanSlug])

  const toggleLike = async () => {
    if (!school) return
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    if (liked) {
      await supabase.from('school_likes').delete().eq('school_id', school.id).eq('user_id', user.id)
      await supabase
        .from('schools')
        .update({ profile_likes: Math.max(0, stats.likes - 1) })
        .eq('id', school.id)
      setStats((s) => ({ ...s, likes: Math.max(0, s.likes - 1) }))
    } else {
      await supabase.from('school_likes').insert({ school_id: school.id, user_id: user.id })
      await supabase.from('schools').update({ profile_likes: stats.likes + 1 }).eq('id', school.id)
      setStats((s) => ({ ...s, likes: s.likes + 1 }))
    }
    setLiked((l) => !l)
  }

  const toggleFollow = async () => {
    if (!school) return
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    if (followed) {
      await supabase
        .from('school_follows')
        .delete()
        .eq('school_id', school.id)
        .eq('follower_id', user.id)
      await supabase
        .from('schools')
        .update({ profile_followers: Math.max(0, stats.followers - 1) })
        .eq('id', school.id)
      setStats((s) => ({ ...s, followers: Math.max(0, s.followers - 1) }))
    } else {
      await supabase
        .from('school_follows')
        .insert({ school_id: school.id, follower_id: user.id })
      await supabase
        .from('schools')
        .update({ profile_followers: stats.followers + 1 })
        .eq('id', school.id)
      setStats((s) => ({ ...s, followers: s.followers + 1 }))
    }
    setFollowed((f) => !f)
  }

  const handleShare = useCallback(async () => {
    if (!school || !cleanSlug) return
    const url = `${window.location.origin}/@${cleanSlug}`
    try {
      if (navigator.share) {
        await navigator.share({ title: school.name, text: school.motto || school.name, url })
      } else {
        await navigator.clipboard.writeText(url)
      }
    } catch {
      /* user cancelled */
    }
  }, [school, cleanSlug])

  const photos = media.filter((m) => m.media_type === 'photo')
  const videos = media.filter((m) => m.media_type === 'video')
  const curriculums =
    settings?.curriculums
      ?.map((id: string) => CURRICULUMS.find((c) => c.id === id))
      ?.filter(Boolean) || []
  const programmes =
    settings?.shs_programmes
      ?.map((id: string) => SHS_PROGRAMMES.find((p) => p.id === id))
      ?.filter(Boolean) || []

  const typeLabel = settings?.school_type
    ? SCHOOL_TYPE_LABEL[settings.school_type] || 'School'
    : null

  if (!cleanSlug) return <NotFoundPage />

  if (loading) {
    return (
      <div className="sp-state school-profile">
        <div className="sp-spinner" />
        <p className="sp-state-text">Loading profile…</p>
      </div>
    )
  }

  if (!school) {
    return (
      <div className="sp-state school-profile">
        <Search size={48} strokeWidth={1.5} className="sp-state-icon" />
        <h1 className="sp-state-title">School not found</h1>
        <p className="sp-state-desc">
          No school at /@{cleanSlug}
        </p>
        <Link to="/schools" className="sp-btn sp-btn--primary sp-state-action">
          Browse directory
        </Link>
      </div>
    )
  }

  const accentCss = settings?.primary_color
    ? ({ '--sp-accent': settings.primary_color } as React.CSSProperties)
    : undefined

  return (
    <div className="school-profile" style={accentCss}>
      <header className={`sp-topbar${topScrolled ? ' is-scrolled' : ''}`}>
        <Link to="/schools" className="sp-topbar-back">
          <ChevronLeft size={18} strokeWidth={2.5} />
          Directory
        </Link>
        <button type="button" className="sp-topbar-share" onClick={handleShare} aria-label="Share profile">
          <Share2 size={18} strokeWidth={2} />
        </button>
      </header>

      <section className="sp-hero" aria-hidden>
        {photos.length > 0 && (
          <AnimatePresence mode="popLayout">
            <motion.img
              key={bgIdx}
              src={photos[bgIdx]?.url}
              alt=""
              className="sp-hero-img"
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 0.55, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
            />
          </AnimatePresence>
        )}
        <div className="sp-hero-overlay" />
        <div className="sp-hero-glow sp-hero-glow--1" />
        <div className="sp-hero-glow sp-hero-glow--2" />
      </section>

      <main className="sp-main">
        <motion.div
          className="sp-identity"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="sp-identity-row">
            <div className="sp-avatar">
              {school.logo_url ? (
                <img src={school.logo_url} alt="" />
              ) : (
                <GraduationCap size={36} strokeWidth={1.75} color="var(--sp-text-3)" />
              )}
            </div>
            <div className="sp-identity-text">
              <h1 className="sp-name">{school.name}</h1>
              <p className="sp-handle">@{cleanSlug}</p>
              {school.motto && <p className="sp-motto">&ldquo;{school.motto}&rdquo;</p>}
              <div className="sp-badges">
                {typeLabel && (
                  <span className="sp-badge">
                    <Sparkles size={12} />
                    {typeLabel}
                  </span>
                )}
                {school.is_branch && (
                  <span className="sp-badge sp-badge--green">
                    <Building2 size={12} />
                    Multi-campus
                  </span>
                )}
                <span className="sp-badge">
                  <Zap size={12} />
                  Acadera
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="sp-stats">
          {[
            { icon: Eye, value: stats.views, label: 'Views' },
            { icon: Heart, value: stats.likes, label: 'Likes' },
            { icon: Users, value: stats.followers, label: 'Followers' },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="sp-stat">
              <div className="sp-stat-value">{value.toLocaleString()}</div>
              <div className="sp-stat-label">
                <Icon size={12} strokeWidth={2.5} />
                {label}
              </div>
            </div>
          ))}
        </div>

        <div className="sp-actions">
          <button
            type="button"
            className={`sp-btn sp-btn--ghost${liked ? ' is-active' : ''}`}
            onClick={toggleLike}
          >
            <Heart size={18} strokeWidth={2.25} fill={liked ? 'currentColor' : 'none'} />
            {liked ? 'Liked' : 'Like'}
          </button>
          <button
            type="button"
            className={`sp-btn sp-btn--primary${followed ? ' is-active' : ''}`}
            onClick={toggleFollow}
          >
            <Users size={18} strokeWidth={2.25} />
            {followed ? 'Following' : 'Follow'}
          </button>
        </div>

        <div className="sp-content-grid">
          <div className="sp-content-main">
            {school.description && (
              <Section icon={Info} title="About">
                <p className="sp-section-body">{school.description}</p>
              </Section>
            )}

            {photos.length > 0 && (
              <Section icon={ImageIcon} title="Gallery">
                <div className="sp-gallery-scroll">
                  {photos.map((p, i) => (
                    <button
                      key={p.id}
                      type="button"
                      className="sp-gallery-item"
                      onClick={() => setLightbox({ items: photos, idx: i })}
                      aria-label={p.caption || `Photo ${i + 1}`}
                    >
                      <img src={p.url} alt="" loading="lazy" />
                    </button>
                  ))}
                </div>
              </Section>
            )}

            {videos.length > 0 && (
              <Section icon={Video} title="Videos">
                <div className="sp-video-list">
                  {videos.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      className="sp-video-card"
                      onClick={() => setPreviewVideo(v)}
                    >
                      <div className="sp-video-play">
                        <Play size={20} fill="currentColor" strokeWidth={0} />
                      </div>
                      <div className="sp-video-meta">
                        <p className="sp-video-title">{v.caption || 'School video'}</p>
                        <p className="sp-video-sub">Tap to watch</p>
                      </div>
                      <ExternalLink size={16} strokeWidth={2} className="sp-video-ext" />
                    </button>
                  ))}
                </div>
              </Section>
            )}

            {curriculums.length > 0 && (
              <Section icon={BookOpen} title="Curriculum">
                <div className="sp-chips">
                  {curriculums.map((c: any) => (
                    <span key={c.id} className="sp-chip">
                      <span>{c.icon}</span>
                      {c.label}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {programmes.length > 0 && (
              <Section icon={GraduationCap} title="Programmes">
                <div className="sp-chips">
                  {programmes.map((p: any) => (
                    <span
                      key={p.id}
                      className="sp-chip"
                      style={{ background: p.bg, color: p.color, borderColor: `${p.color}30` }}
                    >
                      <span>{p.icon}</span>
                      {p.label}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {school.location_lat && school.location_lng && (
              <Section icon={MapPin} title="Location">
                {school.location_label && (
                  <p className="sp-section-body sp-section-body--spaced">{school.location_label}</p>
                )}
                <div className="sp-map">
                  <iframe
                    title="School location"
                    loading="lazy"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${school.location_lng - 0.01},${school.location_lat - 0.01},${school.location_lng + 0.01},${school.location_lat + 0.01}&layer=mapnik&marker=${school.location_lat},${school.location_lng}`}
                  />
                </div>
              </Section>
            )}
          </div>

          <aside className="sp-sidebar">
            {(school.address || school.phone || school.email) && (
              <Section icon={Phone} title="Contact">
                <div className="sp-contact-list">
                  {school.address && (
                    <div className="sp-contact-item">
                      <span className="sp-contact-icon">
                        <MapPin size={16} />
                      </span>
                      <span>{school.address}</span>
                    </div>
                  )}
                  {school.phone && (
                    <a href={`tel:${school.phone}`} className="sp-contact-item sp-contact-item--link">
                      <span className="sp-contact-icon">
                        <Phone size={16} />
                      </span>
                      {school.phone}
                    </a>
                  )}
                  {school.email && (
                    <a href={`mailto:${school.email}`} className="sp-contact-item sp-contact-item--link">
                      <span className="sp-contact-icon">
                        <Mail size={16} />
                      </span>
                      {school.email}
                    </a>
                  )}
                </div>
              </Section>
            )}

            {school.tags?.length > 0 && (
              <Section icon={Sparkles} title="Tags">
                <div className="sp-chips">
                  {school.tags.map((tag: string) => (
                    <span key={tag} className="sp-chip">
                      #{tag}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            <div className="sp-cta">
              <div className="sp-cta-icon">
                <Zap size={24} fill="currentColor" />
              </div>
              <p className="sp-cta-title">Powered by Acadera</p>
              <p className="sp-cta-text">
                Academics, fees, and operations — managed on one platform.
              </p>
              <Link to="/" className="sp-cta-link">
                Explore Acadera
                <ChevronRight size={16} />
              </Link>
            </div>
          </aside>
        </div>
      </main>

      <AnimatePresence>
        {lightbox && (
          <motion.div
            className="sp-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
          >
            <button
              type="button"
              className="sp-modal-close"
              onClick={() => setLightbox(null)}
              aria-label="Close"
            >
              <X size={20} />
            </button>
            <button
              type="button"
              className="sp-modal-nav sp-modal-nav--prev"
              onClick={(e) => {
                e.stopPropagation()
                setLightbox((l) => l && l.idx > 0 ? { ...l, idx: l.idx - 1 } : l)
              }}
              aria-label="Previous"
            >
              <ChevronLeft size={22} />
            </button>
            <motion.img
              key={lightbox.idx}
              src={lightbox.items[lightbox.idx].url}
              alt=""
              className="sp-modal-img"
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
            />
            <button
              type="button"
              className="sp-modal-nav sp-modal-nav--next"
              onClick={(e) => {
                e.stopPropagation()
                setLightbox((l) =>
                  l && l.idx < l.items.length - 1 ? { ...l, idx: l.idx + 1 } : l,
                )
              }}
              aria-label="Next"
            >
              <ChevronRight size={22} />
            </button>
            <span className="sp-modal-counter">
              {lightbox.idx + 1} / {lightbox.items.length}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {previewVideo && (
          <motion.div
            className="sp-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewVideo(null)}
          >
            <motion.div
              className="sp-video-modal"
              initial={{ scale: 0.94 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.94 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="sp-modal-close sp-modal-close--inline"
                onClick={() => setPreviewVideo(null)}
                aria-label="Close video"
              >
                <X size={18} />
              </button>
              <div className="sp-video-frame">
                <iframe
                  src={previewVideo.url}
                  title="Video"
                  allowFullScreen
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
