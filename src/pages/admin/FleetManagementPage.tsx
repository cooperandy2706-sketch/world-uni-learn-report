import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { Plus, Bus, MapPin, Edit2, Trash2, Users, Wrench } from 'lucide-react'
import toast from 'react-hot-toast'
import type { TransportVehicle, TransportRoute } from '../../types/database.types'

export default function FleetManagementPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'vehicles' | 'routes' | 'assignments' | 'maintenance'>('vehicles')
  
  const [vehicles, setVehicles] = useState<TransportVehicle[]>([])
  const [routes, setRoutes] = useState<TransportRoute[]>([])
  const [drivers, setDrivers] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [maintenanceLogs, setMaintenanceLogs] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Modals
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false)
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  
  // Forms
  const [vForm, setVForm] = useState({ plate_number: '', make_model: '', capacity: 15, driver_id: '' })
  const [rForm, setRForm] = useState({ name: '', description: '', fee_amount: 0 })
  const [aForm, setAForm] = useState({ student_ids: [] as string[], route_id: '', vehicle_id: '', pickup_location: '', dropoff_location: '' })
  const [assignClassFilter, setAssignClassFilter] = useState('')

  useEffect(() => {
    if (user?.school_id) loadData()
  }, [user?.school_id])

  async function loadData() {
    setLoading(true)
    const sid = user!.school_id
    
    // Fetch Vehicles
    const { data: vData } = await supabase
      .from('transport_vehicles')
      .select('*')
      .eq('school_id', sid)
      .order('created_at', { ascending: false })
      
    // Fetch Routes
    const { data: rData } = await supabase
      .from('transport_routes')
      .select('*')
      .eq('school_id', sid)
      .order('created_at', { ascending: false })
      
    // Fetch Drivers
    const { data: dData } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('school_id', sid)
      .eq('role', 'driver')

    // Fetch Assignments
    const { data: aData } = await supabase
      .from('transport_student_assignments')
      .select('id, pickup_location, dropoff_location, student:students(full_name, class:classes(name)), route:transport_routes(name), vehicle:transport_vehicles(plate_number)')
      .eq('school_id', sid)

    // Fetch Students (for assignment dropdown)
    const { data: sData } = await supabase
      .from('students')
      .select('id, full_name, class:classes(name)')
      .eq('school_id', sid)
      .order('full_name')

    // Fetch Maintenance Logs
    const { data: mData } = await supabase
      .from('transport_maintenance_logs')
      .select('*, vehicle:transport_vehicles(plate_number), driver:users(full_name)')
      .eq('school_id', sid)
      .order('created_at', { ascending: false })

    setVehicles(vData || [])
    setRoutes(rData || [])
    setDrivers(dData || [])
    setAssignments(aData || [])
    setMaintenanceLogs(mData || [])
    setStudents(sData || [])
    setLoading(false)
  }

  async function handleSaveVehicle(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.from('transport_vehicles').insert({
      school_id: user!.school_id,
      plate_number: vForm.plate_number,
      make_model: vForm.make_model,
      capacity: vForm.capacity,
      driver_id: vForm.driver_id || null,
    })
    if (error) return toast.error(error.message)
    toast.success('Vehicle added successfully!')
    setIsVehicleModalOpen(false)
    setVForm({ plate_number: '', make_model: '', capacity: 15, driver_id: '' })
    loadData()
  }

  async function handleSaveRoute(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.from('transport_routes').insert({
      school_id: user!.school_id,
      name: rForm.name,
      description: rForm.description,
      fee_amount: rForm.fee_amount,
    })
    if (error) return toast.error(error.message)
    toast.success('Route added successfully!')
    setIsRouteModalOpen(false)
    setRForm({ name: '', description: '', fee_amount: 0 })
    loadData()
  }

  async function handleSaveAssignment(e: React.FormEvent) {
    e.preventDefault()
    if (aForm.student_ids.length === 0) return toast.error('Please select at least one student.')

    const inserts = aForm.student_ids.map(id => ({
      school_id: user!.school_id,
      student_id: id,
      route_id: aForm.route_id,
      vehicle_id: aForm.vehicle_id || null,
      pickup_location: aForm.pickup_location,
      dropoff_location: aForm.dropoff_location,
    }))

    const { error } = await supabase.from('transport_student_assignments').insert(inserts)
    if (error) {
      if (error.code === '23505') return toast.error('One or more students are already assigned to a route.')
      return toast.error(error.message)
    }
    toast.success(`${aForm.student_ids.length} student(s) assigned to transport!`)
    setIsAssignModalOpen(false)
    setAForm({ student_ids: [], route_id: '', vehicle_id: '', pickup_location: '', dropoff_location: '' })
    setAssignClassFilter('')
    loadData()
  }

  async function deleteVehicle(id: string) {
    if (!confirm('Are you sure you want to delete this vehicle?')) return
    await supabase.from('transport_vehicles').delete().eq('id', id)
    toast.success('Vehicle deleted')
    loadData()
  }

  async function deleteRoute(id: string) {
    if (!confirm('Are you sure you want to delete this route?')) return
    await supabase.from('transport_routes').delete().eq('id', id)
    toast.success('Route deleted')
    loadData()
  }

  async function deleteAssignment(id: string) {
    if (!confirm('Remove this student from transport?')) return
    await supabase.from('transport_student_assignments').delete().eq('id', id)
    toast.success('Assignment removed')
    loadData()
  }

  async function resolveMaintenance(id: string) {
    if (!confirm('Mark this issue as resolved?')) return
    await supabase.from('transport_maintenance_logs').update({ status: 'resolved' }).eq('id', id)
    toast.success('Issue marked resolved')
    loadData()
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading Fleet Data...</div>

  return (
    <div style={{ padding: '0 40px', maxWidth: 1200, margin: '0 auto', fontFamily: '"DM Sans", sans-serif' }}>
      
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          {activeTab === 'assignments' ? (
            <button 
              onClick={() => setIsAssignModalOpen(true)}
              style={{ padding: '10px 20px', borderRadius: 10, background: '#1d4ed8', color: '#fff', border: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
            >
              <Users size={18} /> Assign Student
            </button>
          ) : (
            <>
              <button 
                onClick={() => setIsRouteModalOpen(true)}
                style={{ padding: '10px 20px', borderRadius: 10, background: '#f3f4f6', color: '#374151', border: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
              >
                <MapPin size={18} /> New Route
              </button>
              <button 
                onClick={() => setIsVehicleModalOpen(true)}
                style={{ padding: '10px 20px', borderRadius: 10, background: '#1d4ed8', color: '#fff', border: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
              >
                <Plus size={18} /> Add Vehicle
              </button>
            </>
          )}
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid #e2e8f0' }}>
        <button 
          onClick={() => setActiveTab('vehicles')}
          style={{ padding: '12px 24px', border: 'none', background: 'transparent', fontWeight: 700, fontSize: 15, color: activeTab === 'vehicles' ? '#1d4ed8' : '#64748b', borderBottom: activeTab === 'vehicles' ? '3px solid #1d4ed8' : '3px solid transparent', cursor: 'pointer' }}
        >
          Vehicles
        </button>
        <button 
          onClick={() => setActiveTab('routes')}
          style={{ padding: '12px 24px', border: 'none', background: 'transparent', fontWeight: 700, fontSize: 15, color: activeTab === 'routes' ? '#1d4ed8' : '#64748b', borderBottom: activeTab === 'routes' ? '3px solid #1d4ed8' : '3px solid transparent', cursor: 'pointer' }}
        >
          Routes & Destinations
        </button>
        <button 
          onClick={() => setActiveTab('assignments')}
          style={{ padding: '12px 24px', border: 'none', background: 'transparent', fontWeight: 700, fontSize: 15, color: activeTab === 'assignments' ? '#1d4ed8' : '#64748b', borderBottom: activeTab === 'assignments' ? '3px solid #1d4ed8' : '3px solid transparent', cursor: 'pointer' }}
        >
          Student Assignments
        </button>
        <button 
          onClick={() => setActiveTab('maintenance')}
          style={{ padding: '12px 24px', border: 'none', background: 'transparent', fontWeight: 700, fontSize: 15, color: activeTab === 'maintenance' ? '#1d4ed8' : '#64748b', borderBottom: activeTab === 'maintenance' ? '3px solid #1d4ed8' : '3px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Wrench size={16} /> Maintenance
        </button>
      </div>

      {/* VEHICLES TAB */}
      {activeTab === 'vehicles' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {vehicles.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: 40, textAlign: 'center', background: '#f8fafc', borderRadius: 16, border: '2px dashed #cbd5e1', color: '#64748b' }}>
              No vehicles found. Add your first school bus!
            </div>
          ) : vehicles.map(v => (
            <div key={v.id} style={{ background: '#fff', padding: 24, borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bus size={24} />
                </div>
                <button onClick={() => deleteVehicle(v.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}>
                  <Trash2 size={18} />
                </button>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 4 }}>{v.plate_number}</div>
              <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500, marginBottom: 16 }}>{v.make_model || 'Standard Bus'} • {v.capacity} Seats</div>
              
              <div style={{ padding: 12, background: '#f8fafc', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Users size={16} color="#64748b" />
                <span style={{ fontSize: 13, fontWeight: 600, color: v.driver_id ? '#1e293b' : '#94a3b8' }}>
                  {v.driver_id ? `Assigned to: ${drivers.find(d => d.id === v.driver_id)?.full_name || 'Unknown Driver'}` : 'No Driver Assigned'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ROUTES TAB */}
      {activeTab === 'routes' && (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '16px 24px', fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Route Name</th>
                <th style={{ padding: '16px 24px', fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Description</th>
                <th style={{ padding: '16px 24px', fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Termly Fee</th>
                <th style={{ padding: '16px 24px' }}></th>
              </tr>
            </thead>
            <tbody>
              {routes.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>No routes defined.</td></tr>
              ) : routes.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '16px 24px', fontSize: 15, fontWeight: 700, color: '#111827' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <MapPin size={18} color="#2563eb" /> {r.name}
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: 14, color: '#64748b' }}>{r.description || '-'}</td>
                  <td style={{ padding: '16px 24px', fontSize: 15, fontWeight: 600, color: '#16a34a' }}>GH₵ {Number(r.fee_amount).toLocaleString()}</td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <button onClick={() => deleteRoute(r.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ASSIGNMENTS TAB */}
      {activeTab === 'assignments' && (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '16px 24px', fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Student</th>
                <th style={{ padding: '16px 24px', fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Route & Vehicle</th>
                <th style={{ padding: '16px 24px', fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Locations</th>
                <th style={{ padding: '16px 24px' }}></th>
              </tr>
            </thead>
            <tbody>
              {assignments.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>No students assigned to transport.</td></tr>
              ) : assignments.map(a => (
                <tr key={a.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{a.student?.full_name}</div>
                    <div style={{ fontSize: 13, color: '#64748b' }}>{a.student?.class?.name}</div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#2563eb' }}>{a.route?.name}</div>
                    <div style={{ fontSize: 13, color: '#64748b' }}>{a.vehicle?.plate_number || 'Any Vehicle'}</div>
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: 13, color: '#475569' }}>
                    <div><span style={{ color: '#94a3b8' }}>Pickup:</span> {a.pickup_location || 'Default'}</div>
                    <div><span style={{ color: '#94a3b8' }}>Dropoff:</span> {a.dropoff_location || 'Default'}</div>
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <button onClick={() => deleteAssignment(a.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MAINTENANCE TAB */}
      {activeTab === 'maintenance' && (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '16px 24px', fontSize: 13, fontWeight: 700, color: '#64748b' }}>Date</th>
                <th style={{ padding: '16px 24px', fontSize: 13, fontWeight: 700, color: '#64748b' }}>Vehicle & Driver</th>
                <th style={{ padding: '16px 24px', fontSize: 13, fontWeight: 700, color: '#64748b' }}>Issue</th>
                <th style={{ padding: '16px 24px', fontSize: 13, fontWeight: 700, color: '#64748b' }}>Status</th>
                <th style={{ padding: '16px 24px', fontSize: 13, fontWeight: 700, color: '#64748b', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {maintenanceLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>No maintenance issues reported.</td>
                </tr>
              ) : maintenanceLogs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '16px 24px', fontSize: 14, color: '#334155' }}>
                    {new Date(log.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{log.vehicle?.plate_number}</div>
                    <div style={{ fontSize: 13, color: '#64748b' }}>{log.driver?.full_name}</div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ display: 'inline-block', padding: '4px 8px', background: '#e0e7ff', color: '#4338ca', borderRadius: 6, fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                      {log.category}
                    </span>
                    <div style={{ fontSize: 14, color: '#475569', maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={log.description}>
                      {log.description}
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ padding: '6px 12px', background: log.status === 'resolved' ? '#d1fae5' : '#fef3c7', color: log.status === 'resolved' ? '#059669' : '#d97706', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                      {log.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    {log.status === 'pending' && (
                      <button onClick={() => resolveMaintenance(log.id)} style={{ padding: '8px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                        Mark Resolved
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {isVehicleModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 24, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 24px', fontSize: 24, fontWeight: 800 }}>Add New Vehicle</h2>
            <form onSubmit={handleSaveVehicle}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 700, color: '#374151' }}>Plate Number *</label>
                <input required value={vForm.plate_number} onChange={e => setVForm({...vForm, plate_number: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid #d1d5db' }} placeholder="e.g. GR-1234-22" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 700, color: '#374151' }}>Make & Model</label>
                <input value={vForm.make_model} onChange={e => setVForm({...vForm, make_model: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid #d1d5db' }} placeholder="e.g. Toyota Coaster" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 700, color: '#374151' }}>Capacity (Seats) *</label>
                <input required type="number" value={vForm.capacity} onChange={e => setVForm({...vForm, capacity: Number(e.target.value)})} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid #d1d5db' }} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 700, color: '#374151' }}>Assign Driver</label>
                <select value={vForm.driver_id} onChange={e => setVForm({...vForm, driver_id: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid #d1d5db', background: '#fff' }}>
                  <option value="">-- No Driver Assigned --</option>
                  {drivers.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsVehicleModalOpen(false)} style={{ padding: '12px 24px', borderRadius: 10, border: 'none', background: '#f3f4f6', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '12px 24px', borderRadius: 10, border: 'none', background: '#1d4ed8', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Save Vehicle</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isRouteModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 24, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 24px', fontSize: 24, fontWeight: 800 }}>Create Route</h2>
            <form onSubmit={handleSaveRoute}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 700, color: '#374151' }}>Route Name *</label>
                <input required value={rForm.name} onChange={e => setRForm({...rForm, name: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid #d1d5db' }} placeholder="e.g. Route A (East Legon)" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 700, color: '#374151' }}>Description</label>
                <input value={rForm.description} onChange={e => setRForm({...rForm, description: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid #d1d5db' }} placeholder="e.g. Morning pick up from East Legon" />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 700, color: '#374151' }}>Termly Transport Fee (GH₵) *</label>
                <input required type="number" step="0.01" value={rForm.fee_amount} onChange={e => setRForm({...rForm, fee_amount: Number(e.target.value)})} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid #d1d5db' }} />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsRouteModalOpen(false)} style={{ padding: '12px 24px', borderRadius: 10, border: 'none', background: '#f3f4f6', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '12px 24px', borderRadius: 10, border: 'none', background: '#1d4ed8', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Save Route</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isAssignModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 24, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 24px', fontSize: 24, fontWeight: 800 }}>Assign Student to Transport</h2>
            <form onSubmit={handleSaveAssignment}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 700, color: '#374151' }}>Filter by Class</label>
                <select value={assignClassFilter} onChange={e => setAssignClassFilter(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid #d1d5db', background: '#fff' }}>
                  <option value="">-- All Classes --</option>
                  {Array.from(new Set(students.map(s => s.class?.name).filter(Boolean))).sort().map(c => (
                    <option key={String(c)} value={String(c)}>{String(c)}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 700, color: '#374151' }}>Select Students * ({aForm.student_ids.length} selected)</label>
                <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #d1d5db', borderRadius: 10, padding: 12, background: '#f8fafc' }}>
                  {students.filter(s => assignClassFilter ? s.class?.name === assignClassFilter : true).map(s => (
                    <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', cursor: 'pointer', borderBottom: '1px solid #e2e8f0', fontSize: 14 }}>
                      <input 
                        type="checkbox" 
                        checked={aForm.student_ids.includes(s.id)}
                        onChange={(e) => {
                          if (e.target.checked) setAForm({...aForm, student_ids: [...aForm.student_ids, s.id]})
                          else setAForm({...aForm, student_ids: aForm.student_ids.filter(id => id !== s.id)})
                        }}
                      />
                      {s.full_name} <span style={{ color: '#64748b', fontSize: 12 }}>({s.class?.name})</span>
                    </label>
                  ))}
                  {students.filter(s => assignClassFilter ? s.class?.name === assignClassFilter : true).length === 0 && (
                    <div style={{ color: '#64748b', fontSize: 13, textAlign: 'center', padding: 10 }}>No students found in this class.</div>
                  )}
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 700, color: '#374151' }}>Route *</label>
                <select required value={aForm.route_id} onChange={e => setAForm({...aForm, route_id: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid #d1d5db', background: '#fff' }}>
                  <option value="">-- Select Route --</option>
                  {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 700, color: '#374151' }}>Specific Vehicle (Optional)</label>
                <select value={aForm.vehicle_id} onChange={e => setAForm({...aForm, vehicle_id: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid #d1d5db', background: '#fff' }}>
                  <option value="">-- Any Vehicle on this Route --</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate_number}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 700, color: '#374151' }}>Pickup Area</label>
                  <input value={aForm.pickup_location} onChange={e => setAForm({...aForm, pickup_location: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid #d1d5db' }} placeholder="e.g. Total Station" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 700, color: '#374151' }}>Dropoff Area</label>
                  <input value={aForm.dropoff_location} onChange={e => setAForm({...aForm, dropoff_location: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid #d1d5db' }} placeholder="e.g. Home" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsAssignModalOpen(false)} style={{ padding: '12px 24px', borderRadius: 10, border: 'none', background: '#f3f4f6', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '12px 24px', borderRadius: 10, border: 'none', background: '#1d4ed8', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Save Assignment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
