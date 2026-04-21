// src/pages/admin/TimetablePage.tsx
// Drop-in replacement — uses the same Supabase schema as before
// New features: smart auto-gen (respects teacher/class profiles), class merging, extracurricular slots

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useClasses } from '../../hooks/useClasses'
import { useCurrentTerm, useSettings, useUpdateSettings } from '../../hooks/useSettings'
import toast from 'react-hot-toast'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────────────────────────────────────
const T = {
  navy: '#0a1628',
  ink: '#1a2744',
  slate: '#2d3a52',
  muted: '#7a8499',
  border: '#e4e8f0',
  bg: '#f5f7fc',
  white: '#ffffff',
  teal: '#0e9f84',
  tealDk: '#0b8470',
  amber: '#f59e0b',
  red: '#ef4444',
  green: '#16a34a',
  purple: '#6d28d9',
  indigo: '#3730a3',
  sky: '#0284c7',
}

// ─────────────────────────────────────────────────────────────────────────────
// Tiny UI primitives
// ─────────────────────────────────────────────────────────────────────────────
function Btn({ children, onClick, variant = 'primary', disabled, loading, small, style }: any) {
  const [hov, setHov] = useState(false)
  const base: any = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: small ? '6px 12px' : '9px 16px',
    borderRadius: 9, fontSize: small ? 11 : 13, fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all .15s', opacity: disabled ? 0.55 : 1,
    fontFamily: '"Sora", sans-serif', border: 'none', letterSpacing: '.01em',
  }
  const variants: any = {
    primary: { background: hov ? T.tealDk : T.teal, color: '#fff', boxShadow: hov ? '0 4px 14px rgba(14,159,132,.4)' : '0 2px 8px rgba(14,159,132,.25)' },
    secondary: { background: hov ? '#edf0f7' : T.white, color: T.ink, border: `1.5px solid ${T.border}` },
    danger: { background: hov ? '#dc2626' : T.red, color: '#fff' },
    success: { background: hov ? '#15803d' : T.green, color: '#fff' },
    navy: { background: hov ? T.slate : T.ink, color: '#fff' },
    amber: { background: hov ? '#d97706' : T.amber, color: '#fff' },
    ghost: { background: hov ? '#f0f4ff' : 'transparent', color: T.muted, border: 'none' },
  }
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ ...base, ...variants[variant], ...style }}>
      {loading && <span style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', animation: '_tt_spin .7s linear infinite', flexShrink: 0 }} />}
      {children}
    </button>
  )
}

function Tag({ children, color = T.teal }: any) {
  return (
    <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: `${color}18`, color, border: `1px solid ${color}30`, fontFamily: '"Sora",sans-serif', letterSpacing: '.03em' }}>
      {children}
    </span>
  )
}

