import { useStuckLoadingReload } from '../../hooks/useStuckLoadingReload'
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
import { useAutoRefresh } from "../../hooks/useAutoRefresh";

type Tab = 'profile' | 'payroll' | 'leave' | 'docs'

export default function TeacherSelfServicePage() {
    useAutoRefresh(loadData);
    const { user } = useAuth()
    const { data: term } = useCurrentTerm()
    const [activeTab, setActiveTab] = useState<Tab>('profile')
    const [loading, setLoading] = useState(true)
  useStuckLoadingReload(loading)
    const [teacher, setTeacher] = useState<any>(null)
    const [payroll, setPayroll] = useState<any[]>([])
    const [leaves, setLeaves] = useState<any[]>([])
    const [docs, setDocs] = useState<any[]>([])

    // Inline View Mode State
    const [viewMode, setViewMode] = useState<'dashboard' | 'apply-leave'>('dashboard')

    // Leave Form State
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
                supabase.from('teachers').select('*, user:users(*)').eq('user_id', user!.id).maybeSingle(),
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
            setViewMode('dashboard')
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
        <div className="t-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
            <div className="animate-spin" style={{ width: 40, height: 40, border: '4px solid #f3f3f3', borderTop: '4px solid #7c3aed', borderRadius: '50%' }} />
        </div>
    )

    return (
        <div className="tp-page">
            <link rel="stylesheet" href="/src/styles/teacher-portal.css" />
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .tab-btn { transition: all 0.2s ease; border-bottom: 2px solid transparent; }
                .tab-btn.active { color: var(--primary-color); border-bottom-color: var(--primary-color); }
                .status-badge { padding: 4px 10px; border-radius: 99px; font-size: 11px; fontWeight: 700; text-transform: uppercase; }
                .status-pending { background: rgba(217,119,6,0.1); color: #d97706; }
                .status-approved { background: rgba(22,163,74,0.1); color: #16a34a; }
                .status-rejected { background: rgba(220,38,38,0.1); color: #dc2626; }

                /* ── RESPONSIVE DYNAMIC TABLE TO CARD CONVERSION ── */
                @media (max-width: 768px) {
                    .responsive-table { border: none !important; }
                    .responsive-table thead { display: none !important; }
                    .responsive-table tr { 
                        display: block !important; 
                        background: var(--bg-card) !important; 
                        border: 1.5px solid var(--border-color) !important; 
                        border-radius: 12px !important; 
                        padding: 16px !important; 
                        margin-bottom: 14px !important; 
                        box-shadow: 0 2px 4px rgba(0,0,0,0.01) !important;
                    }
                    .responsive-table td { 
                        display: flex !important; 
                        justify-content: space-between !important; 
                        align-items: center !important;
                        border: none !important; 
                        padding: 8px 0 !important; 
                        font-size: 14px !important; 
                        border-bottom: 1px solid var(--border-color) !important;
                        text-align: right !important;
                    }
                    .responsive-table td:last-child { border-bottom: none !important; }
                    .responsive-table td::before { 
                        content: attr(data-label) !important; 
                        font-weight: 700 !important; 
                        color: var(--text-muted) !important; 
                        text-transform: uppercase !important;
                        font-size: 11px !important;
                        letter-spacing: 0.05em !important;
                        float: left !important;
                        margin-right: 12px !important;
                        text-align: left !important;
                    }
                }
            `}</style>

            {viewMode === 'apply-leave' ? (
                /* ── INLINE LEAVE REQUEST CARD FORM ── */
                <div className="tp-card" style={{ padding: '24px 20px', animation: 'fadeIn 0.3s ease', maxWidth: 600, margin: '0 auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: '1px solid var(--border-color)', paddingBottom: 16 }}>
                        <div>
                            <button onClick={() => setViewMode('dashboard')} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: 0, marginBottom: 4, display: 'block' }}>← Back to Dashboard</button>
                            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Apply for Leave</h2>
                            <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>Submit a digital leave application to administration</p>
                        </div>
                        <button onClick={() => setViewMode('dashboard')} style={{ background: 'var(--bg-input)', color: 'var(--text-main)', border: 'none', width: 32, height: 32, borderRadius: '50%', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                    </div>

                    <form onSubmit={handleLeaveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                            <label className="tp-label">Leave Type</label>
                            <select 
                                value={leaveType} 
                                onChange={(e) => setLeaveType(e.target.value)}
                                className="tp-select"
                            >
                                <option value="personal">Personal Leave</option>
                                <option value="sick">Sick Leave</option>
                                <option value="vacation">Vacation</option>
                                <option value="maternity">Maternity Leave</option>
                                <option value="paternity">Paternity Leave</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div className="tp-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                            <div>
                                <label className="tp-label">Start Date</label>
                                <input 
                                    type="date" 
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="tp-input"
                                />
                            </div>
                            <div>
                                <label className="tp-label">End Date</label>
                                <input 
                                    type="date" 
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="tp-input"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="tp-label">Reason / Details</label>
                            <textarea 
                                rows={3}
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Describe the duration and context of your leave request securely..."
                                className="tp-input"
                                style={{ resize: 'vertical' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
                            <button type="button" onClick={() => setViewMode('dashboard')} className="tp-btn tp-btn-ghost" style={{ flex: '1 1 120px', justifyContent: 'center' }}>Cancel</button>
                            <button type="submit" disabled={submittingLeave} className="tp-btn tp-btn-primary" style={{ flex: '2 1 200px', justifyContent: 'center' }}>
                                {submittingLeave ? 'Submitting...' : 'Submit Request 📤'}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                /* ── REGULAR SELF SERVICE DASHBOARD VIEW ── */
                <>
                    {/* Header Area */}
                    <div className="tp-hero" style={{ marginBottom: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                            <div>
                                <h1 className="tp-hero-title">Self Service Hub</h1>
                                <p className="tp-hero-sub">Manage your teacher portfolio, payslips, and leave requests.</p>
                            </div>
                            <div>
                                <button onClick={() => setViewMode('apply-leave')} className="tp-btn tp-btn-primary">
                                    <Plus size={18} /> Apply for Leave
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Stats Overview */}
                    <div className="tp-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 24 }}>
                        {stats.map((s, i) => (
                            <div key={i} className="tp-card" style={{ padding: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ background: `${s.color}15`, color: s.color, padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <s.icon size={24} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
                                        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>{s.value}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Tabs (Swipeable on touch screens) */}
                    <div className="tp-tab-bar" style={{ marginBottom: 24 }}>
                        {[
                            { id: 'profile', label: 'My Portfolio', icon: User },
                            { id: 'payroll', label: 'Payslips', icon: Wallet },
                            { id: 'leave', label: 'Leave History', icon: Calendar },
                            { id: 'docs', label: 'Certificates', icon: Award },
                        ].map(t => (
                            <button 
                                key={t.id} 
                                onClick={() => setActiveTab(t.id as Tab)}
                                className={`tp-tab ${activeTab === t.id ? 'active' : ''}`}
                                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                            >
                                <t.icon size={16} /> {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div style={{ minHeight: '400px', animation: 'fadeIn 0.4s ease' }}>
                        {activeTab === 'profile' && (
                            <div className="tp-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                                <div className="tp-card" style={{ padding: '24px' }}>
                                    <h3 className="tp-section-title">Professional Information</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                        <div>
                                            <label className="tp-label">Full Name</label>
                                            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{teacher?.user?.full_name}</div>
                                        </div>
                                        <div>
                                            <label className="tp-label">Staff ID</label>
                                            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{teacher?.staff_id}</div>
                                        </div>
                                        <div>
                                            <label className="tp-label">Primary Qualification</label>
                                            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{teacher?.qualification || 'Not set'}</div>
                                        </div>
                                        <div>
                                            <label className="tp-label">Bio / Philosophy</label>
                                            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>{teacher?.bio || 'No bio provided. Update your profile to add a professional summary.'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="tp-card" style={{ padding: '24px' }}>
                                    <h3 className="tp-section-title">Contact & Emergency</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                        <div>
                                            <label className="tp-label">Email Address</label>
                                            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{teacher?.user?.email}</div>
                                        </div>
                                        <div>
                                            <label className="tp-label">Phone Number</label>
                                            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{teacher?.phone_number || teacher?.user?.phone || '—'}</div>
                                        </div>
                                        <div>
                                            <label className="tp-label">Emergency Contact</label>
                                            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{teacher?.emergency_contact || '—'}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'payroll' && (
                            <div className="tp-card" style={{ overflow: 'hidden', padding: 0 }}>
                                <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead style={{ background: 'var(--bg-hover)', borderBottom: '1.5px solid var(--border-color)' }}>
                                        <tr>
                                            <th style={{ padding: '16px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>MONTH</th>
                                            <th style={{ padding: '16px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>GROSS PAY</th>
                                            <th style={{ padding: '16px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>DEDUCTIONS</th>
                                            <th style={{ padding: '16px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>NET SALARY</th>
                                            <th style={{ padding: '16px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>STATUS</th>
                                            <th style={{ padding: '16px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>ACTION</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payroll.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>No payslips found yet.</td>
                                            </tr>
                                        ) : payroll.map((p, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                <td data-label="MONTH" style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{p.month}</td>
                                                <td data-label="GROSS PAY" style={{ padding: '16px', color: 'var(--text-primary)' }}>GH₵ {(p.basic_salary + p.allowances).toFixed(2)}</td>
                                                <td data-label="DEDUCTIONS" style={{ padding: '16px', color: 'var(--danger-color)', fontWeight: 600 }}>- GH₵ {p.deductions.toFixed(2)}</td>
                                                <td data-label="NET SALARY" style={{ padding: '16px', fontWeight: 800, color: 'var(--primary-color)' }}>GH₵ {p.net_salary.toFixed(2)}</td>
                                                <td data-label="STATUS" style={{ padding: '16px' }}>
                                                    <span className={`status-badge ${p.is_paid ? 'status-approved' : 'status-pending'}`}>
                                                        {p.is_paid ? 'PAID' : 'PENDING'}
                                                    </span>
                                                </td>
                                                <td data-label="ACTION" style={{ padding: '16px' }}>
                                                    <button style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700 }}>
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
                            <div className="tp-card" style={{ overflow: 'hidden', padding: 0 }}>
                                <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead style={{ background: 'var(--bg-hover)', borderBottom: '1.5px solid var(--border-color)' }}>
                                        <tr>
                                            <th style={{ padding: '16px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>TYPE</th>
                                            <th style={{ padding: '16px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>START DATE</th>
                                            <th style={{ padding: '16px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>END DATE</th>
                                            <th style={{ padding: '16px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>REASON</th>
                                            <th style={{ padding: '16px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>STATUS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leaves.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>You haven't submitted any leave requests yet.</td>
                                            </tr>
                                        ) : leaves.map((l, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                <td data-label="TYPE" style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{l.leave_type}</td>
                                                <td data-label="START DATE" style={{ padding: '16px', color: 'var(--text-primary)' }}>{format(new Date(l.start_date), 'MMM dd, yyyy')}</td>
                                                <td data-label="END DATE" style={{ padding: '16px', color: 'var(--text-primary)' }}>{format(new Date(l.end_date), 'MMM dd, yyyy')}</td>
                                                <td data-label="REASON" style={{ padding: '16px', fontSize: 14, color: 'var(--text-muted)' }}>{l.reason || '—'}</td>
                                                <td data-label="STATUS" style={{ padding: '16px' }}>
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
                            <div className="tp-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                                <div className="tp-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', borderStyle: 'dashed', border: '2px dashed var(--border-color)', background: 'var(--bg-hover)', cursor: 'pointer' }}>
                                    <div style={{ background: 'var(--primary-color)', color: 'white', width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                                        <Plus size={24} />
                                    </div>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Upload Certificate</div>
                                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>PDF, JPG or PNG (Max 5MB)</div>
                                </div>
                                {docs.map((d, i) => (
                                    <div key={i} className="tp-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 200 }}>
                                        <div>
                                            <div style={{ background: 'rgba(124,58,237,0.1)', color: 'var(--primary-color)', padding: '12px', borderRadius: '12px', display: 'inline-block', marginBottom: 16 }}>
                                                <Award size={24} />
                                            </div>
                                            <h4 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>{d.title}</h4>
                                            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 20px' }}>{d.document_type} · Uploaded {format(new Date(d.created_at), 'MMM dd, yyyy')}</p>
                                        </div>
                                        <button className="tp-btn tp-btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
                                            View Document
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
