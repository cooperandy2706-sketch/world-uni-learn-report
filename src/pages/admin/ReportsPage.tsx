// src/pages/admin/ReportsPage.tsx
import { useState, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useClasses } from '../../hooks/useClasses'
import { useCurrentTerm, useCurrentAcademicYear, useSettings } from '../../hooks/useSettings'
import { useGenerateReports, useReportsByClassTerm, useApproveReport, useUpdateReportRemarks } from '../../hooks/useReports'
import { getGradeInfo } from '../../utils/grading'
import { ordinal } from '../../lib/utils'
import Modal from '../../components/ui/Modal'
import ReportCard from '../../components/reports/ReportCard'
import toast from 'react-hot-toast'

// ── helpers ───────────────────────────────────────────────
function Btn({ children, onClick, variant = 'primary', type = 'button', disabled, loading, style }: any) {
  const [hov, setHov] = useState(false)
  const v: Record<string, React.CSSProperties> = {
    primary:   { background: hov ? '#5b21b6' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', border: 'none', boxShadow: '0 2px 8px rgba(109,40,217,0.28)' },
    secondary: { background: hov ? '#f5f3ff' : '#fff', color: '#374151', border: '1.5px solid #e5e7eb' },
    success:   { background: hov ? '#15803d' : '#16a34a', color: '#fff', border: 'none' },
    warning:   { background: hov ? '#b45309' : 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', border: 'none' },
    info:      { background: hov ? '#0369a1' : 'linear-gradient(135deg,#0891b2,#0369a1)', color: '#fff', border: 'none' },
    danger:    { background: hov ? '#b91c1c' : '#dc2626', color: '#fff', border: 'none' },
    ghost:     { background: hov ? '#f5f3ff' : 'transparent', color: '#6d28d9', border: 'none' },
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.15s', opacity: disabled ? 0.6 : 1, fontFamily: '"DM Sans",sans-serif', ...v[variant], ...style }}>
      {loading && <span style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: '_rspn 0.7s linear infinite', flexShrink: 0 }} />}
      {children}
    </button>
  )
}

// ── Print single report ───────────────────────────────────
function printSingle(studentName: string) {
  const el = document.getElementById('single-report-print-area')
  if (!el) return
  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) { window.print(); return }
  win.document.write(`
    <!DOCTYPE html><html><head>
    <title>Report Card – ${studentName}</title>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap"/>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'DM Sans',sans-serif;background:#fff;padding:0}
      @media print{@page{margin:10mm}body{padding:0}}
    </style>
    </head><body>${el.innerHTML}</body></html>
  `)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print(); win.close() }, 600)
}

// ── Print bulk ────────────────────────────────────────────
function printBulk(className: string) {
  const el = document.getElementById('bulk-report-print-area')
  if (!el) return
  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) { window.print(); return }
  win.document.write(`
    <!DOCTYPE html><html><head>
    <title>Report Cards – ${className}</title>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap"/>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'DM Sans',sans-serif;background:#fff}
      .page-break{page-break-after:always;break-after:page}
      @media print{@page{margin:8mm}body{padding:0}}
    </style>
    </head><body>${el.innerHTML}</body></html>
  `)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print(); win.close() }, 800)
}

