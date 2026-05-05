import { useState, useMemo, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useStudents } from '../../hooks/useStudents'
import { useClasses } from '../../hooks/useClasses'
import { useAuth } from '../../hooks/useAuth'
import { useAcademicChallenges, useCreateAcademicChallenge } from '../../hooks/useAcademicChallenges'
import { getGradeInfo } from '../../utils/grading'
import { ordinal } from '../../lib/utils'
import Modal from '../../components/ui/Modal'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell, AreaChart, Area, PieChart, Pie
} from 'recharts'
import { TrendingUp, User, Calendar, Award, BookOpen, ChevronRight, Search, LayoutDashboard, Users, Percent, FileText, Printer } from 'lucide-react'

// ── Constants & Styles ──────────────────────────────────────
const T = {
  primary: '#6d28d9',
  secondary: '#7c3aed',
  accent: '#fbbf24',
  success: '#16a34a',
  danger: '#dc2626',
  white: '#ffffff',
  slate: '#111827',
  muted: '#6b7280',
  border: '#f0eefe',
  bg: '#faf5ff',
}

const COLORS = ['#6d28d9', '#0891b2', '#16a34a', '#d97706', '#dc2626', '#db2777']

// ── Components ──────────────────────────────────────────────
function MetricCard({ label, value, icon: Icon, color, subValue }: any) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: '20px', border: `1.5px solid ${T.border}`, boxShadow: '0 1px 4px rgba(109,40,217,0.06)', flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}15`, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: T.slate, lineHeight: 1.1 }}>{value}</div>
        </div>
      </div>
      {subValue && <div style={{ fontSize: 12, color: T.muted }}>{subValue}</div>}
    </div>
  )
}

export default function PerformanceTrackingPage() {
  const { user } = useAuth()
  const { data: students = [], isLoading: loadingStudents } = useStudents()
  const { data: classes = [], isLoading: loadingClasses } = useClasses()
  
  const [viewMode, setViewMode] = useState<'student' | 'class'>('student')
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [selectedClassId, setSelectedClassId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Student Data States
  const [reportHistory, setReportHistory] = useState<any[]>([])
  const [subjectAverages, setSubjectAverages] = useState<any[]>([])
  
  // Class Data States
  const [classHistory, setClassHistory] = useState<any[]>([])
  const [topPerformers, setTopPerformers] = useState<any[]>([])
  const [leastPerformers, setLeastPerformers] = useState<any[]>([])
  const [expandedStruggleId, setExpandedStruggleId] = useState<string | null>(null)
  const [isSupportPlanOpen, setIsSupportPlanOpen] = useState(false)
  const [isRecordChallengeOpen, setIsRecordChallengeOpen] = useState(false)
  const [isChallengesReportOpen, setIsChallengesReportOpen] = useState(false)
  const [challengeStudent, setChallengeStudent] = useState<any>(null)
  const [challengeForm, setChallengeForm] = useState({ subject_name: '', teacher_name: '', description: '' })
  
  const [loadingHistory, setLoadingHistory] = useState(false)
  
  const selectedStudent = useMemo(() => 
    students.find(s => s.id === selectedStudentId), 
  [students, selectedStudentId])

  const selectedClass = useMemo(() => 
    classes.find(c => c.id === selectedClassId), 
  [classes, selectedClassId])

  const filteredStudents = useMemo(() => {
    if (!searchQuery) return []
    const q = searchQuery.toLowerCase()
    return students.filter(s => s.full_name.toLowerCase().includes(q) || s.student_id?.toLowerCase().includes(q)).slice(0, 5)
  }, [students, searchQuery])

  const filteredClasses = useMemo(() => {
    if (!searchQuery) return []
    const q = searchQuery.toLowerCase()
    return classes.filter(c => c.name.toLowerCase().includes(q)).slice(0, 5)
  }, [classes, searchQuery])

  // Fetch performance data when student changes
  useEffect(() => {
    if (viewMode === 'student' && selectedStudentId) {
       fetchStudentPerformanceData(selectedStudentId)
    } else if (viewMode === 'class' && selectedClassId) {
       fetchClassPerformanceData(selectedClassId)
    }
  }, [selectedStudentId, selectedClassId, viewMode])

  async function fetchStudentPerformanceData(studentId: string) {
    setLoadingHistory(true)
    try {
      const { data: reports, error: reportError } = await supabase
        .from('report_cards')
        .select(`
          *,
          term:terms (id, name, academic_year_id),
          academic_year:academic_years (id, name, start_date)
        `)
        .eq('student_id', studentId)
        .order('generated_at', { ascending: true })

      if (reportError) throw reportError

      const { data: scores, error: scoreError } = await supabase
        .from('scores')
        .select(`
          total_score,
          subject:subjects (name),
          term_id
        `)
        .eq('student_id', studentId)

      if (scoreError) throw scoreError

      const subMap: Record<string, any> = {}
      scores?.forEach(s => {
        const subName = s.subject?.name || 'Unknown'
        const termName = reports?.find(r => r.term_id === s.term_id)?.term?.name || 'Unknown'
        if (!subMap[subName]) subMap[subName] = { name: subName }
        subMap[subName][termName] = s.total_score
      })

      setReportHistory(reports || [])
      setSubjectAverages(Object.values(subMap))
    } catch (err) {
      console.error('Error fetching student performance data:', err)
    } finally {
      setLoadingHistory(false)
    }
  }

  async function fetchClassPerformanceData(classId: string) {
    setLoadingHistory(true)
    try {
      // 1. Fetch all reports for the class
      const { data: reports, error } = await supabase
        .from('report_cards')
        .select(`
          *,
          term:terms (id, name, academic_year_id),
          academic_year:academic_years (id, name, start_date),
          student:students (id, full_name, student_id)
        `)
        .eq('class_id', classId)
        .order('generated_at', { ascending: true })

      if (error) throw error

      // 2. Group by Term to calculate averages and pass rates
      const termMap: Record<string, any> = {}
      reports?.forEach(r => {
        const tId = r.term_id
        if (!termMap[tId]) {
          termMap[tId] = {
            id: tId,
            name: r.term?.name,
            year: r.academic_year?.name,
            totalScores: 0,
            count: 0,
            passed: 0,
            students: []
          }
        }
        termMap[tId].totalScores += (r.average_score || 0)
        termMap[tId].count += 1
        if ((r.average_score || 0) >= 50) termMap[tId].passed += 1
        termMap[tId].students.push(r)
      })

      const history = Object.values(termMap).map((t: any) => ({
        ...t,
        average: t.count > 0 ? Number((t.totalScores / t.count).toFixed(2)) : 0,
        passRate: t.count > 0 ? Number(((t.passed / t.count) * 100).toFixed(1)) : 0
      }))

      // 3. Get top and bottom performers of the LATEST term
      const latestTerm = history.length > 0 ? history[history.length - 1] : null
      let top: any[] = []
      let bottom: any[] = []
      
      if (latestTerm && latestTerm.students) {
        top = [...latestTerm.students].sort((a, b) => (b.average_score || 0) - (a.average_score || 0)).slice(0, 5)
        bottom = [...latestTerm.students].sort((a, b) => (a.average_score || 0) - (b.average_score || 0)).slice(0, 5)

        // 4. For bottom performers, fetch scores to find "Struggle Subject"
        const bottomIds = bottom.map(b => b.student_id)
        const { data: bScores } = await supabase
          .from('scores')
          .select('student_id, total_score, subject:subjects(name)')
          .in('student_id', bottomIds)
          .eq('term_id', latestTerm.id)

        bottom = bottom.map(b => {
          const studentScores = bScores?.filter(s => s.student_id === b.student_id) || []
          const worst = [...studentScores].sort((x, y) => (x.total_score || 0) - (y.total_score || 0))[0]
          return { ...b, worstSubject: worst?.subject?.name || 'Core Topics' }
        })
      }

      setClassHistory(history)
      setTopPerformers(top)
      setLeastPerformers(bottom)
    } catch (err) {
      console.error('Error fetching class performance data:', err)
    } finally {
      setLoadingHistory(false)
    }
  }

  // ── Derived Student Data ───────────────────────────────
  const growthData = useMemo(() => reportHistory.map(r => ({ name: r.term?.name || '?', average: r.average_score || 0 })), [reportHistory])
  const rankData = useMemo(() => reportHistory.map(r => ({ name: r.term?.name || '?', rank: r.overall_position || 0 })), [reportHistory])
  const latestReport = reportHistory[reportHistory.length - 1]
  const avgOverall = reportHistory.length > 0 ? (reportHistory.reduce((acc, r) => acc + (r.average_score || 0), 0) / reportHistory.length).toFixed(1) : '0'

  // ── Derived Class Data ─────────────────────────────────
  const classGrowthData = useMemo(() => classHistory.map(h => ({ name: h.name, average: h.average, passRate: h.passRate })), [classHistory])
  const latestClassStat = classHistory[classHistory.length - 1]

  // ── Challenges Data ──────────────────────────────────────
  const { data: classChallenges = [] } = useAcademicChallenges(selectedClassId, latestClassStat?.id)
  const createChallenge = useCreateAcademicChallenge()

  const handleRecordChallengeSubmit = async () => {
    if (!challengeStudent || !challengeForm.description) return
    await createChallenge.mutateAsync({
      class_id: selectedClassId,
      term_id: latestClassStat?.id,
      student_id: challengeStudent.id,
      subject_name: challengeForm.subject_name,
      teacher_name: challengeForm.teacher_name,
      description: challengeForm.description
    })
    setIsRecordChallengeOpen(false)
    setChallengeForm({ subject_name: '', teacher_name: '', description: '' })
    setChallengeStudent(null)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _perfFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes _perfFadeIn { from{opacity:0} to{opacity:1} }
        .perf-row:hover { background: ${T.bg} !important; }
        .std-item:hover { background: ${T.bg}; color: ${T.primary}; }
        .mode-btn { transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
        .struggle-item { cursor: pointer; transition: all 0.2s; }
        .struggle-item:hover { transform: translateX(5px); background: #fff1f2; }
        @media print {
            .no-print { display: none !important; }
            .support-doc { padding: 40px !important; border: none !important; box-shadow: none !important; }
        }
      `}</style>

      <div style={{ fontFamily: '"DM Sans",sans-serif', animation: '_perfFadeIn 0.5s ease', maxWidth: 1400, margin: '0 auto' }}>
        
        {/* Header Section */}
        <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }} className="no-print">
          <div>
            <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 28, fontWeight: 700, color: T.slate, margin: 0 }}>Performance Hub</h1>
            <p style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>
              {viewMode === 'student' ? 'Individual Student Academic Analysis' : 'Collective Class Growth Tracking'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            {/* Mode Toggle */}
            <div style={{ background: '#fff', padding: 4, borderRadius: 14, border: `1.5px solid ${T.border}`, display: 'flex', gap: 4 }}>
              <button onClick={() => { setViewMode('student'); setSearchQuery(''); setSelectedStudentId(''); }} 
                className="mode-btn"
                style={{ 
                  padding: '8px 16px', borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  background: viewMode === 'student' ? T.primary : 'transparent',
                  color: viewMode === 'student' ? '#fff' : T.muted,
                  display: 'flex', alignItems: 'center', gap: 8
                }}>
                <User size={14} /> Student View
              </button>
              <button onClick={() => { setViewMode('class'); setSearchQuery(''); setSelectedClassId(''); }} 
                className="mode-btn"
                style={{ 
                  padding: '8px 16px', borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  background: viewMode === 'class' ? T.primary : 'transparent',
                  color: viewMode === 'class' ? '#fff' : T.muted,
                  display: 'flex', alignItems: 'center', gap: 8
                }}>
                <Users size={14} /> Class View
              </button>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', width: 280 }}>
               <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.muted }}>
                  <Search size={18} />
               </div>
               <input 
                  type="text"
                  placeholder={viewMode === 'student' ? "Search student..." : "Search class..."}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px 10px 40px', borderRadius: 12, border: `1.5px solid ${T.border}`, outline: 'none', background: '#fff', fontSize: 13 }}
               />
               
               {/* Search Results */}
               {searchQuery && (
                 <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, background: '#fff', borderRadius: 12, border: `1.5px solid ${T.border}`, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', zIndex: 100, padding: 6 }}>
                    {viewMode === 'student' ? filteredStudents.map(s => (
                      <div key={s.id} className="std-item" onClick={() => { setSelectedStudentId(s.id); setSearchQuery(''); }}
                        style={{ padding: '8px 12px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'all .15s' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: T.primary + '15', color: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>{s.full_name.charAt(0)}</div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>{s.full_name}</div>
                          <div style={{ fontSize: 10, color: T.muted }}>{s.student_id} · {s.class?.name}</div>
                        </div>
                      </div>
                    )) : filteredClasses.map(c => (
                      <div key={c.id} className="std-item" onClick={() => { setSelectedClassId(c.id); setSearchQuery(''); }}
                        style={{ padding: '8px 12px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: T.accent + '15', color: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}><Users size={14} /></div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{c.name}</div>
                      </div>
                    ))}
                    {((viewMode === 'student' && filteredStudents.length === 0) || (viewMode === 'class' && filteredClasses.length === 0)) && (
                      <div style={{ padding: '12px', fontSize: 12, color: T.muted, textAlign: 'center' }}>No results found</div>
                    )}
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* ── Empty State ── */}
        {((viewMode === 'student' && !selectedStudent) || (viewMode === 'class' && !selectedClass)) && !loadingHistory && (
          <div style={{ height: '54vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: 28, border: `1.5px solid ${T.border}` }} className="no-print">
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
               {viewMode === 'student' ? <User size={40} color={T.primary} /> : <Users size={40} color={T.primary} />}
            </div>
            <h2 style={{ fontFamily: '"Playfair Display",serif', fontSize: 20, fontWeight: 700, color: T.slate, margin: '0 0 8px' }}>
              Select a {viewMode === 'student' ? 'student' : 'class'} to analyze
            </h2>
            <p style={{ fontSize: 14, color: T.muted, textAlign: 'center', maxWidth: 400 }}>
              Use the search bar above to generate a {viewMode === 'student' ? 'personal dossier' : 'class performance report'} with historical data.
            </p>
          </div>
        )}

        {/* ── Loading State ── */}
        {loadingHistory && (
          <div style={{ height: '54vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', border: '4px solid #ede9fe', borderTopColor: T.primary, animation: 'spin .8s linear infinite' }} />
            <p style={{ fontSize: 13, color: T.muted, marginTop: 16, fontWeight: 600 }}>Synthesizing historical records...</p>
          </div>
        )}

        {/* ── STUDENT VIEW ── */}
        {viewMode === 'student' && selectedStudent && !loadingHistory && (
          <div style={{ animation: '_perfFadeUp 0.5s ease both' }}>
            
            <div style={{ background: 'linear-gradient(135deg, #1e0646 0%, #3b0764 100%)', borderRadius: 24, padding: '30px', color: '#fff', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 24, position: 'relative', overflow: 'hidden' }}>
               <div style={{ position: 'absolute', right: -20, top: -20, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
               <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 800 }}>
                  {selectedStudent.full_name.charAt(0)}
               </div>
               <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                    <h2 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, margin: 0 }}>{selectedStudent.full_name}</h2>
                    <span style={{ fontSize: 11, fontWeight: 800, background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: 99, textTransform: 'uppercase' }}>{selectedStudent.student_id}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                    <span>🏫 <strong>{selectedStudent.class?.name || 'No Class'}</strong></span>
                    <span>🚻 <strong>{selectedStudent.gender === 'male' ? 'Male' : 'Female'}</strong></span>
                  </div>
               </div>
               <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>All-Time Average</div>
                  <div style={{ fontSize: 42, fontWeight: 900, color: T.accent, lineHeight: 1 }}>{avgOverall}%</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Over {reportHistory.length} Terms</div>
               </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 18, marginBottom: 24 }}>
               <MetricCard label="Latest Avg" value={latestReport?.average_score ? `${latestReport.average_score.toFixed(1)}%` : '—'} icon={TrendingUp} color={T.primary} subValue={`Term: ${latestReport?.term?.name || '—'}`} />
               <MetricCard label="Class Rank" value={latestReport?.overall_position ? `#${latestReport.overall_position}` : '—'} icon={Award} color={T.accent} subValue={`Class: ${selectedStudent.class?.name}`} />
               <MetricCard label="Path" value={reportHistory.length < 2 ? 'New' : reportHistory[0].average_score < (latestReport?.average_score || 0) ? 'Improving' : 'Stagnant'} icon={LayoutDashboard} color={T.success} subValue="Trajectory" />
               <MetricCard label="Reports" value={reportHistory.length} icon={BookOpen} color={T.secondary} subValue="Historical count" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24, marginBottom: 24 }}>
               <div style={{ background: '#fff', borderRadius: 24, padding: '24px', border: `1.5px solid ${T.border}` }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: T.slate, marginBottom: 24 }}>Academic Growth Curve</h3>
                  <div style={{ height: 320 }}>
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={growthData}>
                           <defs><linearGradient id="cAvg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.primary} stopOpacity={0.1}/><stop offset="95%" stopColor={T.primary} stopOpacity={0}/></linearGradient></defs>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                           <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: T.muted }} />
                           <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: T.muted }} domain={[0, 100]} />
                           <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }} />
                           <Area type="monotone" dataKey="average" stroke={T.primary} strokeWidth={3} fill="url(#cAvg)" />
                        </AreaChart>
                     </ResponsiveContainer>
                  </div>
               </div>
               <div style={{ background: '#fff', borderRadius: 24, padding: '24px', border: `1.5px solid ${T.border}` }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: T.slate, marginBottom: 24 }}>Ranking History</h3>
                  <div style={{ height: 320 }}>
                     <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={rankData}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                           <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: T.muted }} />
                           <YAxis reversed axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: T.muted }} />
                           <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }} />
                           <Line type="monotone" dataKey="rank" stroke={T.accent} strokeWidth={3} dot={{ r: 5, fill: T.accent, stroke: '#fff' }} />
                        </LineChart>
                     </ResponsiveContainer>
                  </div>
               </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 24, padding: '24px', border: `1.5px solid ${T.border}`, overflow: 'hidden' }}>
               <h3 style={{ fontSize: 15, fontWeight: 700, color: T.slate, marginBottom: 20 }}>Transcript Summary</h3>
               <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: T.bg, borderBottom: `1.5px solid ${T.border}` }}>
                      {['Term', 'Academic Year', 'Average', 'Position', 'Grade', ''].map(h => (
                        <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.primary, textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportHistory.slice().reverse().map(r => {
                      const g = getGradeInfo(r.average_score || 0)
                      return (
                        <tr key={r.id} className="perf-row" style={{ borderBottom: `1px solid ${T.border}` }}>
                          <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 700 }}>{r.term?.name}</td>
                          <td style={{ padding: '14px 20px', fontSize: 12, color: T.muted }}>{r.academic_year?.name}</td>
                          <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 800, color: g.color }}>{(r.average_score || 0).toFixed(1)}%</td>
                          <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 600 }}>{ordinal(r.overall_position || 0)} / {r.total_students}</td>
                          <td style={{ padding: '14px 20px' }}>
                             <span style={{ padding: '3px 10px', borderRadius: 8, background: `${g.color}14`, color: g.color, fontSize: 11, fontWeight: 800 }}>{g.grade}</span>
                          </td>
                          <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                            <button onClick={() => window.location.href = `/admin/reports?student=${selectedStudentId}&term=${r.term_id}`}
                                    style={{ background: 'none', border: 'none', color: T.primary, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>View <ChevronRight size={14} style={{ verticalAlign: 'middle' }} /></button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
               </table>
            </div>

          </div>
        )}

        {/* ── CLASS VIEW ── */}
        {viewMode === 'class' && selectedClass && !loadingHistory && (
          <div style={{ animation: '_perfFadeUp 0.5s ease both' }}>
            
            <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', borderRadius: 24, padding: '30px', color: '#fff', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 24, position: 'relative', overflow: 'hidden' }}>
               <div style={{ position: 'absolute', right: -20, top: -20, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
               <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 800 }}>
                  <Users size={32} />
               </div>
               <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                    <h2 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, margin: 0 }}>Class: {selectedClass.name}</h2>
                    <span style={{ fontSize: 11, fontWeight: 800, background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: 99, textTransform: 'uppercase' }}>Level: {selectedClass.level || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                    <span>👤 <strong>{latestClassStat?.count || 0} Students</strong></span>
                    <span>📊 <strong>{classHistory.length} Terms History</strong></span>
                  </div>
               </div>
               <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Current Class Avg</div>
                  <div style={{ fontSize: 42, fontWeight: 900, color: T.accent, lineHeight: 1 }}>{latestClassStat?.average || 0}%</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Pass Rate: {latestClassStat?.passRate || 0}%</div>
               </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 18, marginBottom: 24 }}>
               <MetricCard label="Cohort Avg" value={`${latestClassStat?.average || 0}%`} icon={TrendingUp} color={T.primary} subValue="Aggregate mean" />
               <MetricCard label="Pass Rate" value={`${latestClassStat?.passRate || 0}%`} icon={Percent} color={T.success} subValue="Students above 50%" />
               <MetricCard label="Top Score" value={topPerformers[0]?.average_score ? `${topPerformers[0].average_score.toFixed(1)}%` : '—'} icon={Award} color={T.accent} subValue={topPerformers[0]?.student?.full_name || 'N/A'} />
               <MetricCard label="Stability" value={classHistory.length < 2 ? 'New' : classHistory[0].average < (latestClassStat?.average || 0) ? 'Rising' : 'Declining'} icon={LayoutDashboard} color={T.secondary} subValue="Historical Path" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
               {/* Class Growth Curve */}
               <div style={{ background: '#fff', borderRadius: 24, padding: '24px', border: `1.5px solid ${T.border}` }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: T.slate, marginBottom: 24 }}>Collective Class Growth</h3>
                  <div style={{ height: 320 }}>
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={classGrowthData}>
                           <defs><linearGradient id="cGr" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.primary} stopOpacity={0.1}/><stop offset="95%" stopColor={T.primary} stopOpacity={0}/></linearGradient></defs>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                           <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: T.muted }} />
                           <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: T.muted }} />
                           <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }} />
                           <Area type="monotone" dataKey="average" stroke={T.primary} strokeWidth={3} fill="url(#cGr)" name="Class Average" />
                        </AreaChart>
                     </ResponsiveContainer>
                  </div>
               </div>

               {/* Top Performers Bar Chart */}
               <div style={{ background: '#fff', borderRadius: 24, padding: '24px', border: `1.5px solid ${T.border}` }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: T.slate, marginBottom: 24 }}>Top Performers (Latest Term)</h3>
                  <div style={{ height: 320 }}>
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topPerformers.map(t => ({ name: t.student?.full_name.split(' ')[0], score: t.average_score }))}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                           <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: T.muted, fontWeight: 600 }} />
                           <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: T.muted }} />
                           <Tooltip />
                           <Bar dataKey="score" fill={T.accent} radius={[6, 6, 0, 0]} barSize={40}>
                              {topPerformers.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                           </Bar>
                        </BarChart>
                     </ResponsiveContainer>
                  </div>
               </div>
            </div>

            {/* Least Performing & Struggle Subjects */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24, marginBottom: 24 }}>
                <div style={{ background: '#fff', borderRadius: 24, border: `1.5px solid ${T.border}`, overflow: 'hidden' }}>
                    <div style={{ padding: '20px 24px', borderBottom: `1.5px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: T.slate, margin: 0 }}>Students Requiring Academic Support</h3>
                        <span style={{ fontSize: 11, fontWeight: 800, color: T.danger, background: '#fef2f2', padding: '4px 10px', borderRadius: 99 }}>Least Performing</span>
                    </div>
                    <div style={{ padding: '12px' }}>
                        {leastPerformers.map((p, idx) => (
                            <div key={p.id} 
                                 className="struggle-item"
                                 onClick={() => setExpandedStruggleId(expandedStruggleId === p.id ? null : p.id)}
                                 style={{ padding: '16px', borderRadius: 16, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 16, background: expandedStruggleId === p.id ? '#fef2f2' : 'transparent' }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#fee2e2', color: T.danger, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800 }}>
                                    {p.student?.full_name?.charAt(0)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: T.slate }}>{p.student?.full_name}</div>
                                    <div style={{ fontSize: 11, color: T.muted }}>ID: {p.student?.student_id}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: 16, fontWeight: 800, color: T.danger }}>{p.average_score?.toFixed(1)}%</div>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: T.muted }}>Avg Score</div>
                                </div>
                                <ChevronRight size={18} color={T.muted} style={{ transform: expandedStruggleId === p.id ? 'rotate(90deg)' : 'none', transition: 'all 0.3s' }} />
                                
                                {expandedStruggleId === p.id && (
                                    <div style={{ position: 'absolute', right: 60, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', animation: '_perfFadeIn 0.3s ease' }}>
                                        <div style={{ background: T.danger, color: '#fff', padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 800, boxShadow: '0 4px 12px rgba(220,38,38,0.2)' }}>
                                            Struggle: {p.worstSubject}
                                        </div>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setChallengeStudent(p.student); setChallengeForm(f => ({...f, subject_name: p.worstSubject})); setIsRecordChallengeOpen(true); }}
                                            style={{ padding: '6px 12px', borderRadius: 8, background: '#fff', color: T.danger, border: `1.5px solid ${T.danger}`, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                                            Record Challenge
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ background: '#fff', borderRadius: 24, padding: '24px', border: `1.5px solid ${T.border}`, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fff1f2', color: T.danger, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                        <Percent size={32} />
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: T.slate, margin: '0 0 8px' }}>Action Required</h3>
                    <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.5, maxWidth: 220 }}>
                        Identified {leastPerformers.length} students currently below the stability threshold. Targeted intervention in their struggle subjects is recommended.
                    </p>
                    <button 
                        onClick={() => setIsSupportPlanOpen(true)}
                        style={{ marginTop: 24, width: '100%', padding: '12px', borderRadius: 12, background: T.slate, color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                        Generate Support Plan
                    </button>
                    <button 
                        onClick={() => setIsChallengesReportOpen(true)}
                        style={{ marginTop: 12, width: '100%', padding: '12px', borderRadius: 12, background: '#fff', color: T.slate, border: `1.5px solid ${T.slate}`, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                        Class Challenges Report
                    </button>
                </div>
            </div>

            {/* Class History Table */}
            <div style={{ background: '#fff', borderRadius: 24, border: `1.5px solid ${T.border}`, overflow: 'hidden' }}>
               <div style={{ padding: '20px 24px', borderBottom: `1.5px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: T.slate, margin: 0 }}>Class Temporal History</h3>
               </div>
               <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                     <tr style={{ background: T.bg, borderBottom: `1.5px solid ${T.border}` }}>
                        {['Term', 'Year', 'Class Avg', 'Pass Rate', 'Student Count', 'Status'].map(h => (
                           <th key={h} style={{ padding: '14px 24px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.primary, textTransform: 'uppercase' }}>{h}</th>
                        ))}
                     </tr>
                  </thead>
                  <tbody>
                     {classHistory.slice().reverse().map((h, i) => (
                        <tr key={h.id} className="perf-row" style={{ borderBottom: `1px solid ${T.border}` }}>
                           <td style={{ padding: '14px 24px', fontSize: 13, fontWeight: 700 }}>{h.name}</td>
                           <td style={{ padding: '14px 24px', fontSize: 12, color: T.muted }}>{h.year}</td>
                           <td style={{ padding: '14px 24px', fontSize: 14, fontWeight: 800 }}>{h.average}%</td>
                           <td style={{ padding: '14px 24px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                 <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 9, overflow: 'hidden' }}>
                                    <div style={{ width: `${h.passRate}%`, height: '100%', background: T.success }} />
                                 </div>
                                 <span style={{ fontSize: 12, fontWeight: 700, color: T.muted }}>{h.passRate}%</span>
                              </div>
                           </td>
                           <td style={{ padding: '14px 24px', fontSize: 13 }}>{h.count} Students</td>
                           <td style={{ padding: '14px 24px' }}>
                              <span style={{ padding: '4px 12px', borderRadius: 10, background: h.passRate > 80 ? '#f0fdf4' : h.passRate > 60 ? '#fffbeb' : '#fef2f2', color: h.passRate > 80 ? '#16a34a' : h.passRate > 60 ? '#d97706' : '#dc2626', fontSize: 11, fontWeight: 800 }}>
                                 {h.passRate > 80 ? 'EXCELLENT' : h.passRate > 60 ? 'STABLE' : 'CRITICAL'}
                              </span>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>

          </div>
        )}

        {/* Support Plan Modal */}
        <Modal 
            open={isSupportPlanOpen} 
            onClose={() => setIsSupportPlanOpen(false)}
            title="Academic Support Strategy"
            subtitle={`Class: ${selectedClass?.name || '—'} · ${latestClassStat?.name || '—'}`}
            size="lg"
            footer={
                <>
                    <button style={{ padding: '8px 16px', borderRadius: 10, border: '1.5px solid #f0eefe', background: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }} onClick={() => setIsSupportPlanOpen(false)}>Close</button>
                    <button 
                        onClick={() => window.print()}
                        style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: T.primary, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Printer size={16} /> Print Support Plan
                    </button>
                </>
            }
        >
            <div className="support-doc" style={{ padding: '10px 0' }}>
                <div style={{ textAlign: 'center', marginBottom: 32, borderBottom: `2.5px solid ${T.slate}`, paddingBottom: 24 }}>
                    <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 24, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Academic Intervention & Strategy</h1>
                    <p style={{ fontSize: 12, color: T.muted, textTransform: 'uppercase', fontWeight: 800 }}>Confidential Official Document</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginBottom: 32 }}>
                    <div style={{ padding: '16px', background: T.bg, borderRadius: 12 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: T.primary, textTransform: 'uppercase', marginBottom: 8 }}>Class Details</div>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{selectedClass?.name}</div>
                        <div style={{ fontSize: 12, color: T.muted }}>{latestClassStat?.year} · {latestClassStat?.name}</div>
                    </div>
                    <div style={{ padding: '16px', background: '#fffbeb', borderRadius: 12 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#d97706', textTransform: 'uppercase', marginBottom: 8 }}>Support Target</div>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{leastPerformers.length} Identified Students</div>
                        <div style={{ fontSize: 12, color: T.muted }}>Targeting stability recovery</div>
                    </div>
                </div>

                <h3 style={{ fontSize: 15, fontWeight: 800, color: T.slate, marginBottom: 16, paddingLeft: 8, borderLeft: `4px solid ${T.danger}` }}>Student Intervention Matrix</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 40 }}>
                    <thead>
                        <tr style={{ borderBottom: `2px solid ${T.slate}` }}>
                            {['Student Name', 'ID', 'Avg', 'Struggle Subject', 'Recommended Action'].map(h => (
                                <th key={h} style={{ padding: '12px 8px', textAlign: 'left', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {leastPerformers.map(p => (
                            <tr key={p.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                                <td style={{ padding: '16px 8px', fontSize: 13, fontWeight: 700 }}>{p.student?.full_name}</td>
                                <td style={{ padding: '16px 8px', fontSize: 11, color: T.muted }}>{p.student?.student_id}</td>
                                <td style={{ padding: '16px 8px', fontSize: 13, fontWeight: 800, color: T.danger }}>{p.average_score?.toFixed(1)}%</td>
                                <td style={{ padding: '16px 8px', fontSize: 12, fontWeight: 700 }}>{p.worstSubject}</td>
                                <td style={{ padding: '16px 8px', fontSize: 11, lineHeight: 1.4 }}>
                                    {p.average_score < 30 ? 'Intensive 1-on-1 coaching & urgent parent-teacher review requested.' : 'Subject-specific remedial classes and peer mentoring recommended.'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div style={{ borderTop: `1px dashed ${T.border}`, paddingTop: 32 }}>
                    <div style={{ fontSize: 13, color: T.muted, marginBottom: 40, lineHeight: 1.6 }}>
                        <strong>Strategy Note:</strong> Faculty are advised to monitor the progress of the above-listed students over the next 4 weeks. Teachers of the specified "Struggle Subjects" should provide simplified worksheets and conduct weekly check-ins.
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div style={{ width: 220 }}>
                            <div style={{ borderBottom: '1px solid #111827', height: 40 }} />
                            <div style={{ fontSize: 11, fontWeight: 700, marginTop: 8 }}>Class Master Signature</div>
                        </div>
                        <div style={{ width: 220 }}>
                            <div style={{ borderBottom: '1px solid #111827', height: 40 }} />
                            <div style={{ fontSize: 11, fontWeight: 700, marginTop: 8 }}>Academic Head / Principal</div>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
        {/* Record Challenge Modal */}
        <Modal
            open={isRecordChallengeOpen}
            onClose={() => setIsRecordChallengeOpen(false)}
            title="Record Academic Challenge"
            subtitle={`Student: ${challengeStudent?.full_name || '—'} · Class: ${selectedClass?.name || '—'}`}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: T.slate, marginBottom: 6 }}>Subject Name</label>
                    <input 
                        type="text" 
                        value={challengeForm.subject_name}
                        onChange={e => setChallengeForm({...challengeForm, subject_name: e.target.value})}
                        placeholder="e.g. Mathematics"
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1.5px solid ${T.border}`, outline: 'none', fontSize: 13 }}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: T.slate, marginBottom: 6 }}>Teacher Consulted (Optional)</label>
                    <input 
                        type="text" 
                        value={challengeForm.teacher_name}
                        onChange={e => setChallengeForm({...challengeForm, teacher_name: e.target.value})}
                        placeholder="e.g. Mr. Smith"
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1.5px solid ${T.border}`, outline: 'none', fontSize: 13 }}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: T.slate, marginBottom: 6 }}>Challenge Description</label>
                    <textarea 
                        value={challengeForm.description}
                        onChange={e => setChallengeForm({...challengeForm, description: e.target.value})}
                        placeholder="Describe the academic struggle..."
                        rows={4}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1.5px solid ${T.border}`, outline: 'none', fontSize: 13, resize: 'vertical' }}
                    />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                    <button style={{ padding: '10px 16px', borderRadius: 8, border: `1.5px solid ${T.border}`, background: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }} onClick={() => setIsRecordChallengeOpen(false)}>Cancel</button>
                    <button 
                        onClick={handleRecordChallengeSubmit}
                        disabled={createChallenge.isPending || !challengeForm.description}
                        style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: !challengeForm.description ? T.muted : T.primary, color: '#fff', fontSize: 13, fontWeight: 700, cursor: !challengeForm.description ? 'not-allowed' : 'pointer' }}>
                        {createChallenge.isPending ? 'Saving...' : 'Save Challenge'}
                    </button>
                </div>
            </div>
        </Modal>

        {/* Class Challenges Report Modal */}
        <Modal
            open={isChallengesReportOpen}
            onClose={() => setIsChallengesReportOpen(false)}
            title="Class Challenges Report"
            subtitle={`Class: ${selectedClass?.name || '—'} · Current Term Struggles`}
            size="lg"
            footer={
                <>
                    <button style={{ padding: '8px 16px', borderRadius: 10, border: '1.5px solid #f0eefe', background: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }} onClick={() => setIsChallengesReportOpen(false)}>Close</button>
                    <button 
                        onClick={() => window.print()}
                        style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: T.primary, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Printer size={16} /> Print Report
                    </button>
                </>
            }
        >
            <div className="support-doc" style={{ padding: '10px 0' }}>
                <div style={{ textAlign: 'center', marginBottom: 32, borderBottom: `2.5px solid ${T.slate}`, paddingBottom: 24 }}>
                    <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 24, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Academic Challenges Report</h1>
                    <p style={{ fontSize: 12, color: T.muted, textTransform: 'uppercase', fontWeight: 800 }}>Confidential Official Document</p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32 }}>
                    <div>
                        <div style={{ fontSize: 10, fontWeight: 800, color: T.primary, textTransform: 'uppercase', marginBottom: 4 }}>Class</div>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{selectedClass?.name}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: T.primary, textTransform: 'uppercase', marginBottom: 4 }}>Total Recorded</div>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{classChallenges.length} Struggles</div>
                    </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 40 }}>
                    <thead>
                        <tr style={{ borderBottom: `2px solid ${T.slate}` }}>
                            {['Student', 'Subject', 'Teacher', 'Challenge Description', 'Date'].map(h => (
                                <th key={h} style={{ padding: '12px 8px', textAlign: 'left', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {classChallenges.map((c: any) => (
                            <tr key={c.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                                <td style={{ padding: '16px 8px', fontSize: 13, fontWeight: 700 }}>
                                    {c.student?.full_name}
                                    <div style={{ fontSize: 10, color: T.muted, fontWeight: 500 }}>ID: {c.student?.student_id}</div>
                                </td>
                                <td style={{ padding: '16px 8px', fontSize: 12, fontWeight: 700 }}>{c.subject_name || '—'}</td>
                                <td style={{ padding: '16px 8px', fontSize: 12, color: T.muted }}>{c.teacher_name || '—'}</td>
                                <td style={{ padding: '16px 8px', fontSize: 12, lineHeight: 1.5, maxWidth: 300 }}>{c.description}</td>
                                <td style={{ padding: '16px 8px', fontSize: 11, color: T.muted }}>{new Date(c.created_at).toLocaleDateString()}</td>
                            </tr>
                        ))}
                        {classChallenges.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ padding: '32px 8px', textAlign: 'center', fontSize: 13, color: T.muted }}>
                                    No challenges have been recorded for this class in the current term.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Modal>

      </div>
    </>
  )
}
