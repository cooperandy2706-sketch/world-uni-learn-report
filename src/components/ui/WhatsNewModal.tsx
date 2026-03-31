// src/components/ui/WhatsNewModal.tsx
// Shows once per version — bump APP_VERSION to re-trigger for all users
import { useState, useEffect } from 'react'

const APP_VERSION = '1.5.0'
const STORAGE_KEY = `wula_seen_whats_new_v${APP_VERSION}`

// ── Changelog entries — edit this array to add new features ──────────────────
const FEATURES: {
    icon: string
    title: string
    description: string
    badge?: string
    badgeColor?: string
    highlight?: boolean  // draws extra attention
    steps?: string[]     // optional step list shown below description
}[] = [
    {
        icon: '📋',
        title: 'Daily Morning Register',
        description: 'Teachers can now record daily attendance with a single tap. The system automatically calculates term-level totals for report cards.',
        badge: 'NEW',
        badgeColor: '#10b981',
        highlight: true,
        steps: [
            'Class Teachers: Visit the "Register" tab every morning by 9 AM.',
            'Quick-mark: Mark all students present with one click, then adjust.',
            'Auto-sync: Daily logs automatically update the report card summaries.',
            'Admin: Monitor attendance in real-time from the Admin Portal.',
        ]
    },
    {
        icon: '✨',
        title: 'AI Lesson Plan Generator',
        description: 'Teachers can now generate a complete, professional lesson plan in seconds — powered by Google Gemini AI. Just fill in your topic and what you want to cover, and the AI does the rest.',
        badge: 'NEW',
        badgeColor: '#7c3aed',
        highlight: true,
        steps: [
            '1️⃣  Open the Lesson Tracker and tap the ✨ AI Plans tab',
            '2️⃣  Select any lesson and click ✨ Generate',
            '3️⃣  Enter your topic and key bullet points',
            '4️⃣  Hit Generate Lesson Plan — done in ~5 seconds!',
        ],
    },
    {
        icon: '📋',
        title: 'Full Lesson Plan Structure',
        description: 'Every generated plan follows a professional teaching format with clearly defined sections — no blank page anxiety for teachers.',
        badge: 'NEW',
        badgeColor: '#7c3aed',
        steps: [
            '🎯  Learning objectives (auto-written)',
            '🔑  Key vocabulary table',
            '🖼️  Visual aid image matched to your topic',
            '🏫  Introduction → Teaching → Practice → Wrap-up',
            '📝  Assessment ideas + homework assignment',
            '💡  Practical tips for delivering the lesson',
        ],
    },
    {
        icon: '🖨️',
        title: 'Print & Regenerate',
        description: 'Not happy with the plan? Regenerate with one click. Want a hard copy? Print directly to a clean, formatted PDF from your browser — no export needed.',
        badge: 'NEW',
        badgeColor: '#7c3aed',
    },
    {
        icon: '🔔',
        title: 'Web Push Notifications',
        description: 'Admins can now broadcast school-wide announcements directly to staff and student devices — even when the app is closed.',
        badge: 'NEW',
        badgeColor: '#7c3aed',
    },
    {
        icon: '⏱️',
        title: 'Live Lesson Countdown',
        description: 'The Lesson Tracker shows a real-time countdown and animated progress bar for your active class, plus a 5-minute heads-up notification before the next one starts.',
        badge: 'IMPROVED',
        badgeColor: '#0891b2',
    },
]

