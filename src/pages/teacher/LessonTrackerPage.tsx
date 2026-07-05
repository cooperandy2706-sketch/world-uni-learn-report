import { useStuckLoadingReload } from '../../hooks/useStuckLoadingReload'
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
import { X } from 'lucide-react'

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
        <div className="tp-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
            <div className="tp-modal" style={{ maxWidth: 700 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
                    <div>
                        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--primary-color)', marginBottom: 4 }}>✨ AI Lesson Planner</div>
                        <h2 className="tp-section-title" style={{ margin: 0, fontSize: 24 }}>{lesson.subject} — {lesson.class}</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>{DAYS[lesson.dayOfWeek]} · {lesson.period} · {lesson.startTime}–{lesson.endTime}</p>
                    </div>
                    <button type="button" onClick={onClose} style={{ background: 'var(--bg-hover)', border: 'none', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-main)' }} aria-label="Close"><X size={18} strokeWidth={2.5} /></button>
                </div>

                <div className="tp-tabs" style={{ marginBottom: 24 }}>
                    {[
                        { k: 'input', label: '1. Plan Input' },
                        { k: 'plan', label: '2. Generated Plan', disabled: !plan },
                    ].map(s => (
                        <button
                            key={s.k}
                            type="button"
                            className={`tp-tab ${step === s.k ? 'active' : ''}`}
                            onClick={() => !s.disabled && setStep(s.k as 'input' | 'plan')}
                            disabled={s.disabled}
                            style={s.disabled ? { opacity: 0.4, cursor: 'default' } : undefined}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>

                <div>
                    {step === 'input' ? (
                        // ── Input Step ────────────────────────────────────────
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, padding: 16, fontSize: 13, color: '#1E40AF', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                <span style={{ fontSize: 20 }}>💡</span>
                                <div>
                                    <div style={{ fontWeight: 800, marginBottom: 4 }}>How to get the best results:</div>
                                    <span style={{ lineHeight: 1.5 }}>
                                        Enter a specific topic (e.g., "Introduction to Photosynthesis") and add 2-3 key objectives. The more specific you are, the better the AI can tailor the activities for your class.
                                    </span>
                                </div>
                            </div>

                            {/* Topic */}
                            <div>
                                <label className="tp-label">📌 Lesson Topic *</label>
                                <input
                                    className="tp-input"
                                    value={topic}
                                    onChange={e => setTopic(e.target.value)}
                                    placeholder="e.g. Photosynthesis, The Pythagorean Theorem, World War II causes…"
                                />
                            </div>

                            {/* Bullets */}
                            <div>
                                <label className="tp-label">📋 Key Points / Objectives to Cover</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                                    {bullets.map((b, i) => (
                                        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                            <span style={{ color: 'var(--text-subtle)', fontSize: 16, flexShrink: 0 }}>•</span>
                                            <input
                                                className="tp-input"
                                                value={b}
                                                onChange={e => updateBullet(i, e.target.value)}
                                                placeholder={`Key point ${i + 1}…`}
                                                style={{ flex: 1 }}
                                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addBullet() } }}
                                            />
                                            {bullets.length > 1 && (
                                                <button onClick={() => removeBullet(i)} style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', padding: '8px' }}><X size={16} /></button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button onClick={addBullet} className="tp-btn tp-btn-ghost" style={{ borderStyle: 'dashed', width: '100%' }}>
                                    + Add Key Point
                                </button>
                            </div>

                            {/* Teacher Notes */}
                            <div>
                                <label className="tp-label">📝 Personal Notes (optional, saved privately)</label>
                                <textarea
                                    className="tp-input"
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    rows={3}
                                    placeholder="Personal reminders, observations, what to emphasize…"
                                    style={{ resize: 'vertical' }}
                                />
                            </div>

                            {error && <p style={{ fontSize: 13, color: 'var(--danger-color)', fontWeight: 600 }}>⚠️ {error}</p>}

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: usageCount >= DAILY_LIMIT ? 'var(--danger-color)' : 'var(--text-muted)' }}>
                                    Quota: {usageCount} / {DAILY_LIMIT} today
                                </div>
                                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                    <button onClick={handleSaveNotes} className="tp-btn tp-btn-ghost" style={{ border: '1px solid var(--border-color)' }}>
                                        💾 Save Notes Only
                                    </button>
                                    <button
                                        onClick={handleGenerate}
                                        disabled={generating || usageCount >= DAILY_LIMIT}
                                        className="tp-btn tp-btn-primary"
                                        style={{ opacity: (generating || usageCount >= DAILY_LIMIT) ? 0.6 : 1 }}
                                    >
                                        {generating ? 'Generating…' : usageCount >= DAILY_LIMIT ? 'Limit Reached' : '✨ Generate Plan'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // ── Plan View Step ────────────────────────────────────
                        plan && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                                        Generated {new Date(plan.generatedAt).toLocaleString()}
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                        <button onClick={() => setStep('input')} className="tp-btn tp-btn-ghost" style={{ border: '1px solid var(--border-color)', height: 32, fontSize: 12, padding: '0 12px' }}>
                                            ✏️ Edit
                                        </button>
                                        <button onClick={handlePrint} className="tp-btn tp-btn-ghost" style={{ border: '1px solid var(--border-color)', height: 32, fontSize: 12, padding: '0 12px' }}>
                                            🖨️ Print
                                        </button>
                                        <button onClick={() => { handleGenerate() }} className="tp-btn tp-btn-primary" style={{ height: 32, fontSize: 12, padding: '0 12px', opacity: generating ? 0.6 : 1 }} disabled={generating}>
                                            {generating ? '⏳ Regenerating…' : '🔄 Regenerate'}
                                        </button>
                                    </div>
                                </div>

                                {/* Rendered Markdown */}
                                <div style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '24px', maxHeight: 500, overflowY: 'auto', lineHeight: 1.75 }}>
                                    <style>{`
                    .lp-markdown h1 { font-family: 'Outfit', sans-serif; font-size: 22px; color: var(--primary-color); border-bottom: 2px solid var(--border-color); padding-bottom: 8px; margin-top: 0; font-weight: 800; }
                    .lp-markdown h2 { font-size: 16px; color: var(--text-primary); border-bottom: 1px solid var(--border-color); padding-bottom: 4px; margin-top: 28px; font-weight: 700; }
                    .lp-markdown h3 { font-size: 14px; color: var(--text-primary); margin-top: 18px; font-weight: 700; }
                    .lp-markdown table { border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 13px; }
                    .lp-markdown th, .lp-markdown td { border: 1px solid var(--border-color); padding: 8px 12px; text-align: left; }
                    .lp-markdown th { background: var(--bg-card); color: var(--text-primary); font-weight: 700; }
                    .lp-markdown ul, .lp-markdown ol { padding-left: 20px; }
                    .lp-markdown li { margin-bottom: 4px; font-size: 14px; color: var(--text-main); }
                    .lp-markdown p { font-size: 14px; color: var(--text-main); margin-bottom: 8px; }
                    .lp-markdown img { max-width: 100%; border-radius: 12px; margin: 12px 0; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                    .lp-markdown code { background: var(--bg-card); padding: 2px 6px; border-radius: 4px; font-size: 13px; color: var(--primary-color); border: 1px solid var(--border-color); }
                    .lp-markdown strong { color: var(--text-primary); font-weight: 700; }
                    .lp-markdown hr { border: none; border-top: 1px solid var(--border-color); margin: 24px 0; }
                    .lp-markdown blockquote { border-left: 3px solid var(--primary-color); padding-left: 14px; color: var(--text-muted); font-style: italic; }
                  `}</style>
                                    <div className="lp-markdown">
                                        <ReactMarkdown>{plan.markdown}</ReactMarkdown>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: 12, marginTop: 16, justifyContent: 'flex-end', flexWrap: 'wrap', paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
                                    <button onClick={onClose} className="tp-btn tp-btn-ghost">Close</button>
                                    <button onClick={handleSaveNotes} className="tp-btn tp-btn-ghost" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-color)' }}>💾 Save Locally</button>
                                    <button onClick={handleFormalSubmit} disabled={submitting} className="tp-btn tp-btn-primary" style={{ opacity: submitting ? 0.7 : 1 }}>
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
  useStuckLoadingReload(loading)
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
        const { data: t } = await supabase.from('teachers').select('id, school_id').eq('user_id', user!.id).maybeSingle()
        if (!t) { setLoading(false); return }
        setTeacherInfo({ id: t.id, schoolId: t.school_id })

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

        const [{ data: slots }] = await Promise.all([
            supabase.from('timetable_slots')
                .select('*, subject:subjects(id,name), class:classes(id,name), period:timetable_periods(id,name,start_time,end_time,is_break,sort_order)')
                .in('teacher_id', allTeacherIdsForSlots)
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
                    new Notification(`⏰ Class in 5 minutes!`, { body: `${l.subject} — ${l.class} (${l.startTime})`, icon: '/app-icon.svg', tag: `lesson_${l.id}` })
                }
            }
            if (l.status === 'now' && l.progress < 2 && !alerted.has(`start_${l.id}`)) {
                setAlerted(prev => new Set([...prev, `start_${l.id}`]))
                toast(`🟢 ${l.subject} for ${l.class} is starting NOW!`, {
                    duration: 10000, style: { background: '#16a34a', color: '#fff', fontWeight: 600 }, icon: '🏫',
                })
                if (Notification.permission === 'granted') {
                    new Notification(`🏫 Class starting now!`, { body: `${l.subject} — ${l.class}`, icon: '/app-icon.svg', tag: `lesson_start_${l.id}` })
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
        <div className="tp-page">
            <link rel="stylesheet" href="/src/styles/teacher-portal.css" />
            <style>{`
        @keyframes _lt_fi{from{opacity:0}to{opacity:1}}
        @keyframes _lt_pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.8;transform:scale(.98)}}
        @keyframes _lt_spin{to{transform:rotate(360deg)}}
      `}</style>
            <div style={{ animation: '_lt_fi .4s ease' }}>

                {/* Header */}
                <div className="tp-hero" style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                        <div>
                            <div className="tp-hero-label">Timetable & AI Plans</div>
                            <h1 className="tp-hero-title">Lesson Tracker</h1>
                            <p className="tp-hero-sub">
                                {DAYS[todayDay]} · {now.toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Active lesson banner */}
                {activeLesson && (
                    <div className="tp-card" style={{ background: 'linear-gradient(135deg,#14532d,#16a34a)', borderRadius: 16, padding: '20px 24px', marginBottom: 20, color: '#fff', animation: '_lt_pulse 3s ease infinite', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,.06)' }} />
                        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.1em', opacity: .8, marginBottom: 8, textTransform: 'uppercase' }}>🟢 CLASS IN PROGRESS</div>
                        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: '#fff' }}>{activeLesson.subject}</h2>
                        <p style={{ fontSize: 15, opacity: .9, margin: '0 0 16px' }}>{activeLesson.class} · {activeLesson.period} · {activeLesson.startTime}–{activeLesson.endTime}</p>
                        <div style={{ height: 6, background: 'rgba(255,255,255,.2)', borderRadius: 99, overflow: 'hidden', marginBottom: 8 }}>
                            <div style={{ height: '100%', width: `${activeLesson.progress}%`, background: '#fff', borderRadius: 99, transition: 'width 1s linear' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, opacity: .9, fontWeight: 600 }}>
                            <span>{activeLesson.progress}% complete</span>
                            <span>{formatCountdown(activeLesson.countdown)} remaining</span>
                        </div>
                    </div>
                )}

                {!activeLesson && nextLesson && (
                    <div className="tp-card" style={{ background: nextLesson.status === 'soon' ? 'linear-gradient(135deg,#78350f,#d97706)' : 'linear-gradient(135deg,#2e1065,#4c1d95)', borderRadius: 16, padding: '20px 24px', marginBottom: 20, color: '#fff' }}>
                        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.1em', opacity: .8, marginBottom: 8, textTransform: 'uppercase' }}>
                            {nextLesson.status === 'soon' ? '⏰ STARTING IN' : '📅 NEXT CLASS'}
                        </div>
                        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 22, fontWeight: 800, margin: '0 0 4px', color: '#fff' }}>{nextLesson.subject}</h2>
                        <p style={{ fontSize: 14, opacity: .9, margin: '0 0 12px' }}>{nextLesson.class} · {nextLesson.startTime}–{nextLesson.endTime}</p>
                        <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 36, fontWeight: 800 }}>{formatCountdown(nextLesson.countdown)}</div>
                    </div>
                )}

                {!activeLesson && !nextLesson && todayItems.length > 0 && (
                    <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 16, padding: '16px 20px', marginBottom: 20, fontSize: 14, color: '#15803D', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 20 }}>✅</span> All {todayItems.length} classes done for today! Great work.
                    </div>
                )}

                {/* Tabs */}
                <div className="tp-tabs" style={{ marginBottom: 20, overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: 4 }}>
                  {[
                    { k: 'today', label: `Today (${todayItems.length})` },
                    { k: 'week', label: 'Full Week' },
                    { k: 'tracker', label: '✨ AI Plans' },
                  ].map(t => (
                    <button key={t.k} className={`tp-tab ${tab === t.k ? 'active' : ''}`} onClick={() => setTab(t.k as any)}>
                      {t.label}
                    </button>
                  ))}
                </div>

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '4px solid var(--border-color)', borderTopColor: 'var(--primary-color)', animation: '_lt_spin .8s linear infinite' }} />
                    </div>
                ) : tab === 'today' ? (
                    // ── TODAY ──
                    todayItems.length === 0 ? (
                        <div className="tp-card" style={{ padding: '80px 20px', textAlign: 'center', background: 'var(--bg-hover)' }}>
                            <div style={{ fontSize: 64, marginBottom: 16 }}>☀️</div>
                            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px' }}>No classes today</h3>
                            <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>Check the Full Week tab to see your schedule.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {todayItems.map((l, i) => (
                                <div key={l.id} className="tp-card"
                                    style={{ background: statusBg[l.status], border: `1px solid ${statusColor[l.status]}33`, padding: 20, animation: `_lt_fi .3s ease ${i * .05}s both` }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                                        <div style={{ textAlign: 'center', flexShrink: 0, width: 64 }}>
                                            <div style={{ fontSize: 16, fontWeight: 800, color: statusColor[l.status] }}>{l.startTime}</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-subtle)', fontWeight: 600 }}>{l.endTime}</div>
                                        </div>
                                        <div style={{ width: 3, height: 'auto', alignSelf: 'stretch', background: `${statusColor[l.status]}40`, borderRadius: 99, flexShrink: 0 }} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                                                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>{l.subject}</span>
                                                <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 99, background: statusColor[l.status] + '18', color: statusColor[l.status] }}>
                                                    {statusLabel[l.status]}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{l.class} · {l.period}</div>
                                            {storedData[l.id]?.plan && (
                                                <div style={{ fontSize: 12, color: 'var(--primary-color)', marginTop: 8, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    ✨ AI plan: {storedData[l.id].plan!.topic}
                                                </div>
                                            )}
                                            {storedData[l.id]?.notes && !storedData[l.id]?.plan && (
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, fontStyle: 'italic' }}>
                                                    📝 {storedData[l.id].notes.slice(0, 60)}…
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                            {l.status === 'now' && (
                                                <div>
                                                    <div style={{ fontSize: 20, fontWeight: 800, color: '#16a34a', fontFamily: "'Outfit', sans-serif" }}>{formatCountdown(l.countdown)}</div>
                                                    <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>remaining</div>
                                                </div>
                                            )}
                                            {(l.status === 'soon' || l.status === 'upcoming') && (
                                                <div>
                                                    <div style={{ fontSize: 18, fontWeight: 800, color: statusColor[l.status], fontFamily: "'Outfit', sans-serif" }}>{formatCountdown(l.countdown)}</div>
                                                    <div style={{ fontSize: 11, color: statusColor[l.status], fontWeight: 600 }}>to start</div>
                                                </div>
                                            )}
                                            <button onClick={() => setActiveModal(l)}
                                                className="tp-btn"
                                                style={{ marginTop: 12, padding: '6px 12px', background: storedData[l.id]?.plan ? 'var(--bg-hover)' : 'var(--primary-color)', color: storedData[l.id]?.plan ? 'var(--text-main)' : '#fff', border: storedData[l.id]?.plan ? '1px solid var(--border-color)' : 'none', minHeight: 'unset', height: 32, fontSize: 12 }}>
                                                {storedData[l.id]?.plan ? '✨ View Plan' : '+ AI Plan'}
                                            </button>
                                        </div>
                                    </div>
                                    {l.status === 'now' && (
                                        <div style={{ marginTop: 16, height: 6, background: '#DCFCE7', borderRadius: 99, overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${l.progress}%`, background: 'linear-gradient(90deg,#16A34A,#22C55E)', borderRadius: 99, transition: 'width 1s linear' }} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )
                ) : tab === 'week' ? (
                    // ── FULL WEEK ──
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {[1, 2, 3, 4, 5].map(day => {
                            const dayLessons = computed.filter(l => l.dayOfWeek === day).sort((a, b) => a.startMinutes - b.startMinutes)
                            const isToday = day === todayDay
                            return (
                                <div key={day} className="tp-card" style={{ padding: 0, border: isToday ? '2px solid var(--primary-color)' : '1px solid var(--border-color)', overflow: 'hidden' }}>
                                    <div style={{ padding: '12px 20px', background: isToday ? 'linear-gradient(135deg, var(--primary-color), var(--primary-color-dark))' : 'var(--bg-hover)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <span style={{ fontSize: 15, fontWeight: 800, color: isToday ? '#fff' : 'var(--text-primary)' }}>{DAYS[day]}</span>
                                        {isToday && <span style={{ fontSize: 10, background: 'rgba(255,255,255,.2)', color: '#fff', padding: '2px 8px', borderRadius: 99, fontWeight: 800 }}>TODAY</span>}
                                        <span style={{ fontSize: 13, color: isToday ? 'rgba(255,255,255,.8)' : 'var(--text-muted)', marginLeft: 'auto', fontWeight: 600 }}>{dayLessons.length} class{dayLessons.length !== 1 ? 'es' : ''}</span>
                                    </div>
                                    {dayLessons.length === 0 ? (
                                        <div style={{ padding: '20px', fontSize: 14, color: 'var(--text-subtle)', textAlign: 'center' }}>No classes</div>
                                    ) : (
                                        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            {dayLessons.map(l => (
                                                <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: l.status === 'now' ? '#F0FDF4' : l.status === 'done' ? 'var(--bg-hover)' : 'var(--bg-card)', border: `1px solid ${l.status === 'now' ? '#BBF7D0' : 'var(--border-color)'}` }}>
                                                    <span style={{ fontSize: 13, color: 'var(--text-muted)', width: 48, flexShrink: 0, fontWeight: 700 }}>{l.startTime}</span>
                                                    <span style={{ fontSize: 14, fontWeight: 800, color: l.status === 'done' ? 'var(--text-muted)' : 'var(--text-primary)', flex: 1 }}>{l.subject}</span>
                                                    <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{l.class}</span>
                                                    {storedData[l.id]?.plan && <span style={{ fontSize: 10, background: 'var(--primary-color)', color: '#fff', padding: '2px 8px', borderRadius: 99, fontWeight: 800 }}>✨ AI</span>}
                                                    {l.status === 'now' && <span style={{ fontSize: 10, background: '#16a34a', color: '#fff', padding: '2px 8px', borderRadius: 99, fontWeight: 800 }}>LIVE</span>}
                                                    {l.status === 'done' && <span style={{ fontSize: 16, color: 'var(--success-color)' }}>✓</span>}
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {/* Explainer */}
                        <div style={{ background: 'linear-gradient(135deg, var(--primary-color-dark), var(--primary-color))', borderRadius: 16, padding: '20px 24px', color: '#fff', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                            <span style={{ fontSize: 32 }}>✨</span>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8, fontFamily: "'Outfit', sans-serif" }}>AI-Powered Lesson Planner</div>
                                <div style={{ fontSize: 14, opacity: .9, lineHeight: 1.6 }}>
                                    Select any lesson, enter your topic and key points, and the AI will instantly generate a full professional lesson plan — complete with objectives, activities, visual aids, and homework.
                                </div>
                            </div>
                        </div>
                        
                        {/* Stats row */}
                        {(() => {
                            const withPlans = Object.values(storedData).filter(d => d.plan).length
                            const withNotes = Object.values(storedData).filter(d => d.notes && !d.plan).length
                            return withPlans > 0 || withNotes > 0 ? (
                                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                    {withPlans > 0 && <div style={{ background: 'rgba(124, 58, 237, 0.1)', border: '1px solid rgba(124, 58, 237, 0.2)', borderRadius: 12, padding: '10px 16px', fontSize: 13, color: 'var(--primary-color)', fontWeight: 800 }}>✨ {withPlans} AI plan{withPlans !== 1 ? 's' : ''} generated</div>}
                                    {withNotes > 0 && <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '10px 16px', fontSize: 13, color: '#16A34A', fontWeight: 800 }}>📝 {withNotes} note{withNotes !== 1 ? 's' : ''} saved</div>}
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
                                    <div key={l.id} className="tp-card"
                                        style={{ border: `1px solid ${hasPlan ? 'var(--primary-color)' : 'var(--border-color)'}`, padding: 20 }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                                            {/* Left icon */}
                                            <div style={{ width: 48, height: 48, borderRadius: 16, background: hasPlan ? 'linear-gradient(135deg, var(--primary-color), var(--primary-color-dark))' : 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                                                {hasPlan ? '✨' : '📚'}
                                            </div>
                                            
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                                                    <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>{l.subject}</span>
                                                    <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{l.class}</span>
                                                    <span style={{ fontSize: 11, background: 'var(--bg-hover)', color: 'var(--text-main)', padding: '2px 8px', borderRadius: 99, fontWeight: 700 }}>{DAYS[l.dayOfWeek]} {l.startTime}</span>
                                                    {hasPlan && <span style={{ fontSize: 10, background: 'var(--primary-color)', color: '#fff', padding: '2px 8px', borderRadius: 99, fontWeight: 800 }}>AI PLAN READY</span>}
                                                </div>
                                                {summary ? (
                                                    <p style={{ fontSize: 13, color: hasPlan ? 'var(--primary-color)' : 'var(--text-main)', margin: 0, lineHeight: 1.5, fontWeight: hasPlan ? 600 : 400 }}>
                                                        {summary.label}
                                                    </p>
                                                ) : (
                                                    <p style={{ fontSize: 13, color: 'var(--text-subtle)', margin: 0, fontStyle: 'italic' }}>No plan yet — click to generate one with AI</p>
                                                )}
                                            </div>
                                            
                                            <button
                                                onClick={() => setActiveModal(l)}
                                                className="tp-btn"
                                                style={{ background: hasPlan ? 'var(--bg-hover)' : 'var(--primary-color)', color: hasPlan ? 'var(--text-main)' : '#fff', border: hasPlan ? '1px solid var(--border-color)' : 'none', padding: '8px 16px', height: 'auto', minHeight: 40, flexShrink: 0, whiteSpace: 'nowrap' }}>
                                                {hasPlan ? '✨ View Plan' : '✨ Generate'}
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                            
                        {computed.filter(l => l.dayOfWeek >= 1 && l.dayOfWeek <= 5).length === 0 && (
                            <div className="tp-card" style={{ padding: '80px 20px', textAlign: 'center', background: 'var(--bg-hover)' }}>
                                <div style={{ fontSize: 64, marginBottom: 16 }}>📋</div>
                                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px' }}>No lessons in timetable</h3>
                                <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>Once your timetable is set up, lessons will appear here for AI planning.</p>
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
        </div>
    )
}