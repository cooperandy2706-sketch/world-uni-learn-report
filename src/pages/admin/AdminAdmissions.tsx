// src/pages/admin/AdminAdmissions.tsx
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import {
  billsService, scholarshipsService, enquiriesService, applicationsService,
  suppliesService,
  type BillItem, type BillCategory, type Scholarship,
  type AdmissionEnquiry, type AdmissionApplication, type EnquiryStatus,
  type SchoolSupply
} from '../../services/admissions.service'
import {
  Users, FileText, DollarSign, Plus, Trash2, Edit3, Printer,
  Search, Eye, Book, ShoppingBag, GraduationCap, Gift, MoreHorizontal,
  UserPlus, BookOpen, X, Link2
} from 'lucide-react'

// ── Tiny helpers ──────────────────────────────────────────────

const GHS = (v: number) => `GH₵ ${Number(v).toLocaleString('en-GH', { minimumFractionDigits: 2 })}`

const CATEGORY_META: Record<BillCategory, { label: string; color: string; icon: React.ComponentType<any> }> = {
  books: { label: 'Books', color: '#3b82f6', icon: Book },
  uniform: { label: 'Uniform', color: '#8b5cf6', icon: ShoppingBag },
  admission_fee: { label: 'Admission Fee', color: '#f59e0b', icon: GraduationCap },
  scholarship: { label: 'Scholarship', color: '#10b981', icon: Gift },
  other: { label: 'Other', color: '#6b7280', icon: MoreHorizontal },
}

const SUPPLY_CATEGORY_META: Record<string, { label: string; color: string; icon: React.ComponentType<any> }> = {
  textbook: { label: 'Textbooks', color: '#3b82f6', icon: BookOpen },
  stationery: { label: 'Stationery', color: '#8b5cf6', icon: ShoppingBag },
  uniform: { label: 'Uniform / Kits', color: '#f59e0b', icon: GraduationCap },
  other: { label: 'Other Supplies', color: '#6b7280', icon: MoreHorizontal },
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  enquiry: { label: 'Enquiry', color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
  applied: { label: 'Applied', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  admitted: { label: 'Admitted', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  rejected: { label: 'Rejected', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  waitlisted: { label: 'Waitlisted', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  pending: { label: 'Pending', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  reviewing: { label: 'Reviewing', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  deferred: { label: 'Deferred', color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
}

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] || STATUS_META.pending
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
      color: m.color, background: m.bg, border: `1px solid ${m.color}33`
    }}>{m.label}</span>
  )
}

// ── Shared filter bar ─────────────────────────────────────────
// Rendered inside both Bills and Supplies tabs so the UI looks native,
// but the state lives in the parent (AdminAdmissions) and is passed down.

interface FilterBarProps {
  classes: any[]
  academicYears: any[]
  selClass: string
  selYear: string
  onClassChange: (v: string) => void
  onYearChange: (v: string) => void
  rightSlot?: React.ReactNode
}

function FilterBar({ classes, academicYears, selClass, selYear, onClassChange, onYearChange, rightSlot }: FilterBarProps) {
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
      <select style={{ ...selectStyle, maxWidth: 200 }} value={selClass} onChange={e => onClassChange(e.target.value)}>
        <option value="">All Classes</option>
        {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <select style={{ ...selectStyle, maxWidth: 200 }} value={selYear} onChange={e => onYearChange(e.target.value)}>
        <option value="">All Years</option>
        {academicYears.map((y: any) => <option key={y.id} value={y.id}>{y.name}</option>)}
      </select>
      {selClass && (
        <span style={{
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700,
          color: '#1e0646', background: '#ede9fe', padding: '4px 12px', borderRadius: 99,
          border: '1px solid #c4b5fd'
        }}>
          <Link2 size={12} />
          Synced across Fees &amp; Supplies
        </span>
      )}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
        {rightSlot}
      </div>
    </div>
  )
}

// ── Modal shell ──────────────────────────────────────────────

function Modal({ title, onClose, children, wide }: any) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%',
        maxWidth: wide ? 860 : 560, maxHeight: '90vh', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 60px rgba(0,0,0,0.25)'
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#1e0646' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><X size={20} /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>{children}</div>
      </div>
    </div>
  )
}

// ── Form field ────────────────────────────────────────────────

function Field({ label, children, required }: any) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
        {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 10, border: '1.5px solid #e5e7eb',
  fontSize: 14, outline: 'none', fontFamily: 'inherit', background: '#fafafa',
  boxSizing: 'border-box', transition: 'border-color 0.2s'
}
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' }

// ── Premium Toast System ──────────────────────────────────────
interface ToastItem {
  id: number
  message: string
  type: 'success' | 'error'
}

function Toast({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div style={{
      padding: '12px 20px', borderRadius: 12, background: '#fff',
      boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
      display: 'flex', alignItems: 'center', gap: 12,
      border: `1.5px solid ${type === 'success' ? '#10b981' : '#ef4444'}`,
      animation: 'toast-in 0.3s ease-out forwards',
      maxWidth: 320, cursor: 'pointer', zIndex: 1100
    }} onClick={onClose}>
      <div style={{
        width: 10, height: 10, borderRadius: '50%',
        background: type === 'success' ? '#10b981' : '#ef4444'
      }} />
      <span style={{ fontSize: 13, fontWeight: 700, color: '#1f2937' }}>{message}</span>
    </div>
  )
}

// ── Cross-tab summary banner ──────────────────────────────────
// Shown at the top of Bills and Supplies tabs to give a "full picture"
// of the other tab's totals for the selected class.

interface CrossTabBannerProps {
  mode: 'bills-showing-supplies' | 'supplies-showing-bills'
  otherTotal: number | null
  otherCount: number
  selClass: string
  classes: any[]
  onSwitchTab: () => void
}

function CrossTabBanner({ mode, otherTotal, otherCount, selClass, classes, onSwitchTab }: CrossTabBannerProps) {
  if (otherCount === 0) return null
  const className = selClass ? classes.find((c: any) => c.id === selClass)?.name : 'all classes'
  const isBills = mode === 'bills-showing-supplies'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px',
      background: isBills ? '#eff6ff' : '#f0fdf4',
      border: `1.5px solid ${isBills ? '#bfdbfe' : '#bbf7d0'}`,
      borderRadius: 12, marginBottom: 20
    }}>
      {isBills ? <BookOpen size={18} color="#3b82f6" /> : <DollarSign size={18} color="#10b981" />}
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: isBills ? '#1d4ed8' : '#065f46' }}>
          {isBills
            ? `${otherCount} textbook/stationery item${otherCount !== 1 ? 's' : ''} linked to ${className}`
            : `Fee schedule for ${className} totals ${otherTotal !== null ? GHS(otherTotal) : '—'} (compulsory)`}
        </span>
        <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 8 }}>
          {isBills
            ? otherTotal !== null && otherTotal > 0 ? `— est. supplies cost ${GHS(otherTotal)}` : ''
            : ` · ${otherCount} bill item${otherCount !== 1 ? 's' : ''}`}
        </span>
      </div>
      <button
        onClick={onSwitchTab}
        style={{
          fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 8,
          border: `1.5px solid ${isBills ? '#3b82f6' : '#10b981'}`,
          color: isBills ? '#3b82f6' : '#10b981', background: 'transparent', cursor: 'pointer'
        }}
      >
        View {isBills ? 'Supplies' : 'Fees'} →
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  TAB 1 – BILLS MANAGER
// ═══════════════════════════════════════════════════════════════

