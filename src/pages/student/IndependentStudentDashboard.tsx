// src/pages/student/IndependentStudentDashboard.tsx
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { toast } from 'react-hot-toast'

const WORLD_UNI_SCHOOL_ID = '392a6abc-8f9b-44dd-a4bd-adf1cfc19dd5'

const GRADES = [
  { label: 'Grade 1 (Basic 1)', value: 'G1', emoji: '🌱' },
  { label: 'Grade 2 (Basic 2)', value: 'G2', emoji: '🌿' },
  { label: 'Grade 3 (Basic 3)', value: 'G3', emoji: '🌳' },
  { label: 'Grade 4 (Basic 4)', value: 'G4', emoji: '📗' },
  { label: 'Grade 5 (Basic 5)', value: 'G5', emoji: '📘' },
  { label: 'Grade 6 (Basic 6)', value: 'G6', emoji: '📙' },
  { label: 'Grade 7 (JHS 1)',   value: 'G7', emoji: '📕' },
  { label: 'Grade 8 (JHS 2)',   value: 'G8', emoji: '🏫' },
  { label: 'Grade 9 (JHS 3)',   value: 'G9', emoji: '🎓' },
]

function GradeSetup({ onSave }: { onSave: (grade: string) => void }) {
  const [selected, setSelected] = useState('')

  return (
    <div className="flex items-center justify-center min-h-[80vh] p-6 font-sans">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-10 max-w-lg w-full text-center">
        <div className="text-5xl mb-4">🎓</div>
        <h1 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">
          Welcome to World Uni-Learn!
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
          Choose your grade level so we can show you the right lessons and quizzes.
        </p>
        <div className="grid grid-cols-3 gap-3 mb-8">
          {GRADES.map(g => (
            <button
              key={g.value}
              onClick={() => setSelected(g.value)}
              className={`p-4 rounded-xl border-2 transition-all text-center ${
                selected === g.value 
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10' 
                  : 'border-slate-200 dark:border-slate-700 hover:border-amber-500/50'
              }`}
            >
              <div className="text-2xl mb-1">{g.emoji}</div>
              <div className={`text-xs font-bold ${selected === g.value ? 'text-amber-600 dark:text-amber-500' : 'text-slate-600 dark:text-slate-400'}`}>
                {g.label.split(' (')[0]}
              </div>
            </button>
          ))}
        </div>
        <button
          disabled={!selected}
          onClick={() => onSave(selected)}
          className={`w-full py-4 rounded-xl font-bold transition-all ${
            selected 
              ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/20 cursor-pointer' 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
          }`}
        >
          Start Learning →
        </button>
      </div>
    </div>
  )
}

