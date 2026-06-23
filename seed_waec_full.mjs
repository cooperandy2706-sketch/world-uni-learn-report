// seed_waec_full.mjs
// Full GES-aligned WAEC-style mock exams for Basic 1–9 across all core subjects
// Run: node seed_waec_full.mjs

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

// ════════════════════════════════════════════════════════════════════════
// BASIC 4 — Science (Our World, Our People / Basic Science & Technology)
// ════════════════════════════════════════════════════════════════════════
const SCI_B4_OBJ = [
  obj('Which of these is a mammal?', ['Frog', 'Lizard', 'Bat', 'Eagle'], 'Bat', 'easy'),
  obj('Plants make their food using a process called:', ['Respiration', 'Photosynthesis', 'Digestion', 'Transpiration'], 'Photosynthesis', 'easy'),
  obj('The Sun provides Earth with heat and:', ['Water', 'Air', 'Light', 'Sound'], 'Light', 'easy'),
  obj('Which of the following is NOT a property of matter?', ['Mass', 'Volume', 'Colour', 'Weight'], 'Colour', 'medium'),
  obj('Water changes from liquid to gas through:', ['Freezing', 'Melting', 'Condensation', 'Evaporation'], 'Evaporation', 'easy'),
  obj('The human body system responsible for breathing is the:', ['Digestive system', 'Nervous system', 'Respiratory system', 'Circulatory system'], 'Respiratory system', 'medium'),
  obj('Which planet is closest to the Sun?', ['Venus', 'Mercury', 'Earth', 'Mars'], 'Mercury', 'medium'),
  obj('An example of a good conductor of heat is:', ['Wood', 'Rubber', 'Plastic', 'Copper'], 'Copper', 'medium'),
  obj('Which gas do plants absorb during photosynthesis?', ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Hydrogen'], 'Carbon dioxide', 'easy'),
  obj('Bones and muscles are parts of which body system?', ['Digestive', 'Skeletal', 'Circulatory', 'Respiratory'], 'Skeletal', 'easy'),
  obj('Which of the following is a mixture?', ['Water (H₂O)', 'Table salt (NaCl)', 'Sugar (sucrose)', 'Salt water'], 'Salt water', 'medium'),
  obj('Which of the following is an example of a non-living thing?', ['Mushroom', 'Coral', 'Rock', 'Moss'], 'Rock', 'easy'),
  obj('The part of a plant that absorbs water from the soil is the:', ['Leaf', 'Stem', 'Flower', 'Root'], 'Root', 'easy'),
  obj('The force that pulls objects towards Earth is called:', ['Friction', 'Gravity', 'Magnetism', 'Tension'], 'Gravity', 'easy'),
  obj('A caterpillar becomes a butterfly through a process called:', ['Germination', 'Evolution', 'Metamorphosis', 'Photosynthesis'], 'Metamorphosis', 'medium'),
  obj('Which organ in the human body pumps blood?', ['Brain', 'Liver', 'Kidney', 'Heart'], 'Heart', 'easy'),
  obj('Which of these is a solid, liquid and gas combined in everyday experience?', ['Ice', 'Snow', 'Air', 'Water at boiling point'], 'Water at boiling point', 'hard'),
  obj('Which of the following is a renewable source of energy?', ['Coal', 'Natural gas', 'Petroleum', 'Solar energy'], 'Solar energy', 'medium'),
  obj('The layer of air surrounding the Earth is called the:', ['Biosphere', 'Hydrosphere', 'Lithosphere', 'Atmosphere'], 'Atmosphere', 'medium'),
  obj('When two or more elements chemically combine, they form a:', ['Mixture', 'Compound', 'Solution', 'Alloy'], 'Compound', 'hard'),
  obj('Which type of teeth is used for cutting food?', ['Molars', 'Premolars', 'Canines', 'Incisors'], 'Incisors', 'medium'),
  obj('Which of the following correctly describes a food chain?', ['Sun → Rabbit → Grass → Fox', 'Grass → Rabbit → Fox → Sun', 'Grass → Rabbit → Fox', 'Fox → Rabbit → Grass'], 'Grass → Rabbit → Fox', 'medium'),
  obj('The moon takes approximately how many days to complete one orbit of Earth?', ['7', '14', '28', '365'], '28', 'medium'),
  obj('Which of the following would float in water?', ['An iron nail', 'A glass marble', 'A wooden cork', 'A coin'], 'A wooden cork', 'easy'),
  obj('A material that allows electricity to pass through is called a:', ['Resistor', 'Conductor', 'Insulator', 'Magnet'], 'Conductor', 'easy'),
  obj('What is the function of the root hairs on a plant?', ['Support the plant', 'Absorb water and minerals', 'Produce food', 'Attract insects'], 'Absorb water and minerals', 'medium'),
  obj('The skeleton of an insect is on the outside and is called an:', ['Endoskeleton', 'Backbone', 'Exoskeleton', 'Cartilage'], 'Exoskeleton', 'hard'),
  obj('What property of light allows us to see objects?', ['Reflection', 'Refraction', 'Absorption', 'Diffusion'], 'Reflection', 'medium'),
  obj('Which of the following is a parasitic plant?', ['Maize', 'Mistletoe', 'Water lily', 'Tomato'], 'Mistletoe', 'hard'),
  obj('Sound is produced by:', ['Light waves', 'Vibrations', 'Magnetic fields', 'Static electricity'], 'Vibrations', 'easy'),
  obj('Which of the following gas do humans breathe out?', ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Hydrogen'], 'Carbon dioxide', 'easy'),
  obj('The study of living things is called:', ['Chemistry', 'Physics', 'Biology', 'Geology'], 'Biology', 'easy'),
  obj('Which of the following is NOT part of the water cycle?', ['Evaporation', 'Condensation', 'Precipitation', 'Combustion'], 'Combustion', 'medium'),
  obj('Acid rain is caused by pollution from:', ['Sulfur dioxide and nitrogen oxides', 'Oxygen and helium', 'Carbon dioxide and oxygen', 'Dust and pollen'], 'Sulfur dioxide and nitrogen oxides', 'hard'),
  obj('A thermometer is used to measure:', ['Speed', 'Mass', 'Temperature', 'Length'], 'Temperature', 'easy'),
  obj('Which of the following is NOT a characteristic of living things?', ['Respiration', 'Growth', 'Magnetism', 'Reproduction'], 'Magnetism', 'easy'),
  obj('Which of the following is found in the nucleus of an atom?', ['Electrons only', 'Protons and neutrons', 'Neutrons and electrons', 'Protons and electrons'], 'Protons and neutrons', 'hard'),
  obj('What is rusting an example of?', ['Physical change', 'Chemical change', 'State change', 'Mixture'], 'Chemical change', 'medium'),
  obj('Chlorophyll is the green substance in plants that:', ['Absorbs water', 'Absorbs sunlight for photosynthesis', 'Stores food', 'Transports nutrients'], 'Absorbs sunlight for photosynthesis', 'medium'),
  obj('Which of the following has the most energy?', ['A moving bicycle', 'A rock sitting on a hill', 'A compressed spring', 'A book on a shelf'], 'A moving bicycle', 'hard'),
];

const SCI_B4_SUBJ = [
  subj('(a) Name THREE things plants need for photosynthesis.\n(b) What products are made during photosynthesis?\n(c) Draw a simple diagram of a plant and label the part where photosynthesis mainly takes place.', 12),
  subj('(a) What is the difference between a mixture and a compound?\n(b) Give ONE example of each.\n(c) Describe ONE method that can be used to separate a mixture of sand and water.', 10),
  subj('Describe the water cycle by explaining what happens at each of the following stages: evaporation, condensation, precipitation, and collection.', 12),
  subj('(a) Name the FOUR main food groups.\n(b) Give ONE food example from each group.\n(c) Explain why eating a balanced diet is important for your health.', 12),
  subj('(a) What is a food chain? Construct a food chain with four organisms found in Ghana.\n(b) What would happen if the population of herbivores in your food chain suddenly decreased? Explain.', 10),
  subj('(a) List FOUR characteristics of living things.\n(b) Explain how a rock differs from a plant using TWO of these characteristics.', 8),
  subj('Explain why it is important to protect our environment. Mention THREE human activities that damage the environment and suggest ONE solution for each.', 12),
];

// ═════════════════════════════════════════════════════════════════════════
// BASIC 4 — Social Studies
// ═════════════════════════════════════════════════════════════════════════
const SOC_B4_OBJ = [
  obj('Ghana is located in which part of Africa?', ['North', 'East', 'South', 'West'], 'West', 'easy'),
  obj('The national flag of Ghana has the colours red, gold, green and a:', ['Eagle', 'Moon', 'Black star', 'Sun'], 'Black star', 'easy'),
  obj('Ghana gained independence in:', ['1955', '1956', '1957', '1960'], '1957', 'easy'),
  obj('Who was Ghana\'s first president?', ['J.B. Danquah', 'Kofi Busia', 'Kwame Nkrumah', 'John Rawlings'], 'Kwame Nkrumah', 'easy'),
  obj('The capital city of Ghana is:', ['Kumasi', 'Takoradi', 'Accra', 'Cape Coast'], 'Accra', 'easy'),
  obj('Which of the following is a natural resource of Ghana?', ['Motor car', 'Gold', 'Computer', 'Plastic'], 'Gold', 'easy'),
  obj('A community is best described as:', ['A single family', 'A group of people living together in an area', 'A market place', 'A government building'], 'A group of people living together in an area', 'easy'),
  obj('Which of these is a duty of a good citizen?', ['Pay taxes', 'Litter the street', 'Disobey traffic rules', 'Waste water'], 'Pay taxes', 'easy'),
  obj('The Ashanti people of Ghana are known for which traditional craft?', ['Fishing', 'Kente cloth weaving', 'Pottery only', 'Farming only'], 'Kente cloth weaving', 'medium'),
  obj('Which of the following is the MOST important reason for going to school?', ['To make friends', 'To get food', 'To get education for a better future', 'To play games'], 'To get education for a better future', 'easy'),
  obj('Which of the following describes a village?', ['A large settlement with industries and many services', 'A small settlement where most people farm', 'A place with a seaport and airport', 'A region with many factories'], 'A small settlement where most people farm', 'medium'),
  obj('The Volta River is important to Ghana mainly because it:', ['Provides drinking water only', 'Generates hydroelectric power and provides water', 'Is only used for fishing', 'Separates Ghana from Nigeria'], 'Generates hydroelectric power and provides water', 'medium'),
  obj('Which of the following is a pull factor that attracts people to cities?', ['Better job opportunities', 'Poor roads', 'Lack of hospitals', 'Floods'], 'Better job opportunities', 'medium'),
  obj('Which type of map shows natural features such as rivers and hills?', ['Political map', 'Physical map', 'Road map', 'Weather map'], 'Physical map', 'medium'),
  obj('The symbols used on maps are explained in the:', ['Title', 'Scale', 'Legend (key)', 'Compass'], 'Legend (key)', 'medium'),
  obj('Which direction does the sun rise from?', ['West', 'North', 'South', 'East'], 'East', 'easy'),
  obj('Which of the following best describes "culture"?', ['A country\'s army', 'The way of life of a people including customs, language, and traditions', 'The government of a nation', 'The geography of a place'], 'The way of life of a people including customs, language, and traditions', 'medium'),
  obj('The Akosombo Dam on the Volta River generates:', ['Water for irrigation only', 'Electric power', 'Natural gas', 'Petroleum'], 'Electric power', 'easy'),
  obj('How many regions does Ghana have?', ['10', '12', '14', '16'], '16', 'hard'),
  obj('Who governs a district in Ghana?', ['District Assembly', 'Regional Minister', 'President', 'Army General'], 'District Assembly', 'medium'),
  obj('Which of the following is a problem caused by cutting down too many trees?', ['Increased rainfall', 'Soil erosion and desertification', 'More wildlife', 'Cleaner rivers'], 'Soil erosion and desertification', 'medium'),
  obj('The type of agriculture where food is grown mainly for the farmer\'s family is called:', ['Commercial farming', 'Subsistence farming', 'Plantation farming', 'Mechanised farming'], 'Subsistence farming', 'medium'),
  obj('A patriot is someone who:', ['Loves and supports their country', 'Always travels abroad', 'Only cares about money', 'Avoids paying taxes'], 'Loves and supports their country', 'easy'),
  obj('Which of the following is a traditional leader in Ghana?', ['Member of Parliament', 'Chief / Nana / Nene', 'District Chief Executive', 'Regional Minister'], 'Chief / Nana / Nene', 'easy'),
  obj('What is the main function of a market?', ['A place to sleep', 'A place where goods and services are bought and sold', 'A place for worship', 'A government office'], 'A place where goods and services are bought and sold', 'easy'),
  obj('Ghana\'s main export crop is:', ['Rice', 'Maize', 'Cocoa', 'Cassava'], 'Cocoa', 'easy'),
  obj('The Equator passes through which of the following?', ['Accra', 'Kumasi', 'Tema', 'No major Ghanaian city, but near the south'], 'No major Ghanaian city, but near the south', 'hard'),
  obj('Independence Square (Black Star Square) is located in:', ['Kumasi', 'Takoradi', 'Accra', 'Tamale'], 'Accra', 'easy'),
  obj('Which of these is an example of good citizenship behaviour?', ['Throwing litter on the street', 'Reporting a crime to the police', 'Damaging public property', 'Bullying others'], 'Reporting a crime to the police', 'easy'),
  obj('Which of the following is a global environmental problem?', ['Too many schools', 'Climate change caused by greenhouse gases', 'Not enough roads', 'High food prices'], 'Climate change caused by greenhouse gases', 'hard'),
  obj('A census is conducted in Ghana every:', ['2 years', '5 years', '10 years', '20 years'], '10 years', 'medium'),
  obj('Which of the following is a famous historical site in Ghana?', ['Big Ben', 'The Colosseum', 'Cape Coast Castle', 'The Eiffel Tower'], 'Cape Coast Castle', 'easy'),
  obj('What does the abbreviation "NDC" stand for in Ghanaian politics?', ['National Development Corporation', 'National Democratic Congress', 'New Development Committee', 'National Data Commission'], 'National Democratic Congress', 'medium'),
  obj('The process of choosing leaders through voting is called:', ['Appointment', 'Election', 'Nomination', 'Promotion'], 'Election', 'easy'),
  obj('Which house of worship is used by Christians?', ['Mosque', 'Temple', 'Church', 'Shrine'], 'Church', 'easy'),
  obj('The process of making goods using machines in large quantities is called:', ['Farming', 'Mining', 'Manufacturing', 'Fishing'], 'Manufacturing', 'medium'),
  obj('Which of the following is a right of every Ghanaian child?', ['Right to work in a factory', 'Right to education', 'Right to drive a car', 'Right to vote at age 12'], 'Right to education', 'easy'),
  obj('Water can be purified for drinking by:', ['Adding salt to it', 'Boiling it or using chemicals', 'Keeping it in a container', 'Mixing it with juice'], 'Boiling it or using chemicals', 'medium'),
  obj('The ECOWAS organisation was formed to:', ['Start wars between countries', 'Promote economic cooperation in West Africa', 'Manage elections in Africa', 'Build airports only'], 'Promote economic cooperation in West Africa', 'medium'),
  obj('Which of the following describes inflation?', ['A fall in prices of goods', 'A rise in employment levels', 'A general increase in the prices of goods and services', 'An increase in population growth'], 'A general increase in the prices of goods and services', 'hard'),
];

const SOC_B4_SUBJ = [
  subj('(a) Draw and colour the national flag of Ghana.\n(b) Explain what the THREE colours and the Black Star on the flag represent.', 10),
  subj('(a) What is a natural resource? Give THREE examples of natural resources found in Ghana.\n(b) Explain why it is important to manage our natural resources carefully.', 12),
  subj('Describe the difference between a village, a town and a city. Give ONE example of each from Ghana and state ONE advantage of living in each type of settlement.', 12),
  subj('(a) What is a traditional festival? Name TWO traditional festivals celebrated in Ghana and state the ethnic group that celebrates each one.\n(b) Why are traditional festivals important for Ghanaians?', 10),
  subj('(a) Name THREE things a good citizen does for their country.\n(b) What is the difference between a right and a responsibility? Give ONE example of each.', 10),
  subj('(a) Why is cocoa important to Ghana\'s economy?\n(b) Describe TWO problems Ghanaian cocoa farmers face.\n(c) Suggest ONE solution to any of the problems mentioned.', 12),
  subj('Explain what the United Nations Organisation (UNO) is and state THREE of its roles in promoting peace and development in the world.', 10),
];

// ═════════════════════════════════════════════════════════════════════════
// BASIC 4 — Religious & Moral Education (RME)
// ═════════════════════════════════════════════════════════════════════════
const RME_B4_OBJ = [
  obj('RME stands for:', ['Reading and Moral Education', 'Religious and Moral Education', 'Religious and Mathematics Education', 'Reading, Maths and English'], 'Religious and Moral Education', 'easy'),
  obj('Which of the following is a holy book used by Christians?', ['Quran', 'Torah', 'Bible', 'Vedas'], 'Bible', 'easy'),
  obj('The holy book of Islam is the:', ['Bible', 'Quran', 'Torah', 'Tripitaka'], 'Quran', 'easy'),
  obj('Which of the following is a Muslim place of worship?', ['Church', 'Temple', 'Shrine', 'Mosque'], 'Mosque', 'medium'),
  obj('A person who follows the Christian religion is called a:', ['Muslim', 'Buddhist', 'Christian', 'Hindu'], 'Christian', 'easy'),
  obj('Honesty means:', ['Telling lies', 'Being truthful and not deceiving others', 'Stealing', 'Being unkind'], 'Being truthful and not deceiving others', 'easy'),
  obj('Which of the following is considered a moral value?', ['Stealing', 'Telling lies', 'Respecting elders', 'Being jealous'], 'Respecting elders', 'easy'),
  obj('Ramadan is a holy month observed by:', ['Christians', 'Muslims', 'Hindus', 'Traditional worshippers'], 'Muslims', 'easy'),
  obj('The Golden Rule in Christianity says: "Do to others as you would:', ['do to yourself", meaning please yourself', 'have them do to you"', 'think is right for them"', 'be forced to do"'], 'have them do to you"', 'medium'),
  obj('The person who leads prayers in a mosque is called:', ['Pastor', 'Priest', 'Imam', 'Elder'], 'Imam', 'easy'),
  obj('Which of the following best describes a morally good action?', ['Cheating in an exam', 'Helping a friend in need', 'Bullying a younger child', 'Stealing from a market'], 'Helping a friend in need', 'easy'),
  obj('Prayer is important because it helps us to:', ['Show off', 'Make others jealous', 'Communicate with God and ask for guidance', 'Avoid going to school'], 'Communicate with God and ask for guidance', 'easy'),
  obj('Christmas is celebrated by Christians to mark:', ['The death of Jesus', 'The birth of Jesus Christ', 'The resurrection of Jesus', 'The baptism of Jesus'], 'The birth of Jesus Christ', 'easy'),
  obj('Eid al-Fitr is a celebration that marks the end of:', ['Hajj', 'Ramadan', 'Friday prayers', 'Islamic New Year'], 'Ramadan', 'medium'),
  obj('Which of the following is a traditional religious practice in Ghana?', ['Libation pouring', 'Eating pizza', 'Playing football', 'Driving a car'], 'Libation pouring', 'medium'),
  obj('Forgiveness means:', ['Hurting someone who hurt you', 'Letting go of anger and pardoning someone who wronged you', 'Ignoring people', 'Keeping a grudge'], 'Letting go of anger and pardoning someone who wronged you', 'easy'),
  obj('A person who spreads love, kindness and helps others is showing the value of:', ['Selfishness', 'Charity and benevolence', 'Pride', 'Greed'], 'Charity and benevolence', 'easy'),
  obj('In traditional Ghanaian society, who are mainly responsible for teaching children moral values?', ['Government officials', 'Police officers', 'Parents and elders', 'Strangers'], 'Parents and elders', 'easy'),
  obj('Which of the following is a result of showing respect to others?', ['Conflict and fighting', 'Peaceful relationships and unity', 'Jealousy and anger', 'Loneliness'], 'Peaceful relationships and unity', 'easy'),
  obj('The Hajj is a pilgrimage that Muslims perform to:', ['Jerusalem', 'Medina', 'Cairo', 'Mecca'], 'Mecca', 'medium'),
  obj('What is the meaning of "integrity"?', ['Being dishonest', 'Having strong moral principles; being honest and truthful', 'Being selfish', 'Pretending to be good'], 'Having strong moral principles; being honest and truthful', 'medium'),
  obj('Which of these describes responsible behaviour at school?', ['Copying someone\'s homework', 'Arriving on time and submitting your own work', 'Cheating in an examination', 'Being absent without permission'], 'Arriving on time and submitting your own work', 'easy'),
  obj('A taboo in traditional Ghanaian society is:', ['An act that is widely encouraged', 'Something forbidden because it is considered morally wrong or disrespectful', 'A special feast day', 'A form of greeting'], 'Something forbidden because it is considered morally wrong or disrespectful', 'medium'),
  obj('Which of the following shows a lack of moral discipline?', ['Keeping a promise', 'Returning found property to its owner', 'Cheating in games and competitions', 'Caring for the sick'], 'Cheating in games and competitions', 'easy'),
  obj('The act of giving to those in need, as taught in Christianity and Islam, is called:', ['Ambition', 'Giving alms / charity (Zakat in Islam)', 'Jealousy', 'Pride'], 'Giving alms / charity (Zakat in Islam)', 'medium'),
  obj('Easter Sunday is a Christian celebration of:', ['The birth of Jesus', 'The ascension of Jesus', 'The resurrection of Jesus Christ', 'The Last Supper'], 'The resurrection of Jesus Christ', 'medium'),
  obj('Which of the following correctly describes peer pressure?', ['Your parents guiding your behaviour', 'Influence from people of your own age group to act in a certain way', 'A teacher asking you to study hard', 'A law passed by the government'], 'Influence from people of your own age group to act in a certain way', 'medium'),
  obj('Traditional Ghanaian religion involves belief in:', ['Only one god with no ancestral spirits', 'A supreme being, lesser deities, and ancestral spirits', 'No god at all', 'Only foreign gods'], 'A supreme being, lesser deities, and ancestral spirits', 'hard'),
  obj('Which of the following is an example of a moral virtue?', ['Greed', 'Jealousy', 'Humility', 'Deceit'], 'Humility', 'easy'),
  obj('The concept of "Ubuntu" (common in African tradition) means:', ['I am better than others', 'I am, because we are — emphasising community and humanity', 'Every man for himself', 'Wealth is everything'], 'I am, because we are — emphasising community and humanity', 'hard'),
  obj('What should you do if a friend asks you to help them steal?', ['Help them and share the items', 'Refuse and explain why stealing is wrong', 'Ignore the situation and walk away without saying anything', 'Report them to the market woman only'], 'Refuse and explain why stealing is wrong', 'easy'),
  obj('In the Bible, who was known for his great wisdom and wrote many proverbs?', ['Moses', 'King David', 'King Solomon', 'Abraham'], 'King Solomon', 'medium'),
  obj('The Prophet of Islam is:', ['Jesus', 'Moses', 'Muhammad (SAW)', 'Abraham'], 'Muhammad (SAW)', 'easy'),
  obj('Which of the following is a moral problem affecting Ghanaian society today?', ['Building of schools', 'Corruption and bribery', 'Planting of trees', 'Building hospitals'], 'Corruption and bribery', 'medium'),
  obj('The concept of "good neighbourliness" means:', ['Minding your own business at all times', 'Living peacefully and helping those around you', 'Ignoring your neighbours problems', 'Competing with your neighbours'], 'Living peacefully and helping those around you', 'easy'),
  obj('Obedience is important because it:', ['Leads to punishment', 'Creates conflict', 'Builds trust and maintains order in the family and society', 'Makes you weak'], 'Builds trust and maintains order in the family and society', 'easy'),
  obj('Which of these best shows the value of tolerance?', ['Accepting only people who agree with you', 'Respecting others even when they have different beliefs or opinions', 'Fighting people who are different from you', 'Only socialising with your own ethnic group'], 'Respecting others even when they have different beliefs or opinions', 'medium'),
  obj('The founder of Christianity is believed to be:', ['Muhammad', 'Buddha', 'Moses', 'Jesus Christ'], 'Jesus Christ', 'easy'),
  obj('The "Ten Commandments" in the Bible were given to:', ['Jesus', 'Solomon', 'Moses', 'Abraham'], 'Moses', 'medium'),
  obj('Which of the following is a consequence of dishonesty?', ['Trust and respect', 'Loss of trust and damaged relationships', 'Friendship and cooperation', 'Personal growth'], 'Loss of trust and damaged relationships', 'easy'),
];

const RME_B4_SUBJ = [
  subj('(a) Name THREE moral values every student should show in school.\n(b) Explain what each of the three values means in your own words.\n(c) Describe a situation where you showed one of these moral values.', 12),
  subj('(a) What is religion?\n(b) Name the THREE main religions practised in Ghana.\n(c) State ONE important belief that each religion has in common.', 12),
  subj('(a) Explain what peer pressure is.\n(b) Give TWO examples of negative peer pressure that young people face.\n(c) How can a student resist negative peer pressure? Suggest TWO ways.', 10),
  subj('(a) What is the difference between a right and a responsibility?\n(b) Give TWO examples of your rights as a student.\n(c) Give TWO examples of your responsibilities at home.', 10),
  subj('(a) Describe what "forgiveness" means.\n(b) Tell a story (either real or imagined) that shows the importance of forgiving others.', 10),
  subj('(a) What is honesty?\n(b) Explain TWO consequences of being dishonest — one for the individual and one for the community.', 8),
  subj('Explain why respecting elders and traditional customs is important in Ghanaian society. Give TWO examples of how young people can show this respect.', 10),
];

// ════════════════════════════════════════════════════════════════════════
// BASIC 7 — Social Studies
// ════════════════════════════════════════════════════════════════════════
const SOC_B7_OBJ = [
  obj('Ghana gained independence on 6th March:', ['1955', '1956', '1957', '1960'], '1957', 'easy'),
  obj('The document that guarantees citizens their rights in Ghana is the:', ['Electoral Act', '1992 Constitution', 'Independence Charter', 'ECOWAS Treaty'], '1992 Constitution', 'medium'),
  obj('Which of the following is the CORRECT order of the three arms of government?', ['Police, Army, Court', 'Executive, Legislature, Judiciary', 'President, Parliament, District', 'Government, Citizens, Opposition'], 'Executive, Legislature, Judiciary', 'medium'),
  obj('The main cash crop of Ghana is:', ['Maize', 'Rice', 'Cocoa', 'Cotton'], 'Cocoa', 'easy'),
  obj('Which institution organises elections in Ghana?', ['Ghana Police Service', 'Electoral Commission', 'Supreme Court', 'National Commission for Civic Education'], 'Electoral Commission', 'easy'),
  obj('The Berlin Conference of 1884–85 resulted in:', ['African unity', 'The partition of Africa among European powers', 'African independence', 'The end of the slave trade'], 'The partition of Africa among European powers', 'medium'),
  obj('ECOWAS was established in:', ['1957', '1960', '1975', '1985'], '1975', 'medium'),
  obj('Which of the following describes the concept of "separation of powers"?', ['One person controls all government functions', 'Government powers are divided among different bodies to prevent abuse', 'The military controls the government', 'Only the president makes all decisions'], 'Government powers are divided among different bodies to prevent abuse', 'medium'),
  obj('The main reason for rural-urban migration in Ghana is:', ['People enjoy city noise', 'Better job opportunities and social services in cities', 'Villages are always flooded', 'All schools are in cities'], 'Better job opportunities and social services in cities', 'medium'),
  obj('Which of the following is a DIRECT effect of rapid population growth?', ['Improved healthcare', 'Increased demand for food and services', 'Less traffic on roads', 'Improved quality of education'], 'Increased demand for food and services', 'medium'),
  obj('Which type of government is practised in Ghana?', ['Military dictatorship', 'Monarchy', 'Multi-party democracy', 'Communist state'], 'Multi-party democracy', 'medium'),
  obj('The process by which a country\'s citizens choose their leaders through voting is called:', ['Dictation', 'Election', 'Appointment', 'Lobbying'], 'Election', 'easy'),
  obj('Which of the following is Ghana\'s official language?', ['Twi', 'Hausa', 'English', 'French'], 'English', 'easy'),
  obj('The Atlantic Slave Trade took Africans mainly to:', ['Europe and Asia', 'North and South America', 'Australia and New Zealand', 'The Middle East only'], 'North and South America', 'medium'),
  obj('Which of the following is an effect of colonialism on Africa?', ['Rapid industrialisation of Africa', 'Artificial boundaries that divided ethnic groups', 'Unified African governments', 'Development of all African languages in schools'], 'Artificial boundaries that divided ethnic groups', 'hard'),
  obj('A country\'s constitution is BEST described as:', ['A collection of news articles', 'The supreme law of the land that governs the state and its citizens', 'A military order', 'A traditional agreement'], 'The supreme law of the land that governs the state and its citizens', 'medium'),
  obj('Which of the following is a PUSH factor of migration?', ['Better hospitals in the destination city', 'Available entertainment in the city', 'Unemployment in the rural area', 'Good schools in the city'], 'Unemployment in the rural area', 'medium'),
  obj('The head of government in Ghana is the:', ['Speaker of Parliament', 'Chief Justice', 'President', 'Attorney General'], 'President', 'easy'),
  obj('The process of converting forest land into agricultural or residential land is called:', ['Afforestation', 'Deforestation', 'Irrigation', 'Conservation'], 'Deforestation', 'easy'),
  obj('Which of the following describes sustainable development?', ['Rapid extraction of all natural resources', 'Development that uses resources in a way that meets current needs without compromising future generations', 'Industrialisation at any cost', 'Only economic growth, ignoring the environment'], 'Development that uses resources in a way that meets current needs without compromising future generations', 'medium'),
  obj('The term "democracy" originates from ancient:', ['Rome', 'Egypt', 'China', 'Greece'], 'Greece', 'medium'),
  obj('The Slave Trade was officially abolished in Britain in:', ['1807', '1834', '1865', '1900'], '1807', 'hard'),
  obj('Which of the following best describes "globalisation"?', ['Countries becoming more isolated from one another', 'The increasing interconnection and interdependence of countries worldwide', 'The colonisation of developing nations', 'The spread of one country\'s culture to all others by force'], 'The increasing interconnection and interdependence of countries worldwide', 'hard'),
  obj('Population density refers to:', ['The total number of people in a country', 'The number of people per square kilometre of land area', 'The rate at which people are born', 'The rate of people moving to cities'], 'The number of people per square kilometre of land area', 'medium'),
  obj('Which of the following is a human right recognised by the United Nations?', ['Right to own a car', 'Right to free and fair trial', 'Right to pay no taxes', 'Right to no education'], 'Right to free and fair trial', 'medium'),
  obj('The body responsible for interpreting the constitution and laws in Ghana is the:', ['Parliament', 'Electoral Commission', 'Judiciary (Courts)', 'Executive (Cabinet)'], 'Judiciary (Courts)', 'medium'),
  obj('Which early Ghanaian leader was known as the "Prison Graduate" for his jail time before independence?', ['J.B. Danquah', 'Kofi Busia', 'Kwame Nkrumah', 'Akufo-Addo'], 'Kwame Nkrumah', 'medium'),
  obj('Trade in the pre-colonial era between West Africa and North Africa was mainly done across the:', ['Atlantic Ocean', 'Indian Ocean', 'Sahara Desert', 'Congo Forest'], 'Sahara Desert', 'hard'),
  obj('An example of indirect rule, used by the British in West Africa, means:', ['British officers directly managed every village', 'Colonial powers used existing African rulers to govern on their behalf', 'All Africans became British citizens', 'Local governments were completely abolished'], 'Colonial powers used existing African rulers to govern on their behalf', 'hard'),
  obj('What is GDP?', ['Gross Domestic Population', 'Gross Domestic Product — the total value of goods and services produced in a country in a year', 'Government\'s Daily Programme', 'General Development Plan'], 'Gross Domestic Product — the total value of goods and services produced in a country in a year', 'hard'),
  obj('The Environmental Protection Agency (EPA) in Ghana is responsible for:', ['Printing money', 'Protecting and managing the country\'s environment', 'Organising elections', 'Teaching in schools'], 'Protecting and managing the country\'s environment', 'medium'),
  obj('Which of the following is a disadvantage of urbanisation?', ['Better medical facilities', 'Unemployment and slums in cities', 'Improved infrastructure', 'More educational opportunities'], 'Unemployment and slums in cities', 'medium'),
  obj('The Fulani people of northern Ghana are traditionally known for:', ['Mining gold', 'Fishing along the coast', 'Nomadic cattle herding', 'Kente weaving'], 'Nomadic cattle herding', 'medium'),
  obj('The concept of "rule of law" means:', ['The ruler can do whatever they want', 'No one is above the law; everyone is accountable to the law equally', 'Only lawyers have to obey laws', 'Laws only apply to ordinary people'], 'No one is above the law; everyone is accountable to the law equally', 'medium'),
  obj('Which of the following is a responsibility of every Ghanaian?', ['Obeying only the laws you like', 'Voting in every election', 'Only paying school fees', 'Working for a government agency'], 'Voting in every election', 'medium'),
  obj('What name is given to the boundary between Ghana and its neighbours on a map?', ['Contour line', 'International boundary', 'Scale line', 'Meridian'], 'International boundary', 'medium'),
  obj('The United Nations Organisation (UN) was formed after which major world event?', ['World War I', 'The Cold War', 'World War II', 'The Great Depression'], 'World War II', 'medium'),
  obj('Ghana\'s Volta Basin is associated with which major resource?', ['Oil', 'Cocoa', 'Water / Hydroelectric power', 'Timber'], 'Water / Hydroelectric power', 'medium'),
  obj('Which of the following led to the growth of West African empires in the middle ages?', ['Slave trading with Europe', 'Control of gold and salt trade routes across the Sahara', 'Oil discovery', 'Conquest by Arabs'], 'Control of gold and salt trade routes across the Sahara', 'hard'),
  obj('The process of one country politically controlling another is called:', ['Globalisation', 'Slavery', 'Colonialism', 'Migration'], 'Colonialism', 'medium'),
];

const SOC_B7_SUBJ = [
  subj('(a) Explain the causes of the Atlantic Slave Trade.\n(b) Describe THREE effects of the slave trade on West Africa.\n(c) How was the slave trade eventually abolished?', 15),
  subj('(a) Explain the concept of "democracy" and state THREE features of a democratic government.\n(b) Why is democracy considered the best form of government? Give TWO reasons.', 15),
  subj('Discuss the causes and effects of rural-urban migration in Ghana. In your answer:\n(a) Name and explain THREE push factors.\n(b) Name and explain THREE pull factors.\n(c) Suggest TWO solutions to reduce rural-urban migration.', 15),
  subj('(a) What is colonialism?\n(b) Describe THREE ways in which colonialism affected Ghana (Gold Coast) negatively.\n(c) State ONE positive impact of colonial rule.', 15),
  subj('(a) Define the term "sustainable development."\n(b) Identify THREE environmental problems facing Ghana today.\n(c) For each problem, suggest ONE solution.', 12),
  subj('(a) Explain the importance of the 1992 Constitution of Ghana.\n(b) Name THREE fundamental human rights guaranteed by the constitution.\n(c) What happens when the constitution is violated?', 12),
  subj('(a) What is population growth? State ONE advantage and ONE disadvantage of a rapidly growing population.\n(b) How does Ghana\'s population growth affect:\n    (i) Education\n    (ii) Housing\n    (iii) Healthcare', 12),
];

// ════════════════════════════════════════════════════════════════════════
// BASIC 7 — RME
// ════════════════════════════════════════════════════════════════════════
const RME_B7_OBJ = [
  obj('The three main religions practised in Ghana are:', ['Islam, Buddhism, Hinduism', 'Christianity, Islam, Traditional African Religion', 'Christianity, Judaism, Islam', 'Buddhism, Hinduism, Christianity'], 'Christianity, Islam, Traditional African Religion', 'easy'),
  obj('The Christian doctrine of the Trinity means:', ['God appears in three separate forms but is actually one being', 'There are three different gods in Christianity', 'Only Jesus matters in Christianity', 'The Father, Son and Holy Spirit are three completely separate gods'], 'God appears in three separate forms but is actually one being', 'hard'),
  obj('The Quran was revealed to the Prophet Muhammad over a period of approximately:', ['5 years', '10 years', '23 years', '40 years'], '23 years', 'hard'),
  obj('In African Traditional Religion, the concept of "ancestors" refers to:', ['Living elderly people', 'Spirits of deceased relatives who still influence the living', 'Foreign gods', 'Government officials'], 'Spirits of deceased relatives who still influence the living', 'medium'),
  obj('Which of the following is the correct definition of "ethics"?', ['Study of plants', 'Moral principles that govern behaviour', 'Study of ancient languages', 'Religious ceremonies'], 'Moral principles that govern behaviour', 'medium'),
  obj('The "Five Pillars of Islam" include all of the following EXCEPT:', ['Shahada (declaration of faith)', 'Salat (prayer)', 'Baptism', 'Zakat (charity)'], 'Baptism', 'medium'),
  obj('Which of the following is a consequence of corruption in society?', ['Development and prosperity', 'Loss of public trust and underdevelopment', 'Improved services for citizens', 'Fair treatment for all'], 'Loss of public trust and underdevelopment', 'medium'),
  obj('The concept of "sanctity of life" means:', ['Life has no special value', 'All human life is precious and should be protected', 'Only some lives are valuable', 'Government can decide who should live'], 'All human life is precious and should be protected', 'medium'),
  obj('Which of the following is a virtue in the Christian faith?', ['Pride and anger', 'Envy and greed', 'Love, faith and hope', 'Laziness and deceit'], 'Love, faith and hope', 'easy'),
  obj('In Islam, Zakat refers to:', ['Fasting', 'Prayer', 'Pilgrimage to Mecca', 'Giving of alms to the poor'], 'Giving of alms to the poor', 'medium'),
  obj('Which of the following best describes "moral relativism"?', ['All moral rules are absolute and universal', 'Morality is the same in every culture', 'Moral rules depend on cultural, personal, and situational context', 'There are no moral rules'], 'Moral rules depend on cultural, personal, and situational context', 'hard'),
  obj('Discrimination based on gender is called:', ['Tribalism', 'Racism', 'Sexism', 'Ageism'], 'Sexism', 'medium'),
  obj('Which of the following is an example of responsible sexual behaviour among teenagers?', ['Abstinence from sexual activity', 'Engaging in casual relationships', 'Ignoring the consequences of sex', 'Peer pressure to have sex'], 'Abstinence from sexual activity', 'medium'),
  obj('A rite of passage in African tradition is a ceremony that marks:', ['A national holiday', 'A transition from one stage of life to another', 'A religious prayer', 'A political event'], 'A transition from one stage of life to another', 'medium'),
  obj('Which of the following is considered child abuse?', ['Sending a child to school', 'Providing good food for a child', 'Using a child for hard labour or domestic work instead of education', 'Taking a child to hospital when sick'], 'Using a child for hard labour or domestic work instead of education', 'easy'),
  obj('The Beatitudes, found in the Bible, were taught by Jesus in the:', ['Last Supper', 'Garden of Gethsemane', 'Sermon on the Mount', 'Book of Revelation'], 'Sermon on the Mount', 'hard'),
  obj('Which of the following is an example of environmental stewardship from a religious perspective?', ['Dumping waste in rivers', 'Over-exploitation of forests', 'Caring for and protecting God\'s creation', 'Using chemicals to kill wildlife'], 'Caring for and protecting God\'s creation', 'easy'),
  obj('The concept of "karma" in Hinduism and Buddhism means:', ['The belief in one God', 'What you do will eventually come back to you — cause and effect', 'Praying five times a day', 'Going on a pilgrimage'], 'What you do will eventually come back to you — cause and effect', 'hard'),
  obj('Which of the following correctly describes human trafficking?', ['Legal movement of workers across borders', 'The illegal trade of human beings for exploitation and forced labour', 'Voluntary migration for work', 'Selling goods at markets'], 'The illegal trade of human beings for exploitation and forced labour', 'medium'),
  obj('In Islam, Friday (Jumu\'ah) is a special day because:', ['It is the Islamic New Year', 'Muslims gather for communal prayer and a sermon', 'Fasting is compulsory on this day', 'Hajj begins on this day'], 'Muslims gather for communal prayer and a sermon', 'medium'),
  obj('The principle of "social justice" requires that:', ['Only the rich get advantages', 'Resources and opportunities should be fairly distributed in society', 'Leaders make all decisions without consultation', 'People should only help their own family'], 'Resources and opportunities should be fairly distributed in society', 'medium'),
  obj('Which of the following is a taboo in many Ghanaian communities?', ['Greeting your elders', 'Disrespecting the chief or traditional authority', 'Sharing food with guests', 'Attending community festivals'], 'Disrespecting the chief or traditional authority', 'easy'),
  obj('The "Sermon on the Mount" contains what famous prayer?', ['The Hail Mary', 'The Lord\'s Prayer', 'The Apostles\' Creed', 'Psalm 23'], 'The Lord\'s Prayer', 'medium'),
  obj('The concept of "Ahimsa" in Hinduism and Buddhism means:', ['Holy war', 'Non-violence and respect for all living beings', 'A form of prayer', 'A pilgrimage to a holy site'], 'Non-violence and respect for all living beings', 'hard'),
  obj('Which of the following is a result of good moral upbringing?', ['Criminal behaviour', 'Selfishness and greed', 'Responsible and productive citizens', 'Disregard for others'], 'Responsible and productive citizens', 'easy'),
  obj('The 10 Commandments were given to Moses by God on:', ['Mount Everest', 'The Nile River', 'Mount Sinai', 'The Jordan River'], 'Mount Sinai', 'medium'),
  obj('Which of the following is a problem that arises from drug abuse among teenagers?', ['Better academic performance', 'Health problems, crime, and breakdown of families', 'More energy and focus', 'Social acceptance by all'], 'Health problems, crime, and breakdown of families', 'medium'),
  obj('In traditional Ghanaian society, the chief is regarded as:', ['Only an entertainer', 'A custodian of land and the spiritual and political head of the community', 'Just a wealthy person', 'A religious leader only'], 'A custodian of land and the spiritual and political head of the community', 'medium'),
  obj('Which of the following is an example of civic responsibility?', ['Vandalising public property', 'Keeping the environment clean', 'Ignoring community meetings', 'Refusing to pay levies'], 'Keeping the environment clean', 'easy'),
  obj('Religious pluralism means:', ['Only one religion is correct', 'There is no god', 'Multiple religions coexist and all deserve respect', 'All religions must merge into one'], 'Multiple religions coexist and all deserve respect', 'hard'),
  obj('Which of the following is an example of moral courage?', ['Staying silent when you see injustice', 'Standing up for what is right even when it is difficult', 'Always agreeing with the majority', 'Doing whatever your friends do'], 'Standing up for what is right even when it is difficult', 'medium'),
  obj('What does the word "stewardship" mean in a religious context?', ['Ownership of everything', 'Responsible management of resources entrusted to you by God', 'Leading prayers in church', 'Managing a school hostel'], 'Responsible management of resources entrusted to you by God', 'medium'),
  obj('Polygamy (marriage to multiple spouses) is permitted in:', ['Christianity', 'Buddhism', 'Islam (under specific conditions)', 'Hinduism'], 'Islam (under specific conditions)', 'hard'),
  obj('The CHRAJ stands for:', ['Commission on Human Rights and Administrative Justice', 'Committee for Handling Rights and Justice', 'Citizens Human Rights Agency for Justice', 'Community Headquarters for Rights and Justice'], 'Commission on Human Rights and Administrative Justice', 'hard'),
  obj('Which of the following is an example of ethnic discrimination in Ghana?', ['Sharing resources equally among all tribes', 'Denying someone a job because of their tribe', 'Celebrating all festivals equally', 'Learning different Ghanaian languages'], 'Denying someone a job because of their tribe', 'medium'),
  obj('What does it mean to "live by example" as a moral leader?', ['Telling others what to do without doing it yourself', 'Acting in ways that demonstrate the values you teach others', 'Making rules that benefit only you', 'Being the loudest person in the room'], 'Acting in ways that demonstrate the values you teach others', 'easy'),
  obj('Which of the following is a consequence of teenage pregnancy?', ['Academic improvement', 'Better career opportunities', 'School dropout and poverty', 'Respect from peers'], 'School dropout and poverty', 'medium'),
  obj('An "apology" is important in conflict resolution because it:', ['Shows weakness', 'Acknowledges wrongdoing and helps restore relationships', 'Means you will repeat the same behaviour', 'Has no effect on the situation'], 'Acknowledges wrongdoing and helps restore relationships', 'easy'),
  obj('In the Islamic faith, what does "Insha\'Allah" mean?', ['God is great', 'If God wills it', 'Thank God', 'Praise be to God'], 'If God wills it', 'medium'),
  obj('Which of the following is a positive effect of religious practice on an individual?', ['Increased hatred for others', 'Moral discipline, community support, and a sense of purpose', 'Excuse to avoid civic duties', 'Superiority over non-believers'], 'Moral discipline, community support, and a sense of purpose', 'medium'),
];

const RME_B7_SUBJ = [
  subj('(a) Explain the concept of "social justice" and state its importance in a diverse society like Ghana.\n(b) Describe TWO situations in Ghana where social justice is lacking.\n(c) Suggest ONE religious teaching that promotes social justice.', 15),
  subj('(a) What is human trafficking?\n(b) State FOUR ways through which people are recruited into human trafficking.\n(c) As a religious and moral person, describe what you would do if you suspected someone was a victim of human trafficking.', 15),
  subj('(a) Explain the differences and similarities between Christianity, Islam and African Traditional Religion in their view of God/Supreme Being.\n(b) Why is religious tolerance important in Ghana?', 15),
  subj('(a) What are rites of passage?\n(b) Describe the puberty rites in ONE Ghanaian ethnic group.\n(c) State TWO positive and TWO negative aspects of puberty rites.', 15),
  subj('(a) What is drug abuse?\n(b) Explain FOUR effects of drug abuse on the individual and the community.\n(c) State THREE ways a religious community can help prevent drug abuse among young people.', 12),
  subj('(a) Explain the concept of "environmental stewardship" from a religious perspective.\n(b) How does each of the THREE main religions in Ghana teach its followers to care for the environment? Give ONE teaching from each religion.', 12),
  subj('Write about a moral dilemma (a difficult situation involving a choice between two actions). Describe the situation, explain both choices available, and state — with reasons — which choice would be most morally correct.', 12),
];

// ════════════════════════════════════════════════════════════════════════
// BASIC 9 — Career Technology (BDT - Basic Design & Technology)
// ════════════════════════════════════════════════════════════════════════
const BDT_B9_OBJ = [
  obj('Career Technology (BDT) is important because it helps students:', ['Only study theory', 'Develop practical and technical skills for work and everyday life', 'Focus only on arts and crafts', 'Learn foreign languages'], 'Develop practical and technical skills for work and everyday life', 'easy'),
  obj('Which of the following is a correct definition of "technology"?', ['Using magic to solve problems', 'Applying scientific knowledge and tools to solve practical problems', 'Only using computers', 'Making handmade items only'], 'Applying scientific knowledge and tools to solve practical problems', 'easy'),
  obj('The design process usually begins with:', ['Building the prototype', 'Testing the solution', 'Identifying the problem', 'Evaluating the design'], 'Identifying the problem', 'medium'),
  obj('A prototype is:', ['The final product sold to the public', 'A preliminary model used to test a design concept', 'The raw materials used', 'The design brief'], 'A preliminary model used to test a design concept', 'medium'),
  obj('In food and nutrition, proteins are mainly needed for:', ['Providing quick energy', 'Growth and repair of body tissues', 'Regulating body temperature only', 'Providing vitamins'], 'Growth and repair of body tissues', 'easy'),
  obj('Carbohydrates are the body\'s main source of:', ['Protein', 'Vitamins', 'Energy', 'Minerals'], 'Energy', 'easy'),
  obj('Which of the following is a staple food in Ghana?', ['Spaghetti', 'Cassava', 'Sushi', 'Chapati'], 'Cassava', 'easy'),
  obj('The correct method of preserving fish by adding salt is called:', ['Smoking', 'Freezing', 'Salting / Curing', 'Canning'], 'Salting / Curing', 'medium'),
  obj('Which of the following is a safety precaution when using electrical appliances?', ['Use appliances with wet hands', 'Overload plug sockets', 'Ensure appliances are properly earthed', 'Leave appliances running when not in use'], 'Ensure appliances are properly earthed', 'medium'),
  obj('Which of the following is a local Ghanaian food that is high in carbohydrates?', ['Eggs', 'Fish', 'Kenkey', 'Beans'], 'Kenkey', 'easy'),
  obj('The word "entrepreneurship" means:', ['Working for a company as an employee only', 'Starting and running your own business by taking risks', 'Studying accounting at university', 'Working for the government'], 'Starting and running your own business by taking risks', 'medium'),
  obj('What is a "budget"?', ['Money you spend without planning', 'A plan for managing your income and expenses', 'A bank loan', 'A tax paid to the government'], 'A plan for managing your income and expenses', 'medium'),
  obj('Which of the following is a characteristic of a good entrepreneur?', ['Fear of risk', 'Unwillingness to innovate', 'Creativity and willingness to take risks', 'Dependence on others for all ideas'], 'Creativity and willingness to take risks', 'medium'),
  obj('Which of the following is an example of a wood joint used in carpentry?', ['Welding joint', 'Dovetail joint', 'Soldering joint', 'Rivet joint'], 'Dovetail joint', 'hard'),
  obj('Which hand tool is used to cut wood?', ['Hammer', 'Chisel', 'Hand saw', 'Screwdriver'], 'Hand saw', 'easy'),
  obj('The correct way to dispose of sharp workshop waste is to:', ['Throw it on the floor', 'Place it in a clearly labelled sharps bin or container', 'Leave it on the workbench', 'Throw it in regular rubbish bin'], 'Place it in a clearly labelled sharps bin or container', 'medium'),
  obj('Which of the following is NOT a step in the design process?', ['Research', 'Brainstorm ideas', 'Sleep and ignore the problem', 'Evaluate the solution'], 'Sleep and ignore the problem', 'easy'),
  obj('Vitamins and minerals in food are important because they:', ['Provide the most energy', 'Are only needed by sick people', 'Regulate body functions and prevent deficiency diseases', 'Replace carbohydrates in the diet'], 'Regulate body functions and prevent deficiency diseases', 'medium'),
  obj('A lack of Vitamin A in the diet can cause:', ['Scurvy', 'Night blindness and eye problems', 'Rickets', 'Anaemia'], 'Night blindness and eye problems', 'medium'),
  obj('Which of the following is a method of food preservation?', ['Leaving food in the sun uncovered', 'Refrigeration', 'Keeping food next to heat sources', 'Storing food with insects'], 'Refrigeration', 'easy'),
  obj('What does the acronym "PPE" stand for in workshop safety?', ['Personal Professional Equipment', 'Public Protection Essentials', 'Personal Protective Equipment', 'Professional Practical Engineering'], 'Personal Protective Equipment', 'medium'),
  obj('A mortise and tenon joint is used in:', ['Metalwork', 'Plumbing', 'Woodwork (carpentry)', 'Electrical work'], 'Woodwork (carpentry)', 'hard'),
  obj('Which of the following is a healthy cooking method?', ['Deep frying with lots of oil', 'Steaming or grilling', 'Charring food until it is black', 'Using large amounts of salt'], 'Steaming or grilling', 'easy'),
  obj('The term "value for money" in consumer education means:', ['Buying the cheapest item always', 'Getting the best quality at a fair price', 'Buying the most expensive items', 'Buying only branded products'], 'Getting the best quality at a fair price', 'medium'),
  obj('Which of the following is a local vegetable widely grown and consumed in Ghana?', ['Broccoli', 'Spinach (kontomire)', 'Brussels sprouts', 'Kale'], 'Spinach (kontomire)', 'easy'),
  obj('In a workshop, before using any power tool you should:', ['Start immediately without checking', 'Inspect the tool, wear PPE, and ensure the workspace is clear', 'Let a younger student try it first', 'Remove all safety guards for better access'], 'Inspect the tool, wear PPE, and ensure the workspace is clear', 'medium'),
  obj('Which of the following describes "planned obsolescence" in product design?', ['Designing products to last forever', 'Deliberately designing products to become outdated or break down so consumers buy new ones', 'Designing eco-friendly products', 'Designing products for recycling'], 'Deliberately designing products to become outdated or break down so consumers buy new ones', 'hard'),
  obj('Batik fabric making is an example of:', ['Woodwork', 'Metalwork', 'Textile design', 'Electrical work'], 'Textile design', 'easy'),
  obj('Which of the following is a problem caused by poor food hygiene?', ['Improved nutrition', 'Foodborne illnesses such as typhoid and cholera', 'Better food flavour', 'Longer shelf life'], 'Foodborne illnesses such as typhoid and cholera', 'medium'),
  obj('In Ghana, the craft of "kente" weaving originated among the:', ['Ewe and Ashanti people', 'Fante people only', 'Hausa people only', 'Dagomba people only'], 'Ewe and Ashanti people', 'medium'),
  obj('Which of the following best describes the concept of "ergonomics"?', ['Making products only for adults', 'Designing products and environments to fit human needs for comfort, efficiency and safety', 'Making products as cheaply as possible', 'Designing large heavy machines'], 'Designing products and environments to fit human needs for comfort, efficiency and safety', 'hard'),
  obj('The type of economy where individuals own businesses and compete for profit is called a:', ['Communist economy', 'Socialist economy', 'Market (capitalist) economy', 'Subsistence economy'], 'Market (capitalist) economy', 'hard'),
  obj('Which of the following is a primary industry?', ['Manufacturing clothing', 'Banking and finance', 'Farming and fishing', 'Teaching and healthcare'], 'Farming and fishing', 'medium'),
  obj('A bill of materials in woodwork or metalwork is:', ['A list of tools needed', 'A list of materials and quantities needed for a project', 'The cost of the finished product', 'Instructions on how to use the tools'], 'A list of materials and quantities needed for a project', 'medium'),
  obj('What is the purpose of a "working drawing" in design and technology?', ['A piece of art to display', 'A detailed technical drawing showing exact dimensions and construction details of a product', 'A rough sketch for ideas only', 'A shopping list for materials'], 'A detailed technical drawing showing exact dimensions and construction details of a product', 'medium'),
  obj('Which of the following processes is used to shape metal by heating it and hammering it?', ['Casting', 'Forging', 'Welding', 'Filing'], 'Forging', 'hard'),
  obj('The "marketing mix" in business is also known as the:', ['4 C\'s', '4 P\'s (Product, Price, Place, Promotion)', '4 M\'s', 'SWOT analysis'], '4 P\'s (Product, Price, Place, Promotion)', 'hard'),
  obj('Which of the following is an example of a service industry?', ['Gold mining', 'Timber production', 'Hairdressing and beauty', 'Cocoa farming'], 'Hairdressing and beauty', 'medium'),
  obj('Palm oil is extracted from:', ['Groundnuts', 'Coconut', 'Palm fruit (kernel)', 'Shea nuts'], 'Palm fruit (kernel)', 'easy'),
  obj('A "gantt chart" in project planning is used to:', ['Draw technical diagrams', 'Show the timeline and schedule of tasks in a project', 'List the bill of materials', 'Design the product logo'], 'Show the timeline and schedule of tasks in a project', 'hard'),
];

const BDT_B9_SUBJ = [
  subj('(a) Explain the design process with reference to the following stages: (i) Identifying the need (ii) Research and analysis (iii) Generating ideas (iv) Planning (v) Making (vi) Evaluation.\n(b) You are asked to design a simple wooden stool. Draw a labelled diagram showing how the stool would look.', 15),
  subj('(a) Explain the concept of entrepreneurship.\n(b) State FOUR qualities of a successful entrepreneur.\n(c) Describe a small business idea you could start in your community using locally available resources.', 15),
  subj('(a) What is food preservation? Explain why we preserve food.\n(b) Describe FOUR methods of food preservation, giving ONE advantage and ONE disadvantage of each method.', 15),
  subj('(a) What is a balanced diet?\n(b) Draw a table showing the six classes of nutrients, their food sources, and their functions in the body.\n(c) Describe the effects of malnutrition on a child.', 15),
  subj('(a) Describe FIVE workshop safety rules that must be observed when working with tools.\n(b) What should you do immediately if an accident occurs in the workshop?', 12),
  subj('(a) What is a consumer?\n(b) Describe the rights of a consumer as outlined by consumer protection laws.\n(c) What steps should a consumer take when a product they bought is faulty?', 12),
  subj('(a) Explain the difference between primary, secondary, and tertiary industries. Give ONE Ghanaian example of each.\n(b) Why is it important for Ghana to develop its manufacturing (secondary) industry?', 12),
];

// ════════════════════════════════════════════════════════════════════════
// BASIC 9 — RME (Full Set)
// ════════════════════════════════════════════════════════════════════════
const RME_B9_OBJ = [
  obj('Which of the following BEST defines "religion"?', ['A set of political rules', 'A belief in and worship of a superhuman controlling power, typically a personal God or gods', 'A school subject', 'A local cultural festival'], 'A belief in and worship of a superhuman controlling power, typically a personal God or gods', 'medium'),
  obj('The Quran was compiled into its current form under which Caliph?', ['Abu Bakr', 'Umar', 'Uthman', 'Ali'], 'Uthman', 'hard'),
  obj('Which of the following is a basic teaching of Christianity?', ['There is no afterlife', 'Salvation comes through faith in Jesus Christ', 'Muhammad is the last prophet', 'Karma determines your next life'], 'Salvation comes through faith in Jesus Christ', 'medium'),
  obj('In African Traditional Religion, the "Supreme Being" in Akan tradition is called:', ['Allah', 'Yahweh', 'Onyame (Nyame)', 'Shiva'], 'Onyame (Nyame)', 'medium'),
  obj('The concept of the "Day of Judgment" is a core belief in:', ['Only Christianity', 'Only Islam', 'Both Christianity and Islam', 'African Traditional Religion only'], 'Both Christianity and Islam', 'medium'),
  obj('Which of the following correctly describes "morality"?', ['A government law', 'Principles concerning the distinction between right and wrong behaviour', 'A religious ceremony', 'Cultural dance tradition'], 'Principles concerning the distinction between right and wrong behaviour', 'easy'),
  obj('The United Nations declared 10th December as:', ['World Children\'s Day', 'Human Rights Day', 'World Health Day', 'International Peace Day'], 'Human Rights Day', 'hard'),
  obj('Which of the following is a direct cause of teenage pregnancy in Ghana?', ['Too much education', 'Peer pressure, poverty, and lack of proper sex education', 'Strong family values', 'Religious guidance'], 'Peer pressure, poverty, and lack of proper sex education', 'medium'),
  obj('The concept of "stewardship of the environment" from a religious viewpoint means:', ['Humans can use the Earth\'s resources without limits', 'Humans are caretakers of creation and must preserve it for future generations', 'Only scientists can protect the environment', 'Religion has nothing to do with the environment'], 'Humans are caretakers of creation and must preserve it for future generations', 'medium'),
  obj('Which of the following is an example of gender-based violence?', ['A woman winning a court case', 'A man being paid more than a woman for the same work', 'Girls attending school freely', 'Women voting in elections'], 'A man being paid more than a woman for the same work', 'medium'),
  obj('The Christian concept of "agape" refers to:', ['Romantic love', 'Unconditional, selfless love for all humanity', 'Love of money and material things', 'Love between family members only'], 'Unconditional, selfless love for all humanity', 'hard'),
  obj('Which of the following is consistent with the Islamic view on interest (Riba)?', ['Interest on loans is encouraged', 'Charging interest on loans is strictly prohibited', 'Interest is allowed in business', 'Interest should be very low'], 'Charging interest on loans is strictly prohibited', 'hard'),
  obj('A "conscience" is best described as:', ['A legal document', 'The inner sense that distinguishes what is right from what is wrong', 'A religious leader', 'A type of prayer'], 'The inner sense that distinguishes what is right from what is wrong', 'medium'),
  obj('Which of the following is a cause of religious conflict?', ['Mutual respect and dialogue', 'Misuse of religion to promote hatred and intolerance', 'Interfaith cooperation', 'Religious pluralism'], 'Misuse of religion to promote hatred and intolerance', 'medium'),
  obj('The concept of "Ubuntu" can be applied to national development because it emphasises:', ['Individual achievement above all', 'Community, mutual support, and collective responsibility', 'Competition and survival of the fittest', 'Wealth accumulation'], 'Community, mutual support, and collective responsibility', 'medium'),
  obj('Which of the following is a human trafficking red flag?', ['A child travelling alone with a valid passport to visit relatives', 'Someone offering a child a job far from home with accommodation and big pay immediately', 'A family moving legally to another country', 'A student applying for a scholarship abroad'], 'Someone offering a child a job far from home with accommodation and big pay immediately', 'medium'),
  obj('The parable of the "Good Samaritan" in the Bible teaches:', ['Avoid strangers at all costs', 'Show compassion and help others regardless of their background', 'Only help people of your religion', 'Stay in your own community'], 'Show compassion and help others regardless of their background', 'medium'),
  obj('Which of the following is an example of civic virtue?', ['Accepting bribes', 'Voting responsibly in elections', 'Spreading misinformation', 'Avoiding community service'], 'Voting responsibly in elections', 'easy'),
  obj('The Hajj, one of the Five Pillars of Islam, is to be performed at least once by:', ['Only religious leaders', 'Every Muslim who is physically and financially able', 'Men only', 'Those who have sinned'], 'Every Muslim who is physically and financially able', 'medium'),
  obj('Which of the following is a NEGATIVE effect of social media on morality?', ['Connecting people across the world', 'Sharing useful information', 'Cyberbullying and exposure to harmful content', 'Providing educational content'], 'Cyberbullying and exposure to harmful content', 'medium'),
  obj('The golden rule, common to many religions, states: "Treat others as:', ['"you want to treat them"', '"you would have them treat you"', '"your culture permits"', '"your religion only allows"'], '"you would have them treat you"', 'medium'),
  obj('Which of the following is an example of "positive peer influence"?', ['A friend encouraging you to skip school', 'A classmate motivating you to study harder', 'Friends pushing you to smoke', 'Peers daring you to steal'], 'A classmate motivating you to study harder', 'easy'),
  obj('The concept of "original sin" in Christianity refers to:', ['Personal sins we commit daily', 'The inherited human tendency to sin, traced back to Adam and Eve', 'Sins committed in a church', 'Sins that cannot be forgiven'], 'The inherited human tendency to sin, traced back to Adam and Eve', 'hard'),
  obj('Which of the following is a sign of a healthy family?', ['Constant arguments and lack of communication', 'Love, respect, open communication and mutual support', 'Parents ignoring children\'s emotional needs', 'Every person doing whatever they please'], 'Love, respect, open communication and mutual support', 'easy'),
  obj('Which of the following is a traditional Ghanaian value that promotes social cohesion?', ['Individualism and self-interest', 'Communalism and collective responsibility', 'Competition for resources', 'Secrecy and exclusion'], 'Communalism and collective responsibility', 'medium'),
  obj('Ananase stories in Ghanaian culture serve the moral purpose of:', ['Entertainment only without any message', 'Teaching moral lessons through the experiences of characters', 'Scaring children into obedience', 'Glorifying foolish behaviour'], 'Teaching moral lessons through the experiences of characters', 'medium'),
  obj('Which of the following reflects the concept of "restorative justice"?', ['Punishing offenders as harshly as possible', 'Focussing on rehabilitation, reconciliation, and repairing relationships', 'Imprisoning offenders without any hearing', 'Ignoring the harm caused to victims'], 'Focussing on rehabilitation, reconciliation, and repairing relationships', 'hard'),
  obj('Which of the following is a right of the child under the UN Convention on the Rights of the Child?', ['Right to own property', 'Right to protection from abuse, neglect and exploitation', 'Right to vote', 'Right to run for president'], 'Right to protection from abuse, neglect and exploitation', 'easy'),
  obj('Which of the following correctly describes "religious fundamentalism"?', ['A balanced and moderate approach to religion', 'Strict, literal interpretation of religious texts, sometimes leading to extremism', 'Interfaith dialogue and cooperation', 'Secular rejection of all religion'], 'Strict, literal interpretation of religious texts, sometimes leading to extremism', 'hard'),
  obj('In Islam, the concept of "Tawbah" means:', ['A pilgrimage to Mecca', 'Repentance and returning to God after sin', 'A form of prayer', 'The Day of Judgment'], 'Repentance and returning to God after sin', 'hard'),
  obj('Which of the following best describes "integrity" in leadership?', ['Making decisions that only benefit yourself', 'Having and showing strong moral principles; doing what is right even when no one is watching', 'Pretending to be honest in public', 'Following the rules only when supervised'], 'Having and showing strong moral principles; doing what is right even when no one is watching', 'medium'),
  obj('Which institution in Ghana is responsible for promoting human rights education?', ['Ghana Police Service', 'NCCE (National Commission for Civic Education)', 'Ghana Revenue Authority', 'Ghana Education Service'], 'NCCE (National Commission for Civic Education)', 'medium'),
  obj('Which of the following is a moral responsibility of parents towards their children?', ['Leaving children to raise themselves', 'Providing love, education, food and guidance', 'Using children for commercial labour', 'Favouring one child over others always'], 'Providing love, education, food and guidance', 'easy'),
  obj('Which of the following describes "secularism" in governance?', ['The state is run according to religious laws', 'Religion and government are separated; the state is neutral on religion', 'Only Christians can govern', 'Only Islamic law applies in courts'], 'Religion and government are separated; the state is neutral on religion', 'hard'),
  obj('Which of the following is a correct way of promoting peace in a multi-ethnic community?', ['Encouraging tribalism', 'Celebrating cultural differences and promoting dialogue', 'Spreading rumours about other groups', 'Restricting people from practising their religion'], 'Celebrating cultural differences and promoting dialogue', 'easy'),
  obj('According to the Christian faith, what happened on the Day of Pentecost?', ['Jesus was baptised', 'Jesus rose from the dead', 'The Holy Spirit descended on the disciples', 'Jesus performed his first miracle'], 'The Holy Spirit descended on the disciples', 'hard'),
  obj('The NHIA in Ghana stands for:', ['National Health Insurance Authority', 'National Higher Institution of Arts', 'Northern Health Information Agency', 'National Human Investment Act'], 'National Health Insurance Authority', 'medium'),
  obj('A "covenant" in religious context refers to:', ['A contract of employment', 'A solemn agreement or promise between God and human beings', 'A religious celebration', 'A type of prayer'], 'A solemn agreement or promise between God and human beings', 'medium'),
  obj('Which of the following shows that someone is applying the moral value of honesty?', ['Copying in an exam and denying it', 'Telling the teacher about a mistake in your marks', 'Hiding a wrongdoing from parents', 'Pretending to understand something you don\'t'], 'Telling the teacher about a mistake in your marks', 'easy'),
  obj('The concept of "tithing" in Christianity involves:', ['Fasting for 30 days', 'Giving one-tenth of your income to the church', 'Going on a pilgrimage', 'Baptism in a river'], 'Giving one-tenth of your income to the church', 'medium'),
];

const RME_B9_SUBJ = [
  subj('(a) Compare and contrast the concept of God in Christianity, Islam, and African Traditional Religion.\n(b) Despite these differences, what common values do these three religions teach their followers?', 15),
  subj('(a) What is corruption? Describe its effects on Ghana\'s development using TWO examples.\n(b) What do the three main religions (Christianity, Islam, Traditional Religion) teach about honesty and integrity? Quote ONE teaching from each religion.', 15),
  subj('(a) Define human trafficking and explain how it differs from legal migration.\n(b) State FOUR causes of human trafficking in Ghana.\n(c) As a moral citizen, what THREE actions would you take to help fight human trafficking in your community?', 15),
  subj('Discuss the moral and religious arguments for and against the following social issues in Ghana:\n(a) Early (teenage) marriage\n(b) Female Genital Mutilation (FGM)\nFor each issue, state what religious teachings say, and give your personal moral stand with reasons.', 15),
  subj('(a) What is "gender equality" and why is it important?\n(b) How do Christian, Islamic, and African Traditional religious teachings view the roles of men and women?\n(c) How can schools and religious communities promote gender equality?', 12),
  subj('(a) Explain what "conscience" is.\n(b) Describe a moral dilemma (a difficult choice between right and wrong) that a JHS student might face.\n(c) Using a moral framework from ANY religion, explain the best course of action and why.', 12),
  subj('Write an essay of about 200 words on the topic: "Religion as a force for good in Ghanaian society." In your essay, use examples from at least TWO of the three main religions practised in Ghana.', 15),
];

// ════════════════════════════════════════════════════════════════════════
// BASIC 7 — Mathematics
// ════════════════════════════════════════════════════════════════════════
const MATHS_B7_OBJ = [
  obj('Evaluate: 3 + 4 × 2 − 1', ['13', '14', '10', '5'], '10', 'medium'),
  obj('What is the value of 2⁵?', ['10', '16', '32', '64'], '32', 'easy'),
  obj('Find the LCM of 6 and 8:', ['12', '24', '48', '6'], '24', 'medium'),
  obj('Simplify: 3/4 + 1/2', ['4/6', '5/4', '4/4', '7/8'], '5/4', 'medium'),
  obj('What is 15% of 200?', ['15', '20', '25', '30'], '30', 'easy'),
  obj('The sum of angles in a triangle is:', ['90°', '180°', '270°', '360°'], '180°', 'easy'),
  obj('What is the perimeter of a rectangle with length 8 cm and width 5 cm?', ['13 cm', '26 cm', '40 cm', '20 cm'], '26 cm', 'medium'),
  obj('Which of the following is a prime number between 20 and 30?', ['21', '23', '25', '27'], '23', 'medium'),
  obj('Simplify: 5x + 3 − 2x + 7', ['3x + 10', '7x + 10', '3x − 10', '7x − 10'], '3x + 10', 'medium'),
  obj('Convert 0.75 to a fraction:', ['3/4', '7/5', '3/5', '7/10'], '3/4', 'easy'),
  obj('What is the area of a triangle with base 10 cm and height 6 cm?', ['16 cm²', '30 cm²', '60 cm²', '20 cm²'], '30 cm²', 'medium'),
  obj('If x = 3, find the value of 4x² − 5:', ['31', '36', '31', '40'], '31', 'hard'),
  obj('What is the gradient of y = 2x + 5?', ['5', '2', '7', '3'], '2', 'easy'),
  obj('Find the HCF of 18 and 24:', ['3', '6', '9', '12'], '6', 'medium'),
  obj('Convert 2.5 hours to minutes:', ['25 min', '100 min', '150 min', '125 min'], '150 min', 'easy'),
  obj('A bag has 6 red marbles and 4 blue marbles. What is the probability of picking a blue marble?', ['2/5', '3/5', '4/6', '1/4'], '2/5', 'medium'),
  obj('Which of the following is an irrational number?', ['0.5', '4/9', '√5', '2.25'], '√5', 'hard'),
  obj('What is 3/5 of 200?', ['60', '80', '100', '120'], '120', 'easy'),
  obj('In a class of 40 students, 25% are absent. How many students are present?', ['10', '25', '30', '35'], '30', 'medium'),
  obj('What is 1000 ÷ 25?', ['25', '40', '50', '100'], '40', 'easy'),
  obj('The number of diagonals in a hexagon is:', ['3', '6', '9', '12'], '9', 'hard'),
  obj('The mean of 10, 15, 20, 25, 30 is:', ['18', '20', '22', '25'], '20', 'easy'),
  obj('Solve: x/3 = 9', ['3', '12', '27', '30'], '27', 'easy'),
  obj('A worker earns GH¢840 per month. If she saves 15%, how much does she save monthly?', ['GH¢84', 'GH¢120', 'GH¢126', 'GH¢140'], 'GH¢126', 'medium'),
  obj('What is 3.6 × 10²?', ['36', '360', '3600', '0.036'], '360', 'medium'),
  obj('Which of these angles is reflex?', ['40°', '90°', '180°', '270°'], '270°', 'medium'),
  obj('What is the volume of a cuboid with length 5 m, width 4 m, and height 3 m?', ['12 m³', '20 m³', '60 m³', '47 m³'], '60 m³', 'medium'),
  obj('Solve: 2x − 3 = 11', ['5', '6', '7', '8'], '7', 'easy'),
  obj('A recipe needs 2.5 kg of flour to make 20 cookies. How much flour is needed for 30 cookies?', ['3 kg', '3.5 kg', '3.75 kg', '4 kg'], '3.75 kg', 'hard'),
  obj('Express 45 as a product of prime factors:', ['3 × 15', '5 × 9', '3² × 5', '3 × 5²'], '3² × 5', 'hard'),
  obj('What is the complement of 52°?', ['38°', '128°', '48°', '308°'], '38°', 'medium'),
  obj('A car increases its speed from 40 km/h to 60 km/h in 5 seconds. What is its acceleration?', ['4 km/h/s', '100 km/h/s', '8 km/h/s', '2 km/h/s'], '4 km/h/s', 'hard'),
  obj('Which of the following has the highest value?', ['2/3', '3/4', '5/8', '7/10'], '3/4', 'medium'),
  obj('What is the circumference of a circle with diameter 14 cm? (π = 22/7)', ['22 cm', '44 cm', '88 cm', '154 cm'], '44 cm', 'medium'),
  obj('If 5 shirts cost GH¢75, what is the cost of 8 shirts?', ['GH¢100', 'GH¢105', 'GH¢120', 'GH¢150'], 'GH¢120', 'medium'),
  obj('What is 12.5% expressed as a decimal?', ['0.0125', '0.125', '1.25', '12.5'], '0.125', 'easy'),
  obj('The mode of the data set: 5, 3, 7, 3, 8, 5, 3 is:', ['5', '3', '7', '8'], '3', 'easy'),
  obj('Factorise: 6x + 9', ['3(2x + 3)', '6(x + 3)', '9(6x + 1)', '3(x + 9)'], '3(2x + 3)', 'medium'),
  obj('A man walks 5 km East then 12 km North. What is his straight-line distance from the start?', ['13 km', '15 km', '17 km', '7 km'], '13 km', 'hard'),
  obj('Which of the following represents an equation?', ['3x + 2', '5y − 7 = 8', '4a²', '2b + 1'], '5y − 7 = 8', 'easy'),
];

const MATHS_B7_SUBJ = [
  subj('(a) Factorise: 12a² − 18ab\n(b) Solve: 3x + 5 = 20\n(c) If y = x² − 2x + 1, find y when x = 4', 15, 'For (a) find the common factor first.'),
  subj('A school has 500 students. 40% are girls.\n(a) How many girls are there?\n(b) If 20% of the boys are prefects, how many boy prefects are there?\n(c) What fraction of the total students are boy prefects? Express in simplest form.', 15),
  subj('The test scores of 10 students in a maths test are: 56, 73, 85, 90, 56, 60, 85, 73, 90, 56.\n(a) Find the mean score.\n(b) Find the median score.\n(c) Find the mode.\n(d) What is the range?', 15),
  subj('(a) Construct a triangle PQR where PQ = 7 cm, QR = 9 cm, and angle PQR = 60°.\n(b) Measure and state the length of PR.\n(c) Is triangle PQR a right-angled triangle? Show how you determined this.', 15),
  subj('Kofi bought a pair of shoes for GH¢250 and sold them for GH¢325.\n(a) Calculate his profit.\n(b) Calculate the profit as a percentage of the cost price.\n(c) If he then offers the buyer a 5% discount on the selling price, how much does the buyer pay?', 15),
  subj('(a) A cylindrical tank has a radius of 2.5 m and a height of 8 m. Calculate its volume. (π = 22/7)\n(b) If 1 m³ = 1000 litres, how many litres of water can it hold?', 12),
  subj('Using the following data on how students travel to school (Walk: 45, Bus: 30, Car: 15, Bicycle: 10):\n(a) Calculate the angle each category would occupy in a pie chart.\n(b) Draw the pie chart.\n(c) What percentage of students walk to school?', 12),
];

// ════════════════════════════════════════════════════════════════════════
// BASIC 9 — French Language (Basic/Introductory Level)
// ════════════════════════════════════════════════════════════════════════
const FRENCH_B9_OBJ = [
  obj('"Bonjour" means:', ['Good night', 'Good morning / Hello', 'Goodbye', 'Thank you'], 'Good morning / Hello', 'easy'),
  obj('"Au revoir" means:', ['Hello', 'See you later / Goodbye', 'Please', 'Excuse me'], 'See you later / Goodbye', 'easy'),
  obj('How do you say "My name is Kwame" in French?', ['Je suis Kwame', 'Mon nom est Kwame', "Je m'appelle Kwame", 'Il appelle Kwame'], "Je m'appelle Kwame", 'easy'),
  obj('What is the French word for "school"?', ['Maison', 'École', 'Bureau', 'Bibliothèque'], 'École', 'easy'),
  obj('"J\'ai douze ans" means:', ['I have twelve things', 'I am twelve years old', 'Twelve people are here', 'I like twelve'], 'I am twelve years old', 'easy'),
  obj('The French article "le" is used before:', ['Feminine nouns', 'Masculine nouns', 'Plural nouns', 'Any noun beginning with a vowel'], 'Masculine nouns', 'medium'),
  obj('"Je voudrais de l\'eau, s\'il vous plaît" translates to:', ['I don\'t like water, please', 'I would like some water, please', 'I have water, please', 'Water is not nice, please'], 'I would like some water, please', 'medium'),
  obj('Which of the following is the correct French translation of "Where is the market?"', ['Quand est le marché?', 'Qui est le marché?', 'Où est le marché?', 'Comment est le marché?'], 'Où est le marché?', 'medium'),
  obj('What is "brother" in French?', ['Sœur', 'Frère', 'Père', 'Mère'], 'Frère', 'easy'),
  obj('"Je ne comprends pas" means:', ['I understand everything', 'I don\'t understand', 'I cannot speak', 'I need help please'], 'I don\'t understand', 'medium'),
  obj('How do you say "Thank you" in French?', ['Pardon', 'Merci', 'S\'il vous plaît', 'Excusez-moi'], 'Merci', 'easy'),
  obj('The French word for "teacher" (female) is:', ['Professeur', 'Professeure', 'Directeur', 'Élève'], 'Professeure', 'medium'),
  obj('Which number in French is "vingt"?', ['10', '12', '20', '30'], '20', 'easy'),
  obj('"Quelle heure est-il?" means:', ['What day is it?', 'What is your name?', 'Where are you going?', 'What time is it?'], 'What time is it?', 'medium'),
  obj('The French word for "today" is:', ['Hier', "Aujourd'hui", 'Demain', 'Maintenant'], "Aujourd'hui", 'easy'),
  obj('Which of the following is the correct negative form of "Je parle français"?', ['Je pas parle français', 'Je ne parle français pas', 'Je ne parle pas français', 'Je parle ne pas français'], 'Je ne parle pas français', 'hard'),
  obj('"Quel est ton sport favori?" asks about:', ['Your favourite food', 'Your favourite sport', 'Your favourite colour', 'Your favourite subject'], 'Your favourite sport', 'easy'),
  obj('The French verb "aller" means:', ['to eat', 'to speak', 'to go', 'to see'], 'to go', 'easy'),
  obj('"Il fait chaud" describes the weather as:', ['Cold and rainy', 'Windy', 'Hot', 'Cloudy'], 'Hot', 'easy'),
  obj('The plural of "le livre" (the book) is:', ['les livres', 'la livre', 'un livres', 'les livre'], 'les livres', 'medium'),
  obj('Which of these is a French-speaking African country?', ['Ghana', 'Nigeria', 'Kenya', 'Côte d\'Ivoire (Ivory Coast)'], "Côte d'Ivoire (Ivory Coast)", 'easy'),
  obj('"J\'aime manger le riz et le poulet" means:', ['I dislike rice and chicken', 'I love eating rice and chicken', 'I can\'t eat rice and chicken', 'Rice and chicken are expensive'], 'I love eating rice and chicken', 'easy'),
  obj('Which article is used before a feminine noun in French?', ['le', 'un', 'la', 'les'], 'la', 'easy'),
  obj('"Nous allons à l\'école" means:', ['We went to school yesterday', 'We are going to school', 'We don\'t like school', 'The school is far'], 'We are going to school', 'medium'),
  obj('How do you say "I live in Ghana" in French?', ['J\'habite au Ghana', 'Je vais au Ghana', 'J\'aime Ghana', 'Ghana est mon pays'], "J'habite au Ghana", 'medium'),
  obj('"Soixante-dix" is the French number for:', ['60', '70', '80', '90'], '70', 'hard'),
  obj('"Quel temps fait-il?" is asking about:', ['The current time', 'The weather', 'Your health', 'Your work'], 'The weather', 'medium'),
  obj('What is the French word for "hospital"?', ['Marché', 'Hôpital', 'École', 'Magasin'], 'Hôpital', 'easy'),
  obj('"Combien ça coûte?" translates to:', ['Where is it located?', 'How much does it cost?', 'What is that?', 'Do you have more?'], 'How much does it cost?', 'easy'),
  obj('Which of the following shows the correct use of "avoir" (to have)?', ['Ils suis fatigués', 'Nous avons deux frères', 'Elle est un livre', 'Tu êtes de Ghana'], 'Nous avons deux frères', 'hard'),
  obj('"Lundi" is which day of the week in French?', ['Sunday', 'Monday', 'Tuesday', 'Wednesday'], 'Monday', 'easy'),
  obj('The French word "ville" means:', ['Village', 'Country', 'City / Town', 'House'], 'City / Town', 'easy'),
  obj('"Je m\'appelle" literally means:', ['My name is written', 'I call myself', 'People call me', 'My name was'], 'I call myself', 'hard'),
  obj('"Vous" in French can mean:', ['I', 'You (formal/plural)', 'She', 'He'], 'You (formal/plural)', 'medium'),
  obj('The French word for "to speak" is:', ['Manger', 'Écrire', 'Parler', 'Lire'], 'Parler', 'easy'),
  obj('"Bonne nuit" means:', ['Good morning', 'Good afternoon', 'Good evening', 'Good night'], 'Good night', 'easy'),
  obj('Which is the correct way to ask "How old are you?" in French?', ['Quel âge as-tu?', 'Où es-tu?', 'Comment vas-tu?', 'Qu\'est-ce que tu as?'], 'Quel âge as-tu?', 'medium'),
  obj('"Il y a" in French means:', ['Here we are', 'There is / There are', 'He goes to', 'The sky is'], 'There is / There are', 'medium'),
  obj('The French equivalent of "the students" (masculine/mixed plural) is:', ['la étudiante', 'les étudiants', 'un étudiant', 'le étudiants'], 'les étudiants', 'medium'),
  obj('Which of the following correctly translates "I am hungry" into French?', ['J\'ai soif', 'J\'ai faim', 'Je suis faim', 'J\'ai chaud'], "J'ai faim", 'medium'),
];

const FRENCH_B9_SUBJ = [
  subj('(a) Write a short letter in French to your French pen pal, Emmanuel, introducing yourself. Include:\n   - Your name and age\n   - Your school and what class you are in\n   - Your favourite subject and hobby\n   - One thing you like about Ghana\n\n(Your letter should be at least 8 sentences.)', 20),
  subj('Translate the following sentences from English into French:\n(a) My family has four members.\n(b) I go to school every day by bus.\n(c) The market is near my house.\n(d) Ghana is a beautiful country.\n(e) I would like to visit France one day.', 15),
  subj('Answer the following questions in complete French sentences:\n(a) Comment t\'appelles-tu?\n(b) Quel âge as-tu?\n(c) Où habites-tu?\n(d) Quelle est ta matière préférée?\n(e) Combien de personnes y a-t-il dans ta famille?', 15),
  subj('Read the following dialogue and answer the questions in English:\n\nMarie: Bonjour, je m\'appelle Marie. Et toi?\nKofi: Bonjour Marie! Je m\'appelle Kofi. J\'ai quinze ans.\nMarie: Tu habites où?\nKofi: J\'habite à Accra, au Ghana. Et toi?\nMarie: J\'habite à Paris. J\'aime la France mais je voudrais visiter le Ghana un jour.\n\n(a) What is the girl\'s name?\n(b) How old is Kofi?\n(c) Where does Kofi live?\n(d) Where does Marie live?\n(e) What does Marie say she would like to do one day?', 15),
  subj('(a) Write the numbers 1–20 in French words.\n(b) Write the days of the week in French.\n(c) Write the months of the year in French.', 15),
  subj('Using French, describe your daily school routine. Include at least EIGHT activities from the time you wake up to when you go to bed. Use the correct times (e.g., "À sept heures...").', 15),
  subj('(a) Explain the importance of learning French for Ghanaian students.\n(b) Name FOUR French-speaking countries in West Africa.\n(c) Write THREE differences between French and English in terms of grammar (e.g., gender of nouns, placement of adjectives).', 15),
];

// ─── Builder function ───────────────────────────────────────────────────────
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
  buildExam({ title: 'Basic 4 Science — WAEC Mock Exam', desc: 'WAEC-style Science exam for Basic 4. Covers biology, physics, chemistry and the environment.', classLevel: 'Basic 4', subjectName: 'Science', mins: 90, objQ: SCI_B4_OBJ, subjQ: SCI_B4_SUBJ }),
  buildExam({ title: 'Basic 4 Social Studies — WAEC Mock Exam', desc: 'WAEC-style Social Studies exam for Basic 4. Covers Ghana\'s history, governance, environment and citizenship.', classLevel: 'Basic 4', subjectName: 'Social Studies', mins: 90, objQ: SOC_B4_OBJ, subjQ: SOC_B4_SUBJ }),
  buildExam({ title: 'Basic 4 RME — WAEC Mock Exam', desc: 'WAEC-style Religious & Moral Education exam for Basic 4. Covers the three main religions and moral values.', classLevel: 'Basic 4', subjectName: 'Religious & Moral Education', mins: 90, objQ: RME_B4_OBJ, subjQ: RME_B4_SUBJ }),
  buildExam({ title: 'Basic 7 Social Studies — WAEC Mock Exam', desc: 'WAEC-style Social Studies exam for JHS 1. Covers colonialism, democracy, environment and development.', classLevel: 'Basic 7', subjectName: 'Social Studies', mins: 120, objQ: SOC_B7_OBJ, subjQ: SOC_B7_SUBJ }),
  buildExam({ title: 'Basic 7 Mathematics — WAEC Mock Exam', desc: 'WAEC-style Mathematics exam for JHS 1. Covers number, algebra, geometry and statistics.', classLevel: 'Basic 7', subjectName: 'Mathematics', mins: 120, objQ: MATHS_B7_OBJ, subjQ: MATHS_B7_SUBJ }),
  buildExam({ title: 'Basic 7 RME — WAEC Mock Exam', desc: 'WAEC-style RME exam for JHS 1. Covers morality, religion, social issues and citizenship.', classLevel: 'Basic 7', subjectName: 'Religious & Moral Education', mins: 90, objQ: RME_B7_OBJ, subjQ: RME_B7_SUBJ }),
  buildExam({ title: 'Basic 9 Career Technology — WAEC BECE Mock Exam', desc: 'BECE-style Career Technology / BDT exam for JHS 3. Covers design process, food, wood/metalwork and entrepreneurship.', classLevel: 'Basic 9', subjectName: 'Career Technology', mins: 120, objQ: BDT_B9_OBJ, subjQ: BDT_B9_SUBJ }),
  buildExam({ title: 'Basic 9 French Language — WAEC BECE Mock Exam', desc: 'BECE-style French Language exam for JHS 3. Covers vocabulary, grammar, reading comprehension and writing.', classLevel: 'Basic 9', subjectName: 'French', mins: 120, objQ: FRENCH_B9_OBJ, subjQ: FRENCH_B9_SUBJ }),
  buildExam({ title: 'Basic 9 RME — WAEC BECE Mock Exam', desc: 'BECE-style Religious & Moral Education exam for JHS 3. Covers religion, ethics, social justice and national development.', classLevel: 'Basic 9', subjectName: 'Religious & Moral Education', mins: 90, objQ: RME_B9_OBJ, subjQ: RME_B9_SUBJ }),
];

async function run() {
  console.log('🎓 Seeding additional WAEC exams...\n');
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
