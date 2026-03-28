// src/lib/pdf.ts
// Two export functions:
//   printReportCard  – opens a new window and triggers window.print()
//   downloadReportPDF – renders the report card DOM node to a PDF blob and triggers download
//
// Install peer deps if not already present:
//   npm install jspdf html2canvas

import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

// ─────────────────────────────────────────────
// 1.  Print via new window  (A4, clean styles)
// ─────────────────────────────────────────────
export function printReportCard(studentName: string, htmlContent: string): void {
  const win = window.open('', '_blank', 'width=900,height=750')
  if (!win) {
    alert('Pop-up blocked. Please allow pop-ups for this site and try again.')
    return
  }

  win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Report Card – ${sanitize(studentName)}</title>
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap"
  />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'DM Sans', system-ui, sans-serif;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @page { size: A4 portrait; margin: 10mm; }
    @media print {
      body { padding: 0; }
      /* remove browser header/footer chrome */
      html { margin: 0; }
    }
  </style>
</head>
<body>
${htmlContent}
</body>
</html>`)

  win.document.close()
  win.focus()

  // Wait for fonts/images then print
  win.onload = () => {
    setTimeout(() => {
      win.print()
      win.close()
    }, 600)
  }
  // Fallback if onload never fires (some browsers)
  setTimeout(() => {
    try { win.print(); win.close() } catch (_) { /* already closed */ }
  }, 1800)
}

// ─────────────────────────────────────────────
// 2.  Download PDF  (html2canvas → jsPDF)
// ─────────────────────────────────────────────
export async function downloadReportPDF(
  elementId: string,
  fileName: string,
  onProgress?: (msg: string) => void
): Promise<void> {
  const el = document.getElementById(elementId)
  if (!el) {
    console.error(`[downloadReportPDF] Element #${elementId} not found`)
    return
  }

  onProgress?.('Preparing report…')

  // Temporarily make visible if hidden (for hidden print area)
  const wasHidden = el.style.display === 'none' || getComputedStyle(el).display === 'none'
  const parent = el.parentElement as HTMLElement | null
  const parentWasHidden = parent ? (parent.style.display === 'none') : false

  if (wasHidden) el.style.display = 'block'
  if (parentWasHidden && parent) parent.style.display = 'block'

  try {
    onProgress?.('Rendering pages…')

    const canvas = await html2canvas(el, {
      scale: 2,               // retina quality
      useCORS: true,          // allow cross-origin images (school logo)
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 794,       // A4 @ 96 dpi
    })

    onProgress?.('Building PDF…')

    const imgData = canvas.toDataURL('image/jpeg', 0.95)

    // A4 dimensions in mm
    const A4_W = 210
    const A4_H = 297

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    })

    // Scale image to fit A4 width, allow multi-page if taller
    const imgW = A4_W
    const imgH = (canvas.height * A4_W) / canvas.width

    let yOffset = 0
    let remaining = imgH

    while (remaining > 0) {
      if (yOffset > 0) pdf.addPage()

      const pageHeight = Math.min(remaining, A4_H)
      const srcY = ((imgH - remaining) / imgH) * canvas.height
      const srcH = (pageHeight / imgH) * canvas.height

      // Crop the canvas slice for this page
      const pageCanvas = document.createElement('canvas')
      pageCanvas.width = canvas.width
      pageCanvas.height = srcH
      const ctx = pageCanvas.getContext('2d')!
      ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH)

      const pageData = pageCanvas.toDataURL('image/jpeg', 0.95)
      pdf.addImage(pageData, 'JPEG', 0, 0, imgW, pageHeight)

      remaining -= A4_H
      yOffset += A4_H
    }

    onProgress?.('Saving file…')
    pdf.save(`${sanitizeFileName(fileName)}.pdf`)
  } finally {
    // Restore visibility
    if (wasHidden) el.style.display = 'none'
    if (parentWasHidden && parent) parent.style.display = 'none'
  }
}

// ─────────────────────────────────────────────
// 3.  Build printable HTML string
//     (same output as before, kept here so
//      ReportsPage only imports from one place)
// ─────────────────────────────────────────────
interface BuildHTMLOptions {
  student: any
  scores: any[]
  attendance: any
  reportCard: any
  school: any
  term: any
  year: any
  settings: any
  teacherRemark: string
  htRemark: string
  className: string
}

