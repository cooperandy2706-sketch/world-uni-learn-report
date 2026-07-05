import { useStuckLoadingReload } from '../../hooks/useStuckLoadingReload'
// src/pages/teacher/AgendaPage.tsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useCurrentTerm } from '../../hooks/useSettings'
import { agendaService } from '../../services'
import toast from 'react-hot-toast'
import Modal from '../../components/ui/Modal'
import { MessageSquare, AlertTriangle, CheckCircle, Clock, ChevronRight, Map, Send, Info, Target } from 'lucide-react'
import { useAutoRefresh } from "../../hooks/useAutoRefresh";

function Btn({ children, onClick, variant = 'primary', disabled, loading, style }: any) {
  const [hov, setHov] = useState(false)
  const v: any = {
    primary: { background: hov ? '#5b21b6' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', border: 'none' },
    secondary: { background: hov ? '#fff' : '#fafafa', color: 'var(--text-main)', border: '1.5px solid var(--border-color)' },
    success: { background: hov ? '#15803d' : '#16a34a', color: '#fff', border: 'none' },
    danger: { background: hov ? '#b91c1c' : '#dc2626', color: '#fff', border: 'none' },
  }
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all .15s', opacity: disabled ? 0.6 : 1, fontFamily: '"DM Sans",sans-serif', ...v[variant], ...style }}>
      {loading && <span style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', animation: 'tap_spin .7s linear infinite', flexShrink: 0 }} />}
      {children}
    </button>
  )
}

export default function TeacherAgendaPage() {
    useAutoRefresh(loadAll);
  const { user } = useAuth()
  const { data: term } = useCurrentTerm()

  const [teacher, setTeacher] = useState<any>(null)
  const [agendas, setAgendas] = useState<any[]>([])
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  useStuckLoadingReload(loading)
  
  const [struggleModalOpen, setStruggleModalOpen] = useState(false)
  const [selectedAgenda, setSelectedAgenda] = useState<any>(null)
  const [feedbackText, setFeedbackText] = useState('')
  const [status, setStatus] = useState<'pending' | 'completed' | 'struggling'>('pending')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user?.id) loadAll()
  }, [user?.id, term?.id])

  async function loadAll() {
    setLoading(true)
    try {
      const { data: t } = await supabase.from('teachers').select('*').eq('user_id', user!.id).maybeSingle()
      if (!t) return
      setTeacher(t)

      if (term?.id) {
        const { data: ags } = await agendaService.getPublishedAgendas(user!.school_id, term.id)
        if (ags) {
          setAgendas(ags)
          // Load existing responses
          const resps: Record<string, any> = {}
          await Promise.all(ags.map(async (a: any) => {
            const { data: r } = await agendaService.getResponse(t.id, a.id)
            if (r) resps[a.id] = r
          }))
          setResponses(resps)
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  function openStruggleModal(agenda: any) {
    const existing = responses[agenda.id]
    setSelectedAgenda(agenda)
    setFeedbackText(existing?.feedback || '')
    setStatus(existing?.status || 'pending')
    setStruggleModalOpen(true)
  }

  async function submitResponse() {
    if (!status) return
    setSaving(true)
    const { error } = await agendaService.submitResponse({
      id: responses[selectedAgenda.id]?.id,
      agenda_id: selectedAgenda.id,
      teacher_id: teacher.id,
      school_id: user!.school_id,
      status,
      feedback: feedbackText,
      updated_at: new Date().toISOString()
    })
    
    if (error) { toast.error(error.message); setSaving(false); return }
    
    toast.success('Response updated')
    setSaving(false)
    setStruggleModalOpen(false)
    loadAll()
  }

  return (
    <div className="tp-page">
      <link rel="stylesheet" href="/src/styles/teacher-portal.css" />
      <style>{`
        @keyframes tap_spin{to{transform:rotate(360deg)}}
        @keyframes tap_fi{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .timeline-item:before{content:"";position:absolute;left:27px;top:0;bottom:0;width:2px;background:var(--border-color);z-index:0}
        .timeline-item:first-child:before{top:30px}
        .timeline-item:last-child:before{bottom:calc(100% - 30px)}
      `}</style>

      <div style={{ animation: 'tap_fi .4s ease' }}>
        <div className="tp-hero" style={{ marginBottom: 24 }}>
          <div>
            <h1 className="tp-hero-title">School Roadmap</h1>
            <p className="tp-hero-sub">Track your progress through the term's key milestones and sync with admin guidance.</p>
          </div>
        </div>

        {!term ? (
          <div className="tp-card" style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--bg-hover)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📆</div>
            <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>No active term detected. Agendas will appear here once a term is set.</p>
          </div>
        ) : loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
            <div className="tp-spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
          </div>
        ) : agendas.length === 0 ? (
          <div className="tp-card" style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--bg-hover)' }}>
             <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
             <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-main)', marginBottom: 8 }}>Welcome to {term.name}</h3>
             <p style={{ fontSize: 15, color: 'var(--text-muted)', maxWidth: 400, marginInline: 'auto' }}>The school agenda hasn't been published yet. Check back soon for milestones and goals.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
            {agendas.map((item, idx) => {
              const resp = responses[item.id]
              const isStruggling = resp?.status === 'struggling'
              const isCompleted = resp?.status === 'completed'
              const hasReply = !!resp?.admin_reply

              return (
                <div key={item.id} className="timeline-item" style={{ position: 'relative', display: 'flex', gap: 24, paddingBottom: 32 }}>
                  {/* Timeline Dot */}
                  <div style={{ 
                    width: 56, height: 56, borderRadius: '50%', flexShrink: 0, zIndex: 1,
                    background: isCompleted ? 'var(--success-color)' : isStruggling ? 'var(--danger-color)' : 'var(--primary-color)',
                    border: '4px solid var(--bg-body)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
                  }}>
                    {isCompleted ? <CheckCircle size={24} /> : isStruggling ? <AlertTriangle size={24} /> : <span style={{ fontWeight: 800, fontSize: 18 }}>{item.week_number}</span>}
                  </div>

                  {/* Card */}
                  <div className="tp-card" style={{ 
                    flex: 1, padding: '20px 24px', 
                    transition: 'all .25s ease', cursor: 'default'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 12 }}>
                      <div>
                         <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Week {item.week_number} Milestone</div>
                         <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>{item.title}</h3>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                         {resp && (
                           <span style={{ 
                             fontSize: 10, fontWeight: 800, padding: '4px 12px', borderRadius: 99, 
                             background: isCompleted ? 'rgba(34,197,94,0.1)' : isStruggling ? 'rgba(239,68,68,0.1)' : 'rgba(234,179,8,0.1)',
                             color: isCompleted ? 'var(--success-color)' : isStruggling ? 'var(--danger-color)' : '#d97706',
                             border: `1px solid ${isCompleted ? 'var(--success-color)' : isStruggling ? 'var(--danger-color)' : '#fef08a'}`
                           }}>
                             {resp.status.toUpperCase()}
                           </span>
                         )}
                      </div>
                    </div>

                    <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 20 }}>{item.description}</p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                       {/* Admin Reply Banner */}
                       {hasReply && (
                         <div style={{ background: 'rgba(124,58,237,0.05)', border: '1.5px solid rgba(124,58,237,0.2)', borderRadius: 12, padding: '16px', position: 'relative' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                               <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700 }}>A</div>
                               <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Admin Guidance</span>
                            </div>
                            <p style={{ fontSize: 14, color: 'var(--text-primary)', margin: 0, fontWeight: 600, lineHeight: 1.5 }}>"{resp.admin_reply}"</p>
                         </div>
                       )}

                       <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                          <button className="tp-btn tp-btn-ghost" onClick={() => openStruggleModal(item)}>
                            {resp ? <Edit2 size={16} /> : <MessageSquare size={16} />} {resp ? 'Update Status / Report' : 'Send Update / Struggle'}
                          </button>
                       </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Struggle Modal */}
        <Modal open={struggleModalOpen} onClose={() => setStruggleModalOpen(false)} title="Update Progress & Feedback">
            <div style={{ paddingTop: 10 }}>
               {selectedAgenda && (
                 <div style={{ background: 'var(--bg-hover)', borderRadius: 12, padding: '16px', border: '1px solid var(--border-color)', marginBottom: 20 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>Week {selectedAgenda.week_number}: {selectedAgenda.title}</div>
                 </div>
               )}

               <div style={{ marginBottom: 24 }}>
                  <label className="tp-label">How are you doing with this plan? *</label>
                  <div className="tp-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
                     {[
                       { v: 'pending', label: 'Working on it', icon: <Clock size={16} />, color: '#6d28d9', bg: '#f5f3ff' },
                       { v: 'completed', label: 'Done & Success', icon: <CheckCircle size={16} />, color: '#16a34a', bg: '#f0fdf4' },
                       { v: 'struggling', label: 'Struggling', icon: <AlertTriangle size={16} />, color: '#dc2626', bg: '#fef2f2' },
                     ].map(opt => (
                       <button key={opt.v} onClick={() => setStatus(opt.v as any)}
                         style={{ 
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 8px', borderRadius: 12,
                            border: `2px solid ${status === opt.v ? opt.color : 'var(--border-color)'}`,
                            background: status === opt.v ? opt.bg : 'var(--bg-card)',
                            color: status === opt.v ? opt.color : 'var(--text-muted)',
                            transition: 'all .2s', cursor: 'pointer', outline: 'none'
                         }}>
                         {opt.icon}
                         <span style={{ fontSize: 12, fontWeight: 700 }}>{opt.label}</span>
                       </button>
                     ))}
                  </div>
               </div>

               <div style={{ marginBottom: 24 }}>
                  <label className="tp-label">Share your feedback or struggles (to Admin)</label>
                  <textarea value={feedbackText} onChange={e => setFeedbackText(e.target.value)} rows={4}
                    placeholder="e.g. Students are finding the fractions difficult, I might need more time..."
                    className="tp-input"
                    style={{ resize: 'vertical' }} />
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 8, color: 'var(--text-muted)' }}>
                    <Info size={14} />
                    <span style={{ fontSize: 12 }}>This message is sent directly to the school administration.</span>
                  </div>
               </div>

               <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button className="tp-btn tp-btn-ghost" onClick={() => setStruggleModalOpen(false)} style={{ flex: '1 1 120px', justifyContent: 'center' }}>Cancel</button>
                  <button className="tp-btn tp-btn-primary" onClick={submitResponse} disabled={saving} style={{ flex: '2 1 200px', justifyContent: 'center' }}>
                    {saving ? 'Sending...' : <><Send size={16} /> {responses[selectedAgenda?.id] ? 'Update Message' : 'Send Message'}</>}
                  </button>
               </div>
            </div>
        </Modal>
      </div>
    </div>
  )
}

function Edit2(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
    </svg>
  )
}
