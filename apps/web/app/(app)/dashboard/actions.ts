'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ACTIVE_HOLDING_COOKIE } from '@/lib/supabase/server'

export async function enterInstance(formData: FormData) {
  const holdingId = String(formData.get('holding_id') ?? '')
  if (!holdingId) redirect('/dashboard')

  const cookieStore = await cookies()
  cookieStore.set(ACTIVE_HOLDING_COOKIE, holdingId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })

  redirect('/demandas')
}
