// src/pages/admin/TermsPage.tsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAcademicYears, useCurrentAcademicYear, useTerms } from '../../hooks/useSettings'
import { termsService } from '../../services/index'
import { useAuth } from '../../hooks/useAuth'
import Modal from '../../components/ui/Modal'
import { formatDate } from '../../lib/utils'
import toast from 'react-hot-toast'

const schema = z.object({
  name:             z.string().min(1, 'Term name is required'),
  academic_year_id: z.string().min(1, 'Select an academic year'),
  start_date:       z.string().optional(),
  end_date:         z.string().optional(),
})
type FormData = z.infer<typeof schema>

function Btn({ children, onClick, variant = 'primary', type = 'button', disabled, loading, style, form }: any) {
  const [hov, setHov] = useState(false)
  const v: Record<string, React.CSSProperties> = {
    primary:   { background: hov ? '#5b21b6' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', border: 'none', boxShadow: '0 2px 8px rgba(109,40,217,0.28)' },
    secondary: { background: hov ? '#f5f3ff' : '#fff', color: '#374151', border: '1.5px solid #e5e7eb' },
    danger:    { background: hov ? '#b91c1c' : '#dc2626', color: '#fff', border: 'none' },
    success:   { background: hov ? '#15803d' : '#16a34a', color: '#fff', border: 'none' },
    warning:   { background: hov ? '#b45309' : '#d97706', color: '#fff', border: 'none' },
  }
  return (
    <button type={type} form={form} onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.15s', opacity: disabled ? 0.6 : 1, fontFamily: '"DM Sans",sans-serif', ...v[variant], ...style }}>
      {loading && <span style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: '_tspn 0.7s linear infinite', flexShrink: 0 }} />}
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

function StyledSelect({ label, error, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string }) {
  const [f, setF] = useState(false)
  return (
    <div>
      {label && <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 5 }}>{label}</label>}
      <select {...props} onFocus={e => { setF(true); props.onFocus?.(e) }} onBlur={e => { setF(false); props.onBlur?.(e) }}
        style={{ width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 13, border: `1.5px solid ${f ? '#7c3aed' : '#e5e7eb'}`, boxShadow: f ? '0 0 0 3px rgba(109,40,217,0.1)' : 'none', outline: 'none', background: '#fff', color: '#111827', fontFamily: '"DM Sans",sans-serif', cursor: 'pointer', boxSizing: 'border-box' as const }}>
        {children}
      </select>
      {error && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>⚠ {error}</p>}
    </div>
  )
}

const TERM_COLORS: Record<string, { color: string; bg: string; light: string }> = {
  'Term 1': { color: '#6d28d9', bg: '#f5f3ff', light: '#ede9fe' },
  'Term 2': { color: '#0891b2', bg: '#ecfeff', light: '#cffafe' },
  'Term 3': { color: '#d97706', bg: '#fffbeb', light: '#fef3c7' },
}

function getTermColor(name: string) {
  return TERM_COLORS[name] ?? { color: '#6d28d9', bg: '#f5f3ff', light: '#ede9fe' }
}

