// src/pages/nurse/NurseDashboard.tsx
import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { format } from 'date-fns'
import { Stethoscope, Activity, Search, Plus, FileText, AlertCircle, Phone, X } from 'lucide-react'
import { useStudents } from '../../hooks/useStudents'

const T = {
  primary: '#0ea5e9',
  secondary: '#0284c7',
  bg: '#f0f9ff',
  card: '#ffffff',
  text: '#0f172a',
  muted: '#64748b',
  border: '#e2e8f0',
  red: '#ef4444',
  green: '#10b981',
  orange: '#f59e0b',
}

interface MedicalRecord {
  id: string
  student_id: string
  blood_type: string
  allergies: string
  chronic_conditions: string
  emergency_contact_name: string
  emergency_contact_phone: string
  notes: string
}

interface ClinicVisit {
  id: string
  student_id: string
  visit_date: string
  symptoms: string
  treatment: string
  medication_given: string
  time_in: string
  time_out: string
  parent_notified: boolean
  notes: string
  student: any
}

function StatCard({ icon: Icon, label, value, color, bg }: any) {
  return (
    <div style={{
      background: T.card, borderRadius: 8, padding: '16px 20px', border: `1px solid ${T.border}`,
      display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
    }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={24} />
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.muted }}>{label}</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: T.text, lineHeight: 1.2 }}>{value}</div>
      </div>
    </div>
  )
}

