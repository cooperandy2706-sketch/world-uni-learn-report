// src/constants/curriculumData.ts
// Master constants for GES/WAEC curriculums, SHS programmes, subjects, and class naming themes

// ── Curriculums ──────────────────────────────────────────────────────────────
export interface CurriculumDef {
  id: string
  label: string
  icon: string
  description: string
  schoolTypes: Array<'basic' | 'shs' | 'remedial' | 'mixed'>
}

export const CURRICULUMS: CurriculumDef[] = [
  {
    id: 'ges_basic',
    label: 'GES Basic School (KG–JHS)',
    icon: '📚',
    description: 'Ghana Education Service standard curriculum for Kindergarten through Junior High School.',
    schoolTypes: ['basic', 'mixed'],
  },
  {
    id: 'wassce',
    label: 'WASSCE / Senior High School',
    icon: '🎓',
    description: 'West African Senior School Certificate Examination curriculum for SHS 1–3.',
    schoolTypes: ['shs', 'mixed'],
  },
  {
    id: 'wassce_remedial',
    label: 'WASSCE Remedial / Nov–Dec',
    icon: '📝',
    description: 'Intensive exam preparation for private WASSCE candidates (May/June & Nov/Dec sittings).',
    schoolTypes: ['remedial', 'mixed'],
  },
  {
    id: 'igcse',
    label: 'Cambridge IGCSE',
    icon: '🌐',
    description: 'Cambridge International General Certificate of Secondary Education — internationally recognised.',
    schoolTypes: ['shs', 'mixed'],
  },
  {
    id: 'montessori',
    label: 'Montessori',
    icon: '🌱',
    description: 'Child-led, hands-on learning approach developed by Dr. Maria Montessori.',
    schoolTypes: ['basic', 'mixed'],
  },
]

// ── SHS Core Subjects (all programmes) ──────────────────────────────────────
export interface SubjectDef {
  name: string
  code: string
  category: 'STEM' | 'Language' | 'Humanities' | 'Arts' | 'Physical' | 'Technical' | 'General'
}

export const SHS_CORE_SUBJECTS: SubjectDef[] = [
  { name: 'Core Mathematics', code: 'CMATH', category: 'STEM' },
  { name: 'English Language', code: 'ENG', category: 'Language' },
  { name: 'Integrated Science', code: 'ISCI', category: 'STEM' },
  { name: 'Social Studies', code: 'SOC', category: 'Humanities' },
]

// ── SHS Programmes with their elective subjects ───────────────────────────────
export interface ShsProgramme {
  id: string
  label: string
  icon: string
  color: string
  bg: string
  description: string
  electives: SubjectDef[]
}

