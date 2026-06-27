// seed_waec_basic6_computing.mjs
// 3 WAEC-style Computing Mock Exams for Basic 6
// 40 objectives + 10 subjectives (pick 5)

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jltlnzjqhzsqpmhcpczl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsdGxuempxaHpzcXBtaGNwY3psIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM2ODEwMSwiZXhwIjoyMDg4OTQ0MTAxfQ.oVDVXnC2LO49sYfc_dxxJStrW0VGH5sUvkUB64vXqzo';

const supabase = createClient(supabaseUrl, supabaseKey, { auth: { autoRefreshToken: false, persistSession: false } });

let _qid = 0;
const qid = () => `b6comp_q${++_qid}_${Math.random().toString(36).slice(2, 7)}`;
const obj = (text, options, correctAnswer, diff = 'easy') => ({ id: qid(), type: 'objective', text, options, correctAnswer, diff });
const subj = (text, marks = 20, hint = '') => ({ id: qid(), type: 'subjective', text, marks, hint });

// ═════════════════════════════════════════════════════════════════════
// EXAM 1: Basic 6 Computing (Hardware, Typing, MS Word)
// ═════════════════════════════════════════════════════════════════════
const B6_COMP_1_OBJ = [
  obj('Which of these is an input device?', ['Monitor', 'Printer', 'Mouse', 'Speaker'], 'Mouse'),
  obj('The brain of the computer is the:', ['RAM', 'Monitor', 'Keyboard', 'CPU'], 'CPU'),
  obj('Which device displays pictures and text?', ['Scanner', 'Microphone', 'Monitor', 'Printer'], 'Monitor'),
  obj('To type capital letters, you use the:', ['Spacebar', 'Enter key', 'Caps Lock', 'Delete key'], 'Caps Lock'),
  obj('The physical parts of the computer are called:', ['Software', 'Data', 'Hardware', 'Viruses'], 'Hardware'),
  obj('A mouse typically has how many buttons?', ['One', 'Two', 'Four', 'Ten'], 'Two'),
  obj('Which of the following is NOT a storage device?', ['Keyboard', 'Pen drive', 'Hard disk', 'CD-ROM'], 'Keyboard'),
  obj('A printer is used to produce a:', ['Soft copy', 'Hard copy', 'Digital copy', 'Sound copy'], 'Hard copy'),
  obj('To move down to a new line when typing, you press:', ['Shift', 'Backspace', 'Enter', 'Alt'], 'Enter'),
  obj('What do we use to listen to music from the computer?', ['Microphone', 'Speakers', 'Scanner', 'Printer'], 'Speakers'),
  obj('Which key deletes characters to the left of the cursor?', ['Delete', 'Spacebar', 'Backspace', 'Shift'], 'Backspace'),
  obj('A scanner is used to:', ['Print documents', 'Input pictures into the computer', 'Play music', 'Type letters'], 'Input pictures into the computer'),
  obj('Which software do we use for typing letters?', ['MS Paint', 'MS Word', 'Windows Media Player', 'Google Chrome'], 'MS Word'),
  obj('The longest key on the keyboard is the:', ['Shift key', 'Enter key', 'Spacebar', 'Caps Lock'], 'Spacebar'),
  obj('A computer needs which of these to work?', ['Water', 'Sunlight', 'Electricity', 'Petrol'], 'Electricity'),
  obj('To click an item, which mouse button do you normally use?', ['Left button', 'Right button', 'Middle button', 'Scroll wheel'], 'Left button'),
  obj('Double-clicking means:', ['Pressing the mouse button twice quickly', 'Clicking two different buttons', 'Pressing Enter twice', 'Holding the mouse button down'], 'Pressing the mouse button twice quickly'),
  obj('Which device helps you select items on the screen?', ['Keyboard', 'Mouse', 'Speaker', 'Printer'], 'Mouse'),
  obj('In MS Word, making text thicker and darker is called:', ['Italic', 'Underline', 'Bold', 'Highlight'], 'Bold'),
  obj('To save a document, the shortcut is:', ['Ctrl + C', 'Ctrl + S', 'Ctrl + P', 'Ctrl + V'], 'Ctrl + S'),
  obj('Which of these is a portable computer?', ['Desktop', 'Mainframe', 'Laptop', 'Supercomputer'], 'Laptop'),
  obj('The arrow on the computer screen that moves when you move the mouse is the:', ['Cursor / Pointer', 'Icon', 'Menu', 'Window'], 'Cursor / Pointer'),
  obj('Which tool in MS Word is used to change the text color?', ['Font Color', 'Fill Color', 'Text Highlight', 'Bold'], 'Font Color'),
  obj('When typing, which finger is used to press the Spacebar?', ['Index finger', 'Thumb', 'Pinky finger', 'Middle finger'], 'Thumb'),
  obj('Which key is used to cancel an action?', ['Enter', 'Esc', 'Shift', 'Tab'], 'Esc'),
  obj('A pen drive connects to the computer through a:', ['USB port', 'Audio jack', 'Power socket', 'Monitor port'], 'USB port'),
  obj('In a computer room, you should NOT:', ['Sit properly', 'Eat or drink', 'Keep quiet', 'Ask for help'], 'Eat or drink'),
  obj('Which component protects the internal parts of the computer?', ['System Unit / Casing', 'Monitor', 'Mouse', 'Keyboard'], 'System Unit / Casing'),
  obj('To print a document, the shortcut is:', ['Ctrl + S', 'Ctrl + C', 'Ctrl + P', 'Ctrl + X'], 'Ctrl + P'),
  obj('A CD is round and shiny. CD stands for:', ['Compact Disc', 'Computer Disc', 'Color Disc', 'Copy Disc'], 'Compact Disc'),
  obj('Which software helps you draw shapes and pictures?', ['MS Word', 'MS Excel', 'MS Paint', 'Notepad'], 'MS Paint'),
  obj('The small pictures on the desktop background are called:', ['Folders', 'Windows', 'Icons', 'Cursors'], 'Icons'),
  obj('To select all text in a document, you press:', ['Ctrl + Z', 'Ctrl + A', 'Ctrl + V', 'Ctrl + Y'], 'Ctrl + A'),
  obj('What does "booting" mean?', ['Kicking the computer', 'Starting the computer', 'Closing the computer', 'Moving the computer'], 'Starting the computer'),
  obj('If your computer freezes, what should you do first?', ['Hit the screen', 'Call for a teacher/technician', 'Pour water on it', 'Pull the plug immediately'], 'Call for a teacher/technician'),
  obj('Which of these holds data when the computer is turned off?', ['Hard Disk', 'RAM', 'Monitor', 'CPU'], 'Hard Disk'),
  obj('The main screen you see after the computer turns on is the:', ['Taskbar', 'Desktop', 'Start Menu', 'Screen Saver'], 'Desktop'),
  obj('In MS Word, the blinking line is called the:', ['Insertion point', 'Arrow', 'Box', 'Square'], 'Insertion point'),
  obj('To change the size of your text, you change the:', ['Font Style', 'Font Size', 'Font Color', 'Font Name'], 'Font Size'),
  obj('A keyboard is similar to which old machine?', ['Television', 'Radio', 'Typewriter', 'Telephone'], 'Typewriter'),
];

