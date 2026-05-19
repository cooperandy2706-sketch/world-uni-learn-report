import { useState } from 'react'
import AcademicYearsPage from './AcademicYearsPage'
import TermsPage from './TermsPage'
import { Calendar, Clock } from 'lucide-react'

export default function AcademicCalendarPage() {
  const [activeTab, setActiveTab] = useState<'years' | 'terms'>('years')

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto', fontFamily: '"DM Sans", sans-serif' }}>
      
      <div style={{ marginBottom: 32, animation: 'fadeUp 0.4s ease both' }}>
        <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 32, fontWeight: 700, color: 'var(--text-main)', margin: '0 0 4px' }}>
          Academic Calendar
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>Manage academic years, terms, and lock statuses.</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid #e2e8f0', overflowX: 'auto', paddingBottom: 4 }}>
        <button 
          onClick={() => setActiveTab('years')}
          style={{ 
            padding: '12px 24px', border: 'none', background: 'transparent', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
            color: activeTab === 'years' ? '#1d4ed8' : '#64748b', 
            borderBottom: activeTab === 'years' ? '3px solid #1d4ed8' : '3px solid transparent'
          }}
        >
          <Calendar size={18} /> Academic Years
        </button>
        <button 
          onClick={() => setActiveTab('terms')}
          style={{ 
            padding: '12px 24px', border: 'none', background: 'transparent', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
            color: activeTab === 'terms' ? '#1d4ed8' : '#64748b', 
            borderBottom: activeTab === 'terms' ? '3px solid #1d4ed8' : '3px solid transparent'
          }}
        >
          <Clock size={18} /> Terms
        </button>
      </div>

      <div style={{ animation: 'fadeIn 0.3s ease' }}>
        {activeTab === 'years' && <AcademicYearsPage />}
        {activeTab === 'terms' && <TermsPage />}
      </div>
      
    </div>
  )
}
