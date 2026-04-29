// src/pages/teacher/TeacherElectionsHub.tsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'
import { Election, ElectionPosition, ElectionCandidate, ElectionVote } from '../../types/database.types'

export default function TeacherElectionsHub() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [elections, setElections] = useState<Election[]>([])
  const [positions, setPositions] = useState<ElectionPosition[]>([])
  const [candidates, setCandidates] = useState<ElectionCandidate[]>([])
  const [myVotes, setMyVotes] = useState<ElectionVote[]>([])
  
  const [tab, setTab] = useState<'nominate' | 'vote'>('nominate')
  const [ballotSelections, setBallotSelections] = useState<Record<string, string>>({})
  
  const [showNominateModal, setShowNominateModal] = useState(false)
  const [selectedPositionId, setSelectedPositionId] = useState('')
  const [manifesto, setManifesto] = useState('')

  const loadData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const [elRes, posRes, candRes, voteRes] = await Promise.all([
        supabase.from('elections').select('*').eq('school_id', user.school_id).eq('is_archived', false).order('created_at', { ascending: false }),
        supabase.from('election_positions').select('*').eq('school_id', user.school_id),
        supabase.from('election_candidates').select('*, student:students(full_name), teacher:teacher_id(full_name)').eq('school_id', user.school_id),
        supabase.from('election_votes').select('*').eq('voter_teacher_id', user.id),
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
        teacher_id: user!.id,
        manifesto,
        status: 'pending'
      })
      if (error) throw error
      toast.success('Nomination submitted! Awaiting vetting.')
      setShowNominateModal(false)
      setManifesto('')
      setSelectedPositionId('')
      loadData()
    } catch (err: any) {
      toast.error(err.message.includes('unique') ? 'You have already nominated yourself for this position.' : err.message)
    }
  }

  const submitBallot = async () => {
    if (!activeElection) return
    const selectionCount = Object.keys(ballotSelections).length
    if (selectionCount === 0) return toast.error('No candidates selected')
    
    try {
      const votesToInsert = Object.entries(ballotSelections).map(([posId, candId]) => ({
        school_id: user!.school_id,
        election_id: activeElection.id,
        position_id: posId,
        candidate_id: candId,
        voter_teacher_id: user!.id
      }))

      const { error } = await supabase.from('election_votes').insert(votesToInsert)
      if (error) throw error
      
      toast.success(`Your ballot has been submitted successfully!`)
      setBallotSelections({})
      loadData()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const cancelVote = async (voteId: string) => {
    if (!confirm('Are you sure you want to cancel your vote?')) return
    try {
      const { error } = await supabase.from('election_votes').delete().eq('id', voteId)
      if (error) throw error
      toast.success('Vote cancelled successfully!')
      loadData()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading elections...</div>

  const activeElection = elections[0] 

  const styles = {
    btn: { padding: '10px 20px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14, transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(109,40,217,0.2)' },
    btnOutline: { padding: '10px 20px', borderRadius: 12, border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', cursor: 'pointer', fontWeight: 600, fontSize: 14, transition: 'all 0.2s' },
    card: { background: '#fff', borderRadius: 16, padding: 28, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #f3f4f6', transition: 'all 0.3s' },
    tabBtn: (active: boolean) => ({ padding: '10px 20px', borderRadius: 12, border: 'none', background: active ? '#f5f3ff' : 'transparent', color: active ? '#6d28d9' : '#6b7280', cursor: 'pointer', fontWeight: 600, fontSize: 14, transition: 'all 0.2s' })
  }

  if (!activeElection) {
    return (
      <div style={{ padding: 60, textAlign: 'center', background: '#fff', borderRadius: 16, border: '1px solid #f3f4f6', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', animation: '_fadeIn 0.4s ease' }}>
        <style>{`@keyframes _fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#111827' }}>No Active Elections</h2>
        <p style={{ color: '#6b7280', fontSize: 16 }}>There are currently no active elections running.</p>
      </div>
    )
  }

  const elPositions = positions.filter(p => p.election_id === activeElection.id)
  const elCandidates = candidates.filter(c => c.election_id === activeElection.id)
  const myNominations = elCandidates.filter(c => c.teacher_id === user!.id)

  return (
    <div style={{ paddingBottom: 80, animation: '_fadeIn 0.4s ease' }}>
      <style>{`
        @keyframes _fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes _slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .hover-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0,0,0,0.08) !important; border-color: #ddd6fe !important; }
        .hover-cand:hover { background: #f9fafb !important; border-color: #ddd6fe !important; }
        .hover-btn:hover { transform: translateY(-2px); filter: brightness(1.1); box-shadow: 0 6px 16px rgba(109,40,217,0.3) !important; }
        .tab-content { animation: _slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>Election Hub</h1>
        <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>{activeElection.title} — Teacher Access</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 32, background: '#fff', padding: 8, borderRadius: 12, border: '1px solid #f3f4f6', width: 'fit-content' }}>
        <button style={styles.tabBtn(tab === 'nominate')} onClick={() => setTab('nominate')}>Stand for Position</button>
        <button style={styles.tabBtn(tab === 'vote')} onClick={() => setTab('vote')}>Cast Vote</button>
      </div>

      <div className="tab-content" key={tab}>
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
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600 }}>Cast Your Vote</h2>
              <p style={{ fontSize: 13, color: '#6b7280' }}>Mark your preferred candidates and click Submit Ballot.</p>
            </div>
            {activeElection.voting_open && (
              <button 
                style={{ ...styles.btn, background: Object.keys(ballotSelections).length > 0 ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : '#9ca3af' }}
                disabled={Object.keys(ballotSelections).length === 0}
                onClick={submitBallot}
              >
                Submit Ballot
              </button>
            )}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 24 }}>
            {elPositions.map(pos => {
              const posCands = elCandidates.filter(c => c.position_id === pos.id && c.status === 'approved')
              const myVoteForPos = myVotes.find(v => v.position_id === pos.id)
              const currentSelection = ballotSelections[pos.id]

              return (
                <div key={pos.id} style={{ ...styles.card, border: myVoteForPos ? '2px solid #16a34a' : (currentSelection ? '2px solid #6d28d9' : '1px solid #f3f4f6') }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, borderBottom: '1px solid #f3f4f6', paddingBottom: 8, alignItems: 'center' }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600 }}>{pos.title}</h3>
                    {myVoteForPos && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ color: '#16a34a', fontSize: 12, fontWeight: 700 }}>✅ Voted</span>
                        {activeElection.voting_open && (
                          <button 
                            onClick={() => cancelVote(myVoteForPos.id)}
                            style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 11, fontWeight: 600, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                          >
                            Cancel Vote
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {posCands.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {posCands.map(cand => {
                        const isVoted = myVoteForPos?.candidate_id === cand.id
                        const isSelected = currentSelection === cand.id

                        return (
                          <div 
                            key={cand.id} 
                            onClick={() => {
                              if (myVoteForPos || !activeElection.voting_open) return
                              setBallotSelections(prev => ({ ...prev, [pos.id]: cand.id }))
                            }}
                            className="hover-cand" 
                            style={{ 
                              padding: 16, border: '1.5px solid', 
                              borderColor: isVoted ? '#16a34a' : (isSelected ? '#6d28d9' : '#e5e7eb'),
                              borderRadius: 12, 
                              background: isVoted ? '#f0fdf4' : (isSelected ? '#f5f3ff' : '#fff'), 
                              cursor: (myVoteForPos || !activeElection.voting_open) ? 'default' : 'pointer',
                              transition: 'all 0.2s' 
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 15 }}>{cand.teacher?.full_name || cand.student?.full_name}</div>
                                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{cand.teacher_id ? 'Teacher Candidate' : 'Student Candidate'}</div>
                                {cand.manifesto && <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4, lineHeight: 1.5 }}>{cand.manifesto.substring(0, 120)}...</div>}
                              </div>
                              {(isVoted || isSelected) && <span style={{ color: isVoted ? '#16a34a' : '#6d28d9', fontSize: 12, fontWeight: 700 }}>{isVoted ? '✅' : '🎯'}</span>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p style={{ fontSize: 14, color: '#6b7280' }}>No candidates available.</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
      </div>

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
                placeholder="Why should people vote for you?"
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
