// src/components/reports/BECEReportCard.tsx
import React from 'react'
import { getGradeInfo } from '../../utils/grading'

interface BECEReportCardProps {
  student: any
  school: any
  term: any
  year: any
  scores: any[]
  isBW?: boolean
}

export default function BECEReportCard({ student, school, term, year, scores, isBW = false }: BECEReportCardProps) {
  const T = {
    primary: isBW ? '#000' : '#1e3a8a',
    accent: isBW ? '#000' : '#b8832a',
    border: isBW ? '#000' : '#e2e8f0',
    text: '#000',
    muted: isBW ? '#000' : '#64748b',
    bg: isBW ? '#fff' : '#f8fafc',
  }

  // Filter to show only scores with data
  const validScores = scores.filter(s => s.class_score !== null || s.exam_score !== null)
  
  return (
    <div className="bece-report-card" style={{ 
      width: '100%', 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '40px', 
      background: '#fff', 
      fontFamily: '"DM Sans", sans-serif',
      color: T.text,
      boxSizing: 'border-box',
      pageBreakAfter: 'always',
      border: isBW ? '2px solid #000' : 'none'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&family=Playfair+Display:wght@700;900&display=swap');
        .bece-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .bece-table th { background: ${T.primary}; color: #fff; padding: 10px; font-size: 11px; text-transform: uppercase; text-align: left; border: 1px solid ${T.primary}; }
        .bece-table td { padding: 8px 10px; border: 1px solid ${T.border}; font-size: 13px; }
        .bece-header-line { height: 4px; background: ${T.accent}; margin: 15px 0; }
        @media print {
          .bece-report-card { padding: 0; }
          body { background: #fff; }
        }
      `}</style>

      {/* Official Header */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, marginBottom: 15 }}>
          {school?.logo_url && <img src={school.logo_url} alt="logo" style={{ height: 60, width: 60, objectFit: 'contain' }} />}
          <div style={{ textAlign: 'left' }}>
            <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 24, fontWeight: 900, color: T.primary, margin: 0, textTransform: 'uppercase' }}>
              {school?.name || 'School Name'}
            </h1>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: T.muted }}>{school?.address || 'P.O. Box 000, City, Country'}</p>
            <p style={{ margin: 0, fontSize: 11, color: T.muted }}>Tel: {school?.phone || 'N/A'} | Email: {school?.email || 'N/A'}</p>
          </div>
        </div>
        
        <div className="bece-header-line"></div>
        
        <h2 style={{ fontSize: 18, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', color: T.primary, margin: '15px 0' }}>
          BECE Continuous Assessment Record
        </h2>
        <p style={{ fontSize: 13, fontWeight: 700 }}>
          {term?.name} • {year?.name}
        </p>
      </div>

      {/* Student Meta */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px 30px', background: T.bg, padding: 20, borderRadius: 12, border: `1px solid ${T.border}` }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 800, color: T.muted, textTransform: 'uppercase', display: 'block' }}>Student Full Name</span>
          <span style={{ fontSize: 15, fontWeight: 700 }}>{student?.full_name}</span>
        </div>
        <div>
          <span style={{ fontSize: 11, fontWeight: 800, color: T.muted, textTransform: 'uppercase', display: 'block' }}>WAEC Index Number</span>
          <span style={{ fontSize: 15, fontWeight: 700 }}>{student?.student_id || 'NOT ASSIGNED'}</span>
        </div>
        <div>
          <span style={{ fontSize: 11, fontWeight: 800, color: T.muted, textTransform: 'uppercase', display: 'block' }}>Class / Form</span>
          <span style={{ fontSize: 15, fontWeight: 700 }}>{student?.class?.name}</span>
        </div>
        <div>
          <span style={{ fontSize: 11, fontWeight: 800, color: T.muted, textTransform: 'uppercase', display: 'block' }}>Gender</span>
          <span style={{ fontSize: 15, fontWeight: 700, textTransform: 'capitalize' }}>{student?.gender || 'N/A'}</span>
        </div>
      </div>

      {/* Scores Table */}
      <table className="bece-table">
        <thead>
          <tr>
            <th style={{ width: '40%' }}>Subject</th>
            <th style={{ textAlign: 'center' }}>SBA (30%)</th>
            <th style={{ textAlign: 'center' }}>Exam (70%)</th>
            <th style={{ textAlign: 'center' }}>Total (100)</th>
            <th style={{ textAlign: 'center' }}>Grade</th>
          </tr>
        </thead>
        <tbody>
          {validScores.length > 0 ? validScores.map(s => {
            const total = (Number(s.class_score) || 0) + (Number(s.exam_score) || 0)
            const g = getGradeInfo(total)
            return (
              <tr key={s.id}>
                <td style={{ fontWeight: 700 }}>{s.subject?.name}</td>
                <td style={{ textAlign: 'center' }}>{s.class_score ?? '—'}</td>
                <td style={{ textAlign: 'center' }}>{s.exam_score ?? '—'}</td>
                <td style={{ textAlign: 'center', fontWeight: 800 }}>{total.toFixed(1)}</td>
                <td style={{ textAlign: 'center' }}>
                  <span style={{ 
                    padding: '2px 8px', borderRadius: 4, background: isBW ? '#eee' : g.color + '20', 
                    color: isBW ? '#000' : g.color, fontWeight: 800, fontSize: 12 
                  }}>
                    {g.grade}
                  </span>
                </td>
              </tr>
            )
          }) : (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', padding: 40, color: T.muted }}>
                No assessment data available for this student.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Summary Section */}
      <div style={{ marginTop: 30, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ border: `1px solid ${T.border}`, padding: 15, borderRadius: 10 }}>
          <h4 style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: T.muted }}>Principal's Remarks</h4>
          <p style={{ fontSize: 12, margin: 0, minHeight: 40, fontStyle: 'italic' }}>
            {/* Logic for overall performance remark could go here */}
            Exemplary performance across all subjects. Keep up the hard work.
          </p>
          <div style={{ marginTop: 15, borderTop: `1px solid ${T.border}`, paddingTop: 5, textAlign: 'right' }}>
            <span style={{ fontSize: 10, color: T.muted }}>Signature & Stamp</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
          <div style={{ background: T.primary, color: '#fff', padding: 12, borderRadius: 10, textAlign: 'center' }}>
            <span style={{ fontSize: 10, textTransform: 'uppercase', opacity: 0.8, display: 'block' }}>Aggregate Score</span>
            <span style={{ fontSize: 24, fontWeight: 900 }}>
              {/* Calculate aggregate (best 6 subjects logic usually) */}
              {validScores.length > 0 ? (validScores.reduce((acc, s) => acc + (s.total_score || 0), 0) / validScores.length).toFixed(1) : '0.0'}
            </span>
          </div>
          <div style={{ border: `1px solid ${T.border}`, padding: 10, borderRadius: 10, fontSize: 10, color: T.muted }}>
            <p style={{ margin: 0 }}><b>Grade Key:</b> A1: 80-100 (Excellent) | B2: 70-79 (Very Good) | B3: 60-69 (Good) | C4-C6: 45-59 (Credit) | D7-E8: 35-44 (Pass) | F9: 0-34 (Fail)</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 40, textAlign: 'center', borderTop: `1px solid ${T.border}`, paddingTop: 10, fontSize: 10, color: T.muted }}>
        This document is an official continuous assessment record generated by {school?.name || 'the school'}.
      </div>
    </div>
  )
}
