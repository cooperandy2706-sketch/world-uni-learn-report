import { useState, useEffect } from 'react'
import { Calendar, Search, X, CheckCircle, XCircle, Clock, User } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { LeaveService } from '../../services/leave.service'
import { supabase } from '../../lib/supabase'
import FlaskLoader from '../../components/ui/FlaskLoader'

export default function AdminStaffLeavePage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [searchQuery, setSearchQuery] = useState('')

  // Action state
  const [actionReq, setActionReq] = useState<any>(null)
  const [substituteId, setSubstituteId] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (user?.school_id) {
      loadData()
    }
  }, [user?.school_id])

  async function loadData() {
    setLoading(true)
    try {
      const [reqs, { data: staff }] = await Promise.all([
        LeaveService.getAllRequests(user!.school_id),
        supabase.from('users').select('id, full_name, role, avatar_url').eq('school_id', user!.school_id).eq('role', 'teacher')
      ])
      setRequests(reqs || [])
      setTeachers(staff || [])
    } catch (err: any) {
      console.error('[StaffLeaveLoad]', err)
      toast.error(err?.message || 'Failed to load leave requests')
    } finally {
      setLoading(false)
    }
  }

  async function handleAction(status: 'approved' | 'rejected') {
    if (!actionReq) return
    setProcessing(true)
    try {
      await LeaveService.updateRequestStatus(
        actionReq.id,
        status,
        user!.id,
        substituteId || null,
        adminNotes
      )
      setActionReq(null)
      setSubstituteId('')
      setAdminNotes('')
      loadData()
    } catch (err: any) {
      console.error('[StaffLeaveAction]', err)
      toast.error(err?.message || 'Failed to update leave request')
    } finally {
      setProcessing(false)
    }
  }

  const filtered = requests.filter(r => {
    if (filter !== 'all' && r.status !== filter) return false
    if (searchQuery && !r.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'approved': 
        return { icon: <CheckCircle size={14} />, color: '#16a34a', bg: '#f0fdf4', label: 'Approved' }
      case 'rejected': 
        return { icon: <XCircle size={14} />, color: '#dc2626', bg: '#fef2f2', label: 'Rejected' }
      default: 
        return { icon: <Clock size={14} />, color: '#d97706', bg: '#fffbeb', label: 'Pending' }
    }
  }

  if (loading) {
    return <FlaskLoader label="Loading staff leave requests..." fullScreen={false} />
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        .req-card { transition: all 0.2s ease; }
        .req-card:hover { transform: translateY(-2px); box-shadow: 0 12px 24px rgba(109,40,217,0.08) !important; }
        .filter-btn { padding: 10px 20px; border-radius: 12px; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s; text-transform: capitalize; border: 1px solid transparent; }
        .filter-btn.active { background: #111827; color: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .filter-btn.inactive { background: #fff; color: #6b7280; border-color: #e5e7eb; }
        .filter-btn.inactive:hover { background: #f3f4f6; color: #374151; }
        .input-field { width: 100%; padding: 12px 16px; border-radius: 12px; border: 1.5px solid #e5e7eb; font-size: 14px; outline: none; font-family: "DM Sans", sans-serif; transition: all 0.2s ease; background: #fff; box-sizing: border-box; }
        .input-field:focus { border-color: #7c3aed; box-shadow: 0 0 0 4px rgba(124,58,237,0.1); }
        .action-btn { padding: 10px 20px; border-radius: 12px; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s; border: none; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(17,24,39,0.6); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.2s ease; }
      `}</style>
      
      <div style={{ fontFamily: '"DM Sans", system-ui, sans-serif', animation: 'fadeIn 0.4s ease', paddingBottom: 40 }}>
        
        {/* Filters & Search */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', marginBottom: 24, animation: 'fadeUp 0.4s ease 0.1s both' }}>
          <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: 400 }}>
            <Search size={18} color="#9ca3af" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search by staff name..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input-field" 
              style={{ paddingLeft: 44, borderRadius: 99 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {['pending', 'approved', 'rejected', 'all'].map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`filter-btn ${filter === f ? 'active' : 'inactive'}`}>
                {f} {f === 'pending' && requests.filter(r => r.status === 'pending').length > 0 && `(${requests.filter(r => r.status === 'pending').length})`}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div style={{ background: 'var(--bg-card)', border: '1.5px dashed var(--border-color)', borderRadius: 24, padding: '60px 20px', textAlign: 'center', animation: 'fadeUp 0.4s ease 0.2s both' }}>
            <div style={{ width: 64, height: 64, background: '#f8fafc', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Calendar size={32} color="#94a3b8" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)', margin: '0 0 8px' }}>No requests found</h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>There are no leave requests matching your current filters.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {filtered.map((req, i) => {
              const statusInfo = getStatusDisplay(req.status)
              
              return (
                <div key={req.id} className="req-card" style={{ background: 'var(--bg-card)', borderRadius: 20, border: '1px solid #f0eefe', padding: 24, display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'space-between', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', animation: `fadeUp 0.4s ease ${0.15 + i * 0.05}s both` }}>
                  
                  <div style={{ display: 'flex', gap: 20, flex: 1, minWidth: 300 }}>
                    <div style={{ flexShrink: 0 }}>
                      {req.user?.avatar_url ? (
                        <img src={req.user.avatar_url} alt="" style={{ width: 56, height: 56, borderRadius: 16, objectFit: 'cover', background: 'var(--bg-hover)' }} />
                      ) : (
                        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#4f46e5' }}>
                          {req.user?.full_name?.charAt(0) || 'S'}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)', margin: '0 0 6px' }}>{req.user?.full_name}</h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#7c3aed', textTransform: 'capitalize', background: '#f5f3ff', padding: '4px 10px', borderRadius: 8 }}>
                          {req.leave_type} Leave
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 8, background: statusInfo.bg, color: statusInfo.color, fontSize: 12, fontWeight: 700 }}>
                          {statusInfo.icon} {statusInfo.label}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                          <Calendar size={14} />
                          {new Date(req.start_date).toLocaleDateString('en-GB', { dateStyle: 'medium' })} → {new Date(req.end_date).toLocaleDateString('en-GB', { dateStyle: 'medium' })}
                        </div>
                      </div>
                      
                      {req.reason && (
                        <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-light)', borderRadius: 12, padding: '12px 16px' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-subtle)', display: 'block', marginBottom: 4 }}>Reason</span>
                          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>{req.reason}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 220, borderLeft: '1px solid var(--border-light)', paddingLeft: 24 }}>
                    {req.status === 'pending' ? (
                      <button
                        onClick={() => { setActionReq(req); setSubstituteId(''); setAdminNotes('') }}
                        style={{ width: '100%', background: '#111827', color: '#fff', padding: '12px 20px', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', border: 'none', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        Review & Assign
                      </button>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {req.substitute && (
                          <div style={{ background: '#f8fafc', padding: 12, borderRadius: 12, border: '1px solid #f1f5f9' }}>
                            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: 4 }}>Substitute Assigned</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>
                                {req.substitute.full_name?.charAt(0)}
                              </div>
                              <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>{req.substitute.full_name}</span>
                            </div>
                          </div>
                        )}
                        {req.admin_notes && (
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: 4 }}>Admin Notes</div>
                            <div style={{ fontSize: 13, color: '#475569', fontStyle: 'italic' }}>"{req.admin_notes}"</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                </div>
              )
            })}
          </div>
        )}

        {/* Review Modal */}
        {actionReq && (
          <div className="modal-overlay">
            <div style={{ background: 'var(--bg-card)', borderRadius: 24, width: '100%', maxWidth: 540, boxShadow: '0 24px 48px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
              
              <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc' }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-main)', margin: 0, fontFamily: '"Playfair Display", serif' }}>Review Leave Request</h2>
                <button onClick={() => setActionReq(null)} style={{ background: '#e2e8f0', border: 'none', width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>
                  <X size={18} />
                </button>
              </div>
              
              <div style={{ padding: '32px' }}>
                <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 16, padding: 16, marginBottom: 24 }}>
                  <p style={{ fontSize: 14, color: '#1e3a8a', margin: 0, lineHeight: 1.6 }}>
                    You are reviewing a <strong>{actionReq.leave_type}</strong> leave request from <strong style={{ color: '#1e40af' }}>{actionReq.user?.full_name}</strong> for dates <strong>{new Date(actionReq.start_date).toLocaleDateString('en-GB', { dateStyle: 'medium' })} to {new Date(actionReq.end_date).toLocaleDateString('en-GB', { dateStyle: 'medium' })}</strong>.
                  </p>
                </div>

                <div style={{ display: 'grid', gap: 24 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 8 }}>
                      Assign Substitute Teacher (Optional)
                    </label>
                    <select className="input-field" value={substituteId} onChange={e => setSubstituteId(e.target.value)}>
                      <option value="">No substitute assigned</option>
                      {teachers.filter(t => t.id !== actionReq.user_id).map(t => (
                        <option key={t.id} value={t.id}>{t.full_name}</option>
                      ))}
                    </select>
                    <p style={{ fontSize: 12, color: 'var(--text-subtle)', margin: '6px 0 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Clock size={12} /> The substitute will temporarily gain access to the absent teacher's timetable and lesson plans.
                    </p>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 8 }}>
                      Admin Notes / Remarks (Optional)
                    </label>
                    <textarea 
                      rows={3} 
                      className="input-field" 
                      value={adminNotes} 
                      onChange={e => setAdminNotes(e.target.value)} 
                      placeholder="Enter any notes visible to the teacher..." 
                      style={{ resize: 'vertical' }} 
                    />
                  </div>
                </div>
              </div>

              <div style={{ padding: '20px 32px', background: '#f8fafc', borderTop: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  onClick={() => handleAction('rejected')}
                  disabled={processing}
                  className="action-btn"
                  style={{ background: 'var(--bg-card)', color: '#dc2626', border: '1.5px solid #fecaca', opacity: processing ? 0.5 : 1 }}
                >
                  Reject Request
                </button>
                <button
                  onClick={() => handleAction('approved')}
                  disabled={processing}
                  className="action-btn"
                  style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)', color: '#fff', opacity: processing ? 0.5 : 1, boxShadow: '0 4px 12px rgba(22,163,74,0.2)' }}
                >
                  Approve & Assign
                </button>
              </div>
              
            </div>
          </div>
        )}

      </div>
    </>
  )
}
