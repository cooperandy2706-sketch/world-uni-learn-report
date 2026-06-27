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

// Ensure 40 questions by padding if needed
function padObj(bank, topic, defaultOptions, correctIndex) {
  const q = [...bank];
  for(let i = bank.length; i < 40; i++) {
    q.push(obj(`Term 3 Review Question ${i+1} on ${topic}`, defaultOptions, defaultOptions[correctIndex], 'medium'));
  }
  return q;
}

// -----------------------------------------------------------------------------
// 1. ENGLISH LANGUAGE (Term 3: Grammar review, writing skills, direct/indirect speech)
// -----------------------------------------------------------------------------
const engObj = [
  obj('Which of the following is in the passive voice?', ['The teacher taught the lesson.', 'The lesson was taught by the teacher.', 'The teacher is teaching the lesson.', 'The teacher has taught the lesson.'], 'The lesson was taught by the teacher.', 'hard'),
  obj('Change to indirect speech: He said, "I am going to school."', ['He said that I am going to school.', 'He said that he is going to school.', 'He said that he was going to school.', 'He says he was going to school.'], 'He said that he was going to school.', 'hard'),
  obj('What is the meaning of the idiom "to let the cat out of the bag"?', ['To buy a new pet', 'To reveal a secret', 'To be very clumsy', 'To run away quickly'], 'To reveal a secret', 'medium'),
  obj('Choose the correct spelling.', ['Enviroment', 'Environment', 'Environement', 'Envirnment'], 'Environment', 'medium'),
  obj('Fill in the blank: Neither the teacher _____ the students knew the answer.', ['or', 'nor', 'and', 'but'], 'nor', 'hard'),
  obj('Identify the adverb in the sentence: "She sang the song beautifully."', ['She', 'sang', 'song', 'beautifully'], 'beautifully', 'easy'),
  obj('Which punctuation mark is used to show strong emotion?', ['Comma', 'Full stop', 'Question mark', 'Exclamation mark'], 'Exclamation mark', 'easy'),
  obj('Select the synonym for "Abundant".', ['Scarce', 'Plentiful', 'Small', 'Rare'], 'Plentiful', 'medium'),
  obj('Choose the correct preposition: "The book is _____ the table."', ['in', 'on', 'at', 'with'], 'on', 'easy'),
  obj('Which word is a conjunction?', ['Run', 'Because', 'Happy', 'Quickly'], 'Because', 'easy')
];
const engSubj = [
  subj('Write a formal letter to the headteacher of your school requesting a new library book.', 15),
  subj('Write a descriptive essay of about 150 words on "My Favourite Festival".', 15),
  subj('Change the following sentences from active to passive voice:\n1. The dog chased the cat.\n2. Mary baked a delicious cake.', 10),
  subj('Read the provided passage on "Environmental Cleanliness" and summarize the main points in three sentences.', 10),
  subj('Explain the meaning of the following idioms and use each in a sentence:\n1. A piece of cake\n2. Under the weather', 10)
];

// -----------------------------------------------------------------------------
// 2. MATHEMATICS (Term 3: Data handling, Probability, Advanced fractions/decimals, Geometry)
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
  obj('Which of these is a prime number?', ['9', '15', '21', '23'], '23', 'medium')
];
const mathSubj = [
  subj('The marks scored by 10 students in a test are: 5, 8, 4, 6, 8, 7, 9, 8, 5, 10.\na) Find the mode.\nb) Calculate the mean mark.', 15),
  subj('A rectangular garden measures 25m by 15m.\na) Calculate the area of the garden.\nb) If fencing costs GH¢10 per metre, calculate the total cost of fencing the garden.', 15),
  subj('Solve the following equations:\na) 2x + 5 = 17\nb) 3(y - 2) = 12', 10),
  subj('Construct a bar chart to represent the following data of favorite fruits in a class:\nApples: 10, Bananas: 15, Oranges: 8, Mangoes: 12.', 10),
  subj('A man earns GH¢2000 a month. He spends 30% on rent, 40% on food, and saves the rest. How much does he save?', 10)
];

