import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useStudents } from '../../hooks/useStudents'
import { boardingService } from '../../services/boarding.service'
import Modal from '../../components/ui/Modal'
import toast from 'react-hot-toast'
import { Plus, Home, Users, Trash2, Edit, DoorOpen } from 'lucide-react'

function Btn({ children, onClick, variant = 'primary', style, disabled }: any) {
  const [hov, setHov] = useState(false)
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '9px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600,
    border: variant === 'secondary' ? '1.5px solid #e5e7eb' : 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s', opacity: disabled ? 0.6 : 1,
    fontFamily: '"DM Sans",sans-serif',
    background: variant === 'secondary' ? (hov ? '#f8fafc' : '#fff')
      : variant === 'danger' ? (hov ? '#b91c1c' : '#dc2626')
      : (hov ? '#5b21b6' : '#6d28d9'),
    color: variant === 'secondary' ? '#374151' : '#fff',
    ...style,
  }
  return <button disabled={disabled} onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={base}>{children}</button>
}

const TAB = (active: boolean): React.CSSProperties => ({
  padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
  cursor: 'pointer', border: 'none', transition: 'all .15s',
  fontFamily: '"DM Sans",sans-serif',
  background: active ? '#6d28d9' : 'transparent', color: active ? '#fff' : '#6b7280',
})

