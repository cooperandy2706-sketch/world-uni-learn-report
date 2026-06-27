import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkStudentsTable() {
  const { data: students } = await supabase.from('students').select('full_name, fees_amount, fees_paid, fees_arrears').in('full_name', ['Attikey Akusika Mawuena', 'AMEDEKA SEDEM EMILY']);
  console.log(students);
}

checkStudentsTable();
