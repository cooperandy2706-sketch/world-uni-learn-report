import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import Modal from '../../components/ui/Modal'
import toast from 'react-hot-toast'
import { Plus, Trash2, UserPlus, LogOut, Search, Calendar, Phone, User, Info } from 'lucide-react'
import { format } from 'date-fns'

function Btn({ children, onClick, variant = 'primary', disabled, loading, style }: any) {
  const [h, setH] = useState(false)
  const v: any = {
    primary: { background: h ? '#5b21b6' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', border: 'none' },
    secondary: { background: h ? '#f5f3ff' : '#fff', color: '#374151', border: '1.5px solid #e5e7eb' },
    danger: { background: h ? '#b91c1c' : '#dc2626', color: '#fff', border: 'none' },
    success: { background: h ? '#15803d' : '#16a34a', color: '#fff', border: 'none' },
  }
  return (
    <button onClick={onClick} disabled={disabled} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all .15s', opacity: disabled ? 0.6 : 1, fontFamily: '"DM Sans",sans-serif', ...v[variant], ...style }}>
      {loading && <span style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', animation: '_vst_spin .7s linear infinite', flexShrink: 0 }} />}
      {children}
    </button>
  )
}

export default function VisitorsPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const schoolId = user?.school_id ?? ''

  const [createModal, setCreateModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    purpose: '',
    person_to_see: '',
    id_number: ''
  })

  const { data: visitors = [], isLoading } = useQuery({
    queryKey: ['visitors', schoolId],
    queryFn: async () => {
      const { data } = await supabase
        .from('visitors')
        .select('*')
        .eq('school_id', schoolId)
        .order('time_in', { ascending: false })
      return data ?? []
    },
    enabled: !!schoolId,
  })

  async function handleCreate() {
    if (!form.full_name) { toast.error('Visitor name is required'); return }
    setSaving(true)
    try {
      const { error } = await supabase.from('visitors').insert([{
        ...form,
        school_id: schoolId,
        time_in: new Date().toISOString()
      }])
      
      if (error) throw error

      toast.success('Visitor recorded successfully')
      qc.invalidateQueries({ queryKey: ['visitors'] })
      setCreateModal(false)
      setForm({ full_name: '', phone: '', purpose: '', person_to_see: '', id_number: '' })
    } catch (e: any) {
      toast.error(e.message || 'Failed to record visitor')
    } finally {
      setSaving(false)
    }
  }

  async function handleSignOut(id: string) {
    try {
      const { error } = await supabase
        .from('visitors')
        .update({ time_out: new Date().toISOString() })
        .eq('id', id)
      
      if (error) throw error
      qc.invalidateQueries({ queryKey: ['visitors'] })
      toast.success('Visitor signed out')
    } catch (e: any) {
      toast.error(e.message || 'Failed to sign out visitor')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this visitor record?')) return
    try {
      const { error } = await supabase.from('visitors').delete().eq('id', id)
      if (error) throw error
      qc.invalidateQueries({ queryKey: ['visitors'] })
      toast.success('Record deleted')
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete record')
    }
  }

  const filteredVisitors = visitors.filter(v => 
    v.full_name.toLowerCase().includes(search.toLowerCase()) ||
    v.person_to_see?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');
        @keyframes _vst_spin { to{transform:rotate(360deg)} }
        @keyframes _vst_fi { from{opacity:0} to{opacity:1} }
        .vst-card:hover { box-shadow: 0 8px 28px rgba(109,40,217,.13) !important; transform: translateY(-2px); }
        .vst-card { transition: all .2s; }
      `}</style>

      <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif', animation: '_vst_fi .4s ease' }}>
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>Visitors Record</h1>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 3 }}>Track all visitors entering and leaving the school premises</p>
          </div>
          <Btn onClick={() => setCreateModal(true)}><Plus size={14} /> New Visitor</Btn>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search by name or person to see..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: 12, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none' }}
            />
          </div>
        </div>

        {isLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>Loading records...</div>
        ) : filteredVisitors.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 18, padding: '60px', textAlign: 'center', border: '1.5px solid #f0eefe' }}>
            <UserPlus size={48} color="#d1d5db" style={{ marginBottom: 16 }} />
            <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>No Visitors Found</h3>
            <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 20 }}>{search ? 'Try a different search term' : 'Start by recording your first visitor today.'}</p>
            {!search && <Btn onClick={() => setCreateModal(true)}><Plus size={14} /> Record Visitor</Btn>}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 16 }}>
            {filteredVisitors.map((v: any) => (
              <div key={v.id} className="vst-card" style={{ background: '#fff', borderRadius: 18, border: '1.5px solid #f0eefe', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
                      <User size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{v.full_name}</div>
                      <div style={{ fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Phone size={11} /> {v.phone || 'No phone'}
                      </div>
                    </div>
                  </div>
                  {!v.time_out ? (
                    <span style={{ fontSize: 10, fontWeight: 700, background: '#fef3c7', color: '#92400e', padding: '3px 8px', borderRadius: 99 }}>On Premise</span>
                  ) : (
                    <span style={{ fontSize: 10, fontWeight: 700, background: '#f0fdf4', color: '#16a34a', padding: '3px 8px', borderRadius: 99 }}>Signed Out</span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '12px 0', borderTop: '1px solid #f9fafb', borderBottom: '1px solid #f9fafb', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 2 }}>To See</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{v.person_to_see || 'N/A'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 2 }}>Purpose</div>
                    <div style={{ fontSize: 12, color: '#374151' }}>{v.purpose || 'N/A'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 2 }}>Time In</div>
                    <div style={{ fontSize: 12, color: '#374151' }}>{format(new Date(v.time_in), 'HH:mm')} · {format(new Date(v.time_in), 'MMM d')}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 2 }}>Time Out</div>
                    <div style={{ fontSize: 12, color: v.time_out ? '#374151' : '#9ca3af' }}>
                      {v.time_out ? format(new Date(v.time_out), 'HH:mm') : '--:--'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  {!v.time_out && (
                    <button 
                      onClick={() => handleSignOut(v.id)}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px', borderRadius: 10, border: 'none', background: '#f0fdf4', color: '#16a34a', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      <LogOut size={14} /> Sign Out
                    </button>
                  )}
                  <button 
                    onClick={() => handleDelete(v.id)}
                    style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #fecaca', background: 'transparent', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal 
        open={createModal} 
        onClose={() => setCreateModal(false)} 
        title="Record New Visitor" 
        subtitle="Log details of a visitor entering the school" 
        size="sm"
        footer={<><Btn variant="secondary" onClick={() => setCreateModal(false)}>Cancel</Btn><Btn onClick={handleCreate} loading={saving}>Record Entry</Btn></>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'Full Name *', key: 'full_name', placeholder: 'e.g. John Doe', type: 'text', icon: User },
            { label: 'Phone Number', key: 'phone', placeholder: '024 000 0000', type: 'tel', icon: Phone },
            { label: 'Person to See', key: 'person_to_see', placeholder: 'Staff or Teacher name', type: 'text', icon: User },
            { label: 'Purpose of Visit', key: 'purpose', placeholder: 'e.g. Inquiry, Meeting', type: 'text', icon: Info },
            { label: 'ID Number (Optional)', key: 'id_number', placeholder: 'Ghana Card / License', type: 'text', icon: Info },
          ].map(f => (
            <div key={f.key}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 5 }}>{f.label}</label>
              <div style={{ position: 'relative' }}>
                <f.icon size={14} color="#9ca3af" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type={f.type} 
                  placeholder={f.placeholder} 
                  value={(form as any)[f.key]} 
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px 9px 32px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: '"DM Sans",sans-serif' }} 
                />
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </>
  )
}
