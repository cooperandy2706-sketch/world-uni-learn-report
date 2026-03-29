// src/pages/teacher/NotificationsPage.tsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

const TYPE_ICON:any={info:'ℹ️',class_reminder:'🔔',announcement:'📢',meeting:'📅',test:'📝',exam:'📋',reminder:'⏰',holiday:'🎉'}

export default function TeacherNotificationsPage(){
  const {user}=useAuth()
  const [notifs,setNotifs]=useState<any[]>([])
  const [announcements,setAnnouncements]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [tab,setTab]=useState<'notifications'|'announcements'>('notifications')

  useEffect(()=>{if(user)load()},[user])

  async function load(){
    setLoading(true)
    const [{data:n},{data:a}]=await Promise.all([
      supabase.from('notifications').select('*')
        .eq('user_id',user!.id).order('created_at',{ascending:false}).limit(50),
      supabase.from('announcements').select('*,from_user:users(full_name),reads:announcement_reads(id)')
        .eq('school_id',user!.school_id)
        .in('target_role',['all','teacher'])
        .order('is_pinned',{ascending:false})
        .order('created_at',{ascending:false}),
    ])
    setNotifs(n??[])
    setAnnouncements(a??[])
    setLoading(false)
  }

  async function markAllRead(){
    const unread=notifs.filter(n=>!n.is_read).map(n=>n.id)
    if(unread.length===0)return
    await supabase.from('notifications').update({is_read:true}).in('id',unread)
    load()
  }

  async function markRead(id:string){
    await supabase.from('notifications').update({is_read:true}).eq('id',id)
    setNotifs(prev=>prev.map(n=>n.id===id?{...n,is_read:true}:n))
  }

  async function markAnnouncementRead(annId:string){
    await supabase.from('announcement_reads').insert({announcement_id:annId,user_id:user!.id}).onConflict('announcement_id,user_id' as any).ignore()
    load()
  }

  const unreadCount=notifs.filter(n=>!n.is_read).length

  return(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _nt_fi{from{opacity:0}to{opacity:1}}
        .nt-item:hover{background:#faf5ff !important}
        .nt-item{transition:background .12s;cursor:pointer}
      `}</style>
      <div style={{fontFamily:'"DM Sans",system-ui,sans-serif',animation:'_nt_fi .4s ease'}}>

        <div style={{marginBottom:22,display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
          <div>
            <h1 style={{fontFamily:'"Playfair Display",serif',fontSize:26,fontWeight:700,color:'#111827',margin:0}}>
              Notifications
              {unreadCount>0&&<span style={{fontSize:14,background:'#dc2626',color:'#fff',borderRadius:99,padding:'2px 8px',marginLeft:10,fontFamily:'"DM Sans",sans-serif'}}>{unreadCount}</span>}
            </h1>
            <p style={{fontSize:13,color:'#6b7280',marginTop:3}}>Your notifications and announcements from admin</p>
          </div>
          {unreadCount>0&&(
            <button onClick={markAllRead}
              style={{padding:'8px 14px',borderRadius:9,border:'1.5px solid #e5e7eb',background:'#fff',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'"DM Sans",sans-serif',color:'#374151'}}>
              ✓ Mark all read
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{display:'flex',gap:4,marginBottom:18,background:'#f5f3ff',borderRadius:12,padding:4,width:'fit-content'}}>
          {[
            {k:'notifications',label:`Notifications${unreadCount>0?` (${unreadCount})`:''}` },
            {k:'announcements',label:`Announcements (${announcements.length})`},
          ].map(t=>(
            <button key={t.k} onClick={()=>setTab(t.k as any)}
              style={{padding:'7px 16px',borderRadius:9,border:'none',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'"DM Sans",sans-serif',
                background:tab===t.k?'#fff':'transparent',color:tab===t.k?'#6d28d9':'#6b7280',
                boxShadow:tab===t.k?'0 1px 4px rgba(0,0,0,.08)':'none',transition:'all .15s'}}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{display:'flex',justifyContent:'center',padding:60}}>
            <div style={{width:32,height:32,borderRadius:'50%',border:'3px solid #ede9fe',borderTopColor:'#6d28d9',animation:'_nt_fi .8s linear infinite'}}/>
          </div>
        ) : tab==='notifications' ? (
          notifs.length===0 ? (
            <div style={{background:'#fff',borderRadius:16,padding:'60px 20px',textAlign:'center',border:'1.5px solid #f0eefe'}}>
              <div style={{fontSize:52,marginBottom:12}}>🔔</div>
              <h3 style={{fontFamily:'"Playfair Display",serif',fontSize:18,fontWeight:700,color:'#111827'}}>No notifications yet</h3>
            </div>
          ) : (
            <div style={{background:'#fff',borderRadius:16,border:'1.5px solid #f0eefe',overflow:'hidden'}}>
              {notifs.map((n,i)=>(
                <div key={n.id} className="nt-item" onClick={()=>markRead(n.id)}
                  style={{padding:'14px 18px',borderBottom:i<notifs.length-1?'1px solid #f0eefe':'none',display:'flex',gap:12,alignItems:'flex-start',
                    background:n.is_read?'#fff':'#faf5ff'}}>
                  <div style={{width:38,height:38,borderRadius:12,background:n.is_read?'#f5f3ff':'linear-gradient(135deg,#7c3aed,#6d28d9)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>
                    {TYPE_ICON[n.type]??'🔔'}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2}}>
                      <h4 style={{fontSize:13,fontWeight:700,color:'#111827',margin:0}}>{n.title}</h4>
                      {!n.is_read&&<span style={{width:7,height:7,borderRadius:'50%',background:'#6d28d9',flexShrink:0,display:'block'}}/>}
                    </div>
                    {n.body&&<p style={{fontSize:12,color:'#374151',margin:'0 0 4px',lineHeight:1.5}}>{n.body}</p>}
                    <span style={{fontSize:11,color:'#9ca3af'}}>{new Date(n.created_at).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          announcements.length===0 ? (
            <div style={{background:'#fff',borderRadius:16,padding:'60px 20px',textAlign:'center',border:'1.5px solid #f0eefe'}}>
              <div style={{fontSize:52,marginBottom:12}}>📭</div>
              <h3 style={{fontFamily:'"Playfair Display",serif',fontSize:18,fontWeight:700,color:'#111827'}}>No announcements yet</h3>
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {announcements.map((a:any)=>{
                const isRead=(a.reads??[]).some((r:any)=>r.user_id===user!.id)
                return(
                  <div key={a.id} onClick={()=>markAnnouncementRead(a.id)}
                    style={{background:isRead?'#fff':'#faf5ff',borderRadius:14,padding:'16px 18px',border:`1.5px solid ${a.is_pinned?'#fde68a':'#f0eefe'}`,cursor:'pointer',transition:'all .2s'}}>
                    <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
                      <span style={{fontSize:22,flexShrink:0}}>{TYPE_ICON[a.type]??'📢'}</span>
                      <div style={{flex:1}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3,flexWrap:'wrap'}}>
                          <h3 style={{fontSize:14,fontWeight:700,color:'#111827',margin:0}}>{a.title}</h3>
                          {a.is_pinned&&<span style={{fontSize:10}}>📌</span>}
                          {!isRead&&<span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:99,background:'#6d28d9',color:'#fff'}}>NEW</span>}
                        </div>
                        <p style={{fontSize:13,color:'#374151',margin:'0 0 6px',lineHeight:1.5}}>{a.body}</p>
                        {a.meeting_date&&(
                          <div style={{fontSize:12,color:'#0369a1',fontWeight:600,marginBottom:4}}>
                            📅 {new Date(a.meeting_date).toLocaleString()}
                            {a.meeting_link&&<a href={a.meeting_link} target="_blank" rel="noreferrer" style={{marginLeft:8,color:'#0891b2',textDecoration:'underline'}}>Join Meeting</a>}
                          </div>
                        )}
                        <div style={{fontSize:11,color:'#9ca3af'}}>
                          From {a.from_user?.full_name??'Admin'} · {new Date(a.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>
    </>
  )
}