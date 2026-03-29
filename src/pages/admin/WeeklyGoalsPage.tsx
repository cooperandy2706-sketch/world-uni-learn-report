// src/pages/admin/WeeklyGoalsPage.tsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useClasses } from '../../hooks/useClasses'
import { useCurrentTerm } from '../../hooks/useSettings'
import toast from 'react-hot-toast'

function Btn({children,onClick,variant='primary',disabled,loading,style}:any){
  const [hov,setHov]=useState(false)
  const v:any={
    primary:  {background:hov?'#5b21b6':'linear-gradient(135deg,#7c3aed,#6d28d9)',color:'#fff',border:'none'},
    secondary:{background:hov?'#f5f3ff':'#fff',color:'#374151',border:'1.5px solid #e5e7eb'},
    success:  {background:hov?'#15803d':'#16a34a',color:'#fff',border:'none'},
    danger:   {background:hov?'#b91c1c':'#dc2626',color:'#fff',border:'none'},
  }
  return(
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{display:'inline-flex',alignItems:'center',gap:6,padding:'9px 16px',borderRadius:9,fontSize:13,fontWeight:600,cursor:disabled?'not-allowed':'pointer',transition:'all .15s',opacity:disabled?0.6:1,fontFamily:'"DM Sans",sans-serif',...v[variant],...style}}>
      {loading&&<span style={{width:13,height:13,borderRadius:'50%',border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',animation:'_wg_spin .7s linear infinite',flexShrink:0}}/>}
      {children}
    </button>
  )
}

export default function WeeklyGoalsPage(){
  const {user}=useAuth()
  const {data:classes=[]}=useClasses()
  const {data:term}=useCurrentTerm()

  const [goals,setGoals]=useState<any[]>([])
  const [teachers,setTeachers]=useState<any[]>([])
  const [subjects,setSubjects]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [modalOpen,setModalOpen]=useState(false)
  const [saving,setSaving]=useState(false)
  const [filterWeek,setFilterWeek]=useState<number|''>('')
  const [form,setForm]=useState({teacher_id:'',class_id:'',subject_id:'',week_number:1,goal:''})

  useEffect(()=>{load();loadMeta()},[term?.id])

  async function load(){
    setLoading(true)
    let q=supabase.from('weekly_goals')
      .select('*,teacher:teachers(id,user:users(full_name)),class:classes(name),subject:subjects(name)')
      .eq('school_id',user!.school_id).order('week_number').order('created_at',{ascending:false})
    if(term?.id) q=q.eq('term_id',(term as any).id)
    const {data}=await q
    setGoals(data??[])
    setLoading(false)
  }

  async function loadMeta(){
    const [{data:t},{data:s}]=await Promise.all([
      supabase.from('teachers').select('id,user:users(id,full_name)').eq('school_id',user!.school_id),
      supabase.from('subjects').select('id,name').eq('school_id',user!.school_id).order('name'),
    ])
    setTeachers(t??[])
    setSubjects(s??[])
  }

  async function saveGoal(){
    if(!form.teacher_id||!form.class_id||!form.subject_id||!form.goal){toast.error('Fill all fields');return}
    setSaving(true)
    const {error}=await supabase.from('weekly_goals').insert({
      school_id:user!.school_id,
      teacher_id:form.teacher_id,
      class_id:form.class_id,
      subject_id:form.subject_id,
      term_id:(term as any)?.id,
      week_number:form.week_number,
      goal:form.goal,
      created_by:user!.id,
    })
    if(error){toast.error(error.message);setSaving(false);return}

    // Notify teacher
    const teacher=teachers.find(t=>t.id===form.teacher_id)
    if(teacher?.user?.id){
      await supabase.from('notifications').insert({
        school_id:user!.school_id,
        user_id:teacher.user.id,
        title:`New Weekly Goal — Week ${form.week_number}`,
        body:form.goal.slice(0,120),
        type:'info',
      })
    }

    toast.success('Goal set!')
    setSaving(false)
    setModalOpen(false)
    setForm({teacher_id:'',class_id:'',subject_id:'',week_number:1,goal:''})
    load()
  }

  async function toggleDone(id:string,done:boolean){
    await supabase.from('weekly_goals').update({is_completed:!done}).eq('id',id)
    load()
  }

  async function deleteGoal(id:string){
    if(!confirm('Delete this goal?'))return
    await supabase.from('weekly_goals').delete().eq('id',id)
    load()
  }

  const weeks=[...new Set(goals.map(g=>g.week_number))].sort((a,b)=>a-b)
  const filtered=filterWeek!==''?goals.filter(g=>g.week_number===filterWeek):goals
  const doneCount=goals.filter(g=>g.is_completed).length

  return(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _wg_spin{to{transform:rotate(360deg)}}
        @keyframes _wg_fi{from{opacity:0}to{opacity:1}}
        .wg-row:hover{background:#faf5ff !important}
        .wg-row{transition:background .12s}
      `}</style>
      <div style={{fontFamily:'"DM Sans",system-ui,sans-serif',animation:'_wg_fi .4s ease'}}>

        <div style={{marginBottom:22,display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
          <div>
            <h1 style={{fontFamily:'"Playfair Display",serif',fontSize:26,fontWeight:700,color:'#111827',margin:0}}>Weekly Goals</h1>
            <p style={{fontSize:13,color:'#6b7280',marginTop:3}}>Set and track weekly teaching goals for each teacher</p>
          </div>
          <Btn onClick={()=>setModalOpen(true)}>🎯 Set New Goal</Btn>
        </div>

        {/* Stats */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:18}}>
          {[
            {label:'Total Goals',value:goals.length,icon:'🎯',color:'#6d28d9'},
            {label:'Completed',value:doneCount,icon:'✅',color:'#16a34a'},
            {label:'Pending',value:goals.length-doneCount,icon:'⏳',color:'#d97706'},
          ].map(s=>(
            <div key={s.label} style={{background:'#fff',borderRadius:14,padding:'14px 16px',border:'1.5px solid #f0eefe',boxShadow:'0 1px 4px rgba(109,40,217,.06)'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                <span style={{fontSize:18}}>{s.icon}</span>
                <span style={{fontSize:10,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'.06em'}}>{s.label}</span>
              </div>
              <div style={{fontFamily:'"Playfair Display",serif',fontSize:22,fontWeight:700,color:s.color}}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Week filter */}
        <div style={{display:'flex',gap:6,marginBottom:18,flexWrap:'wrap',alignItems:'center'}}>
          <span style={{fontSize:11,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'.06em'}}>Week:</span>
          <button onClick={()=>setFilterWeek('')}
            style={{padding:'5px 12px',borderRadius:99,border:`1.5px solid ${filterWeek===''?'#6d28d9':'#e5e7eb'}`,background:filterWeek===''?'#f5f3ff':'#fff',color:filterWeek===''?'#6d28d9':'#374151',fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'"DM Sans",sans-serif'}}>
            All
          </button>
          {weeks.map(w=>(
            <button key={w} onClick={()=>setFilterWeek(w)}
              style={{padding:'5px 12px',borderRadius:99,border:`1.5px solid ${filterWeek===w?'#6d28d9':'#e5e7eb'}`,background:filterWeek===w?'#f5f3ff':'#fff',color:filterWeek===w?'#6d28d9':'#374151',fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'"DM Sans",sans-serif'}}>
              Week {w}
            </button>
          ))}
        </div>

        {/* Goals table */}
        {loading ? (
          <div style={{display:'flex',justifyContent:'center',padding:60}}>
            <div style={{width:32,height:32,borderRadius:'50%',border:'3px solid #ede9fe',borderTopColor:'#6d28d9',animation:'_wg_spin .8s linear infinite'}}/>
          </div>
        ) : filtered.length===0 ? (
          <div style={{background:'#fff',borderRadius:16,padding:'60px 20px',textAlign:'center',border:'1.5px solid #f0eefe'}}>
            <div style={{fontSize:52,marginBottom:12}}>🎯</div>
            <h3 style={{fontFamily:'"Playfair Display",serif',fontSize:18,fontWeight:700,color:'#111827',marginBottom:6}}>No goals set yet</h3>
            <Btn onClick={()=>setModalOpen(true)}>🎯 Set First Goal</Btn>
          </div>
        ) : (
          <div style={{background:'#fff',borderRadius:16,border:'1.5px solid #f0eefe',overflow:'hidden',boxShadow:'0 1px 4px rgba(109,40,217,.06)'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{background:'linear-gradient(135deg,#faf5ff,#f5f3ff)',borderBottom:'1.5px solid #ede9fe'}}>
                  {['Week','Teacher','Class','Subject','Goal','Status','Actions'].map(h=>(
                    <th key={h} style={{padding:'11px 14px',textAlign:'left',fontSize:11,fontWeight:700,color:'#6d28d9',textTransform:'uppercase',letterSpacing:'.06em',whiteSpace:'nowrap'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((g,i)=>(
                  <tr key={g.id} className="wg-row" style={{borderBottom:i<filtered.length-1?'1px solid #faf5ff':'none'}}>
                    <td style={{padding:'11px 14px'}}>
                      <span style={{fontSize:12,fontWeight:700,background:'#f5f3ff',color:'#6d28d9',padding:'3px 9px',borderRadius:99}}>Week {g.week_number}</span>
                    </td>
                    <td style={{padding:'11px 14px',fontSize:13,fontWeight:600,color:'#111827'}}>{g.teacher?.user?.full_name??'—'}</td>
                    <td style={{padding:'11px 14px',fontSize:12,color:'#374151'}}>{g.class?.name??'—'}</td>
                    <td style={{padding:'11px 14px',fontSize:12,color:'#374151'}}>{g.subject?.name??'—'}</td>
                    <td style={{padding:'11px 14px',fontSize:12,color:'#374151',maxWidth:260}}>{g.goal}</td>
                    <td style={{padding:'11px 14px'}}>
                      <span style={{fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:99,
                        background:g.is_completed?'#f0fdf4':'#fffbeb',
                        color:g.is_completed?'#16a34a':'#d97706',
                        border:`1px solid ${g.is_completed?'#bbf7d0':'#fde68a'}`}}>
                        {g.is_completed?'✓ Done':'⏳ Pending'}
                      </span>
                    </td>
                    <td style={{padding:'11px 12px'}}>
                      <div style={{display:'flex',gap:4}}>
                        <button onClick={()=>toggleDone(g.id,g.is_completed)}
                          style={{padding:'4px 8px',borderRadius:7,border:'none',background:g.is_completed?'#fffbeb':'#f0fdf4',color:g.is_completed?'#d97706':'#16a34a',cursor:'pointer',fontSize:11,fontWeight:600,fontFamily:'"DM Sans",sans-serif'}}>
                          {g.is_completed?'Undo':'✓ Done'}
                        </button>
                        <button onClick={()=>deleteGoal(g.id)}
                          style={{width:28,height:28,borderRadius:7,border:'none',background:'#fef2f2',color:'#dc2626',cursor:'pointer',fontSize:12}}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create goal modal */}
      {modalOpen&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:999,backdropFilter:'blur(4px)',padding:16}}>
          <div style={{background:'#fff',borderRadius:16,padding:'24px',width:'100%',maxWidth:480,boxShadow:'0 24px 64px rgba(0,0,0,.18)',fontFamily:'"DM Sans",sans-serif'}}>
            <h3 style={{fontFamily:'"Playfair Display",serif',fontSize:19,fontWeight:700,color:'#111827',marginBottom:18}}>🎯 Set Weekly Goal</h3>
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div>
                  <label style={{display:'block',fontSize:11,fontWeight:700,color:'#374151',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:5}}>Teacher *</label>
                  <select value={form.teacher_id} onChange={e=>setForm(f=>({...f,teacher_id:e.target.value}))}
                    style={{width:'100%',padding:'9px 12px',borderRadius:9,border:'1.5px solid #e5e7eb',fontSize:13,outline:'none',fontFamily:'"DM Sans",sans-serif',cursor:'pointer'}}>
                    <option value="">Select…</option>
                    {teachers.map(t=><option key={t.id} value={t.id}>{t.user?.full_name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{display:'block',fontSize:11,fontWeight:700,color:'#374151',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:5}}>Week Number *</label>
                  <input type="number" min={1} max={15} value={form.week_number}
                    onChange={e=>setForm(f=>({...f,week_number:Number(e.target.value)}))}
                    style={{width:'100%',padding:'9px 12px',borderRadius:9,border:'1.5px solid #e5e7eb',fontSize:13,outline:'none',fontFamily:'"DM Sans",sans-serif',boxSizing:'border-box'}}/>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div>
                  <label style={{display:'block',fontSize:11,fontWeight:700,color:'#374151',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:5}}>Class *</label>
                  <select value={form.class_id} onChange={e=>setForm(f=>({...f,class_id:e.target.value}))}
                    style={{width:'100%',padding:'9px 12px',borderRadius:9,border:'1.5px solid #e5e7eb',fontSize:13,outline:'none',fontFamily:'"DM Sans",sans-serif',cursor:'pointer'}}>
                    <option value="">Select…</option>
                    {(classes as any[]).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{display:'block',fontSize:11,fontWeight:700,color:'#374151',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:5}}>Subject *</label>
                  <select value={form.subject_id} onChange={e=>setForm(f=>({...f,subject_id:e.target.value}))}
                    style={{width:'100%',padding:'9px 12px',borderRadius:9,border:'1.5px solid #e5e7eb',fontSize:13,outline:'none',fontFamily:'"DM Sans",sans-serif',cursor:'pointer'}}>
                    <option value="">Select…</option>
                    {subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{display:'block',fontSize:11,fontWeight:700,color:'#374151',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:5}}>Goal *</label>
                <textarea value={form.goal} onChange={e=>setForm(f=>({...f,goal:e.target.value}))} rows={3}
                  placeholder="e.g. Complete chapters 3-4, introduce fractions and run class exercise"
                  style={{width:'100%',padding:'9px 12px',borderRadius:9,border:'1.5px solid #e5e7eb',fontSize:13,outline:'none',fontFamily:'"DM Sans",sans-serif',resize:'vertical',boxSizing:'border-box'}}/>
              </div>
            </div>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:20}}>
              <Btn variant="secondary" onClick={()=>setModalOpen(false)}>Cancel</Btn>
              <Btn onClick={saveGoal} loading={saving}>🎯 Set Goal</Btn>
            </div>
          </div>
        </div>
      )}
    </>
  )
}