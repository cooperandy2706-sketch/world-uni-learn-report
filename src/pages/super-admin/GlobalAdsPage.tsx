import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import Modal from '../../components/ui/Modal'
import { formatDate } from '../../lib/utils'
import toast from 'react-hot-toast'
import { GlobalAd } from '../../types/database.types'
import { useAutoRefresh } from "../../hooks/useAutoRefresh";

// ── Helpers ───────────────────────────────────────────────
function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 5 }}>{children}</label>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
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
          outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)',
          fontFamily: '"DM Sans",sans-serif', transition: 'all 0.15s',
          boxSizing: 'border-box',
          ...props.style
        }}
      />
      {error && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>⚠ {error}</p>}
    </div>
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
    secondary: { background: hov ? '#f5f3ff' : '#fff', color: 'var(--text-main)', border: '1.5px solid var(--border-color)' },
    danger: { background: hov ? '#b91c1c' : '#dc2626', color: '#fff', boxShadow: '0 2px 6px rgba(220,38,38,0.22)' },
    ghost: { background: hov ? '#f5f3ff' : 'transparent', color: 'var(--text-muted)' },
    success: { background: hov ? '#059669' : '#10b981', color: '#fff' },
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

export default function GlobalAdsPage() {
    useAutoRefresh(loadAds);
  const { user } = useAuth()
  const [ads, setAds] = useState<GlobalAd[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form State
  const [title, setTitle] = useState('')
  const [targetUrl, setTargetUrl] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [activeFrom, setActiveFrom] = useState('')
  const [activeUntil, setActiveUntil] = useState('')
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    if (user?.role === 'super_admin') {
      loadAds()
    }
  }, [user])

  // Cleanup preview URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  async function loadAds() {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('global_ads')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setAds(data as GlobalAd[])
    } catch (err: any) {
      toast.error('Failed to load ads: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSubmit() {
    if (!title || !activeFrom || !activeUntil || !file) {
      toast.error('Please fill in all required fields and upload a file')
      return
    }

    if (new Date(activeFrom) >= new Date(activeUntil)) {
      toast.error('Active Until must be after Active From')
      return
    }

    setIsSubmitting(true)
    try {
      // 1. Upload File
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('global-ads')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('global-ads').getPublicUrl(filePath)
      
      const mediaType = file.type.startsWith('video/') ? 'video' : 'image'

      // 2. Insert DB Record
      const { error: insertError } = await supabase.from('global_ads').insert({
        title,
        media_url: urlData.publicUrl,
        media_type: mediaType,
        target_url: targetUrl || null,
        active_from: new Date(activeFrom).toISOString(),
        active_until: new Date(activeUntil).toISOString(),
        is_active: true,
        created_by: user?.id,
      })

      if (insertError) throw insertError

      toast.success('Global Ad created successfully')
      setModalOpen(false)
      // Reset form
      setTitle('')
      setTargetUrl('')
      setActiveFrom('')
      setActiveUntil('')
      setFile(null)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
      loadAds()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create ad')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function toggleActive(ad: GlobalAd) {
    try {
      const newStatus = !ad.is_active
      const { error } = await supabase.from('global_ads').update({ is_active: newStatus }).eq('id', ad.id)
      if (error) throw error
      toast.success(newStatus ? 'Ad activated' : 'Ad deactivated')
      loadAds()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  async function handleDelete(id: string, mediaUrl: string) {
    if (!confirm('Are you sure you want to delete this ad?')) return
    try {
      // Try to extract the file path from the URL
      const pathParts = mediaUrl.split('/global-ads/')
      if (pathParts.length > 1) {
        const filePath = pathParts[1]
        await supabase.storage.from('global-ads').remove([filePath])
      }

      const { error } = await supabase.from('global_ads').delete().eq('id', id)
      if (error) throw error
      toast.success('Ad deleted')
      loadAds()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const now = new Date()

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _spin { to{transform:rotate(360deg)} }
        @keyframes _fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .ads-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:12px; }
        .ads-date-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
        .ads-card-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:18px; }
        .ads-card-footer { margin-top:auto; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; border-top:1px solid var(--border-color); padding-top:12px; }
        @media (max-width:480px) {
          .ads-date-grid { grid-template-columns:1fr; }
          .ads-card-grid { grid-template-columns:1fr; }
          .ads-header { flex-direction:column; align-items:flex-start; }
        }
      `}</style>

      <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif' }}>
        <div className="ads-header">
          <div>
            <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>📢 Global Ads</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>Manage popup banners that appear across all user portals</p>
          </div>
          <Btn onClick={() => setModalOpen(true)}>➕ Create Ad</Btn>
        </div>

        {/* ── List ── */}
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #ede9fe', borderTopColor: '#6d28d9', animation: '_spin 0.8s linear infinite' }} />
          </div>
        ) : ads.length === 0 ? (
          <div style={{ background: 'var(--bg-card)', borderRadius: 8, padding: '60px 20px', textAlign: 'center', border: '1.5px solid var(--border-color)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🖼️</div>
            <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: 'var(--text-main)', marginBottom: 6 }}>No global ads yet</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18 }}>Create your first popup banner to broadcast across all user portals.</p>
            <Btn onClick={() => setModalOpen(true)}>➕ Create Ad</Btn>
          </div>
        ) : (
          <div className="ads-card-grid">
            {ads.map((ad, i) => {
              const activeFromDate = new Date(ad.active_from)
              const activeUntilDate = new Date(ad.active_until)
              const isCurrentlyActive = ad.is_active && now >= activeFromDate && now <= activeUntilDate
              const isExpired = now > activeUntilDate

              return (
                <div key={ad.id} style={{ 
                  background: 'var(--bg-card)', borderRadius: 18, border: `1.5px solid ${isCurrentlyActive ? '#c4b5fd' : 'var(--border-color)'}`, overflow: 'hidden',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)', animation: `_fadeUp 0.3s ease ${i * 0.05}s both`,
                  display: 'flex', flexDirection: 'column'
                }}>
                  <div style={{ position: 'relative', height: 160, background: '#f3f4f6' }}>
                    {ad.media_type === 'image' ? (
                      <img loading="lazy" src={ad.media_url} alt={ad.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <video src={ad.media_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                    <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, background: isCurrentlyActive ? '#10b981' : isExpired ? '#ef4444' : '#f59e0b', color: '#fff', padding: '4px 10px', borderRadius: 99, textTransform: 'uppercase' }}>
                        {isCurrentlyActive ? 'Live' : isExpired ? 'Expired' : 'Scheduled'}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: 'var(--text-main)', margin: 0, lineHeight: 1.2 }}>{ad.title}</h3>
                      <button onClick={() => handleDelete(ad.id, ad.media_url)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14, color: '#f87171' }}>🗑️</button>
                    </div>
                    
                    <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginBottom: 4 }}>
                      <strong>From:</strong> {formatDate(ad.active_from)}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginBottom: 12 }}>
                      <strong>To:</strong> {formatDate(ad.active_until)}
                    </div>

                    <div className="ads-card-footer">
                      <button onClick={() => toggleActive(ad)} style={{ 
                        border: 'none', background: ad.is_active ? '#ecfdf5' : '#fef2f2', 
                        color: ad.is_active ? '#10b981' : '#ef4444', borderRadius: 8, padding: '6px 12px', 
                        fontSize: 12, fontWeight: 700, cursor: 'pointer' 
                      }}>
                        {ad.is_active ? '⏸ Pause Ad' : '▶ Resume Ad'}
                      </button>
                      {ad.target_url && (
                        <a href={ad.target_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#7c3aed', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                          Visit Link 🔗
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── CREATE MODAL ── */}
        <Modal 
          open={modalOpen} 
          onClose={() => setModalOpen(false)} 
          title="Create Global Ad" 
          subtitle="Publish an image or video to all portals"
          size="md"
          footer={<>
            <Btn variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Btn>
            <Btn onClick={handleSubmit} loading={isSubmitting}>Publish Ad</Btn>
          </>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Ad Title *">
              <StyledInput value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. End of Year Celebration" />
            </Field>

            <Field label="Media File (Image or Video) *">
              <StyledInput 
                type="file" 
                accept="image/*,video/*"
                onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    const selectedFile = e.target.files[0]
                    setFile(selectedFile)
                    if (previewUrl) URL.revokeObjectURL(previewUrl)
                    setPreviewUrl(URL.createObjectURL(selectedFile))
                  }
                }} 
              />
            </Field>

            {previewUrl && file && (
              <div style={{ background: '#f9fafb', borderRadius: 12, padding: 8, border: '1.5px solid var(--border-color)', display: 'flex', justifyContent: 'center' }}>
                {file.type.startsWith('video/') ? (
                  <video src={previewUrl} controls style={{ maxHeight: 200, maxWidth: '100%', borderRadius: 8 }} />
                ) : (
                  <img loading="lazy" src={previewUrl} alt="Preview" style={{ maxHeight: 200, maxWidth: '100%', borderRadius: 8, objectFit: 'contain' }} />
                )}
              </div>
            )}

            <div className="ads-date-grid">
              <Field label="Active From *">
                <StyledInput 
                  type="datetime-local" 
                  value={activeFrom} 
                  onChange={e => setActiveFrom(e.target.value)} 
                />
              </Field>
              <Field label="Active Until *">
                <StyledInput 
                  type="datetime-local" 
                  value={activeUntil} 
                  onChange={e => setActiveUntil(e.target.value)} 
                />
              </Field>
            </div>

            <Field label="Target Link (Optional)">
              <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginBottom: 6 }}>If you want users to click the ad to visit a page, paste the URL below:</div>
              <StyledInput 
                value={targetUrl} 
                onChange={e => setTargetUrl(e.target.value)} 
                placeholder="e.g. https://example.com/new-feature" 
              />
            </Field>
          </div>
        </Modal>

      </div>
    </>
  )
}
