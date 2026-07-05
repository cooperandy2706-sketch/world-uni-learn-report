import { useStuckLoadingReload } from '../../hooks/useStuckLoadingReload'
// src/pages/teacher/TimetablePage.tsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useCurrentTerm } from '../../hooks/useSettings'

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday']
const DAY_SHORT = ['Mon','Tue','Wed','Thu','Fri']

export default function TeacherTimetablePage(){
  const {user}=useAuth()
  const {data:term}=useCurrentTerm()
  const [slots,setSlots]=useState<any[]>([])
  const [periods,setPeriods]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  useStuckLoadingReload(loading)
  const [todayDay]=useState(()=>{
    const d=new Date().getDay() // 0=Sun
    return d>=1&&d<=5?d:1
  })

  async function load(){
    setLoading(true)
    const {data:t}=await supabase.from('teachers').select('id').eq('user_id',user!.id).maybeSingle()
    if(!t){setLoading(false);return}

    // Find if this teacher is a substitute for anyone today
    const today = new Date().toISOString().slice(0, 10)
    const { data: activeLeaves } = await supabase
      .from('leave_requests')
      .select('user_id')
      .eq('substitute_id', user!.id)
      .eq('status', 'approved')
      .lte('start_date', today)
      .gte('end_date', today)
      
    const absentUserIds = activeLeaves?.map((l: any) => l.user_id) || []
    
    let absentTeacherIds: string[] = []
    if (absentUserIds.length > 0) {
      const { data: absentTeachers } = await supabase
        .from('teachers')
        .select('id')
        .in('user_id', absentUserIds)
      absentTeacherIds = absentTeachers?.map((t: any) => t.id) || []
    }

    const allTeacherIdsForSlots = [t.id, ...absentTeacherIds]

    const [{data:p},{data:s}]=await Promise.all([
      supabase.from('timetable_periods').select('*').eq('school_id',user!.school_id).order('sort_order'),
      supabase.from('timetable_slots')
        .select('*,subject:subjects(id,name),class:classes(id,name),period:timetable_periods(id,name,start_time,end_time)')
        .in('teacher_id',allTeacherIdsForSlots).eq('term_id',(term as any).id),
    ])
    setPeriods(p??[])
    setSlots(s??[])
    setLoading(false)
  }

  useEffect(()=>{if(user&&term?.id)load()},[user,term?.id])


  function getSlot(day:number,periodId:string){
    return slots.find(s=>s.day_of_week===day&&s.period_id===periodId)
  }

  const todaySlots=slots.filter(s=>s.day_of_week===todayDay).sort((a,b)=>{
    const pa=periods.find(p=>p.id===a.period_id)?.sort_order??0
    const pb=periods.find(p=>p.id===b.period_id)?.sort_order??0
    return pa-pb
  })

  const [selectedDay, setSelectedDay] = useState(todayDay)

  const now = new Date()
  const currentMins = now.getHours() * 60 + now.getMinutes()

  function timeToMins(t: string) {
    const [h, m] = (t || '').split(':').map(Number)
    return ((isNaN(h) ? 0 : h) * 60) + (isNaN(m) ? 0 : m)
  }

  const daySlots = slots
    .filter(s => s.day_of_week === selectedDay)
    .sort((a, b) => {
      const pa = periods.find((p: any) => p.id === a.period_id)?.sort_order ?? 0
      const pb = periods.find((p: any) => p.id === b.period_id)?.sort_order ?? 0
      return pa - pb
    })

  const periodsForDay = periods
    .filter((p: any) => !p.is_break)
    .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

  if (loading) return (
    <div className="tp-page">
      <div className="tp-loading"><div className="tp-spinner" />Loading timetable…</div>
    </div>
  )

  return (
    <div className="tp-page">
      <link rel="stylesheet" href="/src/styles/teacher-portal.css" />

      {/* ── HERO ── */}
      <div className="tp-hero" style={{ marginBottom: 16 }}>
        <div className="tp-hero-label">Weekly Schedule</div>
        <h1 className="tp-hero-title">📅 My Timetable</h1>
        <p className="tp-hero-sub">{(term as any)?.name} · {DAYS[todayDay - 1]} is today</p>
      </div>

      {/* ── DAY SELECTOR STRIP ── */}
      <div className="tp-day-strip">
        {DAYS.map((day, i) => {
          const dayNum = i + 1
          const isToday = dayNum === todayDay
          const date = new Date()
          // Offset to show correct date for each day
          const diff = dayNum - (date.getDay() === 0 ? 7 : date.getDay())
          const d = new Date(date)
          d.setDate(d.getDate() + diff)
          return (
            <button
              key={day}
              className={`tp-day-pill${isToday ? ' today' : ''}${selectedDay === dayNum ? ' active' : ''}`}
              onClick={() => setSelectedDay(dayNum)}
            >
              <span className="tp-day-name">{DAY_SHORT[i]}</span>
              <span className="tp-day-num">{d.getDate()}</span>
            </button>
          )
        })}
      </div>

      {/* ── TODAY SUMMARY BAR ── */}
      {selectedDay === todayDay && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, padding: '10px 14px', background: 'rgba(22,163,74,0.07)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: 12 }}>
          <div className="tp-live-dot" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#16A34A' }}>
            {daySlots.length} lesson{daySlots.length !== 1 ? 's' : ''} today
          </span>
          {(() => {
            const nowSlot = daySlots.find((s: any) => {
              const p = periods.find((pp: any) => pp.id === s.period_id)
              if (!p) return false
              const start = timeToMins(p.start_time?.slice(0, 5) || '')
              const end = timeToMins(p.end_time?.slice(0, 5) || '')
              return currentMins >= start && currentMins < end
            })
            if (nowSlot) {
              return (
                <span className="tp-badge tp-badge-green" style={{ marginLeft: 'auto' }}>
                  Now: {nowSlot.subject?.name}
                </span>
              )
            }
            return null
          })()}
        </div>
      )}

      {/* ── TIMELINE ── */}
      <div className="tp-card" style={{ overflow: 'hidden' }}>
        <div className="tp-card-head">
          <span className="tp-card-title">{DAYS[selectedDay - 1]}'s Lessons</span>
          <span className="tp-badge tp-badge-purple">{daySlots.length} periods</span>
        </div>

        {daySlots.length === 0 ? (
          <div className="tp-empty">
            <div className="tp-empty-icon">🌟</div>
            <div className="tp-empty-title">No lessons</div>
            <p className="tp-empty-sub">No timetable slots for this day. Enjoy the free time!</p>
          </div>
        ) : (
          <div>
            {periods
              .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
              .map((period: any) => {
                const slot = slots.find((s: any) => s.day_of_week === selectedDay && s.period_id === period.id)
                const start = period.start_time?.slice(0, 5)
                const end = period.end_time?.slice(0, 5)
                const startMins = timeToMins(start || '')
                const endMins = timeToMins(end || '')
                const isNow = selectedDay === todayDay && currentMins >= startMins && currentMins < endMins
                const isPast = selectedDay === todayDay && currentMins >= endMins

                if (period.is_break) {
                  return (
                    <div key={period.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 18px', background: 'rgba(245,158,11,0.06)', borderBottom: '1px solid var(--border-color)' }}>
                      <div style={{ width: 80, fontSize: 10, fontWeight: 700, color: '#D97706', flexShrink: 0, textAlign: 'right' }}>{start}–{end}</div>
                      <div style={{ width: 16, display: 'flex', justifyContent: 'center' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#F59E0B' }} />
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#D97706' }}>🍎 {period.name}</div>
                    </div>
                  )
                }
