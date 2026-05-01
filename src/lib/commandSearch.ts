// src/lib/commandSearch.ts
export interface SearchResult {
  type: 'navigation' | 'student' | 'staff' | 'action'
  label: string
  subtitle: string
  icon: string
  path: string
  color: string
}

interface IntentRule {
  keywords: string[]
  label: string
  subtitle: string
  icon: string
  path: string
  color: string
  roles: ('admin' | 'teacher' | 'bursar' | 'student' | 'any')[]
}

export const ADMIN_INTENTS: IntentRule[] = [
  { keywords: ['pay fee', 'pay fees', 'fee payment', 'collect fee', 'record payment', 'tuition'], label: 'Collect Fee Payment', subtitle: 'Finance → Fee Payments', icon: '💳', path: '/bursar/fees', color: '#16a34a', roles: ['admin', 'bursar'] },
  { keywords: ['arrear', 'debt', 'outstanding', 'debtors', 'owe', 'unpaid'], label: 'View Debtors & Arrears', subtitle: 'Finance → Debtors', icon: '📊', path: '/bursar/debtors', color: '#b45309', roles: ['admin', 'bursar'] },
  { keywords: ['payroll', 'salary', 'staff pay', 'pay staff', 'wages'], label: 'Staff Payroll', subtitle: 'Finance → Payroll', icon: '💼', path: '/bursar/payroll', color: '#7c3aed', roles: ['admin', 'bursar'] },
  { keywords: ['income', 'revenue', 'earned', 'earnings'], label: 'Income Records', subtitle: 'Finance → Income', icon: '📈', path: '/bursar/income', color: '#0891b2', roles: ['admin', 'bursar'] },
  { keywords: ['expense', 'spending', 'cost', 'expenditure', 'spent'], label: 'Expense Records', subtitle: 'Finance → Expenses', icon: '📉', path: '/bursar/expenses', color: '#ef4444', roles: ['admin', 'bursar'] },
  { keywords: ['bill', 'billing', 'invoice', 'subscription'], label: 'Admin Billing', subtitle: 'Operations → Billing', icon: '🧾', path: '/admin/billing', color: '#6d28d9', roles: ['admin'] },

  { keywords: ['attendance today', 'today attendance', 'who present', 'who absent', 'mark attendance', 'absent today', 'present today'], label: "Today's Attendance", subtitle: 'Academics → Attendance', icon: '✅', path: '/admin/attendance', color: '#16a34a', roles: ['admin', 'teacher'] },
  { keywords: ['attendance', 'present', 'absent'], label: 'Attendance Records', subtitle: 'Academics → Attendance', icon: '📋', path: '/admin/attendance', color: '#16a34a', roles: ['admin'] },

  { keywords: ['report card', 'report', 'generate report', 'term report'], label: 'Report Cards', subtitle: 'Academics → Report Cards', icon: '📄', path: '/admin/reports', color: '#1a56db', roles: ['admin', 'teacher'] },
  { keywords: ['score', 'grades', 'marks', 'enter score', 'enter marks', 'score entry', 'grade entry', 'results'], label: 'Score Entry', subtitle: 'Academics → Score Entry', icon: '✏️', path: '/admin/score-entry', color: '#0891b2', roles: ['admin', 'teacher'] },
  { keywords: ['analytics', 'performance', 'stats', 'statistics', 'overview', 'insights'], label: 'School Analytics', subtitle: 'Insights → Analytics', icon: '📊', path: '/admin/analytics', color: '#6d28d9', roles: ['admin'] },
  { keywords: ['top student', 'top performer', 'best student', 'rank', 'ranked', 'ranking', 'leaderboard'], label: 'Analytics & Rankings', subtitle: 'Insights → Analytics', icon: '🏆', path: '/admin/analytics', color: '#f59e0b', roles: ['admin'] },

  { keywords: ['busy teacher', 'busy staff', 'most active teacher', 'teacher workload', 'teacher load'], label: 'Teacher Workload Analytics', subtitle: 'Insights → Analytics', icon: '📊', path: '/admin/analytics', color: '#6d28d9', roles: ['admin'] },
  { keywords: ['failing student', 'low performer', 'poor grade', 'low score', 'weak student'], label: 'Low Performers Report', subtitle: 'Insights → Analytics', icon: '⚠️', path: '/admin/analytics', color: '#ef4444', roles: ['admin'] },
  { keywords: ['class', 'classes', 'grade 1', 'grade 2', 'grade 3', 'grade 4', 'grade 5', 'grade 6', 'grade 7', 'grade 8', 'grade 9', 'form 1', 'form 2', 'form 3', 'jhs', 'shs'], label: 'View Classes', subtitle: 'Academics → Classes', icon: '🏫', path: '/admin/classes', color: '#0891b2', roles: ['admin'] },
  { keywords: ['timetable', 'schedule', 'period', 'lesson time'], label: 'Class Timetable', subtitle: 'Academics → Timetable', icon: '🕐', path: '/admin/timetable', color: '#6d28d9', roles: ['admin', 'teacher'] },
  { keywords: ['subject', 'subjects', 'course', 'curriculum'], label: 'Subjects', subtitle: 'Academics → Subjects', icon: '📚', path: '/admin/subjects', color: '#7c3aed', roles: ['admin'] },
  { keywords: ['syllabus', 'lesson plan', 'scheme of work', 'scheme'], label: 'Syllabus & Plans', subtitle: 'Academics → Syllabus', icon: '📝', path: '/admin/syllabus', color: '#0891b2', roles: ['admin', 'teacher'] },
  { keywords: ['assignment', 'homework', 'quiz'], label: 'Assignments', subtitle: 'Instruction → Assignments', icon: '📎', path: '/teacher/assignments', color: '#7c3aed', roles: ['teacher'] },

  { keywords: ['student', 'students', 'pupil', 'learner', 'enroll', 'add student', 'new student'], label: 'Students Directory', subtitle: 'People → Students', icon: '👨‍🎓', path: '/admin/students', color: '#1a56db', roles: ['admin'] },
  { keywords: ['teacher', 'staff', 'teachers', 'lecturer', 'instructor', 'staff list', 'employees'], label: 'Staff Directory', subtitle: 'People → Staff', icon: '👩‍🏫', path: '/admin/teachers', color: '#7c3aed', roles: ['admin'] },
  { keywords: ['admissions', 'applicant', 'application', 'enrolment form'], label: 'Admissions', subtitle: 'People → Admissions', icon: '📥', path: '/admin/admissions', color: '#16a34a', roles: ['admin'] },
  { keywords: ['alumni', 'graduate', 'former student', 'old student'], label: 'Alumni Records', subtitle: 'People → Alumni', icon: '🎓', path: '/admin/alumni', color: '#6b7280', roles: ['admin'] },
  { keywords: ['sms', 'send message', 'send sms', 'text message', 'broadcast', 'notify'], label: 'SMS Messaging', subtitle: 'People → SMS Messaging', icon: '📱', path: '/admin/sms', color: '#16a34a', roles: ['admin'] },

  { keywords: ['settings', 'configure', 'school info', 'edit school', 'logo', 'fees structure'], label: 'School Settings', subtitle: 'Insights → Settings', icon: '⚙️', path: '/admin/settings', color: '#374151', roles: ['admin'] },
  { keywords: ['calendar', 'event', 'events', 'holiday'], label: 'School Calendar', subtitle: 'Operations → Calendar', icon: '📅', path: '/admin/calendar', color: '#1a56db', roles: ['admin'] },
  { keywords: ['message', 'inbox', 'chat', 'conversation'], label: 'Messages', subtitle: 'Operations → Messages', icon: '💬', path: '/admin/messages', color: '#6d28d9', roles: ['admin'] },
  { keywords: ['task', 'tasks', 'to-do', 'todo', 'checklist'], label: 'Admin Tasks', subtitle: 'Operations → Tasks', icon: '✓', path: '/admin/tasks', color: '#0891b2', roles: ['admin'] },
  { keywords: ['asset', 'assets', 'inventory', 'equipment', 'furniture'], label: 'Asset Register', subtitle: 'Operations → Assets', icon: '🗄️', path: '/admin/assets', color: '#374151', roles: ['admin'] },
  { keywords: ['visitor', 'visit', 'guest', 'reception'], label: 'Visitor Log', subtitle: 'Operations → Visitors', icon: '🚪', path: '/admin/visitors', color: '#6b7280', roles: ['admin'] },
  { keywords: ['election', 'pec', 'vote', 'voting', 'prefect'], label: 'Elections (PEC)', subtitle: 'Operations → Elections', icon: '🗳️', path: '/admin/elections', color: '#ef4444', roles: ['admin'] },
  { keywords: ['promote', 'promotion', 'batch promotion', 'move up', 'next class', 'advance'], label: 'Batch Promotion', subtitle: 'Academics → Batch Promotion', icon: '⬆️', path: '/admin/batch-promotion', color: '#16a34a', roles: ['admin'] },

  { keywords: ['my class', 'my students', 'my pupils', 'class list'], label: 'My Classes', subtitle: 'Instruction → My Classes', icon: '🏫', path: '/teacher/my-classes', color: '#1a56db', roles: ['teacher'] },
  { keywords: ['lesson', 'lesson tracker', 'lesson log'], label: 'Lesson Tracker', subtitle: 'More → Lesson Tracker', icon: '📓', path: '/teacher/lesson-tracker', color: '#0891b2', roles: ['teacher'] },
  { keywords: ['behaviour', 'behavior', 'discipline', 'conduct'], label: 'Behavior Log', subtitle: 'More → Behavior Log', icon: '⚠️', path: '/teacher/behavior', color: '#f59e0b', roles: ['teacher'] },

  { keywords: ['my result', 'my grade', 'my score', 'my marks', 'result check'], label: 'My Results', subtitle: 'Student Portal → Results', icon: '📊', path: '/student/results', color: '#1a56db', roles: ['student'] },
  { keywords: ['my fee', 'my bill', 'pay school fee', 'balance', 'how much', 'outstanding'], label: 'My Fees & Billing', subtitle: 'Student Portal → Fees', icon: '💳', path: '/student/billing', color: '#16a34a', roles: ['student'] },
  { keywords: ['library', 'book', 'resource', 'read'], label: 'School Library', subtitle: 'Student Portal → Library', icon: '📚', path: '/student/library', color: '#7c3aed', roles: ['student'] },
]

