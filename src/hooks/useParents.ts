// src/hooks/useParents.ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useParentWards() {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ['parent_wards', user?.id],
    queryFn: async () => {
      if (!user) return []
      
      const { data, error } = await supabase
        .from('parent_wards')
        .select(`
          student_id,
          students (
            *,
            class:classes (name)
          )
        `)
        .eq('parent_user_id', user.id)
        
      if (error) throw error
      
      // Unwrap the students
      return data.map(d => d.students).filter(Boolean) as any[]
    },
    enabled: !!user && user.role === 'parent'
  })
}
