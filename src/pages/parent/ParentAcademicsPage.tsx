// src/pages/parent/ParentAcademicsPage.tsx
import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useParentWards } from '../../hooks/useParents'
import { useCurrentTerm } from '../../hooks/useSettings'
import { supabase } from '../../lib/supabase'
import { getGradeInfo } from '../../utils/grading'
import { ChevronDown, ChevronUp, BarChart3, Trophy, BookOpen, Calendar } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

export default function ParentAcademicsPage() {
  const { user } = useAuth()
  const { data: wards = [], isLoading: loadingWards } = useParentWards()
  const { data: currentTerm } = useCurrentTerm()

  const [selectedTermId, setSelectedTermId] = useState<string>('')
  const [academicData, setAcademicData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)
  const [expandedWard, setExpandedWard] = useState<string | null>(null)

  // Fetch all terms for the school
  const { data: allTerms = [] } = useQuery({
    queryKey: ['all_school_terms', user?.school_id],
    queryFn: async () => {
      if (!user?.school_id) return []
      const { data, error } = await supabase
        .from('terms')
        .select('*')
        .eq('school_id', user.school_id)
        .order('start_date', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!user?.school_id
  })

  // Initialize selectedTermId when currentTerm is loaded
  useEffect(() => {
    if (currentTerm?.id && !selectedTermId) {
      setSelectedTermId(currentTerm.id)
    }
  }, [currentTerm, selectedTermId])

  useEffect(() => {
    if (wards.length > 0 && selectedTermId) {
      loadAcademics()
    }
  }, [wards, selectedTermId])

  async function loadAcademics() {
    setLoading(true)
    const newAcademicData: Record<string, any> = {}
    
    for (const ward of wards) {
      try {
        const [reportRes, scoresRes] = await Promise.all([
          supabase.from('report_cards').select('*').eq('student_id', ward.id).eq('term_id', selectedTermId).eq('is_approved', true).maybeSingle(),
          supabase.from('scores').select('total_score,grade,subject:subjects(name)').eq('student_id', ward.id).eq('term_id', selectedTermId).eq('is_submitted', true)
        ])
        
        newAcademicData[ward.id] = {
          report: reportRes.data,
          scores: scoresRes.data || []
        }
      } catch (err) {
        console.error(`Failed to load academics for ward ${ward.id}`, err)
      }
    }
    
    setAcademicData(newAcademicData)
    setLoading(false)
  }

  const activeTerm = allTerms.find(t => t.id === selectedTermId)

  if (loadingWards || (loading && Object.keys(academicData).length === 0)) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <style>{`@keyframes _spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2.5px solid #ede9fe', borderTopColor: '#6d28d9', animation: '_spin 0.8s linear infinite' }} />
      </div>
    )
  }

  return (
    <div style={{ fontFamily: '"DM Sans", sans-serif', paddingBottom: 40, maxWidth: 800, margin: '0 auto', animation: '_fadeIn .4s ease' }}>
      <style>{`
        @keyframes _fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>Academic Results</h1>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Monitor the performance and grades of your children.</p>
        </div>

        {/* Term Selector */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1.5px solid #f0eefe', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Calendar size={16} color="#6d28d9" />
          <select 
            value={selectedTermId} 
            onChange={(e) => setSelectedTermId(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' }}
          >
            {allTerms.map(t => (
              <option key={t.id} value={t.id}>
                {t.name} {t.is_current ? '(Current)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, color: '#6d28d9', fontSize: 13, fontWeight: 600 }}>
           <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #ede9fe', borderTopColor: '#6d28d9', animation: '_spin 0.8s linear infinite' }} />
           Loading {activeTerm?.name} results...
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {wards.map((ward) => {
          const data = academicData[ward.id]
          const isExpanded = expandedWard === ward.id
          const avg = data?.report?.average_score ?? (data?.scores.length ? data.scores.reduce((s: any, x: any) => s + (x.total_score ?? 0), 0) / data.scores.length : null)
          const gradeInfo = avg != null ? getGradeInfo(avg) : null

          return (
            <div key={ward.id} style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #f0eefe', overflow: 'hidden', boxShadow: '0 4px 16px rgba(109,40,217,0.03)' }}>
              
              <div 
                onClick={() => setExpandedWard(isExpanded ? null : ward.id)}
                style={{ padding: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: isExpanded ? '#faf5ff' : '#fff', transition: 'background 0.2s' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: '#eff6ff', color: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BarChart3 size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{ward.full_name}</div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{ward.class?.name || 'No Class'}</div>
                  </div>
                </div>

                <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Avg Score</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: gradeInfo?.color || '#334155' }}>
                      {avg != null ? `${avg.toFixed(1)}%` : '—'}
                    </div>
                  </div>
                  <div style={{ color: '#d1d5db' }}>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>
              </div>

              {isExpanded && data && (
                <div style={{ padding: 20, borderTop: '1.5px solid #f0eefe', background: '#fafbff' }}>
                  
                  {/* Summary Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
                    <div style={{ background: '#fff', padding: 14, borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Trophy size={18} color="#f59e0b" />
                      <div>
                        <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Position</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#1e293b' }}>{data.report?.overall_position || '—'}</div>
                      </div>
                    </div>
                    <div style={{ background: '#fff', padding: 14, borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <BookOpen size={18} color="#6d28d9" />
                      <div>
                        <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Subjects</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#1e293b' }}>{data.scores.length}</div>
                      </div>
                    </div>
                  </div>

                  <h4 style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: '0 0 12px' }}>Subject Breakdown</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {data.scores.length === 0 ? (
                      <div style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '10px 0' }}>No results recorded for this term.</div>
                    ) : (
                      data.scores.map((s: any, idx: number) => {
                        const g = getGradeInfo(s.total_score || 0)
                        return (
                           <div key={idx} style={{ background: '#fff', padding: '12px 16px', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>{s.subject?.name}</div>
                              <div style={{ fontSize: 11, color: '#94a3b8' }}>{g.label}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: 14, fontWeight: 800, color: g.color }}>{(s.total_score || 0).toFixed(1)}%</div>
                              <div style={{ fontSize: 10, fontWeight: 700, color: g.color, opacity: 0.8 }}>Grade {g.grade}</div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>

                  {data.report?.head_teacher_remarks && (
                    <div style={{ marginTop: 24, padding: 16, background: '#f5f3ff', borderRadius: 12, border: '1px solid #ddd6fe' }}>
                      <div style={{ fontSize: 11, color: '#6d28d9', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Teacher Remarks</div>
                      <div style={{ fontSize: 13, color: '#4c1d95', fontStyle: 'italic', marginTop: 4 }}>
                        "{data.report.head_teacher_remarks}"
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          )
        })}

        {wards.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👨‍👩‍👦</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>No children linked</h3>
            <p style={{ fontSize: 13, color: '#6b7280' }}>Contact school administration to link your children.</p>
          </div>
        )}
      </div>
    </div>
  )
}
