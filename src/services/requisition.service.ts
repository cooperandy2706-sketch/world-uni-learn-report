// src/services/requisition.service.ts
import { supabase } from '../lib/supabase'

export type RequisitionStatus = 'pending' | 'approved' | 'rejected' | 'paid'

export interface Requisition {
  id: string
  school_id: string
  requested_by: string
  category: string
  amount: number
  description: string
  status: RequisitionStatus
  approved_by: string | null
  approval_date: string | null
  rejection_reason: string | null
  expense_id: string | null
  created_at: string
}

export const requisitionService = {
  async getAll(schoolId: string) {
    return supabase
      .from('requisitions')
      .select(`
        *,
        requested_user:users!requisitions_requested_by_fkey(full_name),
        approver_user:users!requisitions_approved_by_fkey(full_name)
      `)
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false })
  },

  async create(requisition: Partial<Requisition>) {
    return supabase
      .from('requisitions')
      .insert([requisition])
      .select()
      .single()
  },

  async approve(id: string, approverId: string) {
    return supabase
      .from('requisitions')
      .update({
        status: 'approved',
        approved_by: approverId,
        approval_date: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
  },

  async reject(id: string, approverId: string, reason: string) {
    return supabase
      .from('requisitions')
      .update({
        status: 'rejected',
        approved_by: approverId,
        rejection_reason: reason,
        approval_date: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
  },

  async payAndRecordExpense(requisition: Requisition, paymentMethod: string) {
    // 1. Create the expense record
    const { data: expense, error: expError } = await supabase
      .from('expense_records')
      .insert([{
        school_id: requisition.school_id,
        category: requisition.category,
        description: `Requisition: ${requisition.description}`,
        amount: requisition.amount,
        date: new Date().toISOString().split('T')[0],
        payment_method: paymentMethod,
        recorded_by: requisition.approved_by
      }])
      .select()
      .single()

    if (expError) throw expError

    // 2. Mark requisition as paid and link to expense
    const { data: req, error: reqError } = await supabase
      .from('requisitions')
      .update({
        status: 'paid',
        expense_id: expense.id
      })
      .eq('id', requisition.id)
      .select()
      .single()

    if (reqError) throw reqError

    return { expense, requisition: req }
  }
}
