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

// Over 50+ intent phrases mapped to actions
export const GLOBAL_INTENTS: IntentRule[] = [
  // ── Finance & Billing ──
  { keywords: ['pay fee', 'pay fees', 'fee payment', 'collect fee', 'record payment', 'tuition', 'make payment', 'school fees', 'receive payment', 'payment receipt', 'bursar office', 'finance', 'money', 'cashier', 'student paid', 'billing money', 'revenue collect', 'help me pay fees', 'take money', 'record a receipt'], label: 'Collect Fee Payment', subtitle: 'Finance → Fee Payments', icon: '💳', path: '/bursar/fees', color: '#16a34a', roles: ['admin', 'bursar'] },
  { keywords: ['arrear', 'debt', 'outstanding', 'debtors', 'owe', 'unpaid', 'who owes', 'balance', 'defaulters', 'owing list', 'credit', 'non-payment', 'fee balance', 'unpaid fees', 'money owed', 'list of debtors', 'who has not paid'], label: 'View Debtors & Arrears', subtitle: 'Finance → Debtors', icon: '📊', path: '/bursar/debtors', color: '#b45309', roles: ['admin', 'bursar'] },
  { keywords: ['payroll', 'salary', 'staff pay', 'pay staff', 'wages', 'staff salary', 'teacher pay', 'pay workers', 'remuneration', 'payslip', 'earnings', 'monthly salary', 'payroll list', 'staff money', 'give salaries'], label: 'Staff Payroll', subtitle: 'Finance → Payroll', icon: '💼', path: '/bursar/payroll', color: '#7c3aed', roles: ['admin', 'bursar'] },
  { keywords: ['income', 'revenue', 'earned', 'earnings', 'money in', 'total income', 'cash inflow', 'profit', 'financial summary', 'total revenue', 'balance sheet', 'how much did we make', 'total money'], label: 'Income Records', subtitle: 'Finance → Income', icon: '📈', path: '/bursar/income', color: '#0891b2', roles: ['admin', 'bursar'] },
  { keywords: ['expense', 'spending', 'cost', 'expenditure', 'spent', 'money out', 'purchases', 'receipts', 'cash outflow', 'bills to pay', 'school costs', 'expenditure list', 'what did we spend', 'total expenses', 'buy items'], label: 'Expense Records', subtitle: 'Finance → Expenses', icon: '📉', path: '/bursar/expenses', color: '#ef4444', roles: ['admin', 'bursar'] },
  { keywords: ['bill', 'billing', 'invoice', 'subscription', 'generate bill', 'print bill', 'student bill', 'fee structure', 'charge student', 'billing system', 'create invoice', 'bill the students', 'new fees', 'term bill', 'school bill'], label: 'Admin Billing', subtitle: 'Operations → Billing', icon: '🧾', path: '/admin/billing', color: '#6d28d9', roles: ['admin'] },
  
  // ── Academics ──
  { keywords: ['attendance today', 'today attendance', 'who present', 'who absent', 'mark attendance', 'absent today', 'present today', 'take register', 'roll call', 'daily register', 'attendance sheet', 'mark the register', 'is everyone here', 'check attendance'], label: "Today's Attendance", subtitle: 'Academics → Attendance', icon: '✅', path: '/admin/attendance', color: '#16a34a', roles: ['admin', 'teacher'] },
  { keywords: ['score', 'grades', 'marks', 'enter score', 'enter marks', 'score entry', 'grade entry', 'results', 'record marks', 'input grades', 'exam scores', 'test scores', 'ca scores', 'put in marks', 'upload results'], label: 'Score Entry', subtitle: 'Academics → Score Entry', icon: '✏️', path: '/admin/score-entry', color: '#0891b2', roles: ['admin', 'teacher'] },
  { keywords: ['analytics', 'performance', 'stats', 'statistics', 'overview', 'insights', 'school performance', 'academic analytics', 'data', 'charts', 'graphs', 'school status', 'how is the school doing'], label: 'School Analytics', subtitle: 'Insights → Analytics', icon: '📊', path: '/admin/analytics', color: '#6d28d9', roles: ['admin'] },
  { keywords: ['student', 'students', 'pupil', 'learner', 'enroll', 'add student', 'new student', 'register student', 'admit student', 'student list', 'student directory', 'find student', 'kids', 'children', 'add new kid', 'register a child'], label: 'Students Directory', subtitle: 'People → Students', icon: '👨‍🎓', path: '/admin/students', color: '#1a56db', roles: ['admin'] },
  { keywords: ['teacher', 'staff', 'teachers', 'lecturer', 'instructor', 'staff list', 'employees', 'add teacher', 'hire staff', 'new teacher', 'faculty', 'hire someone', 'find me a teacher'], label: 'Staff Directory', subtitle: 'People → Staff', icon: '👩‍🏫', path: '/admin/teachers', color: '#7c3aed', roles: ['admin'] },

  { keywords: ['admissions', 'applicant', 'application', 'enrolment form', 'new admission', 'register', 'intake', 'waiting list', 'admission list'], label: 'Admissions', subtitle: 'People → Admissions', icon: '📥', path: '/admin/admissions', color: '#16a34a', roles: ['admin'] },
  { keywords: ['alumni', 'graduate', 'former student', 'old student', 'past student', 'school leaver', 'graduated', 'old pupils'], label: 'Alumni Records', subtitle: 'People → Alumni', icon: '🎓', path: '/admin/alumni', color: '#6b7280', roles: ['admin'] },
  { keywords: ['sms', 'send message', 'send sms', 'text message', 'broadcast', 'notify', 'message parents', 'contact parents', 'announcement text', 'bulk sms', 'send a blast', 'text all parents'], label: 'SMS Messaging', subtitle: 'People → SMS Messaging', icon: '📱', path: '/admin/sms', color: '#16a34a', roles: ['admin', 'bursar'] },
  { keywords: ['parent', 'parents', 'guardian', 'parent login', 'parent access', 'family', 'mothers', 'fathers', 'relatives', 'parent portal'], label: 'Parent Logins', subtitle: 'People → Parents', icon: '👨‍👩‍👧', path: '/admin/parents', color: '#6d28d9', roles: ['admin'] },
  { keywords: ['leave', 'staff leave', 'vacation', 'time off', 'absent staff', 'substitute', 'substitute teacher', 'sick leave', 'permission', 'away', 'staffs requesting for leave', 'leave requests', 'leave applications', 'pending leave', 'who is requesting leave', 'asking for permission', 'absent workers', 'teacher absence'], label: 'Staff Leave', subtitle: 'Operations → Staff Leave', icon: '✈️', path: '/admin/staff-leave', color: '#0891b2', roles: ['admin'] },
  { keywords: ['my leave', 'request leave', 'apply for leave', 'sick leave', 'excuse', 'i want leave', 'requesting for leave', 'permission to go', 'need time off'], label: 'My Leave', subtitle: 'More → My Leave', icon: '✈️', path: '/teacher/leave', color: '#0891b2', roles: ['teacher'] },
  { keywords: ['busy teacher', 'busy staff', 'most active teacher', 'teacher workload', 'teacher load', 'teaching hours', 'staff metrics', 'who is teaching'], label: 'Teacher Workload Analytics', subtitle: 'Insights → Analytics', icon: '📊', path: '/admin/analytics', color: '#6d28d9', roles: ['admin'] },

  // ── Operations & Admin ──
  { keywords: ['settings', 'configure', 'school info', 'edit school', 'logo', 'fees structure', 'academic year', 'term', 'semester', 'preferences', 'setup', 'school profile', 'update school'], label: 'School Settings', subtitle: 'Insights → Settings', icon: '⚙️', path: '/admin/settings', color: '#374151', roles: ['admin'] },
  { keywords: ['calendar', 'event', 'events', 'holiday', 'vacation date', 'reopening date', 'school dates', 'holidays', 'occasions', 'dates', 'when do we reopen', 'break dates', 'term dates', 'calendar setup'], label: 'School Calendar', subtitle: 'Operations → Calendar', icon: '📅', path: '/admin/calendar', color: '#1a56db', roles: ['admin'] },
  { keywords: ['message', 'inbox', 'chat', 'conversation', 'messages', 'direct message', 'mail', 'internal mail', 'inbox', 'who messaged me', 'unread messages'], label: 'Internal Messages', subtitle: 'Operations → Messages', icon: '💬', path: '/admin/messages', color: '#6d28d9', roles: ['admin', 'teacher'] },
  { keywords: ['task', 'tasks', 'to-do', 'todo', 'checklist', 'admin tasks', 'todo list', 'assign task', 'jobs', 'my tasks', 'what should i do', 'work list'], label: 'Admin Tasks', subtitle: 'Operations → Tasks', icon: '✓', path: '/admin/tasks', color: '#0891b2', roles: ['admin'] },
  { keywords: ['asset', 'assets', 'inventory', 'equipment', 'furniture', 'school property', 'stock', 'items', 'store', 'stationery', 'supplies', 'manage stock', 'what is in store', 'broken items'], label: 'Inventory & Assets', subtitle: 'Operations → Assets', icon: '🗄️', path: '/admin/assets', color: '#374151', roles: ['admin', 'bursar'] },
  { keywords: ['visitor', 'visit', 'guest', 'reception', 'visitor log', 'sign in guest', 'stranger', 'log book', 'who visited', 'who is at the gate', 'visitor record', 'new visitor', 'check in guest'], label: 'Visitor Management', subtitle: 'Operations → Visitors', icon: '🚪', path: '/security/visitors', color: '#6b7280', roles: ['admin', 'security'] },
  { keywords: ['gate', 'security', 'gate log', 'entry', 'exit', 'student gate', 'gate control', 'who came in', 'who went out', 'patrol', 'guard'], label: 'Gate Control Dashboard', subtitle: 'Security → Dashboard', icon: '🛡️', path: '/security/dashboard', color: '#1e293b', roles: ['admin', 'security'] },
  { keywords: ['incident', 'security alert', 'theft', 'break in', 'emergency', 'security report', 'incident log'], label: 'Security Incidents', subtitle: 'Security → Incidents', icon: '⚠️', path: '/security/incidents', color: '#dc2626', roles: ['admin', 'security'] },
  { keywords: ['election', 'pec', 'vote', 'voting', 'prefect', 'school prefect', 'src election', 'candidates', 'polls', 'ballot', 'elect prefects', 'who is winning', 'vote count'], label: 'Elections (PEC)', subtitle: 'Operations → Elections', icon: '🗳️', path: '/admin/elections', color: '#ef4444', roles: ['admin', 'teacher', 'student'] },
  { keywords: ['poster', 'poster maker', 'design', 'flyer', 'create poster', 'graphics', 'social media', 'images', 'marketing', 'adverts', 'make a design'], label: 'Poster Maker', subtitle: 'Operations → Poster Maker', icon: '🎨', path: '/admin/poster-maker', color: '#7c3aed', roles: ['admin'] },
  { keywords: ['behaviour', 'behavior', 'discipline', 'conduct', 'punishment', 'offense', 'good behavior', 'bad behavior', 'demerit', 'misconduct', 'discipline list', 'bad kids', 'who was punished'], label: 'Behavior Log', subtitle: 'More → Behavior Log', icon: '⚠️', path: '/teacher/behavior', color: '#f59e0b', roles: ['teacher'] },
]

