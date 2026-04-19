import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'missing_url'
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'missing_key'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function testQuery() {
  const { data, error } = await supabase.from('teacher_assignments')
    .select('*, teacher:teachers(id, staff_id, user:users(full_name, avatar_url))')
    .limit(1)
  console.log("Error:", error)
  console.log("Data:", JSON.stringify(data, null, 2))
}
testQuery()
