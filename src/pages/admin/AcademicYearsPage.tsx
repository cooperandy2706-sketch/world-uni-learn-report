// src/pages/admin/AcademicYearsPage.tsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAcademicYears } from '../../hooks/useSettings'
import { yearsService } from '../../services/index'
import { useAuth } from '../../hooks/useAuth'
import Modal from '../../components/ui/Modal'
import { formatDate } from '../../lib/utils'
import toast from 'react-hot-toast'

const schema = z.object({
  name:       z.string().min(1, 'Year name is required e.g. 2024/2025'),
  start_date: z.string().optional(),
  end_date:   z.string().optional(),
})
type FormData = z.infer<typeof schema>

function Btn({ children, onClick, variant = 'primary', type = 'button', disabled, loading, style, form }: any) {
  const [hov, setHov] = useState(false)
  const v: Record<string, React.CSSProperties> = {
    primary:   { background: hov ? '#5b21b6' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', border: 'none', boxShadow: '0 2px 8px rgba(109,40,217,0.28)' },
    secondary: { background: hov ? '#f5f3ff' : '#fff', color: '#374151', border: '1.5px solid #e5e7eb' },
    success:   { background: hov ? '#15803d' : '#16a34a', color: '#fff', border: 'none' },
    ghost:     { background: hov ? '#f5f3ff' : 'transparent', color: '#6d28d9', border: 'none' },
  }
  return (
    <button type={type} form={form} onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.15s', opacity: disabled ? 0.6 : 1, fontFamily: '"DM Sans",sans-serif', ...v[variant], ...style }}>
      {loading && <span style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: '_spn 0.7s linear infinite', flexShrink: 0 }} />}
      {children}
    </button>
  )
}

function StyledInput({ error, label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { error?: string; label?: string }) {
  const [f, setF] = useState(false)
  return (
    <div>
      {label && <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 5 }}>{label}</label>}
      <input {...props} onFocus={e => { setF(true); props.onFocus?.(e) }} onBlur={e => { setF(false); props.onBlur?.(e) }}
        style={{ width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 13, border: `1.5px solid ${error ? '#f87171' : f ? '#7c3aed' : '#e5e7eb'}`, boxShadow: f ? '0 0 0 3px rgba(109,40,217,0.1)' : 'none', outline: 'none', background: '#fff', color: '#111827', fontFamily: '"DM Sans",sans-serif', transition: 'all 0.15s', boxSizing: 'border-box' as const }} />
      {error && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>⚠ {error}</p>}
    </div>
  )
}

