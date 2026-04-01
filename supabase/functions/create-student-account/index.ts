// supabase/functions/create-student-account/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // 1. Get the requester's JWT to verify their role
    const authHeader = req.headers.get('Authorization')!
    const { data: { user: requester }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))
    
    if (authError || !requester) {
      throw new Error('Unauthorized')
    }

    // 2. Fetch the requester's record from public.users to check role
    const { data: requesterProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', requester.id)
      .single()

    if (profileError || !['admin', 'teacher', 'super_admin'].includes(requesterProfile.role)) {
      throw new Error('Forbidden: Insufficient permissions')
    }

    // 3. Get the payload
    const { email, password, fullName, studentId, schoolId } = await req.json()

    if (!email || !password || !fullName || !studentId || !schoolId) {
      throw new Error('Missing required fields: email, password, fullName, studentId, schoolId')
    }

    // 4. Create the Auth user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: 'student' }
    })

    if (createError) throw createError

    // 5. Create the public.users record
    const { error: userInsertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: newUser.user.id,
        email: email,
        full_name: fullName,
        role: 'student',
        school_id: schoolId,
        is_active: true
      })

    if (userInsertError) {
      // Cleanup auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      throw userInsertError
    }

    // 6. Link the student record to the new user
    const { error: studentUpdateError } = await supabaseAdmin
      .from('students')
      .update({ user_id: newUser.user.id })
      .eq('id', studentId)

    if (studentUpdateError) {
      // Note: We don't necessarily delete the user here, but we should log it
      console.error('Failed to link student record:', studentUpdateError)
    }

    return new Response(JSON.stringify({ 
      message: 'Student account created successfully',
      userId: newUser.user.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
