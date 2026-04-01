// src/constants/grading.ts
import type { GradeInfo } from '../types'

export const GRADE_SCALE: GradeInfo[] = [
  { grade: 'A', label: 'Excellent', min: 80,  max: 100, color: '#16a34a' },
  { grade: 'B', label: 'Very Good', min: 70,  max: 79.9, color: '#2563eb' },
  { grade: 'C', label: 'Good',      min: 60,  max: 69.9, color: '#7c3aed' },
  { grade: 'D', label: 'Credit',    min: 50,  max: 59.9, color: '#d97706' },
  { grade: 'E', label: 'Pass',      min: 40,  max: 49.9, color: '#ea580c' },
  { grade: 'F', label: 'Fail',      min: 0,   max: 39.9, color: '#dc2626' },
]

export const MAX_CLASS_SCORE = 50
export const MAX_EXAM_SCORE = 50
export const MAX_TOTAL_SCORE = 100

export function getGrade(total: number): GradeInfo {
  return (
    GRADE_SCALE.find((g) => total >= g.min && total <= g.max) ??
    GRADE_SCALE[GRADE_SCALE.length - 1]
  )
}

export function getGradeColor(grade: string): string {
  return GRADE_SCALE.find((g) => g.grade === grade)?.color ?? '#6b7280'
}