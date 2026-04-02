// src/pages/student/StudentAssignmentsPage.tsx
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { formatDate } from '../../lib/utils'
import toast from 'react-hot-toast'

export default function StudentAssignmentsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [viewMode, setViewMode] = useState<'class' | 'global'>('class')
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')
  const [isLoading, setIsLoading] = useState(true)

  // Data
  const [assignments, setAssignments] = useState<any[]>([])
  const [submissions, setSubmissions] = useState<any[]>([])
  const [globalQuizzes, setGlobalQuizzes] = useState<any[]>([])
  const [globalSubmissions, setGlobalSubmissions] = useState<any[]>([])

  useEffect(() => {
    if (user?.id) loadData()
  }, [user?.id])

  async function loadData() {
    setIsLoading(true)
    try {
      // 1. Get student record to find class_id and school_id
      const { data: student } = await supabase.from('students').select('id, class_id, school_id').eq('user_id', user!.id).single()
      if (!student) return

      // --- Fetch Class Assignments ---
      const [classReq, subReq, globalReq, gSubReq] = await Promise.all([
        supabase
          .from('assignments')
          .select('*, teacher:teachers(user:users(full_name)), subject:subjects(name)')
          .eq('class_id', student.class_id)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('assignment_submissions')
          .select('*')
          .eq('student_id', student.id),

        supabase
          .from('global_quizzes')
          .select('*, subject:subjects(name)')
          .eq('school_id', student.school_id)
          .eq('is_published', true)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('global_quiz_submissions')
          .select('*')
          .eq('student_id', student.id)
      ])

      if (classReq.error) throw classReq.error
      if (subReq.error) throw subReq.error
      if (globalReq.error) throw globalReq.error
      if (gSubReq.error) throw gSubReq.error

      setAssignments(classReq.data ?? [])
      setSubmissions(subReq.data ?? [])
      setGlobalQuizzes(globalReq.data ?? [])
      setGlobalSubmissions(gSubReq.data ?? [])

    } catch (err: any) {
      toast.error(err.message || 'Failed to load assignments')
    } finally {
      setIsLoading(false)
    }
  }

  // Pre-process active array based on ViewMode
  const activeList = useMemo(() => {
    if (viewMode === 'class') {
      return assignments.map(a => {
        const submission = submissions.find(s => s.assignment_id === a.id)
        const isOverdue = a.due_date && new Date(a.due_date) < new Date() && !submission
        return {
          ...a,
          type: 'class' as const,
          submission,
          isOverdue,
          status: submission ? 'completed' : isOverdue ? 'overdue' : 'pending'
        }
      })
    } else {
      return globalQuizzes.map(g => {
        const submission = globalSubmissions.find(s => s.quiz_id === g.id)
        return {
          ...g,
          type: 'global' as const,
          submission,
          isOverdue: false, // Global quizzes don't have strict overdue times right now
          status: submission ? 'completed' : 'pending'
        }
      })
    }
  }, [viewMode, assignments, submissions, globalQuizzes, globalSubmissions])

  const filtered = activeList.filter(a => {
    if (filter === 'all') return true
    if (filter === 'pending') return a.status !== 'completed'
    if (filter === 'completed') return a.status === 'completed'
    return true
  })

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .assign-card:hover { transform: translateY(-3px); box-shadow: 0 12px 30px rgba(109,40,217,0.12) !important; border-color: #7c3aed !important; }
        
        .view-tab { flex: 1; padding: 14px; text-align: center; font-size: 14px; font-weight: 700; cursor: pointer; border-radius: 14px; transition: all 0.2s; }
        .view-tab.active { background: #fff; color: #7c3aed; box-shadow: 0 4px 14px rgba(109,40,217,0.08); }
        .view-tab.inactive { color: #6b7280; }
        .view-tab.inactive:hover { background: rgba(255,255,255,0.4); }
      `}</style>

      <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif' }}>
        
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>My Assignments</h1>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 3 }}>View and complete your digital quizzes</p>
        </div>

        {/* ── Main View Switcher ── */}
        <div style={{ background: '#f5f3ff', padding: 8, borderRadius: 18, display: 'flex', gap: 8, marginBottom: 24, maxWidth: 500 }}>
          <div className={`view-tab ${viewMode === 'class' ? 'active' : 'inactive'}`} onClick={() => setViewMode('class')}>
            🏫 Class Work
          </div>
          <div className={`view-tab ${viewMode === 'global' ? 'active' : 'inactive'}`} onClick={() => setViewMode('global')}>
            🌍 Global Challenges
          </div>
        </div>

        {/* ── Status Filter Tabs ── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24, background: '#fff', padding: 6, borderRadius: 12, border: '1.5px solid #f0eefe', width: 'fit-content' }}>
          {(['all', 'pending', 'completed'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '8px 20px', borderRadius: 9, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
              background: filter === f ? '#7c3aed' : 'transparent',
              color: filter === f ? '#fff' : '#6b7280'
            }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* ── List ── */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
             <p style={{ fontSize: 13, color: '#9ca3af' }}>Loading your tasks...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 16, padding: '80px 20px', textAlign: 'center', border: '1.5px solid #f0eefe' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>{viewMode === 'global' ? '🌍' : '🎉'}</div>
            <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 6 }}>All caught up!</h3>
            <p style={{ fontSize: 13, color: '#9ca3af' }}>You have no {filter !== 'all' ? filter : ''} {viewMode === 'global' ? 'global quizzes' : 'assignments'} at the moment.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {filtered.map((a, i) => (
              <div key={a.id} className="assign-card" style={{ 
                background: '#fff', borderRadius: 20, border: '1.5px solid #f0eefe', padding: 24, 
                boxShadow: '0 2px 8px rgba(109,40,217,0.05)', transition: 'all 0.3s ease',
                animation: `_fadeUp 0.4s ease ${i * 0.05}s both`,
                cursor: a.status === 'completed' ? 'default' : 'pointer'
              }} onClick={() => a.status !== 'completed' && navigate(a.type === 'global' ? `/student/global-quizzes/${a.id}` : `/student/assignments/${a.id}`)}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, background: '#f5f3ff', color: '#7c3aed', padding: '5px 12px', borderRadius: 99, textTransform: 'uppercase' }}>
                    {a.subject?.name || 'General'}
                  </span>
                  {a.status === 'completed' ? (
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                      ✅ Completed
                    </span>
                  ) : a.isOverdue ? (
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#ef4444' }}>
                      ⏰ Overdue
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#f59e0b' }}>
                      🔥 Due Soon
                    </span>
                  )}
                </div>

                <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 20, fontWeight: 700, color: '#111827', margin: '0 0 6px 0' }}>{a.title}</h3>
                <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {a.description || 'No instructions provided.'}
                </p>

                {a.status === 'completed' ? (
                    <div style={{ background: '#f0fdf4', borderRadius: 12, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>Final Score</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#047857' }}>
                        {a.submission.score} / {a.submission.total_possible}
                      </div>
                    </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f5f3ff', paddingTop: 16 }}>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>
                      {a.due_date ? `Due ${formatDate(a.due_date)}` : (a.type === 'global' ? 'Global Challenge' : 'No deadline')}
                    </div>
                    <button style={{ 
                      background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', 
                      fontSize: 12, fontWeight: 700, cursor: 'pointer' 
                    }}>
                      Start Quiz →
                    </button>
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
