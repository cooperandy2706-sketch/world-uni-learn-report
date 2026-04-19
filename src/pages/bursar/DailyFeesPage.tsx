// src/pages/bursar/DailyFeesPage.tsx
import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import { useCurrentTerm } from '../../hooks/useSettings'
import { useClasses } from '../../hooks/useClasses'
import { dailyFeesService } from '../../services/bursar.service'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { Settings, Users, Monitor, Save, UserPlus, Trash2, CheckCircle, PencilLine, Printer } from 'lucide-react'

const GHS = (n: number) => `GH₵ ${Number(n).toLocaleString('en-GH', { minimumFractionDigits: 2 })}`

const CREST_SVG = `
  <svg width="40" height="40" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
    <circle cx="28" cy="28" r="26" fill="none" stroke="#4c1d95" stroke-width="2"/>
    <polygon points="28,9 32.5,21.5 46,21.5 35,29 39,42 28,34 17,42 21,29 10,21.5 23.5,21.5"
      fill="#4c1d95" stroke="#4c1d95" stroke-width="1.3" stroke-linejoin="round"/>
  </svg>`

function Btn({ children, onClick, variant = 'primary', style, loading }: any) {
  const [h, setH] = useState(false)
  const v: any = {
    primary: { background: h ? '#5b21b6' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', border: 'none' },
    danger: { background: h ? '#b91c1c' : '#dc2626', color: '#fff', border: 'none' },
    ghost: { background: h ? '#f5f3ff' : 'transparent', color: '#6b7280', border: 'none' },
  }
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: '"DM Sans",sans-serif', ...v[variant], ...style }}>
      {loading ? '...' : children}
    </button>
  )
}

