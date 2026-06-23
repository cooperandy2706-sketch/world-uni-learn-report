// seed_waec_exams.mjs
// Seeds WAEC-style exams for Basic 1 to Basic 9 across core GES subjects
// Run: node seed_waec_exams.mjs

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ─── Helper ──────────────────────────────────────────────────────────────────
let _qid = 0;
function qid() { return `q${++_qid}`; }

function obj(text, options, correctAnswer, difficulty = 'medium') {
  return { id: qid(), type: 'objective', text, options, correctAnswer, difficulty };
}

function subj(text, marks = 10, hint = '') {
  return { id: qid(), type: 'subjective', text, marks, hint };
}

// ════════════════════════════════════════════════════════════════════════════
// ENGLISH LANGUAGE — Basic 1 (ages 7-8)
// ════════════════════════════════════════════════════════════════════════════
const ENGLISH_BS1_OBJ = [
  obj('Which of these is a vowel?', ['B', 'C', 'A', 'D'], 'A', 'easy'),
  obj('How many letters are in the English alphabet?', ['24', '25', '26', '27'], '26', 'easy'),
  obj('Which word rhymes with "cat"?', ['dog', 'mat', 'pen', 'sun'], 'mat', 'easy'),
  obj('Choose the correct spelling.', ['Elefant', 'Elephant', 'Eliphant', 'Elifant'], 'Elephant', 'easy'),
  obj('Which of these is a noun?', ['run', 'happy', 'book', 'quickly'], 'book', 'easy'),
  obj('"The boy __ playing football." Which word best fills the gap?', ['is', 'are', 'were', 'been'], 'is', 'easy'),
  obj('What is the plural of "child"?', ['childs', 'childes', 'children', 'childrens'], 'children', 'medium'),
  obj('Which sentence is correct?', ['She go to school.', 'She goes to school.', 'She going school.', 'She goed to school.'], 'She goes to school.', 'easy'),
  obj('What is the opposite of "hot"?', ['warm', 'cold', 'cool', 'dry'], 'cold', 'easy'),
  obj('Which letter comes after "M" in the alphabet?', ['L', 'N', 'O', 'P'], 'N', 'easy'),
  obj('"The cat sat on the ___." What is the missing word in the picture?', ['mat', 'bat', 'pat', 'rat'], 'mat', 'easy'),
  obj('How many syllables are in the word "banana"?', ['1', '2', '3', '4'], '3', 'medium'),
  obj('Which word is an adjective?', ['jump', 'blue', 'slowly', 'eat'], 'blue', 'medium'),
  obj('What punctuation mark ends a question?', ['.', ',', '?', '!'], '?', 'easy'),
  obj('"She is my ___." The missing word that shows ownership is:', ['friend', 'friends', "friend's", 'of friend'], "friend's", 'medium'),
  obj('Which of these words is a verb?', ['chair', 'swim', 'tall', 'house'], 'swim', 'easy'),
  obj('Choose the word that means the same as "big":',['tiny', 'large', 'slim', 'short'], 'large', 'easy'),
  obj('Which sentence uses a capital letter correctly?', ['my name is ama.', 'My name is ama.', 'my Name is Ama.', 'My name is Ama.'], 'My name is Ama.', 'medium'),
  obj('What is the singular of "teeth"?', ['tooths', 'tooth', 'toothes', 'teeths'], 'tooth', 'medium'),
  obj('"Fast" is to "slow" as "big" is to ___', ['huge', 'wide', 'small', 'tall'], 'small', 'medium'),
  obj('Which word describes how something is done?', ['noun', 'verb', 'adverb', 'pronoun'], 'adverb', 'hard'),
  obj('Choose the correctly punctuated sentence.', ['i live in Ghana', 'I live in ghana.', 'I live in Ghana.', 'i Live in Ghana.'], 'I live in Ghana.', 'easy'),
  obj('"He is __ boy." The correct article is:', ['a', 'an', 'the', 'one'], 'a', 'easy'),
  obj('Which word is a pronoun?', ['run', 'she', 'table', 'jump'], 'she', 'easy'),
  obj('What does the word "ancient" mean?', ['modern', 'very old', 'very fast', 'broken'], 'very old', 'medium'),
  obj('Which of these is a compound word?', ['jumping', 'quickly', 'sunshine', 'teacher'], 'sunshine', 'medium'),
  obj('"The girls ___ their homework." Which verb is correct?', ['does', 'do', 'done', 'doing'], 'do', 'medium'),
  obj('A story that teaches a moral lesson is called a:', ['poem', 'fable', 'diary', 'letter'], 'fable', 'hard'),
  obj('Which word has the "oo" sound as in "moon"?', ['book', 'food', 'good', 'wood'], 'food', 'medium'),
  obj('The word "unhappy" means:', ['very happy', 'not happy', 'always happy', 'too happy'], 'not happy', 'medium'),
  obj('Which of these sentences is an exclamation?', ['Where are you?', 'Come here please.', 'What a beautiful day!', 'She went home.'], 'What a beautiful day!', 'easy'),
  obj('Choose the antonym of "brave":', ['bold', 'strong', 'cowardly', 'fierce'], 'cowardly', 'hard'),
  obj('Which word is correctly divided into syllables?', ['chil-dren', 'chi-ldren', 'c-hildren', 'ch-ildren'], 'chil-dren', 'hard'),
  obj('In the sentence "The tall man walked slowly," the adverb is:', ['tall', 'man', 'walked', 'slowly'], 'slowly', 'medium'),
  obj('A word that connects two sentences is called a:', ['noun', 'verb', 'conjunction', 'pronoun'], 'conjunction', 'hard'),
  obj('Which is the correct comparative form of "good"?', ['gooder', 'more good', 'better', 'betterer'], 'better', 'medium'),
  obj('"Do not waste water." This sentence is an example of:', ['a question', 'a command', 'an exclamation', 'a statement'], 'a command', 'medium'),
  obj('The main character in a story is called the:', ['narrator', 'villain', 'protagonist', 'author'], 'protagonist', 'hard'),
  obj('Which word is a synonym for "afraid"?', ['bold', 'scared', 'brave', 'calm'], 'scared', 'easy'),
  obj('Choose the sentence in the past tense:', ['She eats an apple.', 'She will eat an apple.', 'She ate an apple.', 'She is eating an apple.'], 'She ate an apple.', 'medium'),
];

const ENGLISH_BS1_SUBJ = [
  subj('Write five sentences about your school. Use at least one adjective in each sentence.', 10, 'Think about the buildings, teachers, friends, and activities.'),
  subj('Write the opposites (antonyms) of these words: happy, tall, old, fast, dark.', 5),
  subj('Write a short paragraph (5–6 sentences) about what you do after school every day.', 10, 'Use simple present tense.'),
  subj('Put these words in alphabetical order: mango, apple, orange, banana, grape.', 5),
  subj('Write three sentences using the following words correctly: play, beautiful, quickly.', 6),
  subj('Read the following passage and answer the questions:\n\n"Kwame woke up early on Saturday. He helped his mother sweep the house. Then he fed the chickens and watered the garden. In the afternoon, his father took him to the market."\n\n(a) What day did Kwame wake up early?\n(b) Name TWO chores Kwame did in the morning.\n(c) Where did his father take him?', 10),
  subj('Write a letter to your friend telling him/her about your favourite food. Include what it is, how it is made, and why you like it.', 10),
];

