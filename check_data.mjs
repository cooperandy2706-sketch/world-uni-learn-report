import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkData() {
  const { data: students } = await supabase.from('students').select('id, full_name, class_id').ilike('full_name', '%Dadzie Doris%').limit(1);
  if (!students || students.length === 0) return;
  const s = students[0];

  const { data: payments, error } = await supabase.from('fee_payments').select('*').eq('student_id', s.id);
  console.log("Payments for Dadzie:");
  console.log(payments);
  if (error) console.error(error);
}

checkData();
