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

const obj = (text, options, correctAnswer, diff = 'medium') => ({
  id: qid(), type: 'objective', text, options, correctAnswer, difficulty: diff
});

const subj = (text, marks = 10, hint = '') => ({
  id: qid(), type: 'subjective', text, marks, hint
});

function buildExam({ title, desc, classLevel, subjectName, mins, objQ, subjQ }) {
  return {
    title,
    description: desc,
    duration_minutes: mins,
    is_published: true,
    school_id: null,
    shuffle_questions: false,
    content: {
      exam_type: 'waec',
      class_level: classLevel,
      subject_name: subjectName,
      sections: [
        {
          name: 'Section A (Objective Test)',
          type: 'objective',
          instructions: `Answer ALL ${objQ.length} questions. Each question carries equal marks. Choose the BEST answer from the options provided.`,
          questions: objQ.map((q, i) => ({ id: q.id, number: i+1, text: q.text, options: q.options, correctAnswer: q.correctAnswer, difficulty: q.difficulty }))
        },
        {
          name: 'Section B (Essay/Subjective)',
          type: 'subjective',
          instructions: `Answer any 4 out of the ${subjQ.length} questions. Show all working/reasoning where applicable.`,
          required: 4,
          questions: subjQ.map((q, i) => ({ id: q.id, number: i+1, text: q.text, marks: q.marks, hint: q.hint || '' }))
        }
      ]
    }
  };
}

// -----------------------------------------------------------------------------
// COMPUTING (ICT) - 40 Exact Objective Questions + 5 Subjective
// -----------------------------------------------------------------------------
const ictObj = [
  obj('Which program is best suited for creating a presentation with slides?', ['Microsoft Word', 'Microsoft Excel', 'Microsoft PowerPoint', 'Microsoft Paint'], 'Microsoft PowerPoint', 'easy'),
  obj('What does the acronym URL stand for?', ['Uniform Resource Locator', 'Universal Routing Link', 'Unified Resource Line', 'Uniform Reading Link'], 'Uniform Resource Locator', 'hard'),
  obj('To combine two or more cells in a Word table into a single cell, you use:', ['Split Cells', 'Merge Cells', 'Delete Cells', 'Insert Cells'], 'Merge Cells', 'medium'),
  obj('Which of the following is considered a strong password?', ['password123', 'admin', 'MyDog1!', 'P@ssw0rd_89'], 'P@ssw0rd_89', 'medium'),
  obj('What is the function of the "Bcc" field in an email?', ['To send a blind carbon copy', 'To bold the text', 'To block a contact', 'To bounce the email'], 'To send a blind carbon copy', 'medium'),
  obj('A software program that secretly monitors your computer activity is called:', ['Antivirus', 'Spyware', 'Word processor', 'Operating System'], 'Spyware', 'medium'),
  obj('The shortcut key combination to Undo an action is:', ['Ctrl + Z', 'Ctrl + Y', 'Ctrl + C', 'Ctrl + V'], 'Ctrl + Z', 'easy'),
  obj('Which of the following is a web browser?', ['Google Search', 'Windows 10', 'Mozilla Firefox', 'Microsoft Office'], 'Mozilla Firefox', 'easy'),
  obj('What is cyberbullying?', ['Buying items online', 'Using the internet to harm or harass others', 'Playing online games', 'Learning online'], 'Using the internet to harm or harass others', 'easy'),
  obj('To add a new row to the bottom of a table in Word, you can press:', ['Enter', 'Tab (in the last cell)', 'Spacebar', 'Shift'], 'Tab (in the last cell)', 'hard'),
  obj('What does "HTTP" stand for?', ['HyperText Transfer Protocol', 'HyperText Translation Process', 'High Transfer Text Protocol', 'Hyper Test Transfer Protocol'], 'HyperText Transfer Protocol', 'medium'),
  obj('Which of these is an output device?', ['Mouse', 'Keyboard', 'Microphone', 'Printer'], 'Printer', 'easy'),
  obj('In Microsoft Word, what feature allows you to check for spelling errors?', ['Spell Check', 'Grammar Check', 'AutoCorrect', 'Thesaurus'], 'Spell Check', 'easy'),
  obj('Which of the following is NOT a search engine?', ['Google', 'Bing', 'Yahoo', 'Microsoft Excel'], 'Microsoft Excel', 'easy'),
  obj('What is the main function of an Operating System?', ['To create documents', 'To manage computer hardware and software resources', 'To browse the internet', 'To play games'], 'To manage computer hardware and software resources', 'hard'),
  obj('The term "phishing" refers to:', ['Catching fish', 'A type of computer virus', 'Fraudulent attempts to obtain sensitive information', 'Fixing a broken website'], 'Fraudulent attempts to obtain sensitive information', 'medium'),
  obj('Which key is used to delete the character to the left of the cursor?', ['Delete', 'Backspace', 'Enter', 'Shift'], 'Backspace', 'easy'),
  obj('What is a "homepage"?', ['A house page on a website', 'The main page of a website', 'A page where you buy homes', 'A blank document'], 'The main page of a website', 'easy'),
  obj('Which of these file extensions is commonly used for an image?', ['.docx', '.xlsx', '.jpeg', '.mp3'], '.jpeg', 'medium'),
  obj('What does "downloading" mean?', ['Sending data to the internet', 'Receiving data from the internet to your computer', 'Turning off the computer', 'Typing a document'], 'Receiving data from the internet to your computer', 'easy'),
  obj('A gigabyte (GB) is equal to approximately how many megabytes (MB)?', ['10', '100', '1000', '10000'], '1000', 'hard'),
  obj('Which part of the computer is considered the "brain"?', ['Monitor', 'Keyboard', 'CPU (Central Processing Unit)', 'Hard Drive'], 'CPU (Central Processing Unit)', 'easy'),
  obj('What does "CC" stand for in an email?', ['Carbon Copy', 'Computer Copy', 'Clear Copy', 'Correct Copy'], 'Carbon Copy', 'medium'),
  obj('Which of the following protects your computer from viruses?', ['A web browser', 'Antivirus software', 'A word processor', 'A spreadsheet'], 'Antivirus software', 'easy'),
  obj('In PowerPoint, a single page of a presentation is called a:', ['Document', 'Slide', 'Sheet', 'Card'], 'Slide', 'easy'),
  obj('What is a computer network?', ['A group of connected computers', 'A single computer', 'A type of software', 'A computer virus'], 'A group of connected computers', 'medium'),
  obj('Which of these is a valid email address format?', ['john.doe@email', 'john.doe@email.com', 'john.doe.email.com', 'www.john.doe.com'], 'john.doe@email.com', 'easy'),
  obj('What does "ISP" stand for?', ['Internet Service Provider', 'Internal System Program', 'Internet Standard Protocol', 'Internal Server Provider'], 'Internet Service Provider', 'hard'),
  obj('Which keyboard shortcut is used to Copy text?', ['Ctrl + C', 'Ctrl + V', 'Ctrl + X', 'Ctrl + P'], 'Ctrl + C', 'easy'),
  obj('What is the physical equipment of a computer called?', ['Software', 'Hardware', 'Data', 'Information'], 'Hardware', 'easy'),
  obj('Which of the following is NOT an operating system?', ['Windows', 'Linux', 'macOS', 'Microsoft Word'], 'Microsoft Word', 'medium'),
  obj('A place where deleted files are temporarily stored is the:', ['Hard Drive', 'Recycle Bin', 'Desktop', 'My Documents'], 'Recycle Bin', 'easy'),
  obj('What is a hyperlink?', ['A very fast computer', 'A link from a hypertext file or document to another location or file', 'A type of printer', 'A strong password'], 'A link from a hypertext file or document to another location or file', 'medium'),
  obj('Which device is used to enter text into a computer?', ['Monitor', 'Printer', 'Keyboard', 'Mouse'], 'Keyboard', 'easy'),
  obj('What does "WWW" stand for?', ['World Wide Web', 'World Web Wide', 'Wide World Web', 'Web World Wide'], 'World Wide Web', 'easy'),
  obj('Which application is used for creating spreadsheets?', ['Microsoft Word', 'Microsoft Excel', 'Microsoft PowerPoint', 'Microsoft Access'], 'Microsoft Excel', 'easy'),
  obj('The background area on your computer screen where icons are placed is called the:', ['Window', 'Desktop', 'Menu', 'Taskbar'], 'Desktop', 'easy'),
  obj('What is the function of the "Save As" command?', ['To save a file with a new name or in a new location', 'To save a file with the same name', 'To delete a file', 'To print a file'], 'To save a file with a new name or in a new location', 'medium'),
  obj('Which of the following is an example of an input device?', ['Scanner', 'Speaker', 'Monitor', 'Projector'], 'Scanner', 'medium'),
  obj('What is the blinking line that indicates where text will be entered called?', ['Pointer', 'Cursor', 'Marker', 'Indicator'], 'Cursor', 'easy')
];

