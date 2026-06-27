// seed_waec_10subj.mjs
// New WAEC-style exams with 40 objectives + 10 subjectives (pick 5)
// Run: node seed_waec_10subj.mjs

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

let _qid = 0;
const qid = () => `q${++_qid}`;
const obj = (text, options, correctAnswer, diff = 'medium') => ({ id: qid(), type: 'objective', text, options, correctAnswer, diff });
const subj = (text, marks = 10, hint = '') => ({ id: qid(), type: 'subjective', text, marks, hint });

// ═════════════════════════════════════════════════════════════════════
// BASIC 9 — English Language (BECE)
// ═════════════════════════════════════════════════════════════════════
const ENG_B9_OBJ = [
  obj('Choose the word that is spelt correctly:', ['Recieve', 'Achieve', 'Beleive', 'Peice'], 'Achieve', 'medium'),
  obj('Which sentence is grammatically correct?', ['She don\'t like mangoes.', 'She doesn\'t like mangoes.', 'She do not likes mangoes.', 'She not like mangoes.'], 'She doesn\'t like mangoes.', 'easy'),
  obj('The synonym of "enormous" is:', ['Tiny', 'Huge', 'Bright', 'Quick'], 'Huge', 'easy'),
  obj('Identify the noun in the sentence: "The clever boy solved the puzzle quickly."', ['clever', 'solved', 'quickly', 'boy'], 'boy', 'easy'),
  obj('Which of the following is a compound sentence?', ['She sang a song.', 'She sang a song and he played the guitar.', 'Although she sang beautifully.', 'Running fast and jumping high.'], 'She sang a song and he played the guitar.', 'medium'),
  obj('The antonym of "generous" is:', ['Kind', 'Selfish', 'Brave', 'Honest'], 'Selfish', 'easy'),
  obj('Which punctuation mark is needed? "What a beautiful day__"', ['Full stop (.)', 'Comma (,)', 'Exclamation mark (!)', 'Semicolon (;)'], 'Exclamation mark (!)', 'easy'),
  obj('The word "their" belongs to which part of speech?', ['Verb', 'Adjective', 'Possessive pronoun', 'Conjunction'], 'Possessive pronoun', 'medium'),
  obj('"He ran as fast as the wind." This is an example of:', ['A metaphor', 'A simile', 'Personification', 'Alliteration'], 'A simile', 'medium'),
  obj('Which sentence uses the present perfect tense correctly?', ['She has gone to school.', 'She gone to school.', 'She have went to school.', 'She had go to school.'], 'She has gone to school.', 'medium'),
  obj('The plural of "child" is:', ['Childs', 'Childrens', 'Children', 'Childer'], 'Children', 'easy'),
  obj('Choose the correct article: "___ apple a day keeps the doctor away."', ['A', 'An', 'The', 'No article needed'], 'An', 'easy'),
  obj('"The stars danced in the night sky." This is an example of:', ['Simile', 'Hyperbole', 'Personification', 'Onomatopoeia'], 'Personification', 'medium'),
  obj('Which of these is a subordinating conjunction?', ['And', 'But', 'Although', 'Or'], 'Although', 'medium'),
  obj('The passive voice of "The teacher corrected the essays" is:', ['The essays corrected the teacher.', 'The essays were corrected by the teacher.', 'The teacher was corrected by the essays.', 'The essays are being corrected.'], 'The essays were corrected by the teacher.', 'hard'),
  obj('Which word is a verb in: "The fast runner easily broke the record."?', ['fast', 'runner', 'easily', 'broke'], 'broke', 'easy'),
  obj('Choose the correct option: "Neither the boys _____ the girls were at home."', ['or', 'nor', 'and', 'but'], 'nor', 'medium'),
  obj('A word that imitates a sound is called:', ['A metaphor', 'Onomatopoeia', 'An idiom', 'A proverb'], 'Onomatopoeia', 'medium'),
  obj('"It\'s raining cats and dogs" is an example of:', ['A simile', 'A metaphor', 'An idiom', 'A proverb'], 'An idiom', 'medium'),
  obj('Which sentence uses reported speech correctly? She said, "I am tired."', ['"She said that she was tired."', '"She said that I am tired."', '"She told she is tired."', '"She said am tired."'], '"She said that she was tired."', 'hard'),
  obj('The word "quickly" is a:', ['Noun', 'Verb', 'Adjective', 'Adverb'], 'Adverb', 'easy'),
  obj('Choose the correctly punctuated sentence:', ['Kofi who is my friend is coming.', 'Kofi, who is my friend, is coming.', 'Kofi who, is my friend is coming.', 'Kofi who is, my friend is coming.'], 'Kofi, who is my friend, is coming.', 'hard'),
  obj('In the sentence "The tall, dark stranger appeared at the door," the adjectives are:', ['tall and stranger', 'tall and dark', 'dark and door', 'tall and appeared'], 'tall and dark', 'easy'),
  obj('What is the meaning of the prefix "un-" in "unhappy"?', ['Very', 'Not', 'Again', 'Before'], 'Not', 'easy'),
  obj('Which of the following is a complex sentence?', ['She cried and ran away.', 'She cried.', 'Because she was upset, she cried.', 'Crying and running.'], 'Because she was upset, she cried.', 'medium'),
  obj('The word "beautiful" can be changed to a noun by adding the suffix:', ['-ly', '-ness', '-ful', '-less'], '-ness', 'medium'),
  obj('Choose the correct form: "I wish I _____ taller."', ['am', 'was', 'were', 'be'], 'were', 'hard'),
  obj('A biography is a piece of writing about:', ['Fictional characters', 'Historical events only', 'A real person\'s life written by someone else', 'Your own life'], 'A real person\'s life written by someone else', 'medium'),
  obj('Which literary device is used in: "Peter Piper picked a peck of pickled peppers"?', ['Assonance', 'Rhyme', 'Alliteration', 'Simile'], 'Alliteration', 'medium'),
  obj('"A blessing in disguise" means:', ['Something that looks bad but is actually good', 'A religious ceremony', 'A hidden treasure', 'Something very dangerous'], 'Something that looks bad but is actually good', 'medium'),
  obj('The sentence "Ouch! That hurts!" is an example of an:', ['Imperative sentence', 'Interrogative sentence', 'Exclamatory sentence', 'Declarative sentence'], 'Exclamatory sentence', 'easy'),
  obj('Which word correctly completes the sentence: "The committee _____ unable to reach a decision."', ['were', 'was', 'is being', 'have'], 'was', 'hard'),
  obj('"To let the cat out of the bag" means to:', ['Release a pet', 'Secretly hide something', 'Accidentally reveal a secret', 'Start a fight'], 'Accidentally reveal a secret', 'medium'),
  obj('The tone of a poem refers to:', ['The speed at which it is read', 'The author\'s attitude or feeling in the writing', 'The rhyme scheme', 'The length of each line'], 'The author\'s attitude or feeling in the writing', 'medium'),
  obj('Which of the following is an example of direct speech?', ['He said he was tired.', 'She asked if I was coming.', '"I am going to school," said Ama.', 'They told us to sit down.'], '"I am going to school," said Ama.', 'easy'),
  obj('The process of putting events in order from first to last is called:', ['Summarising', 'Sequencing', 'Predicting', 'Inferring'], 'Sequencing', 'easy'),
  obj('Which of these is a concrete noun?', ['Love', 'Happiness', 'Table', 'Justice'], 'Table', 'easy'),
  obj('Choose the sentence that has a dangling modifier:', ['Running to catch the bus, Kwame tripped.', 'Running to catch the bus, the keys were dropped.', 'Kwame ran and tripped over his keys.', 'The keys were in Kwame\'s pocket.'], 'Running to catch the bus, the keys were dropped.', 'hard'),
  obj('"The pen is mightier than the sword" is best described as a:', ['Simile', 'Idiom', 'Proverb', 'Metaphor'], 'Proverb', 'medium'),
  obj('The word "government" consists of how many syllables?', ['2', '3', '4', '5'], '3', 'medium'),
];

