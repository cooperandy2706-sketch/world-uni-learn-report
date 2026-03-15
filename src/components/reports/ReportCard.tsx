// src/components/reports/ReportCard.tsx
// A4-optimised: 210mm × 297mm @ 96dpi ≈ 794px × 1123px
// All font sizes, padding and spacing tuned to fit one page
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { getGradeInfo } from '../../utils/grading'
import { ordinal, formatDate } from '../../lib/utils'
import { TEACHER_REMARKS, HEADTEACHER_REMARKS } from '../../constants/remarks'
import { GRADE_SCALE } from '../../constants/grading'

interface ReportCardProps {
  report: any
  school: any
  term: any
  year: any
  settings: any
  readonly?: boolean
  onRemarksUpdate?: (remarks: { class_teacher_remarks?: string; headteacher_remarks?: string }) => void
}

export default function ReportCard({
  report, school, term, year, settings, readonly, onRemarksUpdate
}: ReportCardProps) {
  const [scores, setScores]       = useState<any[]>([])
  const [attendance, setAttendance] = useState<any>(null)
  const [teacherRemark, setTeacherRemark] = useState(report?.class_teacher_remarks ?? '')
  const [htRemark, setHtRemark]   = useState(report?.headteacher_remarks ?? '')

  useEffect(() => {
    // sync remarks when report prop changes (e.g. navigating between students)
    setTeacherRemark(report?.class_teacher_remarks ?? '')
    setHtRemark(report?.headteacher_remarks ?? '')
  }, [report?.id])

  useEffect(() => {
    if (report?.student_id && report?.term_id) load()
  }, [report?.student_id, report?.term_id])

  async function load() {
    const [{ data: sc }, { data: att }] = await Promise.all([
      supabase
        .from('scores')
        .select('*, subject:subjects(id,name,code)')
        .eq('student_id', report.student_id)
        .eq('term_id', report.term_id)
        .order('subject_id'),
      supabase
        .from('attendance')
        .select('*')
        .eq('student_id', report.student_id)
        .eq('term_id', report.term_id)
        .maybeSingle(),
    ])
    setScores(sc ?? [])
    setAttendance(att)
  }

  function fireRemarks() {
    onRemarksUpdate?.({ class_teacher_remarks: teacherRemark, headteacher_remarks: htRemark })
  }

  const student   = report?.student
  const classInfo = student?.class

  const totalMarks = scores.reduce((s, r) => s + (r.total_score ?? 0), 0)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');

        /* ── screen wrapper ── */
        .rc-wrap {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          color: #0f172a;
          background: #fff;
          max-width: 740px;
          margin: 0 auto;
          padding: 12px 16px;
          box-sizing: border-box;
        }

        /* ── table ── */
        .rc-table { width: 100%; border-collapse: collapse; }
        .rc-table th {
          background: #1e3a8a; color: #fff;
          padding: 5px 7px;
          text-align: left; font-size: 9.5px;
          font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;
          white-space: nowrap;
        }
        .rc-table td { padding: 4px 7px; border-bottom: 0.5px solid #e2e8f0; font-size: 11px; }
        .rc-table tr:nth-child(even) td { background: #f8fafc; }

        /* ── remark select ── */
        .rc-select {
          border: 1px solid #e2e8f0; border-radius: 5px;
          padding: 3px 6px; font-size: 11px;
          font-family: 'DM Sans', sans-serif;
          width: 100%; background: #fff; color: #0f172a;
        }

        /* ── PRINT ── */
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 8mm 8mm 8mm;
          }

          html, body { margin: 0 !important; padding: 0 !important; }

          /* hide everything except the report */
          body > *:not(.rc-print-root) { display: none !important; }

          .rc-print-root {
            display: block !important;
            width: 100%;
          }

          .rc-wrap {
            /* fill the printable area — 210mm - 16mm margins = 194mm */
            width: 194mm !important;
            max-width: 194mm !important;
            padding: 0 !important;
            margin: 0 !important;
            font-size: 10.5px !important;
          }

          /* tighten spacing in print */
          .rc-section-gap { margin-bottom: 6px !important; }
          .rc-table td, .rc-table th { padding: 3px 6px !important; }
          .rc-table td { font-size: 10px !important; }
          .rc-table th { font-size: 8.5px !important; }
          .rc-summary-tile { padding: 5px 8px !important; }
          .rc-summary-tile .rc-big { font-size: 14px !important; }
          .rc-remarks-box { padding: 6px 8px !important; }
          .rc-remarks-box .rc-sig { margin-top: 8px !important; }
          .rc-footer { padding-top: 6px !important; }
          .rc-grading-row span { font-size: 9.5px !important; }
          .no-print { display: none !important; }
          .rc-header-title { font-size: 16px !important; }
          .rc-sub-banner { font-size: 10px !important; padding: 3px 0 !important; }
          .rc-info-label { font-size: 9.5px !important; }
          .rc-info-value { font-size: 10.5px !important; }
          .rc-att-strip { padding: 4px 8px !important; font-size: 10px !important; }
        }
      `}</style>

      <div className="rc-wrap">

        {/* ══ HEADER ══════════════════════════════════════════ */}
        <div className="rc-section-gap" style={{ textAlign: 'center', borderBottom: '2.5px solid #1e3a8a', paddingBottom: 10, marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            {school?.logo_url
              ? <img src={school.logo_url} alt="logo" style={{ height: 52, width: 52, objectFit: 'contain', flexShrink: 0 }} />
              : <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🏫</div>
            }
            <div>
              <div className="rc-header-title" style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#1e3a8a', lineHeight: 1.2 }}>
                {school?.name ?? 'School Name'}
              </div>
              {school?.motto   && <div style={{ fontSize: 10.5, color: '#64748b', fontStyle: 'italic', marginTop: 1 }}>{school.motto}</div>}
              {school?.address && <div style={{ fontSize: 10, color: '#64748b' }}>{school.address}</div>}
              {(school?.phone || school?.email) && (
                <div style={{ fontSize: 10, color: '#64748b' }}>
                  {school.phone && `Tel: ${school.phone}`}
                  {school.phone && school.email && ' · '}
                  {school.email}
                </div>
              )}
            </div>
          </div>
          <div className="rc-sub-banner" style={{ marginTop: 8, background: '#1e3a8a', color: '#fff', padding: '4px 0', borderRadius: 3, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Student Report Card — {term?.name} &nbsp;·&nbsp; {year?.name}
          </div>
        </div>

        {/* ══ STUDENT INFO ════════════════════════════════════ */}
        <div className="rc-section-gap" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '3px 16px', marginBottom: 8, padding: '7px 10px', background: '#f8fafc', borderRadius: 6, border: '0.5px solid #e2e8f0' }}>
          {[
            { label: 'Student Name', value: student?.full_name ?? '—' },
            { label: 'Student ID',   value: student?.student_id ?? '—' },
            { label: 'Class',        value: classInfo?.name ?? '—' },
            { label: 'Gender',       value: student?.gender ? (student.gender === 'male' ? 'Male' : 'Female') : '—' },
            { label: 'House',        value: student?.house ?? '—' },
            { label: 'Date of Birth',value: formatDate(student?.date_of_birth) ?? '—' },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', gap: 4, alignItems: 'baseline' }}>
              <span className="rc-info-label" style={{ fontSize: 10, color: '#64748b', fontWeight: 600, flexShrink: 0, minWidth: 74 }}>{label}:</span>
              <span className="rc-info-value" style={{ fontSize: 11.5, fontWeight: 600, color: '#0f172a' }}>{value}</span>
            </div>
          ))}
        </div>

        {/* ══ ATTENDANCE ══════════════════════════════════════ */}
        {attendance && (
          <div className="rc-section-gap rc-att-strip" style={{ display: 'flex', gap: 18, marginBottom: 8, padding: '5px 10px', background: '#eff6ff', borderRadius: 5, border: '0.5px solid #dbeafe', fontSize: 11 }}>
            <span style={{ fontWeight: 700, color: '#1e40af', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', alignSelf: 'center' }}>Attendance</span>
            <span>Total Days: <strong>{attendance.total_days}</strong></span>
            <span>Days Present: <strong style={{ color: '#16a34a' }}>{attendance.days_present}</strong></span>
            <span>Days Absent: <strong style={{ color: '#dc2626' }}>{attendance.days_absent}</strong></span>
          </div>
        )}

        {/* ══ SCORES TABLE ════════════════════════════════════ */}
        <div className="rc-section-gap" style={{ marginBottom: 8 }}>
          <table className="rc-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th style={{ textAlign: 'center', width: 65 }}>Class Score<br /><span style={{ fontSize: 8, opacity: 0.8 }}>(50%)</span></th>
                <th style={{ textAlign: 'center', width: 65 }}>Exam Score<br /><span style={{ fontSize: 8, opacity: 0.8 }}>(50%)</span></th>
                <th style={{ textAlign: 'center', width: 55 }}>Total</th>
                <th style={{ textAlign: 'center', width: 46 }}>Grade</th>
                <th style={{ textAlign: 'center', width: 60 }}>Position</th>
                <th>Teacher's Remarks</th>
              </tr>
            </thead>
            <tbody>
              {scores.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: '#94a3b8', padding: 14 }}>No scores entered yet</td></tr>
              ) : scores.map(s => {
                const g = getGradeInfo(s.total_score ?? 0)
                return (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 500 }}>{s.subject?.name}</td>
                    <td style={{ textAlign: 'center' }}>{s.class_score ?? '—'}</td>
                    <td style={{ textAlign: 'center' }}>{s.exam_score ?? '—'}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: (s.total_score ?? 0) >= 50 ? '#15803d' : '#dc2626' }}>
                      {s.total_score?.toFixed(1) ?? '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ fontWeight: 700, color: g.color, background: g.color + '18', padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>
                        {g.grade}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', fontSize: 10 }}>{s.position ? ordinal(s.position) : '—'}</td>
                    <td style={{ fontSize: 10, color: '#64748b' }}>{s.teacher_remarks ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* ══ SUMMARY TILES ═══════════════════════════════════ */}
        <div className="rc-section-gap" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 8 }}>
          {[
            { label: 'Total Marks',      value: totalMarks.toFixed(1) },
            { label: 'Average Score',    value: `${(report?.average_score ?? 0).toFixed(1)}%` },
            { label: 'Overall Position', value: report?.overall_position ? `${ordinal(report.overall_position)} / ${report.total_students}` : '—' },
            { label: 'Overall Grade',    value: (() => { const g = getGradeInfo(report?.average_score ?? 0); return g.grade + ' — ' + g.label })() },
          ].map(({ label, value }) => (
            <div key={label} className="rc-summary-tile" style={{ background: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: 6, padding: '7px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</div>
              <div className="rc-big" style={{ fontFamily: '"Playfair Display",serif', fontSize: 15, fontWeight: 700, color: '#1e3a8a' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* ══ GRADING KEY ═════════════════════════════════════ */}
        <div className="rc-section-gap" style={{ marginBottom: 8, padding: '5px 10px', background: '#f8fafc', borderRadius: 5, border: '0.5px solid #e2e8f0' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Grading Scale</div>
          <div className="rc-grading-row" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {GRADE_SCALE.map(g => (
              <span key={g.grade} style={{ fontSize: 10.5 }}>
                <strong style={{ color: g.color }}>{g.grade}</strong>: {g.min}–{g.max} ({g.label})
              </span>
            ))}
          </div>
        </div>

        {/* ══ REMARKS ═════════════════════════════════════════ */}
        <div className="rc-section-gap" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
          {/* Class teacher */}
          <div className="rc-remarks-box" style={{ border: '0.5px solid #e2e8f0', borderRadius: 6, padding: '8px 10px' }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Class Teacher's Remarks</div>
            {readonly
              ? <p style={{ fontSize: 11, color: '#334155', minHeight: 20, margin: 0 }}>{teacherRemark || '—'}</p>
              : <select className="rc-select no-print" value={teacherRemark}
                  onChange={e => setTeacherRemark(e.target.value)}
                  onBlur={fireRemarks}>
                  <option value="">Select remark…</option>
                  {TEACHER_REMARKS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
            }
            <div className="rc-sig" style={{ marginTop: 14, borderTop: '0.5px solid #e2e8f0', paddingTop: 5, fontSize: 10, color: '#94a3b8' }}>
              Signature: &nbsp;___________________________ &nbsp;&nbsp; Date: ___________
            </div>
          </div>
          {/* Headteacher */}
          <div className="rc-remarks-box" style={{ border: '0.5px solid #e2e8f0', borderRadius: 6, padding: '8px 10px' }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Headteacher's Remarks</div>
            {readonly
              ? <p style={{ fontSize: 11, color: '#334155', minHeight: 20, margin: 0 }}>{htRemark || '—'}</p>
              : <select className="rc-select no-print" value={htRemark}
                  onChange={e => setHtRemark(e.target.value)}
                  onBlur={fireRemarks}>
                  <option value="">Select remark…</option>
                  {HEADTEACHER_REMARKS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
            }
            <div className="rc-sig" style={{ marginTop: 14, borderTop: '0.5px solid #e2e8f0', paddingTop: 5, fontSize: 10, color: '#94a3b8' }}>
              {school?.headteacher_name ?? 'Headteacher'}: &nbsp;___________________________ &nbsp;&nbsp; Date: ___________
            </div>
          </div>
        </div>

        {/* ══ FOOTER ══════════════════════════════════════════ */}
        <div className="rc-footer" style={{ borderTop: '2px solid #1e3a8a', paddingTop: 7 }}>
          <div style={{ display: 'grid', gridTemplateColumns: settings?.school_news ? '1fr 1fr' : '1fr', gap: 4 }}>
            <div>
              {settings?.next_term_date && (
                <p style={{ fontSize: 10.5, fontWeight: 600, color: '#1e3a8a', margin: '0 0 3px' }}>
                  📅 Next Term Begins: {formatDate(settings.next_term_date)}
                </p>
              )}
              {settings?.school_fees_info && (
                <p style={{ fontSize: 10, color: '#475569', margin: '0 0 2px' }}>
                  💰 <strong>Fees:</strong> {settings.school_fees_info}
                </p>
              )}
            </div>
            {settings?.school_news && (
              <div>
                <p style={{ fontSize: 10, color: '#475569', margin: 0 }}>
                  📢 <strong>News:</strong> {settings.school_news}
                </p>
              </div>
            )}
          </div>
          <p style={{ fontSize: 9, color: '#94a3b8', marginTop: 5, textAlign: 'center', borderTop: '0.5px solid #f1f5f9', paddingTop: 4 }}>
            Generated by World Uni-Learn Report &nbsp;·&nbsp; {school?.name} &nbsp;·&nbsp; {term?.name} {year?.name}
          </p>
        </div>

      </div>
    </>
  )
}