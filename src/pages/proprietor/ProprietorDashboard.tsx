import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useCurrentTerm, useCurrentAcademicYear } from '../../hooks/useSettings'
import FlaskLoader from '../../components/ui/FlaskLoader'
import { Users, UserCheck, TrendingUp, TrendingDown, Wallet, BookOpen, GraduationCap, LayoutDashboard, Target } from 'lucide-react'

function AnimNum({ to, duration = 900, prefix = '', suffix = '' }: { to: number; duration?: number; prefix?: string; suffix?: string }) {
  const [val, setVal] = useState(0)
  const ref = useRef(false)
  
  useEffect(() => {
    if (ref.current) return
    ref.current = true
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(ease * to))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [to, duration])
  
  return <>{prefix}{val.toLocaleString()}{suffix}</>
}

export default function ProprietorDashboard() {
  const { user } = useAuth()
  const userSchool = user?.school as any
  const { data: term } = useCurrentTerm()
  const { data: year } = useCurrentAcademicYear()
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Metrics
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    staff: 0,
    revenue: 0,
    expenses: 0,
    outstanding: 0,
  })

  const [financeData, setFinanceData] = useState<{ month: string, revenue: number, expenses: number }[]>([])

  useEffect(() => { setTimeout(() => setMounted(true), 60) }, [])

  useEffect(() => {
    if (!user?.school_id) return
    loadDashboardData()
  }, [user?.school_id, term?.id])

  async function loadDashboardData() {
    const sid = user!.school_id
    
    try {
      // Basic counts
      const [
        { count: students },
        { count: teachers },
        { count: staff },
      ] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }).eq('school_id', sid).eq('is_active', true),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('school_id', sid).eq('role', 'teacher'),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('school_id', sid).in('role', ['bursar', 'security', 'driver', 'nurse', 'librarian', 'staff']),
      ])

      // High-level financials for the current year (simplified)
      // Since we don't have a complex aggregated view, we will fetch recent payments and expenses
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      
      const [
        { data: payments },
        { data: expenses }
      ] = await Promise.all([
        supabase.from('fee_payments').select('amount_paid, payment_date').eq('school_id', sid).gte('payment_date', sixMonthsAgo.toISOString()),
        supabase.from('expense_records').select('amount, date').eq('school_id', sid).gte('date', sixMonthsAgo.toISOString())
      ])

      let totalRev = 0
      let totalExp = 0
      
      const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
      const last6Months = []
      for (let i = 5; i >= 0; i--) {
        const d = new Date()
        d.setMonth(d.getMonth() - i)
        last6Months.push({ 
          key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
          label: months[d.getMonth()]
        })
      }

      const aggregated = last6Months.map(m => {
        const rev = (payments || [])
          .filter(p => p.payment_date.startsWith(m.key))
          .reduce((sum, p) => sum + Number(p.amount_paid), 0)
        const exp = (expenses || [])
          .filter(e => e.date.startsWith(m.key))
          .reduce((sum, e) => sum + Number(e.amount), 0)
          
        totalRev += rev
        totalExp += exp
        
        return { month: m.label, revenue: rev, expenses: exp }
      })

      setFinanceData(aggregated)
      setStats({
        students: students ?? 0,
        teachers: teachers ?? 0,
        staff: staff ?? 0,
        revenue: totalRev,
        expenses: totalExp,
        outstanding: 0 // Mocked for now to avoid complex query on dashboard init
      })
      
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <FlaskLoader fullScreen={false} label="Loading executive summary…" />

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        
        .proprietor-portal {
          font-family: 'Outfit', system-ui, sans-serif;
          opacity: ${mounted ? 1 : 0};
          transition: opacity 0.5s ease-out;
          max-width: 1440px;
          margin: 0 auto;
          color: #0f172a;
          padding: 20px 40px 60px;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .exec-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.8);
          border-radius: 24px;
          box-shadow: 0 10px 40px -10px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,1);
          padding: 32px;
          animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
          position: relative;
          overflow: hidden;
        }

        .exec-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 4px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent);
          opacity: 0;
          transition: opacity 0.3s;
        }
        
        .exec-card:hover::before {
          opacity: 1;
        }

        .metric-value {
          font-size: 42px;
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.1;
          margin: 12px 0 4px;
        }

        .chart-container {
          display: flex;
          align-items: flex-end;
          height: 200px;
          gap: 16px;
          margin-top: 32px;
          padding-top: 20px;
          border-top: 1px dashed rgba(0,0,0,0.1);
        }

        .chart-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          height: 100%;
          justify-content: flex-end;
        }

        .bar-group {
          display: flex;
          gap: 4px;
          align-items: flex-end;
          width: 100%;
          justify-content: center;
          height: 100%;
        }

        .bar {
          width: 16px;
          border-radius: 8px 8px 0 0;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .bar:hover {
          filter: brightness(1.1);
          transform: scaleY(1.05);
          transform-origin: bottom;
        }

        .charts-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
        }

        @media (max-width: 768px) {
          .proprietor-portal { padding: 16px 20px 80px; }
          .exec-card { padding: 24px; }
          .metric-value { font-size: 32px; }
          .charts-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="proprietor-portal">
        {/* Header */}
        <div style={{ marginBottom: 48, animation: 'slideUp 0.4s ease both' }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            Executive Overview
          </h1>
          <p style={{ fontSize: 16, color: '#64748b', margin: 0, fontWeight: 500 }}>
            {userSchool?.name || 'World Uni-Learn'} • {year?.name} • {term?.name}
          </p>
        </div>

        {/* Top KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 24 }}>
          
          <div className="exec-card" style={{ animationDelay: '0.1s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ width: 48, height: 48, borderRadius: 16, background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                <Users size={24} strokeWidth={2.5} />
              </div>
              <span style={{ background: '#ecfdf5', color: '#059669', padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 700 }}>Active</span>
            </div>
            <div className="metric-value" style={{ color: '#0f172a' }}>
              <AnimNum to={stats.students} />
            </div>
            <div style={{ fontSize: 15, color: '#64748b', fontWeight: 500 }}>Total Enrolled Students</div>
          </div>

          <div className="exec-card" style={{ animationDelay: '0.2s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ width: 48, height: 48, borderRadius: 16, background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
                <UserCheck size={24} strokeWidth={2.5} />
              </div>
            </div>
            <div className="metric-value" style={{ color: '#0f172a' }}>
              <AnimNum to={stats.teachers + stats.staff} />
            </div>
            <div style={{ fontSize: 15, color: '#64748b', fontWeight: 500 }}>Total Staff Members</div>
            <div style={{ display: 'flex', gap: 12, marginTop: 12, fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>
              <span>{stats.teachers} Teachers</span>
              <span>•</span>
              <span>{stats.staff} Admin/Ops</span>
            </div>
          </div>

          <div className="exec-card" style={{ animationDelay: '0.3s', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#fff', border: 'none' }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 150, height: 150, background: 'radial-gradient(circle, rgba(56,189,248,0.2) 0%, transparent 70%)', borderRadius: '50%' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
              <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
                <Wallet size={24} strokeWidth={2.5} />
              </div>
              <span style={{ background: 'rgba(56,189,248,0.2)', color: '#38bdf8', padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 700 }}>6 Months</span>
            </div>
            <div className="metric-value" style={{ color: '#fff', position: 'relative', zIndex: 1 }}>
              <AnimNum prefix="GH₵ " to={stats.revenue} />
            </div>
            <div style={{ fontSize: 15, color: '#94a3b8', fontWeight: 500, position: 'relative', zIndex: 1 }}>Gross Revenue</div>
          </div>

        </div>

        {/* Charts & Deep Dives */}
        <div className="charts-grid">
          
          <div className="exec-card" style={{ animationDelay: '0.4s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 4px', color: '#0f172a' }}>Financial Health</h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: 14, fontWeight: 500 }}>Revenue vs Expenses (Last 6 Months)</p>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#64748b' }}>
                  <span style={{ width: 12, height: 12, borderRadius: 4, background: '#3b82f6' }} /> Revenue
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#64748b' }}>
                  <span style={{ width: 12, height: 12, borderRadius: 4, background: '#f43f5e' }} /> Expenses
                </div>
              </div>
            </div>

            <div className="chart-container">
              {financeData.map((d, i) => {
                const maxVal = Math.max(...financeData.map(m => Math.max(m.revenue, m.expenses)), 1000)
                const revH = Math.max(5, (d.revenue / maxVal) * 100)
                const expH = Math.max(5, (d.expenses / maxVal) * 100)
                
                return (
                  <div key={i} className="chart-col">
                    <div className="bar-group">
                      <div className="bar" style={{ height: `${revH}%`, background: 'linear-gradient(to top, #2563eb, #60a5fa)' }} title={`Revenue: ${d.revenue}`} />
                      <div className="bar" style={{ height: `${expH}%`, background: 'linear-gradient(to top, #e11d48, #fb7185)' }} title={`Expenses: ${d.expenses}`} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>{d.month}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="exec-card" style={{ animationDelay: '0.5s', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 24px', color: '#0f172a' }}>Quick Deep Dives</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
              {[
                { to: '/proprietor/analytics', label: 'Academic Performance', icon: GraduationCap, color: '#8b5cf6', bg: '#f5f3ff' },
                { to: '/proprietor/finances', label: 'Financial Reports', icon: TrendingUp, color: '#10b981', bg: '#ecfdf5' },
                { to: '/proprietor/students', label: 'Student Demographics', icon: Users, color: '#3b82f6', bg: '#eff6ff' },
                { to: '/proprietor/staff', label: 'Staff & Payroll', icon: UserCheck, color: '#f59e0b', bg: '#fffbeb' },
              ].map(link => (
                <Link key={link.to} to={link.to} style={{ 
                  display: 'flex', alignItems: 'center', gap: 16, padding: '16px', 
                  background: 'rgba(255,255,255,0.5)', borderRadius: 16, textDecoration: 'none',
                  border: '1px solid rgba(0,0,0,0.05)', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateX(4px)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.5)'; e.currentTarget.style.transform = 'none' }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: link.bg, color: link.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <link.icon size={20} strokeWidth={2.5} />
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#334155' }}>{link.label}</span>
                  <span style={{ marginLeft: 'auto', color: '#cbd5e1' }}>→</span>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
