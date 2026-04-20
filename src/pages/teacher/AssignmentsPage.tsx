// src/pages/teacher/AssignmentsPage.tsx
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
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

export default function AssignmentsPage() {
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
      const { data: teacher } = await supabase.from('teachers').select('id').eq('user_id', user!.id).single()
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
      const { data: teacher } = await supabase.from('teachers').select('id').eq('user_id', user!.id).single()
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
      const { data: teacher } = await supabase.from('teachers').select('id').eq('user_id', user!.id).single()
      
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
      const { error } = await supabase.from('assignments').delete().eq('id', id)
      if (error) throw error
      toast.success('Assignment deleted')
      loadAssignments()
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
        @media (max-width: 768px) {
          .resp-grid { grid-template-columns: 1fr !important; }
          .resp-header { flex-direction: column !important; align-items: stretch !important; gap: 12px; }
          .resp-view-switch { flex-direction: column !important; }
          .resp-gap-sm { gap: 8px !important; }
        }
      `}</style>

      <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif' }}>
        
        <div className="resp-header" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>Assignments</h1>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 3 }}>Manage digital quizzes and tasks for your students</p>
          </div>
          <Btn onClick={() => setModalOpen(true)}>➕ Create New Assignment</Btn>
        </div>

        {/* ── Main View Switcher ── */}
        <div className="resp-view-switch" style={{ background: '#f5f3ff', padding: 8, borderRadius: 18, display: 'flex', gap: 8, marginBottom: 24, maxWidth: 500 }}>
          <div onClick={() => setViewMode('class')} style={{ flex: 1, padding: '14px', textAlign: 'center', fontSize: 14, fontWeight: 700, cursor: 'pointer', borderRadius: 14, transition: 'all 0.2s', ...(viewMode === 'class' ? { background: '#fff', color: '#7c3aed', boxShadow: '0 4px 14px rgba(109,40,217,0.08)' } : { color: '#6b7280' }) }}>
            🏫 My Class Assignments
          </div>
          <div onClick={() => { setViewMode('global'); setSelectedGlobalSubject(null); }} style={{ flex: 1, padding: '14px', textAlign: 'center', fontSize: 14, fontWeight: 700, cursor: 'pointer', borderRadius: 14, transition: 'all 0.2s', ...(viewMode === 'global' ? { background: '#fff', color: '#7c3aed', boxShadow: '0 4px 14px rgba(109,40,217,0.08)' } : { color: '#6b7280' }) }}>
            🌍 Global Challenges
          </div>
        </div>

        {viewMode === 'global' && selectedGlobalSubject && (
           <button onClick={() => setSelectedGlobalSubject(null)} style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 700, color: '#374151', cursor: 'pointer', marginBottom: 20, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
             ← Back to Subjects
           </button>
        )}

        {/* ── List ── */}
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #ede9fe', borderTopColor: '#6d28d9', animation: '_spin 0.8s linear infinite' }} />
            <p style={{ fontSize: 13, color: '#9ca3af' }}>Loading assignments…</p>
          </div>
        ) : viewMode === 'global' && !selectedGlobalSubject ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            {globalSubjects.length === 0 ? (
               <div style={{ background: '#fff', borderRadius: 16, padding: '80px 20px', textAlign: 'center', border: '1.5px solid #f0eefe', gridColumn: '1 / -1' }}>
                 <div style={{ fontSize: 48, marginBottom: 12 }}>🌍</div>
                 <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 6 }}>No challenges yet!</h3>
                 <p style={{ fontSize: 13, color: '#9ca3af' }}>The school hasn't published any global quizzes.</p>
               </div>
            ) : globalSubjects.map(sub => (
              <div key={sub.id} className="assign-card" onClick={() => setSelectedGlobalSubject(sub.id)} style={{ 
                background: '#fff', borderRadius: 20, border: '1.5px solid #f0eefe', padding: 24, 
                boxShadow: '0 2px 8px rgba(109,40,217,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, transition: 'all 0.2s'
              }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                  📚
                </div>
                <div>
                  <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#111827', margin: '0 0 4px 0' }}>{sub.name}</h3>
                  <p style={{ fontSize: 13, color: '#6b7280', margin: 0, fontWeight: 600 }}>{sub.count} Quizzes Available</p>
                </div>
              </div>
            ))}
          </div>
        ) : viewMode === 'global' && selectedGlobalSubject ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
             {filteredGlobal.length === 0 ? (
               <div style={{ background: '#fff', borderRadius: 16, padding: '60px 20px', textAlign: 'center', border: '1.5px solid #f0eefe', gridColumn: '1/-1' }}>No quizzes here.</div>
             ) : filteredGlobal.map((g, i) => (
               <div key={g.id} style={{ 
                 background: '#fff', borderRadius: 18, border: '1.5px solid #f0eefe', padding: 20, 
                 boxShadow: '0 1px 4px rgba(109,40,217,0.06)', animation: `_fadeUp 0.3s ease ${i * 0.05}s both`,
                 position: 'relative'
               }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, background: '#f5f3ff', color: '#7c3aed', padding: '4px 10px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {g.subject?.name || 'General'}
                    </span>
                  </div>
                  <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#111827', margin: '0 0 4px 0' }}>{g.title}</h3>
                  <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{g.description}</p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
                    <div style={{ background: '#faf5ff', borderRadius: 12, padding: '10px 12px' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 2 }}>Questions</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#7c3aed' }}>{g.content?.questions?.length || 0} items</div>
                    </div>
                    <div style={{ background: '#f0fdf4', borderRadius: 12, padding: '10px 12px' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 2 }}>School Wide</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#059669' }}>{g.total_submissions || 0} Taking</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', borderTop: '1px solid #f5f3ff', paddingTop: 14, gap: 10 }}>
                     <button onClick={() => navigate(`/teacher/global-quizzes/${g.id}/take`)} style={{ padding: '6px 12px', background: '#fff', color: '#4c1d95', border: '1.5px solid #e0e7ff', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Preview Quiz</button>
                     <button onClick={() => navigate(`/teacher/global-quizzes/${g.id}`)} style={{ padding: '6px 12px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>See My Students →</button>
                  </div>
               </div>
             ))}
          </div>
        ) : assignments.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 16, padding: '60px 20px', textAlign: 'center', border: '1.5px solid #f0eefe' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
            <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 6 }}>No assignments created</h3>
            <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 18 }}>Start by creating your first digital quiz for your students.</p>
            <Btn onClick={() => setModalOpen(true)}>➕ Create First Assignment</Btn>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
            {assignments.map((a, i) => (
              <div key={a.id} style={{ 
                background: '#fff', borderRadius: 18, border: '1.5px solid #f0eefe', padding: 20, 
                boxShadow: '0 1px 4px rgba(109,40,217,0.06)', animation: `_fadeUp 0.3s ease ${i * 0.05}s both`,
                position: 'relative'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, background: '#f5f3ff', color: '#7c3aed', padding: '4px 10px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {a.subject?.name}
                  </span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => handleDelete(a.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14, color: '#f87171' }}>🗑️</button>
                  </div>
                </div>
                
                <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#111827', margin: '0 0 4px 0' }}>{a.title}</h3>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>Class: <span style={{ fontWeight: 700, color: '#4c1d95' }}>{a.class?.name}</span></div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
                  <div style={{ background: '#faf5ff', borderRadius: 12, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 2 }}>Submissions</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#7c3aed' }}>{a.submission_count} Submitted</div>
                  </div>
                  <div style={{ background: '#f0fdf4', borderRadius: 12, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 2 }}>Questions</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#059669' }}>{a.content?.questions?.length || 0} items</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f5f3ff', paddingTop: 14 }}>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>
                    {a.due_date ? `Due: ${formatDate(a.due_date)}` : 'No due date'}
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    {a.duration_minutes > 0 && (
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4 }}>
                         ⏱️ {a.duration_minutes}m limit
                      </div>
                    )}
                    <button onClick={() => navigate(`/teacher/assignments/${a.id}`)} style={{ padding: '6px 12px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#6d28d9'} onMouseLeave={e => e.currentTarget.style.background = '#7c3aed'}>View Submissions →</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── CREATE MODAL ── */}
        <Modal 
          open={modalOpen} 
          onClose={() => setModalOpen(false)} 
          title="Create New Assignment" 
          subtitle="Build a digital quiz with auto-grading features"
          size="lg"
          footer={<>
            <Btn variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Btn>
            <Btn onClick={handleSubmit} loading={isSubmitting}>Publish Assignment</Btn>
          </>}
        >
          <div className="resp-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>📋 Assignment Details</p>
              
              <Field label="Assignment Title *">
                <StyledInput value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} placeholder="e.g. Mid-Term Science Quiz" />
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
                <Field label="Target Class *">
                  <StyledSelect value={form.class_id} onChange={e => setForm(prev => ({ ...prev, class_id: e.target.value }))}>
                    <option value="">Select class...</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </StyledSelect>
                </Field>
                <Field label="Subject *">
                  <StyledSelect value={form.subject_id} onChange={e => setForm(prev => ({ ...prev, subject_id: e.target.value }))}>
                    <option value="">Select subject...</option>
                    {availableSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </StyledSelect>
                </Field>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="Due Date">
                  <StyledInput type="datetime-local" value={form.due_date} onChange={e => setForm(prev => ({ ...prev, due_date: e.target.value }))} />
                </Field>
                <Field label="Timer (Minutes)">
                  <StyledInput type="number" value={form.duration_minutes} onChange={e => setForm(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 0 }))} placeholder="0 = No limit" />
                </Field>
              </div>

              <div style={{ background: '#f5f3ff', padding: '12px 16px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" checked={form.shuffle_questions} onChange={e => setForm(prev => ({ ...prev, shuffle_questions: e.target.checked }))} id="shuffle" />
                <label htmlFor="shuffle" style={{ fontSize: 13, fontWeight: 600, color: '#4c1d95', cursor: 'pointer' }}>Randomize question order for each student 🔀</label>
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
