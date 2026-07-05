// src/pages/teacher/AssignmentsPage.tsx
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { formatDate } from '../../lib/utils'
import toast from 'react-hot-toast'
import { useAutoRefresh } from "../../hooks/useAutoRefresh";

interface Question {
  id: string
  text: string
  type: 'mcq' | 'tf' | 'short'
  options: string[]
  correctAnswer: string
  points: number
}

interface AssignmentData {
  title: string
  description: string
  class_id: string
  subject_id: string
  term_id: string
  due_date: string
  duration_minutes: number
  shuffle_questions: boolean
  content: {
    questions: Question[]
  }
}

// ── Helpers ───────────────────────────────────────────────
function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 5 }}>{children}</label>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <FieldLabel>{label}</FieldLabel>
      {children}
    </div>
  )
}

function StyledInput({ error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <input
        {...props}
        onFocus={e => { setFocused(true); props.onFocus?.(e) }}
        onBlur={e => { setFocused(false); props.onBlur?.(e) }}
        style={{
          width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 13,
          border: `1.5px solid ${error ? '#f87171' : focused ? '#7c3aed' : '#e5e7eb'}`,
          boxShadow: focused ? '0 0 0 3px rgba(109,40,217,0.1)' : 'none',
          outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)',
          fontFamily: '"DM Sans",sans-serif', transition: 'all 0.15s',
          boxSizing: 'border-box',
          ...props.style
        }}
      />
      {error && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>⚠ {error}</p>}
    </div>
  )
}

function StyledSelect({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const [focused, setFocused] = useState(false)
  return (
    <select
      {...props}
      onFocus={e => { setFocused(true); props.onFocus?.(e) }}
      onBlur={e => { setFocused(false); props.onBlur?.(e) }}
      style={{
        width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 13,
        border: `1.5px solid ${focused ? '#7c3aed' : '#e5e7eb'}`,
        boxShadow: focused ? '0 0 0 3px rgba(109,40,217,0.1)' : 'none',
        outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)',
        fontFamily: '"DM Sans",sans-serif', cursor: 'pointer',
        boxSizing: 'border-box',
        ...props.style
      }}
    >
      {children}
    </select>
  )
}

function Btn({ children, onClick, variant = 'primary', type = 'button', disabled, loading, style }: any) {
  const [hov, setHov] = useState(false)
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '9px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600,
    border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s', opacity: disabled ? 0.6 : 1,
    fontFamily: '"DM Sans",sans-serif',
    ...style,
  }
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: hov ? '#5b21b6' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', boxShadow: '0 2px 8px rgba(109,40,217,0.28)' },
    secondary: { background: hov ? '#f5f3ff' : '#fff', color: 'var(--text-main)', border: '1.5px solid var(--border-color)' },
    danger: { background: hov ? '#b91c1c' : '#dc2626', color: '#fff', boxShadow: '0 2px 6px rgba(220,38,38,0.22)' },
    ghost: { background: hov ? '#f5f3ff' : 'transparent', color: 'var(--text-muted)' },
    success: { background: hov ? '#059669' : '#10b981', color: '#fff' },
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ ...base, ...variants[variant] }}>
      {loading && <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: '_spin 0.7s linear infinite', flexShrink: 0 }} />}
      {children}
    </button>
  )
}

// ═══════════════════════════════════════════════════════════

