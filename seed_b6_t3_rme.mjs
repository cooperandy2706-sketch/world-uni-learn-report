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
// RELIGIOUS AND MORAL EDUCATION (RME) - 40 Exact Objective Questions
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
  obj('Which of these is a moral value?', ['Stealing', 'Lying', 'Truthfulness', 'Cheating'], 'Truthfulness', 'easy'),
  obj('What is the main purpose of punishment?', ['To cause pain', 'To correct bad behavior', 'To show power', 'To make someone cry'], 'To correct bad behavior', 'easy'),
  obj('The Islamic fast during the month of Ramadan is called:', ['Zakat', 'Hajj', 'Sawm', 'Shahada'], 'Sawm', 'medium'),
  obj('Which religion uses the Bible as its Holy Book?', ['Islam', 'Christianity', 'Hinduism', 'Traditional Religion'], 'Christianity', 'easy'),
  obj('Who is the founder of Islam?', ['Jesus Christ', 'Prophet Muhammad (SAW)', 'Moses', 'Abraham'], 'Prophet Muhammad (SAW)', 'easy'),
  obj('In Traditional African Religion, God is often referred to as:', ['Allah', 'Jehovah', 'The Supreme Being', 'The Ancestor'], 'The Supreme Being', 'medium'),
  obj('Which of the following is a way to show respect to elders?', ['Shouting at them', 'Ignoring them', 'Offering them a seat', 'Calling them by their first names'], 'Offering them a seat', 'easy'),
  obj('The parable of the Prodigal Son teaches about:', ['Hard work', 'Forgiveness', 'Farming', 'Traveling'], 'Forgiveness', 'medium'),
  obj('Which of the following breaks the law of God in most religions?', ['Praying', 'Stealing', 'Fasting', 'Singing'], 'Stealing', 'easy'),
  obj('What is the place of worship for Muslims called?', ['Church', 'Shrine', 'Mosque', 'Temple'], 'Mosque', 'easy'),
  obj('A person who dies for their faith is called a:', ['Prophet', 'Martyr', 'Priest', 'Imam'], 'Martyr', 'hard'),
  obj('Which of the following is a benefit of hard work?', ['Poverty', 'Laziness', 'Success', 'Sickness'], 'Success', 'easy'),
  obj('The holy day of worship for Christians is generally:', ['Friday', 'Saturday', 'Sunday', 'Monday'], 'Sunday', 'easy'),
  obj('What is a shrine?', ['A place of Christian worship', 'A place of Islamic worship', 'A sacred place in Traditional Religion', 'A marketplace'], 'A sacred place in Traditional Religion', 'medium'),
  obj('Which of the following is NOT a good moral habit?', ['Honesty', 'Punctuality', 'Truancy', 'Obedience'], 'Truancy', 'medium'),
  obj('The Christian festival that celebrates the birth of Jesus is:', ['Easter', 'Christmas', 'Pentecost', 'Good Friday'], 'Christmas', 'easy'),
  obj('Which Islamic festival marks the end of Ramadan?', ['Eid al-Adha', 'Eid al-Fitr', 'Mawlid', 'Ashura'], 'Eid al-Fitr', 'hard'),
  obj('An extended family includes:', ['Only parents and children', 'Only grandparents', 'Parents, children, and other relatives', 'Only friends'], 'Parents, children, and other relatives', 'easy'),
  obj('Why is greeting important in Ghanaian culture?', ['It is a waste of time', 'It shows respect and friendliness', 'It causes trouble', 'It is a punishment'], 'It shows respect and friendliness', 'easy'),
  obj('Which of the following destroys a community?', ['Cooperation', 'Love', 'Conflict', 'Unity'], 'Conflict', 'easy'),
  obj('Who was swallowed by a great fish according to the Bible?', ['David', 'Jonah', 'Moses', 'Peter'], 'Jonah', 'medium'),
  obj('The practice of marrying only one wife is called:', ['Polygamy', 'Monogamy', 'Polyandry', 'Bigamy'], 'Monogamy', 'medium'),
  obj('In the Bible, who led the Israelites out of Egypt?', ['Abraham', 'Joseph', 'Moses', 'Joshua'], 'Moses', 'easy'),
  obj('Which of the following is a duty of a child in the family?', ['Paying school fees', 'Buying food for the house', 'Obeying parents', 'Building a house'], 'Obeying parents', 'easy'),
  obj('The belief in many gods is called:', ['Monotheism', 'Polytheism', 'Atheism', 'Christianity'], 'Polytheism', 'hard'),
  obj('What should you do when you wrong someone?', ['Run away', 'Deny it', 'Apologize', 'Fight them'], 'Apologize', 'easy'),
  obj('Which of the following is considered sacred in Traditional Religion?', ['Rivers and certain trees', 'Cars', 'Mobile phones', 'Televisions'], 'Rivers and certain trees', 'medium'),
  obj('A person who does not believe in the existence of God is an:', ['Animist', 'Atheist', 'Agnostic', 'Apostle'], 'Atheist', 'hard'),
  obj('The Ten Commandments were given to Moses on Mount:', ['Zion', 'Carmel', 'Sinai', 'Moriah'], 'Sinai', 'medium'),
  obj('Which of the following promotes environmental cleanliness?', ['Littering', 'Deforestation', 'Proper waste disposal', 'Bush burning'], 'Proper waste disposal', 'easy'),
  obj('Patience is a virtue that helps us to:', ['Rush into things', 'Wait calmly for the right time', 'Get angry quickly', 'Give up immediately'], 'Wait calmly for the right time', 'medium')
];

const rmeSubj = [
  subj('Explain the concept of "Peaceful Co-existence". State three ways it can be promoted in a school.', 10),
  subj('What is the difference between a reward and a punishment? Give two examples of each in a school setting.', 10),
  subj('Define "Commitment". Why is it important for a student to be committed to their studies?', 10),
  subj('Discuss one moral teaching from any of the three main religions in Ghana that promotes love for one\'s neighbor.', 10),
  subj('State four benefits of living in harmony with people of different religious backgrounds.', 10)
];

const rmeExam = buildExam({
  title: 'Basic 6 RME — Complete Exact Questions Challenge',
  desc: 'End of Term Exam on Reward & Punishment, Commitment, and Peaceful Co-existence, with 40 unique questions.',
  classLevel: 'Basic 6',
  subjectName: 'Religious and Moral Education',
  mins: 60,
  objQ: rmeObj,
  subjQ: rmeSubj
});

async function seed() {
  console.log('🎓 Seeding EXACT Basic 6 Term 3 RME Exam...\n');

  const { data: subjects, error: subjErr } = await supabase.from('subjects').select('id, name');
  if (subjErr) {
    console.error('Error fetching subjects:', subjErr);
    return;
  }

  process.stdout.write(`📝 Inserting: ${rmeExam.title}... `);
  
  const baseName = rmeExam.content.subject_name;
  const matchedSubject = subjects.find(s => s.name.includes(baseName) && s.name.includes('G6')) 
    || subjects.find(s => s.name.includes(baseName));
    
  if (matchedSubject) {
    rmeExam.subject_id = matchedSubject.id;
  }

  const { error } = await supabase.from('global_quizzes').insert(rmeExam);
  if (error) {
    console.log(`❌ Error: ${error.message}`);
  } else {
    console.log(`✅ Success! (Sec A: 40 obj, Sec B: 5 subj)`);
  }
}

seed();
