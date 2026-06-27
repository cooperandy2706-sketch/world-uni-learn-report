import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkBill() {
  const { data: terms } = await supabase.from('terms').select('*').eq('is_current', true).limit(1);
  const termId = terms[0].id;

  const { data: students } = await supabase.from('students').select('*').ilike('full_name', '%Dadzie Doris%').limit(1);
  const student = students[0];
  const schoolId = student.school_id;

  const { data: structures } = await supabase.from('fee_structures').select('*').eq('school_id', schoolId).eq('term_id', termId).eq('class_id', student.class_id);
  const { data: payments } = await supabase.from('fee_payments').select('*').eq('student_id', student.id).eq('term_id', termId).order('payment_date', { ascending: false });

  console.log("Structures:", structures);
  console.log("Payments:", payments);

  const discountableTuition = structures
    .filter((f) => f.is_discountable !== false)
    .reduce((s, f) => s + (f.amount || 0), 0);
  
  const tuitionPaid = payments.reduce((s, p) => s + (p.amount_paid || 0), 0);

  console.log("Discountable Tuition (Bill):", discountableTuition);
  console.log("Tuition Paid:", tuitionPaid);
  console.log("Owed:", discountableTuition - tuitionPaid);
}

checkBill();
