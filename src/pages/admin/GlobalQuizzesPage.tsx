import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import Modal from '../../components/ui/Modal'
import { formatDate } from '../../lib/utils'
import toast from 'react-hot-toast'

interface Question {
  id: string
  text: string
  type: 'mcq' | 'tf' | 'short'
  options: string[]
  correctAnswer: string
  points: number
}

interface GlobalQuizData {
  title: string
  description: string
  subject_id: string
  duration_minutes: number
  shuffle_questions: boolean
  is_published: boolean
  content: {
    questions: Question[]
  }
}

// ── Helpers ───────────────────────────────────────────────
function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 5 }}>{children}</label>
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
          outline: 'none', background: '#fff', color: '#111827',
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
        outline: 'none', background: '#fff', color: '#111827',
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
    secondary: { background: hov ? '#f5f3ff' : '#fff', color: '#374151', border: '1.5px solid #e5e7eb' },
    danger: { background: hov ? '#b91c1c' : '#dc2626', color: '#fff', boxShadow: '0 2px 6px rgba(220,38,38,0.22)' },
    ghost: { background: hov ? '#f5f3ff' : 'transparent', color: '#6b7280' },
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

export default function AdminGlobalQuizzesPage() {
  const { user } = useAuth()
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Builder State
  const [form, setForm] = useState<GlobalQuizData>({
    title: '',
    description: '',
    subject_id: '',
    duration_minutes: 0,
    shuffle_questions: true,
    is_published: false,
    content: {
      questions: []
    }
  })

  useEffect(() => {
    if (user?.id) {
      loadData()
      loadQuizzes()
    }
  }, [user?.id, user?.school_id])

  async function loadData() {
    try {
      const query = supabase.from('subjects').select('*')
      if (user?.role === 'super_admin') {
        query.or(`school_id.is.null${user?.school_id ? `,school_id.eq.${user.school_id}` : ''}`)
      } else {
        query.eq('school_id', user!.school_id)
      }
      const { data: subs } = await query.order('name')
      setSubjects(subs ?? [])
    } catch (err) {
      console.error('Failed to load subjects:', err)
    }
  }

  async function loadQuizzes() {
    setIsLoading(true)
    try {
      const query = supabase
        .from('global_quizzes')
        .select('*, subject:subjects(name)')

      if (user?.role === 'super_admin') {
        query.or(`school_id.is.null${user?.school_id ? `,school_id.eq.${user.school_id}` : ''}`)
      } else {
        query.eq('school_id', user!.school_id)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      
      const quizzesWithCounts = await Promise.all((data ?? []).map(async (q) => {
        const { count } = await supabase
          .from('global_quiz_submissions')
          .select('*', { count: 'exact', head: true })
          .eq('quiz_id', q.id)
        return { ...q, submission_count: count ?? 0 }
      }))

      setQuizzes(quizzesWithCounts)
    } catch (err: any) {
      toast.error(err.message || 'Failed to load global quizzes')
    } finally {
      setIsLoading(false)
    }
  }

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
    if (!form.title || !form.subject_id || form.content.questions.length === 0) {
      toast.error('Please fill in title, subject, and add at least one question')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        ...form,
        school_id: user!.school_id,
      }

      const { error } = await supabase.from('global_quizzes').insert(payload)
      if (error) throw error

      toast.success('Global Quiz created successfully')
      setModalOpen(false)
      setForm({
        title: '',
        description: '',
        subject_id: '',
        duration_minutes: 0,
        shuffle_questions: true,
        is_published: false,
        content: { questions: [] }
      })
      loadQuizzes()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create global quiz')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function togglePublish(quiz: any) {
    try {
      const newStatus = !quiz.is_published
      const { error } = await supabase.from('global_quizzes').update({ is_published: newStatus }).eq('id', quiz.id)
      if (error) throw error
      toast.success(newStatus ? 'Quiz published to all students' : 'Quiz unpublished')
      loadQuizzes()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this global quiz?')) return
    try {
      const { error } = await supabase.from('global_quizzes').delete().eq('id', id)
      if (error) throw error
      toast.success('Global quiz deleted')
      loadQuizzes()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _spin { to{transform:rotate(360deg)} }
        @keyframes _fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .q-card { background: #fff; border: 1.5px solid #f0eefe; border-radius: 14px; padding: 18px; margin-bottom: 16px; position: relative; }
        .q-card:hover { border-color: #7c3aed; }
      `}</style>

      <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif' }}>
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>🌍 Global Quizzes</h1>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 3 }}>Create and manage school-wide challenges and assessments</p>
          </div>
          <Btn onClick={() => setModalOpen(true)}>➕ Create Global Quiz</Btn>
        </div>

        {/* ── List ── */}
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #ede9fe', borderTopColor: '#6d28d9', animation: '_spin 0.8s linear infinite' }} />
            <p style={{ fontSize: 13, color: '#9ca3af' }}>Loading global quizzes…</p>
          </div>
        ) : quizzes.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 16, padding: '60px 20px', textAlign: 'center', border: '1.5px solid #f0eefe' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🌍</div>
            <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 6 }}>No global quizzes created</h3>
            <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 18 }}>Publish your first school-wide interactive assessment.</p>
            <Btn onClick={() => setModalOpen(true)}>➕ Create First Quiz</Btn>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
            {quizzes.map((q, i) => (
              <div key={q.id} style={{ 
                background: '#fff', borderRadius: 18, border: '1.5px solid #f0eefe', padding: 20, 
                boxShadow: '0 1px 4px rgba(109,40,217,0.06)', animation: `_fadeUp 0.3s ease ${i * 0.05}s both`,
                position: 'relative'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, background: '#f5f3ff', color: '#7c3aed', padding: '4px 10px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {q.subject?.name || 'General'}
                  </span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => handleDelete(q.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14, color: '#f87171' }}>🗑️</button>
                  </div>
                </div>
                
                <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#111827', margin: '0 0 4px 0' }}>{q.title}</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18, marginTop: 16 }}>
                  <div style={{ background: '#faf5ff', borderRadius: 12, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 2 }}>Submissions</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#7c3aed' }}>{q.submission_count} Students</div>
                  </div>
                  <div style={{ background: '#f0fdf4', borderRadius: 12, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 2 }}>Questions</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#059669' }}>{q.content?.questions?.length || 0} items</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f5f3ff', paddingTop: 14 }}>
                  <button onClick={() => togglePublish(q)} style={{ 
                    border: 'none', background: q.is_published ? '#ecfdf5' : '#f3f4f6', 
                    color: q.is_published ? '#10b981' : '#6b7280', borderRadius: 8, padding: '6px 12px', 
                    fontSize: 12, fontWeight: 700, cursor: 'pointer' 
                  }}>
                    {q.is_published ? '✅ Published' : '🔒 Draft'}
                  </button>
                  {q.duration_minutes > 0 && (
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4 }}>
                       ⏱️ {q.duration_minutes}m limit
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── CREATE MODAL ── */}
        <Modal 
          open={modalOpen} 
          onClose={() => setModalOpen(false)} 
          title="Create Global Quiz" 
          subtitle="Build a cross-school challenge"
          size="lg"
          footer={<>
            <Btn variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Btn>
            <Btn onClick={handleSubmit} loading={isSubmitting}>Save Quiz</Btn>
          </>}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>📋 Quiz Details</p>
              
              <Field label="Quiz Title *">
                <StyledInput value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} placeholder="e.g. End of Year Trivia Challenge" />
              </Field>
              
              <Field label="Instructions / Description">
                <textarea 
                  value={form.description}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Tell students what to expect..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 9, fontSize: 13, border: '1.5px solid #e5e7eb', height: 80, fontFamily: 'inherit', resize: 'none' }}
                />
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="Subject *">
                  <StyledSelect value={form.subject_id} onChange={e => setForm(prev => ({ ...prev, subject_id: e.target.value }))}>
                    <option value="">Select subject...</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </StyledSelect>
                </Field>
                <Field label="Timer (Minutes)">
                  <StyledInput type="number" value={form.duration_minutes} onChange={e => setForm(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 0 }))} placeholder="0 = No limit" />
                </Field>
              </div>

              <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', padding: '12px 16px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <input type="checkbox" checked={form.is_published} onChange={e => setForm(prev => ({ ...prev, is_published: e.target.checked }))} id="publish_imm" />
                <label htmlFor="publish_imm" style={{ fontSize: 13, fontWeight: 700, color: '#16a34a', cursor: 'pointer' }}>Publish immediately (Available to all students)</label>
              </div>
            </div>

            <div style={{ borderLeft: '1.5px solid #f5f3ff', paddingLeft: 24, maxHeight: '600px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>❓ Questions ({form.content.questions.length})</p>
                <button onClick={addQuestion} style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: '#7c3aed', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}>+ Add</button>
              </div>

              {form.content.questions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>💡</div>
                  <p style={{ fontSize: 12 }}>Click "+ Add" to create your first question</p>
                </div>
              ) : (
                form.content.questions.map((q, qIndex) => (
                  <div key={q.id} className="q-card">
                    <button onClick={() => removeQuestion(q.id)} style={{ position: 'absolute', top: 12, right: 12, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12 }}>❌</button>
                    
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#9ca3af', marginBottom: 8 }}>QUESTION {qIndex + 1}</div>
                    
                    <Field label="Question Text">
                      <StyledInput value={q.text} onChange={e => updateQuestion(q.id, { text: e.target.value })} placeholder="Enter your question..." />
                    </Field>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 10, marginBottom: 12 }}>
                      <Field label="Type">
                        <StyledSelect value={q.type} onChange={e => updateQuestion(q.id, { type: e.target.value as any })}>
                          <option value="mcq">Multiple Choice</option>
                          <option value="tf">True / False</option>
                          <option value="short">Short Answer</option>
                        </StyledSelect>
                      </Field>
                      <Field label="Points">
                        <StyledInput type="number" value={q.points} onChange={e => updateQuestion(q.id, { points: parseInt(e.target.value) || 1 })} />
                      </Field>
                    </div>

                    {q.type === 'mcq' && (
                      <div style={{ marginTop: 10 }}>
                        <FieldLabel>Options & Correct Answer</FieldLabel>
                        {q.options.map((opt, oIndex) => (
                          <div key={oIndex} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <input 
                              type="radio" 
                              name={`correct-${q.id}`} 
                              checked={q.correctAnswer === opt && opt !== ''} 
                              onChange={() => updateQuestion(q.id, { correctAnswer: opt })}
                            />
                            <StyledInput 
                              value={opt} 
                              onChange={e => {
                                const newOpts = [...q.options]
                                newOpts[oIndex] = e.target.value
                                updateQuestion(q.id, { options: newOpts })
                              }} 
                              placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                              style={{ padding: '6px 10px' }}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {q.type === 'tf' && (
                      <div>
                        <FieldLabel>Correct Answer</FieldLabel>
                        <StyledSelect value={q.correctAnswer} onChange={e => updateQuestion(q.id, { correctAnswer: e.target.value })}>
                          <option value="">Select...</option>
                          <option value="True">True</option>
                          <option value="False">False</option>
                        </StyledSelect>
                      </div>
                    )}

                    {q.type === 'short' && (
                      <Field label="Correct Keyword (Auto-grade)">
                        <StyledInput value={q.correctAnswer} onChange={e => updateQuestion(q.id, { correctAnswer: e.target.value })} placeholder="The exact answer students must type" />
                      </Field>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </Modal>

      </div>
    </>
  )
}