function RecordTab({ schoolId, term, students, configArray, user, school }: any) {
  const qc = useQueryClient()
  const [recDate, setRecDate] = useState(() => new Date().toISOString().split('T')[0])
  const [recClass, setRecClass] = useState('')
  const [recEntries, setRecEntries] = useState<Record<string, { feeding: string; studies: string }>>({})

  const { data: recCollections = [], isLoading: loadingCollections, refetch: refetchCollections } = useQuery({
    queryKey: ['daily-fees-day', schoolId, term?.id, recDate],
    queryFn: async () => { const { data } = await dailyFeesService.getCollectionsByDate(schoolId, term?.id!, recDate); return data ?? [] },
    enabled: !!schoolId && !!term?.id && !!recDate
  })

  // 1. Fetch Attendance for blockers
  const { data: dayAttendance = [], isLoading: loadingAtt } = useQuery({
    queryKey: ['day-attendance', recClass, recDate],
    queryFn: async () => {
      const { data } = await supabase.from('attendance_records').select('student_id, status').eq('class_id', recClass).eq('date', recDate)
      return data ?? []
    },
    enabled: !!recClass && !!recDate
  })

  const isRegisterSubmitted = dayAttendance.length > 0
  const isAbsent = (sid: string) => dayAttendance.find(a => a.student_id === sid)?.status === 'absent'

  const recStudents = useMemo(() => students.filter((s:any) => s.class?.id === recClass), [students, recClass])
  
  const classRate = useMemo(() => (configArray || []).find((c: any) => c.class_id === recClass), [configArray, recClass])

  useEffect(() => {
    const newEntries: Record<string, { feeding: string; studies: string }> = {}
    recStudents.forEach((s: any) => {
      const f = recCollections.find((c: any) => c.student_id === s.id && c.fee_type === 'feeding')
      const st = recCollections.find((c: any) => c.student_id === s.id && c.fee_type === 'studies')
      newEntries[s.id] = {
        feeding: f ? String(f.amount) : '',
        studies: st ? String(st.amount) : ''
      }
    })
    setRecEntries(newEntries)
  }, [recStudents, recCollections])

  const saveAll = useMutation({
    mutationFn: async () => {
      const toUpsert: any[] = []
      recStudents.forEach((s: any) => {
        if (isAbsent(s.id)) return // Skip absent
        const entry = recEntries[s.id] || { feeding: '', studies: '' }
        
        const process = (type: 'feeding' | 'studies', val: string) => {
          const amt = parseFloat(val)
          if (isNaN(amt) || amt <= 0) return
          const existing = recCollections.find((c: any) => c.student_id === s.id && c.fee_type === type)
          
          toUpsert.push({
            id: existing?.id,
            school_id: schoolId,
            term_id: term?.id,
            student_id: s.id,
            fee_type: type,
            amount: amt,
            date: recDate,
            collected_by: user!.id
          })
        }

        process('feeding', entry.feeding)
        process('studies', entry.studies)
      })

      if (toUpsert.length === 0) return
      const { error } = await supabase.from('daily_fees_collected').upsert(toUpsert, { onConflict: 'id' })
      if (error) throw error
    },
    onSuccess: () => { refetchCollections(); toast.success('Fees Saved Successfully!') },
    onError: (e: any) => toast.error(e.message)
  })

  // Quick action for a student
  const payBoth = (sid: string) => {
    const classRate = (configArray || []).find((c: any) => c.class_id === recClass)
    setRecEntries(prev => ({
      ...prev,
      [sid]: {
        feeding: String(classRate?.expected_feeding_fee || 0),
        studies: String(classRate?.expected_studies_fee || 0)
      }
    }))
  }

  const printRegister = () => {
    const w = window.open('', '_blank')
    if (!w) return
    const logoHtml = school?.logo_url 
      ? `<img src="${school.logo_url}" style="height: 50px; border-radius: 8px;" />`
      : CREST_SVG

    w.document.write(`
      <html><head><title>Daily Collection Register</title>
      <style>
        body{font-family:system-ui,-apple-system,sans-serif;padding:30px;color:#1e293b} 
        .header{display:flex;align-items:center;gap:15px;margin-bottom:25px;border-bottom:2px solid #4c1d95;padding-bottom:15px}
        .school-name{font-size:20px;font-weight:800;color:#1e0646}
        h2{margin:20px 0 10px;font-size:16px;text-transform:uppercase;letter-spacing:0.1em;color:#4c1d95}
        .meta{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;background:#f8fafc;padding:15px;border-radius:10px;margin-bottom:20px;font-size:12px}
        .meta-item b{display:block;color:#64748b;text-transform:uppercase;font-size:10px;margin-bottom:4px}
        table{width:100%;border-collapse:collapse} 
        th{background:#4c1d95;color:#fff;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;padding:12px;text-align:left}
        td{border-bottom:1px solid #e2e8f0;padding:12px;font-size:13px}
        .footer{margin-top:40px;font-size:10px;color:#94a3b8;text-align:center;border-top:1px dashed #cbd5e1;padding-top:20px}
      </style>
      </head><body>
      <div class="header">
        ${logoHtml}
        <div>
          <div class="school-name">${school?.name || 'School System'}</div>
          <div style="font-size:12px;color:#64748b">${school?.address || ''}</div>
        </div>
      </div>
      <h2>Daily Collection Register</h2>
      <div class="meta">
        <div class="meta-item"><b>Class</b>${((students as any[]).find((s:any)=>s.class?.id===recClass)?.class as any)?.name || recClass}</div>
        <div class="meta-item"><b>Date</b>${new Date(recDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        <div class="meta-item"><b>Staff In Charge</b>${user?.full_name}</div>
      </div>
      <table>
        <thead><tr><th>Student Name</th><th>Feeding (GHS)</th><th>Studies (GHS)</th><th>Total</th></tr></thead>
        <tbody>
          ${recStudents.map((s:any) => {
            const ent = recEntries[s.id] || { feeding: '0', studies: '0' }
            const f = Number(ent.feeding || 0)
            const st = Number(ent.studies || 0)
            return `<tr><td style="font-weight:600">${s.full_name}</td><td>${f > 0 ? GHS(f) : '—'}</td><td>${st > 0 ? GHS(st) : '—'}</td><td style="font-weight:700">${GHS(f + st)}</td></tr>`
          }).join('')}
        </tbody>
      </table>
      <div class="footer">
        Official daily fee record generated from the Bursar Portal. &copy; ${new Date().getFullYear()} ${school?.name || 'School System'}
      </div>
      <script>setTimeout(() => window.print(), 500)</script>
      </body></html>
    `)
    w.document.close()
  }

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', padding: 24 }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 180px' }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: 6 }}>Date</label>
          <input type="date" value={recDate} onChange={e => setRecDate(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #e5e7eb', outline: 'none' }} />
        </div>
        <div style={{ flex: '1 1 180px' }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: 6 }}>Class</label>
          <select value={recClass} onChange={e => setRecClass(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #e5e7eb', outline: 'none' }}>
            <option value="">Select a class...</option>
            {Array.from(new Set((students as any[]).map((s:any) => s.class?.id))).filter(Boolean).map((cid: any) => {
              const stu = (students as any[]).find((s:any) => s.class?.id === cid)
              const cname = stu?.class?.name || 'Class'
              return <option key={cid as string} value={cid as string}>{cname}</option>
            })}
          </select>
        </div>
      </div>

      {!recClass ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', background: '#f8fafc', borderRadius: 16, border: '1.5px dashed #e5e7eb', color: '#6b7280' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🏫</div>
          Select a class to load the register.
        </div>
      ) : loadingAtt ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Checking attendance records...</div>
      ) : !isRegisterSubmitted ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', background: '#fef2f2', borderRadius: 16, border: '1.5px solid #fecaca', color: '#dc2626' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🛑</div>
          <h3 style={{ margin: '0 0 8px', fontWeight: 800 }}>ATTENDANCE NOT YET SUBMITTED</h3>
          <p style={{ margin: 0, fontSize: 13, opacity: 0.8 }}>Morning register must be submitted before recording fees.</p>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: '#111827', margin: 0 }}>Register for {recStudents.length} Students</h3>
            <Btn onClick={printRegister} variant="ghost" style={{ boxShadow: 'none' }}><Printer size={14}/> Print PDF</Btn>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginBottom: 30 }}>
            {recStudents.map((stu: any) => {
              const entry = recEntries[stu.id] || { feeding: '', studies: '' }
              const absent = isAbsent(stu.id)
              const feedPaid = !!recCollections.find(c => c.student_id === stu.id && c.fee_type === 'feeding')
              const studiesPaid = !!recCollections.find(c => c.student_id === stu.id && c.fee_type === 'studies')

              return (
                <div key={stu.id} style={{ 
                  background: absent ? '#f9fafb' : '#fff', 
                  borderRadius: 16, 
                  padding: 18, 
                  border: `1.5px solid ${absent ? '#e5e7eb' : '#f0eefe'}`,
                  opacity: absent ? 0.7 : 1,
                  boxShadow: absent ? 'none' : '0 2px 8px rgba(109,40,217,0.03)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: absent ? '#94a3b8' : '#111827' }}>{stu.full_name}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{stu.student_id || 'REGISTERED STUDENT'}</div>
                    </div>
                    {absent ? (
                      <span style={{ fontSize: 10, fontWeight: 900, padding: '3px 10px', borderRadius: 99, background: '#fef2f2', color: '#dc2626', border: '1px solid #fee2e2' }}>🛑 ABSENT</span>
                    ) : (
                      <button onClick={() => payBoth(stu.id)} style={{ fontSize: 10, fontWeight: 900, padding: '3px 10px', borderRadius: 99, background: '#f0fdf4', color: '#16a34a', border: '1px solid #dcfce7', cursor: 'pointer' }}>⚡ PAY BOTH</button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: 6 }}>Feeding 🥘</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input type="number" step="0.1" disabled={absent} value={entry.feeding} onChange={e => setRecEntries(p => ({...p, [stu.id]: { ...p[stu.id], feeding: e.target.value }}))} 
                          style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: `1.5px solid ${feedPaid ? '#34d399' : '#e5e7eb'}`, fontSize: 13, outline: 'none', background: absent ? '#f3f4f6' : '#fff' }} />
                        {feedPaid && <span style={{ color: '#10b981' }}>✓</span>}
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: 6 }}>Studies 📚</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input type="number" step="0.1" disabled={absent} value={entry.studies} onChange={e => setRecEntries(p => ({...p, [stu.id]: { ...p[stu.id], studies: e.target.value }}))} 
                          style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: `1.5px solid ${studiesPaid ? '#34d399' : '#e5e7eb'}`, fontSize: 13, outline: 'none', background: absent ? '#f3f4f6' : '#fff' }} />
                        {studiesPaid && <span style={{ color: '#10b981' }}>✓</span>}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ position: 'sticky', zIndex: 100, bottom: 20 }}>
             <Btn onClick={() => saveAll.mutate()} loading={saveAll.isPending} style={{ width: '100%', height: 50, borderRadius: 16, fontSize: 15, boxShadow: '0 8px 30px rgba(109,40,217,0.3)' }}>
                <Save size={18}/> SAVE REGISTER ENTRIES
             </Btn>
          </div>
        </div>
      )}
    </div>
  )
}

