// src/pages/teacher/TeacherStudentsPage.tsx
import { useState, useMemo, useEffect } from 'react'
import { supabase, adminSupabase } from '../../lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import Modal from '../../components/ui/Modal'
import { formatDate } from '../../lib/utils'
import toast from 'react-hot-toast'

// ── helpers ───────────────────────────────────────────────
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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 5 }}>{children}</label>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      {children}
    </div>
  )
}

function StyledInput({ error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <input
        {...props}
        onFocus={e => { setFocused(true); props.onFocus?.(e) }}
        onBlur={e => { setFocused(false); props.onBlur?.(e) }}
        style={{
          width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 13,
          border: `1.5px solid ${error ? '#f87171' : focused ? '#7c3aed' : '#e5e7eb'}`,
          boxShadow: focused ? '0 0 0 3px rgba(109,40,217,0.1)' : 'none',
          outline: 'none', background: '#fff', color: '#111827',
          fontFamily: '"DM Sans",sans-serif', transition: 'all 0.15s',
          boxSizing: 'border-box',
        }}
      />
      {error && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>⚠ {error}</p>}
    </div>
  )
}

function StyledSelect({ error, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { error?: string }) {
  const [focused, setFocused] = useState(false)
  const { onBlur: propOnBlur, onFocus: propOnFocus, onChange: propOnChange, ...rest } = props
  return (
    <select
      {...rest}
      onChange={e => { propOnChange?.(e) }}
      onFocus={e => { setFocused(true); propOnFocus?.(e) }}
      onBlur={e => { setFocused(false); propOnBlur?.(e) }}
      style={{
        width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 13,
        border: `1.5px solid ${focused ? '#7c3aed' : '#e5e7eb'}`,
        boxShadow: focused ? '0 0 0 3px rgba(109,40,217,0.1)' : 'none',
        outline: 'none', background: '#fff', color: '#111827',
        fontFamily: '"DM Sans",sans-serif', cursor: 'pointer',
        boxSizing: 'border-box',
      }}
    >
      {children}
    </select>
  )
}

function Btn({ children, onClick, variant = 'primary', type = 'button', disabled, loading, style }: any) {
  const [hov, setHov] = useState(false)
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '9px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600,
    border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s', opacity: disabled ? 0.6 : 1,
    fontFamily: '"DM Sans",sans-serif',
    ...style,
  }
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: hov ? '#5b21b6' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', boxShadow: '0 2px 8px rgba(109,40,217,0.28)' },
    secondary: { background: hov ? '#f5f3ff' : '#fff', color: '#374151', border: '1.5px solid #e5e7eb' },
    danger: { background: hov ? '#b91c1c' : '#dc2626', color: '#fff', boxShadow: '0 2px 6px rgba(220,38,38,0.22)' },
    ghost: { background: hov ? '#f5f3ff' : 'transparent', color: '#6b7280' },
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ ...base, ...variants[variant] }}>
      {loading && <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: '_spin 0.7s linear infinite', flexShrink: 0 }} />}
      {children}
    </button>
  )
}

