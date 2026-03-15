// src/pages/admin/ClassesPage.tsx
import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useClasses, useCreateClass, useUpdateClass, useDeleteClass } from '../../hooks/useClasses'
import { useStudents } from '../../hooks/useStudents'
import { useSubjects } from '../../hooks/useSubjects'
import Modal from '../../components/ui/Modal'

const schema = z.object({
  name:     z.string().min(1, 'Class name is required'),
  level:    z.string().optional(),
  capacity: z.coerce.number().optional().nullable(),
})
type FormData = z.infer<typeof schema>

// ── helpers ───────────────────────────────────────────────
function Btn({ children, onClick, variant = 'primary', type = 'button', disabled, loading, style, form }: any) {
  const [hov, setHov] = useState(false)
  const variants: Record<string, React.CSSProperties> = {
    primary:   { background: hov ? '#5b21b6' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', border: 'none', boxShadow: '0 2px 8px rgba(109,40,217,0.28)' },
    secondary: { background: hov ? '#f5f3ff' : '#fff', color: '#374151', border: '1.5px solid #e5e7eb' },
    danger:    { background: hov ? '#b91c1c' : '#dc2626', color: '#fff', border: 'none' },
    ghost:     { background: hov ? '#f5f3ff' : 'transparent', color: '#6b7280', border: 'none' },
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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 5 }}>{children}</label>
}

