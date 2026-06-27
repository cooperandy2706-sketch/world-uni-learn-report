import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkAndPay() {
  const { data: students } = await supabase.from('students').select('*').ilike('full_name', '%Sedem%').limit(1);
  if (!students || students.length === 0) return;
  const s = students[0];

  const { data: terms } = await supabase.from('terms').select('*').eq('is_current', true).limit(1);
  const termId = terms[0].id;
  const yearId = terms[0].academic_year_id;

  const { data: structs } = await supabase.from('fee_structures').select('*').eq('class_id', s.class_id).eq('term_id', termId).eq('fee_name', 'Tuition Fee').limit(1);
  const structId = structs && structs.length > 0 ? structs[0].id : null;

  const { data: existingPayments } = await supabase.from('fee_payments').select('*').eq('student_id', s.id);
  console.log("Current payments for Emily:", existingPayments);

  // Insert a new payment of 300
  const paymentDate = '2026-06-17T12:00:00Z';
  const { error, data } = await supabase.from('fee_payments').insert({
      school_id: s.school_id,
      student_id: s.id,
      term_id: termId,
      academic_year_id: yearId,
      fee_structure_id: structId,
      amount_paid: 300,
      payment_date: paymentDate,
      payment_method: 'cash',
      reference_number: `REC-${Date.now()}-${s.id.substring(0,4)}`,
      recorded_by: s.id,
      currency_code: 'GHS',
      arrears_paid: 0,
      arrears_balance_after: 0
  }).select();

  if (error) console.error("Error inserting payment:", error);
  else console.log("Successfully inserted another 300 payment for Emily:", data);

  // Also update fees_paid in students table
  const totalPaid = existingPayments.reduce((acc, p) => acc + (p.amount_paid || 0), 0) + 300;
  await supabase.from('students').update({ fees_paid: totalPaid }).eq('id', s.id);
  console.log(`Updated students.fees_paid to ${totalPaid}`);
}

checkAndPay();
