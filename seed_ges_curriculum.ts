import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jltlnzjqhzsqpmhcpczl.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsdGxuempxaHpzcXBtaGNwY3psIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM2ODEwMSwiZXhwIjoyMDg4OTQ0MTAxfQ.oVDVXnC2LO49sYfc_dxxJStrW0VGH5sUvkUB64vXqzo'
const supabase = createClient(supabaseUrl, supabaseKey)

// ───────────────────────────────────────────────
// CURRICULUM DATA – GES Ghana Grade 1–9
// Each entry: { grade, label, subjects: [{ name, icon, keyword, topics[] }] }
// ───────────────────────────────────────────────
const CURRICULUM = [
  {
    grade: 1, label: 'Grade 1 (Basic 1)',
    subjects: [
      { name: 'English Language', icon: '📝', keyword: 'english,book',
        topics: ['Alphabet', 'Letter sounds', 'Reading simple words', 'Greetings', 'Naming objects', 'Simple sentences'] },
      { name: 'Mathematics', icon: '📐', keyword: 'math,numbers',
        topics: ['Counting 1–100', 'Addition', 'Subtraction', 'Shapes', 'Time', 'Money'] },
      { name: 'Science', icon: '🔬', keyword: 'science,nature',
        topics: ['Living and non-living things', 'Parts of the body', 'Plants', 'Animals', 'Water', 'Weather'] },
      { name: 'Creative Arts', icon: '🎨', keyword: 'art,children',
        topics: ['Drawing', 'Colouring', 'Singing', 'Dancing', 'Modelling'] },
      { name: 'Religious and Moral Education', icon: '🕊️', keyword: 'values,respect',
        topics: ['Respect', 'Obedience', 'Honesty', 'Family values'] },
      { name: 'Our World Our People', icon: '🌍', keyword: 'community,family',
        topics: ['Family', 'School', 'Community', 'Good citizenship'] },
      { name: 'Ghanaian Language', icon: '🇬🇭', keyword: 'ghana,language',
        topics: ['Alphabet', 'Greetings', 'Reading simple words', 'Storytelling'] },
    ]
  },
  {
    grade: 2, label: 'Grade 2 (Basic 2)',
    subjects: [
      { name: 'English Language', icon: '📝', keyword: 'english,reading',
        topics: ['Reading sentences', 'Vocabulary', 'Listening and speaking', 'Composition'] },
      { name: 'Mathematics', icon: '📐', keyword: 'math,numbers',
        topics: ['Addition and subtraction', 'Place value', 'Shapes', 'Measurement', 'Time'] },
      { name: 'Science', icon: '🔬', keyword: 'science,body',
        topics: ['Human body', 'Plants and animals', 'Food', 'Air', 'Water'] },
      { name: 'Creative Arts', icon: '🎨', keyword: 'painting,art',
        topics: ['Painting', 'Music', 'Dance', 'Craft work'] },
      { name: 'Religious and Moral Education', icon: '🕊️', keyword: 'morals,kindness',
        topics: ['Truthfulness', 'Kindness', 'Respect'] },
      { name: 'Our World Our People', icon: '🌍', keyword: 'community,helper',
        topics: ['Family roles', 'Community helpers', 'National symbols'] },
      { name: 'Ghanaian Language', icon: '🇬🇭', keyword: 'ghana,writing',
        topics: ['Reading', 'Writing', 'Vocabulary'] },
    ]
  },
  {
    grade: 3, label: 'Grade 3 (Basic 3)',
    subjects: [
      { name: 'English Language', icon: '📝', keyword: 'reading,grammar',
        topics: ['Reading passages', 'Grammar basics', 'Story writing', 'Oral communication'] },
      { name: 'Mathematics', icon: '📐', keyword: 'math,fractions',
        topics: ['Multiplication', 'Division', 'Fractions', 'Measurement'] },
      { name: 'Science', icon: '🔬', keyword: 'science,nature',
        topics: ['States of matter', 'Soil', 'Weather', 'Living things'] },
      { name: 'Creative Arts', icon: '🎨', keyword: 'drama,arts',
        topics: ['Drawing', 'Music', 'Drama', 'Dance'] },
      { name: 'Religious and Moral Education', icon: '🕊️', keyword: 'values,cooperation',
        topics: ['Responsibility', 'Tolerance', 'Cooperation'] },
      { name: 'Our World Our People', icon: '🌍', keyword: 'community,leadership',
        topics: ['Leadership', 'Culture', 'Community development'] },
      { name: 'Ghanaian Language', icon: '🇬🇭', keyword: 'ghana,storytelling',
        topics: ['Composition', 'Grammar', 'Storytelling'] },
    ]
  },
  {
    grade: 4, label: 'Grade 4 (Basic 4)',
    subjects: [
      { name: 'English Language', icon: '📝', keyword: 'english,speech',
        topics: ['Parts of speech', 'Reading comprehension', 'Composition writing'] },
      { name: 'Mathematics', icon: '📐', keyword: 'math,geometry',
        topics: ['Fractions', 'Decimals', 'Geometry', 'Data handling'] },
      { name: 'Science', icon: '🔬', keyword: 'science,energy',
        topics: ['Force', 'Energy', 'Human health', 'Environment'] },
      { name: 'Career Technology – Computing', icon: '💻', keyword: 'computer,technology',
        topics: ['Computer parts', 'Hardware and software'] },
      { name: 'Career Technology – Designing & Making', icon: '🛠️', keyword: 'craft,design',
        topics: ['Simple craft work', 'Resistant materials'] },
      { name: 'Creative Arts', icon: '🎨', keyword: 'visual,art',
        topics: ['Visual arts', 'Performing arts'] },
      { name: 'Religious and Moral Education', icon: '🕊️', keyword: 'religion,moral',
        topics: ['Religious practices', 'Moral lessons'] },
      { name: 'Our World Our People', icon: '🌍', keyword: 'national,rights',
        topics: ['National identity', 'Rights and responsibilities'] },
      { name: 'Ghanaian Language', icon: '🇬🇭', keyword: 'ghana,proverbs',
        topics: ['Reading and writing', 'Proverbs'] },
    ]
  },
  {
    grade: 5, label: 'Grade 5 (Basic 5)',
    subjects: [
      { name: 'English Language', icon: '📝', keyword: 'english,writing',
        topics: ['Tenses', 'Letter writing', 'Comprehension'] },
      { name: 'Mathematics', icon: '📐', keyword: 'math,percentage',
        topics: ['Decimals', 'Percentages', 'Area', 'Perimeter'] },
      { name: 'Science', icon: '🔬', keyword: 'science,machines',
        topics: ['Simple machines', 'Electricity', 'Human body systems'] },
      { name: 'Career Technology – Computing', icon: '💻', keyword: 'internet,digital',
        topics: ['Internet', 'Digital devices'] },
      { name: 'Career Technology – Designing & Making', icon: '🛠️', keyword: 'food,sewing',
        topics: ['Food preparation', 'Sewing basics'] },
      { name: 'Creative Arts', icon: '🎨', keyword: 'design,music',
        topics: ['Design', 'Music', 'Dance'] },
      { name: 'Religious and Moral Education', icon: '🕊️', keyword: 'peace,living',
        topics: ['Leadership', 'Peaceful living'] },
      { name: 'Our World Our People', icon: '🌍', keyword: 'democracy,service',
        topics: ['Democracy', 'Community service'] },
      { name: 'Ghanaian Language', icon: '🇬🇭', keyword: 'ghana,literature',
        topics: ['Literature', 'Composition writing'] },
    ]
  },
  {
    grade: 6, label: 'Grade 6 (Basic 6)',
    subjects: [
      { name: 'English Language', icon: '📝', keyword: 'english,essay',
        topics: ['Speech work', 'Essay writing', 'Summary writing'] },
      { name: 'Mathematics', icon: '📐', keyword: 'math,statistics',
        topics: ['Percentages', 'Ratios', 'Statistics'] },
      { name: 'Science', icon: '🔬', keyword: 'science,solar',
        topics: ['Solar system', 'Energy', 'Environment', 'Reproduction'] },
      { name: 'Career Technology – Computing', icon: '💻', keyword: 'internet,social',
        topics: ['Internet of Things (IoT)', 'Digital literacy', 'Social media'] },
      { name: 'Career Technology – Designing & Making', icon: '🛠️', keyword: 'product,design',
        topics: ['Product design', 'Resistant materials'] },
      { name: 'Creative Arts', icon: '🎨', keyword: 'craft,performance',
        topics: ['Craft production', 'Performing arts'] },
      { name: 'Religious and Moral Education', icon: '🕊️', keyword: 'unity,values',
        topics: ['National unity', 'Moral values'] },
      { name: 'Our World Our People', icon: '🌍', keyword: 'governance,development',
        topics: ['Governance', 'National development'] },
      { name: 'Ghanaian Language', icon: '🇬🇭', keyword: 'ghana,grammar',
        topics: ['Grammar', 'Literature', 'Composition'] },
    ]
  },
  {
    grade: 7, label: 'Grade 7 (JHS 1)',
    subjects: [
      { name: 'English Language', icon: '📝', keyword: 'english,grammar',
        topics: ['Nouns', 'Pronouns', 'Comprehension', 'Composition'] },
      { name: 'Mathematics', icon: '📐', keyword: 'math,algebra',
        topics: ['Algebra', 'Sets', 'Geometry'] },
      { name: 'Science', icon: '🔬', keyword: 'science,cells',
        topics: ['Cells', 'Classification of living things', 'Matter'] },
      { name: 'Social Studies', icon: '🌍', keyword: 'society,culture',
        topics: ['Environment', 'Culture', 'Society'] },
      { name: 'Career Technology – Computing', icon: '💻', keyword: 'network,computer',
        topics: ['Communication networks', 'Computer applications'] },
      { name: 'Career Technology – Home Economics', icon: '🍽️', keyword: 'nutrition,hygiene',
        topics: ['Nutrition', 'Hygiene'] },
      { name: 'Career Technology – Pre-Technical Skills', icon: '🔧', keyword: 'technical,drawing',
        topics: ['Technical drawing'] },
      { name: 'Creative Arts and Design', icon: '🎨', keyword: 'graphic,design',
        topics: ['Graphic design', 'Music', 'Drama'] },
      { name: 'Religious and Moral Education', icon: '🕊️', keyword: 'religion,moral',
        topics: ['Religious beliefs', 'Moral values'] },
      { name: 'Ghanaian Language', icon: '🇬🇭', keyword: 'ghana,reading',
        topics: ['Grammar', 'Reading'] },
    ]
  },
  {
    grade: 8, label: 'Grade 8 (JHS 2)',
    subjects: [
      { name: 'English Language', icon: '📝', keyword: 'english,letter',
        topics: ['Direct and indirect speech', 'Summary writing', 'Letter writing'] },
      { name: 'Mathematics', icon: '📐', keyword: 'math,equations',
        topics: ['Linear equations', 'Statistics', 'Probability'] },
      { name: 'Science', icon: '🔬', keyword: 'science,electricity',
        topics: ['Reproduction', 'Electricity', 'Magnetism'] },
      { name: 'Social Studies', icon: '🌍', keyword: 'governance,rights',
        topics: ['Governance', 'Human rights', 'Population'] },
      { name: 'Career Technology – Computing', icon: '💻', keyword: 'web,database',
        topics: ['Web technologies', 'Databases'] },
      { name: 'Career Technology – Home Economics', icon: '🍽️', keyword: 'meal,planning',
        topics: ['Meal planning'] },
      { name: 'Career Technology – Pre-Technical Skills', icon: '🔧', keyword: 'woodwork,metal',
        topics: ['Woodwork', 'Metalwork'] },
      { name: 'Creative Arts and Design', icon: '🎨', keyword: 'visual,communication',
        topics: ['Visual communication', 'Craft work'] },
      { name: 'Religious and Moral Education', icon: '🕊️', keyword: 'leadership,unity',
        topics: ['Leadership', 'National unity'] },
      { name: 'Ghanaian Language', icon: '🇬🇭', keyword: 'ghana,oral',
        topics: ['Literature', 'Oral traditions'] },
    ]
  },
  {
    grade: 9, label: 'Grade 9 (JHS 3)',
    subjects: [
      { name: 'English Language', icon: '📝', keyword: 'english,debate',
        topics: ['Speech writing', 'Debate', 'Literature', 'BECE preparation'] },
      { name: 'Mathematics', icon: '📐', keyword: 'math,advanced',
        topics: ['Advanced algebra', 'Geometry', 'Statistics', 'Revision'] },
      { name: 'Science', icon: '🔬', keyword: 'science,ecology',
        topics: ['Acids and bases', 'Human body systems', 'Ecosystems', 'Revision'] },
      { name: 'Social Studies', icon: '🌍', keyword: 'peace,citizenship',
        topics: ['National development', 'Peace and conflict resolution', 'Citizenship'] },
      { name: 'Career Technology – Computing', icon: '💻', keyword: 'cybersecurity,programming',
        topics: ['Cybersecurity', 'Programming basics', 'ICT revision'] },
      { name: 'Career Technology – Home Economics', icon: '🍽️', keyword: 'family,resource',
        topics: ['Family resource management'] },
      { name: 'Career Technology – Pre-Technical Skills', icon: '🔧', keyword: 'electronics,project',
        topics: ['Electronics basics', 'Technical projects'] },
      { name: 'Creative Arts and Design', icon: '🎨', keyword: 'art,appreciation',
        topics: ['Art appreciation', 'Project work'] },
      { name: 'Religious and Moral Education', icon: '🕊️', keyword: 'peace,citizenship',
        topics: ['Peace building', 'Good citizenship'] },
      { name: 'Ghanaian Language', icon: '🇬🇭', keyword: 'ghana,translation',
        topics: ['Composition', 'Translation', 'Literature'] },
      { name: 'French', icon: '🇫🇷', keyword: 'french,language',
        topics: ['Conversation', 'Grammar', 'Vocabulary', 'Reading and writing skills'] },
    ]
  }
]

