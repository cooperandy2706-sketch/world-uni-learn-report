import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function clearArrears() {
  const records = [
    { search: 'Dadzie Doris' },
    { search: 'Attikey Akusika' },
    { search: 'Amedeka Sedem' }
  ];

  for (const rec of records) {
    const { data: students } = await supabase.from('students').select('*').ilike('full_name', `%${rec.search}%`).limit(1);
    if (!students || students.length === 0) continue;
    const s = students[0];

    const { error } = await supabase.from('students').update({ fees_arrears: 0 }).eq('id', s.id);
    if (error) console.error(`Error clearing arrears for ${s.full_name}:`, error);
    else console.log(`Cleared arrears for ${s.full_name}`);
  }
}

clearArrears();
