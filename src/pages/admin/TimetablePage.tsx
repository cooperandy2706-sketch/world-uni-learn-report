// src/pages/admin/TimetablePage.tsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useClasses } from '../../hooks/useClasses'
import { useCurrentTerm } from '../../hooks/useSettings'
import toast from 'react-hot-toast'

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday']

function Btn({ children, onClick, variant='primary', disabled, loading, style }:any){
  const [hov,setHov]=useState(false)
  const v:any={
    primary:  {background:hov?'#5b21b6':'linear-gradient(135deg,#7c3aed,#6d28d9)',color:'#fff',border:'none'},
    secondary:{background:hov?'#f5f3ff':'#fff',color:'#374151',border:'1.5px solid #e5e7eb'},
    danger:   {background:hov?'#b91c1c':'#dc2626',color:'#fff',border:'none'},
    success:  {background:hov?'#15803d':'#16a34a',color:'#fff',border:'none'},
  }
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{display:'inline-flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:8,fontSize:12,fontWeight:600,cursor:disabled?'not-allowed':'pointer',transition:'all .15s',opacity:disabled?0.6:1,fontFamily:'"DM Sans",sans-serif',...v[variant],...style}}>
      {loading&&<span style={{width:12,height:12,borderRadius:'50%',border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',animation:'_tt_spin .7s linear infinite',flexShrink:0}}/>}
      {children}
    </button>
  )
}

export default function TimetablePage(){
  const {user}=useAuth()
  const {data:classes=[]}=useClasses()
  const {data:term}=useCurrentTerm()

  const [selectedClass,setSelectedClass]=useState('')
  const [periods,setPeriods]=useState<any[]>([])
  const [slots,setSlots]=useState<any[]>([])
  const [subjects,setSubjects]=useState<any[]>([])
  const [teachers,setTeachers]=useState<any[]>([])
  const [loading,setLoading]=useState(false)
  const [editing,setEditing]=useState<any>(null) // {day,period_id}
  const [editForm,setEditForm]=useState({subject_id:'',teacher_id:''})
  const [saving,setSaving]=useState(false)
  const [editPeriodsOpen,setEditPeriodsOpen]=useState(false)
  const [periodForm,setPeriodForm]=useState<any[]>([])

  useEffect(()=>{loadPeriods();loadSubjectsTeachers()},[])
  useEffect(()=>{if(selectedClass&&term?.id)loadSlots()},[selectedClass,term?.id])

  async function loadPeriods(){
    const {data}=await supabase.from('timetable_periods')
      .select('*').eq('school_id',user!.school_id).order('sort_order')
    setPeriods(data??[])
    setPeriodForm(data??[])
  }

  async function loadSubjectsTeachers(){
    const [{data:s},{data:t}]=await Promise.all([
      supabase.from('subjects').select('id,name').eq('school_id',user!.school_id).order('name'),
      supabase.from('teachers').select('id,user:users(id,full_name)').eq('school_id',user!.school_id),
    ])
    setSubjects(s??[])
    setTeachers(t??[])
  }

  async function loadSlots(){
    setLoading(true)
    const {data}=await supabase.from('timetable_slots')
      .select('*,subject:subjects(id,name),teacher:teachers(id,user:users(full_name)),period:timetable_periods(id,name,start_time,end_time)')
      .eq('class_id',selectedClass).eq('term_id',(term as any).id)
    setSlots(data??[])
    setLoading(false)
  }

  function getSlot(day:number,periodId:string){
    return slots.find(s=>s.day_of_week===day&&s.period_id===periodId)
  }

  function openEdit(day:number,periodId:string){
    const existing=getSlot(day,periodId)
    setEditing({day,period_id:periodId})
    setEditForm({subject_id:existing?.subject_id??'',teacher_id:existing?.teacher_id??''})
  }

  async function saveSlot(){
    if(!editing) return
    setSaving(true)
    const existing=getSlot(editing.day,editing.period_id)
    if(editForm.subject_id===''){
      // Clear slot
      if(existing) await supabase.from('timetable_slots').delete().eq('id',existing.id)
    } else {
      const payload={
        school_id:user!.school_id,
        class_id:selectedClass,
        subject_id:editForm.subject_id||null,
        teacher_id:editForm.teacher_id||null,
        period_id:editing.period_id,
        day_of_week:editing.day,
        term_id:(term as any).id,
      }
      if(existing){
        await supabase.from('timetable_slots').update(payload).eq('id',existing.id)
      } else {
        await supabase.from('timetable_slots').insert(payload)
      }
    }
    setSaving(false)
    setEditing(null)
    toast.success('Timetable updated')
    await loadSlots()

    // Notify teacher if assigned
    if(editForm.teacher_id&&editForm.subject_id){
      const period=periods.find(p=>p.id===editing.period_id)
      const subject=subjects.find(s=>s.id===editForm.subject_id)
      const teacher=teachers.find(t=>t.id===editForm.teacher_id)
      const cls=(classes as any[]).find(c=>c.id===selectedClass)
      if(teacher?.user?.id){
        await supabase.from('notifications').insert({
          school_id:user!.school_id,
          user_id:teacher.user.id,
          title:'Timetable Updated',
          body:`You have ${subject?.name} for ${cls?.name} on ${DAYS[editing.day-1]} ${period?.name} (${period?.start_time?.slice(0,5)}–${period?.end_time?.slice(0,5)})`,
          type:'info',
        })
      }
    }
  }

  async function savePeriods(){
    for(const p of periodForm){
      await supabase.from('timetable_periods').update({
        name:p.name,start_time:p.start_time,end_time:p.end_time,is_break:p.is_break
      }).eq('id',p.id)
    }
    toast.success('Periods saved')
    setEditPeriodsOpen(false)
    loadPeriods()
  }

  const teachablePeriods=periods.filter(p=>!p.is_break)
  const selectedClassName=(classes as any[]).find(c=>c.id===selectedClass)?.name??''

  return(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _tt_spin{to{transform:rotate(360deg)}}
        @keyframes _tt_fi{from{opacity:0}to{opacity:1}}
        .tt-cell:hover{background:#f5f3ff !important;cursor:pointer}
        .tt-cell{transition:background .15s}
      `}</style>
      <div style={{fontFamily:'"DM Sans",system-ui,sans-serif',animation:'_tt_fi .4s ease'}}>

        {/* Header */}
        <div style={{marginBottom:22,display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
          <div>
            <h1 style={{fontFamily:'"Playfair Display",serif',fontSize:26,fontWeight:700,color:'#111827',margin:0}}>Timetable</h1>
            <p style={{fontSize:13,color:'#6b7280',marginTop:3}}>Set class schedules for {(term as any)?.name}</p>
          </div>
          <Btn variant="secondary" onClick={()=>setEditPeriodsOpen(true)}>⚙️ Edit Period Times</Btn>
        </div>

        {/* Class selector */}
        <div style={{background:'#fff',borderRadius:14,padding:'16px 18px',border:'1.5px solid #f0eefe',marginBottom:18,display:'flex',gap:14,alignItems:'flex-end',flexWrap:'wrap'}}>
          <div style={{flex:'1 1 200px'}}>
            <label style={{display:'block',fontSize:11,fontWeight:700,letterSpacing:'.06em',textTransform:'uppercase',color:'#6b7280',marginBottom:5}}>Select Class</label>
            <select value={selectedClass} onChange={e=>setSelectedClass(e.target.value)}
              style={{width:'100%',padding:'9px 12px',borderRadius:9,fontSize:13,border:'1.5px solid #e5e7eb',outline:'none',background:'#faf5ff',fontFamily:'"DM Sans",sans-serif',cursor:'pointer'}}>
              <option value="">Choose class…</option>
              {(classes as any[]).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {selectedClass&&<p style={{fontSize:12,color:'#16a34a',fontWeight:600,margin:0}}>✓ Editing {selectedClassName} timetable</p>}
        </div>

        {/* Timetable grid */}
        {selectedClass && (
          <div style={{background:'#fff',borderRadius:16,border:'1.5px solid #f0eefe',overflow:'auto',boxShadow:'0 1px 4px rgba(109,40,217,.06)'}}>
            {loading ? (
              <div style={{display:'flex',justifyContent:'center',padding:40}}>
                <div style={{width:32,height:32,borderRadius:'50%',border:'3px solid #ede9fe',borderTopColor:'#6d28d9',animation:'_tt_spin .8s linear infinite'}}/>
              </div>
            ) : (
              <table style={{width:'100%',borderCollapse:'collapse',minWidth:700}}>
                <thead>
                  <tr style={{background:'linear-gradient(135deg,#1e3a8a,#1e40af)'}}>
                    <th style={{padding:'12px 14px',color:'#fff',fontSize:11,fontWeight:700,textAlign:'left',textTransform:'uppercase',letterSpacing:'.06em',width:120}}>Period</th>
                    {DAYS.map(d=>(
                      <th key={d} style={{padding:'12px 14px',color:'#fff',fontSize:11,fontWeight:700,textAlign:'center',textTransform:'uppercase',letterSpacing:'.06em'}}>{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {periods.map((p,pi)=>(
                    <tr key={p.id} style={{borderBottom:pi<periods.length-1?'1px solid #f0eefe':'none',background:p.is_break?'#fef9c3':'#fff'}}>
                      <td style={{padding:'10px 14px'}}>
                        <div style={{fontSize:12,fontWeight:700,color:p.is_break?'#92400e':'#1e3a8a'}}>{p.name}</div>
                        <div style={{fontSize:10,color:'#6b7280'}}>{p.start_time?.slice(0,5)} – {p.end_time?.slice(0,5)}</div>
                      </td>
                      {p.is_break ? (
                        <td colSpan={5} style={{textAlign:'center',fontSize:11,color:'#92400e',fontWeight:600,padding:'10px',background:'#fef9c3'}}>
                          🍎 {p.name}
                        </td>
                      ) : DAYS.map((_,di)=>{
                        const slot=getSlot(di+1,p.id)
                        return (
                          <td key={di} className="tt-cell" onClick={()=>openEdit(di+1,p.id)}
                            style={{padding:'8px 10px',textAlign:'center',borderLeft:'1px solid #f0eefe',minWidth:130}}>
                            {slot ? (
                              <div style={{background:'linear-gradient(135deg,#f5f3ff,#ede9fe)',borderRadius:8,padding:'6px 8px',border:'1px solid #ddd6fe'}}>
                                <div style={{fontSize:12,fontWeight:700,color:'#5b21b6',marginBottom:2}}>{slot.subject?.name}</div>
                                <div style={{fontSize:10,color:'#7c3aed'}}>{slot.teacher?.user?.full_name??'—'}</div>
                              </div>
                            ) : (
                              <div style={{color:'#d1d5db',fontSize:18}}>+</div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {!selectedClass && (
          <div style={{background:'#fff',borderRadius:16,padding:'60px 20px',textAlign:'center',border:'1.5px solid #f0eefe'}}>
            <div style={{fontSize:52,marginBottom:12}}>📅</div>
            <h3 style={{fontFamily:'"Playfair Display",serif',fontSize:18,fontWeight:700,color:'#111827',marginBottom:6}}>Select a class to view timetable</h3>
            <p style={{fontSize:13,color:'#9ca3af'}}>Click any cell to assign a subject and teacher.</p>
          </div>
        )}
      </div>

      {/* Edit slot modal */}
      {editing && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:999,backdropFilter:'blur(4px)'}}>
          <div style={{background:'#fff',borderRadius:16,padding:'24px',width:380,boxShadow:'0 24px 64px rgba(0,0,0,.18)',fontFamily:'"DM Sans",sans-serif'}}>
            <h3 style={{fontFamily:'"Playfair Display",serif',fontSize:17,fontWeight:700,color:'#111827',marginBottom:4}}>
              {DAYS[editing.day-1]} — {periods.find(p=>p.id===editing.period_id)?.name}
            </h3>
            <p style={{fontSize:12,color:'#6b7280',marginBottom:18}}>{selectedClassName}</p>
            <div style={{marginBottom:14}}>
              <label style={{display:'block',fontSize:11,fontWeight:700,color:'#374151',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:5}}>Subject</label>
              <select value={editForm.subject_id} onChange={e=>setEditForm(f=>({...f,subject_id:e.target.value}))}
                style={{width:'100%',padding:'9px 12px',borderRadius:9,border:'1.5px solid #e5e7eb',outline:'none',fontSize:13,fontFamily:'"DM Sans",sans-serif',cursor:'pointer'}}>
                <option value="">— Clear slot —</option>
                {subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div style={{marginBottom:20}}>
              <label style={{display:'block',fontSize:11,fontWeight:700,color:'#374151',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:5}}>Teacher</label>
              <select value={editForm.teacher_id} onChange={e=>setEditForm(f=>({...f,teacher_id:e.target.value}))}
                style={{width:'100%',padding:'9px 12px',borderRadius:9,border:'1.5px solid #e5e7eb',outline:'none',fontSize:13,fontFamily:'"DM Sans",sans-serif',cursor:'pointer'}}>
                <option value="">— Unassigned —</option>
                {teachers.map(t=><option key={t.id} value={t.id}>{t.user?.full_name}</option>)}
              </select>
            </div>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
              <Btn variant="secondary" onClick={()=>setEditing(null)}>Cancel</Btn>
              <Btn onClick={saveSlot} loading={saving}>💾 Save</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Edit periods modal */}
      {editPeriodsOpen && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:999,backdropFilter:'blur(4px)',padding:16}}>
          <div style={{background:'#fff',borderRadius:16,padding:'24px',width:520,maxHeight:'80vh',overflowY:'auto',boxShadow:'0 24px 64px rgba(0,0,0,.18)',fontFamily:'"DM Sans",sans-serif'}}>
            <h3 style={{fontFamily:'"Playfair Display",serif',fontSize:17,fontWeight:700,color:'#111827',marginBottom:18}}>⚙️ Edit Period Times</h3>
            <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:20}}>
              {periodForm.map((p,i)=>(
                <div key={p.id} style={{display:'grid',gridTemplateColumns:'1fr 90px 90px auto',gap:8,alignItems:'center'}}>
                  <input value={p.name} onChange={e=>{const f=[...periodForm];f[i]={...f[i],name:e.target.value};setPeriodForm(f)}}
                    style={{padding:'7px 10px',borderRadius:8,border:'1.5px solid #e5e7eb',fontSize:12,outline:'none',fontFamily:'"DM Sans",sans-serif'}}/>
                  <input type="time" value={p.start_time?.slice(0,5)??''}
                    onChange={e=>{const f=[...periodForm];f[i]={...f[i],start_time:e.target.value};setPeriodForm(f)}}
                    style={{padding:'7px 10px',borderRadius:8,border:'1.5px solid #e5e7eb',fontSize:12,outline:'none',fontFamily:'"DM Sans",sans-serif'}}/>
                  <input type="time" value={p.end_time?.slice(0,5)??''}
                    onChange={e=>{const f=[...periodForm];f[i]={...f[i],end_time:e.target.value};setPeriodForm(f)}}
                    style={{padding:'7px 10px',borderRadius:8,border:'1.5px solid #e5e7eb',fontSize:12,outline:'none',fontFamily:'"DM Sans",sans-serif'}}/>
                  <label style={{display:'flex',gap:4,alignItems:'center',fontSize:11,color:'#6b7280',cursor:'pointer',whiteSpace:'nowrap'}}>
                    <input type="checkbox" checked={p.is_break} onChange={e=>{const f=[...periodForm];f[i]={...f[i],is_break:e.target.checked};setPeriodForm(f)}}/>
                    Break
                  </label>
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
              <Btn variant="secondary" onClick={()=>setEditPeriodsOpen(false)}>Cancel</Btn>
              <Btn variant="success" onClick={savePeriods}>💾 Save Periods</Btn>
            </div>
          </div>
        </div>
      )}
    </>
  )
}