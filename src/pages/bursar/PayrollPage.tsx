// src/pages/bursar/PayrollPage.tsx
import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import { payrollService } from '../../services/bursar.service'
import { useSettings } from '../../hooks/useSettings'
import { supabase } from '../../lib/supabase'
import Modal from '../../components/ui/Modal'
import toast from 'react-hot-toast'
import { Plus, CheckCircle2, Users, DollarSign, Trash2, Calendar, FileText, ChevronRight, ArrowUpRight, ArrowDownRight, Receipt, School, MessageSquare, Send, Banknote, Smartphone, Building, BarChart2 } from 'lucide-react'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, getISOWeek } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'

const GHS = (n: number) => `GH₵ ${Number(n || 0).toLocaleString('en-GH', { minimumFractionDigits: 2 })}`

const CREST_SVG = `
  <svg width="48" height="48" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
    <circle cx="28" cy="28" r="26" fill="none" stroke="#4c1d95" stroke-width="1.5"/>
    <polygon points="28,9 32.5,21.5 46,21.5 35,29 39,42 28,34 17,42 21,29 10,21.5 23.5,21.5"
      fill="none" stroke="#4c1d95" stroke-width="1.3" stroke-linejoin="round"/>
    <circle cx="28" cy="28" r="4.5" fill="#4c1d95" opacity="0.75"/>
  </svg>`

function Btn({ children, onClick, variant = 'primary', disabled, style }: any) {
  const [h, setH] = useState(false)
  const v: any = {
    primary: { background: h ? '#1e0646' : '#2d0a63', color: '#fff', border: 'none' },
    secondary: { background: h ? '#f9fafb' : '#fff', color: '#374151', border: '1.5px solid #e5e7eb' },
    success: { background: h ? '#059669' : '#10b981', color: '#fff', border: 'none' },
    danger: { background: h ? '#dc2626' : '#ef4444', color: '#fff', border: 'none' },
  }
  return (
    <button onClick={onClick} disabled={disabled} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all .15s', opacity: disabled ? 0.6 : 1, fontFamily: '"DM Sans",sans-serif', ...v[variant], ...style }}>
      {children}
    </button>
  )
}

