import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jltlnzjqhzsqpmhcpczl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsdGxuempxaHpzcXBtaGNwY3psIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM2ODEwMSwiZXhwIjoyMDg4OTQ0MTAxfQ.oVDVXnC2LO49sYfc_dxxJStrW0VGH5sUvkUB64vXqzo'

const supabase = createClient(supabaseUrl, supabaseKey)

// ─── Quiz 1: Spreadsheets & Data Management ───
const quiz1Questions = [
  { id: 'q1_01', text: 'In a spreadsheet, what does a "cell reference" like B3 mean?', options: ['Row B, Column 3', 'Column B, Row 3', 'Block B, Section 3', 'Base 3, Value B'], correctAnswer: 'Column B, Row 3', points: 10 },
  { id: 'q1_02', text: 'Which formula would correctly add all values from A1 to A10 in a spreadsheet?', options: ['=TOTAL(A1:A10)', '=ADD(A1,A10)', '=SUM(A1:A10)', '=PLUS(A1:A10)'], correctAnswer: '=SUM(A1:A10)', points: 10 },
  { id: 'q1_03', text: 'What is the purpose of sorting data in a spreadsheet?', options: ['To delete unwanted data', 'To arrange data in a specific order (e.g. A-Z or 1-10)', 'To merge cells together', 'To change the font color'], correctAnswer: 'To arrange data in a specific order (e.g. A-Z or 1-10)', points: 10 },
  { id: 'q1_04', text: 'If cell A1 contains 10 and cell B1 contains 5, what does =A1-B1 return?', options: ['15', '5', '2', '50'], correctAnswer: '5', points: 10 },
  { id: 'q1_05', text: 'What type of chart would BEST show how a student\'s test scores changed over 5 weeks?', options: ['Pie chart', 'Bar chart', 'Line chart', 'Scatter plot'], correctAnswer: 'Line chart', points: 10 },
  { id: 'q1_06', text: 'In a spreadsheet, what does the formula =AVERAGE(B2:B6) do?', options: ['Adds all values from B2 to B6', 'Finds the highest value in that range', 'Calculates the mean of values from B2 to B6', 'Counts the number of cells in that range'], correctAnswer: 'Calculates the mean of values from B2 to B6', points: 10 },
  { id: 'q1_07', text: 'What is "filtering" data in a spreadsheet used for?', options: ['Removing duplicate rows', 'Displaying only rows that meet a certain condition', 'Changing the background color of cells', 'Adding borders to a table'], correctAnswer: 'Displaying only rows that meet a certain condition', points: 10 },
  { id: 'q1_08', text: 'A pie chart is MOST useful when you want to show:', options: ['Changes over time', 'Each part as a percentage of a whole', 'Comparison between two different groups', 'The relationship between two variables'], correctAnswer: 'Each part as a percentage of a whole', points: 10 },
  { id: 'q1_09', text: 'What happens when you drag a formula from cell C1 down to C2 in a spreadsheet?', options: ['The formula stays exactly the same', 'The formula is deleted', 'The cell references adjust automatically (e.g. A1 becomes A2)', 'The formula moves to column D'], correctAnswer: 'The cell references adjust automatically (e.g. A1 becomes A2)', points: 10 },
  { id: 'q1_10', text: 'Which of the following is an example of a spreadsheet application?', options: ['Microsoft Word', 'Google Slides', 'Microsoft Excel', 'Adobe Photoshop'], correctAnswer: 'Microsoft Excel', points: 10 },
  { id: 'q1_11', text: 'What does the =MAX(D1:D8) formula do?', options: ['Adds all values from D1 to D8', 'Finds the largest number in the range D1 to D8', 'Finds the smallest number in the range', 'Counts how many cells have numbers'], correctAnswer: 'Finds the largest number in the range D1 to D8', points: 10 },
  { id: 'q1_12', text: 'In a database table, each row represents a:', options: ['Field', 'Record', 'Query', 'Report'], correctAnswer: 'Record', points: 10 },
  { id: 'q1_13', text: 'What is the difference between a spreadsheet and a database?', options: ['There is no difference', 'A spreadsheet is for calculations; a database is for organized storage and retrieval of large data', 'A database is only used for images', 'A spreadsheet can only store text'], correctAnswer: 'A spreadsheet is for calculations; a database is for organized storage and retrieval of large data', points: 10 },
  { id: 'q1_14', text: 'In a school records database, "Student_Name" is an example of a:', options: ['Record', 'Field', 'Table', 'Query'], correctAnswer: 'Field', points: 10 },
  { id: 'q1_15', text: 'What does it mean to "validate" data entered into a computer?', options: ['To print the data', 'To check that the data is correct and meets certain rules', 'To delete incorrect data permanently', 'To copy data to another file'], correctAnswer: 'To check that the data is correct and meets certain rules', points: 10 },
]

