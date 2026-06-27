// seed_waec_basic6_complex.mjs
// 1 Complex & Tricky WAEC-style Computing Mock Exam for Basic 6
// 40 objectives + 10 subjectives (pick 5)

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jltlnzjqhzsqpmhcpczl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsdGxuempxaHpzcXBtaGNwY3psIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM2ODEwMSwiZXhwIjoyMDg4OTQ0MTAxfQ.oVDVXnC2LO49sYfc_dxxJStrW0VGH5sUvkUB64vXqzo';

const supabase = createClient(supabaseUrl, supabaseKey, { auth: { autoRefreshToken: false, persistSession: false } });

let _qid = 0;
const qid = () => `b6comp_adv_q${++_qid}_${Math.random().toString(36).slice(2, 7)}`;
const obj = (text, options, correctAnswer, diff = 'hard') => ({ id: qid(), type: 'objective', text, options, correctAnswer, diff });
const subj = (text, marks = 20, hint = '') => ({ id: qid(), type: 'subjective', text, marks, hint });

// ═════════════════════════════════════════════════════════════════════
// EXAM: Basic 6 Computing (Complex & Tricky)
// ═════════════════════════════════════════════════════════════════════
const B6_COMP_ADV_OBJ = [
  obj('If your computer suddenly turns off during a thunderstorm, which device could have prevented data loss?', ['Surge Protector', 'Uninterruptible Power Supply (UPS)', 'Power Supply Unit (PSU)', 'Antivirus'], 'Uninterruptible Power Supply (UPS)'),
  obj('Which key combination allows you to permanently delete a file without sending it to the Recycle Bin?', ['Alt + Delete', 'Ctrl + Delete', 'Shift + Delete', 'Tab + Delete'], 'Shift + Delete'),
  obj('What does the "Caps Lock" key do differently from the "Shift" key?', ['Caps Lock makes all letters lowercase, Shift makes them uppercase', 'Caps Lock works as a toggle for all letters; Shift must be held down', 'Caps Lock types numbers, Shift types letters', 'There is no difference'], 'Caps Lock works as a toggle for all letters; Shift must be held down'),
  obj('Which of the following describes a "Cold Boot"?', ['Restarting the computer using the Ctrl+Alt+Del keys', 'Starting the computer when power is initially turned on', 'Using a computer in a cold room', 'Booting the computer from a USB drive'], 'Starting the computer when power is initially turned on'),
  obj('If a file name is "assignment.docx", the ".docx" part is called the:', ['File Header', 'File Extension', 'File Path', 'File Tag'], 'File Extension'),
  obj('What is the function of the "Num Lock" key?', ['It locks the entire keyboard', 'It toggles the numeric keypad between typing numbers and navigation functions', 'It types Roman numerals', 'It prevents numbers from being typed'], 'It toggles the numeric keypad between typing numbers and navigation functions'),
  obj('In MS Word, if you select a word and press Ctrl + U, then Ctrl + I, what happens?', ['The word is undone and indented', 'The word becomes underlined and italicized', 'The word is capitalized', 'The word is deleted'], 'The word becomes underlined and italicized'),
  obj('Which of the following statements about a "Strong Password" is FALSE?', ['It should contain at least 8 characters', 'It should include numbers and symbols', 'It should be easy for your friends to guess so they can help you remember', 'It should mix uppercase and lowercase letters'], 'It should be easy for your friends to guess so they can help you remember'),
  obj('If your mouse stops working completely, which key can you press to open the Start Menu?', ['The Spacebar', 'The Windows Key', 'The Alt Key', 'The Tab Key'], 'The Windows Key'),
  obj('Which unit of measurement is the SMALLEST?', ['Kilobyte (KB)', 'Megabyte (MB)', 'Byte', 'Bit'], 'Bit'),
  obj('When an email is sent, the term "Spam" refers to:', ['A type of canned meat', 'Important messages from school', 'Unsolicited, bulk junk emails often containing advertisements or scams', 'Emails with attachments'], 'Unsolicited, bulk junk emails often containing advertisements or scams'),
  obj('What does the shortcut Ctrl + Z do?', ['Redo the last action', 'Undo the last action', 'Save the file', 'Close the active window'], 'Undo the last action'),
  obj('Which combination of keys opens the Task Manager to close a frozen program?', ['Ctrl + Alt + Delete', 'Ctrl + Shift + Esc', 'Both A and B can be used', 'Alt + F4'], 'Both A and B can be used'),
  obj('A scanner is an input device, but a barcode reader is a:', ['Storage device', 'Processing device', 'Input device', 'Output device'], 'Input device'),
  obj('If you type "cat" in MS Word, highlight it, and press Ctrl + X, what happens?', ['"cat" is copied and stays on screen', '"cat" is deleted and lost forever', '"cat" is removed from the screen and placed on the Clipboard', '"cat" becomes capitalized'], '"cat" is removed from the screen and placed on the Clipboard'),
  obj('The term "Browser History" refers to:', ['A book about the history of computers', 'A list of websites that have been visited recently on that browser', 'The process of deleting files', 'A type of computer virus'], 'A list of websites that have been visited recently on that browser'),
  obj('Which of these is NOT a function of an Operating System?', ['Managing files and folders', 'Controlling hardware devices', 'Creating a 3D animation video', 'Providing a user interface'], 'Creating a 3D animation video'),
  obj('What is "Phishing"?', ['Playing a fishing game on the computer', 'A trick used by cybercriminals to steal your passwords via fake emails/sites', 'Connecting two computers with a cable', 'Searching for a file using the search bar'], 'A trick used by cybercriminals to steal your passwords via fake emails/sites'),
  obj('In the context of the internet, what is a "Search Query"?', ['A question you ask your teacher', 'A virus that deletes your search history', 'The specific words or phrase you type into a search engine to find information', 'A button on the keyboard'], 'The specific words or phrase you type into a search engine to find information'),
  obj('Which tool in MS Paint can pick a specific color from your drawing so you can use it again?', ['The Eraser', 'The Color Picker (Eyedropper)', 'The Pencil', 'The Magnifier'], 'The Color Picker (Eyedropper)'),
  obj('If you press the "Print Screen" (PrtScn) key, what happens?', ['The printer immediately prints the document', 'A picture of your current screen is copied to the Clipboard', 'The screen turns off', 'It opens the print dialog box'], 'A picture of your current screen is copied to the Clipboard'),
  obj('What is the difference between CC and BCC in an email?', ['CC is for pictures, BCC is for text', 'CC hides the recipients\' email addresses, BCC shows them to everyone', 'CC shows the recipients\' email addresses to everyone, BCC hides them', 'There is no difference'], 'CC shows the recipients\' email addresses to everyone, BCC hides them'),
  obj('Which of the following is considered "Volatile" memory?', ['Hard Disk Drive', 'ROM (Read Only Memory)', 'Pen Drive', 'RAM (Random Access Memory)'], 'RAM (Random Access Memory)'),
  obj('When you hover the mouse pointer over a hyperlink, the pointer usually changes to:', ['An hourglass', 'A small pointing hand', 'A crosshair', 'A double arrow'], 'A small pointing hand'),
  obj('What is the function of a Firewall?', ['To burn CDs and DVDs', 'To protect the computer from catching real fire', 'To monitor and block unauthorized network traffic', 'To speed up the internet connection'], 'To monitor and block unauthorized network traffic'),
  obj('Which of the following statements about a Desktop computer is TRUE?', ['It runs on an internal battery like a laptop', 'It is easily portable in a backpack', 'It requires external power and has separate components (monitor, keyboard, system unit)', 'It does not use an Operating System'], 'It requires external power and has separate components (monitor, keyboard, system unit)'),
  obj('To jump to the very end of a document in MS Word, which key combination should you press?', ['End', 'Ctrl + End', 'Page Down', 'Shift + End'], 'Ctrl + End'),
  obj('The "Domain Name" in the URL "www.ghanaschools.edu.gh" is:', ['www', 'ghanaschools.edu.gh', 'http', 'edu'], 'ghanaschools.edu.gh'),
  obj('What does the term "Download" strictly mean?', ['To type a document fast', 'To send an email to a friend', 'To copy data from a remote computer/server to your local computer', 'To copy data from your pen drive to your hard disk'], 'To copy data from a remote computer/server to your local computer'),
  obj('Which device converts digital signals into analog signals to transmit data over telephone lines?', ['CPU', 'Motherboard', 'Modem', 'Scanner'], 'Modem'),
  obj('What is the primary purpose of the "Recycle Bin"?', ['To store games', 'To hold deleted files temporarily so they can be restored if needed', 'To permanently destroy viruses', 'To save space on the hard drive immediately'], 'To hold deleted files temporarily so they can be restored if needed'),
  obj('If you double-click the Title Bar of an open window, what usually happens?', ['The window closes', 'The window maximizes or restores down', 'The window minimizes to the taskbar', 'The computer shuts down'], 'The window maximizes or restores down'),
  obj('Which component of the computer is responsible for doing all the arithmetic and logical operations?', ['The RAM', 'The ALU (part of the CPU)', 'The ROM', 'The Hard Disk'], 'The ALU (part of the CPU)'),
  obj('What is "Software Piracy"?', ['Playing pirate-themed games', 'The unauthorized copying, distribution, or use of copyrighted software', 'A virus that steals data', 'Downloading free software legally'], 'The unauthorized copying, distribution, or use of copyrighted software'),
  obj('Which of these is the correct ascending order of storage capacities?', ['Bit, Byte, Megabyte, Kilobyte, Gigabyte', 'Byte, Bit, Kilobyte, Megabyte, Gigabyte', 'Bit, Byte, Kilobyte, Megabyte, Gigabyte', 'Gigabyte, Megabyte, Kilobyte, Byte, Bit'], 'Bit, Byte, Kilobyte, Megabyte, Gigabyte'),
  obj('In word processing, what is "Alignment"?', ['Changing the font type', 'The positioning of text along the left, center, right, or both margins', 'Checking the spelling', 'Printing the document'], 'The positioning of text along the left, center, right, or both margins'),
  obj('What does the acronym USB stand for?', ['Universal Serial Bus', 'Unified System Board', 'Universal System Block', 'United States Broadcaster'], 'Universal Serial Bus'),
  obj('If a friend sends you an email with an attachment ending in ".exe" that you were not expecting, what is the SAFEST action?', ['Open it immediately', 'Forward it to all your friends', 'Do not open it and ask the friend if they meant to send it, as it could be malware', 'Reply with an angry message'], 'Do not open it and ask the friend if they meant to send it, as it could be malware'),
  obj('Which is an example of an Optical Storage medium?', ['Pen Drive', 'Hard Disk Drive', 'DVD', 'Magnetic Tape'], 'DVD'),
  obj('The main difference between a Search Engine and a Web Browser is:', ['A Search Engine is a software installed on your PC; a Web Browser is a website', 'A Web Browser (like Chrome) is the software used to view websites; a Search Engine (like Google) is a website used to search for information', 'There is no difference', 'A Search Engine requires a password, a Web Browser does not'], 'A Web Browser (like Chrome) is the software used to view websites; a Search Engine (like Google) is a website used to search for information'),
];

