import { useStuckLoadingReload } from '../../hooks/useStuckLoadingReload'
// src/pages/teacher/MyClassesPage.tsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useCurrentTerm, useCurrentAcademicYear } from '../../hooks/useSettings'
import { getGradeInfo, calculateAverage, calculatePassRate } from '../../utils/grading'
import { ROUTES } from '../../constants/routes'
import { useAutoRefresh } from "../../hooks/useAutoRefresh";

export default function MyClassesPage() {
    useAutoRefresh(loadMyClasses);
  const { user } = useAuth()
  const { data: term } = useCurrentTerm()
  const { data: year } = useCurrentAcademicYear()
  const [loading, setLoading] = useState(true)
  useStuckLoadingReload(loading)
  const [classData, setClassData] = useState<any[]>([])
  const [expandedClass, setExpandedClass] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id && term?.id) loadMyClasses()
  }, [user?.id, term?.id])

  async function loadMyClasses() {
    setLoading(true)
    try {
      const { data: teacher } = await supabase.from('teachers').select('id').eq('user_id', user!.id).maybeSingle()
      if (!teacher) return

      const { data: assigns } = await supabase
        .from('teacher_assignments')
        .select('*, class:classes(id,name,level), subject:subjects(id,name,code)')
        .eq('teacher_id', teacher.id).eq('term_id', term!.id)

      const uniqueClasses = [...new Map((assigns ?? []).map((a: any) => [a.class?.id, a.class])).values()].filter(Boolean)

      const data = await Promise.all(uniqueClasses.map(async (cls: any) => {
        const classAssigns = (assigns ?? []).filter((a: any) => a.class?.id === cls.id)
        const subjectIds = classAssigns.map((a: any) => a.subject?.id).filter(Boolean)

        const [{ data: students }, { data: scores }] = await Promise.all([
          supabase.from('students').select('id,full_name,student_id,gender').eq('class_id', cls.id).eq('is_active', true).order('full_name'),
          supabase.from('scores').select('student_id,subject_id,total_score,is_submitted,grade').eq('class_id', cls.id).eq('term_id', term!.id).eq('teacher_id', teacher.id),
        ])

        const totals = (scores ?? []).map((s: any) => s.total_score ?? 0)
        const submitted = (scores ?? []).filter((s: any) => s.is_submitted).length
        const studentCount = (Array.isArray(students) ? students : []).length ?? 0
        const totalExpected = subjectIds.length * studentCount

        // Per-student summary
        const studentSummaries = (students ?? []).map((s: any) => {
          const studentScores = (scores ?? []).filter((sc: any) => sc.student_id === s.id)
          const avg = calculateAverage(studentScores.map((sc: any) => sc.total_score ?? 0))
          return { ...s, avg, gradeInfo: getGradeInfo(avg), scoreCount: studentScores.length }
        }).sort((a: any, b: any) => b.avg - a.avg)

        return {
          classId: cls.id,
          className: cls.name,
          level: cls.level,
          subjects: classAssigns.map((a: any) => a.subject).filter(Boolean),
          isClassTeacher: classAssigns.some((a: any) => a.is_class_teacher),
          studentCount,
          submitted,
          totalExpected,
          avg: calculateAverage(totals),
          passRate: calculatePassRate(totals),
          maleCount: (students ?? []).filter((s: any) => s.gender === 'male').length,
          femaleCount: (students ?? []).filter((s: any) => s.gender === 'female').length,
          studentSummaries,
          gradeInfo: getGradeInfo(calculateAverage(totals)),
        }
      }))

      setClassData(data)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="tp-page">
      <div className="tp-loading">
        <div className="tp-spinner" />
        Loading your classes…
      </div>
    </div>
  )

  return (
    <div className="tp-page">
      <link rel="stylesheet" href="/src/styles/teacher-portal.css" />

      {/* ── HERO ── */}
      <div className="tp-hero" style={{ marginBottom: 16 }}>
        <div className="tp-hero-label">Class Management</div>
        <h1 className="tp-hero-title">🏫 My Classes</h1>
        <p className="tp-hero-sub">
          {(term as any)?.name} · {(year as any)?.name} · {classData.length} class{classData.length !== 1 ? 'es' : ''} assigned
        </p>
      </div>

      {classData.length === 0 ? (
        <div className="tp-card">
          <div className="tp-empty">
            <div className="tp-empty-icon">🏫</div>
            <div className="tp-empty-title">No classes assigned</div>
            <p className="tp-empty-sub">Ask your admin to assign classes to you for this term.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {classData.map((cls, i) => {
            const completionPct = cls.totalExpected > 0 ? Math.min(100, Math.round((cls.submitted / cls.totalExpected) * 100)) : 0
            const isExpanded = expandedClass === cls.classId

            return (
              <div key={cls.classId} className="tp-card" style={{ animationDelay: `${i * 0.08}s`, overflow: 'hidden' }}>

                {/* Card Header (Clickable for mobile to expand) */}
                <div style={{ background: 'linear-gradient(135deg, #F8FAFC, #F1F5F9)', padding: '18px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <div className="tp-avatar" style={{ width: 52, height: 52, fontSize: 24, background: 'linear-gradient(135deg, #4338CA, #312E81)', boxShadow: '0 4px 12px rgba(67,56,202,0.2)' }}>
                      🏫
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{cls.className}</h2>
                        {cls.level && <span className="tp-badge tp-badge-gray">{cls.level}</span>}
                        {cls.isClassTeacher && <span className="tp-badge tp-badge-green">👨‍🏫 Class Teacher</span>}
                      </div>
                      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
                        <span>👥 {cls.studentCount} students</span>
                        <span>📚 {cls.subjects.length} subject{cls.subjects.length !== 1 ? 's' : ''}</span>
                        <span>♂ {cls.maleCount} · ♀ {cls.femaleCount}</span>
                        {cls.avg > 0 && <span style={{ fontWeight: 700, color: cls.gradeInfo.color }}>Avg: {cls.avg.toFixed(1)}%</span>}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', width: '100%', '@media (minWidth: 640px)': { width: 'auto' } } as any}>
                    <Link 
                      to={`${ROUTES.TEACHER_SCORE_ENTRY}?class=${cls.classId}`}
                      className="tp-btn tp-btn-primary"
                      style={{ flex: 1, textDecoration: 'none' }}
                    >
                      ✏️ Score Entry
                    </Link>
                    <button 
                      onClick={() => setExpandedClass(isExpanded ? null : cls.classId)}
                      className="tp-btn tp-btn-ghost"
                      style={{ flex: 1 }}
                    >
                      {isExpanded ? '▲ Hide' : '▼ Students'}
                    </button>
                  </div>
                </div>

                {/* Progress & Subjects */}
                <div style={{ padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: 20, borderBottom: isExpanded ? '1px solid var(--border-color)' : 'none' }}>
                  {/* Completion Bar */}
                  <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 12, fontWeight: 700 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Grading Progress</span>
                      <span style={{ color: completionPct === 100 ? '#16A34A' : '#4338CA' }}>{completionPct}%</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--bg-hover)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${completionPct}%`, background: completionPct === 100 ? '#16A34A' : '#4338CA', borderRadius: 99, transition: 'width 0.5s ease' }} />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>
                      {cls.submitted} of {cls.totalExpected} entries submitted
                    </div>
                  </div>

                  {/* Subject Pills */}
                  <div style={{ flex: '2 1 300px' }}>
                    <div className="tp-label" style={{ marginBottom: 8 }}>Assigned Subjects</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {cls.subjects.map((s: any) => (
                        <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Link 
                            to={`${ROUTES.TEACHER_SCORE_ENTRY}?class=${cls.classId}&subject=${s.id}`}
                            style={{ display: 'inline-flex', alignItems: 'center', fontSize: 12, fontWeight: 700, background: 'rgba(67,56,202,0.08)', color: '#4338CA', padding: '6px 12px', borderRadius: 99, textDecoration: 'none', border: '1px solid rgba(67,56,202,0.15)', transition: 'all 0.15s' }}
                          >
                            {s.name}{s.code ? ` (${s.code})` : ''}
                          </Link>
                          <Link 
                            to={`/teacher/class-tests?class=${cls.classId}&subject=${s.id}`} 
                            title="Manage Class Tests"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, textDecoration: 'none', background: 'var(--bg-hover)', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 14 }}
                          >
                            📝
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Expanded Student List */}
                {isExpanded && cls.studentSummaries.length > 0 && (
                  <div style={{ animation: 'tp-fade-in 0.3s ease' }}>
                    <div style={{ padding: '14px 20px', background: 'var(--bg-hover)', borderBottom: '1px solid var(--border-color)' }}>
                      <span className="tp-label" style={{ margin: 0 }}>Student Performance Ranking</span>
                    </div>
                    
                    {/* List view better for mobile than table */}
                    <div style={{ padding: '8px 0' }}>
                      {cls.studentSummaries.map((s: any, idx: number) => (
                        <div key={s.id} className="tp-student-row" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                          <div style={{ width: 28, fontSize: 14, fontWeight: 800, color: '#4338CA', textAlign: 'center', flexShrink: 0 }}>
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx+1}`}
                          </div>
                          
                          <div className="tp-avatar" style={{ width: 36, height: 36, fontSize: 13, background: 'linear-gradient(135deg, #312E81, #4C1D95)' }}>
                            {s.full_name.charAt(0)}
                          </div>
                          
                          <div style={{ flex: '1 1 120px', minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {s.full_name}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                              <span style={{ fontFamily: 'monospace' }}>{s.student_id ?? '—'}</span>
                              <span style={{ margin: '0 6px' }}>•</span>
                              <span>{s.gender === 'male' ? '♂ Male' : s.gender === 'female' ? '♀ Female' : '—'}</span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                            {s.avg > 0 ? (
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 15, fontWeight: 800, color: s.gradeInfo.color }}>{s.avg.toFixed(1)}%</div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>{s.scoreCount} scores</div>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: 14, fontWeight: 700 }}>—</span>
                            )}
                            
                            {s.avg > 0 ? (
                              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.gradeInfo.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: s.gradeInfo.color }}>
                                {s.gradeInfo.grade}
                              </div>
                            ) : (
                              <div style={{ width: 36, height: 36 }} />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
