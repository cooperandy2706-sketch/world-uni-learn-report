// src/pages/nurse/NurseVisitsPage.tsx
// Full searchable/filterable log of all clinic visits school-wide
import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { ClipboardList, Search, Filter, Bell, BellOff, Download, ChevronDown, ChevronUp, Plus, X } from 'lucide-react'
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
}

interface Visit {
  id: string
  student_id: string
  visit_date: string
  symptoms: string
  treatment: string
  medication_given: string
  time_in: string
  time_out: string
  parent_notified: boolean
  notes: string
  student: {
    full_name: string
    class: { name: string }
  }
  nurse: { full_name: string }
}

const PERIODS = [
  { label: 'This Month', value: 'this_month' },
  { label: 'Last Month', value: 'last_month' },
  { label: 'Last 3 Months', value: 'last_3_months' },
  { label: 'All Time', value: 'all' },
]

export default function NurseVisitsPage() {
  const { user } = useAuth()
  const [visits, setVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [period, setPeriod] = useState('this_month')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data: students = [] } = useStudents()
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [studentSearch, setStudentSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [visitForm, setVisitForm] = useState({
    symptoms: '', treatment: '', medication_given: '', parent_notified: false, notes: ''
  })

  const fetchVisits = async () => {
    if (!user?.school_id) return
    setLoading(true)

    let from: Date | null = null
    let to: Date | null = null
    const now = new Date()

    if (period === 'this_month') { from = startOfMonth(now); to = endOfMonth(now) }
    else if (period === 'last_month') { from = startOfMonth(subMonths(now, 1)); to = endOfMonth(subMonths(now, 1)) }
    else if (period === 'last_3_months') { from = startOfMonth(subMonths(now, 3)); to = endOfMonth(now) }

    let query = supabase
      .from('clinic_visits')
      .select('*, student:students(full_name, class:classes(name)), nurse:users!nurse_id(full_name)')
      .eq('school_id', user.school_id)
      .order('visit_date', { ascending: false })
      .order('time_in', { ascending: false })

    if (from) query = query.gte('visit_date', format(from, 'yyyy-MM-dd'))
    if (to) query = query.lte('visit_date', format(to, 'yyyy-MM-dd'))

    const { data } = await query
    setVisits((data as any) ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchVisits() }, [user?.school_id, period])

  const filtered = visits.filter(v =>
    v.student?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    v.symptoms?.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total: filtered.length,
    notified: filtered.filter(v => v.parent_notified).length,
    withMeds: filtered.filter(v => v.medication_given).length,
  }

  const exportCSV = () => {
    const rows = [
      ['Date', 'Student', 'Class', 'Symptoms', 'Treatment', 'Medication', 'Time In', 'Time Out', 'Parent Notified'],
      ...filtered.map(v => [
        v.visit_date, v.student?.full_name, v.student?.class?.name,
        v.symptoms, v.treatment, v.medication_given, v.time_in, v.time_out,
        v.parent_notified ? 'Yes' : 'No'
      ])
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `clinic_visits_${period}.csv`; a.click()
  }

  const handleLogVisit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent || !user?.school_id) return
    setSaving(true)
    
    try {
      const timeIn = format(new Date(), 'HH:mm')
      const payload = {
        school_id: user.school_id,
        student_id: selectedStudent.id,
        nurse_id: user.id,
        visit_date: format(new Date(), 'yyyy-MM-dd'),
        time_in: timeIn,
        time_out: timeIn,
        ...visitForm
      }
      
      await supabase.from('clinic_visits').insert(payload)
      
      if (visitForm.parent_notified) {
        const { data: parentRel } = await supabase
          .from('students')
          .select('user_id')
          .eq('id', selectedStudent.id)
          .single()
          
        if (parentRel?.user_id) {
          await supabase.from('notifications').insert({
            school_id: user.school_id,
            user_id: parentRel.user_id,
            title: `Clinic Visit: ${selectedStudent.full_name}`,
            body: `Your ward visited the clinic today for: ${visitForm.symptoms}.`,
            type: 'alert'
          })
        }
      }
      
      toast.success('Visit logged successfully')
      setVisitForm({ symptoms: '', treatment: '', medication_given: '', parent_notified: false, notes: '' })
      setSelectedStudent(null)
      setModalOpen(false)
      fetchVisits()
    } catch (err: any) {
      toast.error(err.message || 'Failed to log visit')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div style={{ padding: '24px', maxWidth: 1100, margin: '0 auto', fontFamily: '"DM Sans", sans-serif' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <ClipboardList size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: T.text, margin: 0 }}>Clinic Visits Log</h1>
            <p style={{ fontSize: 13, color: T.muted, margin: '2px 0 0' }}>Full history of all sick bay visits</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8, border: `1px solid ${T.border}`, background: 'var(--bg-card)', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: T.text }}>
            <Download size={15} /> Export CSV
          </button>
          <button onClick={() => setModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8, border: 'none', background: T.primary, fontSize: 13, fontWeight: 700, cursor: 'pointer', color: '#fff', boxShadow: `0 4px 12px ${T.primary}40` }}>
            <Plus size={16} /> Log New Visit
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Visits', value: stats.total, color: T.primary, bg: `${T.primary}15` },
          { label: 'Parent Alerts Sent', value: stats.notified, color: T.green, bg: `${T.green}15` },
          { label: 'Medications Given', value: stats.withMeds, color: T.orange, bg: `${T.orange}15` },
        ].map(s => (
          <div key={s.label} style={{ background: T.card, borderRadius: 14, padding: '16px 20px', border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800 }}>{s.value}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.muted }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={15} color={T.muted} style={{ position: 'absolute', left: 10, top: 10 }} />
          <input placeholder="Search student name or symptom..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '9px 10px 9px 32px', borderRadius: 8, border: `1px solid ${T.border}`, outline: 'none', fontSize: 13 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={15} color={T.muted} />
          <select value={period} onChange={e => setPeriod(e.target.value)}
            style={{ padding: '9px 12px', borderRadius: 8, border: `1px solid ${T.border}`, outline: 'none', fontSize: 13, background: 'var(--bg-card)' }}>
            {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
      </div>

      {/* Visits Table */}
      <div style={{ background: T.card, borderRadius: 16, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: T.muted }}>Loading visits...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: T.muted }}>
            <ClipboardList size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
            <p style={{ fontSize: 15 }}>No visits found for this period.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: `2px solid ${T.border}` }}>
                {['Date', 'Student', 'Symptoms', 'Parent Alerted', 'Expand'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(v => (
                <>
                  <tr key={v.id} style={{ borderBottom: `1px solid ${T.border}`, background: expandedId === v.id ? T.bg : '#fff' }}>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: T.muted, whiteSpace: 'nowrap' }}>
                      {v.visit_date}<br /><span style={{ fontSize: 11 }}>{v.time_in}</span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{v.student?.full_name}</div>
                      <div style={{ fontSize: 12, color: T.muted }}>{v.student?.class?.name}</div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: T.text, maxWidth: 280 }}>{v.symptoms}</td>
                    <td style={{ padding: '14px 16px' }}>
                      {v.parent_notified
                        ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: `${T.green}15`, color: T.green, fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99 }}><Bell size={11} /> Yes</span>
                        : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f1f5f9', color: T.muted, fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99 }}><BellOff size={11} /> No</span>
                      }
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button onClick={() => setExpandedId(expandedId === v.id ? null : v.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, display: 'flex', alignItems: 'center' }}>
                        {expandedId === v.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </td>
                  </tr>
                  {expandedId === v.id && (
                    <tr key={`${v.id}-exp`} style={{ background: T.bg, borderBottom: `1px solid ${T.border}` }}>
                      <td colSpan={5} style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                          {[
                            { label: 'Treatment', value: v.treatment || '—' },
                            { label: 'Medication Given', value: v.medication_given || '—' },
                            { label: 'Notes', value: v.notes || '—' },
                          ].map(item => (
                            <div key={item.label}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', marginBottom: 4 }}>{item.label}</div>
                              <div style={{ fontSize: 14, color: T.text }}>{item.value}</div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
      
      {/* Log Visit Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--bg-card)', width: '100%', maxWidth: 500, borderRadius: 20, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Log Clinic Visit</h3>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted }}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleLogVisit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {!selectedStudent ? (
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 8 }}>Search Student</label>
                  <div style={{ position: 'relative', marginBottom: 12 }}>
                    <Search size={16} color={T.muted} style={{ position: 'absolute', left: 12, top: 12 }} />
                    <input autoFocus placeholder="Start typing name..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: 10, border: `1px solid ${T.border}`, outline: 'none' }} />
                  </div>
                  <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {students.filter((s:any) => s.full_name.toLowerCase().includes(studentSearch.toLowerCase())).slice(0, 5).map((s:any) => (
                      <div key={s.id} onClick={() => setSelectedStudent(s)} style={{ padding: '10px 14px', borderRadius: 8, border: `1px solid ${T.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${T.primary}20`, color: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{s.full_name[0]}</div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{s.full_name} <span style={{ color: T.muted, fontWeight: 400 }}>({s.class?.name})</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ background: T.bg, padding: 12, borderRadius: 8, fontSize: 14, fontWeight: 700, color: T.primary, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Patient: {selectedStudent.full_name}</span>
                    <button onClick={() => setSelectedStudent(null)} style={{ background: 'none', border: 'none', color: T.primary, fontSize: 11, cursor: 'pointer', fontWeight: 700 }}>Change</button>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>Symptoms *</label>
                    <textarea required value={visitForm.symptoms} onChange={e => setVisitForm({...visitForm, symptoms: e.target.value})} rows={2} style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${T.border}`, outline: 'none', fontFamily: 'inherit' }} placeholder="Fever, headache, stomach pain..." />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>Treatment / Action</label>
                    <textarea value={visitForm.treatment} onChange={e => setVisitForm({...visitForm, treatment: e.target.value})} rows={2} style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${T.border}`, outline: 'none', fontFamily: 'inherit' }} placeholder="Rest in sick bay, applied bandage..." />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>Medication Given</label>
                    <input type="text" value={visitForm.medication_given} onChange={e => setVisitForm({...visitForm, medication_given: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${T.border}`, outline: 'none', fontFamily: 'inherit' }} placeholder="e.g. Paracetamol 500mg" />
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', background: `${T.orange}10`, padding: 12, borderRadius: 8, border: `1px solid ${T.orange}30` }}>
                    <input type="checkbox" checked={visitForm.parent_notified} onChange={e => setVisitForm({...visitForm, parent_notified: e.target.checked})} style={{ width: 16, height: 16 }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: T.orange }}>Send SMS/Push Alert to Parents</span>
                  </label>

                  <button disabled={saving} type="submit" style={{ width: '100%', background: T.primary, color: '#fff', border: 'none', padding: 14, borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 8 }}>
                    {saving ? 'Saving...' : 'Save Visit Record'}
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  )
}
