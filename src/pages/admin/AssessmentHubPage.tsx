import { useState, useEffect } from 'react'
import ScoreEntryPage from '../teacher/ScoreEntryPage'
import ReportsPage from './ReportsPage'
import BatchPromotionPage from './BatchPromotionPage'
import BECEProcessorPage from './BECEProcessorPage'
import AdminTestAnalytics from './AdminTestAnalytics'
import AssessmentsPage from './AssessmentsPage'
import { FileEdit, FileText, Users, Calculator, ClipboardCheck, RefreshCw, CheckCircle2, AlertCircle, BarChart3, ClipboardList } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useCurrentTerm } from '../../hooks/useSettings'
import toast from 'react-hot-toast'

// ── Score Submission Status Board ──────────────────────────
interface ScoreRow {
  class_id: string
  class_name: string
  subject_id: string
  subject_name: string
  teacher_name: string
  teacher_email: string
  score_count: number
  student_count: number
  submitted: boolean
}

function ScoreStatusBoard() {
  const { user } = useAuth()
  const { data: term } = useCurrentTerm()
  const [rows, setRows] = useState<ScoreRow[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'submitted' | 'pending'>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (user?.school_id && term?.id) load()
  }, [user?.school_id, term?.id])

  async function load() {
    setLoading(true)
    try {
      // Get all class-subject-teacher assignments for current term
      const { data: assignments } = await supabase
        .from('teacher_assignments')
        .select(`
          id,
          class:classes(id, name),
          subject:subjects(id, name),
          teacher:teachers(id, user:users(full_name, email))
        `)
        .eq('school_id', user!.school_id)
        .eq('term_id', term!.id)

      if (!assignments?.length) { setRows([]); setLoading(false); return }

      // Get student counts per class
      const classIds = [...new Set(assignments.map((a: any) => a.class?.id).filter(Boolean))]
      const { data: studentCounts } = await supabase
        .from('students')
        .select('class_id')
        .eq('school_id', user!.school_id)
        .eq('is_active', true)
        .in('class_id', classIds)

      const countByClass: Record<string, number> = {}
      for (const s of studentCounts ?? []) {
        countByClass[s.class_id] = (countByClass[s.class_id] || 0) + 1
      }

      // Get score submission counts per class+subject for current term
      const { data: scores } = await supabase
        .from('scores')
        .select('class_id, subject_id')
        .eq('school_id', user!.school_id)
        .eq('term_id', term!.id)

      const scoreMap: Record<string, number> = {}
      for (const s of scores ?? []) {
        const key = `${s.class_id}__${s.subject_id}`
        scoreMap[key] = (scoreMap[key] || 0) + 1
      }

      const result: ScoreRow[] = assignments
        .filter((a: any) => a.class?.id && a.subject?.id)
        .map((a: any) => {
          const key = `${a.class.id}__${a.subject.id}`
          const scoreCount = scoreMap[key] || 0
          const studentCount = countByClass[a.class.id] || 0
          return {
            class_id: a.class.id,
            class_name: a.class.name,
            subject_id: a.subject.id,
            subject_name: a.subject.name,
            teacher_name: a.teacher?.user?.full_name ?? 'Unassigned',
            teacher_email: a.teacher?.user?.email ?? '',
            score_count: scoreCount,
            student_count: studentCount,
            submitted: scoreCount > 0,
          }
        })
        .sort((a: ScoreRow, b: ScoreRow) => {
          // Pending first, then by class name
          if (a.submitted !== b.submitted) return a.submitted ? 1 : -1
          return a.class_name.localeCompare(b.class_name)
        })

      setRows(result)
    } catch (e: any) {
      console.error(e)
      toast.error('Failed to load score status')
    }
    setLoading(false)
  }

  const filtered = rows
    .filter(r => filter === 'all' || (filter === 'submitted' ? r.submitted : !r.submitted))
    .filter(r =>
      !search ||
      r.class_name.toLowerCase().includes(search.toLowerCase()) ||
      r.subject_name.toLowerCase().includes(search.toLowerCase()) ||
      r.teacher_name.toLowerCase().includes(search.toLowerCase())
    )

  const pendingCount = rows.filter(r => !r.submitted).length
  const submittedCount = rows.filter(r => r.submitted).length
  const pct = rows.length ? Math.round((submittedCount / rows.length) * 100) : 0

  return (
    <div style={{ fontFamily: '"DM Sans", sans-serif' }}>
      {/* Summary Bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Submitted', value: submittedCount, bg: '#dcfce7', color: '#16a34a', icon: '✅' },
          { label: 'Pending', value: pendingCount, bg: '#fef2f2', color: '#dc2626', icon: '⏳' },
          { label: 'Overall', value: `${pct}%`, bg: '#eff6ff', color: '#2563eb', icon: '📊' },
        ].map(s => (
          <div key={s.label} style={{ flex: '1 1 120px', background: s.bg, borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: s.color, opacity: 0.75 }}>{s.label}</div>
            </div>
          </div>
        ))}

        {/* Progress Bar */}
        {rows.length > 0 && (
          <div style={{ flex: '2 1 240px', background: 'var(--bg-card)', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '14px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
              <span>Score Submission Progress</span>
              <span>{submittedCount}/{rows.length}</span>
            </div>
            <div style={{ height: 8, borderRadius: 99, background: '#f1f5f9', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#16a34a' : pct > 60 ? '#f59e0b' : '#ef4444', borderRadius: 99, transition: 'width 0.6s ease' }} />
            </div>
          </div>
        )}
      </div>

      {/* Filters + Refresh */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['all', 'pending', 'submitted'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '7px 14px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              background: filter === f ? '#0f172a' : '#f1f5f9',
              color: filter === f ? '#fff' : '#64748b'
            }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <input
          placeholder="Search class, subject or teacher…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 180, padding: '8px 12px', borderRadius: 9, border: '1.5px solid var(--border-color)', fontSize: 13, outline: 'none', background: 'var(--bg-input)', color: 'var(--text-main)' }}
        />
        <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, border: 'none', background: '#6d28d9', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          <RefreshCw size={13} style={loading ? { animation: 'spin 0.7s linear infinite' } : {}} /> Refresh
        </button>
      </div>

      {!term && (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
          ⚠️ No active term found. Please set a current term in Settings first.
        </div>
      )}

      {term && loading && (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Loading…</div>
      )}

      {term && !loading && filtered.length === 0 && (
        <div style={{ padding: 40, textAlign: 'center', background: 'var(--bg-card)', borderRadius: 14, border: '1.5px solid #f0eefe' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📋</div>
          <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: 4 }}>No results</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No class-subject assignments found. Set up your Academic Structure first.</div>
        </div>
      )}

      {term && !loading && filtered.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((r, i) => (
            <div key={`${r.class_id}-${r.subject_id}`} style={{
              background: 'var(--bg-card)',
              borderRadius: 12,
              border: `1.5px solid ${r.submitted ? '#bbf7d0' : '#fca5a5'}`,
              padding: '13px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              animation: `fadeIn 0.2s ease ${i * 0.03}s both`,
            }}>
              {r.submitted
                ? <CheckCircle2 size={20} color="#16a34a" style={{ flexShrink: 0 }} />
                : <AlertCircle size={20} color="#dc2626" style={{ flexShrink: 0 }} />
              }
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-main)' }}>{r.class_name}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>·</span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{r.subject_name}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 2 }}>
                  👤 {r.teacher_name}
                  {r.student_count > 0 && <span style={{ marginLeft: 10 }}>· {r.score_count}/{r.student_count} scores</span>}
                </div>
              </div>
              <div style={{ flexShrink: 0, display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{
                  fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 99,
                  background: r.submitted ? '#dcfce7' : '#fef2f2',
                  color: r.submitted ? '#16a34a' : '#dc2626'
                }}>
                  {r.submitted ? '✓ SUBMITTED' : '⏳ PENDING'}
                </span>
                {!r.submitted && r.teacher_email && (
                  <a
                    href={`mailto:${r.teacher_email}?subject=Score Submission Reminder&body=Dear ${r.teacher_name},%0A%0AThis is a reminder to submit scores for ${r.class_name} — ${r.subject_name} for the current term.%0A%0AThank you.`}
                    style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: '#fffbeb', color: '#92400e', border: '1px solid #fcd34d', textDecoration: 'none' }}
                  >
                    📧 Remind
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <style>{`@keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} } @keyframes spin { to{transform:rotate(360deg)} }`}</style>
    </div>
  )
}

// ── Main Hub ───────────────────────────────────────────────
export default function AssessmentHubPage() {
  const [activeTab, setActiveTab] = useState<'status' | 'scores' | 'reports' | 'promotion' | 'bece' | 'analytics' | 'assessments'>('status')

  const tabs = [
    { key: 'status',      label: 'Score Status',     icon: <ClipboardCheck size={16} /> },
    { key: 'scores',      label: 'Score Entry',      icon: <FileEdit size={16} /> },
    { key: 'assessments', label: 'Assessments',      icon: <ClipboardList size={16} /> },
    { key: 'analytics',   label: 'Test Analytics',   icon: <BarChart3 size={16} /> },
    { key: 'reports',     label: 'Report Cards',     icon: <FileText size={16} /> },
    { key: 'promotion',   label: 'Batch Promotion',  icon: <Users size={16} /> },
    { key: 'bece',        label: 'BECE Processor',   icon: <Calculator size={16} /> },
  ] as const

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200, margin: '0 auto', fontFamily: '"DM Sans", sans-serif' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 28, fontWeight: 700, color: 'var(--text-main)', margin: '0 0 4px' }}>
          Assessment Hub
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
          Monitor score submissions, manage report cards, process promotions, and BECE results.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '2px solid var(--border-color)', overflowX: 'auto', paddingBottom: 0 }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              padding: '10px 18px', border: 'none', background: 'transparent', fontWeight: 700,
              fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
              whiteSpace: 'nowrap', fontFamily: '"DM Sans", sans-serif',
              color: activeTab === t.key ? '#6d28d9' : 'var(--text-muted)',
              borderBottom: activeTab === t.key ? '3px solid #6d28d9' : '3px solid transparent',
              marginBottom: -2,
              transition: 'color 0.15s',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div style={{ animation: 'fadeIn 0.25s ease' }}>
        {activeTab === 'status'      && <ScoreStatusBoard />}
        {activeTab === 'scores'      && <ScoreEntryPage isAdminView={true} />}
        {activeTab === 'assessments' && <AssessmentsPage />}
        {activeTab === 'analytics'   && <AdminTestAnalytics />}
        {activeTab === 'reports'     && <ReportsPage />}
        {activeTab === 'promotion'   && <BatchPromotionPage />}
        {activeTab === 'bece'        && <BECEProcessorPage />}
      </div>
    </div>
  )
}
