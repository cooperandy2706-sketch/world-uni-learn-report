import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkStudents() {
  const terms = ['Dadzie', 'Attikey', 'Amedeka'];
  
  for (const term of terms) {
    const { data: students, error } = await supabase
      .from('students')
      .select('*')
      .ilike('full_name', `%${term}%`);
      
    if (error) {
      console.error('Error:', error);
    } else {
      console.log(`\nSearch for ${term}:`, students.map(s => ({id: s.id, name: s.full_name, balance: s.fees_balance, paid: s.amount_paid})));
      if (students && students.length > 0) {
        for (const s of students) {
          const { data: payments } = await supabase
            .from('fee_payments')
            .select('*')
            .eq('student_id', s.id);
          console.log(`  Payments for ${s.full_name}:`, payments);
        }
      }
    }
  }
}

checkStudents();
