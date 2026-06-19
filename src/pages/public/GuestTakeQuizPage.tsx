import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

export default function GuestTakeQuizPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)

  const { data: quiz, isLoading, error } = useQuery({
    queryKey: ['public-quiz', id],
    queryFn: async () => {
      if (!id) throw new Error('No quiz ID')
      const { data, error } = await supabase
        .from('global_quizzes')
        .select(`*`)
        .eq('id', id)
        .is('school_id', null)
        .eq('is_published', true)
        .single()

      if (error) throw error
      return data
    }
  })

  if (isLoading) return <div style={{ padding: '4rem', textAlign: 'center', fontFamily: '"DM Sans", sans-serif' }}>Loading Quiz...</div>
  if (error || !quiz) return <div style={{ padding: '4rem', textAlign: 'center', fontFamily: '"DM Sans", sans-serif' }}>Quiz not found or not available.</div>

  const questions = (quiz.content as any)?.questions || []

  const handleSelect = (questionId: string, optionId: string) => {
    if (submitted) return
    setAnswers(prev => ({ ...prev, [questionId]: optionId }))
  }

  const handleSubmit = () => {
    if (submitted) return
    let calculatedScore = 0
    questions.forEach((q: any) => {
      if (answers[q.id] === q.correctOption) {
        calculatedScore += q.points || 1
      }
    })
    setScore(calculatedScore)
    setSubmitted(true)
  }

  const maxScore = questions.reduce((acc: number, q: any) => acc + (q.points || 1), 0)
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)', fontFamily: '"DM Sans", system-ui, sans-serif' }}>
      {/* ── HEADER ── */}
      <header style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '1rem 0', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={() => navigate('/learn')} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e0646', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
              ←
            </button>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#1e0646' }}>{quiz.title}</h1>
          </div>
          {submitted && (
            <div style={{ background: percentage >= 50 ? '#ecfdf5' : '#fef2f2', color: percentage >= 50 ? '#059669' : '#dc2626', padding: '0.4rem 1rem', borderRadius: 100, fontWeight: 800, fontSize: '0.9rem' }}>
              {score} / {maxScore} ({percentage}%)
            </div>
          )}
        </div>
      </header>

      {/* ── QUIZ CONTENT ── */}
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '3rem 1.5rem 6rem' }}>
        {submitted ? (
          <div style={{ background: 'white', borderRadius: 16, padding: '3rem 2rem', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', marginBottom: '3rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{percentage >= 50 ? '🎉' : '📚'}</div>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#1e0646', marginBottom: '0.5rem' }}>
              Quiz Completed!
            </h2>
            <p style={{ fontSize: '1.1rem', color: '#64748b', marginBottom: '2rem' }}>
              You scored {score} out of {maxScore} points.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={() => { setSubmitted(false); setAnswers({}); setScore(0); window.scrollTo({ top: 0, behavior: 'smooth' }) }} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e0646', padding: '0.8rem 1.5rem', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                Try Again
              </button>
              <Link to="/learn" style={{ background: '#1e0646', color: 'white', border: 'none', padding: '0.8rem 1.5rem', borderRadius: 8, fontWeight: 700, cursor: 'pointer', textDecoration: 'none' }}>
                Back to Learning Hub
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: 12, padding: '2rem', marginBottom: '2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e0646', marginBottom: '0.5rem' }}>Instructions</h3>
            <p style={{ color: '#64748b', lineHeight: 1.6 }}>{quiz.description || 'Answer all questions to the best of your ability. Your results will be shown instantly.'}</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {questions.map((q: any, idx: number) => (
            <div key={q.id} style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: '2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e0646', marginBottom: '1.5rem', lineHeight: 1.4 }}>
                <span style={{ color: '#7c3aed', marginRight: '0.5rem' }}>{idx + 1}.</span> {q.questionText}
              </h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {q.options?.map((opt: any) => {
                  const isSelected = answers[q.id] === opt.id;
                  const isCorrect = q.correctOption === opt.id;
                  
                  let bg = 'white';
                  let borderColor = '#e2e8f0';
                  let color = '#334155';
                  
                  if (submitted) {
                    if (isCorrect) {
                      bg = '#ecfdf5';
                      borderColor = '#10b981';
                      color = '#065f46';
                    } else if (isSelected && !isCorrect) {
                      bg = '#fef2f2';
                      borderColor = '#ef4444';
                      color = '#991b1b';
                    } else {
                      bg = '#f8fafc';
                    }
                  } else if (isSelected) {
                    bg = '#f5f3ff';
                    borderColor = '#7c3aed';
                    color = '#4c1d95';
                  }

                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelect(q.id, opt.id)}
                      disabled={submitted}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: '1rem',
                        background: bg, border: `2px solid ${borderColor}`,
                        padding: '1rem 1.25rem', borderRadius: 8, cursor: submitted ? 'default' : 'pointer',
                        textAlign: 'left', transition: 'all 0.2s', color
                      }}
                    >
                      <div style={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${isSelected || isCorrect ? borderColor : '#cbd5e1'}`, background: isSelected || (submitted && isCorrect) ? borderColor : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                        {(isSelected || (submitted && isCorrect)) && <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'white' }} />}
                      </div>
                      <span style={{ fontSize: '1.05rem', fontWeight: isSelected || (submitted && isCorrect) ? 700 : 500, lineHeight: 1.4 }}>{opt.text}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {!submitted && (
          <div style={{ marginTop: '3rem', textAlign: 'center' }}>
            <button
              onClick={handleSubmit}
              disabled={Object.keys(answers).length === 0}
              style={{
                background: Object.keys(answers).length > 0 ? '#1e0646' : '#cbd5e1',
                color: 'white', border: 'none', padding: '1rem 3rem', borderRadius: 8,
                fontSize: '1.1rem', fontWeight: 800, cursor: Object.keys(answers).length > 0 ? 'pointer' : 'not-allowed',
                boxShadow: Object.keys(answers).length > 0 ? '0 4px 15px rgba(30,6,70,0.3)' : 'none'
              }}
            >
              Submit Quiz
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
