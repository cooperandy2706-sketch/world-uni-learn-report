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
  roles: ('admin' | 'teacher' | 'bursar' | 'student' | 'security' | 'parent' | 'proprietor' | 'nurse' | 'librarian' | 'driver' | 'any')[]
}

// Over 100+ intent phrases mapped to actions for all portals
const ADMIN_PORTAL_INTENTS: IntentRule[] = [
  // Dashboard & Main
  { keywords: ['dashboard', 'home', 'main page', 'start page', 'admin home', 'admin portal', 'take me home', 'welcome page'], label: 'Admin Dashboard', subtitle: 'Admin → Dashboard', icon: '🏠', path: '/admin/dashboard', color: '#1a56db', roles: ['admin'] },
  { keywords: ['academic hub', 'academics hub', 'academic portal', 'school academics', 'learning center'], label: 'Academic Hub', subtitle: 'Admin → Academic Hub', icon: '🎓', path: '/admin/academic-hub', color: '#1a56db', roles: ['admin'] },
  { keywords: ['assessment hub', 'exams hub', 'testing center', 'test hub', 'grading hub', 'assessments'], label: 'Assessment Hub', subtitle: 'Admin → Assessment Hub', icon: '📝', path: '/admin/assessment-hub', color: '#0891b2', roles: ['admin'] },
  { keywords: ['student hub', 'students hub', 'learner hub', 'pupil hub', 'kids center'], label: 'Student Hub', subtitle: 'Admin → Student Hub', icon: '👨‍🎓', path: '/admin/student-hub', color: '#16a34a', roles: ['admin'] },
  { keywords: ['staff hub', 'teachers hub', 'hr hub', 'human resources', 'employee portal', 'staff directory page', 'faculty hub'], label: 'Staff & HR Hub', subtitle: 'Admin → Staff Hub', icon: '👩‍🏫', path: '/admin/staff-hub', color: '#7c3aed', roles: ['admin'] },
  { keywords: ['campus hub', 'logistics hub', 'operations center', 'facilities', 'school campus'], label: 'Campus & Logistics Hub', subtitle: 'Admin → Campus Hub', icon: '🏢', path: '/admin/campus-hub', color: '#b45309', roles: ['admin'] },
  { keywords: ['communications hub', 'comms hub', 'messaging center', 'announcement hub', 'broadcast center', 'talk to parents'], label: 'Communications Hub', subtitle: 'Admin → Communications Hub', icon: '💬', path: '/admin/communications-hub', color: '#0891b2', roles: ['admin'] },

  // Admin specific - People & Academics
  { keywords: ['student', 'students', 'pupil', 'learner', 'enroll', 'add student', 'new student', 'register student', 'admit student', 'student list', 'student directory', 'find student', 'kids', 'children', 'add new kid', 'register a child', 'view all students', 'all learners', 'pupils database', 'who are my students', 'manage kids'], label: 'Students Directory', subtitle: 'People → Students', icon: '👨‍🎓', path: '/admin/students', color: '#1a56db', roles: ['admin'] },
  { keywords: ['teacher', 'staff', 'teachers', 'lecturer', 'instructor', 'staff list', 'employees', 'add teacher', 'hire staff', 'new teacher', 'faculty', 'hire someone', 'find me a teacher', 'view all staff', 'who works here', 'manage teachers', 'school workers'], label: 'Staff Directory', subtitle: 'People → Staff', icon: '👩‍🏫', path: '/admin/teachers', color: '#7c3aed', roles: ['admin'] },
  { keywords: ['admissions', 'applicant', 'application', 'enrolment form', 'new admission', 'register', 'intake', 'waiting list', 'admission list', 'admit new', 'apply to school', 'enrollment applications', 'check applicants', 'accept student'], label: 'Admissions', subtitle: 'People → Admissions', icon: '📥', path: '/admin/admissions', color: '#16a34a', roles: ['admin'] },
  { keywords: ['alumni', 'graduate', 'former student', 'old student', 'past student', 'school leaver', 'graduated', 'old pupils', 'past learners', 'completed students', 'alumni association'], label: 'Alumni Records', subtitle: 'People → Alumni', icon: '🎓', path: '/admin/alumni', color: 'var(--text-muted)', roles: ['admin'] },
  { keywords: ['parent', 'parents', 'guardian', 'parent login', 'parent access', 'family', 'mothers', 'fathers', 'relatives', 'parent portal', 'manage parents', 'who are the parents', 'contact family'], label: 'Parent Logins & Directory', subtitle: 'People → Parents', icon: '👨‍👩‍👧', path: '/admin/parents', color: '#6d28d9', roles: ['admin'] },
  
  // Admin Operations & Settings
  { keywords: ['attendance today', 'today attendance', 'who present', 'who absent', 'mark attendance', 'absent today', 'present today', 'take register', 'roll call', 'daily register', 'attendance sheet', 'mark the register', 'is everyone here', 'check attendance', 'attendance records', 'daily roll call', 'who came to school'], label: "Today's Attendance", subtitle: 'Academics → Attendance', icon: '✅', path: '/admin/attendance', color: '#16a34a', roles: ['admin'] },
  { keywords: ['score', 'grades', 'marks', 'enter score', 'enter marks', 'score entry', 'grade entry', 'results', 'record marks', 'input grades', 'exam scores', 'test scores', 'ca scores', 'put in marks', 'upload results', 'add grades', 'student performance marks'], label: 'Score Entry', subtitle: 'Academics → Score Entry', icon: '✏️', path: '/admin/score-entry', color: '#0891b2', roles: ['admin'] },
  { keywords: ['timetable', 'school timetable', 'class schedule', 'lesson plan', 'when is class', 'teaching periods', 'schedule lessons', 'build timetable', 'manage schedule', 'school periods', 'time table'], label: 'Timetable Manager', subtitle: 'Admin Tools → Timetable', icon: '🕐', path: '/admin/timetable', color: '#6d28d9', roles: ['admin'] },
  { keywords: ['weekly goals', 'goals', 'targets', 'school goals', 'weekly objectives', 'what to achieve', 'this week plan', 'action plan'], label: 'Weekly Goals', subtitle: 'Admin Tools → Weekly Goals', icon: '🎯', path: '/admin/weekly-goals', color: '#f59e0b', roles: ['admin'] },
  { keywords: ['poster', 'poster maker', 'design', 'flyer', 'create poster', 'graphics', 'social media', 'images', 'marketing', 'adverts', 'make a design', 'design tool', 'canva alternative', 'school flyers'], label: 'Poster Maker', subtitle: 'Admin Tools → Poster Maker', icon: '🎨', path: '/admin/poster-maker', color: '#7c3aed', roles: ['admin'] },
  { keywords: ['election', 'pec', 'vote', 'voting', 'prefect', 'school prefect', 'src election', 'candidates', 'polls', 'ballot', 'elect prefects', 'who is winning', 'vote count', 'head boy', 'head girl', 'school elections'], label: 'Elections (PEC)', subtitle: 'Admin Tools → Elections', icon: '🗳️', path: '/admin/elections', color: '#ef4444', roles: ['admin'] },
  { keywords: ['settings', 'configure', 'school info', 'edit school', 'logo', 'fees structure', 'academic year', 'term', 'semester', 'preferences', 'setup', 'school profile', 'update school', 'system configuration', 'change school name', 'manage terms'], label: 'School Settings', subtitle: 'System Settings', icon: '⚙️', path: '/admin/settings', color: 'var(--text-main)', roles: ['admin'] },
  { keywords: ['calendar', 'event', 'events', 'holiday', 'vacation date', 'reopening date', 'school dates', 'holidays', 'occasions', 'dates', 'when do we reopen', 'break dates', 'term dates', 'calendar setup', 'school year calendar', 'plan events'], label: 'School Calendar', subtitle: 'Operations → Calendar', icon: '📅', path: '/admin/calendar', color: '#1a56db', roles: ['admin'] },
  { keywords: ['sms', 'send message', 'send sms', 'text message', 'broadcast', 'notify', 'message parents', 'contact parents', 'announcement text', 'bulk sms', 'send a blast', 'text all parents', 'whatsapp message', 'parent communication', 'send text alert'], label: 'SMS & Messaging', subtitle: 'Communications → SMS', icon: '📱', path: '/admin/sms', color: '#16a34a', roles: ['admin'] },
  { keywords: ['message', 'inbox', 'chat', 'conversation', 'messages', 'direct message', 'mail', 'internal mail', 'who messaged me', 'unread messages', 'staff chat', 'teacher messages'], label: 'Internal Messages', subtitle: 'Communications → Chat', icon: '💬', path: '/admin/messages', color: '#6d28d9', roles: ['admin'] },
  { keywords: ['announcement', 'announcements', 'notice', 'news', 'time-bound notifications', 'scheduled alarms', 'expiring announcements', 'post announcement', 'broadcast', 'school news', 'pop-up alarm', 'notice board', 'tell everyone', 'public notice'], label: 'Announcements & Alarms', subtitle: 'Communications → Announcements', icon: '📢', path: '/admin/announcements', color: '#10b981', roles: ['admin'] },
  { keywords: ['task', 'tasks', 'to-do', 'todo', 'checklist', 'admin tasks', 'todo list', 'assign task', 'jobs', 'my tasks', 'what should i do', 'work list', 'pending jobs', 'chores'], label: 'Admin Tasks', subtitle: 'Operations → Tasks', icon: '✓', path: '/admin/tasks', color: '#0891b2', roles: ['admin'] },
  { keywords: ['leave', 'staff leave', 'vacation', 'time off', 'absent staff', 'substitute', 'substitute teacher', 'sick leave', 'permission', 'away', 'staffs requesting for leave', 'leave requests', 'leave applications', 'pending leave', 'who is requesting leave', 'asking for permission', 'absent workers', 'teacher absence', 'approve leave'], label: 'Staff Leave Management', subtitle: 'HR → Staff Leave', icon: '✈️', path: '/admin/staff-leave', color: '#0891b2', roles: ['admin'] },
  
  // Analytics & Insights
  { keywords: ['analytics', 'performance', 'stats', 'statistics', 'overview', 'insights', 'school performance', 'academic analytics', 'data', 'charts', 'graphs', 'school status', 'how is the school doing', 'school data', 'metrics', 'school metrics'], label: 'School Analytics', subtitle: 'Insights → Analytics', icon: '📊', path: '/admin/analytics', color: '#6d28d9', roles: ['admin'] },
  { keywords: ['performance tracker', 'student tracker', 'track performance', 'academic progress', 'student progression', 'how are students doing'], label: 'Performance Tracker', subtitle: 'Insights → Performance', icon: '📈', path: '/admin/performance', color: '#1a56db', roles: ['admin'] },
  { keywords: ['busy teacher', 'busy staff', 'most active teacher', 'teacher workload', 'teacher load', 'teaching hours', 'staff metrics', 'who is teaching', 'teacher stats', 'staff analytics'], label: 'Teacher Workload Analytics', subtitle: 'Insights → Analytics', icon: '📊', path: '/admin/analytics', color: '#6d28d9', roles: ['admin'] },
  
  // Advanced Admin Intents
  { keywords: ['backup', 'export data', 'download database', 'save records', 'cloud backup', 'data export', 'export students', 'download everything'], label: 'Data Backup & Export', subtitle: 'Settings → Maintenance', icon: '💾', path: '/admin/settings', color: 'var(--text-main)', roles: ['admin'] },
  { keywords: ['subject setup', 'add subject', 'new course', 'manage curriculum', 'create subject', 'school subjects', 'course list'], label: 'Subject Management', subtitle: 'Academics → Setup', icon: '📚', path: '/admin/subjects', color: '#7c3aed', roles: ['admin'] },
  { keywords: ['assign teacher', 'class teacher', 'form teacher', 'teacher assignment', 'who teaches', 'assign staff to class'], label: 'Class Assignments', subtitle: 'People → Staff Assignment', icon: '🤝', path: '/admin/teachers', color: '#0891b2', roles: ['admin'] },
  { keywords: ['promote', 'graduate', 'move up', 'batch promotion', 'promote students', 'move to next class', 'end of year promotion', 'academic progression', 'graduate class'], label: 'Batch Promotion', subtitle: 'Academics → Promotion', icon: '⬆️', path: '/admin/promotion', color: '#1a56db', roles: ['admin'] },
]

