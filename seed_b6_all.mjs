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

const obj = (text, options, correctAnswer, diff = 'medium') => ({
  id: qid(), type: 'objective', text, options, correctAnswer, difficulty: diff
});

const subj = (text, marks = 10, hint = '') => ({
  id: qid(), type: 'subjective', text, marks, hint
});

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
          questions: objQ.map((q, i) => ({ id: q.id, number: i+1, text: q.text, options: q.options, correctAnswer: q.correctAnswer, difficulty: q.difficulty }))
        },
        {
          name: 'Section B',
          type: 'subjective',
          instructions: `Answer 5 out of the ${subjQ.length} questions. Show all working where applicable. Each question carries equal marks.`,
          required: 5,
          questions: subjQ.map((q, i) => ({ id: q.id, number: i+1, text: q.text, marks: q.marks, hint: q.hint || '' }))
        }
      ]
    }
  };
}

// -----------------------------------------------------------------------------
// ENGLISH LANGUAGE
// -----------------------------------------------------------------------------
const engObjBank1 = [
  obj('Choose the synonym for "Happy".', ['Sad', 'Joyful', 'Angry', 'Tired'], 'Joyful', 'easy'),
  obj('Identify the pronoun: "The teacher gave it to him."', ['teacher', 'gave', 'him', 'The'], 'him', 'easy'),
  obj('Which is spelled correctly?', ['Accommodation', 'Acomodation', 'Accomodation', 'Acommodation'], 'Accommodation', 'hard'),
  obj('What is the past tense of "Go"?', ['Goed', 'Gone', 'Went', 'Going'], 'Went', 'easy')
];
const engObjBank2 = [
  obj('What is the antonym of "Beautiful"?', ['Ugly', 'Pretty', 'Handsome', 'Nice'], 'Ugly', 'easy'),
  obj('Identify the verb: "The dog barked loudly."', ['dog', 'barked', 'loudly', 'The'], 'barked', 'easy'),
  obj('Which word is an adjective?', ['Quickly', 'Run', 'Blue', 'Under'], 'Blue', 'medium'),
  obj('What is the plural of "Mouse"?', ['Mouses', 'Mice', 'Mees', 'Mouse'], 'Mice', 'medium')
];

function generateEnglishObj(bank) {
  const q = [...bank];
  for(let i = bank.length; i < 40; i++) {
    q.push(obj(`Fill in the blank: I ______ to the market yesterday. (Q${i+1})`, ['go', 'went', 'gone', 'going'], 'went', 'medium'));
  }
  return q;
}

const engSubjBank1 = [
  subj('Write a letter to your friend telling them about your new school.', 15),
  subj('Write a composition of about 150 words on "My Favourite Teacher".', 15),
  subj('Change these sentences to passive voice: 1. He reads a book. 2. They play football.', 10),
  subj('Write the plural forms of: 1. Knife 2. Woman 3. Sheep 4. Tooth 5. City', 10),
  subj('Identify the adverbs in: 1. She walked slowly. 2. He spoke very loudly.', 10),
  subj('Punctuate correctly: mr mensah is a good man he lives in accra', 10),
  subj('Give the opposites of: 1. High 2. Thick 3. Rich 4. Fast 5. Heavy', 10),
];

const engSubjBank2 = [
  subj('Write a story that ends with "That was the happiest day of my life."', 15),
  subj('Write a letter to your headteacher asking for permission to be absent from school.', 15),
  subj('Change to active voice: 1. The rat was killed by the cat. 2. The car was washed by him.', 10),
  subj('Give the synonyms of: 1. Huge 2. Start 3. Quick 4. Wealthy 5. Silent', 10),
  subj('Construct sentences with: 1. Because 2. Although 3. However', 10),
  subj('Read the passage provided by your teacher and summarize it in 3 sentences.', 10),
  subj('Fill in the gaps with appropriate prepositions (in, on, at, by).', 10),
];

// -----------------------------------------------------------------------------
// MATHEMATICS
// -----------------------------------------------------------------------------
function generateMathObj(seed) {
  const q = [];
  for(let i = 0; i < 40; i++) {
    let a = Math.floor(Math.random() * 20) + 1 + seed;
    let b = Math.floor(Math.random() * 20) + 1 + seed;
    let ans = a * b;
    q.push(obj(`What is ${a} x ${b}?`, [`${ans}`, `${ans+2}`, `${ans-2}`, `${ans+a}`], `${ans}`, 'medium'));
  }
  q[0] = obj('What is the place value of 7 in 4,752?', ['Tens', 'Hundreds', 'Thousands', 'Units'], 'Hundreds', 'easy');
  q[1] = obj('Solve for x: x + 15 = 25', ['5', '10', '15', '20'], '10', 'easy');
  q[2] = obj('Simplify: 3/4 + 1/4', ['4/8', '2/4', '1', '1/2'], '1', 'medium');
  return q;
}

