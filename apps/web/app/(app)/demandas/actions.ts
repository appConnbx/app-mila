'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, ACTIVE_HOLDING_COOKIE } from '@/lib/supabase/server'

export async function createDemand(formData: FormData) {
  const cookieStore = await cookies()
  const holdingId = cookieStore.get(ACTIVE_HOLDING_COOKIE)?.value
  if (!holdingId) redirect('/dashboard')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Pessoa do usuário NA instância ativa (origem da demanda).
  const { data: meRows } = await supabase
    .from('people')
    .select('id')
    .eq('auth_user_id', user.id)
    .eq('holding_id', holdingId)
    .limit(1)
  const me = (meRows as unknown as { id: string }[] | null)?.[0]?.id
  if (!me) redirect('/demandas')

  const title = String(formData.get('title') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim() || null
  const responsible_id = String(formData.get('responsible_id') ?? '')
  const priority = String(formData.get('priority') ?? 'media')
  const due_date = String(formData.get('due_date') ?? '') || null
  const event_id = String(formData.get('event_id') ?? '') || null
  if (!title || !responsible_id) redirect('/demandas/nova')

  await supabase.from('demands').insert({
    holding_id: holdingId,
    title,
    description,
    responsible_id,
    origin_id: me,
    priority,
    due_date,
    event_id,
    channel: 'web',
  } as never)

  revalidatePath('/demandas')
  redirect('/demandas')
}
