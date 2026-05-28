import { useStuckLoadingReload } from '../../hooks/useStuckLoadingReload'
import { useState, useEffect } from 'react'
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
  ArrowRight, Activity
} from 'lucide-react'
import FlaskLoader from '../../components/ui/FlaskLoader'
import { getEngagingGreeting } from '../../lib/utils'

export default function BursarDashboard() {
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

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap');
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        
        .card-perspective {
          perspective: 1000px;
          height: 160px;
          cursor: pointer;
        }

        .card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          transform-style: preserve-3d;
        }

        .card-flipped .card-inner {
          transform: rotateY(180deg);
        }

        .card-front, .card-back {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 24px;
          border: 1px solid var(--border-color);
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
        }
        
        .card-back {
          transform: rotateY(180deg);
          background: #1e1b4b !important;
          border-color: #312e81;
        }

        .bursar-card { 
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
        }

        .bursar-card:hover { 
          transform: translateY(-4px); 
          box-shadow: 0 20px 40px -10px rgba(0,0,0,0.08) !important; 
        }
        
        .ql-btn { transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
        .ql-btn:hover { background: var(--bg-hover) !important; transform: translateY(-2px); box-shadow: 0 10px 20px -10px rgba(0,0,0,0.05); }
        
        .stat-icon-wrap {
          transition: transform 0.3s ease;
        }
        .bursar-card:hover .stat-icon-wrap {
          transform: scale(1.1) rotate(-5deg);
        }
      `}</style>
      <div style={{ fontFamily: '"Inter", system-ui, sans-serif', animation: 'fadeIn .4s ease' }}>

        {/* Hero Section */}
        <div style={{ 
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', 
          borderRadius: 12, 
          padding: '32px 40px', 
          marginBottom: 32,
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 40px -10px rgba(49, 46, 129, 0.3)'
        }}>
          <div style={{ position: 'absolute', top: -50, right: -50, width: 250, height: 250, background: 'radial-gradient(circle, rgba(99,102,241,0.4) 0%, rgba(99,102,241,0) 70%)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', bottom: -100, right: 100, width: 300, height: 300, background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, rgba(139,92,246,0) 70%)', borderRadius: '50%' }} />
          
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#c7d2fe', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Financial Command Center</p>
              <h1 style={{ fontFamily: '"Outfit", sans-serif', fontSize: 36, fontWeight: 800, margin: '8px 0 12px', letterSpacing: '-0.02em' }}>
                {timeGreeting}, {user?.full_name?.split(' ')[0]}
              </h1>
              <p style={{ margin: 0, fontSize: 15, color: '#e0e7ff', fontWeight: 600, maxWidth: 450, lineHeight: 1.5 }}>
                {roleMessage} Track {currentYear} performance, monitor arrears, and manage payroll across the platform.
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, color: '#c7d2fe', fontWeight: 600, marginBottom: 4 }}>Net Term Balance</div>
              <div style={{ fontFamily: '"Outfit", sans-serif', fontSize: 42, fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
                {!loading ? formatCurrency(net, schoolCurrency) : '---'}
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '60px 0', display: 'flex', justifyContent: 'center' }}>
            <FlaskLoader fullScreen={false} label="Syncing financial ledgers…" />
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 32 }}>
              {cards.map((c, i) => (
                <div 
                  key={c.label} 
                  className={`card-perspective ${flippedCards.includes(i) ? 'card-flipped' : ''}`}
                  onClick={() => toggleFlip(i)}
                >
                  <div className="card-inner">
                    {/* Front */}
                    <div className="card-front bursar-card glass-card" style={{ background: 'var(--bg-card)' }}>
                      <div className="stat-icon-wrap" style={{ width: 40, height: 40, borderRadius: 12, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                        <c.icon size={20} color={c.color} strokeWidth={2.5} />
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-main)', fontFamily: '"Outfit", sans-serif', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                        {c.nativeValue}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontWeight: 600 }}>
                        {c.label}
                      </div>
                    </div>

                    {/* Back */}
                    <div className="card-back" style={{ background: '#1e1b4b' }}>
                      <div style={{ fontSize: 11, color: '#c7d2fe', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>
                        USD Equivalent
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', fontFamily: '"Outfit", sans-serif', letterSpacing: '-0.02em' }}>
                        {c.usdValue}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>
                        Click to flip back
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions Strip */}
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', marginBottom: 16, fontFamily: '"Outfit", sans-serif' }}>Quick Actions</h3>
              <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'none' }}>
                {quickLinks.map((q, i) => (
                  <Link key={q.to} to={q.to} style={{ textDecoration: 'none', flexShrink: 0 }}>
                    <div className="ql-btn glass-card" style={{ 
                      background: 'var(--bg-card)', 
                      borderRadius: 8, 
                      padding: '14px 20px', 
                      border: '1px solid var(--border-color)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 12,
                      animation: `fadeUp 0.4s ease ${i * 0.05}s both`
                    }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${q.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <q.icon size={18} color={q.color} strokeWidth={2} />
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)' }}>{q.label}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Main Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, marginBottom: 32 }}>
              
              {/* Income vs Expenses Bar Chart */}
              <div className="glass-card" style={{ background: 'var(--bg-card)', borderRadius: 12, padding: '28px', border: '1px solid var(--border-color)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.02)' }}>
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)', margin: '0 0 4px', fontFamily: '"Outfit", sans-serif' }}>Income vs Expenses</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Monthly financial flow for {currentYear}</p>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={monthlyData} barSize={12}>
                    <defs>
                      <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={1}/>
                        <stop offset="95%" stopColor="#34d399" stopOpacity={0.8}/>
                      </linearGradient>
                      <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={1}/>
                        <stop offset="95%" stopColor="#f87171" stopOpacity={0.8}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} dx={-10} tickFormatter={v => `${v/1000}k`} />
                    <Tooltip 
                      formatter={(v: any) => formatCurrency(v, schoolCurrency)} 
                      cursor={{ fill: 'var(--bg-hover)' }}
                      contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontSize: 13, fontWeight: 600, padding: '12px 16px' }} 
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: 20, fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }} />
                    <Bar dataKey="income" name="Income" fill="url(#colorInc)" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="expenses" name="Expenses" fill="url(#colorExp)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Expenses by category */}
              <div className="glass-card" style={{ background: 'var(--bg-card)', borderRadius: 12, padding: '28px', border: '1px solid var(--border-color)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.02)' }}>
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)', margin: '0 0 4px', fontFamily: '"Outfit", sans-serif' }}>Expense Distribution</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Where is the money going?</p>
                </div>
                {expenseByCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={expenseByCategory} cx="50%" cy="50%" innerRadius={70} outerRadius={100} dataKey="value" nameKey="name" paddingAngle={5}>
                        {expenseByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />)}
                      </Pie>
                      <Legend iconType="circle" iconSize={8} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }} />
                      <Tooltip 
                        formatter={(v: any) => formatCurrency(v, schoolCurrency)} 
                        contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontSize: 13, fontWeight: 600 }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-subtle)', fontSize: 14, fontWeight: 600 }}>No expense data recorded</div>
                )}
              </div>
            </div>

            {/* Recent payments Data Table */}
            <div className="glass-card" style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.02)' }}>
              <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)', margin: 0, fontFamily: '"Outfit", sans-serif' }}>Recent Transactions</h3>
                <Link to={ROUTES.BURSAR_FEES} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#6366f1', textDecoration: 'none', padding: '6px 12px', background: 'var(--bg-accent-hover)', borderRadius: 99 }}>
                  View Ledger <ArrowRight size={14} />
                </Link>
              </div>
              {recentPayments.length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-subtle)', fontSize: 14, fontWeight: 600 }}>No recent transactions</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-app)' }}>
                        {['Student', 'Class', 'Fee Category', 'Amount', 'Method', 'Date'].map(h => (
                          <th key={h} style={{ padding: '16px 28px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recentPayments.map((p: any, i) => (
                        <tr key={p.id} style={{ borderBottom: i < recentPayments.length - 1 ? '1px solid var(--border-color)' : 'none', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '16px 28px', fontSize: 14, fontWeight: 600, color: 'var(--text-main)' }}>{p.student?.full_name ?? '—'}</td>
                          <td style={{ padding: '16px 28px' }}>
                            <span style={{ fontSize: 12, background: 'var(--bg-input)', color: 'var(--text-main)', padding: '4px 10px', borderRadius: 6, fontWeight: 600 }}>{(p.student as any)?.class?.name ?? '—'}</span>
                          </td>
                          <td style={{ padding: '16px 28px', fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{p.fee_structure?.fee_name ?? 'General'}</td>
                          <td style={{ padding: '16px 28px', fontSize: 14, fontWeight: 700, color: '#10b981' }}>{formatCurrency(p.amount_paid, schoolCurrency)}</td>
                          <td style={{ padding: '16px 28px' }}>
                            <span style={{ fontSize: 12, fontWeight: 600, background: '#ecfdf5', color: '#10b981', padding: '4px 10px', borderRadius: 99, textTransform: 'capitalize' }}>
                              {p.payment_method}
                            </span>
                          </td>
                          <td style={{ padding: '16px 28px', fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
                            {new Date(p.payment_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}
