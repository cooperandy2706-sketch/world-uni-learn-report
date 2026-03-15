// src/store/schoolStore.ts
import { create } from 'zustand'
import type { AcademicYear, Term, School } from '../types'

interface SchoolStore {
  school: School | null
  currentYear: AcademicYear | null
  currentTerm: Term | null
  setSchool: (school: School | null) => void
  setCurrentYear: (year: AcademicYear | null) => void
  setCurrentTerm: (term: Term | null) => void
}

export const useSchoolStore = create<SchoolStore>((set) => ({
  school: null,
  currentYear: null,
  currentTerm: null,
  setSchool: (school) => set({ school }),
  setCurrentYear: (currentYear) => set({ currentYear }),
  setCurrentTerm: (currentTerm) => set({ currentTerm }),
}))