function StyledInput({ error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  const [f, setF] = useState(false)
  return (
    <div>
      <input {...props}
        onFocus={e => { setF(true); props.onFocus?.(e) }}
        onBlur={e => { setF(false); props.onBlur?.(e) }}
        style={{ width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 13, border: `1.5px solid ${error ? '#f87171' : f ? '#7c3aed' : '#e5e7eb'}`, boxShadow: f ? '0 0 0 3px rgba(109,40,217,0.1)' : 'none', outline: 'none', background: '#fff', color: '#111827', fontFamily: '"DM Sans",sans-serif', transition: 'all 0.15s', boxSizing: 'border-box' as const }} />
      {error && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>⚠ {error}</p>}
    </div>
  )
}

// palette for class cards
const CLASS_COLORS = [
  { bg: '#f5f3ff', border: '#ddd6fe', accent: '#6d28d9', light: '#ede9fe' },
  { bg: '#eff6ff', border: '#bfdbfe', accent: '#2563eb', light: '#dbeafe' },
  { bg: '#f0fdf4', border: '#bbf7d0', accent: '#16a34a', light: '#dcfce7' },
  { bg: '#fffbeb', border: '#fde68a', accent: '#d97706', light: '#fef3c7' },
  { bg: '#fdf2f8', border: '#fbcfe8', accent: '#db2777', light: '#fce7f3' },
  { bg: '#ecfeff', border: '#a5f3fc', accent: '#0891b2', light: '#cffafe' },
]

// ═══════════════════════════════════════════════════════════
export default function ClassesPage() {
  const { data: classes = [], isLoading } = useClasses()
  const { data: students = [] } = useStudents()
  const { data: subjects = [] } = useSubjects()
  const createClass = useCreateClass()
  const updateClass = useUpdateClass()
  const deleteClass = useDeleteClass()

  const [modalOpen, setModalOpen] = useState(false)
  const [detailModal, setDetailModal] = useState(false)
  const [editingClass, setEditingClass] = useState<any>(null)
  const [viewingClass, setViewingClass] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) as any })

  const filtered = useMemo(() =>
    classes.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.level?.toLowerCase().includes(search.toLowerCase())),
    [classes, search]
  )

  function openCreate() { setEditingClass(null); reset({}); setModalOpen(true) }
  function openEdit(c: any) { setEditingClass(c); reset({ name: c.name, level: c.level ?? '', capacity: c.capacity ?? undefined }); setModalOpen(true) }
  function openDetail(c: any) { setViewingClass(c); setDetailModal(true) }

  async function onSubmit(data: FormData) {
    if (editingClass) await updateClass.mutateAsync({ id: editingClass.id, ...data })
    else await createClass.mutateAsync(data)
    setModalOpen(false)
  }

  async function handleDelete(c: any) {
    const count = students.filter(s => s.class_id === c.id).length
    if (count > 0 && !confirm(`"${c.name}" has ${count} student(s). Delete anyway?`)) return
    if (count === 0 && !confirm(`Delete class "${c.name}"?`)) return
    await deleteClass.mutateAsync(c.id)
  }

  // stats
  const totalStudents = students.length
  const avgPerClass = classes.length ? Math.round(totalStudents / classes.length) : 0
  const largestClass = classes.reduce((max, c) => {
    const cnt = students.filter(s => s.class_id === c.id).length
    return cnt > (students.filter(s => s.class_id === max?.id).length ?? 0) ? c : max
  }, classes[0])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _spin  { to{transform:rotate(360deg)} }
        @keyframes _fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes _fadeIn { from{opacity:0} to{opacity:1} }
        .cls-card:hover  { box-shadow:0 10px 32px rgba(109,40,217,0.14) !important; transform:translateY(-3px) !important; }
        .cls-action:hover { opacity:1 !important; }
      `}</style>

      <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif', animation: '_fadeIn 0.4s ease' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>Classes</h1>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 3 }}>{classes.length} classes · {totalStudents} total students enrolled</p>
          </div>
          <Btn onClick={openCreate}>➕ Add Class</Btn>
        </div>

        {/* ── Summary strip ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 22 }}>
          {[
            { label: 'Total Classes',   value: classes.length,  icon: '🏫', color: '#6d28d9', bg: '#f5f3ff' },
            { label: 'Total Students',  value: totalStudents,   icon: '👥', color: '#0891b2', bg: '#ecfeff' },
            { label: 'Avg per Class',   value: avgPerClass,     icon: '📊', color: '#16a34a', bg: '#f0fdf4' },
            { label: 'Total Subjects',  value: subjects.length, icon: '📚', color: '#d97706', bg: '#fffbeb' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', border: '1.5px solid #f0eefe', boxShadow: '0 1px 4px rgba(109,40,217,0.06)', animation: `_fadeUp 0.4s ease ${i * 0.07}s both` }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#111827', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Search ── */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '12px 16px', border: '1.5px solid #f0eefe', marginBottom: 20 }}>
          <div style={{ position: 'relative', maxWidth: 340 }}>
            <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 15 }}>🔍</span>
            <input placeholder="Search classes…" value={search} onChange={e => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
              style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: 9, fontSize: 13, border: `1.5px solid ${searchFocused ? '#7c3aed' : '#e5e7eb'}`, boxShadow: searchFocused ? '0 0 0 3px rgba(109,40,217,0.1)' : 'none', outline: 'none', background: '#faf5ff', fontFamily: '"DM Sans",sans-serif', transition: 'all 0.15s' }} />
          </div>
        </div>

        {/* ── Loading ── */}
        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #ede9fe', borderTopColor: '#6d28d9', animation: '_spin 0.8s linear infinite' }} />
            <p style={{ fontSize: 13, color: '#9ca3af' }}>Loading classes…</p>
          </div>
        )}

        {/* ── Empty ── */}
        {!isLoading && filtered.length === 0 && (
          <div style={{ background: '#fff', borderRadius: 16, padding: '60px 20px', textAlign: 'center', border: '1.5px solid #f0eefe' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏫</div>
            <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 6 }}>{search ? 'No classes found' : 'No classes yet'}</h3>
            <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 18 }}>{search ? 'Try a different search.' : 'Create your first class to get started.'}</p>
            {!search && <Btn onClick={openCreate}>➕ Add First Class</Btn>}
          </div>
        )}

        {/* ── Grid ── */}
        {!isLoading && filtered.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 18 }}>
            {filtered.map((cls, i) => {
              const studentCount = students.filter(s => s.class_id === cls.id).length
              const palette = CLASS_COLORS[i % CLASS_COLORS.length]
              const fillPct = cls.capacity ? Math.min(100, Math.round((studentCount / cls.capacity) * 100)) : null
              const isLargest = largestClass?.id === cls.id && classes.length > 1

              return (
                <div key={cls.id} className="cls-card"
                  style={{ background: '#fff', borderRadius: 18, border: `1.5px solid ${palette.border}`, padding: 0, boxShadow: '0 1px 4px rgba(109,40,217,0.07)', transition: 'all 0.22s', animation: `_fadeUp 0.35s ease ${i * 0.06}s both`, overflow: 'hidden', cursor: 'pointer' }}
                  onClick={() => openDetail(cls)}
                >
                  {/* Coloured header */}
                  <div style={{ background: `linear-gradient(135deg,${palette.bg},${palette.light})`, padding: '20px 20px 16px', borderBottom: `1px solid ${palette.border}`, position: 'relative' }}>
                    <div style={{ position: 'absolute', top: -12, right: -12, width: 72, height: 72, borderRadius: '50%', background: palette.accent + '12' }} />
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: palette.accent + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🏫</div>
                      {isLargest && (
                        <span style={{ fontSize: 10, fontWeight: 800, background: palette.accent, color: '#fff', padding: '2px 8px', borderRadius: 99 }}>LARGEST</span>
                      )}
                    </div>
                    <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: palette.accent, margin: '12px 0 2px' }}>{cls.name}</h3>
                    {cls.level && <p style={{ fontSize: 12, color: palette.accent + 'aa', margin: 0 }}>{cls.level}</p>}
                  </div>

                  {/* Body */}
                  <div style={{ padding: '16px 20px' }}>
                    {/* Student count */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: fillPct !== null ? 10 : 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14 }}>👥</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{studentCount}</span>
                        <span style={{ fontSize: 12, color: '#6b7280' }}>student{studentCount !== 1 ? 's' : ''}</span>
                      </div>
                      {cls.capacity && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: fillPct! >= 90 ? '#dc2626' : fillPct! >= 70 ? '#d97706' : '#16a34a', background: fillPct! >= 90 ? '#fef2f2' : fillPct! >= 70 ? '#fffbeb' : '#f0fdf4', padding: '2px 8px', borderRadius: 99 }}>
                          {fillPct}% full
                        </span>
                      )}
                    </div>

                    {/* Capacity bar */}
                    {fillPct !== null && (
                      <div style={{ height: 5, background: '#f0eefe', borderRadius: 99, overflow: 'hidden', marginBottom: 14 }}>
                        <div style={{ height: '100%', width: `${fillPct}%`, background: fillPct >= 90 ? '#dc2626' : fillPct >= 70 ? '#f59e0b' : palette.accent, borderRadius: 99, transition: 'width 1s ease' }} />
                      </div>
                    )}

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: 7 }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => openEdit(cls)}
                        style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', background: palette.light, color: palette.accent, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = palette.accent; e.currentTarget.style.color = '#fff' }}
                        onMouseLeave={e => { e.currentTarget.style.background = palette.light; e.currentTarget.style.color = palette.accent }}>
                        ✏️ Edit
                      </button>
                      <button onClick={() => handleDelete(cls)}
                        style={{ width: 34, padding: '7px 0', borderRadius: 8, border: '1px solid #fecaca', background: 'transparent', color: '#ef4444', fontSize: 13, cursor: 'pointer', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── ADD / EDIT MODAL ── */}
        <Modal open={modalOpen} onClose={() => setModalOpen(false)}
          title={editingClass ? 'Edit Class' : 'Add New Class'}
          subtitle={editingClass ? `Editing ${editingClass.name}` : 'Create a new class for your school'}
          size="sm"
          footer={<>
            <Btn variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Btn>
            <Btn onClick={handleSubmit(onSubmit)} loading={isSubmitting}>{editingClass ? 'Save Changes' : 'Add Class'}</Btn>
          </>}
        >
          <form id="class-form" onSubmit={handleSubmit(onSubmit)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <FieldLabel>Class Name *</FieldLabel>
                <StyledInput {...register('name')} placeholder="e.g. Class 6A, JHS 2B" error={errors.name?.message} />
              </div>
              <div>
                <FieldLabel>Level / Grade</FieldLabel>
                <StyledInput {...register('level')} placeholder="e.g. Primary 6, JHS 2" />
              </div>
              <div>
                <FieldLabel>Capacity</FieldLabel>
                <StyledInput {...register('capacity')} type="number" placeholder="e.g. 40" />
                <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>Maximum number of students in this class</p>
              </div>
            </div>
          </form>
        </Modal>

        {/* ── DETAIL MODAL ── */}
        <Modal open={detailModal} onClose={() => setDetailModal(false)}
          title={viewingClass?.name ?? ''}
          subtitle={viewingClass?.level ?? 'Class details'}
          size="md"
        >
          {viewingClass && (() => {
            const studentCount = students.filter(s => s.class_id === viewingClass.id).length
            const classStudents = students.filter(s => s.class_id === viewingClass.id).slice(0, 8)
            const maleCount = students.filter(s => s.class_id === viewingClass.id && s.gender === 'male').length
            const femaleCount = students.filter(s => s.class_id === viewingClass.id && s.gender === 'female').length
            const palette = CLASS_COLORS[classes.findIndex(c => c.id === viewingClass.id) % CLASS_COLORS.length]
            return (
              <div>
                {/* Header banner */}
                <div style={{ background: `linear-gradient(135deg,${palette.bg},${palette.light})`, borderRadius: 12, padding: '18px 20px', marginBottom: 18, border: `1px solid ${palette.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: palette.accent + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>🏫</div>
                    <div>
                      <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 20, fontWeight: 700, color: palette.accent, margin: 0 }}>{viewingClass.name}</h3>
                      {viewingClass.level && <p style={{ fontSize: 13, color: palette.accent + 'aa', margin: '2px 0 0' }}>{viewingClass.level}</p>}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 18 }}>
                  {[
                    { label: 'Total Students', value: studentCount, icon: '👥' },
                    { label: 'Male', value: maleCount, icon: '👦' },
                    { label: 'Female', value: femaleCount, icon: '👧' },
                  ].map(({ label, value, icon }) => (
                    <div key={label} style={{ background: '#faf5ff', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
                      <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 22, fontWeight: 700, color: '#111827' }}>{value}</div>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>{label}</div>
                    </div>
                  ))}
                </div>

                {/* Student list preview */}
                {classStudents.length > 0 && (
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Students Preview</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                      {classStudents.map(s => (
                        <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f5f3ff', borderRadius: 99, padding: '4px 10px 4px 4px' }}>
                          <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#fff' }}>
                            {s.full_name.charAt(0)}
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#5b21b6' }}>{s.full_name.split(' ')[0]}</span>
                        </div>
                      ))}
                      {studentCount > 8 && <span style={{ fontSize: 11, color: '#9ca3af', alignSelf: 'center' }}>+{studentCount - 8} more</span>}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
                  <Btn variant="secondary" style={{ flex: 1 }} onClick={() => { setDetailModal(false); openEdit(viewingClass) }}>✏️ Edit Class</Btn>
                  <Btn variant="danger" onClick={() => { setDetailModal(false); handleDelete(viewingClass) }}>🗑️ Delete</Btn>
                </div>
              </div>
            )
          })()}
        </Modal>
      </div>
    </>
  )
}