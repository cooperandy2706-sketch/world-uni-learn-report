import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function fixFees() {
  const { data: terms } = await supabase.from('terms').select('*').eq('is_current', true).limit(1);
  if (!terms || terms.length === 0) {
    console.log("No current term found.");
    return;
  }
  const termId = terms[0].id;
  const yearId = terms[0].academic_year_id;

  const records = [
    { search: 'Dadzie Doris', bill: 980, paid: 600 },
    { search: 'Attikey Akusika', bill: 760, paid: 760 },
    { search: 'Amedeka Sedem', bill: 650, paid: 300 }
  ];

  for (const rec of records) {
    const { data: students } = await supabase.from('students').select('*').ilike('full_name', `%${rec.search}%`).limit(1);
    if (!students || students.length === 0) continue;
    const s = students[0];

    // Create or update Fee Structure for this student's class
    const { data: existingStructs } = await supabase
      .from('fee_structures')
      .select('*')
      .eq('class_id', s.class_id)
      .eq('term_id', termId)
      .eq('fee_name', 'Tuition Fee');

    let structId = null;
    if (!existingStructs || existingStructs.length === 0) {
      const { data: newStruct, error } = await supabase.from('fee_structures').insert({
        school_id: s.school_id,
        class_id: s.class_id,
        term_id: termId,
        academic_year_id: yearId,
        fee_name: 'Tuition Fee',
        amount: rec.bill,
        currency_code: 'GHS',
        is_discountable: true
      }).select().single();
      
      if (error) console.log(`Error creating structure for ${s.full_name}:`, error);
      else structId = newStruct.id;
    } else {
      structId = existingStructs[0].id;
      await supabase.from('fee_structures').update({ amount: rec.bill }).eq('id', structId);
    }

    // Insert or update the payment
    const paymentDate = '2026-06-17T12:00:00Z'; // Backdated to 17th June 2026
    
    // Check if they already have payments
    const { data: existingPayments } = await supabase.from('fee_payments')
        .select('*')
        .eq('student_id', s.id);

    if (existingPayments && existingPayments.length > 0) {
        // Update first payment
        const paymentId = existingPayments[0].id;
        const { error } = await supabase.from('fee_payments').update({
            amount_paid: rec.paid,
            payment_date: paymentDate,
            term_id: termId,
            academic_year_id: yearId,
            fee_structure_id: structId
        }).eq('id', paymentId);
        if (error) console.error(`Error updating payment for ${s.full_name}:`, error);
        else console.log(`Updated payment for ${s.full_name} to ${rec.paid} GHS on 17th June`);
        
        // Delete any extra payments to avoid duplicates
        for (let i = 1; i < existingPayments.length; i++) {
             await supabase.from('fee_payments').delete().eq('id', existingPayments[i].id);
        }
    } else {
        // Insert new payment
        const { error } = await supabase.from('fee_payments').insert({
            school_id: s.school_id,
            student_id: s.id,
            term_id: termId,
            academic_year_id: yearId,
            fee_structure_id: structId,
            amount_paid: rec.paid,
            payment_date: paymentDate,
            payment_method: 'cash',
            reference_number: `REC-${Date.now()}-${s.id.substring(0,4)}`,
            recorded_by: s.id, // Just using some UUID
            currency_code: 'GHS'
        });
        if (error) console.log(`Error inserting payment for ${s.full_name}:`, error);
        else console.log(`Inserted payment for ${s.full_name} of ${rec.paid} GHS on 17th June`);
    }
    
    await supabase.from('students').update({ arrears_amount: 0 }).eq('id', s.id);
  }
}

fixFees();
