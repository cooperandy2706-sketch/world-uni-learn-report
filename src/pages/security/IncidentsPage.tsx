// src/pages/security/IncidentsPage.tsx
import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { format } from 'date-fns'
import { Plus, AlertTriangle, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useQuery, useQueryClient } from '@tanstack/react-query'

const TYPES = ['Theft', 'Trespassing', 'Fight', 'Fire', 'Medical Emergency', 'Vandalism', 'Suspicious Activity', 'Other']
const SEVERITY = [
  { value: 'low', label: 'Low', color: '#16a34a', bg: '#dcfce7' },
  { value: 'medium', label: 'Medium', color: '#d97706', bg: '#fef3c7' },
  { value: 'high', label: 'High', color: '#dc2626', bg: '#fee2e2' },
]

export default function IncidentsPage() {
  const { user } = useAuth()
  const schoolId = user?.school_id ?? ''
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ type: 'Other', description: '', location: '', severity: 'medium', persons_involved: '' })

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['incidents', schoolId],
    queryFn: async () => {
      const { data } = await supabase
        .from('notifications').select('*')
        .eq('school_id', schoolId).eq('type', 'incident')
        .order('created_at', { ascending: false }).limit(50)
      return data ?? []
    },
    enabled: !!schoolId,
  })

  async function submit() {
    if (!form.description.trim()) { toast.error('Description is required'); return }
    setSaving(true)
    const body = JSON.stringify({ type: form.type, location: form.location, severity: form.severity, persons: form.persons_involved })
    await supabase.from('notifications').insert({
      school_id: schoolId, user_id: user?.id,
      title: `[${form.severity.toUpperCase()}] ${form.type}`,
      body: form.description, type: 'incident', link: body,
    })
    toast.success('Incident reported')
    setForm({ type: 'Other', description: '', location: '', severity: 'medium', persons_involved: '' })
    setOpen(false)
    qc.invalidateQueries({ queryKey: ['incidents', schoolId] })
    setSaving(false)
  }

  function parseMeta(link: string) {
    try { return JSON.parse(link) } catch { return {} }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800;900&display=swap');
        .ip-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; gap: 12px; }
        @media (max-width: 480px) {
          .ip-header { flex-direction: column; align-items: stretch; }
          .ip-header button { width: 100% !important; justify-content: center !important; }
          .ip-inc-header { flex-direction: column !important; align-items: flex-start !important; gap: 8px !important; }
        }
      `}</style>
      <div style={{ fontFamily: '"DM Sans",sans-serif', paddingBottom: 90 }}>

        {/* Header */}
        <div className="ip-header">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', margin: 0 }}>Incident Reports</h1>
            <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>Log and track security incidents</p>
          </div>
          <button onClick={() => setOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 18px', borderRadius: 12, border: 'none', background: '#dc2626', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
            <Plus size={15} /> Report Incident
          </button>
        </div>

        {/* Incident List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {isLoading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading…</div>
          ) : incidents.length === 0 ? (
            <div style={{ padding: '44px 24px', textAlign: 'center', color: '#94a3b8', background: 'var(--bg-card)', borderRadius: 18, border: '1.5px solid #f1f5f9' }}>
              <AlertTriangle size={36} style={{ marginBottom: 10, opacity: .3 }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: '#334155' }}>No incidents recorded</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Use the Report button to log an incident</div>
            </div>
          ) : incidents.map((inc: any) => {
            const meta = parseMeta(inc.link ?? '{}')
            const sev = SEVERITY.find(s => s.value === meta.severity) ?? SEVERITY[1]
            return (
              <div key={inc.id} style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1.5px solid #f1f5f9', padding: '16px' }}>
                <div className="ip-inc-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 11, background: sev.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <AlertTriangle size={18} color={sev.color} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{meta.type ?? 'Incident'}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{format(new Date(inc.created_at), 'MMM d, yyyy · hh:mm a')}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99, background: sev.bg, color: sev.color, whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {sev.label} Severity
                  </span>
                </div>
                <p style={{ fontSize: 13, color: '#475569', margin: '0 0 8px', lineHeight: 1.5 }}>{inc.body}</p>
                {meta.location && <div style={{ fontSize: 12, color: '#94a3b8' }}>📍 {meta.location}</div>}
                {meta.persons && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>👤 {meta.persons}</div>}
              </div>
            )
          })}
        </div>

        {/* Report Modal — bottom sheet */}
        {open && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 9999 }}
            onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}>
            <div style={{ background: 'var(--bg-card)', borderRadius: '22px 22px 0 0', padding: '24px 20px 90px', width: '100%', maxWidth: 540, maxHeight: '92vh', overflowY: 'auto', boxSizing: 'border-box', fontFamily: '"DM Sans",sans-serif' }}>
              {/* Drag handle */}
              <div style={{ width: 40, height: 4, borderRadius: 4, background: '#e2e8f0', margin: '0 auto 18px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Report Incident</h2>
                <button onClick={() => setOpen(false)} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: '#f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
              </div>

              {/* Type */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.04em' }}>Incident Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', background: 'var(--bg-card)' }}>
                  {TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>

              {/* Severity */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.04em' }}>Severity</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {SEVERITY.map(s => (
                    <button key={s.value} onClick={() => setForm(f => ({ ...f, severity: s.value }))}
                      style={{ flex: 1, padding: '11px 8px', borderRadius: 10, border: `2px solid ${form.severity === s.value ? s.color : '#e2e8f0'}`, background: form.severity === s.value ? s.bg : '#fff', color: s.color, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fields */}
              {[
                { label: 'Description *', key: 'description', type: 'textarea', placeholder: 'Describe what happened…' },
                { label: 'Location', key: 'location', placeholder: 'Main gate, Block B, Field…' },
                { label: 'Persons Involved', key: 'persons_involved', placeholder: 'Names or descriptions…' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key} style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</label>
                  {type === 'textarea' ? (
                    <textarea value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} rows={3}
                      style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: '"DM Sans",sans-serif' }} />
                  ) : (
                    <input value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder}
                      style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                  )}
                </div>
              ))}

              <button onClick={submit} disabled={saving}
                style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: '#dc2626', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', marginTop: 4 }}>
                {saving ? 'Submitting…' : '🚨 Submit Incident Report'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
