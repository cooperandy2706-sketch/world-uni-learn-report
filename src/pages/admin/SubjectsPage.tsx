// src/pages/admin/SubjectsPage.tsx
import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSubjects, useCreateSubject, useUpdateSubject, useDeleteSubject } from '../../hooks/useSubjects'
import Modal from '../../components/ui/Modal'

const schema = z.object({
  name: z.string().min(1, 'Subject name is required'),
  code: z.string().optional(),
})
type FormData = z.infer<typeof schema>

// ── subject metadata ──────────────────────────────────────
const SUBJECT_META: Record<string, { icon: string; color: string; bg: string; category: string }> = {
  'mathematics':   { icon: '📐', color: '#2563eb', bg: '#eff6ff',  category: 'STEM' },
  'math':          { icon: '📐', color: '#2563eb', bg: '#eff6ff',  category: 'STEM' },
  'english':       { icon: '📖', color: '#7c3aed', bg: '#f5f3ff',  category: 'Language' },
  'science':       { icon: '🔬', color: '#0891b2', bg: '#ecfeff',  category: 'STEM' },
  'social':        { icon: '🌍', color: '#16a34a', bg: '#f0fdf4',  category: 'Humanities' },
  'ict':           { icon: '💻', color: '#6d28d9', bg: '#f5f3ff',  category: 'STEM' },
  'french':        { icon: '🗼', color: '#db2777', bg: '#fdf2f8',  category: 'Language' },
  'religious':     { icon: '✝️',  color: '#d97706', bg: '#fffbeb',  category: 'Humanities' },
  'creative':      { icon: '🎨', color: '#ec4899', bg: '#fdf2f8',  category: 'Arts' },
  'arts':          { icon: '🎨', color: '#ec4899', bg: '#fdf2f8',  category: 'Arts' },
  'physical':      { icon: '⚽', color: '#16a34a', bg: '#f0fdf4',  category: 'Physical' },
  'history':       { icon: '📜', color: '#92400e', bg: '#fffbeb',  category: 'Humanities' },
  'geography':     { icon: '🗺️',  color: '#065f46', bg: '#ecfdf5', category: 'Humanities' },
  'music':         { icon: '🎵', color: '#7c3aed', bg: '#f5f3ff',  category: 'Arts' },
  'computing':     { icon: '🖥️',  color: '#1d4ed8', bg: '#eff6ff', category: 'STEM' },
  'biology':       { icon: '🧬', color: '#16a34a', bg: '#f0fdf4',  category: 'STEM' },
  'chemistry':     { icon: '⚗️',  color: '#dc2626', bg: '#fef2f2', category: 'STEM' },
  'physics':       { icon: '⚛️',  color: '#2563eb', bg: '#eff6ff', category: 'STEM' },
}

function getSubjectMeta(name: string) {
  const lower = name.toLowerCase()
  for (const [key, meta] of Object.entries(SUBJECT_META)) {
    if (lower.includes(key)) return meta
  }
  return { icon: '📚', color: '#6b7280', bg: '#f9fafb', category: 'General' }
}