// ── Student Specific ──
const STUDENT_PORTAL_INTENTS: IntentRule[] = [
  { keywords: ['my result', 'my grade', 'my score', 'my marks', 'result check', 'how did i do', 'exam results', 'terminal results', 'did i pass', 'show my marks', 'results for this term', 'check my scores'], label: 'My Results', subtitle: 'Student Portal → Results', icon: '📊', path: '/student/results', color: '#1a56db', roles: ['student'] },
  { keywords: ['my fee', 'my bill', 'pay school fee', 'balance', 'how much', 'outstanding', 'my debt', 'fee statement', 'financial status', 'how much do i owe', 'my school fees', 'am i owing'], label: 'My Fees & Billing', subtitle: 'Student Portal → Fees', icon: '💳', path: '/student/billing', color: '#16a34a', roles: ['student'] },
  { keywords: ['library', 'book', 'resource', 'read', 'study materials', 'past questions', 'notes', 'handouts', 'learning materials', 'e-books', 'library books', 'digital library', 'find a book'], label: 'School Library', subtitle: 'Student Portal → Library', icon: '📚', path: '/student/library', color: '#7c3aed', roles: ['student'] },
  { keywords: ['typing', 'typing nitro', 'typing game', 'keyboard skills', 'learn to type', 'fast typing', 'practice typing', 'type faster', 'typing competition', 'keyboard master', 'typing speed'], label: 'Typing Nitro', subtitle: 'Explore → Typing Nitro', icon: '⌨️', path: '/student/typing-game', color: '#f59e0b', roles: ['student', 'teacher'] },
]

