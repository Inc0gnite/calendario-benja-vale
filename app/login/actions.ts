'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getUserFromToken } from '@/lib/auth'

export async function loginAction(formData: FormData) {
  const token = (formData.get('token') as string)?.trim()
  const user = await getUserFromToken(token)

  if (!user) {
    redirect('/login?error=1')
  }

  const cookieStore = await cookies()
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  })

  redirect('/calendar')
}

export async function logoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete('auth-token')
  redirect('/login')
}
