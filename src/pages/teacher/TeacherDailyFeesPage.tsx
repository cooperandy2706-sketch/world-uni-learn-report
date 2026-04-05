// src/pages/teacher/TeacherDailyFeesPage.tsx
import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import { useCurrentTerm } from '../../hooks/useSettings'
import { dailyFeesService } from '../../services/bursar.service'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { Save, CheckCircle } from 'lucide-react'

export default function TeacherDailyFeesPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const schoolId = user?.school_id ?? ''
  const { data: term } = useCurrentTerm()

  // Verify access privileges
  const { data: collectorAuth, isLoading: loadingAuth } = useQuery({
    queryKey: ['daily-fee-auth', user?.id],
    queryFn: async () => {
      const res = await dailyFeesService.isTeacherCollector(user?.id!)
      return res?.data || null
    },
    enabled: !!user?.id
  })

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [selectedClass, setSelectedClass] = useState('')
  const [feeType, setFeeType] = useState('feeding')

  // Available classes for the teacher to pick from
  const { data: classes = [] } = useQuery({
    queryKey: ['teacher-classes', user?.id],
    queryFn: async () => {
      const { data: teacher } = await supabase.from('teachers').select('id').eq('user_id', user!.id).single()
      if (!teacher) return []
      const { data } = await supabase.from('teacher_assignments').select('class:classes(id,name)').eq('teacher_id', teacher.id)
      return Array.from(new Map((data ?? []).map(a => [(a.class as any)?.id, a.class])).values())
    },
    enabled: !!user?.id
  })

  // Students in selected class
  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['students-class', selectedClass],
    queryFn: async () => { const { data } = await supabase.from('students').select('id, full_name, student_id').eq('class_id', selectedClass).eq('is_active', true).order('full_name'); return data ?? [] },
    enabled: !!selectedClass
  })

  // Collections for the selected date, type, class
  const { data: collections = [], isLoading: loadingCollections } = useQuery({
    queryKey: ['daily-fees-day', schoolId, term?.id, date],
    queryFn: async () => { const { data } = await dailyFeesService.getCollectionsByDate(schoolId, term?.id!, date); return data ?? [] },
    enabled: !!schoolId && !!term?.id && !!date
  })

  // Config amounts
  const { data: config } = useQuery({
    queryKey: ['daily-fee-config', schoolId, term?.id],
    queryFn: async () => { const { data } = await dailyFeesService.getConfig(schoolId, term?.id!); return data }
  })

  // Prepare ledger state for fast entry
  const defaultAmount = feeType === 'feeding' ? (config?.expected_feeding_fee || 0) : (config?.expected_studies_fee || 0)
  const [entries, setEntries] = useState<Record<string, string>>({})

  // If a teacher is strictly authorized for 'studies', ensure the state defaults correctly
  useEffect(() => {
    if (collectorAuth?.collection_type === 'studies') setFeeType('studies')
  }, [collectorAuth])

  useEffect(() => {
    // When students or collections change, we auto-populate the inputs based on existing collections
    const newEntries: Record<string, string> = {}
    students.forEach((s: any) => {
      const existing = collections.find((c: any) => c.student_id === s.id && c.fee_type === feeType)
      if (existing) newEntries[s.id] = String(existing.amount)
    })
    setEntries(prev => {
      if (JSON.stringify(prev) !== JSON.stringify(newEntries)) return newEntries
      return prev
    })
  }, [students, collections, feeType])

  const saveAll = useMutation({
    mutationFn: async () => {
      const promises = Object.entries(entries).map(async ([studentId, amountStr]) => {
        const amt = parseFloat(amountStr)
        if (isNaN(amt) || amt <= 0) return null // Don't save empty/zero

        const existing = collections.find((c: any) => c.student_id === studentId && c.fee_type === feeType)
        if (existing) {
          // Unchanged amount? skip
          if (existing.amount === amt) return null
          // Update
          return supabase.from('daily_fees_collected').update({ amount: amt }).eq('id', existing.id)
        } else {
          // Insert
          return supabase.from('daily_fees_collected').insert({
            school_id: schoolId,
            term_id: term?.id,
            student_id: studentId,
            fee_type: feeType,
            amount: amt,
            date: date,
            collected_by: user!.id
          })
        }
      })
      await Promise.all(promises)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey:['daily-fees-day'] })
      toast.success('Collections saved successfully!')
    },
    onError: (e: any) => toast.error(e.message)
  })

  if (loadingAuth || !term) return <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Loading...</div>
  if (!collectorAuth) return (
    <div style={{ padding: 60, textAlign: 'center' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
      <h2 style={{ fontSize: 20, color: '#111827', margin: '0 0 8px' }}>Not Authorized</h2>
      <p style={{ color: '#6b7280' }}>You have not been assigned to collect daily fees.</p>
    </div>
  )

  const allowedTypes = collectorAuth.collection_type

  return (
    <div style={{ fontFamily: '"DM Sans",sans-serif', animation: '_fadeIn .4s ease', paddingBottom: 60 }}>
      {/* (Styles injected locally for ease) */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');
        @keyframes _fadeIn { from{opacity:0} to{opacity:1} }
      `}</style>
      
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, margin: 0, color: '#111827' }}>Daily Collections</h1>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 3 }}>Record daily school fees directly from your device</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', background: '#fff', padding: '16px 20px', borderRadius: 16, border: '1.5px solid #f0eefe', boxShadow: '0 2px 8px rgba(109,40,217,.04)' }}>
        <div style={{ flex: '1 1 100%' }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: 6 }}>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: 9, border: '1.5px solid #e5e7eb', outline: 'none', background: '#faf5ff', fontSize: 14 }} />
        </div>
        <div style={{ flex: '1 1 100%' }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: 6 }}>Class</label>
          <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: 9, border: '1.5px solid #e5e7eb', outline: 'none', fontSize: 14, background: '#fff' }}>
            <option value="">Select a class...</option>
            {classes.map((c:any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div style={{ flex: '1 1 100%' }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: 6 }}>Fee Type</label>
          <select value={feeType} onChange={e => setFeeType(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: 9, border: '1.5px solid #e5e7eb', outline: 'none', fontSize: 14, background: '#fff' }}>
            {(allowedTypes === 'both' || allowedTypes === 'feeding') && <option value="feeding">Feeding Fee (GH₵ {config?.expected_feeding_fee || '0'})</option>}
            {(allowedTypes === 'both' || allowedTypes === 'studies') && <option value="studies">Studies Fee (GH₵ {config?.expected_studies_fee || '0'})</option>}
          </select>
        </div>
      </div>

      {!selectedClass ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', background: '#fff', borderRadius: 16, border: '1.5px dashed #e5e7eb' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
          <h3 style={{ fontSize: 18, margin: 0, color: '#111827' }}>Select a Class</h3>
          <p style={{ color: '#9ca3af', fontSize: 14 }}>Choose a class above to begin recording daily fees.</p>
        </div>
      ) : loadingStudents ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Loading students...</div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', overflow: 'hidden' }}>
          <div style={{ background: '#faf5ff', padding: '14px 20px', borderBottom: '1px solid #f0eefe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, color: '#5b21b6', fontSize: 14 }}>Record {feeType === 'feeding' ? 'Feeding' : 'Studies'} Fee — {date}</span>
            <button onClick={() => {
              const nd: Record<string,string> = {}
              students.forEach((s: any) => nd[s.id] = String(defaultAmount))
              setEntries(nd)
            }} style={{ background: '#e0e7ff', color: '#4338ca', border: 'none', padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Set All to GH₵ {defaultAmount}</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {students.map((stu: any) => {
              const existingAmount = entries[stu.id] || ''
              const hasExisting = collections.some((c:any) => c.student_id === stu.id && c.fee_type === feeType)
              return (
                <div key={stu.id} style={{ borderBottom: '1px solid #f8fafc', padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: '1 1 150px' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>{stu.full_name}</div>
                    {stu.student_id && <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500, marginTop: 4 }}>{stu.student_id}</div>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 700 }}>GH₵</span>
                    <input 
                      type="number" 
                      step="0.5" 
                      min="0"
                      value={existingAmount} 
                      onChange={e => setEntries(p => ({...p, [stu.id]: e.target.value}))} 
                      style={{ 
                        width: 80, padding: '10px 12px', borderRadius: 8, 
                        border: `1.5px solid ${existingAmount ? '#34d399' : '#e5e7eb'}`, 
                        background: existingAmount ? '#f0fdf4' : '#fff',
                        color: existingAmount ? '#065f46' : '#111827',
                        outline: 'none', fontSize: 14, fontWeight: 700
                      }} 
                    />
                    {hasExisting && <span title="Saved in database" style={{ display: 'flex' }}><CheckCircle size={18} color="#10b981"/></span>}
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ padding: '16px 20px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'center' }}>
            <button onClick={() => saveAll.mutate()} disabled={saveAll.isPending} style={{ width: '100%', maxWidth: 300, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', padding: '14px 24px', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: 8, alignItems: 'center', boxShadow: '0 4px 12px rgba(16,185,129,.3)' }}>
              {saveAll.isPending ? 'Saving...' : <><Save size={18}/> Save Register</>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