export const SHS_PROGRAMMES: ShsProgramme[] = [
  {
    id: 'general_arts',
    label: 'General Arts',
    icon: '📖',
    color: '#7c3aed',
    bg: '#f5f3ff',
    description: 'Humanities, languages, and social sciences. Leads to Law, Journalism, Education, Social Work.',
    electives: [
      { name: 'Literature in English', code: 'LIT', category: 'Language' },
      { name: 'Government', code: 'GOV', category: 'Humanities' },
      { name: 'History', code: 'HIS', category: 'Humanities' },
      { name: 'Economics', code: 'ECO', category: 'Humanities' },
      { name: 'French', code: 'FRE', category: 'Language' },
      { name: 'Geography', code: 'GEO', category: 'Humanities' },
      { name: 'Christian Religious Studies', code: 'CRS', category: 'Humanities' },
      { name: 'Islamic Religious Studies', code: 'IRS', category: 'Humanities' },
      { name: 'Ghanaian Languages', code: 'GHL', category: 'Language' },
      { name: 'Music', code: 'MUS', category: 'Arts' },
    ],
  },
  {
    id: 'science',
    label: 'Science',
    icon: '🔬',
    color: '#0891b2',
    bg: '#ecfeff',
    description: 'Physical and life sciences. Leads to Medicine, Engineering, Pharmacy, Research.',
    electives: [
      { name: 'Elective Mathematics', code: 'EMATH', category: 'STEM' },
      { name: 'Physics', code: 'PHY', category: 'STEM' },
      { name: 'Chemistry', code: 'CHE', category: 'STEM' },
      { name: 'Biology', code: 'BIO', category: 'STEM' },
      { name: 'Further Mathematics', code: 'FMATH', category: 'STEM' },
    ],
  },
  {
    id: 'business',
    label: 'Business',
    icon: '💼',
    color: '#059669',
    bg: '#ecfdf5',
    description: 'Commerce, accounting, and enterprise. Leads to Finance, Accounting, Marketing, Banking.',
    electives: [
      { name: 'Business Management', code: 'BUS', category: 'Humanities' },
      { name: 'Accounting', code: 'ACC', category: 'Humanities' },
      { name: 'Economics', code: 'ECO', category: 'Humanities' },
      { name: 'Cost Accounting', code: 'CACC', category: 'Humanities' },
      { name: 'Financial Accounting', code: 'FACC', category: 'Humanities' },
      { name: 'Business Statistics', code: 'BSTA', category: 'STEM' },
    ],
  },
  {
    id: 'visual_arts',
    label: 'Visual Arts',
    icon: '🎨',
    color: '#ec4899',
    bg: '#fdf2f8',
    description: 'Creative arts, design, and crafts. Leads to Fine Art, Design, Architecture, Fashion.',
    electives: [
      { name: 'Picture Making', code: 'PIM', category: 'Arts' },
      { name: 'Ceramics', code: 'CER', category: 'Arts' },
      { name: 'Leatherwork', code: 'LEA', category: 'Arts' },
      { name: 'Textiles', code: 'TEX', category: 'Arts' },
      { name: 'Jewellery', code: 'JEW', category: 'Arts' },
      { name: 'Graphic Design', code: 'GRD', category: 'Arts' },
      { name: 'Sculpture', code: 'SCU', category: 'Arts' },
    ],
  },
  {
    id: 'home_economics',
    label: 'Home Economics',
    icon: '🏠',
    color: '#d97706',
    bg: '#fffbeb',
    description: 'Nutrition, textiles, and household management. Leads to Catering, Nutrition, Home Science.',
    electives: [
      { name: 'Food & Nutrition', code: 'FDN', category: 'General' },
      { name: 'Clothing & Textiles', code: 'CLT', category: 'General' },
      { name: 'General Knowledge in Art', code: 'GKA', category: 'Arts' },
      { name: 'Management in Living', code: 'MIL', category: 'General' },
    ],
  },
  {
    id: 'technical',
    label: 'Technical',
    icon: '⚙️',
    color: '#475569',
    bg: '#f8fafc',
    description: 'Applied engineering and trade skills. Leads to Engineering, Construction, Electricals, Auto.',
    electives: [
      { name: 'Technical Drawing', code: 'TDR', category: 'Technical' },
      { name: 'Applied Electricity', code: 'AEL', category: 'Technical' },
      { name: 'Auto Mechanics', code: 'AUT', category: 'Technical' },
      { name: 'Building Construction', code: 'BLD', category: 'Technical' },
      { name: 'Electronics', code: 'ELC', category: 'Technical' },
      { name: 'Metal Work', code: 'MET', category: 'Technical' },
      { name: 'Wood Work', code: 'WOD', category: 'Technical' },
    ],
  },
  {
    id: 'agricultural',
    label: 'Agricultural Science',
    icon: '🌾',
    color: '#16a34a',
    bg: '#f0fdf4',
    description: 'Farming, animal science, and agri-business. Leads to Agriculture, Veterinary, Agribusiness.',
    electives: [
      { name: 'Animal Husbandry', code: 'ANH', category: 'STEM' },
      { name: 'Crop Husbandry & Horticulture', code: 'CRH', category: 'STEM' },
      { name: 'Farm Management', code: 'FMG', category: 'Humanities' },
      { name: 'Agricultural Science', code: 'AGSC', category: 'STEM' },
    ],
  },
]

