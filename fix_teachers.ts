import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
const urlMatch = envFile.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = envFile.match(/VITE_SUPABASE_SERVICE_ROLE_KEY=(.*)/); // use service role!

const supabase = createClient(urlMatch![1].trim(), keyMatch![1].trim());

async function run() {
  const { data: users, error: uErr } = await supabase.from('users').select('*').eq('role', 'teacher');
  if (uErr) { console.error('Error fetching users:', uErr); return; }
  
  console.log(`Found ${users?.length} users with role=teacher`);
  
  let inserted = 0;
  if (users) {
    for (const user of users) {
      const { data: existing } = await supabase.from('teachers').select('id').eq('user_id', user.id);
      if (!existing || existing.length === 0) {
        console.log(`Creating teacher record for user: ${user.full_name} (${user.id})`);
        const { error: insErr } = await supabase.from('teachers').insert({
          user_id: user.id,
          school_id: user.school_id,
          staff_id: `TCH-${user.id.substring(0,4).toUpperCase()}`
        });
        if (insErr) {
          console.error(`Failed to create for ${user.id}:`, insErr);
        } else {
          inserted++;
        }
      }
    }
  }
  
  console.log(`Finished fixing. Inserted ${inserted} teacher records.`);
}

run();
