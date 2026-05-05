// src/pages/shared/NewsPortalPage.tsx
// ─────────────────────────────────────────────────────────────────
//  NewsPortalPage — Production-grade, industry-standard news portal
//
//  LAYOUT FIXES v2:
//  ✅ Removed duplicate `background` CSS property on nav buttons
//  ✅ Sidebar min-width guard so channel grid never collapses
//  ✅ Theater mode renders in main column with channel strip below
//  ✅ Grid uses minmax(0,1fr) to prevent overflow blowout
//  ✅ Nav buttons use className to avoid inline duplicate props
//  ✅ gridTemplateColumns switches to 1fr in theater (sidebar hidden)
//
//  CHANNELS — only confirmed free-embed YouTube 24/7 live streams:
//  Al Jazeera · DW · France 24 · WION · TRT World · CGTN ·
//  Euronews · Sky News Australia · NHK World · Reuters · AP · i24 News
//
//  REMOVED (embed disabled or geo-locked):
//  BBC News Live, CNN International, NBC News, Bloomberg TV
//
//  FEEDS:
//  ✅ GES / Education — Ghana-specific education feeds
//  ✅ Ghana — GhanaWeb, Citi FM, Joy FM, Pulse, Graphic, Modern Ghana
//  ✅ Global — Al Jazeera, BBC World, NYT World, Reuters, France 24, Sky
// ─────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Newspaper, Globe, Cpu, Trophy, Activity,
  RefreshCw, Clock, Minimize2, Maximize2,
  FlaskConical, ExternalLink, Wifi, WifiOff, GraduationCap,
} from 'lucide-react'

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

interface NewsItem {
  id: string
  title: string
  link: string
  pubDate: string
  description: string
  source: string
  category: string
  thumbnail: string
}

interface Category {
  id: string
  label: string
  icon: React.ElementType
  feeds: string[]
  sourceName: string
}

interface Channel {
  id: string
  name: string
  short: string
  bgColor: string
  /** Pinned 24/7 live stream video ID — confirmed freely embeddable */
  vid: string
}

// ═══════════════════════════════════════════════════════════════
//  CATEGORIES
// ═══════════════════════════════════════════════════════════════

const CATEGORIES: Category[] = [
  {
    id: 'top',
    label: 'Top Stories',
    icon: Newspaper,
    feeds: [
      'https://feeds.bbci.co.uk/news/rss.xml',
      'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
      'https://www.aljazeera.com/xml/rss/all.xml',
    ],
    sourceName: 'BBC News',
  },
  {
    id: 'ghana',
    label: 'Ghana',
    icon: Globe,
    feeds: [
      'https://www.ghanaweb.com/GhanaHomePage/NewsArchive/rss.xml',
      'https://www.modernghana.com/rss/news.xml',
      'https://citinewsroom.com/feed/',
      'https://www.myjoyonline.com/feed/',
      'https://pulse.com.gh/rss/news',
      'https://www.graphic.com.gh/feed/',
    ],
    sourceName: 'GhanaWeb',
  },
  {
    id: 'ges',
    label: 'GES / Education',
    icon: GraduationCap,
    feeds: [
      'https://citinewsroom.com/category/education/feed/',
      'https://www.myjoyonline.com/category/education/feed/',
      'https://www.ghanaweb.com/GhanaHomePage/education/rss.xml',
      'https://www.modernghana.com/rss/education.xml',
      'https://www.graphic.com.gh/category/education/feed/',
      'https://pulse.com.gh/rss/education',
    ],
    sourceName: 'Ghana Education',
  },
  {
    id: 'global',
    label: 'Global',
    icon: Globe,
    feeds: [
      'https://www.aljazeera.com/xml/rss/all.xml',
      'https://feeds.bbci.co.uk/news/world/rss.xml',
      'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
      'https://feeds.reuters.com/reuters/topNews',
      'https://www.france24.com/en/rss',
      'https://feeds.skynews.com/feeds/rss/world.xml',
    ],
    sourceName: 'Al Jazeera',
  },
  {
    id: 'tech',
    label: 'Technology',
    icon: Cpu,
    feeds: [
      'https://feeds.bbci.co.uk/news/technology/rss.xml',
      'https://techcrunch.com/feed/',
    ],
    sourceName: 'BBC Tech',
  },
  {
    id: 'world',
    label: 'World',
    icon: Globe,
    feeds: [
      'https://feeds.bbci.co.uk/news/world/rss.xml',
      'https://www.aljazeera.com/xml/rss/all.xml',
    ],
    sourceName: 'BBC World',
  },
  {
    id: 'sports',
    label: 'Sports',
    icon: Trophy,
    feeds: [
      'https://feeds.bbci.co.uk/sport/rss.xml',
      'https://www.espn.com/espn/rss/news',
    ],
    sourceName: 'BBC Sport',
  },
  {
    id: 'health',
    label: 'Health',
    icon: Activity,
    feeds: [
      'https://feeds.bbci.co.uk/news/health/rss.xml',
      'https://www.who.int/rss-feeds/news-english.xml',
    ],
    sourceName: 'BBC Health',
  },
  {
    id: 'sci',
    label: 'Science',
    icon: FlaskConical,
    feeds: [
      'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml',
      'https://www.sciencedaily.com/rss/top/science.xml',
    ],
    sourceName: 'BBC Science',
  },
]

