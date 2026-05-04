// src/services/timetable.service.ts
import { supabase } from '../lib/supabase'

export interface TimetableConfig {
  subject_config: Record<string, { freq: number; excluded: boolean; double_period?: boolean; preferred_time?: 'morning' | 'afternoon' }>
  extracurricular_slots: { day: number; periodId: string }[]
  joint_classes: Record<string, string[]>
  morning_cutoff_index?: number // Index of period where morning ends
}

export interface TimetableRequest {
  schoolId: string
  termId: string
  classes: any[]
  subjects: any[]
  teachers: any[]
  assignments: any[]
  periods: any[]
  config: TimetableConfig
  singleClassId?: string
}

export const TimetableService = {
  async generate({
    schoolId,
    termId,
    classes,
    subjects,
    teachers,
    assignments,
    periods,
    config,
    singleClassId
  }: TimetableRequest) {
    const tpList = periods.filter(p => !p.is_break)
    const mirrorIds = new Set(Object.values(config.joint_classes).flat())
    const masterClasses = classes.filter(c => !mirrorIds.has(c.id))

    // Determine which classes to process
    let classesToProcess = masterClasses
    if (singleClassId) {
      // Find master of the single class
      classesToProcess = masterClasses.filter(c => {
        if (c.id === singleClassId) return true
        for (const [mid, followers] of Object.entries(config.joint_classes)) {
          if (followers.includes(singleClassId) && c.id === mid) return true
        }
        return false
      })
    }

    let bestResult: { slots: any[]; missed: number; details: string[] } = {
      slots: [], missed: Infinity, details: []
    }

    // If single class re-gen, fetch teacher busy slots from OTHER classes ONCE before starting attempts
    const globalTeacherBusy = new Map<string, Set<string>>()
    if (singleClassId) {
      const targetCids = classesToProcess.map(c => c.id)
      const { data: otherSlots } = await supabase
        .from('timetable_slots')
        .select('teacher_id, day_of_week, period_id')
        .eq('term_id', termId)
        .not('class_id', 'in', `(${targetCids.join(',')})`)
      
      if (otherSlots) {
        otherSlots.forEach(s => {
          const key = `${s.day_of_week}:${s.period_id}`
          if (!globalTeacherBusy.has(key)) globalTeacherBusy.set(key, new Set())
          if (s.teacher_id) globalTeacherBusy.get(key)!.add(s.teacher_id)
        })
      }
    }

    // Run multiple attempts to find best fit
    for (let attempt = 1; attempt <= 10; attempt++) {
      const currentSlots: any[] = []
      // Clone the global teacher busy map to use as starting point for this attempt
      const teacherBusy = new Map<string, Set<string>>()
      globalTeacherBusy.forEach((val, key) => teacherBusy.set(key, new Set(val)))

      let attemptMissed = 0
      const details: string[] = []

      // Shuffle classes to vary attempts
      const shuffledClasses = [...classesToProcess].sort(() => Math.random() - 0.5)

      for (const cls of shuffledClasses) {
        const classAssigns = assignments.filter(a => a.class_id === cls.id)
        if (!classAssigns.length) continue

        const wantList = classAssigns
          .map(a => {
            const sc = config.subject_config[a.subject_id] || { freq: 2, excluded: false }
            return {
              teacher_id: a.teacher_id,
              subject_id: a.subject_id,
              name: subjects.find((s: any) => s.id === a.subject_id)?.name ?? '?',
              freq: sc.excluded ? 0 : sc.freq,
              double_period: sc.double_period ?? false,
              preferred_time: sc.preferred_time ?? null,
              placed: 0,
            }
          })
          .filter(w => w.freq > 0)
          .sort((a, b) => b.freq - a.freq) // Prioritize subjects with higher frequency

        const classBusy = new Set<string>()
        const subjectDays = new Map<string, Set<number>>()

        const canPlace = (teacherId: string, subjectId: string, day: number, pid: string, checkConsecutive = false) => {
          const key = `${day}:${pid}`
          if (classBusy.has(key)) return false
          if (teacherBusy.get(key)?.has(teacherId)) return false
          if (config.extracurricular_slots.some(es => es.day === day && es.periodId === pid)) return false
          if (subjectDays.get(subjectId)?.has(day)) return false

          // Time preference check
          if (config.morning_cutoff_index !== undefined) {
            const pIdx = tpList.findIndex(p => p.id === pid)
            const sc = config.subject_config[subjectId]
            if (sc?.preferred_time === 'morning' && pIdx > config.morning_cutoff_index) return false
            if (sc?.preferred_time === 'afternoon' && pIdx <= config.morning_cutoff_index) return false
          }

          return true
        }

        const place = (teacherId: string, subjectId: string, day: number, pid: string) => {
          const key = `${day}:${pid}`
          classBusy.add(key)
          if (!teacherBusy.has(key)) teacherBusy.set(key, new Set())
          teacherBusy.get(key)!.add(teacherId)
          if (!subjectDays.has(subjectId)) subjectDays.set(subjectId, new Set())
          subjectDays.get(subjectId)!.add(day)
          currentSlots.push({
            school_id: schoolId,
            class_id: cls.id,
            subject_id: subjectId,
            teacher_id: teacherId || null,
            period_id: pid,
            day_of_week: day,
            term_id: termId,
          })
        }

        // Try to place double periods first
        for (const w of wantList.filter(x => x.double_period)) {
          const days = [1, 2, 3, 4, 5].sort(() => Math.random() - 0.5)
          for (const d of days) {
            if (w.placed >= w.freq) break
            for (let i = 0; i < tpList.length - 1; i++) {
              const p1 = tpList[i]
              const p2 = tpList[i+1]
              // Check if both periods are teaching periods and consecutive
              if (canPlace(w.teacher_id, w.subject_id, d, p1.id) && canPlace(w.teacher_id, w.subject_id, d, p2.id)) {
                place(w.teacher_id, w.subject_id, d, p1.id)
                place(w.teacher_id, w.subject_id, d, p2.id)
                w.placed += 2
                break // Only one double period per day
              }
            }
          }
        }

        // Fill remaining slots
        const shuffledWant = [...wantList].sort(() => Math.random() - 0.5)
        for (const w of shuffledWant) {
          while (w.placed < w.freq) {
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

        // Propagate mirror busy slots
        const followers = config.joint_classes[cls.id] ?? []
        if (followers.length > 0) {
          const masterNewSlots = currentSlots.filter(s => s.class_id === cls.id)
          for (const slot of masterNewSlots) {
            const key = `${slot.day_of_week}:${slot.period_id}`
            if (!teacherBusy.has(key)) teacherBusy.set(key, new Set())
            teacherBusy.get(key)!.add(slot.teacher_id)
          }
        }
      }

      if (attemptMissed < bestResult.missed) {
        bestResult = { slots: currentSlots, missed: attemptMissed, details }
      }
      if (bestResult.missed === 0) break
    }

    // Mirrors
    const mirrored: any[] = []
    for (const [masterId, followers] of Object.entries(config.joint_classes)) {
      if (!classesToProcess.some(c => c.id === masterId)) continue
      const masterSlots = bestResult.slots.filter(s => s.class_id === masterId)
      followers.forEach(fid =>
        masterSlots.forEach(s => mirrored.push({ ...s, class_id: fid }))
      )
    }

    return {
      finalSlots: [...bestResult.slots, ...mirrored],
      missed: bestResult.missed,
      details: bestResult.details,
      mirroredCount: mirrored.length
    }
  }
}
