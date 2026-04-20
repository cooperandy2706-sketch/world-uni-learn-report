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

    if (!recipient) throw new Error("Missing recipient phone number");
    if (!message || !message.trim()) throw new Error("Missing message content");

    // Ensure user belongs to the target school
    if (profile.role !== 'super_admin' && school_id !== profile.school_id) {
      throw new Error("Cannot send SMS for another school");
    }

    // Use Global Africa's Talking Credentials from Secrets
    const atUsername = Deno.env.get('AT_USERNAME');
    const atApiKey = Deno.env.get('AT_API_KEY');
    const atSenderId = Deno.env.get('AT_SENDER_ID');

    if (!atUsername || !atApiKey) {
      throw new Error("Global Africa's Talking credentials not configured in Supabase Secrets");
    }

    // Normalize phone number (Ghana specific: 024 -> +23324, AT usually expects the + sign)
    let phone = recipient.replace(/\s+/g, '').replace('+', '');
    if (phone.startsWith('0')) {
      phone = '+233' + phone.substring(1);
    } else if (!phone.startsWith('233')) {
      phone = '+233' + phone;
    } else if (phone.startsWith('233')) {
      phone = '+' + phone;
    }

    // Africa's Talking API call (Dynamically switch to Sandbox if username is 'sandbox')
    const isSandbox = atUsername.toLowerCase() === 'sandbox';
    const apiUrl = isSandbox 
      ? `https://api.sandbox.africastalking.com/version1/messaging`
      : `https://api.africastalking.com/version1/messaging`;

    const params = new URLSearchParams();
    params.append('username', atUsername);
    params.append('to', phone);
    params.append('message', message);
    if (atSenderId && !isSandbox) {
      params.append('from', atSenderId);
    }

    const atResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'apiKey': atApiKey,
      },
      body: params.toString()
    });

    // Robust parsing: AT sometimes returns plain text errors
    const contentType = atResponse.headers.get('content-type') || '';
    let result;
    if (contentType.includes('application/json')) {
      result = await atResponse.json();
    } else {
      const text = await atResponse.text();
      result = { errorMessage: text || 'Unknown Error from Africa\'s Talking' };
    }

    const isSuccess = atResponse.ok;
    const finalError = result?.errorMessage || result?.error || (isSuccess ? null : 'SMS Delivery Failed');

    // LOGGING: Track usage in the sms_logs table
    if (isSuccess) {
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

    return new Response(JSON.stringify({ success: isSuccess, data: result, error: finalError }), {
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
