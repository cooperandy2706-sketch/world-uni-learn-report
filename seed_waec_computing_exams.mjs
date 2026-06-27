// seed_waec_computing_exams.mjs
// 3 WAEC-style Computing Mock Exams (Basic 7, 8, 9)
// 40 objectives + 10 subjectives (pick 5)

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jltlnzjqhzsqpmhcpczl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsdGxuempxaHpzcXBtaGNwY3psIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM2ODEwMSwiZXhwIjoyMDg4OTQ0MTAxfQ.oVDVXnC2LO49sYfc_dxxJStrW0VGH5sUvkUB64vXqzo';

const supabase = createClient(supabaseUrl, supabaseKey, { auth: { autoRefreshToken: false, persistSession: false } });

let _qid = 0;
const qid = () => `comp_q${++_qid}_${Math.random().toString(36).slice(2, 7)}`;
const obj = (text, options, correctAnswer, diff = 'medium') => ({ id: qid(), type: 'objective', text, options, correctAnswer, diff });
const subj = (text, marks = 20, hint = '') => ({ id: qid(), type: 'subjective', text, marks, hint });

// ═════════════════════════════════════════════════════════════════════
// BASIC 7 — Computing
// ═════════════════════════════════════════════════════════════════════
const COMP_B7_OBJ = [
  obj('Which of the following is an input device?', ['Monitor', 'Printer', 'Keyboard', 'Speaker'], 'Keyboard', 'easy'),
  obj('The physical parts of a computer that you can touch and see are called:', ['Software', 'Hardware', 'Malware', 'Firmware'], 'Hardware', 'easy'),
  obj('Which device is used to produce a hard copy of a document?', ['Scanner', 'Projector', 'Printer', 'Monitor'], 'Printer', 'easy'),
  obj('CPU stands for:', ['Central Processing Unit', 'Computer Personal Unit', 'Central Printed Unit', 'Control Processing Unit'], 'Central Processing Unit', 'easy'),
  obj('The blinking line on the screen that indicates where text will be typed is the:', ['Mouse', 'Cursor', 'Pointer', 'Icon'], 'Cursor', 'easy'),
  obj('Which of the following is an example of an Operating System?', ['Microsoft Word', 'Windows 10', 'Mozilla Firefox', 'VLC Player'], 'Windows 10', 'medium'),
  obj('What is the main function of the RAM?', ['To store data permanently', 'To hold data and instructions temporarily while the computer is running', 'To print documents', 'To scan images'], 'To hold data and instructions temporarily while the computer is running', 'medium'),
  obj('A small picture on the computer desktop that represents a file or program is called an:', ['Icon', 'Image', 'Symbol', 'Avatar'], 'Icon', 'easy'),
  obj('To turn on a computer, you press the:', ['Enter key', 'Power button', 'Spacebar', 'Shift key'], 'Power button', 'easy'),
  obj('Which of these is NOT a storage device?', ['Hard Disk Drive', 'USB Flash Drive', 'Keyboard', 'CD-ROM'], 'Keyboard', 'easy'),
  obj('What does double-clicking the left mouse button usually do?', ['Opens a file or program', 'Deletes a file', 'Shows a context menu', 'Closes a window'], 'Opens a file or program', 'easy'),
  obj('The longest key on the keyboard is the:', ['Enter key', 'Shift key', 'Spacebar', 'Backspace key'], 'Spacebar', 'easy'),
  obj('Which software is best for typing a letter or essay?', ['Microsoft Excel', 'Microsoft Paint', 'Microsoft Word', 'Microsoft PowerPoint'], 'Microsoft Word', 'easy'),
  obj('In a word processor, what does the "B" button on the toolbar do?', ['Makes text blue', 'Makes text bold', 'Makes text bigger', 'Breaks the text'], 'Makes text bold', 'easy'),
  obj('To delete the character to the LEFT of the cursor, you use the:', ['Delete key', 'Backspace key', 'Enter key', 'Shift key'], 'Backspace key', 'medium'),
  obj('A group of computers connected together to share resources is called a:', ['Network', 'System', 'Workgroup', 'Server'], 'Network', 'medium'),
  obj('The global network of interconnected computers is the:', ['Intranet', 'Extranet', 'Internet', 'Local Area Network'], 'Internet', 'easy'),
  obj('WWW stands for:', ['World Wide Web', 'World Web Wide', 'Wide World Web', 'Web World Wide'], 'World Wide Web', 'easy'),
  obj('Which of the following is a web browser?', ['Google', 'Yahoo', 'Google Chrome', 'Facebook'], 'Google Chrome', 'medium'),
  obj('A secret word or combination of characters used to access a computer or account is a:', ['Username', 'Password', 'Code', 'Key'], 'Password', 'easy'),
  obj('Which action is considered unsafe while using the internet?', ['Reading news articles', 'Sharing your password with strangers', 'Researching for homework', 'Watching educational videos'], 'Sharing your password with strangers', 'easy'),
  obj('What type of software helps protect your computer from viruses?', ['Word Processor', 'Antivirus', 'Web Browser', 'Spreadsheet'], 'Antivirus', 'easy'),
  obj('The main circuit board inside a computer is the:', ['Motherboard', 'Fatherboard', 'Breadboard', 'Keyboard'], 'Motherboard', 'medium'),
  obj('1 Gigabyte (GB) is equal to approximately:', ['1000 Megabytes (MB)', '1000 Kilobytes (KB)', '1000 Bytes', '1000 Terabytes (TB)'], '1000 Megabytes (MB)', 'medium'),
  obj('Which device is used to input sound into a computer?', ['Speaker', 'Microphone', 'Webcam', 'Scanner'], 'Microphone', 'easy'),
  obj('The shortcut key combination for copying selected text is:', ['Ctrl + C', 'Ctrl + V', 'Ctrl + X', 'Ctrl + P'], 'Ctrl + C', 'medium'),
  obj('The shortcut key combination for pasting copied text is:', ['Ctrl + C', 'Ctrl + V', 'Ctrl + X', 'Ctrl + P'], 'Ctrl + V', 'medium'),
  obj('Which finger should rest on the "F" key when touch typing?', ['Left index finger', 'Right index finger', 'Left middle finger', 'Right middle finger'], 'Left index finger', 'medium'),
  obj('A predefined, built-in formula in a spreadsheet is called a:', ['Function', 'Cell', 'Row', 'Column'], 'Function', 'medium'),
  obj('The intersection of a row and a column in a spreadsheet is called a:', ['Grid', 'Box', 'Cell', 'Table'], 'Cell', 'easy'),
  obj('Which of the following is an output device?', ['Mouse', 'Keyboard', 'Monitor', 'Microphone'], 'Monitor', 'easy'),
  obj('The set of instructions that tells the computer what to do is called:', ['Hardware', 'Software', 'Data', 'Information'], 'Software', 'easy'),
  obj('What does "booting" a computer mean?', ['Kicking the computer', 'Restarting or starting up the computer', 'Installing new software', 'Deleting files'], 'Restarting or starting up the computer', 'medium'),
  obj('Which part of the computer is often called the "brain"?', ['RAM', 'Hard Drive', 'CPU', 'Power Supply'], 'CPU', 'easy'),
  obj('An electronic message sent from one person to another over a network is an:', ['E-mail', 'E-book', 'E-commerce', 'E-learning'], 'E-mail', 'easy'),
  obj('What is the purpose of a search engine?', ['To type documents', 'To play games', 'To find information on the internet', 'To create spreadsheets'], 'To find information on the internet', 'easy'),
  obj('Which of the following is NOT a good ergonomic practice when using a computer?', ['Sitting up straight', 'Keeping the monitor at eye level', 'Staring at the screen for 5 hours without a break', 'Using a comfortable chair'], 'Staring at the screen for 5 hours without a break', 'easy'),
  obj('To save a document for the first time, you should use:', ['Save', 'Save As', 'Print', 'Open'], 'Save As', 'medium'),
  obj('Which key is used to create capital letters when typing?', ['Shift', 'Ctrl', 'Alt', 'Tab'], 'Shift', 'easy'),
  obj('A folder inside another folder is called a:', ['File', 'Document', 'Subfolder', 'Directory'], 'Subfolder', 'medium')
];

