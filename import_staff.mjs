import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const staffRaw = `	•	COMFORT NORSHIE
CRECHE
024 908 7215
	•	HELENA GBEDZRAH
CRECHE
0533237238
	•	ABIGAIL NOMO
NURSERY 1
059 414 7603
	•	ELIZABETH BOADI
NURSERY 2
024 257 2753
	•	STELLA ADZAGBA
K G 1
024 613 2964
	•	RUFINA AHAMADZI
K G 2
024 539 7344
	•	EMMANUELLA OPPONG
BASIC 1 
0208994770
	•	EUNICE EZUAME
BASIC 1 
024 758 6789
	•	OPHELIA SWANZY 
BASIC 2 
0248809773
	•	EMMANUEL ADOFO
BASIC 2
024 494 1310
	•	RACHEL KWENOR
BASIC 3
054 712 8808
	•	EVANS BOATENG
BASIC 3
055 202 3306
	•	NORDOR CHRISTINE
B4 – 9  C. ARTS
0249974409
	•	SETH ARHINFUL
B 3 – 5 COMP
024 103 5179
	•	JOHN DUNUGBE
B 4 – 6 SCIENCE
0537991511
	•	RAYMOND BANKESIE
B 4 – 6 MATHS
054 633 3971
	•	BERLINDA N. BANINI
B 4 – 6 ENGLISH
0263032664
	•	NOBLE RODGY
B 4 – 6 RME & HIST.
024 060 6274
	•	GABRIEL AGBO
JHS SOC STD
054 128 3876
	•	RICHARD AWUSAH
JHS R M E
0555121005
	•	ERNESTINA GAISIE
JHS CAREER TECH
054 619 1010
	•	SAMUEL KPELI
B6 - B9 COMP
024 066 5042
	•	ERIC AKUTIA
JHS ENGLISH
054 252 3337
	•	THOMAS AGADAM
JHS MATHS
054 847 4129
	•	OPOKU SAMUEL
JHS SCIENCE
053 092 1872
	•	DZAKPASU AUGUSTINE
FRENCH
0242727595`;

const run = async () => {
  // Find school ID for "sky educational institute"
  const { data: schools, error: schoolErr } = await supabase
    .from('schools')
    .select('id, name')
    .ilike('name', '%sky%');
    
  if (schoolErr || !schools || schools.length === 0) {
    console.error("School not found:", schoolErr);
    return;
  }
  const schoolId = schools[0].id;
  console.log("Using School:", schools[0].name, "ID:", schoolId);

  const lines = staffRaw.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const staffList = [];
  
  for (let i = 0; i < lines.length; i += 3) {
    const rawName = lines[i].replace(/^[•\t\s]+/, '').trim();
    const designation = lines[i+1];
    const phone = lines[i+2];
    
    // First name logic
    const firstName = rawName.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    const email = `${firstName}@sky1.com`;
    
    staffList.push({ name: rawName, designation, phone, email });
  }

  for (const staff of staffList) {
    console.log(`Creating ${staff.name} (${staff.email})...`);
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: staff.email,
        password: 'sky12345',
        email_confirm: true,
        user_metadata: { full_name: staff.name }
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          console.log(`  -> Already exists in auth.`);
          // fetch ID
          const { data: u } = await supabase.from('users').select('id').eq('email', staff.email).single();
          if (u) {
            await insertTeacher(u.id, schoolId, staff);
          }
          continue;
        }
        throw authError;
      }

      const newUserId = authData.user.id;
      
      const { error: profError } = await supabase.from('users').upsert({
        id: newUserId,
        school_id: schoolId,
        full_name: staff.name,
        email: staff.email,
        phone: staff.phone || null,
        role: 'teacher',
        is_active: true,
        designation: staff.designation
      });

      if (profError) throw profError;
      
      await insertTeacher(newUserId, schoolId, staff);
      console.log(`  -> Success!`);
    } catch (err) {
      console.error(`  -> Failed for ${staff.name}:`, err.message);
    }
  }
};

async function insertTeacher(userId, schoolId, staff) {
  const { error } = await supabase.from('teachers').upsert({
    user_id: userId,
    school_id: schoolId,
    employment_type: 'full_time',
  }, { onConflict: 'user_id' });
  if (error && !error.message.includes('unique')) {
    console.error(`     Teacher insert error:`, error.message);
  }
}

run();
