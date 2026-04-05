// src/pages/bursar/IncomePage.tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import { incomeService } from '../../services/bursar.service'
import toast from 'react-hot-toast'
import { Plus, Trash2, TrendingUp } from 'lucide-react'

const GHS = (n: number) => `GH₵ ${Number(n).toLocaleString('en-GH', { minimumFractionDigits: 2 })}`
const CATS = ['School Fees', 'PTA Levy', 'Government Grant', 'Donation', 'Rent/Hire', 'Examination Fees', 'Sports/Activity', 'Other']

function Btn({ children, onClick, variant = 'primary', disabled, loading, style }: any) {
  const [h, setH] = useState(false)
  const v: any = {
    primary: { background: h ? '#5b21b6' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', border: 'none' },
    secondary: { background: h ? '#f5f3ff' : '#fff', color: '#374151', border: '1.5px solid #e5e7eb' },
    success: { background: h ? '#15803d' : '#16a34a', color: '#fff', border: 'none' },
  }
  return (
    <button onClick={onClick} disabled={disabled} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all .15s', opacity: disabled ? 0.6 : 1, fontFamily: '"DM Sans",sans-serif', ...v[variant], ...style }}>
      {loading && <span style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', animation: '_inc_spin .7s linear infinite', flexShrink: 0 }} />}
      {children}
    </button>
  )
}

export default function IncomePage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const schoolId = user?.school_id ?? ''
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ category: CATS[0], description: '', amount: '', date: new Date().toISOString().split('T')[0], reference: '' })
  const [filterCat, setFilterCat] = useState('')

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['income', schoolId, year],
    queryFn: async () => { const { data } = await incomeService.getAll(schoolId, year); return data ?? [] },
    enabled: !!schoolId,
  })

  const addRecord = useMutation({
    mutationFn: (d: any) => incomeService.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['income'] }); setShowForm(false); setForm({ category: CATS[0], description: '', amount: '', date: new Date().toISOString().split('T')[0], reference: '' }); toast.success('Income recorded') },
    onError: (e: any) => toast.error(e.message),
  })

  const delRecord = useMutation({
    mutationFn: (id: string) => incomeService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['income'] }); toast.success('Deleted') },
  })

  function handleAdd() {
    if (!form.amount || !form.category) { toast.error('Enter amount and category'); return }
    addRecord.mutate({ school_id: schoolId, category: form.category, description: form.description || null, amount: parseFloat(form.amount), date: form.date, reference: form.reference || null, recorded_by: user?.id ?? null })
  }

  const filtered = filterCat ? (records as any[]).filter((r: any) => r.category === filterCat) : records as any[]
  const totalIncome = (records as any[]).reduce((s: number, r: any) => s + (r.amount || 0), 0)
  const filteredTotal = filtered.reduce((s: number, r: any) => s + (r.amount || 0), 0)

  // Category breakdown
  const byCategory: Record<string, number> = {}
  for (const r of records as any[]) byCategory[r.category] = (byCategory[r.category] || 0) + r.amount

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');
        @keyframes _inc_spin { to{transform:rotate(360deg)} }
        @keyframes _inc_fi { from{opacity:0} to{opacity:1} }
        .inc-row:hover { background: #f0fdf4 !important; }
      `}</style>
      <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif', animation: '_inc_fi .4s ease' }}>
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>Income Records</h1>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 3 }}>All income sources — GH₵ {totalIncome.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</p>
          </div>
          <Btn variant="success" onClick={() => setShowForm(v => !v)}><Plus size={14} /> {showForm ? 'Hide Form' : 'Record Income'}</Btn>
        </div>

        {/* Add form */}
        {showForm && (
          <div style={{ background: '#fff', borderRadius: 18, padding: 24, border: '1.5px solid #bbf7d0', marginBottom: 24, boxShadow: '0 2px 12px rgba(22,163,74,.08)' }}>
            <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Record New Income</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { label: 'Category *', content: <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none' }}>{CATS.map(c => <option key={c}>{c}</option>)}</select> },
                { label: 'Amount (GH₵) *', content: <input type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} /> },
                { label: 'Date', content: <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} /> },
                { label: 'Reference No.', content: <input value={form.reference} onChange={e => setForm(p => ({ ...p, reference: e.target.value }))} placeholder="Optional" style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} /> },
                { label: 'Description', content: <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional note" style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />, span: true },
              ].map(f => (
                <div key={f.label} style={{ gridColumn: (f as any).span ? '1/-1' : undefined }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 5 }}>{f.label}</label>
                  {f.content}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
              <Btn variant="success" onClick={handleAdd} loading={addRecord.isPending}><TrendingUp size={14} /> Save Income</Btn>
              <Btn variant="secondary" onClick={() => setShowForm(false)}>Cancel</Btn>
            </div>
          </div>
        )}

        {/* Category breakdown pills */}
        {Object.keys(byCategory).length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22 }}>
            <button onClick={() => setFilterCat('')} style={{ padding: '5px 14px', borderRadius: 99, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: !filterCat ? '#16a34a' : '#f0fdf4', color: !filterCat ? '#fff' : '#16a34a' }}>All ({GHS(totalIncome)})</button>
            {Object.entries(byCategory).map(([cat, total]) => (
              <button key={cat} onClick={() => setFilterCat(filterCat === cat ? '' : cat)} style={{ padding: '5px 14px', borderRadius: 99, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: filterCat === cat ? '#16a34a' : '#f0fdf4', color: filterCat === cat ? '#fff' : '#15803d' }}>
                {cat} ({GHS(total)})
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
          {filterCat && <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 700 }}>Showing: {GHS(filteredTotal)}</span>}
        </div>

        {/* Records table */}
        <div style={{ background: '#fff', borderRadius: 18, border: '1.5px solid #f0eefe', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          {isLoading ? <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Loading…</div>
            : filtered.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center' }}>
                <TrendingUp size={40} color="#d1d5db" style={{ marginBottom: 12 }} />
                <p style={{ fontSize: 13, color: '#9ca3af' }}>No income records for {year}{filterCat ? ` · ${filterCat}` : ''}</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)' }}>
                    {['Date', 'Category', 'Description', 'Reference', 'Amount', ''].map(h => (
                      <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r: any) => (
                    <tr key={r.id} className="inc-row" style={{ borderBottom: '1px solid #f0fdf4', transition: 'background .12s' }}>
                      <td style={{ padding: '11px 16px', fontSize: 12, color: '#6b7280' }}>{new Date(r.date).toLocaleDateString('en-GB')}</td>
                      <td style={{ padding: '11px 16px' }}><span style={{ fontSize: 11, background: '#f0fdf4', color: '#15803d', padding: '2px 9px', borderRadius: 99, fontWeight: 700 }}>{r.category}</span></td>
                      <td style={{ padding: '11px 16px', fontSize: 13, color: '#374151' }}>{r.description ?? '—'}</td>
                      <td style={{ padding: '11px 16px', fontSize: 12, color: '#9ca3af', fontFamily: 'monospace' }}>{r.reference ?? '—'}</td>
                      <td style={{ padding: '11px 16px', fontSize: 14, fontWeight: 800, color: '#16a34a' }}>{GHS(r.amount)}</td>
                      <td style={{ padding: '11px 16px' }}>
                        <button onClick={() => { if (confirm('Delete this record?')) delRecord.mutate(r.id) }} style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={12} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f0fdf4', borderTop: '2px solid #bbf7d0' }}>
                    <td colSpan={4} style={{ padding: '11px 16px', fontSize: 12, fontWeight: 700, color: '#16a34a' }}>TOTAL {filterCat ? filterCat.toUpperCase() : ''} INCOME</td>
                    <td style={{ padding: '11px 16px', fontSize: 15, fontWeight: 900, color: '#16a34a' }}>{GHS(filteredTotal)}</td>
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
