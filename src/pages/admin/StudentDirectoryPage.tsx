import { useState } from 'react'
import StudentsPage from './StudentsPage'
import AdminAdmissions from './AdminAdmissions'
import StudentVaultPage from './StudentVaultPage'
import { Users, GraduationCap, Archive } from 'lucide-react'

export default function StudentDirectoryPage() {
  const [activeTab, setActiveTab] = useState<'students' | 'admissions' | 'vault'>('students')

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto', fontFamily: '"DM Sans", sans-serif' }}>
      
      <div style={{ marginBottom: 32, animation: 'fadeUp 0.4s ease both' }}>
        <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 32, fontWeight: 700, color: 'var(--text-main)', margin: '0 0 4px' }}>
          Student Directory & Admissions
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>Manage active students, admissions pipeline, and the document vault.</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid #e2e8f0', overflowX: 'auto', paddingBottom: 4 }}>
        <button 
          onClick={() => setActiveTab('students')}
          style={{ 
            padding: '12px 24px', border: 'none', background: 'transparent', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
            color: activeTab === 'students' ? '#1d4ed8' : '#64748b', 
            borderBottom: activeTab === 'students' ? '3px solid #1d4ed8' : '3px solid transparent'
          }}
        >
          <Users size={18} /> Active Students
        </button>
        <button 
          onClick={() => setActiveTab('admissions')}
          style={{ 
            padding: '12px 24px', border: 'none', background: 'transparent', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
            color: activeTab === 'admissions' ? '#1d4ed8' : '#64748b', 
            borderBottom: activeTab === 'admissions' ? '3px solid #1d4ed8' : '3px solid transparent'
          }}
        >
          <GraduationCap size={18} /> Admissions Hub
        </button>
        <button 
          onClick={() => setActiveTab('vault')}
          style={{ 
            padding: '12px 24px', border: 'none', background: 'transparent', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
            color: activeTab === 'vault' ? '#1d4ed8' : '#64748b', 
            borderBottom: activeTab === 'vault' ? '3px solid #1d4ed8' : '3px solid transparent'
          }}
        >
          <Archive size={18} /> Student Vault
        </button>
      </div>

      <div style={{ animation: 'fadeIn 0.3s ease' }}>
        {activeTab === 'students' && <StudentsPage />}
        {activeTab === 'admissions' && <AdminAdmissions />}
        {activeTab === 'vault' && <StudentVaultPage />}
      </div>
      
    </div>
  )
}
