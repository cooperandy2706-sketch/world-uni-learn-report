import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

/* ─── Utility: Normalize quiz question to a guest-compatible shape ─── */
function normalizeQuestion(q: any): { id: string; questionText: string; options: { id: string; text: string }[]; correctOption: string; points: number } {
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

function getSubjectIcon(name: string) {
  const n = name.toLowerCase()
  if (n.includes('math')) return '📐'
  if (n.includes('science') || n.includes('chemistry') || n.includes('physics')) return '🔬'
  if (n.includes('cod') || n.includes('ict') || n.includes('comput')) return '💻'
  if (n.includes('animal') || n.includes('lion') || n.includes('tiger')) return '🦁'
  if (n.includes('space') || n.includes('astronom') || n.includes('planet')) return '🚀'
  if (n.includes('histor') || n.includes('roman') || n.includes('egypt')) return '🏛️'
  if (n.includes('environment') || n.includes('earth') || n.includes('world') || n.includes('social')) return '🌍'
  if (n.includes('english') || n.includes('reading') || n.includes('writing') || n.includes('language')) return '📝'
  if (n.includes('rme') || n.includes('religio') || n.includes('moral')) return '🕊️'
  if (n.includes('art') || n.includes('design')) return '🎨'
  return '📚'
}

/* ─── Inline mini-quiz for resource modal ─── */
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
              {q.options.map(opt => {
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
          <button
            onClick={handleSubmit}
            disabled={Object.keys(answers).length === 0}
            style={{ background: Object.keys(answers).length > 0 ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : '#cbd5e1', color: 'white', border: 'none', padding: '0.75rem 2rem', borderRadius: 10, fontWeight: 800, fontSize: '0.95rem', cursor: Object.keys(answers).length > 0 ? 'pointer' : 'not-allowed', boxShadow: Object.keys(answers).length > 0 ? '0 4px 15px rgba(109,40,217,0.3)' : 'none' }}>
            Submit Answers
          </button>
        </div>
      )}
    </div>
  )
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
        .styled-content .check-understanding { background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); border-radius: 16px; padding: 1.5rem; margin: 2rem 0; border: 2px solid #c4b5fd; }
        .styled-content .check-understanding h3 { color: #5b21b6; }
      `}</style>
      <div className="styled-content" dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }} />
    </div>
  )
}

/* ─── Simple Markdown → HTML converter (handles the most common patterns) ─── */
function markdownToHtml(md: string): string {
  if (!md) return ''
  let html = md
    // Headings
    .replace(/^#{6}\s(.+)$/gm, '<h6>$1</h6>')
    .replace(/^#{5}\s(.+)$/gm, '<h5>$1</h5>')
    .replace(/^#{4}\s(.+)$/gm, '<h4>$1</h4>')
    .replace(/^#{3}\s(.+)$/gm, '<h3>$1</h3>')
    .replace(/^#{2}\s(.+)$/gm, '<h2>$1</h2>')
    .replace(/^#{1}\s(.+)$/gm, '<h1>$1</h1>')
    // Bold & italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Images before links so they get priority
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy" />')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // Blockquotes
    .replace(/^>\s(.+)$/gm, '<blockquote>$1</blockquote>')
    // HR
    .replace(/^---$/gm, '<hr>')
    // Unordered lists
    .replace(/^\s*[-*+]\s(.+)$/gm, '<li>$1</li>')
    // Ordered lists
    .replace(/^\s*\d+\.\s(.+)$/gm, '<li>$1</li>')
    // Wrap consecutive <li> in <ul>
    .replace(/(<li>[\s\S]*?<\/li>)(\n<li>|$)/g, (match) => match)

  // Wrap <li> sequences in <ul>
  html = html.replace(/((<li>[^]*?<\/li>\n?)+)/g, '<ul>$1</ul>')

  // Paragraphs: lines not starting with HTML tags
  const lines = html.split('\n')
  const processedLines: string[] = []
  let inBlock = false
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
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 12 }}>
          <iframe src={`https://www.youtube.com/embed/${videoId}`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        </div>
      )
    }
    return <video controls style={{ width: '100%', borderRadius: 12, outline: 'none' }}><source src={resource.content} />Your browser does not support the video tag.</video>
  }

  if (resource.content_type === 'pdf') {
    return <div style={{ height: '70vh', width: '100%', borderRadius: 12, overflow: 'hidden' }}><iframe src={resource.content} style={{ width: '100%', height: '100%', border: 'none' }} title={resource.title} /></div>
  }

  if (resource.content_type === 'google_doc') {
    return <div style={{ height: '70vh', width: '100%', borderRadius: 12, overflow: 'hidden' }}><iframe src={resource.content} style={{ width: '100%', height: '100%', border: 'none' }} title={resource.title} /></div>
  }

  if (resource.content_type === 'link') {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔗</div>
        <p style={{ color: '#64748b', marginBottom: '1rem' }}>This resource links to an external page.</p>
        <a href={resource.content} target="_blank" rel="noopener noreferrer" style={{ background: '#7c3aed', color: 'white', textDecoration: 'none', padding: '0.75rem 1.5rem', borderRadius: 10, fontWeight: 700, display: 'inline-block' }}>Open Resource →</a>
      </div>
    )
  }

  // Default: passage (Markdown/HTML content)
  return <StyledMarkdownContent content={resource.content} />
}

