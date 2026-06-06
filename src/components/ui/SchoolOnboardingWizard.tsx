import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import { useSettings, useUpdateSettings, useAcademicYears, useTerms, useClasses, useCreateClass, useSubjects, useCreateSubject } from '../../hooks/useSettings'
import { yearsService, termsService, departmentsService } from '../../services/index'
import { supabase } from '../../lib/supabase'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import confetti from 'canvas-confetti'

const GRADING_TEMPLATES = {
  GES: {
    name: 'GES Standard',
    description: '30% Class Score, 70% Exam Score',
    scale: {
      name: 'Standard GES A-F',
      levels: [
        { label: 'A', min_score: 80, max_score: 100, color_code: '#16a34a' },
        { label: 'B', min_score: 70, max_score: 79.99, color_code: '#2563eb' },
        { label: 'C', min_score: 60, max_score: 69.99, color_code: '#ca8a04' },
        { label: 'D', min_score: 50, max_score: 59.99, color_code: '#d97706' },
        { label: 'E', min_score: 40, max_score: 49.99, color_code: '#ea580c' },
        { label: 'F', min_score: 0, max_score: 39.99, color_code: '#dc2626' },
      ]
    },
    categories: [
      { name: 'Class Score', weight_percentage: 30, max_score: 30 },
      { name: 'Exam Score', weight_percentage: 70, max_score: 70 }
    ]
  },
}

const STEPS = [
  { id: 'welcome', title: 'Welcome', subtitle: 'Get started' },
  { id: 'identity', title: 'School Identity', subtitle: 'Logo & Basic Info' },
  { id: 'year', title: 'Academic Year', subtitle: 'Set the current year' },
  { id: 'terms', title: 'Terms', subtitle: 'Create grading periods' },
  { id: 'departments', title: 'Departments', subtitle: 'Optional grouping' },
  { id: 'classes', title: 'Classes', subtitle: 'Add your classes' },
  { id: 'subjects', title: 'Subjects', subtitle: 'Add your subjects' },
  { id: 'grading', title: 'Grading', subtitle: 'Set grading scales' },
  { id: 'done', title: 'Done', subtitle: 'Ready to go!' }
]