const B6_COMP_1_SUBJ = [
  subj('(a) Name TWO input devices and TWO output devices.\n(b) Explain briefly what an input device does.', 20, 'Input sends data in, output shows data out.'),
  subj('(a) What is the function of the CPU?\n(b) Write the full meaning of CPU.\n(c) Name the part of the computer that looks like a television.', 20, 'CPU is the brain. Screen is the monitor.'),
  subj('(a) List THREE rules you must obey when using the computer laboratory.\n(b) Why is it dangerous to bring food and water near a computer?', 20, 'No eating, no running, follow instructions. Liquids cause short circuits.'),
  subj('(a) Identify the use of the following keys on a keyboard:\n    (i) Spacebar\n    (ii) Enter key\n    (iii) Backspace key\n    (iv) Caps Lock key', 20, 'Spacebar makes space. Enter goes to next line. Backspace deletes left. Caps Lock makes capital letters.'),
  subj('(a) Outline the steps to turn ON a desktop computer safely.\n(b) Explain what the "Desktop" is.', 20, 'Turn on UPS, System Unit, then Monitor. Desktop is the main screen.'),
  subj('(a) What is Microsoft Word used for?\n(b) State the steps you would take to save a newly typed document for the first time.', 20, 'Used for typing documents. Click File -> Save As.'),
  subj('(a) Differentiate between Hardware and Software.\n(b) Give ONE example of hardware and ONE example of software.', 20, 'Hardware you can touch. Software are programs.'),
  subj('(a) What is a storage device?\n(b) Name THREE storage devices you can use to save your homework.', 20, 'Holds data. Hard disk, pen drive, CD.'),
  subj('(a) Draw a simple mouse and label its THREE main parts (Left button, Right button, Scroll wheel).\n(b) State what the Left button is mostly used for.', 20, 'Left click selects items. Right click shows menu.'),
  subj('Explain the following actions when using a mouse:\n(a) Clicking\n(b) Double-clicking\n(c) Dragging and dropping', 20, 'Click is press once. Double click is press twice fast. Drag is hold and move.'),
];

