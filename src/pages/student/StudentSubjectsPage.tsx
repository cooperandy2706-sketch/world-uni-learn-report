import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

const SUBJECT_META: Record<string, { icon: string; color: string; bg: string; category: string }> = {
  'mathematics':   { icon: '📐', color: '#2563eb', bg: '#eff6ff',  category: 'STEM' },
  'math':          { icon: '📐', color: '#2563eb', bg: '#eff6ff',  category: 'STEM' },
  'english':       { icon: '📖', color: '#7c3aed', bg: '#f5f3ff',  category: 'Language' },
  'science':       { icon: '🔬', color: '#0891b2', bg: '#ecfeff',  category: 'STEM' },
  'social':        { icon: '🌍', color: '#16a34a', bg: '#f0fdf4',  category: 'Humanities' },
  'ict':           { icon: '💻', color: '#6d28d9', bg: '#f5f3ff',  category: 'STEM' },
  'french':        { icon: '🗼', color: '#db2777', bg: '#fdf2f8',  category: 'Language' },
  'religious':     { icon: '✝️',  color: '#d97706', bg: '#fffbeb',  category: 'Humanities' },
  'creative':      { icon: '🎨', color: '#ec4899', bg: '#fdf2f8',  category: 'Arts' },
  'arts':          { icon: '🎨', color: '#ec4899', bg: '#fdf2f8',  category: 'Arts' },
  'physical':      { icon: '⚽', color: '#16a34a', bg: '#f0fdf4',  category: 'Physical' },
  'history':       { icon: '📜', color: '#92400e', bg: '#fffbeb',  category: 'Humanities' },
  'geography':     { icon: '🗺️',  color: '#065f46', bg: '#ecfdf5', category: 'Humanities' },
  'music':         { icon: '🎵', color: '#7c3aed', bg: '#f5f3ff',  category: 'Arts' },
  'computing':     { icon: '🖥️',  color: '#1d4ed8', bg: '#eff6ff', category: 'STEM' },
  'biology':       { icon: '🧬', color: '#16a34a', bg: '#f0fdf4',  category: 'STEM' },
  'chemistry':     { icon: '⚗️',  color: '#dc2626', bg: '#fef2f2', category: 'STEM' },
  'physics':       { icon: '⚛️',  color: '#2563eb', bg: '#eff6ff', category: 'STEM' },
}

function getSubjectMeta(name: string) {
  const lower = name.toLowerCase()
  for (const [key, meta] of Object.entries(SUBJECT_META)) {
    if (lower.includes(key)) return meta
  }
  return { icon: '📚', color: '#6b7280', bg: '#f9fafb', category: 'General' }
}

export default function StudentSubjectsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [subjects, setSubjects] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) loadSubjects()
  }, [user?.id, user?.school_id])

  async function loadSubjects() {
    setIsLoading(true)
    try {
      const { data } = await supabase
        .from('subjects')
        .select('*')
        .is('school_id', null)
        .order('name')
      
      setSubjects(data ?? [])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const categorized = useMemo(() => {
    const groups: Record<string, typeof subjects> = {}
    subjects.forEach(s => {
      const cat = getSubjectMeta(s.name).category
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(s)
    })
    return groups
  }, [subjects])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .sub-card { background: #fff; border-radius: 20px; padding: 24px; border: 1.5px solid #f0eefe; transition: all 0.3s cubic-bezier(.4, 0, .2, 1); cursor: pointer; position: relative; overflow: hidden; }
        .sub-card:hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(109,40,217,0.12); border-color: #ddd6fe; }
        .sub-card:hover .icon-bounce { transform: scale(1.1) rotate(-5deg); }

        @media (max-width: 640px) {
          .subjects-header h1 { font-size: 24px !important; }
          .subjects-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
          .sub-card { padding: 20px !important; }
        }
      `}</style>

      <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif' }}>
        <div className="subjects-header" style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 28, fontWeight: 700, color: '#111827', margin: 0 }}>Discover Library 📚</h1>
          <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>Explore study materials, global challenges, and interactive resources by subject.</p>
        </div>

        {isLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Loading subjects...</div>
        ) : subjects.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 16, padding: '80px 20px', textAlign: 'center', border: '1.5px solid #f0eefe' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏫</div>
            <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 6 }}>No Subjects Found</h3>
            <p style={{ fontSize: 13, color: '#9ca3af' }}>Your school has not configured any subjects yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {Object.entries(categorized).map(([category, catSubjects]) => (
              <div key={category}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                   <div style={{ fontSize: 13, fontWeight: 800, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                     {category}
                   </div>
                   <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg, #ede9fe, transparent)' }} />
                </div>

                <div className="subjects-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                  {catSubjects.map((s, i) => {
                    const meta = getSubjectMeta(s.name)
                    return (
                      <div key={s.id} className="sub-card"
                        onClick={() => navigate(`/student/subjects/${s.id}`)}
                        style={{ animation: `_fadeUp 0.4s ease ${i * 0.05}s both` }}>
                        
                        {/* Background Watermark */}
                        <div style={{ position: 'absolute', bottom: -10, right: -10, fontSize: 80, opacity: 0.04, pointerEvents: 'none', transform: 'rotate(-10deg)', transition: 'transform 0.4s' }}>
                          {meta.icon}
                        </div>

                        <div className="icon-bounce" style={{ width: 50, height: 50, borderRadius: 14, background: meta.bg, border: `1.5px solid ${meta.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 16, transition: 'all 0.3s' }}>
                          {meta.icon}
                        </div>

                        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 4px 0' }}>{s.name}</h3>
                        {s.code && <div style={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace', color: meta.color }}>{s.code}</div>}

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px dashed ${meta.color}30`, marginTop: 16, paddingTop: 16 }}>
                           <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280' }}>Explore Resources</span>
                           <span style={{ fontSize: 14, color: meta.color }}>➔</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