// ── GES Basic School Subjects ────────────────────────────────────────────────
export const GES_BASIC_SUBJECTS: SubjectDef[] = [
  { name: 'Mathematics', code: 'MATH', category: 'STEM' },
  { name: 'English Language', code: 'ENG', category: 'Language' },
  { name: 'Integrated Science', code: 'ISCI', category: 'STEM' },
  { name: 'Social Studies', code: 'SOC', category: 'Humanities' },
  { name: 'Religious & Moral Education', code: 'RME', category: 'Humanities' },
  { name: 'ICT', code: 'ICT', category: 'STEM' },
  { name: 'French', code: 'FRE', category: 'Language' },
  { name: 'Creative Arts & Design', code: 'CRA', category: 'Arts' },
  { name: 'Ghanaian Language', code: 'GHL', category: 'Language' },
  { name: 'Physical Education', code: 'PE', category: 'Physical' },
  { name: 'Our World Our People', code: 'OWOP', category: 'Humanities' },
  { name: 'Computing', code: 'COM', category: 'STEM' },
  { name: 'History', code: 'HIS', category: 'Humanities' },
  { name: 'Music', code: 'MUS', category: 'Arts' },
]

// ── WASSCE Remedial Subjects (exam-focused subset) ───────────────────────────
export const WASSCE_REMEDIAL_SUBJECTS: SubjectDef[] = [
  ...SHS_CORE_SUBJECTS,
  { name: 'Elective Mathematics', code: 'EMATH', category: 'STEM' },
  { name: 'Physics', code: 'PHY', category: 'STEM' },
  { name: 'Chemistry', code: 'CHE', category: 'STEM' },
  { name: 'Biology', code: 'BIO', category: 'STEM' },
  { name: 'Economics', code: 'ECO', category: 'Humanities' },
  { name: 'Government', code: 'GOV', category: 'Humanities' },
  { name: 'Literature in English', code: 'LIT', category: 'Language' },
  { name: 'Geography', code: 'GEO', category: 'Humanities' },
  { name: 'History', code: 'HIS', category: 'Humanities' },
  { name: 'Accounting', code: 'ACC', category: 'Humanities' },
  { name: 'Business Management', code: 'BUS', category: 'Humanities' },
  { name: 'French', code: 'FRE', category: 'Language' },
]

// ── Class Naming Themes ──────────────────────────────────────────────────────
export interface ClassNamingTheme {
  id: string
  label: string
  icon: string
  names: string[]
  preview?: string  // Short example for display
}

export const CLASS_NAMING_THEMES: ClassNamingTheme[] = [
  {
    id: 'none',
    label: 'No Theme (Standard)',
    icon: '📋',
    names: [],
    preview: 'SHS 1, SHS 2, JHS 1A…',
  },
  {
    id: 'flowers',
    label: 'Flowers',
    icon: '🌺',
    names: ['Rose', 'Lily', 'Daisy', 'Tulip', 'Sunflower', 'Orchid', 'Jasmine', 'Violet', 'Lotus', 'Hibiscus'],
    preview: 'JHS 1 Rose, JHS 1 Lily…',
  },
  {
    id: 'eagles',
    label: 'Birds & Eagles',
    icon: '🦅',
    names: ['Eagle', 'Falcon', 'Hawk', 'Robin', 'Dove', 'Phoenix', 'Sparrow', 'Kingfisher', 'Crane', 'Heron'],
    preview: 'Primary 5 Eagle, Primary 5 Falcon…',
  },
  {
    id: 'animals',
    label: 'Animals',
    icon: '🦁',
    names: ['Lion', 'Tiger', 'Elephant', 'Panther', 'Leopard', 'Cheetah', 'Bear', 'Wolf', 'Rhino', 'Jaguar'],
    preview: 'JHS 2 Lion, JHS 2 Tiger…',
  },
  {
    id: 'stars',
    label: 'Stars & Celestial',
    icon: '⭐',
    names: ['Star', 'Moon', 'Sun', 'Comet', 'Orion', 'Nebula', 'Galaxy', 'Nova', 'Sirius', 'Aurora'],
    preview: 'SHS 1 Star, SHS 1 Moon…',
  },
  {
    id: 'gems',
    label: 'Gemstones',
    icon: '💎',
    names: ['Diamond', 'Ruby', 'Emerald', 'Sapphire', 'Topaz', 'Amethyst', 'Pearl', 'Opal', 'Jade', 'Coral'],
    preview: 'Primary 4 Diamond, Primary 4 Ruby…',
  },
  {
    id: 'colors',
    label: 'Colors',
    icon: '🎨',
    names: ['Red', 'Blue', 'Green', 'Gold', 'Silver', 'Purple', 'Orange', 'Indigo', 'Crimson', 'Teal'],
    preview: 'JHS 3 Red, JHS 3 Blue…',
  },
  {
    id: 'alphabets',
    label: 'Letters (A, B, C)',
    icon: '🔤',
    names: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
    preview: 'JHS 1A, JHS 1B, JHS 1C…',
  },
  {
    id: 'custom',
    label: 'Custom Names',
    icon: '✏️',
    names: [],
    preview: 'You name each class yourself',
  },
]

