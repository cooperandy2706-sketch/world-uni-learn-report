// src/pages/parent/ParentAttendancePage.tsx
import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useParentWards } from '../../hooks/useParents'
import { supabase } from '../../lib/supabase'
import { useCurrentTerm } from '../../hooks/useSettings'
import { CheckCircle, XCircle, Clock, Calendar, ChevronLeft, ChevronRight, Users } from 'lucide-react'

type AttRecord = { date: string; status: 'present' | 'absent' | 'late' }
type WardAttData = { studentId: string; records: AttRecord[] }

export default function ParentAttendancePage() {
  const { user } = useAuth()
  const { data: wards = [], isLoading: wardsLoading } = useParentWards()
  const { data: term } = useCurrentTerm()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [wardData, setWardData] = useState<Record<string, WardAttData>>({})
  const [selectedWardId, setSelectedWardId] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date())

  useEffect(() => { setTimeout(() => setMounted(true), 60) }, [])

  useEffect(() => {
    if (wards.length > 0 && !selectedWardId) setSelectedWardId(wards[0].id)
  }, [wards, selectedWardId])

  useEffect(() => {
    if (!term || wards.length === 0) return
    loadAttendance()
  }, [term, wards.map(w => w.id).join()])

  async function loadAttendance() {
    setLoading(true)
    try {
      const results: Record<string, WardAttData> = {}
      await Promise.all(wards.map(async ward => {
        // useParentWards returns student rows directly — ward.id IS the student id
        const { data: att } = await supabase
          .from('attendance_records')
          .select('date, status')
          .eq('student_id', ward.id)
          .gte('date', (term as any).start_date)
          .lte('date', (term as any).end_date)
          .order('date', { ascending: false })

        results[ward.id] = { studentId: ward.id, records: (att || []) as AttRecord[] }
      }))
      setWardData(results)
    } finally {
      setLoading(false)
    }
  }

  const selectedWard = wards.find(w => w.id === selectedWardId)
  const current = selectedWardId ? wardData[selectedWardId] : null
  const records = current?.records || []

  const summary = records.reduce(
    (acc, r) => {
      acc.total++
      if (r.status === 'present') acc.present++
      else if (r.status === 'absent') acc.absent++
      else if (r.status === 'late') acc.late++
      return acc
    },
    { total: 0, present: 0, absent: 0, late: 0 }
  )
  const rate = summary.total > 0 ? Math.round(((summary.present + summary.late) / summary.total) * 100) : 0

  // Calendar helpers
  const daysInMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate()
  const firstDay = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1).getDay()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const blanks = Array.from({ length: firstDay })

  function getStatus(day: number) {
    const dateStr = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day)
      .toISOString().split('T')[0]
    return records.find(r => r.date === dateStr)
  }

  const statusColor: Record<string, { bg: string; text: string; border: string }> = {
    present: { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
    absent:  { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
    late:    { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
    none:    { bg: '#f8fafc', text: '#94a3b8', border: '#f1f5f9' },
  }

  if (wardsLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <style>{`@keyframes _sp{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #ede9fe', borderTopColor: '#7c3aed', animation: '_sp .8s linear infinite' }} />
    </div>
  )

  return (
    <>
      <style>{`
        @keyframes _fu{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
        .att-tab{transition:all .15s;cursor:pointer;border:none;font-family:"DM Sans",sans-serif}
        .att-tab:hover{background:#f5f3ff}
        @media(max-width:768px){
          .att-grid{grid-template-columns:1fr!important}
          .att-stats{grid-template-columns:1fr 1fr!important}
        }
      `}</style>
      <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif', opacity: mounted ? 1 : 0, transition: 'opacity .4s', maxWidth: 1100, margin: '0 auto', animation: '_fu .5s ease', paddingBottom: 40 }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: 'var(--text-main)', margin: '0 0 4px' }}>
            Attendance Tracker
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Monitor your children's school attendance records for this term.</p>
        </div>

        {/* Ward selector tabs */}
        {wards.length > 1 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
            {wards.map(ward => (
              <button key={ward.id} className="att-tab"
                onClick={() => setSelectedWardId(ward.id)}
                style={{
                  padding: '9px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600,
                  background: selectedWardId === ward.id ? '#7c3aed' : '#fff',
                  color: selectedWardId === ward.id ? '#fff' : '#374151',
                  border: `1.5px solid ${selectedWardId === ward.id ? '#7c3aed' : '#e5e7eb'}`,
                  display: 'flex', alignItems: 'center', gap: 7,
                }}
              >
                <Users size={14} /> {ward.full_name.split(' ')[0]}
              </button>
            ))}
          </div>
        )}

        {wards.length === 0 ? (
          <div style={{ background: 'var(--bg-card)', borderRadius: 8, padding: '50px 30px', textAlign: 'center', border: '1.5px solid #f0eefe' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>👨‍👩‍👦</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', marginBottom: 6 }}>No children linked</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Contact school administration to link your children.</p>
          </div>
        ) : loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #ede9fe', borderTopColor: '#7c3aed', animation: '_sp .8s linear infinite' }} />
          </div>
        ) : (
          <>
            {/* Ward name */}
            {selectedWard && (
              <div style={{ background: 'linear-gradient(135deg,#faf5ff,#ede9fe)', border: '1.5px solid #e9d5ff', borderRadius: 8, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#fff', fontWeight: 800 }}>
                  {selectedWard.full_name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1e0646' }}>{selectedWard.full_name}</div>
                  <div style={{ fontSize: 12, color: '#7c3aed' }}>{(selectedWard as any).class?.name || 'No Class'} • {term ? `${(term as any).name}` : 'Current Term'}</div>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="att-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
              {[
                { label: 'Attendance Rate', value: `${rate}%`, icon: <Calendar size={18} />, color: '#7c3aed', bg: '#f5f3ff' },
                { label: 'Days Present', value: summary.present, icon: <CheckCircle size={18} />, color: '#16a34a', bg: '#f0fdf4' },
                { label: 'Days Late', value: summary.late, icon: <Clock size={18} />, color: '#d97706', bg: '#fffbeb' },
                { label: 'Days Absent', value: summary.absent, icon: <XCircle size={18} />, color: '#dc2626', bg: '#fef2f2' },
              ].map((s, i) => (
                <div key={i} style={{ background: 'var(--bg-card)', borderRadius: 18, padding: '18px 20px', border: '1.5px solid #f0eefe', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 1px 4px rgba(109,40,217,.04)' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.icon}</div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{s.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', lineHeight: 1.2 }}>{s.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Calendar + Recent */}
            <div className="att-grid" style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 24 }}>

              {/* Calendar */}
              <div style={{ background: 'var(--bg-card)', borderRadius: 8, padding: 24, border: '1.5px solid #f0eefe' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: 0 }}>Monthly View</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                      <ChevronLeft size={18} />
                    </button>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', minWidth: 120, textAlign: 'center' }}>
                      {selectedMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </span>
                    <button onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6 }}>
                  {['S','M','T','W','T','F','S'].map((d, i) => (
                    <div key={i} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#94a3b8', paddingBottom: 6, textTransform: 'uppercase' }}>{d}</div>
                  ))}
                  {blanks.map((_, i) => <div key={`b${i}`} />)}
                  {days.map(d => {
                    const rec = getStatus(d)
                    const { bg, text, border } = statusColor[rec?.status || 'none']
                    return (
                      <div key={d} style={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, fontSize: 12, fontWeight: 600, background: bg, color: text, border: `1px solid ${border}` }}>
                        {d}
                      </div>
                    )
                  })}
                </div>

                {/* Legend */}
                <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
                  {Object.entries({ present: '#16a34a', late: '#d97706', absent: '#dc2626', none: '#94a3b8' }).map(([label, color]) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                      <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{label === 'none' ? 'No Data' : label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent records */}
              <div style={{ background: 'var(--bg-card)', borderRadius: 8, padding: 24, border: '1.5px solid #f0eefe', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: '0 0 16px' }}>Recent Records</h3>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {records.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8' }}>
                      <Calendar size={36} style={{ opacity: 0.3, marginBottom: 10 }} />
                      <p style={{ fontSize: 13 }}>No records for this term yet</p>
                    </div>
                  ) : records.slice(0, 12).map((r, i) => {
                    const { bg, text } = statusColor[r.status]
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#f8fafc', borderRadius: 14, border: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 30, height: 30, borderRadius: 8, background: bg, color: text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {r.status === 'present' ? <CheckCircle size={15} /> : r.status === 'absent' ? <XCircle size={15} /> : <Clock size={15} />}
                          </div>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>
                              {new Date(r.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                              {new Date(r.date).toLocaleDateString('en-GB', { weekday: 'long' })}
                            </div>
                          </div>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: text, background: bg, padding: '3px 8px', borderRadius: 6 }}>
                          {r.status}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
