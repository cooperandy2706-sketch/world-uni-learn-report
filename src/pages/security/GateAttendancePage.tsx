import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { format } from 'date-fns'
import { Users, Clock, LogIn, LogOut, AlertTriangle, Search } from 'lucide-react'

function StatCard({ icon: Icon, label, value, color, bg }: any) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: '14px', border: '1.5px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 40, height: 40, borderRadius: 11, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
        <Icon size={20} />
      </div>
      <div>
        <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', lineHeight: 1.2 }}>{value}</div>
      </div>
    </div>
  )
}

export default function GateAttendancePage() {
  const { user } = useAuth()
  const schoolId = user?.school_id ?? ''
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'student' | 'teacher' | 'late'>('all')
  const today = new Date().toISOString().split('T')[0]
  const qc = useQueryClient()

  const { data: scans = [], isLoading } = useQuery({
    queryKey: ['gate-scans', schoolId, today],
    queryFn: async () => {
      const { data } = await supabase
        .from('gate_scans').select('*')
        .eq('school_id', schoolId).eq('scan_date', today)
        .order('scan_time', { ascending: false })
      return data ?? []
    },
    enabled: !!schoolId,
  })

  useEffect(() => {
    if (!schoolId) return
    const channel = supabase.channel('gate-attendance-log-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'gate_scans', filter: `school_id=eq.${schoolId}` },
        () => { qc.invalidateQueries({ queryKey: ['gate-scans', schoolId, today] }) })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [schoolId, today, qc])

  const filtered = scans.filter((s: any) => {
    const matchSearch = s.person_name.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' ? true : filter === 'late' ? s.status === 'late' : s.person_type === filter
    return matchSearch && matchFilter
  })

  const totalIn = scans.filter((s: any) => s.direction === 'in').length
  const totalOut = scans.filter((s: any) => s.direction === 'out').length
  const totalLate = scans.filter((s: any) => s.status === 'late').length
  const onPremise = Math.max(0, totalIn - totalOut)

  return (
    <div style={{ fontFamily: '"DM Sans",sans-serif', paddingBottom: 80 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap');
        .ga-stat-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; }
        .ga-filter-row { display: flex; gap: 6px; flex-wrap: wrap; }
        @media (max-width: 600px) {
          .ga-stat-grid { grid-template-columns: repeat(2,1fr) !important; }
          .ga-filter-row { gap: 5px; }
          .ga-filter-row button { padding: 6px 10px !important; font-size: 11px !important; }
          .ga-table-head { display: none !important; }
        }
      `}</style>

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 }}>Gate Attendance</h1>
        <p style={{ color: '#64748b', fontSize: 12, marginTop: 3 }}>
          {format(new Date(), 'EEE, MMM d yyyy')} · {scans.length} total scans
        </p>
      </div>

      {/* Stats — 2-col on mobile */}
      <div className="ga-stat-grid" style={{ marginBottom: 20 }}>
        <StatCard icon={Users} label="On Premise" value={onPremise} color="#059669" bg="#ecfdf5" />
        <StatCard icon={LogIn} label="Entries" value={totalIn} color="#2563eb" bg="#eff6ff" />
        <StatCard icon={LogOut} label="Exits" value={totalOut} color="#7c3aed" bg="#f5f3ff" />
        <StatCard icon={AlertTriangle} label="Late" value={totalLate} color="#d97706" bg="#fffbeb" />
      </div>

      {/* Search + Filters */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f1f5f9', padding: '14px 16px', marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name…"
            style={{ width: '100%', padding: '9px 12px 9px 32px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div className="ga-filter-row">
          {(['all', 'student', 'teacher', 'late'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '7px 13px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize', background: filter === f ? '#0f172a' : '#f1f5f9', color: filter === f ? '#fff' : '#475569' }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Log Table */}
      <div style={{ background: '#fff', borderRadius: 18, border: '1.5px solid #f1f5f9', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading scans…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
            <Clock size={36} style={{ marginBottom: 10, opacity: .4 }} />
            <div>No scans recorded yet today</div>
          </div>
        ) : (
          <div>
            {/* Desktop header — hidden on mobile via CSS */}
            <div className="ga-table-head" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '10px 16px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em' }}>
              <span>Name</span><span>Type</span><span>Direction</span><span>Status</span><span>Time</span>
            </div>
            {filtered.map((s: any) => (
              /* Mobile: card layout; Desktop: grid row */
              <div key={s.id} style={{ padding: '12px 16px', borderBottom: '1px solid #f8fafc' }}>
                {/* Mobile card */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {s.photo_url ? (
                    <img src={s.photo_url} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: s.direction === 'in' ? '#dcfce7' : '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: s.direction === 'in' ? '#059669' : '#2563eb', flexShrink: 0 }}>
                      {s.person_name.charAt(0)}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{s.person_name}</div>
                    {s.class_name && <div style={{ fontSize: 11, color: '#64748b' }}>{s.class_name}</div>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: s.direction === 'in' ? '#059669' : '#7c3aed' }}>
                      {s.direction === 'in' ? '↓ IN' : '↑ OUT'}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: s.status === 'late' ? '#fef3c7' : '#ecfdf5', color: s.status === 'late' ? '#d97706' : '#059669' }}>
                      {s.status === 'late' ? '⚠ Late' : '✓ On Time'}
                    </span>
                    <span style={{ fontSize: 11, color: '#475569', fontWeight: 600 }}>
                      {format(new Date(s.scan_time), 'hh:mm a')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
