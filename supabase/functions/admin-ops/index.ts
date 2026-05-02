import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing built-in environment variables.");
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error("Missing Authorization header");

    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user: callerToken }, error: callerAuthErr } = await callerClient.auth.getUser();
    if (callerAuthErr || !callerToken) throw new Error("Unauthorized caller");

    const { data: callerProfile } = await callerClient
      .from('users')
      .select('role, school_id')
      .eq('id', callerToken.id)
      .single();

    if (!callerProfile) throw new Error("Could not verify caller profile");

    const isAdmin = callerProfile.role === 'admin' || callerProfile.role === 'super_admin';
    const isTeacher = callerProfile.role === 'teacher';

    const body = await req.json();
    const { action, payload } = body;

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    if (action === 'create-user') {
      const { email, password, full_name, role, phone, metadata, target_school_id } = payload;
      const schoolId = callerProfile.role === 'super_admin' ? target_school_id : callerProfile.school_id;

      if (!isAdmin && !(isTeacher && (role === 'student' || role === 'parent'))) {
        throw new Error("Not authorized to create this user.");
      }

      let newUserId: string;

      try {
        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
          email, password, email_confirm: true, user_metadata: { full_name }
        });
        if (authError) throw authError;

        newUserId = authData.user.id;

        const { error: profError } = await adminClient.from('users').upsert({
          id: newUserId, school_id: schoolId, full_name, email, phone: phone || null, role, is_active: true
        });
        if (profError) {
          await adminClient.auth.admin.deleteUser(newUserId)
          throw profError;
        }
      } catch (err: any) {
        if (role === 'parent' && (err.message?.toLowerCase().includes('already exists') || err.message?.toLowerCase().includes('registered'))) {
          // If parent already exists, fetch their user ID to link the new student
          const { data: extUser } = await adminClient.from('users').select('id, role, school_id').eq('email', email).single();
          if (extUser && extUser.role === 'parent' && extUser.school_id === schoolId) {
             newUserId = extUser.id;
          } else {
             throw new Error("Email exists but is not a parent account for this school.");
          }
        } else {
          throw err;
        }
      }

      if (role === 'teacher') {
         if (metadata?.link_id) {
           await adminClient.from('teachers').update({ user_id: newUserId }).eq('id', metadata.link_id);
         } else {
           await adminClient.from('teachers').insert({ user_id: newUserId, school_id: schoolId, staff_id: metadata?.staff_id || null, department_id: metadata?.department_id || null });
         }
      } else if (role === 'student') {
         if (metadata?.link_id) {
           await adminClient.from('students').update({ user_id: newUserId }).eq('id', metadata.link_id);
         } else {
           await adminClient.from('students').insert({ user_id: newUserId, school_id: schoolId, class_id: metadata?.class_id, student_id: metadata?.student_id, full_name, is_active: true });
         }
      } else if (role === 'parent') {
         if (metadata?.link_id) {
           // Ensure it doesn't fail if they link the same student twice (handled by ON CONFLICT if we use upsert, but we'll try to insert and ignore error)
           const { error: linkErr } = await adminClient.from('parent_wards').insert({
              school_id: schoolId,
              parent_user_id: newUserId,
              student_id: metadata.link_id
           });
           // We can ignore unique violation if they try to link the same child twice
           if (linkErr && !linkErr.message.includes('unique constraint')) {
              throw linkErr;
           }
         }
      }

      return new Response(JSON.stringify({ success: true, user_id: newUserId }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    if (action === 'delete-user') {
      const { target_user_id, role, specific_ids } = payload;
      if (!isAdmin) throw new Error("Only admins can delete users.");

      const { data: target } = await adminClient.from('users').select('school_id').eq('id', target_user_id).single();
      if (callerProfile.role !== 'super_admin' && target?.school_id !== callerProfile.school_id) {
        throw new Error("Cannot delete users from a different school.");
      }

      if (role === 'teacher' && specific_ids?.teacher_id) {
         await adminClient.from('teacher_assignments').delete().eq('teacher_id', specific_ids.teacher_id);
         await adminClient.from('weekly_goals').delete().eq('teacher_id', specific_ids.teacher_id);
         await adminClient.from('teachers').delete().eq('id', specific_ids.teacher_id);
      } else if (role === 'student') {
         // Optionally clear the user_id link logically if that represents your deletion style
         await adminClient.from('students').delete().eq('user_id', target_user_id);
      }

      await adminClient.from('users').delete().eq('id', target_user_id);
      const { error } = await adminClient.auth.admin.deleteUser(target_user_id);
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    if (action === 'create-school-with-admin') {
      if (callerProfile.role !== 'super_admin') {
        throw new Error("Only super admins can create new schools directly.");
      }

      const { school, admin } = payload;

      // 1. Create the school
      const { data: newSchool, error: sErr } = await adminClient.from('schools').insert({
        name: school.name,
        email: school.email,
        phone: school.phone,
        address: school.address,
        motto: school.motto,
        status: school.status || 'active'
      }).select('id').single();

      if (sErr) throw sErr;
      const schoolId = newSchool.id;

      // 2. Create the admin user
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email: admin.email,
        password: admin.password,
        email_confirm: true,
        user_metadata: { full_name: admin.full_name }
      });

      if (authError) {
        await adminClient.from('schools').delete().eq('id', schoolId);
        throw authError;
      }

      const newUserId = authData.user.id;

      const { error: profError } = await adminClient.from('users').upsert({
        id: newUserId,
        school_id: schoolId,
        full_name: admin.full_name,
        email: admin.email,
        role: 'admin',
        is_active: true
      });

      if (profError) {
        await adminClient.auth.admin.deleteUser(newUserId);
        await adminClient.from('schools').delete().eq('id', schoolId);
        throw profError;
      }

      return new Response(JSON.stringify({ success: true, school_id: schoolId, admin_id: newUserId }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    if (action === 'reset-password') {
      const { target_user_id, password } = payload;
      if (!isAdmin) throw new Error("Only admins can reset passwords.");

      const { error } = await adminClient.auth.admin.updateUserById(target_user_id, { password });
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    return new Response(JSON.stringify({ error: 'Unknown Action' }), { status: 200, headers: corsHeaders });
  } catch (err: any) {
    // ALWAYS return status 200 here so edge function gateway doesn't intercept it
    return new Response(JSON.stringify({ error: err.message }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
