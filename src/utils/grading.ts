// src/utils/grading.ts
import { GRADE_SCALE, MAX_CLASS_SCORE, MAX_EXAM_SCORE } from '../constants/grading'
import type { GradeInfo } from '../types'

export function calculateTotal(classScore: number, examScore: number): number {
  return Number((classScore + examScore).toFixed(2))
}

export function getGradeInfo(total: number): GradeInfo {
  return (
    GRADE_SCALE.find((g) => total >= g.min && total <= g.max) ??
    GRADE_SCALE[GRADE_SCALE.length - 1]
  )
}

export function validateClassScore(score: number): boolean {
  return score >= 0 && score <= MAX_CLASS_SCORE
}

export function validateExamScore(score: number): boolean {
  return score >= 0 && score <= MAX_EXAM_SCORE
}

export function calculateClassPositions<T extends { student_id: string; total_score: number }>(
  scores: T[]
): (T & { position: number })[] {
  const sorted = [...scores].sort((a, b) => b.total_score - a.total_score)
  return sorted.map((score, index) => ({ ...score, position: index + 1 }))
}

export function calculateAverage(scores: number[]): number {
  if (scores.length === 0) return 0
  const sum = scores.reduce((acc, s) => acc + s, 0)
  return Number((sum / scores.length).toFixed(2))
}

export function calculatePassRate(scores: number[], passMark = 50): number {
  if (scores.length === 0) return 0
  const passed = scores.filter((s) => s >= passMark).length
  return Number(((passed / scores.length) * 100).toFixed(1))
}

export function gradeDistribution(scores: number[]): Record<string, number> {
  const dist: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 }
  scores.forEach((s) => {
    const info = getGradeInfo(s)
    dist[info.grade] = (dist[info.grade] ?? 0) + 1
  })
  return dist
}