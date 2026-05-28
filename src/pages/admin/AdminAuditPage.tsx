// src/pages/admin/AdminAuditPage.tsx — ENHANCED
// Adds a "Data Requests" tab for GDPR/POPIA deletion request management.
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import PageHeader from '../../components/layout/PageHeader'
import { FileText, Search, ShieldCheck, Clock, User, Database, ArrowRight, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

type Tab = 'audit' | 'gdpr'

export default function AdminAuditPage() {
  const { user } = useAuth()
  const schoolId = user?.school_id
  const qc = useQueryClient()

  const [activeTab, setActiveTab] = useState<Tab>('audit')
  const [searchTerm, setSearchTerm] = useState('')
  const [tableFilter, setTableFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')

  // ── Audit Logs ──────────────────────────────────────────────────────────
  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs', schoolId, tableFilter, actionFilter],
    queryFn: async () => {
      let q = supabase
        .from('audit_logs')
        .select('*, user:users(full_name, role)')
        .eq('school_id', schoolId!)
        .order('created_at', { ascending: false })
        .limit(100)

      if (tableFilter !== 'all') q = q.eq('table_name', tableFilter)
      if (actionFilter !== 'all') q = q.eq('action', actionFilter)

      const { data, error } = await q
      if (error) throw error
      return data || []
    },
    enabled: !!schoolId && activeTab === 'audit',
  })

  // ── GDPR Deletion Requests ───────────────────────────────────────────────
  const { data: gdprRequests = [], isLoading: gdprLoading } = useQuery({
    queryKey: ['gdpr-requests', schoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gdpr_deletion_requests')
        .select('*, requester:users!gdpr_deletion_requests_requester_id_fkey(full_name, email, role)')
        .eq('school_id', schoolId!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!schoolId && activeTab === 'gdpr',
  })

  const updateGdprMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const { error } = await supabase
        .from('gdpr_deletion_requests')
        .update({ status, admin_notes: notes, reviewed_at: new Date().toISOString(), reviewed_by: user!.id })
        .eq('id', id)
        .eq('school_id', schoolId!)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gdpr-requests'] }),
  })

  const filteredLogs = logs?.filter(log => {
    if (!searchTerm) return true
    const s = searchTerm.toLowerCase()
    return (
      log.table_name.toLowerCase().includes(s) ||
      log.action.toLowerCase().includes(s) ||
      (log.user as any)?.full_name?.toLowerCase().includes(s) ||
      log.record_id.toLowerCase().includes(s)
    )
  })

  function formatDataSnippet(data: any) {
    if (!data) return 'null'
    const str = JSON.stringify(data)
    return str.length > 50 ? str.substring(0, 50) + '...' : str
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'INSERT': return { bg: '#dcfce7', text: '#166534' }
      case 'UPDATE': return { bg: '#fef9c3', text: '#854d0e' }
      case 'DELETE': return { bg: '#fee2e2', text: '#991b1b' }
      default:       return { bg: '#f3f4f6', text: '#374151' }
    }
  }

  const gdprStatusColor: Record<string, { bg: string; text: string }> = {
    pending:     { bg: '#fffbeb', text: '#d97706' },
    in_review:   { bg: '#eff6ff', text: '#2563eb' },
    completed:   { bg: '#f0fdf4', text: '#16a34a' },
    rejected:    { bg: '#fef2f2', text: '#dc2626' },
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto' }}>
      <PageHeader
        title="Audit & Compliance"
        subtitle="Immutable audit trail and data privacy request management."
        icon={ShieldCheck}
        color="#4c1d95"
      />

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', borderRadius: 12, padding: 4, marginBottom: 28, width: 'fit-content' }}>
        {([['audit', '🛡️ Audit Logs'], ['gdpr', `🔒 Data Requests${gdprRequests.filter((r: any) => r.status === 'pending').length > 0 ? ` (${gdprRequests.filter((r: any) => r.status === 'pending').length})` : ''}`]] as const).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '9px 20px', borderRadius: 9, border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: 13,
              background: activeTab === tab ? '#fff' : 'transparent',
              color: activeTab === tab ? '#4c1d95' : '#64748b',
              boxShadow: activeTab === tab ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Audit Logs Tab ── */}
      {activeTab === 'audit' && (
        <>
          <div style={{ background: 'var(--bg-card)', borderRadius: 8, padding: 20, marginBottom: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 250, position: 'relative' }}>
              <Search size={18} color="#9ca3af" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search logs by user, table, or ID..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '12px 16px 12px 42px', borderRadius: 12, border: '1px solid var(--border-color)', background: 'var(--bg-input)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <select value={tableFilter} onChange={e => setTableFilter(e.target.value)} style={{ padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border-color)', background: 'var(--bg-input)', fontSize: 14, outline: 'none', minWidth: 150 }}>
              <option value="all">All Tables</option>
              <option value="fee_payments">Fee Payments</option>
              <option value="scores">Academic Scores</option>
              <option value="students">Students</option>
              <option value="users">Users</option>
            </select>
            <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} style={{ padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border-color)', background: 'var(--bg-input)', fontSize: 14, outline: 'none', minWidth: 150 }}>
              <option value="all">All Actions</option>
              <option value="INSERT">INSERT</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>

          <div style={{ background: 'var(--bg-card)', borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
            {isLoading ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading logs...</div>
            ) : filteredLogs?.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <FileText size={48} color="#d1d5db" style={{ margin: '0 auto 16px', display: 'block' }} />
                <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-main)', marginBottom: 8 }}>No logs found</h3>
                <p style={{ color: 'var(--text-muted)' }}>Adjust your filters to see more results.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      {['Timestamp', 'User', 'Action', 'Table / Record ID', 'Data Snapshot'].map(h => (
                        <th key={h} style={{ padding: '16px 20px', fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs?.map(log => {
                      const colors = getActionColor(log.action)
                      return (
                        <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '16px 20px', verticalAlign: 'top' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#475569', fontSize: 13 }}>
                              <Clock size={14} />
                              {format(new Date(log.created_at), 'MMM d, yyyy HH:mm:ss')}
                            </div>
                          </td>
                          <td style={{ padding: '16px 20px', verticalAlign: 'top' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <User size={14} color="#4f46e5" />
                              </div>
                              <div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{(log.user as any)?.full_name || 'System'}</div>
                                <div style={{ fontSize: 12, color: '#64748b' }}>{(log.user as any)?.role || '-'}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '16px 20px', verticalAlign: 'top' }}>
                            <span style={{ background: colors.bg, color: colors.text, padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>{log.action}</span>
                          </td>
                          <td style={{ padding: '16px 20px', verticalAlign: 'top' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                              <Database size={14} color="#64748b" />
                              <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{log.table_name}</span>
                            </div>
                            <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>ID: {log.record_id}</div>
                          </td>
                          <td style={{ padding: '16px 20px', verticalAlign: 'top' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {log.old_data && (
                                <div style={{ background: '#fef2f2', padding: 8, borderRadius: 6, fontSize: 11, fontFamily: 'monospace', color: '#991b1b', border: '1px solid #fecaca' }}>
                                  <strong style={{ display: 'block', marginBottom: 2 }}>OLD:</strong>
                                  {formatDataSnippet(log.old_data)}
                                </div>
                              )}
                              {log.old_data && log.new_data && <div style={{ display: 'flex', justifyContent: 'center' }}><ArrowRight size={14} color="#94a3b8" /></div>}
                              {log.new_data && (
                                <div style={{ background: '#f0fdf4', padding: 8, borderRadius: 6, fontSize: 11, fontFamily: 'monospace', color: '#166534', border: '1px solid #bbf7d0' }}>
                                  <strong style={{ display: 'block', marginBottom: 2 }}>NEW:</strong>
                                  {formatDataSnippet(log.new_data)}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── GDPR / Data Requests Tab ── */}
      {activeTab === 'gdpr' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {gdprLoading ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>Loading requests…</div>
          ) : gdprRequests.length === 0 ? (
            <div style={{ background: 'var(--bg-card)', borderRadius: 8, padding: 48, textAlign: 'center', border: '1px solid #f1f5f9' }}>
              <Trash2 size={48} color="#d1d5db" style={{ margin: '0 auto 16px', display: 'block' }} />
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)', marginBottom: 8 }}>No deletion requests</h3>
              <p style={{ color: '#94a3b8', fontSize: 14 }}>Users who submit data deletion requests from their Privacy settings will appear here.</p>
            </div>
          ) : (
            gdprRequests.map((req: any) => {
              const sc = gdprStatusColor[req.status] ?? { bg: '#f3f4f6', text: '#374151' }
              return (
                <div key={req.id} style={{ background: 'var(--bg-card)', borderRadius: 8, padding: '20px 24px', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <User size={16} color="#7c3aed" />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 15 }}>{req.requester?.full_name ?? 'Unknown'}</div>
                          <div style={{ fontSize: 12, color: '#64748b' }}>{req.requester?.email ?? '—'} · {req.requester?.role ?? '—'}</div>
                        </div>
                        <span style={{ background: sc.bg, color: sc.text, padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>
                          {req.status?.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 14px', marginBottom: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>REASON</div>
                        <div style={{ fontSize: 14, color: '#334155' }}>{req.reason ?? 'No reason provided.'}</div>
                      </div>
                      {req.admin_notes && (
                        <div style={{ background: '#eff6ff', borderRadius: 10, padding: '10px 14px' }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#2563eb', marginBottom: 4 }}>ADMIN NOTES</div>
                          <div style={{ fontSize: 13, color: '#1e40af' }}>{req.admin_notes}</div>
                        </div>
                      )}
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 10 }}>
                        Submitted: {format(new Date(req.created_at), 'MMM d, yyyy HH:mm')}
                        {req.reviewed_at && ` · Reviewed: ${format(new Date(req.reviewed_at), 'MMM d, yyyy HH:mm')}`}
                      </div>
                    </div>
                    {req.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        <button
                          onClick={() => updateGdprMutation.mutate({ id: req.id, status: 'in_review' })}
                          style={{ padding: '8px 16px', borderRadius: 10, background: '#eff6ff', color: '#2563eb', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                        >
                          Mark In Review
                        </button>
                        <button
                          onClick={() => {
                            const notes = prompt('Add a note (e.g. reason for rejection):')
                            updateGdprMutation.mutate({ id: req.id, status: 'rejected', notes: notes ?? undefined })
                          }}
                          style={{ padding: '8px 16px', borderRadius: 10, background: '#fef2f2', color: '#dc2626', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => {
                            if (!confirm('Mark this deletion request as completed? This acknowledges data has been processed.')) return
                            updateGdprMutation.mutate({ id: req.id, status: 'completed' })
                          }}
                          style={{ padding: '8px 16px', borderRadius: 10, background: '#f0fdf4', color: '#16a34a', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                        >
                          ✓ Mark Complete
                        </button>
                      </div>
                    )}
                    {req.status === 'in_review' && (
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        <button
                          onClick={() => updateGdprMutation.mutate({ id: req.id, status: 'rejected' })}
                          style={{ padding: '8px 16px', borderRadius: 10, background: '#fef2f2', color: '#dc2626', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => updateGdprMutation.mutate({ id: req.id, status: 'completed' })}
                          style={{ padding: '8px 16px', borderRadius: 10, background: '#f0fdf4', color: '#16a34a', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                        >
                          ✓ Mark Complete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
