import { useStuckLoadingReload } from '../../hooks/useStuckLoadingReload'
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

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Newspaper, Globe, Cpu, Trophy, Activity,
  RefreshCw, Clock, Minimize2, Maximize2,
  FlaskConical, ExternalLink, Wifi, WifiOff, GraduationCap,
  Moon, Sun, Bookmark, BookmarkCheck, Search, Share2, X,
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
  // ── GES / Education FIRST (Ghana Education Service priority) ──
  {
    id: 'ges',
    label: 'GES / Education',
    icon: GraduationCap,
    feeds: [
      'https://www.myjoyonline.com/category/news/education/feed/',
      'https://www.modernghana.com/rssfeed/?cat_id=14&type=1',
      'https://news.google.com/rss/search?q=Ghana+Education+Service+news+when:7d&hl=en-GH&gl=GH&ceid=GH:en',
    ],
    sourceName: 'Ghana Education',
  },
  // ── Ghana National News SECOND ──
  {
    id: 'ghana',
    label: 'Ghana',
    icon: Globe,
    feeds: [
      'https://www.myjoyonline.com/category/news/ghana/feed/',
      'https://citinewsroom.com/feed/',
      'https://www.ghanaweb.com/GhanaHomePage/rss/feed.php?cat=news',
      'https://www.modernghana.com/rssfeed/?cat_id=1&type=1',
    ],
    sourceName: 'Ghana News',
  },
  // ── Global THIRD ──
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
  // ── Then the rest ──
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
//    If using a channel ID (starts with UC), it will automatically play their live stream.
//    If a channel ID doesn't work, you can use a direct video ID (starts with a random string).
//
//  EXCLUDED (embed disabled / geo-restricted / paywalled):
//    BBC News Live, CNN International, NBC News, Bloomberg TV
// ═══════════════════════════════════════════════════════════════

const CHANNELS: Channel[] = [
  // ── 🇬🇭 Ghana Channels (first) ──
  { id: 'gtv',     name: 'GTV Ghana',          short: 'GTV',  bgColor: '#006b3c', vid: 'UCv9H3dC62m0oT8J5R9oG_5A' },
  { id: 'joy',     name: 'JoyNews Ghana',       short: 'JOY',  bgColor: '#c0392b', vid: 'UChd1DEecCRlxaa0-hvPACCw' },
  // ── 🌍 Africa / International ──
  { id: 'alj',     name: 'Al Jazeera English',  short: 'AJE',  bgColor: '#9e6d14', vid: 'UCNye-wNBqNL5ZzHSJj3l8Bg' },
  { id: 'dw',      name: 'DW News',             short: 'DW',   bgColor: '#a02820', vid: 'UCknLrEdhRCp3d-Vp4_H5sIQ' },
  { id: 'f24',     name: 'France 24 English',   short: 'F24',  bgColor: '#003d80', vid: 'UCCCPCcN9EjyEiS3g4M63tDA' },
  { id: 'wion',    name: 'WION',                short: 'WION', bgColor: '#141438', vid: 'UC_gUM8rL-Lrg6O3adPW9K1g' },
  { id: 'trt',     name: 'TRT World',           short: 'TRT',  bgColor: '#8c2218', vid: 'UC7fWeaHhqgM4Ry-RMpM2YYw' },
  { id: 'cgtn',    name: 'CGTN',                short: 'CGTN', bgColor: '#125030', vid: 'UCp1Fp-sV9tYJ7yX4u_m23zQ' },
  { id: 'euro',    name: 'Euronews',            short: 'EURO', bgColor: '#002b80', vid: 'UCSrZ3UV4jOidv8ppoVuvW9Q' },
  { id: 'sky',     name: 'Sky News Australia',  short: 'SKY',  bgColor: '#003399', vid: 'UC384K0xP82J1W0S6O7gL8Lw' },
  { id: 'nhk',     name: 'NHK World Japan',     short: 'NHK',  bgColor: '#1a5276', vid: 'UC1b-b46h175dDk9e3_A9_4Q' },
  { id: 'arirang', name: 'Arirang TV',           short: 'ARG',  bgColor: '#1a3a8a', vid: 'UC1H9-mN_5qfQ5cQ4yq8k9nQ' },
  { id: 'cna',     name: 'CNA International',   short: 'CNA',  bgColor: '#c00000', vid: 'UC9Kq9DMTD7aV_K6G3u6H9Yw' },
  { id: 'reuters', name: 'Reuters TV',           short: 'REU',  bgColor: '#b34700', vid: 'UChTnXJhiPjYJ6Y5l92qO_0A' },
  { id: 'ap',      name: 'AP News',              short: 'AP',   bgColor: '#222222', vid: 'UC52X5xPrR_QZtPZzF211_0g' },
  { id: 'i24',     name: 'i24 News English',     short: 'i24',  bgColor: '#004f77', vid: 'UC1c6p3Vn39TjP9zX04xN9Jg' },
]

