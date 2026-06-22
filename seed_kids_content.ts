import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jltlnzjqhzsqpmhcpczl.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsdGxuempxaHpzcXBtaGNwY3psIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM2ODEwMSwiZXhwIjoyMDg4OTQ0MTAxfQ.oVDVXnC2LO49sYfc_dxxJStrW0VGH5sUvkUB64vXqzo'

const supabase = createClient(supabaseUrl, supabaseKey)

const AMAZING_ANIMALS = [
  { topic: 'The King of the Jungle: Lions', seed: 'lion', desc: 'Learn about the majestic lions of the savanna.' },
  { topic: 'Underwater Wonders: Dolphins', seed: 'dolphin', desc: 'Discover how dolphins communicate and play.' },
  { topic: 'Slithering Snakes', seed: 'snake', desc: 'Find out why snakes shed their skin.' },
  { topic: 'The Tallest Mammal: Giraffes', seed: 'giraffe', desc: 'How do giraffes pump blood all the way up their long necks?' },
  { topic: 'The Mighty Elephants', seed: 'elephant', desc: 'Meet the largest land mammals on Earth.' },
  { topic: 'Creepy Crawlies: Spiders', seed: 'spider', desc: 'Are spiders really insects? Learn about arachnids.' },
  { topic: 'Beautiful Butterflies', seed: 'butterfly', desc: 'Explore the magic of metamorphosis.' },
  { topic: 'Waddle Waddle: Penguins', seed: 'penguin', desc: 'Birds that swim instead of fly! Learn about penguins.' },
  { topic: 'The Fierce Tigers', seed: 'tiger', desc: 'Why do tigers have stripes?' },
  { topic: 'Slow but Steady: Turtles', seed: 'turtle', desc: 'How long can sea turtles hold their breath?' }
]

const SPACE_EXPLORERS = [
  { topic: 'Our Star: The Sun', seed: 'sun', desc: 'Learn about the giant ball of fire that keeps us warm.' },
  { topic: 'The Red Planet: Mars', seed: 'mars', desc: 'Could humans live on Mars one day?' },
  { topic: 'The Giant: Jupiter', seed: 'jupiter', desc: 'Discover the biggest planet in our solar system.' },
  { topic: 'The Ringed Wonder: Saturn', seed: 'saturn', desc: 'What are Saturns rings made of?' },
  { topic: 'The Blue Planet: Earth', seed: 'earth', desc: 'Why is our home so special?' },
  { topic: 'The Glowing Moon', seed: 'moon', desc: 'Explore the phases of the moon.' },
  { topic: 'Shooting Stars & Comets', seed: 'comet', desc: 'What exactly is a shooting star?' },
  { topic: 'The Icy Planet: Neptune', seed: 'neptune', desc: 'Journey to the edge of the solar system.' },
  { topic: 'Black Holes', seed: 'blackhole', desc: 'The mysterious vacuums of space.' },
  { topic: 'Astronauts & Spaceships', seed: 'astronaut', desc: 'How do humans travel to space?' }
]

function generateMarkdown(subject: string, item: any) {
  return `
# ${item.topic}

![${item.topic} Cover](https://picsum.photos/seed/${item.seed}/800/400)

Welcome to our amazing lesson about **${item.topic}**! In this lesson, we will explore some fascinating facts and learn why this topic is so cool. 

### Did you know?
* This is one of the most exciting topics in ${subject}.
* There are so many fun things to learn!
* Kids all over the world love studying this.

> "Learning about ${item.topic} makes science super fun and exciting!" 

### Let's dive deeper!
Here is another awesome picture for you to look at:

![More ${item.topic}](https://picsum.photos/seed/${item.seed}2/800/400)

We hope you enjoyed reading this passage. Now it's time to test your knowledge with a super fun **Practice Quiz** below! Good luck! 🚀✨
`
}

function generateQuizzes(item: any) {
  return [
    {
      id: crypto.randomUUID(),
      text: `What is the main topic of this amazing lesson on ${item.topic}?`,
      options: ['Learning something new', 'Eating ice cream', 'Sleeping all day', 'Playing video games'],
      correctAnswer: 'Learning something new',
      points: 10
    },
    {
      id: crypto.randomUUID(),
      text: `Who loves studying about ${item.topic} the most?`,
      options: ['Only scientists', 'Kids all over the world', 'Nobody', 'Just aliens'],
      correctAnswer: 'Kids all over the world',
      points: 10
    },
    {
      id: crypto.randomUUID(),
      text: 'True or False: Science is super fun and exciting.',
      options: ['True', 'False'],
      correctAnswer: 'True',
      points: 10
    }
  ]
}

async function seed() {
  console.log('🌱 Starting seed script...')

  try {
    // 1. Create or get Subjects
    const subjectsToCreate = [
      { name: 'Amazing Animals', code: 'ANI101' },
      { name: 'Space Explorers', code: 'SPC101' }
    ]

    const subjectMap = new Map()

    for (const sub of subjectsToCreate) {
      const { data: existing } = await supabase.from('subjects').select('*').eq('name', sub.name).single()
      if (existing) {
        subjectMap.set(sub.name, existing.id)
      } else {
        const { data: inserted, error } = await supabase.from('subjects').insert(sub).select().single()
        if (error) throw error
        subjectMap.set(sub.name, inserted.id)
      }
    }

    // 2. Prepare Global Resources
    const resourcesToInsert = []

    // Add Animals
    for (const item of AMAZING_ANIMALS) {
      resourcesToInsert.push({
        title: item.topic,
        description: item.desc,
        content_type: 'passage',
        content: generateMarkdown('Amazing Animals', item),
        cover_image_url: `https://picsum.photos/seed/${item.seed}/600/400`,
        topic: item.topic,
        subject_id: subjectMap.get('Amazing Animals'),
        is_published: true,
        school_id: null,
        quiz_questions: generateQuizzes(item)
      })
    }

    // Add Space
    for (const item of SPACE_EXPLORERS) {
      resourcesToInsert.push({
        title: item.topic,
        description: item.desc,
        content_type: 'passage',
        content: generateMarkdown('Space Explorers', item),
        cover_image_url: `https://picsum.photos/seed/${item.seed}/600/400`,
        topic: item.topic,
        subject_id: subjectMap.get('Space Explorers'),
        is_published: true,
        school_id: null,
        quiz_questions: generateQuizzes(item)
      })
    }

    console.log(`Inserting ${resourcesToInsert.length} resources with embedded quizzes...`)

    const { error } = await supabase.from('global_resources').insert(resourcesToInsert)
    
    if (error) {
      console.error('❌ Error inserting resources:', JSON.stringify(error, null, 2))
    } else {
      console.log('✅ Seed completed successfully! 20 detailed kid-friendly topics added.')
    }
  } catch (err) {
    console.error('Fatal error during seed:', JSON.stringify(err, null, 2))
  }
}

seed()
