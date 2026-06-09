'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createClient, ACTIVE_HOLDING_COOKIE } from '@/lib/supabase/server'

async function ctx() {
  const c = await cookies()
  const holdingId = c.get(ACTIVE_HOLDING_COOKIE)?.value
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  let me: string | undefined
  let orgId: string | undefined
  if (user && holdingId) {
    const { data } = await supabase
      .from('people')
      .select('id, organization_id')
      .eq('auth_user_id', user.id)
      .eq('holding_id', holdingId)
      .limit(1)
    const row = (data as unknown as { id: string; organization_id: string }[] | null)?.[0]
    me = row?.id
    orgId = row?.organization_id
  }
  return { supabase, holdingId, me, orgId }
}

function revalidate(eventId?: string) {
  revalidatePath('/eventos')
  revalidatePath('/demandas')
  if (eventId) revalidatePath(`/eventos/${eventId}`)
}

/** Abre uma sessão de evento e a torna a sessão ativa da pessoa
 *  (novas demandas se vinculam automaticamente — trigger before_demand_insert). */
export async function openEvent(formData: FormData) {
  const { supabase, holdingId, me, orgId } = await ctx()
  const name = String(formData.get('name') ?? '').trim()
  const type = String(formData.get('type') ?? 'outro')
  if (!holdingId || !me || !orgId || !name) return

  const { data: ev } = await supabase
    .from('events')
    .insert({ holding_id: holdingId, organization_id: orgId, owner_id: me, name, type, status: 'aberto' } as never)
    .select('id')
    .single()
  const eventId = (ev as unknown as { id: string } | null)?.id
  if (eventId) {
    await supabase.from('people').update({ active_event_id: eventId } as never).eq('id', me)
  }
  revalidate(eventId)
}

/** Encerra a sessão (fecha o evento e limpa a sessão ativa da pessoa). */
export async function closeEvent(formData: FormData) {
  const { supabase, me } = await ctx()
  const id = String(formData.get('id') ?? '')
  if (!id) return
  await supabase
    .from('events')
    .update({ status: 'fechado', closed_at: new Date().toISOString() } as never)
    .eq('id', id)
  if (me) {
    await supabase
      .from('people')
      .update({ active_event_id: null } as never)
      .eq('id', me)
      .eq('active_event_id', id)
  }
  revalidate(id)
}