const COMP_B7_SUBJ = [
  subj('(a) Define the terms "Hardware" and "Software".\n(b) Give THREE examples of computer hardware.\n(c) Give TWO examples of computer software.', 20, 'Remember hardware is physical, software is programs/instructions.'),
  subj('(a) What is an input device? Give TWO examples.\n(b) What is an output device? Give TWO examples.\n(c) Name ONE device that can act as both an input and an output device.', 20, 'Think about how data enters and leaves the computer.'),
  subj('(a) Outline the correct procedure for turning ON a desktop computer system.\n(b) Outline the correct procedure for shutting DOWN a Windows computer safely.\n(c) Why is it important to shut down a computer properly instead of just pulling the plug?', 20, 'List the steps clearly. Think about saving data and protecting hardware.'),
  subj('(a) What is a word processor? Give ONE example of a word processing software.\n(b) Describe how to perform the following actions in Microsoft Word:\n    (i) Bold a word\n    (ii) Underline a word\n    (iii) Save a new document', 20, 'Explain the steps or buttons you would click/press.'),
  subj('(a) Explain the difference between "Save" and "Save As".\n(b) What is the difference between "Copy" and "Cut"?\n(c) List the keyboard shortcuts for:\n    (i) Copy\n    (ii) Cut\n    (iii) Paste\n    (iv) Undo', 20, 'Save As is for the first time or saving a copy. Cut removes the original.'),
  subj('(a) What is the Internet?\n(b) Mention THREE uses of the Internet for a Junior High School student.\n(c) State TWO dangers or disadvantages of using the Internet.', 20, 'Think about research, communication, cyberbullying, viruses, etc.'),
  subj('(a) Define the term "Web Browser".\n(b) Name THREE examples of web browsers.\n(c) What is a Search Engine? Give TWO examples.', 20, 'A browser is software to access the web. A search engine helps find things on the web.'),
  subj('(a) What is an Email?\n(b) List the parts of this email address: student123@yahoo.com (identify the username, the @ symbol, and the domain name).\n(c) State TWO advantages of using email over traditional postal mail.', 20, 'Email is fast and cheap. Identify the parts clearly.'),
  subj('Write short notes on the function of the following parts of a computer system:\n(a) Central Processing Unit (CPU)\n(b) Random Access Memory (RAM)\n(c) Hard Disk Drive (HDD)\n(d) Motherboard', 20, 'Briefly explain what each component does in the computer.'),
  subj('(a) What are "Computer Ethics"?\n(b) State THREE rules a student must follow when in the school computer laboratory.\n(c) Why is it bad to eat or drink near a computer?', 20, 'Rules for behaviour and safety in the lab. Liquids and electronics don\'t mix.')
];

