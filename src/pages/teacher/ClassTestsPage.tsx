// src/pages/teacher/ClassTestsPage.tsx
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useCurrentTerm, useCurrentAcademicYear } from '../../hooks/useSettings'
import { testService } from '../../services/test.service'
import { ClassTest, ClassTestScore, Student } from '../../types/database.types'
import toast from 'react-hot-toast'

export default function ClassTestsPage() {
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
    const { data: t } = await supabase.from('teachers').select('id').eq('user_id', user!.id).single()
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

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px', fontFamily: '"DM Sans", sans-serif' }}>
      <style>{`
        @keyframes _fi { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .card { background: #fff; border-radius: 16px; border: 1.5px solid #f1f5f9; padding: 16px; margin-bottom: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); animation: _fi 0.3s ease; }
        .btn { padding: 10px 16px; border-radius: 12px; font-weight: 600; font-size: 14px; cursor: pointer; border: none; transition: all 0.2s; display: inline-flex; align-items: center; gap: 8px; }
        .btn-primary { background: #7c3aed; color: #fff; }
        .btn-primary:hover { background: #6d28d9; }
        .btn-outline { background: #fff; border: 1.5px solid #e2e8f0; color: #475569; }
        .input { width: 100%; padding: 12px; border-radius: 12px; border: 1.5px solid #e2e8f0; outline: none; font-family: inherit; font-size: 14px; }
        .input:focus { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1); }
        .test-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
        @media (min-width: 768px) { .test-grid { grid-template-columns: 1fr 1fr; } }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1e293b', margin: 0 }}>Class Tests</h1>
          <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0' }}>Manage continuous assessments</p>
        </div>
        {selectedClass && selectedSubject && (
          <button onClick={() => setShowCreate(true)} className="btn btn-primary" style={{ height: 40, width: 40, borderRadius: '50%', justifyContent: 'center', padding: 0 }}>
            <span>+</span>
          </button>
        )}
      </div>

      {/* Selector Area */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Class</label>
          <select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setSelectedSubject(''); setParams({ class: e.target.value }) }} className="input">
            <option value="">Select Class</option>
            {classOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        {selectedClass && (
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Subject</label>
            <select value={selectedSubject} onChange={e => { setSelectedSubject(e.target.value); setParams({ class: selectedClass, subject: e.target.value }) }} className="input">
              <option value="">Select Subject</option>
              {subjectOptions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Stats & Sync */}
      {selectedClass && selectedSubject && tests.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: '0 4px' }}>
          <div style={{ color: '#64748b', fontSize: 13, fontWeight: 600 }}>{tests.length} tests recorded</div>
          <button onClick={handleSync} className="btn btn-outline" style={{ border: '1.5px solid #7c3aed', color: '#7c3aed', background: '#f5f3ff' }}>
             🪄 Sync to Report
          </button>
        </div>
      )}

      {/* Test List */}
      {!activeTest && !showCreate && (
        <div className="test-grid">
          {!selectedClass || !selectedSubject ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', gridColumn: '1 / -1' }}>
               <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
               <p>Select a class and subject to view tests</p>
            </div>
          ) : tests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
               <p>No tests recorded yet for this subject.</p>
               <button onClick={() => setShowCreate(true)} className="btn btn-primary" style={{ marginTop: 12 }}>
                 Create Your First Test
               </button>
            </div>
          ) : (
            tests.map(t => (
              <div key={t.id} className="card" style={{ borderLeft: '4px solid #7c3aed' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>{t.title}</h3>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                      {new Date(t.test_date).toLocaleDateString()} · Max: <b>{t.max_score}</b>
                    </p>
                  </div>
                  <button onClick={() => handleDeleteTest(t.id)} style={{ padding: 4, background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}>
                    🗑️
                  </button>
                </div>
                <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                  <button onClick={() => openScoreEntry(t)} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                    Enter Scores
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Modal (Full Screen Overlay on Mobile) */}
      {showCreate && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#fff', zIndex: 100, padding: 20 }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
             <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>New Class Test</h2>
             <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>×</button>
           </div>
           <form onSubmit={handleCreateTest} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
             <div>
               <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6, display: 'block' }}>Test Title</label>
               <input type="text" required placeholder="e.g. Week 1 Quiz" className="input" value={newTest.title} onChange={e => setNewTest({ ...newTest, title: e.target.value })} />
             </div>
             <div>
               <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6, display: 'block' }}>Max Marks</label>
               <input type="number" required placeholder="e.g. 20" className="input" value={newTest.max_score} onChange={e => setNewTest({ ...newTest, max_score: e.target.value })} />
             </div>
             <div>
               <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6, display: 'block' }}>Test Date</label>
               <input type="date" required className="input" value={newTest.test_date} onChange={e => setNewTest({ ...newTest, test_date: e.target.value })} />
             </div>
             <button type="submit" disabled={creating} className="btn btn-primary" style={{ marginTop: 12, justifyContent: 'center' }}>
               {creating ? 'Creating...' : 'Create Test'}
             </button>
           </form>
        </div>
      )}

      {/* Score Entry View (Full Screen) */}
      {activeTest && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#f8fafc', zIndex: 100, display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: '#fff', padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{activeTest.title}</h2>
              <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Score out of {activeTest.max_score}</p>
            </div>
            <button onClick={() => setActiveTest(null)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>×</button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            {students.map(s => (
              <div key={s.id} style={{ background: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12, border: '1.5px solid #f1f5f9' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#7c3aed', fontSize: 12 }}>
                  {s.full_name.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{s.full_name}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>ID: {s.student_id || 'N/A'}</div>
                </div>
                <input 
                  type="number" 
                  placeholder="0"
                  style={{ width: 60, textAlign: 'center', padding: '8px 4px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontWeight: 800, fontSize: 16 }}
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

          <div style={{ background: '#fff', padding: 16, borderTop: '1px solid #e2e8f0' }}>
             <button onClick={handleSaveScores} disabled={savingScores} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', height: 48 }}>
               {savingScores ? 'Submitting...' : '📤 Submit Scores'}
             </button>
          </div>
        </div>
      )}
    </div>
  )
}
