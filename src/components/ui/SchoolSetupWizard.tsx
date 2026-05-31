import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useSettings } from '../../hooks/useSettings'
import toast from 'react-hot-toast'
import { useQueryClient } from '@tanstack/react-query'
import {
  CURRICULUMS,
  SHS_PROGRAMMES,
  SHS_CORE_SUBJECTS,
  GES_BASIC_SUBJECTS,
  CLASS_NAMING_THEMES,
  DEFAULT_CLASS_STRUCTURES,
  DEFAULT_DEPARTMENTS,
  getSubjectsForSetup,
  generateClassNames,
  generateSlug,
  type SubjectDef,
  type ClassNamingTheme,
} from '../../constants/curriculumData'

// ── Styles ──────────────────────────────────────────────────────────────────
const S = {
  overlay: {
    position: 'fixed' as const, inset: 0, zIndex: 99999,
    background: '#0a0a0f', backdropFilter: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: '"DM Sans", sans-serif', padding: 0,
  },
  card: {
    background: '#0f0f1a', width: '100%', maxWidth: 900,
    height: '100vh', borderRadius: 0, boxShadow: 'none',
    position: 'relative' as const, overflow: 'hidden', display: 'flex', flexDirection: 'column' as const,
  },
  topBar: {
    position: 'absolute' as const, top: 0, left: 0, right: 0, height: 4,
    background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899)', zIndex: 2,
  },
  body: {
    padding: '60px 80px 40px', overflowY: 'auto' as const, flex: 1,
    maxWidth: 1200, margin: '0 auto', width: '100%',
  },
  h2: {
    fontSize: 32, fontWeight: 800, color: '#ffffff', marginBottom: 12,
    letterSpacing: '-0.02em',
  },
  subtitle: {
    color: '#94a3b8', lineHeight: 1.7, marginBottom: 40, fontSize: 16,
    maxWidth: 600,
  },
  footer: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '24px 80px 40px', borderTop: '1px solid rgba(255,255,255,0.05)',
    maxWidth: 1200, margin: '0 auto', width: '100%',
  },
  btnPrimary: (disabled = false) => ({
    padding: '14px 32px', background: disabled ? '#374151' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: 'white', border: 'none', borderRadius: 12, fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 15, transition: 'all .2s',
    boxShadow: disabled ? 'none' : '0 4px 20px rgba(99, 102, 241, 0.4)',
  }),
  btnGhost: {
    padding: '14px 28px', background: 'transparent', color: '#94a3b8', border: '1.5px solid rgba(255,255,255,0.1)',
    fontWeight: 700, cursor: 'pointer', fontSize: 15, borderRadius: 12,
    transition: 'all .2s',
  },
  optionCard: (selected: boolean, color?: string) => ({
    padding: 20, borderRadius: 16,
    border: `2px solid ${selected ? (color || '#6366f1') : 'rgba(255,255,255,0.08)'}`,
    background: selected ? `${color || '#6366f1'}15` : 'rgba(255,255,255,0.02)',
    cursor: 'pointer', display: 'flex', flexDirection: 'column' as const, gap: 6, transition: 'all 0.2s',
  }),
  chip: (selected: boolean, color?: string) => ({
    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px',
    borderRadius: 24, border: `1.5px solid ${selected ? (color || '#6366f1') : 'rgba(255,255,255,0.1)'}`,
    background: selected ? `${color || '#6366f1'}20` : 'rgba(255,255,255,0.02)', cursor: 'pointer',
    fontSize: 14, fontWeight: 600, color: selected ? (color || '#6366f1') : '#94a3b8',
    transition: 'all .15s',
  }),
  input: {
    width: '100%', padding: '14px 16px', borderRadius: 12, fontSize: 15, fontWeight: 500,
    border: '1.5px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)',
    color: '#ffffff', outline: 'none', fontFamily: 'inherit',
    transition: 'all .2s',
  },
  label: { fontSize: 14, fontWeight: 700, color: '#e2e8f0', marginBottom: 8, display: 'block' as const },
  progress: {
    display: 'flex', gap: 6, padding: '0 80px 24px',
    maxWidth: 1200, margin: '0 auto', width: '100%',
  },
  progressDot: (active: boolean, done: boolean) => ({
    flex: 1, height: 3, borderRadius: 3,
    background: done ? '#6366f1' : active ? '#8b5cf6' : 'rgba(255,255,255,0.1)',
    transition: 'all .3s',
  }),
}