// ═════════════════════════════════════════════════════════════════════
// BASIC 8 — Computing
// ═════════════════════════════════════════════════════════════════════
const COMP_B8_OBJ = [
  obj('In a spreadsheet, columns are labeled with:', ['Numbers', 'Letters', 'Symbols', 'Words'], 'Letters', 'easy'),
  obj('In a spreadsheet, rows are labeled with:', ['Numbers', 'Letters', 'Symbols', 'Words'], 'Numbers', 'easy'),
  obj('Which formula is correct for adding the values in cells A1 and B1?', ['=A1+B1', 'A1+B1', 'ADD(A1,B1)', '=SUM(A1+B1)'], '=A1+B1', 'medium'),
  obj('A collection of worksheets in Microsoft Excel is called a:', ['Document', 'Workbook', 'Presentation', 'Database'], 'Workbook', 'medium'),
  obj('Which function is used to find the highest value in a range of cells?', ['=HIGH()', '=MAX()', '=TOP()', '=GREATEST()'], '=MAX()', 'medium'),
  obj('Which function calculates the mean (average) of a range of cells?', ['=MEAN()', '=AVERAGE()', '=SUM()', '=MEDIAN()'], '=AVERAGE()', 'medium'),
  obj('A sequence of instructions written to perform a specified task with a computer is called a:', ['Hardware', 'Program', 'Network', 'Database'], 'Program', 'easy'),
  obj('What is an algorithm?', ['A type of computer virus', 'A step-by-step procedure for solving a problem', 'A piece of hardware', 'A web browser'], 'A step-by-step procedure for solving a problem', 'easy'),
  obj('In Scratch programming, the characters that perform actions are called:', ['Actors', 'Sprites', 'Avatars', 'Figures'], 'Sprites', 'easy'),
  obj('Which block is usually used to start a script in Scratch?', ['When green flag clicked', 'Forever', 'Move 10 steps', 'Say "Hello"'], 'When green flag clicked', 'easy'),
  obj('What does a "Forever" block do in Scratch?', ['Stops the program immediately', 'Repeats the blocks inside it over and over indefinitely', 'Makes the sprite disappear forever', 'Saves the project'], 'Repeats the blocks inside it over and over indefinitely', 'medium'),
  obj('A graphical representation of an algorithm using different shapes is called a:', ['Pie chart', 'Bar graph', 'Flowchart', 'Spreadsheet'], 'Flowchart', 'easy'),
  obj('In a flowchart, what shape represents a decision (Yes/No)?', ['Oval', 'Rectangle', 'Diamond', 'Parallelogram'], 'Diamond', 'medium'),
  obj('In a flowchart, what shape represents the Start or End of the process?', ['Oval', 'Rectangle', 'Diamond', 'Parallelogram'], 'Oval', 'medium'),
  obj('A named memory location in a program that holds a value which can change is a:', ['Constant', 'Variable', 'Function', 'Loop'], 'Variable', 'medium'),
  obj('LAN stands for:', ['Large Area Network', 'Local Area Network', 'Linked Area Network', 'Logical Area Network'], 'Local Area Network', 'easy'),
  obj('WAN stands for:', ['Wide Area Network', 'World Area Network', 'Web Area Network', 'Wireless Area Network'], 'Wide Area Network', 'easy'),
  obj('A device that forwards data packets between computer networks is a:', ['Monitor', 'Router', 'Printer', 'Keyboard'], 'Router', 'medium'),
  obj('The practice of sending fraudulent emails to trick people into revealing personal information is called:', ['Phishing', 'Hacking', 'Spamming', 'Surfing'], 'Phishing', 'medium'),
  obj('A malicious software designed to damage or gain unauthorized access to a computer system is called:', ['Operating System', 'Application', 'Malware', 'Utility software'], 'Malware', 'easy'),
  obj('Which of the following is a strong password?', ['password', '123456', 'qwerty', 'G#h7!kL9'], 'G#h7!kL9', 'easy'),
  obj('What does "CC" stand for in an email?', ['Carbon Copy', 'Computer Copy', 'Clear Copy', 'Complete Copy'], 'Carbon Copy', 'medium'),
  obj('What does "BCC" stand for in an email?', ['Blind Carbon Copy', 'Blank Computer Copy', 'Bold Clear Copy', 'Basic Carbon Copy'], 'Blind Carbon Copy', 'medium'),
  obj('Which of the following file extensions usually indicates an image file?', ['.doc', '.xls', '.jpg', '.mp3'], '.jpg', 'medium'),
  obj('Which of the following file extensions indicates an audio file?', ['.txt', '.mp3', '.exe', '.pdf'], '.mp3', 'medium'),
  obj('What does URL stand for?', ['Universal Record Locator', 'Uniform Resource Locator', 'Unified Web Link', 'Unique Resource Link'], 'Uniform Resource Locator', 'hard'),
  obj('A hyperlink is:', ['A very fast internet connection', 'A link from a hypertext file to another location or file', 'A type of computer mouse', 'A fast printer'], 'A link from a hypertext file to another location or file', 'medium'),
  obj('ISP stands for:', ['Internet Service Provider', 'International Server Protocol', 'Internal System Program', 'Internet Standard Provider'], 'Internet Service Provider', 'medium'),
  obj('Which of the following is a mobile operating system?', ['Windows 10', 'macOS', 'Linux', 'Android'], 'Android', 'easy'),
  obj('What does formatting text mean in a word processor?', ['Deleting the text', 'Changing the appearance of the text (e.g., font, color, size)', 'Saving the document', 'Printing the document'], 'Changing the appearance of the text (e.g., font, color, size)', 'easy'),
  obj('Justifying text in a document means:', ['Aligning text to the left margin only', 'Aligning text to the right margin only', 'Aligning text to both the left and right margins', 'Centering the text'], 'Aligning text to both the left and right margins', 'medium'),
  obj('A tool in word processing used to find words with similar meanings is the:', ['Dictionary', 'Thesaurus', 'Spell Checker', 'Grammar Checker'], 'Thesaurus', 'hard'),
  obj('What is a slide in a presentation software?', ['A single page or screen of a presentation', 'The software itself', 'A transition effect', 'A picture'], 'A single page or screen of a presentation', 'easy'),
  obj('Which software is used for creating presentations?', ['Microsoft Access', 'Microsoft Excel', 'Microsoft PowerPoint', 'Microsoft Word'], 'Microsoft PowerPoint', 'easy'),
  obj('A network covering a large geographic area, such as a country or the world, is a:', ['LAN', 'MAN', 'PAN', 'WAN'], 'WAN', 'medium'),
  obj('In Scratch, the area where the sprites move and interact is called the:', ['Script area', 'Stage', 'Block palette', 'Backpack'], 'Stage', 'medium'),
  obj('Which block category in Scratch contains blocks for moving a sprite?', ['Looks', 'Sound', 'Motion', 'Events'], 'Motion', 'easy'),
  obj('Finding and fixing errors in a computer program is called:', ['Compiling', 'Executing', 'Debugging', 'Coding'], 'Debugging', 'medium'),
  obj('A systematic way to solve a problem using logical steps is called:', ['Computational Thinking', 'Creative Writing', 'Data Entry', 'Word Processing'], 'Computational Thinking', 'medium'),
  obj('An error in a program that causes it to produce incorrect results or crash is a:', ['Virus', 'Bug', 'Feature', 'Code'], 'Bug', 'easy')
];

