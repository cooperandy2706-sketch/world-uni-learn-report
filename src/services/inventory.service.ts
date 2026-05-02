// src/services/inventory.service.ts
import { supabase } from '../lib/supabase'

export const inventoryService = {
  // Items
  async getItems(schoolId: string) {
    return supabase
      .from('inventory_items')
      .select('*')
      .eq('school_id', schoolId)
      .order('name')
  },
  async createItem(data: any) {
    return supabase.from('inventory_items').insert(data).select().single()
  },
  async updateItem(id: string, data: any) {
    return supabase.from('inventory_items').update(data).eq('id', id).select().single()
  },
  async deleteItem(id: string) {
    return supabase.from('inventory_items').delete().eq('id', id)
  },

  // Sales
  async getSales(schoolId: string) {
    return supabase
      .from('inventory_sales')
      .select('*, item:inventory_items(name, category), student:students(full_name)')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false })
  },
  async recordSale(data: any) {
    // 1. Check if it's a virtual item (starts with sup-)
    const isVirtual = String(data.item_id).startsWith('sup-')
    const realItemId = isVirtual ? null : data.item_id

    // 2. Prepare the insertion payload (only include columns that exist in DB)
    const payload = {
      school_id: data.school_id,
      item_id: realItemId,
      item_name: data.item_name || null,
      student_id: data.student_id,
      quantity: data.quantity,
      unit_price: data.unit_price,
      total_amount: data.total_amount,
      payment_method: data.payment_method,
      recorded_by: data.recorded_by,
      notes: isVirtual ? `Admission Item: ${data.item_name || ''}` : data.notes
    }

    // 3. Insert sale record
    const { data: sale, error: saleError } = await supabase.from('inventory_sales').insert(payload).select().single()
    
    if (saleError) throw saleError

    // 4. Decrement stock only if not virtual
    if (!isVirtual && realItemId) {
      const { data: item } = await supabase.from('inventory_items').select('current_stock').eq('id', realItemId).single()
      if (item) {
        const newStock = (item.current_stock || 0) - data.quantity
        await supabase.from('inventory_items').update({ current_stock: newStock }).eq('id', realItemId)
        
        // 5. Log the stock change for auditing
        await supabase.from('inventory_stock_logs').insert({
          school_id: data.school_id,
          item_id: realItemId,
          type: 'sale',
          quantity_change: -data.quantity,
          previous_stock: item.current_stock || 0,
          new_stock: newStock,
          reason: `Sale to Student ID: ${data.student_id || 'Walk-in'}`,
          recorded_by: data.recorded_by
        })
      }
    }

    return sale
  },

  // Stock logs
  async getStockLogs(schoolId: string, itemId?: string) {
    let q = supabase
      .from('inventory_stock_logs')
      .select('*, item:inventory_items(name)')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false })
    if (itemId) q = q.eq('item_id', itemId)
    return q
  },
  async recordStockChange(data: any) {
    // 1. Log the change
    const { error: logError } = await supabase.from('inventory_stock_logs').insert(data)
    if (logError) throw logError

    // 2. Update item stock
    await supabase.from('inventory_items').update({ current_stock: data.new_stock }).eq('id', data.item_id)
  }
}
