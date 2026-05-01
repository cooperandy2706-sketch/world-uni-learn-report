// src/pages/admin/AdminTasksPage.tsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  User, 
  Calendar, 
  MoreVertical,
  Trash2,
  CheckCircle,
  Circle,
  Filter
} from 'lucide-react'

export default function AdminTasksPage() {
    const { user } = useAuth()
    const [tasks, setTasks] = useState<any[]>([])
    const [staff, setStaff] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [filter, setFilter] = useState('all')

    // Form State
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [priority, setPriority] = useState('medium')
    const [assignedTo, setAssignedTo] = useState('')
    const [dueDate, setDueDate] = useState('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (user) loadData()
    }, [user])

    async function loadData() {
        setLoading(true)
        try {
            const [
                { data: tData },
                { data: sData }
            ] = await Promise.all([
                supabase.from('admin_tasks').select('*, assignee:users(full_name)').order('created_at', { ascending: false }),
                supabase.from('users').select('id, full_name').eq('school_id', user!.school_id).in('role', ['admin', 'bursar'])
            ])

            setTasks(tData || [])
            setStaff(sData || [])
        } catch (err) {
            console.error('Error loading tasks:', err)
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!title) return toast.error('Title is required')

        setSubmitting(true)
        const { error } = await supabase.from('admin_tasks').insert({
            school_id: user!.school_id,
            title,
            description,
            priority,
            assigned_to: assignedTo || null,
            due_date: dueDate || null,
            created_by: user!.id
        })

        if (error) {
            toast.error(error.message)
        } else {
            toast.success('Task created!')
            setShowModal(false)
            resetForm()
            loadData()
        }
        setSubmitting(false)
    }

    async function toggleStatus(task: any) {
        const newStatus = task.status === 'completed' ? 'pending' : 'completed'
        const { error } = await supabase.from('admin_tasks').update({ status: newStatus }).eq('id', task.id)
        if (error) toast.error(error.message)
        else loadData()
    }

    async function deleteTask(id: string) {
        if (!confirm('Are you sure you want to delete this task?')) return
        const { error } = await supabase.from('admin_tasks').delete().eq('id', id)
        if (error) toast.error(error.message)
        else {
            toast.success('Task deleted')
            loadData()
        }
    }

    function resetForm() {
        setTitle(''); setDescription(''); setPriority('medium'); setAssignedTo(''); setDueDate('')
    }

    const filteredTasks = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
            <div className="animate-spin" style={{ width: 40, height: 40, border: '4px solid #f3f3f3', borderTop: '4px solid #7c3aed', borderRadius: '50%' }} />
        </div>
    )

    return (
        <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', animation: 'fadeIn 0.5s ease' }}>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .card { background: white; border-radius: 16px; border: 1.5px solid #f0eefe; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
                .task-row:hover { background: #f9fafb; }
                .priority-high { color: #ef4444; background: #fef2f2; }
                .priority-medium { color: #f59e0b; background: #fffbeb; }
                .priority-low { color: #10b981; background: #ecfdf5; }
            `}</style>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 32, fontWeight: 700, color: '#111827', margin: 0 }}>Task Manager</h1>
                    <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>Internal collaborative to-do list for the administration team.</p>
                </div>
                <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)' }}>
                    <Plus size={20} /> Create Task
                </button>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                {['all', 'pending', 'completed'].map(s => (
                    <button 
                        key={s} 
                        onClick={() => setFilter(s)}
                        style={{ padding: '8px 16px', borderRadius: 99, border: '1.5px solid #e5e7eb', background: filter === s ? '#7c3aed' : 'white', color: filter === s ? 'white' : '#6b7280', fontSize: 13, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' }}
                    >
                        {s}
                    </button>
                ))}
            </div>

            <div className="card" style={{ overflow: 'hidden' }}>
                {filteredTasks.length === 0 ? (
                    <div style={{ padding: '80px 40px', textAlign: 'center' }}>
                        <CheckCircle2 size={48} color="#e5e7eb" style={{ marginBottom: 16 }} />
                        <p style={{ color: '#9ca3af', fontWeight: 500 }}>No tasks found. Relax or create a new one!</p>
                    </div>
                ) : filteredTasks.map((t, i) => (
                    <div key={i} className="task-row" style={{ padding: '20px 24px', borderBottom: i === filteredTasks.length - 1 ? 'none' : '1px solid #f0eefe', display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                        <button 
                            onClick={() => toggleStatus(t)}
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', marginTop: 4, color: t.status === 'completed' ? '#10b981' : '#d1d5db' }}
                        >
                            {t.status === 'completed' ? <CheckCircle size={24} /> : <Circle size={24} />}
                        </button>
                        
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: t.status === 'completed' ? '#9ca3af' : '#111827', textDecoration: t.status === 'completed' ? 'line-through' : 'none' }}>{t.title}</h3>
                                <span className={`priority-${t.priority}`} style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 99, textTransform: 'uppercase' }}>{t.priority}</span>
                            </div>
                            <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 12px', lineHeight: 1.5 }}>{t.description}</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#9ca3af' }}>
                                    <User size={14} />
                                    <span>{t.assignee?.full_name || 'Unassigned'}</span>
                                </div>
                                {t.due_date && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: new Date(t.due_date) < new Date() && t.status !== 'completed' ? '#ef4444' : '#9ca3af' }}>
                                        <Calendar size={14} />
                                        <span>Due {format(new Date(t.due_date), 'MMM dd, yyyy')}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button onClick={() => deleteTask(t.id)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: 8 }}>
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Create Task Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '32px', animation: 'fadeIn 0.3s ease' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                            <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Create Admin Task</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 24 }}>✕</button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Task Title</label>
                                <input 
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g., Fix broken desk in Class 4"
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #e5e7eb', outline: 'none' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Description</label>
                                <textarea 
                                    rows={3}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Add more details about the task..."
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #e5e7eb', outline: 'none', resize: 'none' }}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Priority</label>
                                    <select value={priority} onChange={(e) => setPriority(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #e5e7eb', outline: 'none' }}>
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Assign To</label>
                                    <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #e5e7eb', outline: 'none' }}>
                                        <option value="">Select Staff</option>
                                        {staff.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Due Date</label>
                                <input 
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #e5e7eb', outline: 'none' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1.5px solid #e5e7eb', background: 'white', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" disabled={submitting} style={{ flex: 2, padding: '12px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                                    {submitting ? 'Creating...' : 'Create Task'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
