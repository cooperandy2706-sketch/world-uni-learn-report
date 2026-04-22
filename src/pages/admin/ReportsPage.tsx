// src/pages/admin/ReportsPage.tsx
import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useClasses } from '../../hooks/useClasses'
import { useCurrentTerm, useCurrentAcademicYear, useSettings } from '../../hooks/useSettings'
import { useGenerateReports, useReportsByClassTerm, useApproveReport, useUpdateReportRemarks } from '../../hooks/useReports'
import { getGradeInfo } from '../../utils/grading'
import { ordinal } from '../../lib/utils'
import Modal from '../../components/ui/Modal'
import ReportCard from '../../components/reports/ReportCard'
import toast from 'react-hot-toast'

function Btn({ children, onClick, variant = 'primary', disabled, loading, style }: any) {
  const [hov, setHov] = useState(false)
  const v: Record<string, React.CSSProperties> = {
    primary:   { background: hov ? '#5b21b6' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', border: 'none', boxShadow: '0 2px 8px rgba(109,40,217,.25)' },
    secondary: { background: hov ? '#f5f3ff' : '#fff', color: '#374151', border: '1.5px solid #e5e7eb' },
    success:   { background: hov ? '#15803d' : '#16a34a', color: '#fff', border: 'none' },
    warning:   { background: hov ? '#b45309' : 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', border: 'none' },
    info:      { background: hov ? '#0369a1' : 'linear-gradient(135deg,#0891b2,#0369a1)', color: '#fff', border: 'none' },
    danger:    { background: hov ? '#b91c1c' : '#dc2626', color: '#fff', border: 'none' },
  }
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'9px 16px', borderRadius:9, fontSize:13, fontWeight:600, cursor:disabled?'not-allowed':'pointer', transition:'all .15s', opacity:disabled?0.6:1, fontFamily:'"DM Sans",sans-serif', ...v[variant], ...style }}>
      {loading && <span style={{ width:13, height:13, borderRadius:'50%', border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff', animation:'_rp_spin .7s linear infinite', flexShrink:0 }} />}
      {children}
    </button>
  )
}

// ── A4 print single ───────────────────────────────────────
function printSingle(studentName: string, isBW: boolean = false) {
  const el = document.getElementById('single-report-print-area')
  if (!el) return
  // Wait for async data inside ReportCard
  setTimeout(() => {
    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head>
      <title>Report Card – ${studentName}</title>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap"/>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'DM Sans',sans-serif;background:#fff}
        @media print{
          @page{size:A4 portrait;margin:8mm}
          body{padding:0}
          .rc-wrap { ${isBW ? 'filter: grayscale(100%) !important;' : ''} }
        }
      </style>
      </head><body>${el.innerHTML}</body></html>`)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 800)
  }, 600)
}

// ── A4 print bulk ─────────────────────────────────────────
function printBulk(className: string, isBW: boolean = false) {
  const el = document.getElementById('bulk-report-print-area')
  if (!el) return
  setTimeout(() => {
    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head>
      <title>Report Cards – ${className}</title>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap"/>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'DM Sans',sans-serif;background:#fff}
        .page-break{page-break-after:always;break-after:page}
        @media print{
          @page{size:A4 portrait;margin:8mm}
          body{padding:0}
          .rc-wrap { ${isBW ? 'filter: grayscale(100%) !important;' : ''} }
        }
      </style>
      </head><body>${el.innerHTML}</body></html>`)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 1000)
  }, 800)
}

// ── PDF download ──────────────────────────────────────────
async function downloadPDF(studentName: string) {
  const el = document.getElementById('single-report-print-area')
  if (!el) { toast.error('Open the report first'); return }

  const toastId = toast.loading('Generating PDF…')
  await new Promise(r => setTimeout(r, 800))

  try {
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import('jspdf'),
      import('html2canvas'),
    ])

    // Capture logic extracted for reuse
    const canvas = await captureElement(el, html2canvas)
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
    addCanvasToPDF(canvas, pdf)

    pdf.save(`Report_${studentName.replace(/\s+/g, '_')}.pdf`)
    toast.success('PDF downloaded!', { id: toastId })
  } catch (e: any) {
    console.error('PDF failed:', e)
    toast.error('PDF failed: ' + (e.message || 'Unknown error'), { id: toastId })
  } finally {
    const el2 = document.getElementById('single-report-print-area')
    if (el2) el2.style.display = 'none'
  }
}

async function captureElement(originalEl: HTMLElement, html2canvas: any) {
  // 1. Create a dedicated capture container
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.top = '-10000px'
  container.style.left = '0'
  container.style.width = '794px'
  container.style.height = 'auto'
  container.style.background = '#fff'
  container.style.zIndex = '-9999'
  container.style.overflow = 'hidden'
  document.body.appendChild(container)

  // 2. Clone the element to avoid modifying the original React-managed DOM
  const clone = originalEl.cloneNode(true) as HTMLElement
  clone.style.display = 'block'
  clone.style.visibility = 'visible'
  clone.style.width = '100%'
  clone.style.position = 'relative'
  clone.style.top = '0'
  clone.style.left = '0'
  container.appendChild(clone)

  // 3. Wait for layout and potential image loads
  await new Promise(r => setTimeout(r, 600))

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 1024, // Use a wider window width to ensure responsive layouts don't squish
    })
    return canvas
  } finally {
    // 4. Cleanup
    document.body.removeChild(container)
  }
}

function addCanvasToPDF(canvas: HTMLCanvasElement, pdf: any) {
  const imgData = canvas.toDataURL('image/jpeg', 0.92)
  const pageW = pdf.internal.pageSize.getWidth()   // 595.28 pt
  const pageH = pdf.internal.pageSize.getHeight()  // 841.89 pt
  const imgW  = canvas.width
  const imgH  = canvas.height
  const ratio = pageW / imgW
  const scaledH = imgH * ratio

  if (scaledH <= pageH) {
    pdf.addImage(imgData, 'JPEG', 0, 0, pageW, scaledH)
  } else {
    // Multi-page: slice canvas
    const rowH = Math.floor(pageH / ratio)
    let srcY = 0
    while (srcY < imgH) {
      const sliceH = Math.min(rowH, imgH - srcY)
      const pg = document.createElement('canvas')
      pg.width = imgW
      pg.height = sliceH
      const ctx = pg.getContext('2d')!
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, pg.width, pg.height)
      ctx.drawImage(canvas, 0, srcY, imgW, sliceH, 0, 0, imgW, sliceH)
      if (srcY > 0 || pdf.internal.getNumberOfPages() > 1) pdf.addPage()
      pdf.addImage(pg.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, pageW, sliceH * ratio)
      srcY += sliceH
    }
  }
}

