// src/components/layout/NotificationBell.tsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

export default function NotificationBell(){
  const {user}=useAuth()
  const navigate=useNavigate()
  const [count,setCount]=useState(0)
  const [preview,setPreview]=useState<any[]>([])
  const [open,setOpen]=useState(false)
  const ref=useRef<HTMLDivElement>(null)

  useEffect(()=>{
    if(user) load()
    const t=setInterval(()=>{ if(user) load() },30000)
    return()=>clearInterval(t)
  },[user])

  useEffect(()=>{
    function handler(e:MouseEvent){
      if(ref.current&&!ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown',handler)
    return()=>document.removeEventListener('mousedown',handler)
  },[])

  async function load(){
    const {data,count:c}=await supabase.from('notifications')
      .select('*',{count:'exact'})
      .eq('user_id',user!.id).eq('is_read',false)
      .order('created_at',{ascending:false}).limit(5)
    setCount(c??0)
    setPreview(data??[])
  }

  async function markAllRead(){
    await supabase.from('notifications').update({is_read:true}).eq('user_id',user!.id).eq('is_read',false)
    setCount(0); setPreview([]); setOpen(false)
  }

  const teacherNotifPath='/teacher/notifications'

  return(
    <div ref={ref} style={{position:'relative'}}>
      <button onClick={()=>setOpen(o=>!o)}
        style={{position:'relative',width:38,height:38,borderRadius:10,border:'none',background:open?'#f5f3ff':'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,transition:'background .15s',boxShadow:'0 1px 3px rgba(0,0,0,.08)'}}>
        🔔
        {count>0&&(
          <span style={{position:'absolute',top:2,right:2,width:16,height:16,borderRadius:'50%',background:'#dc2626',color:'#fff',fontSize:9,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',border:'1.5px solid #fff'}}>
            {count>9?'9+':count}
          </span>
        )}
      </button>

      {open&&(
        <div style={{position:'absolute',top:46,right:0,width:320,background:'#fff',borderRadius:14,boxShadow:'0 8px 32px rgba(0,0,0,.15)',border:'1.5px solid #f0eefe',zIndex:999,fontFamily:'"DM Sans",sans-serif',overflow:'hidden'}}>
          <div style={{padding:'12px 16px',borderBottom:'1px solid #f0eefe',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <span style={{fontSize:13,fontWeight:700,color:'#111827'}}>
              Notifications {count>0&&<span style={{fontSize:11,background:'#dc2626',color:'#fff',borderRadius:99,padding:'1px 6px',marginLeft:4}}>{count}</span>}
            </span>
            {count>0&&<button onClick={markAllRead} style={{fontSize:11,color:'#6d28d9',fontWeight:600,background:'none',border:'none',cursor:'pointer',fontFamily:'"DM Sans",sans-serif'}}>Mark all read</button>}
          </div>
          <div style={{maxHeight:280,overflowY:'auto'}}>
            {preview.length===0
              ? <div style={{padding:'24px 16px',textAlign:'center',color:'#9ca3af',fontSize:13}}>No unread notifications</div>
              : preview.map((n,i)=>(
                <div key={n.id} style={{padding:'10px 16px',borderBottom:i<preview.length-1?'1px solid #f9fafb':'none',background:'#faf5ff',display:'flex',gap:10,alignItems:'flex-start'}}>
                  <div style={{width:32,height:32,borderRadius:9,background:'linear-gradient(135deg,#7c3aed,#6d28d9)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,flexShrink:0,color:'#fff'}}>🔔</div>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:12,fontWeight:700,color:'#111827',margin:'0 0 2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{n.title}</p>
                    {n.body&&<p style={{fontSize:11,color:'#6b7280',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{n.body}</p>}
                  </div>
                </div>
              ))
            }
          </div>
          <div style={{padding:'10px 16px',borderTop:'1px solid #f0eefe'}}>
            <button onClick={()=>{setOpen(false);navigate(teacherNotifPath)}}
              style={{width:'100%',padding:'8px',borderRadius:9,border:'1.5px solid #ddd6fe',background:'#f5f3ff',color:'#6d28d9',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'"DM Sans",sans-serif'}}>
              View All Notifications →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}