const TOTAL_STEPS = 6

export default function SchoolSetupWizard() {
  const { user } = useAuth()
  const { data: settings, isLoading } = useSettings()
  const qc = useQueryClient()

  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)

  // Step 1: School Profile
  const [schoolName, setSchoolName] = useState('')
  const [motto, setMotto] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [slug, setSlug] = useState('')

  // Step 2: Institution Type
  const [schoolType, setSchoolType] = useState<'basic' | 'shs' | 'remedial' | 'mixed'>('basic')

  // Step 3: Operating Model
  const [hasEvening, setHasEvening] = useState(false)
  const [hasBranches, setHasBranches] = useState(false)

  // Step 4: Curriculum & Subjects
  const [selectedCurriculums, setSelectedCurriculums] = useState<string[]>([])
  const [selectedProgrammes, setSelectedProgrammes] = useState<string[]>([])
  const [selectedElectives, setSelectedElectives] = useState<Record<string, string[]>>({})

  // Step 5: Classes & Departments
  const [classTheme, setClassTheme] = useState<string>('none')
  const [streamCount, setStreamCount] = useState(2)
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([])
  const [customDepartment, setCustomDepartment] = useState('')

  // Auto-open for admins on every visit until they explicitly click done
  useEffect(() => {
    if (!isLoading && user?.role === 'admin') {
      setIsOpen(true)
    }
  }, [isLoading, user?.role])

  // Pre-fill school data
  useEffect(() => {
    if (isOpen && user) {
      const fetchSchool = async () => {
        const { data } = await supabase.from('schools').select('*').eq('id', user.school_id).single()
        if (data) {
          setSchoolName(data.name || '')
          setMotto(data.motto || '')
          setAddress(data.address || '')
          setPhone(data.phone || '')
          setSlug(data.slug || generateSlug(data.name || ''))
        }
      }
      fetchSchool()
    }
  }, [isOpen, user])

  // Auto-select matching curriculums when school type changes
  useEffect(() => {
    const matching = CURRICULUMS.filter(c => c.schoolTypes.includes(schoolType)).map(c => c.id)
    setSelectedCurriculums(matching)
  }, [schoolType])

  // Auto-select default departments when school type changes
  useEffect(() => {
    setSelectedDepartments(DEFAULT_DEPARTMENTS[schoolType] ?? ['General Studies'])
  }, [schoolType])

  // ── Derived data ──────────────────────────────────────────────────────────
  const needsSHSPicker = selectedCurriculums.includes('wassce')

  const resolvedSubjects = useMemo(
    () => getSubjectsForSetup(selectedCurriculums, selectedProgrammes, selectedElectives),
    [selectedCurriculums, selectedProgrammes, selectedElectives]
  )

  const selectedTheme = CLASS_NAMING_THEMES.find(t => t.id === classTheme) ?? CLASS_NAMING_THEMES[0]

  const previewClasses = useMemo(() => {
    const structure = DEFAULT_CLASS_STRUCTURES[schoolType] ?? DEFAULT_CLASS_STRUCTURES.basic
    const names: string[] = []
    structure.forEach(level => {
      level.baseNames.forEach(base => {
        names.push(...generateClassNames(base, streamCount, selectedTheme))
      })
    })
    return names
  }, [schoolType, streamCount, classTheme, selectedTheme])

  // ── Helpers ───────────────────────────────────────────────────────────────
  const toggleArr = (arr: string[], val: string): string[] =>
    arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]

  const toggleElective = (progId: string, code: string) => {
    setSelectedElectives(prev => {
      const curr = prev[progId] ?? SHS_PROGRAMMES.find(p => p.id === progId)!.electives.map(e => e.code)
      return { ...prev, [progId]: curr.includes(code) ? curr.filter(c => c !== code) : [...curr, code] }
    })
  }

  const addCustomDepartment = () => {
    const name = customDepartment.trim()
    if (name && !selectedDepartments.includes(name)) {
      setSelectedDepartments(prev => [...prev, name])
      setCustomDepartment('')
    }
  }

  const canProceed = (s: number): boolean => {
    switch (s) {
      case 1: return !!schoolName.trim() && !!slug.trim()
      case 4: return selectedCurriculums.length > 0 && (!needsSHSPicker || selectedProgrammes.length > 0)
      case 5: return previewClasses.length > 0 && selectedDepartments.length > 0
      default: return true
    }
  }

  // ── Final submit ──────────────────────────────────────────────────────────
  const handleComplete = async () => {
    setSaving(true)
    try {
      const schoolId = user!.school_id

      // 1. Update school record
      await supabase.from('schools').update({
        name: schoolName, motto, address, phone, slug,
      }).eq('id', schoolId)

      // 2. Update school settings
      await supabase.from('school_settings').update({
        school_type: schoolType,
        has_evening_classes: hasEvening,
        has_branches: hasBranches,
        curriculums: selectedCurriculums,
        shs_programmes: selectedProgrammes,
        setup_completed: true,
      }).eq('school_id', schoolId)

      // 3. Bulk insert subjects (deduped by name)
      if (resolvedSubjects.length > 0) {
        const subjectRows = resolvedSubjects.map(s => ({
          school_id: schoolId, name: s.name, code: s.code,
        }))
        await supabase.from('subjects').upsert(subjectRows, { onConflict: 'school_id,name', ignoreDuplicates: true })
      }

      // 4. Bulk insert departments
      if (selectedDepartments.length > 0) {
        const deptRows = selectedDepartments.map(name => ({ school_id: schoolId, name }))
        await supabase.from('departments').upsert(deptRows, { onConflict: 'school_id,name', ignoreDuplicates: true })
      }

      // 5. Bulk insert classes
      if (previewClasses.length > 0) {
        const classRows = previewClasses.map(name => ({ school_id: schoolId, name }))
        await supabase.from('classes').upsert(classRows, { onConflict: 'school_id,name', ignoreDuplicates: true })
      }

      toast.success('🎉 School setup complete! Welcome aboard.')
      setIsOpen(false)
      qc.invalidateQueries({ queryKey: ['settings'] })
      qc.invalidateQueries({ queryKey: ['subjects'] })
      qc.invalidateQueries({ queryKey: ['departments'] })
      qc.invalidateQueries({ queryKey: ['classes'] })
    } catch (err: any) {
      toast.error(err.message || 'Setup failed — please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <AnimatePresence>
      {isOpen && (
        <div style={S.overlay}>
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            style={S.card}
          >
            <div style={S.topBar} />

            {/* Progress bar */}
            <div style={S.progress}>
              {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                <div key={i} style={S.progressDot(i + 1 === step, i + 1 < step)} />
              ))}
            </div>

            {/* Scrollable body */}
            <div style={S.body}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.2 }}
                >
                  {step === 1 && <Step1_Profile
                    schoolName={schoolName} setSchoolName={setSchoolName}
                    motto={motto} setMotto={setMotto}
                    address={address} setAddress={setAddress}
                    phone={phone} setPhone={setPhone}
                    slug={slug} setSlug={setSlug}
                  />}
                  {step === 2 && <Step2_InstitutionType schoolType={schoolType} setSchoolType={setSchoolType} />}
                  {step === 3 && <Step3_OperatingModel
                    hasEvening={hasEvening} setHasEvening={setHasEvening}
                    hasBranches={hasBranches} setHasBranches={setHasBranches}
                  />}
                  {step === 4 && <Step4_Curriculum
                    schoolType={schoolType}
                    selectedCurriculums={selectedCurriculums} setSelectedCurriculums={setSelectedCurriculums}
                    selectedProgrammes={selectedProgrammes} setSelectedProgrammes={setSelectedProgrammes}
                    selectedElectives={selectedElectives} toggleElective={toggleElective}
                    needsSHSPicker={needsSHSPicker} toggleArr={toggleArr}
                  />}
                  {step === 5 && <Step5_Classes
                    classTheme={classTheme} setClassTheme={setClassTheme}
                    streamCount={streamCount} setStreamCount={setStreamCount}
                    previewClasses={previewClasses}
                    selectedDepartments={selectedDepartments} setSelectedDepartments={setSelectedDepartments}
                    customDepartment={customDepartment} setCustomDepartment={setCustomDepartment}
                    addCustomDepartment={addCustomDepartment} toggleArr={toggleArr}
                    schoolType={schoolType}
                  />}
                  {step === 6 && <Step6_Review
                    schoolName={schoolName} slug={slug} schoolType={schoolType}
                    hasEvening={hasEvening} hasBranches={hasBranches}
                    selectedCurriculums={selectedCurriculums} selectedProgrammes={selectedProgrammes}
                    resolvedSubjects={resolvedSubjects} previewClasses={previewClasses}
                    selectedDepartments={selectedDepartments}
                  />}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div style={S.footer}>
              {step > 1 ? (
                <button style={S.btnGhost} onClick={() => setStep(s => s - 1)}>← Back</button>
              ) : <div />}
              {step < TOTAL_STEPS ? (
                <button
                  style={S.btnPrimary(!canProceed(step))}
                  disabled={!canProceed(step)}
                  onClick={() => setStep(s => s + 1)}
                >
                  Next Step →
                </button>
              ) : (
                <button
                  style={S.btnPrimary(saving)}
                  disabled={saving}
                  onClick={handleComplete}
                >
                  {saving ? '⏳ Saving…' : '🚀 Complete Setup'}
                </button>
              )}
            </div>

            {/* Step counter */}
            <div style={{ textAlign: 'center', padding: '0 0 20px', fontSize: 13, color: '#64748b', fontWeight: 600 }}>
              Step {step} of {TOTAL_STEPS}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// STEP 1 — School Profile + Slug
// ═══════════════════════════════════════════════════════════════════════════════
function Step1_Profile({ schoolName, setSchoolName, motto, setMotto, address, setAddress, phone, setPhone, slug, setSlug }: any) {
  return (
    <>
      <div style={{ fontSize: 56, marginBottom: 16, filter: 'drop-shadow(0 0 30px rgba(99, 102, 241, 0.3))' }}>🏫</div>
      <h2 style={S.h2}>Welcome! Let's set up your school.</h2>
      <p style={S.subtitle}>Confirm your school details. These appear on report cards, receipts, and your public profile.</p>

      <div style={{ display: 'grid', gap: 20 }}>
        <div>
          <label style={S.label}>School Name *</label>
          <input style={S.input} value={schoolName} onChange={e => { setSchoolName(e.target.value); setSlug(generateSlug(e.target.value)) }} placeholder="e.g. Estev Royal School" />
        </div>
        <div>
          <label style={S.label}>Motto</label>
          <input style={S.input} value={motto} onChange={e => setMotto(e.target.value)} placeholder="e.g. Excellence in Education" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={S.label}>Address</label>
            <input style={S.input} value={address} onChange={e => setAddress(e.target.value)} placeholder="Kumasi, Ashanti" />
          </div>
          <div>
            <label style={S.label}>Phone</label>
            <input style={S.input} value={phone} onChange={e => setPhone(e.target.value)} placeholder="024 000 0000" />
          </div>
        </div>
        <div>
          <label style={S.label}>Public URL Slug</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.02)', padding: '14px 16px', borderRadius: 12, border: '1.5px solid rgba(255,255,255,0.1)' }}>
            <span style={{ color: '#6366f1', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}>nexora.app/@</span>
            <input
              style={{ ...S.input, flex: 1, background: 'transparent', border: 'none', padding: 0, fontFamily: 'monospace' }}
              value={slug}
              onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
              placeholder="estevroyalschool"
            />
          </div>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>This is your school's public profile URL. Use only lowercase letters and numbers.</p>
        </div>
      </div>
    </>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// STEP 2 — Institution Type
// ═══════════════════════════════════════════════════════════════════════════════
function Step2_InstitutionType({ schoolType, setSchoolType }: any) {
  const types = [
    { id: 'basic', icon: '📚', label: 'Basic School', desc: 'Nursery / KG to JHS — GES standard curriculum' },
    { id: 'shs', icon: '🎓', label: 'Senior High School', desc: 'SHS 1–3 with WASSCE programmes, electives, and continuous assessment' },
    { id: 'remedial', icon: '📝', label: 'Remedial / Exam Prep', desc: 'Intensive WASSCE prep for Nov/Dec & May/June candidates' },
    { id: 'mixed', icon: '🏫', label: 'Mixed / Comprehensive', desc: 'Combination of multiple levels (e.g. KG–SHS or JHS–SHS)' },
  ]

  return (
    <>
      <div style={{ fontSize: 56, marginBottom: 16, filter: 'drop-shadow(0 0 30px rgba(99, 102, 241, 0.3))' }}>🎒</div>
      <h2 style={S.h2}>What type of institution is this?</h2>
      <p style={S.subtitle}>This configures grading scales, class structures, and available curriculums.</p>

      <div style={{ display: 'grid', gap: 12 }}>
        {types.map(t => (
          <div key={t.id} onClick={() => setSchoolType(t.id)} style={S.optionCard(schoolType === t.id)}>
            <span style={{ fontWeight: 700, color: '#ffffff', fontSize: 16 }}>{t.icon} {t.label}</span>
            <span style={{ fontSize: 14, color: '#94a3b8' }}>{t.desc}</span>
          </div>
        ))}
      </div>
    </>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// STEP 3 — Operating Model + Branches
// ═══════════════════════════════════════════════════════════════════════════════
function Step3_OperatingModel({ hasEvening, setHasEvening, hasBranches, setHasBranches }: any) {
  return (
    <>
      <div style={{ fontSize: 56, marginBottom: 16, filter: 'drop-shadow(0 0 30px rgba(99, 102, 241, 0.3))' }}>🌙</div>
      <h2 style={S.h2}>Operating Model</h2>
      <p style={S.subtitle}>Tell us how your school runs so we can configure session types and features.</p>

      <div style={{ display: 'grid', gap: 12, marginBottom: 32 }}>
        <div onClick={() => setHasEvening(false)} style={S.optionCard(!hasEvening)}>
          <span style={{ fontWeight: 700, color: '#ffffff', fontSize: 16 }}>☀️ Standard Day School</span>
          <span style={{ fontSize: 14, color: '#94a3b8' }}>Classes run during regular daytime hours only.</span>
        </div>
        <div onClick={() => setHasEvening(true)} style={S.optionCard(hasEvening)}>
          <span style={{ fontWeight: 700, color: '#ffffff', fontSize: 16 }}>🌙 Evening & Weekend Classes</span>
          <span style={{ fontSize: 14, color: '#94a3b8' }}>Tag students and staff as Day, Evening, or Weekend session.</span>
        </div>
      </div>

      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: '#ffffff' }}>🏢 Multi-Campus / Branches</h3>
      <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 16 }}>Does your school have multiple branches or campuses?</p>

      <div style={{ display: 'grid', gap: 12 }}>
        <div onClick={() => setHasBranches(false)} style={S.optionCard(!hasBranches)}>
          <span style={{ fontWeight: 700, color: '#ffffff', fontSize: 16 }}>Single Campus</span>
          <span style={{ fontSize: 14, color: '#94a3b8' }}>Just one school location.</span>
        </div>
        <div onClick={() => setHasBranches(true)} style={S.optionCard(hasBranches)}>
          <span style={{ fontWeight: 700, color: '#ffffff', fontSize: 16 }}>Multiple Branches</span>
          <span style={{ fontSize: 14, color: '#94a3b8' }}>You manage several campuses from this main admin portal. You'll be able to add branches after setup.</span>
        </div>
      </div>
    </>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// STEP 4 — Curriculum & Subjects
// ═══════════════════════════════════════════════════════════════════════════════
function Step4_Curriculum({ schoolType, selectedCurriculums, setSelectedCurriculums, selectedProgrammes, setSelectedProgrammes, selectedElectives, toggleElective, needsSHSPicker, toggleArr }: any) {
  const relevantCurriculums = CURRICULUMS.filter(c => c.schoolTypes.includes(schoolType))

  return (
    <>
      <div style={{ fontSize: 56, marginBottom: 16, filter: 'drop-shadow(0 0 30px rgba(99, 102, 241, 0.3))' }}>📖</div>
      <h2 style={S.h2}>Curriculum & Subjects</h2>
      <p style={S.subtitle}>Select the curriculums your school follows. We'll auto-populate your subject list.</p>

      {/* Curriculum selection */}
      <div style={{ display: 'grid', gap: 12, marginBottom: 28 }}>
        {relevantCurriculums.map(c => (
          <div key={c.id} onClick={() => setSelectedCurriculums(toggleArr(selectedCurriculums, c.id))} style={S.optionCard(selectedCurriculums.includes(c.id))}>
            <span style={{ fontWeight: 700, color: '#ffffff', fontSize: 16 }}>{c.icon} {c.label}</span>
            <span style={{ fontSize: 14, color: '#94a3b8' }}>{c.description}</span>
          </div>
        ))}
      </div>

      {/* SHS Programme Picker */}
      {needsSHSPicker && (
        <>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: '#ffffff' }}>
            🎓 SHS Programmes Offered
          </h3>
          <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 16 }}>Select which programmes your school offers. You can then pick which elective subjects you teach per programme.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
            {SHS_PROGRAMMES.map(p => (
              <div
                key={p.id}
                onClick={() => setSelectedProgrammes(toggleArr(selectedProgrammes, p.id))}
                style={{
                  ...S.optionCard(selectedProgrammes.includes(p.id), p.color),
                  padding: 16, textAlign: 'center' as const, background: selectedProgrammes.includes(p.id) ? p.bg : 'transparent',
                }}
              >
                <span style={{ fontSize: 32 }}>{p.icon}</span>
                <span style={{ fontWeight: 700, fontSize: 14, color: selectedProgrammes.includes(p.id) ? p.color : '#94a3b8' }}>{p.label}</span>
              </div>
            ))}
          </div>

          {/* Elective picker per selected programme */}
          {selectedProgrammes.map(progId => {
            const prog = SHS_PROGRAMMES.find(p => p.id === progId)
            if (!prog) return null
            const selected = selectedElectives[progId] ?? prog.electives.map(e => e.code)

            return (
              <div key={progId} style={{ marginBottom: 24, padding: 20, borderRadius: 16, border: `1.5px solid ${prog.color}40`, background: prog.bg }}>
                <h4 style={{ fontSize: 16, fontWeight: 700, color: prog.color, marginBottom: 12 }}>
                  {prog.icon} {prog.label} — Electives
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {prog.electives.map(e => (
                    <span
                      key={e.code}
                      onClick={() => toggleElective(progId, e.code)}
                      style={S.chip(selected.includes(e.code), prog.color)}
                    >
                      {selected.includes(e.code) ? '✓ ' : ''}{e.name}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}

          {/* Core subjects notice */}
          <div style={{ padding: 16, borderRadius: 12, background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', marginBottom: 8 }}>
            <p style={{ fontSize: 13, color: '#a5b4fc', fontWeight: 600, margin: 0 }}>
              ℹ️ Core subjects (Core Maths, English, Integrated Science, Social Studies) are automatically included for all SHS programmes.
            </p>
          </div>
        </>
      )}
    </>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// STEP 5 — Classes & Departments
// ═══════════════════════════════════════════════════════════════════════════════
function Step5_Classes({ classTheme, setClassTheme, streamCount, setStreamCount, previewClasses, selectedDepartments, setSelectedDepartments, customDepartment, setCustomDepartment, addCustomDepartment, toggleArr, schoolType }: any) {
  return (
    <>
      <div style={{ fontSize: 56, marginBottom: 16, filter: 'drop-shadow(0 0 30px rgba(99, 102, 241, 0.3))' }}>🏷️</div>
      <h2 style={S.h2}>Classes & Departments</h2>
      <p style={S.subtitle}>Choose how your classes are named and which departments to create.</p>

      {/* Naming theme */}
      <label style={S.label}>Class Naming Theme</label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        {CLASS_NAMING_THEMES.map(t => (
          <div
            key={t.id}
            onClick={() => setClassTheme(t.id)}
            style={{
              ...S.optionCard(classTheme === t.id),
              padding: 14, textAlign: 'center' as const,
            }}
          >
            <span style={{ fontSize: 28 }}>{t.icon}</span>
            <span style={{ fontWeight: 700, fontSize: 13, color: classTheme === t.id ? '#6366f1' : '#94a3b8' }}>{t.label}</span>
            {t.preview && <span style={{ fontSize: 11, color: '#64748b' }}>{t.preview}</span>}
          </div>
        ))}
      </div>

      {/* Streams per year */}
      <label style={S.label}>Streams per Year Group</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button onClick={() => setStreamCount(Math.max(1, streamCount - 1))} style={{ width: 44, height: 44, borderRadius: 12, border: '1.5px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', fontSize: 20, cursor: 'pointer', fontWeight: 700, color: '#ffffff' }}>−</button>
        <span style={{ fontSize: 28, fontWeight: 800, color: '#6366f1', minWidth: 32, textAlign: 'center' }}>{streamCount}</span>
        <button onClick={() => setStreamCount(Math.min(10, streamCount + 1))} style={{ width: 44, height: 44, borderRadius: 12, border: '1.5px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', fontSize: 20, cursor: 'pointer', fontWeight: 700, color: '#ffffff' }}>+</button>
        <span style={{ fontSize: 14, color: '#94a3b8' }}>stream{streamCount !== 1 ? 's' : ''}</span>
      </div>

      {/* Class preview */}
      <label style={S.label}>Preview — {previewClasses.length} classes</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28, padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', maxHeight: 140, overflowY: 'auto' }}>
        {previewClasses.map((name: string, i: number) => (
          <span key={i} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', fontSize: 13, fontWeight: 600 }}>{name}</span>
        ))}
      </div>

      {/* Departments */}
      <label style={S.label}>Departments</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {(DEFAULT_DEPARTMENTS[schoolType] ?? ['General Studies']).map((dept: string) => (
          <span
            key={dept}
            onClick={() => setSelectedDepartments(toggleArr(selectedDepartments, dept))}
            style={S.chip(selectedDepartments.includes(dept))}
          >
            {selectedDepartments.includes(dept) ? '✓ ' : ''}{dept}
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <input
          style={{ ...S.input, flex: 1 }}
          value={customDepartment}
          onChange={e => setCustomDepartment(e.target.value)}
          placeholder="Add custom department…"
          onKeyDown={e => e.key === 'Enter' && addCustomDepartment()}
        />
        <button onClick={addCustomDepartment} style={{ padding: '12px 20px', borderRadius: 12, border: '1.5px solid #6366f1', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
          + Add
        </button>
      </div>
      {/* Show custom departments */}
      {selectedDepartments.filter((d: string) => !(DEFAULT_DEPARTMENTS[schoolType] ?? []).includes(d)).length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {selectedDepartments.filter((d: string) => !(DEFAULT_DEPARTMENTS[schoolType] ?? []).includes(d)).map((dept: string) => (
            <span key={dept} style={{ ...S.chip(true), paddingRight: 8 }}>
              {dept}
              <span onClick={() => setSelectedDepartments((prev: string[]) => prev.filter(d => d !== dept))} style={{ marginLeft: 8, cursor: 'pointer', opacity: 0.7, fontWeight: 800 }}>×</span>
            </span>
          ))}
        </div>
      )}
    </>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// STEP 6 — Review & Launch
// ═══════════════════════════════════════════════════════════════════════════════
function Step6_Review({ schoolName, slug, schoolType, hasEvening, hasBranches, selectedCurriculums, selectedProgrammes, resolvedSubjects, previewClasses, selectedDepartments }: {
  schoolName: string; slug: string; schoolType: string; hasEvening: boolean; hasBranches: boolean;
  selectedCurriculums: string[]; selectedProgrammes: string[];
  resolvedSubjects: SubjectDef[]; previewClasses: string[]; selectedDepartments: string[];
}) {
  const row = (label: string, value: string | number) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ fontSize: 14, color: '#94a3b8', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: '#ffffff', textAlign: 'right', maxWidth: '60%' }}>{value}</span>
    </div>
  )

  const typeLabel: Record<string, string> = { basic: '📚 Basic School', shs: '🎓 Senior High', remedial: '📝 Remedial', mixed: '🏫 Mixed' }
  const currLabels = selectedCurriculums.map(id => CURRICULUMS.find(c => c.id === id)?.label ?? id).join(', ')
  const progLabels = selectedProgrammes.map(id => SHS_PROGRAMMES.find(p => p.id === id)?.label ?? id).join(', ')

  return (
    <>
      <div style={{ fontSize: 56, marginBottom: 16, filter: 'drop-shadow(0 0 30px rgba(99, 102, 241, 0.3))' }}>🚀</div>
      <h2 style={S.h2}>Review & Launch</h2>
      <p style={S.subtitle}>Double-check everything below. You can always change settings later.</p>

      <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 16, padding: 24, border: '1px solid rgba(255,255,255,0.08)' }}>
        {row('School', schoolName)}
        {row('Public URL', `/@${slug}`)}
        {row('Type', typeLabel[schoolType] || schoolType)}
        {row('Session', hasEvening ? '🌙 Evening & Weekend' : '☀️ Day School')}
        {row('Branches', hasBranches ? '🏢 Multi-campus' : 'Single campus')}
        {row('Curriculums', currLabels)}
        {progLabels && row('SHS Programmes', progLabels)}
        {row('Subjects', `${resolvedSubjects.length} subjects`)}
        {row('Classes', `${previewClasses.length} classes`)}
        {row('Departments', `${selectedDepartments.length} departments`)}
      </div>

      {/* Quick preview chips */}
      <div style={{ marginTop: 20 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: 8 }}>Classes:</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 80, overflowY: 'auto' }}>
          {previewClasses.slice(0, 20).map((c: string, i: number) => (
            <span key={i} style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', fontSize: 12, fontWeight: 600 }}>{c}</span>
          ))}
          {previewClasses.length > 20 && <span style={{ fontSize: 11, color: '#94a3b8', padding: '3px 8px' }}>+{previewClasses.length - 20} more</span>}
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: 8 }}>Departments:</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {selectedDepartments.map((d: string, i: number) => (
            <span key={i} style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', fontSize: 12, fontWeight: 600 }}>{d}</span>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 24, padding: 16, borderRadius: 12, background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
        <p style={{ fontSize: 13, color: '#86efac', fontWeight: 600, margin: 0 }}>
          ✅ Clicking "Complete Setup" will create {resolvedSubjects.length} subjects, {previewClasses.length} classes, and {selectedDepartments.length} departments in your school.
        </p>
      </div>
    </>
  )
}
