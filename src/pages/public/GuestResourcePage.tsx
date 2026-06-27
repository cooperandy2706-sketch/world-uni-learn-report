import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

/* ─── Normalize quiz question ─── */
function normalizeQuestion(q: any) {
  if (q.questionText !== undefined && Array.isArray(q.options) && typeof q.options[0] === 'object') {
    return { id: q.id, questionText: q.questionText, options: q.options, correctOption: q.correctOption, points: q.points || 1 }
  }
  if (q.text !== undefined && Array.isArray(q.options) && (q.options.length === 0 || typeof q.options[0] === 'string')) {
    const optionObjs = (q.options as string[]).map((o, i) => ({ id: `opt_${q.id}_${i}`, text: o }))
    const correctObj = optionObjs.find(o => o.text === q.correctAnswer)
    return { id: q.id, questionText: q.text, options: optionObjs, correctOption: correctObj?.id || '', points: q.points || 1 }
  }
  return { id: q.id || String(Math.random()), questionText: q.questionText || q.text || 'Question', options: (q.options || []).map((o: any, i: number) => typeof o === 'string' ? { id: `opt_${i}`, text: o } : o), correctOption: q.correctOption || '', points: q.points || 1 }
}

/* ─── Inline Practice Quiz ─── */
function InlineMiniQuiz({ questions: rawQuestions }: { questions: any[] }) {
  const questions = rawQuestions.map(normalizeQuestion)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const maxScore = questions.reduce((a, q) => a + (q.points || 1), 0)
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0

  const handleSubmit = () => {
    let s = 0
    questions.forEach(q => { if (answers[q.id] === q.correctOption) s += q.points })
    setScore(s); setSubmitted(true)
    setTimeout(() => document.getElementById('mini-quiz-result')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)
  }

  return (
    <div style={{ borderTop: '2px dashed #ede9fe', paddingTop: '2rem', marginTop: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', padding: '0.5rem 1rem', borderRadius: 20, color: 'white', fontWeight: 800, fontSize: '0.85rem' }}>📝 Practice Quiz</div>
        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{questions.length} questions · Test your understanding</span>
      </div>

      {submitted && (
        <div id="mini-quiz-result" style={{ background: pct >= 50 ? '#ecfdf5' : '#fef2f2', border: `2px solid ${pct >= 50 ? '#10b981' : '#ef4444'}`, borderRadius: 12, padding: '1.25rem 1.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>{pct >= 80 ? '🏆' : pct >= 50 ? '🎉' : '📚'}</div>
          <p style={{ fontWeight: 800, color: pct >= 50 ? '#059669' : '#dc2626', fontSize: '1.1rem', margin: '0 0 0.25rem' }}>{pct}% — {score}/{maxScore} points</p>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>{pct >= 50 ? 'Great work!' : 'Review the material and try again.'}</p>
          <button onClick={() => { setAnswers({}); setSubmitted(false); setScore(0) }} style={{ marginTop: '0.75rem', background: 'white', border: '1px solid #e2e8f0', color: '#7c3aed', padding: '0.5rem 1rem', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>Try Again</button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {questions.map((q, i) => (
          <div key={q.id} style={{ background: '#faf5ff', borderRadius: 12, padding: '1.25rem', border: '1px solid #ede9fe' }}>
            <p style={{ fontWeight: 700, color: '#1e0646', marginBottom: '0.875rem', fontSize: '0.95rem', lineHeight: 1.5 }}>
              <span style={{ color: '#7c3aed', marginRight: '0.4rem' }}>{i + 1}.</span>{q.questionText}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {q.options.map((opt: any) => {
                const sel = answers[q.id] === opt.id
                const correct = q.correctOption === opt.id
                let bg = 'white', border = '#e2e8f0', color = '#334155'
                if (submitted) {
                  if (correct) { bg = '#ecfdf5'; border = '#10b981'; color = '#065f46' }
                  else if (sel && !correct) { bg = '#fef2f2'; border = '#ef4444'; color = '#991b1b' }
                } else if (sel) { bg = '#f5f3ff'; border = '#7c3aed'; color = '#4c1d95' }
                return (
                  <button key={opt.id} disabled={submitted} onClick={() => !submitted && setAnswers(p => ({ ...p, [q.id]: opt.id }))}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: bg, border: `1.5px solid ${border}`, padding: '0.625rem 0.875rem', borderRadius: 8, cursor: submitted ? 'default' : 'pointer', textAlign: 'left', color, transition: 'all 0.15s', width: '100%' }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${sel || (submitted && correct) ? border : '#cbd5e1'}`, background: sel || (submitted && correct) ? border : 'white', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.875rem', fontWeight: sel ? 700 : 500 }}>{opt.text}</span>
                    {submitted && correct && <span style={{ marginLeft: 'auto', color: '#10b981', fontWeight: 900, fontSize: '0.85rem' }}>✓</span>}
                    {submitted && sel && !correct && <span style={{ marginLeft: 'auto', color: '#ef4444', fontWeight: 900, fontSize: '0.85rem' }}>✗</span>}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {!submitted && (
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <button onClick={handleSubmit} disabled={Object.keys(answers).length === 0}
            style={{ background: Object.keys(answers).length > 0 ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : '#cbd5e1', color: 'white', border: 'none', padding: '0.75rem 2rem', borderRadius: 10, fontWeight: 800, fontSize: '0.95rem', cursor: Object.keys(answers).length > 0 ? 'pointer' : 'not-allowed', boxShadow: Object.keys(answers).length > 0 ? '0 4px 15px rgba(109,40,217,0.3)' : 'none' }}>
            Submit Answers
          </button>
        </div>
      )}
    </div>
  )
}

/* ─── Simple Markdown → HTML ─── */
function markdownToHtml(md: string): string {
  if (!md) return ''
  let html = md
    .replace(/^#{6}\s(.+)$/gm, '<h6>$1</h6>')
    .replace(/^#{5}\s(.+)$/gm, '<h5>$1</h5>')
    .replace(/^#{4}\s(.+)$/gm, '<h4>$1</h4>')
    .replace(/^#{3}\s(.+)$/gm, '<h3>$1</h3>')
    .replace(/^#{2}\s(.+)$/gm, '<h2>$1</h2>')
    .replace(/^#{1}\s(.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy" />')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/^>\s(.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^---$/gm, '<hr>')
    .replace(/^\s*[-*+]\s(.+)$/gm, '<li>$1</li>')
    .replace(/^\s*\d+\.\s(.+)$/gm, '<li>$1</li>')
  html = html.replace(/((<li>[^]*?<\/li>\n?)+)/g, '<ul>$1</ul>')
  const lines = html.split('\n')
  const processedLines: string[] = []
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<ol') ||
      trimmed.startsWith('<li') || trimmed.startsWith('<blockquote') || trimmed.startsWith('<hr') ||
      trimmed.startsWith('<img') || trimmed.startsWith('<iframe') || trimmed.startsWith('<pre') ||
      trimmed.startsWith('<table') || trimmed.startsWith('<div') || trimmed === '') {
      processedLines.push(line)
    } else {
      processedLines.push(`<p>${trimmed}</p>`)
    }
  }
  return processedLines.join('\n')
}

/* ─── Styled Markdown Renderer ─── */
function StyledMarkdownContent({ content }: { content: string }) {
  return (
    <div style={{ fontSize: '1rem', lineHeight: 1.9, color: '#1e293b' }}>
      <style>{`
        .styled-content h1 { font-size: 2rem; font-weight: 900; color: #1e0646; margin: 2rem 0 1rem; font-family: 'Playfair Display', serif; border-bottom: 3px solid #7c3aed; padding-bottom: 0.5rem; }
        .styled-content h2 { font-size: 1.5rem; font-weight: 800; color: #1e0646; margin: 1.75rem 0 0.875rem; display: flex; align-items: center; gap: 0.5rem; }
        .styled-content h2::before { content: ''; display: inline-block; width: 4px; height: 1.2em; background: #7c3aed; border-radius: 4px; flex-shrink: 0; }
        .styled-content h3 { font-size: 1.2rem; font-weight: 800; color: #334155; margin: 1.5rem 0 0.75rem; }
        .styled-content h4 { font-size: 1.05rem; font-weight: 700; color: #475569; margin: 1.25rem 0 0.625rem; }
        .styled-content p { margin: 0 0 1.25rem; color: #334155; }
        .styled-content strong { color: #1e0646; font-weight: 800; }
        .styled-content em { color: #5b21b6; font-style: italic; }
        .styled-content ul, .styled-content ol { margin: 0 0 1.25rem 1.5rem; padding: 0; }
        .styled-content li { margin-bottom: 0.4rem; color: #334155; }
        .styled-content blockquote { border-left: 4px solid #7c3aed; margin: 1.5rem 0; padding: 0.875rem 1.25rem; background: #f5f3ff; border-radius: 0 8px 8px 0; color: #4c1d95; font-style: italic; }
        .styled-content code { background: #f1f5f9; color: #7c3aed; padding: 0.15em 0.4em; border-radius: 4px; font-size: 0.875em; font-family: monospace; }
        .styled-content pre { background: #1e1b4b; color: #e0e7ff; padding: 1.25rem 1.5rem; border-radius: 12px; overflow-x: auto; margin: 1.5rem 0; }
        .styled-content pre code { background: transparent; color: inherit; padding: 0; }
        .styled-content img { max-width: 100%; height: auto; border-radius: 12px; margin: 1.25rem 0; box-shadow: 0 4px 20px rgba(0,0,0,0.1); display: block; }
        .styled-content table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
        .styled-content th { background: #1e0646; color: white; padding: 0.75rem 1rem; font-weight: 700; text-align: left; font-size: 0.875rem; }
        .styled-content td { padding: 0.75rem 1rem; border-bottom: 1px solid #e2e8f0; font-size: 0.9rem; }
        .styled-content tr:last-child td { border-bottom: none; }
        .styled-content tr:nth-child(even) { background: #f8fafc; }
        .styled-content hr { border: none; border-top: 2px dashed #e2e8f0; margin: 2rem 0; }
        .styled-content a { color: #7c3aed; text-decoration: underline; font-weight: 600; }
        .styled-content iframe { width: 100%; border-radius: 12px; margin: 1rem 0; border: 0; }
      `}</style>
      <div className="styled-content" dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }} />
    </div>
  )
}

/* ─── Content type helpers ─── */
function getTypeInfo(type: string) {
  const map: Record<string, { icon: string; label: string; bg: string; color: string }> = {
    video: { icon: '▶️', label: 'Video', bg: '#fef3c7', color: '#d97706' },
    pdf: { icon: '📄', label: 'PDF', bg: '#fee2e2', color: '#dc2626' },
    passage: { icon: '📖', label: 'Reading', bg: '#f0fdf4', color: '#059669' },
    google_doc: { icon: '📋', label: 'Document', bg: '#eff6ff', color: '#2563eb' },
    link: { icon: '🔗', label: 'Link', bg: '#f5f3ff', color: '#7c3aed' },
  }
  return map[type] || { icon: '📚', label: type, bg: '#f1f5f9', color: '#64748b' }
}

/* ─── Resource Content Renderer ─── */
function renderResourceContent(resource: any) {
  if (!resource || !resource.content) return (
    <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No content available.</div>
  )

  if (resource.content_type === 'video') {
    const isYouTube = resource.content.includes('youtube.com') || resource.content.includes('youtu.be')
    if (isYouTube) {
      const videoId = resource.content.split('v=')[1]?.split('&')[0] || resource.content.split('youtu.be/')[1]?.split('?')[0]
      return (
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
          <iframe src={`https://www.youtube.com/embed/${videoId}`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        </div>
      )
    }
    return <video controls style={{ width: '100%', borderRadius: 16, outline: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}><source src={resource.content} />Your browser does not support the video tag.</video>
  }

  if (resource.content_type === 'pdf') {
    return <div style={{ height: '80vh', width: '100%', borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}><iframe src={resource.content} style={{ width: '100%', height: '100%', border: 'none' }} title={resource.title} /></div>
  }

  if (resource.content_type === 'google_doc') {
    return <div style={{ height: '80vh', width: '100%', borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}><iframe src={resource.content} style={{ width: '100%', height: '100%', border: 'none' }} title={resource.title} /></div>
  }

  if (resource.content_type === 'link') {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 2rem', background: 'white', borderRadius: 16, border: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔗</div>
        <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '1rem' }}>This resource links to an external page.</p>
        <a href={resource.content} target="_blank" rel="noopener noreferrer" style={{ background: '#7c3aed', color: 'white', textDecoration: 'none', padding: '0.875rem 2rem', borderRadius: 10, fontWeight: 700, display: 'inline-block', fontSize: '1rem' }}>Open Resource →</a>
      </div>
    )
  }

  // Default: passage / markdown
  return <StyledMarkdownContent content={resource.content} />
}

/* ─── Main Page ─── */
export default function GuestResourcePage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: resource, isLoading, error } = useQuery({
    queryKey: ['public-resource', id],
    queryFn: async () => {
      if (!id) throw new Error('No resource ID')
      const { data, error } = await supabase
        .from('global_resources')
        .select(`*, subjects(name, code)`)
        .eq('id', id)
        .is('school_id', null)
        .eq('is_published', true)
        .single()
      if (error) throw error
      return data
    }
  })

  if (isLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"DM Sans", sans-serif', background: '#f8fafc' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid #ede9fe', borderTopColor: '#7c3aed', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
        <p style={{ color: '#64748b', fontWeight: 600 }}>Loading resource...</p>
      </div>
    </div>
  )

  if (error || !resource) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"DM Sans", sans-serif', background: '#f8fafc' }}>
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😕</div>
        <h2 style={{ color: '#1e0646', marginBottom: '0.5rem' }}>Resource Not Found</h2>
        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>This resource may not be published or may no longer exist.</p>
        <Link to="/learn" style={{ background: '#7c3aed', color: 'white', textDecoration: 'none', padding: '0.75rem 1.5rem', borderRadius: 8, fontWeight: 700 }}>← Back to Learning Hub</Link>
      </div>
    </div>
  )

  const typeInfo = getTypeInfo(resource.content_type)

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: '"DM Sans", system-ui, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=Playfair+Display:wght@700;900&display=swap');
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
        * { box-sizing: border-box; }
      `}</style>

      {/* ── STICKY HEADER ── */}
      <header style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '0.875rem 0', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
            <button onClick={() => navigate('/learn')} style={{ background: '#f5f3ff', border: '1px solid #ede9fe', color: '#7c3aed', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1rem' }}>←</button>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#1e0646', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{resource.title}</h1>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>{(resource.subjects as any)?.name || 'General'}{resource.topic ? ` · ${resource.topic}` : ''}</p>
            </div>
          </div>
          <span style={{ background: typeInfo.bg, color: typeInfo.color, padding: '0.3rem 0.75rem', borderRadius: 100, fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', flexShrink: 0 }}>
            {typeInfo.icon} {typeInfo.label}
          </span>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main style={{ maxWidth: 860, margin: '0 auto', padding: '2rem 1.5rem 6rem' }}>

        {/* Title block */}
        <div style={{ marginBottom: '2rem', animation: 'fadeUp 0.3s ease' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.875rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ background: typeInfo.bg, color: typeInfo.color, padding: '0.25rem 0.75rem', borderRadius: 100, fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>
              {typeInfo.icon} {typeInfo.label}
            </span>
            <span style={{ background: '#f5f3ff', color: '#7c3aed', padding: '0.25rem 0.75rem', borderRadius: 100, fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>
              {(resource.subjects as any)?.name || 'General'}
            </span>
            {resource.topic && <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>• {resource.topic}</span>}
          </div>
          <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: 900, color: '#1e0646', margin: '0 0 0.5rem', fontFamily: '"Playfair Display", serif', lineHeight: 1.25 }}>{resource.title}</h2>
        </div>

        {/* Description card */}
        {resource.description && (
          <div style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', borderRadius: 16, padding: '1.5rem', marginBottom: '2rem', border: '1px solid #c4b5fd', animation: 'fadeUp 0.35s ease' }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7c3aed', margin: '0 0 0.5rem' }}>📌 Overview</h3>
            <p style={{ margin: 0, color: '#4c1d95', lineHeight: 1.7, fontSize: '0.975rem' }}>{resource.description}</p>
          </div>
        )}

        {/* Content */}
        <div style={{ background: 'white', borderRadius: 20, padding: '2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0', animation: 'fadeUp 0.4s ease' }}>
          {renderResourceContent(resource)}

          {/* Inline Practice Quiz */}
          {resource.content_type === 'passage' && resource.quiz_questions && resource.quiz_questions.length > 0 && (
            <InlineMiniQuiz questions={resource.quiz_questions} />
          )}
        </div>

        {/* Footer CTA */}
        <div style={{ marginTop: '2rem', background: 'linear-gradient(135deg, #1e0646 0%, #3b0764 100%)', borderRadius: 16, padding: '1.75rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', animation: 'fadeUp 0.5s ease' }}>
          <div>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>ASOS Learning Hub</p>
            <p style={{ margin: 0, color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>Sign in to track your progress and access more resources</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/learn')} style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.25)', padding: '0.625rem 1.25rem', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>← More Resources</button>
            <Link to="/login" style={{ background: 'white', color: '#1e0646', textDecoration: 'none', padding: '0.625rem 1.25rem', borderRadius: 8, fontWeight: 800, fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center' }}>Sign In →</Link>
          </div>
        </div>
      </main>
    </div>
  )
}
