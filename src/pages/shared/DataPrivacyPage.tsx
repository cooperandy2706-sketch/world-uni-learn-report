import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import PageHeader from '../../components/layout/PageHeader'
import { Shield, FileText, ToggleLeft, ToggleRight, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react'

export default function DataPrivacyPage() {
  const { user } = useAuth()
  const schoolId = user?.school_id

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const [consents, setConsents] = useState({
    data_processing_consent: false,
    marketing_consent: false,
    photo_media_consent: false,
    deletion_requested: false,
    deletion_requested_at: ''
  })

  useEffect(() => {
    if (user && schoolId) {
      loadConsents()
    }
  }, [user, schoolId])

  async function loadConsents() {
    try {
      const { data, error } = await supabase
        .from('privacy_consents')
        .select('*')
        .eq('user_id', user!.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error // Ignore 'no rows' error
      if (data) {
        setConsents({
          data_processing_consent: data.data_processing_consent,
          marketing_consent: data.marketing_consent,
          photo_media_consent: data.photo_media_consent,
          deletion_requested: data.deletion_requested,
          deletion_requested_at: data.deletion_requested_at || ''
        })
      }
    } catch (err: any) {
      console.error('Error loading consents:', err)
    } finally {
      setLoading(false)
    }
  }

  async function updateConsent(field: string, value: boolean) {
    if (saving) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const { error } = await supabase
        .from('privacy_consents')
        .upsert({
          school_id: schoolId!,
          user_id: user!.id,
          [field]: value,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })

      if (error) throw error
      setConsents(prev => ({ ...prev, [field]: value }))
      setSuccess('Preferences updated successfully.')
    } catch (err: any) {
      setError('Failed to update preferences: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeletionRequest() {
    if (!window.confirm("Are you sure you want to request data deletion? This will anonymize your profile. This action cannot be undone by you once processed.")) return

    if (saving) return
    setSaving(true)
    setError('')
    setSuccess('')
    
    try {
      const now = new Date().toISOString()
      const { error } = await supabase
        .from('privacy_consents')
        .upsert({
          school_id: schoolId!,
          user_id: user!.id,
          deletion_requested: true,
          deletion_requested_at: now,
          updated_at: now
        }, { onConflict: 'user_id' })

      if (error) throw error
      setConsents(prev => ({ ...prev, deletion_requested: true, deletion_requested_at: now }))
      setSuccess('Data deletion request submitted successfully.')
    } catch (err: any) {
      setError('Failed to submit deletion request: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading privacy settings...</div>

  return (
    <div style={{ padding: '24px 32px', maxWidth: 800, margin: '0 auto' }}>
      <PageHeader
        title="Data & Privacy Center"
        subtitle="Manage your personal data consents (GDPR & POPIA compliant)."
        icon={Shield}
        color="#2563eb"
      />

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '12px 16px', borderRadius: 8, color: '#991b1b', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {success && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px 16px', borderRadius: 8, color: '#166534', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={16} />
          {success}
        </div>
      )}

      <div style={{ display: 'grid', gap: 24 }}>
        {/* Core Processing */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)', marginBottom: 4 }}>Core Data Processing</h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 500 }}>
                Consent to process your basic personal data required for educational and administrative purposes (e.g., grades, attendance, billing).
              </p>
            </div>
            <button
              onClick={() => updateConsent('data_processing_consent', !consents.data_processing_consent)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: consents.data_processing_consent ? '#2563eb' : '#9ca3af', display: 'flex', alignItems: 'center' }}
              disabled={saving}
            >
              {consents.data_processing_consent ? <ToggleRight size={40} /> : <ToggleLeft size={40} />}
            </button>
          </div>
          {!consents.data_processing_consent && (
            <div style={{ fontSize: 13, color: '#d97706', background: '#fef3c7', padding: '8px 12px', borderRadius: 8, display: 'inline-block' }}>
              ⚠️ Without this consent, your school may restrict your access to the platform.
            </div>
          )}
        </div>

        {/* Media & Photos */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)', marginBottom: 4 }}>Media & Photography</h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 500 }}>
                Consent to use your (or your ward's) image/video in internal school news, Nexora TV, and marketing materials.
              </p>
            </div>
            <button
              onClick={() => updateConsent('photo_media_consent', !consents.photo_media_consent)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: consents.photo_media_consent ? '#2563eb' : '#9ca3af', display: 'flex', alignItems: 'center' }}
              disabled={saving}
            >
              {consents.photo_media_consent ? <ToggleRight size={40} /> : <ToggleLeft size={40} />}
            </button>
          </div>
        </div>

        {/* Marketing */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)', marginBottom: 4 }}>Marketing Communications</h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 500 }}>
                Receive promotional emails, alumni newsletters, and updates not directly related to academic requirements.
              </p>
            </div>
            <button
              onClick={() => updateConsent('marketing_consent', !consents.marketing_consent)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: consents.marketing_consent ? '#2563eb' : '#9ca3af', display: 'flex', alignItems: 'center' }}
              disabled={saving}
            >
              {consents.marketing_consent ? <ToggleRight size={40} /> : <ToggleLeft size={40} />}
            </button>
          </div>
        </div>

        {/* Right to be Forgotten */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #fee2e2' }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Trash2 size={24} color="#dc2626" />
            </div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#991b1b', marginBottom: 4 }}>Right to be Forgotten</h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>
                Under GDPR and POPIA, you have the right to request the deletion or anonymization of your personal data. Requesting this will notify school administrators to process the removal of your personal identifiers from the system.
              </p>
              
              {consents.deletion_requested ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fef2f2', padding: '8px 16px', borderRadius: 8, color: '#b91c1c', fontWeight: 600, fontSize: 14 }}>
                  <Clock size={16} />
                  Deletion Request Pending (Submitted {new Date(consents.deletion_requested_at).toLocaleDateString()})
                </div>
              ) : (
                <button
                  onClick={handleDeletionRequest}
                  disabled={saving}
                  style={{
                    background: '#dc2626', color: '#fff', border: 'none', padding: '10px 20px',
                    borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(220,38,38,0.2)'
                  }}
                >
                  Request Data Deletion
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
