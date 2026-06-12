'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, ACTIVE_HOLDING_COOKIE } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const STRUCTURE_TABLES = { organization: 'organizations', area: 'areas', team: 'teams' } as const
type StructureKind = keyof typeof STRUCTURE_TABLES

function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'org'
  )
}

async function ctx() {
  const c = await cookies()
  const holdingId = c.get(ACTIVE_HOLDING_COOKIE)?.value
  const supabase = await createClient()
  return { holdingId, supabase }
}

function revalidate() {
  revalidatePath('/estrutura', 'layout')
  revalidatePath('/pessoas')
}

// ---------------------------------------------------------------- Logo (foto de perfil)
// Salva a URL pública (já enviada ao storage no cliente) na holding ativa ou
// numa organização dela. RLS garante que só admin do escopo consegue gravar.
export async function setEntityLogo(formData: FormData) {
  const { holdingId, supabase } = await ctx()
  if (!holdingId) return
  const kind = String(formData.get('kind') ?? '')
  const url = String(formData.get('logo_url') ?? '').trim() || null
  if (kind === 'holding') {
    await supabase.from('holdings').update({ logo_url: url } as never).eq('id', holdingId)
  } else if (kind === 'organization') {
    const id = String(formData.get('id') ?? '')
    if (!id) return
    await supabase
      .from('organizations')
      .update({ logo_url: url } as never)
      .eq('id', id)
      .eq('holding_id', holdingId)
  } else {
    return
  }
  revalidate()
}

// ---------------------------------------------------------------- Holding
export async function updateHolding(formData: FormData) {
  const { holdingId, supabase } = await ctx()
  if (!holdingId) return
  const patch = {
    name: String(formData.get('name') ?? '').trim(),
    legal_name: String(formData.get('legal_name') ?? '').trim() || null,
    tax_id: String(formData.get('tax_id') ?? '').trim() || null,
    contact_email: String(formData.get('contact_email') ?? '').trim() || null,
    phone: String(formData.get('phone') ?? '').trim() || null,
    timezone: String(formData.get('timezone') ?? '').trim() || 'America/Sao_Paulo',
    // Idioma padrão da instância (o agente desktop usa; corporativa prevalece).
    language: ['pt-BR', 'en', 'es'].includes(String(formData.get('language')))
      ? String(formData.get('language'))
      : 'pt-BR',
  }
  if (!patch.name) return
  await supabase.from('holdings').update(patch as never).eq('id', holdingId)
  revalidate()
}

// ---------------------------------------------------------------- Organização
export async function createOrganization(formData: FormData) {
  const { holdingId, supabase } = await ctx()
  const name = String(formData.get('name') ?? '').trim()
  if (!holdingId || !name) return
  await supabase
    .from('organizations')
    .insert({ holding_id: holdingId, name, slug: `${slugify(name)}-${Date.now().toString(36)}` } as never)
  revalidate()
}

// ---------------------------------------------------------------- Área
export async function createArea(formData: FormData) {
  const { holdingId, supabase } = await ctx()
  const name = String(formData.get('name') ?? '').trim()
  const organization_id = String(formData.get('organization_id') ?? '')
  if (!holdingId || !name || !organization_id) return
  await supabase.from('areas').insert({ holding_id: holdingId, organization_id, name } as never)
  revalidate()
}

// ---------------------------------------------------------------- Equipe
export async function createTeam(formData: FormData) {
  const { holdingId, supabase } = await ctx()
  const name = String(formData.get('name') ?? '').trim()
  const area_id = String(formData.get('area_id') ?? '')
  if (!holdingId || !name || !area_id) return
  const { data: area } = await supabase
    .from('areas')
    .select('organization_id')
    .eq('id', area_id)
    .single()
  const organization_id = (area as unknown as { organization_id: string } | null)?.organization_id
  if (!organization_id) return
  await supabase.from('teams').insert({ holding_id: holdingId, organization_id, area_id, name } as never)
  revalidate()
}

// ---------------------------------------------------------------- Pessoa
export async function createPerson(formData: FormData) {
  const { holdingId, supabase } = await ctx()
  const full_name = String(formData.get('full_name') ?? '').trim()
  let organization_id = String(formData.get('organization_id') ?? '')
  const email = String(formData.get('email') ?? '').trim() || null
  const role_title = String(formData.get('role_title') ?? '').trim() || null
  const can_delegate = formData.get('can_delegate') === 'on'
  const aliasesRaw = String(formData.get('aliases') ?? '').trim()
  if (!holdingId || !full_name) return

  // Organização é opcional no cadastro: assume a 1ª organização da instância.
  // O vínculo a áreas/equipes é configurado depois.
  if (!organization_id) {
    const { data: defOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('holding_id', holdingId)
      .order('created_at', { ascending: true })
      .limit(1)
    organization_id = (defOrg as unknown as { id: string }[] | null)?.[0]?.id ?? ''
  }
  if (!organization_id) return

  const { data: inserted, error } = await supabase
    .from('people')
    .insert({ holding_id: holdingId, organization_id, full_name, email, role_title, can_delegate } as never)
    .select('id')
    .single()

  // O trigger app.enforce_seat_limit bloqueia além do limite do plano; antes
  // disso a falha era silenciosa (parecia "não cadastra"). Agora avisa.
  if (error) {
    revalidate()
    const seat = /limite/i.test(error.message ?? '')
    redirect(`/estrutura/usuarios?err=${seat ? 'seat_limit' : 'create'}`)
  }

  const personId = (inserted as unknown as { id: string } | null)?.id
  if (personId && aliasesRaw) {
    const rows = aliasesRaw
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean)
      .map((alias) => ({ holding_id: holdingId, person_id: personId, alias }))
    if (rows.length) await supabase.from('person_aliases').insert(rows as never)
  }
  revalidate()
}

