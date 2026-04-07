import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import Modal from '../../components/ui/Modal'
import { formatDate } from '../../lib/utils'
import ReactMarkdown from 'react-markdown'
import toast from 'react-hot-toast'

interface GlobalResourceData {
  title: string
  description: string
  subject_id: string
  content_type: 'video' | 'link' | 'passage' | 'google_doc'
  content: string
  is_published: boolean
  topic: string
  cover_image_url: string
}

// ── Markdown Components ─────────────────────────────────────
function MarkdownToolbar({ onClick, onUpload }: { onClick: (type: string) => void, onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  const tools = [
    { label: 'B', type: 'bold', title: 'Bold' },
    { label: 'I', type: 'italic', title: 'Italic' },
    { label: 'H1', type: 'h1', title: 'Heading 1' },
    { label: 'H2', type: 'h2', title: 'Heading 2' },
    { label: 'List', type: 'list', title: 'Bullet List' },
    { label: 'Quote', type: 'quote', title: 'Blockquote' },
    { label: 'Divider', type: 'hr', title: 'Horizontal Line' },
    { label: '🔗 Link', type: 'link', title: 'Insert Link' },
    { label: '🖼️ Image URL', type: 'image', title: 'Insert Image URL' },
  ]

  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 12, background: '#fff', padding: 8, borderRadius: 12, border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
      {tools.map(t => (
        <button key={t.type} onClick={() => onClick(t.type)} title={t.title} style={{ 
          background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8,
          padding: '6px 12px', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
          color: '#1e293b'
        }} onMouseOver={e=>e.currentTarget.style.background='#f1f5f9'} onMouseOut={e=>e.currentTarget.style.background='#f8fafc'}>
          {t.label}
        </button>
      ))}
      <label style={{ 
        background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 8,
        padding: '6px 12px', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
        color: '#065f46', display: 'flex', alignItems: 'center'
      }} onMouseOver={e=>e.currentTarget.style.background='#d1fae5'} onMouseOut={e=>e.currentTarget.style.background='#ecfdf5'} title="Upload image directly into passage">
        📁 Upload Image
        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={onUpload} />
      </label>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────
function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 5 }}>{children}</label>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <FieldLabel>{label}</FieldLabel>
      {children}
    </div>
  )
}

function StyledInput({ error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <input
        {...props}
        onFocus={e => { setFocused(true); props.onFocus?.(e) }}
        onBlur={e => { setFocused(false); props.onBlur?.(e) }}
        style={{
          width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 13,
          border: `1.5px solid ${error ? '#f87171' : focused ? '#059669' : '#e5e7eb'}`,
          boxShadow: focused ? '0 0 0 3px rgba(16,185,129,0.1)' : 'none',
          outline: 'none', background: '#fff', color: '#111827',
          fontFamily: '"DM Sans",sans-serif', transition: 'all 0.15s',
          boxSizing: 'border-box',
          ...props.style
        }}
      />
      {error && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>⚠ {error}</p>}
    </div>
  )
}

function StyledSelect({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const [focused, setFocused] = useState(false)
  return (
    <select
      {...props}
      onFocus={e => { setFocused(true); props.onFocus?.(e) }}
      onBlur={e => { setFocused(false); props.onBlur?.(e) }}
      style={{
        width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 13,
        border: `1.5px solid ${focused ? '#059669' : '#e5e7eb'}`,
        boxShadow: focused ? '0 0 0 3px rgba(16,185,129,0.1)' : 'none',
        outline: 'none', background: '#fff', color: '#111827',
        fontFamily: '"DM Sans",sans-serif', cursor: 'pointer',
        boxSizing: 'border-box',
        ...props.style
      }}
    >
      {children}
    </select>
  )
}

function Btn({ children, onClick, variant = 'primary', type = 'button', disabled, loading, style }: any) {
  const [hov, setHov] = useState(false)
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '9px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600,
    border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s', opacity: disabled ? 0.6 : 1,
    fontFamily: '"DM Sans",sans-serif',
    ...style,
  }
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: hov ? '#047857' : 'linear-gradient(135deg,#059669,#10b981)', color: '#fff', boxShadow: '0 2px 8px rgba(16,185,129,0.28)' },
    secondary: { background: hov ? '#f5f3ff' : '#fff', color: '#374151', border: '1.5px solid #e5e7eb' },
    danger: { background: hov ? '#b91c1c' : '#dc2626', color: '#fff', boxShadow: '0 2px 6px rgba(220,38,38,0.22)' },
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ ...base, ...variants[variant] }}>
      {loading && <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: '_spin 0.7s linear infinite', flexShrink: 0 }} />}
      {children}
    </button>
  )
}

