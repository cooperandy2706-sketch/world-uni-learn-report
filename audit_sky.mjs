// audit_sky.mjs
// Comprehensive audit of Sky Educational Institute — Terms 3 & 3.1
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const SEP = '─'.repeat(70);
const DSEP = '═'.repeat(70);

function fmt(n) { return Number(n || 0).toLocaleString('en-GH', { minimumFractionDigits: 2 }); }

async function run() {
  console.log(DSEP);
  console.log('  🏫 SKY EDUCATIONAL INSTITUTE — FULL AUDIT');
  console.log(`  Run at: ${new Date().toISOString()}`);
  console.log(DSEP);

  // ── 1. Find the school ──────────────────────────────────────────────
  const { data: schools, error: schoolErr } = await supabase
    .from('schools')
    .select('*')
    .ilike('name', '%sky%');

  if (schoolErr || !schools || schools.length === 0) {
    console.error('❌ Could not find SKY EDUCATIONAL INSTITUTE in the schools table.');
    console.error(schoolErr);
    process.exit(1);
  }

  schools.forEach(s => console.log(`\n✅ School found: "${s.name}" [id: ${s.id}]`));
  const school = schools[0];
  const schoolId = school.id;

  // ── 2. Get all terms for this school ───────────────────────────────
  console.log(`\n${SEP}`);
  console.log('📅 TERMS');
  console.log(SEP);

  const { data: allTerms } = await supabase
    .from('terms')
    .select('*')
    .eq('school_id', schoolId)
    .order('created_at');

  if (!allTerms || allTerms.length === 0) {
    console.warn('⚠️  No terms found for this school!');
  } else {
    allTerms.forEach(t => {
      const flag = t.is_current ? ' ← CURRENT' : '';
      console.log(`  [${t.id}] "${t.name}" | is_current: ${t.is_current}${flag} | academic_year: ${t.academic_year || 'N/A'}`);
    });
  }

  // Filter to Term 3 and Term 3.1
  const targetTerms = (allTerms || []).filter(t =>
    /term\s*3/i.test(t.name)
  );

  if (targetTerms.length === 0) {
    console.warn('\n⚠️  No "Term 3" or "Term 3.1" found for this school!');
    console.warn('All term names:', (allTerms || []).map(t => t.name));
  } else {
    console.log(`\n✅ Targeting ${targetTerms.length} term(s): ${targetTerms.map(t => `"${t.name}"`).join(', ')}`);
  }

  // ── 3. Classes ─────────────────────────────────────────────────────
  console.log(`\n${SEP}`);
  console.log('🏫 CLASSES');
  console.log(SEP);

  const { data: classes } = await supabase
    .from('classes')
    .select('*')
    .eq('school_id', schoolId)
    .order('name');

  console.log(`  Found ${classes?.length || 0} class(es):`);
  (classes || []).forEach(c => console.log(`  [${c.id}] ${c.name}`));

  // ── 4. Students ────────────────────────────────────────────────────
  console.log(`\n${SEP}`);
  console.log('👩‍🎓 STUDENTS');
  console.log(SEP);

  const { data: students } = await supabase
    .from('students')
    .select('id, full_name, student_id, class_id, is_active, fees_arrears, scholarship_type, scholarship_percentage')
    .eq('school_id', schoolId)
    .order('full_name');

  const activeStudents = (students || []).filter(s => s.is_active);
  const inactiveStudents = (students || []).filter(s => !s.is_active);
  console.log(`  Total students: ${students?.length || 0} (Active: ${activeStudents.length}, Inactive: ${inactiveStudents.length})`);

  // ── 5. Per-term audit ──────────────────────────────────────────────
  for (const term of targetTerms) {
    console.log(`\n${DSEP}`);
    console.log(`  📋 TERM: "${term.name}" [id: ${term.id}]`);
    console.log(DSEP);

    // Fee Structures
    const { data: structures } = await supabase
      .from('fee_structures')
      .select('*')
      .eq('school_id', schoolId)
      .eq('term_id', term.id)
      .order('class_id');

    console.log(`\n  💰 Fee Structures (${structures?.length || 0} rows):`);
    if (!structures || structures.length === 0) {
      console.warn('  ⚠️  NO fee structures found for this term!');
    } else {
      // Group by class
      const byClass = {};
      for (const s of structures) {
        if (!byClass[s.class_id]) byClass[s.class_id] = [];
        byClass[s.class_id].push(s);
      }
      for (const [classId, rows] of Object.entries(byClass)) {
        const cls = (classes || []).find(c => c.id === classId);
        const total = rows.reduce((sum, r) => sum + (r.amount || 0), 0);
        console.log(`    Class: ${cls?.name || classId} → ${rows.length} fee item(s) | Total bill: GHS ${fmt(total)}`);
        rows.forEach(r => console.log(`      - ${r.fee_name}: GHS ${fmt(r.amount)} | discountable: ${r.is_discountable}`));
      }
    }

    // Payments
    const { data: payments, error: payErr } = await supabase
      .from('fee_payments')
      .select('id, student_id, amount_paid, payment_date, payment_method, arrears_paid, arrears_balance_after, fee_structure_id, created_at, notes')
      .eq('school_id', schoolId)
      .eq('term_id', term.id)
      .order('payment_date', { ascending: false });

    console.log(`\n  💳 Payments (${payments?.length || 0} rows):`);

    if (payErr) {
      console.error('  ❌ Error fetching payments:', payErr);
    } else if (!payments || payments.length === 0) {
      console.warn('  ⚠️  NO payments found for this term!');
    } else {
      const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount_paid || 0), 0);
      const totalArrearsPaid = payments.reduce((sum, p) => sum + Number(p.arrears_paid || 0), 0);
      console.log(`  Total collected: GHS ${fmt(totalCollected)} | Arrears portion: GHS ${fmt(totalArrearsPaid)}`);
      console.log('');

      // Group payments by student
      const payByStudent = {};
      for (const p of payments) {
        if (!payByStudent[p.student_id]) payByStudent[p.student_id] = [];
        payByStudent[p.student_id].push(p);
      }

      for (const [studentId, pays] of Object.entries(payByStudent)) {
        const student = (students || []).find(s => s.id === studentId);
        const name = student?.full_name || `[UNKNOWN student: ${studentId}]`;
        const total = pays.reduce((sum, p) => sum + Number(p.amount_paid || 0), 0);
        console.log(`    👤 ${name}`);
        pays.forEach(p => {
          console.log(`       → GHS ${fmt(p.amount_paid)} on ${p.payment_date} | method: ${p.payment_method || 'N/A'} | arrears_paid: ${fmt(p.arrears_paid)} | balance_after: ${fmt(p.arrears_balance_after)}`);
        });
        console.log(`       Subtotal: GHS ${fmt(total)}`);
        console.log('');
      }

      // Check for orphaned payments (student_id not matching any student)
      const orphaned = payments.filter(p => !(students || []).find(s => s.id === p.student_id));
      if (orphaned.length > 0) {
        console.warn(`  ⚠️  ORPHANED PAYMENTS (student_id doesn't match any student in school):`);
        orphaned.forEach(p => console.warn(`    Payment id: ${p.id} | student_id: ${p.student_id} | amount: ${fmt(p.amount_paid)}`));
      }
    }

    // ── Check for students with NO payments ─────────────────────────
    console.log(`\n  🔍 Students with ZERO payments this term:`);
    const paidStudentIds = new Set((payments || []).map(p => p.student_id));
    const unpaidStudents = activeStudents.filter(s => !paidStudentIds.has(s.id));
    if (unpaidStudents.length === 0) {
      console.log('    ✅ All active students have at least one payment recorded.');
    } else {
      console.log(`    ${unpaidStudents.length} student(s) with no payment for "${term.name}":`);
      unpaidStudents.forEach(s => {
        const cls = (classes || []).find(c => c.id === s.class_id);
        console.log(`    - ${s.full_name} [${cls?.name || 'no class'}] | arrears: GHS ${fmt(s.fees_arrears)}`);
      });
    }
  }

  // ── 6. Global arrears check ────────────────────────────────────────
  console.log(`\n${DSEP}`);
  console.log('  🔴 ARREARS SNAPSHOT (all active students)');
  console.log(DSEP);

  const withArrears = activeStudents.filter(s => Number(s.fees_arrears) > 0);
  const noArrears = activeStudents.filter(s => Number(s.fees_arrears) <= 0);
  console.log(`  Students with arrears > 0: ${withArrears.length}`);
  console.log(`  Students with arrears = 0: ${noArrears.length}`);
  console.log('');

  withArrears.sort((a, b) => Number(b.fees_arrears) - Number(a.fees_arrears));
  withArrears.forEach(s => {
    const cls = (classes || []).find(c => c.id === s.class_id);
    console.log(`  - ${s.full_name} [${cls?.name || 'N/A'}] → GHS ${fmt(s.fees_arrears)} arrears`);
  });

  // ── 7. ALL payments ever (cross-term) for this school ──────────────
  console.log(`\n${DSEP}`);
  console.log('  📊 ALL PAYMENTS (cross-term summary)');
  console.log(DSEP);

  const { data: allPayments, error: allPayErr } = await supabase
    .from('fee_payments')
    .select('id, student_id, term_id, amount_paid, payment_date, payment_method, arrears_paid')
    .eq('school_id', schoolId)
    .order('payment_date', { ascending: false });

  if (allPayErr) {
    console.error('❌ Error fetching all payments:', allPayErr);
  } else {
    console.log(`  Total payment records for school: ${allPayments?.length || 0}`);

    // Group by term_id
    const byTerm = {};
    for (const p of (allPayments || [])) {
      if (!byTerm[p.term_id]) byTerm[p.term_id] = [];
      byTerm[p.term_id].push(p);
    }

    for (const [termId, pays] of Object.entries(byTerm)) {
      const term = (allTerms || []).find(t => t.id === termId);
      const totalAmt = pays.reduce((sum, p) => sum + Number(p.amount_paid || 0), 0);
      const flag = term?.is_current ? ' ← CURRENT' : '';
      console.log(`  Term "${term?.name || termId}"${flag}: ${pays.length} payment(s) | GHS ${fmt(totalAmt)}`);
    }

    // Check for payments with term_id not in allTerms (orphaned to deleted terms)
    const allTermIds = new Set((allTerms || []).map(t => t.id));
    const orphanedByTerm = (allPayments || []).filter(p => !allTermIds.has(p.term_id));
    if (orphanedByTerm.length > 0) {
      console.warn(`\n  ⚠️  CRITICAL: ${orphanedByTerm.length} payment(s) reference a term_id that NO LONGER EXISTS:`);
      orphanedByTerm.forEach(p => {
        const student = (students || []).find(s => s.id === p.student_id);
        console.warn(`    id: ${p.id} | student: ${student?.full_name || p.student_id} | term_id: ${p.term_id} | amount: GHS ${fmt(p.amount_paid)} | date: ${p.payment_date}`);
      });
    }
  }

  // ── 8. Fee structures without a matching class ─────────────────────
  console.log(`\n${DSEP}`);
  console.log('  🧱 FEE STRUCTURE INTEGRITY CHECK');
  console.log(DSEP);

  const { data: allStructures } = await supabase
    .from('fee_structures')
    .select('id, fee_name, amount, class_id, term_id')
    .eq('school_id', schoolId);

  const classIds = new Set((classes || []).map(c => c.id));
  const termIds = new Set((allTerms || []).map(t => t.id));

  const orphanStructures = (allStructures || []).filter(s => !classIds.has(s.class_id) || !termIds.has(s.term_id));
  if (orphanStructures.length > 0) {
    console.warn(`  ⚠️  ${orphanStructures.length} fee structure(s) reference a missing class or term:`);
    orphanStructures.forEach(s => console.warn(`    id: ${s.id} | ${s.fee_name} | class_id: ${s.class_id} | term_id: ${s.term_id}`));
  } else {
    console.log('  ✅ All fee structures reference valid classes and terms.');
  }

  // ── 9. Current term payments not showing in bill — term_id mismatch diagnostic
  console.log(`\n${DSEP}`);
  console.log('  🔎 PAYMENT ↔ TERM MISMATCH DIAGNOSTIC');
  console.log(DSEP);

  const currentTerm = (allTerms || []).find(t => t.is_current);
  if (!currentTerm) {
    console.warn('  ⚠️  No is_current term set for this school!');
  } else {
    console.log(`  Current term: "${currentTerm.name}" [${currentTerm.id}]`);

    // Fetch ALL payments for current term
    const { data: currPayments } = await supabase
      .from('fee_payments')
      .select('id, student_id, amount_paid, payment_date, term_id, payment_method')
      .eq('school_id', schoolId)
      .eq('term_id', currentTerm.id)
      .order('payment_date', { ascending: false });

    console.log(`  Payments recorded under current term: ${currPayments?.length || 0}`);

    // Are there payments with a DIFFERENT term_id that were entered recently?
    const recentlyEntered = (allPayments || [])
      .filter(p => {
        const d = new Date(p.payment_date || 0);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 30); // last 30 days
        return d >= cutoff && p.term_id !== currentTerm.id;
      });

    if (recentlyEntered.length > 0) {
      console.warn(`\n  ⚠️  POSSIBLE BUG: ${recentlyEntered.length} payment(s) dated in the last 30 days but linked to a DIFFERENT term than current:`);
      recentlyEntered.forEach(p => {
        const st = (students || []).find(s => s.id === p.student_id);
        const tm = (allTerms || []).find(t => t.id === p.term_id);
        console.warn(`    ${st?.full_name || p.student_id} | GHS ${fmt(p.amount_paid)} on ${p.payment_date} → term "${tm?.name || p.term_id}"`);
      });
    } else {
      console.log('  ✅ No recently-entered payments found under wrong term.');
    }
  }

  console.log(`\n${DSEP}`);
  console.log('  ✅ AUDIT COMPLETE');
  console.log(DSEP);
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
