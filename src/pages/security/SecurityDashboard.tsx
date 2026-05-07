// src/pages/security/SecurityDashboard.tsx
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
// Note: FloatingClock (global widget) handles live time display — no local clock needed
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { format, formatDistanceToNow } from 'date-fns'
import {
  Shield, QrCode, Users, LogIn, LogOut,
  AlertTriangle, Clock, Phone, UserCheck,
  UserX, TrendingUp, Activity, ChevronRight
} from 'lucide-react'

interface GateScan {
  id: string
  person_name: string
  person_type: 'student' | 'teacher'
  class_name: string
  photo_url: string
  direction: 'in' | 'out'
  status: 'on_time' | 'late'
  scan_time: string
}

interface DashStats {
  totalStudentsIn: number
  totalTeachersIn: number
  lateArrivals: number
  exits: number
  recentScans: GateScan[]
  lastScanTime: string | null
}

function StatCard({ icon: Icon, label, value, sub, color, bg, onClick }: any) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: '#fff', borderRadius: 22, padding: '22px', border: '1.5px solid #f1f5f9',
        display: 'flex', flexDirection: 'column', gap: 8,
        boxShadow: hov ? '0 8px 32px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.04)',
        transform: hov ? 'translateY(-2px)' : 'none',
        transition: 'all .2s', cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
          <Icon size={24} />
        </div>
        {onClick && <ChevronRight size={16} color="#cbd5e1" />}
      </div>
      <div>
        <div style={{ fontSize: 30, fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', marginTop: 4 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  )
}

function ScanFeedItem({ scan }: { scan: GateScan }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
      borderBottom: '1px solid #f8fafc', animation: 'sc_slide .3s ease',
    }}>
      {scan.photo_url ? (
        <img src={scan.photo_url} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid #f1f5f9' }} />
      ) : (
        <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, background: scan.direction === 'in' ? '#dcfce7' : '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: scan.direction === 'in' ? '#059669' : '#2563eb' }}>
          {scan.person_name.charAt(0)}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{scan.person_name}</div>
        <div style={{ fontSize: 11, color: '#94a3b8' }}>{scan.person_type === 'student' ? '🎓' : '👩‍🏫'} {scan.class_name || (scan.person_type === 'teacher' ? 'Teaching Staff' : '')}</div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
          <span style={{
            fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 99,
            background: scan.direction === 'in' ? '#dcfce7' : '#dbeafe',
            color: scan.direction === 'in' ? '#15803d' : '#1d4ed8',
          }}>{scan.direction === 'in' ? '↓ IN' : '↑ OUT'}</span>
          {scan.status === 'late' && (
            <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 99, background: '#fef3c7', color: '#b45309' }}>LATE</span>
          )}
        </div>
        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>
          {formatDistanceToNow(new Date(scan.scan_time), { addSuffix: true })}
        </div>
      </div>
    </div>
  )
}

