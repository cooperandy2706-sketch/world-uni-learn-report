// src/pages/teacher/TeacherSelfServicePage.tsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useCurrentTerm } from '../../hooks/useSettings'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { 
  User, 
  FileText, 
  Calendar, 
  Award, 
  Plus, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Download,
  Wallet,
  Briefcase
} from 'lucide-react'

type Tab = 'profile' | 'payroll' | 'leave' | 'docs'

export default function TeacherSelfServicePage() {
    const { user } = useAuth()
    const { data: term } = useCurrentTerm()
    const [activeTab, setActiveTab] = useState<Tab>('profile')
    const [loading, setLoading] = useState(true)
    const [teacher, setTeacher] = useState<any>(null)
    const [payroll, setPayroll] = useState<any[]>([])
    const [leaves, setLeaves] = useState<any[]>([])
    const [docs, setDocs] = useState<any[]>([])

    // Leave Form State
    const [showLeaveModal, setShowLeaveModal] = useState(false)
    const [leaveType, setLeaveType] = useState('personal')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [reason, setReason] = useState('')
    const [submittingLeave, setSubmittingLeave] = useState(false)

    useEffect(() => {
        if (user) loadData()
    }, [user])

    async function loadData() {
        setLoading(true)
        try {
            const [
                { data: tData },
                { data: pData },
                { data: lData },
                { data: dData }
            ] = await Promise.all([
                supabase.from('teachers').select('*, user:users(*)').eq('user_id', user!.id).single(),
                supabase.from('staff_payroll').select('*').eq('user_id', user!.id).order('month', { ascending: false }),
                supabase.from('leave_requests').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }),
                supabase.from('staff_documents').select('*').eq('user_id', user!.id).order('created_at', { ascending: false })
            ])

            setTeacher(tData)
            setPayroll(pData || [])
            setLeaves(lData || [])
            setDocs(dData || [])
        } catch (error) {
            console.error('Error loading self-service data:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleLeaveSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!startDate || !endDate) return toast.error('Please select dates')
        
        setSubmittingLeave(true)
        const { error } = await supabase.from('leave_requests').insert({
            user_id: user!.id,
            school_id: teacher.school_id,
            leave_type: leaveType,
            start_date: startDate,
            end_date: endDate,
            reason: reason
        })

        if (error) {
            toast.error(error.message)
        } else {
            toast.success('Leave request submitted!')
            setShowLeaveModal(false)
            loadData()
            setStartDate(''); setEndDate(''); setReason('')
        }
        setSubmittingLeave(false)
    }

    const stats = [
        { label: 'Employment', value: teacher?.staff_id || '—', icon: Briefcase, color: '#6366f1' },
        { label: 'Recent Pay', value: payroll[0] ? `GH₵ ${payroll[0].net_salary}` : '—', icon: Wallet, color: '#10b981' },
        { label: 'Leave Bal', value: '12 Days', icon: Calendar, color: '#f59e0b' },
        { label: 'Documents', value: docs.length, icon: Award, color: '#8b5cf6' },
    ]

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
            <div className="animate-spin" style={{ width: 40, height: 40, border: '4px solid #f3f3f3', borderTop: '4px solid #7c3aed', borderRadius: '50%' }} />
        </div>
    )

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', animation: 'fadeIn 0.5s ease' }}>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .tab-btn { transition: all 0.2s ease; border-bottom: 2px solid transparent; }
                .tab-btn.active { color: #7c3aed; border-bottom-color: #7c3aed; }
                .card { background: white; border-radius: 16px; border: 1.5px solid #f0eefe; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
                .status-badge { padding: 4px 10px; border-radius: 99px; font-size: 11px; fontWeight: 700; text-transform: uppercase; }
                .status-pending { background: #fef3c7; color: #d97706; }
                .status-approved { background: #dcfce7; color: #16a34a; }
                .status-rejected { background: #fee2e2; color: #dc2626; }
                @media (max-width: 768px) { .stats-grid { grid-template-columns: 1fr 1fr !important; } .header-row { flex-direction: column !important; align-items: flex-start !important; } }
            `}</style>

            {/* Header Area */}
            <div className="header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, gap: 16 }}>
                <div>
                    <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 32, fontWeight: 700, color: '#111827', margin: 0 }}>Self Service</h1>
                    <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>Manage your profile, payroll, and leave applications.</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={() => setShowLeaveModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '12px', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 10px rgba(124, 58, 237, 0.3)' }}>
                        <Plus size={18} /> Apply for Leave
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                {stats.map((s, i) => (
                    <div key={i} className="card" style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ background: `${s.color}15`, color: s.color, padding: '10px', borderRadius: '12px' }}>
                                <s.icon size={22} />
                            </div>
                            <div>
                                <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>{s.label}</div>
                                <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{s.value}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 32, borderBottom: '1px solid #e5e7eb', marginBottom: 24, overflowX: 'auto' }}>
                {[
                    { id: 'profile', label: 'My Portfolio', icon: User },
                    { id: 'payroll', label: 'Payslips', icon: Wallet },
                    { id: 'leave', label: 'Leave History', icon: Calendar },
                    { id: 'docs', label: 'Certificates', icon: Award },
                ].map(t => (
                    <button 
                        key={t.id} 
                        onClick={() => setActiveTab(t.id as Tab)}
                        className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 4px', background: 'none', border: 'none', fontSize: 15, fontWeight: activeTab === t.id ? 600 : 500, color: activeTab === t.id ? '#7c3aed' : '#6b7280', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                        <t.icon size={18} /> {t.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div style={{ minHeight: '400px' }}>
                {activeTab === 'profile' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                        <div className="card" style={{ padding: '24px' }}>
                            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: '#111827' }}>Professional Information</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div>
                                    <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>Full Name</label>
                                    <div style={{ fontSize: 15, fontWeight: 600 }}>{teacher?.user?.full_name}</div>
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>Staff ID</label>
                                    <div style={{ fontSize: 15, fontWeight: 600 }}>{teacher?.staff_id}</div>
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>Primary Qualification</label>
                                    <div style={{ fontSize: 15, fontWeight: 600 }}>{teacher?.qualification || 'Not set'}</div>
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>Bio / Philosophy</label>
                                    <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.6, margin: 0 }}>{teacher?.bio || 'No bio provided. Update your profile to add a professional summary.'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="card" style={{ padding: '24px' }}>
                            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: '#111827' }}>Contact & Emergency</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div>
                                    <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>Email Address</label>
                                    <div style={{ fontSize: 15, fontWeight: 600 }}>{teacher?.user?.email}</div>
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>Phone Number</label>
                                    <div style={{ fontSize: 15, fontWeight: 600 }}>{teacher?.phone_number || teacher?.user?.phone || '—'}</div>
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>Emergency Contact</label>
                                    <div style={{ fontSize: 15, fontWeight: 600 }}>{teacher?.emergency_contact || '—'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'payroll' && (
                    <div className="card" style={{ overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ background: '#f9fafb', borderBottom: '1.5px solid #f0eefe' }}>
                                <tr>
                                    <th style={{ padding: '16px', fontSize: 12, fontWeight: 700, color: '#6b7280' }}>MONTH</th>
                                    <th style={{ padding: '16px', fontSize: 12, fontWeight: 700, color: '#6b7280' }}>GROSS PAY</th>
                                    <th style={{ padding: '16px', fontSize: 12, fontWeight: 700, color: '#6b7280' }}>DEDUCTIONS</th>
                                    <th style={{ padding: '16px', fontSize: 12, fontWeight: 700, color: '#6b7280' }}>NET SALARY</th>
                                    <th style={{ padding: '16px', fontSize: 12, fontWeight: 700, color: '#6b7280' }}>STATUS</th>
                                    <th style={{ padding: '16px', fontSize: 12, fontWeight: 700, color: '#6b7280' }}>ACTION</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payroll.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>No payslips found yet.</td>
                                    </tr>
                                ) : payroll.map((p, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #f0eefe' }}>
                                        <td style={{ padding: '16px', fontWeight: 600 }}>{p.month}</td>
                                        <td style={{ padding: '16px' }}>GH₵ {(p.basic_salary + p.allowances).toFixed(2)}</td>
                                        <td style={{ padding: '16px', color: '#dc2626' }}>- GH₵ {p.deductions.toFixed(2)}</td>
                                        <td style={{ padding: '16px', fontWeight: 700, color: '#7c3aed' }}>GH₵ {p.net_salary.toFixed(2)}</td>
                                        <td style={{ padding: '16px' }}>
                                            <span className={`status-badge ${p.is_paid ? 'status-approved' : 'status-pending'}`}>
                                                {p.is_paid ? 'PAID' : 'PENDING'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <button style={{ background: 'none', border: 'none', color: '#7c3aed', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600 }}>
                                                <Download size={14} /> Payslip
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'leave' && (
                    <div className="card" style={{ overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ background: '#f9fafb', borderBottom: '1.5px solid #f0eefe' }}>
                                <tr>
                                    <th style={{ padding: '16px', fontSize: 12, fontWeight: 700, color: '#6b7280' }}>TYPE</th>
                                    <th style={{ padding: '16px', fontSize: 12, fontWeight: 700, color: '#6b7280' }}>START DATE</th>
                                    <th style={{ padding: '16px', fontSize: 12, fontWeight: 700, color: '#6b7280' }}>END DATE</th>
                                    <th style={{ padding: '16px', fontSize: 12, fontWeight: 700, color: '#6b7280' }}>REASON</th>
                                    <th style={{ padding: '16px', fontSize: 12, fontWeight: 700, color: '#6b7280' }}>STATUS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaves.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>You haven't submitted any leave requests yet.</td>
                                    </tr>
                                ) : leaves.map((l, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #f0eefe' }}>
                                        <td style={{ padding: '16px', fontWeight: 600, textTransform: 'capitalize' }}>{l.leave_type}</td>
                                        <td style={{ padding: '16px' }}>{format(new Date(l.start_date), 'MMM dd, yyyy')}</td>
                                        <td style={{ padding: '16px' }}>{format(new Date(l.end_date), 'MMM dd, yyyy')}</td>
                                        <td style={{ padding: '16px', fontSize: 13, color: '#6b7280' }}>{l.reason || '—'}</td>
                                        <td style={{ padding: '16px' }}>
                                            <span className={`status-badge status-${l.status}`}>
                                                {l.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'docs' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', borderStyle: 'dashed', background: '#f9fafb', cursor: 'pointer' }}>
                            <div style={{ background: '#7c3aed', color: 'white', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                                <Plus size={24} />
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#4b5563' }}>Upload Certificate</div>
                            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>PDF, JPG or PNG (Max 5MB)</div>
                        </div>
                        {docs.map((d, i) => (
                            <div key={i} className="card" style={{ padding: '16px' }}>
                                <div style={{ background: '#f5f3ff', color: '#7c3aed', padding: '12px', borderRadius: '12px', display: 'inline-block', marginBottom: 16 }}>
                                    <Award size={24} />
                                </div>
                                <h4 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 4px' }}>{d.title}</h4>
                                <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 16px' }}>{d.document_type} · Uploaded {format(new Date(d.created_at), 'MMM dd, yyyy')}</p>
                                <button style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1.5px solid #e5e7eb', background: 'white', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                                    View Document
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Leave Request Modal */}
            {showLeaveModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '24px', animation: 'fadeIn 0.3s ease' }}>
                        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Apply for Leave</h2>
                        <form onSubmit={handleLeaveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Leave Type</label>
                                <select 
                                    value={leaveType} 
                                    onChange={(e) => setLeaveType(e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e5e7eb', outline: 'none' }}
                                >
                                    <option value="personal">Personal Leave</option>
                                    <option value="sick">Sick Leave</option>
                                    <option value="vacation">Vacation</option>
                                    <option value="maternity">Maternity Leave</option>
                                    <option value="paternity">Paternity Leave</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Start Date</label>
                                    <input 
                                        type="date" 
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e5e7eb', outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>End Date</label>
                                    <input 
                                        type="date" 
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e5e7eb', outline: 'none' }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Reason / Details</label>
                                <textarea 
                                    rows={3}
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Brief explanation for your leave request..."
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e5e7eb', outline: 'none', resize: 'none' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                                <button type="button" onClick={() => setShowLeaveModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1.5px solid #e5e7eb', background: 'white', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" disabled={submittingLeave} style={{ flex: 2, padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                                    {submittingLeave ? 'Submitting...' : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