// ═══════════════════════════════════════════════════════════
export default function TeacherStudentsPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  
  const [students, setStudents] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [filterGender, setFilterGender] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  
  // Modals
  const [viewModal, setViewModal] = useState(false)
  const [viewingStudent, setViewingStudent] = useState<any>(null)
  const [accountModalOpen, setAccountModalOpen] = useState(false)
  const [accountStudent, setAccountStudent] = useState<any>(null)
  const [accountLoading, setAccountLoading] = useState(false)
  const [accountData, setAccountData] = useState({ email: '', password: '' })

  useEffect(() => {
    if (user?.id) loadStudents()
  }, [user?.id])

  async function loadStudents() {
    setIsLoading(true)
    try {
      // 1. Get teacher ID
      const { data: teacher } = await supabase.from('teachers').select('id').eq('user_id', user!.id).single()
      if (!teacher) return

      // 2. Get assigned classes
      const { data: assignments } = await supabase
        .from('teacher_assignments')
        .select('class_id, class:classes(id,name)')
        .eq('teacher_id', teacher.id)
      
      const classIds = Array.from(new Set((assignments ?? []).map(a => a.class_id)))
      const uniqueClasses = Array.from(new Map((assignments ?? []).map(a => [a.class?.id, a.class])).values()).filter(Boolean) as any[]
      setClasses(uniqueClasses)

      if (classIds.length === 0) {
        setStudents([])
        return
      }

      // 3. Get students in these classes
      const { data, error } = await supabase
        .from('students')
        .select('*, class:classes(id,name)')
        .in('class_id', classIds)
        .eq('is_active', true)
        .order('full_name')

      if (error) throw error
      setStudents(data ?? [])
    } catch (err: any) {
      toast.error(err.message || 'Failed to load students')
    } finally {
      setIsLoading(false)
    }
  }

  const filtered = useMemo(() => students.filter(s => {
    const q = search.toLowerCase()
    const matchSearch = !q || s.full_name.toLowerCase().includes(q) || s.student_id?.toLowerCase().includes(q)
    const matchClass = !filterClass || s.class_id === filterClass
    const matchGender = !filterGender || s.gender === filterGender
    return matchSearch && matchClass && matchGender
  }), [students, search, filterClass, filterGender])

  async function handleCreateAccount() {
    if (!accountData.email || !accountData.password) {
      toast.error('Please enter both email and password')
      return
    }
    
    setAccountLoading(true)
    try {
      // 1. Create the Auth user using the admin client
      const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
        email: accountData.email,
        password: accountData.password,
        email_confirm: true,
        user_metadata: { full_name: accountStudent.full_name }
      })

      if (authError) throw authError
      const newUser = authData.user

      // 2. Create the profile in public.users
      const { error: profileError } = await adminSupabase
        .from('users')
        .upsert({
          id: newUser.id,
          school_id: user!.school_id,
          full_name: accountStudent.full_name,
          email: accountData.email,
          role: 'student',
          is_active: true
        })

      if (profileError) throw profileError

      // 3. Link the student record to the new user_id
      const { error: linkError } = await adminSupabase
        .from('students')
        .update({ user_id: newUser.id })
        .eq('id', accountStudent.id)

      if (linkError) throw linkError

      toast.success('Student account created successfully!')
      setAccountModalOpen(false)
      setAccountData({ email: '', password: '' })
      loadStudents() // Refresh list
    } catch (err: any) {
      console.error('Account creation failed:', err)
      toast.error(err.message || 'Failed to create student account')
    } finally {
      setAccountLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _spin { to{transform:rotate(360deg)} }
        @keyframes _fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes _fadeIn { from{opacity:0} to{opacity:1} }
        .std-row:hover { background:#faf5ff !important; }
        .action-btn:hover { background:#f5f3ff !important; color:#6d28d9 !important; }
      `}</style>

      <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif', animation: '_fadeIn 0.4s ease' }}>
        
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>My Students</h1>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 3 }}>Manage portal logins and profiles for students in your classes</p>
        </div>

        {/* ── Filters bar ── */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '14px 18px', border: '1.5px solid #f0eefe', marginBottom: 18, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 220px' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 15, pointerEvents: 'none' }}>🔍</span>
            <input
              placeholder="Search by name or ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={{
                width: '100%', padding: '9px 12px 9px 36px', borderRadius: 9, fontSize: 13,
                border: `1.5px solid ${searchFocused ? '#7c3aed' : '#e5e7eb'}`,
                boxShadow: searchFocused ? '0 0 0 3px rgba(109,40,217,0.1)' : 'none',
                outline: 'none', background: '#faf5ff', color: '#111827',
                fontFamily: '"DM Sans",sans-serif', transition: 'all 0.15s',
              }}
            />
          </div>

          <StyledSelect value={filterClass} onChange={e => setFilterClass(e.target.value)} style={{ flex: '1 1 160px', maxWidth: 200 }}>
            <option value="">All My Classes</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </StyledSelect>

          <StyledSelect value={filterGender} onChange={e => setFilterGender(e.target.value)} style={{ flex: '1 1 130px', maxWidth: 160 }}>
            <option value="">All Genders</option>
            <option value="male">♂ Male</option>
            <option value="female">♀ Female</option>
          </StyledSelect>

          <span style={{ fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap', marginLeft: 'auto' }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* ── Table View ── */}
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #ede9fe', borderTopColor: '#6d28d9', animation: '_spin 0.8s linear infinite' }} />
            <p style={{ fontSize: 13, color: '#9ca3af' }}>Loading your students…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 16, padding: '60px 20px', textAlign: 'center', border: '1.5px solid #f0eefe' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎓</div>
            <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 6 }}>No students found</h3>
            <p style={{ fontSize: 13, color: '#9ca3af' }}>Ask your administrator to assign classes to you.</p>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', overflow: 'hidden', boxShadow: '0 1px 4px rgba(109,40,217,0.06)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(135deg,#faf5ff,#f5f3ff)', borderBottom: '1.5px solid #ede9fe' }}>
                  {['Student', 'ID', 'Class', 'Gender', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={s.id} className="std-row"
                    style={{ borderBottom: i < filtered.length - 1 ? '1px solid #faf5ff' : 'none', transition: 'background 0.12s', animation: `_fadeUp 0.3s ease ${i * 0.03}s both` }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={s.full_name} size={34} />
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{s.full_name}</div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 12, fontFamily: 'monospace', background: '#f5f3ff', color: '#6d28d9', padding: '2px 7px', borderRadius: 5 }}>{s.student_id ?? '—'}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, background: '#ede9fe', color: '#5b21b6', padding: '3px 9px', borderRadius: 99 }}>{s.class?.name ?? 'Unassigned'}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, background: s.gender === 'male' ? '#eff6ff' : s.gender === 'female' ? '#fdf2f8' : '#f3f4f6', color: s.gender === 'male' ? '#2563eb' : s.gender === 'female' ? '#db2777' : '#6b7280', padding: '3px 9px', borderRadius: 99 }}>
                        {s.gender === 'male' ? '♂ Male' : s.gender === 'female' ? '♀ Female' : '—'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {s.user_id ? (
                        <span style={{ fontSize: 12, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>✅ Account Ready</span>
                      ) : (
                        <span style={{ fontSize: 12, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>⏳ No Login</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="action-btn" onClick={() => { setViewingStudent(s); setViewModal(true) }}
                          style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: '#f5f3ff', color: '#6d28d9', cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.15s' }}>Profile</button>
                        
                        {!s.user_id && (
                          <button className="action-btn" onClick={() => { setAccountStudent(s); setAccountData(prev => ({ ...prev, email: s.guardian_email || '' })); setAccountModalOpen(true) }}
                            style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: '#ecfdf5', color: '#059669', cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.15s' }}>🗝️ Create Login</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── VIEW MODAL ── */}
        <Modal open={viewModal} onClose={() => setViewModal(false)} title="Student Profile" size="md">
          {viewingStudent && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', background: 'linear-gradient(135deg,#faf5ff,#f5f3ff)', borderRadius: 12, marginBottom: 18 }}>
                <Avatar name={viewingStudent.full_name} size={52} />
                <div>
                  <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>{viewingStudent.full_name}</h3>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{viewingStudent.class?.name ?? 'No class assigned'}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Date of Birth', value: formatDate(viewingStudent.date_of_birth) },
                  { label: 'Guardian', value: viewingStudent.guardian_name },
                  { label: 'Guardian Phone', value: viewingStudent.guardian_phone },
                  { label: 'Guardian Email', value: viewingStudent.guardian_email },
                  { label: 'Address', value: viewingStudent.address },
                ].map(({ label, value }) => value && (
                  <div key={label} style={{ background: '#faf5ff', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Modal>

        {/* ── CREATE ACCOUNT MODAL ── */}
        <Modal open={accountModalOpen} onClose={() => setAccountModalOpen(false)} 
          title="Create Student Portal Login" 
          subtitle={`Set up a secure login for ${accountStudent?.full_name}`}
          footer={<>
            <Btn variant="secondary" onClick={() => setAccountModalOpen(false)}>Cancel</Btn>
            <Btn onClick={handleCreateAccount} loading={accountLoading}>Create Account</Btn>
          </>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: '12px 16px', background: '#fef3c7', borderRadius: 10, border: '1px solid #fde68a', color: '#92400e', fontSize: 13 }}>
              <strong>Note:</strong> This student will be able to log in to see their dashboard and results.
            </div>
            
            <Field label="Login Email">
              <StyledInput 
                type="email" 
                placeholder="student@school.com" 
                value={accountData.email}
                onChange={e => setAccountData(prev => ({ ...prev, email: e.target.value }))}
              />
            </Field>
            
            <Field label="Set Password">
              <div style={{ position: 'relative' }}>
                <StyledInput 
                  type="text" 
                  placeholder="Choose a password" 
                  value={accountData.password}
                  onChange={e => setAccountData(prev => ({ ...prev, password: e.target.value }))}
                />
                <button 
                  type="button"
                  onClick={() => setAccountData(prev => ({ ...prev, password: Math.random().toString(36).slice(-8) }))}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: '#ede9fe', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 700, color: '#6d28d9', cursor: 'pointer' }}
                >Generate</button>
              </div>
            </Field>
          </div>
        </Modal>
      </div>
    </>
  )
}
