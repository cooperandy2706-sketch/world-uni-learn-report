import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkSchema() {
  const { data: cols } = await supabase.rpc('get_table_columns', { table_name: 'students' });
  console.log('If get_table_columns fails, checking first student:');
  const { data: student } = await supabase.from('students').select('*').limit(1);
  console.log('Student columns:', Object.keys(student[0]));
  
  const { data: feeTypes } = await supabase.from('fee_structures').select('*').limit(3);
  console.log('Fee structures:', feeTypes);
  
  const { data: bills } = await supabase.from('student_fees').select('*').limit(1).catch(e => ({data: null}));
  console.log('student_fees table exists?', !!bills);
  
  const { data: bills2 } = await supabase.from('student_fee_balances').select('*').limit(1).catch(e => ({data: null}));
  console.log('student_fee_balances table exists?', !!bills2);
}

checkSchema();
