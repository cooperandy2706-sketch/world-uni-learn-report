import { useState } from 'react'
import FleetManagementPage from './FleetManagementPage'
import LiveFleetTrackingPage from './LiveFleetTrackingPage'
import VisitorsPage from './VisitorsPage'
import AssetManagerPage from './AssetManagerPage'
import DormitoryPage from './DormitoryPage'
import ExeatPage from './ExeatPage'
import { Truck, Navigation, Users, Package, Building2, MapPin } from 'lucide-react'

export default function CampusHubPage() {
  const [activeTab, setActiveTab] = useState<'fleet' | 'live' | 'visitors' | 'assets' | 'dormitory' | 'exeats'>('fleet')

  const tabs = [
    { key: 'fleet',     label: 'Fleet Management', icon: <Truck size={16} /> },
    { key: 'live',      label: 'Live Tracking',    icon: <Navigation size={16} /> },
    { key: 'visitors',  label: 'Visitors',         icon: <Users size={16} /> },
    { key: 'assets',    label: 'Asset Register',   icon: <Package size={16} /> },
    { key: 'dormitory', label: 'Boarding & Dorms', icon: <Building2 size={16} /> },
    { key: 'exeats',    label: 'Exeat Requests',   icon: <MapPin size={16} /> },
  ] as const

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200, margin: '0 auto', fontFamily: '"DM Sans", sans-serif' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 28, fontWeight: 700, color: 'var(--text-main)', margin: '0 0 4px' }}>
          Campus & Logistics Hub
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
          Manage fleet, visitors, assets, boarding, and student exeats.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '2px solid var(--border-color)', overflowX: 'auto', paddingBottom: 0 }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              padding: '10px 18px', border: 'none', background: 'transparent', fontWeight: 700,
              fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
              whiteSpace: 'nowrap', fontFamily: '"DM Sans", sans-serif',
              color: activeTab === t.key ? '#6d28d9' : 'var(--text-muted)',
              borderBottom: activeTab === t.key ? '3px solid #6d28d9' : '3px solid transparent',
              marginBottom: -2,
              transition: 'color 0.15s',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div style={{ animation: 'fadeIn 0.25s ease' }}>
        {activeTab === 'fleet'     && <FleetManagementPage />}
        {activeTab === 'live'      && <LiveFleetTrackingPage />}
        {activeTab === 'visitors'  && <VisitorsPage />}
        {activeTab === 'assets'    && <AssetManagerPage />}
        {activeTab === 'dormitory' && <DormitoryPage />}
        {activeTab === 'exeats'    && <ExeatPage />}
      </div>
    </div>
  )
}
