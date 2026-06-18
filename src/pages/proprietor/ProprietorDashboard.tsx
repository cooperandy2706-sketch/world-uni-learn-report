import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useCurrentTerm, useCurrentAcademicYear } from '../../hooks/useSettings'
import FlaskLoader from '../../components/ui/FlaskLoader'
import { Users, UserCheck, TrendingUp, Wallet, ArrowRight, Banknote, Calendar, BarChart3, Receipt } from 'lucide-react'
import { useAutoRefresh } from "../../hooks/useAutoRefresh"
import { useProprietorScope } from '../../hooks/useProprietorScope'
import ProprietorBranchSelector from './ProprietorBranchSelector'
import { formatCurrency } from '../../utils/currency'

function AnimNum({ to, duration = 900, prefix = '', suffix = '', currency = '' }: { to: number; duration?: number; prefix?: string; suffix?: string; currency?: string }) {
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
  
  const displayVal = currency ? formatCurrency(val, currency) : val.toLocaleString()
  return <>{prefix}{displayVal}{suffix}</>
}

export default function ProprietorDashboard() {
  useAutoRefresh(loadDashboardData)
  const { user } = useAuth()
  const navigate = useNavigate()
  const userSchool = user?.school as any
  const { data: term } = useCurrentTerm()
  const { data: year } = useCurrentAcademicYear()
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const { activeSchoolIds } = useProprietorScope()

  const [schoolCurrency, setSchoolCurrency] = useState('GHS')

  // Metrics
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    staff: 0,
    revenueToday: 0,
    revenueWeek: 0,
    revenueOverall: 0,
    dailyFeesToday: 0,
  })

  useEffect(() => { setTimeout(() => setMounted(true), 60) }, [])

  useEffect(() => {
    if (activeSchoolIds.length === 0) return
    loadDashboardData()
  }, [activeSchoolIds, term?.id])

  async function loadDashboardData() {
    try {
      const now = new Date()
      // Local date string for today
      const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0')
      const sevenDaysAgoTime = now.getTime() - (7 * 24 * 60 * 60 * 1000)

      // Fetch school currency
      if (activeSchoolIds.length > 0) {
        const { data: sch } = await supabase.from('schools').select('currency_code').eq('id', activeSchoolIds[0]).maybeSingle()
        if (sch?.currency_code) setSchoolCurrency(sch.currency_code)
      }

      // Basic counts
      const [
        { count: students },
        { count: teachers },
        { count: staff },
      ] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }).in('school_id', activeSchoolIds).eq('is_active', true),
        supabase.from('users').select('*', { count: 'exact', head: true }).in('school_id', activeSchoolIds).eq('role', 'teacher'),
        supabase.from('users').select('*', { count: 'exact', head: true }).in('school_id', activeSchoolIds).in('role', ['bursar', 'security', 'driver', 'nurse', 'librarian', 'staff', 'admin']),
      ])

      // High-level financials for the active term
      // If term is active, fetch from term. If not, fetch last 3 months to be safe.
      let queryCol = term?.id ? 'term_id' : null
      let queryVal = term?.id ? term.id : null

      const fallbackDate = new Date()
      fallbackDate.setMonth(fallbackDate.getMonth() - 3)
      const fallbackStr = fallbackDate.toISOString()

      let qPayments = supabase.from('fee_payments').select('amount_paid, payment_date').in('school_id', activeSchoolIds)
      let qDaily = supabase.from('daily_fees_collected').select('amount, date').in('school_id', activeSchoolIds)
      let qIncome = supabase.from('income_records').select('amount, date').in('school_id', activeSchoolIds)

      if (queryCol && queryVal) {
        qPayments = qPayments.eq(queryCol, queryVal)
        qDaily = qDaily.eq(queryCol, queryVal)
        qIncome = qIncome.eq(queryCol, queryVal)
      } else {
        qPayments = qPayments.gte('payment_date', fallbackStr)
        qDaily = qDaily.gte('date', fallbackStr)
        qIncome = qIncome.gte('date', fallbackStr)
      }

      const [
        { data: payments },
        { data: dailyFees },
        { data: incomes }
      ] = await Promise.all([qPayments, qDaily, qIncome])

      let todayRev = 0
      let weekRev = 0
      let overallRev = 0
      let todayDailyFees = 0

      const processRecord = (amt: any, dateStr: string, isDaily: boolean = false) => {
        const value = Number(amt) || 0
        overallRev += value
        
        if (dateStr) {
          const recDate = new Date(dateStr)
          if (recDate.getTime() >= sevenDaysAgoTime) weekRev += value
          if (dateStr.startsWith(todayStr)) {
            todayRev += value
            if (isDaily) todayDailyFees += value
          }
        }
      }

      (payments || []).forEach(p => processRecord(p.amount_paid, p.payment_date));
      (dailyFees || []).forEach(d => processRecord(d.amount, d.date, true));
      (incomes || []).forEach(i => processRecord(i.amount, i.date));

      setStats({
        students: students ?? 0,
        teachers: teachers ?? 0,
        staff: staff ?? 0,
        revenueToday: todayRev,
        revenueWeek: weekRev,
        revenueOverall: overallRev,
        dailyFeesToday: todayDailyFees,
      })
      
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <FlaskLoader fullScreen={false} label="Loading executive summary…" />

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800;900&family=Outfit:wght@600;700;800;900&display=swap');
        
        .proprietor-portal {
          font-family: 'DM Sans', system-ui, sans-serif;
          opacity: ${mounted ? 1 : 0};
          transition: opacity 0.5s ease-out;
          max-width: 800px; /* Kept narrow for optimal mobile reading / single column */
          margin: 0 auto;
          color: #0f172a;
          padding: 16px 16px 100px;
          min-height: 100vh;
        }

        .senior-card {
          background: #ffffff;
          border-radius: 20px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.06);
          padding: 24px;
          margin-bottom: 20px;
          border: 2px solid #f1f5f9;
          transition: transform 0.2s, box-shadow 0.2s;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          display: block;
          text-decoration: none;
        }

        .senior-card:active {
          transform: scale(0.98);
        }

        .senior-card::after {
          content: '→';
          position: absolute;
          right: 24px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 28px;
          color: #cbd5e1;
          font-weight: 900;
          opacity: 0.5;
        }

        .value-large {
          font-family: 'Outfit', sans-serif;
          font-size: 42px;
          font-weight: 900;
          letter-spacing: -0.03em;
          line-height: 1.1;
          margin: 8px 0;
          color: #0f172a;
        }

        .label-large {
          font-size: 18px;
          font-weight: 800;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .icon-box {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }

        /* Responsive bumps for extremely large screens, but mostly optimized for mobile/tablets */
        @media (min-width: 600px) {
          .proprietor-portal { padding: 32px 24px 100px; }
          .value-large { font-size: 52px; }
          .label-large { font-size: 20px; }
          .senior-card { padding: 32px; border-radius: 24px; }
        }
      `}</style>

      <div className="proprietor-portal">
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: '#0f172a', margin: '0 0 12px', letterSpacing: '-0.02em', lineHeight: 1.1, fontFamily: '"Outfit", sans-serif' }}>
            My School Summary
          </h1>
          <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 16, color: '#475569', fontWeight: 700 }}>
              {userSchool?.name || 'Acadera'} 
            </div>
            <ProprietorBranchSelector />
          </div>
        </div>

        {/* ── MASSIVE METRIC BUTTONS (MOBILE FIRST) ── */}

        {/* TODAY'S INCOME */}
        <div className="senior-card" onClick={() => navigate('/proprietor/finances')} style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
          <div className="icon-box" style={{ background: '#16a34a', color: '#fff', boxShadow: '0 8px 16px rgba(22, 163, 74, 0.2)' }}>
            <Banknote size={32} strokeWidth={2.5} />
          </div>
          <div className="label-large" style={{ color: '#16a34a' }}>Today's Income</div>
          <div className="value-large">
            <AnimNum to={stats.revenueToday} currency={schoolCurrency} />
          </div>
          <p style={{ margin: 0, fontSize: 15, color: '#15803d', fontWeight: 600 }}>Fees & Daily Collections</p>
        </div>

        {/* DAILY FEES TODAY */}
        <div className="senior-card" onClick={() => navigate('/proprietor/finances')} style={{ background: '#f0fdfa', borderColor: '#ccfbf1' }}>
          <div className="icon-box" style={{ background: '#0d9488', color: '#fff', boxShadow: '0 8px 16px rgba(13, 148, 136, 0.2)' }}>
            <Receipt size={32} strokeWidth={2.5} />
          </div>
          <div className="label-large" style={{ color: '#0d9488' }}>Total Daily Fees (Today)</div>
          <div className="value-large">
            <AnimNum to={stats.dailyFeesToday} currency={schoolCurrency} />
          </div>
          <p style={{ margin: 0, fontSize: 15, color: '#0f766e', fontWeight: 600 }}>Feeding & Studies collected today</p>
        </div>

        {/* WEEK'S INCOME */}
        <div className="senior-card" onClick={() => navigate('/proprietor/finances')} style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
          <div className="icon-box" style={{ background: '#2563eb', color: '#fff', boxShadow: '0 8px 16px rgba(37, 99, 235, 0.2)' }}>
            <Calendar size={32} strokeWidth={2.5} />
          </div>
          <div className="label-large" style={{ color: '#2563eb' }}>Last 7 Days</div>
          <div className="value-large">
            <AnimNum to={stats.revenueWeek} currency={schoolCurrency} />
          </div>
          <p style={{ margin: 0, fontSize: 15, color: '#1d4ed8', fontWeight: 600 }}>Total weekly collections</p>
        </div>

        {/* OVERALL REVENUE */}
        <div className="senior-card" onClick={() => navigate('/proprietor/finances')} style={{ background: '#fdf4ff', borderColor: '#fbcfe8' }}>
          <div className="icon-box" style={{ background: '#c026d3', color: '#fff', boxShadow: '0 8px 16px rgba(192, 38, 211, 0.2)' }}>
            <Wallet size={32} strokeWidth={2.5} />
          </div>
          <div className="label-large" style={{ color: '#c026d3' }}>Overall Amount (Term)</div>
          <div className="value-large">
            <AnimNum to={stats.revenueOverall} currency={schoolCurrency} />
          </div>
          <p style={{ margin: 0, fontSize: 15, color: '#a21caf', fontWeight: 600 }}>Total revenue recorded this term</p>
        </div>

        {/* STAFF & TEACHERS */}
        <div className="senior-card" onClick={() => navigate('/proprietor/staff')} style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
          <div className="icon-box" style={{ background: '#d97706', color: '#fff', boxShadow: '0 8px 16px rgba(217, 119, 6, 0.2)' }}>
            <UserCheck size={32} strokeWidth={2.5} />
          </div>
          <div className="label-large" style={{ color: '#d97706' }}>Total Staff Members</div>
          <div className="value-large">
            <AnimNum to={stats.teachers + stats.staff} />
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
            <span style={{ fontSize: 16, color: '#b45309', fontWeight: 700 }}>{stats.teachers} Teachers</span>
            <span style={{ fontSize: 16, color: '#b45309', fontWeight: 700 }}>{stats.staff} Support Staff</span>
          </div>
        </div>

        {/* STUDENTS */}
        <div className="senior-card" onClick={() => navigate('/proprietor/students')} style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
          <div className="icon-box" style={{ background: '#475569', color: '#fff' }}>
            <Users size={32} strokeWidth={2.5} />
          </div>
          <div className="label-large" style={{ color: '#475569' }}>Active Students</div>
          <div className="value-large">
            <AnimNum to={stats.students} />
          </div>
          <p style={{ margin: 0, fontSize: 15, color: '#334155', fontWeight: 600 }}>Currently enrolled</p>
        </div>

        <div style={{ height: 40 }} />
      </div>
    </>
  )
}
