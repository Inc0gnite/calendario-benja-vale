import { cookies } from 'next/headers'
import { createAdminClient } from './supabase'

export type AuthUser = {
  id: string
  name: string
  email: string
  color: string
  token: string
}

const USER_COLOR: Record<string, string> = {
  Benja: '#5DCAA5',
  Vale: '#AFA9EC',
}

export async function getUserFromToken(token?: string): Promise<AuthUser | null> {
  if (!token) return null

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('users')
    .select('id, name, email, secret_token')
    .eq('secret_token', token)
    .single()

  if (!data) return null

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    color: USER_COLOR[data.name] ?? '#5DCAA5',
    token,
  }
}

export async function getUserFromCookie(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  return getUserFromToken(token)
}
