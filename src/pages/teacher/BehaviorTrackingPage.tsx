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

type LogType = 'merit' | 'demerit' | 'counseling'

export default function BehaviorTrackingPage() {
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
                .eq('teacher_id', (await supabase.from('teachers').select('id').eq('user_id', user!.id).single()).data?.id)

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

    const filteredStudents = students.filter(s => 
        s.full_name.toLowerCase().includes(search.toLowerCase()) || 
        s.student_id?.toLowerCase().includes(search.toLowerCase())
    )

    const categories = {
        merit: ['Academic Excellence', 'Leadership', 'Helpfulness', 'Outstanding Effort', 'Punctuality', 'Creativity'],
        demerit: ['Disruption', 'Bullying', 'Incomplete Work', 'Dress Code', 'Tardiness', 'Insubordination'],
        counseling: ['Emotional Well-being', 'Family Issues', 'Academic Stress', 'Peer Conflict', 'Career Guidance']
    }

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
            <div className="animate-spin" style={{ width: 40, height: 40, border: '4px solid #f3f3f3', borderTop: '4px solid #7c3aed', borderRadius: '50%' }} />
        </div>
    )

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', animation: 'fadeIn 0.5s ease' }}>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .card { background: white; border-radius: 16px; border: 1.5px solid #f0eefe; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
                .type-btn { flex: 1; padding: 12px; border-radius: 12px; border: 2px solid #f0eefe; background: white; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; align-items: center; gap: 8px; }
                .type-btn.active.merit { border-color: #10b981; background: #ecfdf5; color: #065f46; }
                .type-btn.active.demerit { border-color: #ef4444; background: #fef2f2; color: #991b1b; }
                .type-btn.active.counseling { border-color: #6366f1; background: #eef2ff; color: #3730a3; }
                .student-row:hover { background: #f5f3ff; cursor: pointer; }
                @media (max-width: 768px) { .main-grid { grid-template-columns: 1fr !important; } }
            `}</style>

            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 32, fontWeight: 700, color: '#111827', margin: 0 }}>Behavior & Discipline</h1>
                <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>Log student merits, demerits, and private counseling sessions.</p>
            </div>

            <div className="main-grid" style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24 }}>
                {/* Left Column: Student Selector */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div className="card" style={{ padding: '20px', position: 'sticky', top: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, background: '#f9fafb', padding: '10px 14px', borderRadius: '10px' }}>
                            <Search size={18} color="#9ca3af" />
                            <input 
                                type="text" 
                                placeholder="Search students..." 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{ background: 'none', border: 'none', outline: 'none', width: '100%', fontSize: 14 }}
                            />
                        </div>

                        <div style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: 4 }}>
                            {filteredStudents.map((s, i) => (
                                <div 
                                    key={i} 
                                    onClick={() => setSelectedStudent(s)}
                                    className="student-row"
                                    style={{ 
                                        display: 'flex', alignItems: 'center', gap: 12, padding: '12px', borderRadius: '12px', marginBottom: 4,
                                        background: selectedStudent?.id === s.id ? '#f5f3ff' : 'transparent',
                                        border: selectedStudent?.id === s.id ? '1.5px solid #c4b5fd' : '1.5px solid transparent'
                                    }}
                                >
                                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#ede9fe', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
                                        {s.full_name.charAt(0)}
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.full_name}</div>
                                        <div style={{ fontSize: 11, color: '#6b7280' }}>{s.class?.name} · {s.student_id}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Form or History */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid #e5e7eb' }}>
                        <button onClick={() => setActiveTab('log')} style={{ padding: '12px 4px', background: 'none', border: 'none', fontSize: 15, fontWeight: activeTab === 'log' ? 700 : 500, color: activeTab === 'log' ? '#7c3aed' : '#6b7280', borderBottom: activeTab === 'log' ? '2px solid #7c3aed' : '2px solid transparent', cursor: 'pointer' }}>
                            Log Incident
                        </button>
                        <button onClick={() => setActiveTab('history')} style={{ padding: '12px 4px', background: 'none', border: 'none', fontSize: 15, fontWeight: activeTab === 'history' ? 700 : 500, color: activeTab === 'history' ? '#7c3aed' : '#6b7280', borderBottom: activeTab === 'history' ? '2px solid #7c3aed' : '2px solid transparent', cursor: 'pointer' }}>
                            My Log History
                        </button>
                    </div>

                    {activeTab === 'log' ? (
                        selectedStudent ? (
                            <div className="card" style={{ padding: '32px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
                                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#7c3aed', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700 }}>
                                        {selectedStudent.full_name.charAt(0)}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 20, fontWeight: 700 }}>{selectedStudent.full_name}</div>
                                        <div style={{ fontSize: 14, color: '#6b7280' }}>Logging behavior for {selectedStudent.class?.name}</div>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>What are you logging?</label>
                                        <div style={{ display: 'flex', gap: 12 }}>
                                            <button type="button" onClick={() => setLogType('merit')} className={`type-btn ${logType === 'merit' ? 'active merit' : ''}`}>
                                                <ShieldCheck size={24} />
                                                <span style={{ fontSize: 13, fontWeight: 700 }}>Merit</span>
                                            </button>
                                            <button type="button" onClick={() => setLogType('demerit')} className={`type-btn ${logType === 'demerit' ? 'active demerit' : ''}`}>
                                                <ShieldAlert size={24} />
                                                <span style={{ fontSize: 13, fontWeight: 700 }}>Demerit</span>
                                            </button>
                                            <button type="button" onClick={() => setLogType('counseling')} className={`type-btn ${logType === 'counseling' ? 'active counseling' : ''}`}>
                                                <MessageSquare size={24} />
                                                <span style={{ fontSize: 13, fontWeight: 700 }}>Counseling</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Category</label>
                                            <select 
                                                value={category}
                                                onChange={(e) => setCategory(e.target.value)}
                                                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #e5e7eb', outline: 'none' }}
                                            >
                                                <option value="">Select Category</option>
                                                {categories[logType].map(c => <option key={c} value={c}>{c}</option>)}
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Privacy</label>
                                            <button 
                                                type="button"
                                                onClick={() => setIsPrivate(!isPrivate)}
                                                style={{ 
                                                    width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #e5e7eb', 
                                                    background: isPrivate ? '#fef2f2' : '#f0fdf4', color: isPrivate ? '#dc2626' : '#16a34a',
                                                    fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                                                }}
                                            >
                                                {isPrivate ? <><Lock size={16} /> Private Note</> : <><Globe size={16} /> Shared with Admin</>}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Description / Observation</label>
                                        <textarea 
                                            rows={4}
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder={`Describe the ${logType} details...`}
                                            style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid #e5e7eb', outline: 'none', resize: 'none' }}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
                                        <button type="button" onClick={() => setSelectedStudent(null)} style={{ padding: '12px 24px', borderRadius: '12px', border: '1.5px solid #e5e7eb', background: 'white', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                                        <button type="submit" disabled={submitting} style={{ padding: '12px 32px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(109,40,217,0.3)' }}>
                                            {submitting ? 'Saving...' : `Record ${logType.charAt(0).toUpperCase() + logType.slice(1)}`}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            <div className="card" style={{ padding: '80px 40px', textAlign: 'center', borderStyle: 'dashed', background: '#f9fafb' }}>
                                <div style={{ background: '#ede9fe', color: '#7c3aed', width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                    <User size={32} />
                                </div>
                                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>Select a Student</h3>
                                <p style={{ color: '#6b7280', fontSize: 14, maxWidth: '300px', margin: '0 auto' }}>Choose a student from the list on the left to start logging behavior or counseling notes.</p>
                            </div>
                        )
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {logs.length === 0 ? (
                                <div className="card" style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>No logs recorded yet.</div>
                            ) : logs.map((l, i) => (
                                <div key={i} className="card" style={{ padding: '20px', display: 'flex', gap: 16 }}>
                                    <div style={{ 
                                        width: 40, height: 40, borderRadius: '12px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: l.type === 'merit' ? '#ecfdf5' : l.type === 'demerit' ? '#fef2f2' : '#eef2ff',
                                        color: l.type === 'merit' ? '#10b981' : l.type === 'demerit' ? '#ef4444' : '#6366f1'
                                    }}>
                                        {l.type === 'merit' ? <ShieldCheck size={24} /> : l.type === 'demerit' ? <ShieldAlert size={24} /> : <MessageSquare size={24} />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <div style={{ fontSize: 15, fontWeight: 700 }}>{l.student?.full_name}</div>
                                                <div style={{ fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    {l.category} · {format(new Date(l.created_at), 'MMM dd, h:mm a')}
                                                    {l.is_private && <span title="Private Note"><Lock size={10} /></span>}
                                                </div>
                                            </div>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: l.type === 'merit' ? '#10b981' : l.type === 'demerit' ? '#ef4444' : '#6366f1' }}>
                                                {l.points > 0 ? `+${l.points}` : l.points < 0 ? l.points : 'Note'}
                                            </div>
                                        </div>
                                        <p style={{ fontSize: 13, color: '#4b5563', marginTop: 8, lineHeight: 1.5 }}>{l.description}</p>
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
