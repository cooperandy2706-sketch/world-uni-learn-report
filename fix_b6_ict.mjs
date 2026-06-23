import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Format: [Question, CorrectAnswer, Wrong1, Wrong2, Wrong3]
const rawMock1 = [
  ['The physical parts of a computer are called:', 'Hardware', 'Software', 'Data', 'Malware'],
  ['Which of the following is an input device?', 'Keyboard', 'Monitor', 'Printer', 'Speaker'],
  ['Which component is considered the brain of the computer?', 'CPU', 'RAM', 'Hard Drive', 'Motherboard'],
  ['What does RAM stand for?', 'Random Access Memory', 'Read Access Memory', 'Run All Memory', 'Real Active Memory'],
  ['Which of these is a pointing device?', 'Mouse', 'Keyboard', 'Scanner', 'Microphone'],
  ['The primary function of a printer is to produce:', 'Hard copy', 'Soft copy', 'Digital copy', 'Audio copy'],
  ['Which of the following is an output device?', 'Monitor', 'Mouse', 'Keyboard', 'Scanner'],
  ['What does ROM stand for?', 'Read Only Memory', 'Random Only Memory', 'Run On Memory', 'Read Out Memory'],
  ['Which device is used to enter text into a computer?', 'Keyboard', 'Mouse', 'Printer', 'Speaker'],
  ['A scanner is used to:', 'Digitize physical documents', 'Print documents', 'Play music', 'Type text'],
  ['Which of the following is not a storage device?', 'Monitor', 'Hard Disk', 'Flash Drive', 'CD-ROM'],
  ['What is the function of the motherboard?', 'Connects all computer components', 'Displays images', 'Prints documents', 'Stores permanent data'],
  ['Which shortcut key is used to save a document?', 'Ctrl + S', 'Ctrl + C', 'Ctrl + P', 'Ctrl + V'],
  ['Which shortcut key is used to copy text?', 'Ctrl + C', 'Ctrl + S', 'Ctrl + P', 'Ctrl + V'],
  ['What does "GUI" stand for?', 'Graphical User Interface', 'General Utility Interface', 'Graphic Union Interface', 'Gaming User Interface'],
  ['Which software is used for word processing?', 'Microsoft Word', 'Microsoft Excel', 'Microsoft Paint', 'Corel Draw'],
  ['Which of these is not an operating system?', 'Microsoft Word', 'Windows', 'Linux', 'macOS'],
  ['To turn on a computer, you press the:', 'Power button', 'Enter key', 'Shift key', 'Spacebar'],
  ['A computer virus is a type of:', 'Software', 'Hardware', 'Input device', 'Network'],
  ['Which tool is used to browse the internet?', 'Web browser', 'Word processor', 'Spreadsheet', 'Media player'],
  ['What is a flash drive used for?', 'Storing data', 'Displaying video', 'Typing text', 'Printing'],
  ['The background area on a computer screen is called the:', 'Desktop', 'Window', 'Taskbar', 'Icon'],
  ['Which of the following is used to click and select items?', 'Mouse', 'Printer', 'Speaker', 'Monitor'],
  ['In typing, what does the Caps Lock key do?', 'Types in capital letters', 'Deletes text', 'Saves the document', 'Moves the cursor down'],
  ['Which key is used to erase the character to the left of the cursor?', 'Backspace', 'Delete', 'Enter', 'Spacebar'],
  ['The small pictures on the desktop are called:', 'Icons', 'Windows', 'Buttons', 'Pointers'],
  ['What does WWW stand for?', 'World Wide Web', 'World Web Wide', 'Wide World Web', 'Web World Wide'],
  ['Which application is best for drawing?', 'Microsoft Paint', 'Notepad', 'Excel', 'Calculator'],
  ['What is the longest key on the keyboard?', 'Spacebar', 'Enter', 'Shift', 'Backspace'],
  ['To close a window, you click the button with an:', 'X', 'O', 'Square', 'Line'],
  ['Which device outputs sound from the computer?', 'Speaker', 'Scanner', 'Mouse', 'Keyboard'],
  ['What is the blinking line on the screen that shows where you will type?', 'Cursor', 'Pointer', 'Icon', 'Button'],
  ['Which of the following is a search engine?', 'Google', 'Microsoft Word', 'Windows', 'Paint'],
  ['A network of computers covering a small area like a school is a:', 'LAN', 'WAN', 'MAN', 'PAN'],
  ['What is used to protect a computer from viruses?', 'Antivirus software', 'Word processor', 'Web browser', 'Games'],
  ['Which part of the computer contains the letters and numbers?', 'Keyboard', 'Mouse', 'Monitor', 'CPU'],
  ['To select all text in a document, you use:', 'Ctrl + A', 'Ctrl + C', 'Ctrl + V', 'Ctrl + X'],
  ['Which of these is a portable computer?', 'Laptop', 'Desktop', 'Server', 'Mainframe'],
  ['What is the standard unit of measuring computer memory?', 'Byte', 'Hertz', 'Watt', 'Pixel'],
  ['Which of these is used to take a picture on a computer?', 'Webcam', 'Mouse', 'Printer', 'Speaker']
];