// ─── Quiz 2: Programming Logic & Algorithms ───
const quiz2Questions = [
  { id: 'q2_01', text: 'What is an algorithm?', options: ['A type of computer virus', 'A step-by-step set of instructions to solve a problem', 'The memory inside a computer', 'A programming language'], correctAnswer: 'A step-by-step set of instructions to solve a problem', points: 10 },
  { id: 'q2_02', text: 'In Scratch, what type of block would you use to repeat an action 5 times?', options: ['If-Then block', 'Forever block', 'Repeat (5) block', 'Wait block'], correctAnswer: 'Repeat (5) block', points: 10 },
  { id: 'q2_03', text: 'What is a "variable" in programming?', options: ['A fixed value that never changes', 'A named storage location that can hold changing data', 'A type of error in code', 'A loop that runs indefinitely'], correctAnswer: 'A named storage location that can hold changing data', points: 10 },
  { id: 'q2_04', text: 'What does an "IF-THEN-ELSE" statement do in a program?', options: ['It repeats a block of code multiple times', 'It makes a decision: if a condition is true, do one thing; otherwise do another', 'It stores a value in memory', 'It outputs text to the screen'], correctAnswer: 'It makes a decision: if a condition is true, do one thing; otherwise do another', points: 10 },
  { id: 'q2_05', text: 'Look at this algorithm: 1) Start. 2) Input a number. 3) If the number > 10, print "Big". 4) Else, print "Small". 5) End. What is printed if the number is 7?', options: ['Big', 'Small', 'Nothing', '7'], correctAnswer: 'Small', points: 10 },
  { id: 'q2_06', text: 'What is a "loop" used for in programming?', options: ['To stop the program immediately', 'To repeat a block of code multiple times without writing it over and over', 'To connect to the internet', 'To store large amounts of data'], correctAnswer: 'To repeat a block of code multiple times without writing it over and over', points: 10 },
  { id: 'q2_07', text: 'A flowchart uses a diamond shape to represent:', options: ['The start or end of a process', 'A process or action', 'A decision (yes/no question)', 'Input or output'], correctAnswer: 'A decision (yes/no question)', points: 10 },
  { id: 'q2_08', text: 'What is "debugging" in programming?', options: ['Adding more features to a program', 'Finding and fixing errors (bugs) in a program', 'Writing comments in the code', 'Deleting the entire program'], correctAnswer: 'Finding and fixing errors (bugs) in a program', points: 10 },
  { id: 'q2_09', text: 'In a flowchart, a rectangle (box) represents:', options: ['A decision point', 'The start or end of the program', 'A process or action step', 'An input from the user'], correctAnswer: 'A process or action step', points: 10 },
  { id: 'q2_10', text: 'What is "decomposition" in computational thinking?', options: ['Breaking a big problem down into smaller, manageable parts', 'Combining two programs together', 'Writing code very quickly', 'Deleting unnecessary files from a computer'], correctAnswer: 'Breaking a big problem down into smaller, manageable parts', points: 10 },
  { id: 'q2_11', text: 'Which of these best describes "pattern recognition" in computing?', options: ['Creating new images on a computer', 'Finding similarities or trends in data to solve problems more efficiently', 'Designing a new algorithm from scratch', 'Counting the number of lines in a program'], correctAnswer: 'Finding similarities or trends in data to solve problems more efficiently', points: 10 },
  { id: 'q2_12', text: 'In Scratch, a "sprite" is:', options: ['A type of background image', 'A character or object that can be programmed to move and interact', 'The code editor window', 'A sound effect in the program'], correctAnswer: 'A character or object that can be programmed to move and interact', points: 10 },
  { id: 'q2_13', text: 'What does "input" mean in a computer program?', options: ['The result produced by the program', 'Data or information given to the program by the user or another source', 'The speed at which the program runs', 'The code written by the programmer'], correctAnswer: 'Data or information given to the program by the user or another source', points: 10 },
  { id: 'q2_14', text: 'A program asks a user for their age. The user types "twelve" instead of 12. What type of error is this?', options: ['Syntax error', 'Logic error', 'Data validation error / input error', 'Runtime error'], correctAnswer: 'Data validation error / input error', points: 10 },
  { id: 'q2_15', text: 'What is "abstraction" in computational thinking?', options: ['Writing very long programs', 'Focusing only on the important details of a problem and ignoring unnecessary information', 'Using a computer to draw pictures', 'Making a program run faster'], correctAnswer: 'Focusing only on the important details of a problem and ignoring unnecessary information', points: 10 },
]