const ENG_B9_SUBJ = [
  subj('Read the following passage carefully and answer ALL the questions below.\n\n"Every year during the dry season, the village of Abofu faces a serious water shortage. Women and children walk miles to fetch water from a distant stream. The village head, Nana Kusi, decided to write a letter to the District Assembly appealing for a borehole. Three months later, a water pump was installed in the centre of the village. The community celebrated with songs and dances. Nana Kusi reminded his people: \'United we stand; divided we fall.\'\n\n(a) What problem did Abofu village face?\n(b) What did Nana Kusi do to solve the problem?\n(c) What is the meaning of the proverb: "United we stand; divided we fall"?\n(d) Name TWO things that tell you the community worked together.\n(e) Suggest ONE other way the village could secure clean water for the future.', 20, 'Focus on the passage to find evidence for your answers.'),
  subj('Write a letter to your friend in another town, describing a festival you attended recently in your community. Your letter should include:\n- The name of the festival and when it was held\n- What activities took place\n- What you enjoyed most\n- An invitation for your friend to attend next time\n\nYour letter should be well-organised with proper layout (address, date, salutation, body, closing).', 20, 'Use the correct letter format: sender\'s address, date, greeting, body paragraphs, closing.'),
  subj('(a) Explain the difference between a simile and a metaphor.\n(b) Write TWO examples of each.\n(c) Identify and explain the literary device used in the following: "The wind whispered secrets through the trees."', 15, 'Think about comparisons: similes use "like" or "as", while metaphors say something IS something else.'),
  subj('Change the following sentences as instructed:\n(a) Convert to passive voice: "The students submitted the project on time."\n(b) Convert to reported speech: She said, "I will visit you tomorrow."\n(c) Convert to a negative sentence: "Everyone passed the examination."\n(d) Convert to a question: "He is studying for the BECE."\n(e) Convert to direct speech: He told his sister that he would be late.', 15, 'Each conversion carries 3 marks.'),
  subj('Using a suitable topic sentence, write a well-developed paragraph (8–10 sentences) on ONE of the following topics:\n(i) The importance of education for the development of Ghana\n(ii) The effects of social media on Ghanaian youth\n(iii) Why every child has a right to quality healthcare\n\nYour paragraph must include: a topic sentence, supporting details, and a concluding sentence.', 15, 'Choose only ONE topic. Begin with a strong topic sentence that tells the reader what the paragraph is about.'),
  subj('(a) Define the following literary terms with an example of each:\n(i) Alliteration\n(ii) Onomatopoeia\n(iii) Personification\n(iv) Hyperbole\n(v) Irony\n\n(b) Read the following poem excerpt and answer the questions:\n"O Ghana, land of gold and pride,\nWhere rivers flow and green hills bide,\nThy children rise at break of dawn,\nTo build the future, ever-drawn."\n\n(i) What is the mood of this poem?\n(ii) Identify ONE example of imagery in the poem.\n(iii) What message is the poet conveying?', 15, 'For part (a), provide a clear definition and an original example for each term.'),
  subj('You are asked to write a story that begins with the sentence:\n"It was the morning of the final BECE examination when Abena realised she had left her ID card at home."\n\nIn your story, describe:\n- The challenge she faced\n- How she tried to solve it\n- What lessons can be learnt from the experience\n\nYour story should have a clear beginning, middle and end. Write at least 25 sentences.', 20, 'Use vivid language, dialogue and descriptive details to make your story interesting.'),
  subj('(a) What is a formal letter? State THREE features that distinguish a formal letter from an informal letter.\n(b) You are Ama Asante, a student at Greenfield JHS. Write a formal letter to the Headmaster requesting permission to start a school recycling club. Include the purpose of the club, proposed activities, and how it will benefit the school.', 20, 'Remember: formal letters use formal language, full addresses, and a professional tone.'),
  subj('(a) Identify the grammatical function (subject, verb, object, complement, adverbial) of the underlined words in the following sentences:\n(i) The hardworking students passed their examinations brilliantly.\n(ii) Kofi gave his mother a beautiful present.\n(iii) Ghana became a republic in 1960.\n\n(b) Correct the errors in the following sentences and explain what was wrong:\n(i) "The news are very shocking today."\n(ii) "She has went to the market already."\n(iii) "Between you and I, the answer is wrong."\n(iv) "Each of the boys have finished their work."', 15, 'For part (b), write the corrected sentence and briefly explain the grammatical rule.'),
  subj('Write a speech you would deliver at your school\'s Speech and Prize-Giving Day on the topic:\n"Technology: A Tool for Progress or a Threat to Our Youth?"\n\nYour speech should:\n- Have a proper introduction addressing the audience\n- Present at least TWO arguments on each side\n- Give your personal view with reasons\n- End with a strong conclusion\n\n(Write at least 30 sentences)', 20, 'Structure your speech clearly: Introduction → Arguments for → Arguments against → Your stance → Conclusion. Use persuasive language.'),
];

