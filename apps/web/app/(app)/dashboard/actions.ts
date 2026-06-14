'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
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

  // Decide o destino JÁ com a nova instância ativa (header x-holding-id), em vez
  // de mandar p/ /tasks e deixar o layout redirecionar de novo — esse encadeamento
  // de redirects após a server action deixava a tela em branco (só refresh resolvia).
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { 'x-holding-id': holdingId } },
      cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
    },
  )
  const sb = supabase as unknown as { rpc: (n: string) => Promise<{ data: unknown }> }
  const [{ data: access }, { data: onb }] = await Promise.all([
    sb.rpc('holding_has_active_access'),
    sb.rpc('my_onboarding'),
  ])
  if (Array.isArray(onb) && onb.length > 0) redirect('/onboarding')
  if (!access) redirect('/subscription')
  redirect('/tasks')
}

/** Sai da instância ativa e volta para a área inicial (dashboard pessoal + seleção). */
export async function exitInstance() {
  const cookieStore = await cookies()
  cookieStore.delete(ACTIVE_HOLDING_COOKIE)
  redirect('/dashboard')
}
