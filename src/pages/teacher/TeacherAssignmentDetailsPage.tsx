import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
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

function Btn({ children, onClick, variant = 'primary', disabled, style }: any) {
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
    primary: { background: hov ? '#5b21b6' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff' },
    secondary: { background: hov ? '#f5f3ff' : '#fff', color: '#374151', border: '1.5px solid #e5e7eb' },
  }
  return (
    <button onClick={onClick} disabled={disabled} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ ...base, ...variants[variant] }}>
      {children}
    </button>
  )
}

export default function TeacherAssignmentDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [assignment, setAssignment] = useState<any>(null)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Selected Submission Modal
  const [selectedSub, setSelectedSub] = useState<any>(null)

  useEffect(() => {
    if (id) loadData()
  }, [id])

  async function loadData() {
    setIsLoading(true)
    try {
      // 1. Fetch assignment details
      const { data: assignData, error: assignErr } = await supabase
        .from('assignments')
        .select('*, class:classes(name), subject:subjects(name)')
        .eq('id', id)
        .single()
        
      if (assignErr) throw assignErr
      setAssignment(assignData)

      // 2. Fetch submissions
      const { data: subData, error: subErr } = await supabase
        .from('assignment_submissions')
        .select('*, student:students(full_name)')
        .eq('assignment_id', id)
        .order('created_at', { ascending: false })
        
      if (subErr) throw subErr
      setSubmissions(subData || [])
    } catch (err: any) {
      toast.error('Failed to load assignment details')
      navigate('/teacher/assignments')
    } finally {
      setIsLoading(false)
    }
  }
  
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}m ${s}s`
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #ede9fe', borderTopColor: '#6d28d9', animation: '_spin 0.8s linear infinite' }} />
        <style>{`@keyframes _spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!assignment) return null

  const questions: Question[] = assignment.content?.questions || []

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .sub-row:hover { background: #f8fafc; }
        .sub-row { transition: background 0.15s; cursor: pointer; }
      `}</style>

      <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif' }}>
        <button onClick={() => navigate('/teacher/assignments')} style={{ 
          background: 'transparent', border: 'none', color: '#6b7280', fontSize: 13, fontWeight: 700,
          display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer', padding: 0, marginBottom: 16
        }}>
          ← Back to Assignments
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              {assignment.subject?.name} • {assignment.class?.name}
            </div>
            <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>
              {assignment.title}
            </h1>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{assignment.description || 'No description provided.'}</p>
          </div>
          <div style={{ background: '#f5f3ff', padding: '12px 20px', borderRadius: 14, textAlign: 'right' }}>
             <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>Submissions</div>
             <div style={{ fontSize: 24, fontWeight: 800, color: '#7c3aed' }}>{submissions.length}</div>
          </div>
        </div>

        {/* ── Submissions Table ── */}
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) 120px 140px 120px 160px', padding: '16px 24px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
             <div>Student Name</div>
             <div>Score</div>
             <div>Percentage</div>
             <div>Time Taken</div>
             <div>Date Submitted</div>
          </div>

          {submissions.length === 0 ? (
            <div style={{ padding: '80px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
               <div style={{ fontSize: 32, marginBottom: 12 }}>📬</div>
               No submissions yet for this assignment.
            </div>
          ) : (
            submissions.map((sub, i) => {
              const perc = Math.round((sub.score / sub.total_possible) * 100) || 0
              let pColor = '#10b981'
              let pBg = '#d1fae5'
              if (perc < 50) { pColor = '#ef4444'; pBg = '#fee2e2' }
              else if (perc < 70) { pColor = '#f59e0b'; pBg = '#fef3c7' }

              return (
                <div 
                  key={sub.id} 
                  className="sub-row"
                  onClick={() => setSelectedSub(sub)}
                  style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) 120px 140px 120px 160px', padding: '16px 24px', borderBottom: i === submissions.length - 1 ? 'none' : '1px solid #f1f5f9', alignItems: 'center', animation: `_fadeUp 0.3s ease ${i * 0.05}s both` }}
                >
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>
                    {sub.student?.full_name || 'Unknown Student'}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#4b5563' }}>
                    {sub.score} / {sub.total_possible}
                  </div>
                  <div>
                     <span style={{ background: pBg, color: pColor, padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 800 }}>
                        {perc}%
                     </span>
                  </div>
                  <div style={{ fontSize: 13, color: '#64748b' }}>
                     {sub.duration_taken_seconds ? formatTime(sub.duration_taken_seconds) : 'N/A'}
                  </div>
                  <div style={{ fontSize: 13, color: '#64748b' }}>
                     {formatDate(sub.created_at)}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ── Submissions Detail Modal ── */}
      <Modal
        open={!!selectedSub}
        onClose={() => setSelectedSub(null)}
        title={selectedSub?.student?.full_name + "'s Submission"}
        subtitle="Detailed Answer Analysis"
        size="lg"
        footer={<Btn onClick={() => setSelectedSub(null)}>Done</Btn>}
      >
        {selectedSub && (
          <div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 24, padding: 16, background: '#f8fafc', borderRadius: 12, border: '1.5px solid #e2e8f0' }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 2 }}>Final Score</p>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981' }}>{selectedSub.score} <span style={{ fontSize: 14, color: '#9ca3af' }}>/ {selectedSub.total_possible}</span></div>
              </div>
              <div style={{ width: 1.5, background: '#e2e8f0' }} />
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 2 }}>Time Taken</p>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginTop: 5 }}>{selectedSub.duration_taken_seconds ? formatTime(selectedSub.duration_taken_seconds) : 'N/A'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', margin: 0 }}>Question Breakdown</p>
              
              {questions.map((q, i) => {
                const stuAnswer = selectedSub.answers?.[q.id] || ''
                const isCorrect = stuAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()
                
                return (
                  <div key={q.id} style={{ padding: 20, borderRadius: 16, background: '#fff', border: `1.5px solid ${isCorrect ? '#d1fae5' : '#fee2e2'}` }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', lineHeight: 1.5 }}>
                          <span style={{ color: '#9ca3af', marginRight: 8 }}>{i + 1}.</span>
                          {q.text}
                        </div>
                        <span style={{ fontSize: 16 }}>{isCorrect ? '✅' : '❌'}</span>
                     </div>
                     
                     <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 16, marginTop: 12 }}>
                        <div style={{ background: '#f8fafc', padding: 12, borderRadius: 12 }}>
                           <p style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Student Answer</p>
                           <p style={{ fontSize: 14, fontWeight: 600, color: isCorrect ? '#059669' : '#dc2626', margin: 0, wordBreak: 'break-word' }}>
                             {stuAnswer || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>No Answer</span>}
                           </p>
                        </div>
                        <div style={{ background: '#ecfdf5', padding: 12, borderRadius: 12 }}>
                           <p style={{ fontSize: 10, fontWeight: 800, color: '#059669', textTransform: 'uppercase', marginBottom: 4 }}>Correct Answer</p>
                           <p style={{ fontSize: 14, fontWeight: 700, color: '#065f46', margin: 0, wordBreak: 'break-word' }}>
                             {q.correctAnswer}
                           </p>
                        </div>
                     </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
