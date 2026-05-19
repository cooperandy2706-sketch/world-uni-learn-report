// src/components/ui/NewsTicker.tsx
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { Cloud, Sun, CloudRain, Wind, Tv, AlertCircle } from 'lucide-react'

export const NewsTicker: React.FC = () => {
  const { user } = useAuth()
  const [announcements, setAnnouncements] = useState<string[]>([])
  const [gesNews, setGesNews] = useState<string[]>([])
  const [globalNews, setGlobalNews] = useState<string[]>([])
  const [weather, setWeather] = useState({ temp: '--', condition: 'Loading...', icon: <Sun size={14} /> })

  useEffect(() => {
    if (user?.school_id) {
      loadAnnouncements()
      
      // Realtime subscription for instant updates
      const channel = supabase
        .channel('ticker-announcements')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'announcements', 
          filter: `school_id=eq.${user.school_id}` 
        }, () => {
          loadAnnouncements()
        })
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [user?.school_id])

  useEffect(() => {
    fetchWeather()
    fetchNews()

    // Refresh news/weather every 30 minutes
    const interval = setInterval(() => {
      fetchWeather()
      fetchNews()
    }, 30 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  async function fetchNews() {
    try {
      // Use clean URLs without timestamps so rss2json API doesn't hit its unique feed limit
      const gesRss = encodeURIComponent(`https://news.google.com/rss/search?q=Ghana+Education+Service+news&hl=en-GH&gl=GH&ceid=GH:en`)
      const globalRss = encodeURIComponent(`https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en`)
      
      const [gesRes, globalRes] = await Promise.all([
        fetch(`https://api.rss2json.com/v1/api.json?rss_url=${gesRss}`),
        fetch(`https://api.rss2json.com/v1/api.json?rss_url=${globalRss}`)
      ])

      const [gesData, globalData] = await Promise.all([gesRes.json(), globalRes.json()])

      if (gesData.status === 'ok' && gesData.items) {
        setGesNews(gesData.items.slice(0, 4).map((i: any) => i.title.split(' - ')[0]))
      }
      if (globalData.status === 'ok' && globalData.items) {
        setGlobalNews(globalData.items.slice(0, 5).map((i: any) => i.title.split(' - ')[0]))
      }
    } catch (err) {
      console.error('Failed to fetch news:', err)
    }
  }

  async function fetchWeather() {
    try {
      const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=5.6037&longitude=-0.1870&current=temperature_2m,weather_code')
      if (!res.ok) throw new Error('Weather API failed')
      const data = await res.json()
      
      const temp = Math.round(data.current.temperature_2m)
      const code = data.current.weather_code
      let condition = 'Clear'
      if (code > 0 && code <= 3) condition = 'Cloudy'
      else if (code > 3 && code <= 48) condition = 'Fog'
      else if (code > 48 && code <= 67) condition = 'Rain'
      else if (code > 67 && code <= 82) condition = 'Showers'
      else if (code > 82) condition = 'Thunderstorm'

      setWeather({
        temp: temp.toString(),
        condition: condition,
        icon: <Sun size={14} />
      })
    } catch {
      // Fallback if weather API fails
      setWeather({ temp: '28', condition: 'Sunny', icon: <Sun size={14} /> })
    }
  }

  async function loadAnnouncements() {
    try {
      const { data } = await supabase
        .from('announcements')
        .select('title')
        .eq('school_id', user!.school_id)
        .order('created_at', { ascending: false })
        .limit(3)
      
      if (data && data.length > 0) {
        setAnnouncements(data.map(a => a.title))
      }
    } catch { }
  }

  const tips = [
    "🚀 TIP: Punctuality is key for the BECE examinations.",
    "💡 TIP: Use the Lesson Tracker to keep your classes on schedule.",
    "📊 TIP: Admins can monitor school-wide performance in Global Analytics.",
    "📱 TIP: Enable push notifications for instant school alerts.",
    "✨ TIP: Use AI to generate professional lesson plans in seconds."
  ]
  const randomTip = tips[Math.floor((new Date().getMinutes() / 10) % tips.length)]

  const tickerItems = [
    `<span style="color: #fbbf24">🌡️ ACCRA WEATHER: ${weather.temp}°C · ${weather.condition}</span>`,
    ...gesNews.map(n => `<span style="color: #fff">🇬🇭 GES NEWS: ${n}</span>`),
    ...globalNews.map(n => `<span style="color: #a5b4fc">🌍 WORLD: ${n}</span>`),
    ...announcements.map(a => `<span style="color: #60a5fa">📢 SCHOOL: ${a}</span>`),
    `<span style="color: #4ade80">${randomTip}</span>`
  ]

  const fullTickerText = tickerItems.join('        |        ')

  return (
    <div style={{
      width: '100%',
      height: '32px',
      background: '#111827',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      overflow: 'hidden',
      position: 'relative',
      zIndex: 1001,
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      fontFamily: '"DM Sans", sans-serif',
    }}>
      {/* "Breaking" Label */}
      <Link 
        to={`/${user?.role || 'admin'}/news`}
        style={{
          background: '#ef4444',
          padding: '0 12px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          fontWeight: 800,
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          zIndex: 10,
          boxShadow: '4px 0 10px rgba(0,0,0,0.3)',
          whiteSpace: 'nowrap',
          color: '#fff',
          textDecoration: 'none',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#dc2626'}
        onMouseLeave={e => e.currentTarget.style.background = '#ef4444'}
      >
        <Tv size={12} fill="white" style={{ marginRight: '6px' }} />
        Live News
      </Link>

      {/* Scrolling Container */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center' }}>
                <div className="ticker-content" dangerouslySetInnerHTML={{ __html: fullTickerText + '        |        ' + fullTickerText }} />
      </div>

      {/* Time/Status Label */}
      <div style={{
        background: '#111827',
        padding: '0 15px',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        fontSize: '11px',
        fontWeight: 700,
        color: 'var(--text-subtle)',
        zIndex: 10,
        borderLeft: '1px solid rgba(255,255,255,0.1)',
        whiteSpace: 'nowrap'
      }}>
        {new Date().toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  )
}
