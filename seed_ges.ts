import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jltlnzjqhzsqpmhcpczl.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsdGxuempxaHpzcXBtaGNwY3psIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM2ODEwMSwiZXhwIjoyMDg4OTQ0MTAxfQ.oVDVXnC2LO49sYfc_dxxJStrW0VGH5sUvkUB64vXqzo'

const supabase = createClient(supabaseUrl, supabaseKey)

const GES_SUBJECTS = [
  {
    name: 'GES English Language',
    code: 'GES-ENG',
    topics: [
      { title: 'Nouns and Pronouns', keyword: 'english,book', desc: 'Learn the naming words and their replacements.' },
      { title: 'Verbs and Adverbs', keyword: 'writing,pen', desc: 'Discover action words and how they are described.' },
      { title: 'Adjectives and Prepositions', keyword: 'grammar,school', desc: 'Add detail and position to your sentences.' },
      { title: 'Reading Comprehension', keyword: 'reading,book', desc: 'Improve your understanding of texts.' },
      { title: 'Essay Writing Basics', keyword: 'essay,writing', desc: 'Learn how to structure your thoughts.' }
    ]
  },
  {
    name: 'GES Mathematics',
    code: 'GES-MATH',
    topics: [
      { title: 'Numbers and Numerals', keyword: 'math,numbers', desc: 'Master the foundation of mathematics.' },
      { title: 'Fractions and Decimals', keyword: 'fractions,math', desc: 'Understanding parts of a whole.' },
      { title: 'Algebraic Expressions', keyword: 'algebra,school', desc: 'Introduction to letters in mathematics.' },
      { title: 'Basic Geometry', keyword: 'geometry,shapes', desc: 'Exploring shapes and properties.' },
      { title: 'Data Handling', keyword: 'data,chart', desc: 'Collecting, organizing, and analyzing data.' }
    ]
  },
  {
    name: 'GES Integrated Science',
    code: 'GES-SCI',
    topics: [
      { title: 'Matter and Energy', keyword: 'science,lab', desc: 'The building blocks of our universe.' },
      { title: 'The Human Body System', keyword: 'body,human', desc: 'How our amazing bodies work.' },
      { title: 'Plants and Photosynthesis', keyword: 'plants,nature', desc: 'How plants make their food.' },
      { title: 'The Solar System', keyword: 'solar,space', desc: 'Our neighborhood in space.' },
      { title: 'Mixtures and Compounds', keyword: 'chemistry,science', desc: 'Understanding chemical combinations.' }
    ]
  },
  {
    name: 'GES Social Studies',
    code: 'GES-SOC',
    topics: [
      { title: 'The Environment and Society', keyword: 'society,people', desc: 'How we interact with our surroundings.' },
      { title: 'Governance in Ghana', keyword: 'ghana,flag', desc: 'Understanding leadership and civics.' },
      { title: 'Our Culture and Heritage', keyword: 'culture,africa', desc: 'Celebrating our traditions.' },
      { title: 'Maps and Directions', keyword: 'map,compass', desc: 'Navigating our world.' },
      { title: 'History of Ghana', keyword: 'history,africa', desc: 'Learning from our past.' }
    ]
  },
  {
    name: 'GES Computing (ICT)',
    code: 'GES-ICT',
    topics: [
      { title: 'Introduction to Computers', keyword: 'computer,technology', desc: 'Basics of computer systems.' },
      { title: 'Input and Output Devices', keyword: 'keyboard,mouse', desc: 'How we interact with computers.' },
      { title: 'Using the Internet safely', keyword: 'internet,web', desc: 'Navigating the digital world.' },
      { title: 'Microsoft Word Basics', keyword: 'typing,word', desc: 'Creating text documents.' },
      { title: 'Computer Ethics', keyword: 'ethics,computer', desc: 'Doing the right thing online.' }
    ]
  },
  {
    name: 'GES RME',
    code: 'GES-RME',
    topics: [
      { title: 'Gods Creation', keyword: 'nature,creation', desc: 'Appreciating the world around us.' },
      { title: 'Family and Community', keyword: 'family,people', desc: 'Living together in harmony.' },
      { title: 'Religious Festivals', keyword: 'festival,celebration', desc: 'Understanding different celebrations.' },
      { title: 'Moral Values', keyword: 'values,respect', desc: 'Building good character.' },
      { title: 'Rites of Passage', keyword: 'passage,culture', desc: 'Important milestones in life.' }
    ]
  }
]

