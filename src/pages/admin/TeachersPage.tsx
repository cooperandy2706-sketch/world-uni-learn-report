// src/pages/admin/TeachersPage.tsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '../../lib/supabase'
import { useTeachers, useTeacherAssignments } from '../../hooks/useSettings'
import { useClasses } from '../../hooks/useClasses'
import { useSubjects } from '../../hooks/useSubjects'
import { useCurrentTerm } from '../../hooks/useSettings'
import { useAuth } from '../../hooks/useAuth'
import { teachersService } from '../../services/index'
import Modal from '../../components/ui/Modal'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

const teacherSchema = z.object({
  full_name:      z.string().min(2, 'Name is required'),
  email:          z.string().email('Valid email required'),
  password:       z.string().min(6, 'Min 6 characters').optional().or(z.literal('')),
  phone:          z.string().optional(),
  staff_id:       z.string().optional(),
  qualification:  z.string().optional(),
})
type TeacherForm = z.infer<typeof teacherSchema>

// ── shared primitives ─────────────────────────────────────
function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const colors = ['#6d28d9','#0891b2','#16a34a','#d97706','#dc2626','#7c3aed']
  const color = colors[(name.charCodeAt(0) + name.charCodeAt(1)) % colors.length]
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(135deg,${color},${color}bb)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 900, color: '#fff',
      boxShadow: `0 3px 10px ${color}40`,
    }}>{name.charAt(0).toUpperCase()}</div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 5 }}>{children}</label>
}

