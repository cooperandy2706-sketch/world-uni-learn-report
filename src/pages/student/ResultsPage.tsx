// src/pages/student/ResultsPage.tsx
// Student results portal — term scores, subject breakdown, report card, position
import { useState, useEffect, Fragment, useMemo } from 'react'

import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { useCurrentTerm, useCurrentAcademicYear } from '../../hooks/useSettings'
import { getGradeInfo } from '../../utils/grading'
import { ROUTES } from '../../constants/routes'
import { ordinal } from '../../lib/utils'


function timeAgo(ts: string) {
  const d = Math.floor((Date.now() - new Date(ts).getTime()) / 86400000)
  return d === 0 ? 'Today' : d === 1 ? 'Yesterday' : `${d} days ago`
}

export default function StudentResultsPage() {
  const { user } = useAuth()
  const { data: term } = useCurrentTerm()
  const { data: year } = useCurrentAcademicYear()

  const [studentData, setStudentData] = useState<any>(null)
  const [reportCard, setReportCard] = useState<any>(null)
  const [scores, setScores] = useState<any[]>([])
  const [allHistoricalScores, setAllHistoricalScores] = useState<any[]>([])
  const [allSubmissions, setAllSubmissions] = useState<any[]>([])
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(null)
  const [classSize, setClassSize] = useState<number | null>(null)
  const [allTerms, setAllTerms] = useState<any[]>([])
  const [selectedTermId, setSelectedTermId] = useState<string>('')



  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setTimeout(() => setMounted(true), 60) }, [])
  useEffect(() => { if (user?.id) loadStudent() }, [user?.id])
  useEffect(() => {
    if (selectedTermId && studentData) {
      setExpandedSubjectId(null)
      loadResults(selectedTermId)
    }
  }, [selectedTermId, studentData])



  async function loadStudent() {
    const { data: student } = await supabase.from('students').select('*, class:classes(name), school:schools(name)').eq('user_id', user!.id).single()
    if (!student) { setLoading(false); return }
    setStudentData(student)

    const [termsRes, scoresRes] = await Promise.all([
      supabase.from('terms').select('*, academic_year:academic_years(name)').eq('school_id', student.school_id).order('created_at', { ascending: false }),
      supabase.from('scores').select('total_score, term_id').eq('student_id', student.id)
    ])

    const terms = termsRes.data ?? []
    setAllTerms(terms)
    setAllHistoricalScores(scoresRes.data ?? [])

    const tid = term?.id ?? terms?.[0]?.id ?? ''
    setSelectedTermId(tid)
  }


  async function loadResults(termId: string) {
    if (!studentData) return
    setLoading(true)
    try {
      const [reportRes, scoresRes, submissionsRes, classCountRes] = await Promise.all([
        supabase.from('report_cards').select('*').eq('student_id', studentData.id).eq('term_id', termId).eq('is_approved', true).maybeSingle(),
        supabase.from('scores').select('total_score,grade,class_score,exam_score,subject:subjects(id,name)').eq('student_id', studentData.id).eq('term_id', termId).eq('is_submitted', true),
        supabase
          .from('assignment_submissions')
          .select('*, assignment:assignments!inner(title, subject_id, term_id)')
          .eq('student_id', studentData.id)
          .eq('assignment.term_id', termId),
        supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('class_id', studentData.class_id)
          .eq('is_active', true)
      ])

      if (reportRes.error && reportRes.error.code !== 'PGRST116') console.error('Report error:', reportRes.error)
      if (scoresRes.error) console.error('Scores error:', scoresRes.error)
      if (submissionsRes.error) console.error('Submissions error:', submissionsRes.error)

      setReportCard(reportRes.data)
      setScores((scoresRes.data ?? []).sort((a: any, b: any) => (b.total_score ?? 0) - (a.total_score ?? 0)))
      setAllSubmissions(submissionsRes.data ?? [])
      setClassSize(classCountRes.count)
    } catch (err) {
      console.error('Failed to load results:', err)
    } finally {
      setLoading(false)
    }
  }

  const avg = reportCard?.average_score ?? (scores.length ? scores.reduce((s, x) => s + (x.total_score ?? 0), 0) / scores.length : null)
  const gradeInfo = avg != null ? getGradeInfo(avg) : null
  const selectedTerm = allTerms.find((t: any) => t.id === selectedTermId)

  const totalOutstanding = (Number(studentData?.fees_arrears ?? 0) + (studentData?.other_fees ?? []).reduce((s: number, f: any) => s + Math.max(0, Number(f.amount) - Number(f.paid ?? 0)), 0))
  const isFinancialHold = totalOutstanding > 0

  const isProvisional = !reportCard && scores.length > 0
  const displayPosition = reportCard?.overall_position ? ordinal(reportCard.overall_position) : '—'
  const displayTotal = reportCard?.total_students ?? classSize ?? '—'

  // Trend Analysis
  const historicalAverages = useMemo(() => {
    const map: Record<string, number> = {}
    allHistoricalScores.forEach(s => {
      if (!map[s.term_id]) map[s.term_id] = 0
      map[s.term_id] += s.total_score || 0
    })
    // Group and average
    const termCounts: Record<string, number> = {}
    allHistoricalScores.forEach(s => termCounts[s.term_id] = (termCounts[s.term_id] || 0) + 1)
    
    const avgs = Object.keys(map).map(tid => ({
      tid,
      avg: map[tid] / termCounts[tid],
      date: allTerms.find(t => t.id === tid)?.created_at || ''
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return avgs
  }, [allHistoricalScores, allTerms])

  const currentIdx = historicalAverages.findIndex(h => h.tid === selectedTermId)
  const prevAvg = currentIdx > 0 ? historicalAverages[currentIdx - 1].avg : null
  const trend = !prevAvg || !avg ? 'stable' : avg > prevAvg + 1 ? 'improving' : avg < prevAvg - 1 ? 'declining' : 'stable'

  // Recommendations Logic
  const getActionPlan = () => {
    if (avg === null) return []
    const plans = []
    if (avg >= 85) {
      plans.push({ title: 'Peer Leadership', desc: 'Capable of leading subject study groups.', icon: '🌟', color: '#10b981' })
      plans.push({ title: 'Advanced Enrichment', desc: 'Ready for external competitions.', icon: '🚀', color: '#6d28d9' })
    } else if (avg >= 70) {
      plans.push({ title: 'Consistent Study', desc: 'Maintain current habits for Gold Honor Roll.', icon: '📚', color: '#7c3aed' })
    } else if (avg >= 50) {
      plans.push({ title: 'Teacher Consultation', desc: 'Schedule a check-in to bridge knowledge gaps.', icon: '👩‍🏫', color: '#f59e0b' })
      plans.push({ title: 'Parent Review', desc: 'Discuss performance bottlenecks at home.', icon: '🏠', color: '#3b82f6' })
    } else {
      plans.push({ title: 'URGENT: Parent Meeting', desc: 'Immediate intervention required with school admin.', icon: '☎️', color: '#dc2626' })
      plans.push({ title: 'Remedial Support', desc: 'Enrollment in after-school support is mandatory.', icon: '🧩', color: '#ef4444' })
    }
    return plans
  }
  const actionPlans = getActionPlan()



  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _rfade{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes _rspin{to{transform:rotate(360deg)}}
        .rr-card{transition:all .2s} .rr-card:hover{box-shadow:0 6px 20px rgba(109,40,217,.1)!important;transform:translateY(-2px)!important}
        .rr-row:hover{background:#faf5ff!important} .rr-row{transition:background .12s}
        @media (max-width: 768px) {
          .rr-main-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
          .rr-header { flex-direction: column !important; align-items: stretch !important; }
          .rr-table-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }
          .rr-table { min-width: 480px; }
        }
      `}</style>
      <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif', opacity: mounted ? 1 : 0, transition: 'opacity .4s ease' }}>

        {/* Header */}
        <div className="rr-header" style={{ marginBottom: 22, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, animation: '_rfade .5s ease both' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>My Academic Results</h1>
              {isProvisional && (
                 <span style={{ fontSize: 10, fontWeight: 800, background: '#fef2f2', color: '#dc2626', padding: '4px 10px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: '.05em', border: '1px solid #fecaca' }}>
                   Real-time / Provisional
                 </span>
              )}
            </div>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 3 }}>{studentData?.class?.name ?? '—'} · {studentData?.school?.name ?? '—'}</p>
          </div>
          <Link to={ROUTES.STUDENT_DASHBOARD} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: '#fff', color: '#374151', textDecoration: 'none', border: '1.5px solid #e5e7eb' }}>← Dashboard</Link>
        </div>

        {/* Term selector */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '14px 18px', border: '1.5px solid #f0eefe', marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', animation: '_rfade .5s ease .05s both' }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.06em' }}>View Term:</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {allTerms.map((t: any) => (
              <button key={t.id} onClick={() => setSelectedTermId(t.id)}
                style={{ padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .15s', border: `1.5px solid ${t.id === selectedTermId ? '#6d28d9' : '#e5e7eb'}`, background: t.id === selectedTermId ? '#f5f3ff' : '#fff', color: t.id === selectedTermId ? '#6d28d9' : '#6b7280' }}>
                {t.name} <span style={{ fontSize: 10, opacity: .7 }}>· {t.academic_year?.name}</span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #ede9fe', borderTopColor: '#6d28d9', animation: '_rspin .8s linear infinite' }} />
            <p style={{ fontSize: 13, color: '#9ca3af' }}>Loading results…</p>
          </div>
        ) : !studentData ? (
            <div style={{ padding: '80px 20px', textAlign: 'center', background: '#fff', borderRadius: 20, border: '1.5px solid #f0eefe' }}>
               <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
               <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>Student record not found</h3>
            </div>
        ) : (
          <>
            {/* Summary Analytics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24, filter: isFinancialHold ? 'blur(10px)' : 'none', pointerEvents: isFinancialHold ? 'none' : 'auto', transition: 'all 0.3s' }}>
              {[
                { 
                  label: 'Average Score', 
                  value: avg != null ? `${avg.toFixed(1)}%` : '—', 
                  color: gradeInfo?.color ?? '#6d28d9', 
                  icon: '📈',
                  sub: trend === 'improving' ? '↗ Improving from last term' : trend === 'declining' ? '↘ Declining from last term' : '→ Stable performance'
                },
                { 
                  label: 'Overall Rank', 
                  value: `${displayPosition} / ${displayTotal}`, 
                  color: '#7c3aed', 
                  icon: '🏆',
                  sub: reportCard ? 'Generated by Admin' : 'Provisional Standing'
                },
                { 
                  label: 'Growth Rate', 
                  value: prevAvg ? `${(avg! - prevAvg).toFixed(1)}%` : 'New', 
                  color: trend === 'improving' ? '#10b981' : trend === 'declining' ? '#ef4444' : '#6b7280', 
                  icon: '🔥',
                  sub: 'Variance vs previous term'
                },
                { 
                  label: 'Attendance', 
                  value: reportCard?.attendance_percent ? `${reportCard.attendance_percent}%` : '—', 
                  color: '#10b981', 
                  icon: '✅',
                  sub: 'Term presence rate'
                },
              ].map(stat => (
                <div key={stat.label} style={{ background: '#fff', padding: '20px', borderRadius: 20, border: '1.5px solid #f0eefe', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: stat.color + '12', color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                      {stat.icon}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.05em' }}>{stat.label}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#111827' }}>{stat.value}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, fontWeight: 500 }}>{stat.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rr-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, animation: '_rfade .5s ease .15s both' }}>
              
              {/* Left Column: Subject Analysis */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ background: '#fff', borderRadius: 24, border: '1.5px solid #f0eefe', overflow: 'hidden', boxShadow: '0 4px 20px rgba(109,40,217,.04)' }}>
                  <div style={{ padding: '20px 24px', borderBottom: '1px solid #faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 18 }}>📊</span>
                      <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>Subject Mastery</h3>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#6d28d9', background: '#f5f3ff', padding: '4px 12px', borderRadius: 99 }}>{scores.length} Subjects Analyzed</span>
                  </div>

                  {scores.length === 0 ? (
                    <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                      <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
                      <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 6 }}>No Data Recorded</h3>
                      <p style={{ fontSize: 13, color: '#9ca3af' }}>Scores for this term haven't been synchronized yet.</p>
                    </div>
                  ) : (
                  <div style={{ padding: '12px', filter: isFinancialHold ? 'blur(15px)' : 'none', pointerEvents: isFinancialHold ? 'none' : 'auto', transition: 'all 0.3s' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                        {scores.map((s: any, i: number) => {
                          const g = getGradeInfo(s.total_score ?? 0)
                          const isExpanded = expandedSubjectId === s.subject?.id
                          const subjectSubmissions = allSubmissions.filter(sub => sub.assignment?.subject_id === s.subject?.id)
                          
                          return (
                            <div key={i} style={{ 
                              background: isExpanded ? '#fafaff' : '#fff', 
                              borderRadius: 16, 
                              border: `1.5px solid ${isExpanded ? '#ddd6fe' : '#f0eefe'}`, 
                              padding: '16px',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              transform: isExpanded ? 'scale(1.01)' : 'scale(1)'
                            }} onClick={() => setExpandedSubjectId(isExpanded ? null : s.subject?.id)}>
                              
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                <div>
                                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{s.subject?.name}</div>
                                  <div style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.05em', marginTop: 2 }}>Analysis Category</div>
                                </div>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: g.color + '12', color: g.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800 }}>
                                  {g.grade}
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${s.total_score ?? 0}%`, background: g.color, borderRadius: 99 }} />
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 800, color: '#1e293b' }}>{(s.total_score ?? 0).toFixed(1)}%</span>
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <div style={{ background: '#f8fafc', padding: '6px 10px', borderRadius: 8 }}>
                                  <div style={{ fontSize: 9, color: '#9ca3af', textTransform: 'uppercase' }}>Class Score</div>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>{s.class_score != null ? `${s.class_score.toFixed(1)}%` : '—'}</div>
                                </div>
                                <div style={{ background: '#f8fafc', padding: '6px 10px', borderRadius: 8 }}>
                                  <div style={{ fontSize: 9, color: '#9ca3af', textTransform: 'uppercase' }}>Exam Score</div>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>{s.exam_score != null ? `${s.exam_score.toFixed(1)}%` : '—'}</div>
                                </div>
                              </div>

                              {isExpanded && (
                                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                                  <div style={{ fontSize: 10, fontWeight: 700, color: '#6d28d9', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <span>📑</span> INDIVIDUAL TASK PERFORMANCE
                                  </div>
                                  {subjectSubmissions.length === 0 ? (
                                    <div style={{ fontSize: 11, color: '#9ca3af', fontStyle: 'italic' }}>No activity data for this term.</div>
                                  ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                      {subjectSubmissions.map((sub: any, idx: number) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                                          <span style={{ color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub.assignment?.title}</span>
                                          <span style={{ fontWeight: 700, color: '#1e293b' }}>{sub.score}/{sub.total_possible}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Grade scale legend */}
                <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', padding: '16px', boxShadow: '0 1px 4px rgba(109,40,217,.06)', animation: '_rfade .5s ease .3s both' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <span>📖</span>
                    <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>Grade Scale</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[
                      { grade: 'A+', range: '90–100%', color: '#16a34a', label: 'Excellent' },
                      { grade: 'A',  range: '80–89%', color: '#059669', label: 'Very Good' },
                      { grade: 'B',  range: '70–79%', color: '#0891b2', label: 'Good' },
                      { grade: 'C',  range: '60–69%', color: '#d97706', label: 'Average' },
                      { grade: 'D',  range: '50–59%', color: '#ea580c', label: 'Below Average' },
                      { grade: 'F',  range: '0–49%',  color: '#dc2626', label: 'Fail' },
                    ].map(g => (
                      <div key={g.grade} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 7, background: g.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: g.color, flexShrink: 0 }}>{g.grade}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>{g.label}</div>
                          <div style={{ fontSize: 10, color: '#9ca3af' }}>{g.range}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Recommendations & Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Official Results Snapshot */}
                {reportCard ? (
                  <div style={{ position: 'relative' }}>
                    <ReportCard 
                      report={reportCard}
                      school={studentData.school}
                      term={selectedTerm}
                      year={selectedTerm?.academic_year}
                      settings={{}}
                      readonly={true}
                      hideSettings={true}
                      isFinancialHold={isFinancialHold}
                    />
                  </div>
                ) : (
                  <div style={{ background: '#fff', borderRadius: 24, border: '1.5px solid #f0eefe', padding: 24, textAlign: 'center' }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>📄</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Report Card Pending</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>Official positions will be released soon.</div>
                  </div>
                )}

                {/* Recommendations Section */}
                <div style={{ background: '#fff', borderRadius: 24, border: '1.5px solid #f0eefe', padding: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <span style={{ fontSize: 20 }}>💡</span>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: 0 }}>Action Plan</h3>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {actionPlans.length === 0 ? (
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>Analysis steps will appear here.</div>
                    ) : actionPlans.map((plan, i) => (
                      <div key={i} style={{ background: plan.color + '05', padding: '16px', borderRadius: 16, border: `1.5px solid ${plan.color}20` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <span style={{ fontSize: 18 }}>{plan.icon}</span>
                          <div style={{ fontWeight: 700, fontSize: 13, color: plan.color }}>{plan.title}</div>
                        </div>
                        <div style={{ fontSize: 11, lineHeight: 1.4, color: '#475569' }}>{plan.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                   <button style={{ width: '100%', padding: '12px', borderRadius: 12, background: '#f5f3ff', color: '#6d28d9', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                     📧 Meet with Teacher
                   </button>
                   <button style={{ width: '100%', padding: '12px', borderRadius: 12, background: '#f0fdf4', color: '#16a34a', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                     📱 Schedule Parent Call
                   </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
