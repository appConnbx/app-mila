'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient, ACTIVE_HOLDING_COOKIE } from '@/lib/supabase/server'

/** Conclui (ou pula) o onboarding: marca a holding e leva ao app. */
export async function finishOnboarding() {
  const holdingId = (await cookies()).get(ACTIVE_HOLDING_COOKIE)?.value
  if (!holdingId) redirect('/dashboard')
  const supabase = await createClient()
  // RLS holdings_update: só holding_admin altera (quem está no onboarding é admin).
  await supabase.from('holdings').update({ onboarding_done: true } as never).eq('id', holdingId)
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
