import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { MapPin, Navigation, Info, Bus, Play, Square, Users, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import FlaskLoader from '../../components/ui/FlaskLoader'

export default function DriverRoutesPage() {
  const { user } = useAuth()
  const [routes, setRoutes] = useState<any[]>([])
  const [vehicle, setVehicle] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTrip, setActiveTrip] = useState<any>(null)
  const [updating, setUpdating] = useState(false)
  const [activeRouteId, setActiveRouteId] = useState<string | null>(null)
  const [students, setStudents] = useState<any[]>([])
  const [studentLogs, setStudentLogs] = useState<Record<string, any>>({})

  useEffect(() => {
    if (user?.school_id) loadRoutes()
  }, [user?.school_id])

  async function loadRoutes() {
    setLoading(true)

    // First fetch the vehicle assigned to this driver
    const { data: vData } = await supabase
      .from('transport_vehicles')
      .select('id, plate_number, make_model')
      .eq('driver_id', user!.id)
      .maybeSingle()

    setVehicle(vData)

    if (vData) {
      // Check for active trip
      const { data: active } = await supabase
        .from('transport_live_locations')
        .select('*')
        .eq('vehicle_id', vData.id)
        .eq('is_active', true)
        .maybeSingle()
      
      setActiveTrip(active)
      if (active) {
         // Attempt to find if we saved route_id in a metadata column, or just use state
         // For now, driver selects the route explicitly below if they want to view manifest.
      }
    }

    // Fetch routes for the school
    const { data: rData } = await supabase
      .from('transport_routes')
      .select('*')
      .eq('school_id', user!.school_id)
      .order('name')

    setRoutes(rData || [])
    setLoading(false)
  }

  async function startTrip(routeId: string) {
    if (!vehicle || !user) return
    setUpdating(true)
    try {
      const { data, error } = await supabase
        .from('transport_live_locations')
        .insert({
          school_id: user.school_id,
          vehicle_id: vehicle.id,
          driver_id: user.id,
          latitude: 5.6037, // Default Accra coords
          longitude: -0.1870,
          speed: 0,
          is_active: true,
          last_updated: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      setActiveTrip(data)
      setActiveRouteId(routeId)
      loadManifest(routeId, data.id)
      toast.success('Trip started! Drive safely.')
    } catch (err: any) {
      toast.error(err.message || 'Failed to start trip')
    } finally {
      setUpdating(false)
    }
  }

  async function loadManifest(routeId: string, tripId: string) {
     if (!user?.school_id) return
     // Load students on this route
     const { data: routeStudents } = await supabase
       .from('transport_route_students')
       .select('student_id, pickup_stop, dropoff_stop, student:students(full_name, class:classes(name))')
       .eq('route_id', routeId)
     
     setStudents(routeStudents || [])

     // Load any existing logs for today/this trip
     const today = new Date().toISOString().split('T')[0]
     const { data: logs } = await supabase
       .from('transport_student_logs')
       .select('*')
       .eq('trip_id', tripId)
       .eq('date', today)

     const logMap: any = {}
     if (logs) logs.forEach((l:any) => logMap[l.student_id] = l)
     setStudentLogs(logMap)
  }

  async function endTrip() {
    if (!activeTrip) return
    if (!confirm('Are you sure you want to end this trip?')) return
    setUpdating(true)
    try {
      const { error } = await supabase
        .from('transport_live_locations')
        .update({ is_active: false, last_updated: new Date().toISOString() })
        .eq('id', activeTrip.id)

      if (error) throw error
      setActiveTrip(null)
      setActiveRouteId(null)
      setStudents([])
      setStudentLogs({})
      toast.success('Trip ended.')
    } catch (err: any) {
      toast.error(err.message || 'Failed to end trip')
    } finally {
      setUpdating(false)
    }
  }

  async function updateStudentStatus(studentId: string, status: 'boarded' | 'dropped_off' | 'absent') {
     if (!activeTrip || !activeRouteId) return
     const today = new Date().toISOString().split('T')[0]
     
     try {
       const updateData: any = {
          school_id: user!.school_id,
          route_id: activeRouteId,
          trip_id: activeTrip.id,
          student_id: studentId,
          date: today,
          status: status
       }
       if (status === 'boarded') updateData.boarded_at = new Date().toISOString()
       if (status === 'dropped_off') updateData.dropped_off_at = new Date().toISOString()

       const { data, error } = await supabase
         .from('transport_student_logs')
         .upsert(updateData, { onConflict: 'trip_id,student_id,date' })
         .select()
         .single()
       
       if (error) throw error
       setStudentLogs(prev => ({...prev, [studentId]: data}))
     } catch (err: any) {
       toast.error('Failed to update student status')
       console.error(err)
     }
  }

  // Simulated location updates
  useEffect(() => {
    let interval: any
    if (activeTrip) {
      interval = setInterval(async () => {
        const newLat = activeTrip.latitude + (Math.random() - 0.5) * 0.001
        const newLng = activeTrip.longitude + (Math.random() - 0.5) * 0.001
        const newSpeed = Math.floor(Math.random() * 40) + 20

        await supabase
          .from('transport_live_locations')
          .update({
            latitude: newLat,
            longitude: newLng,
            speed: newSpeed,
            last_updated: new Date().toISOString()
          })
          .eq('id', activeTrip.id)
      }, 15000)
    }
    return () => clearInterval(interval)
  }, [activeTrip])

  if (loading) return <FlaskLoader fullScreen={false} label="Loading Routes..." />

  return (
    <div style={{ padding: '24px 20px', maxWidth: 800, margin: '0 auto', fontFamily: '"DM Sans", sans-serif', animation: '_fadeIn 0.3s ease' }}>
      <style>{`
        @keyframes _fadeIn { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>
      
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Assigned Routes</h1>
        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>Manage your routes and live student manifests.</p>
      </div>

      {!vehicle ? (
        <div style={{ padding: 24, background: '#fee2e2', borderRadius: 8, border: '1px solid #fca5a5', display: 'flex', gap: 16 }}>
          <Info color="#b91c1c" />
          <div>
            <div style={{ fontWeight: 700, color: '#991b1b', marginBottom: 4 }}>No Vehicle Assigned</div>
            <div style={{ color: '#b91c1c', fontSize: 14 }}>You must be assigned to a vehicle by the transport manager before you can run routes.</div>
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: 24, padding: 20, background: activeTrip ? '#ecfdf5' : '#eff6ff', borderRadius: 8, border: activeTrip ? '1px solid #10b981' : '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: 16, transition: 'all 0.3s' }}>
          <div style={{ width: 48, height: 48, background: activeTrip ? '#10b981' : '#3b82f6', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', transition: 'background 0.3s' }}>
            <Bus size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: activeTrip ? '#059669' : '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{activeTrip ? 'Active Trip' : 'Your Vehicle'}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: activeTrip ? '#064e3b' : '#1e3a8a' }}>{vehicle.plate_number}</div>
            <div style={{ fontSize: 13, color: activeTrip ? '#059669' : '#3b82f6', fontWeight: 600 }}>{vehicle.make_model}</div>
          </div>
          {activeTrip && (
            <button 
              onClick={endTrip}
              disabled={updating}
              style={{ padding: '10px 20px', borderRadius: 12, background: '#ef4444', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(239,68,68,0.2)' }}
            >
              <Square size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} /> End Trip
            </button>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gap: 16 }}>
        {routes.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', background: '#f8fafc', borderRadius: 8, border: '2px dashed #e2e8f0', color: '#64748b' }}>
            No routes configured for this school.
          </div>
        ) : (
          routes.map((route) => {
             const isActive = activeRouteId === route.id
             return (
              <div key={route.id} style={{ background: 'var(--bg-card)', borderRadius: 8, border: isActive ? '2px solid #6d28d9' : '1px solid #e2e8f0', overflow: 'hidden', boxShadow: isActive ? '0 8px 24px rgba(109,40,217,0.1)' : '0 2px 8px rgba(0,0,0,0.02)', transition: 'all 0.2s' }}>
                <div style={{ padding: 20, display: 'flex', gap: 16, background: isActive ? '#faf5ff' : '#fff' }}>
                  <div style={{ width: 40, height: 40, background: isActive ? '#ede9fe' : '#f1f5f9', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isActive ? '#6d28d9' : '#475569', flexShrink: 0 }}>
                    <MapPin size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#1e293b' }}>{route.name}</div>
                    {route.description && (
                      <div style={{ fontSize: 14, color: '#64748b', marginTop: 4, lineHeight: 1.5 }}>{route.description}</div>
                    )}
                  </div>
                  {!activeTrip && (
                     <button onClick={() => startTrip(route.id)} disabled={updating} style={{ padding: '8px 16px', borderRadius: 10, background: '#10b981', color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', alignSelf: 'center' }}>
                       <Play size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> Start
                     </button>
                  )}
                  {isActive && (
                     <div style={{ padding: '6px 12px', background: '#ecfdf5', color: '#059669', borderRadius: 8, fontSize: 12, fontWeight: 800, alignSelf: 'center', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' }} /> Active
                     </div>
                  )}
                </div>

                {/* Manifest View */}
                {isActive && (
                   <div style={{ padding: 20, borderTop: '1.5px solid #f0eefe', background: 'var(--bg-card)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                         <Users size={18} color="#6d28d9" />
                         <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1e0646', margin: 0 }}>Live Student Manifest</h3>
                      </div>
                      
                      {students.length === 0 ? (
                         <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, background: '#f8fafc', borderRadius: 12, border: '1px dashed #e2e8f0' }}>
                            No students assigned to this route.
                         </div>
                      ) : (
                         <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {students.map(s => {
                               const log = studentLogs[s.student_id]
                               const status = log?.status || 'pending'
                               return (
                                  <div key={s.student_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 12, border: '1px solid #e2e8f0', background: status === 'boarded' ? '#f0fdf4' : status === 'dropped_off' ? '#eff6ff' : status === 'absent' ? '#fef2f2' : '#fff' }}>
                                     <div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>{s.student?.full_name}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{s.student?.class?.name} • Stop: {s.pickup_stop || 'Any'}</div>
                                     </div>
                                     <div style={{ display: 'flex', gap: 6 }}>
                                        {status === 'pending' ? (
                                           <>
                                              <button onClick={() => updateStudentStatus(s.student_id, 'boarded')} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #bbf7d0', background: '#dcfce7', color: '#166534', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Boarded</button>
                                              <button onClick={() => updateStudentStatus(s.student_id, 'absent')} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #fecaca', background: '#fee2e2', color: '#991b1b', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Absent</button>
                                           </>
                                        ) : status === 'boarded' ? (
                                           <button onClick={() => updateStudentStatus(s.student_id, 'dropped_off')} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #bfdbfe', background: '#dbeafe', color: '#1e40af', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Drop Off</button>
                                        ) : status === 'dropped_off' ? (
                                           <div style={{ padding: '8px 12px', borderRadius: 8, background: 'transparent', color: '#64748b', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle size={14} /> Completed</div>
                                        ) : (
                                           <div style={{ padding: '8px 12px', borderRadius: 8, background: 'transparent', color: '#991b1b', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}><XCircle size={14} /> Absent</div>
                                        )}
                                     </div>
                                  </div>
                               )
                            })}
                         </div>
                      )}
                   </div>
                )}
              </div>
            )
          })
        )}
      </div>

    </div>
  )
}
