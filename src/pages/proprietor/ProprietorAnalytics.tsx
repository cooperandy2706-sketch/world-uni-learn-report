import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useCurrentTerm } from '../../hooks/useSettings'
import FlaskLoader from '../../components/ui/FlaskLoader'
import { GraduationCap, TrendingUp, Award, Target } from 'lucide-react'

export default function ProprietorAnalytics() {
  const { user } = useAuth()
  const { data: term } = useCurrentTerm()
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  const [topClasses, setTopClasses] = useState<{name: string, avg: number}[]>([])
  const [passRate, setPassRate] = useState(0)
  const [avgScore, setAvgScore] = useState(0)
  const [enrollment, setEnrollment] = useState(0)
  const [allTerms, setAllTerms] = useState<any[]>([])
  const [selectedTermId, setSelectedTermId] = useState('')

  useEffect(() => { setTimeout(() => setMounted(true), 60) }, [])

  useEffect(() => {
    if (user?.school_id) {
      loadTerms()
      loadEnrollment()
    }
  }, [user?.school_id])

  useEffect(() => {
    if (term?.id && !selectedTermId) setSelectedTermId(term.id)
  }, [term])

  useEffect(() => {
    if (user?.school_id && selectedTermId) {
      loadAnalytics()
    }
  }, [user?.school_id, selectedTermId])

  async function loadTerms() {
    const { data } = await supabase.from('terms').select('*').eq('school_id', user!.school_id).order('start_date', { ascending: false })
    setAllTerms(data || [])
  }

  async function loadEnrollment() {
    const { count } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('school_id', user!.school_id)
    setEnrollment(count || 0)
  }

  async function loadAnalytics() {
    setLoading(true)
    try {
      const sid = user!.school_id
      const tid = selectedTermId

      const { data: reports } = await supabase
        .from('report_cards')
        .select('average_score, class:classes(name)')
        .eq('school_id', sid)
        .eq('term_id', tid)

      if (reports && reports.length > 0) {
        let total = 0
        let passed = 0
        const classMap: Record<string, { sum: number, count: number }> = {}

        reports.forEach(r => {
          const score = Number(r.average_score) || 0
          total += score
          if (score >= 50) passed++

          const cName = (r.class as any)?.name || 'Unknown'
          if (!classMap[cName]) classMap[cName] = { sum: 0, count: 0 }
          classMap[cName].sum += score
          classMap[cName].count++
        })

        setAvgScore(total / reports.length)
        setPassRate(Math.round((passed / reports.length) * 100))

        const classesAvg = Object.entries(classMap).map(([name, d]) => ({
          name, avg: d.sum / d.count
        })).sort((a, b) => b.avg - a.avg).slice(0, 5)

        setTopClasses(classesAvg)
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <FlaskLoader fullScreen={false} label="Loading analytics..." />

  return (
    <>
      <style>{`
        .analytics-wrap {
          font-family: 'Outfit', system-ui, sans-serif;
          opacity: ${mounted ? 1 : 0};
          transition: opacity 0.5s ease;
          max-width: 1440px;
          margin: 0 auto;
          padding: 20px 40px 60px;
        }

        .stat-box {
          background: #fff;
          border-radius: 8px;
          padding: 24px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .stat-icon {
          width: 56px; height: 56px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
        }

        .bar-wrap {
          display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px;
        }

        @media (max-width: 768px) {
          .analytics-wrap { padding: 16px 20px 80px; }
          .stat-box { flex-direction: column; text-align: center; gap: 12px; padding: 20px; }
          .stat-box > div:last-child { display: flex; flex-direction: column; align-items: center; }
        }
      `}</style>
      
      <div className="analytics-wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0, color: '#0f172a' }}>Academic Performance</h1>
          <select 
            value={selectedTermId} 
            onChange={e => setSelectedTermId(e.target.value)}
            style={{ padding: '10px 16px', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 14, fontWeight: 600, outline: 'none', cursor: 'pointer' }}
          >
            {allTerms.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.academic_year})</option>
            ))}
          </select>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 32 }}>
          <div className="stat-box">
            <div className="stat-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
              <GraduationCap size={28} />
            </div>
            <div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{enrollment}</div>
              <div style={{ fontSize: 14, color: '#64748b', fontWeight: 600, marginTop: 4 }}>Total Enrollment</div>
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>
              <Target size={28} />
            </div>
            <div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{avgScore.toFixed(1)}%</div>
              <div style={{ fontSize: 14, color: '#64748b', fontWeight: 600, marginTop: 4 }}>School Average Score</div>
            </div>
          </div>
          
          <div className="stat-box">
            <div className="stat-icon" style={{ background: '#ecfdf5', color: '#10b981' }}>
              <TrendingUp size={28} />
            </div>
            <div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{passRate}%</div>
              <div style={{ fontSize: 14, color: '#64748b', fontWeight: 600, marginTop: 4 }}>Overall Pass Rate</div>
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 32, border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 24px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Award color="#f59e0b" /> Top Performing Classes
          </h3>
          
          {topClasses.length === 0 ? (
            <p style={{ color: '#94a3b8' }}>No report card data found for the current term.</p>
          ) : (
            <div>
              {topClasses.map((c, i) => (
                <div key={i} className="bar-wrap">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 600 }}>
                    <span style={{ color: '#334155' }}>{c.name}</span>
                    <span style={{ color: '#0f172a' }}>{c.avg.toFixed(1)}%</span>
                  </div>
                  <div style={{ height: 12, background: '#f1f5f9', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${c.avg}%`, background: 'linear-gradient(90deg, #8b5cf6, #c084fc)', borderRadius: 6 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
