// src/pages/teacher/TeacherStudentsPage.tsx
import { useState, useMemo, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import Modal from '../../components/ui/Modal'
import { formatDate } from '../../lib/utils'
import toast from 'react-hot-toast'
import { useAutoRefresh } from "../../hooks/useAutoRefresh";

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
  return <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 5 }}>{children}</label>
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
          outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)',
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
        outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)',
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
    secondary: { background: hov ? '#f5f3ff' : '#fff', color: 'var(--text-main)', border: '1.5px solid var(--border-color)' },
    danger: { background: hov ? '#b91c1c' : '#dc2626', color: '#fff', boxShadow: '0 2px 6px rgba(220,38,38,0.22)' },
    ghost: { background: hov ? '#f5f3ff' : 'transparent', color: 'var(--text-muted)' },
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
    useAutoRefresh(loadStudents);
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
  const [parentModalOpen, setParentModalOpen] = useState(false)
  const [parentData, setParentData] = useState({ email: '', password: '' })
  
  // Photo Upload
  const [photoUploading, setPhotoUploading] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>, student: any) {
    const file = e.target.files?.[0]
    if (!file || !student) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return }

    setPhotoUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `student_photos/${student.id}_${Date.now()}.${ext}`
      
      const { error: uploadError } = await supabase.storage.from('school-assets').upload(path, file)
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('school-assets').getPublicUrl(path)
      
      const { error: updateError } = await supabase.from('students').update({ photo_url: urlData.publicUrl }).eq('id', student.id).eq('school_id', user!.school_id)
      if (updateError) throw updateError

      loadStudents() // Refresh list
      setViewingStudent({ ...student, photo_url: urlData.publicUrl })
      toast.success('Student photo updated!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload photo')
    } finally {
      setPhotoUploading(false)
    }
  }

  useEffect(() => {
    if (user?.id) loadStudents()
  }, [user?.id])

  async function loadStudents() {
    setIsLoading(true)
    try {
      // 1. Get teacher ID
      const { data: teacher } = await supabase.from('teachers').select('id').eq('user_id', user!.id).maybeSingle()
      if (!teacher) return

      // 2. Get assigned classes
      const { data: assignments } = await supabase
        .from('teacher_assignments')
        .select('class_id, class:classes(id,name)')
        .eq('teacher_id', teacher.id)
      
      const classIds = Array.from(new Set((assignments ?? []).map(a => a.class_id)))
      const uniqueClasses = Array.from(new Map((assignments ?? []).map((a: any) => [a.class?.id, a.class])).values()).filter(Boolean) as any[]
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
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to load students')
    } finally {
      setIsLoading(false)
    }
  }

  const filtered = useMemo(() => (Array.isArray(students) ? students : []).filter(s => {
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
      const { data, error } = await supabase.functions.invoke('admin-ops', {
        body: {
          action: 'create-user',
          payload: {
            email: accountData.email,
            password: accountData.password,
            full_name: accountStudent.full_name,
            role: 'student',
            target_school_id: user!.school_id,
            metadata: { link_id: accountStudent.id }
          }
        }
      })

      if (error) throw error
      if (data?.error) throw new Error(String(data.error))

      toast.success('Student account created successfully!')
      setAccountModalOpen(false)
      setAccountData({ email: '', password: '' })
      loadStudents() // Refresh list
    } catch (err: unknown) {
      console.error('Account creation failed:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to create student account')
    } finally {
      setAccountLoading(false)
    }
  }

  async function handleCreateParentAccount() {
    if (!parentData.email || !parentData.password) {
      toast.error('Please enter both email and password')
      return
    }
    
    setAccountLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('admin-ops', {
        body: {
          action: 'create-user',
          payload: {
            email: parentData.email,
            password: parentData.password,
            full_name: accountStudent.guardian_name || 'Parent/Guardian',
            role: 'parent',
            target_school_id: user!.school_id,
            metadata: { link_id: accountStudent.id }
          }
        }
      })

      if (error) throw error
      if (data?.error) throw new Error(String(data.error))

      toast.success('Parent account linked successfully!')
      setParentModalOpen(false)
      setParentData({ email: '', password: '' })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? (err.message || 'Failed to create parent account') : 'Failed to create parent account')
    } finally {
      setAccountLoading(false)
    }
  }

  return (
    <div className="tp-page">
      <link rel="stylesheet" href="/src/styles/teacher-portal.css" />
      
      {/* ── HERO ── */}
      <div className="tp-hero" style={{ marginBottom: 16 }}>
        <div className="tp-hero-label">Class Roster</div>
        <h1 className="tp-hero-title">🧑‍🎓 My Students</h1>
        <p className="tp-hero-sub">Manage portal logins and profiles for students in your classes</p>
      </div>

      {/* ── FILTERS ── */}
      <div className="tp-card" style={{ marginBottom: 16, padding: '14px 18px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <div style={{ flex: '1 1 200px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>🔍</span>
            <input
              placeholder="Search by name or ID…"
              className="tp-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 36, minHeight: 44 }}
            />
          </div>
          <div style={{ flex: '1 1 140px' }}>
            <select className="tp-select" value={filterClass} onChange={e => setFilterClass(e.target.value)} style={{ minHeight: 44 }}>
              <option value="">All My Classes</option>
              {(Array.isArray(classes) ? classes : []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ flex: '0 0 130px' }}>
            <select className="tp-select" value={filterGender} onChange={e => setFilterGender(e.target.value)} style={{ minHeight: 44 }}>
              <option value="">All Genders</option>
              <option value="male">♂ Male</option>
              <option value="female">♀ Female</option>
            </select>
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginTop: 10 }}>
          Showing {filtered.length} student{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* ── LIST VIEW ── */}
      {isLoading ? (
        <div className="tp-loading">
          <div className="tp-spinner" />
          Loading your students…
        </div>
      ) : filtered.length === 0 ? (
        <div className="tp-card">
          <div className="tp-empty">
            <div className="tp-empty-icon">🎓</div>
            <div className="tp-empty-title">No students found</div>
            <p className="tp-empty-sub">Try adjusting your filters or ask admin to assign classes.</p>
          </div>
        </div>
      ) : (
        <div className="tp-card">
          <div style={{ padding: '0' }}>
            {filtered.map((s, i) => (
              <div key={s.id} className="tp-student-row" style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'stretch' }}>
                
                {/* Main Info Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ position: 'relative' }}>
                    {s.photo_url ? (
                      <img loading="lazy" src={s.photo_url} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div className="tp-avatar" style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #4C1D95, #312E81)', fontSize: 16 }}>
                        {s.full_name.charAt(0)}
                      </div>
                    )}
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {s.full_name}
                      </div>
                      {s.user_id ? (
                        <span className="tp-badge tp-badge-green" style={{ fontSize: 9 }}>Login OK</span>
                      ) : (
                        <span className="tp-badge tp-badge-amber" style={{ fontSize: 9 }}>No Login</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)' }}>{s.student_id ?? 'No ID'}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>•</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>{s.class?.name ?? 'No Class'}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>•</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.gender === 'male' ? '♂ Male' : s.gender === 'female' ? '♀ Female' : '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Actions Row (Wraps on mobile) */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingLeft: 58 }}>
                  <button 
                    className="tp-btn tp-btn-ghost" 
                    onClick={() => { setViewingStudent(s); setViewModal(true) }}
                    style={{ minHeight: 36, padding: '6px 12px', fontSize: 12 }}
                  >
                    👤 Profile
                  </button>
                  
                  {!s.user_id && (
                    <button 
                      className="tp-btn" 
                      onClick={() => { setAccountStudent(s); setAccountData(prev => ({ ...prev, email: s.guardian_email || '' })); setAccountModalOpen(true) }}
                      style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', minHeight: 36, padding: '6px 12px', fontSize: 12 }}
                    >
                      🗝️ Create Login
                    </button>
                  )}
                  <button 
                    className="tp-btn" 
                    onClick={() => { setAccountStudent(s); setParentData(prev => ({ ...prev, email: s.guardian_email || '' })); setParentModalOpen(true) }}
                    style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', minHeight: 36, padding: '6px 12px', fontSize: 12 }}
                  >
                    👨‍👩‍👦 Parent Portal
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── VIEW MODAL ── */}
      <Modal open={viewModal} onClose={() => setViewModal(false)} title="Student Profile" size="md">
        {viewingStudent && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', background: 'var(--bg-hover)', borderRadius: 12, marginBottom: 18 }}>
              <div style={{ position: 'relative' }}>
                {viewingStudent.photo_url ? (
                  <img loading="lazy" src={viewingStudent.photo_url} alt="Profile" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                ) : (
                  <div className="tp-avatar" style={{ width: 56, height: 56, fontSize: 20 }}>
                    {viewingStudent.full_name.charAt(0)}
                  </div>
                )}
                <button 
                  onClick={() => photoInputRef.current?.click()}
                  disabled={photoUploading}
                  style={{ position: 'absolute', bottom: -4, right: -4, width: 26, height: 26, borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: 12 }}
                  title="Upload Photo"
                >
                  {photoUploading ? '⏳' : '📷'}
                </button>
                <input ref={photoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handlePhotoUpload(e, viewingStudent)} />
              </div>
              <div>
                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{viewingStudent.full_name}</h3>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{viewingStudent.class?.name ?? 'No class assigned'}</div>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              {[
                { label: 'Date of Birth', value: formatDate(viewingStudent.date_of_birth) },
                { label: 'Guardian', value: viewingStudent.guardian_name },
                { label: 'Guardian Phone', value: viewingStudent.guardian_phone },
                { label: 'Guardian Email', value: viewingStudent.guardian_email },
                { label: 'Address', value: viewingStudent.address },
              ].map(({ label, value }) => value && (
                <div key={label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '12px 14px' }}>
                  <div className="tp-label">{label}</div>
                  <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 600 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* ── CREATE ACCOUNT MODAL ── */}
      <Modal open={accountModalOpen} onClose={() => setAccountModalOpen(false)} 
        title="Create Student Login" 
        subtitle={`Set up a secure login for ${accountStudent?.full_name}`}
        footer={<>
          <button className="tp-btn tp-btn-ghost" onClick={() => setAccountModalOpen(false)}>Cancel</button>
          <button className="tp-btn tp-btn-primary" onClick={handleCreateAccount} disabled={accountLoading}>
            {accountLoading ? 'Creating…' : 'Create Account'}
          </button>
        </>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="tp-alert tp-alert-warning">
            <span>⚠️</span>
            <span style={{ fontSize: 12 }}>This student will be able to log in to see their dashboard and results.</span>
          </div>
          
          <div>
            <label className="tp-label">Login Email</label>
            <input 
              type="email" 
              className="tp-input"
              placeholder="student@school.com" 
              value={accountData.email}
              onChange={e => setAccountData(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="tp-label">Set Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                className="tp-input"
                placeholder="Choose a password" 
                value={accountData.password}
                onChange={e => setAccountData(prev => ({ ...prev, password: e.target.value }))}
              />
              <button 
                type="button"
                onClick={() => setAccountData(prev => ({ ...prev, password: Math.random().toString(36).slice(-8) }))}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: '#EEF2FF', border: 'none', borderRadius: 8, padding: '6px 10px', fontSize: 11, fontWeight: 800, color: '#4338CA', cursor: 'pointer' }}
              >Generate</button>
            </div>
          </div>
        </div>
      </Modal>

      {/* ── CREATE PARENT ACCOUNT MODAL ── */}
      <Modal open={parentModalOpen} onClose={() => setParentModalOpen(false)} 
        title="Generate Parent Login" 
        subtitle={`Set up parent access for ${accountStudent?.full_name}`}
        footer={<>
          <button className="tp-btn tp-btn-ghost" onClick={() => setParentModalOpen(false)}>Cancel</button>
          <button className="tp-btn tp-btn-primary" onClick={handleCreateParentAccount} disabled={accountLoading}>
            {accountLoading ? 'Linking…' : 'Link Parent Account'}
          </button>
        </>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="tp-alert tp-alert-info">
            <span>ℹ️</span>
            <span style={{ fontSize: 12 }}>If the parent already has an account for another child, use the same email address to link them automatically!</span>
          </div>
          
          <div>
            <label className="tp-label">Parent Email Address</label>
            <input 
              type="email" 
              className="tp-input"
              placeholder="parent@example.com" 
              value={parentData.email}
              onChange={e => setParentData(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="tp-label">Initial Password (Required for new parents)</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                className="tp-input"
                placeholder="Choose a password" 
                value={parentData.password}
                onChange={e => setParentData(prev => ({ ...prev, password: e.target.value }))}
              />
              <button 
                type="button"
                onClick={() => setParentData(prev => ({ ...prev, password: Math.random().toString(36).slice(-8) }))}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: '#EEF2FF', border: 'none', borderRadius: 8, padding: '6px 10px', fontSize: 11, fontWeight: 800, color: '#4338CA', cursor: 'pointer' }}
              >Generate</button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
