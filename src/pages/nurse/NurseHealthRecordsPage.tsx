import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { Search, HeartPulse, AlertTriangle, Phone, Save, X, User } from 'lucide-react'
import toast from 'react-hot-toast'
import FlaskLoader from '../../components/ui/FlaskLoader'

export default function NurseHealthRecordsPage() {
  const { user } = useAuth()
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editingRecord, setEditingRecord] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user?.school_id) loadStudents()
  }, [user?.school_id])

  async function loadStudents() {
    setLoading(true)
    const { data } = await supabase
      .from('students')
      .select(`
        id, full_name, student_id, class:classes(name),
        medical_record:medical_records(*)
      `)
      .eq('school_id', user!.school_id)
      .eq('is_active', true)
      .order('full_name')

    setStudents(data || [])
    setLoading(false)
  }

  async function saveRecord(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    
    try {
      const payload = {
        school_id: user!.school_id,
        student_id: editingRecord.student_id,
        blood_type: editingRecord.blood_type,
        allergies: editingRecord.allergies,
        chronic_conditions: editingRecord.chronic_conditions,
        emergency_contact_name: editingRecord.emergency_contact_name,
        emergency_contact_phone: editingRecord.emergency_contact_phone,
        notes: editingRecord.notes
      }

      let res
      if (editingRecord.id) {
        res = await supabase.from('medical_records').update(payload).eq('id', editingRecord.id)
      } else {
        res = await supabase.from('medical_records').insert(payload)
      }

      if (res.error) throw res.error

      toast.success('Medical record updated')
      setEditingRecord(null)
      loadStudents()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save record')
    } finally {
      setSaving(false)
    }
  }

  const filtered = students.filter(s => 
    s.full_name.toLowerCase().includes(search.toLowerCase()) || 
    s.student_id?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <FlaskLoader fullScreen={false} label="Loading health records..." />

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto', fontFamily: '"DM Sans", sans-serif' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 32, fontWeight: 700, margin: '0 0 4px', color: '#111827' }}>Student Health Records</h1>
          <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>Manage medical histories, allergies, and emergency contacts.</p>
        </div>
        
        <div style={{ position: 'relative', width: 320 }}>
          <Search size={18} color="#9ca3af" style={{ position: 'absolute', left: 16, top: 12 }} />
          <input 
            type="text"
            placeholder="Search student name or ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 16px 10px 42px', borderRadius: 12, border: '1.5px solid #e5e7eb', outline: 'none', fontSize: 14, fontFamily: 'inherit' }}
          />
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e5e7eb' }}>
              <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Student</th>
              <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Blood Type</th>
              <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Medical Alerts</th>
              <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Emergency Contact</th>
              <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                  No students found.
                </td>
              </tr>
            ) : (
              filtered.map(s => {
                const rec = s.medical_record?.[0]
                const hasAlerts = rec?.allergies || rec?.chronic_conditions
                return (
                  <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                          <User size={18} />
                        </div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{s.full_name}</div>
                          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{(s.class as any)?.name} • {s.student_id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      {rec?.blood_type ? (
                        <span style={{ background: '#fee2e2', color: '#dc2626', padding: '4px 10px', borderRadius: 8, fontSize: 13, fontWeight: 800 }}>
                          {rec.blood_type}
                        </span>
                      ) : (
                        <span style={{ color: '#9ca3af', fontSize: 13 }}>Unknown</span>
                      )}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      {hasAlerts ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {rec.allergies && <span style={{ fontSize: 13, color: '#b45309', display: 'flex', alignItems: 'center', gap: 6 }}><AlertTriangle size={14} /> Allergies: {rec.allergies}</span>}
                          {rec.chronic_conditions && <span style={{ fontSize: 13, color: '#be185d', display: 'flex', alignItems: 'center', gap: 6 }}><HeartPulse size={14} /> {rec.chronic_conditions}</span>}
                        </div>
                      ) : (
                        <span style={{ color: '#10b981', fontSize: 13, fontWeight: 600 }}>Clear</span>
                      )}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      {rec?.emergency_contact_name ? (
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>{rec.emergency_contact_name}</div>
                          <div style={{ fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}><Phone size={12} /> {rec.emergency_contact_phone}</div>
                        </div>
                      ) : (
                        <span style={{ color: '#9ca3af', fontSize: 13 }}>Not provided</span>
                      )}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <button 
                        onClick={() => setEditingRecord({ student_name: s.full_name, student_id: s.id, ...(rec || {}) })}
                        style={{ padding: '6px 14px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#1d4ed8', cursor: 'pointer' }}
                      >
                        Edit Record
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {editingRecord && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 500, borderRadius: 24, padding: 32, position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
            <button onClick={() => setEditingRecord(null)} style={{ position: 'absolute', top: 24, right: 24, background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
              <X size={24} />
            </button>
            
            <h2 style={{ margin: '0 0 24px', fontSize: 24, fontWeight: 800, color: '#111827' }}>Edit Health Record</h2>
            <p style={{ color: '#4b5563', marginBottom: 24, fontSize: 15, fontWeight: 600 }}>Student: <span style={{ color: '#111827' }}>{editingRecord.student_name}</span></p>

            <form onSubmit={saveRecord} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Blood Type</label>
                <select 
                  value={editingRecord.blood_type || ''}
                  onChange={e => setEditingRecord({ ...editingRecord, blood_type: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none' }}
                >
                  <option value="">Unknown</option>
                  <option value="A+">A+</option><option value="A-">A-</option>
                  <option value="B+">B+</option><option value="B-">B-</option>
                  <option value="AB+">AB+</option><option value="AB-">AB-</option>
                  <option value="O+">O+</option><option value="O-">O-</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Allergies (Comma separated)</label>
                <input 
                  type="text" 
                  value={editingRecord.allergies || ''}
                  onChange={e => setEditingRecord({ ...editingRecord, allergies: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none' }}
                  placeholder="e.g. Peanuts, Penicillin"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Chronic Conditions</label>
                <input 
                  type="text" 
                  value={editingRecord.chronic_conditions || ''}
                  onChange={e => setEditingRecord({ ...editingRecord, chronic_conditions: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none' }}
                  placeholder="e.g. Asthma, Diabetes"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Emergency Contact Name</label>
                  <input 
                    type="text" 
                    value={editingRecord.emergency_contact_name || ''}
                    onChange={e => setEditingRecord({ ...editingRecord, emergency_contact_name: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Emergency Phone</label>
                  <input 
                    type="text" 
                    value={editingRecord.emergency_contact_phone || ''}
                    onChange={e => setEditingRecord({ ...editingRecord, emergency_contact_phone: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>General Notes</label>
                <textarea 
                  value={editingRecord.notes || ''}
                  onChange={e => setEditingRecord({ ...editingRecord, notes: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', minHeight: 80, resize: 'vertical' }}
                />
              </div>

              <button 
                type="submit"
                disabled={saving}
                style={{ marginTop: 8, width: '100%', padding: '14px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {saving ? 'Saving...' : <><Save size={18} /> Save Health Record</>}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
