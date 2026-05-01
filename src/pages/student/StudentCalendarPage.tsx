import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { ROUTES } from '../../constants/routes'
import { Link } from 'react-router-dom'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, Tag } from 'lucide-react'
import toast from 'react-hot-toast'

export default function StudentCalendarPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [viewDate, setViewDate] = useState(new Date())

  useEffect(() => {
    setTimeout(() => setMounted(true), 50)
    if (user?.id) loadEvents()
  }, [user?.id])

  async function loadEvents() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('school_id', user!.school_id)
        .order('start_date', { ascending: true })
      
      if (error) throw error
      setEvents(data || [])
    } catch (err: any) {
      toast.error(err.message || 'Failed to load calendar events')
    } finally {
      setLoading(false)
    }
  }

  // Calendar logic
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i)

  const getEventsForDate = (day: number) => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day)
    const dateStr = d.toISOString().split('T')[0]
    return events.filter(e => e.start_date.split('T')[0] === dateStr)
  }

  const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1))
  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1))

  const upcomingEvents = events.filter(e => new Date(e.start_date) >= new Date()).slice(0, 5)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '70vh', flexDirection: 'column', gap: 16 }}>
      <style>{`@keyframes _ssp{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #ede9fe', borderTopColor: '#6d28d9', animation: '_ssp .8s linear infinite' }} />
      <p style={{ fontSize: 13, color: '#6b7280', fontFamily: '"DM Sans",sans-serif' }}>Loading school calendar…</p>
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _sfu{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .cal-card{background:#fff; border-radius:24px; border:1.5px solid #f0eefe; padding:24px; box-shadow:0 1px 4px rgba(109,40,217,.06)}
        .cal-grid{display:grid; grid-template-columns:repeat(7,1fr); border-top:1px solid #f1f5f9; border-left:1px solid #f1f5f9}
        .cal-cell{min-height:100px; padding:10px; border-right:1px solid #f1f5f9; border-bottom:1px solid #f1f5f9; background:#fff; transition:all .2s}
        .cal-cell:hover{background:#f8fafc}
        .cal-header{font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase; text-align:center; padding:12px; background:#f8fafc; border-right:1px solid #f1f5f9; border-top:1px solid #f1f5f9}
        .event-tag{font-size:10px; font-weight:700; padding:2px 6px; borderRadius:4px; margin-bottom:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:block}
        @media (max-width: 950px) {
          .cal-main-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
          .header-row { flex-direction: column !important; align-items: stretch !important; gap: 16px !important; }
          .cal-cell { min-height: 80px !important; }
          .cal-controls { flex-direction: column !important; align-items: stretch !important; gap: 8px !important; }
        }
        @media (max-width: 480px) {
          .cal-cell { min-height: 60px !important; padding: 4px !important; }
          .cal-cell span { font-size: 11px !important; width: 20px !important; height: 20px !important; }
          .event-tag { font-size: 8px !important; padding: 1px 3px !important; }
        }
      `}</style>

      <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif', opacity: mounted ? 1 : 0, transition: 'opacity .4s ease', maxWidth: 1200, margin: '0 auto' }}>
        
        {/* Header */}
        <div className="header-row" style={{ marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', animation: '_sfu .5s ease both' }}>
          <div>
            <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 28, fontWeight: 700, color: '#111827', margin: 0 }}>School Calendar</h1>
            <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>Overview of holidays, exams, and special events</p>
          </div>
          <Link to={ROUTES.STUDENT_DASHBOARD} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600, background: '#fff', color: '#374151', textDecoration: 'none', border: '1.5px solid #e5e7eb', justifyContent: 'center' }}>← Dashboard</Link>
        </div>

        <div className="cal-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32 }}>
          
          {/* Main Calendar View */}
          <div className="cal-card" style={{ padding: 0, overflow: 'hidden', animation: '_sfu .5s ease .1s both' }}>
            <div style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <CalendarIcon size={24} color="#6d28d9" />
                <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', margin: 0 }}>
                  {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h3>
              </div>
              <div className="cal-controls" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={prevMonth} style={{ width: 36, height: 36, borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronLeft size={18} /></button>
                <button onClick={() => setViewDate(new Date())} style={{ padding: '8px 16px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Today</button>
                <button onClick={nextMonth} style={{ width: 36, height: 36, borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronRight size={18} /></button>
              </div>
            </div>

            <div className="cal-grid">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="cal-header">{d}</div>
              ))}
              {blanks.map(b => <div key={`b-${b}`} className="cal-cell" style={{ background: '#f8fafc' }} />)}
              {days.map(d => {
                const dayEvents = getEventsForDate(d)
                const isToday = new Date().toDateString() === new Date(viewDate.getFullYear(), viewDate.getMonth(), d).toDateString()
                return (
                  <div key={d} className="cal-cell">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: isToday ? '#fff' : '#64748b', background: isToday ? '#6d28d9' : 'none', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>{d}</span>
                    </div>
                    {dayEvents.map((e, idx) => (
                      <div key={idx} className="event-tag" style={{ background: e.category === 'holiday' ? '#fef2f2' : e.category === 'exam' ? '#f5f3ff' : '#eff6ff', color: e.category === 'holiday' ? '#dc2626' : e.category === 'exam' ? '#6d28d9' : '#2563eb', border: `1px solid ${e.category === 'holiday' ? '#fecaca' : e.category === 'exam' ? '#ddd6fe' : '#bfdbfe'}` }}>
                        {e.title}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Side Panel: Upcoming Events */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: '_sfu .5s ease .2s both' }}>
            <div className="cal-card">
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Clock size={20} color="#6d28d9" /> Upcoming Events
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {upcomingEvents.length === 0 ? (
                  <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>No upcoming events scheduled</p>
                ) : upcomingEvents.map((e, i) => (
                  <div key={i} style={{ padding: '16px', background: '#f8fafc', borderRadius: 16, border: '1px solid #f1f5f9', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: e.category === 'holiday' ? '#dc2626' : e.category === 'exam' ? '#6d28d9' : '#2563eb' }} />
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>{new Date(e.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>{e.title}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {e.location && <div style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} /> {e.location}</div>}
                      <div style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}><Tag size={12} /> {e.category || 'General'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'linear-gradient(135deg, #1e0646, #3b0764)', borderRadius: 24, padding: 24, color: '#fff' }}>
              <h4 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px' }}>Exam Season Approaching?</h4>
              <p style={{ fontSize: 13, opacity: 0.8, margin: '0 0 16px' }}>Don't forget to check the resources hub for study materials and past questions.</p>
              <Link to={ROUTES.STUDENT_RESOURCES} style={{ display: 'inline-flex', padding: '10px 20px', borderRadius: 10, background: '#fbbf24', color: '#1e0646', textDecoration: 'none', fontSize: 12, fontWeight: 800 }}>
                Open Resources Hub
              </Link>
            </div>
          </div>

        </div>

      </div>
    </>
  )
}
