import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { UserRole } from '@/lib/types'

export const getAuthUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
})

export async function getUserProfile() {
  const data = await getAuthData()
  return data.profile
}

/**
 * Combined data to avoid redundant calls to getUser and profiles table.
 * Memoized per request with React.cache() so Layout + Page + Server Helpers
 * share a single network roundtrip.
 */
export const getAuthData = cache(async () => {
  const user = await getAuthUser()

  if (!user) {
    return { user: null, role: null, profile: null }
  }

  const supabase = await createClient()
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
  }

  let role: UserRole | null = null
  const fromRow = profile?.role
  if (fromRow === 'admin' || fromRow === 'client' || fromRow === 'receptionist') {
    role = fromRow
  } else {
    const fromMeta = user.user_metadata?.role
    if (fromMeta === 'admin' || fromMeta === 'client' || fromMeta === 'receptionist') {
      role = fromMeta
    } else {
      role = 'client'
    }
  }

  return { user, role, profile }
})

/**
 * Deduplicated per-request lookup of the authenticated user's `clients` row.
 */
export const getCurrentClientRecord = cache(async (userId: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  return data
})

/**
 * Rol efectivo alineado con `middleware.ts`: si falla `profiles` (RLS/red), no devolver `null`
 * o los layouts mandan a `/auth/login` con sesión aún válida → bucles y “logout” fantasma.
 */
export async function getUserRole(): Promise<UserRole | null> {
  const data = await getAuthData()
  return data.role
}

export async function isAdmin(): Promise<boolean> {
  const role = await getUserRole()
  return role === 'admin'
}

export async function isClient(): Promise<boolean> {
  const role = await getUserRole()
  return role === 'client'
}

export async function isReceptionist(): Promise<boolean> {
  const role = await getUserRole()
  return role === 'receptionist'
}
