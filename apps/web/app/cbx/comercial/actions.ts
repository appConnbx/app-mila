'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cbxMe, hasPerm } from '../_lib'

type RpcResult = { ok: boolean; reason?: string; holding_id?: string }
type Rpc = { rpc: (n: string, a: Record<string, unknown>) => Promise<{ data: RpcResult | null }> }

/** Salva o enriquecimento de cadastro do cliente. */
export async function saveProfile(formData: FormData) {
  const holding = String(formData.get('holding_id') ?? '')
  if (!holding) return
  const supabase = await createClient()
  const { data } = await (supabase as unknown as Rpc).rpc('cbx_upsert_client_profile', {
    p_holding: holding,
    p_business_type: String(formData.get('business_type') ?? ''),
    p_country: String(formData.get('country') ?? ''),
    p_state: String(formData.get('state') ?? ''),
    p_city: String(formData.get('city') ?? ''),
    p_contact_name: String(formData.get('contact_name') ?? ''),
    p_contact_email: String(formData.get('contact_email') ?? ''),
    p_contact_phone: String(formData.get('contact_phone') ?? ''),
  })
  revalidatePath(`/cbx/comercial/${holding}`)
  redirect(`/cbx/comercial/${holding}?${data?.ok ? 'ok=perfil' : `err=${data?.reason ?? 'erro'}`}`)
}

/** Registra uma anotação/conversa no histórico do cliente. */
export async function addNote(formData: FormData) {
  const holding = String(formData.get('holding_id') ?? '')
  const body = String(formData.get('body') ?? '').trim()
  if (!holding || !body) return
  const supabase = await createClient()
  const { data } = await (supabase as unknown as Rpc).rpc('cbx_add_client_note', { p_holding: holding, p_body: body })
  revalidatePath(`/cbx/comercial/${holding}`)
  redirect(`/cbx/comercial/${holding}?${data?.ok ? 'ok=nota' : `err=${data?.reason ?? 'erro'}`}`)
}

/** Altera a licença do cliente (planos Hotmart, VIP CONNBX ou limite custom). */
export async function setLicense(formData: FormData) {
  const holding = String(formData.get('holding_id') ?? '')
  const plan = String(formData.get('plan_id') ?? '')
  const seatsRaw = String(formData.get('seats') ?? '').trim()
  if (!holding || !plan) return
  const parsed = parseInt(seatsRaw, 10)
  const seats = seatsRaw === '' || Number.isNaN(parsed) ? null : Math.max(1, parsed)

  const supabase = await createClient()
  const { data } = await (supabase as unknown as Rpc).rpc('admin_set_license', {
    p_holding: holding,
    p_plan_id: plan,
    p_seats: seats,
  })
  revalidatePath(`/cbx/comercial/${holding}`)
  redirect(`/cbx/comercial/${holding}?${data?.ok ? 'ok=licenca' : `err=${data?.reason ?? 'erro'}`}`)
}

/** Ativa/desativa um usuário da instância do cliente (super admin). */
export async function cbxSetUserActive(formData: FormData) {
  const person = String(formData.get('person_id') ?? '')
  const holding = String(formData.get('holding_id') ?? '')
  const active = String(formData.get('active') ?? '') === '1'
  if (!person || !holding) return
  const supabase = await createClient()
  await (supabase as unknown as Rpc).rpc('cbx_set_person_active', { p_person: person, p_active: active })
  revalidatePath(`/cbx/comercial/${holding}`)
  redirect(`/cbx/comercial/${holding}?ok=user`)
}

/** Define/forcaa a senha de um usuário da instância (super admin). Cria o acesso
 *  se a pessoa ainda não tiver login (usa o e-mail dela). */
