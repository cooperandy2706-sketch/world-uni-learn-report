import { useStuckLoadingReload } from '../../hooks/useStuckLoadingReload'
// src/pages/admin/AttendancePage.tsx
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { useClasses } from '../../hooks/useClasses'
import { useAuth } from '../../hooks/useAuth'
import { Phone, RefreshCw } from 'lucide-react'
import { useAutoRefresh } from "../../hooks/useAutoRefresh";

type Tab = 'students' | 'teachers' | 'absent'

interface StudentRow {
  id: string; status: string; student_name: string
  student_id: string; teacher_name: string; source: 'register' | 'gate'
}
interface TeacherRow {
  teacher_id: string; teacher_name: string; photo_url: string
  time_in: string | null; time_out: string | null; on_campus: boolean; left_mid_day: boolean
}
interface AbsentRow {
  id: string; full_name: string; student_id: string
  guardian_name: string; guardian_phone: string
}

function StatusBadge({ status }: { status: string }) {
  const map: any = {
    present: ['#f0fdf4', '#16a34a'],
    absent:  ['#fef2f2', '#dc2626'],
    late:    ['#fffbeb', '#d97706'],
    excused: ['#eff6ff', '#2563eb'],
  }
  const [bg, color] = map[status] ?? ['#f1f5f9', '#64748b']
  return <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 99, background: bg, color }}>{status.toUpperCase()}</span>
}

function TabBtn({ label, active, onClick, count }: any) {
  return (
    <button onClick={onClick} style={{
      padding: '9px 16px', borderRadius: 10, border: 'none', fontFamily: '"DM Sans",sans-serif',
      fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all .15s',
      background: active ? '#0f172a' : '#f1f5f9', color: active ? '#fff' : '#475569',
      display: 'flex', alignItems: 'center', gap: 6,
    }}>
      {label}
      {count !== undefined && (
        <span style={{ fontSize: 11, fontWeight: 800, padding: '1px 7px', borderRadius: 99, background: active ? 'rgba(255,255,255,0.2)' : '#e2e8f0', color: active ? '#fff' : '#64748b' }}>{count}</span>
      )}
    </button>
  )
}

