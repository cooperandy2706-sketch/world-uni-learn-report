import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import { generateQuizFromText } from '../../lib/groq'
import { parseDocumentToText } from '../../utils/pdfParser'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'

interface AIQuizGeneratorProps {
  open: boolean
  onClose: () => void
  initialText?: string
  subjectId?: string
  titlePrefix?: string
  onQuizCreated?: () => void
}

function Btn({ children, onClick, variant = 'primary', type = 'button', disabled, loading, style }: any) {
  const [hov, setHov] = useState(false)
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '9px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600,
    border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s', opacity: disabled ? 0.6 : 1,
    fontFamily: '"DM Sans",sans-serif',
    ...style,
  }
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: hov ? '#5b21b6' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', boxShadow: '0 2px 8px rgba(109,40,217,0.28)' },
    secondary: { background: hov ? '#f5f3ff' : '#fff', color: '#374151', border: '1.5px solid #e5e7eb' },
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ ...base, ...variants[variant] }}>
      {loading && <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: '_spin 0.7s linear infinite', flexShrink: 0 }} />}
      {children}
    </button>
  )
}

export default function AIQuizGenerator({ open, onClose, initialText = '', subjectId, titlePrefix = '', onQuizCreated }: AIQuizGeneratorProps) {
  const { user } = useAuth()
  const [text, setText] = useState(initialText)
  const [questionCount, setQuestionCount] = useState<number>(10)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isParsing, setIsParsing] = useState(false)

  useEffect(() => {
    if (open) setText(initialText)
  }, [open, initialText])

  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIsParsing(true)
    try {
      const extracted = await parseDocumentToText(file)
      if (!extracted.trim()) {
        toast.error("No readable text found. This PDF might be a scanned image.")
      } else {
        setText(prev => prev + (prev ? '\n\n' : '') + extracted)
        toast.success('PDF text extracted successfully!')
      }
    } catch (err: any) {
      toast.error('Failed to parse PDF: ' + err.message)
    } finally {
      setIsParsing(false)
      e.target.value = '' // reset
    }
  }

  async function handleGenerate() {
    if (!text.trim()) {
      toast.error('Please provide some source text or upload a PDF.')
      return
    }
    
    setIsGenerating(true)
    try {
      toast.loading('Analyzing text & generating quiz...', { id: 'ai-quiz' })
      const aiResult = await generateQuizFromText(text, questionCount)
      
      const mappedQuestions = aiResult.questions.map((q: any) => ({
        id: Math.random().toString(36).slice(2, 9),
        text: q.text,
        type: 'mcq',
        options: q.options,
        correctAnswer: q.correctAnswer,
        points: q.points || 1
      }))

      const payload = {
        title: titlePrefix ? `${titlePrefix} - Quiz` : aiResult.title || 'AI Generated Quiz',
        description: aiResult.description || 'Generated automatically by AI',
        subject_id: subjectId || null,
        duration_minutes: 0,
        shuffle_questions: true,
        is_published: false,
        content: { questions: mappedQuestions },
        school_id: user?.school_id || null
      }

      const { error } = await supabase.from('global_quizzes').insert(payload)
      if (error) throw error

      toast.success(`Generated ${mappedQuestions.length} questions and saved to Global Quizzes!`, { id: 'ai-quiz' })
      if (onQuizCreated) onQuizCreated()
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Generation failed', { id: 'ai-quiz' })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="✨ Generate Quiz with AI"
      subtitle="Powered by Groq"
      size="md"
      footer={<>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn onClick={handleGenerate} loading={isGenerating} disabled={isParsing}>Generate & Save to Quizzes</Btn>
      </>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontFamily: '"DM Sans",sans-serif' }}>
        <div style={{ background: '#f5f3ff', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #ede9fe' }}>
          <p style={{ fontSize: 13, color: '#6d28d9', margin: 0, fontWeight: 500, lineHeight: 1.5 }}>
            Groq will analyze your text and automatically build a structured multiple-choice quiz. It will be saved as a draft in Global Quizzes.
          </p>
        </div>

        <div className="field-group">
          <label style={{ fontSize: 12, fontWeight: 700, color: '#4b5563', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
            <span>Source Text *</span>
            <label style={{ color: '#7c3aed', cursor: 'pointer' }}>
              📁 Extract from PDF
              <input type="file" accept="application/pdf" style={{ display: 'none' }} onChange={handlePdfUpload} disabled={isParsing} />
            </label>
          </label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Paste syllabus, notes, or chapter text here..."
            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', height: 180, resize: 'vertical', boxSizing: 'border-box' }}
            disabled={isParsing || isGenerating}
          />
          {isParsing && <p style={{ fontSize: 11, color: '#f59e0b', marginTop: 4 }}>Extracting text from PDF...</p>}
        </div>

        <div className="field-group">
          <label style={{ fontSize: 12, fontWeight: 700, color: '#4b5563', marginBottom: 6, display: 'block' }}>Number of Questions</label>
          <input
            type="number"
            value={questionCount}
            onChange={e => setQuestionCount(parseInt(e.target.value) || 10)}
            min={1}
            max={50}
            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
            disabled={isGenerating}
          />
        </div>
      </div>
    </Modal>
  )
}
