// src/pages/staff/ElectionsPage.tsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'
import { Election, ElectionPosition, ElectionCandidate } from '../../types/database.types'

export default function StaffElectionsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [activeElection, setActiveElection] = useState<Election | null>(null)
  const [positions, setPositions] = useState<ElectionPosition[]>([])
  const [candidates, setCandidates] = useState<ElectionCandidate[]>([])
  
  // Vetting Modal
  const [vettingCandidate, setVettingCandidate] = useState<ElectionCandidate | null>(null)
  const [vetForm, setVetForm] = useState({ status: 'approved' as any, vet_score: 0, vet_notes: '' })

  const loadData = async () => {
    if (!user?.school_id) return
    setLoading(true)
    try {
      const { data: elData } = await supabase.from('elections')
        .select('*')
        .eq('school_id', user.school_id)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      if (!elData) {
        setActiveElection(null)
        setLoading(false)
        return
      }
      
      setActiveElection(elData)

      const [posRes, candRes] = await Promise.all([
        supabase.from('election_positions').select('*').eq('election_id', elData.id),
        supabase.from('election_candidates').select('*, student:students(full_name), teacher:teacher_id(full_name)').eq('election_id', elData.id),
      ])
      
      setPositions(posRes.data || [])
      setCandidates(candRes.data || [])
    } catch (err: any) {
      if (err.code !== 'PGRST116') { // not found error is fine
        console.error(err)
        toast.error('Failed to load election data')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [user?.school_id])

  const saveVetting = async () => {
    if (!vettingCandidate) return
    try {
      const { error } = await supabase.from('election_candidates').update({
        status: vetForm.status,
        vet_score: vetForm.vet_score,
        vet_notes: vetForm.vet_notes,
        vetted_by: user!.id,
        vetted_at: new Date().toISOString()
      }).eq('id', vettingCandidate.id)
      
      if (error) throw error
      toast.success('Candidate vetted successfully')
      setVettingCandidate(null)
      loadData()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading elections...</div>

  const styles = {
    btn: { padding: '8px 16px', borderRadius: 8, border: 'none', background: '#6d28d9', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13 },
    btnOutline: { padding: '8px 16px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', cursor: 'pointer', fontWeight: 600, fontSize: 13 },
    card: { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6' },
  }

  if (!activeElection) {
    return (
      <div style={{ padding: 40, textAlign: 'center', background: '#fff', borderRadius: 12, border: '1px solid #f3f4f6' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No Active Elections</h2>
        <p style={{ color: '#6b7280' }}>There are currently no active prefectorial elections to vet candidates for.</p>
      </div>
    )
  }

  return (
    <div style={{ paddingBottom: 60 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>Candidate Vetting</h1>
        <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>{activeElection.title} — Review and score student candidates</p>
      </div>

      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>All Candidates</h2>
          <div style={{ fontSize: 13, color: '#6b7280' }}>
            <span style={{ fontWeight: 600, color: '#111827' }}>{candidates.filter(c => c.status === 'pending').length}</span> pending vetting
          </div>
        </div>

        {candidates.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {candidates.map(cand => {
              const pos = positions.find(p => p.id === cand.position_id)
              return (
                <div key={cand.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, border: '1px solid #e5e7eb', borderRadius: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, color: '#111827' }}>
                      {cand.teacher?.full_name || cand.student?.full_name}
                      <span style={{ fontWeight: 400, color: '#6b7280', marginLeft: 6 }}>
                        ({cand.teacher_id ? 'Teacher' : 'Student'})
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Position: <span style={{ fontWeight: 600 }}>{pos?.title}</span></div>
                    <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4, display: 'flex', gap: 12 }}>
                      <span>
                        Status: 
                        <span style={{ 
                          marginLeft: 6, fontWeight: 600, textTransform: 'uppercase', fontSize: 11, padding: '2px 6px', borderRadius: 4,
                          background: cand.status === 'approved' ? '#dcfce7' : cand.status === 'rejected' ? '#fee2e2' : '#fef9c3',
                          color: cand.status === 'approved' ? '#16a34a' : cand.status === 'rejected' ? '#dc2626' : '#ca8a04'
                        }}>
                          {cand.status}
                        </span>
                      </span>
                      {cand.vet_score !== undefined && cand.vet_score !== null && (
                        <span>Score: <strong style={{ color: '#6d28d9' }}>{cand.vet_score}/100</strong></span>
                      )}
                    </div>
                  </div>
                  <button 
                    style={cand.status === 'pending' ? styles.btn : styles.btnOutline} 
                    onClick={() => {
                      setVettingCandidate(cand)
                      setVetForm({ status: cand.status as any, vet_score: cand.vet_score || 0, vet_notes: cand.vet_notes || '' })
                    }}
                  >
                    {cand.status === 'pending' ? 'Vet Candidate' : 'Edit Vetting'}
                  </button>
                </div>
              )
            })}
          </div>
        ) : (
          <p style={{ fontSize: 14, color: '#6b7280' }}>No candidates have applied yet.</p>
        )}
      </div>

      {/* Vetting Modal */}
      {vettingCandidate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Vet Candidate</h3>
            <p style={{ fontSize: 14, color: '#374151', marginBottom: 16, fontWeight: 600 }}>
              {vettingCandidate.teacher?.full_name || vettingCandidate.student?.full_name} — {positions.find(p => p.id === vettingCandidate.position_id)?.title}
            </p>
            
            {vettingCandidate.manifesto && (
              <div style={{ background: '#f9fafb', padding: 16, borderRadius: 8, marginBottom: 16, border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: 8 }}>Manifesto</div>
                <p style={{ fontSize: 14, color: '#374151', whiteSpace: 'pre-wrap', margin: 0 }}>{vettingCandidate.manifesto}</p>
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Vetting Score (0-100)</label>
              <input 
                type="number" min={0} max={100}
                value={vetForm.vet_score} onChange={e => setVetForm({...vetForm, vet_score: parseInt(e.target.value) || 0})}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Staff Notes</label>
              <textarea 
                rows={3}
                value={vetForm.vet_notes} onChange={e => setVetForm({...vetForm, vet_notes: e.target.value})}
                placeholder="Interview notes, behavior record..."
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', boxSizing: 'border-box', resize: 'vertical' }}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Decision Status</label>
              <select 
                value={vetForm.status} onChange={e => setVetForm({...vetForm, status: e.target.value as any})}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', boxSizing: 'border-box' }}
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved (Allowed to be voted for)</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button style={styles.btnOutline} onClick={() => setVettingCandidate(null)}>Cancel</button>
              <button style={styles.btn} onClick={saveVetting}>Save Vetting</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
