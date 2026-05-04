// src/components/ui/NewsTicker.tsx
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { Cloud, Sun, CloudRain, Wind, Zap, AlertCircle } from 'lucide-react'

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
      // 1. Fetch GES News (Ghana)
      const gesRss = encodeURIComponent('https://news.google.com/rss/search?q=Ghana+Education+Service+news&hl=en-GH&gl=GH&ceid=GH:en')
      // 2. Fetch Global News (World)
      const globalRss = encodeURIComponent('https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en')
      
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
      const res = await fetch('https://wttr.in/Accra?format=j1')
      const data = await res.json()
      const current = data.current_condition[0]
      setWeather({
        temp: current.temp_C,
        condition: current.weatherDesc[0].value,
        icon: <Sun size={14} />
      })
    } catch {
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

  const tickerItems = [
    `<span style="color: #fbbf24">🌡️ ACCRA WEATHER: ${weather.temp}°C · ${weather.condition}</span>`,
    ...gesNews.map(n => `<span style="color: #fff">🇬🇭 GES NEWS: ${n}</span>`),
    ...globalNews.map(n => `<span style="color: #a5b4fc">🌍 WORLD: ${n}</span>`),
    ...announcements.map(a => `<span style="color: #60a5fa">📢 SCHOOL: ${a}</span>`),
    `<span style="color: #4ade80">🚀 TIP: Punctuality is key for the BECE examinations.</span>`
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
      <div style={{
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
        whiteSpace: 'nowrap'
      }}>
        <Zap size={12} fill="white" style={{ marginRight: '6px' }} />
        Live Feed
      </div>

      {/* Scrolling Container */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center' }}>
        <style>{`
          @keyframes ticker {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .ticker-content {
            display: inline-block;
            white-space: nowrap;
            padding-right: 50px;
            animation: ticker 80s linear infinite;
            font-size: 12px;
            font-weight: 600;
          }
          .ticker-content:hover { animation-play-state: paused; }
        `}</style>
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
        color: '#9ca3af',
        zIndex: 10,
        borderLeft: '1px solid rgba(255,255,255,0.1)',
        whiteSpace: 'nowrap'
      }}>
        {new Date().toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  )
}
