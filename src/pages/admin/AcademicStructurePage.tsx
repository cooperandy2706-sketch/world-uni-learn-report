import { useState } from 'react'
import DepartmentsPage from './DepartmentsPage'
import ClassesPage from './ClassesPage'
import SubjectsPage from './SubjectsPage'
import { Building2, Presentation, BookOpen } from 'lucide-react'

export default function AcademicStructurePage() {
  const [activeTab, setActiveTab] = useState<'departments' | 'classes' | 'subjects'>('departments')

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto', fontFamily: '"DM Sans", sans-serif' }}>
      
      <div style={{ marginBottom: 32, animation: 'fadeUp 0.4s ease both' }}>
        <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 32, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>
          Academic Structure
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Organize departments, classes, and subjects.</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid #e2e8f0', overflowX: 'auto', paddingBottom: 4 }}>
        <button 
          onClick={() => setActiveTab('departments')}
          style={{ 
            padding: '12px 24px', border: 'none', background: 'transparent', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
            color: activeTab === 'departments' ? '#1d4ed8' : '#64748b', 
            borderBottom: activeTab === 'departments' ? '3px solid #1d4ed8' : '3px solid transparent'
          }}
        >
          <Building2 size={18} /> Departments
        </button>
        <button 
          onClick={() => setActiveTab('classes')}
          style={{ 
            padding: '12px 24px', border: 'none', background: 'transparent', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
            color: activeTab === 'classes' ? '#1d4ed8' : '#64748b', 
            borderBottom: activeTab === 'classes' ? '3px solid #1d4ed8' : '3px solid transparent'
          }}
        >
          <Presentation size={18} /> Classes
        </button>
        <button 
          onClick={() => setActiveTab('subjects')}
          style={{ 
            padding: '12px 24px', border: 'none', background: 'transparent', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
            color: activeTab === 'subjects' ? '#1d4ed8' : '#64748b', 
            borderBottom: activeTab === 'subjects' ? '3px solid #1d4ed8' : '3px solid transparent'
          }}
        >
          <BookOpen size={18} /> Subjects
        </button>
      </div>

      <div style={{ animation: 'fadeIn 0.3s ease' }}>
        {activeTab === 'departments' && <DepartmentsPage />}
        {activeTab === 'classes' && <ClassesPage />}
        {activeTab === 'subjects' && <SubjectsPage />}
      </div>
      
    </div>
  )
}
