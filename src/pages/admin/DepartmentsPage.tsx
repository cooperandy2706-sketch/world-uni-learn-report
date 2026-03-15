// src/pages/admin/DepartmentsPage.tsx
import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { departmentsService, subjectsService, classesService } from '../../services/index'
import { useAuth } from '../../hooks/useAuth'
import Modal from '../../components/ui/Modal'
import toast from 'react-hot-toast'

const schema = z.object({
  name: z.string().min(1, 'Department name is required'),
  description: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const DEPT_COLORS = [
  { color: '#6d28d9', bg: '#f5f3ff', light: '#ede9fe', icon: '🏛️' },
  { color: '#0891b2', bg: '#ecfeff', light: '#cffafe', icon: '🔬' },
  { color: '#16a34a', bg: '#f0fdf4', light: '#dcfce7', icon: '📚' },
  { color: '#d97706', bg: '#fffbeb', light: '#fef3c7', icon: '🎨' },
  { color: '#db2777', bg: '#fdf2f8', light: '#fce7f3', icon: '⚽' },
  { color: '#dc2626', bg: '#fef2f2', light: '#fee2e2', icon: '🏫' },
  { color: '#7c3aed', bg: '#f5f3ff', light: '#ede9fe', icon: '💻' },
  { color: '#059669', bg: '#ecfdf5', light: '#d1fae5', icon: '🌍' },
]

function Btn({ children, onClick, variant = 'primary', type = 'button', disabled, loading, style, form }: any) {
  const [hov, setHov] = useState(false)
  const v: Record<string, React.CSSProperties> = {
    primary:   { background: hov ? '#5b21b6' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', border: 'none', boxShadow: '0 2px 8px rgba(109,40,217,0.28)' },
    secondary: { background: hov ? '#f5f3ff' : '#fff', color: '#374151', border: '1.5px solid #e5e7eb' },
    danger:    { background: hov ? '#b91c1c' : '#dc2626', color: '#fff', border: 'none' },
  }
  return (
    <button type={type} form={form} onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.15s', opacity: disabled ? 0.6 : 1, fontFamily: '"DM Sans",sans-serif', ...v[variant], ...style }}>
      {loading && <span style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: '_dspn 0.7s linear infinite', flexShrink: 0 }} />}
      {children}
    </button>
  )
}

function StyledInput({ error, label, hint, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { error?: string; label?: string; hint?: string }) {
  const [f, setF] = useState(false)
  return (
    <div>
      {label && <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 5 }}>{label}</label>}
      <input {...props} onFocus={e => { setF(true); props.onFocus?.(e) }} onBlur={e => { setF(false); props.onBlur?.(e) }}
        style={{ width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 13, border: `1.5px solid ${error ? '#f87171' : f ? '#7c3aed' : '#e5e7eb'}`, boxShadow: f ? '0 0 0 3px rgba(109,40,217,0.1)' : 'none', outline: 'none', background: '#fff', color: '#111827', fontFamily: '"DM Sans",sans-serif', transition: 'all 0.15s', boxSizing: 'border-box' as const }} />
      {error && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>⚠ {error}</p>}
      {hint && !error && <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>{hint}</p>}
    </div>
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

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects', user?.school_id],
    queryFn: async () => {
      const { data } = await subjectsService.getAll(user!.school_id)
      return data ?? []
    },
    enabled: !!user?.school_id,
  })

  const { data: classes = [] } = useQuery({
    queryKey: ['classes', user?.school_id],
    queryFn: async () => {
      const { data } = await classesService.getAll(user!.school_id)
      return data ?? []
    },
    enabled: !!user?.school_id,
  })

  const create = useMutation({
    mutationFn: (data: any) => departmentsService.create({ ...data, school_id: user!.school_id }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['departments'] }); toast.success('Department created') },
    onError: () => toast.error('Failed to create department'),
  })
  const update = useMutation({
    mutationFn: ({ id, ...data }: any) => departmentsService.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['departments'] }); toast.success('Department updated') },
    onError: () => toast.error('Failed to update department'),
  })
  const remove = useMutation({
    mutationFn: (id: string) => departmentsService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['departments'] }); toast.success('Department deleted') },
    onError: () => toast.error('Failed to delete department'),
  })

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const filtered = useMemo(() =>
    departments.filter((d: any) => !search || d.name.toLowerCase().includes(search.toLowerCase())),
    [departments, search]
  )

  function openCreate() { setEditing(null); reset({}); setModalOpen(true) }
  function openEdit(d: any) { setEditing(d); reset({ name: d.name }); setModalOpen(true) }

  async function onSubmit(data: FormData) {
    if (editing) await update.mutateAsync({ id: editing.id, ...data })
    else await create.mutateAsync(data)
    setModalOpen(false)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _dspn { to{transform:rotate(360deg)} }
        @keyframes _dfadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes _dfadeIn { from{opacity:0} to{opacity:1} }
        .dept-card:hover { box-shadow:0 10px 32px rgba(109,40,217,0.14) !important; transform:translateY(-3px) !important; }
      `}</style>

      <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif', animation: '_dfadeIn 0.4s ease' }}>

        {/* Header */}
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>Departments</h1>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 3 }}>{departments.length} departments · organise your school structure</p>
          </div>
          <Btn onClick={openCreate}>➕ Add Department</Btn>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 22 }}>
          {[
            { label: 'Departments', value: departments.length, icon: '🏛️', color: '#6d28d9', bg: '#f5f3ff' },
            { label: 'Subjects', value: subjects.length, icon: '📚', color: '#0891b2', bg: '#ecfeff' },
            { label: 'Classes', value: classes.length, icon: '🏫', color: '#16a34a', bg: '#f0fdf4' },
            { label: 'Avg Subjects/Dept', value: departments.length ? Math.round(subjects.length / departments.length) : 0, icon: '📊', color: '#d97706', bg: '#fffbeb' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', border: '1.5px solid #f0eefe', boxShadow: '0 1px 4px rgba(109,40,217,0.06)', animation: `_dfadeUp 0.4s ease ${i * 0.07}s both` }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#111827', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '12px 16px', border: '1.5px solid #f0eefe', marginBottom: 20 }}>
          <div style={{ position: 'relative', maxWidth: 340 }}>
            <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 15 }}>🔍</span>
            <input placeholder="Search departments…" value={search} onChange={e => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
              style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: 9, fontSize: 13, border: `1.5px solid ${searchFocused ? '#7c3aed' : '#e5e7eb'}`, boxShadow: searchFocused ? '0 0 0 3px rgba(109,40,217,0.1)' : 'none', outline: 'none', background: '#faf5ff', fontFamily: '"DM Sans",sans-serif', transition: 'all 0.15s' }} />
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #ede9fe', borderTopColor: '#6d28d9', animation: '_dspn 0.8s linear infinite' }} />
          </div>
        )}

        {/* Empty */}
        {!isLoading && filtered.length === 0 && (
          <div style={{ background: '#fff', borderRadius: 16, padding: '60px 20px', textAlign: 'center', border: '1.5px solid #f0eefe' }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🏛️</div>
            <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 6 }}>{search ? 'No departments found' : 'No departments yet'}</h3>
            <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 18 }}>{search ? 'Try a different search.' : 'Create departments to organise your school.'}</p>
            {!search && <Btn onClick={openCreate}>➕ Add First Department</Btn>}
          </div>
        )}

        {/* Grid */}
        {!isLoading && filtered.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 18 }}>
            {(filtered as any[]).map((d: any, i: number) => {
              const palette = DEPT_COLORS[i % DEPT_COLORS.length]
              const deptSubjects = subjects.filter((s: any) => s.department_id === d.id)
              const deptClasses = classes.filter((c: any) => c.department_id === d.id)

              return (
                <div key={d.id} className="dept-card"
                  style={{ background: '#fff', borderRadius: 18, border: `1.5px solid ${palette.color}28`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(109,40,217,0.07)', transition: 'all 0.22s', animation: `_dfadeUp 0.35s ease ${i * 0.07}s both` }}>

                  {/* Coloured header */}
                  <div style={{ background: `linear-gradient(135deg,${palette.bg},${palette.light})`, padding: '20px 20px 16px', borderBottom: `1px solid ${palette.color}18`, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: -16, right: -16, width: 80, height: 80, borderRadius: '50%', background: palette.color + '10' }} />
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
                      <div style={{ width: 46, height: 46, borderRadius: 13, background: palette.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                        {palette.icon}
                      </div>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button onClick={() => openEdit(d)}
                          style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: palette.color + '18', color: palette.color, cursor: 'pointer', fontSize: 13, transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = palette.color; e.currentTarget.style.color = '#fff' }}
                          onMouseLeave={e => { e.currentTarget.style.background = palette.color + '18'; e.currentTarget.style.color = palette.color }}>
                          ✏️
                        </button>
                        <button onClick={() => { if (confirm(`Delete "${d.name}"?`)) remove.mutate(d.id) }}
                          style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: '#fee2e218', color: '#dc2626', cursor: 'pointer', fontSize: 13, transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2' }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#fee2e218' }}>
                          🗑️
                        </button>
                      </div>
                    </div>
                    <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 17, fontWeight: 700, color: palette.color, margin: '14px 0 0' }}>{d.name}</h3>
                  </div>

                  {/* Body: stats */}
                  <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div style={{ background: '#faf5ff', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                      <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 22, fontWeight: 700, color: palette.color }}>{deptSubjects.length}</div>
                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Subjects</div>
                    </div>
                    <div style={{ background: '#faf5ff', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                      <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 22, fontWeight: 700, color: palette.color }}>{deptClasses.length}</div>
                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Classes</div>
                    </div>
                  </div>

                  {/* Subject chips */}
                  {deptSubjects.length > 0 && (
                    <div style={{ padding: '0 20px 16px', display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {deptSubjects.slice(0, 4).map((s: any) => (
                        <span key={s.id} style={{ fontSize: 10, fontWeight: 700, background: palette.light, color: palette.color, padding: '2px 8px', borderRadius: 99 }}>{s.name}</span>
                      ))}
                      {deptSubjects.length > 4 && <span style={{ fontSize: 10, color: '#9ca3af', alignSelf: 'center' }}>+{deptSubjects.length - 4} more</span>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Modal */}
        <Modal open={modalOpen} onClose={() => setModalOpen(false)}
          title={editing ? 'Edit Department' : 'Add Department'}
          subtitle={editing ? `Editing ${editing.name}` : 'Create a new department for your school'}
          size="sm"
          footer={<>
            <Btn variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Btn>
            <Btn onClick={handleSubmit(onSubmit)} loading={isSubmitting}>{editing ? 'Save Changes' : 'Add Department'}</Btn>
          </>}
        >
          <form id="dept-form" onSubmit={handleSubmit(onSubmit)}>
            <StyledInput label="Department Name *" {...register('name')} placeholder="e.g. Science Department" error={errors.name?.message}
              hint="Departments help organise subjects and classes" />
          </form>
        </Modal>
      </div>
    </>
  )
}