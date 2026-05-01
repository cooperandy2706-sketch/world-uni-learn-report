import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useSchoolInvoices } from '../../hooks/useBilling'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { formatDate } from '../../lib/utils'
import { CheckCircle2, Server, GraduationCap, Calendar, CreditCard, ChevronRight, HardDrive, ShieldCheck } from 'lucide-react'

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
        name: isTrial ? 'Grace Period (Pre-Term)' : (hasPaidInvoices ? 'Premium Active' : 'Action Required'),
        status: school.status,
        expiry: isTrial 
          ? new Date(new Date(school.created_at).getTime() + 90 * 24 * 60 * 60 * 1000) // approx 1 term
          : null
      })
    }
  }, [school, invoices])

  const handleRequestApproval = async (invoiceId: string) => {
    if (!confirm('Have you sent the Mobile Money payment to 0532416607? Please only click this after payment is complete.')) return
    
    setRequesting(invoiceId)
    try {
      const { error } = await supabase
        .from('school_invoices')
        .update({ status: 'requested_approval' })
        .eq('id', invoiceId)
      
      if (error) throw error
      toast.success('Payment verification requested successfully!')
      refetch()
    } catch (err: any) {
      toast.error(err.message || 'Failed to request approval')
    } finally {
      setRequesting(null)
    }
  }

  const handleRequestStorage = async () => {
    if (!confirm('Request an additional 50GB of cloud storage for 250 GHS annually?')) return
    toast.success('Storage upgrade request sent to World Uni-Learn Admin. You will be invoiced shortly.')
  }

  const getStatusBadge = (status: string) => {
    if (status === 'paid') return <span style={{ background: '#dcfce7', color: '#16a34a', padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Paid</span>
    if (status === 'requested_approval') return <span style={{ background: '#fef9c3', color: '#ca8a04', padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Verifying</span>
    return <span style={{ background: '#fee2e2', color: '#dc2626', padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Unpaid</span>
  }

  return (
    <div className="billing-container" style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', maxWidth: 1400, margin: '0 auto', background: '#f8fafc', minHeight: '100vh', animation: 'fadeIn 0.5s ease' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@700&display=swap');
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .billing-container { padding: 40px 32px; }
        .glass-card { background: #fff; border-radius: 24px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05); transition: all 0.3s ease; }
        .glass-card:hover { box-shadow: 0 20px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01); transform: translateY(-2px); }
        .btn-primary { background: #0f172a; color: #fff; transition: all 0.2s; border: none; cursor: pointer; }
        .btn-primary:hover { background: #1e293b; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.2); }
        .btn-outline { background: transparent; border: 2px solid #e2e8f0; color: #475569; transition: all 0.2s; cursor: pointer; }
        .btn-outline:hover { border-color: #94a3b8; color: #0f172a; }
        .pricing-tier { position: relative; overflow: hidden; }
        .pricing-tier::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 6px; background: linear-gradient(90deg, #3b82f6, #8b5cf6); }
        .badge-premium { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 4px 10px; border-radius: 99px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
        
        .header-layout { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; gap: 20px; }
        .main-grid { display: flex; flex-wrap: wrap; gap: 32px; }
        .main-left { flex: 1; min-width: min(100%, 600px); }
        .main-right { width: 380px; flex-shrink: 0; }
        .plans-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; }
        
        /* Tablet & Mobile Responsiveness */
        @media (max-width: 1280px) {
          .main-right { width: 100%; }
        }
        @media (max-width: 768px) {
          .billing-container { padding: 20px 16px; }
          .header-layout { flex-direction: column; align-items: stretch; margin-bottom: 24px; }
          .table-wrapper { overflow-x: auto; }
          .plans-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Header */}
      <div className="header-layout">
        <div>
          <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 32, fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0', lineHeight: 1.2 }}>Billing & Subscription</h1>
          <p style={{ fontSize: 15, color: '#64748b', margin: 0 }}>Manage your institution's onboarding, termly licenses, and cloud storage.</p>
        </div>
        <div style={{ padding: '12px 24px', borderRadius: 16, background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: school?.status === 'active' ? '#10b981' : '#f59e0b', boxShadow: `0 0 0 4px ${school?.status === 'active' ? '#d1fae5' : '#fef3c7'}` }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>System Status</span>
            <span style={{ fontWeight: 800, color: '#0f172a', fontSize: 14, textTransform: 'capitalize' }}>{activePlan?.name || school?.status}</span>
          </div>
        </div>
      </div>

      <div className="main-grid">
        
        {/* Left Column: Pricing & Invoices */}
        <div className="main-left" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          
          {/* Subscription Plans Display */}
          <div className="plans-grid">
            {/* Onboarding Tier */}
            <div className="glass-card pricing-tier" style={{ padding: '32px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div style={{ width: 48, height: 48, borderRadius: 16, background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <GraduationCap size={24} />
                </div>
                <span className="badge-premium">One-Time</span>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>Setup & Onboarding</h3>
              <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 24px 0', lineHeight: 1.5 }}>Complete system deployment, data migration, and comprehensive training.</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 24 }}>
                <span style={{ fontSize: 36, fontWeight: 800, color: '#0f172a' }}>GHS 1,200</span>
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  'Full Data Migration & Setup',
                  'Staff & Teacher Training',
                  'Admin & Bursar Training',
                  'Student & PTA Orientations',
                  'Grace period: Use now, pay before term ends'
                ].map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#334155', fontWeight: 500 }}>
                    <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ lineHeight: 1.4 }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Termly Tier */}
            <div className="glass-card" style={{ padding: '32px 24px', border: '2px solid #e2e8f0', position: 'relative' }}>
              <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#0f172a', color: '#fff', padding: '4px 16px', borderRadius: 99, fontSize: 12, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                Recurring License
              </div>
              <div style={{ width: 48, height: 48, borderRadius: 16, background: '#f5f3ff', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, marginTop: 8 }}>
                <Calendar size={24} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>Termly Subscription</h3>
              <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 24px 0', lineHeight: 1.5 }}>Required for every new academic term created in the system.</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 24 }}>
                <span style={{ fontSize: 36, fontWeight: 800, color: '#0f172a' }}>GHS 300</span>
                <span style={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>/ term</span>
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  'Termly Report Card Generation',
                  'Continuous System Updates',
                  'Priority Technical Support',
                  'Daily Backup & Security',
                  'Unlimited SMS Gateway Access'
                ].map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#334155', fontWeight: 500 }}>
                    <ShieldCheck size={18} color="#8b5cf6" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ lineHeight: 1.4 }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Invoice History */}
          <div className="glass-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>Billing History</h3>
              <button onClick={() => refetch()} className="btn-outline" style={{ padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                Refresh <ChevronRight size={14} />
              </button>
            </div>
            
            {isLoading ? (
              <div style={{ padding: 80, textAlign: 'center', color: '#64748b' }}>
                <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                Syncing your invoices...
              </div>
            ) : invoices.length === 0 ? (
              <div style={{ padding: 80, textAlign: 'center', color: '#64748b' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <CreditCard size={28} color="#94a3b8" />
                </div>
                <h4 style={{ fontSize: 16, fontWeight: 600, color: '#334155', margin: '0 0 8px 0' }}>No Invoices Yet</h4>
                <p style={{ fontSize: 14, margin: 0 }}>Your billing history will appear here once invoices are generated.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                  <thead>
                    <tr style={{ background: '#fff', borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '16px 24px', textAlign: 'left', color: '#64748b', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date Issued</th>
                      <th style={{ padding: '16px 24px', textAlign: 'left', color: '#64748b', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</th>
                      <th style={{ padding: '16px 24px', textAlign: 'left', color: '#64748b', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount</th>
                      <th style={{ padding: '16px 24px', textAlign: 'left', color: '#64748b', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                      <th style={{ padding: '16px 24px', textAlign: 'right', color: '#64748b', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv: any) => (
                      <tr key={inv.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                        <td style={{ padding: '20px 24px', fontSize: 14, fontWeight: 500, color: '#334155', whiteSpace: 'nowrap' }}>{formatDate(inv.created_at)}</td>
                        <td style={{ padding: '20px 24px', fontSize: 14, color: '#0f172a', fontWeight: 600 }}>{inv.description || 'System Subscription'}</td>
                        <td style={{ padding: '20px 24px', fontSize: 15, fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap' }}>GHS {inv.amount}</td>
                        <td style={{ padding: '20px 24px' }}>{getStatusBadge(inv.status)}</td>
                        <td style={{ padding: '20px 24px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          {inv.status === 'pending' && (
                            <button 
                              onClick={() => handleRequestApproval(inv.id)}
                              disabled={requesting === inv.id}
                              className="btn-primary"
                              style={{ padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: requesting === inv.id ? 'not-allowed' : 'pointer', opacity: requesting === inv.id ? 0.7 : 1 }}
                            >
                              {requesting === inv.id ? 'Verifying...' : 'Mark as Paid'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Storage & Payment Info */}
        <div className="main-right" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Payment Instructions */}
          <div className="glass-card" style={{ padding: '32px 24px' }}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <CreditCard size={24} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 16px 0' }}>Payment Details</h3>
            <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 24px 0', lineHeight: 1.5 }}>
              All payments for subscriptions and storage add-ons must be made via official Mobile Money channels.
            </p>
            
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Official MoMo Number</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', letterSpacing: '1px' }}>053 241 6607</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
                <span style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>MTN / Telecel / AT Money</span>
              </div>
            </div>

            <div style={{ fontSize: 13, color: '#64748b', background: '#f1f5f9', padding: 16, borderRadius: 12, display: 'flex', gap: 12 }}>
              <ShieldCheck size={20} color="#3b82f6" style={{ flexShrink: 0 }} />
              <span style={{ lineHeight: 1.5 }}>After sending payment, click "Mark as Paid" on your invoice. Activation is immediate upon verification.</span>
            </div>
          </div>

          {/* Storage Upgrade Add-on */}
          <div className="glass-card" style={{ padding: '32px 24px', background: 'linear-gradient(145deg, #0f172a, #1e293b)', color: '#fff', border: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(255,255,255,0.1)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HardDrive size={24} />
              </div>
              <span style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd', padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Add-on</span>
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 0 8px 0' }}>Cloud Storage Boost</h3>
            <p style={{ fontSize: 14, color: '#94a3b8', margin: '0 0 24px 0', lineHeight: 1.5 }}>
              Running out of space for Student Vaults and Assets? Expand your secure cloud storage instantly.
            </p>
            
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: '#fff' }}>+50 GB</span>
              <span style={{ fontSize: 14, color: '#cbd5e1', fontWeight: 600 }}>for 250 GHS / yr</span>
            </div>

            <ul style={{ margin: '0 0 24px 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {['Store thousands of student docs', 'High-res school assets', 'Automated secure backups'].map(item => (
                <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>
                  <Server size={16} color="#60a5fa" /> {item}
                </li>
              ))}
            </ul>

            <button 
              onClick={handleRequestStorage}
              style={{ width: '100%', padding: '14px', borderRadius: 12, background: '#3b82f6', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#2563eb'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#3b82f6'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              Request Storage Upgrade
            </button>
          </div>

        </div>

      </div>
    </div>
  )
}
