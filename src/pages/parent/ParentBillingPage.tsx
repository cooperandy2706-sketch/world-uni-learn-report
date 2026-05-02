// src/pages/parent/ParentBillingPage.tsx
import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useParentWards } from '../../hooks/useParents'
import { useCurrentTerm } from '../../hooks/useSettings'
import { billSheetService } from '../../services/bursar.service'
import { paymentService } from '../../services/payment.service'
import { Wallet, ChevronDown, ChevronUp, CreditCard, X, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'

// ─────────────────────────────────────────────────────────────────────────────
// SECURE REVENUE SHARE CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────
const DEV_FEE_PERCENT = 0.015; // 1.5%
// ─────────────────────────────────────────────────────────────────────────────

export default function ParentBillingPage() {
  const { user } = useAuth()
  const { data: wards = [], isLoading: loadingWards } = useParentWards()
  const { data: term } = useCurrentTerm()

  const [billingData, setBillingData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)
  const [expandedWard, setExpandedWard] = useState<string | null>(null)
  
  const [showPayModal, setShowPayModal] = useState(false)
  const [payStep, setPayStep] = useState<1 | 2>(1)
  const [schoolInfo, setSchoolInfo] = useState<{name: string, subaccount: string} | null>(null)
  const [selectedWardForPay, setSelectedWardForPay] = useState<any>(null)
  const [payAmount, setPayAmount] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (wards.length > 0 && term?.id) {
      loadBilling()
    }
  }, [wards, term?.id])

  async function loadBilling() {
    setLoading(true)
    const newBillingData: Record<string, any> = {}
    for (const ward of wards) {
      try {
        const data = await billSheetService.getStudentBillData(ward.id, term!.id, ward.school_id)
        newBillingData[ward.id] = data
      } catch (err) {
        console.error(`Failed to load billing for ward ${ward.id}`, err)
      }
    }
    setBillingData(newBillingData)
    setLoading(false)
  }

  function openPayModal(ward: any, balance: number) {
    setSelectedWardForPay(ward)
    setPayAmount(balance.toString())
    setPayStep(1)
    setSchoolInfo(null)
    setShowPayModal(true)
  }

  async function handleProceed() {
    if (!selectedWardForPay || !payAmount || Number(payAmount) <= 0) return
    setIsProcessing(true)
    try {
      const { data: school, error: schoolErr } = await (await import('../../lib/supabase')).supabase
        .from('schools')
        .select('name, paystack_public_key, id')
        .eq('id', selectedWardForPay.school_id)
        .single()

      if (schoolErr) throw new Error('Could not fetch school configuration.')

      const subaccountCode = school?.paystack_public_key
      if (!subaccountCode) {
        throw new Error('This school has not been configured for online payments yet.')
      }

      setSchoolInfo({ name: school.name, subaccount: subaccountCode })
      setPayStep(2)
    } catch (err: any) {
      toast.error(err.message || 'Verification failed')
    } finally {
      setIsProcessing(false)
    }
  }

  async function handlePayOnline() {
    if (!selectedWardForPay || !payAmount || !schoolInfo) return
    
    setIsProcessing(true)
    try {
      const amountToPay = Number(payAmount)
      const subaccountCode = schoolInfo.subaccount

      const masterPublicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY
      if (!masterPublicKey) {
        throw new Error('Platform payment gateway is not configured.')
      }
      
      const reference = `pay_${Math.floor(Math.random() * 1000000000 + 1)}`

      // 2. Launch Paystack with Split
      await paymentService.payWithPaystack({
        email: user?.email || 'parent@example.com',
        amount: amountToPay,
        publicKey: masterPublicKey,
        reference: reference,
        subaccount: subaccountCode,
        metadata: {
          student_id: selectedWardForPay.id,
          student_name: selectedWardForPay.full_name,
          term_id: term?.id,
          school_id: selectedWardForPay.school_id,
          base_amount: amountToPay,
          developer_commission: amountToPay * DEV_FEE_PERCENT
        },
        onSuccess: async (response) => {
          toast.loading('Verifying payment...', { id: 'verify_payment' })
          try {
            // 3. Verify on server
            await paymentService.verifyPaymentOnServer(
              response.reference,
              selectedWardForPay.id,
              term!.id,
              selectedWardForPay.school_id
            )
            toast.success('Payment successful! Your balance has been updated.', { id: 'verify_payment' })
            setShowPayModal(false)
            loadBilling() 
          } catch (err) {
            toast.error('Verification failed. Please contact school admin.', { id: 'verify_payment' })
          } finally {
            setIsProcessing(false)
          }
        },
        onClose: () => {
          setIsProcessing(false)
        }
      })
    } catch (err: any) {
      toast.error(err.message || 'Payment initialization failed')
      setIsProcessing(false)
    }
  }

  if (loadingWards || loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <style>{`@keyframes _spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2.5px solid #ede9fe', borderTopColor: '#6d28d9', animation: '_spin 0.8s linear infinite' }} />
      </div>
    )
  }

  return (
    <div style={{ fontFamily: '"DM Sans", sans-serif', paddingBottom: 40, maxWidth: 800, margin: '0 auto', animation: '_fadeIn .4s ease' }}>
      <style>{`
        @keyframes _fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes _modalIn { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
      `}</style>

      <div style={{ marginBottom: 24, padding: '0 4px' }}>
        <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>Fees & Billing</h1>
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Track and pay school fees for {term?.name || 'Current Term'}.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {wards.map((ward) => {
          const bill = billingData[ward.id]
          const isExpanded = expandedWard === ward.id

          return (
            <div key={ward.id} style={{ background: '#fff', borderRadius: 24, border: '1.5|px solid #f0eefe', overflow: 'hidden', boxShadow: '0 4px 16px rgba(109,40,217,0.03)' }}>
              
              <div 
                onClick={() => setExpandedWard(isExpanded ? null : ward.id)}
                style={{ padding: '20px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: isExpanded ? '#faf5ff' : '#fff', transition: 'background 0.2s' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: '#ede9fe', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Wallet size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>{ward.full_name}</div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{ward.class?.name || 'No Class'}</div>
                  </div>
                </div>

                <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{bill?.summary?.balance < 0 ? 'Credit Balance' : 'Balance'}</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: bill?.summary?.balance > 0 ? '#ef4444' : '#10b981' }}>
                      {bill?.summary?.balance < 0 ? `(Credit) GH₵ ${Math.abs(bill.summary.balance).toLocaleString()}` : `GH₵ ${bill?.summary?.balance?.toLocaleString() || '0'}`}
                    </div>
                  </div>
                  <div style={{ color: '#d1d5db', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: '#f8fafc' }}>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>
              </div>

              {isExpanded && bill && (
                <div style={{ padding: '24px', borderTop: '1px solid #f0eefe', background: '#fafbff' }}>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
                    <div style={{ background: '#fff', padding: 16, borderRadius: 16, border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Total Charges</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', marginTop: 4 }}>GH₵ {bill.summary.totalCharges.toLocaleString()}</div>
                    </div>
                    <div style={{ background: '#fff', padding: 16, borderRadius: 16, border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Amount Paid</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#16a34a', marginTop: 4 }}>GH₵ {bill.summary.totalPaid.toLocaleString()}</div>
                    </div>
                  </div>

                  {bill.summary.balance > 0 && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); openPayModal(ward, bill.summary.balance) }}
                      style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 4px 12px rgba(16,185,129,0.2)', marginBottom: 24, transition: 'transform 0.1s' }}
                      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                      onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <CreditCard size={18} /> Pay Online Now
                    </button>
                  )}

                  <h4 style={{ fontSize: 13, fontWeight: 800, color: '#1e293b', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 4, height: 16, background: '#7c3aed', borderRadius: 2 }} /> Fee Breakdown
                  </h4>
                  <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: 24 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody>
                        {bill.arrears > 0 && (
                          <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '12px 16px', fontSize: 13, color: '#ef4444', fontWeight: 600 }}>Previous Balance (Arrears)</td>
                            <td style={{ padding: '12px 16px', fontSize: 13, color: '#ef4444', fontWeight: 800, textAlign: 'right' }}>GH₵ {bill.arrears.toLocaleString()}</td>
                          </tr>
                        )}
                        {bill.structures.map((f: any) => (
                          <tr key={f.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '12px 16px', fontSize: 13, color: '#334155', fontWeight: 500 }}>
                              {f.fee_name}
                              {f.is_discountable === false && <span style={{ fontSize: 10, color: '#ef4444', marginLeft: 6, fontWeight: 700 }}>[NO SCHOLARSHIP DISCOUNT]</span>}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: 13, color: '#334155', fontWeight: 800, textAlign: 'right' }}>GH₵ {f.amount.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <h4 style={{ fontSize: 13, fontWeight: 800, color: '#1e293b', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 4, height: 16, background: '#16a34a', borderRadius: 2 }} /> Recent Payments
                  </h4>
                  {bill.payments.length === 0 ? (
                    <div style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '20px 0', background: '#fff', borderRadius: 16, border: '1px dashed #e2e8f0' }}>No payments recorded.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {bill.payments.map((p: any) => (
                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0' }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', textTransform: 'capitalize' }}>{p.payment_method === 'online' ? '🌐 Online' : p.payment_method} Payment</div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>{new Date(p.payment_date).toLocaleDateString()} {p.reference ? `· Ref: ${p.reference.slice(-8)}` : ''} · <span style={{ color: '#7c3aed', fontWeight: 600 }}>Official Receipt available at Office</span></div>
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: '#16a34a' }}>
                            GH₵ {p.amount_paid.toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ marginTop: 28, padding: 16, background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Note</div>
                    <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
                      For offline payments, please visit the school Bursary or use Mobile Money. Reference: <strong>{ward.student_id}</strong>.
                    </div>
                  </div>

                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Payment Modal */}
      {showPayModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 400, overflow: 'hidden', animation: '_modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
               <h3 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: 0 }}>Pay Fees</h3>
               <button onClick={() => setShowPayModal(false)} style={{ border: 'none', background: '#f1f5f9', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <X size={18} color="#64748b" />
               </button>
            </div>
            
            {payStep === 1 ? (
              <div style={{ padding: 24 }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, padding: 14, background: '#f8f7ff', borderRadius: 16, border: '1px solid #ede9fe' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>👶</div>
                    <div>
                       <div style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>{selectedWardForPay?.full_name}</div>
                       <div style={{ fontSize: 12, color: '#7c3aed', fontWeight: 600 }}>{selectedWardForPay?.class?.name}</div>
                    </div>
                 </div>

                 <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>Amount to Pay (GH₵)</label>
                    <input 
                      type="number"
                      value={payAmount}
                      onChange={e => setPayAmount(e.target.value)}
                      style={{ width: '100%', padding: '14px 18px', borderRadius: 14, border: '2px solid #e2e8f0', fontSize: 24, fontWeight: 900, color: '#111827', outline: 'none', transition: 'border-color 0.2s' }}
                      onFocus={e => e.currentTarget.style.borderColor = '#7c3aed'}
                      onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                    />
                 </div>

                 <div style={{ background: '#f0fdf4', borderRadius: 14, padding: 12, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                    <ShieldCheck size={16} color="#16a34a" />
                    <span style={{ fontSize: 12, color: '#15803d', fontWeight: 600 }}>Secure payment connection</span>
                 </div>

                 <button 
                    onClick={handleProceed}
                    disabled={isProcessing || !payAmount || Number(payAmount) <= 0}
                    style={{ width: '100%', padding: '16px', borderRadius: 16, background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#fff', border: 'none', fontSize: 15, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 4px 15px rgba(109,40,217,0.3)', opacity: isProcessing ? 0.7 : 1 }}
                 >
                    {isProcessing ? 'Verifying...' : `Proceed`}
                 </button>
              </div>
            ) : (
              <div style={{ padding: '32px 24px', textAlign: 'center', animation: '_modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                 <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f8f7ff', color: '#6d28d9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 16px', boxShadow: '0 4px 12px rgba(109,40,217,0.1)' }}>
                   🏫
                 </div>
                 <h3 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 12px' }}>Confirm Payment</h3>
                 <p style={{ fontSize: 15, color: '#64748b', margin: '0 0 32px', lineHeight: 1.6 }}>
                   You are about to securely pay <strong style={{ color: '#111827' }}>GH₵ {Number(payAmount).toLocaleString()}</strong> directly to:<br/>
                   <span style={{ color: '#6d28d9', fontSize: 18, fontWeight: 800, display: 'inline-block', marginTop: 8 }}>{schoolInfo?.name}</span>
                 </p>

                 <div style={{ display: 'flex', gap: 12 }}>
                   <button onClick={() => setPayStep(1)} style={{ flex: 1, padding: '14px', borderRadius: 14, background: '#f1f5f9', color: '#475569', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Back</button>
                   <button 
                     onClick={handlePayOnline} 
                     disabled={isProcessing} 
                     style={{ flex: 2, padding: '14px', borderRadius: 14, background: 'linear-gradient(135deg, #16a34a, #15803d)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(22,163,74,0.3)', opacity: isProcessing ? 0.7 : 1 }}
                   >
                     {isProcessing ? 'Processing...' : 'Confirm & Pay'}
                   </button>
                 </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