// ── Main Intent Resolver ──────────────────────────────────────────────────────
export function resolveIntents(
  query: string,
  role: { isAdmin: boolean, isTeacher: boolean, isBursar: boolean, isStudent: boolean }
): SearchResult[] {
  const q = query.toLowerCase().trim()
  if (q.length < 2) return []

  const userRoles: string[] = []
  if (role.isAdmin) userRoles.push('admin')
  if (role.isTeacher) userRoles.push('teacher')
  if (role.isBursar) userRoles.push('bursar')
  if (role.isStudent) userRoles.push('student')

  const results: SearchResult[] = []
  const seen = new Set<string>()

  for (const intent of ADMIN_INTENTS) {
    const roleMatch = intent.roles.includes('any') || intent.roles.some(r => userRoles.includes(r))
    if (!roleMatch) continue
    const matches = intent.keywords.some(kw => q.includes(kw) || kw.includes(q))
    if (!matches) continue
    if (seen.has(intent.path)) continue
    seen.add(intent.path)
    results.push({ type: 'navigation', label: intent.label, subtitle: intent.subtitle, icon: intent.icon, path: intent.path, color: intent.color })
    if (results.length >= 4) break
  }
  return results
}

// ── Name Prefix Stripper ──────────────────────────────────────────────────────
// Removes titles like "sir", "mr", "mrs", "ms", "dr", "prof" from the start
function stripTitle(name: string): string {
  return name.replace(/^(sir|mr\.?|mrs\.?|ms\.?|dr\.?|prof\.?|master)\s+/i, '').trim()
}

