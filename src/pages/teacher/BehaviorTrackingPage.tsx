import { useStuckLoadingReload } from '../../hooks/useStuckLoadingReload'
// src/pages/teacher/BehaviorTrackingPage.tsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useCurrentTerm } from '../../hooks/useSettings'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { 
  ShieldCheck, 
  ShieldAlert, 
  MessageSquare, 
  Plus, 
  Search, 
  Filter,
  User,
  History,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  MoreVertical,
  Lock,
  Globe
} from 'lucide-react'
import { useAutoRefresh } from "../../hooks/useAutoRefresh";

type LogType = 'merit' | 'demerit' | 'counseling'

export default function BehaviorTrackingPage() {
    useAutoRefresh(loadData);
    const { user } = useAuth()
    const { data: term } = useCurrentTerm()
    const [loading, setLoading] = useState(true)
    const [students, setStudents] = useState<any[]>([])
    const [logs, setLogs] = useState<any[]>([])
    const [search, setSearch] = useState('')
    const [activeTab, setActiveTab] = useState<'log' | 'history'>('log')

    // Form State
    const [selectedStudent, setSelectedStudent] = useState<any>(null)
    const [logType, setLogType] = useState<LogType>('merit')
    const [category, setCategory] = useState('')
    const [description, setDescription] = useState('')
    const [isPrivate, setIsPrivate] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (user) loadData()
    }, [user])

    async function loadData() {
        setLoading(true)
        try {
            // Get teacher's students (from their assigned classes)
            const { data: assignments } = await supabase
                .from('teacher_assignments')
                .select('class_id')
                .eq('teacher_id', (await supabase.from('teachers').select('id').eq('user_id', user!.id).maybeSingle()).data?.id)

            const classIds = assignments?.map(a => a.class_id) || []

            const [
                { data: sData },
                { data: lData }
            ] = await Promise.all([
                supabase.from('students').select('*, class:classes(name)').in('class_id', classIds).order('full_name'),
                supabase.from('behavior_logs').select('*, student:students(full_name)').eq('teacher_id', user!.id).order('created_at', { ascending: false }).limit(20)
            ])

            setStudents(sData || [])
            setLogs(lData || [])
        } catch (err) {
            console.error('Error loading behavior data:', err)
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!selectedStudent || !category || !description) return toast.error('Please fill all required fields')

        setSubmitting(true)
        const points = logType === 'merit' ? 5 : logType === 'demerit' ? -5 : 0

        const { error } = await supabase.from('behavior_logs').insert({
            school_id: selectedStudent.school_id,
            student_id: selectedStudent.id,
            teacher_id: user!.id,
            term_id: term?.id,
            type: logType,
            category,
            description,
            points,
            is_private: isPrivate
        })

        if (error) {
            toast.error(error.message)
        } else {
            toast.success(`${logType.charAt(0).toUpperCase() + logType.slice(1)} logged successfully!`)
            setSelectedStudent(null)
            setCategory('')
            setDescription('')
            loadData()
        }
        setSubmitting(false)
    }

    const filteredStudents = (Array.isArray(students) ? students : []).filter(s => 
        s.full_name.toLowerCase().includes(search.toLowerCase()) || 
        s.student_id?.toLowerCase().includes(search.toLowerCase())
    )

    const categories = {
        merit: ['Academic Excellence', 'Leadership', 'Helpfulness', 'Outstanding Effort', 'Punctuality', 'Creativity'],
        demerit: ['Disruption', 'Bullying', 'Incomplete Work', 'Dress Code', 'Tardiness', 'Insubordination'],
        counseling: ['Emotional Well-being', 'Family Issues', 'Academic Stress', 'Peer Conflict', 'Career Guidance']
    }

    const { showManualRetry, manualReload } = useStuckLoadingReload(loading)

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '60vh', gap: 16 }}>
            <div style={{ width: 40, height: 40, border: '4px solid #ede9fe', borderTop: '4px solid #7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ color: '#94a3b8', fontSize: 14, margin: 0 }}>
                {showManualRetry ? 'Still having trouble loading…' : 'Loading behavior data…'}
            </p>
            {showManualRetry && (
                <button
                    onClick={manualReload}
                    style={{ padding: '10px 24px', borderRadius: 12, background: '#7c3aed', color: '#fff', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
                >
                    🔄 Retry
                </button>
            )}
        </div>
    )

    return (
        <div className="tp-page">
            <link rel="stylesheet" href="/src/styles/teacher-portal.css" />

            {/* ── Header ───────────────────────────────────────────────────── */}
            <div className="tp-hero" style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <div className="tp-hero-label">Classroom Management</div>
                        <h1 className="tp-hero-title">🛡️ Behavior & Discipline</h1>
                        <p className="tp-hero-sub">Log student merits, demerits, and private counseling sessions.</p>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24, '@media (minWidth: 1024px)': { gridTemplateColumns: '380px 1fr' } } as any}>
                {/* Left Column: Student Selector */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div className="tp-card" style={{ padding: 20, position: 'sticky', top: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, background: 'var(--bg-hover)', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border-color)' }}>
                            <Search size={20} style={{ color: 'var(--text-muted)' }} />
                            <input 
                                type="text" 
                                placeholder="Search students..." 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{ background: 'none', border: 'none', outline: 'none', width: '100%', fontSize: 15, color: 'var(--text-primary)', fontFamily: "'DM Sans', sans-serif" }}
                            />
                        </div>

                        <div style={{ maxHeight: 500, overflowY: 'auto', paddingRight: 4, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {filteredStudents.map((s, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => setSelectedStudent(s)}
                                    style={{ 
                                        display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, border: 'none',
                                        background: selectedStudent?.id === s.id ? 'linear-gradient(135deg, var(--primary-color), var(--primary-color-dark))' : 'var(--bg-hover)',
                                        cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left', width: '100%'
                                    }}
                                >
                                    <div className="tp-avatar tp-avatar-md" style={{ background: selectedStudent?.id === s.id ? 'rgba(255,255,255,0.2)' : 'linear-gradient(135deg, #F59E0B, #FBBF24)', color: selectedStudent?.id === s.id ? '#fff' : '#fff' }}>
                                        {s.full_name.charAt(0)}
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: selectedStudent?.id === s.id ? '#fff' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.full_name}</div>
                                        <div style={{ fontSize: 12, color: selectedStudent?.id === s.id ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)' }}>{s.class?.name} · {s.student_id}</div>
                                    </div>
                                </button>
                            ))}
                            {filteredStudents.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-subtle)', fontSize: 14 }}>No students found</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Form or History */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Tabs */}
                    <div className="tp-tabs" style={{ marginBottom: 0 }}>
                        <button 
                            className={`tp-tab ${activeTab === 'log' ? 'active' : ''}`}
                            onClick={() => setActiveTab('log')}
                        >
                            Log Incident
                        </button>
                        <button 
                            className={`tp-tab ${activeTab === 'history' ? 'active' : ''}`}
                            onClick={() => setActiveTab('history')}
                        >
                            My Log History
                        </button>
                    </div>

                    {activeTab === 'log' ? (
                        selectedStudent ? (
                            <div className="tp-card" style={{ animation: 'tp-fade-in 0.3s ease' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border-color)' }}>
                                    <div className="tp-avatar tp-avatar-lg" style={{ background: 'linear-gradient(135deg, var(--primary-color), var(--primary-color-dark))', color: '#fff' }}>
                                        {selectedStudent.full_name.charAt(0)}
                                    </div>
                                    <div>
                                        <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{selectedStudent.full_name}</div>
                                        <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Logging behavior for {selectedStudent.class?.name}</div>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                    <div>
                                        <div className="tp-label">What are you logging?</div>
                                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                            {[
                                                { id: 'merit', label: 'Merit', icon: ShieldCheck, color: 'var(--success-color)', bg: '#ECFDF5' },
                                                { id: 'demerit', label: 'Demerit', icon: ShieldAlert, color: 'var(--danger-color)', bg: '#FEF2F2' },
                                                { id: 'counseling', label: 'Counseling', icon: MessageSquare, color: 'var(--info-color)', bg: '#EFF6FF' }
                                            ].map(type => (
                                                <button 
                                                    key={type.id}
                                                    type="button" 
                                                    onClick={() => setLogType(type.id as LogType)} 
                                                    style={{ 
                                                        flex: '1 1 120px', padding: '16px', borderRadius: 16, 
                                                        border: `2px solid ${logType === type.id ? type.color : 'var(--border-color)'}`,
                                                        background: logType === type.id ? type.bg : 'var(--bg-card)', 
                                                        color: logType === type.id ? type.color : 'var(--text-main)', 
                                                        cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12
                                                    }}
                                                >
                                                    <type.icon size={28} />
                                                    <span style={{ fontSize: 14, fontWeight: 800 }}>{type.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
                                        <div>
                                            <div className="tp-label">Category</div>
                                            <select 
                                                value={category}
                                                onChange={(e) => setCategory(e.target.value)}
                                                className="tp-select"
                                            >
                                                <option value="">Select Category</option>
                                                {categories[logType].map(c => <option key={c} value={c}>{c}</option>)}
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div>
                                            <div className="tp-label">Privacy</div>
                                            <button 
                                                type="button"
                                                onClick={() => setIsPrivate(!isPrivate)}
                                                style={{ 
                                                    width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border-color)', 
                                                    background: isPrivate ? '#FEF2F2' : '#F0FDF4', color: isPrivate ? 'var(--danger-color)' : 'var(--success-color)',
                                                    fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 46
                                                }}
                                            >
                                                {isPrivate ? <><Lock size={18} /> Private Note</> : <><Globe size={18} /> Shared with Admin</>}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="tp-label">Description / Observation</div>
                                        <textarea 
                                            rows={5}
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder={`Describe the ${logType} details...`}
                                            className="tp-input"
                                            style={{ resize: 'vertical' }}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
                                        <button type="button" className="tp-btn tp-btn-ghost" onClick={() => setSelectedStudent(null)} style={{ border: '1px solid var(--border-color)' }}>Cancel</button>
                                        <button type="submit" className="tp-btn tp-btn-primary" disabled={submitting}>
                                            {submitting ? 'Saving...' : `Record ${logType.charAt(0).toUpperCase() + logType.slice(1)}`}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            <div className="tp-card" style={{ padding: '80px 40px', textAlign: 'center', background: 'var(--bg-hover)', borderStyle: 'dashed', borderWidth: 2 }}>
                                <div className="tp-empty">
                                    <div className="tp-empty-icon" style={{ background: 'var(--bg-card)', color: 'var(--primary-color)', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', margin: '0 auto 24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                        <User size={40} />
                                    </div>
                                    <div className="tp-empty-title">Select a Student</div>
                                    <div className="tp-empty-sub">Choose a student from the list on the left to start logging behavior or counseling notes.</div>
                                </div>
                            </div>
                        )
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'tp-fade-in 0.3s ease' }}>
                            {logs.length === 0 ? (
                                <div className="tp-card">
                                    <div className="tp-empty">
                                        <div className="tp-empty-sub">No logs recorded yet.</div>
                                    </div>
                                </div>
                            ) : logs.map((l, i) => (
                                <div key={i} className="tp-card" style={{ padding: 20, display: 'flex', gap: 16 }}>
                                    <div style={{ 
                                        width: 48, height: 48, borderRadius: 16, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: l.type === 'merit' ? '#ECFDF5' : l.type === 'demerit' ? '#FEF2F2' : '#EFF6FF',
                                        color: l.type === 'merit' ? 'var(--success-color)' : l.type === 'demerit' ? 'var(--danger-color)' : 'var(--info-color)'
                                    }}>
                                        {l.type === 'merit' ? <ShieldCheck size={24} /> : l.type === 'demerit' ? <ShieldAlert size={24} /> : <MessageSquare size={24} />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                                            <div>
                                                <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{l.student?.full_name}</div>
                                                <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{l.category}</span> 
                                                    <span>·</span>
                                                    <span>{format(new Date(l.created_at), 'MMM dd, h:mm a')}</span>
                                                    {l.is_private && <span title="Private Note" style={{ background: '#FEF2F2', color: 'var(--danger-color)', padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}><Lock size={12} /> Private</span>}
                                                </div>
                                            </div>
                                            <div style={{ fontSize: 16, fontWeight: 800, color: l.type === 'merit' ? 'var(--success-color)' : l.type === 'demerit' ? 'var(--danger-color)' : 'var(--info-color)', background: l.type === 'merit' ? '#ECFDF5' : l.type === 'demerit' ? '#FEF2F2' : '#EFF6FF', padding: '6px 12px', borderRadius: 99 }}>
                                                {l.points > 0 ? `+${l.points} pts` : l.points < 0 ? `${l.points} pts` : 'Note'}
                                            </div>
                                        </div>
                                        <p style={{ fontSize: 14, color: 'var(--text-primary)', marginTop: 12, lineHeight: 1.6 }}>{l.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
