// src/services/index.ts
import { supabase } from '../lib/supabase'

// ── Classes ──────────────────────────────────────────────
export const classesService = {
  async getAll(schoolId: string) {
    return supabase
      .from('classes')
      .select('*, department:departments(id, name)')
      .eq('school_id', schoolId)
      .order('name')
  },
  async create(data: any) {
    return supabase.from('classes').insert(data).select().single()
  },
  async update(id: string, data: any) {
    return supabase.from('classes').update(data).eq('id', id).select().single()
  },
  async delete(id: string) {
    return supabase.from('classes').delete().eq('id', id)
  },
}

// ── Subjects ─────────────────────────────────────────────
export const subjectsService = {
  async getAll(schoolId: string) {
    return supabase
      .from('subjects')
      .select('*, department:departments(id, name)')
      .eq('school_id', schoolId)
      .order('name')
  },
  async create(data: any) {
    return supabase.from('subjects').insert(data).select().single()
  },
  async update(id: string, data: any) {
    return supabase.from('subjects').update(data).eq('id', id).select().single()
  },
  async delete(id: string) {
    return supabase.from('subjects').delete().eq('id', id)
  },
}

// ── Departments ──────────────────────────────────────────
export const departmentsService = {
  async getAll(schoolId: string) {
    return supabase.from('departments').select('*').eq('school_id', schoolId).order('name')
  },
  async create(data: any) {
    return supabase.from('departments').insert(data).select().single()
  },
  async update(id: string, data: any) {
    return supabase.from('departments').update(data).eq('id', id).select().single()
  },
  async delete(id: string) {
    return supabase.from('departments').delete().eq('id', id)
  },
}

// ── Teachers ─────────────────────────────────────────────
export const teachersService = {
  async getAll(schoolId: string) {
    return supabase
      .from('teachers')
      .select('*, user:users(id, full_name, email, phone, avatar_url), department:departments(id, name)')
      .eq('school_id', schoolId)
      .order('id')
  },
  async getAssignments(teacherId: string, termId: string) {
    return supabase
      .from('teacher_assignments')
      .select('*, class:classes(id, name), subject:subjects(id, name)')
      .eq('teacher_id', teacherId)
      .eq('term_id', termId)
  },
  async createAssignment(data: any) {
    return supabase.from('teacher_assignments').insert(data).select().single()
  },
  async deleteAssignment(id: string) {
    return supabase.from('teacher_assignments').delete().eq('id', id)
  },
}

// ── Academic Years ───────────────────────────────────────
export const yearsService = {
  async getAll(schoolId: string) {
    return supabase
      .from('academic_years')
      .select('*')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false })
  },
  async getCurrent(schoolId: string) {
    return supabase
      .from('academic_years')
      .select('*')
      .eq('school_id', schoolId)
      .eq('is_current', true)
      .single()
  },
  async create(data: any) {
    return supabase.from('academic_years').insert(data).select().single()
  },
  async setCurrent(id: string, schoolId: string) {
    await supabase.from('academic_years').update({ is_current: false }).eq('school_id', schoolId)
    return supabase.from('academic_years').update({ is_current: true }).eq('id', id).select().single()
  },
}

// ── Terms ─────────────────────────────────────────────────
export const termsService = {
  async getAll(academicYearId: string) {
    return supabase
      .from('terms')
      .select('*')
      .eq('academic_year_id', academicYearId)
      .order('name')
  },
  async getCurrent(schoolId: string) {
    return supabase
      .from('terms')
      .select('*')
      .eq('school_id', schoolId)
      .eq('is_current', true)
      .single()
  },
  async create(data: any) {
    return supabase.from('terms').insert(data).select().single()
  },
  async lock(id: string) {
    return supabase.from('terms').update({ is_locked: true }).eq('id', id).select().single()
  },
  async unlock(id: string) {
    return supabase.from('terms').update({ is_locked: false }).eq('id', id).select().single()
  },
  async setCurrent(id: string, schoolId: string) {
    await supabase.from('terms').update({ is_current: false }).eq('school_id', schoolId)
    return supabase.from('terms').update({ is_current: true }).eq('id', id).select().single()
  },
}

// ── Settings ──────────────────────────────────────────────
export const settingsService = {
  async get(schoolId: string) {
    return supabase
      .from('school_settings')
      .select('*, school:schools(*)')
      .eq('school_id', schoolId)
      .single()
  },
  async upsert(schoolId: string, data: any) {
    return supabase
      .from('school_settings')
      .upsert({ ...data, school_id: schoolId, updated_at: new Date().toISOString() })
      .select()
      .single()
  },
  async updateSchool(schoolId: string, data: any) {
    return supabase.from('schools').update(data).eq('id', schoolId).select().single()
  },
}