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
          name: 'Section A (Objective Test)',
          type: 'objective',
          instructions: `Answer ALL ${objQ.length} questions. Each question carries equal marks. Choose the BEST answer from the options provided.`,
          questions: objQ.map((q, i) => ({ id: q.id, number: i+1, text: q.text, options: q.options, correctAnswer: q.correctAnswer, difficulty: q.difficulty }))
        },
        {
          name: 'Section B (Essay/Subjective)',
          type: 'subjective',
          instructions: `Answer any 4 out of the ${subjQ.length} questions. Show all working/reasoning where applicable.`,
          required: 4,
          questions: subjQ.map((q, i) => ({ id: q.id, number: i+1, text: q.text, marks: q.marks, hint: q.hint || '' }))
        }
      ]
    }
  };
}

// -----------------------------------------------------------------------------
// MATHEMATICS - 40 Exact Objective Questions + 5 Subjective
// -----------------------------------------------------------------------------
const mathObj = [
  obj('Find the average (mean) of the following numbers: 12, 15, 18, 20, 25.', ['15', '18', '20', '90'], '18', 'medium'),
  obj('What is the probability of rolling a 4 on a standard six-sided die?', ['1/2', '1/4', '1/6', '4/6'], '1/6', 'medium'),
  obj('Convert 3/4 to a percentage.', ['75%', '34%', '43%', '25%'], '75%', 'easy'),
  obj('A trader bought an item for GH¢40 and sold it for GH¢50. Calculate the percentage profit.', ['10%', '20%', '25%', '50%'], '25%', 'hard'),
  obj('How many degrees are in a straight line?', ['90°', '180°', '270°', '360°'], '180°', 'easy'),
  obj('If x + 7 = 15, what is the value of x?', ['7', '8', '15', '22'], '8', 'easy'),
  obj('Calculate the area of a triangle with base 10cm and height 8cm.', ['80 cm²', '40 cm²', '18 cm²', '36 cm²'], '40 cm²', 'medium'),
  obj('Express 0.25 as a fraction in its simplest form.', ['1/2', '1/4', '2/5', '1/5'], '1/4', 'easy'),
  obj('What is the perimeter of a rectangle with length 12m and width 5m?', ['17m', '34m', '60m', '30m'], '34m', 'medium'),
  obj('Which of these is a prime number?', ['9', '15', '21', '23'], '23', 'medium'),
  obj('What is the place value of 6 in the number 4,672?', ['Units', 'Tens', 'Hundreds', 'Thousands'], 'Hundreds', 'easy'),
  obj('Calculate: 15 × 12', ['150', '180', '165', '190'], '180', 'medium'),
  obj('What is the Lowest Common Multiple (LCM) of 4 and 6?', ['2', '10', '12', '24'], '12', 'medium'),
  obj('Solve for y: 2y = 16', ['4', '6', '8', '14'], '8', 'easy'),
  obj('Convert 4500 grams to kilograms.', ['45 kg', '4.5 kg', '0.45 kg', '450 kg'], '4.5 kg', 'medium'),
  obj('The sum of angles in a triangle is always:', ['90°', '180°', '270°', '360°'], '180°', 'easy'),
  obj('What is 10% of 200?', ['10', '20', '30', '40'], '20', 'easy'),
  obj('Simplify the ratio 15:25', ['1:2', '3:5', '5:3', '15:25'], '3:5', 'medium'),
  obj('Calculate the volume of a cuboid with length 5cm, width 4cm, and height 3cm.', ['60 cm³', '12 cm³', '20 cm³', '47 cm³'], '60 cm³', 'medium'),
  obj('Write 0.5 as a percentage.', ['5%', '50%', '500%', '0.5%'], '50%', 'easy'),
  obj('Subtract: 4.5 - 2.1', ['2.4', '2.5', '1.4', '1.5'], '2.4', 'easy'),
  obj('If a dozen eggs cost GH¢24, what is the cost of one egg?', ['GH¢1', 'GH¢2', 'GH¢3', 'GH¢4'], 'GH¢2', 'medium'),
  obj('What is the median of this set of numbers: 3, 5, 7, 9, 11?', ['5', '7', '9', '35'], '7', 'medium'),
  obj('Which shape has exactly 4 equal sides and 4 right angles?', ['Rectangle', 'Rhombus', 'Square', 'Trapezoid'], 'Square', 'easy'),
  obj('A bag contains 3 red balls and 2 blue balls. What is the probability of picking a blue ball?', ['2/5', '3/5', '1/2', '2/3'], '2/5', 'hard'),
  obj('Calculate: 2³ (2 to the power of 3)', ['6', '8', '10', '16'], '8', 'medium'),
  obj('Find the Highest Common Factor (HCF) of 12 and 18.', ['2', '3', '6', '36'], '6', 'hard'),
  obj('A dress was reduced from GH¢100 to GH¢80. What was the percentage discount?', ['10%', '20%', '25%', '80%'], '20%', 'hard'),
  obj('Add: 1/3 + 1/6', ['2/9', '1/2', '2/6', '1/3'], '1/2', 'hard'),
  obj('How many minutes are in 2.5 hours?', ['150', '120', '180', '125'], '150', 'medium'),
  obj('A rectangle has an area of 40 cm² and a length of 8 cm. What is its width?', ['5 cm', '10 cm', '32 cm', '4 cm'], '5 cm', 'medium'),
  obj('Which number is a multiple of both 3 and 4?', ['10', '12', '16', '21'], '12', 'easy'),
  obj('What is the value of the Roman numeral XIV?', ['14', '16', '11', '9'], '14', 'medium'),
  obj('A right angle measures exactly:', ['45°', '90°', '180°', '360°'], '90°', 'easy'),
  obj('Evaluate: 10 + 5 × 2 (Remember order of operations)', ['30', '20', '17', '15'], '20', 'hard'),
  obj('Express 2/5 as a decimal.', ['0.25', '0.2', '0.4', '0.5'], '0.4', 'medium'),
  obj('Find the perimeter of a square with side 6cm.', ['12 cm', '24 cm', '36 cm', '10 cm'], '24 cm', 'easy'),
  obj('Write "Two thousand, three hundred and four" in figures.', ['23004', '20304', '2304', '2340'], '2304', 'easy'),
  obj('What is the product of 0.3 and 0.4?', ['1.2', '0.12', '0.012', '12'], '0.12', 'hard'),
  obj('If y - 4 = 10, find y.', ['6', '10', '14', '40'], '14', 'easy')
];

