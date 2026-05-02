// src/pages/bursar/InventoryPage.tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import { inventoryService } from '../../services/inventory.service'
import { useStudents } from '../../hooks/useStudents'
import { 
  Package, ShoppingCart, TrendingUp, AlertCircle, 
  Plus, History, Search, Filter, Trash2, 
  ChevronRight, ArrowUpRight, ArrowDownRight, Edit,
  Truck, DollarSign, BookOpen, Pencil, Shirt, Edit3
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { suppliesService, SchoolSupply } from '../../services/admissions.service'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const GHS = (n: number) => `GH₵ ${Number(n).toLocaleString('en-GH', { minimumFractionDigits: 2 })}`

export default function InventoryPage() {
  const { user } = useAuth()
  const schoolId = user?.school_id ?? ''
  const qc = useQueryClient()
  const [tab, setTab] = useState<'inventory' | 'sales' | 'ledger' | 'supplies'>('inventory')
  const [search, setSearch] = useState('')

  // Modals
  const [itemModal, setItemModal] = useState<any>(null)
  const [saleModal, setSaleModal] = useState<any>(null)
  const [restockModal, setRestockModal] = useState<any>(null)
  const { data: classes = [] } = useQuery({
    queryKey: ['classes-all', schoolId],
    queryFn: async () => { const { data } = await supabase.from('classes').select('id, name').eq('school_id', schoolId).order('name'); return data ?? [] },
    enabled: !!schoolId
  })

  // Data fetching
  const { data: items = [], isLoading: loadingItems } = useQuery({
    queryKey: ['inv-items', schoolId],
    queryFn: async () => { const { data } = await inventoryService.getItems(schoolId); return data ?? [] },
  })
  const { data: sales = [], isLoading: loadingSales } = useQuery({
    queryKey: ['inv-sales', schoolId],
    queryFn: async () => { const { data } = await inventoryService.getSales(schoolId); return data ?? [] },
  })
  const { data: logs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ['inv-logs', schoolId],
    queryFn: async () => { const { data } = await inventoryService.getStockLogs(schoolId); return data ?? [] },
  })
  const { data: students = [] } = useStudents()
  const { data: allSupplies = [], isLoading: loadingSupplies } = useQuery({
    queryKey: ['all-school-supplies', schoolId],
    queryFn: async () => { const { data } = await suppliesService.listAll(schoolId); return data ?? [] },
    enabled: tab === 'supplies'
  })

  // Mutations
  const [supplyModal, setSupplyModal] = useState<any>(null)
  
  const SUPPLY_CATEGORY_META: Record<string, { label: string; icon: any; color: string }> = {
    textbook: { label: 'Textbooks', icon: BookOpen, color: '#3b82f6' },
    stationery: { label: 'Stationery', icon: Pencil, color: '#6d28d9' },
    uniform: { label: 'Uniforms', icon: Shirt, color: '#f59e0b' },
    other: { label: 'Other Items', icon: Package, color: '#4b5563' },
  }

  const saveSupplyMutation = useMutation({
    mutationFn: (item: any) => {
      const { classes: _c, ...safeItem } = item
      return suppliesService.upsert([safeItem])
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-school-supplies'] })
      setSupplyModal(null)
      toast.success('Welcome pack item updated')
    }
  })

  const deleteSupplyMutation = useMutation({
    mutationFn: (id: string) => suppliesService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-school-supplies'] })
      toast.success('Item removed')
    }
  })
  const saveItem = useMutation({
    mutationFn: (d: any) => itemModal.id ? inventoryService.updateItem(itemModal.id, d) : inventoryService.createItem(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['inv-items'] }); setItemModal(null); toast.success('Item saved') },
    onError: (e: any) => toast.error(e.message)
  })
  const recordSale = useMutation({
    mutationFn: (d: any) => inventoryService.recordSale(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['inv-items'] }); qc.invalidateQueries({ queryKey: ['inv-sales'] }); setSaleModal(null); toast.success('Sale recorded') },
    onError: (e: any) => toast.error(e.message)
  })
  const recordStockChange = useMutation({
    mutationFn: (d: any) => inventoryService.recordStockChange(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['inv-items'] }); qc.invalidateQueries({ queryKey: ['inv-logs'] }); setRestockModal(null); toast.success('Stock updated') },
    onError: (e: any) => toast.error(e.message)
  })

  // Filtering
  const filteredItems = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
  const lowStock = items.filter(i => i.current_stock <= (i.reorder_level || 5))

  return (
    <>
      <style>{`
        @keyframes _an_fi { from{opacity:0; transform:translateY(10px)} to{opacity:1; transform:translateY(0)} }
        @keyframes _an_spin { to{transform:rotate(360deg)} }
        .inv-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0,0,0,0.08); }
        .inv-btn { transition: all .2s; }
        .inv-btn:hover { filter: brightness(1.1); transform: scale(1.02); }
        .inv-btn:active { transform: scale(1); }
      `}</style>

      <div style={{ paddingBottom: 60, fontFamily: '"DM Sans", sans-serif', animation: '_an_fi .4s ease-out' }}>
        
        {/* Header */}
        <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1e0646', margin: 0, letterSpacing: '-0.02em' }}>School Store & Inventory</h1>
            <p style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>Manage textbooks, uniforms, and stationery assets</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {tab === 'inventory' && (
              <button 
                onClick={() => setItemModal({ name: '', category: 'Uniform', cost_price: 0, selling_price: 0, current_stock: 0, reorder_level: 5, unit: 'pcs', school_id: schoolId, class_id: '' })}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', background: '#1e0646', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(30,6,70,0.2)' }}
                className="inv-btn"
              >
                <Plus size={16} /> New Product
              </button>
            )}
            {tab === 'supplies' && (
              <button 
                onClick={() => setSupplyModal({ item_name: '', category: 'textbook', quantity: 1, unit: 'copy', is_required: true, school_id: schoolId })}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', background: '#1e0646', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(30,6,70,0.2)' }}
                className="inv-btn"
              >
                <Plus size={16} /> Add Welcome Item
              </button>
            )}
          </div>
        </div>

        {/* Dash Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16, marginBottom: 30 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 22, border: '1.5px solid #f0eefe', display: 'flex', alignItems: 'center', gap: 16 }}>
             <div style={{ width: 48, height: 48, background: '#f5f3ff', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Package size={24} color="#6d28d9" />
             </div>
             <div>
               <div style={{ fontSize: 22, fontWeight: 900, color: '#1e0646' }}>{items.length}</div>
               <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>Total Items</div>
             </div>
          </div>
          <div style={{ background: '#fff', borderRadius: 20, padding: 22, border: '1.5px solid #f0eefe', display: 'flex', alignItems: 'center', gap: 16 }}>
             <div style={{ width: 48, height: 48, background: lowStock.length > 0 ? '#fef2f2' : '#f0fdf4', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <AlertCircle size={24} color={lowStock.length > 0 ? '#dc2626' : '#16a34a'} />
             </div>
             <div>
               <div style={{ fontSize: 22, fontWeight: 900, color: lowStock.length > 0 ? '#dc2626' : '#16a34a' }}>{lowStock.length}</div>
               <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>Low Stock Warnings</div>
             </div>
          </div>
          <div style={{ background: '#fff', borderRadius: 20, padding: 22, border: '1.5px solid #f0eefe', display: 'flex', alignItems: 'center', gap: 16 }}>
             <div style={{ width: 48, height: 48, background: '#ecfdf5', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <TrendingUp size={24} color="#059669" />
             </div>
             <div>
               <div style={{ fontSize: 22, fontWeight: 900, color: '#059669' }}>{sales.length}</div>
               <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>Total Sales Recorded</div>
             </div>
          </div>
        </div>

        {/* Tab Switcher & Search */}
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', background: '#f5f3ff', padding: 4, borderRadius: 14 }}>
            {[
              { id: 'inventory', icon: Package, label: 'Inventory' },
              { id: 'supplies', icon: BookOpen, label: 'Welcome Pack Items' },
              { id: 'sales', icon: History, label: 'Sales History' },
              { id: 'ledger', icon: History, label: 'Audit Log' },
            ].map(t => (
              <button 
                key={t.id} 
                onClick={() => setTab(t.id as any)}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                  background: tab === t.id ? '#fff' : 'transparent', color: tab === t.id ? '#6d28d9' : '#9ca3af',
                  boxShadow: tab === t.id ? '0 4px 10px rgba(0,0,0,0.04)' : 'none', transition: 'all .2s'
                }}
              >
                <t.icon size={15} /> {t.label}
              </button>
            ))}
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              placeholder="Search items..." 
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: 240, padding: '10px 16px 10px 40px', borderRadius: 12, border: '1.5px solid #e5e7eb', outline: 'none', fontSize: 13 }}
            />
          </div>
        </div>

        {loadingItems || loadingSales || loadingLogs ? (
          <div style={{ padding: '80px 0', textAlign: 'center' }}>
            <div style={{ width: 40, height: 40, border: '3px solid #f3f4f6', borderTopColor: '#6d28d9', borderRadius: '50%', animation: '_an_spin 1s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ fontSize: 13, color: '#6b7280' }}>Fetching store data...</p>
          </div>
        ) : (
          <>
            {tab === 'inventory' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                {filteredItems.map(item => (
                  <div key={item.id} style={{ background: '#fff', borderRadius: 24, border: '1.5px solid #f0eefe', padding: 24, transition: 'all .3s ease' }} className="inv-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <div style={{ background: '#f5f3ff', color: '#6d28d9', fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 8, textTransform: 'uppercase' }}>{item.category}</div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setItemModal(item)} style={{ padding: 6, borderRadius: 8, border: 'none', background: '#f9fafb', color: '#6b7280', cursor: 'pointer' }}><Edit size={14}/></button>
                        <button onClick={() => { if(confirm('Delete this item?')) inventoryService.deleteItem(item.id).then(() => qc.invalidateQueries({queryKey:['inv-items']})) }} style={{ padding: 6, borderRadius: 8, border: 'none', background: '#fef2f2', color: '#dc2626', cursor: 'pointer' }}><Trash2 size={14}/></button>
                      </div>
                    </div>
                    <h3 style={{ fontSize: 17, fontWeight: 800, color: '#111827', margin: '0 0 4px' }}>{item.name}</h3>
                    <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 16px' }}>{item.description || 'No description provided'}</p>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                      <div style={{ background: '#f9fafb', padding: '10px 14px', borderRadius: 14 }}>
                        <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>Stock Level</div>
                        <div style={{ fontSize: 16, fontWeight: 900, color: item.current_stock <= (item.reorder_level || 5) ? '#dc2626' : '#111827' }}>
                          {item.current_stock} <span style={{ fontSize: 11, color: '#9ca3af' }}>{item.unit}</span>
                        </div>
                      </div>
                      <div style={{ background: '#f9fafb', padding: '10px 14px', borderRadius: 14 }}>
                        <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>Retail Price</div>
                        <div style={{ fontSize: 16, fontWeight: 900, color: '#059669' }}>{GHS(item.selling_price)}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button 
                        onClick={() => setSaleModal({ ...item, item_id: item.id, quantity: 1, buyer_name: '', payment_method: 'cash', total_amount: item.selling_price })}
                        disabled={item.current_stock <= 0}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: item.current_stock <= 0 ? 'not-allowed' : 'pointer', filter: item.current_stock <= 0 ? 'grayscale(1)' : 'none' }}
                        className="inv-btn"
                      >
                        <ShoppingCart size={15} /> Sell Item
                      </button>
                      <button 
                         onClick={() => setRestockModal({ item_id: item.id, current_stock: item.current_stock, add: '', reason: 'Refill' })}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '11px', background: '#fff', color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: 12, width: 44, cursor: 'pointer' }}
                        className="inv-btn"
                      >
                        <Truck size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* WELCOME PACK TAB */}
            {tab === 'supplies' && (
              <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #f0eefe', overflow: 'hidden' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid #fcfaff' }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Management: Admissions Welcome Pack Items</h3>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>Items listed here will appear on the parent's admission packing list.</p>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#fcfaff' }}>
                      {['Category', 'Item Description', 'Target Class', 'Store Link', 'Price', ''].map(h => (
                        <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: '#1e0646', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allSupplies.map((item: any) => {
                      const linkedItem = items.find((i: any) => i.id === item.inventory_item_id)
                      return (
                        <tr key={item.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                          <td style={{ padding: '16px 20px' }}>
                            <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 20, background: SUPPLY_CATEGORY_META[item.category]?.color + '15', color: SUPPLY_CATEGORY_META[item.category]?.color }}>
                              {item.category.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: '16px 20px' }}>
                            <div style={{ fontSize: 14, fontWeight: 700 }}>{item.item_name}</div>
                            <div style={{ fontSize: 12, color: '#6b7280' }}>{item.quantity} {item.unit} {item.is_required ? '(Required)' : '(Optional)'}</div>
                          </td>
                          <td style={{ padding: '16px 20px' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6' }}>{item.classes?.name || 'All Classes'}</span>
                          </td>
                          <td style={{ padding: '16px 20px' }}>
                            {linkedItem ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#059669', fontWeight: 600 }}>
                                <Package size={14} /> {linkedItem.name}
                              </div>
                            ) : (
                              <span style={{ fontSize: 11, color: '#9ca3af' }}>No link</span>
                            )}
                          </td>
                          <td style={{ padding: '16px 20px', fontSize: 14, fontWeight: 800 }}>{item.unit_price ? GHS(item.unit_price) : '—'}</td>
                          <td style={{ padding: '16px 20px' }}>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button onClick={() => setSupplyModal(item)} style={{ background: 'none', border: 'none', color: '#6d28d9', cursor: 'pointer' }}><Edit3 size={16}/></button>
                              <button onClick={() => { if(confirm('Remove item?')) deleteSupplyMutation.mutate(item.id) }} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}><Trash2 size={16}/></button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                    {allSupplies.length === 0 && <tr><td colSpan={6} style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>No welcome pack items found.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}

            {tab === 'sales' && (
              <div style={{ background: '#fff', borderRadius: 24, border: '1.5px solid #f0eefe', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#fcfaff', borderBottom: '1.5px solid #f0eefe' }}>
                       {['Date', 'Item', 'Customer', 'Qty', 'Total', 'Action'].map(h => (
                         <th key={h} style={{ textAlign: 'left', padding: '16px 24px', fontSize: 11, fontWeight: 800, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                       ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map(s => (
                      <tr key={s.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                        <td style={{ padding: '14px 24px', fontSize: 13, color: '#6b7280' }}>{format(new Date(s.created_at), 'dd MMM, HH:mm')}</td>
                        <td style={{ padding: '14px 24px' }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{s.item?.name}</div>
                          <div style={{ fontSize: 11, color: '#9ca3af' }}>{s.item?.category}</div>
                        </td>
                        <td style={{ padding: '14px 24px', fontSize: 13, color: '#4b5563' }}>{s.student?.full_name || s.buyer_name || 'Counter Sale'}</td>
                        <td style={{ padding: '14px 24px', fontSize: 14, fontWeight: 700 }}>{s.quantity}</td>
                        <td style={{ padding: '14px 24px', fontSize: 14, fontWeight: 800, color: '#059669' }}>{GHS(s.total_amount)}</td>
                        <td style={{ padding: '14px 24px' }}><button style={{ color: '#9ca3af', border: 'none', background: 'none' }}><ChevronRight size={16}/></button></td>
                      </tr>
                    ))}
                    {sales.length === 0 && <tr><td colSpan={6} style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>No sales recorded yet</td></tr>}
                  </tbody>
                </table>
              </div>
            )}

            {tab === 'ledger' && (
              <div style={{ background: '#fff', borderRadius: 24, border: '1.5px solid #f0eefe', overflow: 'hidden' }}>
                 <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#fcfaff', borderBottom: '1.5px solid #f0eefe' }}>
                       {['Date', 'Item', 'Change', 'Previous', 'New', 'Reason'].map(h => (
                         <th key={h} style={{ textAlign: 'left', padding: '16px 24px', fontSize: 11, fontWeight: 800, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                       ))}
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                        <td style={{ padding: '14px 24px', fontSize: 13, color: '#6b7280' }}>{format(new Date(log.created_at), 'dd MMM, HH:mm')}</td>
                        <td style={{ padding: '14px 24px', fontSize: 14, fontWeight: 700, color: '#111827' }}>{log.item?.name}</td>
                        <td style={{ padding: '14px 24px' }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: log.quantity_change > 0 ? '#16a34a' : '#dc2626', fontWeight: 800 }}>
                              {log.quantity_change > 0 ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
                              {log.quantity_change}
                           </div>
                        </td>
                        <td style={{ padding: '14px 24px', fontSize: 13, color: '#9ca3af' }}>{log.previous_stock}</td>
                        <td style={{ padding: '14px 24px', fontSize: 14, fontWeight: 800 }}>{log.new_stock}</td>
                        <td style={{ padding: '14px 24px', fontSize: 13, color: '#4b5563' }}>{log.reason}</td>
                      </tr>
                    ))}
                    {logs.length === 0 && <tr><td colSpan={6} style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>No logs found</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* MODAL: Add/Edit Item */}
        {itemModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(30,6,70,0.4)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
             <div style={{ background: '#fff', borderRadius: 28, width: '100%', maxWidth: 440, padding: 32, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', animation: '_an_fi .3s ease-out' }}>
                <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20 }}>{itemModal.id ? 'Edit Product' : 'New Product'}</h2>
                <div style={{ display: 'grid', gap: 16 }}>
                   <div>
                     <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6, display: 'block' }}>Product Name</label>
                     <input value={itemModal.name} onChange={e => setItemModal({...itemModal, name: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1.5px solid #e5e7eb', outline: 'none' }} />
                   </div>
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                     <div>
                       <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6, display: 'block' }}>Category</label>
                       <select value={itemModal.category} onChange={e => setItemModal({...itemModal, category: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1.5px solid #e5e7eb', background: '#fff' }}>
                         {['Uniform', 'Books', 'Stationery', 'Sports', 'Food', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
                       </select>
                     </div>
                      <div>
                         <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6, display: 'block' }}>Target Class (Optional)</label>
                         <select value={itemModal.class_id || ''} onChange={e => setItemModal({...itemModal, class_id: e.target.value || null})} style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1.5px solid #e5e7eb', background: '#fff' }}>
                           <option value="">General (All Classes)</option>
                           {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                         </select>
                      </div>
                      <div>
                         <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6, display: 'block' }}>Unit</label>
                         <select value={itemModal.unit} onChange={e => setItemModal({...itemModal, unit: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1.5px solid #e5e7eb', background: '#fff' }}>
                           {['pcs', 'set', 'pair', 'kg', 'pack'].map(u => <option key={u} value={u}>{u}</option>)}
                         </select>
                      </div>
                   </div>
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                     <div>
                        <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6, display: 'block' }}>Cost Price</label>
                        <input type="number" value={itemModal.cost_price} onChange={e => setItemModal({...itemModal, cost_price: Number(e.target.value)})} style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1.5px solid #e5e7eb' }} />
                     </div>
                     <div>
                        <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6, display: 'block' }}>Selling Price</label>
                        <input type="number" value={itemModal.selling_price} onChange={e => setItemModal({...itemModal, selling_price: Number(e.target.value)})} style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1.5px solid #e5e7eb' }} />
                     </div>
                   </div>
                   {!itemModal.id && (
                     <div>
                        <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6, display: 'block' }}>Initial Stock</label>
                        <input type="number" value={itemModal.current_stock} onChange={e => setItemModal({...itemModal, current_stock: Number(e.target.value)})} style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1.5px solid #e5e7eb' }} />
                     </div>
                   )}
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
                   <button onClick={() => setItemModal(null)} style={{ flex: 1, padding: '12px', border: '1.5px solid #e5e7eb', background: '#fff', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                   <button onClick={() => saveItem.mutate(itemModal)} style={{ flex: 1, padding: '12px', background: '#1e0646', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>Save Item</button>
                </div>
             </div>
          </div>
        )}

        {/* MODAL: RECORD SALE */}
        {saleModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(30,6,70,0.4)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
             <div style={{ background: '#fff', borderRadius: 28, width: '100%', maxWidth: 440, padding: 32, animation: '_an_fi .3s ease-out' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                   <div style={{ width: 44, height: 44, background: '#ecfdf5', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShoppingCart size={20} color="#10b981"/></div>
                   <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>Record Point of Sale</h2>
                </div>
                <p style={{ fontSize: 14, color: '#111827', fontWeight: 800, marginBottom: 20, background: '#f5f3ff', padding: '10px 16px', borderRadius: 12 }}>Item: {saleModal.name}</p>
                
                <div style={{ display: 'grid', gap: 16 }}>
                   <div>
                     <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6, display: 'block' }}>Sale Type / Customer</label>
                     <select 
                       value={saleModal.student_id || ''} 
                       onChange={e => setSaleModal({...saleModal, student_id: e.target.value || null, buyer_name: e.target.value ? '' : 'Counter Sale'})}
                       style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1.5px solid #e5e7eb', background: '#fff' }}
                     >
                       <option value="">Counter Sale (Anonymous)</option>
                       {students.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.student_id})</option>)}
                     </select>
                   </div>
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                     <div>
                       <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6, display: 'block' }}>Quantity</label>
                       <input 
                         type="number" min="1" max={saleModal.current_stock}
                         value={saleModal.quantity} 
                         onChange={e => {
                           const q = Math.min(Number(e.target.value), saleModal.current_stock)
                           setSaleModal({...saleModal, quantity: q, total_amount: q * saleModal.selling_price})
                         }} 
                         style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1.5px solid #e5e7eb' }} 
                       />
                       <span style={{ fontSize: 11, color: '#9ca3af' }}>Max available: {saleModal.current_stock}</span>
                     </div>
                     <div>
                       <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6, display: 'block' }}>Payment Method</label>
                       <select value={saleModal.payment_method} onChange={e => setSaleModal({...saleModal, payment_method: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1.5px solid #e5e7eb', background: '#fff' }}>
                         {['cash', 'momo', 'bank_transfer'].map(m => <option key={m} value={m}>{m.replace('_',' ')}</option>)}
                       </select>
                     </div>
                   </div>
                   <div style={{ marginTop: 10, padding: 16, background: '#fcfaff', borderRadius: 16, border: '1.5px dashed #e5e7eb', textAlign: 'center' }}>
                      <div style={{ fontSize: 12, color: '#4b5563', fontWeight: 600 }}>Total Customer Pays:</div>
                      <div style={{ fontSize: 28, fontWeight: 900, color: '#059669', margin: '4px 0' }}>{GHS(saleModal.total_amount)}</div>
                   </div>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                   <button onClick={() => setSaleModal(null)} style={{ flex: 1, padding: '12px', border: '1.5px solid #e5e7eb', background: '#fff', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                   <button 
                     onClick={() => recordSale.mutate({ school_id: schoolId, item_id: saleModal.item_id, item_name: saleModal.name, student_id: saleModal.student_id, buyer_name: saleModal.buyer_name || null, quantity: saleModal.quantity, unit_price: saleModal.selling_price, total_amount: saleModal.total_amount, payment_method: saleModal.payment_method, recorded_by: user?.id })} 
                     style={{ flex: 1, padding: '12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}
                   >Complete Sale</button>
                </div>
             </div>
          </div>
        )}

        {/* MODAL: WELCOME PACK ITEM */}
        {supplyModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(30,6,70,0.4)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
             <div style={{ background: '#fff', borderRadius: 28, width: '100%', maxWidth: 500, padding: 32, animation: '_an_fi .3s ease-out' }}>
                <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20 }}>{supplyModal.id ? 'Edit Welcome Item' : 'New Welcome Item'}</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                       <label style={{ fontSize: 11, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Category</label>
                       <select value={supplyModal.category} onChange={e => setSupplyModal({...supplyModal, category: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1.5px solid #e5e7eb', background: '#fff' }}>
                         {Object.entries(SUPPLY_CATEGORY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                       </select>
                    </div>
                    <div>
                       <label style={{ fontSize: 11, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Target Class</label>
                       <select value={supplyModal.class_id || ''} onChange={e => setSupplyModal({...supplyModal, class_id: e.target.value || null})} style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1.5px solid #e5e7eb', background: '#fff' }}>
                         <option value="">All Classes</option>
                         {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                       </select>
                    </div>
                  </div>
                  <div>
                     <label style={{ fontSize: 11, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Item Name / Description</label>
                     <input value={supplyModal.item_name} onChange={e => setSupplyModal({...supplyModal, item_name: e.target.value})} placeholder="e.g. Science Textbook 1" style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1.5px solid #e5e7eb', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                       <label style={{ fontSize: 11, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Qty</label>
                       <input type="number" value={supplyModal.quantity} onChange={e => setSupplyModal({...supplyModal, quantity: Number(e.target.value)})} style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1.5px solid #e5e7eb', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                       <label style={{ fontSize: 11, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Unit</label>
                       <input value={supplyModal.unit} onChange={e => setSupplyModal({...supplyModal, unit: e.target.value})} placeholder="copy, pcs, ream" style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1.5px solid #e5e7eb', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                  <div>
                     <label style={{ fontSize: 11, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Connect to School Store</label>
                     <select value={supplyModal.inventory_item_id || ''} onChange={e => setSupplyModal({...supplyModal, inventory_item_id: e.target.value || null})} style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1.5px solid #e5e7eb', background: '#fff' }}>
                       <option value="">(Not linked to store inventory)</option>
                       {items.map((i: any) => <option key={i.id} value={i.id}>{i.name} — ({i.current_stock} in stock)</option>)}
                     </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="checkbox" checked={supplyModal.is_required} onChange={e => setSupplyModal({...supplyModal, is_required: e.target.checked})} style={{ width: 18, height: 18 }} />
                    <label style={{ fontSize: 13, fontWeight: 700, color: '#1e0646' }}>Mark as Required</label>
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                    <button onClick={() => setSupplyModal(null)} style={{ flex: 1, padding: '12px', border: '1.5px solid #e5e7eb', background: '#fff', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                    <button 
                      onClick={() => saveSupplyMutation.mutate(supplyModal)}
                      disabled={saveSupplyMutation.isPending || !supplyModal.item_name}
                      style={{ flex: 1, padding: '14px', background: '#1e0646', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
                    >
                      {saveSupplyMutation.isPending ? 'Saving...' : 'Save Item'}
                    </button>
                  </div>
                </div>
             </div>
          </div>
        )}

        {/* MODAL: RESTOCK */}
        {restockModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(30,6,70,0.4)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
             <div style={{ background: '#fff', borderRadius: 28, width: '100%', maxWidth: 440, padding: 32, animation: '_an_fi .3s ease-out' }}>
                <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20 }}>Restock Product</h2>
                <div style={{ display: 'grid', gap: 16 }}>
                   <div>
                     <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6, display: 'block' }}>Add Quantity</label>
                     <input type="number" value={restockModal.add} onChange={e => setRestockModal({...restockModal, add: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1.5px solid #e5e7eb' }} />
                   </div>
                   <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6, display: 'block' }}>Reason / Note</label>
                      <input value={restockModal.reason} onChange={e => setRestockModal({...restockModal, reason: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1.5px solid #e5e7eb' }} />
                   </div>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
                   <button onClick={() => setRestockModal(null)} style={{ flex: 1, padding: '12px', border: '1.5px solid #e5e7eb', background: '#fff', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                   <button onClick={() => {
                     const change = Number(restockModal.add)
                     recordStockChange.mutate({ school_id: schoolId, item_id: restockModal.item_id, type: 'restock', quantity_change: change, previous_stock: restockModal.current_stock, new_stock: restockModal.current_stock + change, reason: restockModal.reason, recorded_by: user?.id })
                   }} style={{ flex: 1, padding: '12px', background: '#1e0646', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>Update Stock</button>
                </div>
             </div>
          </div>
        )}
      </div>
    </>
  )
}
