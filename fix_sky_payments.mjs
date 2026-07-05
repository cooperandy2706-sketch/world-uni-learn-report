// fix_sky_payments.mjs
// Fixes 16 orphaned payments for SKY EDUCATIONAL INSTITUTE:
//   • 13 with term_id = null → reassign to current Term 3
//   • 3 with term_id = f04de3bd (deleted term) → reassign to current Term 3
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const CURRENT_TERM_ID = '81b17c55-d986-4ba7-8f81-9d6fd3e068d3'; // Term 3
const DELETED_TERM_ID = 'f04de3bd-7cce-4398-8085-df541c834c13'; // old Term 3.1

// The 16 orphaned payment IDs found in the audit
const NULL_TERM_PAYMENT_IDS = [
  '6bfd5902-e4ce-44af-9e51-2063f5124ef4', // CUDJOE PHINEHAS       GHS 100
  '887abaaf-4c21-41f7-84ec-59cd1329f7af', // LARTEY JASON          GHS 500
  'd90b0326-211b-45fb-a7ff-b2c164363438', // WIAFI OSEI CHARLES    GHS 210
  '4f29e890-a4b1-4a52-a105-4dd9f45cc3ef', // GBAFA MERCY           GHS 200
  'ddcf97d2-3ebb-41c7-b32c-79509e9b4303', // KAYABA KHULUDO        GHS 200
  '0abdfc9a-a6e1-4fea-938c-5cb0f9cc019d', // GYAMFI GIFTED         GHS 150
  '21e7b746-b591-4bcd-a643-c37c783bf7be', // GBAFA MOSES           GHS 200
  '05babcb6-3e4f-4dd3-aeaa-61732646a409', // ABDUL-MAJID SUAD      GHS 100
  '9cf79e85-adef-4d8f-9914-b6129adf4692', // NYARKO ANTWIWAA ADOM  GHS 150
  '7e630e76-58bd-46db-8e86-ee853ce0b220', // DAGBANU CHRISTABEL    GHS 260
  '4f8e4be7-b7d7-43c1-8f1c-e7c91825778a', // KOOMSON CHRISTABEL    GHS 130
  '3b1ed5e9-64e0-4ac6-86ff-add9db72eb9a', // WIAFI ANGELA          GHS 210
  '70574852-6379-46ab-ace1-94a5714a164e', // AYER PRINCE           GHS 300
];

const DELETED_TERM_PAYMENT_IDS = [
  'aeafc2b9-2c19-4f28-a348-6662fb700411', // Dadzie Doris           GHS 600
  'd43c461a-17b0-4a02-9682-887d160527ca', // AMEDEKA SEDEM EMILY    GHS 300
  'f2ad8cc3-7f64-419b-b241-459979a966e2', // Attikey Akusika Mawuena GHS 760
];

function fmt(n) { return Number(n || 0).toLocaleString('en-GH', { minimumFractionDigits: 2 }); }

async function run() {
  console.log('═'.repeat(65));
  console.log('  🔧 SKY EDUCATIONAL INSTITUTE — PAYMENT FIX');
  console.log('═'.repeat(65));

  // ── Verify current term exists ──────────────────────────────────────
  const { data: term, error: termErr } = await supabase
    .from('terms')
    .select('id, name, is_current')
    .eq('id', CURRENT_TERM_ID)
    .single();

  if (termErr || !term) {
    console.error('❌ Could not verify current term. Aborting.');
    console.error(termErr);
    process.exit(1);
  }
  console.log(`\n✅ Verified current term: "${term.name}" [is_current: ${term.is_current}]`);

  // ── Fix 1: NULL term_id payments ────────────────────────────────────
  console.log(`\n${'─'.repeat(65)}`);
  console.log(`  Fixing ${NULL_TERM_PAYMENT_IDS.length} payments with term_id = NULL...`);
  console.log('─'.repeat(65));

  const { data: nullFixed, error: nullErr } = await supabase
    .from('fee_payments')
    .update({ term_id: CURRENT_TERM_ID })
    .in('id', NULL_TERM_PAYMENT_IDS)
    .select('id, student_id, amount_paid, payment_date');

  if (nullErr) {
    console.error('❌ Error fixing null-term payments:', nullErr);
  } else {
    console.log(`✅ Successfully updated ${nullFixed?.length || 0} null-term payment(s).`);
    nullFixed?.forEach(p => console.log(`   → id: ${p.id} | GHS ${fmt(p.amount_paid)} on ${p.payment_date}`));
  }

  // ── Fix 2: Deleted-term payments ────────────────────────────────────
  console.log(`\n${'─'.repeat(65)}`);
  console.log(`  Fixing ${DELETED_TERM_PAYMENT_IDS.length} payments under deleted term ${DELETED_TERM_ID}...`);
  console.log('─'.repeat(65));

  const { data: deletedFixed, error: deletedErr } = await supabase
    .from('fee_payments')
    .update({ term_id: CURRENT_TERM_ID })
    .in('id', DELETED_TERM_PAYMENT_IDS)
    .select('id, student_id, amount_paid, payment_date');

  if (deletedErr) {
    console.error('❌ Error fixing deleted-term payments:', deletedErr);
  } else {
    console.log(`✅ Successfully updated ${deletedFixed?.length || 0} deleted-term payment(s).`);
    deletedFixed?.forEach(p => console.log(`   → id: ${p.id} | GHS ${fmt(p.amount_paid)} on ${p.payment_date}`));
  }

  // ── Verify: re-count payments under current term ────────────────────
  console.log(`\n${'─'.repeat(65)}`);
  console.log('  Verification — payments now under Term 3...');
  console.log('─'.repeat(65));

  const { data: verifyPayments, error: verifyErr } = await supabase
    .from('fee_payments')
    .select('id, amount_paid')
    .eq('term_id', CURRENT_TERM_ID);

  if (verifyErr) {
    console.error('❌ Verification error:', verifyErr);
  } else {
    const total = (verifyPayments || []).reduce((sum, p) => sum + Number(p.amount_paid || 0), 0);
    console.log(`✅ Term 3 now has ${verifyPayments?.length || 0} payment(s) totalling GHS ${fmt(total)}`);
  }

  // ── Check for any remaining orphaned payments ───────────────────────
  const { data: allPayments } = await supabase
    .from('fee_payments')
    .select('id, term_id, amount_paid, payment_date')
    .is('term_id', null);

  if (allPayments && allPayments.length > 0) {
    console.warn(`\n⚠️  ${allPayments.length} payment(s) STILL have null term_id (may be other schools):`);
    allPayments.forEach(p => console.warn(`   id: ${p.id} | GHS ${fmt(p.amount_paid)} on ${p.payment_date}`));
  } else {
    console.log('\n✅ No remaining null-term payments in database.');
  }

  console.log(`\n${'═'.repeat(65)}`);
  console.log('  ✅ FIX COMPLETE — All SKY payments reassigned to Term 3');
  console.log('═'.repeat(65));
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
