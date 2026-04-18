import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  // test inserting class_id = null
  const { data, error } = await supabase.from('syllabus').insert({
    school_id: 'any',
    class_id: null,
    subject_id: null,
    term_id: null,
    title: 'test null class',
    file_url: 'http://test',
    file_name: 'test.pdf',
    uploaded_by: null
  });
  console.log('Error:', error);
}

run();
