// src/hooks/useBilling.ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useSchoolInvoices(schoolId?: string) {
  return useQuery({
    queryKey: ['school-invoices', schoolId],
    queryFn: async () => {
      if (!schoolId) return []
      const { data, error } = await supabase
        .from('school_invoices')
        .select('*')
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!schoolId
  })
}
