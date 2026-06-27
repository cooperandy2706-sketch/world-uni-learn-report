import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

const CHAT_REMARKS = [
  "Nice choice! 🚀",
  "You're on fire! 🔥",
  "Great selection! 🌟",
  "Got it! 🧠",
  "Locked in! 🎯",
  "Good one! 👏",
  "Awesome! ✨",
  "Keep it up! 💪",
  "Brilliant! 💡",
  "You got this! 🏆",
  "Nailed it! 🔨",
  "Spot on! 🎯",
  "Genius move! 🤯",
  "Smooth! 🏄‍♂️",
  "Cooking! 👨‍🍳",
  "Let's go! 🏎️",
  "Perfect! 👌",
  "Big brain energy! 🧠⚡",
  "Ooo, confident! 😎",
  "I see you! 👀",
  "Taking notes! 📝",
  "Solid pick! 🧱",
  "Absolutely smashing! 💥",
  "Top tier answer! 👑",
  "No hesitation! ⚡",
  "You're making this look easy! 🏄‍♀️",
  "That's the spirit! 🎉",
  "Masterclass! 🎓",
  "A+ energy! ⭐",
  "We love to see it! 🤩",
  "Boom! 💥",
  "Expert level! 🥇",
  "Unstoppable! 🚂",
  "Level up! 🆙",
  "Flawless! 💎",
  "In the zone! 🌀",
  "Easy peasy! 🍋",
  "Elite! 🦅",
  "Too good! 🤌",
  "Legendary! 🐉",
  "Big W! 🏆",
  "On point! 🎯",
  "Spectacular! 🎇",
  "100% focused! 💯",
  "Sharp! 🔪",
  "You dropped this 👑",
  "Absolutely goated! 🐐",
  "They're not ready for you! 😤",
  "A natural! 🌱",
  "Just warming up! 🏃",
  "Untouchable! 🛡️",
  "Nothing can stop you! 🚀",
  "Too fast, too furious! 🏎️💨",
  "Simply magical! 🪄",
  "Crushing it! 🦍",
  "Mind-blowing! 🤯",
  "You're a wizard! 🧙‍♂️",
  "Straight up genius! 🧠📈",
  "Excellence! 🌟",
  "Pro gamer move! 🎮",
  "That's how it's done! 👏",
  "Built different! 🏗️",
  "Calculated! 🧮"
]

