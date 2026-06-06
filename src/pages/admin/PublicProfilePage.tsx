// src/pages/admin/PublicProfilePage.tsx
// Admin: Manage the school's public profile — Overview, Gallery, Videos, Location, Analytics

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'
import {
  Globe, Image as ImageIcon, Video, MapPin, BarChart3,
  Plus, Trash2, Eye, Heart, Users, Upload, ExternalLink,
  Save, ChevronRight, Play, X, Lightbulb, CheckCircle, Circle
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────
interface MediaItem { id: string; media_type: 'photo' | 'video'; url: string; thumbnail?: string; caption?: string; sort_order: number }

const TABS = [
  { id: 'overview',   label: 'Overview',   icon: Globe },
  { id: 'gallery',    label: 'Gallery',    icon: ImageIcon },
  { id: 'videos',     label: 'Videos',     icon: Video },
  { id: 'location',   label: 'Location',   icon: MapPin },
  { id: 'analytics',  label: 'Analytics',  icon: BarChart3 },
]

// ─── Helpers ──────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color }: any) {
  return (
    <div style={{ padding: 24, borderRadius: 16, background: 'var(--bg-card, #fff)', border: '1px solid var(--border-color, #e2e8f0)', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={22} color={color} />
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>{value.toLocaleString()}</div>
      <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>{label}</div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────
export default function PublicProfilePage() {
  const { user } = useAuth()
  const schoolId = user?.school_id
  const fileRef = useRef<HTMLInputElement>(null)

  const [tab, setTab] = useState('overview')
  const [school, setSchool] = useState<any>(null)
  const [media, setMedia] = useState<MediaItem[]>([])
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [videoUrl, setVideoUrl] = useState('')
  const [videoCaption, setVideoCaption] = useState('')
  const [previewVideo, setPreviewVideo] = useState<MediaItem | null>(null)

  // Form state
  const [form, setForm] = useState({
    description: '', motto: '', address: '', phone: '', email: '',
    location_lat: '', location_lng: '', location_label: '', tags: '', slug: ''
  })

  // ── Load ──────────────────────────────────────────────────
  useEffect(() => {
    if (!schoolId) return
    async function load() {
      const { data: s } = await supabase.from('schools').select('*').eq('id', schoolId).single()
      if (s) {
        setSchool(s)
        setForm({
          description: s.description || '',
          motto: s.motto || '',
          address: s.address || '',
          phone: s.phone || '',
          email: s.email || '',
          location_lat: s.location_lat?.toString() || '',
          location_lng: s.location_lng?.toString() || '',
          location_label: s.location_label || '',
          tags: (s.tags || []).join(', '),
          slug: s.slug || '',
        })
      }
      const { data: m } = await supabase.from('school_profile_media').select('*').eq('school_id', schoolId).order('sort_order')
      setMedia((m || []) as any)
    }
    load()
  }, [schoolId])

  // ── Save Overview ─────────────────────────────────────────
  async function saveOverview() {
    if (!schoolId) return
    setSaving(true)
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)
    const { error } = await supabase.from('schools').update({
      description: form.description,
      motto: form.motto,
      address: form.address,
      phone: form.phone,
      email: form.email,
      tags,
      slug: form.slug.toLowerCase().replace(/[^a-z0-9-]/g, '') || null,
    }).eq('id', schoolId)
    setSaving(false)
    if (error) toast.error('Failed to save: ' + error.message)
    else toast.success('Profile updated!')
  }

  // ── Save Location ─────────────────────────────────────────
  async function saveLocation() {
    if (!schoolId) return
    setSaving(true)
    const { error } = await supabase.from('schools').update({
      location_lat: parseFloat(form.location_lat) || null,
      location_lng: parseFloat(form.location_lng) || null,
      location_label: form.location_label || null,
    }).eq('id', schoolId)
    setSaving(false)
    if (error) toast.error(error.message)
    else toast.success('Location saved!')
  }

  // ── Upload Photo ──────────────────────────────────────────
  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !schoolId) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `school-profiles/${schoolId}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('assets').upload(path, file)
    if (upErr) { toast.error(upErr.message); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(path)
    const { error: dbErr } = await supabase.from('school_profile_media').insert({
      school_id: schoolId, media_type: 'photo', url: publicUrl, sort_order: media.length,
    })
    if (dbErr) toast.error(dbErr.message)
    else {
      toast.success('Photo added!')
      const { data } = await supabase.from('school_profile_media').select('*').eq('school_id', schoolId).order('sort_order')
      setMedia((data || []) as any)
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  // ── Add Video ─────────────────────────────────────────────
  async function addVideo() {
    if (!videoUrl.trim() || !schoolId) return
    let embedUrl = videoUrl.trim()
    // Convert YouTube watch URL to embed
    const ytMatch = embedUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
    if (ytMatch) embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`
    // Convert Vimeo to embed
    const vimeoMatch = embedUrl.match(/vimeo\.com\/(\d+)/)
    if (vimeoMatch) embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`

    const { error } = await supabase.from('school_profile_media').insert({
      school_id: schoolId, media_type: 'video', url: embedUrl, caption: videoCaption || null, sort_order: media.length,
    })
    if (error) toast.error(error.message)
    else {
      toast.success('Video added!')
      const { data } = await supabase.from('school_profile_media').select('*').eq('school_id', schoolId).order('sort_order')
      setMedia((data || []) as any)
      setVideoUrl(''); setVideoCaption('')
    }
  }

  // ── Delete Media ──────────────────────────────────────────
  async function deleteMedia(id: string) {
    const { error } = await supabase.from('school_profile_media').delete().eq('id', id)
    if (error) toast.error(error.message)
    else setMedia(m => m.filter(x => x.id !== id))
  }

  const photos = media.filter(m => m.media_type === 'photo')
  const videos = media.filter(m => m.media_type === 'video')
  const profileUrl = school?.slug ? `${window.location.origin}/@${school.slug}` : null

  return (
    <div style={{ padding: '24px 20px', maxWidth: 1024, margin: '0 auto', fontFamily: '"DM Sans", sans-serif' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');`}</style>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-main, #0f172a)', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}><Globe size={26} color="#6366f1" /> Public Profile</h1>
          <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>Control how your school appears on the Acadera directory and your public page.</p>
        </div>
        {profileUrl && (
          <a href={profileUrl} target="_blank" rel="noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 12, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
            <ExternalLink size={14} /> View Live Profile
          </a>
        )}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--bg-hover, #f1f5f9)', padding: 6, borderRadius: 16, marginBottom: 28, overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 12, border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', transition: 'all 0.2s',
              background: tab === t.id ? 'white' : 'transparent',
              color: tab === t.id ? '#6366f1' : '#64748b',
              boxShadow: tab === t.id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            }}>
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>

          {/* ─ OVERVIEW ─ */}
          {tab === 'overview' && (
            <div style={{ display: 'grid', gap: 20 }}>
              <div style={{ padding: 28, borderRadius: 20, background: 'var(--bg-card, #fff)', border: '1px solid var(--border-color, #e2e8f0)' }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 20px', color: 'var(--text-main, #0f172a)' }}>School Information</h3>
                <div style={{ display: 'grid', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>Public URL Slug</label>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ padding: '10px 14px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRight: 'none', borderRadius: '10px 0 0 10px', fontSize: 14, color: '#64748b', boxSizing: 'border-box' }}>/@</span>
                      <input type="text" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))} placeholder="e.g. estevroyalschool"
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '0 10px 10px 0', border: '1.5px solid #e2e8f0', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s', background: 'var(--bg-card)' }}
                        onFocus={e => e.currentTarget.style.borderColor = '#6366f1'}
                        onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                      />
                    </div>
                    <p style={{ fontSize: 11, color: '#64748b', marginTop: 4, marginBottom: 0 }}>This will be your school's unique web address.</p>
                  </div>
                  {[
                    { key: 'motto', label: 'School Motto', placeholder: 'e.g. Excellence in Education', type: 'text' },
                    { key: 'address', label: 'Full Address', placeholder: 'e.g. P.O. Box 123, Accra, Ghana', type: 'text' },
                    { key: 'phone', label: 'Phone Number', placeholder: '+233 20 000 0000', type: 'text' },
                    { key: 'email', label: 'Official Email', placeholder: 'info@yourschool.edu.gh', type: 'email' },
                    { key: 'tags', label: 'Tags (comma separated)', placeholder: 'e.g. WASSCE, Boarding, Sports, Music', type: 'text' },
                  ].map(({ key, label, placeholder, type }) => (
                    <div key={key}>
                      <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>{label}</label>
                      <input type={type} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                        onFocus={e => e.currentTarget.style.borderColor = '#6366f1'}
                        onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                      />
                    </div>
                  ))}
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>School Description</label>
                    <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Tell the public about your school's history, values, and achievements…" rows={4}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.6, transition: 'border-color 0.2s' }}
                      onFocus={e => e.currentTarget.style.borderColor = '#6366f1'}
                      onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                    />
                  </div>
                  <button onClick={saveOverview} disabled={saving}
                    style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8, padding: '11px 24px', borderRadius: 12, border: 'none', background: saving ? '#94a3b8' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                    <Save size={15} /> {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─ GALLERY ─ */}
          {tab === 'gallery' && (
            <div style={{ display: 'grid', gap: 20 }}>
              {/* Upload area */}
              <div style={{ padding: 24, borderRadius: 20, background: 'var(--bg-card, #fff)', border: '1px solid var(--border-color, #e2e8f0)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 4px', color: 'var(--text-main, #0f172a)' }}>Photo Gallery</h3>
                    <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>{photos.length} photo{photos.length !== 1 ? 's' : ''} uploaded</p>
                  </div>
                  <button onClick={() => fileRef.current?.click()} disabled={uploading}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 12, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 700, fontSize: 13, cursor: uploading ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
                    <Upload size={14} /> {uploading ? 'Uploading…' : 'Upload Photo'}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
                </div>

                {photos.length === 0 ? (
                  <div onClick={() => fileRef.current?.click()}
                    style={{ border: '2px dashed #e2e8f0', borderRadius: 16, padding: 60, textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#6366f1')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
                  >
                    <ImageIcon size={48} color="#cbd5e1" style={{ marginBottom: 12 }} />
                    <p style={{ fontSize: 16, fontWeight: 700, color: '#64748b', margin: '0 0 4px' }}>No photos yet</p>
                    <p style={{ fontSize: 13, color: '#94a3b8' }}>Click to upload your first photo</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                    {photos.map(p => (
                      <motion.div key={p.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        style={{ borderRadius: 14, overflow: 'hidden', position: 'relative', paddingBottom: '75%', background: '#f1f5f9' }}>
                        <img src={p.url} alt={p.caption || ''} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button onClick={() => deleteMedia(p.id)}
                          style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Trash2 size={13} />
                        </button>
                      </motion.div>
                    ))}
                    {/* Add more */}
                    <div onClick={() => fileRef.current?.click()}
                      style={{ borderRadius: 14, border: '2px dashed #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', paddingBottom: '75%', position: 'relative', background: '#fafafa', transition: 'border-color 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = '#6366f1')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
                    >
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <Plus size={24} color="#94a3b8" />
                        <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>Add Photo</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─ VIDEOS ─ */}
          {tab === 'videos' && (
            <div style={{ display: 'grid', gap: 20 }}>
              <div style={{ padding: 24, borderRadius: 20, background: 'var(--bg-card, #fff)', border: '1px solid var(--border-color, #e2e8f0)' }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 4px', color: 'var(--text-main, #0f172a)' }}>Videos</h3>
                <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 20px' }}>Paste a YouTube or Vimeo link — we'll convert it to an embed automatically.</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, marginBottom: 10 }}>
                  <input
                    value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=…"
                    style={{ padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.2s' }}
                    onFocus={e => e.currentTarget.style.borderColor = '#6366f1'}
                    onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                  />
                  <button onClick={addVideo}
                    style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Plus size={15} /> Add
                  </button>
                </div>
                <input
                  value={videoCaption} onChange={e => setVideoCaption(e.target.value)}
                  placeholder="Optional caption…"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: 24 }}
                />

                {videos.length === 0 ? (
                  <div style={{ border: '2px dashed #e2e8f0', borderRadius: 16, padding: 60, textAlign: 'center' }}>
                    <Video size={48} color="#cbd5e1" style={{ marginBottom: 12 }} />
                    <p style={{ color: '#64748b', fontWeight: 700, margin: '0 0 4px' }}>No videos yet</p>
                    <p style={{ fontSize: 13, color: '#94a3b8' }}>Add a YouTube or Vimeo link above</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                    {videos.map(v => (
                      <motion.div key={v.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        style={{ borderRadius: 14, overflow: 'hidden', background: '#0f172a', position: 'relative' }}>
                        {/* Thumbnail with play button */}
                        <div style={{ paddingBottom: '56.25%', position: 'relative', cursor: 'pointer' }} onClick={() => setPreviewVideo(v)}>
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1e1b4b, #312e81)' }}>
                            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.3)' }}>
                              <Play size={24} color="white" fill="white" style={{ marginLeft: 4 }} />
                            </div>
                          </div>
                        </div>
                        <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {v.caption || 'School Video'}
                          </span>
                          <button onClick={() => deleteMedia(v.id)}
                            style={{ border: 'none', background: 'transparent', color: '#f87171', cursor: 'pointer', padding: 4 }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─ LOCATION ─ */}
          {tab === 'location' && (
            <div style={{ padding: 28, borderRadius: 20, background: 'var(--bg-card, #fff)', border: '1px solid var(--border-color, #e2e8f0)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 4px', color: 'var(--text-main, #0f172a)' }}>📍 School Location</h3>
              <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 24px' }}>Add your GPS coordinates to show a live map on your public profile.</p>

              <div style={{ display: 'grid', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>Location Label</label>
                  <input value={form.location_label} onChange={e => setForm(f => ({ ...f, location_label: e.target.value }))} placeholder="e.g. Main Campus, Adabraka, Accra"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => e.currentTarget.style.borderColor = '#6366f1'}
                    onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>Latitude</label>
                    <input value={form.location_lat} onChange={e => setForm(f => ({ ...f, location_lat: e.target.value }))} placeholder="e.g. 5.6037"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>Longitude</label>
                    <input value={form.location_lng} onChange={e => setForm(f => ({ ...f, location_lng: e.target.value }))} placeholder="e.g. -0.1870"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>

                {/* Live Map Preview */}
                {form.location_lat && form.location_lng && (
                  <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0', height: 280 }}>
                    <iframe
                      title="Map Preview"
                      style={{ width: '100%', height: '100%', border: 'none' }}
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(form.location_lng) - 0.01},${parseFloat(form.location_lat) - 0.01},${parseFloat(form.location_lng) + 0.01},${parseFloat(form.location_lat) + 0.01}&layer=mapnik&marker=${form.location_lat},${form.location_lng}`}
                    />
                  </div>
                )}

                <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Lightbulb size={14} color="#f59e0b" /> Tip: Open <a href="https://maps.google.com" target="_blank" rel="noreferrer" style={{ color: '#6366f1' }}>Google Maps</a>, right-click your school → "What's here?" to get the coordinates.
                </p>

                <button onClick={saveLocation} disabled={saving}
                  style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8, padding: '11px 24px', borderRadius: 12, border: 'none', background: saving ? '#94a3b8' : '#6366f1', color: '#fff', fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                  <Save size={15} /> {saving ? 'Saving…' : 'Save Location'}
                </button>
              </div>
            </div>
          )}

          {/* ─ ANALYTICS ─ */}
          {tab === 'analytics' && (
            <div style={{ display: 'grid', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                <StatCard icon={Eye}   label="Total Profile Views"   value={school?.profile_views || 0}     color="#6366f1" />
                <StatCard icon={Heart} label="Total Likes Received"  value={school?.profile_likes || 0}     color="#ef4444" />
                <StatCard icon={Users} label="Total Followers"        value={school?.profile_followers || 0} color="#10b981" />
                <StatCard icon={ImageIcon} label="Photos Uploaded"   value={photos.length}                  color="#f59e0b" />
                <StatCard icon={Video} label="Videos Added"          value={videos.length}                  color="#8b5cf6" />
              </div>

              <div style={{ padding: 28, borderRadius: 20, background: 'var(--bg-card, #fff)', border: '1px solid var(--border-color, #e2e8f0)' }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 12px', color: 'var(--text-main, #0f172a)' }}>Profile Completeness</h3>
                {(() => {
                  const checks = [
                    { label: 'School description', done: !!school?.description },
                    { label: 'Profile motto', done: !!school?.motto },
                    { label: 'Contact details', done: !!(school?.phone || school?.email) },
                    { label: 'Location set', done: !!(school?.location_lat && school?.location_lng) },
                    { label: 'Gallery photos', done: photos.length > 0 },
                    { label: 'Videos added', done: videos.length > 0 },
                    { label: 'Public slug set', done: !!school?.slug },
                  ]
                  const score = Math.round((checks.filter(c => c.done).length / checks.length) * 100)
                  return (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                        <div style={{ flex: 1, height: 12, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${score}%`, background: score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#6366f1', borderRadius: 99, transition: 'width 1s ease' }} />
                        </div>
                        <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-main, #0f172a)', flexShrink: 0 }}>{score}%</span>
                      </div>
                      <div style={{ display: 'grid', gap: 8 }}>
                        {checks.map(c => (
                          <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 600, color: c.done ? '#10b981' : '#94a3b8' }}>
                            {c.done ? <CheckCircle size={18} /> : <Circle size={18} />} {c.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* ── Video Preview Modal ── */}
      <AnimatePresence>
        {previewVideo && (
          <div onClick={() => setPreviewVideo(null)} style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div onClick={e => e.stopPropagation()} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              style={{ background: '#000', borderRadius: 16, overflow: 'hidden', width: '100%', maxWidth: 800, position: 'relative' }}>
              <button onClick={() => setPreviewVideo(null)} style={{ position: 'absolute', top: 12, right: 12, zIndex: 1, border: 'none', background: 'rgba(0,0,0,0.6)', color: 'white', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>
              <div style={{ paddingBottom: '56.25%', position: 'relative' }}>
                <iframe src={previewVideo.url} title="Video Preview" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }} allowFullScreen />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
