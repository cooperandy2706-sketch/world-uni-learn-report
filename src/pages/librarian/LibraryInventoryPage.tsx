// src/pages/librarian/LibraryInventoryPage.tsx
// Print mini QR codes for all books + scan-to-count inventory mode
import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { Html5Qrcode } from 'html5-qrcode'
import { Printer, Search, ScanLine, Camera, Package, CheckCircle, AlertTriangle, X } from 'lucide-react'
import toast from 'react-hot-toast'

function BookQR({ barcode, title, size = 70 }: { barcode: string; title: string; size?: number }) {
  const encoded = encodeURIComponent(barcode)
  return (
    <div style={{ textAlign: 'center', breakInside: 'avoid' }}>
      <img
        src={`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&margin=2`}
        width={size} height={size}
        style={{ imageRendering: 'pixelated', display: 'block', margin: '0 auto' }}
        alt={barcode}
      />
    </div>
  )
}

type Book = {
  id: string; title: string; author: string; barcode: string
  copies_total: number; copies_available: number; category: string; location: string
}

export default function LibraryInventoryPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [mode, setMode] = useState<'list' | 'scan'>('list')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [scanCount, setScanCount] = useState<Record<string, number>>({}) // barcode → count seen
  const [lastScanned, setLastScanned] = useState<Book | null>(null)
  const [cameraError, setCameraError] = useState('')
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const processingRef = useRef(false)
  const cooldownRef = useRef<Map<string, number>>(new Map())

  const { data: books = [], isLoading } = useQuery({
    queryKey: ['library-books-inv', user?.school_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('library_books').select('*')
        .eq('school_id', user!.school_id!)
        .order('title')
      return (data ?? []) as Book[]
    },
    enabled: !!user?.school_id,
  })

  const filtered = books.filter(b =>
    b.title?.toLowerCase().includes(search.toLowerCase()) ||
    b.barcode?.toLowerCase().includes(search.toLowerCase()) ||
    b.author?.toLowerCase().includes(search.toLowerCase()) ||
    b.category?.toLowerCase().includes(search.toLowerCase())
  )

  // Toggle all/none for print selection
  const allSelected = filtered.length > 0 && filtered.every(b => selected.has(b.id))
  function toggleAll() {
    if (allSelected) {
      setSelected(prev => { const s = new Set(prev); filtered.forEach(b => s.delete(b.id)); return s })
    } else {
      setSelected(prev => { const s = new Set(prev); filtered.forEach(b => s.add(b.id)); return s })
    }
  }
  function toggleBook(id: string) {
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }

  // ── Scan-to-count inventory logic ──
  const processBarcode = useCallback(async (code: string) => {
    if (processingRef.current) return
    const now = Date.now()
    const last = cooldownRef.current.get(code) ?? 0
    if (now - last < 2000) return  // 2s cooldown per barcode
    cooldownRef.current.set(code, now)
    processingRef.current = true

    const book = books.find(b => b.barcode === code)
    if (!book) {
      toast.error(`Unknown barcode: ${code}`, { id: 'inv-err' })
      processingRef.current = false
      return
    }

    setScanCount(prev => ({ ...prev, [code]: (prev[code] ?? 0) + 1 }))
    setLastScanned(book)
    toast.success(`✓ ${book.title}`, { id: 'inv-ok', duration: 1500 })
    processingRef.current = false
  }, [books])

  // Camera start/stop for inventory scan mode
  useEffect(() => {
    if (mode !== 'scan') return
    let isMounted = true
    let scanner: Html5Qrcode | null = null

    async function start() {
      try {
        const cameras = await Html5Qrcode.getCameras()
        if (!cameras?.length) { setCameraError('No cameras found'); return }

        const el = document.getElementById('inv-qr-reader')
        if (!el || !isMounted) return

        const backCam = cameras.find(c => c.label.toLowerCase().includes('back')) || cameras[0]
        const newScanner = new Html5Qrcode('inv-qr-reader')
        scannerRef.current = newScanner
        scanner = newScanner

        await newScanner.start(backCam.id, { fps: 10, qrbox: { width: 200, height: 200 } },
          (text) => { if (!processingRef.current) processBarcode(text) },
          () => {}
        )
        if (isMounted) setCameraError('')
      } catch (err: any) {
        if (isMounted) setCameraError('Camera access denied or already in use')
      }
    }

    // Wait for DOM
    const t = setTimeout(start, 300)
    return () => {
      isMounted = false
      clearTimeout(t)
      if (scanner?.isScanning) scanner.stop().catch(() => {})
    }
  }, [mode, processBarcode])

  // ── Print selected books QR codes ──
  function printSelected() {
    const toPrint = books.filter(b => selected.has(b.id))
    if (!toPrint.length) { toast.error('Select at least one book first'); return }

    const printWin = window.open('', '_blank', 'width=800,height=600')
    if (!printWin) { toast.error('Allow pop-ups to print'); return }

    const items = toPrint.flatMap(b => {
      const numCopies = Math.max(1, b.copies_available || 1)
      return Array.from({ length: numCopies }).map(() => `
        <div class="label">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(b.barcode)}&margin=1" width="80" height="80" />
          <div class="book-title">${b.title.length > 22 ? b.title.slice(0, 22) + '…' : b.title}</div>
          <div class="book-sub">${b.barcode}</div>
          <div class="book-sub">${b.location || b.category || ''}</div>
        </div>
      `)
    }).join('')

    printWin.document.write(`
      <html><head><title>Book QR Labels</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: #fff; padding: 12px; }
        .grid { display: flex; flex-wrap: wrap; gap: 6px; }
        .label { border: 1.5px dashed #999; border-radius: 8px; padding: 8px 6px; width: 108px; text-align: center; page-break-inside: avoid; }
        .label img { image-rendering: pixelated; margin-bottom: 4px; }
        .book-title { font-size: 8.5px; font-weight: 700; color: #1e293b; line-height: 1.2; margin-bottom: 2px; }
        .book-sub { font-size: 7.5px; color: #64748b; }
        @media print { body { padding: 4px; } }
      </style></head>
      <body>
        <div class="grid">${items}</div>
        <script>window.onload=()=>{window.print();setTimeout(()=>window.close(),500)}<\/script>
      </body></html>
    `)
    printWin.document.close()
  }

  // ── Commit inventory counts to DB ──
  async function commitInventory() {
    const entries = Object.entries(scanCount)
    if (!entries.length) { toast.error('No scans to commit'); return }
    let updated = 0
    for (const [barcode, count] of entries) {
      const book = books.find(b => b.barcode === barcode)
      if (!book) continue
      await supabase.from('library_books')
        .update({ copies_available: count })
        .eq('id', book.id)
        .eq('school_id', user!.school_id!)
      updated++
    }
    toast.success(`✅ Inventory updated for ${updated} book${updated > 1 ? 's' : ''}`)
    qc.invalidateQueries({ queryKey: ['library-books-inv'] })
    setScanCount({})
    setLastScanned(null)
  }

  const scannedBooks = Object.entries(scanCount).map(([barcode, count]) => ({
    book: books.find(b => b.barcode === barcode),
    count
  })).filter(x => x.book)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800;900&display=swap');
        @keyframes inv_pop { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes inv_spin { to{transform:rotate(360deg)} }
        @keyframes inv_scan { 0%{top:0} 100%{top:100%} }
        .inv-row:hover { background: #f8fafc !important; }
        #inv-qr-reader { border: none !important; width: 100% !important; background: #000; }
        #inv-qr-reader video { width: 100% !important; border-radius: 8px !important; object-fit: cover; }
        #inv-qr-reader__dashboard { display: none !important; }
        @media (max-width: 600px) { .inv-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      <div style={{ fontFamily: '"DM Sans",sans-serif', maxWidth: 1000, margin: '0 auto', paddingBottom: 90 }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#7c3aed', color: '#fff', padding: '5px 14px', borderRadius: 99, fontSize: 11, fontWeight: 800, marginBottom: 8, letterSpacing: '.05em' }}>
            <Package size={12} /> LIBRARY INVENTORY
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: '0 0 4px' }}>Book QR Labels & Inventory</h1>
          <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
            Print QR labels for books · Scan to count inventory stock
          </p>
        </div>

        {/* Mode Toggle */}
        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 14, padding: 4, marginBottom: 20, gap: 4, maxWidth: 400 }}>
          {[{ id: 'list', label: '📋 Print QR Labels', icon: Printer }, { id: 'scan', label: '📷 Scan Inventory', icon: ScanLine }].map(({ id, label }) => (
            <button key={id} onClick={() => { setMode(id as any); setScanCount({}) }}
              style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', fontFamily: '"DM Sans",sans-serif', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all .15s', background: mode === id ? '#fff' : 'transparent', color: mode === id ? '#0f172a' : '#64748b', boxShadow: mode === id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none' }}>
              {label}
            </button>
          ))}
        </div>

        {/* ── LIST MODE ── */}
        {mode === 'list' && (
          <>
            {/* Toolbar */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search books…"
                  style={{ width: '100%', padding: '10px 12px 10px 34px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }} />
              </div>
              <button onClick={toggleAll}
                style={{ padding: '10px 16px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: 'var(--bg-card)', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#334155', whiteSpace: 'nowrap' }}>
                {allSelected ? 'Deselect All' : `Select All (${filtered.length})`}
              </button>
              {selected.size > 0 && (
                <button onClick={printSelected}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 12, border: 'none', background: '#7c3aed', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  <Printer size={14} /> Print {selected.size} QR Label{selected.size > 1 ? 's' : ''}
                </button>
              )}
            </div>

            {/* Stats bar */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              {[
                { label: 'Total Books', value: books.length, color: '#334155', bg: '#f1f5f9' },
                { label: 'Available', value: books.reduce((s, b) => s + (b.copies_available ?? 0), 0), color: '#059669', bg: '#dcfce7' },
                { label: 'On Loan', value: books.reduce((s, b) => s + ((b.copies_total ?? 0) - (b.copies_available ?? 0)), 0), color: '#d97706', bg: '#fef3c7' },
                { label: 'Selected', value: selected.size, color: '#7c3aed', bg: '#f5f3ff' },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: '10px 16px', display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Book Grid */}
            {isLoading ? (
              <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>Loading library…</div>
            ) : (
              <div className="inv-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                {filtered.map(b => {
                  const isSelected = selected.has(b.id)
                  const onLoan = (b.copies_total ?? 0) - (b.copies_available ?? 0)
                  return (
                    <div key={b.id} onClick={() => toggleBook(b.id)}
                      style={{ background: 'var(--bg-card)', borderRadius: 8, border: `2px solid ${isSelected ? '#7c3aed' : '#f1f5f9'}`, padding: '14px', cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'center', transition: 'all .15s', boxShadow: isSelected ? '0 0 0 3px rgba(124,58,237,.15)' : 'none' }}>
                      {/* QR preview */}
                      <div style={{ flexShrink: 0 }}>
                        <BookQR barcode={b.barcode} title={b.title} size={64} />
                      </div>
                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.title}</div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>{b.author}</div>
                        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>{b.barcode} · {b.location || b.category}</div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: '#dcfce7', color: '#059669' }}>{b.copies_available ?? 0} avail</span>
                          {onLoan > 0 && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: '#fef3c7', color: '#d97706' }}>{onLoan} on loan</span>}
                        </div>
                      </div>
                      {/* Check */}
                      {isSelected && <CheckCircle size={20} color="#7c3aed" style={{ flexShrink: 0 }} />}
                    </div>
                  )
                })}
                {filtered.length === 0 && (
                  <div style={{ gridColumn: '1 / -1', padding: '50px', textAlign: 'center', color: '#94a3b8' }}>
                    No books found. Add books in the Library Dashboard first.
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ── SCAN INVENTORY MODE ── */}
        {mode === 'scan' && (
          <div style={{ maxWidth: 520, margin: '0 auto' }}>
            <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1.5px solid #f1f5f9', overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Camera size={16} color="#7c3aed" />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Scan Books to Count Stock</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Each scan counts +1 for that book. When done, tap "Commit Inventory".</div>
                </div>
              </div>

              {/* Camera */}
              <div style={{ background: '#000', position: 'relative' }}>
                {cameraError ? (
                  <div style={{ padding: '50px 20px', textAlign: 'center', color: '#fca5a5' }}>
                    <AlertTriangle size={40} style={{ marginBottom: 10, opacity: .5 }} />
                    <div style={{ fontWeight: 700 }}>{cameraError}</div>
                  </div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <div id="inv-qr-reader" />
                    {/* Scan line overlay */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ position: 'relative', width: 'min(200px, 55vw)', height: 'min(200px, 55vw)', border: '2px solid #a78bfa', borderRadius: 12, boxShadow: '0 0 0 4000px rgba(0,0,0,0.4)' }}>
                        <div style={{ position: 'absolute', left: '5%', right: '5%', height: 2, background: 'rgba(167,139,250,0.7)', top: '50%', boxShadow: '0 0 8px rgba(167,139,250,0.9)', animation: 'inv_scan 1.5s linear infinite' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div style={{ padding: '10px', background: '#0f172a', fontSize: 11, color: '#94a3b8', textAlign: 'center', fontWeight: 600 }}>
                  📦 INVENTORY SCAN MODE — Point at book QR labels
                </div>
              </div>
            </div>

            {/* Last scanned */}
            {lastScanned && (
              <div style={{ background: '#f5f3ff', border: '2px solid #a78bfa', borderRadius: 8, padding: '14px 18px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12, animation: 'inv_pop .3s ease' }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18 }}>📚</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{lastScanned.title}</div>
                  <div style={{ fontSize: 11, color: '#7c3aed', fontWeight: 700 }}>{lastScanned.barcode} · Counted: {scanCount[lastScanned.barcode] ?? 0}×</div>
                </div>
                <CheckCircle size={22} color="#7c3aed" />
              </div>
            )}

            {/* Running count */}
            {scannedBooks.length > 0 && (
              <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1.5px solid #f1f5f9', overflow: 'hidden', marginBottom: 14 }}>
                <div style={{ padding: '12px 18px', borderBottom: '1px solid #f8fafc', fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
                  📊 Running Count ({scannedBooks.length} book{scannedBooks.length > 1 ? 's' : ''} scanned)
                </div>
                {scannedBooks.map(({ book, count }) => (
                  <div key={book!.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 18px', borderBottom: '1px solid #f8fafc' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{book!.title}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>Current DB: {book!.copies_available} available</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: '#7c3aed' }}>{count}</div>
                      <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Counted</div>
                    </div>
                  </div>
                ))}

                <div style={{ padding: '14px 18px' }}>
                  <button onClick={commitInventory}
                    style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: '#7c3aed', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: '"DM Sans",sans-serif' }}>
                    ✅ Commit Inventory to Database
                  </button>
                  <button onClick={() => { setScanCount({}); setLastScanned(null) }}
                    style={{ width: '100%', padding: '10px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: 'var(--bg-card)', color: '#64748b', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: '"DM Sans",sans-serif', marginTop: 8 }}>
                    Clear & Start Over
                  </button>
                </div>
              </div>
            )}

            {scannedBooks.length === 0 && (
              <div style={{ background: '#f8fafc', borderRadius: 14, padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                <ScanLine size={36} style={{ margin: '0 auto 10px', display: 'block', opacity: .4 }} />
                <div style={{ fontSize: 13, fontWeight: 700 }}>No books scanned yet</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Point the camera at a book's QR label</div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