const COMP_B8_SUBJ = [
  subj('(a) What is a Spreadsheet?\n(b) List THREE uses of a spreadsheet application.\n(c) Explain the difference between a Row, a Column, and a Cell in a spreadsheet.', 20, 'Think about data, calculations, and tables.'),
  subj('Consider the following data in a spreadsheet: Cell A1=10, A2=20, A3=30.\nWrite down the exact formulas you would use to calculate:\n(a) The total sum of the three cells.\n(b) The average of the three cells.\n(c) The maximum value among the three cells.\n(d) The difference between cell A3 and cell A1.', 20, 'Remember that formulas must start with an equals sign (=).'),
  subj('(a) What is a Computer Network?\n(b) State the difference between a Local Area Network (LAN) and a Wide Area Network (WAN).\n(c) List THREE benefits of networking computers in an office or school laboratory.', 20, 'Think about sharing resources (printers, files) and communication.'),
  subj('(a) What is an Algorithm?\n(b) Write a simple algorithm (at least 5 steps) to describe the process of making a cup of tea or preparing your favourite breakfast.', 20, 'Write step-by-step instructions in order.'),
  subj('(a) Draw the standard flowchart symbols for the following and state what each is used for:\n    (i) Terminal (Start/End)\n    (ii) Process (Action)\n    (iii) Decision\n    (iv) Input/Output', 20, 'Oval = Start/End, Rectangle = Process, Diamond = Decision, Parallelogram = Input/Output.'),
  subj('(a) What is malware? Name TWO types of malware.\n(b) State THREE ways a computer can be infected by a virus.\n(c) List TWO ways you can protect your computer from virus infection.', 20, 'Think about downloads, USB drives, antivirus software, and safe browsing.'),
  subj('(a) Differentiate between "CC" and "BCC" when sending an email.\n(b) Why is it important to use a strong password for your online accounts?\n(c) Give THREE characteristics of a strong password.', 20, 'CC = Carbon Copy, BCC = Blind Carbon Copy (hidden). Strong passwords have letters, numbers, symbols.'),
  subj('(a) What is Programming?\n(b) Name the visual programming language often used in schools (hint: uses blocks and a cat sprite).\n(c) In this language, what is the function of:\n    (i) The Stage\n    (ii) A Sprite\n    (iii) A Script', 20, 'The language is Scratch. Explain what the stage, sprite, and script do.'),
  subj('(a) Explain the term "Cyberbullying".\n(b) State THREE effects of cyberbullying on a victim.\n(c) Give TWO actions a student should take if they are being cyberbullied.', 20, 'Cyberbullying happens online. Victims feel sad/scared. They should block the person and tell an adult.'),
  subj('(a) Define the following terms as used in presentation software (e.g., PowerPoint):\n    (i) Slide\n    (ii) Slide Show\n    (iii) Transition\n    (iv) Animation\n(b) Give ONE situation where a presentation software would be very useful.', 20, 'Transitions happen between slides. Animations happen to objects on a slide.')
];

