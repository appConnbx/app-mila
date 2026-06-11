'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect('/login?error=' + encodeURIComponent(error.message))
  }

  // Reinicia o relógio de inatividade: um login novo começa sessão limpa, senão
  // o touch_activity do middleware veria o last_activity_at antigo e expiraria na hora.
  const sb = supabase as unknown as { rpc: (n: string) => Promise<unknown> }
  await sb.rpc('start_session')

  redirect('/dashboard')
}
