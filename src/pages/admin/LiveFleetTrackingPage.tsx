import { useStuckLoadingReload } from '../../hooks/useStuckLoadingReload'
import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { MapPin, Bus, User, Navigation, CheckCircle, Clock, Maximize2 } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icons in Leaflet with Vite
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})
L.Marker.prototype.options.icon = DefaultIcon

function RecenterMap({ coords }: { coords: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(coords)
  }, [coords])
  return null
}

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
  useStuckLoadingReload(loading)
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null)

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
    <>
      <div style={{ padding: '24px', maxWidth: 1100, margin: '0 auto', fontFamily: '"DM Sans", sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 12 }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, height: 'calc(100vh - 200px)', minHeight: 600 }}>
          
          {/* Left: Map */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 24, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', position: 'relative' }}>
            <MapContainer 
              center={[activeTrips[0]?.latitude || 5.6037, activeTrips[0]?.longitude || -0.1870]} 
              zoom={13} 
              style={{ width: '100%', height: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {activeTrips.map(trip => (
                <Marker 
                  key={trip.id} 
                  position={[trip.latitude, trip.longitude]}
                  eventHandlers={{ click: () => setSelectedTripId(trip.id) }}
                >
                  <Popup>
                    <div style={{ padding: '4px' }}>
                      <div style={{ fontWeight: 800, fontSize: 14, color: '#1e293b' }}>{trip.vehicle?.plate_number}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>Driver: {trip.driver?.full_name}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6', marginTop: 4 }}>{Math.round(trip.speed)} km/h</div>
                    </div>
                  </Popup>
                </Marker>
             ))}
              {selectedTripId && activeTrips.find(t => t.id === selectedTripId) && (
                <RecenterMap coords={[activeTrips.find(t => t.id === selectedTripId)!.latitude, activeTrips.find(t => t.id === selectedTripId)!.longitude]} />
              )}
            </MapContainer>
          </div>

          {/* Right: Sidebar with Manifests */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', paddingRight: 4 }}>
            {activeTrips.map(trip => {
              const expectedCount = trip.expectedStudents.length
              const boardedCount = trip.expectedStudents.filter(s => trip.boardedStudentIds.has(s.student_id)).length
              const progress = expectedCount === 0 ? 0 : (boardedCount / expectedCount) * 100
              const isSelected = selectedTripId === trip.id

              return (
                <div 
                  key={trip.id} 
                  onClick={() => setSelectedTripId(trip.id)}
                  style={{ 
                    background: 'var(--bg-card)', 
                    borderRadius: 20, 
                    overflow: 'hidden', 
                    boxShadow: isSelected ? '0 8px 24px rgba(59,130,246,0.15)' : '0 2px 8px rgba(0,0,0,0.04)', 
                    border: isSelected ? '2px solid #3b82f6' : '1px solid #e2e8f0', 
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                >
                  {/* Trip Header */}
                  <div style={{ padding: '12px 16px', background: isSelected ? '#3b82f6' : '#1e293b', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800 }}>{trip.vehicle?.plate_number}</div>
                      <div style={{ fontSize: 11, opacity: 0.8 }}>{trip.driver?.full_name}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 800 }}>{Math.round(trip.speed)} <span style={{ fontSize: 10 }}>km/h</span></div>
                    </div>
                  </div>

                  {/* Manifest Summary */}
                  <div style={{ padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>BOARDING</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#1e293b' }}>{boardedCount} / {expectedCount}</div>
                    </div>
                    <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden', marginBottom: 12 }}>
                      <div style={{ height: '100%', background: progress === 100 ? '#10b981' : '#3b82f6', width: progress + '%' }} />
                    </div>

                    {isSelected && (
                      <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12, borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
                        {trip.expectedStudents.map(assignment => {
                          const isBoarded = trip.boardedStudentIds.has(assignment.student_id)
                          return (
                            <div key={assignment.student_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: isBoarded ? '#ecfdf5' : '#f8fafc', borderRadius: 8 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: isBoarded ? '#059669' : '#334155' }}>{assignment.student?.full_name}</div>
                              {isBoarded ? <CheckCircle size={14} color="#10b981" /> : <div style={{ fontSize: 10, color: '#94a3b8' }}>Pending</div>}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
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
    </>
  )
}