export default function DailyFeesPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const schoolId = user?.school_id ?? ''
  const { data: term } = useCurrentTerm()

  const { data: school } = useQuery({
    queryKey: ['school-info', schoolId],
    queryFn: async () => { const { data } = await supabase.from('schools').select('*').eq('id', schoolId).single(); return data },
    enabled: !!schoolId,
  })
  
  const [tab, setTab] = useState<'config' | 'collectors' | 'overview' | 'record'>('overview')

  const { data: classesAll = [] } = useClasses()

  // -- DA DATA --
  const { data: config = [], isLoading: loadingConfig } = useQuery({
    queryKey: ['daily-fee-class-rates', schoolId, term?.id],
    queryFn: async () => { const { data } = await dailyFeesService.getConfig(schoolId, term?.id!); return data ?? [] },
    enabled: !!schoolId && !!term?.id
  })

  const { data: collectors = [], isLoading: loadingCollectors } = useQuery({
    queryKey: ['daily-fee-collectors', schoolId],
    queryFn: async () => { const { data } = await dailyFeesService.getCollectors(schoolId); return data ?? [] },
    enabled: !!schoolId
  })

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers-all', schoolId],
    queryFn: async () => { const { data } = await supabase.from('teachers').select('id, user:users(full_name, email)').eq('school_id', schoolId); return data ?? [] },
    enabled: !!schoolId
  })

  const { data: students = [] } = useQuery({
    queryKey: ['students-all', schoolId],
    queryFn: async () => { const { data } = await supabase.from('students').select('id, full_name, class:classes(id,name)').eq('school_id', schoolId).eq('is_active', true); return data ?? [] },
    enabled: !!schoolId
  })

  const { data: allCollections = [] } = useQuery({
    queryKey: ['daily-fees-all-collections', schoolId, term?.id],
    queryFn: async () => { const { data } = await supabase.from('daily_fees_collected').select('student_id, fee_type, amount').eq('school_id', schoolId).eq('term_id', term?.id); return data ?? [] },
    enabled: !!schoolId && !!term?.id
  })

  // -- DA DATA --
  const { data: attendance = [] } = useQuery({
    queryKey: ['attendance-daily', schoolId, term?.id],
    queryFn: async () => { const { data } = await supabase.from('attendance').select('student_id, days_present').eq('school_id', schoolId).eq('term_id', term?.id); return data ?? [] },
    enabled: !!schoolId && !!term?.id
  })

  const [cfg, setCfg] = useState<Record<string, { expected_feeding_fee: string, expected_studies_fee: string }>>({})
  
  useEffect(() => {
    const next: any = {}
    for (const c of (classesAll as any[])) {
      const exist = config.find((r: any) => r.class_id === c.id)
      next[c.id] = {
        expected_feeding_fee: exist?.expected_feeding_fee?.toString() || '0',
        expected_studies_fee: exist?.expected_studies_fee?.toString() || '0'
      }
    }
    setCfg(next)
  }, [config, classesAll])

  const saveConfig = useMutation({
    mutationFn: () => {
      const payload = Object.keys(cfg).map(classId => ({
        school_id: schoolId,
        term_id: term?.id,
        class_id: classId,
        expected_feeding_fee: parseFloat(cfg[classId].expected_feeding_fee) || 0,
        expected_studies_fee: parseFloat(cfg[classId].expected_studies_fee) || 0
      }))
      return dailyFeesService.upsertConfig(payload)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey:['daily-fee-class-rates'] }); toast.success('Rates Saved') },
    onError: (e:any) => toast.error(e.message)
  })

  // -- COLLECTORS STATE --
  const [newColTid, setNewColTid] = useState('')
  const [newColType, setNewColType] = useState('both')

  const addCollector = useMutation({
    mutationFn: () => dailyFeesService.addCollector({ school_id: schoolId, teacher_id: newColTid, collection_type: newColType }),
    onSuccess: () => { qc.invalidateQueries({ queryKey:['daily-fee-collectors'] }); toast.success('Teacher Assigned'); setNewColTid('') },
    onError: (e:any) => toast.error('Teacher may already be assigned. ' + e.message)
  })

  // -- DEBTORS OVERVIEW --
  const [ovClassFilter, setOvClassFilter] = useState('')
  const [ovTypeFilter, setOvTypeFilter] = useState('feeding') // 'feeding' or 'studies'

  const debtorsData = useMemo(() => {
    const classesMap = new Map()

    const attMap: Record<string, number> = {}
    for (const a of (attendance as any[])) attMap[a.student_id] = a.days_present || 0

    students.forEach((s: any) => {
      if (ovClassFilter && s.class?.id !== ovClassFilter) return

      const classRateObj = config.find((c: any) => c.class_id === s.class?.id)
      const baseRate = ovTypeFilter === 'feeding' ? (classRateObj?.expected_feeding_fee || 0) : (classRateObj?.expected_studies_fee || 0)
      
      const feeMode = s.daily_fee_mode || 'all'
      let activeRate = baseRate
      if (feeMode === 'none') activeRate = 0
      else if (feeMode === 'feeding' && ovTypeFilter === 'studies') activeRate = 0

      const daysPresent = attMap[s.id] || 0
      const expectedTotals = activeRate * daysPresent

      const paid = allCollections.filter(c => c.student_id === s.id && c.fee_type === ovTypeFilter).reduce((sum, c) => sum + Number(c.amount), 0)
      const owes = expectedTotals - paid

      const cl = s.class?.name || 'Unassigned'
      if (!classesMap.has(cl)) classesMap.set(cl, { class_name: cl, students: [], total_paid: 0, total_owed: 0 })
      const clGrp = classesMap.get(cl)
      clGrp.students.push({ ...s, paid, owes, expectedTotals, daysPresent })
      clGrp.total_paid += paid
      clGrp.total_owed += owes > 0 ? owes : 0
    })

    return Array.from(classesMap.values()).sort((a,b) => a.class_name.localeCompare(b.class_name))
  }, [students, allCollections, config, ovClassFilter, ovTypeFilter, attendance])

  return (
    <div style={{ fontFamily: '"DM Sans",sans-serif', animation: '_fadeIn .4s ease' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');
        @keyframes _fadeIn { from{opacity:0} to{opacity:1} }
      `}</style>
      
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, margin: 0 }}>Daily Fees Management</h1>
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 3 }}>Configure daily feeding and studies fees and monitor debts</p>
      </div>

      <div style={{ display: 'flex', gap: 4, background: '#f5f3ff', borderRadius: 12, padding: 4, marginBottom: 22, width: 'fit-content' }}>
        {[
          { id: 'overview', icon: <Monitor size={14}/>, label: 'Overview & Debtors' },
          { id: 'record', icon: <PencilLine size={14}/>, label: 'Record Daily Fees' },
          { id: 'config', icon: <Settings size={14}/>, label: 'Rates & Setup' },
          { id: 'collectors', icon: <Users size={14}/>, label: 'Collection Staff' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 9, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .15s', background: tab === t.id ? '#6d28d9' : 'transparent', color: tab === t.id ? '#fff' : '#6d28d9', fontFamily: '"DM Sans",sans-serif' }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'config' && (
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1.5px solid #f0eefe', maxWidth: 800 }}>
          <h2 style={{ fontSize: 16, margin: '0 0 20px', color: '#111827' }}>Class Daily Rates</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', fontSize: 11, color: '#6b7280', textTransform: 'uppercase', paddingBottom: 10 }}>Class Name</th>
                  <th style={{ textAlign: 'left', fontSize: 11, color: '#6b7280', textTransform: 'uppercase', paddingBottom: 10 }}>Feeding Rate (GH₵)</th>
                  <th style={{ textAlign: 'left', fontSize: 11, color: '#6b7280', textTransform: 'uppercase', paddingBottom: 10 }}>Studies Rate (GH₵)</th>
                </tr>
              </thead>
              <tbody>
                {(classesAll as any[]).map(c => (
                  <tr key={c.id}>
                    <td style={{ padding: '8px 0', fontSize: 13, fontWeight: 600, color: '#374151' }}>{c.name}</td>
                    <td style={{ padding: '8px 12px 8px 0' }}>
                      <input type="number" step="0.5" value={cfg[c.id]?.expected_feeding_fee || ''} onChange={e => setCfg(p => ({...p, [c.id]: {...p[c.id], expected_feeding_fee: e.target.value}}))} style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1.5px solid #e5e7eb', outline: 'none' }} />
                    </td>
                    <td style={{ padding: '8px 0' }}>
                      <input type="number" step="0.5" value={cfg[c.id]?.expected_studies_fee || ''} onChange={e => setCfg(p => ({...p, [c.id]: {...p[c.id], expected_studies_fee: e.target.value}}))} style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1.5px solid #e5e7eb', outline: 'none' }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div style={{ background: '#f0fdf4', padding: 12, borderRadius: 9, border: '1px solid #bbf7d0', marginTop: 12 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#166534', textTransform: 'uppercase', marginBottom: 6 }}>Automated Day Counting</label>
              <p style={{ fontSize: 11, color: '#166534', marginBottom: 0, marginTop: 0 }}>This platform automatically computes a student's owing balance by matching their specific teacher-marked daily attendance against the daily fee rate.</p>
            </div>
            <Btn onClick={() => saveConfig.mutate()} loading={saveConfig.isPending}><Save size={16}/> Save Configuration</Btn>
          </div>
        </div>
      )}

      {tab === 'collectors' && (
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1.5px solid #f0eefe', flex: '1 1 300px', maxWidth: 400 }}>
            <h2 style={{ fontSize: 16, margin: '0 0 20px', color: '#111827' }}>Assign Collector</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: 6 }}>Teacher</label>
                <select value={newColTid} onChange={e => setNewColTid(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #e5e7eb', outline: 'none' }}>
                  <option value="">Select teacher...</option>
                  {teachers.map((t: any) => <option key={t.id} value={t.id}>{t.user?.full_name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: 6 }}>Allowed To Collect</label>
                <select value={newColType} onChange={e => setNewColType(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #e5e7eb', outline: 'none' }}>
                  <option value="both">Both Feeding & Studies</option>
                  <option value="feeding">Feeding Fee Only</option>
                  <option value="studies">Studies Fee Only</option>
                </select>
              </div>
              <Btn onClick={() => { if(!newColTid) toast.error('Select teacher'); else addCollector.mutate() }} loading={addCollector.isPending}><UserPlus size={16}/> Grant Access</Btn>
            </div>
          </div>
          <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', flex: '2 1 400px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#faf5ff' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: '#6d28d9', textTransform: 'uppercase' }}>Teacher</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: '#6d28d9', textTransform: 'uppercase' }}>Allowed Scope</th>
                  <th style={{ padding: '12px 16px', width: 50 }}></th>
                </tr>
              </thead>
              <tbody>
                {collectors.length === 0 ? <tr><td colSpan={3} style={{ padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No collectors assigned yet</td></tr> : collectors.map((c: any) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>{c.teacher?.user?.full_name}</td>
                    <td style={{ padding: '12px 16px' }}><span style={{ textTransform: 'capitalize', fontSize: 11, background: '#ede9fe', color: '#5b21b6', padding: '3px 8px', borderRadius: 99 }}>{c.collection_type}</span></td>
                    <td style={{ padding: '12px 16px' }}>
                      <button onClick={() => { if(confirm('Remove access?')) dailyFeesService.removeCollector(c.id).then(() => qc.invalidateQueries({queryKey:['daily-fee-collectors']})) }} style={{ border: 'none', background: '#fef2f2', color: '#dc2626', width: 28, height: 28, borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyItems: 'center' }}><Trash2 size={14}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'overview' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, background: '#fff', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #f0eefe' }}>
            <select value={ovTypeFilter} onChange={e => setOvTypeFilter(e.target.value)} style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', outline: 'none', fontSize: 13, width: 180 }}>
              <option value="feeding">Feeding Fees</option>
              <option value="studies">Studies Fees</option>
            </select>
            <select value={ovClassFilter} onChange={e => setOvClassFilter(e.target.value)} style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', outline: 'none', fontSize: 13, width: 180 }}>
              <option value="">All Classes</option>
              {Array.from(new Set((students as any[]).map((s:any) => s.class?.id))).filter(Boolean).map((cid: any) => {
                const stu = (students as any[]).find((s:any) => s.class?.id === cid)
                const cname = stu?.class?.name || 'Class'
                return <option key={cid as string} value={cid as string}>{cname}</option>
              })}
            </select>

            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', fontWeight: 700 }}>Debtors Mode</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>
                Class-Based 
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {debtorsData.length === 0 ? <div style={{ background: '#fff', padding: 40, textAlign: 'center', borderRadius: 12, color: '#9ca3af' }}>No students found</div> : debtorsData.map((cls) => (
              <div key={cls.class_name} style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', overflow: 'hidden' }}>
                <div style={{ background: '#faf5ff', padding: '12px 16px', borderBottom: '1px solid #f0eefe', display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 700, color: '#5b21b6', fontSize: 14 }}>{cls.class_name}</div>
                  <div style={{ fontSize: 12, color: '#6d28d9', fontWeight: 600 }}>Total Class Debt: {GHS(cls.total_owed)}</div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {cls.students.map((stu: any) => (
                      <tr key={stu.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                        <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 500, color: '#374151', width: '40%' }}>{stu.full_name}</td>
                        <td style={{ padding: '10px 16px', fontSize: 13, width: '30%' }}>
                          <span style={{ color: '#16a34a', fontWeight: 600 }}>Paid: {GHS(stu.paid)}</span>
                        </td>
                        <td style={{ padding: '10px 16px', fontSize: 13, textAlign: 'right' }}>
                          <span style={{ fontSize: 11, color: '#6b7280', marginRight: 12 }}>({stu.daysPresent} days)</span>
                          {stu.owes > 0 ? <span style={{ background: '#fef2f2', color: '#dc2626', padding: '3px 8px', borderRadius: 99, fontWeight: 700, fontSize: 12 }}>Owes {GHS(stu.owes)}</span> : <span style={{ color: '#9ca3af', fontSize: 12 }}>Cleared ✅</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'record' && (
        <RecordTab schoolId={schoolId} term={term} students={students} configArray={config} user={user} school={school} />
      )}
    </div>
  )
}