const TEACHER_PORTAL_INTENTS: IntentRule[] = [
  { keywords: ['dashboard', 'home', 'main page', 'start page', 'teacher portal', 'take me home', 'welcome page'], label: 'Teacher Dashboard', subtitle: 'Teacher → Dashboard', icon: '🏠', path: '/teacher/dashboard', color: '#1a56db', roles: ['teacher'] },
  { keywords: ['my classes', 'classes I teach', 'my subjects', 'my students', 'classroom', 'where do I teach'], label: 'My Classes', subtitle: 'Instruction → Classes', icon: '🏫', path: '/teacher/my-classes', color: '#0891b2', roles: ['teacher'] },
  { keywords: ['students', 'my students', 'pupils', 'learners', 'class list', 'who is in my class', 'student profiles'], label: 'My Students', subtitle: 'Instruction → Students', icon: '👨‍🎓', path: '/teacher/students', color: '#1a56db', roles: ['teacher'] },
  { keywords: ['score entry', 'enter marks', 'record grades', 'exam scores', 'test marks', 'put in results', 'grading', 'grade students', 'add scores', 'terminal results'], label: 'Score Entry', subtitle: 'Instruction → Score Entry', icon: '✏️', path: '/teacher/score-entry', color: '#0891b2', roles: ['teacher'] },
  { keywords: ['attendance', 'mark register', 'roll call', 'who is absent', 'present students', 'take attendance', 'class register', 'today attendance', 'mark present'], label: 'Class Attendance', subtitle: 'Instruction → Attendance', icon: '✅', path: '/teacher/attendance', color: '#16a34a', roles: ['teacher'] },
  { keywords: ['class tests', 'quizzes', 'exams', 'assessments', 'create test', 'give quiz', 'short test', 'continuous assessment'], label: 'Class Tests', subtitle: 'Instruction → Class Tests', icon: '📝', path: '/teacher/class-tests', color: '#f59e0b', roles: ['teacher'] },
  { keywords: ['video assignments', 'video homework', 'upload video', 'student videos', 'watch assignments', 'multimedia homework'], label: 'Video Assignments', subtitle: 'Instruction → Video Assignments', icon: '🎥', path: '/teacher/video-assignments', color: '#ef4444', roles: ['teacher'] },
  { keywords: ['reports', 'report cards', 'terminal reports', 'student remarks', 'write remarks', 'end of term reports', 'grading reports', 'comment on reports'], label: 'Term Reports', subtitle: 'Instruction → Reports', icon: '📄', path: '/teacher/reports', color: '#7c3aed', roles: ['teacher'] },
  { keywords: ['timetable', 'my schedule', 'when do I teach', 'my periods', 'class times', 'teacher timetable', 'daily schedule'], label: 'My Timetable', subtitle: 'Instruction → Timetable', icon: '🕐', path: '/teacher/timetable', color: '#6d28d9', roles: ['teacher'] },
  { keywords: ['assignments', 'homework', 'give homework', 'mark homework', 'student tasks', 'exercises', 'project work', 'give assignment'], label: 'Assignments', subtitle: 'Instruction → Assignments', icon: '📎', path: '/teacher/assignments', color: '#0891b2', roles: ['teacher'] },
  { keywords: ['library', 'resources', 'teaching materials', 'books', 'subject resources', 'reading materials', 'reference books'], label: 'Subject Library', subtitle: 'Instruction → Library', icon: '📚', path: '/teacher/subjects', color: '#7c3aed', roles: ['teacher'] },
  { keywords: ['behavior log', 'discipline', 'punish', 'bad behavior', 'good behavior', 'conduct', 'student behavior', 'demerit', 'merit', 'report student'], label: 'Behavior Log', subtitle: 'More → Behavior Log', icon: '⚠️', path: '/teacher/behavior', color: '#f59e0b', roles: ['teacher'] },
  { keywords: ['lesson tracker', 'lesson plan', 'what did I teach', 'curriculum progress', 'teaching log', 'track lessons', 'lesson record'], label: 'Lesson Tracker', subtitle: 'More → Lesson Tracker', icon: '📖', path: '/teacher/lesson-tracker', color: '#1a56db', roles: ['teacher'] },
  { keywords: ['syllabus', 'curriculum', 'scheme of work', 'what to teach', 'teaching guide', 'course outline'], label: 'Syllabus', subtitle: 'More → Syllabus', icon: '📋', path: '/teacher/syllabus', color: '#16a34a', roles: ['teacher'] },
  { keywords: ['self service', 'my profile', 'update profile', 'teacher settings', 'my info', 'personal details'], label: 'Self Service', subtitle: 'More → Self Service', icon: '👤', path: '/teacher/self-service', color: '#6d28d9', roles: ['teacher'] },
  { keywords: ['my leave', 'request leave', 'apply for leave', 'sick leave', 'excuse', 'i want leave', 'requesting for leave', 'permission to go', 'need time off', 'vacation request'], label: 'My Leave', subtitle: 'More → My Leave', icon: '✈️', path: '/teacher/leave', color: '#0891b2', roles: ['teacher'] },
  { keywords: ['requisition', 'request items', 'need markers', 'need supplies', 'ask for things', 'request materials', 'my requisitions', 'order supplies'], label: 'My Requisitions', subtitle: 'More → Requisitions', icon: '🛒', path: '/teacher/requisition', color: '#b45309', roles: ['teacher'] },
  { keywords: ['payslips', 'my salary', 'my pay', 'payment receipt', 'how much was I paid', 'salary slip', 'earnings'], label: 'Payslips', subtitle: 'More → Payslips', icon: '💰', path: '/teacher/payslips', color: '#16a34a', roles: ['teacher'] },
  { keywords: ['messages', 'chat', 'inbox', 'talk to admin', 'colleague chat', 'internal messages', 'direct messages'], label: 'Messages', subtitle: 'More → Messages', icon: '💬', path: '/teacher/messages', color: '#6d28d9', roles: ['teacher'] },
  { keywords: ['notifications', 'alerts', 'what is new', 'system alerts', 'school notices'], label: 'Notifications', subtitle: 'More → Notifications', icon: '🔔', path: '/teacher/notifications', color: '#f59e0b', roles: ['teacher'] },
  { keywords: ['daily collections', 'collect feeding fee', 'daily fees', 'take money', 'daily register fee', 'class collections'], label: 'Daily Collections', subtitle: 'More → Daily Fees', icon: '💵', path: '/teacher/daily-fees', color: '#0891b2', roles: ['teacher'] },
  { keywords: ['term agenda', 'agenda', 'what is happening', 'term goals', 'events for term', 'school calendar'], label: 'Term Agenda', subtitle: 'More → Term Agenda', icon: '📅', path: '/teacher/agenda', color: '#1a56db', roles: ['teacher'] },
  { keywords: ['elections', 'pec', 'vote prefect', 'school elections', 'vote for head boy', 'SRC elections'], label: 'Elections (PEC)', subtitle: 'More → Elections', icon: '🗳️', path: '/teacher/elections-hub', color: '#ef4444', roles: ['teacher'] },
  { keywords: ['typing nitro', 'typing game', 'play typing', 'keyboard practice', 'typing speed', 'fast typing'], label: 'Typing Nitro', subtitle: 'More → Typing Nitro', icon: '⌨️', path: '/teacher/typing-game', color: '#f59e0b', roles: ['teacher'] },
  { keywords: ['pastoral care', 'counseling', 'student care', 'mentoring', 'guidance', 'student support', 'pastoral'], label: 'Pastoral Care', subtitle: 'More → Pastoral Care', icon: '🤝', path: '/teacher/pastoral', color: '#16a34a', roles: ['teacher'] },
]

