import { useState } from 'react'
import StudentsPage from './StudentsPage'
import AdminAdmissions from './AdminAdmissions'
import ParentsPage from './ParentsPage'
import StudentVaultPage from './StudentVaultPage'
import PastoralCarePage from './PastoralCarePage'
import AlumniPage from './AlumniPage'
import { Users, GraduationCap, Archive, UserPlus, Heart, ShieldCheck } from 'lucide-react'

export default function StudentHubPage() {
  const [activeTab, setActiveTab] = useState<'students' | 'admissions' | 'parents' | 'pastoral' | 'alumni' | 'vault'>('students')

  const tabs = [
    { key: 'students',   label: 'Active Students', icon: <Users size={16} /> },
    { key: 'admissions', label: 'Admissions',      icon: <GraduationCap size={16} /> },
    { key: 'parents',    label: 'Parent Logins',   icon: <UserPlus size={16} /> },
    { key: 'pastoral',   label: 'Pastoral Care',   icon: <Heart size={16} /> },
    { key: 'alumni',     label: 'Alumni',          icon: <ShieldCheck size={16} /> },
    { key: 'vault',      label: 'Student Vault',   icon: <Archive size={16} /> },
  ] as const

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200, margin: '0 auto', fontFamily: '"DM Sans", sans-serif' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 28, fontWeight: 700, color: 'var(--text-main)', margin: '0 0 4px' }}>
          Student Hub
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
          Manage student records, admissions, parents, alumni, and pastoral care.
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
        {activeTab === 'students'   && <StudentsPage />}
        {activeTab === 'admissions' && <AdminAdmissions />}
        {activeTab === 'parents'    && <ParentsPage />}
        {activeTab === 'pastoral'   && <PastoralCarePage />}
        {activeTab === 'alumni'     && <AlumniPage />}
        {activeTab === 'vault'      && <StudentVaultPage />}
      </div>
    </div>
  )
}