export default function AdminAttendancePage() {
    useAutoRefresh(loadStudents);
  const { user } = useAuth()
  const { data: classes = [] } = useClasses()
  const schoolId = user?.school_id ?? ''

  const [tab, setTab] = useState<Tab>('students')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [selectedClass, setSelectedClass] = useState('')
  const [loading, setLoading] = useState(false)
  useStuckLoadingReload(loading)
  const [search, setSearch] = useState('')

  const [studentRows, setStudentRows] = useState<StudentRow[]>([])
  const [teacherRows, setTeacherRows] = useState<TeacherRow[]>([])
  const [absentRows, setAbsentRows] = useState<AbsentRow[]>([])

  useEffect(() => { if (date && schoolId) loadTeachers() }, [date, schoolId])
  useEffect(() => { if (date && selectedClass && schoolId) { loadStudents(); loadAbsent() } }, [date, selectedClass, schoolId])

  // ── STUDENTS (register + gate merged) ──────────────────────
  async function loadStudents() {
    setLoading(true)
    try {
      const { data: regData } = await supabase
        .from('attendance_records')
        .select('id, status, date, student:students(id, full_name, student_id), teacher:teachers(user:users(full_name))')
        .eq('school_id', schoolId).eq('class_id', selectedClass).eq('date', date)

      const registerRows: StudentRow[] = (regData ?? []).map((r: any) => ({
        id: r.id, status: r.status,
        student_name: r.student?.full_name ?? 'Unknown',
        student_id: r.student?.student_id ?? '',
        teacher_name: r.teacher?.user?.full_name ?? 'Teacher',
        source: 'register', _dbId: r.student?.id,
      } as any))

      const { data: classStudents } = await supabase
        .from('students').select('id, full_name, student_id').eq('class_id', selectedClass).eq('school_id', schoolId)
      const studentIds = (classStudents ?? []).map((s: any) => s.id)

      let gateRows: StudentRow[] = []
      if (studentIds.length > 0) {
        const { data: gateData } = await supabase
          .from('gate_scans')
          .select('id, person_db_id, person_name, direction, status, scan_time')
          .eq('school_id', schoolId).eq('scan_date', date)
          .eq('person_type', 'student').in('person_db_id', studentIds)
          .order('scan_time', { ascending: true })

        const seen = new Set<string>()
        for (const gs of (gateData ?? [])) {
          if (gs.direction === 'in' && !seen.has(gs.person_db_id)) {
            seen.add(gs.person_db_id)
            const cs: any = (classStudents ?? []).find((s: any) => s.id === gs.person_db_id)
            gateRows.push({
              id: `gate-${gs.id}`, status: gs.status === 'late' ? 'late' : 'present',
              student_name: gs.person_name, student_id: cs?.student_id ?? '',
              teacher_name: 'Gate Scanner', source: 'gate', _dbId: gs.person_db_id,
            } as any)
          }
        }
        const regIds = new Set(registerRows.map((r: any) => r._dbId))
        gateRows = gateRows.filter((g: any) => !regIds.has(g._dbId))
      }

      const merged = [...registerRows, ...gateRows]
      merged.sort((a, b) => a.student_name.localeCompare(b.student_name))
      setStudentRows(merged)
    } catch (e) { toast.error('Failed to load students') }
    setLoading(false)
  }

  // ── TEACHERS ───────────────────────────────────────────────
  async function loadTeachers() {
    try {
      const { data: gateData } = await supabase
        .from('gate_scans')
        .select('person_db_id, person_name, photo_url, direction, scan_time')
        .eq('school_id', schoolId).eq('scan_date', date)
        .eq('person_type', 'teacher')
        .order('scan_time', { ascending: true })

      const byTeacher: Record<string, any[]> = {}
      for (const gs of (gateData ?? [])) {
        if (!byTeacher[gs.person_db_id]) byTeacher[gs.person_db_id] = []
        byTeacher[gs.person_db_id].push(gs)
      }

      const rows: TeacherRow[] = Object.entries(byTeacher).map(([tid, scans]) => {
        const firstIn = scans.find(s => s.direction === 'in')
        const lastScan = scans[scans.length - 1]
        const hasOut = scans.some(s => s.direction === 'out')
        const lastIsOut = lastScan?.direction === 'out'
        return {
          teacher_id: tid,
          teacher_name: scans[0].person_name,
          photo_url: scans[0].photo_url ?? '',
          time_in: firstIn?.scan_time ?? null,
          time_out: lastIsOut ? lastScan.scan_time : null,
          on_campus: !lastIsOut,
          left_mid_day: hasOut && firstIn !== undefined,
        }
      })
      rows.sort((a, b) => a.teacher_name.localeCompare(b.teacher_name))
      setTeacherRows(rows)
    } catch (e: any) { console.error('Teacher load error:', e); toast.error('Failed to load teacher attendance data') }
  }

  // ── ABSENT STUDENTS ────────────────────────────────────────
  async function loadAbsent() {
    try {
      const { data: classStudents } = await supabase
        .from('students')
        .select('id, full_name, student_id, guardian_name, guardian_phone')
        .eq('class_id', selectedClass).eq('school_id', user!.school_id).eq('is_active', true)

      const studentIds = (classStudents ?? []).map((s: any) => s.id)
      if (studentIds.length === 0) { setAbsentRows([]); return }

      const { data: regData } = await supabase
        .from('attendance_records').select('student_id')
        .eq('school_id', schoolId).eq('class_id', selectedClass).eq('date', date)

      const { data: gateData } = await supabase
        .from('gate_scans').select('person_db_id')
        .eq('school_id', schoolId).eq('scan_date', date)
        .eq('person_type', 'student').eq('direction', 'in')
        .in('person_db_id', studentIds)

      const presentIds = new Set([
        ...(regData ?? []).map((r: any) => r.student_id),
        ...(gateData ?? []).map((g: any) => g.person_db_id),
      ])

      const absent: AbsentRow[] = (classStudents ?? [])
        .filter((s: any) => !presentIds.has(s.id))
        .map((s: any) => ({
          id: s.id, full_name: s.full_name,
          student_id: s.student_id ?? '',
          guardian_name: s.guardian_name ?? '',
          guardian_phone: s.guardian_phone ?? '',
        }))
      absent.sort((a, b) => a.full_name.localeCompare(b.full_name))
      setAbsentRows(absent)
    } catch (e: any) { console.error('Absent load error:', e); toast.error('Failed to load student absentee data') }
  }

  const filterStr = search.toLowerCase()
  const filteredStudents = studentRows.filter(r =>
    r.student_name.toLowerCase().includes(filterStr) || r.student_id.toLowerCase().includes(filterStr))
  const filteredTeachers = teacherRows.filter(r => r.teacher_name.toLowerCase().includes(filterStr))
  const filteredAbsent = absentRows.filter(r =>
    r.full_name.toLowerCase().includes(filterStr) || r.guardian_name.toLowerCase().includes(filterStr))

  function fmtTime(iso: string | null) {
    if (!iso) return '—'
    try { return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) } catch { return '—' }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _spin { to{transform:rotate(360deg)} }
        @keyframes _fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .att-filters { display:flex; gap:12px; flex-wrap:wrap; align-items:flex-end; }
        @media(max-width:640px){
          .att-filters { flex-direction:column; align-items:stretch; }
          .att-tab-row { gap:6px !important; }
          .att-tab-row button { font-size:12px !important; padding:8px 10px !important; }
          .att-table { display:none !important; }
          .att-cards { display:flex !important; flex-direction:column; gap:10px; }
        }
      `}</style>
      <div style={{ fontFamily: '"DM Sans",sans-serif', paddingBottom: 80 }}>

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 24, fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>Attendance Monitoring</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>Gate scans, teacher register, and absence tracking.</p>
        </div>

        {/* Tabs */}
        <div className="att-tab-row" style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          <TabBtn label="👨‍🎓 Students" active={tab === 'students'} onClick={() => setTab('students')} count={studentRows.length} />
          <TabBtn label="👩‍🏫 Teachers" active={tab === 'teachers'} onClick={() => setTab('teachers')} count={teacherRows.length} />
          <TabBtn label="❌ Absent" active={tab === 'absent'} onClick={() => setTab('absent')} count={absentRows.length} />
        </div>

        {/* Filters */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: '16px', border: '1.5px solid #f0eefe', marginBottom: 18 }}>
          <div className="att-filters">
            <div style={{ flex: 1, minWidth: 130 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.05em' }}>Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid var(--border-color)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            {tab !== 'teachers' && (
              <div style={{ flex: '1 1 180px' }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.05em' }}>Class</label>
                <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid var(--border-color)', fontSize: 13, outline: 'none', background: 'var(--bg-card)' }}>
                  <option value="">Choose class…</option>
                  {(classes as any[]).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
            <div style={{ flex: '1 1 160px' }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.05em' }}>Search</label>
              <input placeholder="Name or ID…" value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid var(--border-color)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <button onClick={() => { if (date && selectedClass) { loadStudents(); loadAbsent() }; loadTeachers() }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 9, border: 'none', background: '#0f172a', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
              <RefreshCw size={14} style={loading ? { animation: '_spin 0.7s linear infinite' } : {}} /> Refresh
            </button>
          </div>
        </div>

        {/* ── STUDENTS TAB ── */}
        {tab === 'students' && (
          <>
            {!selectedClass && <EmptyPrompt icon="📋" title="Select a class" sub="Choose a class to view student attendance." />}
            {selectedClass && !loading && filteredStudents.length === 0 && (
              <EmptyPrompt icon="⏳" title="No attendance for this date" sub="No gate scans or register entries found for this class." />
            )}
            {selectedClass && filteredStudents.length > 0 && (
              <>
                <div className="att-table" style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1.5px solid #f0eefe', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#faf5ff', borderBottom: '1.5px solid #ede9fe' }}>
                        {['Student', 'Status', 'Source', 'Recorded By'].map(h => (
                          <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '.05em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((r, i) => (
                        <tr key={r.id} style={{ borderBottom: i < filteredStudents.length - 1 ? '1px solid #fafafa' : 'none' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>{r.student_name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{r.student_id}</div>
                          </td>
                          <td style={{ padding: '12px 16px' }}><StatusBadge status={r.status} /></td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: (r as any).source === 'gate' ? '#ecfdf5' : '#f5f3ff', color: (r as any).source === 'gate' ? '#059669' : '#7c3aed' }}>
                              {(r as any).source === 'gate' ? '🔒 Gate' : '📋 Register'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)' }}>{r.teacher_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="att-cards" style={{ display: 'none' }}>
                  {filteredStudents.map(r => (
                    <div key={r.id} style={{ background: 'var(--bg-card)', borderRadius: 12, padding: '14px', border: `1.5px solid ${(r as any).source === 'gate' ? '#bbf7d0' : '#ede9fe'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>{r.student_name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 2 }}>{r.student_id}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                          <StatusBadge status={r.status} />
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: (r as any).source === 'gate' ? '#ecfdf5' : '#f5f3ff', color: (r as any).source === 'gate' ? '#059669' : '#7c3aed' }}>
                            {(r as any).source === 'gate' ? '🔒 Gate' : '📋 Register'}
                          </span>
                        </div>
                      </div>
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #f9fafb', fontSize: 11, color: 'var(--text-muted)' }}>By: {r.teacher_name}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* ── TEACHERS TAB ── */}
        {tab === 'teachers' && (
          <>
            {teacherRows.length === 0 && <EmptyPrompt icon="👩‍🏫" title="No teacher scans today" sub="No teachers have scanned at the gate today." />}
            {teacherRows.length > 0 && (
              <>
                {/* Summary pills */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                  {[
                    { label: 'On Campus', value: teacherRows.filter(t => t.on_campus).length, color: '#059669', bg: '#dcfce7' },
                    { label: 'Left Campus', value: teacherRows.filter(t => !t.on_campus && t.time_out).length, color: '#dc2626', bg: '#fee2e2' },
                    { label: 'Left Mid-Day', value: teacherRows.filter(t => t.left_mid_day && t.on_campus).length, color: '#d97706', bg: '#fef3c7' },
                  ].map(({ label, value, color, bg }) => (
                    <div key={label} style={{ background: bg, borderRadius: 12, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 20, fontWeight: 900, color }}>{value}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color }}>{label}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {filteredTeachers.map(t => (
                    <div key={t.teacher_id} style={{ background: 'var(--bg-card)', borderRadius: 14, border: `1.5px solid ${t.left_mid_day && !t.on_campus ? '#fca5a5' : t.left_mid_day ? '#fed7aa' : '#f0eefe'}`, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: t.on_campus ? '#dcfce7' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: t.on_campus ? '#059669' : '#dc2626', flexShrink: 0 }}>
                        {t.teacher_name.charAt(0)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>{t.teacher_name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          In: {fmtTime(t.time_in)}
                          {t.time_out && <> · Out: <span style={{ color: '#dc2626', fontWeight: 700 }}>{fmtTime(t.time_out)}</span></>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: t.on_campus ? '#dcfce7' : '#fee2e2', color: t.on_campus ? '#059669' : '#dc2626' }}>
                          {t.on_campus ? '✓ On Campus' : '↑ Left Campus'}
                        </span>
                        {t.left_mid_day && t.on_campus && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: '#fef3c7', color: '#d97706' }}>⚠ Left Mid-Day</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* ── ABSENT TAB ── */}
        {tab === 'absent' && (
          <>
            {!selectedClass && <EmptyPrompt icon="❌" title="Select a class" sub="Choose a class to see absent students." />}
            {selectedClass && absentRows.length === 0 && <EmptyPrompt icon="🎉" title="Full attendance!" sub="No absent students found for this class today." />}
            {selectedClass && filteredAbsent.length > 0 && (
              <>
                {/* Summary + Bulk Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, padding: '10px 14px', background: '#fef2f2', borderRadius: 10, border: '1px solid #fca5a5', marginBottom: 14 }}>
                  <span style={{ fontSize: 13, color: '#dc2626', fontWeight: 600 }}>
                    ❌ {absentRows.length} student{absentRows.length !== 1 ? 's' : ''} absent today
                  </span>
                  <button
                    onClick={() => {
                      const withPhone = filteredAbsent.filter(s => s.guardian_phone)
                      if (withPhone.length === 0) { toast.error('No guardians have phone numbers recorded'); return }
                      // Open each WhatsApp in sequence (first one)
                      withPhone.forEach((s, i) => {
                        const msg = encodeURIComponent(`Hello ${s.guardian_name || 'Guardian'}, this is a message from the school. ${s.full_name} was marked absent today (${date}). Please contact the school office if this was unexpected.`)
                        setTimeout(() => window.open(`https://wa.me/${s.guardian_phone?.replace(/\D/g, '')}?text=${msg}`, '_blank'), i * 600)
                      })
                      toast.success(`Opening WhatsApp for ${withPhone.length} guardian${withPhone.length !== 1 ? 's' : ''}…`)
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, border: 'none', background: '#25D366', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                  >
                    💬 Notify All via WhatsApp ({filteredAbsent.filter(s => s.guardian_phone).length})
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {filteredAbsent.map(s => (
                    <div key={s.id} style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1.5px solid #fca5a5', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 900, color: '#dc2626', flexShrink: 0 }}>
                        {s.full_name.charAt(0)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>{s.full_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{s.student_id}</div>
                        {s.guardian_name && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>👤 {s.guardian_name}</div>}
                      </div>
                      <div style={{ flexShrink: 0, display: 'flex', gap: 6, alignItems: 'center' }}>
                        {s.guardian_phone ? (
                          <>
                            <a href={`tel:${s.guardian_phone}`}
                              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px', borderRadius: 9, background: '#0f172a', color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                              <Phone size={13} /> Call
                            </a>
                            <a
                              href={`https://wa.me/${s.guardian_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${s.guardian_name || 'Guardian'}, ${s.full_name} was marked absent today (${date}). Please contact the school office.`)}`}
                              target="_blank" rel="noreferrer"
                              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px', borderRadius: 9, background: '#25D366', color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                              💬 WA
                            </a>
                          </>
                        ) : (
                          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, background: '#f1f5f9', padding: '6px 10px', borderRadius: 8 }}>No phone</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

          </>
        )}
      </div>
    </>
  )
}

function EmptyPrompt({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: '50px 20px', textAlign: 'center', border: '1.5px solid #f0eefe' }}>
      <div style={{ fontSize: 48, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', marginBottom: 6 }}>{title}</div>
      <p style={{ fontSize: 13, color: 'var(--text-subtle)', margin: 0 }}>{sub}</p>
    </div>
  )
}
