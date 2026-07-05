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
// OUR WORLD OUR PEOPLE (OWOP) - 40 Exact Objective Questions
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
  obj('A person who loves and is loyal to his/her country is a:', ['Traitor', 'Patriot', 'Foreigner', 'Tourist'], 'Patriot', 'medium'),
  obj('What is a nuclear family?', ['Parents, children, and grandparents', 'Only a father and a mother', 'Father, mother, and their children', 'Children living alone'], 'Father, mother, and their children', 'easy'),
  obj('Which of the following is a natural disaster?', ['Traffic jam', 'Earthquake', 'Robbery', 'Pollution'], 'Earthquake', 'easy'),
  obj('Who is the head of the executive arm of government in Ghana?', ['The Chief Justice', 'The President', 'The Speaker of Parliament', 'The Inspector General of Police'], 'The President', 'medium'),
  obj('An area with a high population density is usually:', ['A village', 'A desert', 'An urban center or city', 'A forest'], 'An urban center or city', 'medium'),
  obj('Which of these is a negative effect of bad weather on farming?', ['High yield', 'Destruction of crops', 'Fertile soil', 'Availability of seeds'], 'Destruction of crops', 'easy'),
  obj('The exchange of goods and services between two or more countries is called:', ['Internal trade', 'Barter trade', 'International trade', 'Retail trade'], 'International trade', 'hard'),
  obj('Which of the following bodies is responsible for making laws in Ghana?', ['The Judiciary', 'The Executive', 'The Legislature (Parliament)', 'The Media'], 'The Legislature (Parliament)', 'medium'),
  obj('An example of an abiotic (non-living) component of the environment is:', ['Trees', 'Animals', 'Water', 'Humans'], 'Water', 'medium'),
  obj('What do we call the original inhabitants of a place?', ['Tourists', 'Immigrants', 'Indigenous people', 'Refugees'], 'Indigenous people', 'hard'),
  obj('Which of these is a way to conserve water?', ['Leaving the tap running', 'Fixing leaking pipes', 'Bathing for long hours', 'Washing cars with a hose daily'], 'Fixing leaking pipes', 'easy'),
  obj('What does the red color in the Ghana national flag represent?', ['The rich forest', 'The blood of those who died for independence', 'The mineral wealth', 'The shining star'], 'The blood of those who died for independence', 'easy'),
  obj('A community that consists of people from different cultural backgrounds is said to be:', ['Homogeneous', 'Heterogeneous (Diverse)', 'Isolated', 'Traditional'], 'Heterogeneous (Diverse)', 'hard'),
  obj('Which of the following leads to water pollution?', ['Boiling water', 'Dumping refuse into rivers', 'Swimming in a pool', 'Fishing'], 'Dumping refuse into rivers', 'easy'),
  obj('The process of turning waste materials into reusable materials is called:', ['Burning', 'Burying', 'Recycling', 'Dumping'], 'Recycling', 'easy'),
  obj('Which of these is NOT a basic need of a human being?', ['Food', 'Shelter', 'Clothing', 'Television'], 'Television', 'easy'),
  obj('Migration from another country into one\'s own country is called:', ['Emigration', 'Immigration', 'Tourism', 'Deportation'], 'Immigration', 'hard'),
  obj('What is the capital city of Ghana?', ['Kumasi', 'Tamale', 'Accra', 'Takoradi'], 'Accra', 'easy'),
  obj('Which of the following is a characteristic of a good citizen?', ['Paying taxes regularly', 'Destroying public property', 'Bribing officials', 'Evading arrest'], 'Paying taxes regularly', 'easy'),
  obj('The act of taking another person\'s property without permission is:', ['Borrowing', 'Stealing', 'Lending', 'Donating'], 'Stealing', 'easy'),
  obj('What does the acronym "NGO" stand for?', ['National Government Organization', 'Non-Governmental Organization', 'New Global Order', 'National Growth Office'], 'Non-Governmental Organization', 'medium'),
  obj('Which of these is a renewable natural resource?', ['Crude oil', 'Solar energy (Sunlight)', 'Coal', 'Gold'], 'Solar energy (Sunlight)', 'medium'),
  obj('Who is a "Refugee"?', ['A person on a holiday', 'A person forced to leave their country to escape war or persecution', 'A business traveler', 'A student studying abroad'], 'A person forced to leave their country to escape war or persecution', 'medium'),
  obj('The arm of government responsible for interpreting laws is the:', ['Legislature', 'Executive', 'Judiciary', 'Electoral Commission'], 'Judiciary', 'medium'),
  obj('Which of the following can help prevent the spread of diseases in a community?', ['Proper sanitation', 'Living in crowded spaces', 'Drinking unboiled water', 'Sharing needles'], 'Proper sanitation', 'easy'),
  obj('What is a scale on a map used for?', ['To show the colors', 'To measure actual distances on the ground', 'To identify the map maker', 'To show the date'], 'To measure actual distances on the ground', 'hard'),
  obj('Which of these is an example of a cash crop grown in Ghana?', ['Yam', 'Cassava', 'Cocoa', 'Plantain'], 'Cocoa', 'easy'),
  obj('A leader chosen by the people through an election is a:', ['King', 'Chief', 'Democratic leader', 'Dictator'], 'Democratic leader', 'medium'),
  obj('Which of the following is a major cause of rural-urban migration?', ['Lack of jobs in rural areas', 'Too many schools in rural areas', 'Too much money in rural areas', 'Boredom'], 'Lack of jobs in rural areas', 'easy'),
  obj('The headquarters of the United Nations (UN) is located in:', ['London', 'Paris', 'New York', 'Geneva'], 'New York', 'hard'),
  obj('Which month does Ghana celebrate its Independence Day?', ['March', 'April', 'May', 'July'], 'March', 'easy')
];

const owopSubj = [
  subj('Define rural-urban migration. State three causes and two effects of this type of migration.', 15),
  subj('What is environmental degradation? Suggest three ways to protect the environment in your community.', 10),
  subj('List four rights and four responsibilities of a Ghanaian citizen.', 10),
  subj('Explain the term "Population". State three effects of rapid population growth on a country.', 10),
  subj('Discuss the importance of the National Constitution in a democratic country like Ghana.', 10)
];

const owopExam = buildExam({
  title: 'Basic 6 Our World Our People — Complete Exact Questions Challenge',
  desc: 'End of Term Exam covering Migration, Population, and Citizenship, with 40 unique questions.',
  classLevel: 'Basic 6',
  subjectName: 'Our World Our People',
  mins: 60,
  objQ: owopObj,
  subjQ: owopSubj
});

async function seed() {
  console.log('🎓 Seeding EXACT Basic 6 Term 3 Our World Our People Exam...\n');

  const { data: subjects, error: subjErr } = await supabase.from('subjects').select('id, name');
  if (subjErr) {
    console.error('Error fetching subjects:', subjErr);
    return;
  }

  process.stdout.write(`📝 Inserting: ${owopExam.title}... `);
  
  const baseName = owopExam.content.subject_name;
  const matchedSubject = subjects.find(s => s.name.includes(baseName) && s.name.includes('G6')) 
    || subjects.find(s => s.name.includes(baseName));
    
  if (matchedSubject) {
    owopExam.subject_id = matchedSubject.id;
  }

  const { error } = await supabase.from('global_quizzes').insert(owopExam);
  if (error) {
    console.log(`❌ Error: ${error.message}`);
  } else {
    console.log(`✅ Success! (Sec A: 40 obj, Sec B: 5 subj)`);
  }
}

seed();
