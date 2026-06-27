import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkStudentsTable() {
  const { data: students } = await supabase.from('students').select('*').ilike('full_name', '%Dadzie Doris%').limit(1);
  console.log(students[0]);
}

checkStudentsTable();
