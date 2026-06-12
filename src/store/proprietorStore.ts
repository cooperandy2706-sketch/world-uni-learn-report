import { create } from 'zustand'

interface ProprietorStore {
  selectedBranchId: string | 'all'
  setSelectedBranchId: (id: string | 'all') => void
}

export const useProprietorStore = create<ProprietorStore>((set) => ({
  selectedBranchId: 'all',
  setSelectedBranchId: (id) => set({ selectedBranchId: id }),
}))
