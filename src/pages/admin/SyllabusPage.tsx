// src/pages/admin/SyllabusPage.tsx
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
    danger:   {background:hov?'#b91c1c':'#dc2626',color:'#fff',border:'none'},
  }
  return(
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{display:'inline-flex',alignItems:'center',gap:6,padding:'9px 16px',borderRadius:9,fontSize:13,fontWeight:600,cursor:disabled?'not-allowed':'pointer',transition:'all .15s',opacity:disabled?0.6:1,fontFamily:'"DM Sans",sans-serif',...v[variant],...style}}>
      {loading&&<span style={{width:13,height:13,borderRadius:'50%',border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',animation:'_syl_spin .7s linear infinite',flexShrink:0}}/>}
      {children}
    </button>
  )
}

export default function SyllabusPage(){
  const {user}=useAuth()
  const {data:classes=[]}=useClasses()
  const {data:term}=useCurrentTerm()

  const [syllabus,setSyllabus]=useState<any[]>([])
  const [subjects,setSubjects]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [uploading,setUploading]=useState(false)
  const [modalOpen,setModalOpen]=useState(false)
  const [form,setForm]=useState({class_id:'',subject_id:'',title:'',file:null as File|null})
  const [selectedClass,setSelectedClass]=useState('')

  useEffect(()=>{load()},[selectedClass,term?.id])
  useEffect(()=>{ loadSubjects() },[])

  async function load(){
    setLoading(true)
    let q=supabase.from('syllabus').select('*,class:classes(name),subject:subjects(name),uploader:users(full_name)')
      .eq('school_id',user!.school_id).order('created_at',{ascending:false})
    if(selectedClass) q=q.eq('class_id',selectedClass)
    if(term?.id) q=q.eq('term_id',(term as any).id)
    const {data}=await q
    setSyllabus(data??[])
    setLoading(false)
  }

  async function loadSubjects(){
    const {data}=await supabase.from('subjects').select('id,name').eq('school_id',user!.school_id).order('name')
    setSubjects(data??[])
  }

  async function upload(){
    if(!form.class_id||!form.subject_id||!form.title){toast.error('Fill in all fields');return}
    if(!form.file){toast.error('Select a file to upload');return}
    setUploading(true)
    try{
      const ext=form.file.name.split('.').pop()
      const path=`${user!.school_id}/${form.class_id}/${Date.now()}.${ext}`
      const {error:upErr}=await supabase.storage.from('syllabus').upload(path,form.file)
      if(upErr) throw upErr
      const {data:{publicUrl}}=supabase.storage.from('syllabus').getPublicUrl(path)
      const {error:dbErr}=await supabase.from('syllabus').insert({
        school_id:user!.school_id,
        class_id:form.class_id,
        subject_id:form.subject_id,
        term_id:(term as any)?.id,
        title:form.title,
        file_url:publicUrl,
        file_name:form.file.name,
        uploaded_by:user!.id,
      })
      if(dbErr) throw dbErr
      toast.success('Syllabus uploaded!')
      setModalOpen(false)
      setForm({class_id:'',subject_id:'',title:'',file:null})
      load()
    }catch(e:any){
      toast.error(e.message??'Upload failed')
    }finally{setUploading(false)}
  }

  async function deleteSyllabus(id:string,fileUrl:string){
    if(!confirm('Delete this syllabus?'))return
    if(fileUrl){
      const path=fileUrl.split('/syllabus/')[1]
      if(path) await supabase.storage.from('syllabus').remove([path])
    }
    await supabase.from('syllabus').delete().eq('id',id)
    toast.success('Deleted')
    load()
  }

  const filtered=selectedClass?syllabus.filter(s=>s.class_id===selectedClass):syllabus

  return(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _syl_spin{to{transform:rotate(360deg)}}
        @keyframes _syl_fi{from{opacity:0}to{opacity:1}}
        .syl-card:hover{box-shadow:0 6px 20px rgba(109,40,217,.1) !important;transform:translateY(-1px)}
        .syl-card{transition:all .2s}
      `}</style>
      <div style={{fontFamily:'"DM Sans",system-ui,sans-serif',animation:'_syl_fi .4s ease'}}>

        <div style={{marginBottom:22,display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
          <div>
            <h1 style={{fontFamily:'"Playfair Display",serif',fontSize:26,fontWeight:700,color:'#111827',margin:0}}>Syllabus</h1>
            <p style={{fontSize:13,color:'#6b7280',marginTop:3}}>Upload and manage syllabuses for each class and subject</p>
          </div>
          <Btn onClick={()=>setModalOpen(true)}>📤 Upload Syllabus</Btn>
        </div>

        {/* Filter */}
        <div style={{background:'#fff',borderRadius:14,padding:'14px 18px',border:'1.5px solid #f0eefe',marginBottom:18,display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}>
          <label style={{fontSize:11,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'.06em'}}>Filter by class:</label>
          <select value={selectedClass} onChange={e=>setSelectedClass(e.target.value)}
            style={{padding:'7px 12px',borderRadius:8,border:'1.5px solid #e5e7eb',fontSize:13,outline:'none',background:'#faf5ff',fontFamily:'"DM Sans",sans-serif',cursor:'pointer'}}>
            <option value="">All Classes</option>
            {(classes as any[]).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <span style={{fontSize:12,color:'#6b7280',marginLeft:'auto'}}>{filtered.length} file{filtered.length!==1?'s':''}</span>
        </div>

        {loading ? (
          <div style={{display:'flex',justifyContent:'center',padding:60}}>
            <div style={{width:32,height:32,borderRadius:'50%',border:'3px solid #ede9fe',borderTopColor:'#6d28d9',animation:'_syl_spin .8s linear infinite'}}/>
          </div>
        ) : filtered.length===0 ? (
          <div style={{background:'#fff',borderRadius:16,padding:'60px 20px',textAlign:'center',border:'1.5px solid #f0eefe'}}>
            <div style={{fontSize:52,marginBottom:12}}>📚</div>
            <h3 style={{fontFamily:'"Playfair Display",serif',fontSize:18,fontWeight:700,color:'#111827',marginBottom:6}}>No syllabuses uploaded yet</h3>
            <p style={{fontSize:13,color:'#9ca3af',marginBottom:18}}>Upload a syllabus PDF for any class and subject.</p>
            <Btn onClick={()=>setModalOpen(true)}>📤 Upload First Syllabus</Btn>
          </div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:14}}>
            {filtered.map((s,i)=>(
              <div key={s.id} className="syl-card"
                style={{background:'#fff',borderRadius:14,padding:'16px',border:'1.5px solid #f0eefe',boxShadow:'0 1px 4px rgba(109,40,217,.06)'}}>
                <div style={{display:'flex',alignItems:'flex-start',gap:12,marginBottom:12}}>
                  <div style={{width:44,height:44,borderRadius:12,background:'linear-gradient(135deg,#fee2e2,#fecaca)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>
                    📄
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <h3 style={{fontSize:13,fontWeight:700,color:'#111827',margin:'0 0 3px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.title}</h3>
                    <div style={{fontSize:11,color:'#6b7280',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.file_name}</div>
                  </div>
                </div>
                <div style={{display:'flex',gap:6,marginBottom:12,flexWrap:'wrap'}}>
                  <span style={{fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:99,background:'#f5f3ff',color:'#6d28d9'}}>{s.class?.name}</span>
                  <span style={{fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:99,background:'#eff6ff',color:'#0369a1'}}>{s.subject?.name}</span>
                </div>
                <div style={{fontSize:11,color:'#9ca3af',marginBottom:12}}>
                  Uploaded by {s.uploader?.full_name??'Admin'} · {new Date(s.created_at).toLocaleDateString('en-GB')}
                </div>
                <div style={{display:'flex',gap:6}}>
                  <a href={s.file_url} target="_blank" rel="noreferrer"
                    style={{flex:1,padding:'7px',borderRadius:8,border:'1.5px solid #ddd6fe',background:'#f5f3ff',color:'#6d28d9',fontSize:12,fontWeight:600,textAlign:'center',textDecoration:'none',display:'block'}}>
                    👁️ View
                  </a>
                  <a href={s.file_url} download={s.file_name}
                    style={{flex:1,padding:'7px',borderRadius:8,border:'1.5px solid #ddd6fe',background:'#f5f3ff',color:'#6d28d9',fontSize:12,fontWeight:600,textAlign:'center',textDecoration:'none',display:'block'}}>
                    ⬇️ Download
                  </a>
                  <button onClick={()=>deleteSyllabus(s.id,s.file_url)}
                    style={{width:32,borderRadius:8,border:'none',background:'#fef2f2',color:'#dc2626',cursor:'pointer',fontSize:13}}>
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload modal */}
      {modalOpen&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:999,backdropFilter:'blur(4px)',padding:16}}>
          <div style={{background:'#fff',borderRadius:16,padding:'24px',width:'100%',maxWidth:460,boxShadow:'0 24px 64px rgba(0,0,0,.18)',fontFamily:'"DM Sans",sans-serif'}}>
            <h3 style={{fontFamily:'"Playfair Display",serif',fontSize:19,fontWeight:700,color:'#111827',marginBottom:18}}>📤 Upload Syllabus</h3>
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              {[
                {label:'Class *',field:'class_id',options:(classes as any[]).map(c=>({id:c.id,name:c.name}))},
                {label:'Subject *',field:'subject_id',options:subjects.map(s=>({id:s.id,name:s.name}))},
              ].map(({label,field,options})=>(
                <div key={field}>
                  <label style={{display:'block',fontSize:11,fontWeight:700,color:'#374151',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:5}}>{label}</label>
                  <select value={(form as any)[field]} onChange={e=>setForm(f=>({...f,[field]:e.target.value}))}
                    style={{width:'100%',padding:'9px 12px',borderRadius:9,border:'1.5px solid #e5e7eb',fontSize:13,outline:'none',fontFamily:'"DM Sans",sans-serif',cursor:'pointer'}}>
                    <option value="">Select…</option>
                    {options.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
              ))}
              <div>
                <label style={{display:'block',fontSize:11,fontWeight:700,color:'#374151',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:5}}>Title *</label>
                <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="e.g. Term 2 Mathematics Syllabus"
                  style={{width:'100%',padding:'9px 12px',borderRadius:9,border:'1.5px solid #e5e7eb',fontSize:13,outline:'none',fontFamily:'"DM Sans",sans-serif',boxSizing:'border-box'}}/>
              </div>
              <div>
                <label style={{display:'block',fontSize:11,fontWeight:700,color:'#374151',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:5}}>File (PDF, Word, Image) *</label>
                <input type="file" accept=".pdf,.doc,.docx,.jpg,.png"
                  onChange={e=>setForm(f=>({...f,file:e.target.files?.[0]??null}))}
                  style={{width:'100%',padding:'9px 12px',borderRadius:9,border:'1.5px solid #e5e7eb',fontSize:13,fontFamily:'"DM Sans",sans-serif',boxSizing:'border-box'}}/>
                {form.file&&<p style={{fontSize:11,color:'#16a34a',marginTop:4}}>✓ {form.file.name} ({(form.file.size/1024).toFixed(0)}KB)</p>}
              </div>
            </div>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:20}}>
              <Btn variant="secondary" onClick={()=>setModalOpen(false)}>Cancel</Btn>
              <Btn onClick={upload} loading={uploading}>📤 Upload</Btn>
            </div>
          </div>
        </div>
      )}
    </>
  )
}