// ═══════════════════════════════════════════════════════════════
//  CORS PROXY FALLBACK CHAIN
// ═══════════════════════════════════════════════════════════════

const CORS_PROXIES: Array<(url: string) => string> = [
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
]

// ═══════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════

// Picsum seeds per category — deterministic so cards don't flicker on re-render
const CAT_SEEDS: Record<string, number> = {
  top: 10, ghana: 20, ges: 30, global: 40,
  tech: 50, world: 60, sports: 70, health: 80, sci: 90,
}

const fallbackThumb = (catId: string, idx: number) =>
  `https://picsum.photos/seed/${CAT_SEEDS[catId] ?? 0}${idx % 50}/800/500`

function decodeEntities(raw: string) {
  if (!raw) return ''
  return raw
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

// ── Helper to scrape the actual story page for an image (og:image) ──
async function fetchOGImage(url: string): Promise<string | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 6000)
  
  for (const makeProxy of CORS_PROXIES) {
    try {
      const res = await fetch(makeProxy(url), { signal: controller.signal })
      if (!res.ok) continue
      const html = await res.text()
      // Enhanced regex to catch various meta formats
      const m = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/) ||
                html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/) ||
                html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/) ||
                html.match(/<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/)
      if (m && m[1] && m[1].startsWith('http')) {
        clearTimeout(timeout)
        return m[1]
      }
    } catch { continue }
  }
  clearTimeout(timeout)
  return null
}

