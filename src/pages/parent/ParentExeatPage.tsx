import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useParentWards } from '../../hooks/useParents'
import { boardingService } from '../../services/boarding.service'
import Modal from '../../components/ui/Modal'
import toast from 'react-hot-toast'
import { MapPin, Send, Plus, Clock } from 'lucide-react'

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

export default function ParentExeatPage() {
  const { user } = useAuth()
  const schoolId = user?.school_id || ''
  const qc = useQueryClient()

  // Use the shared hook — queries parent_wards join table correctly
  const { data: wards = [] } = useParentWards()

  // Fetch all exeats for this parent's wards
  const { data: exeats = [] } = useQuery({
    queryKey: ['parent-exeats', user?.id, wards.map(w => w.id).join()],
    queryFn: async () => {
      if (wards.length === 0) return []
      const wardIds = wards.map((w: any) => w.id)
      const { data } = await supabase
        .from('exeat_requests')
        .select('*, student:students(full_name)')
        .in('student_id', wardIds)
        .order('created_at', { ascending: false })
      return data || []
    },
    enabled: wards.length > 0
  })

  const createExeat = useMutation({
    mutationFn: (d: any) => boardingService.createExeat(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['parent-exeats'] }); setModal(false); toast.success('Exeat request submitted') }
  })

  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ student_id: '', reason: '', destination: '', departure_time: '', expected_return_time: '' })

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto', fontFamily: '"DM Sans",sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1e0646', margin: '0 0 8px' }}>Exeat Requests</h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: 14 }}>Request permission for your ward to leave campus.</p>
        </div>
        <Btn onClick={() => { setForm({ student_id: wards[0]?.id || '', reason: '', destination: '', departure_time: '', expected_return_time: '' }); setModal(true) }}><Plus size={16} /> New Request</Btn>
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1.5px solid #f0eefe', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fcfaff', borderBottom: '1.5px solid #f0eefe' }}>
              <th style={{ padding: 16, textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Ward</th>
              <th style={{ padding: 16, textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Details</th>
              <th style={{ padding: 16, textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {exeats.map((ex: any) => (
              <tr key={ex.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                <td style={{ padding: 16, fontSize: 13, fontWeight: 600, color: '#1e0646' }}>{ex.student?.full_name}</td>
                <td style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#475569' }}>
                    <MapPin size={14} color="#9ca3af" /> {ex.destination}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569', marginTop: 4 }}>
                    <Clock size={12} color="#10b981" /> {new Date(ex.departure_time).toLocaleString()} - {new Date(ex.expected_return_time).toLocaleString()}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{ex.reason}</div>
                </td>
                <td style={{ padding: 16 }}>
                  <span style={{ 
                    padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                    background: ex.status === 'pending' ? '#fef3c7' : ex.status === 'approved' ? '#d1fae5' : ex.status === 'rejected' ? '#fee2e2' : '#f1f5f9',
                    color: ex.status === 'pending' ? '#b45309' : ex.status === 'approved' ? '#047857' : ex.status === 'rejected' ? '#b91c1c' : '#475569'
                  }}>
                    {ex.status}
                  </span>
                </td>
              </tr>
            ))}
            {exeats.length === 0 && <tr><td colSpan={3} style={{ padding: 32, textAlign: 'center', color: 'var(--text-subtle)', fontSize: 14 }}>No requests submitted yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Request Exeat" size="sm" footer={<><Btn variant="secondary" onClick={() => setModal(false)}>Cancel</Btn><Btn onClick={() => { if(!form.student_id || !form.destination || !form.departure_time || !form.expected_return_time) return toast.error('Fill required fields'); createExeat.mutate({ school_id: schoolId, student_id: form.student_id, requested_by: user?.id, reason: form.reason, destination: form.destination, departure_time: new Date(form.departure_time).toISOString(), expected_return_time: new Date(form.expected_return_time).toISOString(), parent_notified: true, security_notified: false, status: 'pending' }) }}><Send size={16} /> Submit</Btn></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>Ward</label>
            <select value={form.student_id} onChange={e => setForm(p => ({ ...p, student_id: e.target.value }))} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box' }}>
              <option value="">Select Ward...</option>
              {wards.map((w: any) => <option key={w.id} value={w.id}>{w.full_name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>Destination</label>
            <input value={form.destination} onChange={e => setForm(p => ({ ...p, destination: e.target.value }))} placeholder="e.g. Home, Hospital..." style={{ width: '100%', padding: 10, borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>Reason</label>
            <input value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} placeholder="Brief reason for leaving" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>Departure Time</label>
              <input type="datetime-local" value={form.departure_time} onChange={e => setForm(p => ({ ...p, departure_time: e.target.value }))} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>Expected Return</label>
              <input type="datetime-local" value={form.expected_return_time} onChange={e => setForm(p => ({ ...p, expected_return_time: e.target.value }))} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box' }} />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
