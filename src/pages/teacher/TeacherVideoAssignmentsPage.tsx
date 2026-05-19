import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'
import { Play, Plus, Trash2, Users } from 'lucide-react'

function extractYouTubeId(url: string) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/)
  return match ? match[1] : null
}

export default function TeacherVideoAssignmentsPage() {
  const { user } = useAuth()
  const [assignments, setAssignments] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
      `}</style>

      <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto', fontFamily: '"DM Sans",sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-main)', margin: '0 0 8px' }}>Video Assignments</h1>
            <p style={{ fontSize: 15, color: 'var(--text-muted)', margin: 0 }}>Assign YouTube videos to your classes and track who watched them.</p>
          </div>
          <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(124,58,237,0.2)' }}>
            <Plus size={18} /> New Assignment
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-subtle)' }}>Loading assignments...</div>
        ) : assignments.length === 0 ? (
          <div style={{ background: 'var(--bg-card)', borderRadius: 24, padding: '60px 20px', textAlign: 'center', border: '1.5px solid #f0eefe' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📹</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)', margin: '0 0 8px' }}>No video assignments yet</h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 24px' }}>Share educational YouTube videos with your students.</p>
            <button onClick={() => setShowModal(true)} style={{ padding: '10px 20px', background: '#f8fafc', color: 'var(--text-main)', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Assign a Video
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {assignments.map(a => {
              const watchedCount = a.progress?.filter((p: any) => p.is_completed).length || 0
              return (
                <div key={a.id} style={{ background: 'var(--bg-card)', borderRadius: 20, overflow: 'hidden', border: '1.5px solid #f0eefe', display: 'flex', flexDirection: 'column' }}>
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
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'var(--bg-card)', width: '100%', maxWidth: 500, borderRadius: 24, overflow: 'hidden', animation: '_slideUp 0.3s ease' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Assign Video</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', fontSize: 24, cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding: 24 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>YouTube URL *</label>
                <input 
                  autoFocus required 
                  placeholder="https://youtube.com/watch?v=..." 
                  value={url} onChange={e => setUrl(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {previewId && (
                <div style={{ marginBottom: 16, borderRadius: 12, overflow: 'hidden', height: 160, background: '#000', position: 'relative' }}>
                  <img src={`https://img.youtube.com/vi/${previewId}/mqdefault.jpg`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Video Title *</label>
                <input 
                  required placeholder="e.g. History of Rome - Part 1" 
                  value={title} onChange={e => setTitle(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Target Class *</label>
                  <select required value={classId} onChange={e => setClassId(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', background: 'var(--bg-card)' }}>
                    <option value="">Select a class...</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Due Date (Optional)</label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Instructions</label>
                <textarea 
                  placeholder="What should students look out for?" rows={3}
                  value={instructions} onChange={e => setInstructions(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box', resize: 'none' }}
                />
              </div>

              <button disabled={saving || !previewId} type="submit" style={{ width: '100%', padding: '14px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: (saving || !previewId) ? 0.5 : 1 }}>
                {saving ? 'Assigning...' : 'Assign Video'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
