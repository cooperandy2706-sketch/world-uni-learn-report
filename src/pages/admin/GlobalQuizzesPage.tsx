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

  // ── Submissions panel ──
  const [submissionsQuiz, setSubmissionsQuiz] = useState<any | null>(null)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [subsLoading, setSubsLoading] = useState(false)
  const [subsSearch, setSubsSearch] = useState('')

  async function openSubmissions(quiz: any) {
    setSubmissionsQuiz(quiz)
    setSubsSearch('')
    setSubsLoading(true)
    try {
      const { data, error } = await supabase
        .from('global_quiz_submissions')
        .select(`
          id, score, total_possible, duration_taken_seconds,
          student:students(
            id, student_id,
            user:users(full_name, email),
            class:classes(name),
            school:schools(name)
          )
        `)
        .eq('quiz_id', quiz.id)
        .order('score', { ascending: false })
      if (error) throw error
      setSubmissions(data ?? [])
    } catch (err: any) {
      toast.error('Failed to load submissions: ' + err.message)
    } finally {
      setSubsLoading(false)
    }
  }

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

  const filteredSubs = submissions.filter(s => {
    if (!subsSearch) return true
    const q = subsSearch.toLowerCase()
    return (
      s.student?.user?.full_name?.toLowerCase().includes(q) ||
      s.student?.school?.name?.toLowerCase().includes(q) ||
      s.student?.class?.name?.toLowerCase().includes(q) ||
      s.student?.student_id?.toLowerCase().includes(q)
    )
  })

  const avgScore = submissions.length
    ? submissions.reduce((acc, s) => acc + (s.total_possible > 0 ? (s.score / s.total_possible) * 100 : 0), 0) / submissions.length
    : 0

  const passCount = submissions.filter(s => s.total_possible > 0 && (s.score / s.total_possible) >= 0.5).length

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _spin { to{transform:rotate(360deg)} }
        @keyframes _fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes _slideIn { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }
        .q-card { background: #fff; border: 1.5px solid #f0eefe; border-radius: 14px; padding: 18px; margin-bottom: 16px; position: relative; }
        .q-card:hover { border-color: #7c3aed; }
        .sub-row:hover { background: #faf5ff !important; }
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
                  <button
                    onClick={() => openSubmissions(q)}
                    style={{ background: '#faf5ff', borderRadius: 12, padding: '10px 12px', border: '1.5px solid #ede9fe', cursor: 'pointer', textAlign: 'left', transition: 'all .15s' }}
                    onMouseOver={e => (e.currentTarget.style.background = '#ede9fe')}
                    onMouseOut={e => (e.currentTarget.style.background = '#faf5ff')}
                  >
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 2 }}>Submissions</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#7c3aed' }}>{q.submission_count} Students 👁</div>
                  </button>
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

        {/* ── SUBMISSIONS DRAWER ── */}
        {submissionsQuiz && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }} onClick={(e) => { if (e.target === e.currentTarget) setSubmissionsQuiz(null) }}>
            <div style={{ width: '100%', maxWidth: 620, background: '#fff', boxShadow: '-20px 0 60px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', animation: '_slideIn .3s cubic-bezier(0.16,1,0.3,1)', overflowY: 'auto' }}>
              
              {/* Header */}
              <div style={{ padding: '24px 28px 20px', borderBottom: '1.5px solid #f0eefe', position: 'sticky', top: 0, background: '#fff', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#7c3aed', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>📊 Quiz Submissions</div>
                    <h2 style={{ fontFamily: '"Playfair Display",serif', fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>{submissionsQuiz.title}</h2>
                    <p style={{ fontSize: 12, color: '#9ca3af', margin: '4px 0 0' }}>Subject: {submissionsQuiz.subject?.name || 'General'} · {submissionsQuiz.content?.questions?.length || 0} Questions</p>
                  </div>
                  <button onClick={() => setSubmissionsQuiz(null)} style={{ border: '1.5px solid #e5e7eb', background: '#fff', borderRadius: 10, width: 36, height: 36, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
                </div>

                {/* Stats bar */}
                {!subsLoading && submissions.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 16 }}>
                    {[
                      { label: 'Total Attempts', value: String(submissions.length), color: '#7c3aed', bg: '#f5f3ff' },
                      { label: 'Avg Score', value: `${avgScore.toFixed(1)}%`, color: avgScore >= 50 ? '#059669' : '#dc2626', bg: avgScore >= 50 ? '#f0fdf4' : '#fef2f2' },
                      { label: 'Pass Rate', value: `${Math.round((passCount / submissions.length) * 100)}%`, color: '#f59e0b', bg: '#fffbeb' },
                    ].map(s => (
                      <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: '10px 14px' }}>
                        <div style={{ fontSize: 9, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>{s.label}</div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: s.color }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Search */}
                {submissions.length > 0 && (
                  <input
                    type="text" value={subsSearch} onChange={e => setSubsSearch(e.target.value)}
                    placeholder="Search by name, school, class…"
                    style={{ width: '100%', boxSizing: 'border-box', marginTop: 12, padding: '9px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 13, fontFamily: '"DM Sans",sans-serif', outline: 'none' }}
                    onFocus={e => e.target.style.borderColor = '#7c3aed'} onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                  />
                )}
              </div>

              {/* Body */}
              <div style={{ flex: 1, padding: '16px 28px 40px' }}>
                {subsLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #ede9fe', borderTopColor: '#7c3aed', animation: '_spin .8s linear infinite' }} />
                    <p style={{ fontSize: 13, color: '#9ca3af' }}>Loading student results…</p>
                  </div>
                ) : filteredSubs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 0' }}>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
                    <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 17, fontWeight: 700, color: '#111827', marginBottom: 6 }}>
                      {submissions.length === 0 ? 'No submissions yet' : 'No matching students'}
                    </h3>
                    <p style={{ fontSize: 13, color: '#9ca3af' }}>
                      {submissions.length === 0 ? "Students haven't taken this quiz yet." : 'Try a different search.'}
                    </p>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', marginBottom: 12 }}>
                      Showing {filteredSubs.length} of {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
                    </div>
                    {filteredSubs.map((sub, idx) => {
                      const pct = sub.total_possible > 0 ? Math.round((sub.score / sub.total_possible) * 100) : 0
                      const passed = pct >= 50
                      const mins = sub.duration_taken_seconds ? Math.floor(sub.duration_taken_seconds / 60) : null
                      const secs = sub.duration_taken_seconds ? sub.duration_taken_seconds % 60 : null
                      return (
                        <div key={sub.id} className="sub-row" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 12px', borderRadius: 13, marginBottom: 6, background: '#fafafa', border: '1.5px solid #f0eefe', transition: 'background .12s' }}>
                          {/* Rank */}
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: idx === 0 ? '#fbbf24' : idx === 1 ? '#e5e7eb' : idx === 2 ? '#f59e0b' : '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: idx < 3 ? '#fff' : '#7c3aed', flexShrink: 0 }}>
                            {idx + 1}
                          </div>
                          {/* Avatar */}
                          <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                            {(sub.student?.user?.full_name || '?').charAt(0).toUpperCase()}
                          </div>
                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {sub.student?.user?.full_name || 'Unknown Student'}
                            </div>
                            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>
                              {[sub.student?.school?.name, sub.student?.class?.name, sub.student?.student_id].filter(Boolean).join(' · ')}
                            </div>
                            <div style={{ fontSize: 10, color: '#d1d5db', marginTop: 2 }}>
                              Submitted
                              {mins !== null ? ` · ⏱ ${mins}m ${secs}s` : ''}
                            </div>
                          </div>
                          {/* Score */}
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: 16, fontWeight: 900, color: passed ? '#059669' : '#dc2626' }}>{pct}%</div>
                            <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>{sub.score}/{sub.total_possible} pts</div>
                            <div style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: passed ? '#f0fdf4' : '#fef2f2', color: passed ? '#059669' : '#dc2626', marginTop: 3 }}>
                              {passed ? '✓ Pass' : '✗ Fail'}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
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
