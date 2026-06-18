import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export interface PublicSchool {
  id: string
  name: string
  slug: string | null
  address: string | null
  logo_url: string | null
  motto: string | null
  description: string | null
  profile_views: number
  profile_likes: number
  profile_followers: number
  school_settings: { school_type: string | null; has_branches: boolean | null }[]
}

/** PostgREST select strings, richest first — used when remote schema varies */
const SCHOOL_SELECT_ATTEMPTS = [
  'id, name, slug, address, logo_url, motto, description, profile_views, profile_likes, profile_followers',
  'id, name, slug, address, logo_url, motto',
  'id, name, address, logo_url',
  'id, name',
] as const

type SchoolRow = Record<string, unknown>

async function fetchSchoolRows(): Promise<SchoolRow[]> {
  let lastError: Error | null = null

  for (const select of SCHOOL_SELECT_ATTEMPTS) {
    const { data, error } = await supabase.from('schools').select(select).order('name')
    if (!error && data) return data as SchoolRow[]
    lastError = error ?? new Error('Failed to load schools')
    console.warn('[directory] schools query failed, trying simpler select:', select, error?.message)
  }

  throw lastError ?? new Error('Failed to load schools')
}

async function fetchDirectoryMeta(): Promise<Map<string, { school_type: string; has_branches: boolean }>> {
  const map = new Map<string, { school_type: string; has_branches: boolean }>()

  const { data: settingsData, error: settingsError } = await supabase
    .from('school_settings')
    .select('school_id, has_branches')

  if (!settingsError && settingsData) {
    for (const row of settingsData) {
      map.set(row.school_id, {
        school_type: 'basic',
        has_branches: !!row.has_branches,
      })
    }
    return map
  }

  if (settingsError) {
    console.warn('[directory] school_settings fallback unavailable:', settingsError.message)
  }

  return map
}

function normalizeSchool(row: SchoolRow, meta: Map<string, { school_type: string; has_branches: boolean }>): PublicSchool {
  const id = String(row.id ?? '')
  const settings = meta.get(id)

  return {
    id,
    name: String(row.name ?? 'School'),
    slug: (row.slug as string | null) ?? null,
    address: (row.address as string | null) ?? null,
    logo_url: (row.logo_url as string | null) ?? null,
    motto: (row.motto as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    profile_views: Number(row.profile_views ?? 0),
    profile_likes: Number(row.profile_likes ?? 0),
    profile_followers: Number(row.profile_followers ?? 0),
    school_settings: [
      {
        school_type: settings?.school_type ?? 'basic',
        has_branches: settings?.has_branches ?? false,
      },
    ],
  }
}

export function filterPublicSchools(schools: PublicSchool[], query: string, typeFilter: string | null) {
  const q = query.trim().toLowerCase()
  return schools.filter((s) => {
    const schoolType = s.school_settings?.[0]?.school_type || 'basic'
    const matchesType = !typeFilter || schoolType === typeFilter
    if (!matchesType) return false
    if (!q) return true
    return (
      (s.name || '').toLowerCase().includes(q) ||
      (s.address || '').toLowerCase().includes(q) ||
      (s.motto || '').toLowerCase().includes(q) ||
      (s.slug || '').toLowerCase().includes(q) ||
      (s.description || '').toLowerCase().includes(q)
    )
  })
}

export function usePublicSchools() {
  return useQuery<PublicSchool[]>({
    queryKey: ['public-schools-directory'],
    queryFn: async () => {
      const [rows, meta] = await Promise.all([fetchSchoolRows(), fetchDirectoryMeta()])
      return rows.map((row) => normalizeSchool(row, meta))
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}