const BURSAR_PORTAL_INTENTS: IntentRule[] = [
  { keywords: ['dashboard', 'home', 'main page', 'start page', 'bursar portal', 'finance home', 'take me home', 'welcome page'], label: 'Bursar Dashboard', subtitle: 'Bursar → Dashboard', icon: '🏠', path: '/bursar/dashboard', color: '#1a56db', roles: ['bursar'] },
  { keywords: ['pay fee', 'pay fees', 'fee payment', 'collect fee', 'record payment', 'tuition', 'make payment', 'school fees', 'receive payment', 'payment receipt', 'bursar office', 'finance', 'money', 'cashier', 'student paid', 'billing money', 'revenue collect', 'help me pay fees', 'take money', 'record a receipt', 'receive cash'], label: 'Collect Fee Payment', subtitle: 'Finance → School Fees', icon: '💳', path: '/bursar/fees', color: '#16a34a', roles: ['bursar'] },
  { keywords: ['daily fee', 'daily fees', 'feeding fee', 'studies fee', 'daily collection', 'record daily', 'daily register fee', 'feeding register', 'daily rate', 'day fee', 'collect daily money'], label: 'Daily Fees Collection', subtitle: 'Finance → Daily Fees', icon: '📅', path: '/bursar/daily-fees', color: '#0891b2', roles: ['bursar'] },
  { keywords: ['arrear', 'debt', 'outstanding', 'debtors', 'owe', 'unpaid', 'who owes', 'balance', 'defaulters', 'owing list', 'credit', 'non-payment', 'fee balance', 'unpaid fees', 'money owed', 'list of debtors', 'who has not paid', 'students owing'], label: 'View Debtors & Arrears', subtitle: 'Finance → Debtors', icon: '📊', path: '/bursar/debtors', color: '#b45309', roles: ['bursar'] },
  { keywords: ['bill sheet', 'fee statement', 'print bill', 'student bill sheet', 'generate fee statement', 'parent invoice', 'term statement', 'billing statement', 'official bill', 'fee breakdown', 'print invoices', 'view all bills'], label: 'Student Bill Sheet', subtitle: 'Finance → Bill Sheet', icon: '🧾', path: '/bursar/bill-sheet', color: '#b45309', roles: ['bursar'] },
  { keywords: ['payroll', 'salary', 'staff pay', 'pay staff', 'wages', 'staff salary', 'teacher pay', 'pay workers', 'remuneration', 'payslip', 'earnings', 'monthly salary', 'payroll list', 'staff money', 'give salaries', 'pay teachers', 'process payroll'], label: 'Staff Payroll', subtitle: 'Finance → Payroll', icon: '💼', path: '/bursar/payroll', color: '#7c3aed', roles: ['bursar'] },
  { keywords: ['income', 'revenue', 'earned', 'earnings', 'money in', 'total income', 'cash inflow', 'profit', 'financial summary', 'total revenue', 'balance sheet', 'how much did we make', 'total money', 'record income', 'other income'], label: 'Income Records', subtitle: 'Finance → Income', icon: '📈', path: '/bursar/income', color: '#0891b2', roles: ['bursar'] },
  { keywords: ['expense', 'spending', 'cost', 'expenditure', 'spent', 'money out', 'purchases', 'receipts', 'cash outflow', 'bills to pay', 'school costs', 'expenditure list', 'what did we spend', 'total expenses', 'buy items', 'record expense', 'pay for something'], label: 'Expense Records', subtitle: 'Finance → Expenses', icon: '📉', path: '/bursar/expenses', color: '#ef4444', roles: ['bursar'] },
  { keywords: ['student', 'students', 'student list', 'find student', 'check student', 'student records', 'who is this student'], label: 'Students Directory', subtitle: 'Tools → Students', icon: '👨‍🎓', path: '/bursar/students', color: '#1a56db', roles: ['bursar'] },
  { keywords: ['school store', 'store inventory', 'uniform stock', 'textbook stock', 'stationery stock', 'sell item', 'restock', 'inventory management', 'stock level', 'low stock', 'school shop', 'buy uniform', 'sell books'], label: 'School Store & Inventory', subtitle: 'Tools → Inventory', icon: '🗃️', path: '/bursar/inventory', color: 'var(--text-main)', roles: ['bursar'] },
  { keywords: ['vendor', 'suppliers', 'supplier', 'contractor', 'service provider', 'vendor list', 'school vendors', 'add vendor', 'manage vendor', 'vendor management', 'who supplies'], label: 'Vendor Management', subtitle: 'Tools → Vendors', icon: '🏪', path: '/bursar/vendors', color: '#6d28d9', roles: ['bursar'] },
  { keywords: ['requisition', 'requisitions', 'staff request', 'purchase request', 'fund request', 'request for funds', 'approve requisition', 'pending requests', 'approve request', 'procurement request', 'teacher wants items'], label: 'Staff Requisitions', subtitle: 'Tools → Requisitions', icon: '📋', path: '/bursar/requisitions', color: '#0891b2', roles: ['bursar'] },
  { keywords: ['analytics', 'financial analytics', 'finance charts', 'money overview', 'financial health', 'revenue graphs'], label: 'Financial Analytics', subtitle: 'Tools → Analytics', icon: '📊', path: '/bursar/analytics', color: '#7c3aed', roles: ['bursar'] },
  { keywords: ['sms', 'send sms', 'remind debtors', 'text parents', 'fee reminder', 'send message to parents', 'debtor sms', 'remind about fees'], label: 'SMS Reminders', subtitle: 'Tools → SMS', icon: '📱', path: '/bursar/sms', color: '#16a34a', roles: ['bursar'] },
  { keywords: ['report', 'reports', 'financial report', 'finance report', 'p&l', 'profit and loss', 'ledger', 'account statement', 'transaction report', 'export finance', 'financial summary report', 'bursar report', 'generate statement'], label: 'Financial Reports', subtitle: 'Tools → Reports', icon: '📄', path: '/bursar/reports', color: '#1a56db', roles: ['bursar'] },
]