export async function addAlias(formData: FormData) {
  const { holdingId, supabase } = await ctx()
  const person_id = String(formData.get('person_id') ?? '')
  const alias = String(formData.get('alias') ?? '').trim()
  if (!holdingId || !person_id || !alias) return
  await supabase.from('person_aliases').insert({ holding_id: holdingId, person_id, alias } as never)
  revalidate()
}

export async function removeAlias(formData: FormData) {
  const { supabase } = await ctx()
  const id = String(formData.get('id') ?? '')
  if (!id) return
  await supabase.from('person_aliases').delete().eq('id', id)
  revalidate()
}

// ---------------------------------------------------------------- Administradores por escopo
export async function assignAdmin(formData: FormData) {
  const { holdingId, supabase } = await ctx()
  const person_id = String(formData.get('person_id') ?? '')
  const role = String(formData.get('role') ?? '')
  const scope_level = String(formData.get('scope_level') ?? '')
  const scope_id = String(formData.get('scope_id') ?? '')
  if (!holdingId || !person_id || !role || !scope_level || !scope_id) return
  await supabase
    .from('memberships')
    .insert({ holding_id: holdingId, person_id, role, scope_level, scope_id } as never)
  revalidate()
}

export async function removeAdmin(formData: FormData) {
  const { supabase } = await ctx()
  const id = String(formData.get('id') ?? '')
  if (!id) return
  await supabase.from('memberships').delete().eq('id', id)
  revalidate()
}

// ---------------------------------------------------------------- Membros da equipe
export async function addTeamMember(formData: FormData) {
  const { holdingId, supabase } = await ctx()
  const team_id = String(formData.get('team_id') ?? '')
  const person_id = String(formData.get('person_id') ?? '')
  if (!holdingId || !team_id || !person_id) return
  await supabase.from('team_members').insert({ holding_id: holdingId, team_id, person_id } as never)
  revalidate()
}

export async function removeTeamMember(formData: FormData) {
  const { supabase } = await ctx()
  const id = String(formData.get('id') ?? '')
  if (!id) return
  await supabase.from('team_members').delete().eq('id', id)
  revalidate()
}

// ---------------------------------------------------------------- Editar estruturas
export async function renameStructure(formData: FormData) {
  const { supabase } = await ctx()
  const kind = String(formData.get('kind') ?? '') as StructureKind
  const id = String(formData.get('id') ?? '')
  const name = String(formData.get('name') ?? '').trim()
  const table = STRUCTURE_TABLES[kind]
  if (!table || !id || !name) return
  await supabase.from(table).update({ name } as never).eq('id', id)
  revalidate()
}

export async function setStructureActive(formData: FormData) {
  const { supabase } = await ctx()
  const kind = String(formData.get('kind') ?? '') as StructureKind
  const id = String(formData.get('id') ?? '')
  const is_active = String(formData.get('active') ?? '') === '1'
  if (!kind || !id) return
  // Desativar cascateia para a estrutura abaixo (áreas/equipes); nunca toca em pessoas.
  const sb = supabase as unknown as { rpc: (n: string, args: Record<string, unknown>) => Promise<unknown> }
  await sb.rpc('set_structure_active', { p_kind: kind, p_id: id, p_active: is_active })
  revalidate()
}

export async function deleteStructure(formData: FormData) {
  const { supabase } = await ctx()
  const kind = String(formData.get('kind') ?? '') as StructureKind
  const id = String(formData.get('id') ?? '')
  const back = String(formData.get('redirect') ?? '/estrutura')
  const table = STRUCTURE_TABLES[kind]
  if (table && id) await supabase.from(table).delete().eq('id', id)
  revalidate()
  redirect(back)
}

// ---------------------------------------------------------------- Usuários (admin da holding)
export async function setPersonActive(formData: FormData) {
  const { supabase } = await ctx()
  const id = String(formData.get('id') ?? '')
  const is_active = String(formData.get('active') ?? '') === '1'
  if (!id) return
  if (is_active) {
    await supabase.from('people').update({ is_active: true } as never).eq('id', id)
  } else {
    // Desativa e reatribui as demandas abertas ao admin da equipe (com observação).
    const sb = supabase as unknown as { rpc: (n: string, args: Record<string, unknown>) => Promise<unknown> }
    await sb.rpc('deactivate_person', { p_id: id })
  }
  revalidate()
}

