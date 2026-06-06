import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
const urlMatch = envFile.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const supabase = createClient(urlMatch![1].trim(), keyMatch![1].trim());

async function run() {
  const { data, error } = await supabase.from('users').select('*').eq('role', 'teacher').limit(5);
  console.log('users with role=teacher:', data?.length);
  
  if (data && data.length > 0) {
     const userId = data[0].id;
     const { data: tData } = await supabase.from('teachers').select('*').eq('user_id', userId);
     console.log('teachers table for user:', tData);
  }
}

run();
