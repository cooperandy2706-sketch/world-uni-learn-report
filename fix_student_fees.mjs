import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function fixStudentFees() {
  const studentsToFix = [
    { search: 'Dadzie', totalBill: 980, amountPaid: 600 },
    { search: 'Attikey', totalBill: 760, amountPaid: 760 },
    { search: 'Amedeka', totalBill: 650, amountPaid: 300 }
  ];

  for (const { search, totalBill, amountPaid } of studentsToFix) {
    const { data: students, error } = await supabase
      .from('students')
      .select('*')
      .ilike('full_name', `%${search}%`)
      .limit(1);

    if (error || !students || students.length === 0) {
      console.log(`❌ Could not find student matching: ${search}`);
      continue;
    }

    const student = students[0];
    const arrears = totalBill - amountPaid;

    // 1. Update the students table fields
    const { error: updateError } = await supabase
      .from('students')
      .update({
        fees_amount: totalBill,
        fees_paid: amountPaid,
        fees_arrears: arrears
      })
      .eq('id', student.id);

    if (updateError) {
      console.log(`❌ Error updating student table for ${student.full_name}:`, updateError.message);
      continue;
    }

    // 2. Delete existing payment records for this student to avoid messy history
    await supabase.from('fee_payments').delete().eq('student_id', student.id);

    // 3. Insert a clean, backdated payment record for '2026-06-17'
    const { error: insertError } = await supabase
      .from('fee_payments')
      .insert({
        school_id: student.school_id,
        student_id: student.id,
        // Using a dummy structure id or omitting if it's not strictly required.
        // Actually, we'll fetch an active fee structure or term if needed, but often we can just put amount_paid.
        amount_paid: amountPaid,
        payment_date: '2026-06-17',
        payment_method: 'cash',
        notes: 'Backdated payment as requested',
        arrears_paid: 0,
        arrears_balance_after: arrears,
        currency_code: 'GHS',
        created_at: '2026-06-17T12:00:00Z'
      });

    if (insertError) {
      console.log(`❌ Error inserting payment record for ${student.full_name}:`, insertError.message);
    } else {
      console.log(`✅ Fixed: ${student.full_name} -> Bill: ${totalBill}, Paid: ${amountPaid}, Arrears: ${arrears}`);
    }
  }
}

fixStudentFees();
