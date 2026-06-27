import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

let _qid = 0;
const qid = () => `q${++_qid}`;

const obj = (text, options, correctAnswer, diff = 'hard') => ({
  id: qid(), type: 'objective', text, options, correctAnswer, difficulty: diff
});

const subj = (text, marks = 10, hint = '') => ({
  id: qid(), type: 'subjective', text, marks, hint
});

// -----------------------------------------------------------------------------
// ICT MOCK EXAM 3 (ADVANCED)
// -----------------------------------------------------------------------------

// 40 Advanced Objective Questions
const objQ = [
  // Productivity Software
  obj('Which feature in Microsoft Word is used to automatically correct common spelling errors?', ['AutoCorrect', 'Spell Check', 'Grammar Check', 'Find and Replace'], 'AutoCorrect'),
  obj('In Excel, which symbol is used to begin a formula?', ['=', '+', '*', '#'], '='),
  obj('What function in Excel adds all numbers in a range of cells?', ['SUM', 'ADD', 'TOTAL', 'COUNT'], 'SUM'),
  obj('Which feature in PowerPoint controls how one slide moves to the next during a presentation?', ['Transitions', 'Animations', 'Slide Show', 'Design'], 'Transitions'),
  obj('What is the default file extension for a Microsoft Word 2016 document?', ['.docx', '.doc', '.txt', '.pdf'], '.docx'),
  obj('In Excel, the intersection of a row and a column is called a:', ['Cell', 'Grid', 'Box', 'Table'], 'Cell'),
  obj('Which command is used to undo the last action in most productivity software?', ['Ctrl + Z', 'Ctrl + Y', 'Ctrl + U', 'Ctrl + X'], 'Ctrl + Z'),
  
  // Hardware
  obj('Which of these storage devices has no moving mechanical parts?', ['Solid State Drive (SSD)', 'Hard Disk Drive (HDD)', 'CD-ROM', 'Magnetic Tape'], 'Solid State Drive (SSD)'),
  obj('The speed of a computer\'s processor is typically measured in:', ['Gigahertz (GHz)', 'Gigabytes (GB)', 'Megabits per second (Mbps)', 'Revolutions per minute (RPM)'], 'Gigahertz (GHz)'),
  obj('Which hardware component is responsible for processing graphics and images?', ['GPU (Graphics Processing Unit)', 'CPU (Central Processing Unit)', 'RAM (Random Access Memory)', 'Motherboard'], 'GPU (Graphics Processing Unit)'),
  obj('Which of the following is considered both an input and an output device?', ['Touchscreen Monitor', 'Keyboard', 'Printer', 'Webcam'], 'Touchscreen Monitor'),
  obj('The main circuit board of a computer is called the:', ['Motherboard', 'CPU', 'Hard Drive', 'Expansion Card'], 'Motherboard'),
  obj('What does "USB" stand for in computer hardware?', ['Universal Serial Bus', 'Unified System Block', 'Universal System Bus', 'Unique Serial Bus'], 'Universal Serial Bus'),
  
  // Operating System
  obj('Which of the following is NOT a function of an Operating System?', ['Creating presentations', 'Managing memory', 'Managing hardware', 'Providing a user interface'], 'Creating presentations'),
  obj('The process of the operating system managing multiple applications running at the same time is called:', ['Multitasking', 'Multiprocessing', 'Booting', 'Formatting'], 'Multitasking'),
  obj('Which of the following is an open-source operating system?', ['Linux', 'Windows 10', 'macOS', 'iOS'], 'Linux'),
  obj('What is the primary purpose of formatting a disk?', ['To prepare it for data storage', 'To remove a virus', 'To install an operating system', 'To compress files'], 'To prepare it for data storage'),
  obj('The core component of an operating system that manages system resources is called the:', ['Kernel', 'Shell', 'GUI', 'Desktop'], 'Kernel'),
  
  // Social Media & Digital Literacy
  obj('The trail of data you create while using the internet is known as your:', ['Digital Footprint', 'Cyber Shadow', 'Data Trail', 'Internet History'], 'Digital Footprint'),
  obj('Which of the following is an example of good "netiquette"?', ['Respecting others\' privacy online', 'Typing in ALL CAPS', 'Sharing false information', 'Spamming message boards'], 'Respecting others\' privacy online'),
  obj('The act of copying someone else\'s work from the internet and presenting it as your own is called:', ['Plagiarism', 'Phishing', 'Copyrighting', 'Citation'], 'Plagiarism'),
  obj('Which symbol indicates a secure, encrypted website connection in a web browser?', ['A closed padlock', 'An open envelope', 'A warning triangle', 'A green checkmark'], 'A closed padlock'),
  obj('What does URL stand for?', ['Uniform Resource Locator', 'Universal Record Link', 'Unified Resource Line', 'Uniform Reference Locator'], 'Uniform Resource Locator'),
  obj('Which of these passwords is the most secure?', ['H#rse!89B', 'password123', 'johnsmith', '12345678'], 'H#rse!89B'),
  obj('The term used to describe the gap between those who have access to technology and those who do not is:', ['Digital Divide', 'Tech Gap', 'Information Barrier', 'Cyber Split'], 'Digital Divide'),
  
  // Email
  obj('In an email, what does the "Bcc" field stand for?', ['Blind Carbon Copy', 'Blank Carbon Copy', 'Backup Carbon Copy', 'Blind Computer Copy'], 'Blind Carbon Copy'),
  obj('When you reply to an email, the original sender receives your message. What button sends your reply to the sender AND everyone else included in the original message?', ['Reply All', 'Forward', 'Send', 'Cc'], 'Reply All'),
  obj('A file sent along with an email message is called an:', ['Attachment', 'Enclosure', 'Addition', 'Insert'], 'Attachment'),
  obj('Which of the following is a sign of a phishing email?', ['Asking for urgent verification of passwords', 'A personalized greeting using your name', 'An email from your teacher about homework', 'A newsletter you subscribed to'], 'Asking for urgent verification of passwords'),
  obj('What folder holds emails that have been written but not yet sent?', ['Drafts', 'Outbox', 'Sent', 'Inbox'], 'Drafts'),
  
  // General Advanced
  obj('Which software is used to protect a computer from malicious software?', ['Antivirus', 'Firewall', 'Disk Defragmenter', 'Backup Utility'], 'Antivirus'),
  obj('A network that connects computers across a large geographical area, like a country, is a:', ['WAN', 'LAN', 'MAN', 'PAN'], 'WAN'),
  obj('Which of the following is a cloud storage service?', ['Google Drive', 'Microsoft Word', 'Adobe Photoshop', 'Mozilla Firefox'], 'Google Drive'),
  obj('What does "HTTP" stand for?', ['HyperText Transfer Protocol', 'HyperText Transmission Process', 'Hyper Transfer Text Protocol', 'Hyperlink Text Transfer Protocol'], 'HyperText Transfer Protocol'),
  obj('Which part of a URL represents the domain extension (TLD)?', ['.com', 'www.', 'https://', 'google'], '.com'),
  obj('A program that secretly monitors your computer activity and sends the information over the internet is called:', ['Spyware', 'Adware', 'Ransomware', 'Worm'], 'Spyware'),
  obj('What does the term "upload" mean?', ['Transferring data from a local computer to a remote server', 'Transferring data from a remote server to a local computer', 'Installing new software', 'Deleting files from the internet'], 'Transferring data from a local computer to a remote server'),
  obj('Which of these is a common audio file format?', ['.mp3', '.jpg', '.pdf', '.docx'], '.mp3'),
  obj('Which of the following is an example of e-commerce?', ['Buying a book on Amazon', 'Sending an email', 'Reading a blog', 'Watching a YouTube video'], 'Buying a book on Amazon'),
  obj('What is the main purpose of a database management system (DBMS)?', ['To store, retrieve, and manage data efficiently', 'To create presentations', 'To edit photos', 'To browse the web'], 'To store, retrieve, and manage data efficiently'),
];