const rawMock2 = [
  ['Which software is used for creating presentations?', 'Microsoft PowerPoint', 'Microsoft Word', 'Microsoft Excel', 'Notepad'],
  ['Which of the following helps to keep a computer cool?', 'Cooling Fan', 'Mouse', 'Keyboard', 'Monitor'],
  ['A device that reads data from a CD is a:', 'CD/DVD Drive', 'Hard Disk', 'Flash Drive', 'Floppy Drive'],
  ['Which of these is an example of an Operating System?', 'Windows 10', 'Microsoft Word', 'Google Chrome', 'VLC Player'],
  ['What is the full meaning of CPU?', 'Central Processing Unit', 'Computer Personal Unit', 'Central Print Unit', 'Control Processing Unit'],
  ['The process of starting up a computer is called:', 'Booting', 'Running', 'Starting', 'Loading'],
  ['Which of these devices provides backup power to a computer?', 'UPS', 'CPU', 'RAM', 'ROM'],
  ['To organize files, you put them into:', 'Folders', 'Documents', 'Icons', 'Trash'],
  ['Which action opens a file or program?', 'Double-click', 'Single-click', 'Right-click', 'Scroll'],
  ['The bar at the bottom of the Windows desktop is the:', 'Taskbar', 'Title bar', 'Menu bar', 'Scroll bar'],
  ['What does a microphone do?', 'Inputs sound', 'Outputs sound', 'Prints text', 'Displays images'],
  ['Which device connects a computer to the internet?', 'Modem/Router', 'Printer', 'Scanner', 'Speaker'],
  ['A program used to view web pages is called a:', 'Browser', 'Spreadsheet', 'Database', 'Word Processor'],
  ['What is an email?', 'Electronic mail', 'Electric mail', 'Emergency mail', 'Easy mail'],
  ['Which shortcut key is used to paste copied text?', 'Ctrl + V', 'Ctrl + P', 'Ctrl + C', 'Ctrl + X'],
  ['To permanently delete a file, it goes to the:', 'Recycle Bin', 'My Documents', 'Desktop', 'Control Panel'],
  ['Which of these is a spreadsheet program?', 'Microsoft Excel', 'Microsoft Word', 'Microsoft Paint', 'Microsoft Access'],
  ['The intersection of a row and a column in Excel is called a:', 'Cell', 'Box', 'Square', 'Line'],
  ['Which of these is used to play video games?', 'Joystick', 'Scanner', 'Printer', 'Webcam'],
  ['To move a file from one place to another, you use:', 'Cut and Paste', 'Copy and Paste', 'Delete and Paste', 'Save and Paste'],
  ['Which key gives a space between words?', 'Spacebar', 'Enter', 'Shift', 'Alt'],
  ['What does a projector do?', 'Displays screen on a large surface', 'Prints documents', 'Scans images', 'Plays loud music'],
  ['An example of application software is:', 'Microsoft Word', 'Windows 10', 'Linux', 'macOS'],
  ['What is the brain of the computer?', 'CPU', 'Monitor', 'Keyboard', 'Mouse'],
  ['What is the primary storage of a computer?', 'RAM', 'Hard Disk', 'Flash Drive', 'CD'],
  ['Which key starts a new line or paragraph?', 'Enter', 'Spacebar', 'Shift', 'Ctrl'],
  ['Which of these is not a web browser?', 'Microsoft Word', 'Google Chrome', 'Mozilla Firefox', 'Safari'],
  ['What is the name of the arrow you move with the mouse?', 'Pointer', 'Cursor', 'Line', 'Icon'],
  ['Which of the following is a computer brand?', 'HP', 'Toyota', 'Samsung TV', 'Nike'],
  ['Data entered into a computer is called:', 'Input', 'Output', 'Process', 'Storage'],
  ['Information that comes out of a computer is called:', 'Output', 'Input', 'Data', 'Process'],
  ['Which device is best for typing numbers quickly?', 'Numeric Keypad', 'Mouse', 'Monitor', 'Scanner'],
  ['What does a digital camera do?', 'Takes digital photos', 'Prints photos', 'Edits videos', 'Plays music'],
  ['A group of 8 bits is called a:', 'Byte', 'Nibble', 'Kilobyte', 'Megabyte'],
  ['Which of these protects your computer from unauthorized network access?', 'Firewall', 'Mousepad', 'Screen guard', 'Keyboard cover'],
  ['Which part of the computer holds the motherboard?', 'System Unit / Case', 'Monitor', 'Keyboard', 'Printer'],
  ['Which is a common type of computer port?', 'USB', 'UFO', 'USN', 'UPS'],
  ['What does PDF stand for?', 'Portable Document Format', 'Print Document File', 'Public Data Format', 'Personal Document Folder'],
  ['Which software is used for sending and receiving emails?', 'Microsoft Outlook', 'Microsoft Paint', 'Calculator', 'Notepad'],
  ['To restart a frozen computer, you can press:', 'Ctrl + Alt + Delete', 'Ctrl + C', 'Shift + Enter', 'Alt + F4']
];

