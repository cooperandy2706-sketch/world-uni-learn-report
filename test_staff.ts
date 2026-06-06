import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
const urlMatch = envFile.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const supabase = createClient(urlMatch![1].trim(), keyMatch![1].trim());

async function run() {
  // Test 1: teachers table
  const { data: teachers, error: e1 } = await supabase
    .from('teachers')
    .select('id, staff_id, user:users(id, full_name, email, phone, role)')
    .limit(3);
  
  console.log('Teachers error:', e1);
  console.log('Teachers sample:', JSON.stringify(teachers?.slice(0,2), null, 2));
  
  // Test 2: Check if any teachers have null user
  const nullUsers = teachers?.filter(t => !t.user);
  console.log('\nTeachers with null user:', nullUsers?.length);
}

run();
