import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useStudents } from '../../hooks/useStudents'
import { pastoralService } from '../../services/boarding.service'
import Modal from '../../components/ui/Modal'
import toast from 'react-hot-toast'
import { Plus, Heart, ShieldAlert, Lock, Trash2, Edit } from 'lucide-react'

function Btn({ children, onClick, variant = 'primary', style, disabled }: any) {
  const [hov, setHov] = useState(false)
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '9px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600,
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

  const { data: logs = [], isLoading } = useQuery({ queryKey: ['pastoral_logs'], queryFn: async () => { const { data } = await pastoralService.getLogs(schoolId); return data || [] } })

  const createLog = useMutation({ mutationFn: (d: any) => pastoralService.createLog(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['pastoral_logs'] }); setModal(false); toast.success('Log created') } })
  const updateLog = useMutation({ mutationFn: ({ id, data }: any) => pastoralService.updateLog(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['pastoral_logs'] }); setModal(false); toast.success('Log updated') } })
  const deleteLog = useMutation({ mutationFn: (id: string) => pastoralService.deleteLog(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['pastoral_logs'] }); toast.success('Log deleted') } })

  const [modal, setModal] = useState(false)
  const [editingLog, setEditingLog] = useState<any>(null)
  const [form, setForm] = useState({ student_id: '', category: 'emotional', notes: '', follow_up_date: '', is_private: true })

  const CATEGORY_ICONS: Record<string, { icon: React.ReactNode, color: string, bg: string }> = {
    academic: { icon: <ShieldAlert size={16} />, color: '#0284c7', bg: '#e0f2fe' },
    behavioral: { icon: <ShieldAlert size={16} />, color: '#b91c1c', bg: '#fee2e2' },
    emotional: { icon: <Heart size={16} />, color: '#e11d48', bg: '#ffe4e6' },
    family: { icon: <Heart size={16} />, color: '#d97706', bg: '#fef3c7' },
    peer: { icon: <Heart size={16} />, color: '#7c3aed', bg: '#f3e8ff' },
    other: { icon: <Heart size={16} />, color: '#475569', bg: '#f1f5f9' },
  }

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto', fontFamily: '"DM Sans",sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1e0646', margin: '0 0 8px' }}>Pastoral Care (SEL)</h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: 14 }}>Securely log counseling and social-emotional tracking data.</p>
        </div>
        <Btn onClick={() => { setEditingLog(null); setForm({ student_id: '', category: 'emotional', notes: '', follow_up_date: '', is_private: true }); setModal(true) }}><Plus size={16} /> New Log</Btn>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 20 }}>
        {logs.map((log: any) => {
          const config = CATEGORY_ICONS[log.category] || CATEGORY_ICONS.other
          // Hide sensitive notes if it's private and the user didn't create it (unless user is super_admin, assuming role logic handles this, or just basic UI check here)
          const canViewDetails = !log.is_private || log.counselor_id === user?.id || user?.role === 'admin'
          
          return (
            <div key={log.id} style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1.5px solid #f0eefe' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ background: config.bg, color: config.color, padding: 10, borderRadius: 10 }}>{config.icon}</div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1e0646' }}>{log.student?.full_name}</h3>
                    <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 700 }}>{log.category} &middot; {new Date(log.date).toLocaleDateString()}</span>
                  </div>
                </div>
                {log.is_private && <Lock size={14} color="#94a3b8" title="Private Log" />}
              </div>
              
              <div style={{ fontSize: 13, color: '#475569', background: '#f8fafc', padding: 12, borderRadius: 8, marginTop: 12, minHeight: 60, whiteSpace: 'pre-wrap' }}>
                {canViewDetails ? log.notes : <em style={{ color: '#9ca3af' }}>This log is marked private and can only be viewed by the counselor who created it.</em>}
              </div>

              {log.follow_up_date && (
                <div style={{ fontSize: 11, color: '#d97706', fontWeight: 700, marginTop: 12, background: '#fef3c7', padding: '6px 10px', borderRadius: 6, display: 'inline-block' }}>
                  Follow-up: {new Date(log.follow_up_date).toLocaleDateString()}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>Logged by: {log.counselor?.full_name}</div>
                {(log.counselor_id === user?.id || user?.role === 'admin') && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { setEditingLog(log); setForm({ student_id: log.student_id, category: log.category, notes: log.notes, follow_up_date: log.follow_up_date || '', is_private: log.is_private }); setModal(true) }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}><Edit size={14} /></button>
                    <button onClick={() => { if(confirm('Delete log?')) deleteLog.mutate(log.id) }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={14} /></button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
        {logs.length === 0 && <p style={{ color: '#9ca3af', fontSize: 14 }}>No pastoral care logs recorded.</p>}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editingLog ? "Edit Pastoral Log" : "New Pastoral Log"} size="sm" footer={<><Btn variant="secondary" onClick={() => setModal(false)}>Cancel</Btn><Btn onClick={() => { if(!form.student_id || !form.notes) return toast.error('Student and Notes are required'); const payload = { school_id: schoolId, student_id: form.student_id, counselor_id: user?.id, category: form.category, notes: form.notes, follow_up_date: form.follow_up_date || null, is_private: form.is_private }; if (editingLog) updateLog.mutate({ id: editingLog.id, data: payload }); else createLog.mutate(payload) }}>Save Log</Btn></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>Student *</label>
            <select value={form.student_id} onChange={e => setForm(p => ({ ...p, student_id: e.target.value }))} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box' }} disabled={!!editingLog}>
              <option value="">Select Student...</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.student_id || 'No ID'})</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>Category</label>
            <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box' }}>
              <option value="academic">Academic / Learning</option>
              <option value="behavioral">Behavioral / Disciplinary</option>
              <option value="emotional">Emotional / Psychological</option>
              <option value="family">Family / Home Life</option>
              <option value="peer">Peer Relationships</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>Session Notes *</label>
            <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Describe the meeting or incident securely..." style={{ width: '100%', padding: 10, borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box', minHeight: 100, resize: 'vertical' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>Follow-up Date (Optional)</label>
            <input type="date" value={form.follow_up_date} onChange={e => setForm(p => ({ ...p, follow_up_date: e.target.value }))} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box' }} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.is_private} onChange={e => setForm(p => ({ ...p, is_private: e.target.checked }))} style={{ accentColor: '#6d28d9', width: 16, height: 16 }} />
            Mark as Private (Only you and Administrators can view details)
          </label>
        </div>
      </Modal>
    </div>
  )
}
