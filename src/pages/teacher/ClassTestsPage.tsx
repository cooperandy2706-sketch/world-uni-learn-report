import { useStuckLoadingReload } from '../../hooks/useStuckLoadingReload'
// src/pages/teacher/ClassTestsPage.tsx
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useCurrentTerm, useCurrentAcademicYear } from '../../hooks/useSettings'
import { testService } from '../../services/test.service'
import { ClassTest, ClassTestScore, Student } from '../../types/database.types'
import toast from 'react-hot-toast'
import { useAutoRefresh } from "../../hooks/useAutoRefresh";

export default function ClassTestsPage() {
    useAutoRefresh(loadTests);
  const { user } = useAuth()
  const { data: term } = useCurrentTerm()
  const { data: year } = useCurrentAcademicYear()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()

  const [teacherId, setTeacherId] = useState<string | null>(null)
  const [assignments, setAssignments] = useState<any[]>([])
  const [selectedClass, setSelectedClass] = useState(params.get('class') || '')
  const [selectedSubject, setSelectedSubject] = useState(params.get('subject') || '')
  
  const [loading, setLoading] = useState(true)
  const [tests, setTests] = useState<ClassTest[]>([])
  const [students, setStudents] = useState<Student[]>([])
  
  // Test Entry State
  const [activeTest, setActiveTest] = useState<ClassTest | null>(null)
  const [scores, setScores] = useState<Record<string, string>>({})
  const [savingScores, setSavingScores] = useState(false)
  
  // Create Test Modal State
  const [showCreate, setShowCreate] = useState(false)
  const [newTest, setNewTest] = useState({ title: '', max_score: '10', test_date: new Date().toISOString().split('T')[0] })
  const [creating, setCreating] = useState(false)

  // ── Init ──
  useEffect(() => {
    if (user?.id) initTeacher()
  }, [user?.id, term?.id])

  useEffect(() => {
    if (selectedClass && selectedSubject && term?.id) {
       loadTests()
       loadStudents()
    } else {
       setTests([])
       setStudents([])
    }
  }, [selectedClass, selectedSubject, term?.id])

  async function initTeacher() {
    const { data: t } = await supabase.from('teachers').select('id').eq('user_id', user!.id).maybeSingle()
    if (!t) return
    setTeacherId(t.id)

    const { data: a } = await supabase
      .from('teacher_assignments')
      .select('*, class:classes(id,name), subject:subjects(id,name,code)')
      .eq('teacher_id', t.id).eq('term_id', term!.id)
    setAssignments(a ?? [])
    setLoading(false)
  }

  async function loadTests() {
    try {
      const data = await testService.getTests(selectedClass, selectedSubject, term!.id)
      setTests(data)
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  async function loadStudents() {
    const { data } = await supabase
      .from('students')
      .select('*')
      .eq('class_id', selectedClass)
      .eq('is_active', true)
      .order('full_name')
    setStudents(data ?? [])
  }

  // ── Handlers ──
  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teacherId || !term?.id || !year?.id) return
    setCreating(true)
    try {
      const test = await testService.createTest({
        school_id: user!.school_id,
        class_id: selectedClass,
        subject_id: selectedSubject,
        term_id: term.id,
        academic_year_id: year.id,
        teacher_id: teacherId,
        title: newTest.title,
        max_score: parseFloat(newTest.max_score),
        test_date: newTest.test_date
      })
      toast.success('Test created')
      setTests([test, ...tests])
      setShowCreate(false)
      setNewTest({ title: '', max_score: '10', test_date: new Date().toISOString().split('T')[0] })
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setCreating(false)
    }
  }

  const openScoreEntry = async (test: ClassTest) => {
    setActiveTest(test)
    try {
      const existingScores = await testService.getTestScores(test.id)
      const scoreMap: Record<string, string> = {}
      existingScores.forEach(s => {
        scoreMap[s.student_id] = String(s.score_attained)
      })
      setScores(scoreMap)
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleSaveScores = async () => {
    if (!activeTest) return
    setSavingScores(true)
    try {
      const scoreData = Object.entries(scores).map(([sid, val]) => ({
        student_id: sid,
        score_attained: parseFloat(val) || 0
      }))
      await testService.saveScores(activeTest.id, scoreData)
      
      if (selectedClass && selectedSubject && term?.id) {
        const loadingToast = toast.loading('Submitting and syncing to system...')
        await testService.syncToReport(selectedClass, selectedSubject, term.id)
        toast.success('Scores submitted and synced to report!', { id: loadingToast })
      } else {
        toast.success('Scores saved')
      }
      
      setActiveTest(null)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSavingScores(false)
    }
  }

  const handleSync = async () => {
    if (!selectedClass || !selectedSubject || !term?.id) return
    const loadingToast = toast.loading('Syncing to report...')
    try {
      await testService.syncToReport(selectedClass, selectedSubject, term.id)
      toast.success('Report updated successfully! Scores have been "struck" to fit the 50% class score.', { id: loadingToast })
    } catch (e: any) {
      toast.error(e.message, { id: loadingToast })
    }
  }

  const handleDeleteTest = async (id: string) => {
    if (!confirm('Are you sure you want to delete this test?')) return
    try {
      await testService.deleteTest(id)
      setTests(tests.filter(t => t.id !== id))
      toast.success('Test deleted')
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  // ── Render Helpers ──
  const classOptions = [...new Map(assignments.map(a => [a.class?.id, a.class])).values()].filter(Boolean)
  const subjectOptions = assignments
    .filter(a => a.class?.id === selectedClass)
    .map(a => a.subject)

   
  const { showManualRetry, manualReload } = useStuckLoadingReload(loading)

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
      <div style={{ width: 40, height: 40, border: '4px solid #ede9fe', borderTop: '4px solid #7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: '#94a3b8', fontSize: 14, margin: 0 }}>
        {showManualRetry ? 'Still having trouble loading…' : 'Loading your tests…'}
      </p>
      {showManualRetry && (
        <button
          onClick={manualReload}
          style={{ padding: '10px 24px', borderRadius: 12, background: '#7c3aed', color: '#fff', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
        >
          🔄 Retry
        </button>
      )}
    </div>
  )

  return (
    <div className="tp-page">
      <link rel="stylesheet" href="/src/styles/teacher-portal.css" />
      <style>{`
        @keyframes _fi { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* ── SCORE ENTRY INLINE VIEW ── */}
      {activeTest ? (
        <div className="tp-card" style={{ animation: '_fi 0.3s ease' }}>
          <div style={{ paddingBottom: 16, borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <button onClick={() => setActiveTest(null)} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: 0, marginBottom: 4, display: 'block' }}>← Back to Tests</button>
              <h2 className="tp-section-title" style={{ margin: 0 }}>{activeTest.title}</h2>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>Score out of {activeTest.max_score}</p>
            </div>
            <button onClick={() => setActiveTest(null)} style={{ background: 'var(--bg-input)', border: 'none', width: 32, height: 32, borderRadius: '50%', color: 'var(--text-main)', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          </div>

          <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: 4, marginBottom: 16 }}>
            {(Array.isArray(students) ? students : []).map(s => (
              <div key={s.id} style={{ background: 'var(--bg-input)', borderRadius: 12, padding: 12, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--border-color)' }}>
                <div className="tp-avatar" style={{ width: 40, height: 40, fontSize: 15, background: 'linear-gradient(135deg, var(--primary-color), var(--primary-color-dark))' }}>
                  {s.full_name.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.full_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>ID: {s.student_id || 'N/A'}</div>
                </div>
                <input 
                  type="number" 
                  placeholder="0"
                  className="tp-input"
                  style={{ width: 80, textAlign: 'center', fontWeight: 800, fontSize: 16, height: 44, padding: '0 8px' }}
                  value={scores[s.id] || ''}
                  onChange={e => {
                    const v = e.target.value
                    if (parseFloat(v) > activeTest.max_score) {
                      toast.error(`Max score is ${activeTest.max_score}`, { id: 'max-err' })
                    }
                    setScores({ ...scores, [s.id]: v })
                  }}
                />
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
             <button onClick={() => setActiveTest(null)} className="tp-btn tp-btn-ghost" style={{ flex: '1 1 120px' }}>
               Cancel
             </button>
             <button onClick={handleSaveScores} disabled={savingScores} className="tp-btn tp-btn-primary" style={{ flex: '2 1 200px' }}>
               {savingScores ? 'Submitting...' : '📤 Submit Scores'}
             </button>
          </div>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="tp-hero" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h1 className="tp-hero-title">Class Tests</h1>
                <p className="tp-hero-sub">Manage continuous assessments</p>
              </div>
              {selectedClass && selectedSubject && !showCreate && (
                <button onClick={() => setShowCreate(true)} className="tp-btn tp-btn-primary" style={{ height: 44, width: 44, borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                  +
                </button>
              )}
            </div>
          </div>

          {/* ── CREATE INLINE CARD ── */}
          {showCreate && (
            <div className="tp-card" style={{ animation: '_fi 0.3s ease', marginBottom: 20 }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid var(--border-color)', paddingBottom: 16 }}>
                 <h2 className="tp-section-title" style={{ margin: 0 }}>New Class Test</h2>
                 <button onClick={() => setShowCreate(false)} style={{ background: 'var(--bg-input)', border: 'none', width: 32, height: 32, borderRadius: '50%', color: 'var(--text-main)', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
               </div>
               <form onSubmit={handleCreateTest} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                 <div>
                   <label className="tp-label">Test Title</label>
                   <input type="text" required placeholder="e.g. Week 1 Quiz" className="tp-input" value={newTest.title} onChange={e => setNewTest({ ...newTest, title: e.target.value })} />
                 </div>
                 <div className="tp-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
                   <div>
                     <label className="tp-label">Max Marks</label>
                     <input type="number" required placeholder="e.g. 20" className="tp-input" value={newTest.max_score} onChange={e => setNewTest({ ...newTest, max_score: e.target.value })} />
                   </div>
                   <div>
                     <label className="tp-label">Test Date</label>
                     <input type="date" required className="tp-input" value={newTest.test_date} onChange={e => setNewTest({ ...newTest, test_date: e.target.value })} />
                   </div>
                 </div>
                 <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                   <button type="button" onClick={() => setShowCreate(false)} className="tp-btn tp-btn-ghost" style={{ flex: '1 1 120px' }}>Cancel</button>
                   <button type="submit" disabled={creating} className="tp-btn tp-btn-primary" style={{ flex: '2 1 200px' }}>
                     {creating ? 'Creating...' : 'Create Test'}
                   </button>
                 </div>
               </form>
            </div>
          )}

          {/* Selector Area */}
          <div className="tp-card" style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
            <div>
              <label className="tp-label">Class</label>
              <select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setSelectedSubject(''); setParams({ class: e.target.value }) }} className="tp-select">
                <option value="">Select Class</option>
                {classOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {selectedClass && (
              <div>
                <label className="tp-label">Subject</label>
                <select value={selectedSubject} onChange={e => { setSelectedSubject(e.target.value); setParams({ class: selectedClass, subject: e.target.value }) }} className="tp-select">
                  <option value="">Select Subject</option>
                  {subjectOptions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Stats & Sync */}
          {selectedClass && selectedSubject && tests.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: '0 4px', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 14, fontWeight: 700 }}>{tests.length} tests recorded</div>
              <button onClick={handleSync} className="tp-btn tp-btn-ghost" style={{ border: '1.5px solid var(--primary-color)', color: 'var(--primary-color)' }}>
                 🪄 Sync to Report
              </button>
            </div>
          )}

          {/* Test List */}
          <div className="tp-grid">
            {!selectedClass || !selectedSubject ? (
              <div className="tp-card" style={{ textAlign: 'center', padding: '60px 20px', gridColumn: '1 / -1', background: 'var(--bg-hover)' }}>
                 <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
                 <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 15 }}>Select a class and subject to view tests</p>
              </div>
            ) : tests.length === 0 ? (
              <div className="tp-card" style={{ textAlign: 'center', padding: '60px 20px', gridColumn: '1 / -1', background: 'var(--bg-hover)' }}>
                 <p style={{ color: 'var(--text-muted)', margin: '0 0 16px', fontSize: 15 }}>No tests recorded yet for this subject.</p>
                 {!showCreate && (
                   <button onClick={() => setShowCreate(true)} className="tp-btn tp-btn-primary">
                     Create Your First Test
                   </button>
                 )}
              </div>
            ) : (
              tests.map(t => (
                <div key={t.id} className="tp-card" style={{ borderLeft: '4px solid var(--primary-color)', display: 'flex', flexDirection: 'column' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3 }}>{t.title}</h3>
                      <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
                        {new Date(t.test_date).toLocaleDateString()} · Max: <b>{t.max_score}</b>
                      </p>
                    </div>
                    <button onClick={() => handleDeleteTest(t.id)} style={{ padding: 8, background: 'var(--bg-input)', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      🗑️
                    </button>
                  </div>
                  <div style={{ marginTop: 20, flex: 1, display: 'flex', alignItems: 'flex-end' }}>
                    <button onClick={() => openScoreEntry(t)} className="tp-btn tp-btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                      Enter Scores
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
