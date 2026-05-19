// src/pages/bursar/AnalyticsPage.tsx
import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { incomeService, expenseService, feePaymentsService } from '../../services/bursar.service'
import { supabase } from '../../lib/supabase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area } from 'recharts'

import { formatCurrency } from '../../utils/currency'
const COLORS = ['#7c3aed','#16a34a','#0891b2','#d97706','#dc2626','#ec4899','#6366f1','#14b8a6']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function AnalyticsPage() {
  const { user } = useAuth()
  const schoolId = user?.school_id ?? ''
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [loading, setLoading] = useState(true)

  const [monthly, setMonthly] = useState<any[]>([])
  const [expByCat, setExpByCat] = useState<any[]>([])
  const [incByCat, setIncByCat] = useState<any[]>([])
  const [summary, setSummary] = useState({ income: 0, expenses: 0, fees: 0, net: 0 })

  // School context for currency
  const [school, setSchool] = useState<any>(null)
  useEffect(() => {
    if (schoolId) {
      supabase.from('schools').select('currency_code').eq('id', schoolId).single().then(({ data }) => setSchool(data))
    }
  }, [schoolId])

  const schoolCurrency = school?.currency_code || 'GHS'
  const CUR = (n: number) => formatCurrency(n, schoolCurrency)

  useEffect(() => { if (schoolId) load() }, [schoolId, year])

  async function load() {
    setLoading(true)
    const [incRes, expRes, feesRes, prRes, adjRes] = await Promise.all([
      incomeService.getAll(schoolId, year),
      expenseService.getAll(schoolId, year),
      feePaymentsService.getAll(schoolId),
      supabase.from('staff_payroll').select('net_salary, is_paid, created_at, user:users(full_name)').eq('school_id', schoolId).gte('created_at', `${year}-01-01`),
      supabase.from('payroll_adjustments').select('amount, type, is_paid, recorded_at').eq('school_id', schoolId).gte('recorded_at', `${year}-01-01`),
    ])
    const inc = incRes.data ?? []
    const exp = expRes.data ?? []
    const pr = (prRes.data ?? []).filter((p: any) => p.is_paid)
    const adj = (adjRes.data ?? []).filter((p: any) => p.is_paid)
    const fees = (feesRes.data ?? []).filter((p: any) => p.payment_date?.startsWith(String(year)))

    const totalInc = inc.reduce((s: number, r: any) => s + r.amount, 0)
    const totalFees = fees.reduce((s: number, r: any) => s + r.amount_paid, 0)
    const totalExpBase = exp.reduce((s: number, r: any) => s + r.amount, 0)
    const totalPR = pr.reduce((s: number, r: any) => s + r.net_salary, 0) + adj.reduce((s: number, r: any) => s + r.amount, 0)
    const totalExp = totalExpBase + totalPR
    setSummary({ income: totalInc, expenses: totalExp, fees: totalFees, net: totalInc + totalFees - totalExp })

    // Monthly breakdown
    const monthData = MONTHS.map((m, i) => {
      const idx = String(i + 1).padStart(2, '0')
      const mInc = inc.filter((r: any) => r.date?.startsWith(`${year}-${idx}`)).reduce((s: number, r: any) => s + r.amount, 0)
      const mFees = fees.filter((r: any) => r.payment_date?.startsWith(`${year}-${idx}`)).reduce((s: number, r: any) => s + r.amount_paid, 0)
      const mExp = exp.filter((r: any) => r.date?.startsWith(`${year}-${idx}`)).reduce((s: number, r: any) => s + r.amount, 0)
      const mPR = pr.filter((r: any) => r.created_at?.startsWith(`${year}-${idx}`)).reduce((s: number, r: any) => s + r.net_salary, 0) +
                  adj.filter((r: any) => r.recorded_at?.startsWith(`${year}-${idx}`)).reduce((s: number, r: any) => s + r.amount, 0)
      return { month: m, income: mInc + mFees, expenses: mExp + mPR, net: mInc + mFees - (mExp + mPR) }
    })
    setMonthly(monthData)

    // Expense by category
    const eCat: Record<string, number> = { 'Staff Payroll': totalPR }
    for (const r of exp) eCat[r.category.split('(')[0].trim()] = (eCat[r.category.split('(')[0].trim()] || 0) + r.amount
    setExpByCat(Object.entries(eCat).filter(([_, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value })))

    // Income by category
    const iCat: Record<string, number> = { 'Fees': totalFees }
    for (const r of inc) iCat[r.category] = (iCat[r.category] || 0) + r.amount
    setIncByCat(Object.entries(iCat).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value })))

    setLoading(false)
  }

  const kpis = [
    { label: 'Total Income', value: CUR(summary.income + summary.fees), color: '#16a34a', bg: '#f0fdf4', note: `Incl. ${CUR(summary.fees)} fees` },
    { label: 'Total Expenses', value: CUR(summary.expenses), color: '#dc2626', bg: '#fef2f2', note: 'All categories' },
    { label: 'Net Balance', value: CUR(summary.net), color: summary.net >= 0 ? '#16a34a' : '#dc2626', bg: summary.net >= 0 ? '#f0fdf4' : '#fef2f2', note: summary.net >= 0 ? 'Surplus' : 'Deficit' },
    { label: 'Fee Collection', value: CUR(summary.fees), color: '#7c3aed', bg: '#f5f3ff', note: String(year) },
  ]

  // Export summary as CSV
  function exportCSV() {
    const rows = [
      ['Month', 'Income', 'Expenses', 'Net'],
      ...monthly.map(m => [m.month, m.income.toFixed(2), m.expenses.toFixed(2), m.net.toFixed(2)])
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const a = document.createElement('a')
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    a.download = `wula_analytics_${year}.csv`
    a.click()
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');
        @keyframes _an_fi { from{opacity:0} to{opacity:1} }
        @keyframes _an_spin { to{transform:rotate(360deg)} }
        .analytics-3col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 18px; margin-bottom: 20px; }
        @media (max-width: 900px) { .analytics-3col { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 600px) { .analytics-3col { grid-template-columns: 1fr; } }
        .analytics-kpis { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 14px; margin-bottom: 28px; }
        .analytics-export-btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 18px; border-radius: 9px; border: 1.5px solid #e5e7eb; background: #fff; font-size: 13px; font-weight: 700; cursor: pointer; color: #374151; transition: all .2s; }
        .analytics-export-btn:hover { background: #f5f3ff; border-color: #6d28d9; color: #6d28d9; }
      `}</style>
      <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif', animation: '_an_fi .4s ease' }}>
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>Financial Analytics</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>Full financial overview and trends · {year}</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={exportCSV} className="analytics-export-btn">
              📥 Export CSV
            </button>
            <select value={year} onChange={e => setYear(Number(e.target.value))} style={{ padding: '9px 14px', borderRadius: 9, border: '1.5px solid var(--border-color)', fontSize: 13, outline: 'none', fontFamily: '"DM Sans",sans-serif', fontWeight: 600 }}>
              {[currentYear, currentYear - 1, currentYear - 2].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #ede9fe', borderTopColor: '#6d28d9', animation: '_an_spin .8s linear infinite' }} />
            <p style={{ fontSize: 13, color: 'var(--text-subtle)' }}>Crunching numbers…</p>
          </div>
        ) : (
          <>
            {/* KPI Row */}
            <div className="analytics-kpis">
              {kpis.map((k) => (
                <div key={k.label} style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '20px', border: '1.5px solid #f0eefe', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>{k.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: k.color, fontFamily: '"Playfair Display",serif', marginBottom: 4 }}>{k.value}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: k.color, display: 'inline-block' }} />
                    {k.note}
                  </div>
                </div>
              ))}
            </div>

            {/* Monthly Area Chart */}
            <div style={{ background: 'var(--bg-card)', borderRadius: 18, padding: '22px 24px', border: '1.5px solid #f0eefe', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)', margin: '0 0 4px' }}>Monthly Cash Flow — {year}</h3>
              <p style={{ fontSize: 12, color: 'var(--text-subtle)', margin: '0 0 20px' }}>Income vs Expenses by month</p>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={monthly}>
                  <defs>
                    <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#16a34a" stopOpacity={0.15}/><stop offset="95%" stopColor="#16a34a" stopOpacity={0}/></linearGradient>
                    <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#dc2626" stopOpacity={0.12}/><stop offset="95%" stopColor="#dc2626" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: any) => CUR(v)} contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontSize: 12 }} />
                  <Legend />
                  <Area type="monotone" dataKey="income" name="Income" stroke="#16a34a" strokeWidth={2.5} fill="url(#incGrad)" />
                  <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#dc2626" strokeWidth={2.5} fill="url(#expGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Net Profit Line + Pie row */}
            <div className="analytics-3col">

              {/* Net Line */}
              <div style={{ background: 'var(--bg-card)', borderRadius: 18, padding: '22px 24px', border: '1.5px solid #f0eefe', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)', margin: '0 0 16px' }}>Net Balance by Month</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={monthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: any) => CUR(v)} contentStyle={{ borderRadius: 10, border: 'none', fontSize: 11 }} />
                    <Line type="monotone" dataKey="net" name="Net" stroke="#7c3aed" strokeWidth={2.5} dot={{ fill: '#7c3aed', r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Expense Pie */}
              <div style={{ background: 'var(--bg-card)', borderRadius: 18, padding: '22px 24px', border: '1.5px solid #f0eefe', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)', margin: '0 0 16px' }}>Expense Breakdown</h3>
                {expByCat.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart><Pie data={expByCat} cx="50%" cy="50%" outerRadius={65} dataKey="value" nameKey="name">
                      {expByCat.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie><Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 10 }} /><Tooltip formatter={(v: any) => CUR(v)} contentStyle={{ borderRadius: 10, border: 'none', fontSize: 11 }} /></PieChart>
                  </ResponsiveContainer>
                ) : <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-subtle)', fontSize: 12 }}>No data</div>}
              </div>

              {/* Income Pie */}
              <div style={{ background: 'var(--bg-card)', borderRadius: 18, padding: '22px 24px', border: '1.5px solid #f0eefe', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)', margin: '0 0 16px' }}>Income Sources</h3>
                {incByCat.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart><Pie data={incByCat} cx="50%" cy="50%" outerRadius={65} dataKey="value" nameKey="name">
                      {incByCat.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie><Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 10 }} /><Tooltip formatter={(v: any) => CUR(v)} contentStyle={{ borderRadius: 10, border: 'none', fontSize: 11 }} /></PieChart>
                  </ResponsiveContainer>
                ) : <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-subtle)', fontSize: 12 }}>No data</div>}
              </div>
            </div>

            {/* Top income vs expense months insight */}
            {(() => {
              const top = [...monthly].sort((a,b) => b.income - a.income)[0]
              const bottom = [...monthly].sort((a,b) => a.income - b.income)[0]
              const deficit = monthly.filter(m => m.net < 0)
              return (
                <div style={{ background: 'linear-gradient(135deg,#1e0646,#3730a3)', borderRadius: 18, padding: '20px 24px', marginBottom: 20, color: '#fff', display: 'flex', flexWrap: 'wrap', gap: 20 }}>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 6 }}>Peak Month</div>
                    <div style={{ fontSize: 18, fontWeight: 900 }}>{top?.month ?? '—'}</div>
                    <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>Highest income: {top ? CUR(top.income) : '—'}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 6 }}>Lowest Month</div>
                    <div style={{ fontSize: 18, fontWeight: 900 }}>{bottom?.month ?? '—'}</div>
                    <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>Lowest income: {bottom ? CUR(bottom.income) : '—'}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 6 }}>Deficit Months</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: deficit.length > 0 ? '#fca5a5' : '#86efac' }}>{deficit.length}</div>
                    <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>{deficit.length > 0 ? deficit.map(m => m.month).join(', ') : 'None — surplus all year'}</div>
                  </div>
                </div>
              )
            })()}

            {/* Monthly breakdown bar */}
            <div style={{ background: 'var(--bg-card)', borderRadius: 18, padding: '22px 24px', border: '1.5px solid #f0eefe', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)', margin: '0 0 20px' }}>Monthly Bar Summary</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthly} barSize={12}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: any) => CUR(v)} contentStyle={{ borderRadius: 10, border: 'none', fontSize: 12 }} />
                  <Legend />
                  <Bar dataKey="income" name="Income" fill="#16a34a" radius={[4,4,0,0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#dc2626" radius={[4,4,0,0]} />
                  <Bar dataKey="net" name="Net" fill="#7c3aed" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </>
  )
}
