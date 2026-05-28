import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export interface AuditLog {
  id: string
  school_id: string
  user_id: string
  user_name: string | null
  user_role: string | null
  table_name: string
  action: string
  record_id: string
  old_data: any
  new_data: any
  created_at: string
}

export function useRecentActions(schoolId?: string, limit: number = 20) {
  return useQuery({
    queryKey: ['recent-actions', schoolId],
    queryFn: async () => {
      if (!schoolId) return []
      const { data, error } = await supabase
        .from('audit_log_summary')
        .select('*')
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching recent actions:', error)
        throw error
      }
      return data as AuditLog[]
    },
    enabled: !!schoolId,
    refetchInterval: 30000, // Poll every 30 seconds for real-time feel
  })
}
