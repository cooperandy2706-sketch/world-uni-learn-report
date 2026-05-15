import { supabase } from '../lib/supabase'

export const boardingService = {
  // ── Dormitories ──
  async getDormitories(schoolId: string) {
    return supabase.from('dormitories').select('*, house_parent:users(id, full_name)').eq('school_id', schoolId)
  },
  async createDormitory(data: any) {
    return supabase.from('dormitories').insert(data).select().single()
  },
  async updateDormitory(id: string, data: any) {
    return supabase.from('dormitories').update(data).eq('id', id).select().single()
  },
  async deleteDormitory(id: string) {
    return supabase.from('dormitories').delete().eq('id', id)
  },

  // ── Rooms ──
  async getRooms(dormitoryId: string) {
    return supabase.from('dorm_rooms').select('*').eq('dormitory_id', dormitoryId).order('room_number')
  },
  async createRoom(data: any) {
    return supabase.from('dorm_rooms').insert(data).select().single()
  },
  async deleteRoom(id: string) {
    return supabase.from('dorm_rooms').delete().eq('id', id)
  },

  // ── Assignments ──
  async getAssignmentsByDorm(schoolId: string) {
    // This fetches all assignments for the school, joining the room and dormitory
    return supabase.from('dorm_assignments').select('*, student:students(id, full_name, student_id, gender), room:dorm_rooms(id, room_number, capacity, dormitory_id)').eq('school_id', schoolId)
  },
  async createAssignment(data: any) {
    return supabase.from('dorm_assignments').insert(data).select().single()
  },
  async deleteAssignment(id: string) {
    return supabase.from('dorm_assignments').delete().eq('id', id)
  },

  // ── Exeats ──
  async getExeats(schoolId: string) {
    return supabase.from('exeat_requests').select('*, student:students(id, full_name, student_id), requester:users(id, full_name, role)').eq('school_id', schoolId).order('departure_time', { ascending: false })
  },
  async getStudentExeats(studentId: string) {
    return supabase.from('exeat_requests').select('*').eq('student_id', studentId).order('departure_time', { ascending: false })
  },
  async createExeat(data: any) {
    return supabase.from('exeat_requests').insert(data).select().single()
  },
  async updateExeatStatus(id: string, status: string, approverId?: string, notes?: string) {
    const updateData: any = { status }
    if (approverId) updateData.approved_by = approverId
    if (notes) updateData.notes = notes
    if (status === 'returned') updateData.actual_return_time = new Date().toISOString()
    return supabase.from('exeat_requests').update(updateData).eq('id', id).select().single()
  }
}

export const pastoralService = {
  async getLogs(schoolId: string) {
    return supabase.from('pastoral_logs').select('*, student:students(id, full_name, student_id), counselor:users(id, full_name)').eq('school_id', schoolId).order('date', { ascending: false })
  },
  async createLog(data: any) {
    return supabase.from('pastoral_logs').insert(data).select().single()
  },
  async updateLog(id: string, data: any) {
    return supabase.from('pastoral_logs').update(data).eq('id', id).select().single()
  },
  async deleteLog(id: string) {
    return supabase.from('pastoral_logs').delete().eq('id', id)
  }
}
