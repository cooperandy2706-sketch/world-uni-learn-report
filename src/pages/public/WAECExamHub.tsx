import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

const CLASS_ORDER = [
  'Basic 1', 'Basic 2', 'Basic 3',
  'Basic 4', 'Basic 5', 'Basic 6',
  'Basic 7', 'Basic 8', 'Basic 9'
]

const SUBJECT_ICONS: Record<string, string> = {
  'English Language':            '📝',
  'Mathematics':                 '📐',
  'Integrated Science':          '🔬',
  'Science':                     '🧪',
  'Social Studies':              '🌍',
  'Religious & Moral Education': '🕊️',
  'ICT':                         '💻',
  'French':                      '🇫🇷',
  'Career Technology':           '🔧',
  'Ghanaian Language':           '🎵',
  'Our World Our People':        '🌱',
}

const SUBJECT_COLORS: Record<string, { bg: string; text: string; accent: string }> = {
  'English Language':            { bg: '#eff6ff', text: '#1e40af', accent: '#3b82f6' },
  'Mathematics':                 { bg: '#f5f3ff', text: '#5b21b6', accent: '#7c3aed' },
  'Integrated Science':          { bg: '#ecfdf5', text: '#065f46', accent: '#10b981' },
  'Science':                     { bg: '#ecfdf5', text: '#065f46', accent: '#10b981' },
  'Social Studies':              { bg: '#fef3c7', text: '#92400e', accent: '#f59e0b' },
  'Religious & Moral Education': { bg: '#fff1f2', text: '#9f1239', accent: '#f43f5e' },
  'ICT':                         { bg: '#f0fdf4', text: '#14532d', accent: '#22c55e' },
  'French':                      { bg: '#fdf4ff', text: '#701a75', accent: '#c026d3' },
  'Career Technology':           { bg: '#fff7ed', text: '#9a3412', accent: '#ea580c' },
  'Ghanaian Language':           { bg: '#fef9c3', text: '#713f12', accent: '#ca8a04' },
}

function getSubjColor(name: string) {
  return SUBJECT_COLORS[name] || { bg: '#f8fafc', text: '#1e293b', accent: '#64748b' }
}

const CLASS_LEVEL_DESCRIPTIONS: Record<string, string> = {
  'Basic 1': 'Lower Primary • Ages 6–7',
  'Basic 2': 'Lower Primary • Ages 7–8',
  'Basic 3': 'Lower Primary • Ages 8–9',
  'Basic 4': 'Upper Primary • Ages 9–10',
  'Basic 5': 'Upper Primary • Ages 10–11',
  'Basic 6': 'Upper Primary • Ages 11–12',
  'Basic 7': 'JHS 1 • Ages 12–13',
  'Basic 8': 'JHS 2 • Ages 13–14',
  'Basic 9': 'JHS 3 / BECE • Ages 14–15',
}

