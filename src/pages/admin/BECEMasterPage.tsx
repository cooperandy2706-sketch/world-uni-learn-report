// src/pages/admin/BECEMasterPage.tsx
import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useClasses } from '../../hooks/useClasses'
import { useSubjects } from '../../hooks/useSubjects'
import { useCurrentTerm, useCurrentAcademicYear, useSettings } from '../../hooks/useSettings'
import { useBulkUpsertScores } from '../../hooks/useScores'
import Modal from '../../components/ui/Modal'
import BECEReportCard from '../../components/reports/BECEReportCard'
import { utils, writeFile } from 'xlsx'
import toast from 'react-hot-toast'
import { 
  Grid, 
  Save, 
  Printer, 
  Search,
  Upload,
  Download,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────
interface CellScore {
  class_score: string
  exam_score: string
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

export default function BECEMasterPage() {
  const { data: classes = [] } = useClasses()
  const { data: allSubjects = [] } = useSubjects()
  const { data: term } = useCurrentTerm()
  const { data: year } = useCurrentAcademicYear()
  const { data: settings } = useSettings()

  const [selectedClass, setSelectedClass] = useState('')
  const [students, setStudents] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [scoreGrid, setScoreGrid] = useState<Record<string, Record<string, CellScore>>>({})
  const [indexMap, setIndexMap] = useState<Record<string, string>>({})  // studentId → WAEC index
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDirty, setIsDirty] = useState(false)

  const bulkUpsert = useBulkUpsertScores()

  // Warn on leave
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  const allSubjectsRef = React.useRef(allSubjects)
  useEffect(() => { allSubjectsRef.current = allSubjects }, [allSubjects])

  // ── Load Data ──────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!selectedClass || !term?.id) return
    setIsLoading(true)
    
    try {
      // 1. Fetch Students
      const { data: stds } = await supabase
        .from('students')
        .select('id, full_name, student_id, gender, house, date_of_birth, class:classes(name)')
        .eq('class_id', selectedClass)
        .eq('is_active', true)
        .order('full_name')
      
      // 2. Fetch Subjects assigned to this class
      // (Assuming teacher_assignments or similar maps subjects to classes, but for master entry, let's show all core/electives)
      // For now, let's use allSubjects as a base, or we can filter by assignments
      const { data: classSubs } = await supabase
        .from('teacher_assignments')
        .select('subject:subjects(id, name, code)')
        .eq('class_id', selectedClass)
        .eq('term_id', term.id)
      
      const uniqueSubs = Array.from(new Set((classSubs || []).map((s: any) => s.subject?.id)))
        .map(id => allSubjectsRef.current.find(s => s.id === id))
        .filter(Boolean)

      setSubjects(uniqueSubs.length > 0 ? uniqueSubs : allSubjectsRef.current.slice(0, 12))

      // 3. Fetch Existing Scores
      const { data: scs } = await supabase
        .from('scores')
        .select('*')
        .eq('class_id', selectedClass)
        .eq('term_id', term.id)

      // 4. Build Grid
      const grid: Record<string, Record<string, CellScore>> = {}
      stds?.forEach(s => {
        grid[s.id] = {}
        uniqueSubs?.forEach(sub => {
          const score = scs?.find(sc => sc.student_id === s.id && sc.subject_id === sub.id)
          grid[s.id][sub.id] = {
            class_score: score?.class_score?.toString() || '',
            exam_score: score?.exam_score?.toString() || '',
          }
        })
      })

      setStudents(stds || [])
      setScoreGrid(grid)

      // 5. Seed index map from existing student_id values
      const idxMap: Record<string, string> = {}
      stds?.forEach(s => { idxMap[s.id] = s.student_id || '' })
      setIndexMap(idxMap)
      setIsDirty(false)
    } catch (err) {
      toast.error('Failed to load master sheet')
    } finally {
      setIsLoading(false)
    }
  }, [selectedClass, term?.id])  // allSubjects intentionally excluded — uses ref to avoid wiping unsaved scores

  useEffect(() => {
    loadData()
  }, [loadData])

  // ── Handlers ──────────────────────────────────────────────
  const handleScoreChange = (studentId: string, subjectId: string, field: keyof CellScore, value: string) => {
    setIsDirty(true)
    setScoreGrid(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [subjectId]: {
          ...prev[studentId][subjectId],
          [field]: value
        }
      }
    }))
  }

  const handleSave = async () => {
    if (!selectedClass || !term?.id || !year?.id) return
    setIsSaving(true)
    
    const scoresToUpsert: any[] = []
    Object.entries(scoreGrid).forEach(([studentId, subMap]) => {
      Object.entries(subMap).forEach(([subjectId, scores]) => {
        // Use !== '' so that score of 0 is still saved
        if (scores.class_score !== '' || scores.exam_score !== '') {
          scoresToUpsert.push({
            student_id: studentId,
            subject_id: subjectId,
            class_id: selectedClass,
            term_id: term.id,
            academic_year_id: year.id,
            class_score: parseFloat(scores.class_score) || 0,
            exam_score: parseFloat(scores.exam_score) || 0,
            is_submitted: true
          })
        }
      })
    })

    // Save index numbers to students table
    const indexUpdates = Object.entries(indexMap)
      .filter(([, idx]) => idx.trim() !== '')
      .map(([studentId, idx]) =>
        supabase.from('students').update({ student_id: idx.trim() }).eq('id', studentId)
      )

    try {
      // 1. Save scores (throws if error)
      await bulkUpsert.mutateAsync(scoresToUpsert)

      // 2. Save index numbers (throws if error)
      if (indexUpdates.length > 0) {
        const results = await Promise.all(indexUpdates)
        const firstError = results.find(r => r.error)?.error
        if (firstError) throw firstError
      }

      // 3. Refresh and reset dirty state
      setStudents(prev => prev.map(s => ({ ...s, student_id: indexMap[s.id] || s.student_id })))
      setIsDirty(false)
      toast.success('Master sheet & index numbers saved successfully')
    } catch (err: any) {
      console.error('Save Action Failed:', err)
      toast.error('Failed to save — check your data and connection')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePrint = () => {
    const printArea = document.getElementById('bece-bulk-print-area')
    if (!printArea) return
    
    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) return
    
    win.document.write(`
      <html>
        <head>
          <title>BECE Continuous Assessment Reports</title>
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&family=Playfair+Display:wght@700;900&display=swap"/>
          <style>
            body { margin: 0; padding: 0; }
            @page { size: A4; margin: 10mm; }
            @media print {
              .page-break { page-break-after: always; }
            }
          </style>
        </head>
        <body>
          ${printArea.innerHTML}
          <script>
            window.onload = () => {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `)
    win.document.close()
    setIsPrintModalOpen(false)
  }

  const handleDownloadPDF = async () => {
    const printArea = document.getElementById('bece-bulk-print-area')
    if (!printArea) return

    setIsPrintModalOpen(false)
    const toastId = toast.loading(`Generating PDF for ${students.length} student(s)…`)

    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ])

      const pdf = new jsPDF('p', 'mm', 'a4')
      const pages = printArea.querySelectorAll('.page-break')

      if (pages.length === 0) {
        toast.error('No student data to export', { id: toastId })
        return
      }

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement
        const canvas = await html2canvas(page, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        })
        const imgData = canvas.toDataURL('image/png')
        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width
        if (i > 0) pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      }

      const className = classes.find(c => c.id === selectedClass)?.name || 'Class'
      pdf.save(`BECE_Reports_${className}_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.pdf`)
      toast.success('PDF downloaded successfully!', { id: toastId })
    } catch (err: any) {
      console.error(err)
      toast.error('PDF failed: ' + (err.message || 'Unknown error'), { id: toastId })
    }
  }

  // ── WAEC Portal Export (Narrow Format) ────────────────────
  const handleExportPortal = () => {
    if (students.length === 0 || subjects.length === 0) {
      toast.error('No data to export. Select a class and ensure scores are entered.')
      return
    }

    const rows: any[] = []

    students.forEach(student => {
      subjects.forEach(sub => {
        const cell = scoreGrid[student.id]?.[sub.id]
        if (!cell) return

        const sba = parseFloat(cell.class_score) || 0
        const exam = parseFloat(cell.exam_score) || 0
        const total = sba + exam

        // Only export if there is some score data
        if (cell.class_score !== '' || cell.exam_score !== '') {
          rows.push({
            'Index Number': indexMap[student.id] || student.student_id || '',
            'Candidate Name': student.full_name,
            'Sex': student.gender?.toLowerCase().startsWith('m') ? 'M' : student.gender?.toLowerCase().startsWith('f') ? 'F' : '',
            'Subject Code': sub.code || sub.name.substring(0, 3).toUpperCase(),
            'CA Score': Math.round(total)
          })
        }
      })
    })

    if (rows.length === 0) {
      toast.error('No score data found to export.')
      return
    }

    const ws = utils.json_to_sheet(rows)
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, 'BECE Portal Upload')

    const className = classes.find(c => c.id === selectedClass)?.name || 'Class'
    const fileName = `WAEC_BECE_Portal_${className}_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.xlsx`
    writeFile(wb, fileName)
    toast.success(`✅ Exported ${rows.length} records in Narrow Format.`)
  }

  const filteredStudents = students.filter(s => 
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.student_id?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div style={{ fontFamily: '"DM Sans", sans-serif', animation: '_fadeIn 0.5s ease' }}>
      <style>{`
        @keyframes _fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .master-grid-container { overflow-x: auto; background: #fff; border-radius: 20px; border: 1.5px solid ${T.border}; box-shadow: 0 4px 20px rgba(0,0,0,0.02); }
        .grid-table { width: 100%; border-collapse: separate; border-spacing: 0; }
        .grid-table th, .grid-table td { border-bottom: 1px solid ${T.border}; border-right: 1px solid ${T.border}; padding: 10px 12px; }
        /* ── Frozen col 1: Student Name (left: 0, w: 200px) ── */
        .grid-header-student { 
          width: 200px; min-width: 200px; max-width: 200px;
          position: sticky; left: 0; z-index: 4;
          background: ${T.bg}; font-size: 11px; font-weight: 800; text-transform: uppercase; color: ${T.muted};
          box-shadow: 2px 0 4px rgba(0,0,0,0.06);
        }
        .grid-cell-student { 
          width: 200px; min-width: 200px; max-width: 200px;
          position: sticky; left: 0; z-index: 2;
          background: #fff;
          box-shadow: 2px 0 4px rgba(0,0,0,0.04);
        }
        /* ── Frozen col 2: WAEC Index (left: 200px, w: 148px) ── */
        .grid-header-index { 
          width: 148px; min-width: 148px; max-width: 148px;
          position: sticky; left: 200px; z-index: 4;
          background: #d1fae5; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #065f46; text-align: center;
          box-shadow: 2px 0 6px rgba(0,0,0,0.08);
        }
        .grid-cell-index { 
          width: 148px; min-width: 148px; max-width: 148px;
          position: sticky; left: 200px; z-index: 2;
          background: #ecfdf5;
          box-shadow: 2px 0 6px rgba(0,0,0,0.06);
          padding: 6px !important;
        }
        /* ── Scrollable score columns ── */
        .grid-header-subject { width: 150px; min-width: 150px; text-align: center; background: ${T.bg}; font-size: 11px; font-weight: 800; text-transform: uppercase; color: ${T.muted}; }
        .grid-header-total { width: 100px; min-width: 100px; text-align: center; background: #f1f5f9; font-size: 11px; font-weight: 900; color: ${T.slate}; border-left: 2px solid ${T.border}; }
        .grid-cell-score { width: 150px; min-width: 150px; padding: 6px !important; }
        .grid-cell-total { width: 100px; min-width: 100px; text-align: center; background: #f8fafc; font-weight: 800; color: ${T.primary}; border-left: 2px solid ${T.border}; }
        .score-input-group { display: flex; gap: 4px; }
        .score-input { width: 50%; padding: 7px 4px; border-radius: 6px; border: 1.5px solid ${T.border}; text-align: center; font-size: 12px; font-weight: 700; outline: none; transition: border-color 0.2s; background: #fff; }
        .score-input:focus { border-color: ${T.primary}; background: #faf5ff; }
        .score-input.exam { background: ${T.bg}; }
        .score-input.exam:focus { background: #faf5ff; }

      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: T.slate, margin: 0 }}>BECE Master Entry</h1>
          <p style={{ color: T.muted, marginTop: 4 }}>Input SBA & Exam scores for all subjects — export directly to WAEC portal.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button 
            onClick={handleExportPortal}
            disabled={students.length === 0}
            style={{ 
              display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 12, 
              background: '#ecfdf5', border: `1.5px solid #10b981`, color: '#065f46', fontWeight: 700, cursor: students.length === 0 ? 'not-allowed' : 'pointer',
              opacity: students.length === 0 ? 0.5 : 1
            }}>
            <FileSpreadsheet size={18} /> Export for BECE Portal
          </button>
          <button 
            onClick={() => setIsPrintModalOpen(true)}
            disabled={students.length === 0}
            style={{ 
              display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 12, 
              background: '#fff', border: `1.5px solid ${T.border}`, color: T.slate, fontWeight: 700, cursor: 'pointer',
              opacity: students.length === 0 ? 0.5 : 1
            }}>
            <Printer size={18} /> Result Slips / PDF
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving || students.length === 0}
            style={{ 
              display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, 
              background: T.primary, color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(109, 40, 217, 0.2)',
              opacity: students.length === 0 ? 0.5 : 1,
              position: 'relative'
            }}>
            <Save size={18} /> {isSaving ? 'Saving...' : 'Save All Scores'}
            {isDirty && !isSaving && (
              <span style={{ 
                position: 'absolute', top: -4, right: -4, width: 12, height: 12, 
                background: T.warning, borderRadius: '50%', border: '2px solid #fff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }} title="Unsaved changes" />
            )}
          </button>
        </div>
      </div>

      {/* Selectors & Search */}
      <div style={{ background: '#fff', borderRadius: 20, padding: 20, border: `1.5px solid ${T.border}`, marginBottom: 24, display: 'flex', gap: 20, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: T.muted, textTransform: 'uppercase', marginBottom: 6 }}>Class</label>
          <select 
            value={selectedClass} 
            onChange={e => setSelectedClass(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: 12, border: `1.5px solid ${T.border}`, background: T.bg, outline: 'none', fontWeight: 600 }}>
            <option value="">Select Class...</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div style={{ flex: 2 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: T.muted, textTransform: 'uppercase', marginBottom: 6 }}>Search Student</label>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.muted }} />
            <input 
              type="text" 
              placeholder="Filter student by name or index..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: 12, border: `1.5px solid ${T.border}`, outline: 'none' }}
            />
          </div>
        </div>
      </div>

      {/* Master Grid */}
      {isLoading ? (
        <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: `3px solid ${T.border}`, borderTopColor: T.primary, animation: '_spin 1s linear infinite' }} />
          <style>{`@keyframes _spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : selectedClass ? (
        <div className="master-grid-container">
          <table className="grid-table">
            <thead>
              <tr>
                <th className="grid-header-student">Student Name</th>
                <th className="grid-header-index">WAEC Index No.</th>
                {subjects.map(sub => (
                  <th key={sub.id} className="grid-header-subject">
                    {sub.name}
                    <div style={{ fontSize: 9, opacity: 0.6, marginTop: 4 }}>SBA(30) | EXAM(70)</div>
                  </th>
                ))}
                <th className="grid-header-total">Grand Total</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(student => (
                <tr key={student.id}>
                  <td className="grid-cell-student">
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{student.full_name}</div>
                    <div style={{ fontSize: 10, color: T.muted }}>{student.gender ? student.gender.charAt(0).toUpperCase() + student.gender.slice(1) : ''}</div>
                  </td>
                  <td className="grid-cell-index">
                    <input
                      type="text"
                      placeholder="e.g. 0030100001"
                      value={indexMap[student.id] ?? ''}
                      onChange={e => {
                        setIsDirty(true)
                        setIndexMap(prev => ({ ...prev, [student.id]: e.target.value }))
                      }}
                      style={{
                        width: '100%', padding: '7px 8px', borderRadius: 6,
                        border: `1.5px solid ${indexMap[student.id] ? '#10b981' : '#d1fae5'}`,
                        fontSize: 12, fontWeight: 700, outline: 'none',
                        background: indexMap[student.id] ? '#f0fdf4' : '#fff',
                        color: '#065f46', textAlign: 'center',
                        fontFamily: 'monospace'
                      }}
                    />
                  </td>
                  {subjects.map(sub => {
                    const cell = scoreGrid[student.id]?.[sub.id] || { class_score: '', exam_score: '' }
                    const sba = parseFloat(cell.class_score) || 0
                    const exam = parseFloat(cell.exam_score) || 0
                    const total = sba + exam
                    const hasData = cell.class_score !== '' || cell.exam_score !== ''
                    return (
                      <td key={sub.id} className="grid-cell-score">
                        <div className="score-input-group">
                          <input 
                            type="number" 
                            className="score-input"
                            placeholder="SBA/30"
                            min={0} max={30}
                            value={cell.class_score}
                            onChange={e => handleScoreChange(student.id, sub.id, 'class_score', e.target.value)}
                          />
                          <input 
                            type="number" 
                            className="score-input exam"
                            placeholder="EXAM/70"
                            min={0} max={70}
                            value={cell.exam_score}
                            onChange={e => handleScoreChange(student.id, sub.id, 'exam_score', e.target.value)}
                          />
                        </div>
                        {hasData && (
                          <div style={{
                            textAlign: 'center',
                            marginTop: 4,
                            fontSize: 11,
                            fontWeight: 800,
                            color: total >= 50 ? '#065f46' : '#991b1b',
                            background: total >= 50 ? '#d1fae5' : '#fee2e2',
                            borderRadius: 4,
                            padding: '2px 0',
                            letterSpacing: '0.03em'
                          }}>
                            Total: {total.toFixed(0)}
                          </div>
                        )}
                      </td>
                    )
                  })}
                  <td className="grid-cell-total">
                    {(() => {
                      let grandTotal = 0
                      subjects.forEach(sub => {
                        const cell = scoreGrid[student.id]?.[sub.id]
                        grandTotal += (parseFloat(cell?.class_score || '0') || 0) + (parseFloat(cell?.exam_score || '0') || 0)
                      })
                      return grandTotal.toFixed(0)
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ height: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: 20, border: `1.5px solid ${T.border}` }}>
          <Grid size={48} color={T.muted} style={{ marginBottom: 16, opacity: 0.5 }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: T.slate, margin: '0 0 8px' }}>Select a Class</h3>
          <p style={{ color: T.muted, fontSize: 14 }}>Pick a class to load the master entry grid.</p>
        </div>
      )}

      {/* Off-screen Bulk Print Area — visible to html2canvas but not to the user */}
      <div
        id="bece-bulk-print-area"
        style={{
          position: 'fixed',
          top: 0,
          left: '-9999px',
          width: '800px',
          pointerEvents: 'none',
          zIndex: -1,
        }}
      >
        {students.map(student => {
          // Prepare scores for the report card
          const studentScores = subjects.map(sub => {
            const gridCell = scoreGrid[student.id]?.[sub.id] || { class_score: '', exam_score: '' }
            return {
              id: sub.id,
              subject: { name: sub.name },
              class_score: parseFloat(gridCell.class_score) || null,
              exam_score: parseFloat(gridCell.exam_score) || null,
              total_score: (parseFloat(gridCell.class_score) || 0) + (parseFloat(gridCell.exam_score) || 0)
            }
          })
          return (
            <div key={student.id} className="page-break">
              <BECEReportCard 
                student={student} 
                school={settings?.school} 
                term={term} 
                year={year} 
                scores={studentScores} 
              />
            </div>
          )
        })}
      </div>

      {/* Print Confirmation Modal */}
      <Modal
        open={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="Generate Result Slips"
        subtitle="Download or print BECE Continuous Assessment slips"
      >
        <div style={{ padding: '10px 0' }}>
          <p style={{ fontSize: 14, color: T.slate, lineHeight: 1.6 }}>
            You are about to generate <strong>{students.length} report slips</strong> for the class <strong>{classes.find(c => c.id === selectedClass)?.name}</strong>.
          </p>
          <div style={{ marginTop: 16, background: '#f8fafc', padding: 16, borderRadius: 12, border: `1.5px solid ${T.border}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, textTransform: 'uppercase', marginBottom: 8 }}>Export Details:</div>
            <div style={{ fontSize: 13, color: T.slate, display: 'flex', alignItems: 'center', gap: 8 }}>
               <CheckCircle2 size={14} color={T.success} /> {subjects.length} Subjects included
            </div>
            <div style={{ fontSize: 13, color: T.slate, display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
               <CheckCircle2 size={14} color={T.success} /> Official BECE Layout
            </div>
          </div>
          <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
            <button 
              onClick={handleDownloadPDF}
              style={{ flex: 1, padding: '12px', borderRadius: 10, background: T.primary, color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Download size={16} /> Download PDF
            </button>
            <button 
              onClick={handlePrint}
              style={{ flex: 1, padding: '12px', borderRadius: 10, background: '#fff', border: `1.5px solid ${T.border}`, color: T.slate, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Printer size={16} /> Print Slips
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
