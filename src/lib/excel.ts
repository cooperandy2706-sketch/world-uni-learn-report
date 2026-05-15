// src/lib/excel.ts
// Excel export utilities using the xlsx library (already a project dependency).
// Use these helpers to offer one-click spreadsheet downloads from any page.

import * as XLSX from 'xlsx'

/** Generic export: takes a 2D array (rows of cells) and downloads as .xlsx */
export function exportToExcel(rows: (string | number | null | undefined)[][], fileName = 'export') {
  const ws = XLSX.utils.aoa_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  XLSX.writeFile(wb, `${fileName}.xlsx`)
}

/** Export an array of objects (records) using their keys as column headers */
export function exportRecordsToExcel<T extends Record<string, any>>(
  records: T[],
  fileName = 'export',
  columnMap?: Partial<Record<keyof T, string>>
) {
  if (!records.length) return

  const keys = Object.keys(records[0]) as (keyof T)[]
  const headers = keys.map(k => (columnMap?.[k] as string) ?? String(k))
  const rows = records.map(r => keys.map(k => r[k] ?? ''))

  exportToExcel([headers, ...rows], fileName)
}

/** Export student list: id, name, class, gender, guardian, status */
export function exportStudentsToExcel(
  students: {
    student_id?: string
    full_name: string
    class_name?: string
    gender?: string
    guardian_name?: string
    guardian_phone?: string
    is_active?: boolean
  }[],
  fileName = 'students'
) {
  const rows: (string | number)[][] = [
    ['Student ID', 'Full Name', 'Class', 'Gender', 'Guardian Name', 'Guardian Phone', 'Status'],
    ...students.map(s => [
      s.student_id ?? '',
      s.full_name,
      s.class_name ?? '',
      s.gender ?? '',
      s.guardian_name ?? '',
      s.guardian_phone ?? '',
      s.is_active ? 'Active' : 'Inactive',
    ]),
  ]
  exportToExcel(rows, fileName)
}

/** Export fee payments: student, class, amount, date, method */
export function exportFeesToExcel(
  payments: {
    student_name?: string
    class_name?: string
    amount_paid: number
    payment_date: string
    payment_method?: string
    reference?: string
  }[],
  fileName = 'fee_payments'
) {
  const rows: (string | number)[][] = [
    ['Student', 'Class', 'Amount (GH₵)', 'Payment Date', 'Method', 'Reference'],
    ...payments.map(p => [
      p.student_name ?? '',
      p.class_name ?? '',
      p.amount_paid,
      p.payment_date,
      p.payment_method ?? '',
      p.reference ?? '',
    ]),
  ]
  exportToExcel(rows, fileName)
}

/** Export score/grade sheet: student, class, scores per subject, average */
export function exportScoresToExcel(
  data: {
    student_name: string
    class_name: string
    scores: { subject: string; total: number }[]
    average: number
  }[],
  fileName = 'scores'
) {
  if (!data.length) return

  // Build dynamic column headers from all subjects encountered
  const subjectSet = new Set<string>()
  data.forEach(d => d.scores.forEach(s => subjectSet.add(s.subject)))
  const subjects = Array.from(subjectSet).sort()

  const headers = ['Student', 'Class', ...subjects, 'Average']
  const rows = data.map(d => {
    const scoreMap: Record<string, number> = {}
    d.scores.forEach(s => { scoreMap[s.subject] = s.total })
    return [d.student_name, d.class_name, ...subjects.map(s => scoreMap[s] ?? ''), d.average.toFixed(1)]
  })

  exportToExcel([headers, ...rows], fileName)
}
