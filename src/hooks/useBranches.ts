// src/hooks/useBranches.ts
// Hook for fetching and managing school branches (multi-campus)

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import toast from 'react-hot-toast'

export interface BranchRow {
  id: string
  name: string
  branch_name: string | null
  address: string | null
  phone: string | null
  email: string | null
  created_at: string
}

/**
 * Fetches all branches (child schools) linked to the current school via parent_school_id.
 */
export function useBranches() {
  const { user } = useAuth()
  const schoolId = user?.school_id ?? ''

  return useQuery<BranchRow[]>({
    queryKey: ['branches', schoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schools')
        .select('id, name, branch_name, address, phone, email, created_at')
        .eq('parent_school_id', schoolId)
        .order('created_at')
      if (error) throw error
      return (data ?? []) as BranchRow[]
    },
    enabled: !!schoolId,
  })
}

/**
 * Mutation to create a new branch school linked to the current parent school.
 */
export function useCreateBranch() {
  const qc = useQueryClient()
  const { user } = useAuth()
  const schoolId = user?.school_id ?? ''

  return useMutation({
    mutationFn: async (branch: { branch_name: string; address?: string; phone?: string; email?: string }) => {
      // Fetch parent school to inherit name
      const { data: parentSchool } = await supabase.from('schools').select('name').eq('id', schoolId).single()
      const parentName = parentSchool?.name ?? 'School'

      // Create the branch as a new schools row
      const { data, error } = await supabase.from('schools').insert({
        name: `${parentName} — ${branch.branch_name}`,
        branch_name: branch.branch_name,
        address: branch.address || null,
        phone: branch.phone || null,
        email: branch.email || null,
        parent_school_id: schoolId,
        is_branch: true,
      }).select().single()

      if (error) throw error

      // Also create a school_settings row for the branch
      if (data) {
        await supabase.from('school_settings').insert({
          school_id: data.id,
          setup_completed: false,
        })
      }

      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['branches', schoolId] })
      toast.success('Branch created successfully!')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create branch')
    },
  })
}

/**
 * Mutation to delete a branch school.
 */
export function useUpdateBranch() {
  const qc = useQueryClient()
  const { user } = useAuth()
  const schoolId = user?.school_id ?? ''

  return useMutation({
    mutationFn: async (branch: {
      id: string
      branch_name: string
      address?: string
      phone?: string
      email?: string
    }) => {
      const { data: parentSchool } = await supabase.from('schools').select('name').eq('id', schoolId).single()
      const parentName = parentSchool?.name ?? 'School'

      const { data, error } = await supabase
        .from('schools')
        .update({
          name: `${parentName} — ${branch.branch_name}`,
          branch_name: branch.branch_name,
          address: branch.address || null,
          phone: branch.phone || null,
          email: branch.email || null,
        })
        .eq('id', branch.id)
        .eq('parent_school_id', schoolId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['branches', schoolId] })
      toast.success('Branch updated')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update branch')
    },
  })
}

export function useDeleteBranch() {
  const qc = useQueryClient()
  const { user } = useAuth()
  const schoolId = user?.school_id ?? ''

  return useMutation({
    mutationFn: async (branchId: string) => {
      const { error } = await supabase.from('schools').delete().eq('id', branchId).eq('parent_school_id', schoolId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['branches', schoolId] })
      toast.success('Branch removed')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete branch')
    },
  })
}
