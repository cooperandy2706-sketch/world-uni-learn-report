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
  async getLetters(teacherId: string) {
    return supabase
      .from('hr_letters')
      .select('*, author:users!created_by(id, full_name)')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false })
  },
  async saveLetter(data: any) {
    return supabase.from('hr_letters').insert(data).select().single()
  },
  async deleteLetter(id: string) {
    return supabase.from('hr_letters').delete().eq('id', id)
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
import { scholarshipService } from './bursar.service'

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
    const { data: term, error: termErr } = await supabase.from('terms').insert(data).select().single()
    if (termErr) throw termErr

    // Automatically generate a subscription invoice when a term is created
    const { count } = await supabase
      .from('terms')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', data.school_id)

    // 600 for the first term, 300 for subsequent terms
    const amount = (count === 1) ? 600 : 300
    
    // Due date is 30 days from now
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 30)

    await supabase.from('school_invoices').insert({
      school_id: data.school_id,
      term_id: term.id,
      amount: amount,
      status: 'pending',
      due_date: dueDate.toISOString()
    })

    return term
  },
  async lock(id: string) {
    return supabase.from('terms').update({ is_locked: true }).eq('id', id).select().single()
  },
  async unlock(id: string) {
    return supabase.from('terms').update({ is_locked: false }).eq('id', id).select().single()
  },
  async setCurrent(id: string, schoolId: string) {
    // Check if there is an active term already that we are switching away from
    const { data: old } = await supabase
      .from('terms')
      .select('id, academic_year_id')
      .eq('school_id', schoolId)
      .eq('is_current', true)
      .maybeSingle()

    // Automatically perform financial rollover for the old term
    if (old && old.id !== id) {
      await scholarshipService.rolloverTermArrears(schoolId, old.id)

      // Auto-migrate Fee Structures from the old term into the new one (if the new term is empty)
      const { data: newStructs } = await supabase
        .from('fee_structures')
        .select('id')
        .eq('term_id', id)
        .limit(1)
      if (!newStructs || newStructs.length === 0) {
        const { data: oldStructs } = await supabase
          .from('fee_structures')
          .select('*')
          .eq('term_id', old.id)
        if (oldStructs && oldStructs.length > 0) {
          const { data: newTerm } = await supabase
            .from('terms')
            .select('academic_year_id')
            .eq('id', id)
            .single()
          if (newTerm) {
            const mapped = oldStructs.map(s => ({
              school_id: s.school_id,
              class_id: s.class_id,
              term_id: id,
              academic_year_id: newTerm.academic_year_id,
              fee_name: s.fee_name,
              amount: s.amount,
              description: s.description,
            }))
            await supabase.from('fee_structures').insert(mapped)
          }
        }
      }
    }

    await supabase.from('terms').update({ is_current: false }).eq('school_id', schoolId)
    return supabase.from('terms').update({ is_current: true }).eq('id', id).select().single()
  },
}

// ── Settings ──────────────────────────────────────────────
// Bug 2 fix: upsert now uses onConflict: 'school_id' to guarantee
// a single row per school is always updated in-place, never duplicated.
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
      .upsert(
        { ...data, school_id: schoolId, updated_at: new Date().toISOString() },
        { onConflict: 'school_id' }   // ← Bug 2 fix: match on school_id, not PK
      )
      .select()
      .single()
  },
  async updateSchool(schoolId: string, data: any) {
    return supabase.from('schools').update(data).eq('id', schoolId).select().single()
  },
}

// ── Agenda ────────────────────────────────────────────────
export const agendaService = {
  async getAgendas(schoolId: string, termId: string) {
    return supabase
      .from('term_agendas')
      .select('*')
      .eq('school_id', schoolId)
      .eq('term_id', termId)
      .order('week_number', { ascending: true })
      .order('created_at', { ascending: true })
  },
  async getTeacherResponses(schoolId: string, agendaId: string) {
    return supabase
      .from('term_agenda_responses')
      .select('*, teacher:teachers(id, user:users(full_name))')
      .eq('school_id', schoolId)
      .eq('agenda_id', agendaId)
  },
  async upsertAgenda(data: any) {
    return supabase.from('term_agendas').upsert(data).select().single()
  },
  async publishAgenda(id: string, published: boolean) {
    return supabase.from('term_agendas').update({ is_published: published }).eq('id', id)
  },
  async deleteAgenda(id: string) {
    return supabase.from('term_agendas').delete().eq('id', id)
  },
  // Teacher ops
  async getPublishedAgendas(schoolId: string, termId: string) {
    return supabase
      .from('term_agendas')
      .select('*')
      .eq('school_id', schoolId)
      .eq('term_id', termId)
      .eq('is_published', true)
      .order('week_number', { ascending: true })
  },
  async getResponse(teacherId: string, agendaId: string) {
    return supabase
      .from('term_agenda_responses')
      .select('*')
      .eq('teacher_id', teacherId)
      .eq('agenda_id', agendaId)
      .maybeSingle()
  },
  async submitResponse(data: any) {
    return supabase.from('term_agenda_responses').upsert(data).select().single()
  },
  async replyToStruggle(responseId: string, reply: string) {
    return supabase
      .from('term_agenda_responses')
      .update({ admin_reply: reply, updated_at: new Date().toISOString() })
      .eq('id', responseId)
  },
}

// ── Schools ───────────────────────────────────────────────
export const schoolsService = {
  async getAll() {
    return supabase.from('schools').select('*').order('name')
  },
}