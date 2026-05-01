// src/pages/admin/StaffRequestsPage.tsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  FileText, 
  ChevronRight,
  Filter,
  Search,
  MessageSquare,
  Award
} from 'lucide-react'

export default function StaffRequestsPage() {
    const { user: adminUser } = useAuth()
    const [loading, setLoading] = useState(true)
    const [leaves, setLeaves] = useState<any[]>([])
    const [docs, setDocs] = useState<any[]>([])
    const [activeTab, setActiveTab] = useState<'leave' | 'docs'>('leave')
    const [filterStatus, setFilterStatus] = useState('all')

    // Approval Modal State
    const [selectedLeave, setSelectedLeave] = useState<any>(null)
    const [adminNotes, setAdminNotes] = useState('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        try {
            const [
                { data: lData },
                { data: dData }
            ] = await Promise.all([
                supabase.from('leave_requests').select('*, user:users(full_name, role)').order('created_at', { ascending: false }),
                supabase.from('staff_documents').select('*, user:users(full_name)').order('created_at', { ascending: false })
            ])

            setLeaves(lData || [])
            setDocs(dData || [])
        } catch (err) {
            console.error('Error loading requests:', err)
        } finally {
            setLoading(false)
        }
    }

    async function handleStatusUpdate(status: 'approved' | 'rejected') {
        if (!selectedLeave) return
        setSubmitting(true)
        
        const { error } = await supabase.from('leave_requests').update({
            status,
            admin_notes: adminNotes,
            approved_by: adminUser!.id,
            updated_at: new Date().toISOString()
        }).eq('id', selectedLeave.id)

        if (error) {
            toast.error(error.message)
        } else {
            toast.success(`Request ${status} successfully`)
            setSelectedLeave(null)
            setAdminNotes('')
            loadData()
        }
        setSubmitting(false)
    }

    const filteredLeaves = filterStatus === 'all' 
        ? leaves 
        : leaves.filter(l => l.status === filterStatus)

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
            <div className="animate-spin" style={{ width: 40, height: 40, border: '4px solid #f3f3f3', borderTop: '4px solid #7c3aed', borderRadius: '50%' }} />
        </div>
    )

    return (
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', animation: 'fadeIn 0.5s ease' }}>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .card { background: white; border-radius: 16px; border: 1.5px solid #f0eefe; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
                .tab-btn { padding: 12px 24px; border-bottom: 2px solid transparent; color: #6b7280; font-weight: 500; cursor: pointer; background: none; border: none; transition: all 0.2s; }
                .tab-btn.active { color: #7c3aed; border-bottom-color: #7c3aed; font-weight: 700; }
                .status-badge { padding: 4px 10px; border-radius: 99px; font-size: 11px; fontWeight: 700; text-transform: uppercase; }
                .status-pending { background: #fef3c7; color: #d97706; }
                .status-approved { background: #dcfce7; color: #16a34a; }
                .status-rejected { background: #fee2e2; color: #dc2626; }
                @media (max-width: 768px) { .header-row { flex-direction: column; align-items: flex-start !important; } }
            `}</style>

            <div className="header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 32, fontWeight: 700, color: '#111827', margin: 0 }}>Staff Requests</h1>
                    <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>Review and manage leave applications and documents from your team.</p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 32, borderBottom: '1px solid #e5e7eb', marginBottom: 24 }}>
                <button className={`tab-btn ${activeTab === 'leave' ? 'active' : ''}`} onClick={() => setActiveTab('leave')}>Leave Applications</button>
                <button className={`tab-btn ${activeTab === 'docs' ? 'active' : ''}`} onClick={() => setActiveTab('docs')}>Professional Documents</button>
            </div>

            {activeTab === 'leave' && (
                <>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                        {['all', 'pending', 'approved', 'rejected'].map(s => (
                            <button 
                                key={s}
                                onClick={() => setFilterStatus(s)}
                                style={{ 
                                    padding: '6px 16px', borderRadius: 99, fontSize: 12, fontWeight: 600, border: '1.5px solid #e5e7eb',
                                    background: filterStatus === s ? '#7c3aed' : 'white',
                                    color: filterStatus === s ? 'white' : '#6b7280',
                                    cursor: 'pointer', textTransform: 'capitalize'
                                }}
                            >
                                {s}
                            </button>
                        ))}
                    </div>

                    <div className="card" style={{ overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ background: '#f9fafb', borderBottom: '1.5px solid #f0eefe' }}>
                                <tr>
                                    <th style={{ padding: '16px', fontSize: 12, fontWeight: 700, color: '#6b7280' }}>STAFF MEMBER</th>
                                    <th style={{ padding: '16px', fontSize: 12, fontWeight: 700, color: '#6b7280' }}>LEAVE TYPE</th>
                                    <th style={{ padding: '16px', fontSize: 12, fontWeight: 700, color: '#6b7280' }}>PERIOD</th>
                                    <th style={{ padding: '16px', fontSize: 12, fontWeight: 700, color: '#6b7280' }}>STATUS</th>
                                    <th style={{ padding: '16px', fontSize: 12, fontWeight: 700, color: '#6b7280' }}>ACTION</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLeaves.length === 0 ? (
                                    <tr><td colSpan={5} style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>No leave requests found.</td></tr>
                                ) : filteredLeaves.map((l, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #f0eefe' }}>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                                                    {l.user?.full_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: 14, fontWeight: 600 }}>{l.user?.full_name}</div>
                                                    <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'capitalize' }}>{l.user?.role}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px', fontSize: 14, textTransform: 'capitalize' }}>{l.leave_type}</td>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ fontSize: 13, fontWeight: 500 }}>{format(new Date(l.start_date), 'MMM dd')} - {format(new Date(l.end_date), 'MMM dd')}</div>
                                            <div style={{ fontSize: 11, color: '#9ca3af' }}>{format(new Date(l.created_at), 'yyyy')}</div>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <span className={`status-badge status-${l.status}`}>{l.status}</span>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <button 
                                                onClick={() => setSelectedLeave(l)}
                                                style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                                            >
                                                Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {activeTab === 'docs' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                    {docs.length === 0 ? (
                        <div style={{ gridColumn: '1/-1', padding: '60px', textAlign: 'center', color: '#9ca3af' }}>No documents uploaded by staff yet.</div>
                    ) : docs.map((d, i) => (
                        <div key={i} className="card" style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                <div style={{ background: '#f5f3ff', color: '#7c3aed', padding: '10px', borderRadius: '12px' }}>
                                    <Award size={20} />
                                </div>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 700 }}>{d.title}</div>
                                    <div style={{ fontSize: 11, color: '#6b7280' }}>by {d.user?.full_name}</div>
                                </div>
                            </div>
                            <div style={{ fontSize: 12, color: '#4b5563', marginBottom: 16 }}>
                                Type: <strong>{d.document_type}</strong><br/>
                                Uploaded: {format(new Date(d.created_at), 'MMM dd, yyyy')}
                            </div>
                            <a href={d.file_url} target="_blank" rel="noreferrer" style={{ display: 'block', textAlign: 'center', padding: '8px', borderRadius: 8, background: '#7c3aed', color: 'white', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
                                View Document
                            </a>
                        </div>
                    ))}
                </div>
            )}

            {/* Leave Approval Modal */}
            {selectedLeave && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '24px', animation: 'fadeIn 0.3s ease' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                            <div>
                                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Leave Application</h2>
                                <p style={{ fontSize: 13, color: '#6b7280' }}>from {selectedLeave.user?.full_name}</p>
                            </div>
                            <button onClick={() => setSelectedLeave(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>✕</button>
                        </div>

                        <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '12px', marginBottom: 20 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 12 }}>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>Type</label>
                                    <div style={{ fontSize: 14, fontWeight: 600, textTransform: 'capitalize' }}>{selectedLeave.leave_type}</div>
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>Duration</label>
                                    <div style={{ fontSize: 14, fontWeight: 600 }}>{format(new Date(selectedLeave.start_date), 'MMM dd')} - {format(new Date(selectedLeave.end_date), 'MMM dd')}</div>
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>Reason</label>
                                <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.5 }}>{selectedLeave.reason || 'No reason provided.'}</div>
                            </div>
                        </div>

                        {selectedLeave.status === 'pending' ? (
                            <>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Admin Response (Optional)</label>
                                <textarea 
                                    rows={3}
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    placeholder="Add notes for the teacher..."
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #e5e7eb', outline: 'none', resize: 'none', marginBottom: 20 }}
                                />
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <button 
                                        disabled={submitting}
                                        onClick={() => handleStatusUpdate('rejected')}
                                        style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1.5px solid #ef4444', background: '#fff', color: '#ef4444', fontWeight: 600, cursor: 'pointer' }}
                                    >
                                        Reject
                                    </button>
                                    <button 
                                        disabled={submitting}
                                        onClick={() => handleStatusUpdate('approved')}
                                        style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #16a34a, #15803d)', color: 'white', fontWeight: 700, cursor: 'pointer' }}
                                    >
                                        {submitting ? 'Processing...' : 'Approve'}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div style={{ padding: '16px', borderRadius: '12px', background: selectedLeave.status === 'approved' ? '#dcfce7' : '#fee2e2', color: selectedLeave.status === 'approved' ? '#16a34a' : '#dc2626' }}>
                                <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    {selectedLeave.status === 'approved' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                                    This request was {selectedLeave.status}.
                                </div>
                                {selectedLeave.admin_notes && (
                                    <div style={{ marginTop: 8, fontSize: 13 }}>Notes: {selectedLeave.admin_notes}</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
