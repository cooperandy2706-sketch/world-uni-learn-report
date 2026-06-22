import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jltlnzjqhzsqpmhcpczl.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsdGxuempxaHpzcXBtaGNwY3psIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM2ODEwMSwiZXhwIjoyMDg4OTQ0MTAxfQ.oVDVXnC2LO49sYfc_dxxJStrW0VGH5sUvkUB64vXqzo'

const supabase = createClient(supabaseUrl, supabaseKey)

const HISTORY_HUNTERS = [
  { topic: 'Ancient Egypt & Pyramids', seed: 'pyramid', desc: 'Discover the pharaohs and mummies of ancient Egypt.' },
  { topic: 'The Roman Empire', seed: 'rome', desc: 'Gladiators and emperors of ancient Rome.' },
  { topic: 'Pirates of the Caribbean', seed: 'pirate', desc: 'Ahoy matey! Learn about real-life pirates.' },
  { topic: 'Knights & Castles', seed: 'castle', desc: 'Step back into the Middle Ages.' },
  { topic: 'The Fierce Vikings', seed: 'viking', desc: 'Explorers from the cold north.' },
  { topic: 'Ancient Greece', seed: 'greece', desc: 'Gods, goddesses, and the first Olympics.' },
  { topic: 'The Samurai Warriors', seed: 'samurai', desc: 'The elite warriors of ancient Japan.' },
  { topic: 'The Maya Civilization', seed: 'maya', desc: 'The brilliant astronomers of Mesoamerica.' },
  { topic: 'The Wild West', seed: 'cowboy', desc: 'Cowboys and pioneers of the American frontier.' },
  { topic: 'The Stone Age', seed: 'caveman', desc: 'How the first humans lived and survived.' }
]

const EARTH_ENVIRONMENT = [
  { topic: 'Explosive Volcanoes', seed: 'volcano', desc: 'How do mountains erupt with fire?' },
  { topic: 'The Deep Ocean', seed: 'ocean', desc: 'What lurks in the deepest parts of the sea?' },
  { topic: 'Tropical Rainforests', seed: 'rainforest', desc: 'The lungs of the Earth.' },
  { topic: 'Hot Dry Deserts', seed: 'desert', desc: 'How animals survive without water.' },
  { topic: 'Shaking Earthquakes', seed: 'earthquake', desc: 'Why does the ground shake?' },
  { topic: 'Wild Weather', seed: 'tornado', desc: 'Tornadoes, hurricanes, and thunderstorms.' },
  { topic: 'Reduce, Reuse, Recycle', seed: 'recycle', desc: 'How we can save our planet.' },
  { topic: 'Majestic Mountains', seed: 'mountain', desc: 'The tallest peaks in the world.' },
  { topic: 'Raging Rivers', seed: 'river', desc: 'How water shapes the land.' },
  { topic: 'Icy Glaciers', seed: 'glacier', desc: 'Giant rivers of slow-moving ice.' }
]

const SCIENCE_MAGIC = [
  { topic: 'Magnetic Pull', seed: 'magnet', desc: 'How do magnets work?' },
  { topic: 'Zap! Electricity', seed: 'electricity', desc: 'The invisible power that runs our homes.' },
  { topic: 'Gravity Keeps Us Grounded', seed: 'gravity', desc: 'Why what goes up must come down.' },
  { topic: 'The Speed of Light', seed: 'lightbulb', desc: 'How fast is light and how does it bend?' },
  { topic: 'Sound Waves', seed: 'sound', desc: 'How we hear the world around us.' },
  { topic: 'Solid, Liquid, Gas', seed: 'ice', desc: 'The three states of matter.' },
  { topic: 'Crazy Chemistry', seed: 'chemistry', desc: 'Mixing things together to see what happens.' },
  { topic: 'Friction in Action', seed: 'friction', desc: 'Why things slow down when they rub together.' },
  { topic: 'How Plants Grow', seed: 'plant', desc: 'The magic of photosynthesis.' },
  { topic: 'The Building Blocks of Life', seed: 'dna', desc: 'What makes you, you? Discover DNA.' }
]