// ═════════════════════════════════════════════════════════════════════
// EXAM 2: Basic 6 Computing (Internet, Paint, Files & Folders)
// ═════════════════════════════════════════════════════════════════════
const B6_COMP_2_OBJ = [
  obj('A collection of webpages linked together is called a:', ['Folder', 'Website', 'Book', 'File'], 'Website'),
  obj('Which program is used to browse the internet?', ['MS Paint', 'Notepad', 'Google Chrome', 'Calculator'], 'Google Chrome'),
  obj('The global network of computers is known as the:', ['Intranet', 'Internet', 'Local Net', 'Super Net'], 'Internet'),
  obj('WWW stands for:', ['World Wide Web', 'World Web Wide', 'Wide World Web', 'Web Wide World'], 'World Wide Web'),
  obj('Which of these is a search engine?', ['MS Word', 'Google', 'Windows', 'Mouse'], 'Google'),
  obj('A folder is used to:', ['Play music', 'Store and organize files', 'Clean the screen', 'Type letters'], 'Store and organize files'),
  obj('To create a new folder on the desktop, you first:', ['Left-click', 'Double-click', 'Right-click', 'Scroll'], 'Right-click'),
  obj('In MS Paint, which tool is used to fill a shape with color?', ['Pencil tool', 'Eraser tool', 'Fill with color (Bucket) tool', 'Text tool'], 'Fill with color (Bucket) tool'),
  obj('In MS Paint, if you make a mistake, you can use the:', ['Pencil', 'Eraser', 'Brush', 'Line'], 'Eraser'),
  obj('An electronic letter sent over the internet is called:', ['E-mail', 'Voice mail', 'Text message', 'Postcard'], 'E-mail'),
  obj('Which of these shows a safe internet habit?', ['Sharing your password', 'Giving your home address to strangers online', 'Asking a teacher/parent before downloading games', 'Clicking on all pop-up ads'], 'Asking a teacher/parent before downloading games'),
  obj('What does the URL box do in a web browser?', ['Plays videos', 'Takes pictures', 'It is where you type the website address', 'Prints pages'], 'It is where you type the website address'),
  obj('To copy a file, you can press:', ['Ctrl + C', 'Ctrl + V', 'Ctrl + X', 'Ctrl + P'], 'Ctrl + C'),
  obj('To rename a file, you can right-click the file and select:', ['Delete', 'Rename', 'Copy', 'Paste'], 'Rename'),
  obj('The recycle bin is used for:', ['Storing important files', 'Holding deleted files temporarily', 'Playing games', 'Browsing the internet'], 'Holding deleted files temporarily'),
  obj('Which shape tool in MS Paint draws a perfect circle if you hold the Shift key?', ['Rectangle tool', 'Polygon tool', 'Oval tool', 'Line tool'], 'Oval tool'),
  obj('ISP stands for:', ['Internet Service Provider', 'Internal System Program', 'Internet Standard Protocol', 'Internal Service Provider'], 'Internet Service Provider'),
  obj('A file name usually has an extension. What does ".txt" mean?', ['Text file', 'Image file', 'Music file', 'Video file'], 'Text file'),
  obj('Which of these is NOT a web browser?', ['Mozilla Firefox', 'Safari', 'Microsoft Edge', 'Microsoft Word'], 'Microsoft Word'),
  obj('To send an email, you must know the receiver\'s:', ['House address', 'Phone number', 'Email address', 'Age'], 'Email address'),
  obj('What do you use a microphone for on a computer?', ['To listen to music', 'To record your voice', 'To type words', 'To print documents'], 'To record your voice'),
  obj('Which button minimizes a window (hides it to the taskbar)?', ['The X button', 'The - (dash) button', 'The square button', 'The circle button'], 'The - (dash) button'),
  obj('What happens when you click the X button at the top right of a window?', ['It saves the file', 'It minimizes the window', 'It closes the window', 'It prints the file'], 'It closes the window'),
  obj('The bar at the bottom of the Windows desktop is called the:', ['Taskbar', 'Scrollbar', 'Title bar', 'Menu bar'], 'Taskbar'),
  obj('To see the contents of a folder, you should:', ['Right-click it once', 'Left-click it once', 'Double-click it', 'Drag it'], 'Double-click it'),
  obj('Which tool in MS Paint lets you draw freehand like a real pencil?', ['Pencil tool', 'Line tool', 'Shape tool', 'Fill tool'], 'Pencil tool'),
  obj('A secret word used to log into an email account is a:', ['Username', 'Password', 'Address', 'Subject'], 'Password'),
  obj('Which of these animals is NOT associated with computer terms?', ['Mouse', 'Bug', 'Cat', 'Web (Spider)'], 'Cat'),
  obj('To find a specific word on a webpage quickly, you can use:', ['Ctrl + F (Find)', 'Ctrl + P (Print)', 'Ctrl + S (Save)', 'Ctrl + C (Copy)'], 'Ctrl + F (Find)'),
  obj('What is the main page of a website called?', ['Back page', 'Home page', 'First page', 'Start page'], 'Home page'),
  obj('A link on a webpage that takes you to another page is called a:', ['Hyperlink', 'Superlink', 'Fastlink', 'Weblink'], 'Hyperlink'),
  obj('Which of these is a social media website?', ['Wikipedia', 'Google', 'Facebook', 'Microsoft'], 'Facebook'),
  obj('What is a computer virus?', ['A sick computer', 'A bad program that can harm your computer', 'A dusty keyboard', 'A broken screen'], 'A bad program that can harm your computer'),
  obj('Which software protects your computer from viruses?', ['Browser', 'Antivirus', 'Paint', 'Word Processor'], 'Antivirus'),
  obj('When you are done using an email account on a public computer, you must always:', ['Turn off the screen', 'Sign out / Log out', 'Delete all emails', 'Leave it open'], 'Sign out / Log out'),
  obj('In MS Paint, the area where you draw is called the:', ['Canvas / Drawing area', 'Palette', 'Ribbon', 'Taskbar'], 'Canvas / Drawing area'),
  obj('Which of these file extensions is used for pictures?', ['.mp3', '.jpg', '.doc', '.txt'], '.jpg'),
  obj('If you delete a file by mistake, where can you go to restore it?', ['My Documents', 'Recycle Bin', 'Control Panel', 'Taskbar'], 'Recycle Bin'),
  obj('What symbol is always in an email address?', ['#', '&', '@', '*'], '@'),
  obj('Which of these is a search engine?', ['Bing', 'MS Paint', 'Notepad', 'Calculator'], 'Bing'),
];

