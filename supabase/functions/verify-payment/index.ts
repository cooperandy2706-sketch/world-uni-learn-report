// supabase/functions/verify-payment/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
  }

  try {
    const { reference, student_id, term_id, school_id } = await req.json()

    // 1. Verify with Paystack
    const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    })
    const data = await res.json()

    if (!data.status || data.data.status !== 'success') {
      return new Response(JSON.stringify({ error: 'Payment verification failed' }), { status: 400 })
    }

    const amountPaid = data.data.amount / 100 // Convert back from pesewas

    // 2. Initialize Supabase Admin Client
    const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // 3. Check if reference already exists to prevent double entry
    const { data: existing } = await supabaseAdmin
      .from('fee_payments')
      .select('id')
      .eq('reference', reference)
      .maybeSingle()

    if (existing) {
      return new Response(JSON.stringify({ success: true, message: 'Already recorded' }), { status: 200 })
    }

    // 4. Record payment using RPC
    const { data: result, error: rpcErr } = await supabaseAdmin.rpc('record_online_payment', {
      p_student_id: student_id,
      p_term_id: term_id,
      p_school_id: school_id,
      p_amount: amountPaid,
      p_reference: reference
    })

    if (rpcErr) throw rpcErr

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 500,
    })
  }
})