export default function IndependentStudentDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [grade, setGrade] = useState<string | null>(null)
  const [subjects, setSubjects] = useState<any[]>([])
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [quizScores, setQuizScores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'home' | 'subjects' | 'quizzes' | 'progress'>('home')
  const [mounted, setMounted] = useState(false)

  // Load saved grade from profile metadata or local storage
  useEffect(() => {
    const saved = localStorage.getItem(`wul_grade_${user?.id}`)
    if (saved) setGrade(saved)
    setTimeout(() => setMounted(true), 80)
  }, [user?.id])

  useEffect(() => {
    if (!grade) return
    loadContent()
  }, [grade])

  async function saveGrade(g: string) {
    localStorage.setItem(`wul_grade_${user?.id}`, g)
    setGrade(g)
  }

  async function loadContent() {
    setLoading(true)
    try {
      // Load subjects matching the grade prefix
      const { data: subs } = await supabase
        .from('subjects')
        .select('id, name, code')
        .like('name', `${grade} – %`)
        .order('name')
      setSubjects(subs || [])

      if (subs && subs.length > 0) {
        const subIds = subs.map((s: any) => s.id)

        // Load quizzes for this grade
        const { data: qz } = await supabase
          .from('global_quizzes')
          .select('id, title, description, duration_minutes, subject_id')
          .in('subject_id', subIds)
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(20)
        setQuizzes(qz || [])

        // Load quiz scores (quiz_attempts table if available)
        // Stored in global_quiz_attempts with user_id
        const { data: attempts } = await supabase
          .from('global_quiz_attempts')
          .select('quiz_id, score, completed_at')
          .eq('user_id', user?.id)
          .order('completed_at', { ascending: false })
        setQuizScores(attempts || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const gradeInfo = GRADES.find(g => g.value === grade)
  const totalQuizzesTaken = quizScores.length
  const avgScore = quizScores.length > 0 
    ? Math.round(quizScores.reduce((s: number, a: any) => s + (a.score || 0), 0) / quizScores.length) 
    : 0

  // Show grade picker on first visit
  if (!grade) {
    return <GradeSetup onSave={saveGrade} />
  }

  const TAB_STYLE = (tab: string) => `px-5 py-2.5 rounded-full text-sm font-bold transition-all cursor-pointer ${
    activeTab === tab 
      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' 
      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
  }`

  return (
    <div className={`space-y-6 max-w-5xl mx-auto pb-10 transition-opacity duration-400 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      
      {/* ── Top Controls ── */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          Showing content for: <span className="text-amber-600 dark:text-amber-500 ml-1">{gradeInfo?.emoji} {gradeInfo?.label}</span>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem(`wul_grade_${user?.id}`)
            setGrade(null)
          }}
          className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg transition-colors"
        >
          Change Grade
        </button>
      </div>

      <div className="space-y-8">

        {/* ── Hero Banner ── */}
        <div className="bg-gradient-to-br from-amber-500/10 to-indigo-500/10 border border-amber-500/20 rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-amber-500/5" />
          <div className="text-xs font-black text-amber-600 dark:text-amber-500 tracking-wider uppercase mb-2">
            🇬🇭 GES BECE STANDARD CURRICULUM
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 leading-tight">
            Good day, {user?.full_name?.split(' ')?.slice(0, 2).join(' ')}! 👋
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-sm mb-6 max-w-xl">
            You're in <strong className="text-amber-600 dark:text-amber-500">{gradeInfo?.label}</strong>. Explore {subjects.length} subjects with detailed BECE-standard lessons and mock exams.
          </p>
          <div className="flex gap-3 flex-wrap">
            <button onClick={() => setActiveTab('subjects')} className="px-6 py-3 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 shadow-lg shadow-amber-500/20 transition-all">
              📚 Browse Subjects
            </button>
            <button onClick={() => setActiveTab('quizzes')} className="px-6 py-3 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-white text-sm font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
              🧪 Take a Quiz
            </button>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: '📚', label: 'Subjects Available', value: subjects.length, colorClass: 'text-indigo-500', bgClass: 'bg-indigo-50 dark:bg-indigo-500/10', borderClass: 'border-indigo-100 dark:border-indigo-500/20' },
            { icon: '🧪', label: 'Quizzes Taken', value: totalQuizzesTaken, colorClass: 'text-emerald-500', bgClass: 'bg-emerald-50 dark:bg-emerald-500/10', borderClass: 'border-emerald-100 dark:border-emerald-500/20' },
            { icon: '🏆', label: 'Avg Quiz Score', value: totalQuizzesTaken > 0 ? `${avgScore}%` : '—', colorClass: 'text-amber-500', bgClass: 'bg-amber-50 dark:bg-amber-500/10', borderClass: 'border-amber-100 dark:border-amber-500/20' },
          ].map((s, i) => (
            <div key={i} className={`rounded-2xl p-6 text-center border ${s.bgClass} ${s.borderClass}`}>
              <div className="text-3xl mb-2">{s.icon}</div>
              <div className={`text-3xl font-black ${s.colorClass}`}>{s.value}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Navigation Tabs ── */}
        <div className="flex gap-2 flex-wrap">
          <button className={TAB_STYLE('home')} onClick={() => setActiveTab('home')}>🏠 Home</button>
          <button className={TAB_STYLE('subjects')} onClick={() => setActiveTab('subjects')}>📚 Subjects</button>
          <button className={TAB_STYLE('quizzes')} onClick={() => setActiveTab('quizzes')}>🧪 Quizzes</button>
          <button className={TAB_STYLE('progress')} onClick={() => setActiveTab('progress')}>📈 My Progress</button>
        </div>

        {/* ── Tab: Home ── */}
        {activeTab === 'home' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Quick subject highlights */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">⚡ Quick Access</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {subjects.slice(0, 4).map((sub: any) => {
                  const short = sub.name.replace(`${grade} – `, '')
                  return (
                    <div key={sub.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all" onClick={() => setActiveTab('subjects')}>
                      <div className="text-xs font-bold text-amber-600 dark:text-amber-500 mb-1">
                        {grade} · Subject
                      </div>
                      <div className="text-base font-bold text-slate-900 dark:text-white">{short}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                        Tap to explore →
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Recent quizzes */}
            {quizzes.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">🧪 Recent Mock Exams</h2>
                <div className="space-y-3">
                  {quizzes.slice(0, 3).map((q: any) => {
                    const attempt = quizScores.find(a => a.quiz_id === q.id)
                    return (
                      <div key={q.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex items-center justify-between gap-4 hover:border-amber-500 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-slate-900 dark:text-white mb-1 truncate">
                            {q.title}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            ⏱️ {q.duration_minutes} min
                            {attempt && <span className="text-emerald-500 font-medium ml-2">✓ Score: {attempt.score}%</span>}
                          </div>
                        </div>
                        <Link to={`/learn/quiz/${q.id}`} className={`px-4 py-2 rounded-lg text-xs font-bold flex-shrink-0 transition-colors ${
                          attempt 
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-500 hover:bg-emerald-100' 
                            : 'bg-amber-500 text-white hover:bg-amber-600'
                        }`}>
                          {attempt ? 'Retry' : 'Start →'}
                        </Link>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Subjects ── */}
        {activeTab === 'subjects' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              📚 {gradeInfo?.label} – All Subjects
            </h2>
            {loading ? (
              <div className="text-center py-12 text-slate-500">Loading subjects…</div>
            ) : subjects.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <div className="text-4xl mb-3">📭</div>
                No subjects found for {gradeInfo?.label}. Check back soon!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {subjects.map((sub: any) => {
                  const short = sub.name.replace(`${grade} – `, '')
                  return (
                    <Link
                      key={sub.id}
                      to={`/student/subjects/${sub.id}`}
                      className="block bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 hover:-translate-y-1 hover:shadow-lg transition-all"
                    >
                      <div className="text-3xl mb-3">
                        {short.includes('Math') ? '📐' : short.includes('English') ? '📝' : short.includes('Science') ? '🔬' :
                          short.includes('Social') ? '🌍' : short.includes('Computing') ? '💻' : short.includes('French') ? '🇫🇷' :
                          short.includes('Creative') ? '🎨' : short.includes('Religious') ? '🕊️' : short.includes('Home') ? '🍽️' :
                          short.includes('Ghanaian') ? '🇬🇭' : short.includes('Pre-Tech') || short.includes('Technical') ? '🔧' : '📖'}
                      </div>
                      <div className="text-base font-bold text-slate-900 dark:text-white mb-1">{short}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Open lessons & resources →
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Quizzes ── */}
        {activeTab === 'quizzes' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              🧪 BECE Mock Examinations – {gradeInfo?.label}
            </h2>
            {loading ? (
              <div className="text-center py-12 text-slate-500">Loading quizzes…</div>
            ) : quizzes.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <div className="text-4xl mb-3">📭</div>
                No quizzes found for this grade yet.
              </div>
            ) : (
              <div className="space-y-3">
                {quizzes.map((q: any) => {
                  const attempt = quizScores.find(a => a.quiz_id === q.id)
                  const subName = subjects.find(s => s.id === q.subject_id)?.name?.replace(`${grade} – `, '')
                  return (
                    <div key={q.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 flex items-center gap-4 hover:border-amber-500 transition-colors">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${attempt ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-amber-50 dark:bg-amber-500/10'}`}>
                        {attempt ? '✅' : '🧪'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-slate-900 dark:text-white mb-1 truncate">
                          {q.title}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {subName && <span className="text-indigo-500 font-medium mr-2">{subName}</span>}
                          ⏱️ {q.duration_minutes} min · 25 questions
                          {attempt && <span className="text-emerald-500 font-medium ml-2">Last score: {attempt.score}%</span>}
                        </div>
                      </div>
                      <Link to={`/learn/quiz/${q.id}`} className={`px-5 py-2.5 rounded-xl text-xs font-bold flex-shrink-0 transition-colors ${
                        attempt 
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-500 hover:bg-emerald-100' 
                          : 'bg-amber-500 text-white hover:bg-amber-600'
                      }`}>
                        {attempt ? '🔁 Retry' : 'Start →'}
                      </Link>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Progress ── */}
        {activeTab === 'progress' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">📈 My Progress</h2>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {[
                { label: 'Quizzes Taken', value: totalQuizzesTaken, icon: '🧪', colorClass: 'text-indigo-500', borderClass: 'border-indigo-100 dark:border-indigo-500/20' },
                { label: 'Average Score', value: totalQuizzesTaken > 0 ? `${avgScore}%` : '—', icon: '🏆', colorClass: 'text-amber-500', borderClass: 'border-amber-100 dark:border-amber-500/20' },
                { label: 'Best Score', value: quizScores.length > 0 ? `${Math.max(...quizScores.map((a:any) => a.score || 0))}%` : '—', icon: '⭐', colorClass: 'text-emerald-500', borderClass: 'border-emerald-100 dark:border-emerald-500/20' },
              ].map((s, i) => (
                <div key={i} className={`bg-white dark:bg-slate-800 border ${s.borderClass} rounded-2xl p-6 text-center`}>
                  <div className="text-3xl mb-2">{s.icon}</div>
                  <div className={`text-3xl font-black ${s.colorClass}`}>{s.value}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Quiz history */}
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">Quiz History</h3>
            {quizScores.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center text-slate-500">
                <div className="text-4xl mb-3">📊</div>
                You haven't taken any quizzes yet. Go try one!
              </div>
            ) : (
              <div className="space-y-3">
                {quizScores.slice(0, 10).map((a: any, i: number) => {
                  const quiz = quizzes.find((q: any) => q.id === a.quiz_id)
                  const pct = a.score || 0
                  const colorClass = pct >= 70 ? 'text-emerald-500' : pct >= 50 ? 'text-amber-500' : 'text-red-500'
                  const bgClass = pct >= 70 ? 'bg-emerald-50 dark:bg-emerald-500/10' : pct >= 50 ? 'bg-amber-50 dark:bg-amber-500/10' : 'bg-red-50 dark:bg-red-500/10'
                  return (
                    <div key={i} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-xl ${bgClass} flex items-center justify-center text-lg font-black ${colorClass} shrink-0`}>
                        {pct}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {quiz?.title || 'Quiz'}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {a.completed_at ? new Date(a.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                        </div>
                      </div>
                      <div className={`text-sm font-black ${colorClass}`}>
                        {pct >= 70 ? '🏆 Pass' : pct >= 50 ? '⚠️ Fair' : '❌ Retry'}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
