import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
const urlMatch = envFile.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = envFile.match(/VITE_SUPABASE_SERVICE_ROLE_KEY=(.*)/);

const supabase = createClient(urlMatch![1].trim(), keyMatch![1].trim());

async function run() {
  const { data, error } = await supabase.rpc('get_policies_for_table', { target_table: 'teachers' });
  if (error) {
     console.error('Cannot run RPC:', error);
     // Fallback: Just query teachers using service_role to confirm they exist
     const { data: t } = await supabase.from('teachers').select('id, school_id').limit(5);
     console.log('Teachers (service role):', t);
  } else {
     console.log('Policies:', data);
  }
}

run();