GLOBAL_INTENTS.push(...STUDENT_PORTAL_INTENTS)

// ── Additional Advanced Intents ──────────────────────────────────────────────
const ADVANCED_INTENTS: IntentRule[] = [
  { keywords: ['backup', 'export data', 'download database', 'save records', 'cloud backup', 'security'], label: 'Data Backup', subtitle: 'Settings → Maintenance', icon: '💾', path: '/admin/settings/backup', color: '#374151', roles: ['admin'] },
  { keywords: ['change password', 'update password', 'security settings', 'lock account', 'privacy'], label: 'Account Security', subtitle: 'Settings → Security', icon: '🔒', path: '/admin/settings/security', color: '#ef4444', roles: ['any'] },
  { keywords: ['top debtor', 'biggest debtor', 'who owes most', 'high debt', 'debt ranking'], label: 'Top Debtors Analysis', subtitle: 'Finance → Insights', icon: '📉', path: '/bursar/debtors', color: '#b45309', roles: ['admin', 'bursar'] },
  { keywords: ['scholarship', 'financial aid', 'discount', 'fee reduction', 'free education', 'bursary'], label: 'Scholarships & Aid', subtitle: 'Finance → Discounts', icon: '🎗️', path: '/bursar/scholarships', color: '#16a34a', roles: ['admin', 'bursar'] },
  { keywords: ['subject setup', 'add subject', 'new course', 'manage curriculum', 'create subject'], label: 'Subject Management', subtitle: 'Academics → Setup', icon: '📚', path: '/admin/subjects', color: '#7c3aed', roles: ['admin'] },
  { keywords: ['assign teacher', 'class teacher', 'form teacher', 'teacher assignment', 'who teaches'], label: 'Class Assignments', subtitle: 'People → Staff Assignment', icon: '🤝', path: '/admin/teachers', color: '#0891b2', roles: ['admin'] },
]