/* ─── Content type icon + label helper ─── */
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

/* ─── Main Component ─── */
export default function GuestLearnHub() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'quizzes' | 'resources'>('quizzes')
  const [selectedResource, setSelectedResource] = useState<any | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const { data: quizzes, isLoading: loadingQuizzes } = useQuery({
    queryKey: ['public-global-quizzes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('global_quizzes')
        .select(`id, title, description, duration_minutes, content, subject_id, subjects ( name, code )`)
        .is('school_id', null)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    }
  })

  const { data: resources, isLoading: loadingResources } = useQuery({
    queryKey: ['public-global-resources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('global_resources')
        .select(`id, title, description, content_type, content, cover_image_url, topic, subject_id, subjects ( name, code )`)
        .is('school_id', null)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    }
  })

  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null)

  const allSubjectsMap = new Map<string, { id: string, name: string, code?: string, resourceCount: number, quizCount: number }>()
  
  if (resources) {
    resources.forEach(r => {
      if (r.subject_id) {
        if (!allSubjectsMap.has(r.subject_id)) {
          allSubjectsMap.set(r.subject_id, { id: r.subject_id, name: (r.subjects as any)?.name || 'Unknown', code: (r.subjects as any)?.code, resourceCount: 0, quizCount: 0 })
        }
        allSubjectsMap.get(r.subject_id)!.resourceCount++
      }
    })
  }
  
  if (quizzes) {
    quizzes.forEach(q => {
      if (q.subject_id) {
        if (!allSubjectsMap.has(q.subject_id)) {
          allSubjectsMap.set(q.subject_id, { id: q.subject_id, name: (q.subjects as any)?.name || 'Unknown', code: (q.subjects as any)?.code, resourceCount: 0, quizCount: 0 })
        }
        allSubjectsMap.get(q.subject_id)!.quizCount++
      }
    })
  }

  const allSubjects = Array.from(allSubjectsMap.values()).sort((a, b) => a.name.localeCompare(b.name))

  // Detect grade subjects: named "G1 – ...", "G2 – ...", etc.
  const gradeSubjectRegex = /^G(\d+)\s*[–-]\s*(.+)$/
  const gradeMap = new Map<string, { label: string, gradeNum: number, subjects: typeof allSubjects }>()
  const GRADE_LABELS: Record<number, string> = {
    1: 'Grade 1 (Basic 1)', 2: 'Grade 2 (Basic 2)', 3: 'Grade 3 (Basic 3)',
    4: 'Grade 4 (Basic 4)', 5: 'Grade 5 (Basic 5)', 6: 'Grade 6 (Basic 6)',
    7: 'Grade 7 (JHS 1)', 8: 'Grade 8 (JHS 2)', 9: 'Grade 9 (JHS 3)'
  }

  allSubjects.forEach(sub => {
    const match = sub.name.match(gradeSubjectRegex)
    if (match) {
      const gradeNum = parseInt(match[1])
      const key = `grade_${gradeNum}`
      if (!gradeMap.has(key)) {
        gradeMap.set(key, { label: GRADE_LABELS[gradeNum] || `Grade ${gradeNum}`, gradeNum, subjects: [] })
      }
      gradeMap.get(key)!.subjects.push(sub)
    }
  })
  const sortedGrades = Array.from(gradeMap.entries()).sort((a, b) => a[1].gradeNum - b[1].gradeNum)
  const hasGrades = sortedGrades.length > 0
  const selectedGradeData = selectedGrade ? gradeMap.get(selectedGrade) : null

  // Non-grade subjects
  const regularSubjects = allSubjects.filter(s => !s.name.match(gradeSubjectRegex) && !s.name.toUpperCase().startsWith('GES'))
  const gesSubjects = allSubjects.filter(s => !s.name.match(gradeSubjectRegex) && s.name.toUpperCase().startsWith('GES'))

  const subjectResources = resources?.filter(r => r.subject_id === selectedSubjectId) || []
  const subjectQuizzes = quizzes?.filter(q => q.subject_id === selectedSubjectId) || []
  
  const topicsMap = new Map<string, number>()
  subjectResources.forEach(r => {
    const topicName = r.topic?.trim() || 'General'
    topicsMap.set(topicName, (topicsMap.get(topicName) || 0) + 1)
  })
  const subjectTopics = Array.from(topicsMap.entries()).sort((a, b) => a[0].localeCompare(b[0]))

  const isSearching = searchTerm.trim().length > 0
  const searchResultsResources = resources?.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.description?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.topic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.subjects as any)?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []
  const searchResultsQuizzes = quizzes?.filter(q => 
    q.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    q.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (q.subjects as any)?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const renderQuizCard = (quiz: any, i: number) => {
    const qCount = (quiz.content as any)?.questions?.length || 0
    return (
      <div key={quiz.id} className="hub-card" style={{ background: 'white', borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', animation: `fadeUp 0.3s ease ${i * 0.05}s both` }}>
        <div style={{ height: 5, background: 'linear-gradient(90deg, #1e0646, #7c3aed, #a855f7)' }} />
        <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.875rem', gap: '0.5rem' }}>
            <span style={{ background: '#f5f3ff', color: '#7c3aed', padding: '0.25rem 0.75rem', borderRadius: 100, fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>
              📝 Quiz
            </span>
            {quiz.duration_minutes > 0 && (
              <span style={{ fontSize: '0.78rem', color: '#f59e0b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3, background: '#fffbeb', padding: '0.2rem 0.5rem', borderRadius: 100 }}>
                ⏱ {quiz.duration_minutes}m
              </span>
            )}
          </div>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e0646', marginBottom: '0.5rem', lineHeight: 1.35 }}>{quiz.title}</h4>
          <p style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.55, marginBottom: '0.875rem', flex: 1 }}>{quiz.description || 'Test your knowledge with this interactive quiz.'}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, background: '#f8fafc', padding: '0.2rem 0.625rem', borderRadius: 100, border: '1px solid #e2e8f0' }}>
              {qCount > 0 ? `${qCount} question${qCount !== 1 ? 's' : ''}` : 'Questions inside'}
            </span>
          </div>
          <button onClick={() => navigate(`/learn/quiz/${quiz.id}`)}
            style={{ width: '100%', background: 'linear-gradient(135deg, #1e0646, #3b0764)', color: 'white', border: 'none', padding: '0.875rem', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem', letterSpacing: '0.02em' }}>
            Start Quiz →
          </button>
        </div>
      </div>
    )
  }

  const renderResourceCard = (res: any, i: number) => {
    const typeInfo = getTypeInfo(res.content_type)
    return (
      <div key={res.id} className="hub-card" style={{ background: 'white', borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', animation: `fadeUp 0.3s ease ${i * 0.05}s both` }}>
        {res.cover_image_url ? (
          <div style={{ height: 172, background: `url(${res.cover_image_url}) center/cover`, position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.5))' }} />
            <div style={{ position: 'absolute', bottom: 10, left: 12 }}>
              <span style={{ background: typeInfo.bg, color: typeInfo.color, padding: '0.2rem 0.6rem', borderRadius: 100, fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase' }}>{typeInfo.icon} {typeInfo.label}</span>
            </div>
          </div>
        ) : (
          <div style={{ height: 130, background: `linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '2.5rem' }}>{typeInfo.icon}</span>
            <span style={{ background: typeInfo.bg, color: typeInfo.color, padding: '0.2rem 0.6rem', borderRadius: 100, fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase' }}>{typeInfo.label}</span>
          </div>
        )}
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            {res.topic && <span style={{ background: '#f8fafc', color: '#64748b', padding: '0.2rem 0.6rem', borderRadius: 100, fontSize: '0.72rem', fontWeight: 700, border: '1px solid #e2e8f0' }}>{res.topic}</span>}
          </div>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e0646', marginBottom: '0.4rem', lineHeight: 1.35 }}>{res.title}</h4>
          <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.55, marginBottom: '1.25rem', flex: 1 }}>{res.description || 'Explore this study material to learn more.'}</p>
          <button onClick={() => setSelectedResource(res)}
            style={{ width: '100%', background: '#f5f3ff', color: '#7c3aed', border: '1.5px solid #ede9fe', padding: '0.75rem', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontSize: '0.875rem', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#ede9fe'; e.currentTarget.style.color = '#5b21b6' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#f5f3ff'; e.currentTarget.style.color = '#7c3aed' }}>
            Read Material →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: '"DM Sans", system-ui, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=Playfair+Display:wght@700;900&display=swap');
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes shimmer { 0% { background-position:-200% 0 } 100% { background-position:200% 0 } }
        * { box-sizing: border-box; }
        .hub-card { transition: transform 0.2s, box-shadow 0.2s !important; cursor: pointer; }
        .hub-card:hover { transform: translateY(-4px) !important; box-shadow: 0 12px 32px rgba(0,0,0,0.14) !important; }
        .topic-row { transition: background 0.15s; cursor: pointer; }
        .topic-row:hover { background: #f8fafc !important; }
        .skeleton { background: linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:16px; }
        .hub-subject-grid { display:grid; grid-template-columns:1fr; gap:0.875rem; }
        .hub-card-grid    { display:grid; grid-template-columns:1fr; gap:1rem; }
        .hub-hero-section { padding:2rem 1rem 3rem; }
        .hub-main         { padding:1.25rem 1rem 5rem; max-width:1200px; margin:0 auto; }
        .hub-page-h2      { font-size:1.4rem !important; }
        .modal-wrap       { align-items:flex-end !important; }
        .modal-inner      { border-radius:16px 16px 0 0 !important; max-height:95vh !important; width:100% !important; max-width:100% !important; margin-top:auto; }
        @media(min-width:480px){
          .hub-subject-grid { grid-template-columns:1fr 1fr; gap:1rem; }
          .hub-card-grid    { grid-template-columns:1fr 1fr; }
        }
        @media(min-width:768px){
          .hub-hero-section { padding:4rem 1.5rem 6rem; }
          .hub-main         { padding:2rem 1.5rem 6rem; }
          .hub-page-h2      { font-size:2rem !important; }
          .modal-wrap       { align-items:center !important; }
          .modal-inner      { border-radius:20px !important; max-height:92vh !important; max-width:860px !important; margin:auto !important; }
        }
        @media(min-width:1024px){
          .hub-subject-grid { grid-template-columns:repeat(3,1fr); gap:1.25rem; }
          .hub-card-grid    { grid-template-columns:repeat(3,1fr); gap:1.25rem; }
        }
      `}</style>

      {/* ── HEADER ── */}
      <header style={{ background: 'linear-gradient(135deg, #1e0646 0%, #2d0a6e 100%)', color: 'white', padding: '1rem 0', boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', width: 38, height: 38, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', transition: 'all 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.22)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}>←</button>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>ASOS Learning Hub</h1>
              <p style={{ fontSize: '0.75rem', margin: 0, color: 'rgba(255,255,255,0.65)' }}>Free educational resources for everyone</p>
            </div>
          </div>
          <Link to="/login" style={{ color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: '0.875rem', background: 'rgba(255,255,255,0.15)', padding: '0.5rem 1.25rem', borderRadius: 100, border: '1px solid rgba(255,255,255,0.2)', transition: 'all 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}>
            Sign In →
          </Link>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className='hub-hero-section' style={{ background: 'linear-gradient(135deg, #1e0646 0%, #3b0764 60%, #5b21b6 100%)', color: 'white', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(109,40,217,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(167,139,250,0.2) 0%, transparent 50%)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.12)', padding: '0.4rem 1rem', borderRadius: 100, fontSize: '0.8rem', fontWeight: 700, marginBottom: '1.25rem', border: '1px solid rgba(255,255,255,0.2)', letterSpacing: '0.05em' }}>✨ FREE &amp; OPEN ACCESS</div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 5vw, 3rem)', fontWeight: 900, marginBottom: '1rem', fontFamily: '"Playfair Display", serif', lineHeight: 1.2 }}>
            Learn Anything,<br />Anytime, for Free
          </h2>
          <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.8)', maxWidth: 560, margin: '0 auto 2rem', lineHeight: 1.7 }}>
            Access high-quality quizzes and study materials curated by experts. Practice your skills and learn something new.
          </p>
          {/* Search Bar */}
          <div style={{ maxWidth: 500, margin: '0 auto', position: 'relative' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search quizzes or study materials..."
              style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', borderRadius: 50, border: 'none', fontSize: '0.95rem', fontFamily: '"DM Sans", sans-serif', outline: 'none', boxSizing: 'border-box', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
            />
            <span style={{ position: 'absolute', left: '1.1rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem' }}>🔍</span>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1rem 1.5rem', display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { label: 'Practice Quizzes', value: quizzes?.length || 0, icon: '📝' },
            { label: 'Study Materials', value: resources?.length || 0, icon: '📚' },
            { label: 'Always Free', value: '100%', icon: '🆓' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem' }}>{s.icon}</span>
              <span style={{ fontWeight: 900, color: '#1e0646', fontSize: '1.1rem' }}>{s.value}</span>
              <span style={{ color: '#64748b', fontSize: '0.875rem' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>


      {/* ── CONTENT ── */}
      <main className='hub-main'>

        {/* ── WAEC EXAM HUB BANNER ── */}
        <a href="/learn/waec" style={{ textDecoration: 'none', display: 'block', marginBottom: '2rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #1e0646 0%, #3730a3 60%, #7c3aed 100%)', borderRadius: 20, padding: '2rem', position: 'relative', overflow: 'hidden', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.95')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
            <div style={{ position: 'absolute', right: -20, top: -20, width: 180, height: 180, background: 'rgba(255,255,255,0.04)', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', right: 30, bottom: -30, width: 120, height: 120, background: 'rgba(255,255,255,0.03)', borderRadius: '50%' }} />
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', padding: '0.3rem 0.875rem', borderRadius: 20, fontSize: '0.75rem', color: 'white', fontWeight: 700, marginBottom: '0.875rem', backdropFilter: 'blur(10px)' }}>
                  🎓 NEW — BECE & WAEC Standard
                </div>
                <h3 style={{ color: 'white', margin: '0 0 0.5rem', fontSize: '1.5rem', fontWeight: 900, fontFamily: '"Playfair Display", serif' }}>
                  Timed Exam Hub
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0, fontSize: '0.95rem', maxWidth: 480, lineHeight: 1.6 }}>
                  Practice with authentic WAEC-style timed mock exams — 40 objectives + 5-from-7 essay questions. Basic 1 to Basic 9 (BECE).
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {[
                    { label: 'Class Levels', val: '9' },
                    { label: 'Subjects', val: '8+' },
                    { label: 'Questions/Exam', val: '47' },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.1)', padding: '0.5rem 0.75rem', borderRadius: 10 }}>
                      <p style={{ margin: 0, color: 'white', fontSize: '1.25rem', fontWeight: 900 }}>{s.val}</p>
                      <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '0.65rem', fontWeight: 700 }}>{s.label}</p>
                    </div>
                  ))}
                </div>
                <div style={{ background: 'white', color: '#1e0646', padding: '0.625rem 1.5rem', borderRadius: 10, fontWeight: 800, fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                  Start an Exam →
                </div>
              </div>
            </div>
          </div>
        </a>

        {isSearching ? (
          // SEARCH RESULTS VIEW
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e0646', marginBottom: '1.5rem' }}>
              Search Results for "{searchTerm}"
            </h3>
            
            {searchResultsQuizzes.length === 0 && searchResultsResources.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: 16, border: '1px dashed #cbd5e1' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                <h4 style={{ fontSize: '1.1rem', color: '#1e0646', marginBottom: '0.5rem' }}>No results found</h4>
                <button onClick={() => setSearchTerm('')} style={{ marginTop: '1rem', background: '#7c3aed', color: 'white', border: 'none', padding: '0.6rem 1.25rem', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Clear Search</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {searchResultsResources.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#475569', marginBottom: '1rem' }}>📚 Study Materials ({searchResultsResources.length})</h4>
                    <div className='hub-card-grid'>
                      {searchResultsResources.map((res, i) => renderResourceCard(res, i))}
                    </div>
                  </div>
                )}
                {searchResultsQuizzes.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#475569', marginBottom: '1rem' }}>📝 Quizzes ({searchResultsQuizzes.length})</h4>
                    <div className='hub-card-grid'>
                      {searchResultsQuizzes.map((quiz, i) => renderQuizCard(quiz, i))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : !selectedSubjectId && !selectedGrade ? (
          // LEVEL 1: MAIN HUB – Grade Cards + Regular subjects
          <div>
            {loadingResources || loadingQuizzes ? (
              <div className='hub-subject-grid'>
                {[1, 2, 3, 4].map(i => <div key={i} style={{ background: 'white', borderRadius: 16, height: 120, animation: `fadeUp 0.4s ease ${i * 0.1}s both` }} />)}
              </div>
            ) : allSubjects.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: 16, border: '1px dashed #cbd5e1' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                <h4 style={{ fontSize: '1.2rem', color: '#1e0646', marginBottom: '0.5rem' }}>No subjects available</h4>
                <p style={{ color: '#64748b' }}>Check back later for new learning materials.</p>
              </div>
            ) : (
              <div>
                {/* GES GRADE NAVIGATION */}
                {hasGrades && (
                  <div style={{ marginBottom: '3rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e0646', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>🇬🇭</span> GES Curriculum by Grade
                    </h3>
                    <div className='hub-subject-grid'>
                      {sortedGrades.map(([key, grade], i) => {
                        const totalRes = grade.subjects.reduce((s, sub) => s + sub.resourceCount, 0)
                        const totalQ = grade.subjects.reduce((s, sub) => s + sub.quizCount, 0)
                        const gradeColors = [
                          ['#fef3c7','#fde68a','#d97706'], ['#dcfce7','#bbf7d0','#16a34a'],
                          ['#dbeafe','#bfdbfe','#2563eb'], ['#fce7f3','#fbcfe8','#be185d'],
                          ['#ede9fe','#ddd6fe','#7c3aed'], ['#fff7ed','#fed7aa','#ea580c'],
                          ['#ecfdf5','#a7f3d0','#059669'], ['#f0f9ff','#bae6fd','#0284c7'],
                          ['#fdf4ff','#f5d0fe','#a21caf']
                        ]
                        const [bg1, bg2, col] = gradeColors[i % gradeColors.length]
                        const gradeIcons = ['🌱','🌿','🌳','📗','📘','📙','📕','🏫','🎓']
                        return (
                          <div key={key} onClick={() => setSelectedGrade(key)} className="hub-card"
                            style={{ background: 'white', borderRadius: 16, padding: '1.5rem', border: `1px solid ${bg2}`, display: 'flex', alignItems: 'center', gap: '1.25rem', animation: `fadeUp 0.3s ease ${i * 0.05}s both`, cursor: 'pointer' }}>
                            <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg, ${bg1}, ${bg2})`, color: col, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.7rem', flexShrink: 0 }}>
                              {gradeIcons[i % gradeIcons.length]}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#1e0646', margin: '0 0 0.25rem' }}>{grade.label}</h4>
                              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0, display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <span>{grade.subjects.length} Subjects</span>
                                {totalRes > 0 && <><span>•</span><span>{totalRes} Materials</span></>}
                                {totalQ > 0 && <><span>•</span><span>{totalQ} Quizzes</span></>}
                              </p>
                            </div>
                            <div style={{ color: '#cbd5e1', fontSize: '1.25rem' }}>→</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* REGULAR SUBJECTS */}
                {regularSubjects.length > 0 && (
                  <div style={{ marginBottom: '3rem', paddingTop: hasGrades ? '1rem' : 0, borderTop: hasGrades ? '2px dashed #e2e8f0' : 'none' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e0646', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>🌍</span> General Subjects
                    </h3>
                    <div className='hub-subject-grid'>
                      {regularSubjects.map((sub, i) => (
                        <div key={sub.id} onClick={() => setSelectedSubjectId(sub.id)} className="hub-card" 
                          style={{ background: 'white', borderRadius: 16, padding: '1.5rem', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1.25rem', animation: `fadeUp 0.3s ease ${i * 0.05}s both`, cursor: 'pointer' }}>
                          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                            {getSubjectIcon(sub.name)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e0646', margin: '0 0 0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub.name}</h4>
                            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              {sub.resourceCount > 0 && <span>{sub.resourceCount} Material{sub.resourceCount !== 1 ? 's' : ''}</span>}
                              {sub.resourceCount > 0 && sub.quizCount > 0 && <span>•</span>}
                              {sub.quizCount > 0 && <span>{sub.quizCount} Quiz{sub.quizCount !== 1 ? 'zes' : ''}</span>}
                            </p>
                          </div>
                          <div style={{ color: '#cbd5e1', fontSize: '1.25rem' }}>→</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* GES OLD FLAT SUBJECTS */}
                {gesSubjects.length > 0 && (
                  <div style={{ paddingTop: '1rem', borderTop: '2px dashed #e2e8f0' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e0646', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>📚</span> Other GES Subjects
                    </h3>
                    <div className='hub-subject-grid'>
                      {gesSubjects.map((sub, i) => (
                        <div key={sub.id} onClick={() => setSelectedSubjectId(sub.id)} className="hub-card" 
                          style={{ background: 'white', borderRadius: 16, padding: '1.5rem', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1.25rem', animation: `fadeUp 0.3s ease ${i * 0.05}s both`, cursor: 'pointer' }}>
                          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #fef3c7, #fde68a)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                            {getSubjectIcon(sub.name)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e0646', margin: '0 0 0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub.name}</h4>
                            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              {sub.resourceCount > 0 && <span>{sub.resourceCount} Material{sub.resourceCount !== 1 ? 's' : ''}</span>}
                              {sub.resourceCount > 0 && sub.quizCount > 0 && <span>•</span>}
                              {sub.quizCount > 0 && <span>{sub.quizCount} Quiz{sub.quizCount !== 1 ? 'zes' : ''}</span>}
                            </p>
                          </div>
                          <div style={{ color: '#cbd5e1', fontSize: '1.25rem' }}>→</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        ) : !selectedSubjectId && selectedGrade ? (
          // LEVEL 2: GRADE SUBJECTS LIST
          <div style={{ animation: 'fadeUp 0.3s ease' }}>
            <button onClick={() => setSelectedGrade(null)} 
              style={{ background: 'white', border: '1px solid #e2e8f0', color: '#475569', padding: '0.5rem 1rem', borderRadius: 100, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', marginBottom: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              ← All Grades
            </button>
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1e0646', margin: '0 0 0.35rem', fontFamily: '"Playfair Display", serif' }}>
                🇬🇭 {selectedGradeData?.label}
              </h2>
              <p style={{ color: '#64748b', fontSize: '1rem', margin: 0 }}>Select a subject to explore topics and quizzes.</p>
            </div>
            <div className='hub-subject-grid'>
              {(selectedGradeData?.subjects || []).map((sub, i) => {
                const shortName = sub.name.replace(/^G\d+\s*[–-]\s*/, '')
                return (
                  <div key={sub.id} onClick={() => setSelectedSubjectId(sub.id)} className="hub-card"
                    style={{ background: 'white', borderRadius: 16, padding: '1.5rem', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1.25rem', animation: `fadeUp 0.3s ease ${i * 0.05}s both`, cursor: 'pointer' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                      {getSubjectIcon(shortName)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e0646', margin: '0 0 0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shortName}</h4>
                      <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0, display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {sub.resourceCount > 0 && <span>{sub.resourceCount} Material{sub.resourceCount !== 1 ? 's' : ''}</span>}
                        {sub.resourceCount > 0 && sub.quizCount > 0 && <span>•</span>}
                        {sub.quizCount > 0 && <span>{sub.quizCount} Quiz{sub.quizCount !== 1 ? 'zes' : ''}</span>}
                      </p>
                    </div>
                    <div style={{ color: '#cbd5e1', fontSize: '1.25rem' }}>→</div>
                  </div>
                )
              })}
            </div>
          </div>

        ) : !selectedTopic ? (
          // LEVEL 3: TOPICS & QUIZZES (Inside a Subject)
          <div style={{ animation: 'fadeUp 0.3s ease' }}>
            <button onClick={() => { setSelectedSubjectId(null) }} 
              style={{ background: 'white', border: '1px solid #e2e8f0', color: '#475569', padding: '0.5rem 1rem', borderRadius: 100, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', marginBottom: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              ← Back
            </button>
            
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#1e0646', margin: '0 0 0.5rem', fontFamily: '"Playfair Display", serif' }}>
                {allSubjectsMap.get(selectedSubjectId!)?.name?.replace(/^G\d+\s*[–-]\s*/, '')}
              </h2>
              <p style={{ color: '#64748b', fontSize: '1rem', margin: 0 }}>Select a topic to start learning.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* TOPICS LIST */}
              {subjectTopics.length > 0 && (
                <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                  {subjectTopics.map(([topicName, count], idx) => (
                    <div key={topicName} onClick={() => setSelectedTopic(topicName)} className="topic-row"
                      style={{ padding: '1.25rem 1.5rem', borderBottom: idx < subjectTopics.length - 1 ? '1px solid #f1f5f9' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>📖</div>
                        <div>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.15rem' }}>{topicName}</h4>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{count} Material{count !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '1.25rem' }}>→</div>
                    </div>
                  ))}
                </div>
              )}

              {/* SUBJECT QUIZZES */}
              {subjectQuizzes.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e0646', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ background: '#fef3c7', padding: '0.2rem', borderRadius: 6 }}>🎯</span> Subject Quizzes
                  </h3>
                  <div className='hub-card-grid'>
                    {subjectQuizzes.map((quiz, i) => renderQuizCard(quiz, i))}
                  </div>
                </div>
              )}

              {subjectTopics.length === 0 && subjectQuizzes.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                  No materials found for this subject.
                </div>
              )}
            </div>
          </div>
        ) : (
          // LEVEL 3: RESOURCES (Inside a Topic)
          <div style={{ animation: 'fadeUp 0.3s ease' }}>
            <button onClick={() => setSelectedTopic(null)} 
              style={{ background: 'white', border: '1px solid #e2e8f0', color: '#475569', padding: '0.5rem 1rem', borderRadius: 100, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', marginBottom: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              ← Back to Topics
            </button>
            
            <div style={{ marginBottom: '2rem' }}>
              <span style={{ color: '#7c3aed', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', display: 'block' }}>
                {allSubjectsMap.get(selectedSubjectId)?.name}
              </span>
              <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#1e0646', margin: '0', fontFamily: '"Playfair Display", serif' }}>
                {selectedTopic}
              </h2>
            </div>

            <div className='hub-card-grid'>
              {subjectResources.filter(r => (r.topic?.trim() || 'General') === selectedTopic).map((res, i) => renderResourceCard(res, i))}
            </div>
          </div>
        )}
      </main>

      {/* ── RESOURCE MODAL ── */}
      {selectedResource && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', justifyContent: 'center', padding: '0' }}
          className='modal-wrap' onClick={e => { if (e.target === e.currentTarget) setSelectedResource(null) }}>
          <div className='modal-inner' style={{ background: 'white', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 64px -12px rgba(0,0,0,0.4)', animation: 'fadeUp 0.25s ease' }}>

            {/* Modal Header */}
            <div style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'white', flexShrink: 0, gap: '1rem' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.375rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ background: getTypeInfo(selectedResource.content_type).bg, color: getTypeInfo(selectedResource.content_type).color, padding: '0.2rem 0.6rem', borderRadius: 100, fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase' }}>
                    {getTypeInfo(selectedResource.content_type).icon} {selectedResource.content_type.replace('_', ' ')}
                  </span>
                  <span style={{ background: '#f5f3ff', color: '#7c3aed', padding: '0.2rem 0.6rem', borderRadius: 100, fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase' }}>
                    {(selectedResource.subjects as any)?.name || 'General'}
                  </span>
                  {selectedResource.topic && <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>• {selectedResource.topic}</span>}
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1e0646', margin: 0, lineHeight: 1.35 }}>{selectedResource.title}</h3>
              </div>
              <button onClick={() => setSelectedResource(null)}
                style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#dc2626' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#475569' }}>
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.75rem 2rem', overflowY: 'auto', flex: 1 }}>
              {/* Description */}
              {selectedResource.description && (
                <div style={{ marginBottom: '1.75rem', padding: '1.25rem 1.5rem', background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', borderRadius: 14, border: '1px solid #c4b5fd' }}>
                  <h4 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7c3aed', margin: '0 0 0.375rem 0' }}>📌 Overview</h4>
                  <p style={{ margin: 0, color: '#4c1d95', lineHeight: 1.65, fontSize: '0.95rem' }}>{selectedResource.description}</p>
                </div>
              )}

              {/* Main content */}
              {renderResourceContent(selectedResource)}

              {/* Embedded Practice Quiz (if resource has linked_quiz_id or quiz content) */}
              {selectedResource.content_type === 'passage' && selectedResource.quiz_questions && selectedResource.quiz_questions.length > 0 && (
                <InlineMiniQuiz questions={selectedResource.quiz_questions} />
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '1rem 1.75rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>ASOS Learning Hub · Free Resource</span>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Link to="/login" style={{ background: '#1e0646', color: 'white', textDecoration: 'none', padding: '0.6rem 1.25rem', borderRadius: 8, fontWeight: 700, fontSize: '0.85rem' }}>
                  Sign In for More →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