// ═══════════════════════════════════════════════════════════════
//  CHANNELS — verified free-embed YouTube 24/7 live streams
//
//  HOW TO REFRESH A `vid`:
//    1. Open youtube.com/@{handle}/live
//    2. Copy the ?v= param from the URL bar
//
//  CONFIRMED FREELY EMBEDDABLE (iframe, no geo-lock):
//    Al Jazeera, DW, France 24, WION, TRT World, CGTN,
//    Euronews, Sky News Australia, NHK World, Reuters, AP, i24 News
//
//  EXCLUDED (embed disabled / geo-restricted / paywalled):
//    BBC News Live, CNN International, NBC News, Bloomberg TV
// ═══════════════════════════════════════════════════════════════

const CHANNELS: Channel[] = [
  { id: 'alj', name: 'Al Jazeera English', short: 'AJE', bgColor: '#9e6d14', vid: 'h3MuIUNCCzI' },
  { id: 'dw', name: 'DW News', short: 'DW', bgColor: '#a02820', vid: 'BGET3MkmLCg' },
  { id: 'f24', name: 'France 24 English', short: 'F24', bgColor: '#003d80', vid: 'l8PMl7tUDIE' },
  { id: 'wion', name: 'WION', short: 'WION', bgColor: '#141438', vid: 'tdNwbBd4dI0' },
  { id: 'trt', name: 'TRT World', short: 'TRT', bgColor: '#8c2218', vid: 'S6sFSEMn02Q' },
  { id: 'cgtn', name: 'CGTN', short: 'CGTN', bgColor: '#125030', vid: 'mMYDobFVEYU' },
  { id: 'euro', name: 'Euronews', short: 'EURO', bgColor: '#002b80', vid: 'uKWB4Fpgbnc' },
  { id: 'sky', name: 'Sky News Australia', short: 'SKY', bgColor: '#003399', vid: '_1pKKEU7M6Q' },
  { id: 'nhk', name: 'NHK World Japan', short: 'NHK', bgColor: '#1a5276', vid: '4ToUAkEF_d4' },
  { id: 'reuters', name: 'Reuters TV', short: 'REU', bgColor: '#b34700', vid: 'DFsHQSFmpao' },
  { id: 'ap', name: 'AP News', short: 'AP', bgColor: '#222222', vid: 'dCXazbNhlFg' },
  { id: 'i24', name: 'i24 News English', short: 'i24', bgColor: '#004f77', vid: 'uGJiyQI1eMU' },
]

// ═══════════════════════════════════════════════════════════════
//  CORS PROXY FALLBACK CHAIN
// ═══════════════════════════════════════════════════════════════

const CORS_PROXIES: Array<(url: string) => string> = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://cors-anywhere.herokuapp.com/${url}`,
]

// ═══════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════

const UNSPLASH_TOPICS: Record<string, string> = {
  top: 'breaking-news,newspaper', ghana: 'accra,africa,ghana',
  ges: 'education,school,classroom', global: 'globe,world,international',
  tech: 'technology,computer,code', world: 'globe,world,travel',
  sports: 'sports,stadium,athlete', health: 'medicine,health,hospital',
  sci: 'science,laboratory,space',
}

