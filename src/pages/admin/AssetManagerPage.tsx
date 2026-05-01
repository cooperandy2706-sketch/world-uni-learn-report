// src/pages/admin/AssetManagerPage.tsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { 
  Package, 
  Plus, 
  Search, 
  MapPin, 
  Calendar, 
  Trash2, 
  Edit3,
  Monitor,
  Truck,
  Armchair,
  Box,
  AlertTriangle
} from 'lucide-react'

export default function AssetManagerPage() {
    const { user } = useAuth()
    const [assets, setAssets] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [search, setSearch] = useState('')

    // Form State
    const [name, setName] = useState('')
    const [category, setCategory] = useState('Electronics')
    const [condition, setCondition] = useState('good')
    const [quantity, setQuantity] = useState(1)
    const [location, setLocation] = useState('')
    const [purchaseDate, setPurchaseDate] = useState('')
    const [value, setValue] = useState('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (user) loadData()
    }, [user])

    async function loadData() {
        setLoading(true)
        const { data, error } = await supabase.from('school_assets').select('*').order('created_at', { ascending: false })
        if (error) toast.error(error.message)
        else setAssets(data || [])
        setLoading(false)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!name || !category) return toast.error('Name and Category are required')

        setSubmitting(true)
        const { error } = await supabase.from('school_assets').insert({
            school_id: user!.school_id,
            name,
            category,
            condition,
            quantity,
            location,
            purchase_date: purchaseDate || null,
            value: value ? parseFloat(value) : null
        })

        if (error) {
            toast.error(error.message)
        } else {
            toast.success('Asset added successfully')
            setShowModal(false)
            resetForm()
            loadData()
        }
        setSubmitting(false)
    }

    async function deleteAsset(id: string) {
        if (!confirm('Are you sure you want to remove this asset?')) return
        const { error } = await supabase.from('school_assets').delete().eq('id', id)
        if (error) toast.error(error.message)
        else loadData()
    }

    function resetForm() {
        setName(''); setLocation(''); setPurchaseDate(''); setValue(''); setQuantity(1)
    }

    const filteredAssets = assets.filter(a => 
        a.name.toLowerCase().includes(search.toLowerCase()) || 
        a.category.toLowerCase().includes(search.toLowerCase()) ||
        a.location?.toLowerCase().includes(search.toLowerCase())
    )

    const getCategoryIcon = (cat: string) => {
        if (cat.includes('Electronic') || cat.includes('IT')) return <Monitor size={18} />
        if (cat.includes('Vehicle')) return <Truck size={18} />
        if (cat.includes('Furniture')) return <Armchair size={18} />
        return <Box size={18} />
    }

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
            <div className="animate-spin" style={{ width: 40, height: 40, border: '4px solid #f3f3f3', borderTop: '4px solid #7c3aed', borderRadius: '50%' }} />
        </div>
    )

    return (
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', animation: 'fadeIn 0.5s ease' }}>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .card { background: white; border-radius: 16px; border: 1.5px solid #f0eefe; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
                .cond-badge { padding: 4px 10px; border-radius: 99px; font-size: 11px; fontWeight: 700; text-transform: uppercase; }
                .cond-new { background: #dcfce7; color: #16a34a; }
                .cond-good { background: #e0f2fe; color: #0284c7; }
                .cond-fair { background: #fef3c7; color: #d97706; }
                .cond-poor { background: #ffedd5; color: #ea580c; }
                .cond-broken { background: #fee2e2; color: #dc2626; }
            `}</style>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 32, fontWeight: 700, color: '#111827', margin: 0 }}>Asset Register</h1>
                    <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>Track school property, condition, and maintenance locations.</p>
                </div>
                <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)' }}>
                    <Plus size={20} /> Add Asset
                </button>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: 'white', border: '1.5px solid #f0eefe', padding: '10px 16px', borderRadius: '12px' }}>
                    <Search size={20} color="#9ca3af" />
                    <input 
                        type="text" 
                        placeholder="Search assets by name, category, or location..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ background: 'none', border: 'none', outline: 'none', width: '100%', fontSize: 14 }}
                    />
                </div>
            </div>

            <div className="card" style={{ overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#f9fafb', borderBottom: '1.5px solid #f0eefe' }}>
                        <tr>
                            <th style={{ padding: '16px', fontSize: 12, fontWeight: 700, color: '#6b7280' }}>ASSET NAME</th>
                            <th style={{ padding: '16px', fontSize: 12, fontWeight: 700, color: '#6b7280' }}>CATEGORY</th>
                            <th style={{ padding: '16px', fontSize: 12, fontWeight: 700, color: '#6b7280' }}>CONDITION</th>
                            <th style={{ padding: '16px', fontSize: 12, fontWeight: 700, color: '#6b7280' }}>LOCATION</th>
                            <th style={{ padding: '16px', fontSize: 12, fontWeight: 700, color: '#6b7280' }}>VALUE</th>
                            <th style={{ padding: '16px', fontSize: 12, fontWeight: 700, color: '#6b7280' }}>ACTION</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAssets.length === 0 ? (
                            <tr><td colSpan={6} style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>No assets found in the register.</td></tr>
                        ) : filteredAssets.map((a, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #f0eefe' }}>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ background: '#f5f3ff', color: '#7c3aed', padding: '8px', borderRadius: '10px' }}>
                                            {getCategoryIcon(a.category)}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 700 }}>{a.name}</div>
                                            <div style={{ fontSize: 11, color: '#9ca3af' }}>Qty: {a.quantity}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '16px', fontSize: 14 }}>{a.category}</td>
                                <td style={{ padding: '16px' }}>
                                    <span className={`cond-badge cond-${a.condition}`}>{a.condition}</span>
                                </td>
                                <td style={{ padding: '16px', fontSize: 13 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <MapPin size={12} color="#9ca3af" />
                                        {a.location || 'Not set'}
                                    </div>
                                </td>
                                <td style={{ padding: '16px', fontSize: 14, fontWeight: 600 }}>
                                    {a.value ? `GH₵ ${a.value.toFixed(2)}` : '—'}
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button onClick={() => deleteAsset(a.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 6 }}>
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add Asset Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '32px', animation: 'fadeIn 0.3s ease' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                            <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Register New Asset</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 24 }}>✕</button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Asset Name</label>
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Dell Latitude Laptop" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #e5e7eb', outline: 'none' }} required />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Category</label>
                                    <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #e5e7eb', outline: 'none' }}>
                                        <option value="Electronics">Electronics / IT</option>
                                        <option value="Furniture">Furniture</option>
                                        <option value="Vehicles">Vehicles</option>
                                        <option value="Appliances">Appliances</option>
                                        <option value="Lab Equipment">Lab Equipment</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Condition</label>
                                    <select value={condition} onChange={(e) => setCondition(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #e5e7eb', outline: 'none' }}>
                                        <option value="new">Brand New</option>
                                        <option value="good">Good</option>
                                        <option value="fair">Fair (Usable)</option>
                                        <option value="poor">Poor (Needs Repair)</option>
                                        <option value="broken">Broken / Scrap</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Quantity</label>
                                    <input type="number" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #e5e7eb', outline: 'none' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Estimated Value (GHS)</label>
                                    <input type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0.00" style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #e5e7eb', outline: 'none' }} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Location</label>
                                    <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. IT Lab" style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #e5e7eb', outline: 'none' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Purchase Date</label>
                                    <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #e5e7eb', outline: 'none' }} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1.5px solid #e5e7eb', background: 'white', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" disabled={submitting} style={{ flex: 2, padding: '12px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                                    {submitting ? 'Registering...' : 'Add to Register'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
