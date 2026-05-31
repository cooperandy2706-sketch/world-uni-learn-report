// @ts-nocheck
// supabase/functions/verify-payment/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const ALLOW_PAYMENT_SANDBOX = Deno.env.get('ALLOW_PAYMENT_SANDBOX') === 'true'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function callerMayRecordPayment(
  callerClient: ReturnType<typeof createClient>,
  callerId: string,
  studentId: string,
  schoolId: string,
): Promise<boolean> {
  const { data: profile } = await callerClient
    .from('users')
    .select('role, school_id')
    .eq('id', callerId)
    .maybeSingle()

  if (!profile) return false

  const staffRoles = ['admin', 'super_admin', 'bursar', 'proprietor']
  if (staffRoles.includes(profile.role) && profile.school_id === schoolId) {
    return true
  }

  if (profile.role === 'parent') {
    const { data: ward } = await callerClient
      .from('parent_wards')
      .select('student_id')
      .eq('parent_id', callerId)
      .eq('student_id', studentId)
      .maybeSingle()
    return !!ward
  }

  return false
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Server configuration error')
    }

    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user: caller }, error: authErr } = await callerClient.auth.getUser()
    if (authErr || !caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const { reference, student_id, term_id, school_id, amount } = await req.json()

    if (!reference || !student_id || !term_id || !school_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: corsHeaders })
    }

    const allowed = await callerMayRecordPayment(callerClient, caller.id, student_id, school_id)
    if (!allowed) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders })
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: studentRow } = await supabaseAdmin
      .from('students')
      .select('id, school_id')
      .eq('id', student_id)
      .maybeSingle()

    if (!studentRow || studentRow.school_id !== school_id) {
      return new Response(JSON.stringify({ error: 'Invalid student or school' }), { status: 400, headers: corsHeaders })
    }

    let amountPaid = 0
    const isSandboxRef = reference.startsWith('sandbox_') || reference.startsWith('sim_')

    if (isSandboxRef) {
      if (!ALLOW_PAYMENT_SANDBOX) {
        return new Response(JSON.stringify({ error: 'Sandbox payments are disabled' }), { status: 400, headers: corsHeaders })
      }
      const sandboxAmount = Number(amount)
      if (!Number.isFinite(sandboxAmount) || sandboxAmount <= 0) {
        return new Response(JSON.stringify({ error: 'Invalid sandbox amount' }), { status: 400, headers: corsHeaders })
      }
      amountPaid = sandboxAmount
    } else {
      if (!PAYSTACK_SECRET_KEY) {
        throw new Error('PAYSTACK_SECRET_KEY is not configured')
      }

      const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
      })
      const data = await res.json()

      if (!data.status || data.data.status !== 'success') {
        return new Response(JSON.stringify({ error: 'Payment verification failed' }), { status: 400, headers: corsHeaders })
      }

      amountPaid = data.data.amount / 100
    }

    const { data: existing } = await supabaseAdmin
      .from('fee_payments')
      .select('id')
      .eq('reference_number', reference)
      .maybeSingle()

    if (existing) {
      return new Response(JSON.stringify({ success: true, message: 'Already recorded' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: result, error: rpcErr } = await supabaseAdmin.rpc('record_online_payment', {
      p_student_id: student_id,
      p_term_id: term_id,
      p_school_id: school_id,
      p_amount: amountPaid,
      p_reference: reference,
    })

    if (rpcErr) throw rpcErr

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
