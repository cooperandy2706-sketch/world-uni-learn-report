import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jltlnzjqhzsqpmhcpczl.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsdGxuempxaHpzcXBtaGNwY3psIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM2ODEwMSwiZXhwIjoyMDg4OTQ0MTAxfQ.oVDVXnC2LO49sYfc_dxxJStrW0VGH5sUvkUB64vXqzo'

const supabase = createClient(supabaseUrl, supabaseKey)

const CODING_TOPICS = [
  { topic: 'Intro to HTML', keyword: 'html,code', desc: 'Learn the building blocks of the web.' },
  { topic: 'Styling with CSS', keyword: 'css,design', desc: 'Make your websites look beautiful.' },
  { topic: 'JavaScript Basics', keyword: 'javascript,code', desc: 'Add interactivity and logic to your pages.' },
  { topic: 'Fast Web Apps with Vite', keyword: 'vite,technology', desc: 'Learn how to bundle and build web apps instantly.' },
  { topic: 'Building UIs with React', keyword: 'react,programming', desc: 'Create complex, reusable user interfaces.' },
  { topic: 'Backend with Node.js', keyword: 'nodejs,server', desc: 'Run JavaScript on the server.' },
  { topic: 'Python Programming', keyword: 'python,code', desc: 'A versatile language for everything from web to AI.' },
  { topic: 'Version Control with Git', keyword: 'git,technology', desc: 'Track your changes and collaborate with others.' },
  { topic: 'Type Safety with TypeScript', keyword: 'typescript,code', desc: 'Catch bugs early by adding types to JavaScript.' },
  { topic: 'Databases with SQL', keyword: 'sql,database', desc: 'Store and retrieve your application data.' }
]

function generateMarkdown(topic: string, keyword: string) {
  return `
# ${topic}

![${topic} Cover](https://loremflickr.com/800/400/${keyword}?lock=${Math.floor(Math.random() * 1000)})

Welcome to the lesson on **${topic}**! In this guide, we'll dive deep into the fundamental concepts you need to know.

### Why is this important?
* It is a core skill in modern software development.
* Top tech companies around the world rely on it.
* It empowers you to build your own projects from scratch.

> "Learning to code is like gaining a superpower. You can build anything you imagine!" 

### Let's dive deeper!
Here is another awesome illustration of this technology in action:

![More ${topic}](https://loremflickr.com/800/400/${keyword}?lock=${Math.floor(Math.random() * 1000)})

We hope you found this introduction helpful. Practice is key to mastering programming, so make sure to write some code today. Take the mini-quiz below to test what you've learned! 🚀💻
`
}

function generateMiniQuiz(topic: string) {
  return [
    {
      id: crypto.randomUUID(),
      text: `What is the primary purpose of ${topic}?`,
      options: ['Building software/web apps', 'Cooking food', 'Driving cars', 'Flying airplanes'],
      correctAnswer: 'Building software/web apps',
      points: 10
    },
    {
      id: crypto.randomUUID(),
      text: `True or False: Practice is essential to master ${topic}.`,
      options: ['True', 'False'],
      correctAnswer: 'True',
      points: 10
    },
    {
      id: crypto.randomUUID(),
      text: 'What is learning to code compared to in this lesson?',
      options: ['A superpower', 'A chore', 'A magic trick', 'A boring task'],
      correctAnswer: 'A superpower',
      points: 10
    }
  ]
}

