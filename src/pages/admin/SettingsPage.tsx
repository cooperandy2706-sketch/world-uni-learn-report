// src/pages/admin/SettingsPage.tsx
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { KeyRound, Eye, EyeOff } from 'lucide-react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '../../lib/supabase'
import { useSettings, useUpdateSettings } from '../../hooks/useSettings'
import { useAuth } from '../../hooks/useAuth'
import { settingsService } from '../../services/index'
import GradingSetupTab from '../../components/admin/GradingSetupTab'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import ReportCard from '../../components/reports/ReportCard'
import { useCurrentTerm, useCurrentAcademicYear } from '../../hooks/useSettings'

const schema = z.object({
  school_name: z.string().min(1, 'School name is required'),
  school_motto: z.string().optional(),
  school_email: z.string().email('Invalid email').optional().or(z.literal('')),
  school_phone: z.string().optional().or(z.literal('')),
  school_address: z.string().optional(),
  headteacher_name: z.string().optional(),
  next_term_date: z.string().optional(),
  school_fees_info: z.string().optional(),
  school_news: z.string().optional(),
  paystack_public_key: z.string().optional().or(z.literal('')),
  currency_code: z.string().optional(),
  report_theme: z.enum(['modern', 'classic', 'professional']),
  primary_color: z.string(),
})
type FormData = z.infer<typeof schema>

// ── helpers ───────────────────────────────────────────────
function Btn({ children, onClick, variant = 'primary', type = 'button', disabled, loading, style, form }: any) {
  const [hov, setHov] = useState(false)
  const v: Record<string, React.CSSProperties> = {
    primary: { background: hov ? '#5b21b6' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', border: 'none', boxShadow: '0 2px 8px rgba(109,40,217,0.28)' },
    secondary: { background: hov ? '#f5f3ff' : '#fff', color: 'var(--text-main)', border: '1.5px solid var(--border-color)' },
    ghost: { background: hov ? '#f5f3ff' : 'transparent', color: 'var(--text-muted)', border: 'none' },
  }
  return (
    <button type={type} form={form} onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.15s', opacity: disabled ? 0.6 : 1, fontFamily: '"DM Sans",sans-serif', ...v[variant], ...style }}>
      {loading && <span style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: '_sspn 0.7s linear infinite', flexShrink: 0 }} />}
      {children}
    </button>
  )
}

function FieldGroup({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1.5px solid #f0eefe', overflow: 'hidden', boxShadow: '0 1px 4px rgba(109,40,217,0.06)' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #faf5ff', background: 'linear-gradient(135deg,#faf5ff,#f5f3ff)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 15, fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>{title}</h3>
      </div>
      <div style={{ padding: '20px' }}>{children}</div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 5 }}>{label}</label>
      {children}
      {hint && <p style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 3 }}>{hint}</p>}
    </div>
  )
}