// ════════════════════════════════════════════════════════════════════════════
// MATHEMATICS — Basic 1 (ages 7–8)
// ════════════════════════════════════════════════════════════════════════════
const MATHS_BS1_OBJ = [
  obj('What is 7 + 8?', ['13', '14', '15', '16'], '15', 'easy'),
  obj('What is 15 - 7?', ['6', '7', '8', '9'], '8', 'easy'),
  obj('Which number comes between 12 and 14?', ['11', '13', '15', '16'], '13', 'easy'),
  obj('What is 4 × 3?', ['10', '11', '12', '14'], '12', 'easy'),
  obj('Half of 20 is:', ['5', '8', '10', '12'], '10', 'easy'),
  obj('How many sides does a triangle have?', ['2', '3', '4', '5'], '3', 'easy'),
  obj('What is the place value of 3 in 35?', ['ones', 'tens', 'hundreds', 'thousands'], 'tens', 'medium'),
  obj('What is 24 ÷ 4?', ['5', '6', '7', '8'], '6', 'easy'),
  obj('Which of these numbers is even?', ['13', '15', '17', '18'], '18', 'easy'),
  obj('Round 47 to the nearest ten:', ['40', '45', '50', '55'], '50', 'medium'),
  obj('A week has ___ days.', ['5', '6', '7', '8'], '7', 'easy'),
  obj('What is 3² (3 squared)?', ['6', '8', '9', '12'], '9', 'medium'),
  obj('Which fraction is the largest?', ['1/4', '1/2', '1/3', '1/8'], '1/2', 'medium'),
  obj('What is the perimeter of a square with side 5 cm?', ['10 cm', '15 cm', '20 cm', '25 cm'], '20 cm', 'medium'),
  obj('How many minutes are in one hour?', ['30', '45', '60', '90'], '60', 'easy'),
  obj('What is 100 - 37?', ['53', '57', '63', '67'], '63', 'medium'),
  obj('Which shape has 4 equal sides and 4 right angles?', ['rectangle', 'rhombus', 'square', 'trapezium'], 'square', 'medium'),
  obj('If a bag has 5 red balls and 3 blue balls, how many balls are there in total?', ['7', '8', '9', '10'], '8', 'easy'),
  obj('What is 9 × 7?', ['54', '56', '63', '65'], '63', 'medium'),
  obj('0.5 is the same as:', ['1/3', '1/4', '1/2', '1/5'], '1/2', 'medium'),
  obj('Which unit is used to measure weight?', ['metre', 'litre', 'kilogram', 'second'], 'kilogram', 'easy'),
  obj('What is the area of a rectangle that is 6 cm long and 4 cm wide?', ['10 cm²', '20 cm²', '24 cm²', '26 cm²'], '24 cm²', 'medium'),
  obj('If you have GH¢10.00 and spend GH¢3.50, how much change do you get?', ['GH¢6.00', 'GH¢6.50', 'GH¢7.00', 'GH¢7.50'], 'GH¢6.50', 'medium'),
  obj('What is the value of the digit 4 in 346?', ['4', '40', '400', '4000'], '40', 'medium'),
  obj('Which of these is a prime number?', ['9', '15', '17', '21'], '17', 'hard'),
  obj('What time is shown on a clock with the hour hand on 3 and minute hand on 12?', ['12:03', '3:00', '3:12', '12:30'], '3:00', 'easy'),
  obj('A rectangle has length 10 m and width 5 m. What is its perimeter?', ['15 m', '20 m', '30 m', '50 m'], '30 m', 'medium'),
  obj('What is 50% of 80?', ['20', '30', '40', '50'], '40', 'medium'),
  obj('The number 1000 in words is:', ['one hundred', 'ten hundred', 'one thousand', 'one million'], 'one thousand', 'easy'),
  obj('Arrange these from smallest to largest: 34, 12, 78, 45.', ['12, 34, 45, 78', '78, 45, 34, 12', '34, 12, 78, 45', '12, 45, 34, 78'], '12, 34, 45, 78', 'easy'),
  obj('What is 5³ (5 cubed)?', ['15', '25', '125', '500'], '125', 'hard'),
  obj('If a shopkeeper sells 45 oranges on Monday and 38 on Tuesday, how many did she sell altogether?', ['73', '83', '84', '93'], '83', 'medium'),
  obj('Which angle is greater than 90° but less than 180°?', ['acute', 'right', 'obtuse', 'reflex'], 'obtuse', 'hard'),
  obj('A number divisible by both 2 and 3 is divisible by:', ['4', '5', '6', '9'], '6', 'hard'),
  obj('What is the LCM of 4 and 6?', ['10', '12', '18', '24'], '12', 'hard'),
  obj('How many centimetres are in 1 metre?', ['10', '50', '100', '1000'], '100', 'easy'),
  obj('What is 25 × 4?', ['80', '90', '100', '120'], '100', 'medium'),
  obj('A pie chart represents data as parts of a ___.', ['square', 'rectangle', 'triangle', 'circle'], 'circle', 'medium'),
  obj('What is the remainder when 17 is divided by 5?', ['1', '2', '3', '4'], '2', 'medium'),
  obj('The product of 7 and 8 minus 10 is:', ['36', '44', '46', '66'], '46', 'hard'),
];

const MATHS_BS1_SUBJ = [
  subj('Kofi earns GH¢35.00 per day. How much does he earn in 5 days? Show all your working.', 8),
  subj('Draw a bar graph to show the following data: Mango (12), Orange (8), Banana (15), Pineapple (5). Label all axes clearly.', 10),
  subj('Find the value of x: 3x + 7 = 22. Show your working step by step.', 8, 'Rearrange the equation.'),
  subj('A farmer has a rectangular farm measuring 25 m by 16 m.\n(a) Calculate the area of the farm.\n(b) If the farmer wants to fence the entire farm, what length of fencing material is needed?', 10),
  subj('List all factors of 36. Then identify which of the factors are prime numbers.', 8),
  subj('A market woman bought 60 mangoes at 50 pesewas each. She sold them all at GH¢1.20 each.\n(a) How much did she spend buying them?\n(b) How much did she receive from selling them?\n(c) What was her profit?', 10),
  subj('Complete this number pattern and explain the rule: 2, 5, 8, 11, ___, ___, ___.', 6, 'Look at the difference between each term.'),
];