const STUDENT_PORTAL_INTENTS: IntentRule[] = [
  { keywords: ['dashboard', 'home', 'main page', 'start page', 'student portal', 'my portal', 'take me home', 'welcome page'], label: 'Student Dashboard', subtitle: 'Portal → Dashboard', icon: '🏠', path: '/student/dashboard', color: '#1a56db', roles: ['student'] },
  { keywords: ['my result', 'my grade', 'my score', 'my marks', 'result check', 'how did i do', 'exam results', 'terminal results', 'did i pass', 'show my marks', 'results for this term', 'check my scores', 'report card', 'terminal report'], label: 'My Results', subtitle: 'Academics → Results', icon: '📊', path: '/student/results', color: '#1a56db', roles: ['student'] },
  { keywords: ['assignments', 'homework', 'my tasks', 'what is due', 'pending assignments', 'school work', 'exercises', 'project work', 'submit assignment'], label: 'My Assignments', subtitle: 'Academics → Assignments', icon: '📝', path: '/student/assignments', color: '#7c3aed', roles: ['student'] },
  { keywords: ['attendance', 'was i present', 'my attendance', 'absent days', 'present days', 'school attendance record', 'did i go to school'], label: 'My Attendance', subtitle: 'Academics → Attendance', icon: '✅', path: '/student/attendance', color: '#16a34a', roles: ['student'] },
  { keywords: ['timetable', 'schedule', 'when is class', 'my periods', 'class timetable', 'what subject is next', 'daily schedule', 'lesson times'], label: 'My Timetable', subtitle: 'Academics → Timetable', icon: '🕐', path: '/student/schedule', color: '#6d28d9', roles: ['student'] },
  { keywords: ['acadera tv', 'videos', 'educational videos', 'watch lessons', 'video lessons', 'learning videos', 'school tv', 'fun learning'], label: 'Acadera TV', subtitle: 'Explore → TV', icon: '📺', path: '/student/acadera-tv', color: '#ef4444', roles: ['student'] },
  { keywords: ['library', 'book', 'resource', 'read', 'study materials', 'past questions', 'notes', 'handouts', 'learning materials', 'e-books', 'library books', 'digital library', 'find a book', 'read online'], label: 'Global Library', subtitle: 'Explore → Library', icon: '📚', path: '/student/library', color: '#7c3aed', roles: ['student'] },
  { keywords: ['resources', 'downloads', 'files', 'course materials', 'school files', 'documents', 'downloadable'], label: 'My Resources', subtitle: 'Explore → Resources', icon: '📥', path: '/student/resources', color: '#0891b2', roles: ['student'] },
  { keywords: ['typing', 'typing nitro', 'typing game', 'keyboard skills', 'learn to type', 'fast typing', 'practice typing', 'type faster', 'typing competition', 'keyboard master', 'typing speed', 'play a game', 'nitro game'], label: 'Typing Nitro', subtitle: 'Explore → Typing Nitro', icon: '⌨️', path: '/student/typing-game', color: '#f59e0b', roles: ['student'] },
  { keywords: ['elections', 'pec', 'vote', 'prefect elections', 'vote for prefect', 'src elections', 'school vote', 'choose leader'], label: 'PEC Elections', subtitle: 'Explore → Elections', icon: '🗳️', path: '/student/elections', color: '#ef4444', roles: ['student'] },
  { keywords: ['announcement', 'notice board', 'news', 'school news', 'what is happening', 'alerts', 'notices', 'bulletin board', 'updates'], label: 'Notice Board', subtitle: 'Explore → Notice Board', icon: '📢', path: '/student/announcements', color: '#10b981', roles: ['student'] },
  { keywords: ['calendar', 'events', 'school calendar', 'holidays', 'when do we close', 'vacation', 'reopening', 'term dates', 'event list'], label: 'School Calendar', subtitle: 'Explore → Calendar', icon: '📅', path: '/student/calendar', color: '#1a56db', roles: ['student'] },
  { keywords: ['exeat', 'my exeats', 'permission to leave', 'leave school', 'go out', 'approved exit', 'gate pass', 'permission slip'], label: 'My Exeats', subtitle: 'Explore → Exeats', icon: '🚪', path: '/student/exeats', color: '#b45309', roles: ['student'] },
  { keywords: ['notifications', 'my alerts', 'bell', 'messages', 'system notifications', 'what is new', 'unread alerts'], label: 'Notifications', subtitle: 'Explore → Notifications', icon: '🔔', path: '/student/notifications', color: '#f59e0b', roles: ['student'] },
  { keywords: ['my fee', 'my bill', 'pay school fee', 'balance', 'how much', 'outstanding', 'my debt', 'fee statement', 'financial status', 'how much do i owe', 'my school fees', 'am i owing', 'tuition fees', 'check balance'], label: 'Fees & Billing', subtitle: 'Account → Billing', icon: '💳', path: '/student/billing', color: '#16a34a', roles: ['student'] },
  { keywords: ['profile', 'my account', 'my details', 'update info', 'my picture', 'student ID', 'who am i', 'personal information'], label: 'My Profile', subtitle: 'Account → Profile', icon: '👤', path: '/student/profile', color: '#6d28d9', roles: ['student'] },
]

