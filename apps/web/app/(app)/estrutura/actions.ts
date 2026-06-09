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

export async function createOrganization(formData: FormData) {
  const { holdingId, supabase } = await ctx()
  const name = String(formData.get('name') ?? '').trim()
  if (!holdingId || !name) return
  await supabase
    .from('organizations')
    .insert({ holding_id: holdingId, name, slug: `${slugify(name)}-${Date.now().toString(36)}` } as never)
  revalidatePath('/estrutura')
}

export async function createArea(formData: FormData) {
  const { holdingId, supabase } = await ctx()
  const name = String(formData.get('name') ?? '').trim()
  const organization_id = String(formData.get('organization_id') ?? '')
  if (!holdingId || !name || !organization_id) return
  await supabase.from('areas').insert({ holding_id: holdingId, organization_id, name } as never)
  revalidatePath('/estrutura')
}

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
  revalidatePath('/estrutura')
}

export async function createPerson(formData: FormData) {
  const { holdingId, supabase } = await ctx()
  const full_name = String(formData.get('full_name') ?? '').trim()
  const organization_id = String(formData.get('organization_id') ?? '')
  const role_title = String(formData.get('role_title') ?? '').trim() || null
  const can_delegate = formData.get('can_delegate') === 'on'
  const whatsapp_phone = String(formData.get('whatsapp_phone') ?? '').trim() || null
  if (!holdingId || !full_name || !organization_id) return
  await supabase.from('people').insert({
    holding_id: holdingId,
    organization_id,
    full_name,
    role_title,
    can_delegate,
    whatsapp_phone,
  } as never)
  revalidatePath('/estrutura')
}
