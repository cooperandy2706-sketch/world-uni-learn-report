import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { useCurrentTerm } from '../../hooks/useSettings'
import { ROUTES } from '../../constants/routes'
import { Link } from 'react-router-dom'
import { CheckCircle, XCircle, Clock, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function StudentAttendancePage() {
  const { user } = useAuth()
  const { data: term } = useCurrentTerm()
  
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [attendance, setAttendance] = useState<any[]>([])
  const [summary, setSummary] = useState({ total: 0, present: 0, absent: 0, late: 0 })
  const [selectedMonth, setSelectedMonth] = useState(new Date())

  useEffect(() => {
    setTimeout(() => setMounted(true), 50)
    if (user?.id && term?.id) loadAttendance()
  }, [user?.id, term?.id])

  async function loadAttendance() {
    setLoading(true)
    try {
      const { data: student } = await supabase.from('students').select('id').eq('user_id', user!.id).single()
      if (!student) return

      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('student_id', student.id)
        .gte('date', (term as any).start_date)
        .lte('date', (term as any).end_date)
        .order('date', { ascending: false })
      
      if (error) throw error
      setAttendance(data || [])

      const stats = (data || []).reduce((acc: any, curr: any) => {
        acc.total++
        if (curr.status === 'present') acc.present++
        else if (curr.status === 'absent') acc.absent++
        else if (curr.status === 'late') acc.late++
        return acc
      }, { total: 0, present: 0, absent: 0, late: 0 })
      
      setSummary(stats)
    } catch (err: any) {
      toast.error(err.message || 'Failed to load attendance')
    } finally {
      setLoading(false)
    }
  }

  const attendanceRate = summary.total > 0 ? Math.round(((summary.present + summary.late) / summary.total) * 100) : 0

  // Calendar logic
  const daysInMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1).getDay()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i)

  const getStatusForDate = (day: number) => {
    const d = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day)
    const dateStr = d.toISOString().split('T')[0]
    return attendance.find(a => a.date === dateStr)
  }

  const nextMonth = () => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1))
  const prevMonth = () => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1))

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '70vh', flexDirection: 'column', gap: 16 }}>
      <style>{`@keyframes _ssp{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #ede9fe', borderTopColor: '#6d28d9', animation: '_ssp .8s linear infinite' }} />
      <p style={{ fontSize: 13, color: '#6b7280', fontFamily: '"DM Sans",sans-serif' }}>Syncing attendance records…</p>
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _sfu{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .att-card{background:#fff; border-radius:24px; border:1.5px solid #f0eefe; padding:24px; box-shadow:0 1px 4px rgba(109,40,217,.06)}
        .cal-grid{display:grid; grid-template-columns:repeat(7,1fr); gap:8px}
        .cal-day{aspect-ratio:1; display:flex; align-items:center; justify-content:center; border-radius:12px; font-size:13px; font-weight:600; position:relative}
        .cal-header{font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase; text-align:center; padding-bottom:8px}
        .status-present{background:#f0fdf4; color:#16a34a; border:1px solid #bbf7d0}
        .status-absent{background:#fef2f2; color:#dc2626; border:1px solid #fecaca}
        .status-late{background:#fffbeb; color:#d97706; border:1px solid #fde68a}
        .status-none{background:#f8fafc; color:#94a3b8; border:1px solid #f1f5f9}
        @media (max-width: 850px) {
          .att-main-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
          .att-stats-grid { grid-template-columns: 1fr 1fr !important; gap: 12px !important; }
          .att-card { padding: 20px !important; }
          .header-row { flex-direction: column !important; align-items: stretch !important; gap: 16px !important; }
          .cal-day { font-size: 11px !important; }
          .cal-header { font-size: 10px !important; }
        }
        @media (max-width: 480px) {
          .att-stats-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif', opacity: mounted ? 1 : 0, transition: 'opacity .4s ease', maxWidth: 1100, margin: '0 auto' }}>
        
        {/* Header */}
        <div className="header-row" style={{ marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', animation: '_sfu .5s ease both' }}>
          <div>
            <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 28, fontWeight: 700, color: '#111827', margin: 0 }}>Attendance Tracking</h1>
            <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>Monitor your daily presence and participation</p>
          </div>
          <Link to={ROUTES.STUDENT_DASHBOARD} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600, background: '#fff', color: '#374151', textDecoration: 'none', border: '1.5px solid #e5e7eb', justifyContent: 'center' }}>← Dashboard</Link>
        </div>

        {/* Stats Grid */}
        <div className="att-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32, animation: '_sfu .5s ease .1s both' }}>
          {[
            { label: 'Attendance Rate', value: `${attendanceRate}%`, icon: <CalendarIcon size={20} />, color: '#6d28d9', bg: '#f5f3ff', sub: 'Term Average' },
            { label: 'Days Present', value: summary.present, icon: <CheckCircle size={20} />, color: '#16a34a', bg: '#f0fdf4', sub: 'Excluding late' },
            { label: 'Days Late', value: summary.late, icon: <Clock size={20} />, color: '#d97706', bg: '#fffbeb', sub: 'Needs attention' },
            { label: 'Days Absent', value: summary.absent, icon: <XCircle size={20} />, color: '#dc2626', bg: '#fef2f2', sub: 'Unexcused' },
          ].map((s, i) => (
            <div key={i} className="att-card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em' }}>{s.label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#1e293b', lineHeight: 1.2 }}>{s.value}</div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{s.sub}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="att-main-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32 }}>
          
          {/* Calendar View */}
          <div className="att-card" style={{ animation: '_sfu .5s ease .15s both' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', margin: 0 }}>Attendance Calendar</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><ChevronLeft size={20} /></button>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', minWidth: 140, textAlign: 'center' }}>
                  {selectedMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </div>
                <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><ChevronRight size={20} /></button>
              </div>
            </div>

            <div className="cal-grid">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="cal-header">{d}</div>
              ))}
              {blanks.map(b => <div key={`b-${b}`} />)}
              {days.map(d => {
                const record = getStatusForDate(d)
                const statusClass = record ? `status-${record.status}` : 'status-none'
                return (
                  <div key={d} className={`cal-day ${statusClass}`}>
                    {d}
                    {record && (
                      <div style={{ position: 'absolute', bottom: 4, width: 4, height: 4, borderRadius: '50%', background: 'currentColor' }} />
                    )}
                  </div>
                )
              })}
            </div>

            <div style={{ marginTop: 32, display: 'flex', gap: 20, justifyContent: 'center' }}>
              {[
                { label: 'Present', color: '#16a34a' },
                { label: 'Late', color: '#d97706' },
                { label: 'Absent', color: '#dc2626' },
                { label: 'No Data', color: '#94a3b8' },
              ].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: l.color }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent History */}
          <div className="att-card" style={{ animation: '_sfu .5s ease .2s both', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', margin: '0 0 20px' }}>Recent Records</h3>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {attendance.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                  <CalendarIcon size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                  <p style={{ fontSize: 13 }}>No records found for this term</p>
                </div>
              ) : attendance.slice(0, 10).map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#f8fafc', borderRadius: 16, border: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: a.status === 'present' ? '#f0fdf4' : a.status === 'absent' ? '#fef2f2' : '#fffbeb', color: a.status === 'present' ? '#16a34a' : a.status === 'absent' ? '#dc2626' : '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {a.status === 'present' ? <CheckCircle size={16} /> : a.status === 'absent' ? <XCircle size={16} /> : <Clock size={16} />}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{new Date(a.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{new Date(a.date).toLocaleDateString('en-GB', { weekday: 'long' })}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: a.status === 'present' ? '#16a34a' : a.status === 'absent' ? '#dc2626' : '#d97706' }}>
                    {a.status}
                  </div>
                </div>
              ))}
            </div>
            {attendance.length > 10 && (
              <button style={{ marginTop: 20, width: '100%', padding: '10px', borderRadius: 10, background: '#f5f3ff', color: '#6d28d9', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                View Full History
              </button>
            )}
          </div>

        </div>

      </div>
    </>
  )
}
