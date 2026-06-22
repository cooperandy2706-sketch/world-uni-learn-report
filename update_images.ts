import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jltlnzjqhzsqpmhcpczl.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsdGxuempxaHpzcXBtaGNwY3psIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM2ODEwMSwiZXhwIjoyMDg4OTQ0MTAxfQ.oVDVXnC2LO49sYfc_dxxJStrW0VGH5sUvkUB64vXqzo'

const supabase = createClient(supabaseUrl, supabaseKey)

const TOPIC_TO_KEYWORD: Record<string, string> = {
  'The King of the Jungle: Lions': 'lion,safari',
  'Underwater Wonders: Dolphins': 'dolphin,ocean',
  'Slithering Snakes': 'snake,reptile',
  'The Tallest Mammal: Giraffes': 'giraffe,safari',
  'The Mighty Elephants': 'elephant,safari',
  'Creepy Crawlies: Spiders': 'spider,insect',
  'Beautiful Butterflies': 'butterfly,nature',
  'Waddle Waddle: Penguins': 'penguin,ice',
  'The Fierce Tigers': 'tiger,wildlife',
  'Slow but Steady: Turtles': 'turtle,ocean',
  'Our Star: The Sun': 'sun,space',
  'The Red Planet: Mars': 'mars,planet',
  'The Giant: Jupiter': 'jupiter,planet',
  'The Ringed Wonder: Saturn': 'saturn,planet',
  'The Blue Planet: Earth': 'earth,space',
  'The Glowing Moon': 'moon,night',
  'Shooting Stars & Comets': 'comet,space',
  'The Icy Planet: Neptune': 'neptune,planet',
  'Black Holes': 'blackhole,space',
  'Astronauts & Spaceships': 'astronaut,spaceship'
}

function extractKeyword(title: string): string {
  if (TOPIC_TO_KEYWORD[title]) return TOPIC_TO_KEYWORD[title]
  // Fallback: extract last significant word
  const words = title.split(/[ :]+/)
  let lastWord = words[words.length - 1]
  if (lastWord.toLowerCase() === 'quiz' || lastWord.toLowerCase() === 'challenge') {
    lastWord = words[words.length - 2]
  }
  return lastWord.toLowerCase() + ',nature'
}

async function updateImages() {
  console.log('🖼️  Starting dynamic image update script...')

  const { data: resources, error } = await supabase
    .from('global_resources')
    .select('id, title, content, cover_image_url')
    .like('cover_image_url', '%picsum.photos%')

  if (error) {
    console.error('Error fetching resources:', error)
    return
  }

  console.log(`Found ${resources?.length || 0} resources to update.`)

  for (const res of resources || []) {
    const keyword = extractKeyword(res.title)
    
    // Use loremflickr for beautiful relevant images based on keywords
    const coverImg = `https://loremflickr.com/800/400/${keyword}?lock=${Math.floor(Math.random() * 1000)}`
    const contentImg = `https://loremflickr.com/800/400/${keyword}?lock=${Math.floor(Math.random() * 1000)}`

    // Replace images inside content
    const updatedContent = res.content.replace(/https:\/\/picsum\.photos\/seed\/[^/]+\/\d+\/\d+/g, contentImg)

    const { error: updateErr } = await supabase
      .from('global_resources')
      .update({
        cover_image_url: coverImg,
        content: updatedContent
      })
      .eq('id', res.id)

    if (updateErr) {
      console.error(`❌ Failed to update ${res.title}:`, updateErr)
    } else {
      console.log(`✅ Updated: ${res.title} (Keyword: ${keyword})`)
    }
  }

  console.log('🎉 Done updating all images!')
}

updateImages()