const CODING_QUIZ_BANKS = [
  {
    title: '🌐 HTML & CSS Masterclass',
    desc: 'Test your knowledge of web structure and styling.',
    duration: 10,
    questions: [
      { text: 'What does HTML stand for?', options: ['HyperText Markup Language', 'HyperText Machine Language', 'HyperLink Markup Language', 'HyperTool Multi Language'], correctAnswer: 'HyperText Markup Language', points: 10 },
      { text: 'Which HTML tag is used for the largest heading?', options: ['<head>', '<h6>', '<heading>', '<h1>'], correctAnswer: '<h1>', points: 10 },
      { text: 'What does CSS stand for?', options: ['Cascading Style Sheets', 'Computer Style Sheets', 'Creative Style Sheets', 'Colorful Style Sheets'], correctAnswer: 'Cascading Style Sheets', points: 10 },
      { text: 'Which property is used to change the background color?', options: ['color', 'bgcolor', 'background-color', 'bg-color'], correctAnswer: 'background-color', points: 10 },
      { text: 'Which HTML tag is used to define an internal style sheet?', options: ['<style>', '<css>', '<script>', '<link>'], correctAnswer: '<style>', points: 10 },
      { text: 'How do you create a hyperlink in HTML?', options: ['<a url="http://www.test.com">', '<a href="http://www.test.com">', '<a>http://www.test.com</a>', '<link href="http://www.test.com">'], correctAnswer: '<a href="http://www.test.com">', points: 10 },
      { text: 'Which CSS property controls text size?', options: ['text-style', 'font-size', 'text-size', 'font-style'], correctAnswer: 'font-size', points: 10 },
      { text: 'How do you select an element with id "demo" in CSS?', options: ['.demo', 'demo', '#demo', '*demo'], correctAnswer: '#demo', points: 10 },
      { text: 'Which HTML tag makes text bold?', options: ['<b>', '<bold>', '<bb>', '<bld>'], correctAnswer: '<b>', points: 10 },
      { text: 'What is the correct CSS syntax to make all <p> elements bold?', options: ['p {text-size:bold;}', 'p {font-weight:bold;}', '<p style="text-size:bold;">', 'p {font-style:bold;}'], correctAnswer: 'p {font-weight:bold;}', points: 10 }
    ]
  },
  {
    title: '⚡ JavaScript Fundamentals',
    desc: 'How well do you know the language of the web?',
    duration: 15,
    questions: [
      { text: 'Inside which HTML element do we put JavaScript?', options: ['<js>', '<javascript>', '<scripting>', '<script>'], correctAnswer: '<script>', points: 10 },
      { text: 'Where is the correct place to insert a JavaScript?', options: ['The <body> section', 'The <head> section', 'Both the <head> section and the <body> section are correct', 'None of the above'], correctAnswer: 'Both the <head> section and the <body> section are correct', points: 10 },
      { text: 'How do you write "Hello World" in an alert box?', options: ['msgBox("Hello World");', 'alert("Hello World");', 'msg("Hello World");', 'alertBox("Hello World");'], correctAnswer: 'alert("Hello World");', points: 10 },
      { text: 'How do you create a function in JavaScript?', options: ['function myFunction()', 'function = myFunction()', 'function:myFunction()', 'create myFunction()'], correctAnswer: 'function myFunction()', points: 10 },
      { text: 'How to write an IF statement in JavaScript?', options: ['if i = 5', 'if i == 5 then', 'if (i == 5)', 'if i = 5 then'], correctAnswer: 'if (i == 5)', points: 10 },
      { text: 'How does a WHILE loop start?', options: ['while i = 1 to 10', 'while (i <= 10)', 'while (i <= 10; i++)', 'while i < 10'], correctAnswer: 'while (i <= 10)', points: 10 },
      { text: 'How can you add a comment in a JavaScript?', options: ['<!--This is a comment-->', '//This is a comment', '\'This is a comment', '* This is a comment *'], correctAnswer: '//This is a comment', points: 10 },
      { text: 'What is the correct way to write a JavaScript array?', options: ['var colors = 1 = ("red"), 2 = ("green")', 'var colors = "red", "green"', 'var colors = (1:"red", 2:"green")', 'var colors = ["red", "green"]'], correctAnswer: 'var colors = ["red", "green"]', points: 10 },
      { text: 'Which operator is used to assign a value to a variable?', options: ['x', '*', '-', '='], correctAnswer: '=', points: 10 },
      { text: 'What will typeof "John" return?', options: ['string', 'number', 'boolean', 'undefined'], correctAnswer: 'string', points: 10 },
      { text: 'Which keyword is used to declare a block-scoped variable?', options: ['var', 'let', 'set', 'def'], correctAnswer: 'let', points: 10 }
    ]
  },
  {
    title: '🛠️ Modern Web Dev (Vite & React)',
    desc: 'Dive into modern frontend tooling and frameworks.',
    duration: 12,
    questions: [
      { text: 'What is React?', options: ['A CSS framework', 'A JavaScript library for building user interfaces', 'A database', 'A web server'], correctAnswer: 'A JavaScript library for building user interfaces', points: 10 },
      { text: 'Who developed React?', options: ['Google', 'Facebook (Meta)', 'Microsoft', 'Twitter'], correctAnswer: 'Facebook (Meta)', points: 10 },
      { text: 'What is a component in React?', options: ['A CSS class', 'A database table', 'An independent, reusable piece of UI', 'A build tool'], correctAnswer: 'An independent, reusable piece of UI', points: 10 },
      { text: 'What is Vite?', options: ['A state management tool', 'A fast frontend build tool', 'A React alternative', 'A backend framework'], correctAnswer: 'A fast frontend build tool', points: 10 },
      { text: 'Why is Vite faster than Webpack?', options: ['It uses native ES modules during development', 'It skips building entirely', 'It runs in C++', 'It ignores CSS'], correctAnswer: 'It uses native ES modules during development', points: 10 },
      { text: 'What is JSX?', options: ['A database query language', 'A syntax extension for JavaScript', 'A new HTML version', 'A CSS preprocessor'], correctAnswer: 'A syntax extension for JavaScript', points: 10 },
      { text: 'Which React hook is used to manage state?', options: ['useEffect', 'useContext', 'useState', 'useReducer'], correctAnswer: 'useState', points: 10 },
      { text: 'How do you pass data to a child component in React?', options: ['Using state', 'Using props', 'Using contexts', 'Using global variables'], correctAnswer: 'Using props', points: 10 },
      { text: 'What command creates a new Vite project?', options: ['create-react-app', 'npm create vite@latest', 'vite init', 'npm run build'], correctAnswer: 'npm create vite@latest', points: 10 },
      { text: 'Which lifecycle hook runs after the component renders?', options: ['useState', 'useMemo', 'useEffect', 'useCallback'], correctAnswer: 'useEffect', points: 10 }
    ]
  },
  {
    title: '💻 Programming & Tools',
    desc: 'Test your knowledge on Git, Python, and SQL.',
    duration: 15,
    questions: [
      { text: 'What is Git?', options: ['A text editor', 'A version control system', 'A programming language', 'A web browser'], correctAnswer: 'A version control system', points: 10 },
      { text: 'Which command is used to save changes in Git?', options: ['git save', 'git push', 'git commit', 'git add'], correctAnswer: 'git commit', points: 10 },
      { text: 'What does SQL stand for?', options: ['Structured Query Language', 'Simple Question Language', 'Strong Query Language', 'Structured Question Language'], correctAnswer: 'Structured Query Language', points: 10 },
      { text: 'Which SQL statement is used to extract data from a database?', options: ['EXTRACT', 'GET', 'SELECT', 'PULL'], correctAnswer: 'SELECT', points: 10 },
      { text: 'What is Python primarily known for?', options: ['Its complex syntax', 'Being a low-level language', 'Its readability and versatility', 'Being used only for web design'], correctAnswer: 'Its readability and versatility', points: 10 },
      { text: 'How do you print a message in Python?', options: ['console.log("Hello")', 'print("Hello")', 'echo "Hello"', 'System.out.print("Hello")'], correctAnswer: 'print("Hello")', points: 10 },
      { text: 'What is the correct file extension for Python files?', options: ['.pt', '.pyt', '.py', '.python'], correctAnswer: '.py', points: 10 },
      { text: 'What is a repository in Git?', options: ['A folder where Git tracks changes', 'A deleted file', 'A user manual', 'A server name'], correctAnswer: 'A folder where Git tracks changes', points: 10 },
      { text: 'Which SQL statement is used to update data?', options: ['SAVE', 'MODIFY', 'UPDATE', 'CHANGE'], correctAnswer: 'UPDATE', points: 10 },
      { text: 'In Python, what is a list?', options: ['A function', 'An ordered, mutable collection of items', 'A variable name', 'An error type'], correctAnswer: 'An ordered, mutable collection of items', points: 10 },
      { text: 'What command uploads local Git commits to a remote repository?', options: ['git pull', 'git fetch', 'git upload', 'git push'], correctAnswer: 'git push', points: 10 }
    ]
  },
  {
    title: '🔐 TypeScript & Node.js',
    desc: 'Explore typed JavaScript and server-side runtimes.',
    duration: 10,
    questions: [
      { text: 'What is Node.js?', options: ['A frontend framework', 'A JavaScript runtime built on Chrome\'s V8 engine', 'A database', 'A CSS library'], correctAnswer: 'A JavaScript runtime built on Chrome\'s V8 engine', points: 10 },
      { text: 'What does npm stand for?', options: ['Node Package Manager', 'New Programming Method', 'Node Process Module', 'Network Protocol Manager'], correctAnswer: 'Node Package Manager', points: 10 },
      { text: 'What is TypeScript?', options: ['A replacement for HTML', 'A strongly typed superset of JavaScript', 'A database language', 'A new browser'], correctAnswer: 'A strongly typed superset of JavaScript', points: 10 },
      { text: 'Who developed TypeScript?', options: ['Google', 'Microsoft', 'Apple', 'Facebook'], correctAnswer: 'Microsoft', points: 10 },
      { text: 'Which file extension is used for TypeScript files?', options: ['.js', '.tsx', '.ts', '.txt'], correctAnswer: '.ts', points: 10 },
      { text: 'What command compiles a TypeScript file?', options: ['node file.ts', 'npm run file', 'tsc file.ts', 'compile file.ts'], correctAnswer: 'tsc file.ts', points: 10 },
      { text: 'In Node.js, how do you import a module using CommonJS?', options: ['import module from "module"', 'require("module")', 'include "module"', 'load("module")'], correctAnswer: 'require("module")', points: 10 },
      { text: 'What is the purpose of package.json?', options: ['To style the app', 'To store project metadata and dependencies', 'To write database queries', 'To define HTML structure'], correctAnswer: 'To store project metadata and dependencies', points: 10 },
      { text: 'Which TypeScript type allows any kind of value?', options: ['unknown', 'string', 'any', 'void'], correctAnswer: 'any', points: 10 },
      { text: 'What is an Interface in TypeScript?', options: ['A visual UI element', 'A way to define the shape of an object', 'A function', 'An error message'], correctAnswer: 'A way to define the shape of an object', points: 10 }
    ]
  }
]


