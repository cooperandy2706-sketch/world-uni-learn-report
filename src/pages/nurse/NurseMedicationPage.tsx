// src/pages/nurse/NurseMedicationPage.tsx
// Track students on daily/recurring medication schedules
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { Pill, Plus, Search, Trash2, CheckCircle, Clock, X } from 'lucide-react'
import { useStudents } from '../../hooks/useStudents'
import toast from 'react-hot-toast'

const T = {
  primary: '#0ea5e9',
  bg: '#f0f9ff',
  card: '#ffffff',
  text: '#0f172a',
  muted: '#64748b',
  border: '#e2e8f0',
  red: '#ef4444',
  green: '#10b981',
  orange: '#f59e0b',
  purple: '#8b5cf6',
}

const FREQUENCIES = ['Once daily', 'Twice daily', 'Three times daily', 'Before meals', 'After meals', 'As needed', 'Weekly']

// Uses the medical_records notes field + a new medication_schedules concept
// We'll use a custom table via a workaround: store as JSON in medical_records
// For a clean solution we add a medication_schedules table

export default function NurseMedicationPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const { data: students = [] } = useStudents()
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    student_id: '',
    medication_name: '',
    dosage: '',
    frequency: 'Once daily',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    instructions: '',
    prescribed_by: '',
  })

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['medication-schedules', user?.school_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('medication_schedules')
        .select('*, student:students(id, full_name, class:classes(name))')
        .eq('school_id', user!.school_id!)
        .order('created_at', { ascending: false })
      return data ?? []
    },
    enabled: !!user?.school_id,
  })

  const handleAdd = async () => {
    if (!form.student_id || !form.medication_name || !form.dosage) {
      toast.error('Student, medication name, and dosage are required.')
      return
    }
    setSaving(true)
    const { error } = await supabase.from('medication_schedules').insert({
      school_id: user!.school_id,
      nurse_id: user!.id,
      ...form,
    })
    if (error) { toast.error(error.message) }
    else {
      toast.success('Medication schedule added!')
      qc.invalidateQueries({ queryKey: ['medication-schedules'] })
      setModal(false)
      setForm({ student_id: '', medication_name: '', dosage: '', frequency: 'Once daily', start_date: new Date().toISOString().split('T')[0], end_date: '', instructions: '', prescribed_by: '' })
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this medication schedule?')) return
    await supabase.from('medication_schedules').delete().eq('id', id).eq('school_id', user!.school_id)
    qc.invalidateQueries({ queryKey: ['medication-schedules'] })
    toast.success('Removed.')
  }

  const filtered = (schedules as any[]).filter((s: any) =>
    s.student?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.medication_name?.toLowerCase().includes(search.toLowerCase())
  )

  const today = new Date().toISOString().split('T')[0]
  const active = filtered.filter((s: any) => !s.end_date || s.end_date >= today)
  const inactive = filtered.filter((s: any) => s.end_date && s.end_date < today)

  return (
    <div style={{ padding: '24px', maxWidth: 1100, margin: '0 auto', fontFamily: '"DM Sans", sans-serif' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');`}</style>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <Pill size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: T.text, margin: 0 }}>Medication Tracker</h1>
            <p style={{ fontSize: 13, color: T.muted, margin: '2px 0 0' }}>Students on scheduled daily medication</p>
          </div>
        </div>
        <button onClick={() => setModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 8, border: 'none', background: T.purple, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 12px ${T.purple}40` }}>
          <Plus size={16} /> Add Schedule
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Active Schedules', value: active.length, color: T.green, icon: CheckCircle },
          { label: 'Total Students', value: new Set(filtered.map((s: any) => s.student_id)).size, color: T.primary, icon: Pill },
          { label: 'Expired Schedules', value: inactive.length, color: T.muted, icon: Clock },
        ].map(s => (
          <div key={s.label} style={{ background: T.card, borderRadius: 14, padding: '16px 20px', border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: `${s.color}15`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <s.icon size={22} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: T.text }}>{s.value}</div>
              <div style={{ fontSize: 13, color: T.muted, fontWeight: 600 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 380 }}>
        <Search size={15} color={T.muted} style={{ position: 'absolute', left: 10, top: 10 }} />
        <input placeholder="Search student or medication..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '9px 10px 9px 32px', borderRadius: 8, border: `1px solid ${T.border}`, outline: 'none', fontSize: 13 }} />
      </div>

      {/* Active Schedules */}
      <h2 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <CheckCircle size={18} color={T.green} /> Active Schedules
      </h2>

      {isLoading ? (
        <div style={{ padding: 40, textAlign: 'center', color: T.muted }}>Loading...</div>
      ) : active.length === 0 ? (
        <div style={{ background: T.card, borderRadius: 14, border: `1px dashed ${T.border}`, padding: 48, textAlign: 'center', color: T.muted, marginBottom: 32 }}>
          <Pill size={36} style={{ opacity: 0.2, marginBottom: 12 }} />
          <p>No active medication schedules.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16, marginBottom: 32 }}>
          {active.map((s: any) => (
            <MedCard key={s.id} s={s} today={today} onDelete={handleDelete} T={T} />
          ))}
        </div>
      )}

      {/* Expired Schedules */}
      {inactive.length > 0 && (
        <>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: T.muted, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={18} /> Expired / Completed
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {inactive.map((s: any) => (
              <MedCard key={s.id} s={s} today={today} onDelete={handleDelete} T={T} expired />
            ))}
          </div>
        </>
      )}

      {/* Add Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'var(--bg-card)', width: '100%', maxWidth: 520, borderRadius: 20, overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Add Medication Schedule</h3>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted }}><X size={20} /></button>
            </div>

            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 6, textTransform: 'uppercase' }}>Student *</label>
                <select value={form.student_id} onChange={e => setForm(p => ({ ...p, student_id: e.target.value }))}
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${T.border}`, outline: 'none', fontSize: 14, background: 'var(--bg-card)' }}>
                  <option value="">-- Select Student --</option>
                  {(students as any[]).map((s: any) => (
                    <option key={s.id} value={s.id}>{s.full_name} ({s.class?.name})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 6, textTransform: 'uppercase' }}>Medication Name *</label>
                  <input value={form.medication_name} onChange={e => setForm(p => ({ ...p, medication_name: e.target.value }))} placeholder="e.g. Ritalin, Ventolin"
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${T.border}`, outline: 'none', fontSize: 14 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 6, textTransform: 'uppercase' }}>Dosage *</label>
                  <input value={form.dosage} onChange={e => setForm(p => ({ ...p, dosage: e.target.value }))} placeholder="e.g. 10mg"
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${T.border}`, outline: 'none', fontSize: 14 }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 6, textTransform: 'uppercase' }}>Frequency</label>
                <select value={form.frequency} onChange={e => setForm(p => ({ ...p, frequency: e.target.value }))}
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${T.border}`, outline: 'none', fontSize: 14, background: 'var(--bg-card)' }}>
                  {FREQUENCIES.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 6, textTransform: 'uppercase' }}>Start Date</label>
                  <input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))}
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${T.border}`, outline: 'none', fontSize: 14 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 6, textTransform: 'uppercase' }}>End Date (optional)</label>
                  <input type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))}
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${T.border}`, outline: 'none', fontSize: 14 }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 6, textTransform: 'uppercase' }}>Prescribed By (Doctor)</label>
                <input value={form.prescribed_by} onChange={e => setForm(p => ({ ...p, prescribed_by: e.target.value }))} placeholder="Dr. Mensah"
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${T.border}`, outline: 'none', fontSize: 14 }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 6, textTransform: 'uppercase' }}>Special Instructions</label>
                <textarea value={form.instructions} onChange={e => setForm(p => ({ ...p, instructions: e.target.value }))} rows={2}
                  placeholder="e.g. Must be given with food. Store in fridge." style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${T.border}`, outline: 'none', fontSize: 14, resize: 'vertical' }} />
              </div>

              <button disabled={saving} onClick={handleAdd}
                style={{ width: '100%', background: T.purple, color: '#fff', border: 'none', padding: 14, borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 4 }}>
                {saving ? 'Saving...' : 'Save Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MedCard({ s, today, onDelete, T, expired }: any) {
  const daysLeft = s.end_date
    ? Math.ceil((new Date(s.end_date).getTime() - new Date(today).getTime()) / 86400000)
    : null

  return (
    <div style={{
      background: expired ? '#f8fafc' : T.card,
      borderRadius: 16, border: `1px solid ${expired ? T.border : T.primary + '30'}`,
      padding: 20, opacity: expired ? 0.7 : 1,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: '50%', background: `${T.purple}20`, color: T.purple, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16 }}>
            {s.student?.full_name?.charAt(0)}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{s.student?.full_name}</div>
            <div style={{ fontSize: 12, color: T.muted }}>{s.student?.class?.name}</div>
          </div>
        </div>
        <button onClick={() => onDelete(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.red, padding: 4 }}>
          <Trash2 size={15} />
        </button>
      </div>

      <div style={{ background: expired ? '#f1f5f9' : T.bg, borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{s.medication_name} <span style={{ fontSize: 13, fontWeight: 600, color: T.muted }}>· {s.dosage}</span></div>
        <div style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>{s.frequency}</div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: T.muted }}>
        <span>Start: <b style={{ color: T.text }}>{s.start_date}</b></span>
        {s.end_date && <span>End: <b style={{ color: expired ? T.red : T.text }}>{s.end_date}</b></span>}
        {daysLeft !== null && !expired && (
          <span style={{ background: daysLeft <= 7 ? `${T.orange}20` : `${T.green}15`, color: daysLeft <= 7 ? T.orange : T.green, padding: '2px 8px', borderRadius: 99, fontWeight: 700 }}>
            {daysLeft}d left
          </span>
        )}
      </div>

      {s.instructions && (
        <div style={{ marginTop: 10, fontSize: 12, color: T.muted, borderTop: `1px solid ${T.border}`, paddingTop: 10 }}>
          📋 {s.instructions}
        </div>
      )}
      {s.prescribed_by && (
        <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>
          🩺 Prescribed by: <b>{s.prescribed_by}</b>
        </div>
      )}
    </div>
  )
}
