// src/pages/public/SchoolDirectoryPage.tsx
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  MapPin,
  Building2,
  GraduationCap,
  ExternalLink,
  Heart,
  Users,
  Eye,
  School,
  ArrowLeft,
} from 'lucide-react'
import { SchoolSearchInput } from '../../components/public/SchoolSearchInput'
import { filterPublicSchools, usePublicSchools } from '../../hooks/usePublicSchools'
import '../../styles/school-directory.css'

const TYPE_LABELS: Record<string, string> = {
  basic: 'Basic School',
  shs: 'Senior High',
  remedial: 'Remedial',
  mixed: 'Mixed Level',
}

const FILTERS = ['All', 'Basic School', 'Senior High', 'Remedial', 'Mixed Level'] as const

const FILTER_TO_TYPE: Record<string, string | null> = {
  All: null,
  'Basic School': 'basic',
  'Senior High': 'shs',
  Remedial: 'remedial',
  'Mixed Level': 'mixed',
}

const DIR_PHOTOS = [
  'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2000',
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2000',
  'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2000',
]

const CARD_ACCENTS = ['#5e5ce6', '#bf5af2', '#64d2ff', '#ff375f', '#30d158', '#ff9f0a']

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 24 } },
}

function FilterPills({
  activeFilter,
  onFilter,
  className,
}: {
  activeFilter: string
  onFilter: (f: string) => void
  className?: string
}) {
  return (
    <div className={className}>
      {FILTERS.map((f) => (
        <button
          key={f}
          type="button"
          className={`schools-filter-pill${activeFilter === f ? ' is-active' : ''}`}
          onClick={() => onFilter(f)}
          aria-pressed={activeFilter === f}
        >
          {f}
        </button>
      ))}
    </div>
  )
}

