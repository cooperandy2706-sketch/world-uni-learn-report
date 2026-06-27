import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function revertDuplicatePayment() {
  const { data: students } = await supabase.from('students').select('*').ilike('full_name', '%Sedem%').limit(1);
  if (!students || students.length === 0) return;
  const s = students[0];

  const { data: payments } = await supabase.from('fee_payments').select('*').eq('student_id', s.id).order('created_at', { ascending: false });
  console.log("Current payments for Emily:", payments);

  if (payments && payments.length > 1) {
    // Delete the most recent payment
    const paymentToDelete = payments[0];
    const { error } = await supabase.from('fee_payments').delete().eq('id', paymentToDelete.id);
    if (error) {
      console.error("Error deleting duplicate payment:", error);
    } else {
      console.log(`Deleted duplicate payment of ${paymentToDelete.amount_paid} GHS`);
      
      const { data: remainingPayments } = await supabase.from('fee_payments').select('amount_paid').eq('student_id', s.id);
      const totalPaid = remainingPayments.reduce((acc, p) => acc + (p.amount_paid || 0), 0);
      
      await supabase.from('students').update({ fees_paid: totalPaid }).eq('id', s.id);
      console.log(`Updated students.fees_paid back to ${totalPaid}`);
    }
  } else {
      console.log("Only one payment found, nothing to delete.");
  }
}

revertDuplicatePayment();
