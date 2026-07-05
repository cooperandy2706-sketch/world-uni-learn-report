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
// SCIENCE - 40 Exact Objective Questions + 5 Subjective
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
  obj('The process by which water vapor turns into liquid water is called:', ['Evaporation', 'Condensation', 'Precipitation', 'Sublimation'], 'Condensation', 'medium'),
  obj('What is the main source of energy for the earth?', ['The Moon', 'The Stars', 'The Sun', 'Fossil Fuels'], 'The Sun', 'easy'),
  obj('Which part of a plant absorbs water and minerals from the soil?', ['Leaves', 'Stem', 'Roots', 'Flowers'], 'Roots', 'easy'),
  obj('Animals that eat both plants and meat are called:', ['Herbivores', 'Carnivores', 'Omnivores', 'Insectivores'], 'Omnivores', 'easy'),
  obj('Which of the following materials is a good conductor of electricity?', ['Wood', 'Plastic', 'Copper', 'Glass'], 'Copper', 'easy'),
  obj('The breaking down of rocks into smaller particles is known as:', ['Erosion', 'Weathering', 'Deposition', 'Volcanism'], 'Weathering', 'medium'),
  obj('Which of the following is NOT a state of matter?', ['Solid', 'Liquid', 'Gas', 'Energy'], 'Energy', 'easy'),
  obj('Water freezes at what temperature (in Celsius)?', ['100°C', '0°C', '50°C', '-100°C'], '0°C', 'easy'),
  obj('Which organ in the human body is responsible for pumping blood?', ['Brain', 'Lungs', 'Heart', 'Liver'], 'Heart', 'easy'),
  obj('The force that opposes motion between two surfaces that are touching is called:', ['Gravity', 'Friction', 'Magnetism', 'Buoyancy'], 'Friction', 'medium'),
  obj('Which planet is closest to the Sun?', ['Venus', 'Earth', 'Mercury', 'Mars'], 'Mercury', 'easy'),
  obj('What do we call the process where plants lose water through their leaves?', ['Photosynthesis', 'Respiration', 'Transpiration', 'Perspiration'], 'Transpiration', 'hard'),
  obj('Which of the following is a magnetic material?', ['Aluminum', 'Copper', 'Iron', 'Gold'], 'Iron', 'medium'),
  obj('The green pigment in plants that is essential for photosynthesis is:', ['Chloroplast', 'Chlorophyll', 'Melanin', 'Hemoglobin'], 'Chlorophyll', 'medium'),
  obj('Which gas is most abundant in the Earth\'s atmosphere?', ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Hydrogen'], 'Nitrogen', 'hard'),
  obj('What type of energy is stored in a battery?', ['Thermal energy', 'Kinetic energy', 'Chemical energy', 'Light energy'], 'Chemical energy', 'medium'),
  obj('The path that an electric current takes is called a:', ['Wire', 'Circuit', 'Switch', 'Battery'], 'Circuit', 'easy'),
  obj('Which of the following is an example of a simple machine?', ['A car', 'A computer', 'A lever', 'A television'], 'A lever', 'easy'),
  obj('What happens to a liquid when it is heated to its boiling point?', ['It freezes', 'It becomes a solid', 'It turns into a gas', 'It remains a liquid'], 'It turns into a gas', 'easy'),
  obj('Animals with a backbone are classified as:', ['Invertebrates', 'Vertebrates', 'Mammals', 'Reptiles'], 'Vertebrates', 'easy'),
  obj('Which of these is responsible for the Earth\'s day and night cycle?', ['The revolution of the Earth around the Sun', 'The rotation of the Earth on its axis', 'The movement of the Moon', 'The Sun moving across the sky'], 'The rotation of the Earth on its axis', 'medium'),
  obj('What is the term for an animal that is hunted and killed by another for food?', ['Predator', 'Prey', 'Scavenger', 'Producer'], 'Prey', 'easy'),
  obj('Which of the following is a non-renewable energy source?', ['Wind', 'Solar', 'Coal', 'Geothermal'], 'Coal', 'medium'),
  obj('Sound travels fastest through which of the following?', ['A vacuum', 'Air', 'Water', 'Steel'], 'Steel', 'hard'),
  obj('What is the outer layer of the Earth called?', ['Mantle', 'Core', 'Crust', 'Magma'], 'Crust', 'medium'),
  obj('Which of these human activities contributes to soil erosion?', ['Planting trees', 'Deforestation', 'Recycling', 'Using compost'], 'Deforestation', 'medium'),
  obj('A mixture of sand and water can be separated by:', ['Filtration', 'Magnetism', 'Evaporation', 'Condensation'], 'Filtration', 'medium'),
  obj('Which vitamin is produced in the human body when exposed to sunlight?', ['Vitamin A', 'Vitamin B', 'Vitamin C', 'Vitamin D'], 'Vitamin D', 'medium'),
  obj('The change of state from a gas directly to a solid is called:', ['Evaporation', 'Sublimation', 'Deposition', 'Melting'], 'Deposition', 'hard'),
  obj('Which of the following causes malaria?', ['A virus', 'A bacterium', 'A plasmodium parasite', 'A fungus'], 'A plasmodium parasite', 'hard'),
  obj('What is the function of the human skeletal system?', ['To pump blood', 'To digest food', 'To support and protect the body', 'To breathe air'], 'To support and protect the body', 'easy')
];

const sciSubj = [
  subj('Explain the difference between a reversible and an irreversible change, giving two examples of each.', 10),
  subj('Describe the solar system. Name the eight planets in order from the sun.', 10),
  subj('What is friction? State two advantages and two disadvantages of friction.', 10),
  subj('Draw a simple food chain involving a plant, a grasshopper, a frog, and a snake. Identify the producer and the consumers.', 10),
  subj('Define the terms "rotation" and "revolution" as they apply to the Earth, and state the effect of each on our planet.', 10)
];

const sciExam = buildExam({
  title: 'Basic 6 Integrated Science — Complete Exact Questions Challenge',
  desc: 'End of Term Exam covering Earth & Space, Forces, and Changes in Matter, with 40 unique questions.',
  classLevel: 'Basic 6',
  subjectName: 'Integrated Science',
  mins: 90,
  objQ: sciObj,
  subjQ: sciSubj
});

async function seed() {
  console.log('🎓 Seeding EXACT Basic 6 Term 3 Science Exam...\n');

  const { data: subjects, error: subjErr } = await supabase.from('subjects').select('id, name');
  if (subjErr) {
    console.error('Error fetching subjects:', subjErr);
    return;
  }

  process.stdout.write(`📝 Inserting: ${sciExam.title}... `);
  
  const baseName = sciExam.content.subject_name;
  const matchedSubject = subjects.find(s => s.name.includes(baseName) && s.name.includes('G6')) 
    || subjects.find(s => s.name.includes(baseName));
    
  if (matchedSubject) {
    sciExam.subject_id = matchedSubject.id;
  }

  const { error } = await supabase.from('global_quizzes').insert(sciExam);
  if (error) {
    console.log(`❌ Error: ${error.message}`);
  } else {
    console.log(`✅ Success! (Sec A: 40 obj, Sec B: 5 subj)`);
  }
}

seed();