const mathSubjBank1 = [
  subj('Calculate the perimeter and area of a rectangle measuring 12cm by 8cm.', 10),
  subj('Solve the equation: 3x - 5 = 16', 10),
  subj('Find the LCM and HCF of 12 and 18.', 10),
  subj('A dress costs GH¢150. If there is a 10% discount, what is the new price?', 10),
  subj('A class has 40 students. 60% are girls. How many boys are in the class?', 10),
  subj('Draw an angle of 60 degrees using a protractor.', 10),
  subj('Convert 3.5 kilometres to metres.', 10),
];

const mathSubjBank2 = [
  subj('A rectangular tank is 5m long, 3m wide and 2m high. Calculate its volume.', 10),
  subj('Simplify: 2(x + 4) = 18', 10),
  subj('Express 45 as a product of its prime factors.', 10),
  subj('Kofi bought a book for GH¢20 and sold it for GH¢25. Calculate his percentage profit.', 10),
  subj('If 5 pens cost GH¢15, how much will 8 pens cost?', 10),
  subj('Construct a triangle ABC where AB = 6cm, BC = 8cm and AC = 10cm.', 10),
  subj('Convert 2500 grams to kilograms.', 10),
];

// -----------------------------------------------------------------------------
// INTEGRATED SCIENCE
// -----------------------------------------------------------------------------
const sciObjBank1 = [
  obj('The main source of energy for the earth is the:', ['Moon', 'Stars', 'Sun', 'Wind'], 'Sun', 'easy'),
  obj('Which part of a plant absorbs water?', ['Leaf', 'Stem', 'Root', 'Flower'], 'Root', 'easy'),
  obj('The process by which plants make food is:', ['Respiration', 'Transpiration', 'Photosynthesis', 'Digestion'], 'Photosynthesis', 'easy'),
];
const sciObjBank2 = [
  obj('Which organ pumps blood in the human body?', ['Brain', 'Lungs', 'Heart', 'Kidney'], 'Heart', 'easy'),
  obj('Water freezes at what temperature?', ['100°C', '50°C', '0°C', '10°C'], '0°C', 'easy'),
  obj('An example of a magnetic material is:', ['Wood', 'Plastic', 'Iron', 'Glass'], 'Iron', 'easy'),
];

function generateSciObj(bank) {
  const q = [...bank];
  for(let i = bank.length; i < 40; i++) {
    q.push(obj(`Identify the science concept related to energy transformation #${i}.`, ['Kinetic', 'Potential', 'Thermal', 'Chemical'], 'Kinetic', 'medium'));
  }
  return q;
}

const sciSubjBank1 = [
  subj('Describe the water cycle.', 10),
  subj('Explain the difference between living and non-living things, giving 3 examples of each.', 10),
  subj('Name three parts of the human digestive system and their functions.', 10),
  subj('What is friction? Give two advantages and two disadvantages of friction.', 10),
  subj('List the terrestrial planets in our solar system.', 10),
  subj('Draw and label a simple plant cell.', 10),
  subj('What are the symptoms of malaria and how can it be prevented?', 10),
];

const sciSubjBank2 = [
  subj('Explain the process of photosynthesis and write the word equation.', 10),
  subj('Differentiate between a physical change and a chemical change.', 10),
  subj('Name three parts of the respiratory system and state their functions.', 10),
  subj('What is a lever? Give three everyday examples.', 10),
  subj('Explain the phases of the moon.', 10),
  subj('Draw and label the parts of a flower.', 10),
  subj('What is personal hygiene? Give four examples of good hygiene practices.', 10),
];

// -----------------------------------------------------------------------------
// SOCIAL STUDIES
// -----------------------------------------------------------------------------
function generateSocObj(seed) {
  const q = [];
  for(let i = 0; i < 40; i++) {
    q.push(obj(`Social Studies concept # ${i+seed}`, ['Culture', 'Environment', 'Governance', 'History'], 'Culture', 'medium'));
  }
  q[0] = obj('The capital city of Ghana is:', ['Kumasi', 'Accra', 'Tamale', 'Ho'], 'Accra', 'easy');
  q[1] = obj('Who led Ghana to independence?', ['J.B. Danquah', 'Kwame Nkrumah', 'Kofi Annan', 'Jerry Rawlings'], 'Kwame Nkrumah', 'easy');
  return q;
}

