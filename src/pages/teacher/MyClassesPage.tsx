// src/pages/teacher/MyClassesPage.tsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useCurrentTerm, useCurrentAcademicYear } from '../../hooks/useSettings'
import { getGradeInfo, calculateAverage, calculatePassRate } from '../../utils/grading'
import { ROUTES } from '../../constants/routes'

export default function MyClassesPage() {
  const { user } = useAuth()
  const { data: term } = useCurrentTerm()
  const { data: year } = useCurrentAcademicYear()
  const [loading, setLoading] = useState(true)
  const [classData, setClassData] = useState<any[]>([])
  const [expandedClass, setExpandedClass] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id && term?.id) loadMyClasses()
  }, [user?.id, term?.id])

  async function loadMyClasses() {
    setLoading(true)
    try {
      const { data: teacher } = await supabase.from('teachers').select('id').eq('user_id', user!.id).single()
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
        const studentCount = students?.length ?? 0
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
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', flexDirection:'column', gap:16, fontFamily:'"DM Sans",sans-serif' }}>
      <style>{`@keyframes _sp{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width:40, height:40, borderRadius:'50%', border:'4px solid #ede9fe', borderTopColor:'#6d28d9', animation:'_sp .8s linear infinite' }} />
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _sp{to{transform:rotate(360deg)}}
        @keyframes _fi{from{opacity:0}to{opacity:1}}
        @keyframes _fu{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .std-row:hover{background:#faf5ff !important}
      `}</style>

      <div style={{ fontFamily:'"DM Sans",system-ui,sans-serif', animation:'_fi .4s ease' }}>

        <div style={{ marginBottom:24 }}>
          <h1 style={{ fontFamily:'"Playfair Display",serif', fontSize:26, fontWeight:700, color:'#111827', margin:0 }}>My Classes</h1>
          <p style={{ fontSize:13, color:'#6b7280', marginTop:3 }}>{(term as any)?.name} · {(year as any)?.name} · {classData.length} class{classData.length !== 1 ? 'es' : ''} assigned</p>
        </div>

        {classData.length === 0 ? (
          <div style={{ background:'#fff', borderRadius:16, padding:'60px 20px', textAlign:'center', border:'1.5px solid #f0eefe' }}>
            <div style={{ fontSize:52, marginBottom:12 }}>🏫</div>
            <h3 style={{ fontFamily:'"Playfair Display",serif', fontSize:18, fontWeight:700, color:'#111827', marginBottom:6 }}>No classes assigned</h3>
            <p style={{ fontSize:13, color:'#9ca3af' }}>Ask your admin to assign classes to you for this term.</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            {classData.map((cls, i) => {
              const completionPct = cls.totalExpected > 0 ? Math.min(100, Math.round((cls.submitted / cls.totalExpected) * 100)) : 0
              const isExpanded = expandedClass === cls.classId

              return (
                <div key={cls.classId} style={{ background:'#fff', borderRadius:18, border:'1.5px solid #f0eefe', overflow:'hidden', boxShadow:'0 1px 4px rgba(109,40,217,.07)', animation:`_fu .4s ease ${i*.08}s both` }}>

                  {/* Class header */}
                  <div style={{ background:'linear-gradient(135deg,#faf5ff,#f5f3ff)', padding:'20px', borderBottom:'1px solid #ede9fe', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
                    <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
                      <div style={{ width:52, height:52, borderRadius:14, background:'linear-gradient(135deg,#7c3aed,#6d28d9)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>🏫</div>
                      <div>
                        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                          <h2 style={{ fontFamily:'"Playfair Display",serif', fontSize:20, fontWeight:700, color:'#111827', margin:0 }}>{cls.className}</h2>
                          {cls.level && <span style={{ fontSize:11, color:'#6b7280', background:'#fff', padding:'2px 8px', borderRadius:99, border:'1px solid #e5e7eb' }}>{cls.level}</span>}
                          {cls.isClassTeacher && <span style={{ fontSize:11, fontWeight:700, background:'#f0fdf4', color:'#16a34a', padding:'2px 8px', borderRadius:99 }}>👨‍🏫 Class Teacher</span>}
                        </div>
                        <div style={{ display:'flex', gap:14, marginTop:6, flexWrap:'wrap' }}>
                          <span style={{ fontSize:12, color:'#6b7280' }}>👥 {cls.studentCount} students</span>
                          <span style={{ fontSize:12, color:'#6b7280' }}>📚 {cls.subjects.length} subject{cls.subjects.length !== 1 ? 's' : ''}</span>
                          <span style={{ fontSize:12, color:'#6b7280' }}>♂ {cls.maleCount} · ♀ {cls.femaleCount}</span>
                          {cls.avg > 0 && <span style={{ fontSize:12, fontWeight:700, color: cls.gradeInfo.color }}>Avg: {cls.avg.toFixed(1)}%</span>}
                        </div>
                      </div>
                    </div>

                    <div style={{ display:'flex', gap:8, flexShrink:0, alignItems:'flex-start' }}>
                      <Link to={`${ROUTES.TEACHER_SCORE_ENTRY}?class=${cls.classId}`}
                        style={{ padding:'8px 16px', borderRadius:9, background:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'#fff', fontSize:12, fontWeight:600, textDecoration:'none' }}>
                        ✏️ Enter Scores
                      </Link>
                      <button onClick={() => setExpandedClass(isExpanded ? null : cls.classId)}
                        style={{ padding:'8px 14px', borderRadius:9, border:'1.5px solid #ddd6fe', background:'#fff', color:'#6d28d9', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                        {isExpanded ? '▲ Hide' : '▼ Students'}
                      </button>
                    </div>
                  </div>

                  {/* Progress + subjects */}
                  <div style={{ padding:'16px 20px', display:'flex', flexWrap:'wrap', gap:16, alignItems:'center', borderBottom: isExpanded ? '1px solid #faf5ff' : 'none' }}>
                    {/* Completion */}
                    <div style={{ flex:'1 1 200px', minWidth:0 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:5 }}>
                        <span style={{ color:'#6b7280' }}>Score Completion</span>
                        <span style={{ fontWeight:700, color: completionPct === 100 ? '#16a34a' : '#6d28d9' }}>{completionPct}%</span>
                      </div>
                      <div style={{ height:7, background:'#f0eefe', borderRadius:99, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:completionPct+'%', background: completionPct === 100 ? 'linear-gradient(90deg,#16a34a,#22c55e)' : 'linear-gradient(90deg,#7c3aed,#a78bfa)', borderRadius:99, transition:'width 1s ease' }} />
                      </div>
                      <div style={{ fontSize:11, color:'#9ca3af', marginTop:3 }}>{cls.submitted} of {cls.totalExpected} entries submitted</div>
                    </div>

                    {/* Subjects */}
                    <div style={{ flex:'2 1 300px' }}>
                      <div style={{ fontSize:11, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6 }}>Assigned Subjects</div>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                        {cls.subjects.map((s: any) => (
                          <Link key={s.id} to={`${ROUTES.TEACHER_SCORE_ENTRY}?class=${cls.classId}&subject=${s.id}`}
                            style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:12, fontWeight:600, background:'#f5f3ff', color:'#6d28d9', padding:'4px 10px', borderRadius:99, textDecoration:'none', border:'1px solid #ddd6fe', transition:'all .15s' }}
                            onMouseEnter={e => { e.currentTarget.style.background='#6d28d9'; e.currentTarget.style.color='#fff' }}
                            onMouseLeave={e => { e.currentTarget.style.background='#f5f3ff'; e.currentTarget.style.color='#6d28d9' }}>
                            {s.name}{s.code ? ` (${s.code})` : ''}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Expanded student list */}
                  {isExpanded && cls.studentSummaries.length > 0 && (
                    <div style={{ animation:'_fi .3s ease' }}>
                      <div style={{ padding:'12px 20px', background:'#fafafa', borderBottom:'1px solid #f0eefe', fontSize:11, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'.06em' }}>
                        Student Rankings
                      </div>
                      <table style={{ width:'100%', borderCollapse:'collapse' }}>
                        <thead>
                          <tr style={{ background:'#f9f9ff' }}>
                            {['Rank','Student','ID','Gender','Avg Score','Grade','Progress'].map(h => (
                              <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:10, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'.05em', borderBottom:'1px solid #f0eefe' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {cls.studentSummaries.map((s: any, idx: number) => (
                            <tr key={s.id} className="std-row" style={{ borderBottom:'1px solid #faf5ff', transition:'background .12s' }}>
                              <td style={{ padding:'9px 14px', fontSize:13, fontWeight:700, color:'#6d28d9' }}>
                                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx+1}`}
                              </td>
                              <td style={{ padding:'9px 14px' }}>
                                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                  <div style={{ width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,#7c3aed,#6d28d9)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:'#fff',flexShrink:0 }}>
                                    {s.full_name.charAt(0)}
                                  </div>
                                  <span style={{ fontSize:13, fontWeight:600, color:'#111827' }}>{s.full_name}</span>
                                </div>
                              </td>
                              <td style={{ padding:'9px 14px', fontSize:11, fontFamily:'monospace', color:'#9ca3af' }}>{s.student_id ?? '—'}</td>
                              <td style={{ padding:'9px 14px' }}>
                                <span style={{ fontSize:11, fontWeight:700, background: s.gender === 'male' ? '#eff6ff' : s.gender === 'female' ? '#fdf2f8' : '#f3f4f6', color: s.gender === 'male' ? '#2563eb' : s.gender === 'female' ? '#db2777' : '#6b7280', padding:'2px 7px', borderRadius:99 }}>
                                  {s.gender === 'male' ? '♂' : s.gender === 'female' ? '♀' : '—'}
                                </span>
                              </td>
                              <td style={{ padding:'9px 14px' }}>
                                {s.avg > 0 ? <span style={{ fontSize:14, fontWeight:800, color:s.gradeInfo.color }}>{s.avg.toFixed(1)}%</span> : <span style={{ color:'#d1d5db' }}>—</span>}
                              </td>
                              <td style={{ padding:'9px 14px' }}>
                                {s.avg > 0 ? (
                                  <span style={{ width:28,height:28,borderRadius:8,background:s.gradeInfo.color+'18',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:s.gradeInfo.color }}>
                                    {s.gradeInfo.grade}
                                  </span>
                                ) : <span style={{ color:'#d1d5db' }}>—</span>}
                              </td>
                              <td style={{ padding:'9px 14px' }}>
                                <div style={{ width:80, height:5, background:'#f0eefe', borderRadius:99, overflow:'hidden' }}>
                                  <div style={{ height:'100%', width:Math.min(100,s.avg)+'%', background:s.gradeInfo.color, borderRadius:99 }} />
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}