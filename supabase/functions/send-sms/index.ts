import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ARKESEL_API_URL = 'https://sms.arkesel.com/api/v2/sms/send'
const ARKESEL_SENDER  = 'ESTEVROYAL'
const MSG_PREFIX      = 'ESTEV ROYAL: '
const BATCH_SIZE      = 50

/** Normalise a raw phone string to 233XXXXXXXXX format */
function normalisePhone(raw: string): string {
  let p = raw.replace(/\s+/g, '').replace(/^\+/, '')
  if (p.startsWith('0')) p = '233' + p.substring(1)
  else if (!p.startsWith('233')) p = '233' + p
  return p
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl    = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (!supabaseUrl || !serviceRoleKey) throw new Error('Missing Supabase environment variables.')

    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    // ── Auth ──────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Authorization header')

    const callerClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } }
    })
    const { data: { user: callerToken }, error: authErr } = await callerClient.auth.getUser()
    if (authErr || !callerToken) throw new Error('Unauthorized')

    // ── Role check ────────────────────────────────────────
    const { data: profile } = await adminClient
      .from('users')
      .select('school_id, role, full_name')
      .eq('id', callerToken.id)
      .single()

    if (!profile) throw new Error('User profile not found')
    if (!['admin', 'super_admin', 'bursar'].includes(profile.role)) {
      throw new Error('Unauthorized role for SMS')
    }

    // ── Payload ───────────────────────────────────────────
    const body = await req.json()
    const schoolId: string = body.school_id ?? profile.school_id

    if (profile.role !== 'super_admin' && schoolId !== profile.school_id) {
      throw new Error('Cannot send SMS for another school')
    }

    // Accept either single `recipient` (legacy) or `recipients` array
    let recipients: string[] = []
    if (Array.isArray(body.recipients) && body.recipients.length > 0) {
      recipients = body.recipients.map(normalisePhone)
    } else if (typeof body.recipient === 'string' && body.recipient.trim()) {
      recipients = [normalisePhone(body.recipient.trim())]
    }

    if (recipients.length === 0) throw new Error('Missing recipient phone number(s)')

    const rawMessage: string = body.message ?? ''
    if (!rawMessage.trim()) throw new Error('Missing message content')

    // Always prefix the message for sender identification
    const message = rawMessage.startsWith(MSG_PREFIX)
      ? rawMessage
      : MSG_PREFIX + rawMessage

    // ── Arkesel API key ───────────────────────────────────
    const arkeselApiKey = Deno.env.get('ARKESEL_API_KEY')
    if (!arkeselApiKey) throw new Error('ARKESEL_API_KEY not configured in Supabase Secrets')

    // ── Bulk send in batches of 50 ────────────────────────
    const batchResults: Array<{
      batch: number
      recipients: string[]
      status: 'sent' | 'failed'
      response: unknown
    }> = []

    let totalSent    = 0
    let totalFailed  = 0

    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch      = recipients.slice(i, i + BATCH_SIZE)
      const batchIndex = Math.floor(i / BATCH_SIZE) + 1

      try {
        const arkeselRes = await fetch(ARKESEL_API_URL, {
          method: 'POST',
          headers: {
            'api-key':      arkeselApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sender:     ARKESEL_SENDER,
            message,
            recipients: batch,
          }),
        })

        const contentType = arkeselRes.headers.get('content-type') ?? ''
        let apiResponse: unknown
        if (contentType.includes('application/json')) {
          apiResponse = await arkeselRes.json()
        } else {
          const text = await arkeselRes.text()
          apiResponse = { raw: text || 'Empty response from Arkesel' }
        }

        // Arkesel v2 returns { status: "success" } on success
        const isSuccess = arkeselRes.ok &&
          typeof apiResponse === 'object' &&
          apiResponse !== null &&
          (apiResponse as Record<string, unknown>).status === 'success'
        const batchStatus: 'sent' | 'failed' = isSuccess ? 'sent' : 'failed'

        batchResults.push({ batch: batchIndex, recipients: batch, status: batchStatus, response: apiResponse })

        // Log every phone number in this batch
        const logRows = batch.map((phone) => ({
          school_id:   schoolId,
          sender_id:   callerToken.id,
          recipient:   phone,          // matches existing DB column name
          content:     message,         // matches existing DB column name
          status:      batchStatus,
          response:    JSON.stringify(apiResponse),  // new column (added via migration)
          segments:    Math.ceil(message.length / 160) || 1,
        }))

        await adminClient.from('sms_logs').insert(logRows)

        if (isSuccess) totalSent  += batch.length
        else           totalFailed += batch.length

      } catch (batchErr: unknown) {
        const errMsg = batchErr instanceof Error ? batchErr.message : String(batchErr)
        const errPayload = { error: errMsg }
        batchResults.push({ batch: batchIndex, recipients: batch, status: 'failed', response: errPayload })

        const logRows = batch.map((phone) => ({
          school_id:   schoolId,
          sender_id:   callerToken.id,
          recipient:   phone,
          content:     message,
          status:      'failed' as const,
          response:    JSON.stringify(errPayload),
          segments:    Math.ceil(message.length / 160) || 1,
        }))
        await adminClient.from('sms_logs').insert(logRows)
        totalFailed += batch.length
      }
    }

    const overallSuccess = totalFailed === 0

    return new Response(
      JSON.stringify({
        success: overallSuccess,
        message: `${totalSent} sent, ${totalFailed} failed out of ${recipients.length} recipient(s).`,
        data: batchResults,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err)
    return new Response(
      JSON.stringify({ success: false, error: errMsg }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  }
})
