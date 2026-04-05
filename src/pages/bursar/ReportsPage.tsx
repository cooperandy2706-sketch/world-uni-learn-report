// src/pages/bursar/ReportsPage.tsx
import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { useCurrentTerm, useSettings } from '../../hooks/useSettings'
import { 
  FileText, Download, Printer, Calendar, 
  TrendingUp, TrendingDown, LayoutDashboard, ChevronRight,
  Filter, Search, Table as TableIcon, FileBarChart, School
} from 'lucide-react'
import { format } from 'date-fns'

const GHS = (n: number) => `GH₵ ${Number(n).toLocaleString('en-GH', { minimumFractionDigits: 2 })}`

type Period = 'term' | 'month' | 'year' | 'custom'

export default function ReportsPage() {
  const { user } = useAuth()
  const schoolId = user?.school_id ?? ''
  const { data: term } = useCurrentTerm()
  const { data: settings } = useSettings()
  const school = settings?.school
  
  const [period, setPeriod] = useState<Period>('term')
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [customStart, setCustomStart] = useState(format(new Date(), 'yyyy-MM-01'))
  const [customEnd, setCustomEnd] = useState(format(new Date(), 'yyyy-MM-dd'))

  // Data fetching
  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['financial-reports', schoolId, period, month, customStart, customEnd, term?.id],
    queryFn: async () => {
      let startDate: string | null = null
      let endDate: string | null = null

      if (period === 'term') {
        const { data: t } = await supabase.from('terms').select('start_date, end_date').eq('id', term?.id).single()
        startDate = t?.start_date
        endDate = t?.end_date
      } else if (period === 'month') {
        startDate = `${month}-01`
        endDate = `${month}-31` // Postgres handles '31' even for 30-day months usually, but better to be safe
      } else if (period === 'custom') {
        startDate = customStart
        endDate = customEnd
      }

      const qFees = supabase.from('fee_payments').select('amount_paid, payment_date, payment_method, student:students(full_name)').eq('school_id', schoolId)
      const qIncome = supabase.from('income_records').select('*').eq('school_id', schoolId)
      const qExpenses = supabase.from('expense_records').select('*').eq('school_id', schoolId)
      const qPayroll = supabase.from('staff_payroll').select('net_salary, paid_date, is_paid, user:users(full_name)').eq('school_id', schoolId).eq('is_paid', true)
      const qDaily = supabase.from('daily_fees_collected').select('amount, created_at, fee_type').eq('school_id', schoolId)

      if (startDate) {
        qFees.gte('payment_date', startDate)
        qIncome.gte('date', startDate)
        qExpenses.gte('date', startDate)
        qPayroll.gte('paid_date', startDate)
        qDaily.gte('created_at', startDate)
      }
      if (endDate) {
        qFees.lte('payment_date', endDate)
        qIncome.lte('date', endDate)
        qExpenses.lte('date', endDate)
        qPayroll.lte('paid_date', endDate)
        qDaily.lte('created_at', endDate)
      }

      const [fees, income, expenses, payroll, daily] = await Promise.all([
        qFees, qIncome, qExpenses, qPayroll, qDaily
      ])

      return {
        fees: fees.data ?? [],
        income: income.data ?? [],
        expenses: expenses.data ?? [],
        payroll: payroll.data ?? [],
        daily: daily.data ?? []
      }
    },
    enabled: !!schoolId && (period !== 'term' || !!term?.id)
  })

  // Calculations
  const metrics = useMemo(() => {
    if (!reportsData) return null
    
    // Revenue Breakdown
    const feeTotal = reportsData.fees.reduce((s, x) => s + x.amount_paid, 0)
    const dailyTotal = reportsData.daily.reduce((s, x) => s + Number(x.amount), 0)
    const dailyFeeding = reportsData.daily.filter(x => x.fee_type === 'feeding').reduce((s, x) => s + Number(x.amount), 0)
    const dailyStudies = reportsData.daily.filter(x => x.fee_type === 'studies').reduce((s, x) => s + Number(x.amount), 0)
    
    const incomeByCategory: Record<string, number> = { 'Tuition & Fees': feeTotal, 'Daily Feeding': dailyFeeding, 'Daily Studies': dailyStudies }
    reportsData.income.forEach(x => {
      incomeByCategory[x.category] = (incomeByCategory[x.category] || 0) + x.amount
    })
    const totalRevenue = Object.values(incomeByCategory).reduce((s, x) => s + x, 0)

    // Expenditure Breakdown
    const salaryTotal = reportsData.payroll.reduce((s, x) => s + x.net_salary, 0)
    const expenseByCategory: Record<string, number> = { 'Staff Salaries': salaryTotal }
    reportsData.expenses.forEach(x => {
      const cat = x.category.split('(')[0].trim()
      expenseByCategory[cat] = (expenseByCategory[cat] || 0) + x.amount
    })
    const totalExpenditure = Object.values(expenseByCategory).reduce((s, x) => s + x, 0)

    const netSurplus = totalRevenue - totalExpenditure

    // All Transactions for Audit Ledger
    const ledger = [
      ...reportsData.fees.map(x => ({ date: x.payment_date, desc: `Fee: ${(x.student as any)?.full_name}`, type: 'Revenue', cat: 'Fees', amount: x.amount_paid, method: x.payment_method })),
      ...reportsData.income.map(x => ({ date: x.date, desc: x.description || x.category, type: 'Revenue', cat: x.category, amount: x.amount, method: x.payment_method })),
      ...reportsData.expenses.map(x => ({ date: x.date, desc: x.description || x.category, type: 'Expenditure', cat: x.category, amount: x.amount, method: x.payment_method })),
      ...reportsData.payroll.map(x => ({ date: x.paid_date, desc: `Salary: ${(x.user as any)?.full_name}`, type: 'Expenditure', cat: 'Payroll', amount: x.net_salary, method: 'bank_transfer' })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return { totalRevenue, totalExpenditure, netSurplus, incomeByCategory, expenseByCategory, ledger }
  }, [reportsData])

  function handlePrint() {
    window.print()
  }

  function handleExport() {
    if (!metrics) return
    const headers = ['Date', 'Description', 'Type', 'Category', 'Amount', 'Method']
    const data = metrics.ledger.map(l => [l.date, l.desc, l.type, l.cat, l.amount, l.method])
    const csv = [headers, ...data].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `financial_report_${period}_${month || 'custom'}.csv`
    a.click()
  }

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #report-print-area, #report-print-area * { visibility: visible; }
          #report-print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
        .rp-val { font-family: 'DM Sans', sans-serif; font-weight: 700; transition: all .2s; }
        .rp-row:hover { background: #fdfbff; }
      `}</style>

      <div style={{ paddingBottom: 60, fontFamily: '"DM Sans", sans-serif' }}>
        
        {/* Header */}
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1e0646', margin: 0 }}>Advanced Financial Audits</h1>
            <p style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>Professional Profit & Loss statements and itemized transaction ledgers</p>
          </div>
          <div className="no-print" style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 10, color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Download size={15} /> Export CSV
            </button>
            <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: '#1e0646', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Printer size={15} /> Print Report
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="no-print" style={{ background: '#fff', border: '1.5px solid #f0eefe', borderRadius: 16, padding: '20px', marginBottom: 24, display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Filter size={16} color="#6d28d9" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Period:</span>
            <div style={{ display: 'flex', background: '#f5f3ff', padding: 3, borderRadius: 10 }}>
              {(['term', 'month', 'custom'] as Period[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  style={{
                    padding: '6px 14px', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    background: period === p ? '#fff' : 'transparent',
                    color: period === p ? '#6d28d9' : '#9ca3af',
                    boxShadow: period === p ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
                  }}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {period === 'month' && (
            <input type="month" value={month} onChange={e => setMonth(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', outline: 'none', fontSize: 13 }} />
          )}

          {period === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', outline: 'none', fontSize: 13 }} />
              <span style={{ fontSize: 12, color: '#9ca3af' }}>to</span>
              <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', outline: 'none', fontSize: 13 }} />
            </div>
          )}
          
          {period === 'term' && (
            <span style={{ fontSize: 13, color: '#6d28d9', fontWeight: 800 }}>{term?.name || 'No Active Term'}</span>
          )}
        </div>

        {isLoading ? (
          <div style={{ padding: '100px 0', textAlign: 'center' }}>
            <div style={{ width: 40, height: 40, border: '3px solid #f3f4f6', borderTopColor: '#6d28d9', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ fontSize: 14, color: '#6b7280' }}>Generating high-precision audit report...</p>
          </div>
        ) : !metrics ? (
          <div style={{ padding: 80, textAlign: 'center', color: '#9ca3af' }}>No financial data found for this period</div>
        ) : (
          <div id="report-print-area">
            
            {/* Branded Print Header (Only visible in Print) */}
            <div className="print-only" style={{ display: 'none', borderBottom: '2px solid #1e0646', paddingBottom: 20, marginBottom: 30 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  {school?.logo_url ? (
                    <img src={school.logo_url} alt="Logo" style={{ width: 80, height: 80, objectFit: 'contain' }} />
                  ) : (
                    <div style={{ width: 80, height: 80, background: '#f5f3ff', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <School size={40} color="#6d28d9" />
                    </div>
                  )}
                  <div>
                    <h1 style={{ fontSize: 28, fontWeight: 900, color: '#1e0646', margin: 0, letterSpacing: '-0.02em' }}>{school?.name || 'School Financial Report'}</h1>
                    <p style={{ fontSize: 13, color: '#4b5563', margin: '4px 0 0', fontWeight: 600 }}>{school?.address}</p>
                    <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>{school?.phone_number} {school?.email ? `· ${school.email}` : ''}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Audit Report</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1f2937', marginTop: 4 }}>
                    {period === 'term' ? term?.name : period === 'month' ? format(new Date(`${month}-01`), 'MMMM yyyy') : `${format(new Date(customStart), 'dd MMM')} - ${format(new Date(customEnd), 'dd MMM yyyy')}`}
                  </div>
                </div>
              </div>
            </div>

            <style>{`
              @media print {
                .print-only { display: block !important; }
                .no-print { display: none !important; }
                #report-print-area { padding: 40px; }
                body { background: white !important; }
              }
            `}</style>

            {/* P&L Statement */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 30 }}>
              
              {/* Income Column */}
              <div style={{ background: '#fff', border: '1.5px solid #f0eefe', borderRadius: 20, overflow: 'hidden' }}>
                <div style={{ padding: '18px 24px', background: '#ecfdf5', borderBottom: '1px solid #d1fae5', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <TrendingUp size={18} color="#059669" />
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#065f46' }}>Statement of Revenue</span>
                </div>
                <div style={{ padding: '4px 0' }}>
                  {Object.entries(metrics.incomeByCategory).map(([cat, val]) => (
                    <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 24px', borderBottom: '1px solid #fafafa' }}>
                      <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{cat}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{GHS(val)}</span>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '20px 24px', background: '#fafafa', borderTop: '2.5px solid #10b981', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#065f46' }}>Total Gross Revenue</span>
                  <span style={{ fontSize: 16, fontWeight: 900, color: '#047857' }}>{GHS(metrics.totalRevenue)}</span>
                </div>
              </div>

              {/* Expense Column */}
              <div style={{ background: '#fff', border: '1.5px solid #f0eefe', borderRadius: 20, overflow: 'hidden' }}>
                <div style={{ padding: '18px 24px', background: '#fef2f2', borderBottom: '1px solid #fee2e2', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <TrendingDown size={18} color="#dc2626" />
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#991b1b' }}>Statement of Expenditure</span>
                </div>
                <div style={{ padding: '4px 0' }}>
                  {Object.entries(metrics.expenseByCategory).map(([cat, val]) => (
                    <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 24px', borderBottom: '1px solid #fafafa' }}>
                      <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{cat}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{GHS(val)}</span>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '20px 24px', background: '#fafafa', borderTop: '2.5px solid #ef4444', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#991b1b' }}>Total Expenditures</span>
                  <span style={{ fontSize: 16, fontWeight: 900, color: '#b91c1c' }}>{GHS(metrics.totalExpenditure)}</span>
                </div>
              </div>
            </div>

            {/* Final Net Summary */}
            <div style={{ 
              background: metrics.netSurplus >= 0 ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' : 'linear-gradient(135deg, #dc2626 0%, #f14646 100%)',
              borderRadius: 20, padding: '28px 36px', color: '#fff', marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
            }}>
              <div>
                <h4 style={{ fontSize: 13, opacity: 0.9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Net Financial Standing</h4>
                <p style={{ fontSize: 32, fontWeight: 900, margin: '8px 0 0', letterSpacing: '-0.02em' }}>{GHS(metrics.netSurplus)}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ background: 'rgba(255,255,255,0.15)', padding: '10px 20px', borderRadius: 12, fontSize: 13, fontWeight: 800 }}>
                  {metrics.netSurplus >= 0 ? 'NET SURPLUS (PROFIT)' : 'NET DEFICIT (LOSS)'}
                </div>
                <p style={{ fontSize: 11, marginTop: 10, opacity: 0.8 }}>Generated on {format(new Date(), 'PPP')}</p>
              </div>
            </div>

            {/* Itemized Ledger Table */}
            <div style={{ background: '#fff', border: '1.5px solid #f0eefe', borderRadius: 20, overflow: 'hidden' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1.5px solid #f0eefe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <TableIcon size={18} color="#1e0646" />
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#1e0646' }}>Itemized Audit Ledger</span>
                </div>
                <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>{metrics.ledger.length} Transactions found</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
                  <thead>
                    <tr style={{ background: '#fcfaff' }}>
                      {['Date', 'Description', 'Type', 'Category', 'Amount', 'Method'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '14px 24px', fontSize: 11, fontWeight: 800, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.ledger.map((l, i) => (
                      <tr key={i} className="rp-row" style={{ borderBottom: '1px solid #f0eefe' }}>
                        <td style={{ padding: '14px 24px', fontSize: 13, color: '#6b7280' }}>{format(new Date(l.date), 'dd MMM yyyy')}</td>
                        <td style={{ padding: '14px 24px', fontSize: 13, fontWeight: 700, color: '#111827' }}>{l.desc}</td>
                        <td style={{ padding: '14px 24px' }}>
                          <span style={{ fontSize: 10, fontWeight: 800, background: l.type === 'Revenue' ? '#f0fdf4' : '#fef2f2', color: l.type === 'Revenue' ? '#16a34a' : '#dc2626', padding: '3px 10px', borderRadius: 8 }}>{l.type}</span>
                        </td>
                        <td style={{ padding: '14px 24px', fontSize: 13, color: '#6b7280' }}>{l.cat}</td>
                        <td style={{ padding: '14px 24px', fontSize: 14, fontWeight: 800, color: l.type === 'Revenue' ? '#059669' : '#dc2626' }}>
                          {l.type === 'Revenue' ? '+' : '-'}{GHS(l.amount)}
                        </td>
                        <td style={{ padding: '14px 24px', fontSize: 12, color: '#9ca3af', textTransform: 'capitalize' }}>{l.method.replace('_', ' ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </div>
    </>
  )
}
