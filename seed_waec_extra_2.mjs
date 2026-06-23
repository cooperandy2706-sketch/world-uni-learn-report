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

// ==========================================
// BASIC 5 - ENGLISH LANGUAGE
// ==========================================
const ENG_B5_OBJ = Array.from({ length: 40 }).map((_, i) => obj(
  `Identify the pronoun in the sentence: "She went to the market."`,
  ['went', 'market', 'She', 'the'],
  'She',
  'easy'
));
ENG_B5_OBJ[0] = obj('Choose the correct spelling:', ['Occasion', 'Ocassion', 'Occassion', 'Ockasion'], 'Occasion', 'medium');
ENG_B5_OBJ[1] = obj('What is the plural of "Child"?', ['Childs', 'Childrens', 'Children', 'Childes'], 'Children', 'easy');
ENG_B5_OBJ[2] = obj('Which is a collective noun?', ['School', 'Flock', 'Boy', 'Table'], 'Flock', 'medium');
ENG_B5_OBJ[3] = obj('The opposite of "Arrive" is:', ['Leave', 'Stay', 'Come', 'Reach'], 'Leave', 'easy');

const ENG_B5_SUBJ = [
  subj('Write a letter to your uncle thanking him for a birthday gift.', 15),
  subj('Change these sentences from active to passive voice:\n1. The cat chased the mouse.\n2. John kicked the ball.', 10),
  subj('Write a short essay of about 100 words on the topic: "My Favourite Animal".', 15),
  subj('Identify the adverbs in these sentences:\n1. He ran quickly.\n2. She sings beautifully.', 10),
  subj('Give the past tense of these verbs: 1. Catch 2. Bring 3. Buy 4. Think 5. Teach', 10),
  subj('Punctuate the following sentence: "oh no shouted mr mensah my car is gone"', 10),
  subj('Form adjectives from these nouns: 1. Danger 2. Beauty 3. Courage 4. Peace', 10),
];

// ==========================================
// BASIC 5 - MATHEMATICS
// ==========================================
const MATH_B5_OBJ = Array.from({ length: 40 }).map((_, i) => obj(
  `What is 12 x ${i % 5 + 3}?`,
  [`${12 * (i % 5 + 3)}`, `${12 * (i % 5 + 3) + 2}`, `${12 * (i % 5 + 3) - 2}`, `${12 * (i % 5 + 3) + 12}`],
  `${12 * (i % 5 + 3)}`,
  'easy'
));
MATH_B5_OBJ[0] = obj('What is the place value of 5 in 3,542?', ['Tens', 'Hundreds', 'Thousands', 'Units'], 'Hundreds', 'medium');
MATH_B5_OBJ[1] = obj('Change 0.5 to a fraction.', ['1/5', '1/4', '1/2', '5/100'], '1/2', 'easy');
MATH_B5_OBJ[2] = obj('What is the perimeter of a square with side 6cm?', ['12cm', '24cm', '36cm', '18cm'], '24cm', 'medium');
MATH_B5_OBJ[3] = obj('Solve for x: x + 7 = 15', ['8', '22', '7', '10'], '8', 'easy');

const MATH_B5_SUBJ = [
  subj('A farmer harvested 4,500 yams. He sold 2,345 yams. How many yams are left?', 10),
  subj('Find the Least Common Multiple (LCM) of 8 and 12.', 10),
  subj('Calculate the area of a rectangle with length 15cm and width 8cm.', 10),
  subj('Simplify the fraction 24/36 to its lowest terms.', 10),
  subj('A bus travels 60km in 1 hour. How far will it travel in 3 and a half hours?', 10),
  subj('Draw a circle and label its radius, diameter, and circumference.', 10),
  subj('Express 75% as a decimal and as a fraction in its simplest form.', 10),
];

// ==========================================
// BASIC 6 - INTEGRATED SCIENCE
// ==========================================
const SCI_B6_OBJ = Array.from({ length: 40 }).map((_, i) => obj(
  `Which of these is a property of a solid?`,
  ['Fixed shape', 'Flows easily', 'No fixed volume', 'Can be compressed easily'],
  'Fixed shape',
  'easy'
));
SCI_B6_OBJ[0] = obj('Which part of the flower is male?', ['Stamen', 'Pistil', 'Petal', 'Sepal'], 'Stamen', 'hard');
SCI_B6_OBJ[1] = obj('An animal that eats only plants is a:', ['Carnivore', 'Herbivore', 'Omnivore', 'Parasite'], 'Herbivore', 'easy');
SCI_B6_OBJ[2] = obj('Which force pulls objects towards the earth?', ['Magnetism', 'Friction', 'Gravity', 'Tension'], 'Gravity', 'easy');
SCI_B6_OBJ[3] = obj('The boiling point of pure water is:', ['0°C', '50°C', '100°C', '150°C'], '100°C', 'medium');

const SCI_B6_SUBJ = [
  subj('Name three states of matter and give one example of each.', 10),
  subj('Describe how a seed germinates. What conditions are necessary for germination?', 10),
  subj('What is a lever? Give two examples of levers used in the home.', 10),
  subj('Explain the difference between a mixture and a compound.', 10),
  subj('List the main parts of the human digestive system in order.', 10),
  subj('State three ways to maintain personal hygiene.', 10),
  subj('What is an ecosystem? Give an example of a simple food chain.', 10),
];

