import { supabase } from '../lib/supabase'
import type { LeaveRequest } from '../types/database.types'

export const LeaveService = {
  async getMyRequests(userId: string) {
    const { data, error } = await supabase
      .from('leave_requests')
      .select(`
        *,
        substitute:users!leave_requests_substitute_id_fkey(id, full_name, role)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      
    if (error) throw error
    return data as any[]
  },

  async getAllRequests(schoolId: string) {
    const { data, error } = await supabase
      .from('leave_requests')
      .select(`
        *,
        user:users!leave_requests_user_id_fkey(id, full_name, role, avatar_url),
        substitute:users!leave_requests_substitute_id_fkey(id, full_name, role),
        approved_by_user:users!leave_requests_approved_by_fkey(id, full_name)
      `)
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false })
      
    if (error) throw error
    return data as any[]
  },

  async createRequest(payload: {
    school_id: string
    user_id: string
    leave_type: string
    start_date: string
    end_date: string
    reason?: string
  }) {
    const { error } = await supabase
      .from('leave_requests')
      .insert({ ...payload, status: 'pending' })
      
    if (error) throw error
  },

  async updateRequestStatus(
    id: string, 
    status: 'approved' | 'rejected', 
    adminId: string, 
    substituteId?: string | null,
    notes?: string
  ) {
    const { error } = await supabase
      .from('leave_requests')
      .update({
        status,
        approved_by: adminId,
        substitute_id: substituteId || null,
        admin_notes: notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      
    if (error) throw error
  }
}
