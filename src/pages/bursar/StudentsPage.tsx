// src/pages/bursar/StudentsPage.tsx
// Bursar's Student Management — Scholarship & Arrears Management
import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import { useClasses } from '../../hooks/useClasses'
import { supabase } from '../../lib/supabase'
import { scholarshipService } from '../../services/bursar.service'
import toast from 'react-hot-toast'
import Modal from '../../components/ui/Modal'
import {
  Users, Search, GraduationCap, AlertTriangle, CheckCircle2,
  Award, Filter, Edit3, Plus, Minus, ChevronDown, ChevronUp, Coffee
} from 'lucide-react'

const GHS = (n: number) => `GH₵ ${Number(n).toLocaleString('en-GH', { minimumFractionDigits: 2 })}`

export default function BursarStudentsPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const schoolId = user?.school_id ?? ''
  const { data: classes = [] } = useClasses()
  const [searchQ, setSearchQ] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [scholarshipFilter, setScholarshipFilter] = useState<'all' | 'scholarship' | 'arrears'>('all')
  const [sortField, setSortField] = useState<'name' | 'arrears' | 'scholarship'>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  // Modals
  const [showSchModal, setShowSchModal] = useState(false)
  const [showArrModal, setShowArrModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)

  // Scholarship form
  const [schType, setSchType] = useState('none')
  const [schPct, setSchPct] = useState('')

  // Arrears form
  const [arrAction, setArrAction] = useState<'set' | 'add'>('add')
  const [arrAmt, setArrAmt] = useState('')
  const [arrReason, setArrReason] = useState('')

  // Daily Fee Config
  const [showDailyFeeModal, setShowDailyFeeModal] = useState(false)
  const [dailyFeeMode, setDailyFeeMode] = useState<'all' | 'feeding' | 'none'>('all')

  // Fetch students
  const { data: students = [], isLoading } = useQuery({
    queryKey: ['bursar-students', schoolId],
    queryFn: async () => {
      const { data } = await supabase
        .from('students')
        .select('id, full_name, student_id, scholarship_type, scholarship_percentage, fees_arrears, daily_fee_mode, gender, guardian_name, guardian_phone, class:classes(id,name)')
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .order('full_name')
      return data ?? []
    },
    enabled: !!schoolId,
  })

  // Scholarship mutation
  const awardMutation = useMutation({
    mutationFn: () => {
      const pct = schType === 'full' ? 100 : schType === 'none' ? 0 : Number(schPct)
      return scholarshipService.updateStudent(selectedStudent.id, schType, pct)
    },
    onSuccess: () => {
      toast.success('Scholarship updated')
      qc.invalidateQueries({ queryKey: ['bursar-students'] })
      qc.invalidateQueries({ queryKey: ['students-all'] })
      qc.invalidateQueries({ queryKey: ['students-class-debt'] })
      closeSchModal()
    },
    onError: (e: any) => toast.error(e.message),
  })

  // Arrears mutation
  const arrearsMutation = useMutation({
    mutationFn: async () => {
      const currentArrears = Number(selectedStudent.fees_arrears || 0)
      const amount = Number(arrAmt)
      const newArrears = arrAction === 'set' ? amount : currentArrears + amount
      return scholarshipService.updateStudentArrears(selectedStudent.id, Math.max(0, newArrears))
    },
    onSuccess: () => {
      toast.success(arrAction === 'set' ? 'Arrears updated' : 'Additional arrears added')
      qc.invalidateQueries({ queryKey: ['bursar-students'] })
      qc.invalidateQueries({ queryKey: ['students-all'] })
      qc.invalidateQueries({ queryKey: ['students-class-debt'] })
      closeArrModal()
    },
    onError: (e: any) => toast.error(e.message),
  })

  // Daily Fee mutation
  const dailyFeeMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('students').update({ daily_fee_mode: dailyFeeMode }).eq('id', selectedStudent.id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Daily Fee Rule updated')
      qc.invalidateQueries({ queryKey: ['bursar-students'] })
      qc.invalidateQueries({ queryKey: ['students-class-debt'] })
      closeDailyFeeModal()
    },
    onError: (e: any) => toast.error(e.message),
  })

  function openSchModal(student: any) {
    setSelectedStudent(student)
    setSchType(student.scholarship_type || 'none')
    setSchPct(student.scholarship_percentage ? String(student.scholarship_percentage) : '')
    setShowSchModal(true)
  }
  function closeSchModal() {
    setShowSchModal(false)
    setSelectedStudent(null)
    setSchType('none')
    setSchPct('')
  }
  function openArrModal(student: any) {
    setSelectedStudent(student)
    setArrAction('add')
    setArrAmt('')
    setArrReason('')
    setShowArrModal(true)
  }
  function closeArrModal() {
    setShowArrModal(false)
    setSelectedStudent(null)
    setArrAmt('')
    setArrReason('')
  }
  function openDailyFeeModal(student: any) {
    setSelectedStudent(student)
    setDailyFeeMode(student.daily_fee_mode || 'all')
    setShowDailyFeeModal(true)
  }
  function closeDailyFeeModal() {
    setShowDailyFeeModal(false)
    setSelectedStudent(null)
  }

  // Filter & sort
  const filtered = useMemo(() => {
    let list = (students as any[]).filter(s => {
      if (classFilter && (s.class as any)?.id !== classFilter) return false
      if (scholarshipFilter === 'scholarship' && (!s.scholarship_type || s.scholarship_type === 'none')) return false
      if (scholarshipFilter === 'arrears' && Number(s.fees_arrears || 0) <= 0) return false
      if (searchQ) {
        const q = searchQ.toLowerCase()
        if (!s.full_name.toLowerCase().includes(q) && !(s.student_id || '').toLowerCase().includes(q)) return false
      }
      return true
    })
    list.sort((a, b) => {
      let v = 0
      if (sortField === 'name') v = a.full_name.localeCompare(b.full_name)
      else if (sortField === 'arrears') v = Number(a.fees_arrears || 0) - Number(b.fees_arrears || 0)
      else if (sortField === 'scholarship') v = Number(a.scholarship_percentage || 0) - Number(b.scholarship_percentage || 0)
      return sortDir === 'desc' ? -v : v
    })
    return list
  }, [students, classFilter, scholarshipFilter, searchQ, sortField, sortDir])

  const totalArrears = (students as any[]).reduce((s, r) => s + Number(r.fees_arrears || 0), 0)
  const scholarshipCount = (students as any[]).filter(s => s.scholarship_type && s.scholarship_type !== 'none').length
  const arrearsCount = (students as any[]).filter(s => Number(s.fees_arrears || 0) > 0).length

  function toggleSort(field: typeof sortField) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const SortIcon = ({ field }: { field: typeof sortField }) => sortField === field
    ? (sortDir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />)
    : <ChevronDown size={11} style={{ opacity: 0.3 }} />

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');
        @keyframes _bst_fi { from{opacity:0} to{opacity:1} }
        @keyframes _bst_fu { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .bst-row { transition: background .12s; }
        .bst-row:hover { background: #faf5ff !important; }
        .bst-btn { transition: all .15s; cursor: pointer; border: none; display: inline-flex; align-items: center; gap: 5px; font-weight: 600; font-size: 11px; padding: 5px 10px; border-radius: 7px; font-family: "DM Sans",sans-serif; }
        .bst-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,.12); }
      `}</style>

      <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif', animation: '_bst_fi .4s ease' }}>

        {/* Header */}
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>Student Financial Management</h1>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 3 }}>Manage scholarships, arrears, and student financial records</p>
          </div>
        </div>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 22 }}>
          {[
            { label: 'Total Students', value: String((students as any[]).length), icon: Users, color: '#7c3aed', bg: '#f5f3ff' },
            { label: 'Scholarship Students', value: String(scholarshipCount), icon: GraduationCap, color: '#059669', bg: '#ecfdf5' },
            { label: 'Students with Arrears', value: String(arrearsCount), icon: AlertTriangle, color: '#dc2626', bg: '#fef2f2' },
            { label: 'Total Outstanding Arrears', value: GHS(totalArrears), icon: AlertTriangle, color: '#b91c1c', bg: '#fef2f2' },
          ].map((c, i) => (
            <div key={c.label} style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', border: '1.5px solid #f0eefe', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', animation: `_bst_fu .35s ease ${i * 0.06}s both` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <c.icon size={18} color={c.color} strokeWidth={2.5} />
                </div>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: c.color, fontFamily: '"Playfair Display",serif' }}>{c.value}</div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4, fontWeight: 600 }}>{c.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '14px 18px', border: '1.5px solid #f0eefe', marginBottom: 18, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b7280', fontSize: 13 }}><Filter size={14} /> Filters:</div>
          <select value={classFilter} onChange={e => setClassFilter(e.target.value)} style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', fontFamily: '"DM Sans",sans-serif' }}>
            <option value="">All Classes</option>
            {(classes as any[]).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div style={{ display: 'flex', background: '#f5f3ff', borderRadius: 9, padding: 3, gap: 2 }}>
            {([['all', 'All'], ['scholarship', '🎓 Scholarship'], ['arrears', '⚠️ Arrears']] as const).map(([f, l]) => (
              <button key={f} onClick={() => setScholarshipFilter(f as any)} style={{ padding: '6px 12px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: scholarshipFilter === f ? '#6d28d9' : 'transparent', color: scholarshipFilter === f ? '#fff' : '#6b7280', fontFamily: '"DM Sans",sans-serif' }}>
                {l}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fafafa', marginLeft: 'auto' }}>
            <Search size={12} color="#9ca3af" />
            <input placeholder="Search student..." value={searchQ} onChange={e => setSearchQ(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: 12, background: 'transparent', fontFamily: '"DM Sans",sans-serif', width: 150 }} />
          </div>
        </div>

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: 18, border: '1.5px solid #f0eefe', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          {isLoading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Loading students…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
              {(students as any[]).length === 0 ? 'No students found' : 'No students match this filter'}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg,#faf5ff,#f5f3ff)' }}>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '.06em', cursor: 'pointer' }} onClick={() => toggleSort('name')}>
                      Student <SortIcon field="name" />
                    </th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '.06em' }}>ID</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '.06em' }}>Class</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '.06em' }}>Guardian</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '.06em', cursor: 'pointer' }} onClick={() => toggleSort('scholarship')}>
                      Scholarship <SortIcon field="scholarship" />
                    </th>
                    <th style={{ padding: '12px 14px', textAlign: 'right', fontSize: 10, fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '.06em', cursor: 'pointer' }} onClick={() => toggleSort('arrears')}>
                      Arrears <SortIcon field="arrears" />
                    </th>
                    <th style={{ padding: '12px 14px', textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '.06em' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s: any) => {
                    const arrears = Number(s.fees_arrears || 0)
                    const hasScholarship = s.scholarship_type && s.scholarship_type !== 'none'
                    return (
                      <tr key={s.id} className="bst-row" style={{ borderBottom: '1px solid #faf5ff' }}>
                        <td style={{ padding: '11px 14px' }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{s.full_name}</div>
                        </td>
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{ fontSize: 11, fontFamily: 'monospace', background: '#f5f3ff', color: '#6d28d9', padding: '2px 7px', borderRadius: 5 }}>{s.student_id ?? '—'}</span>
                        </td>
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{ fontSize: 11, background: '#ede9fe', color: '#5b21b6', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>{(s.class as any)?.name ?? '—'}</span>
                        </td>
                        <td style={{ padding: '11px 14px', fontSize: 12, color: '#6b7280' }}>
                          {s.guardian_name ?? '—'}
                          {s.guardian_phone && <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1 }}>{s.guardian_phone}</div>}
                        </td>
                        <td style={{ padding: '11px 14px' }}>
                          {hasScholarship ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, background: '#f0fdf4', color: '#16a34a', padding: '3px 10px', borderRadius: 99 }}>
                              <GraduationCap size={11} />
                              {s.scholarship_type === 'full' ? 'Full (100%)' : `${s.scholarship_percentage}%`}
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, color: '#9ca3af' }}>None</span>
                          )}
                        </td>
                        <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                          {arrears > 0 ? (
                            <span style={{ fontSize: 13, fontWeight: 800, color: '#dc2626' }}>{GHS(arrears)}</span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#16a34a', fontWeight: 600 }}>
                              <CheckCircle2 size={12} /> Clear
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                            <button className="bst-btn" onClick={() => openSchModal(s)} style={{ background: '#f0fdf4', color: '#16a34a' }} title="Manage Scholarship">
                              <Award size={12} /> Sch.
                            </button>
                            <button className="bst-btn" onClick={() => openDailyFeeModal(s)} style={{ background: '#fef3c7', color: '#d97706' }} title="Manage Daily Fees Exemption">
                              <Coffee size={12} /> Daily Rate
                            </button>
                            <button className="bst-btn" onClick={() => openArrModal(s)} style={{ background: '#fef2f2', color: '#dc2626' }} title="Manage Arrears">
                              <Edit3 size={12} /> Arr.
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#faf5ff', borderTop: '2px solid #ede9fe' }}>
                    <td colSpan={5} style={{ padding: '12px 14px', fontSize: 12, fontWeight: 800, color: '#6d28d9' }}>
                      TOTALS ({filtered.length} students · {filtered.filter(s => s.scholarship_type && s.scholarship_type !== 'none').length} scholarships)
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: 14, fontWeight: 900, color: '#dc2626' }}>
                      {GHS(filtered.reduce((sum: number, s: any) => sum + Number(s.fees_arrears || 0), 0))}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Scholarship Modal */}
      <Modal open={showSchModal} onClose={closeSchModal} title="Manage Scholarship">
        {selectedStudent && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: '14px 16px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>{selectedStudent.full_name}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{(selectedStudent.class as any)?.name ?? '—'} · {selectedStudent.student_id ?? 'No ID'}</div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Scholarship Type</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {(['none', 'partial', 'full'] as const).map(t => (
                  <button key={t} onClick={() => setSchType(t)} style={{ flex: 1, padding: '12px', borderRadius: 10, border: schType === t ? '2px solid #16a34a' : '1.5px solid #e5e7eb', background: schType === t ? '#f0fdf4' : '#fff', color: schType === t ? '#16a34a' : '#374151', fontWeight: 700, fontSize: 14, cursor: 'pointer', textTransform: 'capitalize', fontFamily: '"DM Sans",sans-serif', transition: 'all .15s' }}>
                    {t === 'none' ? '❌ None' : t === 'partial' ? '📊 Partial' : '🎓 Full'}
                  </button>
                ))}
              </div>
            </div>

            {schType === 'partial' && (
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Discount Percentage (%)</label>
                <input type="number" min="1" max="99" value={schPct} onChange={e => setSchPct(e.target.value)} placeholder="e.g. 50" style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 15, fontWeight: 600, outline: 'none', boxSizing: 'border-box' }} />
              </div>
            )}

            <div style={{ marginTop: 8, paddingTop: 16, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={closeSchModal} style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: '"DM Sans",sans-serif' }}>Cancel</button>
              <button
                onClick={() => awardMutation.mutate()}
                disabled={awardMutation.isPending || (schType === 'partial' && !schPct)}
                style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: '#16a34a', color: '#fff', fontWeight: 700, fontSize: 14, cursor: (awardMutation.isPending || (schType === 'partial' && !schPct)) ? 'not-allowed' : 'pointer', opacity: (awardMutation.isPending || (schType === 'partial' && !schPct)) ? 0.6 : 1, fontFamily: '"DM Sans",sans-serif' }}
              >
                {awardMutation.isPending ? 'Saving...' : 'Save Scholarship'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Arrears Modal */}
      <Modal open={showArrModal} onClose={closeArrModal} title="Manage Student Arrears">
        {selectedStudent && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: '14px 16px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>{selectedStudent.full_name}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{(selectedStudent.class as any)?.name ?? '—'} · {selectedStudent.student_id ?? 'No ID'}</div>
              <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 8, background: Number(selectedStudent.fees_arrears || 0) > 0 ? '#fef2f2' : '#f0fdf4', border: `1px solid ${Number(selectedStudent.fees_arrears || 0) > 0 ? '#fecaca' : '#bbf7d0'}` }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: Number(selectedStudent.fees_arrears || 0) > 0 ? '#dc2626' : '#16a34a' }}>
                  Current Arrears: {GHS(Number(selectedStudent.fees_arrears || 0))}
                </span>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Action</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setArrAction('add')} style={{ flex: 1, padding: '12px', borderRadius: 10, border: arrAction === 'add' ? '2px solid #dc2626' : '1.5px solid #e5e7eb', background: arrAction === 'add' ? '#fef2f2' : '#fff', color: arrAction === 'add' ? '#dc2626' : '#374151', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: '"DM Sans",sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all .15s' }}>
                  <Plus size={14} /> Add Additional Arrears
                </button>
                <button onClick={() => setArrAction('set')} style={{ flex: 1, padding: '12px', borderRadius: 10, border: arrAction === 'set' ? '2px solid #6d28d9' : '1.5px solid #e5e7eb', background: arrAction === 'set' ? '#f5f3ff' : '#fff', color: arrAction === 'set' ? '#6d28d9' : '#374151', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: '"DM Sans",sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all .15s' }}>
                  <Edit3 size={14} /> Set Exact Amount
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                {arrAction === 'add' ? 'Amount to Add (GH₵)' : 'New Arrears Amount (GH₵)'}
              </label>
              <input type="number" min="0" step="0.01" value={arrAmt} onChange={e => setArrAmt(e.target.value)} placeholder="0.00" style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 15, fontWeight: 600, outline: 'none', boxSizing: 'border-box' }} />
              {arrAction === 'add' && arrAmt && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#374151', fontWeight: 600, padding: '8px 12px', background: '#fef2f2', borderRadius: 8 }}>
                  New total: {GHS(Number(selectedStudent.fees_arrears || 0) + Number(arrAmt))}
                </div>
              )}
              {arrAction === 'set' && (
                <p style={{ fontSize: 11, color: '#6b7280', marginTop: 6 }}>This will replace the current arrears balance. Set to 0 to clear all arrears.</p>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Reason (optional)</label>
              <input value={arrReason} onChange={e => setArrReason(e.target.value)} placeholder="e.g. Carried forward from 2024 Term 2" style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginTop: 8, paddingTop: 16, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={closeArrModal} style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: '"DM Sans",sans-serif' }}>Cancel</button>
              <button
                onClick={() => arrearsMutation.mutate()}
                disabled={arrearsMutation.isPending || !arrAmt}
                style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: '#dc2626', color: '#fff', fontWeight: 700, fontSize: 14, cursor: (arrearsMutation.isPending || !arrAmt) ? 'not-allowed' : 'pointer', opacity: (arrearsMutation.isPending || !arrAmt) ? 0.6 : 1, fontFamily: '"DM Sans",sans-serif' }}
              >
                {arrearsMutation.isPending ? 'Saving...' : arrAction === 'add' ? 'Add Arrears' : 'Set Arrears'}
              </button>
            </div>
          </div>
        )}
      </Modal>
      {/* Daily Fee Mode Modal */}
      <Modal open={showDailyFeeModal} onClose={closeDailyFeeModal} title="Configure Daily Fees Rule">
        {selectedStudent && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: '14px 16px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>{selectedStudent.full_name}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{(selectedStudent.class as any)?.name ?? '—'}</div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Daily Fee Charging Mode</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(['all', 'feeding', 'none'] as const).map(t => (
                  <button key={t} onClick={() => setDailyFeeMode(t)} style={{ padding: '12px 16px', textAlign: 'left', borderRadius: 10, border: dailyFeeMode === t ? '2px solid #d97706' : '1.5px solid #e5e7eb', background: dailyFeeMode === t ? '#fffbeb' : '#fff', color: dailyFeeMode === t ? '#b45309' : '#374151', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: '"DM Sans",sans-serif', transition: 'all .15s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Coffee size={16} />
                      {t === 'all' ? 'Standard (Feeding & Studies)' : t === 'feeding' ? 'Feeding Fee Only' : 'Fully Exempt (GH₵ 0 Daily)'}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 500, color: dailyFeeMode === t ? '#d97706' : '#9ca3af', marginTop: 4, paddingLeft: 24 }}>
                      {t === 'all' ? 'Charges regular daily feeding and studies when marked present.' : t === 'feeding' ? 'Never charged for studies even if present; only expected to pay feeding.' : 'Completely exempt from daily fees. No deficit will accrue when present.'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 8, paddingTop: 16, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={closeDailyFeeModal} style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: '"DM Sans",sans-serif' }}>Cancel</button>
              <button
                onClick={() => dailyFeeMutation.mutate()}
                disabled={dailyFeeMutation.isPending}
                style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: '#d97706', color: '#fff', fontWeight: 700, fontSize: 14, cursor: dailyFeeMutation.isPending ? 'not-allowed' : 'pointer', opacity: dailyFeeMutation.isPending ? 0.6 : 1, fontFamily: '"DM Sans",sans-serif' }}
              >
                {dailyFeeMutation.isPending ? 'Saving...' : 'Save Exemption Rule'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
