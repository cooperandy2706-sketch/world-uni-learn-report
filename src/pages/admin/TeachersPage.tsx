// src/pages/admin/TeachersPage.tsx
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '../../lib/supabase'
import { useTeachers } from '../../hooks/useTeachers'
import { useClasses } from '../../hooks/useClasses'
import { useSubjects } from '../../hooks/useSubjects'
import { useCurrentTerm } from '../../hooks/useSettings'
import { useAuth } from '../../hooks/useAuth'
import { teachersService } from '../../services/index'
import Modal from '../../components/ui/Modal'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

const schema = z.object({
  full_name:     z.string().min(2, 'Name required'),
  email:         z.string().email('Valid email required'),
  password:      z.string().min(6).optional().or(z.literal('')),
  phone:         z.string().optional().or(z.literal('')),
  staff_id:      z.string().optional().or(z.literal('')),
  qualification: z.string().optional().or(z.literal('')),
})
type TForm = z.infer<typeof schema>

// ── Helpers ───────────────────────────────────────────────
function Avatar({ name, size = 48 }: { name: string; size?: number }) {
  const colors = ['#6d28d9','#0891b2','#16a34a','#d97706','#dc2626','#0f766e']
  const c = colors[(name.charCodeAt(0) + (name.charCodeAt(1)||0)) % colors.length]
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', flexShrink:0,
      background:`linear-gradient(135deg,${c},${c}99)`,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:size*.38, fontWeight:900, color:'#fff', boxShadow:`0 3px 10px ${c}40` }}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

