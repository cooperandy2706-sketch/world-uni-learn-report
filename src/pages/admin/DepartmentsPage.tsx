// src/pages/admin/DepartmentsPage.tsx
// Full department management: assign subjects, assign teachers, set dept head
import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { departmentsService, subjectsService, teachersService } from '../../services/index'
import { useAuth } from '../../hooks/useAuth'
import Modal from '../../components/ui/Modal'
import toast from 'react-hot-toast'

const schema = z.object({
  name: z.string().min(1, 'Department name is required'),
  description: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const PALETTES = [
  { color: '#6d28d9', bg: '#f5f3ff', light: '#ede9fe', icon: '🏛️' },
  { color: '#0891b2', bg: '#ecfeff', light: '#cffafe', icon: '🔬' },
  { color: '#16a34a', bg: '#f0fdf4', light: '#dcfce7', icon: '📚' },
  { color: '#d97706', bg: '#fffbeb', light: '#fef3c7', icon: '🎨' },
  { color: '#db2777', bg: '#fdf2f8', light: '#fce7f3', icon: '⚽' },
  { color: '#dc2626', bg: '#fef2f2', light: '#fee2e2', icon: '🏫' },
  { color: '#7c3aed', bg: '#f5f3ff', light: '#ede9fe', icon: '💻' },
  { color: '#059669', bg: '#ecfdf5', light: '#d1fae5', icon: '🌍' },
]

function Btn({ children, onClick, variant = 'primary', type = 'button', disabled, loading, style }: any) {
  const [hov, setHov] = useState(false)
  const v: Record<string, React.CSSProperties> = {
    primary:   { background: hov ? '#5b21b6' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', border: 'none', boxShadow: '0 2px 8px rgba(109,40,217,0.28)' },
    secondary: { background: hov ? '#f5f3ff' : '#fff', color: '#374151', border: '1.5px solid #e5e7eb' },
    danger:    { background: hov ? '#b91c1c' : '#dc2626', color: '#fff', border: 'none' },
    success:   { background: hov ? '#059669' : '#10b981', color: '#fff', border: 'none' },
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.15s', opacity: disabled ? 0.6 : 1, fontFamily: '"DM Sans",sans-serif', ...v[variant], ...style }}>
      {loading && <span style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: '_dspn 0.7s linear infinite', flexShrink: 0 }} />}
      {children}
    </button>
  )
}

export default function DepartmentsPage() {
  const { user } = useAuth()
  const qc = useQueryClient()

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ['departments', user?.school_id],
    queryFn: async () => {
      const { data, error } = await departmentsService.getAll(user!.school_id)
      if (error) throw error
      return data ?? []
    },
    enabled: !!user?.school_id,
  })

  const { data: allSubjects = [] } = useQuery({
    queryKey: ['subjects', user?.school_id],
    queryFn: async () => { const { data } = await subjectsService.getAll(user!.school_id); return data ?? [] },
    enabled: !!user?.school_id,
  })

  const { data: allTeachers = [] } = useQuery({
    queryKey: ['teachers', user?.school_id],
    queryFn: async () => { const { data } = await teachersService.getAll(user!.school_id); return data ?? [] },
    enabled: !!user?.school_id,
  })

  // Mutations
  const createDept = useMutation({
    mutationFn: (data: any) => departmentsService.create({ ...data, school_id: user!.school_id }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['departments'] }); toast.success('Department created') },
    onError: () => toast.error('Failed to create department'),
  })
  const updateDept = useMutation({
    mutationFn: ({ id, ...data }: any) => departmentsService.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['departments'] }); toast.success('Department updated') },
    onError: () => toast.error('Failed to update department'),
  })
  const removeDept = useMutation({
    mutationFn: (id: string) => departmentsService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['departments'] }); toast.success('Department deleted') },
    onError: () => toast.error('Failed to delete'),
  })

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [manageModal, setManageModal] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [savingManage, setSavingManage] = useState(false)
  const [activeTab, setActiveTab] = useState<'subjects' | 'teachers'>('subjects')

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const filtered = useMemo(() =>
    (departments as any[]).filter((d: any) => !search || d.name.toLowerCase().includes(search.toLowerCase())),
    [departments, search]
  )

  function openCreate() { setEditing(null); reset({}); setModalOpen(true) }
  function openEdit(d: any) { setEditing(d); reset({ name: d.name, description: d.description ?? '' }); setModalOpen(true) }

  async function onSubmit(data: FormData) {
    if (editing) await updateDept.mutateAsync({ id: editing.id, ...data })
    else await createDept.mutateAsync(data)
    setModalOpen(false)
  }

  // Manage modal helpers
  const deptSubjects = manageModal ? (allSubjects as any[]).filter((s: any) => s.department_id === manageModal.id) : []
  const deptTeachers = manageModal ? (allTeachers as any[]).filter((t: any) => t.department_id === manageModal.id) : []
  const unassignedSubjects = (allSubjects as any[]).filter((s: any) => !s.department_id || s.department_id === manageModal?.id)
  const unassignedTeachers = (allTeachers as any[]).filter((t: any) => !t.department_id || t.department_id === manageModal?.id)
  const deptHead = manageModal ? (allTeachers as any[]).find((t: any) => t.id === manageModal?.head_teacher_id) : null

  async function assignSubject(subjectId: string) {
    setSavingManage(true)
    const { error } = await supabase.from('subjects').update({ department_id: manageModal.id }).eq('id', subjectId)
    if (!error) { qc.invalidateQueries({ queryKey: ['subjects'] }); toast.success('Subject assigned') }
    else toast.error('Failed: ' + error.message)
    setSavingManage(false)
  }

  async function unassignSubject(subjectId: string) {
    setSavingManage(true)
    const { error } = await supabase.from('subjects').update({ department_id: null }).eq('id', subjectId)
    if (!error) { qc.invalidateQueries({ queryKey: ['subjects'] }); toast.success('Subject removed') }
    else toast.error('Failed: ' + error.message)
    setSavingManage(false)
  }

  async function assignTeacher(teacherId: string) {
    setSavingManage(true)
    const { error } = await supabase.from('teachers').update({ department_id: manageModal.id }).eq('id', teacherId)
    if (!error) { qc.invalidateQueries({ queryKey: ['teachers'] }); toast.success('Teacher assigned') }
    else toast.error('Failed: ' + error.message)
    setSavingManage(false)
  }

  async function unassignTeacher(teacherId: string) {
    setSavingManage(true)
    const { error } = await supabase.from('teachers').update({ department_id: null }).eq('id', teacherId)
    if (!error) { qc.invalidateQueries({ queryKey: ['teachers'] }); toast.success('Teacher removed') }
    else toast.error('Failed: ' + error.message)
    setSavingManage(false)
  }

  async function setDeptHead(teacherId: string | null) {
    setSavingManage(true)
    const { error } = await supabase.from('departments').update({ head_teacher_id: teacherId }).eq('id', manageModal.id)
    if (!error) { qc.invalidateQueries({ queryKey: ['departments'] }); setManageModal((prev: any) => ({ ...prev, head_teacher_id: teacherId })); toast.success(teacherId ? 'Department head set' : 'Head removed') }
    else toast.error('Failed: ' + error.message)
    setSavingManage(false)
  }

  // Stats
  const totalSubjectsAssigned = (allSubjects as any[]).filter((s: any) => s.department_id).length
  const totalTeachersAssigned = (allTeachers as any[]).filter((t: any) => t.department_id).length

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _dspn { to{transform:rotate(360deg)} }
        @keyframes _dfadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes _dfadeIn { from{opacity:0} to{opacity:1} }
        .dept-card { transition:all 0.22s; }
        .dept-card:hover { box-shadow:0 10px 32px rgba(109,40,217,0.13) !important; transform:translateY(-3px) !important; }
        .assign-row:hover { background:#faf5ff !important; }
        .assign-row { cursor:pointer; transition:background .12s; }
        .tab-btn { transition:all .15s; cursor:pointer; border:none; font-family:"DM Sans",sans-serif; font-weight:600; }
      `}</style>

      <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif', animation: '_dfadeIn 0.4s ease' }}>

        {/* Header */}
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>Departments</h1>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 3 }}>Organise your school by academic departments — assign subjects and staff</p>
          </div>
          <Btn onClick={openCreate}>➕ New Department</Btn>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Departments', value: (departments as any[]).length, icon: '🏛️', color: '#6d28d9', bg: '#f5f3ff' },
            { label: 'Subjects Assigned', value: totalSubjectsAssigned, total: (allSubjects as any[]).length, icon: '📚', color: '#0891b2', bg: '#ecfeff' },
            { label: 'Teachers Assigned', value: totalTeachersAssigned, total: (allTeachers as any[]).length, icon: '👨‍🏫', color: '#16a34a', bg: '#f0fdf4' },
            { label: 'Unassigned Subjects', value: (allSubjects as any[]).length - totalSubjectsAssigned, icon: '⚠️', color: '#d97706', bg: '#fffbeb' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', border: '1.5px solid #f0eefe', boxShadow: '0 1px 4px rgba(109,40,217,0.06)', animation: `_dfadeUp .4s ease ${i * .07}s both` }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#111827', lineHeight: 1 }}>{s.value}{(s as any).total ? <span style={{ fontSize: 14, color: '#9ca3af', fontFamily: '"DM Sans",sans-serif' }}> / {(s as any).total}</span> : ''}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '10px 16px', border: '1.5px solid #f0eefe', marginBottom: 20 }}>
          <div style={{ position: 'relative', maxWidth: 340 }}>
            <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 14 }}>🔍</span>
            <input placeholder="Search departments…" value={search} onChange={e => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
              style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: 8, fontSize: 13, border: `1.5px solid ${searchFocused ? '#7c3aed' : '#e5e7eb'}`, outline: 'none', background: '#faf5ff', fontFamily: '"DM Sans",sans-serif', transition: 'all 0.15s' }} />
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #ede9fe', borderTopColor: '#6d28d9', animation: '_dspn 0.8s linear infinite' }} />
          </div>
        )}

        {/* Empty */}
        {!isLoading && filtered.length === 0 && (
          <div style={{ background: '#fff', borderRadius: 16, padding: '60px 20px', textAlign: 'center', border: '1.5px solid #f0eefe' }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🏛️</div>
            <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 6 }}>{search ? 'No departments found' : 'No departments yet'}</h3>
            <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 18 }}>{search ? 'Try a different search.' : 'Create departments to organise your school structure.'}</p>
            {!search && <Btn onClick={openCreate}>➕ Add First Department</Btn>}
          </div>
        )}

        {/* Department Grid */}
        {!isLoading && filtered.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 20 }}>
            {filtered.map((d: any, i: number) => {
              const palette = PALETTES[i % PALETTES.length]
              const dSubs = (allSubjects as any[]).filter((s: any) => s.department_id === d.id)
              const dTeachers = (allTeachers as any[]).filter((t: any) => t.department_id === d.id)
              const head = (allTeachers as any[]).find((t: any) => t.id === d.head_teacher_id)

              return (
                <div key={d.id} className="dept-card"
                  style={{ background: '#fff', borderRadius: 20, border: `1.5px solid ${palette.color}22`, overflow: 'hidden', boxShadow: '0 2px 8px rgba(109,40,217,0.07)', animation: `_dfadeUp 0.35s ease ${i * 0.06}s both` }}>

                  {/* Header band */}
                  <div style={{ background: `linear-gradient(135deg,${palette.bg},${palette.light})`, padding: '18px 20px 14px', borderBottom: `1px solid ${palette.color}18`, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: -18, right: -18, width: 80, height: 80, borderRadius: '50%', background: palette.color + '10' }} />
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 13, background: palette.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                        {palette.icon}
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => openEdit(d)} title="Edit name"
                          style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: palette.color + '18', color: palette.color, cursor: 'pointer', fontSize: 12, transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = palette.color; e.currentTarget.style.color = '#fff' }}
                          onMouseLeave={e => { e.currentTarget.style.background = palette.color + '18'; e.currentTarget.style.color = palette.color }}>✏️</button>
                        <button onClick={() => { if (confirm(`Delete "${d.name}"? This cannot be undone.`)) removeDept.mutate(d.id) }} title="Delete"
                          style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: 12, transition: 'all 0.15s' }}>🗑️</button>
                      </div>
                    </div>
                    <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 17, fontWeight: 700, color: palette.color, margin: '12px 0 0' }}>{d.name}</h3>
                    {head && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: palette.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff' }}>
                          {head.user?.full_name?.charAt(0)}
                        </div>
                        <span style={{ fontSize: 11, color: palette.color, fontWeight: 600 }}>Head: {head.user?.full_name}</span>
                      </div>
                    )}
                  </div>

                  {/* Stats row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, borderBottom: `1px solid ${palette.color}12` }}>
                    {[
                      { label: 'Subjects', value: dSubs.length, icon: '📚' },
                      { label: 'Teachers', value: dTeachers.length, icon: '👨‍🏫' },
                    ].map((s, si) => (
                      <div key={s.label} style={{ padding: '12px 18px', borderRight: si === 0 ? `1px solid ${palette.color}12` : 'none', textAlign: 'center' }}>
                        <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 22, fontWeight: 700, color: palette.color }}>{s.value}</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Subject chips */}
                  <div style={{ padding: '12px 18px', minHeight: 44 }}>
                    {dSubs.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {dSubs.slice(0, 5).map((s: any) => (
                          <span key={s.id} style={{ fontSize: 10, fontWeight: 700, background: palette.light, color: palette.color, padding: '3px 9px', borderRadius: 99 }}>{s.name}</span>
                        ))}
                        {dSubs.length > 5 && <span style={{ fontSize: 10, color: '#9ca3af', alignSelf: 'center' }}>+{dSubs.length - 5} more</span>}
                      </div>
                    ) : (
                      <p style={{ fontSize: 12, color: '#d1d5db', margin: 0, fontStyle: 'italic' }}>No subjects assigned yet</p>
                    )}
                  </div>

                  {/* Manage button */}
                  <div style={{ padding: '0 18px 16px' }}>
                    <button
                      onClick={() => { setManageModal(d); setActiveTab('subjects') }}
                      style={{ width: '100%', padding: '9px', borderRadius: 10, border: `1.5px solid ${palette.color}30`, background: palette.bg, color: palette.color, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: '"DM Sans",sans-serif', transition: 'all .15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = palette.color; e.currentTarget.style.color = '#fff' }}
                      onMouseLeave={e => { e.currentTarget.style.background = palette.bg; e.currentTarget.style.color = palette.color }}>
                      ⚙️ Manage Department
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Department' : 'New Department'}
        subtitle={editing ? `Editing "${editing.name}"` : 'Create a new academic department'}
        size="sm"
        footer={<>
          <Btn variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Btn>
          <Btn onClick={handleSubmit(onSubmit)} loading={isSubmitting}>{editing ? 'Save Changes' : 'Create Department'}</Btn>
        </>}>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 5 }}>Department Name *</label>
            <input {...register('name')} placeholder="e.g. Sciences Department, Languages…"
              style={{ width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 13, border: `1.5px solid ${errors.name ? '#f87171' : '#e5e7eb'}`, outline: 'none', fontFamily: '"DM Sans",sans-serif', boxSizing: 'border-box' }} />
            {errors.name && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>⚠ {errors.name.message}</p>}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 5 }}>Description (optional)</label>
            <textarea {...register('description')} placeholder="Brief description of this department…" rows={3}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 13, border: '1.5px solid #e5e7eb', outline: 'none', fontFamily: '"DM Sans",sans-serif', resize: 'vertical', boxSizing: 'border-box' }} />
          </div>
        </form>
      </Modal>

      {/* Manage Department Modal */}
      <Modal open={!!manageModal} onClose={() => setManageModal(null)}
        title={`Manage — ${manageModal?.name}`}
        subtitle="Assign subjects, teachers & set department head"
        size="lg"
        footer={<Btn variant="secondary" onClick={() => setManageModal(null)}>Done</Btn>}>
        {manageModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Dept Head */}
            <div style={{ background: '#f5f3ff', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>👑 Department Head</div>
                  {deptHead
                    ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff' }}>{deptHead.user?.full_name?.charAt(0)}</div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{deptHead.user?.full_name}</div>
                          <div style={{ fontSize: 11, color: '#6b7280' }}>{deptHead.user?.email}</div>
                        </div>
                      </div>
                    : <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>No department head assigned</p>}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <select onChange={e => setDeptHead(e.target.value || null)} value={manageModal.head_teacher_id ?? ''}
                    style={{ padding: '7px 10px', borderRadius: 8, fontSize: 12, border: '1.5px solid #ddd6fe', background: '#fff', fontFamily: '"DM Sans",sans-serif', cursor: 'pointer' }}>
                    <option value="">— Set Head —</option>
                    {deptTeachers.map((t: any) => (
                      <option key={t.id} value={t.id}>{t.user?.full_name}</option>
                    ))}
                  </select>
                  {deptHead && <Btn variant="secondary" style={{ padding: '7px 12px', fontSize: 11 }} onClick={() => setDeptHead(null)}>Remove</Btn>}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, background: '#f5f3ff', borderRadius: 10, padding: 4, width: 'fit-content' }}>
              {(['subjects', 'teachers'] as const).map(t => (
                <button key={t} className="tab-btn" onClick={() => setActiveTab(t)}
                  style={{ padding: '7px 18px', borderRadius: 8, fontSize: 13, background: activeTab === t ? '#fff' : 'transparent', color: activeTab === t ? '#6d28d9' : '#6b7280', boxShadow: activeTab === t ? '0 1px 4px rgba(0,0,0,.08)' : 'none' }}>
                  {t === 'subjects' ? `📚 Subjects (${deptSubjects.length})` : `👨‍🏫 Teachers (${deptTeachers.length})`}
                </button>
              ))}
            </div>

            {activeTab === 'subjects' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Assigned */}
                <div>
                  <h4 style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>✅ In This Department ({deptSubjects.length})</h4>
                  <div style={{ border: '1.5px solid #dcfce7', borderRadius: 12, overflow: 'hidden', maxHeight: 280, overflowY: 'auto' }}>
                    {deptSubjects.length === 0 ? (
                      <div style={{ padding: '24px 16px', textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>No subjects assigned</div>
                    ) : deptSubjects.map((s: any) => (
                      <div key={s.id} className="assign-row"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #f0fdf4', background: '#fff' }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{s.name}</div>
                          {s.code && <div style={{ fontSize: 10, color: '#9ca3af' }}>{s.code}</div>}
                        </div>
                        <button onClick={() => unassignSubject(s.id)} disabled={savingManage}
                          style={{ padding: '3px 10px', borderRadius: 7, border: 'none', background: '#fef2f2', color: '#dc2626', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Remove</button>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Unassigned */}
                <div>
                  <h4 style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>➕ Available to Assign</h4>
                  <div style={{ border: '1.5px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', maxHeight: 280, overflowY: 'auto' }}>
                    {unassignedSubjects.filter((s: any) => s.department_id !== manageModal.id).length === 0 ? (
                      <div style={{ padding: '24px 16px', textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>All subjects assigned</div>
                    ) : unassignedSubjects.filter((s: any) => s.department_id !== manageModal.id).map((s: any) => (
                      <div key={s.id} className="assign-row"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #f9fafb', background: '#fff' }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{s.name}</div>
                          {s.code && <div style={{ fontSize: 10, color: '#9ca3af' }}>{s.code}</div>}
                        </div>
                        <button onClick={() => assignSubject(s.id)} disabled={savingManage}
                          style={{ padding: '3px 10px', borderRadius: 7, border: 'none', background: '#f0fdf4', color: '#16a34a', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Assign</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'teachers' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Assigned teachers */}
                <div>
                  <h4 style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>✅ In This Department ({deptTeachers.length})</h4>
                  <div style={{ border: '1.5px solid #dcfce7', borderRadius: 12, overflow: 'hidden', maxHeight: 280, overflowY: 'auto' }}>
                    {deptTeachers.length === 0 ? (
                      <div style={{ padding: '24px 16px', textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>No teachers assigned</div>
                    ) : deptTeachers.map((t: any) => (
                      <div key={t.id} className="assign-row"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #f0fdf4', background: '#fff' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff' }}>{t.user?.full_name?.charAt(0)}</div>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{t.user?.full_name}</div>
                            {t.id === manageModal.head_teacher_id && <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700 }}>👑 Head</div>}
                          </div>
                        </div>
                        <button onClick={() => unassignTeacher(t.id)} disabled={savingManage}
                          style={{ padding: '3px 10px', borderRadius: 7, border: 'none', background: '#fef2f2', color: '#dc2626', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Remove</button>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Unassigned teachers */}
                <div>
                  <h4 style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>➕ Available Teachers</h4>
                  <div style={{ border: '1.5px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', maxHeight: 280, overflowY: 'auto' }}>
                    {unassignedTeachers.filter((t: any) => t.department_id !== manageModal.id).length === 0 ? (
                      <div style={{ padding: '24px 16px', textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>All teachers assigned</div>
                    ) : unassignedTeachers.filter((t: any) => t.department_id !== manageModal.id).map((t: any) => (
                      <div key={t.id} className="assign-row"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #f9fafb', background: '#fff' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#6d28d9' }}>{t.user?.full_name?.charAt(0)}</div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{t.user?.full_name}</div>
                        </div>
                        <button onClick={() => assignTeacher(t.id)} disabled={savingManage}
                          style={{ padding: '3px 10px', borderRadius: 7, border: 'none', background: '#f0fdf4', color: '#16a34a', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Assign</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}