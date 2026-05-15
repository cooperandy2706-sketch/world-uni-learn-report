// src/utils/validators.ts
// Shared form validation helpers used across the platform.

/** Returns true if the string is a valid email address */
export function isValidEmail(value: string | null | undefined): boolean {
  if (!value) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

/** Returns true if the string is a valid Ghanaian or international phone number */
export function isValidPhone(value: string | null | undefined): boolean {
  if (!value) return false
  const digits = value.replace(/\D/g, '')
  return digits.length >= 9 && digits.length <= 15
}

/** Returns true if the string is non-empty after trimming */
export function isNonEmpty(value: string | null | undefined): boolean {
  return !!(value && value.trim().length > 0)
}

/** Returns true if the value can be parsed as a valid date */
export function isValidDate(value: string | null | undefined): boolean {
  if (!value) return false
  const d = new Date(value)
  return !isNaN(d.getTime())
}

/** Returns true if value is a positive number */
export function isPositiveNumber(value: number | string | null | undefined): boolean {
  const n = Number(value)
  return !isNaN(n) && n > 0
}

/** Returns true if the string is a valid UUID v4 */
export function isValidUUID(value: string | null | undefined): boolean {
  if (!value) return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

/** Validate a required string field — returns error message or null */
export function requiredField(value: string | null | undefined, label = 'This field'): string | null {
  return isNonEmpty(value) ? null : `${label} is required.`
}

/** Validate an email field — returns error message or null */
export function emailField(value: string | null | undefined, label = 'Email'): string | null {
  if (!isNonEmpty(value)) return `${label} is required.`
  if (!isValidEmail(value)) return `${label} must be a valid email address.`
  return null
}

/** Validate a numeric field with optional min/max — returns error message or null */
export function numberField(
  value: number | string | null | undefined,
  label = 'Value',
  { min, max }: { min?: number; max?: number } = {}
): string | null {
  const n = Number(value)
  if (isNaN(n)) return `${label} must be a number.`
  if (min !== undefined && n < min) return `${label} must be at least ${min}.`
  if (max !== undefined && n > max) return `${label} must be at most ${max}.`
  return null
}

/** Run multiple validator functions and return the first non-null error */
export function validate(...validators: Array<string | null>): string | null {
  return validators.find(v => v !== null) ?? null
}
