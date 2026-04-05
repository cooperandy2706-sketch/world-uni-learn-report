// src/pages/admin/AgendaPage.tsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useCurrentTerm, useTerms, useCurrentAcademicYear } from '../../hooks/useSettings'
import { agendaService } from '../../services'
import toast from 'react-hot-toast'
import Modal from '../../components/ui/Modal'
import { Send, Plus, Trash2, Edit2, MessageSquare, AlertTriangle, CheckCircle, Clock, ChevronRight, Layout } from 'lucide-react'

function Btn({ children, onClick, variant = 'primary', disabled, loading, style }: any) {
  const [hov, setHov] = useState(false)
  const v: any = {
    primary: { background: hov ? '#5b21b6' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', border: 'none' },
    secondary: { background: hov ? '#f5f3ff' : '#fff', color: '#374151', border: '1.5px solid #e5e7eb' },
    success: { background: hov ? '#15803d' : '#16a34a', color: '#fff', border: 'none' },
    danger: { background: hov ? '#b91c1c' : '#dc2626', color: '#fff', border: 'none' },
    ghost: { background: hov ? '#f9fafb' : 'transparent', color: '#6b7280', border: 'none' },
  }
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all .15s', opacity: disabled ? 0.6 : 1, fontFamily: '"DM Sans",sans-serif', ...v[variant], ...style }}>
      {loading && <span style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', animation: 'ap_spin .7s linear infinite', flexShrink: 0 }} />}
      {children}
    </button>
  )
}

export default function AdminAgendaPage() {
  const { user } = useAuth()
  const { data: currentYear } = useCurrentAcademicYear()
  const { data: terms = [] } = useTerms(currentYear?.id || '')
  const { data: currentTerm } = useCurrentTerm()

  const [selectedTermId, setSelectedTermId] = useState('')
  const [agendas, setAgendas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  
  const [form, setForm] = useState({ title: '', description: '', week_number: 1 })
  const [showStruggleModal, setShowStruggleModal] = useState(false)
  const [selectedAgendaForStruggles, setSelectedAgendaForStruggles] = useState<any>(null)
  const [responses, setResponses] = useState<any[]>([])
  const [replyText, setReplyText] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)

  useEffect(() => {
    if (currentTerm?.id && !selectedTermId) {
      setSelectedTermId(currentTerm.id)
    }
  }, [currentTerm?.id])

  useEffect(() => {
    if (selectedTermId) loadAgendas()
  }, [selectedTermId])

  async function loadAgendas() {
    setLoading(true)
    const { data } = await agendaService.getAgendas(user!.school_id, selectedTermId)
    setAgendas(data || [])
    setLoading(false)
  }

  async function saveAgenda() {
    if (!form.title || !form.description) { toast.error('Fill all fields'); return }
    setSaving(true)
    const { error } = await agendaService.upsertAgenda({
      id: editingItem?.id,
      school_id: user!.school_id,
      term_id: selectedTermId,
      title: form.title,
      description: form.description,
      week_number: form.week_number,
      created_by: user!.id
    })
    if (error) { toast.error(error.message); setSaving(false); return }
    
    toast.success(editingItem ? 'Agenda item updated!' : 'Agenda item added!')
    setSaving(false)
    setModalOpen(false)
    setEditingItem(null)
    setForm({ title: '', description: '', week_number: 1 })
    loadAgendas()
  }

  async function togglePublish(id: string, published: boolean) {
    await agendaService.publishAgenda(id, !published)
    loadAgendas()
    toast.success(!published ? 'Agenda published to teachers' : 'Agenda hidden from teachers')
  }

  async function deleteItem(id: string) {
    if (!confirm('Delete this agenda item?')) return
    await agendaService.deleteAgenda(id)
    loadAgendas()
    toast.success('Item deleted')
  }

  async function openStruggleMonitor(agenda: any) {
    setSelectedAgendaForStruggles(agenda)
    setShowStruggleModal(true)
    const { data } = await agendaService.getTeacherResponses(user!.school_id, agenda.id)
    setResponses(data || [])
  }

  async function sendReply(responseId: string) {
    if (!replyText.trim()) return
    const { error } = await agendaService.replyToStruggle(responseId, replyText)
    if (error) { toast.error('Failed to send reply'); return }
    toast.success('Reply sent')
    setReplyText('')
    setReplyingTo(null)
    // Refresh responses
    const { data } = await agendaService.getTeacherResponses(user!.school_id, selectedAgendaForStruggles.id)
    setResponses(data || [])
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes ap_spin{to{transform:rotate(360deg)}}
        @keyframes ap_fi{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .agenda-card:hover{box-shadow: 0 12px 30px rgba(109,40,217,0.08) !important; transform: translateY(-2px)}
      `}</style>
      
      <div style={{ fontFamily: '"DM Sans",sans-serif', animation: 'ap_fi .4s ease' }}>
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 28, fontWeight: 700, color: '#111827', margin: 0 }}>Term Agenda</h1>
            <p style={{ fontSize: 13.5, color: '#6b7280', marginTop: 4 }}>Set the academic roadmap and monitor teacher feedback</p>
          </div>
          <Btn onClick={() => { setEditingItem(null); setForm({ title: '', description: '', week_number: 1 }); setModalOpen(true) }}>
            <Plus size={16} /> Create Agenda Item
          </Btn>
        </div>

        {/* Term Selector */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '16px 20px', border: '1.5px solid #f0eefe', marginBottom: 22, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 2px 8px rgba(109,40,217,0.03)' }}>
          <Layout size={18} color="#7c3aed" />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Select Term:</span>
          <select value={selectedTermId} onChange={e => setSelectedTermId(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 13, color: '#111827', outline: 'none', background: '#faf5ff', fontFamily: '"DM Sans",sans-serif', cursor: 'pointer', maxWidth: 260 }}>
            {terms.map((t: any) => <option key={t.id} value={t.id}>{t.name} {t.is_current ? '(Current)' : ''}</option>)}
          </select>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #ede9fe', borderTopColor: '#6d28d9', animation: 'ap_spin .8s linear infinite' }} />
          </div>
        ) : agendas.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 20, padding: '80px 40px', textAlign: 'center', border: '1.5px solid #f0eefe', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🗓️</div>
            <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>No agenda items yet</h3>
            <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 24, maxWidth: 320, marginInline: 'auto' }}>Create your first agenda item to start building the term roadmap for your teachers.</p>
            <Btn onClick={() => setModalOpen(true)}>🎯 Get Started</Btn>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {agendas.map((item, idx) => (
              <div key={item.id} className="agenda-card" style={{ 
                background: '#fff', borderRadius: 20, border: '1.5px solid #f0eefe', padding: '20px 24px', 
                boxShadow: '0 2px 10px rgba(109,40,217,0.04)', transition: 'all .25s ease',
                display: 'flex', gap: 20, position: 'relative', overflow: 'hidden'
              }}>
                {/* Week Indicator */}
                <div style={{ 
                  width: 54, height: 54, borderRadius: 16, background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', 
                  color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, boxShadow: '0 4px 15px rgba(109,40,217,0.2)'
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.8, textTransform: 'uppercase' }}>Week</div>
                  <div style={{ fontSize: 20, fontWeight: 800 }}>{item.week_number}</div>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>{item.title}</h3>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{ 
                        fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 99, 
                        background: item.is_published ? '#f0fdf4' : '#fef2f2',
                        color: item.is_published ? '#16a34a' : '#dc2626',
                        border: `1px solid ${item.is_published ? '#bbf7d0' : '#fecaca'}`,
                        letterSpacing: '0.04em'
                      }}>
                        {item.is_published ? 'PUBLISHED' : 'DRAFT'}
                      </span>
                    </div>
                  </div>
                  <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.6, margin: '0 0 16px' }}>{item.description}</p>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <Btn variant="secondary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => openStruggleMonitor(item)}>
                      <MessageSquare size={14} /> Teacher Feedback
                    </Btn>
                    <div style={{ flex: 1 }} />
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Btn variant="ghost" style={{ padding: 6, borderRadius: 8 }} onClick={() => {
                        setEditingItem(item)
                        setForm({ title: item.title, description: item.description, week_number: item.week_number })
                        setModalOpen(true)
                      }}>
                        <Edit2 size={15} color="#6d28d9" />
                      </Btn>
                      <Btn variant="ghost" style={{ padding: 6, borderRadius: 8 }} onClick={() => togglePublish(item.id, item.is_published)}>
                        {item.is_published ? <Clock size={15} color="#d97706" /> : <CheckCircle size={15} color="#16a34a" />}
                      </Btn>
                      <Btn variant="ghost" style={{ padding: 6, borderRadius: 8 }} onClick={() => deleteItem(item.id)}>
                        <Trash2 size={15} color="#dc2626" />
                      </Btn>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingItem ? "Edit Agenda Item" : "Create Agenda Item"}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Title *</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} 
                placeholder="e.g. Mid-Term Assessments & Review"
                style={{ width: '100%', padding: '11px 14px', borderRadius: 11, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', fontFamily: '"DM Sans",sans-serif', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Week Number *</label>
                <input type="number" min={1} max={15} value={form.week_number} onChange={e => setForm({ ...form, week_number: parseInt(e.target.value) })}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 11, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', fontFamily: '"DM Sans",sans-serif', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Agenda Details / Description *</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={5}
                placeholder="Detail what teachers should focus on during this week..."
                style={{ width: '100%', padding: '11px 14px', borderRadius: 11, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', fontFamily: '"DM Sans",sans-serif', resize: 'vertical', minHeight: 100, boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <Btn variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Btn>
              <Btn onClick={saveAgenda} loading={saving}>Save Agenda Item</Btn>
            </div>
          </div>
        </Modal>

        {/* Struggle Monitor Modal */}
        <Modal open={showStruggleModal} onClose={() => setShowStruggleModal(false)} title="Teacher Feedback Loop" size="lg">
          <div style={{ paddingTop: 10 }}>
            {selectedAgendaForStruggles && (
              <div style={{ background: '#f5f3ff', borderRadius: 12, padding: '12px 16px', marginBottom: 20, border: '1px solid #ddd6fe' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', marginBottom: 4 }}>Monitoring:</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1e1b4b' }}>{selectedAgendaForStruggles.title}</div>
              </div>
            )}

            {responses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
                <Layout size={32} color="#e5e7eb" style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 14 }}>No teacher responses yet.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 450, overflowY: 'auto', paddingRight: 6 }}>
                {responses.map(res => (
                  <div key={res.id} style={{ 
                    background: '#fff', borderRadius: 15, border: '1.5px solid #f1f5f9', padding: '16px',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 50, background: 'linear-gradient(135deg,#7c3aed,#9333ea)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                          {res.teacher?.user?.full_name?.charAt(0)}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{res.teacher?.user?.full_name}</div>
                      </div>
                      <span style={{ 
                        fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 99, 
                        background: res.status === 'struggling' ? '#fff1f2' : res.status === 'completed' ? '#f0fdf4' : '#fefce8',
                        color: res.status === 'struggling' ? '#e11d48' : res.status === 'completed' ? '#16a34a' : '#d97706',
                        border: `1px solid ${res.status === 'struggling' ? '#fecdd3' : res.status === 'completed' ? '#bbf7d0' : '#fef08a'}`
                      }}>
                        {res.status.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px', fontSize: 13.5, color: '#334155', marginBottom: 12, border: '1px solid #f1f5f9' }}>
                      {res.feedback || <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>No detailed feedback provided.</span>}
                    </div>

                    {res.admin_reply ? (
                      <div style={{ marginLeft: 20, position: 'relative' }}>
                        <div style={{ position: 'absolute', left: -14, top: 0, bottom: 0, width: 2, background: '#e2e8f0', borderRadius: 4 }} />
                        <div style={{ background: '#f5f3ff', borderRadius: 10, padding: '12px', fontSize: 13.5, color: '#4c1d95', border: '1px solid #ddd6fe' }}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: '#7c3aed', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <CheckCircle size={10} /> YOUR REPLY
                          </div>
                          {res.admin_reply}
                        </div>
                      </div>
                    ) : replyingTo === res.id ? (
                      <div style={{ marginTop: 10 }}>
                        <textarea value={replyText} onChange={e => setReplyText(e.target.value)}
                          placeholder="Your guidance/reply to this teacher..."
                          style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #7c3aed', fontSize: 13, outline: 'none', fontFamily: '"DM Sans",sans-serif', resize: 'none', boxSizing: 'border-box' }} rows={2} />
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 8 }}>
                          <Btn variant="ghost" onClick={() => setReplyingTo(null)} style={{ fontSize: 11 }}>Cancel</Btn>
                          <Btn onClick={() => sendReply(res.id)} style={{ padding: '5px 12px', fontSize: 11 }}>
                            <Send size={12} /> Send Guidance
                          </Btn>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Btn variant="secondary" style={{ padding: '6px 12px', fontSize: 11 }} onClick={() => setReplyingTo(res.id)}>
                          <Send size={12} /> Reply to Teacher
                        </Btn>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      </div>
    </>
  )
}
