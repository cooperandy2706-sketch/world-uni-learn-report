// src/pages/admin/SuperAdminDashboard.tsx
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { toast } from 'react-hot-toast'
import { Link } from 'react-router-dom'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'

// ─── types ────────────────────────────────────────────────
interface PlatformStats {
  totalSchools: number; pendingSchools: number
  totalTeachers: number; totalStudents: number
}
type SchoolStatus = 'pending' | 'active' | 'suspended'
interface School {
  id: string; name: string; email: string; phone: string
  address: string; motto: string; status: SchoolStatus; created_at: string
  logo_url?: string; storage_limit_gb: number; storage_used_bytes: number
}

// ─── animated counter ─────────────────────────────────────
function AnimNum({ to }: { to: number }) {
  const [val, setVal] = useState(0)
  
  useEffect(() => {
    let startVal = val
    const startTime = performance.now()
    const duration = 800

    const tick = (now: number) => {
      const p = Math.min((now - startTime) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      const current = Math.round(startVal + (to - startVal) * ease)
      setVal(current)
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [to])
  return <>{val.toLocaleString()}</>
}

// ─── Stat Card ────────────────────────────────────────────
function StatCard({ icon, label, value, color, bg, pulse }: any) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: '#fff', borderRadius: 20, padding: 24, border: `1.5px solid ${hov ? color + '40' : '#f1f5f9'}`,
        boxShadow: hov ? `0 12px 30px ${color}15` : '0 2px 8px rgba(0,0,0,0.02)',
        transition: 'all 0.3s cubic-bezier(.4,0,.2,1)', transform: hov ? 'translateY(-4px)' : 'translateY(0)',
        display: 'flex', flexDirection: 'column', gap: 16, cursor: 'default'
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 14, background: bg, color: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, position: 'relative'
      }}>
        {icon}
        {pulse && <span style={{ position: 'absolute', top: -4, right: -4, width: 12, height: 12, borderRadius: '50%', background: '#ef4444', border: '3px solid #fff', animation: '_pulse 1.5s infinite' }} />}
      </div>
      <div>
        <div style={{ fontSize: 32, fontWeight: 800, color: '#1e0646', lineHeight: 1 }}>
          <AnimNum to={value} />
        </div>
        <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, marginTop: 4, letterSpacing: '0.02em' }}>{label}</div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | SchoolStatus>('all')
  const [mounted, setMounted] = useState(false)
  const [pendingInvoices, setPendingInvoices] = useState<any[]>([])
  const [createModal, setCreateModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '', motto: '',
    adminName: '', adminEmail: '', adminPassword: ''
  })

  useEffect(() => {
    setMounted(true)
    loadPlatformData()

    const channel = supabase
      .channel('platform-mgmt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schools' }, () => {
        loadPlatformData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teachers' }, () => {
        loadPlatformData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => {
        loadPlatformData()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function loadPlatformData() {
    try {
      const [
        { data: sData, error: sErr },
        { count: tCount },
        { count: stCount }
      ] = await Promise.all([
        supabase.from('schools').select('*').order('created_at', { ascending: false }),
        supabase.from('teachers').select('*', { count: 'exact', head: true }),
        supabase.from('students').select('*', { count: 'exact', head: true }),
        supabase.from('school_invoices').select('*, school:schools(id, name)').eq('status', 'requested_approval').order('created_at', { ascending: false })
      ])

      if (sErr) throw sErr
      
      const scl = sData as School[] || []
      setSchools(scl)
      setStats({
        totalSchools: scl.length,
        pendingSchools: scl.filter(s => s.status === 'pending').length,
        totalTeachers: tCount || 0,
        totalStudents: stCount || 0
      })
      setPendingInvoices((arguments[0][3] as any)?.data || [])
    } catch (err: any) {
      toast.error('Failed to sync platform data')
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(schoolId: string, newStatus: SchoolStatus) {
    const action = newStatus === 'active' ? 'Approve' : newStatus === 'suspended' ? 'Suspend' : 'Revert'
    const confirmAction = confirm(`Are you sure you want to ${action} this school?`)
    if (!confirmAction) return

    try {
      const { error } = await supabase.from('schools').update({ status: newStatus }).eq('id', schoolId)
      if (error) throw error

      // Also activate/deactivate the school's admin users
      await supabase.from('users').update({ is_active: newStatus === 'active' }).eq('school_id', schoolId).eq('role', 'admin')

      toast.success(`School ${newStatus} successfully!`)
      // Give the DB a split second to settle before reloading platform-wide stats
      setTimeout(() => loadPlatformData(), 500)
    } catch (err: any) {
      toast.error(err.message || 'Operation failed')
    }
  }

  async function approveInvoice(invoiceId: string, schoolId: string) {
    if (!confirm('Have you confirmed receipt of this Mobile Money payment?')) return
    
    try {
      const { error } = await supabase.from('school_invoices').update({ status: 'paid' }).eq('id', invoiceId)
      if (error) throw error
      
      // Also set the school to active if it was pending
      const { data: school } = await supabase.from('schools').select('status').eq('id', schoolId).single()
      if (school && school.status === 'pending') {
        await supabase.from('schools').update({ status: 'active' }).eq('id', schoolId)
        await supabase.from('users').update({ is_active: true }).eq('school_id', schoolId).eq('role', 'admin')
      }

      toast.success('Payment approved and school activated!')
      loadPlatformData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve payment')
    }
  }

  async function handleUpdateStorage(schoolId: string, newLimit: string) {
    const limit = parseFloat(newLimit)
    if (isNaN(limit) || limit < 0) return

    try {
      const { error } = await supabase.from('schools').update({ storage_limit_gb: limit }).eq('id', schoolId)
      if (error) throw error
      toast.success('Storage limit updated!')
      loadPlatformData()
    } catch (err: any) {
      toast.error('Update failed')
    }
  }

  async function handleCreateSchool() {
    if (!form.name || !form.adminEmail || !form.adminPassword) {
      toast.error('School name, admin email and password are required')
      return
    }

    setSaving(true)
    try {
      // Create School and Admin via Edge Function (avoids changing current session and bypasses RLS)
      const { data: opData, error: opErr } = await supabase.functions.invoke('admin-ops', {
        body: {
          action: 'create-school-with-admin',
          payload: {
            school: {
              name: form.name,
              email: form.email,
              phone: form.phone,
              address: form.address,
              motto: form.motto,
              status: 'active'
            },
            admin: {
              email: form.adminEmail,
              password: form.adminPassword,
              full_name: form.adminName
            }
          }
        }
      })

      if (opErr || opData?.error) {
        throw new Error(opData?.error || opErr?.message || 'Failed to create school and admin user')
      }

      toast.success('School and Admin created successfully!')
      setCreateModal(false)
      setForm({ name: '', email: '', phone: '', address: '', motto: '', adminName: '', adminEmail: '', adminPassword: '' })
      loadPlatformData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create school')
    } finally {
      setSaving(false)
    }
  }

  const filteredSchools = schools.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'all' || s.status === filter
    return matchesSearch && matchesFilter
  })

  return (
    <div style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.6s ease', padding: '40px 32px', maxWidth: 1280, margin: '0 auto', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes _pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
        @keyframes _fade { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .row-animate { animation: _fade 0.4s cubic-bezier(.4,0,.2,1) both; }
        .status-tab:hover { background: #f1f5f9; }
        .school-row:hover { background: #f8fafc; }
      `}</style>

      {/* Header */}
      <header style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #f1f5f9', paddingBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ padding: '4px 10px', borderRadius: 99, background: '#ecfdf5', color: '#10b981', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              System Command
            </span>
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: '#1e0646', letterSpacing: '-0.04em' }}>Platform Overview</h1>
          <p style={{ color: '#64748b', fontSize: 16, marginTop: 4 }}>Real-time sync active across all registered schools and users.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            onClick={() => {
              setLoading(true)
              loadPlatformData()
            }} 
            style={{ 
              padding: '12px 24px', borderRadius: 14, border: '1.5px solid #e2e8f0', 
              background: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
          >
            <span>🔄</span> Force Sync
          </button>
          <Button onClick={() => setCreateModal(true)}>
            <span>➕</span> Register New School
          </Button>
        </div>
      </header>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginBottom: 48 }}>
        <StatCard icon="🏫" label="Total Schools" value={stats?.totalSchools || 0} color="#6d28d9" bg="#f5f3ff" />
        <StatCard icon="⏳" label="Pending Approvals" value={stats?.pendingSchools || 0} color="#f59e0b" bg="#fffbeb" pulse={(stats?.pendingSchools || 0) > 0} />
        <StatCard icon="👨‍🏫" label="Total Teachers" value={stats?.totalTeachers || 0} color="#0891b2" bg="#ecfeff" />
        <StatCard icon="🎓" label="Total Students" value={stats?.totalStudents || 0} color="#059669" bg="#f0fdf4" />
      </div>

      {/* Pending Billing Approvals */}
      {pendingInvoices.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 24, border: '1px solid #fde68a', boxShadow: '0 4px 24px rgba(245,158,11,0.05)', overflow: 'hidden', marginBottom: 48 }}>
          <div style={{ padding: '24px 32px', borderBottom: '1.5px solid #fef3c7', background: '#fffbeb', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>💳</span>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#92400e', margin: 0 }}>Pending Billing Approvals</h2>
              <p style={{ fontSize: 13, color: '#b45309', margin: '4px 0 0' }}>These schools have reported sending Mobile Money payments.</p>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 120px', padding: '16px 32px', background: '#fcfcfd', borderBottom: '1px solid #f1f5f9', fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <div>School</div>
            <div>Invoice Date</div>
            <div>Amount</div>
            <div style={{ textAlign: 'right' }}>Action</div>
          </div>
          
          <div>
            {pendingInvoices.map((inv, i) => (
              <div key={inv.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 120px', padding: '20px 32px', borderBottom: i < pendingInvoices.length - 1 ? '1px solid #f1f5f9' : 'none', alignItems: 'center' }}>
                <div style={{ fontWeight: 700, color: '#1e0646' }}>{inv.school?.name || 'Unknown School'}</div>
                <div style={{ color: '#64748b', fontSize: 14 }}>{new Date(inv.created_at).toLocaleDateString()}</div>
                <div style={{ fontWeight: 800, color: '#1e0646', fontSize: 15 }}>GHS {inv.amount}</div>
                <div style={{ textAlign: 'right' }}>
                  <button onClick={() => approveInvoice(inv.id, inv.school_id)} style={{ background: '#10b981', color: '#fff', padding: '8px 16px', borderRadius: 8, border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Management Area */}
      <div style={{ background: '#fff', borderRadius: 24, border: '1px solid #f1f5f9', boxShadow: '0 4px 24px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
        {/* Filters & Search */}
        <div style={{ padding: '24px 32px', borderBottom: '1.5px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ display: 'flex', background: '#f8fafc', padding: 4, borderRadius: 12, border: '1px solid #f1f5f9' }}>
            {(['all', 'pending', 'active', 'suspended'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '8px 16px', borderRadius: 10, border: 'none',
                  background: filter === f ? '#fff' : 'transparent',
                  color: filter === f ? '#1e0646' : '#64748b',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  boxShadow: filter === f ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.2s', textTransform: 'capitalize'
                }}
              >
                {f}
              </button>
            ))}
          </div>
          <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>🔍</span>
            <input
              type="text"
              placeholder="Search schools..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '12px 16px 12px 40px', borderRadius: 12, border: '1.5px solid #f1f5f9', fontSize: 14, outline: 'none', transition: 'border-color 0.2s' }}
              onFocus={e => e.target.style.borderColor = '#6d28d9'}
              onBlur={e => e.target.style.borderColor = '#f1f5f9'}
            />
          </div>
        </div>

        {/* Table Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 120px 160px', padding: '16px 32px', background: '#fcfcfd', borderBottom: '1px solid #f1f5f9', fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          <div>School Identity</div>
          <div>Contact Info</div>
          <div>Status</div>
          <div>Data Storage</div>
          <div>Registration</div>
          <div style={{ textAlign: 'right' }}>Actions</div>
        </div>

        {/* School List */}
        <div style={{ minHeight: 400 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '100px 0', color: '#94a3b8' }}>Syncing platform...</div>
          ) : filteredSchools.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🍃</div>
              <p style={{ color: '#94a3b8', fontSize: 15 }}>No schools found matching your current filters.</p>
            </div>
          ) : (
            filteredSchools.map((school, i) => (
              <div
                key={school.id}
                className="school-row row-animate"
                style={{
                  display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 120px 160px', padding: '24px 32px',
                  borderBottom: i < filteredSchools.length - 1 ? '1.5px solid #f8fafc' : 'none',
                  alignItems: 'center', transition: 'background 0.2s', animationDelay: `${i * 0.05}s`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {school.logo_url ? (
                    <img
                      src={school.logo_url}
                      alt={school.name}
                      style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover', border: '1.5px solid #f1f5f9' }}
                    />
                  ) : (
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #1e0646, #5b21b6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800 }}>
                      {school.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e0646', marginBottom: 4 }}>{school.name}</h3>
                    <p style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>ID: {school.id}</p>
                  </div>
                </div>

                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
                  <p>📧 {school.email || 'N/A'}</p>
                  <p>📞 {school.phone || 'N/A'}</p>
                </div>

                <div>
                   <span style={{
                     padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em',
                     background: school.status === 'active' ? '#f0fdf4' : school.status === 'pending' ? '#fffbeb' : '#fef2f2',
                     color: school.status === 'active' ? '#16a34a' : school.status === 'pending' ? '#d97706' : '#dc2626',
                     border: `1px solid ${school.status === 'active' ? '#bcf0da' : school.status === 'pending' ? '#fef3c7' : '#fecaca'}`
                   }}>
                     {school.status}
                   </span>
                </div>

                <div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input 
                        type="number"
                        defaultValue={school.storage_limit_gb}
                        onBlur={(e) => handleUpdateStorage(school.id, e.target.value)}
                        style={{ width: 60, padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 13, fontWeight: 700 }}
                      />
                      <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>GB</span>
                   </div>
                   <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
                      Used: {((school.storage_used_bytes || 0) / (1024**3)).toFixed(3)} GB
                   </div>
                </div>

                <div style={{ fontSize: 13, color: '#64748b' }}>
                  {new Date(school.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  {school.status === 'pending' ? (
                    <button
                      onClick={() => updateStatus(school.id, 'active')}
                      style={{ padding: '8px 16px', borderRadius: 9, border: 'none', background: '#22c55e', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer', boxShadow: '0 4px 12px rgba(34,197,94,0.2)' }}
                    >Approve</button>
                  ) : school.status === 'active' ? (
                    <button
                      onClick={() => updateStatus(school.id, 'suspended')}
                      style={{ padding: '8px 16px', borderRadius: 9, border: '1.5px solid #fee2e2', background: '#fff', color: '#dc2626', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                    >Suspend</button>
                  ) : (
                    <button
                      onClick={() => updateStatus(school.id, 'active')}
                      style={{ padding: '8px 16px', borderRadius: 9, border: 'none', background: '#6d28d9', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                    >Activate</button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <p style={{ textAlign: 'center', marginTop: 40, fontSize: 13, color: '#94a3b8' }}>
        World Uni-Learn Platform Management Dashboard v1.0
      </p>

      <Modal
        open={createModal}
        onClose={() => setCreateModal(false)}
        title="Register New School"
        subtitle="Create a new school and its administrator"
        size="lg"
        footer={(
          <>
            <Button variant="secondary" onClick={() => setCreateModal(false)}>Cancel</Button>
            <Button onClick={handleCreateSchool} loading={saving}>Create School</Button>
          </>
        )}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <section>
            <h4 style={{ fontSize: 13, color: '#6d28d9', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>School Details</h4>
            <div style={{ display: 'grid', gap: 14 }}>
              <Input label="School Name" value={form.name} onChange={v => setForm(f => ({...f, name:v}))} />
              <Input label="School Email" value={form.email} onChange={v => setForm(f => ({...f, email:v}))} />
              <Input label="School Phone" value={form.phone} onChange={v => setForm(f => ({...f, phone:v}))} />
              <Input label="Address" value={form.address} onChange={v => setForm(f => ({...f, address:v}))} />
              <Input label="Motto" value={form.motto} onChange={v => setForm(f => ({...f, motto:v}))} />
            </div>
          </section>
          <section style={{ borderLeft: '1px solid #f1f5f9', paddingLeft: 24 }}>
            <h4 style={{ fontSize: 13, color: '#6d28d9', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Administrator Details</h4>
            <div style={{ display: 'grid', gap: 14 }}>
              <Input label="Admin Full Name" value={form.adminName} onChange={v => setForm(f => ({...f, adminName:v}))} />
              <Input label="Admin Email" type="email" value={form.adminEmail} onChange={v => setForm(f => ({...f, adminEmail:v}))} />
              <Input label="Admin Password" type="password" value={form.adminPassword} onChange={v => setForm(f => ({...f, adminPassword:v}))} />
              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 10, fontStyle: 'italic' }}>
                Note: This will create an active school and an active administrator account immediately.
              </p>
            </div>
          </section>
        </div>
      </Modal>
    </div>
  )
}

function Input({ label, value, onChange, type = 'text' }: any) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #f1f5f9',
          fontSize: 14, outline: 'none', transition: 'all 0.2s', fontFamily: 'inherit'
        }}
        onFocus={e => { e.target.style.borderColor = '#6d28d9'; e.target.style.boxShadow = '0 0 0 4px rgba(109,40,217,0.1)' }}
        onBlur={e => { e.target.style.borderColor = '#f1f5f9'; e.target.style.boxShadow = 'none' }}
      />
    </div>
  )
}