// ════════════════════════════════════════════════════════════════════════════
// INTEGRATED SCIENCE — Basic 7 (JHS 1)
// ════════════════════════════════════════════════════════════════════════════
const SCIENCE_BS7_OBJ = [
  obj('Which of the following is an example of a chemical change?', ['melting ice', 'tearing paper', 'burning wood', 'dissolving salt in water'], 'burning wood', 'medium'),
  obj('The process by which plants make their own food is called:', ['respiration', 'transpiration', 'photosynthesis', 'digestion'], 'photosynthesis', 'easy'),
  obj('Which gas is produced during photosynthesis?', ['carbon dioxide', 'nitrogen', 'oxygen', 'hydrogen'], 'oxygen', 'easy'),
  obj('The cell membrane functions mainly to:', ['produce energy', 'control what enters and leaves the cell', 'store genetic information', 'make proteins'], 'control what enters and leaves the cell', 'medium'),
  obj('Which of the following is a property of acids?', ['they turn red litmus blue', 'they have pH above 7', 'they react with metals to release hydrogen gas', 'they taste bitter'], 'they react with metals to release hydrogen gas', 'medium'),
  obj('Malaria is caused by:', ['a bacterium', 'a virus', 'a protozoan (plasmodium)', 'a fungus'], 'a protozoan (plasmodium)', 'hard'),
  obj('The SI unit of force is the:', ['watt', 'joule', 'newton', 'pascal'], 'newton', 'medium'),
  obj('Which type of rock is formed from cooled magma?', ['sedimentary', 'metamorphic', 'igneous', 'limestone'], 'igneous', 'medium'),
  obj('The human heart pumps blood to the body. The main function of red blood cells is to:', ['fight infection', 'carry oxygen', 'help blood clot', 'carry nutrients'], 'carry oxygen', 'easy'),
  obj('Sound travels fastest through:', ['a vacuum', 'air', 'water', 'steel'], 'steel', 'hard'),
  obj('Which of the following is NOT a renewable source of energy?', ['solar', 'wind', 'coal', 'hydro'], 'coal', 'medium'),
  obj('The part of the eye responsible for controlling the amount of light entering is the:', ['cornea', 'retina', 'iris', 'lens'], 'iris', 'hard'),
  obj('Which organelle is the "powerhouse" of the cell?', ['nucleus', 'ribosome', 'mitochondria', 'vacuole'], 'mitochondria', 'medium'),
  obj('The process by which water vapour changes to liquid water is called:', ['evaporation', 'condensation', 'precipitation', 'transpiration'], 'condensation', 'medium'),
  obj('Newton\'s First Law of Motion states that:', ['Force = Mass × Acceleration', 'every action has an equal and opposite reaction', 'an object at rest stays at rest unless acted upon by a force', 'energy cannot be created or destroyed'], 'an object at rest stays at rest unless acted upon by a force', 'hard'),
  obj('Which of the following is a vector quantity?', ['mass', 'temperature', 'speed', 'velocity'], 'velocity', 'hard'),
  obj('The pH of pure water at 25°C is:', ['0', '5', '7', '14'], '7', 'medium'),
  obj('A food chain always begins with a:', ['consumer', 'decomposer', 'producer (green plant)', 'predator'], 'producer (green plant)', 'medium'),
  obj('Which vitamin is produced by the skin when exposed to sunlight?', ['Vitamin A', 'Vitamin B', 'Vitamin C', 'Vitamin D'], 'Vitamin D', 'medium'),
  obj('The process by which living organisms break down glucose to release energy is:', ['photosynthesis', 'respiration', 'transpiration', 'fermentation'], 'respiration', 'medium'),
  obj('Electric current is measured in:', ['volts', 'watts', 'ohms', 'amperes'], 'amperes', 'medium'),
  obj('Which planet is closest to the Sun?', ['Venus', 'Earth', 'Mercury', 'Mars'], 'Mercury', 'easy'),
  obj('Which of the following diseases is caused by a deficiency of Vitamin C?', ['Rickets', 'Anaemia', 'Scurvy', 'Goitre'], 'Scurvy', 'hard'),
  obj('An object has a mass of 5 kg. Its weight on Earth (g=10 m/s²) is:', ['5 N', '10 N', '50 N', '500 N'], '50 N', 'medium'),
  obj('The chemical formula for water is:', ['H₂O₂', 'HO', 'H₂O', 'H₃O'], 'H₂O', 'easy'),
  obj('Which type of reproduction involves only one parent?', ['sexual', 'asexual', 'external fertilisation', 'pollination'], 'asexual', 'medium'),
  obj('Global warming is primarily caused by the increase of ___ gases in the atmosphere.', ['oxygen', 'nitrogen', 'greenhouse', 'noble'], 'greenhouse', 'medium'),
  obj('The moon takes approximately ___ to orbit the Earth once.', ['1 day', '1 week', '27–29 days', '365 days'], '27–29 days', 'medium'),
  obj('Which of the following best describes a conductor?', ['a material that allows electric current to flow freely', 'a material that blocks electric current', 'a material that stores electric charge', 'a material that produces electricity'], 'a material that allows electric current to flow freely', 'easy'),
  obj('The process by which a liquid changes to a gas at any temperature is called:', ['boiling', 'condensation', 'evaporation', 'sublimation'], 'evaporation', 'medium'),
  obj('Chlorophyll is found in the ___ of plant cells.', ['cell wall', 'nucleus', 'chloroplast', 'vacuole'], 'chloroplast', 'medium'),
  obj('Which organ filters waste products from the blood?', ['liver', 'lungs', 'kidney', 'heart'], 'kidney', 'medium'),
  obj('The ozone layer is found in which layer of the atmosphere?', ['troposphere', 'stratosphere', 'mesosphere', 'thermosphere'], 'stratosphere', 'hard'),
  obj('Which type of lens is used to correct short-sightedness?', ['convex', 'concave', 'plane', 'bifocal'], 'concave', 'hard'),
  obj('What is the name of the process where a solid changes directly into a gas?', ['evaporation', 'sublimation', 'condensation', 'deposition'], 'sublimation', 'hard'),
  obj('Which of the following is caused by a virus?', ['tuberculosis', 'cholera', 'malaria', 'influenza'], 'influenza', 'medium'),
  obj('The force that opposes motion between two surfaces in contact is called:', ['gravity', 'friction', 'tension', 'normal force'], 'friction', 'easy'),
  obj('In an experiment, the variable that is deliberately changed is called the ___ variable.', ['controlled', 'independent', 'dependent', 'constant'], 'independent', 'hard'),
  obj('A mixture of sand and water can be separated by:', ['filtration', 'distillation', 'evaporation', 'decantation'], 'filtration', 'medium'),
  obj('Which part of the digestive system absorbs most of the nutrients from food?', ['stomach', 'large intestine', 'small intestine', 'oesophagus'], 'small intestine', 'medium'),
];

const SCIENCE_BS7_SUBJ = [
  subj('Describe the process of photosynthesis. In your answer:\n(a) State the raw materials needed.\n(b) State the products formed.\n(c) Write the word equation for photosynthesis.\n(d) Explain the role of chlorophyll.', 12),
  subj('(a) State Newton\'s Three Laws of Motion.\n(b) A car of mass 800 kg accelerates at 3 m/s². Calculate the force applied. (Show your working)', 12, 'Use F = ma'),
  subj('With the aid of a well-labelled diagram, describe the structure of a plant cell. State THREE ways a plant cell differs from an animal cell.', 12),
  subj('Explain the water cycle. In your answer, name and describe FOUR stages of the water cycle.', 10),
  subj('(a) What is an ecosystem? Give TWO examples of ecosystems found in Ghana.\n(b) Construct a food chain with at least FOUR organisms found in a Ghanaian forest.\n(c) What would happen to the ecosystem if the producer was removed?', 12),
  subj('Explain why we should use renewable energy sources instead of fossil fuels. Mention THREE types of renewable energy and ONE advantage of each.', 10),
  subj('A student dissolves 5 g of table salt in 100 ml of water.\n(a) What is the solute in this mixture?\n(b) What is the solvent?\n(c) What is the solution called?\n(d) How would the student recover the salt from the solution?', 10),
  subj('Describe the causes, symptoms, prevention and treatment of malaria.', 12, 'Consider the vector, the parasite, and control methods.'),
];

