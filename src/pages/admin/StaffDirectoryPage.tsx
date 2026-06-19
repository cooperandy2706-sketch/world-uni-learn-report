// src/pages/admin/StaffDirectoryPage.tsx
import { useState, useMemo, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useSettings, useCurrentTerm } from '../../hooks/useSettings'
import Modal from '../../components/ui/Modal'
import toast from 'react-hot-toast'
import {
  Users, UserPlus, FileText, Printer, KeyRound, Edit2, 
  Trash2, Briefcase, ShieldCheck, Download, Search, Eye, EyeOff
} from 'lucide-react'

// Letter Generation Imports
import { 
  LETTER_TYPES, LETTER_FIELDS, generateLetterHTML, LetterTypeId
} from '../../utils/hrLetters'

function Btn({ children, onClick, variant = 'primary', disabled, loading, style }: any) {
  const [h, setH] = useState(false)
  const v: any = {
    primary: { background: h ? '#4338ca' : 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', border: 'none' },
    secondary: { background: h ? 'var(--bg-input)' : 'var(--bg-card)', color: 'var(--text-main)', border: '1.5px solid var(--border-color)' },
    danger: { background: h ? '#b91c1c' : '#dc2626', color: '#fff', border: 'none' },
  }
  return (
    <button onClick={onClick} disabled={disabled} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all .15s', opacity: disabled ? 0.6 : 1, fontFamily: '"DM Sans",sans-serif', ...v[variant], ...style }}>
      {loading && <span style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', animation: '_spin .7s linear infinite', flexShrink: 0 }} />}
      {children}
    </button>
  )
}

function Avatar({ name, size = 48 }: { name: string; size?: number }) {
  const colors = ['#6d28d9', '#0891b2', '#16a34a', '#d97706', '#dc2626', '#0f766e']
  const c = colors[(name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % colors.length]
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(135deg,${c},${c}99)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * .38, fontWeight: 900, color: '#fff', boxShadow: `0 3px 10px ${c}40`
    }}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

const INITIAL_FORM = { full_name: '', email: '', phone: '', designation: '', password: '', role: 'teacher', employment_type: 'full_time' }

export default function StaffDirectoryPage() {
  const { user } = useAuth()
  const { data: settings } = useSettings()
  const { data: term } = useCurrentTerm()
  const qc = useQueryClient()
  const schoolId = user?.school_id ?? ''

  // -- State
  const [activeTab, setActiveTab] = useState<'teaching' | 'administrative' | 'support'>('teaching')
  const [search, setSearch] = useState('')
  const [createModal, setCreateModal] = useState(false)
  const [resetModal, setResetModal] = useState(false)
  const [letterModal, setLetterModal] = useState(false)
  const [assignModal, setAssignModal] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const [selectedStaff, setSelectedStaff] = useState<any>(null)
  const [newPw, setNewPw] = useState('')
  const [form, setForm] = useState(INITIAL_FORM)
  const [isSaving, setIsSaving] = useState(false)

  // Assignment State (for teacher)
  const [assignTeacherId, setAssignTeacherId] = useState<string | null>(null)
  const [selectedClasses, setSelectedClasses] = useState<string[]>([])
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [isSavingAssign, setIsSavingAssign] = useState(false)

  // HR Letter State
  const [lType, setLType] = useState<LetterTypeId>('appointment')
  const [lFields, setLFields] = useState<Record<string, string>>({})
  const [printingLetter, setPrintingLetter] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // -- Data Fetching
  const { data: teachers = [], isLoading: isLoadingT } = useQuery({
    queryKey: ['staff-teachers', schoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teachers')
        .select('id, staff_id, qualification, employment_type, user:users!inner(id, full_name, email, phone, role)')
        .eq('school_id', schoolId)
      if (error) throw error
      return (data || []).map(t => ({
        ...t.user,
        teacher_id: t.id,
        staff_id: t.staff_id,
        qualification: t.qualification,
        employment_type: t.employment_type || 'full_time',
        designation: 'Teacher',
        category: 'teaching'
      }))
    },
    enabled: !!schoolId,
  })

  const { data: nonTeachers = [], isLoading: isLoadingNT } = useQuery({
    queryKey: ['staff-non-teachers', schoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, phone, role, designation')
        .eq('school_id', schoolId)
        .in('role', ['staff', 'nurse', 'librarian', 'proprietor', 'bursar', 'security', 'driver'])
      if (error) throw error
      
      return (data || []).map(u => {
        let category = 'support'
        if (['proprietor', 'bursar', 'librarian'].includes(u.role)) category = 'administrative'
        if (['nurse'].includes(u.role)) category = 'administrative'
        return { ...u, category, staff_id: `STAFF-${u.id.substring(0,4).toUpperCase()}` }
      })
    },
    enabled: !!schoolId,
  })

  // Classes and Subjects for assignment
  const { data: classes = [] } = useQuery({
    queryKey: ['classes-list', schoolId],
    queryFn: async () => {
      const { data } = await supabase.from('classes').select('id, name').eq('school_id', schoolId).order('name')
      return data ?? []
    },
    enabled: !!schoolId,
  })

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects-list', schoolId],
    queryFn: async () => {
      const { data } = await supabase.from('subjects').select('id, name, code').eq('school_id', schoolId).order('name')
      return data ?? []
    },
    enabled: !!schoolId,
  })

  const allStaff = useMemo(() => [...teachers, ...nonTeachers], [teachers, nonTeachers])
  const isLoading = isLoadingT || isLoadingNT

  // -- Filtering
  const filteredStaff = useMemo(() => {
    return allStaff.filter(s => {
      if (s.category !== activeTab) return false
      if (search) {
        const q = search.toLowerCase()
        return (s.full_name || '').toLowerCase().includes(q) || 
               (s.email || '').toLowerCase().includes(q) ||
               (s.staff_id || '').toLowerCase().includes(q)
      }
      return true
    }).sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''))
  }, [allStaff, activeTab, search])

  // -- Actions
  async function handleCreate() {
    if (!form.full_name || !form.email) { toast.error('Name and email required'); return }
    if (!form.password || form.password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setIsSaving(true)
    const toastId = toast.loading('Creating staff account...')
    try {
      // ALL roles (including teacher) now correctly use 'create-user'
      const { data, error } = await supabase.functions.invoke('admin-ops', {
        body: {
          action: 'create-user',
          payload: {
            email: form.email,
            password: form.password,
            full_name: form.full_name,
            role: form.role,
            phone: form.phone,
            designation: form.designation,
            target_school_id: schoolId,
            metadata: {
              employment_type: form.employment_type,
            }
          }
        }
      })
      if (error || data?.error) throw new Error(error?.message || data?.error)

      toast.success('Staff account created! You can now assign classes & subjects.', { id: toastId, duration: 4000 })
      qc.invalidateQueries({ queryKey: ['staff-teachers', schoolId] })
      qc.invalidateQueries({ queryKey: ['staff-non-teachers', schoolId] })
      setCreateModal(false)
      setForm(INITIAL_FORM)
      setShowPassword(false)

      // If it's a teacher, open assignment panel after a short delay
      if (form.role === 'teacher') {
        // Re-fetch teachers to get the new teacher record, then open assign modal
        setTimeout(async () => {
          await qc.invalidateQueries({ queryKey: ['staff-teachers', schoolId] })
        }, 1000)
        toast('💡 Tip: Use the 📚 button on the teacher card to assign classes & subjects.', { duration: 6000 })
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to create staff', { id: toastId })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSaveAssignments() {
    if (!assignTeacherId || !term?.id) {
      toast.error('No active term found. Please set a current term first.')
      return
    }
    setIsSavingAssign(true)
    const toastId = toast.loading('Saving assignments...')
    try {
      // Delete existing assignments for this teacher in this term
      await supabase.from('teacher_assignments')
        .delete()
        .eq('teacher_id', assignTeacherId)
        .eq('term_id', term.id)

      // Create new cross product of class × subject assignments
      const rows: any[] = []
      for (const classId of selectedClasses) {
        for (const subjectId of selectedSubjects) {
          rows.push({
            teacher_id: assignTeacherId,
            class_id: classId,
            subject_id: subjectId,
            term_id: term.id,
            school_id: schoolId,
            is_class_teacher: false,
          })
        }
      }

      if (rows.length > 0) {
        const { error } = await supabase.from('teacher_assignments').insert(rows)
        if (error) throw error
      }

      toast.success(`Saved ${rows.length} assignment(s) for this teacher`, { id: toastId })
      setAssignModal(false)
      setAssignTeacherId(null)
      setSelectedClasses([])
      setSelectedSubjects([])
    } catch (e: any) {
      toast.error(e.message || 'Failed to save assignments', { id: toastId })
    } finally {
      setIsSavingAssign(false)
    }
  }

  function openAssignModal(s: any) {
    setSelectedStaff(s)
    setAssignTeacherId(s.teacher_id)
    setSelectedClasses([])
    setSelectedSubjects([])
    setAssignModal(true)

    // Pre-load existing assignments
    if (s.teacher_id && term?.id) {
      supabase.from('teacher_assignments')
        .select('class_id, subject_id')
        .eq('teacher_id', s.teacher_id)
        .eq('term_id', term.id)
        .then(({ data }) => {
          if (data) {
            setSelectedClasses([...new Set(data.map(r => r.class_id).filter(Boolean))])
            setSelectedSubjects([...new Set(data.map(r => r.subject_id).filter(Boolean))])
          }
        })
    }
  }

  async function handleDelete(s: any) {
    if (!confirm(`Remove ${s.full_name}? This action cannot be undone.`)) return
    const toastId = toast.loading('Removing account...')
    try {
      if (s.role === 'teacher') {
        const { error } = await supabase.functions.invoke('admin-ops', {
          body: { action: 'delete-user', payload: { target_user_id: s.id, role: 'teacher', specific_ids: { teacher_id: s.teacher_id } } }
        })
        if (error) throw error
      } else {
        const { error } = await supabase.functions.invoke('admin-ops', {
          body: { action: 'delete-user', payload: { target_user_id: s.id, role: s.role } }
        })
        if (error) throw error
      }
      toast.success('Account removed', { id: toastId })
      qc.invalidateQueries({ queryKey: ['staff-teachers', schoolId] })
      qc.invalidateQueries({ queryKey: ['staff-non-teachers', schoolId] })
    } catch (e: any) { toast.error(e.message, { id: toastId }) }
  }

  async function handleResetPassword() {
    if (!newPw || newPw.length < 6) { toast.error('Min 6 characters'); return }
    const toastId = toast.loading('Resetting password...')
    try {
      const { error } = await supabase.functions.invoke('admin-ops', {
        body: { action: 'reset-password', payload: { target_user_id: selectedStaff.id, password: newPw } }
      })
      if (error) throw error
      toast.success('Password reset', { id: toastId })
      setResetModal(false)
    } catch (e: any) { toast.error(e.message, { id: toastId }) }
  }

  function handlePrintLetter() {
    setPrintingLetter(true)
    setTimeout(() => {
      const w = iframeRef.current?.contentWindow
      if (w) { w.focus(); w.print() }
      setPrintingLetter(false)
    }, 800)
  }

  function toggleClass(id: string) {
    setSelectedClasses(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  function toggleSubject(id: string) {
    setSelectedSubjects(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  return (
    <div style={{ animation: '_fadein .4s ease', paddingBottom: 60 }}>
      <style>{`
        @keyframes _spin { to{transform:rotate(360deg)} }
        @keyframes _fadein { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .tab-btn { padding: 10px 20px; font-weight: 600; font-size: 14px; cursor: pointer; transition: all .2s; border-bottom: 2px solid transparent; color: var(--text-muted); }
        .tab-btn.active { color: #4f46e5; border-bottom-color: #4f46e5; }
        .staff-card { background: var(--bg-card); border: 1.5px solid var(--border-color); border-radius: 8px; padding: 20px; transition: all .2s; position: relative; overflow: hidden; }
        .staff-card:hover { border-color: #c7d2fe; box-shadow: 0 8px 24px rgba(99,102,241,.08); transform: translateY(-2px); }
        .action-btn { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all .15s; border: none; background: transparent; }
        .action-btn:hover { background: var(--bg-input); }
        .chip-btn { display: inline-flex; align-items: center; gap: 4px; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all .15s; border: 1.5px solid; }
        .chip-btn.selected { background: #ede9fe; border-color: #7c3aed; color: #5b21b6; }
        .chip-btn:not(.selected) { background: var(--bg-card); border-color: var(--border-color); color: var(--text-muted); }
        .chip-btn:not(.selected):hover { border-color: #c4b5fd; color: #7c3aed; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 28, fontWeight: 700, margin: '0 0 4px', color: 'var(--text-main)' }}>Staff Directory</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14 }}>Unified management for all teaching and non-teaching personnel.</p>
        </div>
        <Btn onClick={() => { setForm(INITIAL_FORM); setShowPassword(false); setCreateModal(true) }}><UserPlus size={16} /> Add Staff Member</Btn>
      </div>

      {/* Tabs & Search */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, borderBottom: '1.5px solid var(--border-color)', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <div className={`tab-btn ${activeTab === 'teaching' ? 'active' : ''}`} onClick={() => setActiveTab('teaching')}>
            👨‍🏫 Teaching Staff ({teachers.length})
          </div>
          <div className={`tab-btn ${activeTab === 'administrative' ? 'active' : ''}`} onClick={() => setActiveTab('administrative')}>
            💼 Administrative ({nonTeachers.filter(s => s.category === 'administrative').length})
          </div>
          <div className={`tab-btn ${activeTab === 'support' ? 'active' : ''}`} onClick={() => setActiveTab('support')}>
            🛠 Support Staff ({nonTeachers.filter(s => s.category === 'support').length})
          </div>
        </div>
        <div style={{ marginLeft: 'auto', position: 'relative' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 12 }} />
          <input 
            type="text" 
            placeholder="Search name, ID or email..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '10px 16px 10px 36px', borderRadius: 12, border: '1.5px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: 13, width: 260, outline: 'none' }}
          />
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>Loading directory...</div>
      ) : filteredStaff.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', background: 'var(--bg-card)', borderRadius: 8, border: '1.5px dashed var(--border-color)' }}>
          <Users size={48} color="var(--text-muted)" style={{ marginBottom: 16, opacity: 0.5 }} />
          <h3 style={{ margin: '0 0 8px', color: 'var(--text-main)', fontSize: 18 }}>No Staff Found</h3>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>No personnel match the current filters.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {filteredStaff.map((s) => (
            <div key={s.id} className="staff-card">
              <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(99,102,241,0.1), transparent)', pointerEvents: 'none' }} />
              
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <Avatar name={s.full_name || 'Staff'} size={56} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.full_name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>{s.email}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: 'var(--bg-input)', color: '#4f46e5', border: '1px solid #c7d2fe' }}>
                      {s.designation || s.role.toUpperCase()}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.staff_id}</span>
                    {s.employment_type && s.employment_type !== 'full_time' && (
                      <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '.04em', background: s.employment_type === 'part_time' ? '#fffbeb' : '#f5f3ff', color: s.employment_type === 'part_time' ? '#b45309' : '#6d28d9' }}>
                        {s.employment_type === 'part_time' ? 'Part Time' : 'Contract'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {s.phone && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>📞 {s.phone}</div>}

              <div style={{ display: 'flex', gap: 8, borderTop: '1.5px solid var(--border-color)', paddingTop: 16, marginTop: 'auto' }}>
                <button className="action-btn" onClick={() => { setSelectedStaff(s); setLType('appointment'); setLFields({}); setLetterModal(true) }} style={{ flex: 1, color: '#4f46e5', background: 'rgba(79,70,229,0.08)' }}>
                  <FileText size={14} /> HR Letter
                </button>
                {s.role === 'teacher' && (
                  <button className="action-btn" onClick={() => openAssignModal(s)} style={{ color: '#059669', border: '1px solid #bbf7d0' }} title="Assign Classes & Subjects">
                    📚
                  </button>
                )}
                <button className="action-btn" onClick={() => { setSelectedStaff(s); setNewPw(''); setResetModal(true) }} style={{ color: '#d97706', border: '1px solid #fde68a' }}>
                  <KeyRound size={14} />
                </button>
                <button className="action-btn" onClick={() => handleDelete(s)} style={{ color: '#dc2626', border: '1px solid #fecaca' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── CREATE MODAL ── */}
      <Modal open={createModal} onClose={() => { setCreateModal(false); setShowPassword(false) }} title="Add Staff Member" size="md"
        footer={<><Btn variant="secondary" onClick={() => { setCreateModal(false); setShowPassword(false) }}>Cancel</Btn><Btn onClick={handleCreate} loading={isSaving}>Create Account</Btn></>}>
        <div style={{ display: 'grid', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>System Role *</label>
            <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: 14 }}>
              <option value="teacher">Teacher (Academic Access)</option>
              <option value="bursar">Bursar (Finance Access)</option>
              <option value="nurse">Nurse (Medical Access)</option>
              <option value="librarian">Librarian (Library Access)</option>
              <option value="staff">General Support Staff (No Portal Access)</option>
              <option value="driver">Driver (Fleet Access)</option>
              <option value="security">Security (Gate Access)</option>
              <option value="proprietor">Proprietor (Executive Access)</option>
            </select>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Full Name *</label>
              <input type="text" value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} placeholder="John Doe" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: 14, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Email Address *</label>
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="email@school.com" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: 14, boxSizing: 'border-box' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Phone Number</label>
              <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="024 000 0000" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: 14, boxSizing: 'border-box' }} />
            </div>
            {form.role !== 'teacher' && (
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Job Title / Designation</label>
                <input type="text" value={form.designation} onChange={e => setForm(p => ({ ...p, designation: e.target.value }))} placeholder="e.g. Head Cook" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: 14, boxSizing: 'border-box' }} />
              </div>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Login Password *</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="Min. 6 characters"
                style={{ width: '100%', padding: '10px 42px 10px 14px', borderRadius: 10, border: '1.5px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: 14, boxSizing: 'border-box' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>The staff member will use this password to log in to their portal.</p>
          </div>

          {form.role === 'teacher' && (
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Employment Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {[{ val: 'full_time', label: 'Full Time', icon: '🏢' }, { val: 'part_time', label: 'Part Time', icon: '🕐' }, { val: 'contract', label: 'Contract', icon: '📄' }].map(opt => (
                  <div key={opt.val} onClick={() => setForm(p => ({ ...p, employment_type: opt.val }))}
                    style={{ padding: '10px 6px', borderRadius: 10, border: `2px solid ${form.employment_type === opt.val ? '#4f46e5' : '#e5e7eb'}`, background: form.employment_type === opt.val ? '#eef2ff' : '#fff', textAlign: 'center', cursor: 'pointer', transition: 'all .15s' }}>
                    <div style={{ fontSize: 18, marginBottom: 3 }}>{opt.icon}</div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: form.employment_type === opt.val ? '#4338ca' : '#374151' }}>{opt.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#16a34a' }}>
            ✅ Account will be created immediately. {form.role === 'teacher' ? 'After saving, use the 📚 button to assign classes and subjects.' : 'The staff member can log in right away.'}
          </div>
        </div>
      </Modal>

      {/* ── ASSIGN CLASSES & SUBJECTS MODAL ── */}
      <Modal
        open={assignModal}
        onClose={() => { setAssignModal(false); setAssignTeacherId(null) }}
        title="Assign Classes & Subjects"
        subtitle={selectedStaff?.full_name}
        size="lg"
        footer={<><Btn variant="secondary" onClick={() => { setAssignModal(false); setAssignTeacherId(null) }}>Cancel</Btn><Btn onClick={handleSaveAssignments} loading={isSavingAssign}>Save Assignments</Btn></>}
      >
        {!term && (
          <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 16px', color: '#92400e', marginBottom: 16 }}>
            ⚠️ No active term found. Please set a current academic term first before making assignments.
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Classes */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#7c3aed', marginBottom: 12 }}>
              🏫 Classes ({selectedClasses.length} selected)
            </p>
            {classes.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No classes created yet.</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
                {(classes as any[]).map((cls: any) => (
                  <button
                    key={cls.id}
                    className={`chip-btn ${selectedClasses.includes(cls.id) ? 'selected' : ''}`}
                    onClick={() => toggleClass(cls.id)}
                  >
                    {selectedClasses.includes(cls.id) ? '✓ ' : ''}{cls.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Subjects */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#059669', marginBottom: 12 }}>
              📚 Subjects ({selectedSubjects.length} selected)
            </p>
            {subjects.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No subjects created yet.</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
                {(subjects as any[]).map((sub: any) => (
                  <button
                    key={sub.id}
                    className={`chip-btn ${selectedSubjects.includes(sub.id) ? 'selected' : ''}`}
                    onClick={() => toggleSubject(sub.id)}
                    style={selectedSubjects.includes(sub.id) ? { background: '#ecfdf5', borderColor: '#10b981', color: '#065f46' } : {}}
                  >
                    {selectedSubjects.includes(sub.id) ? '✓ ' : ''}{sub.name} {sub.code ? `(${sub.code})` : ''}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {selectedClasses.length > 0 && selectedSubjects.length > 0 && (
          <div style={{ marginTop: 16, padding: '12px 16px', background: '#f5f3ff', borderRadius: 10, border: '1px solid #ede9fe' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#5b21b6', margin: 0 }}>
              📝 This will create <strong>{selectedClasses.length * selectedSubjects.length}</strong> assignments — teaching <strong>{selectedSubjects.length}</strong> subject(s) across <strong>{selectedClasses.length}</strong> class(es) for the current term.
            </p>
          </div>
        )}
      </Modal>

      {/* HR Letter Modal */}
      <Modal open={letterModal} onClose={() => setLetterModal(false)} title="Generate HR Document" subtitle={selectedStaff?.full_name} size="lg"
        footer={<><Btn variant="secondary" onClick={() => setLetterModal(false)}>Cancel</Btn><Btn onClick={handlePrintLetter} loading={printingLetter}><Printer size={16}/> Print Document</Btn></>}>
        
        <div style={{ display: 'flex', gap: 24 }}>
          {/* Controls */}
          <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Document Type</label>
              <select value={lType} onChange={e => { setLType(e.target.value as LetterTypeId); setLFields({}) }} style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: 14 }}>
                {LETTER_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
              </select>
            </div>

            <div style={{ background: 'var(--bg-input)', padding: 16, borderRadius: 12, border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 12px', color: 'var(--text-main)' }}>Fill Document Details</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {LETTER_FIELDS[lType]?.map(f => (
                  <div key={f.key}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>{f.label}</label>
                    {f.key === 'content' ? (
                      <textarea value={lFields[f.key] || ''} onChange={e => setLFields(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: 13, minHeight: 80, resize: 'vertical' }} />
                    ) : (
                      <input type={f.type || 'text'} value={lFields[f.key] || ''} onChange={e => setLFields(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: 13 }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div style={{ flex: 1, background: '#e5e7eb', borderRadius: 12, padding: 16, border: '1px solid #d1d5db', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', overflowY: 'auto', maxHeight: '60vh' }}>
            <div style={{ width: '100%', maxWidth: '210mm', background: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', minHeight: '297mm' }}>
              <iframe
                ref={iframeRef}
                srcDoc={generateLetterHTML(lType, selectedStaff, lFields, settings?.school)}
                style={{ width: '100%', height: '100%', border: 'none', display: 'block', minHeight: '297mm' }}
                title="Print Preview"
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Password Reset Modal */}
      <Modal open={resetModal} onClose={() => setResetModal(false)} title="Reset Password" subtitle={selectedStaff?.full_name} size="sm"
        footer={<><Btn variant="secondary" onClick={() => setResetModal(false)}>Cancel</Btn><Btn variant="danger" onClick={handleResetPassword}>Reset Access</Btn></>}>
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 12, color: '#b91c1c', fontSize: 13 }}>
            This will immediately revoke their current password. They will need the new password to log in.
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>New Password</label>
            <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="At least 6 characters" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: 14 }} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
