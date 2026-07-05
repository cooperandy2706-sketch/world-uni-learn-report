// update_kg1_arrears.mjs
// Updates KG1 student fees_arrears based on the handwritten debtors list
// Crossed out = cleared (0) | Crossed + written = remaining | Not crossed = restore original
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

// ─── PAYMENT UPDATES FROM HANDWRITTEN LIST ───────────────────────────────────
// Format: { name: DB name (partial match), arrears: remaining amount }
// Source: Debtors List — KINDERGARTEN 1 (photo dated 02/07/2026)

const updates = [
  // ── NOT CROSSED (still owe full original amount — restore from 0) ──────────
  { name: 'ABDUL RAKIB MAJID',       arrears: 50,   note: 'not crossed' },
  { name: 'ACHINI OTOO MOSES',       arrears: 50,   note: 'not crossed' },
  { name: 'AMOAH BRYAN',             arrears: 513,  note: 'not crossed — reads GHS 513.00 on paper' },
  { name: 'ANNOR ANNABEL',           arrears: 500,  note: 'not crossed' },
  { name: 'DANQUAH PETRA',           arrears: 50,   note: 'not crossed' },
  { name: 'EMEKA TESTIMONY',         arrears: 650,  note: 'not crossed' },
  { name: 'FRIMPONGMAA ADLAIDE',     arrears: 500,  note: 'not crossed' },
  { name: 'KABUTEY NADIA',           arrears: 50,   note: 'not crossed' },
  { name: 'KITCHER COURAGE',         arrears: 50,   note: 'not crossed' },
  { name: 'KOOMSON ROBERT',          arrears: 500,  note: 'not crossed' },
  { name: 'QUAQUE TED',              arrears: 300,  note: 'not crossed' },
  { name: 'ROBERTSON GIANNA',        arrears: 650,  note: 'not crossed' },
  { name: 'TAYLOR ELEANOR ELIKEM',   arrears: 300,  note: 'not crossed' },
  { name: 'TETTEH SAMUEL',           arrears: 250,  note: 'not crossed' },

  // ── PARTIALLY PAID (crossed original + new remaining written in pen) ────────
  { name: 'ADJEI OFORI ELIYSHEVA',   arrears: 450,  note: '~~650~~ → 450' },
  { name: 'AMOAH ABRAHAM',           arrears: 150,  note: '~~600~~ → 150' },
  { name: 'ASARE NYAMEKYE',          arrears: 50,   note: '~~500~~ → 50' },
  { name: 'DJAGBATEY MICKEL',        arrears: 450,  note: '~~650~~ → 450' },
  { name: 'DONKOH CLARA',            arrears: 250,  note: '~~499.98~~ → 250' },
  { name: 'EDUAH LORDINA',           arrears: 32,   note: '~~50~~ → 32' },
  { name: 'GYAMFI GIFTED',           arrears: 101,  note: '~~810~~ → 101' },
  { name: 'IBRAHIM BABA TAHIR',      arrears: 200,  note: '~~230~~ → 200' },
  { name: 'LARTEY JASON',            arrears: 130,  note: '~~500~~ → 130' },
  { name: 'NARTEY JEPHTER',          arrears: 450,  note: '~~900~~ → 450' },
  { name: 'NYARKO ANTWIWAA ADOM',    arrears: 250,  note: '~~600~~ → 250' },
  { name: 'SARFO OSEI NYAMENAYE',    arrears: 50,   note: '~~500~~ cleared + ~~300~~ → 50' },

  // ── FULLY PAID (crossed entirely — already 0 in DB, listing for audit only) ─
  // ADONU MAKAFUI       → 0  (already 0 ✅)
  // AFRAM MARGARET      → 0  (already 0 ✅)
  // AMOAKO SHERIFA      → 0  (already 0 ✅)
  // DZOKOTO PATRICIA    → 0  (already 0 ✅)
  // MAHAMUD SUDIAS      → 0  (already 0 ✅)
  // MOHAMMED ISMAIL FAIZ→ 0  (already 0 ✅)
  // ODEMEY ANUONYAM     → 0  (already 0 ✅)
  // ODOOM BLESSING      → 0  (already 0 ✅)

  // ── TIJANI ABDUL WAHAB — amount unclear on paper, skipping (stays 0) ────────
];

function fmt(n) { return `GHS ${Number(n).toLocaleString('en-GH', { minimumFractionDigits: 2 })}` }

async function run() {
  console.log('═'.repeat(65));
  console.log('  🏫 SKY — KINDERGARTEN 1 ARREARS UPDATE');
  console.log('  Source: Debtors List photo 02/07/2026');
  console.log('═'.repeat(65));

  // Fetch all KG1 students
  const { data: students } = await supabase
    .from('students')
    .select('id, full_name, fees_arrears')
    .eq('school_id', SCHOOL_ID)
    .eq('class_id', KG1_CLASS_ID)
    .eq('is_active', true)
    .order('full_name');

  let successCount = 0;
  let failCount = 0;

  console.log('\n  Applying updates...\n');

  for (const update of updates) {
    // Find matching student (case-insensitive partial match)
    const match = (students || []).find(s =>
      s.full_name.toUpperCase().includes(update.name.toUpperCase()) ||
      update.name.toUpperCase().includes(s.full_name.toUpperCase())
    );

    if (!match) {
      console.warn(`  ⚠️  NOT FOUND: "${update.name}" — skipping`);
      failCount++;
      continue;
    }

    const oldArrears = Number(match.fees_arrears || 0);
    const newArrears = update.arrears;

    const { error } = await supabase
      .from('students')
      .update({ fees_arrears: newArrears })
      .eq('id', match.id);

    if (error) {
      console.error(`  ❌ ERROR updating ${match.full_name}: ${error.message}`);
      failCount++;
    } else {
      const arrow = oldArrears === newArrears ? '(unchanged)' : `${fmt(oldArrears)} → ${fmt(newArrears)}`;
      console.log(`  ✅ ${match.full_name.padEnd(30)} ${arrow.padEnd(28)} [${update.note}]`);
      successCount++;
    }
  }

  // ── Final summary ─────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(65)}`);
  const { data: final } = await supabase
    .from('students')
    .select('full_name, fees_arrears')
    .eq('school_id', SCHOOL_ID)
    .eq('class_id', KG1_CLASS_ID)
    .eq('is_active', true)
    .order('full_name');

  const totalArrears = (final || []).reduce((s, x) => s + Number(x.fees_arrears || 0), 0);
  const withArrears  = (final || []).filter(x => Number(x.fees_arrears) > 0);
  const cleared      = (final || []).filter(x => Number(x.fees_arrears) === 0);

  console.log(`\n  📊 KG1 ARREARS SUMMARY`);
  console.log(`  Students updated:  ${successCount} | Skipped: ${failCount}`);
  console.log(`  With arrears:      ${withArrears.length} students`);
  console.log(`  Fully cleared:     ${cleared.length} students`);
  console.log(`  Total KG1 arrears: ${fmt(totalArrears)}\n`);

  withArrears.forEach(s => {
    console.log(`  - ${s.full_name.padEnd(30)} ${fmt(s.fees_arrears)}`);
  });

  console.log(`\n${'═'.repeat(65)}`);
  console.log('  ✅ UPDATE COMPLETE');
  console.log('═'.repeat(65));
}

run().catch(console.error);
