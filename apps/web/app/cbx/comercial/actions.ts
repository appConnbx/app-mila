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
  await (supabase as unknown as Rpc).rpc('cbx_add_client_note', { p_holding: holding, p_body: body })
  revalidatePath(`/cbx/comercial/${holding}`)
  redirect(`/cbx/comercial/${holding}?ok=nota`)
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

/** Cria um cliente manualmente: instância + usuário admin + licença. */
export async function createClientAccount(formData: FormData) {
  const me = await cbxMe()
  if (!hasPerm(me, 'COMERCIAL')) redirect('/cbx/comercial/novo?err=forbidden')

  const name = String(formData.get('name') ?? '').trim()
  const kind = String(formData.get('kind') ?? 'corporate')
  const plan = String(formData.get('plan_id') ?? '')
  const adminEmail = String(formData.get('admin_email') ?? '').trim().toLowerCase()
  const adminName = String(formData.get('admin_name') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const seatsRaw = String(formData.get('seats') ?? '').trim()
  const parsed = parseInt(seatsRaw, 10)
  const seats = seatsRaw === '' || Number.isNaN(parsed) ? null : Math.max(1, parsed)

  if (!name || !plan || !adminEmail) redirect('/cbx/comercial/novo?err=campos')
  if (password.length < 6) redirect('/cbx/comercial/novo?err=senha')

  const admin = createAdminClient()
  const { data: created } = await admin.auth.admin.createUser({ email: adminEmail, password, email_confirm: true })
  let uid = created?.user?.id ?? null
  if (!uid) {
    // E-mail já cadastrado: reaproveita a conta existente sem trocar a senha.
    const sbAdmin = admin as unknown as { rpc: (n: string, a: Record<string, unknown>) => Promise<{ data: string | null }> }
    const { data: existing } = await sbAdmin.rpc('auth_user_id_by_email', { p_email: adminEmail })
    uid = existing ?? null
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