const PROPRIETOR_PORTAL_INTENTS: IntentRule[] = [
  { keywords: ['dashboard', 'home', 'main page', 'start page', 'proprietor portal', 'executive dashboard', 'take me home', 'welcome page', 'owner dashboard'], label: 'Executive Dashboard', subtitle: 'Proprietor → Dashboard', icon: '🏠', path: '/proprietor/dashboard', color: '#1a56db', roles: ['any'] }, // Using 'any' so proprietors (special admin) can access easily
  { keywords: ['academic performance', 'school results', 'pass rate', 'student grades', 'school analytics', 'how is the school doing', 'performance overview', 'academic health'], label: 'Academic Performance', subtitle: 'Proprietor → Analytics', icon: '🎓', path: '/proprietor/analytics', color: '#7c3aed', roles: ['any'] },
  { keywords: ['financial health', 'finances', 'money overview', 'revenue', 'income vs expense', 'profit', 'loss', 'business health', 'how much money', 'school wealth', 'total revenue', 'total collected'], label: 'Financial Health', subtitle: 'Proprietor → Finances', icon: '💰', path: '/proprietor/finances', color: '#16a34a', roles: ['any'] },
  { keywords: ['student demographics', 'student population', 'how many students', 'enrollment numbers', 'boys vs girls', 'student statistics', 'who is enrolled', 'population'], label: 'Student Demographics', subtitle: 'Proprietor → Demographics', icon: '👨‍🎓', path: '/proprietor/students', color: '#0891b2', roles: ['any'] },
  { keywords: ['staff and payroll', 'staff demographics', 'how many teachers', 'payroll overview', 'employee statistics', 'staff numbers', 'who works here', 'teacher population'], label: 'Staff & Payroll Demographics', subtitle: 'Proprietor → Demographics', icon: '👩‍🏫', path: '/proprietor/staff', color: '#b45309', roles: ['any'] },
]

