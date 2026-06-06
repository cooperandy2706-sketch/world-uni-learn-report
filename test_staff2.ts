import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
const urlMatch = envFile.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const supabase = createClient(urlMatch![1].trim(), keyMatch![1].trim());

async function run() {
  // Try selecting just the teachers table directly
  const { data, error } = await supabase.from('teachers').select('*').limit(3);
  console.log('Direct teachers query error:', error);
  console.log('Direct teachers cols:', data ? Object.keys(data[0] || {}) : 'no data');
  console.log('Count:', data?.length);
}

run();
