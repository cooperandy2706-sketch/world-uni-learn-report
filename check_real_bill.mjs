import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkRealBill() {
  const studentsToFix = ['Dadzie', 'Attikey', 'Amedeka'];

  // get term
  const { data: terms } = await supabase.from('terms').select('*').eq('is_current', true).limit(1);
  const termId = terms[0].id;

  for (const search of studentsToFix) {
    const { data: students, error } = await supabase
      .from('students')
      .select('id, full_name, class_id, fees_arrears')
      .ilike('full_name', `%${search}%`)
      .limit(1);

    if (error || !students || students.length === 0) continue;
    const student = students[0];

    const { data: structs } = await supabase.from('fee_structures').select('*').eq('class_id', student.class_id).eq('term_id', termId);
    const termCharges = structs.reduce((sum, s) => sum + s.amount, 0);

    const { data: payments } = await supabase.from('fee_payments').select('amount_paid').eq('student_id', student.id).eq('term_id', termId);
    const totalPaid = payments.reduce((sum, p) => sum + p.amount_paid, 0);

    console.log(`${student.full_name}: Structs count: ${structs.length}, Calculated Term Bill: ${termCharges}, Total Paid: ${totalPaid}, Arrears(B/F): ${student.fees_arrears}`);
  }
}

checkRealBill();