const ictSubj = [
  subj('Explain what a presentation software is used for and list three features found in Microsoft PowerPoint.', 10),
  subj('State four rules for staying safe while using the internet (Internet Safety).', 10),
  subj('Describe the steps required to insert a 3x4 table in Microsoft Word.', 10),
  subj('What is cyberbullying? Provide three examples of cyberbullying behaviors.', 10),
  subj('Differentiate between the "Cc" and "Bcc" fields when sending an email.', 10)
];

const computingExam = buildExam({
  title: 'Basic 6 Computing (ICT) — Complete Exact Questions Challenge',
  desc: 'End of Term Exam focusing on Presentations, Internet Safety, and Word Processing, with 40 unique questions.',
  classLevel: 'Basic 6',
  subjectName: 'Career Technology – Computing',
  mins: 60,
  objQ: ictObj,
  subjQ: ictSubj
});

async function seed() {
  console.log('🎓 Seeding EXACT Basic 6 Term 3 Computing Exam...\n');

  const { data: subjects, error: subjErr } = await supabase.from('subjects').select('id, name');
  if (subjErr) {
    console.error('Error fetching subjects:', subjErr);
    return;
  }

  process.stdout.write(`📝 Inserting: ${computingExam.title}... `);
  
  const baseName = computingExam.content.subject_name;
  const matchedSubject = subjects.find(s => s.name.includes(baseName) && s.name.includes('G6')) 
    || subjects.find(s => s.name.includes(baseName));
    
  if (matchedSubject) {
    computingExam.subject_id = matchedSubject.id;
  }

  const { error } = await supabase.from('global_quizzes').insert(computingExam);
  if (error) {
    console.log(`❌ Error: ${error.message}`);
  } else {
    console.log(`✅ Success! (Sec A: 40 obj, Sec B: 5 subj)`);
  }
}

seed();
