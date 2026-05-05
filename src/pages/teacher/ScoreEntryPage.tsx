// src/pages/teacher/ScoreEntryPage.tsx
// Flexible Gradebook Version
import { useState, useEffect, useRef, useCallback, Fragment } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useCurrentTerm, useCurrentAcademicYear } from '../../hooks/useSettings'
import { TEACHER_REMARKS, getRandomRemark, GRADE_REMARKS } from '../../constants/remarks'
import toast from 'react-hot-toast'

// ── types ─────────────────────────────────────────────────
interface Subject { id: string; name: string; code?: string }
interface Student { id: string; full_name: string; student_id?: string }
interface GradingCategory { id: string; name: string; weight_percentage: number; max_score: number }
interface GradingScaleLevel { id: string; label: string; min_score: number; max_score: number; color_code: string }

// scoreMap[studentId][subjectId] = { scores: Record<categoryId, string>, remarks: string, submitted: boolean }
type ScoreMap = Record<string, Record<string, { scores: Record<string, string>; remarks: string; submitted: boolean }>>

// ── tiny input ────────────────────────────────────────────
function TinyInput({ value, max, onChange, disabled }: {
  value: string; max: number; onChange: (v: string) => void; disabled?: boolean
}) {
  const [f, setF] = useState(false)
  const n = parseFloat(value) || 0
  const over = n > max
  const ok = !over && value !== ''
  return (
    <input
      type="number" min={0} step={0.5}
      value={value}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setF(true)}
      onBlur={() => setF(false)}
      disabled={disabled}
      style={{
        width: 52, height: 32, textAlign: 'center', fontSize: 12, fontWeight: 700,
        borderRadius: 6, outline: 'none', transition: 'all .12s',
        fontFamily: '"DM Sans",sans-serif',
        border: `1.5px solid ${over ? '#f87171' : f ? '#7c3aed' : ok ? '#86efac' : '#e5e7eb'}`,
        background: over ? '#fef2f2' : f ? '#faf5ff' : ok ? '#f0fdf4' : '#fafafa',
        color: over ? '#dc2626' : '#111827',
        boxShadow: f ? '0 0 0 2px rgba(109,40,217,.15)' : 'none',
        cursor: disabled ? 'not-allowed' : 'text',
        opacity: disabled ? 0.45 : 1,
      }}
    />
  )
}