const B6_COMP_2_SUBJ = [
  subj('(a) What is the Internet?\n(b) State THREE uses of the Internet for a Basic 6 student.\n(c) Name TWO web browsers you know.', 20),
  subj('(a) Explain the difference between a File and a Folder.\n(b) Write down the steps to create a new folder on the Desktop.', 20),
  subj('(a) What is an E-mail?\n(b) List TWO advantages of sending an e-mail over posting a normal letter.\n(c) Identify the parts of this email address: kofi@yahoo.com', 20),
  subj('(a) Name FOUR tools found in the MS Paint toolbox.\n(b) State the function of the "Fill with color" tool (the paint bucket).', 20),
  subj('(a) What is a search engine? Give TWO examples.\n(b) If you want to find information about "Lions" on the internet, explain the steps you would take.', 20),
  subj('(a) What is a computer virus?\n(b) Name TWO ways a computer can get a virus.\n(c) How can you protect your computer from viruses?', 20),
  subj('Write short notes explaining what these buttons do on a computer window:\n(a) Minimize button (-)\n(b) Maximize button (square)\n(c) Close button (X)', 20),
  subj('(a) State THREE internet safety rules you must follow when browsing online.\n(b) Why is it wrong to give your personal information (like your home address) to strangers on the internet?', 20),
  subj('Explain the function of the following in MS Paint:\n(a) Pencil Tool\n(b) Eraser Tool\n(c) Color Palette\n(d) Text Tool (A)', 20),
  subj('(a) What is the Recycle Bin on a computer?\n(b) What happens when you empty the Recycle Bin?\n(c) Can you recover a file after emptying the Recycle Bin?', 20),
];

