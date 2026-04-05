import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { useCurrentTerm } from '../../hooks/useSettings'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import {
  DollarSign, TrendingUp, TrendingDown, AlertCircle, Users,
  CreditCard, PiggyBank, Receipt, GraduationCap, FileText, Banknote
} from 'lucide-react'

const GHS = (n: number) => `GH₵ ${n.toLocaleString('en-GH', { minimumFractionDigits: 2 })}`

export default function BursarDashboard() {
  const { setFirstLoadComplete } = useAuthStore()
  const { user } = useAuth()
  const { data: term } = useCurrentTerm()
  const schoolId = user?.school_id ?? ''
  const currentYear = new Date().getFullYear()

  const [stats, setStats] = useState({ totalCollected: 0, tuitionCollected: 0, dailyCollected: 0, totalExpenses: 0, totalIncome: 0, payrollPaid: 0, outstandingStudents: 0, scholarshipCount: 0, lastTermArrears: 0, currentTermArrears: 0, overallDebt: 0 })
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [recentPayments, setRecentPayments] = useState<any[]>([])
  const [expenseByCategory, setExpenseByCategory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
        supabase.from('attendance').select('student_id, days_present').eq('school_id', schoolId).eq('term_id', term?.id)
      ])

      const [paymentsRes, incomeRes, expensesRes, payrollRes, recentRes, studentsRes, structRes, dailyConfRes, dailyCollRes, termPaymentsRes, dailyCollFullYearRes, attendanceRes] = resData as any

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

      setStats({ 
        totalCollected: feeTotal, tuitionCollected: tuitionTotal, dailyCollected: dailyTotalFullYear,
        totalIncome: incomeTotal + feeTotal, totalExpenses: expenseTotal + payrollTotal, 
        payrollPaid: payrollTotal, outstandingStudents: 0, 
        scholarshipCount: schCount, lastTermArrears: lastArrears, currentTermArrears: currentArrears, overallDebt
      })
      setRecentPayments(recentRes?.data ?? [])

      // Monthly bar chart data (income vs expenses)
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
      const monthly = months.map((m, i) => {
        const idx = String(i + 1).padStart(2, '0')
        const inc = (incomeRes?.data ?? []).filter((r: any) => r.date?.startsWith(`${currentYear}-${idx}`)).reduce((s: number, r: any) => s + r.amount, 0)
        const exp = (expensesRes?.data ?? []).filter((r: any) => r.date?.startsWith(`${currentYear}-${idx}`)).reduce((s: number, r: any) => s + r.amount, 0)
        const fees = (paymentsRes?.data ?? []).filter((r: any) => r.created_at?.startsWith(`${currentYear}-${idx}`)).reduce((s: number, r: any) => s + r.amount_paid, 0)
        const dailyFeesMonth = (dailyCollFullYearRes?.data ?? []).filter((r: any) => r.date?.startsWith(`${currentYear}-${idx}`)).reduce((s: number, r: any) => s + Number(r.amount), 0)
        const payrollMonth = (payrollRes?.data ?? []).filter((r: any) => r.is_paid && r.created_at?.startsWith(`${currentYear}-${idx}`)).reduce((s: number, r: any) => s + Number(r.net_salary), 0)
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

  const COLORS = ['#7c3aed', '#0891b2', '#16a34a', '#d97706', '#dc2626', '#ec4899']
  const net = stats.totalIncome - stats.totalExpenses

  const cards = [
    { label: 'Total Fees Collected', value: GHS(stats.totalCollected), icon: CreditCard, color: '#16a34a', bg: '#f0fdf4', trend: '' },
    { label: 'Term Tuition Collected', value: GHS(stats.tuitionCollected), icon: Banknote, color: '#0891b2', bg: '#ecfeff', trend: '' },
    { label: 'Daily Fees Collected', value: GHS(stats.dailyCollected), icon: PiggyBank, color: '#059669', bg: '#ecfdf5', trend: '' },
    { label: 'Net Bank Balance', value: GHS(net), icon: DollarSign, color: net >= 0 ? '#16a34a' : '#1d4ed8', bg: net >= 0 ? '#f0fdf4' : '#eff6ff', trend: '' },
    { label: 'Overall Total Debt', value: GHS(stats.overallDebt), icon: AlertCircle, color: '#dc2626', bg: '#fef2f2', trend: '' },
    { label: 'Scholarship Students', value: String(stats.scholarshipCount), icon: GraduationCap, color: '#6d28d9', bg: '#f5f3ff', trend: '' },
  ]

  const quickLinks = [
    { to: ROUTES.BURSAR_FEES, label: 'Record Payment', icon: CreditCard, color: '#16a34a' },
    { to: ROUTES.BURSAR_DEBTORS, label: 'View Debtors', icon: AlertCircle, color: '#dc2626' },
    { to: ROUTES.BURSAR_BILL_SHEET, label: 'Bill Sheet', icon: FileText, color: '#1e0646' },
    { to: ROUTES.BURSAR_PAYROLL, label: 'Run Payroll', icon: Users, color: '#7c3aed' },
    { to: ROUTES.BURSAR_INCOME, label: 'Add Income', icon: TrendingUp, color: '#0891b2' },
    { to: ROUTES.BURSAR_EXPENSES, label: 'Add Expense', icon: Receipt, color: '#d97706' },
    { to: ROUTES.BURSAR_ANALYTICS, label: 'Analytics', icon: DollarSign, color: '#ec4899' },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');
        @keyframes _bd_fu { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes _bd_fi { from{opacity:0} to{opacity:1} }
        .bd-card { transition: all .2s; }
        .bd-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.1) !important; }
        .bd-ql:hover { background: #f5f3ff !important; transform: translateY(-2px); }
        .bd-ql { transition: all .2s; }
      `}</style>
      <div style={{ fontFamily: '"DM Sans", system-ui, sans-serif', animation: '_bd_fi .4s ease' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>
            Bursary Dashboard
          </h1>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 3 }}>
            Financial overview for {currentYear} · {term ? `Current term: ${term.name}` : 'No active term'}
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #ede9fe', borderTopColor: '#6d28d9', animation: '_tp_spin .8s linear infinite' }} />
            <p style={{ fontSize: 13, color: '#9ca3af' }}>Loading financial data…</p>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
              {cards.map((c, i) => (
                <div key={c.label} className="bd-card" style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', border: '1.5px solid #f0eefe', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', animation: `_bd_fu .35s ease ${i * 0.06}s both` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 12, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <c.icon size={18} color={c.color} strokeWidth={2.5} />
                    </div>
                    {c.trend && <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', background: '#f0fdf4', padding: '2px 7px', borderRadius: 99 }}>{c.trend}</span>}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: c.color, fontFamily: '"Playfair Display", serif', lineHeight: 1.1 }}>{c.value}</div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4, fontWeight: 600 }}>{c.label}</div>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10, marginBottom: 28 }}>
              {quickLinks.map(q => (
                <Link key={q.to} to={q.to} style={{ textDecoration: 'none' }}>
                  <div className="bd-ql" style={{ background: '#fff', borderRadius: 14, padding: '16px', border: '1.5px solid #f0eefe', textAlign: 'center', cursor: 'pointer' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: `${q.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                      <q.icon size={20} color={q.color} strokeWidth={2} />
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{q.label}</div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Charts row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 18, marginBottom: 24 }}>

              {/* Income vs Expenses Bar Chart */}
              <div style={{ background: '#fff', borderRadius: 18, padding: '22px 24px', border: '1.5px solid #f0eefe', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Income vs Expenses — {currentYear}</h3>
                <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 20px' }}>Monthly financial overview</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyData} barSize={10}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `${v/1000}k`} />
                    <Tooltip formatter={(v: any) => GHS(v)} contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontSize: 12 }} />
                    <Legend />
                    <Bar dataKey="income" name="Income" fill="#16a34a" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="Expenses" fill="#dc2626" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Expenses by category */}
              <div style={{ background: '#fff', borderRadius: 18, padding: '22px 24px', border: '1.5px solid #f0eefe', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Expenses by Category</h3>
                <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 16px' }}>Spending breakdown</p>
                {expenseByCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={expenseByCategory} cx="50%" cy="50%" outerRadius={75} dataKey="value" nameKey="name">
                        {expenseByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: any) => GHS(v)} contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 13 }}>No expense data yet</div>
                )}
              </div>
            </div>

            {/* Recent payments */}
            <div style={{ background: '#fff', borderRadius: 18, border: '1.5px solid #f0eefe', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ padding: '18px 22px', borderBottom: '1px solid #faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Recent Fee Payments</h3>
                <Link to={ROUTES.BURSAR_FEES} style={{ fontSize: 12, fontWeight: 600, color: '#6d28d9', textDecoration: 'none' }}>View all →</Link>
              </div>
              {recentPayments.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No payments recorded yet</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#faf5ff' }}>
                      {['Student', 'Class', 'Fee Type', 'Amount', 'Method', 'Date'].map(h => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentPayments.map((p: any, i) => (
                      <tr key={p.id} style={{ borderBottom: i < recentPayments.length - 1 ? '1px solid #faf5ff' : 'none' }}>
                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#111827' }}>{p.student?.full_name ?? '—'}</td>
                        <td style={{ padding: '12px 16px' }}><span style={{ fontSize: 11, background: '#ede9fe', color: '#5b21b6', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>{(p.student as any)?.class?.name ?? '—'}</span></td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: '#6b7280' }}>{p.fee_structure?.fee_name ?? 'General'}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#16a34a' }}>{GHS(p.amount_paid)}</td>
                        <td style={{ padding: '12px 16px' }}><span style={{ fontSize: 11, fontWeight: 600, background: '#f0fdf4', color: '#16a34a', padding: '2px 8px', borderRadius: 99, textTransform: 'capitalize' }}>{p.payment_method}</span></td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: '#6b7280' }}>{new Date(p.payment_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}
