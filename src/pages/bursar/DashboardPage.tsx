import { useStuckLoadingReload } from '../../hooks/useStuckLoadingReload'
import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { useCurrentTerm } from '../../hooks/useSettings'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import { formatCurrency } from '../../utils/currency'
import {
  DollarSign, TrendingUp, TrendingDown, AlertCircle, Users,
  CreditCard, PiggyBank, Receipt, GraduationCap, FileText, Banknote,
  ArrowRight, Activity, ChevronDown, Zap
} from 'lucide-react'
import FlaskLoader from '../../components/ui/FlaskLoader'
import { getEngagingGreeting } from '../../lib/utils'
import { useAutoRefresh } from "../../hooks/useAutoRefresh";

export default function BursarDashboard() {
    useAutoRefresh(loadDashboard);
  const { setFirstLoadComplete } = useAuthStore()
  const { user } = useAuth()
  const { data: term } = useCurrentTerm()
  const schoolId = user?.school_id ?? ''
  const currentYear = new Date().getFullYear()
  const { timeGreeting, roleMessage } = getEngagingGreeting(user?.role)

  const [stats, setStats] = useState({ totalCollected: 0, tuitionCollected: 0, dailyCollected: 0, totalExpenses: 0, totalIncome: 0, payrollPaid: 0, outstandingStudents: 0, scholarshipCount: 0, lastTermArrears: 0, currentTermArrears: 0, overallDebt: 0 })
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [recentPayments, setRecentPayments] = useState<any[]>([])
  const [expenseByCategory, setExpenseByCategory] = useState<any[]>([])
  const [schoolCurrency, setSchoolCurrency] = useState('GHS')
  const [loading, setLoading] = useState(true)
  useStuckLoadingReload(loading)
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  
  const [qaOpen, setQaOpen] = useState(false)
  const qaRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (qaRef.current && !qaRef.current.contains(e.target as Node)) setQaOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggleFlip = (idx: number) => {
    setFlippedCards(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    )
  }

  const [exchangeRate, setExchangeRate] = useState<number>(1)

  // Helper to get the correct numeric value in USD
  const getDisplayValue = (val: number) => {
    return val * exchangeRate
  }

  useEffect(() => {
    if (!schoolId) return
    loadDashboard()
  }, [schoolId, term?.id])

  async function loadDashboard() {
    setLoading(true)
    try {
      const resData = await Promise.all([
        supabase.from('fee_payments').select('amount_paid, created_at').eq('school_id', schoolId).gte('created_at', `${currentYear}-01-01`),
        supabase.from('income_records').select('amount, category, date').eq('school_id', schoolId).gte('date', `${currentYear}-01-01`),
        supabase.from('expense_records').select('amount, category, date').eq('school_id', schoolId).gte('date', `${currentYear}-01-01`),
        supabase.from('staff_payroll').select('net_salary, is_paid, created_at').eq('school_id', schoolId).gte('created_at', `${currentYear}-01-01`),
        supabase.from('fee_payments').select('*, student:students(full_name, student_id, class:classes(name)), fee_structure:fee_structures(fee_name)').eq('school_id', schoolId).order('created_at', { ascending: false }).limit(6),
        supabase.from('students').select('id, fees_arrears, class_id, scholarship_percentage, scholarship_type, daily_fee_mode').eq('school_id', schoolId).eq('is_active', true),
        supabase.from('fee_structures').select('*').eq('school_id', schoolId).eq('term_id', term?.id),
        supabase.from('daily_fee_class_rates').select('*').eq('school_id', schoolId).eq('term_id', term?.id),
        supabase.from('daily_fees_collected').select('student_id, amount, fee_type').eq('school_id', schoolId).eq('term_id', term?.id),
        supabase.from('fee_payments').select('amount_paid, student_id').eq('school_id', schoolId).eq('term_id', term?.id),
        supabase.from('daily_fees_collected').select('amount, date').eq('school_id', schoolId).gte('date', `${currentYear}-01-01`),
        supabase.from('attendance').select('student_id, days_present').eq('term_id', term?.id),
        supabase.from('schools').select('currency_code').eq('id', schoolId).maybeSingle()
      ])

      const [paymentsRes, incomeRes, expensesRes, payrollRes, recentRes, studentsRes, structRes, dailyConfRes, dailyCollRes, termPaymentsRes, dailyCollFullYearRes, attendanceRes, schoolRes] = resData as any

      let currencyCode = 'GHS'
      if (schoolRes?.data?.currency_code) {
        currencyCode = schoolRes.data.currency_code
        setSchoolCurrency(currencyCode)
      }

      // Fetch live exchange rate to USD
      try {
        const rateRes = await fetch(`https://open.er-api.com/v6/latest/${currencyCode}`)
        const rateData = await rateRes.json()
        if (rateData?.rates?.USD) {
          setExchangeRate(rateData.rates.USD)
        }
      } catch (err) {
        console.error("Failed to fetch exchange rate", err)
      }

      const dailyTotalFullYear = (dailyCollFullYearRes?.data ?? []).reduce((s: number, r: any) => s + Number(r.amount), 0)
      const tuitionTotal = (paymentsRes?.data ?? []).reduce((s: number, p: any) => s + (p.amount_paid || 0), 0)
      const feeTotal = tuitionTotal + dailyTotalFullYear
      const incomeTotal = (incomeRes?.data ?? []).reduce((s: number, r: any) => s + (r.amount || 0), 0)
      const expenseTotal = (expensesRes?.data ?? []).reduce((s: number, r: any) => s + (r.amount || 0), 0)
      const payrollTotal = (payrollRes?.data ?? []).filter((p: any) => p.is_paid).reduce((s: number, p: any) => s + (p.net_salary || 0), 0)

      // Compute Debts
      let lastArrears = 0
      let termTuitionOwed = 0
      let termDailyOwed = 0
      const structsByClass: Record<string, number> = {}
      for (const s of (structRes.data ?? [])) structsByClass[s.class_id] = (structsByClass[s.class_id] || 0) + (s.amount || 0)
      const paidByStudent: Record<string, number> = {}
      for (const p of (termPaymentsRes.data ?? [])) paidByStudent[p.student_id] = (paidByStudent[p.student_id] || 0) + (p.amount_paid || 0)
      const dailyPaid: Record<string, { f: number, s: number }> = {}
      for (const c of (dailyCollRes.data ?? [])) {
        if (!dailyPaid[c.student_id]) dailyPaid[c.student_id] = { f: 0, s: 0 }
        if (c.fee_type === 'feeding') dailyPaid[c.student_id].f += Number(c.amount)
        if (c.fee_type === 'studies') dailyPaid[c.student_id].s += Number(c.amount)
      }
      const dailyRatesByClass: Record<string, { f: number, s: number }> = {}
      for (const r of (dailyConfRes.data ?? [])) {
        dailyRatesByClass[r.class_id] = { f: Number(r.expected_feeding_fee || 0), s: Number(r.expected_studies_fee || 0) }
      }

      const attMap: Record<string, number> = {}
      for (const a of (attendanceRes?.data ?? [])) attMap[a.student_id] = a.days_present || 0

      const studentsAll = studentsRes.data ?? []
      for (const s of studentsAll) {
        lastArrears += Number(s.fees_arrears || 0)
        const classFee = structsByClass[s.class_id] || 0
        const schPct = s.scholarship_percentage || 0
        const netTuition = classFee - (classFee * (schPct / 100))
        termTuitionOwed += Math.max(0, netTuition - (paidByStudent[s.id] || 0))
        
        const classRates = dailyRatesByClass[s.class_id] || { f: 0, s: 0 }
        const feeMode = s.daily_fee_mode || 'all'
        const feedingRate = feeMode === 'none' ? 0 : classRates.f
        const studiesRate = (feeMode === 'none' || feeMode === 'feeding') ? 0 : classRates.s
        
        const daysPresent = attMap[s.id] || 0
        const expF = feedingRate * daysPresent
        const expS = studiesRate * daysPresent
        
        const { f, s: s_pid } = dailyPaid[s.id] || { f: 0, s: 0 }
        termDailyOwed += Math.max(0, expF - f) + Math.max(0, expS - s_pid)
      }
      const currentArrears = termTuitionOwed + termDailyOwed
      const overallDebt = lastArrears + currentArrears
      const schCount = studentsAll.filter(s => s.scholarship_type && s.scholarship_type !== 'none').length

      // Count students who have any outstanding balance
      let outstandingCount = 0
      for (const s of studentsAll) {
        const classFee = structsByClass[s.class_id] || 0
        const schPct = s.scholarship_percentage || 0
        const netTuition = classFee - (classFee * (schPct / 100))
        const studentTuitionOwed = Math.max(0, netTuition - (paidByStudent[s.id] || 0))
        const classRates = dailyRatesByClass[s.class_id] || { f: 0, s: 0 }
        const feeMode = s.daily_fee_mode || 'all'
        const feedingRate = feeMode === 'none' ? 0 : classRates.f
        const studiesRate = (feeMode === 'none' || feeMode === 'feeding') ? 0 : classRates.s
        const daysPresent = attMap[s.id] || 0
        const { f, s: s_pid } = dailyPaid[s.id] || { f: 0, s: 0 }
        const studentDailyOwed = Math.max(0, feedingRate * daysPresent - f) + Math.max(0, studiesRate * daysPresent - s_pid)
        if (Number(s.fees_arrears || 0) > 0 || studentTuitionOwed > 0 || studentDailyOwed > 0) outstandingCount++
      }

      setStats({ 
        totalCollected: feeTotal, tuitionCollected: tuitionTotal, dailyCollected: dailyTotalFullYear,
        totalIncome: incomeTotal + feeTotal, totalExpenses: expenseTotal + payrollTotal, 
        payrollPaid: payrollTotal, outstandingStudents: outstandingCount, 
        scholarshipCount: schCount, lastTermArrears: lastArrears, currentTermArrears: currentArrears, overallDebt
      })
      setRecentPayments(recentRes?.data ?? [])

      // Monthly bar chart data (income vs expenses)
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
      const monthly = months.map((m, i) => {
        const idx = String(i + 1).padStart(2, '0')
        const prefix = `${currentYear}-${idx}`
        const inc = (incomeRes?.data ?? []).filter((r: any) => (r.date ?? '').startsWith(prefix)).reduce((s: number, r: any) => s + r.amount, 0)
        const exp = (expensesRes?.data ?? []).filter((r: any) => (r.date ?? '').startsWith(prefix)).reduce((s: number, r: any) => s + r.amount, 0)
        const fees = (paymentsRes?.data ?? []).filter((r: any) => (r.created_at ?? '').startsWith(prefix)).reduce((s: number, r: any) => s + r.amount_paid, 0)
        const dailyFeesMonth = (dailyCollFullYearRes?.data ?? []).filter((r: any) => (r.date ?? '').startsWith(prefix)).reduce((s: number, r: any) => s + Number(r.amount), 0)
        const payrollMonth = (payrollRes?.data ?? []).filter((r: any) => r.is_paid && (r.created_at ?? '').startsWith(prefix)).reduce((s: number, r: any) => s + Number(r.net_salary), 0)
        return { month: m, income: inc + fees + dailyFeesMonth, expenses: exp + payrollMonth }
      })
      setMonthlyData(monthly)

      // Expense by category
      const catMap: Record<string, number> = {}
      for (const r of (expensesRes.data ?? [])) {
        catMap[r.category] = (catMap[r.category] || 0) + r.amount
      }
      setExpenseByCategory(Object.entries(catMap).map(([name, value]) => ({ name, value })))
    } finally {
      setLoading(false)
      setFirstLoadComplete(true)
    }
  }

  const COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#ec4899']
  const net = stats.totalIncome - stats.totalExpenses

  const cards = [
    { label: 'Total Fees Collected', nativeValue: formatCurrency(stats.totalCollected, schoolCurrency), usdValue: formatCurrency(getDisplayValue(stats.totalCollected), 'USD'), icon: CreditCard, color: '#10b981', bg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' },
    { label: 'Term Tuition Collected', nativeValue: formatCurrency(stats.tuitionCollected, schoolCurrency), usdValue: formatCurrency(getDisplayValue(stats.tuitionCollected), 'USD'), icon: Banknote, color: '#0ea5e9', bg: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)' },
    { label: 'Daily Fees Collected', nativeValue: formatCurrency(stats.dailyCollected, schoolCurrency), usdValue: formatCurrency(getDisplayValue(stats.dailyCollected), 'USD'), icon: PiggyBank, color: '#f59e0b', bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' },
    { label: 'Net Bank Balance', nativeValue: formatCurrency(net, schoolCurrency), usdValue: formatCurrency(getDisplayValue(net), 'USD'), icon: DollarSign, color: net >= 0 ? '#10b981' : '#6366f1', bg: net >= 0 ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' : 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)' },
    { label: 'Overall Total Debt', nativeValue: formatCurrency(stats.overallDebt, schoolCurrency), usdValue: formatCurrency(getDisplayValue(stats.overallDebt), 'USD'), icon: AlertCircle, color: '#ef4444', bg: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)' },
    { label: 'Students In Arrears', nativeValue: String(stats.outstandingStudents), usdValue: String(stats.outstandingStudents), icon: Users, color: '#f97316', bg: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)' },
  ]

  const quickLinks = [
    { to: ROUTES.BURSAR_FEES, label: 'Record Payment', icon: CreditCard, color: '#10b981' },
    { to: ROUTES.BURSAR_DEBTORS, label: 'View Debtors', icon: AlertCircle, color: '#ef4444' },
    { to: ROUTES.BURSAR_BILL_SHEET, label: 'Bill Sheet', icon: FileText, color: '#1e293b' },
    { to: ROUTES.BURSAR_PAYROLL, label: 'Run Payroll', icon: Users, color: '#8b5cf6' },
    { to: ROUTES.BURSAR_INCOME, label: 'Add Income', icon: TrendingUp, color: '#0ea5e9' },
    { to: ROUTES.BURSAR_EXPENSES, label: 'Add Expense', icon: Receipt, color: '#f59e0b' },
    { to: ROUTES.BURSAR_ANALYTICS, label: 'Analytics', icon: Activity, color: '#ec4899' },
  ]

  if (loading) return <FlaskLoader fullScreen={false} label="Loading Financial Hub…" />

  const userName = user?.full_name?.split(' ')[0] || 'Bursar'

  return (
    <>
      <style>{`
        .bur-dash {
          font-family: 'Inter', system-ui, sans-serif;
          color: var(--text-primary, #0F172A);
          padding: 28px 32px 80px;
          max-width: 1600px;
          margin: 0 auto;
        }
        @media (max-width: 1024px) { .bur-dash { padding: 20px 20px 80px; } }
        @media (max-width: 600px)  { .bur-dash { padding: 16px 14px 80px; } }

        .bur-kpi-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        @media (max-width: 900px)  { .bur-kpi-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 540px)  { .bur-kpi-grid { grid-template-columns: 1fr 1fr; gap: 10px; } }

        .bur-kpi {
          background: var(--bg-card, #fff);
          border: 1px solid var(--border-color, #E5E7EB);
          border-radius: 14px;
          padding: 20px;
          transition: all 0.2s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          display: flex; flex-direction: column; gap: 14px;
        }
        .bur-kpi:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.08); }

        .bur-section {
          background: var(--bg-card, #fff);
          border: 1px solid var(--border-color, #E5E7EB);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
          margin-bottom: 20px;
        }
        .bur-section-head {
          padding: 18px 22px;
          border-bottom: 1px solid var(--border-color, #E5E7EB);
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
        }
        .bur-section-title {
          font-size: 15px; font-weight: 800;
          color: var(--text-primary, #0F172A);
          letter-spacing: -0.01em;
          font-family: 'Outfit', 'Inter', sans-serif;
        }
        .bur-section-body { padding: 20px 22px; }

        .bur-chart-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        @media (max-width: 1100px) { .bur-chart-grid { grid-template-columns: 1fr; } }

        .bur-qa-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
        }
        @media (max-width: 900px)  { .bur-qa-grid { grid-template-columns: repeat(4, 1fr); } }
        @media (max-width: 500px)  { .bur-qa-grid { grid-template-columns: repeat(3, 1fr); } }

        .bur-qa-item {
          display: flex; flex-direction: column; align-items: center;
          gap: 6px; padding: 12px 6px;
          background: var(--bg-hover, #F1F5F9);
          border-radius: 12px;
          text-decoration: none; color: inherit;
          border: 1px solid transparent;
          transition: all 0.2s; cursor: pointer;
        }
        .bur-qa-item:hover {
          background: var(--bg-card); border-color: var(--border-color);
          transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.08);
        }

        .bur-txn-row {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 22px;
          border-bottom: 1px solid var(--border-color, #E5E7EB);
          transition: background 0.15s;
        }
        .bur-txn-row:last-child { border-bottom: none; }
        .bur-txn-row:hover { background: var(--bg-hover); }

        @keyframes bur-fade-up { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        .bur-anim { animation: bur-fade-up 0.4s cubic-bezier(0.2,0.8,0.2,1) both; }
      `}</style>

      <div className="bur-dash">

        {/* ── HERO ── */}
        <div style={{
          borderRadius: 20,
          padding: '32px 36px',
          marginBottom: 24,
          background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #1E3A8A 100%)',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }} className="bur-anim">
          <div style={{ position: 'absolute', top: -80, right: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(16,185,129,0.07)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -60, left: 100, width: 200, height: 200, borderRadius: '50%', background: 'rgba(6,182,212,0.06)', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, position: 'relative', zIndex: 1 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.55, marginBottom: 6 }}>FINANCIAL COMMAND CENTER</div>
              <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(20px, 3vw, 30px)', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 8, lineHeight: 1.1 }}>
                {timeGreeting}, {userName} 💼
              </h1>
              <p style={{ fontSize: 14, opacity: 0.72, fontWeight: 500, marginBottom: 20 }}>
                {term?.name ?? 'No active term'} · {new Date().toLocaleDateString('en-GH', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
              {/* Net balance pill */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: net >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', padding: '10px 20px', borderRadius: 12, border: `1px solid ${net >= 0 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
                <span style={{ fontSize: 13, opacity: 0.8, fontWeight: 600 }}>Net Balance:</span>
                <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 22, fontWeight: 900, color: net >= 0 ? '#34D399' : '#FCA5A5' }}>
                  {formatCurrency(net, schoolCurrency)}
                </span>
                {net >= 0 ? <TrendingUp size={18} color="#34D399" /> : <TrendingDown size={18} color="#FCA5A5" />}
              </div>
            </div>

            {/* Quick CTAs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link to={ROUTES.BURSAR_FEES} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, background: '#16A34A', color: '#fff', fontWeight: 800, fontSize: 14, padding: '12px 22px', borderRadius: 12, transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(22,163,74,0.4)' }}>
                <CreditCard size={16} /> Pay Fees
              </Link>
              <div ref={qaRef} style={{ position: 'relative' }}>
                <button onClick={() => setQaOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: 700, fontSize: 13, padding: '10px 18px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', transition: 'all 0.2s', backdropFilter: 'blur(4px)' }}>
                  <Zap size={14} /> Quick Action <ChevronDown size={13} style={{ transform: qaOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
                {qaOpen && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, minWidth: 210, background: 'var(--bg-card)', borderRadius: 14, padding: 8, boxShadow: '0 16px 40px rgba(0,0,0,0.16)', border: '1px solid var(--border-color)', zIndex: 100, animation: 'bur-fade-up 0.15s ease' }}>
                    {quickLinks.map((q: any) => (
                      <Link key={q.to} to={q.to} onClick={() => setQaOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none', transition: 'background 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 9, background: `${q.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <q.icon size={16} color={q.color} />
                        </div>
                        {q.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── KPI CARDS ── */}
        <div className="bur-kpi-grid bur-anim" style={{ animationDelay: '0.08s' }}>
          {cards.map((card, i) => (
            <div key={card.label} className="bur-kpi">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${card.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <card.icon size={20} color={card.color} strokeWidth={2} />
                </div>
                <ArrowRight size={14} color="var(--text-subtle, #9CA3AF)" />
              </div>
              <div>
                <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(18px,2.5vw,24px)', fontWeight: 900, letterSpacing: '-0.02em', color: card.color, lineHeight: 1 }}>
                  {card.nativeValue}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{card.label}</div>
                {exchangeRate !== 1 && (
                  <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 3, fontWeight: 500 }}>≈ {card.usdValue}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── CHARTS ── */}
        <div className="bur-chart-grid bur-anim" style={{ animationDelay: '0.14s' }}>
          {/* Income vs Expenses */}
          <div className="bur-section" style={{ margin: 0 }}>
            <div className="bur-section-head">
              <span className="bur-section-title">📈 Income vs Expenses ({new Date().getFullYear()})</span>
              <Link to={ROUTES.BURSAR_ANALYTICS} style={{ fontSize: 12, fontWeight: 700, color: '#2563EB', textDecoration: 'none' }}>Full Analytics →</Link>
            </div>
            <div className="bur-section-body">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barGap={4}>
                  <defs>
                    <linearGradient id="bur-inc-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#16A34A" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#16A34A" stopOpacity={0.5} />
                    </linearGradient>
                    <linearGradient id="bur-exp-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#DC2626" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#DC2626" stopOpacity={0.5} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `₵${(v / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(v: any, name: string) => [`${formatCurrency(Number(v), schoolCurrency)}`, name === 'income' ? 'Income' : 'Expenses']} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 10, fontSize: 12 }} />
                  <Bar dataKey="income" fill="url(#bur-inc-grad)" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="expenses" fill="url(#bur-exp-grad)" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  <Legend formatter={v => v === 'income' ? 'Income' : 'Expenses'} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Expense Distribution */}
          <div className="bur-section" style={{ margin: 0 }}>
            <div className="bur-section-head">
              <span className="bur-section-title">💸 Expense Breakdown</span>
            </div>
            <div className="bur-section-body">
              {expenseByCategory.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={expenseByCategory} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                        {expenseByCategory.map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => [formatCurrency(Number(v), schoolCurrency), 'Amount']} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 10, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {expenseByCategory.slice(0, 4).map((cat: any, i: number) => (
                      <div key={cat.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.name}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>{formatCurrency(cat.value, schoolCurrency)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No expense data yet</div>
              )}
            </div>
          </div>
        </div>

        {/* ── QUICK ACTIONS ── */}
        <div className="bur-section bur-anim" style={{ animationDelay: '0.2s' }}>
          <div className="bur-section-head">
            <span className="bur-section-title">⚡ Quick Actions</span>
          </div>
          <div style={{ padding: '14px 18px' }}>
            <div className="bur-qa-grid">
              {quickLinks.map(({ to, label, icon: Icon, color }) => (
                <Link key={to} to={to} className="bur-qa-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 11, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${color}25` }}>
                    <Icon size={19} color={color} strokeWidth={2} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary, #374151)', textAlign: 'center', lineHeight: 1.3 }}>{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── RECENT TRANSACTIONS ── */}
        <div className="bur-section bur-anim" style={{ animationDelay: '0.26s' }}>
          <div className="bur-section-head">
            <span className="bur-section-title">🧾 Recent Payments</span>
            <Link to={ROUTES.BURSAR_FEES} style={{ fontSize: 12, fontWeight: 700, color: '#2563EB', textDecoration: 'none' }}>View Ledger →</Link>
          </div>
          {recentPayments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 13 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
              No payments recorded yet
            </div>
          ) : (
            <div>
              {recentPayments.map((p: any) => {
                const initials = (p.student?.full_name ?? 'UN').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
                const colors = ['#2563EB', '#7C3AED', '#16A34A', '#F59E0B', '#DC2626', '#0891B2']
                const color = colors[initials.charCodeAt(0) % colors.length]
                return (
                  <div key={p.id} className="bur-txn-row">
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 800, color, flexShrink: 0 }}>
                      {initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.student?.full_name ?? 'Unknown'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                        {p.student?.class?.name ?? '—'} · {p.fee_structure?.fee_name ?? 'Payment'} · {new Date(p.created_at).toLocaleDateString('en-GH')}
                      </div>
                    </div>
                    <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 900, color: '#16A34A', flexShrink: 0 }}>
                      +{formatCurrency(p.amount_paid, schoolCurrency)}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 700, background: 'rgba(22,163,74,0.1)', color: '#16A34A', padding: '3px 8px', borderRadius: 6, flexShrink: 0 }}>
                      {p.payment_method ?? 'Cash'}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── SUMMARY METRICS ROW ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }} className="bur-anim" style={{ animationDelay: '0.3s' } as any}>
          {[
            { label: 'Payroll Paid', value: formatCurrency(stats.payrollPaid, schoolCurrency), icon: '💰', color: '#7C3AED', to: ROUTES.BURSAR_PAYROLL },
            { label: 'Scholarships', value: `${stats.scholarshipCount} Students`, icon: '🎓', color: '#0891B2', to: ROUTES.BURSAR_STUDENTS },
            { label: 'Last Term Arrears', value: formatCurrency(stats.lastTermArrears, schoolCurrency), icon: '⚠️', color: '#F59E0B', to: ROUTES.BURSAR_DEBTORS },
          ].map(m => (
            <Link key={m.label} to={m.to} style={{ textDecoration: 'none', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 14, padding: '18px 20px', display: 'flex', gap: 14, alignItems: 'center', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: 28 }}>{m.icon}</div>
              <div>
                <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 900, color: m.color }}>{m.value}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 2 }}>{m.label}</div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </>
  )
}