function parseRSS(xml: string, catId: string, sourceName: string): NewsItem[] {
  const itemBlocks = xml.match(/<item[\s>]([\s\S]*?)<\/item>/g) ?? []
  return itemBlocks.slice(0, 12).map((raw, i): NewsItem => {
    // ── tag text extractor ──
    // Order: strip CDATA wrapper → decode HTML entities → strip HTML tags
    const get = (tag: string) => {
      const m = raw.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))
      if (!m) return ''
      let s = m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
      s = decodeEntities(s)
      s = s.replace(/<[^>]+>/g, ' ')
      s = decodeEntities(s)
      return s.replace(/\s+/g, ' ').trim()
    }
    // ── raw CDATA (keep HTML intact for image extraction) ──
    const rawCDATA = (tag: string) => {
      const m = raw.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`)) ||
                raw.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))
      if (!m) return ''
      let s = m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
      return decodeEntities(s)
    }

    const fullTitle = get('title') || '(No title)'
    const [rawTitle, rawSrc] = fullTitle.split(' - ')
    const title = rawTitle?.trim() || fullTitle

    // ── Real article URL: prefer <source url="..."> attr, then <link>, then <guid> ──
    const srcAttrM = raw.match(/<source[^>]+url="([^"]+)"/)
    const googleLink = (get('link') || get('guid') || '').trim()
    const link = srcAttrM ? srcAttrM[1].trim() : googleLink

    // Source name: prefer <source> tag text, then split from title
    const srcTagText = get('source')
    const source = srcTagText || rawSrc?.trim() || sourceName

    const pubDate = get('pubDate') || get('dc:date') || new Date().toISOString()

    // ── Description: clean up text and avoid bare URLs ──
    const descHtml = rawCDATA('description')
    let descText = descHtml
      ? decodeEntities(descHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
      : get('description') || get('summary') || ''
    
    // If description is just a URL or empty, use title
    if (!descText || descText.startsWith('http') || descText.length < 10) {
      descText = title
    }
    
    const description = descText.slice(0, 200).trim() + (descText.length > 200 ? '…' : '')

    // ── Thumbnail: check multiple sources in priority order ──
    let thumbnail = ''
    const m1 = raw.match(/<media:thumbnail[^>]+url="([^"]+)"/)
    const m2 = raw.match(/<enclosure[^>]+url="([^"]+)"/)
    const m3 = raw.match(/<media:content[^>]+url="([^"]+)"/)
    // img inside description HTML
    const m4 = descHtml ? descHtml.match(/<img[^>]+src="([^"]+)"/) : raw.match(/<img[^>]+src="([^"]+)"/)
    if (m1) thumbnail = m1[1]
    else if (m2) thumbnail = m2[1]
    else if (m3) thumbnail = m3[1]
    else if (m4) thumbnail = m4[1]
    
    // Filter tracking pixels and small icons
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
    <div style={{ background: 'var(--bg-card)', border: '1px solid #e4e3de', borderRadius: 20, overflow: 'hidden', animation: 'np-shimmer 1.8s ease-in-out infinite' }}>
      <div style={{ height: 176, background: '#f1f0ec' }} />
      <div style={{ padding: 18 }}>
        {[85, 65, 75, 55, 40].map((w, i) => (
          <div key={i} style={{ height: 11, width: `${w}%`, background: '#f1f0ec', borderRadius: 4, marginBottom: i === 3 ? 16 : 9 }} />
        ))}
      </div>
    </div>
  )
}

function NewsCard({ item, index, cardBg, cardBorder, textPrimary, textMuted, bookmarked, onBookmark, onShare }: {
  item: NewsItem; index: number
  cardBg: string; cardBorder: string; textPrimary: string; textMuted: string
  bookmarked: boolean; onBookmark: (item: NewsItem) => void; onShare: (item: NewsItem) => void
}) {
  const [imgErr, setImgErr] = useState(false)
  return (
    <motion.article
      initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, delay: index * 0.055, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -5, boxShadow: '0 20px 48px rgba(0,0,0,0.15)' }}
      layout
      style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'default', willChange: 'transform', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
    >
      <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
        <div style={{ height: 176, overflow: 'hidden', position: 'relative', background: '#1a1a2e', flexShrink: 0 }}>
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
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 700, lineHeight: 1.42, color: textPrimary, marginBottom: 9, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {item.title}
          </h3>
        </a>
        <p style={{ fontSize: 12, color: textMuted, lineHeight: 1.7, flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {item.description}
        </p>
        <footer style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 13, paddingTop: 11, borderTop: `1px solid ${cardBorder}` }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: textMuted }}>
            <Clock size={11} />{formatDate(item.pubDate)}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => onBookmark(item)} title={bookmarked ? 'Remove bookmark' : 'Bookmark'}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: bookmarked ? '#f59e0b' : textMuted, display: 'flex' }}>
              {bookmarked ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
            </button>
            <button onClick={() => onShare(item)} title="Share"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: textMuted, display: 'flex' }}>
              <Share2 size={13} />
            </button>
            <a href={item.link} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#c0392b', textDecoration: 'none' }}>
              Read <ExternalLink size={11} />
            </a>
          </div>
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
        <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--bg-card)', animation: 'np-pulse 1.2s ease-in-out infinite' }} />
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
  const isChannel = channel.vid.startsWith('UC')
  const src = isChannel
    ? `https://www.youtube.com/embed/live_stream?channel=${channel.vid}&autoplay=1&mute=${theaterMode ? 0 : 1}&rel=0&modestbranding=1&playsinline=1`
    : `https://www.youtube.com/embed/${channel.vid}?autoplay=1&mute=${theaterMode ? 0 : 1}&rel=0&modestbranding=1&playsinline=1`

  return (
    <div style={{ background: '#1e1e5c', borderRadius: theaterMode ? 12 : 20, overflow: 'hidden', boxShadow: '0 16px 48px rgba(16,16,58,0.3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 8px', borderRadius: 4, background: '#c0392b', fontSize: 9, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: '#fff', flexShrink: 0 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--bg-card)', animation: 'np-pulse 1.4s ease-in-out infinite', display: 'inline-block' }} />
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
    <div style={{ background: '#1e1e5c', borderRadius: 16, padding: 10, display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 5 }}>
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
  const [activeTab, setActiveTab] = useState('ges')
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  useStuckLoadingReload(loading)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [online, setOnline] = useState(navigator.onLine)
  const [channel, setChannel] = useState<Channel>(CHANNELS[0])
  const [theater, setTheater] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // ── New features ──
  const [dark, setDark] = useState(() => localStorage.getItem('np-dark') === '1')
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [bookmarks, setBookmarks] = useState<NewsItem[]>(() => {
    try { return JSON.parse(localStorage.getItem('np-bookmarks') || '[]') } catch { return [] }
  })
  const [showBookmarks, setShowBookmarks] = useState(false)

  useEffect(() => { localStorage.setItem('np-dark', dark ? '1' : '0') }, [dark])
  useEffect(() => { localStorage.setItem('np-bookmarks', JSON.stringify(bookmarks)) }, [bookmarks])

  const toggleBookmark = useCallback((item: NewsItem) => {
    setBookmarks(prev =>
      prev.some(b => b.id === item.id || b.link === item.link)
        ? prev.filter(b => b.link !== item.link)
        : [item, ...prev]
    )
  }, [])

  const isBookmarked = useCallback((item: NewsItem) =>
    bookmarks.some(b => b.link === item.link), [bookmarks])

  const shareArticle = useCallback((item: NewsItem) => {
    if (navigator.share) {
      navigator.share({ title: item.title, url: item.link }).catch(() => {})
    } else {
      navigator.clipboard.writeText(item.link).then(() => alert('Link copied!'))
    }
  }, [])

  const filteredNews = useMemo(() =>
    search.trim()
      ? news.filter(n => n.title.toLowerCase().includes(search.toLowerCase()) ||
          n.description.toLowerCase().includes(search.toLowerCase()))
      : news
  , [news, search])

  // Theme vars
  const bg = dark ? '#0d0d1a' : '#f8f7f4'
  const cardBg = dark ? '#16162a' : '#fff'
  const cardBorder = dark ? '#2a2a48' : '#e4e3de'
  const textPrimary = dark ? '#e8e6f0' : '#0f0e17'
  const textMuted = dark ? '#7a789a' : '#72727f'

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
      
      // ── "Image Upgrade" pass: try to fetch OG images for stories with fallbacks ──
      // We do this in the background after initial render for speed
      items.forEach(async (item, idx) => {
        if (!item.thumbnail.includes('picsum.photos')) return // Already has a real image
        const ogImg = await fetchOGImage(item.link)
        if (ogImg) {
          setNews(current => current.map(n => n.link === item.link ? { ...n, thumbnail: ogImg } : n))
        }
      })
      
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
        .np-nav::-webkit-scrollbar { display: none }
        .np-navbtn {
          display:flex; align-items:center; gap:5px;
          padding:6px 11px; border:none; border-radius:20px;
          font-family:'DM Sans',sans-serif; font-size:11px; font-weight:600;
          cursor:pointer; white-space:nowrap; flex-shrink:0;
          transition:all .18s;
        }
        .np-layout {
          display: grid; gap: 22px; align-items: start;
          grid-template-columns: minmax(0,1fr) 296px;
        }
        .np-layout.theater { grid-template-columns: 1fr; }
        @media (max-width: 1023px) { .np-layout { grid-template-columns: 1fr !important; } }
      `}</style>

      <div style={{ fontFamily: "'DM Sans',sans-serif", color: textPrimary, transition: 'color .25s' }}>

        {/* ── Integrated control bar (sits inside AppLayout, under app header) ── */}
        <div style={{ background: dark ? '#16162a' : '#10103a', borderRadius: 14, marginBottom: 16, overflow: 'hidden' }}>
          {/* Top row: online pill + category tabs + controls */}
          <div style={{ display: 'flex', alignItems: 'stretch', minHeight: 44, padding: '0 8px' }}>

            {/* Online indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0 10px', fontSize: 10, fontWeight: 700, color: online ? '#2ecc71' : '#e74c3c', flexShrink: 0, borderRight: '1px solid rgba(255,255,255,.08)' }}>
              {online ? <Wifi size={11} /> : <WifiOff size={11} />}
              {online ? 'Live' : 'Offline'}
            </div>

            {/* Category tabs */}
            <nav className="np-nav" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2, overflowX: 'auto', scrollbarWidth: 'none', padding: '5px 6px' }}>
              {CATEGORIES.map(cat => {
                const active = activeTab === cat.id
                return (
                  <button key={cat.id} className="np-navbtn"
                    onClick={() => { setActiveTab(cat.id); setTheater(false) }}
                    style={{
                      background: active ? '#c0392b' : 'rgba(255,255,255,0.07)',
                      color: active ? '#fff' : 'rgba(255,255,255,.55)',
                    }}>
                    <cat.icon size={10} style={{ flexShrink: 0 }} />
                    {cat.label}
                  </button>
                )
              })}
            </nav>

            {/* Action buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '0 6px', flexShrink: 0, borderLeft: '1px solid rgba(255,255,255,.08)' }}>
              {[
                { icon: showSearch ? X : Search, active: showSearch, title: 'Search', action: () => { setShowSearch(s => !s); setShowBookmarks(false) } },
                { icon: Bookmark, active: showBookmarks, title: `Bookmarks (${bookmarks.length})`, action: () => { setShowBookmarks(s => !s); setShowSearch(false) }, badge: bookmarks.length },
                { icon: RefreshCw, active: false, title: 'Refresh', action: () => fetchNews(true), spin: refreshing },
                { icon: dark ? Sun : Moon, active: false, title: 'Toggle dark', action: () => setDark(d => !d) },
              ].map(({ icon: Icon, active, title, action, badge, spin }) => (
                <button key={title} onClick={action} title={title}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, background: active ? '#c0392b' : 'rgba(255,255,255,.08)', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', position: 'relative', flexShrink: 0 }}>
                  <Icon size={13} style={{ animation: spin ? 'np-spin .9s linear infinite' : 'none' }} />
                  {badge! > 0 && <span style={{ position: 'absolute', top: -2, right: -2, background: '#e74c3c', color: '#fff', fontSize: 7, fontWeight: 800, borderRadius: '50%', width: 12, height: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{badge}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <AnimatePresence>
            {showSearch && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 40, opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.2)' }}>
                <div style={{ padding: '0 16px', height: '100%', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Search size={13} color="rgba(255,255,255,0.4)" />
                  <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search headlines…"
                    style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 13, fontFamily: 'inherit' }} />
                  {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex' }}><X size={13} /></button>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Page body ── */}
        <div className={`np-layout ${theater ? 'theater' : ''}`}>

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
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 9, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: textMuted, marginBottom: 18 }}>
              <activeCat.icon size={11} />
              {activeCat.label}
              {search && <span style={{ color: '#c0392b', fontWeight: 600 }}>· "{search}" — {filteredNews.length} result{filteredNews.length !== 1 ? 's' : ''}</span>}
              <span style={{ flex: 1, height: 1, background: cardBorder }} />
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
                  <div style={{ background: cardBg, border: `1px solid #fdd`, borderRadius: 20, padding: '52px 24px', textAlign: 'center' }}>
                    <div style={{ fontSize: 36, marginBottom: 14 }}>📡</div>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, marginBottom: 8, color: textPrimary }}>Feed Unavailable</div>
                    <p style={{ fontSize: 13, color: textMuted, marginBottom: 22 }}>{error}</p>
                    <button onClick={() => fetchNews(true)}
                      style={{ padding: '10px 26px', background: '#c0392b', color: '#fff', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                      Try Again
                    </button>
                  </div>
                </motion.div>
              ) : filteredNews.length === 0 && search ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div style={{ textAlign: 'center', padding: '60px 24px', color: textMuted }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                    <p>No results for <strong>"{search}"</strong></p>
                  </div>
                </motion.div>
              ) : (
                <motion.div key={activeTab + search} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 20 }}>
                  {filteredNews.map((item, i) => (
                    <NewsCard key={item.id} item={item} index={i}
                      cardBg={cardBg} cardBorder={cardBorder} textPrimary={textPrimary} textMuted={textMuted}
                      bookmarked={isBookmarked(item)} onBookmark={toggleBookmark} onShare={shareArticle} />
                  ))}
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

              {/* Bookmarks panel */}
              <AnimatePresence>
                {showBookmarks && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 20, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: textPrimary, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <BookmarkCheck size={13} color="#f59e0b" /> Saved ({bookmarks.length})
                      </div>
                      {bookmarks.length > 0 && <button onClick={() => setBookmarks([])} style={{ background: 'none', border: 'none', fontSize: 10, color: '#c0392b', cursor: 'pointer', fontWeight: 600 }}>Clear all</button>}
                    </div>
                    {bookmarks.length === 0
                      ? <p style={{ fontSize: 11, color: textMuted, textAlign: 'center', padding: '16px 0' }}>No bookmarks yet</p>
                      : bookmarks.map(b => (
                        <a key={b.link} href={b.link} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'block', fontSize: 12, fontWeight: 600, color: textPrimary, textDecoration: 'none', paddingBottom: 10, marginBottom: 10, borderBottom: `1px solid ${cardBorder}`, lineHeight: 1.4 }}>
                          {b.title.slice(0, 80)}{b.title.length > 80 ? '…' : ''}
                        </a>
                      ))
                    }
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Status card */}
              <div style={{ background: '#10103a', borderRadius: 20, padding: 20, color: '#fff' }}>
                <div style={{ fontSize: 20, marginBottom: 10, opacity: 0.6 }}>📡</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 14, fontWeight: 700, marginBottom: 7 }}>Live Briefing</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.75 }}>
                  RSS from GhanaWeb, Citi FM, Joy FM, Graphic, BBC, Al Jazeera &amp; more.
                  GES &amp; Education news leads. 16 freely embeddable live channels including
                  GTV Ghana, JoyNews, Arirang TV &amp; CNA. Auto-refreshes every 30 min.
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '13px 0' }} />
                {[
                  ['Status', online ? '● Connected' : '○ Offline'],
                  ['Last sync', lastUpdated ? new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(lastUpdated) : '—'],
                  ['Stories', String(news.length)],
                  ['Bookmarks', String(bookmarks.length)],
                  ['Live channels', `${CHANNELS.length} (free · YouTube)`],
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