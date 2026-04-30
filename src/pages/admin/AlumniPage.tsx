import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import Modal from '../../components/ui/Modal'
import toast from 'react-hot-toast'
import { 
  Users, Calendar, Heart, Plus, Search, Trash2, 
  ExternalLink, GraduationCap, Building2, Briefcase,
  TrendingUp, DollarSign, Clock, MapPin
} from 'lucide-react'
import { format } from 'date-fns'

function Btn({ children, onClick, variant = 'primary', disabled, loading, style }: any) {
  const [h, setH] = useState(false)
  const v: any = {
    primary: { background: h ? '#5b21b6' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', border: 'none' },
    secondary: { background: h ? '#f5f3ff' : '#fff', color: '#374151', border: '1.5px solid #e5e7eb' },
    danger: { background: h ? '#b91c1c' : '#dc2626', color: '#fff', border: 'none' },
  }
  return (
    <button onClick={onClick} disabled={disabled} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all .15s', opacity: disabled ? 0.6 : 1, fontFamily: '"DM Sans",sans-serif', ...v[variant], ...style }}>
      {loading && <span style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', animation: '_al_spin .7s linear infinite', flexShrink: 0 }} />}
      {children}
    </button>
  )
}

export default function AlumniPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const schoolId = user?.school_id ?? ''

  const [tab, setTab] = useState<'directory' | 'events' | 'fundraising'>('directory')
  const [search, setSearch] = useState('')
  
  // Modals
  const [alumniModal, setAlumniModal] = useState(false)
  const [eventModal, setEventModal] = useState(false)
  const [campaignModal, setCampaignModal] = useState(false)
  const [donationModal, setDonationModal] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null)

  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>({})

  // Queries
  const { data: alumni = [], isLoading: loadingAlumni } = useQuery({
    queryKey: ['alumni', schoolId],
    queryFn: async () => {
      const { data } = await supabase.from('alumni').select('*').eq('school_id', schoolId).order('graduation_year', { ascending: false })
      return data ?? []
    },
    enabled: !!schoolId && tab === 'directory'
  })

  const { data: events = [], isLoading: loadingEvents } = useQuery({
    queryKey: ['alumni_events', schoolId],
    queryFn: async () => {
      const { data } = await supabase.from('alumni_events').select('*').eq('school_id', schoolId).order('event_date', { ascending: false })
      return data ?? []
    },
    enabled: !!schoolId && tab === 'events'
  })

  const { data: campaigns = [], isLoading: loadingCampaigns } = useQuery({
    queryKey: ['fundraising_campaigns', schoolId],
    queryFn: async () => {
      const { data } = await supabase.from('fundraising_campaigns').select('*').eq('school_id', schoolId).order('created_at', { ascending: false })
      return data ?? []
    },
    enabled: !!schoolId && tab === 'fundraising'
  })

  // Handlers
  async function handleCreateAlumni() {
    if (!form.full_name) return toast.error('Name required')
    setSaving(true)
    try {
      const { error } = await supabase.from('alumni').insert([{ ...form, school_id: schoolId }])
      if (error) throw error
      toast.success('Alumni record added')
      qc.invalidateQueries({ queryKey: ['alumni'] })
      setAlumniModal(false); setForm({})
    } catch (e: any) { toast.error(e.message) } finally { setSaving(false) }
  }

  async function handleCreateEvent() {
    if (!form.title || !form.event_date) return toast.error('Title and date required')
    setSaving(true)
    try {
      const { error } = await supabase.from('alumni_events').insert([{ ...form, school_id: schoolId }])
      if (error) throw error
      toast.success('Event scheduled')
      qc.invalidateQueries({ queryKey: ['alumni_events'] })
      setEventModal(false); setForm({})
    } catch (e: any) { toast.error(e.message) } finally { setSaving(false) }
  }

  async function handleCreateCampaign() {
    if (!form.title || !form.goal_amount) return toast.error('Title and goal required')
    setSaving(true)
    try {
      const { error } = await supabase.from('fundraising_campaigns').insert([{ ...form, school_id: schoolId }])
      if (error) throw error
      toast.success('Campaign launched')
      qc.invalidateQueries({ queryKey: ['fundraising_campaigns'] })
      setCampaignModal(false); setForm({})
    } catch (e: any) { toast.error(e.message) } finally { setSaving(false) }
  }

  async function handleLogDonation() {
    if (!form.amount || !form.donor_name) return toast.error('Amount and donor name required')
    setSaving(true)
    try {
      // 1. Insert donation
      const { error: dErr } = await supabase.from('donations').insert([{ ...form, campaign_id: selectedCampaign.id, school_id: schoolId }])
      if (dErr) throw dErr
      
      // 2. Update campaign current_amount
      const { error: uErr } = await supabase.rpc('increment_campaign_total', { 
        campaign_id: selectedCampaign.id, 
        amount: parseFloat(form.amount) 
      })
      // If RPC fails (not yet created), fallback to manual update
      if (uErr) {
        const { error: mErr } = await supabase.from('fundraising_campaigns')
          .update({ current_amount: (selectedCampaign.current_amount || 0) + parseFloat(form.amount) })
          .eq('id', selectedCampaign.id)
        if (mErr) throw mErr
      }

      toast.success('Donation logged')
      qc.invalidateQueries({ queryKey: ['fundraising_campaigns'] })
      setDonationModal(false); setForm({})
    } catch (e: any) { toast.error(e.message) } finally { setSaving(false) }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');
        @keyframes _al_spin { to{transform:rotate(360deg)} }
        @keyframes _al_fi { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .al-card { transition: all 0.2s; }
        .al-card:hover { transform: translateY(-3px); box-shadow: 0 10px 25px rgba(0,0,0,0.1) !important; }
        .tab-btn { padding: 10px 20px; border: none; background: transparent; color: #64748b; font-size: 14, font-weight: 600; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; }
        .tab-btn.active { color: #7c3aed; border-bottom-color: #7c3aed; }
      `}</style>

      <div style={{ fontFamily: '"DM Sans",system-ui,sans-serif', animation: '_al_fi .4s ease' }}>
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>Alumni & Fundraising Hub</h1>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 3 }}>Manage your school's global community and development projects</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {tab === 'directory' && <Btn onClick={() => { setForm({}); setAlumniModal(true) }}><Plus size={14} /> Add Alumnus</Btn>}
            {tab === 'events' && <Btn onClick={() => { setForm({}); setEventModal(true) }}><Calendar size={14} /> Create Event</Btn>}
            {tab === 'fundraising' && <Btn onClick={() => { setForm({}); setCampaignModal(true) }}><TrendingUp size={14} /> New Campaign</Btn>}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1.5px solid #f1f5f9', marginBottom: 24 }}>
          <button className={`tab-btn ${tab === 'directory' ? 'active' : ''}`} onClick={() => setTab('directory')}>Directory</button>
          <button className={`tab-btn ${tab === 'events' ? 'active' : ''}`} onClick={() => setTab('events')}>Events</button>
          <button className={`tab-btn ${tab === 'fundraising' ? 'active' : ''}`} onClick={() => setTab('fundraising')}>Fundraising</button>
        </div>

        {/* Search */}
        {tab === 'directory' && (
          <div style={{ position: 'relative', marginBottom: 24 }}>
            <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search graduates by name, year, or organization..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '12px 16px 12px 42px', borderRadius: 14, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none' }}
            />
          </div>
        )}

        {/* Directory Tab */}
        {tab === 'directory' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {alumni.filter(a => a.full_name.toLowerCase().includes(search.toLowerCase())).map((a: any) => (
              <div key={a.id} className="al-card" style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #f1f5f9', padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
                    <GraduationCap size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{a.full_name}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Class of {a.graduation_year}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
                  <div style={{ fontSize: 13, color: '#374151', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Briefcase size={14} color="#94a3b8" /> {a.current_occupation || 'Occupation not set'}
                  </div>
                  <div style={{ fontSize: 13, color: '#374151', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Building2 size={14} color="#94a3b8" /> {a.current_organization || 'Organization not set'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, borderTop: '1px solid #f9fafb', paddingTop: 16 }}>
                  {a.linkedin_url && (
                    <a href={a.linkedin_url} target="_blank" rel="noreferrer" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px', borderRadius: 10, background: '#f0f9ff', color: '#0369a1', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                      <ExternalLink size={14} /> Profile
                    </a>
                  )}
                  <button onClick={() => { if(confirm('Remove record?')) supabase.from('alumni').delete().eq('id', a.id).then(() => qc.invalidateQueries({queryKey:['alumni']})) }}
                    style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #fecaca', background: 'transparent', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Events Tab */}
        {tab === 'events' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
            {events.map((e: any) => (
              <div key={e.id} className="al-card" style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #f1f5f9', padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{format(new Date(e.event_date), 'MMMM yyyy')}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: '0 0 12px' }}>{e.title}</h3>
                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, marginBottom: 20 }}>{e.description}</p>
                <div style={{ display: 'grid', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#374151' }}>
                    <Clock size={16} color="#94a3b8" /> {format(new Date(e.event_date), 'p')} · {format(new Date(e.event_date), 'PPP')}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#374151' }}>
                    <MapPin size={16} color="#94a3b8" /> {e.location || 'Online / TBD'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Fundraising Tab */}
        {tab === 'fundraising' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 24 }}>
            {campaigns.map((c: any) => {
              const progress = Math.min((c.current_amount / c.goal_amount) * 100, 100)
              return (
                <div key={c.id} className="al-card" style={{ background: '#fff', borderRadius: 24, border: '1.5px solid #f1f5f9', padding: 28, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <h3 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>{c.title}</h3>
                    <span style={{ fontSize: 10, fontWeight: 800, background: c.is_active ? '#f0fdf4' : '#f1f5f9', color: c.is_active ? '#16a34a' : '#64748b', padding: '4px 10px', borderRadius: 99, textTransform: 'uppercase' }}>
                      {c.is_active ? 'Active' : 'Closed'}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, marginBottom: 24 }}>{c.description}</p>
                  
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, fontWeight: 700 }}>
                      <span style={{ color: '#111827' }}>${c.current_amount.toLocaleString()} raised</span>
                      <span style={{ color: '#6b7280' }}>Goal: ${c.goal_amount.toLocaleString()}</span>
                    </div>
                    <div style={{ width: '100%', height: 10, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #7c3aed, #a78bfa)', borderRadius: 99, transition: 'width 1s ease-out' }} />
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 12, color: '#7c3aed', fontWeight: 800, marginTop: 6 }}>{Math.round(progress)}% Complete</div>
                  </div>

                  <Btn onClick={() => { setSelectedCampaign(c); setForm({ amount: '', donor_name: '' }); setDonationModal(true) }} style={{ width: '100%' }}>
                    <Heart size={14} /> Log Donation
                  </Btn>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <Modal open={alumniModal} onClose={() => setAlumniModal(false)} title="Add Graduate" subtitle="Record details of a new school alumnus" size="sm"
        footer={<><Btn variant="secondary" onClick={() => setAlumniModal(false)}>Cancel</Btn><Btn onClick={handleCreateAlumni} loading={saving}>Add to Directory</Btn></>}>
        <div style={{ display: 'grid', gap: 14 }}>
          <Input label="Full Name *" value={form.full_name} onChange={(v:string) => setForm((p:any) => ({...p, full_name:v}))} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Graduation Year" type="number" value={form.graduation_year} onChange={(v:string) => setForm((p:any) => ({...p, graduation_year:parseInt(v)}))} />
            <Input label="Phone" value={form.phone} onChange={(v:string) => setForm((p:any) => ({...p, phone:v}))} />
          </div>
          <Input label="Email" type="email" value={form.email} onChange={(v:string) => setForm((p:any) => ({...p, email:v}))} />
          <Input label="Occupation" value={form.current_occupation} onChange={(v:string) => setForm((p:any) => ({...p, current_occupation:v}))} />
          <Input label="Organization" value={form.current_organization} onChange={(v:string) => setForm((p:any) => ({...p, current_organization:v}))} />
          <Input label="LinkedIn URL" value={form.linkedin_url} onChange={(v:string) => setForm((p:any) => ({...p, linkedin_url:v}))} />
        </div>
      </Modal>

      <Modal open={eventModal} onClose={() => setEventModal(false)} title="Schedule Event" subtitle="Reunions, mixers, or homecoming events" size="sm"
        footer={<><Btn variant="secondary" onClick={() => setEventModal(false)}>Cancel</Btn><Btn onClick={handleCreateEvent} loading={saving}>Schedule Event</Btn></>}>
        <div style={{ display: 'grid', gap: 14 }}>
          <Input label="Event Title *" value={form.title} onChange={(v:string) => setForm((p:any) => ({...p, title:v}))} />
          <Input label="Date & Time *" type="datetime-local" value={form.event_date} onChange={(v:string) => setForm((p:any) => ({...p, event_date:v}))} />
          <Input label="Location" value={form.location} onChange={(v:string) => setForm((p:any) => ({...p, location:v}))} />
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 5 }}>Description</label>
            <textarea value={form.description} onChange={e => setForm((p:any) => ({...p, description:e.target.value}))}
              style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 13, minHeight: 80, outline: 'none' }} />
          </div>
        </div>
      </Modal>

      <Modal open={campaignModal} onClose={() => setCampaignModal(false)} title="New Fundraising Campaign" subtitle="Set a goal for school development" size="sm"
        footer={<><Btn variant="secondary" onClick={() => setCampaignModal(false)}>Cancel</Btn><Btn onClick={handleCreateCampaign} loading={saving}>Launch Campaign</Btn></>}>
        <div style={{ display: 'grid', gap: 14 }}>
          <Input label="Campaign Title *" value={form.title} onChange={(v:string) => setForm((p:any) => ({...p, title:v}))} />
          <Input label="Goal Amount ($) *" type="number" value={form.goal_amount} onChange={(v:string) => setForm((p:any) => ({...p, goal_amount:parseFloat(v)}))} />
          <Input label="End Date" type="date" value={form.end_date} onChange={(v:string) => setForm((p:any) => ({...p, end_date:v}))} />
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 5 }}>Project Description</label>
            <textarea value={form.description} onChange={e => setForm((p:any) => ({...p, description:e.target.value}))}
              style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 13, minHeight: 80, outline: 'none' }} />
          </div>
        </div>
      </Modal>

      <Modal open={donationModal} onClose={() => setDonationModal(false)} title="Log Donation" subtitle={selectedCampaign?.title} size="sm"
        footer={<><Btn variant="secondary" onClick={() => setDonationModal(false)}>Cancel</Btn><Btn onClick={handleLogDonation} loading={saving}>Log Donation</Btn></>}>
        <div style={{ display: 'grid', gap: 14 }}>
          <Input label="Donor Name *" value={form.donor_name} onChange={(v:string) => setForm((p:any) => ({...p, donor_name:v}))} />
          <Input label="Amount ($) *" type="number" value={form.amount} onChange={(v:string) => setForm((p:any) => ({...p, amount:v}))} />
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 5 }}>Notes (Optional)</label>
            <textarea value={form.notes} onChange={e => setForm((p:any) => ({...p, notes:e.target.value}))}
              style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 13, minHeight: 60, outline: 'none' }} />
          </div>
        </div>
      </Modal>
    </>
  )
}

function Input({ label, value, onChange, type = 'text' }: any) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 5 }}>{label}</label>
      <input type={type} value={value || ''} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
    </div>
  )
}
