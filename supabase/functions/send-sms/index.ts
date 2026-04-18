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
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing environment variables.");
    }

    // Initialize admin client to fetch school credentials
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller identity
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error("Missing Authorization header");

    const callerClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user: callerToken }, error: authErr } = await callerClient.auth.getUser();
    if (authErr || !callerToken) throw new Error("Unauthorized");

    // Get caller profile
    const { data: profile } = await adminClient
      .from('users')
      .select('school_id, role, full_name')
      .eq('id', callerToken.id)
      .single();

    if (!profile) throw new Error("User profile not found");
    if (!['admin', 'super_admin', 'bursar'].includes(profile.role)) {
      throw new Error("Unauthorized role for SMS");
    }

    const { school_id, recipient, message } = await req.json();

    // Ensure user belongs to the target school
    if (profile.role !== 'super_admin' && school_id !== profile.school_id) {
      throw new Error("Cannot send SMS for another school");
    }

    // Use Global Hubtel Credentials from Secrets
    const hubtelClientId = Deno.env.get('HUBTEL_CLIENT_ID');
    const hubtelClientSecret = Deno.env.get('HUBTEL_CLIENT_SECRET');
    const hubtelSenderId = Deno.env.get('HUBTEL_SENDER_ID') || 'WULA';

    if (!hubtelClientId || !hubtelClientSecret) {
      throw new Error("Global Hubtel credentials not configured in Supabase Secrets");
    }

    // Normalize phone number (Ghana specific: 024 -> 23324)
    let phone = recipient.replace(/\s+/g, '').replace('+', '');
    if (phone.startsWith('0')) {
      phone = '233' + phone.substring(1);
    } else if (!phone.startsWith('233')) {
      phone = '233' + phone;
    }

    // Hubtel API call
    const authToken = btoa(`${hubtelClientId}:${hubtelClientSecret}`);
    const hubtelResponse = await fetch(`https://api-v2.hubtel.com/messages/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        From: hubtelSenderId,
        To: phone,
        Content: message,
        Type: 0 
      })
    });

    const result = await hubtelResponse.json();

    // LOGGING: Track usage in the sms_logs table
    if (hubtelResponse.ok) {
      const segments = Math.ceil(message.length / 160) || 1;
      await adminClient.from('sms_logs').insert({
        school_id,
        sender_id: callerToken.id,
        recipient: phone,
        content: message,
        segments,
        status: 'sent'
      });
    }

    return new Response(JSON.stringify({ success: hubtelResponse.ok, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, // Return 200 to allow custom error handling on client
    });
  }
});
