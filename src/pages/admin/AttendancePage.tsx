// src/pages/admin/AttendancePage.tsx
// Admin dashboard for viewing daily attendance logs

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useClasses } from '../../hooks/useClasses'
import { useCurrentTerm } from '../../hooks/useSettings'
import toast from 'react-hot-toast'

interface AttendanceRecord {
  id: string
  date: string
  status: 'present' | 'absent' | 'late' | 'excused'
  student_name: string
  student_id: string
  teacher_name: string
}

// ── helpers ───────────────────────────────────────────────
function Btn({ children, onClick, variant = 'primary', type = 'button', disabled, loading, style }: any) {
  const [hov, setHov] = useState(false)
  const variants: Record<string, React.CSSProperties> = {
    primary:   { background: hov ? '#5b21b6' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', border: 'none', boxShadow: '0 2px 8px rgba(109,40,217,0.28)' },
    secondary: { background: hov ? '#f5f3ff' : '#fff', color: '#374151', border: '1.5px solid #e5e7eb' },
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.15s', opacity: disabled ? 0.6 : 1, fontFamily: '"DM Sans",sans-serif', ...variants[variant], ...style }}>
      {loading && <span style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: '_spin 0.7s linear infinite', flexShrink: 0 }} />}
      {children}
    </button>
  )
}