/** Edita os dados cadastrais da pessoa (admin da holding). */
export async function updatePerson(formData: FormData) {
  const { supabase } = await ctx()
  const id = String(formData.get('id') ?? '')
  if (!id) return
  const patch = {
    full_name: String(formData.get('full_name') ?? '').trim(),
    email: String(formData.get('email') ?? '').trim() || null,
    role_title: String(formData.get('role_title') ?? '').trim() || null,
    can_delegate: formData.get('can_delegate') === 'on',
  }
  if (!patch.full_name) return
  await supabase.from('people').update(patch as never).eq('id', id)
  revalidate()
}

/**
 * Exclui a pessoa. FKs RESTRICT (demands/observations/events) impedem o delete
 * quando há trabalho vinculado — por isso usamos a RPC admin_delete_person, que
 * opcionalmente reatribui o trabalho a outra pessoa antes de excluir.
 */
export async function deletePerson(formData: FormData) {
  const { supabase } = await ctx()
  const id = String(formData.get('id') ?? '')
  const reassign = String(formData.get('reassign_to') ?? '') || null
  if (!id) return
  const sb = supabase as unknown as {
    rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: { ok: boolean; reason?: string } | null }>
  }
  const { data } = await sb.rpc('admin_delete_person', { p_id: id, p_reassign: reassign })
  revalidate()
  if (data?.ok) {
    redirect('/estrutura/usuarios?ok=deleted')
  } else {
    redirect(`/estrutura/usuarios?err=${data?.reason ?? 'delete'}`)
  }
}

export async function setHoldingAdmin(formData: FormData) {
  const { holdingId, supabase } = await ctx()
  const person_id = String(formData.get('person_id') ?? '')
  const make = String(formData.get('make') ?? '') === '1'
  if (!holdingId || !person_id) return
  if (make) {
    await supabase.from('memberships').insert({
      holding_id: holdingId,
      person_id,
      role: 'holding_admin',
      scope_level: 'holding',
      scope_id: holdingId,
    } as never)
  } else {
    await supabase
      .from('memberships')
      .delete()
      .eq('person_id', person_id)
      .eq('role', 'holding_admin')
      .eq('scope_id', holdingId)
  }
  revalidate()
}

export async function sendPasswordReset(formData: FormData) {
  const { supabase } = await ctx()
  const email = String(formData.get('email') ?? '').trim()
  if (!email) return
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: 'https://www.appmila.co/login' })
  revalidate()
}

/**
 * Admin da holding define/forcaa a senha de um usuário (sem e-mail).
 * Cria a conta de acesso se a pessoa ainda não tiver (vincula auth_user_id).
 * Usa o cliente admin (service_role) — exige SUPABASE_SERVICE_ROLE_KEY.
 */
export async function adminSetPassword(formData: FormData) {
  const { holdingId, supabase } = await ctx()
  if (!holdingId) return
  const sb = supabase as unknown as { rpc: (n: string) => Promise<{ data: boolean | null }> }
  const { data: isAdmin } = await sb.rpc('is_holding_admin')
  if (!isAdmin) redirect('/estrutura/usuarios?err=forbidden')

  const personId = String(formData.get('person_id') ?? '')
  const password = String(formData.get('password') ?? '')
  if (!personId) return
  if (password.length < 4) redirect('/estrutura/usuarios?err=pwshort')

  const admin = createAdminClient()
  const { data: person } = await admin.from('people').select('id, holding_id, email, auth_user_id').eq('id', personId).single()
  const p = person as unknown as { id: string; holding_id: string; email: string | null; auth_user_id: string | null } | null
  if (!p || p.holding_id !== holdingId) redirect('/estrutura/usuarios?err=forbidden')
  if (!p!.email) redirect('/estrutura/usuarios?err=noemail')

  if (p!.auth_user_id) {
    await admin.auth.admin.updateUserById(p!.auth_user_id, { password })
  } else {
    const { data: created } = await admin.auth.admin.createUser({ email: p!.email!, password, email_confirm: true })
    let uid = created?.user?.id ?? null
    if (!uid) {
      // e-mail já possui conta auth → recupera o id e atualiza a senha
      const sbAdmin = admin as unknown as { rpc: (n: string, a: Record<string, unknown>) => Promise<{ data: string | null }> }
      const { data: existing } = await sbAdmin.rpc('auth_user_id_by_email', { p_email: p!.email! })
      uid = existing ?? null
      if (uid) await admin.auth.admin.updateUserById(uid, { password })
    }
    if (uid) await admin.from('people').update({ auth_user_id: uid } as never).eq('id', p!.id)
  }
  revalidate()
  redirect('/estrutura/usuarios?ok=pwset')
}