export default function TermsPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const { data: years = [] } = useAcademicYears()
  const { data: currentYear } = useCurrentAcademicYear()
  const [selectedYearId, setSelectedYearId] = useState('')
  const effectiveYearId = selectedYearId || currentYear?.id || ''
  const { data: terms = [], isLoading } = useTerms(effectiveYearId)
  const [modalOpen, setModalOpen] = useState(false)

  const create = useMutation({
    mutationFn: (data: any) => termsService.create({ ...data, school_id: user!.school_id }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['terms'] }); toast.success('Term created') },
    onError: () => toast.error('Failed to create term'),
  })
  const lock = useMutation({
    mutationFn: (id: string) => termsService.lock(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['terms'] }); qc.invalidateQueries({ queryKey: ['term-current'] }); toast.success('Term locked — teachers cannot submit scores') },
  })
  const unlock = useMutation({
    mutationFn: (id: string) => termsService.unlock(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['terms'] }); qc.invalidateQueries({ queryKey: ['term-current'] }); toast.success('Term unlocked') },
  })
  const setCurrent = useMutation({
    mutationFn: (id: string) => termsService.setCurrent(id, user!.school_id),
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ['terms'] })
      qc.invalidateQueries({ queryKey: ['term-current'] })
      toast.success('Current term updated and financial records rolled over successfully') 
    },
    onError: () => toast.error('Failed to change term. Could not compute rollovers.'),
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    await create.mutateAsync(data)
    setModalOpen(false)
    reset({})
  }

  const currentTerm = terms.find((t: any) => t.is_current)
  const lockedCount = terms.filter((t: any) => t.is_locked).length

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _tspn { to{transform:rotate(360deg)} }
        @keyframes _tfadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes _tfadeIn { from{opacity:0} to{opacity:1} }
        .term-card:hover { box-shadow:0 8px 28px rgba(109,40,217,0.13) !important; transform:translateY(-2px) !important; }
      `}</style>

      <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif', animation: '_tfadeIn 0.4s ease' }}>

        {/* Header */}
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>Terms</h1>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 3 }}>Manage academic terms, dates and lock status</p>
          </div>
          <Btn onClick={() => { reset({ academic_year_id: effectiveYearId }); setModalOpen(true) }}>➕ Add Term</Btn>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 22 }}>
          {[
            { label: 'Total Terms', value: terms.length, icon: '📆', color: '#6d28d9', bg: '#f5f3ff' },
            { label: 'Current Term', value: currentTerm?.name ?? 'Not set', icon: '📌', color: '#d97706', bg: '#fffbeb', isText: true },
            { label: 'Locked Terms', value: lockedCount, icon: '🔒', color: '#dc2626', bg: '#fef2f2' },
            { label: 'Open Terms', value: terms.length - lockedCount, icon: '🟢', color: '#16a34a', bg: '#f0fdf4' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', border: '1.5px solid #f0eefe', boxShadow: '0 1px 4px rgba(109,40,217,0.06)', animation: `_tfadeUp 0.4s ease ${i * 0.07}s both` }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontFamily: (s as any).isText ? '"DM Sans",sans-serif' : '"Playfair Display",serif', fontSize: (s as any).isText ? 14 : 26, fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Year selector */}
        {years.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 14, padding: '14px 18px', border: '1.5px solid #f0eefe', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 14 }}>📅</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>Academic Year:</span>
            <select value={selectedYearId || currentYear?.id || ''}
              onChange={e => setSelectedYearId(e.target.value)}
              style={{ flex: 1, maxWidth: 260, padding: '7px 12px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: 13, color: '#111827', outline: 'none', background: '#faf5ff', fontFamily: '"DM Sans",sans-serif', cursor: 'pointer' }}>
              {(years as any[]).map((y: any) => <option key={y.id} value={y.id}>{y.name}{y.is_current ? ' (Current)' : ''}</option>)}
            </select>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #ede9fe', borderTopColor: '#6d28d9', animation: '_tspn 0.8s linear infinite' }} />
          </div>
        )}

        {/* Empty */}
        {!isLoading && terms.length === 0 && (
          <div style={{ background: '#fff', borderRadius: 16, padding: '60px 20px', textAlign: 'center', border: '1.5px solid #f0eefe' }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>📆</div>
            <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 6 }}>No terms yet</h3>
            <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 18 }}>Add terms for the selected academic year.</p>
            <Btn onClick={() => { reset({ academic_year_id: effectiveYearId }); setModalOpen(true) }}>➕ Add First Term</Btn>
          </div>
        )}

        {/* Terms cards */}
        {!isLoading && terms.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 18 }}>
            {(terms as any[]).map((t: any, i: number) => {
              const tc = getTermColor(t.name)
              return (
                <div key={t.id} className="term-card"
                  style={{ background: '#fff', borderRadius: 18, border: `1.5px solid ${t.is_current ? tc.color + '50' : '#f0eefe'}`, overflow: 'hidden', boxShadow: t.is_current ? `0 4px 20px ${tc.color}18` : '0 1px 4px rgba(109,40,217,0.07)', transition: 'all 0.22s', animation: `_tfadeUp 0.4s ease ${i * 0.08}s both` }}>

                  {/* Coloured header */}
                  <div style={{ background: `linear-gradient(135deg,${tc.bg},${tc.light})`, padding: '18px 20px', borderBottom: `1px solid ${tc.color}20`, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: tc.color + '12' }} />
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <div style={{ width: 38, height: 38, borderRadius: 11, background: tc.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                            {t.is_locked ? '🔒' : '📆'}
                          </div>
                          <div>
                            <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: tc.color, margin: 0 }}>{t.name}</h3>
                            <p style={{ fontSize: 11, color: tc.color + 'aa', margin: 0 }}>
                              {(years as any[]).find((y: any) => y.id === t.academic_year_id)?.name ?? ''}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 5 }}>
                        {t.is_current && (
                          <span style={{ fontSize: 10, fontWeight: 800, background: tc.color, color: '#fff', padding: '3px 9px', borderRadius: 99 }}>CURRENT</span>
                        )}
                        <span style={{ fontSize: 10, fontWeight: 800, background: t.is_locked ? '#dc2626' : '#16a34a', color: '#fff', padding: '3px 9px', borderRadius: 99 }}>
                          {t.is_locked ? 'LOCKED' : 'OPEN'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div style={{ padding: '16px 20px' }}>
                    {/* Dates */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                      <div style={{ background: '#faf5ff', borderRadius: 9, padding: '9px 12px' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Starts</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{t.start_date ? formatDate(t.start_date) : 'Not set'}</div>
                      </div>
                      <div style={{ background: '#faf5ff', borderRadius: 9, padding: '9px 12px' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Ends</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{t.end_date ? formatDate(t.end_date) : 'Not set'}</div>
                      </div>
                    </div>

                    {/* Lock warning */}
                    {t.is_locked && (
                      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 9, padding: '8px 12px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#dc2626' }}>
                        <span>🔒</span> Teachers cannot submit scores while locked
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 7 }}>
                      {!t.is_current && (
                        <Btn variant="success" onClick={() => {
                          if (confirm(`Set "${t.name}" as the current term? This will automatically compute and roll over all student financial debts from the old term into arrears.`)) setCurrent.mutate(t.id)
                        }} loading={setCurrent.isPending}
                          style={{ flex: 1, justifyContent: 'center', padding: '8px 10px', fontSize: 12 }}>
                          📌 {setCurrent.isPending ? 'Rolling over...' : 'Set Current'}
                        </Btn>
                      )}
                      {t.is_locked ? (
                        <Btn variant="secondary" onClick={() => unlock.mutate(t.id)} loading={unlock.isPending}
                          style={{ flex: 1, justifyContent: 'center', padding: '8px 10px', fontSize: 12 }}>
                          🔓 Unlock
                        </Btn>
                      ) : (
                        <Btn variant="danger" onClick={() => {
                          if (confirm(`Lock "${t.name}"? Teachers won't be able to submit scores.`)) lock.mutate(t.id)
                        }} loading={lock.isPending}
                          style={{ flex: 1, justifyContent: 'center', padding: '8px 10px', fontSize: 12 }}>
                          🔒 Lock Term
                        </Btn>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Add Modal */}
        <Modal open={modalOpen} onClose={() => setModalOpen(false)}
          title="Add Term"
          subtitle="Create a new term for the selected academic year"
          size="sm"
          footer={<>
            <Btn variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Btn>
            <Btn onClick={handleSubmit(onSubmit)} loading={isSubmitting}>Add Term</Btn>
          </>}
        >
          <form id="term-form" onSubmit={handleSubmit(onSubmit)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <StyledSelect label="Academic Year *" {...register('academic_year_id')} error={errors.academic_year_id?.message}>
                <option value="">Select year…</option>
                {(years as any[]).map((y: any) => <option key={y.id} value={y.id}>{y.name}</option>)}
              </StyledSelect>
              <StyledSelect label="Term Name *" {...register('name')} error={errors.name?.message}>
                <option value="">Select term…</option>
                <option value="Term 1">Term 1</option>
                <option value="Term 2">Term 2</option>
                <option value="Term 3">Term 3</option>
              </StyledSelect>
              <StyledInput label="Start Date" {...register('start_date')} type="date" />
              <StyledInput label="End Date" {...register('end_date')} type="date" />
            </div>
          </form>
        </Modal>
      </div>
    </>
  )
}