export default function SecurityDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const schoolId = user?.school_id ?? ''
  const today = new Date().toISOString().split('T')[0]

  const [stats, setStats] = useState<DashStats>({
    totalStudentsIn: 0, totalTeachersIn: 0, lateArrivals: 0, exits: 0,
    recentScans: [], lastScanTime: null,
  })
  const [loading, setLoading] = useState(true)
  // Use a static time snapshot — FloatingClock widget (global) handles live clock display
  const currentTime = new Date()

  const fetchStats = useCallback(async () => {
    if (!schoolId) return
    const { data: scans } = await supabase
      .from('gate_scans')
      .select('*')
      .eq('school_id', schoolId)
      .eq('scan_date', today)
      .order('scan_time', { ascending: false })

    const all = scans ?? []

    // Compute who is currently on premise (last scan = 'in')
    const byPerson: Record<string, GateScan[]> = {}
    all.forEach((s: GateScan) => {
      const key = `${s.person_type}-${s.person_name}`
      if (!byPerson[key]) byPerson[key] = []
      byPerson[key].push(s)
    })

    let studentsOnPremise = 0, teachersOnPremise = 0
    Object.values(byPerson).forEach(personScans => {
      const sorted = [...personScans].sort((a, b) => new Date(b.scan_time).getTime() - new Date(a.scan_time).getTime())
      if (sorted[0]?.direction === 'in') {
        if (sorted[0].person_type === 'student') studentsOnPremise++
        else teachersOnPremise++
      }
    })

    setStats({
      totalStudentsIn: studentsOnPremise,
      totalTeachersIn: teachersOnPremise,
      lateArrivals: all.filter((s: GateScan) => s.status === 'late' && s.direction === 'in').length,
      exits: all.filter((s: GateScan) => s.direction === 'out').length,
      recentScans: all.slice(0, 12),
      lastScanTime: all[0]?.scan_time ?? null,
    })
    setLoading(false)
  }, [schoolId, today])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  // Realtime subscription
  useEffect(() => {
    if (!schoolId) return
    const channel = supabase
      .channel('gate-scans-realtime')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'gate_scans',
        filter: `school_id=eq.${schoolId}`,
      }, () => { fetchStats() })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [schoolId, fetchStats])

  const onPremise = stats.totalStudentsIn + stats.totalTeachersIn

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800;900&family=Playfair+Display:wght@700&display=swap');
        @keyframes sc_slide { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:none} }
        @keyframes sc_fi { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
        @keyframes pulse_ring { 0%{box-shadow:0 0 0 0 rgba(34,197,94,.5)} 70%{box-shadow:0 0 0 12px rgba(34,197,94,0)} 100%{box-shadow:0 0 0 0 rgba(34,197,94,0)} }
        .sec-dash { animation: sc_fi .4s ease; font-family: "DM Sans",sans-serif; }
      `}</style>

      <div className="sec-dash" style={{ paddingBottom: 48 }}>

        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#0f172a,#1e293b)', color: '#fff', padding: '7px 16px', borderRadius: 99, fontSize: 12, fontWeight: 700, marginBottom: 10, letterSpacing: '.04em' }}>
              <Shield size={14} /> SECURITY OPERATIONS CENTER
            </div>
            <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 28, fontWeight: 700, color: '#0f172a', margin: 0 }}>Gate Control Dashboard</h1>
            <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
              Welcome, <strong>{user?.full_name}</strong> · {format(currentTime, 'EEEE, MMMM d yyyy')}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#64748b', letterSpacing: '-0.01em' }}>
              {format(currentTime, 'EEEE, MMMM d yyyy')}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, marginTop: 2 }}>See floating clock for live time</div>
          </div>
        </div>

        {/* Live Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, padding: '10px 16px', background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0', width: 'fit-content' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', animation: 'pulse_ring 2s infinite', flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#15803d' }}>LIVE — Auto-refreshing in real time</span>
          {stats.lastScanTime && (
            <span style={{ fontSize: 11, color: '#86efac' }}>· Last scan {formatDistanceToNow(new Date(stats.lastScanTime), { addSuffix: true })}</span>
          )}
        </div>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 28 }}>
          <StatCard icon={Users} label="Students On Premise" value={loading ? '…' : stats.totalStudentsIn} sub="Currently inside campus" color="#2563eb" bg="#eff6ff" onClick={() => navigate('/security/gate-attendance')} />
          <StatCard icon={UserCheck} label="Teachers On Premise" value={loading ? '…' : stats.totalTeachersIn} sub="Teaching staff present" color="#7c3aed" bg="#f5f3ff" onClick={() => navigate('/security/gate-attendance')} />
          <StatCard icon={AlertTriangle} label="Late Arrivals" value={loading ? '…' : stats.lateArrivals} sub="Arrived after 8:00 AM" color="#d97706" bg="#fffbeb" onClick={() => navigate('/security/gate-attendance?filter=late')} />
          <StatCard icon={LogOut} label="Exits Today" value={loading ? '…' : stats.exits} sub="Left campus today" color="#dc2626" bg="#fef2f2" onClick={() => navigate('/security/gate-attendance')} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>

          {/* Recent Scan Feed */}
          <div style={{ background: '#fff', borderRadius: 24, border: '1.5px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ padding: '20px 20px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0 }}>Live Scan Feed</h2>
                <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>Real-time gate activity · today</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#059669', fontWeight: 700, background: '#dcfce7', padding: '5px 12px', borderRadius: 99 }}>
                <Activity size={13} /> {stats.recentScans.length} scans
              </div>
            </div>

            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#cbd5e1' }}>
                <Clock size={32} style={{ marginBottom: 8 }} />
                <div>Loading…</div>
              </div>
            ) : stats.recentScans.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center', color: '#94a3b8' }}>
                <QrCode size={44} style={{ marginBottom: 12, opacity: .3 }} />
                <div style={{ fontSize: 15, fontWeight: 700, color: '#334155', marginBottom: 6 }}>No scans yet today</div>
                <p style={{ fontSize: 13, marginBottom: 20 }}>Gate activity will appear here in real time as students and staff scan in.</p>
                <button onClick={() => navigate('/security/scanner')}
                  style={{ padding: '11px 22px', borderRadius: 12, border: 'none', background: '#0f172a', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  🔍 Open Gate Scanner
                </button>
              </div>
            ) : (
              <div>
                {stats.recentScans.map(scan => <ScanFeedItem key={scan.id} scan={scan} />)}
                <div onClick={() => navigate('/security/gate-attendance')}
                  style={{ padding: '14px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#2563eb', cursor: 'pointer', borderTop: '1px solid #f1f5f9' }}>
                  View Full Attendance Log →
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Quick Actions */}
            <div style={{ background: '#fff', borderRadius: 22, border: '1.5px solid #f1f5f9', padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 14 }}>Quick Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Open Gate Scanner', emoji: '📷', path: '/security/scanner', color: '#0f172a' },
                  { label: 'Print Student Tags (QR)', emoji: '🪪', path: '/admin/poster-maker?tab=tags', color: '#7c3aed' },
                  { label: 'View Attendance Log', emoji: '📋', path: '/security/gate-attendance', color: '#2563eb' },
                  { label: 'Register Visitor', emoji: '🚪', path: '/security/visitors', color: '#059669' },
                ].map(({ label, emoji, path, color }) => (
                  <button key={path} onClick={() => navigate(path)}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 14, border: '1.5px solid #f1f5f9', background: '#f8fafc', color, fontSize: 14, fontWeight: 700, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, transition: 'all .15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f1f5f9' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#f8fafc' }}>
                    <span style={{ fontSize: 20 }}>{emoji}</span> {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Today Summary Donut */}
            <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)', borderRadius: 22, padding: '22px', color: '#fff' }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Today's Summary</h3>
              <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 18 }}>{format(new Date(), 'MMMM d, yyyy')}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Total Scans', value: stats.recentScans.length, color: '#60a5fa' },
                  { label: 'On Premise Now', value: onPremise, color: '#34d399' },
                  { label: 'Late Arrivals', value: stats.lateArrivals, color: '#fbbf24' },
                  { label: 'Exits', value: stats.exits, color: '#f87171' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                      <span style={{ fontSize: 13, color: '#cbd5e1' }}>{label}</span>
                    </div>
                    <span style={{ fontSize: 16, fontWeight: 900, color }}>{loading ? '…' : value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Emergency Contacts */}
            <div style={{ background: '#fff', borderRadius: 22, border: '1.5px solid #f1f5f9', padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Phone size={16} color="#dc2626" /> Emergency Contacts
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { name: 'Headteacher', role: 'Admin Office', phone: 'ext. 100', icon: '🏫' },
                  { name: 'Ambulance', role: 'Medical Emergency', phone: '193', icon: '🚑' },
                  { name: 'Police', role: 'Security Emergency', phone: '191 / 18555', icon: '👮' },
                  { name: 'Fire Service', role: 'Fire Emergency', phone: '192', icon: '🚒' },
                ].map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 12, background: '#f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 18 }}>{c.icon}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{c.role}</div>
                      </div>
                    </div>
                    <a href={`tel:${c.phone}`}
                      style={{ width: 34, height: 34, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                      <Phone size={14} color="#dc2626" />
                    </a>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
