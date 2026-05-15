// src/pages/admin/SuperAdminSchoolsPage.tsx
// Full school management page for super_admin role.
// Replaces the previous Navigate redirect at /super-admin/schools.
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import PageHeader from '../../components/layout/PageHeader'
import { Building2, CheckCircle, XCircle, Clock, Search, Edit2, Save, X, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: JSX.Element }> = {
  active:    { bg: '#f0fdf4', text: '#16a34a', icon: <CheckCircle size={13} /> },
  suspended: { bg: '#fef2f2', text: '#dc2626', icon: <XCircle size={13} /> },
  pending:   { bg: '#fffbeb', text: '#d97706', icon: <Clock size={13} /> },
}

interface School {
  id: string
  name: string
  email: string
  phone?: string
  status: string
  currency_code?: string
  storage_used_bytes?: number
  storage_limit_gb?: number
  created_at: string
}

interface EditForm {
  name: string
  email: string
  status: string
  currency_code: string
  storage_limit_gb: number
}

function bytesToGb(bytes: number) {
  return (bytes / (1024 ** 3)).toFixed(2)
}

export default function SuperAdminSchoolsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditForm | null>(null)

  const { data: schools = [], isLoading, refetch } = useQuery({
    queryKey: ['super-admin-schools'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schools')
        .select('id, name, email, phone, status, currency_code, storage_used_bytes, storage_limit_gb, created_at')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as School[]
    },
  })

  const { data: invoices = [] } = useQuery({
    queryKey: ['super-admin-pending-invoices'],
    queryFn: async () => {
      const { data } = await supabase
        .from('school_invoices')
        .select('*, school:schools(id, name)')
        .eq('status', 'requested_approval')
        .order('created_at', { ascending: false })
      return data ?? []
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, form }: { id: string; form: EditForm }) => {
      const { error } = await supabase.from('schools').update({
        name: form.name,
        email: form.email,
        status: form.status,
        currency_code: form.currency_code,
        storage_limit_gb: form.storage_limit_gb,
      }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('School updated ✓')
      qc.invalidateQueries({ queryKey: ['super-admin-schools'] })
      setEditingId(null)
      setEditForm(null)
    },
    onError: (e: any) => toast.error(e.message ?? 'Failed to update school'),
  })

  const approveInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const { error } = await supabase.from('school_invoices').update({ status: 'paid' }).eq('id', invoiceId)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Invoice approved ✓')
      qc.invalidateQueries({ queryKey: ['super-admin-pending-invoices'] })
    },
    onError: (e: any) => toast.error(e.message ?? 'Failed'),
  })

  function startEdit(s: School) {
    setEditingId(s.id)
    setEditForm({
      name: s.name,
      email: s.email ?? '',
      status: s.status ?? 'active',
      currency_code: s.currency_code ?? 'GHS',
      storage_limit_gb: s.storage_limit_gb ?? 5,
    })
  }

  const filtered = schools.filter(s => {
    const matchStatus = statusFilter === 'all' || s.status === statusFilter
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.email?.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1300, margin: '0 auto' }}>
      <PageHeader
        title="School Management"
        subtitle={`${schools.length} schools registered on the platform`}
        icon={Building2}
        color="#7c3aed"
      />

      {/* Pending Invoices */}
      {invoices.length > 0 && (
        <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: 16, padding: 24, marginBottom: 28 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#92400e', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={18} /> {invoices.length} Pending Invoice Approval{invoices.length > 1 ? 's' : ''}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {invoices.map((inv: any) => (
              <div key={inv.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderRadius: 12, padding: '14px 20px', border: '1px solid #fde68a' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#1e293b' }}>{inv.school?.name ?? 'Unknown School'}</div>
                  <div style={{ fontSize: 12, color: '#92400e', marginTop: 2 }}>
                    {inv.plan_name ?? 'Subscription'} · GH₵ {Number(inv.amount_ghc ?? 0).toLocaleString()} · {new Date(inv.created_at).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => approveInvoiceMutation.mutate(inv.id)}
                  disabled={approveInvoiceMutation.isPending}
                  style={{ padding: '8px 18px', borderRadius: 10, background: '#16a34a', color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                >
                  ✓ Approve
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
          <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search schools by name or email…"
            style={{ width: '100%', padding: '11px 14px 11px 38px', borderRadius: 12, border: '1px solid #e5e7eb', background: '#f9fafb', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '11px 16px', borderRadius: 12, border: '1px solid #e5e7eb', background: '#f9fafb', fontSize: 14, outline: 'none' }}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="suspended">Suspended</option>
        </select>
        <button
          onClick={() => refetch()}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 18px', borderRadius: 12, border: '1px solid #e5e7eb', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#374151' }}
        >
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Schools Table */}
      <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', overflow: 'hidden', border: '1px solid #f1f5f9' }}>
        {isLoading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>Loading schools…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <Building2 size={48} color="#d1d5db" style={{ margin: '0 auto 16px', display: 'block' }} />
            <p style={{ color: '#94a3b8' }}>No schools match your search.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['School', 'Status', 'Currency', 'Storage', 'Created', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '14px 20px', fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => {
                  const statusStyle = STATUS_COLORS[s.status ?? 'pending'] ?? STATUS_COLORS.pending
                  const isEditing = editingId === s.id
                  const usedGb = s.storage_used_bytes ? Number(bytesToGb(s.storage_used_bytes)) : 0
                  const limitGb = s.storage_limit_gb ?? 5
                  const storagePct = Math.min(100, Math.round((usedGb / limitGb) * 100))

                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      {/* School name & email */}
                      <td style={{ padding: '16px 20px', minWidth: 220 }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <input
                              value={editForm!.name}
                              onChange={e => setEditForm(f => f ? { ...f, name: e.target.value } : f)}
                              style={{ padding: '7px 10px', borderRadius: 8, border: '1.5px solid #7c3aed', fontSize: 13, fontWeight: 600, outline: 'none', width: '100%', boxSizing: 'border-box' }}
                            />
                            <input
                              value={editForm!.email}
                              onChange={e => setEditForm(f => f ? { ...f, email: e.target.value } : f)}
                              style={{ padding: '7px 10px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 12, outline: 'none', width: '100%', boxSizing: 'border-box' }}
                            />
                          </div>
                        ) : (
                          <div>
                            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 14 }}>{s.name}</div>
                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{s.email ?? '—'}</div>
                          </div>
                        )}
                      </td>
                      {/* Status */}
                      <td style={{ padding: '16px 20px' }}>
                        {isEditing ? (
                          <select
                            value={editForm!.status}
                            onChange={e => setEditForm(f => f ? { ...f, status: e.target.value } : f)}
                            style={{ padding: '7px 10px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none' }}
                          >
                            <option value="active">Active</option>
                            <option value="pending">Pending</option>
                            <option value="suspended">Suspended</option>
                          </select>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: statusStyle.bg, color: statusStyle.text, padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 700 }}>
                            {statusStyle.icon} {s.status ?? 'pending'}
                          </span>
                        )}
                      </td>
                      {/* Currency */}
                      <td style={{ padding: '16px 20px' }}>
                        {isEditing ? (
                          <input
                            value={editForm!.currency_code}
                            onChange={e => setEditForm(f => f ? { ...f, currency_code: e.target.value } : f)}
                            style={{ padding: '7px 10px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', width: 80, textTransform: 'uppercase' }}
                            maxLength={4}
                          />
                        ) : (
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', background: '#f1f5f9', padding: '3px 9px', borderRadius: 8 }}>{s.currency_code ?? 'GHS'}</span>
                        )}
                      </td>
                      {/* Storage */}
                      <td style={{ padding: '16px 20px', minWidth: 160 }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <input
                              type="number"
                              value={editForm!.storage_limit_gb}
                              onChange={e => setEditForm(f => f ? { ...f, storage_limit_gb: Number(e.target.value) } : f)}
                              style={{ padding: '7px 10px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', width: 70 }}
                              min={1} max={1000}
                            />
                            <span style={{ fontSize: 12, color: '#64748b' }}>GB limit</span>
                          </div>
                        ) : (
                          <div>
                            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{usedGb} / {limitGb} GB</div>
                            <div style={{ height: 6, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden', width: 100 }}>
                              <div style={{ height: '100%', width: `${storagePct}%`, background: storagePct > 80 ? '#ef4444' : storagePct > 60 ? '#f59e0b' : '#10b981', borderRadius: 99 }} />
                            </div>
                          </div>
                        )}
                      </td>
                      {/* Created */}
                      <td style={{ padding: '16px 20px', fontSize: 13, color: '#64748b' }}>
                        {new Date(s.created_at).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      {/* Actions */}
                      <td style={{ padding: '16px 20px' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              onClick={() => updateMutation.mutate({ id: s.id, form: editForm! })}
                              disabled={updateMutation.isPending}
                              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 9, background: '#16a34a', color: '#fff', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                            >
                              <Save size={13} /> Save
                            </button>
                            <button
                              onClick={() => { setEditingId(null); setEditForm(null) }}
                              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 9, background: '#f1f5f9', color: '#374151', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                            >
                              <X size={13} /> Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(s)}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 9, background: '#f5f3ff', color: '#7c3aed', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                          >
                            <Edit2 size={13} /> Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
