// src/pages/admin/AssessmentsPage.tsx
import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { useClasses } from '../../hooks/useClasses'
import { useCurrentTerm, useCurrentAcademicYear, useSettings } from '../../hooks/useSettings'
import { useSubjects } from '../../hooks/useSubjects'
import { useScoresByClassTerm, useBulkUpsertScores } from '../../hooks/useScores'
import { getGradeInfo } from '../../utils/grading'
import { ordinal } from '../../lib/utils'
import Modal from '../../components/ui/Modal'
import toast from 'react-hot-toast'
import { 
  Save, 
  Download, 
  FileSpreadsheet, 
  Settings as SettingsIcon, 
  ClipboardCheck, 
  Users, 
  BookOpen,
  Filter,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────
type AssessmentStyle = 'GES' | 'CAMBRIDGE' | 'BECE' | 'GENERAL'

interface ScoreEntry {
  class_score: string
  exam_score: string
  total_score: number
  remarks: string
  submitted: boolean
}

// ── Components ──────────────────────────────────────────────
const T = {
  primary: '#6d28d9',
  secondary: '#7c3aed',
  accent: '#fbbf24',
  success: '#16a34a',
  danger: '#dc2626',
  white: '#ffffff',
  slate: '#111827',
  muted: '#6b7280',
  border: '#f0eefe',
  bg: '#faf5ff',
}

function ScoreInput({ value, max, onChange, disabled }: any) {
  const [focused, setFocused] = useState(false)
  const num = parseFloat(value) || 0
  const isOver = num > max
  
  return (
    <div style={{ position: 'relative' }}>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={disabled}
        style={{
          width: 60,
          height: 34,
          textAlign: 'center',
          fontSize: 13,
          fontWeight: 700,
          borderRadius: 8,
          border: `1.5px solid ${isOver ? T.danger : focused ? T.primary : '#e5e7eb'}`,
          background: isOver ? '#fef2f2' : focused ? '#faf5ff' : '#fff',
          outline: 'none',
          transition: 'all 0.2s',
          color: isOver ? T.danger : T.slate
        }}
      />
      {isOver && (
        <div style={{ position: 'absolute', top: '100%', left: 0, fontSize: 9, color: T.danger, fontWeight: 700, marginTop: 2 }}>
          Max {max}
        </div>
      )}
    </div>
  )
}

export default function AssessmentsPage() {
  const { data: classes = [] } = useClasses()
  const { data: term } = useCurrentTerm()
  const { data: year } = useCurrentAcademicYear()
  const { data: settings } = useSettings()
  
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [style, setStyle] = useState<AssessmentStyle>('GES')
  const [scoreMap, setScoreMap] = useState<Record<string, ScoreEntry>>({})
  const [dirty, setDirty] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  
  // Weights based on style
  const weights = useMemo(() => {
    switch (style) {
      case 'GES': return { class: 50, exam: 50 }
      case 'BECE': return { class: 30, exam: 70 }
      case 'CAMBRIDGE': return { class: 40, exam: 60 }
      default: return { class: 50, exam: 50 }
    }
  }, [style])

  // Fetch data
  const [students, setStudents] = useState<any[]>([])
  const { data: allSubjects = [] } = useSubjects()
  const [loading, setLoading] = useState(false)
  
  const classSubjects = useMemo(() => {
    if (!selectedClass) return []
    return allSubjects
  }, [allSubjects, selectedClass])

  const loadData = useCallback(async () => {
    if (!selectedClass) return
    setLoading(true)
    try {
      // 1. Fetch students
      const { data: stds } = await supabase
        .from('students')
        .select('id, full_name, student_id')
        .eq('class_id', selectedClass)
        .eq('is_active', true)
        .order('full_name')
      
      setStudents(stds ?? [])

      // 2. Fetch scores for this class/term (only if subject and term are selected)
      if (selectedSubject && term?.id) {
        const { data: scs } = await supabase
          .from('scores')
          .select('*')
          .eq('class_id', selectedClass)
          .eq('term_id', term.id)
        
        const map: Record<string, ScoreEntry> = {}
        ;(stds ?? []).forEach(s => {
          const score = scs?.find(sc => sc.student_id === s.id && sc.subject_id === selectedSubject)
          map[s.id] = {
            class_score: score?.class_score?.toString() || '',
            exam_score: score?.exam_score?.toString() || '',
            total_score: (score?.class_score || 0) + (score?.exam_score || 0),
            remarks: score?.teacher_remarks || '',
            submitted: score?.is_submitted || false
          }
        })
        setScoreMap(map)
      } else {
        setScoreMap({})
      }
      
      setDirty(false)
    } catch (err) {
      toast.error('Failed to load assessment data')
    } finally {
      setLoading(false)
    }
  }, [selectedClass, selectedSubject, term?.id])

  useEffect(() => {
    loadData()
  }, [loadData])

  const updateScore = (studentId: string, field: 'class_score' | 'exam_score', value: string) => {
    setScoreMap(prev => {
      const current = prev[studentId] || { class_score: '', exam_score: '', total_score: 0, remarks: '', submitted: false }
      const updated = { ...current, [field]: value }
      
      // Recalculate total
      const cs = parseFloat(updated.class_score) || 0
      const es = parseFloat(updated.exam_score) || 0
      updated.total_score = Number((cs + es).toFixed(2))
      
      return { ...prev, [studentId]: updated }
    })
    setDirty(true)
  }

  const bulkUpsert = useBulkUpsertScores()

  const handleSave = async () => {
    if (!selectedClass || !selectedSubject || !term?.id || !year?.id) return
    
    const scoresToUpsert = Object.entries(scoreMap).map(([studentId, entry]) => ({
      student_id: studentId,
      subject_id: selectedSubject,
      class_id: selectedClass,
      term_id: term.id,
      academic_year_id: year.id,
      class_score: parseFloat(entry.class_score) || 0,
      exam_score: parseFloat(entry.exam_score) || 0,
      teacher_remarks: entry.remarks,
      is_submitted: true // Admins bypass teacher submission
    }))

    try {
      await bulkUpsert.mutateAsync(scoresToUpsert)
      setDirty(false)
    } catch (error) {
      console.error(error)
    }
  }

  const exportForPortal = (portal: 'WAEC' | 'BECE' | 'CAMBRIDGE') => {
    // Generate CSV data
    const headers = ['Index Number', 'Student Name', 'Subject', 'Class Score', 'Exam Score', 'Total', 'Grade']
    const rows = students.map((s: any) => {
      const entry = scoreMap[s.id]
      const total = entry?.total_score || 0
      const grade = getGradeInfo(total).grade
      return [
        s.student_id || '',
        s.full_name,
        classSubjects.find(sub => sub.id === selectedSubject)?.name || '',
        entry?.class_score || '0',
        entry?.exam_score || '0',
        total,
        grade
      ]
    })

    const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${portal}_Scores_${selectedClass}_${selectedSubject}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setIsExportModalOpen(false)
  }

  return (
    <div style={{ fontFamily: '"DM Sans", sans-serif', animation: '_fadeIn 0.5s ease' }}>
      <style>{`
        @keyframes _fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes _slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .assessment-row:hover { background: ${T.bg}; }
        .style-card { cursor: pointer; transition: all 0.2s; border: 2px solid transparent; }
        .style-card.active { border-color: ${T.primary}; background: ${T.bg}; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: T.slate, margin: 0 }}>Assessment Entry Hub</h1>
          <p style={{ color: T.muted, marginTop: 4 }}>Manage and export official assessment scores across all styles.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            onClick={() => setIsExportModalOpen(true)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 12, 
              background: '#fff', border: `1.5px solid ${T.border}`, color: T.slate, fontWeight: 700, cursor: 'pointer' 
            }}>
            <Download size={18} /> Export for Portal
          </button>
          <button 
            onClick={handleSave}
            disabled={!dirty || bulkUpsert.isPending}
            style={{ 
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 12, 
              background: T.primary, color: '#fff', border: 'none', fontWeight: 700, cursor: dirty ? 'pointer' : 'not-allowed',
              opacity: dirty ? 1 : 0.6, boxShadow: '0 4px 12px rgba(109, 40, 217, 0.2)'
            }}>
            <Save size={18} /> {bulkUpsert.isPending ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </div>

      {/* Controls Card */}
      <div style={{ background: '#fff', borderRadius: 20, padding: 24, border: `1.5px solid ${T.border}`, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: T.muted, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>
              <Users size={12} style={{ marginRight: 4 }} /> Target Class
            </label>
            <select 
              value={selectedClass} 
              onChange={e => setSelectedClass(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: 12, border: `1.5px solid ${T.border}`, background: T.bg, outline: 'none', fontWeight: 600 }}>
              <option value="">Select a class...</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: T.muted, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>
              <BookOpen size={12} style={{ marginRight: 4 }} /> Subject
            </label>
            <select 
              value={selectedSubject} 
              onChange={e => setSelectedSubject(e.target.value)}
              disabled={!selectedClass}
              style={{ width: '100%', padding: '12px', borderRadius: 12, border: `1.5px solid ${T.border}`, background: T.bg, outline: 'none', fontWeight: 600 }}>
              <option value="">Select a subject...</option>
              {classSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: T.muted, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>
              <SettingsIcon size={12} style={{ marginRight: 4 }} /> Assessment Style
            </label>
            <div style={{ display: 'flex', background: T.bg, padding: 4, borderRadius: 12, border: `1.5px solid ${T.border}` }}>
              {(['GES', 'BECE', 'CAMBRIDGE'] as AssessmentStyle[]).map(s => (
                <button 
                  key={s}
                  onClick={() => setStyle(s)}
                  style={{ 
                    flex: 1, padding: '8px', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer',
                    background: style === s ? T.primary : 'transparent',
                    color: style === s ? '#fff' : T.muted,
                    transition: 'all 0.2s'
                  }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Style Info */}
        <div style={{ marginTop: 20, padding: '12px 16px', background: `${T.primary}08`, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12, border: `1px dashed ${T.primary}30` }}>
          <AlertCircle size={18} color={T.primary} />
          <div style={{ fontSize: 12, color: T.slate }}>
            <strong>{style} Mode Active:</strong> Continuous Assessment (Class Score) weighted at <strong>{weights.class}%</strong> and Final Exam at <strong>{weights.exam}%</strong>.
            {style === 'BECE' && ' Optimized for WAEC/BECE portal requirements (Form 3).'}
          </div>
        </div>
      </div>

      {/* Main Entry Table */}
      {!selectedClass || !selectedSubject ? (
        <div style={{ height: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: 24, border: `1.5px solid ${T.border}` }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Filter size={32} color={T.primary} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: T.slate, margin: '0 0 8px' }}>Ready to Enter Scores</h3>
          <p style={{ color: T.muted, fontSize: 14 }}>Please select a class and subject to load the student list.</p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 24, border: `1.5px solid ${T.border}`, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', animation: '_slideUp 0.4s ease' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: T.bg, borderBottom: `1.5px solid ${T.border}` }}>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: T.primary, textTransform: 'uppercase', letterSpacing: '0.05em', width: 60 }}>#</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: T.primary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student Details</th>
                <th style={{ padding: '16px 24px', textAlign: 'center', fontSize: 11, fontWeight: 800, color: T.primary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {style === 'BECE' ? 'SBA' : 'Class Score'} ({weights.class})
                </th>
                <th style={{ padding: '16px 24px', textAlign: 'center', fontSize: 11, fontWeight: 800, color: T.primary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Exam Score ({weights.exam})</th>
                <th style={{ padding: '16px 24px', textAlign: 'center', fontSize: 11, fontWeight: 800, color: T.primary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</th>
                <th style={{ padding: '16px 24px', textAlign: 'center', fontSize: 11, fontWeight: 800, color: T.primary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Grade</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: T.primary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s: any, idx: number) => {
                const entry = scoreMap[s.id] || { class_score: '', exam_score: '', total_score: 0, remarks: '', submitted: false }
                const g = getGradeInfo(entry.total_score)
                
                return (
                  <tr key={s.id} className="assessment-row" style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.2s' }}>
                    <td style={{ padding: '14px 24px', fontSize: 13, fontWeight: 700, color: T.muted }}>{idx + 1}</td>
                    <td style={{ padding: '14px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #6d28d9 0%, #4c1d95 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800 }}>
                          {s.full_name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: T.slate }}>{s.full_name}</div>
                          <div style={{ fontSize: 11, color: T.muted }}>{s.student_id || 'No ID'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 24px', textAlign: 'center' }}>
                      <ScoreInput 
                        value={entry.class_score} 
                        max={weights.class} 
                        onChange={(v: string) => updateScore(s.id, 'class_score', v)} 
                      />
                    </td>
                    <td style={{ padding: '14px 24px', textAlign: 'center' }}>
                      <ScoreInput 
                        value={entry.exam_score} 
                        max={weights.exam} 
                        onChange={(v: string) => updateScore(s.id, 'exam_score', v)} 
                      />
                    </td>
                    <td style={{ padding: '14px 24px', textAlign: 'center' }}>
                      <div style={{ fontSize: 16, fontWeight: 900, color: entry.total_score >= 50 ? T.success : T.danger }}>
                        {entry.total_score}
                      </div>
                    </td>
                    <td style={{ padding: '14px 24px', textAlign: 'center' }}>
                      <span style={{ 
                        padding: '4px 10px', borderRadius: 8, background: `${g.color}15`, color: g.color, 
                        fontSize: 12, fontWeight: 800, border: `1px solid ${g.color}30` 
                      }}>
                        {g.grade}
                      </span>
                    </td>
                    <td style={{ padding: '14px 24px' }}>
                      <input 
                        type="text"
                        placeholder="Add teacher remarks..."
                        value={entry.remarks}
                        onChange={e => setScoreMap(prev => ({ ...prev, [s.id]: { ...prev[s.id], remarks: e.target.value } }))}
                        onBlur={() => setDirty(true)}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1.5px solid ${T.border}`, fontSize: 12, outline: 'none' }}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Export Modal */}
      <Modal
        open={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Official Portal Export"
        subtitle="Download scores in industry-standard formats"
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: '10px 0' }}>
          <div 
            onClick={() => exportForPortal('BECE')}
            className="style-card"
            style={{ padding: 20, background: '#fff', border: `1.5px solid ${T.border}`, borderRadius: 16, textAlign: 'center' }}>
            <FileSpreadsheet size={32} color={T.success} style={{ marginBottom: 12 }} />
            <h4 style={{ margin: '0 0 4px', fontSize: 15 }}>WAEC / BECE</h4>
            <p style={{ fontSize: 11, color: T.muted, margin: 0 }}>Form 3 Continuous Assessment Export</p>
          </div>
          <div 
            onClick={() => exportForPortal('CAMBRIDGE')}
            className="style-card"
            style={{ padding: 20, background: '#fff', border: `1.5px solid ${T.border}`, borderRadius: 16, textAlign: 'center' }}>
            <ClipboardCheck size={32} color={T.primary} style={{ marginBottom: 12 }} />
            <h4 style={{ margin: '0 0 4px', fontSize: 15 }}>Cambridge IGCSE</h4>
            <p style={{ fontSize: 11, color: T.muted, margin: 0 }}>Official Grade Tracking Export</p>
          </div>
        </div>
        <div style={{ marginTop: 16, padding: 12, background: '#fffbeb', borderRadius: 12, border: '1px solid #fde68a', fontSize: 12, color: '#92400e' }}>
          <strong>Note:</strong> Exports include Index Numbers and Student Names required by official educational portals.
        </div>
      </Modal>
    </div>
  )
}
