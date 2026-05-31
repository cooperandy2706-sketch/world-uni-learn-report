import { useStuckLoadingReload } from '../../hooks/useStuckLoadingReload'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { 
  FileText, Plus, Download, Trash2, Shield, FileCheck, BookOpen, User, Lock, Clock, XCircle, CheckCircle2, X
} from 'lucide-react'

export default function TeacherVaultPage() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
  useStuckLoadingReload(loading)
    const [documents, setDocuments] = useState<any[]>([])
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [teacher, setTeacher] = useState<any>(null)

    // Upload Form State
    const [title, setTitle] = useState('')
    const [docType, setDocType] = useState('lesson_plan')
    const [fileUrl, setFileUrl] = useState('')
    const [fileSizeMB, setFileSizeMB] = useState('1.5')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (user) {
            loadData()
        }
    }, [user])

    async function loadData() {
        if (!user) return
        setLoading(true)
        try {
            const { data: tData } = await supabase.from('teachers').select('*, user:users(*)').eq('user_id', user.id).maybeSingle()
            setTeacher(tData)

            const { data: dData, error } = await supabase
                .from('staff_documents')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            setDocuments(dData || [])
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    async function handleUpload(e: React.FormEvent) {
        e.preventDefault()
        if (!title || !fileUrl) return toast.error('Please provide a title and file URL')
        if (!teacher?.school_id) return toast.error('School context missing')

        setSubmitting(true)
        const { error } = await supabase.from('staff_documents').insert({
            school_id: teacher.school_id,
            user_id: user!.id,
            title,
            document_type: docType,
            file_url: fileUrl,
            file_size_bytes: Math.round(parseFloat(fileSizeMB) * 1024 * 1024),
            uploaded_by: user!.id,
            status: 'pending',
            is_admin_uploaded: false
        })

        if (error) {
            toast.error(error.message)
        } else {
            toast.success('Document uploaded to your vault')
            setShowUploadModal(false)
            setTitle('')
            setFileUrl('')
            loadData()
        }
        setSubmitting(false)
    }

    async function deleteDoc(id: string) {
        if (!confirm('Are you sure you want to delete this document?')) return
        const { error } = await supabase.from('staff_documents').delete().eq('id', id).eq('user_id', user!.id)
        if (error) toast.error(error.message)
        else {
            toast.success('Document deleted')
            loadData()
        }
    }

    const getDocIcon = (type: string) => {
        switch(type) {
            case 'lesson_plan': return <BookOpen size={20} />
            case 'lesson_note': return <FileText size={20} />
            case 'appointment_letter': return <FileCheck size={20} />
            case 'certificate': return <Shield size={20} />
            default: return <FileText size={20} />
        }
    }

    const getStatusBadge = (status: string) => {
        switch(status) {
            case 'approved':
                return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#dcfce7', color: '#16a34a', padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}><CheckCircle2 size={12}/> Approved</span>
            case 'rejected':
                return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fee2e2', color: '#dc2626', padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}><XCircle size={12}/> Rejected</span>
            default:
                return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fef3c7', color: '#d97706', padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}><Clock size={12}/> Pending</span>
        }
    }

    if (loading) return (
        <div className="t-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
            <div className="animate-spin" style={{ width: 40, height: 40, border: '4px solid #f3f3f3', borderTop: '4px solid #7c3aed', borderRadius: '50%' }} />
        </div>
    )

    return (
        <div className="t-page">
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .card { background: var(--bg-card); border-radius: 8px; border: 1.5px solid var(--border-color); box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
                .doc-card:hover { border-color: #c4b5fd; transform: translateY(-2px); transition: all 0.2s; box-shadow: 0 10px 20px rgba(124, 58, 237, 0.08); }
                .upload-btn { background: linear-gradient(135deg, #7c3aed, #6d28d9); color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s; display: flex; alignItems: center; gap: 8px; font-size: 14px; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.25); }
                .upload-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(124, 58, 237, 0.3); }
            `}</style>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>My Vault</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4, margin: 0 }}>Manage your lesson plans, notes, and official documents.</p>
                </div>
                <button onClick={() => setShowUploadModal(true)} className="upload-btn">
                    <Plus size={18} /> Upload Document
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                {documents.length === 0 ? (
                    <div className="card" style={{ gridColumn: '1/-1', padding: '80px 20px', textAlign: 'center', borderStyle: 'dashed', background: 'var(--bg-input)' }}>
                        <div style={{ background: '#ede9fe', color: '#7c3aed', width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <FileText size={32} />
                        </div>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)', margin: '0 0 8px' }}>Your Vault is Empty</h3>
                        <p style={{ color: 'var(--text-subtle)', fontWeight: 600, fontSize: 14, maxWidth: 300, margin: '0 auto' }}>Upload your lesson plans, notes, and certificates to get started.</p>
                    </div>
                ) : documents.map((d, i) => (
                    <div key={i} className="card doc-card" style={{ padding: '20px', position: 'relative' }}>
                        {d.is_admin_uploaded && (
                            <div style={{ position: 'absolute', top: 16, right: 16, background: 'var(--bg-input)', color: 'var(--text-muted)', padding: '4px 8px', borderRadius: 8, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Lock size={10} /> Locked by Admin
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                            <div style={{ background: 'var(--bg-input)', color: '#7c3aed', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {getDocIcon(d.document_type)}
                            </div>
                            <div style={{ alignSelf: 'center' }}>
                                {(d.document_type === 'lesson_plan' || d.document_type === 'lesson_note') && (
                                    <div style={{ marginBottom: 4 }}>
                                        {getStatusBadge(d.status)}
                                    </div>
                                )}
                            </div>
                        </div>

                        <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 4px', color: 'var(--text-main)' }}>{d.title}</h3>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 20px', textTransform: 'capitalize' }}>
                            {d.document_type.replace('_', ' ')} · {format(new Date(d.created_at), 'MMM dd, yyyy')}
                        </p>

                        <div style={{ display: 'flex', gap: 8 }}>
                            <a href={d.file_url} target="_blank" rel="noreferrer" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: 10, background: 'var(--bg-input)', color: '#7c3aed', textDecoration: 'none', fontSize: 13, fontWeight: 700, transition: 'background 0.2s' }}>
                                <Download size={16} /> Open
                            </a>
                            {!d.is_admin_uploaded && (
                                <button onClick={() => deleteDoc(d.id)} style={{ padding: '10px', borderRadius: 10, border: '1.5px solid var(--border-color)', background: 'var(--bg-card)', color: '#ef4444', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Upload Modal */}
            <div className={`t-modal-overlay${showUploadModal ? ' open' : ''}`} onClick={e => { if (e.target === e.currentTarget) setShowUploadModal(false) }}>
                <div className="t-modal-box t-modal-box--md">
                    <div className="t-modal-head">
                        <div>
                            <h2 className="t-modal-title">Upload Document</h2>
                            <p className="t-modal-sub">Add to your secure vault</p>
                        </div>
                        <button type="button" className="t-modal-close" onClick={() => setShowUploadModal(false)} aria-label="Close"><X size={18} strokeWidth={2.5} /></button>
                    </div>
                    <form onSubmit={handleUpload}>
                        <div className="t-modal-body">
                            <div className="t-field">
                                <label className="t-label">Document Title</label>
                                <input className="t-input" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Week 1 Lesson Plan" required />
                            </div>
                            <div className="t-field">
                                <label className="t-label">Document Type</label>
                                <select className="t-select" value={docType} onChange={(e) => setDocType(e.target.value)}>
                                    <option value="lesson_plan">Lesson Plan</option>
                                    <option value="lesson_note">Lesson Note</option>
                                    <option value="appointment_letter">Appointment Letter</option>
                                    <option value="certificate">Certificate</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="t-field">
                                <label className="t-label">File URL (Drive / Cloud Link)</label>
                                <input className="t-input" type="url" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="https://drive.google.com/..." required />
                            </div>
                        </div>
                        <div className="t-modal-foot t-modal-foot--split">
                            <button type="button" onClick={() => setShowUploadModal(false)} style={{ padding: '14px', borderRadius: 12, border: '1.5px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
                            <button type="submit" disabled={submitting} className="upload-btn" style={{ display: 'flex', justifyContent: 'center' }}>
                                {submitting ? 'Uploading...' : 'Save Document'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
