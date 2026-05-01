import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useCurrentTerm } from '../../hooks/useSettings'
import ReactMarkdown from 'react-markdown'
import toast from 'react-hot-toast'
import { CheckCircle, XCircle, Clock, Eye, MessageSquare, ChevronRight } from 'lucide-react'

interface LessonPlan {
  id: string
  teacher_id: string
  teacher: { user: { first_name: string; last_name: string } }
  class: { name: string }
  subject: { name: string }
  topic: string
  content: string
  status: 'pending' | 'approved' | 'rejected'
  feedback: string | null
  submitted_at: string
}

export default function LessonPlansPage() {
  const { user } = useAuth()
  const { data: term } = useCurrentTerm()
  const [plans, setPlans] = useState<LessonPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [activePlan, setActivePlan] = useState<LessonPlan | null>(null)

  useEffect(() => {
    if (user?.school?.id && term) {
      loadPlans()
    }
  }, [user, term])

  async function loadPlans() {
    setLoading(true)
    const { data, error } = await supabase
      .from('lesson_plans')
      .select(`
        id, teacher_id, topic, content, status, feedback, submitted_at,
        teacher:teachers(user:users(first_name, last_name)),
        class:classes(name),
        subject:subjects(name)
      `)
      .eq('school_id', user!.school!.id)
      .eq('term_id', (term as any).id)
      .order('submitted_at', { ascending: false })

    if (error) {
      toast.error('Failed to load lesson plans')
    } else {
      setPlans(data as any)
    }
    setLoading(false)
  }

  async function updateStatus(id: string, status: 'approved' | 'rejected', feedback: string) {
    const { error } = await supabase
      .from('lesson_plans')
      .update({ status, feedback: feedback || null })
      .eq('id', id)

    if (error) {
      toast.error('Failed to update status')
      return false
    }
    
    toast.success(`Plan ${status}!`)
    setPlans(prev => prev.map(p => p.id === id ? { ...p, status, feedback } : p))
    setActivePlan(null)
    return true
  }

  const filteredPlans = plans.filter(p => filter === 'all' || p.status === filter)

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', fontFamily: '"DM Sans",sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1e0646', margin: '0 0 8px' }}>Lesson Plan Approvals</h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: 15 }}>Review and approve weekly lesson plans submitted by teachers.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, background: '#fff', padding: 4, borderRadius: 12, border: '1px solid #e2e8f0' }}>
          {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{
                padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, textTransform: 'capitalize', transition: 'all 0.2s',
                background: filter === f ? '#f1f5f9' : 'transparent',
                color: filter === f ? '#0f172a' : '#64748b'
              }}
            >
              {f}
              {f === 'pending' && plans.filter(p => p.status === 'pending').length > 0 && (
                <span style={{ marginLeft: 8, background: '#ef4444', color: '#fff', padding: '2px 6px', borderRadius: 99, fontSize: 11 }}>
                  {plans.filter(p => p.status === 'pending').length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}>Loading submissions...</div>
      ) : filteredPlans.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 16, padding: 60, textAlign: 'center', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1e0646', marginBottom: 8 }}>No plans found</h3>
          <p style={{ color: '#64748b' }}>There are no {filter !== 'all' ? filter : ''} lesson plans at the moment.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {filteredPlans.map(plan => (
            <div key={plan.id} onClick={() => setActivePlan(plan)}
              style={{
                background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#cbd5e1'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: plan.status === 'pending' ? '#fef3c7' : plan.status === 'approved' ? '#dcfce7' : '#fee2e2',
                  color: plan.status === 'pending' ? '#d97706' : plan.status === 'approved' ? '#16a34a' : '#ef4444'
                }}>
                  {plan.status === 'pending' ? <Clock size={24} /> : plan.status === 'approved' ? <CheckCircle size={24} /> : <XCircle size={24} />}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>{plan.topic}</h3>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: '#f1f5f9', color: '#475569' }}>
                      {plan.subject?.name} • {plan.class?.name}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                    Submitted by <strong>{plan.teacher?.user?.first_name} {plan.teacher?.user?.last_name}</strong> on {new Date(plan.submitted_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {plan.feedback && <MessageSquare size={18} color="#94a3b8" />}
                <ChevronRight size={20} color="#cbd5e1" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {activePlan && (
        <ReviewModal
          plan={activePlan}
          onClose={() => setActivePlan(null)}
          onUpdate={updateStatus}
        />
      )}
    </div>
  )
}

function ReviewModal({ plan, onClose, onUpdate }: { plan: LessonPlan, onClose: () => void, onUpdate: (id: string, status: 'approved' | 'rejected', feedback: string) => Promise<boolean> }) {
  const [feedback, setFeedback] = useState(plan.feedback || '')
  const [submitting, setSubmitting] = useState(false)

  async function handleAction(status: 'approved' | 'rejected') {
    setSubmitting(true)
    await onUpdate(plan.id, status, feedback)
    setSubmitting(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', width: '100%', maxWidth: 900, height: '90vh', borderRadius: 24, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }}>
        
        {/* Header */}
        <div style={{ padding: '24px 32px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', background: '#f8fafc' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 }}>{plan.topic}</h2>
              <span style={{
                fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 99, textTransform: 'uppercase',
                background: plan.status === 'pending' ? '#fef3c7' : plan.status === 'approved' ? '#dcfce7' : '#fee2e2',
                color: plan.status === 'pending' ? '#d97706' : plan.status === 'approved' ? '#16a34a' : '#ef4444'
              }}>
                {plan.status}
              </span>
            </div>
            <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
              {plan.subject?.name} • {plan.class?.name} | Submitted by {plan.teacher?.user?.first_name} {plan.teacher?.user?.last_name}
            </p>
          </div>
          <button onClick={onClose} style={{ background: '#e2e8f0', border: 'none', width: 36, height: 36, borderRadius: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
            <XCircle size={20} />
          </button>
        </div>

        {/* Content & Feedback Split */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
          
          {/* Markdown Content */}
          <div style={{ flex: 2, overflowY: 'auto', padding: 32, borderRight: '1px solid #e2e8f0' }}>
            <style>{`
              .lp-preview h1 { font-size: 20px; color: #1e0646; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-top: 0; }
              .lp-preview h2 { font-size: 16px; color: #4338ca; margin-top: 24px; }
              .lp-preview h3 { font-size: 14px; color: #334155; }
              .lp-preview p { font-size: 14px; line-height: 1.7; color: #475569; }
              .lp-preview ul, .lp-preview ol { padding-left: 20px; font-size: 14px; color: #475569; line-height: 1.7; }
              .lp-preview table { width: 100%; border-collapse: collapse; margin: 16px 0; }
              .lp-preview th, .lp-preview td { border: 1px solid #e2e8f0; padding: 10px; font-size: 13px; text-align: left; }
              .lp-preview th { background: #f8fafc; color: #0f172a; font-weight: 600; }
            `}</style>
            <div className="lp-preview">
              <ReactMarkdown>{plan.content}</ReactMarkdown>
            </div>
          </div>

          {/* Feedback Panel */}
          <div style={{ flex: 1, background: '#f8fafc', padding: 24, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>Headmaster Feedback</h3>
            <textarea
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              placeholder="Leave constructive feedback or requested changes..."
              style={{
                flex: 1, width: '100%', padding: 16, borderRadius: 12, border: '1px solid #cbd5e1', resize: 'none',
                fontFamily: 'inherit', fontSize: 14, lineHeight: 1.6, boxSizing: 'border-box'
              }}
            />
            
            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                onClick={() => handleAction('approved')}
                disabled={submitting || plan.status === 'approved'}
                style={{
                  width: '100%', padding: 14, borderRadius: 12, border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s',
                  background: plan.status === 'approved' ? '#e2e8f0' : '#16a34a', color: plan.status === 'approved' ? '#94a3b8' : '#fff'
                }}
              >
                <CheckCircle size={20} /> Approve Plan
              </button>
              
              <button
                onClick={() => handleAction('rejected')}
                disabled={submitting || plan.status === 'rejected'}
                style={{
                  width: '100%', padding: 14, borderRadius: 12, border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s',
                  background: plan.status === 'rejected' ? '#e2e8f0' : '#fee2e2', color: plan.status === 'rejected' ? '#94a3b8' : '#ef4444'
                }}
              >
                <XCircle size={20} /> Reject & Require Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
