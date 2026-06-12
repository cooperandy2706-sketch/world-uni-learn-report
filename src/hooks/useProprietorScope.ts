import { useAuth } from './useAuth'
import { useBranches } from './useBranches'
import { useProprietorStore } from '../store/proprietorStore'
import { useMemo } from 'react'

export function useProprietorScope() {
  const { user } = useAuth()
  const { data: branches, isLoading } = useBranches()
  const { selectedBranchId, setSelectedBranchId } = useProprietorStore()

  const activeSchoolIds = useMemo(() => {
    if (!user?.school_id) return []
    if (selectedBranchId === 'all') {
      return [user.school_id, ...(branches?.map(b => b.id) || [])]
    }
    return [selectedBranchId]
  }, [user?.school_id, branches, selectedBranchId])

  return {
    branches: branches || [],
    isLoading,
    selectedBranchId,
    setSelectedBranchId,
    activeSchoolIds,
    mainSchoolId: user?.school_id
  }
}