// ─── Quiz 3: Networks, Internet Safety & Digital Citizenship ───
const quiz3Questions = [
  { id: 'q3_01', text: 'What does "LAN" stand for in computer networking?', options: ['Large Area Network', 'Local Area Network', 'Linked Application Node', 'Logical Access Network'], correctAnswer: 'Local Area Network', points: 10 },
  { id: 'q3_02', text: 'What is the main difference between a LAN and a WAN?', options: ['A LAN uses wireless only; a WAN uses cables only', 'A LAN covers a small area (like a school); a WAN covers a much larger area (like a country or the world)', 'A WAN is faster than a LAN in all cases', 'There is no difference between them'], correctAnswer: 'A LAN covers a small area (like a school); a WAN covers a much larger area (like a country or the world)', points: 10 },
  { id: 'q3_03', text: 'What device is used to connect multiple devices on a network and direct data to the correct destination?', options: ['Monitor', 'Router', 'Keyboard', 'Scanner'], correctAnswer: 'Router', points: 10 },
  { id: 'q3_04', text: 'What does "IP address" mean?', options: ['Internet Protocol address – a unique number that identifies a device on a network', 'Image Processing address', 'Internal Program access code', 'Internet Printing address'], correctAnswer: 'Internet Protocol address – a unique number that identifies a device on a network', points: 10 },
  { id: 'q3_05', text: 'What is "phishing"?', options: ['A type of computer game played online', 'A cybercrime where criminals trick people into giving personal information using fake emails or websites', 'A method of speeding up your internet connection', 'A way to block unwanted websites'], correctAnswer: 'A cybercrime where criminals trick people into giving personal information using fake emails or websites', points: 10 },
  { id: 'q3_06', text: 'Which of the following is a strong password?', options: ['password123', 'myname2010', 'Gh@na$TuDent#2024!', 'abcdef'], correctAnswer: 'Gh@na$TuDent#2024!', points: 10 },
  { id: 'q3_07', text: 'What does "HTTPS" in a website address indicate?', options: ['The website is very popular', 'The connection to the website is encrypted and more secure', 'The website is blocked', 'The website uses a very fast server'], correctAnswer: 'The connection to the website is encrypted and more secure', points: 10 },
  { id: 'q3_08', text: 'What is "cyberbullying"?', options: ['Playing video games for too long', 'Using technology (e.g. social media, messaging) to deliberately harass, threaten, or embarrass someone', 'Learning to type very fast on a keyboard', 'Building robots with computers'], correctAnswer: 'Using technology (e.g. social media, messaging) to deliberately harass, threaten, or embarrass someone', points: 10 },
  { id: 'q3_09', text: 'What should you do if a stranger online asks for your home address?', options: ['Give it to them if they seem friendly', 'Ignore or block them and tell a trusted adult immediately', 'Share it only if they ask nicely', 'Give a fake address so it\'s not a problem'], correctAnswer: 'Ignore or block them and tell a trusted adult immediately', points: 10 },
  { id: 'q3_10', text: 'What is "copyright"?', options: ['The right to copy any document freely from the internet', 'The legal right that protects the original work of creators (authors, musicians, programmers) from being copied without permission', 'A type of antivirus software', 'A way of printing multiple copies of a file'], correctAnswer: 'The legal right that protects the original work of creators (authors, musicians, programmers) from being copied without permission', points: 10 },
  { id: 'q3_11', text: 'What does a "firewall" do on a computer network?', options: ['Speeds up the internet connection', 'Monitors and controls incoming and outgoing network traffic to block threats', 'Stores backup copies of files', 'Sends emails automatically'], correctAnswer: 'Monitors and controls incoming and outgoing network traffic to block threats', points: 10 },
  { id: 'q3_12', text: 'What is "bandwidth" in computer networking?', options: ['The physical size of the network cable', 'The amount of data that can be transmitted over a network in a given time', 'The number of devices connected to a network', 'The cost of using the internet'], correctAnswer: 'The amount of data that can be transmitted over a network in a given time', points: 10 },
  { id: 'q3_13', text: 'Which of the following is an example of responsible digital citizenship?', options: ['Sharing your passwords with friends so they can help you online', 'Posting other people\'s private photos without asking them', 'Citing sources when you use information you found online', 'Downloading movies illegally to save money'], correctAnswer: 'Citing sources when you use information you found online', points: 10 },
  { id: 'q3_14', text: 'What does "encryption" mean in the context of data security?', options: ['Making a file very large', 'Converting data into a coded format so only authorised people can read it', 'Deleting data permanently from a hard drive', 'Sharing data with multiple users at once'], correctAnswer: 'Converting data into a coded format so only authorised people can read it', points: 10 },
  { id: 'q3_15', text: 'What is "cloud computing"?', options: ['Computing done during cloudy weather', 'Storing and accessing programs and data over the internet instead of on your local hard drive', 'A type of weather forecasting software', 'Using a very powerful gaming computer'], correctAnswer: 'Storing and accessing programs and data over the internet instead of on your local hard drive', points: 10 },
]