const PARENT_PORTAL_INTENTS: IntentRule[] = [
  { keywords: ['dashboard', 'home', 'main page', 'start page', 'parent portal', 'wards', 'my children', 'take me home', 'welcome page'], label: 'Wards Dashboard', subtitle: 'Parent → Wards', icon: '🏠', path: '/parent/dashboard', color: '#1a56db', roles: ['any'] },
  { keywords: ['academics', 'grades', 'results', 'report card', 'how is my child doing', 'child scores', 'terminal results', 'marks', 'academic performance', 'assignments', 'homework'], label: 'Academics & Results', subtitle: 'Parent → Academics', icon: '🎓', path: '/parent/academics', color: '#7c3aed', roles: ['any'] },
  { keywords: ['attendance', 'was my child present', 'child attendance', 'absent days', 'present days', 'school attendance record', 'did my kid go to school', 'roll call'], label: 'Attendance Record', subtitle: 'Parent → Attendance', icon: '✅', path: '/parent/attendance', color: '#16a34a', roles: ['any'] },
  { keywords: ['billing', 'fees', 'pay fees', 'how much do i owe', 'child school fees', 'balance', 'arrears', 'debt', 'invoice', 'receipt', 'pay money', 'tuition'], label: 'Fees & Billing', subtitle: 'Parent → Billing', icon: '💳', path: '/parent/billing', color: '#b45309', roles: ['any'] },
  { keywords: ['messages', 'chat', 'contact teacher', 'talk to school', 'message principal', 'inbox', 'communicate', 'send message'], label: 'Messaging', subtitle: 'Parent → Messages', icon: '💬', path: '/parent/messages', color: '#6d28d9', roles: ['any'] },
  { keywords: ['calendar', 'events', 'school calendar', 'holidays', 'when do we close', 'vacation', 'reopening', 'term dates', 'event list'], label: 'School Calendar', subtitle: 'Parent → Calendar', icon: '📅', path: '/parent/calendar', color: '#1a56db', roles: ['any'] },
  { keywords: ['exeats', 'permission', 'child leaving', 'gate pass', 'approved exit', 'take child home', 'early dismissal'], label: 'Exeats & Permissions', subtitle: 'Parent → Exeats', icon: '🚪', path: '/parent/exeats', color: '#f59e0b', roles: ['any'] },
]

