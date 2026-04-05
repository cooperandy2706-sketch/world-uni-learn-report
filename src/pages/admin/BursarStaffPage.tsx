// src/pages/admin/BursarStaffPage.tsx
// Admin page to create and manage bursar accounts
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import Modal from '../../components/ui/Modal'
import toast from 'react-hot-toast'
import { Plus, Trash2, KeyRound, ShieldCheck } from 'lucide-react'

function Btn({ children, onClick, variant = 'primary', disabled, loading, style }: any) {
  const [h, setH] = useState(false)
  const v: any = {
    primary: { background: h ? '#5b21b6' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', border: 'none' },
    secondary: { background: h ? '#f5f3ff' : '#fff', color: '#374151', border: '1.5px solid #e5e7eb' },
    danger: { background: h ? '#b91c1c' : '#dc2626', color: '#fff', border: 'none' },
  }
  return (
    <button onClick={onClick} disabled={disabled} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all .15s', opacity: disabled ? 0.6 : 1, fontFamily: '"DM Sans",sans-serif', ...v[variant], ...style }}>
      {loading && <span style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', animation: '_brs_spin .7s linear infinite', flexShrink: 0 }} />}
      {children}
    </button>
  )
}

export default function BursarStaffPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const schoolId = user?.school_id ?? ''

  const [createModal, setCreateModal] = useState(false)
  const [resetModal, setResetModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [newPw, setNewPw] = useState('')
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '' })

  const { data: bursars = [], isLoading } = useQuery({
    queryKey: ['bursars', schoolId],
    queryFn: async () => {
      const { data } = await supabase.from('users').select('*').eq('school_id', schoolId).eq('role', 'bursar').order('full_name')
      return data ?? []
    },
    enabled: !!schoolId,
  })

  async function handleCreate() {
    if (!form.full_name || !form.email) { toast.error('Name and email required'); return }
    setSaving(true)
    try {
      const pw = form.password || 'bursar123'
      const { data, error } = await supabase.functions.invoke('admin-ops', {
        body: {
          action: 'create-user',
          payload: {
            email: form.email,
            password: pw,
            full_name: form.full_name,
            role: 'bursar',
            phone: form.phone || null,
            target_school_id: schoolId
          }
        }
      })
      
      if (error) throw error
      if (data?.error) throw new Error(data.error)

      toast.success(`Bursar created · ${form.email} · Password: ${pw}`, { duration: 8000 })
      qc.invalidateQueries({ queryKey: ['bursars'] })
      setCreateModal(false)
      setForm({ full_name: '', email: '', phone: '', password: '' })
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to create bursar')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(b: any) {
    if (!confirm(`Remove bursar ${b.full_name}? This is irreversible.`)) return
    try {
      const { error, data } = await supabase.functions.invoke('admin-ops', {
        body: { action: 'delete-user', payload: { target_user_id: b.id, role: 'bursar' } }
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      
      qc.invalidateQueries({ queryKey: ['bursars'] })
      toast.success('Bursar account removed')
    } catch (e: any) { toast.error(e.message) }
  }

  async function handleResetPassword() {
    if (!newPw || newPw.length < 6) { toast.error('Min 6 characters'); return }
    const { error, data } = await supabase.functions.invoke('admin-ops', {
      body: { action: 'reset-password', payload: { target_user_id: selectedUser.id, password: newPw } }
    })
    if (error) { toast.error(error.message); return }
    if (data?.error) { toast.error(data.error); return }
    
    toast.success(`Password reset for ${selectedUser.full_name}`)
    setResetModal(false); setNewPw('')
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');
        @keyframes _brs_spin { to{transform:rotate(360deg)} }
        @keyframes _brs_fi { from{opacity:0} to{opacity:1} }
        .brs-card:hover { box-shadow: 0 8px 28px rgba(109,40,217,.13) !important; transform: translateY(-2px); }
        .brs-card { transition: all .2s; }
      `}</style>
      <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif', animation: '_brs_fi .4s ease' }}>
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>Bursar Accounts</h1>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 3 }}>Manage financial staff accounts for this school</p>
          </div>
          <Btn onClick={() => setCreateModal(true)}><Plus size={14} /> Add Bursar</Btn>
        </div>

        {/* Info banner */}
        <div style={{ background: 'linear-gradient(135deg,#fef3c7,#fffbeb)', border: '1px solid #fde68a', borderRadius: 14, padding: '14px 18px', marginBottom: 22, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <ShieldCheck size={20} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#92400e', margin: '0 0 3px' }}>Bursar Role Permissions</p>
            <p style={{ fontSize: 12, color: '#78350f', margin: 0 }}>Bursars can record fee payments, manage school fees, run payroll, and record income/expenses. They cannot manage academic data or student scores.</p>
          </div>
        </div>

        {isLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>Loading…</div>
        ) : (bursars as any[]).length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 18, padding: '60px', textAlign: 'center', border: '1.5px solid #f0eefe' }}>
            <ShieldCheck size={48} color="#d1d5db" style={{ marginBottom: 16 }} />
            <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>No Bursar Accounts</h3>
            <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 20 }}>Create a bursar account to give financial access to a staff member.</p>
            <Btn onClick={() => setCreateModal(true)}><Plus size={14} /> Create First Bursar</Btn>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
            {(bursars as any[]).map((b: any) => (
              <div key={b.id} className="brs-card" style={{ background: '#fff', borderRadius: 18, border: '1.5px solid #f0eefe', padding: '22px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)', pointerEvents: 'none' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, position: 'relative' }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                    {b.full_name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{b.full_name}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{b.email}</div>
                    <span style={{ fontSize: 10, fontWeight: 700, background: '#f5f3ff', color: '#6d28d9', padding: '2px 8px', borderRadius: 99, marginTop: 4, display: 'inline-block' }}>Bursar</span>
                  </div>
                </div>
                {b.phone && <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>📱 {b.phone}</div>}
                <div style={{ display: 'flex', gap: 8, borderTop: '1px solid #faf5ff', paddingTop: 14 }}>
                  <button onClick={() => { setSelectedUser(b); setNewPw(''); setResetModal(true) }}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '8px', borderRadius: 8, border: '1px solid #ddd6fe', background: 'transparent', color: '#6d28d9', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    <KeyRound size={13} /> Reset Password
                  </button>
                  <button onClick={() => handleDelete(b)}
                    style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid #fecaca', background: 'transparent', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Create Bursar Account" subtitle="Sets up a login for your financial staff" size="sm"
        footer={<><Btn variant="secondary" onClick={() => setCreateModal(false)}>Cancel</Btn><Btn onClick={handleCreate} loading={saving}>Create Account</Btn></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'Full Name *', key: 'full_name', placeholder: 'e.g. Mr. Kwame Asante', type: 'text' },
            { label: 'Email Address *', key: 'email', placeholder: 'bursar@school.edu.gh', type: 'email' },
            { label: 'Phone Number', key: 'phone', placeholder: '024 000 0000', type: 'tel' },
            { label: 'Password', key: 'password', placeholder: 'Leave blank for "bursar123"', type: 'password' },
          ].map(f => (
            <div key={f.key}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 5 }}>{f.label}</label>
              <input type={f.type} placeholder={f.placeholder} value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: '"DM Sans",sans-serif' }} />
            </div>
          ))}
          <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 9, padding: '10px 14px', fontSize: 12, color: '#92400e' }}>
            <strong>Default password:</strong> bursar123 (share securely with the staff member)
          </div>
        </div>
      </Modal>

      {/* Reset Password Modal */}
      <Modal open={resetModal} onClose={() => setResetModal(false)} title="Reset Password" subtitle={selectedUser?.full_name} size="sm"
        footer={<><Btn variant="secondary" onClick={() => setResetModal(false)}>Cancel</Btn><Btn variant="danger" onClick={handleResetPassword}>Reset</Btn></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 9, padding: '10px 14px', fontSize: 12, color: '#dc2626' }}>
            This will immediately change the login password for {selectedUser?.full_name}.
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 5 }}>New Password</label>
            <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Min 6 characters"
              style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>
      </Modal>
    </>
  )
}