// ════════════════════════════════════════════════════════════════════════════
// SOCIAL STUDIES — Basic 9 (JHS 3 / BECE)
// ════════════════════════════════════════════════════════════════════════════
const SOCIAL_BS9_OBJ = [
  obj('Ghana gained independence from Britain on:', ['6th March 1956', '6th March 1957', '6th March 1958', '6th March 1960'], '6th March 1957', 'easy'),
  obj('Who was the first President of Ghana?', ['J.B. Danquah', 'Kofi Busia', 'Kwame Nkrumah', 'John Atta Mills'], 'Kwame Nkrumah', 'easy'),
  obj('The capital city of Ghana is:', ['Kumasi', 'Takoradi', 'Accra', 'Tamale'], 'Accra', 'easy'),
  obj('Which of the following is NOT a factor of population distribution?', ['rainfall', 'topography', 'currency', 'vegetation'], 'currency', 'medium'),
  obj('The concept of democracy means:', ['rule by the military', 'government by the people', 'rule by the wealthy', 'government by foreigners'], 'government by the people', 'medium'),
  obj('The three arms of government in Ghana are:', ['executive, legislature, judiciary', 'president, parliament, army', 'NDC, NPP, CPP', 'central, regional, district'], 'executive, legislature, judiciary', 'medium'),
  obj('Which institution is responsible for making laws in Ghana?', ['The Supreme Court', 'The Parliament', 'The Cabinet', 'The Electoral Commission'], 'The Parliament', 'easy'),
  obj('Ghana\'s currency is the:', ['Dollar', 'Naira', 'Cedi', 'Franc'], 'Cedi', 'easy'),
  obj('ECOWAS stands for:', ['Economic Community of West African States', 'East Coast of West Africa Society', 'Economic Commission of Western African Schools', 'Eastern Communities of West Africa States'], 'Economic Community of West African States', 'medium'),
  obj('The main type of farming practiced in Ghana is:', ['commercial farming', 'subsistence farming', 'plantation farming', 'mechanised farming'], 'subsistence farming', 'medium'),
  obj('Which river is the longest in Ghana?', ['Volta', 'Pra', 'Offin', 'Ankobra'], 'Volta', 'easy'),
  obj('The cocoa industry in Ghana is important because:', ['it is the cheapest crop', 'it is Ghana\'s major export commodity', 'it can grow anywhere', 'it requires no labour'], 'it is Ghana\'s major export commodity', 'medium'),
  obj('A census is conducted to:', ['collect taxes', 'count and record the population', 'elect a new president', 'register businesses'], 'count and record the population', 'medium'),
  obj('Which of the following is an example of the consequences of bad governance?', ['economic growth', 'improved healthcare', 'poverty and corruption', 'better education'], 'poverty and corruption', 'medium'),
  obj('The Atlantic Slave Trade mainly involved the transportation of Africans to:', ['Europe', 'Asia', 'the Americas', 'Australia'], 'the Americas', 'medium'),
  obj('The Ashanti kingdom in Ghana was known for trading in which commodity?', ['salt', 'gold', 'coal', 'iron'], 'gold', 'medium'),
  obj('Which of the following is a pull factor of rural-urban migration?', ['poor healthcare in cities', 'better employment opportunities in cities', 'floods in cities', 'high cost of living in cities'], 'better employment opportunities in cities', 'medium'),
  obj('The Electoral Commission of Ghana is responsible for:', ['collecting government revenue', 'organising and supervising elections', 'making new laws', 'managing the economy'], 'organising and supervising elections', 'medium'),
  obj('Ghana\'s 1992 Constitution established Ghana as:', ['a military state', 'a constitutional monarchy', 'a unitary presidential constitutional republic', 'a communist state'], 'a unitary presidential constitutional republic', 'hard'),
  obj('A country\'s Gross Domestic Product (GDP) measures:', ['the cost of all exports', 'the total value of goods and services produced within the country', 'the government\'s budget', 'the national debt'], 'the total value of goods and services produced within the country', 'hard'),
  obj('Which environmental problem is caused by cutting down too many trees?', ['flooding', 'desertification', 'deforestation', 'erosion'], 'deforestation', 'easy'),
  obj('The Sahelian belt in West Africa is characterized by:', ['heavy rainfall and dense forest', 'dry conditions and sparse vegetation', 'high humidity and mangroves', 'cold temperatures and snow'], 'dry conditions and sparse vegetation', 'medium'),
  obj('Which of the following was a direct cause of the abolition of the slave trade?', ['the discovery of oil in Africa', 'campaigns by abolitionists like William Wilberforce', 'Africa becoming independent', 'the invention of the steam engine'], 'campaigns by abolitionists like William Wilberforce', 'hard'),
  obj('Urbanisation refers to:', ['building new farms', 'the growth of cities and movement of people to urban areas', 'people moving from cities to the countryside', 'the construction of roads'], 'the growth of cities and movement of people to urban areas', 'medium'),
  obj('Which of the following is a duty of every Ghanaian citizen?', ['attend political rallies', 'pay taxes', 'join the army', 'work for the government'], 'pay taxes', 'medium'),
  obj('International trade involves:', ['buying and selling within a country', 'trade between different countries', 'barter exchange within communities', 'local market activities'], 'trade between different countries', 'easy'),
  obj('The United Nations Organisation (UNO) was founded in:', ['1919', '1939', '1945', '1957'], '1945', 'medium'),
  obj('Which colonial power colonised Ghana (then Gold Coast)?', ['France', 'Portugal', 'Germany', 'Britain'], 'Britain', 'easy'),
  obj('The Conference of Berlin (1884–85) was significant because it:', ['ended slavery', 'partitioned Africa among European powers', 'gave Ghana independence', 'established ECOWAS'], 'partitioned Africa among European powers', 'hard'),
  obj('Which of the following best describes sustainable development?', ['using all resources now for profit', 'development that meets today\'s needs without compromising future generations', 'rapid industrialisation at any cost', 'development funded by foreign aid'], 'development that meets today\'s needs without compromising future generations', 'hard'),
  obj('Ghana\'s District Assemblies were established under which decree?', ['PNDC Law 207', 'Act 462', 'Decree 1992', 'Act 720'], 'PNDC Law 207', 'hard'),
  obj('One major effect of the slave trade on Africa was:', ['rapid economic growth', 'depopulation and underdevelopment', 'industrialisation', 'widespread education'], 'depopulation and underdevelopment', 'medium'),
  obj('The Brong-Ahafo Region was split from which larger region?', ['Eastern Region', 'Ashanti Region', 'Northern Region', 'Western Region'], 'Ashanti Region', 'hard'),
  obj('Traditional rulers in Ghana have the responsibility to:', ['make national laws', 'maintain peace and culture in their communities', 'appoint ministers of state', 'run the army'], 'maintain peace and culture in their communities', 'medium'),
  obj('Which of the following is a cause of rural-urban migration in Ghana?', ['good roads in villages', 'poor social amenities in rural areas', 'high wages in villages', 'low cost of living in cities'], 'poor social amenities in rural areas', 'medium'),
  obj('Inflation means:', ['falling prices of goods', 'a general rise in the price level of goods and services', 'a drop in population growth', 'more goods being imported'], 'a general rise in the price level of goods and services', 'medium'),
  obj('The rule of law means:', ['the president obeys only tradition', 'everyone is subject to the law equally', 'the military can make laws', 'only judges obey the law'], 'everyone is subject to the law equally', 'medium'),
  obj('Which of the following is a natural resource in Ghana?', ['concrete', 'plastic', 'bauxite', 'glass'], 'bauxite', 'medium'),
  obj('The "Castle" in Cape Coast is historically significant because it was:', ['a royal palace', 'a centre of the slave trade', 'where Ghana was declared independent', 'a major market'], 'a centre of the slave trade', 'medium'),
  obj('The Volta Lake is one of the largest man-made lakes in the world. It was created by the construction of the:', ['Kpong Dam', 'Akosombo Dam', 'Weija Dam', 'Bui Dam'], 'Akosombo Dam', 'medium'),
];

const SOCIAL_BS9_SUBJ = [
  subj('(a) Explain FIVE factors that influenced the location of early settlements in Ghana.\n(b) State TWO problems associated with overcrowding in Ghanaian cities.', 15),
  subj('Describe the causes, effects and solutions to deforestation in Ghana.', 15, 'Think about logging, farming, fuelwood, and policy solutions.'),
  subj('(a) Explain the three arms of government and the functions of each.\n(b) Why is the separation of powers important in a democracy?', 15),
  subj('(a) Explain why the slave trade is considered one of the greatest crimes in history.\n(b) Describe THREE ways in which the slave trade affected West Africa.', 12),
  subj('(a) What is sustainable development? (b) Identify and explain THREE sustainable development goals (SDGs) that are most relevant to Ghana.', 12),
  subj('Explain the causes and effects of rural-urban migration in Ghana. Suggest THREE solutions to the problem.', 12),
  subj('Describe the role of ECOWAS in promoting peace and development in West Africa. Mention at least THREE achievements.', 12),
  subj('(a) What is a census? (b) Explain the importance of a national census to a country like Ghana. Give at least FOUR reasons.', 10),
];

