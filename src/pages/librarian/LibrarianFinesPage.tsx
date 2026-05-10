// src/pages/librarian/LibrarianFinesPage.tsx
// Overdue books and fine management, with Bursar billing sync
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { differenceInDays, format } from 'date-fns'
import { AlertTriangle, CheckCircle, DollarSign, Search, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

const T = {
  primary: '#8b5cf6', bg: '#f5f3ff', card: '#ffffff',
  text: '#0f172a', muted: '#64748b', border: '#e2e8f0',
  red: '#ef4444', green: '#10b981', orange: '#f59e0b',
}

const FINE_PER_DAY = 2.00 // $2 per day late

export default function LibrarianFinesPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [marking, setMarking] = useState<string | null>(null)

  const { data: checkouts = [], isLoading } = useQuery({
    queryKey: ['overdue-checkouts', user?.school_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('library_checkouts')
        .select('*, book:library_books(title, barcode, author), student:students(id, full_name, class:classes(name))')
        .eq('school_id', user!.school_id!)
        .in('status', ['active', 'lost'])
        .order('due_date', { ascending: true })
      return data ?? []
    },
    enabled: !!user?.school_id,
  })

  const today = new Date()
  const overdue = (checkouts as any[]).filter((c: any) => new Date(c.due_date) < today)
  const filtered = overdue.filter((c: any) =>
    c.student?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.book?.title?.toLowerCase().includes(search.toLowerCase())
  )

  const calcFine = (dueDate: string) => {
    const days = differenceInDays(today, new Date(dueDate))
    return Math.max(0, days) * FINE_PER_DAY
  }

  const totalFines = filtered.reduce((acc: number, c: any) => acc + calcFine(c.due_date), 0)
  const paidFines = filtered.filter((c: any) => c.fine_paid).reduce((acc: number, c: any) => acc + (c.fine_amount || 0), 0)

  const handleMarkPaid = async (checkout: any) => {
    if (!confirm(`Mark fine for ${checkout.student?.full_name} as paid?`)) return
    setMarking(checkout.id)
    const fine = calcFine(checkout.due_date)
    await supabase.from('library_checkouts').update({ fine_paid: true, fine_amount: fine }).eq('id', checkout.id).eq('school_id', user!.school_id!)
    toast.success('Fine marked as paid.')
    qc.invalidateQueries({ queryKey: ['overdue-checkouts'] })
    setMarking(null)
  }

  const handleMarkLost = async (checkout: any) => {
    if (!confirm(`Mark "${checkout.book?.title}" as lost? A replacement fee will be recorded.`)) return
    setMarking(checkout.id)
    await supabase.from('library_checkouts').update({ status: 'lost', fine_amount: 50 }).eq('id', checkout.id).eq('school_id', user!.school_id!)
    toast.success('Book marked as lost. $50 replacement fee recorded.')
    qc.invalidateQueries({ queryKey: ['overdue-checkouts'] })
    setMarking(null)
  }

  const handleSyncToBursar = async (checkout: any) => {
    const fine = calcFine(checkout.due_date)
    if (fine === 0) { toast.error('No fine to sync.'); return }
    setMarking(checkout.id)
    try {
      // Insert into invoices/billing table that bursar monitors
      const { data: studentData } = await supabase
        .from('students').select('id, user_id').eq('id', checkout.student_id).single()

      if (!studentData) throw new Error('Student not found')

      const { data: student } = await supabase
        .from('students').select('other_fees').eq('id', checkout.student_id).single()

      const currentFees = student?.other_fees || []
      const newFee = {
        label: `Library Fine: "${checkout.book?.title}" (${differenceInDays(today, new Date(checkout.due_date))} days overdue)`,
        amount: fine,
        paid: 0
      }

      await supabase.from('students').update({ other_fees: [...currentFees, newFee] }).eq('id', checkout.student_id)

      await supabase.from('library_checkouts').update({ fine_amount: fine }).eq('id', checkout.id).eq('school_id', user!.school_id!)
      toast.success(`Fine of $${fine.toFixed(2)} synced to Bursar billing!`)
      qc.invalidateQueries({ queryKey: ['overdue-checkouts'] })
    } catch (err: any) {
      toast.error(err.message || 'Failed to sync to bursar.')
    }
    setMarking(null)
  }

  return (
    <div style={{ padding: '24px', maxWidth: 1100, margin: '0 auto', fontFamily: '"DM Sans", sans-serif' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');`}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#ef4444,#b91c1c)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
          <AlertTriangle size={22} />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: T.text, margin: 0 }}>Overdue & Fines</h1>
          <p style={{ fontSize: 13, color: T.muted, margin: '2px 0 0' }}>Manage overdue books and sync fines to the Bursar</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Overdue Books', value: filtered.length, color: T.red, Icon: AlertTriangle },
          { label: 'Total Fines Owed', value: `$${totalFines.toFixed(2)}`, color: T.orange, Icon: DollarSign },
          { label: 'Already Paid', value: `$${paidFines.toFixed(2)}`, color: T.green, Icon: CheckCircle },
        ].map(s => (
          <div key={s.label} style={{ background: T.card, borderRadius: 14, padding: '16px 20px', border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: `${s.color}15`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <s.Icon size={22} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: T.text }}>{s.value}</div>
              <div style={{ fontSize: 13, color: T.muted, fontWeight: 600 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Fine Rate Info */}
      <div style={{ background: `${T.orange}10`, border: `1px solid ${T.orange}30`, borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#92400e', display: 'flex', alignItems: 'center', gap: 8 }}>
        <DollarSign size={16} /> Fine rate: <strong>${FINE_PER_DAY.toFixed(2)} per day</strong> after due date. Fines can be synced directly to the Bursar's billing system.
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 380 }}>
        <Search size={15} color={T.muted} style={{ position: 'absolute', left: 10, top: 10 }} />
        <input placeholder="Search student or book..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '9px 10px 9px 32px', borderRadius: 8, border: `1px solid ${T.border}`, outline: 'none', fontSize: 13 }} />
      </div>

      {/* Table */}
      <div style={{ background: T.card, borderRadius: 16, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 60, textAlign: 'center', color: T.muted }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: T.muted }}>
            <CheckCircle size={40} color={T.green} style={{ marginBottom: 12, opacity: 0.4 }} />
            <p style={{ fontSize: 15, fontWeight: 600 }}>No overdue books! 🎉</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: `2px solid ${T.border}` }}>
                {['Student', 'Book', 'Due Date', 'Days Late', 'Fine', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c: any) => {
                const daysLate = differenceInDays(today, new Date(c.due_date))
                const fine = calcFine(c.due_date)
                const isLost = c.status === 'lost'
                return (
                  <tr key={c.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{c.student?.full_name}</div>
                      <div style={{ fontSize: 12, color: T.muted }}>{c.student?.class?.name}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{c.book?.title}</div>
                      <div style={{ fontSize: 12, color: T.muted }}>{c.book?.author}</div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: T.red, fontWeight: 700 }}>{c.due_date}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ background: `${T.red}15`, color: T.red, fontSize: 12, fontWeight: 800, padding: '3px 8px', borderRadius: 99 }}>{daysLate}d</span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 800, color: isLost ? T.red : T.orange }}>
                      {isLost ? '$50.00 (Lost)' : `$${fine.toFixed(2)}`}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {c.fine_paid
                        ? <span style={{ background: `${T.green}15`, color: T.green, fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99 }}>Paid</span>
                        : <span style={{ background: `${T.red}15`, color: T.red, fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99 }}>{isLost ? 'Lost' : 'Unpaid'}</span>
                      }
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {!c.fine_paid && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <button disabled={marking === c.id} onClick={() => handleSyncToBursar(c)}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 6, border: `1px solid ${T.primary}`, background: `${T.primary}10`, color: T.primary, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                            <RefreshCw size={11} /> Sync to Bursar
                          </button>
                          <button disabled={marking === c.id} onClick={() => handleMarkPaid(c)}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 6, border: `1px solid ${T.green}`, background: `${T.green}10`, color: T.green, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                            <CheckCircle size={11} /> Mark Paid
                          </button>
                          {!isLost && (
                            <button disabled={marking === c.id} onClick={() => handleMarkLost(c)}
                              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 6, border: `1px solid ${T.red}`, background: `${T.red}10`, color: T.red, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                              Mark Lost
                            </button>
                          )}
                        </div>
                      )}
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
