import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

// Normalize a question from any stored schema into a unified shape
function normalizeQuestion(q: any): { id: string; questionText: string; options: { id: string; text: string }[]; correctOption: string; points: number; explanation?: string } {
  // Schema A (old guest format): { id, questionText, options: [{id, text}], correctOption }
  if (q.questionText !== undefined && Array.isArray(q.options) && typeof q.options[0] === 'object') {
    return {
      id: q.id,
      questionText: q.questionText,
      options: q.options,
      correctOption: q.correctOption,
      points: q.points || 1,
      explanation: q.explanation,
    }
  }

  // Schema B (GlobalQuizzesPage / AIQuizGenerator): { id, text, options: string[], correctAnswer }
  if (q.text !== undefined && Array.isArray(q.options) && (q.options.length === 0 || typeof q.options[0] === 'string')) {
    const optionObjs = (q.options as string[]).map((o, i) => ({ id: `opt_${q.id}_${i}`, text: o }))
    const correctObj = optionObjs.find(o => o.text === q.correctAnswer)
    return {
      id: q.id,
      questionText: q.text,
      options: optionObjs,
      correctOption: correctObj?.id || optionObjs[0]?.id || '',
      points: q.points || 1,
      explanation: q.explanation,
    }
  }

  // Fallback – passthrough with defaults
  return {
    id: q.id || String(Math.random()),
    questionText: q.questionText || q.text || 'Question',
    options: (q.options || []).map((o: any, i: number) =>
      typeof o === 'string' ? { id: `opt_${i}`, text: o } : o
    ),
    correctOption: q.correctOption || '',
    points: q.points || 1,
    explanation: q.explanation,
  }
}