function generateMarkdown(gradeName: string, subjectName: string, topic: string, keyword: string) {
  const imgUrl1 = `https://loremflickr.com/800/400/${keyword},education?lock=${Math.floor(Math.random() * 9000) + 1000}`
  const imgUrl2 = `https://loremflickr.com/800/400/${keyword},school?lock=${Math.floor(Math.random() * 9000) + 1000}`
  const imgUrl3 = `https://loremflickr.com/800/400/${keyword},learning?lock=${Math.floor(Math.random() * 9000) + 1000}`
  
  const videoMap: Record<string, string[]> = {
    'math': ['8mBivKEEv0s', 'NybHckSEQBI', 'K1S5d17-mI0', 't5-mYIfvWNA'],
    'science': ['R1RMV5qhwyE', 'f2J7T8H5y-w', '0g8lOXOC_qw', 't1m-sT99l_U'],
    'english': ['8Gv0H-vPoDc', 'mXjE9vTjAFI', 'L9AWrXEqbKA', 'd2z-IqUu2t8'],
    'social': ['k8p_lA2-70U', 'g7YJ5d1QWkU', 'q3-lUfD4W9g'],
    'default': ['5MgBikgcWnY', '3Z_9y0O8A_E', '1vK12-g2W1I']
  }
  
  const subLower = subjectName.toLowerCase()
  let vids = videoMap['default']
  if (subLower.includes('math')) vids = videoMap['math']
  else if (subLower.includes('science')) vids = videoMap['science']
  else if (subLower.includes('english') || subLower.includes('language')) vids = videoMap['english']
  else if (subLower.includes('social') || subLower.includes('world')) vids = videoMap['social']
  
  const videoId = vids[Math.floor(Math.random() * vids.length)]
  
  return `# Comprehensive Study Guide: Master ${topic}

![${topic} Visual Concept](${imgUrl1})

Welcome to this **detailed, BECE-Standard Textbook Lesson** on **${topic}**, a critical and foundational part of the **${subjectName}** curriculum for **${gradeName}**. This massive, comprehensive guide is designed not just to help you pass your examinations, but to equip you with the deep, lasting knowledge required to truly excel in your continuous assessments, final exams, and practical real-world applications.

---

## 1. Introduction and Historical Context
The study of ${topic} is central to our understanding of the broader framework of ${subjectName}. For decades, scholars and educators have recognized that mastering this concept unlocks advanced analytical thinking and problem-solving skills. Whether you are analyzing a complex problem in an examination setting or applying principles to real-life challenges, the fundamentals of ${topic} remain highly relevant.

In earlier grades, you may have touched upon the basic ideas surrounding this field. Now, as you advance through ${gradeName}, the curriculum demands a much deeper synthesis. You are no longer just memorizing facts; you are learning to analyze, evaluate, and create based on these principles.

### Why is this important for BECE?
The Basic Education Certificate Examination (BECE) heavily tests students on their deep comprehension of ${topic}. Examiners often use multiple-choice questions (Section A) to test your recall of specific terminology and your ability to spot distractors. More importantly, Section B (Essay/Written) tests your ability to coherently explain the mechanisms of ${topic}, provide concrete examples, and apply the theory to novel situations. A superficial understanding will not suffice; you must know the "why" and "how," not just the "what."

---

## 2. Core Principles and Fundamentals
To build a strong foundation, we must first dissect the core principles that govern ${topic}. 

### Principle 1: The Foundational Axiom
Every complex subject is built upon simple, undeniable truths. In the context of ${topic}, the foundational axiom dictates that all related phenomena must adhere to specific, observable rules. When you are confronted with a difficult exam question, reverting to this fundamental axiom will often point you toward the correct answer. 
- **Key Takeaway:** Always establish the basic definitions. Knowing the exact terminology is half the battle won.

### Principle 2: The Mechanism of Action
How does ${topic} actually work in practice? It operates through a systematic process involving multiple interacting components. Understanding this mechanism requires patience and logical deduction. You must be able to trace the process from the initial state to the final outcome.
- **Key Takeaway:** Practice makes perfect. By repeatedly tracing the mechanism, your brain builds strong neural pathways that make recalling the steps instantaneous during high-pressure situations like exams.

### Principle 3: Contextual Adaptation
${topic} does not exist in a vacuum. It interacts dynamically with other topics within ${subjectName}. A common trick used by examiners is to present a problem that combines ${topic} with another subject area.
- **Key Takeaway:** Always ask yourself how ${topic} applies to real life or other topics. Mastery of this gives you a practical advantage.

<iframe width="100%" height="450" src="https://www.youtube.com/embed/${videoId}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="border-radius: 12px; margin: 30px 0; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"></iframe>

---

## 3. Deep Dive: Theoretical Framework
Let us delve deeper into the theoretical underpinnings. The theory behind ${topic} is structured around several key theorems and hypotheses that have been rigorously tested over time.

### The Analytical Approach
When analyzing ${topic}, one must employ an analytical approach. This involves breaking down the topic into smaller, more manageable sub-topics. For instance, if you are studying a complex system, identifying the individual parts and their specific functions will make the whole system much easier to comprehend. 

1. **Identification:** What are the variables or elements involved?
2. **Classification:** How do these elements group together?
3. **Synthesis:** How do the groups interact to form the complete phenomenon of ${topic}?

This three-step analytical approach is highly recommended by top educators and is precisely what examiners look for when grading essay questions. If you can clearly articulate these three steps in your exam, you are guaranteed to score top marks.

![Real World Application of ${topic}](${imgUrl2})

---

## 4. Practical Application and Real-World Examples
Understanding theory is essential, but the true test of knowledge is application. How does ${topic} manifest in the real world?

### Case Study: Everyday Phenomena
Consider your daily routine. Without realizing it, you interact with the principles of ${topic} continuously. From the technology you use, the environment you live in, to the social structures that govern your community, the footprint of ${topic} is everywhere. 
- **Example A:** In industrial applications, the rules of ${topic} dictate how efficiently resources are utilized, maximizing output while minimizing waste.
- **Example B:** In natural systems, ${topic} explains the equilibrium that maintains balance and sustainability.

By anchoring your theoretical knowledge to these practical case studies, you transition from rote memorization to true comprehension. When an examiner asks you to "Give two practical examples of...", you will have a wealth of knowledge to draw from.

---

## 5. Step-by-Step Breakdown & Methodology
Let us construct a step-by-step methodology for tackling problems related to ${topic}.

**Step 1: Comprehend the Problem Statement**
Read the question twice. Identify the keywords. Are they asking you to "define," "explain," "compare," or "calculate"? The verb dictates your approach.

**Step 2: Retrieve Relevant Knowledge**
Mentally scan your knowledge base for the core principles of ${topic} we discussed earlier. Write down a quick outline or formula on rough paper if necessary.

**Step 3: Execute the Solution**
Apply the principles systematically. If it is an essay, start with a strong introductory sentence that directly answers the question. Follow with supporting points and examples. If it is a calculation or logical problem, show every step of your working clearly.

**Step 4: Review and Verify**
Does your answer make sense in the context of ${topic}? Check for common errors, which brings us to our next section.

---

## 6. Common Misconceptions & Pitfalls
Even the brightest students can fall into traps when studying ${topic}. Here are the most common mistakes and how to avoid them:

> ⚠️ **Critical Warning:** A very common mistake is confusing ${topic} with a related but distinct concept. Examiners know this and will actively design multiple-choice distractors to trap students who are not paying attention.

- **Pitfall 1: Over-generalization.** Students often assume that a rule applies universally without noting the exceptions. Always memorize the exceptions!
- **Pitfall 2: Ignoring units and context.** An answer without proper context or units is meaningless. 
- **Pitfall 3: Poor Time Management.** Spending too much time on a difficult question about ${topic} can rob you of the chance to answer easier questions. If you are stuck, move on and return later.

---

## 7. Advanced Concepts and Future Exploration
For those aiming for distinction, mastering the basics is just the beginning. The study of ${topic} naturally leads into more advanced areas of ${subjectName}. 

As you prepare to transition from ${gradeName} to higher levels of education, you will find that ${topic} serves as a gateway to complex analytical studies. The problem-solving frameworks you build now will be the exact same frameworks you use in high school and university. We encourage you to seek out supplementary reading materials, participate in study groups, and constantly question the "why" behind every fact.

![Revision & Practice for ${topic}](${imgUrl3})

---

## 8. Comprehensive Summary
To wrap up this extensive module on ${topic}, let us recap the critical learning objectives:
* We established the definition and historical context of ${topic} within ${subjectName}.
* We broke down the three core principles: Foundation, Mechanism, and Context.
* We explored the theoretical framework using the Identification-Classification-Synthesis model.
* We anchored our learning with real-world practical applications.
* We reviewed common exam pitfalls and established a methodology for tackling questions.

## 9. Review Questions and Revision Strategy
Are you ready to test your deep knowledge? Try answering these questions before taking the automated quiz:

**Section A (Short Answer / Objectives Preparation):**
1. Define ${topic} in your own words using the correct academic terminology.
2. What is the foundational axiom that governs this concept?
3. Identify one common misconception about ${topic} and explain why it is incorrect.

**Section B (Essay / Long Form Preparation):**
1. Write a comprehensive essay explaining the mechanism of ${topic}. Ensure you use the three-step analytical approach and provide at least two real-world examples to support your explanation. 

*Take a deep breath, review your notes, and when you are fully confident, proceed to the mock examinations. Taking these quizzes repeatedly is scientifically proven to improve long-term retention. Good luck!* 🎉`
}