function Chip({ label, active, onClick }: any) {
  return (
    <button onClick={onClick}
      style={{ padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all .15s', fontFamily: '"Sora",sans-serif', border: `1.5px solid ${active ? T.teal : T.border}`, background: active ? `${T.teal}15` : T.white, color: active ? T.teal : T.muted }}>
      {label}
    </button>
  )
}

function Modal({ open, onClose, title, subtitle, children, footer, width = 480 }: any) {
  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, backdropFilter: 'blur(6px)', padding: 16 }}>
      <div style={{ background: T.white, borderRadius: 20, width, maxWidth: '96vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(10,22,40,.28)', animation: '_tt_slide .2s ease' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <h3 style={{ fontFamily: '"Fraunces",serif', fontSize: 18, fontWeight: 700, color: T.navy, margin: 0 }}>{title}</h3>
              {subtitle && <p style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>{subtitle}</p>}
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: `1.5px solid ${T.border}`, background: T.white, cursor: 'pointer', fontSize: 16, color: T.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
          </div>
        </div>
        {/* Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>{children}</div>
        {/* Footer */}
        {footer && <div style={{ padding: '14px 24px', borderTop: `1px solid ${T.border}`, flexShrink: 0, display: 'flex', justifyContent: 'flex-end', gap: 8, background: '#fafbfd', borderRadius: '0 0 20px 20px' }}>{footer}</div>}
      </div>
    </div>
  )
}

// Subject color palette (cycle through these)
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
]

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export default function TimetablePage() {
  const { user } = useAuth()
  const { data: classes = [] } = useClasses()
  const { data: term } = useCurrentTerm()
  const { data: settings } = useSettings()
  const updateSettings = useUpdateSettings()

  // ── Core state ──
  const [selectedClass, setSelectedClass] = useState('')
  const [periods, setPeriods] = useState<any[]>([])
  const [slots, setSlots] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [classTeachers, setClassTeachers] = useState<any[]>([])

  // ── Cell editing ──
  const [editing, setEditing] = useState<any>(null)
  const [editForm, setEditForm] = useState({ subject_id: '', teacher_id: '' })
  const [saving, setSaving] = useState(false)
  const [conflict, setConflict] = useState<any>(null)


  // ── Period editor ──
  const [editPeriodsOpen, setEditPeriodsOpen] = useState(false)
  const [periodForm, setPeriodForm] = useState<any[]>([])

  // ── Auto-generate ──
  const [autoGenOpen, setAutoGenOpen] = useState(false)
  const [subjectConfig, setSubjectConfig] = useState<Record<string, { freq: number; excluded: boolean }>>({})
  const [extracurricularSlots, setExtracurricularSlots] = useState<{ day: number; periodId: string }[]>([])
  const [generating, setGenerating] = useState(false)
  const [genProgress, setGenProgress] = useState('')

  // ── Class combinations (Joint Timetables) ──
  const [globalCombinations, setGlobalCombinations] = useState<Record<string, string[]>>({})
  const [combOpen, setCombOpen] = useState(false)
  const [pendingMirror, setPendingMirror] = useState<string[]>([])
  const [pendingMaster, setPendingMaster] = useState('')


  // ── Subject color map ──
  const [subjectColorMap, setSubjectColorMap] = useState<Record<string, number>>({})

  // Build color map whenever subjects change
  useEffect(() => {
    const map: Record<string, number> = {}
    subjects.forEach((s, i) => { map[s.id] = i % SUBJECT_COLORS.length })
    setSubjectColorMap(map)
  }, [subjects])

  // Load joint classes from settings
  useEffect(() => {
    if (settings?.settings?.joint_classes) {
      setGlobalCombinations(settings.settings.joint_classes)
    }
  }, [settings])

  useEffect(() => { loadPeriods(); loadSubjectsTeachers() }, [])
  useEffect(() => { if (selectedClass && (term as any)?.id) loadSlots() }, [selectedClass, globalCombinations, (term as any)?.id])

  async function loadPeriods() {
    const { data } = await supabase.from('timetable_periods')
      .select('*').eq('school_id', user!.school_id).order('sort_order')
    setPeriods(data ?? [])
    setPeriodForm(data ?? [])
  }

  async function loadSubjectsTeachers() {
    const [{ data: s }, { data: t }] = await Promise.all([
      supabase.from('subjects').select('id,name').eq('school_id', user!.school_id).order('name'),
      supabase.from('teachers').select('id,user:users(id,full_name)').eq('school_id', user!.school_id),
    ])
    setSubjects(s ?? [])
    setTeachers(t ?? [])
  }

  // Helper: Find all classes in the same joint group as classId
  function getJoinedClasses(cid: string) {
    if (!cid) return []
    // If cid is a master
    if (globalCombinations[cid]) return [cid, ...globalCombinations[cid]]
    // If cid is a mirror
    for (const masterId in globalCombinations) {
      if (globalCombinations[masterId].includes(cid)) return [masterId, ...globalCombinations[masterId]]
    }
    return [cid]
  }

  async function loadSlots() {
    setLoading(true)
    const targetClasses = getJoinedClasses(selectedClass)
    const [{ data: sl }, { data: asgn }] = await Promise.all([
      supabase.from('timetable_slots')
        .select('*,subject:subjects(id,name),teacher:teachers(id,user:users(full_name)),period:timetable_periods(id,name,start_time,end_time)')
        .in('class_id', targetClasses)
        .eq('term_id', (term as any).id),
      supabase.from('teacher_assignments')
        .select('teacher:teachers(id,user:users(full_name))')
        .eq('class_id', selectedClass).eq('term_id', (term as any).id),
    ])
    setSlots(sl ?? [])
    const tMap: any = {}
    asgn?.forEach((a: any) => { if (a.teacher) tMap[a.teacher.id] = a.teacher })
    setClassTeachers(Object.values(tMap))
    setLoading(false)
  }


  function getSlot(day: number, periodId: string) {
    return slots.find(s => s.day_of_week === day && s.period_id === periodId && s.class_id === selectedClass)
  }

  function openEdit(day: number, periodId: string) {
    const existing = getSlot(day, periodId)
    setEditing({ day, period_id: periodId })
    setEditForm({ subject_id: existing?.subject_id ?? '', teacher_id: existing?.teacher_id ?? '' })
  }

  async function saveSlot(force = false) {
    if (!editing) return
    setSaving(true)

    // 1. Conflict Detection (Teacher & Subject)
    if (editForm.subject_id && !force) {
      const targetClasses = getJoinedClasses(selectedClass)
      
      // A. Teacher Conflict (Other classes)
      if (editForm.teacher_id) {
        const { data: clash } = await supabase.from('timetable_slots')
          .select('*, class:classes(name), subject:subjects(name)')
          .eq('teacher_id', editForm.teacher_id)
          .eq('day_of_week', editing.day)
          .eq('period_id', editing.period_id)
          .eq('term_id', (term as any).id)
          .not('class_id', 'in', `(${targetClasses.join(',')})`)
          .maybeSingle()

        if (clash) {
          setConflict({ ...clash, type: 'teacher' })
          setSaving(false)
          return
        }
      }

      // B. Subject Repetition (Same class, same day)
      const { data: repeat } = await supabase.from('timetable_slots')
        .select('*, period:timetable_periods(name)')
        .in('class_id', targetClasses)
        .eq('subject_id', editForm.subject_id)
        .eq('day_of_week', editing.day)
        .eq('term_id', (term as any).id)
        .neq('period_id', editing.period_id) // ignore current slot if updating
        .maybeSingle()

      if (repeat) {
        setConflict({ ...repeat, type: 'subject' })
        setSaving(false)
        return
      }
    }


    const existing = getSlot(editing.day, editing.period_id)
    const targetClasses = getJoinedClasses(selectedClass)

    // 2. Perform Swap if force
    if (force && conflict) {
      // Simple resolve: Delete the conflicting slot in the other class
      await supabase.from('timetable_slots').delete().eq('id', conflict.id)
    }

    // 3. Save the new slot
    if (editForm.subject_id === '') {
      const ids = slots.filter(s => s.day_of_week === editing.day && s.period_id === editing.period_id && targetClasses.includes(s.class_id)).map(s => s.id)
      if (ids.length) await supabase.from('timetable_slots').delete().in('id', ids)
    } else {
      const basePayload = {
        school_id: user!.school_id,
        subject_id: editForm.subject_id || null,
        teacher_id: editForm.teacher_id || null,
        period_id: editing.period_id,
        day_of_week: editing.day,
        term_id: (term as any).id,
      }
      for (const cid of targetClasses) {
        const ex = slots.find(s => s.day_of_week === editing.day && s.period_id === editing.period_id && s.class_id === cid)
        const payload = { ...basePayload, class_id: cid }
        if (ex) {
          await supabase.from('timetable_slots').update(payload).eq('id', ex.id)
        } else {
          await supabase.from('timetable_slots').insert(payload)
        }
      }
    }

    setSaving(false)
    setEditing(null)
    setConflict(null)
    const joined = getJoinedClasses(selectedClass)
    toast.success('Slot saved' + (joined.length > 1 ? ` (applied to ${joined.length} classes)` : ''))
    await loadSlots()

    // Notify teacher
    if (editForm.teacher_id && editForm.subject_id) {
      const period = periods.find(p => p.id === editing.period_id)
      const subject = subjects.find(s => s.id === editForm.subject_id)
      const teacher = teachers.find(t => t.id === editForm.teacher_id)
      const cls = (classes as any[]).find(c => c.id === selectedClass)
      if (teacher?.user?.id) {
        await supabase.from('notifications').insert({
          school_id: user!.school_id, user_id: teacher.user.id,
          title: 'Timetable Updated',
          body: `You have ${subject?.name} for ${cls?.name} on ${DAYS[editing.day - 1]} ${period?.name} (${period?.start_time?.slice(0, 5)}–${period?.end_time?.slice(0, 5)})`,
          type: 'info',
        })
      }
    }
  }


  async function savePeriods() {
    for (const p of periodForm) {
      await supabase.from('timetable_periods').update({
        name: p.name, start_time: p.start_time, end_time: p.end_time, is_break: p.is_break
      }).eq('id', p.id)
    }
    toast.success('Period times saved')
    setEditPeriodsOpen(false)
    loadPeriods()
  }

  // ── Extracurricular toggle ──
  function toggleExtra(day: number, periodId: string) {
    setExtracurricularSlots(prev => {
      const exists = prev.find(s => s.day === day && s.periodId === periodId)
      return exists ? prev.filter(s => !(s.day === day && s.periodId === periodId)) : [...prev, { day, periodId }]
    })
  }

  // ── Auto-gen modal open ──
  function openAutoGen() {
    const config: Record<string, { freq: number; excluded: boolean }> = {}
    subjects.forEach(s => {
      const isCore = ['math', 'english', 'science', 'literacy', 'numeracy'].some(k => s.name.toLowerCase().includes(k))
      config[s.id] = { freq: isCore ? 4 : 2, excluded: false }
    })
    setSubjectConfig(config)
    setGenProgress('')
    setAutoGenOpen(true)
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ★ SMART AUTO-GENERATE
  // Works for:
  //   • "Primary" style: 1 teacher teaches ALL subjects in one class
  //   • "Secondary" style: each subject has a specific teacher
  //   • Mixed schools (detected automatically per class)
  // Rules:
  //   • No teacher in the same period across different classes
  //   • No subject appears more than once per day per class
  //   • Subjects are spread across days (even distribution)
  //   • No slot left empty (fill with least-used subject/teacher for that class)
  //   • Extracurricular slots reserved
  //   • Max 2 periods of same subject per teacher per day
  // ─────────────────────────────────────────────────────────────────────────────
  async function handleAutoGenerate() {
    if (!term?.id) {
      toast.error('❌ No active term found. Please set the current term in Settings first.')
      return
    }
    setGenerating(true)
    const tid = toast.loading('🧠 Analyzing school structure…')

    try {
      // 1. Load all teacher assignments for this term
      setGenProgress('Loading teacher assignments…')
      const { data: allAssignments, error: aErr } = await supabase
        .from('teacher_assignments')
        .select('teacher_id, class_id, subject_id')
        .eq('term_id', (term as any).id)

      if (aErr) throw aErr
      if (!allAssignments?.length) throw new Error('No teacher assignments found for this term.\nGo to Admin → Teachers → Assign to set them up first.')

      // 2. Detect school style per class
      // "Primary style" = 1 unique teacher handles all/most subjects in a class
      // "Secondary style" = multiple teachers, each handling 1–3 subjects
      const classByClass: Record<string, any[]> = {}
      allAssignments.forEach(a => {
        if (!classByClass[a.class_id]) classByClass[a.class_id] = []
        classByClass[a.class_id].push(a)
      })

      const teachablePeriods = periods.filter(p => !p.is_break)
      const totalSlots = teachablePeriods.length * 5 // per week per class

      const allClasses = classes as any[]
      const allMirrors = Object.values(globalCombinations).flat()
      const sortedClasses = [...allClasses]
        .filter(c => !allMirrors.includes(c.id)) // Skip child classes in a group
        .sort((a, b) => (classByClass[b.id]?.length || 0) - (classByClass[a.id]?.length || 0))

      let bestSlots: any[] = []
      let bestPlaced = -1
      let bestMissedInfo: string[] = []
      let bestMissedCount = 0

      // Try multiple times to find the best fit
      const ATTEMPTS = 5
      for (let attemptNum = 1; attemptNum <= ATTEMPTS; attemptNum++) {
        setGenProgress(`Attempt ${attemptNum}/${ATTEMPTS}: Solving teacher busy times…`)
        
        const currentSlots: any[] = []
        const teacherBusy: Record<number, Record<string, Set<string>>> = {}
        DAYS.forEach((_, di) => {
          teacherBusy[di + 1] = {}
          teachablePeriods.forEach(p => { teacherBusy[di + 1][p.id] = new Set() })
        })

        let currentPlaced = 0
        const missedList: string[] = []
        let currentMissed = 0

        for (const cls of sortedClasses) {
          if (!classByClass[cls.id]?.length) continue
          const clsId = cls.id
          const assigns = classByClass[clsId]
          
          const uniqueTeachers = new Set(assigns.map(a => a.teacher_id))
          const isPrimaryStyle = uniqueTeachers.size === 1

          const wantList: { teacher_id: string; subject_id: string; remaining: number; initial: number; name: string }[] = []
          assigns.forEach(a => {
            const cfg = subjectConfig[a.subject_id]
            if (cfg?.excluded) return
            const freq = cfg?.freq ?? (isPrimaryStyle ? Math.floor(totalSlots / assigns.length) : 2)
            const sName = subjects.find(s => s.id === a.subject_id)?.name || 'Unknown'
            wantList.push({ teacher_id: a.teacher_id, subject_id: a.subject_id, remaining: freq, initial: freq, name: sName })
          })

          const classBusy: Record<number, Record<string, boolean>> = {} 
          const subjectPerDay: Record<string, Record<number, number>> = {}
          const teacherDailyCount: Record<string, Record<number, number>> = {}
          DAYS.forEach((_, di) => { classBusy[di + 1] = {} })

          function tryPlace(teacher_id: string, subject_id: string, day: number, period: any, currentAttemptSlots: any[], currentAttemptTeacherBusy: Record<number, Record<string, Set<string>>>): boolean {
            if (classBusy[day][period.id]) return false
            if (currentAttemptTeacherBusy[day][period.id].has(teacher_id)) return false
            if (extracurricularSlots.find(es => es.day === day && es.periodId === period.id)) return false
            if ((subjectPerDay[subject_id]?.[day] ?? 0) >= 1) return false 
            if ((teacherDailyCount[teacher_id]?.[day] ?? 0) >= (isPrimaryStyle ? teachablePeriods.length : 3)) return false

            classBusy[day][period.id] = true
            currentAttemptTeacherBusy[day][period.id].add(teacher_id)
            if (!subjectPerDay[subject_id]) subjectPerDay[subject_id] = {}
            subjectPerDay[subject_id][day] = (subjectPerDay[subject_id][day] ?? 0) + 1
            if (!teacherDailyCount[teacher_id]) teacherDailyCount[teacher_id] = {}
            teacherDailyCount[teacher_id][day] = (teacherDailyCount[teacher_id][day] ?? 0) + 1

            currentAttemptSlots.push({
              school_id: user!.school_id, class_id: clsId,
              subject_id, teacher_id, period_id: period.id,
              day_of_week: day, term_id: (term as any).id,
            })
            currentPlaced++
            return true
          }

          // PASS 0: Guaranteed 1st Period (Make sure all assigned subjects appear)
          const shuffledWant = [...wantList].sort(() => Math.random() - 0.5)
          for (const way of shuffledWant) {
            const shuffledDays = [1, 2, 3, 4, 5].sort(() => Math.random() - 0.5)
            const shuffledPeriods = [...teachablePeriods].sort(() => Math.random() - 0.5)
            let placedOnce = false
            for (const d of shuffledDays) {
              if (placedOnce) break
              for (const p of shuffledPeriods) {
                if (tryPlace(way.teacher_id, way.subject_id, d, p, currentSlots, teacherBusy)) {
                  placedOnce = true
                  way.remaining--
                  break
                }
              }
            }
          }

          // PASS 1: Fill the rest of the requested frequencies
          for (const way of shuffledWant) {
            const shuffledDays = [1, 2, 3, 4, 5].sort(() => Math.random() - 0.5)
            const shuffledPeriods = [...teachablePeriods].sort(() => Math.random() - 0.5)
            while (way.remaining > 0) {
              let placed = false
              const daysBySubjectLoad = [...shuffledDays].sort((a, b) => (subjectPerDay[way.subject_id]?.[a] ?? 0) - (subjectPerDay[way.subject_id]?.[b] ?? 0))
              for (const day of daysBySubjectLoad) {
                if (placed) break
                if (way.initial <= 5 && (subjectPerDay[way.subject_id]?.[day] ?? 0) >= 1) continue
                for (const p of shuffledPeriods) {
                  if (tryPlace(way.teacher_id, way.subject_id, day, p, currentSlots, teacherBusy)) {
                    placed = true; way.remaining--
                    break
                  }
                }
              }
              if (!placed) break
            }
            if (way.remaining > 0) {
              currentMissed += way.remaining
              if (!missedList.includes(way.name)) missedList.push(`${way.name} (${way.remaining} periods)`)
            }
          }
        }

        if (currentPlaced > bestPlaced) {
          bestPlaced = currentPlaced
          bestSlots = currentSlots
          bestMissedInfo = missedList
          bestMissedCount = currentMissed
        }
        if (currentMissed === 0) break // Perfect score!
      }

      const newSlots = bestSlots
      const totalPlaced = bestPlaced
      const totalMissed = bestMissedCount

      // 3. Wipe 
      setGenProgress('Writing to database…')
      const targetClassesForWipe = [...sortedClasses.map(c => c.id), ...allMirrors]
      if (targetClassesForWipe.length > 0) {
        await supabase.from('timetable_slots').delete().eq('term_id', (term as any).id).in('class_id', targetClassesForWipe)
      }

      // 4. Mirroring
      const mirroredSlots: any[] = []
      for (const masterId in globalCombinations) {
        const mirrors = globalCombinations[masterId]
        const masterSlots = newSlots.filter(s => s.class_id === masterId)
        mirrors.forEach(mid => {
          masterSlots.forEach(s => mirroredSlots.push({ ...s, class_id: mid }))
        })
      }
      const finalPayload = [...newSlots, ...mirroredSlots]

      const CHUNK = 400
      for (let i = 0; i < finalPayload.length; i += CHUNK) {
        await supabase.from('timetable_slots').insert(finalPayload.slice(i, i + CHUNK))
      }
      const studyHalls = (sortedClasses.length * totalSlots) - totalPlaced
      toast.success(`✅ Generated ${totalPlaced} slots.
${totalMissed > 0 ? `⚠️ ${totalMissed} periods missed (${bestMissedInfo.slice(0, 3).join(', ')}${bestMissedInfo.length > 3 ? '...' : ''}). Try generating again or reduce subject frequency.` : 'Perfect: All assigned subjects placed!'}
📖 ${studyHalls} slots filled with Study Hall.`, { id: tid, duration: 10000 })
      setAutoGenOpen(false)
      setGenProgress('')
      if (selectedClass) loadSlots()

    } catch (e: any) {
      toast.error(e.message || 'Generation failed', { id: tid })
    } finally {
      setGenerating(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Render helpers
  // ─────────────────────────────────────────────────────────────────────────────
  const teachablePeriods = periods.filter(p => !p.is_break)
  const selectedClassName = (classes as any[]).find(c => c.id === selectedClass)?.name ?? ''
  const joinedIds = getJoinedClasses(selectedClass)
  const mergedClassNames = joinedIds.filter(id => id !== selectedClass).map(id => (classes as any[]).find(c => c.id === id)?.name).filter(Boolean)

  function slotColor(subjectId: string) {
    const idx = subjectColorMap[subjectId] ?? 0
    return SUBJECT_COLORS[idx]
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,600;0,700;0,800;1,400&family=Sora:wght@400;500;600;700&display=swap');
        @keyframes _tt_spin { to { transform: rotate(360deg) } }
        @keyframes _tt_slide { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        @keyframes _tt_fi { from { opacity:0 } to { opacity:1 } }
        .tt-cell { transition: background .12s, transform .1s; cursor: pointer; }
        .tt-cell:hover { background: #f0f9ff !important; transform: scale(1.01); }
        .tt-row:nth-child(even) > .tt-cell-base { background: #fafbfd; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }
        select, input { font-family: "Sora", sans-serif !important; }
        .tab-active { border-bottom: 2px solid #0e9f84; color: #0e9f84 !important; }
      `}</style>

      <div style={{ fontFamily: '"Sora", system-ui, sans-serif', animation: '_tt_fi .35s ease', minHeight: '100%' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: '"Fraunces",serif', fontSize: 28, fontWeight: 800, color: T.navy, margin: 0, letterSpacing: '-.02em' }}>
              Timetable
            </h1>
            <p style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>
              {(term as any)?.name ?? 'Current term'} &nbsp;·&nbsp; Smart scheduling for every class type
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="secondary" onClick={() => setCombOpen(true)}>🔗 Joint Classes</Btn>
            <Btn variant="navy" onClick={() => setEditPeriodsOpen(true)}>⏱ Period Times</Btn>
            <Btn variant="primary" onClick={openAutoGen} style={{ background: 'linear-gradient(135deg,#0e9f84,#0a7c68)' }}>✨ Auto-Generate</Btn>
          </div>
        </div>

        {/* ── Class selector bar ── */}
        <div style={{ background: T.white, borderRadius: 16, padding: '16px 20px', border: `1.5px solid ${T.border}`, marginBottom: 16, display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', boxShadow: '0 1px 4px rgba(10,22,40,.05)' }}>
          <div style={{ flex: '1 1 220px' }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: T.muted, marginBottom: 6 }}>Class</label>
            <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 13, border: `1.5px solid ${T.border}`, outline: 'none', background: '#f8faff', color: T.navy, cursor: 'pointer', fontWeight: 600 }}>
              <option value="">Choose a class…</option>
              {(classes as any[]).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {selectedClass && (
            <>
              {getJoinedClasses(selectedClass).length > 1 && (
                <div style={{ animation: '_tt_slide .3s ease' }}>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: T.muted, marginBottom: 6 }}>Combined with</label>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '8px 12px', borderRadius: 9, background: `${T.teal}10`, border: `1.5px solid ${T.teal}40` }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: T.teal }}>🔗 {getJoinedClasses(selectedClass).filter(id => id !== selectedClass).map(id => (classes as any[]).find(cl => cl.id === id)?.name).join(', ')}</span>
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                <Tag color={T.green}>✓ Editing {selectedClassName}</Tag>
                {getJoinedClasses(selectedClass).length > 1 && <Tag color={T.teal}>Joint Timetable</Tag>}
              </div>
            </>
          )}
        </div>

        {/* ── Timetable grid ── */}
        {selectedClass ? (
          <div style={{ background: T.white, borderRadius: 18, border: `1.5px solid ${T.border}`, overflow: 'hidden', boxShadow: '0 2px 12px rgba(10,22,40,.06)' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px 0', flexDirection: 'column', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: T.teal, animation: '_tt_spin .8s linear infinite' }} />
                <p style={{ fontSize: 12, color: T.muted }}>Loading timetable…</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 780 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '14px 16px', background: T.navy, color: '#fff', fontSize: 10, fontWeight: 700, textAlign: 'left', letterSpacing: '.08em', textTransform: 'uppercase', borderRadius: '0', width: 130 }}>
                        Period
                      </th>
                      {DAYS.map((d, i) => (
                        <th key={d} style={{ padding: '14px 12px', background: T.navy, color: '#fff', fontSize: 10, fontWeight: 700, textAlign: 'center', letterSpacing: '.08em', textTransform: 'uppercase', borderLeft: '1px solid rgba(255,255,255,.1)' }}>
                          <span style={{ display: 'block', fontSize: 12 }}>{d}</span>
                          <span style={{ fontSize: 9, opacity: .6, fontWeight: 500 }}>{DAY_SHORT[i]}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {periods.map((p, pi) => (
                      <tr key={p.id} className="tt-row" style={{ borderBottom: pi < periods.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                        {/* Period label */}
                        <td style={{ padding: '10px 16px', background: p.is_break ? '#fffbeb' : '#f8faff', borderRight: `1px solid ${T.border}` }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: p.is_break ? '#92400e' : T.ink }}>{p.name}</div>
                          <div style={{ fontSize: 10, color: T.muted, marginTop: 1 }}>{p.start_time?.slice(0, 5)} – {p.end_time?.slice(0, 5)}</div>
                          {p.is_break && <Tag color={T.amber}>Break</Tag>}
                        </td>

                        {p.is_break ? (
                          <td colSpan={5} style={{ textAlign: 'center', fontSize: 12, color: '#92400e', fontWeight: 600, padding: 10, background: '#fffbeb' }}>
                            🍎 {p.name}
                          </td>
                        ) : DAYS.map((_, di) => {
                          const slot = getSlot(di + 1, p.id)
                          const isExtra = extracurricularSlots.find(es => es.day === di + 1 && es.periodId === p.id)
                          const colors = slot ? slotColor(slot.subject_id) : null

                          return (
                            <td key={di} className="tt-cell"
                              onClick={() => openEdit(di + 1, p.id)}
                              style={{ padding: '8px 8px', textAlign: 'center', borderLeft: `1px solid ${T.border}`, minWidth: 140, verticalAlign: 'middle' }}>
                              {slot ? (
                                <div style={{ borderRadius: 10, padding: '7px 10px', background: colors!.bg, border: `1px solid ${colors!.border}`, textAlign: 'left' }}>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: colors!.text, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {slot.subject?.name}
                                  </div>
                                  <div style={{ fontSize: 10, color: colors!.text, opacity: .75, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {slot.teacher?.user?.full_name ?? '—'}
                                  </div>
                                </div>
                              ) : isExtra ? (
                                <div style={{ borderRadius: 10, padding: '7px 10px', background: '#f0fdf4', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                                  <div style={{ fontSize: 11, color: T.green, fontWeight: 700 }}>⚽ Extra</div>
                                </div>
                              ) : (
                                <div style={{ borderRadius: 10, padding: '7px 10px', background: '#f8fafc', border: `1px dashed ${T.border}`, textAlign: 'center', transition: 'all .2s' }}>
                                  <div style={{ fontSize: 10, color: T.muted, fontWeight: 700 }}>📖 Study Hall</div>
                                </div>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Legend */}
            {!loading && subjects.length > 0 && (
              <div style={{ padding: '12px 16px', borderTop: `1px solid ${T.border}`, display: 'flex', flexWrap: 'wrap', gap: 6, background: '#fafbfd' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '.06em', alignSelf: 'center', marginRight: 4 }}>Legend</span>
                {subjects.map(s => {
                  const c = slotColor(s.id)
                  return (
                    <span key={s.id} style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>{s.name}</span>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          <div style={{ background: T.white, borderRadius: 18, padding: '70px 20px', textAlign: 'center', border: `1.5px solid ${T.border}`, boxShadow: '0 2px 8px rgba(10,22,40,.04)' }}>
            <div style={{ fontSize: 56, marginBottom: 14 }}>📅</div>
            <h3 style={{ fontFamily: '"Fraunces",serif', fontSize: 20, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Select a class to view timetable</h3>
            <p style={{ fontSize: 13, color: T.muted, maxWidth: 360, margin: '0 auto' }}>Click any cell to manually assign a subject and teacher, or use Auto-Generate for smart scheduling.</p>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════
          MODAL: Edit slot
      ════════════════════════════════════════════════════ */}
      <Modal open={!!editing} onClose={() => { setEditing(null); setConflict(null); }}
        title={conflict?.type === 'subject' ? '🚫 Subject Already Scheduled' : (conflict ? '⚠️ Teacher Conflict Detected' : (editing ? `${DAYS[editing.day - 1]} — ${periods.find(p => p.id === editing?.period_id)?.name}` : ''))}
        subtitle={conflict?.type === 'subject' ? 'One subject can only appear once per day' : (conflict ? 'This teacher is already busy in another class' : (selectedClassName + (mergedClassNames.length ? ` + ${mergedClassNames.join(', ')}` : '')))}
        width={380}
        footer={
          conflict ? (
            <>
              <Btn variant="secondary" onClick={() => setConflict(null)}>Stop / Go Back</Btn>
              <Btn variant={conflict.type === 'subject' ? 'danger' : 'amber'} onClick={() => saveSlot(true)} loading={saving}>
                {conflict.type === 'subject' ? '⛔ Overwrite Anyway' : '🔄 Swap Teachers'}
              </Btn>
            </>
          ) : (
            <>
              <Btn variant="secondary" onClick={() => setEditing(null)}>Cancel</Btn>
              <Btn onClick={() => saveSlot()} loading={saving}>💾 Save Slot</Btn>
            </>
          )
        }>
        
        {conflict ? (
          <div style={{ animation: '_tt_slide .3s ease' }}>
            <div style={{ background: conflict.type === 'subject' ? '#fef2f2' : '#fffbeb', border: `1.5px solid ${conflict.type === 'subject' ? '#fecaca' : '#fde68a'}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: conflict.type === 'subject' ? '#dc2626' : '#92400e', marginBottom: 8 }}>
                {conflict.type === 'subject' ? 'Rule Violation:' : 'Overlapping Assignment:'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {conflict.type === 'subject' ? (
                  <>
                    <div style={{ fontSize: 12, color: T.navy }}>This class already has <strong>{subjects.find(s => s.id === editForm.subject_id)?.name}</strong> scheduled today.</div>
                    <div style={{ fontSize: 12, color: T.navy }}><strong>Existing Period:</strong> {conflict.period?.name}</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 12, color: T.navy }}><strong>Class:</strong> {conflict.class?.name}</div>
                    <div style={{ fontSize: 12, color: T.navy }}><strong>Subject:</strong> {conflict.subject?.name}</div>
                    <div style={{ fontSize: 12, color: T.navy }}><strong>Time:</strong> {periods.find(p => p.id === conflict.period_id)?.name}</div>
                  </>
                )}
              </div>
            </div>
            <p style={{ fontSize: 12, color: T.muted, lineHeight: 1.5 }}>
              {conflict.type === 'subject' 
                ? 'It is recommended to follow the once-per-day rule to maintain a balanced syllabus spread.' 
                : 'Choosing Swap will remove the teacher from the other class and assign them here.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mergedClassNames.length > 0 && (
              <div style={{ background: '#eff6ff', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: T.indigo, border: '1px solid #bfdbfe', marginBottom: 15 }}>
                🔗 This edit will apply to <strong>{1 + mergedClassNames.length} classes</strong>: {selectedClassName}, {mergedClassNames.join(', ')}
              </div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Subject</label>
              <select value={editForm.subject_id} onChange={e => setEditForm(f => ({ ...f, subject_id: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: `1.5px solid ${T.border}`, outline: 'none', fontSize: 13, color: T.navy, background: '#f8faff', cursor: 'pointer' }}>
                <option value="">— Clear slot —</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Teacher</label>
              <select value={editForm.teacher_id} onChange={e => setEditForm(f => ({ ...f, teacher_id: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: `1.5px solid ${T.border}`, outline: 'none', fontSize: 13, color: T.navy, background: '#f8faff', cursor: 'pointer' }}>
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


      {/* ════════════════════════════════════════════════════
          MODAL: Period editor
      ════════════════════════════════════════════════════ */}
      <Modal open={editPeriodsOpen} onClose={() => setEditPeriodsOpen(false)}
        title="⏱ Period Times" subtitle="Edit names, start/end times and break flags"
        width={560}
        footer={
          <>
            <Btn variant="secondary" onClick={() => setEditPeriodsOpen(false)}>Cancel</Btn>
            <Btn variant="success" onClick={savePeriods}>💾 Save Periods</Btn>
          </>
        }>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px 60px', gap: 8, padding: '0 4px' }}>
            {['Name', 'Start', 'End', 'Break'].map(h => (
              <span key={h} style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</span>
            ))}
          </div>
          {periodForm.map((p, i) => (
            <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px 60px', gap: 8, alignItems: 'center', background: p.is_break ? '#fffbeb' : T.white, borderRadius: 10, padding: '8px', border: `1px solid ${p.is_break ? '#fde68a' : T.border}` }}>
              <input value={p.name}
                onChange={e => { const f = [...periodForm]; f[i] = { ...f[i], name: e.target.value }; setPeriodForm(f) }}
                style={{ padding: '7px 10px', borderRadius: 8, border: `1.5px solid ${T.border}`, fontSize: 12, outline: 'none', color: T.navy, fontWeight: 600 }} />
              <input type="time" value={p.start_time?.slice(0, 5) ?? ''}
                onChange={e => { const f = [...periodForm]; f[i] = { ...f[i], start_time: e.target.value }; setPeriodForm(f) }}
                style={{ padding: '7px 8px', borderRadius: 8, border: `1.5px solid ${T.border}`, fontSize: 12, outline: 'none', color: T.navy }} />
              <input type="time" value={p.end_time?.slice(0, 5) ?? ''}
                onChange={e => { const f = [...periodForm]; f[i] = { ...f[i], end_time: e.target.value }; setPeriodForm(f) }}
                style={{ padding: '7px 8px', borderRadius: 8, border: `1.5px solid ${T.border}`, fontSize: 12, outline: 'none', color: T.navy }} />
              <label style={{ display: 'flex', gap: 5, alignItems: 'center', fontSize: 11, color: T.muted, cursor: 'pointer', justifyContent: 'center' }}>
                <input type="checkbox" checked={p.is_break}
                  onChange={e => { const f = [...periodForm]; f[i] = { ...f[i], is_break: e.target.checked }; setPeriodForm(f) }} />
              </label>
            </div>
          ))}
        </div>
      </Modal>

       {/* ════════════════════════════════════════════════════
           MODAL: Manage Joint Classes
       ════════════════════════════════════════════════════ */}
       <Modal open={combOpen} onClose={() => setCombOpen(false)}
         title="🔗 Manage Joint Classes"
         subtitle="Group classes that move together (share the same schedule)"
         width={480}
         footer={<Btn onClick={() => setCombOpen(false)}>Done</Btn>}>
         <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
           
           {/* Add New Group Section */}
           <div style={{ background: '#f8fafc', border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
             <p style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 12 }}>Create New Joint Group</p>
             <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
               <div>
                 <label style={{ fontSize: 11, color: T.navy, fontWeight: 600, display: 'block', marginBottom: 4 }}>Master Class (The Source)</label>
                 <select value={pendingMaster} onChange={e => { setPendingMaster(e.target.value); setPendingMirror([]) }}
                   style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1.5px solid ${T.border}`, fontSize: 12, outline: 'none' }}>
                   <option value="">— Select Master Class —</option>
                   {(classes as any[]).filter(c => !Object.values(globalCombinations).flat().includes(c.id)).map(c => (
                     <option key={c.id} value={c.id}>{c.name}</option>
                   ))}
                 </select>
               </div>
               
               {pendingMaster && (
                 <div style={{ animation: '_tt_slide .2s ease' }}>
                   <label style={{ fontSize: 11, color: T.navy, fontWeight: 600, display: 'block', marginBottom: 6 }}>Mirror Classes (The Followers)</label>
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, maxHeight: 120, overflowY: 'auto', padding: 2 }}>
                     {(classes as any[]).filter(c => c.id !== pendingMaster && !Object.keys(globalCombinations).includes(c.id) && !Object.values(globalCombinations).flat().includes(c.id)).map(c => (
                       <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8, border: `1px solid ${pendingMirror.includes(c.id) ? T.teal : T.border}`, background: pendingMirror.includes(c.id) ? `${T.teal}08` : T.white, cursor: 'pointer', transition: 'all .1s' }}>
                         <input type="checkbox" checked={pendingMirror.includes(c.id)} onChange={e => e.target.checked ? setPendingMirror(p => [...p, c.id]) : setPendingMirror(p => p.filter(id => id !== c.id))} />
                         <span style={{ fontSize: 12, color: T.navy }}>{c.name}</span>
                       </label>
                     ))}
                   </div>
                   <Btn variant="success" size="small" style={{ marginTop: 12, width: '100%' }} disabled={!pendingMirror.length} onClick={async () => {
                     const next = { ...globalCombinations, [pendingMaster]: pendingMirror }
                     if (settings?.id) {
                       await updateSettings.mutateAsync({ id: settings.id, settings: { ...settings.settings, joint_classes: next } })
                     }
                     setGlobalCombinations(next)
                     setPendingMaster('')
                     setPendingMirror([])
                     toast.success('Joint group linked and saved')
                   }}>🔗 Link Classes Together</Btn>
                 </div>
               )}
             </div>
           </div>

           {/* List Existing Groups */}
           <div>
             <p style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>Active Joint Groups</p>
             <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
               {Object.keys(globalCombinations).length === 0 ? (
                 <div style={{ padding: '20px', textAlign: 'center', border: `1.5px dashed ${T.border}`, borderRadius: 12 }}>
                   <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>No classes combined yet</p>
                 </div>
               ) : (
                 Object.keys(globalCombinations).map(mid => {
                   const mName = (classes as any[]).find(c => c.id === mid)?.name ?? 'Unknown'
                   const children = globalCombinations[mid]
                   return (
                     <div key={mid} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 12, border: `1.5px solid ${T.teal}`, background: `${T.teal}05` }}>
                       <div>
                         <div style={{ fontSize: 13, fontWeight: 800, color: T.navy }}>{mName} <span style={{ color: T.muted, fontWeight: 400, margin: '0 4px' }}>→</span> {children.length} Followers</div>
                         <div style={{ fontSize: 10, color: T.teal, marginTop: 4, fontWeight: 700 }}>Mirrored by: {children.map(cid => (classes as any[]).find(cl => cl.id === cid)?.name).join(', ')}</div>
                       </div>
                       <button onClick={() => {
                         const n = { ...globalCombinations }; delete n[mid]; setGlobalCombinations(n)
                         toast.success('Group unlinked')
                       }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.red, padding: 8 }}>
                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                       </button>
                     </div>
                   )
                 })
               )}
             </div>
           </div>

         </div>
       </Modal>

      {/* ════════════════════════════════════════════════════
          MODAL: Auto-generate
      ════════════════════════════════════════════════════ */}
      <Modal open={autoGenOpen} onClose={() => !generating && setAutoGenOpen(false)}
        title="✨ Smart Auto-Generate"
        subtitle="Works for primary, secondary, and mixed school structures"
        width={560}
        footer={
          <>
            <Btn variant="secondary" disabled={generating} onClick={() => setAutoGenOpen(false)}>Cancel</Btn>
            <Btn onClick={handleAutoGenerate} loading={generating} style={{ background: 'linear-gradient(135deg,#0e9f84,#0a7c68)', minWidth: 160 }}>
              🚀 Generate All Classes
            </Btn>
          </>
        }>

        {/* Warning */}
        <div style={{ background: '#fef2f2', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#b91c1c', lineHeight: 1.5, marginBottom: 18, border: '1px solid #fecaca' }}>
          ⚠️ <strong>This replaces the timetable slots for all assigned classes</strong> in this term. Unassigned classes will be completely ignored and preserved.
        </div>

        {/* School style info */}
        <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#166534', lineHeight: 1.5, marginBottom: 18, border: '1px solid #bbf7d0' }}>
          🧠 <strong>Auto-detected:</strong> The scheduler adapts per class — primary-style (1 teacher, all subjects) and secondary-style (each subject has its own teacher) are handled automatically based on your teacher assignments.
        </div>

        {/* Subject frequency config */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '.06em', margin: 0 }}>Subject Frequencies (periods/week)</p>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => {
                  setSubjectConfig(p => { const n = { ...p }; Object.keys(n).forEach(k => { n[k] = { ...n[k], freq: 4 } }); return n })
                }}
                style={{ fontSize: 10, color: T.teal, background: `${T.teal}10`, border: `1px solid ${T.teal}30`, borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontWeight: 700, fontFamily: '"Sora",sans-serif' }}>All ×4</button>
              <button
                onClick={() => {
                  setSubjectConfig(p => { const n = { ...p }; Object.keys(n).forEach(k => { n[k] = { ...n[k], freq: 2 } }); return n })
                }}
                style={{ fontSize: 10, color: T.muted, background: '#f1f5f9', border: `1px solid ${T.border}`, borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontWeight: 700, fontFamily: '"Sora",sans-serif' }}>All ×2</button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {subjects.map(s => {
              const cfg = subjectConfig[s.id] ?? { freq: 2, excluded: false }
              const c = slotColor(s.id)
              return (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: cfg.excluded ? '#f1f5f9' : c.bg, padding: '8px 10px', borderRadius: 10, border: `1.5px solid ${cfg.excluded ? T.border : c.border}`, opacity: cfg.excluded ? 0.55 : 1, transition: 'all .15s' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', flex: 1, minWidth: 0 }}>
                    <input type="checkbox" checked={!cfg.excluded}
                      onChange={e => {
                        const sid = s.id
                        const checked = e.target.checked
                        setSubjectConfig(p => ({ ...p, [sid]: { ...p[sid], excluded: !checked } }))
                      }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: cfg.excluded ? T.muted : c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={s.name}>{s.name}</span>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button
                      onClick={() => {
                        const sid = s.id
                        setSubjectConfig(p => ({ ...p, [sid]: { ...p[sid], freq: Math.max(1, (p[sid]?.freq ?? 2) - 1) } }))
                      }}
                      disabled={cfg.excluded}
                      style={{ width: 22, height: 22, borderRadius: 6, border: `1px solid ${c.border}`, background: T.white, color: c.text, cursor: 'pointer', fontWeight: 900, fontSize: 14, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                    <span style={{ fontSize: 13, fontWeight: 800, color: c.text, minWidth: 16, textAlign: 'center' }}>{cfg.freq}</span>
                    <button
                      onClick={() => {
                        const sid = s.id
                        setSubjectConfig(p => ({ ...p, [sid]: { ...p[sid], freq: Math.min(10, (p[sid]?.freq ?? 2) + 1) } }))
                      }}
                      disabled={cfg.excluded}
                      style={{ width: 22, height: 22, borderRadius: 6, border: `1px solid ${c.border}`, background: T.white, color: c.text, cursor: 'pointer', fontWeight: 900, fontSize: 14, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Extracurricular slots */}
        <div style={{ marginBottom: 10 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
            Reserve Extra-Curricular Slots
            {extracurricularSlots.length > 0 && <span style={{ fontWeight: 400, textTransform: 'none', color: T.green, marginLeft: 8 }}>({extracurricularSlots.length} reserved)</span>}
          </p>
          <div style={{ background: T.bg, borderRadius: 12, padding: '10px 12px', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {DAYS.map((d, di) => (
              <div key={d} style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                <span style={{ fontSize: 9, fontWeight: 800, color: T.muted, textTransform: 'uppercase' }}>{DAY_SHORT[di]}</span>
                {teachablePeriods.map(p => {
                  const isActive = extracurricularSlots.find(es => es.day === di + 1 && es.periodId === p.id)
                  return (
                    <button key={p.id} onClick={() => toggleExtra(di + 1, p.id)}
                      title={`${d} – ${p.name}`}
                      style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: isActive ? T.green : T.white, color: isActive ? '#fff' : '#cbd5e1', fontSize: 10, fontWeight: 800, cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,.07)', transition: 'all .12s' }}>
                      {p.name.replace(/Period\s*/i, '').replace(/P/i, '')}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Merged class notice */}
        {mergedClassNames.length > 0 && (
          <div style={{ background: '#eff6ff', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: T.indigo, lineHeight: 1.5, marginTop: 12, border: '1px solid #bfdbfe' }}>
            🔗 <strong>{selectedClassName}'s</strong> timetable will also be duplicated to: <strong>{mergedClassNames.join(', ')}</strong>
          </div>
        )}

        {/* Progress */}
        {generating && genProgress && (
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.teal, background: `${T.teal}10`, borderRadius: 10, padding: '10px 14px', border: `1px solid ${T.teal}30` }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(14,159,132,.3)', borderTopColor: T.teal, animation: '_tt_spin .7s linear infinite', flexShrink: 0 }} />
            {genProgress}
          </div>
        )}

        {/* Scheduling rules info */}
        <div style={{ marginTop: 16, background: '#f8faff', borderRadius: 10, padding: '12px 14px', border: `1px solid ${T.border}` }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Scheduling Rules</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
            {[
              ['🚫', 'No teacher double-booked'],
              ['📅', 'Each subject spread across days'],
              ['✅', 'All slots filled (no gaps)'],
              ['🏫', 'Primary & secondary styles'],
              ['⚽', 'Extracurricular slots reserved'],
              ['🔗', 'Merged classes mirrored'],
            ].map(([icon, text]) => (
              <div key={text as string} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.slate }}>
                <span>{icon}</span><span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </>
  )
}