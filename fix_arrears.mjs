import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function fixArrears() {
  const records = [
    { search: 'Dadzie Doris', balance: 380 },
    { search: 'Attikey Akusika', balance: 0 },
    { search: 'Amedeka Sedem', balance: 350 }
  ];

  for (const rec of records) {
    const { data: students } = await supabase.from('students').select('*').ilike('full_name', `%${rec.search}%`).limit(1);
    if (!students || students.length === 0) continue;
    const s = students[0];

    const { error } = await supabase.from('students').update({ fees_arrears: rec.balance }).eq('id', s.id);
    if (error) console.error(`Error updating arrears for ${s.full_name}:`, error);
    else console.log(`Updated arrears (live balance) for ${s.full_name} to ${rec.balance}`);
  }
}

fixArrears();