// ── Default Class Structures per School Type ──────────────────────────────────
export interface ClassLevel {
  level: string
  baseNames: string[]   // base class names before theme is applied
  count: number         // default number of streams per year
}

export const DEFAULT_CLASS_STRUCTURES: Record<string, ClassLevel[]> = {
  basic: [
    { level: 'Kindergarten', baseNames: ['KG 1', 'KG 2'], count: 1 },
    { level: 'Lower Primary', baseNames: ['Primary 1', 'Primary 2', 'Primary 3'], count: 1 },
    { level: 'Upper Primary', baseNames: ['Primary 4', 'Primary 5', 'Primary 6'], count: 1 },
    { level: 'Junior High', baseNames: ['JHS 1', 'JHS 2', 'JHS 3'], count: 1 },
  ],
  shs: [
    { level: 'Senior High', baseNames: ['SHS 1', 'SHS 2', 'SHS 3'], count: 1 },
  ],
  remedial: [
    { level: 'Remedial', baseNames: ['Batch A', 'Batch B', 'Batch C'], count: 1 },
  ],
  mixed: [
    { level: 'Junior High', baseNames: ['JHS 1', 'JHS 2', 'JHS 3'], count: 1 },
    { level: 'Senior High', baseNames: ['SHS 1', 'SHS 2', 'SHS 3'], count: 1 },
  ],
}

// ── Default Departments per School Type ──────────────────────────────────────
export const DEFAULT_DEPARTMENTS: Record<string, string[]> = {
  basic: ['General Studies'],
  shs: ['General Arts', 'Science', 'Business', 'Visual Arts', 'Home Economics', 'Technical'],
  remedial: ['Sciences', 'Arts & Business', 'General'],
  mixed: ['General Studies', 'General Arts', 'Science', 'Business'],
}

// ── Helper: get all subjects for selected curriculums & SHS programmes ────────
export function getSubjectsForSetup(
  curriculums: string[],
  shsProgrammes: string[],
  selectedShsElectives: Record<string, string[]>, // programmeId -> selected elective codes
): SubjectDef[] {
  const subjectMap = new Map<string, SubjectDef>()

  if (curriculums.includes('ges_basic') || curriculums.includes('montessori')) {
    GES_BASIC_SUBJECTS.forEach(s => subjectMap.set(s.code, s))
  }

  if (curriculums.includes('wassce') || curriculums.includes('wassce_remedial')) {
    // Always add core subjects
    SHS_CORE_SUBJECTS.forEach(s => subjectMap.set(s.code, s))

    if (curriculums.includes('wassce')) {
      // Add selected electives per programme
      shsProgrammes.forEach(progId => {
        const prog = SHS_PROGRAMMES.find(p => p.id === progId)
        if (!prog) return
        const selectedCodes = selectedShsElectives[progId] ?? prog.electives.map(e => e.code) // default: all
        prog.electives
          .filter(e => selectedCodes.includes(e.code))
          .forEach(s => subjectMap.set(s.code, s))
      })
    }

    if (curriculums.includes('wassce_remedial')) {
      WASSCE_REMEDIAL_SUBJECTS.forEach(s => subjectMap.set(s.code, s))
    }
  }

  return Array.from(subjectMap.values())
}

// ── Helper: generate class names with theme ───────────────────────────────────
export function generateClassNames(
  baseName: string,
  streamCount: number,
  theme: ClassNamingTheme,
): string[] {
  if (theme.id === 'none' || theme.id === 'custom' || theme.names.length === 0) {
    if (streamCount === 1) return [baseName]
    return Array.from({ length: streamCount }, (_, i) => `${baseName} ${String.fromCharCode(65 + i)}`)
  }
  if (streamCount === 1) return [baseName]
  return theme.names.slice(0, streamCount).map(n => `${baseName} ${n}`)
}

// ── Helper: auto-generate slug from school name ───────────────────────────────
export function generateSlug(schoolName: string): string {
  return schoolName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '')
    .slice(0, 30)
}
