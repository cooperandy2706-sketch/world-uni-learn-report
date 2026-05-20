import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Folder, FolderOpen, FileText, Plus, Download, Trash2, 
  Shield, FileCheck, BookOpen, User, CheckCircle2, XCircle, Search, Clock, Lock
} from 'lucide-react'

const FOLDER_CATEGORIES = [
    { id: 'lesson_plan', label: 'Lesson Plans', icon: BookOpen, color: '#3b82f6' },
    { id: 'lesson_note', label: 'Lesson Notes', icon: FileText, color: '#f59e0b' },
    { id: 'appointment_letter', label: 'Appointments', icon: FileCheck, color: '#10b981' },
    { id: 'certificate', label: 'Certificates', icon: Shield, color: '#8b5cf6' },
    { id: 'other', label: 'Other Docs', icon: FileText, color: '#6b7280' }
]

export default function StaffVaultPage() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [staff, setStaff] = useState<any[]>([])
    const [search, setSearch] = useState('')
    
    // Selection state
    const [selectedStaff, setSelectedStaff] = useState<any>(null)
    const [documents, setDocuments] = useState<any[]>([])
    
    // View state inside folder
    const [activeCategory, setActiveCategory] = useState<string | null>(null)
    const [selectedDoc, setSelectedDoc] = useState<any>(null)

    // Upload state
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [title, setTitle] = useState('')
    const [docType, setDocType] = useState('appointment_letter')
    const [fileUrl, setFileUrl] = useState('')
    const [fileSizeMB, setFileSizeMB] = useState('1.5')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (user) loadStaff()
    }, [user])

    async function loadStaff() {
        if (!user?.school_id) return
        setLoading(true)
        const { data, error } = await supabase
            .from('teachers')
            .select('*, user:users(*)')
            .eq('school_id', user.school_id)
        if (error) toast.error(error.message)
        else setStaff(data || [])
        setLoading(false)
    }

    async function loadDocuments(staffId: string) {
        const { data, error } = await supabase
            .from('staff_documents')
            .select('*')
            .eq('user_id', staffId)
            .order('created_at', { ascending: false })
        if (error) toast.error(error.message)
        else setDocuments(data || [])
    }

    useEffect(() => {
        if (selectedStaff) {
            loadDocuments(selectedStaff.user_id)
            setActiveCategory(null)
            setSelectedDoc(null)
        }
    }, [selectedStaff])

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title || !fileUrl) return toast.error('Title and URL required')

        setSubmitting(true)
        const { error } = await supabase.from('staff_documents').insert({
            school_id: user!.school_id,
            user_id: selectedStaff.user_id,
            title,
            document_type: docType,
            file_url: fileUrl,
            file_size_bytes: Math.round(parseFloat(fileSizeMB) * 1024 * 1024),
            uploaded_by: user!.id,
            status: 'approved',
            is_admin_uploaded: true
        })

        if (error) {
            toast.error(error.message)
        } else {
            toast.success('Document locked into vault')
            setShowUploadModal(false)
            setTitle('')
            setFileUrl('')
            loadDocuments(selectedStaff.user_id)
        }
        setSubmitting(false)
    }

    const deleteDoc = async (id: string) => {
        if (!confirm('Delete this document?')) return
        const { error } = await supabase.from('staff_documents').delete().eq('id', id)
        if (error) toast.error(error.message)
        else loadDocuments(selectedStaff.user_id)
    }

    const updateDocStatus = async (id: string, status: 'approved' | 'rejected') => {
        const { error } = await supabase.from('staff_documents').update({ status }).eq('id', id)
        if (error) toast.error(error.message)
        else {
            toast.success(`Document ${status}`)
            loadDocuments(selectedStaff.user_id)
            if (selectedDoc?.id === id) setSelectedDoc({ ...selectedDoc, status })
        }
    }

    const filteredStaff = staff.filter(s => 
        s.user?.full_name?.toLowerCase().includes(search.toLowerCase()) || 
        s.staff_id?.toLowerCase().includes(search.toLowerCase())
    )

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
            <div className="animate-spin" style={{ width: 40, height: 40, border: '4px solid #f3f3f3', borderTop: '4px solid #7c3aed', borderRadius: '50%' }} />
        </div>
    )

    return (
        <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', fontFamily: '"DM Sans",system-ui,sans-serif' }}>
            <style>{`
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .glass-modal { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(16px); }
            `}</style>

            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1e0646', margin: 0 }}>Staff Vault</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: 15, margin: '4px 0 20px' }}>Access and manage staff documents, lesson plans, and confidential records.</p>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'white', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #f0eefe', width: '100%', maxWidth: '400px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                    <Search size={18} color="#9ca3af" />
                    <input 
                        type="text" 
                        placeholder="Search staff by name or ID..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ background: 'none', border: 'none', outline: 'none', width: '100%', fontSize: 14 }}
                    />
                </div>
            </div>

            {/* Horizontal Scroll of Staff Folders */}
            <div className="hide-scrollbar" style={{ display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 32, paddingLeft: 4, paddingRight: 4 }}>
                {filteredStaff.map((s, i) => (
                    <motion.div 
                        key={i}
                        whileHover={{ y: -5, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedStaff(s)}
                        style={{ 
                            minWidth: 160, 
                            background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
                            border: '1.5px solid #e2e8f0',
                            borderRadius: '16px 24px 16px 16px',
                            padding: '24px 16px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
                            position: 'relative'
                        }}
                    >
                        {/* Windows Style Folder Visual */}
                        <svg width="64" height="64" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0px 8px 16px rgba(0,0,0,0.06))', marginBottom: 16 }}>
                            {/* Back flap */}
                            <path d="M5 25 C5 20, 10 15, 15 15 L35 15 C38 15, 41 17, 43 20 L48 28 C50 31, 53 32, 57 32 L85 32 C90 32, 95 37, 95 42 L95 85 C95 90, 90 95, 85 95 L15 95 C10 95, 5 90, 5 85 Z" fill="#EAB308" />
                            {/* Inner paper */}
                            <path d="M10 30 L90 30 L90 85 L10 85 Z" fill="#FEF9C3" />
                            <path d="M15 38 L85 38 L85 42 L15 42 Z" fill="#CBD5E1" />
                            <path d="M15 48 L70 48 L70 52 L15 52 Z" fill="#CBD5E1" />
                            {/* Front flap */}
                            <path d="M5 45 C5 40, 10 38, 15 38 L85 38 C90 38, 95 40, 95 45 L95 85 C95 90, 90 95, 85 95 L15 95 C10 95, 5 90, 5 85 Z" fill="#FDE047" />
                            <path d="M7 45 C7 42, 11 40, 15 40 L85 40 C89 40, 93 42, 93 45" stroke="#FEF08A" strokeWidth="2" fill="none" />
                        </svg>
                        
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#ede9fe', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
                            {s.user?.full_name?.charAt(0) || '?'}
                        </div>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e0646', margin: '0 0 4px', textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {s.user?.full_name}
                        </h3>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>{s.staff_id}</p>
                    </motion.div>
                ))}
            </div>

            {/* Animated Folder Modal */}
            <AnimatePresence>
                {selectedStaff && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 40, rotateX: 20 }}
                            animate={{ scale: 1, y: 0, rotateX: 0 }}
                            exit={{ scale: 0.9, y: 40, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="glass-modal"
                            style={{ 
                                width: '100%', maxWidth: '1000px', height: '85vh', 
                                borderRadius: 24, border: '1px solid rgba(255,255,255,0.5)',
                                display: 'flex', flexDirection: 'column', overflow: 'hidden',
                                boxShadow: '0 24px 48px rgba(0,0,0,0.2)'
                            }}
                        >
                            {/* Modal Header */}
                            <div style={{ padding: '24px 32px', background: 'rgba(255,255,255,0.8)', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                    <div style={{ background: '#7c3aed', color: 'white', padding: 12, borderRadius: 16 }}>
                                        <FolderOpen size={28} />
                                    </div>
                                    <div>
                                        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1e0646', margin: 0 }}>{selectedStaff.user?.full_name}'s Folder</h2>
                                        <p style={{ margin: '4px 0 0', fontSize: 14, color: '#64748b' }}>Staff ID: {selectedStaff.staff_id} · {documents.length} Files</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <button onClick={() => setShowUploadModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1e0646', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                                        <Plus size={18} /> Upload Locked File
                                    </button>
                                    <button onClick={() => setSelectedStaff(null)} style={{ background: '#f1f5f9', border: 'none', width: 40, height: 40, borderRadius: '50%', color: '#64748b', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                                </div>
                            </div>

                            {/* Modal Body - Split View if doc is selected */}
                            <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: 'rgba(248, 250, 252, 0.5)' }}>
                                
                                {/* Left Side: Navigation / Subfolders */}
                                <div style={{ width: selectedDoc ? '350px' : '100%', borderRight: selectedDoc ? '1px solid rgba(0,0,0,0.05)' : 'none', display: 'flex', flexDirection: 'column', transition: 'width 0.3s ease', overflowY: 'auto' }}>
                                    
                                    {/* Subfolders Grid */}
                                    <div style={{ padding: 24, display: 'grid', gridTemplateColumns: selectedDoc ? '1fr' : 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                                        {FOLDER_CATEGORIES.map(cat => {
                                            const count = documents.filter(d => d.document_type === cat.id).length
                                            const isActive = activeCategory === cat.id
                                            return (
                                                <div 
                                                    key={cat.id}
                                                    onClick={() => { setActiveCategory(isActive ? null : cat.id); setSelectedDoc(null); }}
                                                    style={{ 
                                                        background: isActive ? '#ede9fe' : 'white',
                                                        border: isActive ? '1.5px solid #c4b5fd' : '1.5px solid rgba(0,0,0,0.05)',
                                                        borderRadius: 16, padding: '16px', cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', gap: 16,
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <div style={{ background: `${cat.color}15`, color: cat.color, padding: 12, borderRadius: 12 }}>
                                                        <cat.icon size={24} />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1e0646' }}>{cat.label}</div>
                                                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{count} Files</div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>

                                    {/* File List for Active Category */}
                                    <AnimatePresence>
                                        {activeCategory && (
                                            <motion.div 
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                style={{ padding: '0 24px 24px' }}
                                            >
                                                <h3 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', marginBottom: 16, borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: 8 }}>
                                                    {FOLDER_CATEGORIES.find(c => c.id === activeCategory)?.label} Files
                                                </h3>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                    {documents.filter(d => d.document_type === activeCategory).length === 0 && (
                                                        <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 13, background: 'rgba(255,255,255,0.5)', borderRadius: 12 }}>No files in this folder</div>
                                                    )}
                                                    {documents.filter(d => d.document_type === activeCategory).map(d => (
                                                        <div 
                                                            key={d.id}
                                                            onClick={() => setSelectedDoc(d)}
                                                            style={{ 
                                                                background: selectedDoc?.id === d.id ? '#1e0646' : 'white',
                                                                color: selectedDoc?.id === d.id ? 'white' : 'inherit',
                                                                borderRadius: 12, padding: 16, cursor: 'pointer',
                                                                border: '1px solid rgba(0,0,0,0.05)',
                                                                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                                                            }}
                                                        >
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                                                <div style={{ fontSize: 14, fontWeight: 700 }}>{d.title}</div>
                                                                {d.is_admin_uploaded && <Lock size={14} color={selectedDoc?.id === d.id ? '#c4b5fd' : '#94a3b8'} />}
                                                            </div>
                                                            <div style={{ fontSize: 12, color: selectedDoc?.id === d.id ? '#c4b5fd' : '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                <Clock size={12} /> {format(new Date(d.created_at), 'MMM dd, yyyy')}
                                                            </div>
                                                            {(d.document_type === 'lesson_plan' || d.document_type === 'lesson_note') && (
                                                                <div style={{ marginTop: 10 }}>
                                                                    {d.status === 'approved' ? (
                                                                        <span style={{ fontSize: 10, fontWeight: 800, color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 8px', borderRadius: 6 }}>APPROVED</span>
                                                                    ) : d.status === 'rejected' ? (
                                                                        <span style={{ fontSize: 10, fontWeight: 800, color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '4px 8px', borderRadius: 6 }}>REJECTED</span>
                                                                    ) : (
                                                                        <span style={{ fontSize: 10, fontWeight: 800, color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '4px 8px', borderRadius: 6 }}>PENDING</span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Right Side: Document Viewer & Approvals */}
                                {selectedDoc && (
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'white' }}>
                                        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                                            <div>
                                                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1e0646' }}>{selectedDoc.title}</h3>
                                                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>Uploaded {format(new Date(selectedDoc.created_at), 'PPpp')}</p>
                                            </div>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button onClick={() => deleteDoc(selectedDoc.id)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #fee2e2', background: 'white', color: '#ef4444', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <Trash2 size={16} /> Delete
                                                </button>
                                                <a href={selectedDoc.file_url} target="_blank" rel="noreferrer" style={{ padding: '8px 16px', borderRadius: 8, background: '#1e0646', color: 'white', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <Download size={16} /> Open Link
                                                </a>
                                            </div>
                                        </div>

                                        {(selectedDoc.document_type === 'lesson_plan' || selectedDoc.document_type === 'lesson_note') && (
                                            <div style={{ padding: '16px 24px', background: '#fffbeb', borderBottom: '1px solid #fde68a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ fontSize: 12, fontWeight: 800, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Approval Required</div>
                                                    <div style={{ fontSize: 14, color: '#92400e', marginTop: 2 }}>Review this document and approve or reject it.</div>
                                                </div>
                                                <div style={{ display: 'flex', gap: 12 }}>
                                                    <button onClick={() => updateDocStatus(selectedDoc.id, 'rejected')} disabled={selectedDoc.status === 'rejected'} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: selectedDoc.status === 'rejected' ? '#fee2e2' : 'white', color: '#dc2626', fontWeight: 700, cursor: 'pointer' }}>Reject</button>
                                                    <button onClick={() => updateDocStatus(selectedDoc.id, 'approved')} disabled={selectedDoc.status === 'approved'} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: selectedDoc.status === 'approved' ? '#10b981' : '#7c3aed', color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <CheckCircle2 size={16} /> {selectedDoc.status === 'approved' ? 'Approved' : 'Approve Plan'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
                                            <div style={{ width: 100, height: 100, borderRadius: 24, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', marginBottom: 24 }}>
                                                <FileText size={48} color="#94a3b8" />
                                            </div>
                                            <h4 style={{ fontSize: 18, fontWeight: 700, color: '#1e0646', margin: '0 0 8px' }}>File Preview Unavailable</h4>
                                            <p style={{ color: '#64748b', fontSize: 14, maxWidth: 300, textAlign: 'center', margin: 0 }}>This is an external link. Please click "Open Link" to view the document securely in a new tab.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Admin Upload Modal */}
            {showUploadModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(8px)', padding: 16 }}>
                    <div className="glass-modal" style={{ width: '100%', maxWidth: '450px', padding: '32px', borderRadius: 24, boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: 16 }}>
                            <div>
                                <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: '#1e0646' }}>Upload Locked Document</h2>
                                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>Files uploaded here cannot be deleted by the teacher.</p>
                            </div>
                        </div>

                        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>Document Title</label>
                                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Appointment Letter 2026" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid var(--border-color)', outline: 'none', fontSize: 14, boxSizing: 'border-box' }} required />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>Category</label>
                                <select value={docType} onChange={(e) => setDocType(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid var(--border-color)', outline: 'none', fontSize: 14, boxSizing: 'border-box' }}>
                                    <option value="appointment_letter">Appointment Letter</option>
                                    <option value="certificate">Certificate</option>
                                    <option value="other">Other Official Record</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>File URL (Drive / Cloud Link)</label>
                                <input type="url" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="https://drive.google.com/..." style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid var(--border-color)', outline: 'none', fontSize: 14, boxSizing: 'border-box' }} required />
                            </div>
                            
                            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                                <button type="button" onClick={() => setShowUploadModal(false)} style={{ flex: 1, padding: '14px', borderRadius: 12, border: '1.5px solid var(--border-color)', background: 'white', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
                                <button type="submit" disabled={submitting} style={{ flex: 2, background: '#1e0646', color: 'white', border: 'none', padding: '14px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                                    {submitting ? 'Uploading...' : 'Save Locked File'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
