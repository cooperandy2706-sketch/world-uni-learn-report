// check_dadzie.mjs - verify remaining orphaned payments for Sky
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const TERM3_ID = '81b17c55-d986-4ba7-8f81-9d6fd3e068d3';

async function run() {
  // Check if any null-term or deleted-term payments remain
  const { data: nullPays } = await supabase
    .from('fee_payments')
    .select('id, student_id, amount_paid, payment_date, term_id')
    .is('term_id', null);
  console.log(`\nNull term_id payments remaining: ${nullPays?.length || 0}`);

  // Check Dadzie specifically
  const { data: dadzie } = await supabase
    .from('students')
    .select('id, full_name, fees_arrears')
    .ilike('full_name', '%Dadzie%');
  
  for (const s of dadzie || []) {
    const { data: pays } = await supabase
      .from('fee_payments')
      .select('id, amount_paid, term_id, payment_date')
      .eq('student_id', s.id)
      .order('payment_date');
    
    console.log(`\n${s.full_name} [arrears: ${s.fees_arrears}]:`);
    pays?.forEach(p => {
      const inTerm3 = p.term_id === TERM3_ID ? ' ✅ TERM 3' : ` ⚠️ OTHER TERM: ${p.term_id}`;
      console.log(`  GHS ${p.amount_paid} on ${p.payment_date}${inTerm3}`);
    });
  }

  // Show final Term 3 count
  const { data: t3pays } = await supabase
    .from('fee_payments')
    .select('id, amount_paid')
    .eq('term_id', TERM3_ID);
  
  const total = (t3pays || []).reduce((sum, p) => sum + Number(p.amount_paid), 0);
  console.log(`\n✅ Term 3 payments: ${t3pays?.length} | Total: GHS ${total.toLocaleString('en-GH', { minimumFractionDigits: 2 })}`);
}

run();
