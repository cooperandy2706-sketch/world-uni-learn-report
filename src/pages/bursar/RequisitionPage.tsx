// src/pages/bursar/RequisitionPage.tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import { requisitionService, Requisition } from '../../services/requisition.service'
import { vendorService } from '../../services/vendors.service'
import { incomeService } from '../../services/bursar.service'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { 
  Plus, ClipboardList, CheckCircle, XCircle, 
  Clock, DollarSign, User, FileText, 
  ArrowRight, CreditCard, ChevronRight, Filter
} from 'lucide-react'
import Modal from '../../components/ui/Modal'

import { formatCurrency } from '../../utils/currency'
const CATS = ['Utilities', 'Salaries & Wages', 'Teaching Materials', 'Maintenance', 'School Events', 'Stationery', 'Catering', 'ICT', 'Other']

export default function RequisitionPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const schoolId = user?.school_id ?? ''
  const isBursarOrAdmin = user?.role === 'bursar' || user?.role === 'admin' || (user?.role as string) === 'global_admin'
  
  const [tab, setTab] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'paid'>(isBursarOrAdmin ? 'pending' : 'all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPayModalOpen, setIsPayModalOpen] = useState(false)
  const [selectedReq, setSelectedReq] = useState<Requisition | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')

  const [form, setForm] = useState({
    category: CATS[0],
    amount: '',
    description: ''
  })

  // 1. Fetch Requisitions
  const { data: requisitions = [], isLoading } = useQuery({
    queryKey: ['requisitions', schoolId],
    queryFn: async () => {
      const { data } = await requisitionService.getAll(schoolId)
      return data ?? []
    },
    enabled: !!schoolId
  })

  // School context for currency
  const { data: school } = useQuery({
    queryKey: ['school-currency', schoolId],
    queryFn: async () => { const { data } = await supabase.from('schools').select('currency_code').eq('id', schoolId).single(); return data },
    enabled: !!schoolId,
  })

  const schoolCurrency = school?.currency_code || 'GHS'
  const CUR = (n: number) => formatCurrency(n, schoolCurrency)

  const submitMutation = useMutation({
    mutationFn: (data: any) => requisitionService.create({ ...data, school_id: schoolId, requested_by: user?.id, status: 'pending' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['requisitions'] })
      toast.success('Requisition submitted')
      setIsModalOpen(false)
      setForm({ category: CATS[0], amount: '', description: '' })
    },
    onError: (err: any) => toast.error(err.message)
  })

  const approveMutation = useMutation({
    mutationFn: (id: string) => requisitionService.approve(id, user?.id || ''),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['requisitions'] })
      toast.success('Requisition approved')
    }
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string, reason: string }) => requisitionService.reject(id, user?.id || '', reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['requisitions'] })
      toast.success('Requisition rejected')
      setSelectedReq(null)
      setRejectionReason('')
    }
  })

  const payMutation = useMutation({
    mutationFn: ({ req, method }: { req: Requisition, method: string }) => requisitionService.payAndRecordExpense(req, method),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['requisitions'], exact: false })
      qc.invalidateQueries({ queryKey: ['expenses'], exact: false })
      toast.success('Payment recorded and expense created')
      setIsPayModalOpen(false)
      setSelectedReq(null)
    }
  })

  const filtered = requisitions.filter(r => tab === 'all' ? true : r.status === tab)
  const myRequisitions = requisitions.filter(r => r.requested_by === user?.id)
  const displayList = isBursarOrAdmin ? filtered : myRequisitions

  return (
    <div style={{ fontFamily: '"DM Sans", sans-serif' }}>
      <style>{`
        .tab { padding: 10px 20px; border: none; background: transparent; cursor: pointer; font-size: 14, fontWeight: 700, color: #64748b; border-bottom: 2px solid transparent; transition: all .2s; }
        .tab-active { color: #6d28d9; border-bottom-color: #6d28d9; }
        .req-card { transition: all .2s; border: 1.5px solid #f1f5f9; }
        .req-card:hover { transform: translateX(6px); border-color: #6d28d9; }
        .st-pending { background: #fff7ed; color: #c2410c; }
        .st-approved { background: #f0fdf4; color: #15803d; }
        .st-rejected { background: #fef2f2; color: #b91c1c; }
        .st-paid { background: #eff6ff; color: #1d4ed8; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', margin: 0 }}>Requisitions</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>
            {isBursarOrAdmin ? 'Review and approve financial requests from staff.' : 'Submit and track your requests for funds or materials.'}
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} style={{ background: 'linear-gradient(135deg, #6d28d9 0%, #4c1d95 100%)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={18} /> New Request
        </button>
      </div>

      {/* Tabs for Bursar */}
      {isBursarOrAdmin && (
        <div style={{ display: 'flex', gap: 10, borderBottom: '1.5px solid #f1f5f9', marginBottom: 24 }}>
          {['pending', 'approved', 'paid', 'rejected', 'all'].map(t => (
            <button key={t} onClick={() => setTab(t as any)} className={`tab ${tab === t ? 'tab-active' : ''}`} style={{ textTransform: 'capitalize' }}>
              {t} {requisitions.filter(r => r.status === t).length > 0 && <span style={{ fontSize: 11, background: tab === t ? '#6d28d9' : '#f1f5f9', color: tab === t ? '#fff' : '#64748b', padding: '2px 6px', borderRadius: 6, marginLeft: 6 }}>{requisitions.filter(r => r.status === t).length}</span>}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {isLoading ? (
          <div style={{ padding: 100, textAlign: 'center', color: '#94a3b8' }}>Loading requests...</div>
        ) : displayList.length === 0 ? (
          <div style={{ padding: 80, textAlign: 'center', background: 'var(--bg-card)', borderRadius: 24, border: '1.5px dashed #e2e8f0' }}>
            <ClipboardList size={48} color="#cbd5e1" style={{ marginBottom: 16 }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#475569', margin: 0 }}>No Requisitions Found</h3>
            <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 8 }}>Everything is up to date.</p>
          </div>
        ) : (
          displayList.map(r => (
            <div key={r.id} className="req-card" style={{ background: 'var(--bg-card)', borderRadius: 24, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, flex: 1 }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                  {r.status === 'pending' ? <Clock size={24} color="#f97316" /> : r.status === 'approved' ? <CheckCircle size={24} color="#10b981" /> : r.status === 'paid' ? <DollarSign size={24} color="#3b82f6" /> : <XCircle size={24} color="#ef4444" />}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8' }}>{r.category}</span>
                    <span className={`st-${r.status}`} style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase' }}>{r.status}</span>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>{r.description}</h3>
                  <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 12, color: '#64748b' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><User size={12} /> {(r as any).requested_user?.full_name}</span>
                    <span>•</span>
                    <span>{new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right', marginRight: 40 }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a' }}>{CUR(r.amount)}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Requested Amount</div>
              </div>

              {isBursarOrAdmin && (
                <div style={{ display: 'flex', gap: 8 }}>
                  {r.status === 'pending' && (
                    <>
                      <button onClick={() => approveMutation.mutate(r.id)} style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: '#ecfdf5', color: '#059669', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        Approve
                      </button>
                      <button onClick={() => { setSelectedReq(r); setRejectionReason('') }} style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: '#fef2f2', color: '#dc2626', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        Reject
                      </button>
                    </>
                  )}
                  {r.status === 'approved' && (
                    <button onClick={() => { setSelectedReq(r); setIsPayModalOpen(true) }} style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: '#eff6ff', color: '#1d4ed8', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                      Process Payment <ArrowRight size={14} />
                    </button>
                  )}
                  {r.status === 'paid' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#059669', fontSize: 13, fontWeight: 700 }}>
                      <CheckCircle size={16} /> Paid
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* New Request Modal */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Requisition Request">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '10px 0' }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>Category</label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1.5px solid #e2e8f0', outline: 'none' }}>
              {CATS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>Amount (GHS)</label>
            <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0.00" style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1.5px solid #e2e8f0', outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>Purpose / Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What are these funds for?" rows={3} style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1.5px solid #e2e8f0', outline: 'none', resize: 'none' }} />
          </div>
          <button onClick={() => submitMutation.mutate(form)} disabled={submitMutation.isPending || !form.amount || !form.description} style={{ background: '#6d28d9', color: '#fff', border: 'none', padding: '14px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', marginTop: 10 }}>
            {submitMutation.isPending ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </Modal>

      {/* Reject Modal */}
      {selectedReq && !isPayModalOpen && (
        <Modal open={!!selectedReq} onClose={() => setSelectedReq(null)} title="Reject Requisition">
          <div style={{ padding: '10px 0' }}>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>Please provide a reason for rejecting this request from <strong>{(selectedReq as any).requested_user?.full_name}</strong>.</p>
            <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} placeholder="Reason for rejection..." rows={3} style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1.5px solid #e2e8f0', outline: 'none', resize: 'none', marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => rejectMutation.mutate({ id: selectedReq.id, reason: rejectionReason })} disabled={rejectMutation.isPending || !rejectionReason} style={{ flex: 1, background: '#dc2626', color: '#fff', border: 'none', padding: '12px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>
                Confirm Rejection
              </button>
              <button onClick={() => setSelectedReq(null)} style={{ flex: 0.5, background: 'var(--bg-card)', border: '1.5px solid #e2e8f0', padding: '12px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Payment Modal */}
      {selectedReq && isPayModalOpen && (
        <Modal open={isPayModalOpen} onClose={() => setIsPayModalOpen(true)} title="Process Payment">
          <div style={{ padding: '10px 0' }}>
            <div style={{ background: '#f8fafc', padding: 20, borderRadius: 16, marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 }}>Paying To</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{(selectedReq as any).requested_user?.full_name}</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#6d28d9', marginTop: 12 }}>{CUR(selectedReq.amount)}</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{selectedReq.description}</div>
            </div>

            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 10, textTransform: 'uppercase' }}>Select Payment Method</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
              {['cash', 'bank_transfer', 'momo', 'cheque'].map(m => (
                <button key={m} onClick={() => setPaymentMethod(m)} style={{ padding: '14px', borderRadius: 12, border: paymentMethod === m ? '2px solid #6d28d9' : '1.5px solid #e2e8f0', background: paymentMethod === m ? '#f5f3ff' : '#fff', color: paymentMethod === m ? '#6d28d9' : '#64748b', fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: 8 }}>
                   {m.replace('_', ' ')}
                </button>
              ))}
            </div>

            <button onClick={() => payMutation.mutate({ req: selectedReq, method: paymentMethod })} disabled={payMutation.isPending} style={{ width: '100%', background: '#059669', color: '#fff', border: 'none', padding: '16px', borderRadius: 14, fontWeight: 800, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <CreditCard size={20} /> {payMutation.isPending ? 'Processing...' : `Confirm & Pay ${CUR(selectedReq.amount)}`}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