function StyledInput({ error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  const [f, setF] = useState(false)
  return (
    <div>
      <input {...props} onFocus={e => { setF(true); props.onFocus?.(e) }} onBlur={e => { setF(false); props.onBlur?.(e) }}
        style={{ width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 13, border: `1.5px solid ${error ? '#f87171' : f ? '#7c3aed' : '#e5e7eb'}`, boxShadow: f ? '0 0 0 3px rgba(109,40,217,0.1)' : 'none', outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)', fontFamily: '"DM Sans",sans-serif', transition: 'all 0.15s', boxSizing: 'border-box' as const }} />
      {error && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>⚠ {error}</p>}
    </div>
  )
}

function StyledTextarea({ ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const [f, setF] = useState(false)
  return (
    <textarea {...props} onFocus={e => { setF(true); props.onFocus?.(e) }} onBlur={e => { setF(false); props.onBlur?.(e) }}
      style={{ width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 13, border: `1.5px solid ${f ? '#7c3aed' : '#e5e7eb'}`, boxShadow: f ? '0 0 0 3px rgba(109,40,217,0.1)' : 'none', outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)', fontFamily: '"DM Sans",sans-serif', transition: 'all 0.15s', resize: 'vertical', minHeight: 80, boxSizing: 'border-box' as const }} />
  )
}

const MOCK_REPORT = {
  id: 'mock-1',
  student: {
    full_name: 'Kwame Mensah',
    student_id: 'WUA-2026-001',
    gender: 'Male',
    class: { name: 'JHS 2 Blue' }
  },
  class_teacher_remarks: 'Kwame is a dedicated student who consistently demonstrates strong analytical skills. His participation in class discussions is commendable.',
  headteacher_remarks: 'An outstanding performance this term. Maintain this momentum.',
  average_score: 88.6,
  overall_position: 2
}

const MOCK_SCORES = [
  { id: 's1', subject: { name: 'Mathematics' }, total_score: 94, category_scores: { cs: 29, es: 65 } },
  { id: 's2', subject: { name: 'English Language' }, total_score: 82, category_scores: { cs: 25, es: 57 } },
  { id: 's3', subject: { name: 'Integrated Science' }, total_score: 89, category_scores: { cs: 27, es: 62 } },
]

// ─── Password Change Panel ────────────────────────────────
function PasswordChangePanel() {
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleChange(e: React.FormEvent) {
    e.preventDefault()
    if (newPw.length < 8) { toast.error('Password must be at least 8 characters'); return }
    if (newPw !== confirmPw) { toast.error('Passwords do not match'); return }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPw })
    setSaving(false)
    if (error) { toast.error(error.message || 'Failed to update password'); return }
    toast.success('Password updated successfully!')
    setNewPw(''); setConfirmPw('')
  }

  const inputStyle: React.CSSProperties = {
    flex: 1, padding: '9px 12px', borderRadius: 9, fontSize: 13,
    border: '1.5px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)',
    fontFamily: '"DM Sans",sans-serif', outline: 'none', boxSizing: 'border-box',
  }

  return (
    <FieldGroup title="Change Password" icon="🔐">
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
        Choose a strong password with at least 8 characters.
      </p>
      <form onSubmit={handleChange}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="New Password">
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showNew ? 'text' : 'password'}
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                placeholder="Enter new password"
                style={{ ...inputStyle, paddingRight: 38 }}
                onFocus={e => (e.currentTarget.style.borderColor = '#7c3aed')}
                onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
              />
              <button type="button" onClick={() => setShowNew(p => !p)}
                style={{ position: 'absolute', right: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-subtle)', display: 'flex', padding: 0 }}>
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </Field>

          <Field label="Confirm New Password">
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                placeholder="Repeat new password"
                style={{
                  ...inputStyle, paddingRight: 38,
                  borderColor: confirmPw && confirmPw !== newPw ? '#f87171' : '#e5e7eb',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = '#7c3aed')}
                onBlur={e => (e.currentTarget.style.borderColor = confirmPw && confirmPw !== newPw ? '#f87171' : '#e5e7eb')}
              />
              <button type="button" onClick={() => setShowConfirm(p => !p)}
                style={{ position: 'absolute', right: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-subtle)', display: 'flex', padding: 0 }}>
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {confirmPw && confirmPw !== newPw && (
              <p style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>⚠ Passwords do not match</p>
            )}
          </Field>

          {/* Strength indicator */}
          {newPw.length > 0 && (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              {[1,2,3,4].map(i => (
                <div key={i} style={{
                  flex: 1, height: 4, borderRadius: 2, transition: 'background 0.2s',
                  background: newPw.length >= i * 3 ? (newPw.length >= 12 ? '#16a34a' : newPw.length >= 8 ? '#f59e0b' : '#ef4444') : '#e5e7eb',
                }} />
              ))}
              <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 6, whiteSpace: 'nowrap' }}>
                {newPw.length < 8 ? 'Too short' : newPw.length < 12 ? 'Fair' : 'Strong'}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Btn type="submit" loading={saving} disabled={saving || !newPw || newPw !== confirmPw} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <KeyRound size={14} /> Update Password
            </Btn>
          </div>
        </div>
      </form>
    </FieldGroup>
  )
}

// ═══════════════════════════════════════════════════════════
export default function SettingsPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const { data: settings, isLoading } = useSettings()
  const { data: currentTerm } = useCurrentTerm()
  const { data: currentYear } = useCurrentAcademicYear()
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [watermarkUploading, setWatermarkUploading] = useState(false)
  const [watermarkUrl, setWatermarkUrl] = useState<string | null>(null)
  const [logoHov, setLogoHov] = useState(false)
  const [activeTab, setActiveTab] = useState<'school' | 'report' | 'sms' | 'grading' | 'security' | 'account'>('school')
  const [lateTime, setLateTime] = useState('08:00')
  const [cooldownSecs, setCooldownSecs] = useState(30)
  const [savingSecuritySettings, setSavingSecuritySettings] = useState(false)
  const logoRef = useRef<HTMLInputElement>(null)
  const watermarkRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting, isDirty } } = useForm<FormData>({ resolver: zodResolver(schema) })
  const selectedTheme = watch('report_theme')

  useEffect(() => {
    if (settings) {
      const school = (settings as any).school
      reset({
        school_name: school?.name ?? '',
        school_motto: school?.motto ?? '',
        school_email: school?.email ?? '',
        school_phone: school?.phone ?? '',
        school_address: school?.address ?? '',
        headteacher_name: school?.headteacher_name ?? '',
        next_term_date: settings.next_term_date ?? '',
        school_fees_info: settings.school_fees_info ?? '',
        school_news: settings.school_news ?? '',
        paystack_public_key: school?.paystack_public_key ?? '',
        currency_code: school?.currency_code ?? 'GHS',
        report_theme: settings.report_theme ?? 'modern',
        primary_color: settings.primary_color ?? '#1e3a8a',
      })
      setLogoUrl(school?.logo_url ?? null)
      setWatermarkUrl(settings.report_watermark_url ?? null)
      // Load security settings
      const secCfg = (settings as any).late_arrival_time
      if (secCfg) setLateTime(secCfg.slice(0, 5))
      const cooldown = (settings as any).scan_cooldown_seconds
      if (cooldown) setCooldownSecs(cooldown)
    }
  }, [settings, reset])

  async function onSubmit(data: FormData) {
    try {
      // 1. Update school identity fields directly
      const { error: schoolError } = await supabase
        .from('schools')
        .update({
          name: data.school_name,
          motto: data.school_motto,
          email: data.school_email,
          phone: data.school_phone,
          address: data.school_address,
          headteacher_name: data.headteacher_name,
          paystack_public_key: data.paystack_public_key,
          currency_code: data.currency_code,
        })
        .eq('id', user!.school_id)
      if (schoolError) throw schoolError

      // 2. Upsert report-card settings via service
      const { error: settingsError } = await settingsService.upsert(user!.school_id, {
        next_term_date: data.next_term_date || null,
        school_fees_info: data.school_fees_info || null,
        school_news: data.school_news || null,
        report_theme: data.report_theme,
        primary_color: data.primary_color,
      })
      if (settingsError) throw settingsError

      // 3. Invalidate cache so useSettings refetches fresh data
      await qc.invalidateQueries({ queryKey: ['settings', user!.school_id] })

      toast.success('Settings saved successfully')
    } catch (err: any) {
      console.error('Settings save error:', err)
      toast.error(err?.message || 'Failed to save settings')
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Logo must be under 2MB'); return }
    setLogoUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `logos/${user!.school_id}.${ext}`
      const { error } = await supabase.storage.from('school-assets').upload(path, file, { upsert: true })
      if (error) throw error
      const { data: urlData } = supabase.storage.from('school-assets').getPublicUrl(path)
      await settingsService.updateSchool(user!.school_id, { logo_url: urlData.publicUrl })
      setLogoUrl(urlData.publicUrl)
      toast.success('Logo uploaded successfully')
    } catch {
      toast.error('Logo upload failed. Check your Supabase storage bucket.')
    } finally {
      setLogoUploading(false)
    }
  }

  async function handleWatermarkUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setWatermarkUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `watermarks/${user!.school_id}.${ext}`
      const { error } = await supabase.storage.from('school-assets').upload(path, file, { upsert: true })
      if (error) throw error
      const { data: urlData } = supabase.storage.from('school-assets').getPublicUrl(path)
      await settingsService.upsert(user!.school_id, { report_watermark_url: urlData.publicUrl })
      setWatermarkUrl(urlData.publicUrl)
      toast.success('Watermark uploaded successfully')
    } catch {
      toast.error('Watermark upload failed')
    } finally {
      setWatermarkUploading(false)
    }
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <style>{`@keyframes _sspn { to{transform:rotate(360deg)} }`}</style>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #ede9fe', borderTopColor: '#6d28d9', animation: '_sspn 0.8s linear infinite' }} />
        <p style={{ fontSize: 13, color: 'var(--text-subtle)', fontFamily: '"DM Sans",sans-serif' }}>Loading settings…</p>
      </div>
    )
  }

  const school = (settings as any)?.school

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _sspn { to{transform:rotate(360deg)} }
        @keyframes _sfadeIn { from{opacity:0} to{opacity:1} }
        @keyframes _sfadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .tab-btn:hover { background:#f5f3ff !important; color:#6d28d9 !important; }
      `}</style>

      <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif', animation: '_sfadeIn 0.4s ease' }}>

        {/* Header */}
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>School Settings</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>Configure your school information and report card settings</p>
          </div>
        </div>

        {/* School identity banner */}
        <div style={{ background: 'linear-gradient(135deg,#2e1065,#4c1d95,#5b21b6)', borderRadius: 18, padding: '24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
          <div style={{ position: 'absolute', bottom: -30, left: 40, width: 120, height: 120, borderRadius: '50%', background: 'rgba(245,158,11,0.08)' }} />

          {/* Logo display */}
          <div
            onMouseEnter={() => setLogoHov(true)}
            onMouseLeave={() => setLogoHov(false)}
            onClick={() => logoRef.current?.click()}
            style={{ width: 72, height: 72, borderRadius: 8, flexShrink: 0, background: logoUrl ? 'transparent' : 'rgba(255,255,255,0.1)', border: '2px dashed rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', transition: 'all 0.2s', boxShadow: logoHov ? '0 0 0 4px rgba(245,158,11,0.3)' : 'none', position: 'relative', zIndex: 1 }}>
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, marginBottom: 2 }}>🏫</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>ADD LOGO</div>
              </div>
            )}
            {logoHov && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 14 }}>
                <div style={{ fontSize: 9, color: '#fff', fontWeight: 800, textAlign: 'center' }}>{logoUploading ? '⏳' : '📤'}<br />{logoUploading ? 'UPLOADING' : 'CHANGE'}</div>
              </div>
            )}
          </div>
          <input ref={logoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />

          <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontFamily: '"Playfair Display",serif', fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>
              {school?.name ?? 'School Name'}
            </h2>
            {school?.motto && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', margin: '0 0 8px' }}>{school.motto}</p>}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {school?.email && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>✉️ {school.email}</span>}
              {school?.phone && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>📱 {school.phone}</span>}
              {school?.headteacher_name && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>👤 {school.headteacher_name}</span>}
            </div>
          </div>
          <div style={{ position: 'relative', zIndex: 1, flexShrink: 0 }}>
            <button onClick={() => logoRef.current?.click()}
              style={{ padding: '8px 14px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', backdropFilter: 'blur(4px)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}>
              {logoUploading ? '⏳ Uploading…' : '📤 Upload Logo'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: '#f5f3ff', borderRadius: 12, padding: 4, marginBottom: 22, width: 'fit-content' }}>
          {([
            { id: 'school', label: '🏫 School Info' },
            { id: 'report', label: '📄 Report Card' },
            { id: 'grading', label: '📊 Grading Setup' },
            { id: 'sms', label: '📱 SMS Integration' },
            { id: 'security', label: '🛡️ Security' },
            { id: 'account', label: '👤 Account' },
          ] as const).map(tab => (
            <button key={tab.id} className="tab-btn" onClick={() => setActiveTab(tab.id)}
              style={{ padding: '8px 18px', borderRadius: 9, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', background: activeTab === tab.id ? '#6d28d9' : 'transparent', color: activeTab === tab.id ? '#fff' : '#6d28d9' }}>
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, animation: '_sfadeUp 0.3s ease' }}>

            {/* ── SCHOOL INFO TAB ── */}
            {activeTab === 'school' && (
              <>
                <FieldGroup title="School Identity" icon="🏫">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <Field label="School Name *">
                        <StyledInput {...register('school_name')} placeholder="e.g. Nexora Academy" error={errors.school_name?.message} />
                      </Field>
                    </div>
                    <Field label="School Motto">
                      <StyledInput {...register('school_motto')} placeholder="e.g. Knowledge is Power" />
                    </Field>
                    <Field label="Headteacher Name">
                      <StyledInput {...register('headteacher_name')} placeholder="e.g. Mr. John Mensah" />
                    </Field>
                    <Field label="Email Address">
                      <StyledInput {...register('school_email')} type="email" placeholder="info@school.edu.gh" error={errors.school_email?.message} />
                    </Field>
                    <Field label="Phone Number">
                      <StyledInput {...register('school_phone')} placeholder="030 000 0000" />
                    </Field>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <Field label="School Address / P.O. Box">
                        <StyledInput {...register('school_address')} placeholder="e.g. P.O. Box 000, Accra, Ghana" />
                      </Field>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <Field label="Paystack Public Key" hint="Used for secure online fee payments. Starts with 'pk_test_' or 'pk_live_'">
                        <StyledInput {...register('paystack_public_key')} placeholder="pk_test_..." />
                      </Field>
                      <Field label="School Currency" hint="Default currency for all billing displays">
                        <select {...register('currency_code')} style={{ width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 13, border: '1.5px solid var(--border-color)', outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)', fontFamily: '"DM Sans",sans-serif', boxSizing: 'border-box' }}>
                          <option value="GHS">GHS - Ghana Cedi</option>
                          <option value="USD">USD - US Dollar</option>
                          <option value="EUR">EUR - Euro</option>
                          <option value="GBP">GBP - British Pound</option>
                          <option value="NGN">NGN - Nigerian Naira</option>
                          <option value="KES">KES - Kenyan Shilling</option>
                          <option value="ZAR">ZAR - South African Rand</option>
                        </select>
                      </Field>
                    </div>
                  </div>
                </FieldGroup>
              </>
            )}

            {/* ── REPORT CARD TAB ── */}
            {activeTab === 'report' && (
              <>
                <FieldGroup title="Report Card Footer" icon="📄">
                  <p style={{ fontSize: 12, color: 'var(--text-subtle)', marginBottom: 16 }}>This information appears at the bottom of every generated report card.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <Field label="Next Term Reopening Date" hint="Shown on report card footer">
                      <StyledInput {...register('next_term_date')} type="date" />
                    </Field>
                    <Field label="School Fees Information" hint="Fee details shown to parents on the report card">
                      <StyledTextarea {...register('school_fees_info')} placeholder="e.g. Term 2 fees: GHS 500.00. Due by January 15th…" rows={3} />
                    </Field>
                    <Field label="School News / Announcements" hint="Events and news shown on the report card">
                      <StyledTextarea {...register('school_news')} placeholder="e.g. End of term concert on December 15th. Parents are invited…" rows={3} />
                    </Field>
                  </div>
                </FieldGroup>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <FieldGroup title="Visual Branding" icon="🎨">
                       <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                          <Field label="Report Card Theme" hint="Choose the visual layout for your report cards">
                             <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                                {([
                                   { id: 'modern', name: 'Modern', desc: 'Sleek & Colorful', icon: '✨' },
                                   { id: 'classic', name: 'Classic', desc: 'Serif & Traditional', icon: '🏛️' },
                                   { id: 'professional', name: 'Professional', desc: 'Minimal & Clean', icon: '💼' },
                                ] as const).map(t => (
                                   <label key={t.id} style={{ flex: 1, cursor: 'pointer', position: 'relative' }}>
                                      <input type="radio" {...register('report_theme')} value={t.id} style={{ position: 'absolute', opacity: 0 }} />
                                      <div style={{ padding: '12px', borderRadius: 12, border: `2px solid ${errors.report_theme ? '#f87171' : (selectedTheme === t.id ? '#7c3aed' : '#e5e7eb')}`, background: selectedTheme === t.id ? '#f5f3ff' : '#fff', textAlign: 'center', transition: 'all 0.2s' }}
                                        onMouseEnter={e => { if (selectedTheme !== t.id) e.currentTarget.style.borderColor = '#7c3aed' }}
                                        onMouseLeave={e => { if (selectedTheme !== t.id) e.currentTarget.style.borderColor = '#e5e7eb' }}>
                                         <div style={{ fontSize: 24, marginBottom: 4 }}>{t.icon}</div>
                                         <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>{t.name}</div>
                                         <div style={{ fontSize: 10, color: 'var(--text-subtle)' }}>{t.desc}</div>
                                      </div>
                                   </label>
                                ))}
                             </div>
                          </Field>

                          <Field label="Background Watermark" hint="Faint image shown behind the report content (e.g. school crest)">
                             <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                                <div style={{ width: 60, height: 60, borderRadius: 10, border: '1.5px solid var(--border-color)', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                   {watermarkUrl ? <img src={watermarkUrl} style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: 0.5 }} /> : <span style={{ fontSize: 20 }}>📜</span>}
                                </div>
                                <div style={{ flex: 1 }}>
                                   <Btn variant="secondary" style={{ padding: '6px 12px', fontSize: 11 }} onClick={() => watermarkRef.current?.click()} loading={watermarkUploading}>
                                      {watermarkUrl ? 'Change Watermark' : 'Upload Watermark'}
                                    </Btn>
                                    {watermarkUrl && <p style={{ fontSize: 10, color: '#16a34a', marginTop: 4 }}>✓ Watermark active</p>}
                                </div>
                                <input ref={watermarkRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleWatermarkUpload} />
                             </div>
                          </Field>

                          <Field label="Brand Primary Color" hint="Sets the main theme color for reports and accents">
                             <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                                <input type="color" {...register('primary_color')} style={{ width: 44, height: 44, padding: 0, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'none' }} />
                                <StyledInput {...register('primary_color')} placeholder="#1e3a8a" style={{ flex: 1, fontFamily: 'monospace' }} />
                             </div>
                          </Field>
                       </div>
                    </FieldGroup>
                  </div>

                  {/* LIVE PREVIEW PANEL */}
                  <div style={{ position: 'sticky', top: 20, height: 'fit-content' }}>
                    <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1.5px solid #f0eefe', overflow: 'hidden', boxShadow: '0 4px 20px rgba(109,40,217,0.1)' }}>
                      <div style={{ padding: '12px 20px', borderBottom: '1px solid #faf5ff', background: 'linear-gradient(135deg,#faf5ff,#f5f3ff)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 16 }}>👁️</span>
                          <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 14, fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>Live Preview</h3>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#7c3aed', background: '#ede9fe', padding: '2px 8px', borderRadius: 99 }}>REAL-TIME</span>
                      </div>
                      <div style={{ padding: '0', height: 500, overflowY: 'auto', background: '#f1f5f9', position: 'relative' }}>
                        {/* Scaled Preview Wrapper */}
                        <div style={{ 
                          transform: 'scale(0.65)', 
                          transformOrigin: 'top center',
                          width: '153.8%', // To offset the scale(0.65) so it fills width
                          marginLeft: '-26.9%', // Center the scaled content
                          padding: '20px 0'
                        }}>
                          <ReportCard 
                            report={MOCK_REPORT} 
                            scores={MOCK_SCORES}
                            school={school}
                            term={currentTerm}
                            year={currentYear}
                            settings={{
                              report_theme: watch('report_theme'),
                              primary_color: watch('primary_color'),
                              report_watermark_url: watermarkUrl,
                              school_fees_info: watch('school_fees_info'),
                              school_news: watch('school_news'),
                            }}
                            readonly={true}
                            hideSettings={true}
                          />
                        </div>
                      </div>
                      <div style={{ padding: '10px 20px', background: 'var(--bg-card)', borderTop: '1px solid #f0eefe', textAlign: 'center' }}>
                        <p style={{ fontSize: 11, color: 'var(--text-subtle)', margin: 0 }}>Showing a simulated JHS 2 student report</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Report card preview hint */}
                <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: 14, padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#92400e', marginBottom: 3 }}>Report Card Preview</p>
                    <p style={{ fontSize: 12, color: '#78350f' }}>Go to the <strong>Reports</strong> page, select a class, generate reports, then click the 👁️ icon to preview a student's report card with all footer information.</p>
                  </div>
                </div>
              </>
            )}

            {/* ── SMS INTEGRATION TAB ── */}
            {activeTab === 'sms' && (
              <>
                <FieldGroup title="SMS Service Status" icon="📱">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1.5px solid #86efac', borderRadius: 14, padding: '24px', textAlign: 'center' }}>
                      <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                      <h4 style={{ fontSize: 18, fontWeight: 700, color: '#166534', margin: '0 0 8px' }}>Global SMS Service Active</h4>
                      <p style={{ fontSize: 13, color: '#15803d', margin: 0 }}>
                        The SMS messaging service is centrally managed and provided by the system developer. 
                        Your school is currently authorized to send bulk messages and fee reminders.
                      </p>
                    </div>

                    <div style={{ padding: '0 10px' }}>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)', marginBottom: 12 }}>Usage Information</h4>
                      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                        <li>All messages are sent via the Arkesel SMS gateway. The Sender ID is dynamically generated from your <strong>School Name</strong> (up to 11 characters).</li>
                        <li>Each message is automatically prefixed with your <strong>School Name</strong> for sender identification.</li>
                        <li>Bulk sends are batched at 50 recipients per request to respect rate limits.</li>
                        <li>Each message segment (160 characters) consumes credits from the system pool.</li>
                        <li>Every SMS attempt (success or failure) is logged for administrative and billing purposes.</li>
                      </ul>
                    </div>
                  </div>
                </FieldGroup>

                <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 14, padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'center', cursor: 'help' }} title="Contact developer for billing details">
                  <span style={{ fontSize: 18, flexShrink: 0 }}>💰</span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#991b1b', marginBottom: 2 }}>Pricing & Billing</p>
                    <p style={{ fontSize: 12, color: '#b91c1c' }}>Contact the system administrator to check your current SMS credit usage or to purchase additional capacity for your school.</p>
                  </div>
                </div>
              </>
            )}

            {/* ── GRADING SETUP TAB ── */}
            {activeTab === 'grading' && (
              <GradingSetupTab />
            )}

            {/* ── SECURITY SETTINGS TAB ── */}
            {activeTab === 'security' && (
              <>
                <FieldGroup title="Gate Scanner Rules" icon="🛡️">
                  <p style={{ fontSize: 12, color: 'var(--text-subtle)', marginBottom: 20 }}>Configure how the gate attendance scanner marks students and staff as late or handles duplicate scans.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

                    {/* Late Arrival Time */}
                    <div style={{ background: '#fafafa', borderRadius: 14, border: '1.5px solid #f1f5f9', padding: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>⏰</div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Late Arrival Cutoff Time</div>
                          <div style={{ fontSize: 12, color: '#64748b' }}>Scans after this time will be marked as LATE</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <input type="time" value={lateTime} onChange={e => setLateTime(e.target.value)}
                          style={{ padding: '12px 16px', borderRadius: 12, border: '2px solid #e2e8f0', fontSize: 22, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: '#0f172a', outline: 'none', fontFamily: '"DM Sans",sans-serif', flex: 1 }} />
                        <div style={{ fontSize: 13, color: '#64748b', flex: 1 }}>
                          Currently set to <strong style={{ color: '#0f172a' }}>{lateTime}</strong>.<br />
                          Arrivals after this are marked <span style={{ color: '#d97706', fontWeight: 700 }}>LATE</span>.
                        </div>
                      </div>
                    </div>

                    {/* Duplicate Scan Cooldown */}
                    <div style={{ background: '#fafafa', borderRadius: 14, border: '1.5px solid #f1f5f9', padding: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🔁</div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Duplicate Scan Guard</div>
                          <div style={{ fontSize: 12, color: '#64748b' }}>Block re-scans of the same ID within this window</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ flex: 1 }}>
                          <input type="range" min={10} max={120} step={5} value={cooldownSecs} onChange={e => setCooldownSecs(Number(e.target.value))}
                            style={{ width: '100%', accentColor: '#334155' }} />
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
                            <span>10s</span><span>60s</span><span>120s</span>
                          </div>
                        </div>
                        <div style={{ width: 70, height: 60, borderRadius: 14, background: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: 24, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{cooldownSecs}</span>
                          <span style={{ fontSize: 10, color: '#94a3b8' }}>seconds</span>
                        </div>
                      </div>
                    </div>

                    {/* Preview */}
                    <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)', borderRadius: 14, padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'center' }}>
                      <div style={{ fontSize: 30 }}>🛡️</div>
                      <div style={{ color: '#fff' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Current Scanner Rules</div>
                        <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>
                          ✅ Scans before <strong style={{ color: '#fff' }}>{lateTime}</strong> → ON TIME<br />
                          ⏰ Scans after <strong style={{ color: '#fbbf24' }}>{lateTime}</strong> → LATE<br />
                          🔁 Same ID blocked for <strong style={{ color: '#60a5fa' }}>{cooldownSecs} seconds</strong> after each scan
                        </div>
                      </div>
                    </div>
                  </div>
                </FieldGroup>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <Btn variant="secondary" onClick={() => { setLateTime('08:00'); setCooldownSecs(30) }}>↩ Reset to Defaults</Btn>
                  <Btn loading={savingSecuritySettings} onClick={async () => {
                    setSavingSecuritySettings(true)
                    try {
                      await settingsService.upsert(user!.school_id, {
                        late_arrival_time: `${lateTime}:00`,
                        scan_cooldown_seconds: cooldownSecs,
                      } as any)
                      await qc.invalidateQueries({ queryKey: ['settings', user!.school_id] })
                      toast.success('Security settings saved')
                    } catch { toast.error('Failed to save') }
                    setSavingSecuritySettings(false)
                  }}>💾 Save Security Settings</Btn>
                </div>
              </>
            )}

            {/* ── ACCOUNT TAB ── */}
            {activeTab === 'account' && (
              <>
                <FieldGroup title="Admin Account" icon="👤">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px', background: '#faf5ff', borderRadius: 12, marginBottom: 16 }}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                      {user?.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)' }}>{user?.full_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user?.email}</div>
                      <span style={{ fontSize: 11, fontWeight: 700, background: '#f5f3ff', color: '#6d28d9', padding: '2px 8px', borderRadius: 99, marginTop: 4, display: 'inline-block' }}>Administrator</span>
                    </div>
                  </div>
                </FieldGroup>

                <PasswordChangePanel />
              </>
            )}

            {/* Save button */}
            {(activeTab !== 'account' && activeTab !== 'grading' && activeTab !== 'security') && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <Btn variant="secondary" type="button" onClick={() => reset()}>↩ Reset</Btn>
                <Btn type="submit" loading={isSubmitting} disabled={!isDirty && !isSubmitting}>
                  💾 Save All Settings
                </Btn>
              </div>
            )}
          </div>
        </form>
      </div>
    </>
  )
}