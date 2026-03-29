// src/pages/teacher/TimetablePage.tsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useCurrentTerm } from '../../hooks/useSettings'

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday']
const DAY_SHORT = ['Mon','Tue','Wed','Thu','Fri']

export default function TeacherTimetablePage(){
  const {user}=useAuth()
  const {data:term}=useCurrentTerm()
  const [slots,setSlots]=useState<any[]>([])
  const [periods,setPeriods]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [todayDay]=useState(()=>{
    const d=new Date().getDay() // 0=Sun
    return d>=1&&d<=5?d:1
  })

  useEffect(()=>{if(user&&term?.id)load()},[user,term?.id])

  async function load(){
    setLoading(true)
    const {data:t}=await supabase.from('teachers').select('id').eq('user_id',user!.id).single()
    if(!t){setLoading(false);return}

    const [{data:p},{data:s}]=await Promise.all([
      supabase.from('timetable_periods').select('*').eq('school_id',user!.school_id).order('sort_order'),
      supabase.from('timetable_slots')
        .select('*,subject:subjects(id,name),class:classes(id,name),period:timetable_periods(id,name,start_time,end_time)')
        .eq('teacher_id',t.id).eq('term_id',(term as any).id),
    ])
    setPeriods(p??[])
    setSlots(s??[])
    setLoading(false)
  }

  function getSlot(day:number,periodId:string){
    return slots.find(s=>s.day_of_week===day&&s.period_id===periodId)
  }

  const todaySlots=slots.filter(s=>s.day_of_week===todayDay).sort((a,b)=>{
    const pa=periods.find(p=>p.id===a.period_id)?.sort_order??0
    const pb=periods.find(p=>p.id===b.period_id)?.sort_order??0
    return pa-pb
  })

  if(loading) return(
    <div style={{display:'flex',justifyContent:'center',padding:60}}>
      <div style={{width:32,height:32,borderRadius:'50%',border:'3px solid #ede9fe',borderTopColor:'#6d28d9',animation:'_tt_spin .8s linear infinite'}}/>
    </div>
  )

  return(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _tt_spin{to{transform:rotate(360deg)}}
        @keyframes _tt_fi{from{opacity:0}to{opacity:1}}
      `}</style>
      <div style={{fontFamily:'"DM Sans",system-ui,sans-serif',animation:'_tt_fi .4s ease'}}>
        <div style={{marginBottom:22}}>
          <h1 style={{fontFamily:'"Playfair Display",serif',fontSize:26,fontWeight:700,color:'#111827',margin:0}}>My Timetable</h1>
          <p style={{fontSize:13,color:'#6b7280',marginTop:3}}>{(term as any)?.name} Schedule</p>
        </div>

        {/* Today's classes */}
        <div style={{background:'linear-gradient(135deg,#2e1065,#4c1d95)',borderRadius:16,padding:'18px 20px',marginBottom:20,color:'#fff'}}>
          <div style={{fontSize:11,fontWeight:700,opacity:.7,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:8}}>
            Today — {DAYS[todayDay-1]}
          </div>
          {todaySlots.length===0 ? (
            <p style={{fontSize:14,opacity:.7,margin:0}}>No classes today 🎉</p>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {todaySlots.map(s=>{
                const p=periods.find(p=>p.id===s.period_id)
                return(
                  <div key={s.id} style={{display:'flex',alignItems:'center',gap:12,background:'rgba(255,255,255,.1)',borderRadius:10,padding:'10px 14px'}}>
                    <div style={{fontSize:11,opacity:.8,flexShrink:0,minWidth:80}}>{p?.start_time?.slice(0,5)}–{p?.end_time?.slice(0,5)}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:700}}>{s.subject?.name}</div>
                      <div style={{fontSize:11,opacity:.7}}>{s.class?.name} · {p?.name}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Full week grid */}
        <div style={{background:'#fff',borderRadius:16,border:'1.5px solid #f0eefe',overflow:'auto',boxShadow:'0 1px 4px rgba(109,40,217,.06)'}}>
          <table style={{width:'100%',borderCollapse:'collapse',minWidth:600}}>
            <thead>
              <tr style={{background:'linear-gradient(135deg,#1e3a8a,#1e40af)'}}>
                <th style={{padding:'12px 14px',color:'#fff',fontSize:11,fontWeight:700,textAlign:'left',textTransform:'uppercase',width:110}}>Period</th>
                {DAYS.map((d,i)=>(
                  <th key={d} style={{padding:'12px 14px',color:'#fff',fontSize:11,fontWeight:700,textAlign:'center',textTransform:'uppercase',
                    background:i+1===todayDay?'rgba(255,255,255,.15)':undefined}}>
                    {DAY_SHORT[i]}
                    {i+1===todayDay&&<div style={{fontSize:9,fontWeight:600,opacity:.8}}>TODAY</div>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map((p,pi)=>(
                <tr key={p.id} style={{borderBottom:pi<periods.length-1?'1px solid #f0eefe':'none',background:p.is_break?'#fef9c3':'#fff'}}>
                  <td style={{padding:'10px 14px'}}>
                    <div style={{fontSize:11,fontWeight:700,color:p.is_break?'#92400e':'#1e3a8a'}}>{p.name}</div>
                    <div style={{fontSize:10,color:'#6b7280'}}>{p.start_time?.slice(0,5)}–{p.end_time?.slice(0,5)}</div>
                  </td>
                  {p.is_break ? (
                    <td colSpan={5} style={{textAlign:'center',fontSize:11,color:'#92400e',fontWeight:600,padding:10,background:'#fef9c3'}}>
                      🍎 {p.name}
                    </td>
                  ) : DAYS.map((_,di)=>{
                    const slot=getSlot(di+1,p.id)
                    const isToday=di+1===todayDay
                    return(
                      <td key={di} style={{padding:'8px 10px',textAlign:'center',borderLeft:'1px solid #f0eefe',background:isToday?'#faf5ff':undefined}}>
                        {slot ? (
                          <div style={{background:isToday?'linear-gradient(135deg,#7c3aed,#6d28d9)':'#f5f3ff',borderRadius:8,padding:'6px 8px',border:isToday?'none':'1px solid #ddd6fe'}}>
                            <div style={{fontSize:11,fontWeight:700,color:isToday?'#fff':'#5b21b6'}}>{slot.subject?.name}</div>
                            <div style={{fontSize:10,color:isToday?'rgba(255,255,255,.7)':'#7c3aed'}}>{slot.class?.name}</div>
                          </div>
                        ) : (
                          <span style={{color:'#e5e7eb',fontSize:16}}>—</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}