export default function PayrollPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const schoolId = user?.school_id ?? ''
  const { data: settings } = useSettings()
  const school = settings?.school
  
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [month, setMonth] = useState(currentMonth)
  const [activeTab, setActiveTab] = useState<'monthly'|'weekly'|'daily'|'analytics'>('monthly')
  const currentWeekInfo = getISOWeek(now)
  const [selectedWeek, setSelectedWeek] = useState(currentWeekInfo)
  const [selectedDate, setSelectedDate] = useState(format(now, 'yyyy-MM-dd'))

  // Modals
  const [addModal, setAddModal] = useState(false)
  const [payModal, setPayModal] = useState<any>(null) // { type: 'monthly'|'weekly'|'daily', data: any, staff: any }
  const [shareModal, setShareModal] = useState<any>(null) 
  const [form, setForm] = useState({ user_id: '', basic_salary: '', notes: '' })

  const [weeklyConfigForm, setWeeklyConfigForm] = useState({ user_id: '', amount: '' })
  const [dailyForm, setDailyForm] = useState({ user_id: '', amount: '', description: '', method: 'cash' })

  // Data fetching
  const { data: staff = [] } = useQuery({
    queryKey: ['staff-users', schoolId],
    queryFn: async () => {
      const { data } = await supabase.from('users').select('id, full_name, email, role, designation, phone').eq('school_id', schoolId).in('role', ['teacher', 'admin', 'bursar', 'staff']).eq('is_active', true).order('full_name')
      return data ?? []
    }, enabled: !!schoolId
  })

  const { data: payroll = [], isLoading } = useQuery({
    queryKey: ['payroll', schoolId, month],
    queryFn: async () => { const { data } = await payrollService.getAll(schoolId, month); return data ?? [] },
    enabled: !!schoolId
  })

  const { data: allAdjustments = [] } = useQuery({
    queryKey: ['payroll-adj-all', schoolId, month],
    queryFn: async () => { const { data } = await payrollService.getAdjustmentsBySchoolMonth(schoolId, month); return data ?? [] },
    enabled: !!schoolId
  })

  // Mutations
  const upsertMonthly = useMutation({
    mutationFn: (d: any) => payrollService.upsert(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey:['payroll'] }); setAddModal(false); toast.success('Payroll saved') }
  })
  
  const recordPay = useMutation({
    mutationFn: async ({ type, item, details }: any) => {
      const d = format(new Date(), 'yyyy-MM-dd')
      if(type === 'monthly') return payrollService.markPaid(item.id, d, details)
      else return payrollService.markAdjPaid(item.id, d, details)
    },
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey:['payroll'] }); qc.invalidateQueries({ queryKey:['payroll-adj-all'] });
      setPayModal(null); setShareModal({ type: variables.type, data: data, staff: variables.staff }); toast.success('Payment recorded');
    }
  })

  const saveDaily = useMutation({
    mutationFn: (d: any) => payrollService.saveAdjustment(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey:['payroll-adj-all'] }); qc.invalidateQueries({ queryKey:['payroll'] }); toast.success('Daily allowance recorded'); setDailyForm({ user_id: '', amount: '', description: '', method: 'cash' }) }
  })
  
  const saveWeekly = useMutation({
    mutationFn: (d: any) => payrollService.saveAdjustment(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey:['payroll-adj-all'] }); qc.invalidateQueries({ queryKey:['payroll'] }); toast.success('Weekly payment recorded'); }
  })

  const delRow = useMutation({
    mutationFn: (id: string) => payrollService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payroll'] }); toast.success('Removed') }
  })
  const delAdj = useMutation({
    mutationFn: (id: string) => payrollService.deleteAdjustment(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey:['payroll-adj-all'] }); qc.invalidateQueries({ queryKey:['payroll'] }); toast.success('Removed') }
  })

  // Derived Data
  const weeklyData = useMemo(() => allAdjustments.filter(a => a.type === 'weekly_pay' && a.week_number === selectedWeek), [allAdjustments, selectedWeek])
  const dailyData = useMemo(() => allAdjustments.filter(a => a.type === 'daily_pay' && (a.recorded_at === selectedDate || a.recorded_at?.startsWith(selectedDate))), [allAdjustments, selectedDate])
  
  const analyticsData = useMemo(() => {
    return payroll.map(p => ({
      name: p.user?.full_name?.split(' ')[0],
      salary: p.basic_salary,
      allowance: p.allowances,
      total: p.net_salary
    }))
  }, [payroll])

  const weeklyAnalytics = useMemo(() => {
     // sum of weekly_pay by week_number
     const weeks: any = {}
     allAdjustments.filter(a => a.type === 'weekly_pay').forEach(a => {
        if(!weeks[a.week_number]) weeks[a.week_number] = 0
        weeks[a.week_number] += a.amount
     })
     return Object.keys(weeks).map(w => ({ week: `Wk ${w}`, amount: weeks[w] }))
  }, [allAdjustments])

  // Printers
  const printThermal = (row: any, type: string) => {
    const net = type === 'monthly' ? (row.net_salary || row.basic_salary + (row.allowances||0) - (row.deductions||0)) : row.amount;
    const desc = type === 'monthly' ? `Monthly Salary (${month})` : row.description || `${type} Allowance`;
    const win = window.open('', '_blank', 'width=300,height=600')
    if (!win) return
    win.document.write(`<html><head><style>
      body{font-family:monospace;padding:20px;width:80mm;margin:0;font-size:12px;color:#000}
      .c{text-align:center}.hr{border-top:1px dashed #000;margin:10px 0}.b{font-weight:bold}
      table{width:100%;border-collapse:collapse}td{padding:4px 0}
      .school{font-size:14px;margin-bottom:2px}
      .mode{font-size:10px;margin-top:10px;text-transform:uppercase;letter-spacing:1px}
    </style></head><body onload="setTimeout(() => window.print(), 500)">
      <div class="c b school">${school?.name?.toUpperCase() || 'OFFICIAL PAYSLIP'}</div>
      <div class="c" style="font-size:10px">${school?.address || ''}</div>
      <div class="hr"></div>
      <div class="c b" style="font-size:11px;margin-bottom:10px">PAYMENT RECEIPT</div>
      <div>Staff: <span class="b">${row.user?.full_name || 'Staff Member'}</span></div>
      <div>Date: ${row.paid_date || format(new Date(), 'dd/MM/yyyy')}</div>
      <div class="hr"></div>
      <table>
        <tr><td>${desc}</td><td align="right" class="b">${GHS(net)}</td></tr>
      </table>
      <div class="hr"></div>
      <div class="b">Total Paid: ${GHS(net)}</div>
      <div class="mode">Mode: ${(row.payment_method || 'CASH').toUpperCase()}</div>
      ${row.bank_reference ? `<div style="font-size:9px">Ref: ${row.bank_reference}</div>` : ''}
      <div class="hr"></div>
      <div class="c" style="font-size:10px">Powered by World-Uni Learn</div>
    </body></html>`)
    win.document.close()
  }

  const printA4 = (row: any, type: string) => {
    const net = type === 'monthly' ? (row.net_salary || row.basic_salary + (row.allowances||0) - (row.deductions||0)) : row.amount;
    const desc = type === 'monthly' ? `Monthly Salary` : row.description || `${type} Allowance`;
    const win = window.open('', '_blank', 'width=800,height=900')
    if (!win) return
    const logoHtml = school?.logo_url 
      ? `<img src="${school.logo_url}" style="width: 72px; height: 72px; border-radius: 50%; object-fit: contain; border: 1.5px solid #ede9fe; padding: 4px; background: #fff;" />`
      : CREST_SVG

    win.document.write(`<html><head><title>Payslip - ${row.user?.full_name}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;900&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet">
      <style>
        body{font-family:'DM Sans',sans-serif;padding:60px;color:#1e293b;background:#f8fafc;min-height:100vh;display:flex;justify-content:center;align-items:flex-start}
        .container{width:100%;max-width:800px;background:#fff;padding:50px;border-radius:20px;box-shadow:0 10px 40px rgba(0,0,0,0.04);position:relative;overflow:hidden}
        .watermark{position:absolute;top:20%;left:50%;transform:translate(-50%,-20%) rotate(-15deg);font-size:100px;font-weight:900;color:rgba(76,29,149,0.02);white-space:nowrap;pointer-events:none;z-index:0}
        .content{position:relative;z-index:1}
        .header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #4c1d95;padding-bottom:25px;margin-bottom:40px}
        .school-name{font-family:'Playfair Display',serif;font-size:26px;font-weight:900;color:#1e0646;margin:0}
        .box{border:1px solid #f1f5f9;border-radius:16px;padding:24px;margin-bottom:30px;background:#f8fafc;display:grid;grid-template-columns:1fr 1fr;gap:20px}
        .box div b{display:block;font-size:10px;text-transform:uppercase;color:#64748b;letter-spacing:0.1em;margin-bottom:6px}
        .box div span{font-size:18px;font-weight:800;color:#111827}
        table{width:100%;border-collapse:collapse}
        th{text-align:left;font-size:11px;text-transform:uppercase;color:#64748b;padding-bottom:15px;letter-spacing:0.1em;border-bottom:1px solid #e2e8f0}
        td{padding:15px 0;border-bottom:1px solid #f1f5f9;font-size:14px;color:#334155}
        .total-row{margin-top:50px;display:flex;justify-content:space-between;align-items:center;background:linear-gradient(135deg,#4c1d95,#2e1065);padding:24px 30px;border-radius:16px;color:#fff;box-shadow:0 8px 20px rgba(76,29,149,0.15)}
        .total-row .val{font-size:28px;font-weight:900}
        .footer{margin-top:60px;text-align:center;font-size:10px;color:#94a3b8;border-top:1px dashed #e2e8f0;padding-top:20px}
        @media print{body{padding:0;background:#fff} .container{box-shadow:none;border-radius:0;padding:20px}}
      </style></head><body onload="setTimeout(() => window.print(), 500)">
      <div class="container">
        <div class="watermark">OFFICIAL PAYSLIP</div>
        <div class="content">
          <div class="header">
            <div style="display:flex;align-items:center;gap:20px">
              ${logoHtml}
              <div>
                <div class="school-name">${school?.name || 'School System'}</div>
                <div style="font-size:13px;color:#64748b;margin-top:4px">📍 ${school?.address || ''}</div>
              </div>
            </div>
            <div style="text-align:right">
              <div style="text-transform:uppercase;font-size:11px;font-weight:900;color:#6d28d9;letter-spacing:0.2em;background:#f5f3ff;padding:6px 12px;border-radius:6px">Salary Voucher</div>
              <div style="font-size:16px;font-weight:700;margin-top:8px;color:#111827">${month}</div>
            </div>
          </div>
          <div class="box">
            <div><b>Employee Name</b><span>${row.user?.full_name}</span></div>
            <div style="text-align:right"><b>Process Status</b><span style="color:#059669">COMPLETED</span></div>
            <div><b>Payment Date</b><span>${row.paid_date || format(new Date(), 'dd MMMM yyyy')}</span></div>
            <div style="text-align:right"><b>Method</b><span style="text-transform:uppercase">${row.payment_method || 'Cash'}</span></div>
          </div>
          <table><thead><tr><th>Description of Payment</th><th align="right">Amount Allocated</th></tr></thead>
            <tbody>
              <tr><td style="font-weight:600">${desc}</td><td align="right" style="font-weight:800;color:#111827">${GHS(net)}</td></tr>
            </tbody>
          </table>
          <div class="total-row">
            <div>
              <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;opacity:0.8;margin-bottom:4px">Net Amount Disbursed</div>
              <div class="val">${GHS(net)}</div>
            </div>
            <div style="text-align:right">
              ${row.bank_reference ? `<div style="font-size:12px;opacity:0.9">Ref: ${row.bank_reference}</div>` : ''}
              <div style="font-size:10px;text-transform:uppercase;margin-top:4px;opacity:0.7">${new Date().toLocaleString()}</div>
            </div>
          </div>
          <div style="margin-top:60px;display:grid;grid-template-columns:1fr 1fr;gap:60px">
            <div style="border-top:1.5px solid #111827;padding-top:10px;text-align:center;font-size:11px;font-weight:700">Accountant / Bursar Signature</div>
            <div style="border-top:1.5px solid #111827;padding-top:10px;text-align:center;font-size:11px;font-weight:700">Employee Signature</div>
          </div>
          <div class="footer">
            This is an electronically generated document. &copy; ${new Date().getFullYear()} ${school?.name || 'School System'}
          </div>
        </div>
      </div>
    </body></html>`)
    win.document.close()
  }

  // Renderers
  return (
    <div style={{ paddingBottom: 60, fontFamily: '"DM Sans", system-ui, sans-serif' }}>
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1e0646', margin: 0 }}>Staff Payroll</h1>
          <p style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>Manage monthly salaries, daily pay, and allowances.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ background: '#fff', padding: '10px 18px', borderRadius: 12, border: '1.5px solid #f0eefe', display: 'flex', alignItems: 'center', gap: 12 }}>
            <Calendar size={18} color="#6d28d9" />
            <input type="month" value={month} onChange={e => setMonth(e.target.value)} style={{ border: 'none', background: 'none', outline: 'none', color: '#111827', fontWeight: 800, fontSize: 14 }} />
          </div>
          {activeTab === 'monthly' && <Btn onClick={() => setAddModal(true)}><Plus size={16} /> Setup Staff</Btn>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, background: '#f9fafb', padding: 6, borderRadius: 16, width: 'fit-content' }}>
        {[
          { id: 'monthly', icon: Users, label: 'Monthly Pay' },
          { id: 'weekly', icon: Calendar, label: 'Weekly Allowances' },
          { id: 'daily', icon: DollarSign, label: 'Daily Pay' },
          { id: 'analytics', icon: BarChart2, label: 'Analytics' }
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)} style={{ padding: '8px 16px', borderRadius: 12, border: 'none', background: activeTab === t.id ? '#fff' : 'transparent', color: activeTab === t.id ? '#6d28d9' : '#6b7280', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, boxShadow: activeTab === t.id ? '0 4px 12px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer', transition: 'all 0.2s' }}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {/* TAB: MONTHLY */}
      {activeTab === 'monthly' && (
        <div style={{ background: '#fff', borderRadius: 24, border: '1.5px solid #f0eefe', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fcfaff', borderBottom: '1.5px solid #f0eefe' }}>
                <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: 11, fontWeight: 800, color: '#6d28d9', textTransform: 'uppercase' }}>Staff</th>
                <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: 11, fontWeight: 800, color: '#6d28d9', textTransform: 'uppercase' }}>Basic Pay</th>
                <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: 11, fontWeight: 800, color: '#6d28d9', textTransform: 'uppercase' }}>Allowances</th>
                <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: 11, fontWeight: 800, color: '#6d28d9', textTransform: 'uppercase' }}>Net Pay</th>
                <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: 11, fontWeight: 800, color: '#6d28d9', textTransform: 'uppercase' }}>Bal Due</th>
                <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: 11, fontWeight: 800, color: '#6d28d9', textTransform: 'uppercase' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {payroll.map(row => {
                const bal = row.net_salary - (row.adjustments_paid_total || 0);
                return (
                <tr key={row.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ fontSize: 15, fontWeight: 800 }}>{row.user?.full_name}</div>
                    <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'capitalize' }}>{row.user?.designation || row.user?.role}</div>
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 700 }}>{GHS(row.basic_salary)}</td>
                  <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 700, color: '#059669' }}>+{GHS(row.allowances)}</td>
                  <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 800 }}>{GHS(row.net_salary)}</td>
                  <td style={{ padding: '14px 20px', fontSize: 15, fontWeight: 900, color: bal > 0 ? '#16a34a' : '#9ca3af' }}>{GHS(bal)}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {row.is_paid ? (
                        <Btn variant="secondary" onClick={() => setShareModal({ type: 'monthly', data: row, staff: row.user })}><CheckCircle2 size={16} color="#059669" /> Paid - Share</Btn>
                      ) : (
                        <Btn onClick={() => setPayModal({ type: 'monthly', data: row, staff: row.user, amount: bal })}>Pay Now</Btn>
                      )}
                      <button onClick={() => { if(confirm('Are you sure you want to delete this payroll record?')) delRow.mutate(row.id) }} style={{ border: 'none', background: '#fef2f2', color: '#dc2626', width: 34, height: 34, borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )})}
              {payroll.length === 0 && <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>No payroll data for this month.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB: WEEKLY */}
      {activeTab === 'weekly' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 24 }}>
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <select value={selectedWeek} onChange={e => setSelectedWeek(Number(e.target.value))} style={{ padding: '10px 16px', borderRadius: 12, border: '1.5px solid #e5e7eb', background: '#fff', fontWeight: 700 }}>
                 {[...Array(5)].map((_, i) => <option key={i} value={currentWeekInfo - i}>Week {currentWeekInfo - i}</option>)}
              </select>
            </div>
            <div style={{ background: '#fff', borderRadius: 24, border: '1.5px solid #f0eefe', padding: 24, marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Record Weekly Top-up</h3>
              <div style={{ display: 'flex', gap: 12 }}>
                <select value={weeklyConfigForm.user_id} onChange={e => setWeeklyConfigForm({...weeklyConfigForm, user_id: e.target.value})} style={{ flex: 1, padding: 12, borderRadius: 12, border: '1.5px solid #e5e7eb' }}>
                  <option value="">Select Staff...</option>
                  {staff.map((s:any) => <option key={s.id} value={s.id}>{s.full_name} {s.designation ? `(${s.designation})` : ''}</option>)}
                </select>
                <input type="number" placeholder="Amount (GH₵)" value={weeklyConfigForm.amount} onChange={e => setWeeklyConfigForm({...weeklyConfigForm, amount: e.target.value})} style={{ width: 150, padding: 12, borderRadius: 12, border: '1.5px solid #e5e7eb' }} />
                <Btn onClick={() => {
                   if(!weeklyConfigForm.user_id) return toast.error('Select staff')
                   saveWeekly.mutate({ school_id: schoolId, user_id: weeklyConfigForm.user_id, month, type: 'weekly_pay', amount: Number(weeklyConfigForm.amount), description: `Week ${selectedWeek} Top-up`, week_number: selectedWeek, recorded_at: format(new Date(), 'yyyy-MM-dd') })
                }}>Add</Btn>
              </div>
            </div>
            <div style={{ background: '#fff', borderRadius: 24, border: '1.5px solid #f0eefe', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    <th style={{ textAlign: 'left', padding: '14px 20px', fontSize: 12, color: '#6b7280' }}>Staff</th>
                    <th style={{ textAlign: 'left', padding: '14px 20px', fontSize: 12, color: '#6b7280' }}>Amount</th>
                    <th style={{ textAlign: 'left', padding: '14px 20px', fontSize: 12, color: '#6b7280' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklyData.map((row:any) => (
                    <tr key={row.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ fontWeight: 800 }}>{row.user?.full_name}</div>
                        <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 600, textTransform: 'capitalize' }}>{row.user?.designation || row.user?.role}</div>
                      </td>
                      <td style={{ padding: '14px 20px', fontWeight: 800 }}>{GHS(row.amount)}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          {row.is_paid ? <span style={{ color: '#059669', fontSize: 12, fontWeight: 800 }}><CheckCircle2 size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }}/>Paid</span> : <Btn onClick={() => setPayModal({ type: 'weekly', data: row, staff: row.user, amount: row.amount })}>Pay</Btn>}
                          <button onClick={() => { if(confirm('Delete weekly record?')) delAdj.mutate(row.id) }} style={{ border: 'none', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', display: 'inline-flex', padding: 6, borderRadius: 6, marginLeft: 12 }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {weeklyData.length === 0 && <tr><td colSpan={3} style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>No weekly records found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ background: '#fff', borderRadius: 24, border: '1.5px solid #f0eefe', padding: 24, height: 'fit-content' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 20 }}>Weekly Payout Trends</h3>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyAnalytics}><XAxis dataKey="week" tick={{fontSize:12}} /><RechartsTooltip cursor={{fill:'#f3f4f6'}}/><Bar dataKey="amount" fill="#6d28d9" radius={[4,4,0,0]} /></BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB: DAILY */}
      {activeTab === 'daily' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 24 }}>
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{ padding: '10px 16px', borderRadius: 12, border: '1.5px solid #e5e7eb', background: '#fff', fontWeight: 700 }} />
            </div>
            <div style={{ background: '#fff', borderRadius: 24, border: '1.5px solid #f0eefe', padding: 24, marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Record Daily Cash/Allowance</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <select value={dailyForm.user_id} onChange={e => setDailyForm({...dailyForm, user_id: e.target.value})} style={{ padding: 12, borderRadius: 12, border: '1.5px solid #e5e7eb' }}>
                  <option value="">Select Staff...</option>
                  {staff.map((s:any) => <option key={s.id} value={s.id}>{s.full_name} {s.designation ? `(${s.designation})` : ''}</option>)}
                </select>
                <input type="number" placeholder="Amount (GH₵)" value={dailyForm.amount} onChange={e => setDailyForm({...dailyForm, amount: e.target.value})} style={{ padding: 12, borderRadius: 12, border: '1.5px solid #e5e7eb' }} />
                <input placeholder="Reason (e.g. Lunch)" value={dailyForm.description} onChange={e => setDailyForm({...dailyForm, description: e.target.value})} style={{ padding: 12, borderRadius: 12, border: '1.5px solid #e5e7eb', gridColumn: 'span 2' }} />
                <Btn style={{ gridColumn: 'span 2' }} onClick={() => {
                   if(!dailyForm.user_id) return toast.error('Select staff')
                   saveDaily.mutate({ school_id: schoolId, user_id: dailyForm.user_id, month, type: 'daily_pay', amount: Number(dailyForm.amount), description: dailyForm.description, recorded_at: selectedDate, is_paid: true, paid_date: selectedDate, payment_method: 'cash' })
                }}>Save & Auto-Pay Cash</Btn>
              </div>
            </div>
            <div style={{ background: '#fff', borderRadius: 24, border: '1.5px solid #f0eefe', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    <th style={{ textAlign: 'left', padding: '14px 20px', fontSize: 12, color: '#6b7280' }}>Staff</th>
                    <th style={{ textAlign: 'left', padding: '14px 20px', fontSize: 12, color: '#6b7280' }}>Reason</th>
                    <th style={{ textAlign: 'left', padding: '14px 20px', fontSize: 12, color: '#6b7280' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyData.map((row:any) => (
                    <tr key={row.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ fontWeight: 800 }}>{row.user?.full_name}</div>
                        <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 600, textTransform: 'capitalize' }}>{row.user?.designation || row.user?.role}</div>
                      </td>
                      <td style={{ padding: '14px 20px', color: '#6b7280', fontSize: 13 }}>{row.description}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <span style={{ fontWeight: 800, color: '#059669' }}>{GHS(row.amount)}</span>
                          <button onClick={() => { if(confirm('Delete daily expected payout?')) delAdj.mutate(row.id) }} style={{ border: 'none', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', display: 'inline-flex', padding: 6, borderRadius: 6, marginLeft: 'auto' }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {dailyData.length === 0 && <tr><td colSpan={3} style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>No daily records for this date.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ background: '#fff', borderRadius: 24, border: '1.5px solid #f0eefe', padding: 24, height: 'fit-content' }}>
             <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 20 }}>Today's Total Cashout</h3>
             <div style={{ fontSize: 32, fontWeight: 900, color: '#6d28d9' }}>{GHS(dailyData.reduce((s:any, x:any) => s + Number(x.amount), 0))}</div>
          </div>
        </div>
      )}

      {/* TAB: ANALYTICS */}
      {activeTab === 'analytics' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20, marginBottom: 30 }}>
             <div style={{ background: '#fff', padding: 24, borderRadius: 24, border: '1.5px solid #f0eefe' }}>
               <div style={{ color: '#6b7280', fontSize: 13, fontWeight: 700 }}>Total Month Gross</div>
               <div style={{ fontSize: 28, fontWeight: 900, color: '#1e0646', marginTop: 8 }}>{GHS(payroll.reduce((s,x) => s + x.basic_salary + x.allowances, 0))}</div>
             </div>
             <div style={{ background: '#fff', padding: 24, borderRadius: 24, border: '1.5px solid #f0eefe' }}>
               <div style={{ color: '#6b7280', fontSize: 13, fontWeight: 700 }}>Total Paid to Date</div>
               <div style={{ fontSize: 28, fontWeight: 900, color: '#059669', marginTop: 8 }}>{GHS(payroll.filter(p=>p.is_paid).reduce((s,x) => s + x.net_salary, 0))}</div>
             </div>
             <div style={{ background: '#fff', padding: 24, borderRadius: 24, border: '1.5px solid #f0eefe' }}>
               <div style={{ color: '#6b7280', fontSize: 13, fontWeight: 700 }}>Outstanding Month Balance</div>
               <div style={{ fontSize: 28, fontWeight: 900, color: '#dc2626', marginTop: 8 }}>{GHS(payroll.filter(p=>!p.is_paid).reduce((s,x) => s + (x.net_salary - (x.adjustments_paid_total||0)), 0))}</div>
             </div>
          </div>
          <div style={{ background: '#fff', borderRadius: 24, border: '1.5px solid #f0eefe', padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 30 }}>Staff Pay Breakdown</h3>
            <div style={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={{fontSize:12, fill:'#6b7280'}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize:12, fill:'#6b7280'}} axisLine={false} tickLine={false} tickFormatter={v => 'GH₵'+v} />
                  <RechartsTooltip cursor={{fill:'#f9fafb'}} contentStyle={{borderRadius:12, border:'none', boxShadow:'0 10px 20px rgba(0,0,0,0.1)'}} />
                  <Bar dataKey="salary" stackId="a" fill="#6d28d9" radius={[0,0,4,4]} />
                  <Bar dataKey="allowance" stackId="a" fill="#10b981" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* --- MODALS --- */}

      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add Staff to Monthly Roll">
        <div style={{ display: 'grid', gap: 16 }}>
          <select value={form.user_id} onChange={e => setForm({...form, user_id: e.target.value})} style={{ padding: 12, borderRadius: 12, border: '1.5px solid #e5e7eb', width: '100%' }}>
            <option value="">Select Staff...</option>
            {staff.map((s:any) => <option key={s.id} value={s.id}>{s.full_name} {s.designation ? `(${s.designation})` : ''}</option>)}
          </select>
          <input type="number" placeholder="Monthly Basic Salary" value={form.basic_salary} onChange={e => setForm({...form, basic_salary: e.target.value})} style={{ padding: 12, borderRadius: 12, border: '1.5px solid #e5e7eb', width: '100%' }} />
          <Btn onClick={() => upsertMonthly.mutate({ school_id: schoolId, user_id: form.user_id, month, basic_salary: Number(form.basic_salary) })}>Save Staff Payroll</Btn>
        </div>
      </Modal>

      {payModal && (
        <Modal open={true} onClose={() => setPayModal(null)} title="Process Payment" subtitle={`Paying ${payModal.staff?.full_name} — ${GHS(payModal.amount)}`}>
           <PaymentMethodForm onConfirm={(details:any) => recordPay.mutate({ type: payModal.type, item: payModal.data, staff: payModal.staff, details })} />
        </Modal>
      )}

      {shareModal && (
        <Modal open={true} onClose={() => setShareModal(null)} title="Payment Success!">
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ width: 64, height: 64, background: '#ecfdf5', borderRadius: '50%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <CheckCircle2 size={32} color="#10b981" />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 900 }}>{GHS(shareModal.type === 'monthly' ? shareModal.data.net_salary : shareModal.data.amount)} Paid</h3>
            <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 24, marginTop: 4 }}>To {shareModal.staff?.full_name} via {shareModal.data.payment_method?.toUpperCase() || 'CASH'}</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
               <button onClick={() => printA4(shareModal.data, shareModal.type)} style={{ padding: 14, borderRadius: 16, border: '1.5px solid #e5e7eb', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <FileText size={24} color="#0284c7" /> <span style={{ fontSize: 12, fontWeight: 700 }}>A4 Payslip</span>
               </button>
               <button onClick={() => printThermal(shareModal.data, shareModal.type)} style={{ padding: 14, borderRadius: 16, border: '1.5px solid #e5e7eb', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <Receipt size={24} color="#a21caf" /> <span style={{ fontSize: 12, fontWeight: 700 }}>Thermal Rec.</span>
               </button>
               <button onClick={() => {
                   const txt = `Hello ${shareModal.staff.full_name}, your ${shareModal.type} pay of ${GHS(shareModal.type === 'monthly' ? shareModal.data.net_salary : shareModal.data.amount)} has been paid via ${(shareModal.data.payment_method||'Cash').toUpperCase()}. Ref: ${shareModal.data.bank_reference||'None'}.`
                   window.open(`https://wa.me/${shareModal.staff.phone?.replace(/\D/g, '') || ''}?text=${encodeURIComponent(txt)}`, '_blank')
               }} style={{ padding: 14, borderRadius: 16, border: '1.5px solid #e5e7eb', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <MessageSquare size={24} color="#25d366" /> <span style={{ fontSize: 12, fontWeight: 700 }}>WhatsApp</span>
               </button>
               <button onClick={() => toast.success('SMS Queued')} style={{ padding: 14, borderRadius: 16, border: '1.5px solid #e5e7eb', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <MessageSquare size={24} color="#2563eb" /> <span style={{ fontSize: 12, fontWeight: 700 }}>Send SMS</span>
               </button>
            </div>
            <Btn variant="secondary" onClick={() => setShareModal(null)} style={{ marginTop: 24, width: '100%' }}>Done</Btn>
          </div>
        </Modal>
      )}

    </div>
  )
}

function PaymentMethodForm({ onConfirm }: any) {
   const [md, setMd] = useState('cash')
   const [ref, setRef] = useState('')
   const [bank, setBank] = useState('')
   const methods = [
     { id: 'cash', label: 'Cash', icon: Banknote },
     { id: 'bank', label: 'Bank', icon: Building },
     { id: 'momo', label: 'MoMo', icon: Smartphone }
   ]
   return (
     <div>
       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
         {methods.map(m => (
           <div key={m.id} onClick={() => setMd(m.id)} style={{ padding: '16px 10px', borderRadius: 16, border: md === m.id ? '2px solid #6d28d9' : '1.5px solid #e5e7eb', background: md === m.id ? '#fcfaff' : '#fff', textAlign: 'center', cursor: 'pointer', opacity: md === m.id ? 1 : 0.6, transition: 'all 0.15s' }}>
             <m.icon size={24} color={md === m.id ? '#6d28d9' : '#6b7280'} style={{ margin: '0 auto 8px' }} />
             <div style={{ fontSize: 12, fontWeight: 800, color: md === m.id ? '#6d28d9' : '#4b5563' }}>{m.label}</div>
           </div>
         ))}
       </div>
       {md === 'bank' && (
         <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
           <input placeholder="Bank Name" value={bank} onChange={e => setBank(e.target.value)} style={{ padding: 12, borderRadius: 12, border: '1.5px solid #e5e7eb', width: '100%' }} />
           <input placeholder="Ref / Cheque No" value={ref} onChange={e => setRef(e.target.value)} style={{ padding: 12, borderRadius: 12, border: '1.5px solid #e5e7eb', width: '100%' }} />
         </div>
       )}
       {md === 'momo' && (
         <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
           <select value={bank} onChange={e => setBank(e.target.value)} style={{ padding: 12, borderRadius: 12, border: '1.5px solid #e5e7eb', width: '100%' }}><option value="">Network...</option><option value="mtn">MTN</option><option value="voda">Vodafone</option><option value="airtel">AirtelTigo</option></select>
           <input placeholder="Phone / Ref No" value={ref} onChange={e => setRef(e.target.value)} style={{ padding: 12, borderRadius: 12, border: '1.5px solid #e5e7eb', width: '100%' }} />
         </div>
       )}
       <Btn onClick={() => onConfirm({ payment_method: md, bank_name: bank, bank_reference: ref })} style={{ width: '100%', justifyContent: 'center' }}>Confirm & Record Payment</Btn>
     </div>
   )
}
