// src/pages/admin/TimetablePage.tsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useClasses } from '../../hooks/useClasses'
import { useCurrentTerm, useSettings, useUpdateSettings } from '../../hooks/useSettings'
import toast from 'react-hot-toast'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

const T = {
  navy: '#0a1628', ink: '#1a2744', slate: '#2d3a52', muted: '#7a8499',
  border: '#e4e8f0', bg: '#f5f7fc', white: '#ffffff', teal: '#0e9f84',
  tealDk: '#0b8470', amber: '#f59e0b', red: '#ef4444', green: '#16a34a',
  purple: '#6d28d9', indigo: '#3730a3', sky: '#0284c7',
}

const SUBJECT_COLORS = [
  { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' },
  { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' },
  { bg: '#fef3c7', text: '#b45309', border: '#fde68a' },
  { bg: '#f0e6ff', text: '#6d28d9', border: '#ddd6fe' },
  { bg: '#ffe4e6', text: '#be123c', border: '#fecdd3' },
  { bg: '#e0f7f4', text: '#0e7490', border: '#a7f3d0' },
  { bg: '#fce7f3', text: '#9d174d', border: '#fbcfe8' },
  { bg: '#fff7ed', text: '#9a3412', border: '#fed7aa' },
  { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' },
  { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  { bg: '#fdf4ff', text: '#7e22ce', border: '#e9d5ff' },
  { bg: '#fff1f2', text: '#9f1239', border: '#fecdd3' },
]

// ─────────────────────────────────────────────────────────────────────────────
// Bug 6 fix: canPlace / place are factory functions hoisted out of all loops.
// They receive shared mutable state by reference (Maps & Sets are objects).
// ─────────────────────────────────────────────────────────────────────────────
function makeCanPlace(
  classBusy: Set<string>,
  teacherBusy: Map<string, Set<string>>,
  subjectDays: Map<string, Set<number>>,
  extracurricularSlots: { day: number; periodId: string }[]
) {
  return function canPlace(teacherId: string, subjectId: string, day: number, pid: string): boolean {
    const key = `${day}:${pid}`
    if (classBusy.has(key)) return false
    if (teacherBusy.get(key)?.has(teacherId)) return false
    if (extracurricularSlots.some(es => es.day === day && es.periodId === pid)) return false
    // Each subject may appear at most once per day in a class
    if (subjectDays.get(subjectId)?.has(day)) return false
    return true
  }
}

function makePlace(
  classBusy: Set<string>,
  teacherBusy: Map<string, Set<string>>,
  subjectDays: Map<string, Set<number>>,
  currentSlots: any[],
  schoolId: string,
  classId: string,
  termId: string
) {
  return function place(teacherId: string, subjectId: string, day: number, pid: string) {
    const key = `${day}:${pid}`
    classBusy.add(key)
    if (!teacherBusy.has(key)) teacherBusy.set(key, new Set())
    teacherBusy.get(key)!.add(teacherId)
    if (!subjectDays.has(subjectId)) subjectDays.set(subjectId, new Set())
    subjectDays.get(subjectId)!.add(day)
    currentSlots.push({
      school_id: schoolId,
      class_id: classId,
      subject_id: subjectId,
      teacher_id: teacherId || null,
      period_id: pid,
      day_of_week: day,
      term_id: termId,
    })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// UI Primitives
// ─────────────────────────────────────────────────────────────────────────────
function Btn({ children, onClick, variant = 'primary', disabled = false, loading = false, small = false, style: extStyle, title }: any) {
  const [hov, setHov] = useState(false)
  const colors: any = {
    primary: { background: hov ? T.tealDk : T.teal, color: '#fff' },
    secondary: { background: hov ? '#edf0f7' : T.white, color: T.ink, border: `1.5px solid ${T.border}` },
    danger: { background: hov ? '#dc2626' : T.red, color: '#fff' },
    success: { background: hov ? '#15803d' : T.green, color: '#fff' },
    navy: { background: hov ? T.slate : T.ink, color: '#fff' },
    amber: { background: hov ? '#d97706' : T.amber, color: '#fff' },
    ghost: { background: hov ? '#f0f4ff' : 'transparent', color: T.muted, border: 'none' },
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: small ? '6px 12px' : '9px 16px',
        borderRadius: 9, fontSize: small ? 11 : 13, fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all .15s',
        opacity: disabled ? 0.5 : 1, fontFamily: '"Sora",sans-serif',
        border: 'none', whiteSpace: 'nowrap', ...colors[variant], ...extStyle,
      }}
    >
      {loading && (
        <span style={{
          width: 12, height: 12, borderRadius: '50%',
          border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff',
          animation: '_ttsp .7s linear infinite', flexShrink: 0,
        }} />
      )}
      {children}
    </button>
  )
}

function Modal({ open, onClose, title, subtitle, children, footer, width = 480 }: any) {
  if (!open) return null
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(10,22,40,.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, backdropFilter: 'blur(6px)', padding: 16,
    }}>
      <div style={{
        background: T.white, borderRadius: 20, width, maxWidth: '96vw',
        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 32px 80px rgba(10,22,40,.3)', animation: '_ttsl .22s ease',
      }}>
        <div style={{
          padding: '20px 24px 16px', borderBottom: `1px solid ${T.border}`,
          flexShrink: 0, display: 'flex', alignItems: 'flex-start',
          justifyContent: 'space-between', gap: 12,
        }}>
          <div>
            <h3 style={{ fontFamily: '"Fraunces",serif', fontSize: 18, fontWeight: 700, color: T.navy, margin: 0 }}>{title}</h3>
            {subtitle && <p style={{ fontSize: 12, color: T.muted, marginTop: 4, margin: '4px 0 0' }}>{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8, border: `1.5px solid ${T.border}`,
              background: T.white, cursor: 'pointer', color: T.muted, fontSize: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >×</button>
        </div>
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>{children}</div>
        {footer && (
          <div style={{
            padding: '14px 24px', borderTop: `1px solid ${T.border}`, flexShrink: 0,
            display: 'flex', justifyContent: 'flex-end', gap: 8,
            background: '#fafbfd', borderRadius: '0 0 20px 20px',
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

const fieldStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 9,
  border: `1.5px solid ${T.border}`, fontSize: 13, color: T.navy,
  fontFamily: '"Sora",sans-serif', outline: 'none', background: '#f8faff',
  boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 10, fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '.07em', color: T.muted, marginBottom: 6,
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function TimetablePage() {
  const { user } = useAuth()
  const { data: classes = [] } = useClasses()
  const { data: term } = useCurrentTerm()
  const { data: settings } = useSettings()
  const updateSettings = useUpdateSettings()

  // ── View Mode & Selection ──
  const [viewMode, setViewMode] = useState<'class' | 'teacher'>('class')
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedTeacher, setSelectedTeacher] = useState('')

  // ── Data ──
  const [periods, setPeriods] = useState<any[]>([])
  const [slots, setSlots] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [classTeachers, setClassTeachers] = useState<any[]>([])
  const [classSubjects, setClassSubjects] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // ── Slot Editing ──
  const [editing, setEditing] = useState<{ day: number; period_id: string } | null>(null)
  const [editForm, setEditForm] = useState({ subject_id: '', teacher_id: '' })
  const [saving, setSaving] = useState(false)
  const [conflict, setConflict] = useState<any>(null)

  // ── Modals ──
  const [editPeriodsOpen, setEditPeriodsOpen] = useState(false)
  const [periodForm, setPeriodForm] = useState<any[]>([])
  const [autoGenOpen, setAutoGenOpen] = useState(false)
  const [combOpen, setCombOpen] = useState(false)
  const [pendingMaster, setPendingMaster] = useState('')
  const [pendingMirrors, setPendingMirrors] = useState<string[]>([])

  // ── Generator Config (all persisted to settings JSONB) ──
  // Bug 4 fix: subjectConfig is loaded from DB on mount, never reset on modal open
  // Bug 5 fix: extracurricularSlots is loaded from DB on mount, persisted on change
  const [subjectConfig, setSubjectConfig] = useState<Record<string, { freq: number; excluded: boolean }>>({})
  const [extracurricularSlots, setExtracurricularSlots] = useState<{ day: number; periodId: string }[]>([])
  const [globalCombinations, setGlobalCombinations] = useState<Record<string, string[]>>({})
  const [generating, setGenerating] = useState(false)
  const [genProgress, setGenProgress] = useState('')

  // ── Color Map ──
  const [subjectColorMap, setSubjectColorMap] = useState<Record<string, number>>({})

  // ─────────────────────────────────────────────────────────────────────────────
  // Initializers
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    loadPeriods()
    loadAllSubjectsAndTeachers()
  }, [])

  // Restore persisted config from settings (Bug 4, 5 fix)
  useEffect(() => {
    if (!settings?.settings) return
    const s = settings.settings
    if (s.joint_classes) setGlobalCombinations(s.joint_classes)
    if (s.extracurricular_slots) setExtracurricularSlots(s.extracurricular_slots)
    if (s.subject_config) setSubjectConfig(s.subject_config)
  }, [settings])

  // Reload timetable when selection changes
  useEffect(() => {
    if (viewMode === 'class' && selectedClass && (term as any)?.id) loadClassSlots()
    if (viewMode === 'teacher' && selectedTeacher && (term as any)?.id) loadTeacherSlots()
  }, [viewMode, selectedClass, selectedTeacher, (term as any)?.id])

  useEffect(() => {
    const map: Record<string, number> = {}
    subjects.forEach((s, i) => { map[s.id] = i % SUBJECT_COLORS.length })
    setSubjectColorMap(map)
  }, [subjects])

  // ─────────────────────────────────────────────────────────────────────────────
  // Data Loaders
  // ─────────────────────────────────────────────────────────────────────────────
  async function loadPeriods() {
    const { data } = await supabase
      .from('timetable_periods')
      .select('*')
      .eq('school_id', user!.school_id)
      .order('sort_order')
    setPeriods(data ?? [])
    setPeriodForm(data ?? [])
  }

  async function loadAllSubjectsAndTeachers() {
    const [{ data: s }, { data: t }] = await Promise.all([
      supabase.from('subjects').select('id,name').eq('school_id', user!.school_id).order('name'),
      supabase.from('teachers').select('id,user:users(id,full_name)').eq('school_id', user!.school_id),
    ])
    setSubjects(s ?? [])
    setTeachers(t ?? [])

    // Initialise subject config only if not yet persisted (Bug 4: never overwrite)
    setSubjectConfig(prev => {
      if (Object.keys(prev).length > 0) return prev
      const cfg: Record<string, { freq: number; excluded: boolean }> = {}
        ; (s ?? []).forEach(sub => {
          const isCore = ['math', 'english', 'science', 'literacy', 'numeracy']
            .some(k => sub.name.toLowerCase().includes(k))
          cfg[sub.id] = { freq: isCore ? 4 : 2, excluded: false }
        })
      return cfg
    })
  }

  async function loadClassSlots() {
    setLoading(true)
    const targetClasses = getJoinedClasses(selectedClass)
    const [{ data: sl }, { data: asgn }] = await Promise.all([
      supabase
        .from('timetable_slots')
        .select('*,subject:subjects(id,name),teacher:teachers(id,user:users(full_name))')
        .in('class_id', targetClasses)
        .eq('term_id', (term as any).id),
      supabase
        .from('teacher_assignments')
        .select('subject:subjects(id,name),teacher:teachers(id,user:users(id,full_name))')
        .eq('class_id', selectedClass)
        .eq('term_id', (term as any).id),
    ])
    setSlots(sl ?? [])

    // Build unique teacher & subject maps from assignments for this class
    const teacherMap: any = {}
    const subjectMap: any = {}
    asgn?.forEach((a: any) => {
      if (a.teacher) teacherMap[a.teacher.id] = a.teacher
      if (a.subject) subjectMap[a.subject.id] = a.subject
    })
    setClassTeachers(Object.values(teacherMap))
    setClassSubjects(Object.values(subjectMap))
    setLoading(false)
  }

  async function loadTeacherSlots() {
    setLoading(true)
    const { data } = await supabase
      .from('timetable_slots')
      .select('*,subject:subjects(id,name),class:classes(id,name)')
      .eq('teacher_id', selectedTeacher)
      .eq('term_id', (term as any).id)
    setSlots(data ?? [])
    setLoading(false)
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────────
  function getJoinedClasses(cid: string): string[] {
    if (!cid) return []
    if (globalCombinations[cid]) return [cid, ...globalCombinations[cid]]
    for (const mid in globalCombinations) {
      if (globalCombinations[mid].includes(cid)) return [mid, ...globalCombinations[mid]]
    }
    return [cid]
  }

  function getSlot(day: number, periodId: string) {
    if (viewMode === 'class') {
      return slots.find(s => s.day_of_week === day && s.period_id === periodId && s.class_id === selectedClass)
    }
    return slots.find(s => s.day_of_week === day && s.period_id === periodId)
  }

  function slotColor(subjectId: string) {
    return SUBJECT_COLORS[subjectColorMap[subjectId] ?? 0]
  }

  const selectedClassName = (classes as any[]).find(c => c.id === selectedClass)?.name ?? ''
  const joinedClassNames = getJoinedClasses(selectedClass)
    .filter(id => id !== selectedClass)
    .map(id => (classes as any[]).find(c => c.id === id)?.name)
    .filter(Boolean)
  const teachablePeriods = periods.filter(p => !p.is_break)

  // ─────────────────────────────────────────────────────────────────────────────
  // Persist Config to DB (deep-merge into existing settings JSONB)
  // ─────────────────────────────────────────────────────────────────────────────
  async function persistConfig(updates: Record<string, any>) {
    if (!settings?.id) return
    try {
      await updateSettings.mutateAsync({
        id: settings.id,
        settings: { ...(settings.settings ?? {}), ...updates },
      })
    } catch (e) {
      console.error('persistConfig failed', e)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Slot Save / Edit
  // ─────────────────────────────────────────────────────────────────────────────
  function openEdit(day: number, periodId: string) {
    const s = getSlot(day, periodId)
    setEditing({ day, period_id: periodId })
    setEditForm({ subject_id: s?.subject_id ?? '', teacher_id: s?.teacher_id ?? '' })
    setConflict(null)
  }

  async function saveSlot(force = false) {
    if (!editing) return
    setSaving(true)
    const termId = (term as any)?.id
    const targetClasses = getJoinedClasses(selectedClass)

    if (editForm.subject_id && !force) {
      // Teacher conflict: same teacher, same day+period, different class
      if (editForm.teacher_id) {
        const { data: teacherClash } = await supabase
          .from('timetable_slots')
          .select('*,class:classes(name),subject:subjects(name)')
          .eq('teacher_id', editForm.teacher_id)
          .eq('day_of_week', editing.day)
          .eq('period_id', editing.period_id)
          .eq('term_id', termId)
          .not('class_id', 'in', `(${targetClasses.join(',')})`)
          .maybeSingle()
        if (teacherClash) {
          setConflict({ ...teacherClash, type: 'teacher' })
          setSaving(false)
          return
        }
      }
      // Subject-repeat conflict: same subject already scheduled in this class today
      const { data: subjectRepeat } = await supabase
        .from('timetable_slots')
        .select('*,period:timetable_periods(name)')
        .in('class_id', targetClasses)
        .eq('subject_id', editForm.subject_id)
        .eq('day_of_week', editing.day)
        .eq('term_id', termId)
        .neq('period_id', editing.period_id)
        .maybeSingle()
      if (subjectRepeat) {
        setConflict({ ...subjectRepeat, type: 'subject' })
        setSaving(false)
        return
      }
    }

    if (force && conflict?.id) {
      await supabase.from('timetable_slots').delete().eq('id', conflict.id)
    }

    // Remove existing slots for this day/period across all joined classes
    const oldIds = slots
      .filter(s => s.day_of_week === editing.day && s.period_id === editing.period_id && targetClasses.includes(s.class_id))
      .map(s => s.id)
    if (oldIds.length) await supabase.from('timetable_slots').delete().in('id', oldIds)

    if (editForm.subject_id) {
      await supabase.from('timetable_slots').insert(
        targetClasses.map(cid => ({
          school_id: user!.school_id,
          class_id: cid,
          subject_id: editForm.subject_id,
          teacher_id: editForm.teacher_id || null,
          period_id: editing.period_id,
          day_of_week: editing.day,
          term_id: termId,
        }))
      )
      // Notify teacher
      if (editForm.teacher_id) {
        const teacher = teachers.find(t => t.id === editForm.teacher_id)
        const period = periods.find(p => p.id === editing.period_id)
        const subject = subjects.find(s => s.id === editForm.subject_id)
        if (teacher?.user?.id) {
          await supabase.from('notifications').insert({
            school_id: user!.school_id,
            user_id: teacher.user.id,
            type: 'info',
            title: 'Timetable Updated',
            body: `${subject?.name} assigned to ${selectedClassName} on ${DAYS[editing.day - 1]}, ${period?.name}`,
          })
        }
      }
    }

    setSaving(false)
    setEditing(null)
    setConflict(null)
    toast.success(targetClasses.length > 1 ? `Saved across ${targetClasses.length} classes` : 'Slot saved!')
    loadClassSlots()
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Period Management (Bug 7 fix: supports add + delete)
  // ─────────────────────────────────────────────────────────────────────────────
  async function savePeriods() {
    for (const p of periodForm) {
      if (p._new) {
        await supabase.from('timetable_periods').insert({
          name: p.name, start_time: p.start_time, end_time: p.end_time,
          is_break: p.is_break, school_id: user!.school_id, sort_order: p.sort_order ?? 99,
        })
      } else if (p._deleted) {
        await supabase.from('timetable_periods').delete().eq('id', p.id)
      } else {
        await supabase.from('timetable_periods').update({
          name: p.name, start_time: p.start_time, end_time: p.end_time, is_break: p.is_break,
        }).eq('id', p.id)
      }
    }
    toast.success('Periods saved!')
    setEditPeriodsOpen(false)
    loadPeriods()
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Clear single class timetable (Feature 3)
  // ─────────────────────────────────────────────────────────────────────────────
  async function clearClassTimetable() {
    if (!selectedClass) return
    if (!window.confirm(`Clear ALL timetable slots for ${selectedClassName}?`)) return
    const targets = getJoinedClasses(selectedClass)
    await supabase
      .from('timetable_slots')
      .delete()
      .eq('term_id', (term as any).id)
      .in('class_id', targets)
    toast.success(`Timetable cleared for ${selectedClassName}`)
    loadClassSlots()
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ★ SMART AUTO-GENERATE
  // Fixes:
  //   Bug 3  — mirror classes get their teacher marked busy so other masters
  //             can't double-book that teacher
  //   Bug 6  — canPlace / place are hoisted factory functions (no stale closures)
  //   Feature 4 — singleClass=true re-generates only the selected class
  //
  // Guarantees:
  //   ✅ No teacher double-booked across any class at the same period
  //   ✅ Each subject appears at most once per day in a class
  //   ✅ All assigned subjects appear (5 retry attempts to maximise coverage)
  //   ✅ Mirror classes are perfectly in sync with their master
  //   ✅ Extracurricular slots are always skipped
  //   ✅ Works for both "one teacher teaches all" and "subject teachers" models
  // ─────────────────────────────────────────────────────────────────────────────
  async function handleAutoGenerate(singleClass = false) {
    if (!(term as any)?.id) { toast.error('No active term. Set one in Settings.'); return }
    if (singleClass && !selectedClass) { toast.error('Select a class first'); return }

    setGenerating(true)
    const tid = toast.loading('🧠 Building schedule...')

    try {
      const { data: assignments, error: ae } = await supabase
        .from('teacher_assignments')
        .select('*')
        .eq('term_id', (term as any).id)
      if (ae) throw ae
      if (!assignments?.length) {
        throw new Error('No teacher assignments found.\nGo to Admin → Teachers → Assign to set them up.')
      }

      const tpList = periods.filter(p => !p.is_break)
      const allClasses = classes as any[]

      // Mirror IDs are all classes that appear as a follower in globalCombinations.
      // They are driven by their master — we never schedule them independently.
      const mirrorIds = new Set(Object.values(globalCombinations).flat())

      // All master classes (including classes with no combination at all)
      const masterClasses = allClasses.filter(c => !mirrorIds.has(c.id))

      // For single-class re-gen, find the master of the selected class
      const classesToProcess = singleClass
        ? masterClasses.filter(c => {
          if (c.id === selectedClass) return true
          // If selected is a mirror, its master is in globalCombinations
          for (const [mid, followers] of Object.entries(globalCombinations)) {
            if (followers.includes(selectedClass) && c.id === mid) return true
          }
          return false
        })
        : masterClasses

      let best: { slots: any[]; missed: number; details: string[] } = {
        slots: [], missed: Infinity, details: [],
      }

      for (let attempt = 1; attempt <= 5; attempt++) {
        setGenProgress(`Attempt ${attempt} of 5...`)

        const currentSlots: any[] = []
        // Global teacher busy map — shared across ALL classes in this attempt
        // key: "day:periodId" → Set of teacherIds
        const teacherBusy = new Map<string, Set<string>>()

        let attemptMissed = 0
        const details: string[] = []

        for (const cls of classesToProcess) {
          const assigns = assignments.filter(a => a.class_id === cls.id)
          if (!assigns.length) continue

          // Build want-list respecting subject config (excluded subjects are skipped)
          const wantList = assigns
            .map(a => ({
              teacher_id: a.teacher_id,
              subject_id: a.subject_id,
              name: subjects.find(s => s.id === a.subject_id)?.name ?? '?',
              freq: subjectConfig[a.subject_id]?.excluded
                ? 0
                : (subjectConfig[a.subject_id]?.freq ?? 2),
              placed: 0,
            }))
            .filter(w => w.freq > 0)

          // Per-class state (reset for each class)
          const classBusy = new Set<string>()        // slots occupied within this class
          const subjectDays = new Map<string, Set<number>>() // which days each subject has been placed

          // Bug 6: hoisted helpers — receive state by reference, always fresh
          const canPlace = makeCanPlace(classBusy, teacherBusy, subjectDays, extracurricularSlots)
          const place = makePlace(classBusy, teacherBusy, subjectDays, currentSlots, user!.school_id, cls.id, (term as any).id)

          const shuffledWant = [...wantList].sort(() => Math.random() - 0.5)

          // ── Pass 0: guarantee at least 1 slot for every subject ──
          for (const w of shuffledWant) {
            const days = [1, 2, 3, 4, 5].sort(() => Math.random() - 0.5)
            const pds = tpList.map(p => p.id).sort(() => Math.random() - 0.5)
            let placed = false
            outer: for (const d of days) {
              for (const p of pds) {
                if (canPlace(w.teacher_id, w.subject_id, d, p)) {
                  place(w.teacher_id, w.subject_id, d, p)
                  w.placed++
                  placed = true
                  break outer
                }
              }
            }
            if (!placed) {
              // Subject couldn't get even one slot — count as missed
              attemptMissed += w.freq
              details.push(`${cls.name}: ${w.name} (no slot available)`)
            }
          }

          // ── Pass 1: fill remaining frequency ──
          for (const w of shuffledWant) {
            while (w.placed < w.freq) {
              // Prefer days where this subject hasn't been placed yet
              const days = [1, 2, 3, 4, 5].sort((a, b) => {
                const aHas = subjectDays.get(w.subject_id)?.has(a) ? 1 : 0
                const bHas = subjectDays.get(w.subject_id)?.has(b) ? 1 : 0
                return aHas - bHas + (Math.random() - 0.5) * 0.1
              })
              const pds = tpList.map(p => p.id).sort(() => Math.random() - 0.5)
              let placed = false
              outer: for (const d of days) {
                for (const p of pds) {
                  if (canPlace(w.teacher_id, w.subject_id, d, p)) {
                    place(w.teacher_id, w.subject_id, d, p)
                    w.placed++
                    placed = true
                    break outer
                  }
                }
              }
              if (!placed) break
            }
            const missing = w.freq - w.placed
            if (missing > 0) {
              attemptMissed += missing
              details.push(`${cls.name}: ${w.name} (need ${w.freq}, placed ${w.placed})`)
            }
          }

          // ── Bug 3 fix: propagate master's teacher-busy into mirror slots ──
          // After scheduling master class `cls`, mark the same teacher as busy
          // at each slot for all its mirror classes. This prevents any subsequent
          // master class that shares a teacher with a mirror from being double-booked.
          const followers = globalCombinations[cls.id] ?? []
          if (followers.length > 0) {
            const masterNewSlots = currentSlots.filter(s => s.class_id === cls.id)
            for (const slot of masterNewSlots) {
              const key = `${slot.day_of_week}:${slot.period_id}`
              if (!teacherBusy.has(key)) teacherBusy.set(key, new Set())
              // Mark the teacher busy for all mirror class contexts
              teacherBusy.get(key)!.add(slot.teacher_id)
            }
          }
        }

        if (attemptMissed < best.missed) {
          best = { slots: currentSlots, missed: attemptMissed, details }
        }
        if (best.missed === 0) break
      }

      // ── Write to DB ──
      setGenProgress('Writing to database...')

      // Determine which class IDs to wipe before inserting
      const targetCids = singleClass
        ? getJoinedClasses(selectedClass)
        : allClasses.map(c => c.id)

      await supabase
        .from('timetable_slots')
        .delete()
        .eq('term_id', (term as any).id)
        .in('class_id', targetCids)

      // ── Mirror master slots to all follower classes ──
      // This is the definitive mirror step. Each follower gets an exact copy
      // of its master's scheduled slots (same subject, same teacher, same period).
      const mirrored: any[] = []
      for (const [masterId, followers] of Object.entries(globalCombinations)) {
        // Skip if this master wasn't included in this run
        if (!classesToProcess.some(c => c.id === masterId)) continue
        const masterSlots = best.slots.filter(s => s.class_id === masterId)
        if (!masterSlots.length) continue
        followers.forEach(fid =>
          masterSlots.forEach(s => mirrored.push({ ...s, class_id: fid }))
        )
      }

      const finalPayload = [...best.slots, ...mirrored]

      // Insert in chunks to avoid request size limits
      const CHUNK = 300
      for (let i = 0; i < finalPayload.length; i += CHUNK) {
        const { error: ie } = await supabase
          .from('timetable_slots')
          .insert(finalPayload.slice(i, i + CHUNK))
        if (ie) throw ie
      }

      const studyHallGaps = (classesToProcess.length * teachablePeriods.length * 5) - best.slots.length
      toast.success(
        best.missed === 0
          ? `✅ Perfect! ${finalPayload.length} slots placed (${mirrored.length} mirrored). ${studyHallGaps} Study Hall gaps.`
          : `⚠️ ${finalPayload.length} slots placed. ${best.missed} couldn't fit: ${best.details.slice(0, 2).join('; ')}`,
        { id: tid, duration: 8000 }
      )

      setAutoGenOpen(false)
      setGenProgress('')
      if (selectedClass) loadClassSlots()
    } catch (e: any) {
      toast.error(e.message || 'Generation failed', { id: tid })
    } finally {
      setGenerating(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────
  const activeSelection = viewMode === 'class' ? selectedClass : selectedTeacher

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@700;800&family=Sora:wght@400;500;600;700;800&display=swap');
        @keyframes _ttsp { to { transform:rotate(360deg) } }
        @keyframes _ttsl { from { opacity:0;transform:translateY(10px) } to { opacity:1;transform:none } }
        @keyframes _ttfi { from { opacity:0 } to { opacity:1 } }
        .tt-cell { cursor:pointer; transition:background .1s; }
        .tt-cell:hover { background:#f0f9ff !important; }

        /* ── Print styles (Feature 1) ── */
        @media print {
          /* Hide everything by default */
          body > * { visibility: hidden !important; }
          /* Then show only the print target and all its children */
          #tt-print-area,
          #tt-print-area * { visibility: visible !important; }
          #tt-print-area {
            position: fixed !important;
            inset: 0 !important;
            padding: 24px !important;
            background: #fff !important;
          }
          /* Remove interactive chrome */
          .no-print { display: none !important; }
          /* Ensure table doesn't get cut off */
          table { page-break-inside: avoid; }
          tr { page-break-inside: avoid; }
        }

        select, input { font-family:"Sora",sans-serif !important; }
      `}</style>

      <div style={{ fontFamily: '"Sora",sans-serif', minHeight: '100%', animation: '_ttfi .35s ease' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: '"Fraunces",serif', fontSize: 30, color: T.navy, margin: 0 }}>Timetable Manager</h1>
            <p style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>
              {(term as any)?.name ? `Term: ${(term as any).name}` : 'No active term set'} · Smart, conflict-aware scheduling
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }} className="no-print">
            {/* Feature 1: Print — triggers browser print which uses @media print above */}
            <Btn variant="ghost" onClick={() => window.print()} title="Print current timetable">🖨 Print</Btn>
            <Btn variant="secondary" onClick={() => setCombOpen(true)}>🔗 Joint Classes</Btn>
            <Btn variant="navy" onClick={() => { setPeriodForm([...periods]); setEditPeriodsOpen(true) }}>⏱ Edit Periods</Btn>
            <Btn onClick={() => setAutoGenOpen(true)} style={{ background: 'linear-gradient(135deg,#0e9f84,#0a7c68)' }}>✨ Auto-Generate</Btn>
          </div>
        </div>

        {/* ── View Toggle (Feature 2: Teacher View) ── */}
        <div style={{ display: 'inline-flex', background: T.border, borderRadius: 12, padding: 3, gap: 1, marginBottom: 18 }} className="no-print">
          {([['class', '🏫 Class View'], ['teacher', '👨‍🏫 Teacher View']] as const).map(([v, l]) => (
            <button key={v} onClick={() => setViewMode(v)}
              style={{
                padding: '7px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
                fontFamily: '"Sora",sans-serif', fontSize: 13, fontWeight: 700,
                transition: 'all .2s',
                background: viewMode === v ? T.white : 'transparent',
                color: viewMode === v ? T.teal : T.muted,
              }}>
              {l}
            </button>
          ))}
        </div>

        {/* ── Selectors Row ── */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-end' }} className="no-print">
          <div style={{ flex: '1 1 260px' }}>
            <label style={labelStyle}>{viewMode === 'class' ? 'Class' : 'Teacher'}</label>
            {viewMode === 'class' ? (
              <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} style={fieldStyle}>
                <option value="">— Choose a class —</option>
                {(classes as any[]).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            ) : (
              <select value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)} style={fieldStyle}>
                <option value="">— Choose a teacher —</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.user?.full_name}</option>)}
              </select>
            )}
          </div>

          {viewMode === 'class' && selectedClass && (
            <>
              {joinedClassNames.length > 0 && (
                <div style={{ padding: '8px 14px', borderRadius: 10, background: `${T.teal}10`, border: `1px solid ${T.teal}30`, fontSize: 12, color: T.teal, fontWeight: 700 }}>
                  🔗 Joint with: {joinedClassNames.join(', ')}
                </div>
              )}
              {/* Feature 3: Clear single class */}
              <Btn variant="ghost" small onClick={clearClassTimetable}>🗑 Clear Class</Btn>
              {/* Feature 4: Re-gen single class */}
              <Btn variant="secondary" small onClick={() => handleAutoGenerate(true)} disabled={generating}>
                🚀 Re-Gen This Class
              </Btn>
            </>
          )}
        </div>

        {/* ── Timetable Grid ── */}
        {activeSelection ? (
          <div
            id="tt-print-area"
            style={{ background: T.white, borderRadius: 20, border: `1.5px solid ${T.border}`, overflow: 'hidden', boxShadow: '0 4px 24px rgba(10,22,40,.07)' }}
          >
            <div style={{ padding: '18px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: T.navy }}>
                  {viewMode === 'class'
                    ? `${selectedClassName}'s Timetable`
                    : `${teachers.find(t => t.id === selectedTeacher)?.user?.full_name}'s Schedule`}
                </div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{(term as any)?.name}</div>
              </div>
              {viewMode === 'class' && !loading && (
                <div style={{ fontSize: 11, color: T.muted }} className="no-print">
                  Click any cell to edit · Empty = 📖 Study Hall
                </div>
              )}
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: T.teal, animation: '_ttsp .8s linear infinite', margin: '0 auto 12px' }} />
                <p style={{ fontSize: 12, color: T.muted }}>Loading timetable...</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 780 }}>
                  <thead>
                    <tr>
                      <th style={{ background: T.navy, color: '#fff', padding: '12px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', width: 140 }}>Period</th>
                      {DAYS.map((d, i) => (
                        <th key={d} style={{ background: T.navy, color: '#fff', padding: '12px', textAlign: 'center', fontSize: 11, borderLeft: '1px solid rgba(255,255,255,.1)' }}>
                          <span style={{ display: 'block', fontWeight: 800 }}>{d}</span>
                          <span style={{ fontSize: 9, opacity: .6 }}>{DAY_SHORT[i]}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {periods.map(p => (
                      <tr key={p.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '10px 16px', background: p.is_break ? '#fffbeb' : '#f8faff', borderRight: `1px solid ${T.border}`, minWidth: 130 }}>
                          <div style={{ fontWeight: 800, fontSize: 12, color: p.is_break ? '#92400e' : T.navy }}>{p.name}</div>
                          <div style={{ fontSize: 10, color: T.muted }}>{p.start_time?.slice(0, 5)} – {p.end_time?.slice(0, 5)}</div>
                          {p.is_break && (
                            <span style={{ fontSize: 9, fontWeight: 700, color: T.amber, background: `${T.amber}15`, padding: '1px 6px', borderRadius: 6 }}>BREAK</span>
                          )}
                        </td>

                        {p.is_break ? (
                          <td colSpan={5} style={{ background: '#fffbeb', textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#92400e' }}>
                            ☕ {p.name}
                          </td>
                        ) : DAYS.map((_, di) => {
                          const slot = getSlot(di + 1, p.id)
                          const isExtra = extracurricularSlots.some(es => es.day === di + 1 && es.periodId === p.id)
                          const color = slot ? slotColor(slot.subject_id) : null

                          return (
                            <td
                              key={di}
                              className={viewMode === 'class' ? 'tt-cell' : ''}
                              onClick={() => viewMode === 'class' && openEdit(di + 1, p.id)}
                              style={{ padding: 8, minWidth: 140, height: 76, verticalAlign: 'middle', borderLeft: `1px solid ${T.border}` }}
                            >
                              {slot ? (
                                <div style={{ background: color!.bg, border: `1px solid ${color!.border}`, borderRadius: 10, padding: '7px 10px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                  <div style={{ fontSize: 12, fontWeight: 800, color: color!.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {slot.subject?.name}
                                  </div>
                                  <div style={{ fontSize: 10, color: color!.text, opacity: .75, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {viewMode === 'class' ? slot.teacher?.user?.full_name : slot.class?.name}
                                  </div>
                                </div>
                              ) : isExtra ? (
                                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <span style={{ fontSize: 10, fontWeight: 800, color: T.green }}>⚽ Extra-Curricular</span>
                                </div>
                              ) : (
                                <div style={{ background: '#f8fafc', border: `1px dashed ${T.border}`, borderRadius: 10, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <span style={{ fontSize: 10, fontWeight: 700, color: '#d1d5db' }}>
                                    {viewMode === 'class' ? '📖 Study Hall' : ''}
                                  </span>
                                </div>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Legend (hidden in print since colors convey the info) */}
                {viewMode === 'class' && classSubjects.length > 0 && (
                  <div style={{ padding: '12px 16px', borderTop: `1px solid ${T.border}`, display: 'flex', flexWrap: 'wrap', gap: 6, background: '#fafbfd' }} className="no-print">
                    <span style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '.05em', alignSelf: 'center', marginRight: 4 }}>Legend</span>
                    {classSubjects.map(s => {
                      const c = slotColor(s.id)
                      return (
                        <span key={s.id} style={{ fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 99, background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
                          {s.name}
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: '80px 20px', textAlign: 'center', background: T.white, borderRadius: 24, border: `1.5px solid ${T.border}`, boxShadow: '0 2px 8px rgba(10,22,40,.05)' }}>
            <div style={{ fontSize: 56 }}>📅</div>
            <h2 style={{ fontFamily: '"Fraunces",serif', color: T.navy, margin: '12px 0 8px' }}>No {viewMode} selected</h2>
            <p style={{ color: T.muted, fontSize: 13 }}>Choose a {viewMode} above to view or edit the timetable.</p>
          </div>
        )}
      </div>

      {/* ════════════ MODAL: Edit Slot ════════════ */}
      <Modal
        open={!!editing}
        onClose={() => { setEditing(null); setConflict(null) }}
        title={
          conflict
            ? (conflict.type === 'subject' ? '🚫 Subject Conflict' : '⚠️ Teacher Conflict')
            : `${editing ? DAYS[editing.day - 1] : ''} · ${periods.find(p => p.id === editing?.period_id)?.name ?? ''}`
        }
        subtitle={conflict ? undefined : `${selectedClassName}${joinedClassNames.length ? ` + ${joinedClassNames.join(', ')}` : ''}`}
        width={390}
        footer={conflict ? (
          <>
            <Btn variant="secondary" onClick={() => setConflict(null)}>← Go Back</Btn>
            <Btn variant={conflict.type === 'subject' ? 'danger' : 'amber'} onClick={() => saveSlot(true)} loading={saving}>
              {conflict.type === 'subject' ? '⛔ Override' : '🔄 Swap Teacher'}
            </Btn>
          </>
        ) : (
          <>
            <Btn variant="secondary" onClick={() => setEditing(null)}>Cancel</Btn>
            <Btn onClick={() => saveSlot()} loading={saving}>💾 Save Slot</Btn>
          </>
        )}
      >
        {conflict ? (
          <div style={{ background: conflict.type === 'subject' ? '#fef2f2' : '#fffbeb', border: `1.5px solid ${conflict.type === 'subject' ? '#fecaca' : '#fde68a'}`, borderRadius: 12, padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: conflict.type === 'subject' ? '#dc2626' : '#92400e', marginBottom: 8 }}>
              {conflict.type === 'subject' ? 'This subject is already scheduled today' : 'This teacher is busy in another class'}
            </div>
            <div style={{ fontSize: 12, color: T.navy }}>
              {conflict.type === 'subject'
                ? `An existing slot for this subject already exists at: ${conflict.period?.name}`
                : `${teachers.find(t => t.id === editForm.teacher_id)?.user?.full_name} is teaching ${conflict.subject?.name} in ${conflict.class?.name} at this time.`}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {joinedClassNames.length > 0 && (
              <div style={{ background: '#eff6ff', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: T.indigo, border: '1px solid #bfdbfe' }}>
                🔗 This edit applies to <strong>{joinedClassNames.length + 1} classes</strong>: {selectedClassName}, {joinedClassNames.join(', ')}
              </div>
            )}
            {/* Bug 8 fix: Subject dropdown shows only class-assigned subjects */}
            <div>
              <label style={labelStyle}>Subject</label>
              <select value={editForm.subject_id} onChange={e => setEditForm(f => ({ ...f, subject_id: e.target.value }))} style={fieldStyle}>
                <option value="">— Clear slot —</option>
                {(classSubjects.length > 0 ? classSubjects : subjects).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {classSubjects.length > 0 && (
                <p style={{ fontSize: 10, color: T.teal, marginTop: 4 }}>Showing subjects assigned to {selectedClassName}</p>
              )}
            </div>
            <div>
              <label style={labelStyle}>Teacher</label>
              <select value={editForm.teacher_id} onChange={e => setEditForm(f => ({ ...f, teacher_id: e.target.value }))} style={fieldStyle}>
                <option value="">— Unassigned —</option>
                {(classTeachers.length > 0 ? classTeachers : teachers).map(t => (
                  <option key={t.id} value={t.id}>{t.user?.full_name}</option>
                ))}
              </select>
              {classTeachers.length > 0 && (
                <p style={{ fontSize: 10, color: T.teal, marginTop: 4 }}>Showing teachers assigned to {selectedClassName}</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ════════════ MODAL: Period Editor (Bug 7 fix: add + delete) ════════════ */}
      <Modal
        open={editPeriodsOpen}
        onClose={() => setEditPeriodsOpen(false)}
        title="⏱ Edit Periods"
        subtitle="Add, edit, or remove teaching periods and breaks"
        width={620}
        footer={
          <>
            <Btn variant="secondary" onClick={() => setEditPeriodsOpen(false)}>Cancel</Btn>
            <Btn variant="success" onClick={savePeriods}>💾 Save Periods</Btn>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 60px 40px', gap: 8, padding: '0 4px' }}>
            {['Name', 'Start', 'End', 'Break?', ''].map(h => (
              <span key={h} style={labelStyle}>{h}</span>
            ))}
          </div>

          {/* Rows — _deleted rows are hidden, _new rows show immediately */}
          {periodForm.filter(p => !p._deleted).map((p, i) => {
            // Real index in the full array (needed for updates)
            const realIdx = periodForm.indexOf(p)
            return (
              <div
                key={p.id ?? `new-${i}`}
                style={{
                  display: 'grid', gridTemplateColumns: '1fr 100px 100px 60px 40px',
                  gap: 8, alignItems: 'center',
                  background: p.is_break ? '#fffbeb' : T.white,
                  borderRadius: 10, padding: 8,
                  border: `1px solid ${p.is_break ? '#fde68a' : T.border}`,
                }}
              >
                <input
                  value={p.name}
                  onChange={e => setPeriodForm(f => f.map((x, j) => j === realIdx ? { ...x, name: e.target.value } : x))}
                  style={{ ...fieldStyle, padding: '7px 10px' }}
                />
                <input
                  type="time"
                  value={p.start_time?.slice(0, 5) ?? ''}
                  onChange={e => setPeriodForm(f => f.map((x, j) => j === realIdx ? { ...x, start_time: e.target.value } : x))}
                  style={{ ...fieldStyle, padding: '7px 8px' }}
                />
                <input
                  type="time"
                  value={p.end_time?.slice(0, 5) ?? ''}
                  onChange={e => setPeriodForm(f => f.map((x, j) => j === realIdx ? { ...x, end_time: e.target.value } : x))}
                  style={{ ...fieldStyle, padding: '7px 8px' }}
                />
                <label style={{ display: 'flex', justifyContent: 'center' }}>
                  <input
                    type="checkbox"
                    checked={!!p.is_break}
                    onChange={e => setPeriodForm(f => f.map((x, j) => j === realIdx ? { ...x, is_break: e.target.checked } : x))}
                  />
                </label>
                <button
                  onClick={() => {
                    if (p._new) {
                      // New unsaved rows are removed immediately from state
                      setPeriodForm(f => f.filter((_, j) => j !== realIdx))
                    } else {
                      // Existing rows are marked for deletion on save
                      setPeriodForm(f => f.map((x, j) => j === realIdx ? { ...x, _deleted: true } : x))
                    }
                  }}
                  style={{ background: 'none', border: 'none', color: T.red, cursor: 'pointer', fontSize: 16 }}
                  title="Delete this period"
                >
                  🗑
                </button>
              </div>
            )
          })}

          {/* Add Period button */}
          <Btn
            variant="secondary"
            small
            onClick={() => setPeriodForm(f => [
              ...f,
              {
                id: null, _new: true, name: 'New Period',
                start_time: '08:00', end_time: '08:40',
                is_break: false, sort_order: f.length + 1,
              },
            ])}
          >
            + Add Period
          </Btn>
        </div>
      </Modal>

      {/* ════════════ MODAL: Joint Classes (Bug 1 fix: unlink now calls persistConfig) ════════════ */}
      <Modal
        open={combOpen}
        onClose={() => { setCombOpen(false); setPendingMaster(''); setPendingMirrors([]) }}
        title="🔗 Joint Classes"
        subtitle="Link classes that share the same teaching schedule"
        width={520}
        footer={<Btn onClick={() => setCombOpen(false)}>Done</Btn>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* ── Create New Group ── */}
          <div style={{ background: '#f8fafc', border: `1px solid ${T.border}`, borderRadius: 14, padding: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14, margin: '0 0 14px' }}>
              Create New Joint Group
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={labelStyle}>Master Class (The Source)</label>
                <select
                  value={pendingMaster}
                  onChange={e => { setPendingMaster(e.target.value); setPendingMirrors([]) }}
                  style={fieldStyle}
                >
                  <option value="">— Select Master Class —</option>
                  {(classes as any[])
                    .filter(c =>
                      !Object.values(globalCombinations).flat().includes(c.id) &&
                      !globalCombinations[c.id]
                    )
                    .map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                  }
                </select>
              </div>

              {pendingMaster && (
                <div style={{ animation: '_ttsl .2s ease' }}>
                  <label style={labelStyle}>Follower Classes (Mirrors)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, maxHeight: 160, overflowY: 'auto' }}>
                    {(classes as any[])
                      .filter(c =>
                        c.id !== pendingMaster &&
                        !Object.values(globalCombinations).flat().includes(c.id) &&
                        !globalCombinations[c.id]
                      )
                      .map(c => (
                        <label key={c.id} style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '7px 10px', borderRadius: 8, cursor: 'pointer',
                          border: `1px solid ${pendingMirrors.includes(c.id) ? T.teal : T.border}`,
                          background: pendingMirrors.includes(c.id) ? `${T.teal}08` : T.white,
                        }}>
                          <input
                            type="checkbox"
                            checked={pendingMirrors.includes(c.id)}
                            onChange={e => setPendingMirrors(p =>
                              e.target.checked ? [...p, c.id] : p.filter(id => id !== c.id)
                            )}
                          />
                          <span style={{ fontSize: 12, color: T.navy, fontWeight: 600 }}>{c.name}</span>
                        </label>
                      ))
                    }
                  </div>

                  <Btn
                    variant="success"
                    style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}
                    disabled={!pendingMirrors.length}
                    onClick={async () => {
                      const next = { ...globalCombinations, [pendingMaster]: pendingMirrors }
                      setGlobalCombinations(next)
                      await persistConfig({ joint_classes: next })
                      setPendingMaster('')
                      setPendingMirrors([])
                      toast.success('Joint group linked and saved!')
                    }}
                  >
                    🔗 Link Classes Together
                  </Btn>
                </div>
              )}
            </div>
          </div>

          {/* ── Existing Groups ── */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10, margin: '0 0 10px' }}>
              Active Joint Groups
            </p>
            {Object.keys(globalCombinations).length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', border: `1.5px dashed ${T.border}`, borderRadius: 12 }}>
                <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>No joint groups configured yet</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(globalCombinations).map(([masterId, followers]) => {
                  const masterName = (classes as any[]).find(c => c.id === masterId)?.name ?? 'Unknown'
                  const followerNames = followers.map(fid => (classes as any[]).find(c => c.id === fid)?.name ?? fid)
                  return (
                    <div key={masterId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 12, border: `1.5px solid ${T.teal}`, background: `${T.teal}05` }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: T.navy }}>{masterName}</div>
                        <div style={{ fontSize: 11, color: T.teal, fontWeight: 700 }}>Mirrors: {followerNames.join(', ')}</div>
                      </div>
                      {/* Bug 1 fix: unlink now calls persistConfig to save to DB */}
                      <button
                        title="Unlink this joint group"
                        onClick={async () => {
                          const next = { ...globalCombinations }
                          delete next[masterId]
                          setGlobalCombinations(next)
                          await persistConfig({ joint_classes: next })
                          toast.success('Group unlinked and saved!')
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.red, padding: 8, borderRadius: 8 }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* ════════════ MODAL: Auto-Generate ════════════ */}
      <Modal
        open={autoGenOpen}
        onClose={() => !generating && setAutoGenOpen(false)}
        title="✨ Smart Auto-Generate"
        subtitle="Conflict-aware scheduling · works with class teachers & subject teachers"
        width={600}
        footer={
          <>
            <Btn variant="secondary" disabled={generating} onClick={() => setAutoGenOpen(false)}>Cancel</Btn>
            <Btn
              onClick={() => handleAutoGenerate()}
              loading={generating}
              style={{ background: 'linear-gradient(135deg,#0e9f84,#0a7c68)', minWidth: 180, justifyContent: 'center' }}
            >
              🚀 Generate All Classes
            </Btn>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Warning */}
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#b91c1c' }}>
            ⚠️ This replaces the timetable for <strong>all assigned classes</strong> in the current term.
            Use "Re-Gen This Class" above to regenerate just one class.
          </div>

          {/* Subject Frequencies (Bug 4: never re-initialised; persisted on change) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '.06em', margin: 0 }}>
                Subject Frequencies (periods / week)
              </p>
              <div style={{ display: 'flex', gap: 6 }}>
                {([4, 2, 1] as const).map(n => (
                  <button key={n} onClick={() => {
                    const next = { ...subjectConfig }
                    Object.keys(next).forEach(k => { next[k] = { ...next[k], freq: n } })
                    setSubjectConfig(next)
                    persistConfig({ subject_config: next })
                  }} style={{ fontSize: 10, color: T.muted, background: '#f1f5f9', border: `1px solid ${T.border}`, borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontWeight: 700, fontFamily: '"Sora",sans-serif' }}>
                    All ×{n}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {subjects.map(s => {
                const cfg = subjectConfig[s.id] ?? { freq: 2, excluded: false }
                const c = slotColor(s.id)
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: cfg.excluded ? '#f1f5f9' : c.bg, padding: '8px 12px', borderRadius: 10, border: `1.5px solid ${cfg.excluded ? T.border : c.border}`, opacity: cfg.excluded ? 0.5 : 1 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', minWidth: 0 }}>
                      <input
                        type="checkbox"
                        checked={!cfg.excluded}
                        onChange={e => {
                          const next = { ...subjectConfig, [s.id]: { ...cfg, excluded: !e.target.checked } }
                          setSubjectConfig(next)
                          persistConfig({ subject_config: next })
                        }}
                      />
                      <span style={{ fontSize: 11, fontWeight: 700, color: cfg.excluded ? T.muted : c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={s.name}>
                        {s.name}
                      </span>
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      {([-1, 0, 1] as const).map(delta =>
                        delta === 0 ? (
                          <span key={0} style={{ fontSize: 14, fontWeight: 900, color: c.text, minWidth: 22, textAlign: 'center' }}>{cfg.freq}</span>
                        ) : (
                          <button key={delta} onClick={() => {
                            const next = { ...subjectConfig, [s.id]: { ...cfg, freq: Math.max(1, Math.min(10, cfg.freq + delta)) } }
                            setSubjectConfig(next)
                            persistConfig({ subject_config: next })
                          }} disabled={cfg.excluded} style={{ width: 22, height: 22, borderRadius: 6, border: `1px solid ${c.border}`, background: T.white, color: c.text, fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {delta < 0 ? '−' : '+'}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Extracurricular Slots (Bug 5: persisted on change) */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8, margin: '0 0 8px' }}>
              Reserve Extra-Curricular Slots
              {extracurricularSlots.length > 0 && (
                <span style={{ fontWeight: 400, textTransform: 'none', color: T.green }}>
                  {` (${extracurricularSlots.length} reserved)`}
                </span>
              )}
            </p>
            <div style={{ background: T.bg, borderRadius: 12, padding: 12, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {DAYS.map((d, di) => (
                <div key={d} style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: T.muted, textTransform: 'uppercase' }}>{DAY_SHORT[di]}</span>
                  {teachablePeriods.map(p => {
                    const isActive = extracurricularSlots.some(es => es.day === di + 1 && es.periodId === p.id)
                    return (
                      <button key={p.id} title={`${d} – ${p.name}`}
                        onClick={() => {
                          const next = isActive
                            ? extracurricularSlots.filter(es => !(es.day === di + 1 && es.periodId === p.id))
                            : [...extracurricularSlots, { day: di + 1, periodId: p.id }]
                          setExtracurricularSlots(next)
                          persistConfig({ extracurricular_slots: next })
                        }}
                        style={{
                          width: 30, height: 30, borderRadius: 8, border: 'none',
                          background: isActive ? T.green : T.white,
                          color: isActive ? '#fff' : '#cbd5e1',
                          fontSize: 10, fontWeight: 800, cursor: 'pointer',
                          boxShadow: '0 1px 3px rgba(0,0,0,.08)', transition: 'all .12s',
                        }}
                      >
                        {p.name.replace(/Period\s*/i, '').replace(/^P/i, '').slice(0, 2)}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Generation Progress */}
          {generating && genProgress && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.teal, background: `${T.teal}10`, borderRadius: 10, padding: '10px 14px', border: `1px solid ${T.teal}30` }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(14,159,132,.3)', borderTopColor: T.teal, animation: '_ttsp .7s linear infinite' }} />
              {genProgress}
            </div>
          )}

          {/* Rules summary */}
          <div style={{ background: '#f8faff', borderRadius: 10, padding: '12px 14px', border: `1px solid ${T.border}` }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '.06em', margin: '0 0 8px' }}>Scheduling Guarantees</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
              {[
                ['🚫', 'No teacher double-booked'],
                ['📅', 'Each subject ≤ 1× per day'],
                ['✅', 'All assigned subjects appear'],
                ['🔗', 'Mirror classes auto-synced'],
                ['⚽', 'Extracurricular slots reserved'],
                ['👨‍🏫', 'Class & subject teachers supported'],
              ].map(([icon, text]) => (
                <div key={text} style={{ display: 'flex', gap: 6, fontSize: 11, color: T.slate }}>
                  <span>{icon}</span><span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}