// ═════════════════════════════════════════════════════════════════════
// EXAM 3: Basic 6 Computing (Information Processing & Everyday Devices)
// ═════════════════════════════════════════════════════════════════════
const B6_COMP_3_OBJ = [
  obj('Data that has been processed into a meaningful form is called:', ['Numbers', 'Information', 'Hardware', 'Alphabet'], 'Information'),
  obj('Which of the following is raw data?', ['A report card', 'A student\'s final grade', 'A list of random numbers', 'A printed receipt'], 'A list of random numbers'),
  obj('The Information Processing Cycle involves: Input -> Process -> Output -> ?', ['Storage', 'Delete', 'Print', 'Play'], 'Storage'),
  obj('Which device is used to process data?', ['Keyboard', 'Monitor', 'CPU', 'Printer'], 'CPU'),
  obj('Which everyday device uses a microprocessor?', ['A wooden chair', 'A smart TV', 'A notebook', 'A bicycle'], 'A smart TV'),
  obj('An ATM is a computer used mainly for:', ['Playing games', 'Banking and withdrawing money', 'Typing letters', 'Taking pictures'], 'Banking and withdrawing money'),
  obj('Which of these devices is used for taking digital photographs?', ['Printer', 'Digital Camera', 'Mouse', 'Keyboard'], 'Digital Camera'),
  obj('A smartwatch is an example of:', ['Desktop computing', 'Wearable computing', 'Mainframe computing', 'Supercomputing'], 'Wearable computing'),
  obj('Which of these is a benefit of using computers in schools?', ['Makes students lazy', 'Helps students research and learn faster', 'Replaces teachers completely', 'Causes eye problems only'], 'Helps students research and learn faster'),
  obj('Which device uses GPS to help you find directions?', ['Toaster', 'Smartphone', 'Printer', 'Mouse'], 'Smartphone'),
  obj('What does POS stand for in a supermarket?', ['Point of Sale', 'Place of Storage', 'Part of System', 'Print on Screen'], 'Point of Sale'),
  obj('Information sent from a computer to a printer goes through a:', ['Power cable', 'USB cable or wireless connection', 'Water pipe', 'Video cable'], 'USB cable or wireless connection'),
  obj('Which part of the computer holds your files permanently even when the computer is off?', ['RAM', 'Hard Drive', 'Processor', 'Monitor'], 'Hard Drive'),
  obj('What kind of software is Microsoft Windows?', ['Word Processor', 'Operating System', 'Game', 'Antivirus'], 'Operating System'),
  obj('Which of these is NOT a good way to care for your computer?', ['Keeping it in a cool, dry place', 'Using a dust cover', 'Eating food over the keyboard', 'Plugging it into a surge protector'], 'Eating food over the keyboard'),
  obj('A tablet computer uses what kind of input mostly?', ['A physical keyboard', 'A mouse', 'A touch screen', 'A joystick'], 'A touch screen'),
  obj('Which component provides power to all parts of a desktop computer?', ['Power Supply Unit (PSU)', 'CPU', 'RAM', 'Hard Drive'], 'Power Supply Unit (PSU)'),
  obj('Which of these devices is both an input and an output device?', ['Mouse', 'Touchscreen', 'Keyboard', 'Printer'], 'Touchscreen'),
  obj('The speed of a CPU is usually measured in:', ['Liters', 'Kilograms', 'Gigahertz (GHz)', 'Meters'], 'Gigahertz (GHz)'),
  obj('When typing, the blinking vertical line is the:', ['Mouse pointer', 'Text cursor', 'Icon', 'Scroll bar'], 'Text cursor'),
  obj('Which key puts a blank space between words?', ['Shift', 'Spacebar', 'Enter', 'Alt'], 'Spacebar'),
  obj('What is a drone?', ['A type of computer virus', 'An unmanned flying vehicle controlled remotely', 'A new web browser', 'A brand of printer'], 'An unmanned flying vehicle controlled remotely'),
  obj('Which of these is a form of electronic payment?', ['Physical cash', 'Cowrie shells', 'Mobile Money (MoMo)', 'Gold coins'], 'Mobile Money (MoMo)'),
  obj('A barcode scanner in a shop is an example of an:', ['Output device', 'Input device', 'Processing device', 'Storage device'], 'Input device'),
  obj('To listen to audio without disturbing others, you should use:', ['Loudspeakers', 'A microphone', 'Headphones / Earphones', 'A webcam'], 'Headphones / Earphones'),
  obj('What is the main advantage of a laptop over a desktop computer?', ['It is larger', 'It is portable and has a battery', 'It uses more electricity', 'It cannot connect to the internet'], 'It is portable and has a battery'),
  obj('Which shortcut is used to "Cut" text?', ['Ctrl + C', 'Ctrl + P', 'Ctrl + X', 'Ctrl + V'], 'Ctrl + X'),
  obj('What does "Undo" do in a computer program?', ['Deletes the whole file', 'Reverses your last action', 'Saves the file', 'Prints the file'], 'Reverses your last action'),
  obj('A gigabyte (GB) is larger than a:', ['Terabyte (TB)', 'Megabyte (MB)', 'Petabyte (PB)', 'Exabyte (EB)'], 'Megabyte (MB)'),
  obj('Which device reads the information on a CD or DVD?', ['Hard Drive', 'Optical Drive (CD/DVD ROM)', 'Floppy Drive', 'Flash Drive'], 'Optical Drive (CD/DVD ROM)'),
  obj('What is the background image of your computer screen called?', ['Wallpaper', 'Paint', 'Theme', 'Icon'], 'Wallpaper'),
  obj('Which part of the keyboard contains the numbers 0-9 arranged like a calculator?', ['Function keys', 'Alphanumeric keys', 'Numeric keypad', 'Navigation keys'], 'Numeric keypad'),
  obj('Which key is used to erase mistakes to the left?', ['Delete', 'Backspace', 'Enter', 'Spacebar'], 'Backspace'),
  obj('Which of these is used for video calling?', ['Printer', 'Scanner', 'Webcam', 'Mouse'], 'Webcam'),
  obj('A computer used mainly for playing advanced video games is called a:', ['Gaming PC / Console', 'Mainframe', 'Server', 'Calculator'], 'Gaming PC / Console'),
  obj('Which software helps you do calculations quickly?', ['MS Word', 'Notepad', 'Calculator application', 'MS Paint'], 'Calculator application'),
  obj('Which of these is an example of digital communication?', ['Writing a letter on paper', 'Sending a WhatsApp message', 'Talking face to face', 'Beating a drum'], 'Sending a WhatsApp message'),
  obj('If a computer is "frozen", it means:', ['It is very cold', 'It is working very fast', 'It has stopped responding to commands', 'It is turned off'], 'It has stopped responding to commands'),
  obj('When you shut down a computer, what happens to the data in the RAM?', ['It is saved forever', 'It is erased/lost', 'It is sent to the printer', 'It is uploaded to the internet'], 'It is erased/lost'),
  obj('ICT has made the world smaller. The world is now referred to as a:', ['Global village', 'Big city', 'Small town', 'Local market'], 'Global village'),
];