export function buildReportHTML({
  student,
  scores,
  attendance,
  reportCard,
  school,
  term,
  year,
  settings,
  teacherRemark,
  htRemark,
  className,
}: BuildHTMLOptions): string {
  const GRADES = [
    { g: 'A', label: 'Excellent', min: 80, c: '#16a34a' },
    { g: 'B', label: 'Very Good', min: 70, c: '#2563eb' },
    { g: 'C', label: 'Good',      min: 60, c: '#7c3aed' },
    { g: 'D', label: 'Credit',    min: 50, c: '#d97706' },
    { g: 'E', label: 'Pass',      min: 40, c: '#ea580c' },
    { g: 'F', label: 'Fail',      min: 0,  c: '#dc2626' },
  ]

  const getG = (n: number) => GRADES.find(g => n >= g.min) ?? GRADES[5]
  const ord = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd']
    const v = n % 100
    return n + (s[(v - 20) % 10] || s[v] || s[0])
  }

  const avg =
    scores.length > 0
      ? scores.reduce((s, sc) => s + (sc.total_score ?? 0), 0) / scores.length
      : 0
  const og = getG(avg)

  const rows = scores
    .map((sc, i) => {
      const g = getG(sc.total_score ?? 0)
      return `
      <tr style="background:${i % 2 === 0 ? '#fff' : '#f8fafc'}">
        <td style="padding:5px 9px;font-size:12px">${esc(sc.subject?.name ?? '—')}</td>
        <td style="padding:5px 9px;font-size:12px;text-align:center">${sc.class_score ?? '—'}</td>
        <td style="padding:5px 9px;font-size:12px;text-align:center">${sc.exam_score ?? '—'}</td>
        <td style="padding:5px 9px;font-size:12px;text-align:center;font-weight:700">${sc.total_score?.toFixed(1) ?? '—'}</td>
        <td style="padding:5px 9px;font-size:12px;text-align:center;font-weight:800;color:${g.c}">${g.g}</td>
        <td style="padding:5px 9px;font-size:12px;text-align:center">${sc.position ? ord(sc.position) : '—'}</td>
        <td style="padding:5px 9px;font-size:11px;color:#64748b">${esc(sc.teacher_remarks ?? '—')}</td>
      </tr>`
    })
    .join('')

  const logoHtml = school?.logo_url
    ? `<img src="${esc(school.logo_url)}" alt="logo" style="height:56px;width:56px;object-fit:contain;border-radius:50%;flex-shrink:0"/>`
    : `<div style="width:56px;height:56px;border-radius:50%;background:#eff6ff;display:inline-flex;align-items:center;justify-content:center;font-size:24px">🏫</div>`

  const attHtml = attendance
    ? `<div style="background:#eff6ff;border:1px solid #dbeafe;border-radius:6px;padding:6px 14px;margin-bottom:12px;font-size:11px;display:flex;gap:20px;align-items:center">
        <span style="color:#1e40af;font-weight:700">ATTENDANCE:</span>
        <span>Total: <strong>${attendance.total_days}</strong></span>
        <span>Present: <strong style="color:#16a34a">${attendance.days_present}</strong></span>
        <span>Absent: <strong style="color:#dc2626">${attendance.days_absent}</strong></span>
      </div>`
    : ''

  const summaryCards = [
    ['Average', avg > 0 ? `${avg.toFixed(1)}%` : '—'],
    ['Grade', og.g + ' — ' + og.label],
    ['Position', reportCard?.overall_position ? `${ord(reportCard.overall_position)} / ${reportCard.total_students}` : '—'],
  ]
    .map(
      ([l, v]) =>
        `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:9px;padding:9px;text-align:center">
          <div style="font-size:9px;color:#64748b;font-weight:700;text-transform:uppercase;margin-bottom:3px">${l}</div>
          <div style="font-size:15px;font-weight:700;color:#1e3a8a">${v}</div>
        </div>`
    )
    .join('')

  const footerHtml = `
  <div style="border-top:2px solid #1e3a8a;padding-top:8px;margin-top:4px">
    <div style="display:grid;grid-template-columns:${settings?.school_news ? '1fr 1fr' : '1fr'};gap:6px">
      <div>
        ${settings?.next_term_date ? `<p style="font-size:10.5px;font-weight:600;color:#1e3a8a;margin:0 0 4px">📅 Next Term: ${esc(settings.next_term_date)}</p>` : ''}
        ${settings?.school_fees_info ? `<p style="font-size:10px;color:#475569;margin:0 0 3px">💰 <strong>Fees:</strong> ${esc(settings.school_fees_info)}</p>` : ''}
      </div>
      ${settings?.school_news ? `<div><p style="font-size:10px;color:#475569;margin:0">📢 <strong>News:</strong> ${esc(settings.school_news)}</p></div>` : ''}
    </div>
    <p style="font-size:9px;color:#94a3b8;margin-top:6px;text-align:center;border-top:0.5px solid #f1f5f9;padding-top:5px">
      Generated by World Uni-Learn Report · ${esc(school?.name ?? '')} · ${esc(term?.name ?? '')} ${esc(year?.name ?? '')}
    </p>
  </div>`

  return `
<div style="font-family:'DM Sans',system-ui,sans-serif;padding:20px;max-width:760px;margin:0 auto;background:#fff;color:#1e293b">

  <!-- HEADER -->
  <div style="text-align:center;border-bottom:3px solid #1e3a8a;padding-bottom:14px;margin-bottom:14px">
    <div style="display:flex;align-items:center;justify-content:center;gap:14px">
      ${logoHtml}
      <div style="text-align:left">
        <div style="font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:#1e3a8a;line-height:1.2">${esc(school?.name ?? 'School Name')}</div>
        ${school?.motto ? `<div style="font-size:10.5px;color:#64748b;font-style:italic;margin-top:2px">${esc(school.motto)}</div>` : ''}
        ${school?.address ? `<div style="font-size:10px;color:#64748b">${esc(school.address)}</div>` : ''}
        ${school?.phone || school?.email ? `<div style="font-size:10px;color:#64748b">${school?.phone ? `Tel: ${esc(school.phone)}` : ''}${school?.phone && school?.email ? ' · ' : ''}${school?.email ? esc(school.email) : ''}</div>` : ''}
      </div>
    </div>
    <div style="margin-top:10px;background:#1e3a8a;color:#fff;padding:5px;border-radius:4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em">
      Student Report Card — ${esc(term?.name ?? '')} · ${esc(year?.name ?? '')}
    </div>
  </div>

  <!-- STUDENT INFO -->
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px 20px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px;margin-bottom:12px;font-size:12px">
    <div><span style="color:#64748b;font-weight:600">Name: </span><strong>${esc(student?.full_name ?? '—')}</strong></div>
    <div><span style="color:#64748b;font-weight:600">ID: </span><strong>${esc(student?.student_id ?? '—')}</strong></div>
    <div><span style="color:#64748b;font-weight:600">Class: </span><strong>${esc(className)}</strong></div>
    <div><span style="color:#64748b;font-weight:600">Gender: </span><strong>${esc(student?.gender ?? '—')}</strong></div>
    <div><span style="color:#64748b;font-weight:600">House: </span><strong>${esc(student?.house ?? '—')}</strong></div>
  </div>

  ${attHtml}

  <!-- SCORES TABLE -->
  ${
    scores.length > 0
      ? `<table style="width:100%;border-collapse:collapse;margin-bottom:12px;font-size:12px">
    <thead>
      <tr style="background:#1e3a8a">
        ${['Subject', 'Class Score', 'Exam Score', 'Total', 'Grade', 'Position', 'Remarks']
          .map(h => `<th style="padding:6px 9px;color:#fff;font-size:10px;font-weight:700;text-align:left;text-transform:uppercase;letter-spacing:.05em">${h}</th>`)
          .join('')}
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`
      : `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;margin-bottom:12px;font-size:12px;color:#92400e">⚠️ No scores recorded for this term.</div>`
  }

  <!-- SUMMARY -->
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:12px">
    ${summaryCards}
  </div>

  <!-- REMARKS -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
    <div style="border:1px solid #e2e8f0;border-radius:9px;padding:12px">
      <div style="font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;margin-bottom:5px">Class Teacher's Remarks</div>
      <p style="font-size:12px;color:#334155;min-height:22px;margin:0">${esc(teacherRemark || '—')}</p>
      <div style="margin-top:14px;border-top:1px solid #e2e8f0;padding-top:5px;font-size:10px;color:#94a3b8">Signature: _____________________</div>
    </div>
    <div style="border:1px solid #e2e8f0;border-radius:9px;padding:12px">
      <div style="font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;margin-bottom:5px">Headteacher's Remarks</div>
      <p style="font-size:12px;color:#334155;min-height:22px;margin:0">${esc(htRemark || '—')}</p>
      <div style="margin-top:14px;border-top:1px solid #e2e8f0;padding-top:5px;font-size:10px;color:#94a3b8">${esc(school?.headteacher_name ?? 'Headteacher')}: _____________________</div>
    </div>
  </div>

  ${footerHtml}
</div>`
}

// ─── helpers ────────────────────────────────────────────────────────────────
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function sanitize(s: string): string {
  return s.replace(/[<>"'&]/g, '')
}

function sanitizeFileName(s: string): string {
  return s.replace(/[^a-z0-9_\-. ]/gi, '_').trim()
}