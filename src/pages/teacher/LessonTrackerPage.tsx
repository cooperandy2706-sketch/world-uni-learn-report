// src/pages/teacher/LessonTrackerPage.tsx
// Detects upcoming lessons from timetable and shows countdown + alerts
// Notes tab: full AI-powered lesson plan generator
import { useState, useEffect, useRef, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useCurrentTerm } from '../../hooks/useSettings'
import { generateLessonPlan, type GeneratedLessonPlan } from '../../lib/groq'
import toast from 'react-hot-toast'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function timeToMinutes(t: string): number {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
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
    subjectId: string
    class: string
    classId: string
    period: string
    startTime: string
    endTime: string
    startMinutes: number
    endMinutes: number
    dayOfWeek: number
    status: LessonStatus
    countdown: number
    progress: number
    notes: string
}

interface StoredLessonData {
    notes: string
    topic?: string
    bullets?: string[]
    plan?: GeneratedLessonPlan
}

// ── AI Lesson Plan Modal ───────────────────────────────────────────────────────
function AILessonModal({
    lesson,
    stored,
    onSave,
    onSubmit,
    onClose,
}: {
    lesson: Lesson
    stored: StoredLessonData
    onSave: (id: string, data: StoredLessonData) => void
    onSubmit: (topic: string, content: string) => Promise<void>
    onClose: () => void
}) {
    const [step, setStep] = useState<'input' | 'plan'>(stored.plan ? 'plan' : 'input')
    const [topic, setTopic] = useState(stored.topic ?? lesson.subject)
    const [bullets, setBullets] = useState<string[]>(stored.bullets ?? [''])
    const [notes, setNotes] = useState(stored.notes ?? '')
    const [plan, setPlan] = useState<GeneratedLessonPlan | null>(stored.plan ?? null)
    const [generating, setGenerating] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [usageCount, setUsageCount] = useState(0)
    const DAILY_LIMIT = 5

    // Check usage on load
    useEffect(() => {
        checkUsage()
    }, [lesson.id])

    async function checkUsage() {
        const today = new Date().toISOString().split('T')[0]
        const { count, error } = await supabase
            .from('ai_usage_logs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', (await supabase.auth.getUser()).data.user?.id ?? '') 
            .eq('feature', 'lesson_plan')
            .gte('created_at', today)

        if (!error && count !== null) {
            setUsageCount(count)
        }
    }

    function addBullet() { setBullets(b => [...b, '']) }
    function updateBullet(i: number, val: string) { setBullets(b => b.map((x, idx) => idx === i ? val : x)) }
    function removeBullet(i: number) { setBullets(b => b.filter((_, idx) => idx !== i)) }

    async function handleGenerate() {
        if (!topic.trim()) { setError('Please enter a topic.'); return }
        
        // Final usage check before start
        if (usageCount >= DAILY_LIMIT) {
            setError(`You have used your ${DAILY_LIMIT} free AI plans for today. Please try again tomorrow.`);
            return
        }

        setError('')
        setGenerating(true)
        try {
            const result = await generateLessonPlan({
                topic,
                bullets: bullets.filter(b => b.trim()),
                subject: lesson.subject,
                className: lesson.class,
            })
            
            // Log successful usage
            const { data: userData } = await supabase.auth.getUser()
            if (userData.user) {
                await supabase.from('ai_usage_logs').insert({
                    user_id: userData.user.id,
                    school_id: (userData.user as any).user_metadata?.school_id || lesson.id, // Fallback placeholder
                    feature: 'lesson_plan',
                    model_used: 'huggingface_chain'
                })
                setUsageCount(prev => prev + 1)
            }

            setPlan(result)
            setStep('plan')
            // auto-save immediately
            onSave(lesson.id, { notes, topic, bullets, plan: result })
        } catch (err: any) {
            setError(err.message ?? 'Failed to generate lesson plan. Please check your AI API key status.')
        } finally {
            setGenerating(false)
        }
    }

    function handleSaveNotes() {
        onSave(lesson.id, { notes, topic, bullets, plan: plan ?? undefined })
        toast.success('Saved locally!')
        onClose()
    }

    async function handleFormalSubmit() {
        if (!plan) return
        setSubmitting(true)
        try {
            await onSubmit(topic, plan.markdown)
            toast.success('Submitted to Headmaster!')
            onClose()
        } catch (err: any) {
            toast.error(err.message || 'Failed to submit')
        } finally {
            setSubmitting(false)
        }
    }

    function handlePrint() {
        const win = window.open('', '_blank')
        if (!win || !plan) return
        win.document.write(`
      <html><head>
        <title>Lesson Plan: ${plan.topic}</title>
        <style>
          body { font-family: Georgia, serif; max-width: 800px; margin: 40px auto; color: #111; line-height: 1.7 }
          h1 { color: #4c1d95 } h2 { color: #6d28d9; border-bottom: 2px solid #ede9fe; padding-bottom: 4px }
          table { border-collapse: collapse; width: 100%; margin: 12px 0 }
          th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left }
          th { background: #f5f3ff }
          img { max-width: 100%; border-radius: 8px; margin: 12px 0 }
          code { background: #f5f3ff; padding: 2px 6px; border-radius: 4px }
        </style>
      </head><body>
        <pre style="white-space:pre-wrap;font-family:Georgia,serif">${plan.markdown}</pre>
      </body></html>
    `)
        win.document.close()
        win.print()
    }

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 999, backdropFilter: 'blur(6px)', padding: '16px', overflowY: 'auto' }}>
            <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 720, boxShadow: '0 32px 80px rgba(0,0,0,.25)', fontFamily: '"DM Sans",system-ui,sans-serif', marginTop: 16, marginBottom: 32 }}>

                {/* Modal Header */}
                <div style={{ background: 'linear-gradient(135deg,#4c1d95,#7c3aed)', borderRadius: '20px 20px 0 0', padding: '20px 24px', color: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', opacity: .7, marginBottom: 4 }}>✨ AI LESSON PLANNER</div>
                            <h2 style={{ fontFamily: '"Playfair Display",serif', fontSize: 20, fontWeight: 700, margin: 0 }}>
                                {lesson.subject} — {lesson.class}
                            </h2>
                            <p style={{ fontSize: 12, opacity: .75, margin: '4px 0 0' }}>{DAYS[lesson.dayOfWeek]} · {lesson.period} · {lesson.startTime}–{lesson.endTime}</p>
                        </div>
                        <button onClick={onClose} style={{ background: 'rgba(255,255,255,.15)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 20, cursor: 'pointer', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                    </div>

                    {/* Step tabs */}
                    <div style={{ display: 'flex', gap: 4, marginTop: 16, background: 'rgba(0,0,0,.2)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
                        {[
                            { k: 'input', label: '1. Plan Input' },
                            { k: 'plan', label: '2. Generated Plan', disabled: !plan },
                        ].map(s => (
                            <button key={s.k} onClick={() => !s.disabled && setStep(s.k as any)}
                                disabled={s.disabled}
                                style={{ padding: '5px 14px', borderRadius: 7, border: 'none', fontSize: 12, fontWeight: 600, cursor: s.disabled ? 'default' : 'pointer', opacity: s.disabled ? .4 : 1, fontFamily: '"DM Sans",sans-serif', background: step === s.k ? '#fff' : 'transparent', color: step === s.k ? '#6d28d9' : '#fff' }}>
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ padding: '24px' }}>

                    {step === 'input' ? (
                        // ── Input Step ────────────────────────────────────────
                        <div>
                            <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 12, padding: '14px', marginBottom: 20, fontSize: 12, color: '#5b21b6', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                <span style={{ fontSize: 20 }}>💡</span>
                                <div>
                                    <div style={{ fontWeight: 700, marginBottom: 4 }}>How to get the best results:</div>
                                    <span style={{ lineHeight: 1.5 }}>
                                        Enter a specific topic (e.g., "Introduction to Photosynthesis") and add 2-3 key objectives. The more specific you are, the better the AI can tailor the activities for your class.
                                    </span>
                                </div>
                            </div>

                            {/* Topic */}
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                                📌 Lesson Topic *
                            </label>
                            <input
                                value={topic}
                                onChange={e => setTopic(e.target.value)}
                                placeholder="e.g. Photosynthesis, The Pythagorean Theorem, World War II causes…"
                                style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: '"DM Sans",sans-serif', marginBottom: 20 }}
                                onFocus={e => (e.target.style.borderColor = '#7c3aed')}
                                onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
                            />

                            {/* Bullets */}
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                                📋 Key Points / Objectives to Cover
                            </label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                                {bullets.map((b, i) => (
                                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <span style={{ color: '#9ca3af', fontSize: 16, flexShrink: 0 }}>•</span>
                                        <input
                                            value={b}
                                            onChange={e => updateBullet(i, e.target.value)}
                                            placeholder={`Key point ${i + 1}…`}
                                            style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', fontFamily: '"DM Sans",sans-serif' }}
                                            onFocus={e => (e.target.style.borderColor = '#7c3aed')}
                                            onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
                                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addBullet() } }}
                                        />
                                        {bullets.length > 1 && (
                                            <button onClick={() => removeBullet(i)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 16, padding: '0 4px' }}>✕</button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <button onClick={addBullet}
                                style={{ fontSize: 12, color: '#6d28d9', background: '#f5f3ff', border: '1.5px dashed #c4b5fd', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontWeight: 600, fontFamily: '"DM Sans",sans-serif', marginBottom: 20 }}>
                                + Add Key Point
                            </button>

                            {/* Teacher Notes */}
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                                📝 Personal Notes (optional, saved privately)
                            </label>
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                rows={3}
                                placeholder="Personal reminders, observations, what to emphasize…"
                                style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', fontFamily: '"DM Sans",sans-serif', resize: 'vertical', boxSizing: 'border-box' }}
                            />

                            {error && <p style={{ fontSize: 12, color: '#dc2626', marginTop: 8 }}>⚠️ {error}</p>}

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 20 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: usageCount >= DAILY_LIMIT ? '#dc2626' : '#6b7280' }}>
                                    Quota: {usageCount} / {DAILY_LIMIT} today
                                </div>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <button onClick={handleSaveNotes}
                                        style={{ padding: '9px 18px', borderRadius: 9, border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: '"DM Sans",sans-serif' }}>
                                        💾 Save Notes Only
                                    </button>
                                    <button
                                        onClick={handleGenerate}
                                        disabled={generating || usageCount >= DAILY_LIMIT}
                                        style={{ padding: '9px 22px', borderRadius: 9, border: 'none', background: (generating || usageCount >= DAILY_LIMIT) ? '#d1d5db' : 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: (generating || usageCount >= DAILY_LIMIT) ? 'default' : 'pointer', fontFamily: '"DM Sans",sans-serif', display: 'flex', alignItems: 'center', gap: 8 }}>
                                        {generating ? (
                                            <>
                                                <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', animation: '_lt_spin .8s linear infinite' }} />
                                                Generating…
                                            </>
                                        ) : usageCount >= DAILY_LIMIT ? (
                                            <>Limit Reached</>
                                        ) : (
                                            <>✨ Generate Plan</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // ── Plan View Step ────────────────────────────────────
                        plan && (
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                                        Generated {new Date(plan.generatedAt).toLocaleString()}
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button onClick={() => setStep('input')}
                                            style={{ padding: '6px 14px', borderRadius: 8, border: '1.5px solid #ddd6fe', background: '#f5f3ff', color: '#6d28d9', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: '"DM Sans",sans-serif' }}>
                                            ✏️ Edit Inputs
                                        </button>
                                        <button onClick={handlePrint}
                                            style={{ padding: '6px 14px', borderRadius: 8, border: '1.5px solid #ddd6fe', background: '#f5f3ff', color: '#6d28d9', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: '"DM Sans",sans-serif' }}>
                                            🖨️ Print
                                        </button>
                                        <button onClick={() => { handleGenerate() }}
                                            style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: generating ? 'default' : 'pointer', fontFamily: '"DM Sans",sans-serif', opacity: generating ? .6 : 1 }}>
                                            {generating ? '⏳ Regenerating…' : '🔄 Regenerate'}
                                        </button>
                                    </div>
                                </div>

                                {/* Rendered Markdown */}
                                <div style={{ background: '#fafafa', border: '1.5px solid #ede9fe', borderRadius: 14, padding: '20px 24px', maxHeight: 560, overflowY: 'auto', lineHeight: 1.75 }}>
                                    <style>{`
                    .lp-markdown h1 { font-family: "Playfair Display",serif; font-size: 22px; color: #4c1d95; border-bottom: 2px solid #ede9fe; padding-bottom: 8px; margin-top: 0 }
                    .lp-markdown h2 { font-size: 16px; color: #6d28d9; border-bottom: 1px solid #ede9fe; padding-bottom: 4px; margin-top: 28px }
                    .lp-markdown h3 { font-size: 14px; color: #374151; margin-top: 18px }
                    .lp-markdown table { border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 13px }
                    .lp-markdown th, .lp-markdown td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left }
                    .lp-markdown th { background: #f5f3ff; color: #6d28d9; font-weight: 700 }
                    .lp-markdown ul, .lp-markdown ol { padding-left: 20px }
                    .lp-markdown li { margin-bottom: 4px; font-size: 13px; color: #374151 }
                    .lp-markdown p { font-size: 13px; color: #374151; margin-bottom: 8px }
                    .lp-markdown img { max-width: 100%; border-radius: 10px; margin: 12px 0; box-shadow: 0 4px 12px rgba(0,0,0,.1) }
                    .lp-markdown code { background: #f5f3ff; padding: 2px 6px; border-radius: 4px; font-size: 12px; color: #7c3aed }
                    .lp-markdown strong { color: #111827 }
                    .lp-markdown hr { border: none; border-top: 1px solid #ede9fe; margin: 24px 0 }
                    .lp-markdown blockquote { border-left: 3px solid #7c3aed; padding-left: 14px; color: #6b7280; font-style: italic }
                  `}</style>
                                    <div className="lp-markdown">
                                        <ReactMarkdown>{plan.markdown}</ReactMarkdown>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                    <button onClick={onClose}
                                        style={{ padding: '9px 18px', borderRadius: 9, border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: '"DM Sans",sans-serif' }}>
                                        Close
                                    </button>
                                    <button onClick={handleSaveNotes}
                                        style={{ padding: '9px 22px', borderRadius: 9, border: 'none', background: '#f3f4f6', color: '#111827', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: '"DM Sans",sans-serif' }}>
                                        💾 Save Locally
                                    </button>
                                    <button onClick={handleFormalSubmit} disabled={submitting}
                                        style={{ padding: '9px 22px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: submitting ? 'default' : 'pointer', fontFamily: '"DM Sans",sans-serif', opacity: submitting ? 0.7 : 1 }}>
                                        {submitting ? 'Submitting…' : '📨 Submit to Headmaster'}
                                    </button>
                                </div>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LessonTrackerPage() {
    const { user } = useAuth()
    const { data: term } = useCurrentTerm()
    const [lessons, setLessons] = useState<Lesson[]>([])
    const [loading, setLoading] = useState(true)
    const [now, setNow] = useState(new Date())
    const [tab, setTab] = useState<'today' | 'week' | 'tracker'>('today')
    const [activeModal, setActiveModal] = useState<Lesson | null>(null)
    const [teacherInfo, setTeacherInfo] = useState<{ id: string, schoolId: string } | null>(null)
    const [storedData, setStoredData] = useState<Record<string, StoredLessonData>>({})
    const [alerted, setAlerted] = useState<Set<string>>(new Set())
    const tickRef = useRef<any>(null)

    useEffect(() => { if (user && term) load() }, [user, term])

    useEffect(() => {
        tickRef.current = setInterval(() => setNow(new Date()), 1000)
        return () => clearInterval(tickRef.current)
    }, [])

    // Load saved data from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem(`wula_lessondata_${user?.id}`)
            if (saved) setStoredData(JSON.parse(saved))
        } catch { }
    }, [user])

    async function load() {
        setLoading(true)
        const { data: t } = await supabase.from('teachers').select('id, school_id').eq('user_id', user!.id).single()
        if (!t) { setLoading(false); return }
        setTeacherInfo({ id: t.id, schoolId: t.school_id })

        const [{ data: slots }] = await Promise.all([
            supabase.from('timetable_slots')
                .select('*, subject:subjects(id,name), class:classes(id,name), period:timetable_periods(id,name,start_time,end_time,is_break,sort_order)')
                .eq('teacher_id', t.id)
                .eq('term_id', (term as any).id),
        ])

        const rawLessons: Lesson[] = (slots ?? [])
            .filter((s: any) => !s.period?.is_break)
            .map((s: any) => ({
                id: s.id,
                subject: s.subject?.name ?? '—',
                subjectId: s.subject?.id ?? '',
                class: s.class?.name ?? '—',
                classId: s.class?.id ?? '',
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

    const computedLessons = useCallback((): Lesson[] => {
        const day = now.getDay()
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
                } else if (secondsToStart <= 300) {
                    status = 'soon'
                    countdown = secondsToStart
                } else {
                    status = 'upcoming'
                    countdown = secondsToStart
                }
            }

            return { ...l, status, countdown, progress, notes: storedData[l.id]?.notes ?? '' }
        })
    }, [lessons, now, storedData])

    useEffect(() => {
        const computed = computedLessons()
        computed.forEach(l => {
            if (l.status === 'soon' && l.countdown <= 300 && l.countdown > 290 && !alerted.has(`soon_${l.id}`)) {
                setAlerted(prev => new Set([...prev, `soon_${l.id}`]))
                toast(`🔔 ${l.subject} for ${l.class} starts in 5 minutes!`, {
                    duration: 8000, style: { background: '#f59e0b', color: '#fff', fontWeight: 600 }, icon: '⏰',
                })
                if (Notification.permission === 'granted') {
                    new Notification(`⏰ Class in 5 minutes!`, { body: `${l.subject} — ${l.class} (${l.startTime})`, icon: '/icon-192.png', tag: `lesson_${l.id}` })
                }
            }
            if (l.status === 'now' && l.progress < 2 && !alerted.has(`start_${l.id}`)) {
                setAlerted(prev => new Set([...prev, `start_${l.id}`]))
                toast(`🟢 ${l.subject} for ${l.class} is starting NOW!`, {
                    duration: 10000, style: { background: '#16a34a', color: '#fff', fontWeight: 600 }, icon: '🏫',
                })
                if (Notification.permission === 'granted') {
                    new Notification(`🏫 Class starting now!`, { body: `${l.subject} — ${l.class}`, icon: '/icon-192.png', tag: `lesson_start_${l.id}` })
                }
            }
        })
    }, [computedLessons, alerted])

    function saveData(lessonId: string, data: StoredLessonData) {
        const updated = { ...storedData, [lessonId]: data }
        setStoredData(updated)
        try { localStorage.setItem(`wula_lessondata_${user?.id}`, JSON.stringify(updated)) } catch { }
    }

    async function submitFormalPlan(lesson: Lesson, topic: string, content: string) {
        if (!teacherInfo || !term) throw new Error('Missing teacher or term data')
        const { error } = await supabase.from('lesson_plans').insert({
            school_id: teacherInfo.schoolId,
            teacher_id: teacherInfo.id,
            term_id: (term as any).id,
            class_id: lesson.classId,
            subject_id: lesson.subjectId,
            topic,
            content,
            status: 'pending'
        })
        if (error) throw error
    }

    const computed = computedLessons()
    const todayDay = now.getDay()
    const todayItems = computed.filter(l => l.dayOfWeek === todayDay).sort((a, b) => a.startMinutes - b.startMinutes)
    const activeLesson = todayItems.find(l => l.status === 'now')
    const nextLesson = todayItems.find(l => l.status === 'soon' || l.status === 'upcoming')

    const statusColor: Record<LessonStatus, string> = {
        now: '#16a34a', soon: '#f59e0b', upcoming: '#6d28d9', done: '#9ca3af', next: '#0891b2',
    }
    const statusBg: Record<LessonStatus, string> = {
        now: '#f0fdf4', soon: '#fffbeb', upcoming: '#f5f3ff', done: '#f9fafb', next: '#eff6ff',
    }
    const statusLabel: Record<LessonStatus, string> = {
        now: '🟢 IN PROGRESS', soon: '⏰ STARTING SOON', upcoming: '📅 UPCOMING', done: '✓ DONE', next: '▶ NEXT',
    }

    // helper for notes tab indicator
    function getStoreSummary(id: string) {
        const d = storedData[id]
        if (!d) return null
        if (d.plan) return { type: 'plan', label: `✨ AI Plan: ${d.plan.topic}` }
        if (d.notes) return { type: 'notes', label: `📝 ${d.notes.slice(0, 50)}${d.notes.length > 50 ? '…' : ''}` }
        return null
    }

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _lt_fi{from{opacity:0}to{opacity:1}}
        @keyframes _lt_pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.8;transform:scale(.98)}}
        @keyframes _lt_spin{to{transform:rotate(360deg)}}
        .lt-card:hover{box-shadow:0 6px 20px rgba(109,40,217,.1)!important;transform:translateY(-1px)}
        @media (max-width: 768px) {
          .resp-header { flex-direction: column !important; align-items: stretch !important; gap: 16px !important; }
          .resp-tabs { width: 100% !important; overflow-x: auto !important; -webkit-overflow-scrolling: touch; padding: 4px !important; }
          .lt-card { padding: 14px !important; }
          .modal-container { padding: 8px !important; }
          .modal-content { border-radius: 12px !important; margin-top: 0 !important; }
          .modal-header { padding: 16px !important; }
          .modal-body { padding: 16px !important; }
          .resp-btn-group { flex-direction: column !important; width: 100% !important; }
        }
      `}</style>
            <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif', animation: '_lt_fi .4s ease' }}>

                {/* Header */}
                <div className="resp-header" style={{ marginBottom: 20 }}>
                  <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>Lesson Tracker</h1>
                  <p style={{ fontSize: 13, color: '#6b7280', marginTop: 3 }}>
                    {DAYS[todayDay]} · {now.toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </p>
                </div>

                {/* Active lesson banner */}
                {activeLesson && (
                    <div style={{ background: 'linear-gradient(135deg,#14532d,#16a34a)', borderRadius: 16, padding: '18px 20px', marginBottom: 16, color: '#fff', animation: '_lt_pulse 3s ease infinite', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,.06)' }} />
                        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', opacity: .8, marginBottom: 6 }}>🟢 CLASS IN PROGRESS</div>
                        <h2 style={{ fontFamily: '"Playfair Display",serif', fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>{activeLesson.subject}</h2>
                        <p style={{ fontSize: 14, opacity: .85, margin: '0 0 12px' }}>{activeLesson.class} · {activeLesson.period} · {activeLesson.startTime}–{activeLesson.endTime}</p>
                        <div style={{ height: 6, background: 'rgba(255,255,255,.2)', borderRadius: 99, overflow: 'hidden', marginBottom: 8 }}>
                            <div style={{ height: '100%', width: `${activeLesson.progress}%`, background: '#fff', borderRadius: 99, transition: 'width 1s linear' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, opacity: .8 }}>
                            <span>{activeLesson.progress}% complete</span>
                            <span>{formatCountdown(activeLesson.countdown)} remaining</span>
                        </div>
                    </div>
                )}

                {!activeLesson && nextLesson && (
                    <div style={{ background: nextLesson.status === 'soon' ? 'linear-gradient(135deg,#78350f,#d97706)' : 'linear-gradient(135deg,#2e1065,#4c1d95)', borderRadius: 16, padding: '16px 20px', marginBottom: 16, color: '#fff' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', opacity: .8, marginBottom: 6 }}>
                            {nextLesson.status === 'soon' ? '⏰ STARTING IN' : '📅 NEXT CLASS'}
                        </div>
                        <h2 style={{ fontFamily: '"Playfair Display",serif', fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>{nextLesson.subject}</h2>
                        <p style={{ fontSize: 13, opacity: .85, margin: '0 0 10px' }}>{nextLesson.class} · {nextLesson.startTime}–{nextLesson.endTime}</p>
                        <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 32, fontWeight: 700 }}>{formatCountdown(nextLesson.countdown)}</div>
                    </div>
                )}

                {!activeLesson && !nextLesson && todayItems.length > 0 && (
                    <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 14, padding: '14px 18px', marginBottom: 16, fontSize: 13, color: '#15803d', fontWeight: 600 }}>
                        ✅ All {todayItems.length} classes done for today! Great work.
                    </div>
                )}

                {/* Tabs */}
                <div className="resp-tabs" style={{ display: 'flex', gap: 4, marginBottom: 18, background: '#f5f3ff', borderRadius: 12, padding: 4, width: 'fit-content' }}>
                  {[
                    { k: 'today', label: `Today (${todayItems.length})` },
                    { k: 'week', label: 'Full Week' },
                    { k: 'tracker', label: '✨ AI Plans' },
                  ].map(t => (
                    <button key={t.k} className="lt-tab" onClick={() => setTab(t.k as any)}
                      style={{ padding: '7px 14px', borderRadius: 9, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: '"DM Sans",sans-serif', background: tab === t.k ? '#fff' : 'transparent', color: tab === t.k ? '#6d28d9' : '#6b7280', boxShadow: tab === t.k ? '0 1px 4px rgba(0,0,0,.08)' : 'none', whiteSpace: 'nowrap' }}>
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
                                        <div style={{ textAlign: 'center', flexShrink: 0, width: 56 }}>
                                            <div style={{ fontSize: 14, fontWeight: 700, color: statusColor[l.status] }}>{l.startTime}</div>
                                            <div style={{ fontSize: 10, color: '#9ca3af' }}>{l.endTime}</div>
                                        </div>
                                        <div style={{ width: 2, height: 40, background: `${statusColor[l.status]}40`, borderRadius: 99, flexShrink: 0 }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                                                <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{l.subject}</span>
                                                <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 99, background: statusColor[l.status] + '18', color: statusColor[l.status] }}>
                                                    {statusLabel[l.status]}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: 12, color: '#6b7280' }}>{l.class} · {l.period}</div>
                                            {storedData[l.id]?.plan && (
                                                <div style={{ fontSize: 11, color: '#6d28d9', marginTop: 4, fontStyle: 'italic' }}>✨ AI plan: {storedData[l.id].plan!.topic}</div>
                                            )}
                                            {storedData[l.id]?.notes && !storedData[l.id]?.plan && (
                                                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>📝 {storedData[l.id].notes.slice(0, 60)}…</div>
                                            )}
                                        </div>
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
                                            <button onClick={() => setActiveModal(l)}
                                                style={{ marginTop: 6, padding: '3px 10px', borderRadius: 7, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', fontSize: 11, cursor: 'pointer', color: '#fff', fontWeight: 600, fontFamily: '"DM Sans",sans-serif' }}>
                                                {storedData[l.id]?.plan ? '✨ View Plan' : '+ Plan'}
                                            </button>
                                        </div>
                                    </div>
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
                                                    {storedData[l.id]?.plan && <span style={{ fontSize: 10, background: '#7c3aed', color: '#fff', padding: '1px 7px', borderRadius: 99, fontWeight: 700 }}>✨ AI</span>}
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
                    // ── AI PLANS / NOTES TAB ──
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {/* Explainer */}
                        <div style={{ background: 'linear-gradient(135deg,#4c1d95,#7c3aed)', borderRadius: 14, padding: '16px 18px', color: '#fff', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                            <span style={{ fontSize: 28 }}>✨</span>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>AI-Powered Lesson Planner</div>
                                <div style={{ fontSize: 12, opacity: .85, lineHeight: 1.6 }}>
                                    Select any lesson, enter your topic and key points, and the AI will instantly generate a full professional lesson plan — complete with objectives, activities, visual aids, and homework.
                                </div>
                            </div>
                        </div>

                        {/* Stats row */}
                        {(() => {
                            const withPlans = Object.values(storedData).filter(d => d.plan).length
                            const withNotes = Object.values(storedData).filter(d => d.notes && !d.plan).length
                            return withPlans > 0 || withNotes > 0 ? (
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {withPlans > 0 && <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 10, padding: '8px 14px', fontSize: 12, color: '#6d28d9', fontWeight: 600 }}>✨ {withPlans} AI plan{withPlans !== 1 ? 's' : ''} generated</div>}
                                    {withNotes > 0 && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '8px 14px', fontSize: 12, color: '#16a34a', fontWeight: 600 }}>📝 {withNotes} note{withNotes !== 1 ? 's' : ''} saved</div>}
                                </div>
                            ) : null
                        })()}

                        {/* Lessons list */}
                        {computed.filter(l => l.dayOfWeek >= 1 && l.dayOfWeek <= 5)
                            .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startMinutes - b.startMinutes)
                            .map(l => {
                                const summary = getStoreSummary(l.id)
                                const hasPlan = !!storedData[l.id]?.plan
                                return (
                                    <div key={l.id} className="lt-card"
                                        style={{ background: '#fff', borderRadius: 14, border: `1.5px solid ${hasPlan ? '#ddd6fe' : '#f0eefe'}`, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                            {/* Left icon */}
                                            <div style={{ width: 42, height: 42, borderRadius: 11, background: hasPlan ? 'linear-gradient(135deg,#7c3aed,#4f46e5)' : '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                                                {hasPlan ? '✨' : '📚'}
                                            </div>

                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                                                    <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{l.subject}</span>
                                                    <span style={{ fontSize: 11, color: '#6b7280' }}>{l.class}</span>
                                                    <span style={{ fontSize: 10, background: '#f5f3ff', color: '#6d28d9', padding: '1px 7px', borderRadius: 99 }}>{DAYS[l.dayOfWeek]} {l.startTime}</span>
                                                    {hasPlan && <span style={{ fontSize: 10, background: '#7c3aed', color: '#fff', padding: '1px 7px', borderRadius: 99, fontWeight: 700 }}>AI PLAN READY</span>}
                                                </div>
                                                {summary ? (
                                                    <p style={{ fontSize: 12, color: hasPlan ? '#6d28d9' : '#374151', margin: 0, lineHeight: 1.5, fontStyle: hasPlan ? 'normal' : 'italic' }}>
                                                        {summary.label}
                                                    </p>
                                                ) : (
                                                    <p style={{ fontSize: 12, color: '#9ca3af', margin: 0, fontStyle: 'italic' }}>No plan yet — click to generate one with AI</p>
                                                )}
                                            </div>

                                            <button
                                                onClick={() => setActiveModal(l)}
                                                className="lt-ai-btn"
                                                style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: hasPlan ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0, fontFamily: '"DM Sans",sans-serif', transition: 'all .2s', whiteSpace: 'nowrap' }}>
                                                {hasPlan ? '✨ View Plan' : '✨ Generate'}
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}

                        {computed.filter(l => l.dayOfWeek >= 1 && l.dayOfWeek <= 5).length === 0 && (
                            <div style={{ background: '#fff', borderRadius: 16, padding: '60px 20px', textAlign: 'center', border: '1.5px solid #f0eefe' }}>
                                <div style={{ fontSize: 52, marginBottom: 12 }}>📋</div>
                                <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#111827' }}>No lessons in timetable</h3>
                                <p style={{ fontSize: 13, color: '#9ca3af' }}>Once your timetable is set up, lessons will appear here for AI planning.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* AI Lesson Plan Modal */}
            {activeModal && (
                <AILessonModal
                    lesson={activeModal}
                    stored={storedData[activeModal.id] ?? { notes: '' }}
                    onSave={(id, data) => { saveData(id, data) }}
                    onSubmit={async (topic, content) => { await submitFormalPlan(activeModal, topic, content) }}
                    onClose={() => setActiveModal(null)}
                />
            )}
        </>
    )
}