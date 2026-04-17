// src/pages/bursar/FeesPage.tsx
import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import { useCurrentTerm, useCurrentAcademicYear } from '../../hooks/useSettings'
import { useClasses } from '../../hooks/useClasses'
import { feeStructuresService, feePaymentsService } from '../../services/bursar.service'
import { supabase } from '../../lib/supabase'
import Modal from '../../components/ui/Modal'
import toast from 'react-hot-toast'
import { Plus, Trash2, Printer, CreditCard, Settings, GraduationCap, MessageCircle, Mail, Smartphone, AlertTriangle, CheckCircle2 } from 'lucide-react'

const GHS = (n: number) => `GH₵ ${Number(n).toLocaleString('en-GH', { minimumFractionDigits: 2 })}`
const METHODS = ['cash', 'momo', 'bank', 'cheque'] as const

function Btn({ children, onClick, variant = 'primary', disabled, loading, style }: any) {
  const [h, setH] = useState(false)
  const v: any = {
    primary: { background: h ? '#5b21b6' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', border: 'none' },
    secondary: { background: h ? '#f5f3ff' : '#fff', color: '#374151', border: '1.5px solid #e5e7eb' },
    success: { background: h ? '#15803d' : '#16a34a', color: '#fff', border: 'none' },
    danger: { background: h ? '#b91c1c' : '#dc2626', color: '#fff', border: 'none' },
    ghost: { background: h ? '#f5f3ff' : 'transparent', color: '#6b7280', border: 'none' },
  }
  return (
    <button onClick={onClick} disabled={disabled} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all .15s', opacity: disabled ? 0.6 : 1, fontFamily: '"DM Sans",sans-serif', boxShadow: '0 2px 8px rgba(0,0,0,.08)', ...v[variant], ...style }}>
      {loading && <span style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', animation: '_fp_spin .7s linear infinite', flexShrink: 0 }} />}
      {children}
    </button>
  )
}

export default function FeesPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const schoolId = user?.school_id ?? ''
  const { data: term } = useCurrentTerm()
  const { data: year } = useCurrentAcademicYear()
  const { data: classes = [] } = useClasses()
  const [tab, setTab] = useState<'structures' | 'record' | 'history'>('record')
  const [structureModal, setStructureModal] = useState(false)
  const [paymentModal, setPaymentModal] = useState(false)
  const [printReceipt, setPrintReceipt] = useState<any>(null)
  const [allocationResult, setAllocationResult] = useState<any>(null)
  const [studentSearch, setStudentSearch] = useState('')

  // Fee structures
  const { data: structures = [], isLoading: loadingStructures } = useQuery({
    queryKey: ['fee-structures', schoolId, term?.id],
    queryFn: async () => { const { data } = await feeStructuresService.getAll(schoolId, term?.id); return data ?? [] },
    enabled: !!schoolId,
  })

  // Fee payment history
  const { data: payments = [], isLoading: loadingPayments } = useQuery({
    queryKey: ['fee-payments', schoolId, term?.id],
    queryFn: async () => { const { data } = await feePaymentsService.getAll(schoolId, term?.id); return data ?? [] },
    enabled: !!schoolId,
  })

  // School context
  const { data: school } = useQuery({
    queryKey: ['school-receipt', schoolId],
    queryFn: async () => { const { data } = await supabase.from('schools').select('*').eq('id', schoolId).single(); return data },
    enabled: !!schoolId,
  })

  // Students — staleTime: 0 ensures fees_arrears is always fresh when returning
  // from an old-term view, so the arrears banner / allocation preview is correct.
  const { data: students = [] } = useQuery({
    queryKey: ['students-all', schoolId],
    queryFn: async () => { const { data } = await supabase.from('students').select('id, full_name, student_id, scholarship_type, scholarship_percentage, fees_arrears, class:classes(id,name)').eq('school_id', schoolId).eq('is_active', true).order('full_name'); return data ?? [] },
    enabled: !!schoolId,
    staleTime: 0,
  })

  const filteredStudents = useMemo(() => {
    return (students as any[]).filter(s => 
      s.full_name.toLowerCase().includes(studentSearch.toLowerCase()) || 
      (s.student_id && s.student_id.toLowerCase().includes(studentSearch.toLowerCase()))
    )
  }, [students, studentSearch])

  // ── Structure form ─────────────────────────────────────────────
  const [sf, setSf] = useState({ class_id: '', fee_name: '', amount: '', description: '' })
  const createStructure = useMutation({
    mutationFn: (d: any) => feeStructuresService.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fee-structures'] }); setStructureModal(false); setSf({ class_id: '', fee_name: '', amount: '', description: '' }); toast.success('Fee structure created') },
    onError: (e: any) => toast.error(e.message),
  })

  const [copying, setCopying] = useState(false)
  async function handleCopyPrevious() {
    if (!term?.id) return
    setCopying(true)
    try {
      const { data: terms } = await supabase.from('terms').select('id').eq('school_id', schoolId).neq('id', term.id).order('created_at', { ascending: false }).limit(1)
      if (!terms || terms.length === 0) { toast.error('No previous term found'); return }
      
      const prevId = terms[0].id
      const { data: oldStructs } = await supabase.from('fee_structures').select('*').eq('term_id', prevId)
      
      if (!oldStructs || oldStructs.length === 0) { toast.error('No fees found in previous term'); return }
      
      const mapped = oldStructs.map(s => ({
        school_id: s.school_id,
        class_id: s.class_id,
        term_id: term.id,
        academic_year_id: year?.id,
        fee_name: s.fee_name,
        amount: s.amount,
        description: s.description
      }))
      
      const { error } = await supabase.from('fee_structures').insert(mapped)
      if (error) throw error
      
      toast.success(`Copied ${oldStructs.length} structures from previous term!`)
      qc.invalidateQueries({ queryKey: ['fee-structures'] })
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setCopying(false)
    }
  }

  // ── Payment form ───────────────────────────────────────────────
  const [pf, setPf] = useState({ student_id: '', fee_structure_id: '', amount_paid: '', payment_method: 'cash' as typeof METHODS[number], reference_number: '', notes: '', payment_date: new Date().toISOString().split('T')[0] })
  const recordPayment = useMutation({
    mutationFn: (d: any) => feePaymentsService.createWithAllocation(d),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['fee-payments'] })
      qc.invalidateQueries({ queryKey: ['students-all'] })
      qc.invalidateQueries({ queryKey: ['students-class-debt'] })
      setPaymentModal(false)
      setAllocationResult(res.allocation)
      setPrintReceipt(res.payment)
      if (res.allocation.arrearsCleared) {
        toast.success('🎉 Payment recorded — ALL ARREARS CLEARED!')
      } else if (res.allocation.arrearsPaid > 0) {
        toast.success(`Payment recorded — ${GHS(res.allocation.arrearsPaid)} applied to arrears`)
      } else {
        toast.success('Payment recorded successfully')
      }
    },
    onError: (e: any) => toast.error(e.message),
  })

  const delPayment = useMutation({
    mutationFn: (id: string) => feePaymentsService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fee-payments'] }); qc.invalidateQueries({ queryKey: ['students-all'] }); qc.invalidateQueries({ queryKey: ['students-class-debt'] }); toast.success('Payment deleted & arrears restored') },
  })

  function handleRecordPayment() {
    if (!pf.student_id || !pf.amount_paid) { toast.error('Select student and enter amount'); return }
    const sel = structures.find((s: any) => s.id === pf.fee_structure_id) as any
    recordPayment.mutate({
      school_id: schoolId,
      student_id: pf.student_id,
      fee_structure_id: pf.fee_structure_id || null,
      term_id: term?.id ?? null,
      academic_year_id: (year as any)?.id ?? null,
      amount_paid: parseFloat(pf.amount_paid),
      payment_method: pf.payment_method,
      reference_number: pf.reference_number || null,
      notes: pf.notes || null,
      payment_date: pf.payment_date,
      recorded_by: user?.id ?? null,
    })
  }

  function generateTextReceipt(payment: any) {
    const stu = students.find((s: any) => s.id === payment.student_id) as any
    const struct = structures.find((s: any) => s.id === payment.fee_structure_id) as any
    const arrPaid = Number(payment.arrears_paid || 0)
    const arrRemain = Number(payment.arrears_balance_after || 0)
    const currentPaid = Number(payment.amount_paid) - arrPaid
    let text = `🏫 SCHOOL FEE RECEIPT\n\nStudent: ${stu?.full_name ?? 'Unknown'}\nClass: ${(stu?.class as any)?.name ?? 'Unknown'}\nFee Type: ${struct?.fee_name ?? 'General Fee'}\n\nAmount Paid: ${GHS(payment.amount_paid)}\nMethod: ${payment.payment_method.toUpperCase()}\nDate: ${new Date(payment.payment_date).toLocaleDateString('en-GB')}\nReceipt #: ${payment.id?.slice(0, 8).toUpperCase()}`
    if (arrPaid > 0) {
      text += `\n\n📋 PAYMENT ALLOCATION:\n→ Applied to Arrears: ${GHS(arrPaid)}\n→ Applied to Current Term: ${GHS(currentPaid)}`
      if (arrRemain > 0) text += `\n⚠️ Remaining Arrears: ${GHS(arrRemain)}`
      else text += `\n✅ ALL ARREARS CLEARED!`
    }
    text += `\n\nThank you for your payment.`
    return text
  }

  function handlePrint(payment: any) {
    const stu = students.find((s: any) => s.id === payment.student_id) as any
    const struct = structures.find((s: any) => s.id === payment.fee_structure_id) as any
    const win = window.open('', '_blank', 'width=800,height=900')
    if (!win) return

    const arrPaid = Number(payment.arrears_paid || 0)
    const arrRemain = Number(payment.arrears_balance_after || 0)
    const currentPaid = Number(payment.amount_paid) - arrPaid

    const allocationHtml = arrPaid > 0 ? `
        <tr><td colspan="2" style="padding:12px 0 6px; font-size:10px; font-weight:800; letter-spacing:.1em; text-transform:uppercase; color:#6d28d9; border-bottom:2px solid #ede9fe;">Payment Allocation</td></tr>
        <tr><td style="padding:8px 0; border-bottom:1px solid #f1f5f9; color:#dc2626; font-size:12px; font-weight:600;">Applied to Previous Arrears</td><td style="padding:8px 0; border-bottom:1px solid #f1f5f9; font-size:12px; font-weight:800; text-align:right; color:#dc2626;">${GHS(arrPaid)}</td></tr>
        <tr><td style="padding:8px 0; border-bottom:1px solid #f1f5f9; color:#16a34a; font-size:12px; font-weight:600;">Applied to Current Term Fees</td><td style="padding:8px 0; border-bottom:1px solid #f1f5f9; font-size:12px; font-weight:800; text-align:right; color:#16a34a;">${GHS(currentPaid)}</td></tr>
        <tr><td style="padding:8px 0; border-bottom:1px solid #f1f5f9; color:${arrRemain > 0 ? '#d97706' : '#16a34a'}; font-size:12px; font-weight:700;">Remaining Arrears</td><td style="padding:8px 0; border-bottom:1px solid #f1f5f9; font-size:12px; font-weight:900; text-align:right; color:${arrRemain > 0 ? '#d97706' : '#16a34a'};">${arrRemain > 0 ? GHS(arrRemain) : '✅ CLEARED'}</td></tr>
    ` : ''

    const buildReceiptHTML = (type: string) => `
      <div style="flex: 1; padding: 24px; display: flex; flex-direction: column; justify-content: center;">
        <div style="font-size:11px; font-weight:800; color:#6b7280; letter-spacing:0.15em; text-transform:uppercase; margin-bottom:14px; text-align:center;">${type}</div>
        ${logoHtml}
        <div style="font-size:18px; font-weight:900; color:#1e0646; margin-bottom:4px; text-align:center; font-family:serif;">${school?.name || 'SCHOOL FEE RECEIPT'}</div>
        ${school?.address ? `<div style="font-size:11px; color:#6b7280; text-align:center; margin-bottom:4px;">${school.address}</div>` : ''}
        ${school?.phone ? `<div style="font-size:11px; color:#6b7280; text-align:center; margin-bottom:14px;">${school.phone}</div>` : ''}
        <div style="font-size:11px; color:#9ca3af; text-align:center; margin-bottom:20px;">Receipt #${payment.id?.slice(0, 8).toUpperCase()}</div>
        <div style="font-size:28px; font-weight:900; color:#16a34a; margin-bottom:20px; text-align:center;">${GHS(payment.amount_paid)}</div>
        ${arrPaid > 0 && arrRemain === 0 ? '<div style="text-align:center; margin-bottom:14px;"><span style="background:#f0fdf4; color:#16a34a; padding:4px 16px; border-radius:99px; font-size:11px; font-weight:800; letter-spacing:.04em;">✅ ALL ARREARS CLEARED</span></div>' : ''}
        <table style="width:100%; border-collapse:collapse; max-width: 440px; margin: 0 auto;">
          <tr><td style="padding:8px 0; border-bottom:1px solid #f1f5f9; color:#6b7280; font-size:12px; font-weight:600;">Student</td><td style="padding:8px 0; border-bottom:1px solid #f1f5f9; font-size:12px; font-weight:800; text-align:right; color:#111827;">${stu?.full_name ?? '—'}</td></tr>
          <tr><td style="padding:8px 0; border-bottom:1px solid #f1f5f9; color:#6b7280; font-size:12px; font-weight:600;">Class</td><td style="padding:8px 0; border-bottom:1px solid #f1f5f9; font-size:12px; font-weight:800; text-align:right; color:#111827;">${(stu?.class as any)?.name ?? '—'}</td></tr>
          <tr><td style="padding:8px 0; border-bottom:1px solid #f1f5f9; color:#6b7280; font-size:12px; font-weight:600;">Fee Type</td><td style="padding:8px 0; border-bottom:1px solid #f1f5f9; font-size:12px; font-weight:800; text-align:right; color:#111827;">${struct?.fee_name ?? 'General Fee'}</td></tr>
          <tr><td style="padding:8px 0; border-bottom:1px solid #f1f5f9; color:#6b7280; font-size:12px; font-weight:600;">Payment Method</td><td style="padding:8px 0; border-bottom:1px solid #f1f5f9; font-size:12px; font-weight:800; text-align:right; color:#111827; text-transform:capitalize;">${payment.payment_method}</td></tr>
          ${payment.reference_number ? `<tr><td style="padding:8px 0; border-bottom:1px solid #f1f5f9; color:#6b7280; font-size:12px; font-weight:600;">Reference</td><td style="padding:8px 0; border-bottom:1px solid #f1f5f9; font-size:12px; font-weight:800; text-align:right; color:#111827;">${payment.reference_number}</td></tr>` : ''}
          <tr><td style="padding:8px 0; border-bottom:1px solid #f1f5f9; color:#6b7280; font-size:12px; font-weight:600;">Date</td><td style="padding:8px 0; border-bottom:1px solid #f1f5f9; font-size:12px; font-weight:800; text-align:right; color:#111827;">${new Date(payment.payment_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
          ${allocationHtml}
        </table>
        <div style="font-size:10px; color:#9ca3af; text-align:center; padding-top:16px; margin-top:16px; max-width: 440px; margin-left: auto; margin-right: auto;">This is an official receipt. Keep for your records.</div>
      </div>
    `

    win.document.write(`<!DOCTYPE html><html><head><title>Fee Receipt - ${stu?.full_name ?? ''}</title>
      <style>body{font-family:system-ui,sans-serif;margin:0;padding:0;background:#fff;height:100vh;display:flex;flex-direction:column;} @media print{body{height:100vh;}}</style>
      </head><body onload="window.print()">
        ${buildReceiptHTML('Original \u2014 Parent/Student Copy')}
        <div style="border-top:2px dashed #cbd5e1; width:90%; margin: 0 auto; position:relative;">
          <div style="position:absolute; top:-10px; left:-10px; width:20px; height:20px; border-radius:50%; background:#fff; border-right:2px solid #cbd5e1; border-top:2px solid transparent; border-bottom:2px solid transparent; border-left:2px solid transparent; transform:rotate(-45deg);"></div>
          <div style="position:absolute; top:-10px; right:-10px; width:20px; height:20px; border-radius:50%; background:#fff; border-left:2px solid #cbd5e1; border-top:2px solid transparent; border-bottom:2px solid transparent; border-right:2px solid transparent; transform:rotate(45deg);"></div>
        </div>
        ${buildReceiptHTML('Duplicate \u2014 School Copy')}
      </body></html>`)
    win.document.close()
  }

  const tabs = [
    { id: 'record', label: '💳 Record Payment' },
    { id: 'history', label: '📋 Payment History' },
    { id: 'structures', label: '⚙️ Fee Structures' },
  ] as const

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');
        @keyframes _fp_spin { to{transform:rotate(360deg)} }
        @keyframes _fp_fi { from{opacity:0} to{opacity:1} }
        .fp-row:hover { background: #faf5ff !important; }
      `}</style>
      <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif', animation: '_fp_fi .4s ease' }}>

        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>School Fees</h1>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 3 }}>{term ? `${term.name} — Active Term` : 'No active term set'}</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {tab === 'structures' && (
              <>
                <button onClick={handleCopyPrevious} disabled={copying} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 9, border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600, cursor: copying ? 'not-allowed' : 'pointer' }}>
                  {copying ? 'Copying...' : 'Pull from Previous Term'}
                </button>
                <Btn onClick={() => setStructureModal(true)}><Plus size={14} /> New Fee Type</Btn>
              </>
            )}
            {tab !== 'structures' && <Btn variant="success" onClick={() => setPaymentModal(true)}><CreditCard size={14} /> Record Payment</Btn>}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: '#f5f3ff', borderRadius: 12, padding: 4, marginBottom: 22, width: 'fit-content' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding: '8px 18px', borderRadius: 9, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .15s', background: tab === t.id ? '#6d28d9' : 'transparent', color: tab === t.id ? '#fff' : '#6d28d9', fontFamily: '"DM Sans",sans-serif' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── RECORD PAYMENT TAB ── */}
        {tab === 'record' && (
          <div style={{ background: '#fff', borderRadius: 18, padding: 28, border: '1.5px solid #f0eefe', maxWidth: 560, boxShadow: '0 2px 12px rgba(109,40,217,.07)' }}>
            <h2 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#111827', margin: '0 0 20px' }}>Record a Fee Payment</h2>

            {/* Student financial info banners */}
            {(() => {
              const sel = (students as any[]).find((s: any) => s.id === pf.student_id)
              if (!sel) return null
              const arrears = Number(sel.fees_arrears || 0)
              const hasScholarship = sel.scholarship_type && sel.scholarship_type !== 'none'
              const pct = sel.scholarship_percentage || 0
              const feeStruct = pf.fee_structure_id ? (structures as any[]).find((s: any) => s.id === pf.fee_structure_id) : null
              const gross = feeStruct?.amount || 0
              const discount = gross * (pct / 100)
              const net = gross - discount
              const payAmt = Number(pf.amount_paid || 0)
              const arrearsWillPay = Math.min(payAmt, arrears)
              const currentWillPay = payAmt - arrearsWillPay
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                  {arrears > 0 && (
                    <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <AlertTriangle size={18} color="#dc2626" style={{ marginTop: 1, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#dc2626' }}>
                          ⚠️ Outstanding Arrears: {GHS(arrears)}
                        </div>
                        <div style={{ fontSize: 11, color: '#991b1b', marginTop: 3, lineHeight: 1.5 }}>
                          This student owes from previous terms. Payment will be applied to arrears first, then current term fees.
                        </div>
                        {payAmt > 0 && (
                          <div style={{ marginTop: 8, padding: '8px 12px', background: '#fff', borderRadius: 8, border: '1px solid #fecaca' }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 4 }}>Payment Allocation Preview:</div>
                            <div style={{ display: 'flex', gap: 16, fontSize: 11 }}>
                              <span style={{ color: '#dc2626', fontWeight: 700 }}>→ Arrears: {GHS(arrearsWillPay)}</span>
                              <span style={{ color: '#16a34a', fontWeight: 700 }}>→ Current: {GHS(currentWillPay)}</span>
                              {arrears - arrearsWillPay > 0
                                ? <span style={{ color: '#9ca3af', fontWeight: 600 }}>Remaining arrears: {GHS(arrears - arrearsWillPay)}</span>
                                : payAmt >= arrears && <span style={{ color: '#16a34a', fontWeight: 800 }}>✅ Arrears will be fully cleared!</span>
                              }
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {hasScholarship && (
                    <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <GraduationCap size={18} color="#16a34a" />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>
                          🎓 {sel.scholarship_type === 'full' ? 'Full Scholarship' : `${pct}% Scholarship`} Student
                        </div>
                        {gross > 0 && (
                          <div style={{ fontSize: 11, color: '#15803d', marginTop: 2 }}>
                            Fee: {GHS(gross)} − Discount: {GHS(discount)} = <strong>Net: {GHS(net)}</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Search & Select Student', children: (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <input 
                      placeholder="Type name or ID to search..." 
                      value={studentSearch} 
                      onChange={e => setStudentSearch(e.target.value)} 
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', fontFamily: '"DM Sans",sans-serif', boxSizing: 'border-box' }}
                    />
                    <select value={pf.student_id} onChange={e => setPf(p => ({ ...p, student_id: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', fontFamily: '"DM Sans",sans-serif', boxSizing: 'border-box' }}>
                      <option value="">— Select from {filteredStudents.length} {filteredStudents.length === 1 ? 'student' : 'students'} —</option>
                      {filteredStudents.map((s: any) => <option key={s.id} value={s.id}>{s.full_name} {s.student_id ? `(${s.student_id})` : ''} - {(s.class as any)?.name ?? 'No class'}</option>)}
                    </select>
                  </div>
                )},
                { label: 'Fee Type (optional)', children: (
                  <select value={pf.fee_structure_id} onChange={e => { const s = structures.find((x: any) => x.id === e.target.value) as any; setPf(p => ({ ...p, fee_structure_id: e.target.value, amount_paid: s ? String(s.amount) : p.amount_paid })) }} style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', fontFamily: '"DM Sans",sans-serif' }}>
                    <option value="">— General / Custom —</option>
                    {(structures as any[]).map((s: any) => <option key={s.id} value={s.id}>{s.fee_name} — {GHS(s.amount)} ({s.class?.name})</option>)}
                  </select>
                )},
                { label: 'Amount Paid (GH₵)', children: <input type="number" min="0" step="0.01" value={pf.amount_paid} onChange={e => setPf(p => ({ ...p, amount_paid: e.target.value }))} placeholder="0.00" style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', fontFamily: '"DM Sans",sans-serif', boxSizing: 'border-box' }} /> },
              ].map(f => (
                <div key={f.label}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 5 }}>{f.label}</label>
                  {f.children}
                </div>
              ))}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 5 }}>Payment Method</label>
                  <select value={pf.payment_method} onChange={e => setPf(p => ({ ...p, payment_method: e.target.value as any }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', fontFamily: '"DM Sans",sans-serif' }}>
                    {METHODS.map(m => <option key={m} value={m} style={{ textTransform: 'capitalize' }}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 5 }}>Date</label>
                  <input type="date" value={pf.payment_date} onChange={e => setPf(p => ({ ...p, payment_date: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', fontFamily: '"DM Sans",sans-serif', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 5 }}>Reference / Receipt No.</label>
                <input value={pf.reference_number} onChange={e => setPf(p => ({ ...p, reference_number: e.target.value }))} placeholder="Optional" style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', fontFamily: '"DM Sans",sans-serif', boxSizing: 'border-box' }} />
              </div>
              <Btn variant="success" onClick={handleRecordPayment} loading={recordPayment.isPending} style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
                <CreditCard size={16} /> Record & Print Receipt
              </Btn>
            </div>
          </div>
        )}

        {/* ── HISTORY TAB ── */}
        {tab === 'history' && (
          <div style={{ background: '#fff', borderRadius: 18, border: '1.5px solid #f0eefe', overflow: 'hidden' }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid #faf5ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{(payments as any[]).length} payments recorded {term ? `· ${term.name}` : ''}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#16a34a' }}>Total: {GHS((payments as any[]).reduce((s: number, p: any) => s + (p.amount_paid || 0), 0))}</span>
            </div>
            {loadingPayments ? <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Loading…</div> : (payments as any[]).length === 0 ? <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No payments for this term yet</div> : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
                  <thead>
                    <tr style={{ background: '#faf5ff' }}>
                      {['Student', 'Class', 'Fee Type', 'Amount', 'Method', 'Ref', 'Date', ''].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(payments as any[]).map((p: any, i) => (
                      <tr key={p.id} onClick={() => setPrintReceipt(p)} className="fp-row" style={{ borderBottom: '1px solid #faf5ff', transition: 'background .12s', cursor: 'pointer' }}>
                        <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: '#111827' }}>{p.student?.full_name}</td>
                        <td style={{ padding: '11px 14px' }}><span style={{ fontSize: 11, background: '#ede9fe', color: '#5b21b6', padding: '2px 8px', borderRadius: 99 }}>{(p.student as any)?.class?.name ?? '—'}</span></td>
                        <td style={{ padding: '11px 14px', fontSize: 12, color: '#6b7280' }}>{p.fee_structure?.fee_name ?? 'General'}</td>
                        <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 800, color: '#16a34a' }}>{GHS(p.amount_paid)}</td>
                        <td style={{ padding: '11px 14px' }}><span style={{ fontSize: 11, background: '#f0fdf4', color: '#16a34a', padding: '2px 8px', borderRadius: 99, textTransform: 'capitalize', fontWeight: 600 }}>{p.payment_method}</span></td>
                        <td style={{ padding: '11px 14px', fontSize: 12, color: '#9ca3af', fontFamily: 'monospace' }}>{p.reference_number ?? '—'}</td>
                        <td style={{ padding: '11px 14px', fontSize: 12, color: '#6b7280' }}>{new Date(p.payment_date).toLocaleDateString('en-GB')}</td>
                        <td style={{ padding: '11px 14px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={(e) => { e.stopPropagation(); setPrintReceipt(p) }} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: '#eff6ff', color: '#2563eb', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="View / Print Receipt"><Printer size={13} /></button>
                            <button onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/?text=${encodeURIComponent(generateTextReceipt(p))}`, '_blank') }} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: '#ecfdf5', color: '#059669', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Share via WhatsApp"><MessageCircle size={13} /></button>
                            <button onClick={(e) => { e.stopPropagation(); window.open(`sms:?body=${encodeURIComponent(generateTextReceipt(p))}`, '_self') }} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: '#f5f3ff', color: '#6d28d9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Send via SMS"><Smartphone size={13} /></button>
                            <button onClick={(e) => { e.stopPropagation(); if (confirm('Delete this payment?')) delPayment.mutate(p.id) }} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Delete"><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── FEE STRUCTURES TAB ── */}
        {tab === 'structures' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {loadingStructures ? <div style={{ padding: '40px', color: '#9ca3af', fontSize: 13 }}>Loading…</div> : (structures as any[]).length === 0 ? (
              <div style={{ gridColumn: '1/-1', background: '#fff', borderRadius: 16, padding: '60px', textAlign: 'center', border: '1.5px solid #f0eefe' }}>
                <Settings size={40} color="#d1d5db" style={{ marginBottom: 12 }} />
                <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 6 }}>No fee structures yet</h3>
                <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 18 }}>Create fee types for each class and term</p>
                <Btn onClick={() => setStructureModal(true)}><Plus size={14} /> Create First Fee Type</Btn>
              </div>
            ) : (structures as any[]).map((s: any) => (
              <div key={s.id} style={{ background: '#fff', borderRadius: 16, padding: '20px', border: '1.5px solid #f0eefe', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{s.fee_name}</div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{s.class?.name} · {s.term?.name}</div>
                  </div>
                  <button onClick={() => { if (confirm('Delete this fee structure?')) feeStructuresService.delete(s.id).then(() => qc.invalidateQueries({ queryKey: ['fee-structures'] })) }}
                    style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#16a34a', fontFamily: '"Playfair Display",serif' }}>{GHS(s.amount)}</div>
                {s.description && <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>{s.description}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Create Structure Modal ── */}
      <Modal open={structureModal} onClose={() => setStructureModal(false)} title="New Fee Structure" subtitle="Define a fee for a class and term" size="sm"
        footer={<><Btn variant="secondary" onClick={() => setStructureModal(false)}>Cancel</Btn><Btn onClick={() => { if (!sf.class_id || !sf.fee_name || !sf.amount) { toast.error('Fill required fields'); return } createStructure.mutate({ school_id: schoolId, class_id: sf.class_id, term_id: term?.id, academic_year_id: (year as any)?.id, fee_name: sf.fee_name, amount: parseFloat(sf.amount), description: sf.description || null }) }} loading={createStructure.isPending}>Create</Btn></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'Class *', children: <select value={sf.class_id} onChange={e => setSf(p => ({ ...p, class_id: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none' }}><option value="">Select class…</option>{(classes as any[]).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select> },
            { label: 'Fee Name *', children: <input value={sf.fee_name} onChange={e => setSf(p => ({ ...p, fee_name: e.target.value }))} placeholder="e.g. Tuition Fee" style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} /> },
            { label: 'Amount (GH₵) *', children: <input type="number" value={sf.amount} onChange={e => setSf(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} /> },
            { label: 'Description', children: <input value={sf.description} onChange={e => setSf(p => ({ ...p, description: e.target.value }))} placeholder="Optional note" style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} /> },
          ].map(f => (
            <div key={f.label}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 5 }}>{f.label}</label>
              {f.children}
            </div>
          ))}
        </div>
      </Modal>

      {/* ── Transaction Receipt Modal ── */}
      <Modal open={!!printReceipt} onClose={() => { setPrintReceipt(null); setAllocationResult(null) }} title="Payment Transaction Successful!" size="md">
        {printReceipt && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: 24, textAlign: 'center', border: '1.5px solid #e2e8f0' }}>
              <div style={{ fontSize: 13, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700, marginBottom: 8 }}>Transaction Successfully Recorded</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: '#16a34a', fontFamily: '"Playfair Display",serif' }}>{GHS(printReceipt.amount_paid)}</div>
              <div style={{ fontSize: 14, color: '#374151', marginTop: 8, fontWeight: 600 }}>{(students as any[]).find(s => s.id === printReceipt.student_id)?.full_name ?? 'Student'}</div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>Receipt ID: {printReceipt.id?.slice(0,8).toUpperCase()}</div>
            </div>

            {/* Allocation breakdown */}
            {allocationResult && allocationResult.previousArrears > 0 && (
              <div style={{ background: allocationResult.arrearsCleared ? '#f0fdf4' : '#fffbeb', borderRadius: 12, padding: '16px 20px', border: `1.5px solid ${allocationResult.arrearsCleared ? '#bbf7d0' : '#fde68a'}` }}>
                {allocationResult.arrearsCleared && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, justifyContent: 'center' }}>
                    <CheckCircle2 size={20} color="#16a34a" />
                    <span style={{ fontSize: 14, fontWeight: 900, color: '#16a34a', letterSpacing: '.04em' }}>✅ ALL PREVIOUS ARREARS CLEARED</span>
                  </div>
                )}
                <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Payment Allocation</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid rgba(0,0,0,.06)' }}>
                      <td style={{ padding: '7px 0', fontSize: 12, color: '#dc2626', fontWeight: 600 }}>Applied to Previous Arrears</td>
                      <td style={{ padding: '7px 0', fontSize: 13, fontWeight: 800, color: '#dc2626', textAlign: 'right' }}>{GHS(allocationResult.arrearsPaid)}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid rgba(0,0,0,.06)' }}>
                      <td style={{ padding: '7px 0', fontSize: 12, color: '#16a34a', fontWeight: 600 }}>Applied to Current Term Fees</td>
                      <td style={{ padding: '7px 0', fontSize: 13, fontWeight: 800, color: '#16a34a', textAlign: 'right' }}>{GHS(allocationResult.currentTermPaid)}</td>
                    </tr>
                    {!allocationResult.arrearsCleared && (
                      <tr>
                        <td style={{ padding: '7px 0', fontSize: 12, color: '#d97706', fontWeight: 700 }}>Remaining Arrears Balance</td>
                        <td style={{ padding: '7px 0', fontSize: 13, fontWeight: 900, color: '#d97706', textAlign: 'right' }}>{GHS(allocationResult.remainingArrears)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <div>
              <p style={{ fontSize: 13, color: '#374151', fontWeight: 600, marginBottom: 12, textAlign: 'center' }}>How would you like to share this receipt?</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <button onClick={() => handlePrint(printReceipt)} style={{ padding: '14px', borderRadius: 12, border: 'none', background: '#1e0646', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, gridColumn: 'span 2' }}>
                  <Printer size={18} /> Print A4 Receipt (Duplex)
                </button>
                <button onClick={() => { window.open(`https://wa.me/?text=${encodeURIComponent(generateTextReceipt(printReceipt))}`, '_blank') }} style={{ padding: '12px', borderRadius: 12, border: 'none', background: '#ecfdf5', color: '#059669', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <MessageCircle size={16} /> WhatsApp
                </button>
                <button onClick={() => { window.open(`sms:?body=${encodeURIComponent(generateTextReceipt(printReceipt))}`, '_self') }} style={{ padding: '12px', borderRadius: 12, border: 'none', background: '#f5f3ff', color: '#6d28d9', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Smartphone size={16} /> SMS Text
                </button>
                <button onClick={() => { window.open(`mailto:?subject=Official School Fee Receipt&body=${encodeURIComponent(generateTextReceipt(printReceipt))}`, '_self') }} style={{ padding: '12px', borderRadius: 12, border: 'none', background: '#f8fafc', color: '#374151', borderBottom: '2px solid #e2e8f0', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, gridColumn: 'span 2' }}>
                  <Mail size={16} /> Send via Email
                </button>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 16, display: 'flex', justifyContent: 'center' }}>
              <button onClick={() => { setPrintReceipt(null); setAllocationResult(null) }} style={{ padding: '8px 24px', borderRadius: 8, border: 'none', background: 'transparent', color: '#6b7280', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Close this window</button>
            </div>
          </div>
        )}
      </Modal>

    </>
  )
}
