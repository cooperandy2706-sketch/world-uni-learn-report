import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import FlaskLoader from '../../components/ui/FlaskLoader'
import { Wallet, CreditCard, ArrowDownRight, ArrowUpRight } from 'lucide-react'

export default function ProprietorFinances() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  const [finances, setFinances] = useState({
    totalCollected: 0,
    totalExpenses: 0,
    recentPayments: [] as any[],
    recentExpenses: [] as any[],
  })

  useEffect(() => { setTimeout(() => setMounted(true), 60) }, [])

  useEffect(() => {
    if (!user?.school_id) return
    loadFinances()
  }, [user?.school_id])

  async function loadFinances() {
    const sid = user!.school_id
    try {
      const [
        { data: payments },
        { data: expenses }
      ] = await Promise.all([
        supabase.from('fee_payments').select('amount_paid, payment_date, student:students(full_name)').eq('school_id', sid).order('payment_date', { ascending: false }).limit(20),
        supabase.from('expense_records').select('amount, date, description').eq('school_id', sid).order('date', { ascending: false }).limit(20)
      ])

      const totalCollected = (payments || []).reduce((s, p) => s + Number(p.amount_paid), 0)
      const totalExpenses = (expenses || []).reduce((s, e) => s + Number(e.amount), 0)

      setFinances({
        totalCollected,
        totalExpenses,
        recentPayments: (payments || []).slice(0, 5),
        recentExpenses: (expenses || []).slice(0, 5),
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <FlaskLoader fullScreen={false} label="Loading financials..." />

  return (
    <>
      <style>{`
        .finances-wrap {
          font-family: 'Outfit', system-ui, sans-serif;
          opacity: ${mounted ? 1 : 0};
          transition: opacity 0.5s ease;
          max-width: 1440px;
          margin: 0 auto;
          padding: 20px 40px 60px;
        }

        .fin-card {
          background: #fff;
          border-radius: 20px;
          padding: 32px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }

        .list-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 16px 0; border-bottom: 1px solid #f1f5f9;
        }
        .list-row:last-child { border-bottom: none; }

        .finances-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 24px;
        }

        @media (max-width: 768px) {
          .finances-wrap { padding: 16px 20px 80px; }
          .fin-card { padding: 20px; }
          .finances-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="finances-wrap">
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 32px', color: '#0f172a' }}>Financial Health</h1>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 32 }}>
          <div className="fin-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ArrowUpRight size={24} />
              </div>
              <span style={{ fontSize: 16, fontWeight: 600, color: '#64748b' }}>Recent Collections</span>
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: '#0f172a' }}>GH₵ {finances.totalCollected.toLocaleString()}</div>
          </div>
          
          <div className="fin-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ArrowDownRight size={24} />
              </div>
              <span style={{ fontSize: 16, fontWeight: 600, color: '#64748b' }}>Recent Expenses</span>
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: '#0f172a' }}>GH₵ {finances.totalExpenses.toLocaleString()}</div>
          </div>
        </div>

        <div className="finances-grid">
          <div className="fin-card">
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 16px' }}>Latest Fee Payments</h3>
            {finances.recentPayments.length === 0 ? <p style={{ color: '#94a3b8' }}>No recent payments.</p> : (
              <div>
                {finances.recentPayments.map((p, i) => (
                  <div key={i} className="list-row">
                    <div>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>{(p.student as any)?.full_name || 'Unknown'}</div>
                      <div style={{ fontSize: 13, color: '#94a3b8' }}>{new Date(p.payment_date).toLocaleDateString()}</div>
                    </div>
                    <div style={{ fontWeight: 800, color: '#10b981' }}>+ GH₵{p.amount_paid}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="fin-card">
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 16px' }}>Latest Expenses</h3>
            {finances.recentExpenses.length === 0 ? <p style={{ color: '#94a3b8' }}>No recent expenses.</p> : (
              <div>
                {finances.recentExpenses.map((e, i) => (
                  <div key={i} className="list-row">
                    <div>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>{e.description || 'Expense'}</div>
                      <div style={{ fontSize: 13, color: '#94a3b8' }}>{new Date(e.date).toLocaleDateString()}</div>
                    </div>
                    <div style={{ fontWeight: 800, color: '#ef4444' }}>- GH₵{e.amount}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </>
  )
}
