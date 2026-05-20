// src/pages/bursar/VendorsPage.tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import { vendorService, Vendor } from '../../services/vendors.service'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { 
  Plus, Search, Truck, Phone, Mail, User, 
  MoreVertical, Edit2, Trash2, ExternalLink,
  ShoppingBag, TrendingUp, DollarSign, Briefcase
} from 'lucide-react'
import Modal from '../../components/ui/Modal'

import { formatCurrency } from '../../utils/currency'

export default function VendorsPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const schoolId = user?.school_id ?? ''
  
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
  const [form, setForm] = useState<Partial<Vendor>>({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    category: 'General',
    notes: ''
  })

  // 1. Fetch Vendors
  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ['vendors', schoolId],
    queryFn: async () => {
      const { data } = await vendorService.getAll(schoolId)
      return data ?? []
    },
    enabled: !!schoolId
  })

  // 2. Fetch Spending Stats per Vendor
  const { data: spending = {} } = useQuery({
    queryKey: ['vendor-spending', schoolId],
    queryFn: async () => {
      const { data } = await supabase
        .from('expense_records')
        .select('vendor_id, amount')
        .eq('school_id', schoolId)
        .not('vendor_id', 'is', null)
      
      const stats: Record<string, number> = {}
      data?.forEach(ex => {
        stats[ex.vendor_id] = (stats[ex.vendor_id] || 0) + Number(ex.amount)
      })
      return stats
    },
    enabled: !!schoolId
  })

  // 3. Fetch School Context for Currency
  const { data: school } = useQuery({
    queryKey: ['school-currency', schoolId],
    queryFn: async () => {
      const { data } = await supabase.from('schools').select('currency_code').eq('id', schoolId).single()
      return data
    },
    enabled: !!schoolId
  })
  
  const schoolCurrency = school?.currency_code || 'GHS'
  const CUR = (n: number) => formatCurrency(n, schoolCurrency)

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<Vendor>) => {
      if (editingVendor) return vendorService.update(schoolId, editingVendor.id, data)
      return vendorService.create({ ...data, school_id: schoolId })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendors'] })
      toast.success(editingVendor ? 'Vendor updated' : 'Vendor added')
      closeModal()
    },
    onError: (err: any) => toast.error(err.message)
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => vendorService.delete(schoolId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendors'] })
      toast.success('Vendor removed')
    }
  })

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingVendor(null)
    setForm({ name: '', contact_person: '', phone: '', email: '', category: 'General', notes: '' })
  }

  const openEdit = (v: Vendor) => {
    setEditingVendor(v)
    setForm(v)
    setIsModalOpen(true)
  }

  const filtered = vendors.filter(v => 
    v.name.toLowerCase().includes(search.toLowerCase()) || 
    v.category?.toLowerCase().includes(search.toLowerCase()) ||
    v.contact_person?.toLowerCase().includes(search.toLowerCase())
  )

  const totalSpent = Object.values(spending).reduce((a, b) => a + b, 0)

  return (
    <div style={{ fontFamily: '"DM Sans", sans-serif' }}>
      <style>{`
        .v-card { transition: all 0.2s ease; border: 1.5px solid #f1f5f9; }
        .v-card:hover { transform: translateY(-4px); border-color: #6d28d9; box-shadow: 0 12px 24px -10px rgba(109,40,217,0.1); }
        .btn-p { background: linear-gradient(135deg, #6d28d9 0%, #4c1d95 100%); color: #fff; border: none; padding: 10px 20px; borderRadius: 12px; fontWeight: 700; cursor: pointer; display: flex; alignItems: center; gap: 8px; }
        .btn-s { background: #fff; border: 1.5px solid #e2e8f0; color: #475569; padding: 10px 20px; borderRadius: 12px; fontWeight: 700; cursor: pointer; }
      `}</style>

      {/* Header & Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 20 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>Vendors Directory</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>Manage suppliers, track historical spending, and maintain contact records.</p>
        </div>
        <button className="btn-p" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Add New Vendor
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 32 }}>
        <div style={{ background: 'var(--bg-card)', padding: 24, borderRadius: 20, border: '1.5px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: '#f5f3ff', color: '#6d28d9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Truck size={24} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Vendors</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#0f172a' }}>{vendors.length}</div>
          </div>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: 24, borderRadius: 20, border: '1.5px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShoppingBag size={24} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Orders</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#0f172a' }}>—</div>
          </div>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: 24, borderRadius: 20, border: '1.5px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: '#fff7ed', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Spend</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#0f172a' }}>{CUR(totalSpent)}</div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div style={{ background: 'var(--bg-card)', padding: '12px 20px', borderRadius: 16, border: '1.5px solid #f1f5f9', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Search size={20} color="#94a3b8" />
        <input 
          type="text" 
          placeholder="Search by vendor name, category, or contact person..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ border: 'none', outline: 'none', width: '100%', fontSize: 14, fontWeight: 500, color: '#334155' }}
        />
      </div>

      {/* Vendors Grid */}
      {isLoading ? (
        <div style={{ padding: 100, textAlign: 'center', color: '#94a3b8' }}>Loading directory...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 100, textAlign: 'center', background: 'var(--bg-card)', borderRadius: 24, border: '1.5px dashed #e2e8f0' }}>
          <Truck size={48} color="#cbd5e1" style={{ marginBottom: 16 }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#475569', margin: 0 }}>No Vendors Found</h3>
          <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 8 }}>Try adjusting your search or add a new vendor to your directory.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
          {filtered.map(v => (
            <div key={v.id} className="v-card" style={{ background: 'var(--bg-card)', borderRadius: 24, padding: 24, position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: '#f8fafc', border: '1.5px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                  🏢
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => openEdit(v)} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: '#f1f5f9', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Edit2 size={14} /></button>
                  <button onClick={() => { if(confirm('Remove this vendor?')) deleteMutation.mutate(v.id) }} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={14} /></button>
                </div>
              </div>

              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>{v.name}</h3>
              <div style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 8, background: '#f1f5f9', color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{v.category || 'General'}</div>

              <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#475569' }}>
                  <User size={14} color="#94a3b8" />
                  <span style={{ fontWeight: 600 }}>{v.contact_person || 'No Contact Person'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#475569' }}>
                  <Phone size={14} color="#94a3b8" />
                  <span>{v.phone || 'No Phone'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#475569' }}>
                  <Mail size={14} color="#94a3b8" />
                  <span>{v.email || 'No Email'}</span>
                </div>
              </div>

              <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1.5px solid #f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Total Spend</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>{CUR(spending[v.id] || 0)}</div>
                </div>
                <button style={{ padding: '8px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: 'var(--bg-card)', color: '#64748b', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  History <ExternalLink size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal 
        open={isModalOpen} 
        onClose={closeModal} 
        title={editingVendor ? "Edit Vendor Details" : "Add New Vendor"}
        size="md"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '10px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>Vendor Name *</label>
              <input 
                type="text" 
                value={form.name} 
                onChange={e => setForm({ ...form, name: e.target.value })} 
                placeholder="e.g. Ghana Water Company"
                style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1.5px solid #e2e8f0', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>Category</label>
              <select 
                value={form.category} 
                onChange={e => setForm({ ...form, category: e.target.value })}
                style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1.5px solid #e2e8f0', outline: 'none' }}
              >
                {['General', 'Utilities', 'Stationery', 'Food & Catering', 'Maintenance', 'Technology', 'Transport'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>Contact Person</label>
              <input 
                type="text" 
                value={form.contact_person} 
                onChange={e => setForm({ ...form, contact_person: e.target.value })} 
                placeholder="Name"
                style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1.5px solid #e2e8f0', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>Phone Number</label>
              <input 
                type="text" 
                value={form.phone} 
                onChange={e => setForm({ ...form, phone: e.target.value })} 
                placeholder="+233..."
                style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1.5px solid #e2e8f0', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>Email Address</label>
              <input 
                type="email" 
                value={form.email} 
                onChange={e => setForm({ ...form, email: e.target.value })} 
                placeholder="email@example.com"
                style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1.5px solid #e2e8f0', outline: 'none' }}
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>Notes / Description</label>
            <textarea 
              value={form.notes} 
              onChange={e => setForm({ ...form, notes: e.target.value })} 
              placeholder="Any additional info..."
              rows={3}
              style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1.5px solid #e2e8f0', outline: 'none', resize: 'none' }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <button className="btn-p" style={{ flex: 1, justifyContent: 'center' }} onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending || !form.name}>
              {saveMutation.isPending ? 'Saving...' : editingVendor ? 'Update Vendor' : 'Create Vendor'}
            </button>
            <button className="btn-s" style={{ flex: 0.5 }} onClick={closeModal}>Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