// ════════════════════════════════════════════════════════════════════════════
// ICT / COMPUTING — Basic 9 (JHS 3)
// ════════════════════════════════════════════════════════════════════════════
const ICT_BS9_OBJ = [
  obj('The full meaning of ICT is:', ['Information Computer Technology', 'Internet and Computer Tools', 'Information and Communications Technology', 'Integrated Computing Technology'], 'Information and Communications Technology', 'easy'),
  obj('Which of the following is an input device?', ['monitor', 'printer', 'keyboard', 'speaker'], 'keyboard', 'easy'),
  obj('The CPU stands for:', ['Central Programming Unit', 'Central Processing Unit', 'Computer Printing Utility', 'Core Processing Unit'], 'Central Processing Unit', 'easy'),
  obj('Which storage medium has the highest storage capacity?', ['floppy disk', 'CD-ROM', 'USB flash drive', 'hard disk drive'], 'hard disk drive', 'medium'),
  obj('RAM stands for:', ['Read And Memory', 'Random Access Memory', 'Rapid Application Memory', 'Read Access Module'], 'Random Access Memory', 'easy'),
  obj('Which of the following is NOT an operating system?', ['Windows', 'Linux', 'Microsoft Word', 'macOS'], 'Microsoft Word', 'easy'),
  obj('The internet is best described as:', ['a computer program', 'a global network of interconnected computers', 'a type of software', 'a social media platform'], 'a global network of interconnected computers', 'easy'),
  obj('Which protocol is used to send emails?', ['HTTP', 'FTP', 'SMTP', 'TCP'], 'SMTP', 'hard'),
  obj('A spreadsheet is used to:', ['design graphics', 'organise, calculate and analyse data', 'browse the internet', 'write stories'], 'organise, calculate and analyse data', 'medium'),
  obj('The cell address B5 in a spreadsheet means:', ['row B, column 5', 'column B, row 5', 'page B, section 5', 'box 5 of group B'], 'column B, row 5', 'medium'),
  obj('Which of the following is an example of application software?', ['BIOS', 'Windows 11', 'Microsoft Excel', 'Device drivers'], 'Microsoft Excel', 'medium'),
  obj('A website address is also called a:', ['username', 'password', 'URL', 'IP address'], 'URL', 'medium'),
  obj('Which key is used to delete characters to the left of the cursor?', ['Delete', 'Backspace', 'Escape', 'Shift'], 'Backspace', 'easy'),
  obj('What does "booting" a computer mean?', ['shutting down the computer', 'restarting and loading the operating system', 'installing new software', 'formatting the hard disk'], 'restarting and loading the operating system', 'medium'),
  obj('The process of copying files from the internet to your computer is called:', ['uploading', 'streaming', 'downloading', 'emailing'], 'downloading', 'easy'),
  obj('Which of the following is a type of malware?', ['firewall', 'antivirus', 'Trojan horse', 'browser'], 'Trojan horse', 'medium'),
  obj('In Microsoft Word, Ctrl+S is used to:', ['select all text', 'save a document', 'search for text', 'switch windows'], 'save a document', 'easy'),
  obj('Binary is a number system that uses only which digits?', ['0–9', '0 and 1', '0, 1, and 2', 'A–F'], '0 and 1', 'medium'),
  obj('The number 8 in binary is:', ['1000', '1001', '1010', '1100'], '1000', 'hard'),
  obj('What is a database?', ['a type of website', 'a collection of organised data stored electronically', 'a kind of email service', 'a computer game'], 'a collection of organised data stored electronically', 'medium'),
  obj('Which of the following best defines "phishing"?', ['sending spam emails', 'tricking users into giving personal information by pretending to be a trusted source', 'illegally copying software', 'blocking websites'], 'tricking users into giving personal information by pretending to be a trusted source', 'hard'),
  obj('Ctrl+Z in most applications is used to:', ['zoom in', 'undo the last action', 'copy text', 'paste text'], 'undo the last action', 'easy'),
  obj('A computer network that covers a small area like a school or office is called a:', ['WAN', 'MAN', 'LAN', 'PAN'], 'LAN', 'medium'),
  obj('Which of the following is a search engine?', ['WhatsApp', 'Google Chrome', 'Google Search', 'Microsoft Word'], 'Google Search', 'easy'),
  obj('The function =SUM(A1:A5) in a spreadsheet:', ['multiplies A1 by A5', 'adds all values from A1 to A5', 'counts cells from A1 to A5', 'finds the average of A1 to A5'], 'adds all values from A1 to A5', 'medium'),
  obj('WWW stands for:', ['World Wide Web', 'Wide World Website', 'World Web Wireless', 'Wide Web World'], 'World Wide Web', 'easy'),
  obj('Which device converts digital signals to analog for telephone transmission?', ['scanner', 'modem', 'router', 'hub'], 'modem', 'hard'),
  obj('What does "copy and paste" mean in computing?', ['move a file permanently', 'duplicate content from one location to another', 'delete and recreate content', 'rename a file'], 'duplicate content from one location to another', 'easy'),
  obj('Which of the following is NOT a part of an email address?', ['@', 'domain name', 'username', 'www'], 'www', 'medium'),
  obj('The term "cyberbullying" refers to:', ['hacking into computers', 'bullying or harassing others using digital devices and the internet', 'spreading computer viruses', 'downloading illegal software'], 'bullying or harassing others using digital devices and the internet', 'medium'),
  obj('What is the main function of an antivirus software?', ['speed up the computer', 'detect and remove malicious software', 'connect to the internet', 'manage files and folders'], 'detect and remove malicious software', 'medium'),
  obj('Which of the following is an output device?', ['keyboard', 'mouse', 'scanner', 'printer'], 'printer', 'easy'),
  obj('In computing, a "bug" refers to:', ['a computer virus', 'an error or flaw in a program', 'a type of hardware', 'a slow internet connection'], 'an error or flaw in a program', 'medium'),
  obj('Saving a document with the extension .docx means it was created with:', ['Microsoft Excel', 'Microsoft PowerPoint', 'Microsoft Word', 'Google Sheets'], 'Microsoft Word', 'easy'),
  obj('Which generation of computers used vacuum tubes?', ['First', 'Second', 'Third', 'Fourth'], 'First', 'hard'),
  obj('E-commerce means:', ['electronic communication', 'buying and selling goods online', 'sending emails for business', 'managing electronic records'], 'buying and selling goods online', 'medium'),
  obj('The shortcut key for printing a document is:', ['Ctrl+X', 'Ctrl+P', 'Ctrl+B', 'Ctrl+A'], 'Ctrl+P', 'easy'),
  obj('What is software?', ['the physical parts of a computer', 'a set of instructions that tells a computer what to do', 'a type of computer screen', 'cables and connectors'], 'a set of instructions that tells a computer what to do', 'easy'),
  obj('Which of the following is a primary storage device?', ['DVD', 'USB stick', 'RAM', 'hard disk'], 'RAM', 'hard'),
  obj('A pixel is the smallest unit of a:', ['sound file', 'digital image', 'text document', 'spreadsheet'], 'digital image', 'medium'),
];

const ICT_BS9_SUBJ = [
  subj('(a) Explain FIVE uses of computers in education.\n(b) State TWO disadvantages of over-reliance on computers in schools.', 12),
  subj('(a) What is the difference between hardware and software? Give TWO examples of each.\n(b) Explain the functions of the following hardware components: RAM, Hard Disk, CPU.', 12),
  subj('(a) Convert the binary number 1101 to decimal.\n(b) Convert the decimal number 15 to binary.\n(c) Explain why computers use the binary number system.', 12, 'Use the place value method for conversions.'),
  subj('Describe FIVE ways to stay safe online (internet safety practices).', 10),
  subj('(a) What is a computer network? (b) State THREE advantages of networking computers in a school.\n(c) Distinguish between a LAN and a WAN.', 12),
  subj('Describe the history of computers. In your answer, explain the characteristics of computers in the 1st, 2nd, and 3rd generations.', 12),
  subj('(a) What is a spreadsheet? (b) Describe how you would use a spreadsheet to calculate students\' total scores and averages for a class of 30 students.\n(c) Name the formula you would use to find the highest mark.', 12),
  subj('(a) What is e-commerce? (b) Explain THREE advantages and TWO disadvantages of buying and selling goods online.', 10),
];

