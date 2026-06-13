import { useStuckLoadingReload } from '../../hooks/useStuckLoadingReload'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'
import { Play, Plus, Trash2, Users, X } from 'lucide-react'
import { useAutoRefresh } from "../../hooks/useAutoRefresh";

function extractYouTubeId(url: string) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/)
  return match ? match[1] : null
}

export default function TeacherVideoAssignmentsPage() {
    useAutoRefresh(loadData);
  const { user } = useAuth()
  const [assignments, setAssignments] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useStuckLoadingReload(loading)

  // Form state
  const [showModal, setShowModal] = useState(false)
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [instructions, setInstructions] = useState('')
  const [classId, setClassId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [saving, setSaving] = useState(false)

  const previewId = extractYouTubeId(url)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      // Load classes
      const { data: cls } = await supabase.from('classes').select('id, name').eq('school_id', user!.school_id).order('name')
      setClasses(cls || [])

      // Load assignments for this teacher
      const { data: assigns } = await supabase
        .from('video_assignments')
        .select(`
          *,
          class:classes(name),
          progress:video_progress(student_id, is_completed)
        `)
        .eq('teacher_id', user!.id)
        .order('created_at', { ascending: false })

      setAssignments(assigns || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!previewId || !title || !classId) return toast.error('Please fill required fields')

    setSaving(true)
    try {
      const { error } = await supabase.from('video_assignments').insert({
        teacher_id: user!.id,
        class_id: classId,
        youtube_id: previewId,
        title,
        instructions,
        due_date: dueDate || null
      })

      if (error) throw error
      toast.success('Video assigned successfully!')
      setShowModal(false)
      setUrl(''); setTitle(''); setInstructions(''); setDueDate(''); setClassId('')
      loadData()
    } catch (e) {
      toast.error('Failed to assign video')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this assignment?')) return
    try {
      await supabase.from('video_assignments').delete().eq('id', id).eq('teacher_id', user!.id)
      setAssignments(prev => prev.filter(a => a.id !== id))
      toast.success('Assignment deleted')
    } catch (e) {
      toast.error('Failed to delete')
    }
  }

  return (
    <div className="t-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        @media (max-width: 640px) {
          .assign-grid { grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)) !important; }
          .resp-flex-col { flex-direction: column !important; align-items: stretch !important; gap: 16px !important; }
          .resp-btn { width: 100%; justify-content: center; }
        }
      `}</style>

      <div>
        <div className="resp-flex-col" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-main)', margin: '0 0 8px' }}>Video Assignments</h1>
            <p style={{ fontSize: 15, color: 'var(--text-muted)', margin: 0 }}>Assign YouTube videos to your classes and track who watched them.</p>
          </div>
          <button className="resp-btn" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(124,58,237,0.2)' }}>
            <Plus size={18} /> New Assignment
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-subtle)' }}>Loading assignments...</div>
        ) : assignments.length === 0 ? (
          <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: '60px 20px', textAlign: 'center', border: '1.5px solid #f0eefe' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📹</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)', margin: '0 0 8px' }}>No video assignments yet</h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 24px' }}>Share educational YouTube videos with your students.</p>
            <button onClick={() => setShowModal(true)} style={{ padding: '10px 20px', background: '#f8fafc', color: 'var(--text-main)', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Assign a Video
            </button>
          </div>
        ) : (
          <div className="assign-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {assignments.map(a => {
              const watchedCount = a.progress?.filter((p: any) => p.is_completed).length || 0
              return (
                <div key={a.id} style={{ background: 'var(--bg-card)', borderRadius: 8, overflow: 'hidden', border: '1.5px solid #f0eefe', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ position: 'relative', height: 180, background: '#000' }}>
                    <img src={`https://img.youtube.com/vi/${a.youtube_id}/hqdefault.jpg`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
                    <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(255,255,255,0.9)', padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800, color: '#4c1d95' }}>
                      {a.class?.name}
                    </div>
                    {a.due_date && (
                      <div style={{ position: 'absolute', bottom: 12, left: 12, background: '#dc2626', color: '#fff', padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700 }}>
                        Due: {new Date(a.due_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', margin: '0 0 8px', lineHeight: 1.4 }}>{a.title}</h3>
                    {a.instructions && (
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' as any }}>
                        {a.instructions}
                      </p>
                    )}
                    <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid #f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#16a34a', fontSize: 13, fontWeight: 700 }}>
                        <Users size={16} /> {watchedCount} watched
                      </div>
                      <button onClick={() => handleDelete(a.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* New Assignment Modal */}
      <div className={`t-modal-overlay${showModal ? ' open' : ''}`} onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
        <div className="t-modal-box t-modal-box--md">
          <div className="t-modal-head">
            <div>
              <h2 className="t-modal-title">Assign Video</h2>
            </div>
            <button type="button" className="t-modal-close" onClick={() => setShowModal(false)} aria-label="Close"><X size={18} strokeWidth={2.5} /></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="t-modal-body">
              <div className="t-field">
                <label className="t-label">YouTube URL *</label>
                <input
                  className="t-input"
                  autoFocus
                  required
                  placeholder="https://youtube.com/watch?v=..."
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                />
              </div>

              {previewId && (
                <div className="t-field" style={{ borderRadius: 12, overflow: 'hidden', height: 160, background: '#000' }}>
                  <img src={`https://img.youtube.com/vi/${previewId}/mqdefault.jpg`} alt="Video preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

              <div className="t-field">
                <label className="t-label">Video Title *</label>
                <input
                  className="t-input"
                  required
                  placeholder="e.g. History of Rome - Part 1"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>

              <div className="resp-flex-col" style={{ display: 'flex', gap: 12 }}>
                <div className="t-field" style={{ flex: 1 }}>
                  <label className="t-label">Target Class *</label>
                  <select className="t-select" required value={classId} onChange={e => setClassId(e.target.value)}>
                    <option value="">Select a class...</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="t-field" style={{ flex: 1 }}>
                  <label className="t-label">Due Date (Optional)</label>
                  <input className="t-input" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                </div>
              </div>

              <div className="t-field">
                <label className="t-label">Instructions</label>
                <textarea
                  className="t-textarea"
                  placeholder="What should students look out for?"
                  rows={3}
                  value={instructions}
                  onChange={e => setInstructions(e.target.value)}
                  style={{ resize: 'none' }}
                />
              </div>
            </div>
            <div className="t-modal-foot">
              <button disabled={saving || !previewId} type="submit" style={{ width: '100%', padding: '14px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: (saving || !previewId) ? 0.5 : 1 }}>
                {saving ? 'Assigning...' : 'Assign Video'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
