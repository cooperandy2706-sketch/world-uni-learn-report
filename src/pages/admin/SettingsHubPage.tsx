import { useState } from 'react'
import SettingsPage from './SettingsPage'
import BranchesPage from './BranchesPage'
import PublicProfilePage from './PublicProfilePage'
import AdminAuditPage from './AdminAuditPage'
import { Settings, Building2, Globe, ShieldCheck } from 'lucide-react'
import { useSettings } from '../../hooks/useSettings'

export default function SettingsHubPage() {
  const { data: settings } = useSettings()
  const [activeTab, setActiveTab] = useState<'system' | 'branches' | 'profile' | 'audit'>('system')

  const tabs = [
    { key: 'system',  label: 'System Settings', icon: <Settings size={16} /> },
    { key: 'profile', label: 'Public Profile',  icon: <Globe size={16} /> },
    ...(settings?.has_branches ? [{ key: 'branches', label: 'Branches', icon: <Building2 size={16} /> }] : []),
    { key: 'audit',   label: 'Audit Logs',      icon: <ShieldCheck size={16} /> },
  ] as const

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200, margin: '0 auto', fontFamily: '"DM Sans", sans-serif' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 28, fontWeight: 700, color: 'var(--text-main)', margin: '0 0 4px' }}>
          System Settings Hub
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
          Manage global settings, branches, public profile, and view audit logs.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '2px solid var(--border-color)', overflowX: 'auto', paddingBottom: 0 }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
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
        {activeTab === 'system'   && <SettingsPage />}
        {activeTab === 'profile'  && <PublicProfilePage />}
        {activeTab === 'branches' && settings?.has_branches && <BranchesPage />}
        {activeTab === 'audit'    && <AdminAuditPage />}
      </div>
    </div>
  )
}
