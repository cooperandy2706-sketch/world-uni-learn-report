import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { BookOpen, Clock, FileText, Download, Star, ExternalLink, Calendar } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'

export default function StudentResourcesPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [assignments, setAssignments] = useState<any[]>([])
  const [resources, setResources] = useState<any[]>([])
  const [student, setStudent] = useState<any>(null)

  useEffect(() => {
    if (user?.id) loadResources()
  }, [user?.id])

  async function loadResources() {
    setLoading(true)
    try {
      const { data: s } = await supabase
        .from('students')
        .select('*, class:classes(id,name)')
        .eq('user_id', user!.id)
        .single()
      
      if (s) {
        setStudent(s)
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        const tomorrowStr = tomorrow.toISOString().slice(0, 10)

        const [assignRes, resourceRes] = await Promise.all([
          // Assignments due tomorrow or recently
          supabase.from('assignments')
            .select('*, subject:subjects(name)')
            .eq('class_id', s.class_id)
            .eq('is_published', true)
            .order('due_date', { ascending: true })
            .limit(10),
          // Syllabus/Resources items
          supabase.from('syllabus_items')
            .select('*, subject:subjects(name)')
            .eq('class_id', s.class_id)
            .order('created_at', { ascending: false })
            .limit(10)
        ])

        setAssignments(assignRes.data ?? [])
        setResources(resourceRes.data ?? [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().slice(0, 10)
  
  const dueTomorrow = assignments.filter(a => a.due_date === tomorrowStr)

  if (loading) return null

  return (
    <div style={{ fontFamily: '"DM Sans", sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        
        .resources-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 24px;
        }

        @media (max-width: 1024px) {
          .resources-grid {
            grid-template-columns: 1fr;
          }
          .resources-sidebar {
            order: -1;
          }
        }

        @media (max-width: 640px) {
          .resources-header h1 { font-size: 24px !important; }
          .resources-card-padding { padding: 16px !important; }
          .due-hero { padding: 24px !important; }
          .material-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="resources-header" style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 28, fontWeight: 700, color: '#111827', margin: 0 }}>Homework & Resources</h1>
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Access your study materials and track upcoming deadlines.</p>
      </div>

      <div className="resources-grid">
        
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Due Tomorrow Hero */}
          {dueTomorrow.length > 0 && (
            <div className="due-hero" style={{ 
              background: 'linear-gradient(135deg, #7c3aed, #4c1d95)', 
              borderRadius: 24, 
              padding: 32, 
              color: '#fff',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(124,58,237,0.2)'
            }}>
              <div style={{ position: 'absolute', right: -20, bottom: -20, fontSize: 120, opacity: 0.1, transform: 'rotate(-15deg)' }}>⏰</div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <span style={{ fontSize: 11, fontWeight: 800, background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 99, letterSpacing: '0.05em' }}>DUE TOMORROW</span>
                <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: 24, fontWeight: 700, marginTop: 12, marginBottom: 8 }}>{dueTomorrow.length} Assignment{dueTomorrow.length > 1 ? 's' : ''} Pending</h2>
                <p style={{ fontSize: 14, opacity: 0.8, marginBottom: 20 }}>Don't forget to submit your work before the deadline!</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {dueTomorrow.map(a => (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)' }}>
                      <BookOpen size={18} />
                      <span style={{ fontSize: 14, fontWeight: 700 }}>{a.title}</span>
                      <span style={{ fontSize: 12, opacity: 0.6 }}>· {a.subject?.name}</span>
                    </div>
                  ))}
                </div>
                <Link to={ROUTES.STUDENT_ASSIGNMENTS} style={{ display: 'inline-block', marginTop: 20, background: '#fff', color: '#7c3aed', padding: '12px 24px', borderRadius: 12, fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>Go to Assignments →</Link>
              </div>
            </div>
          )}

          {/* Resources List */}
          <div style={{ background: '#fff', borderRadius: 24, border: '1.5px solid #f1f5f9', overflow: 'hidden' }}>
            <div className="resources-card-padding" style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
              <FileText size={20} color="#059669" />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>Study Materials & Resources</h3>
            </div>
            
            {resources.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📔</div>
                <p style={{ fontSize: 14, color: '#9ca3af', margin: 0 }}>No reading materials uploaded yet.</p>
              </div>
            ) : (
              <div className="resources-card-padding material-grid" style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {resources.map(r => (
                  <div key={r.id} style={{ border: '1px solid #f1f5f9', borderRadius: 16, padding: 16, transition: 'all 0.2s', background: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: '#ecfeff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📚</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.topic}</div>
                        <div style={{ fontSize: 11, color: '#0891b2', fontWeight: 600 }}>{r.subject?.name}</div>
                      </div>
                    </div>
                    <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 } as any}>
                      {r.description || 'Reference material for your class.'}
                    </p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={{ flex: 1, background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#475569', padding: '8px', borderRadius: 10, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' }}>
                        <Download size={14} /> Download
                      </button>
                      <button style={{ width: 40, background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#475569', padding: '8px', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <ExternalLink size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Deadlines */}
        <div className="resources-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: '#fff', borderRadius: 24, padding: 24, border: '1.5px solid #f1f5f9' }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={16} color="#7c3aed" /> Upcoming Deadlines
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {assignments
                .filter(a => new Date(a.due_date) >= new Date())
                .slice(0, 5)
                .map(a => (
                  <div key={a.id} style={{ display: 'flex', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: '#f5f3ff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#7c3aed' }}>{new Date(a.due_date).getDate()}</span>
                      <span style={{ fontSize: 8, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase' }}>{new Date(a.due_date).toLocaleDateString('en-GH', { month: 'short' })}</span>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</div>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>{a.subject?.name}</div>
                    </div>
                  </div>
                ))}
              {assignments.length === 0 && <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', padding: '20px 0' }}>No upcoming deadlines.</p>}
            </div>
          </div>

          <div style={{ background: '#eff6ff', borderRadius: 24, padding: 24, border: '1.5px solid #dbeafe' }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1e40af', marginBottom: 12 }}>Need Help?</h4>
            <p style={{ fontSize: 12, color: '#3b82f6', fontWeight: 500, lineHeight: 1.6, margin: 0 }}>
              Can't find a resource? Message your subject teacher directly through the **Messages** portal.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
