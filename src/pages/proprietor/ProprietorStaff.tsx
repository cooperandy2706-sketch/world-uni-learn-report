import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import FlaskLoader from '../../components/ui/FlaskLoader'
import { Users, UserCheck } from 'lucide-react'

export default function ProprietorStaff() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  const [staffList, setStaffList] = useState<any[]>([])
  const [roleCounts, setRoleCounts] = useState<Record<string, number>>({})

  useEffect(() => { setTimeout(() => setMounted(true), 60) }, [])

  useEffect(() => {
    if (!user?.school_id) return
    loadStaff()
  }, [user?.school_id])

  async function loadStaff() {
    const sid = user!.school_id
    try {
      const { data } = await supabase
        .from('users')
        .select('full_name, role, created_at')
        .eq('school_id', sid)
        .neq('role', 'student')
        .neq('role', 'parent')
        .order('role')
      
      const counts: Record<string, number> = {}
      data?.forEach(u => {
        counts[u.role] = (counts[u.role] || 0) + 1
      })

      setRoleCounts(counts)
      setStaffList(data || [])
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <FlaskLoader fullScreen={false} label="Loading staff data..." />

  return (
    <>
      <style>{`
        .staff-wrap {
          font-family: 'Outfit', system-ui, sans-serif;
          opacity: ${mounted ? 1 : 0};
          transition: opacity 0.5s ease;
          max-width: 1440px;
          margin: 0 auto;
          padding: 20px 40px 60px;
        }
        .role-pill {
          padding: 6px 12px; border-radius: 99px; font-size: 13px; font-weight: 700; text-transform: capitalize;
        }
        .role-card {
          background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 24px; display: flex; align-items: center; gap: 16px; flex: 1; min-width: 200px;
        }

        @media (max-width: 768px) {
          .staff-wrap { padding: 16px 20px 80px; }
          .role-card { min-width: 100%; }
        }
      `}</style>
      
      <div className="staff-wrap">
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 32px', color: '#0f172a' }}>Staff & Payroll Demographics</h1>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
          {Object.entries(roleCounts).map(([role, count]) => (
            <div key={role} className="role-card">
              <div style={{ fontSize: 24 }}>{role === 'teacher' ? '👩‍🏫' : role === 'bursar' ? '💰' : '💼'}</div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{count}</div>
                <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, textTransform: 'capitalize' }}>{role}s</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '24px 32px', borderBottom: '1px solid #f1f5f9' }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Staff Roster</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', color: '#64748b', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '16px 32px', fontWeight: 700 }}>Name</th>
                  <th style={{ padding: '16px 32px', fontWeight: 700 }}>Role</th>
                  <th style={{ padding: '16px 32px', fontWeight: 700 }}>Joined</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((s, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px 32px', fontWeight: 600, color: '#1e293b' }}>{s.full_name}</td>
                    <td style={{ padding: '16px 32px' }}>
                      <span className="role-pill" style={{ 
                        background: s.role === 'teacher' ? '#eff6ff' : '#f5f3ff',
                        color: s.role === 'teacher' ? '#3b82f6' : '#7c3aed'
                      }}>{s.role}</span>
                    </td>
                    <td style={{ padding: '16px 32px', color: '#64748b', fontSize: 14 }}>{new Date(s.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {staffList.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>No staff members found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  )
}