// ═════════════════════════════════════════════════════════════════════
// BASIC 9 — Computing (BECE Mock)
// ═════════════════════════════════════════════════════════════════════
const COMP_B9_OBJ = [
  obj('The term ICT stands for:', ['Information and Communication Technology', 'Information and Computer Technology', 'Internet and Communication Technology', 'International Computer Technology'], 'Information and Communication Technology', 'easy'),
  obj('The main storage device inside a computer where the operating system is installed is the:', ['RAM', 'ROM', 'Hard Disk Drive', 'Flash Drive'], 'Hard Disk Drive', 'medium'),
  obj('The process of transferring files from a local computer to a server on the Internet is called:', ['Downloading', 'Uploading', 'Browsing', 'Surfing'], 'Uploading', 'easy'),
  obj('The process of transferring files from the Internet to a local computer is called:', ['Downloading', 'Uploading', 'Browsing', 'Surfing'], 'Downloading', 'easy'),
  obj('Which of the following is a cloud storage service?', ['Microsoft Word', 'Google Drive', 'Mozilla Firefox', 'Windows Defender'], 'Google Drive', 'medium'),
  obj('What does HTTP stand for?', ['HyperText Transfer Protocol', 'HyperText Transmission Protocol', 'High Technical Transfer Program', 'Hyper Transfer Text Protocol'], 'HyperText Transfer Protocol', 'hard'),
  obj('In computing, a byte consists of how many bits?', ['4', '8', '16', '32'], '8', 'medium'),
  obj('Which device converts digital signals from a computer into analog signals to travel over telephone lines?', ['Router', 'Switch', 'Modem', 'Hub'], 'Modem', 'medium'),
  obj('The alignment that positions text evenly between both the left and right margins is:', ['Left alignment', 'Right alignment', 'Center alignment', 'Justified alignment'], 'Justified alignment', 'medium'),
  obj('The legal right granted to an author, composer, or publisher to exclusive publication, production, or sale of their work is called:', ['Patent', 'Trademark', 'Copyright', 'Plagiarism'], 'Copyright', 'medium'),
  obj('Using someone else\'s work and presenting it as your own without giving them credit is called:', ['Research', 'Citation', 'Plagiarism', 'Fair Use'], 'Plagiarism', 'medium'),
  obj('What is an operating system?', ['A program that allows you to type letters', 'A hardware component that stores data', 'System software that manages computer hardware and software resources', 'A type of computer virus'], 'System software that manages computer hardware and software resources', 'medium'),
  obj('Which of the following is an example of Open Source Software?', ['Microsoft Windows', 'Microsoft Office', 'Linux', 'Adobe Photoshop'], 'Linux', 'hard'),
  obj('Which shortcut key is used to "Undo" the last action?', ['Ctrl + Z', 'Ctrl + Y', 'Ctrl + U', 'Ctrl + A'], 'Ctrl + Z', 'medium'),
  obj('Which shortcut key is used to "Select All" text or items?', ['Ctrl + A', 'Ctrl + S', 'Ctrl + Z', 'Ctrl + C'], 'Ctrl + A', 'easy'),
  obj('A small program embedded in a webpage that may cause security risks if from an untrusted source is an:', ['Applet', 'Cookie', 'Extension', 'Icon'], 'Applet', 'hard'),
  obj('What is a "Cookie" in computer terminology?', ['A snack eaten while computing', 'A small text file stored on your computer by a website to remember your preferences', 'A virus that deletes your files', 'A hardware device'], 'A small text file stored on your computer by a website to remember your preferences', 'medium'),
  obj('HTML stands for:', ['HyperText Markup Language', 'High Text Machine Language', 'Hyper Tool Markup Language', 'HyperText Machine Language'], 'HyperText Markup Language', 'medium'),
  obj('Which language is commonly used to create web pages?', ['Python', 'Java', 'HTML', 'C++'], 'HTML', 'easy'),
  obj('The part of the CPU that performs mathematical operations and logical comparisons is the:', ['Control Unit (CU)', 'Arithmetic Logic Unit (ALU)', 'Registers', 'Cache'], 'Arithmetic Logic Unit (ALU)', 'hard'),
  obj('The part of the CPU that directs and coordinates operations is the:', ['Control Unit (CU)', 'Arithmetic Logic Unit (ALU)', 'Registers', 'Cache'], 'Control Unit (CU)', 'hard'),
  obj('Which of the following describes "Ergonomics"?', ['The study of economics and computers', 'Designing the workplace and equipment to fit the user comfortably and safely', 'The speed at which a computer processes data', 'The process of writing computer code'], 'Designing the workplace and equipment to fit the user comfortably and safely', 'medium'),
  obj('RSI stands for:', ['Random System Information', 'Repetitive Strain Injury', 'Rapid Software Installation', 'Reliable Storage Interface'], 'Repetitive Strain Injury', 'medium'),
  obj('A database is best defined as:', ['A collection of interrelated data organized for easy access, retrieval, and management', 'A program for typing documents', 'A website for playing games', 'A hardware device for storing images'], 'A collection of interrelated data organized for easy access, retrieval, and management', 'medium'),
  obj('In a database table, a single row of information about one entity (e.g., one student) is called a:', ['Field', 'Record', 'File', 'Query'], 'Record', 'medium'),
  obj('In a database table, a column containing a specific type of information (e.g., Last Name) is called a:', ['Field', 'Record', 'File', 'Query'], 'Field', 'medium'),
  obj('Which application is commonly used to create and manage databases?', ['Microsoft Word', 'Microsoft Excel', 'Microsoft Access', 'Microsoft PowerPoint'], 'Microsoft Access', 'medium'),
  obj('In Scratch, what does the "If on edge, bounce" block do?', ['Makes the sprite jump up', 'Turns the sprite around when it hits the edge of the stage', 'Deletes the sprite', 'Changes the color of the sprite'], 'Turns the sprite around when it hits the edge of the stage', 'medium'),
  obj('A loop within another loop in programming is called a:', ['Nested loop', 'Double loop', 'Infinite loop', 'Circle loop'], 'Nested loop', 'hard'),
  obj('The process of breaking down a complex problem into smaller, more manageable parts is called:', ['Abstraction', 'Pattern Recognition', 'Decomposition', 'Algorithm Design'], 'Decomposition', 'medium'),
  obj('Focusing on the important information and ignoring irrelevant details when solving a problem is called:', ['Abstraction', 'Pattern Recognition', 'Decomposition', 'Algorithm Design'], 'Abstraction', 'hard'),
  obj('Which of the following is a primary key in a database?', ['A field that uniquely identifies each record in a table (e.g., Student ID)', 'A field for the person\'s first name', 'A field for the date of birth', 'The password to open the database'], 'A field that uniquely identifies each record in a table (e.g., Student ID)', 'hard'),
  obj('What is "E-commerce"?', ['Sending electronic mail', 'Buying and selling goods and services over the Internet', 'Studying online', 'Electronic computer engineering'], 'Buying and selling goods and services over the Internet', 'easy'),
  obj('The main page of a website is called the:', ['Home page', 'Web page', 'Browser page', 'Index page'], 'Home page', 'easy'),
  obj('Which of the following acts as a protective barrier between a private network and the public internet?', ['Antivirus', 'Firewall', 'Modem', 'Router'], 'Firewall', 'medium'),
  obj('What is the function of the "Format Painter" tool in word processing?', ['To paint pictures in the document', 'To copy the formatting of one text to apply it to another text', 'To change the background color of the page', 'To draw shapes'], 'To copy the formatting of one text to apply it to another text', 'hard'),
  obj('ROM stands for:', ['Read Only Memory', 'Random Only Memory', 'Read Open Memory', 'Random Open Memory'], 'Read Only Memory', 'easy'),
  obj('Which of the following memory is non-volatile (retains data when power is turned off)?', ['RAM', 'Cache', 'ROM', 'Registers'], 'ROM', 'medium'),
  obj('A predefined layout for a document, presentation, or spreadsheet is called a:', ['Template', 'Format', 'Design', 'Style'], 'Template', 'medium'),
  obj('What is the purpose of the "Print Preview" feature?', ['To print the document immediately', 'To see how the document will look on paper before actually printing it', 'To cancel a print job', 'To select a printer'], 'To see how the document will look on paper before actually printing it', 'easy')
];

