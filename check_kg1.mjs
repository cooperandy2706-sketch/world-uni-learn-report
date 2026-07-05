// check_kg1.mjs — list all KG1 students with current arrears
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function run() {
  // Find the school
  const { data: schools } = await supabase.from('schools').select('id, name').ilike('name', '%sky%');
  const school = schools?.[0];
  console.log(`School: ${school?.name} [${school?.id}]`);

  // Find KG1 class
  const { data: classes } = await supabase.from('classes').select('id, name').eq('school_id', school.id).ilike('name', '%kindergarten 1%');
  console.log('\nMatched classes:', classes?.map(c => `${c.name} [${c.id}]`));

  if (!classes || classes.length === 0) {
    // Try broader search
    const { data: allClasses } = await supabase.from('classes').select('id, name').eq('school_id', school.id).order('name');
    console.log('\nAll classes:', allClasses?.map(c => c.name));
    return;
  }

  const kg1 = classes[0];

  // Get all active KG1 students with arrears
  const { data: students } = await supabase
    .from('students')
    .select('id, full_name, fees_arrears')
    .eq('school_id', school.id)
    .eq('class_id', kg1.id)
    .eq('is_active', true)
    .order('full_name');

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`KG1 Students (${students?.length ?? 0}) — current arrears:`);
  console.log('─'.repeat(60));
  students?.forEach(s => {
    const flag = Number(s.fees_arrears) > 0 ? ` ← GHS ${Number(s.fees_arrears).toFixed(2)}` : ' (no arrears)';
    console.log(`  ${s.full_name}${flag}`);
  });
}

run().catch(console.error);