const MATH_MYSTERIES = [
  { topic: 'Fun with Fractions', seed: 'pizza', desc: 'Sharing pizza and learning math.' },
  { topic: 'Awesome Geometry', seed: 'shapes', desc: 'Shapes are everywhere!' },
  { topic: 'Fast Addition', seed: 'abacus', desc: 'Tips and tricks for adding quickly.' },
  { topic: 'Multiplication Magic', seed: 'calculator', desc: 'How to multiply like a superhero.' },
  { topic: 'Telling Time', seed: 'clock', desc: 'Reading the clock and understanding hours.' },
  { topic: 'Money Matters', seed: 'coins', desc: 'Counting coins and saving up.' },
  { topic: 'Finding Patterns', seed: 'pattern', desc: 'How math is the language of patterns.' },
  { topic: 'Logic Puzzles', seed: 'puzzle', desc: 'Train your brain with fun challenges.' },
  { topic: 'Algebra Basics for Kids', seed: 'math', desc: 'Solving for the unknown X.' },
  { topic: 'Measurement Masters', seed: 'ruler', desc: 'How tall, how heavy, how long?' }
]

const GLOBAL_CULTURES = [
  { topic: 'Journey to Japan', seed: 'tokyo', desc: 'Sushi, bullet trains, and cherry blossoms.' },
  { topic: 'Fabulous France', seed: 'paris', desc: 'The Eiffel Tower and delicious pastries.' },
  { topic: 'Beautiful Brazil', seed: 'brazil', desc: 'The Amazon and the Carnival festival.' },
  { topic: 'Incredible India', seed: 'india', desc: 'The Taj Mahal and colorful festivals.' },
  { topic: 'Amazing Australia', seed: 'kangaroo', desc: 'Kangaroos, koalas, and the Outback.' },
  { topic: 'Magical Mexico', seed: 'mexico', desc: 'Pyramids, mariachi, and spicy food.' },
  { topic: 'Discovering Kenya', seed: 'safari', desc: 'The beautiful savannas and wildlife.' },
  { topic: 'Exploring China', seed: 'china', desc: 'The Great Wall and giant pandas.' },
  { topic: 'Iconic Italy', seed: 'italy', desc: 'Pizza, pasta, and ancient ruins.' },
  { topic: 'A Trip to Egypt', seed: 'camel', desc: 'The Nile River and bustling bazaars.' }
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

> "Learning about ${item.topic} makes studying super fun and exciting!" 

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
      text: 'True or False: This subject is super fun and exciting.',
      options: ['True', 'False'],
      correctAnswer: 'True',
      points: 10
    }
  ]
}

const ALL_NEW_SUBJECTS = [
  { meta: { name: 'History Hunters', code: 'HIS101' }, items: HISTORY_HUNTERS },
  { meta: { name: 'Earth & Environment', code: 'ENV101' }, items: EARTH_ENVIRONMENT },
  { meta: { name: 'Science Magic', code: 'SCI101' }, items: SCIENCE_MAGIC },
  { meta: { name: 'Math Mysteries', code: 'MTH101' }, items: MATH_MYSTERIES },
  { meta: { name: 'Global Cultures', code: 'GEO101' }, items: GLOBAL_CULTURES }
]

async function seed() {
  console.log('🌱 Starting seed script for 5 new subjects (50 topics total)...')

  try {
    const subjectMap = new Map()

    for (const group of ALL_NEW_SUBJECTS) {
      const sub = group.meta
      const { data: existing } = await supabase.from('subjects').select('*').eq('name', sub.name).single()
      if (existing) {
        subjectMap.set(sub.name, existing.id)
      } else {
        const { data: inserted, error } = await supabase.from('subjects').insert(sub).select().single()
        if (error) throw error
        subjectMap.set(sub.name, inserted.id)
      }
    }

    const resourcesToInsert = []

    for (const group of ALL_NEW_SUBJECTS) {
      const subjectId = subjectMap.get(group.meta.name)
      for (const item of group.items) {
        resourcesToInsert.push({
          title: item.topic,
          description: item.desc,
          content_type: 'passage',
          content: generateMarkdown(group.meta.name, item),
          cover_image_url: `https://picsum.photos/seed/${item.seed}/600/400`,
          topic: item.topic,
          subject_id: subjectId,
          is_published: true,
          school_id: null,
          quiz_questions: generateQuizzes(item)
        })
      }
    }

    console.log(`Inserting ${resourcesToInsert.length} resources with embedded quizzes...`)

    const { error } = await supabase.from('global_resources').insert(resourcesToInsert)
    
    if (error) {
      console.error('❌ Error inserting resources:', JSON.stringify(error, null, 2))
    } else {
      console.log('✅ Seed completed successfully! 50 detailed kid-friendly topics added.')
    }
  } catch (err) {
    console.error('Fatal error during seed:', JSON.stringify(err, null, 2))
  }
}

seed()
