import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import FlaskLoader from '../../components/ui/FlaskLoader'
import { useAutoRefresh } from "../../hooks/useAutoRefresh";
import { useProprietorScope } from '../../hooks/useProprietorScope'
import ProprietorBranchSelector from './ProprietorBranchSelector'

export default function ProprietorStudents() {
    useAutoRefresh(loadStudents);
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const { activeSchoolIds } = useProprietorScope()

  const [studentStats, setStudentStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    byClass: [] as { name: string, count: number }[]
  })

  useEffect(() => { setTimeout(() => setMounted(true), 60) }, [])

  useEffect(() => {
    if (activeSchoolIds.length === 0) return
    loadStudents()
  }, [activeSchoolIds])

  async function loadStudents() {
    try {
      const { data: students } = await supabase
        .from('students')
        .select('is_active, class:classes(name)')
        .in('school_id', activeSchoolIds)

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
          font-family: 'DM Sans', system-ui, sans-serif;
          opacity: ${mounted ? 1 : 0};
          transition: opacity 0.5s ease;
          max-width: 1440px;
          margin: 0 auto;
          padding: 16px 12px 80px;
          min-height: 100vh;
          min-height: 100dvh;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: var(--bg-card);
          border-top: 1px solid #e2e8f0;
          border-bottom: 1px solid #e2e8f0;
          border-radius: 0;
          margin: 0 -12px;
          padding: 24px;
        }

        .dist-card {
          background: var(--bg-card);
          border-radius: 0;
          border-top: 1px solid #e2e8f0;
          border-bottom: 1px solid #e2e8f0;
          margin: 0 -12px;
          padding: 24px;
        }

        @media (min-width: 641px) {
          .students-wrap { padding: 20px 40px 60px; }
          .stat-card { border: 1px solid #e2e8f0; border-radius: 8px; margin: 0; }
          .dist-card { border-radius: 12px; border: 1px solid #e2e8f0; margin: 0; padding: 32px; }
        }

        @media (min-width: 768px) {
          .stats-grid { grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; }
        }
      `}</style>

      <div className="students-wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, color: '#0f172a' }}>Student Demographics</h1>
          <ProprietorBranchSelector />
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div style={{ fontSize: 14, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Students</div>
            <div style={{ fontSize: 42, fontWeight: 900, color: '#0f172a', margin: '8px 0 0', letterSpacing: '-0.02em' }}>{studentStats.total}</div>
          </div>
          <div className="stat-card">
            <div style={{ fontSize: 14, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Enrollment</div>
            <div style={{ fontSize: 42, fontWeight: 900, color: '#10b981', margin: '8px 0 0', letterSpacing: '-0.02em' }}>{studentStats.active}</div>
          </div>
          <div className="stat-card">
            <div style={{ fontSize: 14, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Inactive / Alumni</div>
            <div style={{ fontSize: 42, fontWeight: 900, color: '#94a3b8', margin: '8px 0 0', letterSpacing: '-0.02em' }}>{studentStats.inactive}</div>
          </div>
        </div>

        <div className="dist-card">
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