// ── Person-Context Intent Extractor ──────────────────────────────────────────
// Returns { name, intent } when the query is "[name]'s [intent]" or "[intent] [name]"
// intent values: 'results' | 'attendance' | 'report' | 'fees' | 'timetable' | 'profile' | 'scores' | 'classes'

const PERSON_INTENT_PATTERNS: { regex: RegExp, intent: string, nameGroup: number }[] = [
  // "[name]'s results/grades/scores/marks"
  { regex: /^(.+?)(?:'s)?\s+results?$/i,            intent: 'results',    nameGroup: 1 },
  { regex: /^(.+?)(?:'s)?\s+grades?$/i,             intent: 'results',    nameGroup: 1 },
  { regex: /^(.+?)(?:'s)?\s+scores?$/i,             intent: 'results',    nameGroup: 1 },
  { regex: /^(.+?)(?:'s)?\s+marks?$/i,              intent: 'results',    nameGroup: 1 },
  { regex: /^check\s+(.+?)\s+results?$/i,           intent: 'results',    nameGroup: 1 },
  { regex: /^show\s+(.+?)\s+results?$/i,            intent: 'results',    nameGroup: 1 },

  // "[name]'s attendance / attendance for [name]"
  { regex: /^(.+?)(?:'s)?\s+attendance$/i,          intent: 'attendance', nameGroup: 1 },
  { regex: /^attendance\s+(?:for\s+)?(.+)$/i,       intent: 'attendance', nameGroup: 1 },

  // "[name]'s report / report for [name]"
  { regex: /^(.+?)(?:'s)?\s+reports?$/i,            intent: 'report',     nameGroup: 1 },
  { regex: /^report\s+(?:for\s+)?(.+)$/i,           intent: 'report',     nameGroup: 1 },

  // "[name]'s fees / pay [name] fees" (student)
  { regex: /^pay\s+(.+?)(?:'s)?\s+fees?$/i,         intent: 'fees',       nameGroup: 1 },
  { regex: /^(.+?)(?:'s)?\s+fees?$/i,               intent: 'fees',       nameGroup: 1 },
  { regex: /^collect\s+(.+?)\s+fees?$/i,            intent: 'fees',       nameGroup: 1 },
  { regex: /^record\s+(?:payment|fee)\s+(?:for\s+)?(.+)$/i, intent: 'fees', nameGroup: 1 },
  { regex: /^(.+?)\s+pay\s+fees?$/i,                intent: 'fees',       nameGroup: 1 },

  // "[name]'s timetable / timetable for sir [name]"
  { regex: /^(.+?)(?:'s)?\s+timetable$/i,           intent: 'timetable',  nameGroup: 1 },
  { regex: /^(.+?)(?:'s)?\s+schedule$/i,            intent: 'timetable',  nameGroup: 1 },
  { regex: /^timetable\s+(?:for\s+)?(.+)$/i,        intent: 'timetable',  nameGroup: 1 },

  // "[name]'s classes / classes for [name]"
  { regex: /^(.+?)(?:'s)?\s+classes?$/i,            intent: 'classes',    nameGroup: 1 },
  { regex: /^classes?\s+(?:for\s+)?(.+)$/i,         intent: 'classes',    nameGroup: 1 },

  // "[name]'s profile"
  { regex: /^(.+?)(?:'s)?\s+profile$/i,             intent: 'profile',    nameGroup: 1 },
  { regex: /^find\s+(.+)$/i,                        intent: 'profile',    nameGroup: 1 },
  { regex: /^search\s+(.+)$/i,                      intent: 'profile',    nameGroup: 1 },

  // "[name]'s assignments"
  { regex: /^(.+?)(?:'s)?\s+assignments?$/i,        intent: 'assignments', nameGroup: 1 },
]

export interface PersonIntent {
  name: string
  rawName: string  // with title stripped
  intent: string
}

export function extractPersonIntent(query: string): PersonIntent | null {
  for (const { regex, intent, nameGroup } of PERSON_INTENT_PATTERNS) {
    const m = query.match(regex)
    if (m && m[nameGroup] && m[nameGroup].trim().length >= 2) {
      const raw = m[nameGroup].trim()
      return { name: raw, rawName: stripTitle(raw), intent }
    }
  }
  return null
}

// ── Legacy pay-student extractor (kept for compatibility) ─────────────────────
export function extractPayStudentIntent(query: string): string | null {
  const pi = extractPersonIntent(query)
  if (pi && pi.intent === 'fees') return pi.rawName
  return null
}

// ── Map intent → route path ───────────────────────────────────────────────────
export function intentToPath(
  intent: string,
  personType: 'student' | 'teacher' | 'unknown',
  isAdmin: boolean,
  isBursar: boolean,
  isTeacher: boolean
): { path: string, icon: string, color: string, verb: string } {
  const isStaff = personType === 'teacher'

  switch (intent) {
    case 'results':
      return { path: '/admin/score-entry', icon: '📊', color: '#1a56db', verb: "View Results" }
    case 'attendance':
      return { path: '/admin/attendance', icon: '✅', color: '#16a34a', verb: "View Attendance" }
    case 'report':
      return { path: '/admin/reports', icon: '📄', color: '#7c3aed', verb: "View Report" }
    case 'fees':
      return { path: isBursar ? '/bursar/fees' : '/bursar/fees', icon: '💳', color: '#16a34a', verb: "Pay Fees" }
    case 'timetable':
      return { path: '/admin/timetable', icon: '🕐', color: '#6d28d9', verb: "View Timetable" }
    case 'classes':
      return isStaff
        ? { path: '/admin/teachers', icon: '🏫', color: '#0891b2', verb: "View Classes" }
        : { path: '/admin/classes', icon: '🏫', color: '#0891b2', verb: "View Class" }
    case 'profile':
      return isStaff
        ? { path: '/admin/teachers', icon: '👤', color: '#7c3aed', verb: "View Profile" }
        : { path: '/admin/students', icon: '👤', color: '#1a56db', verb: "View Profile" }
    case 'assignments':
      return { path: '/teacher/assignments', icon: '📎', color: '#7c3aed', verb: "View Assignments" }
    default:
      return { path: '/admin/students', icon: '🔍', color: '#6b7280', verb: "Find" }
  }
}

// ── Class Hint ────────────────────────────────────────────────────────────────
export function extractClassHint(query: string): string | null {
  const patterns = [/grade\s*\d+/i, /year\s*\d+/i, /form\s*\d+/i, /class\s*\d+/i, /jhs\s*\d+/i, /shs\s*\d+/i, /js\d+/i]
  for (const p of patterns) {
    const m = query.match(p)
    if (m) return m[0].trim()
  }
  return null
}
