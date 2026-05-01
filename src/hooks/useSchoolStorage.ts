// src/hooks/useSchoolStorage.ts
// Calculates total school storage footprint from ALL sources:
// - student_documents (vaults), school_assets, school logo, DB row estimates

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

interface StorageBreakdown {
  vaultBytes: number       // student document files
  assetBytes: number       // asset manager files
  logoBytes: number        // school logo & signature images (estimated)
  dbFootprintBytes: number // estimated DB row weight (students, teachers, payments, messages)
  totalBytes: number
  limitGB: number
  percentUsed: number
  loading: boolean
}

const DEFAULT_LIMIT_GB = 5
// Rough per-row DB estimates (realistic for a school SaaS)
const BYTES_PER_STUDENT    = 2_048   // 2 KB
const BYTES_PER_TEACHER    = 3_072   // 3 KB
const BYTES_PER_PAYMENT    = 1_024   // 1 KB
const BYTES_PER_MESSAGE    = 512     // 0.5 KB
const BYTES_PER_REPORT_ROW = 512     // 0.5 KB
// School logo / signature estimation when we can't get actual size
const LOGO_ESTIMATE_BYTES  = 150_000 // 150 KB average

export function useSchoolStorage(schoolId: string | undefined): StorageBreakdown {
  const [state, setState] = useState<StorageBreakdown>({
    vaultBytes: 0, assetBytes: 0, logoBytes: 0,
    dbFootprintBytes: 0, totalBytes: 0,
    limitGB: DEFAULT_LIMIT_GB, percentUsed: 0, loading: true
  })

  const calculate = useCallback(async () => {
    if (!schoolId) return
    setState(s => ({ ...s, loading: true }))

    try {
      // 1. ── Physical file bytes stored in the vault ──────────────────────
      const { data: vaultDocs } = await supabase
        .from('student_documents')
        .select('file_size_bytes')
        .eq('school_id', schoolId)

      const vaultBytes = (vaultDocs ?? []).reduce(
        (acc, d) => acc + (d.file_size_bytes ?? 0), 0
      )

      // 2. ── Asset manager files ──────────────────────────────────────────
      const { data: assets } = await supabase
        .from('school_assets')
        .select('file_size_bytes')
        .eq('school_id', schoolId)

      const assetBytes = (assets ?? []).reduce(
        (acc, a) => acc + (a.file_size_bytes ?? 0), 0
      )

      // 3. ── School logo + headteacher signature (estimated) ─────────────
      const { data: school } = await supabase
        .from('schools')
        .select('logo_url, headteacher_signature_url, storage_limit_gb')
        .eq('id', schoolId)
        .single()

      const logoBytes = school?.logo_url ? LOGO_ESTIMATE_BYTES : 0
      const sigBytes  = school?.headteacher_signature_url ? 50_000 : 0 // 50 KB est.
      const limitGB   = school?.storage_limit_gb ?? DEFAULT_LIMIT_GB

      // 4. ── Database row footprint estimation ───────────────────────────
      const [
        { count: studentCount },
        { count: teacherCount },
        { count: paymentCount },
        { count: messageCount },
        { count: reportCount  },
      ] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }).eq('school_id', schoolId),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('school_id', schoolId),
        supabase.from('fee_payments').select('*', { count: 'exact', head: true }).eq('school_id', schoolId),
        supabase.from('chat_messages').select('*', { count: 'exact', head: true })
          .in('conversation_id',
            (await supabase.from('chat_members').select('conversation_id')
              .in('user_id',
                (await supabase.from('users').select('id').eq('school_id', schoolId)).data?.map(u => u.id) ?? []
              )
            ).data?.map(r => r.conversation_id) ?? []
          ),
        supabase.from('report_cards').select('*', { count: 'exact', head: true }).eq('school_id', schoolId),
      ])

      const dbFootprintBytes =
        (studentCount ?? 0) * BYTES_PER_STUDENT +
        (teacherCount ?? 0) * BYTES_PER_TEACHER +
        (paymentCount ?? 0) * BYTES_PER_PAYMENT +
        (messageCount ?? 0) * BYTES_PER_MESSAGE +
        (reportCount  ?? 0) * BYTES_PER_REPORT_ROW

      // 5. ── Grand total ─────────────────────────────────────────────────
      const totalBytes = vaultBytes + assetBytes + logoBytes + sigBytes + dbFootprintBytes
      const limitBytes = limitGB * 1024 ** 3
      const percentUsed = Math.min(100, (totalBytes / limitBytes) * 100)

      // 6. ── Persist to school row so Super Admin can see it too ─────────
      await supabase
        .from('schools')
        .update({ storage_used_bytes: totalBytes })
        .eq('id', schoolId)

      setState({
        vaultBytes, assetBytes, logoBytes: logoBytes + sigBytes,
        dbFootprintBytes, totalBytes, limitGB, percentUsed, loading: false
      })
    } catch {
      setState(s => ({ ...s, loading: false }))
    }
  }, [schoolId])

  useEffect(() => {
    calculate()
    // Recalculate every 5 minutes while the admin is logged in
    const interval = setInterval(calculate, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [calculate])

  return state
}