GLOBAL_INTENTS.push(...ADVANCED_INTENTS)

// ── Main Intent Resolver ──────────────────────────────────────────────────────
export function resolveIntents(
  query: string,
  role: { isAdmin: boolean, isTeacher: boolean, isBursar: boolean, isStudent: boolean, isSecurity: boolean }
): SearchResult[] {
  const q = query.toLowerCase().trim()
  if (q.length < 2) return []

  const userRoles: string[] = []
  if (role.isAdmin) userRoles.push('admin')
  if (role.isTeacher) userRoles.push('teacher')
  if (role.isBursar) userRoles.push('bursar')
  if (role.isStudent) userRoles.push('student')
  if (role.isSecurity) userRoles.push('security')

  const results: SearchResult[] = []
  const seen = new Set<string>()

  for (const intent of GLOBAL_INTENTS) {
    const roleMatch = intent.roles.includes('any') || intent.roles.some(r => userRoles.includes(r as any))
    if (!roleMatch) continue
    
    // Fuzzy matching: "report cards" matches "report card"
    const matches = intent.keywords.some(kw => q.includes(kw) || kw.includes(q))
    if (!matches) continue
    if (seen.has(intent.path)) continue
    seen.add(intent.path)
    
    results.push({ 
      type: 'navigation', 
      label: intent.label, 
      subtitle: intent.subtitle, 
      icon: intent.icon, 
      path: intent.path, 
      color: intent.color 
    })
    
    if (results.length >= 5) break
  }
  return results
}

// ── Name Prefix Stripper ──────────────────────────────────────────────────────
function stripTitle(name: string): string {
  return name.replace(/^(sir|mr\.?|mrs\.?|ms\.?|dr\.?|prof\.?|master|miss)\s+/i, '').trim()
}

// ── Person & Context Intent Extractor ─────────────────────────────────────────
// Extracts natural language phrases targeting specific users or classes
// e.g. "message John", "invoice for Peter", "timetable for Grade 3"

