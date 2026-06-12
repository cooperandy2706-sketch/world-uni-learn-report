import { useProprietorScope } from '../../hooks/useProprietorScope'
import { Building2 } from 'lucide-react'

export default function ProprietorBranchSelector() {
  const { branches, selectedBranchId, setSelectedBranchId, mainSchoolId, isLoading } = useProprietorScope()

  if (isLoading || !branches.length) return null

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-card)', padding: '6px 12px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
      <Building2 size={16} color="#64748b" />
      <select 
        value={selectedBranchId}
        onChange={(e) => setSelectedBranchId(e.target.value)}
        style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, fontWeight: 600, color: '#0f172a', cursor: 'pointer' }}
      >
        <option value="all">All Branches (Aggregated)</option>
        <option value={mainSchoolId!}>Main Campus</option>
        {branches.map(b => (
          <option key={b.id} value={b.id}>{b.branch_name || b.name}</option>
        ))}
      </select>
    </div>
  )
}
