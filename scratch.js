const url = process.env.VITE_SUPABASE_URL + '/rest/v1/teacher_assignments?select=*'
const key = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

fetch(url, {
  headers: {
    'apikey': key,
    'Authorization': 'Bearer ' + key
  }
}).then(r => r.json()).then(data => {
  console.log("Teacher assignments:", JSON.stringify(data, null, 2))
}).catch(e => console.error("Fetch error:", e))
