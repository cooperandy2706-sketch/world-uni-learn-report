// src/pages/teacher/LessonTrackerPage.tsx
// Detects upcoming lessons from timetable and shows countdown + alerts
import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useCurrentTerm } from '../../hooks/useSettings'
import toast from 'react-hot-toast'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function timeToMinutes(t: string): number {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
}

function minutesToTime(m: number): string {
    const h = Math.floor(m / 60)
    const min = m % 60
    return `${h}:${min.toString().padStart(2, '0')}`
}

function formatCountdown(seconds: number): string {
    if (seconds <= 0) return 'NOW'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}h ${m}m`
    if (m > 0) return `${m}m ${s}s`
    return `${s}s`
}

type LessonStatus = 'upcoming' | 'soon' | 'now' | 'done' | 'next'

interface Lesson {
    id: string
    subject: string
    class: string
    period: string
    startTime: string
    endTime: string
    startMinutes: number
    endMinutes: number
    dayOfWeek: number
    status: LessonStatus
    countdown: number
    progress: number // 0-100 if ongoing
    notes: string
}

export default function LessonTrackerPage() {
    const { user } = useAuth()
    const { data: term } = useCurrentTerm()
    const [lessons, setLessons] = useState<Lesson[]>([])
    const [todayLessons, setTodayLessons] = useState<Lesson[]>([])
    const [loading, setLoading] = useState(true)
    const [now, setNow] = useState(new Date())
    const [tab, setTab] = useState<'today' | 'week' | 'tracker'>('today')
    const [noteModal, setNoteModal] = useState<Lesson | null>(null)
    const [noteText, setNoteText] = useState('')
    const [notes, setNotes] = useState<Record<string, string>>({})
    const [alerted, setAlerted] = useState<Set<string>>(new Set())
    const tickRef = useRef<any>(null)

    useEffect(() => { if (user && term) load() }, [user, term])

    // Tick every second
    useEffect(() => {
        tickRef.current = setInterval(() => setNow(new Date()), 1000)
        return () => clearInterval(tickRef.current)
    }, [])

    // Load saved notes from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem(`wula_notes_${user?.id}`)
            if (saved) setNotes(JSON.parse(saved))
        } catch { }
    }, [user])

    async function load() {
        setLoading(true)
        const { data: t } = await supabase.from('teachers').select('id').eq('user_id', user!.id).single()
        if (!t) { setLoading(false); return }

        const [{ data: slots }, { data: periods }] = await Promise.all([
            supabase.from('timetable_slots')
                .select('*, subject:subjects(id,name), class:classes(id,name), period:timetable_periods(id,name,start_time,end_time,is_break,sort_order)')
                .eq('teacher_id', t.id)
                .eq('term_id', (term as any).id),
            supabase.from('timetable_periods')
                .select('*').eq('school_id', user!.school_id).order('sort_order'),
        ])

        const rawLessons: Lesson[] = (slots ?? [])
            .filter((s: any) => !s.period?.is_break)
            .map((s: any) => ({
                id: s.id,
                subject: s.subject?.name ?? '—',
                class: s.class?.name ?? '—',
                period: s.period?.name ?? '—',
                startTime: s.period?.start_time?.slice(0, 5) ?? '00:00',
                endTime: s.period?.end_time?.slice(0, 5) ?? '00:00',
                startMinutes: timeToMinutes(s.period?.start_time?.slice(0, 5) ?? '00:00'),
                endMinutes: timeToMinutes(s.period?.end_time?.slice(0, 5) ?? '00:00'),
                dayOfWeek: s.day_of_week,
                status: 'upcoming' as LessonStatus,
                countdown: 0,
                progress: 0,
                notes: '',
            }))

        setLessons(rawLessons)
        setLoading(false)
    }

    // Compute lesson statuses every tick
    const computedLessons = useCallback((): Lesson[] => {
        const day = now.getDay() // 0=Sun, 1=Mon..5=Fri
        const currentMinutes = now.getHours() * 60 + now.getMinutes()

        return lessons.map(l => {
            const isToday = l.dayOfWeek === day
            const secondsToStart = isToday ? (l.startMinutes - currentMinutes) * 60 - now.getSeconds() : Infinity
            const secondsToEnd = isToday ? (l.endMinutes - currentMinutes) * 60 - now.getSeconds() : Infinity

            let status: LessonStatus = 'upcoming'
            let countdown = 0
            let progress = 0

            if (isToday) {
                if (secondsToEnd <= 0) {
                    status = 'done'
                } else if (secondsToStart <= 0) {
                    status = 'now'
                    const totalDuration = (l.endMinutes - l.startMinutes) * 60
                    const elapsed = totalDuration + secondsToStart
                    progress = Math.min(100, Math.round((elapsed / totalDuration) * 100))
                    countdown = Math.max(0, secondsToEnd)
                } else if (secondsToStart <= 300) { // 5 mins
                    status = 'soon'
                    countdown = secondsToStart
                } else {
                    status = 'upcoming'
                    countdown = secondsToStart
                }
            }

            return { ...l, status, countdown, progress, notes: notes[l.id] ?? '' }
        })
    }, [lessons, now, notes])

    // Check for alerts
    useEffect(() => {
        const computed = computedLessons()
        computed.forEach(l => {
            // Alert 5 minutes before
            if (l.status === 'soon' && l.countdown <= 300 && l.countdown > 290 && !alerted.has(`soon_${l.id}`)) {
                setAlerted(prev => new Set([...prev, `soon_${l.id}`]))
                toast(`🔔 ${l.subject} for ${l.class} starts in 5 minutes!`, {
                    duration: 8000,
                    style: { background: '#f59e0b', color: '#fff', fontWeight: 600 },
                    icon: '⏰',
                })
                // Browser notification
                if (Notification.permission === 'granted') {
                    new Notification(`⏰ Class in 5 minutes!`, {
                        body: `${l.subject} — ${l.class} (${l.startTime})`,
                        icon: '/icon-192.png',
                        tag: `lesson_${l.id}`,
                    })
                }
            }

            // Alert when class starts
            if (l.status === 'now' && l.progress < 2 && !alerted.has(`start_${l.id}`)) {
                setAlerted(prev => new Set([...prev, `start_${l.id}`]))
                toast(`🟢 ${l.subject} for ${l.class} is starting NOW!`, {
                    duration: 10000,
                    style: { background: '#16a34a', color: '#fff', fontWeight: 600 },
                    icon: '🏫',
                })
                if (Notification.permission === 'granted') {
                    new Notification(`🏫 Class starting now!`, {
                        body: `${l.subject} — ${l.class}`,
                        icon: '/icon-192.png',
                        tag: `lesson_start_${l.id}`,
                    })
                }
            }
        })
    }, [computedLessons, alerted])

    function saveNote(lessonId: string, text: string) {
        const updated = { ...notes, [lessonId]: text }
        setNotes(updated)
        try { localStorage.setItem(`wula_notes_${user?.id}`, JSON.stringify(updated)) } catch { }
        toast.success('Note saved')
        setNoteModal(null)
    }

    const computed = computedLessons()
    const todayDay = now.getDay()
    const todayItems = computed.filter(l => l.dayOfWeek === todayDay).sort((a, b) => a.startMinutes - b.startMinutes)
    const activeLesson = todayItems.find(l => l.status === 'now')
    const nextLesson = todayItems.find(l => l.status === 'soon' || l.status === 'upcoming')

    const statusColor: Record<LessonStatus, string> = {
        now: '#16a34a',
        soon: '#f59e0b',
        upcoming: '#6d28d9',
        done: '#9ca3af',
        next: '#0891b2',
    }
    const statusBg: Record<LessonStatus, string> = {
        now: '#f0fdf4',
        soon: '#fffbeb',
        upcoming: '#f5f3ff',
        done: '#f9fafb',
        next: '#eff6ff',
    }
    const statusLabel: Record<LessonStatus, string> = {
        now: '🟢 IN PROGRESS',
        soon: '⏰ STARTING SOON',
        upcoming: '📅 UPCOMING',
        done: '✓ DONE',
        next: '▶ NEXT',
    }

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _lt_fi{from{opacity:0}to{opacity:1}}
        @keyframes _lt_pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.8;transform:scale(.98)}}
        @keyframes _lt_bar{from{width:0}to{width:var(--w)}}
        @keyframes _lt_spin{to{transform:rotate(360deg)}}
        .lt-card:hover{box-shadow:0 6px 20px rgba(109,40,217,.1)!important;transform:translateY(-1px)}
        .lt-card{transition:all .2s}
        .lt-tab{transition:all .15s}
      `}</style>
            <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif', animation: '_lt_fi .4s ease' }}>

                {/* Header */}
                <div style={{ marginBottom: 20 }}>
                    <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>Lesson Tracker</h1>
                    <p style={{ fontSize: 13, color: '#6b7280', marginTop: 3 }}>
                        {DAYS[todayDay]} · {now.toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </p>
                </div>

                {/* Active lesson card */}
                {activeLesson && (
                    <div style={{ background: 'linear-gradient(135deg,#14532d,#16a34a)', borderRadius: 16, padding: '18px 20px', marginBottom: 16, color: '#fff', animation: '_lt_pulse 3s ease infinite', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,.06)' }} />
                        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', opacity: .8, marginBottom: 6 }}>🟢 CLASS IN PROGRESS</div>
                        <h2 style={{ fontFamily: '"Playfair Display",serif', fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>{activeLesson.subject}</h2>
                        <p style={{ fontSize: 14, opacity: .85, margin: '0 0 12px' }}>{activeLesson.class} · {activeLesson.period} · {activeLesson.startTime}–{activeLesson.endTime}</p>
                        {/* Progress bar */}
                        <div style={{ height: 6, background: 'rgba(255,255,255,.2)', borderRadius: 99, overflow: 'hidden', marginBottom: 8 }}>
                            <div style={{ height: '100%', width: `${activeLesson.progress}%`, background: '#fff', borderRadius: 99, transition: 'width 1s linear' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, opacity: .8 }}>
                            <span>{activeLesson.progress}% complete</span>
                            <span>{formatCountdown(activeLesson.countdown)} remaining</span>
                        </div>
                    </div>
                )}

                {/* Next lesson card */}
                {!activeLesson && nextLesson && (
                    <div style={{ background: nextLesson.status === 'soon' ? 'linear-gradient(135deg,#78350f,#d97706)' : 'linear-gradient(135deg,#2e1065,#4c1d95)', borderRadius: 16, padding: '16px 20px', marginBottom: 16, color: '#fff' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', opacity: .8, marginBottom: 6 }}>
                            {nextLesson.status === 'soon' ? '⏰ STARTING IN' : '📅 NEXT CLASS'}
                        </div>
                        <h2 style={{ fontFamily: '"Playfair Display",serif', fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>{nextLesson.subject}</h2>
                        <p style={{ fontSize: 13, opacity: .85, margin: '0 0 10px' }}>{nextLesson.class} · {nextLesson.startTime}–{nextLesson.endTime}</p>
                        <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 32, fontWeight: 700 }}>
                            {formatCountdown(nextLesson.countdown)}
                        </div>
                    </div>
                )}

                {!activeLesson && !nextLesson && todayItems.length > 0 && (
                    <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 14, padding: '14px 18px', marginBottom: 16, fontSize: 13, color: '#15803d', fontWeight: 600 }}>
                        ✅ All {todayItems.length} classes done for today! Great work.
                    </div>
                )}

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 18, background: '#f5f3ff', borderRadius: 12, padding: 4, width: 'fit-content' }}>
                    {[
                        { k: 'today', label: `Today (${todayItems.length})` },
                        { k: 'week', label: 'Full Week' },
                        { k: 'tracker', label: '📝 Notes' },
                    ].map(t => (
                        <button key={t.k} className="lt-tab" onClick={() => setTab(t.k as any)}
                            style={{
                                padding: '7px 14px', borderRadius: 9, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: '"DM Sans",sans-serif',
                                background: tab === t.k ? '#fff' : 'transparent',
                                color: tab === t.k ? '#6d28d9' : '#6b7280',
                                boxShadow: tab === t.k ? '0 1px 4px rgba(0,0,0,.08)' : 'none'
                            }}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #ede9fe', borderTopColor: '#6d28d9', animation: '_lt_spin .8s linear infinite' }} />
                    </div>
                ) : tab === 'today' ? (
                    // ── TODAY ──
                    todayItems.length === 0 ? (
                        <div style={{ background: '#fff', borderRadius: 16, padding: '60px 20px', textAlign: 'center', border: '1.5px solid #f0eefe' }}>
                            <div style={{ fontSize: 52, marginBottom: 12 }}>☀️</div>
                            <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#111827' }}>No classes today</h3>
                            <p style={{ fontSize: 13, color: '#9ca3af' }}>Check the Full Week tab to see your schedule.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {todayItems.map((l, i) => (
                                <div key={l.id} className="lt-card"
                                    style={{ background: statusBg[l.status], borderRadius: 14, border: `1.5px solid ${statusColor[l.status]}22`, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,.04)', animation: `_lt_fi .3s ease ${i * .05}s both` }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        {/* Time block */}
                                        <div style={{ textAlign: 'center', flexShrink: 0, width: 56 }}>
                                            <div style={{ fontSize: 14, fontWeight: 700, color: statusColor[l.status] }}>{l.startTime}</div>
                                            <div style={{ fontSize: 10, color: '#9ca3af' }}>{l.endTime}</div>
                                        </div>
                                        <div style={{ width: 2, height: 40, background: `${statusColor[l.status]}40`, borderRadius: 99, flexShrink: 0 }} />
                                        {/* Lesson info */}
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                                                <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{l.subject}</span>
                                                <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 99, background: statusColor[l.status] + '18', color: statusColor[l.status] }}>
                                                    {statusLabel[l.status]}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: 12, color: '#6b7280' }}>{l.class} · {l.period}</div>
                                            {l.notes && <div style={{ fontSize: 11, color: '#6d28d9', marginTop: 4, fontStyle: 'italic' }}>📝 {l.notes.slice(0, 60)}{l.notes.length > 60 ? '…' : ''}</div>}
                                        </div>
                                        {/* Countdown / progress */}
                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                            {l.status === 'now' && (
                                                <div>
                                                    <div style={{ fontSize: 18, fontWeight: 800, color: '#16a34a', fontFamily: '"Playfair Display",serif' }}>{formatCountdown(l.countdown)}</div>
                                                    <div style={{ fontSize: 10, color: '#16a34a' }}>remaining</div>
                                                    <div style={{ marginTop: 6, height: 4, width: 60, background: '#dcfce7', borderRadius: 99, overflow: 'hidden' }}>
                                                        <div style={{ height: '100%', width: `${l.progress}%`, background: '#16a34a', borderRadius: 99, transition: 'width 1s' }} />
                                                    </div>
                                                </div>
                                            )}
                                            {(l.status === 'soon' || l.status === 'upcoming') && (
                                                <div>
                                                    <div style={{ fontSize: 16, fontWeight: 800, color: statusColor[l.status], fontFamily: '"Playfair Display",serif' }}>{formatCountdown(l.countdown)}</div>
                                                    <div style={{ fontSize: 10, color: statusColor[l.status] }}>to start</div>
                                                </div>
                                            )}
                                            <button onClick={() => { setNoteModal(l); setNoteText(l.notes) }}
                                                style={{ marginTop: 6, padding: '3px 8px', borderRadius: 7, border: '1px solid #e5e7eb', background: '#fff', fontSize: 11, cursor: 'pointer', color: '#6b7280', fontFamily: '"DM Sans",sans-serif' }}>
                                                {l.notes ? '✏️ Edit note' : '+ Note'}
                                            </button>
                                        </div>
                                    </div>
                                    {/* Progress bar for ongoing */}
                                    {l.status === 'now' && (
                                        <div style={{ marginTop: 10, height: 5, background: '#dcfce7', borderRadius: 99, overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${l.progress}%`, background: 'linear-gradient(90deg,#16a34a,#22c55e)', borderRadius: 99, transition: 'width 1s linear' }} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )
                ) : tab === 'week' ? (
                    // ── FULL WEEK ──
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {[1, 2, 3, 4, 5].map(day => {
                            const dayLessons = computed.filter(l => l.dayOfWeek === day).sort((a, b) => a.startMinutes - b.startMinutes)
                            const isToday = day === todayDay
                            return (
                                <div key={day} style={{ background: '#fff', borderRadius: 14, border: `1.5px solid ${isToday ? '#7c3aed' : '#f0eefe'}`, overflow: 'hidden' }}>
                                    <div style={{ padding: '10px 16px', background: isToday ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : '#f8fafc', borderBottom: '1px solid #f0eefe', display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: isToday ? '#fff' : '#374151' }}>{DAYS[day]}</span>
                                        {isToday && <span style={{ fontSize: 10, background: 'rgba(255,255,255,.2)', color: '#fff', padding: '1px 8px', borderRadius: 99, fontWeight: 700 }}>TODAY</span>}
                                        <span style={{ fontSize: 11, color: isToday ? 'rgba(255,255,255,.7)' : '#9ca3af', marginLeft: 'auto' }}>{dayLessons.length} class{dayLessons.length !== 1 ? 'es' : ''}</span>
                                    </div>
                                    {dayLessons.length === 0 ? (
                                        <div style={{ padding: '14px 16px', fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>No classes</div>
                                    ) : (
                                        <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            {dayLessons.map(l => (
                                                <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 9, background: l.status === 'now' ? '#f0fdf4' : l.status === 'done' ? '#f9fafb' : '#f5f3ff', border: `1px solid ${l.status === 'now' ? '#bbf7d0' : l.status === 'done' ? '#e5e7eb' : '#ede9fe'}` }}>
                                                    <span style={{ fontSize: 11, color: '#6b7280', width: 44, flexShrink: 0 }}>{l.startTime}</span>
                                                    <span style={{ fontSize: 12, fontWeight: 700, color: l.status === 'done' ? '#9ca3af' : '#111827', flex: 1 }}>{l.subject}</span>
                                                    <span style={{ fontSize: 11, color: '#6b7280' }}>{l.class}</span>
                                                    {l.status === 'now' && <span style={{ fontSize: 10, background: '#16a34a', color: '#fff', padding: '1px 7px', borderRadius: 99, fontWeight: 700 }}>LIVE</span>}
                                                    {l.status === 'done' && <span style={{ fontSize: 14 }}>✓</span>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    // ── NOTES / TRACKER ──
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#1e40af' }}>
                            📝 Add lesson notes, topics covered, and observations. They're saved on your device.
                        </div>
                        {computed.filter(l => l.dayOfWeek >= 1 && l.dayOfWeek <= 5).sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startMinutes - b.startMinutes).map(l => (
                            <div key={l.id} className="lt-card"
                                style={{ background: '#fff', borderRadius: 12, border: '1.5px solid #f0eefe', padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{l.subject}</span>
                                            <span style={{ fontSize: 11, color: '#6b7280' }}>{l.class}</span>
                                            <span style={{ fontSize: 10, background: '#f5f3ff', color: '#6d28d9', padding: '1px 7px', borderRadius: 99 }}>{DAYS[l.dayOfWeek]} {l.startTime}</span>
                                        </div>
                                        {l.notes ? (
                                            <p style={{ fontSize: 12, color: '#374151', margin: 0, lineHeight: 1.5, background: '#faf5ff', padding: '8px 10px', borderRadius: 8 }}>{l.notes}</p>
                                        ) : (
                                            <p style={{ fontSize: 12, color: '#9ca3af', margin: 0, fontStyle: 'italic' }}>No notes yet…</p>
                                        )}
                                    </div>
                                    <button onClick={() => { setNoteModal(l); setNoteText(l.notes) }}
                                        style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid #ddd6fe', background: '#f5f3ff', color: '#6d28d9', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0, fontFamily: '"DM Sans",sans-serif' }}>
                                        {l.notes ? '✏️ Edit' : '+ Add Note'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Note modal */}
            {noteModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, backdropFilter: 'blur(4px)', padding: 16 }}>
                    <div style={{ background: '#fff', borderRadius: 16, padding: '24px', width: '100%', maxWidth: 460, boxShadow: '0 24px 64px rgba(0,0,0,.18)', fontFamily: '"DM Sans",sans-serif' }}>
                        <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 4 }}>📝 Lesson Note</h3>
                        <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>{noteModal.subject} · {noteModal.class} · {DAYS[noteModal.dayOfWeek]} {noteModal.startTime}</p>
                        <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={5}
                            placeholder="Topics covered, student observations, homework set, what to improve…"
                            style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', fontFamily: '"DM Sans",sans-serif', resize: 'vertical', boxSizing: 'border-box' as any }} />
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                            <button onClick={() => setNoteModal(null)}
                                style={{ padding: '8px 16px', borderRadius: 9, border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: '"DM Sans",sans-serif' }}>
                                Cancel
                            </button>
                            <button onClick={() => saveNote(noteModal.id, noteText)}
                                style={{ padding: '8px 16px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: '"DM Sans",sans-serif' }}>
                                💾 Save Note
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}