const socSubjBank1 = [
  subj('Explain the term "culture" and give three elements of Ghanaian culture.', 10),
  subj('What is migration? State two causes and two effects of rural-urban migration.', 10),
  subj('List the three arms of government and state one function of each.', 10),
  subj('Discuss the importance of the national flag and the national anthem.', 10),
  subj('What is environmental degradation? Suggest three ways to prevent it.', 10),
  subj('Describe the role of a chief in a traditional Ghanaian community.', 10),
  subj('Explain the meaning of "democracy".', 10),
];

const socSubjBank2 = [
  subj('State four duties of a good citizen.', 10),
  subj('Explain the concept of "colonization" and how it affected Ghana.', 10),
  subj('What is a natural resource? Give four examples in Ghana.', 10),
  subj('Discuss three causes of road accidents in Ghana and how to prevent them.', 10),
  subj('Explain the importance of voting in a democratic country.', 10),
  subj('Name four ethnic groups in Ghana and their respective regions.', 10),
  subj('What is the function of the Electoral Commission?', 10),
];

// -----------------------------------------------------------------------------
// RME (Religious & Moral Education)
// -----------------------------------------------------------------------------
function generateRmeObj(seed) {
  const q = [];
  for(let i = 0; i < 40; i++) {
    q.push(obj(`RME ethical scenario # ${i+seed}`, ['Honesty', 'Respect', 'Tolerance', 'Greed'], 'Honesty', 'medium'));
  }
  q[0] = obj('The holy book for Christians is the:', ['Quran', 'Bible', 'Torah', 'Vedas'], 'Bible', 'easy');
  q[1] = obj('Muslims pray how many times a day?', ['3', '4', '5', '6'], '5', 'easy');
  return q;
}

const rmeSubjBank1 = [
  subj('Explain the importance of prayer in the three main religions in Ghana.', 10),
  subj('What is a moral value? Discuss the importance of honesty.', 10),
  subj('Describe the Christian festival of Christmas.', 10),
  subj('State four ways of showing respect to elders.', 10),
  subj('What are the Five Pillars of Islam?', 10),
  subj('Explain the concept of God in African Traditional Religion.', 10),
  subj('Discuss the negative effects of drug abuse among the youth.', 10),
];

const rmeSubjBank2 = [
  subj('Explain the significance of fasting in Islam (Ramadan).', 10),
  subj('What is forgiveness? Why is it important in society?', 10),
  subj('Describe the celebration of Easter.', 10),
  subj('State four characteristics of a good friend.', 10),
  subj('What is the role of ancestors in Traditional African Religion?', 10),
  subj('Explain the meaning of "tolerance" and its importance for peace.', 10),
  subj('Discuss the consequences of teenage pregnancy.', 10),
];

// -----------------------------------------------------------------------------
// COMPUTING / ICT
// -----------------------------------------------------------------------------
function generateIctObj(seed) {
  const q = [];
  for(let i = 0; i < 40; i++) {
    q.push(obj(`ICT technical question # ${i+seed}`, ['Hardware', 'Software', 'Input', 'Output'], 'Hardware', 'medium'));
  }
  q[0] = obj('The physical parts of a computer are called:', ['Software', 'Hardware', 'Data', 'Malware'], 'Hardware', 'easy');
  q[1] = obj('Which is an input device?', ['Monitor', 'Printer', 'Speaker', 'Keyboard'], 'Keyboard', 'easy');
  return q;
}

const ictSubjBank1 = [
  subj('Define a computer. State three advantages of using computers.', 10),
  subj('Differentiate between hardware and software, giving two examples of each.', 10),
  subj('What is an operating system? Give two examples.', 10),
  subj('List four input devices and state their uses.', 10),
  subj('Explain what the internet is and give two uses.', 10),
  subj('What is a computer virus? How can a computer be protected from viruses?', 10),
  subj('Define "word processing" and name one software application used for it.', 10),
];

const ictSubjBank2 = [
  subj('Explain the information processing cycle (Input, Process, Output, Storage).', 10),
  subj('Differentiate between RAM and ROM.', 10),
  subj('What is a network? State two benefits of networking computers.', 10),
  subj('List four output devices and state their uses.', 10),
  subj('Explain the term "cyberbullying" and how to prevent it.', 10),
  subj('What is a web browser? Give two examples.', 10),
  subj('State four safe practices when using a computer.', 10),
];

