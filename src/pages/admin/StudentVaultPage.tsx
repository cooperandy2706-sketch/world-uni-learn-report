// src/pages/admin/StudentVaultPage.tsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { 
  FileText, 
  Plus, 
  Search, 
  Download, 
  Trash2, 
  Eye, 
  User, 
  ChevronRight,
  Shield,
  FileCheck,
  Stethoscope,
  BookOpen
} from 'lucide-react'

export default function StudentVaultPage() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [students, setStudents] = useState<any[]>([])
    const [search, setSearch] = useState('')
    const [selectedStudent, setSelectedStudent] = useState<any>(null)
    const [documents, setDocuments] = useState<any[]>([])
    const [showUploadModal, setShowUploadModal] = useState(false)

    // Upload Form State
    const [title, setTitle] = useState('')
    const [docType, setDocType] = useState('birth_certificate')
    const [fileUrl, setFileUrl] = useState('')
    const [fileSizeMB, setFileSizeMB] = useState('1.5') // Simulated size in MB
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (user) loadStudents()
    }, [user])

    async function loadStudents() {
        setLoading(true)
        const { data, error } = await supabase.from('students').select('*, class:classes(name)').order('full_name')
        if (error) toast.error(error.message)
        else setStudents(data || [])
        setLoading(false)
    }

    async function loadDocuments(studentId: string) {
        const { data, error } = await supabase.from('student_documents').select('*').eq('student_id', studentId).order('created_at', { ascending: false })
        if (error) toast.error(error.message)
        else setDocuments(data || [])
    }

    useEffect(() => {
        if (selectedStudent) loadDocuments(selectedStudent.id)
    }, [selectedStudent])

    async function handleUpload(e: React.FormEvent) {
        e.preventDefault()
        if (!title || !fileUrl) return toast.error('Please provide a title and file URL')

        setSubmitting(true)
        const { error } = await supabase.from('student_documents').insert({
            school_id: user!.school_id,
            student_id: selectedStudent.id,
            title,
            document_type: docType,
            file_url: fileUrl,
            file_size_bytes: Math.round(parseFloat(fileSizeMB) * 1024 * 1024),
            uploaded_by: user!.id
        })

        if (error) {
            toast.error(error.message)
        } else {
            toast.success('Document uploaded to vault')
            setShowUploadModal(false)
            setTitle(''); setFileUrl('')
            loadDocuments(selectedStudent.id)
        }
        setSubmitting(false)
    }

    async function deleteDoc(id: string) {
        if (!confirm('Are you sure you want to delete this document from the vault?')) return
        const { error } = await supabase.from('student_documents').delete().eq('id', id)
        if (error) toast.error(error.message)
        else loadDocuments(selectedStudent.id)
    }

    const filteredStudents = students.filter(s => 
        s.full_name.toLowerCase().includes(search.toLowerCase()) || 
        s.student_id?.toLowerCase().includes(search.toLowerCase())
    )

    const getDocIcon = (type: string) => {
        switch(type) {
            case 'birth_certificate': return <Shield size={18} />
            case 'medical_record': return <Stethoscope size={18} />
            case 'report_card': return <BookOpen size={18} />
            case 'transfer_certificate': return <FileCheck size={18} />
            default: return <FileText size={18} />
        }
    }

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
                .student-item:hover { background: #f5f3ff; cursor: pointer; }
                .doc-card:hover { border-color: #c4b5fd; transform: translateY(-2px); transition: all 0.2s; }
            `}</style>

            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 32, fontWeight: 700, color: '#111827', margin: 0 }}>Student Document Vault</h1>
                <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>Secure storage for student birth certificates, medical records, and reports.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: 24 }}>
                {/* Student Selector */}
                <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: 'fit-content', position: 'sticky', top: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f9fafb', padding: '10px 14px', borderRadius: '10px', marginBottom: 16 }}>
                        <Search size={18} color="#9ca3af" />
                        <input 
                            type="text" 
                            placeholder="Find student..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ background: 'none', border: 'none', outline: 'none', width: '100%', fontSize: 14 }}
                        />
                    </div>
                    <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                        {filteredStudents.map((s, i) => (
                            <div 
                                key={i} 
                                onClick={() => setSelectedStudent(s)}
                                className="student-item"
                                style={{ 
                                    padding: '12px', borderRadius: '12px', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 12,
                                    background: selectedStudent?.id === s.id ? '#f5f3ff' : 'transparent',
                                    border: selectedStudent?.id === s.id ? '1.5px solid #c4b5fd' : '1.5px solid transparent'
                                }}
                            >
                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#ede9fe', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
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

                {/* Document View */}
                <div style={{ minHeight: '600px' }}>
                    {selectedStudent ? (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#7c3aed', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700 }}>
                                        {selectedStudent.full_name.charAt(0)}
                                    </div>
                                    <div>
                                        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{selectedStudent.full_name}</h2>
                                        <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>Vault Repository · {documents.length} Files</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowUploadModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#7c3aed', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                                    <Plus size={18} /> Upload New
                                </button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                                {documents.length === 0 ? (
                                    <div className="card" style={{ gridColumn: '1/-1', padding: '100px', textAlign: 'center', borderStyle: 'dashed', background: '#f9fafb' }}>
                                        <FileText size={48} color="#e5e7eb" style={{ marginBottom: 16 }} />
                                        <p style={{ color: '#9ca3af', fontWeight: 500 }}>No documents in this student's vault yet.</p>
                                    </div>
                                ) : documents.map((d, i) => (
                                    <div key={i} className="card doc-card" style={{ padding: '20px' }}>
                                        <div style={{ background: '#f5f3ff', color: '#7c3aed', padding: '10px', borderRadius: '12px', display: 'inline-block', marginBottom: 16 }}>
                                            {getDocIcon(d.document_type)}
                                        </div>
                                        <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 4px', textTransform: 'capitalize' }}>{d.title}</h3>
                                        <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 16px' }}>{d.document_type.replace('_', ' ')} · {format(new Date(d.created_at), 'MMM dd, yyyy')}</p>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <a href={d.file_url} target="_blank" rel="noreferrer" style={{ flex: 1, textAlign: 'center', padding: '8px', borderRadius: 8, background: '#f5f3ff', color: '#7c3aed', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
                                                View
                                            </a>
                                            <button onClick={() => deleteDoc(d.id)} style={{ padding: '8px', borderRadius: 8, border: '1.5px solid #fee2e2', background: 'white', color: '#ef4444', cursor: 'pointer' }}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="card" style={{ padding: '120px 40px', textAlign: 'center', borderStyle: 'dashed', background: '#f9fafb' }}>
                            <div style={{ background: '#ede9fe', color: '#7c3aed', width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                <User size={32} />
                            </div>
                            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>Select a Student</h3>
                            <p style={{ color: '#6b7280', fontSize: 14, maxWidth: '300px', margin: '0 auto' }}>Choose a student from the directory to access their secure document vault.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Upload Modal */}
            {showUploadModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '32px', animation: 'fadeIn 0.3s ease' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                            <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Add to Student Vault</h2>
                            <button onClick={() => setShowUploadModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 24 }}>✕</button>
                        </div>

                        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Document Title</label>
                                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Birth Certificate" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #e5e7eb', outline: 'none' }} required />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Document Type</label>
                                <select value={docType} onChange={(e) => setDocType(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #e5e7eb', outline: 'none' }}>
                                    <option value="birth_certificate">Birth Certificate</option>
                                    <option value="report_card">Academic Report Card</option>
                                    <option value="medical_record">Medical Record</option>
                                    <option value="transfer_certificate">Transfer Certificate</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>File URL (Link to Cloud Storage)</label>
                                <input type="url" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="https://cloud.storage.com/file..." style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #e5e7eb', outline: 'none' }} required />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Estimated File Size (MB)</label>
                                <input type="number" step="0.1" value={fileSizeMB} onChange={(e) => setFileSizeMB(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #e5e7eb', outline: 'none' }} required />
                            </div>

                            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                                <button type="button" onClick={() => setShowUploadModal(false)} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1.5px solid #e5e7eb', background: 'white', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" disabled={submitting} style={{ flex: 2, padding: '12px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                                    {submitting ? 'Adding...' : 'Store in Vault'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