const fallbackThumb = (catId: string, seed: number) =>
  `https://source.unsplash.com/800x500/?${UNSPLASH_TOPICS[catId] ?? 'news'}&sig=${seed}`

function decodeEntities(raw: string) {
  return raw
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

function parseRSS(xml: string, catId: string, sourceName: string): NewsItem[] {
  const itemBlocks = xml.match(/<item[\s>]([\s\S]*?)<\/item>/g) ?? []
  return itemBlocks.slice(0, 12).map((raw, i): NewsItem => {
    const get = (tag: string) => {
      const m = raw.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))
      if (!m) return ''
      return decodeEntities(
        m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      )
    }
    const fullTitle = get('title') || '(No title)'
    const [rawTitle, rawSrc] = fullTitle.split(' - ')
    const title = rawTitle?.trim() || fullTitle
    const source = rawSrc?.trim() || sourceName
    const link = (get('link') || get('guid') || '').trim()
    const pubDate = get('pubDate') || get('dc:date') || new Date().toISOString()
    const rawDesc = get('description') || get('summary') || ''
    const description = rawDesc.slice(0, 190).trim() + (rawDesc.length > 190 ? '…' : '')
    let thumbnail = ''
    const m1 = raw.match(/<media:thumbnail[^>]+url="([^"]+)"/)
    const m2 = raw.match(/<enclosure[^>]+url="([^"]+)"/)
    const m3 = raw.match(/<media:content[^>]+url="([^"]+)"/)
    const m4 = raw.match(/<img[^>]+src="([^"]+)"/)
    if (m1) thumbnail = m1[1]
    else if (m2) thumbnail = m2[1]
    else if (m3) thumbnail = m3[1]
    else if (m4) thumbnail = m4[1]
    if (thumbnail && (thumbnail.includes('1x1') || thumbnail.includes('/pixel') || thumbnail.includes('tracking'))) thumbnail = ''
    if (!thumbnail) thumbnail = fallbackThumb(catId, i + Date.now())
    return { id: `${catId}-${i}-${Date.now()}`, title, link, pubDate, description, source, category: catId, thumbnail }
  })
}

async function fetchWithFallback(feedUrls: string[]): Promise<string> {
  for (const feedUrl of feedUrls) {
    for (const makeProxy of CORS_PROXIES) {
      try {
        const res = await fetch(makeProxy(feedUrl), { signal: AbortSignal.timeout(9_000) })
        if (!res.ok) continue
        const text = await res.text()
        if (text.length > 200 && /<item/i.test(text)) return text
      } catch { /* try next */ }
    }
  }
  throw new Error('All feeds and proxies exhausted')
}

const formatDate = (str: string) => {
  try { return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(str)) }
  catch { return str }
}

// ═══════════════════════════════════════════════════════════════
//  SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

function SkeletonCard() {
  return (
    <div style={{ background: '#fff', border: '1px solid #e4e3de', borderRadius: 20, overflow: 'hidden', animation: 'np-shimmer 1.8s ease-in-out infinite' }}>
      <div style={{ height: 176, background: '#f1f0ec' }} />
      <div style={{ padding: 18 }}>
        {[85, 65, 75, 55, 40].map((w, i) => (
          <div key={i} style={{ height: 11, width: `${w}%`, background: '#f1f0ec', borderRadius: 4, marginBottom: i === 3 ? 16 : 9 }} />
        ))}
      </div>
    </div>
  )
}

