import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { Calendar, Search, LogIn, LogOut, Clock, Filter, MapPin } from 'lucide-react'
import { format } from 'date-fns'

export default function DriverTripLogsPage() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [filterDirection, setFilterDirection] = useState<'all' | 'pickup' | 'dropoff'>('all')
  const [dateFilter, setDateFilter] = useState(format(new Date(), 'yyyy-MM-dd'))

  useEffect(() => {
    if (user?.school_id) loadLogs()
  }, [user?.school_id, dateFilter, filterDirection])

  async function loadLogs() {
    setLoading(true)
    
    // First, fetch the driver's vehicle
    const { data: vehicle } = await supabase
      .from('transport_vehicles')
      .select('id')
      .eq('driver_id', user!.id)
      .maybeSingle()

    if (!vehicle) {
      setLogs([])
      setLoading(false)
      return
    }

    let query = supabase
      .from('transport_boarding_logs')
      .select(`
        id, time_scanned, direction, location_name,
        student:students(full_name, student_id, class:classes(name))
      `)
      .eq('school_id', user!.school_id)
      .eq('vehicle_id', vehicle.id)
      .order('time_scanned', { ascending: false })

    if (filterDirection !== 'all') {
      query = query.eq('direction', filterDirection)
    }

    if (dateFilter) {
      const startOfDay = new Date(`${dateFilter}T00:00:00`).toISOString()
      const endOfDay = new Date(`${dateFilter}T23:59:59.999`).toISOString()
      query = query.gte('time_scanned', startOfDay).lte('time_scanned', endOfDay)
    }

    const { data } = await query
    setLogs(data || [])
    setLoading(false)
  }

  return (
    <div style={{ padding: '24px 20px', maxWidth: 800, margin: '0 auto', fontFamily: '"DM Sans", sans-serif' }}>
      
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Trip Logs</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>History of scanned student boardings and drop-offs for your vehicle.</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 16, border: '1px solid var(--border-color)', marginBottom: 24, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>Date</label>
          <div style={{ position: 'relative' }}>
            <Calendar size={16} color="#64748b" style={{ position: 'absolute', left: 12, top: 12 }} />
            <input 
              type="date" 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
            />
          </div>
        </div>
        
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>Direction</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              onClick={() => setFilterDirection('all')}
              style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: filterDirection === 'all' ? '#1e293b' : '#f1f5f9', color: filterDirection === 'all' ? '#fff' : '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
            >
              All
            </button>
            <button 
              onClick={() => setFilterDirection('pickup')}
              style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: filterDirection === 'pickup' ? '#eff6ff' : '#f1f5f9', color: filterDirection === 'pickup' ? '#2563eb' : '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <LogIn size={14} /> Pickups
            </button>
            <button 
              onClick={() => setFilterDirection('dropoff')}
              style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: filterDirection === 'dropoff' ? '#fffbeb' : '#f1f5f9', color: filterDirection === 'dropoff' ? '#d97706' : '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <LogOut size={14} /> Drop-offs
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading logs...</div>
      ) : logs.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', background: '#f8fafc', borderRadius: 16, border: '2px dashed #e2e8f0' }}>
          <Filter size={32} color="#cbd5e1" style={{ marginBottom: 12 }} />
          <h3 style={{ margin: '0 0 4px', color: '#334155', fontSize: 16 }}>No Scans Found</h3>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: 14 }}>Try selecting a different date or filter.</p>
        </div>
      ) : (
        <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Student</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Time</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{log.student?.full_name}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{log.student?.class?.name} • {log.student?.student_id}</div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#475569', fontWeight: 600 }}>
                      <Clock size={14} color="#94a3b8" />
                      {new Date(log.time_scanned).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {log.direction === 'pickup' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#eff6ff', color: '#2563eb', padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                        <LogIn size={12} /> PICKUP
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fffbeb', color: '#d97706', padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                        <LogOut size={12} /> DROP-OFF
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  )
}
