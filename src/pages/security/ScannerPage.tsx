// src/pages/security/ScannerPage.tsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { Html5Qrcode } from 'html5-qrcode'
import { QrCode, Usb, Camera, CheckCircle, XCircle, Clock, LogIn, LogOut, AlertTriangle, Volume2, Printer, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { format, parse } from 'date-fns'
import { useSettings, useCurrentTerm } from '../../hooks/useSettings'

// Defaults if settings not loaded
const DEFAULT_LATE_HOUR = 8
const DEFAULT_COOLDOWN_MS = 30_000
const PURPOSES = ['Parent Visit', 'Delivery', 'Official Meeting', 'Interview', 'Contractor', 'Inspection', 'Other']

function QRImg({ value, size = 80 }: { value: string; size?: number }) {
  const encoded = encodeURIComponent(value)
  return (
    <img
      src={`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&margin=2`}
      width={size} height={size}
      style={{ imageRendering: 'pixelated', display: 'block' }}
      alt="QR"
    />
  )
}

interface ScanCard {
  name: string
  personType: 'student' | 'teacher' | 'visitor'
  className: string
  photoUrl: string
  direction: 'in' | 'out'
  status: 'on_time' | 'late'
  scanTime: string
  alreadyOut?: boolean
}

export default function ScannerPage() {
  const { user } = useAuth()
  const { data: settings } = useSettings()
  const { data: term } = useCurrentTerm()
  const schoolId = user?.school_id ?? ''
  const [mode, setMode] = useState<'camera' | 'usb'>('camera')
  const [card, setCard] = useState<ScanCard | null>(null)
  const [cardType, setCardType] = useState<'success' | 'error' | 'warning'>('success')
  const [errorMsg, setErrorMsg] = useState('')
  const [processing, setProcessing] = useState(false)
  const [usbInput, setUsbInput] = useState('')
  const [cameraError, setCameraError] = useState('')
  const usbRef = useRef<HTMLInputElement>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const lastScanMap = useRef<Map<string, number>>(new Map())
  const cardTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const usbTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const processingRef = useRef(false)

  // Visitor state
  const [visitorFormOpen, setVisitorFormOpen] = useState(false)
  const [visitorSaving, setVisitorSaving] = useState(false)
  const [printingVisitor, setPrintingVisitor] = useState<any>(null)
  const [visitorForm, setVisitorForm] = useState({
    full_name: '', phone: '', purpose: 'Parent Visit',
    person_to_see: '', id_number: '', host_department: ''
  })

  async function submitVisitor() {
    if (!visitorForm.full_name.trim()) { toast.error('Full name is required'); return }
    setVisitorSaving(true)
    const { data, error } = await supabase
      .from('visitors')
      .insert({ school_id: schoolId, ...visitorForm })
      .select('*')
      .single()
    if (error) { toast.error('Failed to register visitor'); setVisitorSaving(false); return }
    toast.success(`${visitorForm.full_name} signed in!`)
    setVisitorFormOpen(false)
    setVisitorForm({ full_name: '', phone: '', purpose: 'Parent Visit', person_to_see: '', id_number: '', host_department: '' })
    setVisitorSaving(false)
    if (data) setTimeout(() => setPrintingVisitor(data), 300)
    // Show on scanner screen
    showCard({ name: data.full_name, personType: 'visitor', className: 'Visitor', photoUrl: '', direction: 'in', status: 'on_time', scanTime: format(new Date(), 'hh:mm:ss a') }, 'success')
    setUsbInput('')
  }

  function printBadge() {
    if (!printingVisitor) return
    const printWin = window.open('', '_blank', 'width=400,height=600')
    if (!printWin) { toast.error('Allow pop-ups to print'); return }
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`VISITOR:${printingVisitor.id}`)}&margin=2`
    const schoolName = user?.full_name ?? 'School'
    printWin.document.write(`
      <html><head><title>Visitor Badge</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800;900&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DM Sans', sans-serif; background: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
        .badge { width: 320px; border: 3px solid #0f172a; border-radius: 8px; overflow: hidden; page-break-inside: avoid; }
        .badge-header { background: #0f172a; color: #fff; padding: 14px 18px; text-align: center; }
        .badge-header .school { font-size: 11px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; opacity: .7; margin-bottom: 2px; }
        .badge-header .visitor-tag { font-size: 22px; font-weight: 900; letter-spacing: .05em; }
        .badge-body { padding: 18px; }
        .avatar { width: 64px; height: 64px; border-radius: 50%; background: #f1f5f9; border: 3px solid #0f172a; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 900; color: #0f172a; margin: 0 auto 12px; }
        .name { font-size: 22px; font-weight: 900; color: #0f172a; text-align: center; margin-bottom: 4px; }
        .purpose { font-size: 13px; font-weight: 700; color: #475569; text-align: center; margin-bottom: 14px; }
        .row { display: flex; justify-content: space-between; font-size: 11px; padding: 4px 0; border-bottom: 1px solid #f1f5f9; }
        .row .label { color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; }
        .row .val { color: #0f172a; font-weight: 700; text-align: right; max-width: 60%; }
        .qr-wrap { display: flex; flex-direction: column; align-items: center; margin-top: 14px; gap: 4px; }
        .qr-note { font-size: 9px; color: #94a3b8; font-weight: 600; letter-spacing: .05em; }
        .badge-footer { background: #dc2626; padding: 8px; text-align: center; font-size: 10px; font-weight: 800; color: #fff; letter-spacing: .08em; }
        @media print { body { min-height: unset; } }
      </style></head>
      <body>
        <div class="badge">
          <div class="badge-header">
            <div class="school">Nexora Platform — ${schoolName}</div>
            <div class="visitor-tag">🪪 VISITOR PASS</div>
          </div>
          <div class="badge-body">
            <div class="avatar">${printingVisitor.full_name?.charAt(0).toUpperCase()}</div>
            <div class="name">${printingVisitor.full_name}</div>
            <div class="purpose">${printingVisitor.purpose || 'General Visit'}</div>
            <div class="row"><span class="label">Date</span><span class="val">${format(new Date(printingVisitor.time_in), 'MMM d, yyyy')}</span></div>
            <div class="row"><span class="label">Time In</span><span class="val">${format(new Date(printingVisitor.time_in), 'hh:mm a')}</span></div>
            ${printingVisitor.person_to_see ? `<div class="row"><span class="label">Seeing</span><span class="val">${printingVisitor.person_to_see}</span></div>` : ''}
            ${printingVisitor.id_number ? `<div class="row"><span class="label">ID</span><span class="val">${printingVisitor.id_number}</span></div>` : ''}
            ${printingVisitor.phone ? `<div class="row"><span class="label">Phone</span><span class="val">${printingVisitor.phone}</span></div>` : ''}
            <div class="qr-wrap">
              <img src="${qrUrl}" width="100" height="100" />
              <div class="qr-note">SCAN TO SIGN OUT</div>
            </div>
          </div>
          <div class="badge-footer">MUST BE WORN & VISIBLE AT ALL TIMES</div>
        </div>
        <script>window.onload=()=>{window.print();setTimeout(()=>window.close(),500)}<\/script>
      </body></html>
    `)
    printWin.document.close()
  }

  const showCard = (c: ScanCard, type: 'success' | 'error' | 'warning') => {
    setCard(c)
    setCardType(type)
    if (cardTimer.current) clearTimeout(cardTimer.current)
    cardTimer.current = setTimeout(() => setCard(null), 4000)
  }

  const processBarcode = useCallback(async (barcode: string) => {
    let code = barcode.trim()
    if (!code || code.length < 2 || processingRef.current) return

    let isUniqueFormat = false
    if (code.startsWith('WUL:ID:')) {
      isUniqueFormat = true
      code = code.replace('WUL:ID:', '')
    }

    // Audio Feedback helper
    const playBeep = () => {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
        const osc = audioCtx.createOscillator()
        const gain = audioCtx.createGain()
        osc.connect(gain)
        gain.connect(audioCtx.destination)
        osc.type = 'sine'
        osc.frequency.setValueAtTime(880, audioCtx.currentTime) // A5
        gain.gain.setValueAtTime(0, audioCtx.currentTime)
        gain.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.01)
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.2)
        osc.start()
        osc.stop(audioCtx.currentTime + 0.2)
      } catch (e) { console.error('Audio fail', e) }
    }

    try {
      // 0. Resolve settings
      const lateTimeStr = (settings as any)?.late_arrival_time || '08:00:00'
      const cooldownSecs = (settings as any)?.scan_cooldown_seconds || 30
      const cooldownMs = cooldownSecs * 1000

      // Duplicate cooldown per ID
      const lastTime = lastScanMap.current.get(code)
      if (lastTime && Date.now() - lastTime < cooldownMs) {
        const secsLeft = Math.ceil((cooldownMs - (Date.now() - lastTime)) / 1000)
        toast(`⏳ Wait ${secsLeft}s before scanning again`, { duration: 2000, icon: '⏱️' })
        setUsbInput('')
        return
      }

      processingRef.current = true
      setProcessing(true)
      setErrorMsg('')
      setCard(null)

      // 1. Look up student
      let personType: 'student' | 'teacher' | null = null
      let personDbId = ''
      let personName = ''
      let className = ''
      let photoUrl = ''
      let studentClassId = ''

      const { data: student } = await (isUniqueFormat
        ? supabase.from('students').select('id, full_name, photo_url, class_id, class:classes(name)').eq('id', code).maybeSingle()
        : supabase.from('students').select('id, full_name, photo_url, class_id, class:classes(name)').eq('school_id', schoolId).eq('student_id', code).maybeSingle())

      if (student) {
        personType = 'student'
        personDbId = student.id
        personName = student.full_name
        className = (student as any).class?.name ?? 'No Class'
        photoUrl = student.photo_url ?? ''
        studentClassId = student.class_id ?? ''
      } else {
        const { data: teacher } = await (isUniqueFormat
          ? supabase.from('teachers').select('id, user:users(full_name, avatar_url)').eq('id', code).maybeSingle()
          : supabase.from('teachers').select('id, user:users(full_name, avatar_url)').eq('school_id', schoolId).eq('staff_id', code).maybeSingle())

        if (teacher) {
          personType = 'teacher'
          personDbId = teacher.id
          personName = (teacher as any).user?.full_name ?? 'Staff'
          photoUrl = (teacher as any).user?.avatar_url ?? ''
          className = 'Teaching Staff'
        }
      }

      if (!personType) {
        // Check if it's a Visitor Checkout
        if (code.startsWith('VISITOR:')) {
          const vId = code.replace('VISITOR:', '')
          const { data: vis } = await supabase.from('visitors').select('id, full_name, time_out').eq('id', vId).maybeSingle()
          if (vis && !vis.time_out) {
            await supabase.from('visitors').update({ time_out: new Date().toISOString() }).eq('id', vis.id)
            playBeep()
            showCard({ name: vis.full_name, personType: 'visitor', className: 'Visitor Check-Out', photoUrl: '', direction: 'out', status: 'on_time', scanTime: format(new Date(), 'hh:mm:ss a') }, 'success')
            setProcessing(false)
            processingRef.current = false
            setUsbInput('')
            return
          }
        }

        // Otherwise, pop up visitor form for unknown code
        playBeep()
        setVisitorFormOpen(true)
        setVisitorForm({ full_name: '', phone: '', purpose: 'Parent Visit', person_to_see: '', id_number: code, host_department: '' })
        
        setProcessing(false)
        processingRef.current = false
        setUsbInput('')
        return
      }

      // 2. Check today's last scan
      const today = new Date().toISOString().split('T')[0]
      const { data: todayScans } = await supabase
        .from('gate_scans')
        .select('direction, scan_time')
        .eq('school_id', schoolId)
        .eq('person_db_id', personDbId)
        .eq('scan_date', today)
        .order('scan_time', { ascending: false })
        .limit(1)

      const lastScan = todayScans?.[0]

      // If last scan was 'out', mark as 'in' (re-entry). No block.
      const direction: 'in' | 'out' = !lastScan || lastScan.direction === 'out' ? 'in' : 'out'

      // 3. Determine status
      const now = new Date()
      // Parse lateTimeStr (format HH:mm:ss or HH:mm)
      const lateTime = parse(lateTimeStr.slice(0, 5), 'HH:mm', now)
      const isLate = direction === 'in' && now > lateTime
      const status: 'on_time' | 'late' = isLate ? 'late' : 'on_time'

      // 4. Save scan
      await supabase.from('gate_scans').insert({
        school_id: schoolId,
        person_id: code,
        person_type: personType,
        person_db_id: personDbId,
        person_name: personName,
        class_name: className,
        photo_url: photoUrl,
        direction,
        status,
        scanned_by: user?.id,
      })

      // 5. Sync to Academic Attendance (only for first student 'in' of the day)
      if (personType === 'student' && direction === 'in' && !lastScan) {
        try {
          // Fetch term fresh at scan-time — do NOT rely on hook closure which may be null
          const { data: currentTerm } = await supabase
            .from('terms')
            .select('id')
            .eq('school_id', schoolId)
            .eq('is_current', true)
            .maybeSingle()

          if (!currentTerm) {
            console.warn('[Scanner] No current term set — gate scan recorded but academic attendance skipped.')
            toast(`⚠️ No active term set. Gate scan saved, but academic register not updated.`, { duration: 4000 })
          } else {
            // Check if already has an academic record for today
            const { data: existingRec } = await supabase
              .from('attendance_records')
              .select('id')
              .eq('student_id', personDbId)
              .eq('date', today)
              .maybeSingle()

            if (!existingRec) {
              const { error: insErr } = await supabase.from('attendance_records').insert({
                student_id: personDbId,
                class_id: studentClassId,
                term_id: currentTerm.id,
                school_id: schoolId,
                date: today,
                status: status === 'late' ? 'late' : 'present',
                notes: 'Recorded via Gate Scanner'
              })

              if (insErr) {
                console.error('[Scanner] attendance_records insert failed:', insErr)
                toast(`⚠️ Gate scan saved, but register sync failed: ${insErr.message}`, { duration: 5000 })
              } else {
                // Update term totals
                const { data: attTotal } = await supabase
                  .from('attendance')
                  .select('id, total_days, days_present, days_absent')
                  .eq('student_id', personDbId)
                  .eq('term_id', currentTerm.id)
                  .maybeSingle()

                if (attTotal) {
                  await supabase.from('attendance').update({
                    total_days: (attTotal.total_days ?? 0) + 1,
                    days_present: (attTotal.days_present ?? 0) + 1,
                  }).eq('id', attTotal.id)
                } else {
                  await supabase.from('attendance').insert({
                    student_id: personDbId,
                    term_id: currentTerm.id,
                    school_id: schoolId,
                    total_days: 1,
                    days_present: 1,
                    days_absent: 0,
                  })
                }
              }
            }
          }
        } catch (e) {
          console.error('[Scanner] Academic attendance sync error:', e)
          toast(`⚠️ Register sync error — gate scan still saved.`, { duration: 4000 })
        }
      }

      // 6. Record cooldown
      lastScanMap.current.set(code, Date.now())

      // 7. Show card & Play Beep
      playBeep()
      showCard({ name: personName, personType, className, photoUrl, direction, status, scanTime: format(now, 'hh:mm:ss a') }, 'success')
    } catch (e: any) {
      console.error('Scan process error:', e)
      setErrorMsg('Scan failed — please try again')
    } finally {
      setProcessing(false)
      processingRef.current = false
      setUsbInput('')
    }
  }, [schoolId, user?.id, (settings as any)?.late_arrival_time, (settings as any)?.scan_cooldown_seconds, (term as any)?.id])

  // Camera scanner automatic start
  useEffect(() => {
    if (mode !== 'camera') return
    
    let isMounted = true
    let scanner: Html5Qrcode | null = null

    async function start() {
      if (!isMounted) return
      
      try {
        // 1. Get cameras first (static call, no DOM dependency)
        const cameras = await Html5Qrcode.getCameras()
        if (!isMounted) return

        if (!cameras || cameras.length === 0) {
          setCameraError('No cameras found')
          return
        }

        // 2. Wait for the element to be ready and have dimensions
        // This is crucial for html5-qrcode to avoid "clientWidth of null" errors
        const getEl = () => document.getElementById('qr-reader')
        const isReady = () => {
          const el = getEl()
          return el && el.clientWidth > 0
        }

        if (!isReady()) {
          let attempts = 0
          while (!isReady() && attempts < 30 && isMounted) {
            await new Promise(r => setTimeout(r, 100))
            attempts++
          }
        }

        if (!isMounted || !isReady()) return

        // 3. Cleanup previous instance properly
        if (scannerRef.current) {
          try {
            if (scannerRef.current.isScanning) {
              await scannerRef.current.stop()
            }
            // Some versions of html5-qrcode need clear() or just stop()
            try { (scannerRef.current as any).clear() } catch(e) {}
          } catch (e) {
            console.warn('Scanner cleanup error:', e)
          }
        }

        // 4. Initialize and start
        const backCam = cameras.find(c => c.label.toLowerCase().includes('back')) || cameras[0]
        
        // Final check immediately before creation to ensure element wasn't removed
        if (!isMounted || !getEl()) return
        
        const newScanner = new Html5Qrcode('qr-reader')
        scannerRef.current = newScanner
        scanner = newScanner // for the cleanup closure

        await newScanner.start(
          backCam.id,
          {
            fps: 15,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (text) => { if (!processingRef.current) processBarcode(text) },
          () => {}
        )
        
        if (isMounted) setCameraError('')
      } catch (err: any) {
        // Only report error if still mounted (ignore race-condition errors during unmount)
        if (isMounted) {
          console.error('Camera start fail:', err)
          setCameraError('Camera access denied or already in use')
        }
      }
    }

    start()

    return () => {
      isMounted = false
      if (scanner) {
        if (scanner.isScanning) {
          scanner.stop().catch(e => console.log('Stop error', e))
        }
      }
    }
  }, [mode, processBarcode])

  useEffect(() => {
    if (mode === 'usb') setTimeout(() => usbRef.current?.focus(), 100)
  }, [mode])

  function handleUsbChange(val: string) {
    setUsbInput(val)
    if (usbTimer.current) clearTimeout(usbTimer.current)
    const cleaned = val.replace(/[\n\r]/g, '')
    if (val.includes('\n') || val.includes('\r')) {
      processBarcode(cleaned)
      return
    }
    usbTimer.current = setTimeout(() => {
      if (cleaned.length >= 3) processBarcode(cleaned)
    }, 150)
  }

  const dirColor = card?.direction === 'in' ? { bg: '#ecfdf5', border: '#6ee7b7', text: '#059669' } : { bg: '#eff6ff', border: '#93c5fd', text: '#2563eb' }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800;900&display=swap');
        @keyframes sc_pop { 0%{opacity:0;transform:scale(.8) translateY(24px)} 70%{transform:scale(1.04) translateY(-4px)} 100%{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes sc_shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }
        @keyframes sc_spin { to{transform:rotate(360deg)} }
        @keyframes sc_pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        @keyframes sc_scan { 0%{top:0} 100%{top:100%} }
        .sc-card { animation: sc_pop .4s cubic-bezier(.34,1.56,.64,1) forwards; }
        .sc-err { animation: sc_shake .4s ease; }
        #qr-reader { border: none !important; width: 100% !important; background: #000; position: relative; }
        #qr-reader video { border-radius: 8px !important; width: 100% !important; object-fit: cover; }
        .qr-hud { position: absolute; top: 0; left: 0; right: 0; bottom: 0; border: 2px solid rgba(255,255,255,0.2); border-radius: 8px; pointer-events: none; z-index: 10; display: flex; align-items: center; justify-content: center; }
        .qr-line { position: absolute; left: 10%; right: 10%; height: 2px; background: rgba(34,197,94,0.5); box-shadow: 0 0 8px rgba(34,197,94,0.8); animation: sc_scan 2s linear infinite; }
        #qr-reader__dashboard { display: none !important; }
        @media (max-width: 480px) {
          .sc-h1 { font-size: 22px !important; }
          .sc-qrbox div { width: 200px !important; height: 200px !important; }
        }
      `}</style>

      <div style={{ fontFamily: '"DM Sans",sans-serif', maxWidth: 500, margin: '0 auto', paddingBottom: 100, paddingLeft: 4, paddingRight: 4 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#0f172a', color: '#fff', padding: '7px 18px', borderRadius: 99, fontSize: 12, fontWeight: 700, marginBottom: 10 }}>
            <QrCode size={14} /> GATE SCANNER
          </div>
          <h1 className="sc-h1" style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', margin: '0 0 4px' }}>Scan to Mark Attendance</h1>
          <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
            {format(new Date(), 'EEE, MMM d · hh:mm a')}
          </p>
        </div>

        {/* Mode Toggle */}
        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 4, marginBottom: 20, gap: 4 }}>
          {[{ id: 'camera', label: '📷 Camera', icon: Camera }, { id: 'usb', label: '🔌 USB Scanner', icon: Usb }].map(({ id, label }) => (
            <button key={id} onClick={() => setMode(id as any)} style={{ flex: 1, padding: '11px', borderRadius: 12, border: 'none', fontFamily: '"DM Sans",sans-serif', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all .15s', background: mode === id ? '#fff' : 'transparent', color: mode === id ? '#0f172a' : '#64748b', boxShadow: mode === id ? '0 2px 12px rgba(0,0,0,0.1)' : 'none' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Camera Mode */}
        {mode === 'camera' && (
          <div style={{ background: '#000', borderRadius: 12, border: '1.5px solid #f1f5f9', overflow: 'hidden', marginBottom: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.1)', position: 'relative' }}>
            {cameraError ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: '#fca5a5' }}>
                <AlertTriangle size={48} style={{ marginBottom: 12, opacity: 0.5 }} />
                <div style={{ fontSize: 16, fontWeight: 800 }}>Camera Error</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>{cameraError}</div>
                <button onClick={() => window.location.reload()} style={{ marginTop: 16, padding: '8px 16px', borderRadius: 8, background: 'var(--bg-card)', color: '#dc2626', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Retry</button>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <div id="qr-reader" />
                <div className="qr-hud">
                  <div className="qr-line" />
                  <div className="sc-qrbox" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 'min(250px, 65vw)', height: 'min(250px, 65vw)', border: '2px solid #22c55e', borderRadius: 8, boxShadow: '0 0 0 4000px rgba(0,0,0,0.4)' }} />
                </div>
              </div>
            )}
            <div style={{ padding: '12px 20px', background: '#0f172a', fontSize: 11, color: '#94a3b8', textAlign: 'center', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Volume2 size={12} /> BEEP SOUND ENABLED · AUTO-RECORDING ACTIVE
            </div>
          </div>
        )}

        {/* USB Mode */}
        {mode === 'usb' && (
          <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1.5px solid #f1f5f9', padding: '28px', marginBottom: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 72, height: 72, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 36 }}>🔌</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>USB / Bluetooth Scanner Ready</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>Scan a barcode or type ID manually below. Auto-submits after scan.</div>
            </div>
            <input
              ref={usbRef}
              value={usbInput}
              onChange={e => handleUsbChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && processBarcode(usbInput)}
              placeholder="Scan barcode or type ID here…"
              autoFocus
              style={{ width: '100%', padding: '16px', borderRadius: 14, border: '2px solid #334155', fontSize: 16, fontWeight: 700, outline: 'none', boxSizing: 'border-box', textAlign: 'center', letterSpacing: '0.08em', color: '#0f172a', fontFamily: '"DM Sans",sans-serif' }}
            />
            <button onClick={() => processBarcode(usbInput)} disabled={!usbInput.trim() || processing}
              style={{ width: '100%', marginTop: 12, padding: '14px', borderRadius: 14, border: 'none', background: usbInput.trim() && !processing ? '#0f172a' : '#e2e8f0', color: usbInput.trim() && !processing ? '#fff' : '#94a3b8', fontSize: 14, fontWeight: 800, cursor: usbInput.trim() && !processing ? 'pointer' : 'not-allowed', fontFamily: '"DM Sans",sans-serif', transition: 'all .15s' }}>
              {processing ? '⏳ Processing…' : '→ Record Attendance'}
            </button>
          </div>
        )}

        {/* Processing Spinner */}
        {processing && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, color: '#64748b', fontSize: 14, fontWeight: 600 }}>
            <span style={{ width: 18, height: 18, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#334155', display: 'inline-block', animation: 'sc_spin .7s linear infinite' }} />
            Looking up ID in database…
          </div>
        )}

        {/* Error Card */}
        {errorMsg && !processing && !card && (
          <div className="sc-err" style={{ background: '#fef2f2', border: '2px solid #fca5a5', borderRadius: 8, padding: '20px', display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <XCircle size={24} color="#dc2626" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#dc2626' }}>ID Not Recognised</div>
              <div style={{ fontSize: 13, color: '#b91c1c', marginTop: 4 }}>{errorMsg}</div>
              <div style={{ fontSize: 11, color: '#f87171', marginTop: 6 }}>Make sure the student/staff ID barcode is printed on their card.</div>
            </div>
          </div>
        )}

        {/* Scan Result Card */}
        {card && !processing && (
          <div className="sc-card" style={{
            borderRadius: 12, padding: '24px',
            background: cardType === 'success' ? dirColor.bg : '#fef2f2',
            border: `2px solid ${cardType === 'success' ? dirColor.border : '#fca5a5'}`,
            boxShadow: `0 12px 40px ${cardType === 'success' ? 'rgba(0,0,0,0.08)' : 'rgba(220,38,38,0.15)'}`,
            marginBottom: 16,
          }}>
            {/* Person info row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              {card.photoUrl ? (
                <img src={card.photoUrl} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: card.direction === 'in' ? '#059669' : '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900, color: '#fff', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                  {card.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', lineHeight: 1.1, marginBottom: 4 }}>{card.name}</div>
                <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {card.personType === 'student' ? '🎓' : card.personType === 'teacher' ? '👨‍🏫' : '🪪'} 
                  <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: 6, color: '#475569' }}>
                    {card.className}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
              {/* Direction */}
              <div style={{ background: 'rgba(255,255,255,0.8)', borderRadius: 14, padding: '12px 8px', textAlign: 'center' }}>
                <div style={{ marginBottom: 4 }}>
                  {card.direction === 'in'
                    ? <LogIn size={22} color="#059669" style={{ margin: '0 auto' }} />
                    : <LogOut size={22} color="#2563eb" style={{ margin: '0 auto' }} />}
                </div>
                <div style={{ fontSize: 16, fontWeight: 900, color: card.direction === 'in' ? '#059669' : '#2563eb' }}>
                  {card.direction === 'in' ? 'IN' : 'OUT'}
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>Direction</div>
              </div>
              {/* Status */}
              <div style={{ background: 'rgba(255,255,255,0.8)', borderRadius: 14, padding: '12px 8px', textAlign: 'center' }}>
                <div style={{ marginBottom: 4 }}>
                  {card.status === 'late'
                    ? <AlertTriangle size={22} color="#d97706" style={{ margin: '0 auto' }} />
                    : <CheckCircle size={22} color="#059669" style={{ margin: '0 auto' }} />}
                </div>
                <div style={{ fontSize: 16, fontWeight: 900, color: card.status === 'late' ? '#d97706' : '#059669' }}>
                  {card.status === 'late' ? 'LATE' : 'ON TIME'}
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>Status</div>
              </div>
              {/* Time */}
              <div style={{ background: 'rgba(255,255,255,0.8)', borderRadius: 14, padding: '12px 8px', textAlign: 'center' }}>
                <div style={{ marginBottom: 4 }}><Clock size={22} color="#334155" style={{ margin: '0 auto' }} /></div>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#334155' }}>{card.scanTime.split(' ')[0]}</div>
                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>{card.scanTime.split(' ')[1]}</div>
              </div>
            </div>

            {/* Success footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px', background: 'rgba(255,255,255,0.6)', borderRadius: 12 }}>
              <CheckCircle size={16} color={dirColor.text} />
              <span style={{ fontSize: 13, fontWeight: 700, color: dirColor.text }}>
                Attendance recorded · Ready for next scan
              </span>
            </div>
          </div>
        )}

        {/* Mini Today Stats */}
        <TodayStats schoolId={schoolId} />
        {/* Sound toggle hidden but available if needed */}
      </div>

      {/* ── Visitor Sign In Modal ── */}
      {visitorFormOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 9999 }}
          onClick={e => { if (e.target === e.currentTarget) setVisitorFormOpen(false) }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: '22px 22px 0 0', padding: '24px 20px 90px', width: '100%', maxWidth: 500, maxHeight: '92vh', overflowY: 'auto', boxSizing: 'border-box', animation: 'ss_pop .25s ease' }}>
            <div style={{ width: 40, height: 4, borderRadius: 4, background: '#e2e8f0', margin: '0 auto 20px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: 0 }}>Unrecognized ID Scanned</h2>
                <p style={{ fontSize: 12, color: '#64748b', margin: '3px 0 0' }}>Register this person as a new visitor.</p>
              </div>
              <button onClick={() => setVisitorFormOpen(false)} style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: '#f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
            </div>

            {/* Purpose */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: '#334155', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>Purpose of Visit *</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {PURPOSES.map(p => (
                  <button key={p} onClick={() => setVisitorForm(f => ({ ...f, purpose: p }))}
                    style={{ padding: '6px 12px', borderRadius: 99, border: `1.5px solid ${visitorForm.purpose === p ? '#0f172a' : '#e2e8f0'}`, background: visitorForm.purpose === p ? '#0f172a' : '#fff', color: visitorForm.purpose === p ? '#fff' : '#334155', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {[
              { label: 'Full Name *', key: 'full_name', placeholder: 'e.g. Kwame Mensah' },
              { label: 'Phone Number', key: 'phone', placeholder: '0244 000 000' },
              { label: 'Person to See', key: 'person_to_see', placeholder: 'Teacher name, Admin Office…' },
              { label: 'ID / Scanned Code', key: 'id_number', placeholder: 'GHA-000000000-0' },
              { label: 'Department / Block', key: 'host_department', placeholder: 'Main Office, Block A…' },
            ].map(({ label, key, placeholder }) => (
              <div key={key} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#334155', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</label>
                <input value={(visitorForm as any)[key]} onChange={e => setVisitorForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: '"DM Sans",sans-serif' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#0f172a'}
                  onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'} />
              </div>
            ))}

            <button onClick={submitVisitor} disabled={visitorSaving || !visitorForm.full_name.trim()}
              style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: visitorSaving || !visitorForm.full_name.trim() ? '#e2e8f0' : '#0f172a', color: visitorSaving || !visitorForm.full_name.trim() ? '#94a3b8' : '#fff', fontSize: 14, fontWeight: 800, cursor: visitorSaving || !visitorForm.full_name.trim() ? 'not-allowed' : 'pointer', marginTop: 8, fontFamily: '"DM Sans",sans-serif' }}>
              {visitorSaving ? 'Signing In…' : '🪪 Sign In & Print Badge'}
            </button>
          </div>
        </div>
      )}

      {/* ── Badge Preview Modal ── */}
      {printingVisitor && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setPrintingVisitor(null) }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 12, maxWidth: 360, width: '100%', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.3)', animation: 'ss_pop .2s ease' }}>
            <div style={{ background: '#0f172a', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,.5)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Badge Preview</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>🪪 VISITOR PASS</div>
              </div>
              <button onClick={() => setPrintingVisitor(null)} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,.1)', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
            </div>

            <div style={{ padding: '24px 24px 16px' }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 900, color: '#2563eb', flexShrink: 0, border: '3px solid #0f172a' }}>
                  {printingVisitor.full_name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a' }}>{printingVisitor.full_name}</div>
                  <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>{printingVisitor.purpose}</div>
                </div>
              </div>

              {[
                { l: 'Date', v: format(new Date(printingVisitor.time_in), 'MMM d, yyyy') },
                { l: 'Time In', v: format(new Date(printingVisitor.time_in), 'hh:mm a') },
                printingVisitor.person_to_see ? { l: 'Seeing', v: printingVisitor.person_to_see } : null,
                printingVisitor.id_number ? { l: 'ID No.', v: printingVisitor.id_number } : null,
              ].filter(Boolean).map((row: any) => (
                <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '5px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em' }}>{row.l}</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{row.v}</span>
                </div>
              ))}

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 16, gap: 4 }}>
                <QRImg value={`VISITOR:${printingVisitor.id}`} size={90} />
                <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase' }}>Scan to sign out</div>
              </div>
            </div>

            <div style={{ background: '#dc2626', padding: '8px', textAlign: 'center', fontSize: 10, fontWeight: 800, color: '#fff', letterSpacing: '.08em' }}>
              MUST BE WORN & VISIBLE AT ALL TIMES
            </div>

            <div style={{ padding: '16px 24px', display: 'flex', gap: 8 }}>
              <button onClick={() => setPrintingVisitor(null)} style={{ flex: 1, padding: '11px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: 'var(--bg-card)', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: '#334155' }}>Close</button>
              <button onClick={printBadge} style={{ flex: 2, padding: '11px', borderRadius: 12, border: 'none', background: '#0f172a', fontSize: 13, fontWeight: 800, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                <Printer size={15} /> Print Badge
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function TodayStats({ schoolId }: { schoolId: string }) {
  const [s, setS] = useState({ total: 0, in: 0, out: 0, late: 0 })
  useEffect(() => {
    if (!schoolId) return
    const today = new Date().toISOString().split('T')[0]
    const load = async () => {
      const { data } = await supabase.from('gate_scans').select('direction,status').eq('school_id', schoolId).eq('scan_date', today)
      const d = data ?? []
      setS({ total: d.length, in: d.filter((x: any) => x.direction === 'in').length, out: d.filter((x: any) => x.direction === 'out').length, late: d.filter((x: any) => x.status === 'late').length })
    }
    load()
    // Subscribe to new scans
    const ch = supabase.channel('scanner-stats').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'gate_scans', filter: `school_id=eq.${schoolId}` }, load).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [schoolId])

  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1.5px solid #f1f5f9', padding: '16px 20px' }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>Today's Stats</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
        {[
          { label: 'Scans', value: s.total, color: '#334155', bg: '#f1f5f9' },
          { label: 'In', value: s.in, color: '#059669', bg: '#dcfce7' },
          { label: 'Out', value: s.out, color: '#2563eb', bg: '#dbeafe' },
          { label: 'Late', value: s.late, color: '#d97706', bg: '#fef3c7' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} style={{ background: bg, borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color }}>{value}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