// ==========================================
// BASIC 8 - SOCIAL STUDIES
// ==========================================
const SOC_B8_OBJ = Array.from({ length: 40 }).map((_, i) => obj(
  `Which of the following promotes national unity?`,
  ['Tribalism', 'Tolerance', 'Nepotism', 'Corruption'],
  'Tolerance',
  'medium'
));
SOC_B8_OBJ[0] = obj('The highest court in Ghana is the:', ['High Court', 'Magistrate Court', 'Supreme Court', 'Appeals Court'], 'Supreme Court', 'medium');
SOC_B8_OBJ[1] = obj('Who is the head of the Executive arm of government?', ['Chief Justice', 'Speaker of Parliament', 'President', 'IGP'], 'President', 'easy');
SOC_B8_OBJ[2] = obj('The Yaa Asantewaa War took place in:', ['1900', '1844', '1957', '1874'], '1900', 'hard');
SOC_B8_OBJ[3] = obj('A map scale shows the relationship between:', ['Mountains and rivers', 'Distance on the map and distance on the ground', 'Latitudes and Longitudes', 'The sun and the earth'], 'Distance on the map and distance on the ground', 'medium');

const SOC_B8_SUBJ = [
  subj('Explain the three arms of government and state their main functions.', 10),
  subj('What is colonisation? State three positive effects of colonisation on Ghana.', 10),
  subj('Discuss three causes of rural-urban migration and suggest two solutions.', 15),
  subj('List four fundamental human rights enshrined in the 1992 Constitution of Ghana.', 10),
  subj('What is environmental degradation? Mention three human activities that cause it.', 10),
  subj('Explain the role of the Electoral Commission in Ghana\'s democracy.', 10),
  subj('State three ways citizens can participate in the governance of their country.', 10),
];

// ==========================================
// BASIC 2 - ENGLISH LANGUAGE
// ==========================================
const ENG_B2_OBJ = Array.from({ length: 40 }).map((_, i) => obj(
  `Choose the correct word: This is ____ apple.`,
  ['a', 'an', 'the', 'some'],
  'an',
  'easy'
));
ENG_B2_OBJ[0] = obj('Which is a naming word (noun)?', ['Jump', 'Quickly', 'Dog', 'Red'], 'Dog', 'easy');
ENG_B2_OBJ[1] = obj('What is the opposite of "Big"?', ['Tall', 'Small', 'Fat', 'Long'], 'Small', 'easy');
ENG_B2_OBJ[2] = obj('Fill the blank: A cat says "____".', ['Moo', 'Bark', 'Meow', 'Oink'], 'Meow', 'easy');
ENG_B2_OBJ[3] = obj('Choose the correct action word (verb): The boy ____ the ball.', ['kicks', 'red', 'happy', 'book'], 'kicks', 'easy');

const ENG_B2_SUBJ = [
  subj('Write the names of five animals you know.', 10),
  subj('Write your full name, age, and the name of your school.', 10),
  subj('Fill in the blanks with "a" or "an": \n1. ___ elephant \n2. ___ book \n3. ___ orange', 10),
  subj('Write three things you do in the morning before school.', 10),
  subj('Change these to plural: \n1. Dog \n2. Cup \n3. Pen', 10),
  subj('Write two sentences about your mother.', 10),
  subj('Match the opposites: \nHot - \nUp - \nHappy -', 10),
];

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
          questions: objQ.map((q, i) => ({ id: q.id, number: i+1, text: q.text, options: q.options, correctAnswer: q.correctAnswer, difficulty: q.diff }))
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

const NEW_EXAMS = [
  buildExam({ title: 'Basic 5 English Language — WAEC Mock Exam', desc: 'Mock English exam for Basic 5.', classLevel: 'Basic 5', subjectName: 'English Language', mins: 90, objQ: ENG_B5_OBJ, subjQ: ENG_B5_SUBJ }),
  buildExam({ title: 'Basic 5 Mathematics — WAEC Mock Exam', desc: 'Mock Mathematics exam for Basic 5.', classLevel: 'Basic 5', subjectName: 'Mathematics', mins: 90, objQ: MATH_B5_OBJ, subjQ: MATH_B5_SUBJ }),
  buildExam({ title: 'Basic 6 Integrated Science — WAEC Mock Exam', desc: 'Mock Integrated Science exam for Basic 6.', classLevel: 'Basic 6', subjectName: 'Integrated Science', mins: 90, objQ: SCI_B6_OBJ, subjQ: SCI_B6_SUBJ }),
  buildExam({ title: 'Basic 8 Social Studies — WAEC Mock Exam', desc: 'Mock Social Studies exam for JHS 2 (Basic 8).', classLevel: 'Basic 8', subjectName: 'Social Studies', mins: 120, objQ: SOC_B8_OBJ, subjQ: SOC_B8_SUBJ }),
  buildExam({ title: 'Basic 2 English Language — WAEC Mock Exam', desc: 'Mock English exam for Basic 2.', classLevel: 'Basic 2', subjectName: 'English Language', mins: 60, objQ: ENG_B2_OBJ, subjQ: ENG_B2_SUBJ }),
];

async function run() {
  console.log('🎓 Seeding extra WAEC exams (Batch 2)...\n');
  for (const exam of NEW_EXAMS) {
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
  console.log('\n🎉 Done!');
}

run();
