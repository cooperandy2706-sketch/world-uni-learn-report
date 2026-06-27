import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function fixBillingProperly() {
  const { data: terms } = await supabase.from('terms').select('*').eq('is_current', true).limit(1);
  if (!terms || terms.length === 0) {
    console.log("No current term found.");
    return;
  }
  const termId = terms[0].id;
  const yearId = terms[0].academic_year_id;

  const config = [
    { search: 'Dadzie', bill: 980 },
    { search: 'Attikey', bill: 760 },
    { search: 'Amedeka', bill: 650 }
  ];

  for (const c of config) {
    const { data: students } = await supabase.from('students').select('*').ilike('full_name', `%${c.search}%`).limit(1);
    if (!students || students.length === 0) continue;
    const s = students[0];

    // 1. Setup the Fee Structure for their class so the system knows the bill amount
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
        amount: c.bill,
        currency_code: 'GHS',
        is_discountable: true
      }).select().single();
      
      if (error) console.log(`Error creating structure for ${s.full_name}:`, error);
      else {
        structId = newStruct.id;
        console.log(`Created Tuition Fee structure for ${s.full_name}'s class: ${c.bill} GHS`);
      }
    } else {
      structId = existingStructs[0].id;
      // update amount to be exactly the requested bill
      await supabase.from('fee_structures').update({ amount: c.bill }).eq('id', structId);
      console.log(`Updated Tuition Fee structure for ${s.full_name}'s class to ${c.bill} GHS`);
    }

    // 2. Ensure their payment records are linked to the current term, year, and this fee structure
    const { error: pErr } = await supabase.from('fee_payments')
      .update({
        term_id: termId,
        academic_year_id: yearId,
        fee_structure_id: structId
      })
      .eq('student_id', s.id);
      
    if (pErr) console.log(`Error updating payment for ${s.full_name}:`, pErr);
    else console.log(`Linked payments for ${s.full_name} to the current term & fee structure.`);
  }
}

fixBillingProperly();
