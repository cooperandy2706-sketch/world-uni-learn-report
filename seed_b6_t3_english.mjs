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
// ENGLISH LANGUAGE - 40 Exact Objective Questions + 5 Subjective
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
  obj('Which word is a conjunction?', ['Run', 'Because', 'Happy', 'Quickly'], 'Because', 'easy'),
  obj('Choose the word that is an adjective in this sentence: "The big dog barked loudly."', ['The', 'big', 'dog', 'barked'], 'big', 'easy'),
  obj('What is the past tense of the verb "Go"?', ['Goed', 'Going', 'Went', 'Gone'], 'Went', 'easy'),
  obj('What is the plural of the word "Mouse"?', ['Mouses', 'Mice', 'Meese', 'Mouse'], 'Mice', 'medium'),
  obj('Fill in the blank: The boys _____ playing football yesterday.', ['is', 'are', 'was', 'were'], 'were', 'medium'),
  obj('Which of the following is a noun?', ['Quickly', 'Beautiful', 'Happiness', 'Run'], 'Happiness', 'medium'),
  obj('Select the antonym for "Generous".', ['Kind', 'Selfish', 'Helpful', 'Happy'], 'Selfish', 'medium'),
  obj('Identify the subject in the sentence: "The blue bird sang a sweet song."', ['sang', 'sweet song', 'The blue bird', 'blue'], 'The blue bird', 'medium'),
  obj('Which word is spelled correctly?', ['Accomodation', 'Acommodation', 'Accommodation', 'Acomodation'], 'Accommodation', 'hard'),
  obj('What does the idiom "A piece of cake" mean?', ['A slice of dessert', 'Something very easy to do', 'A difficult task', 'A birthday party'], 'Something very easy to do', 'easy'),
  obj('Fill in the blank: I have been waiting here _____ two hours.', ['since', 'for', 'from', 'about'], 'for', 'medium'),
  obj('Which sentence is grammatically correct?', ['He don\'t know the answer.', 'He doesn\'t knows the answer.', 'He doesn\'t know the answer.', 'He not know the answer.'], 'He doesn\'t know the answer.', 'hard'),
  obj('What is the comparative form of "Good"?', ['Gooder', 'Better', 'Best', 'More good'], 'Better', 'easy'),
  obj('Fill in the blank: The book belongs to John. It is _____ book.', ['he\'s', 'him', 'his', 'her'], 'his', 'easy'),
  obj('Identify the tense: "I will be traveling to Accra tomorrow."', ['Simple Past', 'Present Continuous', 'Future Continuous', 'Simple Future'], 'Future Continuous', 'hard'),
  obj('Which of these words is a pronoun?', ['Chair', 'Run', 'They', 'Quickly'], 'They', 'easy'),
  obj('What is the prefix in the word "Unhappy"?', ['Un', 'happy', 'hap', 'y'], 'Un', 'easy'),
  obj('Choose the correct word: The cat licked _____ paw.', ['it\'s', 'its', 'its\'', 'it'], 'its', 'hard'),
  obj('Which of the following is a declarative sentence?', ['Stop right there!', 'Did you finish your homework?', 'I enjoy reading books.', 'What a beautiful day!'], 'I enjoy reading books.', 'medium'),
  obj('What does the prefix "Re-" mean in the word "Rewrite"?', ['Not', 'Before', 'Again', 'After'], 'Again', 'easy'),
  obj('Fill in the blank: She is the _____ girl in the class.', ['tall', 'taller', 'tallest', 'more tall'], 'tallest', 'easy'),
  obj('Identify the verb in the sentence: "The baby cried all night."', ['The', 'baby', 'cried', 'all'], 'cried', 'easy'),
  obj('Which word is a synonym for "Start"?', ['End', 'Finish', 'Begin', 'Stop'], 'Begin', 'easy'),
  obj('What is the plural of "Child"?', ['Childs', 'Childrens', 'Children', 'Childes'], 'Children', 'easy'),
  obj('Fill in the blank: _____ you like a cup of tea?', ['Would', 'Do', 'Are', 'Have'], 'Would', 'easy'),
  obj('Identify the preposition in the sentence: "He hid behind the door."', ['He', 'hid', 'behind', 'door'], 'behind', 'medium'),
  obj('Which sentence uses punctuation correctly?', ['I like apples oranges and bananas.', 'I like apples, oranges, and bananas.', 'I like apples, oranges and, bananas.', 'I like, apples oranges and bananas.'], 'I like apples, oranges, and bananas.', 'medium'),
  obj('What is the antonym of "Expand"?', ['Grow', 'Increase', 'Shrink', 'Enlarge'], 'Shrink', 'medium'),
  obj('Choose the correct option: The news _____ not good.', ['are', 'is', 'were', 'am'], 'is', 'hard'),
  obj('Which word is an abstract noun?', ['Table', 'Love', 'Dog', 'Water'], 'Love', 'hard'),
  obj('What is the meaning of the word "Brave"?', ['Cowardly', 'Scared', 'Courageous', 'Weak'], 'Courageous', 'easy')
];

const engSubj = [
  subj('Write a formal letter to the headteacher of your school requesting a new library book.', 15),
  subj('Write a descriptive essay of about 150 words on "My Favourite Festival".', 15),
  subj('Change the following sentences from active to passive voice:\n1. The dog chased the cat.\n2. Mary baked a delicious cake.', 10),
  subj('Read the provided passage on "Environmental Cleanliness" and summarize the main points in three sentences.', 10),
  subj('Explain the meaning of the following idioms and use each in a sentence:\n1. A piece of cake\n2. Under the weather', 10)
];

const engExam = buildExam({
  title: 'Basic 6 English Language — Complete Exact Questions Challenge',
  desc: 'Comprehensive Term 3 Exam covering Grammar, Speech, and Composition, with 40 unique questions.',
  classLevel: 'Basic 6',
  subjectName: 'English Language',
  mins: 90,
  objQ: engObj,
  subjQ: engSubj
});

async function seed() {
  console.log('🎓 Seeding EXACT Basic 6 Term 3 English Exam...\n');

  const { data: subjects, error: subjErr } = await supabase.from('subjects').select('id, name');
  if (subjErr) {
    console.error('Error fetching subjects:', subjErr);
    return;
  }

  process.stdout.write(`📝 Inserting: ${engExam.title}... `);
  
  const baseName = engExam.content.subject_name;
  const matchedSubject = subjects.find(s => s.name.includes(baseName) && s.name.includes('G6')) 
    || subjects.find(s => s.name.includes(baseName));
    
  if (matchedSubject) {
    engExam.subject_id = matchedSubject.id;
  }

  const { error } = await supabase.from('global_quizzes').insert(engExam);
  if (error) {
    console.log(`❌ Error: ${error.message}`);
  } else {
    console.log(`✅ Success! (Sec A: 40 obj, Sec B: 5 subj)`);
  }
}

seed();
