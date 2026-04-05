import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts'

const COLORS = ['#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981']

export default function GlobalAnalyticsPage() {
  const { setFirstLoadComplete } = useAuthStore()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [topStudents, setTopStudents] = useState<any[]>([])
  const [topSchools, setTopSchools] = useState<any[]>([])

  useEffect(() => {
    loadStats()
    loadLeaderboards()

    // Realtime subscription for submissions, schools, and students
    const channel = supabase
      .channel('global_analytics_updates')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'global_quiz_submissions' 
      }, () => {
        loadLeaderboards()
      })
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'schools' 
      }, () => {
        loadStats()
      })
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'students' 
      }, () => {
        loadStats()
      })
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'teachers' 
      }, () => {
        loadStats()
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'global_resources' 
      }, () => {
        loadStats()
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'platform_messages' 
      }, () => {
        loadStats()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function loadStats() {
    setLoading(true)
    try {
      // Fetch platform-wide counts
      const [
        { count: schoolCount },
        { count: teacherCount },
        { count: studentCount },
        { count: resourceCount },
        { count: messageCount }
      ] = await Promise.all([
        supabase.from('schools').select('*', { count: 'exact', head: true }),
        supabase.from('teachers').select('*', { count: 'exact', head: true }),
        supabase.from('students').select('*', { count: 'exact', head: true }),
        supabase.from('global_resources').select('*', { count: 'exact', head: true }),
        supabase.from('platform_messages').select('*', { count: 'exact', head: true })
      ])

      // Fetch all schools and students with created_at to derive growth
      const { data: schoolsData } = await supabase.from('schools').select('created_at')
      const { data: studentsData } = await supabase.from('students').select('created_at')

      // Process growth data (group by month)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const growthMap = new Map<string, { name: string; schools: number; students: number; sortIdx: number }>()
      
      const now = new Date()
      // Initialize last 6 months
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const mName = months[d.getMonth()]
        growthMap.set(mName, { name: mName, schools: 0, students: 0, sortIdx: d.getTime() })
      }

      schoolsData?.forEach(s => {
        const d = new Date(s.created_at)
        const mName = months[d.getMonth()]
        if (growthMap.has(mName)) {
          growthMap.get(mName)!.schools++
        }
      })

      studentsData?.forEach(s => {
        const d = new Date(s.created_at)
        const mName = months[d.getMonth()]
        if (growthMap.has(mName)) {
          growthMap.get(mName)!.students++
        }
      })

      const growthArray = Array.from(growthMap.values()).sort((a,b) => a.sortIdx - b.sortIdx)

      // Fetch Resource distribution by type
      const { data: resources } = await supabase.from('global_resources').select('content_type')
      const resourceDist = (resources || []).reduce((acc: any, curr: any) => {
        acc[curr.content_type] = (acc[curr.content_type] || 0) + 1
        return acc
      }, {})
      
      const pieData = Object.entries(resourceDist).map(([name, value]) => ({ name: name.toUpperCase(), value }))

      setStats({
        counts: {
          schools: schoolCount || 0,
          teachers: teacherCount || 0,
          students: studentCount || 0,
          resources: resourceCount || 0,
          messages: messageCount || 0
        },
        growth: growthArray,
        pieData
      })
    } catch (err) {
      console.error('Analytics Error:', err)
    } finally {
      setLoading(false)
      setFirstLoadComplete(true)
    }
  }

  async function loadLeaderboards() {
    try {
      // 1. Fetch all submissions with student and school info
      const { data: submissions, error } = await supabase
        .from('global_quiz_submissions')
        .select(`
          score,
          student:students (
            full_name,
            school:schools (
              name
            )
          )
        `)

      if (error) throw error

      // 2. Aggregate Student Scores
      const studentMap = new Map<string, { name: string; school: string; score: number }>()
      const schoolMap = new Map<string, { name: string; score: number }>()

      submissions?.forEach((s: any) => {
        const studentName = s.student?.full_name || 'Unknown Student'
        const schoolName = s.student?.school?.name || 'Unknown School'
        const score = s.score || 0

        // Student aggregate
        if (!studentMap.has(studentName)) {
          studentMap.set(studentName, { name: studentName, school: schoolName, score: 0 })
        }
        studentMap.get(studentName)!.score += score

        // School aggregate
        if (!schoolMap.has(schoolName)) {
          schoolMap.set(schoolName, { name: schoolName, score: 0 })
        }
        schoolMap.get(schoolName)!.score += score
      })

      // 3. Sort and slice top 10
      const sortedStudents = Array.from(studentMap.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)

      const sortedSchools = Array.from(schoolMap.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)

      setTopStudents(sortedStudents)
      setTopSchools(sortedSchools)
    } catch (err) {
      console.error('Leaderboard Error:', err)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #f1f5f9', borderTopColor: '#0ea5e9', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ fontFamily: '"DM Sans",sans-serif' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 28, fontWeight: 700, color: '#1e293b', margin: 0 }}>Platform Intelligence</h1>
        <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>Deep insights across all registered schools and academic engagement.</p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 32 }}>
        {[
          { label: 'Registered Schools', value: stats.counts.schools, icon: '🏫', color: '#0ea5e9' },
          { label: 'Total Teachers', value: stats.counts.teachers, icon: '👨‍🏫', color: '#8b5cf6' },
          { label: 'Total Students', value: stats.counts.students, icon: '🎓', color: '#ec4899' },
          { label: 'Library Assets', value: stats.counts.resources, icon: '📚', color: '#10b981' },
          { label: 'Platform Messages', value: stats.counts.messages, icon: '💬', color: '#f59e0b' }
        ].map(card => (
          <div key={card.label} style={{ background: '#fff', padding: 24, borderRadius: 20, border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: 24, marginBottom: 12 }}>{card.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>
        {/* Growth Chart */}
        <div style={{ background: '#fff', padding: 24, borderRadius: 24, border: '1px solid #f1f5f9' }}>
           <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 24 }}>Platform Growth Trend</h3>
           <div style={{ height: 350 }}>
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={stats.growth}>
                 <defs>
                   <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                     <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                 <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                 <Tooltip 
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                 />
                 <Area type="monotone" dataKey="students" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorStudents)" />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Resource Distribution */}
        <div style={{ background: '#fff', padding: 24, borderRadius: 24, border: '1px solid #f1f5f9' }}>
           <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 24 }}>Library Distribution</h3>
           <div style={{ height: 350, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
             <ResponsiveContainer width="100%" height="250">
               <PieChart>
                 <Pie
                   data={stats.pieData}
                   innerRadius={60}
                   outerRadius={80}
                   paddingAngle={5}
                   dataKey="value"
                 >
                   {stats.pieData.map((entry: any, index: number) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                 </Pie>
                 <Tooltip />
               </PieChart>
             </ResponsiveContainer>
             
             <div style={{ width: '100%', marginTop: 20 }}>
                {stats.pieData.map((d: any, i: number) => (
                  <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{d.name}</span>
                     </div>
                     <span style={{ fontSize: 12, fontWeight: 800, color: '#1e293b' }}>{d.value}</span>
                  </div>
                ))}
             </div>
           </div>
        </div>
      </div>

      {/* Leaderboards Section */}
      <div style={{ marginTop: 40 }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: '"Playfair Display",serif', fontSize: 24, fontWeight: 700, color: '#1e293b', margin: 0 }}>🌍 Global Leaderboards</h2>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Realtime performance tracking across the entire network.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Top Students */}
          <div style={{ background: '#fff', padding: 24, borderRadius: 24, border: '1.5px solid #f1f5f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: 0 }}>🏆 Top 10 Students</h3>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#10b981', background: '#f0fdf4', padding: '4px 8px', borderRadius: 99, textTransform: 'uppercase' }}>Live Updates</span>
            </div>
            
            {topStudents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 13 }}>No submissions yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {topStudents.map((s, i) => (
                  <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 16, background: i === 0 ? '#f5f3ff' : 'transparent', border: i === 0 ? '1px solid #ddd6fe' : '1px solid #f8fafc' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: i === 0 ? '#7c3aed' : i === 1 ? '#8b5cf6' : i === 2 ? '#a78bfa' : '#f1f5f9', color: i < 3 ? '#fff' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{s.school}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#7c3aed' }}>{s.score}</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Points</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Schools */}
          <div style={{ background: '#fff', padding: 24, borderRadius: 24, border: '1.5px solid #f1f5f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: 0 }}>🏛️ Top 10 Schools</h3>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#10b981', background: '#f0fdf4', padding: '4px 8px', borderRadius: 99, textTransform: 'uppercase' }}>Live Updates</span>
            </div>

            {topSchools.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 13 }}>No submissions yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {topSchools.map((s, i) => (
                  <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 16, background: i === 0 ? '#f0f9ff' : 'transparent', border: i === 0 ? '1px solid #bae6fd' : '1px solid #f8fafc' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: i === 0 ? '#0ea5e9' : i === 1 ? '#38bdf8' : i === 2 ? '#7dd3fc' : '#f1f5f9', color: i < 3 ? '#fff' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{s.name}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#0ea5e9' }}>{s.score}</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Points</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