export default function DormitoryPage() {
  const { user } = useAuth()
  const schoolId = user?.school_id || ''
  const qc = useQueryClient()
  const { data: students = [] } = useStudents()

  const [activeTab, setActiveTab] = useState<'dorms' | 'rooms' | 'assignments'>('dorms')

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: dorms = [] } = useQuery({
    queryKey: ['dormitories', schoolId],
    queryFn: async () => { const { data } = await boardingService.getDormitories(schoolId); return data || [] },
    enabled: !!schoolId
  })
  const { data: rooms = [] } = useQuery({
    queryKey: ['dorm_rooms', schoolId],
    queryFn: async () => {
      const { data } = await supabase
        .from('dorm_rooms')
        .select('*, dormitory:dormitories(id, name)')
        .in('dormitory_id', dorms.map((d: any) => d.id))
      return data || []
    },
    enabled: dorms.length > 0,
  })
  const { data: assignments = [] } = useQuery({
    queryKey: ['dorm_assignments', schoolId],
    queryFn: async () => { const { data } = await boardingService.getAssignmentsByDorm(schoolId); return data || [] },
    enabled: !!schoolId
  })
  const { data: staffUsers = [] } = useQuery({
    queryKey: ['staff_users', schoolId],
    queryFn: async () => {
      const { data } = await supabase.from('users').select('id, full_name, role')
        .eq('school_id', schoolId).in('role', ['teacher', 'staff', 'admin'])
      return data || []
    },
    enabled: !!schoolId
  })

  // ── Dorm mutations ────────────────────────────────────────────────────────
  const createDorm = useMutation({ mutationFn: (d: any) => boardingService.createDormitory(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['dormitories'] }); setDormModal(false); toast.success('Dormitory created') } })
  const updateDorm = useMutation({ mutationFn: ({ id, data }: any) => boardingService.updateDormitory(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['dormitories'] }); setDormModal(false); toast.success('Dormitory updated') } })
  const deleteDorm = useMutation({ mutationFn: (id: string) => boardingService.deleteDormitory(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['dormitories'] }); toast.success('Dormitory deleted') } })

  // ── Room mutations ────────────────────────────────────────────────────────
  const createRoom = useMutation({
    mutationFn: (d: any) => supabase.from('dorm_rooms').insert(d).select().single(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dorm_rooms', schoolId] }); setRoomModal(false); toast.success('Room added') },
  })
  const deleteRoom = useMutation({
    mutationFn: (id: string) => supabase.from('dorm_rooms').delete().eq('id', id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dorm_rooms', schoolId] }); toast.success('Room deleted') },
  })

  // ── Assignment mutations ──────────────────────────────────────────────────
  const assignStudent = useMutation({
    mutationFn: (d: any) => boardingService.createAssignment(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dorm_assignments'] }); setAssignModal(false); toast.success('Student assigned') },
  })
  const removeAssignment = useMutation({
    mutationFn: (id: string) => boardingService.deleteAssignment(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dorm_assignments'] }); toast.success('Assignment removed') },
  })

  // ── Modal state ───────────────────────────────────────────────────────────
  const [dormModal, setDormModal] = useState(false)
  const [editingDorm, setEditingDorm] = useState<any>(null)
  const [dormForm, setDormForm] = useState({ name: '', capacity: '', gender_restriction: 'mixed', house_parent_id: '' })

  const [roomModal, setRoomModal] = useState(false)
  const [roomForm, setRoomForm] = useState({ dormitory_id: '', room_number: '', capacity: '2' })

  const [assignModal, setAssignModal] = useState(false)
  const [assignForm, setAssignForm] = useState({ student_id: '', room_id: '' })

  // ── Derived ───────────────────────────────────────────────────────────────
  const assignmentsByRoom = useMemo(() => {
    const map: Record<string, any[]> = {}
    assignments.forEach((a: any) => {
      const rid = a.room_id
      if (!map[rid]) map[rid] = []
      map[rid].push(a)
    })
    return map
  }, [assignments])

  const assignmentsByDorm = useMemo(() => {
    const map: Record<string, number> = {}
    dorms.forEach((d: any) => { map[d.id] = 0 })
    rooms.forEach((r: any) => {
      const count = assignmentsByRoom[r.id]?.length || 0
      map[r.dormitory_id] = (map[r.dormitory_id] || 0) + count
    })
    return map
  }, [rooms, assignmentsByRoom, dorms])

  const roomsByDorm = useMemo(() => {
    const map: Record<string, any[]> = {}
    rooms.forEach((r: any) => {
      if (!map[r.dormitory_id]) map[r.dormitory_id] = []
      map[r.dormitory_id].push(r)
    })
    return map
  }, [rooms])

  const inputStyle: React.CSSProperties = { width: '100%', padding: 10, borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box', fontFamily: '"DM Sans",sans-serif' }
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto', fontFamily: '"DM Sans",sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1e0646', margin: '0 0 4px' }}>Boarding & Dormitory</h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: 14 }}>Manage dormitories, rooms, and student assignments.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {activeTab === 'dorms' && (
            <Btn onClick={() => { setEditingDorm(null); setDormForm({ name: '', capacity: '', gender_restriction: 'mixed', house_parent_id: '' }); setDormModal(true) }}>
              <Plus size={15} /> Add Dormitory
            </Btn>
          )}
          {activeTab === 'rooms' && (
            <Btn onClick={() => { setRoomForm({ dormitory_id: '', room_number: '', capacity: '2' }); setRoomModal(true) }}
              disabled={dorms.length === 0}>
              <DoorOpen size={15} /> Add Room
            </Btn>
          )}
          {activeTab === 'assignments' && (
            <Btn onClick={() => { setAssignForm({ student_id: '', room_id: '' }); setAssignModal(true) }}
              disabled={rooms.length === 0}>
              <Users size={15} /> Assign Student
            </Btn>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#f5f3ff', padding: 4, borderRadius: 12, width: 'fit-content' }}>
        <button style={TAB(activeTab === 'dorms')} onClick={() => setActiveTab('dorms')}><Home size={14} style={{ marginRight: 4 }} />Dormitories ({dorms.length})</button>
        <button style={TAB(activeTab === 'rooms')} onClick={() => setActiveTab('rooms')}><DoorOpen size={14} style={{ marginRight: 4 }} />Rooms ({rooms.length})</button>
        <button style={TAB(activeTab === 'assignments')} onClick={() => setActiveTab('assignments')}><Users size={14} style={{ marginRight: 4 }} />Assignments ({assignments.length})</button>
      </div>

      {/* ── DORMS TAB ── */}
      {activeTab === 'dorms' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {dorms.map((d: any) => (
            <div key={d.id} style={{ background: 'var(--bg-card)', borderRadius: 18, padding: 22, border: '1.5px solid #f0eefe', boxShadow: '0 2px 8px rgba(109,40,217,.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ background: '#f5f3ff', padding: 10, borderRadius: 12, color: '#6d28d9' }}><Home size={20} /></div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e0646' }}>{d.name}</h3>
                    <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', color: '#64748b', fontWeight: 700 }}>
                      {d.gender_restriction} · Cap: {d.capacity || '—'}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => { setEditingDorm(d); setDormForm({ name: d.name, capacity: d.capacity?.toString() || '', gender_restriction: d.gender_restriction || 'mixed', house_parent_id: d.house_parent_id || '' }); setDormModal(true) }}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-subtle)', padding: 4 }}><Edit size={14} /></button>
                  <button onClick={() => { if (confirm('Delete this dormitory?')) deleteDorm.mutate(d.id) }}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}><Trash2 size={14} /></button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 20, fontSize: 13, color: '#475569', background: '#f8fafc', padding: '10px 14px', borderRadius: 10 }}>
                <span>🏠 {roomsByDorm[d.id]?.length || 0} rooms</span>
                <span>👤 {assignmentsByDorm[d.id] || 0} students</span>
                {d.house_parent?.full_name && <span>👨‍🏫 {d.house_parent.full_name}</span>}
              </div>
            </div>
          ))}
          {dorms.length === 0 && <p style={{ color: 'var(--text-subtle)', fontSize: 14, gridColumn: '1/-1' }}>No dormitories yet. Add one to get started.</p>}
        </div>
      )}

      {/* ── ROOMS TAB ── */}
      {activeTab === 'rooms' && (
        dorms.length === 0 ? (
          <div style={{ background: 'var(--bg-card)', borderRadius: 18, padding: '40px', textAlign: 'center', border: '1.5px solid #f0eefe' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏠</div>
            <p style={{ color: 'var(--text-subtle)', fontSize: 14 }}>Create dormitories first before adding rooms.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {dorms.map((d: any) => {
              const dormRooms = roomsByDorm[d.id] || []
              return (
                <div key={d.id} style={{ background: 'var(--bg-card)', borderRadius: 18, border: '1.5px solid #f0eefe', overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg,#faf5ff,#f5f3ff)', borderBottom: '1px solid #f0eefe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Home size={16} color="#6d28d9" />
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#1e0646' }}>{d.name}</span>
                      <span style={{ fontSize: 11, background: '#ede9fe', color: '#7c3aed', padding: '2px 8px', borderRadius: 99, fontWeight: 700 }}>{dormRooms.length} rooms</span>
                    </div>
                    <Btn onClick={() => { setRoomForm({ dormitory_id: d.id, room_number: '', capacity: '2' }); setRoomModal(true) }} style={{ padding: '6px 14px', fontSize: 12 }}>
                      <Plus size={13} /> Add Room
                    </Btn>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, padding: 16 }}>
                    {dormRooms.map((r: any) => {
                      const occupied = assignmentsByRoom[r.id]?.length || 0
                      const full = occupied >= r.capacity
                      return (
                        <div key={r.id} style={{ background: full ? '#fef2f2' : '#f8fafc', borderRadius: 14, padding: '14px 16px', border: `1.5px solid ${full ? '#fecaca' : '#e2e8f0'}`, position: 'relative' }}>
                          <button onClick={() => { if (confirm(`Delete Room ${r.room_number}?`)) deleteRoom.mutate(r.id) }}
                            style={{ position: 'absolute', top: 8, right: 8, border: 'none', background: 'none', cursor: 'pointer', color: '#d1d5db' }}>
                            <Trash2 size={12} />
                          </button>
                          <div style={{ fontSize: 16, fontWeight: 800, color: '#1e0646', marginBottom: 4 }}>Room {r.room_number}</div>
                          <div style={{ fontSize: 12, color: '#64748b' }}>Capacity: {r.capacity}</div>
                          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ flex: 1, height: 4, borderRadius: 2, background: '#e2e8f0', overflow: 'hidden' }}>
                              <div style={{ width: `${Math.min(100, (occupied / r.capacity) * 100)}%`, height: '100%', background: full ? '#ef4444' : '#6d28d9', borderRadius: 2 }} />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: full ? '#ef4444' : '#6b7280' }}>{occupied}/{r.capacity}</span>
                          </div>
                        </div>
                      )
                    })}
                    {dormRooms.length === 0 && (
                      <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '20px', color: 'var(--text-subtle)', fontSize: 13 }}>
                        No rooms yet — click "Add Room" above.
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {/* ── ASSIGNMENTS TAB ── */}
      {activeTab === 'assignments' && (
        <div style={{ background: 'var(--bg-card)', borderRadius: 18, border: '1.5px solid #f0eefe', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fcfaff', borderBottom: '1.5px solid #f0eefe' }}>
                {['Student', 'Dormitory', 'Room', 'Date Assigned', ''].map(h => (
                  <th key={h} style={{ padding: '14px 18px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assignments.map((a: any) => {
                const room = rooms.find((r: any) => r.id === a.room_id)
                const dorm = dorms.find((d: any) => d.id === room?.dormitory_id)
                return (
                  <tr key={a.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '14px 18px', fontSize: 13, fontWeight: 600, color: '#1e0646' }}>
                      {a.student?.full_name} <span style={{ color: 'var(--text-subtle)', fontSize: 11, fontWeight: 600 }}>({a.student?.student_id})</span>
                    </td>
                    <td style={{ padding: '14px 18px', fontSize: 13, color: '#475569' }}>{dorm?.name || '—'}</td>
                    <td style={{ padding: '14px 18px', fontSize: 13, color: '#475569' }}>Room {room?.room_number || '—'}</td>
                    <td style={{ padding: '14px 18px', fontSize: 13, color: '#475569' }}>{new Date(a.start_date).toLocaleDateString()}</td>
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <button onClick={() => { if (confirm('Remove assignment?')) removeAssignment.mutate(a.id) }}
                        style={{ border: 'none', background: '#fee2e2', color: '#ef4444', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        Remove
                      </button>
                    </td>
                  </tr>
                )
              })}
              {assignments.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--text-subtle)', fontSize: 14 }}>No students assigned to dorms yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── DORM MODAL ── */}
      <Modal open={dormModal} onClose={() => setDormModal(false)} title={editingDorm ? 'Edit Dormitory' : 'New Dormitory'} size="sm"
        footer={<><Btn variant="secondary" onClick={() => setDormModal(false)}>Cancel</Btn><Btn onClick={() => {
          const payload = { school_id: schoolId, name: dormForm.name, capacity: parseInt(dormForm.capacity) || 0, gender_restriction: dormForm.gender_restriction, house_parent_id: dormForm.house_parent_id || null }
          if (editingDorm) updateDorm.mutate({ id: editingDorm.id, data: payload })
          else createDorm.mutate(payload)
        }}>Save</Btn></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label style={labelStyle}>Dormitory Name</label><input value={dormForm.name} onChange={e => setDormForm(p => ({ ...p, name: e.target.value }))} style={inputStyle} /></div>
          <div><label style={labelStyle}>Total Capacity (beds)</label><input type="number" value={dormForm.capacity} onChange={e => setDormForm(p => ({ ...p, capacity: e.target.value }))} style={inputStyle} /></div>
          <div>
            <label style={labelStyle}>Gender Restriction</label>
            <select value={dormForm.gender_restriction} onChange={e => setDormForm(p => ({ ...p, gender_restriction: e.target.value }))} style={inputStyle}>
              <option value="mixed">Mixed</option><option value="male">Male Only</option><option value="female">Female Only</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>House Parent (Staff)</label>
            <select value={dormForm.house_parent_id} onChange={e => setDormForm(p => ({ ...p, house_parent_id: e.target.value }))} style={inputStyle}>
              <option value="">None</option>
              {staffUsers.map((u: any) => <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>)}
            </select>
          </div>
        </div>
      </Modal>

      {/* ── ROOM MODAL ── */}
      <Modal open={roomModal} onClose={() => setRoomModal(false)} title="Add Room" size="sm"
        footer={<><Btn variant="secondary" onClick={() => setRoomModal(false)}>Cancel</Btn><Btn onClick={() => {
          if (!roomForm.dormitory_id || !roomForm.room_number) { toast.error('Select a dorm and enter a room number'); return }
          createRoom.mutate({ dormitory_id: roomForm.dormitory_id, room_number: roomForm.room_number, capacity: parseInt(roomForm.capacity) || 2 })
        }}>Add Room</Btn></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Dormitory *</label>
            <select value={roomForm.dormitory_id} onChange={e => setRoomForm(p => ({ ...p, dormitory_id: e.target.value }))} style={inputStyle}>
              <option value="">Select Dormitory...</option>
              {dorms.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div><label style={labelStyle}>Room Number / Name *</label><input value={roomForm.room_number} onChange={e => setRoomForm(p => ({ ...p, room_number: e.target.value }))} placeholder="e.g. 101 or A1" style={inputStyle} /></div>
          <div><label style={labelStyle}>Capacity (beds)</label><input type="number" min="1" max="20" value={roomForm.capacity} onChange={e => setRoomForm(p => ({ ...p, capacity: e.target.value }))} style={inputStyle} /></div>
        </div>
      </Modal>

      {/* ── ASSIGN MODAL ── */}
      <Modal open={assignModal} onClose={() => setAssignModal(false)} title="Assign Student to Room" size="sm"
        footer={<><Btn variant="secondary" onClick={() => setAssignModal(false)}>Cancel</Btn><Btn onClick={() => {
          if (!assignForm.student_id || !assignForm.room_id) { toast.error('Select a student and a room'); return }
          assignStudent.mutate({ school_id: schoolId, student_id: assignForm.student_id, room_id: assignForm.room_id })
        }}>Assign</Btn></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Student *</label>
            <select value={assignForm.student_id} onChange={e => setAssignForm(p => ({ ...p, student_id: e.target.value }))} style={inputStyle}>
              <option value="">Select Student...</option>
              {(Array.isArray(students) ? students : []).map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Room *</label>
            <select value={assignForm.room_id} onChange={e => setAssignForm(p => ({ ...p, room_id: e.target.value }))} style={inputStyle}>
              <option value="">Select Room...</option>
              {dorms.map((d: any) => (
                <optgroup key={d.id} label={d.name}>
                  {(roomsByDorm[d.id] || []).map((r: any) => {
                    const occ = assignmentsByRoom[r.id]?.length || 0
                    const full = occ >= r.capacity
                    return <option key={r.id} value={r.id} disabled={full}>Room {r.room_number} ({occ}/{r.capacity}){full ? ' — FULL' : ''}</option>
                  })}
                </optgroup>
              ))}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  )
}