function StyledInput({ error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  const [f, setF] = useState(false)
  return (
    <div>
      <input {...props} onFocus={e => { setF(true); props.onFocus?.(e) }} onBlur={e => { setF(false); props.onBlur?.(e) }}
        style={{ width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 13, border: `1.5px solid ${error ? '#f87171' : f ? '#7c3aed' : '#e5e7eb'}`, boxShadow: f ? '0 0 0 3px rgba(109,40,217,0.1)' : 'none', outline: 'none', background: '#fff', color: '#111827', fontFamily: '"DM Sans",sans-serif', transition: 'all 0.15s', boxSizing: 'border-box' as const }} />
      {error && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>⚠ {error}</p>}
    </div>
  )
}

function StyledSelect({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const [f, setF] = useState(false)
  return (
    <select {...props} onFocus={e => { setF(true); props.onFocus?.(e) }} onBlur={e => { setF(false); props.onBlur?.(e) }}
      style={{ width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 13, border: `1.5px solid ${f ? '#7c3aed' : '#e5e7eb'}`, boxShadow: f ? '0 0 0 3px rgba(109,40,217,0.1)' : 'none', outline: 'none', background: '#fff', color: '#111827', fontFamily: '"DM Sans",sans-serif', cursor: 'pointer', boxSizing: 'border-box' as const }}>
      {children}
    </select>
  )
}

function Btn({ children, onClick, variant = 'primary', type = 'button', disabled, loading, style, form }: any) {
  const [hov, setHov] = useState(false)
  const variants: Record<string, React.CSSProperties> = {
    primary:   { background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', boxShadow: '0 2px 8px rgba(109,40,217,0.28)', border: 'none' },
    secondary: { background: hov ? '#f5f3ff' : '#fff', color: '#374151', border: '1.5px solid #e5e7eb' },
    danger:    { background: hov ? '#b91c1c' : '#dc2626', color: '#fff', border: 'none', boxShadow: '0 2px 6px rgba(220,38,38,0.22)' },
    ghost:     { background: hov ? '#f5f3ff' : 'transparent', color: '#6b7280', border: 'none' },
    success:   { background: hov ? '#15803d' : '#16a34a', color: '#fff', border: 'none' },
  }
  return (
    <button type={type} form={form} onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.15s', opacity: disabled ? 0.6 : 1, fontFamily: '"DM Sans",sans-serif', ...variants[variant], ...style }}>
      {loading && <span style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: '_spin 0.7s linear infinite', flexShrink: 0 }} />}
      {children}
    </button>
  )
}

// ── assignment pill ───────────────────────────────────────
function AssignPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 99, padding: '4px 10px 4px 12px', fontSize: 12, fontWeight: 600, color: '#5b21b6' }}>
      {label}
      <button onClick={onRemove} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{ width: 16, height: 16, borderRadius: '50%', border: 'none', cursor: 'pointer', background: hov ? '#dc2626' : '#ddd6fe', color: hov ? '#fff' : '#6d28d9', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>✕</button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
export default function TeachersPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const { data: teachers = [], isLoading } = useTeachers()
  const { data: classes = [] } = useClasses()
  const { data: subjects = [] } = useSubjects()
  const { data: term } = useCurrentTerm()

  const [modalOpen, setModalOpen] = useState(false)
  const [assignModal, setAssignModal] = useState(false)
  const [viewModal, setViewModal] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<any>(null)
  const [assigningTeacher, setAssigningTeacher] = useState<any>(null)
  const [viewingTeacher, setViewingTeacher] = useState<any>(null)
  const [newClassId, setNewClassId] = useState('')
  const [newSubjectId, setNewSubjectId] = useState('')
  const [isClassTeacher, setIsClassTeacher] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [search, setSearch] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)

  const { data: assignments = [] } = useTeacherAssignments(assigningTeacher?.id ?? '', term?.id ?? '')

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<TeacherForm>({ resolver: zodResolver(teacherSchema) })

  const filtered = teachers.filter(t => {
    const q = search.toLowerCase()
    return !q || t.user?.full_name?.toLowerCase().includes(q) || t.user?.email?.toLowerCase().includes(q) || t.staff_id?.toLowerCase().includes(q)
  })

  function openCreate() { setEditingTeacher(null); reset({}); setModalOpen(true) }
  function openEdit(t: any) {
    setEditingTeacher(t)
    reset({ full_name: t.user?.full_name ?? '', email: t.user?.email ?? '', phone: t.user?.phone ?? '', staff_id: t.staff_id ?? '', qualification: t.qualification ?? '', password: '' })
    setModalOpen(true)
  }

  const [resetModal, setResetModal] = useState(false)
  const [resetTeacher, setResetTeacher] = useState<any>(null)
  const [newPassword, setNewPassword] = useState('')
  const [resetting, setResetting] = useState(false)

  async function onSubmit(data: TeacherForm) {
    try {
      if (editingTeacher) {
        await supabase.from('users').update({ full_name: data.full_name, phone: data.phone }).eq('id', editingTeacher.user_id)
        await supabase.from('teachers').update({ staff_id: data.staff_id, qualification: data.qualification }).eq('id', editingTeacher.id)
        toast.success('Teacher updated')
      } else {
        const pw = data.password || 'Teacher@123'
        const { data: result, error: fnError } = await supabase.rpc('create_teacher_account', {
          p_email:         data.email,
          p_password:      pw,
          p_full_name:     data.full_name,
          p_school_id:     user!.school_id,
          p_staff_id:      data.staff_id || null,
          p_phone:         data.phone    || null,
          p_qualification: data.qualification || null,
        })
        if (fnError) throw new Error(fnError.message)
        const res = result as any
        if (res?.success === false) throw new Error(res.error ?? 'Failed to create account')
        toast.success(`✅ Created · Email: ${data.email} · Password: ${pw}`, { duration: 8000 })
      }
      qc.invalidateQueries({ queryKey: ['teachers'] })
      setModalOpen(false)
      reset({})
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to save teacher')
    }
  }

  async function handleResetPassword() {
    if (!newPassword || newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setResetting(true)
    try {
      const { data: result, error } = await supabase.rpc('reset_teacher_password', {
        p_user_id: resetTeacher.user_id,
        p_new_password: newPassword,
      })
      if (error) throw error
      const res = result as any
      if (res?.success === false) throw new Error(res.error)
      toast.success(`Password reset for ${resetTeacher.user?.full_name}`)
      setResetModal(false)
      setNewPassword('')
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to reset password')
    } finally {
      setResetting(false)
    }
  }

  async function handleDelete(t: any) {
    if (!confirm(`Remove ${t.user?.full_name}?\n\nThis will permanently delete their account and all their scores.`)) return
    try {
      // Get user_id — try multiple sources
      const userId = t.user_id ?? t.user?.id
      if (!userId) { toast.error('Cannot find user ID for this teacher'); return }

      console.log('Deleting teacher user_id:', userId, 'type:', typeof userId)

      // Delete via SQL directly to avoid type casting issues
      const { error: e1 } = await supabase.from('teacher_assignments')
        .delete().eq('teacher_id', t.id)
      console.log('Deleted assignments:', e1)

      const { error: e2 } = await supabase.from('scores')
        .delete().eq('teacher_id', t.id)
      console.log('Deleted scores:', e2)

      const { error: e3 } = await supabase.from('teachers')
        .delete().eq('id', t.id)
      console.log('Deleted teacher record:', e3)
      if (e3) throw e3

      const { error: e4 } = await supabase.from('users')
        .delete().eq('id', userId)
      console.log('Deleted user record:', e4)
      if (e4) throw e4

      // Delete auth user via RPC
      const { data: result, error: rpcError } = await supabase.rpc('delete_teacher_account', {
        p_user_id: userId,
      })
      console.log('RPC result:', result, rpcError)

      qc.invalidateQueries({ queryKey: ['teachers'] })
      toast.success(`${t.user?.full_name} removed successfully`)
    } catch (err: any) {
      console.error('Delete error:', err)
      toast.error(err?.message ?? 'Failed to delete teacher')
    }
  }

  async function addAssignment() {
    if (!newClassId || !newSubjectId || !term?.id) { toast.error('Select both class and subject'); return }
    setAssigning(true)
    try {
      await teachersService.createAssignment({ teacher_id: assigningTeacher.id, class_id: newClassId, subject_id: newSubjectId, term_id: term.id, academic_year_id: (term as any).academic_year_id, is_class_teacher: isClassTeacher })
      qc.invalidateQueries({ queryKey: ['teacher-assignments'] })
      setNewClassId(''); setNewSubjectId(''); setIsClassTeacher(false)
      toast.success('Assignment added')
    } catch { toast.error('Failed to add assignment') }
    finally { setAssigning(false) }
  }

  async function removeAssignment(id: string) {
    await teachersService.deleteAssignment(id)
    qc.invalidateQueries({ queryKey: ['teacher-assignments'] })
    toast.success('Removed')
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _spin { to{transform:rotate(360deg)} }
        @keyframes _fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes _fadeIn { from{opacity:0} to{opacity:1} }
        .t-card:hover { box-shadow:0 8px 28px rgba(109,40,217,0.14) !important; transform:translateY(-2px) !important; }
      `}</style>

      <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif', animation: '_fadeIn 0.4s ease' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>Teachers</h1>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 3 }}>{teachers.length} staff member{teachers.length !== 1 ? 's' : ''} · {term?.name ?? 'No active term'}</p>
          </div>
          <Btn onClick={openCreate}>➕ Add Teacher</Btn>
        </div>

        {/* ── Summary strip ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 22 }}>
          {[
            { label: 'Total Teachers', value: teachers.length, icon: '👨‍🏫', color: '#6d28d9', bg: '#f5f3ff' },
            { label: 'Classes Covered', value: [...new Set(teachers.flatMap((t: any) => t.assignments?.map((a: any) => a.class_id) ?? []))].length, icon: '🏫', color: '#0891b2', bg: '#ecfeff' },
            { label: 'Active Term', value: term?.name ?? '—', icon: '📆', color: '#16a34a', bg: '#f0fdf4', isText: true },
          ].map((s, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', border: '1.5px solid #f0eefe', boxShadow: '0 1px 4px rgba(109,40,217,0.06)', animation: `_fadeUp 0.4s ease ${i * 0.07}s both` }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontFamily: (s as any).isText ? '"DM Sans",sans-serif' : '"Playfair Display",serif', fontSize: (s as any).isText ? 16 : 26, fontWeight: 700, color: '#111827', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Search ── */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '12px 16px', border: '1.5px solid #f0eefe', marginBottom: 18 }}>
          <div style={{ position: 'relative', maxWidth: 360 }}>
            <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 15 }}>🔍</span>
            <input placeholder="Search teachers…" value={search} onChange={e => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
              style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: 9, fontSize: 13, border: `1.5px solid ${searchFocused ? '#7c3aed' : '#e5e7eb'}`, boxShadow: searchFocused ? '0 0 0 3px rgba(109,40,217,0.1)' : 'none', outline: 'none', background: '#faf5ff', fontFamily: '"DM Sans",sans-serif', transition: 'all 0.15s' }} />
          </div>
        </div>

        {/* ── Loading ── */}
        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #ede9fe', borderTopColor: '#6d28d9', animation: '_spin 0.8s linear infinite' }} />
            <p style={{ fontSize: 13, color: '#9ca3af' }}>Loading teachers…</p>
          </div>
        )}

        {/* ── Empty state ── */}
        {!isLoading && filtered.length === 0 && (
          <div style={{ background: '#fff', borderRadius: 16, padding: '60px 20px', textAlign: 'center', border: '1.5px solid #f0eefe' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>👨‍🏫</div>
            <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 6 }}>{search ? 'No teachers found' : 'No teachers yet'}</h3>
            <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 18 }}>{search ? 'Try a different search.' : 'Add your first staff member.'}</p>
            {!search && <Btn onClick={openCreate}>➕ Add First Teacher</Btn>}
          </div>
        )}

        {/* ── Teacher cards grid ── */}
        {!isLoading && filtered.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: 18 }}>
            {filtered.map((t, i) => (
              <div key={t.id} className="t-card"
                style={{ background: '#fff', borderRadius: 18, border: '1.5px solid #f0eefe', padding: '22px', boxShadow: '0 1px 4px rgba(109,40,217,0.07)', transition: 'all 0.22s', animation: `_fadeUp 0.35s ease ${i * 0.06}s both`, position: 'relative', overflow: 'hidden' }}>

                {/* Background accent */}
                <div style={{ position: 'absolute', top: -24, right: -24, width: 88, height: 88, borderRadius: '50%', background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)', pointerEvents: 'none' }} />

                {/* Top: avatar + info */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16, position: 'relative' }}>
                  <Avatar name={t.user?.full_name ?? '?'} size={50} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.user?.full_name}</div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.user?.email}</div>
                    <div style={{ marginTop: 6, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {t.staff_id && <span style={{ fontSize: 10, fontWeight: 700, background: '#f5f3ff', color: '#6d28d9', padding: '2px 7px', borderRadius: 99, border: '1px solid #ede9fe' }}>{t.staff_id}</span>}
                      {t.qualification && <span style={{ fontSize: 10, fontWeight: 600, background: '#f0fdf4', color: '#16a34a', padding: '2px 7px', borderRadius: 99 }}>🎓 {t.qualification}</span>}
                    </div>
                  </div>
                </div>

                {/* Info rows */}
                {t.user?.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: '#faf5ff', borderRadius: 9, marginBottom: 8, fontSize: 12, color: '#374151' }}>
                    <span>📱</span> {t.user.phone}
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 7, marginTop: 14, borderTop: '1px solid #faf5ff', paddingTop: 14 }}>
                  <button onClick={() => { setViewingTeacher(t); setViewModal(true) }}
                    style={{ padding: '8px 0', borderRadius: 9, border: 'none', background: '#f5f3ff', color: '#6d28d9', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background='#ede9fe' }} onMouseLeave={e => { e.currentTarget.style.background='#f5f3ff' }}>
                    👁️ View
                  </button>
                  <button onClick={() => { setAssigningTeacher(t); setAssignModal(true) }}
                    style={{ padding: '8px 0', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
                    📚 Assign
                  </button>
                  <button onClick={() => openEdit(t)}
                    style={{ padding: '8px 0', borderRadius: 9, border: 'none', background: '#f5f3ff', color: '#6d28d9', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background='#ede9fe' }} onMouseLeave={e => { e.currentTarget.style.background='#f5f3ff' }}>
                    ✏️ Edit
                  </button>
                </div>

                {/* Delete */}
                <button onClick={() => { setResetTeacher(t); setResetModal(true); setNewPassword('') }}
                  style={{ width: '100%', marginTop: 7, padding: '7px 0', borderRadius: 9, border: '1px solid #ddd6fe', background: 'transparent', color: '#6d28d9', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background='#f5f3ff' }} onMouseLeave={e => { e.currentTarget.style.background='transparent' }}>
                  🔑 Reset Password
                </button>
                <button onClick={() => handleDelete(t)}
                  style={{ width: '100%', marginTop: 4, padding: '7px 0', borderRadius: 9, border: '1px solid #fecaca', background: 'transparent', color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background='#fef2f2' }} onMouseLeave={e => { e.currentTarget.style.background='transparent' }}>
                  🗑️ Remove Teacher
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── ADD / EDIT MODAL ── */}
        <Modal open={modalOpen} onClose={() => setModalOpen(false)}
          title={editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
          subtitle={editingTeacher ? `Editing ${editingTeacher.user?.full_name}` : 'Creates a login account for the teacher'}
          size="md"
          footer={<>
            <Btn variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Btn>
            <Btn onClick={handleSubmit(onSubmit)} loading={isSubmitting}>{editingTeacher ? 'Save Changes' : 'Create Account'}</Btn>
          </>}
        >
          <form id="teacher-form" onSubmit={handleSubmit(onSubmit)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><FieldLabel>Full Name *</FieldLabel><StyledInput {...register('full_name')} placeholder="e.g. Mr. Kwame Asante" error={errors.full_name?.message} /></div>
              <div><FieldLabel>Email Address *</FieldLabel><StyledInput {...register('email')} type="email" placeholder="teacher@school.edu.gh" error={errors.email?.message} disabled={!!editingTeacher} /></div>
              {!editingTeacher && (
                <div>
                  <FieldLabel>Password</FieldLabel>
                  <StyledInput {...register('password')} type="password" placeholder="Default: teacher123" />
                  <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>Leave blank to use "teacher123" as default</p>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><FieldLabel>Phone</FieldLabel><StyledInput {...register('phone')} placeholder="024 000 0000" /></div>
                <div><FieldLabel>Staff ID</FieldLabel><StyledInput {...register('staff_id')} placeholder="TCH-001" /></div>
              </div>
              <div><FieldLabel>Qualification</FieldLabel><StyledInput {...register('qualification')} placeholder="e.g. B.Ed, M.Ed" /></div>
            </div>
          </form>
        </Modal>

        {/* ── ASSIGN MODAL ── */}
        <Modal open={assignModal} onClose={() => setAssignModal(false)}
          title="Class & Subject Assignments"
          subtitle={`${assigningTeacher?.user?.full_name} · ${term?.name ?? 'No active term'}`}
          size="lg"
        >
          {!term ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📆</div>
              <p style={{ fontSize: 13, color: '#9ca3af' }}>No active term. Set up a term first.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Current assignments */}
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Current Assignments</p>
                {(assignments as any[]).length === 0 ? (
                  <div style={{ padding: '18px', textAlign: 'center', background: '#faf5ff', borderRadius: 10, border: '1.5px dashed #ddd6fe' }}>
                    <p style={{ fontSize: 13, color: '#9ca3af' }}>No assignments yet for this term.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {(assignments as any[]).map((a: any) => (
                      <AssignPill
                        key={a.id}
                        label={`${a.subject?.name} · ${a.class?.name}${a.is_class_teacher ? ' (Class Teacher)' : ''}`}
                        onRemove={() => removeAssignment(a.id)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Add new */}
              <div style={{ borderTop: '1px solid #f5f3ff', paddingTop: 18 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Add New Assignment</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <FieldLabel>Class</FieldLabel>
                    <StyledSelect value={newClassId} onChange={e => setNewClassId(e.target.value)}>
                      <option value="">Select class…</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </StyledSelect>
                  </div>
                  <div>
                    <FieldLabel>Subject</FieldLabel>
                    <StyledSelect value={newSubjectId} onChange={e => setNewSubjectId(e.target.value)}>
                      <option value="">Select subject…</option>
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </StyledSelect>
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', marginBottom: 14 }}>
                  <input type="checkbox" checked={isClassTeacher} onChange={e => setIsClassTeacher(e.target.checked)} style={{ width: 16, height: 16, accentColor: '#6d28d9', cursor: 'pointer' }} />
                  <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>Set as Class Teacher for this class</span>
                </label>
                <Btn onClick={addAssignment} loading={assigning} style={{ width: '100%', justifyContent: 'center' }}>
                  ➕ Add Assignment
                </Btn>
              </div>
            </div>
          )}
        </Modal>

        {/* ── RESET PASSWORD MODAL ── */}
        <Modal open={resetModal} onClose={() => setResetModal(false)}
          title="Reset Password"
          subtitle={resetTeacher ? `Reset login password for ${resetTeacher.user?.full_name}` : ''}
          size="sm"
          footer={<>
            <Btn variant="secondary" onClick={() => setResetModal(false)}>Cancel</Btn>
            <Btn onClick={handleResetPassword} loading={resetting} disabled={newPassword.length < 6}>
              🔑 Reset Password
            </Btn>
          </>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#f5f3ff', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                {resetTeacher?.user?.full_name?.charAt(0)}
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>{resetTeacher?.user?.full_name}</p>
                <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>{resetTeacher?.user?.email}</p>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 5 }}>New Password *</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 chars)"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 13, border: '1.5px solid #e5e7eb', outline: 'none', fontFamily: '"DM Sans",sans-serif', boxSizing: 'border-box' as const, transition: 'all 0.15s' }}
                onFocus={e => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(109,40,217,0.1)' }}
                onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none' }}
              />
              {newPassword.length > 0 && newPassword.length < 6 && (
                <p style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>⚠ Password must be at least 6 characters</p>
              )}
            </div>
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#92400e' }}>
              💡 Share the new password with the teacher securely. They can log in immediately.
            </div>
          </div>
        </Modal>

        {/* ── VIEW MODAL ── */}
        <Modal open={viewModal} onClose={() => setViewModal(false)} title="Teacher Profile" size="md">
          {viewingTeacher && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', background: 'linear-gradient(135deg,#faf5ff,#f5f3ff)', borderRadius: 14, marginBottom: 18 }}>
                <Avatar name={viewingTeacher.user?.full_name ?? '?'} size={56} />
                <div>
                  <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 19, fontWeight: 700, color: '#111827', margin: 0 }}>{viewingTeacher.user?.full_name}</h3>
                  <p style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{viewingTeacher.user?.email}</p>
                  <div style={{ marginTop: 7, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {viewingTeacher.staff_id && <span style={{ fontSize: 11, fontWeight: 700, background: '#ede9fe', color: '#5b21b6', padding: '2px 8px', borderRadius: 99 }}>{viewingTeacher.staff_id}</span>}
                    {viewingTeacher.qualification && <span style={{ fontSize: 11, fontWeight: 600, background: '#f0fdf4', color: '#16a34a', padding: '2px 8px', borderRadius: 99 }}>🎓 {viewingTeacher.qualification}</span>}
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Phone', value: viewingTeacher.user?.phone },
                  { label: 'Staff ID', value: viewingTeacher.staff_id },
                  { label: 'Qualification', value: viewingTeacher.qualification },
                ].filter(x => x.value).map(({ label, value }) => (
                  <div key={label} style={{ background: '#faf5ff', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{value}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
                <Btn variant="secondary" style={{ flex: 1 }} onClick={() => { setViewModal(false); openEdit(viewingTeacher) }}>✏️ Edit</Btn>
                <Btn variant="primary" style={{ flex: 1 }} onClick={() => { setViewModal(false); setAssigningTeacher(viewingTeacher); setAssignModal(true) }}>📚 Assign Classes</Btn>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </>
  )
}