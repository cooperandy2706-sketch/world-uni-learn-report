import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import confetti from 'canvas-confetti'

interface Question {
  id: string
  text: string
  type: 'mcq' | 'tf' | 'short'
  options: string[]
  correctAnswer: string
  points: number
}

function getFeedbackMessage(pct: number) {
  if (pct >= 90) return { title: 'Incredible! 🏆', msg: 'You absolutely crushed this global challenge! Fantastic work.', color: '#059669', bg: '#d1fae5' }
  if (pct >= 80) return { title: 'Excellent Work! 🌟', msg: 'Great job! You have a very strong understanding of this material.', color: '#059669', bg: '#ecfdf5' }
  if (pct >= 60) return { title: 'Good Effort! 👍', msg: 'You passed. Review your mistakes below to perfect it!', color: '#d97706', bg: '#fef3c7' }
  if (pct >= 40) return { title: 'Almost There! 🧗‍♂️', msg: 'Review the answers and try to understand what went wrong.', color: '#ea580c', bg: '#ffedd5' }
  return { title: 'Needs Review 📚', msg: 'Study the material and review the correct answers below.', color: '#dc2626', bg: '#fee2e2' }
}

export default function TeacherTakeGlobalQuizPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [quiz, setQuiz] = useState<any>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<'loading' | 'prep' | 'active' | 'finished'>('loading')
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [score, setScore] = useState({ earned: 0, total: 0 })
  
  const hasTriggeredConfetti = useRef(false)

  useEffect(() => {
    if (id) loadQuiz()
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

  // Fire confetti only once when we enter finished state
  useEffect(() => {
    if (status === 'finished' && !hasTriggeredConfetti.current) {
      hasTriggeredConfetti.current = true
      const pct = score.total > 0 ? (score.earned / score.total) * 100 : 0
      
      if (pct >= 80) {
        // Heavy multi-burst confetti
        const end = Date.now() + 2.5 * 1000
        const colors = ['#7c3aed', '#fbbf24', '#10b981', '#ef4444']
        ;(function frame() {
          confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors })
          confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors })
          if (Date.now() < end) requestAnimationFrame(frame)
        }())
      } else if (pct >= 50) {
        // Single quick burst
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
      }
    }
  }, [status, score])

  async function loadQuiz() {
    try {
      const { data, error } = await supabase
        .from('global_quizzes')
        .select('*, subject:subjects(name)')
        .eq('id', id)
        .single()

      if (error) throw error
      
      setQuiz(data)
      let qs: Question[] = data.content.questions || []
      // We don't shuffle for teachers so they see it in created order
      setQuestions(qs)
      setStatus('prep')
    } catch (err: any) {
      toast.error('Could not load global quiz')
      navigate('/teacher/assignments')
    }
  }

  function startQuiz() {
    setStatus('active')
    if (quiz.duration_minutes > 0) {
      setTimeLeft(quiz.duration_minutes * 60)
    }
  }

  function handleSelect(qId: string, answer: string) {
    setUserAnswers(prev => ({ ...prev, [qId]: answer }))
  }

  async function handleFinish(isAuto = false) {
    if (!isAuto && !confirm('Submit your preview answers? (This will not be recorded)')) return
    
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

    setScore({ earned, total })
    setStatus('finished')
    toast.success(isAuto ? 'Time up! Quiz finished automatically.' : 'Preview completed!')
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  // -------------------------------------------------------------
  // RENDERING
  // -------------------------------------------------------------

  if (status === 'loading') return <div style={{ textAlign: 'center', padding: '100px' }}>Loading Challenge...</div>

  // PREP SCREEN
  if (status === 'prep') {
    return (
      <div style={{ maxWidth: 640, margin: '60px auto', background: '#fff', borderRadius: 24, padding: 40, border: '1.5px solid #f0eefe', textAlign: 'center', boxShadow: '0 20px 50px rgba(109,40,217,0.1)' }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#f59e0b', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>🌏 Teacher Preview</div>
        <div style={{ fontSize: 54, marginBottom: 20 }}>👁️</div>
        <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 32, fontWeight: 700, color: '#111827', marginBottom: 12 }}>{quiz.title}</h1>
        <p style={{ fontSize: 15, color: '#6b7280', marginBottom: 32, lineHeight: 1.6 }}>{quiz.description || 'Preview this global interactive quiz.'} <br/> <strong style={{color: '#7c3aed'}}>Note:</strong> Preview submissions are not recorded to the database.</p>
        
        <div className="resp-2col-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 40 }}>
          <div style={{ background: '#f5f3ff', borderRadius: 16, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 4 }}>Questions</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#7c3aed' }}>{questions.length} Items</div>
          </div>
          <div style={{ background: '#f5f3ff', borderRadius: 16, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 4 }}>Time Limit</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#f59e0b' }}>{quiz.duration_minutes > 0 ? `${quiz.duration_minutes} Mins` : 'Unlimited'}</div>
          </div>
        </div>

        <button onClick={startQuiz} style={{ 
          width: '100%', padding: '18px', background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: '#fff', 
          border: 'none', borderRadius: 16, fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 24px rgba(109,40,217,0.3)', transition: 'transform 0.2s'
        }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
          🚀 Start Preview
        </button>
      </div>
    )
  }

  // FINISHED SCREEN (INTERACTIVE REVIEW)
  if (status === 'finished') {
    const pct = score.total > 0 ? (score.earned / score.total) * 100 : 0
    const feedback = getFeedbackMessage(pct)

    return (
      <div style={{ maxWidth: 700, margin: '40px auto 100px', fontFamily: '"DM Sans",sans-serif' }}>
        {/* Results Banner */}
        <div style={{ background: feedback.bg, borderRadius: 24, padding: '40px 30px', textAlign: 'center', marginBottom: 40, border: `2px solid ${feedback.color}30` }}>
          <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 32, fontWeight: 800, color: feedback.color, marginBottom: 12, marginTop: 0 }}>{feedback.title}</h1>
          <p style={{ fontSize: 15, color: `${feedback.color}cc`, marginBottom: 32, maxWidth: 500, margin: '0 auto 32px' }}>{feedback.msg}</p>
          
          <div style={{ display: 'inline-flex', alignItems: 'center', background: '#fff', borderRadius: 20, padding: '20px 40px', boxShadow: `0 12px 30px ${feedback.color}20` }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Final Score</div>
              <div style={{ fontSize: 48, fontWeight: 900, color: feedback.color, lineHeight: 1 }}>{score.earned} <span style={{ fontSize: 24, color: '#d1d5db' }}>/ {score.total}</span></div>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 30 }}>
            <button onClick={() => navigate('/teacher/assignments')} style={{ padding: '12px 24px', background: '#111827', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
              ⬅ Back to Assignments
            </button>
        </div>

        {/* Detailed Review Module */}
        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 20, paddingLeft: 8 }}>📝 Answer Breakdown</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {questions.map((q, i) => {
            const userAnswer = (userAnswers[q.id] || '').trim().toLowerCase()
            const correctAns = q.correctAnswer.trim().toLowerCase()
            const isCorrect = userAnswer === correctAns

            return (
              <div key={q.id} style={{ background: '#fff', border: `1.5px solid ${isCorrect ? '#a7f3d0' : '#fecaca'}`, borderRadius: 16, padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 6, background: isCorrect ? '#10b981' : '#ef4444' }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase' }}>Question {i + 1}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: isCorrect ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {isCorrect ? '✅ Correct' : '❌ Incorrect'}
                    <span style={{ color: '#d1d5db' }}>•</span>
                    <span style={{ color: isCorrect ? '#10b981' : '#9ca3af' }}>{isCorrect ? q.points : 0}/{q.points} pt</span>
                  </div>
                </div>

                <h4 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: '0 0 16px 0', lineHeight: 1.4 }}>{q.text}</h4>

                <div className="resp-2col-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 12, background: '#f9fafb', padding: 14, borderRadius: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 6 }}>Your Answer</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: isCorrect ? '#059669' : '#dc2626' }}>
                      {userAnswers[q.id] || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>No Answer</span>}
                    </div>
                  </div>
                  {!isCorrect && (
                    <div style={{ borderLeft: '1px solid #e5e7eb', paddingLeft: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 6 }}>Correct Answer</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#059669' }}>{q.correctAnswer}</div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ACTIVE QUIZ INTERFACE
  const q = questions[currentIdx]
  const progress = ((currentIdx + 1) / questions.length) * 100

  return (
    <>
      <style>{`
        @keyframes _fade { from{opacity:0;transform:scale(0.98)} to{opacity:1;transform:scale(1)} }
        .option-btn { transition: all 0.2s; border: 1.5px solid #e5e7eb; border-radius: 12px; padding: 16px 20px; margin-bottom: 12px; display: flex; align-items: center; gap: 16px; cursor: pointer; background: #fff; width: 100%; text-align: left; font-family: inherit; font-size: 15px; font-weight: 500; color: #374151; }
        .option-btn:hover { border-color: #7c3aed; background: #faf5ff; transform: translateX(4px); }
        .option-btn.selected { border-color: #7c3aed; background: #f5f3ff; box-shadow: 0 4px 14px rgba(109,40,217,0.12); color: #6d28d9; font-weight: 700; border-width: 2px; }
        @media (max-width: 768px) {
          .resp-2col-grid { grid-template-columns: 1fr !important; }
          .resp-flex-header { flex-direction: column !important; align-items: stretch !important; gap: 16px !important; }
        }
      `}</style>

      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1.5px solid #f0eefe', padding: '14px 0' }}>
        <div className="resp-flex-header" style={{ maxWidth: 800, margin: '0 auto', padding: '0 20px', display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>🌍 Teacher Preview</div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>{quiz.title}</h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {timeLeft !== null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: timeLeft < 60 ? '#fef2f2' : '#fff', borderRadius: 99, border: `1.5px solid ${timeLeft < 60 ? '#f87171' : '#e5e7eb'}`, transition: 'all 0.3s' }}>
                <span style={{ fontSize: 14 }}>⏱️</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: timeLeft < 60 ? '#dc2626' : '#374151', fontFamily: 'monospace' }}>{formatTime(timeLeft)}</span>
              </div>
            )}
            <button onClick={() => handleFinish()} style={{ background: '#111827', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e=>e.currentTarget.style.background='#374151'} onMouseOut={e=>e.currentTarget.style.background='#111827'}>
              Finish Preview
            </button>
          </div>
        </div>
        <div style={{ height: 4, background: '#ede9fe', width: '100%', marginTop: 14 }}>
           <div style={{ height: '100%', background: 'linear-gradient(90deg, #f59e0b, #7c3aed)', width: `${progress}%`, transition: 'width 0.4s cubic-bezier(.4,0,.2,1)' }} />
        </div>
      </div>

      <div style={{ maxWidth: 650, margin: '50px auto 80px', padding: '0 20px', animation: '_fade 0.3s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ background: '#f5f3ff', color: '#7c3aed', fontWeight: 800, fontSize: 12, padding: '6px 12px', borderRadius: 99 }}>
            Q {currentIdx + 1} / {questions.length}
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#d1d5db' }}>•</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#9ca3af' }}>{q.points} Points</div>
        </div>

        <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 26, fontWeight: 700, color: '#111827', marginBottom: 36, lineHeight: 1.4 }}>{q.text}</h1>

        <div style={{ marginBottom: 44 }}>
           {q.type === 'mcq' && q.options.map((opt: string, i: number) => (
             <button key={i} className={`option-btn ${userAnswers[q.id] === opt ? 'selected' : ''}`} onClick={() => handleSelect(q.id, opt)}>
                <span style={{ width: 28, height: 28, borderRadius: '50%', background: userAnswers[q.id] === opt ? '#7c3aed' : '#f3f4f6', color: userAnswers[q.id] === opt ? '#fff' : '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, transition: 'all 0.2s' }}>
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
             </button>
           ))}

           {q.type === 'tf' && (
             <div className="resp-2col-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {['True', 'False'].map(opt => (
                  <button key={opt} className={`option-btn ${userAnswers[q.id] === opt ? 'selected' : ''}`} onClick={() => handleSelect(q.id, opt)} style={{ height: 100, flexDirection: 'column', justifyContent: 'center', gap: 10, fontSize: 20 }}>
                    <div style={{ fontSize: 32 }}>{opt === 'True' ? '✅' : '❌'}</div> 
                    <div style={{ fontWeight: 700 }}>{opt}</div>
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
                style={{ width: '100%', padding: '20px 24px', fontSize: 18, border: '2px solid #7c3aed', borderRadius: 16, outline: 'none', background: '#faf5ff', boxShadow: 'inset 0 2px 4px rgba(109,40,217,0.05)', color: '#4c1d95', fontWeight: 600 }}
             />
           )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px dashed #f3f4f6', paddingTop: 24 }}>
          <button 
            disabled={currentIdx === 0} 
            onClick={() => setCurrentIdx(prev => prev - 1)}
            style={{ padding: '12px 24px', border: '1.5px solid #e5e7eb', background: currentIdx === 0 ? '#f9fafb' : '#fff', borderRadius: 12, fontSize: 14, fontWeight: 700, color: currentIdx === 0 ? '#d1d5db' : '#4b5563', cursor: currentIdx === 0 ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
          >← Previous</button>
          
          {currentIdx < questions.length - 1 ? (
             <button 
              onClick={() => setCurrentIdx(prev => prev + 1)}
              style={{ padding: '12px 32px', border: 'none', background: '#7c3aed', color: '#fff', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(109,40,217,0.3)', transition: 'transform 0.2s' }}
              onMouseOver={e=>e.currentTarget.style.transform='translateY(-2px)'} onMouseOut={e=>e.currentTarget.style.transform='translateY(0)'}
            >Next ➞</button>
          ) : (
            <button 
              onClick={() => handleFinish()}
              style={{ padding: '12px 32px', border: 'none', background: '#10b981', color: '#fff', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(16,185,129,0.3)', transition: 'transform 0.2s' }}
              onMouseOver={e=>e.currentTarget.style.transform='translateY(-2px)'} onMouseOut={e=>e.currentTarget.style.transform='translateY(0)'}
            >✨ Finish Preview</button>
          )}
        </div>
      </div>
    </>
  )
}
