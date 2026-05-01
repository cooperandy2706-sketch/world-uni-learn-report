import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl!, supabaseAnonKey!)

async function checkKey() {
  const { data, error } = await supabase.from('schools').select('id, name, paystack_public_key').limit(5)
  console.log(JSON.stringify(data, null, 2))
}

checkKey()
