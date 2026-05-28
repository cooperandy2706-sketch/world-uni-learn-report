// src/pages/librarian/LibrarianHistoryPage.tsx
// Full checkout history — returned, active, and lost books
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { History, Search, Filter, Download, CheckCircle, AlertTriangle, BookOpen } from 'lucide-react'

const T = {
  primary: '#8b5cf6', bg: '#f5f3ff', card: '#ffffff',
  text: '#0f172a', muted: '#64748b', border: '#e2e8f0',
  red: '#ef4444', green: '#10b981', orange: '#f59e0b', blue: '#3b82f6',
}

const PERIODS = [
  { label: 'This Month', value: 'this_month' },
  { label: 'Last Month', value: 'last_month' },
  { label: 'Last 3 Months', value: 'last_3_months' },
  { label: 'All Time', value: 'all' },
]

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  active: { label: 'Active', color: T.blue, icon: BookOpen },
  returned: { label: 'Returned', color: T.green, icon: CheckCircle },
  lost: { label: 'Lost', color: T.red, icon: AlertTriangle },
}

export default function LibrarianHistoryPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [period, setPeriod] = useState('this_month')
  const [statusFilter, setStatusFilter] = useState('all')

  const { data: checkouts = [], isLoading } = useQuery({
    queryKey: ['checkout-history', user?.school_id, period],
    queryFn: async () => {
      const now = new Date()
      let from: Date | null = null
      let to: Date | null = null
      if (period === 'this_month') { from = startOfMonth(now); to = endOfMonth(now) }
      else if (period === 'last_month') { from = startOfMonth(subMonths(now, 1)); to = endOfMonth(subMonths(now, 1)) }
      else if (period === 'last_3_months') { from = startOfMonth(subMonths(now, 3)); to = endOfMonth(now) }

      let query = supabase
        .from('library_checkouts')
        .select('*, book:library_books(title, author, barcode, category), student:students(full_name, class:classes(name))')
        .eq('school_id', user!.school_id!)
        .order('checkout_date', { ascending: false })

      if (from) query = query.gte('checkout_date', format(from, 'yyyy-MM-dd'))
      if (to) query = query.lte('checkout_date', format(to, 'yyyy-MM-dd'))

      const { data } = await query
      return data ?? []
    },
    enabled: !!user?.school_id,
  })

  const filtered = (checkouts as any[]).filter((c: any) => {
    const matchSearch =
      c.student?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.book?.title?.toLowerCase().includes(search.toLowerCase()) ||
      c.book?.barcode?.includes(search)
    const matchStatus = statusFilter === 'all' || c.status === statusFilter
    return matchSearch && matchStatus
  })

  const stats = {
    total: (checkouts as any[]).length,
    returned: (checkouts as any[]).filter((c: any) => c.status === 'returned').length,
    lost: (checkouts as any[]).filter((c: any) => c.status === 'lost').length,
    finesCollected: (checkouts as any[]).filter((c: any) => c.fine_paid).reduce((a: number, c: any) => a + (c.fine_amount || 0), 0),
  }

  const exportCSV = () => {
    const rows = [
      ['Date', 'Student', 'Class', 'Book', 'Author', 'Barcode', 'Due Date', 'Return Date', 'Status', 'Fine', 'Fine Paid'],
      ...filtered.map((c: any) => [
        c.checkout_date, c.student?.full_name, c.student?.class?.name,
        c.book?.title, c.book?.author, c.book?.barcode,
        c.due_date, c.return_date || '—', c.status,
        c.fine_amount ? `$${c.fine_amount}` : '$0', c.fine_paid ? 'Yes' : 'No'
      ])
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `checkout_history_${period}.csv`
    a.click()
  }

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto', fontFamily: '"DM Sans", sans-serif' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <History size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: T.text, margin: 0 }}>Checkout History</h1>
            <p style={{ fontSize: 13, color: T.muted, margin: '2px 0 0' }}>Full record of all book loans</p>
          </div>
        </div>
        <button onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8, border: `1px solid ${T.border}`, background: 'var(--bg-card)', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: T.text }}>
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Checkouts', value: stats.total, color: T.primary },
          { label: 'Returned', value: stats.returned, color: T.green },
          { label: 'Lost Books', value: stats.lost, color: T.red },
          { label: 'Fines Collected', value: `$${stats.finesCollected.toFixed(2)}`, color: T.orange },
        ].map(s => (
          <div key={s.label} style={{ background: T.card, borderRadius: 14, padding: '16px 20px', border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: T.muted, fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={15} color={T.muted} style={{ position: 'absolute', left: 10, top: 10 }} />
          <input placeholder="Search student, book, or barcode..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '9px 10px 9px 32px', borderRadius: 8, border: `1px solid ${T.border}`, outline: 'none', fontSize: 13 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={15} color={T.muted} />
          <select value={period} onChange={e => setPeriod(e.target.value)}
            style={{ padding: '9px 12px', borderRadius: 8, border: `1px solid ${T.border}`, outline: 'none', fontSize: 13, background: 'var(--bg-card)' }}>
            {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: '9px 12px', borderRadius: 8, border: `1px solid ${T.border}`, outline: 'none', fontSize: 13, background: 'var(--bg-card)' }}>
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="returned">Returned</option>
            <option value="lost">Lost</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, overflow: 'auto' }}>
        {isLoading ? (
          <div style={{ padding: 60, textAlign: 'center', color: T.muted }}>Loading history...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: T.muted }}>
            <History size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
            <p style={{ fontSize: 15 }}>No records found.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: `2px solid ${T.border}` }}>
                {['Checkout Date', 'Student', 'Book', 'Barcode', 'Due Date', 'Returned On', 'Fine', 'Status'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c: any) => {
                const cfg = STATUS_CONFIG[c.status] || STATUS_CONFIG['active']
                const Icon = cfg.icon
                return (
                  <tr key={c.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: T.muted, whiteSpace: 'nowrap' }}>{c.checkout_date}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{c.student?.full_name}</div>
                      <div style={{ fontSize: 12, color: T.muted }}>{c.student?.class?.name}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{c.book?.title}</div>
                      <div style={{ fontSize: 12, color: T.muted }}>{c.book?.author}</div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 12, color: T.muted, fontFamily: 'monospace' }}>{c.book?.barcode}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: T.text, whiteSpace: 'nowrap' }}>{c.due_date}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: c.return_date ? T.green : T.muted }}>{c.return_date || '—'}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 700 }}>
                      {c.fine_amount > 0 ? (
                        <span style={{ color: c.fine_paid ? T.green : T.red }}>
                          ${(c.fine_amount).toFixed(2)} {c.fine_paid ? '✓' : ''}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: `${cfg.color}15`, color: cfg.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99 }}>
                        <Icon size={11} /> {cfg.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