const B6_COMP_3_SUBJ = [
  subj('(a) Define the term "Data" and "Information".\n(b) Describe the Information Processing Cycle with its FOUR main stages.', 20),
  subj('(a) State THREE ways computers are used in schools.\n(b) State TWO ways computers are used in hospitals.', 20),
  subj('(a) What is a storage device?\n(b) Name THREE examples of storage devices.\n(c) Why is it important to save your work on a storage device?', 20),
  subj('(a) What is an Operating System?\n(b) Name TWO operating systems you know.\n(c) List TWO functions of an operating system.', 20),
  subj('(a) Identify the use of computers in the following places:\n    (i) Bank (ATM)\n    (ii) Supermarket (POS)\n(b) State TWO advantages of using computers in these places.', 20),
  subj('(a) List FOUR input devices.\n(b) Choose any TWO from your list and explain what they are used for.', 20),
  subj('(a) List FOUR output devices.\n(b) Differentiate between a "Soft copy" and a "Hard copy".', 20),
  subj('(a) What is a laptop computer?\n(b) State TWO differences between a laptop and a desktop computer.\n(c) State ONE advantage of a laptop over a desktop.', 20),
  subj('(a) State FOUR ways to care for and maintain a computer system.\n(b) Why should a computer room be well-ventilated or have an air conditioner?', 20),
  subj('(a) Explain the term "Wearable Technology".\n(b) Give TWO examples of wearable technology devices.\n(c) State ONE use of a smartwatch.', 20),
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
  console.log('🎓 Seeding Basic 6 Computing WAEC-style exams...\n');
  
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

  const EXAMS = [
    buildExam({
      title: 'Basic 6 Computing — Mock Exam 1 (Hardware & Word Processing)',
      desc: 'WAEC-style Computing exam for Basic 6. Covers hardware components, typing skills, input/output devices, and Microsoft Word. 40 objectives + 10 subjective questions (answer 5).',
      classLevel: 'Basic 6', subjectName: 'Computing', mins: 90, objQ: B6_COMP_1_OBJ, subjQ: B6_COMP_1_SUBJ
    }),
    buildExam({
      title: 'Basic 6 Computing — Mock Exam 2 (Internet, Paint & Files)',
      desc: 'WAEC-style Computing exam for Basic 6. Covers internet basics, search engines, safe browsing, file management, and MS Paint. 40 objectives + 10 subjective questions (answer 5).',
      classLevel: 'Basic 6', subjectName: 'Computing', mins: 90, objQ: B6_COMP_2_OBJ, subjQ: B6_COMP_2_SUBJ
    }),
    buildExam({
      title: 'Basic 6 Computing — Mock Exam 3 (Information Processing)',
      desc: 'WAEC-style Computing exam for Basic 6. Covers the information processing cycle, everyday computing devices, storage, and computer care. 40 objectives + 10 subjective questions (answer 5).',
      classLevel: 'Basic 6', subjectName: 'Computing', mins: 90, objQ: B6_COMP_3_OBJ, subjQ: B6_COMP_3_SUBJ
    })
  ];

  for (const exam of EXAMS) {
    process.stdout.write(`📝 ${exam.title}... `);
    exam.subject_id = subjectId;

    const { error } = await supabase.from('global_quizzes').insert(exam);
    if (error) {
      console.log(`❌ ${error.message}`);
    } else {
      const sA = exam.content.sections[0].questions.length;
      const sB = exam.content.sections[1].questions.length;
      console.log(`✅  Section A: ${sA} objs | Section B: ${sB} subjs`);
    }
  }
  console.log('\n🎉 Done! Basic 6 Computing WAEC exams are live on the hub.');
}

run();
