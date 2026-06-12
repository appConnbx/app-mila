'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cbxMe, hasPerm } from '../_lib'

type RpcResult = { ok: boolean; reason?: string; id?: string; ghost_auth_id?: string }
type Rpc = { rpc: (n: string, a: Record<string, unknown>) => Promise<{ data: RpcResult | null }> }

export async function createTicket(formData: FormData) {
  const holding = String(formData.get('holding_id') ?? '')
  const title = String(formData.get('title') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  const type = String(formData.get('type') ?? 'solicitacao')
  const assignee = String(formData.get('assignee') ?? '') || null
  if (!holding || !title) redirect('/cbx/suporte?err=campos')

  const supabase = await createClient()
  const { data } = await (supabase as unknown as Rpc).rpc('cbx_create_ticket', {
    p_holding: holding,
    p_title: title,
    p_description: description,
    p_type: type,
    p_assignee: assignee,
  })
  revalidatePath('/cbx/suporte')
  if (!data?.ok) redirect(`/cbx/suporte?err=${data?.reason ?? 'erro'}`)
  redirect(`/cbx/suporte/${data.id}?ok=criado`)
}

export async function updateTicket(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  const status = String(formData.get('status') ?? '') || null
  const assignee = String(formData.get('assignee') ?? '') || null
  if (!id) return
  const supabase = await createClient()
  await (supabase as unknown as Rpc).rpc('cbx_update_ticket', { p_id: id, p_status: status, p_assignee: assignee })
  revalidatePath(`/cbx/suporte/${id}`)
  revalidatePath('/cbx/suporte')
  redirect(`/cbx/suporte/${id}?ok=salvo`)
}

export async function addTicketComment(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  const body = String(formData.get('body') ?? '').trim()
  if (!id || !body) return
  const supabase = await createClient()
  await (supabase as unknown as Rpc).rpc('cbx_add_ticket_comment', { p_id: id, p_body: body })
  revalidatePath(`/cbx/suporte/${id}`)
  redirect(`/cbx/suporte/${id}?ok=comentado`)
}

/**
 * Gera o acesso temporário assistido: cria um usuário-fantasma (invisível ao
 * cliente) com e-mail interno + senha definida pelo especialista. Expira pelo
 * TTL escolhido e é revogado automaticamente no logout.
 */
export async function createSupportAccess(formData: FormData) {
  const me = await cbxMe()
  if (!hasPerm(me, 'SUPORTE')) redirect('/cbx/suporte/acessos?err=forbidden')

  const holding = String(formData.get('holding_id') ?? '')
  const password = String(formData.get('password') ?? '')
  const hours = Math.min(Math.max(parseInt(String(formData.get('hours') ?? '4'), 10) || 4, 1), 24)
  if (!holding) redirect('/cbx/suporte/acessos?err=campos')
  if (password.length < 6) redirect('/cbx/suporte/acessos?err=senha')

  const token = Math.random().toString(36).slice(2, 10)
  const ghostEmail = `suporte-${token}@cbx.appmila.co`

  const admin = createAdminClient()
  const { data: created, error } = await admin.auth.admin.createUser({
    email: ghostEmail,
    password,
    email_confirm: true,
  })
  if (error || !created?.user?.id) redirect('/cbx/suporte/acessos?err=auth')
  const uid = created.user.id

  const supabase = await createClient()
  const { data } = await (supabase as unknown as Rpc).rpc('cbx_register_support_access', {
    p_holding: holding,
    p_ghost_auth: uid,
    p_ghost_email: ghostEmail,
    p_hours: hours,
  })
  if (!data?.ok) {
    // rollback do auth órfão se o registro falhar
    await admin.auth.admin.deleteUser(uid).catch(() => undefined)
    redirect(`/cbx/suporte/acessos?err=${data?.reason ?? 'erro'}`)
  }
  revalidatePath('/cbx/suporte/acessos')
  redirect('/cbx/suporte/acessos?ok=criado')
}

/** Revoga um acesso na hora: marca no banco e apaga o usuário de acesso. */
export async function revokeSupportAccess(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  if (!id) return
  const supabase = await createClient()
  const { data } = await (supabase as unknown as Rpc).rpc('cbx_revoke_support_access', { p_id: id })
  if (data?.ok && data.ghost_auth_id) {
    const admin = createAdminClient()
    await admin.auth.admin.deleteUser(data.ghost_auth_id).catch(() => undefined)
  }
  revalidatePath('/cbx/suporte/acessos')
  redirect(`/cbx/suporte/acessos?${data?.ok ? 'ok=revogado' : `err=${data?.reason ?? 'erro'}`}`)
}
