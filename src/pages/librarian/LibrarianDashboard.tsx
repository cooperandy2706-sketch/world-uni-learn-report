// src/pages/librarian/LibrarianDashboard.tsx
import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { format, differenceInDays } from 'date-fns'
import { Library, Book, ScanLine, Search, Plus, UserCheck, AlertTriangle, X, Check, Camera, Usb, Volume2 } from 'lucide-react'
import { useStudents } from '../../hooks/useStudents'
import { Html5Qrcode } from 'html5-qrcode'
import toast from 'react-hot-toast'

const T = {
  primary: '#8b5cf6',
  bg: '#f5f3ff',
  card: '#ffffff',
  text: '#0f172a',
  muted: '#64748b',
  border: '#e2e8f0',
  red: '#ef4444',
  green: '#10b981',
  orange: '#f59e0b',
}

interface LibraryBook {
  id: string
  title: string
  author: string
  isbn: string
  barcode: string
  dewey_decimal: string
  category: string
  copies_total: number
  copies_available: number
  location: string
}

interface LibraryCheckout {
  id: string
  book_id: string
  student_id: string
  checkout_date: string
  due_date: string
  return_date: string | null
  fine_amount: number
  status: 'active' | 'returned' | 'lost'
  book: LibraryBook
  student: any
}