export default function WAECExamHub() {
  const [selectedClass, setSelectedClass] = useState<string | null>(null)
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [userProgress, setUserProgress] = useState<Record<string, any>>({})

  useEffect(() => {
    try {
      const prog = JSON.parse(localStorage.getItem('waec_progress') || '{}')
      setUserProgress(prog)
    } catch(e) {}
  }, [])

  const { data: exams = [], isLoading } = useQuery({
    queryKey: ['waec-exams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('global_quizzes')
        .select('id, title, description, duration_minutes, content')
        .eq('is_published', true)
        .is('school_id', null)
      if (error) throw error
      return (data || []).filter((e: any) => e.content?.exam_type === 'waec')
    }
  })

  // 1. Group exams by class level
  const byClass: Record<string, any[]> = {}
  for (const exam of exams) {
    const cl = (exam as any).content?.class_level || 'Uncategorised'
    if (!byClass[cl]) byClass[cl] = []
    byClass[cl].push(exam)
  }
  const availableClasses = CLASS_ORDER.filter(c => byClass[c]?.length > 0)
  const classExams = selectedClass ? (byClass[selectedClass] || []) : []

  // 2. Group active class exams by subject
  const bySubject: Record<string, any[]> = {}
  for (const exam of classExams) {
    const sub = exam.content?.subject_name || 'General'
    if (!bySubject[sub]) bySubject[sub] = []
    bySubject[sub].push(exam)
  }
  const availableSubjects = Object.keys(bySubject).sort()
  const subjectExams = selectedSubject ? (bySubject[selectedSubject] || []).sort((a, b) => a.title.localeCompare(b.title)) : []

  const handleClassSelect = (cls: string) => {
    if (selectedClass === cls) {
      setSelectedClass(null)
      setSelectedSubject(null)
    } else {
      setSelectedClass(cls)
      setSelectedSubject(null)
    }
  }

  return (
    <div style={{ minHeight: '100vh', fontFamily: '"DM Sans", sans-serif', background: '#f1f5f9' }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #1e0646 0%, #3730a3 60%, #1e0646 100%)', padding: '3.5rem 2rem 5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(124,58,237,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(59,130,246,0.2) 0%, transparent 50%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <Link to="/learn" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            ← Back to Learn Hub
          </Link>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '0.4rem 1rem', borderRadius: 20, fontSize: '0.8rem', color: 'rgba(255,255,255,0.9)', fontWeight: 700, marginBottom: '1.25rem', backdropFilter: 'blur(10px)' }}>
            🎓 WAEC / BECE Standard
          </div>
          <h1 style={{ color: 'white', fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 900, margin: '0 0 1rem', lineHeight: 1.2, fontFamily: '"Playfair Display", serif' }}>
            Timed Exam Hub
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem', margin: '0 0 2rem', maxWidth: 600, lineHeight: 1.7 }}>
            Practice with full WAEC-style timed mock exams — Section A (40 objectives) and Section B (pick 5 from 7 essays). Score 70%+ to unlock advanced mocks!
          </p>

          {/* Stats bar */}
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {[
              { icon: '📋', label: `${exams.length} Mock Exams` },
              { icon: '📚', label: `${availableClasses.length} Class Levels` },
              { icon: '⏱️', label: 'Timed & Authentic' },
              { icon: '✅', label: 'GES Curriculum Aligned' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.1)', padding: '0.5rem 1rem', borderRadius: 8, color: 'white', fontSize: '0.875rem', fontWeight: 600 }}>
                <span>{s.icon}</span> {s.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Class Selector */}
      <div style={{ maxWidth: 900, margin: '-2rem auto 0', padding: '0 1rem', position: 'relative', zIndex: 2 }}>
        <div style={{ background: 'white', borderRadius: 16, padding: '1.75rem', boxShadow: '0 10px 40px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9' }}>
          <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Step 1: Select Your Class Level</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(105px, 1fr))', gap: '0.75rem' }}>
            {CLASS_ORDER.map(cls => {
              const count = byClass[cls]?.length || 0
              const isActive = selectedClass === cls
              const hasExams = count > 0
              return (
                <button
                  key={cls}
                  disabled={!hasExams}
                  onClick={() => handleClassSelect(cls)}
                  style={{
                    padding: '0.875rem 0.5rem',
                    borderRadius: 12,
                    border: `2px solid ${isActive ? '#7c3aed' : '#e2e8f0'}`,
                    background: isActive ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : hasExams ? 'white' : '#f8fafc',
                    color: isActive ? 'white' : hasExams ? '#1e0646' : '#94a3b8',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    cursor: hasExams ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s',
                    textAlign: 'center',
                    boxShadow: isActive ? '0 6px 20px rgba(109,40,217,0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
                    transform: isActive ? 'translateY(-2px)' : 'none',
                  }}
                >
                  <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>
                    {cls.includes('9') ? '🏆' : cls.includes('7') || cls.includes('8') ? '📖' : '📗'}
                  </div>
                  {cls}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '2rem auto', padding: '0 1rem 4rem' }}>
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
            <div style={{ width: 40, height: 40, border: '3px solid #ede9fe', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
            <p>Loading exams...</p>
          </div>
        )}

        {!selectedClass && !isLoading && (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>☝️</div>
            <h2 style={{ color: '#1e0646', marginBottom: '0.5rem', fontSize: '1.5rem', fontWeight: 800 }}>Select a class level above</h2>
            <p style={{ color: '#64748b', fontSize: '1rem' }}>Choose your grade to see available mock exams.</p>
          </div>
        )}

        {/* Subject Selector */}
        {selectedClass && !selectedSubject && !isLoading && (
          <div>
            <h2 style={{ color: '#1e0646', fontWeight: 900, fontSize: '1.5rem', margin: '0 0 1.5rem' }}>
              Step 2: Select a Subject
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
              {availableSubjects.map(sub => {
                const clr = getSubjColor(sub)
                const icon = SUBJECT_ICONS[sub] || '📋'
                const count = bySubject[sub].length
                return (
                  <div 
                    key={sub} 
                    onClick={() => setSelectedSubject(sub)}
                    style={{ background: 'white', borderRadius: 16, padding: '1.5rem', border: `2px solid ${clr.bg}`, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: '1rem' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = clr.accent; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = clr.bg; (e.currentTarget as HTMLDivElement).style.transform = 'none' }}
                  >
                    <div style={{ fontSize: '2.5rem', background: clr.bg, width: 60, height: 60, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {icon}
                    </div>
                    <div>
                      <h3 style={{ margin: '0 0 0.25rem', color: '#1e0646', fontSize: '1.1rem', fontWeight: 800 }}>{sub}</h3>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>{count} Exam{count > 1 ? 's' : ''} available</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Exams List */}
        {selectedSubject && (
          <div>
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', padding: '1rem 1.5rem', borderRadius: 16, border: '1px solid #e2e8f0' }}>
              <div>
                <button onClick={() => setSelectedSubject(null)} style={{ background: 'none', border: 'none', color: '#64748b', fontWeight: 700, cursor: 'pointer', padding: 0, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  ← Back to Subjects
                </button>
                <h2 style={{ color: '#1e0646', fontWeight: 900, fontSize: '1.5rem', margin: 0 }}>
                  {selectedSubject} Exams
                </h2>
              </div>
              <div style={{ fontSize: '2.5rem' }}>{SUBJECT_ICONS[selectedSubject] || '📋'}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {subjectExams.map((exam: any, idx: number) => {
                const clr = getSubjColor(selectedSubject)
                const secA = exam.content?.sections?.[0]?.questions?.length || 0
                const secB = exam.content?.sections?.[1]?.questions?.length || 0
                const required = exam.content?.sections?.[1]?.required || 5
                const hrs = Math.floor(exam.duration_minutes / 60)
                const mins = exam.duration_minutes % 60
                const timeLabel = hrs > 0 ? `${hrs}hr ${mins > 0 ? mins + 'min' : ''}`.trim() : `${mins} min`

                // Locking Logic
                // First exam (idx === 0) is always unlocked
                // Subsequent exams are unlocked ONLY IF the previous exam was passed (>= 70%)
                const prevExam = idx > 0 ? subjectExams[idx - 1] : null
                const prevProgress = prevExam ? userProgress[prevExam.id] : null
                const isLocked = idx > 0 && (!prevProgress || prevProgress.percentage < 70)
                const currentProgress = userProgress[exam.id]

                return (
                  <div key={exam.id} style={{ 
                    background: 'white', borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0', 
                    transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    opacity: isLocked ? 0.6 : 1, position: 'relative'
                  }}
                    onMouseEnter={e => { if(!isLocked) { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.1)' } }}
                    onMouseLeave={e => { if(!isLocked) { (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)' } }}>
                    
                    {/* Header */}
                    <div style={{ background: isLocked ? '#f1f5f9' : clr.bg, padding: '1.25rem 1.5rem', borderBottom: `3px solid ${isLocked ? '#cbd5e1' : clr.accent}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h3 style={{ margin: 0, color: isLocked ? '#64748b' : clr.text, fontWeight: 900, fontSize: '1.1rem', lineHeight: 1.2 }}>{exam.title}</h3>
                        {isLocked && <span style={{ fontSize: '1.25rem' }}>🔒</span>}
                        {currentProgress && currentProgress.percentage >= 70 && <span style={{ background: '#10b981', color: 'white', padding: '0.15rem 0.5rem', borderRadius: 12, fontSize: '0.7rem', fontWeight: 800 }}>PASSED</span>}
                        {currentProgress && currentProgress.percentage < 70 && <span style={{ background: '#ef4444', color: 'white', padding: '0.15rem 0.5rem', borderRadius: 12, fontSize: '0.7rem', fontWeight: 800 }}>FAILED</span>}
                      </div>
                    </div>

                    {/* Body */}
                    <div style={{ padding: '1.25rem 1.5rem' }}>
                      <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 1.25rem', lineHeight: 1.5 }}>
                        {exam.description}
                      </p>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        {[
                          { label: 'Section A', value: `${secA} Objs`, icon: '☑️' },
                          { label: 'Section B', value: `Pick ${required}`, icon: '✍️' },
                          { label: 'Duration', value: timeLabel, icon: '⏱️' },
                        ].map(item => (
                          <div key={item.label} style={{ background: '#f8fafc', borderRadius: 8, padding: '0.5rem', border: '1px solid #f1f5f9' }}>
                            <p style={{ margin: '0 0 0.15rem', fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>{item.icon} {item.label}</p>
                            <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: '#1e293b' }}>{item.value}</p>
                          </div>
                        ))}
                        {currentProgress && (
                          <div style={{ background: currentProgress.percentage >= 70 ? '#ecfdf5' : '#fef2f2', borderRadius: 8, padding: '0.5rem', border: `1px solid ${currentProgress.percentage >= 70 ? '#10b981' : '#ef4444'}` }}>
                            <p style={{ margin: '0 0 0.15rem', fontSize: '0.65rem', fontWeight: 800, color: currentProgress.percentage >= 70 ? '#059669' : '#b91c1c', textTransform: 'uppercase' }}>🏆 Sec A Score</p>
                            <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 900, color: currentProgress.percentage >= 70 ? '#059669' : '#b91c1c' }}>{Math.round(currentProgress.percentage)}%</p>
                          </div>
                        )}
                      </div>

                      {isLocked ? (
                        <div style={{ textAlign: 'center', background: '#f1f5f9', color: '#64748b', padding: '0.875rem', borderRadius: 10, fontWeight: 800, fontSize: '0.85rem' }}>
                          Score 70%+ on Exam {idx} to unlock
                        </div>
                      ) : (
                        <Link
                          to={`/learn/waec/${exam.id}`}
                          style={{
                            display: 'block', textAlign: 'center', textDecoration: 'none',
                            background: `linear-gradient(135deg, ${clr.accent}, ${clr.accent}cc)`,
                            color: 'white', padding: '0.875rem', borderRadius: 10,
                            fontWeight: 800, fontSize: '0.95rem',
                            boxShadow: `0 4px 15px ${clr.accent}50`,
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                        >
                          {currentProgress ? 'Retake Exam →' : 'Start Exam →'}
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