// ═══════════════════════════════════════════════════════════

export default function GlobalResourcesPage() {
  const { user } = useAuth()
  const [resources, setResources] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editorMode, setEditorMode] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Builder State
  const [form, setForm] = useState<GlobalResourceData>({
    title: '',
    description: '',
    subject_id: '',
    content_type: 'passage',
    content: '',
    is_published: false,
    topic: '',
    cover_image_url: ''
  })

  // Textarea Ref for cursor control
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function insertMarkdown(type: string) {
    if (!textareaRef.current) return
    const el = textareaRef.current
    const start = el.selectionStart
    const end = el.selectionEnd
    const fullText = form.content
    const selected = fullText.substring(start, end)
    
    let before = ''
    let after = ''
    let newSelectionOffset = 0

    switch(type) {
      case 'bold': before = '**'; after = '**'; newSelectionOffset = 2; break
      case 'italic': before = '_'; after = '_'; newSelectionOffset = 1; break
      case 'h1': before = '# '; newSelectionOffset = 2; break
      case 'h2': before = '## '; newSelectionOffset = 3; break
      case 'list': before = '- '; newSelectionOffset = 2; break
      case 'quote': before = '> '; newSelectionOffset = 2; break
      case 'hr': before = '\n---\n'; newSelectionOffset = 5; break
      case 'link': before = '[Link Text]('; after = ')'; newSelectionOffset = 2; break
      case 'image': before = '![Image Alt]('; after = ')'; newSelectionOffset = 2; break
    }

    const newVal = fullText.substring(0, start) + before + selected + after + fullText.substring(end)
    setForm(p => ({ ...p, content: newVal }))
    
    // Resume focus
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + newSelectionOffset, end + newSelectionOffset)
    }, 0)
  }


  async function handleInlineImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    toast.loading('Uploading inline image...', { id: 'inlineUpload' })
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `inline_${Math.random()}.${fileExt}`
      const filePath = `passages/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('learning-materials')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('learning-materials')
        .getPublicUrl(filePath)

      // Insert markdown string
      const str = `\\n![Uploaded Image](${publicUrl})\\n`
      setForm(p => {
        if (!textareaRef.current) return { ...p, content: p.content + str }
        const el = textareaRef.current
        const start = el.selectionStart
        return { ...p, content: p.content.substring(0, start) + str + p.content.substring(el.selectionEnd) }
      })
      toast.success('Image inserted!', { id: 'inlineUpload' })
    } catch (err: any) {
      toast.error('Failed to upload image.', { id: 'inlineUpload' })
    }
  }

  // Upload State
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    loadData()
    loadResources()
  }, [])

  async function loadData() {
    try {
      const query = supabase.from('subjects').select('*')
      if (user?.role === 'super_admin') {
        query.or(`school_id.is.null${user?.school_id ? `,school_id.eq.${user.school_id}` : ''}`)
      } else {
        query.is('school_id', null)
      }
      const { data: subs } = await query.order('name')
      setSubjects(subs ?? [])
    } catch (err) {
      console.error('Failed to load subjects:', err)
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `covers/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('learning-materials')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('learning-materials')
        .getPublicUrl(filePath)

      setForm(prev => ({ ...prev, cover_image_url: publicUrl }))
      toast.success('Cover image uploaded!')
    } catch (err: any) {
      toast.error(err.message || 'Upload failed. Ensure you created the "learning-materials" bucket.')
    } finally {
      setIsUploading(false)
    }
  }

  async function loadResources() {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('global_resources')
        .select('*, subject:subjects(name)')
        .is('school_id', null)
        .order('created_at', { ascending: false })

      if (error) {
        if (error.code === '42P01') {
          // Table doesn't exist yet! Don't bomb the UI, just show empty
          setResources([])
          setIsLoading(false)
          return
        }
        throw error
      }
      
      setResources(data ?? [])
    } catch (err: any) {
      toast.error(err.message || 'Failed to load global resources')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSubmit(publish: boolean = true) {
    if (!form.title || !form.subject_id || !form.content) {
      toast.error('Please fill in title, subject, and provide the content payload')
      return
    }

    // Rough URL validation for links and videos
    if (['video', 'link'].includes(form.content_type) && !form.content.startsWith('http')) {
      toast.error('Content must be a valid http/https URL for Videos and Links')
      return
    }

    setIsSubmitting(true)
    try {
      const dbPayload = {
        title: form.title,
        description: form.description,
        subject_id: form.subject_id || null, // Map "" to null for UUID column
        content_type: form.content_type,
        content: form.content,
        is_published: publish,
        topic: form.topic,
        cover_image_url: form.cover_image_url,
        school_id: null
      }

      let error = null
      if ((form as any).id) {
        const { error: updErr } = await supabase.from('global_resources').update(dbPayload).eq('id', (form as any).id)
        error = updErr
      } else {
        const { error: insErr } = await supabase.from('global_resources').insert(dbPayload)
        error = insErr
      }

      if (error) {
        if (error.code === '42P01') {
           throw new Error('Database Error: global_resources table has not been created in Supabase yet. Run the SQL schema!')
        }
        throw error
      }

      toast.success(publish ? 'Resource published successfully' : 'Draft saved successfully')
      setEditorMode(false)
      setForm({
        title: '',
        description: '',
        subject_id: '',
        content_type: 'video',
        content: '',
        is_published: false,
        topic: '',
        cover_image_url: ''
      })
      loadResources()
    } catch (err: any) {
      console.error('PUBLISH ERROR:', err)
      toast.error(err.message || err.details || 'Failed to update global resource')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function togglePublish(res: any) {
    try {
      const newStatus = !res.is_published
      const { error } = await supabase.from('global_resources').update({ is_published: newStatus }).eq('id', res.id)
      if (error) throw error
      toast.success(newStatus ? 'Resource published to all students' : 'Resource unpublished')
      loadResources()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this learning material?')) return
    try {
      const { error } = await supabase.from('global_resources').delete().eq('id', id)
      if (error) throw error
      toast.success('Resource deleted forever')
      loadResources()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const getTypeIcon = (t: string) => {
    if (t === 'video') return '▶️'
    if (t === 'google_doc') return '📄'
    if (t === 'link') return '🔗'
    if (t === 'passage') return '📝'
    return '📚'
  }

  if (editorMode) {
    return (
      <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif', minHeight: '100vh', padding: '0 0 100px 0' }}>
        {/* Top bar sticky */}
        <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #f1f5f9', padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <button onClick={() => setEditorMode(false)} style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#64748b', padding: '8px 16px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
              ← Exit Builder
            </button>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', margin: 0 }}>High-End Material Builder</h1>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Drafting Standardized Platform Curriculum</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
             <Btn variant="secondary" onClick={() => handleSubmit(false)} loading={isSubmitting} disabled={isSubmitting}>Save Draft</Btn>
             <Btn onClick={() => handleSubmit(true)} loading={isSubmitting} disabled={isSubmitting}>Publish to Platform</Btn>
          </div>
        </div>

        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 40px', display: 'grid', gridTemplateColumns: '1fr 400px', gap: 40 }}>
          {/* Main Content Area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            
            {/* Sec 1: Identity */}
            <div style={{ background: '#fff', padding: 32, borderRadius: 24, border: '1.5px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
               <h2 style={{ fontSize: 13, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                 <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                 Core Identity & Mapping
               </h2>
               
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                  <Field label="Subject Category *">
                    <StyledSelect value={form.subject_id} onChange={e => setForm(prev => ({ ...prev, subject_id: e.target.value }))}>
                      <option value="">Select global subject...</option>
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </StyledSelect>
                  </Field>
                  <Field label="Topic / Chapter Name *">
                    <StyledInput value={form.topic} onChange={e => setForm(prev => ({ ...prev, topic: e.target.value }))} placeholder="e.g. Euclidean Geometry" />
                  </Field>
               </div>
               
               <div style={{ marginTop: 24 }}>
                  <Field label="Broad Material Title *">
                    <StyledInput value={form.title} style={{ fontSize: 18, fontWeight: 700 }} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} placeholder="The definitive guide to..." />
                  </Field>
               </div>
            </div>

            {/* Sec 2: Cover Image */}
            <div style={{ background: '#fff', padding: 32, borderRadius: 24, border: '1.5px solid #f1f5f9' }}>
               <h2 style={{ fontSize: 13, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 20 }}>Visual Branding (Cover Page)</h2>
               
               <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                  <div style={{ width: 200, height: 120, borderRadius: 16, background: '#f8fafc', border: '2px dashed #cbd5e1', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    {form.cover_image_url ? (
                      <img src={form.cover_image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>No Image Selected</span>
                    )}
                    {isUploading && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid #10b981', borderTopColor: 'transparent', animation: '_spin 0.6s linear infinite' }} />
                      </div>
                    )}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                     <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>Upload a high-quality cover image to represent this material in the student library. Standard ratio 16:9 recommended.</p>
                     <input type="file" accept="image/*" onChange={handleImageUpload} style={{ fontSize: 12 }} />
                     <div style={{ marginTop: 12 }}>
                        <FieldLabel>Or Paste External URL</FieldLabel>
                        <StyledInput value={form.cover_image_url} onChange={e => setForm(prev => ({ ...prev, cover_image_url: e.target.value }))} placeholder="https://unsplash.com/..." />
                     </div>
                  </div>
               </div>
            </div>

            {/* Sec 3: Content Builder */}
            <div style={{ background: '#fff', padding: 32, borderRadius: 24, border: '1.5px solid #f1f5f9' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                 <h2 style={{ fontSize: 13, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', margin: 0 }}>Immersive Content Builder</h2>
                 <StyledSelect style={{ width: 200 }} value={form.content_type} onChange={e => setForm(prev => ({ ...prev, content_type: e.target.value as any, content: '' }))}>
                    <option value="video">YouTube Embed</option>
                    <option value="google_doc">Google Doc/Slides</option>
                    <option value="passage">Detailed Reading Passage</option>
                    <option value="link">External Resource Link</option>
                 </StyledSelect>
               </div>

               <div style={{ padding: 24, background: '#f8fafc', borderRadius: 16 }}>
                  {form.content_type === 'passage' ? (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                       <Field label="Detailed Educational Passage (Broad writing area)">
                          <MarkdownToolbar onClick={insertMarkdown} onUpload={handleInlineImageUpload} />
                          <textarea 
                            ref={textareaRef}
                            value={form.content}
                            onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
                            placeholder="Begin writing your detailed curriculum passage here... Supports broad formatting via Bold, H2, Lists, etc."
                            style={{ 
                              width: '100%', minHeight: 600, padding: 40, borderRadius: 16, fontSize: 16, lineHeight: 1.8,
                              border: '1.5px solid #e2e8f0', fontFamily: 'Georgia, serif', resize: 'vertical', outline: 'none' 
                            }}
                          />
                       </Field>
                       <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 12 }}>Pro Tip: Use the toolbar to add Bold, Italics, or Headings for a professional study guide.</p>
                    </div>
                  ) : (
                    <div style={{ maxWidth: 600 }}>
                       <Field label={`${form.content_type.replace('_', ' ').toUpperCase()} Payload URL`}>
                          <StyledInput value={form.content} onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))} placeholder={`Paste the ${form.content_type} URL here...`} />
                       </Field>
                       <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 12 }}>Ensure the resource is set to public or anyone with the link can view.</p>
                    </div>
                  )}
               </div>
            </div>
            
            <div style={{ background: '#ecfdf5', border: '1.5px solid #a7f3d0', padding: '24px', borderRadius: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: '#065f46', margin: 0 }}>Final Publication Status</h3>
                  <p style={{ fontSize: 12, color: '#059669', margin: 0 }}>Published materials are instantly visible to all students in the global library.</p>
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: form.is_published ? '#059669' : '#64748b' }}>{form.is_published ? 'LIVE' : 'DRAFT'}</span>
                  <div onClick={() => setForm(p => ({ ...p, is_published: !p.is_published }))} style={{ width: 50, height: 26, background: form.is_published ? '#10b981' : '#cbd5e1', borderRadius: 30, padding: 3, cursor: 'pointer', transition: 'all 0.3s' }}>
                     <div style={{ width: 20, height: 20, background: '#fff', borderRadius: '50%', transform: form.is_published ? 'translateX(24px)' : 'translateX(0)', transition: 'all 0.3s' }} />
                  </div>
               </div>
            </div>
          </div>

          {/* Side Preview Pane */}
          <div style={{ position: 'sticky', top: 100, height: 'fit-content' }}>
             <h2 style={{ fontSize: 13, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 20 }}>Live Formatted Preview</h2>
             
             <div style={{ 
                background: '#fff', borderRadius: 24, border: '1.5px solid #f1f5f9', overflow: 'hidden', 
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05), 0 10px 10px -5px rgba(0,0,0,0.02)' 
             }}>
                <div style={{ height: 180, background: '#f8fafc', position: 'relative' }}>
                   {form.cover_image_url ? (
                     <img src={form.cover_image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                   ) : (
                     <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>📚</div>
                   )}
                   <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '4px 10px', borderRadius: 20, color: '#fff', fontSize: 10, fontWeight: 800 }}>
                      {form.content_type.replace('_', ' ').toUpperCase()}
                   </div>
                </div>
                <div style={{ padding: 24, maxHeight: 400, overflowY: 'auto' }}>
                   <div style={{ fontSize: 11, fontWeight: 800, color: '#10b981', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>
                      {form.topic || 'General Topic'}
                   </div>
                   <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', margin: '0 0 12px 0' }}>{form.title || 'Untitled Material'}</h3>
                   
                   <div className="markdown-preview" style={{ fontSize: 13, color: '#64748b', borderTop: '1px solid #f8fafc', paddingTop: 12 }}>
                      {form.content_type === 'passage' ? (
                        <ReactMarkdown>{form.content || '*No content yet...*'}</ReactMarkdown>
                      ) : (
                        <p>{form.description || 'Preview of link/video content...'}</p>
                      )}
                   </div>
                </div>
             </div>
             
             <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 16 }}>Formatted live preview shows how bold/italic text will look.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes _spin { to{transform:rotate(360deg)} }
        @keyframes _fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif' }}>
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>📚 Global Learning Library</h1>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 3 }}>Distribute standard learning materials mapped to the global curriculum.</p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Btn onClick={() => {
              setForm({
                title: '',
                description: '',
                subject_id: '',
                content_type: 'passage',
                content: '',
                is_published: false,
                topic: '',
                cover_image_url: ''
              })
              setEditorMode(true)
            }}>➕ Upload Material</Btn>
          </div>
        </div>

        {/* ── List ── */}
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #ecfdf5', borderTopColor: '#10b981', animation: '_spin 0.8s linear infinite' }} />
            <p style={{ fontSize: 13, color: '#9ca3af' }}>Loading global resources…</p>
          </div>
        ) : resources.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 16, padding: '60px 20px', textAlign: 'center', border: '1.5px solid #f0eefe' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
            <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 6 }}>No learning materials available</h3>
            <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 18 }}>Publish your first video tutorial or study guide for students.</p>
            <Btn onClick={() => setEditorMode(true)}>➕ Upload First Material</Btn>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 }}>
            {resources.map((res, i) => (
              <div key={res.id} style={{ 
                background: '#fff', borderRadius: 18, border: '1.5px solid #f0eefe', overflow: 'hidden',
                boxShadow: '0 1px 4px rgba(16,185,129,0.06)', animation: `_fadeUp 0.3s ease ${i * 0.05}s both`,
                display: 'flex', flexDirection: 'column'
              }}>
                <div style={{ height: 140, background: '#f8fafc', position: 'relative' }}>
                   {res.cover_image_url ? (
                     <img src={res.cover_image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                   ) : (
                     <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>📚</div>
                   )}
                </div>

                <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {res.subject?.name || 'General'}
                      </span>
                      {res.topic && (
                         <span style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                            • {res.topic}
                         </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => { 
                        setForm({
                          ...res,
                          // Extra mapping to ensure no objects are passed
                          id: res.id
                        })
                        setEditorMode(true)
                      }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14, color: '#64748b' }}>✏️</button>
                      <button onClick={() => handleDelete(res.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14, color: '#f87171' }}>🗑️</button>
                    </div>
                  </div>
                  
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: '0 0 4px 0' }}>
                    {res.title}
                  </h3>
                  <p style={{ fontSize: 12, color: '#64748b', marginBottom: 18, flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{res.description}</p>
                
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f5f3ff', paddingTop: 14 }}>
                    <button onClick={() => togglePublish(res)} style={{ 
                      border: 'none', background: res.is_published ? '#ecfdf5' : '#f3f4f6', 
                      color: res.is_published ? '#10b981' : '#6b7280', borderRadius: 8, padding: '6px 12px', 
                      fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                    }}>
                      {res.is_published ? '✅ Live' : '🔒 Draft'}
                    </button>
                    <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>
                       {res.content_type}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