// ════════════════════════════════════════════════════════════════════════════
// MATHEMATICS — Basic 9 (JHS 3 / BECE level)
// ════════════════════════════════════════════════════════════════════════════
const MATHS_BS9_OBJ = [
  obj('Simplify: 3x + 5x - 2x', ['4x', '6x', '8x', '10x'], '6x', 'easy'),
  obj('The gradient of the line y = 3x + 7 is:', ['7', '3', '3x', '1/3'], '3', 'medium'),
  obj('What is the value of x if 2x + 3 = 11?', ['3', '4', '5', '6'], '4', 'easy'),
  obj('Find the simple interest on GH¢500 at 5% per annum for 3 years.', ['GH¢50', 'GH¢75', 'GH¢80', 'GH¢100'], 'GH¢75', 'medium'),
  obj('What is 12% of 250?', ['25', '28', '30', '34'], '30', 'medium'),
  obj('The LCM of 12, 18, and 24 is:', ['36', '48', '72', '96'], '72', 'hard'),
  obj('Which of the following is the correct formula for the area of a circle?', ['A = 2πr', 'A = πr²', 'A = πd', 'A = 2πr²'], 'A = πr²', 'medium'),
  obj('A car travels at 60 km/h. How far does it travel in 2.5 hours?', ['120 km', '140 km', '150 km', '160 km'], '150 km', 'medium'),
  obj('Factorise: x² - 9', ['(x+3)(x-3)', '(x-9)(x+1)', '(x+9)(x-1)', '(x-3)(x-3)'], '(x+3)(x-3)', 'hard'),
  obj('The sum of interior angles of a pentagon is:', ['360°', '450°', '540°', '720°'], '540°', 'hard'),
  obj('Evaluate: √144', ['11', '12', '13', '14'], '12', 'easy'),
  obj('What is 2³ × 2⁴?', ['2⁷', '2¹²', '4⁷', '8⁷'], '2⁷', 'medium'),
  obj('What is the probability of picking a red ball from a bag containing 4 red, 3 blue, and 3 green balls?', ['1/3', '2/5', '4/10', '3/10'], '4/10', 'medium'),
  obj('A man buys a phone for GH¢800 and sells it for GH¢680. What is his percentage loss?', ['10%', '12%', '15%', '20%'], '15%', 'hard'),
  obj('Solve: 2(3x - 4) = 16', ['2', '3', '4', '5'], '4', 'medium'),
  obj('The mean of 5, 8, 12, 15, and 10 is:', ['8', '9', '10', '11'], '10', 'easy'),
  obj('If the angles of a triangle are in the ratio 2:3:5, find the largest angle.', ['36°', '54°', '72°', '90°'], '90°', 'hard'),
  obj('Convert 0.35 to a fraction in its simplest form:', ['35/10', '7/20', '3/5', '35/100'], '7/20', 'medium'),
  obj('Which of the following is irrational?', ['0.25', '4/3', '√7', '0.333...'], '√7', 'hard'),
  obj('The volume of a cube with side 5 cm is:', ['25 cm³', '75 cm³', '100 cm³', '125 cm³'], '125 cm³', 'medium'),
  obj('A map scale is 1:50,000. If a road is 3 cm on the map, its actual length is:', ['15 km', '1.5 km', '150 m', '15,000 km'], '1.5 km', 'hard'),
  obj('Find the HCF of 36 and 48:', ['6', '8', '12', '16'], '12', 'medium'),
  obj('If y = 2x - 3, what is y when x = 5?', ['5', '7', '10', '13'], '7', 'easy'),
  obj('A circle has a radius of 7 cm. Its circumference (using π = 22/7) is:', ['22 cm', '44 cm', '154 cm', '176 cm'], '44 cm', 'medium'),
  obj('What type of triangle has all three sides equal?', ['isosceles', 'scalene', 'equilateral', 'right-angled'], 'equilateral', 'easy'),
  obj('Expand: (x + 3)(x + 4)', ['x² + 7x + 12', 'x² + 12x + 7', 'x² + x + 12', 'x² + 7x + 7'], 'x² + 7x + 12', 'hard'),
  obj('A discount of 20% is given on an item marked at GH¢150. What is the selling price?', ['GH¢100', 'GH¢120', 'GH¢125', 'GH¢130'], 'GH¢120', 'medium'),
  obj('The median of 3, 7, 2, 9, 5, 6, 1 (arranged in order) is:', ['3', '5', '6', '7'], '5', 'medium'),
  obj('Two supplementary angles are in the ratio 1:2. Find the smaller angle.', ['30°', '45°', '60°', '90°'], '60°', 'hard'),
  obj('If f(x) = x² + 2x - 3, find f(2).', ['3', '4', '5', '6'], '5', 'hard'),
  obj('A rectangular tank is 8 m long, 5 m wide and 3 m deep. What is its volume?', ['80 m³', '100 m³', '120 m³', '150 m³'], '120 m³', 'medium'),
  obj('Simplify: (15a²b) ÷ (5ab)', ['3a', '3b', '10ab', '3a²b'], '3a', 'hard'),
  obj('What is the reciprocal of 2/5?', ['2/5', '5/2', '5', '0.2'], '5/2', 'medium'),
  obj('Find the gradient of a line joining (2, 1) and (6, 9).', ['1', '2', '3', '4'], '2', 'hard'),
  obj('A sum of money doubles itself in 10 years at simple interest. What is the rate?', ['5%', '10%', '15%', '20%'], '10%', 'hard'),
  obj('The exterior angle of a regular hexagon is:', ['45°', '50°', '60°', '72°'], '60°', 'hard'),
  obj('Express 0.00046 in standard form.', ['4.6 × 10⁻⁴', '4.6 × 10⁴', '4.6 × 10⁻³', '46 × 10⁻⁵'], '4.6 × 10⁻⁴', 'hard'),
  obj('Which set notation represents all elements in set A OR set B (or both)?', ['A ∩ B', 'A ∪ B', 'A - B', "A'"  ], 'A ∪ B', 'medium'),
  obj('Round 3.4567 to 2 decimal places.', ['3.46', '3.45', '3.5', '3.47'], '3.46', 'medium'),
  obj('If the area of a square is 81 cm², what is its perimeter?', ['9 cm', '18 cm', '36 cm', '81 cm'], '36 cm', 'medium'),
];

const MATHS_BS9_SUBJ = [
  subj('(a) Factorise completely: 3x² - 12x\n(b) Solve for x: x² - 5x + 6 = 0\n(c) If f(x) = 2x + 1, find f⁻¹(x) (the inverse function)', 15, 'For (b) use factorisation. For (c) swap x and f(x) then solve.'),
  subj('A merchant buys 80 kg of maize at GH¢3.50 per kg.\n(a) Find the total cost price.\n(b) If she sells 60 kg at GH¢5.00 per kg and the rest at GH¢4.00 per kg, find her total selling price.\n(c) Calculate her profit or loss as a percentage.', 15),
  subj('The following are marks scored by 10 students in a test: 45, 72, 58, 89, 63, 72, 81, 58, 72, 50.\n(a) Find the mean.\n(b) Find the median.\n(c) Find the mode.\n(d) Find the range.', 15),
  subj('(a) Using a ruler and compass only, construct a triangle ABC where AB = 8 cm, BC = 6 cm and angle ABC = 90°. Measure and state the length of AC.\n(b) State the theorem you used to verify your answer.', 15),
  subj('A cylindrical water tank has a radius of 3.5 m and a height of 10 m.\n(a) Calculate the volume of the tank. (Take π = 22/7)\n(b) If water flows in at a rate of 5 m³ per minute, how long will it take to fill the tank?\n(c) If the water is to fill a rectangular pool that is 10 m × 7 m × 5 m, will the tank hold enough water?', 15),
  subj('(a) Solve the simultaneous equations:\n   2x + 3y = 12\n   x - y = 1\n(b) Using the values found, verify both solutions satisfy the original equations.', 15, 'Use substitution or elimination method.'),
  subj('The table shows the number of students who scored various marks:\n\nMarks: 1–10, 11–20, 21–30, 31–40, 41–50\nFrequency: 3, 7, 12, 10, 8\n\n(a) Draw a frequency polygon for this data.\n(b) What is the modal class?\n(c) Estimate the mean using class midpoints.', 15),
];

