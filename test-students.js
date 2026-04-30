const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  // Try logging in to simulate RLS
  // Actually, we can just use service_role key to see if the record exists
  const adminClient = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);
  
  const { data, error } = await adminClient.from('students').select('*').order('created_at', { ascending: false }).limit(5);
  console.log("Error:", error);
  console.log("Recent students:", data);
}

run();
