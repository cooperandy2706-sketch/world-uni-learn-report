// src/pages/teacher/TeacherGlobalQuizDetailsPage.tsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'
import { formatDate } from '../../lib/utils'

export default function TeacherGlobalQuizDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [quiz, setQuiz] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user?.id && id) loadDetails()
  }, [user?.id, id])

  async function loadDetails() {
    setIsLoading(true)
    try {
      // 1. Get the Quiz
      const { data: qData, error: qErr } = await supabase
        .from('global_quizzes')
        .select('*, subject:subjects(name)')
        .eq('id', id)
        .single()
      if (qErr) throw qErr
      setQuiz(qData)

      // 2. Get Teacher classes
      const { data: teacher } = await supabase.from('teachers').select('id').eq('user_id', user!.id).single()
      if (!teacher) return
      
      const { data: tAssigns } = await supabase
        .from('teacher_assignments')
        .select('class_id')
        .eq('teacher_id', teacher.id)
        
      const classIds = Array.from(new Set((tAssigns || []).map(t => t.class_id)))
      
      if (classIds.length === 0) {
        setStudents([])
        setIsLoading(false)
        return
      }

      // 3. Get students in these classes
      const { data: stus, error: sErr } = await supabase
        .from('students')
        .select('id, full_name, user:users(avatar_url), class:classes(name)')
        .in('class_id', classIds)
      
      if (sErr) throw sErr
      
      const studentList = stus || []
      const studentIds = studentList.map(s => s.id)

      // 4. Get subms
      let submissionsMap = new Map<string, any>()
      if (studentIds.length > 0) {
        const { data: subs } = await supabase
          .from('global_quiz_submissions')
          .select('*')
          .eq('quiz_id', id)
          .in('student_id', studentIds)
          
        ;(subs || []).forEach(sub => {
          submissionsMap.set(sub.student_id, sub)
        })
      }

      const composite = studentList.map(s => {
        const sub = submissionsMap.get(s.id)
        return {
          ...s,
          has_submitted: !!sub,
          score: sub?.score ?? 0,
          total_possible: sub?.total_possible ?? qData.content?.questions?.length ?? 0,
          submitted_at: sub?.created_at,
          duration: sub?.duration_taken_seconds
        }
      })
      
      // Sort: submitted first, then alphabetical
      composite.sort((a, b) => {
        if (a.has_submitted && !b.has_submitted) return -1
        if (!a.has_submitted && b.has_submitted) return 1
        return a.full_name.localeCompare(b.full_name)
      })

      setStudents(composite)

    } catch (err: any) {
      toast.error('Failed to load quiz details')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  function avatarLetter(name?: string) {
    if (!name) return '?'
    return name.charAt(0).toUpperCase()
  }

  const formatSecs = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}m ${s < 10 ? '0' : ''}${s}s`
  }

  if (isLoading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', fontFamily: '"DM Sans",sans-serif' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #ede9fe', borderTopColor: '#7c3aed', animation: '_spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: '#9ca3af', fontSize: 13, fontWeight: 500 }}>Loading Submissions...</p>
        <style>{`@keyframes _spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (!quiz) return null

  const submittedCount = students.filter(s => s.has_submitted).length
  const totalCount = students.length
  let avgPct = 0
  if (submittedCount > 0) {
    const sum = students.filter(s=>s.has_submitted).reduce((acc, curr) => curr.total_possible > 0 ? acc + (curr.score / curr.total_possible) : acc, 0)
    avgPct = (sum / submittedCount) * 100
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');
        .s-card { transition: all 0.2s; }
        .s-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
      `}</style>

      <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif', maxWidth: 1000, margin: '0 auto', paddingBottom: 60 }}>
        
        {/* Header Breadcrumb */}
        <div style={{ marginBottom: 24 }}>
          <button onClick={() => navigate('/teacher/assignments')} style={{ border: 'none', background: 'transparent', color: '#6b7280', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0' }}>
             ← Back to Assignments
          </button>
        </div>

        {/* Global Quiz Header */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 30, border: '1px solid #f0eefe', boxShadow: '0 4px 20px rgba(109,40,217,0.04)', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 800, background: '#f5f3ff', color: '#7c3aed', padding: '4px 10px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                🌍 Global Challenge
              </span>
              <span style={{ fontSize: 11, fontWeight: 800, background: '#f3f4f6', color: '#4b5563', padding: '4px 10px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {quiz.subject?.name || 'General'}
              </span>
            </div>
            
            <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 28, fontWeight: 700, color: '#111827', margin: '0 0 8px 0' }}>{quiz.title}</h1>
            <p style={{ fontSize: 14, color: '#6b7280', margin: 0, maxWidth: 600, lineHeight: 1.5 }}>
              This quiz was published globally by the school administration. You are viewing completion metrics specifically for your assigned students.
            </p>
          </div>
          
          <button onClick={() => navigate(`/teacher/global-quizzes/${quiz.id}/take`)} style={{ padding: '12px 20px', background: '#f5f3ff', color: '#7c3aed', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }} onMouseEnter={e=>e.currentTarget.style.background='#ede9fe'} onMouseLeave={e=>e.currentTarget.style.background='#f5f3ff'}>
            👁️ Preview Global Quiz
          </button>
        </div>

        {/* Mini Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 30 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '20px', border: '1px solid #f0eefe', display: 'flex', alignItems: 'center', gap: 16 }}>
             <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fdf4ff', color: '#c026d3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>👩‍🎓</div>
             <div>
               <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>Your Students</div>
               <div style={{ fontSize: 20, fontWeight: 800, color: '#111827' }}>{totalCount}</div>
             </div>
          </div>
          <div style={{ background: '#fff', borderRadius: 16, padding: '20px', border: '1px solid #f0eefe', display: 'flex', alignItems: 'center', gap: 16 }}>
             <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>✅</div>
             <div>
               <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>Completed</div>
               <div style={{ fontSize: 20, fontWeight: 800, color: '#111827' }}>{submittedCount}</div>
             </div>
          </div>
          <div style={{ background: '#fff', borderRadius: 16, padding: '20px', border: '1px solid #f0eefe', display: 'flex', alignItems: 'center', gap: 16 }}>
             <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📊</div>
             <div>
               <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>Avg Score</div>
               <div style={{ fontSize: 20, fontWeight: 800, color: '#111827' }}>{avgPct.toFixed(1)}%</div>
             </div>
          </div>
        </div>

        {/* Student List */}
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 16 }}>Student Breakdown</h3>
        
        {students.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 16, padding: '60px 20px', textAlign: 'center', border: '1.5px solid #f0eefe' }}>
             <div style={{ fontSize: 40, marginBottom: 12 }}>🤷‍♀️</div>
             <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 4 }}>No Students Found</div>
             <p style={{ fontSize: 13, color: '#6b7280' }}>You do not have any classes assigned to you, so no student performance can be shown.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {students.map(s => (
              <div key={s.id} className="s-card" style={{ 
                background: '#fff', borderRadius: 16, padding: '16px 20px', border: '1px solid #f0eefe',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#f59e0b,#fbbf24)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff' }}>
                    {avatarLetter(s.full_name)}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{s.full_name}</div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{s.class?.name || 'No Class'}</div>
                  </div>
                </div>

                {s.has_submitted ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 2 }}>Submitted</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#4b5563' }}>{formatDate(s.submitted_at)}</div>
                    </div>
                    {s.duration !== undefined && s.duration !== null && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 2 }}>Time Taken</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#4b5563' }}>{formatSecs(s.duration)}</div>
                      </div>
                    )}
                    <div style={{ background: '#ecfdf5', borderRadius: 10, padding: '8px 14px', textAlign: 'center', minWidth: 60 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#059669', textTransform: 'uppercase', marginBottom: 2 }}>Score</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#047857' }}>{s.score} <span style={{ fontSize: 11, color: '#34d399' }}>/ {s.total_possible}</span></div>
                    </div>
                  </div>
                ) : (
                  <div style={{ background: '#fef2f2', borderRadius: 10, padding: '8px 16px', border: '1px solid #fee2e2' }}>
                     <span style={{ fontSize: 12, fontWeight: 700, color: '#dc2626' }}>Pending Completion</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
