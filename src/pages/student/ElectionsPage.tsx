// src/pages/student/ElectionsPage.tsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'
import { Election, ElectionPosition, ElectionCandidate, ElectionVote } from '../../types/database.types'

export default function StudentElectionsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [elections, setElections] = useState<Election[]>([])
  const [positions, setPositions] = useState<ElectionPosition[]>([])
  const [candidates, setCandidates] = useState<ElectionCandidate[]>([])
  const [myVotes, setMyVotes] = useState<ElectionVote[]>([])
  
  const [tab, setTab] = useState<'nominate' | 'vote' | 'results'>('nominate')
  const [studentId, setStudentId] = useState<string | null>(null)
  
  // Nomination
  const [showNominateModal, setShowNominateModal] = useState(false)
  const [selectedPositionId, setSelectedPositionId] = useState('')
  const [manifesto, setManifesto] = useState('')

  const loadData = async () => {
    if (!user) return
    setLoading(true)
    try {
      // Get student profile
      const { data: stuData } = await supabase.from('students').select('id').eq('user_id', user.id).single()
      if (!stuData) throw new Error("Student profile not found")
      setStudentId(stuData.id)

      const [elRes, posRes, candRes, voteRes] = await Promise.all([
        supabase.from('elections').select('*').eq('school_id', user.school_id).eq('is_archived', false).order('created_at', { ascending: false }),
        supabase.from('election_positions').select('*').eq('school_id', user.school_id),
        supabase.from('election_candidates').select('*, student:students(full_name)').eq('school_id', user.school_id),
        supabase.from('election_votes').select('*').eq('voter_student_id', stuData.id),
      ])
      
      setElections(elRes.data || [])
      setPositions(posRes.data || [])
      setCandidates(candRes.data || [])
      setMyVotes(voteRes.data || [])
      
    } catch (err: any) {
      console.error(err)
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [user])

  const submitNomination = async () => {
    if (!selectedPositionId || !manifesto) return toast.error('Please select a position and write a manifesto')
    const electionId = positions.find(p => p.id === selectedPositionId)?.election_id
    if (!electionId) return toast.error('Invalid position')

    try {
      const { error } = await supabase.from('election_candidates').insert({
        school_id: user!.school_id,
        election_id: electionId,
        position_id: selectedPositionId,
        student_id: studentId!,
        manifesto,
        status: 'pending'
      })
      if (error) throw error
      toast.success('Nomination submitted! Awaiting staff vetting.')
      setShowNominateModal(false)
      setManifesto('')
      setSelectedPositionId('')
      loadData()
    } catch (err: any) {
      toast.error(err.message.includes('unique') ? 'You have already nominated yourself for this position.' : err.message)
    }
  }

  const castVote = async (electionId: string, positionId: string, candidateId: string) => {
    if (!confirm('Are you sure you want to vote for this candidate? Your vote is final.')) return
    try {
      const { error } = await supabase.from('election_votes').insert({
        school_id: user!.school_id,
        election_id: electionId,
        position_id: positionId,
        candidate_id: candidateId,
        voter_student_id: studentId!
      })
      if (error) throw error
      toast.success('Vote cast successfully!')
      loadData()
    } catch (err: any) {
      toast.error(err.message.includes('unique') ? 'You have already voted for this position.' : err.message)
    }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading elections...</div>

  const activeElection = elections[0] // Assume latest active election

  const styles = {
    btn: { padding: '8px 16px', borderRadius: 8, border: 'none', background: '#6d28d9', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13 },
    btnOutline: { padding: '8px 16px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', cursor: 'pointer', fontWeight: 600, fontSize: 13 },
    card: { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6' },
    tabBtn: (active: boolean) => ({ padding: '8px 16px', borderRadius: 8, border: 'none', background: active ? '#f5f3ff' : 'transparent', color: active ? '#6d28d9' : '#6b7280', cursor: 'pointer', fontWeight: 600, fontSize: 14 })
  }

  if (!activeElection) {
    return (
      <div style={{ padding: 40, textAlign: 'center', background: '#fff', borderRadius: 12, border: '1px solid #f3f4f6' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No Active Elections</h2>
        <p style={{ color: '#6b7280' }}>There are currently no active prefectorial elections running.</p>
      </div>
    )
  }

  const elPositions = positions.filter(p => p.election_id === activeElection.id)
  const elCandidates = candidates.filter(c => c.election_id === activeElection.id)
  const myNominations = elCandidates.filter(c => c.student_id === studentId)

  return (
    <div style={{ paddingBottom: 60 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>Student Elections Hub</h1>
        <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>{activeElection.title}</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, background: '#fff', padding: 8, borderRadius: 12, border: '1px solid #f3f4f6', width: 'fit-content' }}>
        <button style={styles.tabBtn(tab === 'nominate')} onClick={() => setTab('nominate')}>Stand for Position</button>
        <button style={styles.tabBtn(tab === 'vote')} onClick={() => setTab('vote')}>Vote</button>
      </div>

      {tab === 'nominate' && (
        <div style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>My Nominations</h2>
            {activeElection.nomination_open ? (
               <button style={styles.btn} onClick={() => setShowNominateModal(true)}>Nominate Yourself</button>
            ) : (
               <span style={{ padding: '6px 12px', background: '#fee2e2', color: '#dc2626', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>Nominations Closed</span>
            )}
          </div>
          
          {myNominations.length > 0 ? (
            <div style={{ display: 'grid', gap: 16 }}>
              {myNominations.map(nom => {
                const pos = elPositions.find(p => p.id === nom.position_id)
                return (
                  <div key={nom.id} style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{pos?.title}</div>
                      <span style={{ 
                        fontWeight: 600, textTransform: 'uppercase', fontSize: 11, padding: '2px 8px', borderRadius: 4,
                        background: nom.status === 'approved' ? '#dcfce7' : nom.status === 'rejected' ? '#fee2e2' : '#fef9c3',
                        color: nom.status === 'approved' ? '#16a34a' : nom.status === 'rejected' ? '#dc2626' : '#ca8a04'
                      }}>
                        {nom.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: '#374151' }}>{nom.manifesto}</div>
                    {nom.vet_notes && (
                      <div style={{ marginTop: 12, padding: 12, background: '#f9fafb', borderRadius: 6, fontSize: 13, border: '1px solid #f3f4f6' }}>
                        <strong style={{ color: '#6b7280' }}>Staff Notes:</strong> {nom.vet_notes}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <p style={{ color: '#6b7280', fontSize: 14 }}>You have not submitted any nominations.</p>
          )}
        </div>
      )}

      {tab === 'vote' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {!activeElection.voting_open && (
             <div style={{ padding: 16, background: '#fef3c7', color: '#b45309', borderRadius: 8, border: '1px solid #fde68a', fontWeight: 600 }}>
               Voting is currently closed.
             </div>
          )}
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 24 }}>
            {elPositions.map(pos => {
              const posCands = elCandidates.filter(c => c.position_id === pos.id && c.status === 'approved')
              const myVoteForPos = myVotes.find(v => v.position_id === pos.id)

              return (
                <div key={pos.id} style={{ ...styles.card, border: myVoteForPos ? '2px solid #16a34a' : '1px solid #f3f4f6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, borderBottom: '1px solid #f3f4f6', paddingBottom: 8 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600 }}>{pos.title}</h3>
                    {myVoteForPos && <span style={{ color: '#16a34a', fontSize: 12, fontWeight: 700 }}>✅ Voted</span>}
                  </div>
                  
                  {posCands.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {posCands.map(cand => {
                        const isVotedFor = myVoteForPos?.candidate_id === cand.id
                        return (
                          <div key={cand.id} style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, background: isVotedFor ? '#f0fdf4' : '#fff' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 14 }}>{(cand.student as any)?.full_name}</div>
                                {cand.manifesto && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{cand.manifesto.substring(0, 80)}...</div>}
                              </div>
                              {activeElection.voting_open && !myVoteForPos && (
                                <button style={{ ...styles.btnOutline, padding: '4px 12px', fontSize: 12, borderColor: '#6d28d9', color: '#6d28d9' }} onClick={() => castVote(activeElection.id, pos.id, cand.id)}>Vote</button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p style={{ fontSize: 13, color: '#6b7280' }}>No candidates available.</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Nominate Modal */}
      {showNominateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: '100%', maxWidth: 450 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Nominate Yourself</h3>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Select Position</label>
              <select 
                value={selectedPositionId} onChange={e => setSelectedPositionId(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db' }}
              >
                <option value="">-- Select a position --</option>
                {elPositions.map(pos => (
                   <option key={pos.id} value={pos.id}>{pos.title}</option>
                ))}
              </select>
            </div>
            
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Your Manifesto</label>
              <textarea 
                rows={5}
                value={manifesto} onChange={e => setManifesto(e.target.value)}
                placeholder="Why should students vote for you?"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', resize: 'vertical' }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button style={styles.btnOutline} onClick={() => setShowNominateModal(false)}>Cancel</button>
              <button style={styles.btn} onClick={submitNomination}>Submit Nomination</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
