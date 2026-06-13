import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { Html5Qrcode } from 'html5-qrcode'
import { Camera, MapPin, Bus, UserCheck, Play, Square, LogIn, LogOut, CheckCircle, AlertTriangle, Wrench, WifiOff, X } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../../components/ui/Modal'
import { useAutoRefresh } from "../../hooks/useAutoRefresh";

export default function DriverDashboard() {
    useAutoRefresh(loadVehicle);
  const { user } = useAuth()
  const [vehicle, setVehicle] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tripActive, setTripActive] = useState(false)
  const [direction, setDirection] = useState<'pickup' | 'dropoff'>('pickup')
  const [lastScan, setLastScan] = useState<any>(null)
  const [scannedCount, setScannedCount] = useState(0)

  // Passenger Manifest State
  const [expectedStudents, setExpectedStudents] = useState<any[]>([])
  const [boardedStudentIds, setBoardedStudentIds] = useState<Set<string>>(new Set())

  // Location tracking state
  const watchIdRef = useRef<number | null>(null)
  const [lastLoc, setLastLoc] = useState<{ lat: number; lng: number } | null>(null)

  // Scanner state
  const [scannerActive, setScannerActive] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)

  // Premium Features State
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [sosLoading, setSosLoading] = useState(false)
  
  // Maintenance Modal State
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false)
  const [maintenanceCat, setMaintenanceCat] = useState('Engine')
  const [maintenanceDesc, setMaintenanceDesc] = useState('')
  const [maintenanceLoading, setMaintenanceLoading] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false)
      syncOfflineLogs()
    }
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    if (navigator.onLine) syncOfflineLogs()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  async function syncOfflineLogs() {
    const queue = JSON.parse(localStorage.getItem('offline_transport_logs') || '[]')
    if (queue.length === 0) return

    toast.success(`Syncing ${queue.length} offline scans...`)
    
    // Batch insert logs
    const { error: logsError } = await supabase.from('transport_boarding_logs').insert(queue.map((q: any) => q.log))
    
    // Batch insert notifications
    const notifications = queue.flatMap((q: any) => q.notifs || [])
    if (notifications.length > 0 && !logsError) {
      await supabase.from('notifications').insert(notifications)
    }

    if (!logsError) {
      localStorage.removeItem('offline_transport_logs')
      toast.success('Offline scans synced successfully!')
    }
  }

  useEffect(() => {
    if (user?.id) loadVehicle()
  }, [user?.id])

  async function loadVehicle() {
    setLoading(true)
    const { data } = await supabase
      .from('transport_vehicles')
      .select('*')
      .eq('driver_id', user!.id)
      .single()
    setVehicle(data)
    
    if (data) {
      // check if active location tracking exists
      const { data: loc } = await supabase
        .from('transport_live_locations')
        .select('*')
        .eq('vehicle_id', data.id)
        .eq('driver_id', user!.id)
        .eq('is_active', true)
        .maybeSingle()
      
      if (loc) {
        setTripActive(true)
        startTracking(data.id)
      }

      // Fetch Expected Students for this vehicle
      const { data: expected } = await supabase
        .from('transport_student_assignments')
        .select('student_id, pickup_location, dropoff_location, student:students(full_name, class:classes(name))')
        .eq('school_id', user!.school_id)
        .eq('vehicle_id', data.id)
      setExpectedStudents(expected || [])

      // Fetch already boarded/dropped off today
      const startOfDay = new Date()
      startOfDay.setHours(0,0,0,0)
      const { data: logs } = await supabase
        .from('transport_boarding_logs')
        .select('student_id, direction')
        .eq('vehicle_id', data.id)
        .gte('time_scanned', startOfDay.toISOString())
      
      if (logs) {
        const boarded = new Set(logs.map(l => `${l.student_id}-${l.direction}`))
        setBoardedStudentIds(boarded)
      }
    }
    setLoading(false)
  }

  // ─── Location Tracking ───
  function toggleTrip() {
    if (!vehicle) return toast.error('No vehicle assigned to you')
    
    if (tripActive) {
      // Stop trip
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
      setTripActive(false)
      stopScanner()
      
      supabase.from('transport_live_locations')
        .update({ is_active: false })
        .eq('school_id', user!.school_id)
        .eq('vehicle_id', vehicle.id)
        .eq('driver_id', user!.id)
        .eq('is_active', true)
        .then(() => toast.success('Trip Ended'))
    } else {
      // Start trip
      if (!navigator.geolocation) return toast.error('Geolocation not supported by this browser')
      setTripActive(true)
      startTracking(vehicle.id)
      toast.success('Trip Started & Location Tracking Active')
    }
  }

  function startTracking(vid: string) {
    if (watchIdRef.current) return
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, speed, heading } = pos.coords
        setLastLoc({ lat: latitude, lng: longitude })
        
        // Upsert logic (insert or update)
        const { data: existing } = await supabase
          .from('transport_live_locations')
          .select('id')
          .eq('vehicle_id', vid)
          .eq('driver_id', user!.id)
          .eq('is_active', true)
          .maybeSingle()

        if (existing) {
          await supabase.from('transport_live_locations').update({
            latitude, longitude, speed: speed || 0, heading: heading || 0, last_updated: new Date().toISOString()
          }).eq('id', existing.id).eq('school_id', user!.school_id)
        } else {
          await supabase.from('transport_live_locations').insert({
            school_id: user!.school_id,
            vehicle_id: vid,
            driver_id: user!.id,
            latitude, longitude, speed: speed || 0, heading: heading || 0,
            is_active: true
          })
        }
      },
      (err) => {
        console.warn('GPS Error:', err.message)
        // Optionally notify user but don't stop the trip. The watchPosition will keep trying.
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 30000 }
    )
  }

  // ─── Scanner ───
  async function toggleScanner() {
    if (scannerActive) {
      await stopScanner()
    } else {
      setScannerActive(true)
      setTimeout(() => {
        startScanner()
      }, 100)
    }
  }

  async function startScanner() {
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('driver-qr-reader')
      }
      await scannerRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        handleScan,
        () => {} // ignore scan errors
      )
    } catch (err: any) {
      toast.error('Could not start camera')
      setScannerActive(false)
    }
  }

  async function stopScanner() {
    try {
      if (scannerRef.current && scannerActive) {
        await scannerRef.current.stop()
        setScannerActive(false)
      }
    } catch (err) {}
  }

  async function processBoarding(student: any | null, studentId: string, studentName: string) {
    const key = `${studentId}-${direction}`
    setBoardedStudentIds(prev => new Set(prev).add(key))
    setScannedCount(c => c + 1)

    const logData = {
      school_id: user!.school_id,
      student_id: studentId,
      vehicle_id: vehicle.id,
      direction,
      time_scanned: new Date().toISOString()
    }

    // Prepare parent notifications
    const { data: parentLinks } = await supabase.from('parent_wards').select('parent_user_id').eq('student_id', studentId).catch(() => ({ data: null }))
    const notifs = parentLinks ? parentLinks.map(link => ({
      school_id: user!.school_id,
      user_id: link.parent_user_id,
      title: 'Transport Alert',
      message: `${studentName} has ${direction === 'pickup' ? 'boarded' : 'been dropped off from'} the bus.`,
      type: 'transport',
      link: '/parent/dashboard'
    })) : []

    if (!navigator.onLine) {
      const queue = JSON.parse(localStorage.getItem('offline_transport_logs') || '[]')
      queue.push({ log: logData, notifs })
      localStorage.setItem('offline_transport_logs', JSON.stringify(queue))
      toast.success(`${studentName} saved offline`)
      return
    }

    const { error } = await supabase.from('transport_boarding_logs').insert(logData)
    if (error) {
      toast.error('Network error, saving offline...')
      const queue = JSON.parse(localStorage.getItem('offline_transport_logs') || '[]')
      queue.push({ log: logData, notifs })
      localStorage.setItem('offline_transport_logs', JSON.stringify(queue))
    } else {
      toast.success(`${studentName} ${direction === 'pickup' ? 'boarded' : 'dropped off'}`)
      if (notifs.length > 0) {
        await supabase.from('notifications').insert(notifs)
      }
    }
  }

  async function handleScan(decodedText: string) {
    // Prevent duplicate fast scans
    if (lastScan?.id === decodedText && (new Date().getTime() - lastScan.time) < 3000) return
    setLastScan({ id: decodedText, time: new Date().getTime(), student: null, loading: true })

    // Find student
    const { data: student } = await supabase
      .from('students')
      .select('id, full_name, photo_url, class:classes(name)')
      .eq('student_id', decodedText)
      .eq('school_id', user!.school_id)
      .maybeSingle()

    if (!student) {
      toast.error('Student not found')
      setLastScan({ id: decodedText, time: new Date().getTime(), student: null, error: true })
      return
    }

    if (boardedStudentIds.has(`${student.id}-${direction}`)) {
      toast.error('Already scanned')
      return
    }

    await processBoarding(student, student.id, student.full_name)
    setLastScan({ id: decodedText, time: new Date().getTime(), student, error: false })
  }

  async function manualBoard(studentId: string, studentName: string) {
    const key = `${studentId}-${direction}`
    if (boardedStudentIds.has(key)) return // already boarded
    await processBoarding(null, studentId, studentName)
  }

  async function handleSOS() {
    if (!window.confirm("EMERGENCY SOS: Are you sure you want to trigger an emergency alert? This will immediately notify all security and administrative staff.")) return;
    
    setSosLoading(true)
    const { error } = await supabase.from('incidents').insert({
      school_id: user!.school_id,
      reported_by: user!.id,
      type: 'emergency',
      severity: 'critical',
      description: `TRANSPORT EMERGENCY: Driver ${user!.full_name} pressed the SOS button. Vehicle: ${vehicle?.plate_number || 'Unknown'}.`,
      location: lastLoc ? `${lastLoc.lat},${lastLoc.lng}` : 'Unknown Location',
      status: 'open'
    })

    if (error) toast.error('Failed to trigger SOS. Please call security immediately.')
    else toast.success('SOS Alert Broadcasted successfully.')
    setSosLoading(false)
  }

  async function submitMaintenance(e: React.FormEvent) {
    e.preventDefault()
    setMaintenanceLoading(true)
    const { error } = await supabase.from('transport_maintenance_logs').insert({
      school_id: user!.school_id,
      vehicle_id: vehicle.id,
      driver_id: user!.id,
      category: maintenanceCat,
      description: maintenanceDesc
    })
    setMaintenanceLoading(false)
    if (error) toast.error('Failed to submit report')
    else {
      toast.success('Maintenance reported successfully')
      setShowMaintenanceModal(false)
      setMaintenanceDesc('')
    }
  }

  function openNavigation() {
    if (expectedStudents.length === 0) return toast.error('No passengers to navigate to.')
    
    // Extract unique locations based on direction
    const locations = Array.from(new Set(
      expectedStudents
        .map(s => direction === 'pickup' ? s.pickup_location : s.dropoff_location)
        .filter(loc => loc && loc.trim() !== '' && loc.toLowerCase() !== 'default')
    ))

    if (locations.length === 0) return toast.error('No specific locations provided for students.')

    let url = 'https://www.google.com/maps/dir/?api=1'
    
    // If we have current location, use it as origin
    if (lastLoc) {
      url += `&origin=${lastLoc.lat},${lastLoc.lng}`
    }

    if (locations.length === 1) {
      url += `&destination=${encodeURIComponent(locations[0])}`
    } else {
      url += `&destination=${encodeURIComponent(locations[locations.length - 1])}`
      url += `&waypoints=${encodeURIComponent(locations.slice(0, -1).join('|'))}`
    }

    // Open in new tab (which triggers native maps app on mobile)
    window.open(url, '_blank')
  }

  useEffect(() => {
    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current)
      stopScanner()
    }
  }, [])

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading Fleet Data...</div>

  return (
    <div style={{ padding: '24px 20px', paddingBottom: 100, maxWidth: 600, margin: '0 auto', fontFamily: '"DM Sans", sans-serif' }}>
      
      {/* Header Info */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 60, height: 60, borderRadius: 8, background: '#1e3a8a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 12px rgba(30,58,138,0.2)' }}>
            <Bus size={32} />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Driver Portal</h1>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
              {vehicle ? `${vehicle.make_model || 'Bus'} — ${vehicle.plate_number}` : 'No Vehicle Assigned'}
            </p>
          </div>
        </div>
        {isOffline && (
          <div style={{ padding: '6px 12px', background: '#fef2f2', color: '#ef4444', borderRadius: 8, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <WifiOff size={14} /> Offline Mode
          </div>
        )}
      </div>

      {!vehicle ? (
        <div style={{ padding: 32, textAlign: 'center', background: '#fee2e2', borderRadius: 8, color: '#b91c1c' }}>
          Please contact the Transport Manager to assign a vehicle to your account.
        </div>
      ) : (
        <>
          {/* Trip Controls */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 8, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trip Status</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: tripActive ? '#10b981' : '#111827', display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  {tripActive ? <><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px rgba(16,185,129,0.5)', animation: 'pulse 2s infinite' }} /> Trip In Progress</> : 'Offline'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button 
                  onClick={handleSOS} 
                  disabled={sosLoading}
                  style={{ width: 48, height: 48, borderRadius: 12, border: 'none', background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  title="EMERGENCY SOS"
                >
                  <AlertTriangle size={24} />
                </button>
                <button onClick={toggleTrip} style={{ padding: '12px 24px', borderRadius: 12, border: 'none', background: tripActive ? '#ef4444' : '#10b981', color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 15 }}>
                  {tripActive ? <><Square size={18} fill="currentColor" /> End Trip</> : <><Play size={18} fill="currentColor" /> Start Trip</>}
                </button>
              </div>
            </div>

            {tripActive && lastLoc && (
              <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                <MapPin size={20} color="#3b82f6" />
                <div>
                  <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>GPS Tracking Active</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{lastLoc.lat.toFixed(5)}, {lastLoc.lng.toFixed(5)}</div>
                </div>
              </div>
            )}
          </div>

          {/* Scanner Controls (Only if trip is active) */}
          {tripActive && (
            <div style={{ background: 'var(--bg-card)', borderRadius: 8, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
              
              <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                <button 
                  onClick={() => setDirection('pickup')}
                  style={{ flex: 1, padding: '12px', borderRadius: 12, border: direction === 'pickup' ? '2px solid #3b82f6' : '1px solid #e2e8f0', background: direction === 'pickup' ? '#eff6ff' : '#fff', color: direction === 'pickup' ? '#1d4ed8' : '#64748b', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' }}
                >
                  <LogIn size={18} /> Picking Up
                </button>
                <button 
                  onClick={() => setDirection('dropoff')}
                  style={{ flex: 1, padding: '12px', borderRadius: 12, border: direction === 'dropoff' ? '2px solid #f59e0b' : '1px solid #e2e8f0', background: direction === 'dropoff' ? '#fffbeb' : '#fff', color: direction === 'dropoff' ? '#b45309' : '#64748b', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' }}
                >
                  <LogOut size={18} /> Dropping Off
                </button>
              </div>

              <div style={{ borderRadius: 8, overflow: 'hidden', background: '#000', position: 'relative', minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                {!scannerActive ? (
                  <button onClick={toggleScanner} style={{ padding: '16px 32px', borderRadius: 12, border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 16 }}>
                    <Camera size={24} /> Tap to Open Scanner
                  </button>
                ) : (
                  <div id="driver-qr-reader" style={{ width: '100%', border: 'none' }} />
                )}
              </div>

              {/* Scan Result */}
              {lastScan && lastScan.student && !lastScan.error && (
                <div style={{ padding: 16, background: '#ecfdf5', borderRadius: 8, border: '2px solid #10b981', display: 'flex', alignItems: 'center', gap: 16 }}>
                  {lastScan.student.photo_url ? (
                    <img loading="lazy" src={lastScan.student.photo_url} alt="" style={{ width: 50, height: 50, borderRadius: 12, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 50, height: 50, borderRadius: 12, background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                      <UserCheck size={24} />
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#065f46' }}>{lastScan.student.full_name}</div>
                    <div style={{ fontSize: 13, color: '#047857', fontWeight: 600 }}>{lastScan.student.class?.name}</div>
                  </div>
                  <CheckCircle size={28} color="#10b981" />
                </div>
              )}

              <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#64748b', fontWeight: 600 }}>
                {scannedCount} students scanned this trip
              </div>

            </div>
          )}

          {/* Expected Passengers Manifest */}
          {tripActive && expectedStudents.length > 0 && (
            <div style={{ background: 'var(--bg-card)', borderRadius: 8, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', marginTop: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-main)', marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                <span>Expected Passengers</span>
                <span style={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>
                  {expectedStudents.filter(s => boardedStudentIds.has(`${s.student_id}-${direction}`)).length} / {expectedStudents.length} {direction === 'pickup' ? 'Boarded' : 'Dropped'}
                </span>
              </div>
              <button 
                onClick={openNavigation}
                style={{ width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: '#e0e7ff', color: '#4f46e5', fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', marginBottom: 20 }}
              >
                <MapPin size={18} /> Open in Google Maps
              </button>
              <div style={{ display: 'grid', gap: 12 }}>
                {expectedStudents.map(assignment => {
                  const isBoarded = boardedStudentIds.has(`${assignment.student_id}-${direction}`)
                  return (
                    <div key={assignment.student_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 12, border: `1px solid ${isBoarded ? '#10b981' : '#e2e8f0'}`, background: isBoarded ? '#ecfdf5' : '#fff', transition: 'all 0.2s' }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: isBoarded ? '#065f46' : '#1e293b', textDecoration: isBoarded ? 'line-through' : 'none' }}>
                          {assignment.student?.full_name}
                        </div>
                        <div style={{ fontSize: 13, color: isBoarded ? '#047857' : '#64748b', marginTop: 2 }}>
                          {assignment.student?.class?.name} • {direction === 'pickup' ? assignment.pickup_location || 'Default' : assignment.dropoff_location || 'Default'}
                        </div>
                      </div>
                      {isBoarded ? (
                        <CheckCircle size={24} color="#10b981" />
                      ) : (
                        <button 
                          onClick={() => manualBoard(assignment.student_id, assignment.student?.full_name)}
                          style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#eff6ff', color: '#2563eb', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                        >
                          Manual Mark
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button 
              onClick={() => setShowMaintenanceModal(true)}
              style={{ flex: 1, padding: '16px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'var(--bg-card)', color: '#475569', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}
            >
              <Wrench size={18} /> Report Issue
            </button>
          </div>
        </>
      )}

      {/* Maintenance Modal */}
      <Modal open={showMaintenanceModal} onClose={() => setShowMaintenanceModal(false)} title="Report Maintenance Issue" subtitle="Log a problem with the vehicle for admin review.">
        <form onSubmit={submitMaintenance} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-main)', marginBottom: 8 }}>Category</label>
            <select 
              value={maintenanceCat} 
              onChange={e => setMaintenanceCat(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border-color)', background: 'var(--bg-input)', fontSize: 15, outline: 'none' }}
              required
            >
              <option value="Engine">Engine / Mechanical</option>
              <option value="Tires">Tires</option>
              <option value="Electrical">Electrical / Lights</option>
              <option value="AC">Air Conditioning</option>
              <option value="Interior">Interior / Seats</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-main)', marginBottom: 8 }}>Description</label>
            <textarea 
              value={maintenanceDesc}
              onChange={e => setMaintenanceDesc(e.target.value)}
              placeholder="Describe the issue in detail..."
              style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border-color)', background: 'var(--bg-input)', fontSize: 15, outline: 'none', minHeight: 100, resize: 'vertical' }}
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={maintenanceLoading}
            style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginTop: 8 }}
          >
            {maintenanceLoading ? 'Submitting...' : 'Submit Report'}
          </button>
        </form>
      </Modal>

      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        #driver-qr-reader video { border-radius: 8px !important; object-fit: cover !important; }
        #driver-qr-reader__dashboard { display: none !important; }
      `}</style>
    </div>
  )
}
