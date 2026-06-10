'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, ACTIVE_HOLDING_COOKIE } from '@/lib/supabase/server'
import { generateTags } from '@/lib/auto-tags'

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

/** Cria um evento-contêiner. Quem cria é o administrador (owner). Data opcional. */
export async function createEvent(formData: FormData) {
  const { supabase, holdingId, me, orgId } = await ctx()
  const name = String(formData.get('name') ?? '').trim()
  const event_date = String(formData.get('event_date') ?? '') || null
  if (!holdingId || !me || !orgId || !name) return

  const { data: ev } = await supabase
    .from('events')
    .insert({ holding_id: holdingId, organization_id: orgId, owner_id: me, name, event_date, status: 'aberto' } as never)
    .select('id')
    .single()
  const eventId = (ev as unknown as { id: string } | null)?.id
  revalidate(eventId)
  if (eventId) redirect(`/eventos/${eventId}`)
}

/** Finaliza o evento (ação do administrador): não aceita mais novas atividades.
 *  As atividades pendentes continuam aparecendo para o responsável concluir. */
export async function finalizeEvent(formData: FormData) {
  const { supabase } = await ctx()
  const id = String(formData.get('id') ?? '')
  if (!id) return
  // RLS (events_update) garante que só o dono/overseer consegue.
  await supabase
    .from('events')
    .update({ status: 'fechado', closed_at: new Date().toISOString() } as never)
    .eq('id', id)
  revalidate(id)
}

/** Adiciona um participante (qualquer pessoa da holding). Só o dono gerencia (RLS). */
export async function addParticipant(formData: FormData) {
  const { supabase, holdingId } = await ctx()
  const event_id = String(formData.get('event_id') ?? '')
  const person_id = String(formData.get('person_id') ?? '')
  if (!holdingId || !event_id || !person_id) return
  await supabase
    .from('event_participants')
    .insert({ holding_id: holdingId, event_id, person_id } as never)
  revalidate(event_id)
}

/** Remove um participante do evento (não apaga as atividades dele). */
export async function removeParticipant(formData: FormData) {
  const { supabase } = await ctx()
  const id = String(formData.get('id') ?? '')
  const event_id = String(formData.get('event_id') ?? '')
  if (!id) return
  await supabase.from('event_participants').delete().eq('id', id)
  revalidate(event_id || undefined)
}

/** Cria uma atividade (demanda) dentro do evento. Responsável entre os participantes/dono.
 *  Permitido enquanto o evento está aberto, para o dono ou participantes (RLS reforça). */
export async function addEventDemand(formData: FormData) {
  const { supabase, holdingId, me } = await ctx()
  const event_id = String(formData.get('event_id') ?? '')
  const title = String(formData.get('title') ?? '').trim()
  const responsible_id = String(formData.get('responsible_id') ?? '')
  const priority = String(formData.get('priority') ?? 'media')
  const due_date = String(formData.get('due_date') ?? '') || null
  const description = String(formData.get('description') ?? '').trim() || null
  if (!holdingId || !me || !event_id || !title || !responsible_id) {
    if (event_id) redirect(`/eventos/${event_id}?error=activity`)
    return
  }

  const tags = generateTags(title, description, priority)
  const { error } = await supabase.from('demands').insert({
    holding_id: holdingId,
    title,
    description,
    responsible_id,
    origin_id: me,
    priority,
    due_date,
    event_id,
    tags,
    visibility: 'private',
    channel: 'web',
  } as never)

  if (error) redirect(`/eventos/${event_id}?error=activity`)
  revalidate(event_id)
}