// ═══════════════════════════════════════════════════════════
export default function AdminAttendancePage() {
  const { data: classes = [] } = useClasses()
  const { data: term } = useCurrentTerm()

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [selectedClass, setSelectedClass] = useState('')
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (date && selectedClass) load()
  }, [date, selectedClass])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('attendance_records')
      .select(`
        id,
        status,
        date,
        student:students (
          full_name,
          student_id
        ),
        teacher:teachers (
          user:users (
            full_name
          )
        )
      `)
      .eq('class_id', selectedClass)
      .eq('date', date)

    if (error) {
      console.error('[AdminAttendance] Load error:', error)
      toast.error('Failed to load records: ' + error.message)
      setRecords([])
    } else {
      // Map and Flatten the results
      const flattened: AttendanceRecord[] = (data as any[] ?? []).map(r => ({
        id: r.id,
        date: r.date,
        status: r.status,
        student_name: r.student?.full_name || 'Unknown Student',
        student_id: r.student?.student_id || 'No ID',
        teacher_name: r.teacher?.user?.full_name || 'System'
      }))

      // Sort manually by student name
      flattened.sort((a, b) => a.student_name.localeCompare(b.student_name))
      setRecords(flattened)
    }
    setLoading(false)
  }

  const filtered = records.filter(r =>
    !search ||
    r.student_name.toLowerCase().includes(search.toLowerCase()) ||
    r.student_id.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total: records.length,
    present: records.filter(r => r.status === 'present').length,
    absent: records.filter(r => r.status === 'absent').length,
    late: records.filter(r => r.status === 'late').length,
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _spin { to{transform:rotate(360deg)} }
        @keyframes _fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes _fadeIn { from{opacity:0} to{opacity:1} }

        @media (max-width: 768px) {
          .adm-filters { flex-direction: column; align-items: stretch !important; }
          .adm-filters > div { width: 100% !important; max-width: none !important; }
          .adm-table { display: none; }
          .adm-cards { display: grid !important; grid-template-columns: 1fr; gap: 12px; }
        }
      `}</style>

      <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif', animation: '_fadeIn 0.4s ease' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>Attendance Monitoring</h1>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 3 }}>View daily morning register records by class and date.</p>
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="adm-filters" style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', border: '1.5px solid #f0eefe', marginBottom: 20, boxShadow: '0 1px 4px rgba(109,40,217,.06)', display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 5 }}>Select Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 13, border: '1.5px solid #e5e7eb', outline: 'none', background: '#faf5ff', fontFamily: '"DM Sans",sans-serif', boxSizing: 'border-box' }} />
          </div>
          <div style={{ flex: '1 1 200px', maxWidth: 300 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 5 }}>Select Class</label>
            <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 13, border: '1.5px solid #e5e7eb', outline: 'none', background: '#faf5ff', fontFamily: '"DM Sans",sans-serif' }}>
              <option value="">Choose a class…</option>
              {(classes as any[]).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 5 }}>Search Student</label>
            <input placeholder="Name or ID…" value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 13, border: '1.5px solid #e5e7eb', outline: 'none', background: '#faf5ff', fontFamily: '"DM Sans",sans-serif', boxSizing: 'border-box' }} />
          </div>
          <Btn onClick={load} loading={loading} style={{ height: 42 }}>🔄 Refresh</Btn>
        </div>

        {/* ── Summary statistics ── */}
        {records.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Total Logs', value: stats.total, color: '#6d28d9', bg: '#f5f3ff' },
              { label: 'Present', value: stats.present, color: '#16a34a', bg: '#f0fdf4' },
              { label: 'Absent', value: stats.absent, color: '#dc2626', bg: '#fef2f2' },
              { label: 'Late', value: stats.late, color: '#d97706', bg: '#fffbeb' },
            ].map((s, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 14, padding: '14px', border: '1.5px solid #f0eefe', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', animation: `_fadeUp 0.4s ease ${i * 0.05}s both` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Tables ── */}
        {!selectedClass && (
          <div style={{ background: '#fff', borderRadius: 16, padding: '60px 20px', textAlign: 'center', border: '1.5px solid #f0eefe' }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>📋</div>
            <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 6 }}>Select a class</h3>
            <p style={{ fontSize: 13, color: '#9ca3af' }}>Select a class to view its daily attendance records.</p>
          </div>
        )}

        {selectedClass && !loading && records.length === 0 && (
          <div style={{ background: '#fffbeb', borderRadius: 16, padding: '60px 20px', textAlign: 'center', border: '1.5px solid #fde68a' }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>⏳</div>
            <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 6 }}>No records for this date</h3>
            <p style={{ fontSize: 13, color: '#9ca3af' }}>The class teacher has not submitted the register for this day yet.</p>
          </div>
        )}

        {selectedClass && filtered.length > 0 && (
          <>
            {/* Desktop Table View */}
            <div className="adm-table" style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', overflow: 'hidden', boxShadow: '0 1px 4px rgba(109,40,217,.06)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg,#faf5ff,#f5f3ff)', borderBottom: '1.5px solid #ede9fe' }}>
                    {['Student Name', 'Status', 'Time Recorded', 'Recorded By'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => (
                    <tr key={r.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #fafafa' : 'none', animation: `_fadeUp 0.3s ease ${i * 0.02}s both` }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{r.student_name}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>{r.student_id}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 99, background: r.status === 'present' ? '#f0fdf4' : r.status === 'absent' ? '#fef2f2' : '#fffbeb', color: r.status === 'present' ? '#16a34a' : r.status === 'absent' ? '#dc2626' : '#d97706' }}>
                          {r.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#6b7280' }}>
                        {new Date(date).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#4b5563', fontWeight: 500 }}>
                        {r.teacher_name}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="adm-cards" style={{ display: 'none' }}>
              {filtered.map((r, i) => (
                <div key={r.id} style={{ background: '#fff', borderRadius: 14, padding: '16px', border: '1.5px solid #f0eefe', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', animation: `_fadeUp 0.3s ease ${i * 0.02}s both` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{r.student_name}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>{r.student_id}</div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 99, background: r.status === 'present' ? '#f0fdf4' : r.status === 'absent' ? '#fef2f2' : '#fffbeb', color: r.status === 'present' ? '#16a34a' : r.status === 'absent' ? '#dc2626' : '#d97706' }}>
                      {r.status.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ borderTop: '1px solid #f9fafb', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>
                      <span style={{ fontWeight: 600 }}>By:</span> {r.teacher_name}
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{new Date(date).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}
