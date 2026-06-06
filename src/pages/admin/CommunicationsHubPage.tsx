import { useState } from 'react'
import MessagingPage from '../messaging/MessagingPage'
import AnnouncementsPage from './AnnouncementsPage'
import SMSPage from '../shared/SMSPage'
import { MessageSquare, Megaphone, Smartphone } from 'lucide-react'

export default function CommunicationsHubPage() {
  const [activeTab, setActiveTab] = useState<'messages' | 'announcements' | 'sms'>('messages')

  const tabs = [
    { key: 'messages',      label: 'Direct Messages', icon: <MessageSquare size={16} /> },
    { key: 'announcements', label: 'Announcements',   icon: <Megaphone size={16} /> },
    { key: 'sms',           label: 'SMS Blasts',      icon: <Smartphone size={16} /> },
  ] as const

  return (
    <div style={{ padding: activeTab === 'messages' ? '0' : '28px 32px', maxWidth: activeTab === 'messages' ? 'none' : 1200, margin: '0 auto', fontFamily: '"DM Sans", sans-serif', height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      <div style={{ padding: activeTab === 'messages' ? '28px 32px 0' : 0, marginBottom: 24, maxWidth: 1200, margin: activeTab === 'messages' ? '0 auto' : undefined, width: '100%' }}>
        <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 28, fontWeight: 700, color: 'var(--text-main)', margin: '0 0 4px' }}>
          Communications Hub
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
          Manage direct messages, announcements, and SMS communications.
        </p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginTop: 24, borderBottom: '2px solid var(--border-color)', overflowX: 'auto', paddingBottom: 0 }}>
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
      </div>

      <div style={{ animation: 'fadeIn 0.25s ease', flex: 1, padding: activeTab === 'messages' ? '0 32px 32px' : 0, maxWidth: activeTab === 'messages' ? 1200 : undefined, margin: activeTab === 'messages' ? '0 auto' : undefined, width: '100%' }}>
        {activeTab === 'messages'      && <div style={{ height: 'calc(100vh - 250px)' }}><MessagingPage /></div>}
        {activeTab === 'announcements' && <AnnouncementsPage />}
        {activeTab === 'sms'           && <SMSPage />}
      </div>
    </div>
  )
}
