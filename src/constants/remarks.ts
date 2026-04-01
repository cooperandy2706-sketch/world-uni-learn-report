// src/constants/remarks.ts

export const GRADE_REMARKS: Record<string, string[]> = {
  'A': [
    'Excellent performance, keep it up!',
    'Outstanding work, very commendable!',
    'Brilliant performance in all areas.',
    'A masterful display of knowledge.',
    'Keep up this high standard of excellence.',
    'Very impressive results this term.',
  ],
  'B': [
    'Very good, you can do even better.',
    'A strong performance, well done.',
    'Commendable effort, keep it up!',
    'Shows a very good understanding of the subject.',
    'Good work, aim for the top grade next term.',
    'Consistently good results.',
  ],
  'C': [
    'Good effort, keep working hard.',
    'Satisfactory performance, shows potential.',
    'A solid average, keep striving for more.',
    'Well done, but more focus is needed.',
    'Steady progress, keep it up.',
    'Good understanding, but needs more application.',
  ],
  'D': [
    'Fair performance, work harder next term.',
    'Shows some potential, but needs more effort.',
    'Credit obtained, but more study is required.',
    'A pass, but you can do much better.',
    'Aim for higher grades by focusing more.',
    'Satisfactory, but improvement is needed.',
  ],
  'E': [
    'Pass obtained, but more effort is needed.',
    'Weak performance, strive for improvement.',
    'Needs much more focus and hard work.',
    'Barely passed, extensive study is required.',
    'Improve your study habits for better results.',
    'A narrow pass, work much harder.',
  ],
  'F': [
    'Fail. Extensive study is required.',
    'Poor performance, seek help where needed.',
    'Needs significant improvement in this subject.',
    'Work much harder next term to pass.',
    'Inadequate performance, double your efforts.',
    'Fail. Focus more on your studies.',
  ]
}

export function getRandomRemark(grade: string): string {
  const remarks = GRADE_REMARKS[grade] || []
  if (remarks.length === 0) return ''
  return remarks[Math.floor(Math.random() * remarks.length)]
}

// Flat list for dropdowns if needed
export const TEACHER_REMARKS = Object.values(GRADE_REMARKS).flat()

export const HEADTEACHER_REMARKS = [
  'Outstanding student, well done!',
  'A commendable performance this term.',
  'Keep up the good work.',
  'Put in more effort next term.',
  'Great improvement shown this term.',
  'A brilliant student, well done!',
  'Promoted to the next class.',
  'Work harder to improve your grades.',
]