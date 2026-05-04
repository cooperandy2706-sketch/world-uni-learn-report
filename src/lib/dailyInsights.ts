// src/lib/dailyInsights.ts

export interface DailyInsight {
  quote: {
    text: string;
    author: string;
  };
  word: {
    term: string;
    definition: string;
    example: string;
  };
}

const insights: DailyInsight[] = [
  {
    quote: { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
    word: { term: "Resilience", definition: "The capacity to recover quickly from difficulties; toughness.", example: "Her resilience helped her overcome the academic challenges." }
  },
  {
    quote: { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
    word: { term: "Sagacity", definition: "Acuteness of mental faculties and soundness of judgment.", example: "The teacher's sagacity guided the students through the complex project." }
  },
  {
    quote: { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
    word: { term: "Eloquent", definition: "Fluent or persuasive in speaking or writing.", example: "The student gave an eloquent presentation on climate change." }
  },
  {
    quote: { text: "Do not let what you cannot do interfere with what you can do.", author: "John Wooden" },
    word: { term: "Diligent", definition: "Having or showing care and conscientiousness in one's work or duties.", example: "He was a diligent student, always completing his assignments on time." }
  },
  {
    quote: { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
    word: { term: "Tenacity", definition: "The quality or fact of being able to grip something firmly; grip.", example: "Her tenacity in solving the math problem was admirable." }
  },
  {
    quote: { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
    word: { term: "Novice", definition: "A person new to and inexperienced in a job or situation.", example: "Even a novice can learn to code with enough practice." }
  },
  {
    quote: { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
    word: { term: "Persistence", definition: "Firm or obstinate continuance in a course of action in spite of difficulty or opposition.", example: "His persistence in studying led to his high scores." }
  },
  {
    quote: { text: "Knowledge is power. Information is liberating.", author: "Kofi Annan" },
    word: { term: "Erudite", definition: "Having or showing great knowledge or learning.", example: "The professor's erudite lecture captivated the entire audience." }
  },
  {
    quote: { text: "The roots of education are bitter, but the fruit is sweet.", author: "Aristotle" },
    word: { term: "Meticulous", definition: "Showing great attention to detail; very careful and precise.", example: "Her meticulous research ensured the accuracy of the report." }
  },
  {
    quote: { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
    word: { term: "Prudent", definition: "Acting with or showing care and thought for the future.", example: "It is prudent to save your resources for the upcoming term." }
  },
  {
    quote: { text: "Continuous learning is the minimum requirement for success in any field.", author: "Brian Tracy" },
    word: { term: "Adaptability", definition: "The quality of being able to adjust to new conditions.", example: "Her adaptability made the transition to the new curriculum seamless." }
  },
  {
    quote: { text: "The mind is not a vessel to be filled, but a fire to be kindled.", author: "Plutarch" },
    word: { term: "Inquisitive", definition: "Curious or inquiring.", example: "The inquisitive student always asked insightful questions during class." }
  },
  {
    quote: { text: "Change is the end result of all true learning.", author: "Leo Buscaglia" },
    word: { term: "Metamorphosis", definition: "A change of the form or nature of a thing or person into a completely different one.", example: "The student's growth this semester was a true metamorphosis." }
  },
  {
    quote: { text: "Aim for the moon. If you miss, you may hit a star.", author: "W. Clement Stone" },
    word: { term: "Ambition", definition: "A strong desire to do or to achieve something, typically requiring determination and hard work.", example: "His ambition to become a doctor drove his academic success." }
  },
  {
    quote: { text: "The only person who is educated is the one who has learned how to learn and change.", author: "Carl Rogers" },
    word: { term: "Versatile", definition: "Able to adapt or be adapted to many different functions or activities.", example: "She is a versatile learner who excels in both arts and sciences." }
  },
  {
    quote: { text: "Instruction ends in the schoolroom, but education ends only with life.", author: "Frederick W. Robertson" },
    word: { term: "Perseverance", definition: "Persistence in doing something despite difficulty or delay in achieving success.", example: "Her perseverance through the exams was truly inspiring." }
  },
  {
    quote: { text: "Whatever you are, be a good one.", author: "Abraham Lincoln" },
    word: { term: "Integrity", definition: "The quality of being honest and having strong moral principles.", example: "Maintaining integrity is just as important as achieving high grades." }
  },
  {
    quote: { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    word: { term: "Proactive", definition: "Creating or controlling a situation by causing something to happen rather than responding to it.", example: "A proactive approach to studying prevents last-minute stress." }
  },
  {
    quote: { text: "Teachers open the door, but you must enter by yourself.", author: "Chinese Proverb" },
    word: { term: "Autonomy", definition: "The right or condition of self-government; freedom from external control.", example: "Students develop autonomy when they manage their own study schedules." }
  },
  {
    quote: { text: "Failure is the opportunity to begin again more intelligently.", author: "Henry Ford" },
    word: { term: "Optimism", definition: "Hopefulness and confidence about the future or the successful outcome of something.", example: "Maintaining optimism is key to overcoming academic setbacks." }
  }
];

export function getDailyInsight(): DailyInsight {
  const date = new Date();
  // Create a seed based on day, month, and year to ensure variety
  const seed = date.getDate() + date.getMonth() + date.getFullYear();
  return insights[seed % insights.length];
}
