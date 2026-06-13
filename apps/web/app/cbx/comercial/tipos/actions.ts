'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type Rpc = { rpc: (n: string, a: Record<string, unknown>) => Promise<{ data: { ok: boolean; reason?: string } | null }> }

export async function addBusinessType(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim()
  if (!name) return
  const supabase = await createClient()
  const { data } = await (supabase as unknown as Rpc).rpc('cbx_add_business_type', { p_name: name })
  revalidatePath('/cbx/comercial/tipos')
  redirect(`/cbx/comercial/tipos?${data?.ok ? 'ok=add' : `err=${data?.reason ?? 'erro'}`}`)
}

export async function removeBusinessType(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  if (!id) return
  const supabase = await createClient()
  const { data } = await (supabase as unknown as Rpc).rpc('cbx_remove_business_type', { p_id: id })
  revalidatePath('/cbx/comercial/tipos')
  redirect(`/cbx/comercial/tipos?${data?.ok ? 'ok=del' : `err=${data?.reason ?? 'erro'}`}`)
}
