// src/pages/admin/AdminTestAnalytics.tsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useCurrentTerm } from '../../hooks/useSettings'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'
import { Search, Filter, TrendingUp, Users, BookOpen, AlertCircle } from 'lucide-react'

export default function AdminTestAnalytics() {
  const { data: term } = useCurrentTerm()
  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  
  const [testData, setTestData] = useState<any[]>([])
  const [studentStats, setStudentStats] = useState<any[]>([])

  useEffect(() => {
    loadMetadata()
  }, [])

  useEffect(() => {
    if (selectedClass && selectedSubject && term?.id) {
      loadAnalytics()
    }
  }, [selectedClass, selectedSubject, term?.id])

  async function loadMetadata() {
    const [{ data: cls }, { data: sub }] = await Promise.all([
      supabase.from('classes').select('id, name').order('name'),
      supabase.from('subjects').select('id, name').order('name')
    ])
    setClasses(cls ?? [])
    setSubjects(sub ?? [])
    setLoading(false)
  }

  async function loadAnalytics() {
    setLoading(true)
    try {
      // 1. Get all tests for this context
      const { data: tests } = await supabase
        .from('class_tests')
        .select('*')
        .eq('class_id', selectedClass)
        .eq('subject_id', selectedSubject)
        .eq('term_id', term!.id)
        .order('test_date', { ascending: true })

      if (!tests || tests.length === 0) {
        setTestData([])
        setStudentStats([])
        return
      }

      const testIds = tests.map(t => t.id)

      // 2. Get scores for these tests
      const { data: scores } = await supabase
        .from('class_test_scores')
        .select('*, student:students(full_name)')
        .in('test_id', testIds)

      // 3. Process test-wise averages for line chart
      const chartData = tests.map(test => {
        const testScores = scores?.filter(s => s.test_id === test.id) || []
        const avg = testScores.length 
          ? (testScores.reduce((sum, s) => sum + Number(s.score_attained), 0) / testScores.length)
          : 0
        const percentage = (avg / Number(test.max_score)) * 100
        return {
          name: test.title,
          avg: Number(percentage.toFixed(1)),
          rawAvg: Number(avg.toFixed(1)),
          date: new Date(test.test_date).toLocaleDateString()
        }
      })
      setTestData(chartData)

      // 4. Process student-wise performance for ranking
      const studentMap: Record<string, { name: string; totalAttained: number; totalMax: number }> = {}
      scores?.forEach(s => {
        const test = tests.find(t => t.id === s.test_id)
        if (!test) return
        if (!studentMap[s.student_id]) {
          studentMap[s.student_id] = { name: s.student?.full_name || 'Unknown', totalAttained: 0, totalMax: 0 }
        }
        studentMap[s.student_id].totalAttained += Number(s.score_attained)
        studentMap[s.student_id].totalMax += Number(test.max_score)
      })

      const studentData = Object.entries(studentMap).map(([id, stats]) => ({
        id,
        name: stats.name,
        avg: Number(((stats.totalAttained / stats.totalMax) * 100).toFixed(1))
      })).sort((a, b) => b.avg - a.avg)
      
      setStudentStats(studentData)

    } finally {
      setLoading(false)
    }
  }

  if (loading && classes.length === 0) return <div style={{ padding: 40 }}>Loading data...</div>

  return (
    <div style={{ padding: '24px', fontFamily: '"DM Sans", sans-serif', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', margin: 0 }}>Class Test Analytics</h1>
        <p style={{ color: '#64748b', marginTop: 4 }}>Detailed performance tracking across continuous assessments</p>
      </div>

      {/* Filters */}
      <div style={{ 
        background: '#fff', 
        borderRadius: 16, 
        padding: 20, 
        marginBottom: 24, 
        display: 'flex', 
        gap: 16, 
        flexWrap: 'wrap',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>Class</label>
          <div style={{ position: 'relative' }}>
            <select 
              value={selectedClass} 
              onChange={e => setSelectedClass(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', appearance: 'none', background: '#f8fafc', outline: 'none' }}
            >
              <option value="">Select Class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>Subject</label>
          <select 
            value={selectedSubject} 
            onChange={e => setSelectedSubject(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#f8fafc', outline: 'none' }}
          >
            <option value="">Select Subject</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {!selectedClass || !selectedSubject ? (
        <div style={{ padding: '80px 20px', textAlign: 'center', background: '#fff', borderRadius: 20, border: '1.5px dashed #e2e8f0' }}>
          <Search size={48} color="#94a3b8" style={{ marginBottom: 16 }} />
          <h3 style={{ color: '#1e293b', marginBottom: 8 }}>Ready to Analyze</h3>
          <p style={{ color: '#64748b' }}>Select a class and subject to view performance trends and student rankings.</p>
        </div>
      ) : testData.length === 0 ? (
        <div style={{ padding: '80px 20px', textAlign: 'center', background: '#fff', borderRadius: 20, border: '1.5px dashed #e2e8f0' }}>
          <AlertCircle size={48} color="#94a3b8" style={{ marginBottom: 16 }} />
          <h3 style={{ color: '#1e293b', marginBottom: 8 }}>No Tests Found</h3>
          <p style={{ color: '#64748b' }}>There are no class tests recorded for this subject in the current term.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 24 }}>
          
          {/* Trend Chart */}
          <div style={{ gridColumn: '1 / -1', background: '#fff', borderRadius: 20, padding: 24, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ padding: 8, background: '#f5f3ff', borderRadius: 10, color: '#7c3aed' }}>
                <TrendingUp size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Performance Trend (%)</h3>
            </div>
            <div style={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={testData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: 12 }}
                    itemStyle={{ fontSize: 13, fontWeight: 600 }}
                  />
                  <Line type="monotone" dataKey="avg" stroke="#7c3aed" strokeWidth={3} dot={{ r: 6, fill: '#7c3aed', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Student Performance Bar */}
          <div style={{ background: '#fff', borderRadius: 20, padding: 24, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ padding: 8, background: '#ecfdf5', borderRadius: 10, color: '#059669' }}>
                <Users size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Student Ranking (Avg %)</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {studentStats.slice(0, 10).map((s, idx) => (
                <div key={s.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: '#334155' }}>#{idx+1} {s.name}</span>
                    <span style={{ fontWeight: 800, color: s.avg >= 50 ? '#059669' : '#dc2626' }}>{s.avg}%</span>
                  </div>
                  <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${s.avg}%`, 
                      background: s.avg >= 80 ? '#10b981' : s.avg >= 60 ? '#3b82f6' : s.avg >= 40 ? '#f59e0b' : '#ef4444',
                      borderRadius: 4,
                      transition: 'width 1s ease-out'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Test Summaries */}
          <div style={{ background: '#fff', borderRadius: 20, padding: 24, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ padding: 8, background: '#eff6ff', borderRadius: 10, color: '#2563eb' }}>
                <BookOpen size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Test Summary</h3>
            </div>
            <div className="custom-table-wrap">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', fontSize: 11, color: '#64748b', padding: '8px 0', borderBottom: '1.5px solid #f1f5f9' }}>TEST</th>
                    <th style={{ textAlign: 'center', fontSize: 11, color: '#64748b', padding: '8px 0', borderBottom: '1.5px solid #f1f5f9' }}>MAX</th>
                    <th style={{ textAlign: 'center', fontSize: 11, color: '#64748b', padding: '8px 0', borderBottom: '1.5px solid #f1f5f9' }}>AVG</th>
                  </tr>
                </thead>
                <tbody>
                  {testData.map((test, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: '12px 0', fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{test.name}</td>
                      <td style={{ padding: '12px 0', textAlign: 'center', fontSize: 13, color: '#64748b' }}>{studentStats[0]?.totalMax || '—'}</td>
                      <td style={{ padding: '12px 0', textAlign: 'center' }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: test.avg >= 50 ? '#059669' : '#dc2626' }}>{test.avg}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
