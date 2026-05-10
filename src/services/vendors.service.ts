// src/services/vendors.service.ts
import { supabase } from '../lib/supabase'

export interface Vendor {
  id: string
  school_id: string
  name: string
  contact_person: string | null
  phone: string | null
  email: string | null
  category: string | null
  notes: string | null
  created_at: string
}

export const vendorService = {
  async getAll(schoolId: string) {
    return supabase
      .from('vendors')
      .select('*')
      .eq('school_id', schoolId)
      .order('name', { ascending: true })
  },

  async create(vendor: Partial<Vendor>) {
    return supabase
      .from('vendors')
      .insert([vendor])
      .select()
      .single()
  },

  async update(schoolId: string, id: string, vendor: Partial<Vendor>) {
    return supabase
      .from('vendors')
      .update(vendor)
      .eq('id', id)
      .eq('school_id', schoolId)
      .select()
      .single()
  },

  async delete(schoolId: string, id: string) {
    return supabase
      .from('vendors')
      .delete()
      .eq('id', id)
      .eq('school_id', schoolId)
  }
}