function Btn({ children, onClick, variant='primary', disabled, loading, style }:any) {
  const [hov,setHov]=useState(false)
  const v:any = {
    primary:   {background:hov?'#5b21b6':'linear-gradient(135deg,#7c3aed,#6d28d9)',color:'#fff',border:'none',boxShadow:'0 2px 8px rgba(109,40,217,.28)'},
    secondary: {background:hov?'#f5f3ff':'#fff',color:'#374151',border:'1.5px solid #e5e7eb'},
    danger:    {background:hov?'#b91c1c':'#dc2626',color:'#fff',border:'none'},
    success:   {background:hov?'#15803d':'#16a34a',color:'#fff',border:'none'},
    ghost:     {background:hov?'#f5f3ff':'transparent',color:'#6b7280',border:'none'},
  }
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{display:'inline-flex',alignItems:'center',gap:6,padding:'9px 16px',borderRadius:9,fontSize:13,fontWeight:600,cursor:disabled?'not-allowed':'pointer',transition:'all .15s',opacity:disabled?0.6:1,fontFamily:'"DM Sans",sans-serif',...v[variant],...style}}>
      {loading&&<span style={{width:13,height:13,borderRadius:'50%',border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',animation:'_tp_spin .7s linear infinite',flexShrink:0}}/>}
      {children}
    </button>
  )
}

function Field({ label, children }:any) {
  return (
    <div>
      <label style={{display:'block',fontSize:11,fontWeight:700,letterSpacing:'.06em',textTransform:'uppercase',color:'#6b7280',marginBottom:5}}>{label}</label>
      {children}
    </div>
  )
}

function Input({ error, ...props }:any) {
  const [f,setF]=useState(false)
  return (
    <div>
      <input {...props} onFocus={e=>{setF(true);props.onFocus?.(e)}} onBlur={e=>{setF(false);props.onBlur?.(e)}}
        style={{width:'100%',padding:'9px 12px',borderRadius:9,fontSize:13,border:`1.5px solid ${error?'#f87171':f?'#7c3aed':'#e5e7eb'}`,outline:'none',background:'#fff',color:'#111827',fontFamily:'"DM Sans",sans-serif',boxSizing:'border-box'}}/>
      {error&&<p style={{fontSize:11,color:'#ef4444',marginTop:3}}>⚠ {error}</p>}
    </div>
  )
}

// ══════════════════════════════════════════════════════════
export default function TeachersPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const { data: teachers = [], isLoading } = useTeachers()
  const { data: classes = [] } = useClasses()
  const { data: subjects = [] } = useSubjects()
  const { data: term } = useCurrentTerm()

  const [search, setSearch]               = useState('')
  const [modalOpen, setModalOpen]         = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<any>(null)
  const [viewingTeacher, setViewingTeacher] = useState<any>(null)
  const [viewModal, setViewModal]         = useState(false)
  const [assignModal, setAssignModal]     = useState(false)
  const [assigningTeacher, setAssigningTeacher] = useState<any>(null)
  const [assignments, setAssignments]     = useState<any[]>([])
  const [newClassId, setNewClassId]       = useState('')
  const [newSubjectId, setNewSubjectId]   = useState('')
  const [isClassTeacher, setIsClassTeacher] = useState(false)
  const [resetModal, setResetModal]       = useState(false)
  const [resetTeacher, setResetTeacher]   = useState<any>(null)
  const [newPassword, setNewPassword]     = useState('')
  const [resetting, setResetting]         = useState(false)

  const { register, handleSubmit, reset, formState:{ errors, isSubmitting } } = useForm<TForm>({ resolver: zodResolver(schema) as any })

  const filtered = (teachers as any[]).filter(t =>
    !search || t.user?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    t.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
    t.staff_id?.toLowerCase().includes(search.toLowerCase())
  )

  function openCreate() { setEditingTeacher(null); reset({}); setModalOpen(true) }
  function openEdit(t: any) {
    setEditingTeacher(t)
    reset({ full_name:t.user?.full_name??'', email:t.user?.email??'', phone:t.user?.phone??'', staff_id:t.staff_id??'', qualification:t.qualification??'', password:'' })
    setModalOpen(true)
  }

  async function onSubmit(data: TForm) {
    try {
      if (editingTeacher) {
        await supabase.from('users').update({ full_name:data.full_name, phone:data.phone||null }).eq('id', editingTeacher.user_id)
        await supabase.from('teachers').update({ staff_id:data.staff_id||null, qualification:data.qualification||null }).eq('id', editingTeacher.id)
        toast.success('Teacher updated')
        qc.invalidateQueries({ queryKey:['teachers'] })
      } else {
        const pw = data.password || 'teacher123'
        const { data: result, error } = await supabase.rpc('create_teacher_account', {
          p_email: data.email, p_password: pw, p_full_name: data.full_name,
          p_school_id: user!.school_id, p_staff_id: data.staff_id||null,
          p_phone: data.phone||null, p_qualification: data.qualification||null,
        })
        if (error) throw error
        if ((result as any)?.success === false) throw new Error((result as any).error)
        toast.success(`✅ Created · ${data.email} · Password: ${pw}`, { duration:8000 })
        qc.invalidateQueries({ queryKey:['teachers'] })
      }
      setModalOpen(false); reset({})
    } catch(e:any) { toast.error(e.message??'Failed') }
  }

  async function handleDelete(t: any) {
    if (!confirm(`Remove ${t.user?.full_name}? This deletes their account permanently.`)) return
    try {
      await supabase.from('teacher_assignments').delete().eq('teacher_id', t.id)
      await supabase.from('weekly_goals').delete().eq('teacher_id', t.id)
      await supabase.from('teachers').delete().eq('id', t.id)
      await supabase.from('users').delete().eq('id', t.user_id)
      // Delete auth via RPC
      await supabase.rpc('delete_teacher_account', { p_user_id: t.user_id })
      qc.invalidateQueries({ queryKey:['teachers'] })
      toast.success('Teacher removed')
    } catch(e:any) { toast.error(e.message??'Failed') }
  }

  async function openAssign(t: any) {
    setAssigningTeacher(t)
    const { data } = await supabase.from('teacher_assignments')
      .select('*, class:classes(id,name), subject:subjects(id,name), term:terms(id,name)')
      .eq('teacher_id', t.id).order('class(name)')
    setAssignments(data??[])
    setAssignModal(true)
  }

  async function openView(t: any) {
    setViewingTeacher(t)
    setViewModal(true)
    // Load full data
    const [{ data: assign }, { data: goals }] = await Promise.all([
      supabase.from('teacher_assignments')
        .select('*, class:classes(id,name), subject:subjects(id,name), term:terms(id,name)')
        .eq('teacher_id', t.id).order('class(name)'),
      supabase.from('weekly_goals')
        .select('*, class:classes(name), subject:subjects(name)')
        .eq('teacher_id', t.id).order('week_number', { ascending:false }).limit(8),
    ])
    setViewingTeacher((prev:any) => ({ ...prev, _assignments: assign??[], _goals: goals??[] }))
  }

  async function addAssignment() {
    if (!newClassId || !newSubjectId || !term?.id) { toast.error('Select class, subject and ensure there is an active term'); return }
    const { error } = await supabase.from('teacher_assignments').insert({
      teacher_id: assigningTeacher.id, class_id: newClassId, subject_id: newSubjectId,
      term_id: (term as any).id, academic_year_id: (term as any).academic_year_id,
      is_class_teacher: isClassTeacher, school_id: user!.school_id,
    })
    if (error) { toast.error(error.message); return }
    toast.success('Assignment added')
    setNewClassId(''); setNewSubjectId(''); setIsClassTeacher(false)
    const { data } = await supabase.from('teacher_assignments')
      .select('*, class:classes(id,name), subject:subjects(id,name), term:terms(id,name)')
      .eq('teacher_id', assigningTeacher.id).order('class(name)')
    setAssignments(data??[])
  }

  async function removeAssignment(id: string) {
    await supabase.from('teacher_assignments').delete().eq('id', id)
    setAssignments(prev => prev.filter(a => a.id !== id))
    toast.success('Removed')
  }

  async function handleResetPassword() {
    if (!newPassword || newPassword.length < 6) { toast.error('Min 6 characters'); return }
    setResetting(true)
    const { error } = await supabase.rpc('reset_teacher_password', { p_user_id: resetTeacher.user_id, p_new_password: newPassword })
    setResetting(false)
    if (error) { toast.error(error.message); return }
    toast.success(`Password reset for ${resetTeacher.user?.full_name}`)
    setResetModal(false); setNewPassword('')
  }

  // Group assignments by class for display
  function groupByClass(assignments: any[]) {
    const map: Record<string,any> = {}
    for (const a of assignments) {
      const k = a.class?.id
      if (!map[k]) map[k] = { class: a.class, subjects: [], term: a.term }
      map[k].subjects.push(a.subject?.name)
    }
    return Object.values(map)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _tp_spin{to{transform:rotate(360deg)}}
        @keyframes _tp_fi{from{opacity:0}to{opacity:1}}
        @keyframes _tp_fu{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .tp-card:hover{box-shadow:0 8px 28px rgba(109,40,217,.13) !important;transform:translateY(-2px)}
        .tp-card{transition:all .2s}
        .tp-act:hover{background:#ede9fe !important}
        .tp-act{transition:background .12s}
      `}</style>
      <div style={{fontFamily:'"DM Sans",system-ui,sans-serif',animation:'_tp_fi .4s ease'}}>

        {/* Header */}
        <div style={{marginBottom:22,display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
          <div>
            <h1 style={{fontFamily:'"Playfair Display",serif',fontSize:26,fontWeight:700,color:'#111827',margin:0}}>Teachers</h1>
            <p style={{fontSize:13,color:'#6b7280',marginTop:3}}>{(teachers as any[]).length} staff members</p>
          </div>
          <Btn onClick={openCreate}>➕ Add Teacher</Btn>
        </div>

        {/* Stats */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:12,marginBottom:20}}>
          {[
            {icon:'👨‍🏫',label:'Total Staff',value:(teachers as any[]).length,color:'#6d28d9',bg:'#f5f3ff'},
            {icon:'✅',label:'Active',value:(teachers as any[]).filter((t:any)=>t.user?.is_active!==false).length,color:'#16a34a',bg:'#f0fdf4'},
            {icon:'📚',label:'Classes Covered',value:[...new Set((teachers as any[]).flatMap((t:any)=>t._assignments?.map((a:any)=>a.class_id)||[]))].length||'—',color:'#0891b2',bg:'#eff6ff'},
          ].map(s=>(
            <div key={s.label} style={{background:'#fff',borderRadius:14,padding:'14px 16px',border:'1.5px solid #f0eefe',boxShadow:'0 1px 4px rgba(109,40,217,.06)'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                <div style={{width:32,height:32,borderRadius:9,background:s.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15}}>{s.icon}</div>
                <span style={{fontSize:10,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'.06em'}}>{s.label}</span>
              </div>
              <div style={{fontFamily:'"Playfair Display",serif',fontSize:24,fontWeight:700,color:s.color}}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{background:'#fff',borderRadius:12,padding:'10px 14px',border:'1.5px solid #f0eefe',marginBottom:18}}>
          <div style={{position:'relative',maxWidth:360}}>
            <span style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',fontSize:14}}>🔍</span>
            <input placeholder="Search by name, email or staff ID…" value={search} onChange={e=>setSearch(e.target.value)}
              style={{width:'100%',padding:'8px 12px 8px 32px',borderRadius:9,fontSize:13,border:'1.5px solid #e5e7eb',outline:'none',background:'#faf5ff',fontFamily:'"DM Sans",sans-serif'}}/>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div style={{display:'flex',justifyContent:'center',padding:'60px 0',flexDirection:'column',alignItems:'center',gap:12}}>
            <div style={{width:36,height:36,borderRadius:'50%',border:'3px solid #ede9fe',borderTopColor:'#6d28d9',animation:'_tp_spin .8s linear infinite'}}/>
          </div>
        )}

        {/* Empty */}
        {!isLoading && filtered.length === 0 && (
          <div style={{background:'#fff',borderRadius:16,padding:'60px 20px',textAlign:'center',border:'1.5px solid #f0eefe'}}>
            <div style={{fontSize:52,marginBottom:12}}>👨‍🏫</div>
            <h3 style={{fontFamily:'"Playfair Display",serif',fontSize:18,fontWeight:700,color:'#111827',marginBottom:6}}>
              {search ? 'No teachers found' : 'No teachers yet'}
            </h3>
            {!search && <Btn onClick={openCreate} style={{marginTop:10}}>➕ Add First Teacher</Btn>}
          </div>
        )}

        {/* Teacher cards */}
        {!isLoading && filtered.length > 0 && (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:16}}>
            {(filtered as any[]).map((t,i) => (
              <div key={t.id} className="tp-card"
                style={{background:'#fff',borderRadius:18,border:'1.5px solid #f0eefe',padding:'20px',boxShadow:'0 1px 4px rgba(109,40,217,.07)',position:'relative',overflow:'hidden',animation:`_tp_fu .35s ease ${i*.05}s both`}}>

                {/* Accent blob */}
                <div style={{position:'absolute',top:-20,right:-20,width:80,height:80,borderRadius:'50%',background:'linear-gradient(135deg,#f5f3ff,#ede9fe)',pointerEvents:'none'}}/>

                {/* Avatar + basic info */}
                <div style={{display:'flex',alignItems:'flex-start',gap:14,marginBottom:14,position:'relative'}}>
                  <Avatar name={t.user?.full_name??'?'} size={52}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:15,fontWeight:700,color:'#111827',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.user?.full_name}</div>
                    <div style={{fontSize:12,color:'#6b7280',marginTop:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.user?.email}</div>
                    <div style={{marginTop:5,display:'flex',gap:4,flexWrap:'wrap'}}>
                      {t.staff_id&&<span style={{fontSize:10,fontWeight:700,background:'#f5f3ff',color:'#6d28d9',padding:'2px 7px',borderRadius:99,border:'1px solid #ede9fe'}}>{t.staff_id}</span>}
                      {t.qualification&&<span style={{fontSize:10,fontWeight:600,background:'#f0fdf4',color:'#16a34a',padding:'2px 7px',borderRadius:99}}>🎓 {t.qualification}</span>}
                    </div>
                  </div>
                </div>

                {/* Contact info */}
                <div style={{display:'flex',flexDirection:'column',gap:5,marginBottom:14}}>
                  {t.user?.phone && (
                    <div style={{display:'flex',alignItems:'center',gap:8,padding:'6px 10px',background:'#faf5ff',borderRadius:8,fontSize:12,color:'#374151'}}>
                      <span>📱</span>{t.user.phone}
                    </div>
                  )}
                  <div style={{display:'flex',alignItems:'center',gap:8,padding:'6px 10px',background:'#faf5ff',borderRadius:8,fontSize:12,color:'#374151'}}>
                    <span style={{width:8,height:8,borderRadius:'50%',background:t.user?.is_active!==false?'#16a34a':'#9ca3af',flexShrink:0,display:'block'}}/>
                    {t.user?.is_active!==false?'Active':'Inactive'}
                    {t.user?.created_at&&<span style={{color:'#9ca3af',marginLeft:'auto',fontSize:11}}>Since {new Date(t.user.created_at).toLocaleDateString('en-GB',{month:'short',year:'numeric'})}</span>}
                  </div>
                </div>

                {/* Actions */}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,borderTop:'1px solid #faf5ff',paddingTop:12}}>
                  <button className="tp-act" onClick={()=>openView(t)}
                    style={{padding:'8px 0',borderRadius:8,border:'none',background:'#f5f3ff',color:'#6d28d9',fontSize:12,fontWeight:600,cursor:'pointer'}}>
                    👁️ View
                  </button>
                  <button className="tp-act" onClick={()=>openAssign(t)}
                    style={{padding:'8px 0',borderRadius:8,border:'none',background:'linear-gradient(135deg,#7c3aed,#6d28d9)',color:'#fff',fontSize:12,fontWeight:600,cursor:'pointer'}}>
                    📚 Assign
                  </button>
                  <button className="tp-act" onClick={()=>openEdit(t)}
                    style={{padding:'8px 0',borderRadius:8,border:'none',background:'#f5f3ff',color:'#6d28d9',fontSize:12,fontWeight:600,cursor:'pointer'}}>
                    ✏️ Edit
                  </button>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginTop:6}}>
                  <button onClick={()=>{setResetTeacher(t);setResetModal(true);setNewPassword('')}}
                    style={{padding:'7px 0',borderRadius:8,border:'1px solid #ddd6fe',background:'transparent',color:'#6d28d9',fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'"DM Sans",sans-serif'}}>
                    🔑 Reset Password
                  </button>
                  <button onClick={()=>handleDelete(t)}
                    style={{padding:'7px 0',borderRadius:8,border:'1px solid #fecaca',background:'transparent',color:'#ef4444',fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'"DM Sans",sans-serif'}}>
                    🗑️ Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── VIEW TEACHER DETAIL MODAL ── */}
      <Modal open={viewModal} onClose={()=>{setViewModal(false);setViewingTeacher(null)}}
        title="Staff Profile" subtitle={viewingTeacher?.user?.full_name} size="lg"
        footer={
          <div style={{display:'flex',gap:8}}>
            <Btn variant="secondary" onClick={()=>setViewModal(false)}>Close</Btn>
            <Btn onClick={()=>{setViewModal(false);openEdit(viewingTeacher)}}>✏️ Edit</Btn>
            <Btn variant="primary" onClick={()=>{setViewModal(false);openAssign(viewingTeacher)}}>📚 Manage Assignments</Btn>
          </div>
        }>
        {viewingTeacher&&(
          <div style={{display:'flex',flexDirection:'column',gap:20}}>

            {/* Profile header */}
            <div style={{background:'linear-gradient(135deg,#2e1065,#4c1d95,#5b21b6)',borderRadius:16,padding:'20px 24px',display:'flex',alignItems:'center',gap:16,color:'#fff',position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',top:-20,right:-20,width:100,height:100,borderRadius:'50%',background:'rgba(255,255,255,.06)'}}/>
              <Avatar name={viewingTeacher.user?.full_name??'?'} size={64}/>
              <div>
                <h2 style={{fontFamily:'"Playfair Display",serif',fontSize:22,fontWeight:700,color:'#fff',margin:0}}>{viewingTeacher.user?.full_name}</h2>
                <p style={{fontSize:13,color:'rgba(255,255,255,.7)',margin:'3px 0'}}>{viewingTeacher.user?.email}</p>
                <div style={{display:'flex',gap:8,marginTop:6,flexWrap:'wrap'}}>
                  {viewingTeacher.staff_id&&<span style={{fontSize:11,background:'rgba(255,255,255,.15)',padding:'3px 10px',borderRadius:99,color:'#fff',fontWeight:600}}>{viewingTeacher.staff_id}</span>}
                  {viewingTeacher.qualification&&<span style={{fontSize:11,background:'rgba(255,255,255,.15)',padding:'3px 10px',borderRadius:99,color:'#fff'}}>🎓 {viewingTeacher.qualification}</span>}
                </div>
              </div>
            </div>

            {/* Contact details */}
            <div>
              <h4 style={{fontSize:11,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:10}}>Contact Information</h4>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                {[
                  {icon:'✉️',label:'Email',value:viewingTeacher.user?.email},
                  {icon:'📱',label:'Phone',value:viewingTeacher.user?.phone||'Not set'},
                  {icon:'🪪',label:'Staff ID',value:viewingTeacher.staff_id||'Not set'},
                  {icon:'📅',label:'Joined',value:viewingTeacher.user?.created_at?new Date(viewingTeacher.user.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}):'—'},
                  {icon:'✅',label:'Status',value:viewingTeacher.user?.is_active!==false?'Active':'Inactive'},
                  {icon:'🎓',label:'Qualification',value:viewingTeacher.qualification||'Not set'},
                ].map(({icon,label,value})=>(
                  <div key={label} style={{background:'#f8fafc',borderRadius:10,padding:'10px 12px',border:'.5px solid #e2e8f0'}}>
                    <div style={{fontSize:10,color:'#94a3b8',fontWeight:700,textTransform:'uppercase',letterSpacing:'.05em',marginBottom:3}}>{icon} {label}</div>
                    <div style={{fontSize:13,fontWeight:600,color:'#111827'}}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Class assignments */}
            <div>
              <h4 style={{fontSize:11,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:10}}>
                Class Assignments {viewingTeacher._assignments?.length>0&&<span style={{fontWeight:400,textTransform:'none',color:'#9ca3af'}}>— {viewingTeacher._assignments?.length} subject{viewingTeacher._assignments?.length!==1?'s':''}</span>}
              </h4>
              {!viewingTeacher._assignments ? (
                <div style={{textAlign:'center',padding:'12px 0',color:'#9ca3af',fontSize:12}}>Loading…</div>
              ) : viewingTeacher._assignments.length === 0 ? (
                <div style={{background:'#fffbeb',border:'1px solid #fde68a',borderRadius:10,padding:'12px 14px',fontSize:12,color:'#92400e'}}>
                  No assignments yet — click "Manage Assignments" to assign classes.
                </div>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {groupByClass(viewingTeacher._assignments).map((g:any,i:number)=>(
                    <div key={i} style={{background:'#f5f3ff',borderRadius:10,padding:'10px 14px',border:'1px solid #ede9fe'}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                        <span style={{fontSize:12,fontWeight:700,color:'#5b21b6'}}>🏫 {g.class?.name}</span>
                        <span style={{fontSize:10,color:'#9ca3af'}}>· {g.term?.name}</span>
                      </div>
                      <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                        {g.subjects.map((s:string,j:number)=>(
                          <span key={j} style={{fontSize:11,background:'#fff',color:'#6d28d9',padding:'2px 8px',borderRadius:99,border:'1px solid #ddd6fe'}}>{s}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent weekly goals */}
            {viewingTeacher._goals?.length > 0 && (
              <div>
                <h4 style={{fontSize:11,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:10}}>Recent Weekly Goals</h4>
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {viewingTeacher._goals.slice(0,4).map((g:any)=>(
                    <div key={g.id} style={{background:g.is_completed?'#f0fdf4':'#fffbeb',borderRadius:10,padding:'10px 12px',border:`1px solid ${g.is_completed?'#bbf7d0':'#fde68a'}`,display:'flex',gap:10,alignItems:'flex-start'}}>
                      <span style={{fontSize:14,flexShrink:0}}>{g.is_completed?'✅':'⏳'}</span>
                      <div style={{flex:1}}>
                        <div style={{fontSize:11,fontWeight:700,color:'#374151',marginBottom:2}}>Week {g.week_number} · {g.class?.name} · {g.subject?.name}</div>
                        <div style={{fontSize:12,color:'#6b7280'}}>{g.goal}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── ADD / EDIT MODAL ── */}
      <Modal open={modalOpen} onClose={()=>setModalOpen(false)}
        title={editingTeacher?'Edit Teacher':'Add New Teacher'}
        subtitle={editingTeacher?`Editing ${editingTeacher.user?.full_name}`:'Creates a login account for the teacher'}
        size="md"
        footer={
          <div style={{display:'flex',gap:8}}>
            <Btn variant="secondary" onClick={()=>setModalOpen(false)}>Cancel</Btn>
            <Btn onClick={handleSubmit(onSubmit)} loading={isSubmitting}>{editingTeacher?'Save Changes':'Create Account'}</Btn>
          </div>
        }>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            <Field label="Full Name *"><Input {...register('full_name')} placeholder="e.g. Mad. Akua Mensah" error={errors.full_name?.message}/></Field>
            <Field label="Email Address *"><Input {...register('email')} type="email" placeholder="teacher@estev.com" error={errors.email?.message} disabled={!!editingTeacher}/></Field>
            {!editingTeacher&&(
              <Field label="Password">
                <Input {...register('password')} type="password" placeholder="Default: teacher123"/>
                <p style={{fontSize:11,color:'#9ca3af',marginTop:3}}>Leave blank to use "teacher123"</p>
              </Field>
            )}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <Field label="Phone"><Input {...register('phone')} placeholder="024 000 0000"/></Field>
              <Field label="Staff ID"><Input {...register('staff_id')} placeholder="TCH-001"/></Field>
            </div>
            <Field label="Qualification"><Input {...register('qualification')} placeholder="e.g. B.Ed Mathematics"/></Field>
          </div>
        </form>
      </Modal>

      {/* ── ASSIGN MODAL ── */}
      <Modal open={assignModal} onClose={()=>setAssignModal(false)}
        title="Class & Subject Assignments"
        subtitle={assigningTeacher?.user?.full_name}
        size="lg"
        footer={<Btn variant="secondary" onClick={()=>setAssignModal(false)}>Done</Btn>}>
        {assigningTeacher&&(
          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            {/* Add new */}
            <div style={{background:'#f8fafc',borderRadius:12,padding:'14px 16px',border:'.5px solid #e2e8f0'}}>
              <p style={{fontSize:11,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:10}}>Add Assignment</p>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
                <div>
                  <label style={{fontSize:11,fontWeight:600,color:'#374151',display:'block',marginBottom:4}}>Class</label>
                  <select value={newClassId} onChange={e=>setNewClassId(e.target.value)}
                    style={{width:'100%',padding:'8px 10px',borderRadius:8,border:'1.5px solid #e5e7eb',fontSize:13,outline:'none',fontFamily:'"DM Sans",sans-serif',cursor:'pointer'}}>
                    <option value="">Select…</option>
                    {(classes as any[]).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{fontSize:11,fontWeight:600,color:'#374151',display:'block',marginBottom:4}}>Subject</label>
                  <select value={newSubjectId} onChange={e=>setNewSubjectId(e.target.value)}
                    style={{width:'100%',padding:'8px 10px',borderRadius:8,border:'1.5px solid #e5e7eb',fontSize:13,outline:'none',fontFamily:'"DM Sans",sans-serif',cursor:'pointer'}}>
                    <option value="">Select…</option>
                    {(subjects as any[]).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
                <label style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'#374151',cursor:'pointer'}}>
                  <input type="checkbox" checked={isClassTeacher} onChange={e=>setIsClassTeacher(e.target.checked)}/>
                  Class Teacher for this class
                </label>
                <Btn onClick={addAssignment} style={{padding:'7px 14px',fontSize:12}}>➕ Add</Btn>
              </div>
            </div>

            {/* Current assignments */}
            <div>
              <p style={{fontSize:11,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:8}}>
                Current Assignments ({assignments.length})
              </p>
              {assignments.length===0 ? (
                <p style={{fontSize:13,color:'#9ca3af',textAlign:'center',padding:'16px 0'}}>No assignments yet</p>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:6,maxHeight:300,overflowY:'auto'}}>
                  {assignments.map(a=>(
                    <div key={a.id} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',background:'#f5f3ff',borderRadius:9,border:'1px solid #ede9fe'}}>
                      <span style={{fontSize:12,fontWeight:700,color:'#5b21b6',flex:1}}>🏫 {a.class?.name}</span>
                      <span style={{fontSize:12,color:'#6d28d9',flex:1}}>📗 {a.subject?.name}</span>
                      <span style={{fontSize:10,color:'#9ca3af'}}>{a.term?.name}</span>
                      {a.is_class_teacher&&<span style={{fontSize:10,background:'#dcfce7',color:'#16a34a',padding:'1px 6px',borderRadius:99,fontWeight:600}}>CT</span>}
                      <button onClick={()=>removeAssignment(a.id)}
                        style={{width:24,height:24,borderRadius:6,border:'none',background:'#fef2f2',color:'#dc2626',cursor:'pointer',fontSize:12,flexShrink:0}}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ── RESET PASSWORD MODAL ── */}
      <Modal open={resetModal} onClose={()=>setResetModal(false)}
        title="Reset Password" subtitle={resetTeacher?.user?.full_name} size="sm"
        footer={
          <div style={{display:'flex',gap:8}}>
            <Btn variant="secondary" onClick={()=>setResetModal(false)}>Cancel</Btn>
            <Btn variant="danger" onClick={handleResetPassword} loading={resetting}>🔑 Reset</Btn>
          </div>
        }>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:9,padding:'10px 14px',fontSize:12,color:'#dc2626'}}>
            This will immediately change {resetTeacher?.user?.full_name}'s login password.
          </div>
          <Field label="New Password">
            <Input type="password" value={newPassword} onChange={(e:any)=>setNewPassword(e.target.value)} placeholder="Min 6 characters"/>
          </Field>
        </div>
      </Modal>
    </>
  )

  function groupByClass(assignments: any[]) {
    const map: Record<string,any> = {}
    for (const a of assignments) {
      const k = a.class?.id
      if (!map[k]) map[k] = { class:a.class, subjects:[], term:a.term }
      map[k].subjects.push(a.subject?.name)
    }
    return Object.values(map)
  }
}