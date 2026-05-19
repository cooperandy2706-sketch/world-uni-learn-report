import { useState } from 'react'
import ScoreEntryPage from '../teacher/ScoreEntryPage'
import ReportsPage from './ReportsPage'
import BatchPromotionPage from './BatchPromotionPage'
import BECEProcessorPage from './BECEProcessorPage'
import { FileEdit, FileText, Users, Calculator } from 'lucide-react'

export default function AssessmentHubPage() {
  const [activeTab, setActiveTab] = useState<'scores' | 'reports' | 'promotion' | 'bece'>('scores')

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto', fontFamily: '"DM Sans", sans-serif' }}>
      
      <div style={{ marginBottom: 32, animation: 'fadeUp 0.4s ease both' }}>
        <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 32, fontWeight: 700, color: 'var(--text-main)', margin: '0 0 4px' }}>
          Assessment Hub
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>Manage scores, report cards, promotions, and BECE processing.</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid #e2e8f0', overflowX: 'auto', paddingBottom: 4 }}>
        <button 
          onClick={() => setActiveTab('scores')}
          style={{ 
            padding: '12px 24px', border: 'none', background: 'transparent', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
            color: activeTab === 'scores' ? '#1d4ed8' : '#64748b', 
            borderBottom: activeTab === 'scores' ? '3px solid #1d4ed8' : '3px solid transparent'
          }}
        >
          <FileEdit size={18} /> Score Entry
        </button>
        <button 
          onClick={() => setActiveTab('reports')}
          style={{ 
            padding: '12px 24px', border: 'none', background: 'transparent', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
            color: activeTab === 'reports' ? '#1d4ed8' : '#64748b', 
            borderBottom: activeTab === 'reports' ? '3px solid #1d4ed8' : '3px solid transparent'
          }}
        >
          <FileText size={18} /> Report Cards
        </button>
        <button 
          onClick={() => setActiveTab('promotion')}
          style={{ 
            padding: '12px 24px', border: 'none', background: 'transparent', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
            color: activeTab === 'promotion' ? '#1d4ed8' : '#64748b', 
            borderBottom: activeTab === 'promotion' ? '3px solid #1d4ed8' : '3px solid transparent'
          }}
        >
          <Users size={18} /> Batch Promotion
        </button>
        <button 
          onClick={() => setActiveTab('bece')}
          style={{ 
            padding: '12px 24px', border: 'none', background: 'transparent', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
            color: activeTab === 'bece' ? '#1d4ed8' : '#64748b', 
            borderBottom: activeTab === 'bece' ? '3px solid #1d4ed8' : '3px solid transparent'
          }}
        >
          <Calculator size={18} /> BECE Processor
        </button>
      </div>

      <div style={{ animation: 'fadeIn 0.3s ease' }}>
        {activeTab === 'scores' && <ScoreEntryPage isAdminView={true} />}
        {activeTab === 'reports' && <ReportsPage />}
        {activeTab === 'promotion' && <BatchPromotionPage />}
        {activeTab === 'bece' && <BECEProcessorPage />}
      </div>
      
    </div>
  )
}