function NewsCard({ item, index }: { item: NewsItem; index: number }) {
  const [imgErr, setImgErr] = useState(false)
  return (
    <motion.article
      initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, delay: index * 0.055, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -5, boxShadow: '0 20px 48px rgba(0,0,0,0.12)' }}
      layout
      style={{ background: '#fff', border: '1px solid #e4e3de', borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'default', willChange: 'transform', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
    >
      <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
        <div style={{ height: 176, overflow: 'hidden', position: 'relative', background: '#f1f0ec', flexShrink: 0 }}>
          <motion.img
            src={imgErr ? fallbackThumb(item.category, index) : item.thumbnail}
            alt={item.title} loading="lazy" onError={() => setImgErr(true)}
            initial={{ scale: 1.07, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.48 }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          <div style={{ position: 'absolute', top: 10, left: 10, padding: '3px 9px', background: '#10103a', color: 'rgba(255,255,255,0.92)', fontSize: 8, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', borderRadius: 4 }}>
            {item.source}
          </div>
        </div>
      </a>
      <div style={{ padding: '16px 18px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 700, lineHeight: 1.42, color: '#0f0e17', marginBottom: 9, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {item.title}
          </h3>
        </a>
        <p style={{ fontSize: 12, color: '#72727f', lineHeight: 1.7, flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {item.description}
        </p>
        <footer style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 13, paddingTop: 11, borderTop: '1px solid #e4e3de' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#72727f' }}>
            <Clock size={11} />{formatDate(item.pubDate)}
          </span>
          <a href={item.link} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#c0392b', textDecoration: 'none' }}>
            Read more <ExternalLink size={11} />
          </a>
        </footer>
      </div>
    </motion.article>
  )
}

function BreakingTicker({ headlines }: { headlines: string[] }) {
  if (!headlines.length) return null
  const doubled = [...headlines, ...headlines]
  return (
    <div style={{ display: 'flex', alignItems: 'center', background: '#c0392b', borderRadius: 12, height: 34, overflow: 'hidden', marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0 14px', flexShrink: 0, fontSize: 9, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: '#fff', borderRight: '1px solid rgba(255,255,255,0.3)' }}>
        <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#fff', animation: 'np-pulse 1.2s ease-in-out infinite' }} />
        Breaking
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ display: 'flex', animation: 'np-ticker 55s linear infinite', whiteSpace: 'nowrap' }}>
          {doubled.map((h, i) => (
            <span key={i} style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.95)', padding: '0 6px' }}>
              {h}<span style={{ color: 'rgba(255,255,255,0.35)', margin: '0 10px', fontSize: 9 }}>◆</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function LivePlayer({ channel, theaterMode, onEnterTheater, onExitTheater }: {
  channel: Channel; theaterMode: boolean; onEnterTheater: () => void; onExitTheater: () => void
}) {
  const src = `https://www.youtube.com/embed/${channel.vid}?autoplay=1&mute=${theaterMode ? 0 : 1}&rel=0&modestbranding=1&playsinline=1`
  return (
    <div style={{ background: '#1e1e5c', borderRadius: theaterMode ? 12 : 20, overflow: 'hidden', boxShadow: '0 16px 48px rgba(16,16,58,0.3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 8px', borderRadius: 4, background: '#c0392b', fontSize: 9, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: '#fff', flexShrink: 0 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', animation: 'np-pulse 1.4s ease-in-out infinite', display: 'inline-block' }} />
          LIVE
        </div>
        <span style={{ flex: 1, fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.65)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {channel.name}
        </span>
        <button
          onClick={theaterMode ? onExitTheater : onEnterTheater}
          style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6, padding: '5px 10px', color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
        >
          {theaterMode ? <><Minimize2 size={13} /> Exit</> : <><Maximize2 size={13} /> Expand</>}
        </button>
      </div>
      <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#000' }}>
        <iframe
          key={`${channel.id}-${theaterMode}`}
          src={src}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen title={`${channel.name} live`}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
        />
      </div>
    </div>
  )
}

/**
 * ChannelGrid — 4 cols × 3 rows for 12 channels.
 * Uses minmax(0,1fr) so cells never overflow their container.
 */
function ChannelGrid({ channels, activeChannel, onSelect }: {
  channels: Channel[]; activeChannel: Channel; onSelect: (ch: Channel) => void
}) {
  return (
    <div style={{ background: '#1e1e5c', borderRadius: 16, padding: 10, display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 6 }}>
      {channels.map(ch => (
        <button
          key={ch.id} onClick={() => onSelect(ch)} title={ch.name}
          style={{
            padding: '9px 2px', border: '1px solid',
            borderColor: activeChannel.id === ch.id ? 'transparent' : 'rgba(255,255,255,0.12)',
            borderRadius: 7,
            background: activeChannel.id === ch.id ? ch.bgColor : 'rgba(255,255,255,0.06)',
            color: activeChannel.id === ch.id ? '#fff' : 'rgba(255,255,255,0.55)',
            fontSize: 8, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase',
            cursor: 'pointer', textAlign: 'center', minWidth: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            transition: 'background .18s,color .18s,border-color .18s',
          }}
        >
          {ch.short}
        </button>
      ))}
    </div>
  )
}

function LiveClock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    tick(); const id = setInterval(tick, 1_000); return () => clearInterval(id)
  }, [])
  return <>{time}</>
}

// ═══════════════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════════════

export default function NewsPortalPage() {
  const [activeTab, setActiveTab] = useState('top')
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [online, setOnline] = useState(navigator.onLine)
  const [channel, setChannel] = useState<Channel>(CHANNELS[0])
  const [theater, setTheater] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const up = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down) }
  }, [])

  const fetchNews = useCallback(async (isRefresh = false) => {
    if (!online) { setError('You appear to be offline.'); return }
    isRefresh ? setRefreshing(true) : setLoading(true)
    setError(null)
    const cat = CATEGORIES.find(c => c.id === activeTab)!
    try {
      const xml = await fetchWithFallback(cat.feeds)
      const items = parseRSS(xml, cat.id, cat.sourceName)
      if (!items.length) throw new Error('No stories found')
      setNews(items)
      setLastUpdated(new Date())
    } catch (e) {
      console.error('[NewsPortal]', e)
      setError("Headlines couldn't load right now. Check your connection or try again.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [activeTab, online])

  useEffect(() => {
    setNews([])
    fetchNews()
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => fetchNews(), 30 * 60 * 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [fetchNews])

  const headlines = news.slice(0, 8).map(n => n.title)
  const activeCat = CATEGORIES.find(c => c.id === activeTab)!

  return (
    <>
      <style>{`
        @keyframes np-shimmer { 0%,100%{opacity:.55} 50%{opacity:1} }
        @keyframes np-pulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.5)} }
        @keyframes np-ticker  { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes np-spin    { to{transform:rotate(360deg)} }
        /* nav: hide scrollbar across engines */
        .np-nav::-webkit-scrollbar { display: none }
        .np-navbtn {
          display:flex; align-items:center; gap:6px;
          padding:0 13px; border:none; background:transparent;
          font-family:'Sora',sans-serif; font-size:10px; font-weight:600;
          letter-spacing:.06em; text-transform:uppercase;
          cursor:pointer; white-space:nowrap; flex-shrink:0;
          transition:color .18s,background .18s;
        }
        .np-navbtn:hover { color:#fff !important; background:rgba(255,255,255,0.04) !important; }
      `}</style>

      <div style={{ fontFamily: "'Sora','DM Sans',sans-serif", background: '#f8f7f4', minHeight: '100vh', color: '#0f0e17' }}>

        {/* ── Masthead ── */}
        <header style={{ position: 'sticky', top: 0, zIndex: 200, background: '#10103a', borderBottom: '3px solid #c0392b' }}>
          <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'stretch', minHeight: 50 }}>

            {/* Brand */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 18px 11px 0', borderRight: '1px solid rgba(255,255,255,.1)', flexShrink: 0 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#e74c3c', animation: 'np-pulse 1.4s ease-in-out infinite', display: 'inline-block' }} />
              <div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px' }}>NewsFront</div>
                <div style={{ fontSize: 7, fontWeight: 600, letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', marginTop: 1 }}>Live · Global</div>
              </div>
            </div>

            {/* Clock */}
            <div style={{ padding: '0 13px', fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,.4)', borderRight: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', fontVariantNumeric: 'tabular-nums', letterSpacing: '.04em', flexShrink: 0 }}>
              <LiveClock />
            </div>

            {/* Online pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0 11px', borderRight: '1px solid rgba(255,255,255,.1)', fontSize: 10, fontWeight: 600, letterSpacing: '.06em', color: online ? '#2ecc71' : '#e74c3c', flexShrink: 0 }}>
              {online ? <Wifi size={12} /> : <WifiOff size={12} />}
              {online ? 'Live' : 'Offline'}
            </div>

            {/* Category nav */}
            <nav className="np-nav" style={{ flex: 1, display: 'flex', alignItems: 'stretch', overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {CATEGORIES.map(cat => {
                const active = activeTab === cat.id
                return (
                  <button
                    key={cat.id}
                    className="np-navbtn"
                    onClick={() => { setActiveTab(cat.id); setTheater(false) }}
                    style={{
                      color: active ? '#fff' : 'rgba(255,255,255,.5)',
                      background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
                      borderBottom: active ? '3px solid #e74c3c' : '3px solid transparent',
                      marginBottom: -3,
                    }}
                  >
                    <cat.icon size={11} style={{ opacity: 0.8, flexShrink: 0 }} />
                    {cat.label}
                  </button>
                )
              })}
            </nav>

            {/* Refresh */}
            <button
              onClick={() => fetchNews(true)} disabled={refreshing}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, margin: 'auto 8px', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)', borderRadius: '50%', color: 'rgba(255,255,255,.7)', cursor: 'pointer', flexShrink: 0 }}
            >
              <RefreshCw size={13} style={{ animation: refreshing ? 'np-spin .9s linear infinite' : 'none' }} />
            </button>
          </div>
        </header>

        {/* ── Page body ── */}
        <div style={{
          maxWidth: 1400, margin: '0 auto', padding: '26px 20px 80px',
          display: 'grid',
          // Theater → full width. Normal → fluid main + fixed 308px sidebar.
          gridTemplateColumns: theater ? '1fr' : 'minmax(0,1fr) 308px',
          gap: 26, alignItems: 'start',
        }}>

          {/* ── Main column ── */}
          <main style={{ minWidth: 0 }}>
            <BreakingTicker headlines={headlines} />

            {/* Theater player + channel strip */}
            <AnimatePresence>
              {theater && (
                <motion.div
                  initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: .28, ease: [.22, 1, .36, 1] }}
                  style={{ marginBottom: 20 }}
                >
                  <LivePlayer channel={channel} theaterMode onEnterTheater={() => setTheater(true)} onExitTheater={() => setTheater(false)} />
                  <div style={{ marginTop: 10 }}>
                    <ChannelGrid channels={CHANNELS} activeChannel={channel} onSelect={setChannel} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Section label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 9, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: '#72727f', marginBottom: 18 }}>
              <activeCat.icon size={11} />
              {activeCat.label}
              <span style={{ flex: 1, height: 1, background: '#e4e3de' }} />
            </div>

            {/* Cards / loading / error */}
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div key="sk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 20 }}>
                  {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
                </motion.div>
              ) : error ? (
                <motion.div key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div style={{ background: '#fff', border: '1px solid #fdd', borderRadius: 20, padding: '52px 24px', textAlign: 'center' }}>
                    <div style={{ fontSize: 36, marginBottom: 14 }}>📡</div>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, marginBottom: 8 }}>Feed Unavailable</div>
                    <p style={{ fontSize: 13, color: '#72727f', marginBottom: 22 }}>{error}</p>
                    <button onClick={() => fetchNews(true)}
                      style={{ padding: '10px 26px', background: '#c0392b', color: '#fff', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                      Try Again
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 20 }}>
                  {news.map((item, i) => <NewsCard key={item.id} item={item} index={i} />)}
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* ── Sidebar (hidden in theater mode) ── */}
          {!theater && (
            <aside style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>

              <LivePlayer channel={channel} theaterMode={false} onEnterTheater={() => setTheater(true)} onExitTheater={() => setTheater(false)} />

              {/* 4-col × 3-row channel switcher */}
              <ChannelGrid channels={CHANNELS} activeChannel={channel} onSelect={setChannel} />

              {/* Status card */}
              <div style={{ background: '#10103a', borderRadius: 20, padding: 20, color: '#fff' }}>
                <div style={{ fontSize: 20, marginBottom: 10, opacity: 0.6 }}>📡</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 14, fontWeight: 700, marginBottom: 7 }}>Live Briefing</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.75 }}>
                  RSS from BBC, GhanaWeb, Citi FM, Joy FM, Al Jazeera, Reuters &amp; more.
                  GES &amp; education news included. 12 freely embeddable live channels.
                  Auto-refreshes every 30 min.
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '13px 0' }} />
                {[
                  ['Status', online ? '● Connected' : '○ Offline'],
                  ['Last sync', lastUpdated ? new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(lastUpdated) : '—'],
                  ['Stories', String(news.length)],
                  ['Categories', String(CATEGORIES.length)],
                  ['Live channels', `${CHANNELS.length} (free embed)`],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
                    <span>{label}</span>
                    <span style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{val}</span>
                  </div>
                ))}
              </div>
            </aside>
          )}
        </div>
      </div>
    </>
  )
}