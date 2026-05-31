import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { boardingService } from '../../services/boarding.service'
import Modal from '../../components/ui/Modal'
import toast from 'react-hot-toast'
import { CheckCircle, XCircle, Clock, MapPin, Send } from 'lucide-react'

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

export default function ExeatPage() {
  const { user } = useAuth()
  const schoolId = user?.school_id || ''
  const qc = useQueryClient()

  const { data: exeats = [], isLoading } = useQuery({ 
    queryKey: ['exeats', schoolId], 
    queryFn: async () => { const { data } = await boardingService.getExeats(schoolId); return data || [] },
    enabled: !!schoolId
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status, notes }: any) => boardingService.updateExeatStatus(id, status, user?.id, notes),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['exeats'] }); toast.success('Exeat updated') }
  })

  const [reviewModal, setReviewModal] = useState(false)
  const [selectedExeat, setSelectedExeat] = useState<any>(null)
  const [reviewNotes, setReviewNotes] = useState('')

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto', fontFamily: '"DM Sans",sans-serif' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1e0646', margin: '0 0 8px' }}>Exeat Requests</h1>
        <p style={{ color: '#64748b', margin: 0, fontSize: 14 }}>Review and approve student leave requests.</p>
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1.5px solid #f0eefe', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fcfaff', borderBottom: '1.5px solid #f0eefe' }}>
              <th style={{ padding: 16, textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Student</th>
              <th style={{ padding: 16, textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Destination</th>
              <th style={{ padding: 16, textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Schedule</th>
              <th style={{ padding: 16, textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
              <th style={{ padding: 16, textAlign: 'right' }}></th>
            </tr>
          </thead>
          <tbody>
            {exeats.map((ex: any) => (
              <tr key={ex.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                <td style={{ padding: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1e0646' }}>{ex.student?.full_name}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Req by: {ex.requester?.full_name} ({ex.requester?.role})</div>
                </td>
                <td style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#475569' }}>
                    <MapPin size={14} color="#9ca3af" /> {ex.destination}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{ex.reason}</div>
                </td>
                <td style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569' }}>
                    <Send size={12} color="#f59e0b" /> Departs: {new Date(ex.departure_time).toLocaleString()}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569', marginTop: 4 }}>
                    <Clock size={12} color="#10b981" /> Returns: {new Date(ex.expected_return_time).toLocaleString()}
                  </div>
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
                <td style={{ padding: 16, textAlign: 'right' }}>
                  {ex.status === 'pending' && (
                    <Btn onClick={() => { setSelectedExeat(ex); setReviewNotes(''); setReviewModal(true) }} variant="secondary">Review</Btn>
                  )}
                </td>
              </tr>
            ))}
            {exeats.length === 0 && <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: 'var(--text-subtle)', fontSize: 14 }}>No exeat requests found.</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal open={reviewModal} onClose={() => setReviewModal(false)} title="Review Exeat Request" size="sm" footer={<><Btn variant="secondary" onClick={() => setReviewModal(false)}>Cancel</Btn><Btn onClick={() => { updateStatus.mutate({ id: selectedExeat?.id, status: 'approved', notes: reviewNotes }); setReviewModal(false) }} style={{ background: '#10b981' }}><CheckCircle size={16} /> Approve</Btn><Btn onClick={() => { updateStatus.mutate({ id: selectedExeat?.id, status: 'rejected', notes: reviewNotes }); setReviewModal(false) }} variant="danger"><XCircle size={16} /> Reject</Btn></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, fontSize: 13, color: '#475569' }}>
            <p style={{ margin: '0 0 8px' }}><strong>Student:</strong> {selectedExeat?.student?.full_name}</p>
            <p style={{ margin: '0 0 8px' }}><strong>Reason:</strong> {selectedExeat?.reason}</p>
            <p style={{ margin: '0 0 8px' }}><strong>Destination:</strong> {selectedExeat?.destination}</p>
            <p style={{ margin: '0 0 8px' }}><strong>Departure:</strong> {selectedExeat?.departure_time && new Date(selectedExeat.departure_time).toLocaleString()}</p>
            <p style={{ margin: 0 }}><strong>Return:</strong> {selectedExeat?.expected_return_time && new Date(selectedExeat.expected_return_time).toLocaleString()}</p>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>Review Notes (Optional)</label>
            <textarea value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} placeholder="Add any notes for the student/parent..." style={{ width: '100%', padding: 10, borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box', minHeight: 80, resize: 'vertical' }} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
