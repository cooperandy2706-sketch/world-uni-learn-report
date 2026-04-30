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
  eachDayOfInterval,
  isWithinInterval,
  parseISO
} from 'date-fns'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  X,
  AlertCircle,
  PartyPopper,
  Bookmark
} from 'lucide-react'
import toast from 'react-hot-toast'

interface CalendarEvent {
  id: string
  name: string
  start_date: string
  end_date: string
  type: 'term' | 'holiday' | 'other'
  color: string
}

export default function CalendarPage() {
  const { user } = useAuth()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [time, setTime] = useState(new Date())
  
  // Modal State
  const [showAdd, setShowAdd] = useState(false)
  const [newEvent, setNewEvent] = useState({ name: '', start_date: '', end_date: '', type: 'public' })
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    loadEvents()
  }, [user?.school_id])

  async function loadEvents() {
    if (!user?.school_id) return
    setLoading(true)
    try {
      const year = currentMonth.getFullYear()
      const [termsRes, holidaysRes] = await Promise.all([
        supabase.from('terms').select('id, name, start_date, end_date').eq('school_id', user.school_id),
        supabase.from('holidays').select('*').eq('school_id', user.school_id)
      ])

      // ── API Fetch: Automated Holidays ──
      let ghApiHolidays = []
      let worldApiHolidays = []
      
      try {
        // Fetch Ghana Holidays
        const ghRes = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/GH`)
        if (ghRes.ok) ghApiHolidays = await ghRes.json()
        
        // Fetch International (Common Global) - Using US as a proxy or specific list
        // Note: For true "worldwide", we'd need many calls. We'll stick to GH + Major Global.
        const worldRes = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/US`)
        if (worldRes.ok) worldApiHolidays = await worldRes.json()
      } catch (apiErr) {
        console.error('Holiday API Error:', apiErr)
      }

      const mappedEvents: CalendarEvent[] = []

      // Terms - Show as specific start/end points
      termsRes.data?.forEach(t => {
        mappedEvents.push({
          id: t.id + '_start',
          name: `🟢 Term Starts: ${t.name}`,
          start_date: t.start_date,
          end_date: t.start_date,
          type: 'term',
          color: '#059669'
        })
        mappedEvents.push({
          id: t.id + '_end',
          name: `🔴 Term Ends: ${t.name}`,
          start_date: t.end_date,
          end_date: t.end_date,
          type: 'term',
          color: '#dc2626'
        })
      })

      // Sync Ghanaian Holidays from API
      ghApiHolidays.forEach((h: any, idx: number) => {
        mappedEvents.push({
          id: 'gh_api_' + idx,
          name: `🇬🇭 ${h.localName || h.name}`,
          start_date: h.date,
          end_date: h.date,
          type: 'holiday',
          color: '#f59e0b'
        })
      })

      // Sync World/International Holidays from API (Filtering for common ones)
      const majorWorld = ['New Year\'s Day', 'Christmas Day', 'Labour Day', 'Good Friday', 'Easter Monday']
      worldApiHolidays.forEach((h: any, idx: number) => {
        // Only add if not already in GH list to avoid duplicates
        if (!ghApiHolidays.some((gh: any) => gh.date === h.date)) {
          mappedEvents.push({
            id: 'world_api_' + idx,
            name: `🌍 ${h.name}`,
            start_date: h.date,
            end_date: h.date,
            type: 'holiday',
            color: '#3b82f6'
          })
        }
      })

      // Manual School Holidays from DB
      holidaysRes.data?.forEach(h => {
        mappedEvents.push({
          id: h.id,
          name: h.name,
          start_date: h.start_date,
          end_date: h.end_date,
          type: 'holiday',
          color: '#8b5cf6'
        })
      })

      setEvents(mappedEvents)
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddHoliday(e: React.FormEvent) {
    e.preventDefault()
    if (!user?.school_id) return
    setAdding(true)
    try {
      const { error } = await supabase.from('holidays').insert({
        school_id: user.school_id,
        name: newEvent.name,
        start_date: newEvent.start_date,
        end_date: newEvent.end_date || newEvent.start_date,
        type: newEvent.type
      })

      if (error) throw error
      toast.success('Holiday added to calendar')
      setShowAdd(false)
      setNewEvent({ name: '', start_date: '', end_date: '', type: 'public' })
      loadEvents()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setAdding(false)
    }
  }

  // ── Calendar Logic ───────────────────────────────────────────
  const renderHeader = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
      <div>
        <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 28, fontWeight: 700, color: '#111827', margin: 0 }}>School Calendar</h1>
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Manage school terms, holidays, and events.</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: 12, padding: 4 }}>
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} style={{ padding: 8, border: 'none', background: 'none', cursor: 'pointer', color: '#4b5563' }}><ChevronLeft size={18} /></button>
          <div style={{ padding: '0 12px', display: 'flex', alignItems: 'center', fontSize: 14, fontWeight: 700, color: '#111827', minWidth: 140, justifyContent: 'center' }}>
            {format(currentMonth, 'MMMM yyyy')}
          </div>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} style={{ padding: 8, border: 'none', background: 'none', cursor: 'pointer', color: '#4b5563' }}><ChevronRight size={18} /></button>
        </div>
        <button onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 12, background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(109,40,217,0.25)' }}>
          <Plus size={16} /> Add Event
        </button>
      </div>
    </div>
  )

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 8 }}>
        {days.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '12px 0' }}>{d}</div>
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
    let formattedDate = ""

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, "d")
        const cloneDay = day
        const isCurrentMonth = isSameMonth(day, monthStart)
        const isToday = isSameDay(day, new Date())
        
        // Find events for this day
        const dayEvents = events.filter(e => {
          const start = parseISO(e.start_date)
          const end = parseISO(e.end_date)
          return isWithinInterval(cloneDay, { start, end })
        })

        days.push(
          <div
            key={day.toString()}
            style={{ 
              height: 120, 
              border: '1px solid #f1f5f9', 
              background: isCurrentMonth ? '#fff' : '#f9fafb',
              position: 'relative',
              padding: 8,
              transition: 'all 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={e => isCurrentMonth && (e.currentTarget.style.background = '#faf5ff')}
            onMouseLeave={e => isCurrentMonth && (e.currentTarget.style.background = '#fff')}
            onClick={() => {
              setNewEvent({ ...newEvent, start_date: format(cloneDay, 'yyyy-MM-dd'), end_date: format(cloneDay, 'yyyy-MM-dd') })
              setShowAdd(true)
            }}
          >
            <span style={{ 
              fontSize: 13, 
              fontWeight: 700, 
              color: isCurrentMonth ? (isToday ? '#7c3aed' : '#374151') : '#9ca3af',
              background: isToday ? '#f5f3ff' : 'transparent',
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              marginBottom: 6
            }}>
              {formattedDate}
            </span>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, overflow: 'hidden' }}>
              {dayEvents.map(e => (
                <div 
                  key={e.id} 
                  title={e.name}
                  style={{ 
                    fontSize: 10, 
                    fontWeight: 700, 
                    padding: '3px 6px', 
                    borderRadius: 6, 
                    background: e.color + '15', 
                    color: e.color,
                    borderLeft: `3px solid ${e.color}`,
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden'
                  }}
                >
                  {e.name}
                </div>
              ))}
            </div>
          </div>
        )
        day = addDays(day, 1)
      }
      rows.push(
        <div key={day.toString()} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>{days}</div>
      )
      days = []
    }
    return <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1.5px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.02)' }}>{rows}</div>
  }

  return (
    <div style={{ fontFamily: '"DM Sans", sans-serif', padding: '20px 0' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .calendar-container { animation: _fadeIn 0.5s ease both; }
      `}</style>

      <div className="calendar-container" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
        
        {/* Left: Calendar */}
        <div>
          {renderHeader()}
          {renderDays()}
          {renderCells()}
        </div>

        {/* Right: Info Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Live Clock Card */}
          <div style={{ 
            background: 'linear-gradient(135deg, #1e1b4b, #312e81)', 
            borderRadius: 24, 
            padding: 24, 
            color: '#fff',
            boxShadow: '0 10px 25px rgba(30,27,75,0.25)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            <Clock size={24} style={{ color: '#a5b4fc', marginBottom: 12, opacity: 0.8 }} />
            <div style={{ fontSize: 32, fontWeight: 800, fontFamily: 'monospace', letterSpacing: '0.05em' }}>
              {format(time, 'HH:mm:ss')}
            </div>
            <div style={{ fontSize: 13, color: '#a5b4fc', marginTop: 4, fontWeight: 600 }}>
              {format(time, 'EEEE, do MMMM')}
            </div>
          </div>

          {/* Legend */}
          <div style={{ background: '#fff', borderRadius: 20, padding: 20, border: '1.5px solid #f1f5f9' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bookmark size={16} color="#7c3aed" /> Calendar Legend
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 12, height: 12, borderRadius: 4, background: '#7c3aed' }} />
                <span style={{ fontSize: 13, color: '#4b5563', fontWeight: 500 }}>Academic Term</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 12, height: 12, borderRadius: 4, background: '#f59e0b' }} />
                <span style={{ fontSize: 13, color: '#4b5563', fontWeight: 500 }}>Public Holiday</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 12, height: 12, borderRadius: 4, background: '#f0fdf4', border: '1px solid #16a34a' }} />
                <span style={{ fontSize: 13, color: '#4b5563', fontWeight: 500 }}>Current Day</span>
              </div>
            </div>
          </div>

          {/* Upcoming Events */}
          <div style={{ background: '#fff', borderRadius: 20, padding: 20, border: '1.5px solid #f1f5f9', flex: 1 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <PartyPopper size={16} color="#f59e0b" /> Upcoming
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {events
                .filter(e => parseISO(e.start_date) >= new Date())
                .sort((a, b) => parseISO(a.start_date).getTime() - parseISO(b.start_date).getTime())
                .slice(0, 5)
                .map(e => (
                  <div key={e.id} style={{ display: 'flex', gap: 12 }}>
                    <div style={{ 
                      width: 44, 
                      height: 44, 
                      borderRadius: 12, 
                      background: e.color + '10', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: e.color }}>{format(parseISO(e.start_date), 'dd')}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: e.color, textTransform: 'uppercase' }}>{format(parseISO(e.start_date), 'MMM')}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{e.name}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>{format(parseISO(e.start_date), 'EEEE')}</div>
                    </div>
                  </div>
                ))}
              {events.length === 0 && <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', padding: '20px 0' }}>No upcoming events.</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(17, 24, 39, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 440, boxShadow: '0 20px 50px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: 0 }}>Add Holiday/Event</h2>
              <button onClick={() => setShowAdd(false)} style={{ background: '#f3f4f6', border: 'none', width: 32, height: 32, borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddHoliday} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Event Name</label>
                <input required placeholder="e.g. Independence Day" value={newEvent.name} onChange={e => setNewEvent({ ...newEvent, name: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Start Date</label>
                  <input type="date" required value={newEvent.start_date} onChange={e => setNewEvent({ ...newEvent, start_date: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>End Date (Optional)</label>
                  <input type="date" value={newEvent.end_date} onChange={e => setNewEvent({ ...newEvent, end_date: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Category</label>
                <select value={newEvent.type} onChange={e => setNewEvent({ ...newEvent, type: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none' }}>
                  <option value="public">Public Holiday</option>
                  <option value="school">School Event</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <button type="submit" disabled={adding} style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 8, boxShadow: '0 4px 12px rgba(109,40,217,0.3)', opacity: adding ? 0.7 : 1 }}>
                {adding ? 'Saving...' : 'Add to Calendar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
