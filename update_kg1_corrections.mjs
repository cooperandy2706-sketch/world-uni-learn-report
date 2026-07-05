// update_kg1_corrections.mjs
// Applies the user's manual corrections to the KG1 arrears
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const SCHOOL_ID = 'e50dd75f-8439-490c-b935-70da09d597c7';
const KG1_CLASS_ID = '3958539a-4a07-4a18-9809-2ea7d5a60364';

const updates = [
  { match: 'abdul rakib majid', arrears: 650 },
  { match: 'otoo moses', arrears: 400 },
  { match: 'adonu makafui', arrears: 0 },
  { match: 'afram margaret', arrears: 150 },
  { match: 'amoah abraham', arrears: 0 },
  { match: 'amoako sherifa', arrears: 0 },
  { match: 'annor annabel', arrears: 500 },
  { match: 'asare nyamekye', arrears: 50 },
  { match: 'djagbatey mickel', arrears: 450 }, // Mickey
  { match: 'donkoh clara', arrears: 250 },
  { match: 'eduah lordina', arrears: 320 },
  { match: 'frimpongmaa', arrears: 500 },
  { match: 'gyamfi gifted', arrears: 10 },
  { match: 'ibrahim baba', arrears: 200 },
  { match: 'kabutey nadia', arrears: 50 },
  { match: 'kitcher courage', arrears: 550 },
  { match: 'lartey jason', arrears: 130 },
  { match: 'mahamud sudias', arrears: 0 }, // Sudias
  { match: 'ismail faiz', arrears: 0 }, // Ismail
  { match: 'nartey jephter', arrears: 450 },
  { match: 'nyarko', arrears: 0 },
  { match: 'odemey anuonyam', arrears: 250 },
  { match: 'odoom blessing', arrears: 0 },
  { match: 'quaque ted', arrears: 0 }, // Ted
  { match: 'robertson gianna', arrears: 0 }, // Robertson
  { match: 'taylor eleanor', arrears: 0 }, // Taylor
  { match: 'tetteh samuel', arrears: 50 },
  { match: 'tijani abdul', arrears: 250 }, // Wahab
];

async function run() {
  const { data: students } = await supabase
    .from('students')
    .select('id, full_name, fees_arrears')
    .eq('school_id', SCHOOL_ID)
    .eq('class_id', KG1_CLASS_ID)
    .eq('is_active', true);

  console.log('Applying manual corrections...');

  for (const update of updates) {
    const match = students.find(s => s.full_name.toLowerCase().includes(update.match.toLowerCase()));
    if (!match) {
      console.log(`⚠️ Not found: ${update.match}`);
      continue;
    }
    
    if (Number(match.fees_arrears) !== update.arrears) {
      await supabase.from('students').update({ fees_arrears: update.arrears }).eq('id', match.id);
      console.log(`✅ ${match.full_name.padEnd(30)} ${Number(match.fees_arrears)} → ${update.arrears}`);
    } else {
      console.log(`➖ ${match.full_name.padEnd(30)} already ${update.arrears}`);
    }
  }

  // Print final list of debtors
  const { data: final } = await supabase
    .from('students')
    .select('full_name, fees_arrears')
    .eq('school_id', SCHOOL_ID)
    .eq('class_id', KG1_CLASS_ID)
    .eq('is_active', true)
    .gt('fees_arrears', 0)
    .order('full_name');

  console.log('\n--- FINAL KINDERGARTEN 1 DEBTORS ---');
  let total = 0;
  final.forEach(s => {
    console.log(s.full_name.padEnd(30), 'GHS', Number(s.fees_arrears).toFixed(2));
    total += Number(s.fees_arrears);
  });
  console.log('---');
  console.log('Total Debtors:', final.length);
  console.log('Total Amount: GHS', total.toLocaleString('en-GH', { minimumFractionDigits: 2 }));
}

run();
