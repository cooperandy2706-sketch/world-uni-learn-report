// src/pages/admin/StudentsPage.tsx
import { useState, useRef, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import * as XLSX from 'xlsx'
import {
  useStudents, useCreateStudent, useUpdateStudent, useDeleteStudent,
} from '../../hooks/useStudents'
import { useClasses } from '../../hooks/useClasses'
import { useAuth } from '../../hooks/useAuth'
import { studentsService } from '../../services/students.service'
import Modal from '../../components/ui/Modal'
import { formatDate } from '../../lib/utils'
import toast from 'react-hot-toast'

const schema = z.object({
  full_name:      z.string().min(2, 'Name is required'),
  student_id:     z.string().optional().or(z.literal('')),
  class_id:       z.string().optional().or(z.literal('')),
  gender:         z.enum(['male', 'female']).optional().or(z.literal('')),
  date_of_birth:  z.string().optional().or(z.literal('')),
  house:          z.string().optional().or(z.literal('')),
  guardian_name:  z.string().optional().or(z.literal('')),
  guardian_phone: z.string().optional().or(z.literal('')),
  guardian_email: z.string().optional().or(z.literal('')),
  address:        z.string().optional().or(z.literal('')),
})
type FormData = z.infer<typeof schema>

// ── helpers ───────────────────────────────────────────────
function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const colors = ['#6d28d9','#0891b2','#16a34a','#d97706','#dc2626','#7c3aed','#0284c7']
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
export default function StudentsPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const { data: students = [], isLoading } = useStudents()
  const { data: classes = [] } = useClasses()
  const createStudent = useCreateStudent()
  const updateStudent = useUpdateStudent()
  const deleteStudent = useDeleteStudent()

  const [modalOpen, setModalOpen] = useState(false)
  const [viewModal, setViewModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState<any>(null)
  const [viewingStudent, setViewingStudent] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [filterGender, setFilterGender] = useState('')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [importLoading, setImportLoading] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  
  // New: Account Creation State
  const [accountModalOpen, setAccountModalOpen] = useState(false)
  const [accountStudent, setAccountStudent] = useState<any>(null)
  const [accountLoading, setAccountLoading] = useState(false)
  const [accountData, setAccountData] = useState({ email: '', password: '' })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const filtered = useMemo(() => students.filter(s => {
    const q = search.toLowerCase()
    const matchSearch = !q || s.full_name.toLowerCase().includes(q) || s.student_id?.toLowerCase().includes(q)
    const matchClass = !filterClass || s.class_id === filterClass
    const matchGender = !filterGender || s.gender === filterGender
    return matchSearch && matchClass && matchGender
  }), [students, search, filterClass, filterGender])

  function openCreate() { setEditingStudent(null); reset({}); setModalOpen(true) }
  function openEdit(s: any) {
    setEditingStudent(s)
    reset({ full_name: s.full_name, student_id: s.student_id ?? '', class_id: s.class_id ?? '', gender: s.gender ?? undefined, date_of_birth: s.date_of_birth ?? '', house: s.house ?? '', guardian_name: s.guardian_name ?? '', guardian_phone: s.guardian_phone ?? '', guardian_email: s.guardian_email ?? '', address: s.address ?? '' })
    setModalOpen(true)
  }

  async function onSubmit(data: FormData) {
    try {
      // Convert empty strings to null so Supabase accepts them
      const clean: any = {}
      Object.entries(data).forEach(([k, v]) => {
        clean[k] = (v === '' || v === undefined) ? null : v
      })
      const payload = { ...clean, school_id: user!.school_id, is_active: true }
      console.log('Saving student payload:', payload)

      if (editingStudent) {
        const result = await supabase
          .from('students')
          .update(payload)
          .eq('id', editingStudent.id)
          .select()
          .single()
        console.log('Update result:', result)
        if (result.error) throw result.error
        toast.success('Student updated')
        qc.invalidateQueries({ queryKey: ['students'] })
      } else {
        await createStudent.mutateAsync(payload)
      }
      setModalOpen(false)
      reset({})

    } catch (err: any) {
      console.error('Save failed:', err)
      toast.error(err?.message ?? 'Failed to save student')
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remove "${name}"? This cannot be undone.`)) return
    await deleteStudent.mutateAsync(id)
  }

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
      if (data?.error) throw new Error(data.error)

      toast.success('Student account created successfully!')
      setAccountModalOpen(false)
      setAccountData({ email: '', password: '' })
      qc.invalidateQueries({ queryKey: ['students'] })
    } catch (err: any) {
      console.error('Account creation failed:', err)
      toast.error(err.message || 'Failed to create student account')
    } finally {
      setAccountLoading(false)
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setImportLoading(true)
    try {
      const wb = XLSX.read(await file.arrayBuffer())
      const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]])

      if (rows.length === 0) { toast.error('File is empty or has no data rows'); return }

      const data = rows
        .filter(r => {
          const name = (r['Full Name'] ?? r['full_name'] ?? '').toString().trim()
          return name.length > 1
        })
        .map(r => {
          const gender = (r['Gender'] ?? r['gender'] ?? '').toString().toLowerCase().trim()
          return {
            full_name:      (r['Full Name']      ?? r['full_name']      ?? '').toString().trim(),
            student_id:     (r['Student ID']     ?? r['student_id']     ?? '').toString().trim() || null,
            gender:         ['male','female'].includes(gender) ? gender : null,
            house:          (r['House']          ?? r['house']          ?? '').toString().trim() || null,
            guardian_name:  (r['Guardian Name']  ?? r['guardian_name']  ?? '').toString().trim() || null,
            guardian_phone: (r['Guardian Phone'] ?? r['guardian_phone'] ?? '').toString().trim() || null,
            guardian_email: (r['Guardian Email'] ?? r['guardian_email'] ?? '').toString().trim() || null,
            school_id: user!.school_id,
            is_active: true,
          }
        })

      if (data.length === 0) { toast.error('No valid students found in file'); return }

      // Insert in batches of 200
      const BATCH = 200
      let imported = 0
      for (let i = 0; i < data.length; i += BATCH) {
        const batch = data.slice(i, i + BATCH)
        const { error } = await studentsService.bulkUpsert(batch)
        if (error) throw new Error(`Batch ${Math.floor(i/BATCH)+1} failed: ${error.message}`)
        imported += batch.length
      }
      toast.success(`${imported} students imported successfully`)
    } catch (err: any) {
      console.error('Import error:', err)
      toast.error(err?.message ?? 'Import failed')
    }
    finally { setImportLoading(false); if (fileRef.current) fileRef.current.value = '' }
  }

  const totalMale = students.filter(s => s.gender === 'male').length
  const totalFemale = students.filter(s => s.gender === 'female').length

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _spin { to{transform:rotate(360deg)} }
        @keyframes _fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes _fadeIn { from{opacity:0} to{opacity:1} }
        .std-row:hover { background:#faf5ff !important; }
        .std-card:hover { box-shadow:0 8px 28px rgba(109,40,217,0.13) !important; transform:translateY(-2px) !important; }
        .action-btn:hover { background:#f5f3ff !important; color:#6d28d9 !important; }
        .del-btn:hover { background:#fef2f2 !important; color:#dc2626 !important; }
      `}</style>

      <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif', animation: '_fadeIn 0.4s ease' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>Students</h1>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 3 }}>{students.length} enrolled students across {classes.length} classes</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input ref={fileRef} type="file" accept=".xlsx,.csv" style={{ display: 'none' }} onChange={handleImport} />
            <Btn variant="secondary" onClick={() => fileRef.current?.click()} loading={importLoading}>
              📥 Import Excel
            </Btn>
            <Btn onClick={openCreate}>➕ Add Student</Btn>
          </div>
        </div>

        {/* ── Summary cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 22 }}>
          {[
            { label: 'Total Students', value: students.length, icon: '👥', color: '#6d28d9', bg: '#f5f3ff' },
            { label: 'Male Students', value: totalMale, icon: '👦', color: '#0891b2', bg: '#ecfeff' },
            { label: 'Female Students', value: totalFemale, icon: '👧', color: '#db2777', bg: '#fdf2f8' },
            { label: 'Classes', value: classes.length, icon: '🏫', color: '#16a34a', bg: '#f0fdf4' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', border: '1.5px solid #f0eefe', boxShadow: '0 1px 4px rgba(109,40,217,0.06)', animation: `_fadeUp 0.4s ease ${i * 0.07}s both` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{s.icon}</div>
              </div>
              <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#111827', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Filters bar ── */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '14px 18px', border: '1.5px solid #f0eefe', marginBottom: 18, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          {/* Search */}
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

          {/* Class filter */}
          <StyledSelect value={filterClass} onChange={e => setFilterClass(e.target.value)} style={{ flex: '1 1 160px', maxWidth: 200 }}>
            <option value="">All Classes</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </StyledSelect>

          {/* Gender filter */}
          <StyledSelect value={filterGender} onChange={e => setFilterGender(e.target.value)} style={{ flex: '1 1 130px', maxWidth: 160 }}>
            <option value="">All Genders</option>
            <option value="male">♂ Male</option>
            <option value="female">♀ Female</option>
          </StyledSelect>

          {/* View toggle */}
          <div style={{ display: 'flex', background: '#f5f3ff', borderRadius: 9, padding: 3, gap: 2 }}>
            {(['table', 'grid'] as const).map(m => (
              <button key={m} onClick={() => setViewMode(m)}
                style={{ padding: '6px 12px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s', background: viewMode === m ? '#6d28d9' : 'transparent', color: viewMode === m ? '#fff' : '#6b7280' }}>
                {m === 'table' ? '☰ Table' : '⊞ Grid'}
              </button>
            ))}
          </div>

          {/* Results count */}
          <span style={{ fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap' }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* ── Loading ── */}
        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #ede9fe', borderTopColor: '#6d28d9', animation: '_spin 0.8s linear infinite' }} />
            <p style={{ fontSize: 13, color: '#9ca3af' }}>Loading students…</p>
          </div>
        )}

        {/* ── Empty state ── */}
        {!isLoading && filtered.length === 0 && (
          <div style={{ background: '#fff', borderRadius: 16, padding: '60px 20px', textAlign: 'center', border: '1.5px solid #f0eefe' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎓</div>
            <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 6 }}>
              {search || filterClass || filterGender ? 'No students found' : 'No students yet'}
            </h3>
            <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 18 }}>
              {search || filterClass || filterGender ? 'Try adjusting your filters.' : 'Start by adding your first student.'}
            </p>
            {!search && !filterClass && !filterGender && <Btn onClick={openCreate}>➕ Add First Student</Btn>}
          </div>
        )}

        {/* ── TABLE VIEW ── */}
        {!isLoading && filtered.length > 0 && viewMode === 'table' && (
          <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', overflow: 'hidden', boxShadow: '0 1px 4px rgba(109,40,217,0.06)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(135deg,#faf5ff,#f5f3ff)', borderBottom: '1.5px solid #ede9fe' }}>
                  {['Student', 'ID', 'Class', 'Gender', 'House', 'Guardian', 'Actions'].map(h => (
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
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{s.full_name}</div>
                          {s.date_of_birth && <div style={{ fontSize: 11, color: '#9ca3af' }}>{formatDate(s.date_of_birth)}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 12, fontFamily: 'monospace', background: '#f5f3ff', color: '#6d28d9', padding: '2px 7px', borderRadius: 5 }}>{s.student_id ?? '—'}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, background: '#ede9fe', color: '#5b21b6', padding: '3px 9px', borderRadius: 99 }}>{(s as any).class?.name ?? 'Unassigned'}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, background: s.gender === 'male' ? '#eff6ff' : s.gender === 'female' ? '#fdf2f8' : '#f3f4f6', color: s.gender === 'male' ? '#2563eb' : s.gender === 'female' ? '#db2777' : '#6b7280', padding: '3px 9px', borderRadius: 99 }}>
                        {s.gender === 'male' ? '♂ Male' : s.gender === 'female' ? '♀ Female' : '—'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280' }}>{s.house ?? '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{s.guardian_name ?? '—'}</div>
                      {s.guardian_phone && <div style={{ fontSize: 11, color: '#9ca3af' }}>{s.guardian_phone}</div>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="action-btn" onClick={() => { setViewingStudent(s); setViewModal(true) }}
                          style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: '#f5f3ff', color: '#6d28d9', cursor: 'pointer', fontSize: 14, transition: 'all 0.15s' }} title="View Profile">👁️</button>
                        
                        {!s.user_id && (
                          <button className="action-btn" onClick={() => { setAccountStudent(s); setAccountData(prev => ({ ...prev, email: s.guardian_email || '' })); setAccountModalOpen(true) }}
                            style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: '#ecfdf5', color: '#059669', cursor: 'pointer', fontSize: 13, transition: 'all 0.15s' }} title="Create Portal Login">🔑</button>
                        )}
                        {s.user_id && (
                          <div style={{ width: 30, height: 30, borderRadius: 8, background: '#f0fdf4', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }} title="Account Linked">✅</div>
                        )}

                        <button className="action-btn" onClick={() => openEdit(s)}
                          style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: '#f5f3ff', color: '#6d28d9', cursor: 'pointer', fontSize: 14, transition: 'all 0.15s' }} title="Edit Details">✏️</button>
                        <button className="del-btn" onClick={() => handleDelete(s.id, s.full_name)}
                          style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: 14, transition: 'all 0.15s' }} title="Remove Student">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── GRID VIEW ── */}
        {!isLoading && filtered.length > 0 && viewMode === 'grid' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16 }}>
            {filtered.map((s, i) => (
              <div key={s.id} className="std-card"
                style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', padding: '20px', boxShadow: '0 1px 4px rgba(109,40,217,0.07)', transition: 'all 0.2s', animation: `_fadeUp 0.35s ease ${i * 0.04}s both` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                  <Avatar name={s.full_name} size={44} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.full_name}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{s.student_id ?? 'No ID'}</div>
                    <div style={{ marginTop: 5, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, background: '#ede9fe', color: '#5b21b6', padding: '2px 7px', borderRadius: 99 }}>{(s as any).class?.name ?? 'No class'}</span>
                      {s.gender && <span style={{ fontSize: 10, fontWeight: 700, background: s.gender === 'male' ? '#eff6ff' : '#fdf2f8', color: s.gender === 'male' ? '#2563eb' : '#db2777', padding: '2px 7px', borderRadius: 99 }}>{s.gender === 'male' ? '♂' : '♀'}</span>}
                    </div>
                  </div>
                </div>
                {s.guardian_name && <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 5 }}><span>👨‍👩‍👦</span>{s.guardian_name}</div>}
                <div style={{ display: 'flex', gap: 6, borderTop: '1px solid #faf5ff', paddingTop: 12 }}>
                  <button onClick={() => { setViewingStudent(s); setViewModal(true) }}
                    style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', background: '#f5f3ff', color: '#6d28d9', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>View</button>
                  <button onClick={() => openEdit(s)}
                    style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', background: '#f5f3ff', color: '#6d28d9', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => handleDelete(s.id, s.full_name)}
                    style={{ width: 32, padding: '7px 0', borderRadius: 8, border: 'none', background: '#fef2f2', color: '#dc2626', fontSize: 13, cursor: 'pointer' }}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── ADD / EDIT MODAL ── */}
        <Modal open={modalOpen} onClose={() => setModalOpen(false)}
          title={editingStudent ? 'Edit Student' : 'Add New Student'}
          subtitle={editingStudent ? `Editing ${editingStudent.full_name}` : 'Fill in the student details below'}
          size="lg"
          footer={<>
            <Btn variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Btn>
            <Btn onClick={handleSubmit(onSubmit)} loading={isSubmitting}>{editingStudent ? 'Save Changes' : 'Add Student'}</Btn>
          </>}
        >
          <form id="student-form" onSubmit={handleSubmit(onSubmit)}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <Field label="Full Name *">
                  <StyledInput {...register('full_name')} placeholder="e.g. Kofi Mensah" error={errors.full_name?.message} />
                </Field>
              </div>
              <Field label="Student ID"><StyledInput {...register('student_id')} placeholder="e.g. STU-001" /></Field>
              <Field label="Class">
                <StyledSelect {...register('class_id')}>
                  <option value="">Select class…</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </StyledSelect>
              </Field>
              <Field label="Gender">
                <StyledSelect {...register('gender')}>
                  <option value="">Select gender…</option>
                  <option value="male">♂ Male</option>
                  <option value="female">♀ Female</option>
                </StyledSelect>
              </Field>
              <Field label="Date of Birth"><StyledInput {...register('date_of_birth')} type="date" /></Field>
              <Field label="House"><StyledInput {...register('house')} placeholder="e.g. Blue House" /></Field>
            </div>

            <div style={{ margin: '18px 0 14px', height: 1, background: '#f5f3ff' }} />
            <p style={{ fontSize: 12, fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>👨‍👩‍👦 Guardian Information</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Guardian Name"><StyledInput {...register('guardian_name')} placeholder="e.g. Mr. Kwame Mensah" /></Field>
              <Field label="Phone"><StyledInput {...register('guardian_phone')} placeholder="024 000 0000" /></Field>
              <div style={{ gridColumn: '1 / -1' }}>
                <Field label="Guardian Email"><StyledInput {...register('guardian_email')} type="email" placeholder="guardian@email.com" error={errors.guardian_email?.message} /></Field>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <Field label="Address"><StyledInput {...register('address')} placeholder="Student's home address" /></Field>
              </div>
            </div>
          </form>
        </Modal>

        {/* ── VIEW MODAL ── */}
        <Modal open={viewModal} onClose={() => setViewModal(false)} title="Student Profile" size="md">
          {viewingStudent && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', background: 'linear-gradient(135deg,#faf5ff,#f5f3ff)', borderRadius: 12, marginBottom: 18 }}>
                <Avatar name={viewingStudent.full_name} size={52} />
                <div>
                  <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>{viewingStudent.full_name}</h3>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{(viewingStudent as any).class?.name ?? 'No class assigned'}</div>
                  <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                    {viewingStudent.student_id && <span style={{ fontSize: 11, fontWeight: 700, background: '#ede9fe', color: '#5b21b6', padding: '2px 8px', borderRadius: 99 }}>{viewingStudent.student_id}</span>}
                    {viewingStudent.gender && <span style={{ fontSize: 11, fontWeight: 700, background: viewingStudent.gender === 'male' ? '#eff6ff' : '#fdf2f8', color: viewingStudent.gender === 'male' ? '#2563eb' : '#db2777', padding: '2px 8px', borderRadius: 99 }}>{viewingStudent.gender === 'male' ? '♂ Male' : '♀ Female'}</span>}
                    {viewingStudent.house && <span style={{ fontSize: 11, fontWeight: 700, background: '#f0fdf4', color: '#16a34a', padding: '2px 8px', borderRadius: 99 }}>🏠 {viewingStudent.house}</span>}
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Date of Birth', value: formatDate(viewingStudent.date_of_birth) },
                  { label: 'Enrolled', value: formatDate(viewingStudent.created_at) },
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
              <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
                <Btn variant="secondary" style={{ flex: 1 }} onClick={() => { setViewModal(false); openEdit(viewingStudent) }}>✏️ Edit Student</Btn>
                <Btn variant="danger" onClick={() => { setViewModal(false); handleDelete(viewingStudent.id, viewingStudent.full_name) }}>🗑️ Remove</Btn>
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
              <strong>Note:</strong> This will create a permanent login for the student to access their grades and dashboard.
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