export default function SchoolDirectoryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: schools = [], isLoading, isError } = usePublicSchools()
  const [search, setSearch] = useState(() => searchParams.get('q') || '')
  const [activeFilter, setActiveFilter] = useState('All')
  const [bgIdx, setBgIdx] = useState(0)

  useEffect(() => {
    const q = searchParams.get('q') || ''
    setSearch(q)
  }, [searchParams])

  useEffect(() => {
    const t = search.trim()
    if (t) setSearchParams({ q: t }, { replace: true })
    else setSearchParams({}, { replace: true })
  }, [search, setSearchParams])

  useEffect(() => {
    const timer = setInterval(() => setBgIdx((i) => (i + 1) % DIR_PHOTOS.length), 6000)
    return () => clearInterval(timer)
  }, [])

  const typeFilter = FILTER_TO_TYPE[activeFilter] ?? null

  const filtered = useMemo(
    () => filterPublicSchools(schools, search, typeFilter),
    [schools, search, typeFilter],
  )

  return (
    <div className="schools-page">
      <header className="schools-hero">
        <div className="schools-hero-media" aria-hidden>
          <AnimatePresence mode="popLayout">
            <motion.img
              key={bgIdx}
              src={DIR_PHOTOS[bgIdx]}
              alt=""
              className="schools-hero-bg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
            />
          </AnimatePresence>
          <div className="schools-hero-overlay" />
          <div className="schools-hero-glow schools-hero-glow--1" />
          <div className="schools-hero-glow schools-hero-glow--2" />
        </div>

        <div className="schools-hero-inner">
          <Link to="/" className="schools-back">
            <ArrowLeft size={16} strokeWidth={2.5} /> Home
          </Link>

          <div className="schools-hero-badge">
            <School size={15} strokeWidth={2.5} /> Nexora Directory
          </div>

          <h1 className="schools-hero-title">
            Find Schools on <span>Nexora</span>
          </h1>
          <p className="schools-hero-desc">
            Search by name, city, or motto. Results update as you type.
          </p>

          <div className="schools-hero-search-panel">
            <SchoolSearchInput
              schools={schools}
              value={search}
              onChange={setSearch}
              typeFilter={typeFilter}
              variant="directory"
              placeholder="Search schools…"
            />
            <FilterPills
              activeFilter={activeFilter}
              onFilter={setActiveFilter}
              className="schools-filter-scroll"
            />
          </div>
        </div>
      </header>

      <main className="schools-body">
        <div className="schools-results-bar">
          <FilterPills
            activeFilter={activeFilter}
            onFilter={setActiveFilter}
            className="schools-filter-scroll schools-filter-desktop"
          />
          {!isLoading && (
            <span className="schools-results-count">
              {filtered.length} school{filtered.length !== 1 ? 's' : ''}
              {search.trim() ? ` matching “${search.trim()}”` : ''}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="schools-loading">
            <div className="schools-loading-spinner" />
            <p className="schools-loading-text">Loading schools…</p>
          </div>
        ) : isError ? (
          <div className="schools-state schools-state--error">
            <p className="schools-state-title schools-state-title--error">Could not load schools</p>
            <p className="schools-state-desc">
              Check your connection, or apply the latest Supabase migrations (`supabase db push`).
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            className="schools-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Search size={44} strokeWidth={1.5} className="schools-state-icon" />
            <h3 className="schools-state-title">No schools found</h3>
            <p className="schools-state-desc">
              {search.trim()
                ? 'Try a different name or clear your filters.'
                : 'No schools match the selected type.'}
            </p>
          </motion.div>
        ) : (
          <motion.div
            className="schools-grid"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.05 } } }}
          >
            {filtered.map((school, i) => {
              const sType = school.school_settings?.[0]?.school_type || 'basic'
              const hasBranches = school.school_settings?.[0]?.has_branches || false
              const typeLabel = TYPE_LABELS[sType] || 'Basic School'
              const hasProfile = !!school.slug
              const accent = CARD_ACCENTS[i % CARD_ACCENTS.length]

              const card = (
                <motion.article
                  key={school.id}
                  variants={cardVariants}
                  layout
                  className="schools-card"
                  style={{ '--card-accent': accent } as React.CSSProperties}
                >
                  <div className="schools-card-accent" />
                  <div className="schools-card-body">
                    <div className="schools-card-head">
                      <div className="schools-card-logo">
                        {school.logo_url ? (
                          <img src={school.logo_url} alt="" />
                        ) : (
                          <GraduationCap size={24} strokeWidth={1.75} />
                        )}
                      </div>
                      <div className="schools-card-info">
                        <h2 className="schools-card-name">{school.name}</h2>
                        <span className={`schools-type-badge schools-type-badge--${sType}`}>
                          {typeLabel}
                        </span>
                      </div>
                    </div>

                    <p className="schools-card-desc">
                      {school.description ||
                        (school.motto ? `"${school.motto}"` : 'No description yet.')}
                    </p>

                    <div className="schools-card-tags">
                      {hasBranches && (
                        <span className="schools-tag schools-tag--campus">
                          <Building2 size={11} strokeWidth={2.5} /> Multi-Campus
                        </span>
                      )}
                      {school.address && (
                        <span className="schools-tag schools-tag--location">
                          <MapPin size={11} strokeWidth={2.5} />
                          <span>{school.address.split(',')[0]}</span>
                        </span>
                      )}
                    </div>

                    <div className="schools-card-foot">
                      <div className="schools-card-stats">
                        <span className="schools-stat">
                          <Eye size={13} strokeWidth={2.5} />{' '}
                          {(school.profile_views || 0).toLocaleString()}
                        </span>
                        <span className="schools-stat">
                          <Heart size={13} strokeWidth={2.5} />{' '}
                          {(school.profile_likes || 0).toLocaleString()}
                        </span>
                        <span className="schools-stat">
                          <Users size={13} strokeWidth={2.5} />{' '}
                          {(school.profile_followers || 0).toLocaleString()}
                        </span>
                      </div>
                      {hasProfile ? (
                        <span className="schools-card-cta">
                          <ExternalLink size={12} strokeWidth={2.5} /> View profile
                        </span>
                      ) : (
                        <span className="schools-card-pending">Profile pending</span>
                      )}
                    </div>
                  </div>
                </motion.article>
              )

              return hasProfile ? (
                <Link key={school.id} to={`/@${school.slug}`} className="schools-card-link">
                  {card}
                </Link>
              ) : (
                card
              )
            })}
          </motion.div>
        )}
      </main>
    </div>
  )
}
