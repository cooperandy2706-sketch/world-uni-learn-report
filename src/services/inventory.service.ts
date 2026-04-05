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
    // 1. Insert search record
    const { data: sale, error: saleError } = await supabase.from('inventory_sales').insert(data).select().single()
    if (saleError) throw saleError

    // 2. Decrement stock
    const { data: item } = await supabase.from('inventory_items').select('current_stock').eq('id', data.item_id).single()
    if (item) {
      await supabase.from('inventory_items').update({ current_stock: item.current_stock - data.quantity }).eq('id', data.item_id)
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