const B6_COMP_ADV_SUBJ = [
  subj('(a) Differentiate between "Cold Booting" and "Warm Booting".\n(b) Give ONE scenario where you would use a Warm Boot instead of a Cold Boot.\n(c) Explain what an Uninterruptible Power Supply (UPS) does.', 20, 'Cold = from off state. Warm = restarting via software/Ctrl+Alt+Del. UPS gives backup power during outages.'),
  subj('(a) You are typing an essay and your computer screen suddenly freezes. List THREE troubleshooting steps you would take before turning off the main power.\n(b) Explain the difference between minimizing a window and closing a window.', 20, 'Steps: Wait, try Ctrl+Alt+Del, check mouse/keyboard connections. Minimize hides it, close stops the program.'),
  subj('(a) What is a Computer Virus?\n(b) Give THREE signs that a computer might be infected with a virus.\n(c) State TWO ways a virus can be spread from one computer to another.', 20, 'Signs: slow performance, pop-ups, missing files. Spread: infected USBs, malicious emails/downloads.'),
  subj('(a) Explain the function of the "Clipboard" in computer operations.\n(b) Distinguish between the commands "Copy & Paste" and "Cut & Paste".\n(c) Write down the keyboard shortcuts for Cut, Copy, Paste, and Select All.', 20, 'Clipboard holds data temporarily. Copy leaves original, Cut removes original. Shortcuts: Ctrl+X, C, V, A.'),
  subj('(a) Define the term "Phishing".\n(b) Read this scenario: You receive an email claiming to be from your bank asking you to click a link and enter your password. State THREE clues that might show this email is a fake (phishing) email.\n(c) What should you do with such an email?', 20, 'Clues: urgent tone, generic greeting, misspelled words, suspicious sender address. Do not click, delete it.'),
  subj('(a) What is the difference between a Web Browser and a Search Engine? Give ONE example of each.\n(b) Explain the parts of the URL: http://www.example.com\n(c) What does the "s" in "https" stand for, and why is it important?', 20, 'Browser views sites (Chrome), Search engine finds sites (Google). "s" stands for secure (encrypted).'),
  subj('(a) Distinguish between Primary Storage and Secondary Storage.\n(b) Why is RAM referred to as "Volatile" memory?\n(c) Arrange the following storage capacities in ascending order (smallest to largest): 1 Terabyte, 100 Bytes, 5 Gigabytes, 500 Megabytes, 20 Kilobytes.', 20, 'Primary is inside (RAM), Secondary is external/long-term (HDD). Volatile means it loses data without power. Order: Bytes, KB, MB, GB, TB.'),
  subj('(a) Explain the term "Digital Citizenship".\n(b) List THREE responsibilities of a good digital citizen.\n(c) What is "Plagiarism" and why is it considered an unethical practice?', 20, 'Digital Citizenship is acting responsibly online. Plagiarism is stealing work without credit.'),
  subj('(a) Identify the use of the following specialized keys:\n    (i) Print Screen (PrtScn)\n    (ii) Escape (Esc)\n    (iii) Shift\n    (iv) Num Lock\n(b) Explain the difference between using the Backspace key and the Delete key.', 20, 'PrtScn copies screen. Esc cancels. Backspace deletes left, Delete deletes right.'),
  subj('(a) What is Software Piracy?\n(b) Explain the difference between "Open Source Software" and "Proprietary (Commercial) Software".\n(c) Give ONE example of an Operating System that is Open Source.', 20, 'Piracy is illegal copying. Open Source is free to modify. Proprietary is owned and usually paid for. Example: Linux.'),
];

