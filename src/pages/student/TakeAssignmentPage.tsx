// src/pages/student/TakeAssignmentPage.tsx
import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'

interface Question {
  id: string
  text: string
  type: 'mcq' | 'tf' | 'short'
  options: string[]
  correctAnswer: string
  points: number
}

export default function TakeAssignmentPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [assignment, setAssignment] = useState<any>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<'loading' | 'prep' | 'active' | 'finished'>('loading')
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [score, setScore] = useState({ earned: 0, total: 0 })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    if (id) loadAssignment()
  }, [id])

  useEffect(() => {
    let timer: any
    if (status === 'active' && timeLeft !== null && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev !== null && prev <= 1) {
            clearInterval(timer)
            handleFinish(true) // Auto-submit
            return 0
          }
          return (prev ?? 0) - 1
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [status, timeLeft])

  async function loadAssignment() {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*, subject:subjects(name)')
        .eq('id', id)
        .single()

      if (error) throw error
      
      // Check if already submitted
      const { data: student } = await supabase.from('students').select('id').eq('user_id', user!.id).single()
      const { data: sub } = await supabase
        .from('assignment_submissions')
        .select('id')
        .eq('assignment_id', id)
        .eq('student_id', student!.id)
        .single()

      if (sub) {
        toast.error('You have already completed this assignment')
        navigate('/student/assignments')
        return
      }

      setAssignment(data)
      let qs = data.content.questions || []
      if (data.shuffle_questions) {
        qs = [...qs].sort(() => Math.random() - 0.5)
      }
      setQuestions(qs)
      setStatus('prep')
    } catch (err: any) {
      toast.error('Could not load assignment')
      navigate('/student/assignments')
    }
  }

  function startQuiz() {
    setStatus('active')
    startTimeRef.current = Date.now()
    if (assignment.duration_minutes > 0) {
      setTimeLeft(assignment.duration_minutes * 60)
    }
  }

  function handleSelect(qId: string, answer: string) {
    setUserAnswers(prev => ({ ...prev, [qId]: answer }))
  }

  async function handleFinish(isAuto = false) {
    if (!isAuto && !confirm('Are you sure you want to submit your answers?')) return
    
    setIsSubmitting(true)
    try {
      const { data: student } = await supabase.from('students').select('id').eq('user_id', user!.id).single()
      
      // 1. Calculate Score
      let earned = 0
      let total = 0
      questions.forEach(q => {
        total += q.points
        const userAni = (userAnswers[q.id] || '').trim().toLowerCase()
        const correctAni = q.correctAnswer.trim().toLowerCase()
        if (userAni === correctAni) {
          earned += q.points
        }
      })

      const durationTaken = Math.floor((Date.now() - startTimeRef.current) / 1000)

      // 2. Submit
      const { error } = await supabase.from('assignment_submissions').insert({
        assignment_id: id,
        student_id: student!.id,
        answers: userAnswers,
        score: earned,
        total_possible: total,
        duration_taken_seconds: durationTaken
      })

      if (error) throw error

      setScore({ earned, total })
      setStatus('finished')
      toast.success(isAuto ? 'Time up! Quiz submitted automatically.' : 'Assignment submitted successfully!')
    } catch (err: any) {
      toast.error('Submission failed: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  if (status === 'loading') return <div style={{ textAlign: 'center', padding: '100px' }}>Loading...</div>

  if (status === 'prep') {
    return (
      <div style={{ maxWidth: 600, margin: '60px auto', background: '#fff', borderRadius: 24, padding: 40, border: '1.5px solid #f0eefe', textAlign: 'center', boxShadow: '0 20px 50px rgba(109,40,217,0.1)' }}>
        <style>{`@media (max-width: 640px) { .resp-grid-2 { grid-template-columns: 1fr !important; } }`}</style>
        <div style={{ fontSize: 48, marginBottom: 20 }}>🎯</div>
        <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 28, fontWeight: 700, color: '#111827', marginBottom: 12 }}>{assignment.title}</h1>
        <p style={{ fontSize: 15, color: '#6b7280', marginBottom: 32, lineHeight: 1.6 }}>{assignment.description || 'Follow instructions and complete all questions to the best of your ability.'}</p>
        
        <div className="resp-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 40 }}>
          <div style={{ background: '#f5f3ff', borderRadius: 16, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 4 }}>Questions</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#7c3aed' }}>{questions.length} Items</div>
          </div>
          <div style={{ background: '#f5f3ff', borderRadius: 16, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 4 }}>Time Limit</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#f59e0b' }}>{assignment.duration_minutes > 0 ? `${assignment.duration_minutes} Minutes` : 'Unlimited'}</div>
          </div>
        </div>

        <button onClick={startQuiz} style={{ 
          width: '100%', padding: '16px', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', 
          border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 20px rgba(109,40,217,0.3)'
        }}>Start My Assignment</button>
      </div>
    )
  }

  if (status === 'finished') {
    return (
      <div style={{ maxWidth: 500, margin: '80px auto', background: '#fff', borderRadius: 24, padding: 40, border: '1.5px solid #f0eefe', textAlign: 'center', boxShadow: '0 20px 50px rgba(16,185,129,0.1)' }}>
        <div style={{ width: 80, height: 80, background: '#ecfdf5', borderRadius: '50%', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, margin: '0 auto 24px' }}>✨</div>
        <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 28, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Well Done!</h1>
        <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 32 }}>You have successfully completed your assignment.</p>
        
        <div style={{ background: 'linear-gradient(135deg,#f0fdf4,#d1fae5)', borderRadius: 20, padding: '30px 20px', marginBottom: 32 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Your Final Score</div>
          <div style={{ fontSize: 48, fontWeight: 900, color: '#065f46' }}>{score.earned} / {score.total}</div>
        </div>

        <button onClick={() => navigate('/student/assignments')} style={{ 
          width: '100%', padding: '14px', background: '#374151', color: '#fff', 
          border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer'
        }}>Back to Assignments</button>
      </div>
    )
  }

  // Active View
  const q = questions[currentIdx]
  const progress = ((currentIdx + 1) / questions.length) * 100

  return (
    <>
      <style>{`
        @keyframes _fade { from{opacity:0;transform:scale(0.98)} to{opacity:1;transform:scale(1)} }
        .option-btn { transition: all 0.2s; border: 1.5px solid #e5e7eb; border-radius: 12px; padding: 14px 18px; margin-bottom: 10px; display: flex; align-items: center; gap: 12px; cursor: pointer; background: #fff; width: 100%; text-align: left; font-family: inherit; font-size: 14px; font-weight: 500; color: #374151; }
        .option-btn:hover { border-color: #7c3aed; background: #f5f3ff; }
        .option-btn.selected { border-color: #7c3aed; background: #f5f3ff; box-shadow: 0 0 0 3px rgba(109,40,217,0.1); color: #7c3aed; font-weight: 700; }
        @media (max-width: 640px) { .resp-grid-2 { grid-template-columns: 1fr !important; } }
      `}</style>

      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1.5px solid #f0eefe', padding: '12px 0' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 20px', display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase' }}>{assignment.subject?.name}</div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>{assignment.title}</h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {timeLeft !== null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: timeLeft < 60 ? '#fef2f2' : '#fff', borderRadius: 99, border: `1.5px solid ${timeLeft < 60 ? '#f87171' : '#e5e7eb'}` }}>
                <span style={{ fontSize: 14 }}>⏱️</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: timeLeft < 60 ? '#dc2626' : '#374151', fontFamily: 'monospace' }}>{formatTime(timeLeft)}</span>
              </div>
            )}
            <button onClick={() => handleFinish()} disabled={isSubmitting} style={{ background: '#111827', color: '#fff', border: 'none', borderRadius: 9, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Finish Quiz</button>
          </div>
        </div>
        <div style={{ height: 4, background: '#ede9fe', width: '100%', marginTop: 12 }}>
           <div style={{ height: '100%', background: 'linear-gradient(90deg, #7c3aed, #fbbf24)', width: `${progress}%`, transition: 'width 0.3s ease' }} />
        </div>
      </div>

      <div style={{ maxWidth: 650, margin: '40px auto', padding: '0 20px', animation: '_fade 0.3s ease' }}>
        <p style={{ fontSize: 13, fontWeight: 800, color: '#9ca3af', marginBottom: 8, textTransform: 'uppercase' }}>Question {currentIdx + 1} of {questions.length}</p>
        <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 32, lineHeight: 1.4 }}>{q.text}</h1>

        <div style={{ marginBottom: 40 }}>
           {q.type === 'mcq' && q.options.map((opt, i) => (
             <button key={i} className={`option-btn ${userAnswers[q.id] === opt ? 'selected' : ''}`} onClick={() => handleSelect(q.id, opt)}>
                <span style={{ width: 24, height: 24, borderRadius: '50%', background: userAnswers[q.id] === opt ? '#7c3aed' : '#f3f4f6', color: userAnswers[q.id] === opt ? '#fff' : '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>{String.fromCharCode(65 + i)}</span>
                {opt}
             </button>
           ))}

           {q.type === 'tf' && (
             <div className="resp-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {['True', 'False'].map(opt => (
                  <button key={opt} className={`option-btn ${userAnswers[q.id] === opt ? 'selected' : ''}`} onClick={() => handleSelect(q.id, opt)} style={{ height: 80, justifyContent: 'center', fontSize: 18 }}>
                    {opt === 'True' ? '✅' : '❌'} {opt}
                  </button>
                ))}
             </div>
           )}

           {q.type === 'short' && (
             <input
                type="text"
                autoFocus
                placeholder="Type your answer here..."
                value={userAnswers[q.id] || ''}
                onChange={e => handleSelect(q.id, e.target.value)}
                style={{ width: '100%', padding: '16px 20px', fontSize: 16, border: '2px solid #7c3aed', borderRadius: 14, outline: 'none', background: '#faf5ff' }}
             />
           )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button 
            disabled={currentIdx === 0} 
            onClick={() => setCurrentIdx(prev => prev - 1)}
            style={{ padding: '10px 24px', border: '1.5px solid #e5e7eb', background: '#fff', borderRadius: 9, fontWeight: 700, color: '#6b7280', cursor: currentIdx === 0 ? 'not-allowed' : 'pointer' }}
          >← Previous</button>
          
          {currentIdx < questions.length - 1 ? (
             <button 
              onClick={() => setCurrentIdx(prev => prev + 1)}
              style={{ padding: '10px 24px', border: 'none', background: '#7c3aed', color: '#fff', borderRadius: 9, fontWeight: 700, cursor: 'pointer' }}
            >Next Question →</button>
          ) : (
            <button 
              onClick={() => handleFinish()}
              disabled={isSubmitting}
              style={{ padding: '10px 24px', border: 'none', background: '#10b981', color: '#fff', borderRadius: 9, fontWeight: 700, cursor: 'pointer' }}
            >Finish & Submit</button>
          )}
        </div>
      </div>
    </>
  )
}