export default function WhatsNewModal() {
    const [open, setOpen] = useState(false)
    const [activeIdx, setActiveIdx] = useState(0)

    useEffect(() => {
        const seen = localStorage.getItem(STORAGE_KEY)
        if (!seen) setOpen(true)
    }, [])

    function dismiss() {
        localStorage.setItem(STORAGE_KEY, '1')
        setOpen(false)
    }

    if (!open) return null

    const feature = FEATURES[activeIdx]
    const isLast = activeIdx === FEATURES.length - 1

    return (
        <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(15,10,40,.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(8px)' }}
            aria-modal="true"
            role="dialog"
        >
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');
        @keyframes _wn_in { from { opacity:0; transform:translateY(24px) scale(.96) } to { opacity:1; transform:none } }
        @keyframes _wn_slide { from { opacity:0; transform:translateX(18px) } to { opacity:1; transform:none } }
        .wn-dot { transition: all .25s; cursor: pointer; border: none; padding:0; border-radius:99px; }
        .wn-btn { transition: all .2s; border:none; cursor:pointer; }
        .wn-btn:hover { filter: brightness(1.1) }
      `}</style>

            <div style={{
                background: '#fff',
                borderRadius: 24,
                width: '100%',
                maxWidth: 480,
                boxShadow: '0 40px 100px rgba(0,0,0,.3)',
                fontFamily: '"DM Sans",system-ui,sans-serif',
                overflow: 'hidden',
                animation: '_wn_in .4s cubic-bezier(.16,1,.3,1) both',
            }}>
                {/* Top gradient banner */}
                <div style={{
                    background: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 50%, #6d28d9 100%)',
                    padding: '28px 28px 24px',
                    position: 'relative',
                    overflow: 'hidden',
                }}>
                    {/* Decorative circles */}
                    <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,.05)' }} />
                    <div style={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,.04)' }} />

                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.14em', color: 'rgba(255,255,255,.55)', marginBottom: 6 }}>
                                WORLD UNI-LEARN · VERSION {APP_VERSION}
                            </div>
                            <h1 style={{
                                fontFamily: '"Playfair Display",serif',
                                fontSize: 26,
                                fontWeight: 700,
                                color: '#fff',
                                margin: 0,
                                lineHeight: 1.2,
                            }}>
                                What's New 🎉
                            </h1>
                            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.65)', marginTop: 6, margin: '6px 0 0' }}>
                                Here's everything we've added in this update.
                            </p>
                        </div>
                        <button
                            onClick={dismiss}
                            className="wn-btn"
                            aria-label="Close"
                            style={{
                                background: 'rgba(255,255,255,.12)',
                                color: '#fff',
                                borderRadius: 10,
                                width: 34,
                                height: 34,
                                fontSize: 18,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                marginLeft: 12,
                            }}
                        >×</button>
                    </div>

                    {/* Progress dots */}
                    <div style={{ display: 'flex', gap: 6, marginTop: 20 }}>
                        {FEATURES.map((_, i) => (
                            <button
                                key={i}
                                className="wn-dot"
                                onClick={() => setActiveIdx(i)}
                                style={{
                                    height: 6,
                                    width: activeIdx === i ? 24 : 6,
                                    background: activeIdx === i ? '#fff' : 'rgba(255,255,255,.3)',
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* Feature card */}
                <div style={{ padding: '24px 28px 20px' }} key={activeIdx}>
                    <div style={{ animation: '_wn_slide .3s cubic-bezier(.16,1,.3,1) both' }}>

                        {/* Highlight banner for hero features */}
                        {feature.highlight && (
                            <div style={{
                                background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)',
                                border: '1.5px solid #c4b5fd',
                                borderRadius: 14,
                                padding: '12px 14px',
                                marginBottom: 18,
                                display: 'flex',
                                gap: 10,
                                alignItems: 'center',
                            }}>
                                <span style={{ fontSize: 22 }}>🌟</span>
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#6d28d9', lineHeight: 1.5 }}>
                                    This is our biggest update yet — AI-powered lesson planning is now live!
                                </span>
                            </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: feature.steps ? 18 : 0 }}>
                            {/* Icon box */}
                            <div style={{
                                width: 52,
                                height: 52,
                                borderRadius: 15,
                                background: feature.highlight
                                    ? 'linear-gradient(135deg,#7c3aed,#4f46e5)'
                                    : 'linear-gradient(135deg,#ede9fe,#ddd6fe)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 24,
                                flexShrink: 0,
                                boxShadow: feature.highlight ? '0 6px 18px rgba(124,58,237,.35)' : 'none',
                            }}>
                                {feature.icon}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                    <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>{feature.title}</h2>
                                    {feature.badge && (
                                        <span style={{
                                            fontSize: 9,
                                            fontWeight: 800,
                                            letterSpacing: '.1em',
                                            padding: '2px 8px',
                                            borderRadius: 99,
                                            background: feature.badgeColor ?? '#6d28d9',
                                            color: '#fff',
                                        }}>
                                            {feature.badge}
                                        </span>
                                    )}
                                </div>
                                <p style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.65, margin: 0 }}>
                                    {feature.description}
                                </p>
                            </div>
                        </div>

                        {/* Steps / checklist */}
                        {feature.steps && (
                            <div style={{
                                background: '#fafafa',
                                border: '1px solid #f0eefe',
                                borderRadius: 12,
                                padding: '12px 14px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 8,
                            }}>
                                {feature.steps.map((step, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                        <div style={{
                                            width: 22,
                                            height: 22,
                                            borderRadius: '50%',
                                            background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
                                            color: '#fff',
                                            fontSize: 10,
                                            fontWeight: 800,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                            marginTop: 1,
                                        }}>
                                            {/* show number only for non-emoji step labels */}
                                            {/^\d/.test(step) ? '' : i + 1}
                                        </div>
                                        <span style={{ fontSize: 12, color: '#374151', lineHeight: 1.6 }}>{step}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Progress indicator + skip */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
                            <span style={{ fontSize: 11, color: '#9ca3af' }}>{activeIdx + 1} of {FEATURES.length}</span>
                            {!isLast && (
                                <button onClick={dismiss} className="wn-btn"
                                    style={{ fontSize: 11, color: '#9ca3af', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: '"DM Sans",sans-serif', textDecoration: 'underline' }}>
                                    Skip all
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom action row */}
                <div style={{ padding: '0 28px 28px', display: 'flex', gap: 10 }}>
                    {activeIdx > 0 && (
                        <button
                            onClick={() => setActiveIdx(i => i - 1)}
                            className="wn-btn"
                            style={{
                                flex: 1,
                                padding: '11px 0',
                                borderRadius: 12,
                                border: '1.5px solid #e5e7eb',
                                background: '#fff',
                                fontSize: 13,
                                fontWeight: 600,
                                color: '#374151',
                                fontFamily: '"DM Sans",sans-serif',
                            }}
                        >
                            ← Back
                        </button>
                    )}

                    {!isLast ? (
                        <button
                            onClick={() => setActiveIdx(i => i + 1)}
                            className="wn-btn"
                            style={{
                                flex: 1,
                                padding: '11px 0',
                                borderRadius: 12,
                                border: 'none',
                                background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
                                fontSize: 13,
                                fontWeight: 700,
                                color: '#fff',
                                fontFamily: '"DM Sans",sans-serif',
                            }}
                        >
                            Next →
                        </button>
                    ) : (
                        <button
                            onClick={dismiss}
                            className="wn-btn"
                            style={{
                                flex: 1,
                                padding: '11px 0',
                                borderRadius: 12,
                                border: 'none',
                                background: 'linear-gradient(135deg,#16a34a,#15803d)',
                                fontSize: 13,
                                fontWeight: 700,
                                color: '#fff',
                                fontFamily: '"DM Sans",sans-serif',
                            }}
                        >
                            🚀 Let's Go!
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