export default function AssignmentsPage() {
    useAutoRefresh(loadData);
  const { user } = useAuth()
  const navigate = useNavigate()
  const [assignments, setAssignments] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Builder State
  const [form, setForm] = useState<AssignmentData>({
    title: '',
    description: '',
    class_id: '',
    subject_id: '',
    term_id: '',
    due_date: '',
    duration_minutes: 0,
    shuffle_questions: false,
    content: {
      questions: []
    }
  })

  // Global Quizzes & View Mode
  const [viewMode, setViewMode] = useState<'class' | 'global'>('class')
  const [selectedGlobalSubject, setSelectedGlobalSubject] = useState<string | null>(null)
  const [globalQuizzes, setGlobalQuizzes] = useState<any[]>([])

  // Store raw assignments so we can filter dynamically
  const [teacherAssignments, setTeacherAssignments] = useState<any[]>([])

  // Derive subjects dynamically based on selected class
  const availableSubjects = useMemo(() => {
    if (!form.class_id || !user?.id) return []
    // Get assignments that match form.class_id
    const assigns = teacherAssignments.filter((a: any) => a.class?.id === form.class_id)
    const unique = Array.from(new Map(assigns.map((a: any) => [a.subject?.id, a.subject])).values()).filter(Boolean) as any[]
    return unique
  }, [form.class_id, teacherAssignments])


  useEffect(() => {
    if (user?.id) {
      loadData()
      loadAssignments()
    }
  }, [user?.id])

  async function loadData() {
    try {
      const { data: teacher } = await supabase.from('teachers').select('id').eq('user_id', user!.id).maybeSingle()
      if (!teacher) return

      const { data: assigns } = await supabase
        .from('teacher_assignments')
        .select('class:classes(id,name), subject:subjects(id,name), term_id')
        .eq('teacher_id', teacher.id)

      const uniqueClasses = Array.from(new Map(assigns?.map(a => [a.class?.id, a.class])).values()).filter(Boolean) as any[]
      
      setTeacherAssignments(assigns ?? [])
      setClasses(uniqueClasses)
      if (assigns && assigns.length > 0) {
        setForm(prev => ({ ...prev, term_id: assigns[0].term_id }))
      }
    } catch (err) {
      console.error('Failed to load classes/subjects:', err)
    }
  }

  async function loadAssignments() {
    setIsLoading(true)
    try {
      const { data: teacher } = await supabase.from('teachers').select('id').eq('user_id', user!.id).maybeSingle()
      if (!teacher) return

      const [classRes, globalRes] = await Promise.all([
        supabase
          .from('assignments')
          .select('*, class:classes(name), subject:subjects(name)')
          .eq('teacher_id', teacher.id)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('global_quizzes')
          .select('*, subject:subjects(name)')
          .or(`school_id.eq.${user!.school_id},school_id.is.null`)
          .eq('is_published', true)
          .order('created_at', { ascending: false })
      ])

      if (classRes.error) throw classRes.error
      if (globalRes.error) throw globalRes.error
      
      // Fetch submission counts for class assignment
      const assignmentsWithCounts = await Promise.all((classRes.data ?? []).map(async (a) => {
        const { count } = await supabase
          .from('assignment_submissions')
          .select('*', { count: 'exact', head: true })
          .eq('assignment_id', a.id)
        return { ...a, submission_count: count ?? 0 }
      }))

      setAssignments(assignmentsWithCounts)
      
      const globalWithCounts = await Promise.all((globalRes.data ?? []).map(async (g) => {
         const { count } = await supabase
           .from('global_quiz_submissions')
           .select('*', { count: 'exact', head: true })
           .eq('quiz_id', g.id)
         return { ...g, total_submissions: count ?? 0 }
      }))
      
      setGlobalQuizzes(globalWithCounts)

    } catch (err: any) {
      toast.error(err.message || 'Failed to load assignments')
    } finally {
      setIsLoading(false)
    }
  }

  const globalSubjects = useMemo(() => {
    const subjectsMap = new Map<string, { id: string, name: string, count: number }>()
    globalQuizzes.forEach(q => {
      const sid = q.subject_id || 'general'
      const sname = q.subject?.name || 'General'
      if (!subjectsMap.has(sid)) subjectsMap.set(sid, { id: sid, name: sname, count: 0 })
      subjectsMap.get(sid)!.count++
    })
    return Array.from(subjectsMap.values()).filter(s => s.count > 0)
  }, [globalQuizzes])

  const filteredGlobal = useMemo(() => {
    if (!selectedGlobalSubject) return []
    return globalQuizzes.filter(q => (q.subject_id || 'general') === selectedGlobalSubject)
  }, [globalQuizzes, selectedGlobalSubject])

  function addQuestion() {
    const newQ: Question = {
      id: Math.random().toString(36).slice(2, 9),
      text: '',
      type: 'mcq',
      options: ['', '', '', ''],
      correctAnswer: '',
      points: 1
    }
    setForm(prev => ({
      ...prev,
      content: { questions: [...prev.content.questions, newQ] }
    }))
  }

  function removeQuestion(id: string) {
    setForm(prev => ({
      ...prev,
      content: { questions: prev.content.questions.filter(q => q.id !== id) }
    }))
  }

  function updateQuestion(id: string, updates: Partial<Question>) {
    setForm(prev => ({
      ...prev,
      content: {
        questions: prev.content.questions.map(q => q.id === id ? { ...q, ...updates } : q)
      }
    }))
  }

  async function handleSubmit() {
    if (!form.title || !form.class_id || !form.subject_id || form.content.questions.length === 0) {
      toast.error('Please fill in all required fields and add at least one question')
      return
    }

    setIsSubmitting(true)
    try {
      const { data: teacher } = await supabase.from('teachers').select('id').eq('user_id', user!.id).maybeSingle()
      
      const payload = {
        ...form,
        school_id: user!.school_id,
        teacher_id: teacher?.id,
        due_date: form.due_date || null
      }

      const { error } = await supabase.from('assignments').insert(payload)
      if (error) throw error

      toast.success('Assignment created successfully')
      setModalOpen(false)
      setForm({
        title: '',
        description: '',
        class_id: '',
        subject_id: '',
        term_id: form.term_id,
        due_date: '',
        duration_minutes: 0,
        shuffle_questions: false,
        content: { questions: [] }
      })
      loadAssignments()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create assignment')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this assignment?')) return
    try {
      const { error } = await supabase.from('assignments').delete().eq('id', id).eq('school_id', user!.school_id)
      if (error) throw error
      toast.success('Assignment deleted')
      loadAssignments()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <div className="tp-page">
      <link rel="stylesheet" href="/src/styles/teacher-portal.css" />
      <style>{`
        .q-card { background: var(--bg-card); border: 1.5px solid var(--border-color); border-radius: 16px; padding: 18px; margin-bottom: 16px; position: relative; transition: border-color 0.2s; }
        .q-card:focus-within { border-color: var(--primary-color); }
      `}</style>

      {modalOpen ? (
        /* ── INLINE ASSIGNMENT BUILDER VIEW ── */
        <div style={{ animation: 'tp-fade-in 0.3s ease' }}>
          {/* Builder Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border-color)' }}>
            <div>
              <button 
                onClick={() => setModalOpen(false)} 
                className="tp-btn tp-btn-ghost"
                style={{ padding: '0 0 8px 0', minHeight: 'auto', background: 'transparent' }}
              >
                ← Back to Assignments
              </button>
              <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Create New Assignment</h2>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>Build a digital quiz with auto-grading features</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, '@media (minWidth: 768px)': { flexDirection: 'row' } } as any}>
            
            {/* Settings Column */}
            <div style={{ flex: '1 1 300px' }}>
              <div className="tp-label" style={{ marginBottom: 16 }}>📋 Assignment Settings</div>
              
              <Field label="Assignment Title *">
                <StyledInput value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} placeholder="e.g. Mid-Term Science Quiz" className="tp-input" />
              </Field>
              
              <Field label="Instructions / Description">
                <textarea 
                  value={form.description}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Tell students what to expect..."
                  className="tp-input"
                  style={{ height: 90, resize: 'none' }}
                />
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
                <Field label="Target Class *">
                  <StyledSelect value={form.class_id} onChange={e => setForm(prev => ({ ...prev, class_id: e.target.value }))} className="tp-select">
                    <option value="">Select class...</option>
                    {(Array.isArray(classes) ? classes : []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </StyledSelect>
                </Field>
                <Field label="Subject *">
                  <StyledSelect value={form.subject_id} onChange={e => setForm(prev => ({ ...prev, subject_id: e.target.value }))} className="tp-select">
                    <option value="">Select subject...</option>
                    {availableSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </StyledSelect>
                </Field>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
                <Field label="Due Date">
                  <StyledInput type="datetime-local" value={form.due_date} onChange={e => setForm(prev => ({ ...prev, due_date: e.target.value }))} className="tp-input" />
                </Field>
                <Field label="Timer (Minutes)">
                  <StyledInput type="number" value={form.duration_minutes} onChange={e => setForm(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 0 }))} placeholder="0 = No limit" className="tp-input" />
                </Field>
              </div>

              <div style={{ background: 'var(--bg-hover)', padding: '16px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                <input type="checkbox" checked={form.shuffle_questions} onChange={e => setForm(prev => ({ ...prev, shuffle_questions: e.target.checked }))} id="shuffle" style={{ width: 20, height: 20, cursor: 'pointer', accentColor: 'var(--primary-color)' }} />
                <label htmlFor="shuffle" style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary-color)', cursor: 'pointer' }}>Randomize question order 🔀</label>
              </div>
            </div>

            {/* Questions Column */}
            <div style={{ flex: '1.5 1 400px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--border-color)', paddingBottom: 12 }}>
                <div className="tp-label" style={{ margin: 0 }}>❓ Questions ({form.content.questions.length})</div>
                <button 
                  onClick={addQuestion} 
                  className="tp-btn"
                  style={{ minHeight: 36, padding: '0 14px', fontSize: 13, background: 'var(--bg-hover)', color: 'var(--primary-color)', border: '1px solid var(--border-color)' }}
                >
                  + Add Question
                </button>
              </div>

              {form.content.questions.length === 0 ? (
                <div className="tp-empty" style={{ background: 'var(--bg-hover)', borderRadius: 16 }}>
                  <div className="tp-empty-icon">💡</div>
                  <div className="tp-empty-title">No questions added yet</div>
                  <p className="tp-empty-sub">Click "+ Add Question" to start building</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {form.content.questions.map((q, qIndex) => (
                    <div key={q.id} className="q-card">
                      <button 
                        onClick={() => removeQuestion(q.id)} 
                        style={{ position: 'absolute', top: 16, right: 16, border: 'none', background: '#FEE2E2', color: '#EF4444', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        ×
                      </button>
                      
                      <div className="tp-label" style={{ color: 'var(--primary-color)', marginBottom: 12 }}>QUESTION {qIndex + 1}</div>
                      
                      <Field label="Question Text">
                        <StyledInput value={q.text} onChange={e => updateQuestion(q.id, { text: e.target.value })} placeholder="Enter your question..." className="tp-input" />
                      </Field>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 16, marginBottom: 16 }}>
                        <Field label="Type">
                          <StyledSelect value={q.type} onChange={e => updateQuestion(q.id, { type: e.target.value as any })} className="tp-select">
                            <option value="mcq">Multiple Choice</option>
                            <option value="tf">True / False</option>
                            <option value="short">Short Answer</option>
                          </StyledSelect>
                        </Field>
                        <Field label="Points">
                          <StyledInput type="number" value={q.points} onChange={e => updateQuestion(q.id, { points: parseInt(e.target.value) || 1 })} className="tp-input" />
                        </Field>
                      </div>

                      {q.type === 'mcq' && (
                        <div>
                          <FieldLabel>Options & Correct Answer</FieldLabel>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {q.options.map((opt, oIndex) => (
                              <div key={oIndex} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <input 
                                  type="radio" 
                                  name={`correct-${q.id}`} 
                                  checked={q.correctAnswer === opt && opt !== ''} 
                                  onChange={() => updateQuestion(q.id, { correctAnswer: opt })}
                                  style={{ width: 20, height: 20, cursor: 'pointer', accentColor: 'var(--primary-color)' }}
                                />
                                <StyledInput 
                                  value={opt} 
                                  onChange={e => {
                                    const newOpts = [...q.options]
                                    newOpts[oIndex] = e.target.value
                                    updateQuestion(q.id, { options: newOpts })
                                  }} 
                                  placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                                  className="tp-input"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {q.type === 'tf' && (
                        <div>
                          <FieldLabel>Correct Answer</FieldLabel>
                          <StyledSelect value={q.correctAnswer} onChange={e => updateQuestion(q.id, { correctAnswer: e.target.value })} className="tp-select">
                            <option value="">Select...</option>
                            <option value="True">True</option>
                            <option value="False">False</option>
                          </StyledSelect>
                        </div>
                      )}

                      {q.type === 'short' && (
                        <Field label="Correct Keyword (Auto-grade)">
                          <StyledInput value={q.correctAnswer} onChange={e => updateQuestion(q.id, { correctAnswer: e.target.value })} placeholder="The exact answer students must type" className="tp-input" />
                        </Field>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: 20, marginTop: 24, paddingBottom: 24 }}>
            <button className="tp-btn tp-btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="tp-btn tp-btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Publishing...' : 'Publish Assignment 📤'}
            </button>
          </div>
        </div>
      ) : (
        /* ── REGULAR ASSIGNMENT LIST VIEW ── */
        <div style={{ animation: 'tp-fade-in 0.4s ease' }}>
          
          {/* HERO */}
          <div className="tp-hero" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div className="tp-hero-label">Assessments</div>
                <h1 className="tp-hero-title">📝 Assignments</h1>
                <p className="tp-hero-sub">Manage digital quizzes and tasks for your students</p>
              </div>
              <button className="tp-btn tp-btn-primary" onClick={() => setModalOpen(true)}>
                ➕ Create Assignment
              </button>
            </div>
          </div>

          {/* ── Tabs ── */}
          <div className="tp-tab-bar" style={{ marginBottom: 20 }}>
            <button 
              className={`tp-tab-btn ${viewMode === 'class' ? 'active' : ''}`}
              onClick={() => setViewMode('class')}
            >
              🏫 My Class Assignments
            </button>
            <button 
              className={`tp-tab-btn ${viewMode === 'global' ? 'active' : ''}`}
              onClick={() => { setViewMode('global'); setSelectedGlobalSubject(null); }}
            >
              🌍 Global Challenges
            </button>
          </div>

          {viewMode === 'global' && selectedGlobalSubject && (
            <button 
              onClick={() => setSelectedGlobalSubject(null)} 
              className="tp-btn tp-btn-ghost"
              style={{ marginBottom: 16, background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            >
              ← Back to Subjects
            </button>
          )}

          {/* ── List ── */}
          {isLoading ? (
            <div className="tp-loading">
              <div className="tp-spinner" />
              Loading assignments…
            </div>
          ) : viewMode === 'global' && !selectedGlobalSubject ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {globalSubjects.length === 0 ? (
                <div className="tp-card" style={{ gridColumn: '1 / -1' }}>
                  <div className="tp-empty">
                    <div className="tp-empty-icon">🌍</div>
                    <div className="tp-empty-title">No challenges yet!</div>
                    <p className="tp-empty-sub">The school hasn't published any global quizzes.</p>
                  </div>
                </div>
              ) : globalSubjects.map((sub, i) => (
                <div 
                  key={sub.id} 
                  className="tp-card" 
                  onClick={() => setSelectedGlobalSubject(sub.id)} 
                  style={{ cursor: 'pointer', animationDelay: `${i * 0.05}s` }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div className="tp-avatar" style={{ width: 56, height: 56, fontSize: 24, background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)', color: '#4338CA' }}>
                      📚
                    </div>
                    <div>
                      <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>{sub.name}</h3>
                      <p style={{ fontSize: 13, color: 'var(--primary-color)', margin: 0, fontWeight: 700 }}>{sub.count} Quizzes Available</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : viewMode === 'global' && selectedGlobalSubject ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {filteredGlobal.length === 0 ? (
                <div className="tp-card" style={{ gridColumn: '1/-1' }}>
                  <div className="tp-empty">
                    <div className="tp-empty-title">No quizzes here.</div>
                  </div>
                </div>
              ) : filteredGlobal.map((g, i) => (
                <div key={g.id} className="tp-card" style={{ animationDelay: `${i * 0.05}s`, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ marginBottom: 12 }}>
                    <span className="tp-badge tp-badge-primary">
                      {g.subject?.name || 'General'}
                    </span>
                  </div>
                  <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>{g.title}</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1 }}>{g.description}</p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div style={{ background: 'var(--bg-hover)', borderRadius: 12, padding: '12px' }}>
                      <div className="tp-label">Questions</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--primary-color)' }}>{g.content?.questions?.length || 0} items</div>
                    </div>
                    <div style={{ background: '#ECFDF5', borderRadius: 12, padding: '12px' }}>
                      <div className="tp-label" style={{ color: '#047857' }}>School Wide</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#059669' }}>{g.total_submissions || 0} Taking</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
                    <button 
                      onClick={() => navigate(`/teacher/global-quizzes/${g.id}/take`)} 
                      className="tp-btn tp-btn-ghost"
                      style={{ flex: 1, border: '1px solid var(--border-color)' }}
                    >
                      Preview
                    </button>
                    <button 
                      onClick={() => navigate(`/teacher/global-quizzes/${g.id}`)} 
                      className="tp-btn tp-btn-primary"
                      style={{ flex: 1.5 }}
                    >
                      Students →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : assignments.length === 0 ? (
            <div className="tp-card">
              <div className="tp-empty">
                <div className="tp-empty-icon">📝</div>
                <div className="tp-empty-title">No assignments created</div>
                <p className="tp-empty-sub" style={{ marginBottom: 20 }}>Start by creating your first digital quiz for your students.</p>
                <button className="tp-btn tp-btn-primary" onClick={() => setModalOpen(true)}>
                  ➕ Create Assignment
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {assignments.map((a, i) => (
                <div key={a.id} className="tp-card" style={{ animationDelay: `${i * 0.05}s`, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <span className="tp-badge tp-badge-primary">
                      {a.subject?.name}
                    </span>
                    <button 
                      onClick={() => handleDelete(a.id)} 
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16, color: '#EF4444', padding: 4 }}
                    >
                      🗑️
                    </button>
                  </div>
                  
                  <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>{a.title}</h3>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                    Class: <span style={{ fontWeight: 700, color: 'var(--primary-color)' }}>{a.class?.name}</span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div style={{ background: 'var(--bg-hover)', borderRadius: 12, padding: '12px' }}>
                      <div className="tp-label">Submissions</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--primary-color)' }}>{a.submission_count} Submitted</div>
                    </div>
                    <div style={{ background: '#ECFDF5', borderRadius: 12, padding: '12px' }}>
                      <div className="tp-label" style={{ color: '#047857' }}>Questions</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#059669' }}>{a.content?.questions?.length || 0} items</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                        {a.due_date ? `Due: ${formatDate(a.due_date)}` : 'No due date'}
                      </span>
                      {a.duration_minutes > 0 && (
                        <span style={{ fontWeight: 700, color: '#D97706' }}>
                          ⏱️ {a.duration_minutes}m limit
                        </span>
                      )}
                    </div>
                    
                    <button 
                      onClick={() => navigate(`/teacher/assignments/${a.id}`)} 
                      className="tp-btn tp-btn-primary"
                      style={{ width: '100%' }}
                    >
                      View Submissions →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
