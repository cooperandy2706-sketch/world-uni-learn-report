// src/pages/security/ScannerPage.tsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { QrCode, Usb, Camera, CheckCircle, XCircle, Clock, LogIn, LogOut, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const LATE_HOUR = 8
const DUPLICATE_COOLDOWN_MS = 30_000

interface ScanCard {
  name: string
  personType: 'student' | 'teacher'
  className: string
  photoUrl: string
  direction: 'in' | 'out'
  status: 'on_time' | 'late'
  scanTime: string
  alreadyOut?: boolean
}

export default function ScannerPage() {
  const { user } = useAuth()
  const schoolId = user?.school_id ?? ''
  const [mode, setMode] = useState<'camera' | 'usb'>('camera')
  const [card, setCard] = useState<ScanCard | null>(null)
  const [cardType, setCardType] = useState<'success' | 'error' | 'warning'>('success')
  const [errorMsg, setErrorMsg] = useState('')
  const [processing, setProcessing] = useState(false)
  const [usbInput, setUsbInput] = useState('')
  const usbRef = useRef<HTMLInputElement>(null)
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const lastScanMap = useRef<Map<string, number>>(new Map())
  const cardTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const usbTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const processingRef = useRef(false)

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

    // Duplicate cooldown per ID
    const lastTime = lastScanMap.current.get(code)
    if (lastTime && Date.now() - lastTime < DUPLICATE_COOLDOWN_MS) {
      const secsLeft = Math.ceil((DUPLICATE_COOLDOWN_MS - (Date.now() - lastTime)) / 1000)
      toast(`⏳ Wait ${secsLeft}s before scanning again`, { duration: 2000, icon: '⏱️' })
      setUsbInput('')
      return
    }

    processingRef.current = true
    setProcessing(true)
    setErrorMsg('')
    setCard(null)

    try {
      // 1. Look up student
      let personType: 'student' | 'teacher' | null = null
      let personDbId = ''
      let personName = ''
      let className = ''
      let photoUrl = ''

      const { data: student } = await (isUniqueFormat
        ? supabase.from('students').select('id, full_name, photo_url, class:classes(name)').eq('id', code).maybeSingle()
        : supabase.from('students').select('id, full_name, photo_url, class:classes(name)').eq('school_id', schoolId).eq('student_id', code).maybeSingle())

      if (student) {
        personType = 'student'
        personDbId = student.id
        personName = student.full_name
        className = (student as any).class?.name ?? 'No Class'
        photoUrl = student.photo_url ?? ''
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
        setErrorMsg(`Unknown ID: "${code}" — not found in students or staff.`)
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
      const isLate = direction === 'in' && now.getHours() >= LATE_HOUR
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

      // 5. Record cooldown
      lastScanMap.current.set(code, Date.now())

      // 6. Show card
      showCard({ name: personName, personType, className, photoUrl, direction, status, scanTime: format(now, 'hh:mm:ss a') }, 'success')
    } catch {
      setErrorMsg('Scan failed — please try again')
    } finally {
      setProcessing(false)
      processingRef.current = false
      setUsbInput('')
    }
  }, [schoolId, user?.id])

  // Camera scanner
  useEffect(() => {
    if (mode !== 'camera') return
    const el = document.getElementById('qr-reader')
    if (!el) return
    const scanner = new Html5QrcodeScanner('qr-reader', {
      fps: 15,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      showTorchButtonIfSupported: true,
      formatsToSupport: [
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
      ],
    }, false)
    scanner.render(
      (text) => { if (!processingRef.current) processBarcode(text) },
      () => {}
    )
    scannerRef.current = scanner
    return () => { scanner.clear().catch(() => {}) }
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
        .sc-card { animation: sc_pop .4s cubic-bezier(.34,1.56,.64,1) forwards; }
        .sc-err { animation: sc_shake .4s ease; }
        #qr-reader { border: none !important; width: 100% !important; }
        #qr-reader video { border-radius: 20px !important; width: 100% !important; }
        #qr-reader__scan_region { border-radius: 20px !important; }
        #qr-reader__dashboard { padding: 12px 16px !important; }
        #qr-reader__dashboard_section_csr button { background: #0f172a !important; border-radius: 10px !important; color: #fff !important; border: none !important; padding: 8px 16px !important; font-weight: 700 !important; cursor: pointer !important; }
      `}</style>

      <div style={{ fontFamily: '"DM Sans",sans-serif', maxWidth: 500, margin: '0 auto', paddingBottom: 100 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#0f172a', color: '#fff', padding: '7px 18px', borderRadius: 99, fontSize: 12, fontWeight: 700, marginBottom: 10 }}>
            <QrCode size={14} /> GATE SCANNER
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', margin: '0 0 4px' }}>Scan to Mark Attendance</h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
            {format(new Date(), 'EEEE, MMMM d · hh:mm a')}
          </p>
        </div>

        {/* Mode Toggle */}
        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 16, padding: 4, marginBottom: 20, gap: 4 }}>
          {[{ id: 'camera', label: '📷 Camera', icon: Camera }, { id: 'usb', label: '🔌 USB Scanner', icon: Usb }].map(({ id, label }) => (
            <button key={id} onClick={() => setMode(id as any)} style={{ flex: 1, padding: '11px', borderRadius: 12, border: 'none', fontFamily: '"DM Sans",sans-serif', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all .15s', background: mode === id ? '#fff' : 'transparent', color: mode === id ? '#0f172a' : '#64748b', boxShadow: mode === id ? '0 2px 12px rgba(0,0,0,0.1)' : 'none' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Camera Mode */}
        {mode === 'camera' && (
          <div style={{ background: '#fff', borderRadius: 24, border: '1.5px solid #f1f5f9', overflow: 'hidden', marginBottom: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            <div id="qr-reader" />
            <div style={{ padding: '12px 20px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', fontSize: 12, color: '#94a3b8', textAlign: 'center', fontWeight: 600 }}>
              Point camera at any QR code or barcode · Supports CODE-128, EAN, QR
            </div>
          </div>
        )}

        {/* USB Mode */}
        {mode === 'usb' && (
          <div style={{ background: '#fff', borderRadius: 24, border: '1.5px solid #f1f5f9', padding: '28px', marginBottom: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 72, height: 72, borderRadius: 20, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 36 }}>🔌</div>
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
          <div className="sc-err" style={{ background: '#fef2f2', border: '2px solid #fca5a5', borderRadius: 20, padding: '20px', display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 16 }}>
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
            borderRadius: 24, padding: '24px',
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
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', lineHeight: 1.2 }}>{card.name}</div>
                <div style={{ fontSize: 13, color: '#475569', marginTop: 3 }}>
                  {card.personType === 'student' ? '🎓 Student' : '👩‍🏫 Teacher'} · {card.className}
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
      </div>
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
    <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #f1f5f9', padding: '16px 20px' }}>
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
