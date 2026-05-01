// src/pages/admin/ParentsPage.tsx
import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import Modal from '../../components/ui/Modal'
import toast from 'react-hot-toast'
import { Users, Search, Smartphone, ShieldCheck, Mail, UserPlus, Link as LinkIcon } from 'lucide-react'

// Reuse components or styles if needed
function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const colors = ['#6d28d9', '#0891b2', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0284c7']
  const color = colors[name.charCodeAt(0) % colors.length]
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(135deg, ${color}, ${color}cc)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 800, color: '#fff',
      boxShadow: `0 2px 8px ${color}40`,
    }}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  )
}

function StyledInput({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 13,
        border: '1.5px solid #e5e7eb', outline: 'none', background: '#fff', color: '#111827',
        fontFamily: '"DM Sans",sans-serif', transition: 'all 0.15s', boxSizing: 'border-box',
      }}
    />
  )
}

export default function ParentsPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'active' | 'pending'>('active')
  
  // Modals
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ email: '', password: '' })

  // 1. Fetch Students with their class and parent status
  const { data: students = [], isLoading } = useQuery({
    queryKey: ['admin_students_parents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*, class:classes(name)')
        .eq('is_active', true)
        .order('full_name')
      if (error) throw error
      return data
    }
  })

  // 2. Fetch Parent Wards for existing links
  const { data: links = [] } = useQuery({
    queryKey: ['parent_ward_links'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parent_wards')
        .select('*, parent:users!parent_wards_parent_user_id_fkey(full_name, email)')
      if (error) throw error
      return data
    }
  })

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchSearch = !search || s.full_name.toLowerCase().includes(search.toLowerCase()) || s.student_id?.toLowerCase().includes(search.toLowerCase())
      const hasParent = links.some(l => l.student_id === s.id)
      
      if (activeTab === 'active') return matchSearch && hasParent
      return matchSearch && !hasParent
    })
  }, [students, links, search, activeTab])

  const handleCreateParent = async () => {
    if (!formData.email || !formData.password) return toast.error('Email and password required')
    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('admin-ops', {
        body: {
          action: 'create-user',
          payload: {
            email: formData.email,
            password: formData.password,
            full_name: selectedStudent.guardian_name || 'Parent',
            role: 'parent',
            target_school_id: user!.school_id,
            metadata: { link_id: selectedStudent.id }
          }
        }
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      
      toast.success('Parent account linked successfully!')
      setModalOpen(false)
      qc.invalidateQueries({ queryKey: ['parent_ward_links'] })
    } catch (err: any) {
      toast.error(err.message || 'Failed to create parent account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ fontFamily: '"DM Sans",sans-serif', animation: '_fadeIn 0.4s ease', maxWidth: 1000, margin: '0 auto' }}>
      <style>{`
        @keyframes _fadeIn { from{opacity:0} to{opacity:1} }
        .tab-btn { padding: 10px 20px; border: none; background: none; font-size: 14px; font-weight: 700; cursor: pointer; color: #6b7280; border-bottom: 2px solid transparent; transition: all 0.2s; }
        .tab-btn.active { color: #6d28d9; border-bottom: 2px solid #6d28d9; }
      `}</style>

      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>Parent Access Control</h1>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Generate and manage portal logins for parents & guardians.</p>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #f0eefe', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        
        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', padding: '0 20px' }}>
          <button className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>Active Logins</button>
          <button className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>Pending Access</button>
        </div>

        {/* Search */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 12 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              placeholder="Search students..." 
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none' }}
            />
          </div>
        </div>

        {/* List */}
        <div style={{ padding: '0 20px' }}>
          {isLoading ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>Loading accounts...</div>
          ) : filteredStudents.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{activeTab === 'active' ? '👨‍👩‍👦' : '✅'}</div>
              <div>{activeTab === 'active' ? 'No active parent logins found.' : 'All students have parent portal access!'}</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1.5px solid #f8fafc' }}>
                  <th style={{ padding: '16px 0', fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Student</th>
                  <th style={{ padding: '16px 0', fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>{activeTab === 'active' ? 'Parent Account' : 'Guardian Info'}</th>
                  <th style={{ padding: '16px 0', fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s) => {
                  const wardLink = links.find(l => l.student_id === s.id)
                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '14px 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <Avatar name={s.full_name} size={36} />
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{s.full_name}</div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>{s.class?.name || 'No Class'} · {s.student_id}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 0' }}>
                        {wardLink ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ background: '#f0fdf4', color: '#10b981', padding: '4px 8px', borderRadius: 8, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <ShieldCheck size={14} /> {wardLink.parent?.email}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{s.guardian_name || 'Not set'}</div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>{s.guardian_email || 'No email provided'}</div>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 0', textAlign: 'right' }}>
                        {activeTab === 'pending' ? (
                          <button 
                            onClick={() => { setSelectedStudent(s); setFormData({ email: s.guardian_email || '', password: '' }); setModalOpen(true) }}
                            style={{ background: '#6d28d9', color: '#fff', border: 'none', padding: '7px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                          >
                            <UserPlus size={14} /> Generate Login
                          </button>
                        ) : (
                          <button style={{ background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', padding: '7px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Manage</button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Generate Parent Login" subtitle={`Set up portal access for ${selectedStudent?.full_name}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ padding: 12, background: '#eff6ff', borderRadius: 10, border: '1px solid #bfdbfe', color: '#1e40af', fontSize: 12 }}>
            Use the same email address if the parent already has an account for another child.
          </div>
          
          <Field label="Parent Email">
            <StyledInput 
              type="email" 
              placeholder="parent@example.com" 
              value={formData.email} 
              onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))} 
            />
          </Field>
          
          <Field label="Set Password">
            <div style={{ position: 'relative' }}>
              <StyledInput 
                type="text" 
                placeholder="Initial password" 
                value={formData.password} 
                onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))} 
              />
              <button 
                onClick={() => setFormData(prev => ({ ...prev, password: Math.random().toString(36).slice(-8) }))}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: '#f3f4f6', border: 'none', padding: '4px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
              >Auto-Gen</button>
            </div>
          </Field>

          <button 
            disabled={loading}
            onClick={handleCreateParent}
            style={{ width: '100%', padding: '12px', background: '#6d28d9', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', marginTop: 8 }}
          >
            {loading ? 'Processing...' : 'Link Parent Account'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
