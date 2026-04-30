import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useSchoolInvoices } from '../../hooks/useBilling'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { formatDate } from '../../lib/utils'

export default function BillingPage() {
  const { user } = useAuth()
  const school = user?.school as any
  const { data: invoices = [], isLoading, refetch } = useSchoolInvoices(school?.id)
  const [requesting, setRequesting] = useState<string | null>(null)
  const [activePlan, setActivePlan] = useState<any>(null)

  useEffect(() => {
    if (school) {
      const isTrial = school.status === 'pending'
      const hasPaidInvoices = invoices.some(inv => inv.status === 'paid')
      
      setActivePlan({
        name: isTrial ? 'Free Trial' : (hasPaidInvoices ? 'Premium Plan' : 'Grace Period'),
        status: school.status,
        expiry: isTrial 
          ? new Date(new Date(school.created_at).getTime() + 30 * 24 * 60 * 60 * 1000)
          : null
      })
    }
  }, [school, invoices])

  const handleRequestApproval = async (invoiceId: string) => {
    if (!confirm('Have you sent the Mobile Money payment to 0532416607? Please only click this after payment.')) return
    
    setRequesting(invoiceId)
    try {
      const { error } = await supabase
        .from('school_invoices')
        .update({ status: 'requested_approval' })
        .eq('id', invoiceId)
      
      if (error) throw error
      toast.success('Approval requested! We will verify your payment shortly.')
      refetch()
    } catch (err: any) {
      toast.error(err.message || 'Failed to request approval')
    } finally {
      setRequesting(null)
    }
  }

  const getStatusColor = (status: string) => {
    if (status === 'paid') return { bg: '#dcfce7', color: '#16a34a', text: 'Paid' }
    if (status === 'requested_approval') return { bg: '#fef9c3', color: '#ca8a04', text: 'Awaiting Verification' }
    return { bg: '#fee2e2', color: '#dc2626', text: 'Unpaid' }
  }

  return (
    <div style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', padding: '40px 32px', maxWidth: 1200, margin: '0 auto', background: '#fcfaff', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@700&display=swap');
        .glass-card { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(10px); border: 1px solid rgba(240, 238, 254, 0.8); transition: all 0.3s; }
        .glass-card:hover { transform: translateY(-2px); box-shadow: 0 12px 30px rgba(109, 40, 217, 0.08); }
        .btn-primary { background: linear-gradient(135deg, #1e0646, #3b0a8a); color: #fff; transition: all 0.3s; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(30, 6, 70, 0.2); }
        .pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(124, 58, 237, 0); } 100% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0); } }
      `}</style>

      {/* Header Section */}
      <div style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 36, fontWeight: 700, color: '#1e0646', margin: 0 }}>Billing & Subscriptions</h1>
          <p style={{ fontSize: 16, color: '#64748b', marginTop: 8 }}>Manage your institution's financial status and platform access.</p>
        </div>
        <div style={{ padding: '12px 24px', borderRadius: 16, background: '#fff', border: '1px solid #f0eefe', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: school?.status === 'active' ? '#10b981' : '#f59e0b' }} />
          <span style={{ fontWeight: 700, color: '#1e0646', fontSize: 14 }}>Status: {school?.status?.toUpperCase()}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 32 }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Active Plan Card */}
          <div className="glass-card" style={{ borderRadius: 24, padding: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Current Plan</span>
              <h2 style={{ fontSize: 28, fontWeight: 800, color: '#1e0646', margin: '4px 0' }}>{activePlan?.name || 'Loading...'}</h2>
              <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
                {activePlan?.expiry ? `Trial ends on ${formatDate(activePlan.expiry)}` : 'Full access enabled for your institution.'}
              </p>
            </div>
            <div style={{ fontSize: 48 }}>{activePlan?.name === 'Free Trial' ? '🎁' : '💎'}</div>
          </div>

          {/* Payment Instructions */}
          <div className="glass-card" style={{ borderRadius: 24, padding: 32 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1e0646', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>📲</span> Payment Instructions
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div style={{ background: '#f8f7ff', borderRadius: 20, padding: 24, border: '1px solid #eef2ff' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#6366f1', marginBottom: 8, textTransform: 'uppercase' }}>Mobile Money Number</p>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#1e0646' }}>0532416607</div>
                <p style={{ fontSize: 12, color: '#64748b', marginTop: 12 }}>Send payment via MTN/Telecel/AT Money.</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <li style={{ fontSize: 14, color: '#475569', display: 'flex', gap: 10 }}>
                    <span style={{ color: '#10b981' }}>✓</span> 600 GHS for first-time activation
                  </li>
                  <li style={{ fontSize: 14, color: '#475569', display: 'flex', gap: 10 }}>
                    <span style={{ color: '#10b981' }}>✓</span> 300 GHS for subsequent terms
                  </li>
                  <li style={{ fontSize: 14, color: '#475569', display: 'flex', gap: 10 }}>
                    <span style={{ color: '#10b981' }}>✓</span> Instant activation after verification
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Invoice Table */}
          <div className="glass-card" style={{ borderRadius: 24, overflow: 'hidden' }}>
            <div style={{ padding: '20px 32px', borderBottom: '1px solid #f0eefe', background: '#fafafb' }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1e0646', margin: 0 }}>Invoice History</h3>
            </div>
            
            {isLoading ? (
              <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>
                <div className="pulse" style={{ width: 40, height: 40, borderRadius: '50%', background: '#7c3aed', margin: '0 auto 16px' }} />
                Syncing invoices...
              </div>
            ) : invoices.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>📑</div>
                No invoices found for your institution.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#fcfcfd', borderBottom: '1px solid #f1f5f9' }}>
                    <th style={{ padding: '16px 32px', textAlign: 'left', color: '#94a3b8', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Date</th>
                    <th style={{ padding: '16px 32px', textAlign: 'left', color: '#94a3b8', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Term</th>
                    <th style={{ padding: '16px 32px', textAlign: 'left', color: '#94a3b8', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Amount</th>
                    <th style={{ padding: '16px 32px', textAlign: 'left', color: '#94a3b8', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '16px 32px', textAlign: 'right', color: '#94a3b8', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv: any) => {
                    const s = getStatusColor(inv.status)
                    return (
                      <tr key={inv.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '20px 32px', fontWeight: 500, color: '#1e0646' }}>{formatDate(inv.created_at)}</td>
                        <td style={{ padding: '20px 32px', color: '#64748b' }}>School Subscription</td>
                        <td style={{ padding: '20px 32px', fontWeight: 800, color: '#1e0646' }}>GHS {inv.amount}</td>
                        <td style={{ padding: '20px 32px' }}>
                          <span style={{ background: s.bg, color: s.color, padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>
                            {s.text}
                          </span>
                        </td>
                        <td style={{ padding: '20px 32px', textAlign: 'right' }}>
                          {inv.status === 'pending' && (
                            <button 
                              onClick={() => handleRequestApproval(inv.id)}
                              disabled={requesting === inv.id}
                              className="btn-primary"
                              style={{ 
                                padding: '8px 16px', borderRadius: 10, border: 'none', 
                                fontSize: 12, fontWeight: 700, cursor: requesting === inv.id ? 'not-allowed' : 'pointer' 
                              }}
                            >
                              {requesting === inv.id ? 'Processing...' : 'Verify Payment'}
                            </button>
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

        {/* Sidebar help / info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="glass-card" style={{ borderRadius: 24, padding: 24 }}>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: '#1e0646', marginBottom: 16 }}>Need Support?</h4>
            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
              If you have issues with your payment or account activation, please contact our support team directly.
            </p>
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0eefe' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1e0646' }}>WhatsApp Support</div>
              <div style={{ fontSize: 13, color: '#7c3aed', fontWeight: 600 }}>+233 53 241 6607</div>
            </div>
          </div>
          
          <div style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', borderRadius: 24, padding: 24, color: '#fff' }}>
            <h4 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>Why Premium?</h4>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Unlimited Students', 'Full Report Card Access', 'Teacher Performance Tracking', 'Finance & Payroll Tools'].map(text => (
                <li key={text} style={{ fontSize: 12, display: 'flex', gap: 8, alignItems: 'center', opacity: 0.9 }}>
                  <span style={{ fontSize: 14 }}>✔</span> {text}
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    </div>
  )
}
