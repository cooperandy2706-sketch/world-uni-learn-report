import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config()
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!)

async function run() {
  const { data: classes } = await supabase.from('classes').select('id, name').ilike('name', '%orchid%')
  console.log('Classes:', classes)
  if (classes?.length) {
    const { data: students } = await supabase.from('students').select('id, full_name, is_active').eq('class_id', classes[0].id)
    console.log('Students in class:', students?.length, students)
  }
}
run()
