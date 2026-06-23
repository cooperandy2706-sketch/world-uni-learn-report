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
// BASIC 2 - MATHEMATICS
// ==========================================
const MATH_B2_OBJ = Array.from({ length: 40 }).map((_, i) => obj(
  `What is ${i + 5} + ${i + 2}?`,
  [`${i + 6}`, `${i + 7}`, `${i + 8}`, `${i + 9}`],
  `${i + 7}`,
  'easy'
));
MATH_B2_OBJ[0] = obj('What is 10 + 5?', ['12', '14', '15', '20'], '15', 'easy');
MATH_B2_OBJ[1] = obj('Which number is the largest?', ['12', '24', '18', '9'], '24', 'easy');
MATH_B2_OBJ[2] = obj('What shape has 3 sides?', ['Square', 'Circle', 'Triangle', 'Rectangle'], 'Triangle', 'easy');

const MATH_B2_SUBJ = [
  subj('Kwame has 15 apples and gives 6 to his sister. How many apples does Kwame have left?', 10),
  subj('Draw a rectangle and color half of it.', 10),
  subj('Write the numbers from 1 to 20 in words.', 10),
  subj('Add these numbers: 24 + 15 + 10.', 10),
  subj('A book costs 5 cedis. How much will 3 books cost?', 10),
  subj('Write the even numbers between 10 and 20.', 10),
  subj('What is the time if the long hand is on 12 and the short hand is on 4?', 10),
];

// ==========================================
// BASIC 3 - ENGLISH LANGUAGE
// ==========================================
const ENG_B3_OBJ = Array.from({ length: 40 }).map((_, i) => obj(
  `Choose the correct verb: The dog ______ running.`,
  ['is', 'are', 'am', 'be'],
  'is',
  'easy'
));
ENG_B3_OBJ[0] = obj('Choose the noun in this sentence: The cat is sleeping.', ['sleeping', 'The', 'is', 'cat'], 'cat', 'easy');
ENG_B3_OBJ[1] = obj('What is the opposite of "hot"?', ['warm', 'cold', 'sun', 'fire'], 'cold', 'easy');
ENG_B3_OBJ[2] = obj('Which word is spelled correctly?', ['Becus', 'Becuz', 'Because', 'Becose'], 'Because', 'easy');

const ENG_B3_SUBJ = [
  subj('Write five sentences about your best friend.', 10),
  subj('Change these words to plural: 1. Box 2. Baby 3. Man 4. Leaf 5. Child', 10),
  subj('Fill in the blanks with am, is, or are:\n1. I ___ a student.\n2. They ___ playing.\n3. She ___ my sister.', 10),
  subj('Write a short story about a day at the beach.', 10),
  subj('Identify the adjectives in this sentence: The big brown dog chased the small cat.', 10),
  subj('Write down five things you can find in a classroom.', 10),
  subj('Construct simple sentences using these words: 1. Happy 2. Run 3. School', 10),
];

// ==========================================
// BASIC 6 - SOCIAL STUDIES
// ==========================================
const SOC_B6_OBJ = Array.from({ length: 40 }).map((_, i) => obj(
  `Which of the following is a right of a citizen?`,
  ['To steal', 'To vote', 'To fight', 'To lie'],
  'To vote',
  'easy'
));
SOC_B6_OBJ[0] = obj('Who was the first President of Ghana?', ['Kwame Nkrumah', 'J.B. Danquah', 'Kofi Annan', 'Jerry Rawlings'], 'Kwame Nkrumah', 'easy');
SOC_B6_OBJ[1] = obj('Which is the capital of Ghana?', ['Kumasi', 'Tamale', 'Accra', 'Cape Coast'], 'Accra', 'easy');
SOC_B6_OBJ[2] = obj('The colours of the Ghana flag are red, gold, green and a black _____', ['circle', 'triangle', 'star', 'square'], 'star', 'easy');

const SOC_B6_SUBJ = [
  subj('Name the ten regions of Ghana (old regions) or the sixteen new regions.', 10),
  subj('What is the importance of rules and regulations in a school?', 10),
  subj('Describe the role of the President in Ghana.', 10),
  subj('What is a natural resource? Give three examples found in Ghana.', 10),
  subj('Explain three causes of environmental pollution in our communities.', 10),
  subj('State three duties of a good citizen.', 10),
  subj('Why is it important to celebrate national holidays?', 10),
];

// ==========================================
// BASIC 8 - INTEGRATED SCIENCE
// ==========================================
const SCI_B8_OBJ = Array.from({ length: 40 }).map((_, i) => obj(
  `Which of the following is a source of renewable energy?`,
  ['Coal', 'Solar', 'Oil', 'Natural Gas'],
  'Solar',
  'medium'
));
SCI_B8_OBJ[0] = obj('What gas do plants absorb during photosynthesis?', ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'], 'Carbon Dioxide', 'medium');
SCI_B8_OBJ[1] = obj('The process of water turning into vapor is called:', ['Condensation', 'Evaporation', 'Freezing', 'Melting'], 'Evaporation', 'medium');
SCI_B8_OBJ[2] = obj('Which planet is known as the Red Planet?', ['Venus', 'Mars', 'Jupiter', 'Saturn'], 'Mars', 'easy');

const SCI_B8_SUBJ = [
  subj('Explain the process of photosynthesis and write its word equation.', 10),
  subj('Differentiate between a physical change and a chemical change. Give one example of each.', 10),
  subj('Describe the water cycle with the aid of a diagram.', 10),
  subj('State three functions of the human skeleton.', 10),
  subj('What is pollution? Name three types of pollution and one way to prevent each.', 10),
  subj('Explain how a simple electric circuit works. What components are necessary?', 10),
  subj('Name three parts of a plant cell and state their functions.', 10),
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
  buildExam({ title: 'Basic 2 Mathematics — WAEC Mock Exam', desc: 'Mock Mathematics exam for Basic 2 students.', classLevel: 'Basic 2', subjectName: 'Mathematics', mins: 60, objQ: MATH_B2_OBJ, subjQ: MATH_B2_SUBJ }),
  buildExam({ title: 'Basic 3 English Language — WAEC Mock Exam', desc: 'Mock English exam for Basic 3 students.', classLevel: 'Basic 3', subjectName: 'English Language', mins: 60, objQ: ENG_B3_OBJ, subjQ: ENG_B3_SUBJ }),
  buildExam({ title: 'Basic 6 Social Studies — WAEC Mock Exam', desc: 'Mock Social Studies exam for Basic 6 students.', classLevel: 'Basic 6', subjectName: 'Social Studies', mins: 90, objQ: SOC_B6_OBJ, subjQ: SOC_B6_SUBJ }),
  buildExam({ title: 'Basic 8 Integrated Science — WAEC Mock Exam', desc: 'Mock Integrated Science exam for JHS 2 (Basic 8) students.', classLevel: 'Basic 8', subjectName: 'Integrated Science', mins: 120, objQ: SCI_B8_OBJ, subjQ: SCI_B8_SUBJ }),
];

async function run() {
  console.log('🎓 Seeding WAEC exams for Basic 2, 3, 6, 8...\n');
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