// ── helpers ───────────────────────────────────────────────
function Btn({ children, onClick, variant = 'primary', type = 'button', disabled, loading, style, form }: any) {
  const [hov, setHov] = useState(false)
  const variants: Record<string, React.CSSProperties> = {
    primary:   { background: hov ? '#5b21b6' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', border: 'none', boxShadow: '0 2px 8px rgba(109,40,217,0.28)' },
    secondary: { background: hov ? '#f5f3ff' : '#fff', color: '#374151', border: '1.5px solid #e5e7eb' },
    danger:    { background: hov ? '#b91c1c' : '#dc2626', color: '#fff', border: 'none' },
  }
  return (
    <button type={type} form={form} onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.15s', opacity: disabled ? 0.6 : 1, fontFamily: '"DM Sans",sans-serif', ...variants[variant], ...style }}>
      {loading && <span style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: '_spin2 0.7s linear infinite', flexShrink: 0 }} />}
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

// ═══════════════════════════════════════════════════════════
export default function SubjectsPage() {
  const { data: subjects = [], isLoading } = useSubjects()
  const createSubject = useCreateSubject()
  const updateSubject = useUpdateSubject()
  const deleteSubject = useDeleteSubject()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) })

  // group by category
  const categorized = useMemo(() => {
    const filtered = subjects.filter(s => {
      const q = search.toLowerCase()
      const matchSearch = !q || s.name.toLowerCase().includes(q) || s.code?.toLowerCase().includes(q)
      const meta = getSubjectMeta(s.name)
      const matchCat = !filterCategory || meta.category === filterCategory
      return matchSearch && matchCat
    })
    const groups: Record<string, typeof subjects> = {}
    filtered.forEach(s => {
      const cat = getSubjectMeta(s.name).category
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(s)
    })
    return groups
  }, [subjects, search, filterCategory])

  const allCategories = useMemo(() => {
    const cats = new Set(subjects.map(s => getSubjectMeta(s.name).category))
    return Array.from(cats).sort()
  }, [subjects])

  const filtered = Object.values(categorized).flat()

  function openCreate() { setEditingSubject(null); reset({}); setModalOpen(true) }
  function openEdit(s: any) { setEditingSubject(s); reset({ name: s.name, code: s.code ?? '' }); setModalOpen(true) }

  async function onSubmit(data: FormData) {
    if (editingSubject) await updateSubject.mutateAsync({ id: editingSubject.id, ...data })
    else await createSubject.mutateAsync(data)
    setModalOpen(false)
  }

  async function handleDelete(s: any) {
    if (!confirm(`Delete subject "${s.name}"? This will remove all associated scores.`)) return
    await deleteSubject.mutateAsync(s.id)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _spin2  { to{transform:rotate(360deg)} }
        @keyframes _fadeUp2 { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes _fadeIn2 { from{opacity:0} to{opacity:1} }
        .sub-card:hover { box-shadow:0 8px 28px rgba(109,40,217,0.14) !important; transform:translateY(-3px) !important; }
        .cat-pill:hover { opacity:0.85 !important; }
      `}</style>

      <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif', animation: '_fadeIn2 0.4s ease' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>Subjects</h1>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 3 }}>{subjects.length} subjects across {allCategories.length} categories</p>
          </div>
          <Btn onClick={openCreate}>➕ Add Subject</Btn>
        </div>

        {/* ── Summary strip ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginBottom: 22 }}>
          {[
            { label: 'Total Subjects', value: subjects.length,          icon: '📚', color: '#6d28d9', bg: '#f5f3ff' },
            { label: 'STEM',           value: subjects.filter(s => ['STEM'].includes(getSubjectMeta(s.name).category)).length, icon: '🔬', color: '#0891b2', bg: '#ecfeff' },
            { label: 'Languages',      value: subjects.filter(s => getSubjectMeta(s.name).category === 'Language').length, icon: '📖', color: '#7c3aed', bg: '#f5f3ff' },
            { label: 'Humanities',     value: subjects.filter(s => getSubjectMeta(s.name).category === 'Humanities').length, icon: '🌍', color: '#16a34a', bg: '#f0fdf4' },
            { label: 'Arts & PE',      value: subjects.filter(s => ['Arts','Physical'].includes(getSubjectMeta(s.name).category)).length, icon: '🎨', color: '#db2777', bg: '#fdf2f8' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', border: '1.5px solid #f0eefe', boxShadow: '0 1px 4px rgba(109,40,217,0.06)', animation: `_fadeUp2 0.4s ease ${i * 0.07}s both` }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 24, fontWeight: 700, color: '#111827', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Filter bar ── */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', border: '1.5px solid #f0eefe', marginBottom: 22, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 15 }}>🔍</span>
            <input placeholder="Search subjects…" value={search} onChange={e => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
              style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: 9, fontSize: 13, border: `1.5px solid ${searchFocused ? '#7c3aed' : '#e5e7eb'}`, boxShadow: searchFocused ? '0 0 0 3px rgba(109,40,217,0.1)' : 'none', outline: 'none', background: '#faf5ff', fontFamily: '"DM Sans",sans-serif', transition: 'all 0.15s' }} />
          </div>

          {/* Category pills */}
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            <button className="cat-pill" onClick={() => setFilterCategory('')}
              style={{ padding: '5px 12px', borderRadius: 99, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', background: !filterCategory ? '#6d28d9' : '#f5f3ff', color: !filterCategory ? '#fff' : '#6d28d9' }}>
              All
            </button>
            {allCategories.map(cat => (
              <button key={cat} className="cat-pill" onClick={() => setFilterCategory(filterCategory === cat ? '' : cat)}
                style={{ padding: '5px 12px', borderRadius: 99, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', background: filterCategory === cat ? '#6d28d9' : '#f5f3ff', color: filterCategory === cat ? '#fff' : '#6d28d9' }}>
                {cat}
              </button>
            ))}
          </div>
          <span style={{ fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap' }}>{filtered.length} subject{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* ── Loading ── */}
        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #ede9fe', borderTopColor: '#6d28d9', animation: '_spin2 0.8s linear infinite' }} />
            <p style={{ fontSize: 13, color: '#9ca3af' }}>Loading subjects…</p>
          </div>
        )}

        {/* ── Empty ── */}
        {!isLoading && filtered.length === 0 && (
          <div style={{ background: '#fff', borderRadius: 16, padding: '60px 20px', textAlign: 'center', border: '1.5px solid #f0eefe' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
            <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 6 }}>{search || filterCategory ? 'No subjects found' : 'No subjects yet'}</h3>
            <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 18 }}>{search || filterCategory ? 'Try adjusting your filters.' : 'Add your first subject to get started.'}</p>
            {!search && !filterCategory && <Btn onClick={openCreate}>➕ Add First Subject</Btn>}
          </div>
        )}

        {/* ── Grouped subject grid ── */}
        {!isLoading && filtered.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {Object.entries(categorized).map(([category, categorySubjects]) => (
              <div key={category}>
                {/* Category header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg,#ede9fe,transparent)' }} />
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '0.12em', background: '#f5f3ff', padding: '4px 12px', borderRadius: 99, border: '1px solid #ede9fe' }}>
                    {category} · {categorySubjects.length}
                  </span>
                  <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg,transparent,#ede9fe)' }} />
                </div>

                {/* Subject cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14 }}>
                  {categorySubjects.map((s, i) => {
                    const meta = getSubjectMeta(s.name)
                    const isHov = hoveredId === s.id
                    return (
                      <div key={s.id} className="sub-card"
                        onMouseEnter={() => setHoveredId(s.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        style={{ background: '#fff', borderRadius: 16, border: `1.5px solid ${isHov ? meta.color + '40' : '#f0eefe'}`, padding: '18px', boxShadow: '0 1px 4px rgba(109,40,217,0.07)', transition: 'all 0.22s', animation: `_fadeUp2 0.35s ease ${i * 0.05}s both`, overflow: 'hidden', position: 'relative' }}>

                        {/* Background icon watermark */}
                        <div style={{ position: 'absolute', bottom: -10, right: -6, fontSize: 52, opacity: 0.05, pointerEvents: 'none', transform: isHov ? 'scale(1.1) rotate(-5deg)' : 'scale(1)', transition: 'transform 0.3s' }}>
                          {meta.icon}
                        </div>

                        {/* Icon */}
                        <div style={{ width: 46, height: 46, borderRadius: 13, background: meta.bg, border: '1.5px solid ' + meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 12, transition: 'transform 0.2s', transform: isHov ? 'scale(1.08) rotate(-3deg)' : 'scale(1)' }}>
                          {meta.icon}
                        </div>

                        {/* Info */}
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: '0 0 3px', lineHeight: 1.3 }}>{s.name}</h3>
                        {s.code && <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace', color: meta.color, background: meta.bg, padding: '2px 7px', borderRadius: 5 }}>{s.code}</span>}

                        {/* Category tag */}
                        <div style={{ marginTop: 10 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: meta.color, background: meta.bg, padding: '3px 8px', borderRadius: 99 }}>{meta.category}</span>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 6, marginTop: 12, paddingTop: 12, borderTop: '1px solid ' + meta.color + '22' }}>
                          <button onClick={() => openEdit(s)}
                            style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', background: meta.bg, color: meta.color, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = meta.color; e.currentTarget.style.color = '#fff' }}
                            onMouseLeave={e => { e.currentTarget.style.background = meta.bg; e.currentTarget.style.color = meta.color }}>
                            ✏️ Edit
                          </button>
                          <button onClick={() => handleDelete(s)}
                            style={{ width: 32, borderRadius: 8, border: '1px solid #fecaca', background: 'transparent', color: '#ef4444', fontSize: 13, cursor: 'pointer', transition: 'all 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                            🗑️
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── ADD / EDIT MODAL ── */}
        <Modal open={modalOpen} onClose={() => setModalOpen(false)}
          title={editingSubject ? 'Edit Subject' : 'Add New Subject'}
          subtitle={editingSubject ? `Editing ${editingSubject.name}` : 'Add a subject to the curriculum'}
          size="sm"
          footer={<>
            <Btn variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Btn>
            <Btn onClick={handleSubmit(onSubmit)} loading={isSubmitting}>{editingSubject ? 'Save Changes' : 'Add Subject'}</Btn>
          </>}
        >
          <form id="subject-form" onSubmit={handleSubmit(onSubmit)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <FieldLabel>Subject Name *</FieldLabel>
                <StyledInput {...register('name')} placeholder="e.g. Mathematics" error={errors.name?.message} />
              </div>
              <div>
                <FieldLabel>Subject Code</FieldLabel>
                <StyledInput {...register('code')} placeholder="e.g. MATH, ENG" />
                <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>Optional short code shown on report cards</p>
              </div>

              {/* Live preview */}
              {/* watch name from form */}
            </div>
          </form>
        </Modal>
      </div>
    </>
  )
}