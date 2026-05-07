// src/pages/admin/SecurityStaffPage.tsx
// Admin page to create and manage security staff accounts
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import Modal from '../../components/ui/Modal'
import toast from 'react-hot-toast'
import { Plus, Trash2, KeyRound, Shield, Eye, EyeOff } from 'lucide-react'

function Btn({ children, onClick, variant = 'primary', disabled, loading, style }: any) {
  const [h, setH] = useState(false)
  const v: any = {
    primary: { background: h ? '#1e293b' : 'linear-gradient(135deg,#334155,#1e293b)', color: '#fff', border: 'none' },
    secondary: { background: h ? '#f8fafc' : '#fff', color: '#334155', border: '1.5px solid #e2e8f0' },
    danger: { background: h ? '#b91c1c' : '#dc2626', color: '#fff', border: 'none' },
  }
  return (
    <button onClick={onClick} disabled={disabled} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all .15s', opacity: disabled ? 0.6 : 1, fontFamily: '"DM Sans",sans-serif', ...v[variant], ...style }}>
      {loading && <span style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', animation: '_sec_spin .7s linear infinite', flexShrink: 0 }} />}
      {children}
    </button>
  )
}

export default function SecurityStaffPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const schoolId = user?.school_id ?? ''

  const [createModal, setCreateModal] = useState(false)
  const [resetModal, setResetModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [newPw, setNewPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '' })

  const { data: securityStaff = [], isLoading } = useQuery({
    queryKey: ['security-staff', schoolId],
    queryFn: async () => {
      const { data } = await supabase.from('users').select('*').eq('school_id', schoolId).eq('role', 'security').order('full_name')
      return data ?? []
    },
    enabled: !!schoolId,
  })

  async function handleCreate() {
    if (!form.full_name || !form.email) { toast.error('Name and email required'); return }
    setSaving(true)
    try {
      const pw = form.password || 'security123'
      const { data, error } = await supabase.functions.invoke('admin-ops', {
        body: {
          action: 'create-user',
          payload: {
            email: form.email,
            password: pw,
            full_name: form.full_name,
            role: 'security',
            phone: form.phone || null,
            target_school_id: schoolId
          }
        }
      })
      
      if (error) throw error
      if (data?.error) throw new Error(String(data.error))

      toast.success(`Security account created · ${form.email} · Password: ${pw}`, { duration: 8000 })
      qc.invalidateQueries({ queryKey: ['security-staff'] })
      setCreateModal(false)
      setForm({ full_name: '', email: '', phone: '', password: '' })
    } catch (e: unknown) {
      toast.error(e instanceof Error ? (e.message ?? 'Failed to create security account') : 'Failed to create security account')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(s: any) {
    if (!confirm(`Remove security account for ${s.full_name}? This will deactivate their login.`)) return
    try {
      const { error, data } = await supabase.functions.invoke('admin-ops', {
        body: { action: 'delete-user', payload: { target_user_id: s.id, role: 'security' } }
      })
      if (error) throw error
      if (data?.error) throw new Error(String(data.error))
      
      qc.invalidateQueries({ queryKey: ['security-staff'] })
      toast.success('Security account removed')
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Failed to remove security account') }
  }

  async function handleResetPassword() {
    if (!newPw || newPw.length < 6) { toast.error('Min 6 characters'); return }
    const { error, data } = await supabase.functions.invoke('admin-ops', {
      body: { action: 'reset-password', payload: { target_user_id: selectedUser.id, password: newPw } }
    })
    if (error) { toast.error(error.message); return }
    if (data?.error) { toast.error(String(data.error)); return }
    
    toast.success(`Password reset for ${selectedUser.full_name}`)
    setResetModal(false); setNewPw('')
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');
        @keyframes _sec_spin { to{transform:rotate(360deg)} }
        @keyframes _sec_fi { from{opacity:0} to{opacity:1} }
        .sec-card:hover { box-shadow: 0 8px 28px rgba(15,23,42,.12) !important; transform: translateY(-2px); }
        .sec-card { transition: all .2s; }
      `}</style>
      <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif', animation: '_sec_fi .4s ease' }}>
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#0f172a', margin: 0 }}>Security Personnel</h1>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>Manage gate security and visitor management staff</p>
          </div>
          <Btn onClick={() => setCreateModal(true)}><Plus size={14} /> Add Security Staff</Btn>
        </div>

        {/* Info banner */}
        <div style={{ background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', border: '1px solid #e2e8f0', borderRadius: 14, padding: '14px 18px', marginBottom: 22, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <Shield size={20} color="#334155" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: '0 0 3px' }}>Security Role Permissions</p>
            <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>Security staff can manage visitor logs, track student gate entry/exit, and view emergency contacts. They cannot access academic or financial records.</p>
          </div>
        </div>

        {isLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>Loading…</div>
        ) : (securityStaff as any[]).length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 18, padding: '60px', textAlign: 'center', border: '1.5px solid #f1f5f9' }}>
            <Shield size={48} color="#cbd5e1" style={{ marginBottom: 16 }} />
            <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>No Security Staff</h3>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>Create a security account to enable gate and visitor management features.</p>
            <Btn onClick={() => setCreateModal(true)}><Plus size={14} /> Create First Security Account</Btn>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
            {(securityStaff as any[]).map((s: any) => (
              <div key={s.id} className="sec-card" style={{ background: '#fff', borderRadius: 18, border: '1.5px solid #f1f5f9', padding: '22px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', pointerEvents: 'none' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, position: 'relative' }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#334155,#0f172a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                    {s.full_name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>{s.full_name}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{s.email}</div>
                    <span style={{ fontSize: 10, fontWeight: 700, background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: 99, marginTop: 4, display: 'inline-block', border: '1px solid #e2e8f0' }}>Security</span>
                  </div>
                </div>
                {s.phone && <div style={{ fontSize: 12, color: '#64748b', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>📱 {s.phone}</div>}
                <div style={{ display: 'flex', gap: 8, borderTop: '1px solid #f8fafc', paddingTop: 14 }}>
                  <button onClick={() => { setSelectedUser(s); setNewPw(''); setResetModal(true) }}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '8px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'transparent', color: '#334155', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    <KeyRound size={13} /> Reset Password
                  </button>
                  <button onClick={() => handleDelete(s)}
                    style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid #fee2e2', background: 'transparent', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Create Security Account" subtitle="Setup login for gate/security personnel" size="sm"
        footer={<><Btn variant="secondary" onClick={() => setCreateModal(false)}>Cancel</Btn><Btn onClick={handleCreate} loading={saving}>Create Account</Btn></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'Full Name *', key: 'full_name', placeholder: 'e.g. Officer John Smith', type: 'text' },
            { label: 'Email Address *', key: 'email', placeholder: 'security@school.edu.gh', type: 'email' },
            { label: 'Phone Number', key: 'phone', placeholder: '024 000 0000', type: 'tel' },
            { label: 'Password', key: 'password', placeholder: 'Leave blank for "security123"', type: 'password' },
          ].map(f => (
            <div key={f.key}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#64748b', marginBottom: 5 }}>{f.label}</label>
              <div style={{ position: 'relative' }}>
                <input type={f.type === 'password' && showPw ? 'text' : f.type} placeholder={f.placeholder} value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: '"DM Sans",sans-serif' }} />
                {f.type === 'password' && (
                   <button onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                     {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                   </button>
                )}
              </div>
            </div>
          ))}
          <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 9, padding: '10px 14px', fontSize: 12, color: '#92400e' }}>
            <strong>Default password:</strong> security123
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
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#64748b', marginBottom: 5 }}>New Password</label>
            <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Min 6 characters"
              style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>
      </Modal>
    </>
  )
}
