import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jltlnzjqhzsqpmhcpczl.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsdGxuempxaHpzcXBtaGNwY3psIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM2ODEwMSwiZXhwIjoyMDg4OTQ0MTAxfQ.oVDVXnC2LO49sYfc_dxxJStrW0VGH5sUvkUB64vXqzo'

const supabase = createClient(supabaseUrl, supabaseKey)

const QUESTION_POOLS: Record<string, {text: string, options: string[], correctAnswer: string, points: number}[]> = {
  'Amazing Animals': [
    { text: 'What is the largest land animal on Earth?', options: ['Elephant', 'Giraffe', 'Hippo', 'Rhino'], correctAnswer: 'Elephant', points: 10 },
    { text: 'Which animal is known as the King of the Jungle?', options: ['Tiger', 'Lion', 'Leopard', 'Cheetah'], correctAnswer: 'Lion', points: 10 },
    { text: 'How many legs does a spider have?', options: ['6', '8', '10', '4'], correctAnswer: '8', points: 10 },
    { text: 'Which bird cannot fly?', options: ['Eagle', 'Penguin', 'Parrot', 'Sparrow'], correctAnswer: 'Penguin', points: 10 },
    { text: 'What do caterpillars turn into?', options: ['Moths only', 'Butterflies only', 'Butterflies or moths', 'Dragonflies'], correctAnswer: 'Butterflies or moths', points: 10 },
    { text: 'Where do polar bears live?', options: ['Antarctica', 'Arctic', 'Sahara Desert', 'Amazon'], correctAnswer: 'Arctic', points: 10 },
    { text: 'Which animal has the longest neck?', options: ['Elephant', 'Ostrich', 'Giraffe', 'Camel'], correctAnswer: 'Giraffe', points: 10 },
    { text: 'What is a baby kangaroo called?', options: ['Cub', 'Pup', 'Joey', 'Kid'], correctAnswer: 'Joey', points: 10 },
    { text: 'Which animal sleeps standing up?', options: ['Cow', 'Dog', 'Cat', 'Fish'], correctAnswer: 'Cow', points: 10 },
    { text: 'What do dolphins use to communicate?', options: ['Colors', 'Clicks and whistles', 'Sign language', 'They don\'t communicate'], correctAnswer: 'Clicks and whistles', points: 10 },
    { text: 'What is the fastest land animal?', options: ['Cheetah', 'Lion', 'Horse', 'Ostrich'], correctAnswer: 'Cheetah', points: 10 },
    { text: 'Which animal is known to have a trunk?', options: ['Rhino', 'Elephant', 'Hippo', 'Zebra'], correctAnswer: 'Elephant', points: 10 },
    { text: 'Which sea creature has eight arms?', options: ['Squid', 'Octopus', 'Starfish', 'Crab'], correctAnswer: 'Octopus', points: 10 },
    { text: 'What do you call a group of wolves?', options: ['Pack', 'Herd', 'School', 'Flock'], correctAnswer: 'Pack', points: 10 },
    { text: 'Which bird is a universal symbol of peace?', options: ['Crow', 'Dove', 'Eagle', 'Owl'], correctAnswer: 'Dove', points: 10 },
    { text: 'What do pandas mostly eat?', options: ['Meat', 'Bamboo', 'Fish', 'Insects'], correctAnswer: 'Bamboo', points: 10 },
    { text: 'Which animal can change its color to match its surroundings?', options: ['Chameleon', 'Lizard', 'Snake', 'Frog'], correctAnswer: 'Chameleon', points: 10 },
    { text: 'Which big cat is known for its stripes?', options: ['Lion', 'Leopard', 'Tiger', 'Panther'], correctAnswer: 'Tiger', points: 10 },
    { text: 'What type of animal is a frog?', options: ['Reptile', 'Amphibian', 'Mammal', 'Bird'], correctAnswer: 'Amphibian', points: 10 },
    { text: 'What kind of animal is a Komodo dragon?', options: ['Dinosaur', 'Lizard', 'Snake', 'Crocodile'], correctAnswer: 'Lizard', points: 10 },
  ],
  'Space Explorers': [
    { text: 'Which is the largest planet in our solar system?', options: ['Saturn', 'Uranus', 'Jupiter', 'Neptune'], correctAnswer: 'Jupiter', points: 10 },
    { text: 'How many planets are in our solar system?', options: ['7', '8', '9', '10'], correctAnswer: '8', points: 10 },
    { text: 'Which planet has rings around it?', options: ['Mars', 'Venus', 'Saturn', 'Mercury'], correctAnswer: 'Saturn', points: 10 },
    { text: 'What is the closest star to Earth?', options: ['Sirius', 'The Moon', 'The Sun', 'Polaris'], correctAnswer: 'The Sun', points: 10 },
    { text: 'Which planet is known as the Red Planet?', options: ['Venus', 'Mars', 'Jupiter', 'Pluto'], correctAnswer: 'Mars', points: 10 },
    { text: 'What do we call a rock from space that hits Earth?', options: ['Comet', 'Asteroid', 'Meteorite', 'Nebula'], correctAnswer: 'Meteorite', points: 10 },
    { text: 'Who was the first person to walk on the Moon?', options: ['Buzz Aldrin', 'Neil Armstrong', 'Yuri Gagarin', 'John Glenn'], correctAnswer: 'Neil Armstrong', points: 10 },
    { text: 'How long does it take Earth to go around the Sun?', options: ['One day', 'One month', 'One year', 'One decade'], correctAnswer: 'One year', points: 10 },
    { text: 'What is the Moon?', options: ['A planet', 'A star', 'A natural satellite', 'A comet'], correctAnswer: 'A natural satellite', points: 10 },
    { text: 'Which planet is closest to the Sun?', options: ['Venus', 'Earth', 'Mars', 'Mercury'], correctAnswer: 'Mercury', points: 10 },
    { text: 'Which galaxy is Earth located in?', options: ['Andromeda', 'Milky Way', 'Sombrero', 'Whirlpool'], correctAnswer: 'Milky Way', points: 10 },
    { text: 'What causes the tides on Earth?', options: ['The Sun', 'The Moon', 'The Wind', 'Earthquakes'], correctAnswer: 'The Moon', points: 10 },
    { text: 'Which planet is known for its Great Red Spot?', options: ['Mars', 'Jupiter', 'Saturn', 'Venus'], correctAnswer: 'Jupiter', points: 10 },
    { text: 'What is the hottest planet in our solar system?', options: ['Mercury', 'Venus', 'Mars', 'Jupiter'], correctAnswer: 'Venus', points: 10 },
    { text: 'Who was the first human in space?', options: ['Neil Armstrong', 'Yuri Gagarin', 'Alan Shepard', 'John Glenn'], correctAnswer: 'Yuri Gagarin', points: 10 },
    { text: 'What are stars mostly made of?', options: ['Rock', 'Lava', 'Hydrogen and Helium', 'Ice'], correctAnswer: 'Hydrogen and Helium', points: 10 },
    { text: 'Which planet is farthest from the Sun?', options: ['Uranus', 'Neptune', 'Saturn', 'Pluto (dwarf)'], correctAnswer: 'Neptune', points: 10 },
    { text: 'What do you call a person who travels to space?', options: ['Astronomer', 'Astrologer', 'Astronaut', 'Pilot'], correctAnswer: 'Astronaut', points: 10 },
    { text: 'What holds the planets in orbit around the Sun?', options: ['Magnetism', 'Gravity', 'Friction', 'Solar wind'], correctAnswer: 'Gravity', points: 10 },
    { text: 'What is a comet made of?', options: ['Ice, dust, and rock', 'Hot lava', 'Gas only', 'Metal'], correctAnswer: 'Ice, dust, and rock', points: 10 },
  ],
  'History Hunters': [
    { text: 'Which ancient wonder was located in Egypt?', options: ['Colosseum', 'Parthenon', 'Great Pyramid of Giza', 'Stonehenge'], correctAnswer: 'Great Pyramid of Giza', points: 10 },
    { text: 'Who was the famous female pharaoh of Egypt?', options: ['Nefertiti', 'Cleopatra', 'Hatshepsut', 'All of the above'], correctAnswer: 'All of the above', points: 10 },
    { text: 'In which city was the Colosseum built?', options: ['Athens', 'Rome', 'Carthage', 'Alexandria'], correctAnswer: 'Rome', points: 10 },
    { text: 'What were gladiators?', options: ['Roman soldiers', 'Fighters who entertained in arenas', 'Greek gods', 'Egyptian priests'], correctAnswer: 'Fighters who entertained in arenas', points: 10 },
    { text: 'Where did the Vikings come from?', options: ['Scotland', 'France', 'Scandinavia', 'Russia'], correctAnswer: 'Scandinavia', points: 10 },
    { text: 'What was the Great Wall of China built to protect against?', options: ['Floods', 'Invaders from the north', 'Wild animals', 'Earthquakes'], correctAnswer: 'Invaders from the north', points: 10 },
    { text: 'The first Olympic Games were held in which country?', options: ['Italy', 'Greece', 'Egypt', 'Rome'], correctAnswer: 'Greece', points: 10 },
    { text: 'Which explorer sailed to America in 1492?', options: ['Vasco da Gama', 'Ferdinand Magellan', 'Christopher Columbus', 'Marco Polo'], correctAnswer: 'Christopher Columbus', points: 10 },
    { text: 'Who invented the light bulb?', options: ['Thomas Edison', 'Nikola Tesla', 'Albert Einstein', 'Alexander Graham Bell'], correctAnswer: 'Thomas Edison', points: 10 },
    { text: 'Who painted the Mona Lisa?', options: ['Vincent van Gogh', 'Leonardo da Vinci', 'Pablo Picasso', 'Claude Monet'], correctAnswer: 'Leonardo da Vinci', points: 10 },
    { text: 'Who was the first President of the United States?', options: ['Abraham Lincoln', 'Thomas Jefferson', 'George Washington', 'John Adams'], correctAnswer: 'George Washington', points: 10 },
    { text: 'Which ancient civilization built Machu Picchu?', options: ['Aztecs', 'Mayans', 'Incas', 'Olmecs'], correctAnswer: 'Incas', points: 10 },
    { text: 'What ancient civilization wrote in hieroglyphics?', options: ['Romans', 'Greeks', 'Egyptians', 'Sumerians'], correctAnswer: 'Egyptians', points: 10 },
    { text: 'Which war involved the North and South of the US?', options: ['WWI', 'WWII', 'American Civil War', 'Revolutionary War'], correctAnswer: 'American Civil War', points: 10 },
    { text: 'Where did the Titanic sink?', options: ['Atlantic Ocean', 'Pacific Ocean', 'Indian Ocean', 'Arctic Ocean'], correctAnswer: 'Atlantic Ocean', points: 10 },
    { text: 'Who is known for having a roundtable with his knights?', options: ['King Henry', 'King Arthur', 'King Richard', 'King George'], correctAnswer: 'King Arthur', points: 10 },
    { text: 'Which famous historical figure is known for leading France in the Hundred Years\' War as a teenager?', options: ['Joan of Arc', 'Marie Antoinette', 'Cleopatra', 'Queen Elizabeth I'], correctAnswer: 'Joan of Arc', points: 10 },
    { text: 'Which empire was ruled by Julius Caesar?', options: ['Greek Empire', 'Roman Empire', 'Ottoman Empire', 'British Empire'], correctAnswer: 'Roman Empire', points: 10 },
    { text: 'Who discovered penicillin?', options: ['Marie Curie', 'Alexander Fleming', 'Louis Pasteur', 'Isaac Newton'], correctAnswer: 'Alexander Fleming', points: 10 },
    { text: 'In what year did man first walk on the moon?', options: ['1959', '1969', '1979', '1989'], correctAnswer: '1969', points: 10 },
  ],
  'Earth & Environment': [
    { text: 'What is the tallest mountain in the world?', options: ['K2', 'Kilimanjaro', 'Mount Everest', 'Mont Blanc'], correctAnswer: 'Mount Everest', points: 10 },
    { text: 'What causes a volcano to erupt?', options: ['Wind', 'Magma from inside the Earth', 'Earthquakes only', 'Heavy rain'], correctAnswer: 'Magma from inside the Earth', points: 10 },
    { text: 'Which is the largest rainforest on Earth?', options: ['Congo Rainforest', 'Amazon Rainforest', 'Daintree Rainforest', 'Tongass Forest'], correctAnswer: 'Amazon Rainforest', points: 10 },
    { text: 'What is the process of water going up into clouds called?', options: ['Condensation', 'Precipitation', 'Evaporation', 'Absorption'], correctAnswer: 'Evaporation', points: 10 },
    { text: 'Which gas do plants absorb from the air?', options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'], correctAnswer: 'Carbon Dioxide', points: 10 },
    { text: 'What should you do with a glass bottle to help the environment?', options: ['Throw it away', 'Bury it', 'Recycle it', 'Burn it'], correctAnswer: 'Recycle it', points: 10 },
    { text: 'How much of Earth\'s surface is covered by water?', options: ['40%', '50%', '60%', '70%'], correctAnswer: '70%', points: 10 },
    { text: 'What is the name for a scientist who studies weather?', options: ['Geologist', 'Biologist', 'Meteorologist', 'Astronomer'], correctAnswer: 'Meteorologist', points: 10 },
    { text: 'What causes seasons on Earth?', options: ['Earth\'s distance from the Sun', 'Earth\'s tilt on its axis', 'Moon phases', 'Wind patterns'], correctAnswer: 'Earth\'s tilt on its axis', points: 10 },
    { text: 'Which desert is the largest on Earth?', options: ['Sahara', 'Gobi', 'Antarctic', 'Atacama'], correctAnswer: 'Antarctic', points: 10 },
    { text: 'What is the hardest natural substance on Earth?', options: ['Gold', 'Iron', 'Diamond', 'Quartz'], correctAnswer: 'Diamond', points: 10 },
    { text: 'Which layer of the atmosphere contains the ozone layer?', options: ['Troposphere', 'Stratosphere', 'Mesosphere', 'Thermosphere'], correctAnswer: 'Stratosphere', points: 10 },
    { text: 'What energy source uses the power of the sun?', options: ['Wind power', 'Geothermal', 'Solar power', 'Hydroelectric'], correctAnswer: 'Solar power', points: 10 },
    { text: 'What type of rock is formed by cooled lava?', options: ['Sedimentary', 'Metamorphic', 'Igneous', 'Limestone'], correctAnswer: 'Igneous', points: 10 },
    { text: 'What do we call a prolonged period with little or no rainfall?', options: ['Flood', 'Hurricane', 'Tornado', 'Drought'], correctAnswer: 'Drought', points: 10 },
    { text: 'What is the Earth\'s core mainly made of?', options: ['Rock', 'Lava', 'Iron and Nickel', 'Water'], correctAnswer: 'Iron and Nickel', points: 10 },
    { text: 'Which ocean is the largest?', options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], correctAnswer: 'Pacific', points: 10 },
    { text: 'What is the general term for turning waste into reusable material?', options: ['Composting', 'Recycling', 'Incineration', 'Landfilling'], correctAnswer: 'Recycling', points: 10 },
    { text: 'What natural phenomenon is measured using the Richter scale?', options: ['Tornadoes', 'Hurricanes', 'Earthquakes', 'Volcanoes'], correctAnswer: 'Earthquakes', points: 10 },
    { text: 'What is the imaginary line dividing the Earth into Northern and Southern hemispheres?', options: ['Prime Meridian', 'Tropic of Cancer', 'Equator', 'Tropic of Capricorn'], correctAnswer: 'Equator', points: 10 },
  ],
  'Science Magic': [
    { text: 'What force keeps us on the ground?', options: ['Magnetism', 'Friction', 'Gravity', 'Electricity'], correctAnswer: 'Gravity', points: 10 },
    { text: 'What are the three states of matter?', options: ['Hard, soft, liquid', 'Solid, liquid, gas', 'Hot, cold, warm', 'Big, small, tiny'], correctAnswer: 'Solid, liquid, gas', points: 10 },
    { text: 'What process do plants use to make food from sunlight?', options: ['Photosynthesis', 'Digestion', 'Respiration', 'Germination'], correctAnswer: 'Photosynthesis', points: 10 },
    { text: 'What is the unit of electrical power?', options: ['Volt', 'Ohm', 'Watt', 'Ampere'], correctAnswer: 'Watt', points: 10 },
    { text: 'Which of these is a good conductor of electricity?', options: ['Wood', 'Plastic', 'Copper', 'Glass'], correctAnswer: 'Copper', points: 10 },
    { text: 'What does a magnet always have?', options: ['One pole', 'Two poles (North and South)', 'Three poles', 'No poles'], correctAnswer: 'Two poles (North and South)', points: 10 },
    { text: 'What travels faster — light or sound?', options: ['Sound', 'Light', 'They travel at the same speed', 'Depends on the weather'], correctAnswer: 'Light', points: 10 },
    { text: 'What is H2O the formula for?', options: ['Salt', 'Air', 'Water', 'Sugar'], correctAnswer: 'Water', points: 10 },
    { text: 'What is the boiling point of water in Celsius?', options: ['50°C', '75°C', '100°C', '150°C'], correctAnswer: '100°C', points: 10 },
    { text: 'What do we call animals that eat only plants?', options: ['Carnivores', 'Omnivores', 'Herbivores', 'Predators'], correctAnswer: 'Herbivores', points: 10 },
    { text: 'What is the chemical symbol for Oxygen?', options: ['Ox', 'O', 'O2', 'Om'], correctAnswer: 'O', points: 10 },
    { text: 'What part of the plant conducts photosynthesis?', options: ['Roots', 'Stem', 'Leaves', 'Flowers'], correctAnswer: 'Leaves', points: 10 },
    { text: 'What is the center of an atom called?', options: ['Electron', 'Nucleus', 'Proton', 'Cell'], correctAnswer: 'Nucleus', points: 10 },
    { text: 'Which sense is associated with the olfactory nerve?', options: ['Sight', 'Hearing', 'Touch', 'Smell'], correctAnswer: 'Smell', points: 10 },
    { text: 'What organ pumps blood throughout the body?', options: ['Lungs', 'Brain', 'Liver', 'Heart'], correctAnswer: 'Heart', points: 10 },
    { text: 'What is the largest organ of the human body?', options: ['Liver', 'Skin', 'Brain', 'Intestines'], correctAnswer: 'Skin', points: 10 },
    { text: 'What gas do humans exhale?', options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Helium'], correctAnswer: 'Carbon Dioxide', points: 10 },
    { text: 'What type of energy does a moving object have?', options: ['Potential', 'Kinetic', 'Thermal', 'Chemical'], correctAnswer: 'Kinetic', points: 10 },
    { text: 'What instrument is used to see very tiny things like cells?', options: ['Telescope', 'Microscope', 'Stethoscope', 'Kaleidoscope'], correctAnswer: 'Microscope', points: 10 },
    { text: 'What do you call a material that does NOT conduct electricity well?', options: ['Conductor', 'Insulator', 'Semiconductor', 'Superconductor'], correctAnswer: 'Insulator', points: 10 },
  ],
  'Global Cultures': [
    { text: 'What is the capital city of Japan?', options: ['Osaka', 'Tokyo', 'Kyoto', 'Hiroshima'], correctAnswer: 'Tokyo', points: 10 },
    { text: 'On which continent is Brazil located?', options: ['Africa', 'Asia', 'South America', 'Europe'], correctAnswer: 'South America', points: 10 },
    { text: 'What is the famous tower in Paris, France?', options: ['Big Ben', 'Leaning Tower of Pisa', 'Eiffel Tower', 'Colosseum'], correctAnswer: 'Eiffel Tower', points: 10 },
    { text: 'What is the national animal of Australia?', options: ['Koala', 'Dingo', 'Kangaroo', 'Platypus'], correctAnswer: 'Kangaroo', points: 10 },
    { text: 'In which country would you find the Taj Mahal?', options: ['Pakistan', 'India', 'Bangladesh', 'Nepal'], correctAnswer: 'India', points: 10 },
    { text: 'Which country is home to the Great Wall?', options: ['Japan', 'Korea', 'China', 'Mongolia'], correctAnswer: 'China', points: 10 },
    { text: 'What language do people speak in Brazil?', options: ['Spanish', 'English', 'Portuguese', 'French'], correctAnswer: 'Portuguese', points: 10 },
    { text: 'What is the longest river in Africa?', options: ['Congo River', 'Nile River', 'Zambezi River', 'Niger River'], correctAnswer: 'Nile River', points: 10 },
    { text: 'Which country is famous for making pizza and pasta?', options: ['France', 'Spain', 'Italy', 'Greece'], correctAnswer: 'Italy', points: 10 },
    { text: 'What is the largest country in the world by area?', options: ['USA', 'Canada', 'China', 'Russia'], correctAnswer: 'Russia', points: 10 },
    { text: 'In what country is the city of Machu Picchu located?', options: ['Chile', 'Peru', 'Mexico', 'Argentina'], correctAnswer: 'Peru', points: 10 },
    { text: 'Which city is known as the Big Apple?', options: ['Los Angeles', 'Chicago', 'New York City', 'Miami'], correctAnswer: 'New York City', points: 10 },
    { text: 'What is the currency of the United Kingdom?', options: ['Euro', 'Dollar', 'Pound Sterling', 'Yen'], correctAnswer: 'Pound Sterling', points: 10 },
    { text: 'What festival is celebrated with throwing colors in India?', options: ['Diwali', 'Holi', 'Navratri', 'Eid'], correctAnswer: 'Holi', points: 10 },
    { text: 'Which country is known as the Land of the Rising Sun?', options: ['China', 'Japan', 'South Korea', 'Thailand'], correctAnswer: 'Japan', points: 10 },
    { text: 'What is the traditional garment worn by women in Japan?', options: ['Sari', 'Hanbok', 'Kimono', 'Cheongsam'], correctAnswer: 'Kimono', points: 10 },
    { text: 'Where would you find the Pyramids of Giza?', options: ['Mexico', 'Peru', 'Egypt', 'Sudan'], correctAnswer: 'Egypt', points: 10 },
    { text: 'What language has the most native speakers in the world?', options: ['English', 'Spanish', 'Mandarin Chinese', 'Hindi'], correctAnswer: 'Mandarin Chinese', points: 10 },
    { text: 'Which of these is a traditional Mexican dish?', options: ['Sushi', 'Tacos', 'Pasta', 'Croissant'], correctAnswer: 'Tacos', points: 10 },
    { text: 'What is the capital of Canada?', options: ['Toronto', 'Vancouver', 'Montreal', 'Ottawa'], correctAnswer: 'Ottawa', points: 10 },
  ]
}

// Function to generate math questions programmatically
function generateMathQuestions(count: number) {
  const ops = ['+', '-', 'x', '/']
  const questions = []
  for (let i = 0; i < count; i++) {
    const op = ops[Math.floor(Math.random() * ops.length)]
    let a, b, answer
    if (op === '+') {
      a = Math.floor(Math.random() * 50) + 10
      b = Math.floor(Math.random() * 50) + 10
      answer = a + b
    } else if (op === '-') {
      a = Math.floor(Math.random() * 50) + 20
      b = Math.floor(Math.random() * 20) + 1
      answer = a - b
    } else if (op === 'x') {
      a = Math.floor(Math.random() * 12) + 2
      b = Math.floor(Math.random() * 12) + 2
      answer = a * b
    } else {
      b = Math.floor(Math.random() * 10) + 2
      answer = Math.floor(Math.random() * 10) + 2
      a = b * answer
    }

    const text = `What is ${a} ${op} ${b}?`
    const correctAnswer = answer.toString()
    
    // Generate 3 wrong options
    const options = [correctAnswer]
    while (options.length < 4) {
      const wrongAnswer = (answer + Math.floor(Math.random() * 10) - 5).toString()
      if (!options.includes(wrongAnswer) && wrongAnswer !== correctAnswer) {
        options.push(wrongAnswer)
      }
    }
    
    // Shuffle options
    options.sort(() => Math.random() - 0.5)

    questions.push({
      text,
      options,
      correctAnswer,
      points: 10
    })
  }
  return questions
}

function getRandomQuestions(pool: any[], count: number) {
  const shuffled = [...pool].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

const SUBJECT_QUIZ_TITLES: Record<string, string[]> = {
  'Amazing Animals': ['Wild Safari Challenge', 'Ocean Creatures Quiz', 'Birds & Bugs Bonanza', 'Mammal Mysteries', 'Reptile Rumble'],
  'Space Explorers': ['Solar System Superstar', 'Galactic Guide', 'Astronaut Training', 'Star Fleet Academy', 'Deep Space Discovery'],
  'History Hunters': ['Ancient Civilizations Challenge', 'Famous Figures Quiz', 'World Wars Review', 'Medieval Times Tour', 'Explorers Expedition'],
  'Earth & Environment': ['Planet Earth Challenge', 'Weather Watcher Quiz', 'Eco Warrior Test', 'Geology Genius', 'Oceanography Observer'],
  'Science Magic': ['Young Scientist Quiz', 'Chemistry Champions', 'Physics Phenom', 'Biology Basics', 'Inventors & Inventions'],
  'Math Mysteries': ['Number Cruncher Challenge', 'Algebra Adventurer', 'Geometry Genius', 'Fractions & Decimals', 'Mental Math Master'],
  'Global Cultures': ['World Explorer Quiz', 'Capitals of the World', 'Languages & Lore', 'Festivals & Food', 'Landmarks Lookout']
}

async function seed() {
  console.log('🌱 Starting quiz seed...')

  try {
    // Fetch all subject IDs
    const { data: subjects, error: subErr } = await supabase.from('subjects').select('id, name')
    if (subErr) throw subErr
    
    const subjectMap = new Map<string, string>()
    for (const s of subjects!) {
      subjectMap.set(s.name, s.id)
    }

    const quizzesToInsert = []
    
    const subjectNames = Object.keys(SUBJECT_QUIZ_TITLES)

    for (const subjectName of subjectNames) {
      const subject_id = subjectMap.get(subjectName)
      if (!subject_id) {
        console.log(`  ⚠️  Subject not found: ${subjectName}`)
        continue
      }
      
      const titles = SUBJECT_QUIZ_TITLES[subjectName]
      
      for (let i = 0; i < 5; i++) { // 5 quizzes per subject
        const title = titles[i] || `Quiz ${i + 1} for ${subjectName}`
        let questions = []
        
        // Target 15 questions per quiz (between 10 to 20 as requested)
        if (subjectName === 'Math Mysteries') {
          questions = generateMathQuestions(15)
        } else {
          // Get pool for subject
          const pool = QUESTION_POOLS[subjectName] || []
          if (pool.length > 0) {
            // We have 20 questions in the pool, we'll pick 15 randomly
            questions = getRandomQuestions(pool, 15)
          } else {
             // Fallback
             questions = generateMathQuestions(15)
          }
        }

        quizzesToInsert.push({
          title: `🧠 ${title}`,
          description: `Test your knowledge with this fun 15-question quiz about ${subjectName}!`,
          duration_minutes: 15,
          subject_id,
          school_id: null,
          is_published: true,
          content: {
            questions: questions.map((q, qIdx) => ({
              id: `q${qIdx}_${Math.random().toString(36).slice(2, 7)}`,
              text: q.text,
              options: q.options,
              correctAnswer: q.correctAnswer,
              points: q.points
            }))
          }
        })
      }
    }

    console.log(`Inserting ${quizzesToInsert.length} quizzes...`)
    const { error } = await supabase.from('global_quizzes').insert(quizzesToInsert)
    
    if (error) {
      console.error('❌ Error:', JSON.stringify(error, null, 2))
    } else {
      console.log(`✅ Done! ${quizzesToInsert.length} quizzes published to the Learning Hub.`)
    }
  } catch (err) {
    console.error('Fatal error:', JSON.stringify(err, null, 2))
  }
}

seed()
