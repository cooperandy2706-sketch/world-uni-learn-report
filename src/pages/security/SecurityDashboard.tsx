// src/pages/security/SecurityDashboard.tsx
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { format, formatDistanceToNow } from 'date-fns'
import {
  Shield, QrCode, Users, LogIn, LogOut,
  AlertTriangle, Clock, Phone, UserCheck,
  TrendingUp, Activity, ChevronRight
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
        background: 'var(--bg-card)', borderRadius: 18, padding: '16px', border: '1.5px solid #f1f5f9',
        display: 'flex', flexDirection: 'column', gap: 8,
        boxShadow: hov ? '0 8px 32px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.04)',
        transform: hov ? 'translateY(-2px)' : 'none',
        transition: 'all .2s', cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
          <Icon size={20} />
        </div>
        {onClick && <ChevronRight size={15} color="#cbd5e1" />}
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginTop: 4 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  )
}

function ScanFeedItem({ scan }: { scan: GateScan }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px',
      borderBottom: '1px solid #f8fafc', animation: 'sc_slide .3s ease',
    }}>
      {scan.photo_url ? (
        <img src={scan.photo_url} style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid #f1f5f9' }} />
      ) : (
        <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, background: scan.direction === 'in' ? '#dcfce7' : '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: scan.direction === 'in' ? '#059669' : '#2563eb' }}>
          {scan.person_name.charAt(0)}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{scan.person_name}</div>
        <div style={{ fontSize: 11, color: '#94a3b8' }}>{scan.person_type === 'student' ? '🎓' : '👩‍🏫'} {scan.class_name || (scan.person_type === 'teacher' ? 'Teaching Staff' : '')}</div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
          <span style={{
            fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 99,
            background: scan.direction === 'in' ? '#dcfce7' : '#dbeafe',
            color: scan.direction === 'in' ? '#15803d' : '#1d4ed8',
          }}>{scan.direction === 'in' ? '↓ IN' : '↑ OUT'}</span>
          {scan.status === 'late' && (
            <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 99, background: '#fef3c7', color: '#b45309' }}>LATE</span>
          )}
        </div>
        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>
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

  useEffect(() => { fetchStats() }, [fetchStats])

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
        .sec-main-grid { display: grid; grid-template-columns: 1fr 320px; gap: 20px; align-items: start; }
        @media (max-width: 768px) {
          .sec-main-grid { grid-template-columns: 1fr !important; }
          .sec-header-row { flex-direction: column !important; gap: 8px !important; }
          .sec-header-date-col { display: none !important; }
          .sec-stat-grid { grid-template-columns: repeat(2,1fr) !important; }
          .sec-quick-grid { grid-template-columns: repeat(2,1fr) !important; }
        }
      `}</style>

      <div className="sec-dash" style={{ paddingBottom: 80 }}>

        {/* Top Header */}
        <div className="sec-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'linear-gradient(135deg,#0f172a,#1e293b)', color: '#fff', padding: '6px 14px', borderRadius: 99, fontSize: 11, fontWeight: 700, marginBottom: 8, letterSpacing: '.04em' }}>
              <Shield size={12} /> SECURITY OPERATIONS CENTER
            </div>
            <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>Gate Control Dashboard</h1>
            <p style={{ color: '#64748b', fontSize: 12, marginTop: 3 }}>
              Welcome, <strong>{user?.full_name}</strong> · {format(currentTime, 'EEE, MMM d yyyy')}
            </p>
          </div>
          <div className="sec-header-date-col" style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#64748b' }}>{format(currentTime, 'EEEE, MMMM d yyyy')}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginTop: 2 }}>See floating clock for live time</div>
          </div>
        </div>

        {/* Live Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, padding: '9px 14px', background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0', flexWrap: 'wrap' }}>
          <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#22c55e', animation: 'pulse_ring 2s infinite', flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#15803d' }}>LIVE — Auto-refreshing in real time</span>
          {stats.lastScanTime && (
            <span style={{ fontSize: 11, color: '#86efac' }}>· Last scan {formatDistanceToNow(new Date(stats.lastScanTime), { addSuffix: true })}</span>
          )}
        </div>

        {/* Stat Cards — 2×2 on mobile */}
        <div className="sec-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
          <StatCard icon={Users} label="Students On Premise" value={loading ? '…' : stats.totalStudentsIn} sub="Currently inside" color="#2563eb" bg="#eff6ff" onClick={() => navigate('/security/gate-attendance')} />
          <StatCard icon={UserCheck} label="Teachers On Premise" value={loading ? '…' : stats.totalTeachersIn} sub="Staff present" color="#7c3aed" bg="#f5f3ff" onClick={() => navigate('/security/gate-attendance')} />
          <StatCard icon={AlertTriangle} label="Late Arrivals" value={loading ? '…' : stats.lateArrivals} sub="After 8:00 AM" color="#d97706" bg="#fffbeb" onClick={() => navigate('/security/gate-attendance?filter=late')} />
          <StatCard icon={LogOut} label="Exits Today" value={loading ? '…' : stats.exits} sub="Left campus" color="#dc2626" bg="#fef2f2" onClick={() => navigate('/security/gate-attendance')} />
        </div>

        {/* Main grid — stacks on mobile */}
        <div className="sec-main-grid">

          {/* Recent Scan Feed */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1.5px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>Live Scan Feed</h2>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>Real-time gate activity · today</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#059669', fontWeight: 700, background: '#dcfce7', padding: '5px 10px', borderRadius: 99 }}>
                <Activity size={12} /> {stats.recentScans.length} scans
              </div>
            </div>

            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#cbd5e1' }}>
                <Clock size={30} style={{ marginBottom: 8 }} />
                <div>Loading…</div>
              </div>
            ) : stats.recentScans.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                <QrCode size={40} style={{ marginBottom: 10, opacity: .3 }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: '#334155', marginBottom: 6 }}>No scans yet today</div>
                <p style={{ fontSize: 13, marginBottom: 18 }}>Gate activity will appear here in real time.</p>
                <button onClick={() => navigate('/security/scanner')}
                  style={{ padding: '11px 22px', borderRadius: 12, border: 'none', background: '#0f172a', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  🔍 Open Gate Scanner
                </button>
              </div>
            ) : (
              <div>
                {stats.recentScans.map(scan => <ScanFeedItem key={scan.id} scan={scan} />)}
                <div onClick={() => navigate('/security/gate-attendance')}
                  style={{ padding: '13px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#2563eb', cursor: 'pointer', borderTop: '1px solid #f1f5f9' }}>
                  View Full Attendance Log →
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Quick Actions */}
            <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1.5px solid #f1f5f9', padding: '18px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>Quick Actions</h3>
              <div className="sec-quick-grid" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Open Gate Scanner', emoji: '📷', path: '/security/scanner', color: '#0f172a' },
                  { label: 'Print Student Tags (QR)', emoji: '🪪', path: '/admin/poster-maker?tab=tags', color: '#7c3aed' },
                  { label: 'View Attendance Log', emoji: '📋', path: '/security/gate-attendance', color: '#2563eb' },
                  { label: 'Register Visitor', emoji: '🚪', path: '/security/visitors', color: '#059669' },
                ].map(({ label, emoji, path, color }) => (
                  <button key={path} onClick={() => navigate(path)}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '1.5px solid #f1f5f9', background: '#f8fafc', color, fontSize: 13, fontWeight: 700, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, transition: 'all .15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f1f5f9' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#f8fafc' }}>
                    <span style={{ fontSize: 18 }}>{emoji}</span> {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Today Summary */}
            <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)', borderRadius: 8, padding: '20px', color: '#fff' }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Today's Summary</h3>
              <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 16 }}>{format(new Date(), 'MMMM d, yyyy')}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Total Scans', value: stats.recentScans.length, color: '#60a5fa' },
                  { label: 'On Premise Now', value: onPremise, color: '#34d399' },
                  { label: 'Late Arrivals', value: stats.lateArrivals, color: '#fbbf24' },
                  { label: 'Exits', value: stats.exits, color: '#f87171' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />
                      <span style={{ fontSize: 13, color: '#cbd5e1' }}>{label}</span>
                    </div>
                    <span style={{ fontSize: 16, fontWeight: 900, color }}>{loading ? '…' : value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Emergency Contacts */}
            <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1.5px solid #f1f5f9', padding: '18px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 7 }}>
                <Phone size={14} color="#dc2626" /> Emergency Contacts
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { name: 'Headteacher', role: 'Admin Office', phone: 'ext. 100', icon: '🏫' },
                  { name: 'Ambulance', role: 'Medical Emergency', phone: '193', icon: '🚑' },
                  { name: 'Police', role: 'Security Emergency', phone: '191 / 18555', icon: '👮' },
                  { name: 'Fire Service', role: 'Fire Emergency', phone: '192', icon: '🚒' },
                ].map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 10px', borderRadius: 10, background: '#f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <span style={{ fontSize: 17 }}>{c.icon}</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{c.name}</div>
                        <div style={{ fontSize: 10, color: '#64748b' }}>{c.role}</div>
                      </div>
                    </div>
                    <a href={`tel:${c.phone}`}
                      style={{ width: 32, height: 32, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                      <Phone size={13} color="#dc2626" />
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
