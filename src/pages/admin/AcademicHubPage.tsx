import { useState } from 'react'
import DepartmentsPage from './DepartmentsPage'
import ClassesPage from './ClassesPage'
import SubjectsPage from './SubjectsPage'
import AcademicYearsPage from './AcademicYearsPage'
import TermsPage from './TermsPage'
import SyllabusPage from './SyllabusPage'
import LessonPlansPage from './LessonPlansPage'
import CalendarPage from './CalendarPage'
import { Building2, Presentation, BookOpen, Calendar, CalendarDays, Book, FileText, Settings2 } from 'lucide-react'

export default function AcademicHubPage() {
  const [activeTab, setActiveTab] = useState<'years' | 'terms' | 'departments' | 'classes' | 'subjects' | 'syllabus' | 'lessons' | 'calendar'>('departments')

  const tabs = [
    { key: 'departments', label: 'Departments', icon: <Building2 size={16} /> },
    { key: 'classes',     label: 'Classes',     icon: <Presentation size={16} /> },
    { key: 'subjects',    label: 'Subjects',    icon: <BookOpen size={16} /> },
    { key: 'syllabus',    label: 'Syllabus',    icon: <Book size={16} /> },
    { key: 'lessons',     label: 'Lesson Plans', icon: <FileText size={16} /> },
    { key: 'calendar',    label: 'Calendar',    icon: <CalendarDays size={16} /> },
    { key: 'terms',       label: 'Terms',       icon: <Calendar size={16} /> },
    { key: 'years',       label: 'Acad. Years', icon: <Settings2 size={16} /> },
  ] as const

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200, margin: '0 auto', fontFamily: '"DM Sans", sans-serif' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 28, fontWeight: 700, color: 'var(--text-main)', margin: '0 0 4px' }}>
          Academic Hub
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
          Manage school structure, terms, subjects, and curriculum.
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
        {activeTab === 'departments' && <DepartmentsPage />}
        {activeTab === 'classes'     && <ClassesPage />}
        {activeTab === 'subjects'    && <SubjectsPage />}
        {activeTab === 'syllabus'    && <SyllabusPage />}
        {activeTab === 'lessons'     && <LessonPlansPage />}
        {activeTab === 'calendar'    && <CalendarPage />}
        {activeTab === 'terms'       && <TermsPage />}
        {activeTab === 'years'       && <AcademicYearsPage />}
      </div>
    </div>
  )
}
