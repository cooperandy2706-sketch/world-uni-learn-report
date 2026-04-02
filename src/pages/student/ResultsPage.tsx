// src/pages/student/ResultsPage.tsx
// Student results portal — term scores, subject breakdown, report card, position
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { useCurrentTerm, useCurrentAcademicYear } from '../../hooks/useSettings'
import { getGradeInfo } from '../../utils/grading'
import { ROUTES } from '../../constants/routes'

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
  const [allTerms, setAllTerms] = useState<any[]>([])
  const [selectedTermId, setSelectedTermId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setTimeout(() => setMounted(true), 60) }, [])
  useEffect(() => { if (user?.id) loadStudent() }, [user?.id])
  useEffect(() => {
    if (selectedTermId && studentData) loadResults(selectedTermId)
  }, [selectedTermId, studentData])

  async function loadStudent() {
    const { data: student } = await supabase.from('students').select('*, class:classes(name), school:schools(name)').eq('user_id', user!.id).single()
    if (!student) { setLoading(false); return }
    setStudentData(student)

    const { data: terms } = await supabase.from('terms').select('*, academic_year:academic_years(name)').eq('school_id', student.school_id).order('created_at', { ascending: false })
    setAllTerms(terms ?? [])
    const tid = term?.id ?? terms?.[0]?.id ?? ''
    setSelectedTermId(tid)
  }

  async function loadResults(termId: string) {
    if (!studentData) return
    setLoading(true)
    const [reportRes, scoresRes] = await Promise.all([
      supabase.from('report_cards').select('*').eq('student_id', studentData.id).eq('term_id', termId).maybeSingle(),
      supabase.from('scores').select('total_score,grade,class_score,exams_score,subject:subjects(id,name)').eq('student_id', studentData.id).eq('term_id', termId),
    ])
    setReportCard(reportRes.data)
    setScores((scoresRes.data ?? []).sort((a: any, b: any) => (b.total_score ?? 0) - (a.total_score ?? 0)))
    setLoading(false)
  }

  const avg = reportCard?.average_score ?? (scores.length ? scores.reduce((s, x) => s + (x.total_score ?? 0), 0) / scores.length : null)
  const gradeInfo = avg != null ? getGradeInfo(avg) : null
  const selectedTerm = allTerms.find((t: any) => t.id === selectedTermId)

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
            <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>My Academic Results</h1>
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
        ) : (
          <>
            {/* Summary row */}
            {(avg != null || reportCard) && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 22, animation: '_rfade .5s ease .1s both' }}>
                {[
                  { icon: '📊', label: 'Term Average', value: avg != null ? `${avg.toFixed(1)}%` : '—', sub: gradeInfo ? `Grade ${gradeInfo.grade} — ${gradeInfo.label}` : '', color: gradeInfo?.color ?? '#6d28d9', bg: '#f5f3ff' },
                  { icon: '🏆', label: 'Class Position', value: reportCard?.overall_position ? `${reportCard.overall_position}${ordinal(reportCard.overall_position)}` : '—', sub: reportCard?.total_students ? `out of ${reportCard.total_students} students` : '', color: '#d97706', bg: '#fffbeb' },
                  { icon: '📚', label: 'Subjects', value: String(scores.length), sub: 'with scores entered', color: '#0891b2', bg: '#ecfeff' },
                  { icon: '🎯', label: 'Highest Subject', value: scores[0] ? `${(scores[0].total_score ?? 0).toFixed(1)}%` : '—', sub: scores[0]?.subject?.name ?? '', color: '#16a34a', bg: '#f0fdf4' },
                ].map((s, i) => (
                  <div key={i} className="rr-card" style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', border: '1.5px solid #f0eefe', boxShadow: '0 1px 4px rgba(109,40,217,.06)', animation: `_rfade .4s ease ${.1 + i * .07}s both` }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, marginBottom: 10 }}>{s.icon}</div>
                    <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 24, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: '#374151', fontWeight: 600, marginTop: 3 }}>{s.label}</div>
                    {s.sub && <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>{s.sub}</div>}
                  </div>
                ))}
              </div>
            )}

            <div className="rr-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>

              {/* Subject scores table */}
              <div>
                <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', overflow: 'hidden', boxShadow: '0 1px 4px rgba(109,40,217,.06)', animation: '_rfade .5s ease .2s both' }}>
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid #faf5ff', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>📚</span>
                    <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Subject Breakdown</h3>
                    {selectedTerm && <span style={{ fontSize: 11, fontWeight: 700, background: '#f5f3ff', color: '#6d28d9', padding: '2px 8px', borderRadius: 99 }}>{selectedTerm.name}</span>}
                  </div>

                  {scores.length === 0 ? (
                    <div style={{ padding: '52px 20px', textAlign: 'center' }}>
                      <div style={{ fontSize: 52, marginBottom: 12 }}>📋</div>
                      <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 17, fontWeight: 700, color: '#111827', marginBottom: 6 }}>No results yet</h3>
                      <p style={{ fontSize: 13, color: '#9ca3af' }}>Scores for this term haven't been entered yet. Check back later.</p>
                    </div>
                  ) : (
                    <div className="rr-table-wrapper">
                      <div className="rr-table">
                        {/* Table header */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 60px', padding: '10px 20px', background: '#faf5ff', borderBottom: '1px solid #f0eefe' }}>
                        {['Subject', 'Class', 'Exams', 'Total', 'Grade'].map(h => (
                          <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</div>
                        ))}
                      </div>
                      {scores.map((s: any, i: number) => {
                        const g = getGradeInfo(s.total_score ?? 0)
                        return (
                          <div key={i} className="rr-row"
                            style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 60px', padding: '13px 20px', borderBottom: i < scores.length - 1 ? '1px solid #faf5ff' : 'none', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{s.subject?.name}</div>
                              <div style={{ height: 4, background: '#f0eefe', borderRadius: 99, overflow: 'hidden', marginTop: 5, maxWidth: 140 }}>
                                <div style={{ height: '100%', width: `${s.total_score ?? 0}%`, background: g.color, borderRadius: 99, transition: 'width 1s ease' }} />
                              </div>
                            </div>
                            <div style={{ fontSize: 13, color: '#374151' }}>{s.class_score != null ? `${s.class_score.toFixed(1)}%` : '—'}</div>
                            <div style={{ fontSize: 13, color: '#374151' }}>{s.exams_score != null ? `${s.exams_score.toFixed(1)}%` : '—'}</div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: g.color }}>{(s.total_score ?? 0).toFixed(1)}%</div>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: g.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: g.color }}>{g.grade}</div>
                          </div>
                        )
                      })}

                      {/* Average row */}
                      {avg != null && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 60px', padding: '12px 20px', background: '#faf5ff', borderTop: '1.5px solid #ede9fe', alignItems: 'center' }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#6d28d9' }}>Average / Overall</div>
                          <div />
                          <div />
                          <div style={{ fontSize: 15, fontWeight: 800, color: gradeInfo?.color ?? '#6d28d9' }}>{avg.toFixed(1)}%</div>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: (gradeInfo?.color ?? '#6d28d9') + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: gradeInfo?.color ?? '#6d28d9' }}>{gradeInfo?.grade ?? '—'}</div>
                        </div>
                      )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Report card summary */}
                {reportCard ? (
                  <div style={{ background: 'linear-gradient(145deg,#2e1065,#4c1d95,#5b21b6)', borderRadius: 18, padding: '22px', color: '#fff', position: 'relative', overflow: 'hidden', animation: '_rfade .5s ease .22s both' }}>
                    <div style={{ position: 'absolute', top: -18, right: -18, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,.05)' }} />
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', opacity: .7, marginBottom: 10 }}>📄 OFFICIAL REPORT CARD</div>
                      <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 40, fontWeight: 700, color: '#fbbf24', lineHeight: 1, marginBottom: 4 }}>{avg?.toFixed(1)}%</div>
                      <div style={{ fontSize: 14, opacity: .8, marginBottom: 16 }}>Grade {gradeInfo?.grade} — {gradeInfo?.label}</div>
                      {[
                        { label: 'Class Position', value: reportCard.overall_position ? `${reportCard.overall_position} / ${reportCard.total_students}` : '—' },
                        { label: 'Attendance', value: reportCard.attendance_percent != null ? `${reportCard.attendance_percent}%` : '—' },
                        { label: 'Class Teacher Remark', value: reportCard.class_teacher_remarks ?? '—' },
                        { label: "Head's Comment", value: reportCard.head_teacher_remarks ?? '—' },
                      ].map(({ label, value }) => (
                        <div key={label} style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 3 }}>{label}</div>
                          <div style={{ fontSize: 12, color: '#fff', fontWeight: 500, lineHeight: 1.5 }}>{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', padding: '28px 20px', textAlign: 'center', animation: '_rfade .5s ease .22s both' }}>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>📋</div>
                    <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 6 }}>Report card not yet generated</h3>
                    <p style={{ fontSize: 12, color: '#9ca3af' }}>The admin generates official report cards at the end of term.</p>
                  </div>
                )}

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
            </div>
          </>
        )}
      </div>
    </>
  )
}

function ordinal(n: number) {
  const s = ['th','st','nd','rd']; const v = n % 100
  return (s[(v-20)%10] || s[v] || s[0])
}
