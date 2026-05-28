import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import FlaskLoader from '../../components/ui/FlaskLoader'

export default function ProprietorStudents() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  const [studentStats, setStudentStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    byClass: [] as { name: string, count: number }[]
  })

  useEffect(() => { setTimeout(() => setMounted(true), 60) }, [])

  useEffect(() => {
    if (!user?.school_id) return
    loadStudents()
  }, [user?.school_id])

  async function loadStudents() {
    const sid = user!.school_id
    try {
      const { data: students } = await supabase
        .from('students')
        .select('is_active, class:classes(name)')
        .eq('school_id', sid)

      if (students) {
        let active = 0
        const classMap: Record<string, number> = {}

        students.forEach(s => {
          if (s.is_active) active++
          const cName = (s.class as any)?.name || 'Unassigned'
          classMap[cName] = (classMap[cName] || 0) + 1
        })

        const byClass = Object.entries(classMap)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)

        setStudentStats({
          total: students.length,
          active,
          inactive: students.length - active,
          byClass
        })
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <FlaskLoader fullScreen={false} label="Loading student demographics..." />

  return (
    <>
      <style>{`
        .students-wrap {
          font-family: 'Outfit', system-ui, sans-serif;
          opacity: ${mounted ? 1 : 0};
          transition: opacity 0.5s ease;
          max-width: 1440px;
          margin: 0 auto;
          padding: 20px 40px 60px;
        }

        @media (max-width: 768px) {
          .students-wrap { padding: 16px 20px 80px; }
          .students-wrap > div:last-child { padding: 20px !important; }
        }
      `}</style>

      <div className="students-wrap">
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 32px', color: '#0f172a' }}>Student Demographics</h1>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginBottom: 32 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid #e2e8f0', borderRadius: 8, padding: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Students</div>
            <div style={{ fontSize: 42, fontWeight: 800, color: '#0f172a', margin: '8px 0 0' }}>{studentStats.total}</div>
          </div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid #e2e8f0', borderRadius: 8, padding: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Enrollment</div>
            <div style={{ fontSize: 42, fontWeight: 800, color: '#10b981', margin: '8px 0 0' }}>{studentStats.active}</div>
          </div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid #e2e8f0', borderRadius: 8, padding: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Inactive / Alumni</div>
            <div style={{ fontSize: 42, fontWeight: 800, color: '#94a3b8', margin: '8px 0 0' }}>{studentStats.inactive}</div>
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid #e2e8f0', padding: 32 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 24px' }}>Distribution by Class</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {studentStats.byClass.map(c => (
              <div key={c.name} style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: 8, border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: 14, color: '#475569', fontWeight: 600, marginBottom: 4 }}>{c.name}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>{c.count}</div>
              </div>
            ))}
            {studentStats.byClass.length === 0 && <p style={{ color: '#94a3b8' }}>No classes found.</p>}
          </div>
        </div>
      </div>
    </>
  )
}