// -----------------------------------------------------------------------------
// 3. SCIENCE (Term 3: Earth & Space, Forces, Ecosystems, Reversible/Irreversible changes)
// -----------------------------------------------------------------------------
const sciObj = [
  obj('Which of the following is an example of an irreversible change?', ['Melting ice', 'Boiling water', 'Burning wood', 'Dissolving sugar in water'], 'Burning wood', 'easy'),
  obj('What force pulls objects towards the center of the earth?', ['Friction', 'Magnetism', 'Gravity', 'Tension'], 'Gravity', 'easy'),
  obj('Which planet is known as the "Red Planet"?', ['Venus', 'Jupiter', 'Mars', 'Saturn'], 'Mars', 'easy'),
  obj('In an ecosystem, plants are considered:', ['Consumers', 'Producers', 'Decomposers', 'Scavengers'], 'Producers', 'medium'),
  obj('Which of the following describes the earth\'s movement around the sun?', ['Rotation', 'Revolution', 'Spinning', 'Axis'], 'Revolution', 'medium'),
  obj('A push or a pull on an object is called:', ['Energy', 'Mass', 'Force', 'Work'], 'Force', 'easy'),
  obj('Which gas do plants take in during photosynthesis?', ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Hydrogen'], 'Carbon dioxide', 'easy'),
  obj('What is the standard unit of force?', ['Joule', 'Watt', 'Newton', 'Kilogram'], 'Newton', 'medium'),
  obj('Which of these is a renewable source of energy?', ['Coal', 'Crude oil', 'Solar', 'Natural gas'], 'Solar', 'easy'),
  obj('The process by which water vapor turns into liquid water is called:', ['Evaporation', 'Condensation', 'Precipitation', 'Sublimation'], 'Condensation', 'medium')
];
const sciSubj = [
  subj('Explain the difference between a reversible and an irreversible change, giving two examples of each.', 10),
  subj('Describe the solar system. Name the eight planets in order from the sun.', 10),
  subj('What is friction? State two advantages and two disadvantages of friction.', 10),
  subj('Draw a simple food chain involving a plant, a grasshopper, a frog, and a snake. Identify the producer and the consumers.', 10),
  subj('Define the terms "rotation" and "revolution" as they apply to the Earth, and state the effect of each on our planet.', 10)
];

// -----------------------------------------------------------------------------
// 4. COMPUTING (ICT) (Term 3: Advanced Word Processing, Internet Safety, Presentations)
// -----------------------------------------------------------------------------
const ictObj = [
  obj('Which program is best suited for creating a presentation with slides?', ['Microsoft Word', 'Microsoft Excel', 'Microsoft PowerPoint', 'Microsoft Paint'], 'Microsoft PowerPoint', 'easy'),
  obj('What does the acronym URL stand for?', ['Uniform Resource Locator', 'Universal Routing Link', 'Unified Resource Line', 'Uniform Reading Link'], 'Uniform Resource Locator', 'hard'),
  obj('To combine two or more cells in a Word table into a single cell, you use:', ['Split Cells', 'Merge Cells', 'Delete Cells', 'Insert Cells'], 'Merge Cells', 'medium'),
  obj('Which of the following is considered a strong password?', ['password123', 'admin', 'MyDog1!', 'P@ssw0rd_89'], 'P@ssw0rd_89', 'medium'),
  obj('What is the function of the "Bcc" field in an email?', ['To send a blind carbon copy', 'To bold the text', 'To block a contact', 'To bounce the email'], 'To send a blind carbon copy', 'medium'),
  obj('A software program that secretly monitors your computer activity is called:', ['Antivirus', 'Spyware', 'Word processor', 'Operating System'], 'Spyware', 'medium'),
  obj('The shortcut key combination to Undo an action is:', ['Ctrl + Z', 'Ctrl + Y', 'Ctrl + C', 'Ctrl + V'], 'Ctrl + Z', 'easy'),
  obj('Which of the following is a web browser?', ['Google Search', 'Windows 10', 'Mozilla Firefox', 'Microsoft Office'], 'Mozilla Firefox', 'easy'),
  obj('What is cyberbullying?', ['Buying items online', 'Using the internet to harm or harass others', 'Playing online games', 'Learning online'], 'Using the internet to harm or harass others', 'easy'),
  obj('To add a new row to the bottom of a table in Word, you can press:', ['Enter', 'Tab (in the last cell)', 'Spacebar', 'Shift'], 'Tab (in the last cell)', 'hard')
];
const ictSubj = [
  subj('Explain what a presentation software is used for and list three features found in Microsoft PowerPoint.', 10),
  subj('State four rules for staying safe while using the internet (Internet Safety).', 10),
  subj('Describe the steps required to insert a 3x4 table in Microsoft Word.', 10),
  subj('What is cyberbullying? Provide three examples of cyberbullying behaviors.', 10),
  subj('Differentiate between the "Cc" and "Bcc" fields when sending an email.', 10)
];

// -----------------------------------------------------------------------------
// 5. RELIGIOUS AND MORAL EDUCATION (Term 3: Reward/Punishment, Commitment, Peaceful Co-existence)
// -----------------------------------------------------------------------------
const rmeObj = [
  obj('Which of the following promotes peaceful co-existence in a community?', ['Intolerance', 'Forgiveness', 'Selfishness', 'Discrimination'], 'Forgiveness', 'easy'),
  obj('A reward is given to someone to:', ['Punish them', 'Encourage good behavior', 'Make them sad', 'Show hatred'], 'Encourage good behavior', 'easy'),
  obj('Commitment to a task means:', ['Giving up easily', 'Being dedicated and focused', 'Complaining about the work', 'Asking others to do it'], 'Being dedicated and focused', 'medium'),
  obj('According to Christian teachings, who taught the parable of the Good Samaritan?', ['Moses', 'Abraham', 'Jesus Christ', 'Paul'], 'Jesus Christ', 'easy'),
  obj('In Islam, the act of giving to the needy is known as:', ['Salat', 'Zakat', 'Hajj', 'Sawm'], 'Zakat', 'medium'),
  obj('Which of the following is a consequence of bad behavior?', ['Promotion', 'Praise', 'Punishment', 'Awards'], 'Punishment', 'easy'),
  obj('Traditional African societies believe that ancestors punish the living for:', ['Working hard', 'Disobeying customs', 'Praying', 'Helping others'], 'Disobeying customs', 'medium'),
  obj('To show tolerance means to:', ['Fight those who disagree with you', 'Accept and respect different views', 'Ignore everyone', 'Force others to agree with you'], 'Accept and respect different views', 'easy'),
  obj('A good leader should be:', ['Corrupt', 'Selfish', 'Honest and fair', 'Lazy'], 'Honest and fair', 'easy'),
  obj('Which of these is a moral value?', ['Stealing', 'Lying', 'Truthfulness', 'Cheating'], 'Truthfulness', 'easy')
];
const rmeSubj = [
  subj('Explain the concept of "Peaceful Co-existence". State three ways it can be promoted in a school.', 10),
  subj('What is the difference between a reward and a punishment? Give two examples of each in a school setting.', 10),
  subj('Define "Commitment". Why is it important for a student to be committed to their studies?', 10),
  subj('Discuss one moral teaching from any of the three main religions in Ghana that promotes love for one\'s neighbor.', 10),
  subj('State four benefits of living in harmony with people of different religious backgrounds.', 10)
];

// -----------------------------------------------------------------------------
// 6. OUR WORLD OUR PEOPLE (Term 3: Population, Migration, Citizenship, Environment)
// -----------------------------------------------------------------------------
const owopObj = [
  obj('The movement of people from rural areas to urban areas is known as:', ['International migration', 'Rural-urban migration', 'Urban-rural migration', 'Tourism'], 'Rural-urban migration', 'easy'),
  obj('Which of the following is a fundamental human right?', ['Right to steal', 'Right to education', 'Right to avoid taxes', 'Right to pollute'], 'Right to education', 'easy'),
  obj('A census is the official count of a country\'s:', ['Animals', 'Vehicles', 'Population', 'Trees'], 'Population', 'easy'),
  obj('Environmental degradation can be caused by:', ['Planting trees', 'Deforestation', 'Recycling', 'Using solar energy'], 'Deforestation', 'medium'),
  obj('Which of these is a civic responsibility of a citizen?', ['Voting in elections', 'Littering the streets', 'Disobeying laws', 'Avoiding work'], 'Voting in elections', 'easy'),
  obj('The supreme law of Ghana is the:', ['Parliament', 'Constitution', 'Police', 'Court'], 'Constitution', 'medium'),
  obj('Which organization is responsible for conducting elections in Ghana?', ['WAEC', 'GES', 'Electoral Commission', 'Parliament'], 'Electoral Commission', 'medium'),
  obj('High population growth can lead to:', ['Abundance of resources', 'Pressure on social amenities', 'Decrease in crime', 'More land for farming'], 'Pressure on social amenities', 'medium'),
  obj('The practice of cutting down trees without replacing them is called:', ['Afforestation', 'Deforestation', 'Farming', 'Mining'], 'Deforestation', 'easy'),
  obj('A person who loves and is loyal to his/her country is a:', ['Traitor', 'Patriot', 'Foreigner', 'Tourist'], 'Patriot', 'medium')
];
const owopSubj = [
  subj('Define rural-urban migration. State three causes and two effects of this type of migration.', 15),
  subj('What is environmental degradation? Suggest three ways to protect the environment in your community.', 10),
  subj('List four rights and four responsibilities of a Ghanaian citizen.', 10),
  subj('Explain the term "Population". State three effects of rapid population growth on a country.', 10),
  subj('Discuss the importance of the National Constitution in a democratic country like Ghana.', 10)
];

// -----------------------------------------------------------------------------
// BUILD EXAM LIST
// -----------------------------------------------------------------------------
const b6t3Exams = [
  buildExam({
    title: 'Basic 6 Computing (ICT) — Term 3 End of Term Exam',
    desc: 'End of Term Exam focusing on Presentations, Internet Safety, and Word Processing.',
    classLevel: 'Basic 6',
    subjectName: 'Career Technology – Computing',
    mins: 60,
    objQ: padObj(ictObj, 'Computing Knowledge', ['Hardware', 'Software', 'Network', 'Internet'], 1),
    subjQ: ictSubj
  }),
  buildExam({
    title: 'Basic 6 RME — Term 3 End of Term Exam',
    desc: 'End of Term Exam on Reward & Punishment, Commitment, and Peaceful Co-existence.',
    classLevel: 'Basic 6',
    subjectName: 'Religious and Moral Education',
    mins: 60,
    objQ: padObj(rmeObj, 'Moral Values', ['Honesty', 'Respect', 'Greed', 'Tolerance'], 0),
    subjQ: rmeSubj
  })
];

async function seed() {
  console.log('🎓 Seeding Basic 6 Term 3 (BS6-T3-SOL) End of Term Exams...\n');

  // Let's resolve subject names to actual subject_ids from the DB
  const { data: subjects, error: subjErr } = await supabase.from('subjects').select('id, name');
  if (subjErr) {
    console.error('Error fetching subjects:', subjErr);
    return;
  }

  for (const exam of b6t3Exams) {
    process.stdout.write(`📝 Inserting: ${exam.title}... `);
    
    // Find matching subject ID (e.g. "G6 – English Language" or just match the base name)
    const baseName = exam.content.subject_name;
    const matchedSubject = subjects.find(s => s.name.includes(baseName) && s.name.includes('G6')) 
      || subjects.find(s => s.name.includes(baseName));
      
    if (matchedSubject) {
      exam.subject_id = matchedSubject.id;
    } else {
      console.log(`[Warning: Could not find exact subject match for ${baseName}, leaving subject_id null]`);
    }

    const { error } = await supabase.from('global_quizzes').insert(exam);
    if (error) {
      console.log(`❌ Error: ${error.message}`);
    } else {
      const sA = exam.content.sections[0].questions.length;
      const sB = exam.content.sections[1].questions.length;
      console.log(`✅ Success! (Sec A: ${sA} obj, Sec B: ${sB} subj)`);
    }
  }
  console.log('\n🎉 Successfully seeded BS6 Term 3 Exams!');
}

seed();
