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
        <div className="t-page">
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .tab-btn { transition: all 0.2s ease; border-bottom: 2px solid transparent; }
                .tab-btn.active { color: #7c3aed; border-bottom-color: #7c3aed; }
                .card { background: var(--bg-card); border-radius: 8px; border: 1.5px solid var(--border-color); box-shadow: 0 4px 12px rgba(0,0,0,0.02); }
                .status-badge { padding: 4px 10px; border-radius: 99px; font-size: 11px; fontWeight: 700; text-transform: uppercase; }
                .status-pending { background: #fef3c7; color: #d97706; }
                .status-approved { background: #dcfce7; color: #16a34a; }
                .status-rejected { background: #fee2e2; color: #dc2626; }

                /* ── RESPONSIVE GRID OVERRIDES ── */
                .stats-grid { 
                    display: grid !important; 
                    grid-template-columns: repeat(4, 1fr) !important; 
                    gap: 16px !important; 
                    margin-bottom: 24px !important; 
                }
                .profile-grid {
                    display: grid !important;
                    grid-template-columns: 1fr 1fr !important;
                    gap: 24px !important;
                }

                @media (max-width: 900px) {
                    .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
                }
                @media (max-width: 640px) {
                    .stats-grid { grid-template-columns: 1fr !important; }
                    .profile-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
                    .resp-grid-2 { grid-template-columns: 1fr !important; }
                }

                /* ── RESPONSIVE DYNAMIC TABLE TO CARD CONVERSION ── */
                @media (max-width: 768px) {
                    .responsive-table { border: none !important; }
                    .responsive-table thead { display: none !important; }
                    .responsive-table tr { 
                        display: block !important; 
                        background: var(--bg-card) !important; 
                        border: 1.5px solid var(--border-color) !important; 
                        border-radius: 8px !important; 
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
                        font-size: 13px !important; 
                        border-bottom: 1px solid var(--border-color) !important;
                        text-align: right !important;
                    }
                    .responsive-table td:last-child { border-bottom: none !important; }
                    .responsive-table td::before { 
                        content: attr(data-label) !important; 
                        font-weight: 700 !important; 
                        color: #6b7280 !important; 
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
                <div className="card" style={{ padding: '24px 20px', animation: 'fadeIn 0.3s ease', maxWidth: 600, margin: '0 auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: '1px solid var(--border-color)', paddingBottom: 16 }}>
                        <div>
                            <button onClick={() => setViewMode('dashboard')} style={{ background: 'none', border: 'none', color: '#7c3aed', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: 0, marginBottom: 4, display: 'block' }}>← Back to Dashboard</button>
                            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Apply for Leave</h2>
                            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Submit a digital leave application to administration</p>
                        </div>
                        <button onClick={() => setViewMode('dashboard')} style={{ background: 'var(--bg-input)', color: 'var(--text-main)', border: 'none', width: 32, height: 32, borderRadius: '50%', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                    </div>

                    <form onSubmit={handleLeaveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.05em' }}>Leave Type</label>
                            <select 
                                value={leaveType} 
                                onChange={(e) => setLeaveType(e.target.value)}
                                style={{ width: '100%', padding: '12px 14px', borderRadius: '9px', border: '1.5px solid var(--border-color)', outline: 'none', fontSize: 14, background: 'var(--bg-card)', color: 'var(--text-main)', boxSizing: 'border-box' }}
                            >
                                <option value="personal">Personal Leave</option>
                                <option value="sick">Sick Leave</option>
                                <option value="vacation">Vacation</option>
                                <option value="maternity">Maternity Leave</option>
                                <option value="paternity">Paternity Leave</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div className="resp-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.05em' }}>Start Date</label>
                                <input 
                                    type="date" 
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    style={{ width: '100%', padding: '12px 14px', borderRadius: '9px', border: '1.5px solid var(--border-color)', outline: 'none', fontSize: 14, background: 'var(--bg-card)', color: 'var(--text-main)', boxSizing: 'border-box', fontFamily: 'inherit' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.05em' }}>End Date</label>
                                <input 
                                    type="date" 
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    style={{ width: '100%', padding: '12px 14px', borderRadius: '9px', border: '1.5px solid var(--border-color)', outline: 'none', fontSize: 14, background: 'var(--bg-card)', color: 'var(--text-main)', boxSizing: 'border-box', fontFamily: 'inherit' }}
                                />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.05em' }}>Reason / Details</label>
                            <textarea 
                                rows={3}
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Describe the duration and context of your leave request securely..."
                                style={{ width: '100%', padding: '12px 14px', borderRadius: '9px', border: '1.5px solid var(--border-color)', outline: 'none', resize: 'none', fontSize: 14, background: 'var(--bg-card)', color: 'var(--text-main)', boxSizing: 'border-box', fontFamily: 'inherit' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                            <button type="button" onClick={() => setViewMode('dashboard')} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1.5px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
                            <button type="submit" disabled={submittingLeave} style={{ flex: 2, padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                                {submittingLeave ? 'Submitting...' : 'Submit Request 📤'}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                /* ── REGULAR SELF SERVICE DASHBOARD VIEW ── */
                <>
                    {/* Header Area */}
                    <div className="t-header" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                        <div>
                            <h1 className="t-title" style={{ margin: 0, fontSize: 26, fontWeight: 800, color: 'var(--text-main)' }}>Self Service Hub</h1>
                            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Manage your teacher portfolio, payslips, and leave requests in one secure location.</p>
                        </div>
                        <div className="t-btn-group">
                            <button onClick={() => setViewMode('apply-leave')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white', border: 'none', padding: '11px 20px', borderRadius: '12px', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 10px rgba(124, 58, 237, 0.25)' }}>
                                <Plus size={18} /> Apply for Leave
                            </button>
                        </div>
                    </div>

                    {/* Stats Overview */}
                    <div className="stats-grid">
                        {stats.map((s, i) => (
                            <div key={i} className="card" style={{ padding: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ background: `${s.color}15`, color: s.color, padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <s.icon size={22} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{s.label}</div>
                                        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-main)', marginTop: 2 }}>{s.value}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Tabs (Swipeable on touch screens) */}
                    <div style={{ display: 'flex', gap: 32, borderBottom: '1px solid var(--border-color)', marginBottom: 24, overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
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
                                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 4px', background: 'none', border: 'none', fontSize: 15, fontWeight: activeTab === t.id ? 700 : 500, color: activeTab === t.id ? '#7c3aed' : '#6b7280', cursor: 'pointer', whiteSpace: 'nowrap' }}
                            >
                                <t.icon size={18} /> {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div style={{ minHeight: '400px', animation: 'fadeIn 0.4s ease' }}>
                        {activeTab === 'profile' && (
                            <div className="profile-grid">
                                <div className="card" style={{ padding: '24px' }}>
                                    <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 20, color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: 10 }}>Professional Information</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                        <div>
                                            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: 4 }}>Full Name</label>
                                            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)' }}>{teacher?.user?.full_name}</div>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: 4 }}>Staff ID</label>
                                            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)' }}>{teacher?.staff_id}</div>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: 4 }}>Primary Qualification</label>
                                            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)' }}>{teacher?.qualification || 'Not set'}</div>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: 4 }}>Bio / Philosophy</label>
                                            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>{teacher?.bio || 'No bio provided. Update your profile to add a professional summary.'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="card" style={{ padding: '24px' }}>
                                    <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 20, color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: 10 }}>Contact & Emergency</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                        <div>
                                            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: 4 }}>Email Address</label>
                                            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)' }}>{teacher?.user?.email}</div>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: 4 }}>Phone Number</label>
                                            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)' }}>{teacher?.phone_number || teacher?.user?.phone || '—'}</div>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: 4 }}>Emergency Contact</label>
                                            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)' }}>{teacher?.emergency_contact || '—'}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'payroll' && (
                            <div className="card" style={{ overflow: 'hidden' }}>
                                <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead style={{ background: 'var(--bg-input)', borderBottom: '1.5px solid var(--border-color)' }}>
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
                                                <td colSpan={6} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-subtle)' }}>No payslips found yet.</td>
                                            </tr>
                                        ) : payroll.map((p, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                <td data-label="MONTH" style={{ padding: '16px', fontWeight: 700, color: 'var(--text-main)' }}>{p.month}</td>
                                                <td data-label="GROSS PAY" style={{ padding: '16px', color: 'var(--text-main)' }}>GH₵ {(p.basic_salary + p.allowances).toFixed(2)}</td>
                                                <td data-label="DEDUCTIONS" style={{ padding: '16px', color: '#dc2626', fontWeight: 600 }}>- GH₵ {p.deductions.toFixed(2)}</td>
                                                <td data-label="NET SALARY" style={{ padding: '16px', fontWeight: 800, color: '#7c3aed' }}>GH₵ {p.net_salary.toFixed(2)}</td>
                                                <td data-label="STATUS" style={{ padding: '16px' }}>
                                                    <span className={`status-badge ${p.is_paid ? 'status-approved' : 'status-pending'}`}>
                                                        {p.is_paid ? 'PAID' : 'PENDING'}
                                                    </span>
                                                </td>
                                                <td data-label="ACTION" style={{ padding: '16px' }}>
                                                    <button style={{ background: 'none', border: 'none', color: '#7c3aed', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 700 }}>
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
                                <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead style={{ background: 'var(--bg-input)', borderBottom: '1.5px solid var(--border-color)' }}>
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
                                                <td colSpan={5} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-subtle)' }}>You haven't submitted any leave requests yet.</td>
                                            </tr>
                                        ) : leaves.map((l, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                <td data-label="TYPE" style={{ padding: '16px', fontWeight: 700, color: 'var(--text-main)', textTransform: 'capitalize' }}>{l.leave_type}</td>
                                                <td data-label="START DATE" style={{ padding: '16px', color: 'var(--text-main)' }}>{format(new Date(l.start_date), 'MMM dd, yyyy')}</td>
                                                <td data-label="END DATE" style={{ padding: '16px', color: 'var(--text-main)' }}>{format(new Date(l.end_date), 'MMM dd, yyyy')}</td>
                                                <td data-label="REASON" style={{ padding: '16px', fontSize: 13, color: 'var(--text-muted)' }}>{l.reason || '—'}</td>
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
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                                <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', borderStyle: 'dashed', border: '2px dashed var(--border-color)', background: 'var(--bg-input)', cursor: 'pointer' }}>
                                    <div style={{ background: '#7c3aed', color: 'white', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                                        <Plus size={24} />
                                    </div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>Upload Certificate</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 4 }}>PDF, JPG or PNG (Max 5MB)</div>
                                </div>
                                {docs.map((d, i) => (
                                    <div key={i} className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 180 }}>
                                        <div>
                                            <div style={{ background: 'var(--bg-input)', color: '#7c3aed', padding: '12px', borderRadius: '12px', display: 'inline-block', marginBottom: 16 }}>
                                                <Award size={24} />
                                            </div>
                                            <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px' }}>{d.title}</h4>
                                            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 16px' }}>{d.document_type} · Uploaded {format(new Date(d.created_at), 'MMM dd, yyyy')}</p>
                                        </div>
                                        <button style={{ width: '100%', padding: '10px', borderRadius: '9px', border: '1.5px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}>
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