export default function AcademicYearsPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const { data: years = [], isLoading } = useAcademicYears()
  const [modalOpen, setModalOpen] = useState(false)

  const create = useMutation({
    mutationFn: (data: any) => yearsService.create({ ...data, school_id: user!.school_id }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['academic-years'] }); toast.success('Academic year created') },
    onError: () => toast.error('Failed to create year'),
  })
  const setCurrent = useMutation({
    mutationFn: (id: string) => yearsService.setCurrent(id, user!.school_id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academic-years'] })
      qc.invalidateQueries({ queryKey: ['academic-year-current'] })
      toast.success('Current year updated')
    },
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    await create.mutateAsync(data)
    setModalOpen(false)
    reset({})
  }

  const currentYear = years.find((y: any) => y.is_current)
  const totalYears = years.length

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _spn { to{transform:rotate(360deg)} }
        @keyframes _fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes _fadeIn { from{opacity:0} to{opacity:1} }
        .yr-card:hover { box-shadow:0 8px 28px rgba(109,40,217,0.13) !important; transform:translateY(-2px) !important; }
      `}</style>

      <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif', animation: '_fadeIn 0.4s ease' }}>

        {/* Header */}
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>Academic Years</h1>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 3 }}>Manage your school's academic calendar</p>
          </div>
          <Btn onClick={() => { reset({}); setModalOpen(true) }}>➕ Add Year</Btn>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Total Years', value: totalYears, icon: '📅', color: '#6d28d9', bg: '#f5f3ff' },
            { label: 'Current Year', value: currentYear?.name ?? 'Not set', icon: '⭐', color: '#d97706', bg: '#fffbeb', isText: true },
            { label: 'Completed', value: years.filter((y: any) => !y.is_current).length, icon: '✅', color: '#16a34a', bg: '#f0fdf4' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 14, padding: '18px', border: '1.5px solid #f0eefe', boxShadow: '0 1px 4px rgba(109,40,217,0.06)', animation: `_fadeUp 0.4s ease ${i * 0.07}s both` }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, marginBottom: 10 }}>{s.icon}</div>
              <div style={{ fontFamily: (s as any).isText ? '"DM Sans",sans-serif' : '"Playfair Display",serif', fontSize: (s as any).isText ? 15 : 26, fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Loading */}
        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #ede9fe', borderTopColor: '#6d28d9', animation: '_spn 0.8s linear infinite' }} />
          </div>
        )}

        {/* Empty */}
        {!isLoading && years.length === 0 && (
          <div style={{ background: '#fff', borderRadius: 16, padding: '60px 20px', textAlign: 'center', border: '1.5px solid #f0eefe' }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>📅</div>
            <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 6 }}>No academic years yet</h3>
            <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 18 }}>Set up your first academic year to get started.</p>
            <Btn onClick={() => { reset({}); setModalOpen(true) }}>➕ Add First Year</Btn>
          </div>
        )}

        {/* Timeline of years */}
        {!isLoading && years.length > 0 && (
          <div style={{ position: 'relative' }}>
            {/* Timeline line */}
            <div style={{ position: 'absolute', left: 22, top: 0, bottom: 0, width: 2, background: 'linear-gradient(180deg,#7c3aed,#ddd6fe)', borderRadius: 99, zIndex: 0 }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingLeft: 8 }}>
              {years.map((y: any, i: number) => (
                <div key={y.id} className="yr-card"
                  style={{ display: 'flex', alignItems: 'center', gap: 0, animation: `_fadeUp 0.4s ease ${i * 0.08}s both` }}>

                  {/* Timeline dot */}
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: y.is_current ? 'linear-gradient(135deg,#f59e0b,#fbbf24)' : '#fff', border: `3px solid ${y.is_current ? '#f59e0b' : '#ddd6fe'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, zIndex: 1, flexShrink: 0, boxShadow: y.is_current ? '0 0 0 4px rgba(245,158,11,0.15)' : 'none', transition: 'all 0.2s' }}>
                    {y.is_current ? '⭐' : '○'}
                  </div>

                  {/* Card */}
                  <div style={{ flex: 1, marginLeft: 16, background: '#fff', borderRadius: 14, padding: '18px 20px', border: `1.5px solid ${y.is_current ? '#f59e0b40' : '#f0eefe'}`, boxShadow: y.is_current ? '0 4px 16px rgba(245,158,11,0.12)' : '0 1px 4px rgba(109,40,217,0.06)', transition: 'all 0.22s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#111827' }}>{y.name}</span>
                            {y.is_current && (
                              <span style={{ fontSize: 11, fontWeight: 800, background: 'linear-gradient(135deg,#f59e0b,#fbbf24)', color: '#fff', padding: '2px 9px', borderRadius: 99, boxShadow: '0 2px 6px rgba(245,158,11,0.3)' }}>
                                CURRENT
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#6b7280' }}>
                            <span>📅 Start: <strong style={{ color: '#374151' }}>{y.start_date ? formatDate(y.start_date) : 'Not set'}</strong></span>
                            <span>🏁 End: <strong style={{ color: '#374151' }}>{y.end_date ? formatDate(y.end_date) : 'Not set'}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        {!y.is_current && (
                          <Btn variant="success" onClick={() => setCurrent.mutate(y.id)} loading={setCurrent.isPending}>
                            ⭐ Set Current
                          </Btn>
                        )}
                        {y.is_current && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 9, padding: '7px 14px', fontSize: 13, fontWeight: 600, color: '#16a34a' }}>
                            ✓ Active Year
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Modal */}
        <Modal open={modalOpen} onClose={() => setModalOpen(false)}
          title="Add Academic Year"
          subtitle="Set up a new academic year for your school"
          size="sm"
          footer={<>
            <Btn variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Btn>
            <Btn onClick={handleSubmit(onSubmit)} loading={isSubmitting}>Add Year</Btn>
          </>}
        >
          <form id="year-form" onSubmit={handleSubmit(onSubmit)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <StyledInput label="Year Name *" {...register('name')} placeholder="e.g. 2024/2025" error={errors.name?.message} />
              <StyledInput label="Start Date" {...register('start_date')} type="date" />
              <StyledInput label="End Date" {...register('end_date')} type="date" />
            </div>
          </form>
        </Modal>
      </div>
    </>
  )
}