function buildObjQ(rawArray) {
  return rawArray.map((item, idx) => {
    const [text, correct, w1, w2, w3] = item;
    // Shuffle options
    const options = [correct, w1, w2, w3].sort(() => Math.random() - 0.5);
    return {
      id: `q_ict_${Date.now()}_${idx}`,
      number: idx + 1,
      text: text,
      options: options,
      correctAnswer: correct,
      difficulty: 'medium'
    };
  });
}

async function fixICTExams() {
  console.log('Fetching Basic 6 ICT Exams...');
  
  const { data: exams, error } = await supabase
    .from('global_quizzes')
    .select('*')
    .eq('content->>class_level', 'Basic 6')
    .eq('content->>subject_name', 'ICT');
    
  if (error) {
    console.error('Error fetching exams:', error);
    return;
  }
  
  if (!exams || exams.length === 0) {
    console.log('No Basic 6 ICT exams found.');
    return;
  }

  // Sort exams by title to ensure we update Mock 1 and Mock 2 consistently
  exams.sort((a, b) => a.title.localeCompare(b.title));
  
  const mock1Questions = buildObjQ(rawMock1);
  const mock2Questions = buildObjQ(rawMock2);
  
  for (let i = 0; i < exams.length; i++) {
    const exam = exams[i];
    console.log(`\nFixing: ${exam.title}`);
    
    const newContent = { ...exam.content };
    
    // Replace Section A questions
    if (newContent.sections && newContent.sections[0]) {
      newContent.sections[0].questions = i === 0 ? mock1Questions : mock2Questions;
    }
    
    const { error: updateError } = await supabase
      .from('global_quizzes')
      .update({ content: newContent })
      .eq('id', exam.id);
      
    if (updateError) {
      console.error(`Failed to update ${exam.title}:`, updateError);
    } else {
      console.log(`✅ Successfully updated ${exam.title} with 40 real ICT questions.`);
    }
  }
  
  console.log('\n🎉 Finished updating ICT exams!');
}

fixICTExams();
