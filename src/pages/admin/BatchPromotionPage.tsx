// src/pages/admin/BatchPromotionPage.tsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'
import { 
  Users, 
  ArrowRightCircle, 
  CheckCircle2, 
  ChevronRight, 
  AlertTriangle, 
  ShieldAlert,
  ArrowRight,
  Filter,
  Check,
  X
} from 'lucide-react'

export default function BatchPromotionPage() {
    const { user } = useAuth()
    const [classes, setClasses] = useState<any[]>([])
    const [fromClass, setFromClass] = useState('')
    const [toClass, setToClass] = useState('')
    const [students, setStudents] = useState<any[]>([])
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(false)
    const [promoting, setPromoting] = useState(false)

    useEffect(() => {
        if (user) loadClasses()
    }, [user])

    async function loadClasses() {
        const { data } = await supabase.from('classes').select('*').order('name')
        setClasses(data || [])
    }

    async function loadStudents() {
        if (!fromClass) return
        setLoading(true)
        const { data } = await supabase.from('students').select('*').eq('class_id', fromClass).order('full_name')
        setStudents(data || [])
        setSelectedIds(new Set(data?.map(s => s.id) || []))
        setLoading(false)
    }

    useEffect(() => {
        loadStudents()
    }, [fromClass])

    const toggleStudent = (id: string) => {
        const next = new Set(selectedIds)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        setSelectedIds(next)
    }

    const selectAll = () => setSelectedIds(new Set(students.map(s => s.id)))
    const deselectAll = () => setSelectedIds(new Set())

    async function handlePromotion() {
        if (!toClass) return toast.error('Please select the destination class')
        if (fromClass === toClass) return toast.error('Source and destination classes cannot be the same')
        if (selectedIds.size === 0) return toast.error('No students selected for promotion')

        if (!confirm(`Are you sure you want to promote ${selectedIds.size} students to ${classes.find(c => c.id === toClass)?.name}?`)) return

        setPromoting(true)
        const { error } = await supabase
            .from('students')
            .update({ class_id: toClass })
            .in('id', Array.from(selectedIds))

        if (error) {
            toast.error(error.message)
        } else {
            toast.success('Students promoted successfully!')
            loadStudents()
            setSelectedIds(new Set())
        }
        setPromoting(false)
    }

    return (
        <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', animation: 'fadeIn 0.5s ease' }}>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .card { background: white; border-radius: 16px; border: 1.5px solid #f0eefe; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
                .student-row:hover { background: #f9fafb; }
            `}</style>

            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 32, fontWeight: 700, color: '#111827', margin: 0 }}>Batch Promotion</h1>
                <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>Move entire classes or groups of students to the next grade level.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
                <div className="card" style={{ padding: '24px' }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#6b7280', marginBottom: 12, textTransform: 'uppercase' }}>Promote FROM</label>
                    <select 
                        value={fromClass} 
                        onChange={(e) => setFromClass(e.target.value)}
                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #e5e7eb', fontSize: 15, fontWeight: 600, outline: 'none' }}
                    >
                        <option value="">Select Current Class</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div className="card" style={{ padding: '24px' }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#6b7280', marginBottom: 12, textTransform: 'uppercase' }}>Promote TO</label>
                    <select 
                        value={toClass} 
                        onChange={(e) => setToClass(e.target.value)}
                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #e5e7eb', fontSize: 15, fontWeight: 600, outline: 'none' }}
                    >
                        <option value="">Select Destination Class</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        <option value="graduated">-- Graduated / Completed --</option>
                    </select>
                </div>
            </div>

            {fromClass && (
                <div className="card" style={{ overflow: 'hidden', animation: 'fadeIn 0.3s ease' }}>
                    <div style={{ padding: '20px 24px', background: '#f9fafb', borderBottom: '1px solid #f0eefe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{students.length} Students Found</span>
                            <span style={{ fontSize: 13, color: '#6b7280', marginLeft: 12 }}>{selectedIds.size} selected for promotion</span>
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={selectAll} style={{ background: 'none', border: 'none', color: '#7c3aed', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Select All</button>
                            <button onClick={deselectAll} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Deselect All</button>
                        </div>
                    </div>

                    <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                        {loading ? (
                            <div style={{ padding: '60px', textAlign: 'center' }}>Loading students...</div>
                        ) : students.length === 0 ? (
                            <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>No students in this class.</div>
                        ) : students.map((s, i) => (
                            <div 
                                key={i} 
                                onClick={() => toggleStudent(s.id)}
                                className="student-row"
                                style={{ padding: '14px 24px', borderBottom: i === students.length - 1 ? 'none' : '1px solid #f0eefe', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}
                            >
                                <div style={{ 
                                    width: 22, height: 22, borderRadius: '6px', border: '2px solid #e5e7eb', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: selectedIds.has(s.id) ? '#7c3aed' : 'white',
                                    borderColor: selectedIds.has(s.id) ? '#7c3aed' : '#e5e7eb'
                                }}>
                                    {selectedIds.has(s.id) && <Check size={14} color="white" strokeWidth={4} />}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                                        {s.full_name.charAt(0)}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 600 }}>{s.full_name}</div>
                                        <div style={{ fontSize: 11, color: '#6b7280' }}>ID: {s.student_id}</div>
                                    </div>
                                </div>
                                {selectedIds.has(s.id) ? (
                                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, color: '#16a34a', fontSize: 12, fontWeight: 700 }}>
                                        <ArrowRight size={14} /> Promote
                                    </div>
                                ) : (
                                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, color: '#ef4444', fontSize: 12, fontWeight: 700 }}>
                                        <X size={14} /> Repeating
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div style={{ padding: '24px', background: '#f5f3ff', borderTop: '1.5px solid #ddd6fe', display: 'flex', justifyContent: 'flex-end' }}>
                        <button 
                            disabled={promoting || selectedIds.size === 0 || !toClass}
                            onClick={handlePromotion}
                            style={{ 
                                display: 'flex', alignItems: 'center', gap: 10, background: (promoting || selectedIds.size === 0 || !toClass) ? '#9ca3af' : 'linear-gradient(135deg, #7c3aed, #6d28d9)', 
                                color: 'white', border: 'none', padding: '14px 40px', borderRadius: '12px', fontSize: 15, fontWeight: 700, 
                                cursor: (promoting || selectedIds.size === 0 || !toClass) ? 'not-allowed' : 'pointer',
                                boxShadow: (promoting || selectedIds.size === 0 || !toClass) ? 'none' : '0 4px 12px rgba(124, 58, 237, 0.3)'
                            }}
                        >
                            {promoting ? 'Promoting...' : <>Confirm Batch Promotion <ArrowRightCircle size={20} /></>}
                        </button>
                    </div>
                </div>
            )}

            {!fromClass && (
                <div className="card" style={{ padding: '80px 40px', textAlign: 'center', borderStyle: 'dashed', background: '#f9fafb' }}>
                    <ShieldAlert size={48} color="#e5e7eb" style={{ marginBottom: 16 }} />
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>Start a Batch Promotion</h3>
                    <p style={{ color: '#6b7280', fontSize: 14, maxWidth: '400px', margin: '0 auto' }}>Select the current class of the students you want to promote above.</p>
                </div>
            )}
        </div>
    )
}