async function downloadBulkPDF(reports: any[], className: string) {
  if (!reports?.length) { toast.error('No reports found'); return }
  const toastId = toast.loading(`Preparing bulk PDF export for ${className}…`)
  
  const container = document.getElementById('bulk-report-print-area')
  if (!container) { toast.error('Print area not found', { id: toastId }); return }

  // Note: We NO LONGER modify the container visibility/position here
  // because captureElement handles cloning and isolation.

  try {
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import('jspdf'),
      import('html2canvas'),
    ])

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
    const studentDivs = Array.from(container.children) as HTMLElement[]
    
    for (let i = 0; i < studentDivs.length; i++) {
      toast.loading(`Capturing report ${i + 1} of ${studentDivs.length}…`, { id: toastId })
      const canvas = await captureElement(studentDivs[i], html2canvas)
      if (i > 0) pdf.addPage()
      addCanvasToPDF(canvas, pdf)
    }

    pdf.save(`Bulk_Reports_${className.replace(/\s+/g, '_')}.pdf`)
    toast.success('Bulk PDF downloaded!', { id: toastId })
  } catch (e: any) {
    console.error('Bulk PDF failed:', e)
    toast.error('Bulk PDF failed: ' + (e.message || 'Unknown error'), { id: toastId })
  }
}

