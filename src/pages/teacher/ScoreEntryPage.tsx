import { useStuckLoadingReload } from '../../hooks/useStuckLoadingReload'
// src/pages/teacher/ScoreEntryPage.tsx
// Flexible Gradebook Version
import { useState, useEffect, useRef, useCallback, Fragment } from 'react'
import { Maximize2, Minimize2 } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useCurrentTerm, useCurrentAcademicYear } from '../../hooks/useSettings'
import { TEACHER_REMARKS, getRandomRemark, GRADE_REMARKS } from '../../constants/remarks'
import toast from 'react-hot-toast'
import { useAutoRefresh } from "../../hooks/useAutoRefresh";

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

export default function ScoreEntryPage({ isAdminView = false }: { isAdminView?: boolean }) {
    useAutoRefresh(loadClassData);
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
  useStuckLoadingReload(loading)
  const [syncingTests, setSyncingTests]     = useState(false)
  const autoSaveRef = useRef<any>(null)

  const [gradingCategories, setGradingCategories] = useState<GradingCategory[]>([])
  const [gradingScaleLevels, setGradingScaleLevels] = useState<GradingScaleLevel[]>([])
  const [syncTargetCatId, setSyncTargetCatId] = useState('')  // which category to sync tests/assignments into
  
  // Wizard state for mobile
  const [mobileStudentIndex, setMobileStudentIndex] = useState(0)

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
    const { data: t } = await supabase.from('teachers').select('*').eq('user_id', user!.id).maybeSingle()
    if (!t) { setLoading(false); return }
    setTeacherRecord(t)
    if (!term?.id) { setLoading(false); return }
    const { data: a } = await supabase
      .from('teacher_assignments')
      .select('*, class:classes(id,name,department_id), subject:subjects(id,name,code)')
      .eq('teacher_id', t.id).eq('term_id', term.id)
    setAssignments(a ?? [])
    setMobileStudentIndex(0)
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

      const { data: scale } = await supabase.from('grading_scales').select('*, levels:grading_scale_levels(*)').eq('department_id', departmentId).maybeSingle()
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
    setMobileStudentIndex(0)
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
    const totals = (Array.isArray(students) ? students : []).map(s => getTotal(s.id, subId)).filter(t => t > 0)
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
      (Array.isArray(students) ? students : []).forEach(s => {
        subjects.forEach(sub => {
          const sc = scoreMap[s.id]?.[sub.id]
          if (!sc) return
          const hasData = gradingCategories.some(c => sc.scores[c.id] !== '')
          if (!hasData) return

          // Backward compat: normalize cat[0] → class_score (0-100), cat[1] → exam_score (0-100)
          const _c0 = gradingCategories[0]
          const _c1 = gradingCategories[1]
          const _legacyCS = _c0
            ? parseFloat(((parseFloat(sc.scores[_c0.id] || '0') / _c0.max_score) * 100).toFixed(2))
            : null
          const _legacyES = _c1
            ? parseFloat(((parseFloat(sc.scores[_c1.id] || '0') / _c1.max_score) * 100).toFixed(2))
            : null
          upserts.push({
            student_id: s.id,
            subject_id: sub.id,
            class_id: selectedClass,
            term_id: term!.id,
            academic_year_id: year!.id,
            teacher_id: teacherRecord.id,
            category_scores: sc.scores,
            class_score: _legacyCS,
            exam_score: _legacyES,
            total_score: getTotal(s.id, sub.id),
            teacher_remarks: sc.remarks || null,
            is_submitted: sc.submitted ?? false,
          })
        })
      })
      if (upserts.length === 0) { if (showToast) toast('No scores to save'); return }
      
      // Check for existing records because Supabase lacks a UNIQUE constraint on these columns
      const { data: existing } = await supabase
        .from('scores')
        .select('id, student_id, subject_id, term_id')
        .eq('class_id', selectedClass)
        .eq('term_id', term!.id)
        
      const existingMap = new Map((existing || []).map(r => [`${r.student_id}_${r.subject_id}_${r.term_id}`, r.id]))
      
      const toUpdate: any[] = []
      const toInsert: any[] = []
      
      upserts.forEach(r => {
        const existingId = existingMap.get(`${r.student_id}_${r.subject_id}_${r.term_id}`)
        if (existingId) {
          toUpdate.push({ ...r, id: existingId })
        } else {
          toInsert.push(r)
        }
      })

      if (toUpdate.length > 0) {
        const { error: updErr } = await supabase.from('scores').upsert(toUpdate, { onConflict: 'id' })
        if (updErr) throw updErr
      }
      if (toInsert.length > 0) {
        const { error: insErr } = await supabase.from('scores').insert(toInsert)
        if (insErr) throw insErr
      }
      
      setDirty(false)
      if (showToast) toast.success(`${upserts.length} scores saved ✓`)
    } catch (e: any) {
      if (showToast) toast.error(e.message ?? 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmit() {
    const entered = (Array.isArray(students) ? students : []).filter(s => subjects.some(sub => gradingCategories.some(c => scoreMap[s.id]?.[sub.id]?.scores[c.id] !== ''))).length
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
    
    // Use selected target category, fall back to first class-score-like category
    const targetCat = (syncTargetCatId ? gradingCategories.find(c => c.id === syncTargetCatId) : null)
      ?? gradingCategories.find(c => c.name.toLowerCase().includes('class') || c.id === 'cs')
      ?? gradingCategories[0]
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
    
    const targetCat = (syncTargetCatId ? gradingCategories.find(c => c.id === syncTargetCatId) : null)
      ?? gradingCategories.find(c => c.name.toLowerCase().includes('class') || c.id === 'cs')
      ?? gradingCategories[0]
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
  const enteredCount = (Array.isArray(students) ? students : []).filter(s => subjects.some(sub => gradingCategories.some(c => scoreMap[s.id]?.[sub.id]?.scores[c.id] !== ''))).length

  const COL_STUDENT = 180
  const COL_SUBJECT = (gradingCategories.length * 56) + 52 + 38

  // ── Fullscreen ──────────────────────────────────────────────────────────────
  const sheetRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  async function toggleFullscreen() {
    if (!sheetRef.current) return
    if (!document.fullscreenElement) {
      try { await sheetRef.current.requestFullscreen() } catch { setIsFullscreen(fs => !fs) }
    } else {
      document.exitFullscreen()
    }
  }

  return (
    <div className="tp-page">
      <link rel="stylesheet" href="/src/styles/teacher-portal.css" />

      {/* ── HERO ── */}
      <div className="tp-hero" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div className="tp-hero-label">Academic Grading</div>
              <h1 className="tp-hero-title">💯 Score Entry</h1>
              <p className="tp-hero-sub">
                {dirty && !saving ? '● Unsaved changes' : saving ? 'Saving…' : 'All changes saved'}
              </p>
            </div>

            {/* Quick Actions (Desktop only - mobile moves these to bottom bar) */}
            <div className="hide-on-mobile" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              {selectedClass && (Array.isArray(students) ? students : []).length > 0 && !isLocked && selectedSubjectId !== 'all' && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', background: 'rgba(0,0,0,0.1)', padding: '6px 12px', borderRadius: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <label style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', opacity: 0.8 }}>Target</label>
                    <select
                      value={syncTargetCatId}
                      onChange={e => setSyncTargetCatId(e.target.value)}
                      style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: 'rgba(255,255,255,0.15)', color: '#fff', outline: 'none', fontSize: 12 }}
                    >
                    <option value="" style={{ color: '#000' }}>Auto-detect</option>
                    {gradingCategories.map(c => <option key={c.id} value={c.id} style={{ color: '#000' }}>{c.name}</option>)}
                  </select>
                </div>
                <button onClick={handleSyncClassTests} disabled={syncingTests} className="tp-btn tp-btn-ghost" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none' }}>
                  {syncingTests ? '⌛' : '📝 Sync Tests'}
                </button>
                <button onClick={handleSyncAssignments} disabled={syncingTests} className="tp-btn tp-btn-ghost" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none' }}>
                  {syncingTests ? '⌛' : '🤖 Sync Assignments'}
                </button>
              </div>
            )}
            {/* Fullscreen toggle - desktop only */}
            {selectedClass && (Array.isArray(students) ? students : []).length > 0 && (
              <button
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen for comfortable score entry'}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
                  borderRadius: 12, border: '1.5px solid rgba(255,255,255,0.3)',
                  background: isFullscreen ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.12)',
                  color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                  fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                  backdropFilter: 'blur(4px)'
                }}
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              </button>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* ── FILTER TABS ── */}
      <div className="tp-card" style={{ marginBottom: 16 }}>
        <div style={{ padding: '14px 18px', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label className="tp-label">Select Class</label>
            <select className="tp-select" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
              <option value="">Choose a class…</option>
              {(classOptions as any[]).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {selectedClass && subjects.length > 0 && (
            <div style={{ flex: '2 1 300px', minWidth: 0 }}>
              <label className="tp-label">Subject (Mobile view)</label>
              <div className="tp-tab-bar" style={{ paddingBottom: 0, marginBottom: 0 }}>
                <button
                  className={`tp-tab${selectedSubjectId === 'all' ? ' active' : ''}`}
                  onClick={() => setSelectedSubjectId('all')}
                >
                  All Subjects
                </button>
                {subjects.map(sub => (
                  <button
                    key={sub.id}
                    className={`tp-tab${selectedSubjectId === sub.id ? ' active' : ''}`}
                    onClick={() => setSelectedSubjectId(sub.id)}
                  >
                    {sub.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {gradingScaleLevels.length > 0 && (
          <div style={{ padding: '10px 18px', background: 'var(--bg-hover, #F8FAFC)', borderTop: '1px solid var(--border-color)', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Grading Scale:</span>
            {gradingScaleLevels.map(l => (
              <span key={l.id} style={{ fontSize: 10, fontWeight: 800, color: l.color_code, background: `${l.color_code}15`, padding: '2px 8px', borderRadius: 99 }}>
                {l.label} ({l.min_score}+)
              </span>
            ))}
          </div>
        )}
      </div>

      {loading && selectedClass && (
        <div className="tp-loading">
          <div className="tp-spinner" />
          Loading gradebook…
        </div>
      )}

      {/* ── DESKTOP GRID (Hidden on mobile) ── */}
      {!loading && selectedClass && (Array.isArray(students) ? students : []).length > 0 && subjects.length > 0 && (() => {
        const subjectsToRender = selectedSubjectId === 'all' ? subjects : subjects.filter(s => s.id === selectedSubjectId)
        return (
          <div ref={sheetRef} className="hide-on-mobile tp-card" style={{
            overflowX: 'auto', padding: 0,
            // Fullscreen styles applied via CSS class and inline fallback
            ...(isFullscreen ? {
              position: 'fixed', inset: 0, zIndex: 9999, borderRadius: 0,
              background: 'var(--bg-card)', display: 'flex', flexDirection: 'column'
            } : {})
          }}>
            {/* Fullscreen toolbar */}
            {isFullscreen && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 20px', background: 'linear-gradient(135deg, var(--primary-color-dark), var(--primary-color))',
                color: '#fff', flexShrink: 0
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 18 }}>💯</span>
                  <div>
                    <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 800 }}>Score Entry Sheet</div>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>
                      {(classOptions as any[]).find((c: any) => c.id === selectedClass)?.name} · {subjectsToRender.length} subject{subjectsToRender.length !== 1 ? 's' : ''} · {students.length} students
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, opacity: 0.8 }}>{dirty ? '● Unsaved' : saving ? 'Saving…' : '✓ Saved'}</span>
                  <button
                    onClick={handleSave}
                    disabled={!dirty || saving}
                    className="tp-btn"
                    style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', height: 36, fontSize: 13 }}
                  >
                    {saving ? 'Saving…' : '💾 Save'}
                  </button>
                  <button
                    onClick={toggleFullscreen}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
                  >
                    <Minimize2 size={16} /> Exit Fullscreen
                  </button>
                </div>
              </div>
            )}
            <div style={{ overflowX: 'auto', overflowY: isFullscreen ? 'auto' : undefined, flex: isFullscreen ? 1 : undefined }}>
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
                {(Array.isArray(students) ? students : []).map((stu, rowIdx) => {
                  const avg = getStudentAvg(stu.id)
                  const overallGrade = avg > 0 ? getGrade(avg) : null
                  const pos = overallPos[stu.id]
                  return (
                    <tr key={stu.id} className="sba-row">
                      <td className="sticky-std" style={{ background: rowIdx % 2 === 0 ? '#fff' : '#fafafa' }}>
                         <div style={{ fontSize:12, fontWeight:700, color: 'var(--text-main)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth: 160 }}>{stu.full_name}</div>
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
         </div>{/* end inner scroll wrapper */}
        </div>
        )
      })()}

      {/* ── MOBILE WIZARD (Shown only on mobile) & DESKTOP TABLE STYLES ── */}
      <style>{`
        .show-on-mobile { display: none; }
        @media (max-width: 900px) {
          .hide-on-mobile { display: none !important; }
          .show-on-mobile { display: block; }
        }
        .sba-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
        }
        .sba-table th, .sba-table td {
          padding: 12px 16px;
          border-right: 1px solid var(--border-color);
          border-bottom: 1px solid var(--border-color);
          white-space: nowrap;
        }
        .sba-table th {
          font-weight: 800;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.04em;
          color: var(--text-primary);
          padding-top: 16px;
          padding-bottom: 16px;
          border-top: 1px solid var(--border-color);
        }
        .sba-table .sticky-std {
          position: sticky;
          left: 0;
          z-index: 5;
          border-right: 2px solid var(--border-color);
        }
        .sba-table thead th {
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .sba-table thead th.sticky-std {
          z-index: 15;
          background: #f8fafc;
        }
      `}</style>

      {!loading && selectedClass && (Array.isArray(students) ? students : []).length > 0 && subjects.length > 0 && (
        <div className="show-on-mobile tp-card" style={{ padding: 0, overflow: 'hidden' }}>
          {(() => {
            const subjectsToRender = selectedSubjectId === 'all' ? subjects : subjects.filter(s => s.id === selectedSubjectId)
            const currentStudent = students[mobileStudentIndex]
            if (!currentStudent) return null

            const avg = getStudentAvg(currentStudent.id)
            const g = avg > 0 ? getGrade(avg) : null

            return (
              <div>
                {/* Navigation Header */}
                <div className="tp-wizard-nav">
                  <button 
                    className="tp-wizard-btn"
                    onClick={() => setMobileStudentIndex(i => Math.max(0, i - 1))}
                    disabled={mobileStudentIndex === 0}
                  >←</button>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                      Student {mobileStudentIndex + 1} of {(Array.isArray(students) ? students : []).length}
                    </div>
                    <div className="tp-wizard-progress" style={{ margin: '0 auto' }}>
                      <div className="tp-wizard-progress-fill" style={{ width: `${((mobileStudentIndex + 1) / (Array.isArray(students) ? students : []).length) * 100}%` }} />
                    </div>
                  </div>
                  <button 
                    className="tp-wizard-btn"
                    onClick={() => setMobileStudentIndex(i => Math.min((Array.isArray(students) ? students : []).length - 1, i + 1))}
                    disabled={mobileStudentIndex === (Array.isArray(students) ? students : []).length - 1}
                  >→</button>
                </div>

                {/* Student Info */}
                <div style={{ padding: '20px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div className="tp-avatar" style={{ width: 52, height: 52, fontSize: 20, background: 'linear-gradient(135deg, #1E1B4B, #4C1D95)', boxShadow: '0 4px 12px rgba(76,29,149,0.2)' }}>
                    {currentStudent.full_name.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>{currentStudent.full_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>ID: {currentStudent.student_id ?? '—'}</div>
                  </div>
                  {g && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 24, fontWeight: 900, color: g.color }}>{g.grade}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>{avg.toFixed(1)}%</div>
                    </div>
                  )}
                </div>

                {/* Score Inputs List */}
                <div style={{ padding: '0 20px 20px' }}>
                  {subjectsToRender.map((sub, idx) => {
                    const sc = scoreMap[currentStudent.id]?.[sub.id]
                    const total = getTotal(currentStudent.id, sub.id)
                    const sg = total > 0 ? getGrade(total) : null
                    return (
                      <div key={sub.id} style={{ marginTop: 24, paddingBottom: 24, borderBottom: idx < subjectsToRender.length - 1 ? '1px dashed var(--border-color)' : 'none' }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#4338CA', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          {sub.name}
                          {sg && <span style={{ fontSize: 13, background: sg.color + '15', color: sg.color, padding: '4px 10px', borderRadius: 8 }}>{total.toFixed(1)}</span>}
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 12 }}>
                          {gradingCategories.map(c => {
                            const val = sc?.scores[c.id] ?? ''
                            const over = parseFloat(val || '0') > c.max_score
                            const ok = val !== '' && !over
                            return (
                              <div key={c.id} style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '60%' }}>{c.name}</span>
                                  <span style={{ fontSize: 10 }}>Max: {c.max_score}</span>
                                </div>
                                <input
                                  type="number" min={0} step={0.5}
                                  value={val}
                                  disabled={isLocked}
                                  onChange={e => updateScore(currentStudent.id, sub.id, c.id, e.target.value)}
                                  placeholder="—"
                                  className={`tp-score-input${over ? ' over' : ok ? ' ok' : ''}`}
                                  style={{ width: '100%', textAlign: 'center', fontSize: 16, height: 44 }}
                                />
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                  
                  {/* Next Student CTA */}
                  {mobileStudentIndex < (Array.isArray(students) ? students : []).length - 1 && (
                    <button 
                      className="tp-btn tp-btn-ghost"
                      style={{ width: '100%', marginTop: 12, minHeight: 56, fontSize: 16 }}
                      onClick={() => {
                        setMobileStudentIndex(i => i + 1);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      Next Student →
                    </button>
                  )}
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* ── STICKY BOTTOM BAR (Mobile Save/Submit) ── */}
      {!isLocked && (Array.isArray(students) ? students : []).length > 0 && (
        <div className="tp-bottom-bar" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => handleSave(true)} disabled={saving || !dirty} className="tp-btn tp-btn-ghost">
              {saving ? <div className="tp-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : '💾 Save'}
            </button>
            <button onClick={handleSubmit} disabled={submitting || enteredCount === 0} className="tp-btn tp-btn-primary">
              📤 Submit All
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