// ═════════════════════════════════════════════════════════════════════
// Builder
// ═════════════════════════════════════════════════════════════════════
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
          name: 'Section A',
          type: 'objective',
          instructions: 'Answer ALL 40 questions. Each question carries 1 mark. Choose the BEST answer from options A, B, C and D.',
          questions: objQ.map((q, i) => ({ id: q.id, number: i + 1, text: q.text, options: q.options, correctAnswer: q.correctAnswer, difficulty: q.diff }))
        },
        {
          name: 'Section B',
          type: 'subjective',
          instructions: `Answer ANY 5 out of the ${subjQ.length} questions in this section. Each question carries 20 marks.`,
          required: 5,
          questions: subjQ.map((q, i) => ({ id: q.id, number: i + 1, text: q.text, marks: q.marks, hint: q.hint || '' }))
        }
      ]
    }
  };
}

async function run() {
  console.log('🎓 Seeding Advanced/Complex Basic 6 Computing WAEC-style exam...\n');
  
  // Find Basic 6 Computing Subject
  const { data: subjects, error: subErr } = await supabase
    .from('subjects')
    .select('id, name')
    .ilike('name', 'G6%Computing%');

  if (subErr) {
    console.error('❌ Error fetching subjects:', subErr.message);
    return;
  }

  const computingSub = subjects && subjects.length > 0 ? subjects[0] : null;
  const subjectId = computingSub ? computingSub.id : null;

  if (!subjectId) {
    console.log('⚠️ Could not find a specific "G6 Computing" subject. Will assign a generic subject or null.');
  } else {
    console.log(`✅ Found subject: ${computingSub.name}`);
  }

  const advancedExam = buildExam({
    title: 'Basic 6 Computing — Masterclass Mock Exam (Advanced)',
    desc: 'An advanced, tricky WAEC-style Mock Exam for Basic 6. Designed to test critical thinking, troubleshooting, deep internet concepts, and shortcut mastery. 40 objectives + 10 subjective questions (answer 5).',
    classLevel: 'Basic 6', subjectName: 'Computing', mins: 120, objQ: B6_COMP_ADV_OBJ, subjQ: B6_COMP_ADV_SUBJ
  });

  process.stdout.write(`📝 ${advancedExam.title}... `);
  advancedExam.subject_id = subjectId;

  const { error } = await supabase.from('global_quizzes').insert(advancedExam);
  if (error) {
    console.log(`❌ ${error.message}`);
  } else {
    const sA = advancedExam.content.sections[0].questions.length;
    const sB = advancedExam.content.sections[1].questions.length;
    console.log(`✅  Section A: ${sA} objs | Section B: ${sB} subjs`);
  }
  console.log('\n🎉 Done! The complex Basic 6 Computing WAEC exam is live on the hub.');
}

run();