export default function NurseDashboard() {
  const { user } = useAuth()
  const { data: students = [], isLoading: studentsLoading } = useStudents()
  
  const [visits, setVisits] = useState<ClinicVisit[]>([])
  const [loadingVisits, setLoadingVisits] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [medicalRecord, setMedicalRecord] = useState<MedicalRecord | null>(null)
  const [visitModalOpen, setVisitModalOpen] = useState(false)
  
  const [visitForm, setVisitForm] = useState({
    symptoms: '', treatment: '', medication_given: '', parent_notified: false, notes: ''
  })
  const [saving, setSaving] = useState(false)

  const fetchVisits = async () => {
    if (!user?.school_id) return
    const { data } = await supabase
      .from('clinic_visits')
      .select('*, student:students(id, full_name, class:classes(name))')
      .eq('school_id', user.school_id)
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (data) setVisits(data as any)
    setLoadingVisits(false)
  }

  useEffect(() => {
    fetchVisits()
  }, [user?.school_id])

  const fetchMedicalRecord = async (studentId: string) => {
    const { data } = await supabase
      .from('medical_records')
      .select('*')
      .eq('student_id', studentId)
      .maybeSingle()
    setMedicalRecord(data || null)
  }

  const handleSelectStudent = (s: any) => {
    setSelectedStudent(s)
    fetchMedicalRecord(s.id)
  }

  const handleLogVisit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent || !user?.school_id) return
    setSaving(true)
    
    const timeIn = format(new Date(), 'HH:mm')
    
    const payload = {
      school_id: user.school_id,
      student_id: selectedStudent.id,
      nurse_id: user.id,
      visit_date: format(new Date(), 'yyyy-MM-dd'),
      time_in: timeIn,
      time_out: timeIn, // Assuming quick visit for now
      ...visitForm
    }
    
    await supabase.from('clinic_visits').insert(payload)
    
    if (visitForm.parent_notified) {
      // Send notification to parent
      const { data: parentRel } = await supabase
        .from('students')
        .select('user_id, guardian_name')
        .eq('id', selectedStudent.id)
        .single()
        
      if (parentRel?.user_id) {
        await supabase.from('notifications').insert({
          school_id: user.school_id,
          user_id: parentRel.user_id,
          title: `Clinic Visit: ${selectedStudent.full_name}`,
          body: `Your ward visited the clinic today for: ${visitForm.symptoms}. Treatment: ${visitForm.treatment || 'None'}`,
          type: 'alert'
        })
      }
    }
    
    setVisitForm({ symptoms: '', treatment: '', medication_given: '', parent_notified: false, notes: '' })
    setVisitModalOpen(false)
    setSaving(false)
    fetchVisits()
  }

  const handleSaveMedicalRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent || !user?.school_id) return
    
    const payload = {
      school_id: user.school_id,
      student_id: selectedStudent.id,
      blood_type: (e.target as any).blood_type.value,
      allergies: (e.target as any).allergies.value,
      chronic_conditions: (e.target as any).chronic_conditions.value,
      emergency_contact_name: (e.target as any).emergency_contact_name.value,
      emergency_contact_phone: (e.target as any).emergency_contact_phone.value,
      notes: (e.target as any).notes.value
    }
    
    if (medicalRecord?.id) {
      await supabase.from('medical_records').update(payload).eq('id', medicalRecord.id)
    } else {
      await supabase.from('medical_records').insert(payload)
    }
    fetchMedicalRecord(selectedStudent.id)
    alert("Medical Record Saved!")
  }

  const todaysVisits = visits.filter(v => v.visit_date === format(new Date(), 'yyyy-MM-dd')).length

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto', fontFamily: '"DM Sans", sans-serif' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 8px 16px rgba(2, 132, 199, 0.2)' }}>
          <Stethoscope size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: T.text, margin: 0, letterSpacing: '-0.02em' }}>Clinic Portal</h1>
          <p style={{ fontSize: 13, color: T.muted, margin: '2px 0 0 0' }}>School Medical & Health Center</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <StatCard icon={Activity} label="Today's Visits" value={todaysVisits} color={T.primary} bg={`${T.primary}15`} />
        <StatCard icon={FileText} label="Total Records" value={students.length} color={T.green} bg={`${T.green}15`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24, alignItems: 'start' }}>
        
        {/* Left Column: Student Search & Selection */}
        <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Search size={18} color={T.primary} /> Find Patient
          </h2>
          
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <Search size={16} color={T.muted} style={{ position: 'absolute', left: 12, top: 10 }} />
            <input
              type="text"
              placeholder="Search by student name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 14, outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
            {students.filter((s:any) => s.full_name.toLowerCase().includes(search.toLowerCase())).slice(0, 10).map((s:any) => (
              <div
                key={s.id}
                onClick={() => handleSelectStudent(s)}
                style={{
                  padding: 12, borderRadius: 8, border: `1px solid ${selectedStudent?.id === s.id ? T.primary : T.border}`,
                  background: selectedStudent?.id === s.id ? `${T.primary}10` : '#fff',
                  cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 12
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${T.primary}20`, color: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                  {s.full_name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{s.full_name}</div>
                  <div style={{ fontSize: 12, color: T.muted }}>{s.class?.name || 'No Class'} • ID: {s.student_id || 'N/A'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Medical Record & Actions */}
        {selectedStudent ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* Quick Actions */}
            <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <img src={selectedStudent.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedStudent.full_name)}&background=0ea5e9&color=fff`} alt="" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} />
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: T.text, margin: 0 }}>{selectedStudent.full_name}</h2>
                  <div style={{ fontSize: 14, color: T.muted, marginTop: 4 }}>{selectedStudent.class?.name} • {selectedStudent.gender}</div>
                </div>
              </div>
              <button
                onClick={() => setVisitModalOpen(true)}
                style={{ background: T.primary, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: `0 4px 12px ${T.primary}40` }}
              >
                <Plus size={18} /> Log Clinic Visit
              </button>
            </div>

            {/* Medical Record Form */}
            <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity size={18} color={T.orange} /> Medical History
              </h3>
              
              <form onSubmit={handleSaveMedicalRecord} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 6 }}>Blood Type</label>
                  <input name="blood_type" defaultValue={medicalRecord?.blood_type || ''} placeholder="e.g. O+, A-" style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${T.border}`, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 6 }}>Allergies <AlertCircle size={12} color={T.red} style={{ display: 'inline', marginLeft: 4 }} /></label>
                  <input name="allergies" defaultValue={medicalRecord?.allergies || ''} placeholder="e.g. Peanuts, Penicillin" style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${medicalRecord?.allergies ? T.red : T.border}`, outline: 'none' }} />
                </div>
                
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 6 }}>Chronic Conditions</label>
                  <input name="chronic_conditions" defaultValue={medicalRecord?.chronic_conditions || ''} placeholder="Asthma, Diabetes, etc." style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${T.border}`, outline: 'none' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 6 }}><Phone size={12} style={{ display: 'inline' }} /> Emergency Contact Name</label>
                  <input name="emergency_contact_name" defaultValue={medicalRecord?.emergency_contact_name || ''} style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${T.border}`, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 6 }}>Emergency Contact Phone</label>
                  <input name="emergency_contact_phone" defaultValue={medicalRecord?.emergency_contact_phone || ''} style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${T.border}`, outline: 'none' }} />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 6 }}>General Notes</label>
                  <textarea name="notes" defaultValue={medicalRecord?.notes || ''} rows={3} style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${T.border}`, outline: 'none', resize: 'vertical' }} />
                </div>

                <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" style={{ background: T.text, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    Save Medical Record
                  </button>
                </div>
              </form>
            </div>

            {/* Visit History */}
            <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: '0 0 20px 0' }}>Recent Clinic Visits</h3>
              
              {loadingVisits ? <p style={{ color: T.muted, fontSize: 14 }}>Loading...</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {visits.filter(v => v.student_id === selectedStudent.id).map(v => (
                    <div key={v.id} style={{ padding: 16, borderRadius: 12, border: `1px solid ${T.border}`, background: T.bg }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{v.visit_date} • {v.time_in}</div>
                        {v.parent_notified && <span style={{ fontSize: 11, background: T.green, color: '#fff', padding: '2px 8px', borderRadius: 99, fontWeight: 700 }}>Parent Notified</span>}
                      </div>
                      <div style={{ fontSize: 13, color: T.text, marginBottom: 4 }}><b>Symptoms:</b> {v.symptoms}</div>
                      {v.treatment && <div style={{ fontSize: 13, color: T.text, marginBottom: 4 }}><b>Treatment:</b> {v.treatment}</div>}
                      {v.medication_given && <div style={{ fontSize: 13, color: T.text }}><b>Meds:</b> {v.medication_given}</div>}
                    </div>
                  ))}
                  {visits.filter(v => v.student_id === selectedStudent.id).length === 0 && (
                    <div style={{ textAlign: 'center', padding: 24, color: T.muted, fontSize: 14 }}>No past visits recorded.</div>
                  )}
                </div>
              )}
            </div>

          </div>
        ) : (
          <div style={{ background: T.card, borderRadius: 8, border: `1px dashed ${T.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: T.muted }}>
            <Stethoscope size={48} opacity={0.2} style={{ marginBottom: 16 }} />
            <p style={{ fontSize: 15, fontWeight: 600 }}>Select a student to view their medical profile</p>
          </div>
        )}
      </div>

      {/* Log Visit Modal */}
      {visitModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'var(--bg-card)', width: '100%', maxWidth: 500, borderRadius: 8, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Log Clinic Visit</h3>
              <button onClick={() => setVisitModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted }}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleLogVisit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: T.bg, padding: 12, borderRadius: 8, fontSize: 14, fontWeight: 600, color: T.primary }}>
                Patient: {selectedStudent?.full_name}
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>Symptoms *</label>
                <textarea required value={visitForm.symptoms} onChange={e => setVisitForm({...visitForm, symptoms: e.target.value})} rows={2} style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${T.border}`, outline: 'none' }} placeholder="Fever, headache, stomach pain..." />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>Treatment / Action</label>
                <textarea value={visitForm.treatment} onChange={e => setVisitForm({...visitForm, treatment: e.target.value})} rows={2} style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${T.border}`, outline: 'none' }} placeholder="Rest in sick bay, applied bandage..." />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>Medication Given</label>
                <input type="text" value={visitForm.medication_given} onChange={e => setVisitForm({...visitForm, medication_given: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${T.border}`, outline: 'none' }} placeholder="e.g. Paracetamol 500mg" />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', background: `${T.orange}10`, padding: 12, borderRadius: 8, border: `1px solid ${T.orange}30` }}>
                <input type="checkbox" checked={visitForm.parent_notified} onChange={e => setVisitForm({...visitForm, parent_notified: e.target.checked})} style={{ width: 16, height: 16 }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: T.orange }}>Send SMS/Push Alert to Parents</span>
              </label>

              <button disabled={saving} type="submit" style={{ width: '100%', background: T.primary, color: '#fff', border: 'none', padding: 14, borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 8 }}>
                {saving ? 'Saving...' : 'Save Visit Record'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
