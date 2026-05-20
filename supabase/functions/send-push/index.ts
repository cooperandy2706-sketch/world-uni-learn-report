// @ts-nocheck
// supabase/functions/send-push/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import webpush from "npm:web-push@3.6.7"
import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY") || Deno.env.get("VITE_VAPID_PUBLIC_KEY")
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")
    
    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error("Missing VAPID keys. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in Supabase Secrets.")
    }

    // Initialize Web Push
    webpush.setVapidDetails(
      "mailto:admin@nexora.app",
      vapidPublicKey,
      vapidPrivateKey
    )

    // 2. Authenticate the caller
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) throw new Error(`Unauthorized: ${authError?.message ?? 'No session'}`)

    // 3. Verify Admin role
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('users')
      .select('role, school_id')
      .eq('id', user.id)
      .single()
      
    if (profileError || !userProfile) throw new Error("Could not verify user profile.")
    if (userProfile.role !== 'admin') {
      throw new Error("Forbidden: Only admins can broadcast push notifications.")
    }

    // 4. Parse request body
    const bodyParams = await req.json()
    const { title, body, target_school_id } = bodyParams
    
    if (!title || !body) throw new Error("Missing required fields: title and body.")
    
    // Safety check: admins can ONLY send to their own school
    const effectiveSchoolId = target_school_id || userProfile.school_id
    if (effectiveSchoolId !== userProfile.school_id) {
       throw new Error("Forbidden: You can only send notifications to your own school.")
    }

    // 5. Connect as Service Role to read all subscriptions for the school
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    // Fetch subscriptions for all users in the specific school using a two-step lookup to bypass PostgREST join mapping failures
    const { data: schoolUsers, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('school_id', effectiveSchoolId)
      
    if (usersError) throw new Error(`Database error fetching school users: ${usersError.message}`)
    
    const userIds = (schoolUsers || []).map(u => u.id)
    let subs: any[] = []
    
    if (userIds.length > 0) {
      const { data: fetchedSubs, error: subsError } = await supabaseAdmin
        .from('push_subscriptions')
        .select('*')
        .in('user_id', userIds)
        
      if (subsError) throw new Error(`Database error fetching subscriptions: ${subsError.message}`)
      subs = fetchedSubs || []
    }
    
    if (subs.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No active device subscriptions found for this school." }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 6. Broadcast notifications
    const payload = JSON.stringify({ 
      title, 
      body, 
      url: '/teacher/notifications', // Default target
      icon: '/icon-192.png',
      badge: '/badge-72.png'
    })

    let successCount = 0
    let failureCount = 0

    const promises = subs.map(async (sub) => {
      try {
        await webpush.sendNotification({
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth }
        }, payload)
        successCount++
      } catch (err: any) {
        failureCount++
        console.error(`Error sending push to ${sub.user_id}:`, err.message)
        // Auto-cleanup expired/invalid subscriptions (404 or 410)
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabaseAdmin.from('push_subscriptions').delete().eq('id', sub.id)
        }
      }
    })

    await Promise.all(promises)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Broadcast complete. Sent to ${successCount} devices. (${failureCount} failures handled)` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error("Function Error:", error.message)
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
