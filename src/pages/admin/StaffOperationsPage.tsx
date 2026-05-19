import { useState } from 'react'
import AdminStaffLeavePage from './StaffLeavePage'
import StaffRequestsPage from './StaffRequestsPage'
import { FileText, CalendarCheck } from 'lucide-react'

export default function StaffOperationsPage() {
  const [activeTab, setActiveTab] = useState<'leave' | 'general'>('leave')

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto', fontFamily: '"DM Sans", sans-serif' }}>
      
      <div style={{ marginBottom: 32, animation: 'fadeUp 0.4s ease both' }}>
        <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 32, fontWeight: 700, color: 'var(--text-main)', margin: '0 0 4px' }}>
          Staff Operations
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>Review leave requests, assign substitutes, and manage professional documents.</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid #e2e8f0' }}>
        <button 
          onClick={() => setActiveTab('leave')}
          style={{ 
            padding: '12px 24px', border: 'none', background: 'transparent', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
            color: activeTab === 'leave' ? '#1d4ed8' : '#64748b', 
            borderBottom: activeTab === 'leave' ? '3px solid #1d4ed8' : '3px solid transparent'
          }}
        >
          <CalendarCheck size={18} /> Assign Substitutes
        </button>
        <button 
          onClick={() => setActiveTab('general')}
          style={{ 
            padding: '12px 24px', border: 'none', background: 'transparent', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
            color: activeTab === 'general' ? '#1d4ed8' : '#64748b', 
            borderBottom: activeTab === 'general' ? '3px solid #1d4ed8' : '3px solid transparent'
          }}
        >
          <FileText size={18} /> General Requests & Docs
        </button>
      </div>

      <div style={{ animation: 'fadeIn 0.3s ease' }}>
        {activeTab === 'leave' && <AdminStaffLeavePage />}
        {activeTab === 'general' && <StaffRequestsPage />}
      </div>
      
    </div>
  )
}