function generateMarkdown(subject: string, topic: string, keyword: string) {
  return `
# ${topic}

![${topic}](https://loremflickr.com/800/400/${keyword}?lock=${Math.floor(Math.random() * 1000)})

Welcome to this comprehensive lesson on **${topic}**, a key part of the **${subject}** syllabus.

### Lesson Objectives
* Understand the basic concepts of ${topic}.
* Apply these concepts to real-world scenarios.
* Prepare effectively for your continuous assessments and exams.

> "Education is the passport to the future, for tomorrow belongs to those who prepare for it today."

### Study Notes
Make sure to review this material carefully. The concepts covered here form the foundation for more advanced topics in the curriculum. 

![More ${topic}](https://loremflickr.com/800/400/${keyword}?lock=${Math.floor(Math.random() * 1000)})

Test your understanding using the practice quiz below!
`
}

function generateMiniQuiz(topic: string) {
  return [
    {
      id: crypto.randomUUID(),
      text: `What is a key objective of studying ${topic}?`,
      options: ['To prepare for exams', 'To waste time', 'To forget things', 'None of the above'],
      correctAnswer: 'To prepare for exams',
      points: 10
    },
    {
      id: crypto.randomUUID(),
      text: `True or False: The concepts in ${topic} form the foundation for advanced topics.`,
      options: ['True', 'False'],
      correctAnswer: 'True',
      points: 10
    },
    {
      id: crypto.randomUUID(),
      text: 'What is education compared to in this lesson?',
      options: ['A passport to the future', 'A burden', 'A punishment', 'A dream'],
      correctAnswer: 'A passport to the future',
      points: 10
    }
  ]
}

// Procedural standalone quiz generator
function generateStandaloneQuizzes(subjectName: string, topics: any[]) {
  const quizzes = []
  for (let i = 0; i < 3; i++) { // 3 standalone quizzes per GES subject
    const questions = []
    for (let j = 0; j < 10; j++) { // 10 questions per quiz
      const targetTopic = topics[j % topics.length]
      questions.push({
        id: crypto.randomUUID(),
        text: `Question ${j + 1}: Which of these relates to ${targetTopic.title}?`,
        options: ['The correct answer', 'A random distraction', 'An incorrect option', 'Another wrong choice'],
        correctAnswer: 'The correct answer',
        points: 10
      })
    }
    quizzes.push({
      title: `📝 ${subjectName} Practice Quiz ${i + 1}`,
      description: `Test your knowledge on the official GES curriculum for ${subjectName}.`,
      duration_minutes: 10,
      content: { questions }
    })
  }
  return quizzes
}


async function seed() {
  console.log('🌱 Starting GES curriculum seed script...')

  try {
    for (const sub of GES_SUBJECTS) {
      // 1. Create Subject
      let subjectId = null
      const { data: existing } = await supabase.from('subjects').select('*').eq('name', sub.name).single()
      
      if (existing) {
        subjectId = existing.id
      } else {
        const { data: inserted, error } = await supabase.from('subjects').insert({ name: sub.name, code: sub.code }).select().single()
        if (error) throw error
        subjectId = inserted.id
        console.log(`Created new subject: ${sub.name}`)
      }

      // 2. Insert Resources
      const resourcesToInsert = sub.topics.map(t => ({
        title: t.title,
        description: t.desc,
        content_type: 'passage',
        content: generateMarkdown(sub.name, t.title, t.keyword),
        cover_image_url: `https://loremflickr.com/800/400/${t.keyword}?lock=${Math.floor(Math.random() * 1000)}`,
        topic: t.title,
        subject_id: subjectId,
        is_published: true,
        school_id: null,
        quiz_questions: generateMiniQuiz(t.title)
      }))

      const { error: resError } = await supabase.from('global_resources').insert(resourcesToInsert)
      if (resError) console.error(`❌ Error inserting resources for ${sub.name}:`, resError)

      // 3. Insert Quizzes
      const quizzesToInsert = generateStandaloneQuizzes(sub.name, sub.topics).map(q => ({
        ...q,
        subject_id: subjectId,
        school_id: null,
        is_published: true
      }))

      const { error: quizError } = await supabase.from('global_quizzes').insert(quizzesToInsert)
      if (quizError) console.error(`❌ Error inserting quizzes for ${sub.name}:`, quizError)

      console.log(`✅ Seeded ${sub.name}: ${resourcesToInsert.length} resources, ${quizzesToInsert.length} quizzes.`)
    }

    console.log('🎉 GES Seed completed successfully!')

  } catch (err) {
    console.error('Fatal error during seed:', err)
  }
}

seed()
