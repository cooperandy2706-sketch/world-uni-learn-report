// src/pages/admin/ElectionsPage.tsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'
import { Election, ElectionPosition, ElectionCandidate, ElectionVote } from '../../types/database.types'

export default function AdminElectionsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [elections, setElections] = useState<Election[]>([])
  const [positions, setPositions] = useState<ElectionPosition[]>([])
  const [candidates, setCandidates] = useState<ElectionCandidate[]>([])
  const [votes, setVotes] = useState<ElectionVote[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [voters, setVoters] = useState<any[]>([])
  
  const [tab, setTab] = useState<'overview' | 'elections' | 'candidates' | 'results' | 'proxy' | 'appointments'>('overview')
  const [selectedElectionId, setSelectedElectionId] = useState<string>('')
  
  // Modals
  const [showElectionModal, setShowElectionModal] = useState(false)
  const [showPositionModal, setShowPositionModal] = useState(false)
  const [electionForm, setElectionForm] = useState({ title: '', academic_year_id: '' })
  const [positionForm, setPositionForm] = useState({ title: '', max_winners: 1 })
  const [vettingCandidate, setVettingCandidate] = useState<ElectionCandidate | null>(null)
  const [vetForm, setVetForm] = useState({ status: 'approved' as any, vet_score: 0, vet_notes: '' })

  const [showAdminNominateModal, setShowAdminNominateModal] = useState(false)
  const [adminNominateForm, setAdminNominateForm] = useState({ nominee_id: '', nominee_type: 'student' as 'student' | 'teacher', position_id: '', manifesto: '' })
  const [nominateSearch, setNominateSearch] = useState('')
  
  const [showAdminVoteModal, setShowAdminVoteModal] = useState(false)
  const [adminVoteForm, setAdminVoteForm] = useState({ voter_id: '', voter_type: 'student' as 'student' | 'teacher', position_id: '', candidate_id: '' })
  const [voteSearch, setVoteSearch] = useState('')
  const [ballotSelections, setBallotSelections] = useState<Record<string, string>>({})

  const loadData = async () => {
    if (!user?.school_id) return
    setLoading(true)
    try {
      const [elRes, posRes, candRes, voteRes, stuRes, teaRes] = await Promise.all([
        supabase.from('elections').select('*').eq('school_id', user.school_id).order('created_at', { ascending: false }),
        supabase.from('election_positions').select('*').eq('school_id', user.school_id),
        supabase.from('election_candidates').select('*, student:students(full_name), teacher:teacher_id(full_name)').eq('school_id', user.school_id),
        supabase.from('election_votes').select('*').eq('school_id', user.school_id),
        supabase.from('students').select('id, full_name, student_id').eq('school_id', user.school_id).eq('is_active', true),
        supabase.from('users').select('id, full_name').eq('school_id', user.school_id).eq('role', 'teacher')
      ])
      
      setElections(elRes.data || [])
      setPositions(posRes.data || [])
      setCandidates(candRes.data || [])
      setVotes(voteRes.data || [])
      setStudents(stuRes.data || [])
      setTeachers(teaRes.data || [])

      const combinedVoters = [
        ...(stuRes.data || []).map(s => ({ ...s, type: 'student', label: `${s.full_name} (Student - ${s.student_id})` })),
        ...(teaRes.data || []).map(t => ({ ...t, type: 'teacher', label: `${t.full_name} (Teacher)` }))
      ]
      setVoters(combinedVoters)
      
      if (!selectedElectionId && elRes.data?.length) {
        setSelectedElectionId(elRes.data[0].id)
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to load election data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [user?.school_id])

  const createElection = async () => {
    if (!electionForm.title) return toast.error('Title is required')
    try {
      const { data, error } = await supabase.from('elections').insert({
        school_id: user!.school_id,
        title: electionForm.title,
        created_by: user!.id,
      }).select().single()
      
      if (error) throw error
      toast.success('Election created')
      setShowElectionModal(false)
      setElectionForm({ title: '', academic_year_id: '' })
      loadData()
      if (data) setSelectedElectionId(data.id)
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const createPosition = async () => {
    if (!selectedElectionId) return toast.error('Select an election first')
    if (!positionForm.title) return toast.error('Position title is required')
    try {
      const { error } = await supabase.from('election_positions').insert({
        school_id: user!.school_id,
        election_id: selectedElectionId,
        title: positionForm.title,
        max_winners: positionForm.max_winners,
      })
      if (error) throw error
      toast.success('Position added')
      setShowPositionModal(false)
      setPositionForm({ title: '', max_winners: 1 })
      loadData()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const toggleElectionState = async (id: string, field: 'nomination_open' | 'voting_open' | 'is_archived', currentValue: boolean) => {
    try {
      const { error } = await supabase.from('elections').update({ [field]: !currentValue }).eq('id', id)
      if (error) throw error
      toast.success('Updated successfully')
      loadData()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const deleteElection = async (id: string) => {
    if (!confirm('Are you sure you want to delete this election? All positions, candidates, and votes will be permanently deleted. This cannot be undone.')) return
    try {
      const { error } = await supabase.from('elections').delete().eq('id', id)
      if (error) throw error
      toast.success('Election deleted successfully')
      setSelectedElectionId('')
      loadData()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

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

  const adminNominateCandidate = async () => {
    if (!adminNominateForm.nominee_id || !adminNominateForm.position_id) return toast.error('Nominee and Position are required')
    try {
      const { error } = await supabase.from('election_candidates').insert({
        school_id: user!.school_id,
        election_id: selectedElectionId,
        position_id: adminNominateForm.position_id,
        [adminNominateForm.nominee_type === 'student' ? 'student_id' : 'teacher_id']: adminNominateForm.nominee_id,
        manifesto: adminNominateForm.manifesto,
        status: 'pending'
      })
      if (error) throw error
      toast.success('Nomination submitted successfully')
      setShowAdminNominateModal(false)
      setAdminNominateForm({ nominee_id: '', nominee_type: 'student', position_id: '', manifesto: '' })
      loadData()
    } catch (err: any) {
      toast.error(err.message.includes('unique') ? 'Already nominated for this position' : err.message)
    }
  }

  const adminCastVote = async (voterId: string, voterType: 'student' | 'teacher', positionId: string, candidateId: string) => {
    if (!voterId || !positionId || !candidateId) return toast.error('All fields are required')
    try {
      const { error } = await supabase.from('election_votes').insert({
        school_id: user!.school_id,
        election_id: selectedElectionId,
        position_id: positionId,
        candidate_id: candidateId,
        [voterType === 'student' ? 'voter_student_id' : 'voter_teacher_id']: voterId
      })
      if (error) throw error
      toast.success('Vote cast successfully')
      loadData()
    } catch (err: any) {
      toast.error(err.message.includes('unique') ? 'Already voted for this position' : err.message)
    }
  }

  const adminCancelVote = async (voteId: string) => {
    if (!confirm('Are you sure you want to cancel this proxy vote?')) return
    try {
      const { error } = await supabase.from('election_votes').delete().eq('id', voteId)
      if (error) throw error
      toast.success('Proxy vote cancelled')
      loadData()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const toggleAppointment = async (candidateId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('election_candidates').update({ 
        is_appointed: !currentStatus,
        appointed_at: !currentStatus ? new Date().toISOString() : null
      }).eq('id', candidateId)
      if (error) throw error
      toast.success(currentStatus ? 'Appointment retracted' : 'Candidate appointed successfully')
      loadData()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const submitProxyBallot = async () => {
    if (!adminVoteForm.voter_id) return
    const selectionCount = Object.keys(ballotSelections).length
    if (selectionCount === 0) return toast.error('No candidates selected')
    
    try {
      const votesToInsert = Object.entries(ballotSelections).map(([posId, candId]) => ({
        school_id: user!.school_id,
        election_id: selectedElectionId,
        position_id: posId,
        candidate_id: candId,
        [adminVoteForm.voter_type === 'student' ? 'voter_student_id' : 'voter_teacher_id']: adminVoteForm.voter_id
      }))

      const { error } = await supabase.from('election_votes').insert(votesToInsert)
      if (error) throw error
      
      toast.success(`Cast ${selectionCount} votes successfully`)
      setBallotSelections({})
      
      // Move to next voter logic
      const currentIndex = voters.findIndex(v => v.id === adminVoteForm.voter_id && v.type === adminVoteForm.voter_type)
      if (currentIndex !== -1 && currentIndex < voters.length - 1) {
        const nextVoter = voters[currentIndex + 1]
        setAdminVoteForm({ ...adminVoteForm, voter_id: nextVoter.id, voter_type: nextVoter.type })
        setVoteSearch('')
      } else {
        setAdminVoteForm({ ...adminVoteForm, voter_id: '', voter_type: 'student' })
      }
      
      loadData()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const printResults = () => {
    if (!selectedElection) return toast.error('No election selected')
    
    const school = user?.school as any
    const logoHtml = school?.logo_url ? `<img src="${school.logo_url}" alt="School Logo" style="max-height: 80px; margin-bottom: 10px;" />` : ''
    const schoolName = school?.name || 'Prefectorial Electoral Commission'
    
    let html = `
      <html>
        <head>
          <title>${selectedElection.title} - Results</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #111827; font-size: 12px; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 15px; }
            .header h1 { margin: 0; font-size: 18px; color: #1f2937; }
            .header h2 { margin: 5px 0 0 0; font-size: 14px; color: #4b5563; font-weight: normal; }
            .pos-block { margin-bottom: 15px; page-break-inside: avoid; }
            .pos-title { font-size: 13px; font-weight: bold; background: #f3f4f6; padding: 6px 10px; border-radius: 4px; border: 1px solid #e5e7eb; }
            table { width: 100%; border-collapse: collapse; margin-top: 5px; }
            th, td { text-align: left; padding: 4px 8px; border-bottom: 1px solid #e5e7eb; }
            th { font-weight: 600; color: #4b5563; background: #f9fafb; }
            .winner { background: #f0fdfa; font-weight: bold; color: #0f766e; }
          </style>
        </head>
        <body>
          <div class="header">
            ${logoHtml}
            <h1>${schoolName}</h1>
            <h2>${selectedElection.title} - Official Results</h2>
          </div>
    `

    currentPositions.forEach(pos => {
      const posCands = currentCandidates.filter(c => c.position_id === pos.id && c.status === 'approved')
      const posVotes = currentVotes.filter(v => v.position_id === pos.id)
      const tallies = posCands.map(c => {
        const count = posVotes.filter(v => v.candidate_id === c.id).length
        return { cand: c, count }
      }).sort((a, b) => b.count - a.count)

      html += `<div class="pos-block"><div class="pos-title">${pos.title} (Max Winners: ${pos.max_winners})</div>`
      if (tallies.length > 0) {
        html += `<table><thead><tr><th>Candidate</th><th>Votes</th><th>Percentage</th></tr></thead><tbody>`
        tallies.forEach((t, idx) => {
          const percentage = posVotes.length > 0 ? Math.round((t.count / posVotes.length) * 100) : 0
          const isWinner = pos.max_winners > 0 && idx < pos.max_winners && t.count > 0
          html += `<tr class="${isWinner ? 'winner' : ''}">
            <td>${isWinner ? '🏆 ' : ''}${t.cand.teacher?.full_name || t.cand.student?.full_name} ${t.cand.teacher_id ? '(Teacher)' : ''}</td>
            <td>${t.count}</td>
            <td>${percentage}%</td>
          </tr>`
        })
        html += `</tbody></table>`
      } else {
        html += `<p style="padding: 6px 10px; margin: 0; color: #6b7280;">No candidates or votes.</p>`
      }
      html += `</div>`
    })

    html += `</body></html>`

    const win = window.open('', '_blank', 'width=800,height=900')
    if (win) {
      win.document.write(html)
      win.document.close()
      setTimeout(() => win.print(), 500)
    }
  }

  const printCandidates = () => {
    if (!selectedElection) return toast.error('No election selected')
    
    const school = user?.school as any
    const logoHtml = school?.logo_url ? `<img src="${school.logo_url}" alt="School Logo" style="max-height: 80px; margin-bottom: 10px;" />` : ''
    const schoolName = school?.name || 'Prefectorial Electoral Commission'
    
    let html = `
      <html>
        <head>
          <title>${selectedElection.title} - Candidates</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #111827; font-size: 12px; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 15px; }
            .header h1 { margin: 0; font-size: 18px; color: #1f2937; }
            .header h2 { margin: 5px 0 0 0; font-size: 14px; color: #4b5563; font-weight: normal; }
            .pos-block { margin-bottom: 20px; page-break-inside: avoid; }
            .pos-title { font-size: 14px; font-weight: bold; color: #6d28d9; border-bottom: 1px solid #ddd6fe; padding-bottom: 4px; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { text-align: left; padding: 8px; border-bottom: 1px solid #f3f4f6; }
            th { font-weight: 600; color: #4b5563; background: #f9fafb; font-size: 11px; text-transform: uppercase; }
            .status { font-weight: bold; text-transform: uppercase; font-size: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            ${logoHtml}
            <h1>${schoolName}</h1>
            <h2>${selectedElection.title} - Official Candidates List</h2>
          </div>
    `

    currentPositions.forEach(pos => {
      const posCands = currentCandidates.filter(c => c.position_id === pos.id)
      html += `<div class="pos-block"><div class="pos-title">${pos.title}</div>`
      if (posCands.length > 0) {
        html += `<table><thead><tr><th>Name</th><th>Type</th><th>Status</th><th>Manifesto Summary</th></tr></thead><tbody>`
        posCands.forEach(c => {
          html += `<tr>
            <td style="font-weight: 600;">${c.teacher?.full_name || c.student?.full_name}</td>
            <td>${c.teacher_id ? 'Teacher' : 'Student'}</td>
            <td class="status" style="color: ${c.status === 'approved' ? '#16a34a' : c.status === 'rejected' ? '#dc2626' : '#ca8a04'}">${c.status}</td>
            <td style="font-size: 11px; color: #4b5563;">${c.manifesto ? (c.manifesto.substring(0, 150) + '...') : 'No manifesto provided.'}</td>
          </tr>`
        })
        html += `</tbody></table>`
      } else {
        html += `<p style="color: #6b7280; font-style: italic;">No candidates for this position.</p>`
      }
      html += `</div>`
    })

    html += `</body></html>`

    const win = window.open('', '_blank', 'width=850,height=900')
    if (win) {
      win.document.write(html)
      win.document.close()
      setTimeout(() => win.print(), 500)
    }
  }

  const printAppointments = () => {
    if (!selectedElection) return toast.error('No election selected')
    
    const school = user?.school as any
    const logoHtml = school?.logo_url ? `<img src="${school.logo_url}" alt="School Logo" style="max-height: 80px; margin-bottom: 10px;" />` : ''
    const schoolName = school?.name || 'Prefectorial Electoral Commission'
    
    let html = `
      <html>
        <head>
          <title>${selectedElection.title} - Appointments</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #111827; font-size: 14px; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 3px double #e5e7eb; padding-bottom: 20px; }
            .header h1 { margin: 0; font-size: 24px; color: #1f2937; text-transform: uppercase; letter-spacing: 1px; }
            .header h2 { margin: 10px 0 0 0; font-size: 18px; color: #4b5563; font-weight: 600; }
            .intro { margin-bottom: 30px; text-align: justify; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { text-align: left; padding: 12px 15px; border: 1px solid #e5e7eb; }
            th { background: #f9fafb; font-weight: 700; color: #374151; text-transform: uppercase; font-size: 12px; }
            .pos-col { font-weight: 700; color: #6d28d9; width: 40%; }
            .name-col { font-weight: 700; font-size: 16px; }
            .footer { margin-top: 60px; display: flex; justify-content: space-between; }
            .sign-box { border-top: 1px solid #000; width: 200px; text-align: center; padding-top: 8px; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="header">
            ${logoHtml}
            <h1>${schoolName}</h1>
            <h2>OFFICIAL APPOINTMENTS REPORT</h2>
            <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">Election: ${selectedElection.title} | Academic Year: ${school.current_academic_year || 'N/A'}</div>
          </div>

          <div class="intro">
            The Prefectorial Electoral Commission (PEC), following the conclusion of the electoral process and vetting procedures, 
            hereby formally announces the following appointments for the upcoming leadership term. These appointments are official 
            and binding as per the school's electoral guidelines.
          </div>

          <table>
            <thead>
              <tr>
                <th>Position / Portfolio</th>
                <th>Appointee Name</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
    `

    currentPositions.forEach(pos => {
      const appointees = currentCandidates.filter(c => c.position_id === pos.id && c.is_appointed)
      if (appointees.length > 0) {
        appointees.forEach(a => {
          html += `
            <tr>
              <td class="pos-col">${pos.title}</td>
              <td class="name-col">${a.teacher?.full_name || a.student?.full_name}</td>
              <td>${a.teacher_id ? 'Teacher' : 'Student'}</td>
            </tr>
          `
        })
      } else {
        html += `
          <tr>
            <td class="pos-col">${pos.title}</td>
            <td colspan="2" style="color: #9ca3af; font-style: italic;">No appointment made for this position.</td>
          </tr>
        `
      }
    })

    html += `
            </tbody>
          </table>

          <div class="footer">
            <div class="sign-box">Election Commissioner</div>
            <div class="sign-box">Head of Institution</div>
          </div>
          
          <div style="text-align: center; margin-top: 40px; font-size: 10px; color: #9ca3af;">
            Generated on ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
          </div>
        </body>
      </html>
    `

    const win = window.open('', '_blank', 'width=900,height=1000')
    if (win) {
      win.document.write(html)
      win.document.close()
      setTimeout(() => win.print(), 500)
    }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading elections...</div>

  const selectedElection = elections.find(e => e.id === selectedElectionId)
  const currentPositions = positions.filter(p => p.election_id === selectedElectionId)
  const currentCandidates = candidates.filter(c => c.election_id === selectedElectionId)
  const currentVotes = votes.filter(v => v.election_id === selectedElectionId)

  const styles = {
    btn: { padding: '10px 20px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14, transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(109,40,217,0.2)' },
    btnOutline: { padding: '10px 20px', borderRadius: 12, border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', cursor: 'pointer', fontWeight: 600, fontSize: 14, transition: 'all 0.2s' },
    card: { background: '#fff', borderRadius: 16, padding: 28, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #f3f4f6', transition: 'all 0.3s' },
    tabBtn: (active: boolean) => ({ padding: '10px 20px', borderRadius: 12, border: 'none', background: active ? '#f5f3ff' : 'transparent', color: active ? '#6d28d9' : '#6b7280', cursor: 'pointer', fontWeight: 600, fontSize: 14, transition: 'all 0.2s' })
  }

  return (
    <div style={{ paddingBottom: 80, animation: '_fadeIn 0.4s ease' }}>
      <style>{`
        @keyframes _fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes _slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .hover-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0,0,0,0.08) !important; border-color: #ddd6fe !important; }
        .hover-btn:hover { transform: translateY(-2px); filter: brightness(1.1); box-shadow: 0 6px 16px rgba(109,40,217,0.3) !important; }
        .hover-btn-outline:hover { background: #f9fafb !important; border-color: #d1d5db !important; }
        .tab-content { animation: _slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>Prefectorial Electoral Commission</h1>
          <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>Manage student elections, positions, and vetting</p>
        </div>
        <select 
          value={selectedElectionId} 
          onChange={e => setSelectedElectionId(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, minWidth: 200 }}
        >
          {elections.map(e => (
             <option key={e.id} value={e.id}>{e.title}</option>
          ))}
          {elections.length === 0 && <option value="">No elections found</option>}
        </select>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, background: '#fff', padding: 8, borderRadius: 12, border: '1px solid #f3f4f6', width: 'fit-content' }}>
        <button style={styles.tabBtn(tab === 'overview')} onClick={() => setTab('overview')}>Overview</button>
        <button style={styles.tabBtn(tab === 'elections')} onClick={() => setTab('elections')}>Manage Elections</button>
        <button style={styles.tabBtn(tab === 'candidates')} onClick={() => setTab('candidates')}>Candidates & Vetting</button>
        <button style={styles.tabBtn(tab === 'results')} onClick={() => setTab('results')}>Live Results</button>
        <button style={styles.tabBtn(tab === 'appointments')} onClick={() => setTab('appointments')}>Appointments</button>
        <button className="hover-btn-outline" style={styles.tabBtn(tab === 'proxy')} onClick={() => setTab('proxy')}>Proxy Actions</button>
      </div>

      <div className="tab-content" key={tab}>
      {tab === 'overview' && (
        <div>
          {selectedElection ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
              <div style={styles.card}>
                <div style={{ fontSize: 13, color: '#6b7280', textTransform: 'uppercase', fontWeight: 700 }}>Total Positions</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#111827', marginTop: 8 }}>{currentPositions.length}</div>
              </div>
              <div style={styles.card}>
                <div style={{ fontSize: 13, color: '#6b7280', textTransform: 'uppercase', fontWeight: 700 }}>Total Candidates</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#111827', marginTop: 8 }}>{currentCandidates.length}</div>
              </div>
              <div style={styles.card}>
                <div style={{ fontSize: 13, color: '#6b7280', textTransform: 'uppercase', fontWeight: 700 }}>Approved Candidates</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#16a34a', marginTop: 8 }}>{currentCandidates.filter(c => c.status === 'approved').length}</div>
              </div>
              <div style={styles.card}>
                <div style={{ fontSize: 13, color: '#6b7280', textTransform: 'uppercase', fontWeight: 700 }}>Total Votes Cast</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#6d28d9', marginTop: 8 }}>{currentVotes.length}</div>
              </div>
            </div>
          ) : (
            <div style={{ ...styles.card, textAlign: 'center', padding: 40 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>No Elections Yet</h3>
              <p style={{ color: '#6b7280', marginBottom: 20 }}>Create an election to get started.</p>
              <button style={styles.btn} onClick={() => setShowElectionModal(true)}>Create First Election</button>
            </div>
          )}
        </div>
      )}

      {tab === 'elections' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>Election Settings</h2>
            <div style={{ display: 'flex', gap: 12 }}>
              {selectedElection && (
                <button 
                  style={{ ...styles.btnOutline, color: '#dc2626', borderColor: '#fee2e2', background: '#fef2f2' }} 
                  onClick={() => deleteElection(selectedElection.id)}
                >
                  Delete Election
                </button>
              )}
              <button style={styles.btn} onClick={() => setShowElectionModal(true)}>+ New Election</button>
            </div>
          </div>
          
          {selectedElection && (
            <div style={styles.card}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>{selectedElection.title}</h3>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 250, padding: 16, background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Nomination Phase</div>
                  <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>Allow students to submit their candidacy.</p>
                  <button 
                    style={{ ...styles.btn, background: selectedElection.nomination_open ? '#ef4444' : '#16a34a', width: '100%' }}
                    onClick={() => toggleElectionState(selectedElection.id, 'nomination_open', selectedElection.nomination_open)}
                  >
                    {selectedElection.nomination_open ? 'Close Nominations' : 'Open Nominations'}
                  </button>
                </div>
                <div style={{ flex: 1, minWidth: 250, padding: 16, background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Voting Phase</div>
                  <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>Allow students to cast their votes.</p>
                  <button 
                    style={{ ...styles.btn, background: selectedElection.voting_open ? '#ef4444' : '#16a34a', width: '100%' }}
                    onClick={() => toggleElectionState(selectedElection.id, 'voting_open', selectedElection.voting_open)}
                  >
                    {selectedElection.voting_open ? 'Close Voting' : 'Open Voting'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {selectedElection && (
            <div style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600 }}>Positions</h3>
                <button style={styles.btnOutline} onClick={() => setShowPositionModal(true)}>+ Add Position</button>
              </div>
              {currentPositions.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>Position Title</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>Max Winners</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>Candidates</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPositions.map(pos => (
                      <tr key={pos.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 500 }}>{pos.title}</td>
                        <td style={{ padding: '12px 16px' }}>{pos.max_winners}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ padding: '2px 8px', background: '#e0e7ff', color: '#4f46e5', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>
                            {currentCandidates.filter(c => c.position_id === pos.id).length} candidates
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ fontSize: 14, color: '#6b7280' }}>No positions added yet.</p>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'candidates' && (
        <div style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>Candidate Vetting</h2>
            <button style={{ ...styles.btnOutline, display: 'flex', alignItems: 'center', gap: 6 }} onClick={printCandidates}>
              🖨️ Print Candidates
            </button>
          </div>
          {currentCandidates.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {currentCandidates.map(cand => {
                const pos = currentPositions.find(p => p.id === cand.position_id)
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
                      <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                        Status: 
                        <span style={{ 
                          marginLeft: 6, fontWeight: 600, textTransform: 'uppercase', fontSize: 11, padding: '2px 6px', borderRadius: 4,
                          background: cand.status === 'approved' ? '#dcfce7' : cand.status === 'rejected' ? '#fee2e2' : '#fef9c3',
                          color: cand.status === 'approved' ? '#16a34a' : cand.status === 'rejected' ? '#dc2626' : '#ca8a04'
                        }}>
                          {cand.status}
                        </span>
                      </div>
                    </div>
                    <button 
                      style={styles.btnOutline} 
                      onClick={() => {
                        setVettingCandidate(cand)
                        setVetForm({ status: cand.status as any, vet_score: cand.vet_score || 0, vet_notes: cand.vet_notes || '' })
                      }}
                    >
                      Vet Candidate
                    </button>
                  </div>
                )
              })}
            </div>
          ) : (
            <p style={{ fontSize: 14, color: '#6b7280' }}>No candidates have applied yet.</p>
          )}
        </div>
      )}

      {tab === 'results' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>Live Results Overview</h2>
            <button style={{ ...styles.btnOutline, display: 'flex', alignItems: 'center', gap: 6 }} onClick={printResults}>
              🖨️ Print Results
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 24 }}>
            {currentPositions.map(pos => {
            const posCands = currentCandidates.filter(c => c.position_id === pos.id && c.status === 'approved')
            const posVotes = currentVotes.filter(v => v.position_id === pos.id)
            
            // Calculate tallies
            const tallies = posCands.map(c => {
              const count = posVotes.filter(v => v.candidate_id === c.id).length
              return { cand: c, count }
            }).sort((a, b) => b.count - a.count)

            return (
              <div key={pos.id} style={styles.card}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, borderBottom: '1px solid #f3f4f6', paddingBottom: 8 }}>{pos.title}</h3>
                {tallies.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {tallies.map((t, idx) => {
                      const percentage = posVotes.length > 0 ? Math.round((t.count / posVotes.length) * 100) : 0
                      const isWinner = pos.max_winners > 0 && idx < pos.max_winners && t.count > 0
                      return (
                        <div key={t.cand.id}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                            <span style={{ fontWeight: 600, color: isWinner ? '#6d28d9' : '#374151' }}>
                              {isWinner ? '🏆 ' : ''}{t.cand.teacher?.full_name || t.cand.student?.full_name}
                            </span>
                            <span style={{ fontWeight: 600 }}>{t.count} votes ({percentage}%)</span>
                          </div>
                          <div style={{ width: '100%', height: 8, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ width: `${percentage}%`, height: '100%', background: isWinner ? '#6d28d9' : '#9ca3af', borderRadius: 4 }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: '#6b7280' }}>No approved candidates or votes yet.</p>
                )}
              </div>
            )
          })}
          {currentPositions.length === 0 && <p style={{ fontSize: 14, color: '#6b7280', padding: 20 }}>No positions created yet.</p>}
          </div>
        </div>
      )}

      {tab === 'appointments' && (
        <div style={{ animation: '_slideUp 0.4s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>Official Appointments</h2>
              <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>Manually appoint candidates to positions regardless of vote counts.</p>
            </div>
            <button onClick={printAppointments} style={{ ...styles.btn, background: 'linear-gradient(135deg, #059669, #10b981)' }}>
              🖨️ Print Appointment List
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 24 }}>
            {currentPositions.map(pos => {
              const posCands = currentCandidates.filter(c => c.position_id === pos.id && c.status === 'approved')
              const posVotes = currentVotes.filter(v => v.position_id === pos.id)
              const appointees = posCands.filter(c => c.is_appointed)
              
              return (
                <div key={pos.id} style={{ ...styles.card, border: appointees.length > 0 ? '2px solid #10b981' : '1px solid #f3f4f6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid #f3f4f6', paddingBottom: 12 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{pos.title}</h3>
                    <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 99, background: '#f0fdf4', color: '#16a34a' }}>
                      {appointees.length} / {pos.max_winners} Appointed
                    </span>
                  </div>

                  {posCands.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {posCands.map(cand => {
                        const voteCount = posVotes.filter(v => v.candidate_id === cand.id).length
                        return (
                          <div key={cand.id} style={{ 
                            padding: 14, borderRadius: 12, border: '1px solid', 
                            borderColor: cand.is_appointed ? '#10b981' : '#f3f4f6',
                            background: cand.is_appointed ? '#f0fdf4' : '#fff'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 15 }}>{cand.teacher?.full_name || cand.student?.full_name}</div>
                                <div style={{ fontSize: 12, color: '#6b7280' }}>
                                  {voteCount} votes · {cand.teacher_id ? 'Teacher' : 'Student'}
                                </div>
                              </div>
                              <button 
                                onClick={() => toggleAppointment(cand.id, cand.is_appointed || false)}
                                style={{ 
                                  padding: '6px 14px', borderRadius: 8, border: 'none',
                                  background: cand.is_appointed ? '#dc2626' : '#10b981',
                                  color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer'
                                }}
                              >
                                {cand.is_appointed ? 'Retract' : 'Appoint'}
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p style={{ color: '#9ca3af', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>No approved candidates.</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'proxy' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {selectedElection ? (
            <>
              <div style={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 600 }}>Proxy Nomination</h2>
                    <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Nominate a student or teacher for a position on their behalf.</p>
                  </div>
                  <button style={styles.btn} onClick={() => setShowAdminNominateModal(true)}>Nominate Candidate</button>
                </div>
              </div>
              <div style={styles.card}>
                <div style={{ marginBottom: 16 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 600 }}>Proxy Voting</h2>
                  <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Select a voter (student or teacher) below to cast votes on their behalf.</p>
                </div>
                
                <div style={{ marginBottom: 24, maxWidth: 450 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Voter Selection</label>
                  <input 
                    type="text" 
                    placeholder="Search voter name..." 
                    value={voteSearch} onChange={e => setVoteSearch(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', marginBottom: 8, fontSize: 13 }}
                  />
                  <select 
                    value={`${adminVoteForm.voter_type}:${adminVoteForm.voter_id}`} 
                    onChange={e => {
                      const [type, id] = e.target.value.split(':')
                      setAdminVoteForm({...adminVoteForm, voter_type: type as any, voter_id: id})
                    }}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db' }}
                  >
                    <option value="">-- Select Voter --</option>
                    {voters
                      .filter(v => v.label.toLowerCase().includes(voteSearch.toLowerCase()))
                      .map(v => (
                      <option key={`${v.type}:${v.id}`} value={`${v.type}:${v.id}`}>{v.label}</option>
                    ))}
                  </select>
                </div>

                {adminVoteForm.voter_id && (
                  <div style={{ marginTop: 24, borderTop: '1px solid #f3f4f6', paddingTop: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                      <div>
                        <h3 style={{ fontSize: 16, fontWeight: 700 }}>Ballot Selections</h3>
                        <p style={{ fontSize: 12, color: '#6b7280' }}>{Object.keys(ballotSelections).length} positions marked</p>
                      </div>
                      <button 
                        style={{ ...styles.btn, background: Object.keys(ballotSelections).length > 0 ? 'linear-gradient(135deg, #059669, #10b981)' : '#9ca3af' }}
                        disabled={Object.keys(ballotSelections).length === 0}
                        onClick={submitProxyBallot}
                      >
                        Submit All & Next Voter
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 24 }}>
                      {currentPositions.map(pos => {
                        const posCands = currentCandidates.filter(c => c.position_id === pos.id && c.status === 'approved')
                        const myVoteForPos = currentVotes.find(v => 
                          v.position_id === pos.id && 
                          (adminVoteForm.voter_type === 'student' ? v.voter_student_id === adminVoteForm.voter_id : v.voter_teacher_id === adminVoteForm.voter_id)
                        )
                        const currentSelection = ballotSelections[pos.id]

                        return (
                          <div key={pos.id} style={{ padding: 16, borderRadius: 12, border: myVoteForPos ? '2px solid #16a34a' : (currentSelection ? '2px solid #6d28d9' : '1px solid #e5e7eb'), background: '#fff' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, borderBottom: '1px solid #f3f4f6', paddingBottom: 8, alignItems: 'center' }}>
                              <h3 style={{ fontSize: 15, fontWeight: 600 }}>{pos.title}</h3>
                              {myVoteForPos && (
                                <button 
                                  style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 11, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                                  onClick={() => adminCancelVote(myVoteForPos.id)}
                                >
                                  Cancel Vote
                                </button>
                              )}
                            </div>
                            
                            {posCands.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {posCands.map(cand => {
                                  const isVoted = myVoteForPos?.candidate_id === cand.id
                                  const isSelected = currentSelection === cand.id
                                  
                                  return (
                                    <div 
                                      key={cand.id} 
                                      onClick={() => {
                                        if (myVoteForPos) return
                                        setBallotSelections(prev => ({ ...prev, [pos.id]: cand.id }))
                                      }}
                                      style={{ 
                                        padding: 12, border: '1.5px solid', 
                                        borderColor: isVoted ? '#16a34a' : (isSelected ? '#6d28d9' : '#e5e7eb'),
                                        borderRadius: 10, 
                                        background: isVoted ? '#f0fdf4' : (isSelected ? '#f5f3ff' : '#fff'),
                                        cursor: myVoteForPos ? 'default' : 'pointer',
                                        transition: 'all 0.2s'
                                      }}
                                    >
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ fontWeight: 600, fontSize: 14 }}>{cand.teacher?.full_name || cand.student?.full_name}</div>
                                        {(isVoted || isSelected) && <span style={{ color: isVoted ? '#16a34a' : '#6d28d9', fontSize: 12, fontWeight: 700 }}>{isVoted ? '✅' : '🎯'}</span>}
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
              </div>
            </>
          ) : (
            <p style={{ fontSize: 14, color: '#6b7280' }}>Please select an election from the dropdown above.</p>
          )}
        </div>
      )}
      </div>

      {/* Modals */}
      {showElectionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: '100%', maxWidth: 400 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Create New Election</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Election Title</label>
              <input 
                value={electionForm.title} onChange={e => setElectionForm({...electionForm, title: e.target.value})}
                placeholder="e.g. 2025 Prefectorial Elections"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button style={styles.btnOutline} onClick={() => setShowElectionModal(false)}>Cancel</button>
              <button style={styles.btn} onClick={createElection}>Create</button>
            </div>
          </div>
        </div>
      )}

      {showPositionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: '100%', maxWidth: 400 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Add Position</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Position Title</label>
              <input 
                value={positionForm.title} onChange={e => setPositionForm({...positionForm, title: e.target.value})}
                placeholder="e.g. Head Prefect"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Max Winners</label>
              <input 
                type="number" min={1}
                value={positionForm.max_winners} onChange={e => setPositionForm({...positionForm, max_winners: parseInt(e.target.value) || 1})}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button style={styles.btnOutline} onClick={() => setShowPositionModal(false)}>Cancel</button>
              <button style={styles.btn} onClick={createPosition}>Add</button>
            </div>
          </div>
        </div>
      )}

      {vettingCandidate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Vet Candidate</h3>
            <p style={{ fontSize: 14, color: '#374151', marginBottom: 16, fontWeight: 600 }}>
              {vettingCandidate.teacher?.full_name || vettingCandidate.student?.full_name} — {currentPositions.find(p => p.id === vettingCandidate.position_id)?.title}
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
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Notes</label>
              <textarea 
                rows={3}
                value={vetForm.vet_notes} onChange={e => setVetForm({...vetForm, vet_notes: e.target.value})}
                placeholder="Interview notes..."
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', boxSizing: 'border-box', resize: 'vertical' }}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Status</label>
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

      {showAdminNominateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: '100%', maxWidth: 450 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Proxy Nomination</h3>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Select Nominee (Student or Teacher)</label>
              <input 
                type="text" 
                placeholder="Search name..." 
                value={nominateSearch} onChange={e => setNominateSearch(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', marginBottom: 8, fontSize: 13 }}
              />
              <select 
                value={`${adminNominateForm.nominee_type}:${adminNominateForm.nominee_id}`} 
                onChange={e => {
                  const [type, id] = e.target.value.split(':')
                  setAdminNominateForm({...adminNominateForm, nominee_type: type as any, nominee_id: id})
                }}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db' }}
              >
                <option value="">-- Select Nominee --</option>
                {voters
                  .filter(v => v.label.toLowerCase().includes(nominateSearch.toLowerCase()))
                  .map(v => (
                  <option key={`${v.type}:${v.id}`} value={`${v.type}:${v.id}`}>{v.label}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Select Position</label>
              <select 
                value={adminNominateForm.position_id} onChange={e => setAdminNominateForm({...adminNominateForm, position_id: e.target.value})}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db' }}
              >
                <option value="">-- Select Position --</option>
                {currentPositions.map(pos => (
                   <option key={pos.id} value={pos.id}>{pos.title}</option>
                ))}
              </select>
            </div>
            
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Manifesto (Optional)</label>
              <textarea 
                rows={4}
                value={adminNominateForm.manifesto} onChange={e => setAdminNominateForm({...adminNominateForm, manifesto: e.target.value})}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', resize: 'vertical' }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button style={styles.btnOutline} onClick={() => setShowAdminNominateModal(false)}>Cancel</button>
              <button style={styles.btn} onClick={adminNominateCandidate}>Submit Nomination</button>
            </div>
          </div>
        </div>
      )}


    </div>
  )
}