export const GLOBAL_INTENTS: IntentRule[] = [
  ...ADMIN_PORTAL_INTENTS,
  ...TEACHER_PORTAL_INTENTS,
  ...BURSAR_PORTAL_INTENTS,
  ...STUDENT_PORTAL_INTENTS,
  ...PROPRIETOR_PORTAL_INTENTS,
  ...PARENT_PORTAL_INTENTS,
]

// ── Additional Advanced Intents ──────────────────────────────────────────────
const ADVANCED_INTENTS: IntentRule[] = [
  { keywords: ['change password', 'update password', 'security settings', 'lock account', 'privacy settings', 'account security', 'my settings', 'profile update'], label: 'Account Security', subtitle: 'Account → Settings', icon: '🔒', path: '/account', color: '#ef4444', roles: ['any'] },
  { keywords: ['gate scanner', 'scan student', 'scan id', 'barcode', 'qr code', 'scan gate', 'check in student', 'security scanner'], label: 'Gate Scanner', subtitle: 'Security → Scanner', icon: '📷', path: '/security/scanner', color: '#1a56db', roles: ['security', 'admin'] },
  { keywords: ['visitor badge', 'print badge', 'guest pass', 'visitor tag', 'issue badge', 'security badge'], label: 'Visitor Badges', subtitle: 'Security → Badges', icon: '🏷️', path: '/security/visitor-badges', color: '#f59e0b', roles: ['security', 'admin'] },
  { keywords: ['gate attendance', 'security log', 'who entered', 'who left', 'gate records', 'student entry'], label: 'Gate Attendance Log', subtitle: 'Security → Log', icon: '🛡️', path: '/security/gate-attendance', color: '#16a34a', roles: ['security', 'admin'] },
  { keywords: ['fleet', 'transport', 'bus', 'vehicles', 'live fleet tracking', 'fleet speed alerts', 'bus speed', 'where is the bus', 'track bus', 'school transport', 'gps tracking', 'bus location', 'driver', 'school bus'], label: 'Live Fleet Tracking', subtitle: 'Operations → Transport', icon: '🚌', path: '/admin/fleet/live', color: '#f59e0b', roles: ['admin'] },
  { keywords: ['clinic', 'nurse', 'sickbay', 'sick bay', 'health', 'hospital', 'student sick', 'medication', 'health records', 'visits log'], label: 'School Clinic', subtitle: 'Medical → Dashboard', icon: '🏥', path: '/nurse/dashboard', color: '#ef4444', roles: ['any'] },
  { keywords: ['fines', 'overdue books', 'library fines', 'lost books', 'librarian', 'checkout history'], label: 'Library Management', subtitle: 'Library → Dashboard', icon: '📚', path: '/librarian/dashboard', color: '#7c3aed', roles: ['any'] },
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
      return { path: '/admin/assessment-hub?tab=scores', icon: '📊', color: '#1a56db', verb: "View Results" }
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
        ? { path: '/admin/staff-directory', icon: '🏫', color: '#0891b2', verb: "View Classes" }
        : { path: '/admin/classes', icon: '🏫', color: '#0891b2', verb: "View Class" }
    case 'profile':
      return isStaff
        ? { path: '/admin/staff-directory', icon: '👤', color: '#7c3aed', verb: "View Profile" }
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
        ? { path: '/admin/staff-directory', icon: '🔍', color: 'var(--text-muted)', verb: "Find Staff" }
        : { path: '/admin/students', icon: '🔍', color: 'var(--text-muted)', verb: "Find Student" }
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