const COMP_B9_SUBJ = [
  subj('(a) Define the term "Operating System".\n(b) List THREE examples of Operating Systems.\n(c) State THREE main functions of an Operating System.', 20, 'Think of Windows/Android. Functions: managing hardware, software, providing interface.'),
  subj('(a) What is a Database Management System (DBMS)?\n(b) Explain the difference between a Field and a Record in a database table.\n(c) What is the purpose of a Primary Key in a database? Give ONE example of a field that would make a good Primary Key.', 20, 'DBMS manages databases. Fields are columns, Records are rows. Primary key is unique.'),
  subj('(a) Describe the difference between RAM (Random Access Memory) and ROM (Read Only Memory) under the following headings:\n    (i) Volatility (What happens when power is lost?)\n    (ii) Function (What are they used for?)\n(b) Explain the function of the Arithmetic Logic Unit (ALU) and the Control Unit (CU) in the CPU.', 20, 'RAM is volatile, ROM is non-volatile. ALU does math, CU directs traffic.'),
  subj('(a) Explain the concept of "Ergonomics" as applied to computing.\n(b) State THREE health problems that can result from prolonged use of computers.\n(c) Give THREE ergonomic practices a user should adopt to prevent these health problems.', 20, 'Think about posture, eye strain, RSI. Practices: good chair, screen at eye level, breaks.'),
  subj('(a) Define the following Internet terms:\n    (i) WWW\n    (ii) URL\n    (iii) HTTP\n    (iv) HTML\n(b) Distinguish between "Downloading" and "Uploading" a file.', 20, 'Provide the full meaning of the acronyms and a brief description.'),
  subj('(a) What is E-commerce?\n(b) State THREE advantages of E-commerce to a consumer.\n(c) State TWO disadvantages or risks associated with E-commerce.', 20, 'Buying/selling online. Pros: convenient, 24/7. Cons: cannot touch items, fraud risk.'),
  subj('In the context of Information Security, explain the following terms:\n(a) Hacking\n(b) Phishing\n(c) Malware\n(d) Firewall\n(e) Antivirus Software', 20, 'Provide a clear definition for each term relating to computer security.'),
  subj('(a) What are "Intellectual Property Rights"?\n(b) Explain the following terms related to intellectual property:\n    (i) Copyright\n    (ii) Plagiarism\n    (iii) Software Piracy\n(c) State ONE consequence of software piracy.', 20, 'Protecting creations of the mind. Copyright protects authors. Plagiarism is copying work.'),
  subj('(a) List the FOUR pillars of Computational Thinking.\n(b) Briefly explain any TWO of the pillars you listed in (a).\n(c) Write a brief algorithm to describe how to calculate the area of a rectangle.', 20, 'Pillars: Decomposition, Pattern Recognition, Abstraction, Algorithm Design.'),
  subj('(a) Explain the difference between "System Software" and "Application Software".\n(b) Classify the following into System Software or Application Software:\n    (i) Microsoft Windows 10\n    (ii) Microsoft Word\n    (iii) Android OS\n    (iv) CorelDraw\n(c) What is Utility Software? Give ONE example.', 20, 'System runs the computer, Application does a specific task for the user. Utility helps maintain the system.')
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
          instructions: `Answer ANY 5 out of the ${subjQ.length} questions in this section. Each question carries 20 marks. Show all working where applicable.`,
          required: 5,
          questions: subjQ.map((q, i) => ({ id: q.id, number: i + 1, text: q.text, marks: q.marks, hint: q.hint || '' }))
        }
      ]
    }
  };
}