// ═══════════════════════════════════════════════════════════
export default function ReportsPage() {
  const { data: classes = [] } = useClasses()
  const { data: term } = useCurrentTerm()
  const { data: year } = useCurrentAcademicYear()
  const { data: settings } = useSettings()

  const [selectedClass, setSelectedClass] = useState('')
  const [viewingReport, setViewingReport] = useState<any>(null)
  const [classFocused, setClassFocused] = useState(false)
  const [bulkPreviewOpen, setBulkPreviewOpen] = useState(false)
  const [exportingAll, setExportingAll] = useState(false)
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number; className: string } | null>(null)

  const { data: reports = [], isLoading } = useReportsByClassTerm(selectedClass, term?.id ?? '')
  const generateReports = useGenerateReports()
  const approveReport = useApproveReport()
  const updateRemarks = useUpdateReportRemarks()

  const school = (settings as any)?.school
  const selectedClassName = classes.find(c => c.id === selectedClass)?.name ?? ''
  const approvedCount = (reports as any[]).filter((r: any) => r.is_approved).length
  const approvalPct = reports.length > 0 ? Math.round((approvedCount / reports.length) * 100) : 0

  async function handleGenerate() {
    if (!selectedClass || !term?.id || !year?.id) { toast.error('Select a class first'); return }
    await generateReports.mutateAsync({ classId: selectedClass, termId: term.id, academicYearId: year.id })
  }

  async function approveAll() {
    if (!confirm('Approve all pending reports in this class?')) return
    const pending = (reports as any[]).filter((r: any) => !r.is_approved)
    for (const r of pending) await approveReport.mutateAsync(r.id)
    toast.success(`${pending.length} reports approved`)
  }

  // ── Export all classes ────────────────────────────────────
  async function handleExportAll() {
    if (!term?.id || !year?.id) { toast.error('No active term'); return }
    if (!confirm('This will open a print window for each class. Continue?')) return

    setExportingAll(true)
    try {
      for (let ci = 0; ci < classes.length; ci++) {
        const cls = classes[ci]
        setExportProgress({ current: ci + 1, total: classes.length, className: cls.name })

        // Fetch reports for this class
        const { data: classReports } = await supabase
          .from('report_cards')
          .select('*, student:students(*, class:classes(id,name))')
          .eq('class_id', cls.id)
          .eq('term_id', term.id)
          .order('overall_position')

        if (!classReports || classReports.length === 0) continue

        // Fetch scores for each student
        const enriched = await Promise.all(classReports.map(async (r: any) => {
          const { data: scores } = await supabase
            .from('scores')
            .select('*, subject:subjects(id,name,code)')
            .eq('student_id', r.student_id)
            .eq('term_id', term.id)
          const { data: att } = await supabase
            .from('attendance')
            .select('*')
            .eq('student_id', r.student_id)
            .eq('term_id', term.id)
            .single()
          return { ...r, _scores: scores ?? [], _attendance: att }
        }))

        // Build HTML for this class
        const html = buildClassReportHTML(enriched, cls.name, school, term, year, settings)
        const win = window.open('', '_blank', 'width=900,height=700')
        if (win) {
          win.document.write(html)
          win.document.close()
          win.focus()
          await new Promise(res => setTimeout(res, 500))
          win.print()
        }

        // Pause between classes
        await new Promise(res => setTimeout(res, 1200))
      }
      toast.success(`Export complete — ${classes.length} classes`)
    } catch (e) {
      toast.error('Export failed')
    } finally {
      setExportingAll(false)
      setExportProgress(null)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _rspn { to{transform:rotate(360deg)} }
        @keyframes _rfadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes _rfadeIn { from{opacity:0} to{opacity:1} }
        .rpt-row:hover { background:#faf5ff !important; }
        .rpt-action:hover { background:#ede9fe !important; color:#5b21b6 !important; }
        @media print {
          .no-print { display:none !important; }
          .print-area { display:block !important; }
        }
      `}</style>

      <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif', animation: '_rfadeIn 0.4s ease' }}>

        {/* ── Header ── */}
        <div className="no-print" style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>Report Cards</h1>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 3 }}>Generate, approve, print and export GES-standard report cards</p>
          </div>
          {/* Export ALL button */}
          <Btn variant="warning" onClick={handleExportAll} loading={exportingAll}
            disabled={exportingAll || !term?.id}
            style={{ gap: 8 }}>
            📦 Export All Classes
          </Btn>
        </div>

        {/* ── Export progress overlay ── */}
        {exportProgress && (
          <div style={{ background: 'linear-gradient(135deg,#fffbeb,#fef3c7)', border: '1.5px solid #fde68a', borderRadius: 14, padding: '14px 20px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #fde68a', borderTopColor: '#f59e0b', animation: '_rspn 0.7s linear infinite', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>
                Exporting class {exportProgress.current} of {exportProgress.total}: <strong>{exportProgress.className}</strong>
              </p>
              <div style={{ marginTop: 6, height: 5, background: '#fde68a', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: Math.round((exportProgress.current / exportProgress.total) * 100) + '%', background: 'linear-gradient(90deg,#f59e0b,#fbbf24)', borderRadius: 99, transition: 'width 0.4s ease' }} />
              </div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#92400e', background: '#fde68a', padding: '4px 10px', borderRadius: 99 }}>
              {Math.round((exportProgress.current / exportProgress.total) * 100)}%
            </span>
          </div>
        )}

        {/* ── Controls card ── */}
        <div className="no-print" style={{ background: '#fff', borderRadius: 16, padding: '20px', border: '1.5px solid #f0eefe', marginBottom: 22, boxShadow: '0 1px 4px rgba(109,40,217,0.06)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-end' }}>

            <div style={{ flex: '1 1 220px' }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 5 }}>Select Class</label>
              <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
                onFocus={() => setClassFocused(true)} onBlur={() => setClassFocused(false)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 13, border: `1.5px solid ${classFocused ? '#7c3aed' : '#e5e7eb'}`, boxShadow: classFocused ? '0 0 0 3px rgba(109,40,217,0.1)' : 'none', outline: 'none', background: '#faf5ff', color: '#111827', fontFamily: '"DM Sans",sans-serif', cursor: 'pointer' }}>
                <option value="">Choose a class…</option>
                {(classes as any[]).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 5 }}>Term</label>
              <div style={{ height: 38, display: 'flex', alignItems: 'center' }}>
                {term ? (
                  <span style={{ fontSize: 12, fontWeight: 700, background: (term as any).is_locked ? '#fef2f2' : '#f5f3ff', color: (term as any).is_locked ? '#dc2626' : '#6d28d9', border: `1px solid ${(term as any).is_locked ? '#fecaca' : '#ddd6fe'}`, padding: '5px 12px', borderRadius: 99 }}>
                    {(term as any).is_locked ? '🔒' : '📆'} {(term as any).name} · {(year as any)?.name}
                  </span>
                ) : <span style={{ fontSize: 12, color: '#9ca3af' }}>No active term</span>}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', flexWrap: 'wrap' }}>
              <Btn onClick={handleGenerate} disabled={!selectedClass || !term?.id} loading={generateReports.isPending}>
                {(reports as any[]).length > 0 ? '🔄 Regenerate' : '⚡ Generate'}
              </Btn>
              {(reports as any[]).length > 0 && <>
                {approvedCount < reports.length && (
                  <Btn variant="success" onClick={approveAll}>✅ Approve All</Btn>
                )}
                <Btn variant="info" onClick={() => setBulkPreviewOpen(true)}>👁️ Preview All</Btn>
                <Btn variant="secondary" onClick={() => printBulk(selectedClassName)}>🖨️ Print Class</Btn>
              </>}
            </div>
          </div>
        </div>

        {/* ── No class selected ── */}
        {!selectedClass && (
          <div style={{ background: '#fff', borderRadius: 16, padding: '60px 20px', textAlign: 'center', border: '1.5px solid #f0eefe' }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>📄</div>
            <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 6 }}>Select a class to begin</h3>
            <p style={{ fontSize: 13, color: '#9ca3af' }}>Choose a class above to view, generate or print report cards.</p>
          </div>
        )}

        {/* ── Loading ── */}
        {selectedClass && isLoading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #ede9fe', borderTopColor: '#6d28d9', animation: '_rspn 0.8s linear infinite' }} />
            <p style={{ fontSize: 13, color: '#9ca3af' }}>Loading reports…</p>
          </div>
        )}

        {/* ── No reports yet ── */}
        {selectedClass && !isLoading && (reports as any[]).length === 0 && (
          <div style={{ background: '#fff', borderRadius: 16, padding: '60px 20px', textAlign: 'center', border: '1.5px solid #f0eefe' }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>📋</div>
            <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 6 }}>No reports for {selectedClassName}</h3>
            <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 18 }}>Generate reports to see results for this class.</p>
            <Btn onClick={handleGenerate} loading={generateReports.isPending}>⚡ Generate Now</Btn>
          </div>
        )}

        {/* ── Reports table ── */}
        {selectedClass && !isLoading && (reports as any[]).length > 0 && (
          <div className="no-print" style={{ animation: '_rfadeIn 0.4s ease' }}>

            {/* Summary bar */}
            <div style={{ background: '#fff', borderRadius: 14, padding: '14px 20px', border: '1.5px solid #f0eefe', marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center' }}>
              <div style={{ display: 'flex', flex: 1, gap: 24, flexWrap: 'wrap' }}>
                {[
                  { label: 'Class', value: selectedClassName },
                  { label: 'Students', value: reports.length },
                  { label: 'Approved', value: `${approvedCount} / ${reports.length}` },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{s.value}</div>
                  </div>
                ))}
                <div style={{ flex: 1, minWidth: 140 }}>
                  <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Approval Progress</div>
                  <div style={{ height: 7, background: '#f0eefe', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: approvalPct + '%', background: approvalPct === 100 ? 'linear-gradient(90deg,#16a34a,#22c55e)' : 'linear-gradient(90deg,#7c3aed,#a78bfa)', borderRadius: 99, transition: 'width 0.8s ease' }} />
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 3 }}>{approvalPct}% approved</div>
                </div>
              </div>
            </div>

            {/* Table */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', overflow: 'hidden', boxShadow: '0 1px 4px rgba(109,40,217,0.06)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg,#faf5ff,#f5f3ff)', borderBottom: '1.5px solid #ede9fe' }}>
                    {['Rank', 'Student', 'Average', 'Position', 'Grade', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(reports as any[]).map((r: any, i: number) => {
                    const g = getGradeInfo(r.average_score ?? 0)
                    const medals = ['🥇', '🥈', '🥉']
                    return (
                      <tr key={r.id} className="rpt-row"
                        style={{ borderBottom: i < reports.length - 1 ? '1px solid #faf5ff' : 'none', transition: 'background 0.12s', animation: `_rfadeUp 0.3s ease ${i * 0.025}s both` }}>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: i < 3 ? 18 : 13, fontWeight: 700 }}>{i < 3 ? medals[i] : `#${i + 1}`}</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                              {r.student?.full_name?.charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{r.student?.full_name}</div>
                              <div style={{ fontSize: 11, color: '#9ca3af' }}>{r.student?.student_id ?? '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: 15, fontWeight: 800, color: g.color }}>{(r.average_score ?? 0).toFixed(1)}%</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{ordinal(r.overall_position ?? 0)} / {r.total_students}</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ width: 28, height: 28, borderRadius: 8, background: g.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: g.color }}>{g.grade}</span>
                            <span style={{ fontSize: 11, color: '#6b7280' }}>{g.label}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 99, background: r.is_approved ? '#f0fdf4' : '#fffbeb', color: r.is_approved ? '#16a34a' : '#d97706', border: `1px solid ${r.is_approved ? '#bbf7d0' : '#fde68a'}` }}>
                            {r.is_approved ? '✓ Approved' : '⏳ Pending'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {/* View */}
                            <button className="rpt-action" title="View report"
                              onClick={() => setViewingReport(r)}
                              style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: '#f5f3ff', color: '#6d28d9', cursor: 'pointer', fontSize: 14, transition: 'all 0.15s' }}>
                              👁️
                            </button>
                            {/* Print individual */}
                            <button className="rpt-action" title="Print this report"
                              onClick={() => { setViewingReport(r); setTimeout(() => printSingle(r.student?.full_name ?? ''), 400) }}
                              style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: '#f5f3ff', color: '#6d28d9', cursor: 'pointer', fontSize: 14, transition: 'all 0.15s' }}>
                              🖨️
                            </button>
                            {/* Approve */}
                            {!r.is_approved && (
                              <button className="rpt-action" title="Approve"
                                onClick={() => approveReport.mutate(r.id)}
                                style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: '#f0fdf4', color: '#16a34a', cursor: 'pointer', fontSize: 14, transition: 'all 0.15s' }}>
                                ✅
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── HIDDEN print area for individual ── */}
        <div id="single-report-print-area" style={{ display: 'none' }}>
          {viewingReport && (
            <ReportCard
              report={viewingReport}
              school={school}
              term={term}
              year={year}
              settings={settings}
              readonly
            />
          )}
        </div>

        {/* ── HIDDEN print area for bulk ── */}
        <div id="bulk-report-print-area" style={{ display: 'none' }}>
          {(reports as any[]).map((r: any, i: number) => (
            <div key={r.id} className={i < reports.length - 1 ? 'page-break' : ''}>
              <ReportCard report={r} school={school} term={term} year={year} settings={settings} readonly />
            </div>
          ))}
        </div>

        {/* ── View individual modal ── */}
        <Modal
          open={!!viewingReport && !bulkPreviewOpen}
          onClose={() => setViewingReport(null)}
          title="Report Card"
          subtitle={viewingReport?.student?.full_name}
          size="xl"
          footer={
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Btn variant="secondary" onClick={() => setViewingReport(null)}>Close</Btn>
              {viewingReport && !viewingReport.is_approved && (
                <Btn variant="success" onClick={() => { approveReport.mutate(viewingReport.id); setViewingReport(null) }}>
                  ✅ Approve
                </Btn>
              )}
              <Btn variant="info" onClick={() => printSingle(viewingReport?.student?.full_name ?? '')}>
                🖨️ Print This Report
              </Btn>
            </div>
          }
        >
          {viewingReport && (
            <ReportCard
              report={viewingReport}
              school={school}
              term={term}
              year={year}
              settings={settings}
              onRemarksUpdate={remarks => updateRemarks.mutate({ reportId: viewingReport.id, remarks })}
            />
          )}
        </Modal>

        {/* ── Bulk preview modal ── */}
        <Modal
          open={bulkPreviewOpen}
          onClose={() => setBulkPreviewOpen(false)}
          title={`All Reports — ${selectedClassName}`}
          subtitle={`${reports.length} students · ${term ? (term as any).name : ''}`}
          size="xl"
          footer={
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn variant="secondary" onClick={() => setBulkPreviewOpen(false)}>Close</Btn>
              <Btn variant="info" onClick={() => { setBulkPreviewOpen(false); printBulk(selectedClassName) }}>
                🖨️ Print All {reports.length} Reports
              </Btn>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {(reports as any[]).map((r: any, i: number) => (
              <div key={r.id}>
                {i > 0 && <div style={{ height: 2, background: '#f0eefe', marginBottom: 32 }} />}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#6d28d9', background: '#f5f3ff', padding: '3px 10px', borderRadius: 99 }}>
                    {ordinal(i + 1)} · {r.student?.full_name}
                  </span>
                  <button
                    onClick={() => { setBulkPreviewOpen(false); setViewingReport(r); setTimeout(() => printSingle(r.student?.full_name ?? ''), 400) }}
                    style={{ padding: '5px 12px', borderRadius: 8, border: 'none', background: '#f5f3ff', color: '#6d28d9', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    🖨️ Print This
                  </button>
                </div>
                <ReportCard report={r} school={school} term={term} year={year} settings={settings} readonly />
              </div>
            ))}
          </div>
        </Modal>
      </div>
    </>
  )
}

// ── Build HTML string for export-all ─────────────────────
function buildClassReportHTML(reports: any[], className: string, school: any, term: any, year: any, settings: any): string {
  const GRADE_SCALE = [
    { grade: 'A', label: 'Excellent', min: 80, max: 100, color: '#16a34a' },
    { grade: 'B', label: 'Very Good', min: 70, max: 79, color: '#2563eb' },
    { grade: 'C', label: 'Good', min: 60, max: 69, color: '#7c3aed' },
    { grade: 'D', label: 'Credit', min: 50, max: 59, color: '#d97706' },
    { grade: 'E', label: 'Pass', min: 40, max: 49, color: '#ea580c' },
    { grade: 'F', label: 'Fail', min: 0, max: 39, color: '#dc2626' },
  ]

  function getGrade(score: number) {
    return GRADE_SCALE.find(g => score >= g.min && score <= g.max) ?? GRADE_SCALE[5]
  }

  function ordinalFn(n: number) {
    const s = ['th','st','nd','rd'], v = n % 100
    return n + (s[(v-20)%10] || s[v] || s[0])
  }

  const cards = reports.map((r, idx) => {
    const scores = r._scores ?? []
    const att = r._attendance
    const student = r.student ?? {}
    const totalMarks = scores.reduce((s: number, x: any) => s + (x.total_score ?? 0), 0)

    const rows = scores.map((s: any) => {
      const g = getGrade(s.total_score ?? 0)
      return `
        <tr style="background:${scores.indexOf(s) % 2 === 0 ? '#fff' : '#f8fafc'}">
          <td style="padding:5px 8px;font-size:12px;font-weight:500">${s.subject?.name ?? '—'}</td>
          <td style="padding:5px 8px;font-size:12px;text-align:center">${s.class_score ?? '—'}</td>
          <td style="padding:5px 8px;font-size:12px;text-align:center">${s.exam_score ?? '—'}</td>
          <td style="padding:5px 8px;font-size:12px;text-align:center;font-weight:700">${s.total_score ?? '—'}</td>
          <td style="padding:5px 8px;font-size:12px;text-align:center;font-weight:800;color:${g.color}">${g.grade}</td>
          <td style="padding:5px 8px;font-size:12px;text-align:center">${s.position ? ordinalFn(s.position) : '—'}</td>
          <td style="padding:5px 8px;font-size:11px;color:#64748b">${s.teacher_remarks ?? '—'}</td>
        </tr>`
    }).join('')

    return `
      <div style="page-break-after:${idx < reports.length - 1 ? 'always' : 'auto'};padding:16px;font-family:'DM Sans',sans-serif;max-width:760px;margin:0 auto">
        <!-- Header -->
        <div style="text-align:center;border-bottom:3px solid #0f4c81;padding-bottom:12px;margin-bottom:12px">
          ${school?.logo_url ? `<img src="${school.logo_url}" style="height:52px;object-fit:contain;margin-bottom:6px" />` : ''}
          <div style="font-family:'Playfair Display',serif;font-size:19px;font-weight:700;color:#0f4c81">${school?.name ?? 'School Name'}</div>
          ${school?.motto ? `<div style="font-size:11px;color:#64748b;font-style:italic">${school.motto}</div>` : ''}
          <div style="margin-top:8px;background:#0f4c81;color:#fff;padding:3px 0;border-radius:4px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase">
            Student Report Card — ${term?.name ?? ''} · ${year?.name ?? ''}
          </div>
        </div>
        <!-- Student info -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 20px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px;margin-bottom:12px;font-size:12px">
          ${[
            ['Student Name', student.full_name],
            ['Student ID', student.student_id ?? '—'],
            ['Class', student.class?.name ?? className],
            ['Gender', student.gender ?? '—'],
            ['House', student.house ?? '—'],
          ].map(([l, v]) => `<div><span style="color:#64748b;font-weight:600">${l}:</span> <strong>${v}</strong></div>`).join('')}
        </div>
        ${att ? `<div style="background:#eff6ff;border:1px solid #dbeafe;border-radius:6px;padding:6px 12px;margin-bottom:12px;font-size:11px;display:flex;gap:20px">
          <span style="color:#1e40af;font-weight:700">ATTENDANCE:</span>
          <span>Total: <strong>${att.total_days}</strong></span>
          <span>Present: <strong style="color:#16a34a">${att.days_present}</strong></span>
          <span>Absent: <strong style="color:#dc2626">${att.days_absent}</strong></span>
        </div>` : ''}
        <!-- Scores table -->
        <table style="width:100%;border-collapse:collapse;margin-bottom:12px">
          <thead>
            <tr style="background:#0f4c81">
              ${['Subject','Class Score (50%)','Exam Score (50%)','Total','Grade','Position','Remarks'].map(h => `<th style="padding:6px 8px;color:#fff;font-size:10px;font-weight:700;text-align:left;text-transform:uppercase;letter-spacing:0.04em">${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <!-- Summary -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:12px">
          ${[
            ['Total Marks', totalMarks.toFixed(1)],
            ['Average Score', (r.average_score ?? 0).toFixed(1) + '%'],
            ['Overall Position', r.overall_position ? ordinalFn(r.overall_position) + ' / ' + r.total_students : '—'],
          ].map(([l, v]) => `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:8px 12px;text-align:center">
            <div style="font-size:9px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.04em">${l}</div>
            <div style="font-family:'Playfair Display',serif;font-size:16px;font-weight:700;color:#0f4c81;margin-top:2px">${v}</div>
          </div>`).join('')}
        </div>
        <!-- Remarks -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
          <div style="border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px">
            <div style="font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Class Teacher's Remarks</div>
            <p style="font-size:12px;color:#334155;min-height:24px">${r.class_teacher_remarks ?? '—'}</p>
            <div style="margin-top:16px;border-top:1px solid #e2e8f0;padding-top:6px;font-size:10px;color:#64748b">Signature: _____________________</div>
          </div>
          <div style="border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px">
            <div style="font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Headteacher's Remarks</div>
            <p style="font-size:12px;color:#334155;min-height:24px">${r.headteacher_remarks ?? '—'}</p>
            <div style="margin-top:16px;border-top:1px solid #e2e8f0;padding-top:6px;font-size:10px;color:#64748b">${school?.headteacher_name ?? 'Headteacher'}: _____________________</div>
          </div>
        </div>
        <!-- Footer -->
        <div style="border-top:2px solid #0f4c81;padding-top:8px">
          ${settings?.next_term_date ? `<p style="font-size:11px;font-weight:600;color:#0f4c81;margin-bottom:3px">📅 Next Term Begins: ${settings.next_term_date}</p>` : ''}
          ${settings?.school_fees_info ? `<p style="font-size:10px;color:#475569;margin-bottom:3px">💰 <strong>Fees:</strong> ${settings.school_fees_info}</p>` : ''}
          ${settings?.school_news ? `<p style="font-size:10px;color:#475569">📢 <strong>News:</strong> ${settings.school_news}</p>` : ''}
          <p style="font-size:9px;color:#94a3b8;margin-top:6px;text-align:center">Generated by World Uni-Learn Report · ${school?.name ?? ''} · ${term?.name ?? ''} ${year?.name ?? ''}</p>
        </div>
      </div>`
  }).join('')

  return `<!DOCTYPE html><html><head>
    <title>Reports – ${className}</title>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap"/>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'DM Sans',sans-serif;background:#fff}
      @media print{@page{margin:8mm;size:A4}body{padding:0}}
    </style>
    </head><body>${cards}</body></html>`
}