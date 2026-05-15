// src/utils/calculations.ts
// Shared financial calculation helpers — extracted from repeated logic in
// DashboardPage, BillingPage, and FeesPage to avoid duplication.

/** Net tuition after applying scholarship percentage */
export function applyScholarship(grossAmount: number, scholarshipPct: number): number {
  const pct = Math.min(100, Math.max(0, scholarshipPct || 0))
  return grossAmount * (1 - pct / 100)
}

/** Outstanding tuition: net fee minus amount already paid */
export function tuitionOwed(
  grossAmount: number,
  scholarshipPct: number,
  amountPaid: number
): number {
  return Math.max(0, applyScholarship(grossAmount, scholarshipPct) - (amountPaid || 0))
}

/** Daily fee owed for a student based on attendance days and configured rates */
export function dailyFeeOwed(
  daysPresent: number,
  feedingRatePerDay: number,
  studiesRatePerDay: number,
  dailyFeeMode: 'all' | 'feeding' | 'none' | string,
  paidFeeding: number,
  paidStudies: number
): number {
  const expectedFeeding = dailyFeeMode === 'none' ? 0 : feedingRatePerDay * daysPresent
  const expectedStudies =
    dailyFeeMode === 'none' || dailyFeeMode === 'feeding' ? 0 : studiesRatePerDay * daysPresent
  return (
    Math.max(0, expectedFeeding - (paidFeeding || 0)) +
    Math.max(0, expectedStudies - (paidStudies || 0))
  )
}

/** Total outstanding balance: tuition owed + daily fees owed + historical arrears */
export function totalOutstanding(
  tuitionOwedAmt: number,
  dailyOwedAmt: number,
  feesArrears: number
): number {
  return Math.max(0, tuitionOwedAmt + dailyOwedAmt + (feesArrears || 0))
}

/** Calculate average of an array of numbers, returns 0 for empty arrays */
export function safeAverage(values: number[]): number {
  if (!values.length) return 0
  return values.reduce((s, v) => s + v, 0) / values.length
}

/** Compute pass rate (score >= threshold) as a percentage 0–100 */
export function passRate(scores: number[], passThreshold = 50): number {
  if (!scores.length) return 0
  return Math.round((scores.filter(s => s >= passThreshold).length / scores.length) * 100)
}

/** Group an array by a string key derived from each item */
export function groupBy<T>(arr: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const key = keyFn(item)
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {} as Record<string, T[]>)
}