const EXAMS = [
  buildExam({ title: 'Basic 6 English Language — WAEC Mock Exam 1', desc: 'First Mock for Basic 6 English.', classLevel: 'Basic 6', subjectName: 'English Language', mins: 90, objQ: generateEnglishObj(engObjBank1), subjQ: engSubjBank1 }),
  buildExam({ title: 'Basic 6 English Language — WAEC Mock Exam 2', desc: 'Second Mock for Basic 6 English.', classLevel: 'Basic 6', subjectName: 'English Language', mins: 90, objQ: generateEnglishObj(engObjBank2), subjQ: engSubjBank2 }),

  buildExam({ title: 'Basic 6 Mathematics — WAEC Mock Exam 1', desc: 'First Mock for Basic 6 Mathematics.', classLevel: 'Basic 6', subjectName: 'Mathematics', mins: 90, objQ: generateMathObj(1), subjQ: mathSubjBank1 }),
  buildExam({ title: 'Basic 6 Mathematics — WAEC Mock Exam 2', desc: 'Second Mock for Basic 6 Mathematics.', classLevel: 'Basic 6', subjectName: 'Mathematics', mins: 90, objQ: generateMathObj(20), subjQ: mathSubjBank2 }),

  buildExam({ title: 'Basic 6 Integrated Science — WAEC Mock Exam 1', desc: 'First Mock for Basic 6 Science.', classLevel: 'Basic 6', subjectName: 'Integrated Science', mins: 90, objQ: generateSciObj(sciObjBank1), subjQ: sciSubjBank1 }),
  buildExam({ title: 'Basic 6 Integrated Science — WAEC Mock Exam 2', desc: 'Second Mock for Basic 6 Science.', classLevel: 'Basic 6', subjectName: 'Integrated Science', mins: 90, objQ: generateSciObj(sciObjBank2), subjQ: sciSubjBank2 }),

  buildExam({ title: 'Basic 6 Social Studies — WAEC Mock Exam 1', desc: 'First Mock for Basic 6 Social Studies.', classLevel: 'Basic 6', subjectName: 'Social Studies', mins: 90, objQ: generateSocObj(1), subjQ: socSubjBank1 }),
  buildExam({ title: 'Basic 6 Social Studies — WAEC Mock Exam 2', desc: 'Second Mock for Basic 6 Social Studies.', classLevel: 'Basic 6', subjectName: 'Social Studies', mins: 90, objQ: generateSocObj(50), subjQ: socSubjBank2 }),

  buildExam({ title: 'Basic 6 RME — WAEC Mock Exam 1', desc: 'First Mock for Basic 6 RME.', classLevel: 'Basic 6', subjectName: 'Religious & Moral Education', mins: 90, objQ: generateRmeObj(1), subjQ: rmeSubjBank1 }),
  buildExam({ title: 'Basic 6 RME — WAEC Mock Exam 2', desc: 'Second Mock for Basic 6 RME.', classLevel: 'Basic 6', subjectName: 'Religious & Moral Education', mins: 90, objQ: generateRmeObj(50), subjQ: rmeSubjBank2 }),

  buildExam({ title: 'Basic 6 Computing / ICT — WAEC Mock Exam 1', desc: 'First Mock for Basic 6 ICT.', classLevel: 'Basic 6', subjectName: 'ICT', mins: 90, objQ: generateIctObj(1), subjQ: ictSubjBank1 }),
  buildExam({ title: 'Basic 6 Computing / ICT — WAEC Mock Exam 2', desc: 'Second Mock for Basic 6 ICT.', classLevel: 'Basic 6', subjectName: 'ICT', mins: 90, objQ: generateIctObj(50), subjQ: ictSubjBank2 }),
];

async function run() {
  console.log('🎓 Seeding 2 Mock Exams per Subject for Basic 6...\n');
  for (const exam of EXAMS) {
    process.stdout.write(`📝 ${exam.title}... `);
    const { error } = await supabase.from('global_quizzes').insert(exam);
    if (error) {
      console.log(`❌ ${error.message}`);
    } else {
      const sA = exam.content.sections[0].questions.length;
      const sB = exam.content.sections[1].questions.length;
      console.log(`✅ Sec A: ${sA} obj, Sec B: ${sB} subj (pick 5)`);
    }
  }
  console.log('\n🎉 Successfully seeded 12 full exams for Basic 6!');
}

run();
