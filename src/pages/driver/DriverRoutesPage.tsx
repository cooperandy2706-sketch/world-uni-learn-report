import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { MapPin, Navigation, Info, Bus, Play, Square } from 'lucide-react'
import toast from 'react-hot-toast'

export default function DriverRoutesPage() {
  const { user } = useAuth()
  const [routes, setRoutes] = useState<any[]>([])
  const [vehicle, setVehicle] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTrip, setActiveTrip] = useState<any>(null)
  const [updating, setUpdating] = useState(false)

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
      .single()

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

  async function startTrip() {
    if (!vehicle || !user) return
    setUpdating(true)
    try {
      // Create new active location record
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
      toast.success('Trip started! Drive safely.')
    } catch (err: any) {
      toast.error(err.message || 'Failed to start trip')
    } finally {
      setUpdating(false)
    }
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
      toast.success('Trip ended.')
    } catch (err: any) {
      toast.error(err.message || 'Failed to end trip')
    } finally {
      setUpdating(false)
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

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading routes...</div>

  return (
    <div style={{ padding: '24px 20px', maxWidth: 800, margin: '0 auto', fontFamily: '"DM Sans", sans-serif' }}>
      
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: '#111827' }}>Assigned Routes</h1>
        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>Destinations and paths for your vehicle.</p>
      </div>

      {!vehicle ? (
        <div style={{ padding: 24, background: '#fee2e2', borderRadius: 16, border: '1px solid #fca5a5', display: 'flex', gap: 16 }}>
          <Info color="#b91c1c" />
          <div>
            <div style={{ fontWeight: 700, color: '#991b1b', marginBottom: 4 }}>No Vehicle Assigned</div>
            <div style={{ color: '#b91c1c', fontSize: 14 }}>You must be assigned to a vehicle by the transport manager before you can run routes.</div>
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: 24, padding: 20, background: activeTrip ? '#ecfdf5' : '#eff6ff', borderRadius: 16, border: activeTrip ? '1px solid #10b981' : '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: 16, transition: 'all 0.3s' }}>
          <div style={{ width: 48, height: 48, background: activeTrip ? '#10b981' : '#3b82f6', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', transition: 'background 0.3s' }}>
            <Bus size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: activeTrip ? '#059669' : '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{activeTrip ? 'Active Trip' : 'Your Vehicle'}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: activeTrip ? '#064e3b' : '#1e3a8a' }}>{vehicle.plate_number}</div>
            <div style={{ fontSize: 13, color: activeTrip ? '#059669' : '#3b82f6', fontWeight: 600 }}>{vehicle.make_model}</div>
          </div>
          {activeTrip ? (
            <button 
              onClick={endTrip}
              disabled={updating}
              style={{ padding: '10px 20px', borderRadius: 12, background: '#ef4444', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(239,68,68,0.2)' }}
            >
              End Trip
            </button>
          ) : (
            <button 
              onClick={startTrip}
              disabled={updating}
              style={{ padding: '10px 20px', borderRadius: 12, background: '#10b981', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.2)' }}
            >
              Start Trip
            </button>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gap: 16 }}>
        {routes.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', background: '#f8fafc', borderRadius: 16, border: '2px dashed #e2e8f0', color: '#64748b' }}>
            No routes configured for this school.
          </div>
        ) : (
          routes.map((route) => (
            <div key={route.id} style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 20, display: 'flex', gap: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ width: 40, height: 40, background: '#f1f5f9', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', flexShrink: 0 }}>
                <MapPin size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#1e293b' }}>{route.name}</div>
                {route.description && (
                  <div style={{ fontSize: 14, color: '#64748b', marginTop: 4, lineHeight: 1.5 }}>{route.description}</div>
                )}
                <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f8fafc', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#475569', border: '1px solid #e2e8f0' }}>
                  <Navigation size={14} /> Scheduled Route
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  )
}