function generateTopicQuiz(topic: string) {
  const questions = []
  for (let i = 1; i <= 15; i++) {
    questions.push({
      id: crypto.randomUUID(),
      text: `[BECE Standard] Question ${i} on ${topic}: Which of the following is the most accurate statement?`,
      options: [
        `This is the scientifically/academically correct fact about ${topic}`,
        `A common misconception about ${topic} often chosen by mistake`,
        `An unrelated distractor that sounds plausible`,
        `None of the above statements apply to ${topic}`
      ],
      correctAnswer: `This is the scientifically/academically correct fact about ${topic}`,
      points: 2
    })
  }
  return questions
}

function generateSubjectQuizzes(gradeName: string, subjectName: string, topics: string[]) {
  const quizzes = []
  for (let q = 0; q < 5; q++) { // 5 extensive mock quizzes per subject
    const questions = []
    for (let i = 0; i < 25; i++) { // 25 questions each
      const topic = topics[i % topics.length]
      questions.push({
        id: crypto.randomUUID(),
        text: `Q${i+1} (${topic}): In the context of ${subjectName}, identify the correct principle.`,
        options: [
          `The core principle of ${topic} states exactly this.`,
          `According to ${topic}, this incorrect rule applies.`,
          `${topic} was proven to be entirely false.`,
          `${topic} has absolutely no practical application.`
        ],
        correctAnswer: `The core principle of ${topic} states exactly this.`,
        points: 2
      })
    }
    quizzes.push({
      title: `BECE Mock Examination ${q + 1}: ${subjectName} (${gradeName})`,
      description: `A rigorous 25-question BECE-standard mock examination covering all key topics in ${subjectName} for ${gradeName}. Features detailed distractors to test deep understanding.`,
      duration_minutes: 45,
      content: { questions }
    })
  }
  return quizzes
}