async function seed() {
  console.log('🌱 Starting Coding subject seed script...')

  try {
    // 1. Create or get "Coding & Technology" Subject
    const subjectData = { name: 'Coding & Technology', code: 'TECH101' }
    let subjectId = null

    const { data: existing } = await supabase.from('subjects').select('*').eq('name', subjectData.name).single()
    
    if (existing) {
      subjectId = existing.id
    } else {
      const { data: inserted, error } = await supabase.from('subjects').insert(subjectData).select().single()
      if (error) throw error
      subjectId = inserted.id
      console.log('Created new subject: Coding & Technology')
    }

    // 2. Prepare Global Resources (Study Materials)
    const resourcesToInsert = []

    for (const item of CODING_TOPICS) {
      resourcesToInsert.push({
        title: item.topic,
        description: item.desc,
        content_type: 'passage',
        content: generateMarkdown(item.topic, item.keyword),
        cover_image_url: `https://loremflickr.com/800/400/${item.keyword}?lock=${Math.floor(Math.random() * 1000)}`,
        topic: item.topic,
        subject_id: subjectId,
        is_published: true,
        school_id: null,
        quiz_questions: generateMiniQuiz(item.topic)
      })
    }

    console.log(`Inserting ${resourcesToInsert.length} coding resources...`)
    const { error: resError } = await supabase.from('global_resources').insert(resourcesToInsert)
    if (resError) {
      console.error('❌ Error inserting resources:', JSON.stringify(resError, null, 2))
    } else {
      console.log('✅ 10 Coding resources added.')
    }

    // 3. Prepare Global Quizzes (Standalone)
    const quizzesToInsert = []

    for (const quiz of CODING_QUIZ_BANKS) {
      quizzesToInsert.push({
        title: quiz.title,
        description: quiz.desc,
        duration_minutes: quiz.duration,
        subject_id: subjectId,
        school_id: null,
        is_published: true,
        content: {
          questions: quiz.questions.map((q, qIdx) => ({
            id: `q${qIdx}_${Math.random().toString(36).slice(2, 7)}`,
            text: q.text,
            options: q.options,
            correctAnswer: q.correctAnswer,
            points: q.points
          }))
        }
      })
    }

    console.log(`Inserting ${quizzesToInsert.length} coding quizzes...`)
    const { error: quizError } = await supabase.from('global_quizzes').insert(quizzesToInsert)
    
    if (quizError) {
      console.error('❌ Error inserting quizzes:', JSON.stringify(quizError, null, 2))
    } else {
      console.log(`✅ 5 Coding quizzes added.`)
    }

    console.log('🎉 Seed completed successfully!')

  } catch (err) {
    console.error('Fatal error during seed:', JSON.stringify(err, null, 2))
  }
}

seed()