function BillsTab({ schoolId, selClass, selYear, onClassChange, onYearChange, classes, academicYears, onShowToast, onSwitchToSupplies, school, feeStructures = [] }: any) {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<Partial<BillItem>>({ category: 'books', amount: 0, is_optional: false })

  const { data: items = [] } = useQuery({
    queryKey: ['bills', schoolId, selClass, selYear],
    queryFn: async () => {
      if (!selClass) {
        const { data } = await billsService.list(schoolId, null, selYear || null)
        return data || []
      }
      const { data } = await billsService.listForClass(schoolId, selClass, selYear || null)
      return data || []
    },
    enabled: !!schoolId
  })

  const { data: scholarships = [] } = useQuery({
    queryKey: ['scholarships', schoolId],
    queryFn: async () => { const { data } = await scholarshipsService.list(schoolId); return data || [] }
  })

  // Cross-tab: fetch supplies for the same filter to show the banner
  const { data: suppliesForBanner = [] } = useQuery({
    queryKey: ['supplies', schoolId, selClass, selYear],
    queryFn: async () => {
      if (!selClass) {
        const { data } = await suppliesService.listAll(schoolId, selYear || null)
        return data || []
      }
      const { data } = await suppliesService.listForClass(schoolId, selClass, selYear || null)
      return data || []
    }
  })

  const saveMutation = useMutation({
    mutationFn: (item: BillItem) => {
      const payload: Partial<BillItem> = {
        ...item,
        amount: Number(item.amount) || 0,
        school_id: schoolId,
        class_id: item.id ? item.class_id : (item.class_id || selClass || null),
        academic_year_id: item.id ? item.academic_year_id : (item.academic_year_id || selYear || null),
      }
      return billsService.upsert([payload as BillItem])
    },
    onSuccess: async () => { 
      await Promise.all([
        qc.refetchQueries({ queryKey: ['bills'] }),
        qc.refetchQueries({ queryKey: ['supplies'] })
      ])
      setShowForm(false)
      setEditing(null)
      setForm({ category: 'books', amount: 0, is_optional: false })
      onShowToast('Fee schedule updated successfully')
    },
    onError: (err) => {
      console.error('Save failed:', err)
      onShowToast('Could not save item. Check connection or permissions.', 'error')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => billsService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bills'] })
      qc.invalidateQueries({ queryKey: ['supplies'] })
    }
  })

  const grouped = Object.keys(CATEGORY_META).reduce((acc, cat) => {
    acc[cat] = items.filter((i: any) => i.category === cat)
    return acc
  }, {} as Record<string, any[]>)

  const total = items.reduce((s: number, i: any) => !i.is_optional ? s + Number(i.amount) : s, 0)
  const suppliesEstimate = (suppliesForBanner as any[]).reduce((s, i) =>
    i.is_required && i.unit_price ? s + (Number(i.unit_price) * Number(i.quantity)) : s, 0)

  const openEdit = (item: any) => { setEditing(item); setForm(item); setShowForm(true) }

  return (
    <div>
      <FilterBar
        classes={classes}
        academicYears={academicYears}
        selClass={selClass}
        selYear={selYear}
        onClassChange={onClassChange}
        onYearChange={onYearChange}
        rightSlot={
          <>
            <button onClick={() => { setEditing(null); setForm({ category: 'books', amount: 0, is_optional: false }); setShowForm(true) }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', background: '#1e0646', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
              <Plus size={16} /> Add Bill Item
            </button>
            <button
              onClick={() => printWelcomePack({ bills: items, supplies: suppliesForBanner as any[], scholarships, feeStructures: feeStructures as any[], className: selClass ? classes.find((c: any) => c.id === selClass)?.name : 'All Classes', billTotal: total, suppliesEstimate, school })}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
              <Printer size={16} /> Print Welcome Pack
            </button>
          </>
        }
      />

      {/* Cross-tab supplies banner */}
      <CrossTabBanner
        mode="bills-showing-supplies"
        otherTotal={suppliesEstimate > 0 ? suppliesEstimate : null}
        otherCount={(suppliesForBanner as any[]).length}
        selClass={selClass}
        classes={classes}
        onSwitchTab={onSwitchToSupplies}
      />

      {/* Total summary */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Compulsory Fees', value: GHS(total), color: '#1e0646' },
          { label: 'Optional Items', value: items.filter((i: any) => i.is_optional).length, color: '#f59e0b' },
          { label: 'Total Bill Items', value: items.length, color: '#10b981' },
          { label: 'Est. Supplies Cost', value: suppliesEstimate > 0 ? GHS(suppliesEstimate) : '—', color: '#3b82f6' },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, minWidth: 140, background: '#fafafa', border: '1.5px solid #e5e7eb', borderRadius: 14, padding: '14px 18px' }}>
            <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Synced School Fee Structure (from Bursar System) ── */}
      {(feeStructures as any[]).length > 0 && (
        <div style={{ marginBottom: 24, border: '1.5px solid #3b82f633', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', background: '#eff6ff', borderBottom: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <DollarSign size={16} color="#3b82f6" />
            <span style={{ fontWeight: 700, fontSize: 14, color: '#1d4ed8' }}>School Fee Structure</span>
            <span style={{ fontSize: 11, color: '#2563eb', background: '#dbeafe', padding: '2px 10px', borderRadius: 99, fontWeight: 700 }}>⟳ Synced from Bursar System</span>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: '#374151', fontWeight: 600 }}>{(feeStructures as any[]).length} fee{(feeStructures as any[]).length !== 1 ? 's' : ''}</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['Fee Name', 'Term', 'Class Scope', 'Amount'].map(h => (
                  <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(feeStructures as any[]).map((f: any) => (
                <tr key={f.id} style={{ borderTop: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '11px 16px', fontWeight: 600, fontSize: 14 }}>{f.fee_name}</td>
                  <td style={{ padding: '11px 16px', fontSize: 13, color: '#6b7280' }}>{f.term?.name || '—'}</td>
                  <td style={{ padding: '11px 16px' }}>
                    {f.class_id
                      ? <span style={{ background: '#eff6ff', color: '#2563eb', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>{f.class?.name || f.class?.name || classes.find((c: any) => c.id === f.class_id)?.name || 'Class'}</span>
                      : <span style={{ color: '#9ca3af', fontSize: 12 }}>All Classes</span>}
                  </td>
                  <td style={{ padding: '11px 16px', fontWeight: 700, color: '#1e0646', fontSize: 14 }}>{GHS(f.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ background: '#1e0646', color: '#fff', padding: '10px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total from School System</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#fbbf24' }}>{GHS((feeStructures as any[]).reduce((s: number, f: any) => s + Number(f.amount), 0))}</span>
          </div>
        </div>
      )}

      {/* Bill groups */}
      {Object.entries(grouped).map(([cat, catItems]) => {
        if (!catItems.length) return null
        const meta = CATEGORY_META[cat as BillCategory]
        const Icon = meta.icon
        const subtotal = catItems.reduce((s, i) => !i.is_optional ? s + Number(i.amount) : s, 0)
        return (
          <div key={cat} style={{ marginBottom: 20, border: '1.5px solid #e5e7eb', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '12px 18px', background: `${meta.color}0f`, borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon size={16} color={meta.color} />
              <span style={{ fontWeight: 700, fontSize: 14, color: meta.color }}>{meta.label}</span>
              <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 700, color: '#374151' }}>
                {GHS(subtotal)} (compulsory)
              </span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Item Name', 'Description', 'Amount', 'Optional', ''].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {catItems.map((item: any) => (
                  <tr key={item.id} style={{ borderTop: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 14 }}>{item.item_name}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280' }}>{item.description || '—'}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#1e0646', fontSize: 14 }}>{GHS(item.amount)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {item.is_optional
                        ? <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700, background: '#fef3c7', padding: '2px 8px', borderRadius: 99 }}>Optional</span>
                        : <span style={{ fontSize: 11, color: '#10b981', fontWeight: 700, background: '#d1fae5', padding: '2px 8px', borderRadius: 99 }}>Required</span>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => openEdit(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6' }}><Edit3 size={15} /></button>
                        <button onClick={() => deleteMutation.mutate(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}

      {!items.length && (
        <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>
          <DollarSign size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p style={{ fontSize: 15, fontWeight: 600 }}>No bill items yet. Add items to build the fee schedule.</p>
        </div>
      )}

      <ScholarshipsSection schoolId={schoolId} />

      {showForm && (
        <Modal title={editing ? 'Edit Bill Item' : 'Add Bill Item'} onClose={() => { setShowForm(false); setEditing(null) }}>
          <Field label="Category" required>
            <select style={selectStyle} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value as BillCategory }))}>
              {Object.entries(CATEGORY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </Field>
          <Field label="Item Name" required>
            <input style={inputStyle} value={form.item_name || ''} onChange={e => setForm(p => ({ ...p, item_name: e.target.value }))} placeholder="e.g. Mathematics Textbook" />
          </Field>
          <Field label="Description">
            <input style={inputStyle} value={form.description || ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional details" />
          </Field>
          <Field label="Amount (GH₵)" required>
            <input type="number" style={inputStyle} value={form.amount || ''} onChange={e => setForm(p => ({ ...p, amount: Number(e.target.value) }))} placeholder="0.00" />
          </Field>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <input type="checkbox" id="opt" checked={!!form.is_optional} onChange={e => setForm(p => ({ ...p, is_optional: e.target.checked }))} style={{ width: 16, height: 16 }} />
            <label htmlFor="opt" style={{ fontSize: 14, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>Mark as Optional</label>
          </div>
          <button
            onClick={() => saveMutation.mutate(form as BillItem)}
            disabled={saveMutation.isPending || !form.item_name}
            style={{ width: '100%', padding: '12px', background: '#1e0646', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: 'pointer', opacity: saveMutation.isPending ? 0.7 : 1 }}>
            {saveMutation.isPending ? 'Saving…' : editing ? 'Update Item' : 'Add Item'}
          </button>
        </Modal>
      )}
    </div>
  )
}

function ScholarshipsSection({ schoolId }: { schoolId: string }) {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Partial<Scholarship>>({ type: 'partial' })

  const { data: scholarships = [] } = useQuery({
    queryKey: ['scholarships', schoolId],
    queryFn: async () => { const { data } = await scholarshipsService.list(schoolId); return data || [] }
  })

  const saveMutation = useMutation({
    mutationFn: (s: Scholarship) => scholarshipsService.upsert({ ...s, school_id: schoolId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['scholarships'] }); setShowForm(false); setForm({ type: 'partial' }) }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => scholarshipsService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scholarships'] })
  })

  return (
    <div style={{ marginTop: 32, border: '1.5px solid #10b98133', borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', background: '#10b9810f', borderBottom: '1px solid #10b98122', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Gift size={16} color="#10b981" />
          <span style={{ fontWeight: 700, fontSize: 14, color: '#10b981' }}>Scholarships & Bursaries</span>
        </div>
        <button onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 12 }}>
          <Plus size={14} /> Add
        </button>
      </div>
      {scholarships.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: '#6b7280', fontSize: 14 }}>No scholarships configured</div>}
      {scholarships.map((s: any) => (
        <div key={s.id} style={{ padding: '14px 18px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{s.name}</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{s.description}</div>
          </div>
          <span style={{ padding: '3px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: s.type === 'full' ? '#d1fae5' : '#fef3c7', color: s.type === 'full' ? '#059669' : '#d97706' }}>
            {s.type === 'full' ? 'Full' : `${s.discount_pct}% Off`}
          </span>
          <button onClick={() => deleteMutation.mutate(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={15} /></button>
        </div>
      ))}

      {showForm && (
        <Modal title="Add Scholarship" onClose={() => setShowForm(false)}>
          <Field label="Scholarship Name" required>
            <input style={inputStyle} value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Academic Excellence Award" />
          </Field>
          <Field label="Type" required>
            <select style={selectStyle} value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as any }))}>
              <option value="full">Full Scholarship (100% waiver)</option>
              <option value="partial">Partial Scholarship</option>
            </select>
          </Field>
          {form.type === 'partial' && (
            <Field label="Discount Percentage (%)">
              <input type="number" style={inputStyle} value={form.discount_pct || ''} onChange={e => setForm(p => ({ ...p, discount_pct: Number(e.target.value) }))} placeholder="e.g. 50" min={1} max={99} />
            </Field>
          )}
          <Field label="Description">
            <textarea style={{ ...inputStyle, height: 72, resize: 'vertical' }} value={form.description || ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Eligibility criteria..." />
          </Field>
          <button onClick={() => saveMutation.mutate(form as Scholarship)} disabled={!form.name} style={{ width: '100%', padding: 12, background: '#10b981', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
            Save Scholarship
          </button>
        </Modal>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  TAB 2 – ENQUIRIES TRACKER  (unchanged internals)
// ═══════════════════════════════════════════════════════════════

function EnquiriesTab({ schoolId, classes, academicYears }: any) {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<EnquiryStatus | ''>('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<Partial<AdmissionEnquiry>>({ status: 'enquiry', dismissed_from_prev: false })

  const { data: enquiries = [] } = useQuery({
    queryKey: ['enquiries', schoolId, statusFilter],
    queryFn: async () => { const { data } = await enquiriesService.list(schoolId, statusFilter ? { status: statusFilter as EnquiryStatus } : {}); return data || [] }
  })

  const { data: scholarships = [] } = useQuery({
    queryKey: ['scholarships', schoolId],
    queryFn: async () => { const { data } = await scholarshipsService.list(schoolId); return data || [] }
  })

  const saveMutation = useMutation({
    mutationFn: (d: AdmissionEnquiry) => {
      // Strip Supabase join artefacts (classes, scholarships) — not real DB columns
      const { classes: _c, scholarships: _s, ...safe } = d as any
      return editing
        ? enquiriesService.update(editing.id, safe)
        : enquiriesService.create({ ...safe, school_id: schoolId })
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['enquiries'] }); setShowForm(false); setEditing(null); setForm({ status: 'enquiry' }) }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => enquiriesService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['enquiries'] })
  })

  const filtered = enquiries.filter((e: any) =>
    !search || e.student_name?.toLowerCase().includes(search.toLowerCase()) || e.parent_name?.toLowerCase().includes(search.toLowerCase()) || e.parent_phone?.includes(search)
  )

  const openEdit = (e: any) => { setEditing(e); setForm(e); setShowForm(true) }

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { status: '', label: 'All', count: enquiries.length, color: '#1e0646' },
          { status: 'enquiry', label: 'Enquiries', count: enquiries.filter((e: any) => e.status === 'enquiry').length, color: '#6b7280' },
          { status: 'applied', label: 'Applied', count: enquiries.filter((e: any) => e.status === 'applied').length, color: '#f59e0b' },
          { status: 'admitted', label: 'Admitted', count: enquiries.filter((e: any) => e.status === 'admitted').length, color: '#10b981' },
          { status: 'rejected', label: 'Rejected', count: enquiries.filter((e: any) => e.status === 'rejected').length, color: '#ef4444' },
        ].map(s => (
          <button key={s.status} onClick={() => setStatusFilter(s.status as any)}
            style={{ flex: 1, minWidth: 110, padding: '12px 10px', borderRadius: 14, border: `2px solid ${statusFilter === s.status ? s.color : '#e5e7eb'}`, background: statusFilter === s.status ? `${s.color}11` : '#fff', cursor: 'pointer', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginTop: 2 }}>{s.label}</div>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input style={{ ...inputStyle, paddingLeft: 36 }} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, parent or phone…" />
        </div>
        <button onClick={() => { setEditing(null); setForm({ status: 'enquiry', dismissed_from_prev: false }); setShowForm(true) }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', background: '#1e0646', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
          <UserPlus size={16} /> Add Enquiry
        </button>
      </div>

      <div style={{ border: '1.5px solid #e5e7eb', borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {['Student', 'Parent / Contact', 'Class Applied', 'Source Info', 'Status', ''].map(h => (
                <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((e: any) => (
              <tr key={e.id} style={{ borderTop: '1px solid #f0f0f0' }}>
                <td style={{ padding: '13px 14px' }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{e.student_name}</div>
                  {e.date_of_birth && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{e.date_of_birth}</div>}
                  {e.dismissed_from_prev && <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 700, background: '#fef2f2', padding: '1px 6px', borderRadius: 99, marginTop: 3, display: 'inline-block' }}>⚠ Dismissed</span>}
                </td>
                <td style={{ padding: '13px 14px' }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{e.parent_name}</div>
                  <div style={{ fontSize: 12, color: '#3b82f6', marginTop: 2 }}>{e.parent_phone}</div>
                  {e.parent_email && <div style={{ fontSize: 11, color: '#6b7280' }}>{e.parent_email}</div>}
                </td>
                <td style={{ padding: '13px 14px', fontSize: 13, fontWeight: 600 }}>{e.classes?.name || '—'}</td>
                <td style={{ padding: '13px 14px', fontSize: 12, color: '#6b7280' }}>
                  {e.previous_school ? <div>Prev: {e.previous_school}</div> : null}
                  {e.scholarships?.name ? <div style={{ color: '#10b981', fontWeight: 600 }}>🎓 {e.scholarships.name}</div> : null}
                </td>
                <td style={{ padding: '13px 14px' }}><StatusBadge status={e.status} /></td>
                <td style={{ padding: '13px 14px' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => openEdit(e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6' }}><Edit3 size={15} /></button>
                    <button onClick={() => deleteMutation.mutate(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && <div style={{ padding: 48, textAlign: 'center', color: '#6b7280' }}>No records match your search.</div>}
      </div>

      {showForm && (
        <Modal title={editing ? 'Edit Enquiry' : 'Record Admission Enquiry'} onClose={() => { setShowForm(false); setEditing(null) }} wide>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
            <div><Field label="Student Full Name" required><input style={inputStyle} value={form.student_name || ''} onChange={e => setForm(p => ({ ...p, student_name: e.target.value }))} /></Field></div>
            <div><Field label="Date of Birth"><input type="date" style={inputStyle} value={form.date_of_birth || ''} onChange={e => setForm(p => ({ ...p, date_of_birth: e.target.value }))} /></Field></div>
            <div><Field label="Gender">
              <select style={selectStyle} value={form.gender || ''} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}>
                <option value="">Select</option>
                <option>male</option><option>female</option>
              </select>
            </Field></div>
            <div><Field label="Class Applying For">
              <select style={selectStyle} value={form.applying_class_id || ''} onChange={e => setForm(p => ({ ...p, applying_class_id: e.target.value }))}>
                <option value="">Select class</option>
                {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field></div>
            <div style={{ gridColumn: '1/-1', borderTop: '1.5px dashed #e5e7eb', paddingTop: 16, marginTop: 4 }}>
              <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Parent / Guardian</p>
            </div>
            <div><Field label="Parent/Guardian Name" required><input style={inputStyle} value={form.parent_name || ''} onChange={e => setForm(p => ({ ...p, parent_name: e.target.value }))} /></Field></div>
            <div><Field label="Phone Number" required><input style={inputStyle} value={form.parent_phone || ''} onChange={e => setForm(p => ({ ...p, parent_phone: e.target.value }))} /></Field></div>
            <div><Field label="Email"><input style={inputStyle} value={form.parent_email || ''} onChange={e => setForm(p => ({ ...p, parent_email: e.target.value }))} /></Field></div>
            <div><Field label="Address"><input style={inputStyle} value={form.parent_address || ''} onChange={e => setForm(p => ({ ...p, parent_address: e.target.value }))} /></Field></div>
            <div style={{ gridColumn: '1/-1', borderTop: '1.5px dashed #e5e7eb', paddingTop: 16, marginTop: 4 }}>
              <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Previous School</p>
            </div>
            <div><Field label="Previous School Name"><input style={inputStyle} value={form.previous_school || ''} onChange={e => setForm(p => ({ ...p, previous_school: e.target.value }))} /></Field></div>
            <div><Field label="Reason for Leaving"><input style={inputStyle} value={form.reason_for_leaving || ''} onChange={e => setForm(p => ({ ...p, reason_for_leaving: e.target.value }))} /></Field></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, gridColumn: '1/-1', marginBottom: 16 }}>
              <input type="checkbox" id="dismissed" checked={!!form.dismissed_from_prev} onChange={e => setForm(p => ({ ...p, dismissed_from_prev: e.target.checked }))} />
              <label htmlFor="dismissed" style={{ fontSize: 14, fontWeight: 600, color: '#ef4444', cursor: 'pointer' }}>⚠ Student was dismissed from previous school</label>
            </div>
            <div><Field label="Scholarship">
              <select style={selectStyle} value={form.scholarship_id || ''} onChange={e => setForm(p => ({ ...p, scholarship_id: e.target.value || null }))}>
                <option value="">None</option>
                {scholarships.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.type})</option>)}
              </select>
            </Field></div>
            <div><Field label="Status">
              <select style={selectStyle} value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as any }))}>
                <option value="enquiry">Enquiry</option>
                <option value="applied">Applied</option>
                <option value="admitted">Admitted</option>
                <option value="rejected">Rejected</option>
                <option value="waitlisted">Waitlisted</option>
              </select>
            </Field></div>
            <div style={{ gridColumn: '1/-1' }}><Field label="Notes"><textarea style={{ ...inputStyle, height: 72, resize: 'vertical' }} value={form.notes || ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></Field></div>
          </div>
          <button onClick={() => saveMutation.mutate(form as AdmissionEnquiry)} disabled={saveMutation.isPending || !form.student_name || !form.parent_name || !form.parent_phone}
            style={{ width: '100%', padding: 13, background: '#1e0646', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: 'pointer', marginTop: 8 }}>
            {saveMutation.isPending ? 'Saving…' : editing ? 'Update Enquiry' : 'Save Enquiry'}
          </button>
        </Modal>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  TAB 3 – ADMISSION FORM
// ═══════════════════════════════════════════════════════════════

function AdmissionFormTab({ schoolId, classes, academicYears, school }: any) {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [viewApp, setViewApp] = useState<any>(null)
  const [form, setForm] = useState<Partial<AdmissionApplication>>({ status: 'pending' })

  const { data: applications = [] } = useQuery({
    queryKey: ['applications', schoolId],
    queryFn: async () => { const { data } = await applicationsService.list(schoolId); return data || [] }
  })

  const { data: scholarships = [] } = useQuery({
    queryKey: ['scholarships', schoolId],
    queryFn: async () => { const { data } = await scholarshipsService.list(schoolId); return data || [] }
  })

  const saveMutation = useMutation({
    mutationFn: (d: AdmissionApplication) => {
      // Strip Supabase join artefacts (classes, scholarships) — not real DB columns
      const { classes: _c, scholarships: _s, ...safe } = d as any
      return editing
        ? applicationsService.update(editing.id, safe)
        : applicationsService.create({ ...safe, school_id: schoolId })
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['applications'] }); setShowForm(false); setEditing(null); setForm({ status: 'pending' }) }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => applicationsService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications'] })
  })

  const openEdit = (a: any) => { setEditing(a); setForm(a); setShowForm(true) }

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <button onClick={() => printBlankAdmissionForm(school)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#1e0646', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
          <Printer size={16} /> Print Blank Admission Form
        </button>
        <button onClick={() => { setEditing(null); setForm({ status: 'pending' }); setShowForm(true) }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
          <Plus size={16} /> Record Application
        </button>
      </div>

      <div style={{ border: '1.5px solid #e5e7eb', borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {['App No', 'Student Name', 'Class', 'Status', 'Date', 'Actions'].map(h => (
                <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {applications.map((a: any) => (
              <tr key={a.id} style={{ borderTop: '1px solid #f0f0f0' }}>
                <td style={{ padding: '12px 14px', fontWeight: 700, fontSize: 13, color: '#1e0646' }}>{a.application_no}</td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{a.student_first_name} {a.student_last_name}</div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>{a.gender}</div>
                </td>
                <td style={{ padding: '12px 14px', fontSize: 13 }}>{a.classes?.name || '—'}</td>
                <td style={{ padding: '12px 14px' }}><StatusBadge status={a.status} /></td>
                <td style={{ padding: '12px 14px', fontSize: 12, color: '#6b7280' }}>{new Date(a.created_at).toLocaleDateString()}</td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setViewApp(a)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#10b981' }}><Eye size={15} /></button>
                    <button onClick={() => printApplicationForm(a, school)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f59e0b' }}><Printer size={15} /></button>
                    <button onClick={() => openEdit(a)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6' }}><Edit3 size={15} /></button>
                    <button onClick={() => deleteMutation.mutate(a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!applications.length && <div style={{ padding: 48, textAlign: 'center', color: '#6b7280' }}>No applications recorded yet.</div>}
      </div>

      {showForm && (
        <Modal title={editing ? 'Edit Application' : 'Record Admission Application'} onClose={() => { setShowForm(false); setEditing(null) }} wide>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
            <SectionHeader>Student Information</SectionHeader>
            <div><Field label="First Name" required><input style={inputStyle} value={form.student_first_name || ''} onChange={e => setForm(p => ({ ...p, student_first_name: e.target.value }))} /></Field></div>
            <div><Field label="Last Name" required><input style={inputStyle} value={form.student_last_name || ''} onChange={e => setForm(p => ({ ...p, student_last_name: e.target.value }))} /></Field></div>
            <div><Field label="Date of Birth"><input type="date" style={inputStyle} value={form.date_of_birth || ''} onChange={e => setForm(p => ({ ...p, date_of_birth: e.target.value }))} /></Field></div>
            <div><Field label="Gender">
              <select style={selectStyle} value={form.gender || ''} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}>
                <option value="">Select</option><option>male</option><option>female</option>
              </select>
            </Field></div>
            <div><Field label="Nationality"><input style={inputStyle} value={form.nationality || ''} onChange={e => setForm(p => ({ ...p, nationality: e.target.value }))} /></Field></div>
            <div><Field label="Religion"><input style={inputStyle} value={form.religion || ''} onChange={e => setForm(p => ({ ...p, religion: e.target.value }))} /></Field></div>
            <div><Field label="Class Applying For">
              <select style={selectStyle} value={form.applying_class_id || ''} onChange={e => setForm(p => ({ ...p, applying_class_id: e.target.value }))}>
                <option value="">Select</option>
                {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field></div>
            <div><Field label="Blood Group"><input style={inputStyle} value={form.blood_group || ''} onChange={e => setForm(p => ({ ...p, blood_group: e.target.value }))} /></Field></div>
            <SectionHeader>Father's Details</SectionHeader>
            <div><Field label="Father's Name"><input style={inputStyle} value={form.father_name || ''} onChange={e => setForm(p => ({ ...p, father_name: e.target.value }))} /></Field></div>
            <div><Field label="Phone"><input style={inputStyle} value={form.father_phone || ''} onChange={e => setForm(p => ({ ...p, father_phone: e.target.value }))} /></Field></div>
            <div><Field label="Email"><input style={inputStyle} value={form.father_email || ''} onChange={e => setForm(p => ({ ...p, father_email: e.target.value }))} /></Field></div>
            <div><Field label="Occupation"><input style={inputStyle} value={form.father_occupation || ''} onChange={e => setForm(p => ({ ...p, father_occupation: e.target.value }))} /></Field></div>
            <SectionHeader>Mother's Details</SectionHeader>
            <div><Field label="Mother's Name"><input style={inputStyle} value={form.mother_name || ''} onChange={e => setForm(p => ({ ...p, mother_name: e.target.value }))} /></Field></div>
            <div><Field label="Phone"><input style={inputStyle} value={form.mother_phone || ''} onChange={e => setForm(p => ({ ...p, mother_phone: e.target.value }))} /></Field></div>
            <div><Field label="Email"><input style={inputStyle} value={form.mother_email || ''} onChange={e => setForm(p => ({ ...p, mother_email: e.target.value }))} /></Field></div>
            <div><Field label="Occupation"><input style={inputStyle} value={form.mother_occupation || ''} onChange={e => setForm(p => ({ ...p, mother_occupation: e.target.value }))} /></Field></div>
            <SectionHeader>Previous School</SectionHeader>
            <div><Field label="School Name"><input style={inputStyle} value={form.previous_school || ''} onChange={e => setForm(p => ({ ...p, previous_school: e.target.value }))} /></Field></div>
            <div><Field label="Previous Class"><input style={inputStyle} value={form.previous_class || ''} onChange={e => setForm(p => ({ ...p, previous_class: e.target.value }))} /></Field></div>
            <div style={{ gridColumn: '1/-1' }}><Field label="Home Address"><input style={inputStyle} value={form.home_address || ''} onChange={e => setForm(p => ({ ...p, home_address: e.target.value }))} /></Field></div>
            <div style={{ gridColumn: '1/-1' }}><Field label="Medical Notes / Allergies"><textarea style={{ ...inputStyle, height: 60, resize: 'vertical' }} value={form.allergies || ''} onChange={e => setForm(p => ({ ...p, allergies: e.target.value }))} /></Field></div>
            <div><Field label="Scholarship">
              <select style={selectStyle} value={form.scholarship_id || ''} onChange={e => setForm(p => ({ ...p, scholarship_id: e.target.value || null }))}>
                <option value="">None</option>
                {scholarships.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field></div>
            <div><Field label="Application Status">
              <select style={selectStyle} value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as any }))}>
                <option value="pending">Pending</option>
                <option value="reviewing">Reviewing</option>
                <option value="admitted">Admitted</option>
                <option value="rejected">Rejected</option>
                <option value="deferred">Deferred</option>
              </select>
            </Field></div>
          </div>
          <button onClick={() => saveMutation.mutate(form as AdmissionApplication)}
            disabled={saveMutation.isPending || !form.student_first_name || !form.student_last_name}
            style={{ width: '100%', padding: 13, background: '#1e0646', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: 'pointer', marginTop: 8 }}>
            {saveMutation.isPending ? 'Saving…' : editing ? 'Update Application' : 'Save Application'}
          </button>
        </Modal>
      )}

      {viewApp && (
        <Modal title={`Application — ${viewApp.application_no}`} onClose={() => setViewApp(null)} wide>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              ['Student', `${viewApp.student_first_name} ${viewApp.student_last_name}`],
              ['Class', viewApp.classes?.name || '—'],
              ['Gender', viewApp.gender || '—'],
              ['DOB', viewApp.date_of_birth || '—'],
              ['Father', viewApp.father_name || '—'],
              ['Father Phone', viewApp.father_phone || '—'],
              ['Mother', viewApp.mother_name || '—'],
              ['Mother Phone', viewApp.mother_phone || '—'],
              ['Previous School', viewApp.previous_school || '—'],
              ['Blood Group', viewApp.blood_group || '—'],
              ['Scholarship', viewApp.scholarships?.name || 'None'],
              ['Status', viewApp.status],
            ].map(([k, v]) => (
              <div key={k} style={{ background: '#f9fafb', borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 }}>{k}</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{v}</div>
              </div>
            ))}
          </div>
          <button onClick={() => printApplicationForm(viewApp, school)} style={{ marginTop: 20, width: '100%', padding: 12, background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
            <Printer size={16} style={{ display: 'inline', marginRight: 8 }} /> Print This Application
          </button>
        </Modal>
      )}
    </div>
  )
}

function SectionHeader({ children }: any) {
  return (
    <div style={{ gridColumn: '1/-1', borderTop: '1.5px dashed #e5e7eb', paddingTop: 16, marginTop: 8, marginBottom: 4 }}>
      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>{children}</p>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  TAB 4 – TEXTBOOKS & STATIONERY
// ═══════════════════════════════════════════════════════════════

function SuppliesTab({ schoolId, selClass, selYear, onClassChange, onYearChange, classes, academicYears, onShowToast, onSwitchToBills, school, feeStructures = [] }: any) {
  const { user } = useAuth()
  const isBursar = user?.role === 'bursar'
  const canManage = isBursar // Only bursar can add/edit/delete
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<Partial<SchoolSupply>>({
    category: 'textbook', quantity: 1, unit: 'copy', is_required: true
  })

  const { data: allSupplies = [] } = useQuery({
    queryKey: ['supplies', schoolId, selClass, selYear],
    queryFn: async () => {
      if (!selClass) {
        const { data } = await suppliesService.listAll(schoolId, selYear || null)
        return data || []
      }
      const { data } = await suppliesService.listForClass(schoolId, selClass, selYear || null)
      return data || []
    },
    enabled: !!schoolId
  })

  // Cross-tab: fetch bills to show in banner
  const { data: billsForBanner = [] } = useQuery({
    queryKey: ['bills', schoolId, selClass, selYear],
    queryFn: async () => {
      if (!selClass) return []
      const { data } = await billsService.listForClass(schoolId, selClass, selYear || null)
      return data || []
    }
  })

  const { data: scholarships = [] } = useQuery({
    queryKey: ['scholarships', schoolId],
    queryFn: async () => { const { data } = await scholarshipsService.list(schoolId); return data || [] }
  })

  const saveMutation = useMutation({
    mutationFn: (item: SchoolSupply) => {
      // Strip Supabase join artifacts — `classes` is not a real column in school_supplies
      // Sending it causes the row update to fail silently (unknown column error)
      const { classes: _c, ...safeItem } = item as any
      const payload: Partial<SchoolSupply> = {
        ...safeItem,
        unit_price: item.unit_price != null ? Number(item.unit_price) : null,
        quantity: Number(item.quantity) || 1,
        school_id: schoolId,
        class_id: item.id ? item.class_id : (item.class_id || selClass || null),
        academic_year_id: item.id ? item.academic_year_id : (item.academic_year_id || selYear || null),
      }
      return suppliesService.upsert([payload as SchoolSupply])
    },
    onSuccess: async () => {
      await Promise.all([
        qc.refetchQueries({ queryKey: ['supplies'] }),
        qc.refetchQueries({ queryKey: ['bills'] })
      ])
      setShowForm(false)
      setEditing(null)
      setForm({ category: 'textbook', quantity: 1, unit: 'copy', is_required: true })
      onShowToast('Supply list updated successfully')
    },
    onError: (err) => {
      console.error('Save failed:', err)
      onShowToast('Could not save item. Check connection or permissions.', 'error')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => suppliesService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supplies'] })
      qc.invalidateQueries({ queryKey: ['bills'] })
    }
  })

  const openEdit = (item: any) => { setEditing(item); setForm(item); setShowForm(true) }

  const grouped = Object.keys(SUPPLY_CATEGORY_META).reduce((acc, cat) => {
    acc[cat] = allSupplies.filter((i: any) => i.category === cat)
    return acc
  }, {} as Record<string, any[]>)

  const estimatedTotal = allSupplies.reduce((s: number, i: any) =>
    i.is_required && i.unit_price ? s + (Number(i.unit_price) * Number(i.quantity)) : s, 0)

  const billsTotal = (billsForBanner as any[]).reduce((s, i) => !i.is_optional ? s + Number(i.amount) : s, 0)

  const classCounts = classes.map((c: any) => ({
    ...c,
    count: allSupplies.filter((i: any) => i.class_id === c.id).length
  }))

  return (
    <div>
      <FilterBar
        classes={classes}
        academicYears={academicYears}
        selClass={selClass}
        selYear={selYear}
        onClassChange={onClassChange}
        onYearChange={onYearChange}
        rightSlot={
          <>
            {canManage && (
              <button
                onClick={() => { setEditing(null); setForm({ category: 'textbook', quantity: 1, unit: 'copy', is_required: true }); setShowForm(true) }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', background: '#1e0646', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
              >
                <Plus size={16} /> Add Item
              </button>
            )}
            <button
              onClick={() => {
                const className = selClass ? classes.find((c: any) => c.id === selClass)?.name : undefined
                const yearName = selYear ? academicYears.find((y: any) => y.id === selYear)?.name : undefined
                printWelcomePack({
                  bills: billsForBanner as any[],
                  supplies: allSupplies,
                  scholarships,
                  feeStructures: feeStructures as any[],
                  className: className || 'All Classes',
                  billTotal: billsTotal,
                  suppliesEstimate: estimatedTotal,
                  school,
                })
              }}
              disabled={!allSupplies.length && !(billsForBanner as any[]).length}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: 13, opacity: (allSupplies.length || (billsForBanner as any[]).length) ? 1 : 0.5 }}
            >
              <Printer size={16} /> Print Welcome Pack
            </button>
          </>
        }
      />

      {/* Cross-tab bills banner */}
      <CrossTabBanner
        mode="supplies-showing-bills"
        otherTotal={billsTotal}
        otherCount={(billsForBanner as any[]).length}
        selClass={selClass}
        classes={classes}
        onSwitchTab={onSwitchToBills}
      />

      {/* Summary cards */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Supply Items', value: allSupplies.length, color: '#1e0646' },
          { label: 'Required', value: allSupplies.filter((i: any) => i.is_required).length, color: '#10b981' },
          { label: 'Optional', value: allSupplies.filter((i: any) => !i.is_required).length, color: '#f59e0b' },
          { label: 'Est. Supplies Cost', value: estimatedTotal > 0 ? GHS(estimatedTotal) : '—', color: '#3b82f6' },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, minWidth: 140, background: '#fafafa', border: '1.5px solid #e5e7eb', borderRadius: 14, padding: '14px 18px' }}>
            <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Per-class quick nav */}
      {!selClass && classCounts.filter((c: any) => c.count > 0).length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {classCounts.filter((c: any) => c.count > 0).map((c: any) => (
            <button
              key={c.id}
              onClick={() => onClassChange(c.id)}
              style={{ padding: '6px 14px', borderRadius: 99, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#374151' }}
            >
              {c.name} <span style={{ color: '#3b82f6', marginLeft: 4 }}>{c.count}</span>
            </button>
          ))}
        </div>
      )}

      {Object.entries(grouped).map(([cat, catItems]) => {
        if (!catItems.length) return null
        const meta = SUPPLY_CATEGORY_META[cat]
        const Icon = meta.icon
        return (
          <div key={cat} style={{ marginBottom: 20, border: '1.5px solid #e5e7eb', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '12px 18px', background: `${meta.color}0f`, borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon size={16} color={meta.color} />
              <span style={{ fontWeight: 700, fontSize: 14, color: meta.color }}>{meta.label}</span>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: '#6b7280', fontWeight: 600 }}>
                {catItems.length} item{catItems.length !== 1 ? 's' : ''}
              </span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Item', 'Class', 'Qty & Unit', 'Est. Price', 'Notes', 'Required', ''].map(h => (
                    <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {catItems.map((item: any) => (
                  <tr key={item.id} style={{ borderTop: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{item.item_name}</div>
                      {item.description && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{item.description}</div>}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 13 }}>
                      {item.classes?.name
                        ? <span style={{ background: '#eff6ff', color: '#2563eb', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>{item.classes.name}</span>
                        : <span style={{ color: '#9ca3af', fontSize: 12 }}>All classes</span>}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 14, fontWeight: 600 }}>{item.quantity} {item.unit}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13 }}>
                      {(item.unit_price !== null && item.unit_price !== undefined) ? GHS(item.unit_price) : <span style={{ color: '#d1d5db' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: '#6b7280', maxWidth: 180 }}>{item.supplier_note || '—'}</td>
                    <td style={{ padding: '12px 14px' }}>
                      {item.is_required
                        ? <span style={{ fontSize: 11, color: '#10b981', fontWeight: 700, background: '#d1fae5', padding: '2px 8px', borderRadius: 99 }}>Required</span>
                        : <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700, background: '#fef3c7', padding: '2px 8px', borderRadius: 99 }}>Optional</span>}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {canManage && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => openEdit(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6' }}><Edit3 size={15} /></button>
                          <button onClick={() => deleteMutation.mutate(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={15} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}

      {!allSupplies.length && (
        <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>
          <BookOpen size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p style={{ fontSize: 15, fontWeight: 600 }}>No items yet. Add textbooks and stationery for each class.</p>
          <p style={{ fontSize: 13, marginTop: 6, color: '#9ca3af' }}>Select a class above and start adding items to generate a parent packing list.</p>
        </div>
      )}

      {showForm && (
        <Modal title={editing ? 'Edit Supply Item' : 'Add Textbook / Stationery'} onClose={() => { setShowForm(false); setEditing(null) }} wide>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
            <div>
              <Field label="Category" required>
                <select style={selectStyle} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value as any }))}>
                  {Object.entries(SUPPLY_CATEGORY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </Field>
            </div>
            <div>
              <Field label="Class">
                <select style={selectStyle} value={form.class_id || selClass || ''} onChange={e => setForm(p => ({ ...p, class_id: e.target.value || null }))}>
                  <option value="">All Classes (school-wide)</option>
                  {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <Field label="Item Name" required>
                <input style={inputStyle} value={form.item_name || ''} onChange={e => setForm(p => ({ ...p, item_name: e.target.value }))} placeholder="e.g. New General Mathematics Textbook (WAEC Approved)" />
              </Field>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <Field label="Description / Edition / ISBN">
                <input style={inputStyle} value={form.description || ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="e.g. 3rd Edition, by Asante & Mensah — must be new copy" />
              </Field>
            </div>
            <div>
              <Field label="Quantity" required>
                <input type="number" style={inputStyle} value={form.quantity ?? 1} min={1} onChange={e => setForm(p => ({ ...p, quantity: Number(e.target.value) }))} />
              </Field>
            </div>
            <div>
              <Field label="Unit" required>
                <select style={selectStyle} value={form.unit || 'copy'} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}>
                  <option value="copy">copy</option>
                  <option value="piece">piece</option>
                  <option value="set">set</option>
                  <option value="pair">pair</option>
                  <option value="ream">ream</option>
                  <option value="pack">pack</option>
                  <option value="box">box</option>
                  <option value="roll">roll</option>
                  <option value="bottle">bottle</option>
                </select>
              </Field>
            </div>
            <div>
              <Field label="Estimated Unit Price (GH₵)">
                <input type="number" style={inputStyle} value={form.unit_price ?? ''} onChange={e => setForm(p => ({ ...p, unit_price: e.target.value ? Number(e.target.value) : null }))} placeholder="Optional — shown on parent list" />
              </Field>
            </div>
            <div>
              <Field label="Where to Buy / Supplier Note">
                <input style={inputStyle} value={form.supplier_note || ''} onChange={e => setForm(p => ({ ...p, supplier_note: e.target.value }))} placeholder="e.g. Available at school bookstore" />
              </Field>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, marginTop: 4 }}>
            <input type="checkbox" id="required-supply" checked={!!form.is_required} onChange={e => setForm(p => ({ ...p, is_required: e.target.checked }))} style={{ width: 16, height: 16 }} />
            <label htmlFor="required-supply" style={{ fontSize: 14, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>Mark as Required (bold on parent list)</label>
          </div>
          <button onClick={() => saveMutation.mutate(form as SchoolSupply)} disabled={saveMutation.isPending || !form.item_name || !form.quantity}
            style={{ width: '100%', padding: '12px', background: '#1e0646', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
            {saveMutation.isPending ? 'Saving…' : editing ? 'Update Item' : 'Add to List'}
          </button>
        </Modal>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  COMBINED WELCOME PACK PRINT
//  Replaces the old separate printBills + printPackingList
//  Produces one document: Cover → Fees → Supplies → Scholarships → Signature
// ═══════════════════════════════════════════════════════════════

interface WelcomePackOptions {
  bills: any[]
  supplies: any[]
  scholarships: any[]
  feeStructures?: any[]
  className: string
  billTotal: number
  suppliesEstimate: number
  school?: any
}

function printWelcomePack({ bills, supplies, scholarships, feeStructures = [], className, billTotal, suppliesEstimate, school }: WelcomePackOptions) {
  const date = new Date().toLocaleDateString('en-GH', { day: '2-digit', month: 'long', year: 'numeric' })
  const schoolName = school?.name || 'School Portal'
  const logoHtml = school?.logo_url
    ? `<img src="${school.logo_url}" alt="Logo" style="height:64px;width:64px;object-fit:contain;border-radius:12px;background:#fff;padding:4px;flex-shrink:0;"/>`
    : `<div style="height:64px;width:64px;border-radius:12px;background:rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0;">🎓</div>`

  // Group bills by category
  const billGroups = Object.keys(CATEGORY_META).reduce((acc, cat) => {
    const items = bills.filter(i => i.category === cat)
    if (items.length) acc[cat] = items
    return acc
  }, {} as Record<string, any[]>)

  // Group supplies by category
  const supplyGroups = Object.keys(SUPPLY_CATEGORY_META).reduce((acc, cat) => {
    const items = supplies.filter(i => i.category === cat)
    if (items.length) acc[cat] = items
    return acc
  }, {} as Record<string, any[]>)

  const catColors: Record<string, string> = {
    textbook: '#1d4ed8', stationery: '#6d28d9', uniform: '#b45309', other: '#4b5563',
    books: '#3b82f6', admission_fee: '#f59e0b', scholarship: '#10b981'
  }

  const html = `<!DOCTYPE html><html><head>
  <meta charset="UTF-8">
  <title>Admissions Welcome Pack – ${className}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@700&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'DM Sans',sans-serif;color:#111827;background:#fff;padding:20px 24px;font-size:12px;line-height:1.4}

    /* ── Cover strip ── */
    .cover{background:linear-gradient(135deg,#1e0646 0%,#4c1d95 60%,#1e0646 100%);color:#fff;padding:16px 22px;border-radius:12px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between}
    .cover-left .school{font-family:'Playfair Display',serif;font-size:22px;letter-spacing:0.02em}
    .cover-left .doc-title{font-size:14px;font-weight:800;color:#fbbf24;text-transform:uppercase;letter-spacing:0.1em;margin-top:3px}
    .cover-left .meta{font-size:11px;color:#c4b5fd;margin-top:3px}
    .cover-badge{background:rgba(255,255,255,0.12);border:2px solid rgba(255,255,255,0.25);border-radius:10px;padding:10px 16px;text-align:center;min-width:120px}
    .cover-badge .amount{font-size:20px;font-weight:800;color:#fbbf24}
    .cover-badge .label{font-size:9px;color:#c4b5fd;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin-top:2px}

    /* ── Notice ── */
    .notice{background:#fffbeb;border:1.5px solid #fde68a;border-radius:8px;padding:7px 14px;margin-bottom:12px;font-size:11px;color:#92400e;line-height:1.6}

    /* ── Section headings ── */
    .section-title{font-family:'Playfair Display',serif;font-size:14px;color:#1e0646;border-bottom:2px solid #1e0646;padding-bottom:4px;margin:14px 0 8px}
    .category-bar{display:flex;align-items:center;justify-content:space-between;padding:5px 10px;border-radius:6px 6px 0 0;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em}

    /* ── Tables ── */
    table{width:100%;border-collapse:collapse;border:1px solid #e5e7eb;margin-bottom:8px}
    th{background:#f3f4f6;padding:5px 9px;text-align:left;font-size:9px;font-weight:700;text-transform:uppercase;color:#6b7280;letter-spacing:0.05em}
    td{padding:5px 9px;border-bottom:1px solid #f3f4f6;vertical-align:top}
    tr:last-child td{border-bottom:none}
    .amount-cell{text-align:right;font-weight:700}
    .badge-opt{font-size:9px;background:#fef3c7;color:#d97706;font-weight:700;padding:1px 6px;border-radius:99px}
    .badge-req{font-size:9px;background:#d1fae5;color:#059669;font-weight:700;padding:1px 6px;border-radius:99px}
    .item-name-bold{font-weight:700}
    .item-desc{font-size:10px;color:#6b7280;margin-top:1px;font-style:italic}
    .opt-tag{display:inline-block;font-size:9px;background:#fef3c7;color:#d97706;font-weight:700;padding:1px 5px;border-radius:99px;margin-left:4px;vertical-align:middle}
    .checkbox{width:14px;height:14px;border:1.5px solid #9ca3af;border-radius:3px;display:inline-block;margin:0 auto}

    /* ── Totals ── */
    .total-block{background:#1e0646;color:#fff;padding:8px 14px;border-radius:0 0 8px 8px;display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
    .total-block .label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#a5b4fc}
    .total-block .value{font-size:17px;font-weight:800;color:#fbbf24}

    /* ── Scholarships ── */
    .scholar-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:14px}
    .scholar-card{border:1.5px solid #10b98133;border-radius:8px;padding:8px 12px;background:#f0fdf4}
    .scholar-name{font-weight:700;font-size:12px;color:#065f46}
    .scholar-type{display:inline-block;padding:1px 8px;border-radius:99px;font-size:9px;font-weight:700;margin-top:3px}

    /* ── Signature ── */
    .sig-section{margin-top:18px;border-top:2px dashed #e5e7eb;padding-top:14px}
    .sig-notice{font-size:11px;color:#374151;line-height:1.6;margin-bottom:12px}
    .sig-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
    .sig-line{border-top:1.5px solid #374151;padding-top:5px;font-size:9px;font-weight:700;text-transform:uppercase;color:#6b7280;text-align:center;margin-top:30px}

    /* ── Divider ── */
    .page-break{page-break-after:always}
    @media print{body{padding:12px 16px}.page-break{page-break-after:always}}
  </style>
  </head><body>

  <!-- COVER -->
  <div class="cover">
    <div style="display:flex;align-items:center;gap:18px;flex:1">
      ${logoHtml}
      <div class="cover-left">
        <div class="school">${schoolName}</div>
        ${school?.motto ? `<div style="font-size:10px;color:#c4b5fd;margin-top:2px;font-style:italic;">&ldquo;${school.motto}&rdquo;</div>` : ''}
        ${school?.address ? `<div style="font-size:10px;color:#c4b5fd;margin-top:2px;">📍 ${school.address}</div>` : ''}
        <div class="doc-title" style="margin-top:6px;">🎓 Admissions Welcome Pack</div>
        <div class="meta">Class: <strong>${className}</strong> &nbsp;|&nbsp; Printed: ${date}</div>
      </div>
    </div>
    <div style="display:flex;gap:16px">
      ${billTotal > 0 ? `<div class="cover-badge">
        <div class="amount">${GHS(billTotal)}</div>
        <div class="label">School Fees</div>
      </div>` : ''}
      ${suppliesEstimate > 0 ? `<div class="cover-badge">
        <div class="amount">${GHS(suppliesEstimate)}</div>
        <div class="label">Est. Supplies</div>
      </div>` : ''}
    </div>
  </div>

  <div class="notice">
    <strong>Dear Parent / Guardian,</strong><br>
    This Welcome Pack contains everything you need to prepare your child for the new academic year.
    It includes the <strong>school fee schedule</strong>, a <strong>stationery & supplies packing list</strong>,
    and information on available <strong>scholarships</strong>.
    Please read carefully, purchase all <strong>required</strong> items and settle fees before the first day.
    Contact the school office if you have any questions.
  </div>

  <!-- PRE-SECTION: SCHOOL FEE STRUCTURE (if any) -->
  ${feeStructures.length ? `
  <div class="section-title">📊 School Fee Structure <span style="font-size:12px;font-weight:500;color:#6b7280;font-family:'DM Sans',sans-serif">(Synced from School System)</span></div>
  <table>
    <thead><tr>
      <th>Fee Name</th><th>Term</th><th>Class Scope</th><th style="text-align:right">Amount</th>
    </tr></thead>
    <tbody>
      ${feeStructures.map((f: any) => `<tr>
        <td><strong>${f.fee_name}</strong></td>
        <td style="color:#6b7280;font-size:12px">${f.term?.name || '—'}</td>
        <td>${f.class_id ? `<span style="background:#dbeafe;color:#1d4ed8;font-size:10px;font-weight:700;padding:2px 7px;border-radius:99px">${f.class?.name || 'Class-specific'}</span>` : '<span style="color:#9ca3af;font-size:11px">All Classes</span>'}</td>
        <td class="amount-cell">GH&#x20B5; ${Number(f.amount).toFixed(2)}</td>
      </tr>`).join('')}
    </tbody>
  </table>
  <div class="total-block" style="border-radius:0 0 10px 10px;margin-bottom:28px">
    <span class="label">Total School Fees</span>
    <span class="value">GH&#x20B5; ${feeStructures.reduce((s: number, f: any) => s + Number(f.amount), 0).toFixed(2)}</span>
  </div>
  ` : ''}

  <!-- SECTION 1: FEE SCHEDULE -->
  ${bills.length ? `
  <div class="section-title">📋 Part 1 — School Fee Schedule</div>

  ${Object.entries(billGroups).map(([cat, catItems]) => {
    const meta = CATEGORY_META[cat as BillCategory]
    const subtotal = catItems.reduce((s, i) => !i.is_optional ? s + Number(i.amount) : s, 0)
    const color = catColors[cat] || '#374151'
    return `
    <div class="category-bar" style="background:${color}18;color:${color}">
      <span>${meta.label}</span>
      <span>Compulsory subtotal: GH₵ ${subtotal.toFixed(2)}</span>
    </div>
    <table>
      <thead><tr><th>Item</th><th>Description</th><th style="text-align:right">Amount</th><th>Type</th></tr></thead>
      <tbody>
        ${catItems.map(i => `<tr>
          <td><strong>${i.item_name}</strong></td>
          <td style="color:#6b7280;font-size:12px">${i.description || ''}</td>
          <td class="amount-cell">GH₵ ${Number(i.amount).toFixed(2)}</td>
          <td>${i.is_optional ? '<span class="badge-opt">Optional</span>' : '<span class="badge-req">Required</span>'}</td>
        </tr>`).join('')}
      </tbody>
    </table>`
  }).join('')}

  <div class="total-block">
    <span class="label">Total Compulsory School Fees</span>
    <span class="value">GH₵ ${billTotal.toFixed(2)}</span>
  </div>
  ` : `<div class="notice" style="margin-top:8px">No fee schedule has been configured for ${className} yet.</div>`}

  <!-- SECTION 2: SUPPLIES PACKING LIST -->
  ${supplies.length ? `
  <div class="page-break"></div>
  <div class="section-title">📚 Part 2 — Textbooks & Supplies Packing List</div>
  <p style="font-size:12px;color:#374151;margin-bottom:16px;line-height:1.8">
    Please purchase all <strong>required</strong> items and label them with your child's <strong>full name and class</strong> before the first day.
    Tick the <strong>Got it ✓</strong> column as you gather each item.
  </p>

  ${Object.entries(supplyGroups).map(([cat, catItems]) => {
    const meta = SUPPLY_CATEGORY_META[cat]
    const color = catColors[cat] || '#374151'
    return `
    <div class="category-bar" style="background:${color}18;color:${color};border-left:4px solid ${color}">
      <span>${meta.label}</span>
      <span>${catItems.length} item${catItems.length !== 1 ? 's' : ''}</span>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width:30px">#</th>
          <th>Item</th>
          <th style="width:90px;text-align:center">Qty</th>
          <th style="width:110px;text-align:right">Est. Price</th>
          <th>Where to Buy</th>
          <th style="width:70px;text-align:center">Got it ✓</th>
        </tr>
      </thead>
      <tbody>
        ${catItems.map((item, idx) => `<tr>
          <td style="color:#9ca3af;font-size:11px;text-align:center">${idx + 1}</td>
          <td>
            <div class="${item.is_required ? 'item-name-bold' : ''}">${item.item_name}${!item.is_required ? '<span class="opt-tag">optional</span>' : ''}</div>
            ${item.description ? `<div class="item-desc">${item.description}</div>` : ''}
          </td>
          <td style="text-align:center;font-weight:700">${item.quantity} ${item.unit}</td>
          <td style="text-align:right;font-weight:${item.unit_price ? '700' : '400'};color:#374151">
            ${item.unit_price ? `GH₵ ${Number(item.unit_price).toFixed(2)}` : '<span style="color:#d1d5db">—</span>'}
          </td>
          <td style="font-size:11px;color:#6b7280">${item.supplier_note || ''}</td>
          <td style="text-align:center"><div class="checkbox"></div></td>
        </tr>`).join('')}
      </tbody>
    </table>`
  }).join('')}

  ${suppliesEstimate > 0 ? `<div class="total-block">
    <span class="label">Estimated Supplies Total (required items only)</span>
    <span class="value">GH₵ ${suppliesEstimate.toFixed(2)}</span>
  </div>` : ''}
  ` : ''}

  <!-- SECTION 3: SCHOLARSHIPS -->
  ${scholarships.length ? `
  <div class="section-title">🎓 Part 3 — Available Scholarships & Bursaries</div>
  <p style="font-size:12px;color:#374151;margin-bottom:14px">Contact the admissions office to apply for any of the following scholarships.</p>
  <div class="scholar-grid">
    ${scholarships.map((s: any) => `<div class="scholar-card">
      <div class="scholar-name">${s.name}</div>
      ${s.description ? `<div style="font-size:11px;color:#374151;margin-top:4px">${s.description}</div>` : ''}
      <span class="scholar-type" style="background:${s.type === 'full' ? '#d1fae5' : '#fef3c7'};color:${s.type === 'full' ? '#059669' : '#d97706'}">
        ${s.type === 'full' ? 'Full Scholarship (100%)' : `Partial — ${s.discount_pct}% Discount`}
      </span>
    </div>`).join('')}
  </div>
  ` : ''}

  <!-- SIGNATURE -->
  <div class="sig-section">
    <p class="sig-notice">
      I/We, the undersigned parent(s)/guardian(s), confirm that I/we have received and read this Admissions Welcome Pack
      for <strong>${className}</strong>. I/We commit to purchasing all required items and paying the applicable fees
      before the commencement of the academic year.
    </p>
    <div class="sig-grid">
      <div><div class="sig-line">Parent / Guardian Name</div></div>
      <div><div class="sig-line">Signature</div></div>
      <div><div class="sig-line">Date</div></div>
    </div>
    <div style="margin-top:32px;text-align:center;font-size:10px;color:#9ca3af">
      ${schoolName} &nbsp;|&nbsp; Admissions Office &nbsp;|&nbsp; Printed ${date}
    </div>
  </div>

  <script>window.onload = () => window.print()</script>
  </body></html>`

  const w = window.open('', '_blank')
  if (w) { w.document.write(html); w.document.close() }
}

// ── Keep original print helpers for the other tabs ────────────

function printBlankAdmissionForm(school: any) {
  const html = `<!DOCTYPE html><html><head><title>Admission Application Form</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'DM Sans',sans-serif;color:#1a1a2e;background:#fff;padding:32px;font-size:13px}
    .header{text-align:center;padding-bottom:18px;border-bottom:3px double #1e0646;margin-bottom:24px}
    .school-name{font-family:'Playfair Display',serif;font-size:26px;color:#1e0646}
    .form-title{font-size:15px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#f59e0b;margin:6px 0 4px}
    .notice{font-size:11px;color:#6b7280}
    .section{margin-bottom:18px}
    .section-title{font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#fff;background:#1e0646;padding:5px 12px;border-radius:4px;margin-bottom:12px;display:inline-block}
    .grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px 20px}
    .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px 20px}
    .field{margin-bottom:10px}
    .field-label{font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:4px;letter-spacing:0.05em}
    .field-line{border-bottom:1.5px solid #374151;min-height:24px;margin-top:2px}
    .field-box{border:1.5px solid #d1d5db;border-radius:4px;min-height:52px;margin-top:2px}
    .photo-box{width:110px;height:140px;border:1.5px solid #374151;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:10px;color:#9ca3af;text-align:center;padding:8px}
    .header-row{display:flex;justify-content:space-between;align-items:flex-start}
    .checkbox-row{display:flex;gap:24px;margin-top:4px}
    .checkbox-item{display:flex;align-items:center;gap:6px;font-size:12px}
    .cb{width:14px;height:14px;border:1.5px solid #374151;display:inline-block}
    .footer{margin-top:32px;padding-top:16px;border-top:2px solid #e5e7eb}
    .sig-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-top:28px}
    .sig-line2{border-top:1.5px solid #374151;padding-top:6px;font-size:10px;color:#6b7280;font-weight:700;text-transform:uppercase;margin-top:36px;text-align:center}
    .office-use{border:1.5px dashed #9ca3af;border-radius:8px;padding:14px;margin-top:24px}
    .office-title{font-size:10px;font-weight:800;text-transform:uppercase;color:#9ca3af;margin-bottom:10px;letter-spacing:0.1em}
    @media print{body{padding:16px}}
  </style></head><body>
  <div class="header">
    ${school?.logo_url ? `<img src="${school.logo_url}" alt="Logo" style="height:72px;width:72px;object-fit:contain;border-radius:10px;margin-bottom:8px;"/>` : ''}
    <div class="school-name">${school?.name || 'School Name'}</div>
    ${school?.motto ? `<div style="font-size:11px;color:#6b7280;font-style:italic;margin-top:2px;">&ldquo;${school.motto}&rdquo;</div>` : ''}
    ${school?.address ? `<div style="font-size:10px;color:#6b7280;margin:2px 0 6px;">📍 ${school.address} ${school?.phone ? `&nbsp;|&nbsp; 📞 ${school.phone}` : ''}</div>` : ''}
    <div class="form-title">Admission Application Form</div>
    <div class="notice">Please complete all sections clearly in BLOCK LETTERS &nbsp;|&nbsp; Academic Year: ___________________</div>
  </div>
  <div class="section">
    <span class="section-title">Student Personal Information</span>
    <div class="header-row">
      <div style="flex:1;margin-right:24px">
        <div class="grid2">
          <div class="field"><div class="field-label">Surname</div><div class="field-line"></div></div>
          <div class="field"><div class="field-label">Other Names</div><div class="field-line"></div></div>
          <div class="field"><div class="field-label">Date of Birth</div><div class="field-line"></div></div>
          <div class="field"><div class="field-label">Place of Birth</div><div class="field-line"></div></div>
          <div class="field"><div class="field-label">Nationality</div><div class="field-line"></div></div>
          <div class="field"><div class="field-label">Religion</div><div class="field-line"></div></div>
          <div class="field"><div class="field-label">Blood Group</div><div class="field-line"></div></div>
          <div class="field"><div class="field-label">Class Applying For</div><div class="field-line"></div></div>
        </div>
        <div class="field" style="margin-top:4px"><div class="field-label">Gender</div>
          <div class="checkbox-row"><div class="checkbox-item"><span class="cb"></span> Male</div><div class="checkbox-item"><span class="cb"></span> Female</div></div>
        </div>
      </div>
      <div class="photo-box">Passport<br/>Photo<br/>(Recent)</div>
    </div>
  </div>
  <div class="section">
    <span class="section-title">Previous School Record</span>
    <div class="grid2">
      <div class="field"><div class="field-label">Name of Previous School</div><div class="field-line"></div></div>
      <div class="field"><div class="field-label">Class Last Attended</div><div class="field-line"></div></div>
      <div class="field"><div class="field-label">Reason for Leaving</div><div class="field-line"></div></div>
      <div class="field"><div class="field-label">Last Report Card Grade / Remarks</div><div class="field-line"></div></div>
    </div>
    <div class="field" style="margin-top:6px"><div class="field-label">Was student dismissed / expelled from previous school?</div>
      <div class="checkbox-row" style="margin-top:6px"><div class="checkbox-item"><span class="cb"></span> Yes (provide details below)</div><div class="checkbox-item"><span class="cb"></span> No</div></div>
    </div>
    <div class="field" style="margin-top:8px"><div class="field-label">Details (if yes)</div><div class="field-box"></div></div>
  </div>
  <div class="section">
    <span class="section-title">Father's Details</span>
    <div class="grid3">
      <div class="field"><div class="field-label">Full Name</div><div class="field-line"></div></div>
      <div class="field"><div class="field-label">Occupation</div><div class="field-line"></div></div>
      <div class="field"><div class="field-label">Phone Number</div><div class="field-line"></div></div>
      <div class="field"><div class="field-label">Email Address</div><div class="field-line"></div></div>
      <div class="field"><div class="field-label">Employer / Business</div><div class="field-line"></div></div>
      <div class="field"><div class="field-label">WhatsApp Number</div><div class="field-line"></div></div>
    </div>
  </div>
  <div class="section">
    <span class="section-title">Mother's Details</span>
    <div class="grid3">
      <div class="field"><div class="field-label">Full Name</div><div class="field-line"></div></div>
      <div class="field"><div class="field-label">Occupation</div><div class="field-line"></div></div>
      <div class="field"><div class="field-label">Phone Number</div><div class="field-line"></div></div>
      <div class="field"><div class="field-label">Email Address</div><div class="field-line"></div></div>
      <div class="field"><div class="field-label">Employer / Business</div><div class="field-line"></div></div>
      <div class="field"><div class="field-label">WhatsApp Number</div><div class="field-line"></div></div>
    </div>
  </div>
  <div class="section">
    <span class="section-title">Emergency Contact / Guardian</span>
    <div class="grid3">
      <div class="field"><div class="field-label">Full Name</div><div class="field-line"></div></div>
      <div class="field"><div class="field-label">Relationship</div><div class="field-line"></div></div>
      <div class="field"><div class="field-label">Phone Number</div><div class="field-line"></div></div>
    </div>
    <div class="field"><div class="field-label">Home Address</div><div class="field-line"></div></div>
  </div>
  <div class="section">
    <span class="section-title">Medical Information</span>
    <div class="grid2">
      <div class="field"><div class="field-label">Known Allergies</div><div class="field-box" style="min-height:40px"></div></div>
      <div class="field"><div class="field-label">Current Medications / Conditions</div><div class="field-box" style="min-height:40px"></div></div>
    </div>
  </div>
  <div class="section">
    <span class="section-title">Scholarship / Bursary Request</span>
    <div class="checkbox-row" style="margin-bottom:10px">
      <div class="checkbox-item"><span class="cb"></span> Not applying</div>
      <div class="checkbox-item"><span class="cb"></span> Full Scholarship</div>
      <div class="checkbox-item"><span class="cb"></span> Partial Scholarship</div>
    </div>
    <div class="field"><div class="field-label">Reason / Basis</div><div class="field-box"></div></div>
  </div>
  <div class="footer">
    <p style="font-size:11px;color:#374151;line-height:1.7">I/We confirm the information provided is accurate and complete. I/We agree to abide by the school's rules and regulations.</p>
    <div class="sig-grid">
      <div><div class="sig-line2">Father's Signature & Date</div></div>
      <div><div class="sig-line2">Mother's Signature & Date</div></div>
      <div><div class="sig-line2">Guardian's Signature & Date</div></div>
    </div>
  </div>
  <div class="office-use">
    <div class="office-title">⬛ For Office Use Only</div>
    <div class="grid3">
      <div class="field"><div class="field-label">Application No.</div><div class="field-line"></div></div>
      <div class="field"><div class="field-label">Date Received</div><div class="field-line"></div></div>
      <div class="field"><div class="field-label">Received By</div><div class="field-line"></div></div>
      <div class="field"><div class="field-label">Admission Status</div><div class="field-line"></div></div>
      <div class="field"><div class="field-label">Admission Date</div><div class="field-line"></div></div>
      <div class="field"><div class="field-label">Student ID Assigned</div><div class="field-line"></div></div>
    </div>
  </div>
  <script>window.onload = () => window.print()</script>
  </body></html>`
  const w = window.open('', '_blank')
  if (w) { w.document.write(html); w.document.close() }
}

function printApplicationForm(app: any, school: any) {
  const html = `<!DOCTYPE html><html><head><title>Application – ${app.application_no}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'DM Sans',sans-serif;color:#1a1a2e;padding:32px;font-size:13px}
    .header{text-align:center;border-bottom:3px solid #1e0646;padding-bottom:16px;margin-bottom:24px}
    .school-name{font-family:'Playfair Display',serif;font-size:24px;color:#1e0646}
    .badge{display:inline-block;padding:3px 14px;border-radius:99px;font-size:12px;font-weight:700;background:#d1fae5;color:#059669;margin-top:4px}
    .app-no{font-size:12px;color:#6b7280;margin-top:4px}
    .grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px 24px}
    .section-title{font-size:10px;font-weight:800;text-transform:uppercase;color:#fff;background:#1e0646;padding:4px 10px;border-radius:4px;display:inline-block;margin:14px 0 10px;letter-spacing:0.1em}
    .kv{background:#f9fafb;border-radius:8px;padding:10px 14px}
    .kv-label{font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;margin-bottom:3px}
    .kv-value{font-size:14px;font-weight:600}
    @media print{body{padding:16px}}
  </style></head><body>
  <div class="header">
    ${school?.logo_url ? `<img src="${school.logo_url}" alt="Logo" style="height:72px;width:72px;object-fit:contain;border-radius:10px;margin-bottom:8px;"/>` : ''}
    <div class="school-name">${school?.name || 'School Portal'}</div>
    ${school?.motto ? `<div style="font-size:11px;color:#6b7280;font-style:italic;margin-top:2px;">&ldquo;${school.motto}&rdquo;</div>` : ''}
    ${school?.address ? `<div style="font-size:10px;color:#6b7280;margin:2px 0 6px;">📍 ${school.address}</div>` : ''}
    <div class="badge">Admission Application</div>
    <div class="app-no">Ref: ${app.application_no} &nbsp;|&nbsp; ${new Date(app.created_at).toLocaleDateString('en-GH', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
  </div>
  <span class="section-title">Student</span>
  <div class="grid2">
    ${[['Full Name', `${app.student_first_name} ${app.student_last_name}`], ['Date of Birth', app.date_of_birth || '—'], ['Gender', app.gender || '—'], ['Nationality', app.nationality || '—'], ['Religion', app.religion || '—'], ['Blood Group', app.blood_group || '—'], ['Class Applying', app.classes?.name || '—'], ['Status', app.status]].map(([k, v]) => `<div class="kv"><div class="kv-label">${k}</div><div class="kv-value">${v}</div></div>`).join('')}
  </div>
  <span class="section-title">Parents</span>
  <div class="grid2">
    ${[["Father's Name", app.father_name || '—'], ["Father's Phone", app.father_phone || '—'], ["Mother's Name", app.mother_name || '—'], ["Mother's Phone", app.mother_phone || '—'], ['Home Address', app.home_address || '—'], ['Scholarship', app.scholarships?.name || 'None']].map(([k, v]) => `<div class="kv"><div class="kv-label">${k}</div><div class="kv-value">${v}</div></div>`).join('')}
  </div>
  ${app.previous_school ? `<span class="section-title">Previous School</span><div class="grid2"><div class="kv"><div class="kv-label">School</div><div class="kv-value">${app.previous_school}</div></div><div class="kv"><div class="kv-label">Class</div><div class="kv-value">${app.previous_class || '—'}</div></div></div>` : ''}
  ${app.allergies ? `<span class="section-title">Medical</span><div class="kv"><div class="kv-label">Notes</div><div class="kv-value">${app.allergies}</div></div>` : ''}
  <script>window.onload = () => window.print()</script>
  </body></html>`
  const w = window.open('', '_blank')
  if (w) { w.document.write(html); w.document.close() }
}

// ═══════════════════════════════════════════════════════════════
//  MAIN PAGE COMPONENT
//  Shared state for class/year filters + tab switching
// ═══════════════════════════════════════════════════════════════

const TABS = [
  { id: 'bills', label: 'Fee Schedule & Bills', icon: DollarSign },
  { id: 'enquiries', label: 'Admission Enquiries', icon: Users },
  { id: 'forms', label: 'Application Forms', icon: FileText },
  { id: 'supplies', label: 'Textbooks & Stationery', icon: BookOpen },
]

export default function AdminAdmissions() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('bills')

  // ── Shared filter state (Bills ↔ Supplies) ────────────────
  const [sharedClass, setSharedClass] = useState<string>('')
  const [sharedYear, setSharedYear] = useState<string>('')
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now()
    setToasts(p => [...p, { id, message, type }])
  }
  const removeToast = (id: number) => setToasts(p => p.filter(t => t.id !== id))

  const schoolId = (user as any)?.school_id || user?.school?.id

  const { data: classes = [] } = useQuery({
    queryKey: ['classes', schoolId],
    queryFn: async () => { const { data } = await supabase.from('classes').select('id,name').eq('school_id', schoolId).order('name'); return data || [] },
    enabled: !!schoolId
  })

  const { data: academicYears = [] } = useQuery({
    queryKey: ['academic_years', schoolId],
    queryFn: async () => { const { data } = await supabase.from('academic_years').select('id,name').eq('school_id', schoolId).order('name', { ascending: false }); return data || [] },
    enabled: !!schoolId
  })

  const school = (user as any)?.school

  // ── Fee Structures from Bursar System — auto-synced display ──
  // Fetches ALL fee_structures for the school filtered by selected class
  // (class-specific + school-wide where class_id IS NULL)
  const { data: feeStructures = [] } = useQuery({
    queryKey: ['fee_structures_admissions', schoolId, sharedClass],
    queryFn: async () => {
      let q = supabase
        .from('fee_structures')
        .select('*, term:terms(id,name,academic_year_id), class:classes(id,name)')
        .eq('school_id', schoolId)
        .order('term_id')
        .order('fee_name')
      if (sharedClass) {
        q = q.or(`class_id.eq.${sharedClass},class_id.is.null`)
      }
      const { data } = await q
      return data || []
    },
    enabled: !!schoolId
  })

  // ── Quick-print data — uses SAME query keys as the tabs so
  //    cache invalidations from add/delete mutations update these too.
  const { data: quickBills = [] } = useQuery({
    queryKey: ['bills', schoolId, sharedClass, sharedYear],
    queryFn: async () => {
      if (!sharedClass) {
        const { data } = await billsService.list(schoolId, null, sharedYear || null)
        return data || []
      }
      // Single query: class-specific bills UNION school-wide (class_id IS NULL)
      const { data } = await billsService.listForClass(schoolId, sharedClass, sharedYear || null)
      return data || []
    },
    enabled: !!schoolId
  })

  const { data: quickSupplies = [] } = useQuery({
    queryKey: ['supplies', schoolId, sharedClass, sharedYear],
    queryFn: async () => {
      if (!sharedClass) {
        const { data } = await suppliesService.listAll(schoolId, sharedYear || null)
        return data || []
      }
      // Single query: class-specific supplies UNION school-wide (class_id IS NULL)
      const { data } = await suppliesService.listForClass(schoolId, sharedClass, sharedYear || null)
      return data || []
    },
    enabled: !!schoolId
  })

  const { data: quickScholarships = [] } = useQuery({
    queryKey: ['scholarships', schoolId],
    queryFn: async () => { const { data } = await scholarshipsService.list(schoolId); return data || [] },
    enabled: !!schoolId
  })

  const quickBillTotal = (quickBills as any[]).reduce((s: number, i: any) => !i.is_optional ? s + Number(i.amount) : s, 0)
  const quickSuppliesEstimate = (quickSupplies as any[]).reduce((s: number, i: any) =>
    i.is_required && i.unit_price ? s + (Number(i.unit_price) * Number(i.quantity)) : s, 0)
  const selectedClassName = sharedClass
    ? (classes as any[]).find((c: any) => c.id === sharedClass)?.name || ''
    : ''

  return (
    <div style={{ padding: '28px 32px', fontFamily: '"DM Sans", system-ui, sans-serif', maxWidth: 1200, margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#1e0646,#5b21b6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={24} color="#fbbf24" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#1e0646' }}>Admissions Office</h1>
            <p style={{ margin: '3px 0 0', fontSize: 13, color: '#6b7280' }}>Manage fee schedules, enquiries, scholarships and application forms</p>
          </div>
        </div>
      </div>

      {/* ── Quick Print Panel ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1e0646 0%, #4c1d95 100%)',
        borderRadius: 18, padding: '20px 24px', marginBottom: 28,
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16
      }}>
        {/* Class/Year selector */}
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#c4b5fd', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Select Class to Print
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <select
              value={sharedClass}
              onChange={e => setSharedClass(e.target.value)}
              style={{
                padding: '9px 14px', borderRadius: 10, border: '2px solid rgba(196,181,253,0.4)',
                background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: 14,
                fontWeight: 600, cursor: 'pointer', outline: 'none', minWidth: 180, fontFamily: 'inherit'
              }}
            >
              <option value="" style={{ color: '#1e0646' }}>— All Classes —</option>
              {(classes as any[]).map((c: any) => (
                <option key={c.id} value={c.id} style={{ color: '#1e0646' }}>{c.name}</option>
              ))}
            </select>
            <select
              value={sharedYear}
              onChange={e => setSharedYear(e.target.value)}
              style={{
                padding: '9px 14px', borderRadius: 10, border: '2px solid rgba(196,181,253,0.4)',
                background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: 13,
                fontWeight: 600, cursor: 'pointer', outline: 'none', minWidth: 140, fontFamily: 'inherit'
              }}
            >
              <option value="" style={{ color: '#1e0646' }}>All Years</option>
              {(academicYears as any[]).map((y: any) => (
                <option key={y.id} value={y.id} style={{ color: '#1e0646' }}>{y.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats pills for selected class */}
        {sharedClass && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: '8px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fbbf24' }}>{(quickBills as any[]).length}</div>
              <div style={{ fontSize: 10, color: '#c4b5fd', fontWeight: 700, textTransform: 'uppercase' }}>Fee Items</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: '8px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fbbf24' }}>{(quickSupplies as any[]).length}</div>
              <div style={{ fontSize: 10, color: '#c4b5fd', fontWeight: 700, textTransform: 'uppercase' }}>Supply Items</div>
            </div>
            {quickBillTotal > 0 && (
              <div style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 10, padding: '8px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#fbbf24' }}>{GHS(quickBillTotal)}</div>
                <div style={{ fontSize: 10, color: '#c4b5fd', fontWeight: 700, textTransform: 'uppercase' }}>Total Fees</div>
              </div>
            )}
          </div>
        )}

        {/* Print action buttons */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginLeft: 'auto' }}>
          <button
            onClick={() => printWelcomePack({
              bills: quickBills as any[],
              supplies: quickSupplies as any[],
              scholarships: quickScholarships as any[],
              feeStructures: feeStructures as any[],
              className: selectedClassName || 'All Classes',
              billTotal: quickBillTotal,
              suppliesEstimate: quickSuppliesEstimate,
              school,
            })}
            disabled={!(quickBills as any[]).length && !(quickSupplies as any[]).length}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '11px 20px', borderRadius: 12, border: 'none',
              background: '#fbbf24', color: '#1e0646', fontWeight: 800,
              fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
              opacity: (!(quickBills as any[]).length && !(quickSupplies as any[]).length) ? 0.5 : 1,
              boxShadow: '0 4px 12px rgba(251,191,36,0.3)',
            }}
          >
            <BookOpen size={16} />
            Print Booklist{selectedClassName ? ` — ${selectedClassName}` : ''}
          </button>
          <button
            onClick={() => printBlankAdmissionForm(school)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '11px 20px', borderRadius: 12,
              border: '2px solid rgba(196,181,253,0.5)',
              background: 'rgba(255,255,255,0.08)', color: '#fff', fontWeight: 700,
              fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <FileText size={16} /> Print Blank Admission Form
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: '#f3f4f6', padding: 5, borderRadius: 14, marginBottom: 28, width: 'fit-content', flexWrap: 'wrap' }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontWeight: 600, fontSize: 13, transition: 'all 0.2s',
              background: activeTab === id ? '#fff' : 'transparent',
              color: activeTab === id ? '#1e0646' : '#6b7280',
              boxShadow: activeTab === id ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
            }}>
            <Icon size={16} color={activeTab === id ? '#f59e0b' : '#9ca3af'} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'bills' && (
        <BillsTab
          schoolId={schoolId}
          classes={classes}
          academicYears={academicYears}
          selClass={sharedClass}
          selYear={sharedYear}
          onClassChange={setSharedClass}
          onYearChange={setSharedYear}
          onShowToast={showToast}
          onSwitchToSupplies={() => setActiveTab('supplies')}
          school={school}
          feeStructures={feeStructures}
        />
      )}
      {activeTab === 'enquiries' && (
        <EnquiriesTab schoolId={schoolId} classes={classes} academicYears={academicYears} />
      )}
      {activeTab === 'forms' && (
        <AdmissionFormTab schoolId={schoolId} classes={classes} academicYears={academicYears} school={school} />
      )}
      {activeTab === 'supplies' && (
        <SuppliesTab
          schoolId={schoolId}
          classes={classes}
          academicYears={academicYears}
          selClass={sharedClass}
          selYear={sharedYear}
          onClassChange={setSharedClass}
          onYearChange={setSharedYear}
          onShowToast={showToast}
          onSwitchToBills={() => setActiveTab('bills')}
          school={school}
          feeStructures={feeStructures}
        />
      )}

      {/* ── Toast Notification Container ── */}
      <div style={{
        position: 'fixed', bottom: 24, right: 24,
        display: 'flex', flexDirection: 'column', gap: 10, zIndex: 1100
      }}>
        {toasts.map(t => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </div>
  )
}