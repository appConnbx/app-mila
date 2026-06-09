'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createClient, ACTIVE_HOLDING_COOKIE } from '@/lib/supabase/server'

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
  const organization_id = String(formData.get('organization_id') ?? '')
  const email = String(formData.get('email') ?? '').trim() || null
  const role_title = String(formData.get('role_title') ?? '').trim() || null
  const can_delegate = formData.get('can_delegate') === 'on'
  const aliasesRaw = String(formData.get('aliases') ?? '').trim()
  if (!holdingId || !full_name || !organization_id) return

  const { data: inserted } = await supabase
    .from('people')
    .insert({ holding_id: holdingId, organization_id, full_name, email, role_title, can_delegate } as never)
    .select('id')
    .single()

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