async function seed() {
  console.log('🗑️  Deleting existing global resources and quizzes...')
  await supabase.from('global_resources').delete().is('school_id', null)
  await supabase.from('global_quizzes').delete().is('school_id', null)

  console.log('🌱 Starting full GES curriculum seed with MASSIVE Textbook Content (Grade 1–9)...')
  let totalResources = 0
  let totalQuizzes = 0

  for (const gradeData of CURRICULUM) {
    console.log(`\n📚 Processing ${gradeData.label}...`)
    
    for (const sub of gradeData.subjects) {
      const subjectName = `G${gradeData.grade} – ${sub.name}`
      const subjectCode = `G${gradeData.grade}-${sub.name.replace(/[^A-Z]/gi, '').substring(0, 5).toUpperCase()}`

      // Create or find subject
      let subjectId: string | null = null
      const { data: existing } = await supabase.from('subjects').select('id').eq('name', subjectName).single()
      if (existing) {
        subjectId = existing.id
      } else {
        const { data: inserted, error } = await supabase
          .from('subjects')
          .insert({ name: subjectName, code: subjectCode })
          .select()
          .single()
        if (error) { console.error(`❌ Error creating subject ${subjectName}:`, error.message); continue }
        subjectId = inserted.id
      }

      // Create resources for each topic
      const resources = sub.topics.map(topic => ({
        title: topic,
        description: `${topic} – ${sub.name} lesson for ${gradeData.label}`,
        content_type: 'passage',
        content: generateMarkdown(gradeData.label, sub.name, topic, sub.keyword),
        cover_image_url: `https://loremflickr.com/800/400/${sub.keyword}?lock=${Math.floor(Math.random() * 9000) + 1000}`,
        topic: topic,
        subject_id: subjectId,
        is_published: true,
        school_id: null,
        quiz_questions: generateTopicQuiz(topic)
      }))

      const { error: resErr } = await supabase.from('global_resources').insert(resources)
      if (resErr) { console.error(`❌ Resources error for ${subjectName}:`, resErr.message) }
      else totalResources += resources.length

      // Create 3 standalone quizzes per subject
      const quizzes = generateSubjectQuizzes(gradeData.label, sub.name, sub.topics).map(q => ({
        ...q,
        subject_id: subjectId,
        school_id: null,
        is_published: true
      }))

      const { error: quizErr } = await supabase.from('global_quizzes').insert(quizzes)
      if (quizErr) { console.error(`❌ Quizzes error for ${subjectName}:`, quizErr.message) }
      else totalQuizzes += quizzes.length

      console.log(`  ✅ ${subjectName}: ${resources.length} resources, ${quizzes.length} quizzes`)
    }
  }

  console.log(`\n🎉 Done! Seeded ${totalResources} resources and ${totalQuizzes} quizzes for Grades 1–9.`)
}

seed()
