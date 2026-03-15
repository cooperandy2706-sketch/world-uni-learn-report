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
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [classFocused, setClassFocused] = useState(false)

  useEffect(() => {
    if (selectedClass && term?.id) loadAnalytics()
    else setAnalytics(null)
  }, [selectedClass, term?.id])

  async function loadAnalytics() {
    setLoading(true)
    try {
      const [{ data: scores }, { data: reports }] = await Promise.all([
        supabase.from('scores').select('*, subject:subjects(id,name), student:students(id,full_name)').eq('class_id', selectedClass).eq('term_id', term!.id),
        supabase.from('report_cards').select('*, student:students(full_name)').eq('class_id', selectedClass).eq('term_id', term!.id).order('average_score', { ascending: false }),
      ])

      if (!scores) return
      const allTotals = scores.map((s: any) => s.total_score ?? 0)
      const dist = gradeDistribution(allTotals)

      const subjectMap: Record<string, number[]> = {}
      scores.forEach((s: any) => {
        const name = s.subject?.name ?? 'Unknown'
        if (!subjectMap[name]) subjectMap[name] = []
        subjectMap[name].push(s.total_score ?? 0)
      })
      const subjectAverages = Object.entries(subjectMap)
        .map(([name, vals]) => ({ name, average: calculateAverage(vals), count: vals.length }))
        .sort((a, b) => b.average - a.average)

      // Student performance groups
      const excellent = allTotals.filter(s => s >= 80).length
      const good = allTotals.filter(s => s >= 60 && s < 80).length
      const poor = allTotals.filter(s => s < 50).length

      setAnalytics({
        totalStudents: reports?.length ?? 0,
        classAverage: calculateAverage(allTotals),
        passRate: calculatePassRate(allTotals),
        highestScore: Math.max(...allTotals, 0),
        lowestScore: allTotals.length ? Math.min(...allTotals.filter(x => x > 0)) : 0,
        gradeDistribution: dist,
        subjectAverages,
        topStudents: (reports ?? []).slice(0, 6),
        excellent, good, poor,
        totalScores: allTotals.length,
      })
    } finally {
      setLoading(false)
    }
  }

  const totalGrades = analytics
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

        {/* Class selector */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', border: '1.5px solid #f0eefe', marginBottom: 22, display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 220px' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 5 }}>Select Class to Analyse</label>
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

        {/* Analytics content */}
        {!loading && analytics && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: '_afadeIn 0.5s ease' }}>

            {/* KPI cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14 }}>
              {[
                { label: 'Students', value: analytics.totalStudents, icon: '👥', color: '#6d28d9', bg: '#f5f3ff', isInt: true },
                { label: 'Class Average', value: analytics.classAverage, icon: '📊', color: '#0891b2', bg: '#ecfeff', suffix: '%', isInt: false },
                { label: 'Pass Rate', value: analytics.passRate, icon: '✅', color: '#16a34a', bg: '#f0fdf4', suffix: '%', isInt: true },
                { label: 'Highest Score', value: analytics.highestScore, icon: '🏆', color: '#d97706', bg: '#fffbeb', suffix: '%', isInt: false },
                { label: 'Lowest Score', value: analytics.lowestScore, icon: '📉', color: '#dc2626', bg: '#fef2f2', suffix: '%', isInt: false },
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

            {/* Performance segments */}
            <div style={{ background: '#fff', borderRadius: 16, padding: '20px', border: '1.5px solid #f0eefe', boxShadow: '0 1px 4px rgba(109,40,217,0.06)', animation: '_afadeUp 0.4s ease 0.2s both' }}>
              <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 16 }}>Performance Segments</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                {[
                  { label: 'Excellent (80+)', value: analytics.excellent, color: '#16a34a', bg: '#f0fdf4', icon: '🌟' },
                  { label: 'Average (60–79)', value: analytics.good, color: '#d97706', bg: '#fffbeb', icon: '👍' },
                  { label: 'Needs Help (<50)', value: analytics.poor, color: '#dc2626', bg: '#fef2f2', icon: '⚠️' },
                ].map(seg => {
                  const pct = analytics.totalScores > 0 ? Math.round((seg.value / analytics.totalStudents) * 100) : 0
                  return (
                    <div key={seg.label} style={{ background: seg.bg, borderRadius: 12, padding: '14px 16px', border: `1px solid ${seg.color}30` }}>
                      <div style={{ fontSize: 22, marginBottom: 6 }}>{seg.icon}</div>
                      <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 22, fontWeight: 700, color: seg.color }}>{seg.value}</div>
                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{seg.label}</div>
                      <div style={{ marginTop: 8, height: 5, background: seg.color + '25', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: pct + '%', background: seg.color, borderRadius: 99, transition: 'width 0.9s ease' }} />
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: seg.color, marginTop: 3 }}>{pct}% of class</div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

              {/* Grade Distribution */}
              <div style={{ background: '#fff', borderRadius: 16, padding: '20px', border: '1.5px solid #f0eefe', boxShadow: '0 1px 4px rgba(109,40,217,0.06)', animation: '_afadeUp 0.4s ease 0.3s both' }}>
                <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 18 }}>Grade Distribution</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {GRADE_SCALE.map(g => {
                    const count = (analytics.gradeDistribution[g.grade] ?? 0) as number
                    const pct = totalGrades > 0 ? (count / totalGrades) * 100 : 0
                    return (
                      <div key={g.grade} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 9, background: g.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: g.color, flexShrink: 0 }}>{g.grade}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{g.label}</span>
                            <span style={{ fontSize: 12, color: '#6b7280' }}>{count} ({pct.toFixed(0)}%)</span>
                          </div>
                          <Bar pct={pct} color={g.color} delay={GRADE_SCALE.indexOf(g) * 80} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Subject Averages */}
              <div style={{ background: '#fff', borderRadius: 16, padding: '20px', border: '1.5px solid #f0eefe', boxShadow: '0 1px 4px rgba(109,40,217,0.06)', animation: '_afadeUp 0.4s ease 0.35s both' }}>
                <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 18 }}>Subject Averages</h3>
                {analytics.subjectAverages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 0' }}>
                    <p style={{ fontSize: 13, color: '#9ca3af' }}>No scores entered yet.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {analytics.subjectAverages.map((s: any, i: number) => {
                      const g = getGradeInfo(s.average)
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                              <span style={{ fontSize: 12, fontWeight: 800, color: g.color, flexShrink: 0, marginLeft: 8 }}>{s.average.toFixed(1)}%</span>
                            </div>
                            <Bar pct={s.average} color={g.color} delay={i * 60} />
                          </div>
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: g.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: g.color, flexShrink: 0 }}>{g.grade}</div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Top Students */}
            {analytics.topStudents.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', overflow: 'hidden', boxShadow: '0 1px 4px rgba(109,40,217,0.06)', animation: '_afadeUp 0.4s ease 0.4s both' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #faf5ff', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>🏆</span>
                  <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>Top Students</h3>
                  <span style={{ fontSize: 11, fontWeight: 700, background: '#f5f3ff', color: '#6d28d9', padding: '2px 8px', borderRadius: 99 }}>{analytics.topStudents.length} shown</span>
                </div>
                <div>
                  {analytics.topStudents.map((r: any, i: number) => {
                    const g = getGradeInfo(r.average_score ?? 0)
                    const medals = ['🥇', '🥈', '🥉']
                    return (
                      <div key={r.id} className="an-row"
                        style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', borderBottom: i < analytics.topStudents.length - 1 ? '1px solid #faf5ff' : 'none', transition: 'background 0.12s' }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: i < 3 ? 18 : 12, fontWeight: 800, background: i < 3 ? 'transparent' : '#f5f3ff', color: '#6d28d9', flexShrink: 0 }}>
                          {i < 3 ? medals[i] : `#${i + 1}`}
                        </div>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                          {r.student?.full_name?.charAt(0)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.student?.full_name}</div>
                          <div style={{ fontSize: 11, color: '#9ca3af' }}>{ordinal(r.overall_position ?? 0)} of {r.total_students}</div>
                        </div>
                        {/* Mini bar */}
                        <div style={{ width: 100, flexShrink: 0 }}>
                          <div style={{ height: 5, background: '#f0eefe', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: (r.average_score ?? 0) + '%', background: g.color, borderRadius: 99, transition: 'width 0.9s ease' }} />
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 60 }}>
                          <div style={{ fontSize: 15, fontWeight: 800, color: g.color }}>{(r.average_score ?? 0).toFixed(1)}%</div>
                          <div style={{ fontSize: 11, fontWeight: 700, background: g.color + '18', color: g.color, padding: '1px 6px', borderRadius: 99, display: 'inline-block' }}>{g.grade}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}