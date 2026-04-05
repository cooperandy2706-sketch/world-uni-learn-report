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

function RecordTab({ schoolId, term, students, configArray, user }: any) {
  const qc = useQueryClient()
  const [recDate, setRecDate] = useState(() => new Date().toISOString().split('T')[0])
  const [recClass, setRecClass] = useState('')
  const [recType, setRecType] = useState('feeding')
  const [recEntries, setRecEntries] = useState<Record<string, string>>({})

  const { data: recCollections = [], isLoading: loadingCollections } = useQuery({
    queryKey: ['daily-fees-day', schoolId, term?.id, recDate],
    queryFn: async () => { const { data } = await dailyFeesService.getCollectionsByDate(schoolId, term?.id!, recDate); return data ?? [] },
    enabled: !!schoolId && !!term?.id && !!recDate
  })

  const recStudents = useMemo(() => students.filter((s:any) => s.class?.id === recClass), [students, recClass])
  
  const defaultAmount = useMemo(() => {
    const classRate = (configArray || []).find((c: any) => c.class_id === recClass)
    return recType === 'feeding' ? (classRate?.expected_feeding_fee || 0) : (classRate?.expected_studies_fee || 0)
  }, [configArray, recClass, recType])

  useEffect(() => {
    const newEntries: Record<string, string> = {}
    let hasChanges = false
    recStudents.forEach((s: any) => {
      const existing = recCollections.find((c: any) => c.student_id === s.id && c.fee_type === recType)
      if (existing) newEntries[s.id] = String(existing.amount)
    })
    setRecEntries(prev => {
      if (JSON.stringify(prev) !== JSON.stringify(newEntries)) return newEntries
      return prev
    })
  }, [recStudents, recCollections, recType])

  const saveAll = useMutation({
    mutationFn: async () => {
      const promises = Object.entries(recEntries).map(async ([studentId, amountStr]) => {
        const amt = parseFloat(amountStr)
        if (isNaN(amt) || amt <= 0) return null 
        const existing = recCollections.find((c: any) => c.student_id === studentId && c.fee_type === recType)
        if (existing) {
          if (existing.amount === amt) return null
          return supabase.from('daily_fees_collected').update({ amount: amt }).eq('id', existing.id)
        } else {
          return supabase.from('daily_fees_collected').insert({
            school_id: schoolId, term_id: term?.id, student_id: studentId,
            fee_type: recType, amount: amt, date: recDate, collected_by: user!.id
          })
        }
      })
      await Promise.all(promises)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey:['daily-fees-day'] }); toast.success('Saved!') },
    onError: (e: any) => toast.error(e.message)
  })

  const printRegister = () => {
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`
      <html><head><title>Daily Collection Register</title>
      <style>body{font-family:sans-serif;padding:20px} table{width:100%;border-collapse:collapse;margin-top:20px} th,td{border:1px solid #ccc;padding:8px;text-align:left}</style>
      </head><body>
      <h2>Daily Collection Register (${recType.toUpperCase()})</h2>
      <p><strong>Class:</strong> ${((students as any[]).find((s:any)=>s.class?.id===recClass)?.class as any)?.name || recClass} | <strong>Date:</strong> ${recDate} | <strong>Collected By:</strong> ${user?.full_name}</p>
      <table>
        <thead><tr><th>Student</th><th>Amount (GHS)</th><th>Signature/Notes</th></tr></thead>
        <tbody>
          ${recStudents.map((s:any) => `<tr><td>${s.full_name}</td><td>${recEntries[s.id] || ''}</td><td></td></tr>`).join('')}
        </tbody>
      </table>
      <script>window.print()</script>
      </body></html>
    `)
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
        <div style={{ flex: '1 1 180px' }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: 6 }}>Fee Type</label>
          <select value={recType} onChange={e => setRecType(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #e5e7eb', outline: 'none' }}>
            <option value="feeding">Feeding Fee</option>
            <option value="studies">Studies Fee</option>
          </select>
        </div>
      </div>

      {!recClass ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', background: '#f8fafc', borderRadius: 12, border: '1.5px dashed #e5e7eb', color: '#6b7280' }}>
          Select a class to load the student register.
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <button onClick={() => { const nd:any={}; recStudents.forEach((s:any)=>nd[s.id]=String(defaultAmount)); setRecEntries(nd) }} style={{ background: '#e0e7ff', color: '#4338ca', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Set All to GH₵ {defaultAmount}</button>
            <button onClick={printRegister} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f5f3ff', color: '#6d28d9', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}><Printer size={14}/> Print Record</button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
            <tbody>
              {recStudents.map((stu: any) => {
                const existAmt = recEntries[stu.id] || ''
                const hasDB = recCollections.some((c:any) => c.student_id === stu.id && c.fee_type === recType)
                return (
                  <tr key={stu.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 16px', fontSize: 13, width: '60%' }}>{stu.full_name}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>GH₵</span>
                        <input type="number" step="0.5" value={existAmt} onChange={e => setRecEntries(p => ({...p, [stu.id]: e.target.value}))} style={{ width: 80, padding: '6px 10px', borderRadius: 6, border: `1.5px solid ${existAmt?'#34d399':'#e5e7eb'}`, outline: 'none' }} />
                        {hasDB && <CheckCircle size={14} color="#10b981"/>}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div style={{ marginTop: 24, textAlign: 'right' }}>
            <Btn onClick={() => saveAll.mutate()} loading={saveAll.isPending}><Save size={16}/> Save Register</Btn>
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
        <RecordTab schoolId={schoolId} term={term} students={students} configArray={config} user={user} />
      )}
    </div>
  )
}
