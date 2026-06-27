// seed_waec_basic6_more_complex.mjs
// More Complex WAEC-style Mock Exams for Basic 6 (Science & Mathematics)
// 40 objectives + 10 subjectives (pick 5)

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jltlnzjqhzsqpmhcpczl.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsdGxuempxaHpzcXBtaGNwY3psIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM2ODEwMSwiZXhwIjoyMDg4OTQ0MTAxfQ.oVDVXnC2LO49sYfc_dxxJStrW0VGH5sUvkUB64vXqzo';

const supabase = createClient(supabaseUrl, supabaseKey, { auth: { autoRefreshToken: false, persistSession: false } });

let _qid = 0;
const qid = () => `b6more_q${++_qid}_${Math.random().toString(36).slice(2, 7)}`;
const obj = (text, options, correctAnswer, diff = 'hard') => ({ id: qid(), type: 'objective', text, options, correctAnswer, diff });
const subj = (text, marks = 20, hint = '') => ({ id: qid(), type: 'subjective', text, marks, hint });

// ═════════════════════════════════════════════════════════════════════
// EXAM: Basic 6 Science (Complex)
// ═════════════════════════════════════════════════════════════════════
const B6_SCI_ADV_OBJ = [
  obj('Which process involves a change from a solid directly to a gas without becoming a liquid?', ['Evaporation', 'Condensation', 'Sublimation', 'Melting'], 'Sublimation'),
  obj('If a plant is placed in a dark cupboard for a week, what will be the most noticeable change?', ['Its leaves will turn dark green', 'It will grow faster', 'Its leaves will turn yellow and wilt due to lack of photosynthesis', 'Its roots will grow upwards'], 'Its leaves will turn yellow and wilt due to lack of photosynthesis'),
  obj('Which of the following describes the difference between weight and mass?', ['Mass is a force, weight is not', 'Weight changes with gravity, mass remains constant everywhere', 'They are exactly the same thing', 'Mass is measured in Newtons, weight in Kilograms'], 'Weight changes with gravity, mass remains constant everywhere'),
  obj('During a solar eclipse, what is the arrangement of the celestial bodies?', ['Sun - Earth - Moon', 'Earth - Sun - Moon', 'Sun - Moon - Earth', 'Moon - Sun - Earth'], 'Sun - Moon - Earth'),
  obj('Which component of blood is primarily responsible for fighting infections?', ['Red blood cells', 'Platelets', 'White blood cells', 'Plasma'], 'White blood cells'),
  obj('A lever has the fulcrum located exactly between the effort and the load. This is an example of a:', ['First-class lever', 'Second-class lever', 'Third-class lever', 'Fourth-class lever'], 'First-class lever'),
  obj('When you dissolve salt in water, what is the solvent?', ['The salt', 'The water', 'The mixture', 'The heat applied'], 'The water'),
  obj('Which of the following is a non-renewable source of energy?', ['Wind', 'Solar', 'Natural Gas', 'Geothermal'], 'Natural Gas'),
  obj('What gas do humans exhale as a waste product of respiration?', ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Helium'], 'Carbon dioxide'),
  obj('In the food chain "Grass -> Grasshopper -> Frog -> Snake -> Hawk", which organism is a secondary consumer?', ['Grasshopper', 'Frog', 'Snake', 'Hawk'], 'Frog'),
  obj('A material that completely blocks light from passing through it is described as:', ['Transparent', 'Translucent', 'Opaque', 'Luminous'], 'Opaque'),
  obj('What is the function of the "Stomata" on a leaf?', ['To absorb water from the rain', 'To exchange gases (oxygen and carbon dioxide) with the environment', 'To trap insects', 'To produce seeds'], 'To exchange gases (oxygen and carbon dioxide) with the environment'),
  obj('Which type of tooth is specialized for grinding and crushing food?', ['Incisors', 'Canines', 'Premolars', 'Molars'], 'Molars'),
  obj('If you bring the North pole of one magnet near the North pole of another, they will:', ['Attract', 'Repel', 'Create a spark', 'Do nothing'], 'Repel'),
  obj('What property of light causes a straw in a glass of water to look bent?', ['Reflection', 'Refraction', 'Absorption', 'Dispersion'], 'Refraction'),
  obj('Which vitamin is synthesized by the human body when the skin is exposed to sunlight?', ['Vitamin A', 'Vitamin C', 'Vitamin D', 'Vitamin E'], 'Vitamin D'),
  obj('Water boils at 100°C. What happens to its temperature if you keep heating it after it boils?', ['It increases to 200°C', 'It remains constant at 100°C while changing into steam', 'It decreases', 'It resets to 0°C'], 'It remains constant at 100°C while changing into steam'),
  obj('Which organ is primarily responsible for filtering waste from the blood to produce urine?', ['Liver', 'Heart', 'Kidneys', 'Stomach'], 'Kidneys'),
  obj('The process by which pollen is transferred from the anther to the stigma of a flower is called:', ['Germination', 'Fertilization', 'Pollination', 'Dispersal'], 'Pollination'),
  obj('A chemical change is characterized by:', ['A change in shape or size only', 'The formation of a new substance with different properties', 'A substance melting', 'Sugar dissolving in water'], 'The formation of a new substance with different properties'),
  obj('Which planet in our solar system is known for its prominent, complex ring system?', ['Mars', 'Jupiter', 'Saturn', 'Neptune'], 'Saturn'),
  obj('Which force slows down the movement of a box sliding across a rough floor?', ['Gravity', 'Magnetism', 'Friction', 'Tension'], 'Friction'),
  obj('An instrument used to measure the pressure of the atmosphere is a:', ['Thermometer', 'Barometer', 'Anemometer', 'Hygrometer'], 'Barometer'),
  obj('The structural and functional unit of all living organisms is the:', ['Tissue', 'Organ', 'Cell', 'Organ system'], 'Cell'),
  obj('Which part of the seed stores food for the growing embryo before leaves form?', ['Seed coat / Testa', 'Radicle', 'Cotyledon', 'Plumule'], 'Cotyledon'),
  obj('Sound travels fastest through which of the following mediums?', ['Air', 'Water', 'A vacuum', 'Solid steel'], 'Solid steel'),
  obj('If a substance has a pH of 2, it is considered:', ['A strong base', 'Neutral', 'A strong acid', 'A weak base'], 'A strong acid'),
  obj('Which of the following human activities is a major contributor to the Greenhouse Effect?', ['Planting trees', 'Riding bicycles', 'Burning fossil fuels', 'Using solar panels'], 'Burning fossil fuels'),
  obj('Which part of the human eye acts like a camera lens to focus light?', ['The retina', 'The cornea / lens', 'The optic nerve', 'The pupil'], 'The cornea / lens'),
  obj('A circuit where the electrical current has multiple paths to flow through is called a:', ['Series circuit', 'Parallel circuit', 'Open circuit', 'Short circuit'], 'Parallel circuit'),
  obj('The Earth\'s rotation on its axis causes:', ['The four seasons', 'Eclipses', 'Day and night', 'Tides'], 'Day and night'),
  obj('Which gas makes up the majority of the Earth\'s atmosphere?', ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Argon'], 'Nitrogen'),
  obj('A parasite is an organism that:', ['Makes its own food', 'Eats only dead matter', 'Lives on or in a host and harms it', 'Helps other animals survive'], 'Lives on or in a host and harms it'),
  obj('What is the function of the bile produced by the liver?', ['To digest proteins', 'To break down large fat globules into smaller droplets (emulsification)', 'To absorb water', 'To kill bacteria in the stomach'], 'To break down large fat globules into smaller droplets (emulsification)'),
  obj('Which form of energy is stored in a battery?', ['Kinetic energy', 'Thermal energy', 'Chemical potential energy', 'Sound energy'], 'Chemical potential energy'),
  obj('Which of the following is NOT an arthropod?', ['Spider', 'Crab', 'Earthworm', 'Butterfly'], 'Earthworm'),
  obj('When iron reacts with oxygen and water, it forms rust. Rusting is an example of:', ['Oxidation', 'Reduction', 'Evaporation', 'Sublimation'], 'Oxidation'),
  obj('Which blood vessels carry oxygenated blood AWAY from the heart? (except pulmonary)', ['Veins', 'Capillaries', 'Arteries', 'Vena Cava'], 'Arteries'),
  obj('The process of separating an insoluble solid from a liquid using a porous barrier (like paper) is called:', ['Distillation', 'Evaporation', 'Filtration', 'Decantation'], 'Filtration'),
  obj('Which human sense is controlled by the olfactory nerve?', ['Sight', 'Hearing', 'Taste', 'Smell'], 'Smell'),
];

const B6_SCI_ADV_SUBJ = [
  subj('(a) Distinguish between a physical change and a chemical change.\n(b) Classify the following as either physical or chemical changes:\n    (i) Burning a piece of paper\n    (ii) Melting an ice block\n    (iii) Baking a cake\n    (iv) Tearing a piece of paper into small pieces.', 20, 'Physical: no new substance. Chemical: new substance formed.'),
  subj('(a) What is a food web?\n(b) Construct a simple food web consisting of a plant, a caterpillar, a mouse, a small bird, and a hawk.\n(c) What would happen to your food web if all the plants died from a drought?', 20, 'A food web is interconnected food chains. The whole web would collapse without producers.'),
  subj('(a) Define the term "Friction".\n(b) State TWO advantages of friction in everyday life.\n(c) State TWO disadvantages of friction and suggest ONE way friction can be reduced in a machine.', 20, 'Advantages: walking, braking. Disadvantages: wear and tear, heat. Reduce by lubrication.'),
  subj('(a) Describe the process of Photosynthesis. Write down the word equation for it.\n(b) State THREE conditions necessary for photosynthesis to take place in green plants.\n(c) Explain how animals indirectly depend on photosynthesis.', 20, 'Equation: Carbon dioxide + Water -> Glucose + Oxygen. Conditions: Light, Chlorophyll, CO2.'),
  subj('(a) Draw a well-labelled diagram of a typical flower showing at least SIX parts.\n(b) State the function of the Anther and the Ovary.', 20, 'Include: petals, sepals, stamen (anther, filament), pistil (stigma, style, ovary).'),
  subj('(a) Differentiate between communicable (infectious) and non-communicable diseases. Give ONE example of each.\n(b) What is a vector in terms of disease spread? Give ONE example of a vector and the disease it transmits.\n(c) Suggest TWO ways a community can prevent the spread of mosquito-borne diseases.', 20, 'Communicable: spread from person to person (e.g. Malaria, Flu). Vector: carries disease (Mosquito -> Malaria).'),
  subj('(a) What is the Water Cycle?\n(b) Explain the role of the sun in the water cycle.\n(c) Describe the processes of Condensation and Precipitation.', 20, 'The continuous movement of water. Sun provides energy for evaporation.'),
  subj('(a) What is meant by a "Balanced Diet"?\n(b) Name the SIX main classes of food nutrients.\n(c) Choose any TWO nutrients you named, state their function in the body, and give ONE food source for each.', 20, 'Carbohydrates, Proteins, Fats, Vitamins, Minerals, Water.'),
  subj('(a) Describe how sound is produced.\n(b) Explain why sound can travel through a solid wall but cannot travel through a vacuum (empty space in space).\n(c) What is an echo?', 20, 'Sound is produced by vibrations. It needs a medium (particles) to travel.'),
  subj('(a) Identify the three states of matter and state ONE property of each regarding their shape and volume.\n(b) Explain what happens to the particles of a solid block of ice as it is heated until it becomes steam.', 20, 'Solid (fixed shape/vol), Liquid (fixed vol, takes container shape), Gas (takes shape/vol of container). Heat makes particles move faster and spread apart.'),
];

// ═════════════════════════════════════════════════════════════════════
// EXAM: Basic 6 Mathematics (Complex)
// ═════════════════════════════════════════════════════════════════════
const B6_MATH_ADV_OBJ = [
  obj('Evaluate: 14 + 6 × 2 - 8 ÷ 4. (Remember BODMAS)', ['9', '24', '38', '20'], '24'),
  obj('What is the place value of the digit 7 in the number 3,472,105?', ['Ten thousands', 'Ten millions', 'Thousands', 'Hundred thousands'], 'Ten thousands'),
  obj('Express 0.125 as a fraction in its simplest form.', ['1/8', '1/4', '125/1000', '1/5'], '1/8'),
  obj('If 3/4 of a number is 24, what is the number?', ['18', '32', '36', '48'], '32'),
  obj('A car travels at a constant speed of 80 km/h. How far will it travel in 2 hours and 45 minutes?', ['200 km', '210 km', '220 km', '240 km'], '220 km'),
  obj('Find the Lowest Common Multiple (LCM) of 12, 15, and 20.', ['60', '120', '300', '600'], '60'),
  obj('What is the Highest Common Factor (HCF) of 36, 54, and 72?', ['9', '18', '12', '36'], '18'),
  obj('If x + 15 = 3x - 5, what is the value of x?', ['5', '10', '15', '20'], '10'),
  obj('A rectangular garden has an area of 144 m². If its length is 16 m, what is its perimeter?', ['25 m', '50 m', '72 m', '100 m'], '50 m'),
  obj('Calculate the area of a triangle with a base of 15 cm and a perpendicular height of 8 cm.', ['60 cm²', '120 cm²', '46 cm²', '30 cm²'], '60 cm²'),
  obj('A boy scored 18 out of 25 in a Maths test. What is his percentage score?', ['60%', '72%', '75%', '82%'], '72%'),
  obj('Simplify: 3(2a - b) - 2(a - 3b)', ['4a - 9b', '4a + 3b', '4a + 5b', '8a - 5b'], '4a + 3b'),
  obj('What is the median of the following set of numbers: 14, 8, 22, 16, 9, 12, 15?', ['12', '14', '15', '16'], '14'),
  obj('Find the value of 2⁴ × 3².', ['144', '48', '72', '216'], '144'),
  obj('A trader bought a bag for GH₵ 150 and sold it for GH₵ 180. Calculate the percentage profit.', ['15%', '20%', '25%', '30%'], '20%'),
  obj('Solve for y: 2(y + 3) = 14', ['4', '5', '7', '11'], '4'),
  obj('The sum of three consecutive odd numbers is 63. What is the smallest of these numbers?', ['17', '19', '21', '23'], '19'),
  obj('A cylindrical tank has a radius of 7 m and a height of 10 m. What is its volume? (Take π = 22/7)', ['154 m³', '440 m³', '1540 m³', '3080 m³'], '1540 m³'),
  obj('Which of the following numbers is both a perfect square and a perfect cube?', ['16', '64', '81', '125'], '64'),
  obj('If a = 3, b = -2, and c = 5, evaluate: ab² - c.', ['1', '7', '-17', '-7'], '7'),
  obj('Two angles of a triangle are 45° and 65°. What is the third angle?', ['70°', '80°', '90°', '110°'], '70°'),
  obj('What is the circumference of a circle with a diameter of 28 cm? (Take π = 22/7)', ['44 cm', '88 cm', '176 cm', '616 cm'], '88 cm'),
  obj('A recipe requires 2 cups of sugar for every 5 cups of flour. If you use 15 cups of flour, how many cups of sugar are needed?', ['4', '5', '6', '8'], '6'),
  obj('Calculate the simple interest on GH₵ 400 for 3 years at 5% per annum.', ['GH₵ 20', 'GH₵ 40', 'GH₵ 60', 'GH₵ 80'], 'GH₵ 60'),
  obj('What is the square root of 6.25?', ['0.25', '2.5', '25', '250'], '2.5'),
  obj('Write the number 45,000 in standard form (scientific notation).', ['4.5 × 10³', '45 × 10³', '4.5 × 10⁴', '0.45 × 10⁵'], '4.5 × 10⁴'),
  obj('A worker earns GH₵ 120 for 8 hours of work. How much will he earn for 14 hours of work at the same rate?', ['GH₵ 160', 'GH₵ 180', 'GH₵ 210', 'GH₵ 240'], 'GH₵ 210'),
  obj('Which polygon has exactly 8 sides?', ['Hexagon', 'Heptagon', 'Octagon', 'Nonagon'], 'Octagon'),
  obj('Solve the inequality: 3x - 4 < 11', ['x < 3', 'x < 5', 'x > 5', 'x < 15'], 'x < 5'),
  obj('What is the next number in the pattern: 2, 5, 10, 17, 26, ___?', ['35', '37', '39', '41'], '37'),
  obj('The mean of four numbers is 12. Three of the numbers are 8, 14, and 15. What is the fourth number?', ['9', '10', '11', '12'], '11'),
  obj('Expand and simplify: (x + 4)(x - 2)', ['x² - 8', 'x² + 2x - 8', 'x² - 2x - 8', 'x² + 6x - 8'], 'x² + 2x - 8'),
  obj('Convert 750 grams to kilograms.', ['0.075 kg', '0.75 kg', '7.5 kg', '75 kg'], '0.75 kg'),
  obj('A die is rolled once. What is the probability of obtaining a prime number?', ['1/6', '1/3', '1/2', '2/3'], '1/2'),
  obj('What is the complement of an angle measuring 37°?', ['53°', '143°', '323°', '127°'], '53°'),
  obj('How many lines of symmetry does a regular pentagon have?', ['1', '3', '5', 'Infinite'], '5'),
  obj('The interior angle of a regular polygon is 120°. How many sides does it have?', ['5', '6', '8', '10'], '6'),
  obj('A watch loses 2 minutes every hour. If it is set correctly at 8:00 AM, what time will it show at 1:00 PM the same day?', ['12:50 PM', '1:00 PM', '1:10 PM', '12:58 PM'], '12:50 PM'),
  obj('A piece of string is 4.8 meters long. It is cut into 12 equal pieces. How long is each piece in centimeters?', ['4 cm', '40 cm', '0.4 cm', '400 cm'], '40 cm'),
  obj('Which ratio is equivalent to 3:5?', ['6:15', '9:25', '12:20', '15:30'], '12:20'),
];

const B6_MATH_ADV_SUBJ = [
  subj('(a) Evaluate: (3/4 + 1/3) ÷ (2 - 1/6)\n(b) A man gave 1/3 of his money to his wife, 1/4 to his son, and kept the remaining GH₵ 500. How much money did he have initially?', 20, 'Use BODMAS. Find the fraction remaining first, then equate to 500.'),
  subj('(a) Solve the simultaneous equations:\n    2x + y = 10\n    3x - 2y = 1\n(b) Ama is 5 years older than Kofi. If the sum of their ages is 29, find their ages.', 20, 'Use substitution or elimination. Let Kofi be x, Ama be x + 5.'),
  subj('(a) A rectangular tank is 2.5 m long, 1.2 m wide, and 1.5 m high. Calculate its volume in cubic meters (m³).\n(b) If 1 m³ holds 1000 litres of water, how many litres of water can the tank hold when full?\n(c) The tank is currently 60% full. How many MORE litres are needed to fill it?', 20, 'Volume = l × w × h. Convert to litres. Find 40% of the total capacity.'),
  subj('(a) The marks obtained by 10 students in a math test are: 5, 8, 7, 9, 5, 4, 8, 5, 6, 9.\n    (i) Find the mean mark.\n    (ii) Find the median mark.\n    (iii) Find the modal mark.\n(b) A student is chosen at random. What is the probability that the student scored more than 6?', 20, 'Mean = sum / count. Median requires sorting. Probability = favourable / total.'),
  subj('(a) A car was bought for GH₵ 25,000. It depreciates (loses value) at a rate of 10% each year. Calculate its value after 2 years.\n(b) A businessman imported goods worth $4,000. If the exchange rate is $1 = GH₵ 12.50, calculate the value of the goods in Ghana Cedis. If he pays a 15% import duty, calculate his total cost in Ghana Cedis.', 20, 'Depreciation: find 10%, subtract, then find 10% of the NEW value. Duty = 15% of cost.'),
  subj('(a) Draw a Cartesian plane (x and y axes). Plot the following points: A(1, 1), B(5, 1), C(5, 4), and D(1, 4).\n(b) Join the points in alphabetical order and D to A. What specific shape is formed?\n(c) Calculate the area and perimeter of the shape formed.', 20, 'The shape is a rectangle. Distance between points gives length and width.'),
  subj('(a) Make x the subject of the formula: y = (2x - 3) / (x + 1)\n(b) Solve the inequality and represent the solution on a number line: 4(x - 2) < 2x + 6', 20, 'Cross-multiply for the subject formula, then factorize x. Solve inequality normally.'),
  subj('(a) In a class of 40 students, the ratio of boys to girls is 3:5. How many boys and how many girls are in the class?\n(b) If 4 new boys join the class and 2 girls leave, what is the new ratio of boys to girls in its simplest form?', 20, 'Total parts = 8. Divide 40 by 8 to find the value of one part.'),
  subj('(a) The diagram shows a circle inscribed inside a square of side 14 cm. (Imagine a circle touching all 4 sides of the square).\n    (i) What is the diameter and radius of the circle?\n    (ii) Calculate the area of the square.\n    (iii) Calculate the area of the circle. (Take π = 22/7)\n    (iv) Calculate the area of the shaded region (the corners outside the circle).', 20, 'Diameter equals the side of the square. Shaded area = Area of square - Area of circle.'),
  subj('(a) Using a ruler and a pair of compasses only, construct triangle ABC such that AB = 6 cm, BC = 8 cm, and angle ABC = 90°.\n(b) Measure the length of AC. What does this length represent in relation to the Pythagorean theorem?\n(c) Construct the perpendicular bisector of line BC.', 20, 'A 90-degree angle requires constructing a perpendicular at B. AC should measure exactly 10 cm.'),
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

async function run() {
  console.log('🎓 Seeding More Complex Basic 6 WAEC-style exams (Science & Maths)...\n');
  
  // Find Subjects
  const { data: subjects, error: subErr } = await supabase.from('subjects').select('id, name');
  if (subErr) {
    console.error('❌ Error fetching subjects:', subErr.message);
    return;
  }

  const getSubId = (keyword) => {
    const sub = subjects.find(s => s.name.includes('G6') && s.name.toLowerCase().includes(keyword));
    return sub ? sub.id : null;
  };

  const sciId = getSubId('science');
  const mathId = getSubId('math');

  const EXAMS = [
    buildExam({
      title: 'Basic 6 Science — Masterclass Mock Exam (Advanced)',
      desc: 'An advanced WAEC-style Science exam for Basic 6. Designed to test critical thinking, application of scientific principles, and deep understanding of concepts. 40 objectives + 10 subjective questions (answer 5).',
      classLevel: 'Basic 6', subjectName: 'Science', mins: 120, objQ: B6_SCI_ADV_OBJ, subjQ: B6_SCI_ADV_SUBJ
    }),
    buildExam({
      title: 'Basic 6 Mathematics — Masterclass Mock Exam (Advanced)',
      desc: 'An advanced, tricky WAEC-style Mathematics exam for Basic 6. Designed to challenge students with word problems, complex geometry, and multi-step equations. 40 objectives + 10 subjective questions (answer 5).',
      classLevel: 'Basic 6', subjectName: 'Mathematics', mins: 120, objQ: B6_MATH_ADV_OBJ, subjQ: B6_MATH_ADV_SUBJ
    })
  ];

  for (const exam of EXAMS) {
    process.stdout.write(`📝 ${exam.title}... `);
    exam.subject_id = exam.subjectName === 'Science' ? sciId : mathId;

    const { error } = await supabase.from('global_quizzes').insert(exam);
    if (error) {
      console.log(`❌ ${error.message}`);
    } else {
      const sA = exam.content.sections[0].questions.length;
      const sB = exam.content.sections[1].questions.length;
      console.log(`✅  Section A: ${sA} objs | Section B: ${sB} subjs`);
    }
  }
  console.log('\n🎉 Done! The complex Basic 6 Science and Maths WAEC exams are live on the hub.');
}

run();