export default function WAECExamSession() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [activeSection, setActiveSection] = useState<'A' | 'B'>('A')
  const [objAnswers, setObjAnswers] = useState<Record<string, string>>({})
  const [subjAnswers, setSubjAnswers] = useState<Record<string, string>>({})
  const [selectedSubjQuestions, setSelectedSubjQuestions] = useState<Record<string, boolean>>({})
  const [toastRemark, setToastRemark] = useState<{ text: string, id: number, type: 'A' | 'B' } | null>(null)
  const remarkCounter = useRef(0)
  
  const [submitted, setSubmitted] = useState(false)
  const [objScore, setObjScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const { data: exam, isLoading, error } = useQuery({
    queryKey: ['waec-exam', id],
    queryFn: async () => {
      if (!id) throw new Error('No exam ID')
      const { data, error } = await supabase
        .from('global_quizzes')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    }
  })

  useEffect(() => {
    if (!exam || submitted) return
    if (exam.duration_minutes && exam.duration_minutes > 0) {
      setTimeLeft(exam.duration_minutes * 60)
    }
  }, [exam?.id])

  useEffect(() => {
    if (timeLeft === null || submitted) return
    if (timeLeft <= 0) {
      handleSubmit()
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', fontFamily: '"DM Sans", sans-serif' }}>
      <div style={{ width: 40, height: 40, border: '3px solid #ede9fe', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  )

  if (error || !exam || !exam.content?.sections) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', fontFamily: '"DM Sans", sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ color: '#1e0646', marginBottom: '1rem' }}>Exam Not Found</h2>
        <button onClick={() => navigate('/learn')} style={{ background: '#7c3aed', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: 8, cursor: 'pointer' }}>Go Back</button>
      </div>
    </div>
  )

  const sectionA = exam.content.sections.find((s: any) => s.type === 'objective')
  const sectionB = exam.content.sections.find((s: any) => s.type === 'subjective')

  const handleObjSelect = (questionId: string, option: string) => {
    if (submitted) return
    setObjAnswers(prev => ({ ...prev, [questionId]: option }))
    
    remarkCounter.current += 1
    const id = remarkCounter.current
    const randomRemark = CHAT_REMARKS[Math.floor(Math.random() * CHAT_REMARKS.length)]
    setToastRemark({ text: randomRemark, id, type: 'A' })
    
    setTimeout(() => {
      setToastRemark(prev => prev?.id === id ? null : prev)
    }, 2500)
  }

  const handleSubjToggle = (questionId: string) => {
    if (submitted) return
    setSelectedSubjQuestions(prev => {
      const isSelected = !!prev[questionId]
      const currentSelectedCount = Object.values(prev).filter(Boolean).length
      
      if (!isSelected && currentSelectedCount >= (sectionB.required || 5)) {
        alert(`You can only select ${sectionB.required || 5} questions in Section B. Unselect one first.`)
        return prev
      }

      if (!isSelected) {
        remarkCounter.current += 1
        const id = remarkCounter.current
        const randomRemark = CHAT_REMARKS[Math.floor(Math.random() * CHAT_REMARKS.length)]
        setToastRemark({ text: randomRemark, id, type: 'B' })
        
        setTimeout(() => {
          setToastRemark(prev => prev?.id === id ? null : prev)
        }, 2500)
      } else {
        setToastRemark(null)
      }

      return { ...prev, [questionId]: !isSelected }
    })
  }

  const handleSubjAnswerChange = (questionId: string, text: string) => {
    if (submitted) return
    setSubjAnswers(prev => ({ ...prev, [questionId]: text }))
  }

  const handleSubmit = () => {
    if (submitted) return
    clearInterval(timerRef.current!)
    let score = 0
    sectionA?.questions.forEach((q: any) => {
      if (objAnswers[q.id] === q.correctAnswer) score += 1
    })
    setObjScore(score)
    setSubmitted(true)

    // Save progress to unlock subsequent exams
    const percentage = sectionA?.questions?.length ? (score / sectionA.questions.length) * 100 : 0
    try {
      const progress = JSON.parse(localStorage.getItem('waec_progress') || '{}')
      progress[exam.id] = { score, maxScore: sectionA?.questions?.length || 0, percentage }
      localStorage.setItem('waec_progress', JSON.stringify(progress))
    } catch(e) {}

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    if (h > 0) return `${h}:${m}:${s}`
    return `${m}:${s}`
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: '"DM Sans", sans-serif', paddingBottom: '4rem', position: 'relative' }}>
      <style>{`
        @keyframes popInBubbleFixed {
          0% { opacity: 0; transform: translateY(30px) scale(0.8); }
          60% { opacity: 1; transform: translateY(-5px) scale(1.05); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes popOutBubbleFixed {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(20px) scale(0.9); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
      {/* Header */}
      <header style={{ background: 'white', padding: '1rem 2rem', position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.25rem', color: '#1e0646', fontWeight: 800 }}>{exam.title}</h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#64748b' }}>{exam.content.class_level} • {exam.content.subject_name}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {!submitted && timeLeft !== null && (
            <div style={{ background: timeLeft < 300 ? '#fef2f2' : '#f8fafc', border: `1px solid ${timeLeft < 300 ? '#fecaca' : '#e2e8f0'}`, padding: '0.5rem 1rem', borderRadius: 8, color: timeLeft < 300 ? '#dc2626' : '#1e293b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
              ⏱️ {formatTime(timeLeft)}
            </div>
          )}
          {!submitted && (
            <button onClick={() => { if(window.confirm('Are you sure you want to submit your exam now?')) handleSubmit() }} style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white', border: 'none', padding: '0.6rem 1.5rem', borderRadius: 8, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 15px rgba(109,40,217,0.3)' }}>
              Submit Exam
            </button>
          )}
          {submitted && (
            <Link to="/learn/waec" style={{ background: '#f1f5f9', color: '#475569', textDecoration: 'none', padding: '0.6rem 1.5rem', borderRadius: 8, fontWeight: 700 }}>Exit</Link>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 1000, margin: '2rem auto', padding: '0 1rem' }}>
        {submitted && (
          <div style={{ background: 'white', borderRadius: 16, padding: '2rem', marginBottom: '2rem', textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
            <h2 style={{ fontSize: '1.75rem', color: '#1e0646', margin: '0 0 0.5rem' }}>Exam Submitted Successfully</h2>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', marginTop: '1.5rem' }}>
              <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: 12, minWidth: 200, border: '1px solid #e2e8f0' }}>
                <p style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 700, margin: '0 0 0.5rem', textTransform: 'uppercase' }}>Section A Score</p>
                <p style={{ fontSize: '2.5rem', color: '#7c3aed', fontWeight: 900, margin: 0 }}>{objScore} <span style={{ fontSize: '1.25rem', color: '#94a3b8' }}>/ {sectionA?.questions.length}</span></p>
              </div>
              <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: 12, minWidth: 200, border: '1px solid #e2e8f0' }}>
                <p style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 700, margin: '0 0 0.5rem', textTransform: 'uppercase' }}>Section B Status</p>
                <p style={{ fontSize: '1.5rem', color: '#10b981', fontWeight: 800, margin: '0.5rem 0 0' }}>Pending Grading</p>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0.25rem 0 0' }}>Answers saved for review</p>
              </div>
            </div>
          </div>
        )}

        {/* Section Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <button onClick={() => setActiveSection('A')} style={{ flex: 1, padding: '1rem', border: 'none', background: activeSection === 'A' ? '#1e0646' : 'white', color: activeSection === 'A' ? 'white' : '#64748b', borderRadius: 12, fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: activeSection === 'A' ? '0 10px 20px rgba(30,6,70,0.15)' : '0 2px 5px rgba(0,0,0,0.02)' }}>
            Section A (Objective)
          </button>
          <button onClick={() => setActiveSection('B')} style={{ flex: 1, padding: '1rem', border: 'none', background: activeSection === 'B' ? '#1e0646' : 'white', color: activeSection === 'B' ? 'white' : '#64748b', borderRadius: 12, fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: activeSection === 'B' ? '0 10px 20px rgba(30,6,70,0.15)' : '0 2px 5px rgba(0,0,0,0.02)' }}>
            Section B (Subjective)
          </button>
        </div>

        {/* Section A */}
        {activeSection === 'A' && sectionA && (
          <div style={{ background: 'white', borderRadius: 16, padding: '2.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <div style={{ background: '#f8fafc', borderLeft: '4px solid #3b82f6', padding: '1rem 1.5rem', borderRadius: '0 8px 8px 0', marginBottom: '2.5rem' }}>
              <h3 style={{ margin: '0 0 0.5rem', color: '#1e293b', fontSize: '1.1rem' }}>Instructions</h3>
              <p style={{ margin: 0, color: '#475569', fontSize: '0.95rem' }}>{sectionA.instructions}</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              {sectionA.questions.map((q: any) => (
                <div key={q.id} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '2.5rem' }}>
                  <p style={{ fontWeight: 700, color: '#1e0646', fontSize: '1.1rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                    <span style={{ color: '#7c3aed', marginRight: '0.5rem' }}>{q.number}.</span>
                    {q.text}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                    {q.options.map((opt: string, optIdx: number) => {
                      const isSelected = objAnswers[q.id] === opt
                      const isCorrect = submitted && q.correctAnswer === opt
                      const isWrong = submitted && isSelected && q.correctAnswer !== opt
                      
                      let bg = 'white', borderColor = '#e2e8f0', color = '#334155'
                      if (submitted) {
                        if (isCorrect) { bg = '#ecfdf5'; borderColor = '#10b981'; color = '#065f46' }
                        else if (isWrong) { bg = '#fef2f2'; borderColor = '#ef4444'; color = '#991b1b' }
                      } else if (isSelected) {
                        bg = '#f5f3ff'; borderColor = '#7c3aed'; color = '#4c1d95'
                      }

                      return (
                        <button
                          key={optIdx}
                          disabled={submitted}
                          onClick={() => handleObjSelect(q.id, opt)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            background: bg, border: `1.5px solid ${borderColor}`, padding: '0.875rem 1rem',
                            borderRadius: 10, cursor: submitted ? 'default' : 'pointer',
                            textAlign: 'left', color, transition: 'all 0.15s'
                          }}
                        >
                          <div style={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${isSelected || isCorrect ? borderColor : '#cbd5e1'}`, background: isSelected || isCorrect ? borderColor : 'white', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '0.75rem' }}>
                            {String.fromCharCode(65 + optIdx)}
                          </div>
                          <span style={{ fontSize: '0.95rem', fontWeight: isSelected ? 600 : 500, lineHeight: 1.4 }}>{opt}</span>
                          {submitted && isCorrect && <span style={{ marginLeft: 'auto', color: '#10b981' }}>✓</span>}
                          {submitted && isWrong && <span style={{ marginLeft: 'auto', color: '#ef4444' }}>✗</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section B */}
        {activeSection === 'B' && sectionB && (
          <div style={{ background: 'white', borderRadius: 16, padding: '2.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <div style={{ background: '#f8fafc', borderLeft: '4px solid #f59e0b', padding: '1rem 1.5rem', borderRadius: '0 8px 8px 0', marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 0.5rem', color: '#1e293b', fontSize: '1.1rem' }}>Instructions</h3>
                <p style={{ margin: 0, color: '#475569', fontSize: '0.95rem' }}>{sectionB.instructions}</p>
              </div>
              <div style={{ background: 'white', border: '2px solid #e2e8f0', padding: '0.75rem 1.5rem', borderRadius: 12, textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Selected</p>
                <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: Object.values(selectedSubjQuestions).filter(Boolean).length === sectionB.required ? '#10b981' : '#f59e0b' }}>
                  {Object.values(selectedSubjQuestions).filter(Boolean).length} / {sectionB.required || 5}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {sectionB.questions.map((q: any) => {
                const isSelected = !!selectedSubjQuestions[q.id]
                return (
                  <div key={q.id} style={{ background: isSelected ? '#f8fafc' : 'white', border: `2px solid ${isSelected ? '#7c3aed' : '#e2e8f0'}`, borderRadius: 12, padding: '1.5rem', transition: 'all 0.2s', opacity: (!isSelected && Object.values(selectedSubjQuestions).filter(Boolean).length >= (sectionB.required || 5)) ? 0.6 : 1 }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                      {!submitted && (
                        <div 
                          onClick={() => handleSubjToggle(q.id)}
                          style={{ width: 24, height: 24, borderRadius: 6, border: `2px solid ${isSelected ? '#7c3aed' : '#cbd5e1'}`, background: isSelected ? '#7c3aed' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '0.2rem' }}
                        >
                          {isSelected && <svg width="14" height="10" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 5L4.5 8.5L13 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                          <p style={{ fontWeight: 700, color: '#1e0646', fontSize: '1.1rem', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                            <span style={{ color: '#7c3aed', marginRight: '0.5rem' }}>Q{q.number}.</span>
                            {q.text}
                          </p>
                          <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.75rem', fontWeight: 800, padding: '0.25rem 0.5rem', borderRadius: 4, marginLeft: '1rem', flexShrink: 0 }}>
                            {q.marks} MARKS
                          </span>
                        </div>
                        
                        {q.hint && (
                          <p style={{ background: '#fef3c7', color: '#b45309', padding: '0.5rem 0.75rem', borderRadius: 6, fontSize: '0.85rem', margin: '0 0 1rem', display: 'inline-block' }}>
                            💡 <strong>Hint:</strong> {q.hint}
                          </p>
                        )}

                        {isSelected && (
                          <div style={{ marginTop: '1rem' }}>
                            <textarea
                              disabled={submitted}
                              value={subjAnswers[q.id] || ''}
                              onChange={(e) => handleSubjAnswerChange(q.id, e.target.value)}
                              placeholder="Type your answer here..."
                              style={{ width: '100%', minHeight: 180, padding: '1rem', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '1rem', fontFamily: 'inherit', resize: 'vertical', background: submitted ? '#f8fafc' : 'white', color: '#1e293b', outline: 'none', transition: 'border-color 0.2s' }}
                              onFocus={(e) => e.target.style.borderColor = '#7c3aed'}
                              onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                            />
                          </div>
                        )}
                        {!isSelected && !submitted && (
                          <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0, fontStyle: 'italic' }}>Select this question to answer it.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>

      {/* Floating Toast Remark */}
      {toastRemark && (
        <div 
          key={toastRemark.id} 
          style={{
            position: 'fixed',
            bottom: '2.5rem',
            right: '2.5rem',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            background: toastRemark.type === 'A' ? 'linear-gradient(135deg, #f3e8ff, #e9d5ff)' : 'linear-gradient(135deg, #fef3c7, #fde68a)',
            color: toastRemark.type === 'A' ? '#581c87' : '#92400e',
            padding: '1rem 1.5rem',
            borderRadius: '24px 24px 0 24px',
            fontWeight: 800,
            fontSize: '1.1rem',
            animation: 'popInBubbleFixed 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
            boxShadow: toastRemark.type === 'A' ? '0 10px 25px rgba(107, 33, 168, 0.2)' : '0 10px 25px rgba(245, 158, 11, 0.2)',
            transformOrigin: 'bottom right'
          }}
        >
          <div style={{ marginRight: '0.75rem', display: 'flex', alignItems: 'center' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: toastRemark.type === 'A' ? '#a855f7' : '#d97706', animation: 'pulse 1.5s infinite' }} />
          </div>
          {toastRemark.text}
        </div>
      )}
    </div>
  )
}
