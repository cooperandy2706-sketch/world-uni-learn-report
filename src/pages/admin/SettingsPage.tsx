// src/pages/admin/SettingsPage.tsx
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '../../lib/supabase'
import { useSettings, useUpdateSettings } from '../../hooks/useSettings'
import { useAuth } from '../../hooks/useAuth'
import { settingsService } from '../../services/index'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

const schema = z.object({
  school_name: z.string().min(1, 'School name is required'),
  school_motto: z.string().optional(),
  school_email: z.string().email('Invalid email').optional().or(z.literal('')),
  school_phone: z.string().optional(),
  school_address: z.string().optional(),
  headteacher_name: z.string().optional(),
  next_term_date: z.string().optional(),
  school_fees_info: z.string().optional(),
  school_news: z.string().optional(),
})
type FormData = z.infer<typeof schema>

// ── helpers ───────────────────────────────────────────────
function Btn({ children, onClick, variant = 'primary', type = 'button', disabled, loading, style, form }: any) {
  const [hov, setHov] = useState(false)
  const v: Record<string, React.CSSProperties> = {
    primary: { background: hov ? '#5b21b6' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', border: 'none', boxShadow: '0 2px 8px rgba(109,40,217,0.28)' },
    secondary: { background: hov ? '#f5f3ff' : '#fff', color: '#374151', border: '1.5px solid #e5e7eb' },
    ghost: { background: hov ? '#f5f3ff' : 'transparent', color: '#6b7280', border: 'none' },
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
    <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', overflow: 'hidden', boxShadow: '0 1px 4px rgba(109,40,217,0.06)' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #faf5ff', background: 'linear-gradient(135deg,#faf5ff,#f5f3ff)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>{title}</h3>
      </div>
      <div style={{ padding: '20px' }}>{children}</div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 5 }}>{label}</label>
      {children}
      {hint && <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>{hint}</p>}
    </div>
  )
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

function StyledTextarea({ ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const [f, setF] = useState(false)
  return (
    <textarea {...props} onFocus={e => { setF(true); props.onFocus?.(e) }} onBlur={e => { setF(false); props.onBlur?.(e) }}
      style={{ width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 13, border: `1.5px solid ${f ? '#7c3aed' : '#e5e7eb'}`, boxShadow: f ? '0 0 0 3px rgba(109,40,217,0.1)' : 'none', outline: 'none', background: '#fff', color: '#111827', fontFamily: '"DM Sans",sans-serif', transition: 'all 0.15s', resize: 'vertical', minHeight: 80, boxSizing: 'border-box' as const }} />
  )
}

// ═══════════════════════════════════════════════════════════
export default function SettingsPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const { data: settings, isLoading } = useSettings()
  const updateSettings = useUpdateSettings()
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoHov, setLogoHov] = useState(false)
  const [activeTab, setActiveTab] = useState<'school' | 'report' | 'account'>('school')
  const logoRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useForm<FormData>({ resolver: zodResolver(schema) })

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
      })
      setLogoUrl(school?.logo_url ?? null)
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
        })
        .eq('id', user!.school_id)
      if (schoolError) throw schoolError

      // 2. Upsert report-card settings via RPC
      const { error: settingsError } = await supabase.rpc('upsert_school_settings', {
        p_school_id: user!.school_id,
        p_next_term_date: data.next_term_date || null,
        p_school_fees_info: data.school_fees_info || null,
        p_school_news: data.school_news || null,
      })
      if (settingsError) throw settingsError

      // 3. Invalidate cache so useSettings refetches fresh data (no page reload needed)
      await qc.invalidateQueries({ queryKey: ['settings', user!.school_id] })

      toast.success('Settings saved successfully')
    } catch (err: any) {
      console.error('Settings save error:', err)
      toast.error(err?.message ?? 'Failed to save settings')
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

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <style>{`@keyframes _sspn { to{transform:rotate(360deg)} }`}</style>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #ede9fe', borderTopColor: '#6d28d9', animation: '_sspn 0.8s linear infinite' }} />
        <p style={{ fontSize: 13, color: '#9ca3af', fontFamily: '"DM Sans",sans-serif' }}>Loading settings…</p>
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
            <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>School Settings</h1>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 3 }}>Configure your school information and report card settings</p>
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
            style={{ width: 72, height: 72, borderRadius: 16, flexShrink: 0, background: logoUrl ? 'transparent' : 'rgba(255,255,255,0.1)', border: '2px dashed rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', transition: 'all 0.2s', boxShadow: logoHov ? '0 0 0 4px rgba(245,158,11,0.3)' : 'none', position: 'relative', zIndex: 1 }}>
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
            { id: 'sms', label: '📱 SMS Integration' },
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
                        <StyledInput {...register('school_name')} placeholder="e.g. World Uni-Learn Academy" error={errors.school_name?.message} />
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
                      <Field label="Physical Address">
                        <StyledInput {...register('school_address')} placeholder="School physical address" />
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
                  <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>This information appears at the bottom of every generated report card.</p>
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
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 12 }}>Usage Information</h4>
                      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#4b5563', lineHeight: 1.6 }}>
                        <li>All messages are sent via the world-uni-learn global Hubtel account.</li>
                        <li>Each message segment (160 characters) consumes credits from the system pool.</li>
                        <li>Your school's usage is logged for administrative and billing purposes.</li>
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

            {/* ── ACCOUNT TAB ── */}
            {activeTab === 'account' && (
              <FieldGroup title="Admin Account" icon="👤">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px', background: '#faf5ff', borderRadius: 12, marginBottom: 16 }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                    {user?.full_name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{user?.full_name}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{user?.email}</div>
                    <span style={{ fontSize: 11, fontWeight: 700, background: '#f5f3ff', color: '#6d28d9', padding: '2px 8px', borderRadius: 99, marginTop: 4, display: 'inline-block' }}>Administrator</span>
                  </div>
                </div>
                <div style={{ background: '#ecfeff', border: '1px solid #a5f3fc', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 16 }}>🔐</span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#0e7490', marginBottom: 2 }}>Password Management</p>
                    <p style={{ fontSize: 12, color: '#0891b2' }}>To change your password, go to Supabase Dashboard → Authentication → Users → find your account → Update Password.</p>
                  </div>
                </div>
              </FieldGroup>
            )}

            {/* Save button */}
            {activeTab !== 'account' && (
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