async function run() {
  console.log('🎓 Seeding Computing WAEC-style exams...\n');
  
  // First, find the Computing subjects
  const { data: subjects, error: subErr } = await supabase
    .from('subjects')
    .select('id, name')
    .ilike('name', '%Computing%');

  if (subErr) {
    console.error('❌ Error fetching subjects:', subErr.message);
    return;
  }

  // Helper to find subject ID
  const getSubjectId = (levelText) => {
    // E.g., levelText = 'G7' for Basic 7
    const sub = subjects.find(s => s.name.includes(levelText));
    return sub ? sub.id : null;
  };

  const EXAMS = [
    buildExam({
      title: 'Basic 7 Computing — WAEC Mock Exam',
      desc: 'WAEC-style Computing exam for JHS 1. Covers hardware, software, internet basics, and word processing. 40 objectives + 10 subjective questions (answer 5).',
      classLevel: 'Basic 7', subjectName: 'Computing', mins: 120, objQ: COMP_B7_OBJ, subjQ: COMP_B7_SUBJ
    }),
    buildExam({
      title: 'Basic 8 Computing — WAEC Mock Exam',
      desc: 'WAEC-style Computing exam for JHS 2. Covers spreadsheets, networks, algorithms, flowcharts, and presentation software. 40 objectives + 10 subjective questions (answer 5).',
      classLevel: 'Basic 8', subjectName: 'Computing', mins: 120, objQ: COMP_B8_OBJ, subjQ: COMP_B8_SUBJ
    }),
    buildExam({
      title: 'Basic 9 Computing — WAEC BECE Mock Exam',
      desc: 'BECE-style Computing exam for JHS 3. Covers databases, e-commerce, computer ethics, hardware architecture, and computational thinking. 40 objectives + 10 subjective questions (answer 5).',
      classLevel: 'Basic 9', subjectName: 'Computing', mins: 120, objQ: COMP_B9_OBJ, subjQ: COMP_B9_SUBJ
    })
  ];

  for (const exam of EXAMS) {
    process.stdout.write(`📝 ${exam.title}... `);
    
    // Attempt to map to correct subject ID based on level
    let levelPrefix = 'G9';
    if (exam.title.includes('Basic 7')) levelPrefix = 'G7';
    if (exam.title.includes('Basic 8')) levelPrefix = 'G8';
    
    exam.subject_id = getSubjectId(levelPrefix);

    const { error } = await supabase.from('global_quizzes').insert(exam);
    if (error) {
      console.log(`❌ ${error.message}`);
    } else {
      const sA = exam.content.sections[0].questions.length;
      const sB = exam.content.sections[1].questions.length;
      console.log(`✅  Section A: ${sA} objs | Section B: ${sB} subjs`);
    }
  }
  console.log('\n🎉 Done! Computing WAEC exams are live on the hub.');
}

run();
