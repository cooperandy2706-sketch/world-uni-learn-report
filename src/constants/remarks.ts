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

export const SMART_HEADTEACHER_REMARKS: Record<string, string[]> = {
  'A': [
    'Outstanding student, well done!',
    'A brilliant student, very commendable performance.',
    'Consistently high standards, keep it up!',
    'An exemplary student with excellent results.',
    'Magnificent performance, a pride to the school.',
  ],
  'B': [
    'A very good performance this term.',
    'Commendable effort, keep striving for the top.',
    'A strong set of results, well done.',
    'Shows great promise and academic strength.',
    'Very good work, aim for even higher next term.',
  ],
  'C': [
    'Good effort, keep up the hard work.',
    'Satisfactory results, but has potential for more.',
    'Steady progress shown this term.',
    'A solid average, focus more to reach the top.',
    'Well done, continue to work hard.',
  ],
  'D': [
    'Fair performance, but needs more concentration.',
    'Work harder to improve your grades next term.',
    'Satisfactory, but much more effort is required.',
    'You have potential, put in more study time.',
    'A pass, but strive for excellence next term.',
  ],
  'E': [
    'Weak performance, strive for significant improvement.',
    'Needs much more focus and dedication to studies.',
    'Double your efforts next term to pass comfortably.',
    'Improve your study habits for better results.',
    'More hard work is required to overcome weaknesses.',
  ],
  'F': [
    'Fail. Extensive study and help are required.',
    'Poor results, seek help in difficult areas.',
    'Work much harder next term to avoid failure.',
    'Needs to be more serious with academic work.',
    'Significant improvement is needed in all areas.',
  ]
}

export function getSmartHeadteacherRemark(avg: number): string {
  let grade = 'F'
  if (avg >= 80) grade = 'A'
  else if (avg >= 70) grade = 'B'
  else if (avg >= 60) grade = 'C'
  else if (avg >= 50) grade = 'D'
  else if (avg >= 40) grade = 'E'

  const remarks = SMART_HEADTEACHER_REMARKS[grade] || []
  return remarks[Math.floor(Math.random() * remarks.length)] || 'Good work.'
}

export const HEADTEACHER_REMARKS = Object.values(SMART_HEADTEACHER_REMARKS).flat()