const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf8');
const urlMatch = envFile.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

async function run() {
  const { data, error } = await supabase
    .from('lesson_plans')
    .select(`
      id, teacher_id, topic, content, status, feedback, submitted_at,
      teacher:teachers(user:users(first_name, last_name)),
      class:classes(name),
      subject:subjects(name)
    `)
    .limit(1);
    
  console.log('Error:', error);
}

run();
