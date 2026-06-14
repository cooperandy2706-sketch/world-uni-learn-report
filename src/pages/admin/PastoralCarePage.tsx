import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import { useStudents } from '../../hooks/useStudents'
import { pastoralService } from '../../services/boarding.service'
import toast from 'react-hot-toast'
import { Plus, Heart, ShieldAlert, Lock, Trash2, Edit } from 'lucide-react'

function Btn({ children, onClick, variant = 'primary', style, disabled }: any) {
  const [hov, setHov] = useState(false)
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700,
    border: variant === 'secondary' ? '1.5px solid #e5e7eb' : 'none', cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s', opacity: disabled ? 0.6 : 1,
    fontFamily: '"DM Sans",sans-serif',
    background: variant === 'secondary' ? (hov ? '#f8fafc' : '#fff') : variant === 'danger' ? (hov ? '#b91c1c' : '#dc2626') : (hov ? '#5b21b6' : '#6d28d9'),
    color: variant === 'secondary' ? '#374151' : '#fff',
    ...style,
  }
  return <button disabled={disabled} onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={base}>{children}</button>
}

export default function PastoralCarePage() {
  const { user } = useAuth()
  const schoolId = user?.school_id || ''
  const qc = useQueryClient()
  const { data: students = [] } = useStudents()

  const { data: logs = [], isLoading } = useQuery({ 
    queryKey: ['pastoral_logs', schoolId], 
    queryFn: async () => { 
      const { data } = await pastoralService.getLogs(schoolId)
      return data || [] 
    },
    enabled: !!schoolId
  })

  const [viewMode, setViewMode] = useState<'list' | 'create'>('list')
  const [editingLog, setEditingLog] = useState<any>(null)
  const [form, setForm] = useState({ student_id: '', category: 'emotional', notes: '', follow_up_date: '', is_private: true })

  const createLog = useMutation({ 
    mutationFn: (d: any) => pastoralService.createLog(d), 
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ['pastoral_logs'] })
      setViewMode('list')
      toast.success('Log created successfully!') 
    } 
  })

  const updateLog = useMutation({ 
    mutationFn: ({ id, data }: any) => pastoralService.updateLog(id, data), 
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ['pastoral_logs'] })
      setViewMode('list')
      toast.success('Log updated successfully!') 
    } 
  })

  const deleteLog = useMutation({ 
    mutationFn: (id: string) => pastoralService.deleteLog(id), 
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ['pastoral_logs'] })
      toast.success('Log deleted') 
    } 
  })

  const CATEGORY_ICONS: Record<string, { icon: React.ReactNode, color: string, bg: string }> = {
    academic: { icon: <ShieldAlert size={16} />, color: '#0284c7', bg: '#e0f2fe' },
    behavioral: { icon: <ShieldAlert size={16} />, color: '#b91c1c', bg: '#fee2e2' },
    emotional: { icon: <Heart size={16} />, color: '#e11d48', bg: '#ffe4e6' },
    family: { icon: <Heart size={16} />, color: '#d97706', bg: '#fef3c7' },
    peer: { icon: <Heart size={16} />, color: '#7c3aed', bg: '#f3e8ff' },
    other: { icon: <Heart size={16} />, color: '#475569', bg: '#f1f5f9' },
  }

  return (
    <div style={{ padding: '20px 14px 100px', maxWidth: 1200, margin: '0 auto', fontFamily: '"DM Sans",sans-serif' }}>
      <style>{`
        @keyframes _fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {viewMode === 'create' ? (
        /* ── INLINE NEW/EDIT LOG CARD FORM ── */
        <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1.5px solid #f0eefe', padding: '24px 20px', animation: '_fadeUp 0.3s ease', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: '1px solid #f1f5f9', paddingBottom: 16 }}>
            <div>
              <button onClick={() => setViewMode('list')} style={{ background: 'none', border: 'none', color: '#6d28d9', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: 0, marginBottom: 4, display: 'block' }}>← Back to Logs</button>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#1e0646' }}>{editingLog ? "Edit Pastoral Care Log" : "New Pastoral Care Log"}</h2>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>Log secure social-emotional student evaluations</p>
            </div>
            <button onClick={() => setViewMode('list')} style={{ background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: '50%', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.05em' }}>Student *</label>
              <select value={form.student_id} onChange={e => setForm(p => ({ ...p, student_id: e.target.value }))} style={{ width: '100%', padding: '12px 14px', borderRadius: 9, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', background: 'var(--bg-card)', boxSizing: 'border-box' }} disabled={!!editingLog}>
                <option value="">Select Student...</option>
                {(Array.isArray(students) ? students : []).map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.student_id || 'No ID'})</option>)}
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.05em' }}>Category</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={{ width: '100%', padding: '12px 14px', borderRadius: 9, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', background: 'var(--bg-card)', boxSizing: 'border-box' }}>
                <option value="academic">Academic / Learning</option>
                <option value="behavioral">Behavioral / Disciplinary</option>
                <option value="emotional">Emotional / Psychological</option>
                <option value="family">Family / Home Life</option>
                <option value="peer">Peer Relationships</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.05em' }}>Session Notes *</label>
              <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Describe the counseling session or behavioral incident details securely..." style={{ width: '100%', padding: '12px 14px', borderRadius: 9, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box', minHeight: 120, resize: 'vertical', fontFamily: 'inherit' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.05em' }}>Follow-up Date (Optional)</label>
              <input type="date" value={form.follow_up_date} onChange={e => setForm(p => ({ ...p, follow_up_date: e.target.value }))} style={{ width: '100%', padding: '12px 14px', borderRadius: 9, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#475569', cursor: 'pointer', background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #f1f5f9' }}>
              <input type="checkbox" checked={form.is_private} onChange={e => setForm(p => ({ ...p, is_private: e.target.checked }))} style={{ accentColor: '#6d28d9', width: 18, height: 18, cursor: 'pointer' }} />
              <div>
                <span style={{ fontWeight: 700, color: '#1e0646', display: 'block' }}>Mark as Private Log</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>Only you and school administrators will have access to view detail notes.</span>
              </div>
            </label>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: 20, marginTop: 24 }}>
            <Btn variant="secondary" onClick={() => setViewMode('list')}>Cancel</Btn>
            <Btn onClick={() => {
              if(!form.student_id || !form.notes) return toast.error('Student and Notes are required');
              const payload = { school_id: schoolId, student_id: form.student_id, counselor_id: user?.id, category: form.category, notes: form.notes, follow_up_date: form.follow_up_date || null, is_private: form.is_private };
              if (editingLog) updateLog.mutate({ id: editingLog.id, data: payload });
              else createLog.mutate(payload);
            }}>Save Log</Btn>
          </div>
        </div>
      ) : (
        /* ── REGULAR LIST VIEW ── */
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 14, flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1e0646', margin: '0 0 6px' }}>Pastoral Care & Counseling</h1>
              <p style={{ color: '#64748b', margin: 0, fontSize: 14 }}>Securely track students' social-emotional learning, behavior, and wellbeing.</p>
            </div>
            <Btn onClick={() => { setEditingLog(null); setForm({ student_id: '', category: 'emotional', notes: '', follow_up_date: '', is_private: true }); setViewMode('create') }}><Plus size={16} /> New Log</Btn>
          </div>

          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <div className="animate-spin" style={{ width: 32, height: 32, border: '4px solid #f3f3f3', borderTop: '4px solid #6d28d9', borderRadius: '50%' }} />
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
              {(Array.isArray(logs) ? logs : []).map((log: any) => {
                const config = CATEGORY_ICONS[log.category] || CATEGORY_ICONS.other
                const canViewDetails = !log.is_private || log.counselor_id === user?.id || user?.role === 'admin'
                
                return (
                  <div key={log.id} style={{ background: 'var(--bg-card)', borderRadius: 8, padding: 20, border: '1.5px solid #f0eefe', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 200, animation: '_fadeUp 0.3s ease' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <div style={{ background: config.bg, color: config.color, padding: '10px', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{config.icon}</div>
                          <div>
                            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1e0646' }}>{log.student?.full_name}</h3>
                            <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 700 }}>{log.category} &middot; {new Date(log.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                        {log.is_private && <Lock size={14} color="#94a3b8" title="Private Log" />}
                      </div>
                      
                      <div style={{ fontSize: 13, color: '#475569', background: '#f8fafc', padding: 14, borderRadius: 10, marginTop: 12, minHeight: 60, whiteSpace: 'pre-wrap', border: '1px solid #f1f5f9', lineHeight: 1.5 }}>
                        {canViewDetails ? log.notes : <em style={{ color: 'var(--text-subtle)' }}>This log is marked private and can only be viewed by the counselor who created it.</em>}
                      </div>

                      {log.follow_up_date && (
                        <div style={{ fontSize: 11, color: '#d97706', fontWeight: 700, marginTop: 12, background: '#fef3c7', padding: '6px 10px', borderRadius: 6, display: 'inline-block' }}>
                          📅 Follow-up: {new Date(log.follow_up_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, borderTop: '1px solid #f1f5f9', paddingTop: 14 }}>
                      <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Counselor: {log.counselor?.full_name}</div>
                      {(log.counselor_id === user?.id || user?.role === 'admin') && (
                        <div style={{ display: 'flex', gap: 12 }}>
                          <button onClick={() => { setEditingLog(log); setForm({ student_id: log.student_id, category: log.category, notes: log.notes, follow_up_date: log.follow_up_date || '', is_private: log.is_private }); setViewMode('create') }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', padding: 4 }}><Edit size={14} /></button>
                          <button onClick={() => { if(confirm('Are you sure you want to delete this pastoral care log?')) deleteLog.mutate(log.id) }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', padding: 4 }}><Trash2 size={14} /></button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {!isLoading && logs.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 0', background: 'var(--bg-card)', borderRadius: 8, border: '1.5px dashed #f0eefe', color: 'var(--text-subtle)', marginTop: 20 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🌿</div>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#1e0646', margin: 0 }}>No counseling logs found</p>
              <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 16px' }}>Start logging social-emotional progress tracking sessions.</p>
              <Btn onClick={() => { setEditingLog(null); setForm({ student_id: '', category: 'emotional', notes: '', follow_up_date: '', is_private: true }); setViewMode('create') }}><Plus size={16} /> Record First Session</Btn>
            </div>
          )}
        </>
      )}
    </div>
  )
}