export default function GuestTakeQuizPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const { data: quiz, isLoading, error } = useQuery({
    queryKey: ['public-quiz', id],
    queryFn: async () => {
      if (!id) throw new Error('No quiz ID')
      const { data, error } = await supabase
        .from('global_quizzes')
        .select(`*, subjects(name)`)
        .eq('id', id)
        .is('school_id', null)
        .eq('is_published', true)
        .single()

      if (error) throw error
      return data
    }
  })

  // Start countdown timer when quiz loads
  useEffect(() => {
    if (!quiz || submitted) return
    if (quiz.duration_minutes && quiz.duration_minutes > 0) {
      setTimeLeft(quiz.duration_minutes * 60)
    }
  }, [quiz?.id])

  useEffect(() => {
    if (timeLeft === null || submitted) return
    if (timeLeft <= 0) {
      handleSubmit(true)
      return
    }
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t === null || t <= 1) {
          clearInterval(timerRef.current!)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current!)
  }, [timeLeft === null ? 'init' : Math.floor((timeLeft || 0) / 60)])

  if (isLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"DM Sans", sans-serif', background: '#f8fafc' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid #ede9fe', borderTopColor: '#7c3aed', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
        <p style={{ color: '#64748b', fontWeight: 600 }}>Loading Quiz...</p>
      </div>
    </div>
  )
  if (error || !quiz) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"DM Sans", sans-serif', background: '#f8fafc' }}>
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😕</div>
        <h2 style={{ color: '#1e0646', marginBottom: '0.5rem' }}>Quiz Not Found</h2>
        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>This quiz may not be published or may no longer exist.</p>
        <Link to="/learn" style={{ background: '#7c3aed', color: 'white', textDecoration: 'none', padding: '0.75rem 1.5rem', borderRadius: 8, fontWeight: 700 }}>← Back to Learning Hub</Link>
      </div>
    </div>
  )

  const rawQuestions: any[] = (quiz.content as any)?.questions || []
  const questions = rawQuestions.map(normalizeQuestion)

  const handleSelect = (questionId: string, optionId: string) => {
    if (submitted) return
    setAnswers(prev => ({ ...prev, [questionId]: optionId }))
  }

  const handleSubmit = (auto = false) => {
    if (submitted) return
    clearInterval(timerRef.current!)
    let calculatedScore = 0
    questions.forEach((q) => {
      if (answers[q.id] === q.correctOption) {
        calculatedScore += q.points || 1
      }
    })
    setScore(calculatedScore)
    setSubmitted(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const maxScore = questions.reduce((acc, q) => acc + (q.points || 1), 0)
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
  const answeredCount = Object.keys(answers).length

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const isTimeCritical = timeLeft !== null && timeLeft <= 60

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: '"DM Sans", system-ui, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=Playfair+Display:wght@700&display=swap');
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.6 } }
        .quiz-option { transition: all 0.18s ease !important; }
        .quiz-option:hover:not(:disabled) { transform: translateX(4px) !important; }
      `}</style>

      {/* ── STICKY HEADER ── */}
      <header style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '0.875rem 0', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: 820, margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
            <button onClick={() => navigate('/learn')} style={{ background: '#f5f3ff', border: '1px solid #ede9fe', color: '#7c3aed', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1rem' }}>←</button>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#1e0646', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{quiz.title}</h1>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>{(quiz.subjects as any)?.name || 'General'} · {questions.length} questions</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
            {/* Timer */}
            {timeLeft !== null && !submitted && (
              <div style={{ background: isTimeCritical ? '#fef2f2' : '#f5f3ff', color: isTimeCritical ? '#dc2626' : '#7c3aed', padding: '0.4rem 0.875rem', borderRadius: 100, fontWeight: 800, fontSize: '0.9rem', border: `1px solid ${isTimeCritical ? '#fecaca' : '#ede9fe'}`, animation: isTimeCritical ? 'pulse 1s infinite' : 'none' }}>
                ⏱ {formatTime(timeLeft)}
              </div>
            )}
            {submitted && (
              <div style={{ background: percentage >= 50 ? '#ecfdf5' : '#fef2f2', color: percentage >= 50 ? '#059669' : '#dc2626', padding: '0.4rem 1rem', borderRadius: 100, fontWeight: 800, fontSize: '0.9rem' }}>
                {score}/{maxScore} ({percentage}%)
              </div>
            )}
            {!submitted && (
              <div style={{ background: '#f8fafc', color: '#64748b', padding: '0.4rem 0.875rem', borderRadius: 100, fontWeight: 700, fontSize: '0.8rem', border: '1px solid #e2e8f0' }}>
                {answeredCount}/{questions.length}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── PROGRESS BAR ── */}
      {!submitted && questions.length > 0 && (
        <div style={{ background: '#e2e8f0', height: 4 }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg, #7c3aed, #a855f7)', width: `${(answeredCount / questions.length) * 100}%`, transition: 'width 0.4s ease', borderRadius: '0 4px 4px 0' }} />
        </div>
      )}

      {/* ── MAIN ── */}
      <main style={{ maxWidth: 820, margin: '0 auto', padding: '2rem 1.5rem 6rem' }}>

        {/* RESULT CARD */}
        {submitted && (
          <div style={{ background: 'white', borderRadius: 20, padding: '3rem 2rem', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', marginBottom: '2.5rem', border: `2px solid ${percentage >= 50 ? '#bbf7d0' : '#fecaca'}`, animation: 'fadeUp 0.4s ease' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{percentage >= 80 ? '🏆' : percentage >= 50 ? '🎉' : '📚'}</div>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#1e0646', marginBottom: '0.5rem', fontFamily: '"Playfair Display", serif' }}>
              {percentage >= 80 ? 'Excellent!' : percentage >= 50 ? 'Quiz Completed!' : 'Keep Practicing!'}
            </h2>
            <p style={{ fontSize: '1.15rem', color: '#64748b', marginBottom: '0.5rem' }}>
              You scored <strong style={{ color: percentage >= 50 ? '#059669' : '#dc2626' }}>{score}</strong> out of <strong>{maxScore}</strong> points
            </p>
            <div style={{ display: 'inline-block', background: percentage >= 50 ? '#ecfdf5' : '#fef2f2', color: percentage >= 50 ? '#059669' : '#dc2626', padding: '0.5rem 1.5rem', borderRadius: 100, fontWeight: 900, fontSize: '1.5rem', marginBottom: '2rem' }}>
              {percentage}%
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => { setSubmitted(false); setAnswers({}); setScore(0); if (quiz.duration_minutes > 0) setTimeLeft(quiz.duration_minutes * 60); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                style={{ background: 'white', border: '1.5px solid #e2e8f0', color: '#1e0646', padding: '0.8rem 1.5rem', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}>
                🔄 Try Again
              </button>
              <Link to="/learn" style={{ background: 'linear-gradient(135deg, #1e0646, #3b0764)', color: 'white', border: 'none', padding: '0.8rem 1.5rem', borderRadius: 10, fontWeight: 700, cursor: 'pointer', textDecoration: 'none', fontSize: '0.95rem' }}>
                ← Back to Hub
              </Link>
            </div>
          </div>
        )}

        {/* INSTRUCTIONS */}
        {!submitted && (
          <div style={{ background: 'white', borderRadius: 14, padding: '1.5rem 2rem', marginBottom: '2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', animation: 'fadeUp 0.3s ease' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ fontSize: '2rem', flexShrink: 0 }}>📋</div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e0646', marginBottom: '0.4rem' }}>Instructions</h3>
                <p style={{ color: '#64748b', lineHeight: 1.6, margin: 0 }}>{quiz.description || 'Answer all questions to the best of your ability. Your results will be shown instantly after submission.'}</p>
              </div>
            </div>
          </div>
        )}

        {/* No questions fallback */}
        {questions.length === 0 && (
          <div style={{ background: 'white', borderRadius: 14, padding: '4rem 2rem', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
            <h3 style={{ color: '#1e0646', marginBottom: '0.5rem' }}>No Questions Found</h3>
            <p style={{ color: '#64748b' }}>This quiz doesn't have any questions yet. Check back later!</p>
          </div>
        )}

        {/* QUESTIONS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {questions.map((q, idx) => (
            <div key={q.id} style={{ background: 'white', borderRadius: 16, border: '1.5px solid #e2e8f0', padding: '2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', animation: `fadeUp 0.3s ease ${idx * 0.05}s both` }}>

              {/* Question number + text */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.8rem', flexShrink: 0, marginTop: 2 }}>
                  {idx + 1}
                </div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e0646', lineHeight: 1.5, margin: 0 }}>
                  {q.questionText}
                </h4>
              </div>

              {/* Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', paddingLeft: '3rem' }}>
                {q.options.map((opt) => {
                  const isSelected = answers[q.id] === opt.id
                  const isCorrect = q.correctOption === opt.id

                  let bg = '#f8fafc'
                  let border = '#e2e8f0'
                  let color = '#334155'
                  let icon = null as React.ReactNode

                  if (submitted) {
                    if (isCorrect) {
                      bg = '#ecfdf5'; border = '#10b981'; color = '#065f46'
                      icon = <span style={{ color: '#10b981', fontWeight: 900, flexShrink: 0 }}>✓</span>
                    } else if (isSelected && !isCorrect) {
                      bg = '#fef2f2'; border = '#ef4444'; color = '#991b1b'
                      icon = <span style={{ color: '#ef4444', fontWeight: 900, flexShrink: 0 }}>✗</span>
                    } else {
                      bg = '#f8fafc'; border = '#e2e8f0'
                    }
                  } else if (isSelected) {
                    bg = '#f5f3ff'; border = '#7c3aed'; color = '#4c1d95'
                  }

                  return (
                    <button
                      key={opt.id}
                      className="quiz-option"
                      onClick={() => handleSelect(q.id, opt.id)}
                      disabled={submitted}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.875rem',
                        background: bg, border: `2px solid ${border}`,
                        padding: '0.875rem 1.125rem', borderRadius: 10, cursor: submitted ? 'default' : 'pointer',
                        textAlign: 'left', color, width: '100%',
                      }}
                    >
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%',
                        border: `2px solid ${isSelected || (submitted && isCorrect) ? border : '#cbd5e1'}`,
                        background: isSelected || (submitted && isCorrect) ? border : 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        {(isSelected || (submitted && isCorrect)) && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />}
                      </div>
                      {icon}
                      <span style={{ fontSize: '0.975rem', fontWeight: isSelected ? 700 : 500, lineHeight: 1.4, flex: 1 }}>{opt.text}</span>
                    </button>
                  )
                })}
              </div>

              {/* Explanation after submit */}
              {submitted && q.explanation && (
                <div style={{ marginTop: '1rem', marginLeft: '3rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '0.75rem 1rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.05em' }}>💡 Explanation</span>
                  <p style={{ fontSize: '0.9rem', color: '#92400e', margin: '0.25rem 0 0', lineHeight: 1.5 }}>{q.explanation}</p>
                </div>
              )}

              {/* Points badge */}
              <div style={{ marginTop: '1rem', marginLeft: '3rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', background: '#f1f5f9', padding: '2px 8px', borderRadius: 100 }}>{q.points} {q.points === 1 ? 'point' : 'points'}</span>
              </div>
            </div>
          ))}
        </div>

        {/* SUBMIT BUTTON */}
        {!submitted && questions.length > 0 && (
          <div style={{ marginTop: '3rem', textAlign: 'center' }}>
            <button
              onClick={() => handleSubmit()}
              disabled={answeredCount === 0}
              style={{
                background: answeredCount > 0 ? 'linear-gradient(135deg, #1e0646, #3b0764)' : '#cbd5e1',
                color: 'white', border: 'none', padding: '1rem 3rem', borderRadius: 12,
                fontSize: '1.05rem', fontWeight: 800, cursor: answeredCount > 0 ? 'pointer' : 'not-allowed',
                boxShadow: answeredCount > 0 ? '0 4px 20px rgba(30,6,70,0.35)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              {answeredCount < questions.length ? `Submit Quiz (${answeredCount}/${questions.length} answered)` : '🎯 Submit Quiz'}
            </button>
            {answeredCount > 0 && answeredCount < questions.length && (
              <p style={{ fontSize: '0.85rem', color: '#f59e0b', marginTop: '0.75rem', fontWeight: 600 }}>
                ⚠ You have {questions.length - answeredCount} unanswered question{questions.length - answeredCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
