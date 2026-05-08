import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { MapPin, Bus, User, Navigation, CheckCircle, Clock } from 'lucide-react'

type ActiveTrip = {
  id: string
  vehicle_id: string
  driver_id: string
  latitude: number
  longitude: number
  speed: number
  last_updated: string
  vehicle: any
  driver: any
  expectedStudents: any[]
  boardedStudentIds: Set<string>
}

export default function LiveFleetTrackingPage() {
  const { user } = useAuth()
  const [activeTrips, setActiveTrips] = useState<ActiveTrip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.school_id) {
      loadActiveTrips()

      // Setup Realtime Subscription
      const channel = supabase.channel('live-locations')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'transport_live_locations', filter: `school_id=eq.${user.school_id}` },
          (payload) => {
            // Reload the trips to ensure we have fresh relational data if a new trip starts
            loadActiveTrips()
          }
        )
        .subscribe()

      // Set up periodic reload of boarding logs to catch new scans
      const logInterval = setInterval(() => {
        loadActiveTrips()
      }, 10000)

      return () => {
        supabase.removeChannel(channel)
        clearInterval(logInterval)
      }
    }
  }, [user?.school_id])

  async function loadActiveTrips() {
    const { data: locs, error } = await supabase
      .from('transport_live_locations')
      .select('id, vehicle_id, driver_id, latitude, longitude, speed, last_updated, vehicle:transport_vehicles(plate_number, make_model), driver:users(full_name)')
      .eq('school_id', user!.school_id)
      .eq('is_active', true)

    if (error || !locs) {
      setLoading(false)
      return
    }

    // Process each active trip
    const tripsWithManifests: ActiveTrip[] = await Promise.all(
      locs.map(async (loc: any) => {
        // Fetch expected students
        const { data: expected } = await supabase
          .from('transport_student_assignments')
          .select('student_id, student:students(full_name, class:classes(name))')
          .eq('vehicle_id', loc.vehicle_id)
        
        // Fetch today's boarding logs for this vehicle
        const startOfDay = new Date()
        startOfDay.setHours(0,0,0,0)
        const { data: logs } = await supabase
          .from('transport_boarding_logs')
          .select('student_id, direction')
          .eq('vehicle_id', loc.vehicle_id)
          .gte('time_scanned', startOfDay.toISOString())

        const boardedIds = new Set<string>()
        if (logs) {
          // Simplification: we just track if they boarded in either direction today, 
          // or we could assume the driver is doing "pickup" in morning, "dropoff" in evening.
          // For now, we'll just track if they boarded today.
          logs.forEach(l => boardedIds.add(l.student_id))
        }

        return {
          ...loc,
          expectedStudents: expected || [],
          boardedStudentIds: boardedIds
        } as ActiveTrip
      })
    )

    setActiveTrips(tripsWithManifests)
    setLoading(false)
  }

  function getTimeAgo(isoString: string) {
    const seconds = Math.floor((new Date().getTime() - new Date(isoString).getTime()) / 1000)
    if (seconds < 60) return 'Just now'
    return `${Math.floor(seconds / 60)}m ago`
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading Live Tracking...</div>

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1200, margin: '0 auto', fontFamily: '"DM Sans", sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: '#111827', display: 'flex', alignItems: 'center', gap: 12 }}>
            <Navigation color="#3b82f6" /> Live Fleet Tracking
          </h1>
          <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 15 }}>Monitor active trips and real-time passenger manifests.</p>
        </div>
        <div style={{ padding: '8px 16px', background: '#ecfdf5', borderRadius: 20, border: '1px solid #10b981', display: 'flex', alignItems: 'center', gap: 8, color: '#059669', fontWeight: 700, fontSize: 14 }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' }} />
          {activeTrips.length} Active Trips
        </div>
      </div>

      {activeTrips.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', background: '#f8fafc', borderRadius: 24, border: '1px dashed #cbd5e1' }}>
          <Bus size={48} color="#94a3b8" style={{ marginBottom: 16 }} />
          <h3 style={{ margin: 0, fontSize: 18, color: '#334155', fontWeight: 700 }}>No Active Trips</h3>
          <p style={{ color: '#64748b', marginTop: 8 }}>Vehicles will appear here when drivers start their trip on the Driver Portal.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 24 }}>
          {activeTrips.map(trip => {
            const expectedCount = trip.expectedStudents.length
            const boardedCount = trip.expectedStudents.filter(s => trip.boardedStudentIds.has(s.student_id)).length
            const progress = expectedCount === 0 ? 0 : (boardedCount / expectedCount) * 100

            return (
              <div key={trip.id} style={{ background: '#fff', borderRadius: 24, overflow: 'hidden', boxShadow: trip.speed > 80 ? '0 0 20px rgba(239, 68, 68, 0.4)' : '0 4px 20px rgba(0,0,0,0.04)', border: trip.speed > 80 ? '2px solid #ef4444' : '1px solid #e2e8f0', transition: 'all 0.3s' }}>
                {/* Header */}
                <div style={{ padding: 20, background: trip.speed > 80 ? '#7f1d1d' : '#1e293b', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', transition: 'background 0.3s' }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Bus size={20} color={trip.speed > 80 ? '#fca5a5' : '#60a5fa'} /> {trip.vehicle?.plate_number || 'Unknown Vehicle'}
                    </div>
                    <div style={{ fontSize: 13, color: trip.speed > 80 ? '#fecaca' : '#94a3b8', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <User size={14} /> Driver: {trip.driver?.full_name || 'Unknown'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: trip.speed > 80 ? '#fecaca' : '#38bdf8', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {trip.speed > 80 && <span style={{ padding: '2px 6px', background: '#dc2626', borderRadius: 4, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', animation: 'pulse 1s infinite' }}>Speeding Alert</span>}
                      {Math.round(trip.speed || 0)} km/h
                    </div>
                    <div style={{ fontSize: 12, color: trip.speed > 80 ? '#fca5a5' : '#94a3b8', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                      <Clock size={12} /> {getTimeAgo(trip.last_updated)}
                    </div>
                  </div>
                </div>

                {/* GPS Info */}
                <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <MapPin size={18} color="#3b82f6" />
                  <div style={{ fontSize: 13, color: '#475569', fontFamily: 'monospace', fontWeight: 600 }}>
                    {trip.latitude.toFixed(5)}, {trip.longitude.toFixed(5)}
                  </div>
                </div>

                {/* Manifest Summary */}
                <div style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Passenger Manifest</div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: '#111827', marginTop: 4 }}>
                        {boardedCount} <span style={{ fontSize: 16, color: '#94a3b8' }}>/ {expectedCount} Onboard</span>
                      </div>
                    </div>
                    {progress === 100 && expectedCount > 0 && (
                      <div style={{ padding: '6px 12px', background: '#d1fae5', color: '#059669', borderRadius: 20, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <CheckCircle size={14} /> All Boarded
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden', marginBottom: 20 }}>
                    <div style={{ height: '100%', background: progress === 100 ? '#10b981' : '#3b82f6', width: progress + '%', transition: 'width 0.5s ease-in-out' }} />
                  </div>

                  {/* Detailed Student List */}
                  <div style={{ maxHeight: 200, overflowY: 'auto', paddingRight: 8 }}>
                    {trip.expectedStudents.length === 0 ? (
                      <div style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>No students assigned to this vehicle.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {trip.expectedStudents.map(assignment => {
                          const isBoarded = trip.boardedStudentIds.has(assignment.student_id)
                          return (
                            <div key={assignment.student_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: isBoarded ? '#ecfdf5' : '#f1f5f9', borderRadius: 12, border: isBoarded ? '1px solid #10b981' : '1px solid transparent' }}>
                              <div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: isBoarded ? '#065f46' : '#334155', textDecoration: isBoarded ? 'line-through' : 'none' }}>
                                  {assignment.student?.full_name}
                                </div>
                                <div style={{ fontSize: 12, color: isBoarded ? '#047857' : '#64748b' }}>
                                  {assignment.student?.class?.name}
                                </div>
                              </div>
                              {isBoarded ? <CheckCircle size={18} color="#10b981" /> : <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>Awaiting</div>}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )
          })}
        </div>
      )}
      
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
      `}</style>
    </div>
  )
}