export async function cbxSetUserPassword(formData: FormData) {
  const person = String(formData.get('person_id') ?? '')
  const holding = String(formData.get('holding_id') ?? '')
  const password = String(formData.get('password') ?? '')
  if (!person || !holding) return
  if (password.length < 6) redirect(`/cbx/comercial/${holding}?err=pwshort`)

  const supabase = await createClient()
  const sb = supabase as unknown as {
    rpc: (n: string, a: Record<string, unknown>) => Promise<{ data: { auth_user_id?: string | null; email?: string | null; forbidden?: boolean } | null }>
  }
  const { data } = await sb.rpc('cbx_person_auth', { p_person: person })
  if (!data || data.forbidden) redirect(`/cbx/comercial/${holding}?err=forbidden`)

  const admin = createAdminClient()
  if (data.auth_user_id) {
    await admin.auth.admin.updateUserById(data.auth_user_id, { password })
  } else if (data.email) {
    const { data: created } = await admin.auth.admin.createUser({ email: data.email, password, email_confirm: true })
    let uid = created?.user?.id ?? null
    if (!uid) {
      const sbAdmin = admin as unknown as { rpc: (n: string, a: Record<string, unknown>) => Promise<{ data: string | null }> }
      const { data: existing } = await sbAdmin.rpc('auth_user_id_by_email', { p_email: data.email })
      uid = existing ?? null
      if (uid) await admin.auth.admin.updateUserById(uid, { password })
    }
    if (uid) await admin.from('people').update({ auth_user_id: uid } as never).eq('id', person)
    else redirect(`/cbx/comercial/${holding}?err=pwfail`)
  } else {
    redirect(`/cbx/comercial/${holding}?err=noemail`)
  }
  revalidatePath(`/cbx/comercial/${holding}`)
  redirect(`/cbx/comercial/${holding}?ok=pw`)
}

/** Cria um cliente manualmente: instância + usuário admin + licença. */
export async function createClientAccount(formData: FormData) {
  const me = await cbxMe()
  if (!hasPerm(me, 'COMERCIAL')) redirect('/cbx/comercial/novo?err=forbidden')

  const name = String(formData.get('name') ?? '').trim()
  const kind = String(formData.get('kind') ?? 'corporate')
  const plan = String(formData.get('plan_id') ?? '')
  const adminEmail = String(formData.get('admin_email') ?? '').trim().toLowerCase()
  const adminName = String(formData.get('admin_name') ?? '').trim()
  const seatsRaw = String(formData.get('seats') ?? '').trim()
  const parsed = parseInt(seatsRaw, 10)
  const seats = seatsRaw === '' || Number.isNaN(parsed) ? null : Math.max(1, parsed)

  if (!name || !plan || !adminEmail) redirect('/cbx/comercial/novo?err=campos')

  // Cadastro manual NÃO define senha: o cliente recebe e-mail para criar a senha
  // e concluir o acesso (mesmo fluxo de Hotmart/Stripe -> /create-password).
  const origin = process.env.APP_BASE_URL || 'https://www.appmila.co'
  const admin = createAdminClient()
  const sbAdmin = admin as unknown as { rpc: (n: string, a: Record<string, unknown>) => Promise<{ data: string | null }> }
  const { data: existing } = await sbAdmin.rpc('auth_user_id_by_email', { p_email: adminEmail })
  let uid = existing ?? null
  if (!uid) {
    // Conta nova: convite por e-mail (Supabase envia o link de definir senha).
    const { data: invited } = await admin.auth.admin.inviteUserByEmail(adminEmail, {
      redirectTo: `${origin}/auth/confirm?next=/create-password`,
    })
    uid = invited?.user?.id ?? null
  }
  if (!uid) redirect('/cbx/comercial/novo?err=auth')

  const supabase = await createClient()
  const { data } = await (supabase as unknown as Rpc).rpc('cbx_create_client', {
    p_name: name,
    p_kind: kind,
    p_plan_id: plan,
    p_admin_email: adminEmail,
    p_admin_name: adminName,
    p_auth_user_id: uid,
    p_seats: seats,
  })
  if (!data?.ok) redirect(`/cbx/comercial/novo?err=${data?.reason ?? 'erro'}`)
  revalidatePath('/cbx/comercial')
  redirect(`/cbx/comercial/${data.holding_id}?ok=criado`)
}
