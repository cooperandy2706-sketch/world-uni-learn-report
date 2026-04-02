import { useState, useMemo, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import Modal from '../../components/ui/Modal'
import toast from 'react-hot-toast'

// ── subject metadata ──────────────────────────────────────
const SUBJECT_META: Record<string, { icon: string; color: string; bg: string; category: string }> = {
  'mathematics':   { icon: '📐', color: '#2563eb', bg: '#eff6ff',  category: 'STEM' },
  'english':       { icon: '📖', color: '#7c3aed', bg: '#f5f3ff',  category: 'Language' },
  'science':       { icon: '🔬', color: '#0891b2', bg: '#ecfeff',  category: 'STEM' },
  'social':        { icon: '🌍', color: '#16a34a', bg: '#f0fdf4',  category: 'Humanities' },
  'ict':           { icon: '💻', color: '#6d28d9', bg: '#f5f3ff',  category: 'STEM' },
  'french':        { icon: '🗼', color: '#db2777', bg: '#fdf2f8',  category: 'Language' },
  'religious':     { icon: '✝️',  color: '#d97706', bg: '#fffbeb',  category: 'Humanities' },
  'creative':      { icon: '🎨', color: '#ec4899', bg: '#fdf2f8',  category: 'Arts' },
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
function Btn({ children, onClick, variant = 'primary', type = 'button', disabled, loading, style }: any) {
  const [hov, setHov] = useState(false)
  const variants: Record<string, React.CSSProperties> = {
    primary:   { background: hov ? '#5b21b6' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', border: 'none', boxShadow: '0 2px 8px rgba(109,40,217,0.28)' },
    secondary: { background: hov ? '#f5f3ff' : '#fff', color: '#374151', border: '1.5px solid #e5e7eb' },
    danger:    { background: hov ? '#b91c1c' : '#dc2626', color: '#fff', border: 'none' },
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.15s', opacity: disabled ? 0.6 : 1, fontFamily: '"DM Sans",sans-serif', ...variants[variant], ...style }}>
      {loading && <span style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: '_spin 0.7s linear infinite', flexShrink: 0 }} />}
      {children}
    </button>
  )
}

function StyledInput({ error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  const [f, setF] = useState(false)
  return (
    <div>
      <input {...props}
        onFocus={e => { setF(true); props.onFocus?.(e) }}
        onBlur={e => { setF(false); props.onBlur?.(e) }}
        style={{ width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 14, border: `1.5px solid ${error ? '#f87171' : f ? '#7c3aed' : '#e5e7eb'}`, boxShadow: f ? '0 0 0 3px rgba(109,40,217,0.1)' : 'none', outline: 'none', background: '#fff', color: '#111827', fontFamily: '"DM Sans",sans-serif', transition: 'all 0.15s', boxSizing: 'border-box' as const }} />
      {error && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>⚠ {error}</p>}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
export default function PlatformSubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSub, setEditingSub] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [form, setForm] = useState({ name: '', code: '' })

  useEffect(() => {
    loadSubjects()
  }, [])

  async function loadSubjects() {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .is('school_id', null)
        .order('name')
      if (error) throw error
      setSubjects(data ?? [])
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  async function onSubmit() {
    if (!form.name) return toast.error('Subject name is required')
    setIsSubmitting(true)
    try {
      if (editingSub) {
        const { error } = await supabase.from('subjects').update(form).eq('id', editingSub.id)
        if (error) throw error
        toast.success('Subject updated')
      } else {
        const { error } = await supabase.from('subjects').insert({ ...form, school_id: null })
        if (error) throw error
        toast.success('Platform subject added')
      }
      setModalOpen(false)
      loadSubjects()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this platform subject? All resources tied to it might lose their mapping.')) return
    try {
      const { error } = await supabase.from('subjects').delete().eq('id', id)
      if (error) throw error
      toast.success('Subject removed')
      loadSubjects()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const openCreate = () => { setEditingSub(null); setForm({ name: '', code: '' }); setModalOpen(true) }
  const openEdit = (s: any) => { setEditingSub(s); setForm({ name: s.name, code: s.code || '' }); setModalOpen(true) }

  return (
    <div style={{ fontFamily: '"DM Sans",sans-serif' }}>
      <style>{`
        @keyframes _fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes _spin { to{transform:rotate(360deg)} }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, margin: 0 }}>📚 Platform Subjects</h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Manage universal subjects available across all schools in your ecosystem.</p>
        </div>
        <Btn onClick={openCreate}>➕ Create New Subject</Btn>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #ede9fe', borderTopColor: '#7c3aed', animation: '_spin 0.8s linear infinite' }} />
        </div>
      ) : subjects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', background: '#fff', borderRadius: 16, border: '1.5px solid #f1f5f9' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🌍</div>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1e293b' }}>No Global Subjects Yet</h3>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>Define subjects here that will be standard for all schools on the platform.</p>
          <Btn onClick={openCreate}>➕ Add First Subject</Btn>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {subjects.map((s, i) => {
            const meta = getSubjectMeta(s.name)
            return (
              <div key={s.id} style={{ background: '#fff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 20, animation: `_fadeUp 0.3s ease ${i * 0.04}s both`, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, border: '1px solid '+meta.color+'22' }}>
                  {meta.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                   <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: '#1e293b' }}>{s.name}</h4>
                   <p style={{ fontSize: 11, fontWeight: 600, color: meta.color, margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{meta.category} {s.code && `· ${s.code}`}</p>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => openEdit(s)} style={{ border: 'none', background: '#f8fafc', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 14, color: '#64748b' }}>✏️</button>
                  <button onClick={() => handleDelete(s.id)} style={{ border: 'none', background: '#fef2f2', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 14, color: '#ef4444' }}>🗑️</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingSub ? 'Edit Subject' : 'New Platform Subject'} size="sm" footer={<>
        <Btn variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Btn>
        <Btn onClick={onSubmit} loading={isSubmitting}>{editingSub ? 'Update' : 'Create'}</Btn>
      </>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>Subject Name *</label>
            <StyledInput value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. Mathematics" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>Subject Code (Optional)</label>
            <StyledInput value={form.code} onChange={e => setForm(prev => ({ ...prev, code: e.target.value }))} placeholder="e.g. MATH101" />
          </div>
        </div>
      </Modal>
    </div>
  )
}