export default function SchoolOnboardingWizard({ onClose }: { onClose: () => void }) {
  const { user } = useAuth()
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  // Hydrate step from localStorage
  useEffect(() => {
    if (!user) return
    const saved = localStorage.getItem(`onboarding_step_${user.id}`)
    if (saved) {
      setCurrentStepIndex(Number(saved))
    }
  }, [user])

  const saveProgress = (idx: number) => {
    if (!user) return
    localStorage.setItem(`onboarding_step_${user.id}`, idx.toString())
    setCurrentStepIndex(idx)
  }

  const nextStep = () => saveProgress(Math.min(currentStepIndex + 1, STEPS.length - 1))
  const prevStep = () => saveProgress(Math.max(currentStepIndex - 1, 0))

  const finish = () => {
    if (user) {
      localStorage.setItem(`onboarding_wizard_complete_${user.id}`, 'true')
    }
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } })
    setTimeout(onClose, 1500)
  }

  const currentStep = STEPS[currentStepIndex]

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex' }}>
      {/* Sidebar Rail */}
      <div style={{ width: 280, background: 'linear-gradient(180deg, #1e0646 0%, #4c1d95 100%)', color: '#fff', padding: '40px 20px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontFamily: '"Playfair Display",serif', fontSize: 24, margin: '0 0 40px', fontWeight: 700, color: '#e9d5ff' }}>Setup Wizard</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, flex: 1 }}>
          {STEPS.map((step, idx) => {
            const isActive = idx === currentStepIndex
            const isPast = idx < currentStepIndex
            return (
              <div key={step.id} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', opacity: isActive || isPast ? 1 : 0.5, transition: 'all 0.3s' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: isActive ? '#c084fc' : isPast ? '#10b981' : 'rgba(255,255,255,0.1)',
                  color: isActive || isPast ? '#fff' : 'rgba(255,255,255,0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
                  boxShadow: isActive ? '0 0 0 4px rgba(192,132,252,0.3)' : 'none'
                }}>
                  {isPast ? '✓' : idx + 1}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: isActive ? '#fff' : '#e2e8f0' }}>{step.title}</div>
                  <div style={{ fontSize: 11, color: '#cbd5e1', marginTop: 2 }}>{step.subtitle}</div>
                </div>
              </div>
            )
          })}
        </div>
        <div style={{ marginTop: 'auto', fontSize: 12, color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>
          You can close this and resume later.
          <button onClick={onClose} style={{ display: 'block', width: '100%', padding: '10px', marginTop: 10, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: 8, cursor: 'pointer' }}>Close for now</button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, position: 'relative', overflowY: 'auto' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            style={{ width: '100%', maxWidth: 640, background: 'var(--bg-card)', borderRadius: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.2)', overflow: 'hidden' }}
          >
            {/* Step Components */}
            {currentStepIndex === 0 && <StepWelcome onNext={nextStep} />}
            {currentStepIndex === 1 && <StepIdentity onNext={nextStep} />}
            {currentStepIndex === 2 && <StepAcademicYear onNext={nextStep} />}
            {currentStepIndex === 3 && <StepTerms onNext={nextStep} />}
            {currentStepIndex === 4 && <StepDepartments onNext={nextStep} onSkip={nextStep} />}
            {currentStepIndex === 5 && <StepClasses onNext={nextStep} />}
            {currentStepIndex === 6 && <StepSubjects onNext={nextStep} />}
            {currentStepIndex === 7 && <StepGrading onNext={nextStep} onSkip={nextStep} />}
            {currentStepIndex === 8 && <StepDone onFinish={finish} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Components for individual steps ────────────────────────

function FormWrapper({ title, subtitle, children, onNext, onSkip, nextLabel = "Continue" }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 450 }}>
      <div style={{ padding: '32px 40px', borderBottom: '1px solid var(--border-light)' }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, fontFamily: '"Playfair Display",serif' }}>{title}</h2>
        {subtitle && <p style={{ margin: '6px 0 0', color: 'var(--text-subtle)', fontSize: 14 }}>{subtitle}</p>}
      </div>
      <div style={{ padding: 40, flex: 1 }}>
        {children}
      </div>
      <div style={{ padding: '24px 40px', background: 'var(--bg-subtle)', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
        {onSkip && (
          <button onClick={onSkip} style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', color: '#4b5563', fontWeight: 600, cursor: 'pointer' }}>Skip for now</button>
        )}
        <button onClick={onNext} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(109,40,217,0.3)' }}>{nextLabel}</button>
      </div>
    </div>
  )
}

function StepWelcome({ onNext }: any) {
  return (
    <div style={{ padding: 60, textAlign: 'center', minHeight: 450, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>👋</div>
      <h2 style={{ fontFamily: '"Playfair Display",serif', fontSize: 32, fontWeight: 700, margin: '0 0 12px' }}>Welcome to Acadera!</h2>
      <p style={{ fontSize: 16, color: 'var(--text-muted)', maxWidth: 400, lineHeight: 1.5, margin: '0 0 40px' }}>
        Your school account is approved and ready. Let's get the core structure set up so you can start adding teachers and students.
      </p>
      <button onClick={onNext} style={{ padding: '14px 32px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(109,40,217,0.4)' }}>
        Let's Get Started
      </button>
    </div>
  )
}

function StepIdentity({ onNext }: any) {
  const { data: settings } = useSettings()
  const updateSettings = useUpdateSettings()
  const { user } = useAuth()
  
  const [form, setForm] = useState({
    school_name: '', motto: '', address: '', phone_number: '', email: ''
  })

  useEffect(() => {
    if (settings?.school) {
      setForm({
        school_name: settings.school.name || '',
        motto: settings.school.motto || '',
        address: settings.school.address || '',
        phone_number: settings.school.phone_number || '',
        email: settings.school.email || ''
      })
    }
  }, [settings])

  const handleNext = async () => {
    if (!user?.school_id) return
    const loadingToast = toast.loading('Saving identity...')
    try {
      await supabase.from('schools').update({
        name: form.school_name,
        motto: form.motto,
        address: form.address,
        phone_number: form.phone_number,
        email: form.email
      }).eq('id', user.school_id)
      toast.success('Identity saved!', { id: loadingToast })
      onNext()
    } catch (e: any) {
      toast.error('Failed to save', { id: loadingToast })
    }
  }

  return (
    <FormWrapper title="School Identity" subtitle="Basic information about your school" onNext={handleNext}>
      <div style={{ display: 'grid', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>School Name</label>
          <input value={form.school_name} onChange={e => setForm({...form, school_name: e.target.value})} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #d1d5db', outline: 'none' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Motto</label>
          <input value={form.motto} onChange={e => setForm({...form, motto: e.target.value})} placeholder="e.g. Knowledge is Power" style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #d1d5db', outline: 'none' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Address</label>
          <input value={form.address} onChange={e => setForm({...form, address: e.target.value})} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #d1d5db', outline: 'none' }} />
        </div>
      </div>
    </FormWrapper>
  )
}

function StepAcademicYear({ onNext }: any) {
  const { user } = useAuth()
  const { data: years = [], refetch } = useAcademicYears()
  const [yearName, setYearName] = useState('2024/2025')
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!user?.school_id || !yearName.trim()) return
    setLoading(true)
    try {
      const year = await yearsService.create({ school_id: user.school_id, name: yearName })
      await yearsService.setCurrent(year.id, user.school_id)
      await refetch()
      setYearName('')
      toast.success('Academic Year Created!')
    } catch (e) {
      toast.error('Failed to create year')
    } finally {
      setLoading(false)
    }
  }

  return (
    <FormWrapper title="Academic Year" subtitle="Create the current academic year" onNext={onNext}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <input value={yearName} onChange={e => setYearName(e.target.value)} placeholder="e.g. 2024/2025" style={{ flex: 1, padding: 12, borderRadius: 8, border: '1px solid #d1d5db', outline: 'none' }} />
        <button onClick={handleCreate} disabled={loading || !yearName.trim()} style={{ padding: '0 20px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Add</button>
      </div>
      
      {years.length > 0 && (
        <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <h4 style={{ margin: '0 0 12px', fontSize: 13, color: '#64748b', textTransform: 'uppercase' }}>Created Years</h4>
          {years.map((y: any) => (
            <div key={y.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#fff', borderRadius: 8, marginBottom: 8, border: '1px solid #e2e8f0' }}>
              <span style={{ fontWeight: 600 }}>{y.name}</span>
              {y.is_current && <span style={{ fontSize: 11, background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: 99, fontWeight: 700 }}>CURRENT</span>}
            </div>
          ))}
        </div>
      )}
    </FormWrapper>
  )
}

function StepTerms({ onNext }: any) {
  const { user } = useAuth()
  const { data: years } = useAcademicYears()
  const currentYear = years?.find((y: any) => y.is_current)
  
  // We cannot easily use the hook inside a conditional if we don't have year id, but we can query directly
  const [terms, setTerms] = useState<any[]>([])
  const [termName, setTermName] = useState('Term 1')

  useEffect(() => {
    if (currentYear) {
      termsService.getAll(currentYear.id).then(res => setTerms(res.data || []))
    }
  }, [currentYear])

  const handleCreate = async () => {
    if (!user?.school_id || !currentYear || !termName.trim()) return
    try {
      const term = await termsService.create({ school_id: user.school_id, academic_year_id: currentYear.id, name: termName })
      // Make it current if it's the first one
      if (terms.length === 0) {
        await termsService.setCurrent(term.id, user.school_id)
      }
      const res = await termsService.getAll(currentYear.id)
      setTerms(res.data || [])
      setTermName('')
      toast.success('Term Created!')
    } catch (e) {
      toast.error('Failed to create term')
    }
  }

  return (
    <FormWrapper title="Terms" subtitle={`Create terms for ${currentYear?.name || 'the current year'}`} onNext={onNext}>
      {!currentYear ? (
        <div style={{ padding: 20, background: '#fef2f2', color: '#b91c1c', borderRadius: 8 }}>Please go back and create an academic year first.</div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
            <input value={termName} onChange={e => setTermName(e.target.value)} placeholder="e.g. Term 1" style={{ flex: 1, padding: 12, borderRadius: 8, border: '1px solid #d1d5db', outline: 'none' }} />
            <button onClick={handleCreate} disabled={!termName.trim()} style={{ padding: '0 20px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Add</button>
          </div>

          {terms.length > 0 && (
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: 13, color: '#64748b', textTransform: 'uppercase' }}>Created Terms</h4>
              {terms.map((t: any) => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#fff', borderRadius: 8, marginBottom: 8, border: '1px solid #e2e8f0' }}>
                  <span style={{ fontWeight: 600 }}>{t.name}</span>
                  {t.is_current && <span style={{ fontSize: 11, background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: 99, fontWeight: 700 }}>CURRENT</span>}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </FormWrapper>
  )
}

function StepDepartments({ onNext, onSkip }: any) {
  const { user } = useAuth()
  const qc = useQueryClient()
  const { data: depts = [] } = useQuery({
    queryKey: ['departments', user?.school_id],
    queryFn: () => departmentsService.getAll(user!.school_id).then(r => r.data || []),
    enabled: !!user?.school_id
  })
  
  const [deptName, setDeptName] = useState('')

  const handleCreate = async () => {
    if (!user?.school_id || !deptName.trim()) return
    try {
      await departmentsService.create({ school_id: user.school_id, name: deptName })
      qc.invalidateQueries({ queryKey: ['departments', user.school_id] })
      setDeptName('')
      toast.success('Department created')
    } catch (e) {
      toast.error('Failed to create department')
    }
  }

  return (
    <FormWrapper title="Departments" subtitle="Group classes and grading logic (Optional)" onNext={onNext} onSkip={onSkip}>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
        If your school has different sections (e.g. Primary, JHS, SHS) with different grading scales, create them as departments.
      </p>

      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <input value={deptName} onChange={e => setDeptName(e.target.value)} placeholder="e.g. Junior High School" style={{ flex: 1, padding: 12, borderRadius: 8, border: '1px solid #d1d5db', outline: 'none' }} />
        <button onClick={handleCreate} disabled={!deptName.trim()} style={{ padding: '0 20px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Add</button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {depts.map((d: any) => (
          <div key={d.id} style={{ padding: '8px 14px', background: '#f5f3ff', border: '1px solid #ede9fe', borderRadius: 99, color: '#6d28d9', fontWeight: 600, fontSize: 13 }}>
            {d.name}
          </div>
        ))}
      </div>
    </FormWrapper>
  )
}

function StepClasses({ onNext }: any) {
  const { user } = useAuth()
  const qc = useQueryClient()
  const { data: classes = [] } = useQuery({
    queryKey: ['classes', user?.school_id],
    queryFn: () => supabase.from('classes').select('*').eq('school_id', user!.school_id).then(r => r.data || []),
    enabled: !!user?.school_id
  })
  const { data: depts = [] } = useQuery({
    queryKey: ['departments', user?.school_id],
    queryFn: () => departmentsService.getAll(user!.school_id).then(r => r.data || []),
    enabled: !!user?.school_id
  })

  const [clsName, setClsName] = useState('')
  const [deptId, setDeptId] = useState('')

  const handleCreate = async () => {
    if (!user?.school_id || !clsName.trim()) return
    try {
      await supabase.from('classes').insert({ school_id: user.school_id, name: clsName, department_id: deptId || null })
      qc.invalidateQueries({ queryKey: ['classes', user.school_id] })
      setClsName('')
      toast.success('Class created')
    } catch (e) {
      toast.error('Failed to create class')
    }
  }

  return (
    <FormWrapper title="Classes" subtitle="Add the classes operating in your school" onNext={onNext}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <input value={clsName} onChange={e => setClsName(e.target.value)} placeholder="e.g. Basic 1" style={{ flex: 2, padding: 12, borderRadius: 8, border: '1px solid #d1d5db', outline: 'none' }} />
        <select value={deptId} onChange={e => setDeptId(e.target.value)} style={{ flex: 1, padding: 12, borderRadius: 8, border: '1px solid #d1d5db', outline: 'none', background: '#fff' }}>
          <option value="">No Dept</option>
          {depts.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <button onClick={handleCreate} disabled={!clsName.trim()} style={{ padding: '0 20px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Add</button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {classes.map((c: any) => (
          <div key={c.id} style={{ padding: '8px 14px', background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: 8, color: '#1e40af', fontWeight: 600, fontSize: 13 }}>
            {c.name}
          </div>
        ))}
      </div>
    </FormWrapper>
  )
}

function StepSubjects({ onNext }: any) {
  const { user } = useAuth()
  const qc = useQueryClient()
  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects', user?.school_id],
    queryFn: () => supabase.from('subjects').select('*').eq('school_id', user!.school_id).then(r => r.data || []),
    enabled: !!user?.school_id
  })

  const [subName, setSubName] = useState('')

  const handleCreate = async () => {
    if (!user?.school_id || !subName.trim()) return
    try {
      const names = subName.split(',').map(n => n.trim()).filter(Boolean)
      const inserts = names.map(name => ({ school_id: user.school_id, name }))
      await supabase.from('subjects').insert(inserts)
      qc.invalidateQueries({ queryKey: ['subjects', user.school_id] })
      setSubName('')
      toast.success(`${names.length} Subject(s) created`)
    } catch (e) {
      toast.error('Failed to create subjects')
    }
  }

  return (
    <FormWrapper title="Subjects" subtitle="Add subjects taught in the school" onNext={onNext}>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Tip: You can add multiple subjects at once by separating them with commas.</p>
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <input value={subName} onChange={e => setSubName(e.target.value)} placeholder="e.g. Mathematics, English, Science" style={{ flex: 1, padding: 12, borderRadius: 8, border: '1px solid #d1d5db', outline: 'none' }} />
        <button onClick={handleCreate} disabled={!subName.trim()} style={{ padding: '0 20px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Add</button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {subjects.map((s: any) => (
          <div key={s.id} style={{ padding: '8px 14px', background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: 99, color: '#166534', fontWeight: 600, fontSize: 13 }}>
            {s.name}
          </div>
        ))}
      </div>
    </FormWrapper>
  )
}

function StepGrading({ onNext, onSkip }: any) {
  const { user } = useAuth()
  const qc = useQueryClient()
  const { data: depts = [] } = useQuery({
    queryKey: ['departments', user?.school_id],
    queryFn: () => departmentsService.getAll(user!.school_id).then(r => r.data || []),
    enabled: !!user?.school_id
  })

  const [applying, setApplying] = useState(false)

  const applyTemplate = async (departmentId: string | null) => {
    if (!user?.school_id) return
    setApplying(true)
    const tpl = GRADING_TEMPLATES.GES
    try {
      if (departmentId) {
        await supabase.from('department_grading_categories').delete().eq('department_id', departmentId)
        await supabase.from('grading_scales').delete().eq('department_id', departmentId)
      }

      const { data: scaleData } = await supabase.from('grading_scales').insert({
        school_id: user.school_id,
        department_id: departmentId || null,
        name: tpl.scale.name
      }).select('id').single()

      if (scaleData) {
        const levels = tpl.scale.levels.map(l => ({ scale_id: scaleData.id, ...l }))
        await supabase.from('grading_scale_levels').insert(levels)
      }

      const cats = tpl.categories.map(c => ({ school_id: user.school_id, department_id: departmentId || null, ...c }))
      await supabase.from('department_grading_categories').insert(cats)

      toast.success('GES Standard Template applied!')
    } catch (e) {
      toast.error('Failed to apply template')
    } finally {
      setApplying(false)
    }
  }

  return (
    <FormWrapper title="Grading Setup" subtitle="Set up how reports are calculated" onNext={onNext} onSkip={onSkip}>
      <p style={{ fontSize: 14, color: 'var(--text-main)', marginBottom: 24 }}>
        We can apply the standard GES template (30% Class Score, 70% Exam Score) for you right now. 
        You can always customize this later in Settings.
      </p>

      {depts.length > 0 ? (
        <div style={{ display: 'grid', gap: 12 }}>
          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Apply to Departments:</h4>
          {depts.map((d: any) => (
            <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, border: '1px solid #e2e8f0', borderRadius: 12 }}>
              <span style={{ fontWeight: 600 }}>{d.name}</span>
              <button onClick={() => applyTemplate(d.id)} disabled={applying} style={{ padding: '6px 14px', background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ede9fe', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Apply GES Template</button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: 20, border: '1px solid #e2e8f0', borderRadius: 12, textAlign: 'center' }}>
          <button onClick={() => applyTemplate(null)} disabled={applying} style={{ padding: '10px 20px', background: '#6d28d9', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
            Apply GES Template to Entire School
          </button>
        </div>
      )}
    </FormWrapper>
  )
}

function StepDone({ onFinish }: any) {
  return (
    <div style={{ padding: 60, textAlign: 'center', minHeight: 450, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
      <h2 style={{ fontFamily: '"Playfair Display",serif', fontSize: 32, fontWeight: 700, margin: '0 0 12px' }}>You're All Set!</h2>
      <p style={{ fontSize: 16, color: 'var(--text-muted)', maxWidth: 400, lineHeight: 1.5, margin: '0 0 40px' }}>
        The core structure of your school is configured. You can now invite teachers, admit students, and start using Acadera.
      </p>
      <button onClick={onFinish} style={{ padding: '14px 32px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(16,185,129,0.4)' }}>
        Go to Dashboard
      </button>
    </div>
  )
}
