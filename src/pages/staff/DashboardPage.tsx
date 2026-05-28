// src/pages/staff/DashboardPage.tsx
import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import {
  LogOut, Bell, Wallet, CalendarCheck, FileText,
  TrendingUp, Clock, CheckCircle, XCircle, Megaphone
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function StaffDashboard() {
  const { user, signOut } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)

  const [announcements, setAnnouncements] = useState<any[]>([])
  const [attendance, setAttendance] = useState<{ present: number; absent: number; late: number; total: number }>({ present: 0, absent: 0, late: 0, total: 0 })
  const [payslips, setPayslips] = useState<any[]>([])

  useEffect(() => {
    setTimeout(() => setMounted(true), 60)
    if (user?.school_id) loadDashboard()
  }, [user?.school_id])

  async function loadDashboard() {
    setLoading(true)
    try {
      const sid = user!.school_id

      const [annRes, attRes, payRes] = await Promise.all([
        // School-wide announcements for all / staff
        supabase
          .from('announcements')
          .select('*')
          .eq('school_id', sid)
          .or('target_role.eq.all,target_role.eq.staff')
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(5),

        // Staff attendance for current month
        supabase
          .from('staff_attendance')
          .select('status')
          .eq('staff_user_id', user!.id)
          .gte('date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)),

        // Payslips / salary history
        supabase
          .from('salary_records')
          .select('month, net_pay, gross_pay, deductions, status')
          .eq('staff_user_id', user!.id)
          .order('month', { ascending: false })
          .limit(6),
      ])

      setAnnouncements(annRes.data || [])

      const att = (attRes.data || []).reduce(
        (acc: any, r: any) => {
          acc.total++
          if (r.status === 'present') acc.present++
          else if (r.status === 'absent') acc.absent++
          else if (r.status === 'late') acc.late++
          return acc
        },
        { present: 0, absent: 0, late: 0, total: 0 }
      )
      setAttendance(att)
      setPayslips(payRes.data || [])
    } catch (err: any) {
      toast.error(err.message || 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const attRate = attendance.total > 0 ? Math.round(((attendance.present + attendance.late) / attendance.total) * 100) : null

  const TYPE_COLOR: any = {
    announcement: { color: '#6d28d9', bg: '#f5f3ff', icon: '📢' },
    meeting: { color: '#0369a1', bg: '#eff6ff', icon: '📅' },
    reminder: { color: '#d97706', bg: '#fffbeb', icon: '⏰' },
    exam: { color: '#dc2626', bg: '#fef2f2', icon: '📝' },
    holiday: { color: '#16a34a', bg: '#f0fdf4', icon: '🎉' },
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@700&display=swap');

        @keyframes _sfu { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }

        .staff-hero {
          background: linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%);
          border-radius: 12px;
          padding: 40px 48px;
          color: white;
          position: relative;
          overflow: hidden;
          margin-bottom: 32px;
          box-shadow: 0 20px 40px rgba(30,27,75,0.25);
          animation: _sfu .5s ease both;
        }
        .staff-hero::before {
          content:"";
          position:absolute;top:-80px;right:-80px;
          width:280px;height:280px;
          background:rgba(255,255,255,0.06);
          border-radius:50%;
        }
        .staff-hero::after {
          content:"";
          position:absolute;bottom:-100px;right:120px;
          width:200px;height:200px;
          background:rgba(255,255,255,0.04);
          border-radius:50%;
        }

        .stat-card {
          background:#fff;
          border-radius: 8px;
          padding:24px;
          border:1px solid #e2e8f0;
          box-shadow:0 2px 8px rgba(0,0,0,0.04);
          display:flex;
          align-items:center;
          gap:16px;
          transition:all .2s;
        }
        .stat-card:hover { box-shadow:0 8px 24px rgba(0,0,0,0.07); transform:translateY(-2px); }

        .ann-card {
          background:#fff;
          border-radius:18px;
          border:1.5px solid #f1f5f9;
          padding:20px;
          transition:all .2s;
        }
        .ann-card:hover { border-color:#ddd6fe; box-shadow:0 6px 20px rgba(109,40,217,0.06); }

        .pay-row { display:flex; justify-content:space-between; align-items:center; padding:14px 0; border-bottom:1px solid #f1f5f9; }
        .pay-row:last-child { border-bottom:none; }

        @media (max-width:900px) {
          .staff-hero { padding:28px 24px !important; }
          .stats-grid { grid-template-columns:1fr 1fr !important; }
          .main-grid { grid-template-columns:1fr !important; }
          .header-row { flex-direction:column !important; gap:12px !important; }
        }
        @media (max-width:500px) {
          .stats-grid { grid-template-columns:1fr !important; }
        }
      `}</style>

      <div style={{ fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', opacity: mounted ? 1 : 0, transition: 'opacity .4s ease', maxWidth: 1200, margin: '0 auto', padding: '24px 20px' }}>

        {/* Top bar */}
        <div className="header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#0f172a', margin: 0 }}>Staff Portal</h1>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Welcome back, {user?.full_name}</p>
          </div>
          <button
            onClick={() => signOut()}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 12, background: '#fef2f2', color: '#b91c1c', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
          >
            <LogOut size={15} /> Sign Out
          </button>
        </div>

        {/* Hero */}
        <div className="staff-hero">
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ background: 'rgba(255,255,255,0.15)', padding: '6px 14px', borderRadius: 8, display: 'inline-block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>
              🏢 Staff Portal
            </div>
            <h2 style={{ fontSize: 34, fontWeight: 800, margin: '0 0 8px', lineHeight: 1.2 }}>
              Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.full_name?.split(' ')[0]}! 👋
            </h2>
            <p style={{ fontSize: 15, opacity: 0.85, margin: 0, maxWidth: 520 }}>
              Here's your workspace overview — attendance, payroll history, and school notices, all in one place.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, marginBottom: 32, animation: '_sfu .5s ease .1s both' }}>
          {[
            {
              label: 'Monthly Attendance',
              value: attRate !== null ? `${attRate}%` : '—',
              sub: `${attendance.present} present · ${attendance.absent} absent`,
              icon: <CalendarCheck size={22} />, color: '#16a34a', bg: '#f0fdf4'
            },
            {
              label: 'Days Present',
              value: loading ? '—' : attendance.present,
              sub: 'This month',
              icon: <CheckCircle size={22} />, color: '#6d28d9', bg: '#f5f3ff'
            },
            {
              label: 'Days Late / Absent',
              value: loading ? '—' : attendance.absent + attendance.late,
              sub: `${attendance.late} late · ${attendance.absent} absent`,
              icon: <XCircle size={22} />, color: '#dc2626', bg: '#fef2f2'
            },
            {
              label: 'Last Net Pay',
              value: payslips[0] ? `GH₵${Number(payslips[0].net_pay).toLocaleString()}` : '—',
              sub: payslips[0]?.month || 'No record yet',
              icon: <Wallet size={22} />, color: '#0284c7', bg: '#eff6ff'
            },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <div style={{ width: 50, height: 50, borderRadius: 14, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>{s.label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{s.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div className="main-grid" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 28, animation: '_sfu .5s ease .2s both' }}>

          {/* Announcements */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <Bell size={18} color="#6d28d9" />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>School Announcements</h3>
            </div>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Loading…</div>
            ) : announcements.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', background: 'var(--bg-card)', borderRadius: 8, border: '1.5px dashed #e2e8f0' }}>
                <Megaphone size={36} color="#ddd6fe" style={{ marginBottom: 12 }} />
                <p style={{ color: '#94a3b8', fontSize: 14 }}>No announcements yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {announcements.map((a, i) => {
                  const tc = TYPE_COLOR[a.type] || TYPE_COLOR.announcement
                  return (
                    <div key={a.id} className="ann-card" style={{ borderLeft: a.is_pinned ? `4px solid #fbbf24` : undefined, animationDelay: `${i * 0.05}s` }}>
                      <div style={{ display: 'flex', gap: 14 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 14, background: tc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                          {tc.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: tc.color, background: tc.bg, padding: '3px 8px', borderRadius: 99 }}>{a.type}</span>
                            {a.is_pinned && <span style={{ fontSize: 10, color: '#d97706', fontWeight: 700 }}>📌 Pinned</span>}
                            <span style={{ marginLeft: 'auto', fontSize: 11, color: '#94a3b8' }}>{new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>{a.title}</div>
                          <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as any}>{a.body}</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Payroll History */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <TrendingUp size={18} color="#0284c7" />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>Payroll History</h3>
            </div>
            <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              {loading ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Loading…</div>
              ) : payslips.length === 0 ? (
                <div style={{ padding: 48, textAlign: 'center' }}>
                  <FileText size={36} color="#cbd5e1" style={{ marginBottom: 12 }} />
                  <p style={{ color: '#94a3b8', fontSize: 13 }}>No payroll records found.<br />Contact HR to set up your salary profile.</p>
                </div>
              ) : (
                <div style={{ padding: '8px 24px' }}>
                  {payslips.map((p, i) => (
                    <div key={i} className="pay-row">
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{p.month}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>Gross: GH₵{Number(p.gross_pay).toLocaleString()} · Deductions: GH₵{Number(p.deductions || 0).toLocaleString()}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#10b981' }}>GH₵{Number(p.net_pay).toLocaleString()}</div>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                          background: p.status === 'paid' ? '#f0fdf4' : '#fffbeb',
                          color: p.status === 'paid' ? '#16a34a' : '#d97706',
                          textTransform: 'uppercase'
                        }}>{p.status || 'pending'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* This Month Attendance Breakdown */}
            <div style={{ marginTop: 20, background: 'var(--bg-card)', borderRadius: 8, border: '1px solid #e2e8f0', padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Clock size={16} color="#6d28d9" />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>This Month's Attendance</span>
              </div>
              {attendance.total === 0 ? (
                <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '12px 0' }}>No attendance records for this month yet.</p>
              ) : (
                <>
                  {[
                    { label: 'Present', val: attendance.present, color: '#16a34a', bg: '#f0fdf4' },
                    { label: 'Late', val: attendance.late, color: '#d97706', bg: '#fffbeb' },
                    { label: 'Absent', val: attendance.absent, color: '#dc2626', bg: '#fef2f2' },
                  ].map(s => (
                    <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14 }}>{s.val}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                          <span style={{ fontWeight: 600 }}>{s.label}</span>
                          <span>{attendance.total > 0 ? Math.round((s.val / attendance.total) * 100) : 0}%</span>
                        </div>
                        <div style={{ height: 6, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${attendance.total > 0 ? (s.val / attendance.total) * 100 : 0}%`, background: s.color, borderRadius: 4, transition: 'width 1s ease' }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