const PERSON_INTENT_PATTERNS: { regex: RegExp, intent: string, nameGroup: number }[] = [
  // Results & Scores
  { regex: /^(.+?)(?:'s)?\s+(?:results?|grades?|scores?|marks?)$/i, intent: 'results', nameGroup: 1 },
  { regex: /^(?:check|show|view|see)\s+(?:the\s+)?(?:results?|grades?|scores?|marks?)\s+(?:of|for\s+)?(.+)$/i, intent: 'results', nameGroup: 1 },
  { regex: /^how\s+(?:did|is)\s+(.+?)\s+(?:doing|performing)$/i, intent: 'results', nameGroup: 1 },
  
  // Attendance
  { regex: /^(.+?)(?:'s)?\s+attendance$/i, intent: 'attendance', nameGroup: 1 },
  { regex: /^(?:check|mark|view)?\s*attendance\s+(?:for\s+)?(.+)$/i, intent: 'attendance', nameGroup: 1 },
  { regex: /^(?:is|did)\s+(.+?)\s+(?:absent|present|come to school|in school)(?:\s+today)?$/i, intent: 'attendance', nameGroup: 1 },

  // Report Cards
  { regex: /^(.+?)(?:'s)?\s+reports?$/i, intent: 'report', nameGroup: 1 },
  { regex: /^(?:generate|print|view|get)?\s*(?:the\s+)?report\s+(?:card\s+)?(?:for\s+)?(.+)$/i, intent: 'report', nameGroup: 1 },

  // Fees, Bills, and Invoices
  { regex: /^(?:pay|collect)\s+(?:for\s+)?(.+?)(?:'s)?\s+fees?$/i, intent: 'fees', nameGroup: 1 },
  { regex: /^(.+?)(?:'s)?\s+fees?$/i, intent: 'fees', nameGroup: 1 },
  { regex: /^record\s+(?:payment|fee)\s+(?:for\s+)?(.+)$/i, intent: 'fees', nameGroup: 1 },
  { regex: /^how\s+much\s+(?:does|is)\s+(.+?)\s+(?:owe|balance|arrears)$/i, intent: 'arrears', nameGroup: 1 },
  { regex: /^(.+?)\s+(?:pay\s+fees?|bill|invoice)$/i, intent: 'invoice', nameGroup: 1 },
  { regex: /^(?:generate|print|view|get)?\s*(?:the\s+)?(?:bill|invoice)\s+(?:for\s+)?(.+)$/i, intent: 'invoice', nameGroup: 1 },
  { regex: /^(.+?)(?:'s)?\s+(?:arrears|balance|debt)$/i, intent: 'arrears', nameGroup: 1 },
  { regex: /^did\s+(.+?)\s+(?:pay|finish paying)(?:\s+their\s+)?fees?$/i, intent: 'fees', nameGroup: 1 },

  // Timetables & Schedules
  { regex: /^(.+?)(?:'s)?\s+(?:timetable|schedule)$/i, intent: 'timetable', nameGroup: 1 },
  { regex: /^(?:view|check|show|what is)\s+(?:the\s+)?(?:timetable|schedule)\s+(?:for\s+)?(.+)$/i, intent: 'timetable', nameGroup: 1 },
  { regex: /^when\s+(?:is|does)\s+(.+?)(?:'s)?\s+(?:next\s+)?class(?:\s+start)?$/i, intent: 'timetable', nameGroup: 1 },

  // Messaging & Communications
  { regex: /^(?:message|sms|text|contact|chat|send\s+message\s+to)\s+(.+)$/i, intent: 'message', nameGroup: 1 },
  { regex: /^send\s+(?:an\s+)?sms\s+to\s+(.+)$/i, intent: 'message', nameGroup: 1 },

  // Classes & Enrollments
  { regex: /^(.+?)(?:'s)?\s+classes?$/i, intent: 'classes', nameGroup: 1 },
  { regex: /^(?:view|check|show)\s+(?:the\s+)?classes?\s+(?:of|for\s+)?(.+)$/i, intent: 'classes', nameGroup: 1 },
  { regex: /^who\s+(?:is\s+in|are\s+the\s+students\s+in)\s+(.+)$/i, intent: 'classes', nameGroup: 1 },

  // Profiles & People
  { regex: /^(.+?)(?:'s)?\s+(?:profile|details|info|record)$/i, intent: 'profile', nameGroup: 1 },
  { regex: /^(?:find|search|lookup|who is)\s+(.+)$/i, intent: 'profile', nameGroup: 1 },
  { regex: /^is\s+(.+?)\s+(?:a\s+)?(?:teacher|staff|student|worker)$/i, intent: 'profile', nameGroup: 1 },
  
  // Parents
  { regex: /^(.+?)(?:'s)?\s+(?:parents?|guardians?|family)$/i, intent: 'parents', nameGroup: 1 },
  { regex: /^(?:find|contact|call)?\s*(?:the\s+)?(?:parents?|guardians?)\s+(?:for|of\s+)?(.+)$/i, intent: 'parents', nameGroup: 1 },
  { regex: /^who\s+are\s+(.+?)(?:'s)?\s+(?:parents|guardians)$/i, intent: 'parents', nameGroup: 1 },

  // Staff specific
  { regex: /^is\s+(.+?)\s+(?:on\s+leave|absent|away)$/i, intent: 'leave', nameGroup: 1 },
  { regex: /^(?:leave|vacation|time\s+off)\s+(?:for\s+)?(.+)$/i, intent: 'leave', nameGroup: 1 },
  { regex: /^how\s+much\s+is\s+(.+?)(?:'s)?\s+(?:salary|pay|payroll)$/i, intent: 'payroll', nameGroup: 1 },
  { regex: /^(?:payroll|salary|pay)\s+(?:for\s+)?(.+)$/i, intent: 'payroll', nameGroup: 1 },

  // Promotion
  { regex: /^(?:promote|graduate|move\s+up)\s+(.+)$/i, intent: 'promote', nameGroup: 1 },

  // Assignments
  { regex: /^(?:has|did)\s+(.+?)\s+(?:done|submitted)\s+(?:their\s+)?assignments?$/i, intent: 'assignments', nameGroup: 1 },
  { regex: /^(.+?)(?:'s)?\s+assignments?$/i, intent: 'assignments', nameGroup: 1 },

  // Location & Presence
  { regex: /^(?:where is|where can i find|locate)\s+(.+)$/i, intent: 'profile', nameGroup: 1 },
  { regex: /^is\s+(.+?)\s+(?:in school|around|present)$/i, intent: 'attendance', nameGroup: 1 },

  // Phone & Contact
  { regex: /^(?:what is|show me)\s+(.+?)(?:'s)?\s+(?:phone|number|contact|mobile|whatsapp)$/i, intent: 'profile', nameGroup: 1 },
  { regex: /^(?:phone|number|contact)\s+(?:for|of\s+)?(.+)$/i, intent: 'profile', nameGroup: 1 },
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
      // Ignore matches that are just common intent verbs
      const ignoreWords = ['student', 'teacher', 'class', 'admin', 'bursar', 'school']
      if (ignoreWords.includes(raw.toLowerCase())) continue
      
      return { name: raw, rawName: stripTitle(raw), intent }
    }
  }
  return null
}

// ── Legacy extractor (kept for compatibility) ─────────────────────
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
      return { path: '/bursar/fees', icon: '💳', color: '#16a34a', verb: "Pay Fees" }
    case 'invoice':
      return { path: '/bursar/bill-sheet', icon: '🧾', color: '#b45309', verb: "View Bill Sheet" }
    case 'arrears':
      return { path: '/bursar/debtors', icon: '⚠️', color: '#ef4444', verb: "Check Balance" }
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
    case 'message':
      return { path: '/admin/messages', icon: '💬', color: '#0891b2', verb: "Send Message" }
    case 'parents':
      return { path: '/admin/parents', icon: '👨‍👩‍👧', color: '#6d28d9', verb: "View Parents" }
    case 'leave':
      return { path: '/admin/staff-leave', icon: '✈️', color: '#0891b2', verb: "Manage Leave" }
    case 'payroll':
      return { path: '/bursar/payroll', icon: '💼', color: '#16a34a', verb: "View Payroll" }
    case 'promote':
      return { path: '/admin/batch-promotion', icon: '⬆️', color: '#1a56db', verb: "Promote" }
    case 'assignments':
      return { path: '/teacher/assignments', icon: '📎', color: '#7c3aed', verb: "View Assignments" }
    default:
      return isStaff 
        ? { path: '/admin/teachers', icon: '🔍', color: '#6b7280', verb: "Find Staff" }
        : { path: '/admin/students', icon: '🔍', color: '#6b7280', verb: "Find Student" }
  }
}

// ── Class Hint ────────────────────────────────────────────────────────────────
export function extractClassHint(query: string): string | null {
  const patterns = [/grade\s*\d+/i, /year\s*\d+/i, /form\s*\d+/i, /class\s*\d+/i, /jhs\s*\d+/i, /shs\s*\d+/i, /js\d+/i, /kg\s*\d*/i, /nursery\s*\d*/i]
  for (const p of patterns) {
    const m = query.match(p)
    if (m) return m[0].trim()
  }
  return null
}
