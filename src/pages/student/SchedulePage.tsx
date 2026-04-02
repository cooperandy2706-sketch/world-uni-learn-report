// src/pages/student/SchedulePage.tsx
// Student's personalized class timetable — full weekly view with teacher names
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { useCurrentTerm } from '../../hooks/useSettings'
import { ROUTES } from '../../constants/routes'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const WEEKDAYS = [1, 2, 3, 4, 5]
const DAY_LABELS: Record<number, string> = { 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday' }

function timeToMins(t: string) { const [h, m] = (t ?? '00:00').split(':').map(Number); return h * 60 + m }

function formatTime(t: string) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hh = h % 12 || 12
  return `${hh}:${String(m).padStart(2, '0')} ${ampm}`
}

const SUBJECT_COLORS = [
  '#6d28d9', '#0891b2', '#16a34a', '#d97706', '#db2777',
  '#dc2626', '#7c3aed', '#059669', '#1d4ed8', '#9333ea',
]

export default function StudentSchedulePage() {
  const { user } = useAuth()
  const { data: term } = useCurrentTerm()

  const [studentData, setStudentData] = useState<any>(null)
  const [timetable, setTimetable] = useState<any[]>([])
  const [periods, setPeriods] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay() === 0 || new Date().getDay() === 6 ? 1 : new Date().getDay())
  const [viewMode, setViewMode] = useState<'today' | 'week'>('today')
  const [now] = useState(new Date())

  useEffect(() => { setTimeout(() => setMounted(true), 60) }, [])
  useEffect(() => { if (user?.id) loadSchedule() }, [user?.id, term?.id])

  async function loadSchedule() {
    setLoading(true)
    try {
      const { data: student } = await supabase.from('students').select('*, class:classes(id,name)').eq('user_id', user!.id).single()
      if (!student) { setLoading(false); return }
      setStudentData(student)

      if (!term?.id) { setLoading(false); return }

      const [slotsRes, periodsRes] = await Promise.all([
        supabase.from('timetable_slots')
          .select('*, subject:subjects(id,name), period:timetable_periods(id,name,start_time,end_time,is_break,sort_order), teacher:teachers(user:users(full_name))')
          .eq('class_id', student.class_id)
          .eq('term_id', term.id),
        supabase.from('timetable_periods')
          .select('*')
          .eq('school_id', student.school_id)
          .order('sort_order'),
      ])

      setTimetable(slotsRes.data ?? [])
      setPeriods(periodsRes.data ?? [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  // Build unique subject → color map
  const subjectColorMap: Record<string, string> = {}
  let colorIdx = 0
  timetable.forEach((s: any) => {
    if (s.subject?.id && !subjectColorMap[s.subject.id]) {
      subjectColorMap[s.subject.id] = SUBJECT_COLORS[colorIdx % SUBJECT_COLORS.length]
      colorIdx++
    }
  })

  const currentMins = now.getHours() * 60 + now.getMinutes()
  const todayDay = now.getDay()

  function getDaySlots(day: number) {
    return timetable
      .filter((s: any) => s.day_of_week === day)
      .sort((a: any, b: any) => (a.period?.sort_order ?? 0) - (b.period?.sort_order ?? 0))
  }

  function SlotCard({ slot, compact = false }: { slot: any; compact?: boolean }) {
    const color = slot.period?.is_break ? '#9ca3af' : (subjectColorMap[slot.subject?.id] ?? '#6d28d9')
    const sTime = slot.period?.start_time?.slice(0, 5) ?? ''
    const eTime = slot.period?.end_time?.slice(0, 5) ?? ''
    const sMins = timeToMins(sTime); const eMins = timeToMins(eTime)
    const isNow = selectedDay === todayDay && currentMins >= sMins && currentMins < eMins
    const isDone = selectedDay === todayDay && currentMins >= eMins
    const isBreak = slot.period?.is_break

    if (isBreak) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: compact ? '6px 10px' : '8px 12px', borderRadius: 8, background: '#f9fafb', border: '1px dashed #e5e7eb' }}>
          <span style={{ fontSize: 11, color: '#9ca3af' }}>☕</span>
          <span style={{ fontSize: compact ? 11 : 12, color: '#9ca3af', fontWeight: 500 }}>{slot.period?.name}</span>
          <span style={{ fontSize: 10, color: '#9ca3af', marginLeft: 'auto' }}>{formatTime(sTime)} – {formatTime(eTime)}</span>
        </div>
      )
    }

    return (
      <div style={{ borderRadius: compact ? 10 : 12, overflow: 'hidden', border: `1.5px solid ${color}30`, background: isNow ? color + '12' : isDone ? '#f9fafb' : color + '08', opacity: isDone && !isNow ? 0.7 : 1 }}>
        <div style={{ display: 'flex', alignItems: 'stretch' }}>
          <div style={{ width: 4, background: isNow ? color : color + '60', flexShrink: 0, borderRadius: '99px 0 0 99px' }} />
          <div style={{ flex: 1, padding: compact ? '8px 10px' : '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ fontSize: compact ? 12 : 13, fontWeight: 700, color: '#111827' }}>{slot.subject?.name}</span>
                  {isNow && <span style={{ fontSize: 9, fontWeight: 800, background: color, color: '#fff', padding: '1px 6px', borderRadius: 99 }}>LIVE</span>}
                  {isDone && !isNow && <span style={{ fontSize: 11, color: '#d1d5db' }}>✓</span>}
                </div>
                {slot.teacher?.user?.full_name && (
                  <div style={{ fontSize: compact ? 10 : 11, color: '#6b7280' }}>👤 {slot.teacher.user.full_name}</div>
                )}
                <div style={{ fontSize: compact ? 10 : 11, color: '#9ca3af', marginTop: 2 }}>{slot.period?.name}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: compact ? 11 : 12, fontWeight: 700, color }}>{formatTime(sTime)}</div>
                <div style={{ fontSize: 10, color: '#9ca3af' }}>{formatTime(eTime)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const todaySlots = getDaySlots(selectedDay)
  const activeSlot = todaySlots.find((s: any) => {
    const sMins = timeToMins(s.period?.start_time?.slice(0, 5)); const eMins = timeToMins(s.period?.end_time?.slice(0, 5))
    return todayDay === selectedDay && currentMins >= sMins && currentMins < eMins && !s.period?.is_break
  })
  const nextSlot = todaySlots.find((s: any) => !s.period?.is_break && timeToMins(s.period?.start_time?.slice(0, 5)) > currentMins)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _schfade{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes _schspin{to{transform:rotate(360deg)}}
        @keyframes _schlive{0%,100%{box-shadow:0 0 0 0 rgba(22,163,74,.25)}50%{box-shadow:0 0 0 6px rgba(22,163,74,0)}}
        .sch-day:hover{background:#ede9fe!important;color:#6d28d9!important}
        .sch-day{transition:all .15s;cursor:pointer;border:none;font-family:"DM Sans",sans-serif;font-weight:600}
        @media (max-width: 768px) {
          .sch-header { flex-direction: column !important; align-items: stretch !important; }
          .sch-controls { flex-direction: column !important; align-items: stretch !important; }
          .sch-day-view { grid-template-columns: 1fr !important; gap: 16px !important; }
          .sch-week-view-wrapper { overflow-x: auto; padding-bottom: 12px; -webkit-overflow-scrolling: touch; margin: 0 -16px; padding: 0 16px 12px; }
          .sch-week-view { min-width: 900px !important; }
        }
      `}</style>

      <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif', opacity: mounted ? 1 : 0, transition: 'opacity .4s ease' }}>

        {/* Header */}
        <div className="sch-header" style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, animation: '_schfade .5s ease both' }}>
          <div>
            <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>Class Schedule</h1>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 3 }}>
              {studentData?.class?.name ?? '—'} · {(term as any)?.name ?? 'No active term'}
            </p>
          </div>
          <Link to={ROUTES.STUDENT_DASHBOARD} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: '#fff', color: '#374151', textDecoration: 'none', border: '1.5px solid #e5e7eb' }}>← Dashboard</Link>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #ede9fe', borderTopColor: '#6d28d9', animation: '_schspin .8s linear infinite' }} />
            <p style={{ fontSize: 13, color: '#9ca3af' }}>Loading timetable…</p>
          </div>
        ) : timetable.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 16, padding: '64px 20px', textAlign: 'center', border: '1.5px solid #f0eefe' }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>📅</div>
            <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 6 }}>No timetable available</h3>
            <p style={{ fontSize: 13, color: '#9ca3af' }}>Your school administrator hasn't published a timetable for this term yet.</p>
          </div>
        ) : (
          <>
            {/* Active class banner */}
            {activeSlot && selectedDay === todayDay && (
              <div style={{ background: 'linear-gradient(135deg,#14532d,#16a34a)', borderRadius: 16, padding: '15px 20px', marginBottom: 16, color: '#fff', animation: '_schlive 3s ease infinite', position: 'relative', overflow: 'hidden' }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', opacity: .8, marginBottom: 3 }}>🟢 YOU SHOULD BE IN CLASS NOW</div>
                <h2 style={{ fontFamily: '"Playfair Display",serif', fontSize: 20, fontWeight: 700, margin: '0 0 2px' }}>{activeSlot.subject?.name}</h2>
                <p style={{ fontSize: 12, opacity: .85, margin: 0 }}>{activeSlot.period?.name} · {formatTime(activeSlot.period?.start_time?.slice(0, 5))} – {formatTime(activeSlot.period?.end_time?.slice(0, 5))}{activeSlot.teacher?.user?.full_name ? ` · ${activeSlot.teacher.user.full_name}` : ''}</p>
              </div>
            )}

            {/* View mode tabs + day selector */}
            <div className="sch-controls" style={{ background: '#fff', borderRadius: 14, padding: '12px 16px', border: '1.5px solid #f0eefe', marginBottom: 18, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between', animation: '_schfade .5s ease .08s both' }}>
              {/* View toggle */}
              <div style={{ display: 'flex', gap: 4, background: '#f5f3ff', borderRadius: 9, padding: 3 }}>
                {['today', 'week'].map(v => (
                  <button key={v} className="sch-day" onClick={() => setViewMode(v as any)}
                    style={{ padding: '6px 16px', borderRadius: 7, fontSize: 12, background: viewMode === v ? '#fff' : 'transparent', color: viewMode === v ? '#6d28d9' : '#6b7280', boxShadow: viewMode === v ? '0 1px 4px rgba(0,0,0,.08)' : 'none' }}>
                    {v === 'today' ? '📅 Day View' : '🗓️ Week View'}
                  </button>
                ))}
              </div>

              {/* Day pills */}
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {WEEKDAYS.map(day => {
                  const count = getDaySlots(day).filter((s: any) => !s.period?.is_break).length
                  const isToday = day === todayDay
                  const selected = day === selectedDay
                  return (
                    <button key={day} className="sch-day"
                      onClick={() => { setSelectedDay(day); setViewMode('today') }}
                      style={{ padding: '6px 13px', borderRadius: 99, fontSize: 12, background: selected ? '#6d28d9' : isToday ? '#f0fdf4' : '#faf5ff', color: selected ? '#fff' : isToday ? '#16a34a' : '#374151', border: `1.5px solid ${selected ? '#6d28d9' : isToday ? '#bbf7d0' : '#e5e7eb'}` }}>
                      {DAY_LABELS[day].slice(0, 3)} <span style={{ fontSize: 10, opacity: .7 }}>({count})</span>
                      {isToday && !selected && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#16a34a', display: 'inline-block', marginLeft: 4, verticalAlign: 'middle' }} />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Day view */}
            {viewMode === 'today' && (
              <div className="sch-day-view" style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 20, animation: '_schfade .4s ease .12s both' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <h2 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>{DAY_LABELS[selectedDay]}</h2>
                    {selectedDay === todayDay && <span style={{ fontSize: 11, fontWeight: 700, background: '#f0fdf4', color: '#16a34a', padding: '2px 9px', borderRadius: 99, border: '1px solid #bbf7d0' }}>TODAY</span>}
                  </div>
                  {todaySlots.length === 0 ? (
                    <div style={{ background: '#fff', borderRadius: 16, padding: '48px 20px', textAlign: 'center', border: '1.5px solid #f0eefe' }}>
                      <div style={{ fontSize: 40, marginBottom: 8 }}>🌟</div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: 0 }}>No classes on {DAY_LABELS[selectedDay]}</p>
                      <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>Enjoy your free day!</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {todaySlots.map((s: any, i: number) => (
                        <div key={s.id} style={{ animation: `_schfade .3s ease ${i * .04}s both` }}>
                          <SlotCard slot={s} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: weekly summary */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {nextSlot && selectedDay === todayDay && (
                    <div style={{ background: 'linear-gradient(135deg,#2e1065,#4c1d95)', borderRadius: 14, padding: '16px', color: '#fff' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', opacity: .7, marginBottom: 6 }}>⏭ NEXT UP</div>
                      <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 16, fontWeight: 700, marginBottom: 2 }}>{nextSlot.subject?.name}</div>
                      <div style={{ fontSize: 11, opacity: .8 }}>{formatTime(nextSlot.period?.start_time?.slice(0, 5))} · {nextSlot.period?.name}</div>
                      {nextSlot.teacher?.user?.full_name && <div style={{ fontSize: 11, opacity: .65, marginTop: 2 }}>👤 {nextSlot.teacher.user.full_name}</div>}
                    </div>
                  )}

                  {/* Week summary */}
                  <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #f0eefe', padding: '16px', boxShadow: '0 1px 4px rgba(109,40,217,.06)' }}>
                    <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 14, fontWeight: 700, color: '#111827', margin: '0 0 12px' }}>Week at a Glance</h3>
                    {WEEKDAYS.map(day => {
                      const slots = getDaySlots(day).filter((s: any) => !s.period?.is_break)
                      const isToday = day === todayDay
                      return (
                        <div key={day}
                          onClick={() => setSelectedDay(day)}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 9, marginBottom: 4, cursor: 'pointer', background: selectedDay === day ? '#f5f3ff' : 'transparent', transition: 'background .12s' }}
                          onMouseEnter={e => !( selectedDay === day) && (e.currentTarget.style.background = '#faf5ff')}
                          onMouseLeave={e => !( selectedDay === day) && (e.currentTarget.style.background = 'transparent')}>
                          <div style={{ width: 5, height: 5, borderRadius: '50%', background: isToday ? '#16a34a' : '#d1d5db', flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: selectedDay === day ? 700 : 600, color: selectedDay === day ? '#6d28d9' : '#374151' }}>{DAY_LABELS[day]}</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 3 }}>
                              {slots.slice(0, 4).map((s: any) => (
                                <span key={s.id} style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 99, background: (subjectColorMap[s.subject?.id] ?? '#6d28d9') + '18', color: subjectColorMap[s.subject?.id] ?? '#6d28d9' }}>{s.subject?.name?.split(' ')[0]}</span>
                              ))}
                              {slots.length > 4 && <span style={{ fontSize: 9, color: '#9ca3af' }}>+{slots.length - 4}</span>}
                            </div>
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', flexShrink: 0 }}>{slots.length} cls</div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Subjects legend */}
                  <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #f0eefe', padding: '16px', boxShadow: '0 1px 4px rgba(109,40,217,.06)' }}>
                    <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 14, fontWeight: 700, color: '#111827', margin: '0 0 11px' }}>My Subjects</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {Object.entries(subjectColorMap).map(([id, color]) => {
                        const slot = timetable.find((s: any) => s.subject?.id === id)
                        return slot ? (
                          <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
                            <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{slot.subject?.name}</span>
                          </div>
                        ) : null
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Week view */}
            {viewMode === 'week' && (
              <div className="sch-week-view-wrapper">
                <div className="sch-week-view" style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, animation: '_schfade .4s ease .12s both' }}>
                  {WEEKDAYS.map(day => {
                  const slots = getDaySlots(day)
                  const isToday = day === todayDay
                  return (
                    <div key={day} style={{ background: '#fff', borderRadius: 14, border: `1.5px solid ${isToday ? '#6d28d9' : '#f0eefe'}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(109,40,217,.06)' }}>
                      <div style={{ padding: '10px 12px', background: isToday ? 'linear-gradient(135deg,#6d28d9,#5b21b6)' : '#faf5ff', borderBottom: '1px solid #f0eefe', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: isToday ? '#fff' : '#374151' }}>{DAY_LABELS[day]}</span>
                        {isToday && <span style={{ fontSize: 9, fontWeight: 800, background: 'rgba(255,255,255,.2)', color: '#fff', padding: '1px 6px', borderRadius: 99 }}>TODAY</span>}
                      </div>
                      <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {slots.length === 0 ? (
                          <div style={{ padding: '16px 0', textAlign: 'center', fontSize: 12, color: '#d1d5db' }}>No classes</div>
                        ) : slots.map((s: any) => (
                          <div key={s.id}>
                            <SlotCard slot={s} compact />
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
