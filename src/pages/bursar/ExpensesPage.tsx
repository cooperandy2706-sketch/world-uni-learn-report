// src/pages/bursar/ExpensesPage.tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import { expenseService } from '../../services/bursar.service'
import toast from 'react-hot-toast'
import { Plus, Trash2, TrendingDown } from 'lucide-react'

const GHS = (n: number) => `GH₵ ${Number(n).toLocaleString('en-GH', { minimumFractionDigits: 2 })}`
const CATS = ['Utilities (Water/Electric)', 'Salaries & Wages', 'Teaching Materials', 'Maintenance & Repairs', 'School Events', 'Examination Costs', 'Transport', 'Stationery & Supplies', 'Catering', 'Security', 'ICT / Equipment', 'Other']

function Btn({ children, onClick, variant = 'primary', disabled, loading, style }: any) {
  const [h, setH] = useState(false)
  const v: any = {
    primary: { background: h ? '#5b21b6' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', border: 'none' },
    secondary: { background: h ? '#f5f3ff' : '#fff', color: '#374151', border: '1.5px solid #e5e7eb' },
    danger: { background: h ? '#b91c1c' : '#dc2626', color: '#fff', border: 'none' },
  }
  return (
    <button onClick={onClick} disabled={disabled} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all .15s', opacity: disabled ? 0.6 : 1, fontFamily: '"DM Sans",sans-serif', ...v[variant], ...style }}>
      {loading && <span style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', animation: '_exp_spin .7s linear infinite', flexShrink: 0 }} />}
      {children}
    </button>
  )
}

export default function ExpensesPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const schoolId = user?.school_id ?? ''
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ category: CATS[0], description: '', amount: '', date: new Date().toISOString().split('T')[0], vendor: '' })
  const [filterCat, setFilterCat] = useState('')

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['expenses', schoolId, year],
    queryFn: async () => { const { data } = await expenseService.getAll(schoolId, year); return data ?? [] },
    enabled: !!schoolId,
  })

  const addRecord = useMutation({
    mutationFn: (d: any) => expenseService.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); setShowForm(false); setForm({ category: CATS[0], description: '', amount: '', date: new Date().toISOString().split('T')[0], vendor: '' }); toast.success('Expense recorded') },
    onError: (e: any) => toast.error(e.message),
  })

  const delRecord = useMutation({
    mutationFn: (id: string) => expenseService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); toast.success('Deleted') },
  })

  function handleAdd() {
    if (!form.amount || !form.description) { toast.error('Enter amount and description'); return }
    addRecord.mutate({ school_id: schoolId, category: form.category, description: form.description, amount: parseFloat(form.amount), date: form.date, vendor: form.vendor || null, recorded_by: user?.id ?? null })
  }

  const filtered = filterCat ? (records as any[]).filter((r: any) => r.category === filterCat) : records as any[]
  const totalExpenses = (records as any[]).reduce((s: number, r: any) => s + (r.amount || 0), 0)
  const filteredTotal = filtered.reduce((s: number, r: any) => s + (r.amount || 0), 0)

  const byCategory: Record<string, number> = {}
  for (const r of records as any[]) byCategory[r.category] = (byCategory[r.category] || 0) + r.amount

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');
        @keyframes _exp_spin { to{transform:rotate(360deg)} }
        @keyframes _exp_fi { from{opacity:0} to{opacity:1} }
        .exp-row:hover { background: #fef2f2 !important; }
      `}</style>
      <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif', animation: '_exp_fi .4s ease' }}>
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>Expense Records</h1>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 3 }}>Total expenditure — {GHS(totalExpenses)}</p>
          </div>
          <Btn variant="danger" onClick={() => setShowForm(v => !v)}><Plus size={14} /> {showForm ? 'Hide Form' : 'Record Expense'}</Btn>
        </div>

        {/* Add form */}
        {showForm && (
          <div style={{ background: '#fff', borderRadius: 18, padding: 24, border: '1.5px solid #fecaca', marginBottom: 24, boxShadow: '0 2px 12px rgba(220,38,38,.08)' }}>
            <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Record New Expense</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { label: 'Category', content: <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none' }}>{CATS.map(c => <option key={c}>{c}</option>)}</select> },
                { label: 'Amount (GH₵) *', content: <input type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} /> },
                { label: 'Date', content: <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} /> },
                { label: 'Vendor / Payee', content: <input value={form.vendor} onChange={e => setForm(p => ({ ...p, vendor: e.target.value }))} placeholder="Optional" style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} /> },
                { label: 'Description *', content: <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="What was this for?" style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />, span: true },
              ].map(f => (
                <div key={f.label} style={{ gridColumn: (f as any).span ? '1/-1' : undefined }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 5 }}>{f.label}</label>
                  {f.content}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
              <Btn variant="danger" onClick={handleAdd} loading={addRecord.isPending}><TrendingDown size={14} /> Save Expense</Btn>
              <Btn variant="secondary" onClick={() => setShowForm(false)}>Cancel</Btn>
            </div>
          </div>
        )}

        {/* Category pills */}
        {Object.keys(byCategory).length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22 }}>
            <button onClick={() => setFilterCat('')} style={{ padding: '5px 14px', borderRadius: 99, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: !filterCat ? '#dc2626' : '#fef2f2', color: !filterCat ? '#fff' : '#dc2626' }}>All ({GHS(totalExpenses)})</button>
            {Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([cat, total]) => (
              <button key={cat} onClick={() => setFilterCat(filterCat === cat ? '' : cat)} style={{ padding: '5px 14px', borderRadius: 99, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: filterCat === cat ? '#dc2626' : '#fef2f2', color: filterCat === cat ? '#fff' : '#dc2626' }}>
                {cat.split('(')[0].trim()} ({GHS(total)})
              </button>
            ))}
          </div>
        )}

        {/* Year filter */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 18 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Year:</label>
          <select value={year} onChange={e => setYear(Number(e.target.value))} style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none' }}>
            {[currentYear, currentYear - 1, currentYear - 2].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {filterCat && <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 700 }}>Showing: {GHS(filteredTotal)}</span>}
        </div>

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: 18, border: '1.5px solid #f0eefe', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          {isLoading ? <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Loading…</div>
            : filtered.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center' }}>
                <TrendingDown size={40} color="#d1d5db" style={{ marginBottom: 12 }} />
                <p style={{ fontSize: 13, color: '#9ca3af' }}>No expenses for {year}{filterCat ? ` · ${filterCat}` : ''}</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg,#fef2f2,#fee2e2)' }}>
                    {['Date', 'Category', 'Description', 'Vendor', 'Amount', ''].map(h => (
                      <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r: any) => (
                    <tr key={r.id} className="exp-row" style={{ borderBottom: '1px solid #fef2f2', transition: 'background .12s' }}>
                      <td style={{ padding: '11px 16px', fontSize: 12, color: '#6b7280' }}>{new Date(r.date).toLocaleDateString('en-GB')}</td>
                      <td style={{ padding: '11px 16px' }}><span style={{ fontSize: 10, background: '#fee2e2', color: '#b91c1c', padding: '2px 8px', borderRadius: 99, fontWeight: 700 }}>{r.category.split('(')[0].trim()}</span></td>
                      <td style={{ padding: '11px 16px', fontSize: 13, color: '#374151', fontWeight: 600 }}>{r.description}</td>
                      <td style={{ padding: '11px 16px', fontSize: 12, color: '#9ca3af' }}>{r.vendor ?? '—'}</td>
                      <td style={{ padding: '11px 16px', fontSize: 14, fontWeight: 800, color: '#dc2626' }}>{GHS(r.amount)}</td>
                      <td style={{ padding: '11px 16px' }}>
                        <button onClick={() => { if (confirm('Delete this expense?')) delRecord.mutate(r.id) }} style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={12} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#fef2f2', borderTop: '2px solid #fecaca' }}>
                    <td colSpan={4} style={{ padding: '11px 16px', fontSize: 12, fontWeight: 700, color: '#dc2626' }}>TOTAL EXPENSES</td>
                    <td style={{ padding: '11px 16px', fontSize: 15, fontWeight: 900, color: '#dc2626' }}>{GHS(filteredTotal)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            )}
        </div>
      </div>
    </>
  )
}
