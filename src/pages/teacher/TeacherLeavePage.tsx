import { useState, useEffect } from 'react'
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Plus, X } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { LeaveService } from '../../services/leave.service'
import FlaskLoader from '../../components/ui/FlaskLoader'
import toast from 'react-hot-toast'

export default function TeacherLeavePage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  
  // Form state
  const [leaveType, setLeaveType] = useState('sick')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user?.id) {
      loadRequests()
    }
  }, [user?.id])

  async function loadRequests() {
    try {
      const data = await LeaveService.getMyRequests(user!.id)
      setRequests(data || [])
    } catch (err: any) {
      console.error('[LeaveLoad]', err)
      toast.error(err?.message || 'Failed to load leave requests')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!startDate || !endDate) return
    setSubmitting(true)
    try {
      await LeaveService.createRequest({
        school_id: user!.school_id,
        user_id: user!.id,
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason
      })
      setShowForm(false)
      setStartDate('')
      setEndDate('')
      setReason('')
      setLeaveType('sick')
      loadRequests()
    } catch (err: any) {
      console.error('[LeaveSubmit]', err)
      toast.error(err?.message || 'Failed to submit leave request')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'approved': 
        return { icon: <CheckCircle size={16} />, color: '#16a34a', bg: '#f0fdf4', label: 'Approved' }
      case 'rejected': 
        return { icon: <XCircle size={16} />, color: '#dc2626', bg: '#fef2f2', label: 'Rejected' }
      default: 
        return { icon: <Clock size={16} />, color: '#d97706', bg: '#fffbeb', label: 'Pending' }
    }
  }

  if (loading) {
    return <FlaskLoader label="Loading leave requests..." fullScreen={false} />
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        .req-card { transition: all 0.2s ease; }
        .req-card:hover { transform: translateY(-2px); box-shadow: 0 12px 24px rgba(109,40,217,0.08) !important; }
        .input-field { width: 100%; padding: 12px 16px; border-radius: 12px; border: 1.5px solid #e5e7eb; font-size: 14px; outline: none; font-family: "DM Sans", sans-serif; transition: all 0.2s ease; background: #fff; box-sizing: border-box; }
        .input-field:focus { border-color: #7c3aed; box-shadow: 0 0 0 4px rgba(124,58,237,0.1); }
      `}</style>
      <div style={{ fontFamily: '"DM Sans", system-ui, sans-serif', animation: 'fadeIn 0.4s ease', paddingBottom: 40 }}>
        
        {/* Header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 32, animation: 'fadeUp 0.4s ease both' }}>
          <div>
            <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 32, fontWeight: 700, color: 'var(--text-main)', margin: '0 0 4px' }}>
              My Leave Requests
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>Request time off and track approval status</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: showForm ? '#fff' : 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: showForm ? '#374151' : '#fff', border: showForm ? '1.5px solid #e5e7eb' : 'none', padding: '10px 20px', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: showForm ? 'none' : '0 4px 12px rgba(109,40,217,0.25)' }}
          >
            {showForm ? <><X size={18} /> Cancel</> : <><Plus size={18} /> Request Leave</>}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div style={{ background: 'var(--bg-card)', borderRadius: 20, border: '1.5px solid #f0eefe', padding: '24px 32px', marginBottom: 32, boxShadow: '0 8px 32px rgba(0,0,0,0.04)', animation: 'fadeUp 0.3s ease both' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)', marginBottom: 24, borderBottom: '1px solid var(--border-light)', paddingBottom: 16 }}>New Leave Request</h2>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 24 }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 8 }}>Leave Type</label>
                  <select className="input-field" value={leaveType} onChange={e => setLeaveType(e.target.value)}>
                    <option value="sick">Sick Leave</option>
                    <option value="personal">Personal Leave</option>
                    <option value="vacation">Vacation</option>
                    <option value="maternity">Maternity/Paternity</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 8 }}>Start Date</label>
                  <input type="date" required className="input-field" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 8 }}>End Date</label>
                  <input type="date" required className="input-field" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 8 }}>Reason (Optional)</label>
                <textarea rows={3} className="input-field" value={reason} onChange={e => setReason(e.target.value)} placeholder="Briefly explain your reason for leave..." style={{ resize: 'vertical' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8, paddingTop: 20, borderTop: '1px solid var(--border-light)' }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 20px', borderRadius: 12, border: '1.5px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting} style={{ padding: '10px 24px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: submitting ? 'default' : 'pointer', opacity: submitting ? 0.7 : 1, boxShadow: '0 4px 12px rgba(109,40,217,0.2)' }}>
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Requests List */}
        {requests.length === 0 ? (
          <div style={{ background: 'var(--bg-card)', border: '1.5px dashed var(--border-color)', borderRadius: 24, padding: '60px 20px', textAlign: 'center', animation: 'fadeUp 0.4s ease 0.1s both' }}>
            <div style={{ width: 64, height: 64, background: '#f5f3ff', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Calendar size={32} color="#7c3aed" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)', margin: '0 0 8px' }}>No Leave Requests</h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0, maxWidth: 300, marginLeft: 'auto', marginRight: 'auto' }}>You haven't requested any time off yet. When you do, it will appear here.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {requests.map((req, i) => {
              const statusInfo = getStatusDisplay(req.status)
              return (
                <div key={req.id} className="req-card" style={{ background: 'var(--bg-card)', borderRadius: 20, border: '1px solid #f0eefe', padding: 20, display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'space-between', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', animation: `fadeUp 0.4s ease ${0.1 + i * 0.05}s both` }}>
                  
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: statusInfo.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: statusInfo.color, flexShrink: 0 }}>
                      <Calendar size={24} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', margin: 0, textTransform: 'capitalize' }}>{req.leave_type} Leave</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 99, background: statusInfo.bg, color: statusInfo.color, fontSize: 12, fontWeight: 700 }}>
                          {statusInfo.icon} {statusInfo.label}
                        </div>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{new Date(req.start_date).toLocaleDateString('en-GB', { dateStyle: 'medium' })}</span>
                        <span>→</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{new Date(req.end_date).toLocaleDateString('en-GB', { dateStyle: 'medium' })}</span>
                      </div>
                      {req.reason && (
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5, maxWidth: 500 }}>{req.reason}</p>
                      )}
                    </div>
                  </div>

                  {/* Right side info (Substitute & Admin notes) */}
                  {(req.substitute || req.admin_notes) && (
                    <div style={{ minWidth: 240, flex: 1, maxWidth: 400, background: '#f8fafc', borderRadius: 16, padding: 16, border: '1px solid #f1f5f9' }}>
                      {req.substitute && (
                        <div style={{ marginBottom: req.admin_notes ? 12 : 0 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: 4 }}>Assigned Substitute</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>
                              {req.substitute.full_name?.charAt(0)}
                            </div>
                            <span style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>{req.substitute.full_name}</span>
                          </div>
                        </div>
                      )}
                      {req.admin_notes && (
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: 4 }}>Admin Notes</div>
                          <div style={{ fontSize: 13, color: '#475569', fontStyle: 'italic', background: 'var(--bg-card)', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>"{req.admin_notes}"</div>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )
            })}
          </div>
        )}

      </div>
    </>
  )
}
