// src/pages/admin/AnalyticsPage.tsx
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useClasses } from '../../hooks/useClasses'
import { useCurrentTerm, useCurrentAcademicYear } from '../../hooks/useSettings'
import { useAuth } from '../../hooks/useAuth'
import { getGradeInfo, gradeDistribution, calculateAverage, calculatePassRate } from '../../utils/grading'
import { GRADE_SCALE } from '../../constants/grading'
import { ordinal } from '../../lib/utils'

// ── Animated bar ──────────────────────────────────────────
function Bar({ pct, color, delay = 0 }: { pct: number; color: string; delay?: number }) {
  const [w, setW] = useState(0)
  const mounted = useRef(false)
  useEffect(() => {
    if (mounted.current) return
    mounted.current = true
    setTimeout(() => setW(pct), 100 + delay)
  }, [pct, delay])
  return (
    <div style={{ height: 8, background: '#f0eefe', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: w + '%', background: color, borderRadius: 99, transition: 'width 0.9s cubic-bezier(.4,0,.2,1)' }} />
    </div>
  )
}

// ── Animated number ───────────────────────────────────────
function AnimNum({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0)
  const ref = useRef(false)
  useEffect(() => {
    if (ref.current || to === 0) { setVal(to); return }
    ref.current = true
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / 800, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(ease * to))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [to])
  return <>{Number.isInteger(to) ? val.toLocaleString() : val.toFixed(1)}{suffix}</>
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const { data: classes = [] } = useClasses()
  const { data: term } = useCurrentTerm()
  const { data: year } = useCurrentAcademicYear()
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [activeSource, setActiveSource] = useState<'reports' | 'tests' | 'assignments'>('reports')
  const [analytics, setAnalytics] = useState<any>(null)
  const [studentPerformance, setStudentPerformance] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [classFocused, setClassFocused] = useState(false)

  useEffect(() => {
    if (selectedClass && term?.id) loadAnalytics()
    else {
      setAnalytics(null)
      setSelectedStudentId('')
    }
  }, [selectedClass, term?.id, activeSource])

  useEffect(() => {
    if (selectedStudentId && term?.id) loadStudentPerformance()
    else setStudentPerformance(null)
  }, [selectedStudentId, term?.id, activeSource])

  async function loadAnalytics() {
    setLoading(true)
    try {
      let allTotals: number[] = []
      let reports: any[] = []
      let subjectMap: Record<string, number[]> = {}
      let studentMap: Record<string, { id: string, name: string, total: number, max: number, scores: any[] }> = {}

      if (activeSource === 'reports') {
        const [{ data: scores }, { data: repData }] = await Promise.all([
          supabase.from('scores').select('*, subject:subjects(id,name), student:students(id,full_name)').eq('class_id', selectedClass).eq('term_id', term!.id),
          supabase.from('report_cards').select('*, student:students(full_name)').eq('class_id', selectedClass).eq('term_id', term!.id).order('average_score', { ascending: false }),
        ])
        if (!scores) return
        allTotals = scores.map((s: any) => s.total_score ?? 0)
        reports = repData ?? []
        scores.forEach((s: any) => {
          const name = s.subject?.name ?? 'Unknown'
          if (!subjectMap[name]) subjectMap[name] = []
          subjectMap[name].push(s.total_score ?? 0)
        })
      } 
      else if (activeSource === 'tests') {
        const { data: tests } = await supabase.from('class_tests').select('id, max_score, subject:subjects(name)').eq('class_id', selectedClass).eq('term_id', term!.id)
        if (!tests || tests.length === 0) {
          setAnalytics({ empty: true })
          return
        }
        const testIds = tests.map(t => t.id)
        const { data: scores } = await supabase.from('class_test_scores').select('*, student:students(id,full_name)').in('test_id', testIds)
        
        scores?.forEach((s: any) => {
          const test = tests.find(t => t.id === s.test_id)
          const subName = test?.subject?.name || 'Unknown'
          const pct = (s.score_attained / (test?.max_score || 100)) * 100
          allTotals.push(pct)
          if (!subjectMap[subName]) subjectMap[subName] = []
          subjectMap[subName].push(pct)
          
          if (!studentMap[s.student_id]) studentMap[s.student_id] = { id: s.student_id, name: s.student?.full_name, total: 0, max: 0, scores: [] }
          studentMap[s.student_id].total += s.score_attained
          studentMap[s.student_id].max += (test?.max_score || 100)
        })

        reports = Object.values(studentMap).map(s => ({
          student_id: s.id,
          student: { full_name: s.name },
          average_score: (s.total / (s.max || 1)) * 100,
          overall_position: 0, // Calculated later
          total_students: Object.keys(studentMap).length
        })).sort((a, b) => b.average_score - a.average_score)
        reports.forEach((r, idx) => r.overall_position = idx + 1)
      }
      else if (activeSource === 'assignments') {
        const { data: ass } = await supabase.from('assignments').select('id, subject:subjects(name)').eq('class_id', selectedClass).eq('term_id', term!.id)
        if (!ass || ass.length === 0) {
          setAnalytics({ empty: true })
          return
        }
        const assIds = ass.map(a => a.id)
        const { data: subs } = await supabase.from('assignment_submissions').select('*, student:students(id,full_name)').in('assignment_id', assIds)
        
        subs?.forEach((s: any) => {
          const assignment = ass.find(a => a.id === s.assignment_id)
          const subName = assignment?.subject?.name || 'Unknown'
          const pct = (s.score / (s.total_possible || 100)) * 100
          allTotals.push(pct)
          if (!subjectMap[subName]) subjectMap[subName] = []
          subjectMap[subName].push(pct)

          if (!studentMap[s.student_id]) studentMap[s.student_id] = { id: s.student_id, name: s.student?.full_name, total: 0, max: 0, scores: [] }
          studentMap[s.student_id].total += s.score
          studentMap[s.student_id].max += (s.total_possible || 100)
        })
        reports = Object.values(studentMap).map(s => ({
          student_id: s.id,
          student: { full_name: s.name },
          average_score: (s.total / (s.max || 1)) * 100,
          overall_position: 0,
          total_students: Object.keys(studentMap).length
        })).sort((a, b) => b.average_score - a.average_score)
        reports.forEach((r, idx) => r.overall_position = idx + 1)
      }

      const dist = gradeDistribution(allTotals)
      const subjectAverages = Object.entries(subjectMap)
        .map(([name, vals]) => ({ name, average: calculateAverage(vals), count: vals.length }))
        .sort((a, b) => b.average - a.average)

      const excellent = reports.filter(r => r.average_score >= 80).length
      const good = reports.filter(r => r.average_score >= 60 && r.average_score < 80).length
      const poor = reports.filter(r => r.average_score < 50).length

      setAnalytics({
        totalStudents: reports.length,
        classAverage: calculateAverage(allTotals),
        passRate: calculatePassRate(allTotals),
        highestScore: Math.max(...allTotals, 0),
        lowestScore: allTotals.length ? Math.min(...allTotals.filter(x => x > 0)) : 0,
        gradeDistribution: dist,
        subjectAverages,
        topStudents: reports.slice(0, 10),
        excellent, good, poor,
        totalScores: allTotals.length,
      })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function loadStudentPerformance() {
    if (!selectedStudentId || !term?.id) return
    try {
      let data: any[] = []
      if (activeSource === 'reports') {
        const { data: scores } = await supabase.from('scores').select('*, subject:subjects(name)').eq('student_id', selectedStudentId).eq('term_id', term.id)
        data = scores?.map(s => ({ name: s.subject?.name, score: s.total_score })) || []
      } else if (activeSource === 'tests') {
        const { data: tests } = await supabase.from('class_tests').select('id, max_score, subject:subjects(name)').eq('class_id', selectedClass).eq('term_id', term.id)
        const testIds = tests?.map(t => t.id) || []
        const { data: scores } = await supabase.from('class_test_scores').select('*').in('test_id', testIds).eq('student_id', selectedStudentId)
        
        const subMap: Record<string, { total: number, max: number }> = {}
        scores?.forEach(s => {
          const t = tests?.find(x => x.id === s.test_id)
          const name = t?.subject?.name || 'Unknown'
          if (!subMap[name]) subMap[name] = { total: 0, max: 0 }
          subMap[name].total += s.score_attained
          subMap[name].max += (t?.max_score || 100)
        })
        data = Object.entries(subMap).map(([name, val]) => ({ name, score: (val.total / val.max) * 100 }))
      } else if (activeSource === 'assignments') {
        const { data: ass } = await supabase.from('assignments').select('id, subject:subjects(name)').eq('class_id', selectedClass).eq('term_id', term.id)
        const assIds = ass?.map(a => a.id) || []
        const { data: subs } = await supabase.from('assignment_submissions').select('*').in('assignment_id', assIds).eq('student_id', selectedStudentId)

        const subMap: Record<string, { total: number, max: number }> = {}
        subs?.forEach(s => {
          const a = ass?.find(x => x.id === s.assignment_id)
          const name = a?.subject?.name || 'Unknown'
          if (!subMap[name]) subMap[name] = { total: 0, max: 0 }
          subMap[name].total += s.score
          subMap[name].max += (s.total_possible || 100)
        })
        data = Object.entries(subMap).map(([name, val]) => ({ name, score: (val.total / val.max) * 100 }))
      }
      setStudentPerformance(data)
    } catch (e) {
      console.error(e)
    }
  }

  const totalGrades = analytics?.gradeDistribution
    ? Object.values(analytics.gradeDistribution as Record<string, number>).reduce((a: number, b: number) => a + b, 0)
    : 0

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _aspn { to{transform:rotate(360deg)} }
        @keyframes _afadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes _afadeIn { from{opacity:0} to{opacity:1} }
        .an-row:hover { background:#faf5ff !important; }
      `}</style>

      <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif', animation: '_afadeIn 0.4s ease' }}>

        {/* Header */}
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>Analytics</h1>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 3 }}>
              Performance insights · {(term as any)?.name ?? '—'} · {(year as any)?.name ?? '—'}
            </p>
          </div>
        </div>

        {/* Source selector tabs */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, background: '#fff', padding: 4, borderRadius: 12, border: '1.5px solid #f0eefe', width: 'fit-content' }}>
          {[
            { id: 'reports', label: '📊 Official Reports', color: '#6d28d9' },
            { id: 'tests', label: '📝 Class Tests', color: '#dc2626' },
            { id: 'assignments', label: '🤖 Assignments', color: '#0891b2' },
          ].map(tab => (
            <button key={tab.id} onClick={() => { setActiveSource(tab.id as any); setSelectedStudentId(''); }}
              style={{ padding: '8px 16px', borderRadius: 9, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                background: activeSource === tab.id ? tab.color : 'transparent',
                color: activeSource === tab.id ? '#fff' : '#6b7280'
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Class selector */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', border: '1.5px solid #f0eefe', marginBottom: 22, display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 220px' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 5 }}>Select Class</label>
            <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
              onFocus={() => setClassFocused(true)} onBlur={() => setClassFocused(false)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 13, border: `1.5px solid ${classFocused ? '#7c3aed' : '#e5e7eb'}`, boxShadow: classFocused ? '0 0 0 3px rgba(109,40,217,0.1)' : 'none', outline: 'none', background: '#faf5ff', color: '#111827', fontFamily: '"DM Sans",sans-serif', cursor: 'pointer' }}>
              <option value="">Choose a class…</option>
              {(classes as any[]).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {(term as any) && (
            <span style={{ fontSize: 12, fontWeight: 700, background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe', padding: '7px 14px', borderRadius: 99 }}>
              📆 {(term as any).name}
            </span>
          )}
        </div>

        {/* No class */}
        {!selectedClass && !loading && (
          <div style={{ background: '#fff', borderRadius: 16, padding: '60px 20px', textAlign: 'center', border: '1.5px solid #f0eefe' }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>📊</div>
            <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 6 }}>Select a class to view analytics</h3>
            <p style={{ fontSize: 13, color: '#9ca3af' }}>Choose a class above to see detailed performance data.</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #ede9fe', borderTopColor: '#6d28d9', animation: '_aspn 0.8s linear infinite' }} />
            <p style={{ fontSize: 13, color: '#9ca3af' }}>Crunching the numbers…</p>
          </div>
        )}
        {!loading && analytics && analytics.empty && (
          <div style={{ background: '#fff', borderRadius: 16, padding: '60px 20px', textAlign: 'center', border: '1.5px solid #f0eefe' }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🌑</div>
            <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 6 }}>No data found for this source</h3>
            <p style={{ fontSize: 13, color: '#9ca3af' }}>Try selecting a different data source (Reports, Tests, or Assignments).</p>
          </div>
        )}

        {!loading && analytics && !analytics.empty && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: '_afadeIn 0.5s ease' }}>

            {/* KPI cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14 }}>
              {[
                { label: 'Students', value: analytics.totalStudents, icon: '👥', color: '#6d28d9', bg: '#f5f3ff', isInt: true },
                { label: 'Avg Performance', value: analytics.classAverage, icon: '📊', color: '#0891b2', bg: '#ecfeff', suffix: '%', isInt: false },
                { label: 'Pass Rate', value: analytics.passRate, icon: '✅', color: '#16a34a', bg: '#f0fdf4', suffix: '%', isInt: true },
                { label: 'Peak Score', value: analytics.highestScore, icon: '🏆', color: '#d97706', bg: '#fffbeb', suffix: '%', isInt: false },
                { label: 'Low Score', value: analytics.lowestScore, icon: '📉', color: '#dc2626', bg: '#fef2f2', suffix: '%', isInt: false },
              ].map((s, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', border: '1.5px solid #f0eefe', boxShadow: '0 1px 4px rgba(109,40,217,0.06)', animation: `_afadeUp 0.4s ease ${i * 0.07}s both` }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, marginBottom: 8 }}>{s.icon}</div>
                  <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 24, fontWeight: 700, color: s.color, lineHeight: 1 }}>
                    <AnimNum to={s.value} suffix={(s as any).suffix ?? ''} />
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 20 }}>
              {/* Top Students / Drill-down List */}
              <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', overflow: 'hidden', boxShadow: '0 1px 4px rgba(109,40,217,0.06)' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #faf5ff', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>🎖️</span>
                  <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>Student Ranking ({activeSource})</h3>
                </div>
                <div style={{ maxHeight: 600, overflowY: 'auto' }}>
                  {analytics?.topStudents?.map((r: any, i: number) => {
                    const g = getGradeInfo(r.average_score ?? 0)
                    const isSelected = (r.student_id || r.id) === selectedStudentId
                    return (
                      <div key={r.student_id || r.id} 
                        className="an-row"
                        onClick={() => setSelectedStudentId(r.student_id || r.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', borderBottom: '1px solid #faf5ff', cursor: 'pointer', background: isSelected ? '#f5f3ff' : 'transparent' }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, background: '#f1f5f9', color: '#64748b' }}>
                          {i + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: isSelected ? '#7c3aed' : '#111827' }}>{r.student?.full_name || 'Unknown Student'}</div>
                          <div style={{ fontSize: 11, color: '#9ca3af' }}>Performance: {g.label}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 15, fontWeight: 800, color: g.color }}>{(r.average_score ?? 0).toFixed(1)}%</div>
                          <div style={{ fontSize: 10, fontWeight: 800, background: g.color + '14', color: g.color, padding: '1px 6px', borderRadius: 99 }}>{g.grade}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Student Subject Drilling */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                 <div style={{ background: '#fff', borderRadius: 16, padding: '20px', border: '1.5px solid #f0eefe', boxShadow: '0 1px 4px rgba(109,40,217,0.06)', minHeight: 300 }}>
                    {!selectedStudentId ? (
                      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                         <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                         <h4 style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Student Drill-down</h4>
                         <p style={{ fontSize: 12, color: '#9ca3af', maxWidth: 180 }}>Click a student on the left to see their performance in all subjects.</p>
                      </div>
                    ) : (
                      <div style={{ animation: '_afadeIn 0.3s ease' }}>
                        <h4 style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                           <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#7c3aed' }} />
                           Subject Breakdown
                        </h4>
                        {studentPerformance && studentPerformance.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                             {studentPerformance.map((s: any, i: number) => {
                               const g = getGradeInfo(s.score)
                               return (
                                 <div key={i}>
                                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                      <span style={{ fontSize: 12, fontWeight: 600 }}>{s.name}</span>
                                      <span style={{ fontSize: 12, fontWeight: 800, color: g.color }}>{(s.score || 0).toFixed(1)}%</span>
                                   </div>
                                   <Bar pct={s.score || 0} color={g.color} delay={i * 50} />
                                 </div>
                               )
                             })}
                          </div>
                        ) : (
                          <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <p style={{ fontSize: 12, color: '#9ca3af' }}>No subject scores found for this student.</p>
                          </div>
                        )}
                      </div>
                    )}
                 </div>

                 {/* Subject Averages */}
                 <div style={{ background: '#fff', borderRadius: 16, padding: '20px', border: '1.5px solid #f0eefe', boxShadow: '0 1px 4px rgba(109,40,217,0.06)' }}>
                    <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 18 }}>Cohort Subject Averages</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {analytics?.subjectAverages?.map((s: any, i: number) => {
                        const g = getGradeInfo(s.average)
                        return (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</span>
                                <span style={{ fontSize: 12, fontWeight: 800, color: g.color }}>{s.average.toFixed(1)}%</span>
                              </div>
                              <Bar pct={s.average} color={g.color} delay={i * 40} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                 </div>
              </div>
            </div>

            {/* Performance segments & Distribution */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
               <div style={{ background: '#fff', borderRadius: 16, padding: '20px', border: '1.5px solid #f0eefe' }}>
                  <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 16 }}>Performance Segments</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                    {[
                      { label: 'Excellent', value: analytics.excellent, color: '#16a34a', bg: '#f0fdf4' },
                      { label: 'Average', value: analytics.good, color: '#d97706', bg: '#fffbeb' },
                      { label: 'Needs Help', value: analytics.poor, color: '#dc2626', bg: '#fef2f2' },
                    ].map(seg => (
                      <div key={seg.label} style={{ background: seg.bg, borderRadius: 12, padding: '12px', border: `1px solid ${seg.color}20`, textAlign: 'center' }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: seg.color }}>{seg.value}</div>
                        <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 600 }}>{seg.label}</div>
                      </div>
                    ))}
                  </div>
               </div>

               <div style={{ background: '#fff', borderRadius: 16, padding: '20px', border: '1.5px solid #f0eefe' }}>
                  <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 16 }}>Grade Distribution</h3>
                  <div style={{ display: 'flex', gap: 4, height: 40 }}>
                     {GRADE_SCALE.map(g => {
                        const count = (analytics?.gradeDistribution?.[g.grade] ?? 0) as number
                        const pct = totalGrades > 0 ? (count / totalGrades) * 100 : 0
                        return (
                          <div key={g.grade} style={{ flex: pct || 0.1, background: g.color, borderRadius: 4, position: 'relative' }} title={`${g.grade}: ${count}`}>
                             {pct > 10 && <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 10, fontWeight: 900, color: '#fff' }}>{g.grade}</span>}
                          </div>
                        )
                     })}
                  </div>
               </div>
            </div>

          </div>
        )}
      </div>
    </>
  )
}