// ═════════════════════════════════════════════════════════════════════
// BASIC 9 — Integrated Science (BECE)
// ═════════════════════════════════════════════════════════════════════
const SCI_B9_OBJ = [
  obj('Which of the following is a scalar quantity?', ['Force', 'Velocity', 'Acceleration', 'Temperature'], 'Temperature', 'medium'),
  obj('The process by which plants lose water through their leaves is called:', ['Photosynthesis', 'Respiration', 'Transpiration', 'Absorption'], 'Transpiration', 'medium'),
  obj('Which of the following is the correct symbol for the element Iron?', ['Ir', 'In', 'Fe', 'Io'], 'Fe', 'easy'),
  obj('An atom of Carbon-14 contains how many neutrons?', ['6', '8', '12', '14'], '8', 'hard'),
  obj('The SI unit of electric current is the:', ['Volt', 'Watt', 'Ohm', 'Ampere'], 'Ampere', 'easy'),
  obj('Which type of bond is formed when electrons are shared between atoms?', ['Ionic bond', 'Covalent bond', 'Metallic bond', 'Hydrogen bond'], 'Covalent bond', 'medium'),
  obj('The law that states "for every action, there is an equal and opposite reaction" is:', ['Newton\'s First Law', 'Newton\'s Second Law', 'Newton\'s Third Law', 'Ohm\'s Law'], 'Newton\'s Third Law', 'medium'),
  obj('Which blood group is known as the "universal donor"?', ['A', 'B', 'AB', 'O'], 'O', 'medium'),
  obj('The powerhouse of the cell is the:', ['Nucleus', 'Cell membrane', 'Mitochondria', 'Ribosome'], 'Mitochondria', 'medium'),
  obj('When a ray of light travels from glass to air, it bends:', ['Towards the normal', 'Away from the normal', 'Along the normal', 'It does not bend'], 'Away from the normal', 'medium'),
  obj('What is the name of the process by which a solid changes directly to a gas?', ['Evaporation', 'Condensation', 'Sublimation', 'Melting'], 'Sublimation', 'hard'),
  obj('Which of the following is an example of a base?', ['Hydrochloric acid', 'Vinegar', 'Sodium hydroxide', 'Lemon juice'], 'Sodium hydroxide', 'medium'),
  obj('The speed of light in a vacuum is approximately:', ['3 × 10⁶ m/s', '3 × 10⁸ m/s', '3 × 10¹⁰ m/s', '3 × 10⁴ m/s'], '3 × 10⁸ m/s', 'hard'),
  obj('Which of the following is the formula for calculating work done?', ['W = m × v', 'W = F × d', 'W = P × t', 'W = F / d'], 'W = F × d', 'medium'),
  obj('A solution with a pH of 3 is:', ['Neutral', 'Weakly alkaline', 'Strongly acidic', 'Weakly acidic'], 'Strongly acidic', 'medium'),
  obj('The process of splitting an atom to release large amounts of energy is called:', ['Nuclear fusion', 'Nuclear fission', 'Combustion', 'Radioactive decay'], 'Nuclear fission', 'hard'),
  obj('Which part of the human brain controls balance and coordination?', ['Cerebrum', 'Medulla oblongata', 'Cerebellum', 'Hypothalamus'], 'Cerebellum', 'hard'),
  obj('What is the unit of electrical resistance?', ['Volt', 'Ampere', 'Watt', 'Ohm'], 'Ohm', 'easy'),
  obj('Photosynthesis takes place mainly in the:', ['Roots', 'Stem', 'Chloroplasts in leaves', 'Flowers'], 'Chloroplasts in leaves', 'easy'),
  obj('The distance-time graph for an object moving at constant speed is:', ['A curved line', 'A horizontal line', 'A straight line with positive gradient', 'A vertical line'], 'A straight line with positive gradient', 'medium'),
  obj('Which gas is produced when dilute hydrochloric acid reacts with zinc?', ['Oxygen', 'Carbon dioxide', 'Hydrogen', 'Nitrogen'], 'Hydrogen', 'medium'),
  obj('An organism that carries a disease from one host to another is called a:', ['Parasite', 'Pathogen', 'Vector', 'Bacterium'], 'Vector', 'hard'),
  obj('Which of these is a non-communicable disease?', ['Malaria', 'Cholera', 'Tuberculosis', 'Hypertension'], 'Hypertension', 'medium'),
  obj('The formula for the area of a circle is:', ['πr', 'πr²', '2πr', 'πd'], 'πr²', 'easy'),
  obj('Ohm\'s Law states that current in a circuit is:', ['Directly proportional to resistance', 'Inversely proportional to voltage', 'Directly proportional to voltage', 'Independent of voltage and resistance'], 'Directly proportional to voltage', 'medium'),
  obj('Which of the following is the correct definition of density?', ['Mass × Volume', 'Mass ÷ Volume', 'Volume ÷ Mass', 'Force ÷ Area'], 'Mass ÷ Volume', 'medium'),
  obj('Which type of reproduction does not require fertilisation?', ['Sexual reproduction', 'Asexual reproduction', 'External fertilisation', 'Internal fertilisation'], 'Asexual reproduction', 'easy'),
  obj('The layer of the atmosphere that absorbs harmful UV radiation is the:', ['Troposphere', 'Mesosphere', 'Thermosphere', 'Ozone layer (Stratosphere)'], 'Ozone layer (Stratosphere)', 'medium'),
  obj('Which of these describes a chemical change?', ['Ice melting into water', 'Sugar dissolving in water', 'Iron rusting', 'Glass breaking'], 'Iron rusting', 'medium'),
  obj('The function of the red blood cells is to:', ['Fight disease', 'Carry oxygen around the body', 'Clot blood', 'Produce antibodies'], 'Carry oxygen around the body', 'easy'),
  obj('If a force of 20 N is applied over an area of 4 m², what is the pressure?', ['80 Pa', '16 Pa', '5 Pa', '24 Pa'], '5 Pa', 'medium'),
  obj('Which organelle is responsible for protein synthesis in a cell?', ['Mitochondria', 'Ribosome', 'Golgi body', 'Lysosome'], 'Ribosome', 'hard'),
  obj('The number of protons in an atom is called its:', ['Mass number', 'Atomic mass', 'Atomic number', 'Neutron number'], 'Atomic number', 'medium'),
  obj('Which of the following is a greenhouse gas responsible for climate change?', ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Argon'], 'Carbon dioxide', 'easy'),
  obj('An eclipse of the Sun occurs when:', ['The Moon passes between the Earth and the Sun', 'The Earth passes between the Moon and the Sun', 'The Sun is directly above the equator', 'The Earth is at its greatest distance from the Sun'], 'The Moon passes between the Earth and the Sun', 'medium'),
  obj('Which of the following is an example of potential energy?', ['A moving car', 'A falling stone', 'A wound-up spring', 'Sound from a speaker'], 'A wound-up spring', 'medium'),
  obj('The human digestive system breaks food into simpler substances through:', ['Respiration', 'Digestion and absorption', 'Excretion and secretion', 'Circulation'], 'Digestion and absorption', 'easy'),
  obj('Which of the following is a polymer?', ['Table salt', 'Water', 'Starch', 'Carbon dioxide'], 'Starch', 'hard'),
  obj('In a series circuit, if one bulb blows out:', ['All other bulbs remain on', 'Only adjacent bulbs go off', 'All bulbs in the circuit go off', 'The circuit produces more power'], 'All bulbs in the circuit go off', 'medium'),
  obj('Which of the following is an example of a physical change?', ['Burning wood', 'Rusting of iron', 'Boiling water to steam', 'Decomposing food'], 'Boiling water to steam', 'medium'),
];

const SCI_B9_SUBJ = [
  subj('(a) State THREE differences between plant cells and animal cells, using a table format.\n(b) Draw and label a plant cell, including at least SIX parts.\n(c) Explain the function of the mitochondria and the nucleus.', 20, 'Use a table with two columns: Plant Cell | Animal Cell. Label your diagram clearly.'),
  subj('(a) Define photosynthesis and write its chemical equation.\n(b) Describe an experiment you would carry out to show that light is necessary for photosynthesis.\n(c) State TWO conditions that must be present for photosynthesis to occur and explain what would happen to a plant if each condition were absent.', 20, 'For the experiment: state aim, apparatus, method, expected result, and conclusion.'),
  subj('(a) Explain what is meant by Newton\'s Three Laws of Motion.\n(b) A car of mass 1000 kg accelerates at 2 m/s². Calculate the force applied.\n(c) A box of mass 5 kg is pushed with a force of 25 N. If friction of 5 N acts against it, calculate the net force and the acceleration of the box.', 20, 'Use F = ma for all calculations. Show all working clearly with correct units.'),
  subj('(a) Explain the difference between acids and bases. How does pH help us identify them?\n(b) What is neutralisation? Write a word equation for the reaction between hydrochloric acid and sodium hydroxide.\n(c) Give THREE everyday uses of (i) acids and (ii) bases.\n(d) Describe a simple experiment using litmus paper to test whether a solution is acidic, neutral or basic.', 20, 'Remember: acids have pH less than 7, bases greater than 7, neutral = 7.'),
  subj('(a) Describe the structure of the human heart. Include the four chambers and explain how blood flows through it.\n(b) What is the difference between arteries and veins?\n(c) Explain THREE ways in which lifestyle choices (e.g. diet, exercise, smoking) can affect heart health.\n(d) State ONE communicable and ONE non-communicable disease that affects the circulatory system.', 20, 'Draw a simple diagram of the heart to support your answer in (a).'),
  subj('(a) What is electricity? Distinguish between conductors and insulators with TWO examples of each.\n(b) Using Ohm\'s Law, calculate the current through a wire if the voltage is 12 V and the resistance is 4 Ω.\n(c) Describe the difference between a series circuit and a parallel circuit. State ONE advantage of a parallel circuit in homes.\n(d) A circuit has three resistors of 2 Ω, 3 Ω and 5 Ω connected in series. Calculate the total resistance.', 20, 'Ohm\'s Law: V = IR. For series: add all resistances together.'),
  subj('(a) Explain what is meant by the term "ecosystem." Give ONE example of an ecosystem found in Ghana.\n(b) Construct a food web using at least SIX organisms (including producers, primary consumers, secondary consumers, and a top predator).\n(c) What would happen to your food web if the producers were destroyed? Explain fully.\n(d) State TWO human activities that destroy ecosystems and suggest ONE solution for each.', 20, 'Your food web should have arrows showing the direction of energy flow.'),
  subj('(a) Define the following terms:\n(i) Speed\n(ii) Velocity\n(iii) Acceleration\n\n(b) A car travels 150 km in 3 hours. Calculate its average speed.\n(c) A motorbike accelerates from 0 m/s to 30 m/s in 10 seconds. Calculate its acceleration.\n(d) Using the data: initial speed = 10 m/s, final speed = 50 m/s, distance = 300 m. Calculate:\n(i) The acceleration\n(ii) The time taken\n\nUse the equations of motion: v = u + at, v² = u² + 2as, s = ut + ½at²', 20, 'Show ALL working and include units in your final answer.'),
  subj('(a) What is environmental pollution? Name FOUR types of pollution.\n(b) Describe THREE ways in which water pollution affects human health.\n(c) Explain the greenhouse effect and state THREE consequences of global warming.\n(d) Suggest FOUR practical ways in which students can help reduce pollution in their school and community.', 20, 'Be specific and give examples for each point. Vague answers will not receive full marks.'),
  subj('(a) Describe the structure of an atom including the subatomic particles: proton, neutron, and electron. State the charge and relative mass of each.\n(b) The element Sodium (Na) has an atomic number of 11 and a mass number of 23. State the number of protons, neutrons and electrons in one atom.\n(c) What is an isotope? Give TWO examples of isotopes and one use of a radioactive isotope.\n(d) Draw the electronic configuration of Oxygen (O, atomic number = 8).', 20, 'For electronic configuration, show electrons in shells: 1st shell holds 2, 2nd holds 8.'),
];

// ═════════════════════════════════════════════════════════════════════
// BASIC 8 — Mathematics (JHS 2)
// ═════════════════════════════════════════════════════════════════════
const MATHS_B8_OBJ = [
  obj('What is 15% of 200?', ['25', '30', '35', '40'], '30', 'easy'),
  obj('Simplify: 3a + 5b – 2a + b', ['a + 6b', '5a + 6b', 'a + 4b', '5a + 4b'], 'a + 6b', 'medium'),
  obj('The LCM of 6, 8 and 12 is:', ['12', '16', '24', '48'], '24', 'easy'),
  obj('What is the value of x if 3x + 7 = 22?', ['3', '5', '7', '9'], '5', 'easy'),
  obj('A rectangle has a length of 12 cm and width of 7 cm. What is its area?', ['38 cm²', '76 cm²', '84 cm²', '96 cm²'], '84 cm²', 'easy'),
  obj('Which of the following is equivalent to ¾?', ['0.65', '0.75', '0.85', '0.70'], '0.75', 'easy'),
  obj('What is the square root of 144?', ['11', '12', '13', '14'], '12', 'easy'),
  obj('In the sequence 2, 5, 8, 11, …, what is the next term?', ['12', '13', '14', '15'], '14', 'easy'),
  obj('What is the perimeter of a square with side 9 cm?', ['18 cm', '27 cm', '36 cm', '81 cm'], '36 cm', 'easy'),
  obj('If y = 3x – 4 and x = 3, then y =', ['4', '5', '6', '7'], '5', 'medium'),
  obj('A triangle has angles of 50° and 70°. What is the third angle?', ['50°', '60°', '70°', '80°'], '60°', 'easy'),
  obj('What is 2³ × 3²?', ['36', '54', '72', '108'], '72', 'medium'),
  obj('The mean of 4, 7, 9, 10, and 5 is:', ['6', '7', '8', '9'], '7', 'easy'),
  obj('A shopkeeper buys goods for GH₵400 and sells them for GH₵500. What is the profit percentage?', ['10%', '20%', '25%', '30%'], '25%', 'medium'),
  obj('Factorise completely: 6x² + 9x', ['3x(2x + 3)', '2x(3x + 9)', '9x(x + 1)', '6x(x + 3)'], '3x(2x + 3)', 'medium'),
  obj('Which of the following is a prime number?', ['49', '51', '57', '59'], '59', 'medium'),
  obj('The gradient of the line passing through (2, 3) and (4, 7) is:', ['1', '2', '3', '4'], '2', 'medium'),
  obj('A car travels at 60 km/h for 2.5 hours. What distance does it cover?', ['120 km', '130 km', '140 km', '150 km'], '150 km', 'easy'),
  obj('What is the value of 2⁰ + 5¹ + 3²?', ['14', '15', '16', '17'], '14', 'medium'),
  obj('A cone has a radius of 7 cm and a height of 12 cm. What is its volume? (Use π = 22/7)', ['616 cm³', '308 cm³', '1848 cm³', '154 cm³'], '616 cm³', 'hard'),
  obj('Solve for x: 2x/3 = 8', ['6', '8', '10', '12'], '12', 'medium'),
  obj('What is the median of: 3, 7, 2, 9, 5, 1, 8?', ['5', '6', '7', '8'], '5', 'medium'),
  obj('In a class of 40 students, 30% are boys. How many girls are there?', ['12', '24', '28', '30'], '28', 'medium'),
  obj('What is 0.35 expressed as a fraction in its simplest form?', ['7/20', '35/100', '7/10', '3/5'], '7/20', 'medium'),
  obj('Two angles of a quadrilateral are each 90°. The other two angles are in the ratio 2:3. Find the larger angle.', ['72°', '80°', '108°', '120°'], '108°', 'hard'),
  obj('What is the circumference of a circle with diameter 14 cm? (Use π = 22/7)', ['22 cm', '44 cm', '66 cm', '88 cm'], '44 cm', 'medium'),
  obj('Expand: (x + 3)(x – 2)', ['x² + x – 6', 'x² – x + 6', 'x² + 5x – 6', 'x² – x – 6'], 'x² + x – 6', 'hard'),
  obj('A man deposits GH₵2000 in a bank at a simple interest rate of 5% per annum. How much interest does he earn in 3 years?', ['GH₵150', 'GH₵200', 'GH₵300', 'GH₵400'], 'GH₵300', 'medium'),
  obj('What is the HCF of 36 and 48?', ['6', '8', '12', '24'], '12', 'easy'),
  obj('If the probability of rain is 0.3, what is the probability of no rain?', ['0.3', '0.5', '0.7', '1.0'], '0.7', 'easy'),
  obj('The mode of 5, 3, 8, 5, 7, 5, 2, 9 is:', ['3', '5', '7', '8'], '5', 'easy'),
  obj('Which of the following is NOT a quadrilateral?', ['Rectangle', 'Pentagon', 'Rhombus', 'Trapezium'], 'Pentagon', 'easy'),
  obj('Evaluate: √(64 + 36)', ['8', '9', '10', '12'], '10', 'medium'),
  obj('In a pie chart, if one sector represents 90°, what percentage of the total does it represent?', ['20%', '25%', '30%', '40%'], '25%', 'medium'),
  obj('A map has a scale of 1:50,000. If two towns are 4 cm apart on the map, what is the actual distance?', ['2 km', '4 km', '20 km', '200 km'], '2 km', 'hard'),
  obj('What is the next term in the sequence: 1, 4, 9, 16, 25, …?', ['30', '34', '36', '49'], '36', 'easy'),
  obj('A rectangular tank is 5 m long, 3 m wide and 2 m deep. What is its volume?', ['10 m³', '15 m³', '30 m³', '50 m³'], '30 m³', 'easy'),
  obj('If 20% of a number is 50, what is the number?', ['100', '200', '250', '500'], '250', 'medium'),
  obj('The interior angles of a regular hexagon each measure:', ['90°', '108°', '120°', '135°'], '120°', 'medium'),
  obj('Which expression represents: "three less than twice a number"?', ['3 – 2n', '2n – 3', '2(n – 3)', '3(2 – n)'], '2n – 3', 'medium'),
];

const MATHS_B8_SUBJ = [
  subj('(a) Solve the following simultaneous equations:\n    2x + 3y = 12\n    3x – y = 7\n\n(b) Check your answer by substituting the values of x and y back into both equations.\n\n(c) A shop sells pens at GH₵2 each and books at GH₵5 each. If Ama buys 4 pens and 3 books, write an expression for the total cost and evaluate it.', 20, 'Use substitution or elimination method for the simultaneous equations.'),
  subj('(a) The ages of students in a class are: 14, 15, 13, 16, 14, 15, 14, 13, 15, 16, 14, 13.\n(i) Construct a frequency table for the data.\n(ii) Find the mean, median and mode of the ages.\n(iii) Which average best represents the data? Give a reason.\n\n(b) Draw a bar chart to represent the frequency table above.\n\n(c) If a student is chosen at random, what is the probability that the student is 15 years old?', 20, 'For mean: sum all values and divide by the count. For median: arrange in order and find middle value(s).'),
  subj('(a) A circle has a radius of 10.5 cm. Calculate:\n(i) The area of the circle\n(ii) The circumference of the circle\n(Use π = 22/7)\n\n(b) A right-angled triangle has legs of 8 cm and 15 cm. Calculate the hypotenuse using the Pythagorean Theorem.\n\n(c) A rectangular field is 80 m long and 60 m wide. Calculate:\n(i) The area of the field\n(ii) The length of fencing needed to go around it\n(iii) The cost of fencing at GH₵25 per metre', 20, 'Area of circle = πr². Circumference = 2πr. Pythagoras: c² = a² + b².'),
  subj('(a) Factorise the following expressions:\n(i) x² – 9\n(ii) 4x² + 12x + 9\n(iii) 2x² – 5x – 3\n\n(b) Solve the quadratic equation: x² – 5x + 6 = 0 by factorisation.\n\n(c) The area of a rectangle is (x² + 7x + 12) cm². If the width is (x + 3) cm, find the length.', 20, 'Use difference of squares for (i): (a+b)(a-b). For (iii) use trial and error or the quadratic formula.'),
  subj('(a) Draw the graph of y = 2x – 1 for values of x from –2 to 4. Use a scale of 2 cm to 1 unit on both axes.\n\n(b) From your graph:\n(i) Find the value of y when x = 1.5\n(ii) Find the value of x when y = 5\n(iii) State the gradient and y-intercept of the line\n\n(c) A second line has equation y = –x + 5. On the same axes, draw this line and find the coordinates of the point of intersection.', 20, 'Create a table of values for x = -2, -1, 0, 1, 2, 3, 4 before drawing the graph.'),
  subj('(a) A man borrows GH₵5,000 from a bank at a compound interest rate of 10% per annum for 2 years. Calculate:\n(i) The amount he owes at the end of 2 years\n(ii) The total interest paid\n\n(b) A shopkeeper buys 50 pairs of shoes at GH₵60 each. He sells 40 pairs at GH₵90 each and the remaining 10 pairs at GH₵40 each. Calculate:\n(i) The total cost price\n(ii) The total selling price\n(iii) The overall profit or loss percentage\n\n(c) If VAT is 15%, what is the final price of an item that costs GH₵200 before tax?', 20, 'Compound Interest: A = P(1 + r/100)ⁿ. Profit% = (Profit/CP) × 100.'),
  subj('(a) Using a ruler and compass only, construct:\n(i) A triangle ABC with AB = 8 cm, angle ABC = 60° and BC = 7 cm\n(ii) The perpendicular bisector of AC\n\n(b) Measure and state: the length of AC and the size of angle BAC.\n\n(c) Draw a circle that passes through all three vertices of triangle ABC. This circle is called the "circumscribed circle" or circumcircle. Measure and state its radius.', 20, 'Show all construction lines clearly. Do NOT rub out construction arcs.'),
  subj('(a) A set A = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10}, B = {2, 4, 6, 8, 10} and C = {1, 3, 5, 7}.\n(i) Find A ∩ B and A ∩ C.\n(ii) Find A ∪ B.\n(iii) Find B ∩ C.\n(iv) Represent A, B and C in a Venn diagram.\n\n(b) Out of 50 students, 30 study Maths, 25 study Science, and 10 study both. How many study:\n(i) Only Maths?\n(ii) Only Science?\n(iii) Neither Maths nor Science?', 20, 'For the Venn diagram problem: n(M∪S) = n(M) + n(S) – n(M∩S). Subtract from total for "neither".'),
  subj('A bag contains 5 red balls, 3 blue balls and 2 green balls.\n\n(a) If one ball is drawn at random, find the probability that it is:\n(i) Red\n(ii) Blue\n(iii) Green\n(iv) Not red\n\n(b) If two balls are drawn one after the other WITHOUT replacement, find the probability that:\n(i) Both are red\n(ii) The first is red and the second is blue\n\n(c) Using a tree diagram, show all possible outcomes for drawing two balls (red, blue or green) with replacement. Find the probability of getting at least one red ball.', 20, 'Total balls = 10. P(event) = favourable outcomes / total outcomes. Without replacement: second pick depends on first.'),
  subj('(a) The table below shows the scores of 20 students in a test:\n\nScore: 10-19 | 20-29 | 30-39 | 40-49 | 50-59\nFreq:   2   |   4   |   7   |   5   |   2\n\n(i) Calculate the modal class.\n(ii) Estimate the mean score using the midpoints of each class.\n(iii) Draw a frequency polygon for the data.\n(iv) What percentage of students scored 40 or more?\n\n(b) A separate class of 30 students has a mean score of 38. If the two classes are combined, calculate the overall mean score for all 50 students.', 20, 'Modal class = class with highest frequency. For mean: use midpoints (14.5, 24.5, 34.5, 44.5, 54.5).'),
];

// ═════════════════════════════════════════════════════════════════════
// BASIC 9 — Social Studies (BECE)
// ═════════════════════════════════════════════════════════════════════
const SOC_B9_OBJ = [
  obj('The 1992 Constitution of Ghana established which type of system of government?', ['One-party state', 'Military rule', 'Multi-party democracy', 'Monarchy'], 'Multi-party democracy', 'medium'),
  obj('Which of Ghana\'s pre-colonial states was known for the "Golden Stool"?', ['Fante', 'Dagomba', 'Ashanti', 'Ga'], 'Ashanti', 'easy'),
  obj('The BECE is an examination conducted by which body?', ['Ministry of Education', 'Ghana Education Service (GES)', 'WAEC Ghana', 'National Accreditation Board'], 'WAEC Ghana', 'medium'),
  obj('The main cause of soil erosion in Ghana is:', ['Too much irrigation', 'Overgrazing, deforestation and poor farming practices', 'Urban development only', 'Earthquakes'], 'Overgrazing, deforestation and poor farming practices', 'medium'),
  obj('Which of the following is a DIRECT consequence of rapid urbanisation in Ghana?', ['Increased rural development', 'Development of slums and overcrowding in cities', 'Decrease in pollution', 'Better living standards for all rural people'], 'Development of slums and overcrowding in cities', 'medium'),
  obj('The three arms of government in Ghana are the Executive, Legislature and:', ['Military', 'Judiciary', 'Police', 'District Assembly'], 'Judiciary', 'easy'),
  obj('Which type of economic system does Ghana operate?', ['Command economy', 'Mixed economy', 'Pure market economy', 'Traditional economy only'], 'Mixed economy', 'medium'),
  obj('International trade refers to:', ['Trade between markets in the same city', 'The exchange of goods and services between different countries', 'Trade within the same region of Ghana', 'Barter trade in villages'], 'The exchange of goods and services between different countries', 'easy'),
  obj('The concept of "human rights" refers to:', ['Rights only given to adults with money', 'Rights only given to government officials', 'Basic rights and freedoms that all humans are entitled to, regardless of nationality or status', 'Rights given to people who obey all laws perfectly'], 'Basic rights and freedoms that all humans are entitled to, regardless of nationality or status', 'easy'),
  obj('Which body in Ghana is responsible for ensuring human rights are protected?', ['Ghana Police Service', 'Ghana Armed Forces', 'Commission on Human Rights and Administrative Justice (CHRAJ)', 'Electoral Commission'], 'Commission on Human Rights and Administrative Justice (CHRAJ)', 'hard'),
  obj('The Trans-Atlantic Slave Trade had its greatest impact on which region of Africa?', ['East Africa', 'North Africa', 'West and Central Africa', 'Southern Africa'], 'West and Central Africa', 'medium'),
  obj('The term "ethnicity" refers to:', ['A person\'s age group', 'A shared cultural identity including language, customs and traditions', 'The political party a person belongs to', 'A person\'s economic class'], 'A shared cultural identity including language, customs and traditions', 'medium'),
  obj('Which of the following is an effect of deforestation in Ghana?', ['Increased rainfall', 'Loss of biodiversity and soil erosion', 'More wildlife and green cover', 'Lower temperatures'], 'Loss of biodiversity and soil erosion', 'medium'),
  obj('The concept of "gender equality" means:', ['That men and women are the same physically', 'That men and women have equal rights, opportunities and responsibilities', 'Only women should get special treatment', 'Men should always be in leadership'], 'That men and women have equal rights, opportunities and responsibilities', 'medium'),
  obj('Which type of resource is petroleum (crude oil)?', ['Renewable resource', 'Non-renewable resource', 'Inexhaustible resource', 'Human resource'], 'Non-renewable resource', 'easy'),
  obj('What does "rule of law" mean?', ['The military makes all rules', 'Only the President is above the law', 'Everyone, including the government, must obey the law equally', 'Rich people can pay to avoid punishment'], 'Everyone, including the government, must obey the law equally', 'medium'),
  obj('Which of the following is a challenge facing democracy in Ghana?', ['Low population growth', 'Too many political parties committed to serving citizens', 'Voter apathy and electoral violence', 'Excellent civic education'], 'Voter apathy and electoral violence', 'medium'),
  obj('Globalisation has led to which of the following in Ghana?', ['Ghana becoming completely isolated from the world', 'Increased access to foreign goods, ideas and technologies', 'A reduction in mobile phone use', 'Fewer job opportunities for educated Ghanaians'], 'Increased access to foreign goods, ideas and technologies', 'medium'),
  obj('The main function of the Electoral Commission of Ghana is to:', ['Make laws for the country', 'Manage public finances', 'Organise and supervise all public elections', 'Control the Armed Forces'], 'Organise and supervise all public elections', 'easy'),
  obj('Which pre-colonial empire controlled major trade routes in West Africa through its wealth in gold and salt?', ['The Ashanti Empire', 'The Songhai Empire', 'The Mali Empire', 'The Benin Kingdom'], 'The Mali Empire', 'hard'),
  obj('The process of a country moving from subsistence farming to industrial production is called:', ['Migration', 'Urbanisation', 'Industrialisation', 'Globalisation'], 'Industrialisation', 'medium'),
  obj('Which of the following best describes the term "sustainable agriculture"?', ['Farming only with imported chemicals', 'Farming practices that meet today\'s food needs without harming future productivity', 'Converting all forests to farmland', 'Using large machines to maximise output at any cost'], 'Farming practices that meet today\'s food needs without harming future productivity', 'medium'),
  obj('The 1992 Constitution of Ghana gives every citizen the right to:', ['Own a private army', 'Vote in elections from age 18', 'Ignore paying taxes', 'Break laws they disagree with'], 'Vote in elections from age 18', 'easy'),
  obj('Which of the following factors led to African colonisation in the 19th century?', ['Africa\'s military superiority', 'European desire for raw materials, markets and power', 'African requests for European help', 'African overpopulation'], 'European desire for raw materials, markets and power', 'medium'),
  obj('An example of a non-governmental organisation (NGO) working in Ghana is:', ['The Ghana Police Service', 'World Vision Ghana', 'Parliament of Ghana', 'Ghana Revenue Authority'], 'World Vision Ghana', 'easy'),
  obj('What is the primary difference between a developed and a developing country?', ['Language differences', 'Their level of industrialisation, income, healthcare and education', 'The size of their land area', 'The climate they experience'], 'Their level of industrialisation, income, healthcare and education', 'medium'),
  obj('Which of the following is an example of civic responsibility?', ['Refusing to vote', 'Dumping waste illegally', 'Reporting crimes to the police', 'Vandalising public property'], 'Reporting crimes to the police', 'easy'),
  obj('Which organisation coordinates the foreign policy of all African countries?', ['ECOWAS', 'African Union (AU)', 'United Nations', 'Commonwealth of Nations'], 'African Union (AU)', 'medium'),
  obj('Which of the following is a key indicator used to measure a country\'s level of development?', ['Number of traditional festivals', 'Human Development Index (HDI)', 'The age of its constitution', 'Its geographic size'], 'Human Development Index (HDI)', 'hard'),
  obj('What was the main purpose of the Berlin Conference (1884–85)?', ['To end the slave trade', 'To partition and distribute Africa among European powers', 'To create a united Africa', 'To promote trade between Africans and Europeans'], 'To partition and distribute Africa among European powers', 'medium'),
  obj('Which of the following is a cause of child labour in Ghana?', ['Too many schools available', 'Poverty and lack of access to education', 'Strong child protection laws', 'High quality of living'], 'Poverty and lack of access to education', 'medium'),
  obj('The Millennium Development Goals (MDGs) were replaced by the:', ['Human Rights Charter', 'Sustainable Development Goals (SDGs)', 'African Union Agenda 2063', 'ECOWAS Economic Plan'], 'Sustainable Development Goals (SDGs)', 'hard'),
  obj('Which type of migration occurs when people move from rural areas to cities within the same country?', ['Emigration', 'Immigration', 'Rural-urban migration', 'Forced migration'], 'Rural-urban migration', 'easy'),
  obj('Which of the following is a positive effect of globalisation on Ghana?', ['Loss of all local culture', 'Increased access to international markets for Ghanaian goods', 'Economic dependence on one country', 'Closure of local industries'], 'Increased access to international markets for Ghanaian goods', 'medium'),
  obj('The term "fiscal policy" refers to:', ['A country\'s military strategy', 'Government decisions about taxation and public spending', 'Environmental protection laws', 'Policies on international relations'], 'Government decisions about taxation and public spending', 'hard'),
  obj('Which factor most directly causes the spread of infectious diseases in densely populated urban areas?', ['Warm climate', 'Poor sanitation and overcrowding', 'Too many hospitals', 'Good transport networks'], 'Poor sanitation and overcrowding', 'medium'),
  obj('In Ghana, the President is elected through a:', ['Parliamentary vote', 'Military appointment', 'Universal adult suffrage (direct vote by all eligible citizens)', 'Vote by traditional chiefs only'], 'Universal adult suffrage (direct vote by all eligible citizens)', 'easy'),
  obj('The concept of "separation of powers" is designed to:', ['Concentrate all power in the President\'s office', 'Prevent any one branch of government from having too much power', 'Allow the military to govern when parliament is weak', 'Keep economic decisions away from politicians'], 'Prevent any one branch of government from having too much power', 'medium'),
  obj('Which of the following is an effect of brain drain on developing countries like Ghana?', ['Stronger healthcare and education systems', 'Loss of skilled and educated workers to richer countries', 'More investment in local schools', 'Faster economic development'], 'Loss of skilled and educated workers to richer countries', 'hard'),
  obj('Which principle states that all member states of the African Union have equal voting rights regardless of size?', ['Sovereign equality of states', 'Majority rule', 'Economic dominance', 'Military supremacy'], 'Sovereign equality of states', 'hard'),
];

const SOC_B9_SUBJ = [
  subj('(a) Describe the causes and effects of the Trans-Atlantic Slave Trade on West Africa.\n(b) Explain THREE ways in which the slave trade has continued to affect African development today.\n(c) What role did African rulers play in the slave trade? Do you think they should share blame? Give reasons for your answer.', 20, 'Think about economic, social and political impacts. Use historical evidence to support your argument.'),
  subj('(a) Define the term "democracy" and state FIVE features of a democratic government.\n(b) Explain THREE challenges facing democracy in Ghana today.\n(c) Suggest FOUR ways in which Ghanaian youth can contribute to strengthening democracy in the country.', 20, 'Features of democracy include free elections, rule of law, freedom of speech, separation of powers, etc.'),
  subj('Ghana is facing increasing environmental challenges.\n\n(a) Identify and explain FOUR major environmental problems facing Ghana.\n(b) For each problem, state ONE human activity that causes it and ONE solution.\n(c) Explain what "sustainable development" means and give TWO examples of how it can be practised in Ghana.\n(d) Why is it important for young people to become environmental stewards?', 20, 'Problems include deforestation, galamsey (illegal mining), pollution, desertification, etc.'),
  subj('(a) Explain the concept of globalisation and give THREE examples of how it has affected Ghana.\n(b) Discuss TWO positive and TWO negative effects of globalisation on Ghanaian culture and economy.\n(c) How can Ghana benefit from globalisation while protecting its own cultural identity and local industries?', 20, 'Think about mobile phones, foreign companies, music, food, education, etc.'),
  subj('(a) What is population growth? State ONE advantage and TWO disadvantages of rapid population growth.\n(b) Using Ghana as a case study, explain how rapid population growth affects:\n(i) Education\n(ii) Healthcare\n(iii) Employment\n(iv) Food security\n\n(c) What policies can the Ghanaian government put in place to manage population growth effectively?', 20, 'Include specific facts about Ghana\'s population if you know them. Think about government programmes like free SHS.'),
  subj('(a) Explain what is meant by "human rights." Name FIVE human rights recognised by the United Nations.\n(b) Give THREE examples of human rights violations that can occur in Ghana and explain how each can be prevented.\n(c) What is the role of the Commission on Human Rights and Administrative Justice (CHRAJ) in Ghana?\n(d) Why is it important for every citizen to know their rights?', 20, 'Rights include right to life, education, fair trial, freedom of speech, protection from discrimination, etc.'),
  subj('Study the following scenario and answer the questions:\n\nScenario: Abokobi, a small farming community, has discovered oil reserves beneath its land. A large multinational company wants to begin extraction immediately. Some community members support this for economic benefits, while others are worried about environmental damage and the displacement of farmers.\n\n(a) Identify THREE potential benefits of the oil discovery for Abokobi and Ghana.\n(b) Identify THREE potential problems that could arise from the oil extraction.\n(c) As a student, draft FIVE recommendations you would present to government to ensure both development and community protection.\n(d) What does this situation tell us about the relationship between economic development and environmental sustainability?', 20, 'Think about jobs, revenue, pollution, displacement, resource management, community rights, etc.'),
  subj('(a) Explain the term "good governance" and state FIVE characteristics of good governance.\n(b) How does corruption affect the development of Ghana? Give THREE specific examples.\n(c) Describe THREE ways in which citizens can help combat corruption in their communities.\n(d) "Young people are the future leaders of Ghana." Do you agree? Explain your answer using specific examples of civic engagement by youth.', 20, 'Good governance characteristics: accountability, transparency, rule of law, participation, inclusiveness.'),
  subj('(a) Distinguish between PUSH and PULL factors of migration. Give TWO examples of each in the Ghanaian context.\n(b) Explain THREE effects of rural-urban migration on:\n(i) Urban areas\n(ii) Rural communities\n\n(c) Suggest FOUR policies the government could implement to reduce rural-urban migration.\n(d) "Brain drain is a greater threat to Ghana than rural-urban migration." Do you agree? Discuss.', 20, 'Push factors make people leave; pull factors attract them. Be specific to the Ghanaian context.'),
  subj('(a) Define "international trade" and explain its importance to Ghana\'s economy.\n(b) What is the difference between imports and exports? Give TWO examples of each for Ghana.\n(c) Ghana is a member of ECOWAS and the African Union. Explain the importance of ONE of these organisations to Ghana\'s trade and development.\n(d) What are THREE challenges Ghana faces in international trade, and how can they be overcome?', 20, 'Ghana exports: cocoa, gold, oil. Imports: machinery, vehicles, food items. ECOWAS promotes free trade in West Africa.'),
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

const EXAMS = [
  buildExam({
    title: 'Basic 9 English Language — WAEC BECE Mock Exam',
    desc: 'BECE-style English Language exam for JHS 3. Covers grammar, comprehension, literature, writing and vocabulary. 40 objectives + 10 essay questions (answer 5).',
    classLevel: 'Basic 9', subjectName: 'English Language', mins: 150, objQ: ENG_B9_OBJ, subjQ: ENG_B9_SUBJ
  }),
  buildExam({
    title: 'Basic 9 Integrated Science — WAEC BECE Mock Exam',
    desc: 'BECE-style Integrated Science exam for JHS 3. Covers biology, chemistry, physics and environmental science. 40 objectives + 10 structured questions (answer 5).',
    classLevel: 'Basic 9', subjectName: 'Integrated Science', mins: 150, objQ: SCI_B9_OBJ, subjQ: SCI_B9_SUBJ
  }),
  buildExam({
    title: 'Basic 8 Mathematics — WAEC Mock Exam',
    desc: 'WAEC-style Mathematics exam for JHS 2. Covers algebra, statistics, geometry, number theory and financial maths. 40 objectives + 10 problems (answer 5).',
    classLevel: 'Basic 8', subjectName: 'Mathematics', mins: 150, objQ: MATHS_B8_OBJ, subjQ: MATHS_B8_SUBJ
  }),
  buildExam({
    title: 'Basic 9 Social Studies — WAEC BECE Mock Exam',
    desc: 'BECE-style Social Studies exam for JHS 3. Covers governance, history, environment, globalisation, human rights and development. 40 objectives + 10 essay questions (answer 5).',
    classLevel: 'Basic 9', subjectName: 'Social Studies', mins: 150, objQ: SOC_B9_OBJ, subjQ: SOC_B9_SUBJ
  }),
];

async function run() {
  console.log('🎓 Seeding WAEC exams with 40 objectives + 10 subjectives...\n');
  for (const exam of EXAMS) {
    process.stdout.write(`📝 ${exam.title}... `);
    const { error } = await supabase.from('global_quizzes').insert(exam);
    if (error) {
      console.log(`❌ ${error.message}`);
    } else {
      const sA = exam.content.sections[0].questions.length;
      const sB = exam.content.sections[1].questions.length;
      console.log(`✅  Section A: ${sA} objectives | Section B: ${sB} questions (answer 5)`);
    }
  }
  console.log('\n🎉 Done! All WAEC exams are live on the hub.');
}

run();
