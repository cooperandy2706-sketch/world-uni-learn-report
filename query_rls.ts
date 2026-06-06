import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
const urlMatch = envFile.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = envFile.match(/VITE_SUPABASE_SERVICE_ROLE_KEY=(.*)/);

const supabase = createClient(urlMatch![1].trim(), keyMatch![1].trim());

async function run() {
  const { data, error } = await supabase.from('pg_policies').select('*').eq('tablename', 'teachers');
  console.log('Policies for teachers:', data, error);
}

run();
