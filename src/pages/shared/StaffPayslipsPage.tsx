import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useSettings } from '../../hooks/useSettings'
import { supabase } from '../../lib/supabase'
import { useQuery } from '@tanstack/react-query'
import FlaskLoader from '../../components/ui/FlaskLoader'
import { FileText, Download, DollarSign, Calendar, ChevronDown, CheckCircle2 } from 'lucide-react'

const GHS = (n: number) => `GH₵ ${Number(n || 0).toLocaleString('en-GH', { minimumFractionDigits: 2 })}`

export default function StaffPayslipsPage() {
  const { user } = useAuth()
  const { data: settings } = useSettings()
  const school = settings?.school
  
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())

  const { data: payslips = [], isLoading } = useQuery({
    queryKey: ['staff_payslips', user?.id, selectedYear],
    queryFn: async () => {
      if (!user?.id) return []
      const { data, error } = await supabase
        .from('staff_payslips')
        .select('*')
        .eq('user_id', user.id)
        .eq('year', selectedYear)
        .order('generated_at', { ascending: false })
      
      if (error) throw error
      return data || []
    },
    enabled: !!user?.id
  })

  const printA4 = (row: any) => {
    const win = window.open('', '_blank', 'width=800,height=900')
    if (!win) return
    const logoHtml = school?.logo_url 
      ? `<img src="${school.logo_url}" style="width: 72px; height: 72px; border-radius: 50%; object-fit: contain; border: 1.5px solid #ede9fe; padding: 4px; background: #fff;" />`
      : `<div style="width: 72px; height: 72px; border-radius: 50%; background: #4c1d95; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 24px;">W</div>`

    const allowancesHtml = (row.allowances || []).map((a: any) => `
      <tr><td style="color:#64748b">${a.name}</td><td align="right" style="font-weight:700;color:#059669">+${GHS(a.amount)}</td></tr>
    `).join('')

    const deductionsHtml = (row.deductions || []).map((d: any) => `
      <tr><td style="color:#64748b">${d.name}</td><td align="right" style="font-weight:700;color:#dc2626">-${GHS(d.amount)}</td></tr>
    `).join('')

    win.document.write(`<html><head><title>Payslip - ${row.month} ${row.year}</title>
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
        table{width:100%;border-collapse:collapse; margin-bottom: 30px;}
        th{text-align:left;font-size:11px;text-transform:uppercase;color:#64748b;padding-bottom:15px;letter-spacing:0.1em;border-bottom:1px solid #e2e8f0}
        td{padding:12px 0;border-bottom:1px solid #f1f5f9;font-size:14px;color:#334155}
        .total-row{display:flex;justify-content:space-between;align-items:center;background:linear-gradient(135deg,#4c1d95,#2e1065);padding:24px 30px;border-radius:16px;color:#fff;box-shadow:0 8px 20px rgba(76,29,149,0.15)}
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
              <div style="font-size:16px;font-weight:700;margin-top:8px;color:#111827">${row.month} ${row.year}</div>
            </div>
          </div>
          <div class="box">
            <div><b>Employee Name</b><span>${user?.full_name}</span></div>
            <div style="text-align:right"><b>Process Status</b><span style="color:#059669">COMPLETED</span></div>
            <div><b>Payment Date</b><span>${new Date(row.generated_at).toLocaleDateString()}</span></div>
            <div style="text-align:right"><b>Method</b><span style="text-transform:uppercase">${row.payment_method || 'Cash'}</span></div>
          </div>
          
          <table>
            <thead><tr><th>Earnings & Deductions</th><th align="right">Amount (GH₵)</th></tr></thead>
            <tbody>
              <tr><td style="font-weight:600">Basic Salary</td><td align="right" style="font-weight:800;color:#111827">${GHS(row.basic_salary)}</td></tr>
              ${allowancesHtml}
              ${deductionsHtml}
            </tbody>
          </table>

          <div class="total-row">
            <div>
              <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;opacity:0.8;margin-bottom:4px">Net Amount Disbursed</div>
              <div class="val">${GHS(row.net_salary)}</div>
            </div>
            <div style="text-align:right">
              ${row.account_number ? `<div style="font-size:12px;opacity:0.9">Ref: ${row.account_number}</div>` : ''}
              <div style="font-size:10px;text-transform:uppercase;margin-top:4px;opacity:0.7">Generated: ${new Date(row.generated_at).toLocaleString()}</div>
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

  if (isLoading) return <FlaskLoader fullScreen={false} label="Loading Payslips..." />

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1000, margin: '0 auto', fontFamily: '"DM Sans", sans-serif', animation: '_fadeIn 0.4s ease' }}>
      <style>{`
        @keyframes _fadeIn { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
        .payslip-card { transition: all 0.2s ease; }
        .payslip-card:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(109,40,217,0.06); border-color: #ddd6fe; }
      `}</style>
      
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 32, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>
            My Payslips
          </h1>
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>View and download your monthly salary vouchers.</p>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1.5px solid #f0eefe', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Calendar size={18} color="#6d28d9" />
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 14, fontWeight: 700, color: '#374151', cursor: 'pointer' }}
          >
            {[...Array(5)].map((_, i) => {
              const yr = new Date().getFullYear() - i
              return <option key={yr} value={yr}>{yr}</option>
            })}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        {payslips.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 20, border: '2px dashed #e2e8f0', padding: 60, textAlign: 'center' }}>
            <FileText size={48} color="#cbd5e1" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', margin: '0 0 8px' }}>No payslips found for {selectedYear}</h3>
            <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>When payroll is processed by the bursar, your payslips will appear here.</p>
          </div>
        ) : (
          payslips.map(ps => (
            <div key={ps.id} className="payslip-card" style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ width: 56, height: 56, background: '#f5f3ff', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6d28d9' }}>
                   <DollarSign size={28} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Salary Voucher</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginTop: 2 }}>{ps.month} {ps.year}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                    <CheckCircle2 size={14} color="#059669" />
                    <span style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>Paid via {ps.payment_method.toUpperCase()}</span>
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <div style={{ textAlign: 'right' }}>
                   <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Net Pay</div>
                   <div style={{ fontSize: 20, fontWeight: 900, color: '#1e0646' }}>{GHS(ps.net_salary)}</div>
                </div>
                <button 
                  onClick={() => printA4(ps)}
                  style={{ background: '#6d28d9', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 12px rgba(109,40,217,0.2)' }}
                >
                  <Download size={18} /> Download PDF
                </button>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  )
}