export default function LibrarianDashboard() {
  const { user } = useAuth()
  const { data: students = [] } = useStudents()
  
  const [activeTab, setActiveTab] = useState<'inventory' | 'scanner' | 'checkouts'>('scanner')
  
  const [books, setBooks] = useState<LibraryBook[]>([])
  const [checkouts, setCheckouts] = useState<LibraryCheckout[]>([])
  
  const [search, setSearch] = useState('')
  const [addBookModal, setAddBookModal] = useState(false)
  const [bookForm, setBookForm] = useState({
    title: '', author: '', isbn: '', barcode: '', dewey_decimal: '', category: '', copies_total: 1, location: ''
  })

  // Scanner States
  const [scanInput, setScanInput] = useState('')
  const [scannedBook, setScannedBook] = useState<LibraryBook | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [checkoutSaving, setCheckoutSaving] = useState(false)
  
  // Mobile Scanner States
  const [mode, setMode] = useState<'camera' | 'usb'>('usb')
  const [cameraError, setCameraError] = useState('')
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const processingRef = useRef(false)

  const fetchData = async () => {
    if (!user?.school_id) return
    const [bRes, cRes] = await Promise.all([
      supabase.from('library_books').select('*').eq('school_id', user.school_id),
      supabase.from('library_checkouts').select('*, book:library_books(*), student:students(id, full_name, class:classes(name))').eq('school_id', user.school_id).order('checkout_date', { ascending: false })
    ])
    if (bRes.data) setBooks(bRes.data as any)
    if (cRes.data) setCheckouts(cRes.data as any)
  }

  useEffect(() => { fetchData() }, [user?.school_id])

  // Process a scanned barcode
  const processBarcode = async (barcode: string) => {
    if (!barcode || processingRef.current) return
    processingRef.current = true
    
    try {
      // First, check if this barcode is already checked out (active)
      const activeCheckout = checkouts.find(c => c.book?.barcode === barcode && c.status === 'active')
      
      if (activeCheckout) {
        // Return the book
        await handleReturnBook(activeCheckout)
        setScanInput('')
        return
      }

      // Otherwise, find the book in inventory to check out
      const book = books.find(b => b.barcode === barcode)
      if (book) {
        if (book.copies_available <= 0) {
          toast.error("No copies available for checkout!")
        } else {
          setScannedBook(book)
          toast.success(`Book found: ${book.title}`)
        }
      } else {
        toast.error("Barcode not found in inventory!")
      }
    } finally {
      processingRef.current = false
      setScanInput('')
    }
  }

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    processBarcode(scanInput)
  }

  // Camera scanner automatic start
  useEffect(() => {
    if (mode !== 'camera' || activeTab !== 'scanner') return
    
    let isMounted = true
    let scanner: Html5Qrcode | null = null

    async function start() {
      try {
        const cameras = await Html5Qrcode.getCameras()
        if (!isMounted) return
        if (!cameras || cameras.length === 0) {
          setCameraError('No cameras found')
          return
        }

        const getEl = () => document.getElementById('librarian-qr-reader')
        let attempts = 0
        while (!getEl() && attempts < 20 && isMounted) {
          await new Promise(r => setTimeout(r, 100))
          attempts++
        }
        if (!isMounted || !getEl()) return

        const backCam = cameras.find(c => c.label.toLowerCase().includes('back')) || cameras[0]
        const newScanner = new Html5Qrcode('librarian-qr-reader')
        scannerRef.current = newScanner
        scanner = newScanner

        await newScanner.start(
          backCam.id,
          { fps: 15, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
          (text) => processBarcode(text),
          () => {}
        )
        if (isMounted) setCameraError('')
      } catch (err) {
        if (isMounted) setCameraError('Camera access denied')
      }
    }

    start()
    return () => {
      isMounted = false
      if (scanner && scanner.isScanning) {
        scanner.stop().catch(e => console.log('Stop error', e))
      }
    }
  }, [mode, activeTab])

  const handleReturnBook = async (checkout: LibraryCheckout) => {
    if (!user?.school_id) return
    
    const today = new Date()
    const dueDate = new Date(checkout.due_date)
    let fine = 0
    
    if (today > dueDate) {
      const daysLate = differenceInDays(today, dueDate)
      fine = daysLate * 2.0 // Example: $2 per day late
    }

    await supabase.from('library_checkouts').update({
      return_date: format(today, 'yyyy-MM-dd'),
      status: 'returned',
      fine_amount: fine
    }).eq('id', checkout.id).eq('school_id', user!.school_id)

    // Increment available copies
    await supabase.from('library_books').update({
      copies_available: checkout.book.copies_available + 1
    }).eq('id', checkout.book_id).eq('school_id', user!.school_id)

    if (fine > 0) {
      alert(`Book returned! Late fine generated: $${fine.toFixed(2)}`)
    } else {
      alert("Book returned successfully!")
    }

    fetchData()
  }

  const handleCheckoutBook = async () => {
    if (!scannedBook || !selectedStudent || !user?.school_id) return
    setCheckoutSaving(true)

    const today = new Date()
    const dueDate = new Date()
    dueDate.setDate(today.getDate() + 14) // 2 weeks checkout period

    await supabase.from('library_checkouts').insert({
      school_id: user.school_id,
      book_id: scannedBook.id,
      student_id: selectedStudent.id,
      checkout_date: format(today, 'yyyy-MM-dd'),
      due_date: format(dueDate, 'yyyy-MM-dd'),
      status: 'active'
    })

    await supabase.from('library_books').update({
      copies_available: scannedBook.copies_available - 1
    }).eq('id', scannedBook.id).eq('school_id', user!.school_id)

    setScannedBook(null)
    setSelectedStudent(null)
    setCheckoutSaving(false)
    fetchData()
    alert("Book checked out successfully!")
  }

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.school_id) return

    const payload = {
      school_id: user.school_id,
      ...bookForm,
      copies_available: bookForm.copies_total
    }

    await supabase.from('library_books').insert(payload)
    setBookForm({ title: '', author: '', isbn: '', barcode: '', dewey_decimal: '', category: '', copies_total: 1, location: '' })
    setAddBookModal(false)
    fetchData()
  }

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto', fontFamily: '"DM Sans", sans-serif' }}>
      <style>{`
        @media (max-width: 768px) {
          .scanner-layout { grid-template-columns: 1fr !important; }
        }
        #librarian-qr-reader video { object-fit: cover !important; width: 100% !important; height: 100% !important; }
      `}</style>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 8px 16px rgba(139, 92, 246, 0.2)' }}>
            <Library size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: T.text, margin: 0, letterSpacing: '-0.02em' }}>Library Portal</h1>
            <p style={{ fontSize: 13, color: T.muted, margin: '2px 0 0 0' }}>Manage Physical Books & Returns</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: `1px solid ${T.border}`, paddingBottom: 16 }}>
        {[
          { id: 'scanner', label: 'Scanner / Desk', icon: ScanLine },
          { id: 'inventory', label: 'Book Inventory', icon: Book },
          { id: 'checkouts', label: 'Active Checkouts', icon: UserCheck }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: 14, transition: 'all 0.2s',
              background: activeTab === tab.id ? T.text : 'transparent',
              color: activeTab === tab.id ? '#fff' : T.muted
            }}
          >
            <tab.icon size={18} /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'scanner' && (
        <div className="scanner-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Scanner Input Area */}
          <div style={{ background: T.card, borderRadius: 16, border: `1px solid ${T.border}`, padding: 24, textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            
            {/* Mode Toggle */}
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 12, padding: 4, marginBottom: 20, gap: 4 }}>
              {[{ id: 'camera', label: '📷 Camera', icon: Camera }, { id: 'usb', label: '🔌 USB Scanner', icon: Usb }].map(({ id, label }) => (
                <button key={id} onClick={() => setMode(id as any)} style={{ flex: 1, padding: '8px', borderRadius: 10, border: 'none', fontFamily: '"DM Sans",sans-serif', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all .15s', background: mode === id ? '#fff' : 'transparent', color: mode === id ? T.text : T.muted, boxShadow: mode === id ? '0 2px 8px rgba(0,0,0,0.05)' : 'none' }}>
                  {label}
                </button>
              ))}
            </div>

            {mode === 'camera' ? (
              <div style={{ background: '#000', borderRadius: 16, overflow: 'hidden', position: 'relative', aspectRatio: '1/1', marginBottom: 16 }}>
                {cameraError ? (
                  <div style={{ padding: '40px 20px', color: '#fca5a5', fontSize: 13 }}>
                    <AlertTriangle size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
                    <div>{cameraError}</div>
                  </div>
                ) : (
                  <div id="librarian-qr-reader" style={{ width: '100%', height: '100%' }} />
                )}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 10, fontWeight: 600 }}>
                  CAMERA ACTIVE · BEEP ON SCAN
                </div>
              </div>
            ) : (
              <div style={{ padding: '20px 0' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: `${T.primary}15`, color: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Usb size={32} />
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: T.text, margin: '0 0 8px 0' }}>USB Scanner Mode</h2>
                <p style={{ fontSize: 13, color: T.muted, margin: '0 0 20px 0' }}>Click the box below and scan the book's barcode.</p>
                
                <form onSubmit={handleScanSubmit} style={{ position: 'relative', maxWidth: 300, margin: '0 auto' }}>
                  <input
                    autoFocus
                    type="text"
                    placeholder="Focus & Scan..."
                    value={scanInput}
                    onChange={e => setScanInput(e.target.value)}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: `2px solid ${T.primary}`, fontSize: 15, outline: 'none', textAlign: 'center', fontWeight: 600 }}
                  />
                </form>
              </div>
            )}
            
            <div style={{ fontSize: 11, color: T.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Volume2 size={12} /> SCAN TO AUTOMATICALLY CHECK-OUT OR RETURN
            </div>
          </div>

          {/* Action Area (Shows when book is scanned for checkout) */}
          {scannedBook && (
            <div style={{ background: T.card, borderRadius: 16, border: `2px solid ${T.primary}`, padding: 32, boxShadow: `0 8px 24px ${T.primary}20` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.primary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Ready for Checkout</div>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: T.text, margin: 0 }}>{scannedBook.title}</h2>
                  <div style={{ fontSize: 14, color: T.muted, marginTop: 4 }}>By {scannedBook.author} • {scannedBook.category}</div>
                </div>
                <button onClick={() => setScannedBook(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted }}><X size={20} /></button>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 8 }}>Select Student *</label>
                <select
                  value={selectedStudent?.id || ''}
                  onChange={e => setSelectedStudent(students.find((s:any) => s.id === e.target.value))}
                  style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${T.border}`, outline: 'none', fontSize: 14 }}
                >
                  <option value="">-- Choose Student --</option>
                  {students.map((s:any) => (
                    <option key={s.id} value={s.id}>{s.full_name} ({s.class?.name})</option>
                  ))}
                </select>
              </div>

              <button
                disabled={!selectedStudent || checkoutSaving}
                onClick={handleCheckoutBook}
                style={{ width: '100%', background: selectedStudent ? T.text : T.muted, color: '#fff', border: 'none', padding: 16, borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: selectedStudent ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {checkoutSaving ? 'Processing...' : <><Check size={20} /> Complete Checkout</>}
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'inventory' && (
        <div style={{ background: T.card, borderRadius: 16, border: `1px solid ${T.border}`, padding: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ position: 'relative', width: 300 }}>
              <Search size={16} color={T.muted} style={{ position: 'absolute', left: 12, top: 10 }} />
              <input type="text" placeholder="Search title or barcode..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: 8, border: `1px solid ${T.border}`, outline: 'none' }} />
            </div>
            <button onClick={() => setAddBookModal(true)} style={{ background: T.primary, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus size={18} /> Add Book
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                <th style={{ padding: '12px 16px', fontSize: 12, color: T.muted, textTransform: 'uppercase' }}>Book Details</th>
                <th style={{ padding: '12px 16px', fontSize: 12, color: T.muted, textTransform: 'uppercase' }}>Barcode</th>
                <th style={{ padding: '12px 16px', fontSize: 12, color: T.muted, textTransform: 'uppercase' }}>Location (Dewey)</th>
                <th style={{ padding: '12px 16px', fontSize: 12, color: T.muted, textTransform: 'uppercase' }}>Available</th>
              </tr>
            </thead>
            <tbody>
              {books.filter(b => b.title.toLowerCase().includes(search.toLowerCase()) || b.barcode.includes(search)).map(b => (
                <tr key={b.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: 700, color: T.text, fontSize: 15 }}>{b.title}</div>
                    <div style={{ fontSize: 13, color: T.muted }}>{b.author}</div>
                  </td>
                  <td style={{ padding: '16px', fontSize: 14, fontWeight: 600 }}>{b.barcode}</td>
                  <td style={{ padding: '16px', fontSize: 14 }}>{b.location} <br/><span style={{fontSize:11, color:T.muted}}>{b.dewey_decimal}</span></td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ padding: '4px 8px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: b.copies_available > 0 ? `${T.green}15` : `${T.red}15`, color: b.copies_available > 0 ? T.green : T.red }}>
                      {b.copies_available} / {b.copies_total}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'checkouts' && (
        <div style={{ background: T.card, borderRadius: 16, border: `1px solid ${T.border}`, padding: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: T.text, margin: '0 0 20px 0' }}>Active Checkouts</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                <th style={{ padding: '12px 16px', fontSize: 12, color: T.muted, textTransform: 'uppercase' }}>Student</th>
                <th style={{ padding: '12px 16px', fontSize: 12, color: T.muted, textTransform: 'uppercase' }}>Book</th>
                <th style={{ padding: '12px 16px', fontSize: 12, color: T.muted, textTransform: 'uppercase' }}>Due Date</th>
                <th style={{ padding: '12px 16px', fontSize: 12, color: T.muted, textTransform: 'uppercase' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {checkouts.filter(c => c.status === 'active').map(c => {
                const isLate = new Date() > new Date(c.due_date)
                return (
                  <tr key={c.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 700, color: T.text, fontSize: 14 }}>{c.student?.full_name}</div>
                      <div style={{ fontSize: 12, color: T.muted }}>{c.student?.class?.name}</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{c.book?.title}</div>
                      <div style={{ fontSize: 12, color: T.muted }}>{c.book?.barcode}</div>
                    </td>
                    <td style={{ padding: '16px', fontSize: 14, fontWeight: isLate ? 800 : 500, color: isLate ? T.red : T.text }}>
                      {c.due_date}
                    </td>
                    <td style={{ padding: '16px' }}>
                      {isLate ? (
                        <span style={{ padding: '4px 8px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: `${T.red}15`, color: T.red, display: 'flex', alignItems: 'center', gap: 4, width: 'fit-content' }}>
                          <AlertTriangle size={12} /> Overdue
                        </span>
                      ) : (
                        <span style={{ padding: '4px 8px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: `${T.green}15`, color: T.green }}>
                          Active
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Book Modal */}
      {addBookModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 500, borderRadius: 20, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Add New Book</h3>
              <button onClick={() => setAddBookModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted }}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleAddBook} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>Book Title *</label>
                <input required value={bookForm.title} onChange={e => setBookForm({...bookForm, title: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${T.border}`, outline: 'none' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>Author</label>
                  <input value={bookForm.author} onChange={e => setBookForm({...bookForm, author: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${T.border}`, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>Barcode *</label>
                  <input required value={bookForm.barcode} onChange={e => setBookForm({...bookForm, barcode: e.target.value})} placeholder="Scan or type..." style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${T.primary}`, outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>Category / Genre</label>
                  <input value={bookForm.category} onChange={e => setBookForm({...bookForm, category: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${T.border}`, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>Copies Available</label>
                  <input type="number" min="1" value={bookForm.copies_total} onChange={e => setBookForm({...bookForm, copies_total: parseInt(e.target.value)})} style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${T.border}`, outline: 'none' }} />
                </div>
              </div>

              <button type="submit" style={{ width: '100%', background: T.primary, color: '#fff', border: 'none', padding: 14, borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 8 }}>
                Add to Inventory
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
