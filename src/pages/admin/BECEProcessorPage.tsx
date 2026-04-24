// src/pages/admin/BECEProcessorPage.tsx
import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useClasses } from '../../hooks/useClasses'
import { useSubjects } from '../../hooks/useSubjects'
import { useCurrentTerm, useCurrentAcademicYear } from '../../hooks/useSettings'
import Modal from '../../components/ui/Modal'
import { utils, writeFile } from 'xlsx'
import toast from 'react-hot-toast'
import { 
  Calculator, 
  Download, 
  FileSpreadsheet, 
  Users, 
  BookOpen, 
  CheckCircle2, 
  Lock, 
  RefreshCcw,
  AlertTriangle,
  ChevronRight
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────
interface CAData {
  studentId: string
  studentName: string
  indexNumber: string
  testScores: number[]
  assignmentScores: number[]
  examScore: number
  testAvg: number
  assignmentAvg: number
  finalCA: number
  isLocked: boolean
}

const T = {
  primary: '#6d28d9',
  secondary: '#7c3aed',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  slate: '#1e293b',
  muted: '#64748b',
  border: '#e2e8f0',
  bg: '#f8fafc',
}

export default function BECEProcessorPage() {
  const { data: classes = [] } = useClasses()
  const { data: subjects = [] } = useSubjects()
  const { data: term } = useCurrentTerm()
  const { data: year } = useCurrentAcademicYear()

  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [processedData, setProcessedData] = useState<CAData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)

  // ── Calculation Logic ──────────────────────────────────────
  const [students, setStudents] = useState<any[]>([])

  // ── Fetch Students on Class Change ─────────────────────────
  useEffect(() => {
    async function fetchStudents() {
      if (!selectedClass) {
        setStudents([])
        setProcessedData([])
        return
      }
      const { data } = await supabase
        .from('students')
        .select('id, full_name, student_id')
        .eq('class_id', selectedClass)
        .eq('is_active', true)
        .order('full_name')
      setStudents(data || [])
    }
    fetchStudents()
  }, [selectedClass])

  // ── Calculation Logic ──────────────────────────────────────
  const processBECE = useCallback(async () => {
    if (!selectedClass || !selectedSubject || !term?.id || students.length === 0) return
    setIsLoading(true)
    
    try {
      // 1. Fetch Class Tests & Scores
      const { data: tests } = await supabase
        .from('class_tests')
        .select('id, max_score')
        .eq('class_id', selectedClass)
        .eq('subject_id', selectedSubject)
        .eq('term_id', term.id)
      
      const testIds = tests?.map(t => t.id) || []
      const { data: testScores } = await supabase
        .from('class_test_scores')
        .select('*')
        .in('test_id', testIds)

      // 2. Fetch Assignments & Submissions
      const { data: assignments } = await supabase
        .from('assignments')
        .select('id')
        .eq('class_id', selectedClass)
        .eq('subject_id', selectedSubject)
        .eq('term_id', term.id)
      
      const assignIds = assignments?.map(a => a.id) || []
      const { data: submissions } = await supabase
        .from('assignment_submissions')
        .select('*')
        .in('assignment_id', assignIds)

      // 3. Fetch Final Exam Scores
      const { data: mainScores } = await supabase
        .from('scores')
        .select('*')
        .eq('class_id', selectedClass)
        .eq('subject_id', selectedSubject)
        .eq('term_id', term.id)

      // 4. Aggregate and Calculate
      const results: CAData[] = students.map(student => {
        // Normalize Tests (Scale to 100)
        const sTestScores = (testScores || [])
          .filter(ts => ts.student_id === student.id)
          .map(ts => {
            const max = tests?.find(t => t.id === ts.test_id)?.max_score || 100
            return (ts.score_attained / max) * 100
          })
        
        // Normalize Assignments (Scale to 100)
        const sAssignScores = (submissions || [])
          .filter(sub => sub.student_id === student.id)
          .map(sub => (sub.score / sub.total_possible) * 100)

        const testAvg = sTestScores.length > 0 ? sTestScores.reduce((a, b) => a + b, 0) / sTestScores.length : 0
        const assignAvg = sAssignScores.length > 0 ? sAssignScores.reduce((a, b) => a + b, 0) / sAssignScores.length : 0
        
        const scoreRecord = mainScores?.find(s => s.student_id === student.id)
        const rawExam = scoreRecord?.exam_score || 0
        const normalizedExam = (rawExam / 50) * 100 

        const finalCA = (testAvg * 0.20) + (assignAvg * 0.10) + (normalizedExam * 0.70)

        return {
          studentId: student.id,
          studentName: student.full_name,
          indexNumber: student.student_id || 'N/A',
          testScores: sTestScores,
          assignmentScores: sAssignScores,
          examScore: normalizedExam,
          testAvg: Math.round(testAvg),
          assignmentAvg: Math.round(assignAvg),
          finalCA: Math.min(100, Math.max(0, Math.round(finalCA))),
          isLocked: scoreRecord?.is_submitted || false
        }
      })

      setProcessedData(results)
    } catch (err: any) {
      toast.error('Processing failed: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }, [selectedClass, selectedSubject, term?.id, students])

  // Auto-trigger when class and subject are ready
  useEffect(() => {
    if (selectedClass && selectedSubject && term?.id && students.length > 0) {
      processBECE()
    }
  }, [selectedClass, selectedSubject, term?.id, students])

  // ── Handlers ──────────────────────────────────────────────
  const handleExport = () => {
    if (processedData.length === 0) return
    
    const wsData = processedData.map(d => ({
      'Student Name': d.studentName,
      'Index Number': d.indexNumber,
      'Subject': subjects.find(s => s.id === selectedSubject)?.name || 'N/A',
      'CA Score': d.finalCA
    }))

    const ws = utils.json_to_sheet(wsData)
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, 'BECE CA Scores')
    
    const subjectName = subjects.find(s => s.id === selectedSubject)?.name || 'Subject'
    writeFile(wb, `BECE_CA_${subjectName}_${new Date().toLocaleDateString()}.xlsx`)
    setIsExportModalOpen(false)
  }

  const handleLockScores = async () => {
    if (!selectedClass || !selectedSubject || !term?.id) return
    
    const loadingToast = toast.loading('Locking scores...')
    try {
      const { error } = await supabase
        .from('scores')
        .update({ is_submitted: true })
        .eq('class_id', selectedClass)
        .eq('subject_id', selectedSubject)
        .eq('term_id', term.id)
      
      if (error) throw error
      toast.success('Scores locked successfully', { id: loadingToast })
      processBECE()
    } catch (err: any) {
      toast.error('Failed to lock scores: ' + err.message, { id: loadingToast })
    }
  }

  return (
    <div style={{ fontFamily: '"DM Sans", sans-serif', animation: '_fadeIn 0.5s ease' }}>
      <style>{`
        @keyframes _fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .data-row:hover { background: #f1f5f9; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: T.slate, margin: 0 }}>BECE CA Processor</h1>
          <p style={{ color: T.muted, marginTop: 4 }}>Calculate WAEC-ready Continuous Assessment scores (20/10/70 rule).</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            onClick={processBECE}
            disabled={!selectedClass || !selectedSubject || isLoading}
            style={{ 
              display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 12, 
              background: T.primary, color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer',
              opacity: (!selectedClass || !selectedSubject) ? 0.6 : 1
            }}>
            <Calculator size={18} /> {isLoading ? 'Processing...' : 'Calculate Scores'}
          </button>
          <button 
            onClick={() => setIsExportModalOpen(true)}
            disabled={processedData.length === 0}
            style={{ 
              display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 12, 
              background: '#fff', border: `1.5px solid ${T.border}`, color: T.slate, fontWeight: 700, cursor: 'pointer',
              opacity: processedData.length === 0 ? 0.5 : 1
            }}>
            <Download size={18} /> Export Excel
          </button>
        </div>
      </div>

      {/* Selection Panel */}
      <div style={{ background: '#fff', borderRadius: 20, padding: 24, border: `1.5px solid ${T.border}`, marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: T.muted, textTransform: 'uppercase', marginBottom: 8 }}>Class</label>
            <select 
              value={selectedClass} 
              onChange={e => setSelectedClass(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: 12, border: `1.5px solid ${T.border}`, background: T.bg, outline: 'none', fontWeight: 600 }}>
              <option value="">Select Class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: T.muted, textTransform: 'uppercase', marginBottom: 8 }}>Subject</label>
            <select 
              value={selectedSubject} 
              onChange={e => setSelectedSubject(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: 12, border: `1.5px solid ${T.border}`, background: T.bg, outline: 'none', fontWeight: 600 }}>
              <option value="">Select Subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div style={{ padding: '12px 16px', background: `${T.primary}10`, borderRadius: 12, border: `1px dashed ${T.primary}30`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <RefreshCcw size={16} color={T.primary} />
            <span style={{ fontSize: 12, fontWeight: 600, color: T.slate }}>Auto-normalizing to 100 scale</span>
          </div>
        </div>
      </div>

      {/* Results Table */}
      {processedData.length > 0 ? (
        <div style={{ background: '#fff', borderRadius: 24, border: `1.5px solid ${T.border}`, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          {/* ... table ... */}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: T.bg, borderBottom: `1.5px solid ${T.border}` }}>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: T.muted, textTransform: 'uppercase' }}>Student / Index</th>
                <th style={{ padding: '16px 24px', textAlign: 'center', fontSize: 11, fontWeight: 800, color: T.muted, textTransform: 'uppercase' }}>Tests (20%)</th>
                <th style={{ padding: '16px 24px', textAlign: 'center', fontSize: 11, fontWeight: 800, color: T.muted, textTransform: 'uppercase' }}>Assign (10%)</th>
                <th style={{ padding: '16px 24px', textAlign: 'center', fontSize: 11, fontWeight: 800, color: T.muted, textTransform: 'uppercase' }}>Exam (70%)</th>
                <th style={{ padding: '16px 24px', textAlign: 'center', fontSize: 11, fontWeight: 800, color: T.primary, textTransform: 'uppercase' }}>Final CA</th>
                <th style={{ padding: '16px 24px', textAlign: 'center', fontSize: 11, fontWeight: 800, color: T.muted, textTransform: 'uppercase' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {processedData.map((d, i) => (
                <tr key={d.studentId} className="data-row" style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.2s' }}>
                  <td style={{ padding: '14px 24px' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.slate }}>{d.studentName}</div>
                    <div style={{ fontSize: 11, color: T.muted }}>{d.indexNumber}</div>
                  </td>
                  <td style={{ padding: '14px 24px', textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{d.testAvg}</div>
                    <div style={{ fontSize: 10, color: T.muted }}>Avg of {d.testScores.length} tests</div>
                  </td>
                  <td style={{ padding: '14px 24px', textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{d.assignmentAvg}</div>
                    <div style={{ fontSize: 10, color: T.muted }}>Avg of {d.assignmentScores.length} assigns</div>
                  </td>
                  <td style={{ padding: '14px 24px', textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{d.examScore}</div>
                  </td>
                  <td style={{ padding: '14px 24px', textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: T.primary }}>{d.finalCA}</div>
                  </td>
                  <td style={{ padding: '14px 24px', textAlign: 'center' }}>
                    {d.isLocked ? (
                      <span style={{ padding: '4px 8px', borderRadius: 6, background: '#f0fdf4', color: T.success, fontSize: 10, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Lock size={10} /> LOCKED
                      </span>
                    ) : (
                      <span style={{ padding: '4px 8px', borderRadius: 6, background: '#fffbeb', color: T.warning, fontSize: 10, fontWeight: 800 }}>PENDING</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div style={{ padding: 20, background: T.bg, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button 
              onClick={handleLockScores}
              style={{ 
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, 
                background: '#fff', border: `1.5px solid ${T.border}`, color: T.slate, fontWeight: 700, cursor: 'pointer' 
              }}>
              <CheckCircle2 size={16} color={T.success} /> Approve & Lock All
            </button>
          </div>
        </div>
      ) : (
        <div style={{ height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: 24, border: `1.5px solid ${T.border}` }}>
          {selectedClass && students.length > 0 ? (
            <>
              <Users size={48} color={T.primary} style={{ marginBottom: 16, opacity: 0.8 }} />
              <h3 style={{ fontSize: 18, fontWeight: 700, color: T.slate, margin: '0 0 8px' }}>{students.length} Students Found</h3>
              <p style={{ color: T.muted, fontSize: 14 }}>Now select a <b>subject</b> to calculate the BECE Continuous Assessment.</p>
            </>
          ) : (
            <>
              <AlertTriangle size={48} color={T.muted} style={{ marginBottom: 16, opacity: 0.5 }} />
              <h3 style={{ fontSize: 18, fontWeight: 700, color: T.slate, margin: '0 0 8px' }}>No Data Loaded</h3>
              <p style={{ color: T.muted, fontSize: 14 }}>Select a class and subject to begin.</p>
            </>
          )}
        </div>
      )}

      {/* Export Modal */}
      <Modal
        open={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="WAEC Portal Export"
        subtitle="Export Continuous Assessment in WAEC format"
      >
        <div style={{ padding: '10px 0' }}>
          <p style={{ fontSize: 14, color: T.slate, lineHeight: 1.6 }}>
            You are about to export <strong>{processedData.length} student scores</strong> for the subject <strong>{subjects.find(s => s.id === selectedSubject)?.name}</strong>.
          </p>
          <div style={{ marginTop: 16, background: '#f8fafc', padding: 16, borderRadius: 12, border: `1.5px solid ${T.border}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, textTransform: 'uppercase', marginBottom: 8 }}>Export Format:</div>
            <div style={{ fontSize: 13, color: T.slate, display: 'flex', alignItems: 'center', gap: 8 }}>
               <ChevronRight size={14} color={T.primary} /> Excel (.xlsx)
            </div>
            <div style={{ fontSize: 13, color: T.slate, display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
               <ChevronRight size={14} color={T.primary} /> WAEC Compliant Columns
            </div>
          </div>
          <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
            <button 
              onClick={handleExport}
              style={{ flex: 1, padding: '12px', borderRadius: 10, background: T.primary, color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
              Download Excel File
            </button>
            <button 
              onClick={() => setIsExportModalOpen(false)}
              style={{ flex: 1, padding: '12px', borderRadius: 10, background: '#fff', border: `1.5px solid ${T.border}`, color: T.slate, fontWeight: 700, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