const mathSubj = [
  subj('The marks scored by 10 students in a test are: 5, 8, 4, 6, 8, 7, 9, 8, 5, 10.\na) Find the mode.\nb) Calculate the mean mark.', 15),
  subj('A rectangular garden measures 25m by 15m.\na) Calculate the area of the garden.\nb) If fencing costs GH¢10 per metre, calculate the total cost of fencing the garden.', 15),
  subj('Solve the following equations:\na) 2x + 5 = 17\nb) 3(y - 2) = 12', 10),
  subj('Construct a bar chart to represent the following data of favorite fruits in a class:\nApples: 10, Bananas: 15, Oranges: 8, Mangoes: 12.', 10),
  subj('A man earns GH¢2000 a month. He spends 30% on rent, 40% on food, and saves the rest. How much does he save?', 10)
];

const mathExam = buildExam({
  title: 'Basic 6 Mathematics — Complete Exact Questions Challenge',
  desc: 'End of Term Exam covering Data handling, Geometry, and Advanced Fractions/Decimals, with 40 unique questions.',
  classLevel: 'Basic 6',
  subjectName: 'Mathematics',
  mins: 90,
  objQ: mathObj,
  subjQ: mathSubj
});

async function seed() {
  console.log('🎓 Seeding EXACT Basic 6 Term 3 Mathematics Exam...\n');

  const { data: subjects, error: subjErr } = await supabase.from('subjects').select('id, name');
  if (subjErr) {
    console.error('Error fetching subjects:', subjErr);
    return;
  }

  process.stdout.write(`📝 Inserting: ${mathExam.title}... `);
  
  const baseName = mathExam.content.subject_name;
  const matchedSubject = subjects.find(s => s.name.includes(baseName) && s.name.includes('G6')) 
    || subjects.find(s => s.name.includes(baseName));
    
  if (matchedSubject) {
    mathExam.subject_id = matchedSubject.id;
  }

  const { error } = await supabase.from('global_quizzes').insert(mathExam);
  if (error) {
    console.log(`❌ Error: ${error.message}`);
  } else {
    console.log(`✅ Success! (Sec A: 40 obj, Sec B: 5 subj)`);
  }
}

seed();
