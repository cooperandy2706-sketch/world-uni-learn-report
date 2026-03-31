// src/pages/admin/AnnouncementsPage.tsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'

function Btn({children,onClick,variant='primary',disabled,loading,style}:any){
  const [hov,setHov]=useState(false)
  const v:any={
    primary:  {background:hov?'#5b21b6':'linear-gradient(135deg,#7c3aed,#6d28d9)',color:'#fff',border:'none',boxShadow:'0 2px 8px rgba(109,40,217,.25)'},
    secondary:{background:hov?'#f5f3ff':'#fff',color:'#374151',border:'1.5px solid #e5e7eb'},
    danger:   {background:hov?'#b91c1c':'#dc2626',color:'#fff',border:'none'},
    success:  {background:hov?'#15803d':'#16a34a',color:'#fff',border:'none'},
    warning:  {background:hov?'#b45309':'linear-gradient(135deg,#f59e0b,#d97706)',color:'#fff',border:'none'},
  }
  return(
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{display:'inline-flex',alignItems:'center',gap:6,padding:'9px 16px',borderRadius:9,fontSize:13,fontWeight:600,cursor:disabled?'not-allowed':'pointer',transition:'all .15s',opacity:disabled?0.6:1,fontFamily:'"DM Sans",sans-serif',...v[variant],...style}}>
      {loading&&<span style={{width:13,height:13,borderRadius:'50%',border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',animation:'_an_spin .7s linear infinite',flexShrink:0}}/>}
      {children}
    </button>
  )
}

const TYPE_CONFIG:any={
  announcement:{icon:'📢',color:'#6d28d9',bg:'#f5f3ff',label:'Announcement'},
  meeting:     {icon:'📅',color:'#0369a1',bg:'#eff6ff',label:'Meeting'},
  reminder:    {icon:'⏰',color:'#d97706',bg:'#fffbeb',label:'Reminder'},
  exam:        {icon:'📝',color:'#dc2626',bg:'#fef2f2',label:'Exam Notice'},
  holiday:     {icon:'🎉',color:'#16a34a',bg:'#f0fdf4',label:'Holiday'},
}

export default function AnnouncementsPage(){
  const {user}=useAuth()
  const [announcements,setAnnouncements]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [modalOpen,setModalOpen]=useState(false)
  const [form,setForm]=useState({title:'',body:'',type:'announcement',target_role:'all',meeting_date:'',meeting_link:'',is_pinned:false,send_push:false})
  const [saving,setSaving]=useState(false)
  const [teachers,setTeachers]=useState<any[]>([])
  const [tab,setTab]=useState<'all'|'announcement'|'meeting'|'reminder'>('all')

  useEffect(()=>{load()},[])

  async function load(){
    setLoading(true)
    const [{data:ann},{data:t}]=await Promise.all([
      supabase.from('announcements').select('*,from_user:users(full_name),reads:announcement_reads(id)')
        .eq('school_id',user!.school_id).order('is_pinned',{ascending:false}).order('created_at',{ascending:false}),
      supabase.from('teachers').select('id,user:users(id,full_name,email)').eq('school_id',user!.school_id),
    ])
    setAnnouncements(ann??[])
    setTeachers(t??[])
    setLoading(false)
  }

  async function save(){
    if(!form.title||!form.body){toast.error('Title and message are required');return}
    setSaving(true)
    const {data:ann,error}=await supabase.from('announcements').insert({
      school_id:user!.school_id,
      from_user_id:user!.id,
      title:form.title,
      body:form.body,
      type:form.type,
      target_role:form.target_role,
      meeting_date:form.meeting_date||null,
      meeting_link:form.meeting_link||null,
      is_pinned:form.is_pinned,
    }).select().single()
    if(error){toast.error(error.message);setSaving(false);return}

    // Send notifications to all teachers
    const targetTeachers=form.target_role==='all'||form.target_role==='teacher'?teachers:[]
    if(targetTeachers.length>0){
      const notifs=targetTeachers.map((t:any)=>({
        school_id:user!.school_id,
        user_id:t.user?.id,
        title:form.title,
        body:form.body.slice(0,120),
        type:form.type,
      })).filter((n:any)=>n.user_id)
      if(notifs.length>0) await supabase.from('notifications').insert(notifs)
    }

    // Attempt to invoke Push Notification Edge Function if requested
    if (form.send_push) {
      try {
        const { error: pushError } = await supabase.functions.invoke('send-push', {
          body: { title: form.title, body: form.body, target_school_id: user!.school_id }
        })
        if (pushError) console.error("Push Error: ", pushError)
      } catch (err) {
        console.error("Failed to send push: ", err)
      }
    }

    toast.success('Posted successfully')
    setSaving(false)
    setModalOpen(false)
    setForm({title:'',body:'',type:'announcement',target_role:'all',meeting_date:'',meeting_link:'',is_pinned:false,send_push:false})
    load()
  }

  async function deleteAnn(id:string){
    if(!confirm('Delete this announcement?'))return
    await supabase.from('announcements').delete().eq('id',id)
    toast.success('Deleted')
    load()
  }

  async function togglePin(id:string,pinned:boolean){
    await supabase.from('announcements').update({is_pinned:!pinned}).eq('id',id)
    load()
  }

  const filtered=tab==='all'?announcements:announcements.filter(a=>a.type===tab)

  return(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _an_spin{to{transform:rotate(360deg)}}
        @keyframes _an_fi{from{opacity:0}to{opacity:1}}
        @keyframes _an_fu{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .ann-card:hover{box-shadow:0 8px 28px rgba(109,40,217,.12) !important;transform:translateY(-1px)}
        .ann-card{transition:all .2s}
      `}</style>
      <div style={{fontFamily:'"DM Sans",system-ui,sans-serif',animation:'_an_fi .4s ease'}}>

        {/* Header */}
        <div style={{marginBottom:22,display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
          <div>
            <h1 style={{fontFamily:'"Playfair Display",serif',fontSize:26,fontWeight:700,color:'#111827',margin:0}}>Announcements</h1>
            <p style={{fontSize:13,color:'#6b7280',marginTop:3}}>Post announcements, schedule meetings and send reminders to teachers</p>
          </div>
          <Btn onClick={()=>setModalOpen(true)}>✏️ New Post</Btn>
        </div>

        {/* Stats */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
          {[
            {label:'Total Posts',value:announcements.length,icon:'📢',color:'#6d28d9'},
            {label:'Meetings',value:announcements.filter(a=>a.type==='meeting').length,icon:'📅',color:'#0369a1'},
            {label:'Pinned',value:announcements.filter(a=>a.is_pinned).length,icon:'📌',color:'#d97706'},
            {label:'Teachers',value:teachers.length,icon:'👨‍🏫',color:'#16a34a'},
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

        {/* Tabs */}
        <div style={{display:'flex',gap:4,marginBottom:18,background:'#f5f3ff',borderRadius:12,padding:4,width:'fit-content'}}>
          {['all','announcement','meeting','reminder'].map(t=>(
            <button key={t} onClick={()=>setTab(t as any)}
              style={{padding:'7px 16px',borderRadius:9,border:'none',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'"DM Sans",sans-serif',
                background:tab===t?'#fff':'transparent',
                color:tab===t?'#6d28d9':'#6b7280',
                boxShadow:tab===t?'0 1px 4px rgba(0,0,0,.08)':'none',
                transition:'all .15s',textTransform:'capitalize'}}>
              {t==='all'?'All Posts':TYPE_CONFIG[t]?.label??t}
            </button>
          ))}
        </div>

        {/* Posts */}
        {loading ? (
          <div style={{display:'flex',justifyContent:'center',padding:60}}>
            <div style={{width:32,height:32,borderRadius:'50%',border:'3px solid #ede9fe',borderTopColor:'#6d28d9',animation:'_an_spin .8s linear infinite'}}/>
          </div>
        ) : filtered.length===0 ? (
          <div style={{background:'#fff',borderRadius:16,padding:'60px 20px',textAlign:'center',border:'1.5px solid #f0eefe'}}>
            <div style={{fontSize:52,marginBottom:12}}>📭</div>
            <h3 style={{fontFamily:'"Playfair Display",serif',fontSize:18,fontWeight:700,color:'#111827',marginBottom:6}}>No posts yet</h3>
            <p style={{fontSize:13,color:'#9ca3af',marginBottom:18}}>Click "New Post" to send your first announcement.</p>
            <Btn onClick={()=>setModalOpen(true)}>✏️ Create First Post</Btn>
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {filtered.map((a,i)=>{
              const tc=TYPE_CONFIG[a.type]??TYPE_CONFIG.announcement
              return(
                <div key={a.id} className="ann-card"
                  style={{background:'#fff',borderRadius:14,padding:'16px 20px',border:`1.5px solid ${a.is_pinned?'#fde68a':'#f0eefe'}`,boxShadow:'0 1px 4px rgba(109,40,217,.06)',animation:`_an_fu .3s ease ${i*.03}s both`,position:'relative'}}>
                  {a.is_pinned&&<div style={{position:'absolute',top:12,right:12,fontSize:14}}>📌</div>}
                  <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
                    <div style={{width:40,height:40,borderRadius:12,background:tc.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>
                      {tc.icon}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3,flexWrap:'wrap'}}>
                        <h3 style={{fontSize:14,fontWeight:700,color:'#111827',margin:0}}>{a.title}</h3>
                        <span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:99,background:tc.bg,color:tc.color}}>{tc.label}</span>
                        {a.target_role!=='all'&&<span style={{fontSize:10,fontWeight:600,padding:'2px 8px',borderRadius:99,background:'#f5f3ff',color:'#6d28d9'}}>{a.target_role}</span>}
                      </div>
                      <p style={{fontSize:13,color:'#374151',margin:'0 0 8px',lineHeight:1.5}}>{a.body}</p>
                      {a.meeting_date&&(
                        <div style={{fontSize:12,color:'#0369a1',fontWeight:600,marginBottom:6}}>
                          📅 {new Date(a.meeting_date).toLocaleString()}
                          {a.meeting_link&&<a href={a.meeting_link} target="_blank" rel="noreferrer" style={{marginLeft:8,color:'#0891b2',textDecoration:'underline'}}>Join Link</a>}
                        </div>
                      )}
                      <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                        <span style={{fontSize:11,color:'#9ca3af'}}>{new Date(a.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</span>
                        <span style={{fontSize:11,color:'#9ca3af'}}>by {a.from_user?.full_name??'Admin'}</span>
                        <span style={{fontSize:11,color:'#9ca3af'}}>{a.reads?.length??0} read{a.reads?.length!==1?'s':''}</span>
                      </div>
                    </div>
                    <div style={{display:'flex',gap:4,flexShrink:0}}>
                      <button onClick={()=>togglePin(a.id,a.is_pinned)}
                        style={{width:30,height:30,borderRadius:8,border:'none',background:'#f5f3ff',cursor:'pointer',fontSize:13}}
                        title={a.is_pinned?'Unpin':'Pin'}>
                        {a.is_pinned?'📍':'📌'}
                      </button>
                      <button onClick={()=>deleteAnn(a.id)}
                        style={{width:30,height:30,borderRadius:8,border:'none',background:'#fef2f2',cursor:'pointer',fontSize:13,color:'#dc2626'}}
                        title="Delete">🗑️</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create modal */}
      {modalOpen&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:999,backdropFilter:'blur(4px)',padding:16}}>
          <div style={{background:'#fff',borderRadius:16,padding:'24px',width:'100%',maxWidth:520,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 24px 64px rgba(0,0,0,.18)',fontFamily:'"DM Sans",sans-serif'}}>
            <h3 style={{fontFamily:'"Playfair Display",serif',fontSize:19,fontWeight:700,color:'#111827',marginBottom:18}}>✏️ New Post</h3>

            {/* Type selector */}
            <div style={{display:'flex',gap:6,marginBottom:16,flexWrap:'wrap'}}>
              {Object.entries(TYPE_CONFIG).map(([k,v]:any)=>(
                <button key={k} onClick={()=>setForm(f=>({...f,type:k}))}
                  style={{padding:'6px 12px',borderRadius:99,border:`1.5px solid ${form.type===k?v.color:'#e5e7eb'}`,background:form.type===k?v.bg:'#fff',color:form.type===k?v.color:'#374151',fontSize:11,fontWeight:600,cursor:'pointer',transition:'all .15s',fontFamily:'"DM Sans",sans-serif'}}>
                  {v.icon} {v.label}
                </button>
              ))}
            </div>

            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div>
                <label style={{display:'block',fontSize:11,fontWeight:700,color:'#374151',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:5}}>Title *</label>
                <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="e.g. End of Term Exam Schedule"
                  style={{width:'100%',padding:'9px 12px',borderRadius:9,border:'1.5px solid #e5e7eb',fontSize:13,outline:'none',fontFamily:'"DM Sans",sans-serif',boxSizing:'border-box'}}/>
              </div>
              <div>
                <label style={{display:'block',fontSize:11,fontWeight:700,color:'#374151',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:5}}>Message *</label>
                <textarea value={form.body} onChange={e=>setForm(f=>({...f,body:e.target.value}))} rows={4} placeholder="Write your message here…"
                  style={{width:'100%',padding:'9px 12px',borderRadius:9,border:'1.5px solid #e5e7eb',fontSize:13,outline:'none',fontFamily:'"DM Sans",sans-serif',resize:'vertical',boxSizing:'border-box'}}/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div>
                  <label style={{display:'block',fontSize:11,fontWeight:700,color:'#374151',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:5}}>Send To</label>
                  <select value={form.target_role} onChange={e=>setForm(f=>({...f,target_role:e.target.value}))}
                    style={{width:'100%',padding:'9px 12px',borderRadius:9,border:'1.5px solid #e5e7eb',fontSize:13,outline:'none',fontFamily:'"DM Sans",sans-serif',cursor:'pointer'}}>
                    <option value="all">All Teachers</option>
                    <option value="teacher">Teachers Only</option>
                  </select>
                </div>
                {form.type==='meeting'&&(
                  <div>
                    <label style={{display:'block',fontSize:11,fontWeight:700,color:'#374151',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:5}}>Meeting Date & Time</label>
                    <input type="datetime-local" value={form.meeting_date} onChange={e=>setForm(f=>({...f,meeting_date:e.target.value}))}
                      style={{width:'100%',padding:'9px 12px',borderRadius:9,border:'1.5px solid #e5e7eb',fontSize:12,outline:'none',fontFamily:'"DM Sans",sans-serif'}}/>
                  </div>
                )}
              </div>
              {form.type==='meeting'&&(
                <div>
                  <label style={{display:'block',fontSize:11,fontWeight:700,color:'#374151',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:5}}>Meeting Link (optional)</label>
                  <input value={form.meeting_link} onChange={e=>setForm(f=>({...f,meeting_link:e.target.value}))} placeholder="https://meet.google.com/..."
                    style={{width:'100%',padding:'9px 12px',borderRadius:9,border:'1.5px solid #e5e7eb',fontSize:13,outline:'none',fontFamily:'"DM Sans",sans-serif',boxSizing:'border-box'}}/>
                </div>
              )}
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:13,color:'#374151'}}>
                  <input type="checkbox" checked={form.is_pinned} onChange={e=>setForm(f=>({...f,is_pinned:e.target.checked}))}/>
                  📌 Pin this post (shows at top)
                </label>
                
                <div style={{background:'#f5f3ff',border:'1.5px solid #6d28d9',borderRadius:10,padding:'12px',marginTop:8}}>
                  <label style={{display:'flex',alignItems:'flex-start',gap:10,cursor:'pointer',fontSize:13,color:'#111827',fontWeight:600}}>
                    <input type="checkbox" checked={form.send_push} onChange={e=>setForm(f=>({...f,send_push:e.target.checked}))} style={{marginTop:3,accentColor:'#6d28d9'}}/>
                    <div>
                      <div>📡 Send Live Push Notification</div>
                      <div style={{fontSize:11,color:'#6b7280',fontWeight:500,marginTop:2}}>Instantly alerts locked/closed devices (WhatsApp style)</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:20}}>
              <Btn variant="secondary" onClick={()=>setModalOpen(false)}>Cancel</Btn>
              <Btn onClick={save} loading={saving}>📤 Post Now</Btn>
            </div>
          </div>
        </div>
      )}
    </>
  )
}