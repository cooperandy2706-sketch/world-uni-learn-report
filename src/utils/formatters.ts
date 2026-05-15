// src/utils/formatters.ts
// Shared string, number, and date formatting helpers used across the platform.

/** Format an amount as GH₵ with locale-appropriate thousands separators */
export function formatCurrency(
  amount: number | string | null | undefined,
  symbol = 'GH₵',
  decimals = 2
): string {
  const n = Number(amount ?? 0)
  return `${symbol} ${n.toLocaleString('en-GH', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
}

/** Format a GH phone number to a standard display format */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '—'
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
  }
  if (digits.length === 12 && digits.startsWith('233')) {
    return `+233 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`
  }
  return phone
}

/** Zero-pad a student ID number to the desired width */
export function formatStudentId(id: string | number | null | undefined, width = 6): string {
  if (!id) return '—'
  return String(id).padStart(width, '0')
}

/** Truncate a string to maxLen characters, appending ellipsis if needed */
export function truncate(str: string | null | undefined, maxLen = 80): string {
  if (!str) return ''
  return str.length > maxLen ? str.slice(0, maxLen - 1) + '…' : str
}

/** Capitalize the first letter of each word */
export function titleCase(str: string | null | undefined): string {
  if (!str) return ''
  return str.replace(/\b\w/g, c => c.toUpperCase())
}

/** Format a date string as a readable short date (e.g. "May 15, 2026") */
export function formatShortDate(
  dateStr: string | null | undefined,
  locale = 'en-GH'
): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

/** Return a human-readable relative time string (e.g. "3h ago") */
export function timeAgo(ts: string | null | undefined): string {
  if (!ts) return '—'
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

/** Format a number with ordinal suffix (1st, 2nd, 3rd …) */
export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`
}

/** Safely extract initials from a full name (up to 2 chars) */
export function initials(fullName: string | null | undefined): string {
  if (!fullName) return '?'
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}
