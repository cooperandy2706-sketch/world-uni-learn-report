// src/pages/security/VisitorsPage.tsx
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { format } from 'date-fns'
import { Plus, Search, LogOut, Users, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface Visitor {
  id: string; full_name: string; phone: string; purpose: string
  person_to_see: string; id_number: string; time_in: string; time_out: string | null
}

function Field({ label, value, onChange, type = 'text', placeholder = '' }: any) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
    </div>
  )
}

export default function VisitorsPage() {
  const { user } = useAuth()
  const schoolId = user?.school_id ?? ''
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ full_name: '', phone: '', purpose: '', person_to_see: '', id_number: '' })
  const today = new Date().toISOString().split('T')[0]

  const { data: visitors = [], isLoading } = useQuery({
    queryKey: ['visitors', schoolId, today],
    queryFn: async () => {
      const { data } = await supabase.from('visitors').select('*').eq('school_id', schoolId)
        .gte('time_in', `${today}T00:00:00`).order('time_in', { ascending: false })
      return (data ?? []) as Visitor[]
    },
    enabled: !!schoolId,
    refetchInterval: 20000,
  })

  const filtered = visitors.filter(v =>
    v.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (v.purpose ?? '').toLowerCase().includes(search.toLowerCase())
  )

  async function signIn() {
    if (!form.full_name.trim()) { toast.error('Name is required'); return }
    setSaving(true)
    const { error } = await supabase.from('visitors').insert({ school_id: schoolId, ...form })
    if (error) { toast.error('Failed to sign in visitor'); setSaving(false); return }
    toast.success(`${form.full_name} signed in!`)
    setForm({ full_name: '', phone: '', purpose: '', person_to_see: '', id_number: '' })
    setAddOpen(false)
    qc.invalidateQueries({ queryKey: ['visitors', schoolId, today] })
    setSaving(false)
  }

  async function signOut(id: string, name: string) {
    await supabase.from('visitors').update({ time_out: new Date().toISOString() }).eq('id', id).eq('school_id', schoolId)
    toast.success(`${name} signed out`)
    qc.invalidateQueries({ queryKey: ['visitors', schoolId, today] })
  }

  const onPremise = visitors.filter(v => !v.time_out).length

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800;900&display=swap');
        .vp-stat-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; }
        .vp-toolbar { display: flex; gap: 10px; align-items: center; }
        @media (max-width: 500px) {
          .vp-stat-grid { gap: 8px; }
          .vp-stat-grid > div { padding: 12px 10px !important; }
          .vp-toolbar { flex-direction: column; align-items: stretch; }
          .vp-toolbar button { width: 100% !important; justify-content: center !important; padding: 12px !important; }
        }
      `}</style>
      <div style={{ fontFamily: '"DM Sans",sans-serif', paddingBottom: 90 }}>

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', margin: 0 }}>Visitor Log</h1>
          <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>
            {format(new Date(), 'EEE, MMM d')} · <strong>{onPremise}</strong> visitor{onPremise !== 1 ? 's' : ''} on premises
          </p>
        </div>

        {/* Stats */}
        <div className="vp-stat-grid" style={{ marginBottom: 18 }}>
          {[
            { label: 'Total Today', value: visitors.length, color: '#334155', bg: '#f1f5f9' },
            { label: 'Still Inside', value: onPremise, color: '#059669', bg: '#dcfce7' },
            { label: 'Checked Out', value: visitors.length - onPremise, color: '#64748b', bg: '#f8fafc' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} style={{ background: bg, borderRadius: 14, padding: '14px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 900, color }}>{value}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Search + Add Button */}
        <div className="vp-toolbar" style={{ marginBottom: 14 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search visitors…"
              style={{ width: '100%', padding: '11px 12px 11px 32px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <button onClick={() => setAddOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 18px', borderRadius: 12, border: 'none', background: '#0f172a', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
            <Plus size={15} /> Sign In Visitor
          </button>
        </div>

        {/* Visitor List */}
        <div style={{ background: '#fff', borderRadius: 18, border: '1.5px solid #f1f5f9', overflow: 'hidden' }}>
          {isLoading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
              <Users size={36} style={{ marginBottom: 10, opacity: .3 }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: '#334155', marginBottom: 4 }}>No visitors today</div>
              <div style={{ fontSize: 13 }}>Tap "Sign In Visitor" to register a new arrival</div>
            </div>
          ) : filtered.map(v => (
            <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: '1px solid #f8fafc' }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', flexShrink: 0, background: v.time_out ? '#f1f5f9' : '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 900, color: v.time_out ? '#94a3b8' : '#059669' }}>
                {v.full_name.charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.full_name}</div>
                <div style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.purpose}{v.person_to_see && ` · Seeing: ${v.person_to_see}`}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                  In: {format(new Date(v.time_in), 'hh:mm a')}
                  {v.time_out && ` · Out: ${format(new Date(v.time_out), 'hh:mm a')}`}
                </div>
              </div>
              <div style={{ flexShrink: 0 }}>
                {!v.time_out ? (
                  <button onClick={() => signOut(v.id, v.full_name)}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 10, border: 'none', background: '#fef2f2', color: '#dc2626', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    <LogOut size={12} /> Sign Out
                  </button>
                ) : (
                  <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, background: '#f1f5f9', padding: '4px 10px', borderRadius: 8 }}>Gone</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add Modal — bottom sheet */}
        {addOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', zIndex: 9999 }}
            onClick={e => { if (e.target === e.currentTarget) setAddOpen(false) }}>
            <div style={{ background: '#fff', borderRadius: '22px 22px 0 0', padding: '24px 20px 90px', width: '100%', maxHeight: '92vh', overflowY: 'auto', fontFamily: '"DM Sans",sans-serif', boxSizing: 'border-box' }}>
              {/* Drag handle */}
              <div style={{ width: 40, height: 4, borderRadius: 4, background: '#e2e8f0', margin: '0 auto 18px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>Sign In Visitor</h2>
                <button onClick={() => setAddOpen(false)} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: '#f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
              </div>
              <Field label="Full Name *" value={form.full_name} onChange={(v: string) => setForm(f => ({ ...f, full_name: v }))} placeholder="John Mensah" />
              <Field label="Phone Number" value={form.phone} onChange={(v: string) => setForm(f => ({ ...f, phone: v }))} placeholder="0244 000 000" type="tel" />
              <Field label="Purpose of Visit" value={form.purpose} onChange={(v: string) => setForm(f => ({ ...f, purpose: v }))} placeholder="Parent meeting, Delivery…" />
              <Field label="Person to See" value={form.person_to_see} onChange={(v: string) => setForm(f => ({ ...f, person_to_see: v }))} placeholder="Mr. Adu, Admin Office…" />
              <Field label="ID / Ghana Card Number" value={form.id_number} onChange={(v: string) => setForm(f => ({ ...f, id_number: v }))} placeholder="GHA-000000000-0" />
              <button onClick={signIn} disabled={saving}
                style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: '#0f172a', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', marginTop: 8 }}>
                {saving ? 'Signing In…' : '✓ Sign In Visitor'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
