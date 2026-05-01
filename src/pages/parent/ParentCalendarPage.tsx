// src/pages/parent/ParentCalendarPage.tsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  isWithinInterval,
  parseISO
} from 'date-fns'
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Bookmark,
  PartyPopper
} from 'lucide-react'

interface CalendarEvent {
  id: string
  name: string
  start_date: string
  end_date: string
  type: 'term' | 'holiday' | 'other'
  color: string
}

export default function ParentCalendarPage() {
  const { user } = useAuth()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    loadEvents()
  }, [user?.school_id, currentMonth])

  async function loadEvents() {
    if (!user?.school_id) return
    setLoading(true)
    try {
      const year = currentMonth.getFullYear()
      const [termsRes, holidaysRes] = await Promise.all([
        supabase.from('terms').select('id, name, start_date, end_date').eq('school_id', user.school_id),
        supabase.from('holidays').select('*').eq('school_id', user.school_id)
      ])

      let ghApiHolidays = []
      let worldApiHolidays = []
      
      try {
        const ghRes = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/GH`)
        if (ghRes.ok) ghApiHolidays = await ghRes.json()
        const worldRes = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/US`)
        if (worldRes.ok) worldApiHolidays = await worldRes.json()
      } catch (apiErr) {
        console.error('Holiday API Error:', apiErr)
      }

      const mappedEvents: CalendarEvent[] = []

      termsRes.data?.forEach(t => {
        mappedEvents.push({ id: t.id + '_start', name: `🟢 Term Starts: ${t.name}`, start_date: t.start_date, end_date: t.start_date, type: 'term', color: '#059669' })
        mappedEvents.push({ id: t.id + '_end', name: `🔴 Term Ends: ${t.name}`, start_date: t.end_date, end_date: t.end_date, type: 'term', color: '#dc2626' })
      })

      ghApiHolidays.forEach((h: any, idx: number) => {
        mappedEvents.push({ id: 'gh_api_' + idx, name: `🇬🇭 ${h.localName || h.name}`, start_date: h.date, end_date: h.date, type: 'holiday', color: '#f59e0b' })
      })

      worldApiHolidays.forEach((h: any, idx: number) => {
        if (!ghApiHolidays.some((gh: any) => gh.date === h.date)) {
          mappedEvents.push({ id: 'world_api_' + idx, name: `🌍 ${h.name}`, start_date: h.date, end_date: h.date, type: 'holiday', color: '#3b82f6' })
        }
      })

      holidaysRes.data?.forEach(h => {
        mappedEvents.push({ id: h.id, name: h.name, start_date: h.start_date, end_date: h.end_date, type: 'holiday', color: '#8b5cf6' })
      })

      setEvents(mappedEvents)
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderHeader = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
      <div>
        <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>School Calendar</h1>
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Track holidays and school milestones.</p>
      </div>
      <div style={{ display: 'flex', background: '#fff', borderRadius: 12, padding: 4, border: '1.5px solid #f1f5f9' }}>
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} style={{ padding: 8, border: 'none', background: 'none', cursor: 'pointer', color: '#4b5563' }}><ChevronLeft size={18} /></button>
        <div style={{ padding: '0 12px', display: 'flex', alignItems: 'center', fontSize: 14, fontWeight: 700, color: '#111827', minWidth: 120, justifyContent: 'center' }}>
          {format(currentMonth, 'MMM yyyy')}
        </div>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} style={{ padding: 8, border: 'none', background: 'none', cursor: 'pointer', color: '#4b5563' }}><ChevronRight size={18} /></button>
      </div>
    </div>
  )

  const renderDays = () => {
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
        {days.map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', padding: '8px 0' }}>{d}</div>
        ))}
      </div>
    )
  }

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)
    const rows = []
    let days = []
    let day = startDate

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day
        const isCurrentMonth = isSameMonth(day, monthStart)
        const isToday = isSameDay(day, new Date())
        const dayEvents = events.filter(e => isWithinInterval(cloneDay, { start: parseISO(e.start_date), end: parseISO(e.end_date) }))

        days.push(
          <div key={day.toString()} style={{ height: 80, border: '0.5px solid #f1f5f9', background: isCurrentMonth ? '#fff' : '#f9fafb', position: 'relative', padding: 4 }}>
            <span style={{ 
              fontSize: 12, fontWeight: 700, 
              color: isCurrentMonth ? (isToday ? '#7c3aed' : '#374151') : '#d1d5db',
              background: isToday ? '#f5f3ff' : 'transparent',
              width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', marginBottom: 2
            }}>
              {format(day, "d")}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {dayEvents.map(e => (
                <div key={e.id} style={{ height: 4, borderRadius: 2, background: e.color }} title={e.name} />
              ))}
            </div>
          </div>
        )
        day = addDays(day, 1)
      }
      rows.push(<div key={day.toString()} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>{days}</div>)
      days = []
    }
    return <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1.5px solid #f1f5f9' }}>{rows}</div>
  }

  return (
    <div style={{ fontFamily: '"DM Sans", sans-serif', paddingBottom: 40, animation: '_fadeIn .4s ease', maxWidth: 1000, margin: '0 auto' }}>
      <style>{`
        @keyframes _fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .calendar-grid { display: grid; grid-template-columns: 1fr 300px; gap: 24; }
        @media (max-width: 900px) { .calendar-grid { grid-template-columns: 1fr; } }
      `}</style>

      <div className="calendar-grid">
        <div style={{ minWidth: 0 }}>
          {renderHeader()}
          {renderDays()}
          {renderCells()}
          
          {/* Legend: Mobile Friendly */}
          <div style={{ marginTop: 20, display: 'flex', flexWrap: 'wrap', gap: 16, padding: '0 8px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#4b5563' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#059669' }} /> Term Dates
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#4b5563' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} /> Holidays
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#4b5563' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#8b5cf6' }} /> Events
             </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)', borderRadius: 24, padding: 24, color: '#fff', textAlign: 'center' }}>
            <Clock size={20} style={{ color: '#a5b4fc', marginBottom: 8, opacity: 0.8 }} />
            <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'monospace' }}>{format(time, 'HH:mm:ss')}</div>
            <div style={{ fontSize: 12, color: '#a5b4fc', marginTop: 4 }}>{format(time, 'EEEE, do MMMM')}</div>
          </div>

          <div style={{ background: '#fff', borderRadius: 24, padding: 20, border: '1.5px solid #f1f5f9' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <PartyPopper size={16} color="#f59e0b" /> Upcoming
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {events
                .filter(e => parseISO(e.start_date) >= new Date())
                .sort((a, b) => parseISO(a.start_date).getTime() - parseISO(b.start_date).getTime())
                .slice(0, 5)
                .map(e => (
                  <div key={e.id} style={{ display: 'flex', gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: e.color + '10', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: e.color }}>{format(parseISO(e.start_date), 'dd')}</span>
                      <span style={{ fontSize: 8, fontWeight: 700, color: e.color, textTransform: 'uppercase' }}>{format(parseISO(e.start_date), 'MMM')}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>{format(parseISO(e.start_date), 'EEEE')}</div>
                    </div>
                  </div>
                ))}
              {events.filter(e => parseISO(e.start_date) >= new Date()).length === 0 && <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>No upcoming events.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