export default function ScoreEntryPage() {
  const { user } = useAuth()
  const { data: term } = useCurrentTerm()
  const { data: year } = useCurrentAcademicYear()
  const [params] = useSearchParams()

  const [teacherRecord, setTeacherRecord]   = useState<any>(null)
  const [assignments, setAssignments]       = useState<any[]>([])
  const [selectedClass, setSelectedClass]   = useState(params.get('class') ?? '')
  const [selectedSubjectId, setSelectedSubjectId] = useState('all')
  const [students, setStudents]             = useState<Student[]>([])
  const [subjects, setSubjects]             = useState<Subject[]>([])
  const [scoreMap, setScoreMap]             = useState<ScoreMap>({})
  const [saving, setSaving]                 = useState(false)
  const [submitting, setSubmitting]         = useState(false)
  const [dirty, setDirty]                   = useState(false)
  const [activeCell, setActiveCell]         = useState<{sid:string;subId:string;field:string}|null>(null)
  const [loading, setLoading]               = useState(true)
  const [syncingTests, setSyncingTests]     = useState(false)
  const autoSaveRef = useRef<any>(null)

  const [gradingCategories, setGradingCategories] = useState<GradingCategory[]>([])
  const [gradingScaleLevels, setGradingScaleLevels] = useState<GradingScaleLevel[]>([])

  const isLocked = (term as any)?.is_locked
  const classOptions = [...new Map(assignments.map((a:any) => [a.class?.id, a.class])).values()].filter(Boolean)

  useEffect(() => {
    if (user?.id) initTeacher()
  }, [user?.id, term?.id])

  useEffect(() => {
    if (selectedClass && teacherRecord) {
      setSelectedSubjectId('all') // reset subject filter on class change
      loadClassData()
    }
  }, [selectedClass, teacherRecord, term?.id])

  async function initTeacher() {
    const { data: t } = await supabase.from('teachers').select('*').eq('user_id', user!.id).single()
    if (!t) { setLoading(false); return }
    setTeacherRecord(t)
    if (!term?.id) { setLoading(false); return }
    const { data: a } = await supabase
      .from('teacher_assignments')
      .select('*, class:classes(id,name,department_id), subject:subjects(id,name,code)')
      .eq('teacher_id', t.id).eq('term_id', term.id)
    setAssignments(a ?? [])
    setLoading(false)
  }

  async function loadClassData() {
    if (!selectedClass || !teacherRecord?.id || !term?.id) return
    setLoading(true)

    const selectedClassData = assignments.find(a => a.class?.id === selectedClass)?.class
    const departmentId = selectedClassData?.department_id

    // Fetch Grading Setup
    let categories: GradingCategory[] = []
    let levels: GradingScaleLevel[] = []
    
    if (departmentId) {
      const { data: cats } = await supabase.from('department_grading_categories').select('*').eq('department_id', departmentId).order('created_at')
      if (cats && cats.length > 0) categories = cats

      const { data: scale } = await supabase.from('grading_scales').select('*, levels:grading_scale_levels(*)').eq('department_id', departmentId).single()
      if (scale?.levels) {
        levels = scale.levels.sort((a:any, b:any) => b.min_score - a.min_score)
      }
    }
    
    // Fallback categories if not configured by admin
    if (categories.length === 0) {
      categories = [
        { id: 'cs', name: 'Class Score', weight_percentage: 30, max_score: 30 },
        { id: 'es', name: 'Exam Score', weight_percentage: 70, max_score: 70 }
      ]
    }

    setGradingCategories(categories)
    setGradingScaleLevels(levels)

    const isClassTeacher = assignments.some((a:any) => a.class?.id === selectedClass && a.is_class_teacher)
    let assignedSubjects: Subject[] = assignments
      .filter((a:any) => a.class?.id === selectedClass)
      .map((a:any) => a.subject)
      .filter(Boolean) as Subject[]

    if (isClassTeacher) {
      const { data: allAssignments } = await supabase
        .from('teacher_assignments')
        .select('subject:subjects(id,name,code)')
        .eq('class_id', selectedClass)
        .eq('term_id', term!.id)
      
      const distinctSubjects = new Map()
      allAssignments?.forEach((a:any) => { if (a.subject) distinctSubjects.set(a.subject.id, a.subject) })
      assignedSubjects.forEach(s => distinctSubjects.set(s.id, s))
      assignedSubjects = Array.from(distinctSubjects.values()) as Subject[]
    }

    const { data: stds } = await supabase
      .from('students')
      .select('id,full_name,student_id')
      .eq('class_id', selectedClass)
      .eq('is_active', true)
      .order('full_name')

    const { data: existingScores } = await supabase
      .from('scores')
      .select('student_id,subject_id,class_score,exam_score,category_scores,teacher_remarks,is_submitted')
      .eq('class_id', selectedClass)
      .eq('term_id', term!.id)

    const map: ScoreMap = {}
    ;(stds ?? []).forEach(s => {
      map[s.id] = {}
      assignedSubjects.forEach(sub => {
        const ex = existingScores?.find((sc:any) => sc.student_id === s.id && sc.subject_id === sub.id)
        
        let initialScores: Record<string, string> = {}
        if (ex?.category_scores && Object.keys(ex.category_scores).length > 0) {
          initialScores = ex.category_scores
        } else if (ex) {
          // Backward compatibility
          initialScores = {
            'cs': String(ex.class_score ?? ''),
            'es': String(ex.exam_score ?? '')
          }
        } else {
          categories.forEach(c => initialScores[c.id] = '')
        }

        map[s.id][sub.id] = {
          scores: initialScores,
          remarks: ex?.teacher_remarks ?? '',
          submitted: ex?.is_submitted ?? false,
        }
      })
    })

    setStudents(stds ?? [])
    setSubjects(assignedSubjects)
    setScoreMap(map)
    setDirty(false)
    setLoading(false)
  }

  function getGrade(total: number) {
    if (gradingScaleLevels.length > 0) {
      const level = gradingScaleLevels.find(g => total >= g.min_score) ?? gradingScaleLevels[gradingScaleLevels.length - 1]
      return { grade: level?.label || '-', color: level?.color_code || '#6b7280' }
    }
    // Fallback to static grades
    const staticScale = [
      { grade: 'A', min: 80, color: '#16a34a' }, { grade: 'B', min: 70, color: '#2563eb' },
      { grade: 'C', min: 60, color: '#7c3aed' }, { grade: 'D', min: 50, color: '#d97706' },
      { grade: 'E', min: 40, color: '#ea580c' }, { grade: 'F', min: 0,  color: '#dc2626' }
    ]
    const g = staticScale.find(x => total >= x.min) ?? staticScale[5]
    return g
  }

  function getTotal(sid: string, subId: string): number {
    const s = scoreMap[sid]?.[subId]
    if (!s) return 0
    let total = 0
    gradingCategories.forEach(cat => {
      const val = parseFloat(s.scores[cat.id]) || 0
      total += (val / cat.max_score) * cat.weight_percentage
    })
    return parseFloat(total.toFixed(2))
  }

  const updateScore = useCallback((sid: string, subId: string, field: string, val: string) => {
    setScoreMap(prev => {
      const current = prev[sid]?.[subId]
      if (!current) return prev

      const updatedScores = { ...current.scores, [field]: val }
      let newRemarks = current.remarks

      // Auto remark if all categories are filled
      if (gradingCategories.every(c => updatedScores[c.id] !== '') && !newRemarks) {
        let total = 0
        gradingCategories.forEach(cat => {
          total += ((parseFloat(updatedScores[cat.id])||0) / cat.max_score) * cat.weight_percentage
        })
        const grade = getGrade(total).grade
        newRemarks = getRandomRemark(grade) || 'Good'
      }

      return {
        ...prev,
        [sid]: { ...prev[sid], [subId]: { ...current, scores: updatedScores, remarks: newRemarks } }
      }
    })
    setDirty(true)
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
    autoSaveRef.current = setTimeout(() => handleSave(false), 2500)
  }, [gradingCategories, gradingScaleLevels])

  function getStudentAvg(sid: string): number {
    const totals = subjects.map(sub => getTotal(sid, sub.id)).filter(t => t > 0)
    return totals.length ? totals.reduce((a,b) => a+b, 0) / totals.length : 0
  }

  function getSubjectAvg(subId: string): number {
    const totals = students.map(s => getTotal(s.id, subId)).filter(t => t > 0)
    return totals.length ? totals.reduce((a,b) => a+b, 0) / totals.length : 0
  }

  function getOverallPositions(): Record<string,number> {
    const sorted = [...students]
      .map(s => ({ id: s.id, avg: getStudentAvg(s.id) }))
      .filter(s => s.avg > 0)
      .sort((a,b) => b.avg - a.avg)
      
    const pos: Record<string,number> = {}
    let currentRank = 0
    let lastAvg = null
    
    sorted.forEach((s, index) => {
      if (s.avg !== lastAvg) {
        currentRank = index + 1
        lastAvg = s.avg
      }
      pos[s.id] = currentRank
    })
    return pos
  }

  async function handleSave(showToast = true) {
    if (!selectedClass || !term?.id || !year?.id || !teacherRecord?.id) return
    setSaving(true)
    try {
      const upserts: any[] = []
      students.forEach(s => {
        subjects.forEach(sub => {
          const sc = scoreMap[s.id]?.[sub.id]
          if (!sc) return
          const hasData = gradingCategories.some(c => sc.scores[c.id] !== '')
          if (!hasData) return

          upserts.push({
            student_id: s.id,
            subject_id: sub.id,
            class_id: selectedClass,
            term_id: term!.id,
            academic_year_id: year!.id,
            teacher_id: teacherRecord.id,
            category_scores: sc.scores,
            total_score: getTotal(s.id, sub.id),
            teacher_remarks: sc.remarks || null,
            is_submitted: sc.submitted ?? false,
          })
        })
      })
      if (upserts.length === 0) { if (showToast) toast('No scores to save'); return }
      const { error } = await supabase.from('scores').upsert(upserts, { onConflict: 'student_id,subject_id,term_id' })
      if (error) throw error
      setDirty(false)
      if (showToast) toast.success(`${upserts.length} scores saved ✓`)
    } catch (e: any) {
      if (showToast) toast.error(e.message ?? 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmit() {
    const entered = students.filter(s => subjects.some(sub => gradingCategories.some(c => scoreMap[s.id]?.[sub.id]?.scores[c.id] !== ''))).length
    if (!entered) { toast.error('No scores entered yet'); return }
    if (!confirm(`Submit all scores for this class to admin?`)) return
    await handleSave(false)
    setSubmitting(true)
    try {
      const { error } = await supabase.from('scores').update({ is_submitted: true })
        .eq('class_id', selectedClass).eq('term_id', term!.id).eq('teacher_id', teacherRecord.id)
      if (error) throw error
      toast.success('All scores submitted ✅')
      await loadClassData()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSubmitting(false)
    }
  }
  
  async function handleSyncAssignments() {
    if (!selectedClass || selectedSubjectId === 'all' || !term?.id) {
      toast.error('Select a specific subject to sync assignments')
      return
    }
    
    // Find the target category (usually "Class Score" or the first non-exam category)
    const targetCat = gradingCategories.find(c => c.name.toLowerCase().includes('class') || c.id === 'cs') || gradingCategories[0]
    if (!targetCat) {
      toast.error('No grading categories found to sync into')
      return
    }
    
    if (!confirm(`Sync all digital assignment scores for this subject into "${targetCat.name}"? This will overwrite existing values in that column.`)) return
    
    setSyncingTests(true)
    try {
      // 1. Fetch assignments for this subject/class/term
      const { data: ass, error: aErr } = await supabase
        .from('assignments')
        .select('id')
        .eq('class_id', selectedClass)
        .eq('subject_id', selectedSubjectId)
        .eq('term_id', term.id)
        
      if (aErr) throw aErr
      if (!ass || ass.length === 0) {
        toast.error('No digital assignments found for this subject/term')
        return
      }
      
      const assIds = ass.map(a => a.id)
      
      // 2. Fetch submissions
      const { data: subs, error: sErr } = await supabase
        .from('assignment_submissions')
        .select('student_id, score, total_possible')
        .in('assignment_id', assIds)
        
      if (sErr) throw sErr
      if (!subs || subs.length === 0) {
        toast.error('No submissions found for the existing assignments')
        return
      }
      
      // 3. Group and calculate
      const studentAverages: Record<string, { total: number, max: number }> = {}
      subs.forEach(s => {
        if (!studentAverages[s.student_id]) studentAverages[s.student_id] = { total: 0, max: 0 }
        studentAverages[s.student_id].total += (s.score || 0)
        studentAverages[s.student_id].max += (s.total_possible || 100)
      })
      
      // 4. Update scoreMap
      setScoreMap(prev => {
        const next = { ...prev }
        Object.keys(studentAverages).forEach(sid => {
          if (!next[sid]) return
          const avgPercent = studentAverages[sid].total / studentAverages[sid].max
          const scaledScore = (avgPercent * targetCat.max_score).toFixed(1)
          
          if (next[sid][selectedSubjectId]) {
            next[sid][selectedSubjectId] = {
              ...next[sid][selectedSubjectId],
              scores: {
                ...next[sid][selectedSubjectId].scores,
                [targetCat.id]: scaledScore
              }
            }
          }
        })
        return next
      })
      
      setDirty(true)
      toast.success(`Successfully synced ${Object.keys(studentAverages).length} digital assignment scores! ✨`)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSyncingTests(false)
    }
  }

  async function handleSyncClassTests() {
    if (!selectedClass || selectedSubjectId === 'all' || !term?.id) {
      toast.error('Select a specific subject to sync class tests')
      return
    }
    
    const targetCat = gradingCategories.find(c => c.name.toLowerCase().includes('class') || c.id === 'cs') || gradingCategories[0]
    if (!targetCat) {
      toast.error('No grading categories found')
      return
    }
    
    if (!confirm(`Sync all teacher-entered class tests into "${targetCat.name}"?`)) return
    
    setSyncingTests(true)
    try {
      const { data: tests, error: tErr } = await supabase
        .from('class_tests')
        .select('id, max_score')
        .eq('class_id', selectedClass)
        .eq('subject_id', selectedSubjectId)
        .eq('term_id', term.id)
        
      if (tErr) throw tErr
      if (!tests || tests.length === 0) {
        toast.error('No class tests found for this subject/term')
        return
      }
      
      const testIds = tests.map(t => t.id)
      const { data: scores, error: sErr } = await supabase
        .from('class_test_scores')
        .select('student_id, score_attained, test_id')
        .in('test_id', testIds)
        
      if (sErr) throw sErr
      if (!scores || scores.length === 0) {
        toast.error('No scores found for the existing tests')
        return
      }
      
      const studentAggregates: Record<string, { total: number, max: number }> = {}
      scores.forEach(s => {
        const testMax = tests.find(t => t.id === s.test_id)?.max_score || 0
        if (!studentAggregates[s.student_id]) studentAggregates[s.student_id] = { total: 0, max: 0 }
        studentAggregates[s.student_id].total += (s.score_attained || 0)
        studentAggregates[s.student_id].max += testMax
      })
      
      setScoreMap(prev => {
        const next = { ...prev }
        Object.keys(studentAggregates).forEach(sid => {
          if (!next[sid]) return
          const avgPercent = studentAggregates[sid].total / (studentAggregates[sid].max || 1)
          const scaledScore = (avgPercent * targetCat.max_score).toFixed(1)
          
          if (next[sid][selectedSubjectId]) {
            next[sid][selectedSubjectId] = {
              ...next[sid][selectedSubjectId],
              scores: { ...next[sid][selectedSubjectId].scores, [targetCat.id]: scaledScore }
            }
          }
        })
        return next
      })
      
      setDirty(true)
      toast.success(`Successfully synced class tests for ${Object.keys(studentAggregates).length} students! ✨`)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSyncingTests(false)
    }
  }

  const overallPos = getOverallPositions()
  const enteredCount = students.filter(s => subjects.some(sub => gradingCategories.some(c => scoreMap[s.id]?.[sub.id]?.scores[c.id] !== ''))).length

  const COL_STUDENT = 180
  const COL_SUBJECT = (gradingCategories.length * 56) + 52 + 38

  return (
    <div style={{ fontFamily:'"DM Sans",system-ui,sans-serif', paddingBottom: 60 }}>
      <style>{`
        @keyframes _spin{to{transform:rotate(360deg)}}
        input[type=number]::-webkit-inner-spin-button{opacity:0}
        .sba-table{border-collapse:collapse;font-family:"DM Sans",sans-serif}
        .sba-table th{background:linear-gradient(135deg,#faf5ff,#f5f3ff);font-size:10px;font-weight:700;color:#6d28d9;text-transform:uppercase;padding:8px 6px;border:1px solid #ede9fe;white-space:nowrap;text-align:center}
        .sba-table td{border:1px solid #f0eefe;padding:4px 6px;vertical-align:middle}
        .sba-row:hover td{background:#faf5ff !important}
        .sticky-std{position:sticky;left:0;background:#fff;z-index:4;border-right:2px solid #ddd6fe !important}
        .sub-header{background:linear-gradient(135deg,#ede9fe,#ddd6fe) !important;color:#5b21b6 !important}
        .grade-badge{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:7px;font-size:11px;font-weight:800}
      `}</style>

      <div style={{ marginBottom:20, display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontFamily:'"Playfair Display",serif', fontSize:24, fontWeight:700, margin:0 }}>Flexible Score Entry</h1>
          <p style={{ fontSize:13, color:'#6b7280', marginTop:3 }}>
            {dirty && !saving && <span style={{ color:'#d97706' }}>● Unsaved changes</span>}
            {saving && <span style={{ color:'#6d28d9' }}>Saving…</span>}
          </p>
        </div>
        {selectedClass && students.length > 0 && !isLocked && (
          <div style={{ display:'flex', gap:8 }}>
            {selectedSubjectId !== 'all' && (
              <>
                <button onClick={handleSyncClassTests} disabled={syncingTests} style={{ padding:'10px 16px', borderRadius:9, background:'#fdf2f2', color:'#dc2626', border:'1.5px solid #fecaca', cursor:'pointer', fontWeight:700, display:'flex', alignItems:'center', gap:6 }}>
                  {syncingTests ? '⌛' : '📝 Sync Tests'}
                </button>
                <button onClick={handleSyncAssignments} disabled={syncingTests} style={{ padding:'10px 16px', borderRadius:9, background:'#f5f3ff', color:'#6d28d9', border:'1.5px solid #ddd6fe', cursor:'pointer', fontWeight:700, display:'flex', alignItems:'center', gap:6 }}>
                  {syncingTests ? '⌛' : '🤖 Sync Assignments'}
                </button>
              </>
            )}
            <button onClick={() => handleSave(true)} disabled={saving || !dirty} style={{ padding:'10px 16px', borderRadius:9, background:'#fff', border:'1px solid #e5e7eb', cursor:'pointer' }}>💾 Save</button>
            <button onClick={handleSubmit} disabled={submitting || enteredCount === 0} style={{ padding:'10px 16px', borderRadius:9, background:'#6d28d9', color:'#fff', border:'none', cursor:'pointer' }}>📤 Submit</button>
          </div>
        )}
      </div>

      <div style={{ background:'#fff', borderRadius:14, padding:'16px 20px', border:'1px solid #e5e7eb', marginBottom:18, display:'flex', gap:16, flexWrap: 'wrap' }}>
        <div style={{ flex:'1 1 200px' }}>
          <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#6b7280', marginBottom:5 }}>Class</label>
          <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} style={{ width:'100%', padding:'9px 12px', borderRadius:9, border:'1px solid #e5e7eb', outline:'none' }}>
            <option value="">Select class…</option>
            {(classOptions as any[]).map((c:any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        {selectedClass && subjects.length > 0 && (
          <div style={{ flex:'1 1 200px' }}>
            <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#6b7280', marginBottom:5 }}>Subject View (Mobile Friendly)</label>
            <select value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)} style={{ width:'100%', padding:'9px 12px', borderRadius:9, border:'1px solid #e5e7eb', outline:'none' }}>
              <option value="all">All Subjects (Wide Grid)</option>
              {subjects.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
            </select>
          </div>
        )}
        {gradingScaleLevels.length > 0 && (
           <div style={{ flex:'2 1 300px' }}>
              <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#6b7280', marginBottom:5 }}>Grading Scale Applied</label>
              <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                {gradingScaleLevels.map(l => (
                   <span key={l.id} style={{ fontSize:10, fontWeight:700, color:l.color_code, background:`${l.color_code}15`, padding:'3px 6px', borderRadius:6 }}>{l.label} ({l.min_score}+)</span>
                ))}
              </div>
           </div>
        )}
      </div>

      {loading && selectedClass && <div style={{ padding:40, textAlign:'center' }}>Loading...</div>}

      {!loading && selectedClass && students.length > 0 && subjects.length > 0 && (() => {
        const subjectsToRender = selectedSubjectId === 'all' ? subjects : subjects.filter(s => s.id === selectedSubjectId)
        return (
          <div style={{ overflowX: 'auto', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14 }}>
             <table className="sba-table" style={{ minWidth: COL_STUDENT + subjectsToRender.length * COL_SUBJECT + (selectedSubjectId === 'all' ? 160 : 0) }}>
                <thead style={{ position:'sticky', top:0, zIndex:10 }}>
                  <tr>
                    <th className="sticky-std" rowSpan={2} style={{ minWidth:COL_STUDENT, textAlign:'left', paddingLeft:12 }}>Student</th>
                    {subjectsToRender.map(sub => (
                    <th key={sub.id} colSpan={gradingCategories.length + 2} className="sub-header" style={{ borderLeft:'2px solid #c4b5fd' }}>
                      {sub.name}
                    </th>
                  ))}
                    {selectedSubjectId === 'all' && <th colSpan={3} style={{ background:'#fef3c7', color:'#78350f' }}>Overall</th>}
                  </tr>
                  <tr>
                    {subjectsToRender.map(sub => (
                    <Fragment key={sub.id}>
                      {gradingCategories.map(c => (
                        <th key={c.id} style={{ background:'#f5f3ff', borderLeft:'1px solid #ede9fe' }}>
                          {c.name}<br/>
                          <span style={{ fontSize: 9, opacity: 0.8, fontWeight: 600 }}>({c.weight_percentage}% | Max: {c.max_score})</span>
                        </th>
                      ))}
                      <th style={{ background:'#f0fdf4' }}>Total</th>
                      <th>Grd</th>
                    </Fragment>
                  ))}
                  {selectedSubjectId === 'all' && (
                    <>
                      <th style={{ background:'#fffbeb' }}>Avg</th>
                      <th style={{ background:'#fffbeb' }}>Grd</th>
                      <th style={{ background:'#fffbeb' }}>Pos</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {students.map((stu, rowIdx) => {
                  const avg = getStudentAvg(stu.id)
                  const overallGrade = avg > 0 ? getGrade(avg) : null
                  const pos = overallPos[stu.id]
                  return (
                    <tr key={stu.id} className="sba-row">
                      <td className="sticky-std" style={{ background: rowIdx % 2 === 0 ? '#fff' : '#fafafa' }}>
                         <div style={{ fontSize:12, fontWeight:700, color:'#111827', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth: 160 }}>{stu.full_name}</div>
                      </td>
                      {subjectsToRender.map(sub => {
                        const sc = scoreMap[stu.id]?.[sub.id]
                        const total = getTotal(stu.id, sub.id)
                        const g = total > 0 ? getGrade(total) : null
                        return (
                          <Fragment key={sub.id}>
                            {gradingCategories.map(c => (
                              <td key={c.id} style={{ textAlign:'center' }}>
                                <TinyInput value={sc?.scores[c.id] ?? ''} max={c.max_score} disabled={isLocked} onChange={v => updateScore(stu.id, sub.id, c.id, v)} />
                              </td>
                            ))}
                            <td style={{ textAlign:'center', background:'#f0fdf4', fontWeight:800 }}>{total > 0 ? total.toFixed(1) : '—'}</td>
                            <td style={{ textAlign:'center' }}>{g ? <span className="grade-badge" style={{ background:g.color+'18', color:g.color }}>{g.grade}</span> : '—'}</td>
                          </Fragment>
                        )
                      })}
                      {selectedSubjectId === 'all' && (
                        <>
                          <td style={{ textAlign:'center', background:'#fffbeb', fontWeight:800 }}>{avg > 0 ? avg.toFixed(1) : '—'}</td>
                          <td style={{ textAlign:'center', background:'#fffbeb' }}>{overallGrade ? <span className="grade-badge" style={{ background:overallGrade.color+'18', color:overallGrade.color }}>{overallGrade.grade}</span> : '—'}</td>
                          <td style={{ textAlign:'center', background:'#fffbeb', fontWeight:800, color:'#92400e' }}>{pos ? `#${pos}` : '—'}</td>
                        </>
                      )}
                    </tr>
                  )
                })}
              </tbody>
           </table>
        </div>
        )
      })()}
    </div>
  )
}