// ═══════════════════════════════════════════════════════════
export default function ReportsPage() {
  const { data: classes = [] } = useClasses()
  const { data: term }     = useCurrentTerm()
  const { data: year }     = useCurrentAcademicYear()
  const { data: settings } = useSettings()

  const [searchParams] = useSearchParams()
  const initialStudentId = searchParams.get('student')
  const initialTermId = searchParams.get('term')

  const [selectedClass, setSelectedClass]   = useState('')
  const [viewingReport, setViewingReport]   = useState<any>(null)
  const [bulkPreviewOpen, setBulkPreviewOpen] = useState(false)
  const [exportingAll, setExportingAll]     = useState(false)
  const [exportProgress, setExportProgress] = useState<{ current:number; total:number; className:string } | null>(null)
  const [attModal, setAttModal]             = useState<any>(null)
  const [attData, setAttData]               = useState({ total_days:'', days_present:'' })
  const [savingAtt, setSavingAtt]           = useState(false)
  const [fetchingAtt, setFetchingAtt]       = useState(false)
  const [feesModal, setFeesModal]           = useState<any>(null)
  const [feesData, setFeesData]             = useState({ fees_amount:'', fees_paid:'', fees_arrears:'', other_fees:[] as any[] })
  const [savingFees, setSavingFees]         = useState(false)
  const [isBW, setIsBW]                     = useState(false)
  const [showOverallPosition, setShowOverallPosition] = useState(true)

  const { data: reports = [], isLoading } = useReportsByClassTerm(selectedClass, (term as any)?.id ?? '')
  const generateReports = useGenerateReports()
  const approveReport   = useApproveReport()
  const updateRemarks   = useUpdateReportRemarks()

  const school = (settings as any)?.school
  const selectedClassName = (classes as any[]).find(c => c.id === selectedClass)?.name ?? ''
  const approvedCount = (reports as any[]).filter((r: any) => r.is_approved).length
  const approvalPct   = reports.length > 0 ? Math.round((approvedCount / reports.length) * 100) : 0

  async function handleGenerate() {
    if (!selectedClass || !(term as any)?.id || !(year as any)?.id) { toast.error('Select a class first'); return }
    await generateReports.mutateAsync({ classId: selectedClass, termId: (term as any).id, academicYearId: (year as any).id })
  }

  async function approveAll() {
    if (!confirm('Approve all pending reports?')) return
    const pending = (reports as any[]).filter((r: any) => !r.is_approved)
    for (const r of pending) await approveReport.mutateAsync(r.id)
    toast.success(`${pending.length} reports approved`)
  }

  // Handle direct links from Performance Hub
  useEffect(() => {
    async function resolveDeepLink() {
      if (initialStudentId && initialTermId) {
        // Find which class the student was in for that term
        const { data: rc } = await supabase
          .from('report_cards')
          .select('class_id')
          .eq('student_id', initialStudentId)
          .eq('term_id', initialTermId)
          .maybeSingle()
        
        if (rc?.class_id) {
          setSelectedClass(rc.class_id)
        }
      }
    }
    resolveDeepLink()
  }, [initialStudentId, initialTermId])

  useEffect(() => {
    if (initialStudentId && reports.length > 0) {
      const target = reports.find((r: any) => r.student_id === initialStudentId)
      if (target) setViewingReport(target)
    }
  }, [initialStudentId, reports])

  // ── Save attendance ───────────────────────────────────────
  async function saveAttendance() {
    if (!attModal || !attData.total_days || !attData.days_present) {
      toast.error('Enter total days and days present'); return
    }
    setSavingAtt(true)
    const absent = Number(attData.total_days) - Number(attData.days_present)
    const payload = {
      student_id: attModal.student_id,
      term_id: attModal.term_id,
      total_days: Number(attData.total_days),
      days_present: Number(attData.days_present),
      days_absent: absent < 0 ? 0 : absent,
    }
    // Check if attendance record exists
    const { data: existing } = await supabase
      .from('attendance').select('id').eq('student_id', attModal.student_id).eq('term_id', attModal.term_id).maybeSingle()

    const { error } = existing
      ? await supabase.from('attendance').update(payload).eq('id', existing.id)
      : await supabase.from('attendance').insert(payload)

    setSavingAtt(false)
    if (error) { toast.error(error.message); return }
    toast.success(`Attendance saved for ${attModal.student?.full_name}`)
    setAttModal(null)
    setAttData({ total_days:'', days_present:'' })
  }

  // ── Sync attendance from daily records ────────────────────
  async function syncFromRegister() {
    if (!attModal) return
    setFetchingAtt(true)
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('status')
        .eq('student_id', attModal.student_id)
        .gte('date', (term as any).start_date)
        .lte('date', (term as any).end_date)

      if (error) throw error

      if (!data || data.length === 0) {
        toast.error('No daily records found for this student/term')
        return
      }

      const total = data.length
      const present = data.filter((r: any) => r.status === 'present' || r.status === 'late').length

      setAttData({
        total_days: total.toString(),
        days_present: present.toString(),
      })
      toast.success(`Synced ${total} daily records ✓`)
    } catch (e: any) {
      toast.error('Sync failed: ' + e.message)
    } finally {
      setFetchingAtt(false)
    }
  }

  // ── Save fees ─────────────────────────────────────────────
  async function saveFees() {
    if (!feesModal) return
    setSavingFees(true)
    const arrears = Math.max(0, Number(feesData.fees_amount) - Number(feesData.fees_paid))
    const { error } = await supabase.from('students').update({
      fees_amount:  Number(feesData.fees_amount) || 0,
      fees_paid:    Number(feesData.fees_paid) || 0,
      fees_arrears: arrears,
      other_fees:   feesData.other_fees,
    }).eq('id', feesModal.student_id)
    setSavingFees(false)
    if (error) { toast.error(error.message); return }
    toast.success('Fees saved for ' + feesModal.student?.full_name)
    setFeesModal(null)
  }

  async function openFeesModal(r: any) {
    // Load current fees for this student
    const { data } = await supabase.from('students')
      .select('fees_amount,fees_paid,fees_arrears,other_fees')
      .eq('id', r.student_id).maybeSingle()
    setFeesData({
      fees_amount:  data?.fees_amount?.toString() ?? '',
      fees_paid:    data?.fees_paid?.toString() ?? '',
      fees_arrears: data?.fees_arrears?.toString() ?? '',
      other_fees:   data?.other_fees ?? [],
    })
    setFeesModal(r)
  }

  // ── Export all classes ────────────────────────────────────
  async function handleExportAll() {
    if (!(term as any)?.id) { toast.error('No active term'); return }
    if (!confirm('Open a print window for each class?')) return
    setExportingAll(true)
    try {
      for (let ci = 0; ci < (classes as any[]).length; ci++) {
        const cls = (classes as any[])[ci]
        setExportProgress({ current: ci+1, total: (classes as any[]).length, className: cls.name })
        const { data: classReports } = await supabase
          .from('report_cards')
          .select('*, student:students(*, class:classes(id,name))')
          .eq('class_id', cls.id).eq('term_id', (term as any).id).order('overall_position')
        
        if (!classReports?.length) continue

        const enriched = await Promise.all(classReports.map(async (r: any) => {
          const [{ data: sc }, { data: att }] = await Promise.all([
            supabase.from('scores').select('*, subject:subjects(id,name,code)').eq('student_id', r.student_id).eq('term_id', (term as any).id),
            supabase.from('attendance').select('*').eq('student_id', r.student_id).eq('term_id', (term as any).id).maybeSingle(),
          ])
          return { ...r, _scores: sc ?? [], _attendance: att }
        }))

        const html = buildClassHTML(enriched, cls.name, school, term, year, settings, isBW, showOverallPosition)
        const win = window.open('', '_blank', 'width=900,height=700')
        if (win) {
          win.document.write(html)
          win.document.close()
          win.focus()
          await new Promise(r => setTimeout(r, 600))
          win.print()
        }
        await new Promise(r => setTimeout(r, 1200))
      }
      toast.success('Export complete')
    } catch { toast.error('Export failed') }
    finally { setExportingAll(false); setExportProgress(null) }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _rp_spin{to{transform:rotate(360deg)}}
        @keyframes _rfadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes _rfadeIn{from{opacity:0}to{opacity:1}}
        .rpt-row:hover{background:#faf5ff !important}
        .rpt-act:hover{background:#ede9fe !important;color:#5b21b6 !important}
      `}</style>

      <div style={{ fontFamily:'"DM Sans",system-ui,sans-serif', animation:'_rfadeIn .4s ease' }}>
        
        {/* ── Header ── */}
        <div style={{ marginBottom:22, display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div>
            <h1 style={{ fontFamily:'"Playfair Display",serif', fontSize:26, fontWeight:700, color:'#111827', margin:0 }}>Report Cards</h1>
            <p style={{ fontSize:13, color:'#6b7280', marginTop:3 }}>Generate · Approve · Print · Export</p>
          </div>
          <Btn variant="warning" onClick={handleExportAll} loading={exportingAll} disabled={exportingAll || !(term as any)?.id}>
            📦 Export All Classes
          </Btn>
        </div>

        {/* ── Export progress ── */}
        {exportProgress && (
          <div style={{ background:'#fffbeb', border:'1.5px solid #fde68a', borderRadius:14, padding:'12px 18px', marginBottom:16, display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:24, height:24, borderRadius:'50%', border:'3px solid #fde68a', borderTopColor:'#f59e0b', animation:'_rp_spin .7s linear infinite', flexShrink:0 }} />
            <div style={{ flex:1 }}>
              <p style={{ fontSize:13, fontWeight:700, color:'#92400e', margin:'0 0 4px' }}>
                Exporting {exportProgress.current}/{exportProgress.total}: <strong>{exportProgress.className}</strong>
              </p>
              <div style={{ height:5, background:'#fde68a', borderRadius:99, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${Math.round(exportProgress.current / exportProgress.total * 100)}%`, background:'linear-gradient(90deg,#f59e0b,#fbbf24)', borderRadius:99, transition:'width .4s' }} />
              </div>
            </div>
          </div>
        )}

        {/* ── Controls ── */}
        <div style={{ background:'#fff', borderRadius:16, padding:'18px 20px', border:'1.5px solid #f0eefe', marginBottom:20, boxShadow:'0 1px 4px rgba(109,40,217,.06)' }}>
          <div style={{ display:'flex', flexWrap:'wrap', gap:12, alignItems:'flex-end' }}>
            <div style={{ flex:'1 1 200px' }}>
              <label style={{ display:'block', fontSize:11, fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase', color:'#6b7280', marginBottom:5 }}>Select Class</label>
              <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
                style={{ width:'100%', padding:'9px 12px', borderRadius:9, fontSize:13, border:'1.5px solid #e5e7eb', outline:'none', background:'#faf5ff', color:'#111827', fontFamily:'"DM Sans",sans-serif', cursor:'pointer' }}>
                <option value="">Choose a class…</option>
                {(classes as any[]).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <Btn onClick={handleGenerate} disabled={!selectedClass || !(term as any)?.id} loading={generateReports.isPending}>
                {(reports as any[]).length > 0 ? '🔄 Regenerate' : '⚡ Generate'}
              </Btn>
              {(reports as any[]).length > 0 && <>
                {approvedCount < reports.length && <Btn variant="success" onClick={approveAll}>✅ Approve All</Btn>}
                <Btn variant="info" onClick={() => setBulkPreviewOpen(true)}>👁️ Preview All</Btn>
                <Btn variant="secondary" onClick={() => printBulk(selectedClassName, isBW)}>🖨️ Print Class</Btn>
                <Btn variant="danger" onClick={() => downloadBulkPDF(reports, selectedClassName)}>📥 Export PDF</Btn>
              </>}
            </div>
          </div>
          {(reports as any[]).length > 0 && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1.5px solid #f3f4f6', display: 'flex', gap: 20, alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#4b5563' }}>Global Print Settings:</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={showOverallPosition} onChange={e => setShowOverallPosition(e.target.checked)} />
                <span>Show Rank / Position</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={isBW} onChange={e => setIsBW(e.target.checked)} />
                <span>Black & White Mode</span>
              </label>
            </div>
          )}
        </div>

        {/* ── Empty states ── */}
        {!selectedClass && (
          <div style={{ background:'#fff', borderRadius:16, padding:'60px 20px', textAlign:'center', border:'1.5px solid #f0eefe' }}>
            <div style={{ fontSize:52, marginBottom:12 }}>📄</div>
            <h3 style={{ fontFamily:'"Playfair Display",serif', fontSize:18, fontWeight:700, color:'#111827', marginBottom:6 }}>Select a class to begin</h3>
            <p style={{ fontSize:13, color:'#9ca3af' }}>Choose a class above to view and manage report cards.</p>
          </div>
        )}
        {selectedClass && isLoading && (
          <div style={{ display:'flex', justifyContent:'center', padding:'60px 0', flexDirection:'column', alignItems:'center', gap:12 }}>
            <div style={{ width:36, height:36, borderRadius:'50%', border:'3px solid #ede9fe', borderTopColor:'#6d28d9', animation:'_rp_spin .8s linear infinite' }} />
          </div>
        )}
        {selectedClass && !isLoading && (reports as any[]).length === 0 && (
          <div style={{ background:'#fff', borderRadius:16, padding:'60px 20px', textAlign:'center', border:'1.5px solid #f0eefe' }}>
            <div style={{ fontSize:52, marginBottom:12 }}>📋</div>
            <h3 style={{ fontFamily:'"Playfair Display",serif', fontSize:18, fontWeight:700, color:'#111827', marginBottom:6 }}>No reports for {selectedClassName}</h3>
            <Btn onClick={handleGenerate} loading={generateReports.isPending}>⚡ Generate Now</Btn>
          </div>
        )}

        {/* ── Reports table ── */}
        {selectedClass && !isLoading && (reports as any[]).length > 0 && (
          <div style={{ animation:'_rfadeIn .4s ease' }}>
            {/* Summary */}
            <div style={{ background:'#fff', borderRadius:14, padding:'12px 18px', border:'1.5px solid #f0eefe', marginBottom:14, display:'flex', flexWrap:'wrap', gap:20, alignItems:'center' }}>
              {[
                { label:'Class', value: selectedClassName },
                { label:'Students', value: reports.length },
                { label:'Approved', value: `${approvedCount} / ${reports.length}` },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontSize:10, color:'#9ca3af', fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em' }}>{s.label}</div>
                  <div style={{ fontSize:14, fontWeight:700, color:'#111827' }}>{s.value}</div>
                </div>
              ))}
              <div style={{ flex:1, minWidth:140 }}>
                <div style={{ fontSize:10, color:'#9ca3af', fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:4 }}>Progress</div>
                <div style={{ height:7, background:'#f0eefe', borderRadius:99, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:approvalPct+'%', background: approvalPct===100?'linear-gradient(90deg,#16a34a,#22c55e)':'linear-gradient(90deg,#7c3aed,#a78bfa)', borderRadius:99, transition:'width .8s' }} />
                </div>
                <div style={{ fontSize:11, color:'#6b7280', marginTop:3 }}>{approvalPct}% approved</div>
              </div>
            </div>

            {/* Table */}
            <div style={{ background:'#fff', borderRadius:16, border:'1.5px solid #f0eefe', overflow:'hidden', boxShadow:'0 1px 4px rgba(109,40,217,.06)' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'linear-gradient(135deg,#faf5ff,#f5f3ff)', borderBottom:'1.5px solid #ede9fe' }}>
                    {['#', 'Student', 'Average', 'Position', 'Grade', 'Attendance', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding:'11px 14px', textAlign:'left', fontSize:11, fontWeight:700, color:'#6d28d9', textTransform:'uppercase', letterSpacing:'.06em', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {useMemo(() => (reports as any[]).map((r: any, i: number) => {
                    const g = getGradeInfo(r.average_score ?? 0)
                    return (
                      <tr key={r.id} className="rpt-row" style={{ borderBottom: i < reports.length-1 ? '1px solid #faf5ff' : 'none', transition:'background .12s', animation:`_rfadeUp .3s ease ${i*.02}s both` }}>
                        <td style={{ padding:'11px 14px', fontSize: i<3?18:13, fontWeight:700 }}>
                          {['🥇','🥈','🥉'][i] ?? `#${i+1}`}
                        </td>
                        <td style={{ padding:'11px 14px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                            <div style={{ width:30, height:30, borderRadius:'50%', background:'linear-gradient(135deg,#7c3aed,#6d28d9)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:'#fff', flexShrink:0 }}>
                              {r.student?.full_name?.charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontSize:13, fontWeight:700, color:'#111827' }}>{r.student?.full_name}</div>
                              <div style={{ fontSize:11, color:'#9ca3af' }}>{r.student?.student_id ?? '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding:'11px 14px' }}>
                          <span style={{ fontSize:15, fontWeight:800, color:g.color }}>{(r.average_score ?? 0).toFixed(1)}%</span>
                        </td>
                        <td style={{ padding:'11px 14px', fontSize:13, color:'#374151', fontWeight:500 }}>
                          {ordinal(r.overall_position ?? 0)} / {r.total_students}
                        </td>
                        <td style={{ padding:'11px 14px' }}>
                          <span style={{ width:28, height:28, borderRadius:8, background:g.color+'18', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:g.color }}>{g.grade}</span>
                        </td>
                        <td style={{ padding:'11px 14px' }}>
                          <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                            <button className="rpt-act" onClick={() => { setAttModal(r); setAttData({ total_days:'', days_present:'' }) }}
                              style={{ padding:'4px 8px', borderRadius:7, border:'1.5px solid #e5e7eb', background:'#f9fafb', fontSize:11, cursor:'pointer', transition:'all .15s', color:'#374151', fontWeight:500 }}>
                              📋 Att.
                            </button>
                            <button className="rpt-act" onClick={() => openFeesModal(r)}
                              style={{ padding:'4px 8px', borderRadius:7, border:'1.5px solid #fca5a5', background:'#fef2f2', fontSize:11, cursor:'pointer', transition:'all .15s', color:'#dc2626', fontWeight:600 }}>
                              💰 Fees
                            </button>
                          </div>
                        </td>
                        <td style={{ padding:'11px 14px' }}>
                          <span style={{ fontSize:11, fontWeight:800, padding:'3px 10px', borderRadius:99, background: r.is_approved ? '#f0fdf4' : '#fffbeb', color: r.is_approved ? '#16a34a' : '#d97706', border:`1px solid ${r.is_approved ? '#bbf7d0' : '#fde68a'}` }}>
                            {r.is_approved ? '✓ Approved' : '⏳ Pending'}
                          </span>
                        </td>
                        <td style={{ padding:'11px 12px' }}>
                          <div style={{ display:'flex', gap:4 }}>
                            <button className="rpt-act" title="View" onClick={() => setViewingReport(r)}
                              style={{ width:30, height:30, borderRadius:8, border:'none', background:'#f5f3ff', color:'#6d28d9', cursor:'pointer', fontSize:14, transition:'all .15s' }}>👁️</button>
                            <button className="rpt-act" title="Print" 
                              onClick={() => { setViewingReport(r); setTimeout(() => printSingle(r.student?.full_name??'', isBW), 700) }}
                              style={{ width:30, height:30, borderRadius:8, border:'none', background:'#f5f3ff', color:'#6d28d9', cursor:'pointer', fontSize:14, transition:'all .15s' }}>🖨️</button>
                            <button className="rpt-act" title="Download PDF" 
                              onClick={() => { setViewingReport(r); setTimeout(() => downloadPDF(r.student?.full_name??''), 700) }}
                              style={{ width:30, height:30, borderRadius:8, border:'none', background:'#f5f3ff', color:'#6d28d9', cursor:'pointer', fontSize:14, transition:'all .15s' }}>⬇️</button>
                            {!r.is_approved && (
                              <button className="rpt-act" title="Approve" onClick={() => approveReport.mutate(r.id)}
                                style={{ width:30, height:30, borderRadius:8, border:'none', background:'#f0fdf4', color:'#16a34a', cursor:'pointer', fontSize:14, transition:'all .15s' }}>✅</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  }), [reports, isBW])}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Hidden print areas ── */}
      <div id="single-report-print-area" style={{ display:'none' }}>
        {viewingReport && (
          <ReportCard report={viewingReport} school={school} term={term} year={year} settings={settings}
            isBW={isBW} setIsBW={setIsBW}
            showOverallPosition={showOverallPosition} onToggleOverallPosition={setShowOverallPosition}
            hideSettings={true}
            readonly />
        )}
      </div>
      <div id="bulk-report-print-area" style={{ display:'none' }}>
        {(reports as any[]).map((r: any, i: number) => (
          <div key={r.id} className={i < reports.length-1 ? 'page-break' : ''}>
            <ReportCard report={r} school={school} term={term} year={year} settings={settings}
              isBW={isBW} setIsBW={setIsBW}
              showOverallPosition={showOverallPosition} onToggleOverallPosition={setShowOverallPosition}
              hideSettings={true}
              readonly />
          </div>
        ))}
      </div>

      {/* ── Fees modal ── */}
      <Modal open={!!feesModal} onClose={() => setFeesModal(null)}
        title="Fees & Arrears"
        subtitle={feesModal?.student?.full_name}
        size="md"
        footer={
          <div style={{ display:'flex', gap:8 }}>
            <Btn variant="secondary" onClick={() => setFeesModal(null)}>Cancel</Btn>
            <Btn variant="danger" onClick={saveFees} loading={savingFees}>💾 Save Fees</Btn>
          </div>
        }>
        {feesModal && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#dc2626' }}>
              Enter the fee details for <strong>{feesModal.student?.full_name}</strong>. Outstanding balance will automatically appear on their report card.
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {[
                { label:'Total Fees (GH₵)', key:'fees_amount', placeholder:'e.g. 500' },
                { label:'Amount Paid (GH₵)', key:'fees_paid', placeholder:'e.g. 300' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#374151', marginBottom:5, textTransform:'uppercase', letterSpacing:'.05em' }}>{label}</label>
                  <input type="number" placeholder={placeholder}
                    value={(feesData as any)[key]}
                    onChange={e => {
                      const val = e.target.value
                      const newData = { ...feesData, [key]: val }
                      const arrears = Math.max(0, Number(newData.fees_amount||0) - Number(newData.fees_paid||0))
                      setFeesData({ ...newData, fees_arrears: arrears.toString() })
                    }}
                    style={{ width:'100%', padding:'9px 12px', borderRadius:9, border:'1.5px solid #e5e7eb', fontSize:13, outline:'none', fontFamily:'"DM Sans",sans-serif', boxSizing:'border-box' as any }} />
                </div>
              ))}
            </div>
            {feesData.fees_amount && feesData.fees_paid && (
              <div style={{ background: Number(feesData.fees_arrears) > 0 ? '#fef2f2' : '#f0fdf4', border:`1px solid ${Number(feesData.fees_arrears) > 0 ? '#fca5a5' : '#bbf7d0'}`, borderRadius:8, padding:'8px 12px', display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontSize:12, fontWeight:700, color: Number(feesData.fees_arrears) > 0 ? '#dc2626' : '#16a34a' }}>
                  {Number(feesData.fees_arrears) > 0 ? '⚠ Arrears' : '✓ Fully Paid'}
                </span>
                <span style={{ fontSize:13, fontWeight:800, color: Number(feesData.fees_arrears) > 0 ? '#dc2626' : '#16a34a' }}>
                  GH₵ {Number(feesData.fees_arrears).toFixed(2)}
                </span>
              </div>
            )}

            {/* Other fees */}
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <label style={{ fontSize:11, fontWeight:700, color:'#374151', textTransform:'uppercase', letterSpacing:'.05em' }}>Other Fees (Bus, Uniform, etc.)</label>
                <button onClick={() => setFeesData(f => ({ ...f, other_fees: [...f.other_fees, { label:'', amount:'', paid:'' }] }))}
                  style={{ padding:'4px 10px', borderRadius:7, border:'1.5px solid #ddd6fe', background:'#f5f3ff', color:'#6d28d9', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'"DM Sans",sans-serif' }}>
                  + Add
                </button>
              </div>
              {feesData.other_fees.map((f, i) => (
                <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 90px 90px 28px', gap:6, marginBottom:6, alignItems:'center' }}>
                  <input placeholder="e.g. Bus Fee" value={f.label}
                    onChange={e => { const arr=[...feesData.other_fees]; arr[i]={...arr[i],label:e.target.value}; setFeesData(d=>({...d,other_fees:arr})) }}
                    style={{ padding:'7px 10px', borderRadius:8, border:'1.5px solid #e5e7eb', fontSize:12, outline:'none', fontFamily:'"DM Sans",sans-serif' }}/>
                  <input type="number" placeholder="Amount" value={f.amount}
                    onChange={e => { const arr=[...feesData.other_fees]; arr[i]={...arr[i],amount:e.target.value}; setFeesData(d=>({...d,other_fees:arr})) }}
                    style={{ padding:'7px 10px', borderRadius:8, border:'1.5px solid #e5e7eb', fontSize:12, outline:'none', fontFamily:'"DM Sans",sans-serif' }}/>
                  <input type="number" placeholder="Paid" value={f.paid}
                    onChange={e => { const arr=[...feesData.other_fees]; arr[i]={...arr[i],paid:e.target.value}; setFeesData(d=>({...d,other_fees:arr})) }}
                    style={{ padding:'7px 10px', borderRadius:8, border:'1.5px solid #e5e7eb', fontSize:12, outline:'none', fontFamily:'"DM Sans",sans-serif' }}/>
                  <button onClick={() => setFeesData(d => ({ ...d, other_fees: d.other_fees.filter((_,j)=>j!==i) }))}
                    style={{ width:28, height:28, borderRadius:7, border:'none', background:'#fef2f2', color:'#dc2626', cursor:'pointer', fontSize:13 }}>🗑️</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Attendance modal ── */}
      <Modal open={!!attModal} onClose={() => setAttModal(null)}
        title="Record Attendance"
        subtitle={attModal?.student?.full_name}
        size="sm"
        footer={
          <div style={{ display:'flex', gap:8 }}>
            <Btn variant="secondary" onClick={() => setAttModal(null)}>Cancel</Btn>
            <Btn variant="success" onClick={saveAttendance} loading={savingAtt}>💾 Save</Btn>
          </div>
        }>
        {/* Attendance modal content */}
        {attModal && (
          <div style={{ display:'flex', flexDirection:'column', gap:14, padding:'4px 0' }}>
            <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#15803d', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                Attendance for <strong>{attModal.student?.full_name}</strong> — {(term as any)?.name}
              </div>
              <button
                onClick={syncFromRegister}
                disabled={fetchingAtt}
                style={{ background:'#fff', border:'1.5px solid #16a34a', color:'#16a34a', padding:'4px 10px', borderRadius:7, fontSize:11, fontWeight:700, cursor:'pointer', transition:'all .15s', display:'flex', alignItems:'center', gap:5 }}>
                {fetchingAtt ? '⏳...' : '🔄 Use Register'}
              </button>
            </div>
            {[
              { label:'Total School Days', key:'total_days', placeholder:'e.g. 65' },
              { label:'Days Present', key:'days_present', placeholder:'e.g. 60' },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#374151', marginBottom:5, textTransform:'uppercase', letterSpacing:'.05em' }}>{label}</label>
                <input type="number" placeholder={placeholder}
                  value={(attData as any)[key]}
                  onChange={e => setAttData(a => ({ ...a, [key]: e.target.value }))}
                  style={{ width:'100%', padding:'9px 12px', borderRadius:9, border:'1.5px solid #e5e7eb', fontSize:13, outline:'none', fontFamily:'"DM Sans",sans-serif', boxSizing:'border-box' }} />
              </div>
            ))}
            {attData.total_days && attData.days_present && (
              <div style={{ background:'#eff6ff', border:'1px solid #dbeafe', borderRadius:8, padding:'8px 12px', fontSize:12, color:'#1e40af', fontWeight:600 }}>
                Days Absent: {Math.max(0, Number(attData.total_days) - Number(attData.days_present))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── View individual report modal ── */}
      <Modal open={!!viewingReport && !bulkPreviewOpen} onClose={() => setViewingReport(null)}
        title="Report Card" subtitle={viewingReport?.student?.full_name} size="xl"
        footer={
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <Btn variant="secondary" onClick={() => setViewingReport(null)}>Close</Btn>
            {viewingReport && !viewingReport.is_approved && (
              <Btn variant="success" onClick={() => { approveReport.mutate(viewingReport.id); setViewingReport(null) }}>✅ Approve</Btn>
            )}
            <Btn variant="info" onClick={() => printSingle(viewingReport?.student?.full_name ?? '', isBW)}>🖨️ Print A4</Btn>
            <Btn variant="warning" onClick={() => downloadPDF(viewingReport?.student?.full_name ?? '')}>⬇️ Download PDF</Btn>
          </div>
        }>
        {viewingReport && (
          <ReportCard report={viewingReport} school={school} term={term} year={year} settings={settings}
            isBW={isBW} setIsBW={setIsBW}
            showOverallPosition={showOverallPosition} onToggleOverallPosition={setShowOverallPosition}
            onRemarksUpdate={remarks => updateRemarks.mutate({ reportId: viewingReport.id, remarks })} />
        )}
      </Modal>

      {/* ── Bulk preview modal ── */}
      <Modal open={bulkPreviewOpen} onClose={() => setBulkPreviewOpen(false)}
        title={`All Reports — ${selectedClassName}`}
        subtitle={`${reports.length} students · ${(term as any)?.name ?? ''}`}
        size="xl"
        footer={
          <div style={{ display:'flex', gap:8 }}>
            <Btn variant="secondary" onClick={() => setBulkPreviewOpen(false)}>Close</Btn>
            <Btn variant="info" onClick={() => { setBulkPreviewOpen(false); setTimeout(() => printBulk(selectedClassName, isBW), 300) }}>
              🖨️ Print All {reports.length} Reports
            </Btn>
          </div>
        }
      >
        <div style={{ display:'flex', flexDirection:'column', gap:32 }}>
          <div style={{ background: '#f9fafb', padding: '12px 18px', borderRadius: 12, border: '1px solid #e5e7eb', display: 'flex', gap: 20, alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#4b5563' }}>Bulk Settings:</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" checked={showOverallPosition} onChange={e => setShowOverallPosition(e.target.checked)} />
              <span>Show Rank / Position</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" checked={isBW} onChange={e => setIsBW(e.target.checked)} />
              <span>Black & White Mode</span>
            </label>
          </div>

          {(reports as any[]).map((r: any, i: number) => (
            <div key={r.id}>
              {i > 0 && <div style={{ height:2, background:'#f0eefe', marginBottom:32 }} />}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                <span style={{ fontSize:12, fontWeight:700, color:'#6d28d9', background:'#f5f3ff', padding:'3px 10px', borderRadius:99 }}>
                  {ordinal(i+1)} · {r.student?.full_name}
                </span>
                <button onClick={() => { setBulkPreviewOpen(false); setViewingReport(r); setTimeout(() => printSingle(r.student?.full_name??'', isBW), 700) }}
                  style={{ padding:'5px 12px', borderRadius:8, border:'none', background:'#f5f3ff', color:'#6d28d9', fontSize:12, fontWeight:600, cursor:'pointer' }}>🖨️ Print This</button>
              </div>
              <ReportCard report={r} school={school} term={term} year={year} settings={settings}
                isBW={isBW} setIsBW={setIsBW}
                showOverallPosition={showOverallPosition} onToggleOverallPosition={setShowOverallPosition}
                hideSettings={true}
                readonly />
            </div>
          ))}
        </div>
      </Modal>
    </>
  )
}

// ── Build HTML for export-all ─────────────────────────────
function buildClassHTML(reports: any[], className: string, school: any, term: any, year: any, settings: any, isBW: boolean = false, showOverallPosition: boolean = true): string {
  const GS = [{g:'A',min:80,c:'#16a34a'},{g:'B',min:70,c:'#2563eb'},{g:'C',min:60,c:'#7c3aed'},{g:'D',min:50,c:'#d97706'},{g:'E',min:40,c:'#ea580c'},{g:'F',min:0,c:'#dc2626'}]
  const getG = (n: number) => GS.find(g => n >= g.min) ?? GS[5]
  const ord = (n: number) => { const s=['th','st','nd','rd'],v=n%100; return n+(s[(v-20)%10]||s[v]||s[0]) }

  const cards = reports.map((r, idx) => {
    const scores = r._scores ?? []
    const att    = r._attendance
    const st     = r.student ?? {}
    const total  = scores.reduce((s: number, x: any) => s + (x.total_score ?? 0), 0)
    
    return `<div style="page-break-after:${idx<reports.length-1?'always':'auto'};padding:12px 16px;font-family:'DM Sans',sans-serif;max-width:800px;margin:0 auto;font-size:13.5px;color:#000;background:#fff;filter:${isBW?'grayscale(100%)':'none'}" class="rc-wrap">
      <div style="text-align:center;border-bottom:${isBW?'3px solid #000':'2.5px solid #1e3a8a'};padding-bottom:10px;margin-bottom:12px">
        ${(school?.logo_url)?`<img src="${school.logo_url}" style="height:48px;object-fit:contain;margin-bottom:4px;filter:${isBW?'grayscale(100%)':'none'}"/>`:'' }
        <div style="font-family:'Playfair Display',serif;font-size:18px;font-weight:700;color:${isBW?'#000':'#1e3a8a'}">${school?.name??'School'}</div>
        ${school?.motto?`<div style="font-size:10.5px;color:${isBW?'#000':'#64748b'};font-style:italic">${school.motto}</div>`:''}
        <div style="margin-top:7px;background:${isBW?'#000':'#1e3a8a'};color:#fff;padding:4px;border-radius:3px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em">
          Student Report Card — ${(term as any)?.name??''} · ${(year as any)?.name??''}
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px 14px;background:${isBW?'none':'#f8fafc'};border:${isBW?'1px solid #000':'.5px solid #e2e8f0'};border-radius:6px;padding:7px 10px;margin-bottom:10px;font-size:12px">
        ${[['Student Name',st.full_name],['Student ID',st.student_id??'—'],['Class',st.class?.name??className],['Gender',st.gender??'—'],['House',st.house??'—']].map(([l,v])=>`<div><span style="color:${isBW?'#000':'#64748b'};font-weight:700;font-size:10px">${l}:</span> <strong style="color:#000">${v}</strong></div>`).join('')}
      </div>
      ${att?`<div style="background:${isBW?'none':'#eff6ff'};border:${isBW?'1px solid #000':'.5px solid #dbeafe'};border-radius:5px;padding:6px 12px;margin-bottom:10px;font-size:12px;display:flex;gap:16px;font-weight:700">
        <span style="color:${isBW?'#000':'#1e40af'};font-weight:800;font-size:10px;text-transform:uppercase">Attendance</span>
        <span>Total: <strong>${att.total_days}</strong></span>
        <span>Present: <strong style="color:${isBW?'#000':'#16a34a'}">${att.days_present}</strong></span>
        <span>Absent: <strong style="color:${isBW?'#000':'#dc2626'}">${att.days_absent}</strong></span>
      </div>`:''}
      <table style="width:100%;border-collapse:collapse;margin-bottom:10px;border:${isBW?'1px solid #000':'none'}">
        <thead><tr style="background:${isBW?'#f1f5f9':'#1e3a8a'}">
          ${['Subject', 'Class', 'Exam', 'Total', 'Grade', ...(showOverallPosition ? ['Pos.'] : []), 'Remarks'].map(h=>`<th style="padding:4px 7px;color:${isBW?'#000':'#fff'};font-size:9.5px;font-weight:700;text-align:left;text-transform:uppercase;border:${isBW?'1px solid #000':'none'}">${h}</th>`).join('')}
        </tr></thead>
        <tbody>${scores.map((s:any, si:number)=>{
          const g = getG(s.total_score??0)
          return `<tr style="background:${(isBW? 'none' : (si%2===0?'#fff':'#f8fafc'))};border-bottom:${isBW?'1px solid #000':'.5px solid #e2e8f0'}">
            <td style="padding:4px 7px;font-size:12px;font-weight:700;color:#000;border-right:${isBW?'1px solid #000':'none'}">${s.subject?.name??'—'}</td>
            <td style="padding:4px 7px;font-size:11px;text-align:center;border-right:${isBW?'1px solid #000':'none'}">${s.class_score??'—'}</td>
            <td style="padding:4px 7px;font-size:11px;text-align:center;border-right:${isBW?'1px solid #000':'none'}">${s.exam_score??'—'}</td>
            <td style="padding:4px 7px;font-size:12px;text-align:center;font-weight:800;color:${isBW?'#000':((s.total_score??0)>=50?'#15803d':'#dc2626')};border-right:${isBW?'1px solid #000':'none'}">${s.total_score?.toFixed(1)??'—'}</td>
            <td style="padding:4px 7px;font-size:11px;text-align:center;font-weight:800;color:${isBW?'#000':g.c};border-right:${isBW?'1px solid #000':'none'}">${g.g}</td>
            ${showOverallPosition ? `<td style="padding:4px 7px;font-size:11px;text-align:center;border-right:${isBW?'1px solid #000':'none'}">${s.position?ord(s.position):'—'}</td>` : ''}
            <td style="padding:4px 7px;font-size:10px;color:${isBW?'#000':'#475569'}">${s.teacher_remarks??'—'}</td>
          </tr>`
        }).join('')}</tbody>
      </table>
      <div style="display:grid;grid-template-columns:repeat(${showOverallPosition ? 3 : 2},1fr);gap:8px;margin-bottom:10px">
        ${[
          ['Total Marks', total.toFixed(1)],
          ['Average', ((r.average_score??0).toFixed(1))+'%'],
          ...(showOverallPosition ? [['Position', r.overall_position?ord(r.overall_position)+' / '+r.total_students:'—']] : [])
        ].map(([l,v])=>`
        <div style="background:${isBW?'none':'#f8fafc'};border:${isBW?'1px solid #000':'.5px solid #e2e8f0'};border-radius:6px;padding:8px 10px;text-align:center">
          <div style="font-size:9.5px;color:${isBW?'#000':'#64748b'};font-weight:700;text-transform:uppercase;margin-bottom:2px">${l}</div>
          <div style="font-family:'Playfair Display',serif;font-size:16px;font-weight:800;color:${isBW?'#000':'#1e3a8a'}">${v}</div>
        </div>`).join('')}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
        ${[['Class Teacher\'s Remarks',r.class_teacher_remarks??'—'],['Headteacher\'s Remarks',r.headteacher_remarks??'—']].map(([l,v])=>`
        <div style="border:${isBW?'1px solid #000':'.5px solid #e2e8f0'};border-radius:6px;padding:8px 10px">
          <div style="font-size:10px;font-weight:800;color:${isBW?'#000':'#64748b'};text-transform:uppercase;margin-bottom:4px">${l}</div>
          <p style="font-size:11.5px;color:#000;font-weight:600;min-height:20px;margin:0">${v}</p>
          <div style="margin-top:12px;border-top:${isBW?'1px solid #000':'.5px solid #e2e8f0'};padding-top:4px;font-size:10px;color:${isBW?'#000':'#94a3b8'};font-weight:600">Signature: _____________________&nbsp; Date: _________</div>
        </div>`).join('')}
      </div>
      <div style="border-top:${isBW?'3px solid #000':'2px solid #1e3a8a'};padding-top:7px">
        ${(settings as any)?.next_term_date?`<p style="font-size:10px;font-weight:700;color:${isBW?'#000':'#1e3a8a'};margin-bottom:2px">📅 Next Term: ${(settings as any).next_term_date}</p>`:''}
        ${(settings as any)?.school_fees_info?`<p style="font-size:10px;color:#000;margin-bottom:2px;font-weight:600">💰 Fees Info: ${(settings as any).school_fees_info}</p>`:''}
        <p style="font-size:9px;color:${isBW?'#000':'#94a3b8'};margin-top:4px;text-align:center;font-weight:500">Generated by World Uni-Learn Report · ${school?.name??''} · ${(term as any)?.name??''} ${(year as any)?.name??''}</p>
      </div>
    </div>`
  }).join('')

  return `<!DOCTYPE html><html><head>
    <title>Reports – ${className}</title>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap"/>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'DM Sans',sans-serif;background:#fff}
      @media print{
        @page{size:A4 portrait;margin:8mm}
        body{padding:0}
        .rc-wrap { ${isBW ? 'filter: grayscale(100%) !important;' : ''} }
      }
    </style>
    </head><body>${cards}</body></html>`
}