// ════════════════════════════════════════════════════════════════════════════
// ENGLISH — Basic 9 (JHS 3 / BECE level)
// ════════════════════════════════════════════════════════════════════════════
const ENGLISH_BS9_OBJ = [
  obj('Choose the word that is spelt correctly:', ['accomodation', 'accomadation', 'accommodation', 'accommadation'], 'accommodation', 'medium'),
  obj('Which sentence is in the passive voice?', ['The dog chased the boy.', 'The boy was chased by the dog.', 'The boy chases the dog.', 'The boy will chase the dog.'], 'The boy was chased by the dog.', 'medium'),
  obj('Identify the figure of speech: "The classroom was as quiet as a graveyard."', ['metaphor', 'personification', 'simile', 'hyperbole'], 'simile', 'easy'),
  obj('"The baby slept soundly." The adverb in this sentence is:', ['baby', 'slept', 'soundly', 'the'], 'soundly', 'easy'),
  obj('Choose the sentence that uses the apostrophe correctly:', ['the boys books were lost', "the boy's books were lost", "the boys' book were lost", "the boys's books were lost"], "the boy's books were lost", 'medium'),
  obj('The plural of "criterion" is:', ['criterions', 'criterias', 'criteria', 'criteriones'], 'criteria', 'hard'),
  obj('"Despite the heavy rain, the match continued." This sentence contains:', ['a noun clause', 'an adverbial clause of concession', 'an adjectival clause', 'a relative clause'], 'an adverbial clause of concession', 'hard'),
  obj('Which word means "to make clear or easier to understand"?', ['complicate', 'elucidate', 'obfuscate', 'confuse'], 'elucidate', 'hard'),
  obj('The correct word for "relating to the moon" is:', ['solar', 'astral', 'lunar', 'stellar'], 'lunar', 'medium'),
  obj('Choose the word that best completes: "The politician\'s speech was so ___ that even his opponents applauded."', ['dull', 'mediocre', 'eloquent', 'offensive'], 'eloquent', 'medium'),
  obj('"She is the girl ___ won the prize." The relative pronoun is:', ['which', 'whom', 'who', 'whose'], 'who', 'medium'),
  obj('What is the superlative form of "good"?', ['gooder', 'more good', 'better', 'best'], 'best', 'easy'),
  obj('Identify the conjunction: "He studied hard so that he could pass the exam."', ['studied', 'hard', 'so that', 'pass'], 'so that', 'medium'),
  obj('"To burn the midnight oil" means:', ['to set fire at night', 'to study or work very late', 'to cook at midnight', 'to waste energy'], 'to study or work very late', 'medium'),
  obj('Choose the sentence with correct subject-verb agreement:', ['The team are winning.', 'The committee have decided.', 'The group of students is ready.', 'The flock of birds are flying.'], 'The group of students is ready.', 'hard'),
  obj('The word "benevolent" means:', ['cruel', 'selfish', 'well-meaning and kind', 'careless'], 'well-meaning and kind', 'medium'),
  obj('Which of the following is an example of alliteration?', ['"She sells seashells by the seashore."', '"It was as hot as the sun."', '"The wind whispered stories of old."', '"He roared like a lion."'], '"She sells seashells by the seashore."', 'medium'),
  obj('Identify the type of noun in bold: "The **honesty** of the child was admirable."', ['proper noun', 'collective noun', 'abstract noun', 'material noun'], 'abstract noun', 'medium'),
  obj('The correct reported speech for "She said, \'I am tired\'" is:', ['She said that she is tired.', 'She said that she was tired.', 'She said I was tired.', 'She told that she was tired.'], 'She said that she was tired.', 'hard'),
  obj('"Deforestation" is the removal of:', ['water from rivers', 'trees from forests', 'minerals from the ground', 'animals from habitats'], 'trees from forests', 'easy'),
  obj('What does the prefix "mis-" mean in the word "misunderstand"?', ['again', 'before', 'wrongly', 'against'], 'wrongly', 'medium'),
  obj('Choose the antonym of "verbose":', ['wordy', 'talkative', 'concise', 'lengthy'], 'concise', 'hard'),
  obj('Which of the following is a compound-complex sentence?', ['She ran.', 'She ran and jumped.', 'Although she was tired, she ran and she jumped.', 'She was tired.'], 'Although she was tired, she ran and she jumped.', 'hard'),
  obj('The word "ambiguous" means:', ['clear and precise', 'having more than one possible meaning', 'absolutely certain', 'very specific'], 'having more than one possible meaning', 'hard'),
  obj('"The chairman himself opened the ceremony." The word "himself" is a ___ pronoun.', ['personal', 'relative', 'emphatic', 'reflexive'], 'emphatic', 'hard'),
  obj('Which of the following words has a silent letter?', ['book', 'table', 'knight', 'chair'], 'knight', 'medium'),
  obj('What is a "soliloquy"?', ['a conversation between two people', 'a speech delivered alone to express inner thoughts', 'a formal debate', 'a song of praise'], 'a speech delivered alone to express inner thoughts', 'hard'),
  obj('The sentence "Kofi and Ama went to school" is an example of a:', ['simple sentence', 'compound sentence', 'complex sentence', 'compound-complex sentence'], 'simple sentence', 'medium'),
  obj('Choose the correctly spelt word:', ['neccessary', 'necessary', 'nescessary', 'neccesary'], 'necessary', 'medium'),
  obj('"Every cloud has a silver lining" means:', ['dark clouds contain silver', 'every bad situation has a positive side', 'weather affects silver mining', 'silver is found in clouds'], 'every bad situation has a positive side', 'easy'),
  obj('The literary device where an author hints at future events is called:', ['flashback', 'foreshadowing', 'irony', 'allegory'], 'foreshadowing', 'hard'),
  obj('Which of these words is a gerund?', ['run', 'running', 'runner', 'ran'], 'running', 'hard'),
  obj('The story of a person\'s life written by themselves is called:', ['biography', 'autobiography', 'novel', 'diary'], 'autobiography', 'medium'),
  obj('"We were exhausted; nevertheless, we continued." The word "nevertheless" is a:', ['conjunction', 'preposition', 'conjunctive adverb', 'relative pronoun'], 'conjunctive adverb', 'hard'),
  obj('Identify the main clause: "When the rain stopped, the children went outside."', ['"When the rain stopped"', '"the children went outside"', '"the rain stopped"', '"went outside"'], '"the children went outside"', 'hard'),
  obj('The word "euphemism" refers to:', ['exaggerating for effect', 'a polite expression for something unpleasant', 'a direct and harsh statement', 'using symbols in writing'], 'a polite expression for something unpleasant', 'hard'),
  obj('Which of the following uses a colon correctly?', ['I need: bread, eggs, and milk.', 'I need bread: eggs, and milk.', 'I need the following items: bread, eggs, and milk.', 'I: need bread, eggs, and milk.'], 'I need the following items: bread, eggs, and milk.', 'medium'),
  obj('The opposite of "loquacious" is:', ['talkative', 'noisy', 'taciturn', 'enthusiastic'], 'taciturn', 'hard'),
  obj('A phrase that has a different meaning from the literal words is called:', ['metaphor', 'idiom', 'hyperbole', 'oxymoron'], 'idiom', 'medium'),
  obj('Choose the word that correctly completes: "The principal ___ the students for their excellent performance."', ['complement', 'complimented', 'complemented', 'complimented'], 'complimented', 'medium'),
];

