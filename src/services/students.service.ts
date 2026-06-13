// src/services/students.service.ts
import { supabase } from '../lib/supabase'
import type { Student } from '../types'

export const studentsService = {
  async getAll(schoolId: string, opts?: { page?: number, limit?: number, search?: string, classId?: string, gender?: string }) {
    let query = supabase
      .from('students')
      .select('*, class:classes(id, name)', { count: 'exact' })
      .eq('school_id', schoolId)
      .eq('is_active', true)

    if (opts?.classId) query = query.eq('class_id', opts.classId)
    if (opts?.gender) query = query.eq('gender', opts.gender)
    if (opts?.search) {
      query = query.or(`full_name.ilike.%${opts.search}%,student_id.ilike.%${opts.search}%`)
    }

    query = query.order('full_name')

    if (opts?.page !== undefined && opts?.limit !== undefined) {
      const from = opts.page * opts.limit
      const to = from + opts.limit - 1
      query = query.range(from, to)
    }

    return query
  },

  async getByClass(schoolId: string, classId: string) {
    return supabase
      .from('students')
      .select('*, class:classes(id, name)')
      .eq('school_id', schoolId)
      .eq('class_id', classId)
      .eq('is_active', true)
      .order('full_name')
  },

  async getById(schoolId: string, id: string) {
    return supabase
      .from('students')
      .select('*, class:classes(id, name)')
      .eq('school_id', schoolId)
      .eq('id', id)
      .maybeSingle()
  },

  async create(student: Omit<Student, 'id' | 'created_at'>) {
    return supabase.from('students').insert(student).select().single()
  },

  async update(schoolId: string, id: string, updates: Partial<Student>) {
    return supabase.from('students').update(updates).eq('school_id', schoolId).eq('id', id).select().single()
  },

  async delete(schoolId: string, id: string) {
    return supabase.from('students').update({ is_active: false }).eq('school_id', schoolId).eq('id', id)
  },

  async bulkCreate(students: Omit<Student, 'id' | 'created_at'>[]) {
    return supabase.from('students').insert(students).select()
  },

  async bulkUpsert(students: Omit<Student, 'id' | 'created_at'>[]) {
    // Deduplicate within the batch by student_id before sending
    const seenIds = new Set<string>()
    const deduped = students.filter(s => {
      const id = s.student_id?.trim()
      if (!id) return true // no ID — always include
      if (seenIds.has(id)) return false
      seenIds.add(id)
      return true
    })

    const withId    = deduped.filter(s => s.student_id && s.student_id.trim() !== '')
    const withoutId = deduped.filter(s => !s.student_id || s.student_id.trim() === '')

    const results = await Promise.all([
      withId.length > 0
        ? supabase.from('students').upsert(withId, { onConflict: 'student_id' }).select()
        : Promise.resolve({ data: [], error: null }),
      withoutId.length > 0
        ? supabase.from('students').insert(withoutId).select()
        : Promise.resolve({ data: [], error: null }),
    ])

    const error = results.find(r => r.error)?.error ?? null
    return { data: results.flatMap(r => r.data ?? []), error }
  },
}