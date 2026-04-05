// src/pages/teacher/AgendaPage.tsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useCurrentTerm } from '../../hooks/useSettings'
import { agendaService } from '../../services'
import toast from 'react-hot-toast'
import Modal from '../../components/ui/Modal'
import { MessageSquare, AlertTriangle, CheckCircle, Clock, ChevronRight, Map, Send, Info, Target } from 'lucide-react'

function Btn({ children, onClick, variant = 'primary', disabled, loading, style }: any) {
  const [hov, setHov] = useState(false)
  const v: any = {
    primary: { background: hov ? '#5b21b6' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', border: 'none' },
    secondary: { background: hov ? '#fff' : '#fafafa', color: '#374151', border: '1.5px solid #e5e7eb' },
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
  const { user } = useAuth()
  const { data: term } = useCurrentTerm()

  const [teacher, setTeacher] = useState<any>(null)
  const [agendas, setAgendas] = useState<any[]>([])
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  
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
      const { data: t } = await supabase.from('teachers').select('*').eq('user_id', user!.id).single()
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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes tap_spin{to{transform:rotate(360deg)}}
        @keyframes tap_fi{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .timeline-item:before{content:"";position:absolute;left:27px;top:0;bottom:0;width:2px;background:#ddd6fe;z-index:0}
        .timeline-item:first-child:before{top:30px}
        .timeline-item:last-child:before{bottom:calc(100% - 30px)}
        .agenda-card-teacher:hover{border-color:#7c3aed !important;box-shadow:0 10px 25px rgba(124,58,237,0.06) !important}
      `}</style>

      <div style={{ fontFamily: '"DM Sans",sans-serif', animation: 'tap_fi .4s ease' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>School Roadmap</h1>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Track your progress through the term's key milestones and sync with admin guidance.</p>
        </div>

        {!term ? (
          <div style={{ background: '#fff', borderRadius: 16, padding: '40px 20px', textAlign: 'center', border: '1px solid #f0eefe' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📆</div>
            <p style={{ color: '#6b7280' }}>No active term detected. Agendas will appear here once a term is set.</p>
          </div>
        ) : loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #ede9fe', borderTopColor: '#6d28d9', animation: 'tap_spin .8s linear infinite' }} />
          </div>
        ) : agendas.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 16, padding: '60px 20px', textAlign: 'center', border: '1.5px solid #f0eefe' }}>
             <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
             <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 6 }}>Welcome to {term.name}</h3>
             <p style={{ fontSize: 13, color: '#9ca3af', maxWidth: 300, marginInline: 'auto' }}>The school agenda hasn't been published yet. Check back soon for milestones and goals.</p>
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
                    background: isCompleted ? '#22c55e' : isStruggling ? '#ef4444' : '#7c3aed',
                    border: '4px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
                  }}>
                    {isCompleted ? <CheckCircle size={24} /> : isStruggling ? <AlertTriangle size={24} /> : <span style={{ fontWeight: 800, fontSize: 18 }}>{item.week_number}</span>}
                  </div>

                  {/* Card */}
                  <div className="agenda-card-teacher" style={{ 
                    flex: 1, background: '#fff', borderRadius: 20, border: '1.5px solid #f0eefe', padding: '20px 24px', 
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)', transition: 'all .25s ease'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div>
                         <div style={{ fontSize: 11, fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Week {item.week_number} Milestone</div>
                         <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>{item.title}</h3>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                         {resp && (
                           <span style={{ 
                             fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 99, 
                             background: isCompleted ? '#f0fdf4' : isStruggling ? '#fff1f2' : '#fefce8',
                             color: isCompleted ? '#16a34a' : isStruggling ? '#e11d48' : '#d97706',
                             border: `1px solid ${isCompleted ? '#bbf7d0' : isStruggling ? '#fecdd3' : '#fef08a'}`
                           }}>
                             {resp.status.toUpperCase()}
                           </span>
                         )}
                      </div>
                    </div>

                    <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.6, marginBottom: 20 }}>{item.description}</p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                       {/* Admin Reply Banner */}
                       {hasReply && (
                         <div style={{ background: '#f5f3ff', border: '1.5px solid #ddd6fe', borderRadius: 14, padding: '14px 16px', position: 'relative' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                               <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10 }}>A</div>
                               <span style={{ fontSize: 11, fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase' }}>Admin Guidance</span>
                            </div>
                            <p style={{ fontSize: 13, color: '#4c1d95', margin: 0, fontWeight: 500 }}>"{resp.admin_reply}"</p>
                         </div>
                       )}

                       <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                          <Btn variant="secondary" onClick={() => openStruggleModal(item)}>
                            {resp ? <Edit2 size={14} /> : <MessageSquare size={14} />} {resp ? 'Update Status / Report' : 'Send Update / Struggle'}
                          </Btn>
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
                 <div style={{ background: '#f8fafc', borderRadius: 12, padding: '12px', border: '1px solid #e2e8f0', marginBottom: 18 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Week {selectedAgenda.week_number}: {selectedAgenda.title}</div>
                 </div>
               )}

               <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>How are you doing with this plan? *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                     {[
                       { v: 'pending', label: 'Working on it', icon: <Clock size={14} />, color: '#6d28d9', bg: '#f5f3ff' },
                       { v: 'completed', label: 'Done & Success', icon: <CheckCircle size={14} />, color: '#16a34a', bg: '#f0fdf4' },
                       { v: 'struggling', label: 'Struggling', icon: <AlertTriangle size={14} />, color: '#dc2626', bg: '#fef2f2' },
                     ].map(opt => (
                       <button key={opt.v} onClick={() => setStatus(opt.v as any)}
                         style={{ 
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '10px 4px', borderRadius: 12,
                            border: `2px solid ${status === opt.v ? opt.color : '#f1f5f9'}`,
                            background: status === opt.v ? opt.bg : '#fff',
                            color: status === opt.v ? opt.color : '#94a3b8',
                            transition: 'all .2s', cursor: 'pointer', outline: 'none'
                         }}>
                         {opt.icon}
                         <span style={{ fontSize: 10, fontWeight: 700 }}>{opt.label}</span>
                       </button>
                     ))}
                  </div>
               </div>

               <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Share your feedback or struggles (to Admin)</label>
                  <textarea value={feedbackText} onChange={e => setFeedbackText(e.target.value)} rows={4}
                    placeholder="e.g. Students are finding the fractions difficult, I might need more time..."
                    style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 13.5, outline: 'none', fontFamily: '"DM Sans",sans-serif', resize: 'vertical', boxSizing: 'border-box' }} />
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 8, color: '#94a3b8' }}>
                    <Info size={12} />
                    <span style={{ fontSize: 11 }}>This message is sent directly to the school administration.</span>
                  </div>
               </div>

               <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <Btn variant="secondary" onClick={() => setStruggleModalOpen(false)}>Cancel</Btn>
                  <Btn onClick={submitResponse} loading={saving}>
                    <Send size={14} /> {responses[selectedAgenda?.id] ? 'Update Message' : 'Send Message'}
                  </Btn>
               </div>
            </div>
        </Modal>
      </div>
    </>
  )
}

function Edit2(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
    </svg>
  )
}