// 7 Advanced Subjective Questions (Pick 5)
const subjQ = [
  subj('Explain the difference between the "Cc" and "Bcc" fields in an email. Give an example of when you would use each.', 10, 'Think about privacy and who can see the email addresses of the recipients.'),
  subj('What is an Operating System? List three core functions of an Operating System and give two examples of popular Operating Systems.', 10, 'Mention memory management, hardware control, and user interface.'),
  subj('Define "Digital Footprint". Discuss two positive ways and two negative ways a digital footprint can affect a person\'s future.', 10, 'Think about college applications, future jobs, and online reputation.'),
  subj('Differentiate between a Hard Disk Drive (HDD) and a Solid State Drive (SSD) based on speed, moving parts, and durability.', 10, 'Consider how data is written and read physically versus electronically.'),
  subj('Describe what "Phishing" is. List three warning signs you should look out for to identify a phishing email.', 10, 'Look for urgency, bad grammar, and suspicious links.'),
  subj('Explain the purpose of Microsoft Excel. Give three examples of how a school teacher could use Excel to manage their class.', 10, 'Think about grades, attendance, and calculations.'),
  subj('What is Plagiarism? Suggest three ways a student can avoid plagiarizing when doing internet research for a school project.', 10, 'Consider citations, paraphrasing, and referencing sources.'),
];

function buildExam() {
  return {
    title: 'Basic 6 Computing / ICT — WAEC Mock Exam 3',
    description: 'Advanced Mock Exam (Level 3) focusing on Productivity Software, Hardware, OS, Social Media, Email, and Digital Literacy.',
    duration_minutes: 90,
    is_published: true,
    school_id: null,
    shuffle_questions: false,
    content: {
      exam_type: 'waec',
      class_level: 'Basic 6',
      subject_name: 'ICT',
      sections: [
        {
          name: 'Section A',
          type: 'objective',
          instructions: 'Answer ALL 40 questions. Each question carries 1 mark. Choose the BEST answer from options A, B, C and D.',
          questions: objQ.map((q, i) => ({ id: q.id, number: i+1, text: q.text, options: q.options.sort(() => Math.random() - 0.5), correctAnswer: q.correctAnswer, difficulty: q.difficulty }))
        },
        {
          name: 'Section B',
          type: 'subjective',
          instructions: `Answer 5 out of the ${subjQ.length} questions. Show all working where applicable. Each question carries equal marks.`,
          required: 5,
          questions: subjQ.map((q, i) => ({ id: q.id, number: i+1, text: q.text, marks: q.marks, hint: q.hint || '' }))
        }
      ]
    }
  };
}

async function run() {
  console.log('🎓 Seeding Advanced ICT Mock Exam 3...');
  const exam = buildExam();
  
  process.stdout.write(`📝 ${exam.title}... `);
  const { error } = await supabase.from('global_quizzes').insert(exam);
  if (error) {
    console.log(`❌ ${error.message}`);
  } else {
    const sA = exam.content.sections[0].questions.length;
    const sB = exam.content.sections[1].questions.length;
    console.log(`✅ Sec A: ${sA} obj, Sec B: ${sB} subj (pick 5)`);
    console.log('\n🎉 Successfully seeded Mock Exam 3 for Basic 6 ICT!');
  }
}

run();