async function seed() {
  console.log('🌱 Finding Grade 6 Computing subject...')

  const { data: subjects, error: subErr } = await supabase
    .from('subjects')
    .select('id, name')
    .ilike('name', 'G6%')

  if (subErr) { console.error('❌ Error fetching subjects:', subErr); return }

  console.log('📚 Found subjects:', subjects?.map(s => s.name))

  const computingSubject = subjects?.find(s =>
    s.name.toLowerCase().includes('computing') ||
    s.name.toLowerCase().includes('ict') ||
    s.name.toLowerCase().includes('computer')
  )

  if (!computingSubject) {
    console.log('⚠️  Grade 6 Computing subject not found. Available subjects:')
    subjects?.forEach(s => console.log('  -', s.name))
    return
  }

  console.log(`✅ Found subject: "${computingSubject.name}" (ID: ${computingSubject.id})`)

  const quizzes = [
    {
      title: '📊 G6 Computing: Spreadsheets & Data Mastery',
      description: 'Advanced quiz covering spreadsheet formulas (SUM, AVERAGE, MAX), charts, data filtering, sorting, databases, and data validation for Grade 6 students.',
      duration_minutes: 20,
      subject_id: computingSubject.id,
      school_id: null,
      is_published: true,
      content: { questions: quiz1Questions }
    },
    {
      title: '🤖 G6 Computing: Programming Logic & Algorithms',
      description: 'Complex quiz on algorithms, flowcharts, Scratch programming, variables, loops, conditionals, debugging, and the four pillars of computational thinking.',
      duration_minutes: 20,
      subject_id: computingSubject.id,
      school_id: null,
      is_published: true,
      content: { questions: quiz2Questions }
    },
    {
      title: '🌐 G6 Computing: Networks, Internet Safety & Digital Citizenship',
      description: 'Challenging quiz on LAN vs WAN, routers, IP addresses, cybersecurity threats (phishing, cyberbullying), strong passwords, encryption, copyright, and cloud computing.',
      duration_minutes: 20,
      subject_id: computingSubject.id,
      school_id: null,
      is_published: true,
      content: { questions: quiz3Questions }
    }
  ]

  console.log(`\n🚀 Inserting ${quizzes.length} Grade 6 Computing quizzes...`)
  const { error } = await supabase.from('global_quizzes').insert(quizzes)

  if (error) {
    console.error('❌ Insert error:', JSON.stringify(error, null, 2))
  } else {
    console.log('✅ Done! 3 complex Grade 6 Computing quizzes are now live.')
    console.log('   📊 Spreadsheets & Data Mastery (15 questions, 20 min)')
    console.log('   🤖 Programming Logic & Algorithms (15 questions, 20 min)')
    console.log('   🌐 Networks, Internet Safety & Digital Citizenship (15 questions, 20 min)')
  }
}

seed()
