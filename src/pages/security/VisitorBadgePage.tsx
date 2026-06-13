// src/pages/security/VisitorBadgePage.tsx
// Visitor badge printing and walk-in management
import { useState, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { format } from 'date-fns'
import { Plus, Printer, LogOut, Search, X, Users, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const PURPOSES = ['Parent Visit', 'Delivery', 'Official Meeting', 'Interview', 'Contractor', 'Inspection', 'Other']

function QRImg({ value, size = 80 }: { value: string; size?: number }) {
  const encoded = encodeURIComponent(value)
  return (
    <img loading="lazy" src={`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&margin=2`}
      width={size} height={size}
      style={{ imageRendering: 'pixelated', display: 'block' }}
      alt="QR"
    />
  )
}

export default function VisitorBadgePage() {
  const { user } = useAuth()
  const schoolId = user?.school_id ?? ''
  const qc = useQueryClient()
  const printRef = useRef<HTMLDivElement>(null)
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [printing, setPrinting] = useState<any>(null)
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    full_name: '', phone: '', purpose: 'Parent Visit',
    person_to_see: '', id_number: '', host_department: ''
  })

  const { data: visitors = [], isLoading } = useQuery({
    queryKey: ['visitors-badge', schoolId, today],
    queryFn: async () => {
      const { data } = await supabase
        .from('visitors').select('*')
        .eq('school_id', schoolId)
        .gte('time_in', `${today}T00:00:00`)
        .order('time_in', { ascending: false })
      return data ?? []
    },
    enabled: !!schoolId,
    refetchInterval: 15000,
  })

  const filtered = (visitors as any[]).filter(v =>
    v.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    (v.purpose ?? '').toLowerCase().includes(search.toLowerCase())
  )
  const onPremise = (visitors as any[]).filter((v: any) => !v.time_out).length

  async function signIn() {
    if (!form.full_name.trim()) { toast.error('Full name is required'); return }
    setSaving(true)
    const { data, error } = await supabase
      .from('visitors')
      .insert({ school_id: schoolId, ...form })
      .select('*')
      .single()
    if (error) { toast.error('Failed to register visitor'); setSaving(false); return }
    toast.success(`${form.full_name} signed in!`)
    setAddOpen(false)
    setForm({ full_name: '', phone: '', purpose: 'Parent Visit', person_to_see: '', id_number: '', host_department: '' })
    qc.invalidateQueries({ queryKey: ['visitors-badge', schoolId, today] })
    setSaving(false)
    // Auto-open badge print preview
    if (data) setTimeout(() => setPrinting(data), 300)
  }

  async function signOut(v: any) {
    await supabase.from('visitors')
      .update({ time_out: new Date().toISOString() })
      .eq('id', v.id).eq('school_id', schoolId)
    toast.success(`${v.full_name} signed out`)
    qc.invalidateQueries({ queryKey: ['visitors-badge', schoolId, today] })
  }

  function printBadge() {
    if (!printing) return
    const printWin = window.open('', '_blank', 'width=400,height=600')
    if (!printWin) { toast.error('Allow pop-ups to print'); return }
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`VISITOR:${printing.id}`)}&margin=2`
    const schoolName = user?.full_name ?? 'School'
    printWin.document.write(`
      <html><head><title>Visitor Badge</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800;900&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DM Sans', sans-serif; background: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
        .badge { width: 320px; border: 3px solid #0f172a; border-radius: 8px; overflow: hidden; page-break-inside: avoid; }
        .badge-header { background: #0f172a; color: #fff; padding: 14px 18px; text-align: center; }
        .badge-header .school { font-size: 11px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; opacity: .7; margin-bottom: 2px; }
        .badge-header .visitor-tag { font-size: 22px; font-weight: 900; letter-spacing: .05em; }
        .badge-body { padding: 18px; }
        .avatar { width: 64px; height: 64px; border-radius: 50%; background: #f1f5f9; border: 3px solid #0f172a; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 900; color: #0f172a; margin: 0 auto 12px; }
        .name { font-size: 22px; font-weight: 900; color: #0f172a; text-align: center; margin-bottom: 4px; }
        .purpose { font-size: 13px; font-weight: 700; color: #475569; text-align: center; margin-bottom: 14px; }
        .row { display: flex; justify-content: space-between; font-size: 11px; padding: 4px 0; border-bottom: 1px solid #f1f5f9; }
        .row .label { color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; }
        .row .val { color: #0f172a; font-weight: 700; text-align: right; max-width: 60%; }
        .qr-wrap { display: flex; flex-direction: column; align-items: center; margin-top: 14px; gap: 4px; }
        .qr-note { font-size: 9px; color: #94a3b8; font-weight: 600; letter-spacing: .05em; }
        .badge-footer { background: #dc2626; padding: 8px; text-align: center; font-size: 10px; font-weight: 800; color: #fff; letter-spacing: .08em; }
        @media print { body { min-height: unset; } }
      </style></head>
      <body>
        <div class="badge">
          <div class="badge-header">
            <div class="school">Acadera Platform — ${schoolName}</div>
            <div class="visitor-tag">🪪 VISITOR PASS</div>
          </div>
          <div class="badge-body">
            <div class="avatar">${printing.full_name?.charAt(0).toUpperCase()}</div>
            <div class="name">${printing.full_name}</div>
            <div class="purpose">${printing.purpose || 'General Visit'}</div>
            <div class="row"><span class="label">Date</span><span class="val">${format(new Date(printing.time_in), 'MMM d, yyyy')}</span></div>
            <div class="row"><span class="label">Time In</span><span class="val">${format(new Date(printing.time_in), 'hh:mm a')}</span></div>
            ${printing.person_to_see ? `<div class="row"><span class="label">Seeing</span><span class="val">${printing.person_to_see}</span></div>` : ''}
            ${printing.id_number ? `<div class="row"><span class="label">ID</span><span class="val">${printing.id_number}</span></div>` : ''}
            ${printing.phone ? `<div class="row"><span class="label">Phone</span><span class="val">${printing.phone}</span></div>` : ''}
            <div class="qr-wrap">
              <img loading="lazy" src="${qrUrl}" width="100" height="100" />
              <div class="qr-note">SCAN TO SIGN OUT</div>
            </div>
          </div>
          <div class="badge-footer">MUST BE WORN & VISIBLE AT ALL TIMES</div>
        </div>
        <script>window.onload=()=>{window.print();setTimeout(()=>window.close(),500)}<\/script>
      </body></html>
    `)
    printWin.document.close()
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800;900&display=swap');
        @keyframes vb_pop { 0%{opacity:0;transform:scale(.95) translateY(16px)} 100%{opacity:1;transform:scale(1) translateY(0)} }
        .vb-row:hover { background: #f8fafc !important; }
        .vb-row { transition: background .12s; }
        @media (max-width: 600px) { .vb-stats { grid-template-columns: 1fr 1fr !important; } }
        @media print { .no-print { display: none !important; } }
      `}</style>

      <div style={{ fontFamily: '"DM Sans",sans-serif', maxWidth: 800, margin: '0 auto', paddingBottom: 90 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#0f172a', color: '#fff', padding: '5px 14px', borderRadius: 99, fontSize: 11, fontWeight: 800, marginBottom: 8, letterSpacing: '.05em' }}>
              🪪 VISITOR MANAGEMENT
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: '0 0 4px' }}>Visitor Sign-In & Badges</h1>
            <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
              {format(new Date(), 'EEEE, MMMM d')} · <strong>{onPremise}</strong> visitor{onPremise !== 1 ? 's' : ''} on premises
            </p>
          </div>
          <button onClick={() => setAddOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 14, border: 'none', background: '#0f172a', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <Plus size={16} /> Sign In Visitor
          </button>
        </div>

        {/* Stats */}
        <div className="vb-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Today Total', value: (visitors as any[]).length, color: '#334155', bg: '#f1f5f9' },
            { label: 'On Premises', value: onPremise, color: '#059669', bg: '#dcfce7' },
            { label: 'Signed Out', value: (visitors as any[]).length - onPremise, color: '#64748b', bg: '#f8fafc' },
            { label: 'This Week', value: '—', color: '#7c3aed', bg: '#f5f3ff' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: '14px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search visitors…"
            style={{ width: '100%', padding: '11px 12px 11px 34px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }} />
        </div>

        {/* Visitor List */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1.5px solid #f1f5f9', overflow: 'hidden' }}>
          {isLoading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '50px 24px', textAlign: 'center' }}>
              <Users size={40} style={{ margin: '0 auto 12px', opacity: .25, display: 'block' }} color="#94a3b8" />
              <div style={{ fontSize: 15, fontWeight: 700, color: '#334155' }}>No visitors today</div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Tap "Sign In Visitor" to register an arrival</div>
            </div>
          ) : filtered.map((v: any) => (
            <div key={v.id} className="vb-row" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: '1px solid #f8fafc' }}>
              {/* Avatar */}
              <div style={{ width: 46, height: 46, borderRadius: '50%', background: v.time_out ? '#f1f5f9' : '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: v.time_out ? '#94a3b8' : '#2563eb', flexShrink: 0 }}>
                {v.full_name?.charAt(0)}
              </div>
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.full_name}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{v.purpose}{v.person_to_see ? ` · Seeing: ${v.person_to_see}` : ''}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
                  In: {format(new Date(v.time_in), 'hh:mm a')}
                  {v.time_out ? ` · Out: ${format(new Date(v.time_out), 'hh:mm a')}` : ' · Still inside'}
                </div>
              </div>
              {/* Status + Actions */}
              <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
                <button onClick={() => setPrinting(v)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 9, border: '1.5px solid #e2e8f0', background: 'var(--bg-card)', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#334155' }}>
                  <Printer size={13} /> Badge
                </button>
                {!v.time_out && (
                  <button onClick={() => signOut(v)}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 9, border: 'none', background: '#fef2f2', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#dc2626' }}>
                    <LogOut size={13} /> Sign Out
                  </button>
                )}
                {v.time_out && (
                  <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, background: '#f1f5f9', padding: '6px 10px', borderRadius: 8 }}>
                    <CheckCircle size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} />Gone
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Sign In Modal ── */}
      {addOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 9999 }}
          onClick={e => { if (e.target === e.currentTarget) setAddOpen(false) }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: '22px 22px 0 0', padding: '24px 20px 90px', width: '100%', maxWidth: 500, maxHeight: '92vh', overflowY: 'auto', boxSizing: 'border-box' as const, animation: 'vb_pop .25s ease' }}>
            <div style={{ width: 40, height: 4, borderRadius: 4, background: '#e2e8f0', margin: '0 auto 20px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: 0 }}>Register Visitor</h2>
                <p style={{ fontSize: 12, color: '#64748b', margin: '3px 0 0' }}>Badge will print automatically after sign-in</p>
              </div>
              <button onClick={() => setAddOpen(false)} style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: '#f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
            </div>

            {/* Purpose */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: '#334155', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>Purpose of Visit *</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {PURPOSES.map(p => (
                  <button key={p} onClick={() => setForm(f => ({ ...f, purpose: p }))}
                    style={{ padding: '6px 12px', borderRadius: 99, border: `1.5px solid ${form.purpose === p ? '#0f172a' : '#e2e8f0'}`, background: form.purpose === p ? '#0f172a' : '#fff', color: form.purpose === p ? '#fff' : '#334155', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {[
              { label: 'Full Name *', key: 'full_name', placeholder: 'e.g. Kwame Mensah' },
              { label: 'Phone Number', key: 'phone', placeholder: '0244 000 000' },
              { label: 'Person to See', key: 'person_to_see', placeholder: 'Teacher name, Admin Office…' },
              { label: 'ID / Ghana Card No.', key: 'id_number', placeholder: 'GHA-000000000-0' },
              { label: 'Department / Block', key: 'host_department', placeholder: 'Main Office, Block A…' },
            ].map(({ label, key, placeholder }) => (
              <div key={key} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#334155', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</label>
                <input value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const, fontFamily: '"DM Sans",sans-serif' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#0f172a'}
                  onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'} />
              </div>
            ))}

            <button onClick={signIn} disabled={saving || !form.full_name.trim()}
              style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: saving || !form.full_name.trim() ? '#e2e8f0' : '#0f172a', color: saving || !form.full_name.trim() ? '#94a3b8' : '#fff', fontSize: 14, fontWeight: 800, cursor: saving || !form.full_name.trim() ? 'not-allowed' : 'pointer', marginTop: 8, fontFamily: '"DM Sans",sans-serif' }}>
              {saving ? 'Signing In…' : '🪪 Sign In & Print Badge'}
            </button>
          </div>
        </div>
      )}

      {/* ── Badge Preview Modal ── */}
      {printing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setPrinting(null) }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 12, maxWidth: 360, width: '100%', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.3)', animation: 'vb_pop .2s ease' }}>
            {/* Preview Header */}
            <div style={{ background: '#0f172a', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,.5)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Badge Preview</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>🪪 VISITOR PASS</div>
              </div>
              <button onClick={() => setPrinting(null)} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,.1)', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
            </div>

            {/* Badge Body */}
            <div style={{ padding: '24px 24px 16px' }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 900, color: '#2563eb', flexShrink: 0, border: '3px solid #0f172a' }}>
                  {printing.full_name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a' }}>{printing.full_name}</div>
                  <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>{printing.purpose}</div>
                </div>
              </div>

              {[
                { l: 'Date', v: format(new Date(printing.time_in), 'MMM d, yyyy') },
                { l: 'Time In', v: format(new Date(printing.time_in), 'hh:mm a') },
                printing.person_to_see ? { l: 'Seeing', v: printing.person_to_see } : null,
                printing.id_number ? { l: 'ID No.', v: printing.id_number } : null,
              ].filter(Boolean).map((row: any) => (
                <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '5px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em' }}>{row.l}</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{row.v}</span>
                </div>
              ))}

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 16, gap: 4 }}>
                <QRImg value={`VISITOR:${printing.id}`} size={90} />
                <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase' }}>Scan to sign out</div>
              </div>
            </div>

            <div style={{ background: '#dc2626', padding: '8px', textAlign: 'center', fontSize: 10, fontWeight: 800, color: '#fff', letterSpacing: '.08em' }}>
              MUST BE WORN & VISIBLE AT ALL TIMES
            </div>

            {/* Print Button */}
            <div style={{ padding: '16px 24px', display: 'flex', gap: 8 }}>
              <button onClick={() => setPrinting(null)} style={{ flex: 1, padding: '11px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: 'var(--bg-card)', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: '#334155' }}>Close</button>
              <button onClick={printBadge} style={{ flex: 2, padding: '11px', borderRadius: 12, border: 'none', background: '#0f172a', fontSize: 13, fontWeight: 800, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                <Printer size={15} /> Print Badge
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
