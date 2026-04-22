import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import { useClasses } from '../../hooks/useClasses'
import { supabase } from '../../lib/supabase'
import { 
  Send, Users, UserCheck, MessageSquare, Search, 
  CheckCircle2, XCircle, Loader2, Info, AlertCircle,
  Smartphone, BookOpen, GraduationCap, DollarSign
} from 'lucide-react'
import toast from 'react-hot-toast'

// ── Types ────────────────────────────────────────────────────────────────────
interface Recipient {
  id: string
  name: string
  phone: string
  subtitle?: string
  studentName?: string
  amountDue?: number
  type: 'parent' | 'staff'
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const GHS = (n: number) => `GH₵ ${Number(n).toLocaleString('en-GH', { minimumFractionDigits: 2 })}`

function normalizePhone(raw: string) {
  let p = raw.replace(/\s+/g, '').replace('+', '')
  if (p.startsWith('0')) return '233' + p.substring(1)
  if (!p.startsWith('233')) return '233' + p
  return p
}

export default function SMSPage() {
  const { user, isAdmin, isBursar } = useAuth()
  const schoolId = user?.school_id ?? ''
  
  const [activeTab, setActiveTab] = useState<'broadcast' | 'fee_reminders'> (isBursar ? 'fee_reminders' : 'broadcast')
  const [selectedClass, setSelectedClass] = useState('')
  const [searchQ, setSearchQ] = useState('')
  const [message, setMessage] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isSending, setIsSending] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })

  const { data: classes = [] } = useClasses()

  // 1. Fetch Recipients (Parents & Students)
  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['sms-recipients-students', schoolId],
    queryFn: async () => {
      const { data } = await supabase
        .from('students')
        .select('id, full_name, guardian_phone, guardian_name, fees_arrears, daily_fee_mode, class_id, class:classes(name)')
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .order('full_name')
      return data ?? []
    },
    enabled: !!schoolId
  })

  // 2. Fetch Staff
  const { data: staff = [], isLoading: loadingStaff } = useQuery({
    queryKey: ['sms-recipients-staff', schoolId],
    queryFn: async () => {
      const { data } = await supabase
        .from('users')
        .select('id, full_name, phone, role')
        .eq('school_id', schoolId)
        .in('role', ['admin', 'teacher', 'bursar', 'other-staff'])
        .eq('is_active', true)
      return data ?? []
    },
    enabled: !!schoolId && activeTab === 'broadcast'
  })

  // 3. For Bursars: Debt data (minimal version for SMS)
  const { data: feePayments = [] } = useQuery({
    queryKey: ['sms-fee-payments', schoolId],
    queryFn: async () => {
      const { data } = await supabase.from('fee_payments').select('student_id, amount_paid').eq('school_id', schoolId)
      return data ?? []
    },
    enabled: !!schoolId && activeTab === 'fee_reminders'
  })

  const { data: structures = [] } = useQuery({
    queryKey: ['sms-fee-structures', schoolId],
    queryFn: async () => {
      const { data } = await supabase.from('fee_structures').select('class_id, amount').eq('school_id', schoolId)
      return data ?? []
    },
    enabled: !!schoolId && activeTab === 'fee_reminders'
  })

  // Calculations for recipients
  const allRecipients = useMemo(() => {
    const list: Recipient[] = []
    
    if (activeTab === 'broadcast') {
      // Add parents
      students.forEach((s: any) => {
        if (s.guardian_phone) {
          list.push({
            id: s.id,
            name: s.guardian_name || s.full_name + "'s Parent",
            phone: s.guardian_phone,
            subtitle: `Parent of ${s.full_name} (${s.class?.name || 'No Class'})`,
            studentName: s.full_name,
            type: 'parent'
          })
        }
      })
      // Add staff (only if no class filter is active or role is admin)
      if (!selectedClass) {
        staff.forEach((u: any) => {
          if (u.phone) {
            list.push({
              id: u.id,
              name: u.full_name,
              phone: u.phone,
              subtitle: `Staff (${u.role.replace('_', ' ')})`,
              type: 'staff'
            })
          }
        })
      }
    } else {
      // Fee Reminders Tab (Bursar)
      // Map class -> total tuition
      const classTotals: Record<string, number> = {}
      structures.forEach((st: any) => {
        classTotals[st.class_id] = (classTotals[st.class_id] || 0) + (st.amount || 0)
      })
      
      // Map student -> total paid
      const studentPaid: Record<string, number> = {}
      feePayments.forEach((p: any) => {
        studentPaid[p.student_id] = (studentPaid[p.student_id] || 0) + (p.amount_paid || 0)
      })

      students.forEach((s: any) => {
        const tuition = classTotals[s.class_id] || 0
        const disc = tuition * ((s.scholarship_percentage || 0) / 100)
        const netTuition = tuition - disc
        const paid = studentPaid[s.id] || 0
        const arrears = Number(s.fees_arrears || 0)
        const totalOwed = arrears + Math.max(0, netTuition - paid)

        if (totalOwed > 0 && s.guardian_phone) {
          list.push({
            id: s.id,
            name: s.guardian_name || s.full_name + "'s Parent",
            phone: s.guardian_phone,
            subtitle: `${GHS(totalOwed)} due for ${s.full_name}`,
            studentName: s.full_name,
            amountDue: totalOwed,
            type: 'parent'
          })
        }
      })
    }

    return list
  }, [activeTab, students, staff, feePayments, structures, selectedClass])

  const filteredRecipients = useMemo(() => {
    let res = allRecipients
    if (selectedClass) {
      const studentIdsInClass = new Set(students.filter((s: any) => s.class_id === selectedClass).map((s: any) => s.id))
      res = res.filter(r => r.type === 'staff' ? false : studentIdsInClass.has(r.id))
    }
    if (searchQ) {
      const q = searchQ.toLowerCase()
      res = res.filter(r => r.name.toLowerCase().includes(q) || r.phone.includes(q) || r.subtitle?.toLowerCase().includes(q))
    }
    return res
  }, [allRecipients, selectedClass, searchQ, students])

  // Placeholder resolution
  function resolveMessage(template: string, recipient: Recipient) {
    let msg = template
      .replace(/{parent}/g, recipient.name)
      .replace(/{parent_name}/g, recipient.name)
      .replace(/{student}/g, recipient.studentName || '')
      .replace(/{student_name}/g, recipient.studentName || '')
      .replace(/{amount}/g, recipient.amountDue ? GHS(recipient.amountDue) : '')
      .replace(/{owed}/g, recipient.amountDue ? GHS(recipient.amountDue) : '')
      .replace(/{school}/g, user?.school?.name || '')
    return msg
  }

  // ── Send Logic ────────────────────────────
  // Bulk-sends in batches of 50 (matching Arkesel edge function's batch size).
  // For personalised messages (placeholders), we keep per-recipient calls since
  // the resolved text differs per person. For non-personalised messages we pass
  // all numbers in one request per batch.
  const BATCH_SIZE = 50

  async function handleSend() {
    if (selectedIds.size === 0) return toast.error('Select recipients first')
    if (!message.trim()) return toast.error('Message content is empty')

    const targets = filteredRecipients.filter(r => selectedIds.has(r.id))
    if (!confirm(`Are you sure you want to send this message to ${targets.length} recipients?`)) return

    setIsSending(true)
    setProgress({ current: 0, total: targets.length })

    let successCount = 0
    let failCount = 0

    // Detect whether the message uses any per-recipient placeholders.
    // Regex uses a non-capturing group so { and } wrap ALL alternatives.
    const hasPlaceholders = /\{(?:parent_name|parent|student_name|student|amount|owed)\}/.test(message)

    if (hasPlaceholders) {
      // Personalised: one call per recipient (message body differs per person)
      for (let i = 0; i < targets.length; i++) {
        const recipient = targets[i]
        const resolvedMsg = resolveMessage(message, recipient)
        try {
          const { data, error } = await supabase.functions.invoke('send-sms', {
            body: { school_id: schoolId, recipient: recipient.phone, message: resolvedMsg }
          })
          if (error || data?.error) throw new Error(error?.message || String(data?.error))
          if (data?.success === false) {
            const firstBatchRes = data?.data?.[0]?.response
            const reason = firstBatchRes 
              ? (typeof firstBatchRes.message === 'string' ? firstBatchRes.message : JSON.stringify(firstBatchRes))
              : data?.message
            
            console.error('Arkesel API Rejection JSON:', JSON.stringify(data, null, 2))
            throw new Error(`API Rejected: ${reason}`)
          }
          successCount++
        } catch (err: any) {
          console.error('SMS Send Error:', err)
          failCount++
        }
        setProgress(prev => ({ ...prev, current: i + 1 }))
      }
    } else {
      // Non-personalised: bulk — pass up to 50 phones per request
      for (let i = 0; i < targets.length; i += BATCH_SIZE) {
        const batch = targets.slice(i, i + BATCH_SIZE)
        const phones = batch.map(r => normalizePhone(r.phone))
        try {
          const { data, error } = await supabase.functions.invoke('send-sms', {
            body: { school_id: schoolId, recipients: phones, message }
          })
          if (error || data?.error) throw new Error(error?.message || String(data?.error))
          
          if (data?.success === false) {
            const firstBatchRes = data?.data?.[0]?.response
            const reason = firstBatchRes 
              ? (typeof firstBatchRes.message === 'string' ? firstBatchRes.message : JSON.stringify(firstBatchRes))
              : data?.message
            
            console.error('Arkesel API Rejection JSON:', JSON.stringify(data, null, 2))
            throw new Error(`API Rejected: ${reason}`)
          }
          // data.data is an array of batch results; count sent ones
          const batchSent = (data?.data ?? []).filter((b: any) => b.status === 'sent').reduce(
            (acc: number, b: any) => acc + (b.recipients?.length ?? 0), 0
          )
          successCount += batchSent
          failCount += batch.length - batchSent
        } catch (err: any) {
          console.error('SMS Batch Error:', err)
          failCount += batch.length
        }
        setProgress(prev => ({ ...prev, current: Math.min(i + BATCH_SIZE, targets.length) }))
      }
    }

    setIsSending(false)
    if (failCount === 0) {
      toast.success(`Successfully sent to ${successCount} recipient${successCount !== 1 ? 's' : ''}!`)
      setSelectedIds(new Set())
    } else {
      toast.error(`Sent: ${successCount} ✓  Failed: ${failCount} ✗ — check console for details.`)
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredRecipients.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredRecipients.map(r => r.id)))
    }
  }

  const toggleId = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  // SMS character counter helper (160 chars = 1 SMS)
  const charCount = message.length
  const smsSegments = Math.ceil(charCount / 160) || 1

  return (
    <>
      <style>{`
        @keyframes _smsIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .sms-item:hover { background: #f9fafb; }
      `}</style>

      <div style={{ fontFamily: '"DM Sans",sans-serif', animation: '_smsIn 0.4s ease' }}>
        
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>
            {activeTab === 'fee_reminders' ? 'Fee Payment Reminders' : 'SMS Messaging Hub'}
          </h1>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
            Broadcast messages and reminders to parents and staff via Arkesel SMS.
          </p>
        </div>

        {/* Tab switcher for Bursars */}
        {isBursar && (
          <div style={{ display: 'flex', gap: 4, background: '#f3f4f6', borderRadius: 12, padding: 4, marginBottom: 22, width: 'fit-content' }}>
            <button onClick={() => { setActiveTab('fee_reminders'); setSelectedIds(new Set()) }} 
              style={{ padding: '8px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', background: activeTab === 'fee_reminders' ? '#fff' : 'transparent', color: activeTab === 'fee_reminders' ? '#111827' : '#6b7280', boxShadow: activeTab === 'fee_reminders' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
              💰 Fee Reminders
            </button>
            <button onClick={() => { setActiveTab('broadcast'); setSelectedIds(new Set()) }}
              style={{ padding: '8px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', background: activeTab === 'broadcast' ? '#fff' : 'transparent', color: activeTab === 'broadcast' ? '#111827' : '#6b7280', boxShadow: activeTab === 'broadcast' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
              📢 Community Broadcast
            </button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
          
          {/* Main Area: Recipient Selection */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
            
            {/* Toolbar */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input 
                  placeholder="Search name, phone..." 
                  value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none' }}
                />
              </div>
              
              {activeTab === 'broadcast' && (
                <select 
                  value={selectedClass} 
                  onChange={e => { setSelectedClass(e.target.value); setSelectedIds(new Set()) }}
                  style={{ padding: '9px 12px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', background: '#fff' }}
                >
                  <option value="">All Community (Incl. Staff)</option>
                  {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name} Parents</option>)}
                </select>
              )}

              <button 
                onClick={toggleSelectAll}
                style={{ padding: '8px 14px', borderRadius: 9, border: '1.5px solid #e5e7eb', background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                {selectedIds.size === filteredRecipients.length ? 'Deselect All' : `Select All (${filteredRecipients.length})`}
              </button>
            </div>

            {/* List */}
            <div style={{ height: 460, overflowY: 'auto' }}>
              {loadingStudents ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 className="animate-spin" color="#7c3aed" /></div>
              ) : filteredRecipients.length === 0 ? (
                <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>
                  <Info style={{ margin: '0 auto 10px', display: 'block' }} />
                  <p style={{ fontSize: 13 }}>No matching recipients with phone numbers found.</p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, background: '#f9fafb', zIndex: 1, borderBottom: '1px solid #f3f4f6' }}>
                    <tr>
                      <th style={{ width: 44, padding: '12px' }}></th>
                      <th style={{ textAlign: 'left', padding: '12px', fontSize: 11, color: '#6b7280', textTransform: 'uppercase' }}>Recipient Info</th>
                      <th style={{ textAlign: 'left', padding: '12px', fontSize: 11, color: '#6b7280', textTransform: 'uppercase' }}>Phone Number</th>
                      {activeTab === 'fee_reminders' && <th style={{ textAlign: 'left', padding: '12px', fontSize: 11, color: '#6b7280', textTransform: 'uppercase' }}>Debt</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecipients.map(r => (
                      <tr key={r.id} className="sms-item" onClick={() => toggleId(r.id)} style={{ borderBottom: '1px solid #f9fafb', cursor: 'pointer', transition: 'background 0.1s' }}>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <input type="checkbox" checked={selectedIds.has(r.id)} readOnly style={{ width: 16, height: 16, accentColor: '#7c3aed' }} />
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{r.name}</div>
                          <div style={{ fontSize: 11, color: '#6b7280' }}>{r.subtitle}</div>
                        </td>
                        <td style={{ padding: '12px', fontSize: 13, color: '#4b5563', fontFamily: 'monospace' }}>{r.phone}</td>
                        {activeTab === 'fee_reminders' && (
                          <td style={{ padding: '12px', fontSize: 13, fontWeight: 700, color: '#dc2626' }}>{GHS(r.amountDue || 0)}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Selection info footer */}
            <div style={{ padding: '12px 20px', background: '#f9fafb', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#6b7280' }}>
                <span style={{ fontWeight: 700, color: '#7c3aed' }}>{selectedIds.size}</span> recipients selected
              </span>
              <span style={{ fontSize: 10, color: '#9ca3af', fontStyle: 'italic' }}>Only contacts with valid phone numbers are listed.</span>
            </div>
          </div>

          {/* Right Sidebar: Composer & Sending */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* Template Hints */}
            <div style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', borderRadius: 16, padding: '18px', color: '#fff', boxShadow: '0 4px 12px rgba(109,40,217,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Smartphone size={20} />
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Message Placeholders</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {[
                  { tag: '{parent}', label: 'Parent Name' },
                  { tag: '{student}', label: 'Student Name' },
                  { tag: '{owed}', label: 'Total Owed' },
                  { tag: '{school}', label: 'School Name' },
                ].map(p => (
                  <div key={p.tag} onClick={() => setMessage(m => m + p.tag)} style={{ background: 'rgba(255,255,255,0.15)', padding: '6px 8px', borderRadius: 8, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}>
                    <div style={{ fontSize: 10, fontWeight: 800, fontFamily: 'monospace' }}>{p.tag}</div>
                    <div style={{ fontSize: 9, opacity: 0.8 }}>{p.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Composer */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', padding: '18px', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Compose Message</label>
              <textarea 
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Type your message here..."
                rows={6}
                style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', fontFamily: '"DM Sans",sans-serif', resize: 'none' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                <div style={{ fontSize: 11, color: charCount > 160 ? '#f59e0b' : '#6b7280' }}>
                  {charCount} chars · <strong>{smsSegments} SMS</strong>
                </div>
                <button onClick={() => setMessage('')} style={{ color: '#9ca3af', background: 'none', border: 'none', fontSize: 11, cursor: 'pointer' }}>Clear</button>
              </div>
            </div>

            {/* Preview */}
            <div style={{ background: '#f5f3ff', borderRadius: 16, border: '1.5px solid #ddd6fe', padding: '15px' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#6d28d9', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Loader2 size={12} /> Personalized Preview
              </div>
              <div style={{ background: '#fff', borderRadius: 10, padding: '12px', border: '1px solid #e9d5ff', minHeight: 60 }}>
                {selectedIds.size > 0 && message.trim() ? (
                  <p style={{ fontSize: 12, color: '#374151', margin: 0, whiteSpace: 'pre-wrap' }}>
                    {resolveMessage(message, filteredRecipients.find(r => selectedIds.has(r.id))!)}
                  </p>
                ) : (
                  <p style={{ fontSize: 11, color: '#9ca3af', fontStyle: 'italic', margin: 0 }}>
                    Select a recipient and type a message to see the preview.
                  </p>
                )}
              </div>
            </div>

            {/* Progress / Send Button */}
            {isSending ? (
              <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0eefe', padding: '18px', textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 10 }}>Sending Messages...</div>
                <div style={{ height: 6, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{ height: '100%', background: '#7c3aed', width: `${(progress.current / progress.total) * 100}%`, transition: 'width 0.3s ease' }} />
                </div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>{progress.current} of {progress.total} sent</div>
              </div>
            ) : (
              <button 
                onClick={handleSend}
                disabled={selectedIds.size === 0 || !message.trim()}
                style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 4px 12px rgba(109,40,217,0.3)', opacity: (selectedIds.size === 0 || !message.trim()) ? 0.6 : 1 }}
              >
                <Send size={18} /> Send to {selectedIds.size} Recipients
              </button>
            )}

            {/* Cost Warning */}
            <div style={{ display: 'flex', gap: 8, padding: '0 5px' }}>
              <AlertCircle size={14} color="#f59e0b" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: 10, color: '#92400e', margin: 0 }}>
                Approximately <strong>{selectedIds.size * smsSegments} credit{selectedIds.size * smsSegments !== 1 ? 's' : ''}</strong> will be consumed from your Arkesel account balance.
              </p>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