const ENGLISH_BS9_SUBJ = [
  subj('Read the following passage and answer the questions that follow:\n\n"The impact of technology on modern society cannot be overstated. In virtually every field — from medicine and agriculture to communication and education — technology has brought about remarkable improvements in the quality of human life. However, alongside these benefits come significant challenges: rising unemployment due to automation, social isolation caused by overuse of devices, and increased cybercrime. It is therefore important for societies to adopt a balanced approach to technological advancement."\n\n(a) What is the main idea of the passage?\n(b) Give TWO benefits of technology mentioned in the passage.\n(c) State TWO problems associated with technology according to the passage.\n(d) What does the word "automation" mean as used in the passage?\n(e) The author suggests that society should take a "balanced approach." Explain what this means in your own words.', 20, 'Use evidence from the passage.'),
  subj('You are writing a letter to the Editor of the Daily Graphic about the problem of poor sanitation in your community. In your letter:\n- Describe the problem\n- Explain its effects on health and the community\n- Suggest at least THREE solutions\nUse proper letter format.', 20),
  subj('Write an essay of about 250 words on the topic: "The Role of Youth in National Development." Include an introduction, at least THREE main points with explanations, and a conclusion.', 20),
  subj('Rewrite the following sentences as instructed:\n(a) "They built a new hospital in the town." (Change to passive voice)\n(b) Kofi said, "I will visit tomorrow." (Change to indirect speech)\n(c) "Though she was tired, she finished her work." (Begin with: "She finished her work...")\n(d) "He is the fastest runner in the class." (Use the comparative degree)\n(e) Combine these two sentences using a relative pronoun: "The girl won the award. The girl is in my class."', 15),
  subj('Explain the following figures of speech and give ONE original example of each:\n(a) Simile\n(b) Metaphor\n(c) Personification\n(d) Hyperbole\n(e) Irony', 15),
  subj('Write a story that ends with the words: "...and from that day on, nothing was ever the same again." Your story should be between 200 and 250 words. Give your story an appropriate title.', 20),
  subj('(a) What is a paragraph? State FOUR features of a good paragraph.\n(b) Write a well-developed paragraph on the topic: "The importance of reading books."', 15),
];

// ─── Build exam objects ───────────────────────────────────────────────────────
function buildExam({ title, description, classLevel, subjectName, durationMinutes, objQuestions, subjQuestions }) {
  return {
    title,
    description,
     
     
     
    duration_minutes: durationMinutes,
    is_published: true,
    school_id: null,
    shuffle_questions: false,
    content: { exam_type: 'waec', class_level: classLevel, subject_name: subjectName,
      sections: [
        {
          name: 'Section A',
          type: 'objective',
          instructions: 'Answer ALL 40 questions. Each question carries 1 mark. Choose the BEST answer from the options A, B, C and D.',
          questions: objQuestions.map((q, i) => ({
            id: q.id,
            number: i + 1,
            text: q.text,
            options: q.options,
            correctAnswer: q.correctAnswer,
            difficulty: q.difficulty,
          }))
        },
        {
          name: 'Section B',
          type: 'subjective',
          instructions: `Answer 5 out of the ${subjQuestions.length} questions. Each question carries equal marks. Where applicable, show all working clearly.`,
          required: 5,
          questions: subjQuestions.map((q, i) => ({
            id: q.id,
            number: i + 1,
            text: q.text,
            marks: q.marks,
            hint: q.hint || '',
          }))
        }
      ]
    }
  };
}

const EXAMS = [
  buildExam({
    title: 'Basic 1 English Language — WAEC Mock Exam',
    description: 'A WAEC-style English Language exam for Basic 1 students. Tests grammar, vocabulary, comprehension and writing skills.',
    classLevel: 'Basic 1',
    subjectName: 'English Language',
    durationMinutes: 90,
    objQuestions: ENGLISH_BS1_OBJ,
    subjQuestions: ENGLISH_BS1_SUBJ,
  }),
  buildExam({
    title: 'Basic 1 Mathematics — WAEC Mock Exam',
    description: 'A WAEC-style Mathematics exam for Basic 1 students. Tests number sense, arithmetic, shapes and measurement.',
    classLevel: 'Basic 1',
    subjectName: 'Mathematics',
    durationMinutes: 90,
    objQuestions: MATHS_BS1_OBJ,
    subjQuestions: MATHS_BS1_SUBJ,
  }),
  buildExam({
    title: 'Basic 7 Integrated Science — WAEC Mock Exam',
    description: 'A WAEC-style Integrated Science exam for JHS 1 students covering biology, chemistry, physics and environmental science.',
    classLevel: 'Basic 7',
    subjectName: 'Integrated Science',
    durationMinutes: 120,
    objQuestions: SCIENCE_BS7_OBJ,
    subjQuestions: SCIENCE_BS7_SUBJ,
  }),
  buildExam({
    title: 'Basic 9 Social Studies — WAEC BECE Mock Exam',
    description: 'A BECE-style Social Studies exam for JHS 3 students. Covers Ghanaian history, governance, economics and environment.',
    classLevel: 'Basic 9',
    subjectName: 'Social Studies',
    durationMinutes: 120,
    objQuestions: SOCIAL_BS9_OBJ,
    subjQuestions: SOCIAL_BS9_SUBJ,
  }),
  buildExam({
    title: 'Basic 9 ICT — WAEC BECE Mock Exam',
    description: 'A BECE-style ICT exam for JHS 3 students. Covers hardware, software, networking, internet safety and digital skills.',
    classLevel: 'Basic 9',
    subjectName: 'ICT',
    durationMinutes: 90,
    objQuestions: ICT_BS9_OBJ,
    subjQuestions: ICT_BS9_SUBJ,
  }),
  buildExam({
    title: 'Basic 9 Mathematics — WAEC BECE Mock Exam',
    description: 'A BECE-style Mathematics exam for JHS 3 students. Covers algebra, geometry, statistics, and number theory at WAEC standard.',
    classLevel: 'Basic 9',
    subjectName: 'Mathematics',
    durationMinutes: 150,
    objQuestions: MATHS_BS9_OBJ,
    subjQuestions: MATHS_BS9_SUBJ,
  }),
  buildExam({
    title: 'Basic 9 English Language — WAEC BECE Mock Exam',
    description: 'A BECE-style English Language exam for JHS 3 students. Covers comprehension, grammar, essay writing, and literature at WAEC standard.',
    classLevel: 'Basic 9',
    subjectName: 'English Language',
    durationMinutes: 150,
    objQuestions: ENGLISH_BS9_OBJ,
    subjQuestions: ENGLISH_BS9_SUBJ,
  }),
];

// ─── Run seeder ───────────────────────────────────────────────────────────────
async function run() {
  console.log('🎓 Seeding WAEC-style exams...\n');

  for (const exam of EXAMS) {
    console.log(`📝 Creating: ${exam.title}`);
    const { error } = await supabase.from('global_quizzes').insert(exam);
    if (error) {
      console.error(`   ❌ Error:`, error.message);
    } else {
      const secA = exam.content.sections[0].questions.length;
      const secB = exam.content.sections[1].questions.length;
      console.log(`   ✅ Done — Section A: ${secA} objectives, Section B: ${secB} subjective (pick 5)`);
    }
  }

  console.log('\n🎉 All WAEC exams seeded successfully!');
}

run();
