'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const phone = String(formData.get('phone') ?? '').trim() || null
  const headline = String(formData.get('headline') ?? '').trim() || null
  const avatar_url = String(formData.get('avatar_url') ?? '').trim() || null
  const skills = String(formData.get('skills') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20)

  await supabase
    .from('profiles')
    .upsert({ auth_user_id: user.id, phone, headline, avatar_url, skills, updated_at: new Date().toISOString() } as never)

  revalidatePath('/profile')
  revalidatePath('/dashboard')
}

/**
 * Colaborador corporativo cria sua conta família (VIP CONNBX FAMILY) com um
 * e-mail pessoal. A licença fica atrelada a ele: se sair/for desativado da
 * empresa, a família perde o acesso. É um login separado (e-mail pessoal).
 */
export async function createMyFamily(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name = String(formData.get('name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  const confirm = String(formData.get('confirm') ?? '')
  if (!name || !email) redirect('/profile?famErr=campos')
  if (password.length < 6) redirect('/profile?famErr=senha')
  if (password !== confirm) redirect('/profile?famErr=confirm')

  const sb = supabase as unknown as {
    rpc: (n: string) => Promise<{ data: { person_id: string | null; is_corporate: boolean; family_holding: string | null } | null }>
  }
  const { data: status } = await sb.rpc('my_sponsored_family_status')
  if (!status?.is_corporate || !status.person_id) redirect('/profile?famErr=notcorp')
  if (status.family_holding) redirect('/profile?famErr=exists')

  const admin = createAdminClient()
  const { data: created } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
  let uid = created?.user?.id ?? null
  if (!uid) {
    // e-mail já tem conta: reaproveita o id (sem trocar a senha existente)
    const sbAdmin = admin as unknown as { rpc: (n: string, a: Record<string, unknown>) => Promise<{ data: string | null }> }
    const { data: existing } = await sbAdmin.rpc('auth_user_id_by_email', { p_email: email })
    uid = existing ?? null
  }
  if (!uid) redirect('/profile?famErr=auth')

  const sbProv = admin as unknown as {
    rpc: (n: string, a: Record<string, unknown>) => Promise<{ data: { ok: boolean; reason?: string } | null }>
  }
  const { data: prov } = await sbProv.rpc('provision_sponsored_family', {
    p_sponsor_person: status.person_id, p_name: name, p_email: email, p_auth_user_id: uid,
  })
  if (!prov?.ok) redirect(`/profile?famErr=${prov?.reason ?? 'generico'}`)
  revalidatePath('/profile')
  redirect('/profile?famOk=1')
}
