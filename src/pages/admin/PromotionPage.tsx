// src/pages/admin/PromotionPage.tsx
import { useState, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { useStudents } from '../../hooks/useStudents'
import { useClasses } from '../../hooks/useClasses'
import { useAuth } from '../../hooks/useAuth'
import Modal from '../../components/ui/Modal'
import toast from 'react-hot-toast'
import { 
  Users, ChevronRight, GraduationCap, ArrowUpRight, 
  CheckCircle2, AlertCircle, RefreshCcw, Search, Filter
} from 'lucide-react'

// ── Components ─────────────────────────────────────────────

function Btn({ children, onClick, variant = 'primary', type = 'button', disabled, loading, style }: any) {
  const [hov, setHov] = useState(false)
  const v: Record<string, React.CSSProperties> = {
    primary:   { background: hov ? '#5b21b6' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', border: 'none', boxShadow: '0 2px 8px rgba(109,40,217,.25)' },
    secondary: { background: hov ? '#f5f3ff' : '#fff', color: '#374151', border: '1.5px solid #e5e7eb' },
    success:   { background: hov ? '#15803d' : '#16a34a', color: '#fff', border: 'none' },
    danger:    { background: hov ? '#b91c1c' : '#dc2626', color: '#fff', border: 'none' },
    ghost:     { background: hov ? '#f5f3ff' : 'transparent', color: '#6d28d9', border: 'none' },
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'10px 18px', borderRadius:10, fontSize:13, fontWeight:600, cursor:disabled?'not-allowed':'pointer', transition:'all .15s', opacity:disabled?0.6:1, fontFamily:'"DM Sans",sans-serif', ...v[variant], ...style }}>
      {loading && <span style={{ width:14, height:14, borderRadius:'50%', border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff', animation:'_spin 0.7s linear infinite', flexShrink:0 }} />}
      {children}
    </button>
  )
}

// ═══════════════════════════════════════════════════════════

export default function PromotionPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const { data: students = [], isLoading: loadingStudents } = useStudents()
  const { data: classes = [], isLoading: loadingClasses } = useClasses()

  const [fromClassId, setFromClassId] = useState('')
  const [targetClassId, setTargetClassId] = useState('') // empty string means "Graduate"
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [processing, setProcessing] = useState(false)
  const [confirmModal, setConfirmModal] = useState(false)
  const [search, setSearch] = useState('')

  // Filter students by class and search
  const classStudents = useMemo(() => {
    return students.filter(s => s.class_id === fromClassId && s.is_active)
  }, [students, fromClassId])

  const filteredStudents = useMemo(() => {
    return classStudents.filter(s => 
      s.full_name.toLowerCase().includes(search.toLowerCase()) || 
      s.student_id?.toLowerCase().includes(search.toLowerCase())
    )
  }, [classStudents, search])

  const isGraduating = targetClassId === 'GRADUATE'

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredStudents.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredStudents.map(s => s.id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  async function handleAction() {
    if (selectedIds.length === 0) return
    setProcessing(true)

    try {
      if (isGraduating) {
        // 1. Move to Alumni
        const graduatingStudents = students.filter(s => selectedIds.includes(s.id))
        const alumniData = graduatingStudents.map(s => ({
          school_id: user?.school_id,
          full_name: s.full_name,
          graduation_year: new Date().getFullYear(),
          student_id: s.student_id,
          email: s.guardian_email, // or student email if available
          phone: s.guardian_phone,
        }))

        const { error: alumniErr } = await supabase.from('alumni').insert(alumniData)
        if (alumniErr) throw alumniErr

        // 2. Deactivate Student Records
        const { error: deactivateErr } = await supabase
          .from('students')
          .update({ is_active: false, class_id: null })
          .in('id', selectedIds)
        
        if (deactivateErr) throw deactivateErr

        toast.success(`${selectedIds.length} students graduated and moved to Alumni Hub`)
      } else {
        // Bulk Promotion
        const { error } = await supabase
          .from('students')
          .update({ class_id: targetClassId })
          .in('id', selectedIds)
        
        if (error) throw error

        const targetClassName = classes.find(c => c.id === targetClassId)?.name
        toast.success(`${selectedIds.length} students promoted to ${targetClassName}`)
      }

      qc.invalidateQueries({ queryKey: ['students'] })
      setSelectedIds([])
      setConfirmModal(false)
    } catch (err: any) {
      toast.error(err.message || 'Action failed')
    } finally {
      setProcessing(false)
    }
  }

  const fromClassName = classes.find(c => c.id === fromClassId)?.name
  const targetClassName = isGraduating ? 'Alumni (Graduate)' : classes.find(c => c.id === targetClassId)?.name

  return (
    <div style={{ fontFamily: '"DM Sans", system-ui, sans-serif', animation: '_fadeIn 0.4s ease' }}>
      <style>{`
        @keyframes _spin { to { transform: rotate(360deg); } }
        @keyframes _fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes _fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .std-row:hover { background: #f9faff; }
        .promo-card { 
          background: #fff; 
          border-radius: 16px; 
          border: 1.5px solid #f0eefe; 
          box-shadow: 0 1px 4px rgba(109,40,217,0.06);
          padding: 24px;
          margin-bottom: 24px;
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 28, fontWeight: 700, color: '#111827', margin: 0 }}>
          Bulk Promotion & Graduation
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
          Efficiency tool for moving students between classes or graduating them at the end of the academic year.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'start' }}>
        
        {/* ── Selection Panel ── */}
        <aside>
          <div className="promo-card" style={{ position: 'sticky', top: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e0646', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Filter size={18} /> Step 1: Configuration
            </h3>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                Current Class (From)
              </label>
              <select 
                value={fromClassId} 
                onChange={e => { setFromClassId(e.target.value); setSelectedIds([]) }}
                style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', background: '#fcfaff', color: '#111827', cursor: 'pointer' }}
              >
                <option value="">Select a class...</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                Next Destination (To)
              </label>
              <select 
                value={targetClassId} 
                onChange={e => setTargetClassId(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: 10, border: `1.5px solid ${isGraduating ? '#f59e0b' : '#e5e7eb'}`, fontSize: 14, outline: 'none', background: isGraduating ? '#fffbeb' : '#fcfaff', color: '#111827', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <option value="">Select target class...</option>
                <optgroup label="Promote To">
                  {classes.filter(c => c.id !== fromClassId).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </optgroup>
                <optgroup label="Exit Strategy">
                  <option value="GRADUATE" style={{ fontWeight: 700, color: '#d97706' }}>🎓 GRADUATE (Move to Alumni)</option>
                </optgroup>
              </select>
            </div>

            <div style={{ padding: '16px', background: '#f5f3ff', borderRadius: 12, border: '1px solid #ddd6fe' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <CheckCircle2 size={16} color="#7c3aed" />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#5b21b6' }}>Selection Summary</span>
              </div>
              <div style={{ fontSize: 12, color: '#6d28d9', opacity: 0.8, lineHeight: 1.5 }}>
                {selectedIds.length} students selected out of {classStudents.length} available in {fromClassName || '...'}
              </div>
            </div>

            <Btn 
              disabled={!fromClassId || !targetClassId || selectedIds.length === 0} 
              style={{ width: '100%', marginTop: 20, height: 48, justifyContent: 'center' }}
              onClick={() => setConfirmModal(true)}
            >
              {isGraduating ? '🎓 Process Graduation' : '🚀 Promote Students'}
            </Btn>
          </div>
        </aside>

        {/* ── Students List ── */}
        <main>
          <div className="promo-card" style={{ minHeight: 400 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e0646', margin: 0 }}>
                Step 2: Review & Select Students
              </h3>
              <div style={{ position: 'relative', width: 260 }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input 
                  type="text" 
                  placeholder="Filter by name..." 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none' }}
                />
              </div>
            </div>

            {!fromClassId ? (
              <div style={{ textAlign: 'center', padding: '80px 0', opacity: 0.5 }}>
                <Users size={48} style={{ marginBottom: 12 }} />
                <p>Select a class on the left to see students</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', opacity: 0.5 }}>
                <Users size={48} style={{ marginBottom: 12 }} />
                <p>No active students found in this class</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '2px solid #f3f4f6' }}>
                    <th style={{ padding: '12px', width: 40 }}>
                      <input 
                        type="checkbox" 
                        checked={selectedIds.length === filteredStudents.length && filteredStudents.length > 0}
                        onChange={toggleSelectAll}
                        style={{ cursor: 'pointer' }}
                      />
                    </th>
                    <th style={{ padding: '12px', fontSize: 11, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase' }}>Student Name</th>
                    <th style={{ padding: '12px', fontSize: 11, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase' }}>Student ID</th>
                    <th style={{ padding: '12px', fontSize: 11, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase' }}>Gender</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s, i) => (
                    <tr key={s.id} className="std-row" style={{ borderBottom: '1px solid #f3f4f6', animation: `_fadeUp 0.3s ease ${i * 0.02}s both` }}>
                      <td style={{ padding: '12px' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(s.id)}
                          onChange={() => toggleSelect(s.id)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#6b7280' }}>
                            {s.full_name.charAt(0)}
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{s.full_name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px', fontSize: 13, color: '#6b7280' }}>{s.student_id || 'N/A'}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 99, background: s.gender === 'male' ? '#eff6ff' : '#fdf2f8', color: s.gender === 'male' ? '#2563eb' : '#db2777' }}>
                          {s.gender || '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>

      {/* ── Confirmation Modal ── */}
      <Modal 
        open={confirmModal} 
        onClose={() => setConfirmModal(false)}
        title={isGraduating ? 'Confirm Graduation' : 'Confirm Promotion'}
        subtitle={`Action for ${selectedIds.length} students`}
        size="sm"
        footer={<>
          <Btn variant="secondary" onClick={() => setConfirmModal(false)}>Cancel</Btn>
          <Btn 
            variant={isGraduating ? 'success' : 'primary'} 
            onClick={handleAction} 
            loading={processing}
          >
            {isGraduating ? 'Graduate Now 🎓' : 'Confirm Promotion 🚀'}
          </Btn>
        </>}
      >
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: isGraduating ? '#fffbeb' : '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: `2px solid ${isGraduating ? '#f59e0b' : '#7c3aed'}` }}>
            {isGraduating ? <GraduationCap size={32} color="#d97706" /> : <ArrowUpRight size={32} color="#7c3aed" />}
          </div>
          
          <h4 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: '0 0 12px' }}>Are you sure?</h4>
          <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.6, margin: 0 }}>
            You are about to {isGraduating ? 'graduate' : 'promote'} <strong>{selectedIds.length}</strong> students from 
            <span style={{ color: '#7c3aed', fontWeight: 700 }}> {fromClassName}</span> to 
            <span style={{ color: isGraduating ? '#d97706' : '#7c3aed', fontWeight: 700 }}> {targetClassName}</span>.
          </p>
          
          {isGraduating && (
            <div style={{ marginTop: 20, padding: '12px', background: '#fff8e1', border: '1px solid #fbbf24', borderRadius: 10, display: 'flex', gap: 10, textAlign: 'left' }}>
              <AlertCircle size={20} color="#d97706" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: '#92400e', margin: 0 }}>
                This will deactivate their student profiles and create new records in the <strong>Alumni Hub</strong>. This action is best performed at the end of the final year.
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
