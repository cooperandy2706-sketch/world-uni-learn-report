// src/services/settingsService.ts
// ─────────────────────────────────────────────────────────────────────────────
// WHY THIS FILE EXISTS
// The original bug: useSettings() called settingsService.get() which only
// queried the `settings` table and returned { school: null, ... }.
// After save+invalidateQueries the refetch returned school:null, so reset()
// cleared every school field in the form.
//
// FIX: get() now does a LEFT JOIN to schools via Supabase's embedded select.
// The returned shape is:
//   {
//     id, school_id, next_term_date, school_fees_info, school_news,
//     school: { id, name, motto, email, phone, address, headteacher_name, logo_url }
//   }
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from '../lib/supabase'

export const settingsService = {

  // ── READ ──────────────────────────────────────────────────────────────────
  // Returns the settings row PLUS the joined school row.
  // Uses Supabase's `school:schools(...)` syntax for a left join.
  async get(schoolId: string) {
    if (!schoolId) return { data: null, error: new Error('No school_id') }

    const { data, error } = await supabase
      .from('settings')
      .select(`
        id,
        school_id,
        next_term_date,
        school_fees_info,
        school_news,
        school:schools (
          id,
          name,
          motto,
          email,
          phone,
          address,
          headteacher_name,
          logo_url
        )
      `)
      .eq('school_id', schoolId)
      .maybeSingle()          // returns null (not error) if no row yet

    if (error) return { data: null, error }

    // If no settings row exists yet, return a shell with empty school
    if (!data) {
      return {
        data: {
          id: null,
          school_id: schoolId,
          next_term_date: null,
          school_fees_info: null,
          school_news: null,
          school: null,
        },
        error: null,
      }
    }

    return { data, error: null }
  },

  // ── UPSERT settings row (next_term_date, fees, news) ─────────────────────
  // Uses onConflict:'school_id' so it creates-or-updates safely.
  async upsert(schoolId: string, payload: {
    next_term_date?: string | null
    school_fees_info?: string | null
    school_news?: string | null
  }) {
    const { data, error } = await supabase
      .from('settings')
      .upsert(
        {
          school_id: schoolId,
          next_term_date:   payload.next_term_date   ?? null,
          school_fees_info: payload.school_fees_info ?? null,
          school_news:      payload.school_news       ?? null,
          updated_at:       new Date().toISOString(),
        },
        { onConflict: 'school_id' }
      )
      .select()
      .single()

    return { data, error }
  },

  // ── UPDATE schools row (name, motto, email, phone, address, etc.) ─────────
  // This updates the `schools` table directly (separate from `settings`).
  async updateSchool(schoolId: string, payload: {
    name?:             string | null
    motto?:            string | null
    email?:            string | null
    phone?:            string | null
    address?:          string | null
    headteacher_name?: string | null
    logo_url?:         string | null
  }) {
    const { data, error } = await supabase
      .from('schools')
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', schoolId)
      .select()
      .single()

    return { data, error }
  },
}