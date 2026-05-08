import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { MapPin, Navigation, Info, Bus } from 'lucide-react'

export default function DriverRoutesPage() {
  const { user } = useAuth()
  const [routes, setRoutes] = useState<any[]>([])
  const [vehicle, setVehicle] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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

    // Fetch routes for the school
    const { data: rData } = await supabase
      .from('transport_routes')
      .select('*')
      .eq('school_id', user!.school_id)
      .order('name')

    setRoutes(rData || [])
    setLoading(false)
  }

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
        <div style={{ marginBottom: 24, padding: 20, background: '#eff6ff', borderRadius: 16, border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, background: '#3b82f6', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <Bus size={24} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Vehicle</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#1e3a8a' }}>{vehicle.plate_number}</div>
            <div style={{ fontSize: 13, color: '#3b82f6', fontWeight: 600 }}>{vehicle.make_model}</div>
          </div>
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
